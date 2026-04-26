import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import ProcessAssetTile from '@/components/ProcessAssetTile';
import { useNotifications } from '@/contexts/NotificationContext';
import type { BatchProductSnapshot } from '@/features/products/types';
import {
  DEFAULT_PACKAGE_FORMAT_CODE,
  PACKAGE_FORMAT_OPTIONS,
  PACKAGE_STYLE_OPTIONS,
  suggestSkuCode,
} from '@/lib/identity-codes';
import { getComplianceSnapshotReadiness } from '@/lib/production-readiness';
import {
  LIQUID_UNIT_OPTIONS,
  coerceLiquidUnit,
  convertVolume,
  formatVolumeNumber,
  normalizeVolumeUnit,
} from '@/lib/volume-format';
import { formatTemperatureValue, useOsDisplaySettings } from '@/lib/os-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';

type PackagingRunStatus = 'active' | 'completed' | 'canceled';
type PackageType = 'keg' | 'can' | 'bottle' | 'case' | 'pallet' | 'other';
type BeverageClass = 'cider' | 'wine' | 'beer' | 'other';
type TransferSessionStatus = 'idle' | 'transferring_manual' | 'transferring_auto' | 'completed';

interface ComplianceGuidanceSettings {
  primarySalesChannel: 'direct_to_consumer' | 'mixed' | 'wholesale';
  interstateSalesDefault: boolean;
  retailFoodEstablishmentExemptLikely: boolean;
}

const OS_PACKAGE_TYPE_OPTIONS: Array<{ value: PackageType; label: string }> = [
  { value: 'keg', label: 'Keg' },
  { value: 'can', label: 'Can' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'other', label: 'Other' },
];

interface BatchRecord {
  id: string;
  siteId: string;
  batchCode?: string;
  skuId?: string;
  lotCode: string;
  recipeName: string;
  status: string;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  productSnapshot?: BatchProductSnapshot;
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
    volatileAcidityGplLatest?: number;
    freeSo2PpmLatest?: number;
    totalSo2PpmLatest?: number;
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
    updatedAt?: string;
  };
  sourceInputs?: Array<{ id: string }>;
  readingLog?: Array<{ id: string }>;
  treatmentLog?: Array<{ id: string }>;
  volumeCheckpoints?: Array<{ id: string }>;
  sensoryQcRecords?: Array<{ id: string }>;
  stageTimeline?: Array<{ id: string }>;
}

interface PackagingRunRecord {
  id: string;
  siteId: string;
  sourceBatchId: string;
  sourceLotCode: string;
  sourceRecipeName: string;
  sourceUnit: string;
  sourceAvailableQty: number;
  mode: 'manual' | 'auto';
  status: PackagingRunStatus;
  packageType: PackageType;
  packageFormatCode?: string;
  containerStyle?: string;
  outputSkuId: string;
  operator?: string;
  packageLineLabel?: string;
  lossReasonCode?: string;
  rejectionReasonCode?: string;
  assetId?: string;
  assetCode?: string;
  assetCodes?: string[];
  plannedUnits: number;
  completedUnits: number;
  rejectedUnits: number;
  sourceQtyUsed: number;
  lossQty: number;
  packageLotId?: string;
  packageLotCode?: string;
  notes?: string;
  startedAt?: string;
  updatedAt?: string;
  complianceSnapshot: {
    beverageClass: BeverageClass;
    brandName?: string;
    productName?: string;
    classDesignation?: string;
    taxClass?: 'hard_cider' | 'still_wine' | 'sparkling_wine' | 'beer' | 'other';
    colaReference?: string;
    formulaReference?: string;
    abvPct?: number;
    netContentsStatement?: string;
    appellation?: string;
    vintageYear?: string;
    sulfiteDeclaration?: string;
    healthWarningIncluded?: boolean;
    interstateSale?: boolean;
    formulaRequired?: boolean;
    fdaLabelReviewComplete?: boolean;
    ingredientStatementReviewed?: boolean;
    allergenReviewComplete?: boolean;
    hardCiderQualified?: boolean;
    notes?: string;
  };
}

interface FinalObservedDraft {
  finalLabAbvPct: string;
  finalLabPh: string;
  finalLabBrix: string;
  finalLabResidualSugarGpl: string;
  finalLabTitratableAcidityGpl: string;
  finalLabFreeSo2Ppm: string;
  finalLabTotalSo2Ppm: string;
  finalLabDissolvedOxygenPpm: string;
  finalLabRecordedBy: string;
}

const REQUIRED_FINAL_OBSERVED_FIELDS: Array<{
  key:
    | 'finalLabAbvPct'
    | 'finalLabPh'
    | 'finalLabResidualSugarGpl'
    | 'finalLabTitratableAcidityGpl'
    | 'finalLabFreeSo2Ppm'
    | 'finalLabTotalSo2Ppm';
  label: string;
}> = [
  { key: 'finalLabAbvPct', label: 'Final ABV' },
  { key: 'finalLabPh', label: 'Final pH' },
  { key: 'finalLabResidualSugarGpl', label: 'Final residual sugar' },
  { key: 'finalLabTitratableAcidityGpl', label: 'Final titratable acidity' },
  { key: 'finalLabFreeSo2Ppm', label: 'Final free SO2' },
  { key: 'finalLabTotalSo2Ppm', label: 'Final total SO2' },
];

const availableQty = (batch: BatchRecord | null): number =>
  batch ? Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)) : 0;

const formatValue = (value: number | undefined, digits: number, suffix = ''): string =>
  value !== undefined ? `${value.toFixed(digits)}${suffix}` : '--';

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const next = Number(trimmed);
  return Number.isFinite(next) ? next : undefined;
};

const buildFinalObservedDraft = (
  batch: BatchRecord | null,
  operator = ''
): FinalObservedDraft => ({
  finalLabAbvPct: batch?.actualResults?.finalLabAbvPct?.toString() ?? '',
  finalLabPh: batch?.actualResults?.finalLabPh?.toString() ?? '',
  finalLabBrix: batch?.actualResults?.finalLabBrix?.toString() ?? '',
  finalLabResidualSugarGpl: batch?.actualResults?.finalLabResidualSugarGpl?.toString() ?? '',
  finalLabTitratableAcidityGpl:
    batch?.actualResults?.finalLabTitratableAcidityGpl?.toString() ?? '',
  finalLabFreeSo2Ppm: batch?.actualResults?.finalLabFreeSo2Ppm?.toString() ?? '',
  finalLabTotalSo2Ppm: batch?.actualResults?.finalLabTotalSo2Ppm?.toString() ?? '',
  finalLabDissolvedOxygenPpm:
    batch?.actualResults?.finalLabDissolvedOxygenPpm?.toString() ?? '',
  finalLabRecordedBy: batch?.actualResults?.finalLabRecordedBy ?? operator,
});

const getMissingFinalObservedFields = (batch: BatchRecord | null): string[] =>
  REQUIRED_FINAL_OBSERVED_FIELDS.filter(
    ({ key }) => !Number.isFinite(Number(batch?.actualResults?.[key]))
  ).map(({ label }) => label);

const packageFormatLabel = (packageType: PackageType, packageFormatCode: string): string | undefined =>
  (PACKAGE_FORMAT_OPTIONS[packageType] ?? []).find((option) => option.code === packageFormatCode)?.label;

const derivePackageFormatSpec = (
  packageType: PackageType,
  packageFormatCode: string | undefined
): { unitSize: number; unitOfMeasure: string } | null => {
  const match = (PACKAGE_FORMAT_OPTIONS[packageType] ?? []).find(
    (option) => option.code === packageFormatCode
  );
  if (!match) return null;
  const spec = match.label.match(/(\d+(?:\.\d+)?)\s*(mL|L|oz|gal)\b/i);
  if (!spec) return null;
  return {
    unitSize: Number(spec[1]),
    unitOfMeasure: spec[2],
  };
};

const formatTransferQty = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '';
  const fixed = value.toFixed(6);
  return fixed.replace(/\.?0+$/, '');
};

const formatDisplayUnit = (unit: string): string => {
  const normalized = normalizeVolumeUnit(unit);
  if (normalized === 'bbl' || normalized === 'barrel' || normalized === 'barrels') return 'bbl';
  if (normalized === 'gal' || normalized === 'gallon' || normalized === 'gallons') return 'gal';
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters') return 'L';
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters') return 'mL';
  if (normalized === 'oz' || normalized === 'floz' || normalized === 'fluidounce' || normalized === 'fluidounces') {
    return 'oz';
  }
  return unit;
};

const formatTrimmedQty = (value: number, digits = 2): string => {
  if (!Number.isFinite(value)) return '0';
  return value.toFixed(digits).replace(/\.?0+$/, '');
};

const pluralizeLabel = (count: number, singular: string, plural?: string): string => {
  const absolute = Math.abs(count);
  if (Math.abs(absolute - 1) < 1e-9) return singular;
  if (plural) return plural;
  if (singular.toLowerCase().endsWith('s')) return singular;
  return plural ?? `${singular}s`;
};

const formatSourceUnitLabel = (count: number, unit: string): string => {
  const normalized = formatDisplayUnit(unit);
  if (normalized === 'bbl') {
    return pluralizeLabel(count, 'bbl', 'bbls');
  }
  if (normalized === 'units') {
    return pluralizeLabel(count, 'unit', 'units');
  }
  return normalized;
};

const deriveClassDesignation = (beverageClass: BeverageClass | undefined): string => {
  if (beverageClass === 'cider') return 'Cider';
  if (beverageClass === 'wine') return 'Wine';
  if (beverageClass === 'beer') return 'Beer';
  return '';
};

const DEFAULT_COMPLIANCE_GUIDANCE: ComplianceGuidanceSettings = {
  primarySalesChannel: 'direct_to_consumer',
  interstateSalesDefault: false,
  retailFoodEstablishmentExemptLikely: true,
};

const normalizeComplianceGuidance = (value: unknown): ComplianceGuidanceSettings => {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    primarySalesChannel:
      current.primarySalesChannel === 'mixed' || current.primarySalesChannel === 'wholesale'
        ? current.primarySalesChannel
        : 'direct_to_consumer',
    interstateSalesDefault:
      typeof current.interstateSalesDefault === 'boolean'
        ? current.interstateSalesDefault
        : DEFAULT_COMPLIANCE_GUIDANCE.interstateSalesDefault,
    retailFoodEstablishmentExemptLikely:
      typeof current.retailFoodEstablishmentExemptLikely === 'boolean'
        ? current.retailFoodEstablishmentExemptLikely
        : DEFAULT_COMPLIANCE_GUIDANCE.retailFoodEstablishmentExemptLikely,
  };
};

