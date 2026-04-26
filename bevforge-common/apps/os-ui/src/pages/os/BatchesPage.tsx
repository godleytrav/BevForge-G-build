import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import ProductIdentityFields from '@/components/products/ProductIdentityFields';
import type { BatchProductSnapshot, ProductIdentityDraft } from '@/features/products/types';
import { selectProductImage } from '@/features/products/types';
import { getBatchOperationalReadiness } from '@/lib/production-readiness';
import {
  convertTemperatureFromC,
  convertTemperatureToC,
  formatTemperatureValue,
  useOsDisplaySettings,
} from '@/lib/os-display';
import { formatVolumeNumber } from '@/lib/volume-format';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  FlaskConical,
  PackageCheck,
} from 'lucide-react';

interface UnitOption {
  value: string;
  label: string;
}

const VOLUME_UNIT_OPTIONS: UnitOption[] = [
  { value: 'bbl', label: 'barrels (bbl)' },
  { value: 'gal', label: 'gallons (gal)' },
  { value: 'L', label: 'liters (L)' },
  { value: 'mL', label: 'milliliters (mL)' },
];

const PROCESS_UNIT_OPTIONS: UnitOption[] = [
  { value: 'ppm', label: 'ppm' },
  { value: 'g/L', label: 'g/L' },
  { value: 'mg/L', label: 'mg/L' },
  ...VOLUME_UNIT_OPTIONS,
];

const normalizeVolumeUnit = (value: string | undefined): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'bbl' || normalized === 'bbls' || normalized === 'barrel' || normalized === 'barrels') {
    return 'bbl';
  }
  if (
    normalized === 'gal' ||
    normalized === 'gals' ||
    normalized === 'gallon' ||
    normalized === 'gallons' ||
    normalized === 'g'
  ) {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return 'bbl';
};

const normalizeProcessUnit = (value: string | undefined, fallback = 'ppm'): string => {
  const normalized = String(value ?? '').trim().toLowerCase().replaceAll(' ', '');
  if (normalized === 'ppm') return 'ppm';
  if (normalized === 'mg/l' || normalized === 'mgl') return 'mg/L';
  if (
    normalized === 'g/l' ||
    normalized === 'gl' ||
    normalized === 'g/lo' ||
    normalized === 'g/l0'
  ) {
    return 'g/L';
  }
  if (normalized === 'bbl' || normalized === 'bbls' || normalized === 'barrel' || normalized === 'barrels') {
    return 'bbl';
  }
  if (
    normalized === 'gal' ||
    normalized === 'gals' ||
    normalized === 'gallon' ||
    normalized === 'gallons' ||
    normalized === 'g'
  ) {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return fallback;
};

const getBoardStatusCue = (
  status: BatchStatus
): { label: string; className: string } => {
  if (status === 'planned') {
    return {
      label: 'scheduled',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    };
  }
  if (status === 'in_progress') {
    return {
      label: 'in progress',
      className: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    };
  }
  if (status === 'completed') {
    return {
      label: 'completed',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    };
  }
  return {
    label: status.replaceAll('_', ' '),
    className: 'border-muted bg-muted/40 text-foreground',
  };
};

const getReadinessTone = (item: { ok: boolean; required: boolean }) => {
  if (!item.ok && item.required) {
    return {
      cardClass: 'border-rose-500/25 bg-rose-500/8',
      statusClass: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
      dotClass: 'bg-rose-300',
      label: 'Missing',
    };
  }
  if (!item.ok && !item.required) {
    return {
      cardClass: 'border-amber-500/25 bg-amber-500/8',
      statusClass: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
      dotClass: 'bg-amber-300',
      label: 'Needs Review',
    };
  }
  return {
    cardClass: 'border-emerald-500/25 bg-emerald-500/8',
    statusClass: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    dotClass: 'bg-emerald-300',
    label: 'Ready',
  };
};

type BatchStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'released'
  | 'allocated'
  | 'shipped'
  | 'canceled';

type SweetnessLevel = 'bone_dry' | 'semi_dry' | 'semi_sweet' | 'sweet';

interface BatchRecord {
  id: string;
  skuId?: string;
  siteId: string;
  batchKind?: 'source' | 'derived';
  productionMode?: 'scheduled_runboard' | 'cellar';
  batchCode?: string;
  lotCode: string;
  recipeName: string;
  recipeRunId?: string;
  status: BatchStatus;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  plannedVesselLabel?: string;
  plannedVesselKind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
  intendedRecipe?: {
    targets?: {
      targetAbvPct?: number;
      targetResidualSugarPct?: number;
      targetResidualSugarGpl?: number;
      targetSweetnessLevel?: SweetnessLevel;
    };
  };
  actualResults?: {
    og?: number;
    fg?: number;
    sgLatest?: number;
    abvPct?: number;
    phLatest?: number;
    brixLatest?: number;
    titratableAcidityGplLatest?: number;
    so2PpmLatest?: number;
    residualSugarGplLatest?: number;
    estimatedResidualSugarGplLatest?: number;
    volatileAcidityGplLatest?: number;
    freeSo2PpmLatest?: number;
    totalSo2PpmLatest?: number;
    dissolvedOxygenPpmLatest?: number;
    temperatureCLatest?: number;
    finalLabAbvPct?: number;
    finalLabPh?: number;
    finalLabBrix?: number;
    finalLabResidualSugarGpl?: number;
    finalLabTitratableAcidityGpl?: number;
    finalLabFreeSo2Ppm?: number;
    finalLabTotalSo2Ppm?: number;
    finalLabDissolvedOxygenPpm?: number;
    finalLabRecordedAt?: string;
    finalLabRecordedBy?: string;
    finalVolumeQty?: number;
    finalVolumeUnit?: string;
  };
  readingLog?: Array<{
    id: string;
    timestamp: string;
    og?: number;
    fg?: number;
    sg?: number;
    temperatureC?: number;
    ph?: number;
    brix?: number;
    titratableAcidityGpl?: number;
    so2Ppm?: number;
    residualSugarGpl?: number;
    volatileAcidityGpl?: number;
    freeSo2Ppm?: number;
    totalSo2Ppm?: number;
    dissolvedOxygenPpm?: number;
    note?: string;
  }>;
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
  sourceInputs?: Array<{
    id: string;
    category: string;
    name: string;
    lotCode?: string;
    sourceName?: string;
    quantity?: number;
    unit?: string;
    brix?: number;
    note?: string;
  }>;
  treatmentLog?: Array<{
    id: string;
    timestamp: string;
    type: string;
    stage?: string;
    actor?: string;
    quantity?: number;
    unit?: string;
    lotCode?: string;
    note?: string;
    blendComponents?: Array<{
      batchId?: string;
      batchCode?: string;
      quantity?: number;
      unit?: string;
    }>;
  }>;
  volumeCheckpoints?: Array<{
    id: string;
    timestamp: string;
    stage: string;
    quantity: number;
    unit: string;
    note?: string;
    actor?: string;
  }>;
  sensoryQcRecords?: Array<{
    id: string;
    timestamp: string;
    stage?: string;
    visualNotes?: string;
    aromaNotes?: string;
    tasteNotes?: string;
    passFail?: string;
    approvalDecision?: string;
    actor?: string;
    note?: string;
  }>;
  stageTimeline?: Array<{
    id: string;
    timestamp: string;
    stage: string;
    actor?: string;
    note?: string;
  }>;
  productSnapshot?: BatchProductSnapshot;
}

interface TreatmentDraft {
  type: string;
  stage: string;
  quantity: string;
  unit: string;
  lotCode: string;
  actor: string;
  note: string;
  blendBatchCode: string;
  blendQuantity: string;
  blendUnit: string;
}

interface VolumeCheckpointDraft {
  stage: string;
  quantity: string;
  unit: string;
  actor: string;
  note: string;
}

interface SensoryQcDraft {
  stage: string;
  visualNotes: string;
  aromaNotes: string;
  tasteNotes: string;
  passFail: string;
  approvalDecision: string;
  actor: string;
  note: string;
}

interface StageTimelineDraft {
  stage: string;
  actor: string;
  note: string;
}

interface ReadingDraft {
  og: string;
  fg: string;
  sg: string;
  temperatureC: string;
  ph: string;
  brix: string;
  titratableAcidityGpl: string;
  so2Ppm: string;
  residualSugarGpl: string;
  volatileAcidityGpl: string;
  freeSo2Ppm: string;
  totalSo2Ppm: string;
  dissolvedOxygenPpm: string;
  note: string;
}

const createClientId = () =>
  globalThis.crypto?.randomUUID?.() ?? `batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type FulfillmentRequestType = 'production' | 'packaging';

type FulfillmentRequestStatus =
  | 'queued'
  | 'accepted'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'canceled'
  | 'rejected';

interface FulfillmentRequestRecord {
  id: string;
  requestId: string;
  sourceSuite: 'ops' | 'os' | 'lab' | 'flow' | 'connect';
  type: FulfillmentRequestType;
  status: FulfillmentRequestStatus;
  siteId: string;
  skuId: string;
  requestedQty: number;
  uom: string;
  orderId?: string;
  lineId?: string;
  linkedBatchIds: string[];
  linkedPackageLotIds: string[];
  events?: Array<{
    action?: string;
    note?: string;
    timestamp?: string;
  }>;
  updatedAt: string;
}

interface BatchLineage {
  batch: BatchRecord;
  childBatches: Array<{
    id: string;
    batchCode?: string;
    lotCode: string;
    recipeName: string;
    status: string;
    containerLabel?: string;
    containerKind?: string;
    productSnapshot?: BatchProductSnapshot;
  }>;
  packageLots: Array<{
    id: string;
    packageLotCode?: string;
    lotCode: string;
    batchCode?: string;
    skuId?: string;
    packageSkuId?: string;
    packageType: string;
    status: string;
    releaseStatus?: string;
    primaryAssetCode?: string;
    totalUnits: number;
    unitOfMeasure?: string;
  }>;
  reservations: Array<{
    reservationId: string;
    orderId: string;
    status: string;
    allocatedQty: number;
    shortQty: number;
  }>;
  reservationActions: Array<{
    actionId: string;
    action: string;
    status: string;
    occurredAt: string;
  }>;
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    unit: string;
    reason?: string;
    reasonCode?: string;
    actor?: string;
    packageLotId?: string;
    assetCode?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
  fulfillmentRequests: FulfillmentRequestRecord[];
}

type BatchBoardFilter = 'active' | 'history' | 'all';
type BatchStatusQuickFilter = 'all' | 'in_progress' | 'completed' | 'released';
type BatchDetailTab = 'overview' | 'process' | 'split-package' | 'history';

const ACTIVE_BATCH_STATUSES: BatchStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'released',
  'allocated',
];

const HISTORY_BATCH_STATUSES: BatchStatus[] = ['shipped', 'canceled'];

const computeAbv = (og?: number, fg?: number): number | undefined => {
  if (og === undefined || fg === undefined) return undefined;
  if (og <= fg) return 0;
  return (og - fg) * 131.25;
};

interface VolumeAuditEntry {
  id: string;
  timestamp: string;
  tone: 'manual' | 'flow' | 'packaging' | 'transfer';
  title: string;
  qtyLabel: string;
  lossLabel?: string;
  note?: string;
}

const parseLossFromNote = (note: string | undefined): string | undefined => {
  const match = String(note ?? '').match(/Loss\s+([0-9.]+)\s+([A-Za-z/]+)/i);
  return match ? `${match[1]} ${match[2]}` : undefined;
};

const parsePackagingUsedFromNote = (note: string | undefined): string | undefined => {
  const match = String(note ?? '').match(/for\s+([0-9.]+)\s+([A-Za-z/]+)/i);
  return match ? `${match[1]} ${match[2]}` : undefined;
};

const buildVolumeAuditTimeline = (batch: BatchRecord | null): VolumeAuditEntry[] => {
  if (!batch?.deviations) return [];
  const entries = batch.deviations.reduce<VolumeAuditEntry[]>((items, entry) => {
      const note = entry.note?.trim() || undefined;
      const unit = entry.unit ?? batch.unit;
      const numericPlanned = typeof entry.planned === 'number' ? entry.planned : Number(entry.planned);
      const numericActual = typeof entry.actual === 'number' ? entry.actual : Number(entry.actual);

      if (entry.field === 'volume' && entry.reasonCode === 'manual_bulk_adjustment') {
        const delta =
          Number.isFinite(numericPlanned) && Number.isFinite(numericActual)
            ? numericActual - numericPlanned
            : Number.NaN;
        const direction = Number.isFinite(delta) && delta >= 0 ? '+' : '';
        items.push({
          id: entry.id,
          timestamp: entry.timestamp,
          tone: 'manual',
          title: 'Manual bulk adjustment',
          qtyLabel: Number.isFinite(delta)
            ? `${direction}${formatVolumeNumber(delta)} ${unit}`
            : `${entry.actual ?? '--'} ${unit}`,
          note,
        });
        return items;
      }

      if (entry.field === 'volume' && entry.reasonCode === 'flow_pour_depletion') {
        const consumed = parsePackagingUsedFromNote(note);
        items.push({
          id: entry.id,
          timestamp: entry.timestamp,
          tone: 'flow',
          title: 'Flow depletion',
          qtyLabel: consumed ?? `${entry.actual ?? '--'} ${unit}`,
          note,
        });
        return items;
      }

      if (entry.field === 'packaging') {
        items.push({
          id: entry.id,
          timestamp: entry.timestamp,
          tone: 'packaging',
          title: 'Packaging depletion',
          qtyLabel:
            parsePackagingUsedFromNote(note) ??
            (typeof entry.actual === 'number' ? `${formatVolumeNumber(Number(entry.actual))} units` : `${entry.actual ?? '--'}`),
          lossLabel: parseLossFromNote(note),
          note,
        });
        return items;
      }

      if (entry.field === 'transfer') {
        items.push({
          id: entry.id,
          timestamp: entry.timestamp,
          tone: 'transfer',
          title: 'Transfer depletion',
          qtyLabel:
            typeof entry.actual === 'number'
              ? `${formatVolumeNumber(Number(entry.actual))} ${unit}`
              : `${entry.actual ?? '--'} ${unit}`,
          lossLabel: parseLossFromNote(note),
          note,
        });
        return items;
      }

      return items;
    }, []);
  return entries.sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
};

const computeApparentAttenuation = (og?: number, gravity?: number): number | undefined => {
  if (og === undefined || gravity === undefined) return undefined;
  if (og <= 1) return undefined;
  if (gravity >= og) return 0;
  return ((og - gravity) / (og - 1)) * 100;
};

const computeBrixFromSpecificGravity = (gravity?: number): number | undefined => {
  if (gravity === undefined || !Number.isFinite(gravity)) return undefined;
  return (
    (((182.4601 * gravity - 775.6821) * gravity + 1262.7794) * gravity - 669.5622)
  );
};

const resolveBrixValue = (directBrix?: number, gravity?: number): number | undefined =>
  directBrix !== undefined ? directBrix : computeBrixFromSpecificGravity(gravity);

const estimateResidualSugarValue = (
  observedResidualSugar?: number,
  directBrix?: number,
  gravity?: number
): number | undefined => {
  if (observedResidualSugar !== undefined && Number.isFinite(observedResidualSugar)) {
    return observedResidualSugar;
  }
  const estimatedBrix = resolveBrixValue(directBrix, gravity);
  if (estimatedBrix === undefined || !Number.isFinite(estimatedBrix)) return undefined;
  return Math.max(0, estimatedBrix * 10);
};

const residualSugarGplToPct = (value?: number): number | undefined =>
  value !== undefined && Number.isFinite(value) ? value / 10 : undefined;

const residualSugarPctToSweetnessLevel = (
  value?: number
): SweetnessLevel | undefined => {
  if (value === undefined || !Number.isFinite(value) || value < 0) return undefined;
  if (value < 0.9) return 'bone_dry';
  if (value < 1.8) return 'semi_dry';
  if (value < 4.5) return 'semi_sweet';
  return 'sweet';
};

const getSweetnessLevelLabel = (value?: SweetnessLevel): string | undefined => {
  if (value === 'bone_dry') return 'Bone-dry / Dry';
  if (value === 'semi_dry') return 'Semi-dry';
  if (value === 'semi_sweet') return 'Semi-sweet';
  if (value === 'sweet') return 'Sweet';
  return undefined;
};

const getSweetnessLevelIndex = (value?: SweetnessLevel): number | undefined => {
  if (value === 'bone_dry') return 0;
  if (value === 'semi_dry') return 1;
  if (value === 'semi_sweet') return 2;
  if (value === 'sweet') return 3;
  return undefined;
};

type MetricGuardrailTone = 'normal' | 'warning' | 'critical';
type MetricGuardrailKey = 'abv' | 'ph' | 'residualSugar' | 'freeSo2';

const getMetricGuardrailTone = (
  metric: MetricGuardrailKey,
  value?: number,
  options?: {
    targetResidualSugarPct?: number;
    targetSweetnessLevel?: SweetnessLevel;
  }
): MetricGuardrailTone => {
  if (value === undefined || !Number.isFinite(value)) return 'normal';
  if (metric === 'abv') {
    if (value > 8.5) return 'critical';
    if (value > 8.0) return 'warning';
    return 'normal';
  }
  if (metric === 'ph') {
    if (value > 3.9) return 'critical';
    if (value > 3.8) return 'warning';
    return 'normal';
  }
  if (metric === 'residualSugar') {
    const targetSweetnessLevel =
      options?.targetSweetnessLevel ??
      residualSugarPctToSweetnessLevel(options?.targetResidualSugarPct);
    const actualSweetnessLevel = residualSugarPctToSweetnessLevel(residualSugarGplToPct(value));
    const targetIndex = getSweetnessLevelIndex(targetSweetnessLevel);
    const actualIndex = getSweetnessLevelIndex(actualSweetnessLevel);
    if (targetIndex !== undefined && actualIndex !== undefined) {
      const delta = Math.abs(actualIndex - targetIndex);
      if (delta >= 2) return 'critical';
      if (delta === 1) return 'warning';
      return 'normal';
    }
    if (value > 15) return 'critical';
    if (value >= 2) return 'warning';
    return 'normal';
  }
  if (metric === 'freeSo2') {
    if (value < 10) return 'critical';
    if (value < 25) return 'warning';
    return 'normal';
  }
  return 'normal';
};

const getMetricGuardrailTextClass = (tone: MetricGuardrailTone): string => {
  if (tone === 'critical') return 'text-rose-300';
  if (tone === 'warning') return 'text-amber-300';
  return 'text-white';
};

type FinalLabFieldKey =
  | 'finalLabAbvPct'
  | 'finalLabPh'
  | 'finalLabResidualSugarGpl'
  | 'finalLabTitratableAcidityGpl'
  | 'finalLabFreeSo2Ppm'
  | 'finalLabTotalSo2Ppm';

const REQUIRED_FINAL_LAB_FIELDS: Array<{
  key: FinalLabFieldKey;
  label: string;
  inputId: string;
}> = [
  { key: 'finalLabAbvPct', label: 'Final ABV', inputId: 'batch-final-lab-abv' },
  { key: 'finalLabPh', label: 'Final pH', inputId: 'batch-final-lab-ph' },
  { key: 'finalLabResidualSugarGpl', label: 'Final RS', inputId: 'batch-final-lab-rs' },
  { key: 'finalLabTitratableAcidityGpl', label: 'Final TA', inputId: 'batch-final-lab-ta' },
  { key: 'finalLabFreeSo2Ppm', label: 'Final Free SO2', inputId: 'batch-final-lab-free-so2' },
  { key: 'finalLabTotalSo2Ppm', label: 'Final Total SO2', inputId: 'batch-final-lab-total-so2' },
];

const getMissingFinalLabFields = (batch?: BatchRecord | null) =>
  REQUIRED_FINAL_LAB_FIELDS.filter(
    ({ key }) => !Number.isFinite(Number(batch?.actualResults?.[key]))
  );

const parseOptionalNumberInput = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatMaybeNumber = (
  value: number | undefined,
  digits: number,
  suffix?: string
): string => {
  if (value === undefined || !Number.isFinite(value)) return '--';
  return `${value.toFixed(digits)}${suffix ?? ''}`;
};

const buildReadingChart = (
  series: Array<{ id: string; timestamp: string; value: number }>
) => {
  if (series.length === 0) {
    return null;
  }
  const values = series.map((entry) => entry.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range === 0 ? Math.max(Math.abs(maxValue) * 0.08, 0.1) : range * 0.14;
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;
  const width = 760;
  const height = 260;
  const left = 18;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;
  const points = series.map((entry, index) => {
    const x =
      series.length === 1
        ? left + usableWidth / 2
        : left + (index / (series.length - 1)) * usableWidth;
    const y =
      top +
      (1 - (entry.value - chartMin) / Math.max(chartMax - chartMin, 0.0001)) * usableHeight;
    return { ...entry, x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${path} L ${points.at(-1)?.x.toFixed(2)} ${(height - bottom).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - bottom).toFixed(2)} Z`
      : '';
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    chartMin,
    chartMax,
    minValue,
    maxValue,
    latestValue: values.at(-1),
    firstTimestamp: series[0]?.timestamp,
    lastTimestamp: series.at(-1)?.timestamp,
    points,
    path,
    areaPath,
  };
};

