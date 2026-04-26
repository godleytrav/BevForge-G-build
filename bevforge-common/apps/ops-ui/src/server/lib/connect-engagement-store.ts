import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const STORE_SCHEMA_VERSION = "0.1.0";
const RECORD_SCHEMA_VERSION = "1.0.0";

export interface ConnectCampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
}

export interface ConnectCampaign {
  schemaVersion: string;
  id: string;
  name: string;
  status:
    | "draft"
    | "scheduled"
    | "running"
    | "paused"
    | "completed"
    | "canceled";
  channel: "email" | "sms" | "internal";
  audienceLabel: string;
  audienceOpsAccountIds?: string[];
  ownerId: string;
  subject?: string;
  content: string;
  scheduledFor?: string;
  launchedAt?: string;
  completedAt?: string;
  metrics: ConnectCampaignMetrics;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectTimesheetEntry {
  schemaVersion: string;
  id: string;
  employeeId: string;
  siteId?: string;
  status: "open" | "submitted" | "approved" | "rejected";
  clockInAt: string;
  clockOutAt?: string;
  breakMinutes: number;
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedById?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ConnectCampaignsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  campaigns: ConnectCampaign[];
}

interface ConnectTimesheetsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  entries: ConnectTimesheetEntry[];
}

export interface CreateConnectCampaignInput {
  id?: string;
  name: string;
  status?: ConnectCampaign["status"];
  channel?: ConnectCampaign["channel"];
  audienceLabel: string;
  audienceOpsAccountIds?: string[];
  ownerId: string;
  subject?: string;
  content: string;
  scheduledFor?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateConnectCampaignStatusInput {
  status: ConnectCampaign["status"];
}

export interface CreateConnectTimesheetEntryInput {
  id?: string;
  employeeId: string;
  siteId?: string;
  clockInAt?: string;
  breakMinutes?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ClockOutConnectTimesheetEntryInput {
  clockOutAt?: string;
  breakMinutes?: number;
  notes?: string;
}

export interface UpdateConnectTimesheetStatusInput {
  status: ConnectTimesheetEntry["status"];
  reviewerId?: string;
}

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "apps", "ops-ui"))) {
    return cwd;
  }
  if (cwd.endsWith(path.join("apps", "ops-ui"))) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const connectRoot = path.join(repoRoot, "commissioning", "connect");

const connectPaths = {
  root: connectRoot,
  campaignsFile: path.join(connectRoot, "campaigns.json"),
  timesheetsFile: path.join(connectRoot, "timesheets.json"),
};

const CAMPAIGN_STATUSES = new Set<ConnectCampaign["status"]>([
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "canceled",
]);

const CAMPAIGN_CHANNELS = new Set<ConnectCampaign["channel"]>([
  "email",
  "sms",
  "internal",
]);

const TIMESHEET_STATUSES = new Set<ConnectTimesheetEntry["status"]>([
  "open",
  "submitted",
  "approved",
  "rejected",
]);

const nowIso = () => new Date().toISOString();

const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureDirectory = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const readJsonOrDefault = async <T>(
  filePath: string,
  fallback: T,
): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown) => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const ensureFile = async <T>(
  filePath: string,
  initialData: T,
): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    await writeJson(filePath, initialData);
  }
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toRequiredString = (value: unknown, fieldName: string): string => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value
    .map((entry) => toOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));
  return normalized.length > 0 ? normalized : undefined;
};

const toMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
};

const toIsoDateTimeOptional = (
  value: unknown,
  fieldName: string,
): string | undefined => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsed.toISOString();
};

const toStatus = <T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
  fieldName: string,
): T => {
  if (typeof value === "string" && allowed.has(value as T)) {
    return value as T;
  }
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  throw new Error(`Invalid ${fieldName}`);
};

const toNumberValue = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const sortByUpdatedAtDesc = <T extends { updatedAt?: string }>(
  rows: T[],
): T[] =>
  [...rows].sort((a, b) => {
    const left = a.updatedAt ? new Date(a.updatedAt).valueOf() : 0;
    const right = b.updatedAt ? new Date(b.updatedAt).valueOf() : 0;
    return right - left;
  });

const defaultCampaignsState = (): ConnectCampaignsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-campaigns",
  updatedAt: nowIso(),
  campaigns: [],
});

const defaultTimesheetsState = (): ConnectTimesheetsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-timesheets",
  updatedAt: nowIso(),
  entries: [],
});

