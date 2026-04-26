# LAB Adaptation Checklist

Use this checklist when importing an existing LAB build into this repo.

## 1) Session Setup
- Confirm working directory: `/Users/travispartlow/Projects/BevForge/bevforge-common`
- Create/use branch: `codex/lab-adaptation`
- Read:
- `AGENTS.md`
- `SUITES.md`
- `NAVIGATION-CONTRACT.md`
- `UI-UX-COHERENCE.md`
- `CONTRACTS.md`

## 2) Intake Source
- Place incoming files under `_sources/lab-import/` (reference-only).
- Do not refactor or move `_sources`.
- Inventory source files:
- app entry points
- routing
- recipe editors/builders
- import/export logic
- API calls and data models

## 3) Gap Analysis
- Map old files to target locations in `apps/lab-ui`.
- Mark each file:
- reusable as-is
- reusable with adaptation
- rewrite required
- Identify dependency gaps; request approval before adding any dependency.

## 4) Contract Alignment
- Ensure LAB exports align with OS import contract:
- `BevForge.json`
- `beer.json`
- `beer.xml`
- Validate recipe payload fields expected by OS:
- `meta`, `process`, `actions`, `triggers`, `hardware_prep` (when available)
- ingredient requirements for inventory preflight (when available)

## 5) UI/UX Alignment
- Use shared shell/nav behavior from `NAVIGATION-CONTRACT.md`.
- Keep visual coherence from `UI-UX-COHERENCE.md`.
- Preserve suite identity through accents/tokens, not layout divergence.
- Follow the current BevForge dashboard/tile direction established in OS:
- reference the OS `Active Production` tile and the updated OS summary tiles as the pattern for quick-look cards
- use tiles as quick filters and quick access points where appropriate
- prefer builder flow clarity over long all-fields-at-once forms
- separate overview, editing, compliance detail, and export detail when the page becomes dense
- LAB should feel like formulation + export readiness, not like an OS batch record clone

## 6) Integration Wiring
- Wire LAB export flow to OS recipe intake path/contracts.
- Ensure OS remains source of truth (LAB does not mutate OS inventory/batches directly).
- Validate export/import round trip with at least:
- one `BevForge.json`
- one `beer.json` or `beer.xml`

## 7) Debug & Stabilize
- Fix runtime errors first, then data correctness, then UX polish.
- Verify hot reload and route accessibility for LAB pages.
- Add/adjust minimal tests for parser/adapter logic where practical.

## 8) Deliverable Report (required)
- Commands run (exact) + outcomes.
- Files changed list.
- Known limitations and follow-up items.
- Local verification steps for user.
