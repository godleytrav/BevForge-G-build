import type {
  FermentationStep,
  LabComplianceProfile,
  MashStep,
  ProposalIngredient,
  SavedLabRecipe,
} from './lab-types';

export type RequirementCategory =
  | 'yeast'
  | 'malt'
  | 'hops'
  | 'fruit'
  | 'packaging'
  | 'equipment'
  | 'other';

export interface LabRequirement {
  name: string;
  category: RequirementCategory;
  requiredQty?: number;
  unit?: string;
}

type StepCommand = 'on_off' | 'open_close' | 'route' | 'set_value' | 'trigger';

type ComplianceProfilePatch = Partial<Omit<LabComplianceProfile, 'jurisdiction' | 'ttb' | 'abc' | 'cola'>> & {
  jurisdiction?: Partial<LabComplianceProfile['jurisdiction']>;
  ttb?: Partial<LabComplianceProfile['ttb']>;
  abc?: Partial<LabComplianceProfile['abc']>;
  cola?: Partial<LabComplianceProfile['cola']>;
};

export interface BevForgeStep {
  id: string;
  name: string;
  stage?: string;
  action?: string;
  triggerWhen?: string;
  duration_min?: number;
  duration_days?: number;
  target_c?: number;
  targetDeviceId?: string;
  command?: StepCommand;
  value?: string | number | boolean;
  requiresUserConfirm?: boolean;
  autoProceed?: boolean;
}

export interface BevForgeContractStep {
  id: string;
  type: string;
  params?: Record<string, unknown>;
  dependsOn?: string[];
}

export interface BevForgeMetadata {
  source: string;
  exportedAt: string;
  version: string;
  mode?: string;
  styleKey?: string;
  beverage?: string;
  process: {
    beverage?: string;
    style: string;
    batch_size_l: number;
    efficiency_pct?: number;
    targets?: Record<string, { min: number; max: number }>;
    boil: {
      duration_min: number;
    };
    mash_steps: Array<{
      name: string;
      target_c: number;
      duration_min: number;
    }>;
    fermentation: {
      duration_days: number;
      target_c: number;
    };
    water_bias?: string;
  };
  ingredients?: {
    malts: Array<{
      name: string;
      amount: number;
      unit: string;
      amount_kg?: number;
      ppg?: number;
      color_srm?: number;
    }>;
    hops: Array<{
      name: string;
      amount: number;
      unit: string;
      amount_g?: number;
      aa_pct?: number;
      timing?: string;
      time_min?: number;
      day_offset?: number;
    }>;
    yeast: Array<{
      name: string;
      amount: number;
      unit: string;
      packs?: number;
    }>;
    adjuncts: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  requirements: LabRequirement[];
  actions: BevForgeStep[];
  triggers: Array<{
    id: string;
    action_id: string;
    when: string;
  }>;
  compliance_profile: LabComplianceProfile;
  recipe_compliance_snapshot: RecipeComplianceSnapshot;
  hardware_prep: {
    expected_vessels: string[];
    expected_heat_source: string;
  };
}

export interface BevForgePayload {
  schemaVersion: string;
  id: string;
  name: string;
  version: string;
  description?: string;
  steps: BevForgeContractStep[];
  metadata?: BevForgeMetadata & Record<string, unknown>;
}

export interface SavedRecipeExportOverrides {
  name?: string;
  style?: string;
  batchSizeLiters?: number;
  boilMinutes?: number;
  mashTempC?: number;
  mashDurationMin?: number;
  fermentationTempC?: number;
  fermentationDays?: number;
  requirements?: LabRequirement[];
  complianceProfile?: ComplianceProfilePatch;
}

export interface BevForgeDryRunSummary {
  stepCount: number;
  requirementCount: number;
  manualConfirmCount: number;
  autoProceedCount: number;
  stageCounts: Record<string, number>;
  requirementCategoryCounts: Record<RequirementCategory, number>;
  compliancePublishable: boolean;
  complianceMissingCount: number;
  revision: string;
}

export interface CompliancePublishableStatus {
  publishable: boolean;
  missingFields: string[];
}

export interface BevForgeDryRun {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: BevForgeDryRunSummary;
  publishable: CompliancePublishableStatus;
}

export interface LabDraft {
  name: string;
  style: string;
  batchSizeLiters: number;
  boilMinutes: number;
  mashTempC: number;
  mashDurationMin: number;
  fermentationTempC: number;
  fermentationDays: number;
  requirements: LabRequirement[];
}

export interface RecipeComplianceSnapshot {
  schemaVersion: string;
  id: string;
  revision: string;
  immutable: true;
  generatedAt: string;
  recipe: {
    schemaVersion: string;
    id: string;
    name: string;
    version: string;
  };
  compliance: {
    schemaVersion: string;
    id: string;
  };
}

const LAB_EXPORT_SCHEMA_VERSION = '0.2.0';
const LAB_EXPORT_VERSION = '0.2.0';
const LAB_COMPLIANCE_SCHEMA_VERSION = '0.1.0';
const LAB_RECIPE_COMPLIANCE_SCHEMA_VERSION = '0.1.0';

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const round = (value: number, digits = 3): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const trimOrFallback = (value: unknown, fallback = ''): string => {
  const next = String(value ?? '').trim();
  return next || fallback;
};

const stableJsonStringify = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableJsonStringify(entry)).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJsonStringify(entry)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value));
};

