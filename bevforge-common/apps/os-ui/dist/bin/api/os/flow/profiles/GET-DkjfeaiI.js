import { l as listFlowProfiles } from '../pour-events/GET-LI4duKA3.js';

async function handler(req, res) {
  try {
    const siteParam = req.query.siteId;
    const kioskParam = req.query.kioskId;
    const limitParam = req.query.limit;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const kioskId = Array.isArray(kioskParam) ? kioskParam[0] : kioskParam;
    const limit = Array.isArray(limitParam) ? limitParam[0] : limitParam;
    const profiles = await listFlowProfiles({
      siteId: siteId ? String(siteId).trim() : void 0,
      kioskId: kioskId ? String(kioskId).trim() : void 0,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : void 0
    });
    return res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error("Failed to list FLOW profiles:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to list FLOW profiles."
    });
  }
}

export { handler as h };
