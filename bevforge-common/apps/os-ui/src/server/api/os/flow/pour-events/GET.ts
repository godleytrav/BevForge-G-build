import type { Request, Response } from 'express';
import { listFlowPourEvents } from '../../../../lib/flow-store.js';

/**
 * GET /api/os/flow/pour-events?siteId=<id>&limit=<n>
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteParam = req.query.siteId;
    const limitParam = req.query.limit;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const limit = Array.isArray(limitParam) ? limitParam[0] : limitParam;

    const records = await listFlowPourEvents({
      siteId: siteId ? String(siteId).trim() : undefined,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : undefined,
    });
    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Failed to list FLOW pour events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list FLOW pour events.',
    });
  }
}
