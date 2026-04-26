import { q as writeTransferRouteMap } from '../import/POST-B16W0CFH.js';

async function handler(req, res) {
  try {
    const routes = req.body?.routes;
    if (!routes || typeof routes !== "object") {
      return res.status(400).json({
        success: false,
        error: "routes object is required."
      });
    }
    const updated = await writeTransferRouteMap(routes);
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error("Failed to update transfer route map:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update transfer route map."
    });
  }
}

export { handler as h };
