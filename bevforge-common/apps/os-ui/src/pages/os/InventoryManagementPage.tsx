import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import InventoryTable from '@/components/InventoryTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  Download,
  Package,
  Beaker,
  Wheat,
  Hop,
  Apple,
  Wrench,
  Box,
  Beer,
  AlertTriangle,
  ClipboardCheck,
  Printer,
} from 'lucide-react';
import {
  buildInventoryCsv,
  buildInventoryFilename,
  categoryOptions,
  defaultInventoryFilters,
  filterInventoryItems,
  finishedGoodsStateOptions,
  getActiveInventoryFilters,
  InventoryFinishedGoodsStateFilter,
  InventoryItemView,
  InventoryLaneFilter,
  InventoryReportFilters,
  inventoryReportSearchParams,
  InventoryStockFilter,
  matchesFinishedGoodsStateFilter,
  isFinishedGoodsItem,
  isProductionInputItem,
  isSupplyItem,
  matchesInventoryLaneFilter,
  normalizeInventoryItem,
  sanitizeInventoryFilename,
  stockFilterOptions,
  summarizeInventoryItems,
} from '@/lib/inventory-reporting';

interface InventoryEditForm {
  name: string;
  category: string;
  unit: string;
  onHandQty: string;
  allocatedQty: string;
  onOrderQty: string;
  reorderPointQty: string;
  costPerUnit: string;
  vendorName: string;
  vendorSku: string;
  vendorProductUrl: string;
  vendorLeadTimeDays: string;
  vendorPackSize: string;
  vendorDefaultOrderQty: string;
  vendorNotes: string;
  orderQty: string;
}

const buildEditForm = (item: InventoryItemView): InventoryEditForm => ({
  name: item.name,
  category: item.category,
  unit: item.unit,
  onHandQty: String(item.onHandQty ?? 0),
  allocatedQty: String(item.allocatedQty ?? 0),
  onOrderQty: String(item.onOrderQty ?? 0),
  reorderPointQty: String(item.reorderPointQty ?? 0),
  costPerUnit: item.costPerUnit !== undefined ? String(item.costPerUnit) : '',
  vendorName: item.vendorName ?? '',
  vendorSku: item.vendorSku ?? '',
  vendorProductUrl: item.vendorProductUrl ?? '',
  vendorLeadTimeDays:
    item.vendorLeadTimeDays !== undefined ? String(item.vendorLeadTimeDays) : '',
  vendorPackSize: item.vendorPackSize !== undefined ? String(item.vendorPackSize) : '',
  vendorDefaultOrderQty:
    item.vendorDefaultOrderQty !== undefined ? String(item.vendorDefaultOrderQty) : '',
  vendorNotes: item.vendorNotes ?? '',
  orderQty:
    item.vendorDefaultOrderQty !== undefined
      ? String(item.vendorDefaultOrderQty)
      : String(Math.max(1, item.reorderPointQty || 1)),
});

