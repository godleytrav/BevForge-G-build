# CONNECT Contracts

This contract set defines BevForge CONNECT data for employee workflows, operational communication, and read-only OPS CRM mirrors used for communication context.

## Authority Boundaries

- CONNECT owns employee records, messaging threads, communication campaigns, workforce timesheets, task assignment, and activity logs.
- OPS owns CRM lead/account/account_site records plus order and delivery lifecycle.
- CONNECT contacts/accounts are imported mirrors of OPS CRM data and are treated as read-only communication context.
- CONNECT does not own physical quantity, lot, reservation, or batch ledgers.
- OS remains source of truth for inventory, batch state, and automation execution.
- OPS remains source of truth for CRM, order lifecycle, and logistics execution.

## Integration Model

- CONNECT references OS/OPS records using stable identifiers (`opsAccountId`, `orderId`, `deliveryId`, `siteId`, `reservationId`, `batchId`, `skuId`).
- CONNECT creates communication and action tasks from cross-suite events.
- Any CRM/order/quantity mutation must call OS/OPS APIs, not mutate mirrored state in CONNECT.
- OPS-CONNECT suite boundary contract is defined in `ops-connect-integration-contract-v1.md`.
- `accountId` fields in existing CONNECT schemas are treated as equivalent to `opsAccountId` for cross-suite identity in v1.

## What CONNECT Needs To Work

- OPS CRM export/import source that provides accounts + contacts with stable IDs.
- OPS reference IDs on CONNECT records:
  - `opsAccountId`
  - `siteId`
  - `orderId`
  - `deliveryId`
- CONNECT import flow writes mirror files only:
  - `commissioning/connect/accounts.json`
  - `commissioning/connect/contacts.json`
- CONNECT communication/workforce workflows persist to:
  - `commissioning/connect/campaigns.json`
  - `commissioning/connect/timesheets.json`
- CONNECT writes to OPS-owned state through explicit OPS APIs only (no direct ledger/record mutation).

## Files

- `employee.schema.json`
- `account.schema.json` (legacy/reference shape; OPS remains authoritative owner)
- `contact.schema.json` (mirror/reference shape when sourced from OPS CRM)
- `task.schema.json`
- `thread.schema.json`
- `activity.schema.json`
- `event-link.schema.json`

## Commissioning Storage (JSON-on-disk)

Recommended defaults:

- `commissioning/connect/employees.json`
- `commissioning/connect/accounts.json` (optional reference cache only)
- `commissioning/connect/contacts.json`
- `commissioning/connect/tasks.json`
- `commissioning/connect/threads.json`
- `commissioning/connect/activities.json`
- `commissioning/connect/event-links.json`
