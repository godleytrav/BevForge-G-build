import path from 'node:path';
import { commissioningPaths, ensureCommissioningStore } from './commissioning-store.js';
import {
  listFulfillmentRequests,
  type FulfillmentRequestRecord,
  type FulfillmentRequestStatus,
} from './inventory-batch-store.js';
import {
  readUnifiedCalendarProjection,
  type CalendarEventRecord,
  type CalendarSuiteId,
} from './calendar-store.js';

export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory =
  | 'schedule'
  | 'requests'
  | 'compliance'
  | 'operations'
  | 'manual';
export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface NotificationRecord {
  schemaVersion: string;
  id: string;
  kind: 'derived' | 'manual';
  category: NotificationCategory;
  level: NotificationLevel;
  title: string;
  message: string;
  sourceSuite?: CalendarSuiteId | 'os';
  sourceType?: 'calendar' | 'fulfillment_request' | 'manual';
  sourceRecordId?: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  readAt?: string;
  dismissedAt?: string;
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

interface ManualNotificationRecord {
  schemaVersion: string;
  id: string;
  category: NotificationCategory;
  level: NotificationLevel;
  title: string;
  message: string;
  sourceSuite?: 'os';
  sourceType: 'manual';
  sourceRecordId?: string;
  createdAt: string;
  updatedAt: string;
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

interface NotificationStateEntry {
  id: string;
  readAt?: string;
  dismissedAt?: string;
  updatedAt: string;
}

interface NotificationCenterState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  manual: ManualNotificationRecord[];
  states: NotificationStateEntry[];
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
}

export interface NotificationListResult {
  notifications: NotificationRecord[];
  summary: NotificationSummary;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  level?: NotificationLevel;
  category?: NotificationCategory;
  sourceRecordId?: string;
  openPath?: string;
  openUrl?: string;
  metadata?: Record<string, unknown>;
}

const notificationsFile = path.join(commissioningPaths.root, 'notifications.json');
const nowIso = (): string => new Date().toISOString();

const defaultState = (): NotificationCenterState => ({
  schemaVersion: '1.0.0',
  id: 'os-notifications',
  updatedAt: nowIso(),
  manual: [],
  states: [],
});

const emptySummary = (): NotificationSummary => ({
  total: 0,
  unread: 0,
  byCategory: {
    schedule: 0,
    requests: 0,
    compliance: 0,
    operations: 0,
    manual: 0,
  },
});

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

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const module = await import('node:fs/promises');
    const raw = await module.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown): Promise<void> => {
  const module = await import('node:fs/promises');
  await module.mkdir(path.dirname(filePath), { recursive: true });
  await module.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const normalizeCategory = (value: unknown): NotificationCategory => {
  const normalized = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (
    normalized === 'schedule' ||
    normalized === 'requests' ||
    normalized === 'compliance' ||
    normalized === 'operations' ||
    normalized === 'manual'
  ) {
    return normalized;
  }
  return 'manual';
};

const normalizeLevel = (value: unknown): NotificationLevel => {
  const normalized = toText(value)?.toLowerCase();
  if (
    normalized === 'info' ||
    normalized === 'warning' ||
    normalized === 'error' ||
    normalized === 'success'
  ) {
    return normalized;
  }
  return 'info';
};

const normalizeManualRecord = (
  value: ManualNotificationRecord | Record<string, unknown>,
  index: number
): ManualNotificationRecord | null => {
  const title = toText(value.title);
  const message = toText(value.message);
  const createdAt = toIso(value.createdAt) ?? nowIso();
  if (!title || !message) return null;

  return {
    schemaVersion: toText(value.schemaVersion) ?? '1.0.0',
    id: toText(value.id) ?? `manual-notification-${index + 1}`,
    category: normalizeCategory(value.category),
    level: normalizeLevel(value.level),
    title,
    message,
    sourceSuite: 'os',
    sourceType: 'manual',
    sourceRecordId: toText(value.sourceRecordId),
    createdAt,
    updatedAt: toIso(value.updatedAt) ?? createdAt,
    links:
      toText((value.links as Record<string, unknown> | undefined)?.openPath) ||
      toText((value.links as Record<string, unknown> | undefined)?.openUrl)
        ? {
            openPath: toText((value.links as Record<string, unknown> | undefined)?.openPath),
            openUrl: toText((value.links as Record<string, unknown> | undefined)?.openUrl),
          }
        : undefined,
    metadata:
      value.metadata && typeof value.metadata === 'object'
        ? (value.metadata as Record<string, unknown>)
        : undefined,
  };
};

const normalizeStateEntry = (
  value: NotificationStateEntry | Record<string, unknown>,
  index: number
): NotificationStateEntry | null => {
  const id = toText(value.id);
  if (!id) return null;
  return {
    id,
    readAt: toIso(value.readAt),
    dismissedAt: toIso(value.dismissedAt),
    updatedAt: toIso(value.updatedAt) ?? nowIso(),
  };
};

const readNotificationState = async (): Promise<NotificationCenterState> => {
  await ensureCommissioningStore();
  const raw = await readJsonOrDefault<NotificationCenterState | Record<string, unknown>>(
    notificationsFile,
    defaultState()
  );
  const manualRaw = Array.isArray(raw.manual) ? raw.manual : [];
  const statesRaw = Array.isArray(raw.states) ? raw.states : [];
  return {
    schemaVersion: toText(raw.schemaVersion) ?? '1.0.0',
    id: toText(raw.id) ?? 'os-notifications',
    updatedAt: toIso(raw.updatedAt) ?? nowIso(),
    manual: manualRaw
      .map((entry, index) => normalizeManualRecord(entry as Record<string, unknown>, index))
      .filter((entry): entry is ManualNotificationRecord => entry !== null)
      .slice(0, 500),
    states: statesRaw
      .map((entry, index) => normalizeStateEntry(entry as Record<string, unknown>, index))
      .filter((entry): entry is NotificationStateEntry => entry !== null),
  };
};

const writeNotificationState = async (state: NotificationCenterState): Promise<void> => {
  await ensureCommissioningStore();
  await writeJson(notificationsFile, {
    ...state,
    updatedAt: nowIso(),
  });
};

const formatEventLead = (dueAt: string): string => {
  const now = Date.now();
  const dueMs = Date.parse(dueAt);
  const diffMs = dueMs - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 24) return `Overdue by ${Math.max(1, overdueHours)} hr`;
    const overdueDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
  }
  if (diffHours < 24) return `Due in ${Math.max(1, diffHours)} hr`;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
};

