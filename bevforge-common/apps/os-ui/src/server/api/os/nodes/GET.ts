import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { controllerNodes } from '../../../db/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/os/nodes
 * 
 * Returns: Shallow list of controller nodes
 * 
 * Query params:
 * - ?status=online|offline - Filter by node status
 * - ?include=endpointsCount - Include count of endpoints per node
 * - ?limit=N - Pagination limit (default: 100)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: controller_nodes, hardware_endpoints (if include=endpointsCount)
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { status, include, limit = '100', offset = '0' } = req.query;

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

    if (status && !['online', 'offline'].includes(status as string)) {
      return res.status(400).json({
        error: 'Invalid status parameter',
        message: 'Status must be "online" or "offline"',
      });
    }

    // Build query
    let query = db.select().from(controllerNodes);

    // Apply status filter
    if (status) {
      query = query.where(eq(controllerNodes.status, status as string)) as any;
    }

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum) as any;

    const nodes = await query;

    // Get total count for pagination metadata
    const countQuery = status
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(controllerNodes)
          .where(eq(controllerNodes.status, status as string))
      : db.select({ count: sql<number>`count(*)` }).from(controllerNodes);

    const [{ count: totalCount }] = await countQuery;

    // Optionally include endpoints count
    let data = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      nodeType: node.nodeType,
      status: node.status,
      lastSeenAt: node.lastSeenAt,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      config: node.config,
    }));

    if (include === 'endpointsCount') {
      // Get endpoint counts for all nodes in this page
      const nodeIds = nodes.map((n) => n.id);
      const { hardwareEndpoints } = await import('../../../db/schema.js');

      const endpointCounts = await db
        .select({
          nodeId: hardwareEndpoints.nodeId,
          count: sql<number>`count(*)`
        })
        .from(hardwareEndpoints)
        .where(sql`${hardwareEndpoints.nodeId} IN (${sql.join(nodeIds, sql`, `)})`)
        .groupBy(hardwareEndpoints.nodeId);

      const countsMap = new Map(endpointCounts.map((ec) => [ec.nodeId, Number(ec.count)]));

      data = data.map((node) => ({
        ...node,
        endpointsCount: countsMap.get(node.id) || 0,
      }));
    }

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
    console.error('Error fetching nodes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
