import { j as recipeRunner } from '../../../../../../index-BiQ9ukMS.js';
import fs from 'node:fs/promises';
import { r as readRecipeRunsState, e as ensureCommissioningStore, c as commissioningPaths } from '../../../import/POST-B16W0CFH.js';

const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const toOptionalNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const toOptionalText = (value) => {
  if (value === void 0 || value === null) return void 0;
  const next = String(value).trim();
  return next.length > 0 ? next : void 0;
};
const defaultState = () => ({
  schemaVersion: "0.1.0",
  id: "recipe-runboard-profiles",
  updatedAt: nowIso(),
  profiles: []
});
const normalizeProfile = (value) => {
  if (!value || typeof value !== "object") return null;
  const raw = value;
  const runId = toOptionalText(raw.runId);
  if (!runId) return null;
  return {
    runId,
    targetOg: toOptionalNumber(raw.targetOg),
    targetFg: toOptionalNumber(raw.targetFg),
    targetAbvPct: toOptionalNumber(raw.targetAbvPct),
    notes: toOptionalText(raw.notes),
    updatedAt: toOptionalText(raw.updatedAt) ?? nowIso()
  };
};
const readState = async () => {
  await ensureCommissioningStore();
  try {
    const raw = await fs.readFile(commissioningPaths.recipeRunboardProfilesFile, "utf8");
    const parsed = JSON.parse(raw);
    return {
      schemaVersion: parsed.schemaVersion ?? "0.1.0",
      id: parsed.id ?? "recipe-runboard-profiles",
      updatedAt: parsed.updatedAt ?? nowIso(),
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles.map((entry) => normalizeProfile(entry)).filter((entry) => entry !== null) : []
    };
  } catch {
    return defaultState();
  }
};
const writeState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "recipe-runboard-profiles",
    updatedAt: nowIso(),
    profiles: [...state.profiles ?? []].slice(0, 500)
  };
  await fs.writeFile(
    commissioningPaths.recipeRunboardProfilesFile,
    `${JSON.stringify(normalized, null, 2)}
`,
    "utf8"
  );
  return normalized;
};
const getRecipeRunboardProfile = async (runId) => {
  const normalizedRunId = String(runId ?? "").trim();
  if (!normalizedRunId) return null;
  const state = await readState();
  return state.profiles.find((profile) => profile.runId === normalizedRunId) ?? null;
};
const upsertRecipeRunboardProfile = async (params) => {
  const runId = String(params.runId ?? "").trim();
  if (!runId) {
    throw new Error("runId is required.");
  }
  const runs = await readRecipeRunsState();
  const exists = (runs.runs ?? []).some((run) => run.runId === runId);
  if (!exists) {
    throw new Error(`Recipe run not found: ${runId}`);
  }
  const state = await readState();
  const next = {
    runId,
    targetOg: params.targetOg === null ? void 0 : toOptionalNumber(params.targetOg),
    targetFg: params.targetFg === null ? void 0 : toOptionalNumber(params.targetFg),
    targetAbvPct: params.targetAbvPct === null ? void 0 : toOptionalNumber(params.targetAbvPct),
    notes: params.notes === null ? void 0 : toOptionalText(params.notes),
    updatedAt: nowIso()
  };
  const idx = state.profiles.findIndex((profile) => profile.runId === runId);
  const profiles = [...state.profiles];
  if (idx >= 0) {
    profiles[idx] = {
      ...profiles[idx],
      ...next,
      updatedAt: nowIso()
    };
  } else {
    profiles.unshift(next);
  }
  await writeState({
    ...state,
    profiles
  });
  const saved = await getRecipeRunboardProfile(runId);
  return saved ?? next;
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
    const runs = await recipeRunner.snapshot();
    const run = runs.find((entry) => entry.runId === runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: "Run not found."
      });
    }
    const profile = await getRecipeRunboardProfile(runId);
    return res.status(200).json({
      success: true,
      data: {
        run,
        profile
      }
    });
  } catch (error) {
    console.error("Failed to load runboard payload:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load runboard payload."
    });
  }
}

export { handler as h, upsertRecipeRunboardProfile as u };
