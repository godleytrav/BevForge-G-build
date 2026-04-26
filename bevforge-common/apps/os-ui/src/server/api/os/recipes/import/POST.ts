import type { Request, Response } from 'express';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import {
  appendImportedRecipe,
  writeRawRecipeFile,
} from '../../../../lib/commissioning-store.js';
import type { ImportedRecipe } from '../../../../../features/canvas/types.js';

type RecipeStep = ImportedRecipe['steps'][number];
type RecipeRequirement = NonNullable<ImportedRecipe['requirements']>[number];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

const makeId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const safeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_');

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const ensureArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const toText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
};

const round1 = (value: number): number =>
  Math.round(value * 10) / 10;

const toCelsius = (fahrenheit: number): number =>
  round1(((fahrenheit - 32) * 5) / 9);

const maybeParseScalar = (
  value: unknown
): string | number | boolean | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const bool = toBoolean(trimmed);
  if (bool !== undefined) return bool;
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) return numeric;
  return trimmed;
};

const addRequirement = (
  target: RecipeRequirement[],
  entry: RecipeRequirement
) => {
  const key = `${entry.category}:${String(entry.name).trim().toLowerCase()}`;
  if (target.some((item) => `${item.category}:${String(item.name).trim().toLowerCase()}` === key)) {
    return;
  }
  target.push(entry);
};

const toStepCommand = (
  value: unknown
): RecipeStep['command'] | undefined => {
  const text = toText(value)?.toLowerCase();
  if (!text) return undefined;
  if (
    text === 'on_off' ||
    text === 'open_close' ||
    text === 'route' ||
    text === 'set_value' ||
    text === 'trigger'
  ) {
    return text;
  }
  if (text.includes('open') || text.includes('close') || text.includes('valve') || text.includes('vent')) {
    return 'open_close';
  }
  if (text.includes('route')) return 'route';
  if (text.includes('set') || text.includes('heat') || text.includes('cool') || text.includes('pressure')) {
    return 'set_value';
  }
  if (
    text.includes('pump') ||
    text.includes('start') ||
    text.includes('stop') ||
    text.includes('relay') ||
    text.includes('chiller') ||
    text.includes('heater')
  ) {
    return 'on_off';
  }
  return 'trigger';
};

const makeActionLabel = (stage: string | undefined, action: string, fallback: string): string => {
  const readableAction = action.replaceAll('_', ' ').trim();
  const readableStage = stage?.replaceAll('_', ' ').trim();
  if (readableStage) {
    return `${readableStage}: ${readableAction || fallback}`;
  }
  return readableAction || fallback;
};

const durationFromAction = (action: any): number | undefined => {
  if (!action || typeof action !== 'object') return undefined;
  const direct = toNumber(action.duration_min ?? action.durationMin ?? action.duration);
  if (direct !== undefined) return direct;
  const days = toNumber(action.duration_days ?? action.durationDays);
  if (days !== undefined) return days * 24 * 60;
  return undefined;
};

const tempFromAction = (action: any): number | undefined => {
  if (!action || typeof action !== 'object') return undefined;
  const targetC = toNumber(
    action.target_c ??
      action.targetC ??
      action.temperature_c ??
      action.temperatureC ??
      action.temp_c ??
      action.tempC
  );
  if (targetC !== undefined) return targetC;
  const targetF = toNumber(action.target_f ?? action.targetF ?? action.temp_f ?? action.tempF);
  if (targetF !== undefined) return toCelsius(targetF);
  return undefined;
};

