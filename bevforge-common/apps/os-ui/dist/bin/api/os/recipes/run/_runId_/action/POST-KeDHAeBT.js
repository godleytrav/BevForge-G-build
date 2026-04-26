import { j as recipeRunner } from '../../../../../../index-BiQ9ukMS.js';

async function handler(req, res) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    const { action } = req.body;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: "runId is required."
      });
    }
    if (!action) {
      return res.status(400).json({
        success: false,
        error: "action is required."
      });
    }
    if (!["pause", "resume", "confirm", "next", "stop"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action."
      });
    }
    const run = await recipeRunner.controlRun(runId, action);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: "Run not found."
      });
    }
    return res.status(200).json({
      success: true,
      data: run
    });
  } catch (error) {
    console.error("Failed to control recipe run:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to control recipe run."
    });
  }
}

export { handler as h };
