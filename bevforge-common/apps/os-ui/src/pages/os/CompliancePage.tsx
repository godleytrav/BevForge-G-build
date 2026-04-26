import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileCheck2, FlaskConical, PackageCheck, ScrollText, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BatchProductSnapshot, ProductRecord } from '@/features/products/types';
import { formatTemperatureValue, useOsDisplaySettings } from '@/lib/os-display';

interface ComplianceFeedRecord {
  schemaVersion: string;
  id: string;
  sourceSuite: 'os';
  siteId: string;
  generatedAt: string;
  range: {
    from: string;
    to: string;
  };
  cursor?: {
    sort: 'occurredAt_asc__id_asc';
    afterOccurredAt?: string;
    afterId?: string;
    nextAfter?: string;
    lastEventId?: string;
    hasMore: boolean;
  };
  summary: {
    totalEvents: number;
    byType: Record<string, number>;
  };
  events: ComplianceEvent[];
}

interface ComplianceEvent {
  id: string;
  eventType: string;
  eventStatus: 'recorded' | 'voided' | 'amended';
  sourceRecord: {
    recordType: string;
    recordId: string;
    originSuite?: string;
    openPath?: string;
  };
  siteId: string;
  batchId?: string;
  lotCode?: string;
  recipeRunId?: string;
  recipeId?: string;
  skuId?: string;
  itemId?: string;
  reservationId?: string;
  orderId?: string;
  lineId?: string;
  quantity?: {
    value: number;
    uom: string;
    direction: 'in' | 'out' | 'none';
  };
  reasonCode?: string;
  reasonMessage?: string;
  regulatoryTags?: string[];
  measurements?: {
    temperatureC?: number;
    sg?: number;
    fg?: number;
    abvPct?: number;
    ph?: number;
    brix?: number;
    titratableAcidityGpl?: number;
    so2Ppm?: number;
  };
  occurredAt: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

interface BatchRecord {
  id: string;
  siteId: string;
  batchCode?: string;
  lotCode: string;
  recipeName: string;
  status: string;
  recipeRunId?: string;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  packageLotIds?: string[];
  actualResults?: {
    abvPct?: number;
    sgLatest?: number;
    phLatest?: number;
    brixLatest?: number;
    titratableAcidityGplLatest?: number;
    so2PpmLatest?: number;
  };
  productSnapshot?: BatchProductSnapshot;
}

interface PackageLotRecord {
  id: string;
  packageLotCode?: string;
  lotCode: string;
  batchId: string;
  batchCode?: string;
  skuId?: string;
  packageSkuId?: string;
  siteId: string;
  packageType: string;
  packageFormatCode?: string;
  totalUnits: number;
  allocatedUnits: number;
  shippedUnits: number;
  status: 'planned' | 'active' | 'closed' | 'canceled';
  metadata?: Record<string, unknown>;
  updatedAt?: string;
}

type ReviewSeverity = 'high' | 'medium' | 'info';
type ComplianceTab = 'overview' | 'lots' | 'events';
type ComplianceFocusFilter = 'all' | 'high' | 'lot_review' | 'events' | 'losses' | 'removals';

interface ReviewFlag {
  id: string;
  severity: ReviewSeverity;
  title: string;
  detail: string;
  openPath?: string;
}

const surfaceClass =
  'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)] text-white shadow-[0_18px_45px_rgba(2,6,23,0.35)]';

const tileClass =
  'rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.72)_100%)] px-4 py-4 text-white shadow-[0_12px_30px_rgba(2,6,23,0.25)]';

const toText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const toNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const formatDateTime = (value: string | undefined) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatQuantity = (event: ComplianceEvent) => {
  if (!event.quantity) return '--';
  return `${event.quantity.value} ${event.quantity.uom}`;
};

const reviewTone = (severity: ReviewSeverity) => {
  switch (severity) {
    case 'high':
      return {
        cardClass: 'border-rose-500/30 bg-rose-500/10',
        dotClass: 'bg-rose-300',
        labelClass: 'border-rose-400/20 bg-rose-500/15 text-rose-100',
      };
    case 'medium':
      return {
        cardClass: 'border-amber-500/30 bg-amber-500/10',
        dotClass: 'bg-amber-300',
        labelClass: 'border-amber-400/20 bg-amber-500/15 text-amber-100',
      };
    default:
      return {
        cardClass: 'border-sky-500/25 bg-sky-500/8',
        dotClass: 'bg-sky-300',
        labelClass: 'border-sky-400/20 bg-sky-500/12 text-sky-100',
      };
  }
};

const buildPackagingReviewPath = (batchId: string, focusField?: string) => {
  const params = new URLSearchParams({
    sourceBatchId: batchId,
    compliance: '1',
  });
  if (focusField) {
    params.set('focus', focusField);
  }
  return `/os/packaging?${params.toString()}`;
};

const complianceSnapshotFromLot = (lot: PackageLotRecord): Record<string, unknown> | undefined => {
  const metadata = lot.metadata;
  if (!metadata || typeof metadata !== 'object') return undefined;
  const snapshot = metadata.complianceSnapshot;
  return snapshot && typeof snapshot === 'object' ? (snapshot as Record<string, unknown>) : undefined;
};

export default function CompliancePage() {
  const navigate = useNavigate();
  const { temperatureUnit } = useOsDisplaySettings();
  const [feed, setFeed] = useState<ComplianceFeedRecord | null>(null);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [packageLots, setPackageLots] = useState<PackageLotRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<ComplianceTab>('overview');
  const [focusFilter, setFocusFilter] = useState<ComplianceFocusFilter>('all');
  const [statusText, setStatusText] = useState('Loading compliance review...');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [feedResponse, batchResponse, lotResponse, productResponse] = await Promise.all([
          window.fetch('/api/os/compliance/feed?siteId=main&limit=250'),
          window.fetch('/api/os/batches'),
          window.fetch('/api/os/package-lots'),
          window.fetch('/api/os/products'),
        ]);

        const feedPayload = await feedResponse.json().catch(() => null);
        const batchPayload = await batchResponse.json().catch(() => null);
        const lotPayload = await lotResponse.json().catch(() => null);
        const productPayload = await productResponse.json().catch(() => null);

        if (!feedResponse.ok || !feedPayload?.schemaVersion) {
          throw new Error(feedPayload?.error ?? 'Failed to load compliance feed.');
        }
        if (!batchResponse.ok || !batchPayload?.success) {
          throw new Error(batchPayload?.error ?? 'Failed to load batches.');
        }
        if (!lotResponse.ok || !lotPayload?.success) {
          throw new Error(lotPayload?.error ?? 'Failed to load package lots.');
        }
        if (!productResponse.ok || !productPayload?.success) {
          throw new Error(productPayload?.error ?? 'Failed to load products.');
        }

        if (!mounted) return;
        setFeed(feedPayload as ComplianceFeedRecord);
        setBatches((batchPayload.data?.batches ?? []) as BatchRecord[]);
        setPackageLots((lotPayload.data ?? []) as PackageLotRecord[]);
        setProducts((productPayload.data ?? []) as ProductRecord[]);
        setStatusText('Compliance review loaded.');
      } catch (error) {
        if (!mounted) return;
        setFeed(null);
        setStatusText(error instanceof Error ? error.message : 'Failed to load compliance review.');
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const batchById = useMemo(() => new Map(batches.map((batch) => [batch.id, batch] as const)), [batches]);
  const productById = useMemo(
    () => new Map(products.map((product) => [product.productId, product] as const)),
    [products]
  );

  const reviewFlags = useMemo(() => {
    const flags: ReviewFlag[] = [];

    for (const batch of batches) {
      const batchCode = batch.batchCode ?? batch.lotCode;
      if ((batch.status === 'completed' || batch.status === 'released' || batch.status === 'shipped') && !batch.actualResults?.abvPct) {
        flags.push({
          id: `batch-abv-${batch.id}`,
          severity: 'medium',
          title: `${batchCode} is missing final ABV`,
          detail: 'Completed or released batches should carry final ABV for packaging/compliance review.',
          openPath: `/os/batches/${batch.id}`,
        });
      }
      if ((batch.status === 'released' || batch.status === 'shipped') && (batch.packageLotIds?.length ?? 0) === 0) {
        flags.push({
          id: `batch-package-lot-${batch.id}`,
          severity: 'high',
          title: `${batchCode} was released without a package lot link`,
          detail: 'Released product should trace to a package lot before it is relied on for downstream compliance and OPS handoff.',
          openPath: `/os/batches/${batch.id}`,
        });
      }
      if (!batch.productSnapshot?.productCode) {
        flags.push({
          id: `batch-product-code-${batch.id}`,
          severity: 'medium',
          title: `${batchCode} is missing a product code`,
          detail: 'Product identity should be attached so package lots and sellable SKU lineage remain clean across OS and OPS.',
          openPath: `/os/batches/${batch.id}`,
        });
      }
    }

    for (const lot of packageLots) {
      const snapshot = complianceSnapshotFromLot(lot);
      const lotCode = lot.packageLotCode ?? lot.lotCode;
      const beverageClass = toText(snapshot?.beverageClass);
      const abv = toNumber(snapshot?.abvPct) ?? batchById.get(lot.batchId)?.actualResults?.abvPct;
      if (!lot.packageLotCode) {
        flags.push({
          id: `lot-code-${lot.id}`,
          severity: 'high',
          title: `${lotCode} is missing package lot code`,
          detail: 'Packaged output should carry a stable package-lot code for traceability and recall support.',
          openPath: '/os/packaged-products',
        });
      }
      if (!snapshot?.productName || !snapshot?.brandName) {
        flags.push({
          id: `lot-product-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} is missing packaged product identity fields`,
          detail: 'Brand name and packaged product name should be captured in the compliance snapshot before release.',
          openPath: buildPackagingReviewPath(lot.batchId, 'productName'),
        });
      }
      if (!beverageClass) {
        flags.push({
          id: `lot-class-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} is missing beverage class`,
          detail: 'Cider, wine, or beer class should be set so compliance review can follow the right path.',
          openPath: buildPackagingReviewPath(lot.batchId, 'beverageClass'),
        });
      }
      if (!toText(snapshot?.taxClass)) {
        flags.push({
          id: `lot-tax-class-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} is missing tax class review`,
          detail: 'Packaged lots should carry an explicit tax class so federal and state removals are not left to inference.',
          openPath: buildPackagingReviewPath(lot.batchId, 'taxClass'),
        });
      }
      if (snapshot?.healthWarningIncluded === undefined) {
        flags.push({
          id: `lot-health-warning-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} needs health warning review`,
          detail: 'Packaging compliance snapshot should explicitly record whether the health warning is included.',
          openPath: buildPackagingReviewPath(lot.batchId, 'healthWarning'),
        });
      }
      if ((beverageClass === 'cider' || beverageClass === 'wine') && !toText(snapshot?.sulfiteDeclaration)) {
        flags.push({
          id: `lot-sulfite-${lot.id}`,
          severity: 'info',
          title: `${lotCode} needs sulfite declaration review`,
          detail: 'For cider and wine workflows, sulfite declaration should be explicitly reviewed before release.',
          openPath: buildPackagingReviewPath(lot.batchId, 'sulfite'),
        });
      }
      if ((beverageClass === 'cider' || beverageClass === 'wine') && Number(abv ?? 0) >= 7 && snapshot?.interstateSale === true && !toText(snapshot?.colaReference)) {
        flags.push({
          id: `lot-cola-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} needs interstate COLA review`,
          detail: 'If this 7%+ cider/wine lot is going into interstate commerce, review whether a COLA reference should be captured before release.',
          openPath: buildPackagingReviewPath(lot.batchId, 'colaReference'),
        });
      }
      if (snapshot?.formulaRequired === true && !toText(snapshot?.formulaReference)) {
        flags.push({
          id: `lot-formula-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} needs formula review`,
          detail: 'This lot is flagged as formula-required, so review whether an approved formula reference should be captured before release.',
          openPath: buildPackagingReviewPath(lot.batchId, 'formulaReference'),
        });
      }
      if ((beverageClass === 'cider' || beverageClass === 'wine') && Number(abv ?? 0) > 0 && Number(abv ?? 0) < 7 && snapshot?.fdaLabelReviewComplete !== true) {
        flags.push({
          id: `lot-fda-${lot.id}`,
          severity: 'medium',
          title: `${lotCode} needs FDA label path review`,
          detail: 'If this lot is on the under-7% FDA label path, review the FDA labeling requirements before release.',
          openPath: buildPackagingReviewPath(lot.batchId, 'fdaLabel'),
        });
      }
    }

    for (const product of products) {
      if (product.skuIds.length > 0 && !product.currentLabelVersionId) {
        flags.push({
          id: `product-label-version-${product.productId}`,
          severity: 'info',
          title: `${product.productCode} is missing current label version`,
          detail: 'Attach the active label version so package-lot history can preserve the approved art/version used.',
          openPath: '/os/batches/new',
        });
      }
    }

    return flags.sort((left, right) => {
      const weight = { high: 0, medium: 1, info: 2 };
      return weight[left.severity] - weight[right.severity] || left.title.localeCompare(right.title);
    });
  }, [batches, packageLots, products]);

  const filteredEvents = useMemo(() => {
    const events = feed?.events ?? [];
    const query = searchValue.trim().toLowerCase();
    return events.filter((event) => {
      if (focusFilter === 'losses') {
        const isLossEvent =
          event.eventType === 'loss_recorded' || event.eventType === 'destruction_recorded';
        if (!isLossEvent) return false;
      }
      if (focusFilter === 'removals') {
        const isRemovalEvent =
          event.eventType === 'inventory_shipped' ||
          event.eventType === 'pour_recorded' ||
          event.eventType === 'batch_shipped';
        if (!isRemovalEvent) return false;
      }
      if (!query) return true;
      return [
        event.id,
        event.eventType,
        event.reasonCode,
        event.reasonMessage,
        event.lotCode,
        event.batchId,
        event.skuId,
        event.sourceRecord.recordType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [feed?.events, focusFilter, searchValue]);

  const packagedLotRows = useMemo(
    () =>
      packageLots
        .map((lot) => {
          const batch = batchById.get(lot.batchId);
          const snapshot = complianceSnapshotFromLot(lot);
          const product = batch?.productSnapshot?.productId
            ? productById.get(batch.productSnapshot.productId)
            : undefined;
          const reviewItems = [
            !lot.packageLotCode ? 'package lot code' : null,
            !toText(snapshot?.productName) ? 'product name' : null,
            !toText(snapshot?.brandName) ? 'brand name' : null,
            !toText(snapshot?.beverageClass) ? 'beverage class' : null,
            snapshot?.healthWarningIncluded === undefined ? 'health warning review' : null,
          ].filter(Boolean) as string[];
          return {
            lot,
            batch,
            snapshot,
            product,
            reviewItems,
            availableUnits: Math.max(0, lot.totalUnits - lot.allocatedUnits - lot.shippedUnits),
          };
        })
        .sort((left, right) => (right.lot.updatedAt ?? '').localeCompare(left.lot.updatedAt ?? '')),
    [batchById, packageLots, productById]
  );

  const filteredReviewFlags = useMemo(() => {
    if (focusFilter === 'high') {
      return reviewFlags.filter((flag) => flag.severity === 'high');
    }
    return reviewFlags;
  }, [focusFilter, reviewFlags]);

  const filteredPackagedLotRows = useMemo(() => {
    if (focusFilter === 'lot_review') {
      return packagedLotRows.filter((row) => row.reviewItems.length > 0);
    }
    return packagedLotRows;
  }, [focusFilter, packagedLotRows]);

  const highSeverityCount = reviewFlags.filter((flag) => flag.severity === 'high').length;
  const mediumSeverityCount = reviewFlags.filter((flag) => flag.severity === 'medium').length;
  const lossEventCount = Object.entries(feed?.summary.byType ?? {}).reduce(
    (sum, [type, count]) => sum + (type === 'loss_recorded' || type === 'destruction_recorded' ? count : 0),
    0
  );
  const removalEventCount = Object.entries(feed?.summary.byType ?? {}).reduce(
    (sum, [type, count]) => sum + (type === 'inventory_shipped' || type === 'pour_recorded' || type === 'batch_shipped' ? count : 0),
    0
  );
  const packagedLotsNeedingReview = packagedLotRows.filter((row) => row.reviewItems.length > 0).length;
  const eventTypeCount = Object.keys(feed?.summary.byType ?? {}).length;
  const activateFocus = (tab: ComplianceTab, filter: ComplianceFocusFilter) => {
    setActiveTab(tab);
    setFocusFilter(filter);
  };
  const handleTabChange = (value: ComplianceTab) => {
    setActiveTab(value);
    if (value === 'overview' && focusFilter !== 'all' && focusFilter !== 'high') {
      setFocusFilter('all');
    }
    if (value === 'lots' && focusFilter !== 'all' && focusFilter !== 'lot_review') {
      setFocusFilter('all');
    }
    if (
      value === 'events' &&
      focusFilter !== 'all' &&
      focusFilter !== 'events' &&
      focusFilter !== 'losses' &&
      focusFilter !== 'removals'
    ) {
      setFocusFilter('all');
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Compliance Review">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compliance Review</h1>
            <p className="text-muted-foreground">
              Review OS production events, packaged-lot snapshots, and open follow-up items before OPS filing work. This page should guide the operator, not trap them in a fake approval gate.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/os/packaging')}>
              Packaging
            </Button>
            <Button onClick={() => navigate('/os/packaged-products')}>Packaged Products</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <button type="button" className="text-left" onClick={() => activateFocus('events', 'events')}>
            <div
              className={`${tileClass} transition hover:border-cyan-300/40 ${
                activeTab === 'events' && focusFilter === 'events' ? 'ring-2 ring-cyan-300/60' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Compliance Events</div>
              <div className="mt-2 text-3xl font-semibold">{feed?.summary.totalEvents ?? 0}</div>
              <div className="mt-1 text-sm text-white/65">current OS event window</div>
            </div>
          </button>
          <button type="button" className="text-left" onClick={() => activateFocus('overview', 'high')}>
            <div
              className={`${tileClass} transition hover:border-cyan-300/40 ${
                activeTab === 'overview' && focusFilter === 'high' ? 'ring-2 ring-cyan-300/60' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">High Attention</div>
              <div className="mt-2 text-3xl font-semibold">{highSeverityCount}</div>
              <div className="mt-1 text-sm text-white/65">{mediumSeverityCount} medium review items behind it</div>
            </div>
          </button>
          <button type="button" className="text-left" onClick={() => activateFocus('lots', 'lot_review')}>
            <div
              className={`${tileClass} transition hover:border-cyan-300/40 ${
                activeTab === 'lots' && focusFilter === 'lot_review' ? 'ring-2 ring-cyan-300/60' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Lot Follow-up</div>
              <div className="mt-2 text-3xl font-semibold">{packagedLotsNeedingReview}</div>
              <div className="mt-1 text-sm text-white/65">packaged lots still needing operator review</div>
            </div>
          </button>
          <button type="button" className="text-left" onClick={() => activateFocus('events', 'all')}>
            <div
              className={`${tileClass} transition hover:border-cyan-300/40 ${
                activeTab === 'events' && focusFilter === 'all' ? 'ring-2 ring-cyan-300/60' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Event Coverage</div>
              <div className="mt-2 text-3xl font-semibold">{eventTypeCount}</div>
              <div className="mt-1 text-sm text-white/65">event types currently visible to OPS</div>
            </div>
          </button>
        </div>

        <Card className={surfaceClass}>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Feed Window
              </div>
              <p className="text-sm text-white/70">
                {feed
                  ? `${formatDateTime(feed.range.from)} to ${formatDateTime(feed.range.to)} · generated ${formatDateTime(feed.generatedAt)}`
                  : statusText}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={highSeverityCount > 0 ? 'destructive' : 'outline'}>
                {highSeverityCount} high-priority flags
              </Badge>
              <Badge variant="secondary">{feed?.cursor?.hasMore ? 'more events available' : 'full window loaded'}</Badge>
              {focusFilter !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => activateFocus(activeTab, 'all')}>
                  Clear Filter
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button type="button" className="text-left" onClick={() => activateFocus('events', 'losses')}>
            <div
              className={`${tileClass} transition hover:border-cyan-300/40 ${
                activeTab === 'events' && focusFilter === 'losses' ? 'ring-2 ring-cyan-300/60' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Loss / Destruction</div>
              <div className="mt-2 text-3xl font-semibold">{lossEventCount}</div>
              <div className="mt-1 text-sm text-white/65">loss and destruction records in the current feed window</div>
            </div>
          </button>
          <button type="button" className="text-left" onClick={() => activateFocus('events', 'removals')}>
            <div
              className={`${tileClass} transition hover:border-cyan-300/40 ${
                activeTab === 'events' && focusFilter === 'removals' ? 'ring-2 ring-cyan-300/60' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Removals / Pours</div>
              <div className="mt-2 text-3xl font-semibold">{removalEventCount}</div>
              <div className="mt-1 text-sm text-white/65">shipments and depletion events emitted from OS</div>
            </div>
          </button>
        </div>

        <Card className={surfaceClass}>
          <CardContent className="p-4 text-sm text-white/70">
            OS should surface what needs attention, what is already supported, and what still needs judgment. Advisory items here are for review and traceability support, not automatic production blockers.
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as ComplianceTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lots">Packaged Lots</TabsTrigger>
            <TabsTrigger value="events">Event Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <Card className={surfaceClass}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-white">Review Queue</CardTitle>
                      <CardDescription>Items worth closing before you lean on OS as the handoff into OPS compliance work.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredReviewFlags.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
                      {focusFilter === 'high'
                        ? 'No high-attention review flags are active in the current OS data window.'
                        : 'No review flags detected in the current OS data window.'}
                    </div>
                  ) : (
                    filteredReviewFlags.slice(0, 10).map((flag) => (
                      <div
                        key={flag.id}
                        className={`rounded-2xl border p-4 ${reviewTone(flag.severity).cardClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${reviewTone(flag.severity).dotClass}`} />
                              <div className="font-medium text-white">{flag.title}</div>
                            </div>
                            <div className="mt-1 text-sm text-white/60">{flag.detail}</div>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${reviewTone(flag.severity).labelClass}`}>
                            {flag.severity}
                          </span>
                        </div>
                        {flag.openPath ? (
                          <div className="mt-3">
                            <Button variant="outline" size="sm" onClick={() => navigate(flag.openPath!)}>
                              Open Fix
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className={surfaceClass}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-white">Event Coverage</CardTitle>
                      <CardDescription>What OS is already emitting into the compliance feed for OPS and reporting support.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(feed?.summary.byType ?? {}).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
                      No compliance events found for this site yet.
                    </div>
                  ) : (
                    Object.entries(feed?.summary.byType ?? {})
                      .sort((left, right) => right[1] - left[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span className="font-medium text-white">{type.replaceAll('_', ' ')}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className={surfaceClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-white">Operator Note</CardTitle>
                    <CardDescription>What this page is for right now.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-white/70">
                Use this page as the OS-side checkpoint before trusting a lot for OPS delivery and compliance work. It should show what needs review, what is already traceable, and what events are ready to hand off without turning compliance into a duplicate reporting page.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lots" className="space-y-6">
            <Card className={surfaceClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-white">Packaged Lot Review</CardTitle>
                    <CardDescription>Packaging snapshots and traceability details that matter before release, delivery, and downstream reporting.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredPackagedLotRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
                    {focusFilter === 'lot_review'
                      ? 'No packaged lots currently need follow-up.'
                      : 'No package lots found yet.'}
                  </div>
                ) : (
                  filteredPackagedLotRows.slice(0, 8).map(({ lot, batch, snapshot, reviewItems, availableUnits }) => (
                    <div key={lot.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold text-white">{lot.packageLotCode ?? lot.lotCode}</div>
                            <Badge variant="outline">{lot.packageType}</Badge>
                            {lot.packageFormatCode ? <Badge variant="secondary">{lot.packageFormatCode}</Badge> : null}
                          </div>
                          <div className="mt-1 text-sm text-white/60">
                            Batch {batch?.batchCode ?? batch?.lotCode ?? lot.batchCode ?? lot.batchId} · SKU {lot.packageSkuId ?? lot.skuId ?? '--'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={reviewItems.length > 0 ? 'secondary' : 'outline'}>
                            {reviewItems.length > 0 ? `${reviewItems.length} review item${reviewItems.length === 1 ? '' : 's'}` : 'snapshot looks complete'}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => navigate('/os/packaged-products')}>
                            Open
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                          <div className="text-xs uppercase tracking-wide text-white/45">Product</div>
                          <div className="mt-1 font-medium text-white">
                            {toText(snapshot?.productName) ?? batch?.productSnapshot?.productName ?? batch?.recipeName ?? '--'}
                          </div>
                          <div className="text-sm text-white/60">
                            {toText(snapshot?.brandName) ?? batch?.productSnapshot?.productCode ?? '--'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                          <div className="text-xs uppercase tracking-wide text-white/45">Compliance Snapshot</div>
                          <div className="mt-1 text-sm text-white">Class: {toText(snapshot?.beverageClass) ?? '--'}</div>
                          <div className="text-sm text-white/60">
                            Health warning: {snapshot?.healthWarningIncluded === true ? 'yes' : snapshot?.healthWarningIncluded === false ? 'no' : 'review'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                          <div className="text-xs uppercase tracking-wide text-white/45">Units</div>
                          <div className="mt-1 font-medium text-white">{availableUnits} available</div>
                          <div className="text-sm text-white/60">
                            {lot.totalUnits} total · {lot.shippedUnits} shipped
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                          <div className="text-xs uppercase tracking-wide text-white/45">Cellar Data</div>
                          <div className="mt-1 text-sm text-white">
                            ABV {batch?.actualResults?.abvPct ?? toNumber(snapshot?.abvPct) ?? '--'}
                          </div>
                          <div className="text-sm text-white/60">
                            Brix {batch?.actualResults?.brixLatest ?? '--'} · SO2 {batch?.actualResults?.so2PpmLatest ?? '--'}
                          </div>
                        </div>
                      </div>

                      {reviewItems.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewItems.map((item) => (
                            <Badge key={`${lot.id}-${item}`} variant="secondary">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className={surfaceClass}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-white">Event Timeline</CardTitle>
                      <CardDescription>Feed events OS is ready to hand to OPS for reporting, review, and matrixing.</CardDescription>
                    </div>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    <Label htmlFor="compliance-search">Search events</Label>
                    <Input
                      id="compliance-search"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search by event, lot, batch, SKU, or reason"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
                    {focusFilter === 'losses'
                      ? 'No loss or destruction events match the current search.'
                      : focusFilter === 'removals'
                        ? 'No removal or depletion events match the current search.'
                        : 'No events match the current search.'}
                  </div>
                ) : (
                  filteredEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{event.eventType.replaceAll('_', ' ')}</Badge>
                            <Badge variant="secondary">{event.sourceRecord.recordType.replaceAll('_', ' ')}</Badge>
                            {event.regulatoryTags?.map((tag) => (
                              <Badge key={`${event.id}-${tag}`} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="font-medium text-white">{event.reasonMessage ?? event.id}</div>
                          <div className="text-sm text-white/60">
                            {formatDateTime(event.occurredAt)} · lot {event.lotCode ?? '--'} · batch {event.batchId ?? '--'} · SKU {event.skuId ?? '--'}
                          </div>
                          {event.measurements ? (
                            <div className="flex flex-wrap gap-2 text-xs text-white/50">
                              {event.measurements.temperatureC !== undefined ? (
                                <span>
                                  Temp {formatTemperatureValue(event.measurements.temperatureC, temperatureUnit, 1)}°{temperatureUnit}
                                </span>
                              ) : null}
                              {event.measurements.sg !== undefined ? <span>SG {event.measurements.sg}</span> : null}
                              {event.measurements.fg !== undefined ? <span>FG {event.measurements.fg}</span> : null}
                              {event.measurements.abvPct !== undefined ? <span>ABV {event.measurements.abvPct}%</span> : null}
                              {event.measurements.ph !== undefined ? <span>pH {event.measurements.ph}</span> : null}
                              {event.measurements.brix !== undefined ? <span>Brix {event.measurements.brix}</span> : null}
                              {event.measurements.titratableAcidityGpl !== undefined ? <span>TA {event.measurements.titratableAcidityGpl} g/L</span> : null}
                              {event.measurements.so2Ppm !== undefined ? <span>SO2 {event.measurements.so2Ppm} ppm</span> : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <div className="font-medium text-white">{formatQuantity(event)}</div>
                            <div className="text-white/55">{event.quantity?.direction ?? 'none'}</div>
                          </div>
                          {event.sourceRecord.openPath ? (
                            <Button variant="outline" size="sm" onClick={() => navigate(event.sourceRecord.openPath!)}>
                              Open
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
