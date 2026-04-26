import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { hardwareEndpoints, endpointCurrent } from '../../../db/schema.js';
import { eq, sql, and, inArray } from 'drizzle-orm';

/**
 * GET /api/os/endpoints
 * 
 * Returns: Shallow list of hardware endpoints
 * 
 * Query params:
 * - ?nodeId=N - Filter by controller node
 * - ?kind=DI|DO|AI|AO|PWM|... - Filter by endpoint kind
 * - ?include=current - Include current values from endpoint_current
 * - ?limit=N - Pagination limit (default: 100)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: hardware_endpoints, endpoint_current (if include=current)
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { nodeId, kind, include, limit = '100', offset = '0' } = req.query;

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

    // Valid endpoint kinds
    const validKinds = [
      'DI',
      'DO',
      'AI',
      'AO',
      'PWM',
      'I2C',
      'SPI',
      'UART',
      '1WIRE',
      'MODBUS',
      'VIRTUAL',
    ];

    if (kind && !validKinds.includes(kind as string)) {
      return res.status(400).json({
        error: 'Invalid kind parameter',
        message: `Kind must be one of: ${validKinds.join(', ')}`,
      });
    }

    // Build query conditions
    const conditions = [];

    if (nodeId) {
      const nodeIdNum = parseInt(nodeId as string, 10);
      if (isNaN(nodeIdNum)) {
        return res.status(400).json({
          error: 'Invalid nodeId parameter',
          message: 'nodeId must be a number',
        });
      }
      conditions.push(eq(hardwareEndpoints.controllerId, nodeIdNum));
    }

    if (kind) {
      conditions.push(eq(hardwareEndpoints.endpointKind, kind as string));
    }

    // Build query
    let query = db.select().from(hardwareEndpoints);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply pagination
    query = query.limit(limitNum).offset(offsetNum) as any;

    const endpoints = await query;

    // Get total count for pagination metadata
    const countQuery =
      conditions.length > 0
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(hardwareEndpoints)
            .where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(hardwareEndpoints);

    const [{ count: totalCount }] = await countQuery;

    // Map to response shape
    let data = endpoints.map((ep) => ({
      id: ep.id,
      controllerId: ep.controllerId,
      endpointKind: ep.endpointKind,
      channelId: ep.channelId,
      direction: ep.direction,
      valueType: ep.valueType,
      unit: ep.unit,
      invert: ep.invert,
      rangeMin: ep.rangeMin,
      rangeMax: ep.rangeMax,
      status: ep.status,
      lastRead: ep.lastRead,
      lastWrite: ep.lastWrite,
    }));

    // Optionally include current values
    if (include === 'current') {
      const endpointIds = endpoints.map((ep) => ep.id);

      if (endpointIds.length > 0) {
        const currentValues = await db
          .select()
          .from(endpointCurrent)
          .where(inArray(endpointCurrent.endpointId, endpointIds));

        const currentMap = new Map(
          currentValues.map((cv) => [
            cv.endpointId,
            {
              timestamp: cv.timestamp,
              valueBool: cv.valueBool,
              valueNum: cv.valueNum,
              valueString: cv.valueString,
              valueJson: cv.valueJson,
              quality: cv.quality,
              source: cv.source,
            },
          ])
        );

        data = data.map((ep) => ({
          ...ep,
          current: currentMap.get(ep.id) || null,
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
    console.error('Error fetching endpoints:', error);
    const message = String(error);
    // In commissioning-first local setups DB tables can be absent; return empty list
    // so canvas controls still work via manual channel/endpoint bindings.
    if (
      message.includes('no such table') ||
      message.includes('relation') ||
      message.includes('does not exist') ||
      message.includes('ECONNREFUSED')
    ) {
      return res.status(200).json({
        data: [],
        meta: {
          total: 0,
          limit: 0,
          offset: 0,
          count: 0,
        },
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message,
    });
  }
}
