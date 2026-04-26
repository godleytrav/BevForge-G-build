import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import handler from './POST';

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
const opsFeedFile = path.join(repoRoot, 'commissioning', 'ops', 'calendar-events.json');
const createdEventIds: string[] = [];

const createRes = () =>
  ({
    statusCode: 0,
    payload: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  }) as {
    statusCode: number;
    payload: unknown;
    status: (code: number) => any;
    json: (payload: unknown) => any;
  };

afterEach(async () => {
  if (!existsSync(opsFeedFile) || createdEventIds.length === 0) {
    return;
  }

  let parsed: { events?: Array<{ id?: string }>; updatedAt?: string };
  try {
    parsed = JSON.parse(await fs.readFile(opsFeedFile, 'utf8')) as {
      events?: Array<{ id?: string }>;
      updatedAt?: string;
    };
  } catch {
    createdEventIds.length = 0;
    return;
  }
  parsed.events = (parsed.events ?? []).filter(
    (event) => !createdEventIds.includes(event.id ?? '')
  );
  parsed.updatedAt = new Date().toISOString();
  await fs.writeFile(opsFeedFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  createdEventIds.length = 0;
});

describe('POST /api/calendar/events handler', () => {
  it('creates an OPS calendar event and returns success payload', async () => {
    const eventId = `evt-api-create-${Date.now().toString(36)}`;
    const req = {
      body: {
        id: eventId,
        sourceSuite: 'ops',
        title: 'OPS Create Path Test',
        type: 'delivery',
        status: 'planned',
        startAt: '2026-03-13T10:00:00.000Z',
        endAt: '2026-03-13T11:00:00.000Z',
        sourceRecordId: 'route-123',
        links: {
          openPath: '/ops/logistics/routes/route-123',
        },
        metadata: {
          origin: 'ops-calendar-post-test',
        },
      },
    } as { body: Record<string, unknown> };

    const res = createRes();
    await handler(req as any, res as any);

    createdEventIds.push(eventId);
    const payload = res.payload as {
      success?: boolean;
      data?: { id?: string; sourceSuite?: string; sourceRecordId?: string };
      meta?: { idempotent?: boolean };
    };

    expect(res.statusCode).toBe(201);
    expect(payload?.success).toBe(true);
    expect(payload?.data?.id).toBe(eventId);
    expect(payload?.data?.sourceSuite).toBe('ops');
    expect(payload?.data?.sourceRecordId).toBe('route-123');
    expect(payload?.meta?.idempotent).toBe(false);
  });

  it('returns idempotent metadata on duplicate create IDs', async () => {
    const eventId = `evt-api-idem-${Date.now().toString(36)}`;
    const req = {
      body: {
        id: eventId,
        sourceSuite: 'ops',
        title: 'OPS API Idempotency Test',
        type: 'delivery',
        status: 'planned',
        startAt: '2026-03-13T10:00:00.000Z',
        endAt: '2026-03-13T11:00:00.000Z',
      },
    } as { body: Record<string, unknown> };

    const first = createRes();
    await handler(req as any, first as any);
    const second = createRes();
    await handler(req as any, second as any);

    createdEventIds.push(eventId);
    const firstPayload = first.payload as { success?: boolean; meta?: { idempotent?: boolean } };
    const secondPayload = second.payload as { success?: boolean; meta?: { idempotent?: boolean } };

    expect(first.statusCode).toBe(201);
    expect(firstPayload?.success).toBe(true);
    expect(firstPayload?.meta?.idempotent).toBe(false);

    expect(second.statusCode).toBe(200);
    expect(secondPayload?.success).toBe(true);
    expect(secondPayload?.meta?.idempotent).toBe(true);
  });
});
