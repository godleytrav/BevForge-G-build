# Navigation Contract

This defines the universal navigation behavior for all suites.

## Global Shell
- Every suite page uses the shared shell pattern:
- left hamburger drawer
- BevForge logo/brand block
- suite indicator
- global utility icons
- drawer links to all suites + global pages
- suite indicator/chip should use suite accent tokens from `packages/ui-shared/src/suite-theme-contract.ts`

## Canonical Suite Entry Routes
- `/os`
- `/ops`
- `/lab`
- `/flow`
- `/connect`

## Local Dev Suite URL Map
- OS: `http://127.0.0.1:5181`
- OPS: `http://127.0.0.1:5182`
- LAB: `http://127.0.0.1:5175`
- FLOW: `http://127.0.0.1:5182/flow` (currently hosted in OPS app)
- CONNECT: `http://127.0.0.1:5182/connect` (currently hosted in OPS app)
- Suite env vars (`VITE_*_SUITE_URL`) must point to suite base URLs, not route-specific URLs.

## Canonical Global Routes
- `/calendar` (universal cross-suite projection)

## OS Required Pages
- `/os/control-panel`
- `/os/recipe-execution`
- `/os/inventory`
- `/os/batches`
- `/os/packaged-products`

## Navigation Consistency Rules
- Any button/card that says "Control Panel" must route to `/os/control-panel`.
- Recipe import/start controls live on `/os/recipe-execution` (not canvas side panel upload flow).
- Suite home and drawer links must stay present and functional on every page.
- New pages must preserve universal header and drawer behavior.
- The calendar icon in the header must route to `/calendar`.
- Universal calendar day cells support: select on single click, create-event modal on double click/long press.

## Cross-Suite Linking Rule
- Direct links between suites are allowed.
- Data authority is not transferred by navigation.
- UI may navigate to another suite, but data writes still follow suite ownership contracts.
