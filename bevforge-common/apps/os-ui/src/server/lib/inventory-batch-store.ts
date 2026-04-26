import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { commissioningPaths, ensureCommissioningStore } from './commissioning-store.js';
import { validateMeasuredValues } from './measurement-guards.js';
import type { ImportedRecipe } from '../../features/canvas/types.js';
import type { BatchProductSnapshot, BeverageClass, ProductImageVariants } from '../../features/products/types.js';
import {
  batchSequenceLabel,
  extractBatchSuffix,
  normalizeBranchCode,
  normalizeHumanCode,
  packageSequenceLabel,
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

const normalizeBatchVolumeUnit = (value: unknown): string => {
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

const generateLotCode = (): string => `LOT-${Date.now().toString(36).toUpperCase()}`;

const normalizeLotCode = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const normalized = normalizeHumanCode(value);
  return normalized.length > 0 ? normalized : undefined;
};

const ensureUniqueCode = (candidate: string, existing: Set<string>): string => {
  const normalized = normalizeHumanCode(candidate);
  if (!normalized) return generateLotCode();
  if (!existing.has(normalized)) return normalized;
  let index = 2;
  while (existing.has(`${normalized}-${index}`)) {
    index += 1;
  }
  return `${normalized}-${index}`;
};

const buildSourceBatchCode = (params: {
  productCode?: string;
  existingCodes: Set<string>;
}): string => {
  const productCode = normalizeHumanCode(params.productCode);
  if (!productCode) {
    return ensureUniqueCode(generateLotCode(), params.existingCodes);
  }
  const pattern = new RegExp(`^${productCode}-B(\\d+)(?:-.+)?$`);
  let maxSequence = 0;
  for (const code of params.existingCodes) {
    const match = pattern.exec(code);
    if (match) {
      maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
    }
  }
  return ensureUniqueCode(`${productCode}-${batchSequenceLabel(maxSequence + 1)}`, params.existingCodes);
};

const buildDerivedBatchCode = (params: {
  parentBatchCode?: string;
  branchCode?: string;
  existingCodes: Set<string>;
}): string => {
  const parentBatchCode = normalizeHumanCode(params.parentBatchCode);
  const branchCode = normalizeBranchCode(params.branchCode);
  if (!parentBatchCode) {
    return ensureUniqueCode(generateLotCode(), params.existingCodes);
  }
  if (!branchCode) {
    return ensureUniqueCode(parentBatchCode, params.existingCodes);
  }
  return ensureUniqueCode(`${parentBatchCode}-${branchCode}`, params.existingCodes);
};

const buildPackageLotCode = (params: {
  skuId?: string;
  batchCode?: string;
  productCode?: string;
  existingCodes: Set<string>;
}): string => {
  const skuCode = normalizeHumanCode(params.skuId);
  const batchSuffix = normalizeHumanCode(
    extractBatchSuffix(params.batchCode ?? '', params.productCode)
  );
  const prefix = normalizeHumanCode([skuCode, batchSuffix].filter(Boolean).join('-'));
  if (!prefix) {
    return ensureUniqueCode(generateLotCode(), params.existingCodes);
  }
  const pattern = new RegExp(`^${prefix}-P(\\d+)$`);
  let maxSequence = 0;
  for (const code of params.existingCodes) {
    const match = pattern.exec(code);
    if (match) {
      maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
    }
  }
  return ensureUniqueCode(`${prefix}-${packageSequenceLabel(maxSequence + 1)}`, params.existingCodes);
};

const deriveProductCodeFromSkuAndFormat = (
  skuId: unknown,
  packageFormatCode: unknown
): string | undefined => {
  const normalizedSkuId = normalizeHumanCode(skuId);
  const normalizedFormat = normalizeHumanCode(packageFormatCode);
  if (!normalizedSkuId || !normalizedFormat) return undefined;
  const suffix = `-${normalizedFormat}`;
  if (!normalizedSkuId.endsWith(suffix)) return undefined;
  const next = normalizedSkuId.slice(0, -suffix.length).trim();
  return next.length > 0 ? next : undefined;
};

export type InventoryCategory =
  | 'yeast'
  | 'malt'
  | 'hops'
  | 'fruit'
  | 'packaging'
  | 'equipment'
  | 'other';

export interface InventoryItemRecord {
  id: string;
  skuId: string;
  sku: string;
  siteId: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  onHandQty: number;
  allocatedQty: number;
  onOrderQty: number;
  reorderPointQty: number;
  costPerUnit?: number;
  vendorName?: string;
  vendorSku?: string;
  vendorProductUrl?: string;
  vendorLeadTimeDays?: number;
  vendorPackSize?: number;
  vendorDefaultOrderQty?: number;
  vendorNotes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface InventoryState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  items: InventoryItemRecord[];
}

export type InventoryMovementType =
  | 'consume'
  | 'produce'
  | 'adjust'
  | 'allocate'
  | 'release'
  | 'ship'
  | 'order'
  | 'receive';

export interface InventoryMovementRecord {
  id: string;
  itemId: string;
  siteId: string;
  type: InventoryMovementType;
  quantity: number;
  unit: string;
  reason?: string;
  reasonCode?: string;
  actor?: string;
  recipeId?: string;
  recipeRunId?: string;
  batchId?: string;
  packageLotId?: string;
  assetId?: string;
  assetCode?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface InventoryMovementsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  movements: InventoryMovementRecord[];
}

export type ProcurementOrderStatus =
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'canceled';

export type ProcurementOrderLineStatus =
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'canceled';

export interface ProcurementOrderLineRecord {
  id: string;
  itemId: string;
  skuId: string;
  itemName: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  costPerUnit?: number;
  vendorSku?: string;
  vendorProductUrl?: string;
  status: ProcurementOrderLineStatus;
  notes?: string;
}

export interface ProcurementOrderEventRecord {
  id: string;
  type: 'created' | 'received' | 'canceled' | 'note';
  timestamp: string;
  lineId?: string;
  qty?: number;
  note?: string;
}

export interface ProcurementOrderRecord {
  schemaVersion: string;
  id: string;
  siteId: string;
  poNumber: string;
  vendorName: string;
  vendorUrl?: string;
  vendorOrderRef?: string;
  status: ProcurementOrderStatus;
  createdAt: string;
  orderedAt: string;
  expectedAt?: string;
  updatedAt: string;
  notes?: string;
  lines: ProcurementOrderLineRecord[];
  events: ProcurementOrderEventRecord[];
}

export interface ProcurementOrdersState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  orders: ProcurementOrderRecord[];
}

export type BatchStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'released'
  | 'allocated'
  | 'shipped'
  | 'canceled';

export interface BatchRecipeIntentSnapshot {
  schemaVersion: string;
  recipeId?: string;
  recipeName: string;
  recipeFormat?: ImportedRecipe['format'];
  sourceFile?: string;
  importedAt?: string;
  stepsCount: number;
  requirementCount: number;
  requirements?: Array<{
    name: string;
    category: InventoryCategory | 'other';
    requiredQty?: number;
    unit?: string;
  }>;
  targets?: {
    targetAbvPct?: number;
    targetResidualSugarPct?: number;
    targetResidualSugarGpl?: number;
    targetSweetnessLevel?: 'bone_dry' | 'semi_dry' | 'semi_sweet' | 'sweet';
  };
  capturedAt: string;
}

export interface BatchActualResultsSnapshot {
  schemaVersion: string;
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
  notes?: string;
  updatedAt: string;
}

export interface BatchReadingLogRecord {
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
}

export interface BatchTreatmentLogRecord {
  id: string;
  timestamp: string;
  type:
    | 'sulfite_addition'
    | 'acid_adjustment'
    | 'sugar_adjustment'
    | 'tannin_addition'
    | 'fining_agent'
    | 'filtration'
    | 'carbonation'
    | 'blend'
    | 'other';
  stage?: string;
  actor?: string;
  quantity?: number;
  unit?: string;
  lotCode?: string;
  note?: string;
  blendComponents?: BatchBlendComponent[];
}

export interface BatchBlendComponent {
  batchId?: string;
  batchCode?: string;
  quantity?: number;
  unit?: string;
}

export interface BatchVolumeCheckpointRecord {
  id: string;
  timestamp: string;
  stage:
    | 'start'
    | 'transfer_out'
    | 'transfer_in'
    | 'packaging'
    | 'loss'
    | 'ending'
    | 'other';
  quantity: number;
  unit: string;
  note?: string;
  actor?: string;
}

export interface BatchSensoryQcRecord {
  id: string;
  timestamp: string;
  stage?: string;
  visualNotes?: string;
  aromaNotes?: string;
  tasteNotes?: string;
  passFail?: 'pass' | 'fail' | 'hold';
  approvalDecision?: 'approved' | 'hold' | 'rejected';
  actor?: string;
  note?: string;
}

export interface BatchStageTimelineEvent {
  id: string;
  timestamp: string;
  stage:
    | 'fermentation_start'
    | 'fermentation_complete'
    | 'conditioning_start'
    | 'oak_aging_start'
    | 'oak_aging_end'
    | 'lees_aging_start'
    | 'lees_aging_end'
    | 'ready_to_package'
    | 'packaged'
    | 'released'
    | 'other';
  actor?: string;
  note?: string;
}

export interface BatchDeviationRecord {
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
}

export interface BatchSourceInputRecord {
  id: string;
  category:
    | 'juice'
    | 'yeast'
    | 'additive'
    | 'nutrient'
    | 'sugar'
    | 'fining'
    | 'ingredient'
    | 'other';
  name: string;
  lotCode?: string;
  sourceName?: string;
  quantity?: number;
  unit?: string;
  brix?: number;
  note?: string;
}

export interface BatchRecord {
  id: string;
  skuId?: string;
  siteId: string;
  batchCode: string;
  lotCode: string;
  batchKind?: 'source' | 'derived';
  productionMode?: 'scheduled_runboard' | 'cellar';
  rootBatchId?: string;
  parentBatchId?: string;
  parentBatchCode?: string;
  containerLabel?: string;
  containerKind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  plannedVesselLabel?: string;
  plannedVesselKind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
  enteredContainerAt?: string;
  recipeId?: string;
  recipeName: string;
  recipeRunId?: string;
  status: BatchStatus;
  producedQty: number;
  allocatedQty: number;
  dispensedQty: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  releasedAt?: string;
  intendedRecipe?: BatchRecipeIntentSnapshot;
  actualResults?: BatchActualResultsSnapshot;
  readingLog?: BatchReadingLogRecord[];
  deviations?: BatchDeviationRecord[];
  sourceInputs?: BatchSourceInputRecord[];
  treatmentLog?: BatchTreatmentLogRecord[];
  volumeCheckpoints?: BatchVolumeCheckpointRecord[];
  sensoryQcRecords?: BatchSensoryQcRecord[];
  stageTimeline?: BatchStageTimelineEvent[];
  packageLotIds?: string[];
  fulfillmentRequestIds?: string[];
  productSnapshot?: BatchProductSnapshot;
}

export interface BatchState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  batches: BatchRecord[];
}

export type ReservationStatus =
  | 'reserved'
  | 'partially_reserved'
  | 'rejected'
  | 'committed'
  | 'released'
  | 'expired';

export type AllocationReasonCode =
  | 'insufficient_available'
  | 'unknown_sku'
  | 'invalid_uom'
  | 'blocked_lot'
  | 'site_unavailable'
  | 'validation_error';

export interface ReservationLotAllocation {
  lotId: string;
  packageLotId?: string;
  packageLotCode?: string;
  batchId?: string;
  itemId: string;
  skuId: string;
  qty: number;
  uom: string;
  expiresAt?: string;
  releaseStatus?: PackageLotReleaseStatus;
}

export interface AvailabilitySnapshot {
  schemaVersion: string;
  skuId: string;
  siteId: string;
  onHandQty: number;
  allocatedQty: number;
  availableQty: number;
  inBondQty: number;
  releasedQty: number;
  shippedQty: number;
  uom: string;
  lotBreakdown: Array<{
    lotId: string;
    packageLotId?: string;
    packageLotCode?: string;
    batchId?: string;
    batchCode?: string;
    assetId?: string;
    assetCode?: string;
    availableQty: number;
    inBondQty?: number;
    releasedQty?: number;
    shippedQty?: number;
    releaseStatus?: PackageLotReleaseStatus;
    expiresAt?: string;
  }>;
  asOf: string;
}

export interface AllocationResponseRecord {
  schemaVersion: string;
  reservationId: string;
  requestId: string;
  orderId: string;
  lineId: string;
  status: 'reserved' | 'partially_reserved' | 'rejected';
  allocatedQty: number;
  shortQty: number;
  reasonCode?: AllocationReasonCode;
  reasonMessage?: string;
  allocations: Array<{
    lotId: string;
    packageLotId?: string;
    packageLotCode?: string;
    batchId?: string;
    batchCode?: string;
    qty: number;
    uom: string;
    expiresAt?: string;
    releaseStatus?: PackageLotReleaseStatus;
  }>;
  availabilitySnapshot: AvailabilitySnapshot;
  respondedAt: string;
}

export interface ReservationRecord {
  schemaVersion: string;
  reservationId: string;
  requestId: string;
  orderId: string;
  lineId: string;
  skuId: string;
  siteId: string;
  uom: string;
  requestedQty: number;
  allowPartial: boolean;
  status: ReservationStatus;
  allocatedQty: number;
  shortQty: number;
  reasonCode?: AllocationReasonCode;
  reasonMessage?: string;
  allocations: ReservationLotAllocation[];
  createdAt: string;
  updatedAt: string;
  response: AllocationResponseRecord;
}

export interface ReservationActionResult {
  schemaVersion: string;
  reservationId: string;
  actionId: string;
  action: 'commit' | 'release' | 'expire';
  status: ReservationStatus;
  allocatedQty: number;
  shortQty: number;
  availabilitySnapshot: AvailabilitySnapshot;
  occurredAt: string;
}

export interface ReservationActionRecord {
  schemaVersion: string;
  actionId: string;
  reservationId: string;
  orderId?: string;
  lineId?: string;
  action: 'commit' | 'release' | 'expire';
  reasonCode?:
    | 'picked'
    | 'shipped'
    | 'order_canceled'
    | 'line_edited'
    | 'reservation_timeout'
    | 'manual_override';
  reasonMessage?: string;
  occurredAt: string;
  createdAt: string;
  result: ReservationActionResult;
}

export interface ReservationState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  reservations: ReservationRecord[];
}

export interface ReservationActionsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  actions: ReservationActionRecord[];
}

export type PackageLotType = 'keg' | 'can' | 'bottle' | 'case' | 'pallet' | 'other';
export type PackageLotStatus = 'planned' | 'active' | 'closed' | 'canceled';
export type PackageLotReleaseStatus = 'held' | 'ready' | 'released' | 'shipped';

export type PackageLotEventAction =
  | 'release_status'
  | 'ship'
  | 'return'
  | 'empty_return'
  | 'rework'
  | 'destroy'
  | 'adjust'
  | 'assign_asset'
  | 'note';

export interface PackageLotEventRecord {
  id: string;
  action: PackageLotEventAction;
  actor?: string;
  reasonCode?: string;
  note?: string;
  quantity?: number;
  unit?: string;
  releaseStatus?: PackageLotReleaseStatus;
  assetId?: string;
  assetCode?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface PackageLotRecord {
  id: string;
  packageLotCode?: string;
  lotCode: string;
  batchId: string;
  batchCode?: string;
  skuId?: string;
  siteId: string;
  packageType: PackageLotType;
  packageFormatCode?: string;
  containerStyle?: string;
  packageSkuId?: string;
  totalUnits: number;
  allocatedUnits: number;
  shippedUnits: number;
  unitSize?: number;
  unitOfMeasure?: string;
  status: PackageLotStatus;
  releaseStatus?: PackageLotReleaseStatus;
  primaryAssetId?: string;
  primaryAssetCode?: string;
  assetCodes?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  events?: PackageLotEventRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PackageLotState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  lots: PackageLotRecord[];
}

export type FulfillmentRequestType = 'production' | 'packaging';
export type FulfillmentRequestStatus =
  | 'queued'
  | 'accepted'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'canceled'
  | 'rejected';

export interface FulfillmentRequestEvent {
  id: string;
  actionId?: string;
  action:
    | 'queue'
    | 'accept'
    | 'start'
    | 'block'
    | 'complete'
    | 'cancel'
    | 'reject'
    | 'link_batch'
    | 'link_package_lot'
    | 'note';
  status: FulfillmentRequestStatus;
  actor?: string;
  note?: string;
  linkedBatchId?: string;
  linkedPackageLotId?: string;
  timestamp: string;
}

export interface FulfillmentRequestRecord {
  schemaVersion: string;
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
  neededBy?: string;
  reasonCode?: string;
  reasonMessage?: string;
  metadata?: Record<string, unknown>;
  linkedBatchIds: string[];
  linkedPackageLotIds: string[];
  createdAt: string;
  updatedAt: string;
  events: FulfillmentRequestEvent[];
}

export interface FulfillmentRequestState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  requests: FulfillmentRequestRecord[];
}

export type FulfillmentOutboxEventType =
  | 'request_queued'
  | 'request_accepted'
  | 'request_started'
  | 'request_blocked'
  | 'request_completed'
  | 'request_canceled'
  | 'request_rejected'
  | 'request_linked_batch'
  | 'request_linked_package_lot'
  | 'request_noted';

export interface FulfillmentOutboxEventRecord {
  schemaVersion: string;
  id: string;
  cursor: number;
  requestId: string;
  actionId?: string;
  action: FulfillmentRequestEvent['action'];
  eventType: FulfillmentOutboxEventType;
  requestType: FulfillmentRequestType;
  status: FulfillmentRequestStatus;
  sourceSuite: 'ops' | 'os' | 'lab' | 'flow' | 'connect';
  siteId: string;
  skuId: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface FulfillmentOutboxState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  nextCursor: number;
  events: FulfillmentOutboxEventRecord[];
}

const inventoryFile = path.join(commissioningPaths.root, 'inventory-state.json');
const inventoryMovementsFile = path.join(commissioningPaths.root, 'inventory-movements.json');
const batchFile = path.join(commissioningPaths.root, 'batch-state.json');
const reservationsFile = path.join(commissioningPaths.root, 'reservation-state.json');
const reservationActionsFile = path.join(commissioningPaths.root, 'reservation-actions.json');
const packageLotsFile = path.join(commissioningPaths.root, 'package-lot-state.json');
const fulfillmentRequestsFile = path.join(commissioningPaths.root, 'fulfillment-requests.json');
const fulfillmentOutboxFile = path.join(commissioningPaths.root, 'fulfillment-outbox.json');
const procurementOrdersFile = path.join(commissioningPaths.root, 'procurement-orders.json');

const defaultInventoryState = (): InventoryState => ({
  schemaVersion: '0.1.0',
  id: 'inventory-state',
  updatedAt: nowIso(),
  items: [
    {
      id: randomUUID(),
      skuId: 'HOP-CASCADE',
      sku: 'HOP-CASCADE',
      siteId: 'main',
      name: 'Cascade Hops',
      category: 'hops',
      unit: 'kg',
      onHandQty: 42,
      allocatedQty: 4,
      onOrderQty: 12,
      reorderPointQty: 50,
      costPerUnit: 19.75,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      skuId: 'MALT-PILSNER',
      sku: 'MALT-PILSNER',
      siteId: 'main',
      name: 'Pilsner Malt',
      category: 'malt',
      unit: 'kg',
      onHandQty: 380,
      allocatedQty: 60,
      onOrderQty: 80,
      reorderPointQty: 200,
      costPerUnit: 1.25,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      skuId: 'YEAST-US05',
      sku: 'YEAST-US05',
      siteId: 'main',
      name: 'SafAle US-05',
      category: 'yeast',
      unit: 'packs',
      onHandQty: 45,
      allocatedQty: 8,
      onOrderQty: 0,
      reorderPointQty: 10,
      costPerUnit: 4.99,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      skuId: 'PKG-CAPS-500',
      sku: 'PKG-CAPS-500',
      siteId: 'main',
      name: 'Crown Caps',
      category: 'packaging',
      unit: 'units',
      onHandQty: 8000,
      allocatedQty: 2500,
      onOrderQty: 1000,
      reorderPointQty: 2000,
      costPerUnit: 0.05,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ],
});

const defaultMovementState = (): InventoryMovementsState => ({
  schemaVersion: '0.1.0',
  id: 'inventory-movements',
  updatedAt: nowIso(),
  movements: [],
});

const defaultProcurementOrdersState = (): ProcurementOrdersState => ({
  schemaVersion: '1.0.0',
  id: 'procurement-orders',
  updatedAt: nowIso(),
  orders: [],
});

const defaultBatchState = (): BatchState => ({
  schemaVersion: '0.1.0',
  id: 'batch-state',
  updatedAt: nowIso(),
  batches: [],
});

const defaultReservationState = (): ReservationState => ({
  schemaVersion: '1.0.0',
  id: 'reservation-state',
  updatedAt: nowIso(),
  reservations: [],
});

const defaultReservationActionsState = (): ReservationActionsState => ({
  schemaVersion: '1.0.0',
  id: 'reservation-actions',
  updatedAt: nowIso(),
  actions: [],
});

const defaultPackageLotState = (): PackageLotState => ({
  schemaVersion: '1.0.0',
  id: 'package-lot-state',
  updatedAt: nowIso(),
  lots: [],
});

const defaultFulfillmentRequestState = (): FulfillmentRequestState => ({
  schemaVersion: '1.0.0',
  id: 'fulfillment-requests',
  updatedAt: nowIso(),
  requests: [],
});

const defaultFulfillmentOutboxState = (): FulfillmentOutboxState => ({
  schemaVersion: '1.0.0',
  id: 'fulfillment-outbox',
  updatedAt: nowIso(),
  nextCursor: 0,
  events: [],
});

const DEFAULT_SITE_ID = 'main';

const normalizeSiteId = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase() || DEFAULT_SITE_ID;

const normalizeSkuId = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .toUpperCase();

const deriveSkuId = (item: Pick<InventoryItemRecord, 'id' | 'skuId' | 'sku'>): string => {
  const fromSkuId = normalizeSkuId(item.skuId);
  if (fromSkuId) return fromSkuId;
  const fromSku = normalizeSkuId(item.sku);
  if (fromSku) return fromSku;
  return normalizeSkuId(item.id);
};

const normalizeInventoryItem = (item: InventoryItemRecord): InventoryItemRecord => {
  const skuId = deriveSkuId(item);
  const toOptionalText = (value: unknown): string | undefined => {
    if (value === undefined || value === null) return undefined;
    const next = String(value).trim();
    return next.length > 0 ? next : undefined;
  };
  const toOptionalNumber = (value: unknown): number | undefined => {
    const next = Number(value);
    return Number.isFinite(next) ? next : undefined;
  };
  return {
    ...item,
    skuId,
    sku: item.sku?.trim() ? normalizeSkuId(item.sku) : skuId,
    siteId: normalizeSiteId(item.siteId),
    onHandQty: Number.isFinite(Number(item.onHandQty)) ? Number(item.onHandQty) : 0,
    allocatedQty: Number.isFinite(Number(item.allocatedQty)) ? Number(item.allocatedQty) : 0,
    onOrderQty: Number.isFinite(Number((item as any).onOrderQty))
      ? Number((item as any).onOrderQty)
      : 0,
    reorderPointQty: Number.isFinite(Number(item.reorderPointQty))
      ? Number(item.reorderPointQty)
      : 0,
    costPerUnit: toOptionalNumber(item.costPerUnit),
    vendorName: toOptionalText((item as any).vendorName),
    vendorSku: toOptionalText((item as any).vendorSku),
    vendorProductUrl: toOptionalText((item as any).vendorProductUrl),
    vendorLeadTimeDays: toOptionalNumber((item as any).vendorLeadTimeDays),
    vendorPackSize: toOptionalNumber((item as any).vendorPackSize),
    vendorDefaultOrderQty: toOptionalNumber((item as any).vendorDefaultOrderQty),
    vendorNotes: toOptionalText((item as any).vendorNotes),
  };
};

const normalizeStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => String(entry ?? '').trim())
        .filter((entry) => entry.length > 0)
    : [];

