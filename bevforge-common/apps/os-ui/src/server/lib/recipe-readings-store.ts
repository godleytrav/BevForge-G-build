import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import {
  commissioningPaths,
  ensureCommissioningStore,
  readRecipeRunsState,
} from './commissioning-store.js';

const nowIso = () => new Date().toISOString();

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const toOptionalIso = (value: unknown): string | undefined => {
  const text = toOptionalText(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export interface RecipeRunReadingRecord {
  id: string;
  runId: string;
  stepId?: string;
  kind?:
    | 'og'
    | 'fg'
    | 'sg'
    | 'temp'
    | 'ph'
    | 'abv'
    | 'brix'
    | 'ta'
    | 'so2'
    | 'residual_sugar'
    | 'va'
    | 'free_so2'
    | 'total_so2'
    | 'do'
    | 'snapshot'
    | 'note';
  source: 'manual' | 'sensor';
  recordedAt: string;
  temperatureC?: number;
  sg?: number;
  ph?: number;
  abvPct?: number;
  brix?: number;
  titratableAcidityGpl?: number;
  so2Ppm?: number;
  residualSugarGpl?: number;
  volatileAcidityGpl?: number;
  freeSo2Ppm?: number;
  totalSo2Ppm?: number;
  dissolvedOxygenPpm?: number;
  note?: string;
  createdAt: string;
}

export interface RecipeRunReadingsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  readings: RecipeRunReadingRecord[];
}

const defaultRecipeRunReadingsState = (): RecipeRunReadingsState => ({
  schemaVersion: '0.2.0',
  id: 'recipe-run-readings',
  updatedAt: nowIso(),
  readings: [],
});

const normalizeReading = (input: unknown): RecipeRunReadingRecord | null => {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const id = toOptionalText(raw.id);
  const runId = toOptionalText(raw.runId);
  const recordedAt = toOptionalIso(raw.recordedAt);
  const createdAt = toOptionalIso(raw.createdAt);
  if (!id || !runId || !recordedAt || !createdAt) {
    return null;
  }
  const source = String(raw.source ?? '').trim().toLowerCase() === 'sensor' ? 'sensor' : 'manual';
  const kindRaw = String(raw.kind ?? '').trim().toLowerCase();
  const kind =
    kindRaw === 'og' ||
    kindRaw === 'fg' ||
    kindRaw === 'sg' ||
    kindRaw === 'temp' ||
    kindRaw === 'ph' ||
    kindRaw === 'abv' ||
    kindRaw === 'brix' ||
    kindRaw === 'ta' ||
    kindRaw === 'so2' ||
    kindRaw === 'residual_sugar' ||
    kindRaw === 'va' ||
    kindRaw === 'free_so2' ||
    kindRaw === 'total_so2' ||
    kindRaw === 'do' ||
    kindRaw === 'snapshot' ||
    kindRaw === 'note'
      ? (kindRaw as RecipeRunReadingRecord['kind'])
      : undefined;
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
    brix: toOptionalNumber(raw.brix),
    titratableAcidityGpl: toOptionalNumber(raw.titratableAcidityGpl),
    so2Ppm: toOptionalNumber(raw.so2Ppm),
    residualSugarGpl: toOptionalNumber(raw.residualSugarGpl),
    volatileAcidityGpl: toOptionalNumber(raw.volatileAcidityGpl),
    freeSo2Ppm: toOptionalNumber(raw.freeSo2Ppm),
    totalSo2Ppm: toOptionalNumber(raw.totalSo2Ppm),
    dissolvedOxygenPpm: toOptionalNumber(raw.dissolvedOxygenPpm),
    note: toOptionalText(raw.note),
    createdAt,
  };
};