const hashRevision = (input: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const buildDefaultComplianceProfile = (params: {
  recipeId?: string;
  recipeName: string;
  style: string;
}): LabComplianceProfile => {
  const recipeSlug = slugify(params.recipeId || params.recipeName) || 'recipe';
  return {
    schemaVersion: LAB_COMPLIANCE_SCHEMA_VERSION,
    id: `compliance-${recipeSlug}`,
    profileName: `${trimOrFallback(params.recipeName, 'Recipe')} Compliance`,
    jurisdiction: {
      countryCode: 'US',
      regionCode: '',
      agency: 'TTB',
      permitId: '',
    },
    ttb: {
      brewerNoticeNumber: '',
      formulaCode: '',
      taxClass: '',
      processType: 'Malt Beverage',
    },
    abc: {
      stateCode: '',
      licenseNumber: '',
      productCategory: 'Beer',
    },
    cola: {
      required: true,
      colaRegistryNumber: '',
      brandName: trimOrFallback(params.recipeName, 'New Recipe'),
      classDesignation: trimOrFallback(params.style),
      labelerName: '',
    },
    notes: '',
  };
};

const normalizeComplianceProfile = (
  patch: ComplianceProfilePatch | undefined,
  params: {
    recipeId?: string;
    recipeName: string;
    style: string;
  }
): LabComplianceProfile => {
  const base = buildDefaultComplianceProfile(params);
  if (!patch) return base;

  const colaRequired =
    patch.cola?.required === undefined
      ? base.cola.required
      : Boolean(patch.cola.required);

  const merged: LabComplianceProfile = {
    ...base,
    schemaVersion: trimOrFallback(patch.schemaVersion, base.schemaVersion),
    id: trimOrFallback(patch.id, base.id),
    profileName: trimOrFallback(patch.profileName, base.profileName),
    jurisdiction: {
      countryCode: trimOrFallback(patch.jurisdiction?.countryCode, base.jurisdiction.countryCode),
      regionCode: trimOrFallback(patch.jurisdiction?.regionCode, base.jurisdiction.regionCode),
      agency: trimOrFallback(patch.jurisdiction?.agency, base.jurisdiction.agency),
      permitId: trimOrFallback(patch.jurisdiction?.permitId, base.jurisdiction.permitId),
    },
    ttb: {
      brewerNoticeNumber: trimOrFallback(patch.ttb?.brewerNoticeNumber, base.ttb.brewerNoticeNumber),
      formulaCode: trimOrFallback(patch.ttb?.formulaCode, base.ttb.formulaCode),
      taxClass: trimOrFallback(patch.ttb?.taxClass, base.ttb.taxClass),
      processType: trimOrFallback(patch.ttb?.processType, base.ttb.processType),
    },
    abc: {
      stateCode: trimOrFallback(patch.abc?.stateCode, base.abc.stateCode),
      licenseNumber: trimOrFallback(patch.abc?.licenseNumber, base.abc.licenseNumber),
      productCategory: trimOrFallback(patch.abc?.productCategory, base.abc.productCategory),
    },
    cola: {
      required: colaRequired,
      colaRegistryNumber: trimOrFallback(
        patch.cola?.colaRegistryNumber,
        base.cola.colaRegistryNumber
      ),
      brandName: trimOrFallback(patch.cola?.brandName, base.cola.brandName),
      classDesignation: trimOrFallback(patch.cola?.classDesignation, base.cola.classDesignation),
      labelerName: trimOrFallback(patch.cola?.labelerName, base.cola.labelerName),
    },
    notes: trimOrFallback(patch.notes, base.notes),
  };

  return merged;
};

const evaluateComplianceProfilePublishable = (
  profile: LabComplianceProfile | undefined
): CompliancePublishableStatus => {
  if (!profile) {
    return {
      publishable: false,
      missingFields: ['Compliance profile is missing.'],
    };
  }

  const missingFields: string[] = [];
  const requireText = (label: string, value: unknown) => {
    if (!String(value ?? '').trim()) {
      missingFields.push(label);
    }
  };

  requireText('Compliance profile id', profile.id);
  requireText('Compliance profile schemaVersion', profile.schemaVersion);
  requireText('Jurisdiction country code', profile.jurisdiction.countryCode);
  requireText('Jurisdiction region code', profile.jurisdiction.regionCode);
  requireText('Jurisdiction agency', profile.jurisdiction.agency);

  requireText('TTB brewer notice number', profile.ttb.brewerNoticeNumber);
  requireText('TTB formula code', profile.ttb.formulaCode);
  requireText('TTB tax class', profile.ttb.taxClass);
  requireText('TTB process type', profile.ttb.processType);

  requireText('ABC state code', profile.abc.stateCode);
  requireText('ABC license number', profile.abc.licenseNumber);
  requireText('ABC product category', profile.abc.productCategory);

  requireText('COLA brand name', profile.cola.brandName);
  requireText('COLA class designation', profile.cola.classDesignation);
  requireText('COLA labeler name', profile.cola.labelerName);
  if (profile.cola.required) {
    requireText('COLA registry number', profile.cola.colaRegistryNumber);
  }

  return {
    publishable: missingFields.length === 0,
    missingFields,
  };
};

const normalizeUnit = (value: string | undefined): string => (value ?? '').trim().toLowerCase();

const isPackUnit = (value: string | undefined): boolean => {
  const normalized = normalizeUnit(value);
  return (
    normalized === 'pack' ||
    normalized === 'packs' ||
    normalized === 'pkg' ||
    normalized === 'pk' ||
    normalized === 'package' ||
    normalized === 'packages'
  );
};

const toKg = (amount: number, unit: string): number | undefined => {
  const normalized = normalizeUnit(unit);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount;
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount / 1000;
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') {
    return amount * 0.45359237;
  }
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') {
    return amount * 0.028349523125;
  }
  return undefined;
};

