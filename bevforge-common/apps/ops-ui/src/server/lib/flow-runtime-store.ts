import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  FlowCatalogProduct,
  FlowTapAssignment,
} from "../../features/flow/catalog-mirror";

const STORE_SCHEMA_VERSION = "0.1.0";
const RECORD_SCHEMA_VERSION = "0.1.0";

export type FlowTapStatus = "online" | "offline" | "maintenance" | "disabled";
export type FlowMeterType = "hall_effect" | "pulse_meter" | "none" | "other";
export type FlowAssignmentStatus = "active" | "empty" | "removed" | "error";
export type FlowSourceMode = "bartender" | "self_serve" | "test" | "maintenance";
export type FlowSessionMode = "self_serve" | "bartender" | "test";
export type FlowSessionStatus = "active" | "paused" | "closed" | "blocked";
export type FlowMenuStatus = "on_tap" | "coming_soon" | "out_of_stock" | "hidden";
export type FlowSyncStatus = "online" | "offline" | "retrying";
export type FlowQueueStatus = "queued" | "sent" | "accepted" | "failed";

export interface FlowTap {
  schemaVersion: string;
  id: string;
  siteId: string;
  name: string;
  displayOrder?: number;
  status: FlowTapStatus;
  meterType: FlowMeterType;
  temperatureProbeId?: string;
  lineTempC?: number;
  flowRateOzPerMin?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlowKegAssignment {
  schemaVersion: string;
  id: string;
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  lotId?: string;
  labelVersionId?: string;
  uom: string;
  startQty: number;
  remainingQty: number;
  status: FlowAssignmentStatus;
  assignedAt: string;
  endedAt?: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface FlowPourEvent {
  schemaVersion: string;
  eventId: string;
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  assignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  labelVersionId?: string;
  volume: number;
  uom: string;
  durationMs?: number;
  sourceMode: FlowSourceMode;
  sessionId?: string;
  actorId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface FlowSession {
  schemaVersion: string;
  id: string;
  siteId: string;
  mode: FlowSessionMode;
  status: FlowSessionStatus;
  customerToken?: string;
  actorId?: string;
  limitQty: number;
  consumedQty: number;
  uom: string;
  allowedTapIds?: string[];
  startedAt: string;
  endedAt?: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface FlowMenuItem {
  schemaVersion: string;
  id: string;
  siteId: string;
  tapAssignmentId?: string;
  tapId?: string;
  productId?: string;
  productCode?: string;
  skuId: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  labelVersionId?: string;
  name: string;
  style?: string;
  abv?: number;
  ibu?: number;
  servingTempC?: number;
  tastingNotes?: string;
  status: FlowMenuStatus;
  story?: string;
  imageUrl?: string;
  imageAssetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlowOutboxItem {
  event: FlowPourEvent;
  queueStatus: FlowQueueStatus;
  retries: number;
  lastAttemptAt?: string;
  lastError?: string;
  osLedgerRef?: string;
}

interface TapsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  taps: FlowTap[];
}

interface AssignmentsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  assignments: FlowKegAssignment[];
}

interface EventsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  events: FlowPourEvent[];
}

interface SessionsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  sessions: FlowSession[];
}

interface MenuItemsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  items: FlowMenuItem[];
}

interface TapAssignmentsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  assignments: FlowTapAssignment[];
}

interface ProductsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  products: FlowCatalogProduct[];
}

interface QueueState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  syncStatus: FlowSyncStatus;
  outbox: FlowOutboxItem[];
}

export interface FlowRuntimeSnapshot {
  taps: FlowTap[];
  assignments: FlowKegAssignment[];
  events: FlowPourEvent[];
  sessions: FlowSession[];
  menuItems: FlowMenuItem[];
  tapAssignments: FlowTapAssignment[];
  products: FlowCatalogProduct[];
  queue: QueueState;
  updatedAt: string;
}

