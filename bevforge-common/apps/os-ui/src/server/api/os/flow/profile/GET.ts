import type { Request, Response } from 'express';
import { getLatestFlowProfile, listFlowProfiles } from '../../../../lib/flow-store.js';

/**
 * GET /api/os/flow/profile?siteId=<id>&kioskId=<id>&profileId=<id>
 *
 * Returns the latest FLOW profile for a site/kiosk, or a specific profileId when provided.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteParam = req.query.siteId;
    const kioskParam = req.query.kioskId;
    const profileParam = req.query.profileId;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const kioskId = Array.isArray(kioskParam) ? kioskParam[0] : kioskParam;
    const profileId = Array.isArray(profileParam) ? profileParam[0] : profileParam;

    if (!siteId || !String(siteId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'siteId is required.',
      });
    }

    if (profileId && String(profileId).trim()) {
      const matches = await listFlowProfiles({
        siteId: String(siteId).trim(),
        kioskId: kioskId ? String(kioskId).trim() : undefined,
        limit: 500,
      });
      const match = matches.find((profile) => profile.id === String(profileId).trim());
      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'FLOW profile not found.',
        });
      }
      return res.status(200).json({
        success: true,
        data: match,
      });
    }

    const profile = await getLatestFlowProfile({
      siteId: String(siteId).trim(),
      kioskId: kioskId ? String(kioskId).trim() : undefined,
    });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No FLOW profile published for the requested site/kiosk.',
      });
    }
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Failed to load FLOW profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load FLOW profile.',
    });
  }
}