const toG = (amount: number, unit: string): number | undefined => {
  const normalized = normalizeUnit(unit);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount;
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount * 1000;
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') {
    return amount * 453.59237;
  }
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') {
    return amount * 28.349523125;
  }
  return undefined;
};

const daysToMinutes = (days: number | undefined): number | undefined => {
  if (!Number.isFinite(days as number)) return undefined;
  const value = Number(days);
  if (value <= 0) return undefined;
  return round(value * 24 * 60, 2);
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
};

const readNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const readBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
};

const compactObject = <T extends Record<string, unknown>>(value: T): T => {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
  return Object.fromEntries(entries) as T;
};

const createStepIdFactory = () => {
  const seen = new Set<string>();
  return (seed: string, fallback: string): string => {
    const base = slugify(seed) || fallback;
    if (!seen.has(base)) {
      seen.add(base);
      return base;
    }
    let counter = 2;
    let candidate = `${base}-${counter}`;
    while (seen.has(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }
    seen.add(candidate);
    return candidate;
  };
};

const isFruitOrCiderIngredient = (ingredient: ProposalIngredient): boolean =>
  /(apple|pear|juice|must|cider|perry|puree|purée|fruit|berry|blackberry|raspberry|blueberry|cherry|peach)/i.test(
    ingredient.name
  );

const ingredientToRequirementCategory = (
  ingredient: ProposalIngredient
): RequirementCategory => {
  if (isFruitOrCiderIngredient(ingredient)) return 'fruit';
  if (ingredient.kind === 'fermentable') return 'malt';
  if (ingredient.kind === 'hop') return 'hops';
  if (ingredient.kind === 'yeast') return 'yeast';
  return 'other';
};

const requirementSortOrder: Record<RequirementCategory, number> = {
  malt: 0,
  hops: 1,
  yeast: 2,
  fruit: 3,
  packaging: 4,
  equipment: 5,
  other: 6,
};

const xmlEscape = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const buildFallbackMashSteps = (draft: LabDraft): MashStep[] => [
  {
    order_index: 0,
    name: 'Main Saccharification',
    temp_c: draft.mashTempC,
    duration_min: draft.mashDurationMin,
  },
  {
    order_index: 1,
    name: 'Boil',
    temp_c: 100,
    duration_min: draft.boilMinutes,
  },
];

const buildFallbackFermentationSteps = (draft: LabDraft): FermentationStep[] => [
  {
    order_index: 0,
    stage: 'primary',
    temp_c: draft.fermentationTempC,
    duration_days: draft.fermentationDays,
  },
];

const stageFromMashStepName = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes('juice') || normalized.includes('must') || normalized.includes('transfer')) return 'cellar_preparation';
  if (normalized.includes('nutrient') || normalized.includes('enzyme')) return 'ingredient_addition';
  if (normalized.includes('boil')) return 'boil';
  if (normalized.includes('sparge')) return 'sparge';
  if (normalized.includes('whirlpool') || normalized.includes('steep')) return 'whirlpool';
  return 'mash';
};

const actionFromMashStepName = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes('juice') || normalized.includes('must') || normalized.includes('transfer')) return 'transfer';
  if (normalized.includes('nutrient') || normalized.includes('enzyme')) return 'additive_add';
  if (normalized.includes('boil')) return 'boil';
  if (normalized.includes('sparge')) return 'sparge';
  if (normalized.includes('whirlpool') || normalized.includes('steep')) return 'whirlpool_hold';
  return 'hold_temp';
};

const normalizeRequirements = (requirements: LabRequirement[]): LabRequirement[] => {
  const deduped = new Map<string, LabRequirement>();

  requirements.forEach((requirement) => {
    const name = String(requirement.name ?? '').trim();
    if (!name) return;
    const category = requirement.category;
    const key = `${category}:${name.toLowerCase()}`;
    const qty = Number(requirement.requiredQty);
    const unit = requirement.unit?.trim();
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, {
        name,
        category,
        requiredQty: Number.isFinite(qty) && qty > 0 ? round(qty, 4) : undefined,
        unit: unit || undefined,
      });
      return;
    }

    if (Number.isFinite(qty) && qty > 0) {
      existing.requiredQty = round(Number(existing.requiredQty ?? 0) + qty, 4);
    }
    if (!existing.unit && unit) {
      existing.unit = unit;
    }
  });

  return [...deduped.values()].sort((left, right) => {
    const categoryDiff = requirementSortOrder[left.category] - requirementSortOrder[right.category];
    if (categoryDiff !== 0) return categoryDiff;
    return left.name.localeCompare(right.name);
  });
};

const toRequirementsFromIngredients = (ingredients: ProposalIngredient[]): LabRequirement[] =>
  normalizeRequirements(
    ingredients.map((ingredient) => ({
      name: ingredient.name,
      category: ingredientToRequirementCategory(ingredient),
      requiredQty:
        Number.isFinite(Number(ingredient.amount)) && Number(ingredient.amount) > 0
          ? Number(ingredient.amount)
          : undefined,
      unit: ingredient.unit,
    }))
  );