type ReadingChart = NonNullable<ReturnType<typeof buildReadingChart>>;
type ReadingMetricKey =
  | 'sg'
  | 'temperatureC'
  | 'ph'
  | 'brix'
  | 'abv'
  | 'apparentAttenuation'
  | 'residualSugarGpl';

const READING_METRIC_KEYS: ReadingMetricKey[] = [
  'sg',
  'temperatureC',
  'ph',
  'brix',
  'abv',
  'apparentAttenuation',
  'residualSugarGpl',
];

const READING_METRICS: Array<{
  key: ReadingMetricKey;
  label: string;
  digits: number;
  suffix?: string;
  colorClass: string;
}> = [
  { key: 'sg', label: 'SG', digits: 3, colorClass: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' },
  { key: 'temperatureC', label: 'Temp', digits: 1, suffix: ' C', colorClass: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' },
  { key: 'ph', label: 'pH', digits: 2, colorClass: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100' },
  { key: 'brix', label: 'Brix', digits: 2, colorClass: 'border-amber-400/30 bg-amber-400/10 text-amber-100' },
  { key: 'abv', label: 'ABV', digits: 2, suffix: '%', colorClass: 'border-violet-400/30 bg-violet-400/10 text-violet-100' },
  { key: 'apparentAttenuation', label: 'Attenuation', digits: 1, suffix: '%', colorClass: 'border-lime-400/30 bg-lime-400/10 text-lime-100' },
  { key: 'residualSugarGpl', label: 'RS', digits: 2, suffix: ' g/L', colorClass: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' },
];

const READING_METRIC_COLORS: Record<ReadingMetricKey, { stroke: string; fill: string }> = {
  sg: { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.18)' },
  temperatureC: { stroke: '#22d3ee', fill: 'rgba(34, 211, 238, 0.18)' },
  ph: { stroke: '#e879f9', fill: 'rgba(232, 121, 249, 0.18)' },
  brix: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.18)' },
  abv: { stroke: '#a78bfa', fill: 'rgba(167, 139, 250, 0.18)' },
  apparentAttenuation: { stroke: '#a3e635', fill: 'rgba(163, 230, 53, 0.18)' },
  residualSugarGpl: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.18)' },
};

const countDecimals = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed.includes('.')) return 0;
  return trimmed.split('.')[1]?.length ?? 0;
};

const validateGravityField = (
  label: string,
  rawValue: string,
  options: { min: number; max: number; requireOgRange?: boolean }
): string | undefined => {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return `${label} must be a number.`;
  }
  if (countDecimals(trimmed) > 3) {
    return `${label} should use 3 decimals, like 1.055.`;
  }
  if (parsed < options.min || parsed > options.max) {
    return `${label} must be between ${options.min.toFixed(3)} and ${options.max.toFixed(3)}.`;
  }
  if (options.requireOgRange && parsed < 1.01) {
    return `${label} looks too low for an original gravity reading.`;
  }
  return undefined;
};

