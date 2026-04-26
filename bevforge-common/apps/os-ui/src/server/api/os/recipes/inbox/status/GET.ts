import type { Request, Response } from 'express';
import { recipeInboxService } from '../../../../../lib/recipe-inbox-service.js';

/**
 * GET /api/os/recipes/inbox/status
 *
 * Returns recipe inbox watcher status and last scan summary.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    await recipeInboxService.start();
    return res.status(200).json({
      success: true,
      data: recipeInboxService.status(),
    });
  } catch (error) {
    console.error('Failed to load recipe inbox status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load recipe inbox status.',
    });
  }
}
