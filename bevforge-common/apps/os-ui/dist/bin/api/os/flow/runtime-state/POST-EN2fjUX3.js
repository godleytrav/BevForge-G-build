import { u as upsertFlowRuntimeSnapshot } from '../pour-events/GET-LI4duKA3.js';

async function handler(req, res) {
  try {
    const body = req.body;
    if (!body.siteId || !String(body.siteId).trim()) {
      return res.status(400).json({
        success: false,
        error: "siteId is required."
      });
    }
    const snapshot = await upsertFlowRuntimeSnapshot(body);
    return res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    console.error("Failed to upsert FLOW runtime snapshot:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to upsert FLOW runtime snapshot."
    });
  }
}

export { handler as h };
