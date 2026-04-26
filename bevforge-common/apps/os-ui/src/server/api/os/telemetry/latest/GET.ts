import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { endpointCurrent, tileEndpointBindings } from '../../../../db/schema.js';
import { eq, sql, inArray } from 'drizzle-orm';

/**
 * GET /api/os/telemetry/latest
 * 
 * Returns: Current values from endpoint_current cache (FAST)
 * 
 * Query params:
 * - ?endpointId=N - Single endpoint
 * - ?tileId=N - All endpoints bound to tile (resolved via bindings)
 * - ?nodeId=N - All endpoints for node
 * - ?limit=N - Pagination limit (default: 100)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: endpoint_current, tile_endpoint_bindings (if tileId)
 * 
 * Performance: ONLY reads from endpoint_current (fast cache), never telemetry_readings
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { endpointId, tileId, nodeId, limit = '100', offset = '0' } = req.query;

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

    // Handle single endpoint query
    if (endpointId) {
      const endpointIdNum = parseInt(endpointId as string, 10);
      if (isNaN(endpointIdNum)) {
        return res.status(400).json({
          error: 'Invalid endpointId parameter',
          message: 'endpointId must be a number',
        });
      }

      const [current] = await db
        .select()
        .from(endpointCurrent)
        .where(eq(endpointCurrent.endpointId, endpointIdNum));

      if (!current) {
        return res.status(404).json({
          error: 'Endpoint not found',
          message: `No current value found for endpoint ${endpointIdNum}`,
        });
      }

      return res.status(200).json({
        data: [
          {
            endpointId: current.endpointId,
            timestamp: current.timestamp,
            valueBool: current.valueBool,
            valueNum: current.valueNum,
            valueString: current.valueString,
            valueJson: current.valueJson,
            quality: current.quality,
            source: current.source,
          },
        ],
        meta: {
          total: 1,
          limit: limitNum,
          offset: 0,
          count: 1,
        },
      });
    }

    // Handle tile query (resolve endpoints via bindings)
    if (tileId) {
      const tileIdNum = parseInt(tileId as string, 10);
      if (isNaN(tileIdNum)) {
        return res.status(400).json({
          error: 'Invalid tileId parameter',
          message: 'tileId must be a number',
        });
      }

      // Get all endpoints bound to this tile
      const bindings = await db
        .select({ endpointId: tileEndpointBindings.endpointId })
        .from(tileEndpointBindings)
        .where(eq(tileEndpointBindings.tileId, tileIdNum));

      const endpointIds = bindings.map((b) => b.endpointId);

      if (endpointIds.length === 0) {
        return res.status(200).json({
          data: [],
          meta: {
            total: 0,
            limit: limitNum,
            offset: offsetNum,
            count: 0,
          },
        });
      }

      const currentValues = await db
        .select()
        .from(endpointCurrent)
        .where(inArray(endpointCurrent.endpointId, endpointIds));

      const data = currentValues.map((cv) => ({
        endpointId: cv.endpointId,
        timestamp: cv.timestamp,
        valueBool: cv.valueBool,
        valueNum: cv.valueNum,
        valueString: cv.valueString,
        valueJson: cv.valueJson,
        quality: cv.quality,
        source: cv.source,
      }));

      return res.status(200).json({
        data,
        meta: {
          total: data.length,
          limit: limitNum,
          offset: offsetNum,
          count: data.length,
        },
      });
    }

    // Handle nodeId query
    if (nodeId) {
      const nodeIdNum = parseInt(nodeId as string, 10);
      if (isNaN(nodeIdNum)) {
        return res.status(400).json({
          error: 'Invalid nodeId parameter',
          message: 'nodeId must be a number',
        });
      }

      // Get all endpoints for this node
      const { hardwareEndpoints } = await import('../../../../db/schema.js');
      const endpoints = await db
        .select({ id: hardwareEndpoints.id })
        .from(hardwareEndpoints)
        .where(eq(hardwareEndpoints.nodeId, nodeIdNum));

      const endpointIds = endpoints.map((ep) => ep.id);

      if (endpointIds.length === 0) {
        return res.status(200).json({
          data: [],
          meta: {
            total: 0,
            limit: limitNum,
            offset: offsetNum,
            count: 0,
          },
        });
      }

      const currentValues = await db
        .select()
        .from(endpointCurrent)
        .where(inArray(endpointCurrent.endpointId, endpointIds))
        .limit(limitNum)
        .offset(offsetNum);

      const data = currentValues.map((cv) => ({
        endpointId: cv.endpointId,
        timestamp: cv.timestamp,
        valueBool: cv.valueBool,
        valueNum: cv.valueNum,
        valueString: cv.valueString,
        valueJson: cv.valueJson,
        quality: cv.quality,
        source: cv.source,
      }));

      return res.status(200).json({
        data,
        meta: {
          total: endpointIds.length,
          limit: limitNum,
          offset: offsetNum,
          count: data.length,
        },
      });
    }

    // Default: return all current values (paginated)
    const currentValues = await db
      .select()
      .from(endpointCurrent)
      .limit(limitNum)
      .offset(offsetNum);

    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(endpointCurrent);

    const data = currentValues.map((cv) => ({
      endpointId: cv.endpointId,
      timestamp: cv.timestamp,
      valueBool: cv.valueBool,
      valueNum: cv.valueNum,
      valueString: cv.valueString,
      valueJson: cv.valueJson,
      quality: cv.quality,
      source: cv.source,
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
    console.error('Error fetching latest telemetry:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
