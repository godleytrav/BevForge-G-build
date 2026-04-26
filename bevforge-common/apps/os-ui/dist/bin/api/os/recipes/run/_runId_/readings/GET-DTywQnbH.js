import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import { r as readRecipeRunsState, e as ensureCommissioningStore, c as commissioningPaths } from '../../../import/POST-B16W0CFH.js';

const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const toOptionalText = (value) => {
  if (value === void 0 || value === null) return void 0;
  const next = String(value).trim();
  return next.length > 0 ? next : void 0;
};
const toOptionalNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const toOptionalIso = (value) => {
  const text = toOptionalText(value);
  if (!text) return void 0;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return void 0;
  return parsed.toISOString();
};
const defaultRecipeRunReadingsState = () => ({
  schemaVersion: "0.1.0",
  id: "recipe-run-readings",
  updatedAt: nowIso(),
  readings: []
});
const normalizeReading = (input) => {
  if (!input || typeof input !== "object") return null;
  const raw = input;
  const id = toOptionalText(raw.id);
  const runId = toOptionalText(raw.runId);
  const recordedAt = toOptionalIso(raw.recordedAt);
  const createdAt = toOptionalIso(raw.createdAt);
  if (!id || !runId || !recordedAt || !createdAt) {
    return null;
  }
  const source = String(raw.source ?? "").trim().toLowerCase() === "sensor" ? "sensor" : "manual";
  const kindRaw = String(raw.kind ?? "").trim().toLowerCase();
  const kind = kindRaw === "og" || kindRaw === "fg" || kindRaw === "sg" || kindRaw === "temp" || kindRaw === "ph" || kindRaw === "abv" || kindRaw === "snapshot" || kindRaw === "note" ? kindRaw : void 0;
  return {
    id,
    runId,
    stepId: toOptionalText(raw.stepId),
    kind,
    source,
    recordedAt,
    temperatureC: toOptionalNumber(raw.temperatureC),
    sg: toOptionalNumber(raw.sg),
    ph: toOptionalNumber(raw.ph),
    abvPct: toOptionalNumber(raw.abvPct),
    note: toOptionalText(raw.note),
    createdAt
  };
};
const readRecipeRunReadingsState = async () => {
  await ensureCommissioningStore();
  try {
    const raw = await fs.readFile(commissioningPaths.recipeReadingsFile, "utf8");
    const parsed = JSON.parse(raw);
    const readings = Array.isArray(parsed.readings) ? parsed.readings.map((entry) => normalizeReading(entry)).filter((entry) => entry !== null) : [];
    return {
      schemaVersion: parsed.schemaVersion ?? "0.1.0",
      id: parsed.id ?? "recipe-run-readings",
      updatedAt: parsed.updatedAt ?? nowIso(),
      readings
    };
  } catch {
    return defaultRecipeRunReadingsState();
  }
};
const writeRecipeRunReadingsState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "recipe-run-readings",
    updatedAt: nowIso(),
    readings: [...state.readings ?? []].sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt)).slice(0, 5e3)
  };
  await fs.writeFile(
    commissioningPaths.recipeReadingsFile,
    `${JSON.stringify(normalized, null, 2)}
`,
    "utf8"
  );
  return normalized;
};
const listRecipeRunReadings = async (runId, limit = 200) => {
  const normalizedRunId = String(runId ?? "").trim();
  if (!normalizedRunId) return [];
  const state = await readRecipeRunReadingsState();
  return state.readings.filter((reading) => reading.runId === normalizedRunId).sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt)).slice(0, Math.max(1, Math.min(500, Math.floor(limit))));
};
const appendRecipeRunReading = async (params) => {
  const runId = String(params.runId ?? "").trim();
  if (!runId) {
    throw new Error("runId is required.");
  }
  const runState = await readRecipeRunsState();
  const hasRun = (runState.runs ?? []).some((run) => run.runId === runId);
  if (!hasRun) {
    throw new Error(`Recipe run not found: ${runId}`);
  }
  const reading = {
    id: randomUUID(),
    runId,
    stepId: toOptionalText(params.stepId),
    kind: params.kind,
    source: params.source === "sensor" ? "sensor" : "manual",
    recordedAt: toOptionalIso(params.recordedAt) ?? nowIso(),
    temperatureC: toOptionalNumber(params.temperatureC),
    sg: toOptionalNumber(params.sg),
    ph: toOptionalNumber(params.ph),
    abvPct: toOptionalNumber(params.abvPct),
    note: toOptionalText(params.note),
    createdAt: nowIso()
  };
  if (reading.temperatureC === void 0 && reading.sg === void 0 && reading.ph === void 0 && reading.abvPct === void 0 && !reading.note) {
    throw new Error("At least one reading value or note is required.");
  }
  const state = await readRecipeRunReadingsState();
  await writeRecipeRunReadingsState({
    ...state,
    readings: [reading, ...state.readings]
  });
  return reading;
};

async function handler(req, res) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: "runId is required."
      });
    }
    const limitParam = req.query.limit;
    const parsedLimit = Array.isArray(limitParam) ? Number(limitParam[0]) : Number(limitParam);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 200;
    const readings = await listRecipeRunReadings(runId, limit);
    return res.status(200).json({
      success: true,
      data: readings
    });
  } catch (error) {
    console.error("Failed to read recipe run readings:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to read recipe run readings."
    });
  }
}

export { appendRecipeRunReading as a, handler as h };
