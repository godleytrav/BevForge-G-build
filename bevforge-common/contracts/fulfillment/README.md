# OPS/OS Fulfillment Contracts

This contract set defines how OPS (orders/logistics) and OS (inventory/batches) exchange fulfillment data.

## Authority Model
- OPS is source of truth for customer orders, order lifecycle, and delivery workflow state.
- OS is source of truth for physical inventory quantities, lot/batch availability, and reservation/commit effects.
- OPS never directly mutates OS quantity state.

## Core Flow
1. OPS creates or updates an order in OPS storage.
2. OPS asks OS to reserve inventory for each order line and target `siteId`.
3. OS returns reserved lots/quantities or a shortage result.
4. OPS can commit reservations at pick/ship time, or release reservations on cancel/edit.
5. OS updates inventory/batch ledgers and exposes availability back to OPS.

## Contract Files
- `ops-order.schema.json`: OPS-owned order object shape.
- `allocation-request.schema.json`: OPS -> OS reservation request.
- `allocation-response.schema.json`: OS -> OPS reservation result.
- `reservation-action.schema.json`: OPS -> OS reservation commit/release/expire action.
- `availability-snapshot.schema.json`: OS availability view returned to OPS.
- `fulfillment-request.schema.json`: OPS -> OS production/packaging queue request.
- `package-lot.schema.json`: OS package-level lot genealogy contract.

## Recommended API Shape
- `GET /api/os/availability?skuId=<id>&siteId=<id>`
- `POST /api/os/reservations`
- `POST /api/os/reservations/:reservationId/action`
- `GET /api/os/fulfillment/requests`
- `POST /api/os/fulfillment/requests`
- `POST /api/os/fulfillment/requests/:requestId/action`
- `GET /api/os/fulfillment/outbox?cursor=<n>&limit=<n>&siteId=<id>`
- `GET /api/os/package-lots`
- `POST /api/os/package-lots`
- `GET /api/os/batches/:batchId/lineage`

## Multi-Site Rule
- Site partitioning is enforced in OS inventory/reservation logic.
- Availability and reservation decisions are scoped to `siteId`.
- Cross-site balancing must happen as explicit OS transfer operations, not implicit shared pooling.

## Idempotency and Audit
- OPS should send stable request IDs (`requestId` / `actionId`) per logical operation.
- OS should treat duplicate IDs as idempotent and return the original result.
- OS should persist inventory movement and reservation audit trails.
- `POST /api/os/fulfillment/requests/:requestId/action` accepts optional `actionId` for idempotent retries.

## Linkage Safety Rules
- Fulfillment request links (`link_batch`, `link_package_lot`) are site-scoped.
- OS rejects cross-site link attempts with a conflict response to prevent mixed-site genealogy.
- Linking a package lot also links its parent batch for full traceability.
- Availability and package-lot payloads should expose `packageLotCode` and `batchCode` whenever OS has them, with UUID fields retained as machine linkage.
- Allocation payloads should keep `skuId` batch-agnostic and prefer `packageLotId` / `packageLotCode` over ambiguous lot-only fields whenever packaged inventory is being reserved.

## Transition + Effects Rules
- Request actions enforce server-side transition validity (`queued -> accepted/start/block/cancel/reject`, etc.).
- `complete` executes inventory/lot effects in OS ledgers (not just request status changes).
- Production completion can auto-create a batch when no linked batch exists.
- Packaging completion requires a linked source batch or package lot.

## Outbox Feed
- OS emits fulfillment outbox events for queue/action changes to support OPS sync.
- Cursor ordering is monotonic (`cursor` integer); consumers should request `cursor > lastSeen`.
- Duplicate `actionId` retries do not emit duplicate outbox events.