export default function InventoryManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<InventoryStockFilter>('all');
  const [laneFilter, setLaneFilter] = useState<InventoryLaneFilter>('all');
  const [finishedGoodsStateFilter, setFinishedGoodsStateFilter] =
    useState<InventoryFinishedGoodsStateFilter>('all');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterDraft, setFilterDraft] = useState<InventoryReportFilters>(defaultInventoryFilters);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportFileName, setExportFileName] = useState(buildInventoryFilename(defaultInventoryFilters));
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [items, setItems] = useState<InventoryItemView[]>([]);
  const [status, setStatus] = useState('Loading inventory...');
  const [savingEdit, setSavingEdit] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItemView | null>(null);
  const [editForm, setEditForm] = useState<InventoryEditForm | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const categories = [
    { id: 'yeast', name: 'Yeast', icon: Beaker, description: 'Ale, lager, wine yeast', isIngredient: true },
    { id: 'malt', name: 'Malt & Grain', icon: Wheat, description: 'Base, specialty, adjunct', isIngredient: true },
    { id: 'hops', name: 'Hops', icon: Hop, description: 'Bittering, aroma, dual-purpose', isIngredient: true },
    { id: 'fruit', name: 'Fruit & Adjuncts', icon: Apple, description: 'Fruit, spices, additives', isIngredient: true },
    { id: 'equipment', name: 'Equipment', icon: Wrench, description: 'Tools, parts, supplies', isIngredient: false },
    { id: 'packaging', name: 'Packaging', icon: Box, description: 'Bottles, caps, labels', isIngredient: false },
    { id: 'kegs', name: 'Kegs & Barrels', icon: Beer, description: 'Kegs, casks, barrels', isIngredient: false },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setShowAddItemDialog(false);
    navigate(`/os/inventory/add?category=${categoryId}`);
  };

  const loadInventory = useCallback(async () => {
    try {
      const response = await globalThis.fetch('/api/os/inventory');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load inventory.');
      }
      const nextItems = (payload.data?.items ?? []) as InventoryItemView[];
      setItems(nextItems.map(normalizeInventoryItem));
      setStatus('Inventory loaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load inventory.');
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const vendorOptions = useMemo(
    () =>
      [...new Set(items.map((item) => String(item.vendorName ?? '').trim()).filter((value) => value.length > 0))]
        .sort((left, right) => left.localeCompare(right)),
    [items]
  );

  const appliedFilters = useMemo<InventoryReportFilters>(
    () => ({
      searchQuery,
      categoryFilter,
      vendorFilter,
      stockFilter,
      laneFilter,
      finishedGoodsStateFilter,
    }),
    [
      searchQuery,
      categoryFilter,
      vendorFilter,
      stockFilter,
      laneFilter,
      finishedGoodsStateFilter,
    ]
  );

  const baseFilteredItems = useMemo(
    () =>
      filterInventoryItems(items, {
        ...appliedFilters,
        laneFilter: 'all',
      }),
    [appliedFilters, items]
  );
  const summarizeFinishedGoodsItems = useCallback(
    (source: InventoryItemView[]) =>
      source.filter(isFinishedGoodsItem).reduce(
        (summary, item) => {
          const lotCount = Number(item.packagedLotCount ?? 0);
          if (lotCount <= 0) return summary;
          summary.skuCount += 1;
          summary.productKeys.add(
            String(item.productId ?? item.productCode ?? item.productName ?? item.sku ?? item.id)
          );
          summary.lotCount += lotCount;
          summary.inBondQty += Number(item.packagedInBondQty ?? 0);
          summary.releasedQty += Number(item.packagedReleasedQty ?? 0);
          summary.allocatedQty += Number(item.packagedAllocatedQty ?? 0);
          summary.shippedQty += Number(item.packagedShippedQty ?? 0);
          if (Number(item.packagedInBondQty ?? 0) > 0) summary.inBondSkuCount += 1;
          if (Number(item.packagedReleasedQty ?? 0) > 0) summary.releasedSkuCount += 1;
          if (Number(item.packagedAllocatedQty ?? 0) > 0) summary.allocatedSkuCount += 1;
          if (Number(item.packagedShippedQty ?? 0) > 0) summary.shippedSkuCount += 1;
          return summary;
        },
        {
          skuCount: 0,
          productKeys: new Set<string>(),
          lotCount: 0,
          inBondQty: 0,
          releasedQty: 0,
          allocatedQty: 0,
          shippedQty: 0,
          inBondSkuCount: 0,
          releasedSkuCount: 0,
          allocatedSkuCount: 0,
          shippedSkuCount: 0,
        }
      ),
    []
  );
  const filteredItems = useMemo(
    () =>
      baseFilteredItems
        .filter((item) => matchesInventoryLaneFilter(item, laneFilter))
        .filter((item) =>
          laneFilter === 'finished_goods'
            ? matchesFinishedGoodsStateFilter(item, finishedGoodsStateFilter)
            : true
        ),
    [baseFilteredItems, finishedGoodsStateFilter, laneFilter]
  );
  const previewBaseFilteredItems = useMemo(
    () =>
      filterInventoryItems(items, {
        ...filterDraft,
        laneFilter: 'all',
        finishedGoodsStateFilter: 'all',
      }),
    [filterDraft, items]
  );
  const previewFilteredItems = useMemo(
    () =>
      previewBaseFilteredItems
        .filter((item) => matchesInventoryLaneFilter(item, filterDraft.laneFilter ?? 'all'))
        .filter((item) =>
          (filterDraft.laneFilter ?? 'all') === 'finished_goods'
            ? matchesFinishedGoodsStateFilter(
                item,
                filterDraft.finishedGoodsStateFilter ?? 'all'
              )
            : true
        ),
    [filterDraft.finishedGoodsStateFilter, filterDraft.laneFilter, previewBaseFilteredItems]
  );
  const filteredSummary = useMemo(() => summarizeInventoryItems(filteredItems), [filteredItems]);
  const laneSummary = useMemo(
    () => ({
      all: baseFilteredItems.length,
      inputs: baseFilteredItems.filter(isProductionInputItem).length,
      supplies: baseFilteredItems.filter(isSupplyItem).length,
      finishedGoods: baseFilteredItems.filter(isFinishedGoodsItem).length,
      lowStock: baseFilteredItems.filter((item) => matchesInventoryLaneFilter(item, 'low_stock'))
        .length,
    }),
    [baseFilteredItems]
  );
  const finishedGoodsSummary = useMemo(
    () => summarizeFinishedGoodsItems(baseFilteredItems),
    [baseFilteredItems, summarizeFinishedGoodsItems]
  );
  const visibleFinishedGoodsSummary = useMemo(
    () => summarizeFinishedGoodsItems(filteredItems),
    [filteredItems, summarizeFinishedGoodsItems]
  );
  const visibleFinishedGoodsProductCount = visibleFinishedGoodsSummary.productKeys.size;
  const activeFilters = useMemo(
    () => getActiveInventoryFilters(appliedFilters),
    [appliedFilters]
  );
  const activeFilterCount = activeFilters.length;
  const hasActiveFilters = activeFilterCount > 0;
  const laneTitle =
    laneFilter === 'inputs'
      ? 'Production Inputs'
      : laneFilter === 'supplies'
        ? 'Packaging & Cellar Supplies'
        : laneFilter === 'finished_goods'
          ? 'Finished Goods'
          : laneFilter === 'low_stock'
            ? 'Low Stock Focus'
            : 'Inventory Items';
  const laneDescription =
    laneFilter === 'inputs'
      ? 'Fermentation and production ingredients that get consumed during cellar work.'
      : laneFilter === 'supplies'
        ? 'Operational supplies, packaging materials, and cellar hardware that support production.'
        : laneFilter === 'finished_goods'
          ? 'Packaged products made by the cider house and tracked for bond, release, and removal.'
          : laneFilter === 'low_stock'
            ? 'Items nearing reorder so you can act before production or packaging stalls.'
            : 'Inputs, supplies, and finished goods in one place.';
  const finishedGoodsStateTitle =
    finishedGoodsStateFilter === 'in_bond'
      ? 'In Bond'
      : finishedGoodsStateFilter === 'released'
        ? 'Released to OPS'
        : finishedGoodsStateFilter === 'reserved'
          ? 'Reserved'
          : finishedGoodsStateFilter === 'removed'
            ? 'Removed / Shipped'
            : 'All Finished Goods';

  const applyFilterDraft = () => {
    setSearchQuery(filterDraft.searchQuery);
    setCategoryFilter(filterDraft.categoryFilter);
    setVendorFilter(filterDraft.vendorFilter);
    setStockFilter(filterDraft.stockFilter);
    setLaneFilter(filterDraft.laneFilter ?? 'all');
    setFinishedGoodsStateFilter(filterDraft.finishedGoodsStateFilter ?? 'all');
    setShowFilterDialog(false);
  };

  const clearFilterDraft = () => {
    setFilterDraft(defaultInventoryFilters);
  };

  const downloadInventoryCsv = useCallback(
    (fileName: string) => {
      const blob = new globalThis.Blob([buildInventoryCsv(filteredItems)], { type: 'text/csv' });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeInventoryFilename(fileName)}.csv`;
      a.click();
      globalThis.URL.revokeObjectURL(url);
    },
    [filteredItems]
  );

  const handlePrint = () => {
    const reportName = buildInventoryFilename(appliedFilters);
    const reportUrl = `/os/inventory/report?${inventoryReportSearchParams(
      appliedFilters,
      reportName,
      true
    ).toString()}`;
    const reportWindow = globalThis.window.open(
      reportUrl,
      '_blank',
      'noopener,noreferrer,width=1280,height=900'
    );
    if (!reportWindow) {
      setStatus('Unable to open the inventory report. Please allow pop-ups for BevForge.');
      return;
    }
    setStatus('Opened print-ready inventory report.');
  };

  const openExportDialog = () => {
    setExportFormat('csv');
    setExportFileName(buildInventoryFilename(appliedFilters));
    setShowExportDialog(true);
  };

  const handleExport = () => {
    const resolvedFileName = sanitizeInventoryFilename(
      exportFileName || buildInventoryFilename(appliedFilters)
    );
    if (exportFormat === 'csv') {
      downloadInventoryCsv(resolvedFileName);
      setStatus(`Exported inventory CSV${hasActiveFilters ? ' for current filtered view' : ''}.`);
      setShowExportDialog(false);
      return;
    }

    const reportUrl = `/os/inventory/report?${inventoryReportSearchParams(
      appliedFilters,
      resolvedFileName,
      true
    ).toString()}`;
    const previewWindow = globalThis.window.open(
      reportUrl,
      '_blank',
      'noopener,noreferrer,width=1280,height=900'
    );
    if (!previewWindow) {
      setStatus('Unable to open PDF preview. Please allow pop-ups for BevForge.');
      return;
    }
    setStatus('Opened print-ready PDF preview. Choose Save as PDF in the print dialog.');
    setShowExportDialog(false);
  };

  const openEditDialog = (item: InventoryItemView) => {
    setSelectedItem(item);
    setEditForm(buildEditForm(item));
    setShowEditDialog(true);
  };

  const openInventoryContext = (item: InventoryItemView) => {
    if (isFinishedGoodsItem(item)) {
      const skuId = String(item.sku ?? item.productCode ?? '').trim();
      if (skuId) {
        navigate(`/os/packaged-products?skuId=${encodeURIComponent(skuId)}`);
        return;
      }
    }
    openEditDialog(item);
  };

  const updateEditField = (field: keyof InventoryEditForm, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveInventoryEdits = async () => {
    if (!selectedItem || !editForm) return;
    setSavingEdit(true);
    try {
      const response = await globalThis.fetch(`/api/os/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          unit: editForm.unit,
          onHandQty: Number(editForm.onHandQty),
          allocatedQty: Number(editForm.allocatedQty),
          onOrderQty: Number(editForm.onOrderQty),
          reorderPointQty: Number(editForm.reorderPointQty),
          costPerUnit: editForm.costPerUnit === '' ? null : Number(editForm.costPerUnit),
          vendorName: editForm.vendorName,
          vendorSku: editForm.vendorSku,
          vendorProductUrl: editForm.vendorProductUrl,
          vendorLeadTimeDays:
            editForm.vendorLeadTimeDays === '' ? undefined : Number(editForm.vendorLeadTimeDays),
          vendorPackSize:
            editForm.vendorPackSize === '' ? undefined : Number(editForm.vendorPackSize),
          vendorDefaultOrderQty:
            editForm.vendorDefaultOrderQty === ''
              ? undefined
              : Number(editForm.vendorDefaultOrderQty),
          vendorNotes: editForm.vendorNotes,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to update inventory item.');
      }
      await loadInventory();
      setStatus(`Updated ${editForm.name}.`);
      setShowEditDialog(false);
      setSelectedItem(null);
      setEditForm(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to update inventory item.');
    } finally {
      setSavingEdit(false);
    }
  };

  const markItemOrdered = async () => {
    if (!selectedItem || !editForm) return;
    const orderedQty = Number(editForm.orderQty);
    if (!Number.isFinite(orderedQty) || orderedQty <= 0) {
      setStatus('Order qty must be greater than zero.');
      return;
    }
    setSavingEdit(true);
    try {
      const response = await globalThis.fetch('/api/os/inventory/procurement/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: 'main',
          itemId: selectedItem.id,
          orderedQty,
          vendorName: editForm.vendorName || selectedItem.vendorName,
          vendorUrl: editForm.vendorProductUrl || selectedItem.vendorProductUrl,
          vendorSku: editForm.vendorSku || selectedItem.vendorSku,
          costPerUnit:
            editForm.costPerUnit === '' ? selectedItem.costPerUnit : Number(editForm.costPerUnit),
          notes: editForm.vendorNotes || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to create procurement order.');
      }
      await loadInventory();
      setStatus(`Created vendor order ${payload.data?.poNumber ?? ''} for ${selectedItem.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create procurement order.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Inventory Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="mt-1 text-muted-foreground">
              Separate production inputs, cellar supplies, and finished goods without losing the stock picture.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={openExportDialog} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilterDraft(appliedFilters);
                setShowFilterDialog(true);
              }}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters ? (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/os/inventory/orders')}
              className="gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              Pending Check-In
            </Button>
            <Button onClick={() => setShowAddItemDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Active Filters</span>
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs"
              >
                {filter}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              key: 'all' as const,
              title: 'All Inventory',
              value: laneSummary.all,
              subtitle: 'entire stock picture in one view',
              icon: Package,
              accentClass:
                'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
              iconClass: 'text-cyan-300',
              lineClass: 'via-cyan-300/40',
            },
            {
              key: 'inputs' as const,
              title: 'Production Inputs',
              value: laneSummary.inputs,
              subtitle: 'malt, hops, yeast, fruit, and cellar consumables',
              icon: Beaker,
              accentClass:
                'border-sky-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(56,189,248,0.12)]',
              iconClass: 'text-sky-300',
              lineClass: 'via-sky-300/40',
            },
            {
              key: 'supplies' as const,
              title: 'Packaging & Supplies',
              value: laneSummary.supplies,
              subtitle: 'bottles, kegs, hardware, and operational support stock',
              icon: Box,
              accentClass:
                'border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]',
              iconClass: 'text-violet-300',
              lineClass: 'via-violet-300/40',
            },
            {
              key: 'finished_goods' as const,
              title: 'Finished Goods',
              value: laneSummary.finishedGoods,
              subtitle: 'packaged cider house products tracked for sale and removal',
              icon: Package,
              accentClass:
                'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]',
              iconClass: 'text-emerald-300',
              lineClass: 'via-emerald-300/40',
            },
            {
              key: 'low_stock' as const,
              title: 'Low Stock Focus',
              value: laneSummary.lowStock,
              subtitle: `${filteredSummary.onOrderQty.toFixed(0)} units on order in this view`,
              icon: AlertTriangle,
              accentClass:
                'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
              iconClass: 'text-amber-300',
              lineClass: 'via-amber-300/40',
            },
          ].map((tile) => {
            const Icon = tile.icon;
            const isActive = laneFilter === tile.key;
            return (
              <button
                key={tile.key}
                type="button"
                className="text-left"
                onClick={() => {
                  setLaneFilter((current) => (current === tile.key ? 'all' : tile.key));
                  setFinishedGoodsStateFilter('all');
                }}
              >
                <Card
                  className={`overflow-hidden border-white/10 transition-colors hover:border-primary/40 hover:bg-primary/5 ${tile.accentClass} ${
                    isActive ? 'ring-2 ring-cyan-300/60' : ''
                  }`}
                >
                  <CardContent className="relative p-5">
                    <div className={`absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent ${tile.lineClass} to-transparent`} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">
                          Inventory
                        </p>
                        <p className="mt-3 text-3xl font-semibold leading-none text-white">
                          {tile.value}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                        <Icon className={`h-5 w-5 ${tile.iconClass}`} />
                      </div>
                    </div>
                    <div className="mt-5 space-y-1">
                      <p className="text-sm font-medium text-white">{tile.title}</p>
                      <p className="text-xs text-white/60">{tile.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{laneTitle}</CardTitle>
              <CardDescription>
                {laneDescription}
              </CardDescription>
            </div>
            <div className="grid min-w-[240px] grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {laneFilter === 'finished_goods' ? 'Products' : 'Visible'}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {laneFilter === 'finished_goods'
                    ? visibleFinishedGoodsProductCount
                    : filteredSummary.totalItems}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {laneFilter === 'finished_goods' ? 'Packaged Qty' : 'Available'}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {laneFilter === 'finished_goods'
                    ? (
                        visibleFinishedGoodsSummary.inBondQty +
                        visibleFinishedGoodsSummary.releasedQty +
                        visibleFinishedGoodsSummary.allocatedQty
                      ).toFixed(0)
                    : filteredSummary.availableQty.toFixed(0)}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {laneFilter === 'finished_goods' ? 'Package Lots' : 'On Order'}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {laneFilter === 'finished_goods'
                    ? visibleFinishedGoodsSummary.lotCount
                    : filteredSummary.onOrderQty.toFixed(0)}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {finishedGoodsSummary.skuCount > 0 ? (
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.94)_0%,rgba(6,14,26,0.98)_100%)] text-white">
            <CardHeader className="flex flex-col gap-3 border-b border-white/10 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-white">Finished Goods Bond Status</CardTitle>
                <CardDescription className="text-white/65">
                  OS keeps released-to-OPS availability separate from actual shipped removal.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/os/packaged-products')}>
                Open Packaged Products
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-4">
              {[
                {
                  key: 'in_bond' as const,
                  title: 'In Bond',
                  qty: finishedGoodsSummary.inBondQty,
                  skuCount: finishedGoodsSummary.inBondSkuCount,
                  note: 'packaged units still held in OS',
                },
                {
                  key: 'released' as const,
                  title: 'Released to OPS',
                  qty: finishedGoodsSummary.releasedQty,
                  skuCount: finishedGoodsSummary.releasedSkuCount,
                  note: 'sellable units available to orders',
                },
                {
                  key: 'reserved' as const,
                  title: 'Reserved',
                  qty: finishedGoodsSummary.allocatedQty,
                  skuCount: finishedGoodsSummary.allocatedSkuCount,
                  note: 'units already spoken for by OPS',
                },
                {
                  key: 'removed' as const,
                  title: 'Removed / Shipped',
                  qty: finishedGoodsSummary.shippedQty,
                  skuCount: finishedGoodsSummary.shippedSkuCount,
                  note: `${finishedGoodsSummary.lotCount} package lots across ${finishedGoodsSummary.skuCount} SKUs`,
                },
              ].map((tile) => {
                const isActive = finishedGoodsStateFilter === tile.key;
                return (
                  <button
                    key={tile.key}
                    type="button"
                    className="text-left"
                    onClick={() =>
                      setFinishedGoodsStateFilter((current) =>
                        current === tile.key ? 'all' : tile.key
                      )
                    }
                  >
                    <div
                      className={`rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-colors hover:border-emerald-300/40 ${
                        isActive ? 'ring-2 ring-emerald-300/60' : ''
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{tile.title}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {tile.qty.toFixed(0)}
                      </p>
                      <p className="text-xs text-white/55">{tile.note}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
                        {tile.skuCount} sku{tile.skuCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{laneTitle}</CardTitle>
              <CardDescription>
                {laneFilter === 'finished_goods' && finishedGoodsStateFilter !== 'all'
                  ? `${filteredItems.length} finished goods in ${finishedGoodsStateTitle.toLowerCase()}`
                  : `${filteredItems.length} items ${hasActiveFilters ? '(filtered)' : ''}`}
              </CardDescription>
            </div>
            {laneFilter === 'finished_goods' ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate('/os/packaged-products')}>
                  Open Packaged Products
                </Button>
                <Button variant="outline" onClick={() => navigate('/os/packaging')}>
                  Open Packaging
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="px-6 pb-0">
            {laneFilter === 'finished_goods' ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3 text-sm text-muted-foreground">
                Finished goods quantities are driven by package lots and OS release/removal events. Open a row to jump into packaged product control instead of manually editing sellable stock.
                {finishedGoodsStateFilter !== 'all'
                  ? ` Secondary filter active: showing only lots with a current ${finishedGoodsStateTitle.toLowerCase()} balance.`
                  : ''}
              </div>
            ) : laneFilter === 'inputs' ? (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/5 px-4 py-3 text-sm text-muted-foreground">
                This lane is for ingredients and process inputs that get consumed during batch creation, fermentation, treatment, and packaging.
              </div>
            ) : laneFilter === 'supplies' ? (
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 px-4 py-3 text-sm text-muted-foreground">
                This lane holds bottles, kegs, caps, fittings, and cellar support gear so production stock does not get buried under finished product.
              </div>
            ) : null}
          </CardContent>
          <CardContent className="p-0 pt-6">
            <InventoryTable
              items={filteredItems}
              onEditItem={openInventoryContext}
              onOpenItem={openInventoryContext}
            />
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">{status}</p>
      </div>

      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filter Inventory</DialogTitle>
            <DialogDescription>
              Set the filters you want, then close the dialog when the view looks right.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inventory-filter-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inventory-filter-search"
                  placeholder="Name, code, or category"
                  value={filterDraft.searchQuery}
                  onChange={(event) =>
                    setFilterDraft((prev) => ({ ...prev, searchQuery: event.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filterDraft.categoryFilter}
                  onValueChange={(value) =>
                    setFilterDraft((prev) => ({ ...prev, categoryFilter: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select
                  value={filterDraft.vendorFilter}
                  onValueChange={(value) =>
                    setFilterDraft((prev) => ({ ...prev, vendorFilter: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendorOptions.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stock State</Label>
              <Select
                value={filterDraft.stockFilter}
                onValueChange={(value) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    stockFilter: value as InventoryStockFilter,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Stock States" />
                </SelectTrigger>
                <SelectContent>
                  {stockFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Inventory Lane</Label>
              <Select
                value={filterDraft.laneFilter ?? 'all'}
                onValueChange={(value) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    laneFilter: value as InventoryLaneFilter,
                    finishedGoodsStateFilter:
                      value === 'finished_goods' ? prev.finishedGoodsStateFilter ?? 'all' : 'all',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Inventory" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'all', label: 'All Inventory' },
                    { value: 'inputs', label: 'Production Inputs' },
                    { value: 'supplies', label: 'Packaging & Cellar Supplies' },
                    { value: 'finished_goods', label: 'Finished Goods' },
                    { value: 'low_stock', label: 'Low Stock Focus' },
                  ].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterDraft.laneFilter ?? 'all') === 'finished_goods' ? (
              <div className="space-y-2">
                <Label>Finished Goods State</Label>
                <Select
                  value={filterDraft.finishedGoodsStateFilter ?? 'all'}
                  onValueChange={(value) =>
                    setFilterDraft((prev) => ({
                      ...prev,
                      finishedGoodsStateFilter: value as InventoryFinishedGoodsStateFilter,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Finished Goods" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishedGoodsStateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              {previewFilteredItems.length} matching items
            </div>
          </div>
          <DialogFooter className="flex-row items-center justify-between">
            <Button type="button" variant="ghost" onClick={clearFilterDraft}>
              Clear Filters
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowFilterDialog(false);
                  setFilterDraft(appliedFilters);
                }}
              >
                Close
              </Button>
              <Button type="button" onClick={applyFilterDraft}>
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Inventory</DialogTitle>
            <DialogDescription>
              Name the export and choose the format you want for this inventory snapshot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inventory-export-name">File Name</Label>
              <Input
                id="inventory-export-name"
                value={exportFileName}
                onChange={(event) => setExportFileName(event.target.value)}
                placeholder="inventory-report"
              />
            </div>
            <div className="space-y-2">
              <Label>Export Type</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as 'csv' | 'pdf')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose export type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="pdf">Print-Ready PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {exportFormat === 'csv'
                ? 'CSV downloads immediately with the name you choose.'
                : 'PDF opens the print-ready report so you can print or save as PDF.'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowExportDialog(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleExport}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keep this popup unchanged */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Select the type of item you want to add
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="flex items-start gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-accent"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    {category.isIngredient && (
                      <span className="mt-2 inline-block rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                        LAB-Tracked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Double-click row or use edit action to update stock, cost, and vendor data.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && editForm ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(event) => updateEditField('name', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editForm.category}
                    onChange={(event) => updateEditField('category', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={editForm.unit}
                    onChange={(event) => updateEditField('unit', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost Per Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.costPerUnit}
                    onChange={(event) => updateEditField('costPerUnit', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>On Hand Qty</Label>
                  <Input
                    type="number"
                    value={editForm.onHandQty}
                    onChange={(event) => updateEditField('onHandQty', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allocated Qty</Label>
                  <Input
                    type="number"
                    value={editForm.allocatedQty}
                    onChange={(event) => updateEditField('allocatedQty', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>On Order Qty</Label>
                  <Input
                    type="number"
                    value={editForm.onOrderQty}
                    onChange={(event) => updateEditField('onOrderQty', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min On Hand (Reorder Point)</Label>
                  <Input
                    type="number"
                    value={editForm.reorderPointQty}
                    onChange={(event) => updateEditField('reorderPointQty', event.target.value)}
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vendor Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <Input
                      value={editForm.vendorName}
                      onChange={(event) => updateEditField('vendorName', event.target.value)}
                      placeholder="BSG / Country Malt / etc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor SKU</Label>
                    <Input
                      value={editForm.vendorSku}
                      onChange={(event) => updateEditField('vendorSku', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Vendor Product URL</Label>
                    <Input
                      value={editForm.vendorProductUrl}
                      onChange={(event) =>
                        updateEditField('vendorProductUrl', event.target.value)
                      }
                      placeholder="https://vendor.com/product/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Time (days)</Label>
                    <Input
                      type="number"
                      value={editForm.vendorLeadTimeDays}
                      onChange={(event) =>
                        updateEditField('vendorLeadTimeDays', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pack Size</Label>
                    <Input
                      type="number"
                      value={editForm.vendorPackSize}
                      onChange={(event) => updateEditField('vendorPackSize', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Order Qty</Label>
                    <Input
                      type="number"
                      value={editForm.vendorDefaultOrderQty}
                      onChange={(event) =>
                        updateEditField('vendorDefaultOrderQty', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Vendor Notes</Label>
                    <Textarea
                      value={editForm.vendorNotes}
                      onChange={(event) => updateEditField('vendorNotes', event.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vendor Order</CardTitle>
                  <CardDescription>
                    Creates a procurement order and increments On Order quantity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-end gap-3">
                  <div className="w-48 space-y-2">
                    <Label>Order Qty</Label>
                    <Input
                      type="number"
                      value={editForm.orderQty}
                      onChange={(event) => updateEditField('orderQty', event.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void markItemOrdered()}
                    disabled={savingEdit}
                  >
                    Mark Ordered
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={savingEdit}
                >
                  Close
                </Button>
                <Button onClick={() => void saveInventoryEdits()} disabled={savingEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
