import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { commissioningPaths, ensureCommissioningStore } from './commissioning-store.js';
import {
  createManualBatch,
  createPackageLot,
  getBatchById,
  getPackageLotById,
  readBatchState,
  readInventoryMovements,
  readInventoryState,
  readPackageLotState,
  updateBatchOutput,
  updatePackageLot,
  writeInventoryMovements,
  writeInventoryState,
  writePackageLotState,
  type InventoryItemRecord,
  type InventoryMovementRecord,
  type PackageLotType,
} from './inventory-batch-store.js';
import { upsertCoreProduct } from './product-catalog-store.js';
import {
  DEFAULT_PACKAGE_FORMAT_CODE,
  PACKAGE_FORMAT_OPTIONS,
  normalizeBranchCode,
  normalizeHumanCode,
  suggestSkuCode,
} from '../../lib/identity-codes.js';

const nowIso = () => new Date().toISOString();

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const normalizeQty = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Math.abs(rounded) < 1e-9 ? 0 : rounded;
};

const normalizeSiteId = (value: unknown): string => {
  const normalized = String(value ?? 'main').trim().toLowerCase();
  return normalized.length > 0 ? normalized : 'main';
};

const normalizeSkuId = (value: unknown): string => normalizeHumanCode(value);

const normalizeStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => String(entry ?? '').trim())
        .filter((entry) => entry.length > 0)
    : [];

const deriveClassDesignation = (
  beverageClass: ComplianceSnapshot['beverageClass'] | undefined
): string | undefined => {
  if (beverageClass === 'cider') return 'Cider';
  if (beverageClass === 'wine') return 'Wine';
  if (beverageClass === 'beer') return 'Beer';
  return undefined;
};

const deriveNetContentsStatement = (
  packageType: PackageLotType,
  packageFormatCode: string | undefined
): string | undefined => {
  const normalizedFormatCode = normalizeHumanCode(packageFormatCode);
  const match = (PACKAGE_FORMAT_OPTIONS[packageType] ?? []).find(
    (option) => normalizeHumanCode(option.code) === normalizedFormatCode
  );
  return match?.label;
};

const normalizeVolumeUnit = (value: string): string =>
  String(value)
    .trim()
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '');

const unitFactorToLiter = (unit: string): number | null => {
  const normalized = normalizeVolumeUnit(unit);
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(normalized)) return 1;
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(normalized)) {
    return 0.001;
  }
  if (['oz', 'floz', 'fluidounce', 'fluidounces'].includes(normalized)) {
    return 0.0295735295625;
  }
  if (['gal', 'gallon', 'gallons', 'usgal', 'g'].includes(normalized)) {
    return 3.785411784;
  }
  if (['bbl', 'barrel', 'barrels', 'bbls'].includes(normalized)) {
    return 117.347765008;
  }
  return null;
};

const convertVolume = (value: number, fromUom: string, toUom: string): number | null => {
  const from = normalizeVolumeUnit(fromUom);
  const to = normalizeVolumeUnit(toUom);
  if (!Number.isFinite(value) || value < 0) return null;
  if (from === to) return value;
  const fromFactor = unitFactorToLiter(from);
  const toFactor = unitFactorToLiter(to);
  if (fromFactor === null || toFactor === null) return null;
  const liters = value * fromFactor;
  return liters / toFactor;
};

const derivePackageFormatSpec = (
  packageType: PackageLotType,
  packageFormatCode: string | undefined
): { unitSize: number; unitOfMeasure: string } | null => {
  const normalizedFormatCode = normalizeHumanCode(packageFormatCode);
  const match = (PACKAGE_FORMAT_OPTIONS[packageType] ?? []).find(
    (option) => normalizeHumanCode(option.code) === normalizedFormatCode
  );
  if (!match) return null;
  const spec = match.label.match(/(\d+(?:\.\d+)?)\s*(mL|L|oz|gal)\b/i);
  if (!spec) return null;
  return {
    unitSize: Number(spec[1]),
    unitOfMeasure: spec[2],
  };
};

const TREATMENT_BRANCH_CODES: Record<
  Exclude<TransferDestinationRecord['treatmentType'], 'none' | undefined>,
  string
> = {
  oak_aged: 'OAK',
  lees_aged: 'LEES',
  blend: 'BLEND',
  backsweetened: 'SWEET',
  carbonated: 'CARB',
  filtered: 'FILTER',
  other: 'OTHER',
};

const TREATMENT_LABELS: Record<
  Exclude<TransferDestinationRecord['treatmentType'], 'none' | undefined>,
  string
> = {
  oak_aged: 'Oak Aged',
  lees_aged: 'Lees Aged',
  blend: 'Blend',
  backsweetened: 'Backsweetened',
  carbonated: 'Carbonated',
  filtered: 'Filtered',
  other: 'Finished',
};

const titleCaseBranchCode = (value: string): string =>
  value
    .split('-')
    .filter(Boolean)
    .map((segment) => `${segment.slice(0, 1)}${segment.slice(1).toLowerCase()}`)
    .join(' ');

const inferBranchCode = (destination: TransferDestinationRecord): string | undefined => {
  const explicit = normalizeBranchCode(destination.branchCode);
  if (explicit) return explicit;
  if (destination.treatmentType && destination.treatmentType !== 'none') {
    return TREATMENT_BRANCH_CODES[destination.treatmentType];
  }
  return undefined;
};

const inferDerivedProductIdentity = (params: {
  sourceProductCode?: string;
  sourceProductName?: string;
  fallbackRecipeName: string;
  destination: TransferDestinationRecord;
}): { productCode?: string; productName?: string; branchCode?: string } | null => {
  const { destination } = params;
  const explicitProductCode = destination.derivedProductCode
    ? normalizeHumanCode(destination.derivedProductCode)
    : undefined;
  const explicitProductName = destination.derivedProductName?.trim() || undefined;
  const branchCode = inferBranchCode(destination);

  if (explicitProductCode || explicitProductName) {
    return {
      productCode: explicitProductCode,
      productName: explicitProductName,
      branchCode,
    };
  }

  if (!branchCode) {
    return null;
  }

  const sourceProductCode = normalizeHumanCode(params.sourceProductCode);
  const sourceProductName =
    params.sourceProductName?.trim() || params.fallbackRecipeName.trim() || 'Product';
  const treatmentLabel =
    destination.treatmentType && destination.treatmentType !== 'none'
      ? TREATMENT_LABELS[destination.treatmentType]
      : titleCaseBranchCode(branchCode);

  return {
    productCode: sourceProductCode
      ? normalizeHumanCode(`${sourceProductCode}-${branchCode}`)
      : undefined,
    productName: `${sourceProductName} (${treatmentLabel})`,
    branchCode,
  };
};

const transferRunsFile = path.join(commissioningPaths.root, 'transfer-runs.json');
const packagingRunsFile = path.join(commissioningPaths.root, 'packaging-runs.json');

export type RunMode = 'manual' | 'auto';
export type TransferRunStatus = 'active' | 'completed' | 'canceled';
export type PackagingRunStatus = 'active' | 'completed' | 'canceled';
export type TransferDestinationKind =
  | 'vessel'
  | 'bright_tank'
  | 'barrel'
  | 'package_line'
  | 'other';
export type BeverageRegulatoryClass = 'cider' | 'wine' | 'beer' | 'other';

export interface TransferDestinationRecord {
  id: string;
  label: string;
  kind: TransferDestinationKind;
  capacityQty?: number;
  plannedQty: number;
  actualQty: number;
  branchCode?: string;
  treatmentType?: 'none' | 'oak_aged' | 'lees_aged' | 'blend' | 'backsweetened' | 'carbonated' | 'filtered' | 'other';
  derivedProductId?: string;
  derivedProductCode?: string;
  derivedProductName?: string;
  childBatchId?: string;
  childBatchCode?: string;
  childLotCode?: string;
}

