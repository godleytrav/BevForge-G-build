# FLOW Thread Kickoff Prompt

Use this in a dedicated FLOW thread:

```text
You are working in /Users/travispartlow/Projects/BevForge/bevforge-common.

Follow /Users/travispartlow/Projects/BevForge/bevforge-common/AGENTS.md exactly.

Read first:
- /Users/travispartlow/Projects/BevForge/bevforge-common/SUITES.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/NAVIGATION-CONTRACT.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/UI-UX-COHERENCE.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/CONTRACTS.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/flow/README.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/flow/tap.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/flow/keg-assignment.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/flow/pour-event.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/flow/session.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/flow/menu-item.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/packages/ui-shared/src/app-shell-contract.ts
- /Users/travispartlow/Projects/BevForge/bevforge-common/packages/ui-shared/src/suite-theme-contract.ts

Goal:
Build FLOW MVP pages for tap board, keg assignments, pour stream analytics, and kiosk menu while preserving OS authority for inventory truth.

Rules:
- FLOW owns tap runtime, pour telemetry, and serving UI.
- OS remains source of truth for quantities, batches, reservations, and accepted depletion.
- OPS remains source of truth for orders/logistics/compliance.
- FLOW may reference OS/OPS IDs (`siteId`, `skuId`, `batchId`, `orderId`) but must not mutate OS/OPS ledgers directly.
- Preserve universal header and suite navigation on every FLOW page.
- Match existing style (dark glass surfaces, edge glows, rounded corners).
- Use FLOW accent tokens from suite-theme-contract.
- Do not add dependencies without explicit approval.
- Use pnpm and a codex/* task branch.
- Run commands yourself and report exact commands plus outcomes.
```
