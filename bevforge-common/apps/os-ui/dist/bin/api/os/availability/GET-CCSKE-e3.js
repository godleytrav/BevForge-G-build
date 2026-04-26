import { b as buildAvailabilitySnapshot, r as readInventoryState, a as readBatchState, d as buildInventorySummary } from '../../calendar/events/GET-DNBekL63.js';

async function handler(req, res) {
  try {
    const skuParam = req.query.skuId;
    const siteParam = req.query.siteId;
    const skuId = Array.isArray(skuParam) ? skuParam[0] : skuParam;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    if (skuId && String(skuId).trim()) {
      if (!siteId || !String(siteId).trim()) {
        return res.status(400).json({
          error: "siteId is required when skuId is provided."
        });
      }
      const snapshot = await buildAvailabilitySnapshot({
        skuId: String(skuId).trim(),
        siteId: String(siteId).trim()
      });
      return res.status(200).json(snapshot);
    }
    const [inventory, batches] = await Promise.all([readInventoryState(), readBatchState()]);
    const normalizedSiteId = siteId && String(siteId).trim() ? String(siteId).trim().toLowerCase() : null;
    const inventoryItems = normalizedSiteId ? inventory.items.filter((item) => String(item.siteId).toLowerCase() === normalizedSiteId) : inventory.items;
    const inventorySummary = buildInventorySummary(inventoryItems);
    const filteredBatches = normalizedSiteId ? batches.batches.filter((batch) => String(batch.siteId).toLowerCase() === normalizedSiteId) : batches.batches;
    const batchOnHand = filteredBatches.reduce(
      (sum, batch) => sum + Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)),
      0
    );
    return res.status(200).json({
      success: true,
      data: {
        inventory: inventorySummary,
        batches: {
          total: filteredBatches.length,
          inProgress: filteredBatches.filter((b) => b.status === "in_progress").length,
          onHandQty: batchOnHand
        },
        siteId: normalizedSiteId ?? void 0
      }
    });
  } catch (error) {
    console.error("Failed to load availability:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load availability."
    });
  }
}

export { handler as h };