const normalizeBatchIntent = (
  value: BatchRecord['intendedRecipe']
): BatchRecord['intendedRecipe'] => {
  if (!value) return undefined;
  const targetAbvPct = Number(value.targets?.targetAbvPct);
  const targetResidualSugarPct = Number(value.targets?.targetResidualSugarPct);
  const targetResidualSugarGpl = Number(value.targets?.targetResidualSugarGpl);
  const targetSweetnessLevel = String(value.targets?.targetSweetnessLevel ?? '').trim().toLowerCase();
  return {
    schemaVersion: String(value.schemaVersion ?? '1.1.0'),
    recipeId: value.recipeId ? String(value.recipeId).trim() : undefined,
    recipeName: String(value.recipeName ?? '').trim() || 'Recipe',
    recipeFormat: value.recipeFormat,
    sourceFile: value.sourceFile ? String(value.sourceFile).trim() : undefined,
    importedAt: value.importedAt ? String(value.importedAt).trim() : undefined,
    stepsCount: Number.isFinite(Number(value.stepsCount)) ? Number(value.stepsCount) : 0,
    requirementCount:
      Number.isFinite(Number(value.requirementCount)) ? Number(value.requirementCount) : 0,
    requirements: Array.isArray(value.requirements)
      ? value.requirements.map((entry) => ({
          name: String(entry.name ?? '').trim() || 'Requirement',
          category: normalizeCategory(entry.category),
          requiredQty:
            Number.isFinite(Number(entry.requiredQty)) ? Number(entry.requiredQty) : undefined,
          unit: entry.unit ? String(entry.unit).trim() : undefined,
        }))
      : undefined,
    targets:
      Number.isFinite(targetAbvPct) ||
      Number.isFinite(targetResidualSugarPct) ||
      Number.isFinite(targetResidualSugarGpl) ||
      targetSweetnessLevel === 'bone_dry' ||
      targetSweetnessLevel === 'semi_dry' ||
      targetSweetnessLevel === 'semi_sweet' ||
      targetSweetnessLevel === 'sweet'
        ? {
            targetAbvPct: Number.isFinite(targetAbvPct) ? targetAbvPct : undefined,
            targetResidualSugarPct: Number.isFinite(targetResidualSugarPct)
              ? targetResidualSugarPct
              : undefined,
            targetResidualSugarGpl: Number.isFinite(targetResidualSugarGpl)
              ? targetResidualSugarGpl
              : undefined,
            targetSweetnessLevel:
              targetSweetnessLevel === 'bone_dry' ||
              targetSweetnessLevel === 'semi_dry' ||
              targetSweetnessLevel === 'semi_sweet' ||
              targetSweetnessLevel === 'sweet'
                ? targetSweetnessLevel
                : undefined,
          }
        : undefined,
    capturedAt: value.capturedAt ? String(value.capturedAt).trim() : nowIso(),
  };
};

const normalizeBatchActualResults = (
  value: BatchRecord['actualResults']
): BatchRecord['actualResults'] => {
  if (!value) return undefined;
  const normalizeOptionalNumber = (input: unknown): number | undefined => {
    const next = Number(input);
    return Number.isFinite(next) ? next : undefined;
  };
  return {
    schemaVersion: String(value.schemaVersion ?? '1.0.0'),
    og: normalizeOptionalNumber(value.og),
    fg: normalizeOptionalNumber(value.fg),
    sgLatest: normalizeOptionalNumber(value.sgLatest),
    abvPct: normalizeOptionalNumber(value.abvPct),
    phLatest: normalizeOptionalNumber(value.phLatest),
    brixLatest: normalizeOptionalNumber(value.brixLatest),
    titratableAcidityGplLatest: normalizeOptionalNumber(value.titratableAcidityGplLatest),
    so2PpmLatest: normalizeOptionalNumber(value.so2PpmLatest),
    residualSugarGplLatest: normalizeOptionalNumber(value.residualSugarGplLatest),
    estimatedResidualSugarGplLatest: normalizeOptionalNumber(value.estimatedResidualSugarGplLatest),
    volatileAcidityGplLatest: normalizeOptionalNumber(value.volatileAcidityGplLatest),
    freeSo2PpmLatest: normalizeOptionalNumber(value.freeSo2PpmLatest),
    totalSo2PpmLatest: normalizeOptionalNumber(value.totalSo2PpmLatest),
    dissolvedOxygenPpmLatest: normalizeOptionalNumber(value.dissolvedOxygenPpmLatest),
    temperatureCLatest: normalizeOptionalNumber(value.temperatureCLatest),
    finalLabAbvPct: normalizeOptionalNumber(value.finalLabAbvPct),
    finalLabPh: normalizeOptionalNumber(value.finalLabPh),
    finalLabBrix: normalizeOptionalNumber(value.finalLabBrix),
    finalLabResidualSugarGpl: normalizeOptionalNumber(value.finalLabResidualSugarGpl),
    finalLabTitratableAcidityGpl: normalizeOptionalNumber(value.finalLabTitratableAcidityGpl),
    finalLabFreeSo2Ppm: normalizeOptionalNumber(value.finalLabFreeSo2Ppm),
    finalLabTotalSo2Ppm: normalizeOptionalNumber(value.finalLabTotalSo2Ppm),
    finalLabDissolvedOxygenPpm: normalizeOptionalNumber(value.finalLabDissolvedOxygenPpm),
    finalLabRecordedAt: value.finalLabRecordedAt ? String(value.finalLabRecordedAt).trim() : undefined,
    finalLabRecordedBy: value.finalLabRecordedBy ? String(value.finalLabRecordedBy).trim() : undefined,
    finalVolumeQty: normalizeOptionalNumber(value.finalVolumeQty),
    finalVolumeUnit: value.finalVolumeUnit ? String(value.finalVolumeUnit).trim() : undefined,
    notes: value.notes ? String(value.notes).trim() : undefined,
    updatedAt: value.updatedAt ? String(value.updatedAt).trim() : nowIso(),
  };
};

const normalizeBatchReadingLogRecord = (value: unknown): BatchReadingLogRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const normalizeOptionalNumber = (input: unknown): number | undefined => {
    const next = Number(input);
    return Number.isFinite(next) ? next : undefined;
  };

  return {
    id: raw.id ? String(raw.id).trim() : randomUUID(),
    timestamp: raw.timestamp ? String(raw.timestamp).trim() : nowIso(),
    og: normalizeOptionalNumber(raw.og),
    fg: normalizeOptionalNumber(raw.fg),
    sg: normalizeOptionalNumber(raw.sg),
    temperatureC: normalizeOptionalNumber(raw.temperatureC),
    ph: normalizeOptionalNumber(raw.ph),
    brix: normalizeOptionalNumber(raw.brix),
    titratableAcidityGpl: normalizeOptionalNumber(raw.titratableAcidityGpl),
    so2Ppm: normalizeOptionalNumber(raw.so2Ppm),
    residualSugarGpl: normalizeOptionalNumber(raw.residualSugarGpl),
    volatileAcidityGpl: normalizeOptionalNumber(raw.volatileAcidityGpl),
    freeSo2Ppm: normalizeOptionalNumber(raw.freeSo2Ppm),
    totalSo2Ppm: normalizeOptionalNumber(raw.totalSo2Ppm),
    dissolvedOxygenPpm: normalizeOptionalNumber(raw.dissolvedOxygenPpm),
    note: raw.note ? String(raw.note).trim() : undefined,
  };
};

const normalizeBatchTreatmentLog = (value: unknown): BatchTreatmentLogRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const allowedTypes = new Set<BatchTreatmentLogRecord['type']>([
    'sulfite_addition',
    'acid_adjustment',
    'sugar_adjustment',
    'tannin_addition',
    'fining_agent',
    'filtration',
    'carbonation',
    'blend',
    'other',
  ]);
  const type = String(raw.type ?? '').trim().toLowerCase();
  const quantity = Number(raw.quantity);
  const blendComponents = Array.isArray(raw.blendComponents)
    ? raw.blendComponents
        .map((entry): BatchBlendComponent | null => {
          if (!entry || typeof entry !== 'object') return null;
          const component = entry as Record<string, unknown>;
          const componentQty = Number(component.quantity);
          return {
            batchId: component.batchId ? String(component.batchId).trim() : undefined,
            batchCode: component.batchCode ? normalizeLotCode(component.batchCode) : undefined,
            quantity: Number.isFinite(componentQty) ? normalizeQty(componentQty) : undefined,
            unit: component.unit ? String(component.unit).trim() : undefined,
          };
        })
        .filter((entry): entry is BatchBlendComponent => entry !== null)
    : undefined;
  return {
    id: String(raw.id ?? randomUUID()),
    timestamp: String(raw.timestamp ?? nowIso()),
    type: allowedTypes.has(type as BatchTreatmentLogRecord['type'])
      ? (type as BatchTreatmentLogRecord['type'])
      : 'other',
    stage: raw.stage ? String(raw.stage).trim() : undefined,
    actor: raw.actor ? String(raw.actor).trim() : undefined,
    quantity: Number.isFinite(quantity) ? normalizeQty(quantity) : undefined,
    unit: raw.unit ? String(raw.unit).trim() : undefined,
    lotCode: raw.lotCode ? normalizeLotCode(raw.lotCode) : undefined,
    note: raw.note ? String(raw.note).trim() : undefined,
    blendComponents,
  };
};

const normalizeBatchVolumeCheckpoint = (value: unknown): BatchVolumeCheckpointRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const allowedStages = new Set<BatchVolumeCheckpointRecord['stage']>([
    'start',
    'transfer_out',
    'transfer_in',
    'packaging',
    'loss',
    'ending',
    'other',
  ]);
  const quantity = Number(raw.quantity);
  if (!Number.isFinite(quantity)) return null;
  const stage = String(raw.stage ?? '').trim().toLowerCase();
  return {
    id: String(raw.id ?? randomUUID()),
    timestamp: String(raw.timestamp ?? nowIso()),
    stage: allowedStages.has(stage as BatchVolumeCheckpointRecord['stage'])
      ? (stage as BatchVolumeCheckpointRecord['stage'])
      : 'other',
    quantity: normalizeQty(quantity),
    unit: String(raw.unit ?? 'L').trim() || 'L',
    note: raw.note ? String(raw.note).trim() : undefined,
    actor: raw.actor ? String(raw.actor).trim() : undefined,
  };
};

const normalizeBatchSensoryQcRecord = (value: unknown): BatchSensoryQcRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return {
    id: String(raw.id ?? randomUUID()),
    timestamp: String(raw.timestamp ?? nowIso()),
    stage: raw.stage ? String(raw.stage).trim() : undefined,
    visualNotes: raw.visualNotes ? String(raw.visualNotes).trim() : undefined,
    aromaNotes: raw.aromaNotes ? String(raw.aromaNotes).trim() : undefined,
    tasteNotes: raw.tasteNotes ? String(raw.tasteNotes).trim() : undefined,
    passFail:
      raw.passFail === 'pass' || raw.passFail === 'fail' || raw.passFail === 'hold'
        ? raw.passFail
        : undefined,
    approvalDecision:
      raw.approvalDecision === 'approved' ||
      raw.approvalDecision === 'hold' ||
      raw.approvalDecision === 'rejected'
        ? raw.approvalDecision
        : undefined,
    actor: raw.actor ? String(raw.actor).trim() : undefined,
    note: raw.note ? String(raw.note).trim() : undefined,
  };
};

const normalizeBatchStageTimelineEvent = (value: unknown): BatchStageTimelineEvent | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const allowedStages = new Set<BatchStageTimelineEvent['stage']>([
    'fermentation_start',
    'fermentation_complete',
    'conditioning_start',
    'oak_aging_start',
    'oak_aging_end',
    'lees_aging_start',
    'lees_aging_end',
    'ready_to_package',
    'packaged',
    'released',
    'other',
  ]);
  const stage = String(raw.stage ?? '').trim().toLowerCase();
  return {
    id: String(raw.id ?? randomUUID()),
    timestamp: String(raw.timestamp ?? nowIso()),
    stage: allowedStages.has(stage as BatchStageTimelineEvent['stage'])
      ? (stage as BatchStageTimelineEvent['stage'])
      : 'other',
    actor: raw.actor ? String(raw.actor).trim() : undefined,
    note: raw.note ? String(raw.note).trim() : undefined,
  };
};

const normalizeBatchDeviation = (value: unknown): BatchDeviationRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const field = String(raw.field ?? '').trim().toLowerCase();
  if (!field) return null;
  const allowedFields = new Set<BatchDeviationRecord['field']>([
    'step_duration',
    'hold_temperature',
    'gravity',
    'abv',
    'ph',
    'volume',
    'transfer',
    'packaging',
    'other',
  ]);
  const normalizedField = allowedFields.has(field as BatchDeviationRecord['field'])
    ? (field as BatchDeviationRecord['field'])
    : 'other';
  const normalizeScalar = (
    entry: unknown
  ): string | number | boolean | undefined => {
    if (
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean'
    ) {
      return entry;
    }
    return undefined;
  };
  return {
    id: String(raw.id ?? randomUUID()),
    timestamp: String(raw.timestamp ?? nowIso()),
    field: normalizedField,
    planned: normalizeScalar(raw.planned),
    actual: normalizeScalar(raw.actual),
    unit: raw.unit ? normalizeBatchVolumeUnit(raw.unit) : undefined,
    note: raw.note ? String(raw.note).trim() : undefined,
    source:
      raw.source === 'sensor' || raw.source === 'automation' || raw.source === 'manual'
        ? raw.source
        : undefined,
    actor: raw.actor ? String(raw.actor).trim() : undefined,
    reasonCode: raw.reasonCode ? String(raw.reasonCode).trim() : undefined,
  };
};

const normalizeBatchSourceInput = (value: unknown): BatchSourceInputRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const allowedCategories = new Set<BatchSourceInputRecord['category']>([
    'juice',
    'yeast',
    'additive',
    'nutrient',
    'sugar',
    'fining',
    'ingredient',
    'other',
  ]);
  const category = String(raw.category ?? '').trim().toLowerCase();
  const name = String(raw.name ?? '').trim();
  if (!name) return null;
  const quantity = Number(raw.quantity);
  const brix = Number(raw.brix);
  return {
    id: String(raw.id ?? randomUUID()),
    category: allowedCategories.has(category as BatchSourceInputRecord['category'])
      ? (category as BatchSourceInputRecord['category'])
      : 'other',
    name,
    lotCode: raw.lotCode ? normalizeLotCode(raw.lotCode) : undefined,
    sourceName: raw.sourceName ? String(raw.sourceName).trim() : undefined,
    quantity: Number.isFinite(quantity) ? normalizeQty(quantity) : undefined,
    unit: raw.unit ? String(raw.unit).trim() : undefined,
    brix: Number.isFinite(brix) ? normalizeQty(brix) : undefined,
    note: raw.note ? String(raw.note).trim() : undefined,
  };
};

const getMissingFinalLabFields = (
  actualResults: BatchActualResultsSnapshot
): string[] => {
  const missing: string[] = [];
  if (!Number.isFinite(actualResults.finalLabAbvPct)) missing.push('Final ABV');
  if (!Number.isFinite(actualResults.finalLabPh)) missing.push('Final pH');
  if (!Number.isFinite(actualResults.finalLabResidualSugarGpl)) {
    missing.push('Final residual sugar');
  }
  if (!Number.isFinite(actualResults.finalLabTitratableAcidityGpl)) {
    missing.push('Final titratable acidity');
  }
  if (!Number.isFinite(actualResults.finalLabFreeSo2Ppm)) {
    missing.push('Final free SO2');
  }
  if (!Number.isFinite(actualResults.finalLabTotalSo2Ppm)) {
    missing.push('Final total SO2');
  }
  return missing;
};

const normalizeBatchProductSnapshot = (
  value: BatchRecord['productSnapshot']
): BatchRecord['productSnapshot'] => {
  if (!value) return undefined;
  const images: ProductImageVariants = {
    thumbnailUrl:
      value.images?.thumbnailUrl && String(value.images.thumbnailUrl).trim()
        ? String(value.images.thumbnailUrl).trim()
        : undefined,
    cardImageUrl:
      value.images?.cardImageUrl && String(value.images.cardImageUrl).trim()
        ? String(value.images.cardImageUrl).trim()
        : undefined,
    fullImageUrl:
      value.images?.fullImageUrl && String(value.images.fullImageUrl).trim()
        ? String(value.images.fullImageUrl).trim()
        : undefined,
  };
  return {
    productId: String(value.productId ?? '').trim(),
    productCode: normalizeHumanCode(value.productCode),
    productName: String(value.productName ?? '').trim() || 'Product',
    beverageClass:
      value.beverageClass === 'cider' ||
      value.beverageClass === 'wine' ||
      value.beverageClass === 'beer'
        ? value.beverageClass
        : ('other' as BeverageClass),
    labelAssetId: value.labelAssetId ? String(value.labelAssetId).trim() : undefined,
    labelVersionId: value.labelVersionId ? String(value.labelVersionId).trim() : undefined,
    images:
      images.thumbnailUrl || images.cardImageUrl || images.fullImageUrl ? images : undefined,
    updatedAt: value.updatedAt ? String(value.updatedAt).trim() : nowIso(),
  };
};

const normalizeBatchRecord = (batch: BatchRecord): BatchRecord => ({
  ...batch,
  skuId: batch.skuId ? normalizeSkuId(batch.skuId) : undefined,
  siteId: normalizeSiteId(batch.siteId),
  unit: normalizeBatchVolumeUnit(batch.unit),
  batchCode:
    normalizeLotCode((batch as BatchRecord).batchCode) ??
    normalizeLotCode(batch.lotCode) ??
    generateLotCode(),
  dispensedQty: Number.isFinite(Number((batch as any).dispensedQty))
    ? Number((batch as any).dispensedQty)
    : 0,
  batchKind: batch.batchKind === 'derived' ? 'derived' : 'source',
  productionMode:
    batch.productionMode === 'cellar'
      ? 'cellar'
      : batch.productionMode === 'scheduled_runboard'
        ? 'scheduled_runboard'
        : batch.batchKind === 'derived'
          ? 'cellar'
          : 'scheduled_runboard',
  rootBatchId: batch.rootBatchId ? String(batch.rootBatchId).trim() : undefined,
  parentBatchId: batch.parentBatchId ? String(batch.parentBatchId).trim() : undefined,
  parentBatchCode: batch.parentBatchCode ? normalizeLotCode(batch.parentBatchCode) : undefined,
  containerLabel: batch.containerLabel ? String(batch.containerLabel).trim() : undefined,
  containerKind:
    batch.containerKind === 'vessel' ||
    batch.containerKind === 'bright_tank' ||
    batch.containerKind === 'barrel' ||
    batch.containerKind === 'package_line'
      ? batch.containerKind
      : batch.containerKind === 'other'
        ? 'other'
        : undefined,
  scheduledStartAt: batch.scheduledStartAt ? String(batch.scheduledStartAt).trim() : undefined,
  scheduledEndAt: batch.scheduledEndAt ? String(batch.scheduledEndAt).trim() : undefined,
  plannedVesselLabel: batch.plannedVesselLabel ? String(batch.plannedVesselLabel).trim() : undefined,
  plannedVesselKind:
    batch.plannedVesselKind === 'vessel' ||
    batch.plannedVesselKind === 'bright_tank' ||
    batch.plannedVesselKind === 'barrel' ||
    batch.plannedVesselKind === 'package_line'
      ? batch.plannedVesselKind
      : batch.plannedVesselKind === 'other'
        ? 'other'
        : undefined,
  enteredContainerAt: batch.enteredContainerAt ? String(batch.enteredContainerAt).trim() : undefined,
  intendedRecipe: normalizeBatchIntent(batch.intendedRecipe),
  actualResults: normalizeBatchActualResults(batch.actualResults),
  readingLog: Array.isArray(batch.readingLog)
    ? batch.readingLog
        .map((entry) => normalizeBatchReadingLogRecord(entry))
        .filter((entry): entry is BatchReadingLogRecord => entry !== null)
        .slice(-400)
    : [],
  deviations: Array.isArray(batch.deviations)
    ? batch.deviations
        .map((entry) => normalizeBatchDeviation(entry))
        .filter((entry): entry is BatchDeviationRecord => entry !== null)
        .slice(-200)
    : [],
  sourceInputs: Array.isArray(batch.sourceInputs)
    ? batch.sourceInputs
        .map((entry) => normalizeBatchSourceInput(entry))
        .filter((entry): entry is BatchSourceInputRecord => entry !== null)
        .slice(-200)
    : [],
  treatmentLog: Array.isArray(batch.treatmentLog)
    ? batch.treatmentLog
        .map((entry) => normalizeBatchTreatmentLog(entry))
        .filter((entry): entry is BatchTreatmentLogRecord => entry !== null)
        .slice(-200)
    : [],
  volumeCheckpoints: Array.isArray(batch.volumeCheckpoints)
    ? batch.volumeCheckpoints
        .map((entry) => normalizeBatchVolumeCheckpoint(entry))
        .filter((entry): entry is BatchVolumeCheckpointRecord => entry !== null)
        .slice(-200)
    : [],
  sensoryQcRecords: Array.isArray(batch.sensoryQcRecords)
    ? batch.sensoryQcRecords
        .map((entry) => normalizeBatchSensoryQcRecord(entry))
        .filter((entry): entry is BatchSensoryQcRecord => entry !== null)
        .slice(-200)
    : [],
  stageTimeline: Array.isArray(batch.stageTimeline)
    ? batch.stageTimeline
        .map((entry) => normalizeBatchStageTimelineEvent(entry))
        .filter((entry): entry is BatchStageTimelineEvent => entry !== null)
        .slice(-200)
    : [],
  packageLotIds: normalizeStringList(batch.packageLotIds),
  fulfillmentRequestIds: normalizeStringList(batch.fulfillmentRequestIds),
  productSnapshot: normalizeBatchProductSnapshot(batch.productSnapshot),
});

export const readInventoryState = async (): Promise<InventoryState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<InventoryState>(inventoryFile, defaultInventoryState());
  return {
    ...state,
    items: (state.items ?? []).map(normalizeInventoryItem),
  };
};

export const writeInventoryState = async (state: InventoryState): Promise<InventoryState> => {
  await ensureCommissioningStore();
  const normalized: InventoryState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'inventory-state',
    updatedAt: nowIso(),
    items: (state.items ?? []).map(normalizeInventoryItem),
  };
  await writeJson(inventoryFile, normalized);
  return normalized;
};