export interface TransferRunRecord {
  schemaVersion: string;
  id: string;
  siteId: string;
  sourceBatchId: string;
  sourceLotCode: string;
  sourceRecipeName: string;
  sourceUnit: string;
  sourceAvailableQty: number;
  mode: RunMode;
  status: TransferRunStatus;
  destinations: TransferDestinationRecord[];
  operator?: string;
  lossReasonCode?: string;
  notes?: string;
  lossQty: number;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface ComplianceSnapshot {
  beverageClass: BeverageRegulatoryClass;
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
}

export interface PackagingRunRecord {
  schemaVersion: string;
  id: string;
  siteId: string;
  sourceBatchId: string;
  sourceLotCode: string;
  sourceRecipeName: string;
  sourceUnit: string;
  sourceAvailableQty: number;
  mode: RunMode;
  status: PackagingRunStatus;
  packageType: PackageLotType;
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
  complianceSnapshot: ComplianceSnapshot;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

interface TransferRunsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  runs: TransferRunRecord[];
}

interface PackagingRunsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  runs: PackagingRunRecord[];
}

const defaultTransferRunsState = (): TransferRunsState => ({
  schemaVersion: '1.0.0',
  id: 'transfer-runs',
  updatedAt: nowIso(),
  runs: [],
});

const defaultPackagingRunsState = (): PackagingRunsState => ({
  schemaVersion: '1.0.0',
  id: 'packaging-runs',
  updatedAt: nowIso(),
  runs: [],
});

const normalizeTransferDestination = (
  destination: Partial<TransferDestinationRecord>
): TransferDestinationRecord => ({
  id: String(destination.id ?? randomUUID()).trim(),
  label: String(destination.label ?? 'Destination').trim() || 'Destination',
  kind:
    destination.kind === 'vessel' ||
    destination.kind === 'bright_tank' ||
    destination.kind === 'barrel' ||
    destination.kind === 'package_line'
      ? destination.kind
      : 'other',
  capacityQty:
    destination.capacityQty !== undefined && Number.isFinite(Number(destination.capacityQty))
      ? Math.max(0, normalizeQty(Number(destination.capacityQty)))
      : undefined,
  plannedQty: Math.max(0, normalizeQty(Number(destination.plannedQty ?? 0))),
  actualQty: Math.max(0, normalizeQty(Number(destination.actualQty ?? destination.plannedQty ?? 0))),
  branchCode: destination.branchCode ? normalizeBranchCode(destination.branchCode) : undefined,
  treatmentType:
    destination.treatmentType === 'oak_aged' ||
    destination.treatmentType === 'lees_aged' ||
    destination.treatmentType === 'blend' ||
    destination.treatmentType === 'backsweetened' ||
    destination.treatmentType === 'carbonated' ||
    destination.treatmentType === 'filtered' ||
    destination.treatmentType === 'other'
      ? destination.treatmentType
      : 'none',
  derivedProductId: destination.derivedProductId ? String(destination.derivedProductId).trim() : undefined,
  derivedProductCode: destination.derivedProductCode
    ? normalizeHumanCode(destination.derivedProductCode)
    : undefined,
  derivedProductName: destination.derivedProductName
    ? String(destination.derivedProductName).trim()
    : undefined,
  childBatchId: destination.childBatchId ? String(destination.childBatchId).trim() : undefined,
  childBatchCode: destination.childBatchCode ? normalizeHumanCode(destination.childBatchCode) : undefined,
  childLotCode: destination.childLotCode ? String(destination.childLotCode).trim() : undefined,
});

const normalizeTransferRun = (run: TransferRunRecord): TransferRunRecord => ({
  ...run,
  schemaVersion: run.schemaVersion ?? '1.0.0',
  id: String(run.id ?? randomUUID()).trim(),
  siteId: normalizeSiteId(run.siteId),
  sourceBatchId: String(run.sourceBatchId ?? '').trim(),
  sourceLotCode: String(run.sourceLotCode ?? '').trim(),
  sourceRecipeName: String(run.sourceRecipeName ?? '').trim(),
  sourceUnit: String(run.sourceUnit ?? 'L').trim() || 'L',
  sourceAvailableQty: Math.max(0, normalizeQty(Number(run.sourceAvailableQty ?? 0))),
  mode: run.mode === 'auto' ? 'auto' : 'manual',
  status:
    run.status === 'completed' || run.status === 'canceled' ? run.status : 'active',
  destinations: (run.destinations ?? []).map((destination) =>
    normalizeTransferDestination(destination)
  ),
  operator: run.operator ? String(run.operator).trim() : undefined,
  lossReasonCode: run.lossReasonCode ? String(run.lossReasonCode).trim() : undefined,
  notes: run.notes ? String(run.notes).trim() : undefined,
  lossQty: Math.max(0, normalizeQty(Number(run.lossQty ?? 0))),
  startedAt: String(run.startedAt ?? nowIso()),
  completedAt: run.completedAt ? String(run.completedAt) : undefined,
  updatedAt: String(run.updatedAt ?? nowIso()),
});

const normalizeComplianceSnapshot = (
  value: Partial<ComplianceSnapshot> | undefined
): ComplianceSnapshot => ({
  beverageClass:
    value?.beverageClass === 'cider' ||
    value?.beverageClass === 'wine' ||
    value?.beverageClass === 'beer'
      ? value.beverageClass
      : 'other',
  brandName: value?.brandName ? String(value.brandName).trim() : undefined,
  productName: value?.productName ? String(value.productName).trim() : undefined,
  classDesignation: value?.classDesignation ? String(value.classDesignation).trim() : undefined,
  taxClass:
    value?.taxClass === 'hard_cider' ||
    value?.taxClass === 'still_wine' ||
    value?.taxClass === 'sparkling_wine' ||
    value?.taxClass === 'beer'
      ? value.taxClass
      : 'other',
  colaReference: value?.colaReference ? String(value.colaReference).trim() : undefined,
  formulaReference: value?.formulaReference ? String(value.formulaReference).trim() : undefined,
  abvPct:
    value?.abvPct !== undefined && Number.isFinite(Number(value.abvPct))
      ? normalizeQty(Number(value.abvPct))
      : undefined,
  netContentsStatement: value?.netContentsStatement
    ? String(value.netContentsStatement).trim()
    : undefined,
  appellation: value?.appellation ? String(value.appellation).trim() : undefined,
  vintageYear: value?.vintageYear ? String(value.vintageYear).trim() : undefined,
  sulfiteDeclaration: value?.sulfiteDeclaration
    ? String(value.sulfiteDeclaration).trim()
    : undefined,
  healthWarningIncluded:
    value?.healthWarningIncluded === undefined ? undefined : value.healthWarningIncluded === true,
  interstateSale: value?.interstateSale === undefined ? undefined : value.interstateSale === true,
  formulaRequired: value?.formulaRequired === undefined ? undefined : value.formulaRequired === true,
  fdaLabelReviewComplete:
    value?.fdaLabelReviewComplete === undefined ? undefined : value.fdaLabelReviewComplete === true,
  ingredientStatementReviewed:
    value?.ingredientStatementReviewed === undefined
      ? undefined
      : value.ingredientStatementReviewed === true,
  allergenReviewComplete:
    value?.allergenReviewComplete === undefined ? undefined : value.allergenReviewComplete === true,
  hardCiderQualified:
    value?.hardCiderQualified === undefined ? undefined : value.hardCiderQualified === true,
  notes: value?.notes ? String(value.notes).trim() : undefined,
});

const buildPackagingComplianceSnapshot = (params: {
  source: Awaited<ReturnType<typeof getBatchById>> extends infer T
    ? T extends null
      ? never
      : Exclude<T, null>
    : never;
  packageType: PackageLotType;
  packageFormatCode?: string;
  complianceSnapshot?: Partial<ComplianceSnapshot>;
  previousSnapshot?: Partial<ComplianceSnapshot>;
}): ComplianceSnapshot => {
  const mergedInput: Partial<ComplianceSnapshot> = {
    ...params.previousSnapshot,
    ...params.complianceSnapshot,
  };
  const beverageClass =
    mergedInput.beverageClass ??
    params.source.productSnapshot?.beverageClass ??
    'other';
  const abvPct =
    params.source.actualResults?.abvPct !== undefined &&
    Number.isFinite(Number(params.source.actualResults.abvPct))
      ? Number(params.source.actualResults.abvPct)
      : mergedInput.abvPct;
  return normalizeComplianceSnapshot({
    beverageClass,
    brandName: mergedInput.brandName ?? params.source.productSnapshot?.productCode,
    productName:
      mergedInput.productName ??
      params.source.productSnapshot?.productName ??
      params.source.recipeName,
    classDesignation:
      mergedInput.classDesignation ?? deriveClassDesignation(beverageClass),
    taxClass: mergedInput.taxClass,
    colaReference: mergedInput.colaReference,
    formulaReference: mergedInput.formulaReference,
    abvPct,
    netContentsStatement:
      mergedInput.netContentsStatement ??
      deriveNetContentsStatement(params.packageType, params.packageFormatCode),
    appellation: mergedInput.appellation,
    vintageYear: mergedInput.vintageYear,
    sulfiteDeclaration: mergedInput.sulfiteDeclaration,
    healthWarningIncluded:
      mergedInput.healthWarningIncluded ??
      (abvPct !== undefined && abvPct > 0 ? true : undefined),
    interstateSale: mergedInput.interstateSale,
    formulaRequired: mergedInput.formulaRequired,
    fdaLabelReviewComplete: mergedInput.fdaLabelReviewComplete,
    ingredientStatementReviewed: mergedInput.ingredientStatementReviewed,
    allergenReviewComplete: mergedInput.allergenReviewComplete,
    hardCiderQualified: mergedInput.hardCiderQualified,
    notes: mergedInput.notes,
  });
};

