# BevForge Common Agent Rules

These rules are the default guardrails for work in this repo. If another document conflicts, this file wins.

## Non-Negotiable Product Context
- BevForge OS is the source of truth for quantities, batch states, and automation execution.
- BevForge OPS is the business, warehouse, and compliance layer. OPS handles orders, palletizing and virtual packing canvas, QR generation, routing, delivery check-ins, and tax/compliance triggers.
- OS and OPS both use a canvas UI, but they are different node libraries:
  - OS canvas: automation and process execution
  - OPS canvas: logistics, packing, pallet, and routing
- We want ONE shared canvas engine and ONE shared base schema, with OS and OPS node extensions.
- Devices are defined logically. Hardware bindings are swappable. Dummy drivers exist for simulation. Real drivers exist for Pi hardware.
- Commissioning (setup) must be JSON-on-disk, portable, and support load/save/export/import.

## Repo Rules
- Use pnpm. If `pnpm-workspace.yaml` exists, pnpm is the package manager.
- Do not add dependencies without explicit approval (name + why).
- Treat any folder named `_sources` as archive/reference only. Do not refactor or move it unless asked.
- Contracts live in `contracts/` and are shared between OS and OPS.

## Contract Rules
- Base schemas are shared; OS/OPS only extend via explicit extensions.
- JSON Schema draft 2020-12 is the default.
- Every contract includes `schemaVersion` (semver) and a stable `id`.
- Backward-incompatible changes require a new schema version and explicit migration notes.
- Commissioning data must remain JSON-on-disk and portable (no DB-only config).

## Naming and Structure
- Prefer clear, domain-specific names: brewhouse, device, driver, recipe, batch, order, pallet.
- Keep logical device identity separate from driver binding.
- Avoid hard-coded hardware identifiers in shared contracts.
