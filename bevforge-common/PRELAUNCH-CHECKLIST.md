# Prelaunch Checklist

This checklist is the shared launch tracker for BevForge.

Use it to answer one simple question:

Can we trust BevForge for first production, first packaging, and first delivery?

## Status Legend

- `Done` = implemented well enough to use now
- `In Progress` = partially built or usable with friction; needs another pass
- `Needs Attention` = not ready, missing, or too risky to rely on yet

## Priority Levels

- `P0` = must be dependable before first production batch
- `P1` = must be dependable before first customer delivery
- `P2` = important, but can land after launch if we keep backup process/logs

## Production And Cellar

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P0 | Done | OS | Create a new batch with product identity, batch code, and recipe/formula linkage | Manual batch creation is in place and product identity now lives in OS. |
| P0 | Done | OS | Capture source ingredient inputs and lot/source details | Batch source input fields were added for juice, yeast, additions, supplier/source, lot, qty, and notes. |
| P0 | Done | OS | Log cellar and fermentation readings over time | OS runboard/readings supports temp, SG/FG, pH, ABV, Brix, TA, and SO2/sulfite. |
| P0 | In Progress | OS | View current batch state clearly | Batch cards and lineage views exist, but vessel/current-state UX still needs tightening for daily cellar use. |
| P0 | Done | OS | Track transfers and splits between vessels/containers | Transfer flow exists and logs source, destination, qty, loss, reason, operator, and timestamps. |
| P0 | Done | OS | Create derived batch branches such as oak or lees aging | Derived batch lineage and product deviation handling are implemented. |
| P0 | In Progress | OS | Make transfer workflow comfortable for real cellar work | Functional now, but still needs usability polish and clearer visual guidance. |

## Packaging And Inventory

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P0 | Done | OS | Package from batch into sellable output | Packaging run flow exists with package type, auto SKU, counts, losses, rejects, operator, line, and compliance snapshot. |
| P0 | Done | OS | Auto-generate stable sellable SKU at packaging | SKU is generated from product code and package format without embedding batch identity. |
| P0 | Done | OS | Create package lots tied back to source batch | Package lots, lot codes, and genealogy are in place. |
| P0 | Done | OS | Show packaged inventory on hand by sellable SKU | `/os/packaged-products` now provides a first-class packaged product board. |
| P0 | Done | OS | Log package-lot actions and release status | Hold, ready, released, shipped, return, empty return, rework, destroy, adjust, assign asset, and note are supported. |
| P0 | In Progress | OS | Track physical asset/container lifecycle | Package lots can carry asset/container codes, but full keg/barrel lifecycle tracking still needs another pass. |
| P0 | In Progress | OS | Make packaging workflow comfortable for real packaging-day use | Core flow works, but the day-of-packaging UX still needs refinement. |
| P1 | In Progress | OS + OPS | Show exact package-lot selection cleanly during fulfillment | The data chain exists, but OPS lot selection and packing/removal UX still needs work. |

## Compliance And Traceability

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P0 | Done | OS | Record every meaningful production and inventory event | Batch, transfer, packaging, movement, reservation, lot action, and pour-related events now flow into OS ledgers. |
| P0 | Done | OS | Attach who / when / where to meaningful events | Operator, timestamps, site, reason codes, and line/container context are now captured in more places. |
| P0 | Done | OS | Maintain ingredient -> batch -> package lot -> SKU traceability | This chain is now substantially in place in OS. |
| P0 | Done | OS | Preserve label/compliance snapshot at packaging time | Packaging stores beverage class and label/compliance-related fields with the lot. |
| P0 | Done | OS | Prevent silent overwrite of quantity history | Package-lot actions and corrections are logged as events rather than silent edits. |
| P0 | In Progress | OS | Capture removals, returns, empties, rework, and destruction cleanly end-to-end | The actions exist in OS, but the full OS -> OPS -> driver workflow still needs polish. |
| P0 | In Progress | OS | Build regulator-facing reporting from the event stream | Reports hub now includes federal/state schedules, compliance snapshots, and event-derived bulk reconciliation, but container-material/CRV details and some filing-edge cases still need another pass. |
| P1 | Needs Attention | OS + OPS | Produce regulator-ready report packets without backup logs | This is not ready yet; keep backup manual records until report/export flow is built and trusted. |

