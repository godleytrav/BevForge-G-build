import type { Request, Response } from 'express';
import { upsertRecipeRunboardProfile } from '../../../../../../lib/recipe-runboard-store.js';

/**
 * PUT /api/os/recipes/run/:runId/runboard
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

    const body = req.body as {
      targetOg?: number | null;
      targetFg?: number | null;
      targetAbvPct?: number | null;
      notes?: string | null;
    };

    const profile = await upsertRecipeRunboardProfile({
      runId: String(runId).trim(),
      targetOg: body.targetOg,
      targetFg: body.targetFg,
      targetAbvPct: body.targetAbvPct,
      notes: body.notes,
    });

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save runboard profile.';
    const statusCode = message.startsWith('Recipe run not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
