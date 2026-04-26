import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import descriptorRaw from '../data/descriptor_library.yml?raw';
import cloneCatalogRaw from '../data/clone_catalog_v1.json';
import cloneReferenceRaw from '../data/clone_reference_index.json';
import baStylesRaw from '../data/ba_styles.json';
import seedCatalogRaw from '../data/seed_catalog_v1.json';
import seedInventoryRaw from '../data/seed_inventory_v1.json';
import {
  buildConflictMap,
  cloneFromSelectionPayload,
  cloneTargets,
  computeDisabledReasons,
  computeManualPrediction,
  computeProposal,
  defaultSelections,
  indexOptions,
  normalizeDescriptorLibrary,
  sanitizeSelections,
  toggleSelection,
} from '../lib/lab-engine';
import {
  getActiveRecipeId,
  getSavedRecipe,
  hydrateRecipesFromOs,
  saveRecipe,
  setActiveRecipeId,
} from '../lib/lab-store';
import {
  buildSeedCatalog,
  resolveCatalogColorSrm,
  resolveCatalogHopAlpha,
  resolveCatalogPpg,
} from '../lib/seed-catalog';
import type {
  CatalogIngredient,
  CloneCandidate,
  ComputeProposalOutput,
  FermentationStep,
  MashStep,
  ProposalIngredient,
  ProposalOutput,
  SavedLabRecipe,
  TargetBlock,
} from '../lib/lab-types';
import { parseYamlDocument } from '../lib/yaml-lite';

type BuilderMode = 'dynamic' | 'standard' | 'hybrid';
type MetricKey = 'abv' | 'ibu' | 'srm';
type BatchUnit = 'gal' | 'bbl' | 'l' | 'pt';
type ManualSyncMode = 'linked' | 'manual';

type ManualField =
  | 'kind'
  | 'name'
  | 'amount'
  | 'unit'
  | 'ppg'
  | 'color_srm'
  | 'aa_pct'
  | 'timing'
  | 'time_min'
  | 'day_offset';

type ProcessStepField = 'name' | 'temp_c' | 'duration_min';
type FermentationField = 'stage' | 'temp_c' | 'duration_days';
type CatalogType = 'malt' | 'hop' | 'yeast' | 'adjunct';
type IngredientPickerTab = 'inventory' | 'database' | 'custom';

interface EquipmentProfile {
  id: string;
  name: string;
  batch_size_l: number;
  efficiency_pct: number;
  boil_off_l_per_hr: number;
  trub_loss_l: number;
}

interface MashProfilePreset {
  id: string;
  name: string;
  steps: MashStep[];
}

interface FermentationProfilePreset {
  id: string;
  name: string;
  steps: FermentationStep[];
}

interface WaterProfilePreset {
  id: string;
  name: string;
  bias: string;
}

interface InventoryLedger {
  reserved: Record<string, number>;
  used: Record<string, number>;
  removed: Record<string, number>;
}

interface IngredientPickerState {
  open: boolean;
  kind: ProposalIngredient['kind'];
  tab: IngredientPickerTab;
  replaceIndex?: number;
}

interface IngredientDeltaRow {
  key: string;
  kind: ProposalIngredient['kind'];
  name: string;
  status: 'match' | 'changed' | 'manual_only' | 'dynamic_only';
  detail: string;
}

interface DraftValidationResult {
  blockers: string[];
  warnings: string[];
}

const metricConfig: Record<MetricKey, { min: number; max: number; step: number }> = {
  abv: { min: 2, max: 14, step: 0.1 },
  ibu: { min: 0, max: 120, step: 1 },
  srm: { min: 1, max: 50, step: 0.1 },
};

const litersPerBatchUnit: Record<BatchUnit, number> = {
  gal: 3.785411784,
  bbl: 117.347765304,
  l: 1,
  pt: 0.473176473,
};

const batchUnitLabels: Record<BatchUnit, { short: string; long: string; step: number }> = {
  gal: { short: 'gal', long: 'Gallons (US)', step: 0.25 },
  bbl: { short: 'bbl', long: 'Barrels (US)', step: 0.1 },
  l: { short: 'L', long: 'Liters', step: 0.5 },
  pt: { short: 'pt', long: 'Pints (US)', step: 1 },
};

const standardBatchPresets: Array<{ label: string; liters: number }> = [
  { label: '5 gal', liters: 18.927 },
  { label: '10 gal', liters: 37.854 },
  { label: '1 bbl', liters: 117.348 },
  { label: '3 bbl', liters: 352.043 },
  { label: '7 bbl', liters: 821.434 },
  { label: '15 bbl', liters: 1760.217 },
];

const equipmentProfiles: EquipmentProfile[] = [
  {
    id: 'homebrew-5g',
    name: 'Homebrew 5 gal (Kettle)',
    batch_size_l: 19,
    efficiency_pct: 72,
    boil_off_l_per_hr: 3.4,
    trub_loss_l: 1.2,
  },
  {
    id: 'homebrew-10g',
    name: 'Homebrew 10 gal',
    batch_size_l: 38,
    efficiency_pct: 74,
    boil_off_l_per_hr: 5.8,
    trub_loss_l: 2.1,
  },
  {
    id: 'pilot-1bbl',
    name: 'Pilot 1 bbl',
    batch_size_l: 117,
    efficiency_pct: 78,
    boil_off_l_per_hr: 14,
    trub_loss_l: 5,
  },
];

const mashProfiles: MashProfilePreset[] = [
  {
    id: 'single-infusion',
    name: 'Single Infusion',
    steps: [
      { order_index: 0, name: 'Mash Rest', temp_c: 66, duration_min: 60 },
      { order_index: 1, name: 'Sparge', temp_c: 76, duration_min: 20 },
      { order_index: 2, name: 'Boil', temp_c: 100, duration_min: 60 },
      { order_index: 3, name: 'Steep / Whirlpool', temp_c: 82, duration_min: 20 },
    ],
  },
  {
    id: 'step-mash',
    name: 'Step Mash',
    steps: [
      { order_index: 0, name: 'Protein Rest', temp_c: 52, duration_min: 20 },
      { order_index: 1, name: 'Saccharification', temp_c: 65, duration_min: 45 },
      { order_index: 2, name: 'Mash Out', temp_c: 76, duration_min: 10 },
      { order_index: 3, name: 'Sparge', temp_c: 76, duration_min: 25 },
      { order_index: 4, name: 'Boil', temp_c: 100, duration_min: 70 },
    ],
  },
  {
    id: 'biab',
    name: 'BIAB',
    steps: [
      { order_index: 0, name: 'Full Volume Mash', temp_c: 67, duration_min: 75 },
      { order_index: 1, name: 'Lift + Drain', temp_c: 72, duration_min: 10 },
      { order_index: 2, name: 'Boil', temp_c: 100, duration_min: 60 },
      { order_index: 3, name: 'Steep / Whirlpool', temp_c: 80, duration_min: 15 },
    ],
  },
];

const fermentationProfiles: FermentationProfilePreset[] = [
  {
    id: 'ale-clean',
    name: 'Clean Ale',
    steps: [
      { order_index: 0, stage: 'primary', temp_c: 19, duration_days: 7 },
      { order_index: 1, stage: 'secondary', temp_c: 17, duration_days: 5 },
      { order_index: 2, stage: 'cold_crash', temp_c: 2, duration_days: 2 },
    ],
  },
  {
    id: 'lager',
    name: 'Lager',
    steps: [
      { order_index: 0, stage: 'primary', temp_c: 11, duration_days: 10 },
      { order_index: 1, stage: 'secondary', temp_c: 14, duration_days: 5 },
      { order_index: 2, stage: 'conditioning', temp_c: 2, duration_days: 21 },
    ],
  },
  {
    id: 'hazy',
    name: 'Hazy IPA',
    steps: [
      { order_index: 0, stage: 'primary', temp_c: 20, duration_days: 5 },
      { order_index: 1, stage: 'secondary', temp_c: 21, duration_days: 4 },
      { order_index: 2, stage: 'cold_crash', temp_c: 4, duration_days: 1 },
    ],
  },
];

const waterProfiles: WaterProfilePreset[] = [
  { id: 'balanced', name: 'Balanced', bias: 'Balanced profile' },
  { id: 'hoppy', name: 'Hoppy (Sulfate Forward)', bias: 'Sulfate-forward profile for crisp hop expression' },
  { id: 'malty', name: 'Malty (Chloride Forward)', bias: 'Chloride-forward profile for round malt body' },
];

const defaultEquipmentProfileId = equipmentProfiles[0]?.id ?? 'homebrew-5g';
const defaultMashProfileId = mashProfiles[0]?.id ?? 'single-infusion';
const defaultFermentationProfileId = fermentationProfiles[0]?.id ?? 'ale-clean';
const defaultWaterProfileId = waterProfiles[0]?.id ?? 'balanced';

const packUnits = new Set(['pack', 'packs', 'pkg', 'pk', 'package', 'packages']);
const weightUnits = new Set(['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams', 'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces']);

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const slugify = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const normalizeUnit = (unit: string): string => unit.trim().toLowerCase();
const isWeightUnit = (unit: string): boolean => weightUnits.has(normalizeUnit(unit));

const toKg = (amount: number, unit: string): number => {
  const normalized = normalizeUnit(unit);
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount;
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount / 1000;
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') return amount * 0.45359237;
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') return amount * 0.028349523125;
  return amount;
};

const toLb = (amount: number, unit: string): number => {
  const normalized = normalizeUnit(unit);
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') return amount;
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount * 2.20462262;
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount / 453.59237;
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') return amount / 16;
  return amount;
};

const toG = (amount: number, unit: string): number => {
  const normalized = normalizeUnit(unit);
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount;
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount * 1000;
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') return amount * 453.59237;
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') return amount * 28.349523125;
  return amount;
};

const convertAmountToUnit = (
  amount: number,
  fromUnit: string,
  toUnit: string,
  kind: ProposalIngredient['kind']
): number => {
  if (!Number.isFinite(amount)) return 0;
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to || from === to) return amount;

  if (packUnits.has(from) || packUnits.has(to) || kind === 'yeast') {
    if (packUnits.has(from) && packUnits.has(to)) return amount;
    return amount;
  }

  if (!weightUnits.has(from) || !weightUnits.has(to)) return amount;
  if (to === 'kg' || to === 'kilogram' || to === 'kilograms') return toKg(amount, from);
  if (to === 'lb' || to === 'lbs' || to === 'pound' || to === 'pounds') return toLb(amount, from);
  if (to === 'g' || to === 'gram' || to === 'grams') return toG(amount, from);
  if (to === 'oz' || to === 'ounce' || to === 'ounces') return toG(amount, from) / 28.349523125;
  return amount;
};

const ingredientMergeKey = (ingredient: ProposalIngredient): string => {
  const name = slugify(ingredient.name);
  if (ingredient.kind === 'hop') {
    return `${ingredient.kind}:${name}:${ingredient.timing ?? 'boil'}:${Number(ingredient.time_min ?? 0)}`;
  }
  return `${ingredient.kind}:${name}`;
};

const aggregateIngredients = (
  ingredients: ProposalIngredient[]
): Map<string, { kind: ProposalIngredient['kind']; name: string; amount: number; unit: string }> => {
  const map = new Map<string, { kind: ProposalIngredient['kind']; name: string; amount: number; unit: string }>();

  ingredients.forEach((ingredient) => {
    const key = ingredientMergeKey(ingredient);
    const amount = Number(ingredient.amount ?? 0);
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    const unit = ingredient.unit || (ingredient.kind === 'hop' ? 'g' : ingredient.kind === 'yeast' ? 'pack' : 'kg');
    const current = map.get(key);
    if (!current) {
      map.set(key, {
        kind: ingredient.kind,
        name: ingredient.name,
        amount: safeAmount,
        unit,
      });
      return;
    }

    const normalizedAmount = convertAmountToUnit(safeAmount, unit, current.unit, ingredient.kind);
    current.amount = round(current.amount + normalizedAmount, 4);
  });

  return map;
};

const buildIngredientDeltaRows = (
  manualIngredients: ProposalIngredient[],
  dynamicIngredients: ProposalIngredient[]
): IngredientDeltaRow[] => {
  const manual = aggregateIngredients(manualIngredients);
  const dynamic = aggregateIngredients(dynamicIngredients);
  const allKeys = new Set([...manual.keys(), ...dynamic.keys()]);
  const rows: IngredientDeltaRow[] = [];

  allKeys.forEach((key) => {
    const manualRow = manual.get(key);
    const dynamicRow = dynamic.get(key);
    if (manualRow && dynamicRow) {
      const dynamicAsManual = convertAmountToUnit(
        dynamicRow.amount,
        dynamicRow.unit,
        manualRow.unit,
        manualRow.kind
      );
      const delta = round(dynamicAsManual - manualRow.amount, 3);
      const tolerance = manualRow.kind === 'hop' ? 1 : 0.05;
      rows.push({
        key,
        kind: manualRow.kind,
        name: manualRow.name,
        status: Math.abs(delta) <= tolerance ? 'match' : 'changed',
        detail:
          Math.abs(delta) <= tolerance
            ? `${round(manualRow.amount, 3)} ${manualRow.unit} unchanged`
            : `Manual ${round(manualRow.amount, 3)} ${manualRow.unit} -> Dynamic ${round(dynamicAsManual, 3)} ${manualRow.unit} (${delta > 0 ? '+' : ''}${delta})`,
      });
      return;
    }

    if (manualRow) {
      rows.push({
        key,
        kind: manualRow.kind,
        name: manualRow.name,
        status: 'manual_only',
        detail: `Manual only: ${round(manualRow.amount, 3)} ${manualRow.unit}`,
      });
      return;
    }

    if (dynamicRow) {
      rows.push({
        key,
        kind: dynamicRow.kind,
        name: dynamicRow.name,
        status: 'dynamic_only',
        detail: `Dynamic only: ${round(dynamicRow.amount, 3)} ${dynamicRow.unit}`,
      });
    }
  });

  return rows.sort((left, right) => {
    const rank: Record<IngredientDeltaRow['status'], number> = {
      changed: 0,
      dynamic_only: 1,
      manual_only: 2,
      match: 3,
    };
    return rank[left.status] - rank[right.status] || left.name.localeCompare(right.name);
  });
};

const validateRecipeDraft = (params: {
  recipeName: string;
  ingredients: ProposalIngredient[];
  mashSteps: MashStep[];
  fermentationSteps: FermentationStep[];
  inventoryShortage: number;
  predictionWarnings: string[];
}): DraftValidationResult => {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const names = new Set<string>();

  if (!params.recipeName.trim()) blockers.push('Recipe name is required.');

  const fermentables = params.ingredients.filter((ingredient) => ingredient.kind === 'fermentable');
  const hops = params.ingredients.filter((ingredient) => ingredient.kind === 'hop');
  const yeasts = params.ingredients.filter((ingredient) => ingredient.kind === 'yeast');
  if (fermentables.length === 0) blockers.push('At least one fermentable is required.');
  if (hops.length === 0) blockers.push('At least one hop addition is required.');
  if (yeasts.length === 0) blockers.push('At least one yeast is required.');

  params.ingredients.forEach((ingredient) => {
    const amount = Number(ingredient.amount ?? 0);
    if (!ingredient.name.trim()) blockers.push(`Ingredient name missing for ${ingredient.kind}.`);
    if (!Number.isFinite(amount) || amount <= 0) blockers.push(`${ingredient.name || ingredient.kind} must have amount > 0.`);
    if (ingredient.kind === 'fermentable' && !isWeightUnit(ingredient.unit || '')) {
      blockers.push(`${ingredient.name || 'Fermentable'} needs a weight unit (kg/g/lb/oz).`);
    }
    if (ingredient.kind === 'hop' && !isWeightUnit(ingredient.unit || '')) {
      blockers.push(`${ingredient.name || 'Hop'} needs a weight unit (g/oz/lb/kg).`);
    }
    if (ingredient.kind === 'hop') {
      const timing = ingredient.timing ?? 'boil';
      const timeMin = Number(ingredient.time_min ?? (timing === 'ferment' ? 0 : 15));
      if (timing !== 'ferment' && (!Number.isFinite(timeMin) || timeMin <= 0)) {
        blockers.push(`${ingredient.name || 'Hop'} requires boil/whirlpool time > 0.`);
      }
    }
    const duplicateKey = `${ingredient.kind}:${slugify(ingredient.name)}`;
    if (names.has(duplicateKey) && ingredient.kind !== 'hop') {
      warnings.push(`Duplicate ${ingredient.kind} entries found for ${ingredient.name}; consider consolidating.`);
    }
    names.add(duplicateKey);
  });

  const hasMash = params.mashSteps.some((step) => /mash/i.test(step.name));
  const hasBoil = params.mashSteps.some((step) => /boil/i.test(step.name));
  if (!hasMash) blockers.push('Process step missing: mash rest.');
  if (!hasBoil) blockers.push('Process step missing: boil.');

  const hasPrimaryFermentation = params.fermentationSteps.some((step) => step.stage === 'primary');
  if (!hasPrimaryFermentation) blockers.push('Fermentation schedule missing primary stage.');

  if (params.inventoryShortage > 0) {
    warnings.push(`Inventory shortage: ${round(params.inventoryShortage, 2)} units across mapped ingredients.`);
  }

  params.predictionWarnings.forEach((warning) => {
    if (warning.includes('unusually high')) {
      blockers.push(warning);
    } else {
      warnings.push(warning);
    }
  });

  return {
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
  };
};

