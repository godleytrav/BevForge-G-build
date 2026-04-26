import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createCalendarEvent } from './calendar-store';

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'os-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'os-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const feedFile = path.join(repoRoot, 'commissioning', 'lab', 'calendar-events.json');

describe('calendar-store createCalendarEvent', () => {
  it('returns idempotent success for duplicate event ids', async () => {
    const testId = `evt-test-${Date.now().toString(36)}`;
    try {
      const first = await createCalendarEvent({
        id: testId,
        sourceSuite: 'lab',
        title: 'LAB Planning Test',
        type: 'schedule',
        status: 'planned',
        startAt: '2026-03-11T13:00:00.000Z',
        endAt: '2026-03-11T14:00:00.000Z',
      });
      const second = await createCalendarEvent({
        id: testId,
        sourceSuite: 'lab',
        title: 'LAB Planning Test',
        type: 'schedule',
        status: 'planned',
        startAt: '2026-03-11T13:00:00.000Z',
        endAt: '2026-03-11T14:00:00.000Z',
      });

      expect(first.idempotent).toBe(false);
      expect(second.idempotent).toBe(true);
      expect(first.event.id).toBe(testId);
      expect(second.event.id).toBe(testId);

      const parsed = JSON.parse(await fs.readFile(feedFile, 'utf8')) as {
        events?: Array<{ id?: string }>;
      };
      const count = (parsed.events ?? []).filter((event) => event.id === testId).length;
      expect(count).toBe(1);
    } finally {
      if (!existsSync(feedFile)) return;
      const parsed = JSON.parse(await fs.readFile(feedFile, 'utf8')) as {
        events?: Array<{ id?: string }>;
        updatedAt?: string;
      };
      parsed.events = (parsed.events ?? []).filter((event) => event.id !== testId);
      parsed.updatedAt = new Date().toISOString();
      await fs.writeFile(feedFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    }
  });
});
