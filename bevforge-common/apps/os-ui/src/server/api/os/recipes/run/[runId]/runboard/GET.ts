import type { Request, Response } from 'express';
import { recipeRunner } from '../../../../../../lib/recipe-runner.js';
import { getRecipeRunboardProfile } from '../../../../../../lib/recipe-runboard-store.js';
import { getBatchByRecipeRunId, listPackageLots } from '../../../../../../lib/inventory-batch-store.js';

/**
 * GET /api/os/recipes/run/:runId/runboard
 */
export default async function handler(req: Request, res: Response) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: 'runId is required.',
      });
    }

    const runs = await recipeRunner.snapshot();
    const run = runs.find((entry) => entry.runId === runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Run not found.',
      });
    }

    const [profile, batch] = await Promise.all([
      getRecipeRunboardProfile(runId),
      getBatchByRecipeRunId(runId),
    ]);
    const packageLots = batch
      ? await listPackageLots({ batchId: batch.id })
      : [];
    return res.status(200).json({
      success: true,
      data: {
        run,
        profile,
        batch,
        packageLots,
      },
    });
  } catch (error) {
    console.error('Failed to load runboard payload:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load runboard payload.',
    });
  }
}
