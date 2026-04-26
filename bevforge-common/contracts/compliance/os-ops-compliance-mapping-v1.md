# OS -> OPS Compliance Mapping (v1)

This mapping defines how current OS records project into the compliance contracts so OPS can produce regulator-facing packets.

## Intent

- Keep OS as source of truth for physical truth/events.
- Keep OPS as source of truth for compliance workflow and filing outputs.
- Avoid duplicate quantity ledgers in OPS.

## Contract Targets

- Event record: `compliance-event.schema.json`
- Feed transfer: `compliance-feed.schema.json`
- Filing packet: `compliance-period-report.schema.json`

## Deterministic Event ID Rules (Required)

OS must generate `complianceEvent.id` deterministically from source records so OPS ingestion is idempotent.

Canonical formulas:
- Batch status snapshot: `os:batch:{batchId}:{status}`
- Inventory movement: `os:movement:{movementId}`
- Recipe run lifecycle note: `os:recipe-run:{runId}:{status}`
- Recipe reading: `os:reading:{readingId}`
- Reservation snapshot: `os:reservation:{reservationId}`
- Reservation action: `os:reservation-action:{actionId}`
- Transfer run completion: `os:transfer-run:{runId}:completed`
- Transfer run loss: `os:transfer-run:{runId}:loss`
- Packaging run completion note: `os:packaging-run:{runId}:completed`
- Packaging run loss: `os:packaging-run:{runId}:loss`
- FLOW pour projection: `os:flow-pour:{eventId}`
- Manual/internal note: `os:manual:{sourceRecordId}:{occurredAtIso}`

Normalization rules:
- IDs are lower-case except original source IDs where case is meaningful.
- Components are joined by `:`.
- No random UUID generation in compliance-feed projection.
- Same source record + same mapped event intent must always yield the same ID.

## Source Mapping

### Batch state

Source:
- `commissioning/os/batch-state.json`
- API: `GET /api/os/batches`

Mapping:
- `batch.id` -> `complianceEvent.batchId`
- deterministic `complianceEvent.id` -> `os:batch:{batch.id}:{batch.status}`
- `batch.lotCode` -> `complianceEvent.lotCode`
- `batch.recipeRunId` -> `complianceEvent.recipeRunId`
- `batch.siteId` -> `complianceEvent.siteId`
- `batch.status` transitions -> `eventType`
  - `planned` -> `batch_planned`
  - `in_progress` -> `batch_started`
  - `completed` -> `batch_completed`
  - `released` -> `batch_released`
  - `shipped` -> `batch_shipped`
- `batch.producedQty` + `batch.unit` -> `quantity.value` + `quantity.uom` (`direction: in` for production)

### Inventory movement ledger

Source:
- `commissioning/os/inventory-movements.json`
- API: `GET /api/os/inventory/movements`

Mapping:
- deterministic `complianceEvent.id` -> `os:movement:{movement.id}`
- `movement.itemId` -> `complianceEvent.itemId`
- `movement.batchId` -> `complianceEvent.batchId`
- `movement.recipeRunId` -> `complianceEvent.recipeRunId`
- `movement.siteId` -> `complianceEvent.siteId`
- `movement.quantity` + `movement.unit` -> `quantity.value` + `quantity.uom`
- `movement.reason` -> `reasonMessage`
- `movement.type` -> `eventType` + `quantity.direction`
  - `consume` -> `inventory_consumed` (`out`)
  - `produce` -> `inventory_produced` (`in`)
  - `adjust` -> `inventory_adjusted` (`none`)
  - `ship` -> `inventory_shipped` (`out`)
  - `allocate`/`release` -> internal operational events (optional compliance inclusion by policy)

### Recipe runs and steps

Source:
- `commissioning/os/recipe-runs.json`
- API: `GET /api/os/recipes/runs`

Mapping:
- deterministic `complianceEvent.id` -> `os:recipe-run:{run.runId}:{run.status}`
- `run.runId` -> `complianceEvent.recipeRunId`
- `run.recipeId` -> `complianceEvent.recipeId`
- `run.status`/step transitions -> optional `compliance_note` or production stage events
- `run.startedAt`, `step.startedAt`, `step.endedAt` -> `occurredAt`/`recordedAt`

### Brewday readings

Source:
- `commissioning/os/recipe-readings.json`
- API: `GET /api/os/recipes/run/:runId/readings`

