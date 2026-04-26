import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { deviceGroups } from '../../../db/schema.js';
import { sql } from 'drizzle-orm';

/**
 * GET /api/os/groups
 * 
 * Returns: List of device groups
 * 
 * Query params:
 * - ?limit=N - Pagination limit (default: 100)
 * - ?offset=N - Pagination offset (default: 0)
 * 
 * Tables touched: device_groups
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { limit = '100', offset = '0' } = req.query;

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
    const groups = await db.select().from(deviceGroups).limit(limitNum).offset(offsetNum);

    // Get total count for pagination metadata
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deviceGroups);

    // Map to response shape
    const data = groups.map((group) => ({
      id: group.id,
      name: group.name,
      groupType: group.groupType,
      conflictPolicy: group.config?.conflictPolicy || null,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
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
    console.error('Error fetching groups:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
