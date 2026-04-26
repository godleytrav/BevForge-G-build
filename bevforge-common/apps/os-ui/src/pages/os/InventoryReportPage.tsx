import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildInventoryCsv,
  buildInventoryFilename,
  defaultInventoryFilters,
  filterInventoryItems,
  finishedGoodsStateOptions,
  getActiveInventoryFilters,
  InventoryFinishedGoodsStateFilter,
  InventoryItemView,
  InventoryLaneFilter,
  inventoryReportSearchParams,
  InventoryReportFilters,
  InventoryStockFilter,
  inventoryLaneOptions,
  matchesFinishedGoodsStateFilter,
  matchesInventoryLaneFilter,
  normalizeInventoryItem,
  sanitizeInventoryFilename,
  stockFilterOptions,
  summarizeInventoryItems,
} from '@/lib/inventory-reporting';

const parseStockFilter = (value: string | null): InventoryStockFilter => {
  const normalized = (value ?? '').trim();
  return stockFilterOptions.some((option) => option.value === normalized)
    ? (normalized as InventoryStockFilter)
    : 'all';
};

const parseLaneFilter = (value: string | null): InventoryLaneFilter => {
  const normalized = (value ?? '').trim();
  return inventoryLaneOptions.some((option) => option.value === normalized)
    ? (normalized as InventoryLaneFilter)
    : 'all';
};

const parseFinishedGoodsStateFilter = (
  value: string | null
): InventoryFinishedGoodsStateFilter => {
  const normalized = (value ?? '').trim();
  return finishedGoodsStateOptions.some((option) => option.value === normalized)
    ? (normalized as InventoryFinishedGoodsStateFilter)
    : 'all';
};

