import type { Request, Response } from 'express';
import { readOpsPackageUnitState } from '../../../lib/package-unit-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const state = await readOpsPackageUnitState();
    const identifier =
      typeof req.query.identifier === 'string' && req.query.identifier.trim().length > 0
        ? req.query.identifier.trim().toLowerCase()
        : undefined;
    const unitId =
      typeof req.query.unitId === 'string' && req.query.unitId.trim().length > 0
        ? req.query.unitId.trim()
        : undefined;
    const unitCode =
      typeof req.query.unitCode === 'string' && req.query.unitCode.trim().length > 0
        ? req.query.unitCode.trim()
        : undefined;
    const assignedSiteId =
      typeof req.query.assignedSiteId === 'string' && req.query.assignedSiteId.trim().length > 0
        ? req.query.assignedSiteId.trim()
        : undefined;

    const units = state.units.filter((unit) => {
      if (identifier) {
        const candidates = [
          unit.unitCode,
          unit.unitId,
          unit.packageLotCode,
          unit.assetCode,
          unit.batchCode,
          unit.skuId,
          unit.productCode,
        ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

        if (!candidates.some((value) => value.trim().toLowerCase() === identifier)) {
          return false;
        }
      }
      if (unitId && unit.unitId !== unitId) {
        return false;
      }
      if (unitCode && unit.unitCode !== unitCode) {
        return false;
      }
      if (assignedSiteId && unit.assignedSiteId !== assignedSiteId) {
        return false;
      }
      return true;
    });

    return res.status(200).json({
      ...state,
      units,
      events:
        identifier || unitId || unitCode
          ? state.events.filter(
              (event) =>
                (!identifier ||
                  [
                    event.unitCode,
                    event.unitId,
                    event.packageLotCode,
                    event.assetCode,
                    event.batchCode,
                    event.skuId,
                    event.productCode,
                  ]
                    .filter(
                      (value): value is string =>
                        typeof value === 'string' && value.trim().length > 0,
                    )
                    .some((value) => value.trim().toLowerCase() === identifier)) &&
                (!unitId || event.unitId === unitId) &&
                (!unitCode || event.unitCode === unitCode),
            )
          : state.events.slice(-200),
    });
  } catch (error) {
    console.error('Failed to read OPS package units:', error);
    return res.status(500).json({ error: 'Failed to read OPS package units.' });
  }
}
