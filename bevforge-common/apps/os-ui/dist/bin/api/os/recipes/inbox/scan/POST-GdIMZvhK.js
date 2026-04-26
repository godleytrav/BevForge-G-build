import { r as recipeInboxService } from '../../../../../index-BiQ9ukMS.js';

async function handler(_req, res) {
  try {
    await recipeInboxService.start();
    const scan = await recipeInboxService.scanNow();
    return res.status(200).json({
      success: true,
      data: scan
    });
  } catch (error) {
    console.error("Failed to scan recipe inbox:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to scan recipe inbox."
    });
  }
}

export { handler as h };
