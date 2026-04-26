import { createHash } from 'node:crypto';
import { readRecipeRunsState, type RecipeRunRecord } from './commissioning-store.js';
import { listFlowPourEvents } from './flow-store.js';
import {
  readBatchState,
  readInventoryMovements,
  readInventoryState,
  readPackageLotState,
  readReservationActionsState,
  type BatchRecord,
  type InventoryItemRecord,
  type InventoryMovementRecord,
  type PackageLotRecord,
  type ReservationActionRecord,
} from './inventory-batch-store.js';
import {
  readRecipeRunReadingsState,
  type RecipeRunReadingRecord,
} from './recipe-readings-store.js';
import {
  readPackagingRunsState,
  readTransferRunsState,
  type PackagingRunRecord,
  type TransferRunRecord,
} from './process-runs-store.js';

const nowIso = () => new Date().toISOString();

const normalizeSiteId = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase() || 'main';

const normalizeText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const normalizeIso = (value: unknown): string | undefined => {
  const next = normalizeText(value);
  if (!next) return undefined;
  const parsed = new Date(next);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const toFiniteNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const buildDeterministicId = (...parts: Array<string | number | undefined | null>) =>
  parts
    .map((part) => normalizeText(part))
    .filter((part): part is string => Boolean(part))
    .join(':')
    .toLowerCase();

const clampLimit = (value: unknown): number => {
  const next = Number(value);
  if (!Number.isFinite(next)) return 200;
  return Math.max(1, Math.min(1000, Math.floor(next)));
};

const compareEventKey = (
  left: Pick<ComplianceEventRecord, 'occurredAt' | 'id'>,
  right: Pick<ComplianceEventRecord, 'occurredAt' | 'id'>
) => {
  if (left.occurredAt < right.occurredAt) return -1;
  if (left.occurredAt > right.occurredAt) return 1;
  return left.id.localeCompare(right.id);
};

const isAfterCursor = (
  event: Pick<ComplianceEventRecord, 'occurredAt' | 'id'>,
  cursor?: { afterOccurredAt?: string; afterId?: string }
) => {
  if (!cursor?.afterOccurredAt) return true;
  const afterId = cursor.afterId ?? '';
  if (event.occurredAt > cursor.afterOccurredAt) return true;
  if (event.occurredAt < cursor.afterOccurredAt) return false;
  return event.id > afterId;
};

const encodeCursor = (value: { afterOccurredAt: string; afterId: string }) =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const decodeCursor = (
  value: string | undefined
): { afterOccurredAt?: string; afterId?: string } | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as {
      afterOccurredAt?: unknown;
      afterId?: unknown;
    };
    const afterOccurredAt = normalizeIso(parsed.afterOccurredAt);
    const afterId = normalizeText(parsed.afterId);
    if (!afterOccurredAt) return null;
    return {
      afterOccurredAt,
      afterId,
    };
  } catch {
    return null;
  }
};

const regulatoryTagsForMovement = (
  type: InventoryMovementRecord['type'],
  reason?: string
): ComplianceEventRecord['regulatoryTags'] => {
  const normalizedReason = String(reason ?? '').toLowerCase();
  if (type === 'ship') {
    return ['ttb_removal', 'abc_sale'];
  }
  if (type === 'consume' || type === 'produce') {
    return ['ttb_production', 'abc_inventory'];
  }
  if (type === 'adjust' && /(destroy|destruct|dump|discard)/.test(normalizedReason)) {
    return ['ttb_destruction', 'internal_audit'];
  }
  if (type === 'adjust' && /(loss|spill|spillage|waste|evap|shortage|leak)/.test(normalizedReason)) {
    return ['ttb_loss', 'internal_audit'];
  }
  return ['abc_inventory', 'internal_audit'];
};

const classifyMovementEvent = (movement: InventoryMovementRecord): {
  eventType: ComplianceEventType | null;
  direction: QuantityDirection;
  reasonCode?: string;
} => {
  const normalizedReason = String(movement.reason ?? '').toLowerCase();
  switch (movement.type) {
    case 'consume':
      return { eventType: 'inventory_consumed', direction: 'out' };
    case 'produce':
      return { eventType: 'inventory_produced', direction: 'in' };
    case 'ship':
      return { eventType: 'inventory_shipped', direction: 'out' };
    case 'adjust':
      if (/(destroy|destruct|dump|discard)/.test(normalizedReason)) {
        return { eventType: 'destruction_recorded', direction: 'out', reasonCode: 'destruction' };
      }
      if (/(loss|spill|spillage|waste|evap|shortage|leak)/.test(normalizedReason)) {
        return { eventType: 'loss_recorded', direction: 'out', reasonCode: 'loss' };
      }
      return { eventType: 'inventory_adjusted', direction: 'none', reasonCode: 'adjustment' };
    default:
      return { eventType: null, direction: 'none' };
  }
};

const digestEvents = (events: ComplianceEventRecord[]) =>
  createHash('sha256').update(JSON.stringify(events)).digest('hex');

const buildFeedId = (params: {
  siteId: string;
  from: string;
  to: string;
  afterOccurredAt?: string;
  afterId?: string;
  limit: number;
}) =>
  buildDeterministicId(
    'os',
    'compliance-feed',
    params.siteId,
    params.from,
    params.to,
    params.afterOccurredAt ?? 'start',
    params.afterId ?? 'start',
    params.limit
  );