export const readInventoryMovements = async (): Promise<InventoryMovementsState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<InventoryMovementsState>(
    inventoryMovementsFile,
    defaultMovementState()
  );
  return {
    ...state,
    movements: (state.movements ?? []).map((movement) => ({
      ...movement,
      siteId: normalizeSiteId(movement.siteId),
      reasonCode: movement.reasonCode ? String(movement.reasonCode).trim() : undefined,
      actor: movement.actor ? String(movement.actor).trim() : undefined,
      packageLotId: movement.packageLotId ? String(movement.packageLotId).trim() : undefined,
      assetId: movement.assetId ? String(movement.assetId).trim() : undefined,
      assetCode: movement.assetCode ? String(movement.assetCode).trim() : undefined,
      metadata:
        movement.metadata && typeof movement.metadata === 'object'
          ? { ...(movement.metadata as Record<string, unknown>) }
          : undefined,
    })),
  };
};

export const writeInventoryMovements = async (
  state: InventoryMovementsState
): Promise<InventoryMovementsState> => {
  await ensureCommissioningStore();
  const normalized: InventoryMovementsState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'inventory-movements',
    updatedAt: nowIso(),
    movements: [...(state.movements ?? [])]
      .map((movement) => ({
        ...movement,
        siteId: normalizeSiteId(movement.siteId),
      }))
      .slice(-2000),
  };
  await writeJson(inventoryMovementsFile, normalized);
  return normalized;
};

const generateProcurementOrderNumber = (): string =>
  `PO-${Date.now().toString(36).toUpperCase()}`;

const normalizeProcurementLineStatus = (value: unknown): ProcurementOrderLineStatus => {
  const next = String(value ?? '').trim().toLowerCase();
  if (
    next === 'ordered' ||
    next === 'partially_received' ||
    next === 'received' ||
    next === 'canceled'
  ) {
    return next;
  }
  return 'ordered';
};

const normalizeProcurementOrderStatus = (value: unknown): ProcurementOrderStatus => {
  const next = String(value ?? '').trim().toLowerCase();
  if (
    next === 'ordered' ||
    next === 'partially_received' ||
    next === 'received' ||
    next === 'canceled'
  ) {
    return next;
  }
  return 'ordered';
};

const normalizeProcurementOrderLine = (
  line: ProcurementOrderLineRecord
): ProcurementOrderLineRecord => ({
  ...line,
  id: String(line.id ?? randomUUID()),
  itemId: String(line.itemId ?? '').trim(),
  skuId: normalizeSkuId(line.skuId),
  itemName: String(line.itemName ?? '').trim() || 'Inventory Item',
  unit: String(line.unit ?? 'units').trim() || 'units',
  orderedQty: Number.isFinite(Number(line.orderedQty)) ? Math.max(0, normalizeQty(line.orderedQty)) : 0,
  receivedQty: Number.isFinite(Number(line.receivedQty))
    ? Math.max(0, normalizeQty(Math.min(line.receivedQty, line.orderedQty)))
    : 0,
  costPerUnit: Number.isFinite(Number(line.costPerUnit)) ? Number(line.costPerUnit) : undefined,
  vendorSku: line.vendorSku ? String(line.vendorSku).trim() : undefined,
  vendorProductUrl: line.vendorProductUrl ? String(line.vendorProductUrl).trim() : undefined,
  status: normalizeProcurementLineStatus(line.status),
  notes: line.notes ? String(line.notes).trim() : undefined,
});

const normalizeProcurementOrderEvent = (
  event: ProcurementOrderEventRecord
): ProcurementOrderEventRecord => ({
  ...event,
  id: String(event.id ?? randomUUID()),
  type:
    event.type === 'created' || event.type === 'received' || event.type === 'canceled'
      ? event.type
      : 'note',
  timestamp: String(event.timestamp ?? nowIso()),
  lineId: event.lineId ? String(event.lineId).trim() : undefined,
  qty: Number.isFinite(Number(event.qty)) ? Number(event.qty) : undefined,
  note: event.note ? String(event.note).trim() : undefined,
});

const normalizeProcurementOrder = (
  order: ProcurementOrderRecord
): ProcurementOrderRecord => ({
  ...order,
  schemaVersion: String(order.schemaVersion ?? '1.0.0'),
  id: String(order.id ?? randomUUID()),
  siteId: normalizeSiteId(order.siteId),
  poNumber: String(order.poNumber ?? generateProcurementOrderNumber()).trim(),
  vendorName: String(order.vendorName ?? '').trim() || 'Unknown Vendor',
  vendorUrl: order.vendorUrl ? String(order.vendorUrl).trim() : undefined,
  vendorOrderRef: order.vendorOrderRef ? String(order.vendorOrderRef).trim() : undefined,
  status: normalizeProcurementOrderStatus(order.status),
  createdAt: String(order.createdAt ?? nowIso()),
  orderedAt: String(order.orderedAt ?? nowIso()),
  expectedAt: order.expectedAt ? String(order.expectedAt).trim() : undefined,
  updatedAt: String(order.updatedAt ?? nowIso()),
  notes: order.notes ? String(order.notes).trim() : undefined,
  lines: Array.isArray(order.lines)
    ? order.lines.map((line) => normalizeProcurementOrderLine(line))
    : [],
  events: Array.isArray(order.events)
    ? order.events.map((event) => normalizeProcurementOrderEvent(event))
    : [],
});

export const readProcurementOrdersState = async (): Promise<ProcurementOrdersState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<ProcurementOrdersState>(
    procurementOrdersFile,
    defaultProcurementOrdersState()
  );
  return {
    ...state,
    schemaVersion: String(state.schemaVersion ?? '1.0.0'),
    id: String(state.id ?? 'procurement-orders'),
    updatedAt: String(state.updatedAt ?? nowIso()),
    orders: Array.isArray(state.orders)
      ? state.orders.map((order) => normalizeProcurementOrder(order))
      : [],
  };
};

export const writeProcurementOrdersState = async (
  state: ProcurementOrdersState
): Promise<ProcurementOrdersState> => {
  await ensureCommissioningStore();
  const normalized: ProcurementOrdersState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'procurement-orders',
    updatedAt: nowIso(),
    orders: [...(state.orders ?? [])]
      .map((order) => normalizeProcurementOrder(order))
      .slice(-5000),
  };
  await writeJson(procurementOrdersFile, normalized);
  return normalized;
};

export const listProcurementOrders = async (filters?: {
  siteId?: string;
  status?: ProcurementOrderStatus | 'pending';
}): Promise<ProcurementOrderRecord[]> => {
  const state = await readProcurementOrdersState();
  const siteId = filters?.siteId ? normalizeSiteId(filters.siteId) : '';
  return state.orders.filter((order) => {
    if (siteId && normalizeSiteId(order.siteId) !== siteId) return false;
    if (!filters?.status) return true;
    if (filters.status === 'pending') {
      return order.status === 'ordered' || order.status === 'partially_received';
    }
    return order.status === filters.status;
  });
};

export const updateInventoryItem = async (params: {
  itemId: string;
  siteId?: string;
  patch: Partial<
    Pick<
      InventoryItemRecord,
      | 'name'
      | 'category'
      | 'unit'
      | 'onHandQty'
      | 'allocatedQty'
      | 'onOrderQty'
      | 'reorderPointQty'
      | 'costPerUnit'
      | 'vendorName'
      | 'vendorSku'
      | 'vendorProductUrl'
      | 'vendorLeadTimeDays'
      | 'vendorPackSize'
      | 'vendorDefaultOrderQty'
      | 'vendorNotes'
    >
  >;
}): Promise<InventoryItemRecord | null> => {
  const itemId = String(params.itemId ?? '').trim();
  if (!itemId) return null;
  const siteId = params.siteId ? normalizeSiteId(params.siteId) : '';
  const state = await readInventoryState();
  const index = state.items.findIndex(
    (item) => item.id === itemId && (!siteId || normalizeSiteId(item.siteId) === siteId)
  );
  if (index < 0) return null;
  const current = state.items[index];
  const patch = params.patch;
  const next: InventoryItemRecord = normalizeInventoryItem({
    ...current,
    name: patch.name !== undefined ? String(patch.name).trim() || current.name : current.name,
    category: patch.category ?? current.category,
    unit: patch.unit !== undefined ? String(patch.unit).trim() || current.unit : current.unit,
    onHandQty:
      patch.onHandQty !== undefined && Number.isFinite(Number(patch.onHandQty))
        ? Number(patch.onHandQty)
        : current.onHandQty,
    allocatedQty:
      patch.allocatedQty !== undefined && Number.isFinite(Number(patch.allocatedQty))
        ? Number(patch.allocatedQty)
        : current.allocatedQty,
    onOrderQty:
      patch.onOrderQty !== undefined && Number.isFinite(Number(patch.onOrderQty))
        ? Number(patch.onOrderQty)
        : current.onOrderQty,
    reorderPointQty:
      patch.reorderPointQty !== undefined && Number.isFinite(Number(patch.reorderPointQty))
        ? Number(patch.reorderPointQty)
        : current.reorderPointQty,
    costPerUnit:
      patch.costPerUnit !== undefined && Number.isFinite(Number(patch.costPerUnit))
        ? Number(patch.costPerUnit)
        : patch.costPerUnit === null
          ? undefined
          : current.costPerUnit,
    vendorName: patch.vendorName !== undefined ? patch.vendorName : current.vendorName,
    vendorSku: patch.vendorSku !== undefined ? patch.vendorSku : current.vendorSku,
    vendorProductUrl:
      patch.vendorProductUrl !== undefined ? patch.vendorProductUrl : current.vendorProductUrl,
    vendorLeadTimeDays:
      patch.vendorLeadTimeDays !== undefined
        ? Number.isFinite(Number(patch.vendorLeadTimeDays))
          ? Number(patch.vendorLeadTimeDays)
          : undefined
        : current.vendorLeadTimeDays,
    vendorPackSize:
      patch.vendorPackSize !== undefined
        ? Number.isFinite(Number(patch.vendorPackSize))
          ? Number(patch.vendorPackSize)
          : undefined
        : current.vendorPackSize,
    vendorDefaultOrderQty:
      patch.vendorDefaultOrderQty !== undefined
        ? Number.isFinite(Number(patch.vendorDefaultOrderQty))
          ? Number(patch.vendorDefaultOrderQty)
          : undefined
        : current.vendorDefaultOrderQty,
    vendorNotes: patch.vendorNotes !== undefined ? patch.vendorNotes : current.vendorNotes,
    updatedAt: nowIso(),
  });
  const nextItems = [...state.items];
  nextItems[index] = next;
  await writeInventoryState({
    ...state,
    items: nextItems,
  });
  return next;
};

export const createProcurementOrder = async (params: {
  siteId: string;
  itemId: string;
  orderedQty: number;
  vendorName?: string;
  vendorUrl?: string;
  vendorOrderRef?: string;
  expectedAt?: string;
  costPerUnit?: number;
  vendorSku?: string;
  notes?: string;
}): Promise<ProcurementOrderRecord> => {
  const orderedQty = Number(params.orderedQty);
  if (!Number.isFinite(orderedQty) || orderedQty <= 0) {
    throw new Error('orderedQty must be greater than zero.');
  }
  const siteId = normalizeSiteId(params.siteId);
  const [inventoryState, movementState, procurementState] = await Promise.all([
    readInventoryState(),
    readInventoryMovements(),
    readProcurementOrdersState(),
  ]);
  const itemIndex = inventoryState.items.findIndex(
    (item) =>
      item.id === String(params.itemId).trim() &&
      normalizeSiteId(item.siteId) === siteId
  );
  if (itemIndex < 0) {
    throw new Error('Inventory item not found for procurement order.');
  }
  const item = inventoryState.items[itemIndex];
  const now = nowIso();
  const line: ProcurementOrderLineRecord = {
    id: randomUUID(),
    itemId: item.id,
    skuId: item.skuId,
    itemName: item.name,
    unit: item.unit,
    orderedQty: normalizeQty(orderedQty),
    receivedQty: 0,
    costPerUnit: Number.isFinite(Number(params.costPerUnit))
      ? Number(params.costPerUnit)
      : item.costPerUnit,
    vendorSku: params.vendorSku ? String(params.vendorSku).trim() : item.vendorSku,
    vendorProductUrl: params.vendorUrl ? String(params.vendorUrl).trim() : item.vendorProductUrl,
    status: 'ordered',
    notes: params.notes ? String(params.notes).trim() : undefined,
  };
  const order: ProcurementOrderRecord = {
    schemaVersion: '1.0.0',
    id: randomUUID(),
    siteId,
    poNumber: generateProcurementOrderNumber(),
    vendorName:
      String(params.vendorName ?? '').trim() || item.vendorName || 'Unknown Vendor',
    vendorUrl: params.vendorUrl ? String(params.vendorUrl).trim() : item.vendorProductUrl,
    vendorOrderRef: params.vendorOrderRef ? String(params.vendorOrderRef).trim() : undefined,
    status: 'ordered',
    createdAt: now,
    orderedAt: now,
    expectedAt: params.expectedAt ? String(params.expectedAt).trim() : undefined,
    updatedAt: now,
    notes: params.notes ? String(params.notes).trim() : undefined,
    lines: [line],
    events: [
      {
        id: randomUUID(),
        type: 'created',
        timestamp: now,
        note: 'Procurement order created.',
      },
    ],
  };

  const nextItems = [...inventoryState.items];
  nextItems[itemIndex] = {
    ...item,
    onOrderQty: normalizeQty(Number(item.onOrderQty) + line.orderedQty),
    vendorName: order.vendorName,
    vendorSku: line.vendorSku,
    vendorProductUrl: order.vendorUrl ?? item.vendorProductUrl,
    costPerUnit: line.costPerUnit ?? item.costPerUnit,
    updatedAt: now,
  };
  await writeInventoryState({
    ...inventoryState,
    items: nextItems,
  });
  await writeInventoryMovements({
    ...movementState,
    movements: [
      ...movementState.movements,
      {
        id: randomUUID(),
        itemId: item.id,
        siteId,
        type: 'order',
        quantity: line.orderedQty,
        unit: item.unit,
        reason: `PO ${order.poNumber} ordered from ${order.vendorName}`,
        createdAt: now,
      },
    ],
  });
  await writeProcurementOrdersState({
    ...procurementState,
    orders: [order, ...procurementState.orders],
  });
  return order;
};

export const receiveProcurementOrderLine = async (params: {
  orderId: string;
  lineId?: string;
  receivedQty: number;
  note?: string;
}): Promise<ProcurementOrderRecord | null> => {
  const orderId = String(params.orderId ?? '').trim();
  if (!orderId) return null;
  const receivedQty = Number(params.receivedQty);
  if (!Number.isFinite(receivedQty) || receivedQty <= 0) {
    throw new Error('receivedQty must be greater than zero.');
  }
  const [inventoryState, movementState, procurementState] = await Promise.all([
    readInventoryState(),
    readInventoryMovements(),
    readProcurementOrdersState(),
  ]);
  const orderIndex = procurementState.orders.findIndex((order) => order.id === orderId);
  if (orderIndex < 0) return null;
  const order = procurementState.orders[orderIndex];
  if (order.status === 'received' || order.status === 'canceled') {
    throw new Error(`Order is already ${order.status}.`);
  }
  const lineId = params.lineId ? String(params.lineId).trim() : '';
  const lineIndex = order.lines.findIndex((line) => {
    if (line.status === 'received' || line.status === 'canceled') return false;
    return lineId ? line.id === lineId : true;
  });
  if (lineIndex < 0) {
    throw new Error('No open order line found for check-in.');
  }
  const line = order.lines[lineIndex];
  const outstanding = normalizeQty(line.orderedQty - line.receivedQty);
  if (receivedQty > outstanding) {
    throw new Error(`receivedQty exceeds outstanding quantity (${outstanding}).`);
  }
  const itemIndex = inventoryState.items.findIndex(
    (item) =>
      item.id === line.itemId &&
      normalizeSiteId(item.siteId) === normalizeSiteId(order.siteId)
  );
  if (itemIndex < 0) {
    throw new Error('Inventory item for order line not found.');
  }
  const now = nowIso();
  const nextLine: ProcurementOrderLineRecord = {
    ...line,
    receivedQty: normalizeQty(line.receivedQty + receivedQty),
    status:
      normalizeQty(line.receivedQty + receivedQty) >= line.orderedQty
        ? 'received'
        : 'partially_received',
  };
  const nextLines = [...order.lines];
  nextLines[lineIndex] = nextLine;
  const hasOpenLines = nextLines.some(
    (candidate) =>
      candidate.status === 'ordered' || candidate.status === 'partially_received'
  );
  const receiveEvent: ProcurementOrderEventRecord = {
    id: randomUUID(),
    type: 'received',
    timestamp: now,
    lineId: line.id,
    qty: receivedQty,
    note: params.note ? String(params.note).trim() : undefined,
  };
  const nextOrder: ProcurementOrderRecord = {
    ...order,
    status: hasOpenLines ? 'partially_received' : 'received',
    updatedAt: now,
    lines: nextLines,
    events: [
      receiveEvent,
      ...(order.events ?? []),
    ].slice(0, 500),
  };

  const nextOrders = [...procurementState.orders];
  nextOrders[orderIndex] = nextOrder;
  await writeProcurementOrdersState({
    ...procurementState,
    orders: nextOrders,
  });

  const item = inventoryState.items[itemIndex];
  const nextItems = [...inventoryState.items];
  nextItems[itemIndex] = {
    ...item,
    onHandQty: normalizeQty(item.onHandQty + receivedQty),
    onOrderQty: normalizeQty(Math.max(0, item.onOrderQty - receivedQty)),
    updatedAt: now,
  };
  await writeInventoryState({
    ...inventoryState,
    items: nextItems,
  });
  await writeInventoryMovements({
    ...movementState,
    movements: [
      ...movementState.movements,
      {
        id: randomUUID(),
        itemId: item.id,
        siteId: normalizeSiteId(order.siteId),
        type: 'receive',
        quantity: receivedQty,
        unit: item.unit,
        reason: `PO ${order.poNumber} received`,
        createdAt: now,
      },
    ],
  });
  return nextOrder;
};

export const readBatchState = async (): Promise<BatchState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<BatchState>(batchFile, defaultBatchState());
  return {
    ...state,
    batches: (state.batches ?? []).map(normalizeBatchRecord),
  };
};

export const writeBatchState = async (state: BatchState): Promise<BatchState> => {
  await ensureCommissioningStore();
  const normalized: BatchState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'batch-state',
    updatedAt: nowIso(),
    batches: [...(state.batches ?? [])].map(normalizeBatchRecord).slice(-500),
  };
  await writeJson(batchFile, normalized);
  return normalized;
};

export const readReservationState = async (): Promise<ReservationState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<ReservationState>(reservationsFile, defaultReservationState());
};

export const writeReservationState = async (
  state: ReservationState
): Promise<ReservationState> => {
  await ensureCommissioningStore();
  const normalized: ReservationState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'reservation-state',
    updatedAt: nowIso(),
    reservations: [...(state.reservations ?? [])].slice(-5000),
  };
  await writeJson(reservationsFile, normalized);
  return normalized;
};

export const readReservationActionsState = async (): Promise<ReservationActionsState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<ReservationActionsState>(
    reservationActionsFile,
    defaultReservationActionsState()
  );
};

export const writeReservationActionsState = async (
  state: ReservationActionsState
): Promise<ReservationActionsState> => {
  await ensureCommissioningStore();
  const normalized: ReservationActionsState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'reservation-actions',
    updatedAt: nowIso(),
    actions: [...(state.actions ?? [])].slice(-10000),
  };
  await writeJson(reservationActionsFile, normalized);
  return normalized;
};

const normalizePackageLotEvent = (event: unknown): PackageLotEventRecord | null => {
  if (!event || typeof event !== 'object') return null;
  const raw = event as Record<string, unknown>;
  const action = String(raw.action ?? '').trim().toLowerCase();
  const allowedActions = new Set<PackageLotEventAction>([
    'release_status',
    'ship',
    'return',
    'empty_return',
    'rework',
    'destroy',
    'adjust',
    'assign_asset',
    'note',
  ]);
  if (!allowedActions.has(action as PackageLotEventAction)) {
    return null;
  }
  const releaseStatus = String(raw.releaseStatus ?? '').trim().toLowerCase();
  const allowedReleaseStatuses = new Set<PackageLotReleaseStatus>([
    'held',
    'ready',
    'released',
    'shipped',
  ]);
  const quantity = Number(raw.quantity);
  return {
    id: String(raw.id ?? randomUUID()),
    action: action as PackageLotEventAction,
    actor: raw.actor ? String(raw.actor).trim() : undefined,
    reasonCode: raw.reasonCode ? String(raw.reasonCode).trim() : undefined,
    note: raw.note ? String(raw.note).trim() : undefined,
    quantity: Number.isFinite(quantity) ? Math.max(0, normalizeQty(quantity)) : undefined,
    unit: raw.unit ? String(raw.unit).trim() : undefined,
    releaseStatus: allowedReleaseStatuses.has(releaseStatus as PackageLotReleaseStatus)
      ? (releaseStatus as PackageLotReleaseStatus)
      : undefined,
    assetId: raw.assetId ? String(raw.assetId).trim() : undefined,
    assetCode: raw.assetCode ? String(raw.assetCode).trim() : undefined,
    metadata:
      raw.metadata && typeof raw.metadata === 'object'
        ? { ...(raw.metadata as Record<string, unknown>) }
        : undefined,
    timestamp: String(raw.timestamp ?? nowIso()),
  };
};

const normalizePackageLotRecord = (lot: PackageLotRecord): PackageLotRecord => {
  const totalUnits = Number(lot.totalUnits);
  const allocatedUnits = Number(lot.allocatedUnits);
  const shippedUnits = Number(lot.shippedUnits);
  const normalizedType = String(lot.packageType ?? '').trim().toLowerCase();
  const allowedTypes = new Set<PackageLotType>([
    'keg',
    'can',
    'bottle',
    'case',
    'pallet',
    'other',
  ]);
  const packageType = allowedTypes.has(normalizedType as PackageLotType)
    ? (normalizedType as PackageLotType)
    : 'other';
  const normalizedStatus = String(lot.status ?? '').trim().toLowerCase();
  const allowedStatuses = new Set<PackageLotStatus>(['planned', 'active', 'closed', 'canceled']);
  const normalizedReleaseStatus = String(lot.releaseStatus ?? '').trim().toLowerCase();
  const allowedReleaseStatuses = new Set<PackageLotReleaseStatus>([
    'held',
    'ready',
    'released',
    'shipped',
  ]);
  const metadata =
    lot.metadata && typeof lot.metadata === 'object'
      ? { ...(lot.metadata as Record<string, unknown>) }
      : undefined;
  return {
    ...lot,
    packageLotCode:
      normalizeLotCode(lot.packageLotCode ?? lot.lotCode) ?? generateLotCode(),
    lotCode: normalizeLotCode(lot.lotCode) ?? generateLotCode(),
    batchId: String(lot.batchId ?? '').trim(),
    batchCode: lot.batchCode ? normalizeLotCode(lot.batchCode) : undefined,
    skuId: lot.skuId ? normalizeSkuId(lot.skuId) : undefined,
    siteId: normalizeSiteId(lot.siteId),
    packageType,
    packageFormatCode: lot.packageFormatCode ? normalizeHumanCode(lot.packageFormatCode) : undefined,
    containerStyle:
      lot.containerStyle
        ? String(lot.containerStyle).trim().toLowerCase()
        : readMetadataText(metadata?.containerStyle)?.toLowerCase(),
    packageSkuId: lot.packageSkuId ? normalizeSkuId(lot.packageSkuId) : undefined,
    totalUnits: Number.isFinite(totalUnits) ? Math.max(0, normalizeQty(totalUnits)) : 0,
    allocatedUnits: Number.isFinite(allocatedUnits)
      ? Math.max(0, normalizeQty(allocatedUnits))
      : 0,
    shippedUnits: Number.isFinite(shippedUnits) ? Math.max(0, normalizeQty(shippedUnits)) : 0,
    unitSize: Number.isFinite(Number(lot.unitSize)) ? Number(lot.unitSize) : undefined,
    unitOfMeasure: lot.unitOfMeasure ? String(lot.unitOfMeasure).trim() : undefined,
    status: allowedStatuses.has(normalizedStatus as PackageLotStatus)
      ? (normalizedStatus as PackageLotStatus)
      : 'planned',
    releaseStatus: allowedReleaseStatuses.has(normalizedReleaseStatus as PackageLotReleaseStatus)
      ? (normalizedReleaseStatus as PackageLotReleaseStatus)
      : 'held',
    primaryAssetId:
      lot.primaryAssetId
        ? String(lot.primaryAssetId).trim()
        : readMetadataText(metadata?.assetId),
    primaryAssetCode:
      lot.primaryAssetCode
        ? String(lot.primaryAssetCode).trim()
        : readMetadataText(metadata?.assetCode),
    assetCodes: mergeStringLists(lot.assetCodes, metadata?.assetCodes),
    notes: lot.notes ? String(lot.notes).trim() : undefined,
    metadata,
    events: Array.isArray(lot.events)
      ? lot.events
          .map((event) => normalizePackageLotEvent(event))
          .filter((event): event is PackageLotEventRecord => event !== null)
          .slice(-500)
      : [],
    createdAt: String(lot.createdAt ?? nowIso()),
    updatedAt: String(lot.updatedAt ?? nowIso()),
  };
};

