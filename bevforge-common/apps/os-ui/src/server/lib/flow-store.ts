import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { CanvasNode } from '../../features/canvas/types.js';
import { commissioningPaths, ensureCommissioningStore, readCanvasProject } from './commissioning-store.js';
import {
  readBatchState,
  readInventoryMovements,
  readInventoryState,
  updateBatchOutput,
  writeInventoryMovements,
  writeInventoryState,
  type BatchState,
  type InventoryMovementRecord,
} from './inventory-batch-store.js';

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

const normalizeSiteId = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase() || 'main';

const normalizeSkuId = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .toUpperCase();

const flowProfilesFile = path.join(commissioningPaths.root, 'flow-profiles.json');
const flowPourEventsFile = path.join(commissioningPaths.root, 'flow-pour-events.json');
const flowRuntimeStateFile = path.join(commissioningPaths.root, 'flow-runtime-state.json');

export interface FlowTapMappingInput {
  nodeId?: string;
  tapId?: string;
  tapAssignmentId?: string;
  label?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  labelVersionId?: string;
  imageAssetId?: string;
  imageUrl?: string;
  pourSizesOz?: number[];
  temperatureTargetC?: number;
  temperatureMinC?: number;
  temperatureMaxC?: number;
  co2TargetPsi?: number;
  co2MinPsi?: number;
  co2MaxPsi?: number;
  enabled?: boolean;
}

export interface FlowTapProfile {
  tapId: string;
  tapAssignmentId: string;
  label: string;
  nodeId?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  labelVersionId?: string;
  imageAssetId?: string;
  imageUrl?: string;
  pourSizesOz: number[];
  temperatureTargetC?: number;
  temperatureMinC?: number;
  temperatureMaxC?: number;
  co2TargetPsi?: number;
  co2MinPsi?: number;
  co2MaxPsi?: number;
  enabled: boolean;
}

interface FlowControllerSummary {
  nodeId: string;
  label: string;
  type: 'temperature' | 'co2';
  sourceSensorDeviceId?: string;
  outputDeviceIds?: string[];
  threshold?: number;
  hysteresis?: number;
  pollMs?: number;
}

export interface FlowProfileRecord {
  schemaVersion: string;
  id: string;
  siteId: string;
  kioskId?: string;
  profileName: string;
  publishedAt: string;
  source: {
    projectId: string;
    projectName: string;
    pageId: string;
    pageName: string;
    pageMode: 'draft' | 'published';
    pageUpdatedAt: string;
  };
  profile: {
    taps: FlowTapProfile[];
    controllers: FlowControllerSummary[];
    menuItems: Array<{
      id: string;
      tapAssignmentId: string;
      tapId: string;
      label: string;
      productId?: string;
      productCode?: string;
      skuId?: string;
      batchId?: string;
      packageLotId?: string;
      packageLotCode?: string;
      assetId?: string;
      assetCode?: string;
      labelVersionId?: string;
      imageAssetId?: string;
      imageUrl?: string;
      status: 'on_tap' | 'coming_soon';
    }>;
    graph: {
      nodes: unknown[];
      edges: unknown[];
      viewport?: unknown;
    };
  };
}

interface FlowProfilesState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  profiles: FlowProfileRecord[];
}

export interface FlowPourEventInput {
  schemaVersion?: string;
  eventId: string;
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  assignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  labelVersionId?: string;
  volume: number;
  uom: string;
  durationMs?: number;
  sourceMode: 'bartender' | 'self_serve' | 'test' | 'maintenance';
  sessionId?: string;
  actorId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface FlowPourEventResult {
  eventId: string;
  status: 'accepted' | 'accepted_with_shortage' | 'rejected';
  reasonCode?: 'validation_error' | 'unknown_sku' | 'invalid_uom' | 'site_unavailable';
  reasonMessage?: string;
  consumedQty?: number;
  consumedUom?: string;
  shortfallQty?: number;
  inventoryItemId?: string;
  batchId?: string;
  processedAt: string;
  idempotentReplay?: boolean;
}

interface FlowPourEventRecord {
  event: FlowPourEventInput;
  result: FlowPourEventResult;
}

interface FlowPourEventsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  records: FlowPourEventRecord[];
}

