# LAB Source Mapping (`_sources/lab-import/bevforge-lab` -> `apps/lab-ui`)

This mapping classifies imported LAB code by reuse strategy under current BevForge suite/contracts.

## Reusable As-Is (reference logic, no direct copy into runtime)
- `_sources/lab-import/bevforge-lab/backend/bflab/exporters/beerjson.py`
  - Keep as reference for BeerJSON field shape and naming.
- `_sources/lab-import/bevforge-lab/backend/bflab/exporters/beerxml.py`
  - Keep as reference for BeerXML export structure.
- `_sources/lab-import/bevforge-lab/data/*.json` and `_sources/lab-import/bevforge-lab/data/*.yml`
  - Reuse as source/reference datasets for style descriptors, substitutions, timing weights, water presets.
- `_sources/lab-import/bevforge-lab/openapi.json`
  - Reuse as endpoint behavior reference.

## Reusable With Adaptation (ported behavior)
- `_sources/lab-import/bevforge-lab/backend/bflab/routers/import_export.py`
  - Adapt into LAB UI export actions:
  - local file download for `BevForge.json` / `beer.json` / `beer.xml`
  - forward `BevForge.json` to OS intake endpoint.
- `_sources/lab-import/bevforge-lab/backend/bflab/routers/publish.py`
  - Adapt publish concept to OS intake model (`import -> preflight -> run`) so LAB remains authoring-only.
- `_sources/lab-import/bevforge-lab/backend/bflab/routers/recipes.py`
  - Adapt recipe draft/list semantics into TS route components and simple local draft state.
- `_sources/lab-import/bevforge-lab/backend/bflab/templates/*` and `static/js/*`
  - Adapt page responsibilities only; rewrite implementation to current React/Vite suite architecture.

## Rewrite Required
- Entire Python/FastAPI runtime (`backend/*`, `bflab/*`, `requirements.txt`, `pyproject.toml`).
  - Current repo runtime for suites is TypeScript/Vite; direct runtime reuse would violate architecture cohesion.
- SQLModel/Python persistence layer (`backend/bflab/models.py`, `db.py`, services).
  - Replace with LAB-side draft state + OS import contract handoff.
- Legacy template/static bundle coupling (`templates/*.html`, `static/*.js`).
  - Replace with route-based React components.

## Target Structure in `apps/lab-ui`
- `src/shell/*`
  - Universal shell/navigation behavior for suite pages (`/lab` entry route, drawer links across suites).
- `src/pages/LabHomePage.tsx`
  - LAB suite landing page.
- `src/pages/LabExportPage.tsx`
  - Minimal recipe draft + export actions:
  - Download `BevForge.json`, `beer.json`, `beer.xml`
  - Send `BevForge.json` to OS `/api/os/recipes/import`.
- `src/lib/exporters.ts`
  - TS exporters and `BevForge` payload builder aligned to OS importer expectations.
- `src/lib/os-integration.ts`
  - OS handoff function for import endpoint.

## Explicit Non-Migration in This Iteration
- No migration of LAB calculators, DB schema, or dynamic builder feature flag system.
- No changes in `_sources` (reference-only).
- No direct LAB mutation of OS inventory/batches (OS remains source of truth).