export default function BatchesPage() {
  const navigate = useNavigate();
  const params = useParams<{ batchId?: string }>();
  const [searchParams] = useSearchParams();
  const { temperatureUnit } = useOsDisplaySettings();
  const routeBatchId = params.batchId ? String(params.batchId).trim() : '';
  const routeTabParam = String(searchParams.get('tab') ?? '').trim();
  const routeDetailTab: BatchDetailTab =
    routeTabParam === 'process' ||
    routeTabParam === 'split-package' ||
    routeTabParam === 'history'
      ? routeTabParam
      : 'overview';
  const [batchFilter, setBatchFilter] = useState<BatchBoardFilter>('active');
  const [batchStatusFilter, setBatchStatusFilter] = useState<BatchStatusQuickFilter>('all');
  const [detailTab, setDetailTab] = useState<BatchDetailTab>('overview');
  const [highlightedBatchField, setHighlightedBatchField] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [status, setStatus] = useState('Loading batches...');
  const [identityEditMode, setIdentityEditMode] = useState(false);
  const [productionRecordEditMode, setProductionRecordEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editRecipeName, setEditRecipeName] = useState('');
  const [editSkuId, setEditSkuId] = useState('');
  const [editProductIdentity, setEditProductIdentity] = useState<ProductIdentityDraft>({
    productName: '',
    beverageClass: 'cider',
  });

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    routeBatchId.length > 0 ? routeBatchId : null
  );
  const [lineage, setLineage] = useState<BatchLineage | null>(null);
  const [lineageStatus, setLineageStatus] = useState(
    'Select a batch to view lot/reservation/fulfillment genealogy.'
  );
  const [labFieldDraft, setLabFieldDraft] = useState({
    residualSugarGplLatest: '',
    volatileAcidityGplLatest: '',
    freeSo2PpmLatest: '',
    totalSo2PpmLatest: '',
    dissolvedOxygenPpmLatest: '',
    finalLabAbvPct: '',
    finalLabPh: '',
    finalLabBrix: '',
    finalLabResidualSugarGpl: '',
    finalLabTitratableAcidityGpl: '',
    finalLabFreeSo2Ppm: '',
    finalLabTotalSo2Ppm: '',
    finalLabDissolvedOxygenPpm: '',
    finalLabRecordedBy: '',
    finalVolumeQty: '',
    finalVolumeUnit: 'L',
  });
  const [readingDraft, setReadingDraft] = useState<ReadingDraft>({
    og: '',
    fg: '',
    sg: '',
    temperatureC: '',
    ph: '',
    brix: '',
    titratableAcidityGpl: '',
    so2Ppm: '',
    residualSugarGpl: '',
    volatileAcidityGpl: '',
    freeSo2Ppm: '',
    totalSo2Ppm: '',
    dissolvedOxygenPpm: '',
    note: '',
  });
  const [treatmentDraft, setTreatmentDraft] = useState<TreatmentDraft>({
    type: 'sulfite_addition',
    stage: 'cellar',
    quantity: '',
    unit: 'ppm',
    lotCode: '',
    actor: '',
    note: '',
    blendBatchCode: '',
    blendQuantity: '',
    blendUnit: 'L',
  });
  const [volumeCheckpointDraft, setVolumeCheckpointDraft] = useState<VolumeCheckpointDraft>({
    stage: 'start',
    quantity: '',
    unit: 'L',
    actor: '',
    note: '',
  });
  const [sensoryQcDraft, setSensoryQcDraft] = useState<SensoryQcDraft>({
    stage: 'cellar',
    visualNotes: '',
    aromaNotes: '',
    tasteNotes: '',
    passFail: 'pass',
    approvalDecision: 'approved',
    actor: '',
    note: '',
  });
  const [stageTimelineDraft, setStageTimelineDraft] = useState<StageTimelineDraft>({
    stage: 'fermentation_start',
    actor: '',
    note: '',
  });
  const [selectedReadingMetrics, setSelectedReadingMetrics] = useState<ReadingMetricKey[]>(['sg']);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId]
  );
  const editingBatch = useMemo(
    () => batches.find((batch) => batch.id === editingBatchId) ?? null,
    [batches, editingBatchId]
  );
  const selectedReadiness = useMemo(
    () =>
      getBatchOperationalReadiness({
        batchStatus: lineage?.batch.status ?? selectedBatch?.status,
        productSnapshot: lineage?.batch.productSnapshot ?? selectedBatch?.productSnapshot,
        actualResults: lineage?.batch.actualResults ?? selectedBatch?.actualResults,
        recipeRunId: lineage?.batch.recipeRunId ?? selectedBatch?.recipeRunId,
        packageLotCount: lineage?.packageLots.length ?? 0,
        temperatureUnit,
      }),
    [lineage, selectedBatch, temperatureUnit]
  );
  const pendingReadinessItems = useMemo(
    () => selectedReadiness.items.filter((item) => !item.ok),
    [selectedReadiness]
  );
  const missingFinalLabFields = useMemo(
    () => getMissingFinalLabFields(lineage?.batch ?? selectedBatch),
    [lineage, selectedBatch]
  );
  const readingMetricConfigs = useMemo(
    () =>
      READING_METRICS.map((metric) =>
        metric.key === 'temperatureC'
          ? {
              ...metric,
              suffix: ` °${temperatureUnit}`,
            }
          : metric
      ),
    [temperatureUnit]
  );
  const batchOverviewActualResults = lineage?.batch.actualResults ?? selectedBatch?.actualResults;
  const batchOverviewCurrentGravity =
    batchOverviewActualResults?.sgLatest ?? batchOverviewActualResults?.fg;
  const batchOverviewCurrentGravityLabel =
    batchOverviewActualResults?.sgLatest !== undefined
      ? 'Live SG'
      : batchOverviewActualResults?.fg !== undefined
        ? 'Final FG'
        : 'Current Gravity';
  const batchOverviewBrix = resolveBrixValue(
    batchOverviewActualResults?.brixLatest,
    batchOverviewCurrentGravity
  );
  const batchOverviewResidualSugar = estimateResidualSugarValue(
    batchOverviewActualResults?.residualSugarGplLatest,
    batchOverviewActualResults?.brixLatest,
    batchOverviewCurrentGravity
  );
  const batchOverviewResidualSugarPct = residualSugarGplToPct(batchOverviewResidualSugar);
  const batchOverviewSweetnessLevel = residualSugarPctToSweetnessLevel(batchOverviewResidualSugarPct);
  const batchOverviewTargets = lineage?.batch.intendedRecipe?.targets ?? selectedBatch?.intendedRecipe?.targets;
  const batchOverviewApparentAttenuation = computeApparentAttenuation(
    batchOverviewActualResults?.og,
    batchOverviewCurrentGravity
  );
  const activeReadingMetrics = useMemo<ReadingMetricKey[]>(
    () => Array.from(new Set(selectedReadingMetrics)),
    [selectedReadingMetrics]
  );
  const readingSeriesByMetric = useMemo(() => {
    const log = lineage?.batch.readingLog ?? selectedBatch?.readingLog ?? [];
    const metricMap = READING_METRIC_KEYS.reduce(
      (accumulator, metric) => {
        accumulator[metric] = [];
        return accumulator;
      },
      {} as Record<ReadingMetricKey, Array<{ id: string; timestamp: string; value: number }>>
    );

    log.forEach((entry) => {
      const currentGravity = entry.sg ?? entry.fg;
      const ogGravity = entry.og ?? selectedBatch?.actualResults?.og;
      const abv = computeAbv(ogGravity, currentGravity);
      const apparentAttenuation = computeApparentAttenuation(ogGravity, currentGravity);
      const valueByMetric: Record<ReadingMetricKey, number | undefined> = {
        sg: currentGravity,
        temperatureC: convertTemperatureFromC(entry.temperatureC, temperatureUnit),
        ph: entry.ph,
        brix: resolveBrixValue(entry.brix, currentGravity ?? ogGravity),
        abv,
        apparentAttenuation,
        residualSugarGpl: estimateResidualSugarValue(
          entry.residualSugarGpl,
          entry.brix,
          currentGravity ?? ogGravity
        ),
      };
      (Object.entries(valueByMetric) as Array<[ReadingMetricKey, number | undefined]>).forEach(
        ([metric, value]) => {
          if (value === undefined || !Number.isFinite(value)) return;
          metricMap[metric].push({
            id: `${entry.id}-${metric}`,
            timestamp: entry.timestamp,
            value,
          });
        }
      );
    });

    return metricMap;
  }, [lineage, selectedBatch, temperatureUnit]);
  const readingChartsByMetric = useMemo(
    () =>
      READING_METRIC_KEYS.reduce(
        (accumulator, metric) => {
          accumulator[metric] = buildReadingChart(readingSeriesByMetric[metric]);
          return accumulator;
        },
        {} as Record<ReadingMetricKey, ReturnType<typeof buildReadingChart>>
      ),
    [readingSeriesByMetric]
  );
  const selectedReadingChartEntries = useMemo(
    () =>
      activeReadingMetrics
        .map((metricKey) => {
          const chart = readingChartsByMetric[metricKey];
          const config =
            readingMetricConfigs.find((metric) => metric.key === metricKey) ??
            readingMetricConfigs[0];
          return chart ? { metricKey, chart, config } : null;
        })
        .filter(
          (
            entry
          ): entry is {
            metricKey: ReadingMetricKey;
            chart: ReadingChart;
            config: (typeof readingMetricConfigs)[number];
          } => entry !== null
        ),
    [activeReadingMetrics, readingChartsByMetric, readingMetricConfigs]
  );
  const primaryReadingChartEntry = selectedReadingChartEntries[0] ?? null;
  const readingChart = primaryReadingChartEntry?.chart ?? null;
  const readingMetricConfig = primaryReadingChartEntry?.config ?? readingMetricConfigs[0];
  const volumeAuditTimeline = useMemo(
    () => buildVolumeAuditTimeline(lineage?.batch ?? selectedBatch),
    [lineage, selectedBatch]
  );
  const readingValidation = useMemo(() => {
    const fieldErrors: Partial<Record<keyof ReadingDraft, string>> = {};
    const issues: string[] = [];

    fieldErrors.og = validateGravityField('OG', readingDraft.og, {
      min: 1.01,
      max: 1.2,
      requireOgRange: true,
    });
    fieldErrors.fg = validateGravityField('FG', readingDraft.fg, {
      min: 0.9,
      max: 1.2,
    });
    fieldErrors.sg = validateGravityField('Current SG', readingDraft.sg, {
      min: 0.9,
      max: 1.2,
    });

    const effectiveOg = parseOptionalNumberInput(readingDraft.og) ?? selectedBatch?.actualResults?.og;
    const effectiveFg = parseOptionalNumberInput(readingDraft.fg) ?? selectedBatch?.actualResults?.fg;
    const effectiveSg =
      parseOptionalNumberInput(readingDraft.sg) ?? selectedBatch?.actualResults?.sgLatest;

    if (effectiveOg !== undefined && effectiveSg !== undefined && effectiveOg < effectiveSg) {
      issues.push('OG should be greater than or equal to the current SG.');
    }
    if (effectiveOg !== undefined && effectiveFg !== undefined && effectiveOg < effectiveFg) {
      issues.push('OG should be greater than or equal to FG.');
    }

    const observedInputCount = [
      readingDraft.og,
      readingDraft.fg,
      readingDraft.sg,
      readingDraft.temperatureC,
      readingDraft.ph,
      readingDraft.brix,
      readingDraft.titratableAcidityGpl,
      readingDraft.so2Ppm,
      readingDraft.residualSugarGpl,
      readingDraft.volatileAcidityGpl,
      readingDraft.freeSo2Ppm,
      readingDraft.totalSo2Ppm,
      readingDraft.dissolvedOxygenPpm,
    ].filter((value) => value.trim().length > 0).length;

    const hasErrors =
      Object.values(fieldErrors).some(Boolean) ||
      issues.length > 0;

    return {
      fieldErrors,
      issues,
      hasErrors,
      hasObservedInput: observedInputCount > 0,
    };
  }, [readingDraft, selectedBatch]);

  const summarySourceBatches = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return batches.filter((batch) => {
      const matchesFilter =
        batchFilter === 'all'
          ? true
          : batchFilter === 'active'
            ? ACTIVE_BATCH_STATUSES.includes(batch.status)
            : HISTORY_BATCH_STATUSES.includes(batch.status);
      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;
      const searchHaystack = [
        batch.batchCode,
        batch.lotCode,
        batch.recipeName,
        batch.productSnapshot?.productCode,
        batch.productSnapshot?.productName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchHaystack.includes(normalizedSearch);
    });
  }, [batchFilter, batches, searchQuery]);

  const visibleBatches = useMemo(() => {
    if (batchStatusFilter === 'all') return summarySourceBatches;
    return summarySourceBatches.filter((batch) => batch.status === batchStatusFilter);
  }, [batchStatusFilter, summarySourceBatches]);

  const visibleSummary = useMemo(
    () => ({
      total: summarySourceBatches.length,
      inProgress: summarySourceBatches.filter((batch) => batch.status === 'in_progress').length,
      readyToRelease: summarySourceBatches.filter((batch) => batch.status === 'completed').length,
      released: summarySourceBatches.filter((batch) => batch.status === 'released').length,
    }),
    [summarySourceBatches]
  );

  const loadBatches = useCallback(async () => {
    try {
      const response = await fetch('/api/os/batches');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load batches.');
      }
      setBatches((payload.data?.batches ?? []) as BatchRecord[]);
      setStatus('Batches loaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load batches.');
    }
  }, []);

  const loadLineage = useCallback(async (batchId: string) => {
    try {
      const response = await fetch(`/api/os/batches/${batchId}/lineage`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load batch lineage.');
      }
      setLineage((payload.data ?? null) as BatchLineage | null);
      setLineageStatus('Batch lineage loaded.');
    } catch (error) {
      setLineage(null);
      setLineageStatus(error instanceof Error ? error.message : 'Failed to load batch lineage.');
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    setSelectedBatchId(routeBatchId.length > 0 ? routeBatchId : null);
  }, [routeBatchId]);

  useEffect(() => {
    if (!routeBatchId) {
      setIdentityEditMode(false);
      setProductionRecordEditMode(false);
      setEditingBatchId(null);
      return;
    }
    setEditingBatchId(routeBatchId);
  }, [routeBatchId]);

  useEffect(() => {
    setDetailTab(routeDetailTab);
    setHighlightedBatchField('');
  }, [routeBatchId, routeDetailTab]);

  useEffect(() => {
    if (!selectedBatchId) {
      setLineage(null);
      setLineageStatus('Select a batch to view lot/reservation/fulfillment genealogy.');
      return;
    }
    void loadLineage(selectedBatchId);
  }, [loadLineage, selectedBatchId]);

  useEffect(() => {
    if (!routeBatchId || batches.length === 0) return;
    const exists = batches.some((batch) => batch.id === routeBatchId);
    if (!exists) {
      setLineage(null);
      setLineageStatus(`Batch ${routeBatchId} was not found.`);
    }
  }, [batches, routeBatchId]);

  useEffect(() => {
    if (routeBatchId) return;
    if (visibleBatches.length === 0) {
      setSelectedBatchId(null);
      return;
    }
    if (!selectedBatchId || !visibleBatches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId(visibleBatches[0]?.id ?? null);
    }
  }, [routeBatchId, selectedBatchId, visibleBatches]);

  useEffect(() => {
    if (!selectedBatch) return;
    setReadingDraft({
      og: selectedBatch.actualResults?.og?.toString() ?? '',
      fg: selectedBatch.actualResults?.fg?.toString() ?? '',
      sg: selectedBatch.actualResults?.sgLatest?.toString() ?? '',
      temperatureC:
        selectedBatch.actualResults?.temperatureCLatest !== undefined
          ? formatTemperatureValue(
              selectedBatch.actualResults.temperatureCLatest,
              temperatureUnit,
              1
            )
          : '',
      ph: selectedBatch.actualResults?.phLatest?.toString() ?? '',
      brix: selectedBatch.actualResults?.brixLatest?.toString() ?? '',
      titratableAcidityGpl:
        selectedBatch.actualResults?.titratableAcidityGplLatest?.toString() ?? '',
      so2Ppm: selectedBatch.actualResults?.so2PpmLatest?.toString() ?? '',
      residualSugarGpl:
        selectedBatch.actualResults?.residualSugarGplLatest?.toString() ?? '',
      volatileAcidityGpl:
        selectedBatch.actualResults?.volatileAcidityGplLatest?.toString() ?? '',
      freeSo2Ppm: selectedBatch.actualResults?.freeSo2PpmLatest?.toString() ?? '',
      totalSo2Ppm: selectedBatch.actualResults?.totalSo2PpmLatest?.toString() ?? '',
      dissolvedOxygenPpm:
        selectedBatch.actualResults?.dissolvedOxygenPpmLatest?.toString() ?? '',
      note: '',
    });
  }, [selectedBatch, temperatureUnit]);

  const updateBatch = async (batch: BatchRecord, nextStatus: BatchRecord['status']) => {
    if (nextStatus === 'completed' || nextStatus === 'released') {
      const missingFields = getMissingFinalLabFields(batch);
      if (missingFields.length > 0) {
        setDetailTab('process');
        openProductionRecordEditor(batch);
        window.setTimeout(() => {
          const field = globalThis.document?.getElementById(missingFields[0]?.inputId);
          if (!field) return;
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if ('focus' in field) {
            (field as HTMLElement).focus();
          }
        }, 220);
        setStatus(
          `Final lab sign-off is required before ${nextStatus === 'released' ? 'release' : 'completion'}. Missing: ${missingFields
            .map((field) => field.label)
            .join(', ')}.`
        );
        return;
      }
    }
    try {
      const response = await fetch(`/api/os/batches/${batch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producedQty: batch.producedQty,
          status: nextStatus,
          unit: batch.unit,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to update batch.');
      }
      await loadBatches();
      if (selectedBatchId === batch.id) {
        await loadLineage(batch.id);
      }
      setStatus(`Batch ${batch.lotCode} updated.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to update batch.');
    }
  };

  const openBatchEditor = (batch: BatchRecord) => {
    setEditingBatchId(batch.id);
    setEditRecipeName(batch.recipeName);
    setEditSkuId(batch.skuId ?? '');
    setEditProductIdentity({
      productId: batch.productSnapshot?.productId,
      productCode: batch.productSnapshot?.productCode,
      productName: batch.productSnapshot?.productName ?? batch.recipeName,
      beverageClass: batch.productSnapshot?.beverageClass ?? 'cider',
      thumbnailUrl: batch.productSnapshot?.images?.thumbnailUrl,
      cardImageUrl: batch.productSnapshot?.images?.cardImageUrl,
      fullImageUrl: batch.productSnapshot?.images?.fullImageUrl,
    });
    setIdentityEditMode(true);
  };

  const openProductionRecordEditor = (batch: BatchRecord) => {
    setEditingBatchId(batch.id);
    setLabFieldDraft({
      residualSugarGplLatest: batch.actualResults?.residualSugarGplLatest?.toString() ?? '',
      volatileAcidityGplLatest: batch.actualResults?.volatileAcidityGplLatest?.toString() ?? '',
      freeSo2PpmLatest: batch.actualResults?.freeSo2PpmLatest?.toString() ?? '',
      totalSo2PpmLatest: batch.actualResults?.totalSo2PpmLatest?.toString() ?? '',
      dissolvedOxygenPpmLatest: batch.actualResults?.dissolvedOxygenPpmLatest?.toString() ?? '',
      finalLabAbvPct: batch.actualResults?.finalLabAbvPct?.toString() ?? '',
      finalLabPh: batch.actualResults?.finalLabPh?.toString() ?? '',
      finalLabBrix: batch.actualResults?.finalLabBrix?.toString() ?? '',
      finalLabResidualSugarGpl: batch.actualResults?.finalLabResidualSugarGpl?.toString() ?? '',
      finalLabTitratableAcidityGpl:
        batch.actualResults?.finalLabTitratableAcidityGpl?.toString() ?? '',
      finalLabFreeSo2Ppm: batch.actualResults?.finalLabFreeSo2Ppm?.toString() ?? '',
      finalLabTotalSo2Ppm: batch.actualResults?.finalLabTotalSo2Ppm?.toString() ?? '',
      finalLabDissolvedOxygenPpm:
        batch.actualResults?.finalLabDissolvedOxygenPpm?.toString() ?? '',
      finalLabRecordedBy: batch.actualResults?.finalLabRecordedBy ?? '',
      finalVolumeQty: batch.actualResults?.finalVolumeQty?.toString() ?? '',
      finalVolumeUnit: normalizeVolumeUnit(batch.actualResults?.finalVolumeUnit ?? batch.unit ?? 'L'),
    });
    setTreatmentDraft({
      type: 'sulfite_addition',
      stage: 'cellar',
      quantity: '',
      unit: 'ppm',
      lotCode: '',
      actor: '',
      note: '',
      blendBatchCode: '',
      blendQuantity: '',
      blendUnit: normalizeVolumeUnit(batch.unit ?? 'L'),
    });
    setVolumeCheckpointDraft({
      stage: 'start',
      quantity: '',
      unit: normalizeVolumeUnit(batch.unit ?? 'L'),
      actor: '',
      note: '',
    });
    setSensoryQcDraft({
      stage: 'cellar',
      visualNotes: '',
      aromaNotes: '',
      tasteNotes: '',
      passFail: 'pass',
      approvalDecision: 'approved',
      actor: '',
      note: '',
    });
    setStageTimelineDraft({
      stage: 'fermentation_start',
      actor: '',
      note: '',
    });
    setProductionRecordEditMode(true);
  };

  const saveBatchIdentity = async () => {
    if (!editingBatch) return;
    try {
      const response = await fetch(`/api/os/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producedQty: editingBatch.producedQty,
          unit: editingBatch.unit,
          status: editingBatch.status,
          recipeName: editRecipeName.trim() || editingBatch.recipeName,
          skuId: editSkuId.trim() || undefined,
          product: {
            productId: editProductIdentity.productId?.trim() || undefined,
            productCode: editProductIdentity.productCode?.trim() || undefined,
            productName:
              editProductIdentity.productName.trim() ||
              editRecipeName.trim() ||
              editingBatch.recipeName,
            beverageClass: editProductIdentity.beverageClass,
            images: {
              thumbnailUrl: editProductIdentity.thumbnailUrl?.trim() || undefined,
              cardImageUrl: editProductIdentity.cardImageUrl?.trim() || undefined,
              fullImageUrl: editProductIdentity.fullImageUrl?.trim() || undefined,
            },
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to update batch details.');
      }
      await loadBatches();
      if (selectedBatchId === editingBatch.id) {
        await loadLineage(editingBatch.id);
      }
      setIdentityEditMode(false);
      setStatus(`Updated product details for ${editingBatch.lotCode}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to update batch details.');
    }
  };

  const saveProductionRecord = async () => {
    if (!editingBatch) return;
    const nextTreatmentLog = [...(editingBatch.treatmentLog ?? [])];
    if (treatmentDraft.type.trim()) {
      nextTreatmentLog.push({
        id: createClientId(),
        timestamp: new Date().toISOString(),
        type: treatmentDraft.type.trim(),
        stage: treatmentDraft.stage.trim() || undefined,
        quantity: parseOptionalNumberInput(treatmentDraft.quantity),
        unit: normalizeProcessUnit(treatmentDraft.unit, 'ppm'),
        lotCode: treatmentDraft.lotCode.trim() || undefined,
        actor: treatmentDraft.actor.trim() || undefined,
        note: treatmentDraft.note.trim() || undefined,
        blendComponents:
          treatmentDraft.type === 'blend' && treatmentDraft.blendBatchCode.trim()
            ? [
                {
                  batchCode: treatmentDraft.blendBatchCode.trim(),
                  quantity: parseOptionalNumberInput(treatmentDraft.blendQuantity),
                  unit: normalizeVolumeUnit(treatmentDraft.blendUnit),
                },
              ]
            : undefined,
      });
    }
    const nextVolumeCheckpoints = [...(editingBatch.volumeCheckpoints ?? [])];
    if (volumeCheckpointDraft.quantity.trim()) {
      nextVolumeCheckpoints.push({
        id: createClientId(),
        timestamp: new Date().toISOString(),
        stage: volumeCheckpointDraft.stage.trim() || 'other',
        quantity: Number(volumeCheckpointDraft.quantity),
        unit: normalizeVolumeUnit(volumeCheckpointDraft.unit || editingBatch.unit),
        actor: volumeCheckpointDraft.actor.trim() || undefined,
        note: volumeCheckpointDraft.note.trim() || undefined,
      });
    }
    const nextSensoryQcRecords = [...(editingBatch.sensoryQcRecords ?? [])];
    if (
      sensoryQcDraft.visualNotes.trim() ||
      sensoryQcDraft.aromaNotes.trim() ||
      sensoryQcDraft.tasteNotes.trim() ||
      sensoryQcDraft.note.trim()
    ) {
      nextSensoryQcRecords.push({
        id: createClientId(),
        timestamp: new Date().toISOString(),
        stage: sensoryQcDraft.stage.trim() || undefined,
        visualNotes: sensoryQcDraft.visualNotes.trim() || undefined,
        aromaNotes: sensoryQcDraft.aromaNotes.trim() || undefined,
        tasteNotes: sensoryQcDraft.tasteNotes.trim() || undefined,
        passFail: sensoryQcDraft.passFail.trim() || undefined,
        approvalDecision: sensoryQcDraft.approvalDecision.trim() || undefined,
        actor: sensoryQcDraft.actor.trim() || undefined,
        note: sensoryQcDraft.note.trim() || undefined,
      });
    }
    const nextStageTimeline = [...(editingBatch.stageTimeline ?? [])];
    if (stageTimelineDraft.stage.trim()) {
      nextStageTimeline.push({
        id: createClientId(),
        timestamp: new Date().toISOString(),
        stage: stageTimelineDraft.stage.trim(),
        actor: stageTimelineDraft.actor.trim() || undefined,
        note: stageTimelineDraft.note.trim() || undefined,
      });
    }
    const hasFinalLabInput = [
      labFieldDraft.finalLabAbvPct,
      labFieldDraft.finalLabPh,
      labFieldDraft.finalLabBrix,
      labFieldDraft.finalLabResidualSugarGpl,
      labFieldDraft.finalLabTitratableAcidityGpl,
      labFieldDraft.finalLabFreeSo2Ppm,
      labFieldDraft.finalLabTotalSo2Ppm,
      labFieldDraft.finalLabDissolvedOxygenPpm,
      labFieldDraft.finalLabRecordedBy,
    ].some((value) => value.trim().length > 0);

    try {
      const response = await fetch(`/api/os/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producedQty: editingBatch.producedQty,
          unit: editingBatch.unit,
          status: editingBatch.status,
          actualResults: {
            residualSugarGplLatest: parseOptionalNumberInput(labFieldDraft.residualSugarGplLatest),
            volatileAcidityGplLatest: parseOptionalNumberInput(labFieldDraft.volatileAcidityGplLatest),
            freeSo2PpmLatest: parseOptionalNumberInput(labFieldDraft.freeSo2PpmLatest),
            totalSo2PpmLatest: parseOptionalNumberInput(labFieldDraft.totalSo2PpmLatest),
            dissolvedOxygenPpmLatest: parseOptionalNumberInput(labFieldDraft.dissolvedOxygenPpmLatest),
            finalLabAbvPct: parseOptionalNumberInput(labFieldDraft.finalLabAbvPct),
            finalLabPh: parseOptionalNumberInput(labFieldDraft.finalLabPh),
            finalLabBrix: parseOptionalNumberInput(labFieldDraft.finalLabBrix),
            finalLabResidualSugarGpl: parseOptionalNumberInput(labFieldDraft.finalLabResidualSugarGpl),
            finalLabTitratableAcidityGpl: parseOptionalNumberInput(labFieldDraft.finalLabTitratableAcidityGpl),
            finalLabFreeSo2Ppm: parseOptionalNumberInput(labFieldDraft.finalLabFreeSo2Ppm),
            finalLabTotalSo2Ppm: parseOptionalNumberInput(labFieldDraft.finalLabTotalSo2Ppm),
            finalLabDissolvedOxygenPpm: parseOptionalNumberInput(labFieldDraft.finalLabDissolvedOxygenPpm),
            finalLabRecordedAt: hasFinalLabInput
              ? editingBatch.actualResults?.finalLabRecordedAt ?? new Date().toISOString()
              : undefined,
            finalLabRecordedBy: labFieldDraft.finalLabRecordedBy.trim() || undefined,
            finalVolumeQty: parseOptionalNumberInput(labFieldDraft.finalVolumeQty),
            finalVolumeUnit: normalizeVolumeUnit(labFieldDraft.finalVolumeUnit || editingBatch.unit),
          },
          treatmentLog: nextTreatmentLog,
          volumeCheckpoints: nextVolumeCheckpoints,
          sensoryQcRecords: nextSensoryQcRecords,
          stageTimeline: nextStageTimeline,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to update production record.');
      }
      await loadBatches();
      if (selectedBatchId === editingBatch.id) {
        await loadLineage(editingBatch.id);
      }
      setProductionRecordEditMode(false);
      setStatus(`Updated production record for ${editingBatch.lotCode}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to update production record.');
    }
  };

  const recordCurrentReadings = async () => {
    if (!selectedBatch) return;

    const nextReading = {
      id: createClientId(),
      timestamp: new Date().toISOString(),
      og: parseOptionalNumberInput(readingDraft.og),
      fg: parseOptionalNumberInput(readingDraft.fg),
      sg: parseOptionalNumberInput(readingDraft.sg),
      temperatureC: convertTemperatureToC(
        parseOptionalNumberInput(readingDraft.temperatureC),
        temperatureUnit
      ),
      ph: parseOptionalNumberInput(readingDraft.ph),
      brix:
        parseOptionalNumberInput(readingDraft.brix) ??
        resolveBrixValue(
          undefined,
          parseOptionalNumberInput(readingDraft.sg) ??
            parseOptionalNumberInput(readingDraft.fg)
        ),
      titratableAcidityGpl: parseOptionalNumberInput(readingDraft.titratableAcidityGpl),
      so2Ppm: parseOptionalNumberInput(readingDraft.so2Ppm),
      residualSugarGpl: parseOptionalNumberInput(readingDraft.residualSugarGpl),
      volatileAcidityGpl: parseOptionalNumberInput(readingDraft.volatileAcidityGpl),
      freeSo2Ppm: parseOptionalNumberInput(readingDraft.freeSo2Ppm),
      totalSo2Ppm: parseOptionalNumberInput(readingDraft.totalSo2Ppm),
      dissolvedOxygenPpm: parseOptionalNumberInput(readingDraft.dissolvedOxygenPpm),
      note: readingDraft.note.trim() || undefined,
    };

    const effectiveOg = nextReading.og ?? selectedBatch.actualResults?.og;
    const effectiveCurrentGravity =
      nextReading.sg ??
      selectedBatch.actualResults?.sgLatest ??
      nextReading.fg ??
      selectedBatch.actualResults?.fg;
    const liveAbv = computeAbv(effectiveOg, effectiveCurrentGravity);
    const estimatedResidualSugar = estimateResidualSugarValue(
      nextReading.residualSugarGpl,
      nextReading.brix,
      effectiveCurrentGravity ?? effectiveOg
    );

    const hasObservedValue = Object.entries(nextReading).some(([key, value]) => {
      if (key === 'id' || key === 'timestamp' || key === 'note') return false;
      return value !== undefined;
    });

    if (!hasObservedValue) {
      setStatus('Enter at least one reading before recording.');
      return;
    }

    try {
      const response = await fetch(`/api/os/batches/${selectedBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producedQty: selectedBatch.producedQty,
          unit: selectedBatch.unit,
          status: selectedBatch.status,
          actualResults: {
            og: nextReading.og,
            fg: nextReading.fg,
            sgLatest: nextReading.sg,
            temperatureCLatest: nextReading.temperatureC,
            phLatest: nextReading.ph,
            brixLatest: nextReading.brix,
            titratableAcidityGplLatest: nextReading.titratableAcidityGpl,
            so2PpmLatest: nextReading.so2Ppm,
            residualSugarGplLatest: nextReading.residualSugarGpl,
            estimatedResidualSugarGplLatest: estimatedResidualSugar,
            volatileAcidityGplLatest: nextReading.volatileAcidityGpl,
            freeSo2PpmLatest: nextReading.freeSo2Ppm,
            totalSo2PpmLatest: nextReading.totalSo2Ppm,
            dissolvedOxygenPpmLatest: nextReading.dissolvedOxygenPpm,
            abvPct: liveAbv,
          },
          readingLog: [...(selectedBatch.readingLog ?? []), nextReading],
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to record readings.');
      }
      await loadBatches();
      await loadLineage(selectedBatch.id);
      setReadingDraft((prev) => ({ ...prev, note: '' }));
      setStatus(`Recorded readings for ${selectedBatch.lotCode}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to record readings.');
    }
  };

  const printBatchRecord = () => {
    globalThis.print?.();
  };

  const focusBatchField = (
    nextTab: BatchDetailTab,
    fieldKey: string,
    elementId: string
  ) => {
    setDetailTab(nextTab);
    setHighlightedBatchField(fieldKey);
    window.setTimeout(() => {
      const field = globalThis.document?.getElementById(elementId);
      if (!field) return;
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in field) {
        (field as HTMLElement).focus();
      }
    }, 180);
  };

  const openProductionRecordAndFocus = (batch: BatchRecord, elementId?: string) => {
    setDetailTab('process');
    openProductionRecordEditor(batch);
    if (!elementId) return;
    window.setTimeout(() => {
      const field = globalThis.document?.getElementById(elementId);
      if (!field) return;
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in field) {
        (field as HTMLElement).focus();
      }
    }, 220);
  };

  const handleReadinessAction = (key: string) => {
    if (!selectedBatch) return;
    switch (key) {
      case 'product':
        openBatchEditor(selectedBatch);
        break;
      case 'og':
        focusBatchField('process', 'og', 'batch-reading-og');
        break;
      case 'sg':
        focusBatchField('process', 'sg', 'batch-reading-sg');
        break;
      case 'temperature':
        focusBatchField('process', 'temperature', 'batch-reading-temperature');
        break;
      case 'ph':
        focusBatchField('process', 'ph', 'batch-reading-ph');
        break;
      case 'brix':
        focusBatchField('process', 'brix', 'batch-reading-brix');
        break;
      case 'ta':
        focusBatchField('process', 'ta', 'batch-reading-ta');
        break;
      case 'so2':
        focusBatchField('process', 'so2', 'batch-reading-so2');
        break;
      case 'abv':
        focusBatchField('process', 'abv', 'batch-reading-fg');
        break;
      case 'packageLots':
        setDetailTab('split-package');
        break;
      case 'runLink':
        setDetailTab('history');
        break;
      case 'finalLab':
        openProductionRecordAndFocus(selectedBatch, 'batch-final-lab-abv');
        break;
      default:
        setDetailTab('process');
        break;
    }
  };

  const toggleReadingMetric = (metric: ReadingMetricKey) => {
    setSelectedReadingMetrics((current) => {
      if (current.includes(metric)) {
        return current.filter((entry) => entry !== metric);
      }
      return [...current, metric];
    });
  };

  const printReadingTrends = () => {
    const batch = lineage?.batch ?? selectedBatch;
    if (!batch) {
      setStatus('Select a batch before printing trends.');
      return;
    }
    if (selectedReadingChartEntries.length === 0) {
      setStatus('Toggle at least one trend metric before printing.');
      return;
    }

    const printableWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printableWindow) {
      setStatus('Unable to open the print preview window.');
      return;
    }

    const primaryChart = selectedReadingChartEntries[0]?.chart;
    const isOverlay = selectedReadingChartEntries.length > 1;
    const printedAt = new Date().toLocaleString();
    const svgMarkup = primaryChart
      ? `
        <svg viewBox="0 0 ${primaryChart.width} ${primaryChart.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Batch trend chart">
          <rect width="${primaryChart.width}" height="${primaryChart.height}" fill="#ffffff" rx="16" />
          ${[0, 0.5, 1]
            .map((ratio) => {
              const y =
                primaryChart.top +
                ratio * (primaryChart.height - primaryChart.top - primaryChart.bottom);
              const label = !isOverlay
                ? (primaryChart.chartMax - ratio * (primaryChart.chartMax - primaryChart.chartMin)).toFixed(
                    selectedReadingChartEntries[0]?.config.digits ?? 2
                  )
                : '';
              return `
                <line x1="${primaryChart.left}" x2="${primaryChart.width - primaryChart.right}" y1="${y}" y2="${y}" stroke="#dbe4ee" stroke-dasharray="4 6" />
                ${
                  label
                    ? `<text x="${primaryChart.width - primaryChart.right}" y="${y - 6}" text-anchor="end" fill="#6b7280" font-size="11" font-family="Inter, Arial, sans-serif">${label}</text>`
                    : ''
                }
              `;
            })
            .join('')}
          <defs>
            ${!isOverlay
              ? `<linearGradient id="print-reading-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="${READING_METRIC_COLORS[selectedReadingChartEntries[0].metricKey].fill}" />
                  <stop offset="100%" stop-color="rgba(255,255,255,0)" />
                </linearGradient>`
              : ''}
          </defs>
          ${!isOverlay ? `<path d="${primaryChart.areaPath}" fill="url(#print-reading-gradient)" />` : ''}
          ${selectedReadingChartEntries
            .map(
              ({ metricKey, chart }) => `
                <path d="${chart.path}" fill="none" stroke="${READING_METRIC_COLORS[metricKey].stroke}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
                ${chart.points
                  .map(
                    (point) => `
                      <circle cx="${point.x}" cy="${point.y}" r="3.5" fill="${READING_METRIC_COLORS[metricKey].stroke}" stroke="#ffffff" stroke-width="1.5" />
                    `
                  )
                  .join('')}
              `
            )
            .join('')}
        </svg>
      `
      : '';

    const metricCardsMarkup = selectedReadingChartEntries
      .map(
        ({ metricKey, chart, config }) => `
          <div class="metric-card">
            <div class="metric-label">${config.label}</div>
            <div class="metric-row">
              <span>Current</span>
              <strong>${formatMaybeNumber(chart.latestValue, config.digits, config.suffix)}</strong>
            </div>
            <div class="metric-row">
              <span>Low</span>
              <strong>${formatMaybeNumber(chart.minValue, config.digits, config.suffix)}</strong>
            </div>
            <div class="metric-row">
              <span>High</span>
              <strong>${formatMaybeNumber(chart.maxValue, config.digits, config.suffix)}</strong>
            </div>
          </div>
        `
      )
      .join('');

    printableWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Batch Trend Report</title>
          <style>
            body {
              font-family: Inter, Arial, sans-serif;
              color: #0f172a;
              margin: 32px;
              background: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              align-items: flex-start;
              margin-bottom: 24px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 18px;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 6px;
            }
            .subtitle, .meta, .note {
              color: #475569;
              font-size: 13px;
              margin: 4px 0;
            }
            .badge-row {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin: 16px 0;
            }
            .badge {
              border: 1px solid #cbd5e1;
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              background: #f8fafc;
            }
            .chart-shell {
              border: 1px solid #cbd5e1;
              border-radius: 18px;
              padding: 16px;
              margin: 20px 0 24px;
              background: #f8fafc;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin-top: 18px;
            }
            .metric-card {
              border: 1px solid #dbe4ee;
              border-radius: 14px;
              padding: 14px;
              background: #ffffff;
            }
            .metric-label {
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .metric-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 4px 0;
              font-size: 13px;
            }
            @media print {
              body {
                margin: 18px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Batch Trend Report</h1>
              <p class="subtitle">${batch.recipeName}</p>
              <p class="meta">${batch.batchCode ?? batch.lotCode}</p>
            </div>
            <div>
              <p class="meta"><strong>Printed:</strong> ${printedAt}</p>
              <p class="meta"><strong>Status:</strong> ${batch.status.replaceAll('_', ' ')}</p>
            </div>
          </div>
          <div class="badge-row">
            ${selectedReadingChartEntries
              .map(({ config }) => `<span class="badge">${config.label}</span>`)
              .join('')}
          </div>
          <p class="note">
            ${
              isOverlay
                ? 'Overlay view uses per-metric normalization so different units can share the same chart cleanly.'
                : 'Single-metric view preserves the original value scale.'
            }
          </p>
          <div class="chart-shell">
            ${svgMarkup}
          </div>
          <div class="metrics-grid">
            ${metricCardsMarkup}
          </div>
        </body>
      </html>
    `);
    printableWindow.document.close();
    printableWindow.focus();
    window.setTimeout(() => {
      printableWindow.print();
    }, 150);
  };

  return (
    <AppShell currentSuite="os" pageTitle="Batches">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Batches</h1>
            <p className="mt-1 text-muted-foreground">
              Active production records, lineage, and brewday handoff for cellar-to-packaging work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {routeBatchId ? (
              <Button variant="secondary" onClick={() => navigate('/os/batches')}>
                Back to Batch Board
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate('/os/recipe-execution')}>
              Recipe Launcher
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/transfers')}>
              Transfers
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/packaging')}>
              Packaging
            </Button>
            <Button onClick={() => navigate('/os/batches/new')}>New Batch</Button>
          </div>
        </div>

        {!routeBatchId ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title:
                    batchFilter === 'history'
                      ? 'History Showing'
                      : batchFilter === 'all'
                        ? 'Batches Showing'
                        : 'Active Batches',
                  value: visibleSummary.total,
                  subtitle:
                    batchFilter === 'history'
                      ? 'historical records in view'
                      : 'open board records',
                  icon: Boxes,
                  accentClass:
                    'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
                  iconClass: 'text-cyan-300',
                  lineClass: 'via-cyan-300/40',
                  onClick: () => {
                    setBatchFilter(batchFilter === 'history' ? 'history' : 'active');
                    setBatchStatusFilter('all');
                  },
                },
                {
                  title: 'In Progress',
                  value: visibleSummary.inProgress,
                  subtitle: 'currently moving through production',
                  icon: FlaskConical,
                  accentClass:
                    'border-sky-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(56,189,248,0.12)]',
                  iconClass: 'text-sky-300',
                  lineClass: 'via-sky-300/40',
                  onClick: () => {
                    setBatchFilter('active');
                    setBatchStatusFilter((current) => (current === 'in_progress' ? 'all' : 'in_progress'));
                  },
                },
                {
                  title: 'Ready to Package / Release',
                  value: visibleSummary.readyToRelease,
                  subtitle: 'completed batches awaiting next step',
                  icon: PackageCheck,
                  accentClass:
                    'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
                  iconClass: 'text-amber-300',
                  lineClass: 'via-amber-300/40',
                  onClick: () => {
                    setBatchFilter('active');
                    setBatchStatusFilter((current) => (current === 'completed' ? 'all' : 'completed'));
                  },
                },
                {
                  title: 'Released to OPS',
                  value: visibleSummary.released,
                  subtitle: 'handed off for downstream execution',
                  icon: CheckCircle2,
                  accentClass:
                    'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]',
                  iconClass: 'text-emerald-300',
                  lineClass: 'via-emerald-300/40',
                  onClick: () => {
                    setBatchFilter('all');
                    setBatchStatusFilter((current) => (current === 'released' ? 'all' : 'released'));
                  },
                },
              ].map((tile) => {
                const Icon = tile.icon;
                const isActive =
                  (tile.title === 'In Progress' && batchStatusFilter === 'in_progress') ||
                  (tile.title === 'Ready to Package / Release' && batchStatusFilter === 'completed') ||
                  (tile.title === 'Released to OPS' && batchStatusFilter === 'released') ||
                  ((tile.title === 'Active Batches' ||
                    tile.title === 'Batches Showing' ||
                    tile.title === 'History Showing') &&
                    batchStatusFilter === 'all');
                return (
                  <button key={tile.title} type="button" className="text-left" onClick={tile.onClick}>
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
                              Batch Board
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

            <div className="space-y-3">
              <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Batch Board</h2>
                  <p className="text-sm text-muted-foreground">
                    Active and historical batches live here so you can quickly find the one you want to open.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search batch code, recipe, or product"
                    className="md:w-[320px]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['active', 'Active'],
                      ['history', 'History'],
                      ['all', 'All'],
                    ] as const).map(([value, label]) => (
                      <Button
                        key={value}
                        variant={batchFilter === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setBatchFilter(value);
                          setBatchStatusFilter('all');
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                    {batchStatusFilter !== 'all' ? (
                      <Button variant="outline" size="sm" onClick={() => setBatchStatusFilter('all')}>
                        Clear Tile Filter
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
          {batches.length === 0 ? (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No batches yet. Start from Recipe Launcher or create a manual batch.
              </CardContent>
            </Card>
          ) : visibleBatches.length === 0 ? (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No batches match the current board filter. Switch to another view or clear the search.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {visibleBatches.map((batch) => {
                const availableQty = Math.max(
                  0,
                  batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)
                );
                const thumbnail = selectProductImage(batch.productSnapshot?.images, 'thumbnail');
                const statusCue = getBoardStatusCue(batch.status);
                const currentGravity =
                  batch.actualResults?.sgLatest ?? batch.actualResults?.fg;
                return (
                  <Card
                    key={batch.id}
                    className="flex h-full cursor-pointer flex-col border-white/10 bg-white/5 transition-colors hover:border-cyan-500/60 hover:bg-cyan-500/5 backdrop-blur-sm"
                    onClick={() => navigate(`/os/batches/${batch.id}`)}
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-start gap-4">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={batch.productSnapshot?.productName ?? batch.recipeName}
                            className="h-[4.5rem] w-[4.5rem] rounded-2xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-muted-foreground">
                            No art
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <CardTitle className="truncate">{batch.recipeName}</CardTitle>
                              <CardDescription className="truncate">
                                {batch.batchCode ?? batch.lotCode}
                                {batch.plannedVesselLabel ? ` • ${batch.plannedVesselLabel}` : ''}
                              </CardDescription>
                            </div>
                            <span
                              className={`rounded-md border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${statusCue.className}`}
                            >
                              {statusCue.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              {batch.batchKind === 'derived' ? 'derived' : 'base'}
                            </Badge>
                            <Badge variant="outline">
                              {batch.productionMode === 'cellar' ? 'cellar' : 'runboard'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {batch.scheduledStartAt
                              ? `Scheduled ${new Date(batch.scheduledStartAt).toLocaleString()}`
                              : `Updated ${new Date(batch.updatedAt).toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Available
                          </p>
                          <p className="text-xl font-semibold">{formatVolumeNumber(availableQty)}</p>
                          <p className="text-xs text-muted-foreground">{batch.unit}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Current Gravity
                          </p>
                          <p className="text-xl font-semibold">
                            {currentGravity !== undefined ? currentGravity.toFixed(3) : '--'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ABV {batch.actualResults?.abvPct?.toFixed(2) ?? '--'}%
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Temp
                          </p>
                          <p className="text-xl font-semibold">
                            {batch.actualResults?.temperatureCLatest !== undefined
                              ? formatTemperatureValue(
                                  batch.actualResults.temperatureCLatest,
                                  temperatureUnit,
                                  1
                                )
                              : '--'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {temperatureUnit} • pH {batch.actualResults?.phLatest?.toFixed(2) ?? '--'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-4">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Produced {formatVolumeNumber(batch.producedQty)} {batch.unit} • Allocated{' '}
                          {formatVolumeNumber(batch.allocatedQty)} {batch.unit}
                        </p>
                        <p>
                          Site {batch.siteId}
                          {batch.recipeRunId ? ` • Run ${batch.recipeRunId}` : ''}
                          {batch.dispensedQty !== undefined && batch.dispensedQty > 0
                            ? ` • Dispensed ${formatVolumeNumber(batch.dispensedQty)} ${batch.unit}`
                            : ''}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Next Step
                          </p>
                          <p className="font-semibold">
                            {batch.status === 'completed'
                              ? 'Package or release'
                              : batch.status === 'planned'
                                ? 'Start batch'
                                : batch.status === 'released'
                                  ? 'View handoff'
                                  : 'Open batch record'}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
            </div>
          </>
        ) : selectedBatch ? (
          <>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {selectProductImage(selectedBatch.productSnapshot?.images, 'thumbnail') ? (
                    <img
                      src={selectProductImage(selectedBatch.productSnapshot?.images, 'thumbnail')}
                      alt={selectedBatch.productSnapshot?.productName ?? selectedBatch.recipeName}
                      className="h-24 w-24 rounded-2xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs text-muted-foreground">
                      No art
                    </div>
                  )}
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Batch Record</p>
                      <h2 className="text-2xl font-semibold">{selectedBatch.recipeName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedBatch.batchCode ?? selectedBatch.lotCode} • site {selectedBatch.siteId} • run{' '}
                        {selectedBatch.recipeRunId ?? '--'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={selectedBatch.status === 'released' ? 'secondary' : 'outline'}>
                        {selectedBatch.status.replaceAll('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {selectedBatch.batchKind === 'derived' ? 'derived batch' : 'source batch'}
                      </Badge>
                      <Badge variant="outline">
                        {selectedBatch.productionMode === 'cellar' ? 'cellar' : 'runboard'}
                      </Badge>
                      <Badge variant="outline">
                        Product{' '}
                        {selectedBatch.productSnapshot?.productCode ??
                          selectedBatch.productSnapshot?.productId ??
                          '--'}
                      </Badge>
                      <Badge variant="outline">SKU {selectedBatch.skuId ?? '--'}</Badge>
                    </div>
                    {selectedBatch.scheduledStartAt ? (
                      <p className="text-sm text-cyan-200/80">
                        Scheduled {new Date(selectedBatch.scheduledStartAt).toLocaleString()}
                        {selectedBatch.plannedVesselLabel ? ` • ${selectedBatch.plannedVesselLabel}` : ''}
                      </p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Produced</p>
                        <p className="text-xl font-semibold">{formatVolumeNumber(selectedBatch.producedQty)}</p>
                        <p className="text-xs text-muted-foreground">{selectedBatch.unit}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Available</p>
                        <p className="text-xl font-semibold">
                          {formatVolumeNumber(Math.max(
                            0,
                            selectedBatch.producedQty -
                              selectedBatch.allocatedQty -
                              (selectedBatch.dispensedQty ?? 0)
                          ))}
                        </p>
                        <p className="text-xs text-muted-foreground">{selectedBatch.unit}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Temp</p>
                        <p className="text-xl font-semibold">
                          {selectedBatch.actualResults?.temperatureCLatest !== undefined
                            ? formatTemperatureValue(
                                selectedBatch.actualResults.temperatureCLatest,
                                temperatureUnit,
                                1
                              )
                            : '--'}
                        </p>
                        <p
                          className={`text-xs ${getMetricGuardrailTextClass(
                            getMetricGuardrailTone('ph', selectedBatch.actualResults?.phLatest)
                          )}`}
                        >
                          pH {selectedBatch.actualResults?.phLatest?.toFixed(2) ?? '--'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">SG</p>
                        <p className="text-xl font-semibold">
                          {selectedBatch.actualResults?.sgLatest?.toFixed(3) ??
                            selectedBatch.actualResults?.fg?.toFixed(3) ??
                            '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">Current gravity</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">RS</p>
                        <p
                          className={`text-xl font-semibold ${getMetricGuardrailTextClass(
                            getMetricGuardrailTone(
                              'residualSugar',
                              batchOverviewResidualSugar,
                              {
                                targetResidualSugarPct:
                                  batchOverviewTargets?.targetResidualSugarPct,
                                targetSweetnessLevel:
                                  batchOverviewTargets?.targetSweetnessLevel,
                              }
                            )
                          )}`}
                        >
                          {batchOverviewResidualSugarPct !== undefined
                            ? `${batchOverviewResidualSugarPct.toFixed(2)}%`
                            : '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {batchOverviewResidualSugar !== undefined
                            ? `${batchOverviewResidualSugar.toFixed(2)} g/L`
                            : selectedBatch.actualResults?.residualSugarGplLatest !== undefined
                              ? 'Observed g/L'
                              : 'Estimated g/L'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedBatch.actualResults?.residualSugarGplLatest !== undefined
                            ? 'Observed'
                            : 'Estimated') +
                            (batchOverviewTargets?.targetSweetnessLevel
                              ? ` • ${getSweetnessLevelLabel(batchOverviewTargets.targetSweetnessLevel)} target`
                              : batchOverviewSweetnessLevel
                                ? ` • ${getSweetnessLevelLabel(batchOverviewSweetnessLevel)}`
                                : '')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-[340px]">
                  <Button variant="outline" onClick={() => openBatchEditor(selectedBatch)}>
                    Edit Identity
                  </Button>
                  <Button variant="outline" onClick={() => openProductionRecordEditor(selectedBatch)}>
                    Production Record
                  </Button>
                  <Button variant="outline" onClick={() => printBatchRecord()}>
                    Print Batch Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/os/transfers?sourceBatchId=${selectedBatch.id}`)}
                  >
                    Start Transfer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/os/packaging?sourceBatchId=${selectedBatch.id}`)}
                  >
                    Start Packaging
                  </Button>
                  <Button variant="outline" onClick={() => void updateBatch(selectedBatch, 'completed')}>
                    Mark Completed
                  </Button>
                  <Button onClick={() => void updateBatch(selectedBatch, 'released')}>
                    Release to OPS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        {routeBatchId ? (
        <Tabs value={detailTab} onValueChange={(value) => setDetailTab(value as BatchDetailTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="split-package">Split & Package</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(12,17,28,0.98)_0%,rgba(7,12,22,0.98)_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <CardHeader>
                <CardTitle>Batch Overview</CardTitle>
                <CardDescription>
                  Current batch state, key lab values, and release readiness.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!lineage ? (
                  <p className="text-sm text-muted-foreground">{lineageStatus}</p>
                ) : (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                          Production Snapshot
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {lineage.batch.batchCode ?? lineage.batch.lotCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {lineage.batch.recipeRunId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/os/brewday/${encodeURIComponent(lineage.batch.recipeRunId ?? '')}`
                              )
                            }
                          >
                            Open Runboard
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
                      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/65">OG</p>
                        <p className="mt-4 font-mono text-[1.9rem] font-semibold leading-none text-cyan-50">
                          {lineage.batch.actualResults?.og !== undefined
                            ? lineage.batch.actualResults.og.toFixed(3)
                            : '--'}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-100/65">Current Gravity</p>
                        <p className="mt-4 font-mono text-[1.9rem] font-semibold leading-none text-emerald-50">
                          {batchOverviewCurrentGravity !== undefined
                            ? batchOverviewCurrentGravity.toFixed(3)
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-emerald-100/50">
                          {batchOverviewCurrentGravityLabel}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-amber-100/65">ABV</p>
                        <p
                          className={`mt-4 font-mono text-[1.9rem] font-semibold leading-none ${getMetricGuardrailTextClass(
                            getMetricGuardrailTone('abv', lineage.batch.actualResults?.abvPct)
                          )}`}
                        >
                          {lineage.batch.actualResults?.abvPct !== undefined
                            ? `${lineage.batch.actualResults.abvPct.toFixed(2)}%`
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-amber-100/50">
                          Calculated from OG and current gravity
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/65">Temp</p>
                        <p className="mt-4 font-mono text-[1.9rem] font-semibold leading-none text-cyan-50">
                          {lineage.batch.actualResults?.temperatureCLatest !== undefined
                            ? `${formatTemperatureValue(lineage.batch.actualResults.temperatureCLatest, temperatureUnit, 1)} °${temperatureUnit}`
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-cyan-100/50">
                          Latest tank reading
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(232,121,249,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-fuchsia-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-fuchsia-100/65">pH</p>
                        <p
                          className={`mt-4 font-mono text-[1.9rem] font-semibold leading-none ${getMetricGuardrailTextClass(
                            getMetricGuardrailTone('ph', lineage.batch.actualResults?.phLatest)
                          )}`}
                        >
                          {lineage.batch.actualResults?.phLatest !== undefined
                            ? lineage.batch.actualResults.phLatest.toFixed(2)
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-fuchsia-100/50">
                          Latest tank reading
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-100/65">Brix</p>
                        <p className="mt-4 font-mono text-[1.9rem] font-semibold leading-none text-emerald-50">
                          {batchOverviewBrix !== undefined
                            ? batchOverviewBrix.toFixed(2)
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-emerald-100/50">
                          {lineage.batch.actualResults?.brixLatest !== undefined ? 'Observed' : 'Estimated'}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-lime-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(163,230,53,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-lime-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-lime-100/65">Apparent Attenuation</p>
                        <p className="mt-4 text-lg font-semibold text-white">
                          {batchOverviewApparentAttenuation !== undefined
                            ? `${batchOverviewApparentAttenuation.toFixed(1)}%`
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-lime-100/50">
                          Estimated from OG and current gravity
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-violet-100/65">TA</p>
                        <p className="mt-4 text-lg font-semibold text-violet-50">
                          {lineage.batch.actualResults?.titratableAcidityGplLatest !== undefined
                            ? `${lineage.batch.actualResults.titratableAcidityGplLatest.toFixed(2)} g/L`
                            : '--'}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-amber-100/65">SO2 / Sulfite</p>
                        <p className="mt-4 text-lg font-semibold text-white">
                          {lineage.batch.actualResults?.so2PpmLatest !== undefined
                            ? `${lineage.batch.actualResults.so2PpmLatest.toFixed(0)} ppm`
                            : '--'}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-100/65">Residual Sugar</p>
                        <p
                          className={`mt-4 text-lg font-semibold ${getMetricGuardrailTextClass(
                            getMetricGuardrailTone(
                              'residualSugar',
                              batchOverviewResidualSugar,
                              {
                                targetResidualSugarPct:
                                  batchOverviewTargets?.targetResidualSugarPct,
                                targetSweetnessLevel:
                                  batchOverviewTargets?.targetSweetnessLevel,
                              }
                            )
                          )}`}
                        >
                          {batchOverviewResidualSugarPct !== undefined
                            ? `${batchOverviewResidualSugarPct.toFixed(2)}%`
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-emerald-100/50">
                          {batchOverviewResidualSugar !== undefined
                            ? `${batchOverviewResidualSugar.toFixed(2)} g/L`
                            : '--'}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-emerald-100/50">
                          {(lineage.batch.actualResults?.residualSugarGplLatest !== undefined
                            ? 'Observed'
                            : 'Estimated from gravity') +
                            (batchOverviewTargets?.targetSweetnessLevel
                              ? ` • ${getSweetnessLevelLabel(batchOverviewTargets.targetSweetnessLevel)} target`
                              : batchOverviewSweetnessLevel
                                ? ` • ${getSweetnessLevelLabel(batchOverviewSweetnessLevel)}`
                                : '')}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-violet-100/65">VA</p>
                        <p className="mt-4 text-lg font-semibold text-violet-50">
                          {lineage.batch.actualResults?.volatileAcidityGplLatest !== undefined
                            ? `${lineage.batch.actualResults.volatileAcidityGplLatest.toFixed(2)} g/L`
                            : '--'}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]">
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-amber-100/65">Free / Total SO2</p>
                        <p
                          className={`mt-4 text-lg font-semibold ${getMetricGuardrailTextClass(
                            getMetricGuardrailTone('freeSo2', lineage.batch.actualResults?.freeSo2PpmLatest)
                          )}`}
                        >
                          {lineage.batch.actualResults?.freeSo2PpmLatest !== undefined
                            ? lineage.batch.actualResults.freeSo2PpmLatest.toFixed(0)
                            : '--'}{' '}
                          /{' '}
                          {lineage.batch.actualResults?.totalSo2PpmLatest !== undefined
                            ? lineage.batch.actualResults.totalSo2PpmLatest.toFixed(0)
                            : '--'}
                        </p>
                      </div>
                    </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,28,0.98)_0%,rgba(7,12,22,0.98)_100%)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                            Live Trend
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Current fermentation and cellar curve for the selected batch.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {readingMetricConfigs.map((metric) => (
                            <Button
                              key={`overview-${metric.key}`}
                              variant={activeReadingMetrics.includes(metric.key) ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => toggleReadingMetric(metric.key)}
                            >
                              {metric.label}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setDetailTab('history')}>
                            Open Full Trends
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click a metric to show or hide it on the shared graph.
                      </p>
                      {selectedReadingChartEntries.length > 0 && readingChart ? (
                        <div className="space-y-4">
                          {selectedReadingChartEntries.length > 1 ? (
                            <p className="text-xs text-muted-foreground">
                              Overlay view is normalized per metric so different units can share one graph cleanly.
                            </p>
                          ) : null}
                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                            <svg viewBox={`0 0 ${readingChart.width} ${readingChart.height}`} className="h-[220px] w-full">
                              <defs>
                                {selectedReadingChartEntries.length === 1 ? (
                                  <linearGradient id={`overview-reading-gradient-${primaryReadingChartEntry?.metricKey ?? 'single'}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={READING_METRIC_COLORS[primaryReadingChartEntry?.metricKey ?? 'sg'].fill} />
                                    <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                                  </linearGradient>
                                ) : null}
                              </defs>
                              {[0, 0.5, 1].map((ratio) => {
                                const y = readingChart.top + ratio * (readingChart.height - readingChart.top - readingChart.bottom);
                                return (
                                  <g key={`overview-grid-${ratio}`}>
                                    <line
                                      x1={readingChart.left}
                                      x2={readingChart.width - readingChart.right}
                                      y1={y}
                                      y2={y}
                                      stroke="rgba(255,255,255,0.08)"
                                      strokeDasharray="4 8"
                                    />
                                    {selectedReadingChartEntries.length === 1 ? (
                                      <text
                                        x={readingChart.width - readingChart.right}
                                        y={y - 6}
                                        textAnchor="end"
                                        fill="rgba(226,232,240,0.58)"
                                        fontSize="11"
                                      >
                                        {(readingChart.chartMax - ratio * (readingChart.chartMax - readingChart.chartMin)).toFixed(readingMetricConfig.digits)}
                                      </text>
                                    ) : null}
                                  </g>
                                );
                              })}
                              {selectedReadingChartEntries.length === 1 ? (
                                <path d={readingChart.areaPath} fill={`url(#overview-reading-gradient-${primaryReadingChartEntry?.metricKey ?? 'single'})`} />
                              ) : null}
                              {selectedReadingChartEntries.map(({ metricKey, chart }) => (
                                <g key={`overview-overlay-${metricKey}`}>
                                  <path
                                    d={chart.path}
                                    fill="none"
                                    stroke={READING_METRIC_COLORS[metricKey].stroke}
                                    strokeWidth="3"
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                  />
                                  {chart.points.map((point: ReadingChart['points'][number]) => (
                                    <circle
                                      key={`overview-point-${point.id}`}
                                      cx={point.x}
                                      cy={point.y}
                                      r="3.5"
                                      fill={READING_METRIC_COLORS[metricKey].stroke}
                                      stroke="rgba(15,23,42,0.95)"
                                      strokeWidth="2"
                                    />
                                  ))}
                                </g>
                              ))}
                            </svg>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {selectedReadingChartEntries.map(({ metricKey, chart, config }) => (
                              <div key={`overview-metric-${metricKey}`} className={`rounded-2xl border px-4 py-4 ${config.colorClass}`}>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <p className="text-[11px] uppercase tracking-[0.24em] text-current/70">{config.label}</p>
                                  <span
                                    className="inline-flex h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: READING_METRIC_COLORS[metricKey].stroke }}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">Current</p>
                                    <p className="mt-2 font-mono text-lg font-semibold">{formatMaybeNumber(chart.latestValue, config.digits, config.suffix)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">Low</p>
                                    <p className="mt-2 font-mono text-lg font-semibold">{formatMaybeNumber(chart.minValue, config.digits, config.suffix)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">High</p>
                                    <p className="mt-2 font-mono text-lg font-semibold">{formatMaybeNumber(chart.maxValue, config.digits, config.suffix)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : activeReadingMetrics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No metrics selected. Click a metric to build the trend view.
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No readings recorded yet for the selected metrics. Add readings in Process to build the trend.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,28,0.98)_0%,rgba(7,12,22,0.98)_100%)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                            Packaging Release / Final Lab
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Final observed values used for finish and release sign-off. Cellar estimates stay in process; this panel stays clean.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={missingFinalLabFields.length === 0 ? 'secondary' : 'outline'}>
                            {REQUIRED_FINAL_LAB_FIELDS.length - missingFinalLabFields.length} / {REQUIRED_FINAL_LAB_FIELDS.length} required
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProductionRecordAndFocus(lineage.batch, 'batch-final-lab-abv')}
                          >
                            Open Final Lab
                          </Button>
                        </div>
                      </div>
                      <p className="mb-4 text-xs text-muted-foreground">
                        Guardrails use the batch target profile when it is set. Otherwise OS falls back to the default cellar thresholds.
                      </p>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                        {REQUIRED_FINAL_LAB_FIELDS.map((field) => {
                          const value = lineage.batch.actualResults?.[field.key];
                          const isReady = Number.isFinite(Number(value));
                          const tone =
                            field.key === 'finalLabAbvPct'
                              ? getMetricGuardrailTone('abv', typeof value === 'number' ? value : undefined)
                              : field.key === 'finalLabPh'
                                ? getMetricGuardrailTone('ph', typeof value === 'number' ? value : undefined)
                                : field.key === 'finalLabResidualSugarGpl'
                                  ? getMetricGuardrailTone(
                                      'residualSugar',
                                      typeof value === 'number' ? value : undefined,
                                      {
                                        targetResidualSugarPct:
                                          batchOverviewTargets?.targetResidualSugarPct,
                                        targetSweetnessLevel:
                                          batchOverviewTargets?.targetSweetnessLevel,
                                      }
                                    )
                                  : field.key === 'finalLabFreeSo2Ppm'
                                    ? getMetricGuardrailTone('freeSo2', typeof value === 'number' ? value : undefined)
                                    : 'normal';
                          const formattedValue =
                            field.key === 'finalLabAbvPct'
                              ? formatMaybeNumber(
                                  typeof value === 'number' ? value : undefined,
                                  2,
                                  '%'
                                )
                              : field.key === 'finalLabPh'
                                ? formatMaybeNumber(typeof value === 'number' ? value : undefined, 2)
                                : field.key.includes('So2')
                                  ? formatMaybeNumber(
                                      typeof value === 'number' ? value : undefined,
                                      0,
                                      ' ppm'
                                    )
                                  : formatMaybeNumber(
                                      typeof value === 'number' ? value : undefined,
                                      2,
                                      ' g/L'
                                    );
                          return (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() => openProductionRecordAndFocus(lineage.batch, field.inputId)}
                              className={`rounded-2xl border px-4 py-4 text-left transition hover:border-cyan-300/35 hover:bg-white/5 ${
                                isReady
                                  ? 'border-cyan-400/15 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)]'
                                  : 'border-amber-500/20 bg-amber-500/5'
                              }`}
                            >
                              <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/65">
                                {field.label}
                              </p>
                              <p
                                className={`mt-4 text-lg font-semibold ${
                                  isReady ? getMetricGuardrailTextClass(tone) : 'text-white'
                                }`}
                              >
                                {formattedValue}
                              </p>
                              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                {isReady ? 'Observed final value' : 'Missing for release'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Recorded{' '}
                          {lineage.batch.actualResults?.finalLabRecordedAt
                            ? new Date(lineage.batch.actualResults.finalLabRecordedAt).toLocaleString()
                            : '--'}
                        </span>
                        <span>
                          By {lineage.batch.actualResults?.finalLabRecordedBy?.trim() || '--'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
                      <div className="rounded border border-border p-2">
                        <p className="text-xs text-muted-foreground">Package Lots</p>
                        <p className="font-mono">{lineage.packageLots.length}</p>
                      </div>
                      <div className="rounded border border-border p-2">
                        <p className="text-xs text-muted-foreground">Child Batches</p>
                        <p className="font-mono">{lineage.childBatches.length}</p>
                      </div>
                      <div className="rounded border border-border p-2">
                        <p className="text-xs text-muted-foreground">Reservations</p>
                        <p className="font-mono">{lineage.reservations.length}</p>
                      </div>
                      <div className="rounded border border-border p-2">
                        <p className="text-xs text-muted-foreground">Movements</p>
                        <p className="font-mono">{lineage.movements.length}</p>
                      </div>
                      <div className="rounded border border-border p-2">
                        <p className="text-xs text-muted-foreground">Fulfillment Links</p>
                        <p className="font-mono">{lineage.fulfillmentRequests.length}</p>
                      </div>
                    </div>

                    {lineage.batch.productSnapshot ? (
                      <div className="grid grid-cols-1 gap-4 rounded-lg border border-border p-3 md:grid-cols-[240px_1fr]">
                        <div>
                          {selectProductImage(lineage.batch.productSnapshot.images, 'card') ? (
                            <img
                              src={selectProductImage(lineage.batch.productSnapshot.images, 'card')}
                              alt={lineage.batch.productSnapshot.productName}
                              className="h-48 w-full rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                              No card image saved
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <div className="rounded border border-border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Product</p>
                            <p className="font-medium">{lineage.batch.productSnapshot.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {lineage.batch.productSnapshot.productCode ?? lineage.batch.productSnapshot.productId}
                            </p>
                          </div>
                          <div className="rounded border border-border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Label Version</p>
                            <p className="font-medium">
                              {lineage.batch.productSnapshot.labelVersionId ?? '--'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Asset {lineage.batch.productSnapshot.labelAssetId ?? '--'}
                            </p>
                          </div>
                          <div className="rounded border border-border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Beverage Class</p>
                            <p className="font-medium uppercase">
                              {lineage.batch.productSnapshot.beverageClass}
                            </p>
                          </div>
                          <div className="rounded border border-border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">SKU</p>
                            <p className="font-medium">{lineage.batch.skuId ?? '--'}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {pendingReadinessItems.length > 0 ? (
                    <div className="rounded border border-border p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Release Readiness
                          </p>
                          <p className="font-medium">
                            {selectedReadiness.requiredPassCount} / {selectedReadiness.requiredTotal}{' '}
                            required
                          </p>
                        </div>
                        <Badge variant={selectedReadiness.overallTone === 'ready' ? 'secondary' : 'outline'}>
                          {selectedReadiness.overallTone === 'ready' ? 'Ready' : 'Needs Review'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {pendingReadinessItems.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleReadinessAction(item.key)}
                            className={`w-full rounded border px-3 py-2 text-left transition hover:border-cyan-300/35 hover:bg-white/5 ${getReadinessTone(item).cardClass}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${getReadinessTone(item).dotClass}`} />
                                <p className="text-sm font-medium">{item.label}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                                  {item.required ? 'Required' : 'Advisory'}
                                </span>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${getReadinessTone(item).statusClass}`}>
                                  {getReadinessTone(item).label}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">
                              {item.key === 'product'
                                ? 'Open identity'
                                : item.key === 'packageLots'
                                  ? 'Go to split & package'
                                  : item.key === 'runLink'
                                    ? 'Go to history'
                                    : 'Jump to field'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Production Record Entry</CardTitle>
                    <CardDescription>
                      Add cellar entries and record current readings without leaving this batch.
                    </CardDescription>
                  </div>
                  <Button
                    variant={productionRecordEditMode ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (selectedBatch) {
                        if (productionRecordEditMode) {
                          setProductionRecordEditMode(false);
                          return;
                        }
                        openProductionRecordEditor(selectedBatch);
                      }
                    }}
                  >
                    {productionRecordEditMode ? 'Close' : 'Add Record'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBatch && !productionRecordEditMode ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Treatments</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedBatch.treatmentLog?.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Checkpoints</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedBatch.volumeCheckpoints?.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">QC Notes</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedBatch.sensoryQcRecords?.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Timeline</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedBatch.stageTimeline?.length ?? 0}</p>
                    </div>
                  </div>
                ) : null}

                {lineage ? (
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                          Record Current Readings
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Record observed lab and cellar values for this batch.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-1"><Label>OG</Label><Input id="batch-reading-og" className={highlightedBatchField === 'og' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.og} onChange={(event) => setReadingDraft((prev) => ({ ...prev, og: event.target.value }))} />{readingValidation.fieldErrors.og ? <p className="text-xs text-amber-300">{readingValidation.fieldErrors.og}</p> : null}</div>
                      <div className="space-y-1"><Label>FG</Label><Input id="batch-reading-fg" className={highlightedBatchField === 'abv' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.fg} onChange={(event) => setReadingDraft((prev) => ({ ...prev, fg: event.target.value }))} />{readingValidation.fieldErrors.fg ? <p className="text-xs text-amber-300">{readingValidation.fieldErrors.fg}</p> : null}</div>
                      <div className="space-y-1"><Label>Current SG</Label><Input id="batch-reading-sg" className={highlightedBatchField === 'sg' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.sg} onChange={(event) => setReadingDraft((prev) => ({ ...prev, sg: event.target.value }))} />{readingValidation.fieldErrors.sg ? <p className="text-xs text-amber-300">{readingValidation.fieldErrors.sg}</p> : null}</div>
                      <div className="space-y-1"><Label>{`Temp (°${temperatureUnit})`}</Label><Input id="batch-reading-temperature" className={highlightedBatchField === 'temperature' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.temperatureC} onChange={(event) => setReadingDraft((prev) => ({ ...prev, temperatureC: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>pH</Label><Input id="batch-reading-ph" className={highlightedBatchField === 'ph' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.ph} onChange={(event) => setReadingDraft((prev) => ({ ...prev, ph: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>Brix</Label><Input id="batch-reading-brix" className={highlightedBatchField === 'brix' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.brix} onChange={(event) => setReadingDraft((prev) => ({ ...prev, brix: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>TA (g/L)</Label><Input id="batch-reading-ta" className={highlightedBatchField === 'ta' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.titratableAcidityGpl} onChange={(event) => setReadingDraft((prev) => ({ ...prev, titratableAcidityGpl: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>SO2 / Sulfite (ppm)</Label><Input id="batch-reading-so2" className={highlightedBatchField === 'so2' ? 'border-cyan-300 ring-2 ring-cyan-300/40' : undefined} type="number" value={readingDraft.so2Ppm} onChange={(event) => setReadingDraft((prev) => ({ ...prev, so2Ppm: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>Residual Sugar (Observed g/L)</Label><Input type="number" value={readingDraft.residualSugarGpl} onChange={(event) => setReadingDraft((prev) => ({ ...prev, residualSugarGpl: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>VA (g/L)</Label><Input type="number" value={readingDraft.volatileAcidityGpl} onChange={(event) => setReadingDraft((prev) => ({ ...prev, volatileAcidityGpl: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>Free SO2 (ppm)</Label><Input type="number" value={readingDraft.freeSo2Ppm} onChange={(event) => setReadingDraft((prev) => ({ ...prev, freeSo2Ppm: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>Total SO2 (ppm)</Label><Input type="number" value={readingDraft.totalSo2Ppm} onChange={(event) => setReadingDraft((prev) => ({ ...prev, totalSo2Ppm: event.target.value }))} /></div>
                      <div className="space-y-1"><Label>Dissolved Oxygen (ppm)</Label><Input type="number" value={readingDraft.dissolvedOxygenPpm} onChange={(event) => setReadingDraft((prev) => ({ ...prev, dissolvedOxygenPpm: event.target.value }))} /></div>
                    </div>
                    <div className="mt-3 space-y-1"><Label>Reading Note (optional)</Label><Textarea value={readingDraft.note} onChange={(event) => setReadingDraft((prev) => ({ ...prev, note: event.target.value }))} /></div>
                    {readingValidation.issues.length > 0 ? <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">{readingValidation.issues.map((issue) => <p key={issue} className="text-xs text-amber-200">{issue}</p>)}</div> : null}
                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => void recordCurrentReadings()} disabled={!readingValidation.hasObservedInput || readingValidation.hasErrors}>Record Readings</Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="split-package" className="space-y-4">
            <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(12,17,28,0.98)_0%,rgba(7,12,22,0.98)_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <CardHeader>
                <CardTitle>Split & Package</CardTitle>
                <CardDescription>
                  Manage derived batches, package lots, and downstream fulfillment links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!lineage ? (
                  <p className="text-sm text-muted-foreground">{lineageStatus}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
                    <div className="rounded border border-border p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Child Batches</p>
                      {lineage.childBatches.length === 0 ? <p className="text-xs text-muted-foreground">No derived child batches yet.</p> : <div className="space-y-1 text-sm">{lineage.childBatches.map((child) => <button key={child.id} className="block w-full rounded border border-border/60 px-2 py-1 text-left font-mono text-xs hover:border-cyan-500/60 hover:bg-cyan-500/5" onClick={() => navigate(`/os/batches/${child.id}`)}>{(child.batchCode ?? child.lotCode)} • {child.productSnapshot?.productCode ?? child.containerLabel ?? child.containerKind ?? child.status}</button>)}</div>}
                    </div>

                    <div className="rounded border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Package Lots</p>
                        {lineage.packageLots.length > 0 ? <Button variant="outline" size="sm" onClick={() => navigate(`/os/packaged-products?batchId=${encodeURIComponent(lineage.batch.id)}`)}>Open View</Button> : null}
                      </div>
                      {lineage.packageLots.length === 0 ? <p className="text-xs text-muted-foreground">No package lots linked.</p> : <div className="space-y-1 text-sm">{lineage.packageLots.map((lot) => <p key={lot.id} className="font-mono text-xs">{lot.packageLotCode ?? lot.lotCode} • {lot.packageSkuId ?? lot.skuId ?? '--'} • {lot.packageType} • {lot.totalUnits} {lot.unitOfMeasure ?? 'units'} • {lot.releaseStatus ?? 'held'} • {lot.primaryAssetCode ?? '--'}</p>)}</div>}
                    </div>

                    <div className="rounded border border-border p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Fulfillment Requests</p>
                      {lineage.fulfillmentRequests.length === 0 ? <p className="text-xs text-muted-foreground">No fulfillment links yet.</p> : <div className="space-y-1 text-sm">{lineage.fulfillmentRequests.map((request) => <p key={request.id} className="font-mono text-xs">{request.requestId} • {request.status} • {request.requestedQty} {request.uom}</p>)}</div>}
                    </div>

                    <div className="rounded border border-border p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Next Actions</p>
                      <div className="space-y-2">
                        <Button className="w-full justify-start" variant="outline" onClick={() => navigate(`/os/transfers?sourceBatchId=${lineage.batch.id}`)}>Start Transfer</Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => navigate(`/os/packaging?sourceBatchId=${lineage.batch.id}`)}>Start Packaging</Button>
                        <Button className="w-full justify-start" variant="outline" onClick={() => void updateBatch(lineage.batch, 'completed')}>Mark Completed</Button>
                        <Button className="w-full justify-start" onClick={() => void updateBatch(lineage.batch, 'released')}>Release to OPS</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(12,17,28,0.98)_0%,rgba(7,12,22,0.98)_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>
                  Trends, stage history, source inputs, treatments, and inventory movement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!lineage ? (
                  <p className="text-sm text-muted-foreground">{lineageStatus}</p>
                ) : (
                  <>
                    <div className="rounded border border-border p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Volume Audit</p>
                          <p className="text-xs text-muted-foreground">
                            Manual adjustments, flow depletion, transfer depletion, packaging depletion, and recorded losses.
                          </p>
                        </div>
                        <Badge variant="outline">{volumeAuditTimeline.length} events</Badge>
                      </div>
                      {volumeAuditTimeline.length > 0 ? (
                        <div className="space-y-2">
                          {volumeAuditTimeline.slice(0, 10).map((entry) => {
                            const toneClass =
                              entry.tone === 'manual'
                                ? 'border-amber-500/20 bg-amber-500/5'
                                : entry.tone === 'flow'
                                  ? 'border-sky-500/20 bg-sky-500/5'
                                  : entry.tone === 'packaging'
                                    ? 'border-emerald-500/20 bg-emerald-500/5'
                                    : 'border-violet-500/20 bg-violet-500/5';
                            return (
                              <div key={entry.id} className={`rounded-lg border px-3 py-3 ${toneClass}`}>
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium">{entry.title}</p>
                                      <Badge variant="outline">{entry.qtyLabel}</Badge>
                                      {entry.lossLabel ? <Badge variant="secondary">Loss {entry.lossLabel}</Badge> : null}
                                    </div>
                                    {entry.note ? (
                                      <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
                                    ) : null}
                                  </div>
                                  <p className="shrink-0 text-xs text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No bulk-affecting audit events have been recorded yet.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Reading Trends</p>
                        <p className="text-sm text-muted-foreground">
                          Review fermentation and cellar movement over time without scanning raw logs.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {readingMetricConfigs.map((metric) => (
                          <Button
                            key={metric.key}
                            variant={
                              activeReadingMetrics.includes(metric.key)
                                ? 'secondary'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => toggleReadingMetric(metric.key)}
                          >
                            {metric.label}
                          </Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={printReadingTrends}>
                          Print Trends
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click a metric to show or hide it on the shared graph. Print uses the current selection.
                      </p>
                      {selectedReadingChartEntries.length > 0 && readingChart ? (
                        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                          {selectedReadingChartEntries.length > 1 ? (
                            <p className="text-xs text-muted-foreground">
                              Overlay view is normalized per metric so different units can share one graph cleanly.
                            </p>
                          ) : null}
                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                            <svg viewBox={`0 0 ${readingChart.width} ${readingChart.height}`} className="h-[260px] w-full">
                              <defs>
                                {selectedReadingChartEntries.length === 1 ? (
                                  <linearGradient id={`reading-gradient-${primaryReadingChartEntry?.metricKey ?? 'single'}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={READING_METRIC_COLORS[primaryReadingChartEntry?.metricKey ?? 'sg'].fill} />
                                    <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                                  </linearGradient>
                                ) : null}
                              </defs>
                              {[0, 0.5, 1].map((ratio) => {
                                const y = readingChart.top + ratio * (readingChart.height - readingChart.top - readingChart.bottom);
                                return (
                                  <g key={ratio}>
                                    <line x1={readingChart.left} x2={readingChart.width - readingChart.right} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                                    {selectedReadingChartEntries.length === 1 ? (
                                      <text x={readingChart.width - readingChart.right} y={y - 6} textAnchor="end" fill="rgba(226,232,240,0.58)" fontSize="11">
                                        {(readingChart.chartMax - ratio * (readingChart.chartMax - readingChart.chartMin)).toFixed(readingMetricConfig.digits)}
                                      </text>
                                    ) : null}
                                  </g>
                                );
                              })}
                              {selectedReadingChartEntries.length === 1 ? (
                                <path d={readingChart.areaPath} fill={`url(#reading-gradient-${primaryReadingChartEntry?.metricKey ?? 'single'})`} />
                              ) : null}
                              {selectedReadingChartEntries.map(({ metricKey, chart }) => (
                                <g key={`overlay-${metricKey}`}>
                                  <path d={chart.path} fill="none" stroke={READING_METRIC_COLORS[metricKey].stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                                  {chart.points.map((point: ReadingChart['points'][number]) => (
                                    <circle key={point.id} cx={point.x} cy={point.y} r="4" fill={READING_METRIC_COLORS[metricKey].stroke} stroke="rgba(15,23,42,0.95)" strokeWidth="2" />
                                  ))}
                                </g>
                              ))}
                            </svg>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {selectedReadingChartEntries.map(({ metricKey, chart, config }) => (
                              <div key={`metric-${metricKey}`} className={`rounded-2xl border px-4 py-4 ${config.colorClass}`}>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <p className="text-[11px] uppercase tracking-[0.24em] text-current/70">{config.label}</p>
                                  <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: READING_METRIC_COLORS[metricKey].stroke }} />
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">Current</p>
                                    <p className="mt-2 font-mono text-lg font-semibold">{formatMaybeNumber(chart.latestValue, config.digits, config.suffix)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">Low</p>
                                    <p className="mt-2 font-mono text-lg font-semibold">{formatMaybeNumber(chart.minValue, config.digits, config.suffix)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">High</p>
                                    <p className="mt-2 font-mono text-lg font-semibold">{formatMaybeNumber(chart.maxValue, config.digits, config.suffix)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : activeReadingMetrics.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No metrics selected. Click a metric to build the trend view.</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No readings recorded yet for the selected metrics.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      <div className="rounded border border-border p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Batch Timeline</p>
                        {lineage.batch.stageTimeline && lineage.batch.stageTimeline.length > 0 ? (
                          <div className="space-y-1 text-sm">
                            {lineage.batch.stageTimeline.slice(-8).reverse().map((entry) => (
                              <p key={entry.id} className="text-xs">
                                {entry.stage} • {new Date(entry.timestamp).toLocaleString()}
                                {entry.note ? ` • ${entry.note}` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No explicit stage events recorded yet.</p>
                        )}
                      </div>

                      <div className="rounded border border-border p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Source Inputs</p>
                        {lineage.batch.sourceInputs && lineage.batch.sourceInputs.length > 0 ? (
                          <div className="space-y-1 text-sm">
                            {lineage.batch.sourceInputs.map((entry) => (
                              <p key={entry.id} className="text-xs">
                                {entry.category} • {entry.name}
                                {entry.lotCode ? ` • ${entry.lotCode}` : ''}
                                {entry.quantity !== undefined ? ` • ${entry.quantity}` : ''}
                                {entry.unit ? ` ${normalizeProcessUnit(entry.unit, 'ppm')}` : ''}
                                {entry.brix !== undefined ? ` • ${entry.brix.toFixed(2)} Bx` : ''}
                                {entry.sourceName ? ` • ${entry.sourceName}` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No source ingredient inputs recorded yet.</p>
                        )}
                      </div>

                      <div className="rounded border border-border p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Cellar Treatments</p>
                        {lineage.batch.treatmentLog && lineage.batch.treatmentLog.length > 0 ? (
                          <div className="space-y-1 text-sm">
                            {lineage.batch.treatmentLog.slice(-8).reverse().map((entry) => (
                              <p key={entry.id} className="text-xs">
                                {entry.type}
                                {entry.stage ? ` • ${entry.stage}` : ''}
                                {entry.quantity !== undefined ? ` • ${entry.quantity}` : ''}
                                {entry.unit ? ` ${normalizeProcessUnit(entry.unit, 'ppm')}` : ''}
                                {entry.lotCode ? ` • ${entry.lotCode}` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No treatment events recorded yet.</p>
                        )}
                      </div>

                      <div className="rounded border border-border p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Sensory & QC</p>
                        {lineage.batch.sensoryQcRecords && lineage.batch.sensoryQcRecords.length > 0 ? (
                          <div className="space-y-1 text-sm">
                            {lineage.batch.sensoryQcRecords.slice(-6).reverse().map((entry) => (
                              <p key={entry.id} className="text-xs">
                                {entry.stage ?? 'cellar'} • {entry.passFail ?? '--'} • {entry.approvalDecision ?? '--'}
                                {entry.actor ? ` • ${entry.actor}` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No QC or release records logged yet.</p>
                        )}
                      </div>

                      <div className="rounded border border-border p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Volume Checkpoints</p>
                        {lineage.batch.volumeCheckpoints && lineage.batch.volumeCheckpoints.length > 0 ? (
                          <div className="space-y-1 text-sm">
                            {lineage.batch.volumeCheckpoints.slice(-8).reverse().map((entry) => (
                              <p key={entry.id} className="text-xs">
                                {entry.stage} • {entry.quantity} {normalizeVolumeUnit(entry.unit)}
                                {entry.note ? ` • ${entry.note}` : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No checkpoint volumes logged yet.</p>
                        )}
                      </div>

                      <div className="rounded border border-border p-3">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Inventory Movements</p>
                        {lineage.movements.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No movements recorded.</p>
                        ) : (
                          <div className="space-y-1 text-sm">
                            {lineage.movements.slice(0, 8).map((movement) => (
                              <p key={movement.id} className="font-mono text-xs">
                                {movement.type} • {movement.quantity} {movement.unit}
                                {movement.reasonCode ? ` • ${movement.reasonCode}` : ''}
                                {movement.actor ? ` • ${movement.actor}` : ''}
                                {movement.assetCode ? ` • ${movement.assetCode}` : ''}
                                {movement.reason ? ` • ${movement.reason}` : ''}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        ) : null}
          </>
        ) : null}

        <Dialog open={identityEditMode} onOpenChange={setIdentityEditMode}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[920px]">
            <DialogHeader>
              <DialogTitle>Edit Identity</DialogTitle>
              <DialogDescription>
                Update the batch name, SKU, and product art without leaving the batch record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Batch / Recipe Name</Label>
                  <Input value={editRecipeName} onChange={(event) => setEditRecipeName(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>SKU ID</Label>
                  <Input value={editSkuId} onChange={(event) => setEditSkuId(event.target.value)} placeholder="CIDER-DRY-KEG" />
                </div>
              </div>
              <ProductIdentityFields value={editProductIdentity} onChange={setEditProductIdentity} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIdentityEditMode(false)}>Cancel</Button>
                <Button onClick={() => void saveBatchIdentity()}>Save Identity</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={productionRecordEditMode} onOpenChange={setProductionRecordEditMode}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[1100px]">
            <DialogHeader>
              <DialogTitle>Production Record</DialogTitle>
              <DialogDescription>
                Add cellar entries, lab updates, and stage changes for the current batch.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Cellar Snapshot</p>
                    <p className="text-xs text-muted-foreground">
                      Working values used during production. Estimated process values can live here without becoming release data.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1"><Label>Residual Sugar (Observed g/L)</Label><Input type="number" value={labFieldDraft.residualSugarGplLatest} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, residualSugarGplLatest: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>VA (g/L)</Label><Input type="number" value={labFieldDraft.volatileAcidityGplLatest} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, volatileAcidityGplLatest: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Free SO2 (ppm)</Label><Input type="number" value={labFieldDraft.freeSo2PpmLatest} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, freeSo2PpmLatest: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Total SO2 (ppm)</Label><Input type="number" value={labFieldDraft.totalSo2PpmLatest} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, totalSo2PpmLatest: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Dissolved Oxygen (ppm)</Label><Input type="number" value={labFieldDraft.dissolvedOxygenPpmLatest} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, dissolvedOxygenPpmLatest: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Ending Volume</Label><Input type="number" value={labFieldDraft.finalVolumeQty} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalVolumeQty: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Volume Unit</Label><Select value={normalizeVolumeUnit(labFieldDraft.finalVolumeUnit)} onValueChange={(value) => setLabFieldDraft((prev) => ({ ...prev, finalVolumeUnit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VOLUME_UNIT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                </div>
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Packaging Release / Final Lab</p>
                      <p className="text-xs text-muted-foreground">
                        Observed final values required before OS marks the batch completed or released.
                      </p>
                    </div>
                    <Badge variant={missingFinalLabFields.length === 0 ? 'secondary' : 'outline'}>
                      {REQUIRED_FINAL_LAB_FIELDS.length - missingFinalLabFields.length} / {REQUIRED_FINAL_LAB_FIELDS.length} required
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1"><Label>Final ABV (%)</Label><Input id="batch-final-lab-abv" type="number" value={labFieldDraft.finalLabAbvPct} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabAbvPct: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final pH</Label><Input id="batch-final-lab-ph" type="number" value={labFieldDraft.finalLabPh} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabPh: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final Brix</Label><Input id="batch-final-lab-brix" type="number" value={labFieldDraft.finalLabBrix} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabBrix: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final Residual Sugar (g/L)</Label><Input id="batch-final-lab-rs" type="number" value={labFieldDraft.finalLabResidualSugarGpl} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabResidualSugarGpl: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final TA (g/L)</Label><Input id="batch-final-lab-ta" type="number" value={labFieldDraft.finalLabTitratableAcidityGpl} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabTitratableAcidityGpl: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final Free SO2 (ppm)</Label><Input id="batch-final-lab-free-so2" type="number" value={labFieldDraft.finalLabFreeSo2Ppm} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabFreeSo2Ppm: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final Total SO2 (ppm)</Label><Input id="batch-final-lab-total-so2" type="number" value={labFieldDraft.finalLabTotalSo2Ppm} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabTotalSo2Ppm: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Final Dissolved Oxygen (ppm)</Label><Input id="batch-final-lab-do" type="number" value={labFieldDraft.finalLabDissolvedOxygenPpm} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabDissolvedOxygenPpm: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Lab Tech / Operator</Label><Input id="batch-final-lab-operator" value={labFieldDraft.finalLabRecordedBy} onChange={(event) => setLabFieldDraft((prev) => ({ ...prev, finalLabRecordedBy: event.target.value }))} placeholder="Cellar / lab operator" /></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">Cellar Treatment Log</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Treatment Type</Label><Input value={treatmentDraft.type} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, type: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Stage</Label><Input value={treatmentDraft.stage} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, stage: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={treatmentDraft.quantity} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, quantity: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Unit</Label><Select value={normalizeProcessUnit(treatmentDraft.unit, 'ppm')} onValueChange={(value) => setTreatmentDraft((prev) => ({ ...prev, unit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROCESS_UNIT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Lot Code</Label><Input value={treatmentDraft.lotCode} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, lotCode: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Operator</Label><Input value={treatmentDraft.actor} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, actor: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Blend Batch Code</Label><Input value={treatmentDraft.blendBatchCode} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, blendBatchCode: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Blend Qty / Unit</Label><div className="flex gap-2"><Input type="number" value={treatmentDraft.blendQuantity} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, blendQuantity: event.target.value }))} /><Select value={normalizeVolumeUnit(treatmentDraft.blendUnit)} onValueChange={(value) => setTreatmentDraft((prev) => ({ ...prev, blendUnit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VOLUME_UNIT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div>
                  </div>
                  <div className="space-y-1"><Label>Notes</Label><Textarea value={treatmentDraft.note} onChange={(event) => setTreatmentDraft((prev) => ({ ...prev, note: event.target.value }))} /></div>
                </div>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">Checkpoint Volume & Yield</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Checkpoint Stage</Label><Input value={volumeCheckpointDraft.stage} onChange={(event) => setVolumeCheckpointDraft((prev) => ({ ...prev, stage: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Volume</Label><Input type="number" value={volumeCheckpointDraft.quantity} onChange={(event) => setVolumeCheckpointDraft((prev) => ({ ...prev, quantity: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Unit</Label><Select value={normalizeVolumeUnit(volumeCheckpointDraft.unit)} onValueChange={(value) => setVolumeCheckpointDraft((prev) => ({ ...prev, unit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VOLUME_UNIT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Operator</Label><Input value={volumeCheckpointDraft.actor} onChange={(event) => setVolumeCheckpointDraft((prev) => ({ ...prev, actor: event.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label>Notes</Label><Textarea value={volumeCheckpointDraft.note} onChange={(event) => setVolumeCheckpointDraft((prev) => ({ ...prev, note: event.target.value }))} /></div>
                </div>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">Sensory & QC</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Stage</Label><Input value={sensoryQcDraft.stage} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, stage: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Operator</Label><Input value={sensoryQcDraft.actor} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, actor: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Pass / Fail / Hold</Label><Input value={sensoryQcDraft.passFail} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, passFail: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Approval</Label><Input value={sensoryQcDraft.approvalDecision} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, approvalDecision: event.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label>Visual Notes</Label><Textarea value={sensoryQcDraft.visualNotes} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, visualNotes: event.target.value }))} /></div>
                  <div className="space-y-1"><Label>Aroma Notes</Label><Textarea value={sensoryQcDraft.aromaNotes} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, aromaNotes: event.target.value }))} /></div>
                  <div className="space-y-1"><Label>Taste Notes</Label><Textarea value={sensoryQcDraft.tasteNotes} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, tasteNotes: event.target.value }))} /></div>
                  <div className="space-y-1"><Label>Release / QC Note</Label><Textarea value={sensoryQcDraft.note} onChange={(event) => setSensoryQcDraft((prev) => ({ ...prev, note: event.target.value }))} /></div>
                </div>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">Batch Stage Timeline</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Stage Event</Label><Input value={stageTimelineDraft.stage} onChange={(event) => setStageTimelineDraft((prev) => ({ ...prev, stage: event.target.value }))} /></div>
                    <div className="space-y-1"><Label>Operator</Label><Input value={stageTimelineDraft.actor} onChange={(event) => setStageTimelineDraft((prev) => ({ ...prev, actor: event.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label>Note</Label><Textarea value={stageTimelineDraft.note} onChange={(event) => setStageTimelineDraft((prev) => ({ ...prev, note: event.target.value }))} /></div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setProductionRecordEditMode(false)}>Cancel</Button>
                <Button onClick={() => void saveProductionRecord()}>Save Production Record</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-xs text-muted-foreground">{status}</p>
      </div>
    </AppShell>
  );
}