export interface FlowRuntimeTapState {
  tapId: string;
  state?: 'ready' | 'pouring' | 'blocked' | 'offline';
  lineTempC?: number;
  co2Psi?: number;
  flowRateOzPerMin?: number;
  remainingQty?: number;
  remainingUom?: string;
}

export interface FlowRuntimeSnapshot {
  schemaVersion?: string;
  id?: string;
  siteId: string;
  kioskId?: string;
  status?: 'online' | 'offline' | 'degraded';
  taps?: FlowRuntimeTapState[];
  reportedAt?: string;
  metadata?: Record<string, unknown>;
}

interface FlowRuntimeState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  snapshots: Array<FlowRuntimeSnapshot & { id: string; schemaVersion: string; reportedAt: string }>;
}

const defaultProfilesState = (): FlowProfilesState => ({
  schemaVersion: '1.0.0',
  id: 'flow-profiles',
  updatedAt: nowIso(),
  profiles: [],
});

const defaultPourEventsState = (): FlowPourEventsState => ({
  schemaVersion: '1.0.0',
  id: 'flow-pour-events',
  updatedAt: nowIso(),
  records: [],
});

const defaultRuntimeState = (): FlowRuntimeState => ({
  schemaVersion: '1.0.0',
  id: 'flow-runtime-state',
  updatedAt: nowIso(),
  snapshots: [],
});

const readFlowProfilesState = async (): Promise<FlowProfilesState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<FlowProfilesState>(flowProfilesFile, defaultProfilesState());
};

const writeFlowProfilesState = async (state: FlowProfilesState): Promise<FlowProfilesState> => {
  await ensureCommissioningStore();
  const next: FlowProfilesState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'flow-profiles',
    updatedAt: nowIso(),
    profiles: [...(state.profiles ?? [])].slice(0, 500),
  };
  await writeJson(flowProfilesFile, next);
  return next;
};

const readFlowPourEventsState = async (): Promise<FlowPourEventsState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<FlowPourEventsState>(flowPourEventsFile, defaultPourEventsState());
};

const writeFlowPourEventsState = async (
  state: FlowPourEventsState
): Promise<FlowPourEventsState> => {
  await ensureCommissioningStore();
  const next: FlowPourEventsState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'flow-pour-events',
    updatedAt: nowIso(),
    records: [...(state.records ?? [])].slice(0, 20000),
  };
  await writeJson(flowPourEventsFile, next);
  return next;
};

const readFlowRuntimeStateStore = async (): Promise<FlowRuntimeState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<FlowRuntimeState>(flowRuntimeStateFile, defaultRuntimeState());
};

const writeFlowRuntimeStateStore = async (state: FlowRuntimeState): Promise<FlowRuntimeState> => {
  await ensureCommissioningStore();
  const next: FlowRuntimeState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '1.0.0',
    id: state.id ?? 'flow-runtime-state',
    updatedAt: nowIso(),
    snapshots: [...(state.snapshots ?? [])].slice(0, 5000),
  };
  await writeJson(flowRuntimeStateFile, next);
  return next;
};

