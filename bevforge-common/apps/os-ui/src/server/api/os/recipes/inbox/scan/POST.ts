import type { Request, Response } from 'express';
import { recipeInboxService } from '../../../../../lib/recipe-inbox-service.js';

/**
 * POST /api/os/recipes/inbox/scan
 *
 * Triggers an immediate inbox scan.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    await recipeInboxService.start();
    const scan = await recipeInboxService.scanNow();
    return res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    console.error('Failed to scan recipe inbox:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scan recipe inbox.',
    });
  }
}
