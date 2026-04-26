import type { Request, Response } from 'express';
import { recipeRunner } from '../../../../../../../lib/recipe-runner.js';

/**
 * PUT /api/os/recipes/run/:runId/steps/:stepId
 *
 * Body patch fields:
 * - name
 * - durationMin
 * - temperatureC
 * - value
 * - targetDeviceId
 * - command
 * - triggerWhen
 * - requiresUserConfirm
 * - autoProceed
 */
export default async function handler(req: Request, res: Response) {
  try {
    const runIdParam = req.params.runId;
    const stepIdParam = req.params.stepId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    const stepId = Array.isArray(stepIdParam) ? stepIdParam[0] : stepIdParam;
    if (!runId || !stepId) {
      return res.status(400).json({
        success: false,
        error: 'runId and stepId are required.',
      });
    }
    const patch = req.body as {
      name?: string;
      durationMin?: number | null;
      temperatureC?: number | null;
      value?: string | number | boolean | null;
      targetDeviceId?: string | null;
      command?: string | null;
      triggerWhen?: string | null;
      requiresUserConfirm?: boolean;
      autoProceed?: boolean;
    };

    const run = await recipeRunner.updateStep(runId, stepId, patch);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Run or step not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error('Failed to update recipe run step:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update recipe run step.',
    });
  }
}
