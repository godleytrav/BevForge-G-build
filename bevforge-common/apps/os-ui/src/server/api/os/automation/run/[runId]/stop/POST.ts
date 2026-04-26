import type { Request, Response } from 'express';
import { automationRunner } from '../../../../../../lib/automation-runner.js';

/**
 * POST /api/os/automation/run/:runId/stop
 *
 * Requests stop for a running automation run.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: 'runId is required.',
      });
    }

    const accepted = await automationRunner.stopRun(runId);
    if (!accepted) {
      return res.status(404).json({
        success: false,
        error: 'Run not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { runId, stopRequested: true },
    });
  } catch (error) {
    console.error('Failed to stop automation run:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop automation run.',
    });
  }
}
