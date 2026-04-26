import { o as writeEquipmentRoleMap } from '../import/POST-B16W0CFH.js';

async function handler(req, res) {
  try {
    const roles = req.body?.roles;
    if (!roles || typeof roles !== "object") {
      return res.status(400).json({
        success: false,
        error: "roles object is required."
      });
    }
    const updated = await writeEquipmentRoleMap(roles);
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error("Failed to update equipment role map:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update equipment role map."
    });
  }
}

export { handler as h };
