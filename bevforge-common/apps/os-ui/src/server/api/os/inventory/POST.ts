import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  buildInventorySummary,
  readInventoryState,
  writeInventoryState,
  type InventoryCategory,
} from '../../../lib/inventory-batch-store.js';

const validCategory = (value: string): InventoryCategory | 'other' => {
  const next = value.trim().toLowerCase();
  if (
    next === 'yeast' ||
    next === 'malt' ||
    next === 'hops' ||
    next === 'fruit' ||
    next === 'packaging' ||
    next === 'equipment'
  ) {
    return next;
  }
  return 'other';
};

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      name?: string;
      skuId?: string;
      sku?: string;
      siteId?: string;
      category?: string;
      unit?: string;
      onHandQty?: number;
      onOrderQty?: number;
      reorderPointQty?: number;
      costPerUnit?: number;
      vendorName?: string;
      vendorSku?: string;
      vendorProductUrl?: string;
      vendorLeadTimeDays?: number;
      vendorPackSize?: number;
      vendorDefaultOrderQty?: number;
      vendorNotes?: string;
    };
    if (!body.name || !body.unit) {
      return res.status(400).json({
        success: false,
        error: 'name and unit are required.',
      });
    }

    const normalizedSku =
      body.skuId?.trim() ||
      body.sku?.trim() ||
      body.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const state = await readInventoryState();
    const createdAt = new Date().toISOString();
    const item = {
      id: randomUUID(),
      skuId: normalizedSku,
      sku: normalizedSku,
      siteId: String(body.siteId ?? 'main').trim().toLowerCase() || 'main',
      name: body.name.trim(),
      category: validCategory(body.category ?? 'other'),
      unit: body.unit.trim(),
      onHandQty: Number.isFinite(Number(body.onHandQty)) ? Number(body.onHandQty) : 0,
      allocatedQty: 0,
      onOrderQty: Number.isFinite(Number(body.onOrderQty)) ? Number(body.onOrderQty) : 0,
      reorderPointQty: Number.isFinite(Number(body.reorderPointQty))
        ? Number(body.reorderPointQty)
        : 0,
      costPerUnit: Number.isFinite(Number(body.costPerUnit))
        ? Number(body.costPerUnit)
        : undefined,
      vendorName: body.vendorName ? String(body.vendorName).trim() : undefined,
      vendorSku: body.vendorSku ? String(body.vendorSku).trim() : undefined,
      vendorProductUrl: body.vendorProductUrl ? String(body.vendorProductUrl).trim() : undefined,
      vendorLeadTimeDays: Number.isFinite(Number(body.vendorLeadTimeDays))
        ? Number(body.vendorLeadTimeDays)
        : undefined,
      vendorPackSize: Number.isFinite(Number(body.vendorPackSize))
        ? Number(body.vendorPackSize)
        : undefined,
      vendorDefaultOrderQty: Number.isFinite(Number(body.vendorDefaultOrderQty))
        ? Number(body.vendorDefaultOrderQty)
        : undefined,
      vendorNotes: body.vendorNotes ? String(body.vendorNotes).trim() : undefined,
      createdAt,
      updatedAt: createdAt,
    };

    const next = await writeInventoryState({
      ...state,
      items: [item, ...state.items],
    });
    return res.status(200).json({
      success: true,
      data: {
        item,
        summary: buildInventorySummary(next.items),
      },
    });
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create inventory item.',
    });
  }
}
