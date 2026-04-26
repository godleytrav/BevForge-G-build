import type { Request, Response } from 'express';
import {
  buildAvailabilitySnapshot,
  buildInventorySummary,
  readBatchState,
  readInventoryState,
} from '../../../lib/inventory-batch-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const skuParam = req.query.skuId;
    const siteParam = req.query.siteId;
    const skuId = Array.isArray(skuParam) ? skuParam[0] : skuParam;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;

    if (skuId && String(skuId).trim()) {
      if (!siteId || !String(siteId).trim()) {
        return res.status(400).json({
          error: 'siteId is required when skuId is provided.',
        });
      }
      const snapshot = await buildAvailabilitySnapshot({
        skuId: String(skuId).trim(),
        siteId: String(siteId).trim(),
      });
      return res.status(200).json(snapshot);
    }

    // Backward-compatible summary response when skuId is not provided.
    const [inventory, batches] = await Promise.all([readInventoryState(), readBatchState()]);
    const normalizedSiteId =
      siteId && String(siteId).trim() ? String(siteId).trim().toLowerCase() : null;
    const inventoryItems = normalizedSiteId
      ? inventory.items.filter((item) => String(item.siteId).toLowerCase() === normalizedSiteId)
      : inventory.items;
    const inventorySummary = buildInventorySummary(inventoryItems);
    const filteredBatches = normalizedSiteId
      ? batches.batches.filter((batch) => String(batch.siteId).toLowerCase() === normalizedSiteId)
      : batches.batches;
    const batchOnHand = filteredBatches.reduce(
      (sum, batch) =>
        sum + Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)),
      0
    );
    return res.status(200).json({
      success: true,
      data: {
        inventory: inventorySummary,
        batches: {
          total: filteredBatches.length,
          active: filteredBatches.filter((b) =>
            ['planned', 'in_progress', 'completed', 'released', 'allocated'].includes(b.status)
          ).length,
          inProgress: filteredBatches.filter((b) => b.status === 'in_progress').length,
          onHandQty: batchOnHand,
        },
        siteId: normalizedSiteId ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to load availability:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load availability.',
    });
  }
}