const buildStepsFromRecipe = (
  mashSteps: MashStep[],
  fermentationSteps: FermentationStep[],
  ingredients: ProposalIngredient[]
): BevForgeStep[] => {
  const uniqueStepId = createStepIdFactory();
  const steps: BevForgeStep[] = [];

  mashSteps
    .slice()
    .sort((left, right) => left.order_index - right.order_index)
    .forEach((step, index) => {
      const durationMin = Number(step.duration_min);
      const targetC = Number(step.temp_c);
      steps.push({
        id: uniqueStepId(`mash-${step.name}`, `mash-${index + 1}`),
        name: step.name || `Mash Step ${index + 1}`,
        stage: stageFromMashStepName(step.name),
        action: actionFromMashStepName(step.name),
        duration_min: Number.isFinite(durationMin) && durationMin > 0 ? round(durationMin, 2) : undefined,
        target_c: Number.isFinite(targetC) ? round(targetC, 2) : undefined,
        command: 'set_value',
        value: Number.isFinite(targetC) ? round(targetC, 2) : undefined,
        requiresUserConfirm: false,
        autoProceed: true,
      });
    });

  ingredients
    .filter((ingredient) => ingredient.kind === 'hop')
    .forEach((ingredient, index) => {
      const timing = ingredient.timing ?? 'boil';
      const stage = timing === 'ferment' ? 'fermentation' : timing === 'whirlpool' ? 'whirlpool' : 'boil';
      const triggerWhen =
        timing === 'ferment'
          ? `day:${Math.max(0, Number(ingredient.day_offset ?? 0))}`
          : `${timing}_min_remaining:${Math.max(0, Number(ingredient.time_min ?? 0))}`;

      steps.push({
        id: uniqueStepId(`hop-${timing}-${ingredient.name}`, `hop-${index + 1}`),
        name: `Hop Add: ${ingredient.name}`,
        stage,
        action: timing === 'ferment' ? 'dry_hop_add' : 'hop_add',
        triggerWhen,
        command: 'trigger',
        value: true,
        requiresUserConfirm: true,
        autoProceed: false,
      });
    });

  fermentationSteps
    .slice()
    .sort((left, right) => left.order_index - right.order_index)
    .forEach((step, index) => {
      const durationDays = Number(step.duration_days);
      const targetC = Number(step.temp_c);
      steps.push({
        id: uniqueStepId(`fermentation-${step.stage}`, `fermentation-${index + 1}`),
        name: `Fermentation: ${step.stage.replaceAll('_', ' ')}`,
        stage: 'fermentation',
        action: 'hold_temp',
        duration_days:
          Number.isFinite(durationDays) && durationDays > 0 ? round(durationDays, 3) : undefined,
        duration_min: daysToMinutes(durationDays),
        target_c: Number.isFinite(targetC) ? round(targetC, 2) : undefined,
        command: 'set_value',
        value: Number.isFinite(targetC) ? round(targetC, 2) : undefined,
        requiresUserConfirm: false,
        autoProceed: true,
      });
    });

  if (steps.length === 0) {
    steps.push({
      id: uniqueStepId('brew-day-checkpoint', 'step-1'),
      name: 'Brew Day Checkpoint',
      stage: 'brewhouse',
      action: 'operator_confirm',
      command: 'trigger',
      value: true,
      requiresUserConfirm: true,
      autoProceed: false,
    });
  }

  return steps;
};

const toContractSteps = (steps: BevForgeStep[]): BevForgeContractStep[] =>
  steps.map((step) => {
    const params = compactObject({
      name: step.name,
      stage: step.stage,
      action: step.action,
      triggerWhen: step.triggerWhen,
      duration_min: step.duration_min,
      duration_days: step.duration_days,
      target_c: step.target_c,
      targetDeviceId: step.targetDeviceId,
      command: step.command,
      value: step.value,
      requiresUserConfirm: step.requiresUserConfirm,
      autoProceed: step.autoProceed,
    });

    const contractStep: BevForgeContractStep = {
      id: step.id,
      type: step.action || 'step',
    };

    if (Object.keys(params).length > 0) {
      contractStep.params = params;
    }

    return contractStep;
  });

const contractStepToRuntimeStep = (step: BevForgeContractStep): BevForgeStep => {
  const params = asRecord(step.params) ?? {};
  const action = readString(params.action) ?? readString(step.type) ?? 'step';

  return compactObject({
    id: step.id,
    name: readString(params.name) ?? `Step ${step.id}`,
    stage: readString(params.stage),
    action,
    triggerWhen: readString(params.triggerWhen),
    duration_min: readNumber(params.duration_min),
    duration_days: readNumber(params.duration_days),
    target_c: readNumber(params.target_c),
    targetDeviceId: readString(params.targetDeviceId),
    command: readString(params.command) as StepCommand | undefined,
    value:
      params.value === undefined ||
      typeof params.value === 'string' ||
      typeof params.value === 'number' ||
      typeof params.value === 'boolean'
        ? (params.value as string | number | boolean | undefined)
        : undefined,
    requiresUserConfirm: readBoolean(params.requiresUserConfirm),
    autoProceed: readBoolean(params.autoProceed),
  }) as BevForgeStep;
};

export const payloadRuntimeSteps = (payload: BevForgePayload): BevForgeStep[] => {
  if (!Array.isArray(payload.steps)) return [];
  return payload.steps.map((step) => contractStepToRuntimeStep(step));
};