export const readPackageLotState = async (): Promise<PackageLotState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<PackageLotState>(packageLotsFile, defaultPackageLotState());
  return {
    ...state,
    lots: (state.lots ?? [])
      .map((lot) => normalizePackageLotRecord(lot))
      .filter((lot) => lot.batchId.length > 0),
  };
};

export const writePackageLotState = async (
  state: PackageLotState
): Promise<PackageLotState> => {
  await ensureCommissioningStore();
  const normalized: PackageLotState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'package-lot-state',
    updatedAt: nowIso(),
    lots: [...(state.lots ?? [])]
      .map((lot) => normalizePackageLotRecord(lot))
      .filter((lot) => lot.batchId.length > 0)
      .slice(-5000),
  };
  await writeJson(packageLotsFile, normalized);
  return normalized;
};

const normalizeFulfillmentRequestEvent = (
  event: FulfillmentRequestEvent
): FulfillmentRequestEvent => ({
  id: String(event.id ?? randomUUID()),
  actionId: event.actionId ? String(event.actionId).trim() : undefined,
  action: event.action,
  status: event.status,
  actor: event.actor ? String(event.actor).trim() : undefined,
  note: event.note ? String(event.note).trim() : undefined,
  linkedBatchId: event.linkedBatchId ? String(event.linkedBatchId).trim() : undefined,
  linkedPackageLotId: event.linkedPackageLotId
    ? String(event.linkedPackageLotId).trim()
    : undefined,
  timestamp: String(event.timestamp ?? nowIso()),
});

const normalizeFulfillmentRequestRecord = (
  entry: FulfillmentRequestRecord
): FulfillmentRequestRecord => ({
  ...entry,
  schemaVersion: String(entry.schemaVersion ?? '1.0.0'),
  id: String(entry.id ?? randomUUID()),
  requestId: String(entry.requestId ?? '').trim(),
  sourceSuite:
    entry.sourceSuite === 'os' ||
    entry.sourceSuite === 'lab' ||
    entry.sourceSuite === 'flow' ||
    entry.sourceSuite === 'connect'
      ? entry.sourceSuite
      : 'ops',
  type: entry.type === 'packaging' ? 'packaging' : 'production',
  status:
    entry.status === 'accepted' ||
    entry.status === 'in_progress' ||
    entry.status === 'blocked' ||
    entry.status === 'completed' ||
    entry.status === 'canceled' ||
    entry.status === 'rejected'
      ? entry.status
      : 'queued',
  siteId: normalizeSiteId(entry.siteId),
  skuId: normalizeSkuId(entry.skuId),
  requestedQty: Number.isFinite(Number(entry.requestedQty))
    ? Math.max(0, normalizeQty(Number(entry.requestedQty)))
    : 0,
  uom: String(entry.uom ?? 'units').trim() || 'units',
  orderId: entry.orderId ? String(entry.orderId).trim() : undefined,
  lineId: entry.lineId ? String(entry.lineId).trim() : undefined,
  neededBy: entry.neededBy ? String(entry.neededBy).trim() : undefined,
  reasonCode: entry.reasonCode ? String(entry.reasonCode).trim() : undefined,
  reasonMessage: entry.reasonMessage ? String(entry.reasonMessage).trim() : undefined,
  metadata: entry.metadata ?? {},
  linkedBatchIds: normalizeStringList(entry.linkedBatchIds),
  linkedPackageLotIds: normalizeStringList(entry.linkedPackageLotIds),
  createdAt: String(entry.createdAt ?? nowIso()),
  updatedAt: String(entry.updatedAt ?? nowIso()),
  events: Array.isArray(entry.events)
    ? entry.events.map((event) => normalizeFulfillmentRequestEvent(event))
    : [],
});

export const readFulfillmentRequestState = async (): Promise<FulfillmentRequestState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<FulfillmentRequestState>(
    fulfillmentRequestsFile,
    defaultFulfillmentRequestState()
  );
  return {
    ...state,
    requests: (state.requests ?? [])
      .map((entry) => normalizeFulfillmentRequestRecord(entry))
      .filter((entry) => entry.requestId.length > 0),
  };
};

export const writeFulfillmentRequestState = async (
  state: FulfillmentRequestState
): Promise<FulfillmentRequestState> => {
  await ensureCommissioningStore();
  const normalized: FulfillmentRequestState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'fulfillment-requests',
    updatedAt: nowIso(),
    requests: [...(state.requests ?? [])]
      .map((entry) => normalizeFulfillmentRequestRecord(entry))
      .filter((entry) => entry.requestId.length > 0)
      .slice(-5000),
  };
  await writeJson(fulfillmentRequestsFile, normalized);
  return normalized;
};

const normalizeFulfillmentOutboxEventType = (
  value: unknown
): FulfillmentOutboxEventType => {
  const normalized = String(value ?? '').trim();
  if (
    normalized === 'request_queued' ||
    normalized === 'request_accepted' ||
    normalized === 'request_started' ||
    normalized === 'request_blocked' ||
    normalized === 'request_completed' ||
    normalized === 'request_canceled' ||
    normalized === 'request_rejected' ||
    normalized === 'request_linked_batch' ||
    normalized === 'request_linked_package_lot' ||
    normalized === 'request_noted'
  ) {
    return normalized;
  }
  return 'request_noted';
};

const normalizeFulfillmentOutboxEvent = (
  event: FulfillmentOutboxEventRecord
): FulfillmentOutboxEventRecord => ({
  schemaVersion: String(event.schemaVersion ?? '1.0.0'),
  id: String(event.id ?? randomUUID()),
  cursor: Number.isFinite(Number(event.cursor)) ? Number(event.cursor) : 0,
  requestId: String(event.requestId ?? '').trim(),
  actionId: event.actionId ? String(event.actionId).trim() : undefined,
  action:
    event.action === 'queue' ||
    event.action === 'accept' ||
    event.action === 'start' ||
    event.action === 'block' ||
    event.action === 'complete' ||
    event.action === 'cancel' ||
    event.action === 'reject' ||
    event.action === 'link_batch' ||
    event.action === 'link_package_lot'
      ? event.action
      : 'note',
  eventType: normalizeFulfillmentOutboxEventType(event.eventType),
  requestType: event.requestType === 'packaging' ? 'packaging' : 'production',
  status:
    event.status === 'accepted' ||
    event.status === 'in_progress' ||
    event.status === 'blocked' ||
    event.status === 'completed' ||
    event.status === 'canceled' ||
    event.status === 'rejected'
      ? event.status
      : 'queued',
  sourceSuite:
    event.sourceSuite === 'os' ||
    event.sourceSuite === 'lab' ||
    event.sourceSuite === 'flow' ||
    event.sourceSuite === 'connect'
      ? event.sourceSuite
      : 'ops',
  siteId: normalizeSiteId(event.siteId),
  skuId: normalizeSkuId(event.skuId),
  occurredAt: String(event.occurredAt ?? nowIso()),
  payload:
    event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
      ? event.payload
      : undefined,
});

export const readFulfillmentOutboxState = async (): Promise<FulfillmentOutboxState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<FulfillmentOutboxState>(
    fulfillmentOutboxFile,
    defaultFulfillmentOutboxState()
  );
  return {
    ...state,
    schemaVersion: String(state.schemaVersion ?? '1.0.0'),
    id: String(state.id ?? 'fulfillment-outbox'),
    nextCursor: Number.isFinite(Number(state.nextCursor))
      ? Math.max(0, Number(state.nextCursor))
      : 0,
    events: Array.isArray(state.events)
      ? state.events
          .map((event) => normalizeFulfillmentOutboxEvent(event))
          .filter((event) => event.requestId.length > 0)
          .sort((left, right) => left.cursor - right.cursor)
      : [],
  };
};

export const writeFulfillmentOutboxState = async (
  state: FulfillmentOutboxState
): Promise<FulfillmentOutboxState> => {
  await ensureCommissioningStore();
  const normalizedEvents = [...(state.events ?? [])]
    .map((event) => normalizeFulfillmentOutboxEvent(event))
    .filter((event) => event.requestId.length > 0)
    .sort((left, right) => left.cursor - right.cursor)
    .slice(-20000);
  const lastCursor = normalizedEvents.length > 0 ? normalizedEvents[normalizedEvents.length - 1].cursor : 0;
  const normalized: FulfillmentOutboxState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'fulfillment-outbox',
    updatedAt: nowIso(),
    nextCursor: Number.isFinite(Number(state.nextCursor))
      ? Math.max(lastCursor, Number(state.nextCursor))
      : lastCursor,
    events: normalizedEvents,
  };
  await writeJson(fulfillmentOutboxFile, normalized);
  return normalized;
};

const fulfillmentEventTypeFromAction = (
  action: FulfillmentRequestEvent['action']
): FulfillmentOutboxEventType => {
  if (action === 'queue') return 'request_queued';
  if (action === 'accept') return 'request_accepted';
  if (action === 'start') return 'request_started';
  if (action === 'block') return 'request_blocked';
  if (action === 'complete') return 'request_completed';
  if (action === 'cancel') return 'request_canceled';
  if (action === 'reject') return 'request_rejected';
  if (action === 'link_batch') return 'request_linked_batch';
  if (action === 'link_package_lot') return 'request_linked_package_lot';
  return 'request_noted';
};

const buildFulfillmentOutboxEventId = (params: {
  requestId: string;
  action: FulfillmentRequestEvent['action'];
  actionId?: string;
}): string => {
  const normalizedRequestId = String(params.requestId ?? '').trim();
  const normalizedActionId = String(params.actionId ?? '').trim();
  if (params.action === 'queue') {
    return `fulfillment:${normalizedRequestId}:queue`;
  }
  if (normalizedActionId) {
    return `fulfillment:${normalizedRequestId}:action:${normalizedActionId}`;
  }
  return `fulfillment:${normalizedRequestId}:action:${params.action}:${randomUUID()}`;
};

export const appendFulfillmentOutboxEvent = async (params: {
  request: FulfillmentRequestRecord;
  event: FulfillmentRequestEvent;
  payload?: Record<string, unknown>;
}): Promise<FulfillmentOutboxEventRecord> => {
  const state = await readFulfillmentOutboxState();
  const id = buildFulfillmentOutboxEventId({
    requestId: params.request.requestId,
    action: params.event.action,
    actionId: params.event.actionId,
  });
  const duplicate = state.events.find((event) => event.id === id);
  if (duplicate) {
    return duplicate;
  }
  const cursor = Math.max(0, Number(state.nextCursor)) + 1;
  const record: FulfillmentOutboxEventRecord = {
    schemaVersion: '1.0.0',
    id,
    cursor,
    requestId: params.request.requestId,
    actionId: params.event.actionId,
    action: params.event.action,
    eventType: fulfillmentEventTypeFromAction(params.event.action),
    requestType: params.request.type,
    status: params.request.status,
    sourceSuite: params.request.sourceSuite,
    siteId: params.request.siteId,
    skuId: params.request.skuId,
    occurredAt: params.event.timestamp ?? nowIso(),
    payload: params.payload,
  };
  await writeFulfillmentOutboxState({
    ...state,
    nextCursor: cursor,
    events: [...state.events, record],
  });
  return record;
};

export const listFulfillmentOutboxEvents = async (params?: {
  cursor?: number;
  limit?: number;
  siteId?: string;
}): Promise<{ events: FulfillmentOutboxEventRecord[]; nextCursor: number }> => {
  const state = await readFulfillmentOutboxState();
  const cursor = Number.isFinite(Number(params?.cursor)) ? Number(params?.cursor) : 0;
  const limit = Number.isFinite(Number(params?.limit))
    ? Math.min(500, Math.max(1, Number(params?.limit)))
    : 200;
  const siteId = params?.siteId ? normalizeSiteId(params.siteId) : '';
  const filtered = state.events
    .filter((event) => event.cursor > cursor)
    .filter((event) => (siteId ? normalizeSiteId(event.siteId) === siteId : true))
    .sort((left, right) => left.cursor - right.cursor)
    .slice(0, limit);
  const nextCursor = filtered.length > 0 ? filtered[filtered.length - 1].cursor : cursor;
  return {
    events: filtered,
    nextCursor,
  };
};

const resolveInventoryItemBySkuId = (
  items: InventoryItemRecord[],
  skuId: string,
  siteId?: string
): InventoryItemRecord | undefined => {
  const normalized = normalizeSkuId(skuId);
  const normalizedSiteId = siteId ? normalizeSiteId(siteId) : undefined;
  if (!normalized) return undefined;
  return items.find((item) => {
    const knownSku = normalizeSkuId(item.skuId || item.sku || item.id);
    const siteMatches =
      normalizedSiteId === undefined || normalizeSiteId(item.siteId) === normalizedSiteId;
    return (
      siteMatches &&
      (knownSku === normalized ||
        normalizeSkuId(item.id) === normalized ||
        normalizeSkuId(item.sku) === normalized)
    );
  });
};

const availableQtyForItem = (item: Pick<InventoryItemRecord, 'onHandQty' | 'allocatedQty'>) =>
  Math.max(0, Number(item.onHandQty) - Number(item.allocatedQty));

const availableQtyForPackageLot = (
  lot: Pick<PackageLotRecord, 'totalUnits' | 'allocatedUnits' | 'shippedUnits'>
) =>
  Math.max(0, Number(lot.totalUnits) - Number(lot.allocatedUnits) - Number(lot.shippedUnits));

const readMetadataText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const getPackageLotStateBreakdown = (lot: Pick<
  PackageLotRecord,
  'totalUnits' | 'allocatedUnits' | 'shippedUnits' | 'releaseStatus'
>) => {
  const availableQty = availableQtyForPackageLot(lot);
  const releaseStatus = lot.releaseStatus ?? 'held';
  const releasedQty = releaseStatus === 'released' ? availableQty : 0;
  const inBondQty = releaseStatus === 'held' || releaseStatus === 'ready' ? availableQty : 0;
  const shippedQty = Math.max(0, Number(lot.shippedUnits) || 0);
  return {
    availableQty,
    releasedQty,
    inBondQty,
    shippedQty,
    releaseStatus,
  };
};

const buildAvailabilitySnapshotFromState = (params: {
  inventory: InventoryState;
  batches: BatchState;
  packageLots: PackageLotState;
  skuId: string;
  siteId?: string;
}): AvailabilitySnapshot => {
  const normalizedSkuId = normalizeSkuId(params.skuId);
  const normalizedSiteId = normalizeSiteId(params.siteId);
  const item = resolveInventoryItemBySkuId(
    params.inventory.items,
    normalizedSkuId,
    normalizedSiteId
  );
  const unit = item?.unit ?? 'units';
  const onHandQty = item ? Number(item.onHandQty) : 0;
  const allocatedQty = item ? Number(item.allocatedQty) : 0;
  let availableQty = item ? availableQtyForItem(item) : 0;
  let inBondQty = 0;
  let releasedQty = 0;
  let shippedQty = 0;

  const lotBreakdown: AvailabilitySnapshot['lotBreakdown'] = [];

  if (item) {
    const matchingPackageLots = params.packageLots.lots.filter(
      (lot) =>
        normalizeSkuId(lot.packageSkuId ?? lot.skuId) === normalizedSkuId &&
        normalizeSiteId(lot.siteId) === normalizedSiteId
    );

    if (matchingPackageLots.length > 0) {
      const lotAllocatedQty = matchingPackageLots.reduce(
        (sum, lot) => sum + Math.max(0, Number(lot.allocatedUnits) || 0),
        0
      );
      for (const lot of matchingPackageLots) {
        const metadata = lot.metadata ?? {};
        const breakdown = getPackageLotStateBreakdown(lot);
        inBondQty += breakdown.inBondQty;
        releasedQty += breakdown.releasedQty;
        shippedQty += breakdown.shippedQty;
        lotBreakdown.push({
          lotId: lot.lotCode || lot.packageLotCode || `LOT-${lot.id}`,
          packageLotId: lot.id,
          packageLotCode: lot.packageLotCode ?? lot.lotCode,
          batchId: lot.batchId,
          batchCode:
            lot.batchCode ?? readMetadataText((metadata as Record<string, unknown>).batchCode),
          assetId: lot.primaryAssetId ?? readMetadataText((metadata as Record<string, unknown>).assetId),
          assetCode:
            lot.primaryAssetCode ?? readMetadataText((metadata as Record<string, unknown>).assetCode),
          availableQty: breakdown.releasedQty,
          inBondQty: breakdown.inBondQty,
          releasedQty: breakdown.releasedQty,
          shippedQty: breakdown.shippedQty,
          releaseStatus: breakdown.releaseStatus,
        });
      }
      availableQty = Math.max(
        0,
        releasedQty - Math.max(0, allocatedQty - lotAllocatedQty)
      );
    } else {
      const matchingBatches = params.batches.batches.filter(
        (batch) =>
          normalizeSkuId(batch.skuId) === normalizedSkuId &&
          normalizeSiteId(batch.siteId) === normalizedSiteId
      );
      if (matchingBatches.length > 0) {
        for (const batch of matchingBatches) {
          lotBreakdown.push({
            lotId: batch.lotCode || `LOT-${batch.id}`,
            batchId: batch.id,
            batchCode: batch.batchCode ?? batch.lotCode,
            availableQty: Math.max(
              0,
              batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)
            ),
          });
        }
      } else {
        lotBreakdown.push({
          lotId: `INV-${item.id}`,
          availableQty,
        });
      }
    }
  }

  return {
    schemaVersion: '1.0.0',
    skuId: normalizedSkuId,
    siteId: normalizedSiteId,
    onHandQty,
    allocatedQty,
    availableQty,
    inBondQty,
    releasedQty,
    shippedQty,
    uom: unit,
    lotBreakdown,
    asOf: nowIso(),
  };
};

export const buildAvailabilitySnapshot = async (params: {
  skuId: string;
  siteId?: string;
}): Promise<AvailabilitySnapshot> => {
  const [inventory, batches, packageLots] = await Promise.all([
    readInventoryState(),
    readBatchState(),
    readPackageLotState(),
  ]);
  return buildAvailabilitySnapshotFromState({
    inventory,
    batches,
    packageLots,
    skuId: params.skuId,
    siteId: params.siteId,
  });
};

const buildLotAllocationsForReservation = (params: {
  item: InventoryItemRecord;
  batches: BatchState;
  packageLots: PackageLotState;
  skuId: string;
  siteId: string;
  allocateQty: number;
  uom: string;
  expiresAt?: string;
}): ReservationLotAllocation[] => {
  let remaining = params.allocateQty;
  const allocations: ReservationLotAllocation[] = [];
  const normalizedSkuId = normalizeSkuId(params.skuId);
  const normalizedSiteId = normalizeSiteId(params.siteId);
  const candidatePackageLots = params.packageLots.lots
    .filter(
      (lot) =>
        normalizeSkuId(lot.packageSkuId ?? lot.skuId) === normalizedSkuId &&
        normalizeSiteId(lot.siteId) === normalizedSiteId &&
        lot.status !== 'canceled'
    )
    .sort((left, right) => {
      const leftStamp = Date.parse(left.createdAt ?? left.updatedAt ?? '') || 0;
      const rightStamp = Date.parse(right.createdAt ?? right.updatedAt ?? '') || 0;
      return leftStamp - rightStamp;
    });

  if (candidatePackageLots.length > 0) {
    const lotAllocatedQty = candidatePackageLots.reduce(
      (sum, lot) => sum + Math.max(0, Number(lot.allocatedUnits) || 0),
      0
    );
    let reservedOffset = Math.max(0, Number(params.item.allocatedQty) - lotAllocatedQty);

    for (const lot of candidatePackageLots) {
      if (remaining <= 0) break;
      const breakdown = getPackageLotStateBreakdown(lot);
      let releasedAvailable = breakdown.releasedQty;
      if (reservedOffset > 0 && releasedAvailable > 0) {
        const consumedOffset = Math.min(releasedAvailable, reservedOffset);
        releasedAvailable -= consumedOffset;
        reservedOffset -= consumedOffset;
      }
      if (releasedAvailable <= 0) continue;
      const qty = Math.min(releasedAvailable, remaining);
      allocations.push({
        lotId: lot.packageLotCode || lot.lotCode || `LOT-${lot.id}`,
        packageLotId: lot.id,
        packageLotCode: lot.packageLotCode ?? lot.lotCode,
        batchId: lot.batchId,
        itemId: params.item.id,
        skuId: normalizedSkuId,
        qty,
        uom: params.uom,
        expiresAt: params.expiresAt,
        releaseStatus: lot.releaseStatus ?? 'held',
      });
      remaining -= qty;
    }

    if (remaining <= 0) {
      return allocations.filter((allocation) => allocation.qty > 0);
    }
  }

  const candidateBatches = params.batches.batches.filter(
    (batch) =>
      normalizeSkuId(batch.skuId) === normalizedSkuId &&
      normalizeSiteId(batch.siteId) === normalizedSiteId
  );

  for (const batch of candidateBatches) {
    if (remaining <= 0) break;
    const batchAvailable = Math.max(
      0,
      batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)
    );
    if (batchAvailable <= 0) continue;
    const qty = Math.min(batchAvailable, remaining);
    allocations.push({
      lotId: batch.lotCode || `LOT-${batch.id}`,
      batchId: batch.id,
      itemId: params.item.id,
      skuId: normalizedSkuId,
      qty,
      uom: params.uom,
      expiresAt: params.expiresAt,
    });
    remaining -= qty;
  }

  if (remaining > 0) {
    allocations.push({
      lotId: `INV-${params.item.id}`,
      itemId: params.item.id,
      skuId: normalizedSkuId,
      qty: remaining,
      uom: params.uom,
      expiresAt: params.expiresAt,
    });
  }

  return allocations.filter((allocation) => allocation.qty > 0);
};

