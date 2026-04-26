import type { Request, Response } from 'express';
import { buildComplianceFeed } from '../../../../lib/compliance-feed-store.js';

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

/**
 * GET /api/os/compliance/feed
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteId = toOptionalText(Array.isArray(req.query.siteId) ? req.query.siteId[0] : req.query.siteId);
    const from = toOptionalText(Array.isArray(req.query.from) ? req.query.from[0] : req.query.from);
    const to = toOptionalText(Array.isArray(req.query.to) ? req.query.to[0] : req.query.to);
    const limit = toOptionalText(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit);
    const afterOccurredAt = toOptionalText(
      Array.isArray(req.query.afterOccurredAt) ? req.query.afterOccurredAt[0] : req.query.afterOccurredAt
    );
    const afterId = toOptionalText(Array.isArray(req.query.afterId) ? req.query.afterId[0] : req.query.afterId);
    const cursor = toOptionalText(Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor);

    const feed = await buildComplianceFeed({
      siteId,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      afterOccurredAt,
      afterId,
      cursor,
    });

    return res.status(200).json(feed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load compliance feed.';
    const status = /invalid|earlier than or equal/.test(message.toLowerCase()) ? 400 : 500;
    if (status >= 500) {
      console.error('Failed to load compliance feed:', error);
    }
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
}