const categoryFromCalendarEvent = (event: CalendarEventRecord): NotificationCategory => {
  if (event.type === 'compliance') return 'compliance';
  if (event.type === 'schedule' || event.type === 'production') return 'schedule';
  return 'operations';
};

const levelFromCalendarEvent = (event: CalendarEventRecord): NotificationLevel => {
  const dueMs = Date.parse(event.startAt);
  const now = Date.now();
  if (event.status === 'blocked') return 'warning';
  if (Number.isFinite(dueMs) && dueMs < now) return 'warning';
  if (Number.isFinite(dueMs) && dueMs - now <= 1000 * 60 * 60 * 24) return 'warning';
  return 'info';
};

const buildCalendarNotification = (event: CalendarEventRecord): NotificationRecord => ({
  schemaVersion: '1.0.0',
  id: `calendar:${event.id}`,
  kind: 'derived',
  category: categoryFromCalendarEvent(event),
  level: levelFromCalendarEvent(event),
  title: event.title,
  message: [formatEventLead(event.startAt), event.description].filter(Boolean).join(' • '),
  sourceSuite: event.sourceSuite,
  sourceType: 'calendar',
  sourceRecordId: event.sourceRecordId,
  status: 'unread',
  createdAt: event.startAt,
  updatedAt: event.startAt,
  dueAt: event.startAt,
  links: event.links,
  metadata:
    event.metadata && typeof event.metadata === 'object'
      ? { ...event.metadata, calendarEventId: event.id, eventType: event.type, eventStatus: event.status }
      : { calendarEventId: event.id, eventType: event.type, eventStatus: event.status },
});