export interface EnqueueFlowPourEventInput {
  eventId: string;
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  assignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  labelVersionId?: string;
  volume: number;
  uom: string;
  durationMs?: number;
  sourceMode: FlowSourceMode;
  sessionId?: string;
  actorId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface EnqueueFlowPourEventResult {
  event: FlowPourEvent;
  queueStatus: FlowQueueStatus | "committed";
  duplicate: boolean;
  source: "queue" | "events" | "new";
}

export interface RunFlowSyncPassResult {
  syncStatus: FlowSyncStatus;
  totalOutbox: number;
  queued: number;
  sent: number;
  accepted: number;
  failed: number;
}

const TAP_STATUSES = new Set<FlowTapStatus>([
  "online",
  "offline",
  "maintenance",
  "disabled",
]);
const METER_TYPES = new Set<FlowMeterType>([
  "hall_effect",
  "pulse_meter",
  "none",
  "other",
]);
const ASSIGNMENT_STATUSES = new Set<FlowAssignmentStatus>([
  "active",
  "empty",
  "removed",
  "error",
]);
const SOURCE_MODES = new Set<FlowSourceMode>([
  "bartender",
  "self_serve",
  "test",
  "maintenance",
]);
const SESSION_MODES = new Set<FlowSessionMode>([
  "self_serve",
  "bartender",
  "test",
]);
const SESSION_STATUSES = new Set<FlowSessionStatus>([
  "active",
  "paused",
  "closed",
  "blocked",
]);
const MENU_STATUSES = new Set<FlowMenuStatus>([
  "on_tap",
  "coming_soon",
  "out_of_stock",
  "hidden",
]);
const SYNC_STATUSES = new Set<FlowSyncStatus>([
  "online",
  "offline",
  "retrying",
]);
const QUEUE_STATUSES = new Set<FlowQueueStatus>([
  "queued",
  "sent",
  "accepted",
  "failed",
]);

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
const flowRoot = path.join(repoRoot, "commissioning", "flow");

const flowPaths = {
  root: flowRoot,
  tapsFile: path.join(flowRoot, "taps.json"),
  assignmentsFile: path.join(flowRoot, "keg-assignments.json"),
  tapAssignmentsFile: path.join(flowRoot, "tap-assignments.json"),
  eventsFile: path.join(flowRoot, "pour-events.json"),
  sessionsFile: path.join(flowRoot, "sessions.json"),
  menuItemsFile: path.join(flowRoot, "menu-items.json"),
  productsFile: path.join(flowRoot, "product-catalog-mirror.json"),
  queueFile: path.join(flowRoot, "queue.json"),
};

const nowIso = (): string => new Date().toISOString();

const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown): Promise<void> => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const ensureFile = async <T>(filePath: string, initialData: T): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    await writeJson(filePath, initialData);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
};

const toRequiredNumber = (value: unknown, fieldName: string): number => {
  const normalized = toOptionalNumber(value);
  if (typeof normalized !== "number") {
    throw new Error(`${fieldName} must be a finite number`);
  }
  return normalized;
};

const toIsoOrNow = (value: unknown): string => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return nowIso();
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.valueOf()) ? nowIso() : parsed.toISOString();
};

const toMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  return value;
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

const toEnumValue = <T extends string>(
  value: unknown,
  allowed: Set<T>,
): T | undefined => {
  const normalized = toOptionalString(value);
  if (!normalized || !allowed.has(normalized as T)) {
    return undefined;
  }
  return normalized as T;
};

const sortByUpdatedAtDesc = <T extends { updatedAt: string }>(rows: T[]): T[] => {
  return [...rows].sort(
    (left, right) => new Date(right.updatedAt).valueOf() - new Date(left.updatedAt).valueOf()
  );
};

const sortByOccurredAtDesc = <T extends { occurredAt: string }>(rows: T[]): T[] => {
  return [...rows].sort(
    (left, right) => new Date(right.occurredAt).valueOf() - new Date(left.occurredAt).valueOf()
  );
};

const createTapsState = (): TapsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-taps",
  updatedAt: nowIso(),
  taps: [],
});

const createAssignmentsState = (): AssignmentsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-keg-assignments",
  updatedAt: nowIso(),
  assignments: [],
});

const createEventsState = (): EventsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-pour-events",
  updatedAt: nowIso(),
  events: [],
});

const createSessionsState = (): SessionsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-sessions",
  updatedAt: nowIso(),
  sessions: [],
});

const createMenuItemsState = (): MenuItemsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-menu-items",
  updatedAt: nowIso(),
  items: [],
});

