import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { c as commissioningPaths, e as ensureCommissioningStore, r as readRecipeRunsState } from '../../os/recipes/import/POST-B16W0CFH.js';
import { randomUUID } from 'node:crypto';

const nowIso$1 = () => (/* @__PURE__ */ new Date()).toISOString();
const readJsonOrDefault$1 = async (filePath, fallback) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writeJson$1 = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}
`, "utf8");
};
const normalizeQty = (value) => {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value * 1e6) / 1e6;
  return Math.abs(rounded) < 1e-9 ? 0 : rounded;
};
const generateLotCode = () => `LOT-${Date.now().toString(36).toUpperCase()}`;
const normalizeLotCode = (value) => {
  if (value === void 0 || value === null) return void 0;
  const normalized = String(value).trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
  return normalized.length > 0 ? normalized : void 0;
};
const ensureUniqueLotCode = (candidate, existing) => {
  if (!existing.has(candidate)) return candidate;
  let index = 2;
  while (existing.has(`${candidate}-${index}`)) {
    index += 1;
  }
  return `${candidate}-${index}`;
};
const inventoryFile = path.join(commissioningPaths.root, "inventory-state.json");
const inventoryMovementsFile = path.join(commissioningPaths.root, "inventory-movements.json");
const batchFile = path.join(commissioningPaths.root, "batch-state.json");
const reservationsFile = path.join(commissioningPaths.root, "reservation-state.json");
const reservationActionsFile = path.join(commissioningPaths.root, "reservation-actions.json");
const defaultInventoryState = () => ({
  schemaVersion: "0.1.0",
  id: "inventory-state",
  updatedAt: nowIso$1(),
  items: [
    {
      id: randomUUID(),
      skuId: "HOP-CASCADE",
      sku: "HOP-CASCADE",
      siteId: "main",
      name: "Cascade Hops",
      category: "hops",
      unit: "kg",
      onHandQty: 42,
      allocatedQty: 4,
      reorderPointQty: 50,
      costPerUnit: 19.75,
      createdAt: nowIso$1(),
      updatedAt: nowIso$1()
    },
    {
      id: randomUUID(),
      skuId: "MALT-PILSNER",
      sku: "MALT-PILSNER",
      siteId: "main",
      name: "Pilsner Malt",
      category: "malt",
      unit: "kg",
      onHandQty: 380,
      allocatedQty: 60,
      reorderPointQty: 200,
      costPerUnit: 1.25,
      createdAt: nowIso$1(),
      updatedAt: nowIso$1()
    },
    {
      id: randomUUID(),
      skuId: "YEAST-US05",
      sku: "YEAST-US05",
      siteId: "main",
      name: "SafAle US-05",
      category: "yeast",
      unit: "packs",
      onHandQty: 45,
      allocatedQty: 8,
      reorderPointQty: 10,
      costPerUnit: 4.99,
      createdAt: nowIso$1(),
      updatedAt: nowIso$1()
    },
    {
      id: randomUUID(),
      skuId: "PKG-CAPS-500",
      sku: "PKG-CAPS-500",
      siteId: "main",
      name: "Crown Caps",
      category: "packaging",
      unit: "units",
      onHandQty: 8e3,
      allocatedQty: 2500,
      reorderPointQty: 2e3,
      costPerUnit: 0.05,
      createdAt: nowIso$1(),
      updatedAt: nowIso$1()
    }
  ]
});
const defaultMovementState = () => ({
  schemaVersion: "0.1.0",
  id: "inventory-movements",
  updatedAt: nowIso$1(),
  movements: []
});
const defaultBatchState = () => ({
  schemaVersion: "0.1.0",
  id: "batch-state",
  updatedAt: nowIso$1(),
  batches: []
});
const defaultReservationState = () => ({
  schemaVersion: "1.0.0",
  id: "reservation-state",
  updatedAt: nowIso$1(),
  reservations: []
});
const defaultReservationActionsState = () => ({
  schemaVersion: "1.0.0",
  id: "reservation-actions",
  updatedAt: nowIso$1(),
  actions: []
});
const DEFAULT_SITE_ID = "main";
const normalizeSiteId = (value) => String(value ?? "").trim().toLowerCase() || DEFAULT_SITE_ID;
const normalizeSkuId = (value) => String(value ?? "").trim().replace(/\s+/g, "-").toUpperCase();
const deriveSkuId = (item) => {
  const fromSkuId = normalizeSkuId(item.skuId);
  if (fromSkuId) return fromSkuId;
  const fromSku = normalizeSkuId(item.sku);
  if (fromSku) return fromSku;
  return normalizeSkuId(item.id);
};
const normalizeInventoryItem = (item) => {
  const skuId = deriveSkuId(item);
  return {
    ...item,
    skuId,
    sku: item.sku?.trim() ? normalizeSkuId(item.sku) : skuId,
    siteId: normalizeSiteId(item.siteId)
  };
};
const readInventoryState = async () => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault$1(inventoryFile, defaultInventoryState());
  return {
    ...state,
    items: (state.items ?? []).map(normalizeInventoryItem)
  };
};
const writeInventoryState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "inventory-state",
    updatedAt: nowIso$1(),
    items: (state.items ?? []).map(normalizeInventoryItem)
  };
  await writeJson$1(inventoryFile, normalized);
  return normalized;
};
const readInventoryMovements = async () => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault$1(
    inventoryMovementsFile,
    defaultMovementState()
  );
  return {
    ...state,
    movements: (state.movements ?? []).map((movement) => ({
      ...movement,
      siteId: normalizeSiteId(movement.siteId)
    }))
  };
};
const writeInventoryMovements = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "inventory-movements",
    updatedAt: nowIso$1(),
    movements: [...state.movements ?? []].map((movement) => ({
      ...movement,
      siteId: normalizeSiteId(movement.siteId)
    })).slice(-2e3)
  };
  await writeJson$1(inventoryMovementsFile, normalized);
  return normalized;
};
const readBatchState = async () => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault$1(batchFile, defaultBatchState());
  return {
    ...state,
    batches: (state.batches ?? []).map((batch) => ({
      ...batch,
      skuId: batch.skuId ? normalizeSkuId(batch.skuId) : void 0,
      siteId: normalizeSiteId(batch.siteId),
      dispensedQty: Number.isFinite(Number(batch.dispensedQty)) ? Number(batch.dispensedQty) : 0
    }))
  };
};
const writeBatchState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "batch-state",
    updatedAt: nowIso$1(),
    batches: [...state.batches ?? []].map((batch) => ({
      ...batch,
      skuId: batch.skuId ? normalizeSkuId(batch.skuId) : void 0,
      siteId: normalizeSiteId(batch.siteId),
      dispensedQty: Number.isFinite(Number(batch.dispensedQty)) ? Number(batch.dispensedQty) : 0
    })).slice(-500)
  };
  await writeJson$1(batchFile, normalized);
  return normalized;
};
const readReservationState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault$1(reservationsFile, defaultReservationState());
};
const writeReservationState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "1.0.0",
    id: state.id ?? "reservation-state",
    updatedAt: nowIso$1(),
    reservations: [...state.reservations ?? []].slice(-5e3)
  };
  await writeJson$1(reservationsFile, normalized);
  return normalized;
};
const readReservationActionsState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault$1(
    reservationActionsFile,
    defaultReservationActionsState()
  );
};
const writeReservationActionsState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "1.0.0",
    id: state.id ?? "reservation-actions",
    updatedAt: nowIso$1(),
    actions: [...state.actions ?? []].slice(-1e4)
  };
  await writeJson$1(reservationActionsFile, normalized);
  return normalized;
};
const resolveInventoryItemBySkuId = (items, skuId, siteId) => {
  const normalized = normalizeSkuId(skuId);
  const normalizedSiteId = siteId ? normalizeSiteId(siteId) : void 0;
  if (!normalized) return void 0;
  return items.find((item) => {
    const knownSku = normalizeSkuId(item.skuId || item.sku || item.id);
    const siteMatches = normalizedSiteId === void 0 || normalizeSiteId(item.siteId) === normalizedSiteId;
    return siteMatches && (knownSku === normalized || normalizeSkuId(item.id) === normalized || normalizeSkuId(item.sku) === normalized);
  });
};
const availableQtyForItem = (item) => Math.max(0, Number(item.onHandQty) - Number(item.allocatedQty));
const buildAvailabilitySnapshotFromState = (params) => {
  const normalizedSkuId = normalizeSkuId(params.skuId);
  const normalizedSiteId = normalizeSiteId(params.siteId);
  const item = resolveInventoryItemBySkuId(
    params.inventory.items,
    normalizedSkuId,
    normalizedSiteId
  );
  const unit = item?.unit ?? "units";
  const onHandQty = item ? Number(item.onHandQty) : 0;
  const allocatedQty = item ? Number(item.allocatedQty) : 0;
  const availableQty = item ? availableQtyForItem(item) : 0;
  const lotBreakdown = [];
  if (item) {
    const matchingBatches = params.batches.batches.filter(
      (batch) => normalizeSkuId(batch.skuId) === normalizedSkuId && normalizeSiteId(batch.siteId) === normalizedSiteId
    );
    if (matchingBatches.length > 0) {
      for (const batch of matchingBatches) {
        lotBreakdown.push({
          lotId: batch.lotCode || `LOT-${batch.id}`,
          batchId: batch.id,
          availableQty: Math.max(
            0,
            batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)
          )
        });
      }
    } else {
      lotBreakdown.push({
        lotId: `INV-${item.id}`,
        availableQty
      });
    }
  }
  return {
    schemaVersion: "1.0.0",
    skuId: normalizedSkuId,
    siteId: normalizedSiteId,
    onHandQty,
    allocatedQty,
    availableQty,
    uom: unit,
    lotBreakdown,
    asOf: nowIso$1()
  };
};
const buildAvailabilitySnapshot = async (params) => {
  const [inventory, batches] = await Promise.all([readInventoryState(), readBatchState()]);
  return buildAvailabilitySnapshotFromState({
    inventory,
    batches,
    skuId: params.skuId,
    siteId: params.siteId
  });
};
const buildLotAllocationsForReservation = (params) => {
  let remaining = params.allocateQty;
  const allocations = [];
  const candidateBatches = params.batches.batches.filter(
    (batch) => normalizeSkuId(batch.skuId) === normalizeSkuId(params.skuId) && normalizeSiteId(batch.siteId) === normalizeSiteId(params.siteId)
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
      skuId: normalizeSkuId(params.skuId),
      qty,
      uom: params.uom,
      expiresAt: params.expiresAt
    });
    remaining -= qty;
  }
  if (remaining > 0) {
    allocations.push({
      lotId: `INV-${params.item.id}`,
      itemId: params.item.id,
      skuId: normalizeSkuId(params.skuId),
      qty: remaining,
      uom: params.uom,
      expiresAt: params.expiresAt
    });
  }
  return allocations.filter((allocation) => allocation.qty > 0);
};
const createInventoryReservation = async (request) => {
  const normalizedRequestId = String(request.requestId ?? "").trim();
  const normalizedSkuId = normalizeSkuId(request.skuId);
  const normalizedSiteId = normalizeSiteId(request.siteId);
  const requestedQty = Number(request.requestedQty);
  const allowPartial = Boolean(request.allowPartial);
  const [reservationState, inventoryState, movementState, batchState] = await Promise.all([
    readReservationState(),
    readInventoryState(),
    readInventoryMovements(),
    readBatchState()
  ]);
  const prior = reservationState.reservations.find(
    (reservation) => reservation.requestId === normalizedRequestId
  );
  if (prior) {
    return prior.response;
  }
  let status = "rejected";
  let reasonCode;
  let reasonMessage;
  let allocatedQty = 0;
  let shortQty = Number.isFinite(requestedQty) && requestedQty > 0 ? requestedQty : 0;
  let allocations = [];
  const itemAtAnySite = resolveInventoryItemBySkuId(inventoryState.items, normalizedSkuId);
  const item = resolveInventoryItemBySkuId(
    inventoryState.items,
    normalizedSkuId,
    normalizedSiteId
  );
  if (!item) {
    if (itemAtAnySite) {
      reasonCode = "site_unavailable";
      reasonMessage = `SKU ${normalizedSkuId} is not available at site ${normalizedSiteId}.`;
    } else {
      reasonCode = "unknown_sku";
      reasonMessage = `SKU ${normalizedSkuId} not found in OS inventory.`;
    }
  } else if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
    reasonCode = "validation_error";
    reasonMessage = "requestedQty must be greater than zero.";
  } else if (!request.uom || String(request.uom).trim().length === 0) {
    reasonCode = "validation_error";
    reasonMessage = "uom is required.";
  } else if (String(request.uom).trim() !== item.unit) {
    reasonCode = "invalid_uom";
    reasonMessage = `Requested uom ${request.uom} does not match inventory unit ${item.unit}.`;
  } else {
    const availableQty = availableQtyForItem(item);
    if (availableQty >= requestedQty) {
      status = "reserved";
      allocatedQty = requestedQty;
      shortQty = 0;
      allocations = buildLotAllocationsForReservation({
        item,
        batches: batchState,
        skuId: normalizedSkuId,
        siteId: normalizedSiteId,
        allocateQty: allocatedQty,
        uom: item.unit,
        expiresAt: request.constraints?.expiresAt
      });
    } else if (allowPartial && availableQty > 0) {
      status = "partially_reserved";
      allocatedQty = availableQty;
      shortQty = requestedQty - availableQty;
      reasonCode = "insufficient_available";
      reasonMessage = `Only ${availableQty} ${item.unit} available for SKU ${normalizedSkuId}.`;
      allocations = buildLotAllocationsForReservation({
        item,
        batches: batchState,
        skuId: normalizedSkuId,
        siteId: normalizedSiteId,
        allocateQty: allocatedQty,
        uom: item.unit,
        expiresAt: request.constraints?.expiresAt
      });
    } else {
      status = "rejected";
      allocatedQty = 0;
      shortQty = requestedQty;
      reasonCode = "insufficient_available";
      reasonMessage = `Insufficient available quantity for SKU ${normalizedSkuId}.`;
    }
  }
  const now = nowIso$1();
  const nextInventoryItems = [...inventoryState.items];
  if (allocatedQty > 0 && item) {
    const itemIndex = nextInventoryItems.findIndex((candidate) => candidate.id === item.id);
    if (itemIndex >= 0) {
      nextInventoryItems[itemIndex] = {
        ...nextInventoryItems[itemIndex],
        allocatedQty: nextInventoryItems[itemIndex].allocatedQty + allocatedQty,
        updatedAt: now
      };
    }
  }
  const nextMovementEntries = [...movementState.movements];
  if (allocatedQty > 0 && item) {
    nextMovementEntries.push({
      id: randomUUID(),
      itemId: item.id,
      siteId: item.siteId,
      type: "allocate",
      quantity: allocatedQty,
      unit: item.unit,
      reason: `OPS reservation ${normalizedRequestId} for order ${request.orderId}`,
      batchId: allocations[0]?.batchId,
      createdAt: now
    });
  }
  const nextInventoryState = allocatedQty > 0 ? await writeInventoryState({
    ...inventoryState,
    items: nextInventoryItems
  }) : inventoryState;
  if (allocatedQty > 0) {
    await writeInventoryMovements({
      ...movementState,
      movements: nextMovementEntries
    });
  }
  const availabilitySnapshot = buildAvailabilitySnapshotFromState({
    inventory: nextInventoryState,
    batches: batchState,
    skuId: normalizedSkuId,
    siteId: normalizedSiteId
  });
  const reservationId = randomUUID();
  const response = {
    schemaVersion: "1.0.0",
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
      batchId: allocation.batchId,
      qty: allocation.qty,
      uom: allocation.uom,
      expiresAt: allocation.expiresAt
    })),
    availabilitySnapshot,
    respondedAt: now
  };
  const reservationRecord = {
    schemaVersion: "1.0.0",
    reservationId,
    requestId: normalizedRequestId,
    orderId: request.orderId,
    lineId: request.lineId,
    skuId: normalizedSkuId,
    siteId: normalizedSiteId,
    uom: request.uom,
    requestedQty,
    allowPartial,
    status: status === "reserved" || status === "partially_reserved" ? status : "rejected",
    allocatedQty,
    shortQty,
    reasonCode,
    reasonMessage,
    allocations,
    createdAt: now,
    updatedAt: now,
    response
  };
  await writeReservationState({
    ...reservationState,
    reservations: [reservationRecord, ...reservationState.reservations]
  });
  return response;
};
const applyInventoryReservationAction = async (params) => {
  const reservationId = String(params.reservationId ?? "").trim();
  const actionId = String(params.actionId ?? "").trim();
  if (!reservationId || !actionId) return null;
  const [reservationState, actionState, inventoryState, movementState, batchState] = await Promise.all([
    readReservationState(),
    readReservationActionsState(),
    readInventoryState(),
    readInventoryMovements(),
    readBatchState()
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
  let nextStatus = reservation.status;
  const shouldMutateInventory = reservation.allocatedQty > 0 && (reservation.status === "reserved" || reservation.status === "partially_reserved");
  const nextInventoryItems = [...inventoryState.items];
  const nextMovements = [...movementState.movements];
  const inventoryItem = resolveInventoryItemBySkuId(
    nextInventoryItems,
    reservation.skuId,
    reservation.siteId
  );
  const actionTime = params.occurredAt ?? nowIso$1();
  let inventoryChanged = false;
  let movementsChanged = false;
  if (params.action === "commit") {
    nextStatus = "committed";
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
          updatedAt: actionTime
        };
        inventoryChanged = true;
      }
      nextMovements.push({
        id: randomUUID(),
        itemId: inventoryItem.id,
        siteId: inventoryItem.siteId,
        type: "ship",
        quantity: reservation.allocatedQty,
        unit: inventoryItem.unit,
        reason: `Reservation committed (${reservation.reservationId})`,
        batchId: reservation.allocations[0]?.batchId,
        createdAt: actionTime
      });
      movementsChanged = true;
    }
  } else if (params.action === "release" || params.action === "expire") {
    nextStatus = params.action === "release" ? "released" : "expired";
    if (shouldMutateInventory && inventoryItem) {
      const index = nextInventoryItems.findIndex((item) => item.id === inventoryItem.id);
      if (index >= 0) {
        nextInventoryItems[index] = {
          ...nextInventoryItems[index],
          allocatedQty: Math.max(
            0,
            nextInventoryItems[index].allocatedQty - reservation.allocatedQty
          ),
          updatedAt: actionTime
        };
        inventoryChanged = true;
      }
      nextMovements.push({
        id: randomUUID(),
        itemId: inventoryItem.id,
        siteId: inventoryItem.siteId,
        type: "release",
        quantity: reservation.allocatedQty,
        unit: inventoryItem.unit,
        reason: `Reservation ${params.action} (${reservation.reservationId})`,
        batchId: reservation.allocations[0]?.batchId,
        createdAt: actionTime
      });
      movementsChanged = true;
    }
  }
  if (movementsChanged) {
    await writeInventoryMovements({
      ...movementState,
      movements: nextMovements
    });
  }
  const updatedInventoryState = inventoryChanged ? await writeInventoryState({
    ...inventoryState,
    items: nextInventoryItems
  }) : inventoryState;
  const availabilitySnapshot = buildAvailabilitySnapshotFromState({
    inventory: updatedInventoryState,
    batches: batchState,
    skuId: reservation.skuId,
    siteId: reservation.siteId
  });
  const result = {
    schemaVersion: "1.0.0",
    reservationId: reservation.reservationId,
    actionId,
    action: params.action,
    status: nextStatus,
    allocatedQty: reservation.allocatedQty,
    shortQty: reservation.shortQty,
    availabilitySnapshot,
    occurredAt: actionTime
  };
  const updatedReservation = {
    ...reservation,
    status: nextStatus,
    updatedAt: actionTime
  };
  const nextReservations = [...reservationState.reservations];
  nextReservations[reservationIndex] = updatedReservation;
  await writeReservationState({
    ...reservationState,
    reservations: nextReservations
  });
  const actionRecord = {
    schemaVersion: "1.0.0",
    actionId,
    reservationId: reservation.reservationId,
    orderId: params.orderId ?? reservation.orderId,
    lineId: params.lineId ?? reservation.lineId,
    action: params.action,
    reasonCode: params.reasonCode,
    reasonMessage: params.reasonMessage,
    occurredAt: actionTime,
    createdAt: nowIso$1(),
    result
  };
  await writeReservationActionsState({
    ...actionState,
    actions: [actionRecord, ...actionState.actions]
  });
  return result;
};
const normalizeName = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");
const normalizeCategory = (value) => {
  const next = String(value ?? "").trim().toLowerCase();
  if (next === "yeast" || next === "malt" || next === "hops" || next === "fruit" || next === "packaging" || next === "equipment") {
    return next;
  }
  return "other";
};
const extractRecipeRequirements = (recipe) => {
  const explicit = recipe.requirements ?? [];
  if (explicit.length > 0) {
    return explicit.map((entry) => ({
      name: String(entry.name ?? "Unknown Ingredient"),
      category: normalizeCategory(entry.category),
      requiredQty: Number.isFinite(Number(entry.requiredQty)) ? Number(entry.requiredQty) : void 0,
      unit: entry.unit ? String(entry.unit) : void 0
    }));
  }
  const inferred = [];
  for (const step of recipe.steps) {
    const action = String(step.action ?? "").toLowerCase();
    const name = String(step.name ?? "").toLowerCase();
    if (action.includes("hop") || name.includes("hop")) {
      inferred.push({ name: step.name, category: "hops" });
    } else if (action.includes("yeast") || name.includes("yeast")) {
      inferred.push({ name: step.name, category: "yeast" });
    } else if (action.includes("malt") || name.includes("malt") || name.includes("grain")) {
      inferred.push({ name: step.name, category: "malt" });
    } else if (action.includes("fruit") || name.includes("fruit")) {
      inferred.push({ name: step.name, category: "fruit" });
    }
  }
  return inferred.slice(0, 50);
};
const checkInventoryForRecipe = async (recipe, siteId = DEFAULT_SITE_ID) => {
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
    const byCategory = byName ?? siteItems.find((item) => item.category === requirement.category);
    if (!byCategory) {
      return {
        requirementName: requirement.name,
        category: requirement.category,
        requiredQty: requirement.requiredQty,
        requiredUnit: requirement.unit,
        status: "missing"
      };
    }
    const availableQty = Math.max(0, byCategory.onHandQty - byCategory.allocatedQty);
    if (typeof requirement.requiredQty === "number" && requirement.requiredQty > availableQty) {
      return {
        requirementName: requirement.name,
        category: requirement.category,
        requiredQty: requirement.requiredQty,
        requiredUnit: requirement.unit,
        matchedItemId: byCategory.id,
        matchedItemName: byCategory.name,
        availableQty,
        status: availableQty > 0 ? "low" : "missing"
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
        status: "low"
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
      status: "ok"
    };
  });
};
const createBatchFromRecipeRun = async (params) => {
  const state = await readBatchState();
  const existingLotCodes = new Set(
    state.batches.map((batch2) => String(batch2.lotCode).trim().toUpperCase())
  );
  const batch = {
    id: randomUUID(),
    skuId: params.skuId ? normalizeSkuId(params.skuId) : void 0,
    siteId: normalizeSiteId(params.siteId),
    lotCode: ensureUniqueLotCode(generateLotCode(), existingLotCodes),
    recipeId: params.recipeId,
    recipeName: params.recipeName,
    recipeRunId: params.recipeRunId,
    status: "in_progress",
    producedQty: 0,
    allocatedQty: 0,
    dispensedQty: 0,
    unit: params.expectedUnit ?? "L",
    createdAt: nowIso$1(),
    updatedAt: nowIso$1()
  };
  await writeBatchState({
    ...state,
    batches: [batch, ...state.batches]
  });
  return batch;
};
const createManualBatch = async (params) => {
  const recipeName = String(params.recipeName ?? "").trim();
  if (!recipeName) {
    throw new Error("recipeName is required.");
  }
  const state = await readBatchState();
  const existingLotCodes = new Set(
    state.batches.map((batch2) => String(batch2.lotCode).trim().toUpperCase())
  );
  const baseLotCode = normalizeLotCode(params.lotCode) ?? generateLotCode();
  const lotCode = ensureUniqueLotCode(baseLotCode, existingLotCodes);
  const producedQty = Number(params.producedQty);
  const batch = {
    id: randomUUID(),
    skuId: params.skuId ? normalizeSkuId(params.skuId) : void 0,
    siteId: normalizeSiteId(params.siteId),
    lotCode,
    recipeId: params.recipeId ? String(params.recipeId).trim() : void 0,
    recipeName,
    recipeRunId: params.recipeRunId ? String(params.recipeRunId).trim() : void 0,
    status: params.status === "in_progress" ? "in_progress" : "planned",
    producedQty: Number.isFinite(producedQty) ? Math.max(0, normalizeQty(producedQty)) : 0,
    allocatedQty: 0,
    dispensedQty: 0,
    unit: String(params.unit ?? "L").trim() || "L",
    createdAt: nowIso$1(),
    updatedAt: nowIso$1()
  };
  await writeBatchState({
    ...state,
    batches: [batch, ...state.batches]
  });
  return batch;
};
const reserveInventoryForRecipeRun = async (params) => {
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
    const quantity = typeof check.requiredQty === "number" && check.requiredQty > 0 ? check.requiredQty : 1;
    nextItems[itemIndex] = {
      ...nextItems[itemIndex],
      allocatedQty: nextItems[itemIndex].allocatedQty + quantity,
      updatedAt: nowIso$1()
    };
    movements.push({
      id: randomUUID(),
      itemId: nextItems[itemIndex].id,
      siteId: normalizeSiteId(nextItems[itemIndex].siteId),
      type: "allocate",
      quantity,
      unit: nextItems[itemIndex].unit,
      reason: `Reserved for recipe run ${params.recipeRunId}`,
      recipeId: params.recipe.id,
      recipeRunId: params.recipeRunId,
      batchId: params.batchId,
      createdAt: nowIso$1()
    });
  }
  await writeInventoryState({
    ...inventory,
    items: nextItems
  });
  await writeInventoryMovements({
    ...movementState,
    movements
  });
  return checks;
};
const resetRecipeRunSideEffects = async (recipeRunIds) => {
  const normalizedRunIds = (recipeRunIds ?? []).map((value) => String(value ?? "").trim()).filter(Boolean);
  if (normalizedRunIds.length === 0) {
    return {
      releasedQty: 0,
      updatedItems: 0,
      removedMovements: 0,
      removedBatches: 0
    };
  }
  const runIdSet = new Set(normalizedRunIds);
  const matchesRun = (recipeRunId) => {
    if (!recipeRunId) return false;
    return runIdSet.has(String(recipeRunId).trim());
  };
  const [inventoryState, movementState, batchState] = await Promise.all([
    readInventoryState(),
    readInventoryMovements(),
    readBatchState()
  ]);
  const releasedQtyByItem = /* @__PURE__ */ new Map();
  let removedMovements = 0;
  const keptMovements = movementState.movements.filter((movement) => {
    if (!matchesRun(movement.recipeRunId)) {
      return true;
    }
    removedMovements += 1;
    if (movement.type === "allocate") {
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
      updatedAt: nowIso$1()
    };
  });
  const nextBatches = batchState.batches.filter(
    (batch) => !matchesRun(batch.recipeRunId)
  );
  const removedBatches = batchState.batches.length - nextBatches.length;
  if (removedMovements > 0) {
    await writeInventoryMovements({
      ...movementState,
      movements: keptMovements
    });
  }
  if (updatedItems > 0) {
    await writeInventoryState({
      ...inventoryState,
      items: nextItems
    });
  }
  if (removedBatches > 0) {
    await writeBatchState({
      ...batchState,
      batches: nextBatches
    });
  }
  return {
    releasedQty: normalizeQty(releasedQty),
    updatedItems,
    removedMovements,
    removedBatches
  };
};
const updateBatchOutput = async (params) => {
  const state = await readBatchState();
  const idx = state.batches.findIndex((batch) => batch.id === params.batchId);
  if (idx < 0) return null;
  const current = state.batches[idx];
  const next = {
    ...current,
    producedQty: params.producedQty,
    status: params.status ?? current.status,
    completedAt: params.status === "completed" || params.status === "released" ? nowIso$1() : current.completedAt,
    releasedAt: params.status === "released" ? nowIso$1() : current.releasedAt,
    unit: params.unit ?? current.unit,
    updatedAt: nowIso$1()
  };
  const batches = [...state.batches];
  batches[idx] = next;
  await writeBatchState({
    ...state,
    batches
  });
  return next;
};
const buildInventorySummary = (items) => {
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
  return {
    totalItems,
    lowStockItems,
    onHandValue,
    allocatedValue,
    availableValue: Math.max(0, onHandValue - allocatedValue)
  };
};

const suiteIds$1 = ["os", "ops", "lab", "flow", "connect"];
const eventTypes = [
  "production",
  "inventory",
  "order",
  "delivery",
  "compliance",
  "schedule",
  "maintenance",
  "task",
  "note"
];
const eventStatuses = [
  "planned",
  "in_progress",
  "completed",
  "canceled",
  "blocked"
];
const eventPriorities = ["low", "medium", "high", "critical"];
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const resolveRepoRoot = () => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "apps", "os-ui"))) {
    return cwd;
  }
  if (cwd.endsWith(path.join("apps", "os-ui"))) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
};
const repoRoot = resolveRepoRoot();
const commissioningRoot = path.join(repoRoot, "commissioning");
const defaultFeed = (suite) => ({
  schemaVersion: "1.0.0",
  id: `calendar-events-${suite}`,
  updatedAt: nowIso(),
  events: []
});
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
const suiteFeedPath = (suite) => path.join(commissioningRoot, suite, "calendar-events.json");
const toText = (value) => {
  if (value === null || value === void 0) return void 0;
  const next = String(value).trim();
  return next.length > 0 ? next : void 0;
};
const toIso = (value) => {
  const text = toText(value);
  if (!text) return void 0;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return void 0;
  return parsed.toISOString();
};
const normalizeSuite = (value, fallback) => {
  const text = toText(value)?.toLowerCase();
  if (!text) return fallback;
  return suiteIds$1.find((suite) => suite === text) ?? fallback;
};
const normalizeStatus = (value) => {
  const text = toText(value)?.toLowerCase().replaceAll("-", "_");
  if (!text) return "planned";
  return eventStatuses.find((status) => status === text) ?? "planned";
};
const normalizeType = (value) => {
  const text = toText(value)?.toLowerCase().replaceAll("-", "_");
  if (!text) return "note";
  return eventTypes.find((type) => type === text) ?? "note";
};
const normalizePriority = (value) => {
  const text = toText(value)?.toLowerCase();
  if (!text) return void 0;
  return eventPriorities.find((priority) => priority === text);
};
const normalizeEvent = (input, suite, index) => {
  if (!input || typeof input !== "object") return null;
  const raw = input;
  const startAt = toIso(raw.startAt ?? raw.start_at ?? raw.date);
  const title = toText(raw.title ?? raw.name);
  if (!startAt || !title) return null;
  const id = toText(raw.id) ?? `${suite}-event-${index + 1}`;
  const schemaVersion = toText(raw.schemaVersion) ?? "1.0.0";
  const openPath = toText(raw.links?.openPath ?? raw.links?.open_path);
  const openUrl = toText(raw.links?.openUrl ?? raw.links?.open_url);
  const tags = Array.isArray(raw.tags) ? raw.tags.map((tag) => toText(tag)).filter((tag) => Boolean(tag)) : void 0;
  return {
    schemaVersion,
    id,
    sourceSuite: normalizeSuite(raw.sourceSuite ?? raw.source_suite, suite),
    sourceRecordId: toText(raw.sourceRecordId ?? raw.source_record_id),
    siteId: toText(raw.siteId ?? raw.site_id),
    title,
    description: toText(raw.description),
    type: normalizeType(raw.type),
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    startAt,
    endAt: toIso(raw.endAt ?? raw.end_at),
    timezone: toText(raw.timezone),
    allDay: typeof raw.allDay === "boolean" ? raw.allDay : void 0,
    tags,
    links: openPath || openUrl ? { openPath, openUrl } : void 0,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : void 0
  };
};
const readSuiteEvents = async (suite) => {
  const filePath = suiteFeedPath(suite);
  const parsed = await readJsonOrDefault(
    filePath,
    defaultFeed(suite)
  );
  const rawEvents = Array.isArray(parsed) ? parsed : Array.isArray(parsed.events) ? parsed.events : [];
  return rawEvents.map((event, index) => normalizeEvent(event, suite, index)).filter((event) => event !== null);
};
const buildCalendarEventId = () => `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const createCalendarEvent = async (input) => {
  const sourceSuite = normalizeSuite(input.sourceSuite, "os");
  const title = toText(input.title);
  if (!title) {
    throw new Error("Validation: title is required.");
  }
  const startAt = toIso(input.startAt);
  if (!startAt) {
    throw new Error("Validation: startAt must be a valid ISO date-time.");
  }
  const endAt = toIso(input.endAt);
  if (endAt && Date.parse(endAt) < Date.parse(startAt)) {
    throw new Error("Validation: endAt must be greater than or equal to startAt.");
  }
  const nextEvent = {
    schemaVersion: "1.0.0",
    id: toText(input.id) ?? buildCalendarEventId(),
    sourceSuite,
    sourceRecordId: toText(input.sourceRecordId),
    siteId: toText(input.siteId),
    title,
    description: toText(input.description),
    type: normalizeType(input.type),
    status: normalizeStatus(input.status),
    priority: normalizePriority(input.priority),
    startAt,
    endAt,
    timezone: toText(input.timezone),
    allDay: input.allDay === true ? true : void 0,
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => toText(tag)).filter((tag) => Boolean(tag)) : void 0,
    links: {
      openPath: toText(input.links?.openPath),
      openUrl: toText(input.links?.openUrl)
    },
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : void 0
  };
  if (!nextEvent.links?.openPath && !nextEvent.links?.openUrl) {
    delete nextEvent.links;
  }
  if (!nextEvent.tags || nextEvent.tags.length === 0) {
    delete nextEvent.tags;
  }
  const filePath = suiteFeedPath(sourceSuite);
  const parsed = await readJsonOrDefault(
    filePath,
    defaultFeed(sourceSuite)
  );
  const rawEvents = Array.isArray(parsed) ? parsed : Array.isArray(parsed.events) ? parsed.events : [];
  const events = rawEvents.map((event, index) => normalizeEvent(event, sourceSuite, index)).filter((event) => event !== null);
  const existing = events.find((event) => event.id === nextEvent.id);
  if (existing) {
    return {
      event: existing,
      idempotent: true
    };
  }
  events.push(nextEvent);
  events.sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt));
  const nextFeed = {
    schemaVersion: "1.0.0",
    id: Array.isArray(parsed) ? `calendar-events-${sourceSuite}` : toText(parsed.id) ?? `calendar-events-${sourceSuite}`,
    updatedAt: nowIso(),
    events
  };
  await writeJson(filePath, nextFeed);
  return {
    event: nextEvent,
    idempotent: false
  };
};
const mapRecipeRunStatus = (status) => {
  if (status === "running") return "in_progress";
  if (status === "paused" || status === "waiting_confirm") return "blocked";
  if (status === "completed") return "completed";
  if (status === "failed") return "blocked";
  if (status === "canceled") return "canceled";
  return "planned";
};
const mapBatchStatus = (status) => {
  if (status === "in_progress" || status === "allocated") return "in_progress";
  if (status === "completed" || status === "released" || status === "shipped") {
    return "completed";
  }
  if (status === "canceled") return "canceled";
  return "planned";
};
const buildOsDerivedEvents = async () => {
  const [recipeRuns, batchState] = await Promise.all([readRecipeRunsState(), readBatchState()]);
  const runEvents = (recipeRuns.runs ?? []).map((run) => ({
    schemaVersion: "1.0.0",
    id: `recipe-run-${run.runId}`,
    sourceSuite: "os",
    sourceRecordId: run.runId,
    title: `Recipe Run: ${run.recipeName}`,
    description: `Current stage index ${run.currentStepIndex + 1}.`,
    type: "production",
    status: mapRecipeRunStatus(run.status),
    startAt: run.startedAt,
    endAt: run.endedAt,
    links: {
      openPath: `/os/recipe-execution?runId=${encodeURIComponent(run.runId)}`
    },
    metadata: {
      recipeId: run.recipeId,
      status: run.status
    }
  }));
  const batchEvents = (batchState.batches ?? []).map((batch) => ({
    schemaVersion: "1.0.0",
    id: `batch-${batch.id}`,
    sourceSuite: "os",
    sourceRecordId: batch.id,
    siteId: batch.siteId,
    title: `Batch ${batch.lotCode}: ${batch.recipeName}`,
    description: `Status ${batch.status}. Produced ${batch.producedQty} ${batch.unit}.`,
    type: "inventory",
    status: mapBatchStatus(batch.status),
    startAt: batch.createdAt,
    endAt: batch.completedAt ?? batch.releasedAt,
    links: {
      openPath: "/os/batches"
    },
    metadata: {
      recipeRunId: batch.recipeRunId,
      status: batch.status
    }
  }));
  return [...runEvents, ...batchEvents];
};
const includesToken = (value, query) => value.toLowerCase().includes(query.toLowerCase());
const readUnifiedCalendarProjection = async (query) => {
  const manualBySuite = await Promise.all(suiteIds$1.map((suite) => readSuiteEvents(suite)));
  const manualEvents = manualBySuite.flat();
  const osDerivedEvents = await buildOsDerivedEvents();
  let events = [...manualEvents, ...osDerivedEvents];
  const fromMs = query?.from ? Date.parse(query.from) : void 0;
  const toMs = query?.to ? Date.parse(query.to) : void 0;
  const suiteFilter = query?.suite ?? [];
  const statusFilter = query?.statuses ?? [];
  const typeFilter = query?.types ?? [];
  const siteIdFilter = toText(query?.siteId)?.toLowerCase();
  const search = toText(query?.search)?.toLowerCase();
  events = events.filter((event) => {
    const startMs = Date.parse(event.startAt);
    if (!Number.isFinite(startMs)) return false;
    if (fromMs !== void 0 && Number.isFinite(fromMs) && startMs < fromMs) return false;
    if (toMs !== void 0 && Number.isFinite(toMs) && startMs > toMs) return false;
    if (suiteFilter.length > 0 && !suiteFilter.includes(event.sourceSuite)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(event.status)) return false;
    if (typeFilter.length > 0 && !typeFilter.includes(event.type)) return false;
    if (siteIdFilter && (event.siteId ?? "").toLowerCase() !== siteIdFilter) return false;
    if (search) {
      const haystack = [
        event.title,
        event.description ?? "",
        event.sourceRecordId ?? "",
        event.type,
        event.status,
        event.sourceSuite
      ].join(" ");
      if (!includesToken(haystack, search)) return false;
    }
    return true;
  });
  events.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const bySuite = Object.fromEntries(
    suiteIds$1.map((suite) => [suite, 0])
  );
  const byStatus = Object.fromEntries(
    eventStatuses.map((status) => [status, 0])
  );
  for (const event of events) {
    bySuite[event.sourceSuite] += 1;
    byStatus[event.status] += 1;
  }
  return {
    events,
    summary: {
      total: events.length,
      bySuite,
      byStatus
    }
  };
};

