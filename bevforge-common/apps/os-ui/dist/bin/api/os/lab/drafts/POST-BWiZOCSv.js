import { u as upsertLabDraft, i as deleteLabDraft, s as setActiveLabDraftId } from '../../recipes/import/POST-B16W0CFH.js';

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
        error: "Unauthorized LAB drafts mutation"
      });
    }
    const { action, draft, recipeId } = req.body;
    if (action === "upsert") {
      if (!draft || typeof draft !== "object") {
        return res.status(400).json({
          success: false,
          error: "draft object is required for upsert."
        });
      }
      const draftId = typeof draft.id === "string" ? draft.id.trim() : "";
      if (!draftId) {
        return res.status(400).json({
          success: false,
          error: "draft.id is required for upsert."
        });
      }
      const state = await upsertLabDraft({
        ...draft,
        id: draftId
      });
      return res.status(200).json({
        success: true,
        data: state
      });
    }
    if (action === "delete") {
      const nextId = String(recipeId ?? "").trim();
      if (!nextId) {
        return res.status(400).json({
          success: false,
          error: "recipeId is required for delete."
        });
      }
      const state = await deleteLabDraft(nextId);
      return res.status(200).json({
        success: true,
        data: state
      });
    }
    if (action === "set_active") {
      const nextId = String(recipeId ?? "").trim() || void 0;
      const state = await setActiveLabDraftId(nextId);
      return res.status(200).json({
        success: true,
        data: state
      });
    }
    return res.status(400).json({
      success: false,
      error: "Valid action is required (upsert, delete, set_active)."
    });
  } catch (error) {
    console.error("Failed to mutate LAB drafts state:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mutate LAB drafts state."
    });
  }
}

export { handler as h };