const buildTapProfiles = (params: {
  nodes: CanvasNode[];
  tapMap?: FlowTapMappingInput[];
}): FlowTapProfile[] => {
  const nodeById = new Map(params.nodes.map((node) => [node.id, node] as const));
  const defaultPourSizes = [6, 8, 12, 16];

  if ((params.tapMap ?? []).length > 0) {
    return (params.tapMap ?? []).map((mapping, index) => {
      const node = mapping.nodeId ? nodeById.get(mapping.nodeId) : undefined;
      const labelFromNode = node?.data?.label ? String(node.data.label) : undefined;
      const tapId = mapping.tapId?.trim() || `tap-${index + 1}`;
      return {
        tapId,
        tapAssignmentId: mapping.tapAssignmentId?.trim() || `tap-assignment-${tapId}`,
        nodeId: node?.id,
        label: mapping.label?.trim() || labelFromNode || tapId.toUpperCase(),
        productId: mapping.productId?.trim() || undefined,
        productCode: mapping.productCode?.trim() || undefined,
        skuId: mapping.skuId ? normalizeSkuId(mapping.skuId) : undefined,
        batchId: mapping.batchId?.trim() || undefined,
        packageLotId: mapping.packageLotId?.trim() || undefined,
        packageLotCode: mapping.packageLotCode?.trim() || undefined,
        assetId: mapping.assetId?.trim() || undefined,
        assetCode: mapping.assetCode?.trim() || undefined,
        labelVersionId: mapping.labelVersionId?.trim() || undefined,
        imageAssetId: mapping.imageAssetId?.trim() || undefined,
        imageUrl: mapping.imageUrl?.trim() || undefined,
        pourSizesOz:
          (mapping.pourSizesOz ?? []).filter((value) => Number.isFinite(value) && value > 0)
            .length > 0
            ? (mapping.pourSizesOz ?? []).filter(
                (value) => Number.isFinite(value) && value > 0
              ) as number[]
            : defaultPourSizes,
        temperatureTargetC: mapping.temperatureTargetC,
        temperatureMinC: mapping.temperatureMinC,
        temperatureMaxC: mapping.temperatureMaxC,
        co2TargetPsi: mapping.co2TargetPsi,
        co2MinPsi: mapping.co2MinPsi,
        co2MaxPsi: mapping.co2MaxPsi,
        enabled: mapping.enabled !== false,
      };
    });
  }

  const inferredTapNodes = params.nodes.filter((node) => {
    const label = String(node.data?.label ?? '').toLowerCase();
    return (
      label.includes('tap') ||
      label.includes('faucet') ||
      (node.data?.widgetType === 'button' && label.includes('pour'))
    );
  });

  return inferredTapNodes.map((node, index) => ({
    tapId: `tap-${index + 1}`,
    tapAssignmentId: `tap-assignment-tap-${index + 1}`,
    nodeId: node.id,
    label: String(node.data?.label ?? `Tap ${index + 1}`),
    pourSizesOz: defaultPourSizes,
    enabled: true,
  }));
};

const buildControllerSummary = (nodes: CanvasNode[]): FlowControllerSummary[] => {
  const out: FlowControllerSummary[] = [];
  for (const node of nodes) {
    const widgetType = node.data?.widgetType;
    if (widgetType === 'co2_controller') {
      const co2 = node.data.config.co2Controller as
        | {
            sourceSensorDeviceId?: string;
            inletValveDeviceId?: string;
            ventValveDeviceId?: string;
            threshold?: number;
            hysteresis?: number;
            pollMs?: number;
          }
        | undefined;
      out.push({
        nodeId: node.id,
        label: node.data.label,
        type: 'co2',
        sourceSensorDeviceId: co2?.sourceSensorDeviceId,
        outputDeviceIds: [co2?.inletValveDeviceId, co2?.ventValveDeviceId].filter(
          (value): value is string => Boolean(value)
        ),
        threshold: co2?.threshold,
        hysteresis: co2?.hysteresis,
        pollMs: co2?.pollMs,
      });
    }
    if (widgetType === 'glycol_controller' || widgetType === 'hlt_controller') {
      const glycol = node.data.config.glycolController;
      const hlt = node.data.config.hltController;
      const sourceSensorDeviceId = glycol?.sourceSensorDeviceId ?? hlt?.sourceSensorDeviceId;
      const threshold = glycol?.threshold ?? hlt?.threshold;
      const hysteresis = glycol?.hysteresis ?? hlt?.hysteresis;
      const pollMs = glycol?.pollMs ?? hlt?.pollMs;
      const outputDeviceIds =
        widgetType === 'glycol_controller'
          ? [glycol?.pumpDeviceId, glycol?.valveDeviceId, glycol?.chillerDeviceId]
          : [hlt?.heaterDeviceId, hlt?.recircPumpDeviceId];
      out.push({
        nodeId: node.id,
        label: node.data.label,
        type: 'temperature',
        sourceSensorDeviceId,
        outputDeviceIds: outputDeviceIds.filter((value): value is string => Boolean(value)),
        threshold,
        hysteresis,
        pollMs,
      });
    }
  }
  return out;
};

