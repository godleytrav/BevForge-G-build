import { d as readCanvasProject, n as readEquipmentRoleMap, p as readTransferRouteMap, q as writeTransferRouteMap } from '../../import/POST-B16W0CFH.js';
import { a as buildSuggestedTransferRoutes } from '../../run/_runId_/transfer/POST-D07T26AX.js';

async function handler(_req, res) {
  try {
    const [project, equipmentMap, map] = await Promise.all([
      readCanvasProject(),
      readEquipmentRoleMap(),
      readTransferRouteMap()
    ]);
    const suggested = buildSuggestedTransferRoutes(project, equipmentMap, map);
    const updated = await writeTransferRouteMap(suggested);
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error("Failed to auto-fill transfer route map:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to auto-fill transfer route map."
    });
  }
}

export { handler as h };
