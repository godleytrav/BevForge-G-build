export interface InventoryItemView {
  id: string;
  sku?: string;
  name: string;
  category: string;
  onHandQty: number;
  allocatedQty: number;
  onOrderQty: number;
  unit: string;
  reorderPointQty: number;
  trend: 'up' | 'down' | 'stable';
  costPerUnit?: number;
  vendorName?: string;
  vendorSku?: string;
  vendorProductUrl?: string;
  vendorLeadTimeDays?: number;
  vendorPackSize?: number;
  vendorDefaultOrderQty?: number;
  vendorNotes?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  beverageClass?: string;
  packageFormatCode?: string;
  packageType?: string;
  packagedLotCount?: number;
  packagedInBondQty?: number;
  packagedReleasedQty?: number;
  packagedAllocatedQty?: number;
  packagedShippedQty?: number;
  packagedTotalQty?: number;
  packagedReleaseState?: 'held' | 'ready' | 'released' | 'shipped' | 'mixed';
}

export type InventoryStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';
export type InventoryLaneFilter = 'all' | 'inputs' | 'supplies' | 'finished_goods' | 'low_stock';
export type InventoryFinishedGoodsStateFilter =
  | 'all'
  | 'in_bond'
  | 'released'
  | 'reserved'
  | 'removed';

export interface InventoryReportFilters {
  searchQuery: string;
  categoryFilter: string;
  vendorFilter: string;
  stockFilter: InventoryStockFilter;
  laneFilter?: InventoryLaneFilter;
  finishedGoodsStateFilter?: InventoryFinishedGoodsStateFilter;
}

export interface InventoryReportSummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  inStockItems: number;
  totalValue: number;
  onHandQty: number;
  allocatedQty: number;
  onOrderQty: number;
  availableQty: number;
}

export const defaultInventoryFilters: InventoryReportFilters = {
  searchQuery: '',
  categoryFilter: 'all',
  vendorFilter: 'all',
  stockFilter: 'all',
  laneFilter: 'all',
  finishedGoodsStateFilter: 'all',
};

const ingredientCategories = new Set(['yeast', 'malt', 'hops', 'fruit']);
const supplyCategories = new Set(['packaging', 'equipment', 'kegs']);

export const inventoryLaneOptions: Array<{ value: InventoryLaneFilter; label: string }> = [
  { value: 'all', label: 'All Inventory' },
  { value: 'inputs', label: 'Production Inputs' },
  { value: 'supplies', label: 'Packaging & Cellar Supplies' },
  { value: 'finished_goods', label: 'Finished Goods' },
  { value: 'low_stock', label: 'Low Stock Focus' },
];

export const finishedGoodsStateOptions: Array<{
  value: InventoryFinishedGoodsStateFilter;
  label: string;
}> = [
  { value: 'all', label: 'All Finished Goods' },
  { value: 'in_bond', label: 'In Bond' },
  { value: 'released', label: 'Released to OPS' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'removed', label: 'Removed / Shipped' },
];

export const isFinishedGoodsItem = (item: InventoryItemView) =>
  Number(item.packagedLotCount ?? 0) > 0 ||
  Number(item.packagedTotalQty ?? 0) > 0 ||
  Boolean(item.packagedReleaseState);

export const isProductionInputItem = (item: InventoryItemView) =>
  !isFinishedGoodsItem(item) && ingredientCategories.has(String(item.category ?? '').trim().toLowerCase());

export const isSupplyItem = (item: InventoryItemView) =>
  !isFinishedGoodsItem(item) && supplyCategories.has(String(item.category ?? '').trim().toLowerCase());

export const matchesInventoryLaneFilter = (
  item: InventoryItemView,
  laneFilter: InventoryLaneFilter
) => {
  const available = Math.max(0, item.onHandQty - item.allocatedQty);
  if (laneFilter === 'inputs') return isProductionInputItem(item);
  if (laneFilter === 'supplies') return isSupplyItem(item);
  if (laneFilter === 'finished_goods') return isFinishedGoodsItem(item);
  if (laneFilter === 'low_stock') return available <= item.reorderPointQty;
  return true;
};

