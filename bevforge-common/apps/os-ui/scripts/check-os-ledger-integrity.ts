import {
  readBatchState,
  readInventoryMovements,
  readInventoryState,
  readReservationActionsState,
  readReservationState,
  type BatchRecord,
  type InventoryItemRecord,
  type ReservationRecord,
} from '../src/server/lib/inventory-batch-store.js';
import { readRecipeRunsState } from '../src/server/lib/commissioning-store.js';
import { readRecipeRunReadingsState } from '../src/server/lib/recipe-readings-store.js';
import { listFlowPourEvents } from '../src/server/lib/flow-store.js';

type Severity = 'error' | 'warning';

interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const pushFinding = (
  findings: Finding[],
  severity: Severity,
  code: string,
  message: string
) => {
  findings.push({ severity, code, message });
};

const checkDuplicateIds = (
  findings: Finding[],
  label: string,
  entries: Array<unknown>,
  idSelector: (entry: unknown) => string
) => {
  const seen = new Set<string>();
  for (const entry of entries) {
    const id = String(idSelector(entry) ?? '').trim();
    if (!id) {
      pushFinding(findings, 'error', `${label}.id.missing`, `${label} contains blank id.`);
      continue;
    }
    if (seen.has(id)) {
      pushFinding(
        findings,
        'error',
        `${label}.id.duplicate`,
        `${label} contains duplicate id ${id}.`
      );
      continue;
    }
    seen.add(id);
  }
};

const checkInventory = (findings: Finding[], items: InventoryItemRecord[]) => {
  const skuBySite = new Set<string>();
  for (const item of items) {
    const onHand = Number(item.onHandQty);
    const allocated = Number(item.allocatedQty);
    if (!isFiniteNumber(onHand) || onHand < 0) {
      pushFinding(
        findings,
        'error',
        'inventory.onHand.invalid',
        `Inventory item ${item.id} has invalid onHandQty ${String(item.onHandQty)}.`
      );
    }
    if (!isFiniteNumber(allocated) || allocated < 0) {
      pushFinding(
        findings,
        'error',
        'inventory.allocated.invalid',
        `Inventory item ${item.id} has invalid allocatedQty ${String(item.allocatedQty)}.`
      );
    }
    if (isFiniteNumber(onHand) && isFiniteNumber(allocated) && allocated > onHand) {
      pushFinding(
        findings,
        'error',
        'inventory.allocated.gt_onhand',
        `Inventory item ${item.id} allocatedQty ${allocated} exceeds onHandQty ${onHand}.`
      );
    }

    const skuSite = `${String(item.siteId).trim().toLowerCase()}::${String(item.skuId)
      .trim()
      .toUpperCase()}`;
    if (skuBySite.has(skuSite)) {
      pushFinding(
        findings,
        'warning',
        'inventory.sku_site.duplicate',
        `Multiple inventory rows share skuId ${item.skuId} at site ${item.siteId}.`
      );
    } else {
      skuBySite.add(skuSite);
    }
  }
};

const checkBatches = (findings: Finding[], batches: BatchRecord[]) => {
  const lotCodes = new Set<string>();
  for (const batch of batches) {
    const produced = Number(batch.producedQty);
    const allocated = Number(batch.allocatedQty);
    const dispensed = Number(batch.dispensedQty ?? 0);

    if (!isFiniteNumber(produced) || produced < 0) {
      pushFinding(
        findings,
        'error',
        'batch.produced.invalid',
        `Batch ${batch.id} has invalid producedQty ${String(batch.producedQty)}.`
      );
    }
    if (!isFiniteNumber(allocated) || allocated < 0) {
      pushFinding(
        findings,
        'error',
        'batch.allocated.invalid',
        `Batch ${batch.id} has invalid allocatedQty ${String(batch.allocatedQty)}.`
      );
    }
    if (!isFiniteNumber(dispensed) || dispensed < 0) {
      pushFinding(
        findings,
        'error',
        'batch.dispensed.invalid',
        `Batch ${batch.id} has invalid dispensedQty ${String(batch.dispensedQty)}.`
      );
    }

    const lotCode = String(batch.lotCode ?? '').trim().toUpperCase();
    if (lotCode) {
      if (lotCodes.has(lotCode)) {
        pushFinding(
          findings,
          'warning',
          'batch.lot.duplicate',
          `Duplicate lotCode detected: ${lotCode}.`
        );
      } else {
        lotCodes.add(lotCode);
      }
    }

    if (isFiniteNumber(produced) && isFiniteNumber(allocated) && isFiniteNumber(dispensed)) {
      const available = round6(produced - allocated - dispensed);
      if (available < 0) {
        const severity: Severity =
          batch.status === 'completed' || batch.status === 'released' || batch.status === 'shipped'
            ? 'error'
            : 'warning';
        pushFinding(
          findings,
          severity,
          'batch.available.negative',
          `Batch ${batch.id} (${batch.lotCode}) has negative available quantity (${available}).`
        );
      }
    }
  }
};