const normalizePackagingRun = (run: PackagingRunRecord): PackagingRunRecord => ({
  ...run,
  schemaVersion: run.schemaVersion ?? '1.0.0',
  id: String(run.id ?? randomUUID()).trim(),
  siteId: normalizeSiteId(run.siteId),
  sourceBatchId: String(run.sourceBatchId ?? '').trim(),
  sourceLotCode: String(run.sourceLotCode ?? '').trim(),
  sourceRecipeName: String(run.sourceRecipeName ?? '').trim(),
  sourceUnit: String(run.sourceUnit ?? 'L').trim() || 'L',
  sourceAvailableQty: Math.max(0, normalizeQty(Number(run.sourceAvailableQty ?? 0))),
  mode: run.mode === 'auto' ? 'auto' : 'manual',
  status:
    run.status === 'completed' || run.status === 'canceled' ? run.status : 'active',
  packageType:
    run.packageType === 'keg' ||
    run.packageType === 'can' ||
    run.packageType === 'bottle' ||
    run.packageType === 'case' ||
    run.packageType === 'pallet'
      ? run.packageType
      : 'other',
  packageFormatCode: run.packageFormatCode ? normalizeHumanCode(run.packageFormatCode) : undefined,
  containerStyle: run.containerStyle ? String(run.containerStyle).trim().toLowerCase() : undefined,
  outputSkuId: normalizeSkuId(run.outputSkuId),
  operator: run.operator ? String(run.operator).trim() : undefined,
  packageLineLabel: run.packageLineLabel ? String(run.packageLineLabel).trim() : undefined,
  lossReasonCode: run.lossReasonCode ? String(run.lossReasonCode).trim() : undefined,
  rejectionReasonCode: run.rejectionReasonCode ? String(run.rejectionReasonCode).trim() : undefined,
  assetId: run.assetId ? String(run.assetId).trim() : undefined,
  assetCode: run.assetCode ? String(run.assetCode).trim() : undefined,
  assetCodes: normalizeStringList(run.assetCodes),
  plannedUnits: Math.max(0, normalizeQty(Number(run.plannedUnits ?? 0))),
  completedUnits: Math.max(0, normalizeQty(Number(run.completedUnits ?? 0))),
  rejectedUnits: Math.max(0, normalizeQty(Number(run.rejectedUnits ?? 0))),
  sourceQtyUsed: Math.max(0, normalizeQty(Number(run.sourceQtyUsed ?? 0))),
  lossQty: Math.max(0, normalizeQty(Number(run.lossQty ?? 0))),
  packageLotId: run.packageLotId ? String(run.packageLotId).trim() : undefined,
  packageLotCode: run.packageLotCode ? normalizeHumanCode(run.packageLotCode) : undefined,
  notes: run.notes ? String(run.notes).trim() : undefined,
  complianceSnapshot: normalizeComplianceSnapshot(run.complianceSnapshot),
  startedAt: String(run.startedAt ?? nowIso()),
  completedAt: run.completedAt ? String(run.completedAt) : undefined,
  updatedAt: String(run.updatedAt ?? nowIso()),
});

export const readTransferRunsState = async (): Promise<TransferRunsState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<TransferRunsState>(
    transferRunsFile,
    defaultTransferRunsState()
  );
  return {
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'transfer-runs',
    updatedAt: String(state.updatedAt ?? nowIso()),
    runs: [...(state.runs ?? [])].map((run) => normalizeTransferRun(run)),
  };
};

const writeTransferRunsState = async (state: TransferRunsState): Promise<TransferRunsState> => {
  await ensureCommissioningStore();
  const next: TransferRunsState = {
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'transfer-runs',
    updatedAt: nowIso(),
    runs: [...(state.runs ?? [])].map((run) => normalizeTransferRun(run)),
  };
  await writeJson(transferRunsFile, next);
  return next;
};

export const readPackagingRunsState = async (): Promise<PackagingRunsState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<PackagingRunsState>(
    packagingRunsFile,
    defaultPackagingRunsState()
  );
  return {
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'packaging-runs',
    updatedAt: String(state.updatedAt ?? nowIso()),
    runs: [...(state.runs ?? [])].map((run) => normalizePackagingRun(run)),
  };
};

const writePackagingRunsState = async (
  state: PackagingRunsState
): Promise<PackagingRunsState> => {
  await ensureCommissioningStore();
  const next: PackagingRunsState = {
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'packaging-runs',
    updatedAt: nowIso(),
    runs: [...(state.runs ?? [])].map((run) => normalizePackagingRun(run)),
  };
  await writeJson(packagingRunsFile, next);
  return next;
};

export const listTransferRuns = async (filters?: {
  siteId?: string;
  status?: TransferRunStatus;
}): Promise<TransferRunRecord[]> => {
  const state = await readTransferRunsState();
  const siteId = filters?.siteId ? normalizeSiteId(filters.siteId) : '';
  return state.runs.filter((run) => {
    if (siteId && run.siteId !== siteId) return false;
    if (filters?.status && run.status !== filters.status) return false;
    return true;
  });
};

export const listPackagingRuns = async (filters?: {
  siteId?: string;
  status?: PackagingRunStatus;
}): Promise<PackagingRunRecord[]> => {
  const state = await readPackagingRunsState();
  const siteId = filters?.siteId ? normalizeSiteId(filters.siteId) : '';
  return state.runs.filter((run) => {
    if (siteId && run.siteId !== siteId) return false;
    if (filters?.status && run.status !== filters.status) return false;
    return true;
  });
};

export const createTransferRun = async (params: {
  sourceBatchId: string;
  siteId?: string;
  mode?: RunMode;
  destinations: Array<Partial<TransferDestinationRecord>>;
  lossQty?: number;
  operator?: string;
  lossReasonCode?: string;
  notes?: string;
}): Promise<TransferRunRecord> => {
  const source = await getBatchById(params.sourceBatchId);
  if (!source) {
    throw new Error('Source batch not found for transfer run.');
  }
  const sourceAvailableQty = Math.max(
    0,
    normalizeQty(source.producedQty - source.allocatedQty - (source.dispensedQty ?? 0))
  );
  const run: TransferRunRecord = normalizeTransferRun({
    schemaVersion: '1.0.0',
    id: randomUUID(),
    siteId: params.siteId ?? source.siteId,
    sourceBatchId: source.id,
    sourceLotCode: source.batchCode ?? source.lotCode,
    sourceRecipeName: source.recipeName,
    sourceUnit: source.unit,
    sourceAvailableQty,
    mode: params.mode ?? 'manual',
    status: 'active',
    destinations: params.destinations.map((destination) =>
      normalizeTransferDestination(destination)
    ),
    operator: params.operator ? String(params.operator).trim() : undefined,
    lossReasonCode: params.lossReasonCode ? String(params.lossReasonCode).trim() : undefined,
    notes: params.notes,
    lossQty: params.lossQty ?? 0,
    startedAt: nowIso(),
    updatedAt: nowIso(),
  });
  const state = await readTransferRunsState();
  await writeTransferRunsState({
    ...state,
    runs: [run, ...state.runs],
  });
  return run;
};

