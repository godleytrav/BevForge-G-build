import type { Request, Response } from 'express';
import {
  buildPlanFromCanvasAutomation,
  buildPlanFromRecipe,
} from '../../../../lib/execution/engine.js';
import type {
  CanvasAutomationDefinition,
  RecipeExecutionDefinition,
} from '../../../../lib/execution/types.js';

/**
 * POST /api/os/automation/preview
 *
 * Build a normalized execution plan from either:
 * - canvas automation definition
 * - recipe execution definition
 */
export default async function handler(req: Request, res: Response) {
  try {
    const mode = String(req.body?.mode ?? '');
    if (mode === 'canvas') {
      const definition = req.body?.definition as CanvasAutomationDefinition | undefined;
      if (!definition?.id || !Array.isArray(definition.steps)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid canvas automation definition.',
        });
      }
      const plan = buildPlanFromCanvasAutomation(definition);
      return res.status(200).json({
        success: true,
        data: plan,
      });
    }

    if (mode === 'recipe') {
      const definition = req.body?.definition as RecipeExecutionDefinition | undefined;
      if (!definition?.id || !Array.isArray(definition.steps)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid recipe execution definition.',
        });
      }
      const plan = buildPlanFromRecipe(definition);
      return res.status(200).json({
        success: true,
        data: plan,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'mode must be "canvas" or "recipe".',
    });
  } catch (error) {
    console.error('Automation preview failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to build execution plan.',
    });
  }
}
