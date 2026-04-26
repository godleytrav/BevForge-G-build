# OPS Logistics Canvas Inventory

Last updated: 2026-02-21

Purpose: preserve references to older or alternate OPS canvas pages so they are reviewable before deletion.

## Canonical Logistics Entry
- Route: `/ops/logistics`
- Target file: `apps/ops-ui/src/pages/ops/canvas-logistics.tsx`
- Status: active canonical logistics canvas (red-node style drag/drop packaging + pallet/truck loading)
- Redesign date: 2026-02-21

## Compatibility Aliases
- Route: `/ops/logistics/canvas`
- Behavior: redirects to `/ops/logistics`
- Status: keep temporarily for compatibility

- Route: `/ops/canvas-logistics`
- Behavior: redirects to `/ops/logistics`
- Status: keep temporarily for compatibility

## Alternate/Legacy Canvas Variants
- Route: `/ops/canvas`
- File: `apps/ops-ui/src/pages/ops/canvas.tsx`
- Status: legacy candidate (generic canvas)

- Route: `/ops/canvas-classic`
- File: `apps/ops-ui/src/pages/ops/canvas.tsx`
- Status: legacy alias candidate

- Route: `/ops/canvas-demo`
- File: `apps/ops-ui/src/pages/ops/canvas-demo.tsx`
- Status: demo/reference candidate

- Route: `/ops/canvas-hybrid`
- File: `apps/ops-ui/src/pages/ops/canvas-hybrid.tsx`
- Status: alternate variant candidate

- Route: `/ops/canvas-v3`
- File: `apps/ops-ui/src/pages/ops/canvas-v3.tsx`
- Status: alternate variant candidate

- Route: (not currently routed)
- File: `apps/ops-ui/src/pages/ops/canvas-simple.tsx`
- Status: file-only legacy candidate

- Route: (not currently routed)
- File: `apps/ops-ui/src/pages/ops/canvas-logistics-legacy.tsx`
- Status: preserved snapshot of the pre-redesign logistics canvas

## Legacy Logistics Hub Prototype (Not Routed)
- File: `apps/ops-ui/src/pages/ops/logistics/index.tsx`
- Status: retained as reference prototype for hub-style logistics dashboard
- Note: currently not wired because OPS should have one main dashboard hub

## Supporting Logistics Pages (Active)
- `/ops/logistics/sites` -> `apps/ops-ui/src/pages/ops/logistics/sites.tsx`
- `/ops/logistics/sites/:siteId` -> `apps/ops-ui/src/pages/ops/logistics/site-detail.tsx`
- `/ops/logistics/trucks` -> `apps/ops-ui/src/pages/ops/logistics/trucks.tsx`
- `/ops/logistics/trucks/:truckId` -> `apps/ops-ui/src/pages/ops/logistics/truck-detail.tsx`
- `/ops/logistics/routes` -> `apps/ops-ui/src/pages/ops/logistics/routes.tsx`
- `/ops/logistics/routes/:routeId` -> `apps/ops-ui/src/pages/ops/logistics/route-detail.tsx`
- `/ops/logistics/events` -> `apps/ops-ui/src/pages/ops/logistics/events.tsx`
- shared data/model helpers -> `apps/ops-ui/src/pages/ops/logistics/data.ts`
