import type { Request, Response } from 'express';
import { receiveProcurementOrderLine } from '../../../../../../../lib/inventory-batch-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const orderIdParam = req.params.orderId;
    const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
    if (!orderId || !String(orderId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required.',
      });
    }

    const body = req.body as {
      lineId?: string;
      receivedQty?: number;
      note?: string;
    };
    if (!Number.isFinite(Number(body.receivedQty)) || Number(body.receivedQty) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'receivedQty must be greater than zero.',
      });
    }

    const order = await receiveProcurementOrderLine({
      orderId: String(orderId).trim(),
      lineId: body.lineId,
      receivedQty: Number(body.receivedQty),
      note: body.note,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Procurement order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to receive procurement order line.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
