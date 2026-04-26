import type { Request, Response } from 'express';
import type { TransferRouteConfig, TransferRouteKey } from '../../../../lib/commissioning-store.js';
import { writeTransferRouteMap } from '../../../../lib/commissioning-store.js';

/**
 * PUT /api/os/recipes/transfer-map
 *
 * Body:
 * {
 *   routes: Partial<Record<TransferRouteKey, Partial<TransferRouteConfig> | null>>
 * }
 */
export default async function handler(req: Request, res: Response) {
  try {
    const routes = (
      req.body as {
        routes?: Partial<Record<TransferRouteKey, Partial<TransferRouteConfig> | null>>;
      }
    )?.routes;
    if (!routes || typeof routes !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'routes object is required.',
      });
    }
    const updated = await writeTransferRouteMap(routes);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Failed to update transfer route map:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update transfer route map.',
    });
  }
}