export const createInventoryReservation = async (request: {
  schemaVersion?: string;
  requestId: string;
  orderId: string;
  lineId: string;
  skuId: string;
  requestedQty: number;
  uom: string;
  siteId: string;
  allowPartial?: boolean;
  constraints?: {
    lotPolicy?: 'fifo' | 'fefo' | 'specific_lots';
    preferredLotIds?: string[];
    expiresAt?: string;
  };
  requestedAt?: string;
}): Promise<AllocationResponseRecord> => {
  const normalizedRequestId = String(request.requestId ?? '').trim();
  const normalizedSkuId = normalizeSkuId(request.skuId);
  const normalizedSiteId = normalizeSiteId(request.siteId);
  const requestedQty = Number(request.requestedQty);
  const allowPartial = Boolean(request.allowPartial);

  const [reservationState, inventoryState, movementState, batchState, packageLotState] =
    await Promise.all([
      readReservationState(),
      readInventoryState(),
      readInventoryMovements(),
      readBatchState(),
      readPackageLotState(),
    ]);

  const prior = reservationState.reservations.find(
    (reservation) => reservation.requestId === normalizedRequestId
  );
  if (prior) {
    return prior.response;
  }

  let status: AllocationResponseRecord['status'] = 'rejected';
  let reasonCode: AllocationReasonCode | undefined;
  let reasonMessage: string | undefined;
  let allocatedQty = 0;
  let shortQty = Number.isFinite(requestedQty) && requestedQty > 0 ? requestedQty : 0;
  let allocations: ReservationLotAllocation[] = [];

  const itemAtAnySite = resolveInventoryItemBySkuId(inventoryState.items, normalizedSkuId);
  const item = resolveInventoryItemBySkuId(
    inventoryState.items,
    normalizedSkuId,
    normalizedSiteId
  );
  const currentAvailabilitySnapshot = item
    ? buildAvailabilitySnapshotFromState({
        inventory: inventoryState,
        batches: batchState,
        packageLots: packageLotState,
        skuId: normalizedSkuId,
        siteId: normalizedSiteId,
      })
    : undefined;
  if (!item) {
    if (itemAtAnySite) {
      reasonCode = 'site_unavailable';
      reasonMessage = `SKU ${normalizedSkuId} is not available at site ${normalizedSiteId}.`;
    } else {
      reasonCode = 'unknown_sku';
      reasonMessage = `SKU ${normalizedSkuId} not found in OS inventory.`;
    }
  } else if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
    reasonCode = 'validation_error';
    reasonMessage = 'requestedQty must be greater than zero.';
  } else if (!request.uom || String(request.uom).trim().length === 0) {
    reasonCode = 'validation_error';
    reasonMessage = 'uom is required.';
  } else if (String(request.uom).trim() !== item.unit) {
    reasonCode = 'invalid_uom';
    reasonMessage = `Requested uom ${request.uom} does not match inventory unit ${item.unit}.`;
  } else {
    const availableQty = currentAvailabilitySnapshot?.availableQty ?? availableQtyForItem(item);
    if (availableQty >= requestedQty) {
      status = 'reserved';
      allocatedQty = requestedQty;
      shortQty = 0;
      allocations = buildLotAllocationsForReservation({
        item,
        batches: batchState,
        packageLots: packageLotState,
        skuId: normalizedSkuId,
        siteId: normalizedSiteId,
        allocateQty: allocatedQty,
        uom: item.unit,
        expiresAt: request.constraints?.expiresAt,
      });
    } else if (allowPartial && availableQty > 0) {
      status = 'partially_reserved';
      allocatedQty = availableQty;
      shortQty = requestedQty - availableQty;
      reasonCode = 'insufficient_available';
      reasonMessage = `Only ${availableQty} ${item.unit} available for SKU ${normalizedSkuId}.`;
      allocations = buildLotAllocationsForReservation({
        item,
        batches: batchState,
        packageLots: packageLotState,
        skuId: normalizedSkuId,
        siteId: normalizedSiteId,
        allocateQty: allocatedQty,
        uom: item.unit,
        expiresAt: request.constraints?.expiresAt,
      });
    } else {
      status = 'rejected';
      allocatedQty = 0;
      shortQty = requestedQty;
      reasonCode = 'insufficient_available';
      reasonMessage = `Insufficient available quantity for SKU ${normalizedSkuId}.`;
    }
  }

  const now = nowIso();

  const nextInventoryItems = [...inventoryState.items];
  const nextPackageLots = [...packageLotState.lots];
  if (allocatedQty > 0 && item) {
    const itemIndex = nextInventoryItems.findIndex((candidate) => candidate.id === item.id);
    if (itemIndex >= 0) {
      nextInventoryItems[itemIndex] = {
        ...nextInventoryItems[itemIndex],
        allocatedQty: nextInventoryItems[itemIndex].allocatedQty + allocatedQty,
        updatedAt: now,
      };
    }
    for (const allocation of allocations) {
      if (!allocation.packageLotId && !allocation.packageLotCode) continue;
      const packageLotIndex = allocation.packageLotId
        ? nextPackageLots.findIndex((lot) => lot.id === allocation.packageLotId)
        : nextPackageLots.findIndex(
            (lot) =>
              normalizeSiteId(lot.siteId) === normalizedSiteId &&
              (lot.packageLotCode === allocation.packageLotCode ||
                lot.lotCode === allocation.packageLotCode)
          );
      if (packageLotIndex < 0) continue;
      nextPackageLots[packageLotIndex] = {
        ...nextPackageLots[packageLotIndex],
        allocatedUnits: normalizeQty(
          Number(nextPackageLots[packageLotIndex].allocatedUnits ?? 0) + allocation.qty
        ),
        updatedAt: now,
      };
    }
  }

  const nextMovementEntries = [...movementState.movements];
  if (allocatedQty > 0 && item) {
    nextMovementEntries.push({
      id: randomUUID(),
      itemId: item.id,
      siteId: item.siteId,
      type: 'allocate',
      quantity: allocatedQty,
      unit: item.unit,
      reason: `OPS reservation ${normalizedRequestId} for order ${request.orderId}`,
      batchId: allocations[0]?.batchId,
      createdAt: now,
    });
  }

  const nextInventoryState =
    allocatedQty > 0
      ? await writeInventoryState({
          ...inventoryState,
          items: nextInventoryItems,
        })
      : inventoryState;
  const nextPackageLotState =
    allocatedQty > 0
      ? await writePackageLotState({
          ...packageLotState,
          lots: nextPackageLots,
        })
      : packageLotState;

  if (allocatedQty > 0) {
    await writeInventoryMovements({
      ...movementState,
      movements: nextMovementEntries,
    });
  }

  const availabilitySnapshot = buildAvailabilitySnapshotFromState({
    inventory: nextInventoryState,
    batches: batchState,
    packageLots: nextPackageLotState,
    skuId: normalizedSkuId,
    siteId: normalizedSiteId,
  });

  const reservationId = randomUUID();
  const response: AllocationResponseRecord = {
    schemaVersion: '1.0.0',
    reservationId,
    requestId: normalizedRequestId,
    orderId: request.orderId,
    lineId: request.lineId,
    status,
    allocatedQty,
    shortQty,
    reasonCode,
    reasonMessage,
    allocations: allocations.map((allocation) => ({
      lotId: allocation.lotId,
      packageLotId: allocation.packageLotId,
      packageLotCode: allocation.packageLotCode,
      batchId: allocation.batchId,
      qty: allocation.qty,
      uom: allocation.uom,
      expiresAt: allocation.expiresAt,
      releaseStatus: allocation.releaseStatus,
    })),
    availabilitySnapshot,
    respondedAt: now,
  };

  const reservationRecord: ReservationRecord = {
    schemaVersion: '1.0.0',
    reservationId,
    requestId: normalizedRequestId,
    orderId: request.orderId,
    lineId: request.lineId,
    skuId: normalizedSkuId,
    siteId: normalizedSiteId,
    uom: request.uom,
    requestedQty,
    allowPartial,
    status: status === 'reserved' || status === 'partially_reserved' ? status : 'rejected',
    allocatedQty,
    shortQty,
    reasonCode,
    reasonMessage,
    allocations,
    createdAt: now,
    updatedAt: now,
    response,
  };

  await writeReservationState({
    ...reservationState,
    reservations: [reservationRecord, ...reservationState.reservations],
  });

  return response;
};

export const applyInventoryReservationAction = async (params: {
  reservationId: string;
  actionId: string;
  action: 'commit' | 'release' | 'expire';
  orderId?: string;
  lineId?: string;
  reasonCode?:
    | 'picked'
    | 'shipped'
    | 'order_canceled'
    | 'line_edited'
    | 'reservation_timeout'
    | 'manual_override';
  reasonMessage?: string;
  occurredAt?: string;
}): Promise<ReservationActionResult | null> => {
  const reservationId = String(params.reservationId ?? '').trim();
  const actionId = String(params.actionId ?? '').trim();
  if (!reservationId || !actionId) return null;

  const [reservationState, actionState, inventoryState, movementState, batchState, packageLotState] =
    await Promise.all([
      readReservationState(),
      readReservationActionsState(),
      readInventoryState(),
      readInventoryMovements(),
      readBatchState(),
      readPackageLotState(),
    ]);

  const existingAction = actionState.actions.find((entry) => entry.actionId === actionId);
  if (existingAction) {
    return existingAction.result;
  }

  const reservationIndex = reservationState.reservations.findIndex(
    (entry) => entry.reservationId === reservationId
  );
  if (reservationIndex < 0) {
    return null;
  }

  const reservation = reservationState.reservations[reservationIndex];
  let nextStatus: ReservationStatus = reservation.status;
  const shouldMutateInventory =
    reservation.allocatedQty > 0 &&
    (reservation.status === 'reserved' || reservation.status === 'partially_reserved');

  const nextInventoryItems = [...inventoryState.items];
  const nextPackageLots = [...packageLotState.lots];
  const nextMovements = [...movementState.movements];
  const inventoryItem = resolveInventoryItemBySkuId(
    nextInventoryItems,
    reservation.skuId,
    reservation.siteId
  );
  const actionTime = params.occurredAt ?? nowIso();
  let inventoryChanged = false;
  let packageLotsChanged = false;
  let movementsChanged = false;

  if (params.action === 'commit') {
    nextStatus = 'committed';
    if (shouldMutateInventory && inventoryItem) {
      const index = nextInventoryItems.findIndex((item) => item.id === inventoryItem.id);
      if (index >= 0) {
        const reducedAllocated = Math.max(
          0,
          nextInventoryItems[index].allocatedQty - reservation.allocatedQty
        );
        const reducedOnHand = Math.max(
          0,
          nextInventoryItems[index].onHandQty - reservation.allocatedQty
        );
        nextInventoryItems[index] = {
          ...nextInventoryItems[index],
          allocatedQty: reducedAllocated,
          onHandQty: reducedOnHand,
          updatedAt: actionTime,
        };
        inventoryChanged = true;
      }
      nextMovements.push({
        id: randomUUID(),
        itemId: inventoryItem.id,
        siteId: inventoryItem.siteId,
        type: 'ship',
        quantity: reservation.allocatedQty,
        unit: inventoryItem.unit,
        reason: `Reservation committed (${reservation.reservationId})`,
        batchId: reservation.allocations[0]?.batchId,
        createdAt: actionTime,
      });
      movementsChanged = true;
    }
    if (shouldMutateInventory) {
      for (const allocation of reservation.allocations) {
        if (!allocation.packageLotId && !allocation.packageLotCode) continue;
        const packageLotIndex = allocation.packageLotId
          ? nextPackageLots.findIndex((lot) => lot.id === allocation.packageLotId)
          : nextPackageLots.findIndex(
              (lot) =>
                normalizeSiteId(lot.siteId) === normalizeSiteId(reservation.siteId) &&
                (lot.packageLotCode === allocation.packageLotCode ||
                  lot.lotCode === allocation.packageLotCode)
            );
        if (packageLotIndex < 0) continue;
        const currentLot = nextPackageLots[packageLotIndex];
        const nextShippedUnits = normalizeQty(
          Number(currentLot.shippedUnits ?? 0) + Number(allocation.qty ?? 0)
        );
        nextPackageLots[packageLotIndex] = {
          ...currentLot,
          allocatedUnits: Math.max(
            0,
            normalizeQty(Number(currentLot.allocatedUnits ?? 0) - Number(allocation.qty ?? 0))
          ),
          shippedUnits: nextShippedUnits,
          releaseStatus:
            nextShippedUnits >= Number(currentLot.totalUnits ?? 0) ? 'shipped' : 'released',
          updatedAt: actionTime,
        };
        packageLotsChanged = true;
      }
    }
  } else if (params.action === 'release' || params.action === 'expire') {
    nextStatus = params.action === 'release' ? 'released' : 'expired';
    if (shouldMutateInventory && inventoryItem) {
      const index = nextInventoryItems.findIndex((item) => item.id === inventoryItem.id);
      if (index >= 0) {
        nextInventoryItems[index] = {
          ...nextInventoryItems[index],
          allocatedQty: Math.max(
            0,
            nextInventoryItems[index].allocatedQty - reservation.allocatedQty
          ),
          updatedAt: actionTime,
        };
        inventoryChanged = true;
      }
      nextMovements.push({
        id: randomUUID(),
        itemId: inventoryItem.id,
        siteId: inventoryItem.siteId,
        type: 'release',
        quantity: reservation.allocatedQty,
        unit: inventoryItem.unit,
        reason: `Reservation ${params.action} (${reservation.reservationId})`,
        batchId: reservation.allocations[0]?.batchId,
        createdAt: actionTime,
      });
      movementsChanged = true;
    }
    if (shouldMutateInventory) {
      for (const allocation of reservation.allocations) {
        if (!allocation.packageLotId && !allocation.packageLotCode) continue;
        const packageLotIndex = allocation.packageLotId
          ? nextPackageLots.findIndex((lot) => lot.id === allocation.packageLotId)
          : nextPackageLots.findIndex(
              (lot) =>
                normalizeSiteId(lot.siteId) === normalizeSiteId(reservation.siteId) &&
                (lot.packageLotCode === allocation.packageLotCode ||
                  lot.lotCode === allocation.packageLotCode)
            );
        if (packageLotIndex < 0) continue;
        const currentLot = nextPackageLots[packageLotIndex];
        nextPackageLots[packageLotIndex] = {
          ...currentLot,
          allocatedUnits: Math.max(
            0,
            normalizeQty(Number(currentLot.allocatedUnits ?? 0) - Number(allocation.qty ?? 0))
          ),
          updatedAt: actionTime,
        };
        packageLotsChanged = true;
      }
    }
  }

  if (movementsChanged) {
    await writeInventoryMovements({
      ...movementState,
      movements: nextMovements,
    });
  }

  const updatedInventoryState = inventoryChanged
    ? await writeInventoryState({
        ...inventoryState,
        items: nextInventoryItems,
      })
    : inventoryState;
  const updatedPackageLotState = packageLotsChanged
    ? await writePackageLotState({
        ...packageLotState,
        lots: nextPackageLots,
      })
    : packageLotState;

  const availabilitySnapshot = buildAvailabilitySnapshotFromState({
    inventory: updatedInventoryState,
    batches: batchState,
    packageLots: updatedPackageLotState,
    skuId: reservation.skuId,
    siteId: reservation.siteId,
  });

  const result: ReservationActionResult = {
    schemaVersion: '1.0.0',
    reservationId: reservation.reservationId,
    actionId,
    action: params.action,
    status: nextStatus,
    allocatedQty: reservation.allocatedQty,
    shortQty: reservation.shortQty,
    availabilitySnapshot,
    occurredAt: actionTime,
  };

  const updatedReservation: ReservationRecord = {
    ...reservation,
    status: nextStatus,
    updatedAt: actionTime,
  };
  const nextReservations = [...reservationState.reservations];
  nextReservations[reservationIndex] = updatedReservation;
  await writeReservationState({
    ...reservationState,
    reservations: nextReservations,
  });

  const actionRecord: ReservationActionRecord = {
    schemaVersion: '1.0.0',
    actionId,
    reservationId: reservation.reservationId,
    orderId: params.orderId ?? reservation.orderId,
    lineId: params.lineId ?? reservation.lineId,
    action: params.action,
    reasonCode: params.reasonCode,
    reasonMessage: params.reasonMessage,
    occurredAt: actionTime,
    createdAt: nowIso(),
    result,
  };
  await writeReservationActionsState({
    ...actionState,
    actions: [actionRecord, ...actionState.actions],
  });

  return result;
};

export interface InventoryRequirementCheck {
  requirementName: string;
  category: InventoryCategory | 'other';
  requiredQty?: number;
  requiredUnit?: string;
  matchedItemId?: string;
  matchedItemName?: string;
  availableQty?: number;
  status: 'ok' | 'low' | 'missing';
}

const normalizeName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeCategory = (value: unknown): InventoryCategory | 'other' => {
  const next = String(value ?? '').trim().toLowerCase();
  if (
    next === 'yeast' ||
    next === 'malt' ||
    next === 'hops' ||
    next === 'fruit' ||
    next === 'packaging' ||
    next === 'equipment'
  ) {
    return next;
  }
  return 'other';
};

export const extractRecipeRequirements = (
  recipe: ImportedRecipe
): Array<{
  name: string;
  category: InventoryCategory | 'other';
  requiredQty?: number;
  unit?: string;
}> => {
  const explicit = ((recipe as any).requirements ?? []) as Array<any>;
  if (explicit.length > 0) {
    return explicit.map((entry) => ({
      name: String(entry.name ?? 'Unknown Ingredient'),
      category: normalizeCategory(entry.category),
      requiredQty:
        Number.isFinite(Number(entry.requiredQty)) ? Number(entry.requiredQty) : undefined,
      unit: entry.unit ? String(entry.unit) : undefined,
    }));
  }
  const inferred: Array<{
    name: string;
    category: InventoryCategory | 'other';
    requiredQty?: number;
    unit?: string;
  }> = [];
  for (const step of recipe.steps) {
    const action = String(step.action ?? '').toLowerCase();
    const name = String(step.name ?? '').toLowerCase();
    if (action.includes('hop') || name.includes('hop')) {
      inferred.push({ name: step.name, category: 'hops' });
    } else if (action.includes('yeast') || name.includes('yeast')) {
      inferred.push({ name: step.name, category: 'yeast' });
    } else if (action.includes('malt') || name.includes('malt') || name.includes('grain')) {
      inferred.push({ name: step.name, category: 'malt' });
    } else if (action.includes('fruit') || name.includes('fruit')) {
      inferred.push({ name: step.name, category: 'fruit' });
    }
  }
  return inferred.slice(0, 50);
};

export const checkInventoryForRecipe = async (
  recipe: ImportedRecipe,
  siteId: string = DEFAULT_SITE_ID
): Promise<InventoryRequirementCheck[]> => {
  const inventory = await readInventoryState();
  const normalizedSiteId = normalizeSiteId(siteId);
  const siteItems = inventory.items.filter(
    (item) => normalizeSiteId(item.siteId) === normalizedSiteId
  );
  const requirements = extractRecipeRequirements(recipe);
  return requirements.map((requirement) => {
    const byName = siteItems.find(
      (item) => normalizeName(item.name) === normalizeName(requirement.name)
    );
    const byCategory =
      byName ??
      siteItems.find((item) => item.category === requirement.category);
    if (!byCategory) {
      return {
        requirementName: requirement.name,
        category: requirement.category,
        requiredQty: requirement.requiredQty,
        requiredUnit: requirement.unit,
        status: 'missing',
      };
    }
    const availableQty = Math.max(0, byCategory.onHandQty - byCategory.allocatedQty);
    if (typeof requirement.requiredQty === 'number' && requirement.requiredQty > availableQty) {
      return {
        requirementName: requirement.name,
        category: requirement.category,
        requiredQty: requirement.requiredQty,
        requiredUnit: requirement.unit,
        matchedItemId: byCategory.id,
        matchedItemName: byCategory.name,
        availableQty,
        status: availableQty > 0 ? 'low' : 'missing',
      };
    }
    if (availableQty <= byCategory.reorderPointQty) {
      return {
        requirementName: requirement.name,
        category: requirement.category,
        requiredQty: requirement.requiredQty,
        requiredUnit: requirement.unit,
        matchedItemId: byCategory.id,
        matchedItemName: byCategory.name,
        availableQty,
        status: 'low',
      };
    }
    return {
      requirementName: requirement.name,
      category: requirement.category,
      requiredQty: requirement.requiredQty,
      requiredUnit: requirement.unit,
      matchedItemId: byCategory.id,
      matchedItemName: byCategory.name,
      availableQty,
      status: 'ok',
    };
  });
};

export const createBatchFromRecipeRun = async (params: {
  recipeId?: string;
  recipeName: string;
  recipeRunId?: string;
  expectedUnit?: string;
  skuId?: string;
  siteId?: string;
  recipe?: ImportedRecipe;
  productSnapshot?: BatchProductSnapshot;
  batchCode?: string;
  batchKind?: 'source' | 'derived';
  rootBatchId?: string;
  parentBatchId?: string;
  parentBatchCode?: string;
  containerLabel?: string;
  containerKind?: BatchRecord['containerKind'];
  enteredContainerAt?: string;
}): Promise<BatchRecord> => {
  const state = await readBatchState();
  const existingBatchCodes = new Set(
    state.batches.map((batch) => String(batch.batchCode ?? batch.lotCode).trim().toUpperCase())
  );
  const recipeIntent: BatchRecipeIntentSnapshot | undefined = params.recipe
    ? {
        schemaVersion: '1.0.0',
        recipeId: params.recipe.id,
        recipeName: params.recipe.name,
        recipeFormat: params.recipe.format,
        sourceFile: params.recipe.rawFile,
        importedAt: params.recipe.importedAt,
        stepsCount: params.recipe.steps.length,
        requirementCount: params.recipe.requirements?.length ?? 0,
        requirements: params.recipe.requirements?.map((requirement) => ({
          name: requirement.name,
          category: normalizeCategory(requirement.category),
          requiredQty: requirement.requiredQty,
          unit: requirement.unit,
        })),
        capturedAt: nowIso(),
      }
    : undefined;
  const batchKind = params.batchKind === 'derived' ? 'derived' : 'source';
  const batchCode =
    normalizeLotCode(params.batchCode) ??
    (batchKind === 'derived'
      ? buildDerivedBatchCode({
          parentBatchCode: params.parentBatchCode,
          branchCode: params.containerLabel,
          existingCodes: existingBatchCodes,
        })
      : buildSourceBatchCode({
          productCode: params.productSnapshot?.productCode,
          existingCodes: existingBatchCodes,
        }));
  const batchId = randomUUID();
  const batch: BatchRecord = {
    id: batchId,
    skuId: params.skuId ? normalizeSkuId(params.skuId) : undefined,
    siteId: normalizeSiteId(params.siteId),
    batchCode,
    lotCode: batchCode,
    batchKind,
    rootBatchId:
      params.rootBatchId ? String(params.rootBatchId).trim() : batchKind === 'derived' ? undefined : batchId,
    parentBatchId: params.parentBatchId ? String(params.parentBatchId).trim() : undefined,
    parentBatchCode: params.parentBatchCode ? normalizeLotCode(params.parentBatchCode) : undefined,
    containerLabel: params.containerLabel ? String(params.containerLabel).trim() : undefined,
    containerKind: params.containerKind,
    enteredContainerAt: params.enteredContainerAt ? String(params.enteredContainerAt) : undefined,
    recipeId: params.recipeId,
    recipeName: params.recipeName,
    recipeRunId: params.recipeRunId,
    status: 'in_progress',
    producedQty: 0,
    allocatedQty: 0,
    dispensedQty: 0,
    unit: normalizeBatchVolumeUnit(params.expectedUnit ?? 'L'),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    intendedRecipe: recipeIntent,
    actualResults: {
      schemaVersion: '1.1.0',
      updatedAt: nowIso(),
    },
    deviations: [],
    packageLotIds: [],
    fulfillmentRequestIds: [],
    productSnapshot: normalizeBatchProductSnapshot(params.productSnapshot),
  };
  await writeBatchState({
    ...state,
    batches: [batch, ...state.batches],
  });
  return batch;
};