Mapping:
- deterministic `complianceEvent.id` -> `os:reading:{reading.id}`
- `reading.runId` -> `complianceEvent.recipeRunId`
- `reading.kind` -> measurement field routing:
  - `sg`/`og`/`fg` -> `measurements.sg`/`measurements.fg` as policy-defined
  - `temp`/`snapshot` -> `measurements.temperatureC`
  - `abv` -> `measurements.abvPct`
  - `ph` -> `measurements.ph`
  - `brix` -> `measurements.brix`
  - `ta` -> `measurements.titratableAcidityGpl`
  - `so2` -> `measurements.so2Ppm`
- `reading.recordedAt` -> `occurredAt`
- `reading.createdAt` -> `recordedAt`

### Transfer runs

Source:
- `commissioning/os/transfer-runs.json`
- API: `GET /api/os/compliance/feed`

Mapping:
- deterministic completion event ID -> `os:transfer-run:{run.id}:completed`
- deterministic loss event ID -> `os:transfer-run:{run.id}:loss`
- `run.sourceBatchId` -> `complianceEvent.batchId`
- `run.sourceLotCode` -> `complianceEvent.lotCode`
- `run.siteId` -> `complianceEvent.siteId`
- completed transfer total -> `quantity.value` + `quantity.uom` (`direction: none`)
- `run.lossQty` -> `loss_recorded` quantity (`direction: out`) when greater than zero
- destination details, child batches, and treatment metadata -> `metadata`

### Packaging runs

Source:
- `commissioning/os/packaging-runs.json`
- API: `GET /api/os/compliance/feed`

Mapping:
- deterministic completion note ID -> `os:packaging-run:{run.id}:completed`
- deterministic loss event ID -> `os:packaging-run:{run.id}:loss`
- `run.sourceBatchId` -> `complianceEvent.batchId`
- `run.packageLotCode` -> `complianceEvent.lotCode`
- `run.outputSkuId` -> `complianceEvent.skuId`
- completed package count -> `quantity.value` + `quantity.uom` (`direction: in`, `uom: units`)
- `run.lossQty` -> `loss_recorded` quantity (`direction: out`) when greater than zero
- compliance snapshot, package lot, and package format metadata -> `metadata`

### Fulfillment reservations/actions

Source:
- `commissioning/os/reservation-state.json`
- `commissioning/os/reservation-actions.json`
- APIs:
  - `POST /api/os/reservations`
  - `POST /api/os/reservations/:reservationId/action`

Mapping:
- deterministic reservation event IDs:
  - reservation projection -> `os:reservation:{reservation.reservationId}`
  - reservation action projection -> `os:reservation-action:{action.actionId}`
- Reservation and action IDs -> `reservationId`, `sourceRecord.recordId`
- `orderId`, `lineId`, `skuId`, `siteId` -> direct fields
- Action mapping:
  - `commit` -> `reservation_committed`
  - `release` -> `reservation_released`
  - `expire` -> `reservation_released` with `reasonCode=reservation_timeout`

### FLOW pour events (when enabled)

Source:
- `commissioning/os/flow-pour-events.json`
- API: `POST /api/os/flow/pour-events`, `GET /api/os/flow/pour-events`

Mapping:
- deterministic `complianceEvent.id` -> `os:flow-pour:{event.eventId}`
- `sourceSuite` remains `os`; set `sourceRecord.originSuite` to `flow`
- `event.siteId`, `event.skuId`, `event.batchId` -> direct fields
- `event.volume` + `event.uom` -> `quantity.value` + `quantity.uom` (`direction: out`)
- `event.occurredAt` -> `occurredAt`
- `result.processedAt` -> `recordedAt`
- Event type -> `pour_recorded`

## Regulatory Tagging Guidance (v1)

Recommended defaults:
- Production in: `ttb_production`, `abc_inventory`
- Storage/transfer: `ttb_storage_transfer`, `abc_transfer`
- Ship/removal/pour out: `ttb_removal`, `abc_sale`
- Loss/destruction: `ttb_loss` / `ttb_destruction`

Final tagging policy is owned by OPS compliance configuration per jurisdiction.

## Known Gaps (Current State)

Current OS data does not yet enforce:
- Jurisdiction permit metadata on every event.
- Mandatory reason-code vocabularies for every loss/destruction scenario.
- Sign-off/attestation workflow fields on source events.

These are expected to be added in v2 as OS event enrichment and OPS workflow constraints.