const createTapAssignmentsState = (): TapAssignmentsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-tap-assignments",
  updatedAt: nowIso(),
  assignments: [],
});

const createProductsState = (): ProductsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-product-catalog-mirror",
  updatedAt: nowIso(),
  products: [],
});

const createQueueState = (): QueueState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "flow-runtime-queue",
  updatedAt: nowIso(),
  syncStatus: "online",
  outbox: [],
});

const normalizeTap = (value: unknown): FlowTap | null => {
  if (!isRecord(value)) {
    return null;
  }

  const status = toEnumValue(value.status, TAP_STATUSES);
  const meterType = toEnumValue(value.meterType, METER_TYPES);
  const id = toOptionalString(value.id);
  const siteId = toOptionalString(value.siteId);
  const name = toOptionalString(value.name);

  if (!status || !meterType || !id || !siteId || !name) {
    return null;
  }

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    id,
    siteId,
    name,
    displayOrder: toOptionalNumber(value.displayOrder),
    status,
    meterType,
    temperatureProbeId: toOptionalString(value.temperatureProbeId),
    lineTempC: toOptionalNumber(value.lineTempC),
    flowRateOzPerMin: toOptionalNumber(value.flowRateOzPerMin),
    notes: toOptionalString(value.notes),
    metadata: toMetadata(value.metadata),
    createdAt: toIsoOrNow(value.createdAt),
    updatedAt: toIsoOrNow(value.updatedAt),
  };
};

const normalizeAssignment = (value: unknown): FlowKegAssignment | null => {
  if (!isRecord(value)) {
    return null;
  }

  const status = toEnumValue(value.status, ASSIGNMENT_STATUSES);
  const id = toOptionalString(value.id);
  const siteId = toOptionalString(value.siteId);
  const tapId = toOptionalString(value.tapId);
  const skuId = toOptionalString(value.skuId);
  const uom = toOptionalString(value.uom);
  const startQty = toOptionalNumber(value.startQty);
  const remainingQty = toOptionalNumber(value.remainingQty);

  if (!status || !id || !siteId || !tapId || !skuId || !uom) {
    return null;
  }
  if (typeof startQty !== "number" || typeof remainingQty !== "number") {
    return null;
  }

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    id,
    siteId,
    tapId,
    tapAssignmentId: toOptionalString(value.tapAssignmentId),
    kegAssetId: toOptionalString(value.kegAssetId),
    assetId: toOptionalString(value.assetId),
    assetCode: toOptionalString(value.assetCode),
    productId: toOptionalString(value.productId),
    productCode: toOptionalString(value.productCode),
    skuId,
    batchId: toOptionalString(value.batchId),
    packageLotId: toOptionalString(value.packageLotId),
    packageLotCode: toOptionalString(value.packageLotCode),
    lotId: toOptionalString(value.lotId),
    labelVersionId: toOptionalString(value.labelVersionId),
    uom,
    startQty,
    remainingQty,
    status,
    assignedAt: toIsoOrNow(value.assignedAt),
    endedAt: toOptionalString(value.endedAt),
    updatedAt: toIsoOrNow(value.updatedAt),
    metadata: toMetadata(value.metadata),
  };
};

const normalizeEvent = (value: unknown): FlowPourEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sourceMode = toEnumValue(value.sourceMode, SOURCE_MODES);
  const eventId = toOptionalString(value.eventId);
  const siteId = toOptionalString(value.siteId);
  const tapId = toOptionalString(value.tapId);
  const uom = toOptionalString(value.uom);
  const volume = toOptionalNumber(value.volume);

  if (!sourceMode || !eventId || !siteId || !tapId || !uom || typeof volume !== "number") {
    return null;
  }

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    eventId,
    siteId,
    tapId,
    tapAssignmentId: toOptionalString(value.tapAssignmentId),
    assignmentId: toOptionalString(value.assignmentId),
    kegAssetId: toOptionalString(value.kegAssetId),
    assetId: toOptionalString(value.assetId),
    assetCode: toOptionalString(value.assetCode),
    productId: toOptionalString(value.productId),
    productCode: toOptionalString(value.productCode),
    skuId: toOptionalString(value.skuId),
    batchId: toOptionalString(value.batchId),
    packageLotId: toOptionalString(value.packageLotId),
    packageLotCode: toOptionalString(value.packageLotCode),
    labelVersionId: toOptionalString(value.labelVersionId),
    volume,
    uom,
    durationMs: toOptionalNumber(value.durationMs),
    sourceMode,
    sessionId: toOptionalString(value.sessionId),
    actorId: toOptionalString(value.actorId),
    occurredAt: toIsoOrNow(value.occurredAt),
    metadata: toMetadata(value.metadata),
  };
};

