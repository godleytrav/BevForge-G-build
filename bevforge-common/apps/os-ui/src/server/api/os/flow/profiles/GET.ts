import type { Request, Response } from 'express';
import { listFlowProfiles } from '../../../../lib/flow-store.js';

/**
 * GET /api/os/flow/profiles?siteId=<id>&kioskId=<id>&limit=<n>
 *
 * Lists published FLOW profiles for OS/edge deployment visibility.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteParam = req.query.siteId;
    const kioskParam = req.query.kioskId;
    const limitParam = req.query.limit;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const kioskId = Array.isArray(kioskParam) ? kioskParam[0] : kioskParam;
    const limit = Array.isArray(limitParam) ? limitParam[0] : limitParam;

    const profiles = await listFlowProfiles({
      siteId: siteId ? String(siteId).trim() : undefined,
      kioskId: kioskId ? String(kioskId).trim() : undefined,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : undefined,
    });
    return res.status(200).json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Failed to list FLOW profiles:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list FLOW profiles.',
    });
  }
}
