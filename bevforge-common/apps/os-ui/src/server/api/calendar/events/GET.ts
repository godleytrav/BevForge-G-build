import type { Request, Response } from 'express';
import {
  readUnifiedCalendarProjection,
  type CalendarEventStatus,
  type CalendarEventType,
  type CalendarSuiteId,
} from '../../../lib/calendar-store.js';

const suiteIds: CalendarSuiteId[] = ['os', 'ops', 'lab', 'flow', 'connect'];
const statuses: CalendarEventStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'canceled',
  'blocked',
];
const types: CalendarEventType[] = [
  'production',
  'inventory',
  'order',
  'delivery',
  'compliance',
  'schedule',
  'maintenance',
  'task',
  'note',
];

const toList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

/**
 * GET /api/calendar/events
 *
 * Query:
 * - from (ISO datetime)
 * - to (ISO datetime)
 * - suite (csv: os,ops,lab,flow,connect)
 * - statuses (csv)
 * - types (csv)
 * - siteId
 * - search
 */
export default async function handler(req: Request, res: Response) {
  try {
    const suite = toList(req.query.suite).filter((value): value is CalendarSuiteId =>
      suiteIds.includes(value as CalendarSuiteId)
    );
    const statusList = toList(req.query.statuses).filter(
      (value): value is CalendarEventStatus =>
        statuses.includes(value as CalendarEventStatus)
    );
    const typeList = toList(req.query.types).filter((value): value is CalendarEventType =>
      types.includes(value as CalendarEventType)
    );

    const projection = await readUnifiedCalendarProjection({
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      suite: suite.length > 0 ? suite : undefined,
      statuses: statusList.length > 0 ? statusList : undefined,
      types: typeList.length > 0 ? typeList : undefined,
      siteId: typeof req.query.siteId === 'string' ? req.query.siteId : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });

    return res.status(200).json({
      success: true,
      data: projection,
    });
  } catch (error) {
    console.error('Failed to read calendar events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read calendar events.',
    });
  }
}
