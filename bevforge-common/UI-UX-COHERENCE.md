# UI/UX Coherence Guide

This guide keeps BevForge suites visually and behaviorally coherent.

## Current Cross-Suite Direction
- OS has established the current target interaction model for operational pages.
- Use the OS `Active Production` tile as the reference style for modern summary tiles/cards.
- LAB and OPS should follow the same structural language while preserving their own accent palettes.
- The goal is not to clone OS literally; the goal is to keep the same level of clarity, hierarchy, and instrument-panel feel across suites.

## Visual System
- Keep shared spacing rhythm, corner radius, shadows, and border styles across suites.
- Use full-edge accent treatment for status cards/widgets where accenting is applied.
- Keep typography hierarchy consistent:
- page title
- section title
- body/metadata
- Preserve the app-wide glass style:
- dark base background
- glass surfaces
- rounded corners
- subtle edge glow

## Dashboard Tile Standard
- Summary tiles should feel like instrument-panel widgets, not generic statistic cards.
- Preferred reference:
- OS `/os` `Active Production` tile
- OS `/os/batches` board tiles
- OS `/os/packaging` summary tiles
- Tile jobs:
- quick look
- quick filter
- quick access into the next relevant page or state
- Tiles should usually include:
- a small uppercase eyebrow label
- one strong numeric or status value
- one short title
- one short subtitle
- a contained icon treatment
- a subtle top accent line / glow treatment
- Tiles should avoid:
- long paragraphs
- duplicate labels
- decorative clutter
- dead-end click behavior

## Page Flow Standard
- Pages should read from overview -> focus -> action.
- The operator should be able to tell:
- what they are looking at
- what state it is in
- what they can do next
- what should be clicked for more detail
- When a page becomes dense, prefer:
- tabs
- filter tiles
- pop-up detail dialogs
- drawers
- clearly separated working lanes
- Avoid long mixed-content pages that dump summary, reference, editing, and history into one uninterrupted scroll.

## Inventory/Product Separation Rule
- Consumables and finished goods must not be visually blended into one undifferentiated list when the workflow meaning is different.
- Production inputs:
- ingredients and process consumables used during production
- Supplies:
- packaging materials, hardware, support stock
- Finished goods:
- products made by the producer and tracked for bond/release/removal
- If a suite mixes these domains on one page, it should provide a first-class separation mechanism such as:
- summary filter tiles
- tabs
- lane filters
- grouped sections

## Suite-Specific Application
- OS:
- source of truth for quantities, batch state, packaging state, and physical execution
- pages should prioritize live operational clarity and traceability
- OPS:
- business/logistics layer
- pages should emphasize action queues, routing, shipping readiness, packaged availability, taxable removal state, and downstream execution
- LAB:
- formulation and recipe/compliance authoring layer
- pages should emphasize clean builder flow, ingredient logic, formula intent, export readiness, and handoff into OS

## For Future UI/UX Passes
- When modernizing LAB or OPS pages, do not start from a blank design vocabulary.
- Reuse the established BevForge page language from the updated OS work:
- dashboard-style summary tiles
- compact, high-signal card headers
- stronger separation between overview and detail
- click targets that either filter the current page or open the relevant working page
- If a page has a “quick look” purpose, keep it that way. Do not overload the first screen with every field the system knows.

## Suite Accent Palette
- OS: `#00C2FF` (neutral authority)
- OPS: `#3A6EA5` (industrial operations)
- LAB: `#F59E0B` (formulation / transformation)
- CONNECT: `#8B5CF6` (people / communication)
- FLOW: `#22C55E` (serving / live movement)
- Canonical tokens live in `packages/ui-shared/src/suite-theme-contract.ts`.

## Status Color Semantics
- `operational/success`: green
- `warning/attention`: amber/yellow
- `error/blocker`: red
- `info/neutral`: blue/slate

## Interaction Rules
- Primary actions are explicit and stable in location.
- Destructive actions require confirmation.
- Draft vs published/operational modes must be visually obvious.
- Manual override paths must be explicit and traceable.

## Page Expectations
- **Dashboard**: summary and entry points.
- **Control Panel**: system design + controls.
- **Recipe Execution**: operator run flow and preflight checks.
- **Inventory**: on-hand, allocated, available.
- **Batches**: lot lifecycle and release/ship state.
- **Packaged Products**: batch-to-package-lot-to-sellable-SKU traceability at a glance.

## Cross-Suite Coherence
- Reuse shared shell, card, badge, button, dialog patterns.
- Avoid suite-specific one-off controls when a shared pattern exists.
- Add suite-specific visuals through tokens/accents, not layout divergence.
