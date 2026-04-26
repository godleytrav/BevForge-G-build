# flow-ui

Scaffold placeholder for BevForge FLOW suite.

## Purpose
- Tap and keg runtime monitoring
- Pour telemetry and tap analytics
- Kiosk and customer-facing serving views

## Implementation Notes
- Preserve shared shell and universal header behavior (`packages/ui-shared/src/app-shell-contract.ts`).
- Preserve shared glass styling and suite accent tokens (`packages/ui-shared/src/suite-theme-contract.ts`).
- FLOW may emit pour events, but OS remains source of truth for quantity depletion and batch/inventory state.
