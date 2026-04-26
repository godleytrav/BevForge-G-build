import { j as recipeRunner } from '../../../../../index-BiQ9ukMS.js';
import { m as resetRecipeRunSideEffects } from '../../../../calendar/events/GET-DNBekL63.js';

async function handler(_req, res) {
  try {
    const runIds = await recipeRunner.resetRuns();
    const resetSummary = await resetRecipeRunSideEffects(runIds);
    return res.status(200).json({
      success: true,
      data: {
        clearedRuns: runIds.length,
        ...resetSummary
      }
    });
  } catch (error) {
    console.error("Failed to reset recipe run history:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reset recipe run history."
    });
  }
}

export { handler as h };
