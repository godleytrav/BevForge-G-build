import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getComplianceSnapshotReadiness } from '@/lib/production-readiness';
import { convertVolume, formatVolumeNumber, isVolumeUnit } from '@/lib/volume-format';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Archive,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  Printer,
  ScrollText,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';

type ReportingTab = 'federal' | 'california' | 'products';
type RangePreset =
  | 'month'
  | 'quarter'
  | 'year'
  | 'specific_month'
  | 'specific_quarter'
  | 'specific_year'
  | 'custom';
type ReadinessState = 'ready' | 'warning' | 'missing';
type ReportId =
  | 'ttb_operations'
  | 'ttb_excise'
  | 'cola_formula'
  | 'ca_abc'
  | 'ca_cdtfa'
  | 'ca_crv'
  | 'sku_compliance';
type ArtifactReportType = 'batches' | 'packaging' | 'movements' | 'production' | 'compliance';

interface BatchRecord {
  id: string;
  siteId: string;
  batchCode?: string;
  lotCode: string;
  batchKind?: 'source' | 'derived';
  parentBatchId?: string;
  recipeName: string;
  status: string;
  unit: string;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  releasedAt?: string;
  actualResults?: {
    abvPct?: number;
    sgLatest?: number;
    fg?: number;
    phLatest?: number;
    brixLatest?: number;
    titratableAcidityGplLatest?: number;
    so2PpmLatest?: number;
  };
  deviations?: Array<{
    id: string;
    timestamp: string;
    field:
      | 'step_duration'
      | 'hold_temperature'
      | 'gravity'
      | 'abv'
      | 'ph'
      | 'volume'
      | 'transfer'
      | 'packaging'
      | 'other';
    planned?: string | number | boolean;
    actual?: string | number | boolean;
    unit?: string;
    note?: string;
    source?: 'manual' | 'sensor' | 'automation';
    actor?: string;
    reasonCode?: string;
  }>;
  productSnapshot?: {
    productCode?: string;
    productName?: string;
    beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
  };
}

interface PackageLotRecord {
  id: string;
  siteId: string;
  batchId: string;
  batchCode?: string;
  lotCode: string;
  packageLotCode?: string;
  skuId?: string;
  packageSkuId?: string;
  packageType: string;
  packageFormatCode?: string;
  totalUnits: number;
  allocatedUnits: number;
  shippedUnits: number;
  unitOfMeasure?: string;
  unitSize?: number;
  releaseStatus?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

interface InventoryItemRecord {
  id: string;
  skuId: string;
  name: string;
  productCode?: string;
  productName?: string;
  beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
  packageFormatCode?: string;
}

interface InventoryMovementRecord {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  unit: string;
  reason?: string;
  reasonCode?: string;
  actor?: string;
  batchId?: string;
  packageLotId?: string;
  siteId?: string;
  createdAt: string;
}

interface PackagingRunRecord {
  id: string;
  siteId: string;
  sourceBatchId: string;
  sourceLotCode: string;
  sourceRecipeName: string;
  sourceUnit: string;
  sourceAvailableQty: number;
  status: 'active' | 'completed' | 'canceled';
  packageType: string;
  packageFormatCode?: string;
  outputSkuId: string;
  lossReasonCode?: string;
  plannedUnits: number;
  completedUnits: number;
  rejectedUnits: number;
  sourceQtyUsed: number;
  lossQty: number;
  packageLotId?: string;
  packageLotCode?: string;
  complianceSnapshot: {
    beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
    brandName?: string;
    productName?: string;
    classDesignation?: string;
    taxClass?: 'hard_cider' | 'still_wine' | 'sparkling_wine' | 'beer' | 'other';
    colaReference?: string;
    formulaReference?: string;
    abvPct?: number;
    netContentsStatement?: string;
    sulfiteDeclaration?: string;
    healthWarningIncluded?: boolean;
    interstateSale?: boolean;
    formulaRequired?: boolean;
    fdaLabelReviewComplete?: boolean;
    ingredientStatementReviewed?: boolean;
    allergenReviewComplete?: boolean;
    hardCiderQualified?: boolean;
  };
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

interface TransferRunRecord {
  id: string;
  siteId: string;
  sourceBatchId: string;
  sourceLotCode: string;
  sourceRecipeName: string;
  sourceUnit: string;
  status: 'active' | 'completed' | 'canceled';
  destinations: Array<{
    id: string;
    label: string;
    actualQty: number;
  }>;
  lossReasonCode?: string;
  notes?: string;
  lossQty: number;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

interface ComplianceEventRecord {
  id: string;
  eventType: string;
  occurredAt: string;
  batchId?: string;
  lotCode?: string;
  skuId?: string;
  reasonCode?: string;
  reasonMessage?: string;
  quantity?: {
    value: number;
    uom: string;
    direction: string;
  };
}

interface ComplianceFeedRecord {
  summary: {
    totalEvents: number;
    byType: Record<string, number>;
  };
  events: ComplianceEventRecord[];
  range: {
    from: string;
    to: string;
  };
}

interface ReportSummaryCard {
  label: string;
  value: string;
  detail?: string;
}

interface ReadinessItem {
  label: string;
  state: ReadinessState;
  detail: string;
}

interface RegulatoryReport {
  id: ReportId;
  tab: ReportingTab;
  agency: string;
  frequency: string;
  title: string;
  description: string;
  note: string;
  summaryCards: ReportSummaryCard[];
  readinessItems: ReadinessItem[];
  columns: string[];
  rows: string[][];
  emptyText: string;
  exportBaseName: string;
}

interface ReportArtifactRecord {
  id: string;
  reportType: ArtifactReportType;
  reportId?: string;
  reportTitle?: string;
  format: 'csv' | 'html';
  fileName: string;
  createdAt: string;
  contentType: string;
  range: {
    from: string;
    to: string;
    label: string;
  };
}

interface BulkLedgerEntry {
  occurredAt: string;
  type:
    | 'produced'
    | 'derived_in'
    | 'packaged'
    | 'packaging_loss'
    | 'transfer_loss'
    | 'manual_adjustment'
    | 'flow_depletion';
  gallons: number;
}

const formatDate = (value: string | undefined) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleDateString() : '--';
};

const formatDateTime = (value: string | undefined) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : '--';
};

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthLabel = (index: number) =>
  new Date(2026, index, 1).toLocaleString([], { month: 'long' });

const startOfDay = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (value: Date) => {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
};

const subtractMonths = (value: Date, months: number) => {
  const next = new Date(value);
  next.setMonth(next.getMonth() - months);
  return next;
};

const subtractDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() - days);
  return next;
};

const buildRange = (
  preset: RangePreset,
  customFrom: string,
  customTo: string,
  selectedMonth: number,
  selectedQuarter: number,
  selectedYear: number
) => {
  const now = new Date();
  if (preset === 'month') {
    return {
      from: startOfDay(subtractMonths(now, 1)),
      to: endOfDay(now),
      label: 'Last Month',
    };
  }
  if (preset === 'quarter') {
    return {
      from: startOfDay(subtractMonths(now, 3)),
      to: endOfDay(now),
      label: 'Last Quarter',
    };
  }
  if (preset === 'year') {
    return {
      from: startOfDay(subtractDays(now, 365)),
      to: endOfDay(now),
      label: 'Last 12 Months',
    };
  }
  if (preset === 'specific_month') {
    const from = new Date(selectedYear, selectedMonth, 1);
    const to = new Date(selectedYear, selectedMonth + 1, 0);
    return {
      from: startOfDay(from),
      to: endOfDay(to),
      label: `${monthLabel(selectedMonth)} ${selectedYear}`,
    };
  }
  if (preset === 'specific_quarter') {
    const startMonth = (selectedQuarter - 1) * 3;
    const from = new Date(selectedYear, startMonth, 1);
    const to = new Date(selectedYear, startMonth + 3, 0);
    return {
      from: startOfDay(from),
      to: endOfDay(to),
      label: `Q${selectedQuarter} ${selectedYear}`,
    };
  }
  if (preset === 'specific_year') {
    const from = new Date(selectedYear, 0, 1);
    const to = new Date(selectedYear, 11, 31);
    return {
      from: startOfDay(from),
      to: endOfDay(to),
      label: String(selectedYear),
    };
  }
  const parsedFrom = customFrom ? new Date(`${customFrom}T00:00:00`) : subtractMonths(now, 1);
  const parsedTo = customTo ? new Date(`${customTo}T23:59:59`) : now;
  return {
    from: startOfDay(parsedFrom),
    to: endOfDay(parsedTo),
    label: `${toDateInputValue(parsedFrom)} to ${toDateInputValue(parsedTo)}`,
  };
};

const isWithinRange = (value: string | undefined, from: Date, to: Date) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return false;
  return parsed >= from.getTime() && parsed <= to.getTime();
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const toFiniteNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const toText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const toGallons = (value: number, unit: string | undefined): number | null => {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (!unit) return null;
  if (unit.toLowerCase() === 'gal') return value;
  return convertVolume(value, unit, 'gal');
};

