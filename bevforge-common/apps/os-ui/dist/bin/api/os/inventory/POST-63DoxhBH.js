import { randomUUID } from 'node:crypto';
import { r as readInventoryState, w as writeInventoryState, d as buildInventorySummary } from '../../calendar/events/GET-DNBekL63.js';

const validCategory = (value) => {
  const next = value.trim().toLowerCase();
  if (next === "yeast" || next === "malt" || next === "hops" || next === "fruit" || next === "packaging" || next === "equipment") {
    return next;
  }
  return "other";
};
async function handler(req, res) {
  try {
    const body = req.body;
    if (!body.name || !body.unit) {
      return res.status(400).json({
        success: false,
        error: "name and unit are required."
      });
    }
    const normalizedSku = body.skuId?.trim() || body.sku?.trim() || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const state = await readInventoryState();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const item = {
      id: randomUUID(),
      skuId: normalizedSku,
      sku: normalizedSku,
      siteId: String(body.siteId ?? "main").trim().toLowerCase() || "main",
      name: body.name.trim(),
      category: validCategory(body.category ?? "other"),
      unit: body.unit.trim(),
      onHandQty: Number.isFinite(Number(body.onHandQty)) ? Number(body.onHandQty) : 0,
      allocatedQty: 0,
      reorderPointQty: Number.isFinite(Number(body.reorderPointQty)) ? Number(body.reorderPointQty) : 0,
      costPerUnit: Number.isFinite(Number(body.costPerUnit)) ? Number(body.costPerUnit) : void 0,
      createdAt,
      updatedAt: createdAt
    };
    const next = await writeInventoryState({
      ...state,
      items: [item, ...state.items]
    });
    return res.status(200).json({
      success: true,
      data: {
        item,
        summary: buildInventorySummary(next.items)
      }
    });
  } catch (error) {
    console.error("Failed to create inventory item:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create inventory item."
    });
  }
}

export { handler as h };
