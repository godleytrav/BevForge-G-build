import type { Request, Response } from 'express';
import { publishFlowProfile, type FlowTapMappingInput } from '../../../../lib/flow-store.js';

/**
 * POST /api/os/flow/publish
 *
 * Creates a FLOW runtime profile exported from an OS canvas page.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      siteId?: string;
      kioskId?: string;
      pageId?: string;
      profileName?: string;
      tapMap?: FlowTapMappingInput[];
    };
    if (!body.siteId || !String(body.siteId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'siteId is required.',
      });
    }

    const profile = await publishFlowProfile({
      siteId: String(body.siteId).trim(),
      kioskId: body.kioskId,
      pageId: body.pageId,
      profileName: body.profileName,
      tapMap: Array.isArray(body.tapMap) ? body.tapMap : undefined,
    });

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Failed to publish FLOW profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to publish FLOW profile.',
    });
  }
}