export const completeTransferRun = async (params: {
  runId: string;
  lossQty?: number;
  operator?: string;
  lossReasonCode?: string;
  destinations?: Array<Partial<TransferDestinationRecord>>;
}): Promise<TransferRunRecord> => {
  const state = await readTransferRunsState();
  const index = state.runs.findIndex((run) => run.id === String(params.runId).trim());
  if (index < 0) {
    throw new Error('Transfer run not found.');
  }
  const current = state.runs[index];
  if (current.status === 'completed') {
    return current;
  }
  const source = await getBatchById(current.sourceBatchId);
  if (!source) {
    throw new Error('Source batch no longer exists.');
  }
  const nextDestinations = (params.destinations ?? current.destinations).map((destination) =>
    normalizeTransferDestination(destination)
  );
  const lossQty =
    params.lossQty !== undefined ? Math.max(0, normalizeQty(Number(params.lossQty))) : current.lossQty;
  const transferredQty = nextDestinations.reduce((sum, destination) => sum + destination.actualQty, 0);
  const totalDepletion = normalizeQty(transferredQty + lossQty);
  const sourceAvailableQty = Math.max(
    0,
    normalizeQty(source.producedQty - source.allocatedQty - (source.dispensedQty ?? 0))
  );
  if (totalDepletion > sourceAvailableQty) {
    throw new Error(`Transfer exceeds source availability (${sourceAvailableQty} ${source.unit}).`);
  }

  const finalizedDestinations: TransferDestinationRecord[] = [];
  for (const destination of nextDestinations) {
    if (destination.actualQty <= 0 || destination.kind === 'package_line') {
      finalizedDestinations.push(destination);
      continue;
    }
    const derivedProductIdentity = inferDerivedProductIdentity({
      sourceProductCode: source.productSnapshot?.productCode,
      sourceProductName: source.productSnapshot?.productName,
      fallbackRecipeName: source.recipeName,
      destination,
    });
    const effectiveBranchCode = derivedProductIdentity?.branchCode;
    const derivedProductBinding = derivedProductIdentity
      ? await upsertCoreProduct({
          productId: destination.derivedProductId,
          productCode: derivedProductIdentity.productCode,
          productName:
            derivedProductIdentity.productName ||
            source.productSnapshot?.productName ||
            source.recipeName,
          beverageClass: source.productSnapshot?.beverageClass,
          images: source.productSnapshot?.images,
          sourceSuite: 'os',
        })
      : null;
    const childBatch = await createManualBatch({
      recipeName:
        derivedProductBinding?.product.name ||
        destination.derivedProductName ||
        source.recipeName,
      recipeId: source.recipeId,
      skuId: source.skuId,
      siteId: source.siteId,
      producedQty: destination.actualQty,
      unit: source.unit,
      status: 'in_progress',
      batchKind: 'derived',
      parentBatchId: source.id,
      parentBatchCode: source.batchCode ?? source.lotCode,
      rootBatchId: source.rootBatchId ?? source.id,
      containerLabel: destination.label,
      containerKind: destination.kind,
      enteredContainerAt: nowIso(),
      productSnapshot:
        derivedProductBinding?.snapshot ?? source.productSnapshot,
      actualResults: source.actualResults,
    });
    finalizedDestinations.push({
      ...destination,
      branchCode: effectiveBranchCode ?? destination.branchCode,
      derivedProductId: derivedProductBinding?.product.productId ?? destination.derivedProductId,
      derivedProductCode:
        derivedProductBinding?.product.productCode ?? destination.derivedProductCode,
      derivedProductName:
        derivedProductBinding?.product.name ?? destination.derivedProductName,
      childBatchId: childBatch.id,
      childBatchCode: childBatch.batchCode,
      childLotCode: childBatch.lotCode,
    });
  }

  await updateBatchOutput({
    batchId: source.id,
    producedQty: source.producedQty,
    dispensedQty: normalizeQty((source.dispensedQty ?? 0) + totalDepletion),
    unit: source.unit,
    status: source.status,
    appendDeviation: {
      field: 'transfer',
      planned: transferredQty,
      actual: transferredQty,
      note: `Transfer run ${current.id} completed. Loss ${lossQty} ${source.unit}.`,
      source: 'manual',
      actor: params.operator ? String(params.operator).trim() : current.operator,
      reasonCode:
        params.lossReasonCode ? String(params.lossReasonCode).trim() : current.lossReasonCode,
    },
  });

  const next: TransferRunRecord = normalizeTransferRun({
    ...current,
    destinations: finalizedDestinations,
    operator: params.operator ? String(params.operator).trim() : current.operator,
    lossReasonCode:
      params.lossReasonCode ? String(params.lossReasonCode).trim() : current.lossReasonCode,
    lossQty,
    sourceAvailableQty: Math.max(0, normalizeQty(sourceAvailableQty - totalDepletion)),
    status: 'completed',
    completedAt: nowIso(),
    updatedAt: nowIso(),
  });
  const runs = [...state.runs];
  runs[index] = next;
  await writeTransferRunsState({
    ...state,
    runs,
  });
  return next;
};

const ensureInventoryItemForOutputSku = async (params: {
  skuId: string;
  siteId: string;
  name: string;
}): Promise<InventoryItemRecord> => {
  const state = await readInventoryState();
  const normalizedSkuId = normalizeSkuId(params.skuId);
  const existing = state.items.find(
    (item) => normalizeSkuId(item.skuId) === normalizedSkuId && normalizeSiteId(item.siteId) === normalizeSiteId(params.siteId)
  );
  if (existing) {
    return existing;
  }
  const now = nowIso();
  const created: InventoryItemRecord = {
    id: randomUUID(),
    skuId: normalizedSkuId,
    sku: normalizedSkuId,
    siteId: normalizeSiteId(params.siteId),
    name: params.name.trim() || normalizedSkuId,
    category: 'packaging',
    unit: 'units',
    onHandQty: 0,
    allocatedQty: 0,
    onOrderQty: 0,
    reorderPointQty: 0,
    createdAt: now,
    updatedAt: now,
  };
  await writeInventoryState({
    ...state,
    items: [created, ...state.items],
  });
  return created;
};

export const createPackagingRun = async (params: {
  sourceBatchId: string;
  siteId?: string;
  mode?: RunMode;
  packageType: PackageLotType;
  packageFormatCode?: string;
  containerStyle?: string;
  outputSkuId?: string;
  operator?: string;
  packageLineLabel?: string;
  lossReasonCode?: string;
  rejectionReasonCode?: string;
  assetId?: string;
  assetCode?: string;
  assetCodes?: string[];
  plannedUnits: number;
  notes?: string;
  complianceSnapshot?: Partial<ComplianceSnapshot>;
}): Promise<PackagingRunRecord> => {
  const source = await getBatchById(params.sourceBatchId);
  if (!source) {
    throw new Error('Source batch not found for packaging run.');
  }
  const packageFormatCode = normalizeHumanCode(
    params.packageFormatCode || DEFAULT_PACKAGE_FORMAT_CODE[params.packageType]
  );
  const outputSkuId = normalizeSkuId(
    params.outputSkuId ||
      suggestSkuCode({
        productCode: source.productSnapshot?.productCode,
        productName: source.productSnapshot?.productName || source.recipeName,
        packageFormatCode,
        packageType: params.packageType,
      })
  );
  if (!outputSkuId) {
    throw new Error('outputSkuId is required.');
  }
  const packagingState = await readPackagingRunsState();
  const previousSnapshot =
    packagingState.runs.find((run) => run.sourceBatchId === source.id)?.complianceSnapshot;
  const complianceSnapshot = buildPackagingComplianceSnapshot({
    source,
    packageType: params.packageType,
    packageFormatCode,
    complianceSnapshot: params.complianceSnapshot,
    previousSnapshot,
  });
  await upsertCoreProduct({
    productId: source.productSnapshot?.productId,
    productCode: source.productSnapshot?.productCode,
    productName: source.productSnapshot?.productName || source.recipeName,
    skuId: outputSkuId,
    beverageClass: source.productSnapshot?.beverageClass,
    images: source.productSnapshot?.images,
    sourceSuite: 'os',
  });
  const sourceAvailableQty = Math.max(
    0,
    normalizeQty(source.producedQty - source.allocatedQty - (source.dispensedQty ?? 0))
  );
  const run: PackagingRunRecord = normalizePackagingRun({
    schemaVersion: '1.0.0',
    id: randomUUID(),
    siteId: params.siteId ?? source.siteId,
    sourceBatchId: source.id,
    sourceLotCode: source.batchCode ?? source.lotCode,
    sourceRecipeName: source.recipeName,
    sourceUnit: source.unit,
    sourceAvailableQty,
    mode: params.mode ?? 'manual',
    status: 'active',
    packageType: params.packageType,
    packageFormatCode,
    containerStyle: params.containerStyle ? String(params.containerStyle).trim().toLowerCase() : undefined,
    outputSkuId,
    operator: params.operator ? String(params.operator).trim() : undefined,
    packageLineLabel: params.packageLineLabel ? String(params.packageLineLabel).trim() : undefined,
    lossReasonCode: params.lossReasonCode ? String(params.lossReasonCode).trim() : undefined,
    rejectionReasonCode:
      params.rejectionReasonCode ? String(params.rejectionReasonCode).trim() : undefined,
    assetId: params.assetId ? String(params.assetId).trim() : undefined,
    assetCode: params.assetCode ? String(params.assetCode).trim() : undefined,
    assetCodes: normalizeStringList(params.assetCodes),
    plannedUnits: Number(params.plannedUnits),
    completedUnits: 0,
    rejectedUnits: 0,
    sourceQtyUsed: 0,
    lossQty: 0,
    notes: params.notes,
    complianceSnapshot,
    startedAt: nowIso(),
    updatedAt: nowIso(),
  });
  await writePackagingRunsState({
    ...packagingState,
    runs: [run, ...packagingState.runs],
  });
  return run;
};

