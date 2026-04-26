import type { Request, Response } from 'express';
import { createProcurementOrder } from '../../../../../lib/inventory-batch-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      siteId?: string;
      itemId?: string;
      orderedQty?: number;
      vendorName?: string;
      vendorUrl?: string;
      vendorOrderRef?: string;
      expectedAt?: string;
      costPerUnit?: number;
      vendorSku?: string;
      notes?: string;
    };

    if (!body.itemId || !String(body.itemId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'itemId is required.',
      });
    }
    if (!Number.isFinite(Number(body.orderedQty)) || Number(body.orderedQty) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'orderedQty must be greater than zero.',
      });
    }

    const order = await createProcurementOrder({
      siteId: String(body.siteId ?? 'main').trim() || 'main',
      itemId: String(body.itemId).trim(),
      orderedQty: Number(body.orderedQty),
      vendorName: body.vendorName,
      vendorUrl: body.vendorUrl,
      vendorOrderRef: body.vendorOrderRef,
      expectedAt: body.expectedAt,
      costPerUnit: body.costPerUnit,
      vendorSku: body.vendorSku,
      notes: body.notes,
    });

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create procurement order.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