const formatSalesChannelLabel = (value: ComplianceGuidanceSettings['primarySalesChannel']): string => {
  if (value === 'wholesale') return 'Wholesale primary';
  if (value === 'mixed') return 'Mixed channel';
  return 'Direct-to-consumer primary';
};

const getComplianceReadinessTone = (item: { ok: boolean; required: boolean }) => {
  if (item.ok && item.required) {
    return {
      cardClass: 'border-emerald-500/25 bg-emerald-500/8',
      statusClass: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
      dotClass: 'bg-emerald-300',
      label: 'Ready',
    };
  }
  if (item.ok && !item.required) {
    return {
      cardClass: 'border-sky-500/25 bg-sky-500/8',
      statusClass: 'border-sky-400/20 bg-sky-500/10 text-sky-200',
      dotClass: 'bg-sky-300',
      label: 'Reviewed',
    };
  }
  if (!item.ok && item.required) {
    return {
      cardClass: 'border-rose-500/25 bg-rose-500/8',
      statusClass: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
      dotClass: 'bg-rose-300',
      label: 'Missing',
    };
  }
  return {
    cardClass: 'border-amber-500/25 bg-amber-500/8',
    statusClass: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
    dotClass: 'bg-amber-300',
    label: 'Needs Review',
  };
};

const toComplianceForm = (snapshot: PackagingRunRecord['complianceSnapshot']) => ({
  beverageClass: snapshot.beverageClass ?? ('cider' as BeverageClass),
  brandName: snapshot.brandName ?? '',
  productName: snapshot.productName ?? '',
  classDesignation: snapshot.classDesignation ?? '',
  taxClass: snapshot.taxClass ?? 'other',
  colaReference: snapshot.colaReference ?? '',
  formulaReference: snapshot.formulaReference ?? '',
  abvPct: snapshot.abvPct !== undefined ? snapshot.abvPct.toFixed(2) : '',
  netContentsStatement: snapshot.netContentsStatement ?? '',
  appellation: snapshot.appellation ?? '',
  vintageYear: snapshot.vintageYear ?? '',
  sulfiteDeclaration: snapshot.sulfiteDeclaration ?? '',
  healthWarningIncluded: snapshot.healthWarningIncluded ?? true,
  interstateSale: snapshot.interstateSale ?? false,
  formulaRequired: snapshot.formulaRequired ?? false,
  fdaLabelReviewComplete: snapshot.fdaLabelReviewComplete ?? false,
  ingredientStatementReviewed: snapshot.ingredientStatementReviewed ?? false,
  allergenReviewComplete: snapshot.allergenReviewComplete ?? false,
  hardCiderQualified: snapshot.hardCiderQualified ?? false,
  notes: snapshot.notes ?? '',
});

