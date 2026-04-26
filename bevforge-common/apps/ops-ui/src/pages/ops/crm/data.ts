import {
  buildOpsTaxProfileSnapshot,
  normalizeOpsTaxProfile,
  type OpsTaxProfileSnapshot,
} from '@/lib/ops-tax';
import { apiGet, apiPost } from '@/lib/api';

export type OpsClientStatus = 'active' | 'inactive';
export type OpsLeadStage = 'prospect' | 'contacted' | 'qualified' | 'proposal' | 'converted' | 'lost';
export type OpsProspectStatus = 'new' | 'researching' | 'attempted_contact' | 'ready_for_lead' | 'disqualified';
export type OpsCrmEntityType = 'lead' | 'client' | 'prospect';
export type OpsCrmTaskStatus = 'open' | 'completed' | 'cancelled';
export type OpsCrmVisitStatus = 'planned' | 'completed' | 'cancelled';
export type OpsCrmSampleOrderStatus = 'draft' | 'submitted' | 'cancelled';

export interface OpsCrmEntityRef {
  entityType: OpsCrmEntityType;
  entityId: string;
}

export interface OpsClientRecord {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  googlePlaceId?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  status: OpsClientStatus;
  taxProfile: OpsTaxProfileSnapshot;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpsLeadRecord {
  id: string;
  name: string;
  owner: string;
  stage: OpsLeadStage;
  source: 'manual' | 'map';
  googlePlaceId?: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpsProspectRecord {
  id: string;
  name: string;
  owner: string;
  status: OpsProspectStatus;
  source: 'seed' | 'map' | 'manual';
  googlePlaceId?: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  lat: number;
  lng: number;
  lastTouchAt?: string;
  nextTaskAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveOpsLeadResult {
  record: OpsLeadRecord;
  status: 'created' | 'updated' | 'duplicate';
  duplicateId?: string;
}

export interface OpsCrmTaskRecord {
  id: string;
  title: string;
  dueAt: string;
  urgent: boolean;
  assignedUserId: string;
  status: OpsCrmTaskStatus;
  notes: string;
  entityRef: OpsCrmEntityRef;
  createdAt: string;
  updatedAt: string;
}

export interface OpsCrmActivityRecord {
  id: string;
  type: string;
  at: string;
  note: string;
  actor: string;
  entityRef: OpsCrmEntityRef;
  createdAt: string;
  updatedAt: string;
}

export interface OpsCrmSalesVisitRecord {
  id: string;
  salesperson: string;
  date: string;
  startTime: string;
  latestStartTime?: string;
  duration: string;
  status: OpsCrmVisitStatus;
  notes: string;
  entityRef: OpsCrmEntityRef;
  createdAt: string;
  updatedAt: string;
}

export interface OpsCrmSampleOrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface OpsCrmSampleOrderRecord {
  id: string;
  status: OpsCrmSampleOrderStatus;
  items: OpsCrmSampleOrderItem[];
  notes: string;
  entityRef: OpsCrmEntityRef;
  createdAt: string;
  updatedAt: string;
}

export interface OpsCrmState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  clients: OpsClientRecord[];
  leads: OpsLeadRecord[];
  prospects: OpsProspectRecord[];
  tasks: OpsCrmTaskRecord[];
  activities: OpsCrmActivityRecord[];
  visits: OpsCrmSalesVisitRecord[];
  sampleOrders: OpsCrmSampleOrderRecord[];
}

const CLIENT_STORAGE_KEY = 'ops-crm-client-records-v1';
const LEAD_STORAGE_KEY = 'ops-crm-lead-records-v1';
const PROSPECT_STORAGE_KEY = 'ops-crm-prospect-records-v1';
const TASK_STORAGE_KEY = 'ops-crm-task-records-v1';
const ACTIVITY_STORAGE_KEY = 'ops-crm-activity-records-v1';
const VISIT_STORAGE_KEY = 'ops-crm-visit-records-v1';
const SAMPLE_ORDER_STORAGE_KEY = 'ops-crm-sample-order-records-v1';
const CRM_STATE_API_PATH = '/api/ops/crm/state';
const CRM_SCHEMA_VERSION = '1.0.0';

const canUseStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

const defaultOpsCrmState = (): OpsCrmState => ({
  schemaVersion: CRM_SCHEMA_VERSION,
  id: 'ops-crm-state',
  updatedAt: new Date().toISOString(),
  clients: [],
  leads: [],
  prospects: [],
  tasks: [],
  activities: [],
  visits: [],
  sampleOrders: [],
});

let opsCrmStateCache: OpsCrmState = defaultOpsCrmState();
let opsCrmStateLoaded = false;
let opsCrmLoadPromise: Promise<OpsCrmState> | null = null;
let opsCrmPersistPromise: Promise<void> = Promise.resolve();

const toStringValue = (value: unknown): string => (typeof value === 'string' ? value : '');
const toNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeText = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeClientId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `site-${base}` : `site-${Date.now()}`;
};

const normalizeLeadId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `lead-${base}` : `lead-${Date.now()}`;
};

