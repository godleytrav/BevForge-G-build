import type { Request, Response } from 'express';
import {
  getComplianceSyncState,
  ingestComplianceFeed,
  type ComplianceFeed,
} from '../../../lib/compliance-store';

const DEFAULT_OS_BASE_URL = 'http://localhost:8080';

const resolveFeedPayload = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const row = payload as Record<string, unknown>;
  if ('events' in row && Array.isArray(row.events)) {
    return payload;
  }
  if (
    row.success === true &&
    row.data &&
    typeof row.data === 'object' &&
    'events' in (row.data as Record<string, unknown>)
  ) {
    return row.data;
  }
  if (
    row.success === true &&
    row.data &&
    typeof row.data === 'object' &&
    'feed' in (row.data as Record<string, unknown>)
  ) {
    return (row.data as Record<string, unknown>).feed;
  }
  return payload;
};

const fetchOsComplianceFeed = async (request: Request): Promise<unknown> => {
  const body = (request.body ?? {}) as Record<string, unknown>;
  const query = new globalThis.URLSearchParams();

  const siteId =
    typeof body.siteId === 'string'
      ? body.siteId
      : typeof request.query.siteId === 'string'
        ? request.query.siteId
        : undefined;
  if (siteId) query.set('siteId', siteId);

  const from =
    typeof body.from === 'string'
      ? body.from
      : typeof request.query.from === 'string'
        ? request.query.from
        : undefined;
  if (from) query.set('from', from);

  const to =
    typeof body.to === 'string'
      ? body.to
      : typeof request.query.to === 'string'
        ? request.query.to
        : undefined;
  if (to) query.set('to', to);

  const afterOccurredAt =
    typeof body.afterOccurredAt === 'string'
      ? body.afterOccurredAt
      : typeof request.query.afterOccurredAt === 'string'
        ? request.query.afterOccurredAt
        : undefined;
  if (afterOccurredAt) query.set('afterOccurredAt', afterOccurredAt);

  const afterId =
    typeof body.afterId === 'string'
      ? body.afterId
      : typeof request.query.afterId === 'string'
        ? request.query.afterId
        : undefined;
  if (afterId) query.set('afterId', afterId);

  const limit =
    typeof body.limit === 'number'
      ? String(body.limit)
      : typeof request.query.limit === 'string'
        ? request.query.limit
        : undefined;
  if (limit) query.set('limit', limit);

  const baseUrl = process.env.OS_BASE_URL ?? DEFAULT_OS_BASE_URL;
  const targetUrl = new globalThis.URL('/api/os/compliance/feed', baseUrl);
  targetUrl.search = query.toString();

  const response = await globalThis.fetch(targetUrl);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object'
        ? ((payload as Record<string, unknown>).error as string | undefined) ??
          ((payload as Record<string, unknown>).message as string | undefined) ??
          `OS compliance feed request failed (${response.status})`
        : `OS compliance feed request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

/**
 * POST /api/compliance/sync
 * Pulls OS compliance feed and ingests idempotently into OPS.
 *
 * Body options:
 * - { feed } to ingest provided feed payload directly (test/backfill path)
 * - otherwise OPS fetches /api/os/compliance/feed from OS_BASE_URL
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const directFeed = body.feed;
    const payload =
      directFeed && typeof directFeed === 'object'
        ? directFeed
        : await fetchOsComplianceFeed(req);
    const feed = resolveFeedPayload(payload) as ComplianceFeed;
    const result = await ingestComplianceFeed(feed);
    const state = await getComplianceSyncState();

    return res.json({
      success: true,
      data: {
        ...result,
        syncState: state,
      },
    });
  } catch (error) {
    console.error('Failed to sync compliance feed:', error);
    return res.status(502).json({
      success: false,
      error: 'Failed to sync compliance feed.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
