import { existsSync } from 'node:fs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DRIVER_AUTH_SCHEMA_VERSION = '1.0.0';
const DRIVER_AUTH_STORE_ID = 'ops-driver-auth';
const DEFAULT_PAIRING_TTL_MINUTES = 15;
const DEFAULT_SESSION_HOURS = 12;
const MIN_PAIRING_TTL_MINUTES = 5;
const MAX_PAIRING_TTL_MINUTES = 120;
const MIN_SESSION_HOURS = 1;
const MAX_SESSION_HOURS = 168;

type DriverRole = 'driver' | 'dispatcher' | 'admin';

interface DriverAccountRecord {
  id: string;
  name: string;
  role: DriverRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DriverPairingCodeRecord {
  id: string;
  driverId: string;
  codeHash: string;
  codeHint: string;
  issuedBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
}

interface DriverTrustedDeviceRecord {
  id: string;
  driverId: string;
  label: string;
  platform?: string;
  registeredAt: string;
  lastSeenAt: string;
  revokedAt?: string;
}

interface DriverSessionRecord {
  id: string;
  driverId: string;
  deviceId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  revokedAt?: string;
}

interface DriverAuthState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  drivers: DriverAccountRecord[];
  pairingCodes: DriverPairingCodeRecord[];
  trustedDevices: DriverTrustedDeviceRecord[];
  sessions: DriverSessionRecord[];
}

export interface DriverPublicRecord {
  id: string;
  name: string;
  role: DriverRole;
  active: boolean;
}

export interface DriverTrustedDevicePublicRecord {
  id: string;
  driverId: string;
  label: string;
  platform?: string;
  registeredAt: string;
  lastSeenAt: string;
  revoked: boolean;
}

export interface DriverSessionPublicRecord {
  id: string;
  driverId: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
}

export interface DriverPairingIssueResult {
  pairingCode: string;
  codeHint: string;
  createdAt: string;
  expiresAt: string;
  driver: DriverPublicRecord;
  warning?: string;
}

export interface DriverPairingExchangeResult {
  sessionToken: string;
  session: DriverSessionPublicRecord;
  driver: DriverPublicRecord;
  device: DriverTrustedDevicePublicRecord;
}

export interface DriverSessionValidationResult {
  session: DriverSessionPublicRecord;
  driver: DriverPublicRecord;
  device: DriverTrustedDevicePublicRecord;
}

interface IssuePairingCodeInput {
  driverId: string;
  driverName?: string;
  issuedBy?: string;
  ttlMinutes?: number;
}

interface ExchangePairingCodeInput {
  pairingCode: string;
  deviceLabel: string;
  platform?: string;
  sessionHours?: number;
}

interface CreateDevDriverSessionInput {
  driverId?: string;
  driverName?: string;
  deviceLabel: string;
  platform?: string;
  sessionHours?: number;
}

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
const authFile = path.join(opsRoot, 'driver-auth.json');

const nowIso = (): string => new Date().toISOString();

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const parseIso = (value: unknown): string | undefined => {
  const text = toOptionalString(value);
  if (!text) {
    return undefined;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.valueOf())) {
    return undefined;
  }
  return parsed.toISOString();
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const hashValue = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const hashesEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
};

const randomId = (prefix: string): string =>
  `${prefix}-${randomBytes(8).toString('hex')}`;

const randomSessionToken = (): string => randomBytes(32).toString('base64url');

const randomPairingCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let value = '';
  for (let index = 0; index < bytes.length; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }
  return value.slice(0, 8);
};

const toDriverRole = (value: unknown): DriverRole | undefined => {
  const text = toOptionalString(value)?.toLowerCase();
  if (!text) {
    return undefined;
  }
  if (text === 'driver' || text === 'dispatcher' || text === 'admin') {
    return text;
  }
  return undefined;
};

