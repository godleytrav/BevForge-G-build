import type { Request, Response } from 'express';
import { applyInventoryReservationAction } from '../../../../../lib/inventory-batch-store.js';

/**
 * POST /api/os/reservations/:reservationId/action
 *
 * Contract: contracts/fulfillment/reservation-action.schema.json
 */
export default async function handler(req: Request, res: Response) {
  try {
    const reservationIdParam = req.params.reservationId;
    const reservationId = Array.isArray(reservationIdParam)
      ? reservationIdParam[0]
      : reservationIdParam;

    if (!reservationId || !String(reservationId).trim()) {
      return res.status(400).json({
        error: 'reservationId is required.',
      });
    }

    const body = req.body as {
      schemaVersion?: string;
      actionId?: string;
      reservationId?: string;
      orderId?: string;
      lineId?: string;
      action?: 'commit' | 'release' | 'expire';
      reasonCode?:
        | 'picked'
        | 'shipped'
        | 'order_canceled'
        | 'line_edited'
        | 'reservation_timeout'
        | 'manual_override';
      reasonMessage?: string;
      occurredAt?: string;
    };

    if (!body.actionId || !String(body.actionId).trim()) {
      return res.status(400).json({
        error: 'actionId is required.',
      });
    }
    if (!body.action || !['commit', 'release', 'expire'].includes(body.action)) {
      return res.status(400).json({
        error: 'action must be one of commit, release, expire.',
      });
    }

    if (body.reservationId && String(body.reservationId).trim() !== String(reservationId).trim()) {
      return res.status(400).json({
        error: 'reservationId in body must match route parameter.',
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
      occurredAt: body.occurredAt,
    });

    if (!result) {
      return res.status(404).json({
        error: 'Reservation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to apply reservation action:', error);
    return res.status(500).json({
      error: 'Failed to apply reservation action.',
    });
  }
}