export const createManualBatch = async (params: {
  recipeName: string;
  recipeId?: string;
  recipeRunId?: string;
  skuId?: string;
  siteId?: string;
  lotCode?: string;
  batchCode?: string;
  producedQty?: number;
  unit?: string;
  status?: 'planned' | 'in_progress';
  productSnapshot?: BatchProductSnapshot;
  actualResults?: BatchRecord['actualResults'];
  batchKind?: 'source' | 'derived';
  productionMode?: BatchRecord['productionMode'];
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  plannedVesselLabel?: string;
  plannedVesselKind?: BatchRecord['plannedVesselKind'];
  rootBatchId?: string;
  parentBatchId?: string;
  parentBatchCode?: string;
  containerLabel?: string;
  containerKind?: BatchRecord['containerKind'];
  enteredContainerAt?: string;
  sourceInputs?: unknown[];
  readingLog?: unknown[];
  treatmentLog?: unknown[];
  volumeCheckpoints?: unknown[];
  sensoryQcRecords?: unknown[];
  stageTimeline?: unknown[];
  intendedRecipeTargets?: BatchRecipeIntentSnapshot['targets'];
}): Promise<BatchRecord> => {
  const recipeName = String(params.recipeName ?? '').trim();
  if (!recipeName) {
    throw new Error('recipeName is required.');
  }

  const state = await readBatchState();
  const existingBatchCodes = new Set(
    state.batches.map((batch) => String(batch.batchCode ?? batch.lotCode).trim().toUpperCase())
  );
  const batchKind = params.batchKind === 'derived' ? 'derived' : 'source';
  const batchCode =
    normalizeLotCode(params.batchCode ?? params.lotCode) ??
    buildSourceBatchCode({
      productCode: params.productSnapshot?.productCode ?? recipeName,
      existingCodes: existingBatchCodes,
    });

  const producedQty = Number(params.producedQty);
  const batchId = randomUUID();
  const batch: BatchRecord = {
    id: batchId,
    skuId: params.skuId ? normalizeSkuId(params.skuId) : undefined,
    siteId: normalizeSiteId(params.siteId),
    batchCode,
    lotCode: batchCode,
    batchKind,
    productionMode:
      params.productionMode === 'cellar'
        ? 'cellar'
        : params.productionMode === 'scheduled_runboard'
          ? 'scheduled_runboard'
          : batchKind === 'derived'
            ? 'cellar'
            : 'scheduled_runboard',
    scheduledStartAt: params.scheduledStartAt ? String(params.scheduledStartAt).trim() : undefined,
    scheduledEndAt: params.scheduledEndAt ? String(params.scheduledEndAt).trim() : undefined,
    plannedVesselLabel: params.plannedVesselLabel
      ? String(params.plannedVesselLabel).trim()
      : undefined,
    plannedVesselKind: params.plannedVesselKind,
    rootBatchId:
      params.rootBatchId ? String(params.rootBatchId).trim() : batchKind === 'derived' ? undefined : batchId,
    parentBatchId: params.parentBatchId ? String(params.parentBatchId).trim() : undefined,
    parentBatchCode: params.parentBatchCode ? normalizeLotCode(params.parentBatchCode) : undefined,
    containerLabel: params.containerLabel ? String(params.containerLabel).trim() : undefined,
    containerKind: params.containerKind,
    enteredContainerAt: params.enteredContainerAt ? String(params.enteredContainerAt) : undefined,
    recipeId: params.recipeId ? String(params.recipeId).trim() : undefined,
    recipeName,
    recipeRunId: params.recipeRunId ? String(params.recipeRunId).trim() : undefined,
    status: params.status === 'in_progress' ? 'in_progress' : 'planned',
    producedQty: Number.isFinite(producedQty) ? Math.max(0, normalizeQty(producedQty)) : 0,
    allocatedQty: 0,
    dispensedQty: 0,
    unit: normalizeBatchVolumeUnit(params.unit ?? 'L'),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    intendedRecipe: {
      schemaVersion: '1.1.0',
      recipeId: params.recipeId ? String(params.recipeId).trim() : undefined,
      recipeName,
      stepsCount: 0,
      requirementCount: 0,
      targets: params.intendedRecipeTargets,
      capturedAt: nowIso(),
    },
    actualResults:
      normalizeBatchActualResults(params.actualResults) ?? {
        schemaVersion: '1.1.0',
        updatedAt: nowIso(),
      },
    readingLog: (params.readingLog ?? [])
      .map((entry) => normalizeBatchReadingLogRecord(entry))
      .filter((entry): entry is BatchReadingLogRecord => entry !== null),
    deviations: [],
    sourceInputs: (params.sourceInputs ?? [])
      .map((entry) => normalizeBatchSourceInput(entry))
      .filter((entry): entry is BatchSourceInputRecord => entry !== null),
    treatmentLog: (params.treatmentLog ?? [])
      .map((entry) => normalizeBatchTreatmentLog(entry))
      .filter((entry): entry is BatchTreatmentLogRecord => entry !== null),
    volumeCheckpoints: (params.volumeCheckpoints ?? [])
      .map((entry) => normalizeBatchVolumeCheckpoint(entry))
      .filter((entry): entry is BatchVolumeCheckpointRecord => entry !== null),
    sensoryQcRecords: (params.sensoryQcRecords ?? [])
      .map((entry) => normalizeBatchSensoryQcRecord(entry))
      .filter((entry): entry is BatchSensoryQcRecord => entry !== null),
    stageTimeline: (params.stageTimeline ?? [])
      .map((entry) => normalizeBatchStageTimelineEvent(entry))
      .filter((entry): entry is BatchStageTimelineEvent => entry !== null),
    packageLotIds: [],
    fulfillmentRequestIds: [],
    productSnapshot: normalizeBatchProductSnapshot(params.productSnapshot),
  };

  await writeBatchState({
    ...state,
    batches: [batch, ...state.batches],
  });
  return batch;
};

export const reserveInventoryForRecipeRun = async (params: {
  recipe: ImportedRecipe;
  recipeRunId: string;
  batchId: string;
  siteId?: string;
}): Promise<InventoryRequirementCheck[]> => {
  const inventory = await readInventoryState();
  const movementState = await readInventoryMovements();
  const normalizedSiteId = normalizeSiteId(params.siteId);
  const checks = await checkInventoryForRecipe(params.recipe, normalizedSiteId);

  const nextItems = [...inventory.items];
  const movements = [...movementState.movements];

  for (const check of checks) {
    if (!check.matchedItemId) continue;
    const itemIndex = nextItems.findIndex((item) => item.id === check.matchedItemId);
    if (itemIndex < 0) continue;
    const quantity = typeof check.requiredQty === 'number' && check.requiredQty > 0 ? check.requiredQty : 1;
    nextItems[itemIndex] = {
      ...nextItems[itemIndex],
      allocatedQty: nextItems[itemIndex].allocatedQty + quantity,
      updatedAt: nowIso(),
    };
    movements.push({
      id: randomUUID(),
      itemId: nextItems[itemIndex].id,
      siteId: normalizeSiteId(nextItems[itemIndex].siteId),
      type: 'allocate',
      quantity,
      unit: nextItems[itemIndex].unit,
      reason: `Reserved for recipe run ${params.recipeRunId}`,
      recipeId: params.recipe.id,
      recipeRunId: params.recipeRunId,
      batchId: params.batchId,
      createdAt: nowIso(),
    });
  }

  await writeInventoryState({
    ...inventory,
    items: nextItems,
  });
  await writeInventoryMovements({
    ...movementState,
    movements,
  });
  return checks;
};

export const resetRecipeRunSideEffects = async (
  recipeRunIds?: string[]
): Promise<{
  releasedQty: number;
  updatedItems: number;
  removedMovements: number;
  removedBatches: number;
  removedPackageLots: number;
  updatedFulfillmentRequests: number;
}> => {
  const normalizedRunIds = (recipeRunIds ?? [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
  if (normalizedRunIds.length === 0) {
    return {
      releasedQty: 0,
      updatedItems: 0,
      removedMovements: 0,
      removedBatches: 0,
      removedPackageLots: 0,
      updatedFulfillmentRequests: 0,
    };
  }
  const runIdSet = new Set(normalizedRunIds);
  const matchesRun = (recipeRunId?: string): boolean => {
    if (!recipeRunId) return false;
    return runIdSet.has(String(recipeRunId).trim());
  };

  const [inventoryState, movementState, batchState, lotState, fulfillmentState] = await Promise.all([
    readInventoryState(),
    readInventoryMovements(),
    readBatchState(),
    readPackageLotState(),
    readFulfillmentRequestState(),
  ]);

  const releasedQtyByItem = new Map<string, number>();
  let removedMovements = 0;
  const keptMovements = movementState.movements.filter((movement) => {
    if (!matchesRun(movement.recipeRunId)) {
      return true;
    }
    removedMovements += 1;
    if (movement.type === 'allocate') {
      const qty = Number(movement.quantity);
      if (Number.isFinite(qty) && qty > 0) {
        releasedQtyByItem.set(
          movement.itemId,
          normalizeQty((releasedQtyByItem.get(movement.itemId) ?? 0) + qty)
        );
      }
    }
    return false;
  });

  let updatedItems = 0;
  let releasedQty = 0;
  const nextItems = inventoryState.items.map((item) => {
    const release = normalizeQty(releasedQtyByItem.get(item.id) ?? 0);
    if (release <= 0) {
      return item;
    }
    updatedItems += 1;
    releasedQty += release;
    return {
      ...item,
      allocatedQty: normalizeQty(Math.max(0, Number(item.allocatedQty) - release)),
      updatedAt: nowIso(),
    };
  });

  const nextBatches = batchState.batches.filter(
    (batch) => !matchesRun(batch.recipeRunId)
  );
  const removedBatches = batchState.batches.length - nextBatches.length;
  const removedBatchIdSet = new Set(
    batchState.batches
      .filter((batch) => matchesRun(batch.recipeRunId))
      .map((batch) => batch.id)
  );

  const nextLots = lotState.lots.filter((lot) => !removedBatchIdSet.has(lot.batchId));
  const removedPackageLots = lotState.lots.length - nextLots.length;

  let updatedFulfillmentRequests = 0;
  const nextFulfillmentRequests: FulfillmentRequestRecord[] = fulfillmentState.requests.map(
    (request): FulfillmentRequestRecord => {
    const filteredBatchIds = (request.linkedBatchIds ?? []).filter(
      (batchId) => !removedBatchIdSet.has(batchId)
    );
    if (filteredBatchIds.length === (request.linkedBatchIds ?? []).length) {
      return request;
    }
    updatedFulfillmentRequests += 1;
    const resetNoteEvent: FulfillmentRequestEvent = {
      id: randomUUID(),
      action: 'note',
      status: request.status,
      note: `Removed run-linked batch references during run reset (${normalizedRunIds.join(',')}).`,
      timestamp: nowIso(),
    };
    return {
      ...request,
      linkedBatchIds: filteredBatchIds,
      updatedAt: nowIso(),
      events: [resetNoteEvent, ...(request.events ?? [])].slice(0, 200),
    };
  });

  if (removedMovements > 0) {
    await writeInventoryMovements({
      ...movementState,
      movements: keptMovements,
    });
  }
  if (updatedItems > 0) {
    await writeInventoryState({
      ...inventoryState,
      items: nextItems,
    });
  }
  if (removedBatches > 0) {
    await writeBatchState({
      ...batchState,
      batches: nextBatches,
    });
  }
  if (removedPackageLots > 0) {
    await writePackageLotState({
      ...lotState,
      lots: nextLots,
    });
  }
  if (updatedFulfillmentRequests > 0) {
    await writeFulfillmentRequestState({
      ...fulfillmentState,
      requests: nextFulfillmentRequests,
    });
  }

  return {
    releasedQty: normalizeQty(releasedQty),
    updatedItems,
    removedMovements,
    removedBatches,
    removedPackageLots,
    updatedFulfillmentRequests,
  };
};

export const updateBatchOutput = async (params: {
  batchId: string;
  producedQty: number;
  dispensedQty?: number;
  unit?: string;
  status?: BatchStatus;
  actualResults?: Partial<BatchActualResultsSnapshot>;
  deviations?: unknown[];
  appendDeviation?: Omit<BatchDeviationRecord, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  };
  sourceInputs?: unknown[];
  readingLog?: unknown[];
  treatmentLog?: unknown[];
  volumeCheckpoints?: unknown[];
  sensoryQcRecords?: unknown[];
  stageTimeline?: unknown[];
  packageLotIds?: string[];
  fulfillmentRequestIds?: string[];
  notes?: string;
  recipeName?: string;
  skuId?: string;
  productSnapshot?: BatchProductSnapshot;
  productionMode?: BatchRecord['productionMode'];
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  plannedVesselLabel?: string;
  plannedVesselKind?: BatchRecord['plannedVesselKind'];
}): Promise<BatchRecord | null> => {
  const state = await readBatchState();
  const idx = state.batches.findIndex((batch) => batch.id === params.batchId);
  if (idx < 0) return null;
  const current = state.batches[idx];
  const currentActual = normalizeBatchActualResults(current.actualResults) ?? {
    schemaVersion: '1.1.0',
    updatedAt: nowIso(),
  };
  const mergedActual: BatchActualResultsSnapshot = normalizeBatchActualResults({
    ...currentActual,
    ...(params.actualResults ?? {}),
    notes:
      params.notes !== undefined
        ? String(params.notes).trim() || undefined
        : currentActual.notes,
    updatedAt: nowIso(),
  }) ?? {
    schemaVersion: '1.1.0',
    updatedAt: nowIso(),
  };
  validateMeasuredValues(mergedActual);
  validateMeasuredValues({
    abvPct: mergedActual.finalLabAbvPct,
    ph: mergedActual.finalLabPh,
    brix: mergedActual.finalLabBrix,
    residualSugarGpl: mergedActual.finalLabResidualSugarGpl,
    titratableAcidityGpl: mergedActual.finalLabTitratableAcidityGpl,
    freeSo2Ppm: mergedActual.finalLabFreeSo2Ppm,
    totalSo2Ppm: mergedActual.finalLabTotalSo2Ppm,
    dissolvedOxygenPpm: mergedActual.finalLabDissolvedOxygenPpm,
  });
  if (
    mergedActual.og !== undefined &&
    (mergedActual.sgLatest !== undefined || mergedActual.fg !== undefined)
  ) {
    const liveGravity = mergedActual.sgLatest ?? mergedActual.fg;
    if (liveGravity !== undefined && mergedActual.og >= liveGravity) {
      mergedActual.abvPct = normalizeQty((mergedActual.og - liveGravity) * 131.25);
    }
  }
  const nextStatus = params.status ?? current.status;
  if ((nextStatus === 'completed' || nextStatus === 'released') && !mergedActual.finalLabRecordedAt) {
    mergedActual.finalLabRecordedAt = nowIso();
  }
  if (nextStatus === 'completed' || nextStatus === 'released') {
    const missingFinalLabFields = getMissingFinalLabFields(mergedActual);
    if (missingFinalLabFields.length > 0) {
      throw new Error(
        `Final lab sign-off is required before marking this batch ${nextStatus === 'released' ? 'released' : 'completed'}. Missing: ${missingFinalLabFields.join(', ')}.`
      );
    }
  }
  const nextDeviations = [...(current.deviations ?? [])];
  if (params.appendDeviation) {
    nextDeviations.push({
      id: params.appendDeviation.id ?? randomUUID(),
      timestamp: params.appendDeviation.timestamp ?? nowIso(),
      field: params.appendDeviation.field ?? 'other',
      planned: params.appendDeviation.planned,
      actual: params.appendDeviation.actual,
      unit: params.appendDeviation.unit ? normalizeBatchVolumeUnit(params.appendDeviation.unit) : undefined,
      note: params.appendDeviation.note,
      source: params.appendDeviation.source,
      actor: params.appendDeviation.actor ? String(params.appendDeviation.actor).trim() : undefined,
      reasonCode:
        params.appendDeviation.reasonCode
          ? String(params.appendDeviation.reasonCode).trim()
          : undefined,
    });
  }
  const normalizedDeviations =
    params.deviations !== undefined
      ? params.deviations
          .map((entry) => normalizeBatchDeviation(entry))
          .filter((entry): entry is BatchDeviationRecord => entry !== null)
      : nextDeviations;
  const sourceInputs =
    params.sourceInputs !== undefined
      ? params.sourceInputs
          .map((entry) => normalizeBatchSourceInput(entry))
          .filter((entry): entry is BatchSourceInputRecord => entry !== null)
      : (current.sourceInputs ?? []);
  const readingLog =
    params.readingLog !== undefined
      ? params.readingLog
          .map((entry) => normalizeBatchReadingLogRecord(entry))
          .filter((entry): entry is BatchReadingLogRecord => entry !== null)
      : (current.readingLog ?? []);
  for (const entry of readingLog) {
    validateMeasuredValues({
      og: entry.og,
      fg: entry.fg,
      sg: entry.sg,
      temperatureC: entry.temperatureC,
      ph: entry.ph,
      brix: entry.brix,
      titratableAcidityGpl: entry.titratableAcidityGpl,
      so2Ppm: entry.so2Ppm,
      residualSugarGpl: entry.residualSugarGpl,
      volatileAcidityGpl: entry.volatileAcidityGpl,
      freeSo2Ppm: entry.freeSo2Ppm,
      totalSo2Ppm: entry.totalSo2Ppm,
      dissolvedOxygenPpm: entry.dissolvedOxygenPpm,
    });
  }
  const treatmentLog =
    params.treatmentLog !== undefined
      ? params.treatmentLog
          .map((entry) => normalizeBatchTreatmentLog(entry))
          .filter((entry): entry is BatchTreatmentLogRecord => entry !== null)
      : (current.treatmentLog ?? []);
  const volumeCheckpoints =
    params.volumeCheckpoints !== undefined
      ? params.volumeCheckpoints
          .map((entry) => normalizeBatchVolumeCheckpoint(entry))
          .filter((entry): entry is BatchVolumeCheckpointRecord => entry !== null)
      : (current.volumeCheckpoints ?? []);
  const sensoryQcRecords =
    params.sensoryQcRecords !== undefined
      ? params.sensoryQcRecords
          .map((entry) => normalizeBatchSensoryQcRecord(entry))
          .filter((entry): entry is BatchSensoryQcRecord => entry !== null)
      : (current.sensoryQcRecords ?? []);
  const stageTimeline =
    params.stageTimeline !== undefined
      ? params.stageTimeline
          .map((entry) => normalizeBatchStageTimelineEvent(entry))
          .filter((entry): entry is BatchStageTimelineEvent => entry !== null)
      : (current.stageTimeline ?? []);
  const packageLotIds = params.packageLotIds
    ? normalizeStringList(params.packageLotIds)
    : normalizeStringList(current.packageLotIds);
  const fulfillmentRequestIds = params.fulfillmentRequestIds
    ? normalizeStringList(params.fulfillmentRequestIds)
    : normalizeStringList(current.fulfillmentRequestIds);
  const next: BatchRecord = {
    ...current,
    recipeName:
      params.recipeName !== undefined
        ? String(params.recipeName).trim() || current.recipeName
        : current.recipeName,
    skuId:
      params.skuId !== undefined
        ? normalizeSkuId(params.skuId) || undefined
        : current.skuId,
    productionMode:
      params.productionMode !== undefined ? params.productionMode : current.productionMode,
    scheduledStartAt:
      params.scheduledStartAt !== undefined
        ? String(params.scheduledStartAt).trim() || undefined
        : current.scheduledStartAt,
    scheduledEndAt:
      params.scheduledEndAt !== undefined
        ? String(params.scheduledEndAt).trim() || undefined
        : current.scheduledEndAt,
    plannedVesselLabel:
      params.plannedVesselLabel !== undefined
        ? String(params.plannedVesselLabel).trim() || undefined
        : current.plannedVesselLabel,
    plannedVesselKind:
      params.plannedVesselKind !== undefined
        ? params.plannedVesselKind
        : current.plannedVesselKind,
    producedQty: params.producedQty,
    dispensedQty:
      params.dispensedQty !== undefined
        ? Math.max(0, normalizeQty(Number(params.dispensedQty)))
        : current.dispensedQty,
    status: nextStatus,
    completedAt:
      params.status === 'completed' || params.status === 'released'
        ? nowIso()
        : current.completedAt,
    releasedAt: params.status === 'released' ? nowIso() : current.releasedAt,
    unit: normalizeBatchVolumeUnit(params.unit ?? current.unit),
    updatedAt: nowIso(),
    actualResults: mergedActual,
    readingLog: readingLog.slice(-400),
    deviations: normalizedDeviations.slice(-200),
    sourceInputs,
    treatmentLog: treatmentLog.slice(-200),
    volumeCheckpoints: volumeCheckpoints.slice(-200),
    sensoryQcRecords: sensoryQcRecords.slice(-200),
    stageTimeline: stageTimeline.slice(-200),
    packageLotIds,
    fulfillmentRequestIds,
    productSnapshot:
      params.productSnapshot !== undefined
        ? normalizeBatchProductSnapshot(params.productSnapshot)
        : current.productSnapshot,
  };
  const batches = [...state.batches];
  batches[idx] = next;
  await writeBatchState({
    ...state,
    batches,
  });
  return next;
};

export const getBatchById = async (batchId: string): Promise<BatchRecord | null> => {
  const normalizedBatchId = String(batchId ?? '').trim();
  if (!normalizedBatchId) return null;
  const state = await readBatchState();
  return state.batches.find((batch) => batch.id === normalizedBatchId) ?? null;
};

export const getBatchByRecipeRunId = async (recipeRunId: string): Promise<BatchRecord | null> => {
  const normalizedRunId = String(recipeRunId ?? '').trim();
  if (!normalizedRunId) return null;
  const state = await readBatchState();
  return state.batches.find((batch) => batch.recipeRunId === normalizedRunId) ?? null;
};

export const recordBatchReadingByRecipeRunId = async (params: {
  recipeRunId: string;
  kind?:
    | 'og'
    | 'fg'
    | 'sg'
    | 'temp'
    | 'ph'
    | 'abv'
    | 'brix'
    | 'ta'
    | 'so2'
    | 'residual_sugar'
    | 'va'
    | 'free_so2'
    | 'total_so2'
    | 'do'
    | 'snapshot'
    | 'note';
  temperatureC?: number;
  sg?: number;
  ph?: number;
  abvPct?: number;
  brix?: number;
  titratableAcidityGpl?: number;
  so2Ppm?: number;
  residualSugarGpl?: number;
  volatileAcidityGpl?: number;
  freeSo2Ppm?: number;
  totalSo2Ppm?: number;
  dissolvedOxygenPpm?: number;
  note?: string;
}): Promise<BatchRecord | null> => {
  const batch = await getBatchByRecipeRunId(params.recipeRunId);
  if (!batch) return null;
  const partial: Partial<BatchActualResultsSnapshot> = {};
  if (Number.isFinite(Number(params.temperatureC))) {
    partial.temperatureCLatest = Number(params.temperatureC);
  }
  if (Number.isFinite(Number(params.sg))) {
    partial.sgLatest = Number(params.sg);
  }
  if (Number.isFinite(Number(params.ph))) {
    partial.phLatest = Number(params.ph);
  }
  if (Number.isFinite(Number(params.abvPct))) {
    partial.abvPct = Number(params.abvPct);
  }
  if (Number.isFinite(Number(params.brix))) {
    partial.brixLatest = Number(params.brix);
  }
  if (Number.isFinite(Number(params.titratableAcidityGpl))) {
    partial.titratableAcidityGplLatest = Number(params.titratableAcidityGpl);
  }
  if (Number.isFinite(Number(params.so2Ppm))) {
    partial.so2PpmLatest = Number(params.so2Ppm);
  }
  if (Number.isFinite(Number(params.residualSugarGpl))) {
    partial.residualSugarGplLatest = Number(params.residualSugarGpl);
  }
  if (Number.isFinite(Number(params.volatileAcidityGpl))) {
    partial.volatileAcidityGplLatest = Number(params.volatileAcidityGpl);
  }
  if (Number.isFinite(Number(params.freeSo2Ppm))) {
    partial.freeSo2PpmLatest = Number(params.freeSo2Ppm);
  }
  if (Number.isFinite(Number(params.totalSo2Ppm))) {
    partial.totalSo2PpmLatest = Number(params.totalSo2Ppm);
  }
  if (Number.isFinite(Number(params.dissolvedOxygenPpm))) {
    partial.dissolvedOxygenPpmLatest = Number(params.dissolvedOxygenPpm);
  }
  if (params.kind === 'og' && Number.isFinite(Number(params.sg))) {
    partial.og = Number(params.sg);
  }
  if (params.kind === 'fg' && Number.isFinite(Number(params.sg))) {
    partial.fg = Number(params.sg);
  }
  if (params.kind === 'abv' && Number.isFinite(Number(params.abvPct))) {
    partial.abvPct = Number(params.abvPct);
  }
  if (params.kind === 'brix' && Number.isFinite(Number(params.brix))) {
    partial.brixLatest = Number(params.brix);
  }
  if (params.kind === 'ta' && Number.isFinite(Number(params.titratableAcidityGpl))) {
    partial.titratableAcidityGplLatest = Number(params.titratableAcidityGpl);
  }
  if (params.kind === 'so2' && Number.isFinite(Number(params.so2Ppm))) {
    partial.so2PpmLatest = Number(params.so2Ppm);
  }
  if (params.kind === 'residual_sugar' && Number.isFinite(Number(params.residualSugarGpl))) {
    partial.residualSugarGplLatest = Number(params.residualSugarGpl);
  }
  if (params.kind === 'va' && Number.isFinite(Number(params.volatileAcidityGpl))) {
    partial.volatileAcidityGplLatest = Number(params.volatileAcidityGpl);
  }
  if (params.kind === 'free_so2' && Number.isFinite(Number(params.freeSo2Ppm))) {
    partial.freeSo2PpmLatest = Number(params.freeSo2Ppm);
  }
  if (params.kind === 'total_so2' && Number.isFinite(Number(params.totalSo2Ppm))) {
    partial.totalSo2PpmLatest = Number(params.totalSo2Ppm);
  }
  if (params.kind === 'do' && Number.isFinite(Number(params.dissolvedOxygenPpm))) {
    partial.dissolvedOxygenPpmLatest = Number(params.dissolvedOxygenPpm);
  }

  const next = await updateBatchOutput({
    batchId: batch.id,
    producedQty: batch.producedQty,
    unit: batch.unit,
    status: batch.status,
    actualResults: partial,
    notes: params.note,
  });
  return next;
};

export const createPackageLot = async (params: {
  batchId: string;
  lotCode?: string;
  packageLotCode?: string;
  packageType: PackageLotType;
  packageFormatCode?: string;
  containerStyle?: string;
  packageSkuId?: string;
  totalUnits: number;
  unitSize?: number;
  unitOfMeasure?: string;
  siteId?: string;
  notes?: string;
  releaseStatus?: PackageLotReleaseStatus;
  primaryAssetId?: string;
  primaryAssetCode?: string;
  assetCodes?: string[];
  metadata?: Record<string, unknown>;
}): Promise<PackageLotRecord> => {
  const batch = await getBatchById(params.batchId);
  if (!batch) {
    throw new Error('Batch not found for package lot creation.');
  }
  const lotState = await readPackageLotState();
  const packagedSkuId = params.packageSkuId
    ? normalizeSkuId(params.packageSkuId)
    : batch.skuId
      ? normalizeSkuId(batch.skuId)
      : undefined;
  const existingLotCodes = new Set(
    lotState.lots.map((lot) => String(lot.packageLotCode ?? lot.lotCode).trim().toUpperCase())
  );
  const packageLotCode =
    normalizeLotCode(params.packageLotCode ?? params.lotCode) ??
    buildPackageLotCode({
      skuId: packagedSkuId,
      batchCode: batch.batchCode ?? batch.lotCode,
      productCode: batch.productSnapshot?.productCode,
      existingCodes: existingLotCodes,
    });
  const now = nowIso();
  const sourceBatchSnapshot = {
    batchId: batch.id,
    batchCode: batch.batchCode ?? batch.lotCode,
    lotCode: batch.lotCode,
    recipeName: batch.recipeName,
    status: batch.status,
    batchKind: batch.batchKind,
    productionMode: batch.productionMode,
    containerLabel: batch.containerLabel,
    containerKind: batch.containerKind,
    unit: batch.unit,
    productSnapshot: batch.productSnapshot ? { ...batch.productSnapshot } : undefined,
    actualResults: batch.actualResults ? { ...batch.actualResults } : undefined,
    sourceInputs: (batch.sourceInputs ?? []).map((entry) => ({ ...entry })),
    readingLog: (batch.readingLog ?? []).map((entry) => ({ ...entry })),
    treatmentLog: (batch.treatmentLog ?? []).map((entry) => ({
      ...entry,
      blendComponents: entry.blendComponents?.map((component) => ({ ...component })),
    })),
    volumeCheckpoints: (batch.volumeCheckpoints ?? []).map((entry) => ({ ...entry })),
    sensoryQcRecords: (batch.sensoryQcRecords ?? []).map((entry) => ({ ...entry })),
    stageTimeline: (batch.stageTimeline ?? []).map((entry) => ({ ...entry })),
  };
  const record: PackageLotRecord = {
    id: randomUUID(),
    packageLotCode,
    lotCode: packageLotCode,
    batchId: batch.id,
    batchCode: batch.batchCode ?? batch.lotCode,
    skuId: packagedSkuId,
    siteId: normalizeSiteId(params.siteId ?? batch.siteId),
    packageType: params.packageType,
    packageFormatCode: params.packageFormatCode ? normalizeHumanCode(params.packageFormatCode) : undefined,
    containerStyle: params.containerStyle ? String(params.containerStyle).trim().toLowerCase() : undefined,
    packageSkuId: packagedSkuId,
    totalUnits: Math.max(0, normalizeQty(Number(params.totalUnits))),
    allocatedUnits: 0,
    shippedUnits: 0,
    unitSize:
      Number.isFinite(Number(params.unitSize)) && Number(params.unitSize) > 0
        ? Number(params.unitSize)
        : undefined,
    unitOfMeasure: params.unitOfMeasure ? String(params.unitOfMeasure).trim() : undefined,
    status: 'planned',
    releaseStatus: params.releaseStatus ?? 'held',
    primaryAssetId: params.primaryAssetId ? String(params.primaryAssetId).trim() : undefined,
    primaryAssetCode: params.primaryAssetCode ? String(params.primaryAssetCode).trim() : undefined,
    assetCodes: normalizeStringList(params.assetCodes),
    notes: params.notes ? String(params.notes).trim() : undefined,
    metadata: {
      ...(params.metadata ?? {}),
      packageFormatCode: params.packageFormatCode
        ? normalizeHumanCode(params.packageFormatCode)
        : undefined,
      containerStyle: params.containerStyle ? String(params.containerStyle).trim().toLowerCase() : undefined,
      ...(batch.productSnapshot
        ? {
            productId: batch.productSnapshot.productId,
            productCode: batch.productSnapshot.productCode,
            productName: batch.productSnapshot.productName,
            labelAssetId: batch.productSnapshot.labelAssetId,
            labelVersionId: batch.productSnapshot.labelVersionId,
            beverageClass: batch.productSnapshot.beverageClass,
          }
        : packagedSkuId
          ? {
              productCode: deriveProductCodeFromSkuAndFormat(
                packagedSkuId,
                params.packageFormatCode
              ),
            }
          : {}
      ),
      ...(packagedSkuId
        ? {
            outputSkuId: packagedSkuId,
          }
        : {}),
      assetId: params.primaryAssetId ? String(params.primaryAssetId).trim() : undefined,
      assetCode: params.primaryAssetCode ? String(params.primaryAssetCode).trim() : undefined,
      assetCodes: normalizeStringList(params.assetCodes),
      batchCode: batch.batchCode ?? batch.lotCode,
      sourceBatchSkuId: batch.skuId,
      sourceBatchRecord: sourceBatchSnapshot,
    },
    events: [],
    createdAt: now,
    updatedAt: now,
  };

  await writePackageLotState({
    ...lotState,
    lots: [record, ...lotState.lots],
  });
  await updateBatchOutput({
    batchId: batch.id,
    producedQty: batch.producedQty,
    dispensedQty: batch.dispensedQty,
    unit: batch.unit,
    status: batch.status,
    packageLotIds: [...new Set([...(batch.packageLotIds ?? []), record.id])],
  });

  return record;
};

export const updatePackageLot = async (params: {
  lotId: string;
  status?: PackageLotStatus;
  releaseStatus?: PackageLotReleaseStatus;
  totalUnits?: number;
  allocatedUnits?: number;
  shippedUnits?: number;
  unitSize?: number;
  unitOfMeasure?: string;
  containerStyle?: string;
  notes?: string;
  primaryAssetId?: string;
  primaryAssetCode?: string;
  assetCodes?: string[];
  metadata?: Record<string, unknown>;
  appendEvent?: PackageLotEventRecord;
}): Promise<PackageLotRecord | null> => {
  const lotId = String(params.lotId ?? '').trim();
  if (!lotId) return null;
  const state = await readPackageLotState();
  const index = state.lots.findIndex((lot) => lot.id === lotId);
  if (index < 0) return null;
  const current = state.lots[index];
  const next: PackageLotRecord = {
    ...current,
    status: params.status ?? current.status,
    releaseStatus: params.releaseStatus ?? current.releaseStatus,
    totalUnits:
      Number.isFinite(Number(params.totalUnits)) && params.totalUnits !== undefined
        ? Math.max(0, normalizeQty(Number(params.totalUnits)))
        : current.totalUnits,
    allocatedUnits:
      Number.isFinite(Number(params.allocatedUnits)) && params.allocatedUnits !== undefined
        ? Math.max(0, normalizeQty(Number(params.allocatedUnits)))
        : current.allocatedUnits,
    shippedUnits:
      Number.isFinite(Number(params.shippedUnits)) && params.shippedUnits !== undefined
        ? Math.max(0, normalizeQty(Number(params.shippedUnits)))
        : current.shippedUnits,
    unitSize:
      Number.isFinite(Number(params.unitSize)) && params.unitSize !== undefined && Number(params.unitSize) > 0
        ? Number(params.unitSize)
        : current.unitSize,
    unitOfMeasure:
      params.unitOfMeasure !== undefined
        ? String(params.unitOfMeasure).trim() || undefined
        : current.unitOfMeasure,
    containerStyle:
      params.containerStyle !== undefined
        ? String(params.containerStyle).trim().toLowerCase() || undefined
        : current.containerStyle,
    notes:
      params.notes !== undefined
        ? String(params.notes).trim() || undefined
        : current.notes,
    primaryAssetId:
      params.primaryAssetId !== undefined
        ? String(params.primaryAssetId).trim() || undefined
        : current.primaryAssetId,
    primaryAssetCode:
      params.primaryAssetCode !== undefined
        ? String(params.primaryAssetCode).trim() || undefined
        : current.primaryAssetCode,
    assetCodes:
      params.assetCodes !== undefined
        ? normalizeStringList(params.assetCodes)
        : current.assetCodes,
    metadata:
      params.metadata !== undefined
        ? {
            ...(current.metadata ?? {}),
            ...(params.metadata ?? {}),
          }
        : current.metadata,
    events: params.appendEvent
      ? [...(current.events ?? []), params.appendEvent]
      : current.events,
    updatedAt: nowIso(),
  };
  const lots = [...state.lots];
  lots[index] = next;
  await writePackageLotState({
    ...state,
    lots,
  });
  return next;
};

const mergeStringLists = (...values: Array<unknown>): string[] =>
  [...new Set(values.flatMap((value) => normalizeStringList(value)))];

const normalizePackageLotReleaseStatus = (
  value: unknown
): PackageLotReleaseStatus | undefined => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'held' ||
    normalized === 'ready' ||
    normalized === 'released' ||
    normalized === 'shipped'
    ? (normalized as PackageLotReleaseStatus)
    : undefined;
};

