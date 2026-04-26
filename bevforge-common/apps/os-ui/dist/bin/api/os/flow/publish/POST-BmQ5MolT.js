import { p as publishFlowProfile } from '../pour-events/GET-LI4duKA3.js';

async function handler(req, res) {
  try {
    const body = req.body;
    if (!body.siteId || !String(body.siteId).trim()) {
      return res.status(400).json({
        success: false,
        error: "siteId is required."
      });
    }
    const profile = await publishFlowProfile({
      siteId: String(body.siteId).trim(),
      kioskId: body.kioskId,
      pageId: body.pageId,
      profileName: body.profileName,
      tapMap: Array.isArray(body.tapMap) ? body.tapMap : void 0
    });
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error("Failed to publish FLOW profile:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to publish FLOW profile."
    });
  }
}

export { handler as h };
