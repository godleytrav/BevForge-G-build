import { j as recipeRunner } from '../../../../index-BiQ9ukMS.js';

async function handler(_req, res) {
  try {
    const runs = await recipeRunner.snapshot();
    return res.status(200).json({
      success: true,
      data: runs
    });
  } catch (error) {
    console.error("Failed to load recipe runs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load recipe runs."
    });
  }
}

export { handler as h };