export const publishFlowProfile = async (params: {
  siteId: string;
  kioskId?: string;
  pageId?: string;
  profileName?: string;
  tapMap?: FlowTapMappingInput[];
}): Promise<FlowProfileRecord> => {
  const siteId = normalizeSiteId(params.siteId);
  const kioskId = params.kioskId?.trim() || undefined;
  const project = await readCanvasProject();
  const page =
    (params.pageId ? project.pages.find((entry) => entry.id === params.pageId) : undefined) ??
    project.pages.find((entry) => entry.mode === 'published') ??
    project.pages[0];

  if (!page) {
    throw new Error('No canvas page found to export for FLOW.');
  }

  const taps = buildTapProfiles({
    nodes: page.nodes,
    tapMap: params.tapMap,
  });
  const controllers = buildControllerSummary(page.nodes);
  const menuItems = taps.map((tap) => ({
    id: `menu-${tap.tapId}`,
    tapAssignmentId: tap.tapAssignmentId,
    tapId: tap.tapId,
    label: tap.label,
    productId: tap.productId,
    productCode: tap.productCode,
    skuId: tap.skuId,
    batchId: tap.batchId,
    packageLotId: tap.packageLotId,
    packageLotCode: tap.packageLotCode,
    assetId: tap.assetId,
    assetCode: tap.assetCode,
    labelVersionId: tap.labelVersionId,
    imageAssetId: tap.imageAssetId,
    imageUrl: tap.imageUrl,
    status: tap.skuId ? ('on_tap' as const) : ('coming_soon' as const),
  }));

  const profile: FlowProfileRecord = {
    schemaVersion: '1.0.0',
    id: randomUUID(),
    siteId,
    kioskId,
    profileName: params.profileName?.trim() || `${page.name} (${siteId})`,
    publishedAt: nowIso(),
    source: {
      projectId: project.id,
      projectName: project.name,
      pageId: page.id,
      pageName: page.name,
      pageMode: page.mode,
      pageUpdatedAt: page.updatedAt,
    },
    profile: {
      taps,
      controllers,
      menuItems,
      graph: {
        nodes: page.nodes,
        edges: page.edges,
        viewport: page.viewport,
      },
    },
  };

  const state = await readFlowProfilesState();
  await writeFlowProfilesState({
    ...state,
    profiles: [profile, ...(state.profiles ?? [])],
  });
  return profile;
};

export const listFlowProfiles = async (params?: {
  siteId?: string;
  kioskId?: string;
  limit?: number;
}): Promise<FlowProfileRecord[]> => {
  const state = await readFlowProfilesState();
  const filtered = (state.profiles ?? []).filter((profile) => {
    if (params?.siteId && normalizeSiteId(profile.siteId) !== normalizeSiteId(params.siteId)) {
      return false;
    }
    if (params?.kioskId && String(profile.kioskId ?? '') !== String(params.kioskId)) {
      return false;
    }
    return true;
  });
  const limit = Number.isFinite(Number(params?.limit)) ? Math.max(1, Number(params?.limit)) : 50;
  return filtered.slice(0, limit);
};

export const getLatestFlowProfile = async (params: {
  siteId: string;
  kioskId?: string;
}): Promise<FlowProfileRecord | null> => {
  const profiles = await listFlowProfiles({
    siteId: params.siteId,
    kioskId: params.kioskId,
    limit: 1,
  });
  return profiles[0] ?? null;
};