const buildTypeSummary = (events: ComplianceEventRecord[]) => {
  const byType: Record<string, number> = {};
  for (const event of events) {
    byType[event.eventType] = (byType[event.eventType] ?? 0) + 1;
  }
  return byType;
};

const uniqueTags = (tags?: ComplianceEventRecord['regulatoryTags']) =>
  tags && tags.length > 0 ? [...new Set(tags)] : undefined;

const resolveLotForMovement = (params: {
  movement: InventoryMovementRecord;
  item?: InventoryItemRecord;
  lots: PackageLotRecord[];
  packagingRuns: PackagingRunRecord[];
}) => {
  const explicitLotId = normalizeText(params.movement.packageLotId);
  if (explicitLotId) {
    const explicitLot = params.lots.find((lot) => lot.id === explicitLotId);
    if (explicitLot) {
      return explicitLot;
    }
  }
  const batchId = normalizeText(params.movement.batchId);
  if (!batchId) return null;
  const skuId = normalizeText(params.item?.skuId);
  const siteId = normalizeSiteId(params.movement.siteId);
  const occurredAt = Date.parse(params.movement.createdAt);
  const candidates = params.lots.filter((lot) => {
    if (normalizeSiteId(lot.siteId) !== siteId) return false;
    if (lot.batchId !== batchId) return false;
    if (skuId) {
      const lotSku = normalizeText(lot.packageSkuId) ?? normalizeText(lot.skuId);
      if (lotSku && lotSku !== skuId) return false;
    }
    return true;
  });
  if (candidates.length === 0) return null;
  const runByLotId = new Map(
    params.packagingRuns
      .filter((run) => run.packageLotId)
      .map((run) => [String(run.packageLotId), run] as const)
  );
  return [...candidates].sort((left, right) => {
    const leftRun = left.id ? runByLotId.get(left.id) : undefined;
    const rightRun = right.id ? runByLotId.get(right.id) : undefined;
    const leftAnchor =
      Date.parse(leftRun?.completedAt ?? left.updatedAt ?? left.createdAt ?? params.movement.createdAt) ||
      occurredAt;
    const rightAnchor =
      Date.parse(
        rightRun?.completedAt ?? right.updatedAt ?? right.createdAt ?? params.movement.createdAt
      ) || occurredAt;
    return Math.abs(leftAnchor - occurredAt) - Math.abs(rightAnchor - occurredAt);
  })[0];
};

const extractFlowEventIdFromMovement = (movement: InventoryMovementRecord): string | undefined => {
  const reason = normalizeText(movement.reason);
  if (!reason) return undefined;
  const match = /^flow pour ([^ ]+)/i.exec(reason);
  return match?.[1];
};

const resolveRunSite = (run: RecipeRunRecord, batches: BatchRecord[]): string =>
  normalizeSiteId(batches.find((batch) => batch.recipeRunId === run.runId)?.siteId ?? 'main');

const resolveRunBatch = (runId: string | undefined, batches: BatchRecord[]): BatchRecord | undefined => {
  if (!runId) return undefined;
  return batches.find((batch) => batch.recipeRunId === runId);
};

type QuantityDirection = 'in' | 'out' | 'none';
type ComplianceEventType =
  | 'batch_planned'
  | 'batch_started'
  | 'batch_completed'
  | 'batch_released'
  | 'batch_shipped'
  | 'transfer_completed'
  | 'inventory_consumed'
  | 'inventory_produced'
  | 'inventory_adjusted'
  | 'inventory_shipped'
  | 'loss_recorded'
  | 'destruction_recorded'
  | 'reservation_committed'
  | 'reservation_released'
  | 'pour_recorded'
  | 'compliance_note';

type SourceRecordType =
  | 'batch'
  | 'inventory_movement'
  | 'recipe_run'
  | 'recipe_reading'
  | 'reservation'
  | 'reservation_action'
  | 'flow_pour_event'
  | 'transfer_run'
  | 'packaging_run'
  | 'manual';