const normalizeProspectId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `prospect-${base}` : `prospect-${Date.now()}`;
};

const normalizeTaskId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `task-${base}` : `task-${Date.now()}`;
};

const normalizeActivityId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `activity-${base}` : `activity-${Date.now()}`;
};

const normalizeVisitId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `visit-${base}` : `visit-${Date.now()}`;
};

const normalizeSampleOrderId = (value: string): string => {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `sample-order-${base}` : `sample-order-${Date.now()}`;
};

const normalizeClientRecord = (value: unknown): OpsClientRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const name = toStringValue(row.name);
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    contactName: toStringValue(row.contactName),
    phone: toStringValue(row.phone),
    email: toStringValue(row.email),
    googlePlaceId: toStringValue(row.googlePlaceId) || undefined,
    address: toStringValue(row.address),
    city: toStringValue(row.city),
    state: toStringValue(row.state),
    zip: toStringValue(row.zip),
    lat: toNumberValue(row.lat) ?? 0,
    lng: toNumberValue(row.lng) ?? 0,
    status: row.status === 'inactive' ? 'inactive' : 'active',
    taxProfile: normalizeOpsTaxProfile(row.taxProfile ?? row.tax_profile),
    notes: toStringValue(row.notes),
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeLeadRecord = (value: unknown): OpsLeadRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const name = toStringValue(row.name);
  if (!id || !name) {
    return null;
  }

  const stageValue = toStringValue(row.stage);
  const stage: OpsLeadStage =
    stageValue === 'contacted' ||
    stageValue === 'qualified' ||
    stageValue === 'proposal' ||
    stageValue === 'converted' ||
    stageValue === 'lost'
      ? stageValue
      : 'prospect';

  const lat = toNumberValue(row.lat);
  const lng = toNumberValue(row.lng);

  return {
    id,
    name,
    owner: toStringValue(row.owner),
    stage,
    source: toStringValue(row.source) === 'map' ? 'map' : 'manual',
    googlePlaceId: toStringValue(row.googlePlaceId) || undefined,
    phone: toStringValue(row.phone),
    email: toStringValue(row.email),
    website: toStringValue(row.website),
    address: toStringValue(row.address),
    city: toStringValue(row.city),
    state: toStringValue(row.state),
    zip: toStringValue(row.zip),
    notes: toStringValue(row.notes),
    lat: lat ?? 0,
    lng: lng ?? 0,
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeProspectRecord = (value: unknown): OpsProspectRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const name = toStringValue(row.name);
  if (!id || !name) {
    return null;
  }

  const statusValue = toStringValue(row.status);
  const status: OpsProspectStatus =
    statusValue === 'researching' ||
    statusValue === 'attempted_contact' ||
    statusValue === 'ready_for_lead' ||
    statusValue === 'disqualified'
      ? statusValue
      : 'new';

  const sourceValue = toStringValue(row.source);
  const source: OpsProspectRecord['source'] =
    sourceValue === 'seed' || sourceValue === 'map' ? sourceValue : 'manual';

  return {
    id,
    name,
    owner: toStringValue(row.owner),
    status,
    source,
    googlePlaceId: toStringValue(row.googlePlaceId) || undefined,
    phone: toStringValue(row.phone),
    email: toStringValue(row.email),
    website: toStringValue(row.website),
    address: toStringValue(row.address),
    city: toStringValue(row.city),
    state: toStringValue(row.state),
    zip: toStringValue(row.zip),
    notes: toStringValue(row.notes),
    lat: toNumberValue(row.lat) ?? 0,
    lng: toNumberValue(row.lng) ?? 0,
    lastTouchAt: toStringValue(row.lastTouchAt) || undefined,
    nextTaskAt: toStringValue(row.nextTaskAt) || undefined,
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeEntityRef = (value: unknown): OpsCrmEntityRef | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const entityTypeValue = toStringValue(row.entityType);
  const entityType: OpsCrmEntityType =
    entityTypeValue === 'lead' || entityTypeValue === 'prospect' ? entityTypeValue : 'client';
  const entityId = toStringValue(row.entityId);
  if (!entityId) {
    return null;
  }
  return {
    entityType,
    entityId,
  };
};

const normalizeTaskRecord = (value: unknown): OpsCrmTaskRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const title = toStringValue(row.title);
  const dueAt = toStringValue(row.dueAt);
  const entityRef = normalizeEntityRef(row.entityRef);
  if (!id || !title || !dueAt || !entityRef) {
    return null;
  }

  const statusValue = toStringValue(row.status);
  const status: OpsCrmTaskStatus =
    statusValue === 'completed' || statusValue === 'cancelled' ? statusValue : 'open';

  return {
    id,
    title,
    dueAt,
    urgent: Boolean(row.urgent),
    assignedUserId: toStringValue(row.assignedUserId),
    status,
    notes: toStringValue(row.notes),
    entityRef,
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeActivityRecord = (value: unknown): OpsCrmActivityRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const type = toStringValue(row.type);
  const at = toStringValue(row.at);
  const entityRef = normalizeEntityRef(row.entityRef);
  if (!id || !type || !at || !entityRef) {
    return null;
  }

  return {
    id,
    type,
    at,
    note: toStringValue(row.note),
    actor: toStringValue(row.actor),
    entityRef,
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeSampleOrderItem = (value: unknown): OpsCrmSampleOrderItem | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const productId = toStringValue(row.productId);
  const productName = toStringValue(row.productName);
  const quantity = toNumberValue(row.quantity) ?? 0;
  if (!productId || !productName || quantity <= 0) {
    return null;
  }
  return {
    productId,
    productName,
    quantity,
  };
};

const normalizeVisitRecord = (value: unknown): OpsCrmSalesVisitRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const salesperson = toStringValue(row.salesperson);
  const date = toStringValue(row.date);
  const startTime = toStringValue(row.startTime);
  const duration = toStringValue(row.duration);
  const entityRef = normalizeEntityRef(row.entityRef);
  if (!id || !salesperson || !date || !startTime || !duration || !entityRef) {
    return null;
  }

  const statusValue = toStringValue(row.status);
  const status: OpsCrmVisitStatus =
    statusValue === 'completed' || statusValue === 'cancelled' ? statusValue : 'planned';

  return {
    id,
    salesperson,
    date,
    startTime,
    latestStartTime: toStringValue(row.latestStartTime) || undefined,
    duration,
    status,
    notes: toStringValue(row.notes),
    entityRef,
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeSampleOrderRecord = (value: unknown): OpsCrmSampleOrderRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = toStringValue(row.id);
  const entityRef = normalizeEntityRef(row.entityRef);
  if (!id || !entityRef) {
    return null;
  }

  const statusValue = toStringValue(row.status);
  const status: OpsCrmSampleOrderStatus =
    statusValue === 'submitted' || statusValue === 'cancelled' ? statusValue : 'draft';

  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items = itemsRaw
    .map(normalizeSampleOrderItem)
    .filter((item): item is OpsCrmSampleOrderItem => Boolean(item));

  return {
    id,
    status,
    items,
    notes: toStringValue(row.notes),
    entityRef,
    createdAt: toStringValue(row.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
  };
};

const normalizeOpsCrmState = (value: unknown): OpsCrmState => {
  const row = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  const normalizeArray = <T>(input: unknown, normalizer: (entry: unknown) => T | null): T[] =>
    (Array.isArray(input) ? input : [])
      .map(normalizer)
      .filter((entry): entry is T => Boolean(entry));

  return {
    schemaVersion: CRM_SCHEMA_VERSION,
    id: 'ops-crm-state',
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
    clients: normalizeArray(row.clients, normalizeClientRecord).sort((a, b) => a.name.localeCompare(b.name)),
    leads: normalizeArray(row.leads, normalizeLeadRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    prospects: normalizeArray(row.prospects, normalizeProspectRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    tasks: normalizeArray(row.tasks, normalizeTaskRecord).sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    activities: normalizeArray(row.activities, normalizeActivityRecord).sort((a, b) => b.at.localeCompare(a.at)),
    visits: normalizeArray(row.visits, normalizeVisitRecord).sort((a, b) => {
      const aKey = `${a.date} ${a.startTime}`;
      const bKey = `${b.date} ${b.startTime}`;
      return bKey.localeCompare(aKey);
    }),
    sampleOrders: normalizeArray(row.sampleOrders, normalizeSampleOrderRecord).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    ),
  };
};

const isOpsCrmStateEmpty = (state: OpsCrmState): boolean =>
  state.clients.length === 0 &&
  state.leads.length === 0 &&
  state.prospects.length === 0 &&
  state.tasks.length === 0 &&
  state.activities.length === 0 &&
  state.visits.length === 0 &&
  state.sampleOrders.length === 0;

const readClientStorage = (): OpsClientRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CLIENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeClientRecord)
      .filter((entry): entry is OpsClientRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readLeadStorage = (): OpsLeadRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEAD_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeLeadRecord)
      .filter((entry): entry is OpsLeadRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readProspectStorage = (): OpsProspectRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PROSPECT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeProspectRecord)
      .filter((entry): entry is OpsProspectRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readTaskStorage = (): OpsCrmTaskRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeTaskRecord)
      .filter((entry): entry is OpsCrmTaskRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readActivityStorage = (): OpsCrmActivityRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeActivityRecord)
      .filter((entry): entry is OpsCrmActivityRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readVisitStorage = (): OpsCrmSalesVisitRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(VISIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeVisitRecord)
      .filter((entry): entry is OpsCrmSalesVisitRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readSampleOrderStorage = (): OpsCrmSampleOrderRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SAMPLE_ORDER_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeSampleOrderRecord)
      .filter((entry): entry is OpsCrmSampleOrderRecord => Boolean(entry));
  } catch {
    return [];
  }
};

const readLegacyOpsCrmState = (): OpsCrmState => {
  return normalizeOpsCrmState({
    clients: readClientStorage(),
    leads: readLeadStorage(),
    prospects: readProspectStorage(),
    tasks: readTaskStorage(),
    activities: readActivityStorage(),
    visits: readVisitStorage(),
    sampleOrders: readSampleOrderStorage(),
  });
};

const clearLegacyOpsCrmStorage = (): void => {
  if (!canUseStorage()) {
    return;
  }
  [
    CLIENT_STORAGE_KEY,
    LEAD_STORAGE_KEY,
    PROSPECT_STORAGE_KEY,
    TASK_STORAGE_KEY,
    ACTIVITY_STORAGE_KEY,
    VISIT_STORAGE_KEY,
    SAMPLE_ORDER_STORAGE_KEY,
  ].forEach((key) => window.localStorage.removeItem(key));
};

const cloneState = (state: OpsCrmState): OpsCrmState =>
  normalizeOpsCrmState(JSON.parse(JSON.stringify(state)) as unknown);

const setOpsCrmStateCache = (nextState: OpsCrmState): OpsCrmState => {
  opsCrmStateCache = cloneState(nextState);
  opsCrmStateLoaded = true;
  return opsCrmStateCache;
};

const persistOpsCrmState = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }
  const persisted = await apiPost<OpsCrmState>(CRM_STATE_API_PATH, opsCrmStateCache);
  setOpsCrmStateCache(normalizeOpsCrmState(persisted));
};

