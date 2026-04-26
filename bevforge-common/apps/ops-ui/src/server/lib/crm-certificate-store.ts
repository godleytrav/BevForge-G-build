import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const CERTIFICATE_SCHEMA_VERSION = '1.0.0';

interface CertificateFileRecord {
  id: string;
  clientId: string;
  fileName: string;
  mimeType: string;
  relativePath: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

interface CertificateStoreState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  certificates: CertificateFileRecord[];
}

const nowIso = (): string => new Date().toISOString();

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
const certificateStoreFile = path.join(opsRoot, 'crm-certificates.json');
const certificateFilesRoot = path.join(opsRoot, 'documents', 'crm-certificates');

const defaultState = (): CertificateStoreState => ({
  schemaVersion: CERTIFICATE_SCHEMA_VERSION,
  id: 'ops-crm-certificates',
  updatedAt: nowIso(),
  certificates: [],
});

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(certificateStoreFile);
  } catch {
    await writeJson(certificateStoreFile, defaultState());
  }
};

const readState = async (): Promise<CertificateStoreState> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(certificateStoreFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CertificateStoreState>;
    const certificates = Array.isArray(parsed.certificates)
      ? parsed.certificates.filter((entry): entry is CertificateFileRecord => {
          return (
            typeof entry === 'object' &&
            entry !== null &&
            typeof entry.id === 'string' &&
            typeof entry.clientId === 'string' &&
            typeof entry.fileName === 'string' &&
            typeof entry.mimeType === 'string' &&
            typeof entry.relativePath === 'string'
          );
        })
      : [];
    return {
      schemaVersion: CERTIFICATE_SCHEMA_VERSION,
      id: 'ops-crm-certificates',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
      certificates,
    };
  } catch {
    return defaultState();
  }
};

const writeState = async (state: CertificateStoreState): Promise<void> => {
  state.updatedAt = nowIso();
  await writeJson(certificateStoreFile, state);
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'certificate';

const toBase64Content = (value: string): string => {
  const trimmed = value.trim();
  const commaIndex = trimmed.indexOf(',');
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
};

const validateMimeType = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'application/pdf' ||
    normalized === 'image/jpeg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp' ||
    normalized === 'image/heic'
  ) {
    return normalized;
  }
  throw new Error('Validation: certificate file type must be PDF or image.');
};

export interface CrmCertificateFilePublicRecord {
  id: string;
  clientId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  contentUrl: string;
}

const toPublicRecord = (record: CertificateFileRecord): CrmCertificateFilePublicRecord => ({
  id: record.id,
  clientId: record.clientId,
  fileName: record.fileName,
  mimeType: record.mimeType,
  sizeBytes: record.sizeBytes,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  contentUrl: `/api/ops/crm/certificates/${encodeURIComponent(record.clientId)}/content`,
});

export const getCrmCertificateFile = async (
  clientId: string
): Promise<CrmCertificateFilePublicRecord | null> => {
  const state = await readState();
  const record = state.certificates.find((entry) => entry.clientId === clientId);
  return record ? toPublicRecord(record) : null;
};

export const getCrmCertificateContent = async (
  clientId: string
): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> => {
  const state = await readState();
  const record = state.certificates.find((entry) => entry.clientId === clientId);
  if (!record) {
    return null;
  }
  const filePath = path.join(opsRoot, record.relativePath);
  const buffer = await fs.readFile(filePath);
  return {
    buffer,
    mimeType: record.mimeType,
    fileName: record.fileName,
  };
};

export const upsertCrmCertificateFile = async (input: {
  clientId: string;
  fileName: string;
  mimeType: string;
  base64Content: string;
}): Promise<CrmCertificateFilePublicRecord> => {
  const clientId = input.clientId.trim();
  if (!clientId) {
    throw new Error('Validation: clientId is required.');
  }
  const fileName = input.fileName.trim();
  if (!fileName) {
    throw new Error('Validation: fileName is required.');
  }
  const mimeType = validateMimeType(input.mimeType);
  const base64Content = toBase64Content(input.base64Content);
  if (!base64Content) {
    throw new Error('Validation: certificate content is required.');
  }

  const buffer = Buffer.from(base64Content, 'base64');
  if (buffer.length === 0) {
    throw new Error('Validation: certificate content is invalid.');
  }

  const state = await readState();
  const now = nowIso();
  const current = state.certificates.find((entry) => entry.clientId === clientId);
  const extension = path.extname(fileName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
  const storageName = `${slugify(clientId)}-${randomUUID()}${extension}`;
  const relativePath = path.relative(
    opsRoot,
    path.join(certificateFilesRoot, storageName)
  );
  const absolutePath = path.join(opsRoot, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  if (current) {
    const existingPath = path.join(opsRoot, current.relativePath);
    if (existingPath !== absolutePath) {
      await fs.rm(existingPath, { force: true });
    }
  }

  const nextRecord: CertificateFileRecord = {
    id: current?.id ?? `crm-cert-${randomUUID()}`,
    clientId,
    fileName,
    mimeType,
    relativePath,
    sizeBytes: buffer.length,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  state.certificates = [
    ...state.certificates.filter((entry) => entry.clientId !== clientId),
    nextRecord,
  ].sort((left, right) => left.clientId.localeCompare(right.clientId));

  await writeState(state);
  return toPublicRecord(nextRecord);
};