const formatGallons = (value: number) => `${formatVolumeNumber(value, 1)} gal`;

const availabilityForBatch = (batch: BatchRecord) =>
  Math.max(0, Number(batch.producedQty) - Number(batch.allocatedQty) - Number(batch.dispensedQty ?? 0));

const complianceSnapshotFromLot = (lot: PackageLotRecord) => {
  const metadata = lot.metadata;
  if (!metadata || typeof metadata !== 'object') return undefined;
  const snapshot = metadata.complianceSnapshot;
  return snapshot && typeof snapshot === 'object' ? (snapshot as Record<string, unknown>) : undefined;
};

const resolveLotBeverageClass = (
  lot: PackageLotRecord,
  batchById: Map<string, BatchRecord>,
  inventoryItemById: Map<string, InventoryItemRecord>
) => {
  const snapshot = complianceSnapshotFromLot(lot);
  const inventoryItem = [...inventoryItemById.values()].find(
    (item) => item.skuId === (lot.packageSkuId ?? lot.skuId)
  );
  return (
    (toText(snapshot?.beverageClass) as 'cider' | 'wine' | 'beer' | 'other' | undefined) ??
    batchById.get(lot.batchId)?.productSnapshot?.beverageClass ??
    inventoryItem?.beverageClass ??
    'other'
  );
};

const resolveLotProductName = (
  lot: PackageLotRecord,
  batchById: Map<string, BatchRecord>
) => {
  const snapshot = complianceSnapshotFromLot(lot);
  return (
    toText(snapshot?.productName) ??
    batchById.get(lot.batchId)?.productSnapshot?.productName ??
    batchById.get(lot.batchId)?.recipeName ??
    'Packaged product'
  );
};

const resolveLotAbv = (lot: PackageLotRecord, batchById: Map<string, BatchRecord>) => {
  const snapshot = complianceSnapshotFromLot(lot);
  return (
    toFiniteNumber(snapshot?.abvPct) ??
    toFiniteNumber(batchById.get(lot.batchId)?.actualResults?.abvPct) ??
    undefined
  );
};

const deriveRemovalGallons = (
  movement: InventoryMovementRecord,
  lot: PackageLotRecord | undefined
) => {
  if (isVolumeUnit(movement.unit)) {
    return toGallons(Number(movement.quantity), movement.unit);
  }
  if (!lot?.unitSize || !lot?.unitOfMeasure) return null;
  return toGallons(Number(movement.quantity) * Number(lot.unitSize), lot.unitOfMeasure);
};

const deriveHardCiderClass = (params: {
  beverageClass?: string;
  abvPct?: number;
  classDesignation?: string;
  taxClass?: string;
  hardCiderQualified?: boolean;
}) => {
  if (params.taxClass === 'beer') return 'Beer';
  if (params.taxClass === 'still_wine') return 'Still wine';
  if (params.taxClass === 'sparkling_wine') return 'Sparkling wine';
  if (params.taxClass === 'hard_cider') {
    return params.hardCiderQualified === false ? 'Cider / wine class review' : 'Hard cider candidate';
  }
  if (params.beverageClass === 'beer') return 'Beer';
  if (params.beverageClass === 'wine') return 'Still wine';
  if (params.beverageClass !== 'cider') return 'Other';
  const designation = String(params.classDesignation ?? '').toLowerCase();
  const looksSparkling = /sparkling|carbonated|effervescent/.test(designation);
  if ((params.abvPct ?? 0) >= 0.5 && (params.abvPct ?? 0) < 8.5 && !looksSparkling) {
    return 'Hard cider candidate';
  }
  return 'Cider / wine class review';
};

const batchAdditionOccurredAt = (batch: BatchRecord): string | undefined => {
  if (batch.batchKind === 'derived' && batch.parentBatchId && Number(batch.producedQty) > 0) {
    return batch.createdAt;
  }
  if (
    (batch.status === 'completed' ||
      batch.status === 'released' ||
      batch.status === 'allocated' ||
      batch.status === 'shipped' ||
      Boolean(batch.completedAt)) &&
    Number(batch.producedQty) > 0
  ) {
    return batch.completedAt ?? batch.updatedAt;
  }
  return undefined;
};

const buildBulkLedger = (params: {
  batches: BatchRecord[];
  packagingRuns: PackagingRunRecord[];
  transferRuns: TransferRunRecord[];
}): BulkLedgerEntry[] => {
  const entries: BulkLedgerEntry[] = [];

  for (const batch of params.batches) {
    const occurredAt = batchAdditionOccurredAt(batch);
    const gallons = toGallons(Number(batch.producedQty), batch.unit);
    if (!occurredAt || !Number.isFinite(gallons ?? Number.NaN) || Number(gallons) <= 0) continue;
    entries.push({
      occurredAt,
      type: batch.batchKind === 'derived' && batch.parentBatchId ? 'derived_in' : 'produced',
      gallons: Number(gallons),
    });

    for (const deviation of batch.deviations ?? []) {
      if (deviation.field !== 'volume') continue;
      if (typeof deviation.planned !== 'number' || typeof deviation.actual !== 'number') continue;
      const deviationUnit = deviation.unit ?? batch.unit;
      const deltaGallons = toGallons(Number(deviation.actual) - Number(deviation.planned), deviationUnit);
      if (!Number.isFinite(deltaGallons ?? Number.NaN) || deltaGallons === 0) continue;
      if (deviation.reasonCode === 'manual_bulk_adjustment') {
        entries.push({
          occurredAt: deviation.timestamp,
          type: 'manual_adjustment',
          gallons: Number(deltaGallons),
        });
      }
      if (deviation.reasonCode === 'flow_pour_depletion') {
        entries.push({
          occurredAt: deviation.timestamp,
          type: 'flow_depletion',
          gallons: Number(deltaGallons),
        });
      }
    }
  }

  for (const run of params.packagingRuns) {
    if (run.status !== 'completed' || !run.completedAt) continue;
    const packagedGallons = toGallons(Number(run.sourceQtyUsed), run.sourceUnit);
    if (Number.isFinite(packagedGallons ?? Number.NaN) && Number(packagedGallons) > 0) {
      entries.push({
        occurredAt: run.completedAt,
        type: 'packaged',
        gallons: Number(packagedGallons),
      });
    }
    const lossGallons = toGallons(Number(run.lossQty), run.sourceUnit);
    if (Number.isFinite(lossGallons ?? Number.NaN) && Number(lossGallons) > 0) {
      entries.push({
        occurredAt: run.completedAt,
        type: 'packaging_loss',
        gallons: Number(lossGallons),
      });
    }
  }

  for (const run of params.transferRuns) {
    if (run.status !== 'completed' || !run.completedAt) continue;
    const lossGallons = toGallons(Number(run.lossQty), run.sourceUnit);
    if (!Number.isFinite(lossGallons ?? Number.NaN) || Number(lossGallons) <= 0) continue;
    entries.push({
      occurredAt: run.completedAt,
      type: 'transfer_loss',
      gallons: Number(lossGallons),
    });
  }

  return entries.sort((left, right) => {
    const leftStamp = Date.parse(left.occurredAt) || 0;
    const rightStamp = Date.parse(right.occurredAt) || 0;
    return leftStamp - rightStamp;
  });
};

const bulkPositionAt = (entries: BulkLedgerEntry[], cutoff: Date, inclusive: boolean) =>
  entries.reduce((total, entry) => {
    const stamp = Date.parse(entry.occurredAt);
    if (!Number.isFinite(stamp)) return total;
    const within = inclusive ? stamp <= cutoff.getTime() : stamp < cutoff.getTime();
    if (!within) return total;
    if (
      entry.type === 'produced' ||
      entry.type === 'derived_in' ||
      entry.type === 'manual_adjustment'
    ) {
      return total + entry.gallons;
    }
    return total - entry.gallons;
  }, 0);

const buildCsvContent = (report: RegulatoryReport) =>
  [
    report.columns.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
    ...report.rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
  ].join('\n');

