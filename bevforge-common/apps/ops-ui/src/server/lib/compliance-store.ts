import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export type ComplianceSuiteId = 'os' | 'ops' | 'lab' | 'flow' | 'connect';
export type ComplianceEventStatus = 'recorded' | 'voided' | 'amended';
export type ComplianceEventType =
  | 'batch_planned'
  | 'batch_started'
  | 'batch_completed'
  | 'batch_released'
  | 'batch_shipped'
  | 'transfer_completed'
  | 'inventory_consumed'
  | 'inventory_produced'
  | 'inventory_adjusted'
  | 'inventory_shipped'
  | 'loss_recorded'
  | 'destruction_recorded'
  | 'reservation_committed'
  | 'reservation_released'
  | 'pour_recorded'
  | 'compliance_note';

export interface ComplianceSourceRecord {
  recordType:
    | 'batch'
    | 'inventory_movement'
    | 'recipe_run'
    | 'recipe_reading'
    | 'reservation'
    | 'reservation_action'
    | 'flow_pour_event'
    | 'manual';
  recordId: string;
  openPath?: string;
  originSuite?: ComplianceSuiteId;
}

export interface ComplianceQuantity {
  value: number;
  uom: string;
  direction: 'in' | 'out' | 'none';
}

export interface ComplianceEventRecord {
  schemaVersion: string;
  id: string;
  eventType: ComplianceEventType;
  eventStatus: ComplianceEventStatus;
  sourceSuite: ComplianceSuiteId;
  sourceRecord: ComplianceSourceRecord;
  siteId: string;
  occurredAt: string;
  recordedAt: string;
  batchId?: string;
  lotCode?: string;
  recipeRunId?: string;
  recipeId?: string;
  skuId?: string;
  itemId?: string;
  reservationId?: string;
  orderId?: string;
  lineId?: string;
  quantity?: ComplianceQuantity;
  reasonCode?: string;
  reasonMessage?: string;
  regulatoryTags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ComplianceFeedCursor {
  sort?: string;
  afterOccurredAt?: string;
  afterId?: string;
  nextAfter?: {
    occurredAt?: string;
    id?: string;
  };
  hasMore?: boolean;
}

export interface ComplianceFeedRange {
  from: string;
  to: string;
}

export interface ComplianceFeed {
  schemaVersion: string;
  id: string;
  sourceSuite: 'os';
  siteId: string;
  generatedAt: string;
  range: ComplianceFeedRange;
  cursor?: ComplianceFeedCursor;
  summary?: {
    totalEvents?: number;
    byType?: Record<string, number>;
  };
  events: ComplianceEventRecord[];
  integrity?: {
    digestAlgo?: 'sha256';
    digest?: string;
  };
}

interface ComplianceEventsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  events: ComplianceEventRecord[];
}

export interface ComplianceSyncState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  lastSyncAt?: string;
  lastSourceFeedId?: string;
  lastSiteId?: string;
  lastRange?: ComplianceFeedRange;
  cursor?: ComplianceFeedCursor;
}

interface ComplianceReportsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  reports: CompliancePeriodReport[];
}

export interface ComplianceTotals {
  uom: string;
  onHandStartQty: number;
  producedQty: number;
  removedQty: number;
  destroyedQty: number;
  lossQty: number;
  onHandEndQty: number;
}

