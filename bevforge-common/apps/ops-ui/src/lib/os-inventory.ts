export interface OsInventoryItem {
  id: string;
  skuId: string;
  name: string;
  unit: string;
  onHandQty: number;
  allocatedQty: number;
  reorderPointQty: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export function parseOsInventoryItems(payload: unknown): OsInventoryItem[] {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const items = isRecord(root) && Array.isArray(root.items) ? root.items : [];

  return items
    .filter(isRecord)
    .map((item) => ({
      id: String(item.id ?? ''),
      skuId: String(item.skuId ?? item.sku ?? item.id ?? ''),
      name: String(item.name ?? 'Unknown'),
      unit: String(item.unit ?? item.unit_of_measure ?? 'units'),
      onHandQty: toNumber(item.onHandQty ?? item.quantity_on_hand),
      allocatedQty: toNumber(item.allocatedQty ?? item.quantity_allocated),
      reorderPointQty: toNumber(item.reorderPointQty ?? item.reorder_point_qty ?? item.reorderPoint),
    }))
    .filter((item) => item.id.length > 0 && item.skuId.length > 0);
}
