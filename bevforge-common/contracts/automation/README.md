# Automation Contracts

Shared contracts for rule-based automation and unified execution plans.

## Purpose
- Define one execution model for canvas automations and recipe runs.
- Keep OS execution and LAB recipe export aligned on a stable schema.

## Files
- `automation-rule.schema.json`: Trigger/condition/action automation definition.
- `execution-plan.schema.json`: Normalized plan consumed by OS runtime.

## Notes
- JSON Schema draft 2020-12.
- All contracts include `schemaVersion` and stable `id`.
- OS and OPS can extend by explicit domain-specific metadata only.