const defaultState = (): DriverAuthState => {
  const now = nowIso();
  return {
    schemaVersion: DRIVER_AUTH_SCHEMA_VERSION,
    id: DRIVER_AUTH_STORE_ID,
    updatedAt: now,
    drivers: [
      {
        id: 'driver-demo',
        name: 'Demo Driver',
        role: 'driver',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    pairingCodes: [],
    trustedDevices: [],
    sessions: [],
  };
};

const writeJson = async (filePath: string, data: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(authFile);
  } catch {
    await writeJson(authFile, defaultState());
  }
};

const normalizeDriver = (value: unknown): DriverAccountRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = toOptionalString(record.id);
  const name = toOptionalString(record.name);
  const role = toDriverRole(record.role);
  const createdAt = parseIso(record.createdAt) ?? nowIso();
  const updatedAt = parseIso(record.updatedAt) ?? createdAt;

  if (!id || !name || !role) {
    return null;
  }

  return {
    id,
    name,
    role,
    active: toBoolean(record.active, true),
    createdAt,
    updatedAt,
  };
};

const normalizePairingCode = (value: unknown): DriverPairingCodeRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = toOptionalString(record.id);
  const driverId = toOptionalString(record.driverId);
  const codeHash = toOptionalString(record.codeHash);
  const codeHint = toOptionalString(record.codeHint);
  const issuedBy = toOptionalString(record.issuedBy) ?? 'ops-admin';
  const createdAt = parseIso(record.createdAt) ?? nowIso();
  const expiresAt = parseIso(record.expiresAt);
  const usedAt = parseIso(record.usedAt);
  const revokedAt = parseIso(record.revokedAt);

  if (!id || !driverId || !codeHash || !codeHint || !expiresAt) {
    return null;
  }

  return {
    id,
    driverId,
    codeHash,
    codeHint,
    issuedBy,
    createdAt,
    expiresAt,
    usedAt,
    revokedAt,
  };
};

const normalizeDevice = (value: unknown): DriverTrustedDeviceRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = toOptionalString(record.id);
  const driverId = toOptionalString(record.driverId);
  const label = toOptionalString(record.label);
  const platform = toOptionalString(record.platform);
  const registeredAt = parseIso(record.registeredAt) ?? nowIso();
  const lastSeenAt = parseIso(record.lastSeenAt) ?? registeredAt;
  const revokedAt = parseIso(record.revokedAt);
  if (!id || !driverId || !label) {
    return null;
  }
  return {
    id,
    driverId,
    label,
    platform,
    registeredAt,
    lastSeenAt,
    revokedAt,
  };
};

const normalizeSession = (value: unknown): DriverSessionRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = toOptionalString(record.id);
  const driverId = toOptionalString(record.driverId);
  const deviceId = toOptionalString(record.deviceId);
  const tokenHash = toOptionalString(record.tokenHash);
  const createdAt = parseIso(record.createdAt) ?? nowIso();
  const expiresAt = parseIso(record.expiresAt);
  const lastSeenAt = parseIso(record.lastSeenAt) ?? createdAt;
  const revokedAt = parseIso(record.revokedAt);
  if (!id || !driverId || !deviceId || !tokenHash || !expiresAt) {
    return null;
  }
  return {
    id,
    driverId,
    deviceId,
    tokenHash,
    createdAt,
    expiresAt,
    lastSeenAt,
    revokedAt,
  };
};

const normalizeState = (value: unknown): DriverAuthState => {
  const record = asRecord(value);
  if (!record) {
    return defaultState();
  }

  const updatedAt = parseIso(record.updatedAt) ?? nowIso();
  const drivers = Array.isArray(record.drivers)
    ? record.drivers
        .map((entry) => normalizeDriver(entry))
        .filter((entry): entry is DriverAccountRecord => entry !== null)
    : [];
  const pairingCodes = Array.isArray(record.pairingCodes)
    ? record.pairingCodes
        .map((entry) => normalizePairingCode(entry))
        .filter((entry): entry is DriverPairingCodeRecord => entry !== null)
    : [];
  const trustedDevices = Array.isArray(record.trustedDevices)
    ? record.trustedDevices
        .map((entry) => normalizeDevice(entry))
        .filter((entry): entry is DriverTrustedDeviceRecord => entry !== null)
    : [];
  const sessions = Array.isArray(record.sessions)
    ? record.sessions
        .map((entry) => normalizeSession(entry))
        .filter((entry): entry is DriverSessionRecord => entry !== null)
    : [];

  return {
    schemaVersion: DRIVER_AUTH_SCHEMA_VERSION,
    id: DRIVER_AUTH_STORE_ID,
    updatedAt,
    drivers: drivers.length > 0 ? drivers : defaultState().drivers,
    pairingCodes,
    trustedDevices,
    sessions,
  };
};