export const ensureConnectEngagementStore = async (): Promise<void> => {
  await ensureDirectory(connectPaths.root);
  await Promise.all([
    ensureFile(connectPaths.campaignsFile, defaultCampaignsState()),
    ensureFile(connectPaths.timesheetsFile, defaultTimesheetsState()),
  ]);
};

const readCampaignsState = async (): Promise<ConnectCampaignsState> => {
  await ensureConnectEngagementStore();
  const state = await readJsonOrDefault<ConnectCampaignsState>(
    connectPaths.campaignsFile,
    defaultCampaignsState(),
  );
  return {
    ...defaultCampaignsState(),
    ...state,
    campaigns: Array.isArray(state.campaigns) ? state.campaigns : [],
  };
};

const readTimesheetsState = async (): Promise<ConnectTimesheetsState> => {
  await ensureConnectEngagementStore();
  const state = await readJsonOrDefault<ConnectTimesheetsState>(
    connectPaths.timesheetsFile,
    defaultTimesheetsState(),
  );
  return {
    ...defaultTimesheetsState(),
    ...state,
    entries: Array.isArray(state.entries) ? state.entries : [],
  };
};

const writeCampaignsState = async (
  state: ConnectCampaignsState,
): Promise<void> => {
  await writeJson(connectPaths.campaignsFile, state);
};

const writeTimesheetsState = async (
  state: ConnectTimesheetsState,
): Promise<void> => {
  await writeJson(connectPaths.timesheetsFile, state);
};

const sanitizeCampaignMetrics = (value: unknown): ConnectCampaignMetrics => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
    };
  }

  const row = value as Record<string, unknown>;
  return {
    sent: Math.max(0, toNumberValue(row.sent, 0)),
    delivered: Math.max(0, toNumberValue(row.delivered, 0)),
    opened: Math.max(0, toNumberValue(row.opened, 0)),
    clicked: Math.max(0, toNumberValue(row.clicked, 0)),
    replied: Math.max(0, toNumberValue(row.replied, 0)),
  };
};

export const listConnectCampaigns = async (): Promise<ConnectCampaign[]> => {
  const state = await readCampaignsState();
  return sortByUpdatedAtDesc(state.campaigns);
};

export const createConnectCampaign = async (
  input: CreateConnectCampaignInput,
): Promise<ConnectCampaign> => {
  const name = toRequiredString(input.name, "name");
  const audienceLabel = toRequiredString(input.audienceLabel, "audienceLabel");
  const ownerId = toRequiredString(input.ownerId, "ownerId");
  const content = toRequiredString(input.content, "content");
  const now = nowIso();

  const campaign: ConnectCampaign = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(input.id) ?? createId("campaign"),
    name,
    status: toStatus(input.status, CAMPAIGN_STATUSES, "draft", "status"),
    channel: toStatus(input.channel, CAMPAIGN_CHANNELS, "email", "channel"),
    audienceLabel,
    audienceOpsAccountIds: toStringArray(input.audienceOpsAccountIds),
    ownerId,
    subject: toOptionalString(input.subject),
    content,
    scheduledFor: toIsoDateTimeOptional(input.scheduledFor, "scheduledFor"),
    metrics: sanitizeCampaignMetrics(undefined),
    metadata: toMetadata(input.metadata),
    createdAt: now,
    updatedAt: now,
  };

  const state = await readCampaignsState();
  const nextCampaigns = sortByUpdatedAtDesc([
    campaign,
    ...state.campaigns.filter((existing) => existing.id !== campaign.id),
  ]);

  await writeCampaignsState({
    ...state,
    updatedAt: now,
    campaigns: nextCampaigns,
  });

  return campaign;
};

export const updateConnectCampaignStatus = async (
  campaignId: string,
  input: UpdateConnectCampaignStatusInput,
): Promise<ConnectCampaign | null> => {
  const normalizedCampaignId = toRequiredString(campaignId, "campaignId");
  const status = toStatus(input.status, CAMPAIGN_STATUSES, "draft", "status");
  const state = await readCampaignsState();
  const existing = state.campaigns.find(
    (campaign) => campaign.id === normalizedCampaignId,
  );

  if (!existing) {
    return null;
  }

  const now = nowIso();
  const updated: ConnectCampaign = {
    ...existing,
    status,
    launchedAt:
      status === "running" ? (existing.launchedAt ?? now) : existing.launchedAt,
    completedAt:
      status === "completed" || status === "canceled"
        ? (existing.completedAt ?? now)
        : undefined,
    updatedAt: now,
  };

  const nextCampaigns = sortByUpdatedAtDesc([
    updated,
    ...state.campaigns.filter(
      (campaign) => campaign.id !== normalizedCampaignId,
    ),
  ]);

  await writeCampaignsState({
    ...state,
    updatedAt: now,
    campaigns: nextCampaigns,
  });

  return updated;
};

