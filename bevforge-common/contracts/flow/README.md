# FLOW Contracts

This contract set defines BevForge FLOW data for taproom runtime, pour telemetry, and customer-facing serving views.

## Authority Boundaries
- FLOW owns tap runtime state, pour events, kiosk/menu presentation, and self-serve session control.
- OS remains source of truth for physical quantity, batch state, and depletion ledger.
- OPS remains source of truth for order lifecycle, commercial accounting, and delivery/compliance records.
- CONNECT remains source of truth for employee communication, tasks, and CRM communication workflows.

## Integration Model
- FLOW kiosk cards and menu tiles should resolve through `tapAssignmentId`, then through tap/runtime hardware targets.
- FLOW emits idempotent pour events (`eventId`) and references `siteId`, `tapId`, `assignmentId`, `skuId`, and optional `batchId`.
- FLOW should preserve `productId`, `productCode`, `packageLotId`, `packageLotCode`, `assetId`, `assetCode`, and `labelVersionId` when they are available from OS mirrors.
- OS validates and commits accepted depletion from FLOW events.
- OPS can consume FLOW serving analytics for sales visibility but should not treat FLOW as invoice source.

## Files
- `tap.schema.json`
- `keg-assignment.schema.json`
- `pour-event.schema.json`
- `session.schema.json`
- `menu-item.schema.json`

## Recommended OS Endpoints
- `POST /api/os/flow/publish`
- `GET /api/os/flow/profile?siteId=<id>&kioskId=<id>`
- `GET /api/os/flow/profiles?siteId=<id>`
- `POST /api/os/flow/pour-events`
- `GET /api/os/flow/pour-events?siteId=<id>`
- `POST /api/os/flow/runtime-state`
- `GET /api/os/flow/runtime-state?siteId=<id>&kioskId=<id>`

## Commissioning Storage (JSON-on-disk)
Recommended defaults:
- `commissioning/flow/taps.json`
- `commissioning/flow/keg-assignments.json`
- `commissioning/flow/tap-assignments.json`
- `commissioning/flow/product-catalog-mirror.json`
- `commissioning/flow/pour-events.json`
- `commissioning/flow/sessions.json`
- `commissioning/flow/menu-items.json`
