import { a as readBatchState } from '../../calendar/events/GET-DNBekL63.js';

async function handler(_req, res) {
  try {
    const state = await readBatchState();
    const siteParam = _req.query.siteId;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const normalizedSiteId = siteId && String(siteId).trim() ? String(siteId).trim().toLowerCase() : null;
    const batches = normalizedSiteId ? state.batches.filter((batch) => String(batch.siteId).toLowerCase() === normalizedSiteId) : state.batches;
    const summary = {
      total: batches.length,
      inProgress: batches.filter((batch) => batch.status === "in_progress").length,
      readyToRelease: batches.filter((batch) => batch.status === "completed").length,
      released: batches.filter((batch) => batch.status === "released").length,
      shipped: batches.filter((batch) => batch.status === "shipped").length,
      onHandQty: batches.reduce(
        (sum, batch) => sum + Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)),
        0
      )
    };
    return res.status(200).json({
      success: true,
      data: {
        batches,
        siteId: normalizedSiteId ?? void 0,
        summary
      }
    });
  } catch (error) {
    console.error("Failed to load batches:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load batches."
    });
  }
}

export { handler as h };
