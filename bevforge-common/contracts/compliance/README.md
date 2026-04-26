# Compliance Contracts

This contract set defines how OS compliance-relevant records are handed off to OPS for filing, matrixing, and regulator packet generation.

## Authority Model

- OS is source of truth for physical production execution, quantity movements, batch/lot identity, and operational trace logs.
- OPS is source of truth for compliance workflow state (draft/review/submitted/accepted), document organization, and filing outputs.
- OPS must not mutate OS quantity, batch, or inventory ledgers directly.

## Files

- `compliance-event.schema.json`: canonical compliance event shape derived from OS ledgers.
- `compliance-feed.schema.json`: portable JSON-on-disk feed of compliance events for a site/time window.
- `compliance-period-report.schema.json`: OPS-generated filing packet summary for a reporting period.
- `os-ops-compliance-mapping-v1.md`: field-by-field source mapping from current OS data to compliance contracts.

## Recommended Handoff Flow

1. OS composes `compliance-event` records from internal ledgers.
2. OS publishes a `compliance-feed` for requested `siteId` and period.
3. OPS ingests feed events idempotently by `id`.
4. OPS builds a `compliance-period-report` packet for jurisdiction-specific outputs.
5. OPS stores filing status changes while preserving references to source OS event IDs.

## OS Feed Profile Rules (v1)

- `compliance-feed.sourceSuite` is always `os`.
- Every event in `compliance-feed.events[]` must have `sourceSuite: "os"`.
- If an event is projected from another suite's originating record (for example FLOW pour), keep `sourceSuite: "os"` and set `sourceRecord.originSuite` to the original suite.

## Ordering and Cursor Rules (v1)

Canonical order for `GET /api/os/compliance/feed`:
- Primary sort: `occurredAt` ascending.
- Tie-breaker: `id` ascending.

Pagination semantics:
- `cursor.afterOccurredAt` + `cursor.afterId` represent the last event key seen by the client.
- Next page returns strictly greater keys using `(occurredAt, id)` lexicographic comparison.
- `cursor.nextAfter` is an opaque token carrying the same position.
- `cursor.hasMore` indicates whether more events exist after the returned page.

Idempotency expectations:
- `compliance-event.id` is deterministic per source event.
- Re-reading the same period and cursor window must return the same IDs in the same order unless source records were amended/voided.

## Period Totals Invariant (Runtime Validation Rule)

When OPS builds `compliance-period-report`, totals must satisfy this equation per `siteId` and `uom`:

`onHandStartQty + producedQty - removedQty - destroyedQty - lossQty = onHandEndQty`

Notes:
- This is a runtime validation rule and not enforced by JSON Schema alone.
- If the equation fails, OPS should mark report status `draft`, attach an exception note, and block submission until reconciled.

## Current OS Source Inputs (v1)

- `commissioning/os/batch-state.json`
- `commissioning/os/inventory-movements.json`
- `commissioning/os/package-lot-state.json`
- `commissioning/os/recipe-runs.json`
- `commissioning/os/recipe-readings.json`
- `commissioning/os/reservation-state.json`
- `commissioning/os/reservation-actions.json`
- `commissioning/os/transfer-runs.json`
- `commissioning/os/packaging-runs.json`
- `commissioning/os/flow-pour-events.json`

## Notes

- This contract set is schema-level and transport-agnostic.
- Jurisdiction-specific field requirements (TTB/ABC forms) are represented through `regulatoryTags`, `jurisdiction`, and `metadata` in v1.
- Cider-first cellar metrics such as `brix`, `titratableAcidityGpl`, and `so2Ppm` may be emitted in `measurements` when OS has them.
- Backward-incompatible changes require a new major schema version and migration notes.
