import { apiPost } from '@/lib/api';

export type OpsCalendarEventStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'blocked';

export type OpsCalendarEventPriority = 'low' | 'medium' | 'high' | 'critical';

interface OpsCalendarEventLinks {
  openPath?: string;
  openUrl?: string;
}

export interface OpsCalendarEventInput {
  sourceRecordId?: string;
  siteId?: string;
  title: string;
  description?: string;
  type: string;
  status?: OpsCalendarEventStatus;
  priority?: OpsCalendarEventPriority;
  startAt?: string;
  endAt?: string;
  links?: OpsCalendarEventLinks;
  metadata?: Record<string, unknown>;
}

export interface OpsCalendarSyncLogEntry {
  id: string;
  createdAt: string;
  success: boolean;
  title: string;
  type: string;
  sourceRecordId?: string;
  origin?: string;
  error?: string;
}

export const OPS_CALENDAR_SYNC_EVENT = 'ops-calendar-sync-updated';

const OPS_CALENDAR_SYNC_STORAGE_KEY = 'ops-calendar-sync-log-v1';
const OPS_CALENDAR_SYNC_LOG_LIMIT = 50;

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.localStorage);

const readSyncStorage = (): OpsCalendarSyncLogEntry[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OPS_CALENDAR_SYNC_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is OpsCalendarSyncLogEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { id?: unknown }).id === 'string' &&
        typeof (entry as { createdAt?: unknown }).createdAt === 'string' &&
        typeof (entry as { success?: unknown }).success === 'boolean' &&
        typeof (entry as { title?: unknown }).title === 'string' &&
        typeof (entry as { type?: unknown }).type === 'string'
    );
  } catch {
    return [];
  }
};

const writeSyncStorage = (entries: OpsCalendarSyncLogEntry[]) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(OPS_CALENDAR_SYNC_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new globalThis.Event(OPS_CALENDAR_SYNC_EVENT));
};

const appendSyncLog = (
  event: OpsCalendarEventInput,
  success: boolean,
  error?: string
) => {
  if (!canUseStorage()) {
    return;
  }

  const originValue = event.metadata?.origin;
  const origin = typeof originValue === 'string' ? originValue : undefined;

  const entry: OpsCalendarSyncLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    success,
    title: event.title,
    type: event.type,
    sourceRecordId: event.sourceRecordId,
    origin,
    error,
  };

  const next = [entry, ...readSyncStorage()].slice(0, OPS_CALENDAR_SYNC_LOG_LIMIT);
  writeSyncStorage(next);
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unknown calendar sync error';
};

export function getOpsCalendarSyncLog(): OpsCalendarSyncLogEntry[] {
  return readSyncStorage();
}

export function clearOpsCalendarSyncLog(): void {
  writeSyncStorage([]);
}

export const makeOpsCalendarRecordId = (
  prefix: string,
  ...parts: Array<string | number | undefined>
): string => {
  const stable = parts
    .map((value) => (typeof value === 'string' || typeof value === 'number' ? String(value) : ''))
    .filter((value) => value.length > 0)
    .join('-');
  return stable ? `${prefix}-${stable}-${Date.now()}` : `${prefix}-${Date.now()}`;
};

export async function postOpsCalendarEvent(event: OpsCalendarEventInput): Promise<boolean> {
  const payload = {
    sourceSuite: 'ops' as const,
    status: 'planned' as OpsCalendarEventStatus,
    priority: 'medium' as OpsCalendarEventPriority,
    startAt: new Date().toISOString(),
    ...event,
  };

  try {
    await apiPost('/api/calendar/events', payload);
    appendSyncLog(payload, true);
    return true;
  } catch (error) {
    console.error('Failed to sync OPS calendar event', error);
    appendSyncLog(payload, false, toErrorMessage(error));
    return false;
  }
}