const requestLevel = (status: FulfillmentRequestStatus): NotificationLevel => {
  if (status === 'blocked') return 'warning';
  if (status === 'completed') return 'success';
  return 'info';
};

const requestTitle = (request: FulfillmentRequestRecord): string => {
  if (request.status === 'blocked') return `Fulfillment blocked: ${request.requestId}`;
  if (request.status === 'in_progress') return `Fulfillment in progress: ${request.requestId}`;
  if (request.status === 'accepted') return `Fulfillment accepted: ${request.requestId}`;
  return `Fulfillment queued: ${request.requestId}`;
};

const buildRequestNotification = (request: FulfillmentRequestRecord): NotificationRecord => ({
  schemaVersion: '1.0.0',
  id: `request:${request.requestId}`,
  kind: 'derived',
  category: 'requests',
  level: requestLevel(request.status),
  title: requestTitle(request),
  message: `${request.type} • ${request.requestedQty} ${request.uom} • ${request.skuId}`,
  sourceSuite: request.sourceSuite,
  sourceType: 'fulfillment_request',
  sourceRecordId: request.requestId,
  status: 'unread',
  createdAt: request.updatedAt,
  updatedAt: request.updatedAt,
  links: {
    openPath: '/os/requests',
  },
  metadata: {
    requestId: request.requestId,
    requestType: request.type,
    requestStatus: request.status,
    siteId: request.siteId,
    skuId: request.skuId,
  },
});

const buildManualNotification = (record: ManualNotificationRecord): NotificationRecord => ({
  schemaVersion: record.schemaVersion,
  id: record.id,
  kind: 'manual',
  category: record.category,
  level: record.level,
  title: record.title,
  message: record.message,
  sourceSuite: 'os',
  sourceType: 'manual',
  sourceRecordId: record.sourceRecordId,
  status: 'unread',
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  links: record.links,
  metadata: record.metadata,
});

const applyState = (
  notification: NotificationRecord,
  state: NotificationStateEntry | undefined
): NotificationRecord | null => {
  if (!state) return notification;
  if (state.dismissedAt) {
    return {
      ...notification,
      status: 'dismissed',
      dismissedAt: state.dismissedAt,
      readAt: state.readAt,
      updatedAt: state.updatedAt,
    };
  }
  if (state.readAt) {
    return {
      ...notification,
      status: 'read',
      readAt: state.readAt,
      updatedAt: state.updatedAt,
    };
  }
  return notification;
};

