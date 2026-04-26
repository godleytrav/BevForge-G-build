import { d as readCanvasProject, m as readDevices, n as readEquipmentRoleMap, p as readTransferRouteMap } from '../import/POST-B16W0CFH.js';
import { b as buildTransferRouteOptions, a as buildSuggestedTransferRoutes, t as transferRouteDefs } from '../run/_runId_/transfer/POST-D07T26AX.js';

async function handler(_req, res) {
  try {
    const [project, devices, equipmentMap, map] = await Promise.all([
      readCanvasProject(),
      readDevices(),
      readEquipmentRoleMap(),
      readTransferRouteMap()
    ]);
    const optionData = buildTransferRouteOptions(project, devices);
    const suggestedRoutes = buildSuggestedTransferRoutes(project, equipmentMap, map);
    return res.status(200).json({
      success: true,
      data: {
        map,
        routeDefs: transferRouteDefs,
        options: optionData.options,
        source: optionData.source,
        suggestedRoutes
      }
    });
  } catch (error) {
    console.error("Failed to read transfer route map:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to read transfer route map."
    });
  }
}

export { handler as h };