const toIngredientBuckets = (ingredients: ProposalIngredient[]): NonNullable<BevForgeMetadata['ingredients']> => {
  const malts: NonNullable<BevForgeMetadata['ingredients']>['malts'] = [];
  const hops: NonNullable<BevForgeMetadata['ingredients']>['hops'] = [];
  const yeast: NonNullable<BevForgeMetadata['ingredients']>['yeast'] = [];
  const adjuncts: NonNullable<BevForgeMetadata['ingredients']>['adjuncts'] = [];

  ingredients.forEach((ingredient) => {
    const amount = Number(ingredient.amount);
    const qty = Number.isFinite(amount) && amount > 0 ? round(amount, 4) : 0;
    const unit = ingredient.unit || (ingredient.kind === 'yeast' ? 'pack' : 'kg');

    if (ingredient.kind === 'fermentable' && !isFruitOrCiderIngredient(ingredient)) {
      malts.push(
        compactObject({
          name: ingredient.name,
          amount: qty,
          unit,
          amount_kg: toKg(qty, unit),
          ppg: Number.isFinite(Number(ingredient.ppg)) ? Number(ingredient.ppg) : undefined,
          color_srm: Number.isFinite(Number(ingredient.color_srm))
            ? Number(ingredient.color_srm)
            : undefined,
        })
      );
      return;
    }

    if (ingredient.kind === 'hop') {
      hops.push(
        compactObject({
          name: ingredient.name,
          amount: qty,
          unit,
          amount_g: toG(qty, unit),
          aa_pct: Number.isFinite(Number(ingredient.aa_pct)) ? Number(ingredient.aa_pct) : undefined,
          timing: ingredient.timing,
          time_min: Number.isFinite(Number(ingredient.time_min)) ? Number(ingredient.time_min) : undefined,
          day_offset: Number.isFinite(Number(ingredient.day_offset))
            ? Number(ingredient.day_offset)
            : undefined,
        })
      );
      return;
    }

    if (ingredient.kind === 'yeast') {
      yeast.push(
        compactObject({
          name: ingredient.name,
          amount: qty,
          unit,
          packs: isPackUnit(unit) ? qty : undefined,
        })
      );
      return;
    }

    adjuncts.push({
      name: ingredient.name,
      amount: qty,
      unit,
    });
  });

  return { malts, hops, yeast, adjuncts };
};

const withFallbackDraft = (
  recipe: SavedLabRecipe,
  overrides: SavedRecipeExportOverrides
): LabDraft => ({
  name: overrides.name?.trim() || recipe.name,
  style: overrides.style?.trim() || recipe.style_key || recipe.class_designation?.class_name || 'lab_style',
  batchSizeLiters:
    Number.isFinite(Number(overrides.batchSizeLiters)) && Number(overrides.batchSizeLiters) > 0
      ? Number(overrides.batchSizeLiters)
      : Number(recipe.proposal.batch_size_l || 20),
  boilMinutes:
    Number.isFinite(Number(overrides.boilMinutes)) && Number(overrides.boilMinutes) > 0
      ? Number(overrides.boilMinutes)
      : Number(recipe.mash_steps.find((step) => /boil/i.test(step.name))?.duration_min ?? 60),
  mashTempC:
    Number.isFinite(Number(overrides.mashTempC))
      ? Number(overrides.mashTempC)
      : Number(recipe.mash_steps[0]?.temp_c ?? recipe.proposal.mash_temp_c ?? 66),
  mashDurationMin:
    Number.isFinite(Number(overrides.mashDurationMin)) && Number(overrides.mashDurationMin) > 0
      ? Number(overrides.mashDurationMin)
      : Number(recipe.mash_steps[0]?.duration_min ?? 60),
  fermentationTempC:
    Number.isFinite(Number(overrides.fermentationTempC))
      ? Number(overrides.fermentationTempC)
      : Number(recipe.fermentation_steps[0]?.temp_c ?? 19),
  fermentationDays:
    Number.isFinite(Number(overrides.fermentationDays)) && Number(overrides.fermentationDays) > 0
      ? Number(overrides.fermentationDays)
      : Number(recipe.fermentation_steps[0]?.duration_days ?? 7),
  requirements: [],
});

const buildRecipeComplianceSnapshot = (params: {
  recipeSchemaVersion: string;
  recipeId: string;
  recipeName: string;
  recipeVersion: string;
  contractSteps: BevForgeContractStep[];
  process: BevForgeMetadata['process'];
  ingredients: BevForgeMetadata['ingredients'];
  requirements: LabRequirement[];
  complianceProfile: LabComplianceProfile;
}): RecipeComplianceSnapshot => {
  const revisionSeed = {
    recipe: {
      schemaVersion: params.recipeSchemaVersion,
      id: params.recipeId,
      name: params.recipeName,
      version: params.recipeVersion,
      steps: params.contractSteps,
      process: params.process,
      ingredients: params.ingredients,
      requirements: params.requirements,
    },
    compliance: params.complianceProfile,
  };
  const revision = `rev-${hashRevision(stableJsonStringify(revisionSeed))}`;
  return {
    schemaVersion: LAB_RECIPE_COMPLIANCE_SCHEMA_VERSION,
    id: `${params.recipeId}:compliance-snapshot`,
    revision,
    immutable: true,
    generatedAt: new Date().toISOString(),
    recipe: {
      schemaVersion: params.recipeSchemaVersion,
      id: params.recipeId,
      name: params.recipeName,
      version: params.recipeVersion,
    },
    compliance: {
      schemaVersion: params.complianceProfile.schemaVersion,
      id: params.complianceProfile.id,
    },
  };
};

