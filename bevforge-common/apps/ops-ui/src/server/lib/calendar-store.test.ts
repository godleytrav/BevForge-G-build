import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createCalendarEvent } from './calendar-store';

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
const labFeedFile = path.join(repoRoot, 'commissioning', 'lab', 'calendar-events.json');
const createdEventIds: string[] = [];

afterEach(async () => {
  if (!existsSync(labFeedFile) || createdEventIds.length === 0) {
    return;
  }

  let parsed: { events?: Array<{ id?: string }>; updatedAt?: string };
  try {
    parsed = JSON.parse(await fs.readFile(labFeedFile, 'utf8')) as {
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
  await fs.writeFile(labFeedFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  createdEventIds.length = 0;
});

describe('calendar-store createCalendarEvent', () => {
  it('returns idempotent success for duplicate event ids', async () => {
    const eventId = `evt-ops-store-${Date.now().toString(36)}`;
    const first = await createCalendarEvent({
      id: eventId,
      sourceSuite: 'lab',
      title: 'OPS Idempotency Test',
      type: 'delivery',
      status: 'planned',
      startAt: '2026-03-13T10:00:00.000Z',
      endAt: '2026-03-13T11:00:00.000Z',
      metadata: {
        origin: 'ops-calendar-store-test',
      },
    });
    const second = await createCalendarEvent({
      id: eventId,
      sourceSuite: 'lab',
      title: 'OPS Idempotency Test',
      type: 'delivery',
      status: 'planned',
      startAt: '2026-03-13T10:00:00.000Z',
      endAt: '2026-03-13T11:00:00.000Z',
    });

    createdEventIds.push(eventId);
    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(first.event.id).toBe(eventId);
    expect(second.event.id).toBe(eventId);
  });
});