const normalizeSession = (value: unknown): FlowSession | null => {
  if (!isRecord(value)) {
    return null;
  }

  const mode = toEnumValue(value.mode, SESSION_MODES);
  const status = toEnumValue(value.status, SESSION_STATUSES);
  const id = toOptionalString(value.id);
  const siteId = toOptionalString(value.siteId);
  const uom = toOptionalString(value.uom);
  const limitQty = toOptionalNumber(value.limitQty);
  const consumedQty = toOptionalNumber(value.consumedQty);

  if (!mode || !status || !id || !siteId || !uom) {
    return null;
  }
  if (typeof limitQty !== "number" || typeof consumedQty !== "number") {
    return null;
  }

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    id,
    siteId,
    mode,
    status,
    customerToken: toOptionalString(value.customerToken),
    actorId: toOptionalString(value.actorId),
    limitQty,
    consumedQty,
    uom,
    allowedTapIds: toStringArray(value.allowedTapIds),
    startedAt: toIsoOrNow(value.startedAt),
    endedAt: toOptionalString(value.endedAt),
    updatedAt: toIsoOrNow(value.updatedAt),
    metadata: toMetadata(value.metadata),
  };
};

const normalizeMenuItem = (value: unknown): FlowMenuItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const status = toEnumValue(value.status, MENU_STATUSES);
  const id = toOptionalString(value.id);
  const siteId = toOptionalString(value.siteId);
  const skuId = toOptionalString(value.skuId);
  const name = toOptionalString(value.name);
  if (!status || !id || !siteId || !skuId || !name) {
    return null;
  }

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    id,
    siteId,
    tapAssignmentId: toOptionalString(value.tapAssignmentId),
    tapId: toOptionalString(value.tapId),
    productId: toOptionalString(value.productId),
    productCode: toOptionalString(value.productCode),
    skuId,
    batchId: toOptionalString(value.batchId),
    packageLotId: toOptionalString(value.packageLotId),
    packageLotCode: toOptionalString(value.packageLotCode),
    assetId: toOptionalString(value.assetId),
    assetCode: toOptionalString(value.assetCode),
    labelVersionId: toOptionalString(value.labelVersionId),
    name,
    style: toOptionalString(value.style),
    abv: toOptionalNumber(value.abv),
    ibu: toOptionalNumber(value.ibu),
    servingTempC: toOptionalNumber(value.servingTempC),
    tastingNotes: toOptionalString(value.tastingNotes),
    status,
    story: toOptionalString(value.story),
    imageUrl: toOptionalString(value.imageUrl),
    imageAssetId: toOptionalString(value.imageAssetId),
    metadata: toMetadata(value.metadata),
    createdAt: toIsoOrNow(value.createdAt),
    updatedAt: toIsoOrNow(value.updatedAt),
  };
};

const normalizeProductAsset = (
  value: unknown,
): FlowCatalogProduct["assets"][number] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const assetId = toOptionalString(value.assetId);
  if (!assetId) {
    return null;
  }

  const images = isRecord(value.images)
    ? {
        thumbnailUrl: toOptionalString(value.images.thumbnailUrl),
        cardImageUrl: toOptionalString(value.images.cardImageUrl),
        fullImageUrl: toOptionalString(value.images.fullImageUrl),
      }
    : {};

  return {
    assetId,
    altText: toOptionalString(value.altText),
    images,
    createdAt: toIsoOrNow(value.createdAt),
    updatedAt: toIsoOrNow(value.updatedAt),
  };
};

