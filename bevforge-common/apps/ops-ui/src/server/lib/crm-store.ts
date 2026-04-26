import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const CRM_SCHEMA_VERSION = '1.0.0';

interface OpsCrmStateRecord {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  clients: unknown[];
  leads: unknown[];
  prospects: unknown[];
  tasks: unknown[];
  activities: unknown[];
  visits: unknown[];
  sampleOrders: unknown[];
}

const nowIso = (): string => new Date().toISOString();

const defaultState = (): OpsCrmStateRecord => ({
  schemaVersion: CRM_SCHEMA_VERSION,
  id: 'ops-crm-state',
  updatedAt: nowIso(),
  clients: [],
  leads: [],
  prospects: [],
  tasks: [],
  activities: [],
  visits: [],
  sampleOrders: [],
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
const crmStateFile = path.join(opsRoot, 'crm-state.json');

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(crmStateFile);
  } catch {
    await writeJson(crmStateFile, defaultState());
  }
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeState = (value: unknown): OpsCrmStateRecord => {
  const row = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    schemaVersion: CRM_SCHEMA_VERSION,
    id: 'ops-crm-state',
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : nowIso(),
    clients: toArray(row.clients),
    leads: toArray(row.leads),
    prospects: toArray(row.prospects),
    tasks: toArray(row.tasks),
    activities: toArray(row.activities),
    visits: toArray(row.visits),
    sampleOrders: toArray(row.sampleOrders),
  };
};

export const readOpsCrmState = async (): Promise<OpsCrmStateRecord> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(crmStateFile, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
};

export const writeOpsCrmState = async (value: unknown): Promise<OpsCrmStateRecord> => {
  const nextState = normalizeState(value);
  nextState.updatedAt = nowIso();
  await writeJson(crmStateFile, nextState);
  return nextState;
};
