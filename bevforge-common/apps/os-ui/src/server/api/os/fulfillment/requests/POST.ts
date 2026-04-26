import type { Request, Response } from 'express';
import {
  createFulfillmentRequest,
  type FulfillmentRequestType,
} from '../../../../lib/inventory-batch-store.js';

const isType = (value: unknown): value is FulfillmentRequestType =>
  value === 'production' || value === 'packaging';

/**
 * POST /api/os/fulfillment/requests
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      requestId?: string;
      sourceSuite?: 'ops' | 'os' | 'lab' | 'flow' | 'connect';
      type?: FulfillmentRequestType;
      siteId?: string;
      skuId?: string;
      requestedQty?: number;
      uom?: string;
      orderId?: string;
      lineId?: string;
      neededBy?: string;
      reasonCode?: string;
      reasonMessage?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.requestId || !String(body.requestId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'requestId is required.',
      });
    }
    if (!isType(body.type)) {
      return res.status(400).json({
        success: false,
        error: 'type is required and must be production or packaging.',
      });
    }
    if (!body.siteId || !String(body.siteId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'siteId is required.',
      });
    }
    if (!body.skuId || !String(body.skuId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'skuId is required.',
      });
    }
    if (!Number.isFinite(Number(body.requestedQty)) || Number(body.requestedQty) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'requestedQty must be greater than zero.',
      });
    }
    if (!body.uom || !String(body.uom).trim()) {
      return res.status(400).json({
        success: false,
        error: 'uom is required.',
      });
    }

    const request = await createFulfillmentRequest({
      requestId: String(body.requestId).trim(),
      sourceSuite: body.sourceSuite ?? 'ops',
      type: body.type,
      siteId: String(body.siteId).trim(),
      skuId: String(body.skuId).trim(),
      requestedQty: Number(body.requestedQty),
      uom: String(body.uom).trim(),
      orderId: body.orderId ? String(body.orderId).trim() : undefined,
      lineId: body.lineId ? String(body.lineId).trim() : undefined,
      neededBy: body.neededBy ? String(body.neededBy).trim() : undefined,
      reasonCode: body.reasonCode ? String(body.reasonCode).trim() : undefined,
      reasonMessage: body.reasonMessage ? String(body.reasonMessage).trim() : undefined,
      metadata: body.metadata,
    });

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create fulfillment request.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}