const normalizeProduct = (value: unknown): FlowCatalogProduct | null => {
  if (!isRecord(value)) {
    return null;
  }

  const productId = toOptionalString(value.productId);
  const name = toOptionalString(value.name);
  if (!productId || !name) {
    return null;
  }

  const beverageClass = toOptionalString(value.beverageClass);
  const normalizedBeverageClass =
    beverageClass === "beer" || beverageClass === "cider" || beverageClass === "wine" || beverageClass === "other"
      ? beverageClass
      : "other";

  const assets = Array.isArray(value.assets)
    ? value.assets
        .map((entry) => normalizeProductAsset(entry))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const skuIds = Array.isArray(value.skuIds)
    ? value.skuIds
        .map((entry) => toOptionalString(entry))
        .filter((entry): entry is string => Boolean(entry))
    : [];

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? "1.0.0",
    id: toOptionalString(value.id) ?? productId,
    productId,
    productCode: toOptionalString(value.productCode),
    name,
    beverageClass: normalizedBeverageClass,
    skuIds,
    defaultSkuId: toOptionalString(value.defaultSkuId),
    currentAssetId: toOptionalString(value.currentAssetId),
    currentLabelVersionId: toOptionalString(value.currentLabelVersionId),
    assets,
    createdAt: toIsoOrNow(value.createdAt),
    updatedAt: toIsoOrNow(value.updatedAt),
  };
};

const normalizeTapAssignment = (value: unknown): FlowTapAssignment | null => {
  if (!isRecord(value)) {
    return null;
  }

  const tapAssignmentId = toOptionalString(value.tapAssignmentId);
  const siteId = toOptionalString(value.siteId);
  const tapId = toOptionalString(value.tapId);
  const productId = toOptionalString(value.productId);
  const skuId = toOptionalString(value.skuId);
  const status = toOptionalString(value.status);

  if (!tapAssignmentId || !siteId || !tapId || !productId || !skuId) {
    return null;
  }

  return {
    schemaVersion: toOptionalString(value.schemaVersion) ?? "1.0.0",
    id: toOptionalString(value.id) ?? tapAssignmentId,
    tapAssignmentId,
    siteId,
    tapId,
    productId,
    productCode: toOptionalString(value.productCode),
    productName: toOptionalString(value.productName),
    skuId,
    packageLotId: toOptionalString(value.packageLotId),
    packageLotCode: toOptionalString(value.packageLotCode),
    assetId: toOptionalString(value.assetId),
    assetCode: toOptionalString(value.assetCode),
    labelVersionId: toOptionalString(value.labelVersionId),
    beverageClass: toOptionalString(value.beverageClass),
    style: toOptionalString(value.style),
    abv: toOptionalNumber(value.abv),
    tastingNotes: toOptionalString(value.tastingNotes),
    imageAssetId: toOptionalString(value.imageAssetId),
    imageUrl: toOptionalString(value.imageUrl),
    pourSizesOz: Array.isArray(value.pourSizesOz)
      ? value.pourSizesOz
          .map((entry) => toOptionalNumber(entry))
          .filter((entry): entry is number => typeof entry === "number" && entry > 0)
      : undefined,
    status:
      status === "active" || status === "paused" || status === "offline_only" || status === "disabled"
        ? status
        : "disabled",
    dispenseTargetId: toOptionalString(value.dispenseTargetId),
    createdAt: toIsoOrNow(value.createdAt),
    updatedAt: toIsoOrNow(value.updatedAt),
    metadata: toMetadata(value.metadata),
  };
};

const normalizeOutboxItem = (value: unknown): FlowOutboxItem | null => {
  if (!isRecord(value)) {
    return null;
  }
  const event = normalizeEvent(value.event);
  const queueStatus = toEnumValue(value.queueStatus, QUEUE_STATUSES);
  if (!event || !queueStatus) {
    return null;
  }

  return {
    event,
    queueStatus,
    retries: toOptionalNumber(value.retries) ?? 0,
    lastAttemptAt: toOptionalString(value.lastAttemptAt),
    lastError: toOptionalString(value.lastError),
    osLedgerRef: toOptionalString(value.osLedgerRef),
  };
};

