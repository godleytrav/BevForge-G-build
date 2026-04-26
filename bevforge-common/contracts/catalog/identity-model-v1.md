# BevForge Identity Model v1

This document locks the current BevForge OS identity pattern used by OS and consumed by OPS/FLOW.

## Core Rule
- UUIDs remain the machine-safe record keys.
- Human-readable codes exist in parallel for operators, labels, package lots, and debugging.
- `skuId` remains the stable sellable package identifier in the current OS/OPS contracts.
- `skuId` must stay batch-agnostic.

## Human-Readable Codes
- `productCode`
  - Commercial liquid identity.
  - Example: `GC-CORE-ROAD`
- `batchCode`
  - Production batch lineage code.
  - Example: `GC-CORE-ROAD-B01`
- `packageLotCode`
  - Packaged traceability code.
  - Example: `GC-CORE-ROAD-KEG15-B01-P01`
- `assetCode`
  - Human-readable physical container or keg identity.
  - Example: `KEG-RINO-00412`

## Operational Identity Chain
- `productId`
  - UUID machine identity for the liquid/product definition.
- `skuId`
  - Stable sellable package identity generated from `productCode + packageFormatCode`.
- `batchId`
  - UUID machine identity for source or derived batch lineage.
- `packageLotId`
  - UUID packaged lot identity for the specific packaged traceability run.
- `assetId`
  - UUID physical keg/container identity mounted or fulfilled in the field.
- `labelVersionId`
  - UUID label/artwork snapshot identity used when packaging or mirroring product presentation.
- `tapAssignmentId`
  - FLOW operational binding that maps a customer-facing card to a tap/hardware target using OS-owned identity references.

## Packaging Rule
- Packaging auto-generates `skuId` from `productCode + packageFormatCode`.
- Example:
  - `productCode`: `GC-CORE-ROAD`
  - `packageFormatCode`: `KEG15`
  - `skuId`: `GC-CORE-ROAD-KEG15`

## Derived Batch Rule
- Splits and treatment branches create child batches under the same root lineage.
- Child batches carry:
  - `batchKind`
  - `rootBatchId`
  - `parentBatchId`
  - `parentBatchCode`
  - `containerLabel`
  - `containerKind`
  - `enteredContainerAt`
- If a transfer destination introduces a meaningful treatment branch, OS creates a derived product identity.

## Default Branch Mapping
- `oak_aged` -> `OAK`
- `lees_aged` -> `LEES`
- `blend` -> `BLEND`
- `backsweetened` -> `SWEET`
- `carbonated` -> `CARB`
- `filtered` -> `FILTER`
- `other` -> `OTHER`

## Examples
- Source batch:
  - `productCode`: `GC-CORE-ROAD`
  - `batchCode`: `GC-CORE-ROAD-B01`
- Oak branch:
  - `productCode`: `GC-CORE-ROAD-OAK`
  - `batchCode`: `GC-CORE-ROAD-B01-OAK`
- Packaged oak keg lot:
  - `skuId`: `GC-CORE-ROAD-OAK-KEG15`
  - `packageLotCode`: `GC-CORE-ROAD-OAK-KEG15-B01-OAK-P01`

## Cross-Suite Meaning
- OS owns:
  - product identity creation
  - batch lineage truth
  - package lot truth
  - inventory truth
- OPS consumes:
  - sellable `skuId`
  - package lot availability
  - batch/package traceability for fulfillment and compliance
- FLOW consumes:
  - `tapAssignmentId` as the operational entry point for serving actions
  - `productId` / `productCode` for mirrored product presentation
  - sellable `skuId`
  - package lot / asset assignment
  - product media mirror for offline runtime
  - `labelVersionId` when mirrored presentation must stay traceable to packaged output
