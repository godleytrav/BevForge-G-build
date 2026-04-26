import { r as readInventoryState, d as buildInventorySummary } from '../../calendar/events/GET-DNBekL63.js';

async function handler(_req, res) {
  try {
    const state = await readInventoryState();
    const siteParam = _req.query.siteId;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const normalizedSiteId = siteId && String(siteId).trim() ? String(siteId).trim().toLowerCase() : null;
    const items = normalizedSiteId ? state.items.filter((item) => String(item.siteId).toLowerCase() === normalizedSiteId) : state.items;
    return res.status(200).json({
      success: true,
      data: {
        items,
        summary: buildInventorySummary(items),
        siteId: normalizedSiteId ?? void 0,
        updatedAt: state.updatedAt
      }
    });
  } catch (error) {
    console.error("Failed to load inventory:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load inventory."
    });
  }
}

export { handler as h };