const readTapsState = async (): Promise<TapsState> => {
  const fallback = createTapsState();
  await ensureFile(flowPaths.tapsFile, fallback);
  const raw = await readJsonOrDefault<Partial<TapsState>>(flowPaths.tapsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-taps",
    updatedAt: toIsoOrNow(raw.updatedAt),
    taps: Array.isArray(raw.taps)
      ? raw.taps.map((entry) => normalizeTap(entry)).filter((entry): entry is FlowTap => Boolean(entry))
      : [],
  };
};

const readAssignmentsState = async (): Promise<AssignmentsState> => {
  const fallback = createAssignmentsState();
  await ensureFile(flowPaths.assignmentsFile, fallback);
  const raw = await readJsonOrDefault<Partial<AssignmentsState>>(flowPaths.assignmentsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-keg-assignments",
    updatedAt: toIsoOrNow(raw.updatedAt),
    assignments: Array.isArray(raw.assignments)
      ? raw.assignments
          .map((entry) => normalizeAssignment(entry))
          .filter((entry): entry is FlowKegAssignment => Boolean(entry))
      : [],
  };
};

const readEventsState = async (): Promise<EventsState> => {
  const fallback = createEventsState();
  await ensureFile(flowPaths.eventsFile, fallback);
  const raw = await readJsonOrDefault<Partial<EventsState>>(flowPaths.eventsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-pour-events",
    updatedAt: toIsoOrNow(raw.updatedAt),
    events: Array.isArray(raw.events)
      ? raw.events
          .map((entry) => normalizeEvent(entry))
          .filter((entry): entry is FlowPourEvent => Boolean(entry))
      : [],
  };
};

const readSessionsState = async (): Promise<SessionsState> => {
  const fallback = createSessionsState();
  await ensureFile(flowPaths.sessionsFile, fallback);
  const raw = await readJsonOrDefault<Partial<SessionsState>>(flowPaths.sessionsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-sessions",
    updatedAt: toIsoOrNow(raw.updatedAt),
    sessions: Array.isArray(raw.sessions)
      ? raw.sessions
          .map((entry) => normalizeSession(entry))
          .filter((entry): entry is FlowSession => Boolean(entry))
      : [],
  };
};

const readMenuItemsState = async (): Promise<MenuItemsState> => {
  const fallback = createMenuItemsState();
  await ensureFile(flowPaths.menuItemsFile, fallback);
  const raw = await readJsonOrDefault<Partial<MenuItemsState>>(flowPaths.menuItemsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-menu-items",
    updatedAt: toIsoOrNow(raw.updatedAt),
    items: Array.isArray(raw.items)
      ? raw.items
          .map((entry) => normalizeMenuItem(entry))
          .filter((entry): entry is FlowMenuItem => Boolean(entry))
      : [],
  };
};

const readTapAssignmentsState = async (): Promise<TapAssignmentsState> => {
  const fallback = createTapAssignmentsState();
  await ensureFile(flowPaths.tapAssignmentsFile, fallback);
  const raw = await readJsonOrDefault<Partial<TapAssignmentsState>>(flowPaths.tapAssignmentsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-tap-assignments",
    updatedAt: toIsoOrNow(raw.updatedAt),
    assignments: Array.isArray(raw.assignments)
      ? raw.assignments
          .map((entry) => normalizeTapAssignment(entry))
          .filter((entry): entry is FlowTapAssignment => Boolean(entry))
      : [],
  };
};

const readProductsState = async (): Promise<ProductsState> => {
  const fallback = createProductsState();
  await ensureFile(flowPaths.productsFile, fallback);
  const raw = await readJsonOrDefault<Partial<ProductsState>>(flowPaths.productsFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-product-catalog-mirror",
    updatedAt: toIsoOrNow(raw.updatedAt),
    products: Array.isArray(raw.products)
      ? raw.products
          .map((entry) => normalizeProduct(entry))
          .filter((entry): entry is FlowCatalogProduct => Boolean(entry))
      : [],
  };
};

