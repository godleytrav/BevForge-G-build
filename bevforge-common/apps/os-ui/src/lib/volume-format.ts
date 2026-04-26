export const LIQUID_UNIT_OPTIONS = [
  { value: 'bbl', label: 'barrels (bbl)' },
  { value: 'gal', label: 'gallons (gal)' },
  { value: 'L', label: 'liters (L)' },
  { value: 'mL', label: 'milliliters (mL)' },
  { value: 'oz', label: 'fluid ounces (oz)' },
] as const;

export const normalizeVolumeUnit = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '');

export const isVolumeUnit = (value: string | null | undefined): boolean => {
  const normalized = normalizeVolumeUnit(value);
  return [
    'bbl',
    'bbls',
    'barrel',
    'barrels',
    'gal',
    'gals',
    'gallon',
    'gallons',
    'usgal',
    'g',
    'l',
    'liter',
    'liters',
    'litre',
    'litres',
    'ml',
    'milliliter',
    'milliliters',
    'millilitre',
    'millilitres',
    'oz',
    'floz',
    'fluidounce',
    'fluidounces',
  ].includes(normalized);
};

export const formatVolumeNumber = (value: number, digits = 1): string =>
  Number.isFinite(value) ? value.toFixed(digits) : '--';

export const formatQuantityForUnit = (
  value: number,
  unit: string | null | undefined,
  otherDigits = 2
): string => (isVolumeUnit(unit) ? formatVolumeNumber(value, 1) : value.toFixed(otherDigits));

const unitFactorToLiter = (unit: string): number | null => {
  const normalized = normalizeVolumeUnit(unit);
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(normalized)) return 1;
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(normalized)) {
    return 0.001;
  }
  if (['oz', 'floz', 'fluidounce', 'fluidounces'].includes(normalized)) {
    return 0.0295735295625;
  }
  if (['gal', 'gallon', 'gallons', 'usgal', 'g'].includes(normalized)) {
    return 3.785411784;
  }
  if (['bbl', 'barrel', 'barrels', 'bbls'].includes(normalized)) {
    return 117.347765008;
  }
  return null;
};

export const convertVolume = (value: number, fromUom: string, toUom: string): number | null => {
  const from = normalizeVolumeUnit(fromUom);
  const to = normalizeVolumeUnit(toUom);
  if (!Number.isFinite(value) || value < 0) return null;
  if (from === to) return value;
  const fromFactor = unitFactorToLiter(from);
  const toFactor = unitFactorToLiter(to);
  if (fromFactor === null || toFactor === null) return null;
  const liters = value * fromFactor;
  return liters / toFactor;
};

export const coerceLiquidUnit = (value: string | null | undefined, fallback = 'bbl'): string => {
  const normalized = normalizeVolumeUnit(value);
  if (['bbl', 'bbls', 'barrel', 'barrels'].includes(normalized)) return 'bbl';
  if (['gal', 'gals', 'gallon', 'gallons', 'usgal', 'g'].includes(normalized)) return 'gal';
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(normalized)) return 'L';
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(normalized)) return 'mL';
  return fallback;
};
