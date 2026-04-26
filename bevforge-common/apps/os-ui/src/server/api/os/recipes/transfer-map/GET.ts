import type { Request, Response } from 'express';
import {
  readCanvasProject,
  readDevices,
  readEquipmentRoleMap,
  readTransferRouteMap,
} from '../../../../lib/commissioning-store.js';
import {
  buildSuggestedTransferRoutes,
  buildTransferRouteOptions,
  transferRouteDefs,
} from '../../../../lib/transfer-routes.js';

/**
 * GET /api/os/recipes/transfer-map
 *
 * Returns persisted transfer route profile + options + auto suggestions.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const [project, devices, equipmentMap, map] = await Promise.all([
      readCanvasProject(),
      readDevices(),
      readEquipmentRoleMap(),
      readTransferRouteMap(),
    ]);
    const optionData = buildTransferRouteOptions(project, devices);
    const suggestedRoutes = buildSuggestedTransferRoutes(project, equipmentMap, map);

    return res.status(200).json({
      success: true,
      data: {
        map,
        routeDefs: transferRouteDefs,
        options: optionData.options,
        source: optionData.source,
        suggestedRoutes,
      },
    });
  } catch (error) {
    console.error('Failed to read transfer route map:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read transfer route map.',
    });
  }
}