const readState = async (): Promise<DriverAuthState> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(authFile, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
};

const writeState = async (state: DriverAuthState): Promise<void> => {
  await writeJson(authFile, {
    ...state,
    updatedAt: nowIso(),
  });
};

const toPublicDriver = (driver: DriverAccountRecord): DriverPublicRecord => ({
  id: driver.id,
  name: driver.name,
  role: driver.role,
  active: driver.active,
});

const toPublicDevice = (device: DriverTrustedDeviceRecord): DriverTrustedDevicePublicRecord => ({
  id: device.id,
  driverId: device.driverId,
  label: device.label,
  platform: device.platform,
  registeredAt: device.registeredAt,
  lastSeenAt: device.lastSeenAt,
  revoked: Boolean(device.revokedAt),
});

const toPublicSession = (session: DriverSessionRecord): DriverSessionPublicRecord => ({
  id: session.id,
  driverId: session.driverId,
  deviceId: session.deviceId,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  lastSeenAt: session.lastSeenAt,
});

const isExpired = (isoDate: string): boolean => new Date(isoDate).valueOf() <= Date.now();

const pruneState = (state: DriverAuthState): DriverAuthState => {
  const prunedPairingCodes = state.pairingCodes.filter(
    (code) => !code.revokedAt && !code.usedAt && !isExpired(code.expiresAt)
  );
  const prunedSessions = state.sessions.filter(
    (session) => !session.revokedAt && !isExpired(session.expiresAt)
  );
  return {
    ...state,
    pairingCodes: prunedPairingCodes,
    sessions: prunedSessions,
  };
};

const adminKeyWarning = (): string | undefined => {
  const configuredKey = process.env.OPS_DRIVER_ADMIN_KEY?.trim();
  if (!configuredKey) {
    return 'OPS_DRIVER_ADMIN_KEY is not set. Change it before production use.';
  }
  return undefined;
};

export const isDriverDevBypassEnabled = (): boolean =>
  process.env.OPS_DRIVER_DEV_BYPASS?.trim().toLowerCase() === 'true';