export default function InventoryReportPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItemView[]>([]);
  const [status, setStatus] = useState('Loading inventory report...');
  const [isLoading, setIsLoading] = useState(true);
  const [autoPrinted, setAutoPrinted] = useState(false);

  const filters = useMemo<InventoryReportFilters>(
    () => ({
      searchQuery: searchParams.get('search') ?? defaultInventoryFilters.searchQuery,
      categoryFilter: searchParams.get('category') ?? defaultInventoryFilters.categoryFilter,
      vendorFilter: searchParams.get('vendor') ?? defaultInventoryFilters.vendorFilter,
      stockFilter: parseStockFilter(searchParams.get('stock')),
      laneFilter: parseLaneFilter(searchParams.get('lane')),
      finishedGoodsStateFilter: parseFinishedGoodsStateFilter(
        searchParams.get('finishedGoodsState')
      ),
    }),
    [searchParams]
  );

  const fileName = useMemo(() => {
    const requested = searchParams.get('filename');
    return requested ? sanitizeInventoryFilename(requested) : buildInventoryFilename(filters);
  }, [filters, searchParams]);

  const autoPrint = searchParams.get('autoprint') === '1';

  useEffect(() => {
    document.title = `${fileName}.pdf`;
  }, [fileName]);

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      setIsLoading(true);
      try {
        const response = await globalThis.fetch('/api/os/inventory');
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Failed to load inventory report.');
        }
        const nextItems = ((payload.data?.items ?? []) as InventoryItemView[]).map(normalizeInventoryItem);
        if (!cancelled) {
          setItems(nextItems);
          setStatus('Inventory report ready.');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : 'Failed to load inventory report.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => filterInventoryItems(items, filters), [items, filters]);
  const visibleItems = useMemo(
    () =>
      filteredItems
        .filter((item) => matchesInventoryLaneFilter(item, filters.laneFilter ?? 'all'))
        .filter((item) =>
          matchesFinishedGoodsStateFilter(item, filters.finishedGoodsStateFilter ?? 'all')
        ),
    [filteredItems, filters.finishedGoodsStateFilter, filters.laneFilter]
  );
  const summary = useMemo(() => summarizeInventoryItems(visibleItems), [visibleItems]);
  const activeFilters = useMemo(() => getActiveInventoryFilters(filters), [filters]);
  const generatedAt = useMemo(() => new Date().toLocaleString(), []);

  useEffect(() => {
    if (!autoPrint || autoPrinted || isLoading) {
      return;
    }
    setAutoPrinted(true);
    globalThis.setTimeout(() => {
      globalThis.print();
    }, 250);
  }, [autoPrint, autoPrinted, isLoading]);

  const handleExportCsv = () => {
    const blob = new globalThis.Blob([buildInventoryCsv(visibleItems)], { type: 'text/csv' });
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}.csv`;
    anchor.click();
    globalThis.URL.revokeObjectURL(url);
  };

  const previewQuery = inventoryReportSearchParams(filters, fileName, false).toString();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-6 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold">Inventory Report</h1>
            <p className="mt-1 text-muted-foreground">
              Printable inventory snapshot with totals, filters, and vendor detail context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/os/inventory" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
            <Button variant="outline" onClick={handleExportCsv} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => globalThis.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-card/95 p-6 shadow-2xl print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="flex flex-col gap-4 border-b border-border/60 pb-5 print:border-b print:border-slate-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Inventory Snapshot</h2>
                <p className="text-sm text-muted-foreground print:text-slate-600">
                  Generated {generatedAt} • {visibleItems.length} items in this report
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm print:border-slate-300 print:bg-white">
                <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">
                  File Name
                </div>
                <div className="mt-1 font-medium">{fileName}</div>
              </div>
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-sm">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs print:border-slate-300 print:bg-white"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground print:text-slate-600">All inventory items included.</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5 print:grid-cols-5 print:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 print:border-slate-300 print:bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Total Items</div>
              <div className="mt-2 text-3xl font-semibold">{summary.totalItems}</div>
              <div className="mt-1 text-xs text-muted-foreground print:text-slate-600">Items in this filtered view</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 print:border-slate-300 print:bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">In Stock</div>
              <div className="mt-2 text-3xl font-semibold">{summary.inStockItems}</div>
              <div className="mt-1 text-xs text-muted-foreground print:text-slate-600">{summary.outOfStockItems} out of stock</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 print:border-slate-300 print:bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Low Stock</div>
              <div className="mt-2 text-3xl font-semibold">{summary.lowStockItems}</div>
              <div className="mt-1 text-xs text-muted-foreground print:text-slate-600">{summary.onOrderQty} on order</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 print:border-slate-300 print:bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Available Qty</div>
              <div className="mt-2 text-3xl font-semibold">{summary.availableQty}</div>
              <div className="mt-1 text-xs text-muted-foreground print:text-slate-600">On hand {summary.onHandQty} • allocated {summary.allocatedQty}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 print:border-slate-300 print:bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-slate-500">Total Value</div>
              <div className="mt-2 text-3xl font-semibold">${summary.totalValue.toFixed(0)}</div>
              <div className="mt-1 text-xs text-muted-foreground print:text-slate-600">Based on current on-hand quantity</div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 print:rounded-none print:border-slate-300">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/5 print:bg-slate-100">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">SKU</th>
                  <th className="px-3 py-3 text-left font-semibold">Item</th>
                  <th className="px-3 py-3 text-left font-semibold">Category</th>
                  <th className="px-3 py-3 text-right font-semibold">On Hand</th>
                  <th className="px-3 py-3 text-right font-semibold">Allocated</th>
                  <th className="px-3 py-3 text-right font-semibold">Available</th>
                  <th className="px-3 py-3 text-right font-semibold">On Order</th>
                  <th className="px-3 py-3 text-left font-semibold">Unit</th>
                  <th className="px-3 py-3 text-left font-semibold">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                      Loading inventory report...
                    </td>
                  </tr>
                ) : visibleItems.length > 0 ? (
                  visibleItems.map((item) => {
                    const available = Math.max(0, item.onHandQty - item.allocatedQty);
                    return (
                      <tr key={item.id} className="border-t border-border/60 print:border-slate-300">
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">{item.sku ?? '--'}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium">{item.name}</div>
                        </td>
                        <td className="px-3 py-3 align-top capitalize">{item.category}</td>
                        <td className="px-3 py-3 text-right align-top">{item.onHandQty}</td>
                        <td className="px-3 py-3 text-right align-top">{item.allocatedQty}</td>
                        <td className="px-3 py-3 text-right align-top">{available}</td>
                        <td className="px-3 py-3 text-right align-top">{item.onOrderQty}</td>
                        <td className="px-3 py-3 align-top">{item.unit}</td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          <div>{item.vendorName ?? '--'}</div>
                          {item.vendorSku ? <div>SKU {item.vendorSku}</div> : null}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                      {status === 'Inventory report ready.'
                        ? 'No inventory items match the current filters.'
                        : status}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-muted-foreground print:text-slate-500">
            <span>Open this report directly: </span>
            <span>/os/inventory/report?{previewQuery}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
