import { a as automationRunner } from '../../POST-C5jdG3c5.js';

async function handler(req, res) {
  try {
    const { runId } = req.params;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: "runId is required."
      });
    }
    const accepted = await automationRunner.stopRun(runId);
    if (!accepted) {
      return res.status(404).json({
        success: false,
        error: "Run not found."
      });
    }
    return res.status(200).json({
      success: true,
      data: { runId, stopRequested: true }
    });
  } catch (error) {
    console.error("Failed to stop automation run:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to stop automation run."
    });
  }
}

export { handler as h };
