import type { Request, Response } from 'express';
import { upsertGoalsScenario } from '../../../lib/goals-store';
import type { GoalsScenarioInput } from '../../../../lib/goals-planner';

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as Partial<GoalsScenarioInput> | undefined;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Scenario payload is required.',
      });
    }

    const state = await upsertGoalsScenario(payload);
    return res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save scenario.';
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        success: false,
        error: message.replace('Validation:', '').trim(),
      });
    }
    console.error('Failed to save goal scenario:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save goal scenario.',
      message,
    });
  }
}
