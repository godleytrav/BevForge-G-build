import { d as db, f as deviceGroups } from '../../../index-BiQ9ukMS.js';
import { sql } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { limit = "100", offset = "0" } = req.query;
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
    const groups = await db.select().from(deviceGroups).limit(limitNum).offset(offsetNum);
    const [{ count: totalCount }] = await db.select({ count: sql`count(*)` }).from(deviceGroups);
    const data = groups.map((group) => ({
      id: group.id,
      name: group.name,
      groupType: group.groupType,
      conflictPolicy: group.config?.conflictPolicy || null,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
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
    console.error("Error fetching groups:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