const normalizeUnit = (value: string): string =>
  String(value)
    .trim()
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '');

const unitFactorToLiter = (unit: string): number | null => {
  const normalized = normalizeUnit(unit);
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(normalized)) return 1;
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(normalized)) {
    return 0.001;
  }
  if (['oz', 'floz', 'fluidounce', 'fluidounces'].includes(normalized)) {
    return 0.0295735295625;
  }
  if (['gal', 'gallon', 'gallons', 'usgal'].includes(normalized)) {
    return 3.785411784;
  }
  if (['qt', 'quart', 'quarts'].includes(normalized)) {
    return 0.946352946;
  }
  return null;
};

const convertVolume = (value: number, fromUom: string, toUom: string): number | null => {
  const from = normalizeUnit(fromUom);
  const to = normalizeUnit(toUom);
  if (!Number.isFinite(value) || value < 0) return null;
  if (from === to) return value;
  const fromFactor = unitFactorToLiter(from);
  const toFactor = unitFactorToLiter(to);
  if (fromFactor === null || toFactor === null) return null;
  const liters = value * fromFactor;
  return liters / toFactor;
};

const findBatchById = (batches: BatchState, siteId: string, batchId: string) =>
  batches.batches.find(
    (batch) =>
      batch.id === batchId && normalizeSiteId(batch.siteId) === normalizeSiteId(siteId)
  );

const buildRejectedResult = (
  eventId: string,
  code: FlowPourEventResult['reasonCode'],
  message: string
): FlowPourEventResult => ({
  eventId,
  status: 'rejected',
  reasonCode: code,
  reasonMessage: message,
  processedAt: nowIso(),
});