export const completePackagingRun = async (params: {
  runId: string;
  completedUnits: number;
  rejectedUnits?: number;
  sourceQtyUsed: number;
  lossQty?: number;
  operator?: string;
  packageLineLabel?: string;
  lossReasonCode?: string;
  rejectionReasonCode?: string;
  assetId?: string;
  assetCode?: string;
  assetCodes?: string[];
}): Promise<PackagingRunRecord> => {
  const state = await readPackagingRunsState();
  const index = state.runs.findIndex((run) => run.id === String(params.runId).trim());
  if (index < 0) {
    throw new Error('Packaging run not found.');
  }
  const current = state.runs[index];
  if (current.status === 'completed') {
    return current;
  }

  const source = await getBatchById(current.sourceBatchId);
  if (!source) {
    throw new Error('Source batch no longer exists.');
  }

  const completedUnits = Math.max(0, normalizeQty(Number(params.completedUnits)));
  const rejectedUnits = Math.max(0, normalizeQty(Number(params.rejectedUnits ?? current.rejectedUnits)));
  const packageFormatSpec = derivePackageFormatSpec(current.packageType, current.packageFormatCode);
  if (
    packageFormatSpec &&
    convertVolume(1, source.unit, packageFormatSpec.unitOfMeasure) === null
  ) {
    throw new Error(
      `Source batch unit "${source.unit}" is not a supported liquid volume for packaging. Set the batch unit to bbl, gal, L, or mL before completing the run.`
    );
  }
  const autoDerivedSourceQtyUsed =
    packageFormatSpec && completedUnits + rejectedUnits > 0
      ? convertVolume(
          normalizeQty((completedUnits + rejectedUnits) * packageFormatSpec.unitSize),
          packageFormatSpec.unitOfMeasure,
          source.unit
        )
      : null;
  const sourceQtyUsed = Math.max(
    0,
    normalizeQty(
      Number(params.sourceQtyUsed) > 0
        ? Number(params.sourceQtyUsed)
        : autoDerivedSourceQtyUsed ?? 0
    )
  );
  if (
    Number(params.sourceQtyUsed) > 0 &&
    autoDerivedSourceQtyUsed !== null &&
    autoDerivedSourceQtyUsed > 0
  ) {
    const drift = Math.abs(sourceQtyUsed - autoDerivedSourceQtyUsed) / autoDerivedSourceQtyUsed;
    if (drift > 0.25) {
      throw new Error(
        `Manual source quantity used (${sourceQtyUsed} ${source.unit}) does not match the packaged units for ${current.packageFormatCode ?? current.packageType}. Put extra liquid in loss qty instead.`
      );
    }
  }
  const lossQty = Math.max(0, normalizeQty(Number(params.lossQty ?? current.lossQty)));
  const sourceDepletion = normalizeQty(sourceQtyUsed + lossQty);
  const sourceAvailableQty = Math.max(
    0,
    normalizeQty(source.producedQty - source.allocatedQty - (source.dispensedQty ?? 0))
  );
  if (sourceDepletion > sourceAvailableQty) {
    throw new Error(`Packaging run exceeds source availability (${sourceAvailableQty} ${source.unit}).`);
  }

  const packageLot =
    (current.packageLotId ? await getPackageLotById(current.packageLotId) : null) ??
    (await createPackageLot({
      batchId: source.id,
      packageType: current.packageType,
      packageFormatCode: current.packageFormatCode,
      containerStyle: current.containerStyle,
      packageSkuId: current.outputSkuId,
      totalUnits: completedUnits,
      unitSize: packageFormatSpec?.unitSize,
      unitOfMeasure: packageFormatSpec?.unitOfMeasure ?? 'units',
      siteId: current.siteId,
      notes: current.notes,
      primaryAssetId: params.assetId ?? current.assetId,
      primaryAssetCode: params.assetCode ?? current.assetCode,
      assetCodes: params.assetCodes ?? current.assetCodes,
      metadata: {
        createdFrom: 'packaging-run-complete',
        outputSkuId: current.outputSkuId,
        containerStyle: current.containerStyle,
        packageLineLabel: params.packageLineLabel ?? current.packageLineLabel,
        operator: params.operator ?? current.operator,
      },
    }));

  const updatedPackageLot =
    (await updatePackageLot({
      lotId: packageLot.id,
      totalUnits: completedUnits,
      status: 'closed',
      unitSize: packageFormatSpec?.unitSize,
      unitOfMeasure: packageFormatSpec?.unitOfMeasure ?? packageLot.unitOfMeasure,
      containerStyle: current.containerStyle,
      primaryAssetId: params.assetId ?? current.assetId,
      primaryAssetCode: params.assetCode ?? current.assetCode,
      assetCodes: normalizeStringList(params.assetCodes ?? current.assetCodes),
      metadata: {
        outputSkuId: current.outputSkuId,
        containerStyle: current.containerStyle,
        packageLineLabel: params.packageLineLabel ?? current.packageLineLabel,
        operator: params.operator ?? current.operator,
        complianceSnapshot: current.complianceSnapshot,
        lossReasonCode: params.lossReasonCode ?? current.lossReasonCode,
        rejectionReasonCode: params.rejectionReasonCode ?? current.rejectionReasonCode,
      },
    })) ?? packageLot;

  await updateBatchOutput({
    batchId: source.id,
    producedQty: source.producedQty,
    dispensedQty: normalizeQty((source.dispensedQty ?? 0) + sourceDepletion),
    unit: source.unit,
    status: source.status,
    appendDeviation: {
      field: 'packaging',
      planned: current.plannedUnits,
      actual: completedUnits,
      note:
        packageFormatSpec && sourceQtyUsed > 0
          ? `Packaging run ${current.id} completed. Packed ${completedUnits} sellable / ${rejectedUnits} rejected units for ${sourceQtyUsed} ${source.unit}. Loss ${lossQty} ${source.unit}.`
          : `Packaging run ${current.id} completed. Loss ${lossQty} ${source.unit}.`,
      source: 'manual',
      actor: params.operator ? String(params.operator).trim() : current.operator,
      reasonCode:
        params.lossReasonCode ? String(params.lossReasonCode).trim() : current.lossReasonCode,
    },
  });

  await upsertCoreProduct({
    productId: source.productSnapshot?.productId,
    productCode: source.productSnapshot?.productCode,
    productName: source.productSnapshot?.productName || source.recipeName,
    skuId: current.outputSkuId,
    beverageClass: source.productSnapshot?.beverageClass,
    images: source.productSnapshot?.images,
    sourceSuite: 'os',
  });

  const inventoryItem = await ensureInventoryItemForOutputSku({
    skuId: current.outputSkuId,
    siteId: current.siteId,
    name:
      current.complianceSnapshot.productName ??
      current.complianceSnapshot.brandName ??
      current.outputSkuId,
  });
  const inventoryState = await readInventoryState();
  const itemIndex = inventoryState.items.findIndex((item) => item.id === inventoryItem.id);
  if (itemIndex >= 0) {
    const nextItems = [...inventoryState.items];
    nextItems[itemIndex] = {
      ...nextItems[itemIndex],
      onHandQty: normalizeQty(nextItems[itemIndex].onHandQty + completedUnits),
      updatedAt: nowIso(),
    };
    await writeInventoryState({
      ...inventoryState,
      items: nextItems,
    });
  }

  const movementState = await readInventoryMovements();
  const movement: InventoryMovementRecord = {
    id: randomUUID(),
    itemId: inventoryItem.id,
    siteId: current.siteId,
    type: 'produce',
    quantity: completedUnits,
    unit: 'units',
    reason: `Packaging run ${current.id} completed.`,
    reasonCode: 'packaging_complete',
    actor: params.operator ? String(params.operator).trim() : current.operator,
    batchId: source.id,
    packageLotId: updatedPackageLot.id,
    assetId: params.assetId ?? current.assetId,
    assetCode: params.assetCode ?? current.assetCode,
    metadata: {
      packageLotCode: updatedPackageLot.packageLotCode ?? updatedPackageLot.lotCode,
      packageLineLabel: params.packageLineLabel ?? current.packageLineLabel,
      outputSkuId: current.outputSkuId,
      rejectedUnits,
      lossQty,
      sourceQtyUsed,
      complianceSnapshot: current.complianceSnapshot,
    },
    createdAt: nowIso(),
  };
  await writeInventoryMovements({
    ...movementState,
    movements: [...movementState.movements, movement],
  });

  const next: PackagingRunRecord = normalizePackagingRun({
    ...current,
    sourceUnit: source.unit,
    operator: params.operator ? String(params.operator).trim() : current.operator,
    packageLineLabel:
      params.packageLineLabel ? String(params.packageLineLabel).trim() : current.packageLineLabel,
    lossReasonCode:
      params.lossReasonCode ? String(params.lossReasonCode).trim() : current.lossReasonCode,
    rejectionReasonCode:
      params.rejectionReasonCode
        ? String(params.rejectionReasonCode).trim()
        : current.rejectionReasonCode,
    assetId: params.assetId ? String(params.assetId).trim() : current.assetId,
    assetCode: params.assetCode ? String(params.assetCode).trim() : current.assetCode,
    assetCodes: normalizeStringList(params.assetCodes ?? current.assetCodes),
    completedUnits,
    rejectedUnits,
    sourceQtyUsed,
    lossQty,
    packageLotId: updatedPackageLot.id,
    packageLotCode: updatedPackageLot.packageLotCode ?? updatedPackageLot.lotCode,
    sourceAvailableQty: Math.max(0, normalizeQty(sourceAvailableQty - sourceDepletion)),
    status: 'completed',
    completedAt: nowIso(),
    updatedAt: nowIso(),
  });
  const runs = [...state.runs];
  runs[index] = next;
  await writePackagingRunsState({
    ...state,
    runs,
  });
  return next;
};