const suiteIds = ["os", "ops", "lab", "flow", "connect"];
const statuses = [
  "planned",
  "in_progress",
  "completed",
  "canceled",
  "blocked"
];
const types = [
  "production",
  "inventory",
  "order",
  "delivery",
  "compliance",
  "schedule",
  "maintenance",
  "task",
  "note"
];
const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  return String(value).split(",").map((entry) => entry.trim()).filter(Boolean);
};
async function handler(req, res) {
  try {
    const suite = toList(req.query.suite).filter(
      (value) => suiteIds.includes(value)
    );
    const statusList = toList(req.query.statuses).filter(
      (value) => statuses.includes(value)
    );
    const typeList = toList(req.query.types).filter(
      (value) => types.includes(value)
    );
    const projection = await readUnifiedCalendarProjection({
      from: typeof req.query.from === "string" ? req.query.from : void 0,
      to: typeof req.query.to === "string" ? req.query.to : void 0,
      suite: suite.length > 0 ? suite : void 0,
      statuses: statusList.length > 0 ? statusList : void 0,
      types: typeList.length > 0 ? typeList : void 0,
      siteId: typeof req.query.siteId === "string" ? req.query.siteId : void 0,
      search: typeof req.query.search === "string" ? req.query.search : void 0
    });
    return res.status(200).json({
      success: true,
      data: projection
    });
  } catch (error) {
    console.error("Failed to read calendar events:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to read calendar events."
    });
  }
}

export { readBatchState as a, buildAvailabilitySnapshot as b, createCalendarEvent as c, buildInventorySummary as d, createManualBatch as e, readInventoryMovements as f, writeBatchState as g, handler as h, writeInventoryMovements as i, checkInventoryForRecipe as j, createBatchFromRecipeRun as k, reserveInventoryForRecipeRun as l, resetRecipeRunSideEffects as m, createInventoryReservation as n, applyInventoryReservationAction as o, readInventoryState as r, updateBatchOutput as u, writeInventoryState as w };
