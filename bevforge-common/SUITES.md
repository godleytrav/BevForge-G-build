# BevForge Suite Boundaries

This file is the operating boundary contract for all suite threads.

## Source Of Truth

- **OS is the source of truth** for:
- quantities
- inventory balances
- batch states and lot status
- automation and execution state

## Suite Responsibilities

- **OS**
- process control, automation runtime, commissioning, inventory ledger, batch ledger
- **OPS**
- CRM lead capture and sales accounts, orders, routing, delivery, palletizing/packing canvas, compliance triggers
- consumes released lots and available quantities from OS
- **LAB**
- recipe authoring, analysis, exports (`BevForge.json`, `beer.json`, `beer.xml`)
- **FLOW**
- tap/keg runtime, pour telemetry, kiosk/self-serve serving experiences, and tap analytics
- emits pour/depletion events for OS inventory truth
- **CONNECT**
- employee identity, messaging threads, communication campaigns, workforce timesheets, task assignment, and read-only CRM mirror for communication workflows

## Integration Rule

- Non-OS suites do not directly mutate OS source-of-truth quantities.
- Cross-suite updates happen through explicit contracts/events/APIs.
- OS exposes authoritative state; other suites consume it.
- Universal calendar is a projection layer; each suite remains owner of its own events.

## Orders And Allocation Split

- OPS persists customer orders and order-line workflow state.
- OPS requests reservation/commit/release operations from OS through fulfillment contracts.
- OS persists inventory balances, lot reservations, batch linkage, and movement audit.
- OPS should treat OS allocation results as authoritative for what can actually ship.

## Threading Rule

- Keep one thread per suite:
- `OS`
- `OPS`
- `LAB`
- `FLOW`
- `CONNECT`
- Keep one additional thread for `cross-suite integration` only.