export interface CompliancePeriodReport {
  schemaVersion: string;
  id: string;
  siteId: string;
  jurisdiction: {
    countryCode: string;
    regionCode: string;
    agency: string;
    permitId?: string;
    facilityId?: string;
  };
  period: ComplianceFeedRange;
  status: 'draft' | 'reviewed' | 'submitted' | 'accepted' | 'amended';
  sourceFeedId: string;
  supportingEventIds?: string[];
  totals: ComplianceTotals;
  bySku?: Array<{
    skuId: string;
    lotCodes?: string[];
    totals: ComplianceTotals;
  }>;
  notes?: string;
  generatedAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ComplianceEventsQuery {
  siteId?: string;
  from?: string;
  to?: string;
  sourceSuite?: ComplianceSuiteId;
  search?: string;
  eventType?: string;
}

export interface CreateComplianceEventInput {
  id?: string;
  eventType?: string;
  eventStatus?: string;
  sourceSuite?: ComplianceSuiteId;
  sourceRecord?: Partial<ComplianceSourceRecord>;
  siteId?: string;
  occurredAt: string;
  recordedAt?: string;
  reasonCode?: string;
  reasonMessage?: string;
  quantity?: Partial<ComplianceQuantity>;
  metadata?: Record<string, unknown>;
}

export interface GenerateComplianceReportInput {
  siteId: string;
  from: string;
  to: string;
  sourceFeedId?: string;
  status?: CompliancePeriodReport['status'];
  jurisdiction: CompliancePeriodReport['jurisdiction'];
  notes?: string;
}

export interface IngestComplianceFeedResult {
  sourceFeedId: string;
  sourceSiteId: string;
  inserted: number;
  updated: number;
  unchanged: number;
  totalEvents: number;
  cursor?: ComplianceFeedCursor;
}

const RECORD_SCHEMA_VERSION = '1.0.0';
const STATE_SCHEMA_VERSION = '1.0.0';
const COMPLIANCE_EVENT_TYPES = new Set<ComplianceEventType>([
  'batch_planned',
  'batch_started',
  'batch_completed',
  'batch_released',
  'batch_shipped',
  'transfer_completed',
  'inventory_consumed',
  'inventory_produced',
  'inventory_adjusted',
  'inventory_shipped',
  'loss_recorded',
  'destruction_recorded',
  'reservation_committed',
  'reservation_released',
  'pour_recorded',
  'compliance_note',
]);
const COMPLIANCE_EVENT_STATUSES = new Set<ComplianceEventStatus>([
  'recorded',
  'voided',
  'amended',
]);
const SOURCE_RECORD_TYPES = new Set<ComplianceSourceRecord['recordType']>([
  'batch',
  'inventory_movement',
  'recipe_run',
  'recipe_reading',
  'reservation',
  'reservation_action',
  'flow_pour_event',
  'manual',
]);
const SUITES = new Set<ComplianceSuiteId>(['os', 'ops', 'lab', 'flow', 'connect']);

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

const compliancePaths = {
  root: opsRoot,
  eventsFile: path.join(opsRoot, 'compliance-events.json'),
  syncStateFile: path.join(opsRoot, 'compliance-sync-state.json'),
  reportsFile: path.join(opsRoot, 'compliance-period-reports.json'),
};

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

const toText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const toIso = (value: unknown): string | undefined => {
  const text = toText(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = toText(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toObject = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

const normalizeSuite = (
  value: unknown,
  fallback: ComplianceSuiteId
): ComplianceSuiteId => {
  const text = toText(value)?.toLowerCase();
  if (!text) return fallback;
  return SUITES.has(text as ComplianceSuiteId)
    ? (text as ComplianceSuiteId)
    : fallback;
};

const normalizeEventType = (
  value: unknown,
  fallback: ComplianceEventType
): ComplianceEventType => {
  const text = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (!text) return fallback;
  return COMPLIANCE_EVENT_TYPES.has(text as ComplianceEventType)
    ? (text as ComplianceEventType)
    : fallback;
};

const normalizeEventStatus = (
  value: unknown,
  fallback: ComplianceEventStatus
): ComplianceEventStatus => {
  const text = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (!text) return fallback;
  return COMPLIANCE_EVENT_STATUSES.has(text as ComplianceEventStatus)
    ? (text as ComplianceEventStatus)
    : fallback;
};

const normalizeSourceRecord = (input: unknown): ComplianceSourceRecord => {
  const row = toObject(input) ?? {};
  const recordTypeRaw = toText(row.recordType)?.toLowerCase().replaceAll('-', '_');
  const recordType = SOURCE_RECORD_TYPES.has(
    recordTypeRaw as ComplianceSourceRecord['recordType']
  )
    ? (recordTypeRaw as ComplianceSourceRecord['recordType'])
    : 'manual';

  return {
    recordType,
    recordId: toText(row.recordId) ?? `manual-${Date.now().toString(36)}`,
    openPath: toText(row.openPath),
    originSuite: normalizeSuite(row.originSuite, 'ops'),
  };
};

const normalizeQuantity = (input: unknown): ComplianceQuantity | undefined => {
  const row = toObject(input);
  if (!row) return undefined;

  const value = toNumber(row.value);
  const uom = toText(row.uom);
  const directionRaw = toText(row.direction)?.toLowerCase();
  const direction =
    directionRaw === 'in' || directionRaw === 'out' || directionRaw === 'none'
      ? directionRaw
      : undefined;

  if (value === undefined || !uom || !direction || value < 0) {
    return undefined;
  }

  return {
    value,
    uom,
    direction,
  };
};

const normalizeEvent = (input: unknown, index: number): ComplianceEventRecord | null => {
  const row = toObject(input);
  if (!row) return null;

  const occurredAt = toIso(row.occurredAt);
  const recordedAt = toIso(row.recordedAt) ?? occurredAt;
  const siteId = toText(row.siteId);
  if (!occurredAt || !recordedAt || !siteId) {
    return null;
  }

  const sourceRecord = normalizeSourceRecord(row.sourceRecord);
  const sourceSuite = normalizeSuite(row.sourceSuite, 'os');
  const id = toText(row.id) ?? `${sourceSuite}:event:${index + 1}`;
  const regulatoryTags = Array.isArray(row.regulatoryTags)
    ? row.regulatoryTags
        .map((tag) => toText(tag))
        .filter((tag): tag is string => Boolean(tag))
    : undefined;

  return {
    schemaVersion: toText(row.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    id,
    eventType: normalizeEventType(row.eventType, 'compliance_note'),
    eventStatus: normalizeEventStatus(row.eventStatus, 'recorded'),
    sourceSuite,
    sourceRecord,
    siteId,
    occurredAt,
    recordedAt,
    batchId: toText(row.batchId),
    lotCode: toText(row.lotCode),
    recipeRunId: toText(row.recipeRunId),
    recipeId: toText(row.recipeId),
    skuId: toText(row.skuId),
    itemId: toText(row.itemId),
    reservationId: toText(row.reservationId),
    orderId: toText(row.orderId),
    lineId: toText(row.lineId),
    quantity: normalizeQuantity(row.quantity),
    reasonCode: toText(row.reasonCode),
    reasonMessage: toText(row.reasonMessage),
    regulatoryTags: regulatoryTags && regulatoryTags.length > 0 ? regulatoryTags : undefined,
    metadata: toObject(row.metadata),
  };
};

const normalizeFeed = (input: unknown): ComplianceFeed => {
  const row = toObject(input) ?? {};
  const eventsRaw = Array.isArray(row.events) ? row.events : [];
  const events = eventsRaw
    .map((entry, index) => normalizeEvent(entry, index))
    .filter((entry): entry is ComplianceEventRecord => entry !== null);

  const rangeRow = toObject(row.range) ?? {};
  const from = toIso(rangeRow.from) ?? nowIso();
  const to = toIso(rangeRow.to) ?? from;

  const cursorRow = toObject(row.cursor);
  const nextAfterRow = cursorRow ? toObject(cursorRow.nextAfter) : undefined;
  const cursor: ComplianceFeedCursor | undefined = cursorRow
    ? {
        sort: toText(cursorRow.sort),
        afterOccurredAt: toIso(cursorRow.afterOccurredAt),
        afterId: toText(cursorRow.afterId),
        nextAfter: nextAfterRow
          ? {
              occurredAt: toIso(nextAfterRow.occurredAt),
              id: toText(nextAfterRow.id),
            }
          : undefined,
        hasMore:
          typeof cursorRow.hasMore === 'boolean' ? cursorRow.hasMore : undefined,
      }
    : undefined;

  return {
    schemaVersion: toText(row.schemaVersion) ?? RECORD_SCHEMA_VERSION,
    id: toText(row.id) ?? `os-compliance-feed-${Date.now().toString(36)}`,
    sourceSuite: 'os',
    siteId: toText(row.siteId) ?? 'main',
    generatedAt: toIso(row.generatedAt) ?? nowIso(),
    range: { from, to },
    cursor,
    summary: toObject(row.summary) as ComplianceFeed['summary'] | undefined,
    events,
    integrity: toObject(row.integrity) as ComplianceFeed['integrity'] | undefined,
  };
};

const defaultEventsState = (): ComplianceEventsState => ({
  schemaVersion: STATE_SCHEMA_VERSION,
  id: 'ops-compliance-events',
  updatedAt: nowIso(),
  events: [],
});

const defaultSyncState = (): ComplianceSyncState => ({
  schemaVersion: STATE_SCHEMA_VERSION,
  id: 'ops-compliance-sync-state',
  updatedAt: nowIso(),
});

const defaultReportsState = (): ComplianceReportsState => ({
  schemaVersion: STATE_SCHEMA_VERSION,
  id: 'ops-compliance-period-reports',
  updatedAt: nowIso(),
  reports: [],
});

export const ensureComplianceStore = async (): Promise<void> => {
  await ensureDirectory(compliancePaths.root);
  await Promise.all([
    ensureFile(compliancePaths.eventsFile, defaultEventsState()),
    ensureFile(compliancePaths.syncStateFile, defaultSyncState()),
    ensureFile(compliancePaths.reportsFile, defaultReportsState()),
  ]);
};

const sortEvents = (events: ComplianceEventRecord[]): ComplianceEventRecord[] =>
  [...events].sort((left, right) => {
    const occurredCompare =
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    if (occurredCompare !== 0) return occurredCompare;
    return left.id.localeCompare(right.id);
  });

const readEventsState = async (): Promise<ComplianceEventsState> => {
  await ensureComplianceStore();
  const state = await readJsonOrDefault<ComplianceEventsState>(
    compliancePaths.eventsFile,
    defaultEventsState()
  );

  const eventsRaw = Array.isArray(state.events) ? state.events : [];
  const events = eventsRaw
    .map((entry, index) => normalizeEvent(entry, index))
    .filter((entry): entry is ComplianceEventRecord => entry !== null);

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    id: toText(state.id) ?? 'ops-compliance-events',
    updatedAt: toIso(state.updatedAt) ?? nowIso(),
    events: sortEvents(events),
  };
};

const readSyncState = async (): Promise<ComplianceSyncState> => {
  await ensureComplianceStore();
  const state = await readJsonOrDefault<ComplianceSyncState>(
    compliancePaths.syncStateFile,
    defaultSyncState()
  );

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    id: toText(state.id) ?? 'ops-compliance-sync-state',
    updatedAt: toIso(state.updatedAt) ?? nowIso(),
    lastSyncAt: toIso(state.lastSyncAt),
    lastSourceFeedId: toText(state.lastSourceFeedId),
    lastSiteId: toText(state.lastSiteId),
    lastRange:
      state.lastRange && toObject(state.lastRange)
        ? {
            from: toIso(state.lastRange.from) ?? nowIso(),
            to: toIso(state.lastRange.to) ?? nowIso(),
          }
        : undefined,
    cursor: state.cursor,
  };
};

const readReportsState = async (): Promise<ComplianceReportsState> => {
  await ensureComplianceStore();
  const state = await readJsonOrDefault<ComplianceReportsState>(
    compliancePaths.reportsFile,
    defaultReportsState()
  );
  const reports = Array.isArray(state.reports) ? state.reports : [];
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    id: toText(state.id) ?? 'ops-compliance-period-reports',
    updatedAt: toIso(state.updatedAt) ?? nowIso(),
    reports,
  };
};

const writeEventsState = async (state: ComplianceEventsState): Promise<void> => {
  await writeJson(compliancePaths.eventsFile, state);
};

const writeSyncState = async (state: ComplianceSyncState): Promise<void> => {
  await writeJson(compliancePaths.syncStateFile, state);
};

const writeReportsState = async (state: ComplianceReportsState): Promise<void> => {
  await writeJson(compliancePaths.reportsFile, state);
};

export const listComplianceEvents = async (
  query: ComplianceEventsQuery = {}
): Promise<ComplianceEventRecord[]> => {
  const state = await readEventsState();
  const fromTs = query.from ? Date.parse(query.from) : Number.NEGATIVE_INFINITY;
  const toTs = query.to ? Date.parse(query.to) : Number.POSITIVE_INFINITY;
  const search = toText(query.search)?.toLowerCase();
  const eventType = toText(query.eventType)?.toLowerCase().replaceAll('-', '_');

  return state.events.filter((event) => {
    if (query.siteId && event.siteId !== query.siteId) return false;
    if (query.sourceSuite && event.sourceSuite !== query.sourceSuite) return false;
    if (eventType && event.eventType !== eventType) return false;
    const occurredTs = Date.parse(event.occurredAt);
    if (Number.isFinite(fromTs) && occurredTs < fromTs) return false;
    if (Number.isFinite(toTs) && occurredTs > toTs) return false;
    if (!search) return true;

    const haystack = [
      event.id,
      event.eventType,
      event.reasonCode ?? '',
      event.reasonMessage ?? '',
      event.batchId ?? '',
      event.lotCode ?? '',
      event.skuId ?? '',
      event.sourceRecord.recordId,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(search);
  });
};

const createComplianceId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createComplianceEvent = async (
  input: CreateComplianceEventInput
): Promise<ComplianceEventRecord> => {
  const occurredAt = toIso(input.occurredAt);
  if (!occurredAt) {
    throw new Error('Validation: occurredAt is required and must be an ISO datetime.');
  }

  const sourceSuite = normalizeSuite(input.sourceSuite, 'ops');
  const sourceRecord = normalizeSourceRecord(input.sourceRecord);
  const siteId = toText(input.siteId) ?? 'main';
  const quantity = normalizeQuantity(input.quantity);

  const event: ComplianceEventRecord = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toText(input.id) ?? createComplianceId('ops-compliance'),
    eventType: normalizeEventType(input.eventType, 'compliance_note'),
    eventStatus: normalizeEventStatus(input.eventStatus, 'recorded'),
    sourceSuite,
    sourceRecord,
    siteId,
    occurredAt,
    recordedAt: toIso(input.recordedAt) ?? nowIso(),
    quantity,
    reasonCode: toText(input.reasonCode),
    reasonMessage: toText(input.reasonMessage),
    metadata: toObject(input.metadata),
  };

  const state = await readEventsState();
  const index = state.events.findIndex((item) => item.id === event.id);
  if (index >= 0) {
    state.events[index] = event;
  } else {
    state.events.push(event);
  }
  state.events = sortEvents(state.events);
  state.updatedAt = nowIso();
  await writeEventsState(state);
  return event;
};

const isSameEventRecord = (
  left: ComplianceEventRecord,
  right: ComplianceEventRecord
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const ingestComplianceFeed = async (
  feedInput: unknown
): Promise<IngestComplianceFeedResult> => {
  const feed = normalizeFeed(feedInput);
  const eventsState = await readEventsState();
  const nextEvents = [...eventsState.events];
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const incoming of feed.events) {
    const existingIndex = nextEvents.findIndex((entry) => entry.id === incoming.id);
    if (existingIndex < 0) {
      nextEvents.push(incoming);
      inserted += 1;
      continue;
    }
    if (isSameEventRecord(nextEvents[existingIndex], incoming)) {
      unchanged += 1;
      continue;
    }
    nextEvents[existingIndex] = incoming;
    updated += 1;
  }

  eventsState.events = sortEvents(nextEvents);
  eventsState.updatedAt = nowIso();
  await writeEventsState(eventsState);

  const syncState = await readSyncState();
  syncState.updatedAt = nowIso();
  syncState.lastSyncAt = nowIso();
  syncState.lastSourceFeedId = feed.id;
  syncState.lastSiteId = feed.siteId;
  syncState.lastRange = feed.range;
  syncState.cursor = feed.cursor;
  await writeSyncState(syncState);

  return {
    sourceFeedId: feed.id,
    sourceSiteId: feed.siteId,
    inserted,
    updated,
    unchanged,
    totalEvents: feed.events.length,
    cursor: feed.cursor,
  };
};

export const getComplianceSyncState = async (): Promise<ComplianceSyncState> =>
  readSyncState();

const initTotals = (uom: string): ComplianceTotals => ({
  uom,
  onHandStartQty: 0,
  producedQty: 0,
  removedQty: 0,
  destroyedQty: 0,
  lossQty: 0,
  onHandEndQty: 0,
});

const resolvePrimaryUom = (events: ComplianceEventRecord[]): string => {
  const counts = new Map<string, number>();
  for (const event of events) {
    const uom = event.quantity?.uom;
    if (!uom) continue;
    counts.set(uom, (counts.get(uom) ?? 0) + 1);
  }
  if (counts.size === 0) return 'units';
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
};

const bucketQuantity = (
  event: ComplianceEventRecord,
  totals: ComplianceTotals
): void => {
  if (!event.quantity || event.quantity.uom !== totals.uom) return;

  const value = event.quantity.value;
  if (event.eventType === 'destruction_recorded') {
    totals.destroyedQty += value;
    return;
  }
  if (event.eventType === 'loss_recorded') {
    totals.lossQty += value;
    return;
  }
  if (
    event.eventType === 'inventory_produced' ||
    event.eventType === 'batch_completed' ||
    (event.quantity.direction === 'in' && event.eventType !== 'transfer_completed')
  ) {
    totals.producedQty += value;
    return;
  }
  if (event.quantity.direction === 'out') {
    totals.removedQty += value;
  }
};

const finalizeTotals = (totals: ComplianceTotals): ComplianceTotals => ({
  ...totals,
  producedQty: Number(totals.producedQty.toFixed(4)),
  removedQty: Number(totals.removedQty.toFixed(4)),
  destroyedQty: Number(totals.destroyedQty.toFixed(4)),
  lossQty: Number(totals.lossQty.toFixed(4)),
  onHandEndQty: Number(
    (
      totals.onHandStartQty +
      totals.producedQty -
      totals.removedQty -
      totals.destroyedQty -
      totals.lossQty
    ).toFixed(4)
  ),
});

export const generateCompliancePeriodReport = async (
  input: GenerateComplianceReportInput
): Promise<CompliancePeriodReport> => {
  const siteId = toText(input.siteId);
  if (!siteId) {
    throw new Error('Validation: siteId is required.');
  }
  const from = toIso(input.from);
  const to = toIso(input.to);
  if (!from || !to) {
    throw new Error('Validation: period.from and period.to must be valid ISO datetimes.');
  }
  if (Date.parse(to) < Date.parse(from)) {
    throw new Error('Validation: period.to must be greater than or equal to period.from.');
  }

  const jurisdiction = input.jurisdiction;
  if (
    !toText(jurisdiction?.countryCode) ||
    !toText(jurisdiction?.regionCode) ||
    !toText(jurisdiction?.agency)
  ) {
    throw new Error(
      'Validation: jurisdiction.countryCode, jurisdiction.regionCode, and jurisdiction.agency are required.'
    );
  }

  const sourceEvents = await listComplianceEvents({
    siteId,
    sourceSuite: 'os',
    from,
    to,
  });
  const uom = resolvePrimaryUom(sourceEvents);
  const totals = initTotals(uom);
  for (const event of sourceEvents) {
    bucketQuantity(event, totals);
  }
  const finalizedTotals = finalizeTotals(totals);

  const bySkuMap = new Map<string, { lotCodes: Set<string>; totals: ComplianceTotals }>();
  for (const event of sourceEvents) {
    if (!event.skuId) continue;
    const existing = bySkuMap.get(event.skuId);
    if (!existing) {
      const next = { lotCodes: new Set<string>(), totals: initTotals(uom) };
      if (event.lotCode) next.lotCodes.add(event.lotCode);
      bucketQuantity(event, next.totals);
      bySkuMap.set(event.skuId, next);
      continue;
    }
    if (event.lotCode) existing.lotCodes.add(event.lotCode);
    bucketQuantity(event, existing.totals);
  }

  const bySku = [...bySkuMap.entries()].map(([skuId, payload]) => ({
    skuId,
    lotCodes: payload.lotCodes.size > 0 ? [...payload.lotCodes] : undefined,
    totals: finalizeTotals(payload.totals),
  }));

  const syncState = await readSyncState();
  const report: CompliancePeriodReport = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: createComplianceId('compliance-report'),
    siteId,
    jurisdiction: {
      countryCode: jurisdiction.countryCode,
      regionCode: jurisdiction.regionCode,
      agency: jurisdiction.agency,
      permitId: jurisdiction.permitId,
      facilityId: jurisdiction.facilityId,
    },
    period: { from, to },
    status: input.status ?? 'draft',
    sourceFeedId:
      toText(input.sourceFeedId) ??
      syncState.lastSourceFeedId ??
      `ops-local-${Date.now().toString(36)}`,
    supportingEventIds: sourceEvents.map((event) => event.id),
    totals: finalizedTotals,
    bySku: bySku.length > 0 ? bySku : undefined,
    notes: toText(input.notes),
    generatedAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      periodTotalsInvariant:
        'onHandStartQty + producedQty - removedQty - destroyedQty - lossQty = onHandEndQty',
      sourceEventCount: sourceEvents.length,
    },
  };

  const reportsState = await readReportsState();
  reportsState.reports = [report, ...reportsState.reports];
  reportsState.updatedAt = nowIso();
  await writeReportsState(reportsState);
  return report;
};

export const listComplianceReports = async (
  siteId?: string
): Promise<CompliancePeriodReport[]> => {
  const state = await readReportsState();
  if (!siteId) {
    return state.reports;
  }
  return state.reports.filter((report) => report.siteId === siteId);
};
