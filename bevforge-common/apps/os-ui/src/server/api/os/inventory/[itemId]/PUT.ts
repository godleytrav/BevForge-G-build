import type { Request, Response } from 'express';
import {
  buildInventorySummary,
  readInventoryState,
  updateInventoryItem,
  type InventoryCategory,
} from '../../../../lib/inventory-batch-store.js';

const toCategory = (value: unknown): InventoryCategory | 'other' | undefined => {
  if (value === undefined) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (
    normalized === 'yeast' ||
    normalized === 'malt' ||
    normalized === 'hops' ||
    normalized === 'fruit' ||
    normalized === 'packaging' ||
    normalized === 'equipment'
  ) {
    return normalized;
  }
  if (normalized === 'other') return 'other';
  return undefined;
};

export default async function handler(req: Request, res: Response) {
  try {
    const itemIdParam = req.params.itemId;
    const itemId = Array.isArray(itemIdParam) ? itemIdParam[0] : itemIdParam;
    if (!itemId || !String(itemId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'itemId is required.',
      });
    }

    const body = req.body as {
      siteId?: string;
      name?: string;
      category?: string;
      unit?: string;
      onHandQty?: number;
      allocatedQty?: number;
      onOrderQty?: number;
      reorderPointQty?: number;
      costPerUnit?: number | null;
      vendorName?: string;
      vendorSku?: string;
      vendorProductUrl?: string;
      vendorLeadTimeDays?: number;
      vendorPackSize?: number;
      vendorDefaultOrderQty?: number;
      vendorNotes?: string;
    };

    const updated = await updateInventoryItem({
      itemId: String(itemId).trim(),
      siteId: body.siteId,
      patch: {
        name: body.name,
        category: toCategory(body.category),
        unit: body.unit,
        onHandQty: body.onHandQty,
        allocatedQty: body.allocatedQty,
        onOrderQty: body.onOrderQty,
        reorderPointQty: body.reorderPointQty,
        costPerUnit: body.costPerUnit === null ? undefined : body.costPerUnit,
        vendorName: body.vendorName,
        vendorSku: body.vendorSku,
        vendorProductUrl: body.vendorProductUrl,
        vendorLeadTimeDays: body.vendorLeadTimeDays,
        vendorPackSize: body.vendorPackSize,
        vendorDefaultOrderQty: body.vendorDefaultOrderQty,
        vendorNotes: body.vendorNotes,
      },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found.',
      });
    }

    const inventory = await readInventoryState();
    return res.status(200).json({
      success: true,
      data: {
        item: updated,
        summary: buildInventorySummary(inventory.items),
      },
    });
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update inventory item.',
    });
  }
}