const checkReservations = (
  findings: Finding[],
  reservations: ReservationRecord[],
  inventoryBySkuSite: Set<string>
) => {
  const requestIds = new Set<string>();
  const reservationIds = new Set<string>();

  for (const reservation of reservations) {
    const requestId = String(reservation.requestId ?? '').trim();
    const reservationId = String(reservation.reservationId ?? '').trim();
    if (requestId) {
      if (requestIds.has(requestId)) {
        pushFinding(
          findings,
          'error',
          'reservation.requestId.duplicate',
          `Duplicate reservation requestId ${requestId}.`
        );
      } else {
        requestIds.add(requestId);
      }
    }
    if (reservationId) {
      if (reservationIds.has(reservationId)) {
        pushFinding(
          findings,
          'error',
          'reservation.id.duplicate',
          `Duplicate reservationId ${reservationId}.`
        );
      } else {
        reservationIds.add(reservationId);
      }
    }

    const requested = Number(reservation.requestedQty);
    const allocated = Number(reservation.allocatedQty);
    const short = Number(reservation.shortQty);
    if (!isFiniteNumber(requested) || requested <= 0) {
      pushFinding(
        findings,
        'error',
        'reservation.requested.invalid',
        `Reservation ${reservation.reservationId} has invalid requestedQty ${String(
          reservation.requestedQty
        )}.`
      );
    }
    if (!isFiniteNumber(allocated) || allocated < 0) {
      pushFinding(
        findings,
        'error',
        'reservation.allocated.invalid',
        `Reservation ${reservation.reservationId} has invalid allocatedQty ${String(
          reservation.allocatedQty
        )}.`
      );
    }
    if (!isFiniteNumber(short) || short < 0) {
      pushFinding(
        findings,
        'error',
        'reservation.short.invalid',
        `Reservation ${reservation.reservationId} has invalid shortQty ${String(
          reservation.shortQty
        )}.`
      );
    }
    if (isFiniteNumber(requested) && isFiniteNumber(allocated) && isFiniteNumber(short)) {
      const diff = Math.abs(round6(requested) - round6(allocated + short));
      if (diff > 0.000001) {
        pushFinding(
          findings,
          'error',
          'reservation.qty.mismatch',
          `Reservation ${reservation.reservationId} violates requested=allocated+short.`
        );
      }
    }

    if (reservation.response.requestId !== reservation.requestId) {
      pushFinding(
        findings,
        'error',
        'reservation.response.requestId.mismatch',
        `Reservation ${reservation.reservationId} response.requestId mismatch.`
      );
    }
    if (reservation.response.reservationId !== reservation.reservationId) {
      pushFinding(
        findings,
        'error',
        'reservation.response.reservationId.mismatch',
        `Reservation ${reservation.reservationId} response.reservationId mismatch.`
      );
    }

    const skuSite = `${String(reservation.siteId).trim().toLowerCase()}::${String(
      reservation.skuId
    )
      .trim()
      .toUpperCase()}`;
    if (!inventoryBySkuSite.has(skuSite)) {
      pushFinding(
        findings,
        'warning',
        'reservation.inventory.missing_sku_site',
        `Reservation ${reservation.reservationId} references missing sku/site ${reservation.skuId} @ ${reservation.siteId}.`
      );
    }
  }
};

