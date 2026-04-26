export interface CalendarCreateRequestPayload {
  id: string;
  sourceSuite: 'os' | 'ops' | 'lab' | 'flow' | 'connect';
  title: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  startAt: string;
  endAt?: string;
  timezone?: string;
  allDay?: boolean;
  siteId?: string;
  sourceRecordId?: string;
  tags?: string[];
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface CalendarSyncQueueEntry {
  queueId: string;
  payload: CalendarCreateRequestPayload;
  attemptCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = 'bevforge.calendar.failed-sync-queue.v1';
const MAX_QUEUE_SIZE = 200;

const nowIso = (): string => new Date().toISOString();

export const isTransientHttpStatus = (status: number): boolean =>
  status === 0 || status === 408 || status === 425 || status === 429 || status >= 500;

export const makeCalendarEventId = (): string =>
  `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const parseQueue = (raw: string | null): CalendarSyncQueueEntry[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is CalendarSyncQueueEntry => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }
      const payload = (entry as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') {
        return false;
      }
      const payloadId = String((payload as { id?: unknown }).id ?? '').trim();
      return payloadId.length > 0;
    });
  } catch {
    return [];
  }
};

export const readCalendarSyncQueue = (storage: StorageLike): CalendarSyncQueueEntry[] =>
  parseQueue(storage.getItem(STORAGE_KEY));

export const writeCalendarSyncQueue = (
  storage: StorageLike,
  entries: CalendarSyncQueueEntry[]
): CalendarSyncQueueEntry[] => {
  const normalized = [...entries]
    .filter((entry) => String(entry?.payload?.id ?? '').trim().length > 0)
    .slice(-MAX_QUEUE_SIZE);

  if (normalized.length === 0) {
    storage.removeItem(STORAGE_KEY);
    return [];
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const queueCalendarSyncFailure = (
  storage: StorageLike,
  payload: CalendarCreateRequestPayload,
  errorMessage: string
): CalendarSyncQueueEntry[] => {
  const now = nowIso();
  const queue = readCalendarSyncQueue(storage);
  const existingIndex = queue.findIndex((entry) => entry.payload.id === payload.id);
  const queueId = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (existingIndex >= 0) {
    const current = queue[existingIndex];
    const attempt = Number.isFinite(current.attemptCount) ? current.attemptCount + 1 : 1;
    const retryDelaySeconds = Math.min(300, attempt * 10);
    queue[existingIndex] = {
      ...current,
      payload,
      attemptCount: attempt,
      lastError: errorMessage,
      updatedAt: now,
      nextRetryAt: new Date(Date.now() + retryDelaySeconds * 1000).toISOString(),
    };
    return writeCalendarSyncQueue(storage, queue);
  }

  queue.push({
    queueId,
    payload,
    attemptCount: 1,
    lastError: errorMessage,
    createdAt: now,
    updatedAt: now,
    nextRetryAt: now,
  });

  return writeCalendarSyncQueue(storage, queue);
};

export interface ReplayResult {
  delivered: number;
  remaining: number;
  attempted: number;
}

export interface ReplayCallbacks {
  postPayload: (
    payload: CalendarCreateRequestPayload
  ) => Promise<{ ok: boolean; status: number; message?: string }>;
}

export const replayCalendarSyncQueue = async (
  storage: StorageLike,
  callbacks: ReplayCallbacks
): Promise<ReplayResult> => {
  const queue = readCalendarSyncQueue(storage);
  if (queue.length === 0) {
    return { delivered: 0, remaining: 0, attempted: 0 };
  }

  const nowMs = Date.now();
  const remaining: CalendarSyncQueueEntry[] = [];
  let delivered = 0;
  let attempted = 0;
  let stopReplay = false;

  const updateFailureEntry = (
    entry: CalendarSyncQueueEntry,
    message: string
  ): CalendarSyncQueueEntry => {
    const attempt = Number.isFinite(entry.attemptCount) ? entry.attemptCount + 1 : 1;
    const retryDelaySeconds = Math.min(300, attempt * 10);
    return {
      ...entry,
      attemptCount: attempt,
      lastError: message,
      updatedAt: nowIso(),
      nextRetryAt: new Date(Date.now() + retryDelaySeconds * 1000).toISOString(),
    };
  };

  for (let index = 0; index < queue.length; index += 1) {
    const entry = queue[index];
    if (stopReplay) {
      remaining.push(entry);
      continue;
    }

    const retryAtMs = entry.nextRetryAt ? Date.parse(entry.nextRetryAt) : 0;
    if (Number.isFinite(retryAtMs) && retryAtMs > nowMs) {
      remaining.push(entry);
      continue;
    }

    attempted += 1;
    try {
      const response = await callbacks.postPayload(entry.payload);
      if (response.ok) {
        delivered += 1;
        continue;
      }
      if (!isTransientHttpStatus(response.status)) {
        continue;
      }
      remaining.push(
        updateFailureEntry(entry, response.message ?? `HTTP ${response.status}`)
      );
      stopReplay = true;
      continue;
    } catch (error) {
      remaining.push(
        updateFailureEntry(
          entry,
          error instanceof Error ? error.message : 'Network error'
        )
      );
      stopReplay = true;
      continue;
    }
  }

  const finalQueue = writeCalendarSyncQueue(storage, remaining);
  return { delivered, remaining: finalQueue.length, attempted };
};