const sortNotifications = (notifications: NotificationRecord[]): NotificationRecord[] =>
  [...notifications].sort((left, right) => {
    const leftUnread = left.status === 'unread' ? 0 : 1;
    const rightUnread = right.status === 'unread' ? 0 : 1;
    if (leftUnread !== rightUnread) return leftUnread - rightUnread;

    const leftDue = left.dueAt ? Date.parse(left.dueAt) : Number.POSITIVE_INFINITY;
    const rightDue = right.dueAt ? Date.parse(right.dueAt) : Number.POSITIVE_INFINITY;
    if (Number.isFinite(leftDue) || Number.isFinite(rightDue)) {
      if (leftDue !== rightDue) return leftDue - rightDue;
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });

const summarize = (notifications: NotificationRecord[]): NotificationSummary => {
  const summary = emptySummary();
  for (const notification of notifications) {
    summary.total += 1;
    summary.byCategory[notification.category] += 1;
    if (notification.status === 'unread') summary.unread += 1;
  }
  return summary;
};

export const listNotifications = async (): Promise<NotificationListResult> => {
  const [state, calendarProjection, fulfillmentRequests] = await Promise.all([
    readNotificationState(),
    readUnifiedCalendarProjection({
      from: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      statuses: ['planned', 'in_progress', 'blocked'],
      types: ['schedule', 'production', 'compliance', 'task'],
    }),
    listFulfillmentRequests(),
  ]);

  const stateById = new Map(state.states.map((entry) => [entry.id, entry]));

  const derivedCalendar = calendarProjection.events
    .map((event) => buildCalendarNotification(event))
    .map((notification) => applyState(notification, stateById.get(notification.id)))
    .filter((notification): notification is NotificationRecord => notification !== null)
    .filter((notification) => notification.status !== 'dismissed');

  const requestNotifications = fulfillmentRequests
    .filter((request) =>
      request.status === 'queued' ||
      request.status === 'accepted' ||
      request.status === 'in_progress' ||
      request.status === 'blocked'
    )
    .map((request) => buildRequestNotification(request))
    .map((notification) => applyState(notification, stateById.get(notification.id)))
    .filter((notification): notification is NotificationRecord => notification !== null)
    .filter((notification) => notification.status !== 'dismissed');

  const manualNotifications = state.manual
    .map((record) => buildManualNotification(record))
    .map((notification) => applyState(notification, stateById.get(notification.id)))
    .filter((notification): notification is NotificationRecord => notification !== null)
    .filter((notification) => notification.status !== 'dismissed');

  const notifications = sortNotifications([
    ...derivedCalendar,
    ...requestNotifications,
    ...manualNotifications,
  ]);

  return {
    notifications,
    summary: summarize(notifications),
  };
};

const upsertStateEntry = (
  state: NotificationCenterState,
  id: string,
  patch: Partial<NotificationStateEntry>
): NotificationCenterState => {
  const nextUpdatedAt = nowIso();
  const index = state.states.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return {
      ...state,
      updatedAt: nextUpdatedAt,
      states: [
        {
          id,
          readAt: patch.readAt,
          dismissedAt: patch.dismissedAt,
          updatedAt: nextUpdatedAt,
        },
        ...state.states,
      ],
    };
  }
  const current = state.states[index];
  const nextEntry: NotificationStateEntry = {
    ...current,
    ...patch,
    updatedAt: nextUpdatedAt,
  };
  const nextStates = [...state.states];
  nextStates[index] = nextEntry;
  return {
    ...state,
    updatedAt: nextUpdatedAt,
    states: nextStates,
  };
};

export const createNotification = async (
  input: CreateNotificationInput
): Promise<NotificationRecord> => {
  const title = toText(input.title);
  const message = toText(input.message);
  if (!title || !message) {
    throw new Error('Validation: title and message are required.');
  }

  const state = await readNotificationState();
  const createdAt = nowIso();
  const manualRecord: ManualNotificationRecord = {
    schemaVersion: '1.0.0',
    id:
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `notification-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    category: input.category ?? 'manual',
    level: input.level ?? 'info',
    title,
    message,
    sourceSuite: 'os',
    sourceType: 'manual',
    sourceRecordId: toText(input.sourceRecordId),
    createdAt,
    updatedAt: createdAt,
    links:
      toText(input.openPath) || toText(input.openUrl)
        ? {
            openPath: toText(input.openPath),
            openUrl: toText(input.openUrl),
          }
        : undefined,
    metadata: input.metadata,
  };

  const nextState: NotificationCenterState = {
    ...state,
    updatedAt: createdAt,
    manual: [manualRecord, ...state.manual].slice(0, 500),
  };
  await writeNotificationState(nextState);
  return buildManualNotification(manualRecord);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const normalizedId = toText(id);
  if (!normalizedId) {
    throw new Error('Validation: notification id is required.');
  }
  const state = await readNotificationState();
  await writeNotificationState(
    upsertStateEntry(state, normalizedId, {
      readAt: nowIso(),
      dismissedAt: undefined,
    })
  );
};

export const dismissNotification = async (id: string): Promise<void> => {
  const normalizedId = toText(id);
  if (!normalizedId) {
    throw new Error('Validation: notification id is required.');
  }
  const now = nowIso();
  const state = await readNotificationState();
  await writeNotificationState(
    upsertStateEntry(state, normalizedId, {
      readAt: now,
      dismissedAt: now,
    })
  );
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const [state, listing] = await Promise.all([readNotificationState(), listNotifications()]);
  let nextState = state;
  const now = nowIso();
  for (const notification of listing.notifications) {
    if (notification.status !== 'unread') continue;
    nextState = upsertStateEntry(nextState, notification.id, {
      readAt: now,
      dismissedAt: undefined,
    });
  }
  await writeNotificationState(nextState);
};