export const applyPackageLotAction = async (params: {
  lotId: string;
  action: PackageLotEventAction;
  quantity?: number;
  quantityDelta?: number;
  releaseStatus?: PackageLotReleaseStatus;
  note?: string;
  reasonCode?: string;
  actor?: string;
  assetId?: string;
  assetCode?: string;
  assetCodes?: string[];
  metadata?: Record<string, unknown>;
}): Promise<PackageLotRecord | null> => {
  const lotId = String(params.lotId ?? '').trim();
  if (!lotId) return null;
  const [lotState, inventoryState, movementState] = await Promise.all([
    readPackageLotState(),
    readInventoryState(),
    readInventoryMovements(),
  ]);
  const index = lotState.lots.findIndex((lot) => lot.id === lotId);
  if (index < 0) return null;

  const current = lotState.lots[index];
  const now = nowIso();
  const inventoryItem = resolveInventoryItemBySkuId(
    inventoryState.items,
    current.packageSkuId ?? current.skuId ?? '',
    current.siteId
  );
  const next: PackageLotRecord = {
    ...current,
    releaseStatus: current.releaseStatus ?? 'held',
    primaryAssetId: current.primaryAssetId,
    primaryAssetCode: current.primaryAssetCode,
    assetCodes: [...(current.assetCodes ?? [])],
    metadata: { ...(current.metadata ?? {}) },
    events: [...(current.events ?? [])],
    updatedAt: now,
  };

  const normalizedReasonCode = params.reasonCode ? String(params.reasonCode).trim() : undefined;
  const normalizedActor = params.actor ? String(params.actor).trim() : undefined;
  const normalizedAssetId = params.assetId ? String(params.assetId).trim() : undefined;
  const normalizedAssetCode = params.assetCode ? String(params.assetCode).trim() : undefined;
  if (normalizedAssetId !== undefined) {
    next.primaryAssetId = normalizedAssetId || undefined;
  }
  if (normalizedAssetCode !== undefined) {
    next.primaryAssetCode = normalizedAssetCode || undefined;
  }
  next.assetCodes = mergeStringLists(
    next.assetCodes,
    normalizedAssetCode ? [normalizedAssetCode] : [],
    params.assetCodes
  );
  next.metadata = {
    ...(next.metadata ?? {}),
    assetId: next.primaryAssetId,
    assetCode: next.primaryAssetCode,
    assetCodes: next.assetCodes,
  };

  let inventoryDelta = 0;
  let allocatedDelta = 0;
  let movement: InventoryMovementRecord | null = null;
  const availableUnits = availableQtyForPackageLot(current);
  const shippableUnits = Math.max(0, Number(current.totalUnits) - Number(current.shippedUnits));

  const requireQty = (value: unknown, label: string): number => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      throw new Error(`${label} must be greater than zero.`);
    }
    return normalizeQty(nextValue);
  };

  if (params.action === 'release_status') {
    const releaseStatus = normalizePackageLotReleaseStatus(params.releaseStatus);
    if (!releaseStatus) {
      throw new Error('releaseStatus is required for release status updates.');
    }
    next.releaseStatus = releaseStatus;
  } else if (params.action === 'assign_asset') {
    if (!normalizedAssetCode && !normalizedAssetId && next.assetCodes.length === 0) {
      throw new Error('Provide an asset or container code to assign.');
    }
  } else if (params.action === 'ship') {
    const qty = requireQty(params.quantity, 'Shipment quantity');
    if (qty > shippableUnits) {
      throw new Error(`Shipment exceeds remaining lot units (${shippableUnits}).`);
    }
    next.shippedUnits = normalizeQty(Number(current.shippedUnits) + qty);
    next.releaseStatus =
      next.shippedUnits >= Number(next.totalUnits) ? 'shipped' : 'released';
    inventoryDelta = -qty;
    allocatedDelta = -Math.min(Number(inventoryItem?.allocatedQty ?? 0), qty);
    movement = {
      id: randomUUID(),
      itemId: inventoryItem?.id ?? '',
      siteId: current.siteId,
      type: 'ship',
      quantity: qty,
      unit: current.unitOfMeasure ?? inventoryItem?.unit ?? 'units',
      reason: params.note ? String(params.note).trim() : `Removed ${qty} units from package lot ${current.packageLotCode ?? current.lotCode}.`,
      reasonCode: normalizedReasonCode ?? 'delivery_removal',
      actor: normalizedActor,
      batchId: current.batchId,
      packageLotId: current.id,
      assetId: next.primaryAssetId,
      assetCode: next.primaryAssetCode,
      metadata: {
        action: params.action,
        packageLotCode: current.packageLotCode ?? current.lotCode,
        packageSkuId: current.packageSkuId ?? current.skuId,
      },
      createdAt: now,
    };
  } else if (params.action === 'return') {
    const qty = requireQty(params.quantity, 'Return quantity');
    if (qty > Number(current.shippedUnits)) {
      throw new Error(`Return exceeds shipped units (${current.shippedUnits}).`);
    }
    next.shippedUnits = normalizeQty(Number(current.shippedUnits) - qty);
    if (next.releaseStatus === 'shipped' && next.shippedUnits < Number(next.totalUnits)) {
      next.releaseStatus = 'released';
    }
    inventoryDelta = qty;
    movement = {
      id: randomUUID(),
      itemId: inventoryItem?.id ?? '',
      siteId: current.siteId,
      type: 'receive',
      quantity: qty,
      unit: current.unitOfMeasure ?? inventoryItem?.unit ?? 'units',
      reason: params.note ? String(params.note).trim() : `Returned ${qty} units to package lot ${current.packageLotCode ?? current.lotCode}.`,
      reasonCode: normalizedReasonCode ?? 'return_to_stock',
      actor: normalizedActor,
      batchId: current.batchId,
      packageLotId: current.id,
      assetId: next.primaryAssetId,
      assetCode: next.primaryAssetCode,
      metadata: {
        action: params.action,
        packageLotCode: current.packageLotCode ?? current.lotCode,
        packageSkuId: current.packageSkuId ?? current.skuId,
      },
      createdAt: now,
    };
  } else if (params.action === 'empty_return') {
    // Empty keg/barrel returns affect container traceability, not liquid inventory.
  } else if (params.action === 'destroy' || params.action === 'rework') {
    const qty = requireQty(params.quantity, params.action === 'destroy' ? 'Destroyed quantity' : 'Rework quantity');
    if (qty > availableUnits) {
      throw new Error(`${params.action === 'destroy' ? 'Destroyed' : 'Rework'} quantity exceeds available lot units (${availableUnits}).`);
    }
    next.totalUnits = normalizeQty(Number(current.totalUnits) - qty);
    inventoryDelta = -qty;
    movement = {
      id: randomUUID(),
      itemId: inventoryItem?.id ?? '',
      siteId: current.siteId,
      type: params.action === 'destroy' ? 'adjust' : 'consume',
      quantity: qty,
      unit: current.unitOfMeasure ?? inventoryItem?.unit ?? 'units',
      reason:
        params.note
          ? String(params.note).trim()
          : params.action === 'destroy'
            ? `Destroyed ${qty} units from package lot ${current.packageLotCode ?? current.lotCode}.`
            : `Moved ${qty} units from package lot ${current.packageLotCode ?? current.lotCode} to rework.`,
      reasonCode: normalizedReasonCode ?? (params.action === 'destroy' ? 'destruction' : 'rework'),
      actor: normalizedActor,
      batchId: current.batchId,
      packageLotId: current.id,
      assetId: next.primaryAssetId,
      assetCode: next.primaryAssetCode,
      metadata: {
        action: params.action,
        packageLotCode: current.packageLotCode ?? current.lotCode,
        packageSkuId: current.packageSkuId ?? current.skuId,
      },
      createdAt: now,
    };
  } else if (params.action === 'adjust') {
    const delta = Number(params.quantityDelta ?? params.quantity ?? 0);
    if (!Number.isFinite(delta) || delta === 0) {
      throw new Error('Adjustment delta must be a non-zero number.');
    }
    if (delta < 0 && Math.abs(delta) > availableUnits) {
      throw new Error(`Negative adjustment exceeds available lot units (${availableUnits}).`);
    }
    const nextTotalUnits = normalizeQty(Number(current.totalUnits) + delta);
    if (nextTotalUnits < Number(current.allocatedUnits) + Number(current.shippedUnits)) {
      throw new Error('Adjustment would reduce the lot below allocated or shipped units.');
    }
    next.totalUnits = nextTotalUnits;
    inventoryDelta = delta;
    movement = {
      id: randomUUID(),
      itemId: inventoryItem?.id ?? '',
      siteId: current.siteId,
      type: 'adjust',
      quantity: Math.abs(normalizeQty(delta)),
      unit: current.unitOfMeasure ?? inventoryItem?.unit ?? 'units',
      reason:
        params.note
          ? String(params.note).trim()
          : `Adjusted package lot ${current.packageLotCode ?? current.lotCode} by ${delta > 0 ? '+' : ''}${normalizeQty(delta)} units.`,
      reasonCode: normalizedReasonCode ?? 'correction',
      actor: normalizedActor,
      batchId: current.batchId,
      packageLotId: current.id,
      assetId: next.primaryAssetId,
      assetCode: next.primaryAssetCode,
      metadata: {
        action: params.action,
        packageLotCode: current.packageLotCode ?? current.lotCode,
        packageSkuId: current.packageSkuId ?? current.skuId,
        quantityDelta: normalizeQty(delta),
      },
      createdAt: now,
    };
  } else if (params.action === 'note') {
    // Note-only event.
  }

  if (inventoryDelta !== 0 || movement) {
    if (!inventoryItem) {
      throw new Error('Inventory item not found for this package lot SKU.');
    }
    const itemIndex = inventoryState.items.findIndex((item) => item.id === inventoryItem.id);
    if (itemIndex < 0) {
      throw new Error('Inventory item not found for package lot action.');
    }
    const nextItems = [...inventoryState.items];
    nextItems[itemIndex] = {
      ...nextItems[itemIndex],
      onHandQty: normalizeQty(Math.max(0, Number(nextItems[itemIndex].onHandQty) + inventoryDelta)),
      allocatedQty: normalizeQty(Math.max(0, Number(nextItems[itemIndex].allocatedQty) + allocatedDelta)),
      updatedAt: now,
    };
    await writeInventoryState({
      ...inventoryState,
      items: nextItems,
    });
  }

  const event: PackageLotEventRecord = {
    id: randomUUID(),
    action: params.action,
    actor: normalizedActor,
    reasonCode: normalizedReasonCode,
    note: params.note ? String(params.note).trim() : undefined,
    quantity:
      params.action === 'adjust'
        ? Math.abs(normalizeQty(Number(params.quantityDelta ?? params.quantity ?? 0)))
        : Number.isFinite(Number(params.quantity))
          ? Math.max(0, normalizeQty(Number(params.quantity)))
          : undefined,
    unit: current.unitOfMeasure ?? inventoryItem?.unit ?? 'units',
    releaseStatus: params.action === 'release_status' ? next.releaseStatus : undefined,
    assetId: next.primaryAssetId,
    assetCode: next.primaryAssetCode,
    metadata:
      params.action === 'adjust'
        ? {
            ...(params.metadata ?? {}),
            quantityDelta: normalizeQty(Number(params.quantityDelta ?? params.quantity ?? 0)),
          }
        : params.metadata,
    timestamp: now,
  };

  next.events = [...(next.events ?? []), event].slice(-500);
  next.notes =
    params.note !== undefined && String(params.note).trim()
      ? String(params.note).trim()
      : next.notes;
  next.updatedAt = now;

  const lots = [...lotState.lots];
  lots[index] = next;
  await writePackageLotState({
    ...lotState,
    lots,
  });

  if (movement) {
    if (!movement.itemId) {
      throw new Error('Inventory item not found for package lot movement.');
    }
    await writeInventoryMovements({
      ...movementState,
      movements: [...movementState.movements, movement],
    });
  }

  return next;
};

