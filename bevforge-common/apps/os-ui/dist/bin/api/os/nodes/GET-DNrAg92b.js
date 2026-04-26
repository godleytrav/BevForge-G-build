import { d as db, g as controllerNodes } from '../../../index-BiQ9ukMS.js';
import { eq, sql } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { status, include, limit = "100", offset = "0" } = req.query;
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
    if (status && !["online", "offline"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status parameter",
        message: 'Status must be "online" or "offline"'
      });
    }
    let query = db.select().from(controllerNodes);
    if (status) {
      query = query.where(eq(controllerNodes.status, status));
    }
    query = query.limit(limitNum).offset(offsetNum);
    const nodes = await query;
    const countQuery = status ? db.select({ count: sql`count(*)` }).from(controllerNodes).where(eq(controllerNodes.status, status)) : db.select({ count: sql`count(*)` }).from(controllerNodes);
    const [{ count: totalCount }] = await countQuery;
    let data = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      nodeType: node.nodeType,
      status: node.status,
      lastSeenAt: node.lastSeenAt,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      config: node.config
    }));
    if (include === "endpointsCount") {
      const nodeIds = nodes.map((n) => n.id);
      const { hardwareEndpoints } = await import('../../../index-BiQ9ukMS.js').then(n => n.o);
      const endpointCounts = await db.select({
        nodeId: hardwareEndpoints.nodeId,
        count: sql`count(*)`
      }).from(hardwareEndpoints).where(sql`${hardwareEndpoints.nodeId} IN (${sql.join(nodeIds, sql`, `)})`).groupBy(hardwareEndpoints.nodeId);
      const countsMap = new Map(endpointCounts.map((ec) => [ec.nodeId, Number(ec.count)]));
      data = data.map((node) => ({
        ...node,
        endpointsCount: countsMap.get(node.id) || 0
      }));
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
    console.error("Error fetching nodes:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