## OPS Accounts, Orders, Delivery, And Forecasting

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P1 | Done | OPS | Maintain client/account records | OPS CRM account/client structure exists. |
| P1 | Done | OPS | Create and manage orders | OPS order workflow exists. |
| P1 | In Progress | OPS | Reliably show OS availability and package-lot traceability during fulfillment | Much better than before, but still being tightened. |
| P1 | Done | OPS | Plan routes, trucks, and stops | Route/truck/site surfaces exist in OPS. |
| P1 | In Progress | OPS | Driver/mobile execution for check-in, delivery scan, and returns | Driver/mobile flows exist, but polish and reliability need more work before full trust. |
| P1 | Done | OPS | Warm-visit mobile CRM capture | OPS mobile has a visit workflow for lead/account capture and estimated product interest. |
| P1 | In Progress | OPS | Forecasting and projection workflow | Forecast page exists and uses historical/in-flight demand, but still needs validation against real use. |
| P1 | In Progress | OPS | Offline/mobile sync confidence | PWA/mobile sync exists conceptually, but needs more trust-building and field testing. |

## Reporting And Export

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P0 | In Progress | OS | Print/export batch report | Reports hub now includes filing-oriented federal/state schedules plus print and CSV export, but still needs real-world validation against live cellar records. |
| P0 | In Progress | OS | Print/export packaging report | Packaging output and packaged-lot compliance now flow into the reports hub, but edge-case review is still needed. |
| P0 | In Progress | OS | Print/export monthly production summary | Reports hub now includes event-derived beginning/ending bulk reconciliation, but the operator workflow still needs filing-period review. |
| P0 | In Progress | OS | Print/export removals, loss, and destruction summary | Federal/state removal support and loss views are now present, but exact filing-packet validation is still needed. |
| P0 | In Progress | OS | Print/export package-lot traceability report | SKU compliance snapshot and lot-level review are now present in the reports hub, but traceability sign-off is still pending. |
| P0 | In Progress | OS | Export CSV/PDF from production/compliance records | CSV export and print-ready views are available directly from the reports workspace; deeper packet polish can come next. |
| P1 | Done | OPS | Print delivery packet / sheet / payload QR | OPS truck detail already has print actions for dispatch/delivery documents. |

## UX And Workflow Cohesion

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P0 | In Progress | OS | Clear path from batch -> cellar -> transfer -> packaging -> release | Most screens exist, but the flow still feels split and needs another UX pass. |
| P0 | In Progress | OS | Make “what do I do next?” obvious | We improved this somewhat, but it is not yet fully guided. |
| P0 | In Progress | OS | Mobile-friendly operator cards/lists | Batch and packaged-product card layouts are improving, but more review is needed. |
| P0 | In Progress | OS | Replace reporting labyrinth with simple print/export buttons | OS now has a single reports hub with date-range filters and print/export actions; the launch workflow still needs review. |
| P1 | In Progress | OPS | Keep CRM/logistics/mobile from feeling spread across too many work areas | Tool coverage is good, but cohesion still needs work. |

## Platform And Post-Launch Items

| Priority | Status | Suite | Item | Current State / Notes |
| --- | --- | --- | --- | --- |
| P2 | Needs Attention | Platform | Shared cross-suite auth/login | Not ready yet and not required before first production if we use controlled local bootstrap paths. |
| P2 | Needs Attention | OS | Full cleaning/CIP/maintenance record flow | Important, but can land after launch if tracked manually at first. |
| P2 | Needs Attention | OS | Full automation/hardware control for production execution | Manual operation is acceptable for launch; this can come later. |
| P2 | Needs Attention | OS + OPS | Fully regulator-ready system without backup paper/spreadsheet logs | Not there yet. We should keep backup logs until report/export and compliance packet workflow is complete. |

## Immediate Focus

These are the highest-value launch blockers to move next:

1. Simple OS report/export actions
2. Batch -> transfer -> packaging UX tightening
3. Removal / return / driver handoff polish across OS and OPS
4. Final compliance packet generation path

## Update Rule

When we complete work, update the status in this file:

- `Needs Attention` -> `In Progress`
- `In Progress` -> `Done`

If something becomes riskier than expected, move it back to `Needs Attention` and add a note.