const queueOpsCrmPersist = (): void => {
  opsCrmPersistPromise = opsCrmPersistPromise
    .catch(() => undefined)
    .then(async () => {
      try {
        await persistOpsCrmState();
      } catch (error) {
        console.error('Failed to persist OPS CRM state:', error);
      }
    });
};

export async function flushOpsCrmState(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  await opsCrmPersistPromise.catch(() => undefined);
  await persistOpsCrmState();
}

const ensureOpsCrmLoadStarted = (): void => {
  if (!opsCrmStateLoaded && !opsCrmLoadPromise && typeof window !== 'undefined') {
    void loadOpsCrmState();
  }
};

export async function loadOpsCrmState(force = false): Promise<OpsCrmState> {
  if (typeof window === 'undefined') {
    return opsCrmStateCache;
  }

  if (opsCrmStateLoaded && !force) {
    return opsCrmStateCache;
  }

  if (opsCrmLoadPromise && !force) {
    return opsCrmLoadPromise;
  }

  opsCrmLoadPromise = (async () => {
    try {
      const serverState = normalizeOpsCrmState(await apiGet<OpsCrmState>(CRM_STATE_API_PATH));
      if (isOpsCrmStateEmpty(serverState)) {
        const legacyState = readLegacyOpsCrmState();
        if (!isOpsCrmStateEmpty(legacyState)) {
          setOpsCrmStateCache(legacyState);
          await persistOpsCrmState();
          clearLegacyOpsCrmStorage();
          return opsCrmStateCache;
        }
      }

      setOpsCrmStateCache(serverState);
      return opsCrmStateCache;
    } catch (error) {
      const legacyState = readLegacyOpsCrmState();
      if (!isOpsCrmStateEmpty(legacyState)) {
        setOpsCrmStateCache(legacyState);
        queueOpsCrmPersist();
        return opsCrmStateCache;
      }

      console.error('Failed to load OPS CRM state:', error);
      setOpsCrmStateCache(defaultOpsCrmState());
      return opsCrmStateCache;
    } finally {
      opsCrmLoadPromise = null;
    }
  })();

  return opsCrmLoadPromise;
}

