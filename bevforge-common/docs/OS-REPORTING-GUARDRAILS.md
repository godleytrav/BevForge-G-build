# OS Reporting Guardrails

This document is the build guide for BevForge OS reporting.

Use it whenever `/reports` or any OS reporting export is created, updated, or refactored.

## 1. Purpose

BevForge OS reporting is a compliance-supporting workspace.

It should help the operator:

- review filing-ready support schedules
- spot missing data before filing
- export clean schedules for internal review
- preserve traceability back to the source batch, package lot, movement, and run record

OS reporting is not allowed to invent values that are not grounded in OS records.

If OS does not yet store a required filing input, the UI must show that as a readiness gap instead of pretending the report is complete.

## 2. Product Boundary

These ownership rules are non-negotiable:

- OS is the source of truth for:
  - batch quantities
  - batch states
  - transfer runs
  - packaging runs
  - package lots
  - inventory movements
  - compliance snapshots stored at packaging
  - process and production traceability
- OPS is the source of truth for:
  - orders
  - fulfillment
  - revenue
  - retail sales tax reporting support
  - palletizing / virtual packing canvas
  - delivery and downstream business execution

Do not move revenue-based reporting into OS.

## 3. Official Source Set

Use official primary sources when updating reporting logic:

- TTB Form 5120.17 and the TTB Guide to Form 5120.17
- TTB Form 5000.24 guidance
- TTB cider FAQ and wine labeling guidance
- TTB COLAs Online and Formulas Online guidance
- California ABC Winegrowers / Blenders Report guidance
- California CDTFA Alcoholic Beverage Tax guidance
- California CDTFA winemaker tax guide for sales/use tax boundary
- California CalRecycle beverage container reporting and CRV guidance

If a requirement is unclear, prefer the official agency source over third-party summaries.

## 4. Minimum OS Report Set

The reporting page should continue to support these core views:

1. TTB Operations Summary
2. TTB Taxable Removals Summary
3. COLA / Formula Watch
4. California ABC Annual Production
5. California CDTFA Taxable Removals
6. California CRV / Container Readiness
7. SKU Compliance Snapshot

These are support schedules, not government-filed forms rendered line-for-line.

## 5. Data Rules

### Required source records

Every report should be derived from one or more of these OS records:

- batch records
- package lot records
- inventory movement records
- transfer run records
- packaging run records
- compliance feed events

### Do not guess

Never infer:

- revenue
- sales tax owed
- CRV material type
- legal filing role for manufacturer vs distributor
- hard cider qualification when the required facts are missing

If a rule depends on data OS does not yet store, show:

- `ready` when OS has the needed fact
- `warning` when OS has partial support
- `missing` when OS lacks the fact entirely

### Traceability

Every schedule row should be explainable from a real source record.

When possible, reporting rows should tie back to:

- batch code / lot code
- package lot code
- SKU
- movement or run timing

## 6. UX Rules

Reporting UX should stay calm and guided:

- use tabs for major filing groups
- use dialogs for deep detail instead of long scrolling walls of text
- use selects and date pickers for range / mode choices
- keep top-level cards concise
- show readiness before raw detail tables
- keep missing compliance facts visible

Do not turn `/reports` into a generic data dump.

## 7. Compliance Rules

### TTB operations

Show support for:

- produced volume
- used / transferred volume
- packaged volume
- losses
- current bulk position

If beginning or ending point-in-time inventory is not explicitly stored, mark that as a readiness limitation.

### TTB excise

Use taxable removals only.

Do not mix:

- internal transfers
- in-bond moves
- production-only events

Hard cider grouping must stay reviewable and should not be overclaimed when carbonation, fruit, or formula facts are incomplete.

### Label / formula

Packaging-time compliance snapshots must remain first-class.

At minimum, preserve:

- beverage class
- product / brand name
- ABV
- class designation
- net contents statement
- COLA reference
- formula reference
- sulfite declaration review
- health warning review

### California

Keep these distinctions explicit:

- ABC annual production is production-based
- CDTFA alcohol beverage tax is removal-based
- California sales tax is revenue-based and belongs in OPS
- CRV readiness depends on container facts OS may not yet store

## 8. Export Rules

CSV and print exports should:

- mirror the visible schedule
- use plain labels
- carry the selected date range
- avoid hidden calculations that do not appear in the UI

If a report is only a readiness view, export it as a readiness schedule, not as fake tax math.

## 9. Update Checklist

Before shipping reporting changes, run the checklist in:

`docs/OS-REPORTING-CHECKLIST.md`
