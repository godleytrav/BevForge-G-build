# Canvas Contracts

Shared base schemas for the canvas engine. OS and OPS extend these contracts in their respective node libraries.

## Files
- `canvas-base.schema.json`: Shared canvas graph base schema.
- `canvas-node.schema.json`: Shared node base schema used by OS and OPS extensions.

## Notes
- This folder defines structure only. Execution semantics live in OS/OPS node libraries.
- Keep the base minimal and stable; add new fields through versioned extensions.
