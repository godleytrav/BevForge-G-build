import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  generateCompliancePeriodReport,
  ingestComplianceFeed,
  listComplianceEvents,
} from './compliance-store';

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
const opsEventsFile = path.join(repoRoot, 'commissioning', 'ops', 'compliance-events.json');
const opsReportsFile = path.join(
  repoRoot,
  'commissioning',
  'ops',
  'compliance-period-reports.json'
);
const createdEventIds: string[] = [];
const createdReportIds: string[] = [];

afterEach(async () => {
  if (existsSync(opsEventsFile) && createdEventIds.length > 0) {
    try {
      const parsed = JSON.parse(await fs.readFile(opsEventsFile, 'utf8')) as {
        events?: Array<{ id?: string }>;
        updatedAt?: string;
      };
      parsed.events = (parsed.events ?? []).filter(
        (event) => !createdEventIds.includes(event.id ?? '')
      );
      parsed.updatedAt = new Date().toISOString();
      await fs.writeFile(opsEventsFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    } catch {
      // Cleanup should never fail tests.
    }
    createdEventIds.length = 0;
  }

  if (existsSync(opsReportsFile) && createdReportIds.length > 0) {
    try {
      const parsed = JSON.parse(await fs.readFile(opsReportsFile, 'utf8')) as {
        reports?: Array<{ id?: string }>;
        updatedAt?: string;
      };
      parsed.reports = (parsed.reports ?? []).filter(
        (report) => !createdReportIds.includes(report.id ?? '')
      );
      parsed.updatedAt = new Date().toISOString();
      await fs.writeFile(opsReportsFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    } catch {
      // Cleanup should never fail tests.
    }
    createdReportIds.length = 0;
  }
});

describe('compliance-store', () => {
  it('ingests OS feed idempotently by event id', async () => {
    const siteId = `site-${Date.now().toString(36)}`;
    const eventIdA = `os:movement:${Date.now().toString(36)}-a`;
    const eventIdB = `os:movement:${Date.now().toString(36)}-b`;

    const feed = {
      schemaVersion: '1.0.0',
      id: `feed-${Date.now().toString(36)}`,
      sourceSuite: 'os',
      siteId,
      generatedAt: '2026-03-07T09:00:00.000Z',
      range: {
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-31T23:59:59.999Z',
      },
      events: [
        {
          schemaVersion: '1.0.0',
          id: eventIdA,
          eventType: 'inventory_produced',
          eventStatus: 'recorded',
          sourceSuite: 'os',
          sourceRecord: {
            recordType: 'inventory_movement',
            recordId: eventIdA,
          },
          siteId,
          occurredAt: '2026-03-05T10:00:00.000Z',
          recordedAt: '2026-03-05T10:00:01.000Z',
          quantity: {
            value: 5,
            uom: 'gal',
            direction: 'in',
          },
        },
        {
          schemaVersion: '1.0.0',
          id: eventIdB,
          eventType: 'inventory_shipped',
          eventStatus: 'recorded',
          sourceSuite: 'os',
          sourceRecord: {
            recordType: 'inventory_movement',
            recordId: eventIdB,
          },
          siteId,
          occurredAt: '2026-03-05T11:00:00.000Z',
          recordedAt: '2026-03-05T11:00:01.000Z',
          quantity: {
            value: 2,
            uom: 'gal',
            direction: 'out',
          },
        },
      ],
    };

    const first = await ingestComplianceFeed(feed);
    const second = await ingestComplianceFeed(feed);
    const events = await listComplianceEvents({ siteId });

    createdEventIds.push(eventIdA, eventIdB);

    expect(first.inserted).toBe(2);
    expect(first.updated).toBe(0);
    expect(first.unchanged).toBe(0);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(0);
    expect(second.unchanged).toBe(2);
    expect(events.some((event) => event.id === eventIdA)).toBe(true);
    expect(events.some((event) => event.id === eventIdB)).toBe(true);
  });

  it('generates period report with expected totals invariant', async () => {
    const siteId = `site-${Date.now().toString(36)}-report`;
    const feed = {
      schemaVersion: '1.0.0',
      id: `feed-${Date.now().toString(36)}-report`,
      sourceSuite: 'os',
      siteId,
      generatedAt: '2026-03-07T09:00:00.000Z',
      range: {
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-31T23:59:59.999Z',
      },
      events: [
        {
          schemaVersion: '1.0.0',
          id: `os:movement:${Date.now().toString(36)}-prod`,
          eventType: 'inventory_produced',
          eventStatus: 'recorded',
          sourceSuite: 'os',
          sourceRecord: { recordType: 'inventory_movement', recordId: 'prod' },
          siteId,
          occurredAt: '2026-03-04T10:00:00.000Z',
          recordedAt: '2026-03-04T10:00:01.000Z',
          skuId: 'SKU-CIDER',
          quantity: { value: 10, uom: 'gal', direction: 'in' },
        },
        {
          schemaVersion: '1.0.0',
          id: `os:movement:${Date.now().toString(36)}-ship`,
          eventType: 'inventory_shipped',
          eventStatus: 'recorded',
          sourceSuite: 'os',
          sourceRecord: { recordType: 'inventory_movement', recordId: 'ship' },
          siteId,
          occurredAt: '2026-03-04T12:00:00.000Z',
          recordedAt: '2026-03-04T12:00:01.000Z',
          skuId: 'SKU-CIDER',
          quantity: { value: 3, uom: 'gal', direction: 'out' },
        },
        {
          schemaVersion: '1.0.0',
          id: `os:movement:${Date.now().toString(36)}-loss`,
          eventType: 'loss_recorded',
          eventStatus: 'recorded',
          sourceSuite: 'os',
          sourceRecord: { recordType: 'inventory_movement', recordId: 'loss' },
          siteId,
          occurredAt: '2026-03-04T13:00:00.000Z',
          recordedAt: '2026-03-04T13:00:01.000Z',
          skuId: 'SKU-CIDER',
          quantity: { value: 1, uom: 'gal', direction: 'out' },
        },
        {
          schemaVersion: '1.0.0',
          id: `os:movement:${Date.now().toString(36)}-destroy`,
          eventType: 'destruction_recorded',
          eventStatus: 'recorded',
          sourceSuite: 'os',
          sourceRecord: { recordType: 'inventory_movement', recordId: 'destroy' },
          siteId,
          occurredAt: '2026-03-04T14:00:00.000Z',
          recordedAt: '2026-03-04T14:00:01.000Z',
          skuId: 'SKU-CIDER',
          quantity: { value: 2, uom: 'gal', direction: 'out' },
        },
      ],
    };

    feed.events.forEach((event) => createdEventIds.push(event.id));
    await ingestComplianceFeed(feed);

    const report = await generateCompliancePeriodReport({
      siteId,
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      jurisdiction: {
        countryCode: 'US',
        regionCode: 'CA',
        agency: 'ABC',
      },
      status: 'draft',
    });
    createdReportIds.push(report.id);

    expect(report.totals.producedQty).toBe(10);
    expect(report.totals.removedQty).toBe(3);
    expect(report.totals.destroyedQty).toBe(2);
    expect(report.totals.lossQty).toBe(1);
    expect(report.totals.onHandEndQty).toBe(4);
    expect(report.totals.uom).toBe('gal');
  });
});