const normalizeBevForge = (input: any, rawFile: string): ImportedRecipe => {
  const metadata =
    input?.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const legacyMeta =
    input?.meta && typeof input.meta === 'object' ? input.meta : {};
  const process = (input.process ?? metadata.process ?? {}) as Record<string, any>;
  const ingredients = (input.ingredients ?? metadata.ingredients ?? {}) as Record<string, unknown>;
  const explicitRequirements = ensureArray<any>(
    input.requirements ?? metadata.requirements
  );
  const actionPool = ensureArray<any>(input.actions ?? metadata.actions);
  const triggerPool = ensureArray<any>(input.triggers ?? metadata.triggers);
  const complianceProfile =
    input?.compliance_profile && typeof input.compliance_profile === 'object'
      ? (input.compliance_profile as Record<string, unknown>)
      : metadata?.compliance_profile && typeof metadata.compliance_profile === 'object'
        ? (metadata.compliance_profile as Record<string, unknown>)
        : undefined;
  const recipeComplianceSnapshot =
    input?.recipe_compliance_snapshot && typeof input.recipe_compliance_snapshot === 'object'
      ? (input.recipe_compliance_snapshot as Record<string, unknown>)
      : metadata?.recipe_compliance_snapshot && typeof metadata.recipe_compliance_snapshot === 'object'
        ? (metadata.recipe_compliance_snapshot as Record<string, unknown>)
        : undefined;
  const recipeRevision = toText(
    recipeComplianceSnapshot?.revision ?? metadata?.recipe_compliance_snapshot?.revision
  );

  const triggersByActionId = new Map<string, any>();
  for (const trigger of triggerPool) {
    const actionId = toText(trigger?.action_id ?? trigger?.actionId);
    if (actionId) {
      triggersByActionId.set(actionId, trigger);
    }
  }

  const steps: RecipeStep[] = [];
  const requirements: RecipeRequirement[] = [];
  const pushStep = (step: RecipeStep) => {
    steps.push({
      ...step,
      id: step.id || makeId('step'),
      name: step.name || 'Recipe Step',
    });
  };

  const declaredSteps = ensureArray<any>(input.steps);
  if (declaredSteps.length > 0) {
    declaredSteps.forEach((step, index) => {
      const params =
        step?.params && typeof step.params === 'object' ? step.params : {};
      const actionName = toText(params.action ?? step.action ?? step.type) ?? 'step';
      const durationMin = durationFromAction(params) ?? durationFromAction(step);
      const temperatureC = tempFromAction(params) ?? tempFromAction(step);
      const explicitAutoProceed =
        toBoolean(params.autoProceed) ?? toBoolean(step.autoProceed);
      const explicitConfirm =
        toBoolean(params.requiresUserConfirm) ??
        toBoolean(step.requiresUserConfirm);
      const requiresUserConfirm =
        explicitConfirm ??
        (explicitAutoProceed !== undefined ? !explicitAutoProceed : false);
      pushStep({
        id: toText(step.id) ?? `step-${index + 1}`,
        name:
          toText(params.name ?? step.name) ??
          makeActionLabel(toText(params.stage ?? step.stage), actionName, `Step ${index + 1}`),
        stage: toText(params.stage ?? step.stage),
        action: actionName,
        triggerWhen: toText(params.triggerWhen ?? step.triggerWhen ?? params.when ?? step.when),
        durationMin,
        temperatureC,
        targetDeviceId: toText(
          params.targetDeviceId ?? step.targetDeviceId ?? params.device ?? step.device
        ),
        command: toStepCommand(params.command ?? step.command ?? actionName),
        value:
          maybeParseScalar(params.value ?? step.value) ??
          maybeParseScalar(params.targetValue ?? step.targetValue) ??
          (temperatureC !== undefined ? temperatureC : undefined),
        requiresUserConfirm,
        autoProceed: explicitAutoProceed ?? !requiresUserConfirm,
      });
    });
  }

  if (steps.length === 0) {
    const actions = actionPool;
    if (actions.length > 0) {
      actions.forEach((action, index) => {
        const actionId = toText(action.id) ?? `action-${index + 1}`;
        const actionName = toText(action.action ?? action.type) ?? 'action';
        const trigger = triggersByActionId.get(actionId);
        const durationMin = durationFromAction(action);
        const temperatureC = tempFromAction(action) ?? tempFromAction(trigger);
        const explicitAutoProceed = toBoolean(action.autoProceed);
        const explicitConfirm = toBoolean(action.requiresUserConfirm);
        const requiresUserConfirm =
          explicitConfirm ??
          (explicitAutoProceed !== undefined
            ? !explicitAutoProceed
            : actionName.includes('add') || actionName.includes('notify'));
        pushStep({
          id: actionId,
          name:
            toText(action.label ?? action.name) ??
            makeActionLabel(toText(action.stage), actionName, `Action ${index + 1}`),
          stage: toText(action.stage),
          action: actionName,
          triggerWhen: toText(trigger?.when),
          durationMin,
          temperatureC,
          targetDeviceId: toText(action.targetDeviceId ?? action.device),
          command: toStepCommand(action.command ?? actionName),
          value:
            maybeParseScalar(action.value) ??
            maybeParseScalar(action.targetValue) ??
            (temperatureC !== undefined ? temperatureC : undefined),
          requiresUserConfirm,
          autoProceed: explicitAutoProceed ?? !requiresUserConfirm,
        });
      });
    }
  }

  if (steps.length === 0) {
    const mashSteps = ensureArray<any>(process.mash_steps);
    mashSteps.forEach((step, index) => {
      const temperatureC = toNumber(step.target_c ?? step.targetC ?? step.temperatureC);
      pushStep({
        id: `mash-${index + 1}`,
        name: toText(step.name) ?? `Mash Step ${index + 1}`,
        stage: 'mash',
        action: 'hold',
        durationMin: toNumber(step.duration_min ?? step.durationMin),
        temperatureC,
        command: 'set_value',
        value: temperatureC,
        requiresUserConfirm: false,
        autoProceed: true,
      });
    });
    const boilDuration = toNumber(
      process.boil?.duration_min ??
        process.boil_time_min ??
        input.hardware_prep?.boil?.boil_time_min ??
        metadata.hardware_prep?.boil?.boil_time_min ??
        input.batch?.boil_time_min
    );
    if (boilDuration !== undefined) {
      pushStep({
        id: 'boil',
        name: 'Boil',
        stage: 'boil',
        action: 'hold',
        durationMin: boilDuration,
        temperatureC: 100,
        command: 'set_value',
        value: 100,
        requiresUserConfirm: false,
        autoProceed: true,
      });
    }
    const fermentTarget = toNumber(
      process.fermentation?.target_c ??
        process.fermentation?.primary_temp_c ??
        process.fermentation?.temp_c
    );
    if (fermentTarget !== undefined) {
      pushStep({
        id: 'ferment-hold',
        name: 'Fermentation Hold',
        stage: 'fermentation',
        action: 'hold_temp',
        durationMin: toNumber(process.fermentation?.primary_days) !== undefined
          ? Number(process.fermentation.primary_days) * 24 * 60
          : undefined,
        temperatureC: fermentTarget,
        command: 'set_value',
        value: fermentTarget,
        requiresUserConfirm: false,
        autoProceed: true,
      });
    }
  }

  const validCategories = new Set<RecipeRequirement['category']>([
    'yeast',
    'malt',
    'hops',
    'fruit',
    'packaging',
    'equipment',
    'other',
  ]);

  explicitRequirements.forEach((entry) => {
    const normalizedCategory = String(entry?.category ?? 'other').toLowerCase();
    const category = validCategories.has(normalizedCategory as RecipeRequirement['category'])
      ? (normalizedCategory as RecipeRequirement['category'])
      : 'other';
    addRequirement(requirements, {
      name: toText(entry?.name) ?? 'Requirement',
      category,
      requiredQty: toNumber(entry?.requiredQty ?? entry?.qty ?? entry?.amount),
      unit: toText(entry?.unit),
    });
  });

  for (const hop of ensureArray<any>(ingredients.hops as any)) {
    addRequirement(requirements, {
      name: toText(hop?.name) ?? 'Hop',
      category: 'hops',
      requiredQty: toNumber(hop?.amount_g ?? hop?.weight_g ?? hop?.amount),
      unit: toText(hop?.unit) ?? 'g',
    });
  }
  for (const malt of ensureArray<any>(ingredients.malts as any).concat(
    ensureArray<any>(ingredients.fermentables as any)
  )) {
    addRequirement(requirements, {
      name: toText(malt?.name) ?? 'Malt',
      category: 'malt',
      requiredQty: toNumber(malt?.amount_kg ?? malt?.weight_kg ?? malt?.amount),
      unit: toText(malt?.unit) ?? 'kg',
    });
  }
  for (const yeast of ensureArray<any>(ingredients.yeast as any)) {
    addRequirement(requirements, {
      name: toText(yeast?.name) ?? 'Yeast',
      category: 'yeast',
      requiredQty: toNumber(yeast?.amount ?? yeast?.packs),
      unit: toText(yeast?.unit) ?? 'packs',
    });
  }

  return {
    id: String(input.id ?? metadata.id ?? legacyMeta.id ?? makeId('recipe')),
    name: String(
      input.name ??
        metadata.name ??
        legacyMeta.name ??
        'Imported BevForge Recipe'
    ),
    format: 'bevforge',
    requirements,
    steps,
    metadata: Object.keys(metadata).length > 0 ? (metadata as Record<string, unknown>) : undefined,
    complianceProfile,
    recipeComplianceSnapshot,
    recipeRevision,
    rawFile,
    importedAt: new Date().toISOString(),
  };
};