export const readRecipeRunReadingsState = async (): Promise<RecipeRunReadingsState> => {
  await ensureCommissioningStore();
  try {
    const raw = await fs.readFile(commissioningPaths.recipeReadingsFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<RecipeRunReadingsState>;
    const readings = Array.isArray(parsed.readings)
      ? parsed.readings
          .map((entry) => normalizeReading(entry))
          .filter((entry): entry is RecipeRunReadingRecord => entry !== null)
      : [];
    return {
      schemaVersion: parsed.schemaVersion ?? '0.2.0',
      id: parsed.id ?? 'recipe-run-readings',
      updatedAt: parsed.updatedAt ?? nowIso(),
      readings,
    };
  } catch {
    return defaultRecipeRunReadingsState();
  }
};

const writeRecipeRunReadingsState = async (
  state: RecipeRunReadingsState
): Promise<RecipeRunReadingsState> => {
  await ensureCommissioningStore();
  const normalized: RecipeRunReadingsState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.2.0',
    id: state.id ?? 'recipe-run-readings',
    updatedAt: nowIso(),
    readings: [...(state.readings ?? [])]
      .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))
      .slice(0, 5000),
  };
  await fs.writeFile(
    commissioningPaths.recipeReadingsFile,
    `${JSON.stringify(normalized, null, 2)}\n`,
    'utf8'
  );
  return normalized;
};

export const listRecipeRunReadings = async (
  runId: string,
  limit: number = 200
): Promise<RecipeRunReadingRecord[]> => {
  const normalizedRunId = String(runId ?? '').trim();
  if (!normalizedRunId) return [];
  const state = await readRecipeRunReadingsState();
  return state.readings
    .filter((reading) => reading.runId === normalizedRunId)
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))
    .slice(0, Math.max(1, Math.min(500, Math.floor(limit))));
};

export const appendRecipeRunReading = async (params: {
  runId: string;
  stepId?: string;
  kind?: RecipeRunReadingRecord['kind'];
  source?: 'manual' | 'sensor';
  recordedAt?: string;
  temperatureC?: number;
  sg?: number;
  ph?: number;
  abvPct?: number;
  brix?: number;
  titratableAcidityGpl?: number;
  so2Ppm?: number;
  residualSugarGpl?: number;
  volatileAcidityGpl?: number;
  freeSo2Ppm?: number;
  totalSo2Ppm?: number;
  dissolvedOxygenPpm?: number;
  note?: string;
}): Promise<RecipeRunReadingRecord> => {
  const runId = String(params.runId ?? '').trim();
  if (!runId) {
    throw new Error('runId is required.');
  }

  const runState = await readRecipeRunsState();
  const hasRun = (runState.runs ?? []).some((run) => run.runId === runId);
  if (!hasRun) {
    throw new Error(`Recipe run not found: ${runId}`);
  }

  const reading: RecipeRunReadingRecord = {
    id: randomUUID(),
    runId,
    stepId: toOptionalText(params.stepId),
    kind: params.kind,
    source: params.source === 'sensor' ? 'sensor' : 'manual',
    recordedAt: toOptionalIso(params.recordedAt) ?? nowIso(),
    temperatureC: toOptionalNumber(params.temperatureC),
    sg: toOptionalNumber(params.sg),
    ph: toOptionalNumber(params.ph),
    abvPct: toOptionalNumber(params.abvPct),
    brix: toOptionalNumber(params.brix),
    titratableAcidityGpl: toOptionalNumber(params.titratableAcidityGpl),
    so2Ppm: toOptionalNumber(params.so2Ppm),
    residualSugarGpl: toOptionalNumber(params.residualSugarGpl),
    volatileAcidityGpl: toOptionalNumber(params.volatileAcidityGpl),
    freeSo2Ppm: toOptionalNumber(params.freeSo2Ppm),
    totalSo2Ppm: toOptionalNumber(params.totalSo2Ppm),
    dissolvedOxygenPpm: toOptionalNumber(params.dissolvedOxygenPpm),
    note: toOptionalText(params.note),
    createdAt: nowIso(),
  };

  if (
    reading.temperatureC === undefined &&
    reading.sg === undefined &&
    reading.ph === undefined &&
    reading.abvPct === undefined &&
    reading.brix === undefined &&
    reading.titratableAcidityGpl === undefined &&
    reading.so2Ppm === undefined &&
    reading.residualSugarGpl === undefined &&
    reading.volatileAcidityGpl === undefined &&
    reading.freeSo2Ppm === undefined &&
    reading.totalSo2Ppm === undefined &&
    reading.dissolvedOxygenPpm === undefined &&
    !reading.note
  ) {
    throw new Error('At least one reading value or note is required.');
  }

  const state = await readRecipeRunReadingsState();
  await writeRecipeRunReadingsState({
    ...state,
    readings: [reading, ...state.readings],
  });
  return reading;
};
