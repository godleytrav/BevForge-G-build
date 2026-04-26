import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { selectProductImage, type BatchProductSnapshot, type ProductImageVariants } from '@/features/products/types';
import { CheckCircle2, FlaskConical, PackageCheck, Tags } from 'lucide-react';

type PackageLotStatus = 'planned' | 'active' | 'closed' | 'canceled';
type PackageLotReleaseStatus = 'held' | 'ready' | 'released' | 'shipped';
type BeverageClass = 'cider' | 'wine' | 'beer' | 'other';

interface PackageLotRecord {
  id: string;
  packageLotCode?: string;
  lotCode: string;
  batchId: string;
  batchCode?: string;
  skuId?: string;
  siteId: string;
  packageType: string;
  packageFormatCode?: string;
  packageSkuId?: string;
  totalUnits: number;
  allocatedUnits: number;
  shippedUnits: number;
  unitOfMeasure?: string;
  status: PackageLotStatus;
  releaseStatus?: PackageLotReleaseStatus;
  primaryAssetId?: string;
  primaryAssetCode?: string;
  assetCodes?: string[];
  metadata?: Record<string, unknown>;
  events?: Array<{
    id: string;
    action: string;
    actor?: string;
    reasonCode?: string;
    note?: string;
    quantity?: number;
    unit?: string;
    releaseStatus?: PackageLotReleaseStatus;
    assetCode?: string;
    timestamp: string;
  }>;
}

interface BatchRecord {
  id: string;
  siteId: string;
  batchCode?: string;
  lotCode: string;
  recipeName: string;
  status: string;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  productSnapshot?: BatchProductSnapshot;
}

interface InventoryItemRecord {
  id: string;
  skuId: string;
  name: string;
  onHandQty: number;
  allocatedQty: number;
  unit: string;
}

interface ProductRecord {
  productId: string;
  productCode: string;
  name: string;
  beverageClass: BeverageClass;
  currentAssetId?: string;
  assets: Array<{
    assetId: string;
    images: ProductImageVariants;
  }>;
}

interface PackagedSkuGroup {
  skuId: string;
  productId?: string;
  productCode?: string;
  productName: string;
  beverageClass?: BeverageClass;
  packageType: string;
  packageFormatCode?: string;
  inventoryItemId?: string;
  inventoryOnHandQty?: number;
  inventoryUnit?: string;
  imageUrl?: string;
  lots: ResolvedPackageLot[];
}

type ResolvedPackageLot = PackageLotRecord & {
  availableUnits: number;
  inBondUnits: number;
  releasedUnits: number;
  reservedUnits: number;
  removedUnits: number;
  totalTrackedUnits: number;
  resolvedBatch?: BatchRecord;
  resolvedBatchCode: string;
};

const toText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const availableUnitsForLot = (lot: PackageLotRecord): number =>
  Math.max(0, Number(lot.totalUnits) - Number(lot.allocatedUnits) - Number(lot.shippedUnits));

const getLotInventoryBreakdown = (lot: PackageLotRecord) => {
  const totalTrackedUnits = Math.max(0, Number(lot.totalUnits) || 0);
  const reservedUnits = Math.max(0, Number(lot.allocatedUnits) || 0);
  const removedUnits = Math.max(0, Number(lot.shippedUnits) || 0);
  const availableUnits = availableUnitsForLot(lot);
  const releaseStatus = lot.releaseStatus ?? 'held';
  const releasedUnits = releaseStatus === 'released' ? availableUnits : 0;
  const inBondUnits = releaseStatus === 'held' || releaseStatus === 'ready' ? availableUnits : 0;
  return {
    totalTrackedUnits,
    reservedUnits,
    removedUnits,
    availableUnits,
    releasedUnits,
    inBondUnits,
    releaseStatus,
  };
};

const productImageFromRecord = (product: ProductRecord | undefined): string | undefined => {
  if (!product) return undefined;
  const currentAsset = product.assets.find((asset) => asset.assetId === product.currentAssetId);
  return (
    selectProductImage(currentAsset?.images, 'card') ??
    selectProductImage(product.assets[0]?.images, 'card')
  );
};

