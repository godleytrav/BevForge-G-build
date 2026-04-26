# Brewhouse Contracts

Definitions for a brewhouse and its device/driver bindings. These contracts support commissioning and hardware portability.

## Files
- `brewhouse.schema.json`: Logical brewhouse definition.
- `device-binding.schema.json`: Logical device definitions and driver binding references.

## Notes
- Device identity is logical and should remain stable across hardware swaps.
- Driver bindings can be replaced without changing device identity.