const upsertDriver = (
  current: DriverAuthState,
  input: {
    driverId: string;
    driverName: string;
    role?: DriverRole;
  }
): DriverAccountRecord => {
  const timestamp = nowIso();
  const role = input.role ?? 'driver';
  const driverIndex = current.drivers.findIndex((driver) => driver.id === input.driverId);

  if (driverIndex >= 0) {
    current.drivers[driverIndex] = {
      ...current.drivers[driverIndex],
      name: input.driverName,
      role,
      active: true,
      updatedAt: timestamp,
    };
    return current.drivers[driverIndex];
  }

  const driver: DriverAccountRecord = {
    id: input.driverId,
    name: input.driverName,
    role,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  current.drivers.push(driver);
  return driver;
};

const createTrustedDeviceSession = (
  current: DriverAuthState,
  input: {
    driver: DriverAccountRecord;
    deviceLabel: string;
    platform?: string;
    sessionHours: number;
  }
): DriverPairingExchangeResult => {
  const now = nowIso();
  const trustedDevice: DriverTrustedDeviceRecord = {
    id: randomId('device'),
    driverId: input.driver.id,
    label: input.deviceLabel,
    platform: input.platform,
    registeredAt: now,
    lastSeenAt: now,
  };
  current.trustedDevices.push(trustedDevice);

  const sessionToken = randomSessionToken();
  const tokenHash = hashValue(sessionToken);
  const expiresAt = new Date(Date.now() + input.sessionHours * 60 * 60 * 1000).toISOString();
  const session: DriverSessionRecord = {
    id: randomId('session'),
    driverId: input.driver.id,
    deviceId: trustedDevice.id,
    tokenHash,
    createdAt: now,
    expiresAt,
    lastSeenAt: now,
  };
  current.sessions.push(session);

  return {
    sessionToken,
    session: toPublicSession(session),
    driver: toPublicDriver(input.driver),
    device: toPublicDevice(trustedDevice),
  };
};

export const isDriverAuthAdminKeyValid = (providedKey: string | undefined): boolean => {
  const expected = process.env.OPS_DRIVER_ADMIN_KEY?.trim() || 'ops-local-admin-change-me';
  const candidate = providedKey?.trim();
  if (!candidate) {
    return false;
  }
  return hashesEqual(hashValue(expected), hashValue(candidate));
};

export const issueDriverPairingCode = async (
  input: IssuePairingCodeInput
): Promise<DriverPairingIssueResult> => {
  const driverId = toOptionalString(input.driverId);
  if (!driverId) {
    throw new Error('Validation: driverId is required.');
  }

  const driverName = toOptionalString(input.driverName) ?? driverId;
  const issuedBy = toOptionalString(input.issuedBy) ?? 'ops-admin';
  const ttlRaw = toNumber(input.ttlMinutes) ?? DEFAULT_PAIRING_TTL_MINUTES;
  const ttlMinutes = clampNumber(
    Math.floor(ttlRaw),
    MIN_PAIRING_TTL_MINUTES,
    MAX_PAIRING_TTL_MINUTES
  );

  const now = Date.now();
  const expiresAt = new Date(now + ttlMinutes * 60_000).toISOString();
  const pairingCode = randomPairingCode();
  const codeHint = pairingCode.slice(-4);
  const codeHash = hashValue(pairingCode);

  const current = pruneState(await readState());
  const driver = upsertDriver(current, {
    driverId,
    driverName,
    role: 'driver',
  });
  const timestamp = nowIso();

  const newCode: DriverPairingCodeRecord = {
    id: randomId('pair'),
    driverId,
    codeHash,
    codeHint,
    issuedBy,
    createdAt: timestamp,
    expiresAt,
  };
  current.pairingCodes.push(newCode);
  await writeState(current);

  return {
    pairingCode,
    codeHint,
    createdAt: newCode.createdAt,
    expiresAt,
    driver: toPublicDriver(driver),
    warning: adminKeyWarning(),
  };
};

export const exchangeDriverPairingCode = async (
  input: ExchangePairingCodeInput
): Promise<DriverPairingExchangeResult> => {
  const pairingCode = toOptionalString(input.pairingCode)?.toUpperCase();
  if (!pairingCode) {
    throw new Error('Validation: pairingCode is required.');
  }
  const deviceLabel = toOptionalString(input.deviceLabel);
  if (!deviceLabel) {
    throw new Error('Validation: deviceLabel is required.');
  }
  const sessionHoursRaw = toNumber(input.sessionHours) ?? DEFAULT_SESSION_HOURS;
  const sessionHours = clampNumber(
    Math.floor(sessionHoursRaw),
    MIN_SESSION_HOURS,
    MAX_SESSION_HOURS
  );
  const platform = toOptionalString(input.platform);

  const current = pruneState(await readState());
  const codeHash = hashValue(pairingCode);
  const code = current.pairingCodes.find(
    (entry) =>
      !entry.usedAt &&
      !entry.revokedAt &&
      !isExpired(entry.expiresAt) &&
      hashesEqual(entry.codeHash, codeHash)
  );
  if (!code) {
    throw new Error('Validation: Pairing code is invalid or expired.');
  }

  const driver = current.drivers.find((entry) => entry.id === code.driverId && entry.active);
  if (!driver) {
    throw new Error('Validation: Driver account is inactive.');
  }

  code.usedAt = nowIso();
  const result = createTrustedDeviceSession(current, {
    driver,
    deviceLabel,
    platform,
    sessionHours,
  });
  await writeState(current);

  return result;
};

export const createDevDriverSession = async (
  input: CreateDevDriverSessionInput
): Promise<DriverPairingExchangeResult> => {
  if (!isDriverDevBypassEnabled()) {
    throw new Error('Unauthorized: dev driver bypass is disabled.');
  }

  const deviceLabel = toOptionalString(input.deviceLabel);
  if (!deviceLabel) {
    throw new Error('Validation: deviceLabel is required.');
  }

  const sessionHoursRaw = toNumber(input.sessionHours) ?? DEFAULT_SESSION_HOURS;
  const sessionHours = clampNumber(
    Math.floor(sessionHoursRaw),
    MIN_SESSION_HOURS,
    MAX_SESSION_HOURS
  );
  const driverId =
    toOptionalString(input.driverId) ??
    process.env.OPS_DRIVER_DEV_BYPASS_DRIVER_ID?.trim() ??
    'driver-owner-dev';
  const driverName =
    toOptionalString(input.driverName) ??
    process.env.OPS_DRIVER_DEV_BYPASS_DRIVER_NAME?.trim() ??
    'Owner Driver';
  const platform = toOptionalString(input.platform);

  const current = pruneState(await readState());
  const driver = upsertDriver(current, {
    driverId,
    driverName,
    role: 'admin',
  });
  const result = createTrustedDeviceSession(current, {
    driver,
    deviceLabel,
    platform,
    sessionHours,
  });
  await writeState(current);
  return result;
};

export const validateDriverSessionToken = async (
  sessionToken: string | undefined
): Promise<DriverSessionValidationResult | null> => {
  const token = toOptionalString(sessionToken);
  if (!token) {
    return null;
  }
  const current = pruneState(await readState());
  const tokenHash = hashValue(token);
  const session = current.sessions.find(
    (entry) =>
      !entry.revokedAt &&
      !isExpired(entry.expiresAt) &&
      hashesEqual(entry.tokenHash, tokenHash)
  );
  if (!session) {
    return null;
  }

  const driver = current.drivers.find((entry) => entry.id === session.driverId && entry.active);
  const device = current.trustedDevices.find(
    (entry) => entry.id === session.deviceId && !entry.revokedAt
  );
  if (!driver || !device) {
    session.revokedAt = nowIso();
    await writeState(current);
    return null;
  }

  const timestamp = nowIso();
  session.lastSeenAt = timestamp;
  device.lastSeenAt = timestamp;
  await writeState(current);

  return {
    session: toPublicSession(session),
    driver: toPublicDriver(driver),
    device: toPublicDevice(device),
  };
};

export const revokeDriverSessionToken = async (
  sessionToken: string | undefined
): Promise<boolean> => {
  const token = toOptionalString(sessionToken);
  if (!token) {
    return false;
  }
  const current = await readState();
  const tokenHash = hashValue(token);
  const session = current.sessions.find((entry) => hashesEqual(entry.tokenHash, tokenHash));
  if (!session || session.revokedAt) {
    return false;
  }
  session.revokedAt = nowIso();
  await writeState(current);
  return true;
};

export const revokeDriverTrustedDevice = async (deviceId: string): Promise<boolean> => {
  const normalizedId = toOptionalString(deviceId);
  if (!normalizedId) {
    return false;
  }
  const current = await readState();
  const device = current.trustedDevices.find((entry) => entry.id === normalizedId);
  if (!device || device.revokedAt) {
    return false;
  }

  const timestamp = nowIso();
  device.revokedAt = timestamp;
  current.sessions.forEach((session) => {
    if (session.deviceId === normalizedId && !session.revokedAt) {
      session.revokedAt = timestamp;
    }
  });
  await writeState(current);
  return true;
};
