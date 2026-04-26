import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { tileEndpointBindings } from '../../../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';

/**
 * GET /api/os/bindings
 * 
 * Returns: List of tile-endpoint bindings
 * 
 * Query params:
 * - ?tileId=N - Filter by tile
 * - ?endpointId=N - Filter by endpoint
 * - ?limit=N - Pagination limit (default: 100)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: tile_endpoint_bindings
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { tileId, endpointId, limit = '100', offset = '0' } = req.query;

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

    // Build query conditions
    const conditions = [];

    if (tileId) {
      const tileIdNum = parseInt(tileId as string, 10);
      if (isNaN(tileIdNum)) {
        return res.status(400).json({
          error: 'Invalid tileId parameter',
          message: 'tileId must be a number',
        });
      }
      conditions.push(eq(tileEndpointBindings.tileId, tileIdNum));
    }

    if (endpointId) {
      const endpointIdNum = parseInt(endpointId as string, 10);
      if (isNaN(endpointIdNum)) {
        return res.status(400).json({
          error: 'Invalid endpointId parameter',
          message: 'endpointId must be a number',
        });
      }
      conditions.push(eq(tileEndpointBindings.endpointId, endpointIdNum));
    }

    // Build query
    let query = db.select().from(tileEndpointBindings);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum) as any;

    const bindings = await query;

    // Get total count for pagination metadata
    const countQuery =
      conditions.length > 0
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(tileEndpointBindings)
            .where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(tileEndpointBindings);

    const [{ count: totalCount }] = await countQuery;

    // Map to response shape
    const data = bindings.map((binding) => ({
      id: binding.id,
      tileId: binding.tileId,
      endpointId: binding.endpointId,
      bindingRole: binding.bindingRole,
      direction: binding.direction,
      priority: binding.priority,
      transformInput: binding.transformInput,
      transformOutput: binding.transformOutput,
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
    console.error('Error fetching bindings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
