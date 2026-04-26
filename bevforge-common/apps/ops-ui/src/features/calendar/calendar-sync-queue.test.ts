import { describe, expect, it } from 'vitest';
import {
  isTransientHttpStatus,
  queueCalendarSyncFailure,
  readCalendarSyncQueue,
  replayCalendarSyncQueue,
  writeCalendarSyncQueue,
  type CalendarCreateRequestPayload,
  type StorageLike,
} from './calendar-sync-queue';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

const basePayload = (id: string): CalendarCreateRequestPayload => ({
  id,
  sourceSuite: 'ops',
  title: 'Delivery Window',
  type: 'delivery',
  status: 'planned',
  startAt: '2026-03-10T15:00:00.000Z',
});

describe('calendar-sync-queue', () => {
  it('queues duplicate payload ids idempotently and increments attempts', () => {
    const storage = new MemoryStorage();
    queueCalendarSyncFailure(storage, basePayload('evt-1'), 'network');
    queueCalendarSyncFailure(storage, basePayload('evt-1'), 'timeout');

    const queue = readCalendarSyncQueue(storage);
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.id).toBe('evt-1');
    expect(queue[0].attemptCount).toBe(2);
    expect(queue[0].lastError).toContain('timeout');
  });

  it('replays successful entries and clears queue', async () => {
    const storage = new MemoryStorage();
    queueCalendarSyncFailure(storage, basePayload('evt-1'), 'network');
    queueCalendarSyncFailure(storage, basePayload('evt-2'), 'network');

    const seen: string[] = [];
    const result = await replayCalendarSyncQueue(storage, {
      postPayload: async (payload) => {
        seen.push(payload.id);
        return { ok: true, status: 201 };
      },
    });

    expect(result.delivered).toBe(2);
    expect(result.remaining).toBe(0);
    expect(result.attempted).toBe(2);
    expect(seen).toEqual(['evt-1', 'evt-2']);
    expect(readCalendarSyncQueue(storage)).toHaveLength(0);
  });

  it('keeps transient failures in queue and drops permanent errors', async () => {
    const storage = new MemoryStorage();
    writeCalendarSyncQueue(storage, [
      {
        queueId: 'q-1',
        payload: basePayload('evt-a'),
        attemptCount: 1,
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      },
      {
        queueId: 'q-2',
        payload: basePayload('evt-b'),
        attemptCount: 1,
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      },
    ]);

    const result = await replayCalendarSyncQueue(storage, {
      postPayload: async (payload) => {
        if (payload.id === 'evt-a') {
          return { ok: false, status: 500, message: 'server down' };
        }
        return { ok: false, status: 400, message: 'invalid payload' };
      },
    });

    const queue = readCalendarSyncQueue(storage);
    expect(result.delivered).toBe(0);
    expect(result.attempted).toBe(1);
    expect(queue).toHaveLength(2);
    expect(queue[0].payload.id).toBe('evt-a');
    expect(queue[0].attemptCount).toBe(2);
    expect(queue[1].payload.id).toBe('evt-b');
  });

  it('drops non-transient 4xx entries and continues replay', async () => {
    const storage = new MemoryStorage();
    writeCalendarSyncQueue(storage, [
      {
        queueId: 'q-1',
        payload: basePayload('evt-a'),
        attemptCount: 1,
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      },
      {
        queueId: 'q-2',
        payload: basePayload('evt-b'),
        attemptCount: 1,
        createdAt: '2026-03-04T00:00:00.000Z',
        updatedAt: '2026-03-04T00:00:00.000Z',
      },
    ]);

    const seen: string[] = [];
    const result = await replayCalendarSyncQueue(storage, {
      postPayload: async (payload) => {
        seen.push(payload.id);
        if (payload.id === 'evt-a') {
          return { ok: false, status: 400, message: 'invalid payload' };
        }
        return { ok: true, status: 201 };
      },
    });

    expect(result.attempted).toBe(2);
    expect(result.delivered).toBe(1);
    expect(result.remaining).toBe(0);
    expect(seen).toEqual(['evt-a', 'evt-b']);
    expect(readCalendarSyncQueue(storage)).toHaveLength(0);
  });

  it('flags transient http statuses correctly', () => {
    expect(isTransientHttpStatus(500)).toBe(true);
    expect(isTransientHttpStatus(429)).toBe(true);
    expect(isTransientHttpStatus(400)).toBe(false);
  });
});
