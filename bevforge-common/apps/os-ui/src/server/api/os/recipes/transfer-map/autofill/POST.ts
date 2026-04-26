import type { Request, Response } from 'express';
import {
  readCanvasProject,
  readEquipmentRoleMap,
  readTransferRouteMap,
  writeTransferRouteMap,
} from '../../../../../lib/commissioning-store.js';
import { buildSuggestedTransferRoutes } from '../../../../../lib/transfer-routes.js';

/**
 * POST /api/os/recipes/transfer-map/autofill
 *
 * Builds transfer route profile suggestions from published canvas and saves them.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const [project, equipmentMap, map] = await Promise.all([
      readCanvasProject(),
      readEquipmentRoleMap(),
      readTransferRouteMap(),
    ]);
    const suggested = buildSuggestedTransferRoutes(project, equipmentMap, map);
    const updated = await writeTransferRouteMap(suggested);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Failed to auto-fill transfer route map:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to auto-fill transfer route map.',
    });
  }
}
