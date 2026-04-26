import { d as db, k as deviceTiles } from '../../../index-BiQ9ukMS.js';
import { sql } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { canvasId, include, limit = "500", offset = "0" } = req.query;
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
    let query = db.select().from(deviceTiles);
    if (canvasId) {
      const canvasIdNum = parseInt(canvasId, 10);
      if (isNaN(canvasIdNum)) {
        return res.status(400).json({
          error: "Invalid canvasId parameter",
          message: "canvasId must be a number"
        });
      }
    }
    query = query.limit(limitNum).offset(offsetNum);
    const tiles = await query;
    const [{ count: totalCount }] = await db.select({ count: sql`count(*)` }).from(deviceTiles);
    let data = tiles.map((tile) => ({
      id: tile.id,
      tileType: tile.tileType,
      name: tile.name,
      x: tile.x,
      y: tile.y,
      w: tile.w,
      h: tile.h,
      parentTileId: tile.parentTileId,
      groupId: tile.groupId,
      status: tile.status,
      config: tile.config
      // Include config for canvas rendering
    }));
    if (include === "bindingsSummary") {
      const tileIds = tiles.map((t) => t.id);
      if (tileIds.length > 0) {
        const { tileEndpointBindings } = await import('../../../index-BiQ9ukMS.js').then(n => n.o);
        const bindingCounts = await db.select({
          tileId: tileEndpointBindings.tileId,
          count: sql`count(*)`
        }).from(tileEndpointBindings).where(sql`${tileEndpointBindings.tileId} IN (${sql.join(tileIds, sql`, `)})`).groupBy(tileEndpointBindings.tileId);
        const countsMap = new Map(bindingCounts.map((bc) => [bc.tileId, Number(bc.count)]));
        data = data.map((tile) => ({
          ...tile,
          bindingsCount: countsMap.get(tile.id) || 0
        }));
      }
    }
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
    console.error("Error fetching tiles:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
