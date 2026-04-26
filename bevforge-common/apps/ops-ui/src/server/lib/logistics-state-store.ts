import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const LOGISTICS_SCHEMA_VERSION = '1.0.0';

interface OpsLogisticsStateRecord {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  fleet: unknown[];
  routeProgress: Record<string, unknown>;
  deliveryEvents: unknown[];
  siteProfiles: Record<string, unknown>;
  truckDispatch: Record<string, unknown>;
  truckPlanning: unknown[];
}

const nowIso = (): string => new Date().toISOString();

const defaultState = (): OpsLogisticsStateRecord => ({
  schemaVersion: LOGISTICS_SCHEMA_VERSION,
  id: 'ops-logistics-state',
  updatedAt: nowIso(),
  fleet: [],
  routeProgress: {},
  deliveryEvents: [],
  siteProfiles: {},
  truckDispatch: {},
  truckPlanning: [],
});

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
const logisticsStateFile = path.join(opsRoot, 'logistics-state.json');

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(logisticsStateFile);
  } catch {
    await writeJson(logisticsStateFile, defaultState());
  }
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const normalizeState = (value: unknown): OpsLogisticsStateRecord => {
  const row = toRecord(value);
  return {
    schemaVersion: LOGISTICS_SCHEMA_VERSION,
    id: 'ops-logistics-state',
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : nowIso(),
    fleet: toArray(row.fleet),
    routeProgress: toRecord(row.routeProgress),
    deliveryEvents: toArray(row.deliveryEvents),
    siteProfiles: toRecord(row.siteProfiles),
    truckDispatch: toRecord(row.truckDispatch),
    truckPlanning: toArray(row.truckPlanning),
  };
};

export const readOpsLogisticsState = async (): Promise<OpsLogisticsStateRecord> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(logisticsStateFile, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
};

export const writeOpsLogisticsState = async (
  value: unknown,
): Promise<OpsLogisticsStateRecord> => {
  const nextState = normalizeState(value);
  nextState.updatedAt = nowIso();
  await writeJson(logisticsStateFile, nextState);
  return nextState;
};