export interface ComplianceEventRecord {
  schemaVersion: string;
  id: string;
  eventType: ComplianceEventType;
  eventStatus: 'recorded' | 'voided' | 'amended';
  sourceSuite: 'os';
  sourceRecord: {
    recordType: SourceRecordType;
    recordId: string;
    originSuite?: 'os' | 'ops' | 'lab' | 'flow' | 'connect';
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
    direction: QuantityDirection;
  };
  reasonCode?: string;
  reasonMessage?: string;
  regulatoryTags?: Array<
    | 'ttb_production'
    | 'ttb_storage_transfer'
    | 'ttb_removal'
    | 'ttb_loss'
    | 'ttb_destruction'
    | 'abc_inventory'
    | 'abc_transfer'
    | 'abc_sale'
    | 'internal_audit'
  >;
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
  actor?: {
    id?: string;
    name?: string;
    role?: string;
  };
  occurredAt: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ComplianceFeedRecord {
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
  events: ComplianceEventRecord[];
  integrity: {
    digestAlgo: 'sha256';
    digest: string;
  };
}

export interface BuildComplianceFeedParams {
  siteId?: string;
  from?: string;
  to?: string;
  limit?: number;
  afterOccurredAt?: string;
  afterId?: string;
  cursor?: string;
}

const projectBatchEvents = (batch: BatchRecord): ComplianceEventRecord[] => {
  const lotCode = batch.batchCode ?? batch.lotCode;
  const metadata = {
    recipeName: batch.recipeName,
    batchKind: batch.batchKind,
    rootBatchId: batch.rootBatchId,
    parentBatchId: batch.parentBatchId,
    parentBatchCode: batch.parentBatchCode,
    productId: batch.productSnapshot?.productId,
    productCode: batch.productSnapshot?.productCode,
    productName: batch.productSnapshot?.productName,
    beverageClass: batch.productSnapshot?.beverageClass,
    packageLotIds: batch.packageLotIds,
    fulfillmentRequestIds: batch.fulfillmentRequestIds,
  };
  const quantityIn =
    batch.producedQty > 0
      ? {
          value: batch.producedQty,
          uom: batch.unit,
          direction: 'in' as const,
        }
      : undefined;
  const planned: ComplianceEventRecord = {
    schemaVersion: '1.0.0',
    id: buildDeterministicId('os', 'batch', batch.id, 'planned'),
    eventType: 'batch_planned',
    eventStatus: 'recorded',
    sourceSuite: 'os',
    sourceRecord: {
      recordType: 'batch',
      recordId: batch.id,
      openPath: `/os/batches/${batch.id}`,
    },
    siteId: normalizeSiteId(batch.siteId),
    batchId: batch.id,
    lotCode,
    recipeRunId: batch.recipeRunId,
    recipeId: batch.recipeId,
    reasonMessage: `Batch ${lotCode} planned.`,
    regulatoryTags: ['internal_audit'],
    occurredAt: batch.createdAt,
    recordedAt: batch.createdAt,
    metadata,
  };
  const events: ComplianceEventRecord[] = [planned];
  if (batch.status !== 'planned' && batch.status !== 'canceled') {
    events.push({
      schemaVersion: '1.0.0',
      id: buildDeterministicId('os', 'batch', batch.id, 'started'),
      eventType: 'batch_started',
      eventStatus: 'recorded',
      sourceSuite: 'os',
      sourceRecord: {
        recordType: 'batch',
        recordId: batch.id,
        openPath: `/os/batches/${batch.id}`,
      },
      siteId: normalizeSiteId(batch.siteId),
      batchId: batch.id,
      lotCode,
      recipeRunId: batch.recipeRunId,
      recipeId: batch.recipeId,
      reasonMessage: `Batch ${lotCode} started.`,
      regulatoryTags: ['ttb_production', 'abc_inventory'],
      occurredAt: batch.createdAt,
      recordedAt: batch.updatedAt,
      metadata,
    });
  }
  if (batch.status === 'completed' || batch.status === 'released' || batch.status === 'allocated' || batch.status === 'shipped' || batch.completedAt) {
    events.push({
      schemaVersion: '1.0.0',
      id: buildDeterministicId('os', 'batch', batch.id, 'completed'),
      eventType: 'batch_completed',
      eventStatus: 'recorded',
      sourceSuite: 'os',
      sourceRecord: {
        recordType: 'batch',
        recordId: batch.id,
        openPath: `/os/batches/${batch.id}`,
      },
      siteId: normalizeSiteId(batch.siteId),
      batchId: batch.id,
      lotCode,
      recipeRunId: batch.recipeRunId,
      recipeId: batch.recipeId,
      quantity: quantityIn,
      reasonMessage: `Batch ${lotCode} completed.`,
      regulatoryTags: ['ttb_production', 'abc_inventory'],
      occurredAt: batch.completedAt ?? batch.updatedAt,
      recordedAt: batch.updatedAt,
      metadata,
    });
  }
  if (batch.status === 'released' || batch.status === 'allocated' || batch.status === 'shipped' || batch.releasedAt) {
    events.push({
      schemaVersion: '1.0.0',
      id: buildDeterministicId('os', 'batch', batch.id, 'released'),
      eventType: 'batch_released',
      eventStatus: 'recorded',
      sourceSuite: 'os',
      sourceRecord: {
        recordType: 'batch',
        recordId: batch.id,
        openPath: `/os/batches/${batch.id}`,
      },
      siteId: normalizeSiteId(batch.siteId),
      batchId: batch.id,
      lotCode,
      recipeRunId: batch.recipeRunId,
      recipeId: batch.recipeId,
      quantity: quantityIn,
      reasonMessage: `Batch ${lotCode} released for downstream fulfillment.`,
      regulatoryTags: ['abc_inventory', 'internal_audit'],
      occurredAt: batch.releasedAt ?? batch.updatedAt,
      recordedAt: batch.updatedAt,
      metadata,
    });
  }
  if (batch.status === 'shipped') {
    events.push({
      schemaVersion: '1.0.0',
      id: buildDeterministicId('os', 'batch', batch.id, 'shipped'),
      eventType: 'batch_shipped',
      eventStatus: 'recorded',
      sourceSuite: 'os',
      sourceRecord: {
        recordType: 'batch',
        recordId: batch.id,
        openPath: `/os/batches/${batch.id}`,
      },
      siteId: normalizeSiteId(batch.siteId),
      batchId: batch.id,
      lotCode,
      recipeRunId: batch.recipeRunId,
      recipeId: batch.recipeId,
      quantity:
        batch.producedQty > 0
          ? {
              value: batch.producedQty,
              uom: batch.unit,
              direction: 'out',
            }
          : undefined,
      reasonMessage: `Batch ${lotCode} shipped.`,
      regulatoryTags: ['ttb_removal', 'abc_sale'],
      occurredAt: batch.updatedAt,
      recordedAt: batch.updatedAt,
      metadata,
    });
  }
  return events;
};

const projectMovementEvents = (params: {
  movements: InventoryMovementRecord[];
  batches: BatchRecord[];
  inventoryItems: InventoryItemRecord[];
  lots: PackageLotRecord[];
  packagingRuns: PackagingRunRecord[];
  flowEventIds?: Set<string>;
}): ComplianceEventRecord[] => {
  const batchById = new Map(params.batches.map((batch) => [batch.id, batch] as const));
  const itemById = new Map(params.inventoryItems.map((item) => [item.id, item] as const));
  return params.movements.flatMap((movement) => {
    const flowEventId = extractFlowEventIdFromMovement(movement);
    if (flowEventId && params.flowEventIds?.has(flowEventId)) {
      return [];
    }
    const classification = classifyMovementEvent(movement);
    if (!classification.eventType) return [];
    const batch = movement.batchId ? batchById.get(movement.batchId) : undefined;
    const item = itemById.get(movement.itemId);
    const lot = resolveLotForMovement({
      movement,
      item,
      lots: params.lots,
      packagingRuns: params.packagingRuns,
    });
    const productCode = batch?.productSnapshot?.productCode ?? lot?.metadata?.productCode;
    const productName = batch?.productSnapshot?.productName ?? item?.name;
    const packageLotCode = lot?.packageLotCode ?? lot?.lotCode;
    const packageSkuId = normalizeText(lot?.packageSkuId) ?? normalizeText(lot?.skuId);
    return [
      {
        schemaVersion: '1.0.0',
        id: buildDeterministicId('os', 'movement', movement.id),
        eventType: classification.eventType,
        eventStatus: 'recorded',
        sourceSuite: 'os' as const,
        sourceRecord: {
          recordType: 'inventory_movement' as const,
          recordId: movement.id,
          openPath: '/os/inventory',
        },
        siteId: normalizeSiteId(movement.siteId),
        batchId: movement.batchId,
        lotCode: packageLotCode ?? batch?.batchCode ?? batch?.lotCode,
        recipeRunId: movement.recipeRunId,
        recipeId: movement.recipeId,
        skuId: item?.skuId ?? packageSkuId,
        itemId: movement.itemId,
        quantity: {
          value: Math.max(0, movement.quantity),
          uom: movement.unit,
          direction: classification.direction,
        },
        reasonCode: classification.reasonCode,
        reasonMessage: movement.reason,
        regulatoryTags: regulatoryTagsForMovement(movement.type, movement.reason),
        occurredAt: movement.createdAt,
        recordedAt: movement.createdAt,
        metadata: {
          movementType: movement.type,
          reasonCode: movement.reasonCode,
          actor: movement.actor,
          batchCode: batch?.batchCode,
          productCode,
          productName,
          packageLotId: movement.packageLotId ?? lot?.id,
          packageLotCode,
          packageType: lot?.packageType,
          packageFormatCode: lot?.packageFormatCode,
          assetId: movement.assetId ?? lot?.primaryAssetId,
          assetCode: movement.assetCode ?? lot?.primaryAssetCode,
          ...(movement.metadata ?? {}),
        },
      },
    ];
  });
};

const projectRecipeRunEvents = (
  runs: RecipeRunRecord[],
  batches: BatchRecord[]
): ComplianceEventRecord[] =>
  runs
    .filter(
      (run) =>
        run.status === 'running' ||
        run.status === 'completed' ||
        run.status === 'failed' ||
        run.status === 'canceled'
    )
    .map((run) => {
      const batch = resolveRunBatch(run.runId, batches);
      const occurredAt =
        (run.status === 'completed' || run.status === 'failed' || run.status === 'canceled'
          ? run.endedAt
          : run.startedAt) ?? run.startedAt;
      const activeStep = run.steps[run.currentStepIndex];
      return {
        schemaVersion: '1.0.0',
        id: buildDeterministicId('os', 'recipe-run', run.runId, run.status),
        eventType: 'compliance_note' as const,
        eventStatus: 'recorded' as const,
        sourceSuite: 'os' as const,
        sourceRecord: {
          recordType: 'recipe_run' as const,
          recordId: run.runId,
          openPath: '/os/recipe-execution',
        },
        siteId: resolveRunSite(run, batches),
        batchId: batch?.id,
        lotCode: batch?.batchCode ?? batch?.lotCode,
        recipeRunId: run.runId,
        recipeId: run.recipeId,
        reasonCode: `recipe_run_${run.status}`,
        reasonMessage: `Recipe run ${run.recipeName} is ${run.status}.`,
        regulatoryTags: ['internal_audit'],
        occurredAt,
        recordedAt: occurredAt,
        metadata: {
          recipeName: run.recipeName,
          executionMode: run.executionMode,
          currentStepIndex: run.currentStepIndex,
          currentStepId: activeStep?.id,
          currentStepName: activeStep?.name,
          currentStepStatus: activeStep?.status,
        },
      } satisfies ComplianceEventRecord;
    });

const projectReadingEvents = (params: {
  readings: RecipeRunReadingRecord[];
  runs: RecipeRunRecord[];
  batches: BatchRecord[];
}): ComplianceEventRecord[] => {
  const runById = new Map(params.runs.map((run) => [run.runId, run] as const));
  return params.readings.map((reading) => {
    const run = runById.get(reading.runId);
    const batch = resolveRunBatch(reading.runId, params.batches);
    return {
      schemaVersion: '1.0.0',
      id: buildDeterministicId('os', 'reading', reading.id),
      eventType: 'compliance_note' as const,
      eventStatus: 'recorded' as const,
      sourceSuite: 'os' as const,
      sourceRecord: {
        recordType: 'recipe_reading' as const,
        recordId: reading.id,
        openPath: '/os/runboard',
      },
      siteId: normalizeSiteId(batch?.siteId ?? 'main'),
      batchId: batch?.id,
      lotCode: batch?.batchCode ?? batch?.lotCode,
      recipeRunId: reading.runId,
      recipeId: run?.recipeId,
      reasonCode: reading.kind ? `reading_${reading.kind}` : 'reading',
      reasonMessage: reading.note ?? `Recorded ${reading.kind ?? 'process'} reading.`,
      regulatoryTags: ['ttb_production', 'internal_audit'],
      measurements: {
        temperatureC: toFiniteNumber(reading.temperatureC),
        sg: reading.kind === 'fg' ? undefined : toFiniteNumber(reading.sg),
        fg: reading.kind === 'fg' ? toFiniteNumber(reading.sg) : undefined,
        abvPct: toFiniteNumber(reading.abvPct),
        ph: toFiniteNumber(reading.ph),
        brix: toFiniteNumber(reading.brix),
        titratableAcidityGpl: toFiniteNumber(reading.titratableAcidityGpl),
        so2Ppm: toFiniteNumber(reading.so2Ppm),
      },
      occurredAt: reading.recordedAt,
      recordedAt: reading.createdAt,
      metadata: {
        readingKind: reading.kind,
        stepId: reading.stepId,
        source: reading.source,
      },
    } satisfies ComplianceEventRecord;
  });
};

const projectReservationActionEvents = (
  actions: ReservationActionRecord[]
): ComplianceEventRecord[] =>
  actions.map((action) => ({
    schemaVersion: '1.0.0',
    id: buildDeterministicId('os', 'reservation-action', action.actionId),
    eventType:
      action.action === 'commit'
        ? ('reservation_committed' as const)
        : ('reservation_released' as const),
    eventStatus: 'recorded' as const,
    sourceSuite: 'os' as const,
    sourceRecord: {
      recordType: 'reservation_action' as const,
      recordId: action.actionId,
      openPath: '/os/requests',
    },
    siteId: normalizeSiteId(action.result.availabilitySnapshot.siteId),
    reservationId: action.reservationId,
    orderId: action.orderId,
    lineId: action.lineId,
    skuId: action.result.availabilitySnapshot.skuId,
    quantity: {
      value: Math.max(0, action.result.allocatedQty),
      uom: action.result.availabilitySnapshot.uom,
      direction: 'none' as const,
    },
    reasonCode:
      action.action === 'expire'
        ? 'reservation_timeout'
        : action.reasonCode,
    reasonMessage: action.reasonMessage,
    regulatoryTags: ['internal_audit'],
    occurredAt: action.occurredAt,
    recordedAt: action.createdAt,
    metadata: {
      action: action.action,
      reservationStatus: action.result.status,
      shortQty: action.result.shortQty,
      lotBreakdown: action.result.availabilitySnapshot.lotBreakdown,
    },
  } satisfies ComplianceEventRecord));

const projectTransferRunEvents = (runs: TransferRunRecord[], batches: BatchRecord[]) => {
  const batchById = new Map(batches.map((batch) => [batch.id, batch] as const));
  return runs.flatMap((run) => {
    if (run.status !== 'completed' || !run.completedAt) return [];
    const batch = batchById.get(run.sourceBatchId);
    const transferredQty = run.destinations.reduce((sum, destination) => sum + destination.actualQty, 0);
    const metadata = {
      sourceBatchCode: batch?.batchCode,
      sourceRecipeName: run.sourceRecipeName,
      mode: run.mode,
      destinations: run.destinations.map((destination) => ({
        id: destination.id,
        label: destination.label,
        kind: destination.kind,
        plannedQty: destination.plannedQty,
        actualQty: destination.actualQty,
        branchCode: destination.branchCode,
        treatmentType: destination.treatmentType,
        childBatchId: destination.childBatchId,
        childBatchCode: destination.childBatchCode,
        derivedProductCode: destination.derivedProductCode,
      })),
    };
    const events: ComplianceEventRecord[] = [
      {
        schemaVersion: '1.0.0',
        id: buildDeterministicId('os', 'transfer-run', run.id, 'completed'),
        eventType: 'transfer_completed',
        eventStatus: 'recorded',
        sourceSuite: 'os',
        sourceRecord: {
          recordType: 'transfer_run',
          recordId: run.id,
          openPath: '/os/transfers',
        },
        siteId: normalizeSiteId(run.siteId),
        batchId: run.sourceBatchId,
        lotCode: batch?.batchCode ?? run.sourceLotCode,
        quantity:
          transferredQty > 0
            ? {
                value: transferredQty,
                uom: run.sourceUnit,
                direction: 'none',
              }
            : undefined,
        reasonCode: 'transfer_completed',
        reasonMessage: run.notes ?? `Transfer run ${run.id} completed.`,
        regulatoryTags: ['ttb_storage_transfer', 'abc_transfer'],
        occurredAt: run.completedAt,
        recordedAt: run.updatedAt,
        metadata,
      },
    ];
    if (run.lossQty > 0) {
      events.push({
        schemaVersion: '1.0.0',
        id: buildDeterministicId('os', 'transfer-run', run.id, 'loss'),
        eventType: 'loss_recorded',
        eventStatus: 'recorded',
        sourceSuite: 'os',
        sourceRecord: {
          recordType: 'transfer_run',
          recordId: run.id,
          openPath: '/os/transfers',
        },
        siteId: normalizeSiteId(run.siteId),
        batchId: run.sourceBatchId,
        lotCode: batch?.batchCode ?? run.sourceLotCode,
        quantity: {
          value: run.lossQty,
          uom: run.sourceUnit,
          direction: 'out',
        },
        reasonCode: 'transfer_loss',
        reasonMessage: run.notes ?? `Transfer run ${run.id} recorded loss.`,
        regulatoryTags: ['ttb_loss', 'internal_audit'],
        occurredAt: run.completedAt,
        recordedAt: run.updatedAt,
        metadata,
      });
    }
    return events;
  });
};

const projectPackagingRunEvents = (runs: PackagingRunRecord[], batches: BatchRecord[]) => {
  const batchById = new Map(batches.map((batch) => [batch.id, batch] as const));
  return runs.flatMap((run) => {
    if (run.status !== 'completed' || !run.completedAt) return [];
    const batch = batchById.get(run.sourceBatchId);
    const metadata = {
      sourceBatchCode: batch?.batchCode,
      sourceRecipeName: run.sourceRecipeName,
      packageType: run.packageType,
      packageFormatCode: run.packageFormatCode,
      packageLotId: run.packageLotId,
      packageLotCode: run.packageLotCode,
      outputSkuId: run.outputSkuId,
      sourceQtyUsed: run.sourceQtyUsed,
      rejectedUnits: run.rejectedUnits,
      complianceSnapshot: run.complianceSnapshot,
    };
    const events: ComplianceEventRecord[] = [
      {
        schemaVersion: '1.0.0',
        id: buildDeterministicId('os', 'packaging-run', run.id, 'completed'),
        eventType: 'compliance_note',
        eventStatus: 'recorded',
        sourceSuite: 'os',
        sourceRecord: {
          recordType: 'packaging_run',
          recordId: run.id,
          openPath: '/os/packaging',
        },
        siteId: normalizeSiteId(run.siteId),
        batchId: run.sourceBatchId,
        lotCode: run.packageLotCode ?? batch?.batchCode ?? run.sourceLotCode,
        skuId: run.outputSkuId,
        reasonCode: 'packaging_completed',
        reasonMessage: `Packaging run ${run.id} completed.`,
        regulatoryTags: ['abc_inventory', 'internal_audit'],
        occurredAt: run.completedAt,
        recordedAt: run.updatedAt,
        metadata,
      },
    ];
    if (run.lossQty > 0) {
      events.push({
        schemaVersion: '1.0.0',
        id: buildDeterministicId('os', 'packaging-run', run.id, 'loss'),
        eventType: 'loss_recorded',
        eventStatus: 'recorded',
        sourceSuite: 'os',
        sourceRecord: {
          recordType: 'packaging_run',
          recordId: run.id,
          openPath: '/os/packaging',
        },
        siteId: normalizeSiteId(run.siteId),
        batchId: run.sourceBatchId,
        lotCode: run.packageLotCode ?? batch?.batchCode ?? run.sourceLotCode,
        skuId: run.outputSkuId,
        quantity: {
          value: run.lossQty,
          uom: run.sourceUnit,
          direction: 'out',
        },
        reasonCode: 'packaging_loss',
        reasonMessage: `Packaging run ${run.id} recorded loss.`,
        regulatoryTags: ['ttb_loss', 'internal_audit'],
        occurredAt: run.completedAt,
        recordedAt: run.updatedAt,
        metadata,
      });
    }
    return events;
  });
};

const projectPackageLotEvents = (lots: PackageLotRecord[]): ComplianceEventRecord[] =>
  lots.flatMap((lot) =>
    (lot.events ?? []).flatMap((event) => {
      if (event.action === 'ship' || event.action === 'return' || event.action === 'destroy' || event.action === 'rework' || event.action === 'adjust') {
        return [];
      }
      return [
        {
          schemaVersion: '1.0.0',
          id: buildDeterministicId('os', 'package-lot-event', lot.id, event.id),
          eventType: 'compliance_note' as const,
          eventStatus: 'recorded' as const,
          sourceSuite: 'os' as const,
          sourceRecord: {
            recordType: 'manual' as const,
            recordId: lot.id,
            openPath: '/os/packaged-products',
          },
          siteId: normalizeSiteId(lot.siteId),
          batchId: lot.batchId,
          lotCode: lot.packageLotCode ?? lot.lotCode,
          skuId: normalizeText(lot.packageSkuId) ?? normalizeText(lot.skuId),
          quantity:
            event.quantity && event.quantity > 0
              ? {
                  value: event.quantity,
                  uom: event.unit ?? lot.unitOfMeasure ?? 'units',
                  direction: 'none',
                }
              : undefined,
          reasonCode: event.reasonCode ?? event.action,
          reasonMessage:
            event.note ??
            (event.action === 'release_status'
              ? `Package lot release status set to ${event.releaseStatus ?? lot.releaseStatus ?? 'held'}.`
              : event.action === 'assign_asset'
                ? `Assigned asset ${event.assetCode ?? lot.primaryAssetCode ?? '--'} to package lot.`
                : event.action === 'empty_return'
                  ? 'Logged empty return for package lot.'
                  : 'Package lot note recorded.'),
          regulatoryTags: ['internal_audit'],
          occurredAt: event.timestamp,
          recordedAt: event.timestamp,
          metadata: {
            action: event.action,
            actor: event.actor,
            packageLotId: lot.id,
            packageLotCode: lot.packageLotCode ?? lot.lotCode,
            releaseStatus: event.releaseStatus ?? lot.releaseStatus,
            assetCode: event.assetCode ?? lot.primaryAssetCode,
            ...(event.metadata ?? {}),
          },
        } satisfies ComplianceEventRecord,
      ];
    })
  );

const projectPourEvents = (
  records: Awaited<ReturnType<typeof listFlowPourEvents>>
): ComplianceEventRecord[] =>
  records
    .filter((record) => record.result.status !== 'rejected')
    .map((record) => ({
      schemaVersion: '1.0.0',
      id: buildDeterministicId('os', 'flow-pour', record.event.eventId),
      eventType: 'pour_recorded' as const,
      eventStatus: 'recorded' as const,
      sourceSuite: 'os' as const,
      sourceRecord: {
        recordType: 'flow_pour_event' as const,
        recordId: record.event.eventId,
        originSuite: 'flow' as const,
        openPath: '/flow',
      },
      siteId: normalizeSiteId(record.event.siteId),
      batchId: record.result.batchId ?? record.event.batchId,
      lotCode: record.event.packageLotCode,
      skuId: record.event.skuId,
      quantity: {
        value: Math.max(0, record.event.volume),
        uom: record.event.uom,
        direction: 'out' as const,
      },
      reasonCode: record.event.sourceMode,
      reasonMessage: `FLOW pour recorded on ${record.event.tapId}.`,
      regulatoryTags: ['ttb_removal', 'abc_sale'],
      occurredAt: record.event.occurredAt,
      recordedAt: record.result.processedAt,
      metadata: {
        tapId: record.event.tapId,
        tapAssignmentId: record.event.tapAssignmentId ?? record.event.assignmentId,
        assetId: record.event.assetId ?? record.event.kegAssetId,
        assetCode: record.event.assetCode,
        packageLotId: record.event.packageLotId,
        packageLotCode: record.event.packageLotCode,
        productId: record.event.productId,
        productCode: record.event.productCode,
        labelVersionId: record.event.labelVersionId,
        sourceMode: record.event.sourceMode,
        sessionId: record.event.sessionId,
        actorId: record.event.actorId,
        inventoryItemId: record.result.inventoryItemId,
      },
    } satisfies ComplianceEventRecord));

const dedupeEvents = (events: ComplianceEventRecord[]) => {
  const byId = new Map<string, ComplianceEventRecord>();
  for (const event of events) {
    byId.set(event.id, {
      ...event,
      regulatoryTags: uniqueTags(event.regulatoryTags),
    });
  }
  return [...byId.values()].sort(compareEventKey);
};

const sanitizeMeasurements = (event: ComplianceEventRecord): ComplianceEventRecord => {
  if (!event.measurements) return event;
  const next = Object.fromEntries(
    Object.entries(event.measurements).filter(([, value]) => Number.isFinite(value as number))
  );
  return {
    ...event,
    measurements: Object.keys(next).length > 0 ? next : undefined,
  };
};

export const listComplianceEvents = async (siteId?: string): Promise<ComplianceEventRecord[]> => {
  const normalizedSiteId = normalizeSiteId(siteId);
  const [
    batchState,
    movementState,
    inventoryState,
    packageLotState,
    reservationActionsState,
    recipeRunsState,
    recipeReadingsState,
    transferRunsState,
    packagingRunsState,
  ] = await Promise.all([
    readBatchState(),
    readInventoryMovements(),
    readInventoryState(),
    readPackageLotState(),
    readReservationActionsState(),
    readRecipeRunsState(),
    readRecipeRunReadingsState(),
    readTransferRunsState(),
    readPackagingRunsState(),
  ]);

  const siteBatches = batchState.batches.filter(
    (batch) => normalizeSiteId(batch.siteId) === normalizedSiteId
  );
  const siteMovements = movementState.movements.filter(
    (movement) => normalizeSiteId(movement.siteId) === normalizedSiteId
  );
  const siteInventoryItems = inventoryState.items.filter(
    (item) => normalizeSiteId(item.siteId) === normalizedSiteId
  );
  const siteLots = packageLotState.lots.filter(
    (lot) => normalizeSiteId(lot.siteId) === normalizedSiteId
  );
  const siteReservationActions = reservationActionsState.actions.filter(
    (action) => normalizeSiteId(action.result.availabilitySnapshot.siteId) === normalizedSiteId
  );
  const siteRecipeRuns = recipeRunsState.runs.filter(
    (run) => resolveRunSite(run, batchState.batches) === normalizedSiteId
  );
  const siteRecipeRunIds = new Set(siteRecipeRuns.map((run) => run.runId));
  const siteReadings = recipeReadingsState.readings.filter((reading) =>
    siteRecipeRunIds.has(reading.runId)
  );
  const siteTransferRuns = transferRunsState.runs.filter(
    (run) => normalizeSiteId(run.siteId) === normalizedSiteId
  );
  const sitePackagingRuns = packagingRunsState.runs.filter(
    (run) => normalizeSiteId(run.siteId) === normalizedSiteId
  );
  const flowRecords = await listFlowPourEvents({ siteId: normalizedSiteId, limit: Number.MAX_SAFE_INTEGER });
  const flowEventIds = new Set(flowRecords.map((record) => record.event.eventId));
  const flowEvents = projectPourEvents(flowRecords);

  return dedupeEvents([
    ...siteBatches.flatMap((batch) => projectBatchEvents(batch)),
    ...projectMovementEvents({
      movements: siteMovements,
      batches: siteBatches,
      inventoryItems: siteInventoryItems,
      lots: siteLots,
      packagingRuns: sitePackagingRuns,
      flowEventIds,
    }),
    ...projectRecipeRunEvents(siteRecipeRuns, siteBatches),
    ...projectReadingEvents({
      readings: siteReadings,
      runs: siteRecipeRuns,
      batches: siteBatches,
    }),
    ...projectReservationActionEvents(siteReservationActions),
    ...projectTransferRunEvents(siteTransferRuns, siteBatches),
    ...projectPackagingRunEvents(sitePackagingRuns, siteBatches),
    ...projectPackageLotEvents(siteLots),
    ...flowEvents,
  ]).map(sanitizeMeasurements);
};

export const buildComplianceFeed = async (
  params: BuildComplianceFeedParams = {}
): Promise<ComplianceFeedRecord> => {
  const generatedAt = nowIso();
  const siteId = normalizeSiteId(params.siteId);
  const limit = clampLimit(params.limit);
  const requestedFrom = normalizeIso(params.from);
  const requestedTo = normalizeIso(params.to);
  if (params.from && !requestedFrom) {
    throw new Error('Invalid from parameter. Expected ISO date-time.');
  }
  if (params.to && !requestedTo) {
    throw new Error('Invalid to parameter. Expected ISO date-time.');
  }
  if (requestedFrom && requestedTo && requestedFrom > requestedTo) {
    throw new Error('from must be earlier than or equal to to.');
  }

  const cursorFromToken = decodeCursor(params.cursor);
  if (params.cursor && !cursorFromToken) {
    throw new Error('Invalid cursor token.');
  }
  const afterOccurredAt = normalizeIso(params.afterOccurredAt) ?? cursorFromToken?.afterOccurredAt;
  const afterId = normalizeText(params.afterId) ?? cursorFromToken?.afterId;

  const allEvents = await listComplianceEvents(siteId);
  const rangeFrom = requestedFrom ?? allEvents[0]?.occurredAt ?? generatedAt;
  const rangeTo = requestedTo ?? allEvents[allEvents.length - 1]?.occurredAt ?? generatedAt;
  const rangedEvents = allEvents.filter(
    (event) => event.occurredAt >= rangeFrom && event.occurredAt <= rangeTo
  );
  const pagedSource = rangedEvents.filter((event) =>
    isAfterCursor(event, {
      afterOccurredAt,
      afterId,
    })
  );
  const events = pagedSource.slice(0, limit);
  const hasMore = pagedSource.length > limit;
  const lastEvent = events.length > 0 ? events[events.length - 1] : undefined;
  const cursor =
    events.length > 0
      ? {
          sort: 'occurredAt_asc__id_asc' as const,
          afterOccurredAt: lastEvent?.occurredAt,
          afterId: lastEvent?.id,
          nextAfter:
            hasMore && lastEvent
              ? encodeCursor({ afterOccurredAt: lastEvent.occurredAt, afterId: lastEvent.id })
              : undefined,
          lastEventId: lastEvent?.id,
          hasMore,
        }
      : {
          sort: 'occurredAt_asc__id_asc' as const,
          hasMore,
        };

  return {
    schemaVersion: '1.0.0',
    id: buildFeedId({
      siteId,
      from: rangeFrom,
      to: rangeTo,
      afterOccurredAt,
      afterId,
      limit,
    }),
    sourceSuite: 'os',
    siteId,
    generatedAt,
    range: {
      from: rangeFrom,
      to: rangeTo,
    },
    cursor,
    summary: {
      totalEvents: events.length,
      byType: buildTypeSummary(events),
    },
    events,
    integrity: {
      digestAlgo: 'sha256',
      digest: digestEvents(events),
    },
  };
};