export default function PackagingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  const { temperatureUnit } = useOsDisplaySettings();
  const searchSourceBatchId = searchParams.get('sourceBatchId') ?? '';
  const searchComplianceOpen = searchParams.get('compliance') === '1';
  const searchComplianceFocus = searchParams.get('focus')?.trim() ?? '';

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [runs, setRuns] = useState<PackagingRunRecord[]>([]);
  const [sourceBatchId, setSourceBatchId] = useState(searchParams.get('sourceBatchId') ?? '');
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [packageType, setPackageType] = useState<PackageType>('keg');
  const [packageFormatCode, setPackageFormatCode] = useState(DEFAULT_PACKAGE_FORMAT_CODE.keg);
  const [containerStyle, setContainerStyle] = useState('');
  const [outputSkuId, setOutputSkuId] = useState('');
  const [lastAutoSkuId, setLastAutoSkuId] = useState('');
  const [plannedUnits, setPlannedUnits] = useState('1');
  const [completedUnits, setCompletedUnits] = useState('1');
  const [completedUnitsTouched, setCompletedUnitsTouched] = useState(false);
  const [rejectedUnits, setRejectedUnits] = useState('0');
  const [sourceQtyUsed, setSourceQtyUsed] = useState('0');
  const [sourceQtyUsedTouched, setSourceQtyUsedTouched] = useState(false);
  const [lossQty, setLossQty] = useState('0');
  const [lossUnit, setLossUnit] = useState('bbl');
  const [operator, setOperator] = useState('');
  const [packageLineLabel, setPackageLineLabel] = useState('');
  const [lossReasonCode, setLossReasonCode] = useState('spill');
  const [rejectionReasonCode, setRejectionReasonCode] = useState('rejected_units');
  const [assetCode, setAssetCode] = useState('');
  const [assetCodesText, setAssetCodesText] = useState('');
  const [notes, setNotes] = useState('');
  const [compliance, setCompliance] = useState({
    beverageClass: 'cider' as BeverageClass,
    brandName: '',
    productName: '',
    classDesignation: '',
    taxClass: 'other' as 'hard_cider' | 'still_wine' | 'sparkling_wine' | 'beer' | 'other',
    colaReference: '',
    formulaReference: '',
    abvPct: '',
    netContentsStatement: '',
    appellation: '',
    vintageYear: '',
    sulfiteDeclaration: '',
    healthWarningIncluded: true,
    interstateSale: false,
    formulaRequired: false,
    fdaLabelReviewComplete: false,
    ingredientStatementReviewed: false,
    allergenReviewComplete: false,
    hardCiderQualified: false,
    notes: '',
  });
  const [statusText, setStatusText] = useState('Loading packaging workspace...');
  const [busy, setBusy] = useState(false);
  const [complianceGuidance, setComplianceGuidance] = useState<ComplianceGuidanceSettings>(
    DEFAULT_COMPLIANCE_GUIDANCE
  );
  const [highlightedComplianceField, setHighlightedComplianceField] = useState('');
  const [builderDialog, setBuilderDialog] = useState<'source' | 'destination' | null>(null);
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false);
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const [finalObservedDialogOpen, setFinalObservedDialogOpen] = useState(false);
  const [pendingTransferAfterObserved, setPendingTransferAfterObserved] = useState(false);
  const [finalObservedDraft, setFinalObservedDraft] = useState<FinalObservedDraft>(
    buildFinalObservedDraft(null)
  );
  const [completionDialogRun, setCompletionDialogRun] = useState<PackagingRunRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'runs'>('builder');
  const [selectedRunId, setSelectedRunId] = useState('');
  const [isDraftingRun, setIsDraftingRun] = useState(false);
  const [transferSession, setTransferSession] = useState<{
    status: TransferSessionStatus;
    sourceQty: number | null;
    outputQty: number | null;
    progress: number;
    runId?: string;
  }>({
    status: 'idle',
    sourceQty: null,
    outputQty: null,
    progress: 0,
  });

  const sourceBatch = batches.find((batch) => batch.id === sourceBatchId) ?? null;
  const sourceRuns = runs
    .filter((run) => run.sourceBatchId === sourceBatchId)
    .sort((left, right) => {
      const leftTime = Date.parse(left.updatedAt ?? left.startedAt ?? '') || 0;
      const rightTime = Date.parse(right.updatedAt ?? right.startedAt ?? '') || 0;
      return rightTime - leftTime;
    });
  const latestCompletedSourceRun =
    sourceRuns.find((run) => run.status === 'completed' && Number(run.completedUnits ?? 0) > 0) ??
    sourceRuns.find((run) => run.status === 'completed') ??
    null;
  const selectedRun = sourceRuns.find((run) => run.id === selectedRunId) ?? null;
  const displayRun = selectedRun ?? latestCompletedSourceRun ?? sourceRuns[0] ?? null;
  const visualizingDraft = isDraftingRun && transferSession.status === 'idle';
  const displayOutputLabel =
    visualizingDraft
      ? compliance.productName ?? outputSkuId ?? 'Package Output'
      : displayRun?.complianceSnapshot.productName ??
        compliance.productName ??
        outputSkuId ??
        'Package Output';
  const displayOutputFormat = visualizingDraft
    ? packageFormatCode ?? packageType
    : displayRun?.packageFormatCode ?? packageFormatCode ?? packageType;
  const displayOutputUnits =
    transferSession.outputQty ??
    (visualizingDraft ? 0 : Number(displayRun?.completedUnits ?? completedUnits ?? 0));
  const displayOutputPlannedUnits = visualizingDraft
    ? Number(plannedUnits ?? 0)
    : Number(displayRun?.plannedUnits ?? plannedUnits ?? 0);
  const displaySourceQty =
    transferSession.sourceQty ??
    (visualizingDraft
      ? availableQty(sourceBatch)
      : displayRun
        ? Number(displayRun.sourceAvailableQty ?? availableQty(sourceBatch))
        : availableQty(sourceBatch));
  const latestComplianceRun =
    sourceBatchId.trim() === ''
      ? null
      : runs.find((run) => run.sourceBatchId === sourceBatchId && run.complianceSnapshot) ?? null;
  const complianceReadiness = getComplianceSnapshotReadiness({
    beverageClass: compliance.beverageClass,
    brandName: compliance.brandName,
    productName: compliance.productName,
    classDesignation: compliance.classDesignation,
    colaReference: compliance.colaReference,
    formulaReference: compliance.formulaReference,
    abvPct: compliance.abvPct === '' ? undefined : Number(compliance.abvPct),
    netContentsStatement: compliance.netContentsStatement,
    appellation: compliance.appellation,
    vintageYear: compliance.vintageYear,
    sulfiteDeclaration: compliance.sulfiteDeclaration,
    healthWarningIncluded: compliance.healthWarningIncluded,
  });
  const suggestedInterstateSale = complianceGuidance.interstateSalesDefault;
  const missingFinalObservedFields = getMissingFinalObservedFields(sourceBatch);
  const finalObservedReady = missingFinalObservedFields.length === 0;
  const suggestedTaxClass = (() => {
    const designation = compliance.classDesignation.trim().toLowerCase();
    const abv = Number(compliance.abvPct);
    if (compliance.beverageClass === 'beer') {
      return { value: 'beer' as const, label: 'Beer' };
    }
    if (compliance.beverageClass === 'wine') {
      return {
        value: /sparkling|carbonated|effervescent/.test(designation)
          ? ('sparkling_wine' as const)
          : ('still_wine' as const),
        label: /sparkling|carbonated|effervescent/.test(designation) ? 'Sparkling Wine' : 'Still Wine',
      };
    }
    if (compliance.beverageClass === 'cider') {
      if (Number.isFinite(abv) && abv > 0 && abv < 8.5 && compliance.hardCiderQualified) {
        return { value: 'hard_cider' as const, label: 'Hard Cider' };
      }
      return { value: 'other' as const, label: 'Review / Other' };
    }
    return { value: 'other' as const, label: 'Review / Other' };
  })();

  const focusComplianceField = (key: string) => {
    const field = globalThis.document?.getElementById(`compliance-field-${key}`);
    if (!field) return;
    setHighlightedComplianceField(key);
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if ('focus' in field) {
      window.setTimeout(() => {
        (field as HTMLElement).focus();
      }, 150);
    }
  };

  useEffect(() => {
    if (searchSourceBatchId && searchSourceBatchId !== sourceBatchId) {
      setSourceBatchId(searchSourceBatchId);
    }
  }, [searchSourceBatchId, sourceBatchId]);

  useEffect(() => {
    if (!OS_PACKAGE_TYPE_OPTIONS.some((option) => option.value === packageType)) {
      setPackageType('keg');
      return;
    }
    if (!(PACKAGE_FORMAT_OPTIONS[packageType] ?? []).some((option) => option.code === packageFormatCode)) {
      setPackageFormatCode(DEFAULT_PACKAGE_FORMAT_CODE[packageType]);
    }
  }, [packageFormatCode, packageType]);

  useEffect(() => {
    const styles = PACKAGE_STYLE_OPTIONS[packageType] ?? [];
    if (styles.length === 0) {
      if (containerStyle !== '') setContainerStyle('');
      return;
    }
    if (!styles.includes(containerStyle)) {
      setContainerStyle(styles[0]);
    }
  }, [containerStyle, packageType]);

  useEffect(() => {
    if (!sourceBatch) {
      return;
    }
    const nextAutoSku = suggestSkuCode({
      productCode: sourceBatch.productSnapshot?.productCode,
      productName: sourceBatch.productSnapshot?.productName || sourceBatch.recipeName,
      packageFormatCode,
      packageType,
    });
    if (!outputSkuId || outputSkuId === lastAutoSkuId) {
      setOutputSkuId(nextAutoSku);
    }
    setLastAutoSkuId(nextAutoSku);
    const styles = PACKAGE_STYLE_OPTIONS[packageType] ?? [];
    const nextStyle = latestComplianceRun?.containerStyle ?? '';
    if (styles.includes(nextStyle)) {
      setContainerStyle(nextStyle);
    }
    setCompliance({
      beverageClass:
        latestComplianceRun?.complianceSnapshot?.beverageClass ??
        sourceBatch.productSnapshot?.beverageClass ??
        'cider',
      brandName:
        latestComplianceRun?.complianceSnapshot?.brandName ??
        sourceBatch.productSnapshot?.productCode ??
        '',
      productName:
        latestComplianceRun?.complianceSnapshot?.productName ??
        sourceBatch.productSnapshot?.productName ??
        sourceBatch.recipeName,
      classDesignation:
        latestComplianceRun?.complianceSnapshot?.classDesignation ??
        deriveClassDesignation(
          latestComplianceRun?.complianceSnapshot?.beverageClass ??
            sourceBatch.productSnapshot?.beverageClass
        ),
      taxClass: latestComplianceRun?.complianceSnapshot?.taxClass ?? 'other',
      colaReference: latestComplianceRun?.complianceSnapshot?.colaReference ?? '',
      formulaReference: latestComplianceRun?.complianceSnapshot?.formulaReference ?? '',
      abvPct:
        sourceBatch.actualResults?.abvPct !== undefined
          ? sourceBatch.actualResults.abvPct.toFixed(2)
          : latestComplianceRun?.complianceSnapshot?.abvPct !== undefined
            ? latestComplianceRun.complianceSnapshot.abvPct.toFixed(2)
            : '',
      netContentsStatement:
        latestComplianceRun?.complianceSnapshot?.netContentsStatement ??
        packageFormatLabel(packageType, packageFormatCode) ??
        '',
      appellation: latestComplianceRun?.complianceSnapshot?.appellation ?? '',
      vintageYear: latestComplianceRun?.complianceSnapshot?.vintageYear ?? '',
      sulfiteDeclaration: latestComplianceRun?.complianceSnapshot?.sulfiteDeclaration ?? '',
      healthWarningIncluded: latestComplianceRun?.complianceSnapshot?.healthWarningIncluded ?? true,
      interstateSale:
        latestComplianceRun?.complianceSnapshot?.interstateSale ??
        complianceGuidance.interstateSalesDefault,
      formulaRequired: latestComplianceRun?.complianceSnapshot?.formulaRequired ?? false,
      fdaLabelReviewComplete: latestComplianceRun?.complianceSnapshot?.fdaLabelReviewComplete ?? false,
      ingredientStatementReviewed:
        latestComplianceRun?.complianceSnapshot?.ingredientStatementReviewed ?? false,
      allergenReviewComplete:
        latestComplianceRun?.complianceSnapshot?.allergenReviewComplete ?? false,
      hardCiderQualified: latestComplianceRun?.complianceSnapshot?.hardCiderQualified ?? false,
      notes: latestComplianceRun?.complianceSnapshot?.notes ?? '',
    });
  }, [
    complianceGuidance.interstateSalesDefault,
    lastAutoSkuId,
    latestComplianceRun,
    outputSkuId,
    packageFormatCode,
    packageType,
    sourceBatch,
  ]);

  useEffect(() => {
    if (!completedUnitsTouched) {
      setCompletedUnits(plannedUnits);
    }
  }, [completedUnitsTouched, plannedUnits]);

  useEffect(() => {
    if (!complianceDialogOpen) {
      setHighlightedComplianceField('');
      return;
    }
    if (!searchComplianceFocus) return;
    const timer = window.setTimeout(() => {
      focusComplianceField(searchComplianceFocus);
    }, 160);
    return () => window.clearTimeout(timer);
  }, [complianceDialogOpen, searchComplianceFocus]);

  useEffect(() => {
    if (!searchComplianceOpen || !sourceBatch) return;
    setComplianceDialogOpen(true);
  }, [searchComplianceOpen, sourceBatch]);

  useEffect(() => {
    setFinalObservedDraft(buildFinalObservedDraft(sourceBatch, operator));
  }, [sourceBatch, operator]);

  const effectiveCompletedUnits = completedUnitsTouched
    ? Math.max(0, Number(completedUnits) || 0)
    : Math.max(0, Number(plannedUnits) || 0);
  const effectiveRejectedUnits = Math.max(0, Number(rejectedUnits) || 0);
  const autoDerivedSourceQtyUsed =
    sourceBatch && packageFormatCode
      ? (() => {
          const spec = derivePackageFormatSpec(packageType, packageFormatCode);
          if (!spec || effectiveCompletedUnits + effectiveRejectedUnits <= 0) {
            return 0;
          }
          return (
            convertVolume(
              (effectiveCompletedUnits + effectiveRejectedUnits) * spec.unitSize,
              spec.unitOfMeasure,
              sourceBatch.unit
            ) ?? 0
          );
        })()
      : 0;
  const packageFormatSpec = derivePackageFormatSpec(packageType, packageFormatCode);
  const packageVolumeUnit = packageFormatSpec?.unitOfMeasure ? formatDisplayUnit(packageFormatSpec.unitOfMeasure) : 'units';
  const destinationDisplayUnit = packageFormatSpec ? packageVolumeUnit : 'units';
  const destinationCurrentQty =
    packageFormatSpec && Number.isFinite(displayOutputUnits)
      ? Number(displayOutputUnits) * packageFormatSpec.unitSize
      : displayOutputUnits;
  const destinationCapacityQty =
    packageFormatSpec && Number.isFinite(displayOutputPlannedUnits)
      ? Number(displayOutputPlannedUnits) * packageFormatSpec.unitSize
      : displayOutputPlannedUnits;
  const maxTransferUnits =
    sourceBatch && packageFormatSpec
      ? Math.max(
          0,
          Math.floor(
            (convertVolume(availableQty(sourceBatch), sourceBatch.unit, packageFormatSpec.unitOfMeasure) ?? 0) /
              packageFormatSpec.unitSize
          )
        )
      : null;
  const maxTransferVolume =
    maxTransferUnits !== null && packageFormatSpec ? maxTransferUnits * packageFormatSpec.unitSize : null;
  const sourceDisplayUnit = sourceBatch ? formatDisplayUnit(sourceBatch.unit) : 'bbl';
  const sourceValueLabel = sourceBatch
    ? `${formatVolumeNumber(displaySourceQty)} ${formatSourceUnitLabel(displaySourceQty, sourceDisplayUnit)}`
    : undefined;
  const sourceCapacityLabel = sourceBatch
    ? `Capacity ${formatVolumeNumber(Math.max(sourceBatch.producedQty, availableQty(sourceBatch)))} ${formatSourceUnitLabel(
        Math.max(sourceBatch.producedQty, availableQty(sourceBatch)),
        sourceDisplayUnit
      )}`
    : undefined;
  const packageCountLabel =
    packageType === 'keg'
      ? pluralizeLabel(displayOutputUnits, 'keg')
      : packageType === 'bottle'
        ? pluralizeLabel(displayOutputUnits, 'bottle')
        : packageType === 'can'
          ? pluralizeLabel(displayOutputUnits, 'can')
          : pluralizeLabel(displayOutputUnits, 'package');
  const destinationValueLabel = `${formatTrimmedQty(displayOutputUnits)} ${packageCountLabel}`;
  const destinationCapacityLabel =
    destinationCapacityQty > 0
      ? `Capacity ${formatVolumeNumber(destinationCapacityQty)} ${destinationDisplayUnit}`
      : 'Capacity not set';
  const viewingCompletedRun = !visualizingDraft && displayRun?.status === 'completed';
  const sourceQtyUsedDisplayValue = viewingCompletedRun
    ? formatTransferQty(Number(displayRun?.sourceQtyUsed ?? 0))
    : sourceQtyUsedTouched
      ? sourceQtyUsed
      : formatTransferQty(autoDerivedSourceQtyUsed);
  const pendingCompletedUnits = completedUnitsTouched
    ? Math.max(0, Number(completedUnits) || 0)
    : Math.max(0, Number(plannedUnits) || 0);
  const transferConfirmationTitle =
    !isDraftingRun && displayRun?.status === 'active' ? 'Complete Packaging Run?' : 'Start Packaging Run?';
  const transferConfirmationDetail =
    mode === 'manual'
      ? `Manual transfer will package ${pendingCompletedUnits.toFixed(0)} units into ${packageFormatCode || packageType}.`
      : `Automatic transfer will start a metered ${packageFormatCode || packageType} run.`;

  const validateRequestedTransferUnits = (requestedUnits: number): boolean => {
    if (requestedUnits <= 0) {
      setStatusText('Enter at least 1 whole package unit.');
      toast.error('Enter at least 1 whole package unit.');
      return false;
    }
    if (sourceBatch && packageFormatSpec) {
      const supportsVolumetricTransfer =
        convertVolume(1, sourceBatch.unit, packageFormatSpec.unitOfMeasure) !== null;
      if (!supportsVolumetricTransfer) {
        setStatusText(
          `Source batch unit "${sourceBatch.unit}" is not a supported liquid volume. Set the batch to bbl, gal, L, or mL before packaging.`
        );
        toast.error('Source batch needs a liquid volume unit before packaging.');
        return false;
      }
    }
    if (maxTransferUnits !== null && requestedUnits > maxTransferUnits) {
      const detail =
        maxTransferVolume !== null
          ? `${maxTransferUnits} units (${formatVolumeNumber(maxTransferVolume)} ${destinationDisplayUnit})`
          : `${maxTransferUnits} units`;
      setStatusText(`Insufficient source volume. Max transferable is ${detail}.`);
      toast.error(`Insufficient source volume. Max transferable is ${detail}.`);
      return false;
    }
    return true;
  };

  const beginDraftRun = () => {
    setIsDraftingRun(true);
    setSelectedRunId('');
    setCompletedUnitsTouched(false);
    setRejectedUnits('0');
    setSourceQtyUsed('');
    setSourceQtyUsedTouched(false);
    setLossQty('0');
    setLossUnit(coerceLiquidUnit(sourceBatch?.unit, 'bbl'));
    setLossReasonCode('spill');
    setRejectionReasonCode('rejected_units');
  };

  const loadRunIntoForm = (run: PackagingRunRecord) => {
    const nextPlannedUnits = Number(run.plannedUnits ?? 0);
    const nextCompletedUnits =
      run.status === 'active'
        ? nextPlannedUnits
        : Number(run.completedUnits ?? 0) > 0
          ? Number(run.completedUnits ?? 0)
          : nextPlannedUnits;
    setSelectedRunId(run.id);
    setIsDraftingRun(false);
    setPackageType(run.packageType);
    setPackageFormatCode(run.packageFormatCode ?? DEFAULT_PACKAGE_FORMAT_CODE[run.packageType]);
    setContainerStyle(run.containerStyle ?? '');
    setOutputSkuId(run.outputSkuId);
    setOperator(run.operator ?? '');
    setPackageLineLabel(run.packageLineLabel ?? '');
    setLossReasonCode(run.lossReasonCode ?? 'spill');
    setRejectionReasonCode(run.rejectionReasonCode ?? 'rejected_units');
    setAssetCode(run.assetCode ?? '');
    setAssetCodesText((run.assetCodes ?? []).join('\n'));
    setPlannedUnits(String(nextPlannedUnits));
    setCompletedUnits(String(nextCompletedUnits));
    setCompletedUnitsTouched(false);
    setRejectedUnits(String(run.rejectedUnits ?? 0));
    setSourceQtyUsed(String(run.sourceQtyUsed ?? 0));
    setSourceQtyUsedTouched(false);
    setLossQty(String(run.lossQty ?? 0));
    setNotes(run.notes ?? '');
    setCompliance(toComplianceForm(run.complianceSnapshot));
  };

  const seedDraftFromRun = (run: PackagingRunRecord) => {
    const templateUnits =
      Number(run.completedUnits ?? 0) > 0 ? Number(run.completedUnits ?? 0) : Number(run.plannedUnits ?? 0);
    beginDraftRun();
    setPackageType(run.packageType);
    setPackageFormatCode(run.packageFormatCode ?? DEFAULT_PACKAGE_FORMAT_CODE[run.packageType]);
    setContainerStyle(run.containerStyle ?? '');
    setOutputSkuId(run.outputSkuId);
    setOperator(run.operator ?? '');
    setPackageLineLabel(run.packageLineLabel ?? '');
    setLossReasonCode('spill');
    setRejectionReasonCode('rejected_units');
    setAssetCode(run.assetCode ?? '');
    setAssetCodesText((run.assetCodes ?? []).join('\n'));
    setPlannedUnits(String(templateUnits));
    setCompletedUnits(String(templateUnits));
    setCompletedUnitsTouched(false);
    setRejectedUnits('0');
    setLossQty('0');
    setSourceQtyUsed('');
    setSourceQtyUsedTouched(false);
    setNotes(run.notes ?? '');
    setCompliance(toComplianceForm(run.complianceSnapshot));
    setStatusText(`Loaded ${run.outputSkuId} as a new packaging draft from run history.`);
  };

  useEffect(() => {
    if (isDraftingRun) {
      return;
    }
    if (!sourceBatchId) {
      setSelectedRunId('');
      return;
    }
    const defaultRun = sourceRuns.find((run) => run.status === 'active') ?? latestCompletedSourceRun ?? sourceRuns[0];
    if (!selectedRunId && defaultRun) {
      if (defaultRun.status === 'active') {
        loadRunIntoForm(defaultRun);
      } else {
        seedDraftFromRun(defaultRun);
      }
      return;
    }
    if (selectedRunId && !sourceRuns.some((run) => run.id === selectedRunId)) {
      if (defaultRun) {
        if (defaultRun.status === 'active') {
          loadRunIntoForm(defaultRun);
        } else {
          seedDraftFromRun(defaultRun);
        }
      } else {
        setSelectedRunId('');
      }
    }
  }, [isDraftingRun, latestCompletedSourceRun, selectedRunId, sourceBatchId, sourceRuns]);

  const load = async () => {
    try {
      const [batchResponse, runResponse, settingsResponse] = await Promise.all([
        fetch('/api/os/batches'),
        fetch('/api/os/packaging/runs'),
        fetch('/api/os/settings'),
      ]);
      const batchPayload = await batchResponse.json().catch(() => null);
      const runPayload = await runResponse.json().catch(() => null);
      const settingsPayload = await settingsResponse.json().catch(() => null);
      if (!batchResponse.ok || !batchPayload?.success) {
        throw new Error(batchPayload?.error ?? 'Failed to load batches.');
      }
      if (!runResponse.ok || !runPayload?.success) {
        throw new Error(runPayload?.error ?? 'Failed to load packaging runs.');
      }
      if (!settingsResponse.ok || !settingsPayload?.success) {
        throw new Error(settingsPayload?.error ?? 'Failed to load OS settings.');
      }
      const nextBatches = (batchPayload.data?.batches ?? []) as BatchRecord[];
      setBatches(nextBatches);
      setRuns((runPayload.data ?? []) as PackagingRunRecord[]);
      setComplianceGuidance(normalizeComplianceGuidance(settingsPayload.data?.complianceGuidance));
      setSourceBatchId((current) => current || nextBatches[0]?.id || '');
      setStatusText('Packaging workspace ready.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to load packaging workspace.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createRun = async (): Promise<PackagingRunRecord | null> => {
    if (!sourceBatch) {
      setStatusText('Select a source batch first.');
      return null;
    }
    if (!outputSkuId.trim()) {
      setStatusText('Output SKU is required.');
      return null;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/os/packaging/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBatchId: sourceBatch.id,
          siteId: sourceBatch.siteId,
          mode,
          packageType,
          packageFormatCode,
          containerStyle: containerStyle || undefined,
          outputSkuId,
          operator,
          packageLineLabel,
          assetCode,
          assetCodes: assetCodesText
            .split(/[\n,]+/)
            .map((entry) => entry.trim())
            .filter(Boolean),
          plannedUnits: Number(plannedUnits),
          notes,
          complianceSnapshot: {
            beverageClass: compliance.beverageClass,
            brandName: compliance.brandName,
            productName: compliance.productName,
            classDesignation: compliance.classDesignation,
            taxClass: compliance.taxClass,
            colaReference: compliance.colaReference,
            formulaReference: compliance.formulaReference,
            abvPct: compliance.abvPct === '' ? undefined : Number(compliance.abvPct),
            netContentsStatement: compliance.netContentsStatement,
            appellation: compliance.appellation,
            vintageYear: compliance.vintageYear,
            sulfiteDeclaration: compliance.sulfiteDeclaration,
            healthWarningIncluded: compliance.healthWarningIncluded,
            interstateSale: compliance.interstateSale,
            formulaRequired: compliance.formulaRequired,
            fdaLabelReviewComplete: compliance.fdaLabelReviewComplete,
            ingredientStatementReviewed: compliance.ingredientStatementReviewed,
            allergenReviewComplete: compliance.allergenReviewComplete,
            hardCiderQualified: compliance.hardCiderQualified,
            notes: compliance.notes,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to create packaging run.');
      }
      void addNotification({
        title: 'Packaging Run Started',
        message: `${sourceBatch.batchCode ?? sourceBatch.lotCode} packaging is now active for ${outputSkuId}.`,
        type: 'info',
        category: 'operations',
        openPath: `/os/packaging?sourceBatchId=${encodeURIComponent(sourceBatch.id)}`,
        sourceRecordId: sourceBatch.id,
      }).catch(() => undefined);
      if (payload?.data?.id) {
        setSelectedRunId(String(payload.data.id));
      }
      setIsDraftingRun(false);
      toast.success('Packaging run started');
      await load();
      return (payload?.data as PackagingRunRecord | undefined) ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create packaging run.';
      setStatusText(message);
      toast.error(message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const completeRun = async (
    run: PackagingRunRecord,
    completedUnitsOverride?: number,
    options?: { skipAnimation?: boolean }
  ) => {
    const plannedUnitCount = Number(run.plannedUnits ?? plannedUnits ?? 0);
    const requestedCompletedUnits = Number(completedUnits);
    const completedUnitCount =
      Number.isFinite(Number(completedUnitsOverride)) && Number(completedUnitsOverride) > 0
        ? Number(completedUnitsOverride)
        : completedUnitsTouched
          ? Number.isFinite(requestedCompletedUnits) && requestedCompletedUnits > 0
            ? requestedCompletedUnits
            : plannedUnitCount
          : plannedUnitCount;
    if (!Number.isFinite(completedUnitCount) || completedUnitCount <= 0) {
      setStatusText('Enter a planned or completed unit count before transferring.');
      toast.error('Completed units are required to package inventory.');
      return;
    }
    const convertedLossQty =
      sourceBatch && lossQty.trim().length > 0
        ? convertVolume(Math.max(0, Number(lossQty) || 0), lossUnit, sourceBatch.unit) ?? Math.max(0, Number(lossQty) || 0)
        : Math.max(0, Number(lossQty) || 0);

    setBusy(true);
    try {
      const response = await fetch(`/api/os/packaging/runs/${run.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          completedUnits: completedUnitCount,
          rejectedUnits: Number(rejectedUnits),
          sourceQtyUsed: sourceQtyUsedTouched ? Number(sourceQtyUsed) : 0,
          lossQty: convertedLossQty,
          operator,
          packageLineLabel,
          lossReasonCode: convertedLossQty > 0 ? lossReasonCode : undefined,
          rejectionReasonCode,
          assetCode,
          assetCodes: assetCodesText
            .split(/[\n,]+/)
            .map((entry) => entry.trim())
            .filter(Boolean),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to complete packaging run.');
      }
      void addNotification({
        title: 'Packaging Run Completed',
        message: `${run.outputSkuId} is now on hand and ready for OPS allocation.`,
        type: 'success',
        category: 'operations',
        openPath: `/os/batches/${encodeURIComponent(run.sourceBatchId)}`,
        sourceRecordId: run.sourceBatchId,
      }).catch(() => undefined);
      if (payload?.data?.id) {
        setSelectedRunId(String(payload.data.id));
      }
      const completedRun = payload?.data as PackagingRunRecord | undefined;
      if (completedRun && sourceBatch && !options?.skipAnimation) {
        const startSourceQty = availableQty(sourceBatch);
        const startOutputQty = Number(run.completedUnits ?? 0);
        const endSourceQty = Number(completedRun.sourceAvailableQty ?? startSourceQty);
        const endOutputQty = Number(completedRun.completedUnits ?? completedUnitCount);
        const transferFraction = Math.max(
          Math.abs(startSourceQty - endSourceQty) / Math.max(sourceBatch.producedQty, startSourceQty, 1),
          Math.abs(endOutputQty - startOutputQty) / Math.max(displayOutputPlannedUnits, endOutputQty, 1)
        );
        const durationMs =
          run.mode === 'auto'
            ? Math.round(2200 + 4200 * Math.max(0.15, Math.min(1, transferFraction)))
            : Math.round(900 + 2600 * Math.max(0.15, Math.min(1, transferFraction)));
        const startTime = performance.now();

        await new Promise<void>((resolve) => {
          const tick = (now: number) => {
            const progress = Math.max(0, Math.min(1, (now - startTime) / durationMs));
            setTransferSession({
              status: run.mode === 'auto' ? 'transferring_auto' : 'transferring_manual',
              sourceQty: startSourceQty + (endSourceQty - startSourceQty) * progress,
              outputQty: startOutputQty + (endOutputQty - startOutputQty) * progress,
              progress,
              runId: completedRun.id,
            });
            if (progress < 1) {
              requestAnimationFrame(tick);
              return;
            }
            setTransferSession({
              status: 'completed',
              sourceQty: endSourceQty,
              outputQty: endOutputQty,
              progress: 1,
              runId: completedRun.id,
            });
            resolve();
          };
          requestAnimationFrame(tick);
        });
      }
      toast.success('Packaging run completed');
      setCompletionDialogRun(null);
      await load();
      setCompletedUnits(String(completedUnitCount));
      setCompletedUnitsTouched(false);
      setSourceQtyUsed('');
      setSourceQtyUsedTouched(false);
      setLossQty('0');
      setLossUnit(coerceLiquidUnit(sourceBatch?.unit, 'bbl'));
      setLossReasonCode('spill');
      setRejectedUnits('0');
      setRejectionReasonCode('rejected_units');
      setIsDraftingRun(false);
      setTransferSession({
        status: 'idle',
        sourceQty: null,
        outputQty: null,
        progress: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete packaging run.';
      setStatusText(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const openCompletionDialog = (run: PackagingRunRecord, options?: { completedUnits?: number }) => {
    const fallbackCompletedUnits =
      options?.completedUnits && options.completedUnits > 0
        ? options.completedUnits
        : Number(run.completedUnits ?? 0) > 0
          ? Number(run.completedUnits ?? 0)
          : Number(run.plannedUnits ?? plannedUnits ?? 0);
    setCompletedUnits(String(fallbackCompletedUnits));
    setCompletedUnitsTouched(false);
    setRejectedUnits(String(run.rejectedUnits ?? 0));
    setSourceQtyUsed(String(run.sourceQtyUsed ?? 0));
    setSourceQtyUsedTouched(false);
    setLossQty(String(run.lossQty ?? 0));
    setLossUnit(coerceLiquidUnit(run.sourceUnit ?? sourceBatch?.unit, coerceLiquidUnit(sourceBatch?.unit, 'bbl')));
    setLossReasonCode(run.lossReasonCode ?? 'spill');
    setRejectionReasonCode(run.rejectionReasonCode ?? 'rejected_units');
    setCompletionDialogRun(run);
  };

  const submitCompletionDialog = async () => {
    if (!completionDialogRun) return;
    await completeRun(completionDialogRun, undefined, { skipAnimation: true });
  };

  const previewPackagingTransfer = async (run: PackagingRunRecord, completedUnitsOverride?: number) => {
    if (!sourceBatch) {
      openCompletionDialog(run, { completedUnits: completedUnitsOverride });
      return;
    }
    const targetCompletedUnits =
      Number.isFinite(Number(completedUnitsOverride)) && Number(completedUnitsOverride) > 0
        ? Number(completedUnitsOverride)
        : Number(run.plannedUnits ?? plannedUnits ?? 0);
    const previewSourceQtyUsed = sourceQtyUsedTouched
      ? Math.max(0, Number(sourceQtyUsed) || 0)
      : Math.max(0, autoDerivedSourceQtyUsed);
    const startSourceQty = availableQty(sourceBatch);
    const endSourceQty = Math.max(0, startSourceQty - previewSourceQtyUsed);
    const startOutputQty = Number(run.completedUnits ?? 0);
    const endOutputQty = Math.max(startOutputQty, targetCompletedUnits);
    const transferFraction = Math.max(
      Math.abs(startSourceQty - endSourceQty) / Math.max(sourceBatch.producedQty, startSourceQty, 1),
      Math.abs(endOutputQty - startOutputQty) / Math.max(displayOutputPlannedUnits, endOutputQty, 1)
    );
    const durationMs =
      run.mode === 'auto'
        ? Math.round(2200 + 4200 * Math.max(0.15, Math.min(1, transferFraction)))
        : Math.round(900 + 2600 * Math.max(0.15, Math.min(1, transferFraction)));
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const progress = Math.max(0, Math.min(1, (now - startTime) / durationMs));
        setTransferSession({
          status: run.mode === 'auto' ? 'transferring_auto' : 'transferring_manual',
          sourceQty: startSourceQty + (endSourceQty - startSourceQty) * progress,
          outputQty: startOutputQty + (endOutputQty - startOutputQty) * progress,
          progress,
          runId: run.id,
        });
        if (progress < 1) {
          requestAnimationFrame(tick);
          return;
        }
        setTransferSession({
          status: 'completed',
          sourceQty: endSourceQty,
          outputQty: endOutputQty,
          progress: 1,
          runId: run.id,
        });
        resolve();
      };
      requestAnimationFrame(tick);
    });

    openCompletionDialog(run, { completedUnits: targetCompletedUnits });
    setStatusText('Review loss and rejects, then complete the packaging record.');
  };

  const transferFromWorkspace = async () => {
    if (busy) return;
    const requestedUnits = pendingCompletedUnits;
    if (!validateRequestedTransferUnits(requestedUnits)) {
      return;
    }
    if (!isDraftingRun && displayRun?.status === 'active') {
      await previewPackagingTransfer(displayRun);
      return;
    }
    const startedRun = await createRun();
    if (!startedRun) return;
    if (mode === 'manual') {
      await previewPackagingTransfer(
        startedRun,
        completedUnitsTouched
          ? Number(completedUnits)
          : Number(startedRun.plannedUnits ?? plannedUnits ?? 0)
      );
      return;
    }
    setStatusText('Automatic packaging run started. Awaiting metered line integration.');
  };

  const requestTransferConfirmation = () => {
    if (busy || !sourceBatch) return;
    setConfirmTransferOpen(true);
  };

  const saveFinalObservedRecord = async () => {
    if (!sourceBatch) return false;

    const actualResults = {
      finalLabAbvPct: parseOptionalNumber(finalObservedDraft.finalLabAbvPct),
      finalLabPh: parseOptionalNumber(finalObservedDraft.finalLabPh),
      finalLabBrix: parseOptionalNumber(finalObservedDraft.finalLabBrix),
      finalLabResidualSugarGpl: parseOptionalNumber(finalObservedDraft.finalLabResidualSugarGpl),
      finalLabTitratableAcidityGpl: parseOptionalNumber(
        finalObservedDraft.finalLabTitratableAcidityGpl
      ),
      finalLabFreeSo2Ppm: parseOptionalNumber(finalObservedDraft.finalLabFreeSo2Ppm),
      finalLabTotalSo2Ppm: parseOptionalNumber(finalObservedDraft.finalLabTotalSo2Ppm),
      finalLabDissolvedOxygenPpm: parseOptionalNumber(
        finalObservedDraft.finalLabDissolvedOxygenPpm
      ),
      finalLabRecordedAt: new Date().toISOString(),
      finalLabRecordedBy:
        finalObservedDraft.finalLabRecordedBy.trim() || operator.trim() || undefined,
    };

    const missing = REQUIRED_FINAL_OBSERVED_FIELDS.filter(
      ({ key }) => !Number.isFinite(Number(actualResults[key]))
    );
    if (missing.length > 0) {
      const message = `Observed final records are required before packaging: ${missing
        .map(({ label }) => label)
        .join(', ')}.`;
      setStatusText(message);
      toast.error(message);
      return false;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/os/batches/${sourceBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualResults }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save final observed records.');
      }
      await load();
      setFinalObservedDialogOpen(false);
      toast.success('Final observed records saved');
      setStatusText('Final observed packaging records saved to the source batch.');
      if (pendingTransferAfterObserved) {
        setPendingTransferAfterObserved(false);
        await transferFromWorkspace();
      }
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save final observed records.';
      setStatusText(message);
      toast.error(message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirmTransferFromWorkspace = async () => {
    setConfirmTransferOpen(false);
    if (!finalObservedReady) {
      setPendingTransferAfterObserved(true);
      setFinalObservedDialogOpen(true);
      setStatusText(
        `Record the final observed batch values before packaging. Missing: ${missingFinalObservedFields.join(', ')}.`
      );
      return;
    }
    await transferFromWorkspace();
  };

  const activeRuns = runs.filter((run) => run.status === 'active');
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const packagedToday = completedRuns.reduce((sum, run) => sum + run.completedUnits, 0);
  const avgEfficiency =
    completedRuns.length > 0
      ? completedRuns.reduce((sum, run) => {
          const denominator = run.sourceQtyUsed + run.lossQty;
          if (denominator <= 0) return sum;
          return sum + (run.sourceQtyUsed / denominator) * 100;
        }, 0) / completedRuns.length
      : 0;

  return (
    <AppShell currentSuite="os" pageTitle="Packaging">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Packaging</h1>
            <p className="text-muted-foreground">
              Start runs here, then review finished sellable product on the packaged product board.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/os/packaged-products')}>
            View Packaged Products
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Active Runs',
              value: activeRuns.length,
              subtitle: 'currently filling or awaiting completion',
              icon: Boxes,
              accentClass:
                'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
              iconClass: 'text-cyan-300',
              lineClass: 'via-cyan-300/40',
              onClick: () => setActiveTab('runs'),
            },
            {
              title: 'Completed Runs',
              value: completedRuns.length,
              subtitle: 'finished packaging records',
              icon: CheckCircle2,
              accentClass:
                'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]',
              iconClass: 'text-emerald-300',
              lineClass: 'via-emerald-300/40',
              onClick: () => setActiveTab('runs'),
            },
            {
              title: 'Units Packaged',
              value: packagedToday.toFixed(0),
              subtitle: 'completed sellable containers',
              icon: PackageCheck,
              accentClass:
                'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
              iconClass: 'text-amber-300',
              lineClass: 'via-amber-300/40',
              onClick: () => navigate('/os/packaged-products'),
            },
            {
              title: 'Average Efficiency',
              value: `${avgEfficiency.toFixed(0)}%`,
              subtitle: 'source volume converted to package output',
              icon: ShieldCheck,
              accentClass:
                'border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]',
              iconClass: 'text-violet-300',
              lineClass: 'via-violet-300/40',
              onClick: () => setActiveTab('runs'),
            },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <button key={tile.title} type="button" className="text-left" onClick={tile.onClick}>
                <Card
                  className={`overflow-hidden border-white/10 transition-colors hover:border-primary/40 hover:bg-primary/5 ${tile.accentClass}`}
                >
                  <CardContent className="relative p-5">
                    <div className={`absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent ${tile.lineClass} to-transparent`} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">
                          Packaging
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

        {sourceBatch ? (
          <div className="rounded-3xl border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.26)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Source Context</p>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {sourceBatch.batchCode ?? sourceBatch.lotCode}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {sourceBatch.productSnapshot?.productName || sourceBatch.recipeName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {sourceBatch.productSnapshot?.productCode ?? sourceBatch.skuId ?? '--'} • {sourceBatch.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                      finalObservedReady
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    {finalObservedReady ? 'Final Observed Ready' : 'Final Observed Needed'}
                  </span>
                  {!finalObservedReady ? (
                    <span className="text-xs text-amber-200/80">
                      Missing {missingFinalObservedFields.join(', ')}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Available</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {formatVolumeNumber(displaySourceQty)} {formatSourceUnitLabel(displaySourceQty, sourceDisplayUnit)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Temp</p>
                    <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {sourceBatch.actualResults?.temperatureCLatest !== undefined
                      ? `${formatTemperatureValue(sourceBatch.actualResults?.temperatureCLatest, temperatureUnit, 1)}°${temperatureUnit}`
                      : '--'}
                    </p>
                  </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">SG</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {formatValue(sourceBatch.actualResults?.sgLatest ?? sourceBatch.actualResults?.fg, 3)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">ABV</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {formatValue(sourceBatch.actualResults?.abvPct, 2, '%')}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">pH</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {formatValue(sourceBatch.actualResults?.phLatest, 2)}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" onClick={() => setFinalObservedDialogOpen(true)}>
                    Final Observed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/os/batches/${sourceBatch.id}`)}>
                    Open Batch Record
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'builder' | 'runs')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Current Run</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4">
            <Card className="overflow-hidden border-emerald-400/18 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_56px_rgba(0,0,0,0.3)]">
              <CardHeader className="border-b border-white/10 bg-black/10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Packaging Station</p>
                    <CardTitle className="mt-2 text-white">Current Run</CardTitle>
                    <CardDescription>
                      OS packaging ends at the sellable fluid container. Case pack and pallet build belong in OPS.
                    </CardDescription>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/65">
                    {mode === 'manual' ? 'Manual Line' : 'Auto Line'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
              <button
                type="button"
                onClick={() => setComplianceDialogOpen(true)}
                className={`rounded-3xl border p-4 text-left transition ${
                  complianceReadiness.requiredPassCount === complianceReadiness.requiredTotal
                    ? 'border-emerald-500/20 bg-emerald-500/8'
                    : 'border-amber-500/20 bg-amber-500/8'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span className="text-sm font-semibold">Compliance</span>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {complianceReadiness.requiredPassCount === complianceReadiness.requiredTotal
                      ? 'Ready'
                      : 'Needs review'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {complianceReadiness.requiredPassCount} / {complianceReadiness.requiredTotal} required fields ready.
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/40">
                  Open compliance snapshot
                </p>
              </button>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Summary</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Mode</p>
                    <p className="mt-1 text-sm font-medium text-white">{mode === 'manual' ? 'Manual' : 'Auto'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Format</p>
                    <p className="mt-1 text-sm font-medium text-white">{packageFormatCode || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Style</p>
                    <p className="mt-1 text-sm font-medium text-white">{containerStyle || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Planned</p>
                    <p className="mt-1 text-sm font-medium text-white">{plannedUnits} units</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Output SKU</p>
                    <p className="mt-1 text-sm font-medium text-white">{outputSkuId || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Max From Source</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {maxTransferUnits !== null ? `${maxTransferUnits} units` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Station Flow</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Select the source, define the sellable container, then run the transfer from the station control.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Format</p>
                    <p className="mt-1 text-sm font-medium text-white">{packageFormatCode || '--'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Container</p>
                    <p className="mt-1 text-sm font-medium text-white">{containerStyle || '--'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-1 col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Transfer Limit</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {maxTransferUnits !== null
                        ? `${maxTransferUnits} units${maxTransferVolume !== null ? ` • ${formatVolumeNumber(maxTransferVolume)} ${destinationDisplayUnit}` : ''}`
                        : '--'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_132px_minmax(0,1fr)] xl:items-center">
                <div>
                  {sourceBatch ? (
                    <ProcessAssetTile
                      label={sourceBatch.recipeName}
                      subtitle={sourceBatch.batchCode ?? sourceBatch.lotCode}
                      variant="source"
                      currentQty={displaySourceQty}
                      capacityQty={Math.max(sourceBatch.producedQty, availableQty(sourceBatch))}
                      unit={sourceBatch.unit}
                      valueLabel={sourceValueLabel}
                      capacityLabel={sourceCapacityLabel}
                      accentClassName="fill-cyan-400/75"
                      onClick={() => setBuilderDialog('source')}
                    />
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-sm text-muted-foreground">
                      Select a source batch in the source setup popup to begin packaging.
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={requestTransferConfirmation}
                    disabled={busy || !sourceBatch}
                    className="rounded-full border border-emerald-400/25 bg-emerald-500/10 p-5 transition hover:border-emerald-400/45 hover:bg-emerald-500/16 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Transfer packaging run"
                  >
                    <ArrowRight className="h-7 w-7 text-emerald-300" />
                  </button>
                  <div className="space-y-1 text-center">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Run Control</p>
                    <p className="text-xs text-slate-400">
                      {busy ? 'Transfer in progress' : 'Start or complete the current packaging run'}
                    </p>
                  </div>
                </div>
                <ProcessAssetTile
                  label={displayOutputLabel}
                  subtitle={displayOutputFormat}
                  variant={
                    (visualizingDraft ? packageType : (displayRun?.packageType ?? packageType)) === 'keg'
                      ? 'keg'
                      : (visualizingDraft ? packageType : (displayRun?.packageType ?? packageType)) === 'can'
                        ? 'can'
                        : (visualizingDraft ? packageType : (displayRun?.packageType ?? packageType)) === 'bottle'
                          ? 'bottle'
                          : 'package_line'
                  }
                  visualStyle={
                    visualizingDraft
                      ? containerStyle
                      : displayRun?.containerStyle ?? containerStyle
                  }
                  currentQty={destinationCurrentQty}
                  capacityQty={destinationCapacityQty}
                  unit={destinationDisplayUnit}
                  valueLabel={destinationValueLabel}
                  capacityLabel={destinationCapacityLabel}
                  accentClassName={packageType === 'keg' ? 'fill-emerald-400/75' : 'fill-sky-400/75'}
                  onClick={() => setBuilderDialog('destination')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setBuilderDialog('source')}
                className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Source Setup</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {sourceBatch ? `${sourceBatch.batchCode ?? sourceBatch.lotCode} • ${formatVolumeNumber(displaySourceQty)} ${sourceBatch.unit} available` : 'Choose the active source batch'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mode, operator, package line, and source transfer context.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBuilderDialog('destination')}
                className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Destination Setup</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {outputSkuId || 'Define package output'} • {packageFormatCode || packageType}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Package type, format, style, assets, notes, and max whole-unit transfer.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  beginDraftRun();
                  setCompletedUnits(plannedUnits);
                }}
                className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Draft Controls</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                  <TimerReset className="h-4 w-4 text-violet-300" />
                  Reset Current Draft
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep the station in place and clear the current completion draft for the next run.
                </p>
              </button>
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="runs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Runs</CardTitle>
                <CardDescription>
                  Active runs stay live here. Completed history seeds a new draft so the log remains immutable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sourceRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No runs recorded yet for this source batch.</p>
                ) : (
                  sourceRuns.map((run) => (
                    <div
                      key={run.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (run.status === 'active') {
                          loadRunIntoForm(run);
                        } else {
                          seedDraftFromRun(run);
                        }
                        setActiveTab('builder');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (run.status === 'active') {
                            loadRunIntoForm(run);
                          } else {
                            seedDraftFromRun(run);
                          }
                          setActiveTab('builder');
                        }
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedRunId === run.id
                          ? 'border-cyan-500/40 bg-cyan-500/5'
                          : 'border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5'
                      }`}
                    >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {run.sourceLotCode} {'->'} {run.outputSkuId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.packageLotCode ?? 'package lot pending'} • {run.packageFormatCode ?? run.packageType}{run.containerStyle ? ` • ${run.containerStyle}` : ''} • planned {run.plannedUnits} units • source {run.sourceUnit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(run.operator ?? 'No operator')} • {run.packageLineLabel ?? 'No line'} •{' '}
                        {run.assetCode ?? run.assetCodes?.[0] ?? 'No asset code'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Loss {run.lossQty} ({run.lossReasonCode ?? '--'}) • Rejects {run.rejectedUnits} (
                        {run.rejectionReasonCode ?? '--'})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                        {run.status}
                      </span>
                    </div>
                  </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {statusText && statusText !== 'Packaging workspace ready.' ? (
          <p className="text-sm text-muted-foreground">{statusText}</p>
        ) : null}
      </div>

      <Dialog open={builderDialog !== null} onOpenChange={(open) => (!open ? setBuilderDialog(null) : null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] p-0 text-white">
          <DialogHeader>
            <div className="border-b border-white/10 px-6 py-5">
              <DialogTitle className="text-white">
                {builderDialog === 'source' ? 'Source Batch Setup' : 'Destination Packaging Setup'}
              </DialogTitle>
              <DialogDescription className="mt-2 text-white/65">
                {builderDialog === 'source'
                  ? 'Choose the active batch and set the operating context for this packaging run.'
                  : 'Define the sellable container, output identity, and whole-unit transfer plan.'}
              </DialogDescription>
            </div>
          </DialogHeader>

          {builderDialog === 'source' ? (
            <div className="space-y-5 px-6 pb-6">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-3xl border border-cyan-400/18 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Select Source</p>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/80">Source Batch</Label>
                    <select
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                      value={sourceBatchId}
                      onChange={(event) => {
                        beginDraftRun();
                        setSourceBatchId(event.target.value);
                      }}
                    >
                      <option value="">Select source batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchCode ?? batch.lotCode} - {batch.recipeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {sourceBatch ? (
                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Available</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-white">
                          {formatVolumeNumber(displaySourceQty)} {formatSourceUnitLabel(displaySourceQty, sourceDisplayUnit)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Status</p>
                        <p className="mt-2 text-sm font-medium text-white">{sourceBatch.status}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">SG</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-white">
                          {formatValue(sourceBatch.actualResults?.sgLatest ?? sourceBatch.actualResults?.fg, 3)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">ABV</p>
                        <p className="mt-2 font-mono text-lg font-semibold text-white">
                          {formatValue(sourceBatch.actualResults?.abvPct, 2, '%')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-sm text-white/55">
                      Choose the active batch to populate the packaging station context.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active Source</p>
                  {sourceBatch ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {sourceBatch.batchCode ?? sourceBatch.lotCode}
                        </p>
                        <p className="text-sm text-white/65">{sourceBatch.recipeName}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Product Code</p>
                        <p className="mt-1 text-sm text-white">
                          {sourceBatch.productSnapshot?.productCode ?? sourceBatch.skuId ?? '--'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Temperature / pH</p>
                        <p className="mt-1 text-sm text-white">
                          {sourceBatch.actualResults?.temperatureCLatest !== undefined
                            ? `${formatTemperatureValue(sourceBatch.actualResults?.temperatureCLatest, temperatureUnit, 1)}°${temperatureUnit}`
                            : '--'}{' '}
                          • pH{' '}
                          {formatValue(sourceBatch.actualResults?.phLatest, 2)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/55">No source batch selected yet.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operating Mode</p>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/80">Mode</Label>
                    <select
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                      value={mode}
                      onChange={(event) => {
                        beginDraftRun();
                        setMode(event.target.value as 'manual' | 'auto');
                      }}
                    >
                      <option value="manual">Manual</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operator</p>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/80">Operator Name</Label>
                    <Input
                      className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                      value={operator}
                      onChange={(event) => setOperator(event.target.value)}
                      placeholder="Cellar operator"
                    />
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Line Context</p>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/80">Package Line / Filler</Label>
                    <Input
                      className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                      value={packageLineLabel}
                      onChange={(event) => setPackageLineLabel(event.target.value)}
                      placeholder="Canning line 1 or keg filler"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Source Quantity Override</p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
                  <div className="space-y-2">
                    <Label className="text-white/80">Source Qty Used</Label>
                    <Input
                      className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                      value={sourceQtyUsedDisplayValue}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        const normalized = nextValue.trim();
                        const isPositiveOverride = normalized.length > 0 && Number(normalized) > 0;
                        setSourceQtyUsed(nextValue);
                        setSourceQtyUsedTouched(isPositiveOverride);
                      }}
                      placeholder={sourceBatch ? `Auto-derived from ${sourceBatch.unit}` : undefined}
                    />
                  </div>
                  <p className="text-sm text-white/55">
                    Leave this alone for normal runs. Override only when the measured source depletion differs from the package-derived value.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 px-6 pb-6">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
                <div className="rounded-3xl border border-emerald-400/18 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Package Definition</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">Package Type</Label>
                      <select
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={packageType}
                        onChange={(event) => {
                          beginDraftRun();
                          setPackageType(event.target.value as PackageType);
                        }}
                      >
                        {OS_PACKAGE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Package Format</Label>
                      <select
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={packageFormatCode}
                        onChange={(event) => {
                          beginDraftRun();
                          setPackageFormatCode(event.target.value);
                        }}
                      >
                        {(PACKAGE_FORMAT_OPTIONS[packageType] ?? []).map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.code} - {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(PACKAGE_STYLE_OPTIONS[packageType] ?? []).length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-white/80">Container Style</Label>
                        <select
                          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                          value={containerStyle}
                          onChange={(event) => {
                            beginDraftRun();
                            setContainerStyle(event.target.value);
                          }}
                        >
                          {(PACKAGE_STYLE_OPTIONS[packageType] ?? []).map((style) => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label className="text-white/80">Primary Asset / Container Code</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={assetCode}
                        onChange={(event) => setAssetCode(event.target.value)}
                        placeholder="KEG-000123 or FILLER-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Current Output</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{displayOutputLabel}</p>
                      <p className="text-sm text-white/60">{displayOutputFormat}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Output SKU</p>
                      <p className="mt-1 text-sm text-white">{outputSkuId || '--'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Capacity</p>
                      <p className="mt-1 text-sm text-white">{destinationCapacityLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Max Whole Units</p>
                      <p className="mt-1 text-sm text-white">
                        {maxTransferUnits !== null
                          ? `${maxTransferUnits} units${maxTransferVolume !== null ? ` (${formatVolumeNumber(maxTransferVolume)} ${destinationDisplayUnit})` : ''}`
                          : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Output Identity</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-white/80">Output SKU</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={outputSkuId}
                        onChange={(event) => {
                          beginDraftRun();
                          setOutputSkuId(event.target.value);
                        }}
                        placeholder="Auto-generated from product code + package format"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-white/80">Additional Asset / Container Codes</Label>
                      <Textarea
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={assetCodesText}
                        onChange={(event) => setAssetCodesText(event.target.value)}
                        placeholder="One per line or comma-separated"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-white/80">Notes</Label>
                      <Textarea
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-400/18 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-200/70">Transfer Plan</p>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Planned Units</Label>
                      <div className="flex gap-2">
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          value={plannedUnits}
                          onChange={(event) => {
                            beginDraftRun();
                            setPlannedUnits(event.target.value);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (maxTransferUnits === null) return;
                            beginDraftRun();
                            setPlannedUnits(String(maxTransferUnits));
                            setCompletedUnits(String(maxTransferUnits));
                            setCompletedUnitsTouched(false);
                          }}
                          disabled={maxTransferUnits === null}
                        >
                          Max
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white/65">
                      {maxTransferUnits !== null ? (
                        <>
                          Max whole units from source: {maxTransferUnits} units
                          {maxTransferVolume !== null
                            ? ` (${formatVolumeNumber(maxTransferVolume)} ${destinationDisplayUnit})`
                            : ''}
                        </>
                      ) : (
                        'Select a valid source and package format to calculate the transfer limit.'
                      )}
                    </div>
                    <p className="text-sm text-white/55">
                      Use Max when you want the page to round down to the largest whole package count the source can support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
            <Button variant="outline" onClick={() => setBuilderDialog(null)}>
              Close
            </Button>
            <Button onClick={() => setBuilderDialog(null)}>Continue to Station</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={finalObservedDialogOpen}
        onOpenChange={(open) => {
          setFinalObservedDialogOpen(open);
          if (!open) {
            setPendingTransferAfterObserved(false);
          }
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Final Observed Packaging Record</DialogTitle>
            <DialogDescription>
              Packaging is the final-destination handoff. Record the observed finish values here before the batch can be packaged into sellable units.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Source Batch</p>
                <p className="mt-1 font-semibold text-foreground">
                  {sourceBatch?.batchCode ?? sourceBatch?.lotCode ?? '--'} • {sourceBatch?.recipeName ?? '--'}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                  finalObservedReady
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                }`}
              >
                {finalObservedReady
                  ? 'Observed values recorded'
                  : `${REQUIRED_FINAL_OBSERVED_FIELDS.length - missingFinalObservedFields.length} / ${REQUIRED_FINAL_OBSERVED_FIELDS.length} required`}
              </span>
            </div>
            {!finalObservedReady ? (
              <p className="mt-3 text-sm text-amber-200/90">
                Missing: {missingFinalObservedFields.join(', ')}
              </p>
            ) : (
              <p className="mt-3 text-sm text-emerald-200/90">
                The required observed packaging values are already on the batch record. You can update them here if needed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Final ABV (%)</Label>
              <Input
                value={finalObservedDraft.finalLabAbvPct}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabAbvPct: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Final pH</Label>
              <Input
                value={finalObservedDraft.finalLabPh}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabPh: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Final Residual Sugar (g/L)</Label>
              <Input
                value={finalObservedDraft.finalLabResidualSugarGpl}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabResidualSugarGpl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Final Titratable Acidity (g/L)</Label>
              <Input
                value={finalObservedDraft.finalLabTitratableAcidityGpl}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabTitratableAcidityGpl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Final Free SO2 (ppm)</Label>
              <Input
                value={finalObservedDraft.finalLabFreeSo2Ppm}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabFreeSo2Ppm: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Final Total SO2 (ppm)</Label>
              <Input
                value={finalObservedDraft.finalLabTotalSo2Ppm}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabTotalSo2Ppm: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Final Brix</Label>
              <Input
                value={finalObservedDraft.finalLabBrix}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabBrix: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dissolved Oxygen (ppm)</Label>
              <Input
                value={finalObservedDraft.finalLabDissolvedOxygenPpm}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabDissolvedOxygenPpm: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Lab Tech / Operator</Label>
              <Input
                value={finalObservedDraft.finalLabRecordedBy}
                onChange={(event) =>
                  setFinalObservedDraft((current) => ({
                    ...current,
                    finalLabRecordedBy: event.target.value,
                  }))
                }
                placeholder="Cellar or packaging operator"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFinalObservedDialogOpen(false);
                setPendingTransferAfterObserved(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveFinalObservedRecord()} disabled={busy || !sourceBatch}>
              Save Observed Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmTransferOpen} onOpenChange={setConfirmTransferOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{transferConfirmationTitle}</DialogTitle>
            <DialogDescription>{transferConfirmationDetail}</DialogDescription>
          </DialogHeader>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Source Batch</span>
              <span className="font-medium text-foreground">
                {sourceBatch?.batchCode ?? sourceBatch?.lotCode ?? '--'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium text-foreground">
                {formatVolumeNumber(displaySourceQty)} {sourceBatch?.unit ?? '--'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Output</span>
              <span className="font-medium text-foreground">{outputSkuId || '--'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium text-foreground">{packageFormatCode || packageType}</span>
            </div>
            {maxTransferUnits !== null ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Max Whole Units</span>
                <span className="font-medium text-foreground">
                  {maxTransferUnits} units
                  {maxTransferVolume !== null ? ` (${formatVolumeNumber(maxTransferVolume)} ${destinationDisplayUnit})` : ''}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-medium text-foreground">{mode === 'manual' ? 'Manual' : 'Auto'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {!isDraftingRun && displayRun?.status === 'active' ? 'Completed Units' : 'Planned Units'}
              </span>
              <span className="font-medium text-foreground">
                {pendingCompletedUnits.toFixed(0)} units
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmTransferOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void confirmTransferFromWorkspace()} disabled={busy || !sourceBatch}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completionDialogRun)} onOpenChange={(open) => (!open ? setCompletionDialogRun(null) : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Packaging Run</DialogTitle>
            <DialogDescription>
              Record packaged output, rejects, and any loss after the transfer is finished, then close the run.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Completed Units</Label>
              <Input
                value={completedUnits}
                onChange={(event) => {
                  setCompletedUnitsTouched(true);
                  setCompletedUnits(event.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Rejected Units</Label>
              <Input value={rejectedUnits} onChange={(event) => setRejectedUnits(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Source Qty Used</Label>
              <Input
                value={sourceQtyUsedDisplayValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const normalized = nextValue.trim();
                  const isPositiveOverride = normalized.length > 0 && Number(normalized) > 0;
                  setSourceQtyUsed(nextValue);
                  setSourceQtyUsedTouched(isPositiveOverride);
                }}
                placeholder={sourceBatch ? `Auto-derived from ${sourceBatch.unit}` : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>Loss Qty</Label>
              <div className="flex gap-2">
                <Input value={lossQty} onChange={(event) => setLossQty(event.target.value)} />
                <select
                  className="h-10 min-w-[132px] rounded-md border border-input bg-background px-3 text-sm"
                  value={lossUnit}
                  onChange={(event) => setLossUnit(event.target.value)}
                >
                  {LIQUID_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Loss Reason</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={lossReasonCode}
                onChange={(event) => setLossReasonCode(event.target.value)}
                disabled={Math.max(0, Number(lossQty) || 0) <= 0}
              >
                <option value="spill">Spill</option>
                <option value="dump">Dump</option>
                <option value="breakage">Breakage</option>
                <option value="purge_loss">Purge Loss</option>
                <option value="rejected_units">Rejected Units</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reject Reason</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={rejectionReasonCode}
                onChange={(event) => setRejectionReasonCode(event.target.value)}
                disabled={Math.max(0, Number(rejectedUnits) || 0) <= 0}
              >
                <option value="rejected_units">Rejected Units</option>
                <option value="seam_failure">Seam / Seal Failure</option>
                <option value="low_fill">Low Fill</option>
                <option value="breakage">Breakage</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompletionDialogRun(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitCompletionDialog()} disabled={busy}>
              Complete Run
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={complianceDialogOpen} onOpenChange={setComplianceDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Compliance Snapshot</DialogTitle>
            <DialogDescription className="text-white/65">
              Review readiness, then update the labeling and compliance fields that matter for this package run.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <h3 className="text-sm font-semibold text-white">Packaging Readiness</h3>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                {complianceReadiness.requiredPassCount} / {complianceReadiness.requiredTotal} required
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {complianceReadiness.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => focusComplianceField(item.key)}
                  className={`rounded-xl border p-3 text-left text-sm transition hover:border-cyan-300/35 hover:bg-white/10 ${
                    getComplianceReadinessTone(item).cardClass
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${getComplianceReadinessTone(item).dotClass}`} />
                      <p className="font-medium text-white">{item.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                        {item.required ? 'Required' : 'Advisory'}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${getComplianceReadinessTone(item).statusClass}`}>
                        {getComplianceReadinessTone(item).label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-white/60">{item.detail}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">Jump to field</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-sky-400/15 bg-sky-500/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Site Guidance</p>
              <p className="mt-3 text-sm font-medium text-white">
                {formatSalesChannelLabel(complianceGuidance.primarySalesChannel)}
              </p>
              <p className="mt-1 text-xs text-white/60">
                OS uses this as the default path when a new package lot does not have a prior compliance snapshot.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Default Route</p>
              <p className="mt-3 text-sm font-medium text-white">
                {complianceGuidance.interstateSalesDefault ? 'Interstate by default' : 'Intrastate by default'}
              </p>
              <p className="mt-1 text-xs text-white/60">
                You can still change this per lot. OS should warn along the selected route, not force it.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">FDA Registration</p>
              <p className="mt-3 text-sm font-medium text-white">
                {complianceGuidance.retailFoodEstablishmentExemptLikely
                  ? 'Retail exemption likely'
                  : 'Registration may need review'}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Guidance only. Use the actual sales path and product profile for lot-level review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_320px]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Label Identity</p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/80">Beverage Class</Label>
                  <select
                    id="compliance-field-beverageClass"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'beverageClass'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.beverageClass}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        beverageClass: event.target.value as BeverageClass,
                      }))
                    }
                  >
                    <option value="cider">Cider</option>
                    <option value="wine">Wine</option>
                    <option value="beer">Beer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Tax Class</Label>
                  <select
                    id="compliance-field-taxClass"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'taxClass'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.taxClass}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        taxClass: event.target.value as typeof current.taxClass,
                      }))
                    }
                  >
                    <option value="other">Other / Review</option>
                    <option value="hard_cider">Hard Cider</option>
                    <option value="still_wine">Still Wine</option>
                    <option value="sparkling_wine">Sparkling Wine</option>
                    <option value="beer">Beer</option>
                  </select>
                  <p className={`text-xs ${compliance.taxClass === suggestedTaxClass.value ? 'text-emerald-200' : 'text-amber-200'}`}>
                    Suggested: {suggestedTaxClass.label} based on beverage class and current product profile. You can override this.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Brand Name</Label>
                  <Input
                    id="compliance-field-brandName"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'brandName'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.brandName}
                    onChange={(event) =>
                      setCompliance((current) => ({ ...current, brandName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Product Name</Label>
                  <Input
                    id="compliance-field-productName"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'productName'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.productName}
                    onChange={(event) =>
                      setCompliance((current) => ({ ...current, productName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Label Designation</Label>
                  <Input
                    id="compliance-field-classDesignation"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'classDesignation'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.classDesignation}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        classDesignation: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">ABV %</Label>
                  <Input
                    id="compliance-field-abv"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'abv'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.abvPct}
                    onChange={(event) =>
                      setCompliance((current) => ({ ...current, abvPct: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white/80">Net Contents Statement</Label>
                  <Input
                    id="compliance-field-netContents"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'netContents'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.netContentsStatement}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        netContentsStatement: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Release Path</p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Interstate Sale</Label>
                  <select
                    id="compliance-field-interstateSale"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'interstateSale'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : compliance.interstateSale === suggestedInterstateSale
                          ? 'border-emerald-500/40'
                          : 'border-amber-500/40'
                    }`}
                    value={compliance.interstateSale ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        interstateSale: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                  <p className={`text-xs ${compliance.interstateSale === suggestedInterstateSale ? 'text-emerald-200' : 'text-amber-200'}`}>
                    Suggested: {suggestedInterstateSale ? 'Yes' : 'No'} based on site compliance guidance. Override this per lot when needed.
                  </p>
                  <p className="text-xs text-white/55">
                    Use this for the out-of-state / interstate release path on this lot.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Formula Required</Label>
                  <select
                    id="compliance-field-formulaRequired"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'formulaRequired'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.formulaRequired ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        formulaRequired: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">COLA Reference</Label>
                  <Input
                    id="compliance-field-colaReference"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'colaReference'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.colaReference}
                    onChange={(event) =>
                      setCompliance((current) => ({ ...current, colaReference: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Formula Reference</Label>
                  <Input
                    id="compliance-field-formulaReference"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'formulaReference'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.formulaReference}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        formulaReference: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">FDA / Label Review</p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/80">FDA Label Review Complete</Label>
                  <select
                    id="compliance-field-fdaLabel"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'fdaLabel'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.fdaLabelReviewComplete ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        fdaLabelReviewComplete: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Ingredient Statement Reviewed</Label>
                  <select
                    id="compliance-field-ingredientStatement"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'ingredientStatement'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.ingredientStatementReviewed ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        ingredientStatementReviewed: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Allergen Review Complete</Label>
                  <select
                    id="compliance-field-allergen"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'allergen'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.allergenReviewComplete ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        allergenReviewComplete: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Health Warning Included</Label>
                  <select
                    id="compliance-field-healthWarning"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'healthWarning'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.healthWarningIncluded ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        healthWarningIncluded: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white/80">Sulfite Declaration</Label>
                  <Input
                    id="compliance-field-sulfite"
                    className={`bg-slate-950/70 text-white placeholder:text-white/35 ${
                      highlightedComplianceField === 'sulfite'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.sulfiteDeclaration}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        sulfiteDeclaration: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cider / Wine Review</p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/80">Hard Cider Qualified</Label>
                  <select
                    id="compliance-field-hardCiderQualified"
                    className={`h-10 w-full rounded-md border bg-slate-950/70 px-3 text-sm text-white ${
                      highlightedComplianceField === 'hardCiderQualified'
                        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
                        : 'border-white/10'
                    }`}
                    value={compliance.hardCiderQualified ? 'yes' : 'no'}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        hardCiderQualified: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Appellation</Label>
                  <Input
                    className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                    value={compliance.appellation}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        appellation: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Vintage Year</Label>
                  <Input
                    className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                    value={compliance.vintageYear}
                    onChange={(event) =>
                      setCompliance((current) => ({
                        ...current,
                        vintageYear: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white/80">Compliance Notes</Label>
                  <Textarea
                    className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                    value={compliance.notes}
                    onChange={(event) =>
                      setCompliance((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setComplianceDialogOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
