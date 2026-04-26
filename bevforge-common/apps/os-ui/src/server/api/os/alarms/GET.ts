import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { alarmEvents } from '../../../db/schema.js';
import { eq, sql, and, or, inArray } from 'drizzle-orm';

/**
 * GET /api/os/alarms
 * 
 * Returns: List of alarm events
 * 
 * Query params:
 * - ?status=active|cleared_unacked|cleared_acked - Filter by status
 *   Default: active + cleared_unacked (actionable alarms)
 * - ?limit=N - Pagination limit (default: 100)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: alarm_events
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { status, limit = '100', offset = '0' } = req.query;

    // Validate query params
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 1000',
      });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: 'Invalid offset parameter',
        message: 'Offset must be >= 0',
      });
    }

    // Validate status parameter
    const validStatuses = ['active', 'cleared_unacked', 'cleared_acked'];
    if (status && !validStatuses.includes(status as string)) {
      return res.status(400).json({
        error: 'Invalid status parameter',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Build query
    let query = db.select().from(alarmEvents);

    // Apply status filter
    if (status) {
      query = query.where(eq(alarmEvents.status, status as string)) as any;
    } else {
      // Default: show active + cleared_unacked (actionable alarms)
      query = query.where(
        or(
          eq(alarmEvents.status, 'active'),
          eq(alarmEvents.status, 'cleared_unacked')
        )
      ) as any;
    }

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum) as any;

    const alarms = await query;

    // Get total count for pagination metadata
    const countQuery = status
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(alarmEvents)
          .where(eq(alarmEvents.status, status as string))
      : db
          .select({ count: sql<number>`count(*)` })
          .from(alarmEvents)
          .where(
            or(
              eq(alarmEvents.status, 'active'),
              eq(alarmEvents.status, 'cleared_unacked')
            )
          );

    const [{ count: totalCount }] = await countQuery;

    // Map to response shape
    const data = alarms.map((alarm) => ({
      id: alarm.id,
      status: alarm.status,
      severity: alarm.severity,
      tileId: alarm.tileId,
      endpointId: alarm.endpointId,
      triggeredAt: alarm.triggeredAt,
      clearedAt: alarm.clearedAt,
      ackedAt: alarm.ackedAt,
      ackedBy: alarm.ackedBy,
      message: alarm.message,
      ruleId: alarm.interlockId,
    }));

    res.status(200).json({
      data,
      meta: {
        total: Number(totalCount),
        limit: limitNum,
        offset: offsetNum,
        count: data.length,
      },
    });
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
