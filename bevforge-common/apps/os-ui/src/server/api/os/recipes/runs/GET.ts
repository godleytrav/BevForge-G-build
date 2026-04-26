import type { Request, Response } from 'express';
import { recipeRunner } from '../../../../lib/recipe-runner.js';

/**
 * GET /api/os/recipes/runs
 *
 * Returns recipe execution run history and live states.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const runs = await recipeRunner.snapshot();
    return res.status(200).json({
      success: true,
      data: runs,
    });
  } catch (error) {
    console.error('Failed to load recipe runs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load recipe runs.',
    });
  }
}
