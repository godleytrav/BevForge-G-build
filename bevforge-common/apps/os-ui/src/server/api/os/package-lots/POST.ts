import type { Request, Response } from 'express';
import { createPackageLot, type PackageLotType } from '../../../lib/inventory-batch-store.js';

const isPackageLotType = (value: unknown): value is PackageLotType =>
  value === 'keg' ||
  value === 'can' ||
  value === 'bottle' ||
  value === 'case' ||
  value === 'pallet' ||
  value === 'other';

/**
 * POST /api/os/package-lots
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      batchId?: string;
      lotCode?: string;
      packageLotCode?: string;
      packageType?: PackageLotType;
      packageFormatCode?: string;
      containerStyle?: string;
      packageSkuId?: string;
      totalUnits?: number;
      unitSize?: number;
      unitOfMeasure?: string;
      siteId?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.batchId || !String(body.batchId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'batchId is required.',
      });
    }
    if (!isPackageLotType(body.packageType)) {
      return res.status(400).json({
        success: false,
        error: 'packageType is required and must be one of keg/can/bottle/case/pallet/other.',
      });
    }
    if (!Number.isFinite(Number(body.totalUnits)) || Number(body.totalUnits) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'totalUnits must be greater than zero.',
      });
    }

    const lot = await createPackageLot({
      batchId: String(body.batchId).trim(),
      lotCode: body.lotCode,
      packageLotCode: body.packageLotCode,
      packageType: body.packageType,
      packageFormatCode: body.packageFormatCode,
      containerStyle: body.containerStyle ? String(body.containerStyle).trim() : undefined,
      packageSkuId: body.packageSkuId,
      totalUnits: Number(body.totalUnits),
      unitSize: body.unitSize,
      unitOfMeasure: body.unitOfMeasure,
      siteId: body.siteId,
      notes: body.notes,
      metadata: body.metadata,
    });

    return res.status(200).json({
      success: true,
      data: lot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create package lot.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
