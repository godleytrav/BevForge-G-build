import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LabBuilderV2Frame, type LabBuilderFamily } from '../components/LabBuilderV2Frame';
import descriptorRaw from '../data/descriptor_library.yml?raw';
import baStylesRaw from '../data/ba_styles.json';
import cloneReferenceRaw from '../data/clone_reference_index.json';
import seedCatalogRaw from '../data/seed_catalog_v1.json';
import seedInventoryRaw from '../data/seed_inventory_v1.json';
import {
  assessCiderCompliance,
  buildCiderComplianceProfile,
  type CiderCarbonationMode,
} from '../lib/cider-compliance';
import {
  buildConflictMap,
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
  listSavedRecipes,
  saveRecipe,
  setActiveRecipeId,
} from '../lib/lab-store';
import { buildSeedCatalog, resolveCatalogColorSrm, resolveCatalogHopAlpha, resolveCatalogPpg } from '../lib/seed-catalog';
import type {
  CatalogIngredient,
  ComputeProposalOutput,
  FermentationStep,
  LabComplianceProfile,
  MashStep,
  ProposalIngredient,
  ProposalOutput,
  SavedLabRecipe,
  TargetBlock,
} from '../lib/lab-types';
import { parseYamlDocument } from '../lib/yaml-lite';

type BuilderMode = 'dynamic' | 'standard' | 'hybrid';
type ManualSyncMode = 'linked' | 'manual';
type MetricKey = 'abv' | 'ibu' | 'srm' | 'og' | 'fg' | 'ph' | 'dilution_ratio' | 'residual_sugar';
type BatchUnit = 'gal' | 'bbl' | 'l';
type IngredientLane = 'all' | ProposalIngredient['kind'];
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

interface IngredientDeltaRow {
  key: string;
  status: 'match' | 'changed' | 'manual_only' | 'dynamic_only';
  name: string;
  kind: ProposalIngredient['kind'];
  detail: string;
}

interface DraftValidationResult {
  blockers: string[];
  warnings: string[];
}

interface CiderSolverResult {
  requestedOg: number;
  requestedFg: number;
  requestedAbv: number;
  requestedResidualSugarPct: number;
  recommendedRatio: number;
  ratioStatus: 'within_range' | 'needs_more_concentrate' | 'needs_more_water';
  feasibleWithinBsgRange: boolean;
  plan: ReturnType<typeof bsgCiderBasePlan>;
  achievableOg: number;
  achievableAbv: number;
  gravityPointGap: number;
  supportDextroseLb: number;
  supportAppleConcentrateGal: number;
  supportStatus: string;
  targets: TargetBlock;
}

const metricConfig: Record<MetricKey, { min: number; max: number; step: number }> = {
  abv: { min: 2, max: 14, step: 0.1 },
  ibu: { min: 0, max: 120, step: 1 },
  srm: { min: 1, max: 50, step: 0.1 },
  og: { min: 1, max: 1.15, step: 0.001 },
  fg: { min: 0.99, max: 1.05, step: 0.001 },
  ph: { min: 2.8, max: 4.2, step: 0.1 },
  dilution_ratio: { min: 1, max: 10, step: 0.1 },
  residual_sugar: { min: 0, max: 8, step: 0.1 },
};

const litersPerBatchUnit: Record<BatchUnit, number> = {
  gal: 3.785411784,
  bbl: 117.347765304,
  l: 1,
};

const batchUnitLabels: Record<BatchUnit, { short: string; long: string; step: number }> = {
  gal: { short: 'gal', long: 'Gallons (US)', step: 0.25 },
  bbl: { short: 'bbl', long: 'Barrels (US)', step: 0.1 },
  l: { short: 'L', long: 'Liters', step: 0.5 },
};

const packUnits = new Set(['pack', 'packs', 'pkg', 'pk', 'package', 'packages']);
const weightUnits = new Set(['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams', 'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces']);
const volumeUnits = new Set(['l', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'milliliters', 'gal', 'gallon', 'gallons']);

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const slugify = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const normalizeUnit = (unit: string): string => unit.trim().toLowerCase();
const isWeightUnit = (unit: string): boolean => weightUnits.has(normalizeUnit(unit));
const isVolumeUnit = (unit: string): boolean => volumeUnits.has(normalizeUnit(unit));
const isCiderLiquidFermentable = (ingredient: ProposalIngredient): boolean =>
  /(juice|must|cider|apple|pear|concentrate)/i.test(ingredient.name) && isVolumeUnit(ingredient.unit || '');
const isBsgCiderBase = (ingredient: ProposalIngredient): boolean =>
  /bsg.*ciderbase|ciderbase/i.test(ingredient.name);

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