const toBatchLiters = (value: number, unit: BatchUnit): number => value * litersPerBatchUnit[unit];

const fromBatchLiters = (liters: number, unit: BatchUnit): number => liters / litersPerBatchUnit[unit];

const inferBatchUnit = (liters: number): BatchUnit => (liters >= 90 ? 'bbl' : 'gal');

const kindToCatalogType = (kind: ProposalIngredient['kind']): CatalogType => {
  if (kind === 'fermentable') return 'malt';
  if (kind === 'hop') return 'hop';
  if (kind === 'yeast') return 'yeast';
  return 'adjunct';
};

const catalogTypeToKind = (type: string): ProposalIngredient['kind'] => {
  if (type === 'malt') return 'fermentable';
  if (type === 'hop') return 'hop';
  if (type === 'yeast') return 'yeast';
  return 'adjunct';
};

const ingredientFromCatalog = (catalogItem: CatalogIngredient): ProposalIngredient => {
  const kind = catalogTypeToKind(catalogItem.type);
  const spec = catalogItem.spec_json ?? {};
  const base: ProposalIngredient = {
    id: catalogItem.id,
    kind,
    name: catalogItem.name,
    amount: kind === 'hop' ? 25 : kind === 'yeast' ? 1 : 1,
    unit: kind === 'hop' ? 'g' : kind === 'yeast' ? 'pack' : 'kg',
  };

  if (kind === 'fermentable') {
    base.ppg = resolveCatalogPpg(spec) ?? 36;
    base.color_srm = resolveCatalogColorSrm(spec) ?? 2;
    base.amount = 1.5;
    base.unit = 'kg';
  }

  if (kind === 'hop') {
    const alphaRaw = resolveCatalogHopAlpha(spec) ?? 0.1;
    base.aa_pct = Number.isFinite(alphaRaw) ? round(alphaRaw <= 1 ? alphaRaw * 100 : alphaRaw, 1) : 10;
    base.timing = 'boil';
    base.time_min = 60;
    base.amount = 30;
    base.unit = 'g';
  }

  if (kind === 'yeast') {
    base.amount = 1;
    base.unit = 'pack';
  }

  return base;
};

const cloneCatalog = cloneCatalogRaw as CloneCandidate[];
const cloneReference = cloneReferenceRaw as Array<{
  name: string;
  style: string;
  abv: number;
  ibu: number;
  srm: number;
  descriptors?: string[];
}>;
const baStyles = (baStylesRaw as Array<{
  style: string;
  abv: number[];
  ibu: number[];
  srm: number[];
  keywords?: string[];
}>).map((entry) => ({
  style: entry.style,
  abv: [Number(entry.abv?.[0] ?? 0), Number(entry.abv?.[1] ?? entry.abv?.[0] ?? 0)] as [number, number],
  ibu: [Number(entry.ibu?.[0] ?? 0), Number(entry.ibu?.[1] ?? entry.ibu?.[0] ?? 0)] as [number, number],
  srm: [Number(entry.srm?.[0] ?? 0), Number(entry.srm?.[1] ?? entry.srm?.[0] ?? 0)] as [number, number],
  keywords: entry.keywords ?? [],
}));
const seedCatalog = buildSeedCatalog(seedCatalogRaw as Array<Record<string, unknown>>);
const seedInventory = seedInventoryRaw as Array<{
  id: string;
  catalog_id: string;
  qty: number;
  unit: string;
  overrides_json: Record<string, number>;
  cost_per_unit?: number;
}>;

const copyTargets = (targets: TargetBlock): TargetBlock => cloneTargets(targets);

const normalizeCloneTargets = (
  base: TargetBlock,
  cloneTargetsInput: CloneCandidate['targets']
): TargetBlock => {
  const next = copyTargets(base);
  if (!cloneTargetsInput) return next;
  (['abv', 'ibu', 'srm'] as MetricKey[]).forEach((metric) => {
    const entry = cloneTargetsInput[metric];
    if (!entry) return;
    const min = Number(entry.min);
    const max = Number(entry.max);
    if (Number.isFinite(min)) next[metric].min = min;
    if (Number.isFinite(max)) next[metric].max = max;
    if (next[metric].max < next[metric].min) next[metric].max = next[metric].min;
  });
  return next;
};

const readErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unexpected error';

const makeManualRow = (kind: ProposalIngredient['kind'] = 'fermentable'): ProposalIngredient => {
  if (kind === 'hop') {
    return {
      kind: 'hop',
      name: 'New Hop',
      amount: 25,
      unit: 'g',
      aa_pct: 10,
      timing: 'boil',
      time_min: 15,
    };
  }
  if (kind === 'yeast') {
    return {
      kind: 'yeast',
      name: 'House Ale Yeast',
      amount: 1,
      unit: 'pkg',
    };
  }
  return {
    kind: 'fermentable',
    name: 'Base Malt',
    amount: 4,
    unit: 'kg',
    ppg: 36,
    color_srm: 2,
  };
};

const fermentationStages: Array<FermentationStep['stage']> = [
  'primary',
  'secondary',
  'conditioning',
  'cold_crash',
];

const defaultMashSteps = (): MashStep[] => [
  { order_index: 0, name: 'Mash Rest', temp_c: 66, duration_min: 60 },
  { order_index: 1, name: 'Sparge', temp_c: 76, duration_min: 20 },
  { order_index: 2, name: 'Boil', temp_c: 100, duration_min: 60 },
  { order_index: 3, name: 'Steep / Whirlpool', temp_c: 82, duration_min: 20 },
];

const defaultFermentationSteps = (): FermentationStep[] => [
  { order_index: 0, stage: 'primary', temp_c: 19, duration_days: 7 },
  { order_index: 1, stage: 'secondary', temp_c: 16, duration_days: 5 },
  { order_index: 2, stage: 'cold_crash', temp_c: 2, duration_days: 2 },
];

const normalizeMashSteps = (steps: MashStep[]): MashStep[] =>
  steps.map((step, index) => ({ ...step, order_index: index }));

const normalizeFermentationSteps = (steps: FermentationStep[]): FermentationStep[] =>
  steps.map((step, index) => ({ ...step, order_index: index }));

const buildManualProposal = (
  targets: TargetBlock,
  ingredients: ProposalIngredient[],
  batchSizeLiters: number,
  efficiencyPct: number,
  predicted: { og: number; fg: number },
  waterBias: string
): ProposalOutput => {
  const fermentables = ingredients.filter((ingredient) => ingredient.kind === 'fermentable');
  const hops = ingredients.filter((ingredient) => ingredient.kind === 'hop');
  const yeast = ingredients.find((ingredient) => ingredient.kind === 'yeast');

  const base = fermentables[0];
  const totalFermentableAmount = fermentables.reduce(
    (sum, ingredient) => sum + Number(ingredient.amount || 0),
    0
  );

  return {
    targets,
    og: predicted.og,
    fg: predicted.fg,
    attenuation: 0.76,
    mash_temp_c: 66,
    water_bias: waterBias,
    base_malt: {
      name: base?.name ?? 'Manual Base',
      percent:
        base && totalFermentableAmount > 0
          ? Math.min(100, Math.max(0, (Number(base.amount || 0) / totalFermentableAmount) * 100))
          : 100,
    },
    specialty_caps: fermentables.slice(1).map((ingredient) => ({
      key: ingredient.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: ingredient.name,
      percent:
        totalFermentableAmount > 0
          ? (Number(ingredient.amount || 0) / totalFermentableAmount) * 100
          : 0,
      cap:
        totalFermentableAmount > 0
          ? (Number(ingredient.amount || 0) / totalFermentableAmount) * 100
          : 0,
      ppg: ingredient.ppg,
      color_srm: ingredient.color_srm,
    })),
    hop_plan: hops.map((ingredient) => ({
      family: ingredient.name,
      variety: ingredient.name,
      timings: [
        ingredient.timing === 'ferment'
          ? 'Dry hop'
          : `${ingredient.time_min ?? 15} min ${ingredient.timing ?? 'boil'}`,
      ],
    })),
    yeast_family: yeast?.name ?? 'Manual Yeast',
    batch_size_l: batchSizeLiters,
    efficiency_pct: efficiencyPct,
  };
};

