import { u as updateBatchOutput } from '../../../calendar/events/GET-DNBekL63.js';

async function handler(req, res) {
  try {
    const batchIdParam = req.params.batchId;
    const batchId = Array.isArray(batchIdParam) ? batchIdParam[0] : batchIdParam;
    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: "batchId is required."
      });
    }
    const body = req.body;
    if (!Number.isFinite(Number(body.producedQty))) {
      return res.status(400).json({
        success: false,
        error: "producedQty is required."
      });
    }
    const updated = await updateBatchOutput({
      batchId,
      producedQty: Number(body.producedQty),
      unit: body.unit,
      status: body.status
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Batch not found."
      });
    }
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error("Failed to update batch:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update batch."
    });
  }
}

export { handler as h };
