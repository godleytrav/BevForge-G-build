# FLOW Production Backlog

This backlog operationalizes FLOW from MVP UI to production-grade edge runtime while preserving suite boundaries:

- FLOW: tap runtime, kiosk UX, pour telemetry
- OS: quantity/depletion/batch source of truth
- OPS: wallet/account/order/commerce source of truth

## Release Gates

### Gate A: Runtime Integrity
- Backend outbox replaces browser-only queue.
- Idempotent `eventId` enforced server-side.
- Queue replay and retry behavior validated.

### Gate B: Cross-Suite Authority
- OPS authorize-pour integration active (no stubs in live path).
- OS depletion acceptance pipeline active and persisted.
- FLOW UI never claims inventory truth without OS acceptance.

### Gate C: Operability
- Hardware path validated on real devices.
- Alerts, logs, and recovery runbooks are live.
- Pilot site metrics meet SLO targets.

## Epic 1: FLOW Runtime Backend Outbox (Phase 1)

### FLOW-101: Build JSON-backed FLOW runtime store
Status: In progress
Scope:
- Add `flow-runtime-store` server library.
- Read/write `commissioning/flow/*.json` + runtime outbox state.
- Normalize and validate core FLOW contract fields.
Acceptance Criteria:
- Reads/writes are atomic per file operation.
- Missing store files auto-initialize.
- Invalid payloads return explicit errors.

### FLOW-102: Add idempotent pour-event enqueue API
Status: In progress
Scope:
- `POST /api/flow/pour-events` to queue events by `eventId`.
- Duplicate `eventId` returns existing queued/committed item.
Acceptance Criteria:
- Duplicate enqueue is a no-op with deterministic response.
- Required fields validated: `eventId`, `siteId`, `tapId`, `volume`, `uom`, `sourceMode`.

### FLOW-103: Add sync status and sync-pass APIs
Status: In progress
Scope:
- `GET /api/flow/runtime` for queue/runtime snapshot.
- `POST /api/flow/sync` to set sync mode and run sync pass.
Acceptance Criteria:
- Sync modes supported: `online`, `offline`, `retrying`.
- Sync pass updates queue statuses and summary counters.

### FLOW-104: Wire FLOW UI runtime context to backend APIs
Status: In progress
Scope:
- Replace localStorage-only queue with API-backed queue.
- Add optimistic enqueue + polling/refresh in runtime context.
Acceptance Criteria:
- Page reload preserves queue state via backend.
- UI still works when backend is temporarily unavailable.

## Epic 2: OPS Authorize-Pour Integration (Phase 2)

### FLOW-201: Replace kiosk auth stub with OPS API client
Status: Pending
Acceptance Criteria:
- Real authorize request shape with correlation ID.
- Decline reasons surfaced in kiosk UI.

### FLOW-202: Session + wallet policy enforcement
Status: Pending
Acceptance Criteria:
- Session status and spend limits enforced server-side.
- Audit log for approved/blocked decisions.

## Epic 3: OS Depletion Acceptance Handshake (Phase 2)

### FLOW-301: Publish queued events to OS depletion endpoint
Status: Pending
Acceptance Criteria:
- OS response linked to `eventId`.
- Persist accepted/rejected state and reason.

### FLOW-302: Reconciliation worker
Status: Pending
Acceptance Criteria:
- Retries stale pending events.
- Dashboard includes backlog age and retry counts.

## Epic 4: Edge Runtime + Device Control (Phase 3)

### FLOW-401: Hardware driver adapter layer integration
Status: Pending
Acceptance Criteria:
- Meter/valve/temp/CO2 updates originate from device path.
- Driver swap between dummy and Pi-backed drivers is supported.

### FLOW-402: Durable offline spool
Status: Pending
Acceptance Criteria:
- Events survive process restart/network outage.
- Replay order and idempotency preserved.

### FLOW-403: Signed control-intent command path
Status: Pending
Acceptance Criteria:
- Control intents include actor and trace metadata.
- Command ACK/NACK recorded and visible.

## Epic 5: Security + Observability + Ops (Phase 4)

### FLOW-501: Auth/RBAC for FLOW runtime operations
Status: Pending
Acceptance Criteria:
- Role checks for kiosk/bartender/admin actions.

### FLOW-502: Telemetry and alerting
Status: Pending
Acceptance Criteria:
- Metrics: queue depth, sync lag, reject rate, device offline.
- Alert thresholds documented and configured.

### FLOW-503: Runbooks and incident drills
Status: Pending
Acceptance Criteria:
- Documented recovery for queue replay, device loss, and OS/OPS outage.

## Epic 6: Pilot and Rollout (Phase 5)

### FLOW-601: Single-site pilot
Status: Pending
Acceptance Criteria:
- Stable for agreed pilot period with no data loss.

### FLOW-602: Multi-site rollout gates
Status: Pending
Acceptance Criteria:
- Automated go/no-go checks based on SLO metrics.

## Immediate Next Execution Slice

1. Add backend mutation endpoints for session state + control intents to remove remaining runtime-only stubs.
2. Wire FLOW taps/menu/assignments UI reads to `/api/flow/runtime` snapshot (reduce static fixture coupling).
3. Run manual fault-injection tests: offline mode, retry mode, duplicate event replay.