const buildPrintHtml = (
  report: RegulatoryReport,
  rangeLabel: string,
  autoPrint: boolean,
  siteName: string
) => {
  const summaryHtml = report.summaryCards
    .map(
      (card) => `
        <div class="summary-card">
          <div class="summary-label">${card.label}</div>
          <div class="summary-value">${card.value}</div>
          <div class="summary-detail">${card.detail ?? ''}</div>
        </div>
      `
    )
    .join('');
  const readinessHtml = report.readinessItems
    .map(
      (item) => `
        <tr>
          <td>${item.label}</td>
          <td>${item.state}</td>
          <td>${item.detail}</td>
        </tr>
      `
    )
    .join('');
  const rowsHtml = report.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  const autoPrintScript = autoPrint
    ? `
    <script>
      window.addEventListener('load', () => {
        window.setTimeout(() => {
          window.focus();
          window.print();
        }, 250);
      });
      window.addEventListener('afterprint', () => {
        window.setTimeout(() => window.close(), 150);
      });
    </script>`
    : '';
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${report.title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
      h1 { margin: 0 0 6px; font-size: 24px; }
      p { margin: 0 0 12px; color: #4b5563; }
      .meta { margin-bottom: 18px; font-size: 12px; color: #6b7280; }
      .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
      .summary-card { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; }
      .summary-label { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
      .summary-value { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      .summary-detail { font-size: 12px; color: #6b7280; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; font-size: 12px; }
      th { background: #f3f4f6; text-transform: uppercase; font-size: 11px; }
      .section-title { margin-top: 24px; font-size: 16px; font-weight: 700; }
      .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 11px; color: #6b7280; }
      @media print { @page { size: letter; margin: 0.5in; } }
    </style>
  </head>
  <body>
    <h1>${report.title}</h1>
    <p>${report.description}</p>
    <div class="meta">${report.agency} • ${report.frequency} • ${rangeLabel}</div>
    <div class="summary-grid">${summaryHtml}</div>
    <div class="section-title">Readiness</div>
    <table>
      <thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead>
      <tbody>${readinessHtml}</tbody>
    </table>
    <div class="section-title">Schedule</div>
    <table>
      <thead><tr>${report.columns.map((column) => `<th>${column}</th>`).join('')}</tr></thead>
      <tbody>${rowsHtml || `<tr><td colspan="${report.columns.length}">${report.emptyText}</td></tr>`}</tbody>
    </table>
    <div class="section-title">Notes</div>
    <p>${report.note}</p>
    <div class="footer">Generated from BevForge OS • ${siteName} • ${new Date().toLocaleString()} • ${rangeLabel}</div>
    ${autoPrintScript}
  </body>
</html>`;
};

const readinessVariant = (state: ReadinessState) => {
  if (state === 'ready') return 'secondary' as const;
  if (state === 'warning') return 'outline' as const;
  return 'destructive' as const;
};

const readinessIcon = (state: ReadinessState) => {
  if (state === 'ready') return CheckCircle2;
  if (state === 'warning') return CircleAlert;
  return AlertTriangle;
};

const readinessLabel = (state: ReadinessState) => {
  if (state === 'ready') return 'Ready';
  if (state === 'warning') return 'Needs review';
  return 'Missing data';
};

const surfaceClass =
  'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)] text-white shadow-[0_18px_45px_rgba(2,6,23,0.35)]';

const tileClass =
  'rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.72)_100%)] px-4 py-4 text-white shadow-[0_12px_30px_rgba(2,6,23,0.25)]';

const buildReports = (params: {
  range: { from: Date; to: Date; label: string };
  batches: BatchRecord[];
  lots: PackageLotRecord[];
  inventoryItems: InventoryItemRecord[];
  movements: InventoryMovementRecord[];
  packagingRuns: PackagingRunRecord[];
  transferRuns: TransferRunRecord[];
  complianceFeed: ComplianceFeedRecord | null;
}): RegulatoryReport[] => {
  const { range } = params;
  const batchById = new Map(params.batches.map((batch) => [batch.id, batch] as const));
  const inventoryItemById = new Map(params.inventoryItems.map((item) => [item.id, item] as const));
  const lotById = new Map(params.lots.map((lot) => [lot.id, lot] as const));

  const completedBatches = params.batches.filter((batch) => {
    const anchor = batchAdditionOccurredAt(batch);
    return (
      batch.batchKind !== 'derived' &&
      isWithinRange(anchor, range.from, range.to)
    );
  });

  const completedPackagingRuns = params.packagingRuns.filter(
    (run) => run.status === 'completed' && isWithinRange(run.completedAt ?? run.updatedAt, range.from, range.to)
  );

  const completedTransferRuns = params.transferRuns.filter(
    (run) => run.status === 'completed' && isWithinRange(run.completedAt ?? run.updatedAt, range.from, range.to)
  );

  const shippedMovements = params.movements.filter(
    (movement) => movement.type === 'ship' && isWithinRange(movement.createdAt, range.from, range.to)
  );

  const bulkLedger = buildBulkLedger({
    batches: params.batches,
    packagingRuns: params.packagingRuns,
    transferRuns: params.transferRuns,
  });

  const currentBulkOnHandGallons = sum(
    params.batches
      .filter((batch) => batch.status !== 'shipped' && batch.status !== 'canceled')
      .map((batch) => toGallons(availabilityForBatch(batch), batch.unit) ?? 0)
  );

  const beginningBulkGallons = bulkPositionAt(bulkLedger, range.from, false);
  const endingBulkGallons = bulkPositionAt(bulkLedger, range.to, true);
  const currentBulkFromLedgerGallons = bulkPositionAt(bulkLedger, new Date(), true);
  const currentBulkLedgerDelta = Math.abs(currentBulkOnHandGallons - currentBulkFromLedgerGallons);

  const producedGallons = sum(
    completedBatches.map((batch) => toGallons(Number(batch.producedQty), batch.unit) ?? 0)
  );

  const derivedTransferInGallons = sum(
    params.batches
      .filter(
        (batch) =>
          batch.batchKind === 'derived' &&
          batch.parentBatchId &&
          isWithinRange(batch.createdAt, range.from, range.to)
      )
      .map((batch) => toGallons(Number(batch.producedQty), batch.unit) ?? 0)
  );

  const manualAdjustmentGallons = sum(
    bulkLedger
      .filter(
        (entry) =>
          entry.type === 'manual_adjustment' && isWithinRange(entry.occurredAt, range.from, range.to)
      )
      .map((entry) => entry.gallons)
  );
  const flowDepletionGallons = sum(
    bulkLedger
      .filter(
        (entry) => entry.type === 'flow_depletion' && isWithinRange(entry.occurredAt, range.from, range.to)
      )
      .map((entry) => entry.gallons)
  );

  const packagedGallons = sum(
    completedPackagingRuns.map((run) => toGallons(Number(run.sourceQtyUsed), run.sourceUnit) ?? 0)
  );

  const packagingLossGallons = sum(
    completedPackagingRuns.map((run) => toGallons(Number(run.lossQty), run.sourceUnit) ?? 0)
  );

  const transferLossGallons = sum(
    completedTransferRuns.map((run) => toGallons(Number(run.lossQty), run.sourceUnit) ?? 0)
  );

  const lossGallons = packagingLossGallons + transferLossGallons;
  const reconciliationExpectedEnding =
    beginningBulkGallons + producedGallons + manualAdjustmentGallons - packagedGallons - flowDepletionGallons - lossGallons;
  const reconciliationDelta = Math.abs(reconciliationExpectedEnding - endingBulkGallons);

  const shippedRecords = shippedMovements.map((movement) => {
    const lot = movement.packageLotId ? lotById.get(movement.packageLotId) : undefined;
    const item = inventoryItemById.get(movement.itemId);
    const quantityGallons = deriveRemovalGallons(movement, lot);
    const snapshot = lot ? complianceSnapshotFromLot(lot) : undefined;
    const beverageClass =
      item?.beverageClass ??
      (lot ? resolveLotBeverageClass(lot, batchById, inventoryItemById) : undefined) ??
      'other';
    const abvPct =
      (lot ? resolveLotAbv(lot, batchById) : undefined) ??
      toFiniteNumber((snapshot as Record<string, unknown> | undefined)?.abvPct);
    const classDesignation = toText(snapshot?.classDesignation);
    const taxClass = toText(snapshot?.taxClass);
    const hardCiderQualified =
      snapshot?.hardCiderQualified === true ? true : snapshot?.hardCiderQualified === false ? false : undefined;
    return {
      movement,
      lot,
      item,
      beverageClass,
      quantityGallons: quantityGallons ?? 0,
      abvPct,
      classDesignation,
      taxClass: deriveHardCiderClass({ beverageClass, abvPct, classDesignation, taxClass, hardCiderQualified }),
    };
  });

  const removalByTaxClass = Object.entries(
    shippedRecords.reduce<Record<string, { gallons: number; count: number }>>((accumulator, record) => {
      const key = record.taxClass;
      const current = accumulator[key] ?? { gallons: 0, count: 0 };
      current.gallons += record.quantityGallons;
      current.count += 1;
      accumulator[key] = current;
      return accumulator;
    }, {})
  ).sort(([left], [right]) => left.localeCompare(right));

  const removalByCaliforniaClass = Object.entries(
    shippedRecords.reduce<Record<string, { gallons: number; count: number }>>((accumulator, record) => {
      const key =
        record.beverageClass === 'beer'
          ? 'Beer'
          : record.beverageClass === 'cider'
            ? 'Hard cider'
            : record.beverageClass === 'wine'
              ? 'Wine'
              : 'Other';
      const current = accumulator[key] ?? { gallons: 0, count: 0 };
      current.gallons += record.quantityGallons;
      current.count += 1;
      accumulator[key] = current;
      return accumulator;
    }, {})
  ).sort(([left], [right]) => left.localeCompare(right));

  const complianceLots = params.lots
    .filter((lot) => isWithinRange(lot.updatedAt ?? lot.createdAt, range.from, range.to))
    .map((lot) => {
      const snapshot = complianceSnapshotFromLot(lot);
      const readiness = getComplianceSnapshotReadiness({
        beverageClass: (toText(snapshot?.beverageClass) as
          | 'cider'
          | 'wine'
          | 'beer'
          | 'other'
          | undefined) ?? batchById.get(lot.batchId)?.productSnapshot?.beverageClass,
        brandName: toText(snapshot?.brandName),
        productName:
          toText(snapshot?.productName) ?? batchById.get(lot.batchId)?.productSnapshot?.productName,
        classDesignation: toText(snapshot?.classDesignation),
        taxClass: (toText(snapshot?.taxClass) as
          | 'hard_cider'
          | 'still_wine'
          | 'sparkling_wine'
          | 'beer'
          | 'other'
          | undefined),
        colaReference: toText(snapshot?.colaReference),
        formulaReference: toText(snapshot?.formulaReference),
        abvPct:
          toFiniteNumber(snapshot?.abvPct) ?? batchById.get(lot.batchId)?.actualResults?.abvPct,
        netContentsStatement: toText(snapshot?.netContentsStatement),
        sulfiteDeclaration: toText(snapshot?.sulfiteDeclaration),
        healthWarningIncluded:
          snapshot?.healthWarningIncluded === true
            ? true
            : snapshot?.healthWarningIncluded === false
              ? false
              : undefined,
        interstateSale:
          snapshot?.interstateSale === true ? true : snapshot?.interstateSale === false ? false : undefined,
        formulaRequired:
          snapshot?.formulaRequired === true ? true : snapshot?.formulaRequired === false ? false : undefined,
        fdaLabelReviewComplete:
          snapshot?.fdaLabelReviewComplete === true
            ? true
            : snapshot?.fdaLabelReviewComplete === false
              ? false
              : undefined,
        ingredientStatementReviewed:
          snapshot?.ingredientStatementReviewed === true
            ? true
            : snapshot?.ingredientStatementReviewed === false
              ? false
              : undefined,
        allergenReviewComplete:
          snapshot?.allergenReviewComplete === true
            ? true
            : snapshot?.allergenReviewComplete === false
              ? false
              : undefined,
        hardCiderQualified:
          snapshot?.hardCiderQualified === true
            ? true
            : snapshot?.hardCiderQualified === false
              ? false
              : undefined,
      });
      return {
        lot,
        snapshot,
        readiness,
      };
    });

  const complianceReadyLots = complianceLots.filter((entry) =>
    entry.readiness.items.filter((item) => item.required).every((item) => item.ok)
  ).length;

  const complianceMissingCola = complianceLots.filter((entry) => {
    const abv = toFiniteNumber(entry.snapshot?.abvPct) ?? batchById.get(entry.lot.batchId)?.actualResults?.abvPct;
    return Number(abv ?? 0) >= 7 && entry.snapshot?.interstateSale === true && !toText(entry.snapshot?.colaReference);
  }).length;
  const complianceMissingFormula = complianceLots.filter(
    (entry) => entry.snapshot?.formulaRequired === true && !toText(entry.snapshot?.formulaReference)
  ).length;
  const complianceMissingFdaReview = complianceLots.filter((entry) => {
    const abv = toFiniteNumber(entry.snapshot?.abvPct) ?? batchById.get(entry.lot.batchId)?.actualResults?.abvPct;
    const beverageClass =
      toText(entry.snapshot?.beverageClass) ?? batchById.get(entry.lot.batchId)?.productSnapshot?.beverageClass;
    return (
      (beverageClass === 'cider' || beverageClass === 'wine') &&
      Number(abv ?? 0) > 0 &&
      Number(abv ?? 0) < 7 &&
      entry.snapshot?.fdaLabelReviewComplete !== true
    );
  }).length;

  const totalRemovalsGallons = sum(shippedRecords.map((record) => record.quantityGallons));

  const ttbOperations: RegulatoryReport = {
    id: 'ttb_operations',
    tab: 'federal',
    agency: 'TTB Form 5120.17',
    frequency: 'Monthly / quarterly / annual',
    title: 'TTB Operations Summary',
    description: 'Production, usage, packaging, losses, and bulk position for the selected reporting window.',
    note:
      'This OS view is a support schedule for TTB reporting. Produced, transfer, packaging, loss, and removal values come from OS batch, transfer, packaging, and movement records. Beginning and ending bulk inventory are now derived from dated production and depletion events, while direct bulk edits outside the main run ledger still surface as readiness warnings.',
    summaryCards: [
      { label: 'Beginning bulk', value: formatGallons(beginningBulkGallons), detail: 'derived from dated production and depletion events' },
      { label: 'Produced', value: formatGallons(producedGallons), detail: `${completedBatches.length} completed source batches` },
      { label: 'Ending bulk', value: formatGallons(endingBulkGallons), detail: reconciliationDelta <= 0.1 ? 'reconciled for this period' : `delta ${formatGallons(reconciliationDelta)}` },
    ],
    readinessItems: [
      {
        label: 'Produced volume tied to completed batches',
        state: completedBatches.length > 0 ? 'ready' : 'warning',
        detail:
          completedBatches.length > 0
            ? `${completedBatches.length} completed batch records fall in range.`
            : 'No completed batches in range. Verify the selected period before filing.',
      },
      {
        label: 'Beginning / ending bulk inventory derived from event ledger',
        state: reconciliationDelta <= 0.1 ? 'ready' : 'warning',
        detail:
          reconciliationDelta <= 0.1
            ? 'Opening and closing bulk positions now derive from dated production, packaging, and loss events.'
            : `Event-derived period reconciliation is off by ${formatGallons(reconciliationDelta)} and needs review.`,
      },
      {
        label: 'Loss reasons captured',
        state:
          completedPackagingRuns.every((run) => run.lossQty <= 0 || Boolean(run.lossReasonCode)) &&
          completedTransferRuns.every((run) => run.lossQty <= 0 || Boolean(run.lossReasonCode))
            ? 'ready'
            : 'missing',
          detail: 'Packaging and transfer losses should always carry a reason before filing support is trusted.',
      },
      {
        label: 'Live bulk state matches event ledger',
        state: currentBulkLedgerDelta <= 0.1 ? 'ready' : 'warning',
        detail:
          currentBulkLedgerDelta <= 0.1
            ? 'Current batch availability matches the historical bulk ledger.'
            : `Current live bulk differs from the ledger by ${formatGallons(currentBulkLedgerDelta)}. This points to edits or flows outside the main run ledger.`,
      },
      {
        label: 'Manual bulk adjustments are explicitly logged',
        state: 'ready',
        detail:
          manualAdjustmentGallons !== 0
            ? `Manual bulk adjustments totaling ${formatGallons(manualAdjustmentGallons)} were folded into the event ledger for this period.`
            : 'No manual bulk quantity adjustments were recorded in this period.',
      },
      {
        label: 'Draft / flow depletion is captured',
        state: 'ready',
        detail:
          flowDepletionGallons > 0
            ? `Flow pours reduced bulk position by ${formatGallons(flowDepletionGallons)} in this period.`
            : 'No flow-linked draft depletion was recorded in this period.',
      },
    ],
    columns: ['Metric', 'Value', 'Basis'],
    rows: [
      ['Beginning bulk inventory', formatGallons(beginningBulkGallons), 'all dated bulk entries before range start'],
      ['Produced volume', formatGallons(producedGallons), `${completedBatches.length} completed batches in period`],
      ['Derived branch transfers', formatGallons(derivedTransferInGallons), 'internal transfer-in to child batches, informational only'],
      ['Manual bulk adjustments', formatGallons(manualAdjustmentGallons), 'batch record quantity edits captured in audit trail'],
      ['Bottled / packaged', formatGallons(packagedGallons), `${completedPackagingRuns.length} completed packaging runs`],
      ['Draft / flow depletion', formatGallons(flowDepletionGallons), 'tap / pour activity linked back to source batches'],
      ['Packaging losses', formatGallons(packagingLossGallons), `${completedPackagingRuns.length} completed packaging runs`],
      ['Transfer losses', formatGallons(transferLossGallons), `${completedTransferRuns.length} completed transfer runs`],
      ['Ending bulk inventory', formatGallons(endingBulkGallons), 'all dated bulk entries through range end'],
      ['Reconciliation delta', formatGallons(reconciliationDelta), reconciliationDelta <= 0.1 ? 'balanced' : 'needs review'],
      ['Taxable removals support', formatGallons(totalRemovalsGallons), `${shippedRecords.length} ship movements`],
      ['Current live bulk on hand', formatGallons(currentBulkOnHandGallons), 'live OS batch availability today'],
    ],
    emptyText: 'No production records fall inside this range.',
    exportBaseName: 'ttb-operations-summary',
  };

  const ttbExcise: RegulatoryReport = {
    id: 'ttb_excise',
    tab: 'federal',
    agency: 'TTB Form 5000.24',
    frequency: 'Quarterly in most small-producer setups',
    title: 'TTB Taxable Removals Summary',
    description: 'Out-of-bond removals grouped into practical tax classes using OS ship/removal records.',
    note:
      'This schedule is built from OS ship movements and package-lot context. Hard cider classification is inferred from beverage class, ABV, and class designation text and should still be reviewed against carbonation, fruit, and formulation facts before filing.',
    summaryCards: [
      { label: 'Taxable removals', value: formatGallons(totalRemovalsGallons), detail: `${shippedRecords.length} ship rows` },
      { label: 'Hard cider candidate', value: formatGallons(sum(shippedRecords.filter((record) => record.taxClass === 'Hard cider candidate').map((record) => record.quantityGallons))), detail: 'review carbonation + fruit limits' },
      { label: 'Missing class review', value: String(shippedRecords.filter((record) => record.taxClass === 'Cider / wine class review' || record.taxClass === 'Other').length), detail: 'rows still needing operator review' },
    ],
    readinessItems: [
      {
        label: 'Removal entries separated from internal transfers',
        state: shippedRecords.length > 0 ? 'ready' : 'warning',
        detail: `${shippedRecords.length} ship movements are available for removal support.`,
      },
      {
        label: 'Beverage class carried onto removable lots',
        state: shippedRecords.every((record) => record.beverageClass && record.beverageClass !== 'other') ? 'ready' : 'warning',
        detail: 'Tax class grouping is only trustworthy when beverage class is carried through packaging.',
      },
      {
        label: 'ABV available for cider / wine tax class review',
        state: shippedRecords.every((record) => record.beverageClass === 'beer' || Number(record.abvPct ?? 0) > 0) ? 'ready' : 'missing',
        detail: 'ABV is needed to distinguish hard cider versus wine treatment.',
      },
    ],
    columns: ['Tax class', 'Removed', 'Rows', 'Basis'],
    rows: removalByTaxClass.map(([taxClass, totals]) => [
      taxClass,
      formatGallons(totals.gallons),
      String(totals.count),
      taxClass === 'Hard cider candidate'
        ? 'Explicit hard cider tax class or reviewed cider path'
        : taxClass === 'Sparkling wine'
          ? 'Explicit sparkling wine tax class selected'
        : 'Operator review recommended before filing',
    ]),
    emptyText: 'No taxable removals were recorded in this range.',
    exportBaseName: 'ttb-taxable-removals',
  };

  const colaFormula: RegulatoryReport = {
    id: 'cola_formula',
    tab: 'federal',
    agency: 'TTB label / formula visibility',
    frequency: 'Per packaged lot and SKU release',
    title: 'COLA / Formula Watch',
    description: 'Packaged products that need label or formula review before release or interstate sale.',
    note:
      'Under current TTB guidance, products at 7% ABV or more may need COLA review before interstate sale, while flavored or otherwise non-standard cider/wine products may need formula approval. OS should preserve those references at packaging time and make missing items obvious rather than silent.',
    summaryCards: [
      { label: 'Lots reviewed', value: String(complianceLots.length), detail: range.label },
      { label: 'Core records ready', value: String(complianceReadyLots), detail: 'core packaging fields are present' },
      { label: 'COLA review items', value: String(complianceMissingCola), detail: 'interstate 7%+ cider/wine lots needing COLA review' },
      { label: 'FDA review items', value: String(complianceMissingFdaReview), detail: 'under-7% cider/wine lots needing FDA label review' },
    ],
    readinessItems: [
      {
        label: 'Packaging lots preserve compliance snapshot',
        state: complianceLots.length > 0 ? 'ready' : 'warning',
        detail: `${complianceLots.length} package lots in range carry snapshot data for review.`,
      },
      {
        label: 'ABV present on packaged lots',
        state: complianceLots.every((entry) => Number(toFiniteNumber(entry.snapshot?.abvPct) ?? batchById.get(entry.lot.batchId)?.actualResults?.abvPct ?? 0) > 0) ? 'ready' : 'warning',
        detail: 'ABV drives both tax class and COLA awareness.',
      },
      {
        label: 'COLA / formula references captured where needed',
        state: complianceMissingCola === 0 && complianceMissingFormula === 0 ? 'ready' : 'warning',
        detail: `${complianceMissingCola} lots need COLA review and ${complianceMissingFormula} lots need formula review where flagged.`,
      },
      {
        label: 'Under-7% FDA review captured where needed',
        state: complianceMissingFdaReview === 0 ? 'ready' : 'warning',
        detail: `${complianceMissingFdaReview} under-7% cider/wine lots still need FDA label review in OS.`,
      },
    ],
    columns: ['Lot / SKU', 'Beverage', 'ABV', 'Path', 'COLA', 'Formula', 'Watch'],
    rows: complianceLots
      .slice()
      .sort((left, right) => {
        const leftStamp = Date.parse(left.lot.updatedAt ?? left.lot.createdAt) || 0;
        const rightStamp = Date.parse(right.lot.updatedAt ?? right.lot.createdAt) || 0;
        return rightStamp - leftStamp;
      })
      .map((entry) => {
        const snapshot = entry.snapshot;
        const abv = toFiniteNumber(snapshot?.abvPct) ?? batchById.get(entry.lot.batchId)?.actualResults?.abvPct;
        const beverageClass =
          toText(snapshot?.beverageClass) ?? batchById.get(entry.lot.batchId)?.productSnapshot?.beverageClass ?? '--';
        const colaReference = toText(snapshot?.colaReference) ?? '--';
        const formulaReference = toText(snapshot?.formulaReference) ?? '--';
        const path =
          Number(abv ?? 0) > 0 && Number(abv ?? 0) < 7 && (beverageClass === 'cider' || beverageClass === 'wine')
            ? 'FDA'
            : snapshot?.interstateSale === true
              ? 'Interstate'
              : 'Intrastate';
        const watch =
          Number(abv ?? 0) >= 7 && snapshot?.interstateSale === true && colaReference === '--'
            ? 'Review COLA before interstate sale'
            : snapshot?.formulaRequired === true && formulaReference === '--'
              ? 'Formula reference missing'
              : Number(abv ?? 0) > 0 &&
                  Number(abv ?? 0) < 7 &&
                  (beverageClass === 'cider' || beverageClass === 'wine') &&
                  snapshot?.fdaLabelReviewComplete !== true
                ? 'FDA label review missing'
            : formulaReference !== '--'
              ? 'Formula linked'
            : Number(abv ?? 0) < 7
                ? 'FDA / Part 24 path'
                : 'Snapshot reviewed';
        return [
          `${entry.lot.packageLotCode ?? entry.lot.lotCode} • ${entry.lot.packageSkuId ?? entry.lot.skuId ?? '--'}`,
          beverageClass,
          Number.isFinite(Number(abv)) ? `${Number(abv).toFixed(2)}%` : '--',
          path,
          colaReference,
          formulaReference,
          watch,
        ];
      }),
    emptyText: 'No packaged lots were updated in this range.',
    exportBaseName: 'cola-formula-watch',
  };

  const caAbc: RegulatoryReport = {
    id: 'ca_abc',
    tab: 'california',
    agency: 'California ABC Winegrowers / Blenders Report',
    frequency: 'Annual',
    title: 'California ABC Annual Production',
    description: 'Produced gallonage support for the annual California winegrower / blender report.',
    note:
      'California ABC says the winegrower report should match the produced gallonage reported on TTB Form 5120.17 line 2. In OS, this support schedule uses completed batch production quantities in the selected period and should be reviewed against your exact license scope before submission.',
    summaryCards: [
      { label: 'Produced', value: formatGallons(producedGallons), detail: `${completedBatches.length} completed batches` },
      { label: 'Matches TTB basis', value: producedGallons > 0 ? 'Yes' : 'Review', detail: 'same production pool as TTB operations support' },
      { label: 'Annual filing fit', value: range.label, detail: 'use annual or fiscal-year-aligned range for filing support' },
    ],
    readinessItems: [
      {
        label: 'Completed production records available',
        state: completedBatches.length > 0 ? 'ready' : 'warning',
        detail: 'ABC annual gallonage should map to completed production in OS.',
      },
      {
        label: 'Range aligned to annual reporting window',
        state: range.label === 'Last 12 Months' || range.from.getFullYear() !== range.to.getFullYear() ? 'warning' : 'ready',
        detail: 'For filing, set the range to the correct annual or fiscal-year window before export.',
      },
    ],
    columns: ['Metric', 'Value', 'Basis'],
    rows: [
      ['Produced gallonage', formatGallons(producedGallons), `${completedBatches.length} completed batches`],
      ['TTB line 2 alignment', producedGallons > 0 ? 'Review ready' : 'No data', 'same completed-batch production pool'],
    ],
    emptyText: 'No annual production support was found in this range.',
    exportBaseName: 'california-abc-annual-production',
  };

  const caCdtfa: RegulatoryReport = {
    id: 'ca_cdtfa',
    tab: 'california',
    agency: 'California CDTFA Alcohol Beverage Tax',
    frequency: 'Monthly',
    title: 'California CDTFA Taxable Removals',
    description: 'California taxable removals grouped by beverage category using OS ship/removal records.',
    note:
      'This state schedule is removal-based, not production-based. OS groups ship/removal activity by beverage class for filing support. Revenue-based California sales tax still belongs in OPS and is not computed from OS production data.',
    summaryCards: [
      { label: 'Taxable removals', value: formatGallons(totalRemovalsGallons), detail: `${shippedRecords.length} ship movements` },
      { label: 'Cider', value: formatGallons(sum(shippedRecords.filter((record) => record.beverageClass === 'cider').map((record) => record.quantityGallons))), detail: 'state cider grouping support' },
      { label: 'Wine / beer', value: formatGallons(sum(shippedRecords.filter((record) => record.beverageClass === 'wine' || record.beverageClass === 'beer').map((record) => record.quantityGallons))), detail: 'state wine + beer grouping support' },
    ],
    readinessItems: [
      {
        label: 'Removal volume sourced from ship movements',
        state: shippedRecords.length > 0 ? 'ready' : 'warning',
        detail: `${shippedRecords.length} ship movements support the taxable-removal schedule.`,
      },
      {
        label: 'Beverage category present on removable lots',
        state: shippedRecords.every((record) => Boolean(record.beverageClass) && record.beverageClass !== 'other') ? 'ready' : 'warning',
        detail: 'State grouping works best when beverage class is explicit on each lot or SKU.',
      },
      {
        label: 'Revenue sales tax handoff kept in OPS',
        state: 'ready',
        detail: 'OS should not attempt to compute revenue-based California sales tax.',
      },
    ],
    columns: ['Category', 'Removed', 'Rows', 'Basis'],
    rows: removalByCaliforniaClass.map(([category, totals]) => [
      category,
      formatGallons(totals.gallons),
      String(totals.count),
      'OS ship / removal support',
    ]),
    emptyText: 'No California taxable removals were recorded in this range.',
    exportBaseName: 'california-cdtfa-taxable-removals',
  };

  const caCrvCoveredLots = params.lots.filter((lot) => {
    if (!isWithinRange(lot.updatedAt ?? lot.createdAt, range.from, range.to)) return false;
    return lot.packageType === 'can' || lot.packageType === 'bottle';
  });

  const caCrv: RegulatoryReport = {
    id: 'ca_crv',
    tab: 'california',
    agency: 'California CalRecycle CRV / container reporting',
    frequency: 'Monthly for many participants',
    title: 'California CRV / Container Readiness',
    description: 'Container reporting readiness for California beverage-container obligations that now touch wine and spirits packaging.',
    note:
      'CalRecycle now covers additional wine and spirits beverage containers, and reporting/payment deadlines differ for manufacturers and distributors. OS can identify package format activity, but it does not yet track package material, CRV labeling status, or distributor/manufacturer role by filing entity. Those should be added deliberately rather than guessed.',
    summaryCards: [
      { label: 'Covered lots', value: String(caCrvCoveredLots.length), detail: 'can and bottle lots in range' },
      { label: 'Material tracked', value: 'No', detail: 'glass / aluminum / plastic is not yet first-class in OS lots' },
      { label: 'CRV label status', value: 'No', detail: 'not yet stored on package lots or SKUs' },
    ],
    readinessItems: [
      {
        label: 'CRV-relevant package types identified',
        state: caCrvCoveredLots.length > 0 ? 'ready' : 'warning',
        detail: `${caCrvCoveredLots.length} can/bottle package lots appear in the selected range.`,
      },
      {
        label: 'Container material tracked per lot',
        state: 'missing',
        detail: 'CRV calculations depend on material and container thresholds; this is not yet stored in OS.',
      },
      {
        label: 'CRV labeling and filing role tracked',
        state: 'missing',
        detail: 'OS should store CRV labeling review plus manufacturer/distributor filing role before this schedule can be trusted.',
      },
    ],
    columns: ['Readiness area', 'Status', 'Detail'],
    rows: [
      ['Covered package activity', caCrvCoveredLots.length > 0 ? 'ready' : 'warning', `${caCrvCoveredLots.length} can/bottle lots in range`],
      ['Material by lot', 'missing', 'Need glass / aluminum / plastic / pouch at the lot or format level'],
      ['CRV label review', 'missing', 'Need explicit CRV label compliance status on packaged SKU or lot'],
      ['Manufacturer / distributor role', 'missing', 'Need filing-role mapping to avoid reporting the wrong party'],
    ],
    emptyText: 'No CRV-covered package activity is visible in this range.',
    exportBaseName: 'california-crv-readiness',
  };

  const skuCompliance: RegulatoryReport = {
    id: 'sku_compliance',
    tab: 'products',
    agency: 'OS package-lot compliance snapshot',
    frequency: 'Continuous',
    title: 'SKU Compliance Snapshot',
    description: 'Lot-level compliance readiness for label, tax class, and release review.',
    note:
      'This view is where OS should feel most operational: every packaged lot should carry enough compliance detail to support classification, label review, and later reporting. Missing data is shown directly so the operator can fix the source record instead of guessing during filing.',
    summaryCards: [
      { label: 'Lots reviewed', value: String(complianceLots.length), detail: range.label },
      { label: 'Core records ready', value: String(complianceReadyLots), detail: 'core snapshot checks are present' },
      { label: 'Lots needing follow-up', value: String(Math.max(0, complianceLots.length - complianceReadyLots)), detail: 'packaged lots still needing operator review' },
    ],
    readinessItems: [
      {
        label: 'Required compliance snapshot fields preserved at packaging',
        state: complianceLots.length > 0 ? 'ready' : 'warning',
        detail: `${complianceLots.length} lots in range carry a compliance snapshot for review.`,
      },
      {
        label: 'Net contents statement stored',
        state: complianceLots.every((entry) => Boolean(toText(entry.snapshot?.netContentsStatement))) ? 'ready' : 'warning',
        detail: 'Net contents is required for label/compliance support and should not be left blank.',
      },
      {
        label: 'Health warning / sulfite review explicit',
        state: complianceLots.every((entry) => entry.readiness.items.find((item) => item.key === 'healthWarning')?.ok !== false) ? 'ready' : 'warning',
        detail: 'Review flags should be explicit instead of inferred later.',
      },
    ],
    columns: ['Lot / SKU', 'Product', 'Beverage', 'ABV', 'Net contents', 'Snapshot'],
    rows: complianceLots
      .slice()
      .sort((left, right) => {
        const leftStamp = Date.parse(left.lot.updatedAt ?? left.lot.createdAt) || 0;
        const rightStamp = Date.parse(right.lot.updatedAt ?? right.lot.createdAt) || 0;
        return rightStamp - leftStamp;
      })
      .map((entry) => {
        const snapshot = entry.snapshot;
        const requiredReady = entry.readiness.items.filter((item) => item.required).every((item) => item.ok);
        return [
          `${entry.lot.packageLotCode ?? entry.lot.lotCode} • ${entry.lot.packageSkuId ?? entry.lot.skuId ?? '--'}`,
          resolveLotProductName(entry.lot, batchById),
          toText(snapshot?.beverageClass) ?? batchById.get(entry.lot.batchId)?.productSnapshot?.beverageClass ?? '--',
          Number.isFinite(Number(toFiniteNumber(snapshot?.abvPct) ?? batchById.get(entry.lot.batchId)?.actualResults?.abvPct))
            ? `${Number(toFiniteNumber(snapshot?.abvPct) ?? batchById.get(entry.lot.batchId)?.actualResults?.abvPct).toFixed(2)}%`
            : '--',
          toText(snapshot?.netContentsStatement) ?? '--',
          requiredReady ? 'ready' : 'review',
        ];
      }),
    emptyText: 'No packaged-lot compliance snapshots were found in this range.',
    exportBaseName: 'sku-compliance-snapshot',
  };

  return [ttbOperations, ttbExcise, colaFormula, caAbc, caCdtfa, caCrv, skuCompliance];
};

const reportTabs: Array<{ id: ReportingTab; title: string; description: string }> = [
  {
    id: 'federal',
    title: 'Federal',
    description: 'TTB operations, taxable removals, and label/formula watch.',
  },
  {
    id: 'california',
    title: 'California',
    description: 'ABC annual, CDTFA taxable removals, and CRV readiness.',
  },
  {
    id: 'products',
    title: 'SKU Compliance',
    description: 'Lot-level compliance snapshots and release support.',
  },
];

const artifactTypeForReport = (report: RegulatoryReport): ArtifactReportType => {
  if (report.id === 'ttb_operations' || report.id === 'ca_abc') return 'production';
  if (report.id === 'ttb_excise' || report.id === 'ca_cdtfa' || report.id === 'ca_crv') return 'movements';
  if (report.id === 'cola_formula' || report.id === 'sku_compliance') return 'compliance';
  return 'production';
};

export default function ReportsPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [activeTab, setActiveTab] = useState<ReportingTab>('federal');
  const [preset, setPreset] = useState<RangePreset>('month');
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(subtractMonths(new Date(), 1)));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(currentDate.getMonth() / 3) + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [lots, setLots] = useState<PackageLotRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemRecord[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRecord[]>([]);
  const [packagingRuns, setPackagingRuns] = useState<PackagingRunRecord[]>([]);
  const [transferRuns, setTransferRuns] = useState<TransferRunRecord[]>([]);
  const [complianceFeed, setComplianceFeed] = useState<ComplianceFeedRecord | null>(null);
  const [artifacts, setArtifacts] = useState<ReportArtifactRecord[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<ReportId | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSnapshotId, setSavingSnapshotId] = useState<ReportId | null>(null);
  const [statusText, setStatusText] = useState('Loading reporting workspace...');
  const [siteName, setSiteName] = useState('Main Production Site');

  const yearOptions = useMemo(
    () => Array.from({ length: 8 }, (_, index) => currentYear - 5 + index),
    [currentYear]
  );
  const range = useMemo(
    () => buildRange(preset, customFrom, customTo, selectedMonth, selectedQuarter, selectedYear),
    [customFrom, customTo, preset, selectedMonth, selectedQuarter, selectedYear]
  );

  const loadArtifacts = useCallback(async () => {
    const response = await window.fetch('/api/os/reports/artifacts');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load saved report snapshots.');
    }
    setArtifacts((payload.data ?? []) as ReportArtifactRecord[]);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        limit: '5000',
      });

      const [batchResponse, lotResponse, inventoryResponse, movementResponse, packagingResponse, transferResponse, complianceResponse, settingsResponse, artifactResponse] =
        await Promise.all([
          window.fetch('/api/os/batches'),
          window.fetch('/api/os/package-lots'),
          window.fetch('/api/os/inventory'),
          window.fetch('/api/os/inventory/movements'),
          window.fetch('/api/os/packaging/runs'),
          window.fetch('/api/os/transfers'),
          window.fetch(`/api/os/compliance/feed?${params.toString()}`),
          window.fetch('/api/os/settings'),
          window.fetch('/api/os/reports/artifacts'),
        ]);

      const batchPayload = await batchResponse.json().catch(() => null);
      const lotPayload = await lotResponse.json().catch(() => null);
      const inventoryPayload = await inventoryResponse.json().catch(() => null);
      const movementPayload = await movementResponse.json().catch(() => null);
      const packagingPayload = await packagingResponse.json().catch(() => null);
      const transferPayload = await transferResponse.json().catch(() => null);
      const compliancePayload = await complianceResponse.json().catch(() => null);
      const settingsPayload = await settingsResponse.json().catch(() => null);
      const artifactPayload = await artifactResponse.json().catch(() => null);

      if (!batchResponse.ok || !batchPayload?.success) throw new Error(batchPayload?.error ?? 'Failed to load batches.');
      if (!lotResponse.ok || !lotPayload?.success) throw new Error(lotPayload?.error ?? 'Failed to load package lots.');
      if (!inventoryResponse.ok || !inventoryPayload?.success) throw new Error(inventoryPayload?.error ?? 'Failed to load inventory.');
      if (!movementResponse.ok || !movementPayload?.success) throw new Error(movementPayload?.error ?? 'Failed to load inventory movements.');
      if (!packagingResponse.ok || !packagingPayload?.success) throw new Error(packagingPayload?.error ?? 'Failed to load packaging runs.');
      if (!transferResponse.ok || !transferPayload?.success) throw new Error(transferPayload?.error ?? 'Failed to load transfer runs.');
      if (!complianceResponse.ok || !compliancePayload?.summary) throw new Error(compliancePayload?.error ?? 'Failed to load compliance feed.');
      if (!settingsResponse.ok || !settingsPayload?.success) throw new Error(settingsPayload?.error ?? 'Failed to load settings.');
      if (!artifactResponse.ok || !artifactPayload?.success) throw new Error(artifactPayload?.error ?? 'Failed to load report artifacts.');

      setBatches((batchPayload.data?.batches ?? []) as BatchRecord[]);
      setLots((lotPayload.data ?? []) as PackageLotRecord[]);
      setInventoryItems((inventoryPayload.data?.items ?? []) as InventoryItemRecord[]);
      setMovements((movementPayload.data ?? []) as InventoryMovementRecord[]);
      setPackagingRuns((packagingPayload.data ?? []) as PackagingRunRecord[]);
      setTransferRuns((transferPayload.data ?? []) as TransferRunRecord[]);
      setComplianceFeed(compliancePayload as ComplianceFeedRecord);
      setArtifacts((artifactPayload.data ?? []) as ReportArtifactRecord[]);
      setSiteName(String(settingsPayload.data?.siteName ?? 'Main Production Site'));
      setStatusText('Reporting workspace is ready.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to load reporting workspace.');
      setComplianceFeed(null);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const reports = useMemo(
    () =>
      buildReports({
        range,
        batches,
        lots,
        inventoryItems,
        movements,
        packagingRuns,
        transferRuns,
        complianceFeed,
      }),
    [range, batches, lots, inventoryItems, movements, packagingRuns, transferRuns, complianceFeed]
  );

  const reportsById = useMemo(() => new Map(reports.map((report) => [report.id, report] as const)), [reports]);
  const selectedReport = selectedReportId ? reportsById.get(selectedReportId) ?? null : null;
  const activeReports = useMemo(
    () => reports.filter((report) => report.tab === activeTab),
    [activeTab, reports]
  );
  const activeReviewCount = useMemo(
    () =>
      activeReports.reduce(
        (total, report) => total + report.readinessItems.filter((item) => item.state !== 'ready').length,
        0
      ),
    [activeReports]
  );
  const activeRowCount = useMemo(
    () => activeReports.reduce((total, report) => total + report.rows.length, 0),
    [activeReports]
  );
  const lotsInWindow = useMemo(
    () => lots.filter((lot) => isWithinRange(lot.updatedAt ?? lot.createdAt, range.from, range.to)).length,
    [lots, range.from, range.to]
  );
  const shipRowsInWindow = useMemo(
    () => movements.filter((movement) => movement.type === 'ship' && isWithinRange(movement.createdAt, range.from, range.to)).length,
    [movements, range.from, range.to]
  );
  const artifactsInWindow = useMemo(
    () =>
      artifacts.filter(
        (artifact) => artifact.range.from === range.from.toISOString() && artifact.range.to === range.to.toISOString()
      ),
    [artifacts, range.from, range.to]
  );
  const recentArtifacts = useMemo(() => artifacts.slice(0, 6), [artifacts]);
  const latestArtifact = recentArtifacts[0] ?? null;

  const exportCsv = useCallback((report: RegulatoryReport) => {
    const blob = new Blob([buildCsvContent(report)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.exportBaseName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusText(`Downloaded ${report.title} as CSV.`);
  }, []);

  const printReport = useCallback((report: RegulatoryReport, autoPrint: boolean) => {
    const html = buildPrintHtml(report, range.label, autoPrint, siteName);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const printUrl = URL.createObjectURL(blob);
    const popup = window.open(printUrl, '_blank', 'popup=yes,width=1100,height=820');
    if (!popup) {
      URL.revokeObjectURL(printUrl);
      setStatusText('Unable to open the report window. Please allow pop-ups for BevForge.');
      return;
    }
    window.setTimeout(() => URL.revokeObjectURL(printUrl), 60_000);
    setStatusText(autoPrint ? `Opened ${report.title} for printing.` : `Opened ${report.title} in a print-ready window.`);
  }, [range.label, siteName]);

  const openArtifact = useCallback((artifact: ReportArtifactRecord, autoPrint: boolean) => {
    const url = `/api/os/reports/artifacts/${encodeURIComponent(artifact.id)}${autoPrint ? '?autoprint=1' : ''}`;
    const popup = window.open(url, '_blank', 'popup=yes,width=1100,height=820');
    if (!popup) {
      setStatusText('Unable to open the archived report window. Please allow pop-ups for BevForge.');
      return;
    }
    setStatusText(
      autoPrint
        ? `Opened archived snapshot ${artifact.reportTitle ?? artifact.fileName} for printing.`
        : `Opened archived snapshot ${artifact.reportTitle ?? artifact.fileName}.`
    );
  }, []);

  const saveReportSnapshot = useCallback(async (report: RegulatoryReport) => {
    setSavingSnapshotId(report.id);
    try {
      const response = await window.fetch('/api/os/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: artifactTypeForReport(report),
          reportId: report.id,
          reportTitle: report.title,
          format: 'html',
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          fileName: `${report.exportBaseName}-${range.label}`,
          content: buildPrintHtml(report, range.label, false, siteName),
          contentType: 'text/html; charset=utf-8',
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save report snapshot.');
      }
      await loadArtifacts();
      setStatusText(`Saved ${report.title} snapshot for ${range.label}.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to save report snapshot.');
    } finally {
      setSavingSnapshotId(null);
    }
  }, [loadArtifacts, range.label, range.from, range.to, siteName]);

  return (
    <AppShell currentSuite="os" pageTitle="Reports">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              Reporting support schedules for TTB and California work, with review items surfaced early so the operator can steer the right filing path without OS becoming the enforcer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{loading ? 'Loading…' : 'Ready'}</Badge>
            <Badge variant="secondary">{range.label}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={tileClass}>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Active Schedules</div>
            <div className="mt-2 text-3xl font-semibold">{activeReports.length}</div>
            <div className="mt-1 text-sm text-white/65">report views in the current tab</div>
          </div>
          <div className={tileClass}>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Needs Review</div>
            <div className="mt-2 text-3xl font-semibold">{activeReviewCount}</div>
            <div className="mt-1 text-sm text-white/65">non-ready checks in this tab</div>
          </div>
          <div className={tileClass}>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Packaged Lots</div>
            <div className="mt-2 text-3xl font-semibold">{lotsInWindow}</div>
            <div className="mt-1 text-sm text-white/65">lots touched in the current window</div>
          </div>
          <div className={tileClass}>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Saved Snapshots</div>
            <div className="mt-2 text-3xl font-semibold">{artifactsInWindow.length}</div>
            <div className="mt-1 text-sm text-white/65">
              {latestArtifact ? `last saved ${formatDate(latestArtifact.createdAt)}` : 'none saved in this window'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <Card className={surfaceClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-cyan-300" />
                Filing Window
              </CardTitle>
              <CardDescription>
                Set one reporting window for the full workspace, then open the schedule you need from the board below.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="report-range">Range preset</Label>
              <Select value={preset} onValueChange={(value) => setPreset(value as RangePreset)}>
                <SelectTrigger id="report-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Last month</SelectItem>
                  <SelectItem value="quarter">Last quarter</SelectItem>
                  <SelectItem value="year">Last 12 months</SelectItem>
                  <SelectItem value="specific_month">Specific month</SelectItem>
                  <SelectItem value="specific_quarter">Specific quarter</SelectItem>
                  <SelectItem value="specific_year">Specific year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preset === 'specific_month' ? (
              <>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {monthLabel(index)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Window</Label>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                    {formatDate(range.from.toISOString())} through {formatDate(range.to.toISOString())}
                  </div>
                </div>
              </>
            ) : preset === 'specific_quarter' ? (
              <>
                <div className="space-y-2">
                  <Label>Quarter</Label>
                  <Select value={String(selectedQuarter)} onValueChange={(value) => setSelectedQuarter(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((quarter) => (
                        <SelectItem key={quarter} value={String(quarter)}>
                          {`Q${quarter}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Window</Label>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                    {formatDate(range.from.toISOString())} through {formatDate(range.to.toISOString())}
                  </div>
                </div>
              </>
            ) : preset === 'specific_year' ? (
              <>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Window</Label>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                    {formatDate(range.from.toISOString())} through {formatDate(range.to.toISOString())}
                  </div>
                </div>
              </>
            ) : preset === 'custom' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="report-from">From</Label>
                  <Input
                    id="report-from"
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-to">To</Label>
                  <Input
                    id="report-to"
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2 lg:col-span-3">
                <Label>Window</Label>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                  {formatDate(range.from.toISOString())} through {formatDate(range.to.toISOString())}
                </div>
              </div>
            )}
            </CardContent>
          </Card>

          <Card className={surfaceClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-cyan-300" />
                Snapshot Archive
              </CardTitle>
              <CardDescription>
                Saved HTML snapshots live on disk for audit comfort and can be reopened or printed later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-white/45">This Window</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{artifactsInWindow.length}</div>
                  <div className="text-xs text-white/55">saved report packets</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-white/45">Support Rows</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{activeRowCount}</div>
                  <div className="text-xs text-white/55">{shipRowsInWindow} removal rows in range</div>
                </div>
              </div>
              {recentArtifacts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/60">
                  No saved report snapshots yet. Use Save Snapshot on any schedule you want to keep.
                </div>
              ) : (
                recentArtifacts.map((artifact) => (
                  <div key={artifact.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {artifact.reportTitle ?? artifact.fileName}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          {artifact.range.label} • saved {formatDateTime(artifact.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{artifact.format.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => openArtifact(artifact, false)}>
                        Open
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openArtifact(artifact, true)}>
                        Print
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportingTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            {reportTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <Card className={surfaceClass}>
                <CardHeader>
                  <CardTitle className="text-white">{tab.title}</CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {reports
                  .filter((report) => report.tab === tab.id)
                  .map((report) => (
                    <Card key={report.id} className={surfaceClass}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {report.tab === 'products' ? (
                                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                              ) : report.tab === 'california' ? (
                                <Warehouse className="h-5 w-5 text-cyan-300" />
                              ) : (
                                <ScrollText className="h-5 w-5 text-cyan-300" />
                              )}
                              {report.title}
                            </CardTitle>
                            <CardDescription className="mt-2">{report.description}</CardDescription>
                          </div>
                          <div className="space-y-2 text-right">
                            <Badge variant="outline">{report.agency}</Badge>
                            <div className="text-xs text-white/55">{report.frequency}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {report.summaryCards.map((card) => (
                            <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                              <div className="text-xs uppercase tracking-wide text-white/45">{card.label}</div>
                              <div className="mt-1 text-xl font-semibold text-white">{card.value}</div>
                              <div className="text-xs text-white/55">{card.detail ?? ''}</div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          {report.readinessItems.slice(0, 3).map((item) => {
                            const Icon = readinessIcon(item.state);
                            return (
                              <div key={item.label} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <Icon
                                    className={cn(
                                      'mt-0.5 h-4 w-4 shrink-0',
                                      item.state === 'ready'
                                        ? 'text-emerald-300'
                                        : item.state === 'warning'
                                          ? 'text-amber-300'
                                          : 'text-rose-300'
                                    )}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-white">{item.label}</div>
                                    <div className="text-xs text-white/60">{item.detail}</div>
                                  </div>
                                </div>
                                <Badge variant={readinessVariant(item.state)}>{readinessLabel(item.state)}</Badge>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => setSelectedReportId(report.id)}>Open Schedule</Button>
                          <Button
                            variant="outline"
                            onClick={() => void saveReportSnapshot(report)}
                            disabled={savingSnapshotId === report.id}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {savingSnapshotId === report.id ? 'Saving…' : 'Save Snapshot'}
                          </Button>
                          <Button variant="outline" onClick={() => exportCsv(report)}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            CSV
                          </Button>
                          <Button variant="outline" onClick={() => printReport(report, true)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className={surfaceClass}>
          <CardContent className="px-4 py-3 text-sm text-white/70">{statusText}</CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedReport)} onOpenChange={(open) => (!open ? setSelectedReportId(null) : null)}>
        <DialogContent className="max-h-[85vh] max-w-6xl overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white">
          {selectedReport ? (
            <div className="flex max-h-[80vh] flex-col">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedReport.title}</DialogTitle>
                <DialogDescription>
                  {selectedReport.agency} • {selectedReport.frequency}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 flex-1 overflow-y-auto pr-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {selectedReport.summaryCards.map((card) => (
                      <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-white/45">{card.label}</div>
                        <div className="mt-1 text-2xl font-semibold text-white">{card.value}</div>
                        <div className="text-xs text-white/55">{card.detail ?? ''}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />
                      Review Status
                    </div>
                    <div className="space-y-2">
                      {selectedReport.readinessItems.map((item) => {
                        const Icon = readinessIcon(item.state);
                        return (
                          <div key={item.label} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <Icon
                                className={cn(
                                  'mt-0.5 h-4 w-4 shrink-0',
                                  item.state === 'ready'
                                    ? 'text-emerald-300'
                                    : item.state === 'warning'
                                      ? 'text-amber-300'
                                      : 'text-rose-300'
                                )}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white">{item.label}</div>
                                <div className="text-xs text-white/60">{item.detail}</div>
                              </div>
                            </div>
                            <Badge variant={readinessVariant(item.state)}>{readinessLabel(item.state)}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                      <ScrollText className="h-4 w-4 text-cyan-300" />
                      Support Schedule
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10 text-sm">
                        <thead>
                          <tr className="text-left">
                            {selectedReport.columns.map((column) => (
                              <th key={column} className="px-3 py-2 text-xs uppercase tracking-wide text-white/45">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {selectedReport.rows.length > 0 ? (
                            selectedReport.rows.map((row, index) => (
                              <tr key={`${selectedReport.id}-${index}`}>
                                {row.map((cell, cellIndex) => (
                                  <td key={`${selectedReport.id}-${index}-${cellIndex}`} className="px-3 py-3 align-top text-foreground/90">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={selectedReport.columns.length} className="px-3 py-6 text-center text-white/60">
                                {selectedReport.emptyText}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4 text-sm text-white/70">
                    {selectedReport.note}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <Button onClick={() => exportCsv(selectedReport)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void saveReportSnapshot(selectedReport)}
                  disabled={savingSnapshotId === selectedReport.id}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {savingSnapshotId === selectedReport.id ? 'Saving…' : 'Save Snapshot'}
                </Button>
                <Button variant="outline" onClick={() => printReport(selectedReport, false)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Open Print View
                </Button>
                <Button variant="outline" onClick={() => printReport(selectedReport, true)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
