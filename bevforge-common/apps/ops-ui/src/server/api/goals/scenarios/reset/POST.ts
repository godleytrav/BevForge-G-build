import type { Request, Response } from 'express';
import { resetGoalsScenario } from '../../../../lib/goals-store';

export default async function handler(req: Request, res: Response) {
  try {
    const scenarioId =
      typeof req.body?.scenarioId === 'string' ? req.body.scenarioId : undefined;
    if (!scenarioId) {
      return res.status(400).json({
        success: false,
        error: 'scenarioId is required.',
      });
    }

    const state = await resetGoalsScenario(scenarioId);
    return res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset scenario.';
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        success: false,
        error: message.replace('Validation:', '').trim(),
      });
    }
    console.error('Failed to reset goal scenario:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset goal scenario.',
      message,
    });
  }
}
