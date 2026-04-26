# Recipe Contracts

Shared recipe schema and placeholders used by LAB and OS execution.

## Files
- `recipe.schema.json`: Base recipe schema placeholder.
- `BevForge.json`: Example placeholder recipe instance used by LAB and OS.
- `recipe-execution.schema.json`: Recipe-to-execution-plan adapter contract.

## Notes
- Recipes are shared across LAB and OS execution.
- Keep recipe definitions transportable and versioned.
- Recipes should compile to the shared execution plan contract used by automation.