async function main() {
  const findings: Finding[] = [];
  const startedAt = Date.now();

  const [
    inventoryState,
    movementState,
    batchState,
    reservationState,
    reservationActionsState,
    recipeRunsState,
    readingsState,
    flowPourEvents,
  ] = await Promise.all([
    readInventoryState(),
    readInventoryMovements(),
    readBatchState(),
    readReservationState(),
    readReservationActionsState(),
    readRecipeRunsState(),
    readRecipeRunReadingsState(),
    listFlowPourEvents({ limit: 10_000 }),
  ]);

  checkDuplicateIds(findings, 'inventory.item', inventoryState.items, (entry) =>
    String((entry as { id?: string }).id ?? '')
  );
  checkDuplicateIds(findings, 'inventory.movement', movementState.movements, (entry) =>
    String((entry as { id?: string }).id ?? '')
  );
  checkDuplicateIds(findings, 'batch', batchState.batches, (entry) =>
    String((entry as { id?: string }).id ?? '')
  );
  checkDuplicateIds(findings, 'recipe.run', recipeRunsState.runs, (entry) =>
    String((entry as { runId?: string }).runId ?? '')
  );
  checkDuplicateIds(findings, 'recipe.reading', readingsState.readings, (entry) =>
    String((entry as { id?: string }).id ?? '')
  );
  checkDuplicateIds(findings, 'flow.pour', flowPourEvents, (entry) =>
    String((entry as { event?: { eventId?: string } }).event?.eventId ?? '')
  );
  checkDuplicateIds(findings, 'reservation.action', reservationActionsState.actions, (entry) =>
    String((entry as { actionId?: string }).actionId ?? '')
  );

  checkInventory(findings, inventoryState.items);
  checkBatches(findings, batchState.batches);

  const inventoryItemsById = new Set(inventoryState.items.map((item) => item.id));
  const inventoryBySkuSite = new Set(
    inventoryState.items.map(
      (item) => `${String(item.siteId).trim().toLowerCase()}::${String(item.skuId).trim().toUpperCase()}`
    )
  );
  const batchIds = new Set(batchState.batches.map((batch) => batch.id));
  const runById = new Map(recipeRunsState.runs.map((run) => [run.runId, run]));
  const reservationById = new Set(reservationState.reservations.map((reservation) => reservation.reservationId));

  for (const movement of movementState.movements) {
    if (!isFiniteNumber(Number(movement.quantity)) || Number(movement.quantity) <= 0) {
      pushFinding(
        findings,
        'error',
        'movement.quantity.invalid',
        `Movement ${movement.id} has invalid quantity ${String(movement.quantity)}.`
      );
    }
    if (!inventoryItemsById.has(movement.itemId)) {
      pushFinding(
        findings,
        'error',
        'movement.item.missing',
        `Movement ${movement.id} references unknown item ${movement.itemId}.`
      );
    }
    if (movement.batchId && !batchIds.has(movement.batchId)) {
      pushFinding(
        findings,
        'warning',
        'movement.batch.missing',
        `Movement ${movement.id} references missing batch ${movement.batchId}.`
      );
    }
    if (movement.recipeRunId && !runById.has(movement.recipeRunId)) {
      pushFinding(
        findings,
        'warning',
        'movement.run.missing',
        `Movement ${movement.id} references missing recipe run ${movement.recipeRunId}.`
      );
    }
  }

  for (const run of recipeRunsState.runs) {
    if (!Array.isArray(run.steps)) {
      pushFinding(findings, 'error', 'run.steps.invalid', `Run ${run.runId} has invalid step list.`);
      continue;
    }
    if (run.steps.length === 0 && run.status !== 'completed') {
      pushFinding(
        findings,
        'warning',
        'run.steps.empty',
        `Run ${run.runId} has zero steps but status ${run.status}.`
      );
    }
    if (run.currentStepIndex >= run.steps.length && run.status !== 'completed') {
      pushFinding(
        findings,
        'error',
        'run.step_index.out_of_range',
        `Run ${run.runId} currentStepIndex ${run.currentStepIndex} outside step range ${run.steps.length}.`
      );
    }
  }

  for (const reading of readingsState.readings) {
    const run = runById.get(reading.runId);
    if (!run) {
      pushFinding(
        findings,
        'warning',
        'reading.run.missing',
        `Reading ${reading.id} references missing run ${reading.runId}.`
      );
      continue;
    }
    if (
      reading.stepId &&
      !run.steps.some((step) => String(step.id).trim() === String(reading.stepId).trim())
    ) {
      pushFinding(
        findings,
        'warning',
        'reading.step.missing',
        `Reading ${reading.id} references missing step ${reading.stepId} in run ${reading.runId}.`
      );
    }
  }

  checkReservations(findings, reservationState.reservations, inventoryBySkuSite);

  for (const action of reservationActionsState.actions) {
    if (!reservationById.has(action.reservationId)) {
      pushFinding(
        findings,
        'warning',
        'reservation.action.orphan',
        `Reservation action ${action.actionId} references missing reservation ${action.reservationId}.`
      );
    }
    if (action.result.reservationId !== action.reservationId) {
      pushFinding(
        findings,
        'error',
        'reservation.action.result.mismatch',
        `Reservation action ${action.actionId} result.reservationId mismatch.`
      );
    }
  }

  for (const record of flowPourEvents) {
    if (!record.event.eventId || !String(record.event.eventId).trim()) {
      pushFinding(findings, 'error', 'flow.eventId.missing', 'FLOW pour event has blank eventId.');
    }
    if (record.event.batchId && !batchIds.has(record.event.batchId)) {
      pushFinding(
        findings,
        'warning',
        'flow.batch.missing',
        `FLOW event ${record.event.eventId} references missing batch ${record.event.batchId}.`
      );
    }
  }

  const errors = findings.filter((finding) => finding.severity === 'error');
  const warnings = findings.filter((finding) => finding.severity === 'warning');
  const finishedAt = Date.now();

  const summary = {
    success: errors.length === 0,
    durationMs: finishedAt - startedAt,
    counts: {
      inventoryItems: inventoryState.items.length,
      movements: movementState.movements.length,
      batches: batchState.batches.length,
      recipeRuns: recipeRunsState.runs.length,
      readings: readingsState.readings.length,
      reservations: reservationState.reservations.length,
      reservationActions: reservationActionsState.actions.length,
      flowPourEvents: flowPourEvents.length,
    },
    findings: {
      errors: errors.length,
      warnings: warnings.length,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
  for (const finding of findings) {
    const level = finding.severity.toUpperCase();
    console.log(`[${level}] ${finding.code}: ${finding.message}`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