export default function PackagedProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [packageLots, setPackageLots] = useState<PackageLotRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [statusText, setStatusText] = useState('Loading packaged products...');
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '');
  const [selectedBatchId, setSelectedBatchId] = useState(searchParams.get('batchId') ?? '');
  const [selectedSkuId, setSelectedSkuId] = useState(searchParams.get('skuId') ?? '');
  const [busy, setBusy] = useState(false);
  const [actionLot, setActionLot] = useState<PackageLotRecord | null>(null);
  const [detailLot, setDetailLot] = useState<ResolvedPackageLot | null>(null);
  const [actionType, setActionType] = useState<
    'release_status' | 'ship' | 'return' | 'empty_return' | 'rework' | 'destroy' | 'adjust' | 'assign_asset' | 'note'
  >('release_status');
  const [actionReleaseStatus, setActionReleaseStatus] = useState<PackageLotReleaseStatus>('held');
  const [actionQuantity, setActionQuantity] = useState('0');
  const [actionQuantityDelta, setActionQuantityDelta] = useState('0');
  const [actionReasonCode, setActionReasonCode] = useState('other');
  const [actionActor, setActionActor] = useState('');
  const [actionAssetCode, setActionAssetCode] = useState('');
  const [actionAssetCodes, setActionAssetCodes] = useState('');
  const [actionNote, setActionNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [lotsResponse, batchResponse, inventoryResponse, productsResponse] = await Promise.all([
        fetch('/api/os/package-lots'),
        fetch('/api/os/batches'),
        fetch('/api/os/inventory'),
        fetch('/api/os/products'),
      ]);
      const lotsPayload = await lotsResponse.json().catch(() => null);
      const batchPayload = await batchResponse.json().catch(() => null);
      const inventoryPayload = await inventoryResponse.json().catch(() => null);
      const productsPayload = await productsResponse.json().catch(() => null);

      if (!lotsResponse.ok || !lotsPayload?.success) {
        throw new Error(lotsPayload?.error ?? 'Failed to load package lots.');
      }
      if (!batchResponse.ok || !batchPayload?.success) {
        throw new Error(batchPayload?.error ?? 'Failed to load batches.');
      }
      if (!inventoryResponse.ok || !inventoryPayload?.success) {
        throw new Error(inventoryPayload?.error ?? 'Failed to load inventory.');
      }
      if (!productsResponse.ok || !productsPayload?.success) {
        throw new Error(productsPayload?.error ?? 'Failed to load products.');
      }

      setPackageLots((lotsPayload.data ?? []) as PackageLotRecord[]);
      setBatches((batchPayload.data?.batches ?? []) as BatchRecord[]);
      setInventoryItems((inventoryPayload.data?.items ?? []) as InventoryItemRecord[]);
      setProducts((productsPayload.data ?? []) as ProductRecord[]);
      setStatusText('Packaged product view ready.');
    } catch (error) {
      setStatusText(
        error instanceof Error ? error.message : 'Failed to load packaged products.'
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const batchById = useMemo(
    () => new Map(batches.map((batch) => [batch.id, batch] as const)),
    [batches]
  );

  const inventoryBySkuId = useMemo(
    () => new Map(inventoryItems.map((item) => [item.skuId.toUpperCase(), item] as const)),
    [inventoryItems]
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.productId, product] as const)),
    [products]
  );

  const filteredLots = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return packageLots.filter((lot) => {
      const batch = batchById.get(lot.batchId);
      const resolvedSkuId = toText(lot.packageSkuId ?? lot.skuId) ?? '';
      const resolvedBatchCode = toText(lot.batchCode ?? batch?.batchCode ?? batch?.lotCode) ?? '';
      const productCode = toText(lot.metadata?.productCode ?? batch?.productSnapshot?.productCode) ?? '';
      const productName =
        toText(lot.metadata?.productName ?? batch?.productSnapshot?.productName ?? batch?.recipeName) ?? '';

      if (selectedBatchId && lot.batchId !== selectedBatchId) return false;
      if (selectedSkuId && resolvedSkuId.toUpperCase() !== selectedSkuId.trim().toUpperCase()) return false;
      if (!query) return true;

      return [
        lot.packageLotCode,
        lot.lotCode,
        resolvedSkuId,
        resolvedBatchCode,
        productCode,
        productName,
        lot.packageFormatCode,
        lot.packageType,
      ]
        .filter(Boolean)
        .some((entry) => String(entry).toLowerCase().includes(query));
    });
  }, [batchById, packageLots, searchValue, selectedBatchId, selectedSkuId]);

  const groupedLots = useMemo(() => {
    const groups = new Map<string, PackagedSkuGroup>();

    for (const lot of filteredLots) {
      const resolvedBatch = batchById.get(lot.batchId);
      const productId = toText(
        lot.metadata?.productId ?? resolvedBatch?.productSnapshot?.productId
      );
      const resolvedProduct =
        (productId ? productById.get(productId) : undefined) ??
        [...productById.values()].find(
          (product) => product.productCode === toText(lot.metadata?.productCode)
        );
      const skuId = toText(lot.packageSkuId ?? lot.skuId) ?? 'UNASSIGNED-SKU';
      const inventoryItem = inventoryBySkuId.get(skuId.toUpperCase());
      const resolvedBatchCode =
        toText(lot.batchCode ?? resolvedBatch?.batchCode ?? resolvedBatch?.lotCode) ?? '--';

      const nextLot = {
        ...lot,
        ...getLotInventoryBreakdown(lot),
        resolvedBatch,
        resolvedBatchCode,
      };

      if (!groups.has(skuId)) {
        groups.set(skuId, {
          skuId,
          productId: productId ?? resolvedProduct?.productId,
          productCode:
            toText(lot.metadata?.productCode ?? resolvedBatch?.productSnapshot?.productCode) ??
            resolvedProduct?.productCode,
          productName:
            toText(lot.metadata?.productName ?? resolvedBatch?.productSnapshot?.productName) ??
            resolvedProduct?.name ??
            resolvedBatch?.recipeName ??
            skuId,
          beverageClass:
            (toText(
              lot.metadata?.beverageClass ?? resolvedBatch?.productSnapshot?.beverageClass
            ) as BeverageClass | undefined) ?? resolvedProduct?.beverageClass,
          packageType: lot.packageType,
          packageFormatCode: lot.packageFormatCode,
          inventoryItemId: inventoryItem?.id,
          inventoryOnHandQty: inventoryItem?.onHandQty,
          inventoryUnit: inventoryItem?.unit,
          imageUrl: productImageFromRecord(resolvedProduct),
          lots: [nextLot],
        });
        continue;
      }

      const existing = groups.get(skuId)!;
      existing.lots.push(nextLot);
      if (!existing.imageUrl) {
        existing.imageUrl = productImageFromRecord(resolvedProduct);
      }
      if (!existing.productCode) {
        existing.productCode =
          toText(lot.metadata?.productCode ?? resolvedBatch?.productSnapshot?.productCode) ??
          resolvedProduct?.productCode;
      }
      if (!existing.productId) {
        existing.productId = productId ?? resolvedProduct?.productId;
      }
    }

    return [...groups.values()].sort((left, right) =>
      left.productName.localeCompare(right.productName)
    );
  }, [batchById, filteredLots, inventoryBySkuId, productById]);

  const summary = useMemo(() => {
    const packagedSkus = groupedLots.length;
    const inBondUnits = filteredLots.reduce(
      (sum, lot) => sum + getLotInventoryBreakdown(lot).inBondUnits,
      0
    );
    const releasedUnits = filteredLots.reduce(
      (sum, lot) => sum + getLotInventoryBreakdown(lot).releasedUnits,
      0
    );
    const removedUnits = filteredLots.reduce(
      (sum, lot) => sum + getLotInventoryBreakdown(lot).removedUnits,
      0
    );
    return {
      packagedSkus,
      inBondUnits,
      releasedUnits,
      removedUnits,
      packageLotCount: filteredLots.length,
    };
  }, [filteredLots, groupedLots]);

  const detailGroup = useMemo(
    () => (detailLot ? groupedLots.find((group) => group.lots.some((lot) => lot.id === detailLot.id)) : undefined),
    [detailLot, groupedLots]
  );
  const actionLotBatch = actionLot ? batchById.get(actionLot.batchId) : undefined;
  const actionIntent = (() => {
    switch (actionType) {
      case 'release_status':
        return {
          title: 'Release Control',
          description: 'Update whether this lot is held, ready, released, or shipped.',
        };
      case 'ship':
        return {
          title: 'Taxable Removal / Ship',
          description: 'Record finished units leaving packaged inventory for sale or delivery.',
        };
      case 'return':
        return {
          title: 'Return to Stock',
          description: 'Put packaged units back into available inventory for future fulfillment.',
        };
      case 'empty_return':
        return {
          title: 'Empty Return',
          description: 'Track container returns without adding packaged product back into stock.',
        };
      case 'rework':
        return {
          title: 'Rework / Pullback',
          description: 'Record units pulled out of packaged inventory for rework or correction.',
        };
      case 'destroy':
        return {
          title: 'Loss / Destruction',
          description: 'Record breakage, dump, spill, purge, or other destroyed packaged units.',
        };
      case 'adjust':
        return {
          title: 'Inventory Correction',
          description: 'Apply a signed correction when the counted packaged quantity differs from the recorded value.',
        };
      case 'assign_asset':
        return {
          title: 'Asset Assignment',
          description: 'Update keg, container, or filler tracking codes tied to this packaged lot.',
        };
      default:
        return {
          title: 'Lot Note',
          description: 'Record context without changing lot quantity.',
        };
    }
  })();

  const batchOptions = useMemo(
    () =>
      batches
        .map((batch) => ({
          id: batch.id,
          label: `${batch.batchCode ?? batch.lotCode} - ${batch.recipeName}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [batches]
  );

  const skuOptions = useMemo(
    () =>
      groupedLots.map((group) => ({
        skuId: group.skuId,
        label: `${group.skuId} - ${group.productName}`,
      })),
    [groupedLots]
  );

  const openLotActionDialog = (lot: PackageLotRecord) => {
    setActionLot(lot);
    setActionType('release_status');
    setActionReleaseStatus(lot.releaseStatus ?? 'held');
    setActionQuantity('0');
    setActionQuantityDelta('0');
    setActionReasonCode('other');
    setActionActor('');
    setActionAssetCode(lot.primaryAssetCode ?? '');
    setActionAssetCodes((lot.assetCodes ?? []).join('\n'));
    setActionNote('');
  };

  const submitLotAction = async () => {
    if (!actionLot) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/package-lots/${actionLot.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          releaseStatus: actionType === 'release_status' ? actionReleaseStatus : undefined,
          quantity:
            actionType === 'ship' ||
            actionType === 'return' ||
            actionType === 'destroy' ||
            actionType === 'rework'
              ? Number(actionQuantity)
              : undefined,
          quantityDelta: actionType === 'adjust' ? Number(actionQuantityDelta) : undefined,
          reasonCode: actionReasonCode.trim() || undefined,
          actor: actionActor.trim() || undefined,
          assetCode: actionAssetCode.trim() || undefined,
          assetCodes: actionAssetCodes
            .split(/[\n,]+/)
            .map((entry) => entry.trim())
            .filter(Boolean),
          note: actionNote.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to update package lot.');
      }
      setActionLot(null);
      toast.success('Package lot updated');
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update package lot.';
      setStatusText(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Packaged Products">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Packaged Products</h1>
            <p className="text-muted-foreground">
              Follow the chain from source batch to package lot to sellable SKU without leaving OS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/os/packaging')}>
              Open Packaging
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/batches')}>
              Open Batches
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Sellable SKUs',
              value: summary.packagedSkus,
              subtitle: 'active packaged products on the board',
              icon: Tags,
              accentClass:
                'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
              iconClass: 'text-cyan-300',
              lineClass: 'via-cyan-300/40',
            },
            {
              title: 'In Bond',
              value: summary.inBondUnits.toFixed(0),
              subtitle: 'packaged units still held inside OS bond',
              icon: PackageCheck,
              accentClass:
                'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]',
              iconClass: 'text-emerald-300',
              lineClass: 'via-emerald-300/40',
            },
            {
              title: 'Released to OPS',
              value: summary.releasedUnits.toFixed(0),
              subtitle: 'units available for sales and fulfillment',
              icon: CheckCircle2,
              accentClass:
                'border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]',
              iconClass: 'text-violet-300',
              lineClass: 'via-violet-300/40',
            },
            {
              title: 'Removed / Shipped',
              value: summary.removedUnits.toFixed(0),
              subtitle: `${summary.packageLotCount} tracked lot records`,
              icon: FlaskConical,
              accentClass:
                'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
              iconClass: 'text-amber-300',
              lineClass: 'via-amber-300/40',
            },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <Card
                key={tile.title}
                className={`overflow-hidden border-white/10 ${tile.accentClass}`}
              >
                <CardContent className="relative p-5">
                  <div className={`absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent ${tile.lineClass} to-transparent`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Packaged</p>
                      <p className="mt-3 text-3xl font-semibold leading-none text-white">{tile.value}</p>
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
            );
          })}
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
            <CardDescription>Zero in on a source batch or sellable SKU when tracing packaged inventory.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-white/80">Search</Label>
              <Input
                className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by product, SKU, batch, or package lot"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Source Batch</Label>
              <select
                className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                value={selectedBatchId}
                onChange={(event) => setSelectedBatchId(event.target.value)}
              >
                <option value="">All source batches</option>
                {batchOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Sellable SKU</Label>
              <select
                className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                value={selectedSkuId}
                onChange={(event) => setSelectedSkuId(event.target.value)}
              >
                <option value="">All sellable SKUs</option>
                {skuOptions.map((option) => (
                  <option key={option.skuId} value={option.skuId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groupedLots.length === 0 ? (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm lg:col-span-2">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No packaged product matches the current filters yet.
              </CardContent>
            </Card>
          ) : (
            groupedLots.map((group) => {
              const sourceBatchCodes = [...new Set(group.lots.map((lot) => lot.resolvedBatchCode))];
              const groupBreakdown = group.lots.reduce(
                (sum, lot) => ({
                  inBondUnits: sum.inBondUnits + lot.inBondUnits,
                  releasedUnits: sum.releasedUnits + lot.releasedUnits,
                  reservedUnits: sum.reservedUnits + lot.reservedUnits,
                  removedUnits: sum.removedUnits + lot.removedUnits,
                  totalTrackedUnits: sum.totalTrackedUnits + lot.totalTrackedUnits,
                }),
                {
                  inBondUnits: 0,
                  releasedUnits: 0,
                  reservedUnits: 0,
                  removedUnits: 0,
                  totalTrackedUnits: 0,
                }
              );
              const releaseStates = [...new Set(group.lots.map((lot) => lot.releaseStatus ?? 'held'))];
              const primaryReleaseState = releaseStates.length === 1 ? releaseStates[0] : 'mixed';
              return (
                <Card
                  key={group.skuId}
                  className="flex h-full flex-col overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] backdrop-blur-sm"
                >
                  <CardHeader className="border-b border-white/10 bg-black/10">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.productName}
                            className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-muted-foreground">
                            No art
                          </div>
                        )}
                        <div className="space-y-2">
                          <div>
                            <CardTitle className="text-white">{group.productName}</CardTitle>
                            <CardDescription>
                              {group.productCode ?? 'No product code'} • {group.skuId}
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{group.packageFormatCode ?? group.packageType}</Badge>
                            <Badge variant="outline">{group.beverageClass ?? 'other'}</Badge>
                            <Badge variant="outline">{primaryReleaseState}</Badge>
                          </div>
                        </div>
                      </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">In Bond</p>
                          <p className="text-xl font-semibold text-white">
                            {groupBreakdown.inBondUnits.toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">{group.inventoryUnit ?? 'units'}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Released</p>
                          <p className="text-xl font-semibold text-white">{groupBreakdown.releasedUnits.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">available to OPS</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Reserved</p>
                          <p className="text-xl font-semibold text-white">{groupBreakdown.reservedUnits.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">held by OPS orders</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Removed</p>
                          <p className="text-xl font-semibold text-white">{groupBreakdown.removedUnits.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">{sourceBatchCodes.length} source batches</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => navigate('/os/packaging')}>
                        Open Packaging
                      </Button>
                      {group.inventoryItemId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/os/inventory/${group.inventoryItemId}`)}
                        >
                          Open Inventory Item
                        </Button>
                      ) : null}
                    </div>
                    {group.lots
                      .sort((left, right) =>
                        String(right.packageLotCode ?? right.lotCode).localeCompare(
                          String(left.packageLotCode ?? left.lotCode)
                        )
                      )
                      .map((lot) => (
                        <div
                          key={lot.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm text-white">
                                  {lot.packageLotCode ?? lot.lotCode}
                                </span>
                                <Badge variant="outline">{lot.status}</Badge>
                                <Badge variant="secondary">{lot.releaseStatus ?? 'held'}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {lot.resolvedBatchCode} {'->'} {group.skuId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Batch {lot.resolvedBatch?.recipeName ?? '--'} • package {lot.packageFormatCode ?? lot.packageType}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
                              <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">In Bond</p>
                                <p className="font-semibold text-white">{lot.inBondUnits.toFixed(0)}</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Released</p>
                                <p className="font-semibold text-white">{lot.releasedUnits.toFixed(0)}</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reserved</p>
                                <p className="font-semibold text-white">{lot.reservedUnits.toFixed(0)}</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Removed</p>
                                <p className="font-semibold text-white">
                                  {lot.removedUnits.toFixed(0)} {lot.unitOfMeasure ?? 'units'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setDetailLot(lot)}
                            >
                              Open Lot Detail
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLotActionDialog(lot)}
                            >
                              Log Lot Action
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/os/batches/${lot.batchId}`)}
                            >
                              Open Source Batch
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
          {statusText}
        </div>
      </div>

      <Dialog open={Boolean(detailLot)} onOpenChange={(open) => (!open ? setDetailLot(null) : null)}>
        <DialogContent className="max-h-[88vh] overflow-auto border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white sm:max-w-[820px]">
          {detailLot ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{detailLot.packageLotCode ?? detailLot.lotCode}</DialogTitle>
                <DialogDescription className="text-white/65">
                  {detailLot.resolvedBatchCode} {'->'} {detailLot.packageSkuId ?? detailLot.skuId ?? '--'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">In Bond</p>
                    <p className="mt-2 text-xl font-semibold text-white">{detailLot.inBondUnits.toFixed(0)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Released</p>
                    <p className="mt-2 text-xl font-semibold text-white">{detailLot.releasedUnits.toFixed(0)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Reserved</p>
                    <p className="mt-2 text-xl font-semibold text-white">{detailLot.reservedUnits.toFixed(0)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Removed</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {detailLot.removedUnits.toFixed(0)} {detailLot.unitOfMeasure ?? 'units'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Lot Identity</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <p><span className="text-white/45">Status</span><br />{detailLot.status} • {detailLot.releaseStatus ?? 'held'}</p>
                      <p><span className="text-white/45">Batch</span><br />{detailLot.resolvedBatchCode} • {detailLot.resolvedBatch?.recipeName ?? '--'}</p>
                      <p><span className="text-white/45">Package</span><br />{detailLot.packageFormatCode ?? detailLot.packageType}</p>
                      <p><span className="text-white/45">Asset</span><br />{detailLot.primaryAssetCode ?? detailLot.assetCodes?.[0] ?? '--'}</p>
                      <p><span className="text-white/45">Label Version</span><br />{toText(detailLot.metadata?.labelVersionId) ?? '--'}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Compliance Snapshot</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <p><span className="text-white/45">Beverage Class</span><br />{toText(detailLot.metadata?.beverageClass) ?? '--'}</p>
                      <p><span className="text-white/45">Product Name</span><br />{toText(detailLot.metadata?.productName) ?? '--'}</p>
                      <p><span className="text-white/45">Product Code</span><br />{toText(detailLot.metadata?.productCode) ?? '--'}</p>
                      <p><span className="text-white/45">COLA Reference</span><br />{toText((detailLot.metadata?.complianceSnapshot as Record<string, unknown> | undefined)?.colaReference) ?? '--'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Lot Event History</p>
                  {detailLot.events && detailLot.events.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {[...detailLot.events].reverse().map((event) => (
                        <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm">
                          <p className="font-medium text-white">{event.action}</p>
                          <p className="mt-1 text-white/60">
                            {event.quantity !== undefined ? `${event.quantity} ${event.unit ?? 'units'} • ` : ''}
                            {event.reasonCode ? `${event.reasonCode} • ` : ''}
                            {event.actor ? `${event.actor} • ` : ''}
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.note ? <p className="mt-2 text-white/75">{event.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/55">No lot events recorded yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {detailLot.batchId ? (
                    <Button variant="outline" onClick={() => navigate(`/os/batches/${detailLot.batchId}`)}>
                      Open Source Batch
                    </Button>
                  ) : null}
                  {detailGroup?.inventoryItemId ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (detailGroup?.inventoryItemId) navigate(`/os/inventory/${detailGroup.inventoryItemId}`);
                      }}
                    >
                      Open Inventory Item
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => {
                      setDetailLot(null);
                      openLotActionDialog(detailLot);
                    }}
                  >
                    Log Lot Action
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(actionLot)} onOpenChange={(open) => (!open ? setActionLot(null) : null)}>
        <DialogContent className="max-h-[88vh] overflow-auto border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle className="text-white">Package Lot Action</DialogTitle>
            <DialogDescription className="text-white/65">
              Log removals, returns, destruction, release status, assets, and corrections without silently overwriting the lot.
            </DialogDescription>
          </DialogHeader>
          {actionLot ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{actionLot.packageLotCode ?? actionLot.lotCode}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {(actionLot.batchCode ?? actionLotBatch?.batchCode ?? actionLotBatch?.lotCode ?? '--')} {'->'} {actionLot.packageSkuId ?? actionLot.skuId ?? '--'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">In Bond</p>
                      <p className="mt-2 text-lg font-semibold text-white">{getLotInventoryBreakdown(actionLot).inBondUnits.toFixed(0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Released</p>
                      <p className="mt-2 text-lg font-semibold text-white">{getLotInventoryBreakdown(actionLot).releasedUnits.toFixed(0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Reserved</p>
                      <p className="mt-2 text-lg font-semibold text-white">{getLotInventoryBreakdown(actionLot).reservedUnits.toFixed(0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Removed</p>
                      <p className="mt-2 text-lg font-semibold text-white">{getLotInventoryBreakdown(actionLot).removedUnits.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_280px]">
                <div className="rounded-3xl border border-cyan-400/18 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Action Control</p>
                  <p className="mt-3 text-sm font-medium text-white">{actionIntent.title}</p>
                  <p className="mt-1 text-sm text-white/60">{actionIntent.description}</p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">Action</Label>
                      <select
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={actionType}
                        onChange={(event) => setActionType(event.target.value as typeof actionType)}
                      >
                        <option value="release_status">Release Status</option>
                        <option value="ship">Removal / Ship</option>
                        <option value="return">Return to Stock</option>
                        <option value="empty_return">Empty Return</option>
                        <option value="rework">Rework</option>
                        <option value="destroy">Loss / Destruction</option>
                        <option value="adjust">Correction / Adjustment</option>
                        <option value="assign_asset">Assign Asset / Container</option>
                        <option value="note">Note</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Operator</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={actionActor}
                        onChange={(event) => setActionActor(event.target.value)}
                        placeholder="Who handled this lot event"
                      />
                    </div>
                    {actionType === 'release_status' ? (
                      <div className="space-y-2">
                        <Label className="text-white/80">Release Status</Label>
                        <select
                          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                          value={actionReleaseStatus}
                          onChange={(event) =>
                            setActionReleaseStatus(event.target.value as PackageLotReleaseStatus)
                          }
                        >
                          <option value="held">Held</option>
                          <option value="ready">Ready</option>
                          <option value="released">Released</option>
                          <option value="shipped">Shipped</option>
                        </select>
                      </div>
                    ) : null}
                    {actionType === 'ship' ||
                    actionType === 'return' ||
                    actionType === 'destroy' ||
                    actionType === 'rework' ? (
                      <div className="space-y-2">
                        <Label className="text-white/80">Quantity</Label>
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          type="number"
                          value={actionQuantity}
                          onChange={(event) => setActionQuantity(event.target.value)}
                        />
                      </div>
                    ) : null}
                    {actionType === 'adjust' ? (
                      <div className="space-y-2">
                        <Label className="text-white/80">Adjustment Delta</Label>
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          type="number"
                          value={actionQuantityDelta}
                          onChange={(event) => setActionQuantityDelta(event.target.value)}
                          placeholder="-2 or 4"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label className="text-white/80">Reason Code</Label>
                      <select
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={actionReasonCode}
                        onChange={(event) => setActionReasonCode(event.target.value)}
                      >
                        <option value="other">Other</option>
                        <option value="delivery_removal">Delivery Removal</option>
                        <option value="return_to_stock">Return to Stock</option>
                        <option value="empty_return">Empty Return</option>
                        <option value="rework">Rework</option>
                        <option value="destruction">Destruction</option>
                        <option value="spill">Spill</option>
                        <option value="dump">Dump</option>
                        <option value="breakage">Breakage</option>
                        <option value="purge_loss">Purge Loss</option>
                        <option value="correction">Correction</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Lot Context</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <p><span className="text-white/45">Source Batch</span><br />{actionLotBatch?.batchCode ?? actionLotBatch?.lotCode ?? actionLot.batchCode ?? '--'}</p>
                    <p><span className="text-white/45">Recipe</span><br />{actionLotBatch?.recipeName ?? '--'}</p>
                    <p><span className="text-white/45">Package</span><br />{actionLot.packageFormatCode ?? actionLot.packageType}</p>
                    <p><span className="text-white/45">Primary Asset</span><br />{actionLot.primaryAssetCode ?? '--'}</p>
                    <p><span className="text-white/45">Units on Lot</span><br />{Number(actionLot.totalUnits).toFixed(0)} {actionLot.unitOfMeasure ?? 'units'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Asset Tracking</p>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Primary Asset / Container Code</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={actionAssetCode}
                        onChange={(event) => setActionAssetCode(event.target.value)}
                        placeholder="KEG-000123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Additional Asset / Container Codes</Label>
                      <Textarea
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={actionAssetCodes}
                        onChange={(event) => setActionAssetCodes(event.target.value)}
                        placeholder="One per line or comma-separated"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Action Note</p>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/80">Note</Label>
                    <Textarea
                      className="min-h-[148px] border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                      value={actionNote}
                      onChange={(event) => setActionNote(event.target.value)}
                      placeholder="What happened, where it went, and why."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <Button variant="outline" onClick={() => setActionLot(null)} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={() => void submitLotAction()} disabled={busy}>
                  Save Action
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