const readQueueState = async (): Promise<QueueState> => {
  const fallback = createQueueState();
  await ensureFile(flowPaths.queueFile, fallback);
  const raw = await readJsonOrDefault<Partial<QueueState>>(flowPaths.queueFile, fallback);
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    id: "flow-runtime-queue",
    updatedAt: toIsoOrNow(raw.updatedAt),
    syncStatus: toEnumValue(raw.syncStatus, SYNC_STATUSES) ?? "online",
    outbox: Array.isArray(raw.outbox)
      ? raw.outbox
          .map((entry) => normalizeOutboxItem(entry))
          .filter((entry): entry is FlowOutboxItem => Boolean(entry))
      : [],
  };
};

const writeEventsState = async (state: EventsState): Promise<void> => {
  await writeJson(flowPaths.eventsFile, state);
};

const writeQueueState = async (state: QueueState): Promise<void> => {
  await writeJson(flowPaths.queueFile, state);
};

export const readFlowRuntimeSnapshot = async (): Promise<FlowRuntimeSnapshot> => {
  const [
    tapsState,
    assignmentsState,
    tapAssignmentsState,
    eventsState,
    sessionsState,
    menuItemsState,
    productsState,
    queueState,
  ] =
    await Promise.all([
      readTapsState(),
      readAssignmentsState(),
      readTapAssignmentsState(),
      readEventsState(),
      readSessionsState(),
      readMenuItemsState(),
      readProductsState(),
      readQueueState(),
    ]);

  const updatedAt =
    [
      tapsState.updatedAt,
      assignmentsState.updatedAt,
      tapAssignmentsState.updatedAt,
      eventsState.updatedAt,
      sessionsState.updatedAt,
      menuItemsState.updatedAt,
      productsState.updatedAt,
      queueState.updatedAt,
    ].sort((left, right) => new Date(right).valueOf() - new Date(left).valueOf())[0] ?? nowIso();

  return {
    taps: sortByUpdatedAtDesc(tapsState.taps),
    assignments: sortByUpdatedAtDesc(assignmentsState.assignments),
    tapAssignments: sortByUpdatedAtDesc(tapAssignmentsState.assignments),
    events: sortByOccurredAtDesc(eventsState.events),
    sessions: sortByUpdatedAtDesc(sessionsState.sessions),
    menuItems: sortByUpdatedAtDesc(menuItemsState.items),
    products: sortByUpdatedAtDesc(productsState.products),
    queue: {
      ...queueState,
      outbox: sortByOccurredAtDesc(queueState.outbox.map((item) => item.event)).map((event) => {
        return queueState.outbox.find((entry) => entry.event.eventId === event.eventId) as FlowOutboxItem;
      }),
    },
    updatedAt,
  };
};

const createFlowEventFromInput = (input: EnqueueFlowPourEventInput): FlowPourEvent => {
  const sourceMode = toEnumValue(input.sourceMode, SOURCE_MODES);
  if (!sourceMode) {
    throw new Error("sourceMode is invalid");
  }

  const volume = toRequiredNumber(input.volume, "volume");
  if (volume <= 0) {
    throw new Error("volume must be greater than 0");
  }

  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    eventId: toRequiredString(input.eventId, "eventId"),
    siteId: toRequiredString(input.siteId, "siteId"),
    tapId: toRequiredString(input.tapId, "tapId"),
    tapAssignmentId: toOptionalString(input.tapAssignmentId),
    assignmentId: toOptionalString(input.assignmentId),
    kegAssetId: toOptionalString(input.kegAssetId),
    assetId: toOptionalString(input.assetId),
    assetCode: toOptionalString(input.assetCode),
    productId: toOptionalString(input.productId),
    productCode: toOptionalString(input.productCode),
    skuId: toOptionalString(input.skuId),
    batchId: toOptionalString(input.batchId),
    packageLotId: toOptionalString(input.packageLotId),
    packageLotCode: toOptionalString(input.packageLotCode),
    labelVersionId: toOptionalString(input.labelVersionId),
    volume,
    uom: toRequiredString(input.uom, "uom"),
    durationMs: toOptionalNumber(input.durationMs),
    sourceMode,
    sessionId: toOptionalString(input.sessionId),
    actorId: toOptionalString(input.actorId),
    occurredAt: toIsoOrNow(input.occurredAt),
    metadata: toMetadata(input.metadata),
  };
};

