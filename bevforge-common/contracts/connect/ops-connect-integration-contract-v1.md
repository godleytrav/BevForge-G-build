# OPS-CONNECT Integration Contract v1

This document defines how OPS and CONNECT integrate while preserving suite ownership boundaries.

## Purpose

- Keep OPS and CONNECT responsibilities explicit.
- Prevent cross-suite data drift.
- Ensure all mutating actions are routed through the owning suite APIs.

## Ownership Model

- OPS owns:
  - lead capture
  - account
  - account_site
  - order
  - delivery
  - pricing and tax/compliance business flags
- CONNECT owns:
  - employee
  - messaging threads and communication campaigns
  - workforce timesheet workflows
  - task
  - activity
  - communication workflows using OPS CRM mirror context
- OS remains source of truth for:
  - physical inventory quantities
  - batch states
  - reservation and allocation effects

## Integration Rules

- CONNECT can reference OPS records.
- CONNECT cannot directly mutate OPS-owned records in storage.
- CONNECT requests OPS mutations through explicit OPS API endpoints.
- CONNECT may import OPS CRM snapshots into CONNECT mirror files for communication UX.
- Imported OPS CRM data in CONNECT is read-only and must be replaced by explicit import operations.
- OPS cannot directly mutate CONNECT-owned records in storage.
- Cross-suite links must use stable string IDs.

## Reference ID Contract

CONNECT records may include OPS reference fields:

- `opsAccountId`
- `siteId`
- `orderId`
- `deliveryId`

Existing CONNECT schemas also use `accountId` in some places. For v1:

- Treat `accountId` as the same identity as `opsAccountId`.
- New cross-suite integration code should prefer `opsAccountId`.
- Read paths should accept either field until schemas are fully harmonized.

## Allowed Write Paths

- CONNECT -> OPS:
  - CRM/account updates (if exposed by OPS API)
  - order/delivery notes or workflow requests (if exposed by OPS API)
  - no direct DB writes in CONNECT to OPS tables
- OPS -> CONNECT:
  - create task/thread/activity requests via CONNECT APIs
  - provide CRM snapshot payloads for CONNECT mirror import
  - no direct DB writes in OPS to CONNECT stores
- OPS -> OS:
  - availability, reservation, and reservation action calls under fulfillment contracts

## Idempotency and Audit

- Mutating cross-suite calls should include a stable idempotency key per logical operation.
- Activity logs should record:
  - actor id/type
  - source suite
  - linked refs (`opsAccountId`, `orderId`, `deliveryId`, `siteId`)
  - timestamp
- Duplicate idempotency keys should return the first successful result.

## Data Freshness Rules

- CONNECT should not maintain mutable mirrors of OPS records.
- If CONNECT caches OPS data for UX, cache is read-only and import-driven.
- Before mutating OPS-owned state, CONNECT should re-fetch authoritative OPS record state when needed.
- CONNECT CRM mirror freshness depends on explicit import cadence; import timestamp should be surfaced in UI.

## CONNECT Working Set (Practical)

CONNECT requires these inputs/IDs for communication flows:

- OPS CRM snapshot data (accounts + contacts).
- Stable cross-suite references on CONNECT records:
  - `opsAccountId`
  - `siteId`
  - `orderId`
  - `deliveryId`

CONNECT stores these mirror artifacts in JSON-on-disk:

- `commissioning/connect/accounts.json`
- `commissioning/connect/contacts.json`

CONNECT-only mutable artifacts remain:

- `commissioning/connect/employees.json`
- `commissioning/connect/campaigns.json`
- `commissioning/connect/timesheets.json`
- `commissioning/connect/tasks.json`
- `commissioning/connect/threads.json`
- `commissioning/connect/activities.json`
- `commissioning/connect/event-links.json`

## Error Handling and UX Expectations

- If OPS rejects a request, CONNECT must surface a clear operator message.
- Partial success should be explicit in CONNECT task/thread messaging.
- Cross-suite validation failures should include machine-readable error codes where possible.

## Practical Example Flows

- Customer escalation:
  - CONNECT thread references `orderId` and `opsAccountId`.
  - Operator requests delivery update via OPS API.
  - OPS response is written to CONNECT activity log with refs.
- Delivery issue:
  - CONNECT task references `deliveryId` and `siteId`.
  - Any delivery status change occurs in OPS.
  - CONNECT only records communication and follow-up actions.

## Non-Goals

- CONNECT does not become a second order system.
- CONNECT does not own delivery state machine logic.
- CONNECT does not write OS inventory/batch/reservation ledgers.

## Versioning

- Contract version: `v1`.
- Backward-incompatible boundary changes require a new version document and migration notes.