export const matchesFinishedGoodsStateFilter = (
  item: InventoryItemView,
  stateFilter: InventoryFinishedGoodsStateFilter
) => {
  if (!isFinishedGoodsItem(item) || stateFilter === 'all') return true;
  const inBondQty = Number(item.packagedInBondQty ?? 0);
  const releasedQty = Number(item.packagedReleasedQty ?? 0);
  const reservedQty = Number(item.packagedAllocatedQty ?? 0);
  const removedQty = Number(item.packagedShippedQty ?? 0);
  if (stateFilter === 'in_bond') return inBondQty > 0;
  if (stateFilter === 'released') return releasedQty > 0;
  if (stateFilter === 'reserved') return reservedQty > 0;
  if (stateFilter === 'removed') return removedQty > 0;
  return true;
};

export const stockFilterOptions: Array<{ value: InventoryStockFilter; label: string }> = [
  { value: 'all', label: 'All Stock States' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out Of Stock' },
  { value: 'on_order', label: 'On Order' },
];

export const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'yeast', label: 'Yeast' },
  { value: 'malt', label: 'Malt & Grain' },
  { value: 'hops', label: 'Hops' },
  { value: 'fruit', label: 'Fruit & Adjuncts' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'kegs', label: 'Kegs & Barrels' },
];

export const normalizeInventoryItem = (item: InventoryItemView): InventoryItemView => ({
  ...item,
  onHandQty: Number(item.onHandQty ?? 0),
  allocatedQty: Number(item.allocatedQty ?? 0),
  onOrderQty: Number(item.onOrderQty ?? 0),
  reorderPointQty: Number(item.reorderPointQty ?? 0),
  trend:
    Number(item.onHandQty ?? 0) - Number(item.allocatedQty ?? 0) <= Number(item.reorderPointQty ?? 0)
      ? 'down'
      : 'stable',
});

export const filterInventoryItems = (
  items: InventoryItemView[],
  filters: InventoryReportFilters
): InventoryItemView[] =>
  items.filter((item) => {
    const available = Math.max(0, item.onHandQty - item.allocatedQty);
    const normalizedSearch = filters.searchQuery.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === '' ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.category.toLowerCase().includes(normalizedSearch) ||
      String(item.sku ?? '').toLowerCase().includes(normalizedSearch) ||
      String(item.vendorName ?? '').toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      filters.categoryFilter === 'all' || item.category === filters.categoryFilter;
    const matchesVendor =
      filters.vendorFilter === 'all' || String(item.vendorName ?? '').trim() === filters.vendorFilter;
    const matchesStock =
      filters.stockFilter === 'all' ||
      (filters.stockFilter === 'in_stock' && available > 0) ||
      (filters.stockFilter === 'low_stock' && available <= item.reorderPointQty) ||
      (filters.stockFilter === 'out_of_stock' && item.onHandQty <= 0) ||
      (filters.stockFilter === 'on_order' && Number(item.onOrderQty ?? 0) > 0);

    return matchesSearch && matchesCategory && matchesVendor && matchesStock;
  });

export const summarizeInventoryItems = (items: InventoryItemView[]): InventoryReportSummary => {
  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => item.onHandQty - item.allocatedQty <= item.reorderPointQty
  ).length;
  const outOfStockItems = items.filter((item) => item.onHandQty <= 0).length;
  const inStockItems = items.filter((item) => item.onHandQty > 0).length;
  const totalValue = items.reduce((sum, item) => sum + (item.costPerUnit || 0) * item.onHandQty, 0);
  const onHandQty = items.reduce((sum, item) => sum + item.onHandQty, 0);
  const allocatedQty = items.reduce((sum, item) => sum + item.allocatedQty, 0);
  const onOrderQty = items.reduce((sum, item) => sum + Number(item.onOrderQty ?? 0), 0);
  const availableQty = Math.max(0, onHandQty - allocatedQty);

  return {
    totalItems,
    lowStockItems,
    outOfStockItems,
    inStockItems,
    totalValue,
    onHandQty,
    allocatedQty,
    onOrderQty,
    availableQty,
  };
};