export interface PackagingReconciliationReport {
  generatedAt: string;
  apply: boolean;
  runsScanned: number;
  completedRunsScanned: number;
  correctedRunSourceQty: Array<{
    runId: string;
    batchId: string;
    previousSourceQtyUsed: number;
    nextSourceQtyUsed: number;
  }>;
  canceledZeroRuns: string[];
  updatedLots: Array<{
    lotId: string;
    previousTotalUnits: number;
    nextTotalUnits: number;
  }>;
  removedLots: string[];
  adjustedRunAvailabilitySnapshots: Array<{
    runId: string;
    previousSourceAvailableQty: number;
    nextSourceAvailableQty: number;
  }>;
  adjustedMovementRecords: Array<{
    movementId: string;
    runId: string;
    previousQuantity: number;
    nextQuantity: number;
  }>;
  removedMovementRecords: string[];
  adjustedBatchDeviationNotes: Array<{
    batchId: string;
    runId: string;
  }>;
  adjustedInventoryItems: Array<{
    skuId: string;
    siteId: string;
    previousOnHandQty: number;
    nextOnHandQty: number;
  }>;
  adjustedBatches: Array<{
    batchId: string;
    previousDispensedQty: number;
    nextDispensedQty: number;
  }>;
  findings: string[];
}

