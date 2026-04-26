import { f as readInventoryMovements } from '../../../calendar/events/GET-DNBekL63.js';

async function handler(_req, res) {
  try {
    const state = await readInventoryMovements();
    const siteParam = _req.query.siteId;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const normalizedSiteId = siteId && String(siteId).trim() ? String(siteId).trim().toLowerCase() : null;
    const movements = normalizedSiteId ? state.movements.filter(
      (movement) => String(movement.siteId).toLowerCase() === normalizedSiteId
    ) : state.movements;
    return res.status(200).json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error("Failed to load inventory movements:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load inventory movements."
    });
  }
}

export { handler as h };
