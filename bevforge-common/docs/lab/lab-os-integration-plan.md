# LAB -> OS Recipe Integration Plan

## Objective
Wire LAB recipe exports into OS import/execution flow while preserving suite ownership:
- LAB: authoring + export
- OS: source of truth for quantities, batch state, and execution

## Existing OS Flow (current repo)
1. `POST /api/os/recipes/import`
   - Accepts `{ filename, content }`
   - Normalizes `BevForge.json`, `beer.json`, `beer.xml`, `bsmx`
   - Stores imported recipe index.
2. `POST /api/os/recipes/preflight`
   - Evaluates equipment role mappings + inventory readiness.
3. `POST /api/os/recipes/run/start`
   - Starts run if preflight compatible (or manual override accepted).
   - Creates batch + reserves inventory.

## LAB Export Contract for OS
For `BevForge.json`, LAB should emit:
- `schemaVersion`
- `id`
- `meta` (include source marker)
- `process` (high-level stage details when available)
- `actions` and/or `steps` (execution content)
- `triggers` (optional)
- `hardware_prep` (optional)
- ingredient requirements for preflight inventory checks when available

## Integration Sequence (minimal)
1. User builds recipe draft in LAB.
2. LAB generates `BevForge.json`.
3. LAB sends export to OS import endpoint.
4. OS normalizes + indexes recipe.
5. Operator uses OS Recipe Execution page for preflight and run start.

## API Wiring in LAB UI
- Config: `VITE_OS_API_BASE` (default `http://localhost:5181`)
- Import handoff:
  - `POST ${VITE_OS_API_BASE}/api/os/recipes/import`
  - Body: `{ "filename": "BevForge.json", "content": "<stringified json>" }`
- UI response handling:
  - Success: show imported recipe id/name/format returned by OS
  - Failure: show HTTP status + message

## Data Authority Guardrails
- LAB does not call OS inventory mutation or batch mutation endpoints.
- LAB does not start runs directly in this minimal phase.
- Execution remains in OS operator flow (`/os/recipe-execution`).

## Incremental Follow-Ups
1. Add OS-side endpoint to accept signed/typed LAB export envelope.
2. Add schema validation in LAB before send.
3. Add optional one-click preflight invocation from LAB (read-only check).
4. Add regression tests for `BevForge.json` generation and OS import roundtrip.