const buildLeadDedupeKey = (value: {
  name: string;
  address?: string;
  phone?: string;
}): string => {
  return [
    normalizeText(value.name),
    normalizeText(value.address),
    normalizeText(value.phone),
  ].join('|');
};

export function findOpsLeadDuplicate(
  input: {
    id?: string;
    name: string;
    address?: string;
    phone?: string;
    googlePlaceId?: string;
  }
): OpsLeadRecord | null {
  const existing = opsCrmStateCache.leads;
  const dedupeKey = buildLeadDedupeKey(input);

  const duplicate = existing.find((entry) => {
    if (input.id && entry.id === input.id) {
      return false;
    }
    if (input.googlePlaceId && entry.googlePlaceId && entry.googlePlaceId === input.googlePlaceId) {
      return true;
    }
    return buildLeadDedupeKey(entry) === dedupeKey && dedupeKey !== '||';
  });

  return duplicate ?? null;
}

export function getOpsClientRecords(): OpsClientRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.clients;
}

export function getOpsClientRecord(clientId: string): OpsClientRecord | null {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.clients.find((record) => record.id === clientId) ?? null;
}

export function saveOpsClientRecord(
  input: Omit<OpsClientRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): OpsClientRecord {
  const existing = opsCrmStateCache.clients;
  const nextId = input.id?.trim() || normalizeClientId(input.name);
  const now = new Date().toISOString();
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsClientRecord = {
    id: nextId,
    name: input.name.trim(),
    contactName: input.contactName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    googlePlaceId: input.googlePlaceId?.trim() || undefined,
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    lat: Number.isFinite(input.lat) ? input.lat : 0,
    lng: Number.isFinite(input.lng) ? input.lng : 0,
    status: input.status,
    taxProfile: buildOpsTaxProfileSnapshot(input.taxProfile ?? current?.taxProfile),
    notes: input.notes.trim(),
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => a.name.localeCompare(b.name));
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    clients: next,
  });
  queueOpsCrmPersist();
  return nextRecord;
}

