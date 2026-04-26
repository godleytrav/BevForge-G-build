import type { Request, Response } from 'express';
import type { EquipmentRoleId } from '../../../../lib/commissioning-store.js';
import { writeEquipmentRoleMap } from '../../../../lib/commissioning-store.js';

/**
 * PUT /api/os/recipes/equipment-map
 *
 * Body: { roles: Partial<Record<EquipmentRoleId, string | null>> }
 */
export default async function handler(req: Request, res: Response) {
  try {
    const roles = (req.body as { roles?: Partial<Record<EquipmentRoleId, string | null>> })?.roles;
    if (!roles || typeof roles !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'roles object is required.',
      });
    }

    const updated = await writeEquipmentRoleMap(roles);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Failed to update equipment role map:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update equipment role map.',
    });
  }
}
