import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createDefaultGoalsScenario,
  recalculateGoalsScenario,
  type GoalsScenario,
  type GoalsScenarioInput,
} from '../../lib/goals-planner';

interface GoalsScenariosState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  activeScenarioId?: string;
  scenarios: GoalsScenario[];
}

const STATE_SCHEMA_VERSION = '1.0.0';

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'ops-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'ops-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const opsRoot = path.join(repoRoot, 'commissioning', 'ops');
const scenariosFile = path.join(opsRoot, 'goals-scenarios.json');

const nowIso = (): string => new Date().toISOString();

const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown): Promise<void> => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const ensureFile = async <T>(filePath: string, initialData: T): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    await writeJson(filePath, initialData);
  }
};

const defaultState = (): GoalsScenariosState => {
  const scenario = createDefaultGoalsScenario('Balanced Phase 1');
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    id: 'ops-goals-scenarios',
    updatedAt: nowIso(),
    activeScenarioId: scenario.id,
    scenarios: [scenario],
  };
};

export const ensureGoalsStore = async (): Promise<void> => {
  await ensureDirectory(opsRoot);
  await ensureFile(scenariosFile, defaultState());
};

const normalizeScenarioList = (scenariosRaw: unknown): GoalsScenario[] => {
  if (!Array.isArray(scenariosRaw)) {
    return [];
  }

  const scenarios = scenariosRaw
    .map((entry) => recalculateGoalsScenario(entry as Partial<GoalsScenarioInput>))
    .filter((entry) => Boolean(entry))
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

  return scenarios;
};

const readState = async (): Promise<GoalsScenariosState> => {
  await ensureGoalsStore();
  const state = await readJsonOrDefault<GoalsScenariosState>(scenariosFile, defaultState());
  const scenarios = normalizeScenarioList(state.scenarios);
  if (scenarios.length === 0) {
    return defaultState();
  }

  const activeScenarioId =
    typeof state.activeScenarioId === 'string' &&
    scenarios.some((scenario) => scenario.id === state.activeScenarioId)
      ? state.activeScenarioId
      : scenarios[0].id;

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    id: 'ops-goals-scenarios',
    updatedAt: typeof state.updatedAt === 'string' ? state.updatedAt : nowIso(),
    activeScenarioId,
    scenarios,
  };
};

const writeState = async (state: GoalsScenariosState): Promise<void> => {
  await writeJson(scenariosFile, state);
};

export const listGoalsScenarios = async (): Promise<GoalsScenariosState> => readState();

export const setActiveGoalsScenario = async (
  activeScenarioId: string
): Promise<GoalsScenariosState> => {
  const state = await readState();
  if (!state.scenarios.some((scenario) => scenario.id === activeScenarioId)) {
    throw new Error('Validation: scenario not found.');
  }
  state.activeScenarioId = activeScenarioId;
  state.updatedAt = nowIso();
  await writeState(state);
  return state;
};

export const upsertGoalsScenario = async (
  input: Partial<GoalsScenarioInput>
): Promise<GoalsScenariosState> => {
  const state = await readState();
  const index = state.scenarios.findIndex(
    (scenario) => typeof input.id === 'string' && scenario.id === input.id
  );

  if (index < 0) {
    const created = recalculateGoalsScenario({
      ...createDefaultGoalsScenario(input.name ?? 'New Scenario'),
      ...input,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    state.scenarios.unshift(created);
    state.activeScenarioId = created.id;
  } else {
    const existing = state.scenarios[index];
    const updated = recalculateGoalsScenario({
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    });
    state.scenarios[index] = updated;
    state.activeScenarioId = updated.id;
  }

  state.scenarios.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  );
  state.updatedAt = nowIso();
  await writeState(state);
  return state;
};

export const duplicateGoalsScenario = async (
  scenarioId: string
): Promise<GoalsScenariosState> => {
  const state = await readState();
  const source = state.scenarios.find((scenario) => scenario.id === scenarioId);
  if (!source) {
    throw new Error('Validation: scenario not found.');
  }

  const duplicate = recalculateGoalsScenario({
    ...source,
    id: `goals-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${source.name} Copy`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  state.scenarios.unshift(duplicate);
  state.activeScenarioId = duplicate.id;
  state.updatedAt = nowIso();
  await writeState(state);
  return state;
};

export const resetGoalsScenario = async (
  scenarioId: string
): Promise<GoalsScenariosState> => {
  const state = await readState();
  const index = state.scenarios.findIndex((scenario) => scenario.id === scenarioId);
  if (index < 0) {
    throw new Error('Validation: scenario not found.');
  }

  const current = state.scenarios[index];
  const reset = recalculateGoalsScenario({
    ...createDefaultGoalsScenario(current.name),
    id: current.id,
    name: current.name,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  });
  state.scenarios[index] = reset;
  state.activeScenarioId = reset.id;
  state.updatedAt = nowIso();
  await writeState(state);
  return state;
};