export const getActiveInventoryFilters = (filters: InventoryReportFilters): string[] => {
  const stockLabel = stockFilterOptions.find((option) => option.value === filters.stockFilter)?.label;
  const laneLabel = inventoryLaneOptions.find(
    (option) => option.value === (filters.laneFilter ?? 'all')
  )?.label;
  const finishedGoodsStateLabel = finishedGoodsStateOptions.find(
    (option) => option.value === (filters.finishedGoodsStateFilter ?? 'all')
  )?.label;

  return [
    filters.searchQuery.trim() ? `Search: ${filters.searchQuery.trim()}` : null,
    filters.categoryFilter !== 'all' ? `Category: ${filters.categoryFilter}` : null,
    filters.vendorFilter !== 'all' ? `Vendor: ${filters.vendorFilter}` : null,
    filters.stockFilter !== 'all' && stockLabel ? `Stock: ${stockLabel}` : null,
    (filters.laneFilter ?? 'all') !== 'all' && laneLabel ? `Lane: ${laneLabel}` : null,
    (filters.finishedGoodsStateFilter ?? 'all') !== 'all' && finishedGoodsStateLabel
      ? `Finished Goods: ${finishedGoodsStateLabel}`
      : null,
  ].filter((value): value is string => Boolean(value));
};

export const sanitizeInventoryFilename = (value: string) => {
  const trimmed = value.trim().replace(/\.[a-z0-9]+$/i, '');
  const sanitized = trimmed.replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '-');
  return sanitized.length > 0 ? sanitized : 'inventory-report';
};

export const buildInventoryFilename = (filters: InventoryReportFilters, date = new Date()) => {
  const parts = ['inventory'];
  if (filters.categoryFilter !== 'all') {
    parts.push(filters.categoryFilter);
  }
  if (filters.vendorFilter !== 'all') {
    parts.push(filters.vendorFilter.toLowerCase().replace(/\s+/g, '-'));
  }
  if (filters.stockFilter !== 'all') {
    parts.push(filters.stockFilter.replaceAll('_', '-'));
  }
  if ((filters.laneFilter ?? 'all') !== 'all') {
    parts.push(String(filters.laneFilter).replaceAll('_', '-'));
  }
  if ((filters.finishedGoodsStateFilter ?? 'all') !== 'all') {
    parts.push(String(filters.finishedGoodsStateFilter).replaceAll('_', '-'));
  }
  parts.push(date.toISOString().slice(0, 10));
  return sanitizeInventoryFilename(parts.join('-'));
};

export const buildInventoryCsv = (items: InventoryItemView[]) =>
  [
    'sku,name,category,on_hand,allocated,on_order,available,unit,reorder_point,cost_per_unit,vendor_name,vendor_sku,vendor_url',
    ...items.map((item) => {
      const available = Math.max(0, item.onHandQty - item.allocatedQty);
      return [
        item.sku ?? '',
        item.name,
        item.category,
        item.onHandQty,
        item.allocatedQty,
        item.onOrderQty ?? 0,
        available,
        item.unit,
        item.reorderPointQty,
        item.costPerUnit ?? '',
        item.vendorName ?? '',
        item.vendorSku ?? '',
        item.vendorProductUrl ?? '',
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',');
    }),
  ].join('\n');

export const inventoryReportSearchParams = (
  filters: InventoryReportFilters,
  fileName: string,
  autoPrint = false
) => {
  const params = new globalThis.URLSearchParams();
  if (filters.searchQuery.trim()) {
    params.set('search', filters.searchQuery.trim());
  }
  if (filters.categoryFilter !== 'all') {
    params.set('category', filters.categoryFilter);
  }
  if (filters.vendorFilter !== 'all') {
    params.set('vendor', filters.vendorFilter);
  }
  if (filters.stockFilter !== 'all') {
    params.set('stock', filters.stockFilter);
  }
  if ((filters.laneFilter ?? 'all') !== 'all') {
    params.set('lane', filters.laneFilter ?? 'all');
  }
  if ((filters.finishedGoodsStateFilter ?? 'all') !== 'all') {
    params.set('finishedGoodsState', filters.finishedGoodsStateFilter ?? 'all');
  }
  if (fileName.trim()) {
    params.set('filename', sanitizeInventoryFilename(fileName));
  }
  if (autoPrint) {
    params.set('autoprint', '1');
  }
  return params;
};