export function getOpsLeadRecords(): OpsLeadRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.leads;
}

export function getOpsLeadRecord(leadId: string): OpsLeadRecord | null {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.leads.find((record) => record.id === leadId) ?? null;
}

export function saveOpsLeadRecord(
  input: Omit<OpsLeadRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): SaveOpsLeadResult {
  const existing = opsCrmStateCache.leads;
  const now = new Date().toISOString();
  const explicitId = input.id?.trim();
  const duplicate = findOpsLeadDuplicate({
    id: explicitId,
    name: input.name,
    address: input.address,
    phone: input.phone,
    googlePlaceId: input.googlePlaceId,
  });

  if (!explicitId && duplicate) {
    return {
      record: duplicate,
      status: 'duplicate',
      duplicateId: duplicate.id,
    };
  }

  const nextId = explicitId || normalizeLeadId(input.name);
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsLeadRecord = {
    id: nextId,
    name: input.name.trim(),
    owner: input.owner.trim(),
    stage: input.stage,
    source: input.source,
    googlePlaceId: input.googlePlaceId?.trim() || undefined,
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    notes: input.notes.trim(),
    lat: Number.isFinite(input.lat) ? input.lat : 0,
    lng: Number.isFinite(input.lng) ? input.lng : 0,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    leads: next,
  });
  queueOpsCrmPersist();

  return {
    record: nextRecord,
    status: current ? 'updated' : 'created',
  };
}