const normalizeBeerJson = (input: any, rawFile: string): ImportedRecipe => {
  const recipeRoot = input.recipe ?? input;
  const mashSteps = ensureArray<any>(recipeRoot.mash?.steps);
  const boilTime = toNumber(recipeRoot.boilTime ?? recipeRoot.boil_time);
  const hops = ensureArray<any>(recipeRoot.hops);
  const fermentables = ensureArray<any>(recipeRoot.fermentables);
  const yeasts = ensureArray<any>(recipeRoot.yeasts ?? recipeRoot.yeast);

  const steps: RecipeStep[] = [];
  const requirements: RecipeRequirement[] = [];
  mashSteps.forEach((step, index) => {
    steps.push({
      id: `mash-${index + 1}`,
      name: String(step.name ?? `Mash Step ${index + 1}`),
      stage: 'mash',
      action: 'hold',
      durationMin: toNumber(step.time ?? step.duration),
      temperatureC: toNumber(step.temperature ?? step.temp),
      command: 'set_value',
      value: toNumber(step.temperature ?? step.temp),
      requiresUserConfirm: false,
      autoProceed: true,
    });
  });

  if (boilTime !== undefined) {
    steps.push({
      id: 'boil',
      name: 'Boil',
      stage: 'boil',
      action: 'hold',
      durationMin: boilTime,
      temperatureC: 100,
      command: 'set_value',
      value: 100,
      requiresUserConfirm: false,
      autoProceed: true,
    });
  }

  hops.forEach((hop, index) => {
    const hopName = toText(hop.name) ?? `Hop ${index + 1}`;
    addRequirement(requirements, {
      name: hopName,
      category: 'hops',
      requiredQty: toNumber(hop.amount ?? hop.weight ?? hop.weight_g),
      unit: toText(hop.unit) ?? 'kg',
    });
    const hopTime = toNumber(hop.time ?? hop.time_min);
    steps.push({
      id: `hop-${index + 1}`,
      name: `Hop Add: ${hopName}`,
      stage: 'boil',
      action: 'hop_add',
      triggerWhen: hopTime !== undefined ? `boil_min_remaining:${hopTime}` : 'boil',
      durationMin: undefined,
      command: 'trigger',
      value: true,
      requiresUserConfirm: true,
      autoProceed: false,
    });
  });

  fermentables.forEach((fermentable) => {
    addRequirement(requirements, {
      name: toText(fermentable.name) ?? 'Fermentable',
      category: 'malt',
      requiredQty: toNumber(fermentable.amount ?? fermentable.weight ?? fermentable.weight_kg),
      unit: toText(fermentable.unit) ?? 'kg',
    });
  });

  yeasts.forEach((yeast) => {
    addRequirement(requirements, {
      name: toText(yeast.name) ?? 'Yeast',
      category: 'yeast',
      requiredQty: toNumber(yeast.amount ?? yeast.packs),
      unit: toText(yeast.unit) ?? 'packs',
    });
  });

  return {
    id: String(recipeRoot.id ?? makeId('recipe')),
    name: String(recipeRoot.name ?? 'Imported Beer JSON Recipe'),
    format: 'beer-json',
    requirements,
    steps,
    rawFile,
    importedAt: new Date().toISOString(),
  };
};

