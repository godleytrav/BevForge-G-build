import { d as db, a as alarmEvents } from '../../../index-BiQ9ukMS.js';
import { eq, or, sql } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { status, limit = "100", offset = "0" } = req.query;
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1e3) {
      return res.status(400).json({
        error: "Invalid limit parameter",
        message: "Limit must be between 1 and 1000"
      });
    }
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: "Invalid offset parameter",
        message: "Offset must be >= 0"
      });
    }
    const validStatuses = ["active", "cleared_unacked", "cleared_acked"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status parameter",
        message: `Status must be one of: ${validStatuses.join(", ")}`
      });
    }
    let query = db.select().from(alarmEvents);
    if (status) {
      query = query.where(eq(alarmEvents.status, status));
    } else {
      query = query.where(
        or(
          eq(alarmEvents.status, "active"),
          eq(alarmEvents.status, "cleared_unacked")
        )
      );
    }
    query = query.limit(limitNum).offset(offsetNum);
    const alarms = await query;
    const countQuery = status ? db.select({ count: sql`count(*)` }).from(alarmEvents).where(eq(alarmEvents.status, status)) : db.select({ count: sql`count(*)` }).from(alarmEvents).where(
      or(
        eq(alarmEvents.status, "active"),
        eq(alarmEvents.status, "cleared_unacked")
      )
    );
    const [{ count: totalCount }] = await countQuery;
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
      ruleId: alarm.interlockId
    }));
    res.status(200).json({
      data,
      meta: {
        total: Number(totalCount),
        limit: limitNum,
        offset: offsetNum,
        count: data.length
      }
    });
  } catch (error) {
    console.error("Error fetching alarms:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
