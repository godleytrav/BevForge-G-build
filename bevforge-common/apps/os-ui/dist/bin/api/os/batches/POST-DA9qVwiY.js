import { e as createManualBatch } from '../../calendar/events/GET-DNBekL63.js';

async function handler(req, res) {
  try {
    const body = req.body;
    const recipeName = String(body.recipeName ?? "").trim();
    if (!recipeName) {
      return res.status(400).json({
        success: false,
        error: "recipeName is required."
      });
    }
    if (body.status !== void 0 && body.status !== "planned" && body.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        error: "status must be planned or in_progress."
      });
    }
    const batch = await createManualBatch({
      recipeName,
      recipeId: body.recipeId,
      recipeRunId: body.recipeRunId,
      skuId: body.skuId,
      siteId: body.siteId,
      lotCode: body.lotCode,
      producedQty: body.producedQty,
      unit: body.unit,
      status: body.status
    });
    return res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create manual batch.";
    return res.status(400).json({
      success: false,
      error: message
    });
  }
}

export { handler as h };
