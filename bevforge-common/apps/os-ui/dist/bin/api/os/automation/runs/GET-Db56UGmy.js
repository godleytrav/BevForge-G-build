import { a as automationRunner } from '../run/POST-C5jdG3c5.js';

async function handler(_req, res) {
  try {
    const runs = await automationRunner.snapshot();
    return res.status(200).json({
      success: true,
      data: runs
    });
  } catch (error) {
    console.error("Failed to fetch automation runs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch automation runs"
    });
  }
}

export { handler as h };
