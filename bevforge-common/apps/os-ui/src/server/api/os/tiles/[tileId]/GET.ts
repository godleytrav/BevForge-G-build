import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import {
  deviceTiles,
  tileEndpointBindings,
  deviceGroups,
  endpointCurrent,
} from '../../../../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

/**
 * GET /api/os/tiles/:tileId
 * 
 * Returns: Expanded tile detail with bindings, children, group
 * 
 * Query params:
 * - ?include=current - Include current values for bound endpoints
 * 
 * Tables touched:
 * - device_tiles
 * - tile_endpoint_bindings
 * - device_tiles (children)
 * - device_groups (if groupId exists)
 * - endpoint_current (if include=current)
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { tileId } = req.params;
    const { include } = req.query;

    const tileIdNum = parseInt(tileId, 10);
    if (isNaN(tileIdNum)) {
      return res.status(400).json({
        error: 'Invalid tileId parameter',
        message: 'tileId must be a number',
      });
    }

    // Fetch tile
    const [tile] = await db.select().from(deviceTiles).where(eq(deviceTiles.id, tileIdNum));

    if (!tile) {
      return res.status(404).json({
        error: 'Tile not found',
        message: `No tile found with id ${tileIdNum}`,
      });
    }

    // Fetch bindings
    const bindings = await db
      .select()
      .from(tileEndpointBindings)
      .where(eq(tileEndpointBindings.tileId, tileIdNum));

    // Fetch children (tiles where parentTileId = this tile)
    const children = await db
      .select()
      .from(deviceTiles)
      .where(eq(deviceTiles.parentTileId, tileIdNum));

    // Fetch group if groupId exists
    let group = null;
    if (tile.groupId) {
      const [groupRow] = await db
        .select()
        .from(deviceGroups)
        .where(eq(deviceGroups.id, tile.groupId));
      group = groupRow || null;
    }

    // Build response
    const response: any = {
      tile: {
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
        config: tile.config,
        createdAt: tile.createdAt,
        updatedAt: tile.updatedAt,
      },
      bindings: bindings.map((b) => ({
        id: b.id,
        tileId: b.tileId,
        endpointId: b.endpointId,
        bindingRole: b.bindingRole,
        direction: b.direction,
        priority: b.priority,
        transformInput: b.transformInput,
        transformOutput: b.transformOutput,
      })),
      children: children.map((c) => ({
        id: c.id,
        tileType: c.tileType,
        name: c.name,
        status: c.status,
      })),
      group: group
        ? {
            id: group.id,
            name: group.name,
            groupType: group.groupType,
            config: group.config,
          }
        : null,
    };

    // Optionally include current values for bound endpoints
    if (include === 'current') {
      const endpointIds = bindings.map((b) => b.endpointId);

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

        response.currentValues = endpointIds.map((epId) => ({
          endpointId: epId,
          current: currentMap.get(epId) || null,
        }));
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching tile detail:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
