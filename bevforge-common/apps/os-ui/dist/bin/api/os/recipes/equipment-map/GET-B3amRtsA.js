import { d as readCanvasProject, m as readDevices, n as readEquipmentRoleMap } from '../import/POST-B16W0CFH.js';

async function handler(_req, res) {
  try {
    const [project, devices, map] = await Promise.all([
      readCanvasProject(),
      readDevices(),
      readEquipmentRoleMap()
    ]);
    const publishedPages = (project.pages ?? []).filter((page) => page.mode === "published");
    const sourcePages = publishedPages.length > 0 ? publishedPages : project.pages ?? [];
    const source = publishedPages.length > 0 ? "published_pages" : "all_pages";
    const nodes = sourcePages.flatMap((page) => page.nodes ?? []);
    const options = [];
    const seen = /* @__PURE__ */ new Set();
    for (const node of nodes) {
      const ids = [node.id, node.data.logicalDeviceId].filter(Boolean);
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        options.push({
          value: id,
          label: `${node.data.label} (${node.data.widgetType})`,
          type: node.data.widgetType,
          source: "canvas"
        });
      }
    }
    for (const device of devices) {
      if (seen.has(device.id)) continue;
      seen.add(device.id);
      options.push({
        value: device.id,
        label: `${device.name} (${device.type})`,
        type: device.type,
        source: "registry"
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        map,
        options,
        source
      }
    });
  } catch (error) {
    console.error("Failed to read equipment role map:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to read equipment role map."
    });
  }
}

export { handler as h };
