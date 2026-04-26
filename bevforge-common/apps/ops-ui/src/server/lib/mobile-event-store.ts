import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MOBILE_EVENTS_SCHEMA_VERSION = "1.0.0";

interface OpsMobileSyncedEventRecord {
  id: string;
  type: string;
  summary: string;
  detail?: string;
  routeId?: string;
  stopId?: string;
  siteId?: string;
  accountId?: string;
  truckId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt: string;
  attachment?: {
    id: string;
    fileName: string;
    mimeType: string;
    relativePath: string;
    sizeBytes: number;
  };
}

interface OpsMobileEventsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  events: OpsMobileSyncedEventRecord[];
}

const nowIso = (): string => new Date().toISOString();

const defaultState = (): OpsMobileEventsState => ({
  schemaVersion: MOBILE_EVENTS_SCHEMA_VERSION,
  id: "ops-mobile-events",
  updatedAt: nowIso(),
  events: [],
});

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
const opsRoot = path.join(repoRoot, "commissioning", "ops");
const eventsStateFile = path.join(opsRoot, "mobile-events.json");
const proofFilesRoot = path.join(opsRoot, "documents", "mobile-proofs");

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(eventsStateFile);
  } catch {
    await writeJson(eventsStateFile, defaultState());
  }
};

const readState = async (): Promise<OpsMobileEventsState> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(eventsStateFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<OpsMobileEventsState>;
    return {
      schemaVersion: MOBILE_EVENTS_SCHEMA_VERSION,
      id: "ops-mobile-events",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
      events: Array.isArray(parsed.events) ? parsed.events.filter(Boolean) as OpsMobileSyncedEventRecord[] : [],
    };
  } catch {
    return defaultState();
  }
};

const writeState = async (state: OpsMobileEventsState): Promise<void> => {
  state.updatedAt = nowIso();
  await writeJson(eventsStateFile, state);
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "proof";

const validateMimeType = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "image/jpeg" ||
    normalized === "image/png" ||
    normalized === "image/webp" ||
    normalized === "image/heic" ||
    normalized === "application/pdf"
  ) {
    return normalized;
  }
  throw new Error("Validation: unsupported mobile proof attachment type.");
};

const toBase64Content = (value: string): string => {
  const trimmed = value.trim();
  const commaIndex = trimmed.indexOf(",");
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
};

export const appendOpsMobileSyncedEvent = async (input: {
  type: string;
  summary: string;
  detail?: string;
  routeId?: string;
  stopId?: string;
  siteId?: string;
  accountId?: string;
  truckId?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
  attachment?: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
  };
}): Promise<OpsMobileSyncedEventRecord> => {
  const type = input.type.trim();
  const summary = input.summary.trim();
  if (!type || !summary) {
    throw new Error("Validation: mobile event type and summary are required.");
  }

  const syncedAt = nowIso();
  let attachment: OpsMobileSyncedEventRecord["attachment"];

  if (input.attachment) {
    const mimeType = validateMimeType(input.attachment.mimeType);
    const base64Content = toBase64Content(input.attachment.dataUrl);
    if (!base64Content) {
      throw new Error("Validation: proof attachment content is required.");
    }

    const buffer = Buffer.from(base64Content, "base64");
    if (buffer.length === 0) {
      throw new Error("Validation: proof attachment content is invalid.");
    }

    const extension =
      path.extname(input.attachment.fileName) ||
      (mimeType === "application/pdf" ? ".pdf" : ".jpg");
    const storageName = `${slugify(input.siteId ?? input.stopId ?? input.type)}-${randomUUID()}${extension}`;
    const absolutePath = path.join(proofFilesRoot, storageName);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    attachment = {
      id: `mobile-proof-${randomUUID()}`,
      fileName: input.attachment.fileName,
      mimeType,
      relativePath: path.relative(opsRoot, absolutePath),
      sizeBytes: buffer.length,
    };
  }

  const nextRecord: OpsMobileSyncedEventRecord = {
    id: `ops-mobile-event-${randomUUID()}`,
    type,
    summary,
    detail: input.detail?.trim() || undefined,
    routeId: input.routeId?.trim() || undefined,
    stopId: input.stopId?.trim() || undefined,
    siteId: input.siteId?.trim() || undefined,
    accountId: input.accountId?.trim() || undefined,
    truckId: input.truckId?.trim() || undefined,
    payload: input.payload ?? {},
    createdAt: input.createdAt?.trim() || syncedAt,
    syncedAt,
    attachment,
  };

  const state = await readState();
  state.events = [nextRecord, ...state.events];
  await writeState(state);
  return nextRecord;
};
