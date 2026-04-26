import type { Request, Response } from 'express';
import { recipeRunner } from '../../../../../lib/recipe-runner.js';
import { resetRecipeRunSideEffects } from '../../../../../lib/inventory-batch-store.js';

/**
 * POST /api/os/recipes/runs/reset
 *
 * Clears recipe run history and releases inventory allocations created by recipe runs.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const runIds = await recipeRunner.resetRuns();
    const resetSummary = await resetRecipeRunSideEffects(runIds);
    return res.status(200).json({
      success: true,
      data: {
        clearedRuns: runIds.length,
        ...resetSummary,
      },
    });
  } catch (error) {
    console.error('Failed to reset recipe run history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset recipe run history.',
    });
  }
}
