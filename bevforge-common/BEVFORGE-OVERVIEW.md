# BevForge Overview

## What This Repo Is
`bevforge-common` holds shared contracts, schemas, and cross-app conventions used by BevForge OS and BevForge OPS. It is the canonical source for shared data definitions.

## System Roles
- **BevForge OS**: Source of truth for quantities, batch states, and automation execution.
- **BevForge OPS**: Business, warehouse, and compliance layer. OPS handles orders, palletizing and virtual packing canvas, QR generation, routing, delivery check-ins, and tax/compliance triggers.
- **Order handling split**: OPS owns customer orders; OS owns allocatable quantity, reservations, and lot/batch availability.
- **BevForge CONNECT**: Employee, CRM, and communication layer. CONNECT owns people/tasks/threads and references OS/OPS entities.
- **BevForge FLOW**: Taproom intelligence layer for tap runtime, pour telemetry, and serving interfaces. FLOW emits events; OS commits quantity truth.

## Canvas Architecture
- **One shared canvas engine** across OS and OPS.
- **One shared base schema** for canvas graphs.
- OS and OPS use **different node libraries** and extend the base schema for their domains.
  - OS nodes: automation and process execution.
  - OPS nodes: logistics, packing, pallet, and routing.

## Devices and Drivers
- Devices are defined **logically** (capabilities, roles, identity) and are **not** tied to specific hardware.
- Drivers are swappable and bind logical devices to real hardware.
- Dummy drivers exist for simulation; real drivers exist for Pi hardware.

## Commissioning
- Commissioning data is **JSON-on-disk**, portable, and must support load/save/export/import.
- Commissioning is a first-class contract and must not be DB-only.

## Shared Contracts
Contracts live in `contracts/` and provide the base schema for:
- Canvas graphs
- Brewhouse definitions
- Device and driver bindings
- Automation and execution plans
- Recipes (including `BevForge.json` placeholders for LAB and OS execution)
- Fulfillment handoff (orders to reservations/availability)

## Direction
The guiding principle is **one shared engine + one shared base schema**, with OS/OPS-specific extensions. Contracts and extensions should keep OS and OPS consistent without forcing them to share node libraries.

## Operating Docs
- `SUITES.md`: suite boundaries and ownership rules.
- `NAVIGATION-CONTRACT.md`: universal shell and route behavior.
- `UI-UX-COHERENCE.md`: shared visual/interaction rules.
