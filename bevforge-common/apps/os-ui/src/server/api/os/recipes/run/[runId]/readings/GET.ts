import type { Request, Response } from 'express';
import { listRecipeRunReadings } from '../../../../../../lib/recipe-readings-store.js';

/**
 * GET /api/os/recipes/run/:runId/readings
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

    const limitParam = req.query.limit;
    const parsedLimit = Array.isArray(limitParam) ? Number(limitParam[0]) : Number(limitParam);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 200;
    const readings = await listRecipeRunReadings(runId, limit);
    return res.status(200).json({
      success: true,
      data: readings,
    });
  } catch (error) {
    console.error('Failed to read recipe run readings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read recipe run readings.',
    });
  }
}