export function deleteOpsLeadRecord(leadId: string): void {
  const existing = opsCrmStateCache.leads;
  const next = existing.filter((record) => record.id !== leadId);
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: new Date().toISOString(),
    leads: next,
  });
  queueOpsCrmPersist();
}

export function getOpsProspectRecords(): OpsProspectRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.prospects;
}

export function getOpsProspectRecord(prospectId: string): OpsProspectRecord | null {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.prospects.find((record) => record.id === prospectId) ?? null;
}

export function saveOpsProspectRecord(
  input: Omit<OpsProspectRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): OpsProspectRecord {
  const existing = opsCrmStateCache.prospects;
  const now = new Date().toISOString();
  const nextId = input.id?.trim() || normalizeProspectId(input.name);
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsProspectRecord = {
    id: nextId,
    name: input.name.trim(),
    owner: input.owner.trim(),
    status: input.status,
    source: input.source,
    googlePlaceId: input.googlePlaceId?.trim() || undefined,
    phone: input.phone.trim(),
    email: input.email.trim(),
    website: input.website.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    notes: input.notes.trim(),
    lat: Number.isFinite(input.lat) ? input.lat : 0,
    lng: Number.isFinite(input.lng) ? input.lng : 0,
    lastTouchAt: input.lastTouchAt?.trim() || undefined,
    nextTaskAt: input.nextTaskAt?.trim() || undefined,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    prospects: next,
  });
  queueOpsCrmPersist();
  return nextRecord;
}

export function deleteOpsProspectRecord(prospectId: string): void {
  const existing = opsCrmStateCache.prospects;
  const next = existing.filter((record) => record.id !== prospectId);
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: new Date().toISOString(),
    prospects: next,
  });
  queueOpsCrmPersist();
}

export function getOpsCrmTaskRecords(): OpsCrmTaskRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.tasks;
}

export function getOpsCrmTasksForEntity(entityRef: OpsCrmEntityRef): OpsCrmTaskRecord[] {
  return getOpsCrmTaskRecords().filter(
    (record) =>
      record.entityRef.entityType === entityRef.entityType &&
      record.entityRef.entityId === entityRef.entityId
  );
}

export function saveOpsCrmTaskRecord(
  input: Omit<OpsCrmTaskRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): OpsCrmTaskRecord {
  const existing = opsCrmStateCache.tasks;
  const now = new Date().toISOString();
  const nextId = input.id?.trim() || normalizeTaskId(input.title);
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsCrmTaskRecord = {
    id: nextId,
    title: input.title.trim(),
    dueAt: input.dueAt,
    urgent: input.urgent,
    assignedUserId: input.assignedUserId.trim(),
    status: input.status,
    notes: input.notes.trim(),
    entityRef: input.entityRef,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    tasks: next,
  });
  queueOpsCrmPersist();
  return nextRecord;
}

export function getOpsCrmActivityRecords(): OpsCrmActivityRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.activities;
}

