import { k as appendLabHandoffAuditEntry } from '../../recipes/import/POST-B16W0CFH.js';

const isAuthorized = (req) => {
  const requiredToken = process.env.OS_RECIPE_IMPORT_TOKEN;
  if (!requiredToken) return true;
  const headerToken = (typeof req.headers["x-os-import-token"] === "string" ? req.headers["x-os-import-token"] : void 0) || (typeof req.headers.authorization === "string" ? req.headers.authorization.replace(/^Bearer\s+/i, "") : void 0);
  return headerToken === requiredToken;
};
async function handler(req, res) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized LAB handoff audit mutation"
      });
    }
    const { entry } = req.body;
    if (!entry || !entry.status) {
      return res.status(400).json({
        success: false,
        error: "entry.status is required."
      });
    }
    const validStatuses = ["sent", "success", "failed", "blocked"];
    if (!validStatuses.includes(entry.status)) {
      return res.status(400).json({
        success: false,
        error: "entry.status must be one of sent, success, failed, blocked."
      });
    }
    const state = await appendLabHandoffAuditEntry({
      id: entry.id,
      timestamp: entry.timestamp,
      status: entry.status,
      recipeId: entry.recipeId,
      recipeName: entry.recipeName,
      importedRecipeId: entry.importedRecipeId,
      importedFormat: entry.importedFormat,
      osBaseUrl: entry.osBaseUrl,
      dryRunOk: entry.dryRunOk,
      warningCount: entry.warningCount,
      errorCount: entry.errorCount,
      message: entry.message,
      source: entry.source
    });
    return res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    console.error("Failed to append LAB handoff audit entry:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to append LAB handoff audit entry."
    });
  }
}

export { handler as h };
