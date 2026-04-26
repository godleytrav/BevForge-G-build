import { t as tileEndpointBindings, d as db } from '../../../index-BiQ9ukMS.js';
import { eq, and, sql } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { tileId, endpointId, limit = "100", offset = "0" } = req.query;
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
    const conditions = [];
    if (tileId) {
      const tileIdNum = parseInt(tileId, 10);
      if (isNaN(tileIdNum)) {
        return res.status(400).json({
          error: "Invalid tileId parameter",
          message: "tileId must be a number"
        });
      }
      conditions.push(eq(tileEndpointBindings.tileId, tileIdNum));
    }
    if (endpointId) {
      const endpointIdNum = parseInt(endpointId, 10);
      if (isNaN(endpointIdNum)) {
        return res.status(400).json({
          error: "Invalid endpointId parameter",
          message: "endpointId must be a number"
        });
      }
      conditions.push(eq(tileEndpointBindings.endpointId, endpointIdNum));
    }
    let query = db.select().from(tileEndpointBindings);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    query = query.limit(limitNum).offset(offsetNum);
    const bindings = await query;
    const countQuery = conditions.length > 0 ? db.select({ count: sql`count(*)` }).from(tileEndpointBindings).where(and(...conditions)) : db.select({ count: sql`count(*)` }).from(tileEndpointBindings);
    const [{ count: totalCount }] = await countQuery;
    const data = bindings.map((binding) => ({
      id: binding.id,
      tileId: binding.tileId,
      endpointId: binding.endpointId,
      bindingRole: binding.bindingRole,
      direction: binding.direction,
      priority: binding.priority,
      transformInput: binding.transformInput,
      transformOutput: binding.transformOutput
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
    console.error("Error fetching bindings:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
