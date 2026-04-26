import { r as recipeInboxService } from '../../../../../index-BiQ9ukMS.js';

async function handler(_req, res) {
  try {
    await recipeInboxService.start();
    return res.status(200).json({
      success: true,
      data: recipeInboxService.status()
    });
  } catch (error) {
    console.error("Failed to load recipe inbox status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load recipe inbox status."
    });
  }
}

export { handler as h };
