import { n as createInventoryReservation } from '../../calendar/events/GET-DNBekL63.js';

async function handler(req, res) {
  try {
    const body = req.body;
    if (!body.requestId || !String(body.requestId).trim()) {
      return res.status(400).json({
        error: "requestId is required."
      });
    }
    if (!body.orderId || !String(body.orderId).trim()) {
      return res.status(400).json({
        error: "orderId is required."
      });
    }
    if (!body.lineId || !String(body.lineId).trim()) {
      return res.status(400).json({
        error: "lineId is required."
      });
    }
    if (!body.skuId || !String(body.skuId).trim()) {
      return res.status(400).json({
        error: "skuId is required."
      });
    }
    if (!Number.isFinite(Number(body.requestedQty)) || Number(body.requestedQty) <= 0) {
      return res.status(400).json({
        error: "requestedQty must be greater than zero."
      });
    }
    if (!body.uom || !String(body.uom).trim()) {
      return res.status(400).json({
        error: "uom is required."
      });
    }
    if (!body.siteId || !String(body.siteId).trim()) {
      return res.status(400).json({
        error: "siteId is required."
      });
    }
    const response = await createInventoryReservation({
      schemaVersion: body.schemaVersion,
      requestId: String(body.requestId).trim(),
      orderId: String(body.orderId).trim(),
      lineId: String(body.lineId).trim(),
      skuId: String(body.skuId).trim(),
      requestedQty: Number(body.requestedQty),
      uom: String(body.uom).trim(),
      siteId: String(body.siteId).trim(),
      allowPartial: Boolean(body.allowPartial),
      constraints: body.constraints,
      requestedAt: body.requestedAt
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return res.status(500).json({
      error: "Failed to create reservation."
    });
  }
}

export { handler as h };
