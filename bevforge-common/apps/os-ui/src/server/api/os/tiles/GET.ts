import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { deviceTiles } from '../../../db/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/os/tiles
 * 
 * Returns: Canvas render payload (fast, shallow)
 * 
 * Query params:
 * - ?canvasId=N - Filter by canvas (if multiple canvases exist)
 * - ?include=bindingsSummary - Include binding counts per tile
 * - ?limit=N - Pagination limit (default: 500)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: device_tiles, tile_endpoint_bindings (if include=bindingsSummary)
 * 
 * Performance: Does NOT join telemetry. Use /telemetry/latest for current values.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { canvasId, include, limit = '500', offset = '0' } = req.query;

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

    // Build query
    let query = db.select().from(deviceTiles);

    // Apply canvas filter if provided
    if (canvasId) {
      const canvasIdNum = parseInt(canvasId as string, 10);
      if (isNaN(canvasIdNum)) {
        return res.status(400).json({
          error: 'Invalid canvasId parameter',
          message: 'canvasId must be a number',
        });
      }
      // Note: canvasId field doesn't exist yet in schema, but preparing for it
      // For now, return all tiles
    }

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum) as any;

    const tiles = await query;

    // Get total count for pagination metadata
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deviceTiles);

    // Map to canvas render payload (shallow)
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
      config: tile.config, // Include config for canvas rendering
    }));

    // Optionally include bindings summary (counts only)
    if (include === 'bindingsSummary') {
      const tileIds = tiles.map((t) => t.id);

      if (tileIds.length > 0) {
        const { tileEndpointBindings } = await import('../../../db/schema.js');

        const bindingCounts = await db
          .select({
            tileId: tileEndpointBindings.tileId,
            count: sql<number>`count(*)`
          })
          .from(tileEndpointBindings)
          .where(sql`${tileEndpointBindings.tileId} IN (${sql.join(tileIds, sql`, `)})`)
          .groupBy(tileEndpointBindings.tileId);

        const countsMap = new Map(bindingCounts.map((bc) => [bc.tileId, Number(bc.count)]));

        data = data.map((tile) => ({
          ...tile,
          bindingsCount: countsMap.get(tile.id) || 0,
        }));
      }
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
    console.error('Error fetching tiles:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
