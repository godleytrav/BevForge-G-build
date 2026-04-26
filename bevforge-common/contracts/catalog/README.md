# Catalog Contracts

Shared BevForge catalog contracts for core product identity, media assets, label versions, and FLOW tap assignments.

## Authority Model
- OS can create and use core `productId`, `skuId`, `assetId`, and `labelVersionId` without OPS.
- OS also owns the parallel human-readable identity layer: `productCode`, batch codes, and package lot codes.
- OPS can enrich product presentation, commercial copy, and package marketing metadata.
- FLOW consumes mirrored catalog/tap-assignment data for offline kiosk and dispense UX.
- Package lots in OS must snapshot the `labelVersionId` actually used at packaging time.

## Identity Layer
- UUIDs remain the machine truth for records and cross-suite sync safety.
- Human-readable codes exist in parallel for operators, labels, QR support, and debugging.
- `skuId` remains the stable cross-suite sellable key in current OS/OPS contracts and should stay batch-agnostic.
- Batch-specific traceability belongs in batch codes and package lot codes, not in the canonical sellable SKU.

## Offline Rule
- Canonical catalog records can be mirrored locally by suite.
- FLOW should cache asset files and tap assignments on disk for offline use.
- Image clicks in FLOW map to `tapAssignmentId`, not directly to inventory or raw assets.
- Mirrored FLOW product bundles should preserve the identity chain:
  - `productId`
  - `productCode`
  - `skuId`
  - `packageLotId` / `packageLotCode` when the mounted assignment is packaged
  - `assetId` / `assetCode`
  - `labelVersionId`

## Files
- `product.schema.json`
- `product-asset.schema.json`
- `label-version.schema.json`
- `tap-assignment.schema.json`
- `identity-model-v1.md`

## Suggested JSON-on-disk Stores
- `commissioning/os/product-catalog.json`
- `commissioning/flow/tap-assignments.json`
- `commissioning/flow/product-catalog-mirror.json`
- `commissioning/ops/product-catalog-mirror.json`