const buildPayloadFromRuntime = (
  base: Pick<BevForgePayload, 'id' | 'name' | 'description'>,
  metadata: Omit<BevForgeMetadata, 'actions' | 'recipe_compliance_snapshot'>,
  runtimeSteps: BevForgeStep[]
): BevForgePayload => {
  const contractSteps = toContractSteps(runtimeSteps);
  const snapshot = buildRecipeComplianceSnapshot({
    recipeSchemaVersion: LAB_EXPORT_SCHEMA_VERSION,
    recipeId: base.id,
    recipeName: base.name,
    recipeVersion: LAB_EXPORT_VERSION,
    contractSteps,
    process: metadata.process,
    ingredients: metadata.ingredients,
    requirements: metadata.requirements,
    complianceProfile: metadata.compliance_profile,
  });
  return {
    schemaVersion: LAB_EXPORT_SCHEMA_VERSION,
    id: base.id,
    name: base.name,
    description: base.description,
    version: LAB_EXPORT_VERSION,
    steps: contractSteps,
    metadata: {
      ...metadata,
      recipe_compliance_snapshot: snapshot,
      actions: runtimeSteps.map((step) => ({ ...step })),
    },
  };
};

export const requirementsFromIngredients = (ingredients: ProposalIngredient[]): LabRequirement[] =>
  toRequirementsFromIngredients(ingredients);

export const buildDefaultComplianceProfileForDraft = (params: {
  recipeId?: string;
  recipeName: string;
  style: string;
}): LabComplianceProfile => buildDefaultComplianceProfile(params);

export function toBevForgePayload(
  draft: LabDraft,
  options?: {
    complianceProfile?: ComplianceProfilePatch;
  }
): BevForgePayload {
  const mashSteps = buildFallbackMashSteps(draft);
  const fermentationSteps = buildFallbackFermentationSteps(draft);
  const fallbackIngredients: ProposalIngredient[] = draft.requirements.map((requirement) => {
    const categoryToKind: Record<RequirementCategory, ProposalIngredient['kind']> = {
      yeast: 'yeast',
      malt: 'fermentable',
      hops: 'hop',
      fruit: 'adjunct',
      packaging: 'other',
      equipment: 'other',
      other: 'other',
    };
    const kind = categoryToKind[requirement.category] ?? 'other';
    return {
      kind,
      name: requirement.name,
      amount: Number(requirement.requiredQty ?? 0),
      unit: requirement.unit || (kind === 'yeast' ? 'pack' : 'kg'),
    };
  });

  const runtimeSteps = buildStepsFromRecipe(mashSteps, fermentationSteps, fallbackIngredients);
  const requirements = normalizeRequirements(draft.requirements);
  const triggers = [
    {
      id: 'on-boil-complete',
      action_id: runtimeSteps.find((step) => step.stage === 'fermentation')?.id ?? runtimeSteps[0].id,
      when: 'after:boil',
    },
  ];
  const complianceProfile = normalizeComplianceProfile(options?.complianceProfile, {
    recipeName: draft.name,
    style: draft.style,
  });

  return buildPayloadFromRuntime(
    {
      id: makeId('lab-recipe'),
      name: draft.name,
      description: `LAB export for ${draft.style}`,
    },
    {
      source: 'bevforge-lab',
      exportedAt: new Date().toISOString(),
      version: LAB_EXPORT_VERSION,
      process: {
        style: draft.style,
        batch_size_l: draft.batchSizeLiters,
        boil: { duration_min: draft.boilMinutes },
        mash_steps: mashSteps.map((step) => ({
          name: step.name,
          target_c: step.temp_c,
          duration_min: step.duration_min,
        })),
        fermentation: {
          duration_days: draft.fermentationDays,
          target_c: draft.fermentationTempC,
        },
      },
      ingredients: toIngredientBuckets(fallbackIngredients),
      requirements,
      triggers,
      compliance_profile: complianceProfile,
      hardware_prep: {
        expected_vessels: ['mash_tun', 'boil_kettle', 'fermenter'],
        expected_heat_source: 'primary',
      },
    },
    runtimeSteps
  );
}