export function getOpsCrmActivitiesForEntity(entityRef: OpsCrmEntityRef): OpsCrmActivityRecord[] {
  return getOpsCrmActivityRecords().filter(
    (record) =>
      record.entityRef.entityType === entityRef.entityType &&
      record.entityRef.entityId === entityRef.entityId
  );
}

export function saveOpsCrmActivityRecord(
  input: Omit<OpsCrmActivityRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): OpsCrmActivityRecord {
  const existing = opsCrmStateCache.activities;
  const now = new Date().toISOString();
  const nextId = input.id?.trim() || normalizeActivityId(`${input.type}-${input.at}`);
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsCrmActivityRecord = {
    id: nextId,
    type: input.type.trim(),
    at: input.at,
    note: input.note.trim(),
    actor: input.actor.trim(),
    entityRef: input.entityRef,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => b.at.localeCompare(a.at));
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    activities: next,
  });
  queueOpsCrmPersist();
  return nextRecord;
}

export function getOpsCrmSalesVisitRecords(): OpsCrmSalesVisitRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.visits;
}

export function getOpsCrmSalesVisitsForEntity(entityRef: OpsCrmEntityRef): OpsCrmSalesVisitRecord[] {
  return getOpsCrmSalesVisitRecords().filter(
    (record) =>
      record.entityRef.entityType === entityRef.entityType &&
      record.entityRef.entityId === entityRef.entityId
  );
}

export function saveOpsCrmSalesVisitRecord(
  input: Omit<OpsCrmSalesVisitRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): OpsCrmSalesVisitRecord {
  const existing = opsCrmStateCache.visits;
  const now = new Date().toISOString();
  const nextId = input.id?.trim() || normalizeVisitId(`${input.salesperson}-${input.date}-${input.startTime}`);
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsCrmSalesVisitRecord = {
    id: nextId,
    salesperson: input.salesperson.trim(),
    date: input.date,
    startTime: input.startTime,
    latestStartTime: input.latestStartTime?.trim() || undefined,
    duration: input.duration.trim(),
    status: input.status,
    notes: input.notes.trim(),
    entityRef: input.entityRef,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => {
    const aKey = `${a.date} ${a.startTime}`;
    const bKey = `${b.date} ${b.startTime}`;
    return bKey.localeCompare(aKey);
  });
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    visits: next,
  });
  queueOpsCrmPersist();
  return nextRecord;
}

export function getOpsCrmSampleOrderRecords(): OpsCrmSampleOrderRecord[] {
  ensureOpsCrmLoadStarted();
  return opsCrmStateCache.sampleOrders;
}

export function getOpsCrmSampleOrdersForEntity(entityRef: OpsCrmEntityRef): OpsCrmSampleOrderRecord[] {
  return getOpsCrmSampleOrderRecords().filter(
    (record) =>
      record.entityRef.entityType === entityRef.entityType &&
      record.entityRef.entityId === entityRef.entityId
  );
}

export function saveOpsCrmSampleOrderRecord(
  input: Omit<OpsCrmSampleOrderRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): OpsCrmSampleOrderRecord {
  const existing = opsCrmStateCache.sampleOrders;
  const now = new Date().toISOString();
  const idSeed = `${input.entityRef.entityType}-${input.entityRef.entityId}-${input.items.map((item) => item.productId).join('-')}`;
  const nextId = input.id?.trim() || normalizeSampleOrderId(idSeed);
  const current = existing.find((record) => record.id === nextId);

  const nextRecord: OpsCrmSampleOrderRecord = {
    id: nextId,
    status: input.status,
    items: input.items.map((item) => ({
      productId: item.productId.trim(),
      productName: item.productName.trim(),
      quantity: Math.max(1, Math.floor(item.quantity)),
    })),
    notes: input.notes.trim(),
    entityRef: input.entityRef,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const withoutCurrent = existing.filter((record) => record.id !== nextId);
  const next = [...withoutCurrent, nextRecord].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  setOpsCrmStateCache({
    ...opsCrmStateCache,
    updatedAt: now,
    sampleOrders: next,
  });
  queueOpsCrmPersist();
  return nextRecord;
}
