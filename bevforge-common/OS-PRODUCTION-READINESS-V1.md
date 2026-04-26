# OS Production Readiness v1

This note captures the month-one startup scope for BevForge OS.

## Goal

Get OS dependable enough to support first cider production runs with manual operations, cellar logging, packaging traceability, and OPS handoff.

## Assumed Real-World Workflow

- Manual valve operation
- Tilt hydrometer for fermentation monitoring
- Glycol may be controlled outside OS at first
- OS remains source of truth for production, batch, package lot, and packaged inventory state
- OPS handles orders, delivery, accounts, and projections

## Must Work Before First Production Month

1. Source batch creation and human-readable batch identity
2. Cellar/runboard logging for OG, SG/FG, temp, pH, ABV, notes
3. Cider-first cellar metrics where used: Brix, TA, SO2 / sulfite
4. Transfer and split tracking
5. Derived batch lineage for oak/lees/conditioning branches
6. Packaging runs and package-lot creation
7. Packaged inventory on hand by sellable SKU
8. Product/package genealogy from batch -> package lot -> OPS handoff
9. Compliance-relevant production fields captured in OS

## Current UX Priorities

1. Guided production workflow
2. Cider-first cellar logging
3. Packaging readiness and compliance visibility
4. Clear “what do I do next?” actions from batch to transfer to package to release

## Compliance Caveat

OS is approaching operational readiness, but regulator-facing reporting is not yet complete enough to be the only compliance system without backup logs.

Highest priority remaining compliance work:

1. Compliance event ledger/feed in OS
2. Formal loss / destruction / removal tracking
3. Cider-specific cellar logging depth
4. Reusable asset/container lifecycle tracking