const normalizeBeerXml = (input: any, rawFile: string): ImportedRecipe => {
  const recipe = ensureArray<any>(input?.RECIPES?.RECIPE ?? input?.RECIPE)[0] ?? {};
  const mashSteps = ensureArray<any>(recipe?.MASH?.MASH_STEPS?.MASH_STEP);
  const hops = ensureArray<any>(recipe?.HOPS?.HOP);
  const fermentables = ensureArray<any>(recipe?.FERMENTABLES?.FERMENTABLE);
  const yeasts = ensureArray<any>(recipe?.YEASTS?.YEAST);
  const requirements: RecipeRequirement[] = [];
  const steps: RecipeStep[] = mashSteps.map((step, index) => ({
    id: `mash-${index + 1}`,
    name: String(step.NAME ?? `Mash Step ${index + 1}`),
    stage: 'mash',
    action: 'hold',
    durationMin: toNumber(step.STEP_TIME),
    temperatureC: toNumber(step.STEP_TEMP),
    command: 'set_value',
    value: toNumber(step.STEP_TEMP),
    requiresUserConfirm: false,
    autoProceed: true,
  }));

  const boilTime = toNumber(recipe.BOIL_TIME);
  if (boilTime !== undefined) {
    steps.push({
      id: 'boil',
      name: 'Boil',
      stage: 'boil',
      action: 'hold',
      durationMin: boilTime,
      temperatureC: 100,
      command: 'set_value',
      value: 100,
      requiresUserConfirm: false,
      autoProceed: true,
    });
  }

  hops.forEach((hop, index) => {
    const hopName = toText(hop.NAME) ?? `Hop ${index + 1}`;
    addRequirement(requirements, {
      name: hopName,
      category: 'hops',
      requiredQty: toNumber(hop.AMOUNT),
      unit: 'kg',
    });
    const hopTime = toNumber(hop.TIME);
    steps.push({
      id: `hop-${index + 1}`,
      name: `Hop Add: ${hopName}`,
      stage: 'boil',
      action: 'hop_add',
      triggerWhen: hopTime !== undefined ? `boil_min_remaining:${hopTime}` : 'boil',
      command: 'trigger',
      value: true,
      requiresUserConfirm: true,
      autoProceed: false,
    });
  });

  fermentables.forEach((fermentable) => {
    addRequirement(requirements, {
      name: toText(fermentable.NAME) ?? 'Fermentable',
      category: 'malt',
      requiredQty: toNumber(fermentable.AMOUNT),
      unit: 'kg',
    });
  });
  yeasts.forEach((yeast) => {
    addRequirement(requirements, {
      name: toText(yeast.NAME) ?? 'Yeast',
      category: 'yeast',
      requiredQty: toNumber(yeast.AMOUNT),
      unit: toText(yeast.AMOUNT_IS_WEIGHT) === 'TRUE' ? 'kg' : 'packs',
    });
  });

  const primaryTemp = toNumber(recipe.PRIMARY_TEMP);
  if (primaryTemp !== undefined) {
    steps.push({
      id: 'fermentation-primary',
      name: 'Primary Fermentation',
      stage: 'fermentation',
      action: 'hold_temp',
      temperatureC: primaryTemp,
      command: 'set_value',
      value: primaryTemp,
      requiresUserConfirm: false,
      autoProceed: true,
    });
  }

  return {
    id: makeId('recipe'),
    name: String(recipe.NAME ?? 'Imported BeerXML Recipe'),
    format: 'beer-xml',
    requirements,
    steps,
    rawFile,
    importedAt: new Date().toISOString(),
  };
};

