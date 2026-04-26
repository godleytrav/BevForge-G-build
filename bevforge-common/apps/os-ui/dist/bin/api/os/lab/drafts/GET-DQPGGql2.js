import { g as readLabDraftsState } from '../../recipes/import/POST-B16W0CFH.js';

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
        error: "Unauthorized LAB drafts access"
      });
    }
    const state = await readLabDraftsState();
    return res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    console.error("Failed to read LAB drafts state:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to read LAB drafts state."
    });
  }
}

export { handler as h };
