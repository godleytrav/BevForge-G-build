import type { Request, Response } from 'express';
import {
  listFulfillmentRequests,
  type FulfillmentRequestStatus,
  type FulfillmentRequestType,
} from '../../../../lib/inventory-batch-store.js';

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

/**
 * GET /api/os/fulfillment/requests
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteId = toOptionalText(Array.isArray(req.query.siteId) ? req.query.siteId[0] : req.query.siteId);
    const skuId = toOptionalText(Array.isArray(req.query.skuId) ? req.query.skuId[0] : req.query.skuId);
    const statusRaw = toOptionalText(Array.isArray(req.query.status) ? req.query.status[0] : req.query.status);
    const typeRaw = toOptionalText(Array.isArray(req.query.type) ? req.query.type[0] : req.query.type);
    const status =
      statusRaw === 'queued' ||
      statusRaw === 'accepted' ||
      statusRaw === 'in_progress' ||
      statusRaw === 'blocked' ||
      statusRaw === 'completed' ||
      statusRaw === 'canceled' ||
      statusRaw === 'rejected'
        ? (statusRaw as FulfillmentRequestStatus)
        : undefined;
    const type =
      typeRaw === 'production' || typeRaw === 'packaging'
        ? (typeRaw as FulfillmentRequestType)
        : undefined;

    const requests = await listFulfillmentRequests({
      siteId,
      status,
      type,
      skuId,
    });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Failed to load fulfillment requests:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load fulfillment requests.',
    });
  }
}
