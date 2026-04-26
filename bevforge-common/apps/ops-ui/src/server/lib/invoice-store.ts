import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const INVOICE_SCHEMA_VERSION = '1.0.0';

interface OpsInvoiceStateRecord {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  invoices: unknown[];
}

const nowIso = (): string => new Date().toISOString();

const defaultState = (): OpsInvoiceStateRecord => ({
  schemaVersion: INVOICE_SCHEMA_VERSION,
  id: 'ops-invoices',
  updatedAt: nowIso(),
  invoices: [],
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
const invoiceStateFile = path.join(opsRoot, 'invoices.json');

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(invoiceStateFile);
  } catch {
    await writeJson(invoiceStateFile, defaultState());
  }
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeState = (value: unknown): OpsInvoiceStateRecord => {
  const row = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    schemaVersion: INVOICE_SCHEMA_VERSION,
    id: 'ops-invoices',
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : nowIso(),
    invoices: toArray(row.invoices),
  };
};

export const readOpsInvoiceState = async (): Promise<OpsInvoiceStateRecord> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(invoiceStateFile, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
};

export const writeOpsInvoiceState = async (value: unknown): Promise<OpsInvoiceStateRecord> => {
  const nextState = normalizeState(value);
  nextState.updatedAt = nowIso();
  await writeJson(invoiceStateFile, nextState);
  return nextState;
};
