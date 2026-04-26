import type { Request, Response } from 'express';
import { automationRunner } from '../../../../lib/automation-runner.js';

/**
 * GET /api/os/automation/runs
 *
 * Returns automation run history and live status.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const runs = await automationRunner.snapshot();
    return res.status(200).json({
      success: true,
      data: runs,
    });
  } catch (error) {
    console.error('Failed to fetch automation runs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch automation runs',
    });
  }
}