export function LabBuilderPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const library = useMemo(() => {
    const parsed = parseYamlDocument(descriptorRaw);
    return normalizeDescriptorLibrary(parsed);
  }, []);

  const optionIndex = useMemo(() => indexOptions(library), [library]);
  const conflictMap = useMemo(() => buildConflictMap(library, optionIndex), [library, optionIndex]);

  const [mode, setMode] = useState<BuilderMode>('dynamic');
  const [recipeName, setRecipeName] = useState('LAB Unified Draft');
  const [beverage, setBeverage] = useState(library.defaults.beverage);
  const [styleKey, setStyleKey] = useState('');
  const [batchSizeLiters, setBatchSizeLiters] = useState(library.defaults.batch_size_l);
  const [batchSizeUnit, setBatchSizeUnit] = useState<BatchUnit>('gal');
  const [batchScaleTarget, setBatchScaleTarget] = useState('');
  const [scaleIngredientsWithBatch, setScaleIngredientsWithBatch] = useState(true);
  const [efficiencyPct, setEfficiencyPct] = useState(library.defaults.efficiency_pct);
  const [selections, setSelections] = useState<Record<string, string[]>>(defaultSelections());
  const [targets, setTargets] = useState<TargetBlock>(copyTargets(library.defaults.targets));
  const [locks, setLocks] = useState<Record<MetricKey, boolean>>({ abv: false, ibu: false, srm: false });
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const [preferInStock, setPreferInStock] = useState(false);

  const [proposalData, setProposalData] = useState<ComputeProposalOutput | null>(null);
  const [manualIngredients, setManualIngredients] = useState<ProposalIngredient[]>([]);
  const [manualSyncMode, setManualSyncMode] = useState<ManualSyncMode>('linked');
  const [mashSteps, setMashSteps] = useState<MashStep[]>(defaultMashSteps());
  const [fermentationSteps, setFermentationSteps] = useState<FermentationStep[]>(defaultFermentationSteps());

  const [activeRecipeId, setActiveRecipeIdState] = useState<string | undefined>(getActiveRecipeId());

  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneSearch, setCloneSearch] = useState('');
  const [activeDynamicCategory, setActiveDynamicCategory] = useState('');
  const [equipmentProfileId, setEquipmentProfileId] = useState(defaultEquipmentProfileId);
  const [mashProfileId, setMashProfileId] = useState(defaultMashProfileId);
  const [fermentationProfileId, setFermentationProfileId] = useState(defaultFermentationProfileId);
  const [waterProfileId, setWaterProfileId] = useState(defaultWaterProfileId);
  const [waterBias, setWaterBias] = useState(waterProfiles[0]?.bias ?? 'Balanced profile');
  const [keepGrainRatio, setKeepGrainRatio] = useState(true);
  const [inventoryLedger, setInventoryLedger] = useState<InventoryLedger>({
    reserved: {},
    used: {},
    removed: {},
  });
  const [pickerState, setPickerState] = useState<IngredientPickerState>({
    open: false,
    kind: 'fermentable',
    tab: 'inventory',
  });
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerInStockOnly, setPickerInStockOnly] = useState(true);
  const [pickerCustomIngredient, setPickerCustomIngredient] = useState<ProposalIngredient>(
    makeManualRow('fermentable')
  );

  const disabledReasons = useMemo(
    () => computeDisabledReasons(selections, optionIndex, conflictMap),
    [selections, optionIndex, conflictMap]
  );

  const selectedKeywords = useMemo(() => {
    const words = new Set<string>();
    Object.values(selections)
      .flat()
      .forEach((key) => {
        const option = optionIndex.get(key);
        if (!option) return;
        `${option.label} ${option.key}`
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
          .forEach((token) => words.add(token));
      });
    return [...words];
  }, [selections, optionIndex]);

  const cloneResults = useMemo(() => {
    const term = cloneSearch.trim().toLowerCase();
    if (!term) return cloneCatalog;
    return cloneCatalog.filter((entry) => {
      const name = (entry.name ?? '').toLowerCase();
      const style = (entry.ba_class ?? '').toLowerCase();
      const brewery = (entry.brewery ?? '').toLowerCase();
      return name.includes(term) || style.includes(term) || brewery.includes(term);
    });
  }, [cloneSearch]);

  const equipmentProfile = useMemo(
    () => equipmentProfiles.find((profile) => profile.id === equipmentProfileId) ?? equipmentProfiles[0],
    [equipmentProfileId]
  );
  const mashProfile = useMemo(
    () => mashProfiles.find((profile) => profile.id === mashProfileId),
    [mashProfileId]
  );
  const fermentationProfile = useMemo(
    () => fermentationProfiles.find((profile) => profile.id === fermentationProfileId),
    [fermentationProfileId]
  );
  const waterProfile = useMemo(
    () => waterProfiles.find((profile) => profile.id === waterProfileId),
    [waterProfileId]
  );
  const batchSizeDisplay = useMemo(
    () => round(fromBatchLiters(batchSizeLiters, batchSizeUnit), 3),
    [batchSizeLiters, batchSizeUnit]
  );

  useEffect(() => {
    setBatchScaleTarget(round(fromBatchLiters(batchSizeLiters, batchSizeUnit), 3).toString());
  }, [batchSizeLiters, batchSizeUnit]);

  const catalogById = useMemo(() => new Map(seedCatalog.map((item) => [item.id, item])), []);
  const catalogByTypeAndSlug = useMemo(() => {
    const map = new Map<string, CatalogIngredient>();
    seedCatalog.forEach((item) => {
      map.set(`${item.type}:${slugify(item.name)}`, item);
    });
    return map;
  }, []);

  const inventoryTotals = useMemo(() => {
    const map = new Map<string, { qty: number; unit: string }>();
    seedInventory.forEach((lot) => {
      const catalogId = String(lot.catalog_id ?? '');
      if (!catalogId) return;
      const qty = Number(lot.qty ?? 0);
      if (!Number.isFinite(qty)) return;
      const current = map.get(catalogId);
      if (current) {
        current.qty += qty;
      } else {
        map.set(catalogId, { qty, unit: String(lot.unit ?? '') || 'lb' });
      }
    });
    return map;
  }, []);

  const stockByCatalogId = useMemo(() => {
    const map = new Map<
      string,
      { qty: number; unit: string; reserved: number; used: number; removed: number; available: number }
    >();

    inventoryTotals.forEach((entry, catalogId) => {
      const reserved = Number(inventoryLedger.reserved[catalogId] ?? 0);
      const used = Number(inventoryLedger.used[catalogId] ?? 0);
      const removed = Number(inventoryLedger.removed[catalogId] ?? 0);
      const available = Math.max(0, entry.qty - reserved - used - removed);
      map.set(catalogId, {
        qty: entry.qty,
        unit: entry.unit,
        reserved,
        used,
        removed,
        available,
      });
    });

    return map;
  }, [inventoryTotals, inventoryLedger]);

  const resolveCatalogForIngredient = (ingredient: ProposalIngredient): CatalogIngredient | undefined => {
    if (ingredient.id) {
      const direct = catalogById.get(ingredient.id);
      if (direct) return direct;
    }
    const key = `${kindToCatalogType(ingredient.kind)}:${slugify(ingredient.name)}`;
    return catalogByTypeAndSlug.get(key);
  };

  const ingredientStockByIndex = useMemo(() => {
    const map = new Map<
      number,
      {
        state: 'in' | 'low' | 'out' | 'custom';
        label: string;
        detail: string;
        catalogId?: string;
        requiredInInventoryUnit?: number;
      }
    >();

    manualIngredients.forEach((ingredient, index) => {
      const catalog = resolveCatalogForIngredient(ingredient);
      if (!catalog) {
        map.set(index, { state: 'custom', label: 'Custom', detail: 'Not matched to catalog' });
        return;
      }

      const stock = stockByCatalogId.get(catalog.id);
      if (!stock) {
        map.set(index, { state: 'out', label: 'Out', detail: 'No inventory lots', catalogId: catalog.id });
        return;
      }

      const required = Math.max(
        0,
        convertAmountToUnit(
          Number(ingredient.amount ?? 0),
          ingredient.unit || stock.unit,
          stock.unit,
          ingredient.kind
        )
      );

      let state: 'in' | 'low' | 'out' = 'in';
      if (required <= 0) {
        state = stock.available > 0 ? 'in' : 'out';
      } else if (stock.available <= 0) {
        state = 'out';
      } else if (stock.available < required) {
        state = 'low';
      }

      const label = state === 'in' ? 'In Stock' : state === 'low' ? 'Low' : 'Out';
      const detail =
        required > 0
          ? `${round(stock.available, 2)} ${stock.unit} avail · needs ${round(required, 2)}`
          : `${round(stock.available, 2)} ${stock.unit} avail`;

      map.set(index, {
        state,
        label,
        detail,
        catalogId: catalog.id,
        requiredInInventoryUnit: required,
      });
    });

    return map;
  }, [manualIngredients, stockByCatalogId, catalogById, catalogByTypeAndSlug]);

  const manualIngredientIssuesByIndex = useMemo(() => {
    const map = new Map<number, string[]>();
    manualIngredients.forEach((ingredient, index) => {
      const issues: string[] = [];
      const amount = Number(ingredient.amount ?? 0);
      if (!ingredient.name.trim()) issues.push('Name required');
      if (!Number.isFinite(amount) || amount <= 0) issues.push('Amount must be > 0');

      if (ingredient.kind === 'fermentable') {
        if (!isWeightUnit(ingredient.unit || '')) issues.push('Use weight unit (kg/g/lb/oz)');
        const ppg = Number(ingredient.ppg ?? 0);
        if (!Number.isFinite(ppg) || ppg < 20 || ppg > 46) issues.push('PPG out of normal range (20-46)');
        const color = Number(ingredient.color_srm ?? 0);
        if (!Number.isFinite(color) || color < 0 || color > 600) issues.push('SRM out of range');
      }

      if (ingredient.kind === 'hop') {
        if (!isWeightUnit(ingredient.unit || '')) issues.push('Use weight unit (g/oz/lb/kg)');
        const aa = Number(ingredient.aa_pct ?? 0);
        if (!Number.isFinite(aa) || aa < 0 || aa > 25) issues.push('AA% out of normal range (0-25)');
        const timing = ingredient.timing ?? 'boil';
        const timeMin = Number(ingredient.time_min ?? (timing === 'ferment' ? 0 : 15));
        if (timing !== 'ferment' && (!Number.isFinite(timeMin) || timeMin <= 0)) {
          issues.push('Boil/whirlpool hop needs time > 0');
        }
      }

      if (ingredient.kind === 'yeast' && !packUnits.has(normalizeUnit(ingredient.unit || 'pack'))) {
        issues.push('Yeast should use pack/pkg style unit');
      }

      if (issues.length > 0) map.set(index, issues);
    });
    return map;
  }, [manualIngredients]);

  const manualIngredientIssueRows = useMemo(
    () =>
      [...manualIngredientIssuesByIndex.entries()].map(([index, issues]) => ({
        index,
        name: manualIngredients[index]?.name ?? `Row ${index + 1}`,
        message: issues[0],
      })),
    [manualIngredientIssuesByIndex, manualIngredients]
  );

  const inventoryRequirements = useMemo(() => {
    const requirements = new Map<
      string,
      { catalog: CatalogIngredient; required: number; unit: string; available: number; shortage: number }
    >();

    manualIngredients.forEach((ingredient, index) => {
      const stockMeta = ingredientStockByIndex.get(index);
      if (!stockMeta?.catalogId) return;
      const catalog = catalogById.get(stockMeta.catalogId);
      const stock = stockByCatalogId.get(stockMeta.catalogId);
      if (!catalog || !stock) return;

      const current = requirements.get(catalog.id);
      const required = Number(stockMeta.requiredInInventoryUnit ?? 0);
      if (current) {
        current.required += required;
      } else {
        requirements.set(catalog.id, {
          catalog,
          required,
          unit: stock.unit,
          available: stock.available,
          shortage: 0,
        });
      }
    });

    const rows = [...requirements.values()].map((row) => ({
      ...row,
      shortage: Math.max(0, row.required - row.available),
    }));

    return rows.sort((left, right) => right.shortage - left.shortage || left.catalog.name.localeCompare(right.catalog.name));
  }, [manualIngredients, ingredientStockByIndex, catalogById, stockByCatalogId]);

  const totalInventoryShortage = useMemo(
    () => inventoryRequirements.reduce((sum, item) => sum + item.shortage, 0),
    [inventoryRequirements]
  );
  const lotCostByCatalogId = useMemo(() => {
    const map = new Map<string, number>();
    seedInventory.forEach((lot) => {
      const catalogId = String(lot.catalog_id ?? '');
      const cost = Number(lot.cost_per_unit);
      if (!catalogId || !Number.isFinite(cost) || cost <= 0) return;
      if (!map.has(catalogId)) map.set(catalogId, cost);
    });
    return map;
  }, []);
  const ingredientCostRows = useMemo(
    () =>
      manualIngredients.map((ingredient, index) => {
        const catalog = resolveCatalogForIngredient(ingredient);
        const stock = catalog ? stockByCatalogId.get(catalog.id) : undefined;
        const costPerUnit =
          Number(ingredient.cost_per_unit ?? 0) > 0
            ? Number(ingredient.cost_per_unit)
            : catalog
              ? Number(lotCostByCatalogId.get(catalog.id) ?? 0)
              : 0;

        if (!Number.isFinite(costPerUnit) || costPerUnit <= 0) {
          return {
            index,
            total: 0,
            catalogId: catalog?.id,
          };
        }

        const targetUnit = stock?.unit || ingredient.unit || 'kg';
        const convertedQty = convertAmountToUnit(
          Number(ingredient.amount ?? 0),
          ingredient.unit || targetUnit,
          targetUnit,
          ingredient.kind
        );

        return {
          index,
          total: round(Math.max(0, convertedQty) * costPerUnit, 2),
          catalogId: catalog?.id,
        };
      }),
    [manualIngredients, stockByCatalogId, lotCostByCatalogId, catalogById, catalogByTypeAndSlug]
  );
  const totalIngredientCost = useMemo(
    () => round(ingredientCostRows.reduce((sum, row) => sum + row.total, 0), 2),
    [ingredientCostRows]
  );
  const stockStateCounts = useMemo(() => {
    const counts = { in: 0, low: 0, out: 0, custom: 0 };
    ingredientStockByIndex.forEach((value) => {
      counts[value.state] += 1;
    });
    return counts;
  }, [ingredientStockByIndex]);
  const topShortages = useMemo(
    () => inventoryRequirements.filter((row) => row.shortage > 0).slice(0, 3),
    [inventoryRequirements]
  );

  const pickerCatalogItems = useMemo(() => {
    const term = pickerQuery.trim().toLowerCase();
    const targetType = kindToCatalogType(pickerState.kind);
    return seedCatalog
      .filter((item) => item.type === targetType)
      .filter((item) => (item.name ?? '').toLowerCase().includes(term))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [pickerQuery, pickerState.kind]);

  const pickerInventoryItems = useMemo(
    () =>
      pickerCatalogItems.filter((item) => {
        const stock = stockByCatalogId.get(item.id);
        return Boolean(stock && stock.qty > 0);
      }),
    [pickerCatalogItems, stockByCatalogId]
  );
  const pickerRows = useMemo(() => {
    if (pickerState.tab === 'inventory') return pickerInventoryItems;
    if (!pickerInStockOnly) return pickerCatalogItems;
    return pickerCatalogItems.filter((item) => {
      const stock = stockByCatalogId.get(item.id);
      return Boolean(stock && stock.available > 0);
    });
  }, [pickerState.tab, pickerInventoryItems, pickerCatalogItems, pickerInStockOnly, stockByCatalogId]);

  const dynamicCategoryKeys = useMemo(() => Object.keys(library.categories), [library]);
  const dynamicCategory = activeDynamicCategory
    ? library.categories[activeDynamicCategory]
    : undefined;
  const activeCategorySelected = activeDynamicCategory ? selections[activeDynamicCategory] ?? [] : [];
  const totalSelectedCount = useMemo(
    () => Object.values(selections).reduce((sum, values) => sum + values.length, 0),
    [selections]
  );

  useEffect(() => {
    if (dynamicCategoryKeys.length === 0) return;
    if (!activeDynamicCategory || !library.categories[activeDynamicCategory]) {
      setActiveDynamicCategory(dynamicCategoryKeys[0]);
    }
  }, [activeDynamicCategory, dynamicCategoryKeys, library]);

  const predictionSource = useMemo<'manual' | 'dynamic' | 'none'>(() => {
    const hasManual = manualIngredients.length > 0;
    const hasDynamic = (proposalData?.ingredients.length ?? 0) > 0;
    if (mode === 'dynamic') {
      if (hasDynamic) return 'dynamic';
      return hasManual ? 'manual' : 'none';
    }
    if (mode === 'standard') {
      if (hasManual) return 'manual';
      return hasDynamic ? 'dynamic' : 'none';
    }
    if (hasManual) return 'manual';
    return hasDynamic ? 'dynamic' : 'none';
  }, [mode, manualIngredients, proposalData]);

  const predictionIngredients = useMemo(() => {
    if (predictionSource === 'manual') return manualIngredients;
    if (predictionSource === 'dynamic') return proposalData?.ingredients ?? [];
    return [];
  }, [predictionSource, manualIngredients, proposalData]);

  const predictionSourceLabel =
    predictionSource === 'manual'
      ? 'Manual ingredient bill'
      : predictionSource === 'dynamic'
        ? 'Dynamic proposal'
        : 'No ingredients';

  const prediction = useMemo(() => {
    if (predictionIngredients.length === 0) return undefined;
    return computeManualPrediction({
      ingredients: predictionIngredients,
      targets,
      batch_size_l: batchSizeLiters,
      efficiency_pct: efficiencyPct,
      catalog: seedCatalog,
      baStyles,
      cloneReference,
      selectedKeywords,
    });
  }, [predictionIngredients, targets, batchSizeLiters, efficiencyPct, selectedKeywords]);

  const computeDynamicProposal = (
    overrides: Partial<{
      selections: Record<string, string[]>;
      targets: TargetBlock;
      batch_size_l: number;
    }> = {}
  ): ComputeProposalOutput =>
    computeProposal(
      {
        selections: overrides.selections ?? selections,
        targets: overrides.targets ?? targets,
        batch_size_l: overrides.batch_size_l ?? batchSizeLiters,
        efficiency_pct: efficiencyPct,
        prefer_in_stock: preferInStock,
      },
      library,
      optionIndex,
      seedCatalog,
      seedInventory,
      baStyles,
      cloneReference
    );

  const generateDynamicProposal = (): ComputeProposalOutput => {
    const computed = computeDynamicProposal();
    setProposalData(computed);
    if (manualSyncMode === 'linked') {
      setManualIngredients(computed.ingredients);
    }
    return computed;
  };

  useEffect(() => {
    if (mode !== 'dynamic' && mode !== 'hybrid') return;
    const computed = computeDynamicProposal();
    setProposalData(computed);
    if (manualSyncMode === 'linked') {
      setManualIngredients(computed.ingredients);
    }
  }, [mode, selections, targets, batchSizeLiters, efficiencyPct, preferInStock, library, optionIndex, manualSyncMode]);

  useEffect(() => {
    if (mode !== 'dynamic') return;
    const dynamicWater = proposalData?.proposal.water_bias;
    if (!dynamicWater) return;
    setWaterBias(dynamicWater);
    setWaterProfileId('custom');
  }, [mode, proposalData]);

  const dynamicIngredients = proposalData?.ingredients ?? [];
  const ingredientRows = useMemo(
    () => manualIngredients.map((ingredient, index) => ({ ingredient, index })),
    [manualIngredients]
  );
  const fermentableRows = ingredientRows.filter(({ ingredient }) => ingredient.kind === 'fermentable');
  const hopRows = ingredientRows.filter(({ ingredient }) => ingredient.kind === 'hop');
  const cultureRows = ingredientRows.filter(
    ({ ingredient }) => ingredient.kind === 'yeast' || ingredient.kind === 'adjunct' || ingredient.kind === 'other'
  );
  const hopScheduleRows = useMemo(() => {
    const timingOrder: Record<string, number> = { boil: 0, whirlpool: 1, ferment: 2 };
    return hopRows
      .map(({ ingredient, index }) => ({ ingredient, index }))
      .sort((left, right) => {
        const leftTiming = timingOrder[left.ingredient.timing ?? 'boil'] ?? 0;
        const rightTiming = timingOrder[right.ingredient.timing ?? 'boil'] ?? 0;
        if (leftTiming !== rightTiming) return leftTiming - rightTiming;
        return Number(right.ingredient.time_min ?? 0) - Number(left.ingredient.time_min ?? 0);
      });
  }, [hopRows]);
  const timelineEvents = useMemo(() => {
    const events: Array<{ phase: string; when: string; action: string; detail: string }> = [];
    let brewMinute = 0;

    normalizeMashSteps(mashSteps).forEach((step) => {
      const duration = Number(step.duration_min ?? 0);
      events.push({
        phase: 'Brew Day',
        when: `T+${Math.max(0, brewMinute)}m`,
        action: step.name,
        detail: `${round(step.temp_c, 1)} C for ${Math.max(0, duration)} min`,
      });
      brewMinute += Math.max(0, duration);
    });

    const boilHops = hopScheduleRows
      .filter(({ ingredient }) => (ingredient.timing ?? 'boil') === 'boil')
      .sort((left, right) => Number(right.ingredient.time_min ?? 0) - Number(left.ingredient.time_min ?? 0));
    boilHops.forEach(({ ingredient }) => {
      events.push({
        phase: 'Boil Additions',
        when: `Boil -${Math.max(0, Number(ingredient.time_min ?? 0))}m`,
        action: ingredient.name,
        detail: `${ingredient.amount} ${ingredient.unit} @ ${round(Number(ingredient.aa_pct ?? 0), 1)}% AA`,
      });
    });

    const whirlpoolHops = hopScheduleRows.filter(({ ingredient }) => ingredient.timing === 'whirlpool');
    whirlpoolHops.forEach(({ ingredient }) => {
      events.push({
        phase: 'Whirlpool',
        when: `${Math.max(0, Number(ingredient.time_min ?? 0))} min`,
        action: ingredient.name,
        detail: `${ingredient.amount} ${ingredient.unit}`,
      });
    });

    let dayCursor = 0;
    normalizeFermentationSteps(fermentationSteps).forEach((step) => {
      const duration = Math.max(0, Number(step.duration_days ?? 0));
      const startDay = dayCursor;
      const endDay = dayCursor + duration;
      events.push({
        phase: 'Fermentation',
        when: `Day ${startDay}-${endDay}`,
        action: step.stage.replaceAll('_', ' '),
        detail: `${round(step.temp_c, 1)} C for ${duration} d`,
      });
      dayCursor = endDay;
    });

    const dryHopEvents = hopScheduleRows
      .filter(({ ingredient }) => ingredient.timing === 'ferment')
      .sort((left, right) => Number(left.ingredient.day_offset ?? 0) - Number(right.ingredient.day_offset ?? 0));
    dryHopEvents.forEach(({ ingredient }) => {
      events.push({
        phase: 'Fermentation Additions',
        when: `Day ${Math.max(0, Number(ingredient.day_offset ?? 0))}`,
        action: `Dry hop: ${ingredient.name}`,
        detail: `${ingredient.amount} ${ingredient.unit}`,
      });
    });

    return events;
  }, [mashSteps, hopScheduleRows, fermentationSteps]);

  const boilStep = useMemo(
    () => mashSteps.find((step) => /boil/i.test(step.name)) ?? mashSteps[0],
    [mashSteps]
  );
  const boilMinutes = Number(boilStep?.duration_min ?? 60);
  const boilOffLiters = round((equipmentProfile?.boil_off_l_per_hr ?? 0) * (boilMinutes / 60), 2);
  const trubLossLiters = round(Number(equipmentProfile?.trub_loss_l ?? 0), 2);
  const preBoilVolumeLiters = round(batchSizeLiters + trubLossLiters + boilOffLiters, 2);
  const styleFitPercent = prediction?.class_designation
    ? Math.round(prediction.class_designation.confidence * 100)
    : undefined;
  const targetFitPercent = useMemo(() => {
    if (!prediction) return undefined;
    const withinRange = (Object.keys(metricConfig) as MetricKey[]).reduce((count, metric) => {
      const value = prediction.predicted[metric];
      if (value >= targets[metric].min && value <= targets[metric].max) return count + 1;
      return count;
    }, 0);
    return Math.round((withinRange / 3) * 100);
  }, [prediction, targets]);

  const loadSavedRecipe = (recipe: SavedLabRecipe) => {
    const loadedSelections = cloneFromSelectionPayload({
      id: recipe.id,
      name: recipe.name,
      selections: recipe.selections,
    });
    const sanitized = sanitizeSelections(loadedSelections, optionIndex, conflictMap);

    setRecipeName(recipe.name);
    setBeverage(recipe.beverage || 'beer');
    setStyleKey(recipe.style_key || '');
    setMode(recipe.mode ?? 'dynamic');
    setSelections(sanitized.selections);
    setTargets(copyTargets(recipe.targets));
    const nextBatchLiters = recipe.proposal.batch_size_l || library.defaults.batch_size_l;
    setBatchSizeLiters(nextBatchLiters);
    setBatchSizeUnit(inferBatchUnit(nextBatchLiters));
    setEfficiencyPct(recipe.proposal.efficiency_pct || library.defaults.efficiency_pct);
    setManualIngredients(recipe.manual_ingredients ?? recipe.ingredients ?? []);
    setManualSyncMode(recipe.mode === 'dynamic' ? 'linked' : 'manual');
    setEquipmentProfileId(recipe.equipment_profile_id ?? defaultEquipmentProfileId);
    setMashProfileId(recipe.mash_profile_id ?? defaultMashProfileId);
    setFermentationProfileId(recipe.fermentation_profile_id ?? defaultFermentationProfileId);
    setWaterProfileId(recipe.water_profile_id ?? defaultWaterProfileId);
    setWaterBias(recipe.water_bias ?? recipe.proposal.water_bias ?? waterProfiles[0]?.bias ?? 'Balanced profile');
    setInventoryLedger(
      recipe.inventory_ledger ?? {
        reserved: {},
        used: {},
        removed: {},
      }
    );
    setMashSteps(
      recipe.mash_steps && recipe.mash_steps.length > 0
        ? normalizeMashSteps(recipe.mash_steps)
        : defaultMashSteps()
    );
    setFermentationSteps(
      recipe.fermentation_steps && recipe.fermentation_steps.length > 0
        ? normalizeFermentationSteps(recipe.fermentation_steps)
        : defaultFermentationSteps()
    );
    setProposalData({
      proposal: recipe.proposal,
      ingredients: recipe.ingredients,
      mash_steps: recipe.mash_steps,
      fermentation_steps: recipe.fermentation_steps,
      class_designation: recipe.class_designation,
      similar_to: recipe.similar_to,
    });
    setStatus(
      `Loaded saved draft: ${recipe.name}${sanitized.removed.length > 0 ? ` · cleaned ${sanitized.removed.length} conflicting selections` : ''
      }`
    );
    setNotice('');
    setActiveRecipeId(recipe.id);
    setActiveRecipeIdState(recipe.id);
  };

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      await hydrateRecipesFromOs();
      if (!mounted) return;

      const queryRecipeId = searchParams.get('recipeId');
      if (queryRecipeId) {
        const saved = getSavedRecipe(queryRecipeId);
        if (saved) loadSavedRecipe(saved);
        return;
      }

      const active = getActiveRecipeId();
      if (!active) return;
      const saved = getSavedRecipe(active);
      if (saved) loadSavedRecipe(saved);
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (optionKey: string) => {
    const reason = disabledReasons.get(optionKey);
    const option = optionIndex.get(optionKey);
    const isSelected = option && option.category ? (selections[option.category] ?? []).includes(optionKey) : false;
    if (reason && !isSelected) return;

    const { nextSelections, notice: nextNotice } = toggleSelection(
      selections,
      optionKey,
      optionIndex,
      conflictMap
    );
    setSelections(nextSelections);
    setNotice(nextNotice);
    setStatus('');
  };

  const clearActiveCategory = () => {
    if (!activeDynamicCategory) return;
    setSelections((current) => ({
      ...current,
      [activeDynamicCategory]: [],
    }));
    setNotice('');
    setStatus('Cleared current intent category.');
  };

  const clearAllDynamicSelections = () => {
    setSelections((current) => {
      const next: Record<string, string[]> = {};
      Object.keys(current).forEach((key) => {
        next[key] = [];
      });
      return next;
    });
    setNotice('');
    setStatus('Cleared all dynamic intent selections.');
  };

  const handleTargetChange = (metric: MetricKey, bound: 'min' | 'max', rawValue: string) => {
    const numeric = Number(rawValue);
    setTargets((current) => {
      const next = copyTargets(current);
      if (!Number.isFinite(numeric)) return next;
      next[metric][bound] = numeric;
      if (locks[metric]) {
        next[metric].min = numeric;
        next[metric].max = numeric;
      }
      if (next[metric].max < next[metric].min) next[metric].max = next[metric].min;
      return next;
    });
  };

  const handleMetricSlider = (metric: MetricKey, rawValue: string) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;
    setTargets((current) => {
      const next = copyTargets(current);
      const halfRange = Math.max(0, (next[metric].max - next[metric].min) / 2);
      if (locks[metric] || halfRange === 0) {
        next[metric].min = numeric;
        next[metric].max = numeric;
      } else {
        const low = Math.max(metricConfig[metric].min, numeric - halfRange);
        const high = Math.min(metricConfig[metric].max, numeric + halfRange);
        next[metric].min = low;
        next[metric].max = Math.max(low, high);
      }
      return next;
    });
  };

  const applyClone = (clone: CloneCandidate) => {
    const cloneSelections = cloneFromSelectionPayload(clone);
    const sanitized = sanitizeSelections(cloneSelections, optionIndex, conflictMap);
    const nextTargets = normalizeCloneTargets(library.defaults.targets, clone.targets);
    const nextBatchLiters = clone.batch_size_l ?? library.defaults.batch_size_l;
    const computed = computeDynamicProposal({
      selections: sanitized.selections,
      targets: nextTargets,
      batch_size_l: nextBatchLiters,
    });

    setMode('dynamic');
    setSelections(sanitized.selections);
    setTargets(nextTargets);
    setStyleKey(clone.style_key ?? styleKey);
    setBatchSizeLiters(nextBatchLiters);
    setBatchSizeUnit(inferBatchUnit(nextBatchLiters));
    setManualSyncMode('linked');
    setManualIngredients(computed.ingredients);
    setMashSteps(normalizeMashSteps(computed.mash_steps));
    setFermentationSteps(normalizeFermentationSteps(computed.fermentation_steps));
    setWaterProfileId('custom');
    setWaterBias(computed.proposal.water_bias);
    setRecipeName(`${clone.name} Clone`);
    setCloneOpen(false);
    setCloneSearch('');
    setNotice(
      `Clone loaded: ${clone.name}${sanitized.removed.length > 0 ? ` · cleaned ${sanitized.removed.length} conflicting selections` : ''
      }`
    );
    setStatus('Clone applied and synced across Dynamic/Standard/Hybrid.');
    setProposalData(computed);
  };

  const updateManualIngredient = (index: number, field: ManualField, rawValue: string) => {
    setManualSyncMode('manual');
    setManualIngredients((current) =>
      current.map((ingredient, rowIndex) => {
        if (rowIndex !== index) return ingredient;
        if (field === 'name' || field === 'unit' || field === 'kind') {
          return {
            ...ingredient,
            [field]: rawValue,
          };
        }
        if (field === 'timing') {
          return {
            ...ingredient,
            timing: rawValue as ProposalIngredient['timing'],
          };
        }
        const numeric = Number(rawValue);
        return {
          ...ingredient,
          [field]: Number.isFinite(numeric) ? numeric : undefined,
        };
      })
    );
  };

  const addManualIngredient = (kind: ProposalIngredient['kind']) => {
    setManualSyncMode('manual');
    setManualIngredients((current) => [...current, makeManualRow(kind)]);
  };

  const removeManualIngredient = (index: number) => {
    setManualSyncMode('manual');
    setManualIngredients((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateMashStep = (index: number, field: ProcessStepField, rawValue: string) => {
    setMashProfileId('custom');
    setMashSteps((current) =>
      normalizeMashSteps(
        current.map((step, rowIndex) => {
          if (rowIndex !== index) return step;
          if (field === 'name') {
            return {
              ...step,
              name: rawValue,
            };
          }
          const numeric = Number(rawValue);
          return {
            ...step,
            [field]: Number.isFinite(numeric) ? numeric : step[field],
          };
        })
      )
    );
  };

  const addMashStepTemplate = (name: string, temp_c: number, duration_min: number) => {
    setMashProfileId('custom');
    setMashSteps((current) =>
      normalizeMashSteps([
        ...current,
        {
          order_index: current.length,
          name,
          temp_c,
          duration_min,
        },
      ])
    );
  };

  const removeMashStep = (index: number) => {
    setMashProfileId('custom');
    setMashSteps((current) => normalizeMashSteps(current.filter((_, rowIndex) => rowIndex !== index)));
  };

  const updateFermentationStep = (index: number, field: FermentationField, rawValue: string) => {
    setFermentationProfileId('custom');
    setFermentationSteps((current) =>
      normalizeFermentationSteps(
        current.map((step, rowIndex) => {
          if (rowIndex !== index) return step;
          if (field === 'stage') {
            return {
              ...step,
              stage: rawValue as FermentationStep['stage'],
            };
          }
          const numeric = Number(rawValue);
          return {
            ...step,
            [field]: Number.isFinite(numeric) ? numeric : step[field],
          };
        })
      )
    );
  };

  const addFermentationStep = (stage: FermentationStep['stage']) => {
    const defaults: Record<FermentationStep['stage'], { temp_c: number; duration_days: number }> = {
      primary: { temp_c: 19, duration_days: 7 },
      secondary: { temp_c: 16, duration_days: 5 },
      conditioning: { temp_c: 12, duration_days: 7 },
      cold_crash: { temp_c: 2, duration_days: 2 },
    };

    setFermentationProfileId('custom');
    setFermentationSteps((current) =>
      normalizeFermentationSteps([
        ...current,
        {
          order_index: current.length,
          stage,
          temp_c: defaults[stage].temp_c,
          duration_days: defaults[stage].duration_days,
        },
      ])
    );
  };

  const removeFermentationStep = (index: number) => {
    setFermentationProfileId('custom');
    setFermentationSteps((current) =>
      normalizeFermentationSteps(current.filter((_, rowIndex) => rowIndex !== index))
    );
  };

  const openIngredientPicker = (
    kind: ProposalIngredient['kind'],
    tab: IngredientPickerTab = 'inventory',
    replaceIndex?: number
  ) => {
    setPickerState({
      open: true,
      kind,
      tab,
      replaceIndex,
    });
    setPickerQuery('');
    setPickerInStockOnly(tab === 'inventory');
    setPickerCustomIngredient(makeManualRow(kind));
  };

  const closeIngredientPicker = () => {
    setPickerState((current) => ({
      ...current,
      open: false,
      replaceIndex: undefined,
    }));
  };

  const openSubstitutePicker = (index: number) => {
    const ingredient = manualIngredients[index];
    if (!ingredient) return;
    openIngredientPicker(ingredient.kind, 'inventory', index);
  };

  const handlePickerTabChange = (tab: IngredientPickerTab) => {
    setPickerState((current) => ({ ...current, tab }));
    setPickerInStockOnly(tab === 'inventory');
  };

  const upsertManualIngredientFromPicker = (next: ProposalIngredient) => {
    setManualSyncMode('manual');
    if (pickerState.replaceIndex === undefined) {
      setManualIngredients((current) => [...current, next]);
      return;
    }
    setManualIngredients((current) =>
      current.map((ingredient, rowIndex) => (rowIndex === pickerState.replaceIndex ? next : ingredient))
    );
  };

  const addIngredientFromCatalog = (catalogItem: CatalogIngredient) => {
    const ingredient = ingredientFromCatalog(catalogItem);
    upsertManualIngredientFromPicker(ingredient);
    setStatus(
      pickerState.replaceIndex === undefined
        ? `Added ${catalogItem.name} to standard recipe.`
        : `Substituted ingredient with ${catalogItem.name}.`
    );
    closeIngredientPicker();
  };

  const addCustomIngredientFromPicker = () => {
    if (!pickerCustomIngredient.name.trim()) {
      setStatus('Custom ingredient requires a name.');
      return;
    }
    const next = {
      ...pickerCustomIngredient,
      name: pickerCustomIngredient.name.trim(),
    };
    upsertManualIngredientFromPicker(next);
    setStatus(
      pickerState.replaceIndex === undefined
        ? `Added custom ingredient: ${pickerCustomIngredient.name.trim()}.`
        : `Substituted ingredient with custom entry: ${pickerCustomIngredient.name.trim()}.`
    );
    closeIngredientPicker();
  };

  const updatePickerCustomIngredient = (field: ManualField, rawValue: string) => {
    setPickerCustomIngredient((current) => {
      if (field === 'name' || field === 'unit' || field === 'kind') {
        return {
          ...current,
          [field]: rawValue,
        };
      }
      if (field === 'timing') {
        return {
          ...current,
          timing: rawValue as ProposalIngredient['timing'],
        };
      }
      const numeric = Number(rawValue);
      const fallback = Number(current[field as keyof ProposalIngredient] ?? 0);
      return {
        ...current,
        [field]: Number.isFinite(numeric) ? numeric : fallback,
      };
    });
  };

  const applyEquipmentProfile = (profileId: string) => {
    const profile = equipmentProfiles.find((entry) => entry.id === profileId);
    if (!profile) return;
    setEquipmentProfileId(profile.id);
    setBatchSizeLiters(profile.batch_size_l);
    setBatchSizeUnit(inferBatchUnit(profile.batch_size_l));
    setEfficiencyPct(profile.efficiency_pct);
    setStatus(`Applied equipment profile: ${profile.name}`);
  };

  const applyMashProfile = (profileId: string) => {
    const profile = mashProfiles.find((entry) => entry.id === profileId);
    if (!profile) {
      setStatus('Select a built-in mash profile to auto-apply.');
      return;
    }
    setMashProfileId(profile.id);
    setMashSteps(normalizeMashSteps(profile.steps));
    setStatus(`Applied mash profile: ${profile.name}`);
  };

  const applyFermentationProfile = (profileId: string) => {
    const profile = fermentationProfiles.find((entry) => entry.id === profileId);
    if (!profile) {
      setStatus('Select a built-in fermentation profile to auto-apply.');
      return;
    }
    setFermentationProfileId(profile.id);
    setFermentationSteps(normalizeFermentationSteps(profile.steps));
    setStatus(`Applied fermentation profile: ${profile.name}`);
  };

  const applyWaterProfile = (profileId: string) => {
    const profile = waterProfiles.find((entry) => entry.id === profileId);
    if (!profile) {
      setStatus('Select a built-in water profile to auto-apply.');
      return;
    }
    setWaterProfileId(profile.id);
    setWaterBias(profile.bias);
    setStatus(`Applied water profile: ${profile.name}`);
  };

  const scaleIngredientsByFactor = (
    ingredients: ProposalIngredient[],
    factor: number
  ): ProposalIngredient[] =>
    ingredients.map((ingredient) => {
      const amount = Number(ingredient.amount ?? 0);
      if (!Number.isFinite(amount) || amount < 0) return ingredient;

      const unit = normalizeUnit(ingredient.unit || '');
      const packLike = ingredient.kind === 'yeast' || packUnits.has(unit);
      const minAmount = packLike ? 0.25 : 0;
      const precision =
        packLike || unit === 'kg' || unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds'
          ? 3
          : unit === 'g' || unit === 'gram' || unit === 'grams'
            ? 1
            : 2;

      return {
        ...ingredient,
        amount: round(Math.max(minAmount, amount * factor), precision),
      };
    });

  const applyBatchSizeChange = (nextBatchLiters: number, label: string) => {
    if (!Number.isFinite(nextBatchLiters) || nextBatchLiters <= 0) {
      setStatus('Batch size must be a positive number.');
      return;
    }

    const currentBatch = Math.max(0.1, batchSizeLiters);
    const boundedBatch = clamp(nextBatchLiters, 0.5, 50000);
    const factor = boundedBatch / currentBatch;
    const shouldScaleIngredients =
      scaleIngredientsWithBatch && manualIngredients.length > 0 && Math.abs(factor - 1) > 0.0001;

    if (shouldScaleIngredients) {
      setManualSyncMode('manual');
      setManualIngredients((current) => scaleIngredientsByFactor(current, factor));
    }
    setBatchSizeLiters(round(boundedBatch, 3));

    const displayValue = round(fromBatchLiters(boundedBatch, batchSizeUnit), 3);
    const unitShort = batchUnitLabels[batchSizeUnit].short;
    const action = shouldScaleIngredients ? `Scaled recipe ${label}` : `Set batch size ${label}`;
    setStatus(`${action} -> ${displayValue} ${unitShort} (${round(boundedBatch, 2)} L)`);
  };

  const scaleBatchByFactor = (factor: number) => {
    if (!Number.isFinite(factor) || factor <= 0) return;
    applyBatchSizeChange(batchSizeLiters * factor, `x${factor.toFixed(2)}`);
  };

  const scaleBatchToTarget = () => {
    const numeric = Number(batchScaleTarget);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setStatus(`Enter a valid batch size in ${batchUnitLabels[batchSizeUnit].long}.`);
      return;
    }
    applyBatchSizeChange(toBatchLiters(numeric, batchSizeUnit), `${numeric} ${batchUnitLabels[batchSizeUnit].short}`);
  };

  const applyStandardBatchPreset = (liters: number, label: string) => {
    applyBatchSizeChange(liters, label);
  };

  const scaleManualForTarget = (scope: 'abv' | 'ibu' | 'both') => {
    if (manualIngredients.length === 0) {
      setStatus('Add ingredients before using target solver.');
      return;
    }

    const solveAbv = scope === 'abv' || scope === 'both';
    const solveIbu = scope === 'ibu' || scope === 'both';
    const targetAbv = (targets.abv.min + targets.abv.max) / 2;
    const targetIbu = (targets.ibu.min + targets.ibu.max) / 2;
    const targetSrm = (targets.srm.min + targets.srm.max) / 2;
    const abvTolerance = 0.12;
    const ibuTolerance = 2.5;
    const maxIterations = 18;

    const predictMetrics = (ingredients: ProposalIngredient[]) =>
      computeManualPrediction({
        ingredients,
        targets,
        batch_size_l: batchSizeLiters,
        efficiency_pct: efficiencyPct,
        catalog: seedCatalog,
        baStyles,
        cloneReference,
        selectedKeywords,
      }).predicted;

    let working = manualIngredients.map((ingredient) => {
      const amount = Number(ingredient.amount ?? 0);
      const next: ProposalIngredient = {
        ...ingredient,
        amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
      };

      if (ingredient.kind === 'fermentable') {
        const ppg = Number(ingredient.ppg ?? 36);
        const color = Number(ingredient.color_srm ?? 2);
        next.ppg = Number.isFinite(ppg) && ppg > 0 ? ppg : 36;
        next.color_srm = Number.isFinite(color) && color > 0 ? color : 2;
      }

      if (ingredient.kind === 'hop') {
        const aaPct = Number(ingredient.aa_pct ?? 0);
        next.aa_pct = Number.isFinite(aaPct) && aaPct > 0 ? aaPct : 8;
        const unit = normalizeUnit(ingredient.unit || 'g');
        if (!weightUnits.has(unit)) next.unit = 'g';
        next.timing = ingredient.timing ?? 'boil';
        if (next.timing !== 'ferment') {
          const fallback = next.timing === 'boil' ? 60 : 20;
          const timeMin = Number(ingredient.time_min ?? fallback);
          next.time_min = Number.isFinite(timeMin) ? Math.max(1, timeMin) : fallback;
        }
      }

      return next;
    });

    const fermentableIndices = working
      .map((ingredient, index) => ({ ingredient, index }))
      .filter((entry) => entry.ingredient.kind === 'fermentable')
      .map((entry) => entry.index);
    const hopIndices = working
      .map((ingredient, index) => ({ ingredient, index }))
      .filter((entry) => entry.ingredient.kind === 'hop')
      .map((entry) => entry.index);

    if (solveAbv && fermentableIndices.length === 0) {
      setStatus('No fermentables available to scale ABV target.');
      return;
    }
    if (solveIbu && hopIndices.length === 0) {
      setStatus('No hop additions available to scale IBU target.');
      return;
    }

    if (solveIbu) {
      const hasIbuContributor = hopIndices.some((index) => {
        const hop = working[index];
        if (!hop) return false;
        if ((hop.timing ?? 'boil') === 'ferment') return false;
        return Number(hop.aa_pct ?? 0) > 0 && Number(hop.time_min ?? 0) > 0;
      });
      if (!hasIbuContributor && hopIndices.length > 0) {
        const firstHop = hopIndices[0];
        const existing = working[firstHop];
        if (existing) {
          working[firstHop] = {
            ...existing,
            timing: 'boil',
            time_min: 60,
            aa_pct: Number(existing.aa_pct ?? 8) > 0 ? Number(existing.aa_pct) : 8,
          };
        }
      }
    }

    const primaryFermentableIndex = fermentableIndices[0] ?? -1;
    const fermentableSolveSet = new Set<number>(
      keepGrainRatio ? fermentableIndices : primaryFermentableIndex >= 0 ? [primaryFermentableIndex] : []
    );
    const hopSolveSet = new Set<number>(hopIndices);

    if (solveAbv) {
      working = working.map((ingredient, index) => {
        if (!fermentableSolveSet.has(index) || ingredient.kind !== 'fermentable') return ingredient;
        const amount = Number(ingredient.amount ?? 0);
        if (Number.isFinite(amount) && amount > 0) return ingredient;
        const unit = ingredient.unit || 'kg';
        const seeded = round(convertAmountToUnit(0.6, 'kg', unit, 'fermentable'), 3);
        return {
          ...ingredient,
          amount: seeded > 0 ? seeded : 0.6,
        };
      });
    }

    if (solveIbu) {
      working = working.map((ingredient, index) => {
        if (!hopSolveSet.has(index) || ingredient.kind !== 'hop') return ingredient;
        const amount = Number(ingredient.amount ?? 0);
        if (Number.isFinite(amount) && amount > 0) return ingredient;
        const unit = ingredient.unit || 'g';
        const seeded = round(convertAmountToUnit(15, 'g', unit, 'hop'), 2);
        return {
          ...ingredient,
          amount: seeded > 0 ? seeded : 15,
        };
      });
    }

    const scaleFermentables = (factor: number): boolean => {
      let changed = false;
      const maxKg = Math.max(30, batchSizeLiters * 0.8);

      working = working.map((ingredient, index) => {
        if (!fermentableSolveSet.has(index) || ingredient.kind !== 'fermentable') return ingredient;
        const amount = Number(ingredient.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) return ingredient;

        const unit = ingredient.unit || 'kg';
        const scaledKg = toKg(amount * factor, unit);
        const clampedKg = clamp(scaledKg, 0.05, maxKg);
        const nextAmount = round(convertAmountToUnit(clampedKg, 'kg', unit, 'fermentable'), 3);

        if (Math.abs(nextAmount - amount) < 0.0005) return ingredient;
        changed = true;
        return {
          ...ingredient,
          amount: nextAmount,
        };
      });

      return changed;
    };

    const scaleHops = (factor: number): boolean => {
      let changed = false;
      const maxGrams = Math.max(500, batchSizeLiters * 20);

      working = working.map((ingredient, index) => {
        if (!hopSolveSet.has(index) || ingredient.kind !== 'hop') return ingredient;
        const amount = Number(ingredient.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) return ingredient;

        const unit = ingredient.unit || 'g';
        const scaledGrams = toG(amount * factor, unit);
        const clampedGrams = clamp(scaledGrams, 0.1, maxGrams);
        const precision = normalizeUnit(unit) === 'kg' || normalizeUnit(unit) === 'lb' ? 3 : 2;
        const nextAmount = round(convertAmountToUnit(clampedGrams, 'g', unit, 'hop'), precision);

        if (Math.abs(nextAmount - amount) < 0.0005) return ingredient;
        changed = true;
        return {
          ...ingredient,
          amount: nextAmount,
        };
      });

      return changed;
    };

    let initial = predictMetrics(working);
    let current = initial;
    let converged = false;
    let iterations = 0;

    for (let step = 1; step <= maxIterations; step += 1) {
      iterations = step;
      let adjusted = false;

      if (solveAbv) {
        const abvError = targetAbv - current.abv;
        if (Math.abs(abvError) > abvTolerance && current.abv > 0.01) {
          const abvFactor = clamp(Math.pow(targetAbv / current.abv, 0.85), 0.12, 4);
          adjusted = scaleFermentables(abvFactor) || adjusted;
        }
      }

      if (solveIbu) {
        const ibuError = targetIbu - current.ibu;
        if (Math.abs(ibuError) > ibuTolerance && current.ibu > 0.01) {
          const ibuFactor = clamp(Math.pow(targetIbu / current.ibu, 0.85), 0.02, 6);
          adjusted = scaleHops(ibuFactor) || adjusted;
        }
      }

      if (!adjusted) {
        converged = true;
        break;
      }

      const next = predictMetrics(working);
      const stalled =
        Math.abs(next.abv - current.abv) < 0.01 &&
        Math.abs(next.ibu - current.ibu) < 0.2 &&
        Math.abs(next.srm - current.srm) < 0.1;
      current = next;

      const abvDone = !solveAbv || Math.abs(targetAbv - current.abv) <= abvTolerance;
      const ibuDone = !solveIbu || Math.abs(targetIbu - current.ibu) <= ibuTolerance;
      if (abvDone && ibuDone) {
        converged = true;
        break;
      }
      if (stalled) break;
    }

    setManualSyncMode('manual');
    setManualIngredients(working);

    const solverMode = scope === 'both' ? 'ABV + IBU' : scope.toUpperCase();
    const statusParts = [
      `${solverMode} solver ${converged ? 'converged' : 'stopped'} in ${Math.max(iterations, 1)} iter`,
      `ABV ${initial.abv.toFixed(2)} -> ${current.abv.toFixed(2)} (target ${targetAbv.toFixed(2)})`,
      `IBU ${initial.ibu.toFixed(1)} -> ${current.ibu.toFixed(1)} (target ${targetIbu.toFixed(1)})`,
      `SRM ${current.srm.toFixed(1)} (target ${targetSrm.toFixed(1)})`,
    ];
    setStatus(statusParts.join(' · '));
  };

  const reserveInventoryForRecipe = () => {
    if (inventoryRequirements.length === 0) {
      setStatus('No inventory-mapped ingredients to reserve.');
      return;
    }

    const next: InventoryLedger = {
      reserved: { ...inventoryLedger.reserved },
      used: { ...inventoryLedger.used },
      removed: { ...inventoryLedger.removed },
    };

    let reservedCount = 0;
    let shortageCount = 0;

    inventoryRequirements.forEach((requirement) => {
      const inventory = inventoryTotals.get(requirement.catalog.id);
      if (!inventory) {
        shortageCount += 1;
        return;
      }

      const used = Number(next.used[requirement.catalog.id] ?? 0);
      const removed = Number(next.removed[requirement.catalog.id] ?? 0);
      const reserved = Number(next.reserved[requirement.catalog.id] ?? 0);
      const available = Math.max(0, inventory.qty - used - removed - reserved);
      const need = Math.max(0, requirement.required - reserved - used);
      const reserveQty = Math.min(need, available);

      if (reserveQty > 0) {
        next.reserved[requirement.catalog.id] = round(reserved + reserveQty, 4);
        reservedCount += 1;
      }
      if (reserveQty < need) shortageCount += 1;
    });

    setInventoryLedger(next);
    setStatus(
      `Inventory reserve completed: ${reservedCount} items reserved${shortageCount > 0 ? `, ${shortageCount} shortages` : ''
      }.`
    );
  };

  const releaseInventoryReservations = () => {
    setInventoryLedger((current) => ({
      ...current,
      reserved: {},
    }));
    setStatus('Released inventory reservations.');
  };

  const useReservedInventory = () => {
    const reservedEntries = Object.entries(inventoryLedger.reserved).filter(([, qty]) => Number(qty) > 0);
    if (reservedEntries.length === 0) {
      setStatus('No reserved inventory to use.');
      return;
    }

    const next: InventoryLedger = {
      reserved: {},
      used: { ...inventoryLedger.used },
      removed: { ...inventoryLedger.removed },
    };

    reservedEntries.forEach(([catalogId, qty]) => {
      next.used[catalogId] = round(Number(next.used[catalogId] ?? 0) + Number(qty), 4);
    });

    setInventoryLedger(next);
    setStatus(`Moved ${reservedEntries.length} reserved items to in-use.`);
  };

  const removeUsedInventory = () => {
    const usedEntries = Object.entries(inventoryLedger.used).filter(([, qty]) => Number(qty) > 0);
    if (usedEntries.length === 0) {
      setStatus('No used inventory to remove.');
      return;
    }

    const next: InventoryLedger = {
      reserved: { ...inventoryLedger.reserved },
      used: {},
      removed: { ...inventoryLedger.removed },
    };

    usedEntries.forEach(([catalogId, qty]) => {
      next.removed[catalogId] = round(Number(next.removed[catalogId] ?? 0) + Number(qty), 4);
    });

    setInventoryLedger(next);
    setStatus(`Removed ${usedEntries.length} used items from inventory.`);
  };

  const syncManualFromDynamic = () => {
    const computed = proposalData ?? generateDynamicProposal();
    setManualSyncMode('linked');
    setManualIngredients(computed.ingredients);
    setMashSteps(normalizeMashSteps(computed.mash_steps));
    setFermentationSteps(normalizeFermentationSteps(computed.fermentation_steps));
    setWaterProfileId('custom');
    setWaterBias(computed.proposal.water_bias);
    setStatus('Manual builder seeded from dynamic proposal.');
  };

  const adoptDynamicSuggestionSet = () => {
    const computed = proposalData ?? generateDynamicProposal();
    setManualSyncMode('linked');
    setManualIngredients(computed.ingredients);
    setMashSteps(normalizeMashSteps(computed.mash_steps));
    setFermentationSteps(normalizeFermentationSteps(computed.fermentation_steps));
    setWaterProfileId('custom');
    setWaterBias(computed.proposal.water_bias);
    setStatus('Applied dynamic suggestion set to manual recipe.');
  };

  const keepManualOverrides = () => {
    setManualSyncMode('manual');
    setStatus('Manual overrides retained. Dynamic deltas remain as reference.');
  };

  const currentProposal = useMemo(() => {
    if (manualIngredients.length > 0 && mode !== 'dynamic' && prediction) {
      return buildManualProposal(
        targets,
        manualIngredients,
        batchSizeLiters,
        efficiencyPct,
        prediction.predicted,
        waterBias
      );
    }
    if (proposalData) return proposalData.proposal;
    if (prediction) {
      return buildManualProposal(
        targets,
        predictionIngredients,
        batchSizeLiters,
        efficiencyPct,
        prediction.predicted,
        waterBias
      );
    }
    return buildManualProposal(
      targets,
      manualIngredients,
      batchSizeLiters,
      efficiencyPct,
      { og: 1.05, fg: 1.012 },
      waterBias
    );
  }, [manualIngredients, mode, prediction, targets, batchSizeLiters, efficiencyPct, proposalData, predictionIngredients, waterBias]);

  const currentIngredients =
    mode === 'dynamic'
      ? proposalData?.ingredients ?? manualIngredients
      : manualIngredients.length > 0
        ? manualIngredients
        : proposalData?.ingredients ?? [];

  const ingredientDeltaRows = useMemo(
    () => buildIngredientDeltaRows(manualIngredients, proposalData?.ingredients ?? []),
    [manualIngredients, proposalData]
  );
  const ingredientDeltaSummary = useMemo(
    () => ({
      changed: ingredientDeltaRows.filter((row) => row.status === 'changed').length,
      dynamicOnly: ingredientDeltaRows.filter((row) => row.status === 'dynamic_only').length,
      manualOnly: ingredientDeltaRows.filter((row) => row.status === 'manual_only').length,
      matches: ingredientDeltaRows.filter((row) => row.status === 'match').length,
    }),
    [ingredientDeltaRows]
  );

  const draftValidation = useMemo(
    () =>
      validateRecipeDraft({
        recipeName,
        ingredients: currentIngredients,
        mashSteps,
        fermentationSteps,
        inventoryShortage: totalInventoryShortage,
        predictionWarnings: prediction?.warnings ?? [],
      }),
    [
      recipeName,
      currentIngredients,
      mashSteps,
      fermentationSteps,
      totalInventoryShortage,
      prediction,
    ]
  );

  const saveCurrentDraft = (goToExports = false) => {
    try {
      const computedProposalData =
        mode === 'dynamic' || mode === 'hybrid'
          ? proposalData ?? generateDynamicProposal()
          : proposalData;

      const proposalForSave =
        mode === 'dynamic'
          ? computedProposalData?.proposal ?? currentProposal
          : mode === 'hybrid'
            ? computedProposalData?.proposal ?? currentProposal
            : currentProposal;

      const ingredientsForSave =
        mode === 'dynamic'
          ? computedProposalData?.ingredients ?? currentIngredients
          : mode === 'hybrid'
            ? manualIngredients.length > 0
              ? manualIngredients
              : computedProposalData?.ingredients ?? currentIngredients
            : currentIngredients;

      const mashStepsForSave =
        mashSteps.length > 0
          ? normalizeMashSteps(mashSteps)
          : computedProposalData?.mash_steps ?? defaultMashSteps();
      const fermentationStepsForSave =
        fermentationSteps.length > 0
          ? normalizeFermentationSteps(fermentationSteps)
          : computedProposalData?.fermentation_steps ?? defaultFermentationSteps();

      const predictionForSave = computeManualPrediction({
        ingredients: ingredientsForSave,
        targets,
        batch_size_l: batchSizeLiters,
        efficiency_pct: efficiencyPct,
        catalog: seedCatalog,
        baStyles,
        cloneReference,
        selectedKeywords,
      });
      const saveValidation = validateRecipeDraft({
        recipeName,
        ingredients: ingredientsForSave,
        mashSteps: mashStepsForSave,
        fermentationSteps: fermentationStepsForSave,
        inventoryShortage: totalInventoryShortage,
        predictionWarnings: predictionForSave.warnings,
      });
      if (saveValidation.blockers.length > 0) {
        setStatus(`Save blocked: ${saveValidation.blockers[0]}`);
        return;
      }

      const proposalWithWorkflow = {
        ...proposalForSave,
        batch_size_l: batchSizeLiters,
        efficiency_pct: efficiencyPct,
        water_bias: mode === 'dynamic' ? proposalForSave.water_bias : waterBias,
      };

      const saved = saveRecipe(
        {
          name: recipeName.trim() || 'LAB Draft',
          beverage,
          style_key: styleKey.trim(),
          mode,
          equipment_profile_id: equipmentProfileId,
          mash_profile_id: mashProfileId,
          fermentation_profile_id: fermentationProfileId,
          water_profile_id: waterProfileId,
          water_bias: waterBias,
          inventory_ledger: inventoryLedger,
          selections,
          targets,
          manual_ingredients: manualIngredients,
          proposal: proposalWithWorkflow,
          ingredients: ingredientsForSave,
          mash_steps: mashStepsForSave,
          fermentation_steps: fermentationStepsForSave,
          class_designation:
            prediction?.class_designation ?? computedProposalData?.class_designation,
          similar_to: prediction?.similar_to ?? computedProposalData?.similar_to ?? [],
        },
        activeRecipeId
      );

      setActiveRecipeIdState(saved.id);
      if (saveValidation.warnings.length > 0) {
        setStatus(`Saved draft: ${saved.name} · warnings: ${saveValidation.warnings[0]}`);
      } else {
        setStatus(`Saved draft: ${saved.name}`);
      }
      setSearchParams({ recipeId: saved.id });
      if (goToExports) navigate(`/lab/exports?recipeId=${saved.id}`);
    } catch (error) {
      setStatus(`Save failed: ${readErrorMessage(error)}`);
    }
  };

  const startNewDraft = () => {
    setActiveRecipeIdState(undefined);
    setSearchParams({});
    setMode('dynamic');
    setRecipeName('LAB Unified Draft');
    setBeverage(library.defaults.beverage);
    setStyleKey('');
    setBatchSizeLiters(library.defaults.batch_size_l);
    setBatchSizeUnit(inferBatchUnit(library.defaults.batch_size_l));
    setEfficiencyPct(library.defaults.efficiency_pct);
    setSelections(defaultSelections());
    setTargets(copyTargets(library.defaults.targets));
    setLocks({ abv: false, ibu: false, srm: false });
    setManualSyncMode('linked');
    setManualIngredients([]);
    setMashSteps(defaultMashSteps());
    setFermentationSteps(defaultFermentationSteps());
    setEquipmentProfileId(defaultEquipmentProfileId);
    setMashProfileId(defaultMashProfileId);
    setFermentationProfileId(defaultFermentationProfileId);
    setWaterProfileId(defaultWaterProfileId);
    setWaterBias(waterProfiles[0]?.bias ?? 'Balanced profile');
    setInventoryLedger({
      reserved: {},
      used: {},
      removed: {},
    });
    setPickerState({
      open: false,
      kind: 'fermentable',
      tab: 'inventory',
    });
    setPickerQuery('');
    setPickerCustomIngredient(makeManualRow('fermentable'));
    setNotice('');
    setStatus('Started a new draft');
    setProposalData(null);
  };

  const renderStockBadge = (index: number) => {
    const stock = ingredientStockByIndex.get(index);
    const rowIssues = manualIngredientIssuesByIndex.get(index) ?? [];
    if (!stock) {
      return (
        <div className="stock-cell">
          <span className="stock-badge stock-badge--custom">Unknown</span>
          {rowIssues.length > 0 && (
            <small className="stock-detail stock-detail--warn">
              {rowIssues[0]}
              {rowIssues.length > 1 ? ` +${rowIssues.length - 1}` : ''}
            </small>
          )}
        </div>
      );
    }
    return (
      <div className="stock-cell" title={stock.detail}>
        <span className={`stock-badge stock-badge--${stock.state}`}>{stock.label}</span>
        <small className="stock-detail">{stock.detail}</small>
        {rowIssues.length > 0 && (
          <small className="stock-detail stock-detail--warn">
            {rowIssues[0]}
            {rowIssues.length > 1 ? ` +${rowIssues.length - 1}` : ''}
          </small>
        )}
      </div>
    );
  };

  return (
    <section className="lab-page">
      <header className="lab-page-head">
        <div>
          <h1>LAB Builder Workspace</h1>
          <p>Unified Dynamic, Standard, and Hybrid workflows with one recipe state.</p>
        </div>
        <div className="lab-actions">
          <button type="button" className="button" onClick={() => setCloneOpen(true)}>
            Clone A Beer
          </button>
          <button type="button" className="button button-muted" onClick={startNewDraft}>
            New Draft
          </button>
          <Link className="button button-muted" to="/lab/library">
            Open Library
          </Link>
        </div>
      </header>

      <article className="card">
        <div className="mode-tabs" role="tablist" aria-label="Builder Mode">
          {(['dynamic', 'standard', 'hybrid'] as BuilderMode[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`mode-tab ${mode === tab ? 'mode-tab--active' : ''}`}
              onClick={() => setMode(tab)}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="field-row field-row--4">
          <label>
            Recipe Name
            <input value={recipeName} onChange={(event) => setRecipeName(event.target.value)} />
          </label>
          <label>
            Style Key
            <input
              placeholder="american_ipa"
              value={styleKey}
              onChange={(event) => setStyleKey(event.target.value)}
            />
          </label>
          <label>
            Beverage
            <select value={beverage} onChange={(event) => setBeverage(event.target.value)}>
              <option value="beer">Beer</option>
              <option value="cider">Cider</option>
              <option value="mead">Mead</option>
            </select>
          </label>
          <label>
            Batch Size
            <div className="batch-size-row">
              <input
                type="number"
                min={0.1}
                step={batchUnitLabels[batchSizeUnit].step}
                value={batchSizeDisplay}
                onChange={(event) => {
                  const numeric = Number(event.target.value);
                  if (!Number.isFinite(numeric) || numeric <= 0) return;
                  setBatchSizeLiters(round(toBatchLiters(numeric, batchSizeUnit), 3));
                }}
              />
              <select
                value={batchSizeUnit}
                onChange={(event) => setBatchSizeUnit(event.target.value as BatchUnit)}
              >
                {(Object.keys(batchUnitLabels) as BatchUnit[]).map((unit) => (
                  <option key={unit} value={unit}>
                    {batchUnitLabels[unit].long}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="field-row field-row--4">
          <label>
            Efficiency (%)
            <input
              type="number"
              min={45}
              max={90}
              step={1}
              value={efficiencyPct}
              onChange={(event) => setEfficiencyPct(Number(event.target.value) || efficiencyPct)}
            />
          </label>
          <label className="switch-row">
            <span>Prefer In-Stock</span>
            <input
              type="checkbox"
              checked={preferInStock}
              onChange={(event) => setPreferInStock(event.target.checked)}
            />
          </label>
          <div className="button-row-inline">
            {(mode === 'dynamic' || mode === 'hybrid') && (
              <button
                type="button"
                className="button"
                onClick={() => {
                  generateDynamicProposal();
                  setStatus('Dynamic proposal refreshed.');
                }}
              >
                Refresh Dynamic Proposal
              </button>
            )}
            {(mode === 'hybrid' || mode === 'standard') && (
              <button type="button" className="button button-muted" onClick={syncManualFromDynamic}>
                Seed Manual From Dynamic
              </button>
            )}
          </div>
          <p className="hint small">
            Ingredient sync: {manualSyncMode === 'linked' ? 'Linked to Dynamic proposal' : 'Manual override'}
          </p>
        </div>

        <section className="batch-scaling">
          <div className="standard-panel-head">
            <h3>Batch Scaling</h3>
            <span className="hint small">Scale up/down with standard brewhouse sizes.</span>
          </div>
          <div className="batch-scaling-main">
            <label>
              Scale To ({batchUnitLabels[batchSizeUnit].short})
              <input
                type="number"
                min={0.1}
                step={batchUnitLabels[batchSizeUnit].step}
                value={batchScaleTarget}
                onChange={(event) => setBatchScaleTarget(event.target.value)}
              />
            </label>
            <label className="switch-row">
              <span>Scale Ingredients</span>
              <input
                type="checkbox"
                checked={scaleIngredientsWithBatch}
                onChange={(event) => setScaleIngredientsWithBatch(event.target.checked)}
              />
            </label>
            <div className="button-row-inline">
              <button type="button" className="button button-muted" onClick={scaleBatchToTarget}>
                Scale To Size
              </button>
              <button
                type="button"
                className="button button-muted"
                onClick={() => setBatchScaleTarget(batchSizeDisplay.toString())}
              >
                Use Current
              </button>
            </div>
          </div>
          <div className="preset-row">
            <span className="hint small">Scale factor</span>
            {[0.5, 0.75, 1.25, 1.5, 2].map((factor) => (
              <button
                key={`scale-${factor}`}
                type="button"
                className="button button-muted"
                onClick={() => scaleBatchByFactor(factor)}
              >
                x{factor}
              </button>
            ))}
          </div>
          <div className="preset-row">
            <span className="hint small">Standard batches</span>
            {standardBatchPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="button button-muted"
                onClick={() => applyStandardBatchPreset(preset.liters, preset.label)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <p className="status">{notice || 'Use chips, manual recipe lines, or both based on selected mode.'}</p>
      </article>

      <div className={`lab-dynamic ${mode === 'standard' ? 'lab-dynamic--stack' : ''}`}>
        <div className="lab-dynamic__inputs">
          {(mode === 'dynamic' || mode === 'hybrid') && (
            <article className="card card-accent">
              <h2>Dynamic Intent Model</h2>
              <div className="dynamic-intent-toolbar">
                <div className="dynamic-category-tabs" role="tablist" aria-label="Intent Categories">
                  {dynamicCategoryKeys.map((categoryKey) => (
                    <button
                      key={categoryKey}
                      type="button"
                      role="tab"
                      aria-selected={activeDynamicCategory === categoryKey}
                      className={`dynamic-category-tab ${activeDynamicCategory === categoryKey ? 'dynamic-category-tab--active' : ''}`}
                      onClick={() => setActiveDynamicCategory(categoryKey)}
                    >
                      {library.categories[categoryKey]?.label ?? categoryKey}
                    </button>
                  ))}
                </div>
                <div className="dynamic-intent-actions">
                  <span className="hint small">Selected {totalSelectedCount}</span>
                  <button type="button" className="button button-muted" onClick={clearActiveCategory}>
                    Clear Category
                  </button>
                  <button type="button" className="button button-muted" onClick={clearAllDynamicSelections}>
                    Clear All
                  </button>
                </div>
              </div>

              <div className="dynamic-intent-layout">
                <div className="dynamic-intent-choices">
                  {!dynamicCategory ? (
                    <p className="hint">No intent categories loaded.</p>
                  ) : (
                    <section className="lab-chip-column lab-chip-column--active">
                      <div className="intent-category-head">
                        <h2>{dynamicCategory.label}</h2>
                        <span className="hint small">{activeCategorySelected.length} selected</span>
                      </div>
                      <div className="lab-chip-columns">
                        {dynamicCategory.groups.map((group) => (
                          <div key={group.key} className="lab-chip-group">
                            <h3>{group.label}</h3>
                            <div className="lab-chip-list">
                              {group.options.map((option) => {
                                const selected = (selections[activeDynamicCategory] ?? []).includes(option.key);
                                const disabledReason = disabledReasons.get(option.key);
                                const disabled = Boolean(disabledReason && !selected);
                                return (
                                  <div key={option.key} className="lab-chip-wrap">
                                    <button
                                      type="button"
                                      className={`lab-chip ${selected ? 'lab-chip--active' : ''} ${disabled ? 'lab-chip--disabled' : ''}`}
                                      onClick={() => handleToggle(option.key)}
                                      disabled={disabled}
                                      title={disabledReason || option.label}
                                    >
                                      {option.label}
                                    </button>
                                    {disabledReason && !selected && (
                                      <small className="lab-chip-reason">{disabledReason}</small>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <aside className="dynamic-ingredients-panel">
                  <h3>Assigned Ingredient Bill</h3>
                  <p className="hint">
                    Dynamic allocation updates from your notes, aromas, mouthfeel, and target ranges.
                  </p>
                  <div className="dynamic-selected-pills">
                    {activeCategorySelected.length === 0 ? (
                      <p className="hint small">No selections in this category.</p>
                    ) : (
                      activeCategorySelected.map((key) => (
                        <span key={key} className="dynamic-selected-pill">
                          {optionIndex.get(key)?.label ?? key}
                        </span>
                      ))
                    )}
                  </div>
                  {dynamicIngredients.length === 0 ? (
                    <p className="hint">No dynamic ingredients yet.</p>
                  ) : (
                    <div className="dynamic-ingredients-groups">
                      {(['fermentable', 'hop', 'yeast', 'adjunct', 'other'] as ProposalIngredient['kind'][]).map((kind) => {
                        const entries = dynamicIngredients.filter((ingredient) => ingredient.kind === kind);
                        if (entries.length === 0) return null;
                        return (
                          <section key={kind} className="dynamic-ingredients-group">
                            <h4>{kind[0].toUpperCase() + kind.slice(1)}s</h4>
                            <ul>
                              {entries.map((ingredient, index) => (
                                <li key={`${kind}-${ingredient.name}-${index}`}>
                                  <span>
                                    {ingredient.name}{' '}
                                    <small>
                                      {ingredient.timing
                                        ? `(${ingredient.timing}${ingredient.time_min ? ` ${ingredient.time_min}m` : ''})`
                                        : ''}
                                    </small>
                                  </span>
                                  <strong>
                                    {Number(ingredient.amount).toFixed(Number(ingredient.amount) >= 10 ? 1 : 2)}{' '}
                                    {ingredient.unit}
                                  </strong>
                                </li>
                              ))}
                            </ul>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </aside>
              </div>
            </article>
          )}

          {(mode === 'standard' || mode === 'hybrid') && (
            <article className="card">
              <h2>Standard Recipe Builder</h2>
              <section className="standard-panel standard-panel--full standard-workbench">
                <div className="standard-panel-head">
                  <h3>Brewhouse Setup + Controls</h3>
                  <span className="hint small">
                    Profiles and inventory tooling similar to BeerSmith/Brewfather workflow.
                  </span>
                </div>

                <div className="field-row field-row--4">
                  <label>
                    Equipment Profile
                    <select
                      value={equipmentProfileId}
                      onChange={(event) => applyEquipmentProfile(event.target.value)}
                    >
                      {equipmentProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mash Profile
                    <select value={mashProfileId} onChange={(event) => setMashProfileId(event.target.value)}>
                      {mashProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <label>
                    Fermentation Profile
                    <select
                      value={fermentationProfileId}
                      onChange={(event) => setFermentationProfileId(event.target.value)}
                    >
                      {fermentationProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <label>
                    Water Profile
                    <select value={waterProfileId} onChange={(event) => setWaterProfileId(event.target.value)}>
                      {waterProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                </div>

                <div className="button-row-inline">
                  <button type="button" className="button button-muted" onClick={() => applyMashProfile(mashProfileId)}>
                    Apply Mash Profile
                  </button>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() => applyFermentationProfile(fermentationProfileId)}
                  >
                    Apply Fermentation Profile
                  </button>
                  <button type="button" className="button button-muted" onClick={() => applyWaterProfile(waterProfileId)}>
                    Apply Water Profile
                  </button>
                </div>

                <label>
                  Water Note / Bias
                  <input
                    value={waterBias}
                    onChange={(event) => {
                      setWaterProfileId('custom');
                      setWaterBias(event.target.value);
                    }}
                  />
                </label>

                <div className="status-grid">
                  <div className="status-chip">Pre-boil {preBoilVolumeLiters.toFixed(1)} L</div>
                  <div className="status-chip">Boil-off {boilOffLiters.toFixed(1)} L</div>
                  <div className="status-chip">Trub/Loss {trubLossLiters.toFixed(1)} L</div>
                  <div className="status-chip">Boil {boilMinutes} min</div>
                </div>
                <p className="hint small">
                  Active profiles: {mashProfile?.name ?? 'Custom'} · {fermentationProfile?.name ?? 'Custom'} ·{' '}
                  {waterProfile?.name ?? 'Custom'}
                </p>

                <div className="solver-row">
                  <label className="switch-row">
                    <span>Keep Grain %</span>
                    <input
                      type="checkbox"
                      checked={keepGrainRatio}
                      onChange={(event) => setKeepGrainRatio(event.target.checked)}
                    />
                  </label>
                  <button type="button" className="button button-muted" onClick={() => scaleManualForTarget('abv')}>
                    Solve ABV
                  </button>
                  <button type="button" className="button button-muted" onClick={() => scaleManualForTarget('ibu')}>
                    Solve IBU
                  </button>
                  <button type="button" className="button button-muted" onClick={() => scaleManualForTarget('both')}>
                    Solve ABV + IBU
                  </button>
                </div>

                <div className="inventory-actions">
                  <button type="button" className="button button-muted" onClick={reserveInventoryForRecipe}>
                    Reserve Inventory
                  </button>
                  <button type="button" className="button button-muted" onClick={releaseInventoryReservations}>
                    Release Reservation
                  </button>
                  <button type="button" className="button button-muted" onClick={useReservedInventory}>
                    Mark As Used
                  </button>
                  <button type="button" className="button button-muted" onClick={removeUsedInventory}>
                    Remove Used Stock
                  </button>
                  <span className={`inventory-health ${totalInventoryShortage > 0 ? 'inventory-health--warn' : ''}`}>
                    {totalInventoryShortage > 0
                      ? `Shortage ${round(totalInventoryShortage, 2)}`
                      : 'No shortage'}
                  </span>
                </div>

                <div className="inventory-summary">
                  {inventoryRequirements.length === 0 ? (
                    <p className="hint">No inventory-mapped standard ingredients yet.</p>
                  ) : (
                    <ul className="inventory-summary-list">
                      {inventoryRequirements.map((entry) => (
                        <li key={entry.catalog.id}>
                          <span>{entry.catalog.name}</span>
                          <span>
                            Need {round(entry.required, 2)} {entry.unit} · Avail {round(entry.available, 2)}
                          </span>
                          <strong>{entry.shortage > 0 ? `Short ${round(entry.shortage, 2)}` : 'OK'}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {proposalData && (
                  <section className="merge-delta-card">
                    <div className="standard-panel-head">
                      <h3>Dynamic vs Manual Delta</h3>
                      <div className="button-row-inline">
                        <button type="button" className="button button-muted" onClick={adoptDynamicSuggestionSet}>
                          Apply Dynamic Suggestion Set
                        </button>
                        <button type="button" className="button button-muted" onClick={keepManualOverrides}>
                          Keep Manual Overrides
                        </button>
                      </div>
                    </div>
                    <div className="status-grid merge-delta-grid">
                      <div className="status-chip">Changed {ingredientDeltaSummary.changed}</div>
                      <div className="status-chip">Dynamic-only {ingredientDeltaSummary.dynamicOnly}</div>
                      <div className="status-chip">Manual-only {ingredientDeltaSummary.manualOnly}</div>
                      <div className="status-chip">Matched {ingredientDeltaSummary.matches}</div>
                    </div>
                    {ingredientDeltaRows.length === 0 ? (
                      <p className="hint small">No ingredient deltas detected.</p>
                    ) : (
                      <ul className="summary-shortages">
                        {ingredientDeltaRows.slice(0, 8).map((row) => (
                          <li key={row.key}>
                            <span>
                              {row.name} ({row.kind})
                            </span>
                            <strong>{row.detail}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                <section className="validation-card">
                  <div className="standard-panel-head">
                    <h3>Recipe Validity Gate</h3>
                    <span className="hint small">
                      {draftValidation.blockers.length > 0
                        ? `${draftValidation.blockers.length} blocker(s)`
                        : 'No blockers'}
                    </span>
                  </div>
                  {draftValidation.blockers.length === 0 ? (
                    <p className="hint small">Draft is save-ready.</p>
                  ) : (
                    <ul className="summary-shortages">
                      {draftValidation.blockers.map((item, index) => (
                        <li key={`blocker-${index}`}>
                          <span>Blocker</span>
                          <strong>{item}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                  {draftValidation.warnings.length > 0 && (
                    <ul className="summary-shortages">
                      {draftValidation.warnings.slice(0, 5).map((item, index) => (
                        <li key={`draft-warning-${index}`}>
                          <span>Warning</span>
                          <strong>{item}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                  {manualIngredientIssueRows.length > 0 && (
                    <ul className="summary-shortages">
                      {manualIngredientIssueRows.slice(0, 5).map((row) => (
                        <li key={`row-issue-${row.index}`}>
                          <span>Row {row.index + 1}</span>
                          <strong>
                            {row.name}: {row.message}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </section>
              <div className="standard-main-layout">
                <div className="standard-layout">
                <section className="standard-panel">
                  <div className="standard-panel-head">
                    <h3>Fermentables</h3>
                    <div className="manual-actions">
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('fermentable', 'inventory')}
                      >
                        + From Inventory
                      </button>
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('fermentable', 'database')}
                      >
                        + From Database
                      </button>
                      <button type="button" className="button button-muted" onClick={() => addManualIngredient('fermentable')}>
                        + Custom
                      </button>
                    </div>
                  </div>
                  <div className="manual-table-wrap">
                    <table className="manual-table manual-table--compact">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Amount</th>
                          <th>Unit</th>
                          <th>PPG</th>
                          <th>SRM</th>
                          <th>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fermentableRows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="hint">
                              No fermentables yet.
                            </td>
                          </tr>
                        )}
                        {fermentableRows.map(({ ingredient, index }) => (
                          <tr key={`fermentable-${index}`}>
                            <td>
                              <input
                                value={ingredient.name}
                                onChange={(event) => updateManualIngredient(index, 'name', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step={0.1}
                                value={ingredient.amount}
                                onChange={(event) => updateManualIngredient(index, 'amount', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                value={ingredient.unit}
                                onChange={(event) => updateManualIngredient(index, 'unit', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step={0.1}
                                value={ingredient.ppg ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'ppg', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step={0.1}
                                value={ingredient.color_srm ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'color_srm', event.target.value)}
                              />
                            </td>
                            <td>
                              {renderStockBadge(index)}
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="button button-muted"
                                  onClick={() => openSubstitutePicker(index)}
                                >
                                  Substitute
                                </button>
                                <button
                                  type="button"
                                  className="button button-muted"
                                  onClick={() => removeManualIngredient(index)}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="standard-panel">
                  <div className="standard-panel-head">
                    <h3>Hop Schedule</h3>
                    <div className="manual-actions">
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('hop', 'inventory')}
                      >
                        + From Inventory
                      </button>
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('hop', 'database')}
                      >
                        + From Database
                      </button>
                      <button type="button" className="button button-muted" onClick={() => addManualIngredient('hop')}>
                        + Custom
                      </button>
                    </div>
                  </div>
                  <div className="manual-table-wrap">
                    <table className="manual-table manual-table--compact">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Amount</th>
                          <th>Unit</th>
                          <th>AA%</th>
                          <th>Timing</th>
                          <th>Min</th>
                          <th>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {hopRows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="hint">
                              No hop additions yet.
                            </td>
                          </tr>
                        )}
                        {hopRows.map(({ ingredient, index }) => (
                          <tr key={`hop-${index}`}>
                            <td>
                              <input
                                value={ingredient.name}
                                onChange={(event) => updateManualIngredient(index, 'name', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step={0.1}
                                value={ingredient.amount}
                                onChange={(event) => updateManualIngredient(index, 'amount', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                value={ingredient.unit}
                                onChange={(event) => updateManualIngredient(index, 'unit', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step={0.1}
                                value={ingredient.aa_pct ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'aa_pct', event.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                value={ingredient.timing ?? 'boil'}
                                onChange={(event) => updateManualIngredient(index, 'timing', event.target.value)}
                              >
                                <option value="boil">Boil</option>
                                <option value="whirlpool">Whirlpool</option>
                                <option value="ferment">Ferment</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                step={1}
                                value={ingredient.time_min ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'time_min', event.target.value)}
                              />
                            </td>
                            <td>
                              {renderStockBadge(index)}
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="button button-muted"
                                  onClick={() => openSubstitutePicker(index)}
                                >
                                  Substitute
                                </button>
                                <button
                                  type="button"
                                  className="button button-muted"
                                  onClick={() => removeManualIngredient(index)}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="standard-panel">
                  <div className="standard-panel-head">
                    <h3>Yeast + Adjuncts</h3>
                    <div className="manual-actions">
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('yeast', 'inventory')}
                      >
                        + Yeast From Inventory
                      </button>
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('yeast', 'database')}
                      >
                        + Yeast From Database
                      </button>
                      <button type="button" className="button button-muted" onClick={() => addManualIngredient('yeast')}>
                        + Custom Yeast
                      </button>
                      <button
                        type="button"
                        className="button button-muted"
                        onClick={() => openIngredientPicker('adjunct', 'database')}
                      >
                        + Adjunct From Database
                      </button>
                      <button type="button" className="button button-muted" onClick={() => addManualIngredient('adjunct')}>
                        + Custom Adjunct
                      </button>
                    </div>
                  </div>
                  <div className="manual-table-wrap">
                    <table className="manual-table manual-table--compact">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Name</th>
                          <th>Amount</th>
                          <th>Unit</th>
                          <th>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cultureRows.length === 0 && (
                          <tr>
                            <td colSpan={6} className="hint">
                              No yeast or adjunct additions yet.
                            </td>
                          </tr>
                        )}
                        {cultureRows.map(({ ingredient, index }) => (
                          <tr key={`culture-${index}`}>
                            <td>
                              <select
                                value={ingredient.kind}
                                onChange={(event) => updateManualIngredient(index, 'kind', event.target.value)}
                              >
                                <option value="yeast">Yeast</option>
                                <option value="adjunct">Adjunct</option>
                                <option value="other">Other</option>
                              </select>
                            </td>
                            <td>
                              <input
                                value={ingredient.name}
                                onChange={(event) => updateManualIngredient(index, 'name', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step={0.1}
                                value={ingredient.amount}
                                onChange={(event) => updateManualIngredient(index, 'amount', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                value={ingredient.unit}
                                onChange={(event) => updateManualIngredient(index, 'unit', event.target.value)}
                              />
                            </td>
                            <td>
                              {renderStockBadge(index)}
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="button button-muted"
                                  onClick={() => openSubstitutePicker(index)}
                                >
                                  Substitute
                                </button>
                                <button
                                  type="button"
                                  className="button button-muted"
                                  onClick={() => removeManualIngredient(index)}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="standard-panel standard-panel--full">
                  <div className="standard-panel-head">
                    <h3>Process Steps</h3>
                    <span className="hint small">Define mash, sparge, boil, steep, and fermentation profile.</span>
                  </div>
                  <div className="process-grid">
                    <article className="process-card">
                      <div className="process-card-head">
                        <h4>Mash / Sparge / Boil / Steep</h4>
                        <div className="process-actions">
                          <button type="button" className="button button-muted" onClick={() => addMashStepTemplate('Mash Rest', 66, 60)}>
                            + Mash
                          </button>
                          <button type="button" className="button button-muted" onClick={() => addMashStepTemplate('Sparge', 76, 20)}>
                            + Sparge
                          </button>
                          <button type="button" className="button button-muted" onClick={() => addMashStepTemplate('Boil', 100, 60)}>
                            + Boil
                          </button>
                          <button type="button" className="button button-muted" onClick={() => addMashStepTemplate('Steep / Whirlpool', 82, 20)}>
                            + Steep
                          </button>
                        </div>
                      </div>
                      <div className="manual-table-wrap">
                        <table className="manual-table manual-table--compact">
                          <thead>
                            <tr>
                              <th>Step</th>
                              <th>Target C</th>
                              <th>Duration min</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {mashSteps.map((step, index) => (
                              <tr key={`mash-step-${index}`}>
                                <td>
                                  <input
                                    value={step.name}
                                    onChange={(event) => updateMashStep(index, 'name', event.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step={0.1}
                                    value={step.temp_c}
                                    onChange={(event) => updateMashStep(index, 'temp_c', event.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step={1}
                                    value={step.duration_min}
                                    onChange={(event) => updateMashStep(index, 'duration_min', event.target.value)}
                                  />
                                </td>
                                <td>
                                  <button type="button" className="button button-muted" onClick={() => removeMashStep(index)}>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>

                    <article className="process-card">
                      <div className="process-card-head">
                        <h4>Fermentation Schedule</h4>
                        <div className="process-actions">
                          <button type="button" className="button button-muted" onClick={() => addFermentationStep('primary')}>
                            + Primary
                          </button>
                          <button type="button" className="button button-muted" onClick={() => addFermentationStep('secondary')}>
                            + Secondary
                          </button>
                          <button type="button" className="button button-muted" onClick={() => addFermentationStep('conditioning')}>
                            + Conditioning
                          </button>
                          <button type="button" className="button button-muted" onClick={() => addFermentationStep('cold_crash')}>
                            + Cold Crash
                          </button>
                        </div>
                      </div>
                      <div className="manual-table-wrap">
                        <table className="manual-table manual-table--compact">
                          <thead>
                            <tr>
                              <th>Stage</th>
                              <th>Target C</th>
                              <th>Days</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {fermentationSteps.map((step, index) => (
                              <tr key={`ferm-step-${index}`}>
                                <td>
                                  <select
                                    value={step.stage}
                                    onChange={(event) => updateFermentationStep(index, 'stage', event.target.value)}
                                  >
                                    {fermentationStages.map((stage) => (
                                      <option key={stage} value={stage}>
                                        {stage.replaceAll('_', ' ')}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step={0.1}
                                    value={step.temp_c}
                                    onChange={(event) => updateFermentationStep(index, 'temp_c', event.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step={1}
                                    value={step.duration_days}
                                    onChange={(event) => updateFermentationStep(index, 'duration_days', event.target.value)}
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="button button-muted"
                                    onClick={() => removeFermentationStep(index)}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>

                    <article className="process-card">
                      <h4>Live Hop Timing Summary</h4>
                      {hopScheduleRows.length === 0 ? (
                        <p className="hint">Add hop entries to build the boil/whirlpool/ferment schedule.</p>
                      ) : (
                        <ul className="process-summary-list">
                          {hopScheduleRows.map(({ ingredient, index }) => (
                            <li key={`hop-summary-${index}`}>
                              <span>{ingredient.name}</span>
                              <span>
                                {ingredient.timing ?? 'boil'}
                                {ingredient.time_min ? ` ${ingredient.time_min}m` : ''}
                              </span>
                              <strong>
                                {ingredient.amount} {ingredient.unit}
                              </strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  </div>
                </section>

                <section className="standard-panel standard-panel--full">
                  <div className="standard-panel-head">
                    <h3>Process Timeline</h3>
                    <span className="hint small">
                      Chronological mash, additions, and fermentation schedule.
                    </span>
                  </div>
                  {timelineEvents.length === 0 ? (
                    <p className="hint">No timeline events yet. Add process steps and hop timing data.</p>
                  ) : (
                    <ul className="timeline-list">
                      {timelineEvents.map((event, index) => (
                        <li key={`${event.phase}-${event.when}-${event.action}-${index}`} className="timeline-row">
                          <span className="timeline-phase">{event.phase}</span>
                          <span className="timeline-when">{event.when}</span>
                          <span className="timeline-action">{event.action}</span>
                          <span className="timeline-detail">{event.detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                </div>

                <aside className="standard-summary-rail">
                  <article className="standard-summary-card">
                    <h3>Predicted Stats</h3>
                    {!prediction ? (
                      <p className="hint small">Generate or edit ingredients to view projections.</p>
                    ) : (
                      <>
                        <div className="summary-metrics">
                          <div>
                            <span>OG</span>
                            <strong>{prediction.predicted.og.toFixed(3)}</strong>
                          </div>
                          <div>
                            <span>FG</span>
                            <strong>{prediction.predicted.fg.toFixed(3)}</strong>
                          </div>
                          <div>
                            <span>ABV</span>
                            <strong>{prediction.predicted.abv.toFixed(2)}%</strong>
                          </div>
                          <div>
                            <span>IBU</span>
                            <strong>{prediction.predicted.ibu.toFixed(1)}</strong>
                          </div>
                          <div>
                            <span>SRM</span>
                            <strong>{prediction.predicted.srm.toFixed(1)}</strong>
                          </div>
                          <div>
                            <span>Batch</span>
                            <strong>{batchSizeLiters.toFixed(1)} L</strong>
                          </div>
                        </div>
                        <p className="hint small">Source: {predictionSourceLabel}</p>
                        <p className="hint small">Calculated projection from recipe inputs (not live sensor readings).</p>
                        {prediction.warnings.length > 0 && (
                          <ul className="summary-shortages">
                            {prediction.warnings.map((warning, index) => (
                              <li key={`prediction-warning-${index}`}>
                                <span>Input Warning</span>
                                <strong>{warning}</strong>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </article>

                  <article className="standard-summary-card">
                    <h3>Fit + Cost</h3>
                    <ul className="summary-list">
                      <li>
                        <span>Target Fit</span>
                        <strong>{targetFitPercent === undefined ? 'n/a' : `${targetFitPercent}%`}</strong>
                      </li>
                      <li>
                        <span>Style Fit</span>
                        <strong>{styleFitPercent === undefined ? 'n/a' : `${styleFitPercent}%`}</strong>
                      </li>
                      <li>
                        <span>Ingredient Cost</span>
                        <strong>${totalIngredientCost.toFixed(2)}</strong>
                      </li>
                      <li>
                        <span>Inventory Shortage</span>
                        <strong>{round(totalInventoryShortage, 2)}</strong>
                      </li>
                    </ul>
                  </article>

                  <article className="standard-summary-card">
                    <h3>Stock Health</h3>
                    <div className="summary-stock-grid">
                      <span className="stock-badge stock-badge--in">In {stockStateCounts.in}</span>
                      <span className="stock-badge stock-badge--low">Low {stockStateCounts.low}</span>
                      <span className="stock-badge stock-badge--out">Out {stockStateCounts.out}</span>
                      <span className="stock-badge stock-badge--custom">Custom {stockStateCounts.custom}</span>
                    </div>
                    {topShortages.length === 0 ? (
                      <p className="hint small">No inventory shortages across mapped ingredients.</p>
                    ) : (
                      <ul className="summary-shortages">
                        {topShortages.map((entry) => (
                          <li key={`short-${entry.catalog.id}`}>
                            <span>{entry.catalog.name}</span>
                            <strong>
                              {round(entry.shortage, 2)} {entry.unit}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </aside>
              </div>
            </article>
          )}
        </div>

        <aside className="lab-dynamic__targets">
          <article className="card">
            <h2>Target vs Predicted</h2>
            <p className="hint small">Prediction source: {predictionSourceLabel}</p>
            {(Object.keys(metricConfig) as MetricKey[]).map((metric) => {
              const center = (targets[metric].min + targets[metric].max) / 2;
              const lane = prediction?.target_vs_predicted[metric];
              return (
                <div className="target-row target-row--stack" key={metric}>
                  <div className="target-head">
                    <strong>{metric.toUpperCase()}</strong>
                    <span className={`delta-pill ${lane ? (lane.delta > 0 ? 'delta-pill--high' : lane.delta < 0 ? 'delta-pill--low' : 'delta-pill--ok') : ''}`}>
                      {lane ? `${lane.delta > 0 ? '+' : ''}${lane.delta}` : 'n/a'}
                    </span>
                  </div>

                  <div className="target-inputs">
                    <input
                      type="number"
                      step={metricConfig[metric].step}
                      value={targets[metric].min}
                      onChange={(event) => handleTargetChange(metric, 'min', event.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      step={metricConfig[metric].step}
                      value={targets[metric].max}
                      onChange={(event) => handleTargetChange(metric, 'max', event.target.value)}
                    />
                  </div>

                  <div className="slider-row">
                    <input
                      type="range"
                      min={metricConfig[metric].min}
                      max={metricConfig[metric].max}
                      step={metricConfig[metric].step}
                      value={center}
                      onChange={(event) => handleMetricSlider(metric, event.target.value)}
                    />
                    <label className="switch-row">
                      <span>Lock</span>
                      <input
                        type="checkbox"
                        checked={locks[metric]}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setLocks((current) => ({ ...current, [metric]: checked }));
                          if (checked) {
                            setTargets((current) => {
                              const next = copyTargets(current);
                              const nextCenter = (next[metric].min + next[metric].max) / 2;
                              next[metric].min = nextCenter;
                              next[metric].max = nextCenter;
                              return next;
                            });
                          }
                        }}
                      />
                    </label>
                  </div>

                  <p className="hint small">
                    Target {center.toFixed(metric === 'ibu' ? 0 : 1)} · Predicted{' '}
                    {lane ? lane.predicted.toFixed(metric === 'ibu' ? 0 : 1) : 'n/a'}
                  </p>
                </div>
              );
            })}

            <div className="button-row">
              <button type="button" className="button" onClick={() => saveCurrentDraft(false)}>
                {activeRecipeId ? 'Update Saved Draft' : 'Save Draft'}
              </button>
              <button type="button" className="button button-muted" onClick={() => saveCurrentDraft(true)}>
                Save + Open Exports
              </button>
            </div>
            <p className="status">{status || 'Adjust targets, compare predicted values, then save/export.'}</p>
          </article>

          <article className="card card-accent">
            <h2>Projection</h2>
            {!prediction ? (
              <p className="hint">Add ingredients or generate a dynamic proposal to see predictions.</p>
            ) : (
              <>
                <div className="projection-grid">
                  <p>
                    OG <strong>{prediction.predicted.og.toFixed(3)}</strong>
                  </p>
                  <p>
                    FG <strong>{prediction.predicted.fg.toFixed(3)}</strong>
                  </p>
                  <p>
                    ABV <strong>{prediction.predicted.abv.toFixed(2)}%</strong>
                  </p>
                  <p>
                    IBU <strong>{prediction.predicted.ibu.toFixed(1)}</strong>
                  </p>
                  <p>
                    SRM <strong>{prediction.predicted.srm.toFixed(1)}</strong>
                  </p>
                </div>

                <div className="insights">
                  <h3>Descriptor Projection</h3>
                  {prediction.descriptor_profile.length === 0 ? (
                    <p className="hint">No descriptor projection yet.</p>
                  ) : (
                    <ul>
                      {prediction.descriptor_profile.map((entry) => (
                        <li key={entry.key}>
                          {entry.key.replaceAll('_', ' ')} · {entry.score.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {prediction.class_designation && (
                  <div className="insights">
                    <h3>Class Designation</h3>
                    <p>
                      {prediction.class_designation.class_name} ·{' '}
                      {Math.round(prediction.class_designation.confidence * 100)}%
                    </p>
                  </div>
                )}

                {prediction.similar_to.length > 0 && (
                  <div className="insights">
                    <h3>Similar To</h3>
                    <ul>
                      {prediction.similar_to.map((entry) => (
                        <li key={entry.name}>
                          {entry.name} ({entry.style}) · {Math.round(entry.similarity * 100)}% · {entry.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </article>

          {proposalData && (mode === 'dynamic' || mode === 'hybrid') && (
            <article className="card">
              <h2>Dynamic Proposal Snapshot</h2>
              <p>
                Base: {proposalData.proposal.base_malt.name} · Mash {proposalData.proposal.mash_temp_c.toFixed(1)} C
              </p>
              <p>
                Yeast: {proposalData.proposal.yeast_family} · Water {proposalData.proposal.water_bias}
              </p>
              <ul>
                {proposalData.proposal.hop_plan.map((hop, index) => (
                  <li key={`${hop.family}-${index}`}>
                    {hop.variety} · {hop.timings.join(', ')}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </aside>
      </div>

      {pickerState.open && (
        <div className="modal-overlay" onClick={closeIngredientPicker}>
          <div className="modal modal--wide" onClick={(event) => event.stopPropagation()}>
            <header className="modal-head">
              <h2>
                {pickerState.replaceIndex === undefined ? 'Add' : 'Substitute'}{' '}
                {pickerState.kind[0].toUpperCase() + pickerState.kind.slice(1)}
              </h2>
              <button type="button" className="button button-muted" onClick={closeIngredientPicker}>
                Close
              </button>
            </header>

            <div className="picker-tabs">
              {(['inventory', 'database', 'custom'] as IngredientPickerTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`mode-tab ${pickerState.tab === tab ? 'mode-tab--active' : ''}`}
                  onClick={() => handlePickerTabChange(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {pickerState.tab !== 'custom' ? (
              <>
                <label>
                  Search {pickerState.tab === 'inventory' ? 'inventory' : 'catalog'}
                  <input
                    type="search"
                    value={pickerQuery}
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder={`Search ${pickerState.kind}...`}
                />
                </label>
                <div className="picker-toolbar">
                  <p className="hint small">{pickerRows.length} results</p>
                  {pickerState.tab === 'database' ? (
                    <label className="switch-row">
                      <span>In-stock only</span>
                      <input
                        type="checkbox"
                        checked={pickerInStockOnly}
                        onChange={(event) => setPickerInStockOnly(event.target.checked)}
                      />
                    </label>
                  ) : (
                    <span className="hint small">Inventory tab lists in-stock items only.</span>
                  )}
                </div>

                <div className="picker-list">
                  {pickerRows.length === 0 && (
                    <p className="hint">
                      No {pickerState.tab} items found for {pickerState.kind}.
                    </p>
                  )}
                  {pickerRows.map((item) => {
                    const stock = stockByCatalogId.get(item.id);
                    const availableLabel = stock
                      ? `${round(stock.available, 2)} ${stock.unit} avail`
                      : 'No inventory lots';
                    const stockState =
                      !stock || stock.available <= 0
                        ? 'out'
                        : stock.available < 1
                          ? 'low'
                          : 'in';
                    const typeLabel = item.type === 'malt' ? 'fermentable' : item.type;

                    return (
                      <article key={item.id} className="picker-row">
                        <div>
                          <strong>{item.name}</strong>
                          <p className="hint">{typeLabel}</p>
                        </div>
                        <div className="picker-row-meta">
                          <span className={`stock-badge stock-badge--${stockState}`}>
                            {stockState === 'in' ? 'In Stock' : stockState === 'low' ? 'Low' : 'Out'}
                          </span>
                          <span className="hint small">{availableLabel}</span>
                        </div>
                        <button
                          type="button"
                          className="button button-muted"
                          onClick={() => addIngredientFromCatalog(item)}
                        >
                          {pickerState.replaceIndex === undefined ? 'Add' : 'Substitute'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="picker-custom">
                <div className="field-row field-row--4">
                  <label>
                    Name
                    <input
                      value={pickerCustomIngredient.name}
                      onChange={(event) => updatePickerCustomIngredient('name', event.target.value)}
                    />
                  </label>
                  <label>
                    Amount
                    <input
                      type="number"
                      step={0.1}
                      value={pickerCustomIngredient.amount}
                      onChange={(event) => updatePickerCustomIngredient('amount', event.target.value)}
                    />
                  </label>
                  <label>
                    Unit
                    <input
                      value={pickerCustomIngredient.unit}
                      onChange={(event) => updatePickerCustomIngredient('unit', event.target.value)}
                    />
                  </label>
                  {pickerState.kind === 'hop' ? (
                    <label>
                      AA%
                      <input
                        type="number"
                        step={0.1}
                        value={pickerCustomIngredient.aa_pct ?? ''}
                        onChange={(event) => updatePickerCustomIngredient('aa_pct', event.target.value)}
                      />
                    </label>
                  ) : (
                    <label>
                      PPG
                      <input
                        type="number"
                        step={0.1}
                        value={pickerCustomIngredient.ppg ?? ''}
                        onChange={(event) => updatePickerCustomIngredient('ppg', event.target.value)}
                      />
                    </label>
                  )}
                </div>
                {pickerState.kind === 'hop' && (
                  <div className="field-row field-row--2">
                    <label>
                      Timing
                      <select
                        value={pickerCustomIngredient.timing ?? 'boil'}
                        onChange={(event) => updatePickerCustomIngredient('timing', event.target.value)}
                      >
                        <option value="boil">Boil</option>
                        <option value="whirlpool">Whirlpool</option>
                        <option value="ferment">Ferment</option>
                      </select>
                    </label>
                    <label>
                      Time (min)
                      <input
                        type="number"
                        step={1}
                        value={pickerCustomIngredient.time_min ?? ''}
                        onChange={(event) => updatePickerCustomIngredient('time_min', event.target.value)}
                      />
                    </label>
                  </div>
                )}
                <div className="button-row-inline">
                  <button type="button" className="button" onClick={addCustomIngredientFromPicker}>
                    {pickerState.replaceIndex === undefined ? 'Add Custom Ingredient' : 'Use As Substitute'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cloneOpen && (
        <div className="modal-overlay" onClick={() => setCloneOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <header className="modal-head">
              <h2>Clone A Beer</h2>
              <button type="button" className="button button-muted" onClick={() => setCloneOpen(false)}>
                Close
              </button>
            </header>

            <label>
              Search clones
              <input
                type="search"
                placeholder="Search by name, style, brewery"
                value={cloneSearch}
                onChange={(event) => setCloneSearch(event.target.value)}
              />
            </label>

            <div className="clone-list">
              {cloneResults.length === 0 && <p className="hint">No clone matches.</p>}
              {cloneResults.map((clone) => (
                <article key={clone.id} className="clone-card">
                  <div className="clone-head">
                    <strong>{clone.name}</strong>
                    <span>{clone.ba_class}</span>
                  </div>
                  <p className="hint">{clone.brewery}</p>
                  <button type="button" className="button" onClick={() => applyClone(clone)}>
                    Use This Clone
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
