import type { Request, Response } from 'express';
import { listFulfillmentOutboxEvents } from '../../../../lib/inventory-batch-store.js';

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

/**
 * GET /api/os/fulfillment/outbox
 */
export default async function handler(req: Request, res: Response) {
  try {
    const cursorRaw = toOptionalText(
      Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor
    );
    const limitRaw = toOptionalText(
      Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
    );
    const siteId = toOptionalText(
      Array.isArray(req.query.siteId) ? req.query.siteId[0] : req.query.siteId
    );
    const cursor = cursorRaw !== undefined ? Number(cursorRaw) : undefined;
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;

    const feed = await listFulfillmentOutboxEvents({
      cursor,
      limit,
      siteId,
    });

    return res.status(200).json({
      success: true,
      data: feed.events,
      cursor: {
        previous: Number.isFinite(Number(cursor)) ? Number(cursor) : 0,
        next: feed.nextCursor,
      },
    });
  } catch (error) {
    console.error('Failed to load fulfillment outbox:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load fulfillment outbox.',
    });
  }
}