export const listConnectTimesheetEntries = async (): Promise<
  ConnectTimesheetEntry[]
> => {
  const state = await readTimesheetsState();
  return sortByUpdatedAtDesc(state.entries);
};

export const createConnectTimesheetEntry = async (
  input: CreateConnectTimesheetEntryInput,
): Promise<ConnectTimesheetEntry> => {
  const employeeId = toRequiredString(input.employeeId, "employeeId");
  const now = nowIso();
  const clockInAt = toIsoDateTimeOptional(input.clockInAt, "clockInAt") ?? now;

  const entry: ConnectTimesheetEntry = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(input.id) ?? createId("timesheet"),
    employeeId,
    siteId: toOptionalString(input.siteId),
    status: "open",
    clockInAt,
    breakMinutes: Math.max(0, toNumberValue(input.breakMinutes, 0)),
    notes: toOptionalString(input.notes),
    metadata: toMetadata(input.metadata),
    createdAt: now,
    updatedAt: now,
  };

  const state = await readTimesheetsState();
  const nextEntries = sortByUpdatedAtDesc([
    entry,
    ...state.entries.filter((existing) => existing.id !== entry.id),
  ]);

  await writeTimesheetsState({
    ...state,
    updatedAt: now,
    entries: nextEntries,
  });

  return entry;
};

export const clockOutConnectTimesheetEntry = async (
  entryId: string,
  input: ClockOutConnectTimesheetEntryInput,
): Promise<ConnectTimesheetEntry | null> => {
  const normalizedEntryId = toRequiredString(entryId, "entryId");
  const state = await readTimesheetsState();
  const existing = state.entries.find(
    (entry) => entry.id === normalizedEntryId,
  );

  if (!existing) {
    return null;
  }

  const now = nowIso();
  const updated: ConnectTimesheetEntry = {
    ...existing,
    clockOutAt: toIsoDateTimeOptional(input.clockOutAt, "clockOutAt") ?? now,
    breakMinutes: Math.max(
      0,
      toNumberValue(input.breakMinutes, existing.breakMinutes ?? 0),
    ),
    notes: toOptionalString(input.notes) ?? existing.notes,
    updatedAt: now,
  };

  const nextEntries = sortByUpdatedAtDesc([
    updated,
    ...state.entries.filter((entry) => entry.id !== normalizedEntryId),
  ]);

  await writeTimesheetsState({
    ...state,
    updatedAt: now,
    entries: nextEntries,
  });

  return updated;
};

export const updateConnectTimesheetStatus = async (
  entryId: string,
  input: UpdateConnectTimesheetStatusInput,
): Promise<ConnectTimesheetEntry | null> => {
  const normalizedEntryId = toRequiredString(entryId, "entryId");
  const status = toStatus(input.status, TIMESHEET_STATUSES, "open", "status");
  const reviewerId = toOptionalString(input.reviewerId);
  const state = await readTimesheetsState();
  const existing = state.entries.find(
    (entry) => entry.id === normalizedEntryId,
  );

  if (!existing) {
    return null;
  }

  const now = nowIso();
  const updated: ConnectTimesheetEntry = {
    ...existing,
    status,
    submittedAt:
      status === "submitted"
        ? (existing.submittedAt ?? now)
        : existing.submittedAt,
    approvedAt:
      status === "approved" || status === "rejected"
        ? (existing.approvedAt ?? now)
        : undefined,
    approvedById:
      status === "approved" || status === "rejected"
        ? (reviewerId ?? existing.approvedById)
        : undefined,
    updatedAt: now,
  };

  const nextEntries = sortByUpdatedAtDesc([
    updated,
    ...state.entries.filter((entry) => entry.id !== normalizedEntryId),
  ]);

  await writeTimesheetsState({
    ...state,
    updatedAt: now,
    entries: nextEntries,
  });

  return updated;
};