const normalizeBeerSmithBsmx = (input: any, rawFile: string): ImportedRecipe => {
  const recipe =
    ensureArray<any>(input?.Recipes?.Data?.Recipe ?? input?.Recipes?.Recipe ?? input?.Recipe)[0] ??
    {};
  const mashSteps = ensureArray<any>(recipe?.F_R_MASH?.steps?.Data?.MashStep);
  const hops = ensureArray<any>(recipe?.Ingredients?.Data?.Hops);
  const fermentables = ensureArray<any>(recipe?.Ingredients?.Data?.Fermentable);
  const yeasts = ensureArray<any>(recipe?.Ingredients?.Data?.Yeast);
  const requirements: RecipeRequirement[] = [];

  const mashTempCandidates = mashSteps
    .map((step) => toNumber(step?.F_MS_STEP_TEMP))
    .filter((value): value is number => Number.isFinite(value));
  const ageTempCandidates = [
    toNumber(recipe?.F_R_AGE?.F_A_PRIM_TEMP),
    toNumber(recipe?.F_R_AGE?.F_A_SEC_TEMP),
    toNumber(recipe?.F_R_AGE?.F_A_TERT_TEMP),
  ].filter((value): value is number => Number.isFinite(value));
  const tempCandidates = [...mashTempCandidates, ...ageTempCandidates];
  const likelyFahrenheit = tempCandidates.some((value) => value > 95);
  const convertTemp = (value: unknown): number | undefined => {
    const parsed = toNumber(value);
    if (parsed === undefined) return undefined;
    return likelyFahrenheit ? toCelsius(parsed) : parsed;
  };

  const steps: RecipeStep[] = mashSteps.map((step, index) => {
    const temperatureC = convertTemp(step.F_MS_STEP_TEMP);
    return {
      id: `mash-${index + 1}`,
      name: toText(step.F_MS_NAME) ?? `Mash Step ${index + 1}`,
      stage: 'mash',
      action: 'hold',
      durationMin: toNumber(step.F_MS_STEP_TIME),
      temperatureC,
      command: 'set_value',
      value: temperatureC,
      requiresUserConfirm: false,
      autoProceed: true,
    };
  });

  const boilTime = toNumber(
    recipe?.F_R_EQUIPMENT?.F_E_BOIL_TIME ?? recipe?.F_R_BOIL_TIME
  );
  if (boilTime !== undefined) {
    steps.push({
      id: 'boil',
      name: 'Boil',
      stage: 'boil',
      action: 'hold',
      durationMin: boilTime,
      temperatureC: 100,
      command: 'set_value',
      value: 100,
      requiresUserConfirm: false,
      autoProceed: true,
    });
  }

  hops.forEach((hop, index) => {
    const hopName = toText(hop.F_H_NAME) ?? `Hop ${index + 1}`;
    addRequirement(requirements, {
      name: hopName,
      category: 'hops',
      requiredQty: toNumber(hop.F_H_AMOUNT),
      unit: 'kg',
    });
    const hopTime = toNumber(hop.F_H_BOIL_TIME);
    steps.push({
      id: `hop-${index + 1}`,
      name: `Hop Add: ${hopName}`,
      stage: 'boil',
      action: 'hop_add',
      triggerWhen: hopTime !== undefined ? `boil_min_remaining:${hopTime}` : 'boil',
      command: 'trigger',
      value: true,
      requiresUserConfirm: true,
      autoProceed: false,
    });
  });

  fermentables.forEach((fermentable) => {
    addRequirement(requirements, {
      name: toText(fermentable.F_F_NAME) ?? 'Fermentable',
      category: 'malt',
      requiredQty: toNumber(fermentable.F_F_AMOUNT),
      unit: 'kg',
    });
  });
  yeasts.forEach((yeast) => {
    addRequirement(requirements, {
      name: toText(yeast.F_Y_NAME) ?? 'Yeast',
      category: 'yeast',
      requiredQty: toNumber(yeast.F_Y_AMOUNT),
      unit: 'packs',
    });
  });

  const primaryDays = toNumber(recipe?.F_R_AGE?.F_A_PRIM_DAYS);
  const primaryTemp = convertTemp(recipe?.F_R_AGE?.F_A_PRIM_TEMP);
  if (primaryTemp !== undefined || primaryDays !== undefined) {
    steps.push({
      id: 'fermentation-primary',
      name: 'Primary Fermentation',
      stage: 'fermentation',
      action: 'hold_temp',
      durationMin: primaryDays !== undefined ? primaryDays * 24 * 60 : undefined,
      temperatureC: primaryTemp,
      command: 'set_value',
      value: primaryTemp,
      requiresUserConfirm: false,
      autoProceed: true,
    });
  }

  const secondaryDays = toNumber(recipe?.F_R_AGE?.F_A_SEC_DAYS);
  const secondaryTemp = convertTemp(recipe?.F_R_AGE?.F_A_SEC_TEMP);
  if (secondaryTemp !== undefined || secondaryDays !== undefined) {
    steps.push({
      id: 'fermentation-secondary',
      name: 'Secondary Fermentation',
      stage: 'fermentation',
      action: 'hold_temp',
      durationMin: secondaryDays !== undefined ? secondaryDays * 24 * 60 : undefined,
      temperatureC: secondaryTemp,
      command: 'set_value',
      value: secondaryTemp,
      requiresUserConfirm: false,
      autoProceed: true,
    });
  }

  return {
    id: makeId('recipe'),
    name: String(recipe?.F_R_NAME ?? 'Imported BeerSmith Recipe'),
    format: 'beer-smith-bsmx',
    requirements,
    steps,
    rawFile,
    importedAt: new Date().toISOString(),
  };
};