export const ingestFlowPourEvents = async (events: FlowPourEventInput[]) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { results: [] as FlowPourEventResult[] };
  }

  const [state, inventory, batches, movementState] = await Promise.all([
    readFlowPourEventsState(),
    readInventoryState(),
    readBatchState(),
    readInventoryMovements(),
  ]);

  const existingById = new Map(
    (state.records ?? []).map((record) => [record.event.eventId, record.result] as const)
  );
  const results: FlowPourEventResult[] = [];
  const nextRecords = [...(state.records ?? [])];
  const nextItems = [...inventory.items];
  const nextBatches = [...batches.batches];
  const nextMovements = [...movementState.movements];
  const batchAdjustments = new Map<
    string,
    {
      previousDispensedQty: number;
      nextDispensedQty: number;
      unit: string;
      producedQty: number;
      status: BatchState['batches'][number]['status'];
      totalConsumedQty: number;
    }
  >();

  let inventoryChanged = false;
  let batchesChanged = false;
  let movementsChanged = false;
  let recordsChanged = false;

  for (const input of events) {
    const eventId = String(input.eventId ?? '').trim();
    if (!eventId) {
      results.push(buildRejectedResult('missing_event_id', 'validation_error', 'eventId is required.'));
      continue;
    }
    const replay = existingById.get(eventId);
    if (replay) {
      results.push({
        ...replay,
        idempotentReplay: true,
      });
      continue;
    }

    const siteId = normalizeSiteId(input.siteId);
    const skuId = normalizeSkuId(input.skuId);
    if (!input.skuId || !skuId) {
      const result = buildRejectedResult(
        eventId,
        'validation_error',
        'skuId is required for FLOW pour ingestion.'
      );
      results.push(result);
      nextRecords.push({ event: input, result });
      existingById.set(eventId, result);
      recordsChanged = true;
      continue;
    }
    if (!input.tapId || !String(input.tapId).trim()) {
      const result = buildRejectedResult(eventId, 'validation_error', 'tapId is required.');
      results.push(result);
      nextRecords.push({ event: input, result });
      existingById.set(eventId, result);
      recordsChanged = true;
      continue;
    }
    if (!Number.isFinite(Number(input.volume)) || Number(input.volume) <= 0) {
      const result = buildRejectedResult(
        eventId,
        'validation_error',
        'volume must be greater than zero.'
      );
      results.push(result);
      nextRecords.push({ event: input, result });
      existingById.set(eventId, result);
      recordsChanged = true;
      continue;
    }
    if (!input.uom || !String(input.uom).trim()) {
      const result = buildRejectedResult(eventId, 'validation_error', 'uom is required.');
      results.push(result);
      nextRecords.push({ event: input, result });
      existingById.set(eventId, result);
      recordsChanged = true;
      continue;
    }

    const itemIndex = nextItems.findIndex(
      (item) =>
        normalizeSiteId(item.siteId) === siteId &&
        normalizeSkuId(item.skuId || item.sku || item.id) === skuId
    );
    if (itemIndex < 0) {
      const skuExistsElsewhere = nextItems.some(
        (item) => normalizeSkuId(item.skuId || item.sku || item.id) === skuId
      );
      const result = buildRejectedResult(
        eventId,
        skuExistsElsewhere ? 'site_unavailable' : 'unknown_sku',
        skuExistsElsewhere
          ? `SKU ${skuId} is not stocked at site ${siteId}.`
          : `SKU ${skuId} is not known in OS inventory.`
      );
      results.push(result);
      nextRecords.push({ event: input, result });
      existingById.set(eventId, result);
      recordsChanged = true;
      continue;
    }

    const item = nextItems[itemIndex];
    const consumedInItemUnit = convertVolume(Number(input.volume), input.uom, item.unit);
    if (consumedInItemUnit === null) {
      const result = buildRejectedResult(
        eventId,
        'invalid_uom',
        `Cannot convert FLOW unit ${input.uom} to inventory unit ${item.unit}.`
      );
      results.push(result);
      nextRecords.push({ event: input, result });
      existingById.set(eventId, result);
      recordsChanged = true;
      continue;
    }

    const previousOnHand = Number(item.onHandQty);
    const updatedOnHand = Math.max(0, previousOnHand - consumedInItemUnit);
    const shortfallQty = Math.max(0, consumedInItemUnit - previousOnHand);
    nextItems[itemIndex] = {
      ...item,
      onHandQty: updatedOnHand,
      updatedAt: nowIso(),
    };
    inventoryChanged = true;

    const movement: InventoryMovementRecord = {
      id: randomUUID(),
      itemId: item.id,
      siteId,
      type: 'consume',
      quantity: consumedInItemUnit,
      unit: item.unit,
      reason: `FLOW pour ${eventId} on tap ${input.tapId}`,
      batchId: input.batchId,
      createdAt: nowIso(),
    };
    nextMovements.push(movement);
    movementsChanged = true;

    if (input.batchId) {
      const batch = findBatchById(
        {
          ...batches,
          batches: nextBatches,
        },
        siteId,
        input.batchId
      );
      if (batch) {
        const batchIdx = nextBatches.findIndex((entry) => entry.id === batch.id);
        if (batchIdx >= 0) {
          const consumedInBatchUnit = convertVolume(Number(input.volume), input.uom, batch.unit);
          if (consumedInBatchUnit !== null) {
            const previousDispensedQty = Number(nextBatches[batchIdx].dispensedQty ?? 0);
            const nextDispensedQty = previousDispensedQty + consumedInBatchUnit;
            nextBatches[batchIdx] = {
              ...nextBatches[batchIdx],
              dispensedQty: nextDispensedQty,
              updatedAt: nowIso(),
            };
            const existingAdjustment = batchAdjustments.get(batch.id);
            batchAdjustments.set(batch.id, {
              previousDispensedQty:
                existingAdjustment?.previousDispensedQty ?? Number(batch.dispensedQty ?? 0),
              nextDispensedQty,
              unit: batch.unit,
              producedQty: Number(batch.producedQty),
              status: batch.status,
              totalConsumedQty:
                (existingAdjustment?.totalConsumedQty ?? 0) + Number(consumedInBatchUnit),
            });
            batchesChanged = true;
          }
        }
      }
    }

    const result: FlowPourEventResult = {
      eventId,
      status: shortfallQty > 0 ? 'accepted_with_shortage' : 'accepted',
      consumedQty: consumedInItemUnit,
      consumedUom: item.unit,
      shortfallQty: shortfallQty > 0 ? shortfallQty : undefined,
      inventoryItemId: item.id,
      batchId: input.batchId,
      processedAt: nowIso(),
    };
    results.push(result);
    nextRecords.push({ event: input, result });
    existingById.set(eventId, result);
    recordsChanged = true;
  }

  if (inventoryChanged) {
    await writeInventoryState({
      ...inventory,
      items: nextItems,
    });
  }
  if (batchesChanged) {
    for (const [batchId, adjustment] of batchAdjustments.entries()) {
      await updateBatchOutput({
        batchId,
        producedQty: adjustment.producedQty,
        dispensedQty: adjustment.nextDispensedQty,
        unit: adjustment.unit,
        status: adjustment.status,
        appendDeviation: {
          field: 'volume',
          planned: adjustment.previousDispensedQty,
          actual: adjustment.nextDispensedQty,
          unit: adjustment.unit,
          note: `Flow pour depletion recorded. ${adjustment.totalConsumedQty} ${adjustment.unit} consumed through tap service.`,
          source: 'automation',
          reasonCode: 'flow_pour_depletion',
        },
      });
    }
  }
  if (movementsChanged) {
    await writeInventoryMovements({
      ...movementState,
      movements: nextMovements,
    });
  }
  if (recordsChanged) {
    await writeFlowPourEventsState({
      ...state,
      records: nextRecords,
    });
  }

  return {
    results,
  };
};