export const listPackageLots = async (filters?: {
  batchId?: string;
  siteId?: string;
  status?: PackageLotStatus;
  skuId?: string;
}): Promise<PackageLotRecord[]> => {
  const state = await readPackageLotState();
  const batchId = filters?.batchId ? String(filters.batchId).trim() : '';
  const siteId = filters?.siteId ? normalizeSiteId(filters.siteId) : '';
  const skuId = filters?.skuId ? normalizeSkuId(filters.skuId) : '';
  return state.lots.filter((lot) => {
    if (batchId && lot.batchId !== batchId) return false;
    if (siteId && normalizeSiteId(lot.siteId) !== siteId) return false;
    if (filters?.status && lot.status !== filters.status) return false;
    if (skuId && normalizeSkuId(lot.packageSkuId ?? lot.skuId) !== skuId) return false;
    return true;
  });
};

export const getPackageLotById = async (lotId: string): Promise<PackageLotRecord | null> => {
  const normalizedLotId = String(lotId ?? '').trim();
  if (!normalizedLotId) return null;
  const state = await readPackageLotState();
  return state.lots.find((lot) => lot.id === normalizedLotId) ?? null;
};

const linkFulfillmentRequestToBatch = async (
  requestId: string,
  batchId: string
): Promise<void> => {
  const batch = await getBatchById(batchId);
  if (!batch) return;
  await updateBatchOutput({
    batchId: batch.id,
    producedQty: batch.producedQty,
    dispensedQty: batch.dispensedQty,
    unit: batch.unit,
    status: batch.status,
    fulfillmentRequestIds: [...new Set([...(batch.fulfillmentRequestIds ?? []), requestId])],
  });
};

const linkFulfillmentRequestToPackageLot = async (
  requestId: string,
  packageLotId: string
): Promise<void> => {
  const lotState = await readPackageLotState();
  const lot = lotState.lots.find((entry) => entry.id === packageLotId);
  if (!lot) return;
  await linkFulfillmentRequestToBatch(requestId, lot.batchId);
};

export const createFulfillmentRequest = async (params: {
  requestId: string;
  sourceSuite?: 'ops' | 'os' | 'lab' | 'flow' | 'connect';
  type: FulfillmentRequestType;
  siteId: string;
  skuId: string;
  requestedQty: number;
  uom: string;
  orderId?: string;
  lineId?: string;
  neededBy?: string;
  reasonCode?: string;
  reasonMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<FulfillmentRequestRecord> => {
  const requestId = String(params.requestId ?? '').trim();
  if (!requestId) {
    throw new Error('requestId is required.');
  }
  const state = await readFulfillmentRequestState();
  const existing = state.requests.find((entry) => entry.requestId === requestId);
  if (existing) {
    return existing;
  }
  const now = nowIso();
  const queueEvent: FulfillmentRequestEvent = {
    id: randomUUID(),
    action: 'queue',
    status: 'queued',
    timestamp: now,
  };
  const record: FulfillmentRequestRecord = {
    schemaVersion: '1.0.0',
    id: randomUUID(),
    requestId,
    sourceSuite: params.sourceSuite ?? 'ops',
    type: params.type,
    status: 'queued',
    siteId: normalizeSiteId(params.siteId),
    skuId: normalizeSkuId(params.skuId),
    requestedQty: Math.max(0, normalizeQty(Number(params.requestedQty))),
    uom: String(params.uom ?? 'units').trim() || 'units',
    orderId: params.orderId ? String(params.orderId).trim() : undefined,
    lineId: params.lineId ? String(params.lineId).trim() : undefined,
    neededBy: params.neededBy ? String(params.neededBy).trim() : undefined,
    reasonCode: params.reasonCode ? String(params.reasonCode).trim() : undefined,
    reasonMessage: params.reasonMessage ? String(params.reasonMessage).trim() : undefined,
    metadata: params.metadata ?? {},
    linkedBatchIds: [],
    linkedPackageLotIds: [],
    createdAt: now,
    updatedAt: now,
    events: [queueEvent],
  };
  await writeFulfillmentRequestState({
    ...state,
    requests: [record, ...state.requests],
  });
  await appendFulfillmentOutboxEvent({
    request: record,
    event: queueEvent,
    payload: {
      orderId: record.orderId,
      lineId: record.lineId,
      requestedQty: record.requestedQty,
      uom: record.uom,
    },
  });
  return record;
};

export const listFulfillmentRequests = async (filters?: {
  siteId?: string;
  status?: FulfillmentRequestStatus;
  type?: FulfillmentRequestType;
  skuId?: string;
}): Promise<FulfillmentRequestRecord[]> => {
  const state = await readFulfillmentRequestState();
  const normalizedSiteId = filters?.siteId ? normalizeSiteId(filters.siteId) : '';
  const normalizedSkuId = filters?.skuId ? normalizeSkuId(filters.skuId) : '';
  return state.requests.filter((entry) => {
    if (normalizedSiteId && normalizeSiteId(entry.siteId) !== normalizedSiteId) return false;
    if (filters?.status && entry.status !== filters.status) return false;
    if (filters?.type && entry.type !== filters.type) return false;
    if (normalizedSkuId && normalizeSkuId(entry.skuId) !== normalizedSkuId) return false;
    return true;
  });
};

type FulfillmentRequestAction = Exclude<FulfillmentRequestEvent['action'], 'queue'>;

const assertFulfillmentActionAllowed = (
  status: FulfillmentRequestStatus,
  action: FulfillmentRequestAction
): void => {
  if (action === 'note' || action === 'link_batch' || action === 'link_package_lot') {
    return;
  }
  const allowedByStatus: Record<FulfillmentRequestStatus, FulfillmentRequestAction[]> = {
    queued: ['accept', 'start', 'block', 'cancel', 'reject'],
    accepted: ['start', 'block', 'complete', 'cancel'],
    in_progress: ['block', 'complete', 'cancel'],
    blocked: ['start', 'cancel', 'reject'],
    completed: [],
    canceled: [],
    rejected: [],
  };
  const allowed = allowedByStatus[status] ?? [];
  if (!allowed.includes(action)) {
    throw new Error(`Invalid status transition: ${status} cannot apply action ${action}.`);
  }
};

const inferPackageLotTypeForRequest = (request: FulfillmentRequestRecord): PackageLotType => {
  const fromMetadata = String((request.metadata as any)?.packageType ?? '')
    .trim()
    .toLowerCase();
  if (
    fromMetadata === 'keg' ||
    fromMetadata === 'can' ||
    fromMetadata === 'bottle' ||
    fromMetadata === 'case' ||
    fromMetadata === 'pallet' ||
    fromMetadata === 'other'
  ) {
    return fromMetadata;
  }
  const sku = request.skuId.toLowerCase();
  if (sku.includes('keg')) return 'keg';
  if (sku.includes('can')) return 'can';
  if (sku.includes('bottle')) return 'bottle';
  if (sku.includes('case')) return 'case';
  if (sku.includes('pallet')) return 'pallet';
  return 'other';
};

const inferPackageFormatCodeForRequest = (request: FulfillmentRequestRecord): string | undefined => {
  const fromMetadata = normalizeHumanCode((request.metadata as any)?.packageFormatCode ?? '');
  if (fromMetadata) {
    return fromMetadata;
  }
  const segments = normalizeHumanCode(request.skuId).split('-').filter(Boolean);
  const last = segments.at(-1);
  return last || undefined;
};

const applyFulfillmentCompletionEffects = async (request: FulfillmentRequestRecord): Promise<{
  linkedBatchId?: string;
  linkedPackageLotId?: string;
  summary: Record<string, unknown>;
  note: string;
}> => {
  const siteId = normalizeSiteId(request.siteId);
  const skuId = normalizeSkuId(request.skuId);
  const qty = Number(request.requestedQty);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('requestedQty must be greater than zero for completion.');
  }

  const [inventoryState, movementState, batchState, lotState] = await Promise.all([
    readInventoryState(),
    readInventoryMovements(),
    readBatchState(),
    readPackageLotState(),
  ]);
  const now = nowIso();

  let linkedBatchId: string | undefined;
  let linkedPackageLotId: string | undefined;

  if (request.type === 'production') {
    const existingLinkedBatch = (request.linkedBatchIds ?? [])
      .map((batchId) =>
        batchState.batches.find(
          (candidate) =>
            candidate.id === batchId && normalizeSiteId(candidate.siteId) === siteId
        )
      )
      .find((candidate): candidate is BatchRecord => candidate !== undefined);

    let batch = existingLinkedBatch;
    let autoCreatedBatch = false;
    if (!batch) {
      batch = await createManualBatch({
        recipeName: `Fulfillment ${skuId}`,
        skuId,
        siteId,
        producedQty: qty,
        unit: request.uom,
        status: 'in_progress',
      });
      autoCreatedBatch = true;
    } else if (String(batch.unit).trim() !== String(request.uom).trim()) {
      throw new Error(
        `Linked batch unit ${batch.unit} does not match request unit ${request.uom}.`
      );
    }

    const nextProducedQty = autoCreatedBatch ? batch.producedQty : normalizeQty(batch.producedQty + qty);
    const updatedBatch = await updateBatchOutput({
      batchId: batch.id,
      producedQty: nextProducedQty,
      unit: batch.unit,
      status: 'completed',
      fulfillmentRequestIds: [...new Set([...(batch.fulfillmentRequestIds ?? []), request.requestId])],
    });
    if (!updatedBatch) {
      throw new Error('Failed to update linked batch during production completion.');
    }
    linkedBatchId = updatedBatch.id;
  } else {
    const lotFromRequest = (request.linkedPackageLotIds ?? [])
      .map((lotId) =>
        lotState.lots.find(
          (candidate) =>
            candidate.id === lotId && normalizeSiteId(candidate.siteId) === siteId
        )
      )
      .find((candidate): candidate is PackageLotRecord => candidate !== undefined);
    const batchIdFromRequest = (request.linkedBatchIds ?? []).find((batchId) =>
      batchState.batches.some(
        (batch) => batch.id === batchId && normalizeSiteId(batch.siteId) === siteId
      )
    );
    const sourceBatchId = lotFromRequest?.batchId ?? batchIdFromRequest;
    if (!sourceBatchId) {
      throw new Error('Packaging completion requires a linked batch or package lot.');
    }
    const sourceBatch =
      batchState.batches.find((batch) => batch.id === sourceBatchId) ??
      (await getBatchById(sourceBatchId));
    if (!sourceBatch) {
      throw new Error('Linked packaging source batch not found.');
    }
    if (normalizeSiteId(sourceBatch.siteId) !== siteId) {
      throw new Error('Linked packaging source batch site does not match request site.');
    }
    linkedBatchId = sourceBatch.id;

    if (lotFromRequest) {
      const updatedLot = await updatePackageLot({
        lotId: lotFromRequest.id,
        totalUnits: normalizeQty(lotFromRequest.totalUnits + qty),
        status: 'active',
      });
      if (!updatedLot) {
        throw new Error('Failed to update linked package lot during completion.');
      }
      linkedPackageLotId = updatedLot.id;
    } else {
      const createdLot = await createPackageLot({
        batchId: sourceBatch.id,
        packageType: inferPackageLotTypeForRequest(request),
        packageFormatCode: inferPackageFormatCodeForRequest(request),
        packageSkuId: request.skuId,
        totalUnits: qty,
        unitOfMeasure: request.uom,
        siteId,
        notes: `Auto-created from fulfillment request ${request.requestId}.`,
      });
      await updatePackageLot({
        lotId: createdLot.id,
        status: 'active',
      });
      linkedPackageLotId = createdLot.id;
    }

    await updateBatchOutput({
      batchId: sourceBatch.id,
      producedQty: sourceBatch.producedQty,
      unit: sourceBatch.unit,
      status: sourceBatch.status,
      fulfillmentRequestIds: [
        ...new Set([...(sourceBatch.fulfillmentRequestIds ?? []), request.requestId]),
      ],
    });
  }

  const nextItems = [...inventoryState.items];
  let inventoryItem = resolveInventoryItemBySkuId(nextItems, skuId, siteId);
  let itemWasCreated = false;
  if (!inventoryItem) {
    itemWasCreated = true;
    inventoryItem = {
      id: randomUUID(),
      skuId,
      sku: skuId,
      siteId,
      name:
        String((request.metadata as any)?.displayName ?? '').trim() || skuId,
      category: request.type === 'packaging' ? 'packaging' : 'other',
      unit: String(request.uom).trim() || 'units',
      onHandQty: 0,
      allocatedQty: 0,
      onOrderQty: 0,
      reorderPointQty: 0,
      createdAt: now,
      updatedAt: now,
    };
    nextItems.unshift(inventoryItem);
  }
  if (String(inventoryItem.unit).trim() !== String(request.uom).trim()) {
    throw new Error(
      `Inventory unit mismatch for SKU ${skuId}: request uses ${request.uom}, item uses ${inventoryItem.unit}.`
    );
  }
  const itemIndex = nextItems.findIndex((entry) => entry.id === inventoryItem!.id);
  if (itemIndex < 0) {
    throw new Error('Failed to resolve inventory item for fulfillment completion.');
  }
  nextItems[itemIndex] = {
    ...nextItems[itemIndex],
    onHandQty: normalizeQty(Number(nextItems[itemIndex].onHandQty) + qty),
    updatedAt: now,
  };
  await writeInventoryState({
    ...inventoryState,
    items: nextItems,
  });

  const movement: InventoryMovementRecord = {
    id: randomUUID(),
    itemId: nextItems[itemIndex].id,
    siteId,
    type: 'produce',
    quantity: qty,
    unit: nextItems[itemIndex].unit,
    reason: `Fulfillment request ${request.requestId} completed (${request.type})`,
    batchId: linkedBatchId,
    createdAt: now,
  };
  await writeInventoryMovements({
    ...movementState,
    movements: [...movementState.movements, movement],
  });

  const summary = {
    inventoryItemId: nextItems[itemIndex].id,
    inventoryItemCreated: itemWasCreated,
    producedQty: qty,
    uom: nextItems[itemIndex].unit,
    batchId: linkedBatchId,
    packageLotId: linkedPackageLotId,
    requestType: request.type,
  };

  return {
    linkedBatchId,
    linkedPackageLotId,
    summary,
    note: `Completed ${request.type} fulfillment: +${qty} ${nextItems[itemIndex].unit} on hand.`,
  };
};

export const applyFulfillmentRequestAction = async (params: {
  requestId: string;
  actionId?: string;
  action: FulfillmentRequestAction;
  actor?: string;
  note?: string;
  linkedBatchId?: string;
  linkedPackageLotId?: string;
}): Promise<FulfillmentRequestRecord | null> => {
  const requestId = String(params.requestId ?? '').trim();
  if (!requestId) return null;
  const state = await readFulfillmentRequestState();
  const index = state.requests.findIndex((entry) => entry.requestId === requestId);
  if (index < 0) return null;
  const current = state.requests[index];
  const normalizedActionId = String(params.actionId ?? '').trim() || undefined;
  if (normalizedActionId) {
    const duplicateEvent = (current.events ?? []).find(
      (event) => String(event.actionId ?? '').trim() === normalizedActionId
    );
    if (duplicateEvent) {
      return current;
    }
  }
  assertFulfillmentActionAllowed(current.status, params.action);

  let resolvedLinkedBatchId: string | undefined;
  let resolvedLinkedPackageLotId: string | undefined;
  if (params.action === 'link_batch') {
    const candidate = String(params.linkedBatchId ?? '').trim();
    if (!candidate) {
      throw new Error('linkedBatchId is required when action=link_batch.');
    }
    const linkedBatch = await getBatchById(candidate);
    if (!linkedBatch) {
      throw new Error('Linked batch not found.');
    }
    if (normalizeSiteId(linkedBatch.siteId) !== normalizeSiteId(current.siteId)) {
      throw new Error('Linked batch site does not match fulfillment request site.');
    }
    resolvedLinkedBatchId = linkedBatch.id;
  }
  if (params.action === 'link_package_lot') {
    const candidate = String(params.linkedPackageLotId ?? '').trim();
    if (!candidate) {
      throw new Error('linkedPackageLotId is required when action=link_package_lot.');
    }
    const linkedPackageLot = await getPackageLotById(candidate);
    if (!linkedPackageLot) {
      throw new Error('Linked package lot not found.');
    }
    if (normalizeSiteId(linkedPackageLot.siteId) !== normalizeSiteId(current.siteId)) {
      throw new Error('Linked package lot site does not match fulfillment request site.');
    }
    resolvedLinkedPackageLotId = linkedPackageLot.id;
    resolvedLinkedBatchId = linkedPackageLot.batchId;
  }
  let completionSummary: Record<string, unknown> | undefined;
  if (params.action === 'complete') {
    const effects = await applyFulfillmentCompletionEffects(current);
    resolvedLinkedBatchId = effects.linkedBatchId ?? resolvedLinkedBatchId;
    resolvedLinkedPackageLotId = effects.linkedPackageLotId ?? resolvedLinkedPackageLotId;
    completionSummary = effects.summary;
  }
  const nextStatus: FulfillmentRequestStatus =
    params.action === 'accept'
      ? 'accepted'
      : params.action === 'start'
        ? 'in_progress'
        : params.action === 'block'
          ? 'blocked'
          : params.action === 'complete'
            ? 'completed'
            : params.action === 'cancel'
              ? 'canceled'
              : params.action === 'reject'
                ? 'rejected'
                : current.status;
  const linkedBatchIds =
    resolvedLinkedBatchId
      ? [...new Set([...(current.linkedBatchIds ?? []), resolvedLinkedBatchId])]
      : [...(current.linkedBatchIds ?? [])];
  const linkedPackageLotIds =
    resolvedLinkedPackageLotId
      ? [
          ...new Set([
            ...(current.linkedPackageLotIds ?? []),
            resolvedLinkedPackageLotId,
          ]),
        ]
      : [...(current.linkedPackageLotIds ?? [])];

  const event: FulfillmentRequestEvent = {
    id: randomUUID(),
    actionId: normalizedActionId,
    action: params.action,
    status: nextStatus,
    actor: params.actor ? String(params.actor).trim() : undefined,
    note:
      params.note !== undefined
        ? String(params.note).trim() || undefined
        : params.action === 'complete'
          ? `Completed ${current.type} fulfillment for ${current.requestedQty} ${current.uom}.`
          : undefined,
    linkedBatchId: resolvedLinkedBatchId,
    linkedPackageLotId: resolvedLinkedPackageLotId,
    timestamp: nowIso(),
  };

  const next: FulfillmentRequestRecord = {
    ...current,
    status: nextStatus,
    linkedBatchIds,
    linkedPackageLotIds,
    updatedAt: nowIso(),
    events: [event, ...(current.events ?? [])].slice(0, 200),
  };

  const requests = [...state.requests];
  requests[index] = next;
  await writeFulfillmentRequestState({
    ...state,
    requests,
  });

  if (resolvedLinkedBatchId) {
    await linkFulfillmentRequestToBatch(requestId, resolvedLinkedBatchId);
  }
  if (resolvedLinkedPackageLotId) {
    await linkFulfillmentRequestToPackageLot(requestId, resolvedLinkedPackageLotId);
  }
  await appendFulfillmentOutboxEvent({
    request: next,
    event,
    payload: {
      orderId: next.orderId,
      lineId: next.lineId,
      requestedQty: next.requestedQty,
      uom: next.uom,
      linkedBatchIds: next.linkedBatchIds,
      linkedPackageLotIds: next.linkedPackageLotIds,
      completionSummary,
      note: event.note,
    },
  });

  return next;
};

export const getBatchLineage = async (batchId: string): Promise<{
  batch: BatchRecord;
  childBatches: BatchRecord[];
  packageLots: PackageLotRecord[];
  reservations: ReservationRecord[];
  reservationActions: ReservationActionRecord[];
  movements: InventoryMovementRecord[];
  fulfillmentRequests: FulfillmentRequestRecord[];
} | null> => {
  const normalizedBatchId = String(batchId ?? '').trim();
  if (!normalizedBatchId) return null;
  const [batchState, lotState, reservationState, reservationActions, movementState, requestState] =
    await Promise.all([
      readBatchState(),
      readPackageLotState(),
      readReservationState(),
      readReservationActionsState(),
      readInventoryMovements(),
      readFulfillmentRequestState(),
    ]);
  const batch = batchState.batches.find((entry) => entry.id === normalizedBatchId);
  if (!batch) return null;
  const childBatches = batchState.batches.filter((entry) => entry.parentBatchId === normalizedBatchId);
  const packageLots = lotState.lots.filter((lot) => lot.batchId === normalizedBatchId);
  const reservations = reservationState.reservations.filter((reservation) =>
    reservation.allocations.some((allocation) => allocation.batchId === normalizedBatchId)
  );
  const reservationIdSet = new Set(reservations.map((reservation) => reservation.reservationId));
  const actions = reservationActions.actions.filter((action) =>
    reservationIdSet.has(action.reservationId)
  );
  const movements = movementState.movements.filter(
    (movement) =>
      movement.batchId === normalizedBatchId ||
      (batch.recipeRunId && movement.recipeRunId === batch.recipeRunId)
  );
  const fulfillmentRequests = requestState.requests.filter((request) =>
    (request.linkedBatchIds ?? []).includes(normalizedBatchId)
  );
  return {
    batch,
    childBatches,
    packageLots,
    reservations,
    reservationActions: actions,
    movements,
    fulfillmentRequests,
  };
};

export const buildInventorySummary = (items: InventoryItemRecord[]) => {
  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => item.onHandQty - item.allocatedQty <= item.reorderPointQty
  ).length;
  const onHandValue = items.reduce(
    (sum, item) => sum + (item.costPerUnit ?? 0) * item.onHandQty,
    0
  );
  const allocatedValue = items.reduce(
    (sum, item) => sum + (item.costPerUnit ?? 0) * item.allocatedQty,
    0
  );
  const onOrderQty = items.reduce((sum, item) => sum + (item.onOrderQty ?? 0), 0);
  return {
    totalItems,
    lowStockItems,
    onHandValue,
    allocatedValue,
    onOrderQty,
    availableValue: Math.max(0, onHandValue - allocatedValue),
  };
};
