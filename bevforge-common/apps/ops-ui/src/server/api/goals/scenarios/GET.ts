import type { Request, Response } from 'express';
import { listGoalsScenarios } from '../../../lib/goals-store';

export default async function handler(_req: Request, res: Response) {
  try {
    const state = await listGoalsScenarios();
    return res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Failed to list goal scenarios:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list goal scenarios.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