export function toBevForgePayloadFromSavedRecipe(
  recipe: SavedLabRecipe,
  overrides: SavedRecipeExportOverrides = {}
): BevForgePayload {
  const fallbackDraft = withFallbackDraft(recipe, overrides);
  const sourceIngredients =
    recipe.ingredients.length > 0 ? recipe.ingredients : recipe.manual_ingredients ?? [];
  const sourceRequirements =
    overrides.requirements && overrides.requirements.length > 0
      ? overrides.requirements
      : toRequirementsFromIngredients(sourceIngredients);

  const mashSteps: MashStep[] =
    recipe.mash_steps.length > 0
      ? recipe.mash_steps
      : [
          {
            order_index: 0,
            name: 'Main Saccharification',
            temp_c: fallbackDraft.mashTempC,
            duration_min: fallbackDraft.mashDurationMin,
          },
          {
            order_index: 1,
            name: 'Boil',
            temp_c: 100,
            duration_min: fallbackDraft.boilMinutes,
          },
        ];

  const fermentationSteps: FermentationStep[] =
    recipe.fermentation_steps.length > 0
      ? recipe.fermentation_steps
      : [
          {
            order_index: 0,
            stage: 'primary',
            temp_c: fallbackDraft.fermentationTempC,
            duration_days: fallbackDraft.fermentationDays,
          },
        ];

  const runtimeSteps = buildStepsFromRecipe(mashSteps, fermentationSteps, sourceIngredients);
  const normalizedRequirements = normalizeRequirements(sourceRequirements);
  const boilDuration =
    Number(
      overrides.boilMinutes ??
        mashSteps.find((step) => /boil/i.test(step.name))?.duration_min ??
        fallbackDraft.boilMinutes
    ) || fallbackDraft.boilMinutes;
  const fermentationPrimary =
    fermentationSteps.find((step) => step.stage === 'primary') ?? fermentationSteps[0];
  const fermentationDurationDays =
    Number(overrides.fermentationDays ?? fermentationPrimary?.duration_days ?? fallbackDraft.fermentationDays) ||
    fallbackDraft.fermentationDays;
  const fermentationTargetC =
    Number(overrides.fermentationTempC ?? fermentationPrimary?.temp_c ?? fallbackDraft.fermentationTempC) ||
    fallbackDraft.fermentationTempC;

  const triggers = runtimeSteps
    .filter((step) => step.triggerWhen)
    .map((step, index) => ({
      id: `trigger-${index + 1}`,
      action_id: step.id,
      when: step.triggerWhen || 'manual',
    }));
  const complianceProfile = normalizeComplianceProfile(
    overrides.complianceProfile ?? recipe.compliance_profile,
    {
      recipeId: recipe.id,
      recipeName: fallbackDraft.name,
      style: fallbackDraft.style,
    }
  );

  return buildPayloadFromRuntime(
    {
      id: recipe.id || makeId('lab-recipe'),
      name: fallbackDraft.name,
      description: `LAB ${recipe.mode ?? 'dynamic'} recipe export`,
    },
    {
      source: 'bevforge-lab',
      exportedAt: new Date().toISOString(),
      version: LAB_EXPORT_VERSION,
      mode: recipe.mode,
      styleKey: recipe.style_key,
      beverage: recipe.beverage,
      process: {
        beverage: recipe.beverage,
        style: fallbackDraft.style,
        batch_size_l: fallbackDraft.batchSizeLiters,
        efficiency_pct: Number(recipe.proposal.efficiency_pct ?? 0) || undefined,
        targets: recipe.targets,
        boil: { duration_min: boilDuration },
        mash_steps: mashSteps.map((step) => ({
          name: step.name,
          target_c: Number(step.temp_c),
          duration_min: Number(step.duration_min),
        })),
        fermentation: {
          duration_days: fermentationDurationDays,
          target_c: fermentationTargetC,
        },
        water_bias: recipe.water_bias || recipe.proposal.water_bias,
      },
      ingredients: toIngredientBuckets(sourceIngredients),
      requirements: normalizedRequirements,
      triggers,
      compliance_profile: complianceProfile,
      hardware_prep: {
        expected_vessels: ['mash_tun', 'boil_kettle', 'fermenter'],
        expected_heat_source: 'primary',
      },
    },
    runtimeSteps
  );
}