export const listFlowPourEvents = async (params?: {
  siteId?: string;
  limit?: number;
}): Promise<FlowPourEventRecord[]> => {
  const state = await readFlowPourEventsState();
  const filtered = (state.records ?? []).filter((record) => {
    if (!params?.siteId) return true;
    return normalizeSiteId(record.event.siteId) === normalizeSiteId(params.siteId);
  });
  const limit = Number.isFinite(Number(params?.limit)) ? Math.max(1, Number(params?.limit)) : 200;
  return filtered.slice(0, limit);
};

export const upsertFlowRuntimeSnapshot = async (
  snapshot: FlowRuntimeSnapshot
): Promise<FlowRuntimeSnapshot & { id: string; schemaVersion: string; reportedAt: string }> => {
  const state = await readFlowRuntimeStateStore();
  const normalized: FlowRuntimeSnapshot & {
    id: string;
    schemaVersion: string;
    reportedAt: string;
  } = {
    ...snapshot,
    id: snapshot.id?.trim() || randomUUID(),
    schemaVersion: snapshot.schemaVersion?.trim() || '1.0.0',
    siteId: normalizeSiteId(snapshot.siteId),
    kioskId: snapshot.kioskId?.trim() || undefined,
    reportedAt: snapshot.reportedAt?.trim() || nowIso(),
  };
  await writeFlowRuntimeStateStore({
    ...state,
    snapshots: [normalized, ...(state.snapshots ?? [])],
  });
  return normalized;
};

export const readFlowRuntimeSnapshots = async (params?: {
  siteId?: string;
  kioskId?: string;
  limit?: number;
}) => {
  const state = await readFlowRuntimeStateStore();
  const filtered = (state.snapshots ?? []).filter((snapshot) => {
    if (params?.siteId && normalizeSiteId(snapshot.siteId) !== normalizeSiteId(params.siteId)) {
      return false;
    }
    if (params?.kioskId && String(snapshot.kioskId ?? '') !== String(params.kioskId)) {
      return false;
    }
    return true;
  });
  const limit = Number.isFinite(Number(params?.limit)) ? Math.max(1, Number(params?.limit)) : 100;
  return filtered.slice(0, limit);
};
