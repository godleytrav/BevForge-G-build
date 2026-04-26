import type { Request, Response } from 'express';
import { listPackageLots, type PackageLotStatus } from '../../../lib/inventory-batch-store.js';

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

/**
 * GET /api/os/package-lots
 */
export default async function handler(req: Request, res: Response) {
  try {
    const batchId = toOptionalText(Array.isArray(req.query.batchId) ? req.query.batchId[0] : req.query.batchId);
    const siteId = toOptionalText(Array.isArray(req.query.siteId) ? req.query.siteId[0] : req.query.siteId);
    const skuId = toOptionalText(Array.isArray(req.query.skuId) ? req.query.skuId[0] : req.query.skuId);
    const statusRaw = toOptionalText(Array.isArray(req.query.status) ? req.query.status[0] : req.query.status);
    const status =
      statusRaw === 'planned' ||
      statusRaw === 'active' ||
      statusRaw === 'closed' ||
      statusRaw === 'canceled'
        ? (statusRaw as PackageLotStatus)
        : undefined;

    const lots = await listPackageLots({
      batchId,
      siteId,
      skuId,
      status,
    });

    return res.status(200).json({
      success: true,
      data: lots,
    });
  } catch (error) {
    console.error('Failed to load package lots:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load package lots.',
    });
  }
}