export function evaluateBevForgePayload(payload: BevForgePayload): BevForgeDryRun {
  const errors: string[] = [];
  const warnings: string[] = [];
  const semverPattern = /^\d+\.\d+\.\d+$/;
  const allowedCategories = new Set<RequirementCategory>([
    'yeast',
    'malt',
    'hops',
    'fruit',
    'packaging',
    'equipment',
    'other',
  ]);

  const allowedTopKeys = new Set(['schemaVersion', 'id', 'name', 'description', 'version', 'steps', 'metadata']);
  Object.keys(payload).forEach((key) => {
    if (!allowedTopKeys.has(key)) {
      errors.push(`Unexpected top-level field "${key}". Use metadata for extensions.`);
    }
  });

  if (!payload.id?.trim()) errors.push('Recipe id is required.');
  if (!payload.name?.trim()) errors.push('Recipe name is required.');
  if (!semverPattern.test(payload.schemaVersion ?? '')) {
    errors.push('schemaVersion must use semver format (e.g., 0.1.0).');
  }
  if (!semverPattern.test(payload.version ?? '')) {
    warnings.push('version should use semver format (e.g., 0.1.0).');
  }

  const metadata = asRecord(payload.metadata);
  if (!metadata) {
    warnings.push('metadata extension block is missing.');
  }

  const process = asRecord(metadata?.process);
  const batchSize = readNumber(process?.batch_size_l);
  if (!Number.isFinite(batchSize) || Number(batchSize) <= 0) {
    errors.push('Process batch size must be a positive number.');
  }
  const processStyle = readString(process?.style) ?? '';

  const steps = payload.steps ?? [];
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push('At least one process step is required.');
  }

  const seenStepIds = new Set<string>();
  steps.forEach((step, index) => {
    if (!step.id?.trim()) {
      errors.push(`Step ${index + 1} is missing an id.`);
    } else if (seenStepIds.has(step.id)) {
      errors.push(`Duplicate step id detected: ${step.id}`);
    } else {
      seenStepIds.add(step.id);
    }

    if (!step.type?.trim()) {
      errors.push(`Step ${step.id || index + 1} is missing type.`);
    }

    const allowedStepKeys = new Set(['id', 'type', 'params', 'dependsOn']);
    Object.keys(step).forEach((key) => {
      if (!allowedStepKeys.has(key)) {
        errors.push(`Step ${step.id || index + 1} has unsupported field "${key}".`);
      }
    });
  });

  const runtimeSteps = payloadRuntimeSteps(payload);
  const stageCounts: Record<string, number> = {};
  let manualConfirmCount = 0;
  let autoProceedCount = 0;

  runtimeSteps.forEach((step, index) => {
    if (!step.name?.trim()) {
      warnings.push(`Step ${index + 1} is missing a display name.`);
    }

    if (step.requiresUserConfirm) manualConfirmCount += 1;
    if (step.autoProceed) autoProceedCount += 1;
    const stage = (step.stage?.trim() || 'unspecified').toLowerCase();
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
  });

  if ((stageCounts.mash ?? 0) === 0) {
    warnings.push('No mash stage step detected.');
  }
  if ((stageCounts.boil ?? 0) === 0) {
    warnings.push('No boil stage step detected.');
  }
  if ((stageCounts.fermentation ?? 0) === 0) {
    warnings.push('No fermentation stage step detected.');
  }

  const metadataRequirements = Array.isArray(metadata?.requirements)
    ? (metadata?.requirements as LabRequirement[])
    : [];
  const requirements = normalizeRequirements(metadataRequirements);
  const categoryCounts: Record<RequirementCategory, number> = {
    yeast: 0,
    malt: 0,
    hops: 0,
    fruit: 0,
    packaging: 0,
    equipment: 0,
    other: 0,
  };

  if (!Array.isArray(metadata?.requirements) || metadataRequirements.length === 0) {
    warnings.push('No requirements included; OS import will work but inventory checks will be limited.');
  }

  requirements.forEach((requirement, index) => {
    if (!requirement.name?.trim()) {
      errors.push(`Requirement ${index + 1} is missing a name.`);
    }
    if (!allowedCategories.has(requirement.category)) {
      errors.push(`Requirement "${requirement.name || index + 1}" has an invalid category.`);
      return;
    }
    categoryCounts[requirement.category] += 1;
    const qty = Number(requirement.requiredQty);
    if (requirement.requiredQty !== undefined && (!Number.isFinite(qty) || qty <= 0)) {
      warnings.push(`Requirement "${requirement.name}" has non-positive quantity.`);
    }
    if (qty > 0 && !String(requirement.unit ?? '').trim()) {
      warnings.push(`Requirement "${requirement.name}" has quantity but no unit.`);
    }
  });

  if (categoryCounts.malt === 0) warnings.push('No malt/fermentable requirements were found.');
  if (categoryCounts.hops === 0) warnings.push('No hop requirements were found.');
  if (categoryCounts.yeast === 0) warnings.push('No yeast requirements were found.');

  const complianceProfileRaw = asRecord(metadata?.compliance_profile);
  const complianceProfile = complianceProfileRaw
    ? normalizeComplianceProfile(complianceProfileRaw as ComplianceProfilePatch, {
        recipeId: payload.id,
        recipeName: payload.name,
        style: processStyle,
      })
    : undefined;
  const publishable = evaluateComplianceProfilePublishable(complianceProfile);
  publishable.missingFields.forEach((field) => {
    errors.push(`Publishable validation: ${field}`);
  });

  const snapshot = asRecord(metadata?.recipe_compliance_snapshot);
  const snapshotRevision = trimOrFallback(snapshot?.revision);
  if (!snapshot || !snapshotRevision) {
    errors.push('Publishable validation: recipe compliance snapshot revision is missing.');
  }
  if (snapshot && snapshot.immutable !== true) {
    errors.push('Publishable validation: recipe compliance snapshot must be immutable.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      stepCount: steps.length,
      requirementCount: requirements.length,
      manualConfirmCount,
      autoProceedCount,
      stageCounts,
      requirementCategoryCounts: categoryCounts,
      compliancePublishable: publishable.publishable,
      complianceMissingCount: publishable.missingFields.length,
      revision: snapshotRevision || 'missing',
    },
    publishable,
  };
}

export function toBeerJsonPayload(draft: LabDraft) {
  return {
    recipe: {
      name: draft.name,
      style: draft.style,
      batch_size_l: draft.batchSizeLiters,
      boil_time_min: draft.boilMinutes,
      mash_temp_c: draft.mashTempC,
      mash_time_min: draft.mashDurationMin,
      fermentation_temp_c: draft.fermentationTempC,
      fermentation_days: draft.fermentationDays,
    },
    ingredients: draft.requirements,
  };
}

export function toBeerXmlPayload(draft: LabDraft): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<RECIPES>\n  <RECIPE>\n    <NAME>${xmlEscape(draft.name)}</NAME>\n    <STYLE>${xmlEscape(draft.style)}</STYLE>\n    <BATCH_SIZE>${draft.batchSizeLiters}</BATCH_SIZE>\n    <BOIL_TIME>${draft.boilMinutes}</BOIL_TIME>\n    <MASH_STEPS>\n      <MASH_STEP>\n        <NAME>Main Saccharification</NAME>\n        <STEP_TEMP>${draft.mashTempC}</STEP_TEMP>\n        <STEP_TIME>${draft.mashDurationMin}</STEP_TIME>\n      </MASH_STEP>\n    </MASH_STEPS>\n    <PRIMARY_TEMP>${draft.fermentationTempC}</PRIMARY_TEMP>\n    <PRIMARY_AGE>${draft.fermentationDays}</PRIMARY_AGE>\n  </RECIPE>\n</RECIPES>`;
}

export function requirementsFromText(input: string): LabRequirement[] {
  const categories: RequirementCategory[] = [
    'yeast',
    'malt',
    'hops',
    'fruit',
    'packaging',
    'equipment',
    'other',
  ];

  const parsed = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameRaw, categoryRaw, qtyRaw, unitRaw] = line.split('|').map((part) => part?.trim());
      const qty = Number(qtyRaw);
      const category = categories.includes((categoryRaw as RequirementCategory) ?? 'other')
        ? (categoryRaw as RequirementCategory)
        : 'other';

      return {
        name: nameRaw || 'Unnamed Requirement',
        category,
        requiredQty: Number.isFinite(qty) && qty > 0 ? qty : undefined,
        unit: unitRaw || undefined,
      } as LabRequirement;
    });

  return normalizeRequirements(parsed);
}
