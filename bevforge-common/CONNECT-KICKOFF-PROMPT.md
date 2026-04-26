# CONNECT Thread Kickoff Prompt

Use this in a dedicated CONNECT thread:

```text
You are working in /Users/travispartlow/Projects/BevForge/bevforge-common.

Follow /Users/travispartlow/Projects/BevForge/bevforge-common/AGENTS.md exactly.

Read first:
- /Users/travispartlow/Projects/BevForge/bevforge-common/SUITES.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/NAVIGATION-CONTRACT.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/UI-UX-COHERENCE.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/CONTRACTS.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/README.md
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/employee.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/account.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/contact.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/task.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/thread.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/contracts/connect/event-link.schema.json
- /Users/travispartlow/Projects/BevForge/bevforge-common/packages/ui-shared/src/app-shell-contract.ts
- /Users/travispartlow/Projects/BevForge/bevforge-common/packages/ui-shared/src/suite-theme-contract.ts

Goal:
Build CONNECT MVP pages (Inbox, Tasks, Accounts, Contacts, Threads) with JSON-on-disk storage and strict cross-suite boundaries.

Rules:
- CONNECT owns employee/CRM/tasks/threads only.
- OS remains source of truth for quantities, batches, and reservations.
- OPS remains source of truth for orders and logistics lifecycle.
- CONNECT may reference OS/OPS IDs, but must not mutate OS/OPS ledgers directly.
- Preserve the universal header and suite navigation on every CONNECT page.
- Match existing app visual style (dark glass surfaces, edge glows, rounded corners).
- Use CONNECT accent tokens from suite-theme-contract.
- Do not add dependencies without explicit approval.
- Use pnpm and a codex/* task branch.
- Run commands yourself and report exact commands plus outcomes.
```