export default async function handler(req: Request, res: Response) {
  try {
    const requiredToken = process.env.OS_RECIPE_IMPORT_TOKEN;
    if (requiredToken) {
      const tokenFromHeader =
        toText(req.headers['x-os-import-token']) ??
        toText(req.headers.authorization)?.replace(/^Bearer\s+/i, '');
      if (tokenFromHeader !== requiredToken) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized recipe import',
          message: 'Valid import token required',
        });
      }
    }

    const { filename, content } = req.body as {
      filename?: string;
      content?: string;
    };

    if (!filename || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'filename and content are required',
      });
    }

    const safeName = safeFileName(filename);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rawFileName = `${stamp}-${safeName}`;
    await writeRawRecipeFile(rawFileName, content);

    const ext = path.extname(filename).toLowerCase();
    let normalized: ImportedRecipe;

    if (ext === '.xml' || ext === '.bsmx') {
      const parsed = parser.parse(content);
      const isBeerSmith =
        ext === '.bsmx' ||
        Boolean(parsed?.Recipes?.Data?.Recipe?.F_R_NAME) ||
        Boolean(parsed?.Recipes?.Data?.Recipe?.F_R_MASH);
      normalized = isBeerSmith
        ? normalizeBeerSmithBsmx(parsed, rawFileName)
        : normalizeBeerXml(parsed, rawFileName);
    } else {
      const parsed = JSON.parse(content);
      const isBevForge =
        parsed?.schemaVersion ||
        parsed?.steps ||
        parsed?.meta?.source === 'bevforge-lab' ||
        parsed?.metadata?.source === 'bevforge-lab' ||
        parsed?.meta?.version ||
        parsed?.metadata?.version ||
        parsed?.metadata?.process ||
        parsed?.metadata?.requirements ||
        parsed?.metadata?.actions ||
        parsed?.process ||
        parsed?.actions ||
        path.basename(filename).toLowerCase() === 'bevforge.json' ||
        filename.toLowerCase().endsWith('.bevforge.json');
      normalized = isBevForge
        ? normalizeBevForge(parsed, rawFileName)
        : normalizeBeerJson(parsed, rawFileName);
    }

    await appendImportedRecipe(normalized);

    return res.status(200).json({
      success: true,
      data: normalized,
      meta: {
        message: `Imported ${normalized.format} recipe`,
      },
    });
  } catch (error) {
    console.error('Failed to import recipe:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to import recipe',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