const toL = (amount: number, unit: string): number => {
  const normalized = normalizeUnit(unit);
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') return amount;
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters') return amount / 1000;
  if (normalized === 'gal' || normalized === 'gallon' || normalized === 'gallons') return amount * 3.785411784;
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

const convertCiderAmountToUnit = (amount: number, fromUnit: string, toUnit: string): number => {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (volumeUnits.has(from) && volumeUnits.has(to)) {
    const liters = toL(amount, from);
    if (to === 'l' || to === 'liter' || to === 'liters' || to === 'litre' || to === 'litres') return liters;
    if (to === 'ml' || to === 'milliliter' || to === 'milliliters') return liters * 1000;
    if (to === 'gal' || to === 'gallon' || to === 'gallons') return liters / 3.785411784;
  }
  return convertAmountToUnit(amount, fromUnit, toUnit, 'fermentable');
};

const toBatchLiters = (value: number, unit: BatchUnit): number => value * litersPerBatchUnit[unit];
const fromBatchLiters = (liters: number, unit: BatchUnit): number => liters / litersPerBatchUnit[unit];
const inferBatchUnit = (liters: number): BatchUnit => (liters >= 90 ? 'bbl' : 'gal');

const kindToCatalogType = (kind: ProposalIngredient['kind']): 'malt' | 'hop' | 'yeast' | 'adjunct' => {
  if (kind === 'fermentable') return 'malt';
  if (kind === 'hop') return 'hop';
  if (kind === 'yeast') return 'yeast';
  return 'adjunct';
};

const copyTargets = (targets: TargetBlock): TargetBlock => cloneTargets(targets);

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

const defaultCiderTargets = (): TargetBlock => ({
  abv: { min: 5.5, max: 6.9 },
  ibu: { min: 0, max: 0 },
  srm: { min: 2, max: 6 },
  og: { min: 1.054, max: 1.062 },
  fg: { min: 0.998, max: 1.008 },
  ph: { min: 3.3, max: 3.4 },
  dilution_ratio: { min: 3, max: 3 },
  residual_sugar: { min: 1, max: 1 },
});

const defaultCiderProcessSteps = (): MashStep[] => [
  { order_index: 0, name: 'Juice Transfer', temp_c: 12, duration_min: 30 },
  { order_index: 1, name: 'Yeast Nutrient Addition', temp_c: 18, duration_min: 5 },
];

const defaultCiderFermentationSteps = (): FermentationStep[] => [
  { order_index: 0, stage: 'primary', temp_c: 15, duration_days: 14 },
  { order_index: 1, stage: 'conditioning', temp_c: 4, duration_days: 7 },
];

const BSG_CIDERBASE_GRAVITY_POINTS_PER_CONCENTRATE_GAL = 232;
const BSG_CIDERBASE_BRIX = 45;
const BSG_CIDERBASE_PH_MIN = 3.3;
const BSG_CIDERBASE_PH_MAX = 3.4;
const BSG_CIDERBASE_MIN_RATIO = 3;
const BSG_CIDERBASE_MAX_RATIO = 5;
const BSG_CIDERBASE_SUPPORT_PPG = 46;
const APPLE_CONCENTRATE_SUPPORT_PPG = 68;

const ciderFgFromResidualSugar = (residualSugarPct: number): number =>
  round(clamp(0.998 + clamp(residualSugarPct, 0, 8) * 0.0045, 0.998, 1.03), 3);

const ciderOgFromAbvAndFg = (abv: number, fg: number): number =>
  round(clamp(fg + clamp(abv, 0, 14) / 131.25, 1.0, 1.15), 3);

const bsgRatioFromOg = (og: number): number => {
  const points = Math.max(1, (og - 1) * 1000);
  return round(clamp(BSG_CIDERBASE_GRAVITY_POINTS_PER_CONCENTRATE_GAL / points - 1, BSG_CIDERBASE_MIN_RATIO, BSG_CIDERBASE_MAX_RATIO), 2);
};

const ciderAbvCenter = (targets: TargetBlock): number => round((targets.abv.min + targets.abv.max) / 2, 2);
const ciderResidualCenter = (targets: TargetBlock): number =>
  round(((targets.residual_sugar?.min ?? 1) + (targets.residual_sugar?.max ?? 1)) / 2, 2);
const ciderCarbonationTargetDefault = 0;

const bsgCiderBasePlan = (batchSizeLiters: number, dilutionRatio: number) => {
  const safeRatio = clamp(dilutionRatio, BSG_CIDERBASE_MIN_RATIO, BSG_CIDERBASE_MAX_RATIO);
  const batchGal = batchSizeLiters / litersPerBatchUnit.gal;
  const concentrateGal = batchGal / (safeRatio + 1);
  const waterGal = Math.max(0, batchGal - concentrateGal);
  const mustGravityPoints = BSG_CIDERBASE_GRAVITY_POINTS_PER_CONCENTRATE_GAL / (safeRatio + 1);
  const mustSg = 1 + mustGravityPoints / 1000;
  return {
    dilutionRatio: safeRatio,
    batchGal,
    concentrateGal,
    waterGal,
    mustGravityPoints,
    mustSg,
    ingredients: [
      {
        kind: 'fermentable',
        name: 'BSG Select CiderBase',
        amount: round(concentrateGal, 3),
        unit: 'gal',
        ppg: BSG_CIDERBASE_GRAVITY_POINTS_PER_CONCENTRATE_GAL,
        color_srm: 5,
      },
      {
        kind: 'adjunct',
        name: 'Filtered Water',
        amount: round(waterGal, 3),
        unit: 'gal',
      },
      {
        kind: 'yeast',
        name: 'Cider Yeast',
        amount: Math.max(1, Math.ceil(batchSizeLiters / 25)),
        unit: 'pack',
      },
      {
        kind: 'adjunct',
        name: 'Yeast Nutrient',
        amount: round(Math.max(5, batchSizeLiters * 0.5), 1),
        unit: 'g',
      },
    ] satisfies ProposalIngredient[],
  };
};

const solvedBsgCiderTargets = (params: {
  abv: number;
  residualSugarPct: number;
  ph: number;
  batchSizeLiters: number;
}): CiderSolverResult => {
  const fg = ciderFgFromResidualSugar(params.residualSugarPct);
  const og = ciderOgFromAbvAndFg(params.abv, fg);
  const requiredRatio = bsgRatioFromOg(og);
  const feasibleWithinBsgRange =
    requiredRatio >= BSG_CIDERBASE_MIN_RATIO && requiredRatio <= BSG_CIDERBASE_MAX_RATIO;
  const recommendedRatio = clamp(requiredRatio, BSG_CIDERBASE_MIN_RATIO, BSG_CIDERBASE_MAX_RATIO);
  const plan = bsgCiderBasePlan(params.batchSizeLiters, recommendedRatio);
  const achievableOg = round(plan.mustSg, 3);
  const achievableAbv = round(Math.max(0, (achievableOg - fg) * 131.25), 2);
  const gravityPointGap = round(((og - 1) - (achievableOg - 1)) * 1000, 1);
  const totalGapGravityPoints = Math.max(0, gravityPointGap) * plan.batchGal;
  const supportDextroseLb = round(totalGapGravityPoints / BSG_CIDERBASE_SUPPORT_PPG, 2);
  const supportAppleConcentrateGal = round(totalGapGravityPoints / APPLE_CONCENTRATE_SUPPORT_PPG, 2);
  const ratioStatus =
    requiredRatio < BSG_CIDERBASE_MIN_RATIO
      ? 'needs_more_concentrate'
      : requiredRatio > BSG_CIDERBASE_MAX_RATIO
        ? 'needs_more_water'
        : 'within_range';
  const supportStatus =
    ratioStatus === 'needs_more_concentrate'
      ? `Target exceeds the BSG 3:1 floor by ${Math.abs(gravityPointGap).toFixed(1)} gravity points. Plan for enrichment or relax ABV / residual sugar.`
      : ratioStatus === 'needs_more_water'
        ? `Target is lighter than the BSG 5:1 ceiling by ${Math.abs(gravityPointGap).toFixed(1)} gravity points. Increase dilution or choose a lighter base.`
        : 'Target sits inside the BSG dilution envelope.';
  return {
    requestedFg: fg,
    requestedOg: og,
    requestedAbv: round(params.abv, 2),
    requestedResidualSugarPct: round(params.residualSugarPct, 2),
    recommendedRatio,
    ratioStatus,
    feasibleWithinBsgRange,
    plan,
    achievableOg,
    achievableAbv,
    gravityPointGap,
    supportDextroseLb,
    supportAppleConcentrateGal,
    supportStatus,
    targets: {
      abv: { min: round(params.abv, 2), max: round(params.abv, 2) },
      ibu: { min: 0, max: 0 },
      srm: { min: 2, max: 6 },
      og: { min: og, max: og },
      fg: { min: fg, max: fg },
      ph: { min: round(params.ph, 2), max: round(params.ph, 2) },
      dilution_ratio: { min: round(recommendedRatio, 2), max: round(recommendedRatio, 2) },
      residual_sugar: { min: round(params.residualSugarPct, 2), max: round(params.residualSugarPct, 2) },
    } satisfies TargetBlock,
  };
};

const ciderStarterIngredients = (batchSizeLiters: number, dilutionRatio = 3): ProposalIngredient[] =>
  bsgCiderBasePlan(batchSizeLiters, dilutionRatio).ingredients;

const ciderQuickAddIngredients = (): ProposalIngredient[] => [
  {
    kind: 'fermentable',
    name: 'BSG Select CiderBase',
    amount: 5,
    unit: 'gal',
    ppg: BSG_CIDERBASE_GRAVITY_POINTS_PER_CONCENTRATE_GAL,
    color_srm: 5,
  },
  { kind: 'adjunct', name: 'Filtered Water', amount: 15, unit: 'gal' },
  { kind: 'fermentable', name: 'Fresh Apple Juice / Must', amount: 3.785, unit: 'L', ppg: 50, color_srm: 3 },
  { kind: 'fermentable', name: 'Apple Juice Concentrate', amount: 1, unit: 'L', ppg: 68, color_srm: 8 },
  { kind: 'fermentable', name: 'Pear Juice / Perry Must', amount: 3.785, unit: 'L', ppg: 48, color_srm: 3 },
  { kind: 'yeast', name: 'Cider Yeast', amount: 1, unit: 'pack' },
  { kind: 'adjunct', name: 'Yeast Nutrient', amount: 10, unit: 'g' },
  { kind: 'adjunct', name: 'Pectic Enzyme', amount: 5, unit: 'g' },
  { kind: 'adjunct', name: 'Blackberry Puree', amount: 1, unit: 'kg' },
];

const normalizeMashSteps = (steps: MashStep[]): MashStep[] =>
  steps.map((step, index) => ({ ...step, order_index: index }));
const normalizeFermentationSteps = (steps: FermentationStep[]): FermentationStep[] =>
  steps.map((step, index) => ({ ...step, order_index: index }));

const makeManualRow = (kind: ProposalIngredient['kind']): ProposalIngredient => {
  if (kind === 'hop') {
    return {
      kind: 'hop',
      name: 'New Hop',
      amount: 20,
      unit: 'g',
      aa_pct: 9,
      timing: 'boil',
      time_min: 30,
    };
  }
  if (kind === 'yeast') {
    return {
      kind: 'yeast',
      name: 'Ale Yeast',
      amount: 1,
      unit: 'pack',
    };
  }
  if (kind === 'adjunct') {
    return {
      kind: 'adjunct',
      name: 'Adjunct',
      amount: 0.2,
      unit: 'kg',
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

const ingredientFromCatalog = (catalogItem: CatalogIngredient): ProposalIngredient => {
  const type = catalogItem.type;
  const spec = catalogItem.spec_json ?? {};
  if (type === 'hop') {
    const alpha = resolveCatalogHopAlpha(spec) ?? 0.1;
    return {
      id: catalogItem.id,
      kind: 'hop',
      name: catalogItem.name,
      amount: 30,
      unit: 'g',
      aa_pct: alpha <= 1 ? round(alpha * 100, 1) : round(alpha, 1),
      timing: 'boil',
      time_min: 60,
    };
  }
  if (type === 'yeast') {
    return {
      id: catalogItem.id,
      kind: 'yeast',
      name: catalogItem.name,
      amount: 1,
      unit: 'pack',
    };
  }
  if (type === 'malt') {
    return {
      id: catalogItem.id,
      kind: 'fermentable',
      name: catalogItem.name,
      amount: 1.5,
      unit: 'kg',
      ppg: resolveCatalogPpg(spec) ?? 36,
      color_srm: resolveCatalogColorSrm(spec) ?? 2,
    };
  }
  return {
    id: catalogItem.id,
    kind: 'adjunct',
    name: catalogItem.name,
    amount: 0.25,
    unit: 'kg',
  };
};

const ingredientMergeKey = (ingredient: ProposalIngredient): string => {
  const base = `${ingredient.kind}:${slugify(ingredient.name)}`;
  if (ingredient.kind === 'hop') return `${base}:${ingredient.timing ?? 'boil'}:${Number(ingredient.time_min ?? 0)}`;
  return base;
};

const aggregateIngredients = (
  ingredients: ProposalIngredient[]
): Map<string, { kind: ProposalIngredient['kind']; name: string; amount: number; unit: string }> => {
  const map = new Map<string, { kind: ProposalIngredient['kind']; name: string; amount: number; unit: string }>();
  ingredients.forEach((ingredient) => {
    const key = ingredientMergeKey(ingredient);
    const amount = Number(ingredient.amount ?? 0);
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    const unit = ingredient.unit || (ingredient.kind === 'yeast' ? 'pack' : ingredient.kind === 'hop' ? 'g' : 'kg');
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { kind: ingredient.kind, name: ingredient.name, amount: safeAmount, unit });
      return;
    }
    existing.amount = round(
      existing.amount + convertAmountToUnit(safeAmount, unit, existing.unit, ingredient.kind),
      4
    );
  });
  return map;
};

const buildIngredientDeltaRows = (
  manualIngredients: ProposalIngredient[],
  dynamicIngredients: ProposalIngredient[]
): IngredientDeltaRow[] => {
  const manual = aggregateIngredients(manualIngredients);
  const dynamic = aggregateIngredients(dynamicIngredients);
  const keys = new Set([...manual.keys(), ...dynamic.keys()]);
  const rows: IngredientDeltaRow[] = [];

  keys.forEach((key) => {
    const left = manual.get(key);
    const right = dynamic.get(key);
    if (left && right) {
      const rightAsLeft = convertAmountToUnit(right.amount, right.unit, left.unit, left.kind);
      const delta = round(rightAsLeft - left.amount, 3);
      rows.push({
        key,
        status: Math.abs(delta) <= (left.kind === 'hop' ? 1 : 0.05) ? 'match' : 'changed',
        name: left.name,
        kind: left.kind,
        detail:
          Math.abs(delta) <= (left.kind === 'hop' ? 1 : 0.05)
            ? `${round(left.amount, 3)} ${left.unit} unchanged`
            : `Manual ${round(left.amount, 3)} ${left.unit} -> Dynamic ${round(rightAsLeft, 3)} ${left.unit} (${delta > 0 ? '+' : ''}${delta})`,
      });
      return;
    }

    if (left) {
      rows.push({
        key,
        status: 'manual_only',
        name: left.name,
        kind: left.kind,
        detail: `Manual only: ${round(left.amount, 3)} ${left.unit}`,
      });
      return;
    }

    if (right) {
      rows.push({
        key,
        status: 'dynamic_only',
        name: right.name,
        kind: right.kind,
        detail: `Dynamic only: ${round(right.amount, 3)} ${right.unit}`,
      });
    }
  });

  const order: Record<IngredientDeltaRow['status'], number> = {
    changed: 0,
    dynamic_only: 1,
    manual_only: 2,
    match: 3,
  };
  return rows.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
};

const validateRecipeDraft = (params: {
  beverage: string;
  recipeName: string;
  ingredients: ProposalIngredient[];
  mashSteps: MashStep[];
  fermentationSteps: FermentationStep[];
  predictionWarnings: string[];
}): DraftValidationResult => {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!params.recipeName.trim()) blockers.push('Recipe name is required.');

  const fermentables = params.ingredients.filter((entry) => entry.kind === 'fermentable');
  const hops = params.ingredients.filter((entry) => entry.kind === 'hop');
  const yeast = params.ingredients.filter((entry) => entry.kind === 'yeast');
  const requiresMashAndBoil = params.beverage === 'beer';
  const ciderSugarSources = params.ingredients.filter(
    (entry) =>
      entry.kind === 'fermentable' ||
      entry.kind === 'adjunct' ||
      /(juice|must|cider|apple|pear|sugar|concentrate|honey)/i.test(entry.name)
  );

  if (params.beverage === 'cider') {
    if (ciderSugarSources.length === 0) {
      blockers.push('At least one cider juice, fermentable, or sugar source is required.');
    }
  } else if (fermentables.length === 0) {
    blockers.push('At least one fermentable is required.');
  }

  if (params.beverage === 'beer' && hops.length === 0) blockers.push('At least one hop entry is required.');
  if (yeast.length === 0) blockers.push('At least one yeast entry is required.');

  params.ingredients.forEach((ingredient) => {
    const amount = Number(ingredient.amount ?? 0);
    if (!ingredient.name.trim()) blockers.push(`Ingredient name missing for ${ingredient.kind}.`);
    if (!Number.isFinite(amount) || amount <= 0) blockers.push(`${ingredient.name || ingredient.kind} amount must be > 0.`);
    if (
      ingredient.kind === 'fermentable' &&
      !isWeightUnit(ingredient.unit || '') &&
      !(params.beverage === 'cider' && isCiderLiquidFermentable(ingredient))
    ) {
      blockers.push(
        params.beverage === 'cider'
          ? `${ingredient.name || 'Fermentable'} needs a weight or cider liquid unit.`
          : `${ingredient.name || 'Fermentable'} needs a weight unit (kg/g/lb/oz).`
      );
    }
    if (ingredient.kind === 'hop') {
      if (!isWeightUnit(ingredient.unit || '')) blockers.push(`${ingredient.name || 'Hop'} needs a weight unit.`);
      const aa = Number(ingredient.aa_pct ?? 0);
      if (!Number.isFinite(aa) || aa < 0 || aa > 25) warnings.push(`${ingredient.name || 'Hop'} AA% appears outside normal range.`);
      const timing = ingredient.timing ?? 'boil';
      const timeMin = Number(ingredient.time_min ?? (timing === 'ferment' ? 0 : 15));
      if (timing !== 'ferment' && (!Number.isFinite(timeMin) || timeMin <= 0)) {
        blockers.push(`${ingredient.name || 'Hop'} needs boil/whirlpool time > 0.`);
      }
    }
  });

  const hasMash = params.mashSteps.some((step) => /mash/i.test(step.name));
  const hasBoil = params.mashSteps.some((step) => /boil/i.test(step.name));
  if (requiresMashAndBoil) {
    if (!hasMash) blockers.push('Mash step missing.');
    if (!hasBoil) blockers.push('Boil step missing.');
  }
  if (!params.fermentationSteps.some((step) => step.stage === 'primary')) {
    blockers.push('Primary fermentation step missing.');
  }

  params.predictionWarnings.forEach((warning) => {
    if (warning.includes('unusually high')) blockers.push(warning);
    else warnings.push(warning);
  });

  return {
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
  };
};

const buildManualProposal = (
  targets: TargetBlock,
  ingredients: ProposalIngredient[],
  batchSizeLiters: number,
  efficiencyPct: number,
  predicted: { og: number; fg: number }
): ProposalOutput => {
  const fermentables = ingredients.filter((entry) => entry.kind === 'fermentable');
  const hops = ingredients.filter((entry) => entry.kind === 'hop');
  const yeast = ingredients.find((entry) => entry.kind === 'yeast');

  const totalFermentableKg = fermentables.reduce(
    (sum, entry) => sum + toKg(Number(entry.amount ?? 0), entry.unit || 'kg'),
    0
  );
  const base = fermentables[0];

  return {
    targets,
    og: predicted.og,
    fg: predicted.fg,
    attenuation: 0.76,
    mash_temp_c: 66,
    water_bias: 'Balanced profile',
    base_malt: {
      name: base?.name ?? 'Manual Base',
      percent:
        base && totalFermentableKg > 0
          ? clamp((toKg(Number(base.amount ?? 0), base.unit || 'kg') / totalFermentableKg) * 100, 0, 100)
          : 100,
    },
    specialty_caps: fermentables.slice(1).map((entry) => ({
      key: slugify(entry.name),
      name: entry.name,
      percent:
        totalFermentableKg > 0
          ? (toKg(Number(entry.amount ?? 0), entry.unit || 'kg') / totalFermentableKg) * 100
          : 0,
      cap:
        totalFermentableKg > 0
          ? (toKg(Number(entry.amount ?? 0), entry.unit || 'kg') / totalFermentableKg) * 100
          : 0,
      ppg: entry.ppg,
      color_srm: entry.color_srm,
    })),
    hop_plan: hops.map((entry) => ({
      family: entry.name,
      variety: entry.name,
      timings: [
        entry.timing === 'ferment'
          ? 'Dry hop'
          : `${entry.time_min ?? 20} min ${entry.timing ?? 'boil'}`,
      ],
    })),
    yeast_family: yeast?.name ?? 'Manual Yeast',
    batch_size_l: batchSizeLiters,
    efficiency_pct: efficiencyPct,
  };
};

const ingredientTagClass = (kind: ProposalIngredient['kind']): string => {
  if (kind === 'fermentable') return 'lab-v2-ing-tag lab-v2-ing-tag--fermentable';
  if (kind === 'hop') return 'lab-v2-ing-tag lab-v2-ing-tag--hop';
  if (kind === 'yeast') return 'lab-v2-ing-tag lab-v2-ing-tag--yeast';
  if (kind === 'adjunct') return 'lab-v2-ing-tag lab-v2-ing-tag--adjunct';
  return 'lab-v2-ing-tag lab-v2-ing-tag--other';
};

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

const cloneReference = cloneReferenceRaw as Array<{
  name: string;
  style: string;
  abv: number;
  ibu: number;
  srm: number;
  descriptors?: string[];
}>;

const seedCatalog = buildSeedCatalog(seedCatalogRaw as Array<Record<string, unknown>>);
const seedInventory = seedInventoryRaw as Array<{
  id: string;
  catalog_id: string;
  qty: number;
  unit: string;
  overrides_json: Record<string, number>;
  cost_per_unit?: number;
}>;

const dynamicCategoriesPreferredOrder = ['tasting_notes', 'aroma_profile', 'mouthfeel'];

interface LabBuilderV2PageProps {
  builderFamily?: LabBuilderFamily;
  prelude?: ReactNode;
}

export function LabBuilderV2Page({ builderFamily, prelude }: LabBuilderV2PageProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const library = useMemo(() => {
    const parsed = parseYamlDocument(descriptorRaw);
    return normalizeDescriptorLibrary(parsed);
  }, []);
  const optionIndex = useMemo(() => indexOptions(library), [library]);
  const conflictMap = useMemo(() => buildConflictMap(library, optionIndex), [library, optionIndex]);

  const [mode, setMode] = useState<BuilderMode>('hybrid');
  const [manualSyncMode, setManualSyncMode] = useState<ManualSyncMode>('linked');
  const [recipeName, setRecipeName] = useState('LAB V2 Draft');
  const [beverage, setBeverage] = useState(library.defaults.beverage);
  const [styleKey, setStyleKey] = useState('');
  const [batchSizeLiters, setBatchSizeLiters] = useState(library.defaults.batch_size_l);
  const [batchUnit, setBatchUnit] = useState<BatchUnit>('gal');
  const [efficiencyPct, setEfficiencyPct] = useState(library.defaults.efficiency_pct);
  const [targets, setTargets] = useState<TargetBlock>(copyTargets(library.defaults.targets));
  const [selections, setSelections] = useState<Record<string, string[]>>(defaultSelections());
  const [proposalData, setProposalData] = useState<ComputeProposalOutput | null>(null);
  const [manualIngredients, setManualIngredients] = useState<ProposalIngredient[]>([]);
  const [mashSteps, setMashSteps] = useState<MashStep[]>(defaultMashSteps());
  const [fermentationSteps, setFermentationSteps] = useState<FermentationStep[]>(defaultFermentationSteps());
  const [status, setStatus] = useState('');
  const [activeRecipeId, setActiveRecipeIdState] = useState<string | undefined>(getActiveRecipeId());
  const [quickIngredientQuery, setQuickIngredientQuery] = useState('');
  const [activeIngredientLane, setActiveIngredientLane] = useState<IngredientLane>('all');
  const [complianceProfileDraft, setComplianceProfileDraft] = useState<LabComplianceProfile | undefined>(undefined);
  const [ciderCarbonationMode, setCiderCarbonationMode] = useState<CiderCarbonationMode>('unknown');
  const [ciderCarbonationTargetVols, setCiderCarbonationTargetVols] = useState(ciderCarbonationTargetDefault);
  const [ciderDilutionRatio, setCiderDilutionRatio] = useState(3);
  const [interstateSalePlanned, setInterstateSalePlanned] = useState(false);
  const lockedFamily = builderFamily;

  const categoryKeys = useMemo(() => {
    const available = Object.keys(library.categories);
    const ordered = dynamicCategoriesPreferredOrder.filter((key) => available.includes(key));
    const remaining = available.filter((key) => !ordered.includes(key));
    return [...ordered, ...remaining];
  }, [library]);
  const [activeCategory, setActiveCategory] = useState<string>(categoryKeys[0] ?? '');

  useEffect(() => {
    if (!activeCategory || !library.categories[activeCategory]) {
      setActiveCategory(categoryKeys[0] ?? '');
    }
  }, [activeCategory, categoryKeys, library]);

  useEffect(() => {
    if (!lockedFamily) return;
    if (beverage !== lockedFamily) {
      setBeverage(lockedFamily);
    }
  }, [lockedFamily, beverage]);

  const inventoryTotals = useMemo(() => {
    const map = new Map<string, { qty: number; unit: string }>();
    seedInventory.forEach((lot) => {
      const catalogId = String(lot.catalog_id ?? '');
      if (!catalogId) return;
      const qty = Number(lot.qty ?? 0);
      if (!Number.isFinite(qty)) return;
      const current = map.get(catalogId);
      if (current) current.qty += qty;
      else map.set(catalogId, { qty, unit: String(lot.unit ?? '') || 'kg' });
    });
    return map;
  }, []);

  const catalogById = useMemo(() => new Map(seedCatalog.map((entry) => [entry.id, entry])), []);
  const catalogByTypeAndSlug = useMemo(() => {
    const map = new Map<string, CatalogIngredient>();
    seedCatalog.forEach((entry) => {
      map.set(`${entry.type}:${slugify(entry.name)}`, entry);
    });
    return map;
  }, []);

  const resolveCatalog = (ingredient: ProposalIngredient): CatalogIngredient | undefined => {
    if (ingredient.id && catalogById.has(ingredient.id)) return catalogById.get(ingredient.id);
    const key = `${kindToCatalogType(ingredient.kind)}:${slugify(ingredient.name)}`;
    return catalogByTypeAndSlug.get(key);
  };

  const manualRowIssues = useMemo(() => {
    const map = new Map<number, string[]>();
    manualIngredients.forEach((entry, index) => {
      const issues: string[] = [];
      const amount = Number(entry.amount ?? 0);
      if (!entry.name.trim()) issues.push('Name required');
      if (!Number.isFinite(amount) || amount <= 0) issues.push('Amount must be > 0');
      if (entry.kind === 'fermentable') {
        if (!isWeightUnit(entry.unit || '') && !(beverage === 'cider' && isCiderLiquidFermentable(entry))) {
          issues.push(beverage === 'cider' ? 'Use weight or cider liquid unit' : 'Use weight unit (kg/g/lb/oz)');
        }
        const ppg = Number(entry.ppg ?? 0);
        const liquidCider = beverage === 'cider' && isCiderLiquidFermentable(entry);
        const maxPpg = isBsgCiderBase(entry) ? 300 : liquidCider ? 80 : 46;
        if (!Number.isFinite(ppg) || ppg < 20 || ppg > maxPpg) {
          issues.push(
            isBsgCiderBase(entry)
              ? 'CiderBase gravity points outside 20-300'
              : liquidCider
                ? 'Juice gravity points outside 20-80'
                : 'PPG outside 20-46'
          );
        }
      }
      if (entry.kind === 'hop') {
        if (!isWeightUnit(entry.unit || '')) issues.push('Use weight unit (g/oz/lb/kg)');
        const timeMin = Number(entry.time_min ?? ((entry.timing ?? 'boil') === 'ferment' ? 0 : 15));
        if ((entry.timing ?? 'boil') !== 'ferment' && (!Number.isFinite(timeMin) || timeMin <= 0)) {
          issues.push('Boil/whirlpool time must be > 0');
        }
      }
      if (issues.length > 0) map.set(index, issues);
    });
    return map;
  }, [manualIngredients, beverage]);

  const stockByIndex = useMemo(() => {
    const map = new Map<number, { state: 'in' | 'low' | 'out' | 'custom'; detail: string }>();
    manualIngredients.forEach((entry, index) => {
      const catalog = resolveCatalog(entry);
      if (!catalog) {
        map.set(index, { state: 'custom', detail: 'Custom ingredient' });
        return;
      }
      const stock = inventoryTotals.get(catalog.id);
      if (!stock) {
        map.set(index, { state: 'out', detail: 'No lots in inventory' });
        return;
      }

      const required = Math.max(0, convertAmountToUnit(Number(entry.amount ?? 0), entry.unit || stock.unit, stock.unit, entry.kind));
      if (required <= 0) {
        map.set(index, { state: stock.qty > 0 ? 'in' : 'out', detail: `${round(stock.qty, 2)} ${stock.unit} available` });
        return;
      }
      if (stock.qty <= 0) {
        map.set(index, { state: 'out', detail: `Needs ${round(required, 2)} ${stock.unit}` });
        return;
      }
      if (stock.qty < required) {
        map.set(index, { state: 'low', detail: `${round(stock.qty, 2)} ${stock.unit} avail · needs ${round(required, 2)}` });
        return;
      }
      map.set(index, { state: 'in', detail: `${round(stock.qty, 2)} ${stock.unit} avail` });
    });
    return map;
  }, [manualIngredients, inventoryTotals, catalogById, catalogByTypeAndSlug]);

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
        prefer_in_stock: true,
      },
      library,
      optionIndex,
      seedCatalog,
      seedInventory,
      baStyles,
      cloneReference
    );

  useEffect(() => {
    const computed = computeDynamicProposal();
    setProposalData(computed);
    if (manualSyncMode === 'linked') {
      setManualIngredients(computed.ingredients);
      setMashSteps(normalizeMashSteps(computed.mash_steps));
      setFermentationSteps(normalizeFermentationSteps(computed.fermentation_steps));
    }
  }, [selections, targets, batchSizeLiters, efficiencyPct, manualSyncMode]);

  const dynamicIngredients = proposalData?.ingredients ?? [];
  const predictionSource = useMemo<'dynamic' | 'manual' | 'none'>(() => {
    const hasDynamic = dynamicIngredients.length > 0;
    const hasManual = manualIngredients.length > 0;
    if (mode === 'dynamic') return hasDynamic ? 'dynamic' : hasManual ? 'manual' : 'none';
    if (mode === 'standard') return hasManual ? 'manual' : hasDynamic ? 'dynamic' : 'none';
    if (manualSyncMode === 'manual' && hasManual) return 'manual';
    return hasDynamic ? 'dynamic' : hasManual ? 'manual' : 'none';
  }, [mode, manualSyncMode, dynamicIngredients, manualIngredients]);

  const predictionIngredients = useMemo(() => {
    if (predictionSource === 'dynamic') return dynamicIngredients;
    if (predictionSource === 'manual') return manualIngredients;
    return [];
  }, [predictionSource, dynamicIngredients, manualIngredients]);

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

  const predictionSourceLabel =
    predictionSource === 'dynamic'
      ? 'Dynamic proposal'
      : predictionSource === 'manual'
        ? 'Manual recipe'
        : 'No ingredients';

  const currentIngredients =
    predictionSource === 'manual'
      ? manualIngredients
      : predictionSource === 'dynamic'
        ? dynamicIngredients
        : [];
  const targetPhCenter = round(((targets.ph?.min ?? BSG_CIDERBASE_PH_MIN) + (targets.ph?.max ?? BSG_CIDERBASE_PH_MAX)) / 2, 2);
  const ciderSolver = useMemo(
    () =>
      solvedBsgCiderTargets({
        abv: ciderAbvCenter(targets),
        residualSugarPct: ciderResidualCenter(targets),
        ph: targetPhCenter,
        batchSizeLiters,
      }),
    [targets, batchSizeLiters, targetPhCenter]
  );
  const bsgPlan = ciderSolver.plan;

  const ciderCompliance = useMemo(() => {
    if (beverage !== 'cider' || !prediction) return undefined;
    return assessCiderCompliance({
      abv: prediction.predicted.abv,
      ingredients: currentIngredients,
      carbonationMode: ciderCarbonationMode,
      interstateSale: interstateSalePlanned,
    });
  }, [beverage, prediction, currentIngredients, ciderCarbonationMode, interstateSalePlanned]);

  const derivedComplianceProfile = useMemo(() => {
    if (beverage === 'cider' && ciderCompliance) {
      return buildCiderComplianceProfile({
        recipeName,
        styleKey,
        existing: complianceProfileDraft,
        assessment: ciderCompliance,
        interstateSale: interstateSalePlanned,
        carbonationTargetVolumes: ciderCarbonationTargetVols,
      });
    }
    if (complianceProfileDraft?.planner?.beverageFamily === 'cider') return undefined;
    return complianceProfileDraft;
  }, [beverage, ciderCompliance, recipeName, styleKey, complianceProfileDraft, interstateSalePlanned, ciderCarbonationTargetVols]);

  const currentProposal = useMemo(() => {
    if (prediction) {
      return buildManualProposal(targets, currentIngredients, batchSizeLiters, efficiencyPct, {
        og: prediction.predicted.og,
        fg: prediction.predicted.fg,
      });
    }
    if (proposalData) return proposalData.proposal;
    return buildManualProposal(targets, currentIngredients, batchSizeLiters, efficiencyPct, { og: 1.05, fg: 1.012 });
  }, [targets, currentIngredients, batchSizeLiters, efficiencyPct, prediction, proposalData]);

  const ingredientDeltaRows = useMemo(
    () => buildIngredientDeltaRows(manualIngredients, dynamicIngredients),
    [manualIngredients, dynamicIngredients]
  );
  const deltaSummary = useMemo(
    () => ({
      changed: ingredientDeltaRows.filter((row) => row.status === 'changed').length,
      dynamicOnly: ingredientDeltaRows.filter((row) => row.status === 'dynamic_only').length,
      manualOnly: ingredientDeltaRows.filter((row) => row.status === 'manual_only').length,
      matched: ingredientDeltaRows.filter((row) => row.status === 'match').length,
    }),
    [ingredientDeltaRows]
  );

  const validation = useMemo(
    () => {
      const result = validateRecipeDraft({
        beverage,
        recipeName,
        ingredients: currentIngredients,
        mashSteps,
        fermentationSteps,
        predictionWarnings: prediction?.warnings ?? [],
      });

      if (ciderCompliance) {
        ciderCompliance.findings.forEach((finding) => {
          if (finding.severity === 'info') return;
          result.warnings.push(`Compliance: ${finding.title}`);
        });
      }

      if (beverage === 'cider' && !ciderSolver.feasibleWithinBsgRange) {
        result.warnings.push(`Cider solver: ${ciderSolver.supportStatus}`);
      }

      return {
        blockers: [...new Set(result.blockers)],
        warnings: [...new Set(result.warnings)],
      };
    },
    [beverage, recipeName, currentIngredients, mashSteps, fermentationSteps, prediction, ciderCompliance, ciderSolver]
  );

  const disabledReasons = useMemo(
    () => computeDisabledReasons(selections, optionIndex, conflictMap),
    [selections, optionIndex, conflictMap]
  );

  const loadSavedRecipe = (recipe: SavedLabRecipe) => {
    const sanitized = sanitizeSelections(recipe.selections, optionIndex, conflictMap);
    setRecipeName(recipe.name);
    setBeverage(recipe.beverage || 'beer');
    setStyleKey(recipe.style_key || '');
    setMode(recipe.mode ?? 'hybrid');
    setSelections(sanitized.selections);
    setTargets(copyTargets(recipe.targets));
    const nextBatch = recipe.proposal.batch_size_l || library.defaults.batch_size_l;
    setBatchSizeLiters(nextBatch);
    setBatchUnit(inferBatchUnit(nextBatch));
    setEfficiencyPct(recipe.proposal.efficiency_pct || library.defaults.efficiency_pct);
    setManualIngredients(recipe.manual_ingredients ?? recipe.ingredients ?? []);
    setManualSyncMode(recipe.mode === 'dynamic' ? 'linked' : 'manual');
    setComplianceProfileDraft(recipe.compliance_profile);
    setCiderCarbonationMode(recipe.compliance_profile?.planner?.carbonationMode ?? 'unknown');
    setCiderCarbonationTargetVols(recipe.compliance_profile?.planner?.carbonationTargetVolumes ?? ciderCarbonationTargetDefault);
    setCiderDilutionRatio(recipe.targets.dilution_ratio?.min ?? 3);
    setInterstateSalePlanned(Boolean(recipe.compliance_profile?.planner?.interstateSale));
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
    setActiveRecipeId(recipe.id);
    setActiveRecipeIdState(recipe.id);
    setStatus(`Loaded: ${recipe.name}`);
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

  const setMetric = (metric: MetricKey, bound: 'min' | 'max', rawValue: string) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;
    setTargets((current) => {
      const next = copyTargets(current);
      if (!next[metric]) {
        next[metric] = { min: metricConfig[metric].min, max: metricConfig[metric].min };
      }
      next[metric][bound] = numeric;
      if (next[metric].max < next[metric].min) next[metric].max = next[metric].min;
      return next;
    });
  };

  const toggleChip = (optionKey: string) => {
    const option = optionIndex.get(optionKey);
    const reason = disabledReasons.get(optionKey);
    const selected = option?.category ? (selections[option.category] ?? []).includes(optionKey) : false;
    if (reason && !selected) return;
    const result = toggleSelection(selections, optionKey, optionIndex, conflictMap);
    setSelections(result.nextSelections);
  };

  const updateManualIngredient = (index: number, field: ManualField, rawValue: string) => {
    setManualSyncMode('manual');
    setManualIngredients((current) =>
      current.map((entry, rowIndex) => {
        if (rowIndex !== index) return entry;
        if (field === 'name' || field === 'unit' || field === 'kind') {
          return {
            ...entry,
            [field]: rawValue,
          };
        }
        if (field === 'timing') {
          return {
            ...entry,
            timing: rawValue as ProposalIngredient['timing'],
          };
        }
        const numeric = Number(rawValue);
        return {
          ...entry,
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

  const upsertManualIngredient = (ingredient: ProposalIngredient, sourceLabel: string) => {
    setManualSyncMode('manual');
    let merged = false;
    setManualIngredients((current) => {
      const key = ingredientMergeKey(ingredient);
      const existingIndex = current.findIndex(
        (entry) => (entry.id && ingredient.id && entry.id === ingredient.id) || ingredientMergeKey(entry) === key
      );
      if (existingIndex < 0) return [...current, { ...ingredient }];

      merged = true;
      return current.map((entry, index) => {
        if (index !== existingIndex) return entry;
        const amount = Number(ingredient.amount ?? 0);
        const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
        const converted =
          entry.kind === 'fermentable' && (isCiderLiquidFermentable(entry) || isCiderLiquidFermentable(ingredient))
            ? convertCiderAmountToUnit(safeAmount, ingredient.unit || entry.unit, entry.unit || ingredient.unit)
            : convertAmountToUnit(safeAmount, ingredient.unit || entry.unit, entry.unit || ingredient.unit, entry.kind);
        return {
          ...entry,
          amount: round(Number(entry.amount ?? 0) + converted, entry.kind === 'hop' ? 1 : 3),
          ppg: entry.ppg ?? ingredient.ppg,
          color_srm: entry.color_srm ?? ingredient.color_srm,
          aa_pct: entry.aa_pct ?? ingredient.aa_pct,
          timing: entry.timing ?? ingredient.timing,
          time_min: entry.time_min ?? ingredient.time_min,
          day_offset: entry.day_offset ?? ingredient.day_offset,
        };
      });
    });
    setStatus(merged ? `Merged ${ingredient.name} into existing row from ${sourceLabel}.` : `Added ${ingredient.name} from ${sourceLabel}.`);
  };

  const addFromDynamic = (ingredient: ProposalIngredient) => {
    upsertManualIngredient(ingredient, 'Dynamic');
  };

  const addFromCatalog = (item: CatalogIngredient) => {
    upsertManualIngredient(ingredientFromCatalog(item), 'Catalog');
  };

  const setBsgPlanIngredients = (plan: ReturnType<typeof bsgCiderBasePlan>) => {
    setManualIngredients((current) => {
      const removableNames = new Set(['cider yeast', 'yeast nutrient', 'filtered water']);
      const retained = current.filter(
        (entry) => !isBsgCiderBase(entry) && !removableNames.has(entry.name.toLowerCase())
      );
      return [...plan.ingredients, ...retained];
    });
  };

  const solveCiderTargets = (overrides: Partial<{ abv: number; residualSugarPct: number; ph: number; batchSizeLiters: number }> = {}) => {
    const solved = solvedBsgCiderTargets({
      abv: overrides.abv ?? ciderAbvCenter(targets),
      residualSugarPct: overrides.residualSugarPct ?? ciderResidualCenter(targets),
      ph: overrides.ph ?? ((targets.ph?.min ?? BSG_CIDERBASE_PH_MIN) + (targets.ph?.max ?? BSG_CIDERBASE_PH_MAX)) / 2,
      batchSizeLiters: overrides.batchSizeLiters ?? batchSizeLiters,
    });
    setBeverage('cider');
    setMode('standard');
    setManualSyncMode('manual');
    setStyleKey((current) => current || 'bsg_select_ciderbase');
    setCiderDilutionRatio(solved.recommendedRatio);
    setTargets(solved.targets);
    setBsgPlanIngredients(solved.plan);
    setMashSteps(defaultCiderProcessSteps());
    setFermentationSteps(defaultCiderFermentationSteps());
    setStatus(
      solved.feasibleWithinBsgRange
        ? `Solved cider target inside BSG range at ${solved.recommendedRatio}:1.`
        : `${solved.supportStatus} Closest BSG ratio is ${solved.recommendedRatio}:1 with about ${solved.achievableAbv}% ABV before support additions.`
    );
  };

  const updateCiderTarget = (field: 'abv' | 'residualSugarPct' | 'ph', rawValue: string) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;
    solveCiderTargets({ [field]: numeric });
  };

  const updateBatchSize = (rawValue: string) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    const nextLiters = round(toBatchLiters(numeric, batchUnit), 3);
    setBatchSizeLiters(nextLiters);
    if (beverage === 'cider') {
      solveCiderTargets({ batchSizeLiters: nextLiters });
    }
  };

  const updateBatchUnit = (nextUnit: BatchUnit) => {
    setBatchUnit(nextUnit);
    if (beverage === 'cider') {
      const normalizedValue = round(fromBatchLiters(batchSizeLiters, nextUnit), 3);
      const nextLiters = round(toBatchLiters(normalizedValue, nextUnit), 3);
      setBatchSizeLiters(nextLiters);
      solveCiderTargets({ batchSizeLiters: nextLiters });
    }
  };

  const applyBsgCiderBasePlan = (ratio = ciderDilutionRatio) => {
    const plan = bsgCiderBasePlan(batchSizeLiters, ratio);
    const nextTargets = solvedBsgCiderTargets({
      abv: ciderAbvCenter(targets),
      residualSugarPct: ciderResidualCenter(targets),
      ph: targetPhCenter,
      batchSizeLiters,
    }).targets;
    setBeverage('cider');
    setMode('standard');
    setManualSyncMode('manual');
    setStyleKey((current) => current || 'bsg_select_ciderbase');
    setCiderDilutionRatio(plan.dilutionRatio);
    setTargets((current) => ({
      ...copyTargets(current),
      ...nextTargets,
      dilution_ratio: { min: plan.dilutionRatio, max: plan.dilutionRatio },
    }));
    setBsgPlanIngredients(plan);
    setMashSteps(defaultCiderProcessSteps());
    setFermentationSteps(defaultCiderFermentationSteps());
    setStatus(
      `Applied BSG Select CiderBase at ${plan.dilutionRatio}:1 for ${round(plan.batchGal, 2)} gal must while keeping the cider target visible for gap review.`
    );
  };

  const startCiderDraft = () => {
    const ciderBatchLiters = batchSizeLiters > 0 ? batchSizeLiters : 18.927;
    const solved = solvedBsgCiderTargets({
      abv: 5.8,
      residualSugarPct: 1,
      ph: 3.35,
      batchSizeLiters: ciderBatchLiters,
    });
    setActiveRecipeIdState(undefined);
    setSearchParams(viewMode === 'recipe' ? { view: 'recipe' } : {});
    setMode('standard');
    setManualSyncMode('manual');
    setRecipeName((current) => (current && current !== 'LAB V2 Draft' ? current : 'BSG Select Cider Draft'));
    setBeverage('cider');
    setStyleKey('bsg_select_ciderbase');
    setBatchSizeLiters(round(ciderBatchLiters, 3));
    setBatchUnit(inferBatchUnit(ciderBatchLiters));
    setEfficiencyPct(100);
    setTargets(solved.targets);
    setSelections(defaultSelections());
    setManualIngredients(ciderStarterIngredients(ciderBatchLiters, solved.recommendedRatio));
    setMashSteps(defaultCiderProcessSteps());
    setFermentationSteps(defaultCiderFermentationSteps());
    setCiderCarbonationMode('unknown');
    setCiderCarbonationTargetVols(ciderCarbonationTargetDefault);
    setCiderDilutionRatio(solved.recommendedRatio);
    setInterstateSalePlanned(false);
    setComplianceProfileDraft(undefined);
    setStatus('Started BSG Select CiderBase draft with dilution math, cider targets, and production plan.');
  };

  useEffect(() => {
    if (lockedFamily !== 'cider') return;
    if (searchParams.get('guidedSetup') !== '1') return;

    const guidedName = searchParams.get('guidedName') ?? 'BSG Select Cider Draft';
    const guidedStyleKey = searchParams.get('guidedStyleKey') ?? 'modern_dry_cider';
    const guidedBatchUnit = (searchParams.get('guidedBatchUnit') as BatchUnit | null) ?? 'gal';
    const guidedBatchValue = Number(searchParams.get('guidedBatchValue') ?? 5);
    const guidedAbv = Number(searchParams.get('guidedAbv') ?? 5.8);
    const guidedResidualSugarPct = Number(searchParams.get('guidedResidualSugarPct') ?? 1);
    const guidedPh = Number(searchParams.get('guidedPh') ?? 3.35);
    const guidedCarbTarget = Number(searchParams.get('guidedCarbTarget') ?? ciderCarbonationTargetDefault);
    const guidedCarbMode = (searchParams.get('guidedCarbMode') as CiderCarbonationMode | null) ?? 'unknown';
    const guidedInterstate = searchParams.get('guidedInterstate') === '1';
    const guidedYeast = searchParams.get('guidedYeast') ?? 'Cider Yeast';
    const guidedPrimaryTempC = Number(searchParams.get('guidedPrimaryTempC') ?? 15);
    const guidedPrimaryDays = Number(searchParams.get('guidedPrimaryDays') ?? 14);
    const guidedConditioningDays = Number(searchParams.get('guidedConditioningDays') ?? 7);
    const guidedIncludeNutrient = searchParams.get('guidedIncludeNutrient') !== '0';
    const guidedIncludePecticEnzyme = searchParams.get('guidedIncludePecticEnzyme') === '1';

    const batchLiters = round(
      toBatchLiters(Number.isFinite(guidedBatchValue) && guidedBatchValue > 0 ? guidedBatchValue : 5, guidedBatchUnit),
      3
    );
    const solved = solvedBsgCiderTargets({
      abv: Number.isFinite(guidedAbv) ? guidedAbv : 5.8,
      residualSugarPct: Number.isFinite(guidedResidualSugarPct) ? guidedResidualSugarPct : 1,
      ph: Number.isFinite(guidedPh) ? guidedPh : 3.35,
      batchSizeLiters: batchLiters,
    });
    const nextIngredients = ciderStarterIngredients(batchLiters, solved.recommendedRatio)
      .map((entry) => (entry.kind === 'yeast' ? { ...entry, name: guidedYeast.trim() || 'Cider Yeast' } : entry))
      .filter((entry) => guidedIncludeNutrient || entry.name !== 'Yeast Nutrient');
    if (guidedIncludePecticEnzyme) {
      nextIngredients.push({
        kind: 'adjunct',
        name: 'Pectic Enzyme',
        amount: round(Math.max(3, batchLiters * 0.25), 1),
        unit: 'g',
      });
    }
    const nextFermentationSteps: FermentationStep[] = [
      {
        order_index: 0,
        stage: 'primary',
        temp_c: Number.isFinite(guidedPrimaryTempC) ? guidedPrimaryTempC : 15,
        duration_days: Number.isFinite(guidedPrimaryDays) ? guidedPrimaryDays : 14,
      },
      {
        order_index: 1,
        stage: 'conditioning',
        temp_c: guidedCarbMode === 'still' ? 8 : 4,
        duration_days: Number.isFinite(guidedConditioningDays) ? guidedConditioningDays : 7,
      },
    ];

    setActiveRecipeIdState(undefined);
    setBeverage('cider');
    setMode('standard');
    setManualSyncMode('manual');
    setRecipeName(guidedName.trim() || 'BSG Select Cider Draft');
    setStyleKey(guidedStyleKey.trim() || 'modern_dry_cider');
    setBatchUnit(guidedBatchUnit);
    setBatchSizeLiters(batchLiters);
    setEfficiencyPct(100);
    setTargets(solved.targets);
    setSelections(defaultSelections());
    setManualIngredients(nextIngredients);
    setMashSteps(defaultCiderProcessSteps());
    setFermentationSteps(nextFermentationSteps);
    setCiderCarbonationTargetVols(Number.isFinite(guidedCarbTarget) ? round(guidedCarbTarget, 1) : ciderCarbonationTargetDefault);
    setCiderCarbonationMode(guidedCarbMode);
    setCiderDilutionRatio(solved.recommendedRatio);
    setInterstateSalePlanned(guidedInterstate);
    setComplianceProfileDraft(undefined);
    setStatus('Guided cider setup applied. Continue in the temporary formulation workspace while the dedicated cider builder is being extracted.');
    setSearchParams({ view: 'recipe' });
  }, [lockedFamily, searchParams, setSearchParams]);

  const applyDynamicSuggestionSet = () => {
    if (!proposalData) return;
    setManualSyncMode('linked');
    setManualIngredients(proposalData.ingredients);
    setMashSteps(normalizeMashSteps(proposalData.mash_steps));
    setFermentationSteps(normalizeFermentationSteps(proposalData.fermentation_steps));
    setStatus('Applied dynamic suggestion set.');
  };

  const keepManualOverrides = () => {
    setManualSyncMode('manual');
    setStatus('Manual overrides retained.');
  };

  const saveCurrentDraft = (openExports = false) => {
    const saveValidation = validateRecipeDraft({
      beverage,
      recipeName,
      ingredients: currentIngredients,
      mashSteps,
      fermentationSteps,
      predictionWarnings: prediction?.warnings ?? [],
    });
    if (saveValidation.blockers.length > 0) {
      setStatus(`Save blocked: ${saveValidation.blockers[0]}`);
      return;
    }

    try {
      const saved = saveRecipe(
        {
          name: recipeName.trim() || 'LAB V2 Draft',
          beverage,
          style_key: styleKey.trim(),
          mode,
          selections,
          targets,
          manual_ingredients: manualIngredients,
          proposal: currentProposal,
          ingredients: currentIngredients,
          mash_steps: normalizeMashSteps(mashSteps),
          fermentation_steps: normalizeFermentationSteps(fermentationSteps),
          compliance_profile: derivedComplianceProfile,
          class_designation: prediction?.class_designation,
          similar_to: prediction?.similar_to ?? [],
        },
        activeRecipeId
      );

      setActiveRecipeIdState(saved.id);
      setSearchParams(viewMode === 'recipe' ? { view: 'recipe', recipeId: saved.id } : { recipeId: saved.id });
      if (saveValidation.warnings.length > 0) {
        setStatus(`Saved: ${saved.name} · warning: ${saveValidation.warnings[0]}`);
      } else {
        setStatus(`Saved: ${saved.name}`);
      }
      if (openExports) navigate(`/lab/exports?recipeId=${saved.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const startNewDraft = () => {
    setActiveRecipeIdState(undefined);
    setSearchParams({});
    setMode('hybrid');
    setManualSyncMode('linked');
    setRecipeName('LAB V2 Draft');
    setBeverage(library.defaults.beverage);
    setStyleKey('');
    setBatchSizeLiters(library.defaults.batch_size_l);
    setBatchUnit('gal');
    setEfficiencyPct(library.defaults.efficiency_pct);
    setTargets(copyTargets(library.defaults.targets));
    setSelections(defaultSelections());
    setManualIngredients([]);
    setMashSteps(defaultMashSteps());
    setFermentationSteps(defaultFermentationSteps());
    setComplianceProfileDraft(undefined);
    setCiderCarbonationMode('unknown');
    setCiderDilutionRatio(3);
    setInterstateSalePlanned(false);
    setProposalData(null);
    setStatus('Started new draft.');
  };

  const dynamicCatalogSuggestions = useMemo(() => {
    const targetTypes: Array<'malt' | 'hop' | 'yeast'> = ['malt', 'hop', 'yeast'];
    const tokens = new Set(
      selectedKeywords.map((word) => word.toLowerCase()).filter((word) => word.length > 2)
    );
    return targetTypes.map((type) => {
      const pool = seedCatalog
        .filter((entry) => entry.type === type)
        .map((entry) => {
          const nameTokens = entry.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
          const score = nameTokens.reduce((sum, token) => sum + (tokens.has(token) ? 1 : 0), 0);
          return { entry, score };
        })
        .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
        .slice(0, 4)
        .map((row) => row.entry);
      return { type, items: pool };
    });
  }, [selectedKeywords]);

  const activeGroup = activeCategory ? library.categories[activeCategory] : undefined;
  const predictionLane = prediction?.target_vs_predicted;
  const viewMode = searchParams.get('view') === 'recipe' ? 'recipe' : 'cards';
  const savedRecipes = useMemo(() => listSavedRecipes(), [activeRecipeId, status]);
  const targetAbvCenter = round((targets.abv.min + targets.abv.max) / 2, 2);
  const targetIbuCenter = round((targets.ibu.min + targets.ibu.max) / 2, 1);
  const targetSrmCenter = round((targets.srm.min + targets.srm.max) / 2, 1);
  const blockerCount = validation.blockers.length;
  const warningCount = validation.warnings.length;
  const fermentableCount = currentIngredients.filter((entry) => entry.kind === 'fermentable').length;
  const hopCount = currentIngredients.filter((entry) => entry.kind === 'hop').length;
  const yeastCount = currentIngredients.filter((entry) => entry.kind === 'yeast').length;
  const totalIngredientCount = currentIngredients.length;
  const stockSummary = useMemo(
    () => ({
      in: [...stockByIndex.values()].filter((entry) => entry.state === 'in').length,
      low: [...stockByIndex.values()].filter((entry) => entry.state === 'low').length,
      out: [...stockByIndex.values()].filter((entry) => entry.state === 'out').length,
      custom: [...stockByIndex.values()].filter((entry) => entry.state === 'custom').length,
    }),
    [stockByIndex]
  );
  const ingredientIssueCount = useMemo(
    () => [...manualRowIssues.values()].reduce((sum, issues) => sum + issues.length, 0),
    [manualRowIssues]
  );
  const selectedIntentLabels = useMemo(
    () =>
      Object.values(selections)
        .flat()
        .map((key) => optionIndex.get(key)?.label)
        .filter((label): label is string => Boolean(label)),
    [selections, optionIndex]
  );
  const builderStageCards = [
    {
      title: 'Intent',
      value: selectedIntentLabels.length > 0 ? `${selectedIntentLabels.length} selections` : 'Not started',
      detail:
        selectedIntentLabels.length > 0
          ? 'Dynamic guidance is shaping ingredient suggestions.'
          : 'Choose notes, aromas, or mouthfeel to drive the proposal.',
      tone: selectedIntentLabels.length > 0 ? 'ready' : 'idle',
    },
    {
      title: 'Ingredients',
      value: `${manualIngredients.length} rows`,
      detail:
        stockSummary.out > 0 || ingredientIssueCount > 0
          ? `${stockSummary.out} out of stock · ${ingredientIssueCount} row issue(s)`
          : 'Inventory and manual rows are in a healthy state.',
      tone: stockSummary.out > 0 || ingredientIssueCount > 0 ? 'warn' : 'ready',
    },
    {
      title: 'Prediction',
      value: prediction ? `${prediction.predicted.abv.toFixed(2)}% ABV` : 'Waiting on formula',
      detail: prediction
        ? `${predictionSourceLabel} is driving the current projection.`
        : 'Add enough ingredients for LAB to calculate targets.',
      tone: prediction ? 'ready' : 'idle',
    },
    {
      title: 'Handoff',
      value: blockerCount > 0 ? `${blockerCount} blocker(s)` : warningCount > 0 ? `${warningCount} warning(s)` : 'Ready',
      detail:
        blockerCount > 0
          ? 'Resolve blockers before sending to exports.'
          : 'Draft can move into export review when you are ready.',
      tone: blockerCount > 0 ? 'blocked' : warningCount > 0 ? 'warn' : 'ready',
    },
  ] as const;
  const ciderPrimaryBaseName =
    currentIngredients.find((entry) => isBsgCiderBase(entry))?.name ??
    manualIngredients.find((entry) => isBsgCiderBase(entry))?.name ??
    'BSG Select CiderBase';
  const activeRecipeMetricTiles =
    beverage === 'cider'
      ? ([
          {
            key: 'style',
            label: 'Cider Base',
            value: ciderPrimaryBaseName.replace(/^BSG\s+/i, ''),
            detail: ciderSolver.feasibleWithinBsgRange ? 'Within BSG range' : 'Needs support',
            tone: 'style',
          },
          {
            key: 'batch',
            label: 'Batch',
            value: `${round(fromBatchLiters(batchSizeLiters, batchUnit), 2)} ${batchUnit}`,
            detail: `${round(batchSizeLiters, 1)} L equivalent`,
            tone: 'batch',
          },
          {
            key: 'og',
            label: 'OG / SG',
            value: prediction ? prediction.predicted.og.toFixed(3) : bsgPlan.mustSg.toFixed(3),
            detail: `Target ${ciderSolver.requestedOg.toFixed(3)} · base ${ciderSolver.achievableOg.toFixed(3)}`,
            tone: ciderSolver.feasibleWithinBsgRange ? 'compliance' : 'warn',
          },
          {
            key: 'fg',
            label: 'FG',
            value: prediction ? prediction.predicted.fg.toFixed(3) : 'n/a',
            detail: 'projected finish',
            tone: 'srm',
          },
          {
            key: 'residual-sugar',
            label: 'Residual',
            value: `${ciderResidualCenter(targets)}%`,
            detail: 'target sugar',
            tone: 'warn',
          },
          {
            key: 'abv',
            label: 'ABV',
            value: prediction ? `${prediction.predicted.abv.toFixed(2)}%` : 'n/a',
            detail: ciderSolver.feasibleWithinBsgRange
              ? 'projected'
              : `Target ${ciderSolver.requestedAbv}% · base ${ciderSolver.achievableAbv}%`,
            tone: ciderCompliance && ciderCompliance.inferredAbv >= 8.5 ? 'blocked' : ciderSolver.feasibleWithinBsgRange ? 'abv' : 'warn',
          },
          {
            key: 'ph',
            label: 'pH',
            value: targetPhCenter.toFixed(2),
            detail: `${ciderCarbonationTargetVols.toFixed(1)} vols CO2 target`,
            tone: 'warn',
          },
        ] as const)
      : ([
          {
            key: 'style',
            label: 'Style',
            value: styleKey || 'n/a',
            detail: beverage,
            tone: 'style',
          },
          {
            key: 'batch',
            label: 'Batch',
            value: `${round(fromBatchLiters(batchSizeLiters, batchUnit), 2)} ${batchUnit}`,
            detail: `${round(batchSizeLiters, 1)} L equivalent`,
            tone: 'batch',
          },
          {
            key: 'abv',
            label: 'ABV',
            value: prediction ? `${prediction.predicted.abv.toFixed(2)}%` : 'n/a',
            detail: 'projected',
            tone: 'abv',
          },
          {
            key: 'ibu',
            label: 'IBU',
            value: prediction ? prediction.predicted.ibu.toFixed(1) : 'n/a',
            detail: 'bitterness',
            tone: 'ibu',
          },
          {
            key: 'srm',
            label: 'SRM',
            value: prediction ? prediction.predicted.srm.toFixed(1) : 'n/a',
            detail: 'color estimate',
            tone: 'srm',
          },
        ] as const);
  const savedStateLabel = activeRecipeId ? 'Saved Draft' : 'Unsaved Draft';
  const readinessLabel =
    blockerCount > 0 ? `${blockerCount} blocker(s)` : warningCount > 0 ? `${warningCount} warning(s)` : 'Ready';
  const focusSections = [
    { id: 'builder-overview', label: 'Overview' },
    { id: 'builder-targets', label: 'Targets' },
    { id: 'builder-intent', label: 'Intent' },
    { id: 'builder-ingredients', label: 'Ingredients' },
    { id: 'builder-process', label: 'Process' },
    { id: 'builder-validation', label: 'Validation' },
  ];
  const quickPickerRows = useMemo(() => {
    const term = quickIngredientQuery.trim().toLowerCase();
    return seedCatalog
      .filter((entry) => {
        if (!term) return true;
        return entry.name.toLowerCase().includes(term);
      })
      .slice(0, 12);
  }, [quickIngredientQuery]);
  const ingredientLaneOptions = [
    { key: 'all' as const, label: 'All', count: manualIngredients.length },
    {
      key: 'fermentable' as const,
      label: 'Fermentables',
      count: manualIngredients.filter((entry) => entry.kind === 'fermentable').length,
    },
    {
      key: 'hop' as const,
      label: 'Hops',
      count: manualIngredients.filter((entry) => entry.kind === 'hop').length,
    },
    {
      key: 'yeast' as const,
      label: 'Yeast',
      count: manualIngredients.filter((entry) => entry.kind === 'yeast').length,
    },
    {
      key: 'adjunct' as const,
      label: 'Adjuncts',
      count: manualIngredients.filter((entry) => entry.kind === 'adjunct').length,
    },
    {
      key: 'other' as const,
      label: 'Other',
      count: manualIngredients.filter((entry) => entry.kind === 'other').length,
    },
  ];
  const filteredManualRows = useMemo(
    () =>
      manualIngredients
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => activeIngredientLane === 'all' || entry.kind === activeIngredientLane),
    [manualIngredients, activeIngredientLane]
  );
  const processTimelineRows = useMemo(() => {
    const mashRows = mashSteps.map((step, index) => ({
      key: `mash-${index}`,
      phase:
        beverage === 'cider'
          ? /transfer|blend|dilution|prep|press/i.test(step.name)
            ? 'Prep'
            : /nutrient|enzyme|add/i.test(step.name)
              ? 'Addition'
              : 'Cellar'
          : /boil/i.test(step.name)
            ? 'Boil'
            : /sparge/i.test(step.name)
              ? 'Sparge'
              : 'Mash',
      when: `${round(Number(step.duration_min ?? 0), 0)} min`,
      action: step.name,
      detail: `${round(Number(step.temp_c ?? 0), 1)} C target`,
    }));
    const hopRows = currentIngredients
      .filter((entry) => entry.kind === 'hop')
      .map((entry, index) => ({
        key: `hop-${index}-${entry.name}`,
        phase: 'Hop',
        when:
          entry.timing === 'ferment'
            ? `Day ${round(Number(entry.day_offset ?? 0), 0)}`
            : `${round(Number(entry.time_min ?? 0), 0)} min ${entry.timing ?? 'boil'}`,
        action: entry.name,
        detail: `${round(Number(entry.amount ?? 0), 2)} ${entry.unit} ${entry.aa_pct ? `· ${round(Number(entry.aa_pct), 1)}% AA` : ''}`.trim(),
      }));
    const fermentationRows = fermentationSteps.map((step, index) => ({
      key: `ferm-${index}`,
      phase: 'Fermentation',
      when: `${round(Number(step.duration_days ?? 0), 0)} day(s)`,
      action: step.stage.replaceAll('_', ' '),
      detail: `${round(Number(step.temp_c ?? 0), 1)} C target`,
    }));
    return [...mashRows, ...hopRows, ...fermentationRows];
  }, [mashSteps, currentIngredients, fermentationSteps, beverage]);
  const processSectionTitle = beverage === 'beer' ? 'Process' : 'Production Plan';
  const processSectionHint =
    beverage === 'beer'
      ? 'Mash/boil and fermentation schedule for execution handoff.'
      : 'Pre-fermentation and fermentation schedule for execution handoff.';

  const goToRecipeWorkspace = (recipeId?: string) => {
    if (recipeId) {
      setSearchParams({ view: 'recipe', recipeId });
      return;
    }
    if (activeRecipeId) {
      setSearchParams({ view: 'recipe', recipeId: activeRecipeId });
      return;
    }
    setSearchParams({ view: 'recipe' });
  };

  const goToCards = () => {
    if (activeRecipeId) {
      setSearchParams({ recipeId: activeRecipeId });
      return;
    }
    setSearchParams({});
  };

  const openSavedRecipeCard = (recipe: SavedLabRecipe) => {
    loadSavedRecipe(recipe);
    setSearchParams({ view: 'recipe', recipeId: recipe.id });
  };

  const sharedHeaderActions = (
    <>
      {lockedFamily === 'cider' ? (
        <button type="button" className="button" onClick={startCiderDraft}>
          Start Cider Draft
        </button>
      ) : (
        <button type="button" className="button button-muted" onClick={startNewDraft}>
          New Draft
        </button>
      )}
      {viewMode === 'cards' ? (
        <button type="button" className="button button-muted" onClick={() => goToRecipeWorkspace()}>
          Open Recipe Workspace
        </button>
      ) : (
        <button type="button" className="button button-muted" onClick={goToCards}>
          Recipe Cards
        </button>
      )}
      <Link className="button button-muted" to="/lab/library">
        Library
      </Link>
      <Link className="button button-muted" to="/lab/builder">
        Legacy Builder
      </Link>
    </>
  );

  const builderTitle =
    lockedFamily === 'cider'
      ? 'Cider Builder'
      : lockedFamily === 'beer'
        ? 'Beer Builder'
        : lockedFamily === 'wine'
          ? 'Wine Builder'
          : 'LAB Builder V2';

  const builderDescription =
    lockedFamily === 'cider'
      ? 'Cider-first authoring route. This page keeps the current active cider workflow while the split builder architecture is phased in.'
      : 'One recipe state with Dynamic guidance, manual authority, and explicit merge controls.';

  if (viewMode === 'cards') {
    return (
      <>
        <LabBuilderV2Frame
          family={lockedFamily}
          title={builderTitle}
          description="Card-first workflow. Open a recipe card to edit full process, timing, and execution details."
          actions={sharedHeaderActions}
        >
          {prelude}
          <article className="card lab-v2-card-board lab-v2-live-card">
          <div className="lab-v2-live-head">
            <div className="lab-v2-live-title">
              <div className="lab-v2-live-icon">LAB</div>
              <div>
                <p className="lab-v2-live-eyebrow">Authoring Now</p>
                <h2>Active Recipe Card</h2>
              </div>
            </div>
            <div className="button-row-inline">
              <span className="lab-v2-sync-pill">
                Sync: {manualSyncMode === 'linked' ? 'Linked to Dynamic' : 'Manual Override'}
              </span>
              <span className={`lab-v2-readiness-pill ${blockerCount > 0 ? 'lab-v2-readiness-pill--blocked' : ''}`}>
                {readinessLabel}
              </span>
              {manualSyncMode !== 'linked' && (
                <button
                  type="button"
                  className="button button-muted"
                  onClick={() => {
                    setManualSyncMode('linked');
                    setStatus('Dynamic link enabled on active recipe card.');
                  }}
                >
                  Re-link Dynamic
                </button>
              )}
            </div>
          </div>

          <div className="lab-v2-live-body">
            <div className="lab-v2-recipe-identity">
              <p className="lab-v2-live-eyebrow">Formula Draft</p>
              <h3>{recipeName || 'Untitled Recipe'}</h3>
              <div className="lab-v2-identity-chips">
                <span>{beverage}</span>
                <span>{mode}</span>
                <span>{manualSyncMode === 'linked' ? 'dynamic linked' : 'manual authority'}</span>
              </div>
            </div>
            <div className="lab-v2-export-box">
              <p className="lab-v2-live-eyebrow">Export Path</p>
              <strong>{blockerCount > 0 ? 'Blocked' : warningCount > 0 ? 'Review' : 'Ready'}</strong>
              <span>LAB authors recipe + compliance snapshot, then OS executes.</span>
            </div>
          </div>

          <div className="lab-v2-dash-metrics">
            {activeRecipeMetricTiles.map((tile) => (
              <div key={tile.key} className={`lab-v2-dash-tile lab-v2-dash-tile--${tile.tone}`}>
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
                <small>{tile.detail}</small>
              </div>
            ))}
          </div>

          <div className="lab-v2-card-tags">
            {currentIngredients.length === 0 ? (
              <p className="hint small">No ingredient tags yet. Use Dynamic Notes or Ingredient Picker tiles below.</p>
            ) : (
              currentIngredients.slice(0, 24).map((ingredient, index) => (
                <button
                  key={`${ingredient.kind}-${ingredient.name}-${index}`}
                  type="button"
                  className={ingredientTagClass(ingredient.kind)}
                  onClick={() => goToRecipeWorkspace(activeRecipeId)}
                  title={`${ingredient.name} · ${round(Number(ingredient.amount ?? 0), 2)} ${ingredient.unit}`}
                >
                  {ingredient.name}
                </button>
              ))
            )}
          </div>

          <div className="button-row-inline">
            <button type="button" className="button" onClick={() => goToRecipeWorkspace(activeRecipeId)}>
              Open Recipe Workspace
            </button>
            <button type="button" className="button button-muted" onClick={() => saveCurrentDraft(false)}>
              {activeRecipeId ? 'Update Draft' : 'Save Draft'}
            </button>
            <button type="button" className="button button-muted" onClick={() => saveCurrentDraft(true)}>
              Save + Exports
            </button>
          </div>
          <p className="status">{status || 'This card is your recipe summary tile. Open workspace for full steps/process.'}</p>
        </article>

        <div className="lab-v2-card-tools">
          <article className="card lab-v2-tool-card">
            <div className="standard-panel-head">
              <h3>Ingredient Picker</h3>
              <span className="hint small">Adds directly to active recipe card.</span>
            </div>
            <label>
              Search Ingredients
              <input
                type="search"
                placeholder={beverage === 'cider' ? 'Search cider additions, yeast, or catalog...' : 'Search grain, hops, yeast...'}
                value={quickIngredientQuery}
                onChange={(event) => setQuickIngredientQuery(event.target.value)}
              />
            </label>
            {beverage === 'cider' && (
              <div className="lab-v2-cider-quick">
                <div className="standard-panel-head">
                  <h4>Cider Fast Adds</h4>
                  <span className="hint small">Clicking again merges into the existing row.</span>
                </div>
                <div className="lab-v2-card-tags">
                  {ciderQuickAddIngredients().map((ingredient) => (
                    <button
                      key={`cider-fast-${ingredient.name}`}
                      type="button"
                      className={ingredientTagClass(ingredient.kind)}
                      onClick={() => upsertManualIngredient(ingredient, 'Cider fast add')}
                      title={`Add ${ingredient.name} to active cider`}
                    >
                      + {ingredient.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="lab-v2-card-tags">
              {quickPickerRows.map((item) => {
                const ingredient = ingredientFromCatalog(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={ingredientTagClass(ingredient.kind)}
                    onClick={() => addFromCatalog(item)}
                    title={`Add ${item.name} to active recipe card`}
                  >
                    + {item.name}
                  </button>
                );
              })}
            </div>
          </article>

          <article className="card lab-v2-tool-card">
            <div className="standard-panel-head">
              <h3>Dynamic Notes</h3>
              <span className="hint small">Selecting notes updates ingredient tags on active card.</span>
            </div>
            <div className="dynamic-category-tabs">
              {categoryKeys.map((categoryKey) => (
                <button
                  key={categoryKey}
                  type="button"
                  className={`dynamic-category-tab ${activeCategory === categoryKey ? 'dynamic-category-tab--active' : ''}`}
                  onClick={() => setActiveCategory(categoryKey)}
                >
                  {library.categories[categoryKey]?.label ?? categoryKey}
                </button>
              ))}
            </div>
            {!activeGroup ? (
              <p className="hint small">No dynamic categories found.</p>
            ) : (
              <div className="lab-chip-columns">
                {activeGroup.groups.map((group) => (
                  <section key={group.key} className="lab-chip-group">
                    <h4>{group.label}</h4>
                    <div className="lab-chip-list">
                      {group.options.map((option) => {
                        const selected = (selections[activeCategory] ?? []).includes(option.key);
                        const reason = disabledReasons.get(option.key);
                        return (
                          <div key={option.key} className="lab-chip-wrap">
                            <button
                              type="button"
                              className={`lab-chip ${selected ? 'lab-chip--active' : ''} ${reason && !selected ? 'lab-chip--disabled' : ''}`}
                              disabled={Boolean(reason && !selected)}
                              onClick={() => {
                                if (manualSyncMode !== 'linked') setManualSyncMode('linked');
                                toggleChip(option.key);
                              }}
                              title={reason || option.label}
                            >
                              {option.label}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </article>
        </div>

        <article className="card">
          <div className="standard-panel-head">
            <h2>Recipe Cards</h2>
            <span className="hint small">{savedRecipes.length} saved draft(s)</span>
          </div>
          {savedRecipes.length === 0 ? (
            <p className="hint">No saved recipes yet. Save the active card, then open it as full recipe workspace.</p>
          ) : (
            <div className="lab-v2-recipes-grid">
              {savedRecipes.map((recipe) => {
                const centerAbv = (recipe.targets.abv.min + recipe.targets.abv.max) / 2;
                const centerIbu = (recipe.targets.ibu.min + recipe.targets.ibu.max) / 2;
                const centerSrm = (recipe.targets.srm.min + recipe.targets.srm.max) / 2;
                return (
                  <article key={recipe.id} className="lab-v2-recipe-card">
                    <div className="lab-v2-recipe-card-head">
                      <h3>{recipe.name}</h3>
                      <span className="hint small">{recipe.mode ?? 'hybrid'}</span>
                    </div>
                    <p className="hint small">
                      Style {recipe.style_key || 'n/a'} · Batch {round(recipe.proposal.batch_size_l, 1)} L
                    </p>
                    <div className="lab-v2-card-metrics">
                      <div className="status-chip">ABV {centerAbv.toFixed(2)}%</div>
                      <div className="status-chip">IBU {centerIbu.toFixed(1)}</div>
                      <div className="status-chip">SRM {centerSrm.toFixed(1)}</div>
                    </div>
                    <div className="lab-v2-card-tags">
                      {(recipe.ingredients ?? []).slice(0, 10).map((ingredient, index) => (
                        <span key={`${recipe.id}-ing-${index}`} className={ingredientTagClass(ingredient.kind)}>
                          {ingredient.name}
                        </span>
                      ))}
                    </div>
                    <div className="button-row-inline">
                      <button type="button" className="button button-muted" onClick={() => openSavedRecipeCard(recipe)}>
                        Open Recipe
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </article>
        </LabBuilderV2Frame>
      </>
    );
  }

  return (
    <>
      <LabBuilderV2Frame family={lockedFamily} title={builderTitle} description={builderDescription} actions={sharedHeaderActions}>
        {prelude}
        <section id="builder-overview" className="lab-v2-overview-grid">
        <article className="card lab-v2-summary-tile">
          <span className="lab-v2-tile-eyebrow">Draft State</span>
          <strong className="lab-v2-tile-value">{savedStateLabel}</strong>
          <h2>{recipeName || 'Untitled Recipe'}</h2>
          <p>{styleKey || 'Style key not set'} · {beverage}</p>
        </article>

        <article className="card lab-v2-summary-tile">
          <span className="lab-v2-tile-eyebrow">Builder Mode</span>
          <strong className="lab-v2-tile-value">{mode[0].toUpperCase() + mode.slice(1)}</strong>
          <h2>Authoring Logic</h2>
          <p>{manualSyncMode === 'linked' ? 'Dynamic suggestions linked into recipe' : 'Manual overrides are active'}</p>
        </article>

        <article className="card lab-v2-summary-tile">
          <span className="lab-v2-tile-eyebrow">Recipe Envelope</span>
          <strong className="lab-v2-tile-value">{targetAbvCenter}%</strong>
          <h2>{beverage === 'cider' ? 'Cider Plan' : 'Target Center'}</h2>
          <p>
            {beverage === 'cider'
              ? `${ciderSolver.requestedOg.toFixed(3)} OG · ${ciderSolver.requestedFg.toFixed(3)} FG · ${round(fromBatchLiters(batchSizeLiters, batchUnit), 2)} ${batchUnit}`
              : `${targetIbuCenter} IBU · ${targetSrmCenter} SRM · ${round(fromBatchLiters(batchSizeLiters, batchUnit), 2)} ${batchUnit}`}
          </p>
        </article>

        <article className="card lab-v2-summary-tile">
          <span className="lab-v2-tile-eyebrow">Export Readiness</span>
          <strong className="lab-v2-tile-value">{readinessLabel}</strong>
          <h2>Save + Handoff Gate</h2>
          <p>{blockerCount > 0 ? 'Resolve blockers before export handoff.' : 'Recipe is ready for save/export review.'}</p>
        </article>
      </section>

      <article className="card lab-v2-compose">
        <div className="lab-v2-focus-nav">
          {focusSections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="lab-v2-focus-link">
              {section.label}
            </a>
          ))}
        </div>

        <div className="lab-v2-config-grid">
          <section className="lab-v2-config-card">
            <div className="standard-panel-head">
              <h2>Recipe Profile</h2>
              <span className="lab-v2-sync-pill">
                Sync: {manualSyncMode === 'linked' ? 'Linked to Dynamic' : 'Manual Override'}
              </span>
            </div>
            <div className="mode-tabs" role="tablist" aria-label="Builder mode">
              {(['dynamic', 'hybrid', 'standard'] as BuilderMode[]).map((tab) => (
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
                <input placeholder="american_ipa" value={styleKey} onChange={(event) => setStyleKey(event.target.value)} />
              </label>
              <label>
                Beverage
                {lockedFamily ? (
                  <>
                    <input value={lockedFamily[0].toUpperCase() + lockedFamily.slice(1)} readOnly />
                    <span className="hint small">Builder family is locked by route during the split architecture pass.</span>
                  </>
                ) : (
                  <select value={beverage} onChange={(event) => setBeverage(event.target.value)}>
                    <option value="beer">Beer</option>
                    <option value="cider">Cider</option>
                    <option value="mead">Mead</option>
                    <option value="wine">Wine</option>
                  </select>
                )}
              </label>
              <label>
                Efficiency (%)
                <input
                  type="number"
                  min={45}
                  max={90}
                  step={1}
                  value={efficiencyPct}
                  onChange={(event) => {
                    const numeric = Number(event.target.value);
                    if (!Number.isFinite(numeric)) return;
                    setEfficiencyPct(clamp(numeric, 45, 90));
                  }}
                />
              </label>
            </div>
            {beverage === 'cider' && (
              <div className="lab-v2-cider-start-panel">
                <div>
                  <span className="lab-v2-live-eyebrow">Cider Production Starter</span>
                  <p className="hint small">
                    Loads BSG Select CiderBase, dilution math, cider yeast, nutrient, cider targets, and an OS-ready production plan.
                  </p>
                </div>
                <button type="button" className="button" onClick={startCiderDraft}>
                  Reset To BSG CiderBase
                </button>
              </div>
            )}
          </section>

          <section id="builder-targets" className="lab-v2-config-card">
            <div className="standard-panel-head">
              <h2>Recipe Targets</h2>
              <span className="hint small">Set batch size and target range before editing ingredients.</span>
            </div>
            {beverage === 'cider' && (
              <div className="lab-v2-bsg-panel">
                <div>
                  <span className="lab-v2-live-eyebrow">BSG Select CiderBase Model</span>
                  <h3>45 Brix concentrate · pH {BSG_CIDERBASE_PH_MIN}-{BSG_CIDERBASE_PH_MAX}</h3>
                  <p className="hint small">
                    BSG’s recommended operating window is 3:1 to 5:1 water-to-concentrate. LAB now shows when your target fits
                    that window and when it needs enrichment or a lighter plan.
                  </p>
                </div>
                <div className="lab-v2-bsg-grid">
                  <div className="lab-v2-bsg-stat">
                    <span>BSG Window</span>
                    <strong>3:1 to 5:1</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Requested OG</span>
                    <strong>{ciderSolver.requestedOg.toFixed(3)}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Closest Base OG</span>
                    <strong>{ciderSolver.achievableOg.toFixed(3)}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Closest Base Ratio</span>
                    <strong>{ciderSolver.recommendedRatio}:1</strong>
                  </div>
                </div>
                <p className={`hint small ${ciderSolver.feasibleWithinBsgRange ? '' : 'lab-v2-cider-gap-note'}`}>
                  {ciderSolver.supportStatus}
                </p>
              </div>
            )}

            {beverage === 'cider' && (
              <div className="lab-v2-cider-solver-panel">
                <div className="standard-panel-head">
                  <div>
                    <h3>Cider Target Solver</h3>
                    <p className="hint small">
                      Type the production target first. LAB recalculates OG, FG, base ratio, concentrate, water, and the support gap when
                      the BSG base alone cannot hit the brief.
                    </p>
                  </div>
                  <button type="button" className="button" onClick={() => solveCiderTargets()}>
                    Recalculate Cider
                  </button>
                </div>
                <div className="lab-v2-cider-solver-grid">
                  <label>
                    Batch Size
                    <div className="batch-size-row">
                      <input
                        type="number"
                        min={0.1}
                        step={batchUnitLabels[batchUnit].step}
                        value={round(fromBatchLiters(batchSizeLiters, batchUnit), 3)}
                        onChange={(event) => updateBatchSize(event.target.value)}
                      />
                      <select value={batchUnit} onChange={(event) => updateBatchUnit(event.target.value as BatchUnit)}>
                        {(Object.keys(batchUnitLabels) as BatchUnit[]).map((unit) => (
                          <option key={unit} value={unit}>
                            {batchUnitLabels[unit].long}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label>
                    ABV Target
                    <input
                      type="number"
                      min={0}
                      max={14}
                      step={0.1}
                      value={ciderAbvCenter(targets)}
                      onChange={(event) => updateCiderTarget('abv', event.target.value)}
                    />
                  </label>
                  <label>
                    Residual Sugar (%)
                    <input
                      type="number"
                      min={0}
                      max={8}
                      step={0.1}
                      value={ciderResidualCenter(targets)}
                      onChange={(event) => updateCiderTarget('residualSugarPct', event.target.value)}
                    />
                  </label>
                  <label>
                    pH Target
                    <input
                      type="number"
                      min={2.8}
                      max={4.2}
                      step={0.1}
                      value={targetPhCenter}
                      onChange={(event) => updateCiderTarget('ph', event.target.value)}
                    />
                  </label>
                  <label>
                    Carbonation Target
                    <div className="batch-size-row">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={ciderCarbonationTargetVols}
                        onChange={(event) => {
                          const numeric = Number(event.target.value);
                          if (!Number.isFinite(numeric) || numeric < 0) return;
                          setCiderCarbonationTargetVols(round(numeric, 1));
                        }}
                      />
                      <span className="lab-v2-inline-unit">vols CO2</span>
                    </div>
                  </label>
                  <div className="lab-v2-bsg-stat">
                    <span>OG Target</span>
                    <strong>{ciderSolver.requestedOg.toFixed(3)}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>FG Target</span>
                    <strong>{ciderSolver.requestedFg.toFixed(3)}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Base Ratio</span>
                    <strong>{ciderSolver.recommendedRatio}:1</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Base-Only ABV</span>
                    <strong>{ciderSolver.achievableAbv.toFixed(2)}%</strong>
                  </div>
                </div>
                <div className="lab-v2-cider-feasibility">
                  <div className={`lab-v2-cider-feasibility-card ${ciderSolver.feasibleWithinBsgRange ? 'lab-v2-cider-feasibility-card--ok' : 'lab-v2-cider-feasibility-card--warn'}`}>
                    <span className="lab-v2-live-eyebrow">Solver Status</span>
                    <h4>{ciderSolver.feasibleWithinBsgRange ? 'Target fits the BSG base window' : 'Target needs support beyond the base ratio'}</h4>
                    <p className="hint small">{ciderSolver.supportStatus}</p>
                  </div>
                  {!ciderSolver.feasibleWithinBsgRange && (
                    <div className="lab-v2-cider-support-grid">
                      <div className="lab-v2-bsg-stat">
                        <span>Support Gap</span>
                        <strong>{Math.abs(ciderSolver.gravityPointGap).toFixed(1)} pts</strong>
                      </div>
                      <div className="lab-v2-bsg-stat">
                        <span>Dextrose Option</span>
                        <strong>{ciderSolver.supportDextroseLb.toFixed(2)} lb</strong>
                      </div>
                      <div className="lab-v2-bsg-stat">
                        <span>Apple Concentrate Option</span>
                        <strong>{ciderSolver.supportAppleConcentrateGal.toFixed(2)} gal</strong>
                      </div>
                    </div>
                  )}
                </div>
                <div className="button-row-inline">
                  <button type="button" className="button" onClick={() => applyBsgCiderBasePlan(ciderSolver.recommendedRatio)}>
                    Apply Base Plan To Recipe
                  </button>
                  <span className="hint small">
                    Current plan: {round(bsgPlan.concentrateGal, 2)} gal concentrate + {round(bsgPlan.waterGal, 2)} gal water
                  </span>
                </div>
              </div>
            )}
            {beverage !== 'cider' && (
              <div className="field-row field-row--4">
                <label>
                  Batch Size
                  <div className="batch-size-row">
                    <input
                      type="number"
                      min={0.1}
                      step={batchUnitLabels[batchUnit].step}
                      value={round(fromBatchLiters(batchSizeLiters, batchUnit), 3)}
                      onChange={(event) => updateBatchSize(event.target.value)}
                    />
                    <select value={batchUnit} onChange={(event) => updateBatchUnit(event.target.value as BatchUnit)}>
                      {(Object.keys(batchUnitLabels) as BatchUnit[]).map((unit) => (
                        <option key={unit} value={unit}>
                          {batchUnitLabels[unit].long}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label>
                  ABV Target
                  <div className="batch-size-row">
                    <input type="number" step={0.1} value={targets.abv.min} onChange={(event) => setMetric('abv', 'min', event.target.value)} />
                    <input type="number" step={0.1} value={targets.abv.max} onChange={(event) => setMetric('abv', 'max', event.target.value)} />
                  </div>
                </label>
                <label>
                  IBU Target
                  <div className="batch-size-row">
                    <input type="number" step={1} value={targets.ibu.min} onChange={(event) => setMetric('ibu', 'min', event.target.value)} />
                    <input type="number" step={1} value={targets.ibu.max} onChange={(event) => setMetric('ibu', 'max', event.target.value)} />
                  </div>
                </label>
                <label>
                  SRM Target
                  <div className="batch-size-row">
                    <input type="number" step={0.1} value={targets.srm.min} onChange={(event) => setMetric('srm', 'min', event.target.value)} />
                    <input type="number" step={0.1} value={targets.srm.max} onChange={(event) => setMetric('srm', 'max', event.target.value)} />
                  </div>
                </label>
              </div>
            )}
          </section>
        </div>
      </article>

      <section className="lab-v2-workbench-grid">
        <article className="card lab-v2-active-board lab-v2-live-card">
          <div className="lab-v2-live-head">
            <div className="lab-v2-live-title">
              <div className="lab-v2-live-icon">LAB</div>
              <div>
                <p className="lab-v2-live-eyebrow">Authoring Now</p>
                <h2>Active Recipe Card</h2>
              </div>
            </div>
            <div className="button-row-inline">
              <button type="button" className="button button-muted" onClick={() => saveCurrentDraft(false)}>
                {activeRecipeId ? 'Update Draft' : 'Save Draft'}
              </button>
              <button type="button" className="button button-muted" onClick={() => goToRecipeWorkspace(activeRecipeId)}>
                Open Recipe Workspace
              </button>
            </div>
          </div>
          <div className="lab-v2-live-body">
            <div className="lab-v2-recipe-identity">
              <p className="lab-v2-live-eyebrow">Formula Draft</p>
              <h3>{recipeName || 'Untitled Recipe'}</h3>
              <div className="lab-v2-identity-chips">
                <span>{beverage}</span>
                <span>{mode}</span>
                <span>{manualSyncMode === 'linked' ? 'dynamic linked' : 'manual authority'}</span>
              </div>
            </div>
            <div className="lab-v2-export-box">
              <p className="lab-v2-live-eyebrow">Export Path</p>
              <strong>{readinessLabel}</strong>
              <span>LAB authors the recipe and compliance packet; OS executes the handoff.</span>
            </div>
          </div>
          <div className="lab-v2-dash-metrics">
            {activeRecipeMetricTiles.map((tile) => (
              <div key={tile.key} className={`lab-v2-dash-tile lab-v2-dash-tile--${tile.tone}`}>
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
                <small>{tile.detail}</small>
              </div>
            ))}
          </div>
          <div className="lab-v2-board-metrics lab-v2-support-metrics">
            <div>
              <span>Ingredients</span>
              <strong>{totalIngredientCount}</strong>
            </div>
            <div>
              <span>Intent Signals</span>
              <strong>{selectedIntentLabels.length}</strong>
            </div>
            <div>
              <span>Stock Pressure</span>
              <strong>{stockSummary.low + stockSummary.out}</strong>
            </div>
            <div>
              <span>Process Events</span>
              <strong>{processTimelineRows.length}</strong>
            </div>
          </div>
          <div className="lab-v2-board-section">
            <div className="standard-panel-head">
              <h3>Current Ingredient Set</h3>
              <span className="hint small">What the current formula is carrying right now.</span>
            </div>
            {currentIngredients.length === 0 ? (
              <p className="hint small">No ingredients yet. Start from Dynamic intent or add rows manually.</p>
            ) : (
              <div className="lab-v2-tag-board">
                {currentIngredients.slice(0, 16).map((ingredient, index) => (
                  <span key={`active-ingredient-${ingredient.name}-${index}`} className={ingredientTagClass(ingredient.kind)}>
                    {ingredient.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="lab-v2-board-section">
            <div className="standard-panel-head">
              <h3>Intent Signals</h3>
              <span className="hint small">Selected notes driving dynamic recommendations.</span>
            </div>
            {selectedIntentLabels.length === 0 ? (
              <p className="hint small">No dynamic intent selected yet.</p>
            ) : (
              <div className="lab-v2-pill-row">
                {selectedIntentLabels.slice(0, 14).map((label) => (
                  <span key={label} className="status-chip">
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="card lab-v2-stage-card-shell">
          <div className="standard-panel-head">
            <h2>Authoring Path</h2>
            <span className="hint small">A simpler read of where the draft stands right now.</span>
          </div>
          <div className="lab-v2-stage-grid">
            {builderStageCards.map((stage) => (
              <article key={stage.title} className={`lab-v2-stage-card lab-v2-stage-card--${stage.tone}`}>
                <span className="lab-v2-stage-label">{stage.title}</span>
                <strong>{stage.value}</strong>
                <p>{stage.detail}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <div className="lab-v2-layout">
        <section className="lab-v2-main">
          <article id="builder-intent" className="card lab-v2-intent">
            <div className="standard-panel-head">
              <h2>Dynamic Intent</h2>
              <span className="hint small">Select notes/aromas/mouthfeel; recipe suggestions update automatically.</span>
            </div>
            <div className="dynamic-category-tabs">
              {categoryKeys.map((categoryKey) => (
                <button
                  key={categoryKey}
                  type="button"
                  className={`dynamic-category-tab ${activeCategory === categoryKey ? 'dynamic-category-tab--active' : ''}`}
                  onClick={() => setActiveCategory(categoryKey)}
                >
                  {library.categories[categoryKey]?.label ?? categoryKey}
                </button>
              ))}
            </div>
            {!activeGroup ? (
              <p className="hint">No dynamic categories found.</p>
            ) : (
              <div className="lab-chip-columns">
                {activeGroup.groups.map((group) => (
                  <section key={group.key} className="lab-chip-group">
                    <h3>{group.label}</h3>
                    <div className="lab-chip-list">
                      {group.options.map((option) => {
                        const selected = (selections[activeCategory] ?? []).includes(option.key);
                        const reason = disabledReasons.get(option.key);
                        return (
                          <div key={option.key} className="lab-chip-wrap">
                            <button
                              type="button"
                              className={`lab-chip ${selected ? 'lab-chip--active' : ''} ${reason && !selected ? 'lab-chip--disabled' : ''}`}
                              onClick={() => toggleChip(option.key)}
                              disabled={Boolean(reason && !selected)}
                              title={reason || option.label}
                            >
                              {option.label}
                            </button>
                            {reason && !selected && <small className="lab-chip-reason">{reason}</small>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </article>

          <article id="builder-ingredients" className="card">
            <div className="standard-panel-head">
              <div>
                <h2>Ingredient Workspace</h2>
                <p className="hint small">Source ingredients, review stock, then edit the exact working formula.</p>
              </div>
              <div className="lab-v2-section-meta">
                <span className="status-chip">{fermentableCount} fermentable(s)</span>
                <span className="status-chip">{hopCount} hop addition(s)</span>
                <span className="status-chip">{yeastCount} yeast entry</span>
              </div>
              <div className="manual-actions">
                <button type="button" className="button button-muted" onClick={() => addManualIngredient('fermentable')}>
                  + Fermentable
                </button>
                <button type="button" className="button button-muted" onClick={() => addManualIngredient('hop')}>
                  + Hop
                </button>
                <button type="button" className="button button-muted" onClick={() => addManualIngredient('yeast')}>
                  + Yeast
                </button>
                <button type="button" className="button button-muted" onClick={() => addManualIngredient('adjunct')}>
                  + Adjunct
                </button>
              </div>
            </div>

            <div className="lab-v2-ingredient-overview">
              <article className="lab-v2-mini-card">
                <span className="lab-v2-mini-label">Working Rows</span>
                <strong>{manualIngredients.length}</strong>
                <p>{manualSyncMode === 'linked' ? 'Dynamic proposal is currently linked.' : 'Manual overrides are active.'}</p>
              </article>
              <article className="lab-v2-mini-card">
                <span className="lab-v2-mini-label">Stock Pressure</span>
                <strong>{stockSummary.low + stockSummary.out}</strong>
                <p>{stockSummary.in} in stock · {stockSummary.low} low · {stockSummary.out} out</p>
              </article>
              <article className="lab-v2-mini-card">
                <span className="lab-v2-mini-label">Row Issues</span>
                <strong>{ingredientIssueCount}</strong>
                <p>{ingredientIssueCount > 0 ? 'Fix row-level spec or unit issues before handoff.' : 'No current row issues detected.'}</p>
              </article>
              <article className="lab-v2-mini-card">
                <span className="lab-v2-mini-label">Suggestion Source</span>
                <strong>{predictionSourceLabel}</strong>
                <p>Use Quick Add for manual authority or copy from Dynamic selectively.</p>
              </article>
            </div>

            <div className="lab-v2-ingredient-toolbar">
              <div className="dynamic-category-tabs">
                {ingredientLaneOptions.map((lane) => (
                  <button
                    key={lane.key}
                    type="button"
                    className={`dynamic-category-tab ${activeIngredientLane === lane.key ? 'dynamic-category-tab--active' : ''}`}
                    onClick={() => setActiveIngredientLane(lane.key)}
                  >
                    {lane.label} ({lane.count})
                  </button>
                ))}
              </div>
              <label className="lab-v2-ingredient-search">
                Quick Add Search
                <input
                  type="search"
                  placeholder={beverage === 'cider' ? 'Search cider additions, yeast, or catalog...' : 'Search inventory/catalog ingredients...'}
                  value={quickIngredientQuery}
                  onChange={(event) => setQuickIngredientQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="lab-v2-ingredient-assist-grid">
              <section className="lab-v2-assist-card">
                <div className="standard-panel-head">
                  <h3>Working Formula Tags</h3>
                  <span className="hint small">Quick scan of the ingredient set without reading the table.</span>
                </div>
                {currentIngredients.length === 0 ? (
                  <p className="hint small">No ingredients in the active formula yet.</p>
                ) : (
                  <div className="lab-v2-tag-board">
                    {currentIngredients.slice(0, 18).map((ingredient, index) => (
                      <span key={`workspace-${ingredient.name}-${index}`} className={ingredientTagClass(ingredient.kind)}>
                        {ingredient.name}
                      </span>
                    ))}
                  </div>
                )}
              </section>
              <section className="lab-v2-assist-card">
                <div className="standard-panel-head">
                  <h3>Quick Add Results</h3>
                  <span className="hint small">Add directly into the active recipe.</span>
                </div>
                {beverage === 'cider' && (
                  <div className="lab-v2-cider-quick">
                    <div className="standard-panel-head">
                      <h4>Cider Fast Adds</h4>
                      <span className="hint small">Repeat clicks merge quantities.</span>
                    </div>
                    <div className="lab-v2-card-tags">
                      {ciderQuickAddIngredients().map((ingredient) => (
                        <button
                          key={`workspace-cider-fast-${ingredient.name}`}
                          type="button"
                          className={ingredientTagClass(ingredient.kind)}
                          onClick={() => upsertManualIngredient(ingredient, 'Cider fast add')}
                          title={`Add ${ingredient.name}`}
                        >
                          + {ingredient.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="lab-v2-card-tags">
                  {quickPickerRows.slice(0, 10).map((item) => {
                    const ingredient = ingredientFromCatalog(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={ingredientTagClass(ingredient.kind)}
                        onClick={() => addFromCatalog(item)}
                        title={`Add ${item.name}`}
                      >
                        + {item.name}
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="lab-v2-assist-card">
                <div className="standard-panel-head">
                  <h3>Suggested Ingredient Families</h3>
                  <span className="hint small">Based on the current dynamic note selections.</span>
                </div>
                <div className="lab-v2-catalog-columns">
                  {dynamicCatalogSuggestions.map((group) => (
                    <section key={group.type}>
                      <h4>{group.type.toUpperCase()}</h4>
                      <div className="lab-v2-card-tags">
                        {group.items.map((item) => {
                          const ingredient = ingredientFromCatalog(item);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={ingredientTagClass(ingredient.kind)}
                              onClick={() => addFromCatalog(item)}
                            >
                              + {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            </div>

            <div className="standard-panel-head">
              <h3>Ingredient Editor</h3>
              <span className="hint small">Edit exact specs, timings, and inventory fit for the working formula.</span>
            </div>
            <div className="manual-table-wrap">
              <table className="manual-table manual-table--compact">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Unit</th>
                    <th>Spec</th>
                    <th>Timing</th>
                    <th>Stock / Issue</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManualRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="hint">
                        {activeIngredientLane === 'all'
                          ? 'No manual ingredients yet. Use Dynamic suggestions or add rows.'
                          : `No ${activeIngredientLane} entries yet. Add one or change the ingredient focus.`}
                      </td>
                    </tr>
                  )}
                  {filteredManualRows.map(({ entry, index }) => {
                    const stock = stockByIndex.get(index);
                    const issues = manualRowIssues.get(index) ?? [];
                    return (
                      <tr key={`manual-${index}`}>
                        <td>
                          <select value={entry.kind} onChange={(event) => updateManualIngredient(index, 'kind', event.target.value)}>
                            <option value="fermentable">Fermentable</option>
                            <option value="hop">Hop</option>
                            <option value="yeast">Yeast</option>
                            <option value="adjunct">Adjunct</option>
                            <option value="other">Other</option>
                          </select>
                        </td>
                        <td>
                          <input value={entry.name} onChange={(event) => updateManualIngredient(index, 'name', event.target.value)} />
                        </td>
                        <td>
                          <input
                            type="number"
                            step={0.1}
                            value={entry.amount}
                            onChange={(event) => updateManualIngredient(index, 'amount', event.target.value)}
                          />
                        </td>
                        <td>
                          <input value={entry.unit} onChange={(event) => updateManualIngredient(index, 'unit', event.target.value)} />
                        </td>
                        <td>
                          {entry.kind === 'fermentable' ? (
                            <div className="lab-v2-inline-fields">
                              <input
                                type="number"
                                step={0.1}
                                value={entry.ppg ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'ppg', event.target.value)}
                                placeholder="PPG"
                              />
                              <input
                                type="number"
                                step={0.1}
                                value={entry.color_srm ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'color_srm', event.target.value)}
                                placeholder="SRM"
                              />
                            </div>
                          ) : entry.kind === 'hop' ? (
                            <input
                              type="number"
                              step={0.1}
                              value={entry.aa_pct ?? ''}
                              onChange={(event) => updateManualIngredient(index, 'aa_pct', event.target.value)}
                              placeholder="AA%"
                            />
                          ) : (
                            <span className="hint small">n/a</span>
                          )}
                        </td>
                        <td>
                          {entry.kind === 'hop' ? (
                            <div className="lab-v2-inline-fields">
                              <select
                                value={entry.timing ?? 'boil'}
                                onChange={(event) => updateManualIngredient(index, 'timing', event.target.value)}
                              >
                                <option value="boil">Boil</option>
                                <option value="whirlpool">Whirlpool</option>
                                <option value="ferment">Ferment</option>
                              </select>
                              <input
                                type="number"
                                step={1}
                                value={entry.time_min ?? ''}
                                onChange={(event) => updateManualIngredient(index, 'time_min', event.target.value)}
                                placeholder="min"
                              />
                            </div>
                          ) : (
                            <span className="hint small">n/a</span>
                          )}
                        </td>
                        <td>
                          <div className="stock-cell">
                            <span className={`stock-badge stock-badge--${stock?.state ?? 'custom'}`}>
                              {stock?.state === 'in'
                                ? 'In'
                                : stock?.state === 'low'
                                  ? 'Low'
                                  : stock?.state === 'out'
                                    ? 'Out'
                                    : 'Custom'}
                            </span>
                            <small className="stock-detail">{stock?.detail ?? 'No stock data'}</small>
                            {issues.length > 0 && (
                              <small className="stock-detail stock-detail--warn">
                                {issues[0]}
                                {issues.length > 1 ? ` +${issues.length - 1}` : ''}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <button type="button" className="button button-muted" onClick={() => removeManualIngredient(index)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <article id="builder-process" className="card">
            <div className="standard-panel-head">
              <h2>{processSectionTitle}</h2>
              <span className="hint small">{processSectionHint}</span>
            </div>
            <ul className="process-summary-list">
              <li>
                <span>{beverage === 'beer' ? 'Brewhouse Steps' : 'Cellar Prep Steps'}</span>
                <strong>{mashSteps.length}</strong>
              </li>
              <li>
                <span>Fermentation Stages</span>
                <strong>{fermentationSteps.length}</strong>
              </li>
              <li>
                <span>{beverage === 'beer' ? 'Hop Events' : 'Specialty Additions'}</span>
                <strong>
                  {beverage === 'beer'
                    ? currentIngredients.filter((entry) => entry.kind === 'hop').length
                    : currentIngredients.filter((entry) => entry.kind === 'adjunct' || entry.kind === 'other').length}
                </strong>
              </li>
            </ul>
            <div className="lab-v2-process-timeline">
              <div className="standard-panel-head">
                <h3>Process Timeline</h3>
                <span className="hint small">Quick read of the projected recipe schedule.</span>
              </div>
              {processTimelineRows.length === 0 ? (
                <p className="hint small">No process schedule yet.</p>
              ) : (
                <ul className="timeline-list">
                  {processTimelineRows.map((row) => (
                    <li key={row.key} className="timeline-row">
                      <span className="timeline-phase">{row.phase}</span>
                      <span className="timeline-when">{row.when}</span>
                      <strong className="timeline-action">{row.action}</strong>
                      <span className="timeline-detail">{row.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="process-grid">
              <article className="process-card">
                <div className="process-card-head">
                  <h4>{beverage === 'beer' ? 'Mash + Boil' : 'Preparation + Additions'}</h4>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() =>
                      setMashSteps((current) => [
                        ...current,
                        {
                          order_index: current.length,
                          name: beverage === 'beer' ? 'New Step' : 'Cellar Step',
                          temp_c: beverage === 'beer' ? 66 : 15,
                          duration_min: beverage === 'beer' ? 15 : 20,
                        },
                      ])
                    }
                  >
                    + {beverage === 'beer' ? 'Step' : 'Cellar Step'}
                  </button>
                </div>
                <div className="manual-table-wrap">
                  <table className="manual-table manual-table--compact">
                    <thead>
                      <tr>
                        <th>{beverage === 'beer' ? 'Step' : 'Operation'}</th>
                        <th>Temp C</th>
                        <th>Min</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mashSteps.map((step, index) => (
                        <tr key={`mash-${index}`}>
                          <td>
                            <input
                              value={step.name}
                              onChange={(event) =>
                                setMashSteps((current) =>
                                  normalizeMashSteps(
                                    current.map((entry, row) =>
                                      row === index ? { ...entry, name: event.target.value } : entry
                                    )
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step={0.1}
                              value={step.temp_c}
                              onChange={(event) =>
                                setMashSteps((current) =>
                                  normalizeMashSteps(
                                    current.map((entry, row) =>
                                      row === index
                                        ? { ...entry, temp_c: Number(event.target.value) || entry.temp_c }
                                        : entry
                                    )
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step={1}
                              value={step.duration_min}
                              onChange={(event) =>
                                setMashSteps((current) =>
                                  normalizeMashSteps(
                                    current.map((entry, row) =>
                                      row === index
                                        ? { ...entry, duration_min: Number(event.target.value) || entry.duration_min }
                                        : entry
                                    )
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="button button-muted"
                              onClick={() =>
                                setMashSteps((current) => normalizeMashSteps(current.filter((_, row) => row !== index)))
                              }
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
                <div className="process-card-head">
                  <h4>Fermentation</h4>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() =>
                      setFermentationSteps((current) => [
                        ...current,
                        {
                          order_index: current.length,
                          stage: 'secondary',
                          temp_c: 16,
                          duration_days: 3,
                        },
                      ])
                    }
                  >
                    + Stage
                  </button>
                </div>
                <div className="manual-table-wrap">
                  <table className="manual-table manual-table--compact">
                    <thead>
                      <tr>
                        <th>Stage</th>
                        <th>Temp C</th>
                        <th>Days</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fermentationSteps.map((step, index) => (
                        <tr key={`ferm-${index}`}>
                          <td>
                            <select
                              value={step.stage}
                              onChange={(event) =>
                                setFermentationSteps((current) =>
                                  normalizeFermentationSteps(
                                    current.map((entry, row) =>
                                      row === index
                                        ? { ...entry, stage: event.target.value as FermentationStep['stage'] }
                                        : entry
                                    )
                                  )
                                )
                              }
                            >
                              <option value="primary">Primary</option>
                              <option value="secondary">Secondary</option>
                              <option value="conditioning">Conditioning</option>
                              <option value="cold_crash">Cold Crash</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              step={0.1}
                              value={step.temp_c}
                              onChange={(event) =>
                                setFermentationSteps((current) =>
                                  normalizeFermentationSteps(
                                    current.map((entry, row) =>
                                      row === index
                                        ? { ...entry, temp_c: Number(event.target.value) || entry.temp_c }
                                        : entry
                                    )
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step={1}
                              value={step.duration_days}
                              onChange={(event) =>
                                setFermentationSteps((current) =>
                                  normalizeFermentationSteps(
                                    current.map((entry, row) =>
                                      row === index
                                        ? { ...entry, duration_days: Number(event.target.value) || entry.duration_days }
                                        : entry
                                    )
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="button button-muted"
                              onClick={() =>
                                setFermentationSteps((current) =>
                                  normalizeFermentationSteps(current.filter((_, row) => row !== index))
                                )
                              }
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
            </div>
          </article>

          <article className="card merge-delta-card">
            <div className="standard-panel-head">
              <h2>Dynamic vs Manual Delta</h2>
              <div className="button-row-inline">
                <button type="button" className="button button-muted" onClick={applyDynamicSuggestionSet}>
                  Apply Dynamic Suggestion Set
                </button>
                <button type="button" className="button button-muted" onClick={keepManualOverrides}>
                  Keep Manual Overrides
                </button>
              </div>
            </div>
            <div className="status-grid merge-delta-grid">
              <div className="status-chip">Changed {deltaSummary.changed}</div>
              <div className="status-chip">Dynamic-only {deltaSummary.dynamicOnly}</div>
              <div className="status-chip">Manual-only {deltaSummary.manualOnly}</div>
              <div className="status-chip">Matched {deltaSummary.matched}</div>
            </div>
            {ingredientDeltaRows.length === 0 ? (
              <p className="hint small">No deltas yet.</p>
            ) : (
              <ul className="summary-shortages">
                {ingredientDeltaRows.slice(0, 10).map((row) => (
                  <li key={row.key}>
                    <span>{row.name}</span>
                    <strong>{row.detail}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <aside className="lab-v2-rail">
          <article id="builder-validation" className="card lab-v2-action-card">
            <div className="standard-panel-head">
              <h3>Save + Handoff</h3>
              <span className={`lab-v2-readiness-pill ${blockerCount > 0 ? 'lab-v2-readiness-pill--blocked' : ''}`}>
                {readinessLabel}
              </span>
            </div>
            <div className="button-row">
              <button type="button" className="button" onClick={() => saveCurrentDraft(false)}>
                {activeRecipeId ? 'Update Draft' : 'Save Draft'}
              </button>
              <button type="button" className="button button-muted" onClick={() => saveCurrentDraft(true)}>
                Save + Exports
              </button>
            </div>
            <p className="status">{status || 'Author in LAB, then hand off through exports into OS.'}</p>
          </article>

          {beverage === 'cider' && (
            <article className="card standard-summary-card lab-v2-compliance-card">
              <div className="standard-panel-head">
                <h3>Cider Compliance Lens</h3>
                <span
                  className={`lab-v2-readiness-pill ${
                    ciderCompliance && !ciderCompliance.hardCiderEligible ? 'lab-v2-readiness-pill--blocked' : ''
                  }`}
                >
                  {ciderCompliance
                    ? ciderCompliance.hardCiderEligible
                      ? 'Hard Cider Track'
                      : 'Classification Review'
                    : 'Needs Prediction'}
                </span>
              </div>
              <div className="lab-v2-compliance-controls">
                <label>
                  Carbonation
                  <select
                    value={ciderCarbonationMode}
                    onChange={(event) => setCiderCarbonationMode(event.target.value as CiderCarbonationMode)}
                  >
                    <option value="unknown">Confirm Later</option>
                    <option value="still">Still</option>
                    <option value="effervescent">Effervescent / Carbonated</option>
                  </select>
                </label>
                <label>
                  Carbonation Target
                  <div className="batch-size-row">
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={ciderCarbonationTargetVols}
                      onChange={(event) => {
                        const numeric = Number(event.target.value);
                        if (!Number.isFinite(numeric) || numeric < 0) return;
                        setCiderCarbonationTargetVols(round(numeric, 1));
                      }}
                    />
                    <span className="lab-v2-inline-unit">vols CO2</span>
                  </div>
                </label>
                <label className="lab-v2-compliance-toggle">
                  <span>Interstate Sale Planned</span>
                  <input
                    type="checkbox"
                    checked={interstateSalePlanned}
                    onChange={(event) => setInterstateSalePlanned(event.target.checked)}
                  />
                </label>
              </div>
              {!ciderCompliance ? (
                <p className="hint small">
                  Add enough recipe detail to calculate projected ABV, then LAB can classify the draft and prepare the
                  export snapshot for OS.
                </p>
              ) : (
                <>
                  <div className="summary-metrics">
                    <div>
                      <span>Tax Class</span>
                      <strong>{ciderCompliance.taxClass.replaceAll('_', ' ')}</strong>
                    </div>
                    <div>
                      <span>Label Path</span>
                      <strong>{ciderCompliance.labelingAuthority.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span>COLA</span>
                      <strong>{ciderCompliance.colaRequired ? 'Plan Required' : 'Not Triggered'}</strong>
                    </div>
                    <div>
                      <span>Formula Review</span>
                      <strong>{ciderCompliance.formulaReviewRequired ? 'Likely Required' : 'Not Flagged'}</strong>
                    </div>
                    <div>
                      <span>Carb Target</span>
                      <strong>{ciderCarbonationTargetVols.toFixed(1)} vols</strong>
                    </div>
                  </div>
                  <p className="hint small">
                    Product path: {ciderCompliance.classDesignation} · projected ABV {ciderCompliance.inferredAbv.toFixed(2)}%
                  </p>
                  {ciderCompliance.reasons.length > 0 && (
                    <p className="hint small">Classification reasons: {ciderCompliance.reasons.join(' ')}</p>
                  )}
                  <ul className="summary-shortages">
                    {ciderCompliance.findings.map((finding, index) => (
                      <li key={`cider-finding-${index}`} className={`lab-v2-compliance-item lab-v2-compliance-item--${finding.severity}`}>
                        <span>{finding.severity.toUpperCase()}</span>
                        <strong>{finding.title}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="hint small">
                    Hop checks are currently conservative review warnings until we wire a fuller TTB cider rule matrix.
                  </p>
                </>
              )}
            </article>
          )}

          <article className="card standard-summary-card">
            <div className="standard-panel-head">
              <h3>Prediction + Fit</h3>
              <span className="hint small">Projected formula outcome against current targets.</span>
            </div>
            {!prediction ? (
              <p className="hint small">Need ingredients to calculate projections.</p>
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
                <p className="hint small">Calculated from recipe inputs, not live sensor readings.</p>
                {predictionLane && (
                  <ul className="summary-list lab-v2-fit-list">
                    <li>
                      <span>ABV Fit</span>
                      <strong>
                        {predictionLane.abv.predicted.toFixed(2)} ({predictionLane.abv.delta > 0 ? '+' : ''}{predictionLane.abv.delta})
                      </strong>
                    </li>
                    <li>
                      <span>IBU Fit</span>
                      <strong>
                        {predictionLane.ibu.predicted.toFixed(1)} ({predictionLane.ibu.delta > 0 ? '+' : ''}{predictionLane.ibu.delta})
                      </strong>
                    </li>
                    <li>
                      <span>SRM Fit</span>
                      <strong>
                        {predictionLane.srm.predicted.toFixed(1)} ({predictionLane.srm.delta > 0 ? '+' : ''}{predictionLane.srm.delta})
                      </strong>
                    </li>
                  </ul>
                )}
              </>
            )}
          </article>

          <article className="card validation-card">
            <div className="standard-panel-head">
              <h3>Recipe Validity Gate</h3>
              <div className="lab-v2-pill-row">
                <span className="status-chip">Blockers {validation.blockers.length}</span>
                <span className="status-chip">Warnings {validation.warnings.length}</span>
              </div>
            </div>
            {validation.blockers.length === 0 ? (
              <p className="hint small">No blockers.</p>
            ) : (
              <ul className="summary-shortages">
                {validation.blockers.map((item, index) => (
                  <li key={`block-${index}`}>
                    <span>Blocker</span>
                    <strong>{item}</strong>
                  </li>
                ))}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul className="summary-shortages">
                {validation.warnings.slice(0, 6).map((item, index) => (
                  <li key={`warn-${index}`}>
                    <span>Warning</span>
                    <strong>{item}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card">
            <h3>Dynamic Proposal Copy Lane</h3>
            <p className="hint small">Use this when you want manual authority but want to pull in dynamic recommendations selectively.</p>
            {dynamicIngredients.length > 0 ? (
              <ul className="summary-shortages">
                {dynamicIngredients.slice(0, 8).map((item, index) => (
                  <li key={`dyn-${item.name}-${index}`}>
                    <span>
                      {item.name} ({round(Number(item.amount ?? 0), 2)} {item.unit})
                    </span>
                    <button
                      type="button"
                      className="button button-muted"
                      onClick={() => addFromDynamic(item)}
                    >
                      Copy
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint small">Select dynamic notes first to populate recommendation rows.</p>
            )}
          </article>
        </aside>
        </div>
      </LabBuilderV2Frame>
    </>
  );
}
