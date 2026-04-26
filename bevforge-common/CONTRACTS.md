# BevForge Contracts

This document defines how shared contracts are organized and versioned in this repo.

## Directory Layout

- `contracts/canvas/`: Shared canvas base schema and related definitions.
- `contracts/brewhouse/`: Brewhouse definition schema and device/driver binding schema.
- `contracts/recipes/`: Recipe schema and `BevForge.json` placeholders used by LAB and OS.
- `contracts/automation/`: Shared automation and execution plan schemas used by OS runtime and LAB recipe adapters.
- `contracts/fulfillment/`: OPS order + OS allocation/reservation/availability contracts.
- `contracts/connect/`: CONNECT employee/task/thread schemas plus read-only OPS CRM mirror/reference schemas with cross-suite link references.
- `contracts/flow/`: FLOW tap runtime, pour events, serving sessions, and menu contracts.
- `contracts/calendar/`: Universal calendar event and feed schemas for cross-suite projection.
- `contracts/compliance/`: OS compliance event feed + OPS reporting packet contracts.

## Contract Principles

- Contracts are shared between OS and OPS.
- The canvas base schema is a common foundation; OS and OPS extend it in their own node libraries.
- Device identity is logical and separate from driver binding.
- Commissioning data must remain JSON-on-disk and portable.
- OPS owns customer order lifecycle data; OS owns physical quantity and reservation effects.

## Schema Standards

- Use JSON Schema draft 2020-12.
- Every schema must include:
  - `$schema`
  - `$id`
  - `title`
  - `schemaVersion` (semver string)
- Avoid ambiguous objects. Prefer explicit properties and `additionalProperties: false` by default.

## Versioning and Compatibility

- `schemaVersion` is semantic versioning (MAJOR.MINOR.PATCH).
- Backward-incompatible changes require a MAJOR bump and migration notes in the README for that contract.
- Backward-compatible extensions can use MINOR or PATCH increments.

## Cross-Contract Conventions

- Common fields: `id`, `name`, `description`, `metadata`.
- Prefer string identifiers over integers for cross-system stability.

## Related Runtime Contracts

- `SUITES.md`: suite authority boundaries.
- `NAVIGATION-CONTRACT.md`: required route and shell behavior.
- `UI-UX-COHERENCE.md`: shared UX consistency baseline.
