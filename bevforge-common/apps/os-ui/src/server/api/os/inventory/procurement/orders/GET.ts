import type { Request, Response } from 'express';
import {
  listProcurementOrders,
  type ProcurementOrderStatus,
} from '../../../../../lib/inventory-batch-store.js';

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

export default async function handler(req: Request, res: Response) {
  try {
    const siteId = toOptionalText(
      Array.isArray(req.query.siteId) ? req.query.siteId[0] : req.query.siteId
    );
    const statusRaw = toOptionalText(
      Array.isArray(req.query.status) ? req.query.status[0] : req.query.status
    );
    const status =
      statusRaw === 'ordered' ||
      statusRaw === 'partially_received' ||
      statusRaw === 'received' ||
      statusRaw === 'canceled' ||
      statusRaw === 'pending'
        ? (statusRaw as ProcurementOrderStatus | 'pending')
        : undefined;

    const orders = await listProcurementOrders({
      siteId,
      status,
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Failed to load procurement orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load procurement orders.',
    });
  }
}
