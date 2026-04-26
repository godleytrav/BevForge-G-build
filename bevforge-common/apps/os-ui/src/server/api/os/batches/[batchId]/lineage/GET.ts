import type { Request, Response } from 'express';
import { getBatchLineage } from '../../../../../lib/inventory-batch-store.js';

/**
 * GET /api/os/batches/:batchId/lineage
 */
export default async function handler(req: Request, res: Response) {
  try {
    const batchIdParam = req.params.batchId;
    const batchId = Array.isArray(batchIdParam) ? batchIdParam[0] : batchIdParam;
    if (!batchId || !String(batchId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'batchId is required.',
      });
    }

    const lineage = await getBatchLineage(String(batchId).trim());
    if (!lineage) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: lineage,
    });
  } catch (error) {
    console.error('Failed to load batch lineage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load batch lineage.',
    });
  }
}

