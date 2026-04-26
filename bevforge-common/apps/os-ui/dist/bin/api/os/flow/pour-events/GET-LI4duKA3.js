import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { c as commissioningPaths, d as readCanvasProject, e as ensureCommissioningStore } from '../../recipes/import/POST-B16W0CFH.js';
import { r as readInventoryState, a as readBatchState, f as readInventoryMovements, w as writeInventoryState, g as writeBatchState, i as writeInventoryMovements } from '../../../calendar/events/GET-DNBekL63.js';

const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const readJsonOrDefault = async (filePath, fallback) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writeJson = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}
`, "utf8");
};
const normalizeSiteId = (value) => String(value ?? "").trim().toLowerCase() || "main";
const normalizeSkuId = (value) => String(value ?? "").trim().replace(/\s+/g, "-").toUpperCase();
const flowProfilesFile = path.join(commissioningPaths.root, "flow-profiles.json");
const flowPourEventsFile = path.join(commissioningPaths.root, "flow-pour-events.json");
const flowRuntimeStateFile = path.join(commissioningPaths.root, "flow-runtime-state.json");
const defaultProfilesState = () => ({
  schemaVersion: "1.0.0",
  id: "flow-profiles",
  updatedAt: nowIso(),
  profiles: []
});
const defaultPourEventsState = () => ({
  schemaVersion: "1.0.0",
  id: "flow-pour-events",
  updatedAt: nowIso(),
  records: []
});
const defaultRuntimeState = () => ({
  schemaVersion: "1.0.0",
  id: "flow-runtime-state",
  updatedAt: nowIso(),
  snapshots: []
});
const readFlowProfilesState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(flowProfilesFile, defaultProfilesState());
};
const writeFlowProfilesState = async (state) => {
  await ensureCommissioningStore();
  const next = {
    ...state,
    schemaVersion: state.schemaVersion ?? "1.0.0",
    id: state.id ?? "flow-profiles",
    updatedAt: nowIso(),
    profiles: [...state.profiles ?? []].slice(0, 500)
  };
  await writeJson(flowProfilesFile, next);
  return next;
};
const readFlowPourEventsState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(flowPourEventsFile, defaultPourEventsState());
};
const writeFlowPourEventsState = async (state) => {
  await ensureCommissioningStore();
  const next = {
    ...state,
    schemaVersion: state.schemaVersion ?? "1.0.0",
    id: state.id ?? "flow-pour-events",
    updatedAt: nowIso(),
    records: [...state.records ?? []].slice(0, 2e4)
  };
  await writeJson(flowPourEventsFile, next);
  return next;
};
const readFlowRuntimeStateStore = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(flowRuntimeStateFile, defaultRuntimeState());
};
const writeFlowRuntimeStateStore = async (state) => {
  await ensureCommissioningStore();
  const next = {
    ...state,
    schemaVersion: state.schemaVersion ?? "1.0.0",
    id: state.id ?? "flow-runtime-state",
    updatedAt: nowIso(),
    snapshots: [...state.snapshots ?? []].slice(0, 5e3)
  };
  await writeJson(flowRuntimeStateFile, next);
  return next;
};
const buildTapProfiles = (params) => {
  const nodeById = new Map(params.nodes.map((node) => [node.id, node]));
  const defaultPourSizes = [6, 8, 12, 16];
  if ((params.tapMap ?? []).length > 0) {
    return (params.tapMap ?? []).map((mapping, index) => {
      const node = mapping.nodeId ? nodeById.get(mapping.nodeId) : void 0;
      const labelFromNode = node?.data?.label ? String(node.data.label) : void 0;
      const tapId = mapping.tapId?.trim() || `tap-${index + 1}`;
      return {
        tapId,
        nodeId: node?.id,
        label: mapping.label?.trim() || labelFromNode || tapId.toUpperCase(),
        skuId: mapping.skuId ? normalizeSkuId(mapping.skuId) : void 0,
        batchId: mapping.batchId?.trim() || void 0,
        pourSizesOz: (mapping.pourSizesOz ?? []).filter((value) => Number.isFinite(value) && value > 0).length > 0 ? (mapping.pourSizesOz ?? []).filter(
          (value) => Number.isFinite(value) && value > 0
        ) : defaultPourSizes,
        temperatureTargetC: mapping.temperatureTargetC,
        temperatureMinC: mapping.temperatureMinC,
        temperatureMaxC: mapping.temperatureMaxC,
        co2TargetPsi: mapping.co2TargetPsi,
        co2MinPsi: mapping.co2MinPsi,
        co2MaxPsi: mapping.co2MaxPsi,
        enabled: mapping.enabled !== false
      };
    });
  }
  const inferredTapNodes = params.nodes.filter((node) => {
    const label = String(node.data?.label ?? "").toLowerCase();
    return label.includes("tap") || label.includes("faucet") || node.data?.widgetType === "button" && label.includes("pour");
  });
  return inferredTapNodes.map((node, index) => ({
    tapId: `tap-${index + 1}`,
    nodeId: node.id,
    label: String(node.data?.label ?? `Tap ${index + 1}`),
    pourSizesOz: defaultPourSizes,
    enabled: true
  }));
};
const buildControllerSummary = (nodes) => {
  const out = [];
  for (const node of nodes) {
    const widgetType = node.data?.widgetType;
    if (widgetType === "co2_controller") {
      const co2 = node.data.config.co2Controller;
      out.push({
        nodeId: node.id,
        label: node.data.label,
        type: "co2",
        sourceSensorDeviceId: co2?.sourceSensorDeviceId,
        outputDeviceIds: [co2?.inletValveDeviceId, co2?.ventValveDeviceId].filter(
          (value) => Boolean(value)
        ),
        threshold: co2?.threshold,
        hysteresis: co2?.hysteresis,
        pollMs: co2?.pollMs
      });
    }
    if (widgetType === "glycol_controller" || widgetType === "hlt_controller") {
      const glycol = node.data.config.glycolController;
      const hlt = node.data.config.hltController;
      const sourceSensorDeviceId = glycol?.sourceSensorDeviceId ?? hlt?.sourceSensorDeviceId;
      const threshold = glycol?.threshold ?? hlt?.threshold;
      const hysteresis = glycol?.hysteresis ?? hlt?.hysteresis;
      const pollMs = glycol?.pollMs ?? hlt?.pollMs;
      const outputDeviceIds = widgetType === "glycol_controller" ? [glycol?.pumpDeviceId, glycol?.valveDeviceId, glycol?.chillerDeviceId] : [hlt?.heaterDeviceId, hlt?.recircPumpDeviceId];
      out.push({
        nodeId: node.id,
        label: node.data.label,
        type: "temperature",
        sourceSensorDeviceId,
        outputDeviceIds: outputDeviceIds.filter((value) => Boolean(value)),
        threshold,
        hysteresis,
        pollMs
      });
    }
  }
  return out;
};
const publishFlowProfile = async (params) => {
  const siteId = normalizeSiteId(params.siteId);
  const kioskId = params.kioskId?.trim() || void 0;
  const project = await readCanvasProject();
  const page = (params.pageId ? project.pages.find((entry) => entry.id === params.pageId) : void 0) ?? project.pages.find((entry) => entry.mode === "published") ?? project.pages[0];
  if (!page) {
    throw new Error("No canvas page found to export for FLOW.");
  }
  const taps = buildTapProfiles({
    nodes: page.nodes,
    tapMap: params.tapMap
  });
  const controllers = buildControllerSummary(page.nodes);
  const menuItems = taps.map((tap) => ({
    id: `menu-${tap.tapId}`,
    tapId: tap.tapId,
    label: tap.label,
    skuId: tap.skuId,
    batchId: tap.batchId,
    status: tap.skuId ? "on_tap" : "coming_soon"
  }));
  const profile = {
    schemaVersion: "1.0.0",
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
      pageUpdatedAt: page.updatedAt
    },
    profile: {
      taps,
      controllers,
      menuItems,
      graph: {
        nodes: page.nodes,
        edges: page.edges,
        viewport: page.viewport
      }
    }
  };
  const state = await readFlowProfilesState();
  await writeFlowProfilesState({
    ...state,
    profiles: [profile, ...state.profiles ?? []]
  });
  return profile;
};
const listFlowProfiles = async (params) => {
  const state = await readFlowProfilesState();
  const filtered = (state.profiles ?? []).filter((profile) => {
    if (params?.siteId && normalizeSiteId(profile.siteId) !== normalizeSiteId(params.siteId)) {
      return false;
    }
    if (params?.kioskId && String(profile.kioskId ?? "") !== String(params.kioskId)) {
      return false;
    }
    return true;
  });
  const limit = Number.isFinite(Number(params?.limit)) ? Math.max(1, Number(params?.limit)) : 50;
  return filtered.slice(0, limit);
};
const getLatestFlowProfile = async (params) => {
  const profiles = await listFlowProfiles({
    siteId: params.siteId,
    kioskId: params.kioskId,
    limit: 1
  });
  return profiles[0] ?? null;
};
const normalizeUnit = (value) => String(value).trim().toLowerCase().replaceAll(" ", "").replaceAll("_", "");
const unitFactorToLiter = (unit) => {
  const normalized = normalizeUnit(unit);
  if (["l", "liter", "liters", "litre", "litres"].includes(normalized)) return 1;
  if (["ml", "milliliter", "milliliters", "millilitre", "millilitres"].includes(normalized)) {
    return 1e-3;
  }
  if (["oz", "floz", "fluidounce", "fluidounces"].includes(normalized)) {
    return 0.0295735295625;
  }
  if (["gal", "gallon", "gallons", "usgal"].includes(normalized)) {
    return 3.785411784;
  }
  if (["qt", "quart", "quarts"].includes(normalized)) {
    return 0.946352946;
  }
  return null;
};
const convertVolume = (value, fromUom, toUom) => {
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
const findBatchById = (batches, siteId, batchId) => batches.batches.find(
  (batch) => batch.id === batchId && normalizeSiteId(batch.siteId) === normalizeSiteId(siteId)
);
const buildRejectedResult = (eventId, code, message) => ({
  eventId,
  status: "rejected",
  reasonCode: code,
  reasonMessage: message,
  processedAt: nowIso()
});
const ingestFlowPourEvents = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { results: [] };
  }
  const [state, inventory, batches, movementState] = await Promise.all([
    readFlowPourEventsState(),
    readInventoryState(),
    readBatchState(),
    readInventoryMovements()
  ]);
  const existingById = new Map(
    (state.records ?? []).map((record) => [record.event.eventId, record.result])
  );
  const results = [];
  const nextRecords = [...state.records ?? []];
  const nextItems = [...inventory.items];
  const nextBatches = [...batches.batches];
  const nextMovements = [...movementState.movements];
  let inventoryChanged = false;
  let batchesChanged = false;
  let movementsChanged = false;
  let recordsChanged = false;
  for (const input of events) {
    const eventId = String(input.eventId ?? "").trim();
    if (!eventId) {
      results.push(buildRejectedResult("missing_event_id", "validation_error", "eventId is required."));
      continue;
    }
    const replay = existingById.get(eventId);
    if (replay) {
      results.push({
        ...replay,
        idempotentReplay: true
      });
      continue;
    }
    const siteId = normalizeSiteId(input.siteId);
    const skuId = normalizeSkuId(input.skuId);
    if (!input.skuId || !skuId) {
      const result2 = buildRejectedResult(
        eventId,
        "validation_error",
        "skuId is required for FLOW pour ingestion."
      );
      results.push(result2);
      nextRecords.push({ event: input, result: result2 });
      existingById.set(eventId, result2);
      recordsChanged = true;
      continue;
    }
    if (!input.tapId || !String(input.tapId).trim()) {
      const result2 = buildRejectedResult(eventId, "validation_error", "tapId is required.");
      results.push(result2);
      nextRecords.push({ event: input, result: result2 });
      existingById.set(eventId, result2);
      recordsChanged = true;
      continue;
    }
    if (!Number.isFinite(Number(input.volume)) || Number(input.volume) <= 0) {
      const result2 = buildRejectedResult(
        eventId,
        "validation_error",
        "volume must be greater than zero."
      );
      results.push(result2);
      nextRecords.push({ event: input, result: result2 });
      existingById.set(eventId, result2);
      recordsChanged = true;
      continue;
    }
    if (!input.uom || !String(input.uom).trim()) {
      const result2 = buildRejectedResult(eventId, "validation_error", "uom is required.");
      results.push(result2);
      nextRecords.push({ event: input, result: result2 });
      existingById.set(eventId, result2);
      recordsChanged = true;
      continue;
    }
    const itemIndex = nextItems.findIndex(
      (item2) => normalizeSiteId(item2.siteId) === siteId && normalizeSkuId(item2.skuId || item2.sku || item2.id) === skuId
    );
    if (itemIndex < 0) {
      const skuExistsElsewhere = nextItems.some(
        (item2) => normalizeSkuId(item2.skuId || item2.sku || item2.id) === skuId
      );
      const result2 = buildRejectedResult(
        eventId,
        skuExistsElsewhere ? "site_unavailable" : "unknown_sku",
        skuExistsElsewhere ? `SKU ${skuId} is not stocked at site ${siteId}.` : `SKU ${skuId} is not known in OS inventory.`
      );
      results.push(result2);
      nextRecords.push({ event: input, result: result2 });
      existingById.set(eventId, result2);
      recordsChanged = true;
      continue;
    }
    const item = nextItems[itemIndex];
    const consumedInItemUnit = convertVolume(Number(input.volume), input.uom, item.unit);
    if (consumedInItemUnit === null) {
      const result2 = buildRejectedResult(
        eventId,
        "invalid_uom",
        `Cannot convert FLOW unit ${input.uom} to inventory unit ${item.unit}.`
      );
      results.push(result2);
      nextRecords.push({ event: input, result: result2 });
      existingById.set(eventId, result2);
      recordsChanged = true;
      continue;
    }
    const previousOnHand = Number(item.onHandQty);
    const updatedOnHand = Math.max(0, previousOnHand - consumedInItemUnit);
    const shortfallQty = Math.max(0, consumedInItemUnit - previousOnHand);
    nextItems[itemIndex] = {
      ...item,
      onHandQty: updatedOnHand,
      updatedAt: nowIso()
    };
    inventoryChanged = true;
    const movement = {
      id: randomUUID(),
      itemId: item.id,
      siteId,
      type: "consume",
      quantity: consumedInItemUnit,
      unit: item.unit,
      reason: `FLOW pour ${eventId} on tap ${input.tapId}`,
      batchId: input.batchId,
      createdAt: nowIso()
    };
    nextMovements.push(movement);
    movementsChanged = true;
    if (input.batchId) {
      const batch = findBatchById(
        {
          ...batches,
          batches: nextBatches
        },
        siteId,
        input.batchId
      );
      if (batch) {
        const batchIdx = nextBatches.findIndex((entry) => entry.id === batch.id);
        if (batchIdx >= 0) {
          const consumedInBatchUnit = convertVolume(Number(input.volume), input.uom, batch.unit);
          if (consumedInBatchUnit !== null) {
            nextBatches[batchIdx] = {
              ...nextBatches[batchIdx],
              dispensedQty: (nextBatches[batchIdx].dispensedQty ?? 0) + consumedInBatchUnit,
              updatedAt: nowIso()
            };
            batchesChanged = true;
          }
        }
      }
    }
    const result = {
      eventId,
      status: shortfallQty > 0 ? "accepted_with_shortage" : "accepted",
      consumedQty: consumedInItemUnit,
      consumedUom: item.unit,
      shortfallQty: shortfallQty > 0 ? shortfallQty : void 0,
      inventoryItemId: item.id,
      batchId: input.batchId,
      processedAt: nowIso()
    };
    results.push(result);
    nextRecords.push({ event: input, result });
    existingById.set(eventId, result);
    recordsChanged = true;
  }
  if (inventoryChanged) {
    await writeInventoryState({
      ...inventory,
      items: nextItems
    });
  }
  if (batchesChanged) {
    await writeBatchState({
      ...batches,
      batches: nextBatches
    });
  }
  if (movementsChanged) {
    await writeInventoryMovements({
      ...movementState,
      movements: nextMovements
    });
  }
  if (recordsChanged) {
    await writeFlowPourEventsState({
      ...state,
      records: nextRecords
    });
  }
  return {
    results
  };
};
const listFlowPourEvents = async (params) => {
  const state = await readFlowPourEventsState();
  const filtered = (state.records ?? []).filter((record) => {
    if (!params?.siteId) return true;
    return normalizeSiteId(record.event.siteId) === normalizeSiteId(params.siteId);
  });
  const limit = Number.isFinite(Number(params?.limit)) ? Math.max(1, Number(params?.limit)) : 200;
  return filtered.slice(0, limit);
};
const upsertFlowRuntimeSnapshot = async (snapshot) => {
  const state = await readFlowRuntimeStateStore();
  const normalized = {
    ...snapshot,
    id: snapshot.id?.trim() || randomUUID(),
    schemaVersion: snapshot.schemaVersion?.trim() || "1.0.0",
    siteId: normalizeSiteId(snapshot.siteId),
    kioskId: snapshot.kioskId?.trim() || void 0,
    reportedAt: snapshot.reportedAt?.trim() || nowIso()
  };
  await writeFlowRuntimeStateStore({
    ...state,
    snapshots: [normalized, ...state.snapshots ?? []]
  });
  return normalized;
};
const readFlowRuntimeSnapshots = async (params) => {
  const state = await readFlowRuntimeStateStore();
  const filtered = (state.snapshots ?? []).filter((snapshot) => {
    if (params?.siteId && normalizeSiteId(snapshot.siteId) !== normalizeSiteId(params.siteId)) {
      return false;
    }
    if (params?.kioskId && String(snapshot.kioskId ?? "") !== String(params.kioskId)) {
      return false;
    }
    return true;
  });
  const limit = Number.isFinite(Number(params?.limit)) ? Math.max(1, Number(params?.limit)) : 100;
  return filtered.slice(0, limit);
};

async function handler(req, res) {
  try {
    const siteParam = req.query.siteId;
    const limitParam = req.query.limit;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const limit = Array.isArray(limitParam) ? limitParam[0] : limitParam;
    const records = await listFlowPourEvents({
      siteId: siteId ? String(siteId).trim() : void 0,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : void 0
    });
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error("Failed to list FLOW pour events:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to list FLOW pour events."
    });
  }
}

export { getLatestFlowProfile as g, handler as h, ingestFlowPourEvents as i, listFlowProfiles as l, publishFlowProfile as p, readFlowRuntimeSnapshots as r, upsertFlowRuntimeSnapshot as u };
