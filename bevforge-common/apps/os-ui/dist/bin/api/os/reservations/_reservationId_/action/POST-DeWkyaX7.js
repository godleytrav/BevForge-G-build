import { o as applyInventoryReservationAction } from '../../../../calendar/events/GET-DNBekL63.js';

async function handler(req, res) {
  try {
    const reservationIdParam = req.params.reservationId;
    const reservationId = Array.isArray(reservationIdParam) ? reservationIdParam[0] : reservationIdParam;
    if (!reservationId || !String(reservationId).trim()) {
      return res.status(400).json({
        error: "reservationId is required."
      });
    }
    const body = req.body;
    if (!body.actionId || !String(body.actionId).trim()) {
      return res.status(400).json({
        error: "actionId is required."
      });
    }
    if (!body.action || !["commit", "release", "expire"].includes(body.action)) {
      return res.status(400).json({
        error: "action must be one of commit, release, expire."
      });
    }
    if (body.reservationId && String(body.reservationId).trim() !== String(reservationId).trim()) {
      return res.status(400).json({
        error: "reservationId in body must match route parameter."
      });
    }
    const result = await applyInventoryReservationAction({
      reservationId: String(reservationId).trim(),
      actionId: String(body.actionId).trim(),
      action: body.action,
      orderId: body.orderId,
      lineId: body.lineId,
      reasonCode: body.reasonCode,
      reasonMessage: body.reasonMessage,
      occurredAt: body.occurredAt
    });
    if (!result) {
      return res.status(404).json({
        error: "Reservation not found."
      });
    }
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Failed to apply reservation action:", error);
    return res.status(500).json({
      error: "Failed to apply reservation action."
    });
  }
}

export { handler as h };