export const setFlowSyncStatus = async (status: FlowSyncStatus): Promise<QueueState> => {
  if (!SYNC_STATUSES.has(status)) {
    throw new Error("syncStatus is invalid");
  }

  const queueState = await readQueueState();
  const nextState: QueueState = {
    ...queueState,
    syncStatus: status,
    updatedAt: nowIso(),
  };
  await writeQueueState(nextState);
  return nextState;
};

export const enqueueFlowPourEvent = async (
  input: EnqueueFlowPourEventInput,
): Promise<EnqueueFlowPourEventResult> => {
  const event = createFlowEventFromInput(input);
  const [eventsState, queueState] = await Promise.all([readEventsState(), readQueueState()]);

  const committed = eventsState.events.find(
    (existing) => existing.eventId === event.eventId,
  );
  if (committed) {
    return {
      event: committed,
      queueStatus: "committed",
      duplicate: true,
      source: "events",
    };
  }

  const existingQueued = queueState.outbox.find(
    (entry) => entry.event.eventId === event.eventId,
  );
  if (existingQueued) {
    return {
      event: existingQueued.event,
      queueStatus: existingQueued.queueStatus,
      duplicate: true,
      source: "queue",
    };
  }

  const queueStatus: FlowQueueStatus =
    queueState.syncStatus === "offline" ? "queued" : "sent";
  const now = nowIso();
  const outboxItem: FlowOutboxItem = {
    event,
    queueStatus,
    retries: 0,
    lastAttemptAt: queueStatus === "sent" ? now : undefined,
  };

  const nextQueueState: QueueState = {
    ...queueState,
    updatedAt: now,
    outbox: [outboxItem, ...queueState.outbox],
  };
  await writeQueueState(nextQueueState);

  return {
    event,
    queueStatus,
    duplicate: false,
    source: "new",
  };
};

export const runFlowSyncPass = async (): Promise<RunFlowSyncPassResult> => {
  const [queueState, eventsState] = await Promise.all([readQueueState(), readEventsState()]);

  if (queueState.syncStatus === "offline") {
    return {
      syncStatus: queueState.syncStatus,
      totalOutbox: queueState.outbox.length,
      queued: queueState.outbox.filter((entry) => entry.queueStatus === "queued").length,
      sent: queueState.outbox.filter((entry) => entry.queueStatus === "sent").length,
      accepted: queueState.outbox.filter((entry) => entry.queueStatus === "accepted").length,
      failed: queueState.outbox.filter((entry) => entry.queueStatus === "failed").length,
    };
  }

  const now = nowIso();
  const eventsById = new Map(eventsState.events.map((event) => [event.eventId, event]));

  const nextOutbox = queueState.outbox.map((entry, index) => {
    if (entry.queueStatus === "accepted") {
      return entry;
    }

    if (queueState.syncStatus === "retrying" && index % 3 === 0) {
      return {
        ...entry,
        queueStatus: "failed" as const,
        retries: entry.retries + 1,
        lastAttemptAt: now,
        lastError: "Simulated temporary upstream failure",
      };
    }

    eventsById.set(entry.event.eventId, entry.event);
    return {
      ...entry,
      queueStatus: "accepted" as const,
      lastAttemptAt: now,
      lastError: undefined,
      osLedgerRef: entry.osLedgerRef ?? `os-ledger-sim-${Date.now().toString(36)}-${index}`,
    };
  });

  const nextEventsState: EventsState = {
    ...eventsState,
    updatedAt: now,
    events: sortByOccurredAtDesc(Array.from(eventsById.values())),
  };

  const nextQueueState: QueueState = {
    ...queueState,
    updatedAt: now,
    outbox: nextOutbox,
  };

  await Promise.all([
    writeEventsState(nextEventsState),
    writeQueueState(nextQueueState),
  ]);

  return {
    syncStatus: nextQueueState.syncStatus,
    totalOutbox: nextOutbox.length,
    queued: nextOutbox.filter((entry) => entry.queueStatus === "queued").length,
    sent: nextOutbox.filter((entry) => entry.queueStatus === "sent").length,
    accepted: nextOutbox.filter((entry) => entry.queueStatus === "accepted").length,
    failed: nextOutbox.filter((entry) => entry.queueStatus === "failed").length,
  };
};