export const reconcilePackagingIntegrity = async (params?: {
  apply?: boolean;
}): Promise<PackagingReconciliationReport> => {
  const apply = params?.apply === true;
  const [packagingState, lotState, batchState, inventoryState, movementState] = await Promise.all([
    readPackagingRunsState(),
    readPackageLotState(),
    readBatchState(),
    readInventoryState(),
    readInventoryMovements(),
  ]);

  const nextRuns = [...packagingState.runs].map((run) => normalizePackagingRun(run));
  const nextLots = [...lotState.lots].map((lot) => ({ ...lot }));
  const nextBatches = [...batchState.batches].map((batch) => ({ ...batch }));
  const nextItems = [...inventoryState.items].map((item) => ({ ...item }));
  const nextMovements = [...movementState.movements].map((movement) => ({
    ...movement,
    metadata:
      movement.metadata && typeof movement.metadata === 'object'
        ? { ...(movement.metadata as Record<string, unknown>) }
        : undefined,
  }));

  const report: PackagingReconciliationReport = {
    generatedAt: nowIso(),
    apply,
    runsScanned: nextRuns.length,
    completedRunsScanned: 0,
    correctedRunSourceQty: [],
    canceledZeroRuns: [],
    updatedLots: [],
    removedLots: [],
    adjustedRunAvailabilitySnapshots: [],
    adjustedMovementRecords: [],
    removedMovementRecords: [],
    adjustedBatchDeviationNotes: [],
    adjustedInventoryItems: [],
    adjustedBatches: [],
    findings: [],
  };

  const packagingCurrentByBatch = new Map<string, number>();
  const packagingCorrectedByBatch = new Map<string, number>();
  const inventoryAdjustments = new Map<string, number>();

  const getLotIndexForRun = (run: PackagingRunRecord): number => {
    if (run.packageLotId) {
      const byId = nextLots.findIndex((lot) => lot.id === run.packageLotId);
      if (byId >= 0) return byId;
    }
    if (run.packageLotCode) {
      return nextLots.findIndex(
        (lot) => String(lot.packageLotCode ?? lot.lotCode).trim() === String(run.packageLotCode).trim()
      );
    }
    return -1;
  };

  const getMovementIndexesForRun = (run: PackagingRunRecord): number[] =>
    nextMovements
      .map((movement, movementIndex) => ({ movement, movementIndex }))
      .filter(({ movement }) => {
        if (movement.reasonCode !== 'packaging_complete') return false;
        if (movement.batchId !== run.sourceBatchId) return false;
        if (movement.reason === `Packaging run ${run.id} completed.`) return true;
        if (run.packageLotId && movement.packageLotId === run.packageLotId) return true;
        return false;
      })
      .map(({ movementIndex }) => movementIndex);

  for (let index = 0; index < nextRuns.length; index += 1) {
    const run = nextRuns[index];
    const currentTotal =
      run.status === 'completed' ? normalizeQty(Number(run.sourceQtyUsed) + Number(run.lossQty)) : 0;
    packagingCurrentByBatch.set(
      run.sourceBatchId,
      normalizeQty((packagingCurrentByBatch.get(run.sourceBatchId) ?? 0) + currentTotal)
    );

    if (run.status !== 'completed') {
      continue;
    }
    report.completedRunsScanned += 1;

    const correctedRun = { ...run };
    const hasNoOperationalEffect =
      correctedRun.completedUnits <= 0 && correctedRun.rejectedUnits <= 0 && correctedRun.lossQty <= 0;

    if (hasNoOperationalEffect) {
      correctedRun.status = 'canceled';
      correctedRun.completedAt = undefined;
      correctedRun.updatedAt = nowIso();
      report.canceledZeroRuns.push(correctedRun.id);

      const removableLotIndex = getLotIndexForRun(correctedRun);
      if (removableLotIndex >= 0) {
        const lot = nextLots[removableLotIndex];
        const hasLotActivity =
          Number(lot.totalUnits) > 0 ||
          Number(lot.allocatedUnits) > 0 ||
          Number(lot.shippedUnits) > 0 ||
          (lot.events?.length ?? 0) > 0;
        if (!hasLotActivity) {
          report.removedLots.push(lot.id);
          nextLots.splice(removableLotIndex, 1);
          correctedRun.packageLotId = undefined;
          correctedRun.packageLotCode = undefined;
        } else {
          report.findings.push(
            `Run ${correctedRun.id} has zero completed units but package lot ${lot.id} has downstream activity and was not removed.`
          );
        }
      }

      const removableMovementIndexes = getMovementIndexesForRun(correctedRun).sort((left, right) => right - left);
      for (const movementIndex of removableMovementIndexes) {
        const movement = nextMovements[movementIndex];
        if (Number(movement.quantity) > 0) {
          report.findings.push(
            `Run ${correctedRun.id} is zero-effect, but inventory movement ${movement.id} still carries ${movement.quantity} units and needs manual review.`
          );
          continue;
        }
        report.removedMovementRecords.push(movement.id);
        nextMovements.splice(movementIndex, 1);
      }

      nextRuns[index] = correctedRun;
      continue;
    }

    const source = nextBatches.find((batch) => batch.id === correctedRun.sourceBatchId);
    if (!source) {
      report.findings.push(`Source batch ${correctedRun.sourceBatchId} is missing for packaging run ${correctedRun.id}.`);
      const correctedTotal = normalizeQty(Number(correctedRun.sourceQtyUsed) + Number(correctedRun.lossQty));
      packagingCorrectedByBatch.set(
        correctedRun.sourceBatchId,
        normalizeQty((packagingCorrectedByBatch.get(correctedRun.sourceBatchId) ?? 0) + correctedTotal)
      );
      nextRuns[index] = correctedRun;
      continue;
    }

    if (correctedRun.sourceUnit !== source.unit) {
      correctedRun.sourceUnit = source.unit;
      correctedRun.updatedAt = nowIso();
    }

    const packageFormatSpec = derivePackageFormatSpec(correctedRun.packageType, correctedRun.packageFormatCode);
    const autoDerivedSourceQtyUsed =
      packageFormatSpec && correctedRun.completedUnits + correctedRun.rejectedUnits > 0
        ? convertVolume(
            normalizeQty((correctedRun.completedUnits + correctedRun.rejectedUnits) * packageFormatSpec.unitSize),
            packageFormatSpec.unitOfMeasure,
            source.unit
          )
        : null;
    if (autoDerivedSourceQtyUsed !== null && autoDerivedSourceQtyUsed > 0) {
      const drift =
        correctedRun.sourceQtyUsed > 0
          ? Math.abs(correctedRun.sourceQtyUsed - autoDerivedSourceQtyUsed) / autoDerivedSourceQtyUsed
          : Number.POSITIVE_INFINITY;
      if (correctedRun.sourceQtyUsed <= 0 || drift > 0.25) {
        report.correctedRunSourceQty.push({
          runId: correctedRun.id,
          batchId: correctedRun.sourceBatchId,
          previousSourceQtyUsed: correctedRun.sourceQtyUsed,
          nextSourceQtyUsed: normalizeQty(autoDerivedSourceQtyUsed),
        });
        correctedRun.sourceQtyUsed = normalizeQty(autoDerivedSourceQtyUsed);
        correctedRun.updatedAt = nowIso();
      }
    }

    const lotIndex = getLotIndexForRun(correctedRun);
    if (lotIndex >= 0) {
      const currentLot = nextLots[lotIndex];
      const minimumTotalUnits = normalizeQty(
        Number(currentLot.allocatedUnits ?? 0) + Number(currentLot.shippedUnits ?? 0)
      );
      const desiredTotalUnits = Math.max(correctedRun.completedUnits, minimumTotalUnits);
      if (desiredTotalUnits !== correctedRun.completedUnits) {
        report.findings.push(
          `Package lot ${currentLot.id} already has allocated or shipped units, so its total could not be reduced below ${minimumTotalUnits}.`
        );
      }

      if (
        currentLot.totalUnits !== desiredTotalUnits ||
        currentLot.status !== 'closed' ||
        currentLot.packageFormatCode !== correctedRun.packageFormatCode ||
        currentLot.containerStyle !== correctedRun.containerStyle ||
        currentLot.unitSize !== packageFormatSpec?.unitSize ||
        currentLot.unitOfMeasure !== (packageFormatSpec?.unitOfMeasure ?? currentLot.unitOfMeasure)
      ) {
        report.updatedLots.push({
          lotId: currentLot.id,
          previousTotalUnits: Number(currentLot.totalUnits),
          nextTotalUnits: desiredTotalUnits,
        });
      }

      const lotDelta = normalizeQty(desiredTotalUnits - Number(currentLot.totalUnits));
      if (lotDelta !== 0) {
        const skuId = normalizeSkuId(currentLot.packageSkuId ?? currentLot.skuId ?? correctedRun.outputSkuId);
        const key = `${normalizeSiteId(currentLot.siteId)}::${skuId}`;
        inventoryAdjustments.set(key, normalizeQty((inventoryAdjustments.get(key) ?? 0) + lotDelta));
      }

      nextLots[lotIndex] = {
        ...currentLot,
        packageType: correctedRun.packageType,
        packageFormatCode: correctedRun.packageFormatCode,
        containerStyle: correctedRun.containerStyle,
        packageSkuId: correctedRun.outputSkuId,
        totalUnits: desiredTotalUnits,
        unitSize: packageFormatSpec?.unitSize ?? currentLot.unitSize,
        unitOfMeasure: packageFormatSpec?.unitOfMeasure ?? currentLot.unitOfMeasure,
        status: 'closed',
        primaryAssetId: correctedRun.assetId ?? currentLot.primaryAssetId,
        primaryAssetCode: correctedRun.assetCode ?? currentLot.primaryAssetCode,
        assetCodes: normalizeStringList(correctedRun.assetCodes ?? currentLot.assetCodes),
        updatedAt: nowIso(),
      };
      correctedRun.packageLotId = nextLots[lotIndex].id;
      correctedRun.packageLotCode = nextLots[lotIndex].packageLotCode ?? nextLots[lotIndex].lotCode;
    } else {
      report.findings.push(
        `Completed packaging run ${correctedRun.id} has no linked package lot to reconcile.`
      );
    }

    const movementIndexes = getMovementIndexesForRun(correctedRun);
    for (const movementIndex of movementIndexes) {
      const movement = nextMovements[movementIndex];
      const previousQuantity = Number(movement.quantity ?? 0);
      const nextQuantity = correctedRun.completedUnits;
      const nextMetadata = {
        ...(movement.metadata ?? {}),
        packageLotCode: correctedRun.packageLotCode,
        outputSkuId: correctedRun.outputSkuId,
        rejectedUnits: correctedRun.rejectedUnits,
        lossQty: correctedRun.lossQty,
        sourceQtyUsed: correctedRun.sourceQtyUsed,
        complianceSnapshot: correctedRun.complianceSnapshot,
      };
      const movementChanged =
        previousQuantity !== nextQuantity ||
        movement.packageLotId !== correctedRun.packageLotId ||
        JSON.stringify(movement.metadata ?? {}) !== JSON.stringify(nextMetadata);
      if (!movementChanged) continue;
      report.adjustedMovementRecords.push({
        movementId: movement.id,
        runId: correctedRun.id,
        previousQuantity,
        nextQuantity,
      });
      nextMovements[movementIndex] = {
        ...movement,
        quantity: nextQuantity,
        packageLotId: correctedRun.packageLotId,
        metadata: nextMetadata,
      };
    }

    const correctedTotal = normalizeQty(Number(correctedRun.sourceQtyUsed) + Number(correctedRun.lossQty));
    packagingCorrectedByBatch.set(
      correctedRun.sourceBatchId,
      normalizeQty((packagingCorrectedByBatch.get(correctedRun.sourceBatchId) ?? 0) + correctedTotal)
    );
    nextRuns[index] = correctedRun;
  }

  const completedRunIndexesByBatch = new Map<string, number[]>();
  nextRuns.forEach((run, runIndex) => {
    if (run.status !== 'completed') return;
    const indexes = completedRunIndexesByBatch.get(run.sourceBatchId) ?? [];
    indexes.push(runIndex);
    completedRunIndexesByBatch.set(run.sourceBatchId, indexes);
  });

  for (const [batchId, runIndexes] of completedRunIndexesByBatch.entries()) {
    const batch = nextBatches.find((entry) => entry.id === batchId);
    if (!batch) continue;
    const currentPackagingTotal = packagingCurrentByBatch.get(batchId) ?? 0;
    const nonPackagingDispensed = Math.max(
      0,
      normalizeQty(Number(batch.dispensedQty ?? 0) - currentPackagingTotal)
    );
    const baselineAvailable = Math.max(
      0,
      normalizeQty(Number(batch.producedQty) - Number(batch.allocatedQty ?? 0) - nonPackagingDispensed)
    );

    let remainingQty = baselineAvailable;
    let cumulativePackagingQty = 0;
    runIndexes
      .sort((left, right) => {
        const leftRun = nextRuns[left];
        const rightRun = nextRuns[right];
        const leftTime =
          Date.parse(leftRun.completedAt ?? leftRun.updatedAt ?? leftRun.startedAt ?? '') || 0;
        const rightTime =
          Date.parse(rightRun.completedAt ?? rightRun.updatedAt ?? rightRun.startedAt ?? '') || 0;
        return leftTime - rightTime;
      })
      .forEach((runIndex) => {
        const run = nextRuns[runIndex];
        const depletion = normalizeQty(Number(run.sourceQtyUsed) + Number(run.lossQty));
        cumulativePackagingQty = normalizeQty(cumulativePackagingQty + depletion);
        remainingQty = Math.max(0, normalizeQty(remainingQty - depletion));
        if (run.sourceAvailableQty !== remainingQty) {
          report.adjustedRunAvailabilitySnapshots.push({
            runId: run.id,
            previousSourceAvailableQty: run.sourceAvailableQty,
            nextSourceAvailableQty: remainingQty,
          });
          nextRuns[runIndex] = {
            ...run,
            sourceAvailableQty: remainingQty,
            updatedAt: nowIso(),
          };
        }
      });

    if (cumulativePackagingQty > baselineAvailable + 1e-6) {
      report.findings.push(
        `Batch ${batch.batchCode ?? batch.lotCode ?? batch.id} has ${cumulativePackagingQty} ${batch.unit} packaged against ${baselineAvailable} ${batch.unit} available. Historical run data exceeds source volume and needs operator review.`
      );
    }
  }

  const itemIndexByKey = new Map<string, number>();
  nextItems.forEach((item, index) => {
    itemIndexByKey.set(`${normalizeSiteId(item.siteId)}::${normalizeSkuId(item.skuId)}`, index);
  });
  for (const [key, delta] of inventoryAdjustments.entries()) {
    if (delta === 0) continue;
    const itemIndex = itemIndexByKey.get(key);
    if (itemIndex === undefined) {
      report.findings.push(`Inventory item ${key} is missing for a reconciled package lot delta of ${delta}.`);
      continue;
    }
    const currentItem = nextItems[itemIndex];
    const nextOnHandQty = normalizeQty(Math.max(0, Number(currentItem.onHandQty) + delta));
    if (nextOnHandQty !== Number(currentItem.onHandQty)) {
      report.adjustedInventoryItems.push({
        skuId: currentItem.skuId,
        siteId: currentItem.siteId,
        previousOnHandQty: Number(currentItem.onHandQty),
        nextOnHandQty,
      });
      nextItems[itemIndex] = {
        ...currentItem,
        onHandQty: nextOnHandQty,
        updatedAt: nowIso(),
      };
    }
  }

  const lotIdsByBatch = new Map<string, Set<string>>();
  for (const lot of nextLots) {
    const set = lotIdsByBatch.get(lot.batchId) ?? new Set<string>();
    set.add(lot.id);
    lotIdsByBatch.set(lot.batchId, set);
  }

  for (let index = 0; index < nextBatches.length; index += 1) {
    const batch = nextBatches[index];
    const currentPackagingTotal = packagingCurrentByBatch.get(batch.id) ?? 0;
    const correctedPackagingTotal = packagingCorrectedByBatch.get(batch.id) ?? currentPackagingTotal;
    const packagingDelta = normalizeQty(correctedPackagingTotal - currentPackagingTotal);
    const nextDispensedQty =
      packagingDelta !== 0
        ? normalizeQty(Math.max(0, Number(batch.dispensedQty ?? 0) + packagingDelta))
        : Number(batch.dispensedQty ?? 0);
    const nextPackageLotIds = Array.from(lotIdsByBatch.get(batch.id) ?? []);
    const nextDeviations = (batch.deviations ?? []).flatMap((deviation) => {
      const note = deviation.note ?? '';
      const runMatch = note.match(/^Packaging run ([0-9a-f-]+) completed\./i);
      if (!runMatch) return [deviation];
      const run = nextRuns.find((candidate) => candidate.id === runMatch[1] && candidate.sourceBatchId === batch.id);
      if (!run) return [deviation];
      if (run.status === 'canceled' && run.completedUnits <= 0 && run.rejectedUnits <= 0 && run.lossQty <= 0) {
        report.adjustedBatchDeviationNotes.push({
          batchId: batch.id,
          runId: run.id,
        });
        return [];
      }

      const nextNote =
        run.completedUnits > 0 || run.rejectedUnits > 0
          ? `Packaging run ${run.id} completed. Packed ${run.completedUnits} sellable / ${run.rejectedUnits} rejected units for ${run.sourceQtyUsed} ${run.sourceUnit}. Loss ${run.lossQty} ${run.sourceUnit}.`
          : `Packaging run ${run.id} completed. Loss ${run.lossQty} ${run.sourceUnit}.`;
      const changed =
        deviation.note !== nextNote ||
        deviation.actual !== run.completedUnits ||
        deviation.reasonCode !== run.lossReasonCode;
      if (changed) {
        report.adjustedBatchDeviationNotes.push({
          batchId: batch.id,
          runId: run.id,
        });
      }
      return [
        {
          ...deviation,
          actual: run.completedUnits,
          note: nextNote,
          reasonCode: run.lossReasonCode ?? deviation.reasonCode,
        },
      ];
    });

    if (
      nextDispensedQty !== Number(batch.dispensedQty ?? 0) ||
      nextPackageLotIds.join(',') !== normalizeStringList(batch.packageLotIds).join(',') ||
      JSON.stringify(nextDeviations) !== JSON.stringify(batch.deviations ?? [])
    ) {
      if (nextDispensedQty !== Number(batch.dispensedQty ?? 0)) {
        report.adjustedBatches.push({
          batchId: batch.id,
          previousDispensedQty: Number(batch.dispensedQty ?? 0),
          nextDispensedQty,
        });
      }
      nextBatches[index] = {
        ...batch,
        dispensedQty: nextDispensedQty,
        packageLotIds: nextPackageLotIds,
        deviations: nextDeviations,
        updatedAt: nowIso(),
      };
    }
  }

  if (apply) {
    await Promise.all([
      writePackagingRunsState({
        ...packagingState,
        runs: nextRuns,
      }),
      writePackageLotState({
        ...lotState,
        lots: nextLots,
      }),
      writeInventoryState({
        ...inventoryState,
        items: nextItems,
      }),
      writeInventoryMovements({
        ...movementState,
        movements: nextMovements,
      }),
    ]);

    for (const batch of nextBatches) {
      const previous = batchState.batches.find((candidate) => candidate.id === batch.id);
      if (!previous) continue;
      const changed =
        Number(previous.dispensedQty ?? 0) !== Number(batch.dispensedQty ?? 0) ||
        JSON.stringify(normalizeStringList(previous.packageLotIds)) !==
          JSON.stringify(normalizeStringList(batch.packageLotIds)) ||
        JSON.stringify(previous.deviations ?? []) !== JSON.stringify(batch.deviations ?? []);
      if (!changed) continue;
      await updateBatchOutput({
        batchId: batch.id,
        producedQty: batch.producedQty,
        dispensedQty: batch.dispensedQty,
        unit: batch.unit,
        status: batch.status,
        packageLotIds: batch.packageLotIds,
        deviations: batch.deviations,
      });
    }
  }

  return report;
};
