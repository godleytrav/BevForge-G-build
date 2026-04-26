import fs from 'node:fs/promises';
import {
  commissioningPaths,
  ensureCommissioningStore,
  readRecipeRunsState,
} from './commissioning-store.js';

const nowIso = () => new Date().toISOString();

const toOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

export interface RecipeRunboardProfile {
  runId: string;
  targetOg?: number;
  targetFg?: number;
  targetAbvPct?: number;
  notes?: string;
  updatedAt: string;
}

interface RecipeRunboardProfilesState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  profiles: RecipeRunboardProfile[];
}

const defaultState = (): RecipeRunboardProfilesState => ({
  schemaVersion: '0.1.0',
  id: 'recipe-runboard-profiles',
  updatedAt: nowIso(),
  profiles: [],
});

const normalizeProfile = (value: unknown): RecipeRunboardProfile | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const runId = toOptionalText(raw.runId);
  if (!runId) return null;
  return {
    runId,
    targetOg: toOptionalNumber(raw.targetOg),
    targetFg: toOptionalNumber(raw.targetFg),
    targetAbvPct: toOptionalNumber(raw.targetAbvPct),
    notes: toOptionalText(raw.notes),
    updatedAt: toOptionalText(raw.updatedAt) ?? nowIso(),
  };
};

const readState = async (): Promise<RecipeRunboardProfilesState> => {
  await ensureCommissioningStore();
  try {
    const raw = await fs.readFile(commissioningPaths.recipeRunboardProfilesFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<RecipeRunboardProfilesState>;
    return {
      schemaVersion: parsed.schemaVersion ?? '0.1.0',
      id: parsed.id ?? 'recipe-runboard-profiles',
      updatedAt: parsed.updatedAt ?? nowIso(),
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles
            .map((entry) => normalizeProfile(entry))
            .filter((entry): entry is RecipeRunboardProfile => entry !== null)
        : [],
    };
  } catch {
    return defaultState();
  }
};

const writeState = async (
  state: RecipeRunboardProfilesState
): Promise<RecipeRunboardProfilesState> => {
  await ensureCommissioningStore();
  const normalized: RecipeRunboardProfilesState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'recipe-runboard-profiles',
    updatedAt: nowIso(),
    profiles: [...(state.profiles ?? [])].slice(0, 500),
  };
  await fs.writeFile(
    commissioningPaths.recipeRunboardProfilesFile,
    `${JSON.stringify(normalized, null, 2)}\n`,
    'utf8'
  );
  return normalized;
};

export const getRecipeRunboardProfile = async (
  runId: string
): Promise<RecipeRunboardProfile | null> => {
  const normalizedRunId = String(runId ?? '').trim();
  if (!normalizedRunId) return null;
  const state = await readState();
  return state.profiles.find((profile) => profile.runId === normalizedRunId) ?? null;
};

export const upsertRecipeRunboardProfile = async (params: {
  runId: string;
  targetOg?: number | null;
  targetFg?: number | null;
  targetAbvPct?: number | null;
  notes?: string | null;
}): Promise<RecipeRunboardProfile> => {
  const runId = String(params.runId ?? '').trim();
  if (!runId) {
    throw new Error('runId is required.');
  }

  const runs = await readRecipeRunsState();
  const exists = (runs.runs ?? []).some((run) => run.runId === runId);
  if (!exists) {
    throw new Error(`Recipe run not found: ${runId}`);
  }

  const state = await readState();
  const next: RecipeRunboardProfile = {
    runId,
    targetOg: params.targetOg === null ? undefined : toOptionalNumber(params.targetOg),
    targetFg: params.targetFg === null ? undefined : toOptionalNumber(params.targetFg),
    targetAbvPct:
      params.targetAbvPct === null ? undefined : toOptionalNumber(params.targetAbvPct),
    notes: params.notes === null ? undefined : toOptionalText(params.notes),
    updatedAt: nowIso(),
  };

  const idx = state.profiles.findIndex((profile) => profile.runId === runId);
  const profiles = [...state.profiles];
  if (idx >= 0) {
    profiles[idx] = {
      ...profiles[idx],
      ...next,
      updatedAt: nowIso(),
    };
  } else {
    profiles.unshift(next);
  }

  await writeState({
    ...state,
    profiles,
  });
  const saved = await getRecipeRunboardProfile(runId);
  return saved ?? next;
};
