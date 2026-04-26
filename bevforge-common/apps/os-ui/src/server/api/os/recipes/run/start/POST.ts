import type { Request, Response } from 'express';
import type { ImportedRecipe } from '../../../../../../features/canvas/types.js';
import {
  readCanvasProject,
  readDevices,
  readEquipmentRoleMap,
  readImportedRecipes,
} from '../../../../../lib/commissioning-store.js';
import {
  checkInventoryForRecipe,
  createBatchFromRecipeRun,
  reserveInventoryForRecipeRun,
} from '../../../../../lib/inventory-batch-store.js';
import { upsertCoreProduct } from '../../../../../lib/product-catalog-store.js';
import { recipeRunner } from '../../../../../lib/recipe-runner.js';
import { buildRecipePreflightReport } from '../../../../../lib/recipe-compatibility.js';
import { compileRecipeForExecution } from '../../../../../lib/recipe-execution-plan.js';
import type { BeverageClass } from '../../../../../../features/products/types.js';

const nowIso = () => new Date().toISOString();

const validRecipeFormats = new Set<ImportedRecipe['format']>([
  'bevforge',
  'beer-json',
  'beer-xml',
  'beer-smith-bsmx',
]);

const validStepCommands = new Set([
  'on_off',
  'open_close',
  'route',
  'set_value',
  'trigger',
]);

const validRequirementCategories = new Set([
  'yeast',
  'malt',
  'hops',
  'fruit',
  'packaging',
  'equipment',
  'other',
]);

type RecipeExecutionMode = 'automated' | 'hybrid' | 'manual';

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const next = value.trim();
  return next.length > 0 ? next : undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const toOptionalBool = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const normalizeExecutionMode = (value: unknown): RecipeExecutionMode => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'manual') return 'manual';
  if (normalized === 'hybrid') return 'hybrid';
  return 'automated';
};

const readRecordValue = (record: unknown, key: string): unknown =>
  record && typeof record === 'object'
    ? (record as Record<string, unknown>)[key]
    : undefined;

const deriveRecipeBeverageClass = (recipe: ImportedRecipe): BeverageClass => {
  const metadata =
    recipe.metadata && typeof recipe.metadata === 'object'
      ? (recipe.metadata as Record<string, unknown>)
      : {};
  const compliance =
    recipe.complianceProfile && typeof recipe.complianceProfile === 'object'
      ? (recipe.complianceProfile as Record<string, unknown>)
      : {};
  const snapshot =
    recipe.recipeComplianceSnapshot && typeof recipe.recipeComplianceSnapshot === 'object'
      ? (recipe.recipeComplianceSnapshot as Record<string, unknown>)
      : {};

  const candidates = [
    metadata.recipe_type,
    metadata.recipeType,
    metadata.beverage_class,
    metadata.beverageClass,
    compliance.beverage_class,
    compliance.beverageClass,
    compliance.product_type,
    compliance.productType,
    snapshot.beverage_class,
    snapshot.beverageClass,
    snapshot.product_type,
    snapshot.productType,
    readRecordValue(metadata.meta, 'recipe_type'),
    readRecordValue(metadata.meta, 'recipeType'),
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? '').trim().toLowerCase();
    if (normalized === 'cider' || normalized === 'hard_cider' || normalized === 'perry') {
      return 'cider';
    }
    if (normalized === 'wine') {
      return 'wine';
    }
    if (
      normalized === 'beer' ||
      normalized === 'malt_beverage' ||
      normalized === 'malt beverage'
    ) {
      return 'beer';
    }
  }

  if (
    recipe.format === 'beer-json' ||
    recipe.format === 'beer-xml' ||
    recipe.format === 'beer-smith-bsmx'
  ) {
    return 'beer';
  }

  return 'other';
};

const deriveRecipeIdentityValue = (
  recipe: ImportedRecipe,
  keys: string[]
): string | undefined => {
  const pools = [
    recipe.metadata,
    recipe.complianceProfile,
    recipe.recipeComplianceSnapshot,
    readRecordValue(recipe.metadata, 'meta'),
  ];
  for (const pool of pools) {
    if (!pool || typeof pool !== 'object') continue;
    const record = pool as Record<string, unknown>;
    for (const key of keys) {
      const next = toOptionalString(record[key]);
      if (next) return next;
    }
  }
  return undefined;
};

const toManualExecutionRecipe = (recipe: ImportedRecipe): ImportedRecipe => ({
  ...recipe,
  steps: recipe.steps.map((step) => {
    const text = `${String(step.stage ?? '').toLowerCase()} ${String(step.action ?? '').toLowerCase()} ${String(step.name ?? '').toLowerCase()}`;
    const isTransferStep =
      text.includes('transfer') || String(step.triggerWhen ?? '').toLowerCase().includes('transfer_complete');
    const hasDuration =
      Number.isFinite(Number(step.durationMin)) && Number(step.durationMin) > 0;
    return {
      ...step,
      targetDeviceId: undefined,
      requiresUserConfirm: hasDuration ? false : true,
      autoProceed: false,
      triggerWhen: isTransferStep ? step.triggerWhen ?? 'transfer_complete' : step.triggerWhen,
    };
  }),
});

const normalizeInlineRecipe = (value: unknown): ImportedRecipe | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const input = value as Partial<ImportedRecipe> & {
    requirements?: unknown;
    steps?: unknown;
  };
  const rawSteps = Array.isArray(input.steps) ? input.steps : [];
  if (rawSteps.length === 0) {
    return null;
  }

  const id = toOptionalString(input.id) ?? `inline-${Date.now().toString(36)}`;
  const name = toOptionalString(input.name) ?? 'Canvas Recipe';
  const format = validRecipeFormats.has(input.format as ImportedRecipe['format'])
    ? (input.format as ImportedRecipe['format'])
    : 'bevforge';

  const requirements = Array.isArray(input.requirements)
    ? input.requirements.reduce<NonNullable<ImportedRecipe['requirements']>>((acc, raw) => {
        const candidate = raw as Record<string, unknown>;
        const reqName = toOptionalString(candidate.name);
        const category = toOptionalString(candidate.category);
        if (!reqName || !category || !validRequirementCategories.has(category)) {
          return acc;
        }
        const next: NonNullable<ImportedRecipe['requirements']>[number] = {
          name: reqName,
          category: category as NonNullable<ImportedRecipe['requirements']>[number]['category'],
        };
        const requiredQty = toOptionalNumber(candidate.requiredQty);
        const unit = toOptionalString(candidate.unit);
        if (requiredQty !== undefined) {
          next.requiredQty = requiredQty;
        }
        if (unit !== undefined) {
          next.unit = unit;
        }
        acc.push(next);
        return acc;
      }, [])
    : undefined;

  const steps = rawSteps.map((rawStep, index) => {
    const step = rawStep as Record<string, unknown>;
    const command = toOptionalString(step.command);
    const valueCandidate = step.value;
    return {
      id: toOptionalString(step.id) ?? `step-${index + 1}`,
      name: toOptionalString(step.name) ?? `Step ${index + 1}`,
      stage: toOptionalString(step.stage),
      action: toOptionalString(step.action),
      triggerWhen: toOptionalString(step.triggerWhen),
      durationMin: toOptionalNumber(step.durationMin),
      temperatureC: toOptionalNumber(step.temperatureC),
      targetDeviceId: toOptionalString(step.targetDeviceId),
      command: command && validStepCommands.has(command) ? (command as ImportedRecipe['steps'][number]['command']) : undefined,
      value:
        typeof valueCandidate === 'string' ||
        typeof valueCandidate === 'number' ||
        typeof valueCandidate === 'boolean'
          ? valueCandidate
          : undefined,
      requiresUserConfirm: toOptionalBool(step.requiresUserConfirm),
      autoProceed: toOptionalBool(step.autoProceed),
    };
  });

  return {
    id,
    name,
    format,
    requirements,
    steps,
    metadata:
      input.metadata && typeof input.metadata === 'object'
        ? (input.metadata as Record<string, unknown>)
        : undefined,
    complianceProfile:
      input.complianceProfile && typeof input.complianceProfile === 'object'
        ? (input.complianceProfile as Record<string, unknown>)
        : undefined,
    recipeComplianceSnapshot:
      input.recipeComplianceSnapshot && typeof input.recipeComplianceSnapshot === 'object'
        ? (input.recipeComplianceSnapshot as Record<string, unknown>)
        : undefined,
    recipeRevision: toOptionalString(input.recipeRevision),
    rawFile: toOptionalString(input.rawFile) ?? `inline://${id}.json`,
    importedAt: toOptionalString(input.importedAt) ?? nowIso(),
  };
};

/**
 * POST /api/os/recipes/run/start
 *
 * Body:
 * - { recipeId: string, allowManualOverride?: boolean, siteId?: string }
 * - { recipe: ImportedRecipe, allowManualOverride?: boolean, siteId?: string }
 */
export default async function handler(req: Request, res: Response) {
  try {
    const {
      recipeId,
      recipe: inlineRecipeInput,
      allowManualOverride,
      siteId,
      executionMode,
    } = req.body as {
      recipeId?: string;
      recipe?: ImportedRecipe;
      allowManualOverride?: boolean;
      siteId?: string;
      executionMode?: RecipeExecutionMode;
    };
    if (!recipeId && !inlineRecipeInput) {
      return res.status(400).json({
        success: false,
        error: 'recipeId or recipe payload is required.',
      });
    }

    const [recipes, project, devices, equipmentRoleMap] = await Promise.all([
      readImportedRecipes(),
      readCanvasProject(),
      readDevices(),
      readEquipmentRoleMap(),
    ]);
    const recipeFromIndex = recipeId
      ? recipes.find((candidate) => candidate.id === recipeId) ?? null
      : null;
    const recipe = recipeFromIndex ?? normalizeInlineRecipe(inlineRecipeInput);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: recipeId ? 'Recipe not found.' : 'Inline recipe payload is invalid.',
      });
    }

    const normalizedExecutionMode = normalizeExecutionMode(executionMode);

    const targetSiteId = String(siteId ?? 'main').trim().toLowerCase() || 'main';
    const inventoryChecks = await checkInventoryForRecipe(recipe, targetSiteId);
    const preflight = buildRecipePreflightReport(
      recipe,
      project,
      devices,
      equipmentRoleMap,
      inventoryChecks
    );
    const manualMode = normalizedExecutionMode === 'manual';
    if (preflight.status === 'incompatible' && !manualMode) {
      return res.status(409).json({
        success: false,
        error: 'Recipe is not compatible with the current commissioned system.',
        preflight,
      });
    }
    const requiresOverrideAck =
      preflight.status === 'needs_override' ||
      (manualMode && preflight.status === 'incompatible');
    if (requiresOverrideAck && allowManualOverride !== true) {
      return res.status(409).json({
        success: false,
        error:
          manualMode && preflight.status === 'incompatible'
            ? 'Manual mode requires override acknowledgement because required equipment is missing.'
            : 'Recipe requires manual override acknowledgement before start.',
        preflight,
      });
    }

    const compiledPlan = compileRecipeForExecution(
      recipe,
      project,
      devices,
      equipmentRoleMap
    );
    const executableRecipe =
      manualMode
        ? toManualExecutionRecipe(compiledPlan.recipe)
        : compiledPlan.recipe;
    const run = await recipeRunner.startRun(executableRecipe, {
      executionMode: normalizedExecutionMode,
    });
    const productBinding = await upsertCoreProduct({
      productId: deriveRecipeIdentityValue(recipe, ['productId', 'product_id']),
      productCode: deriveRecipeIdentityValue(recipe, ['productCode', 'product_code']),
      productName: executableRecipe.name,
      skuId: deriveRecipeIdentityValue(recipe, ['skuId', 'sku_id']),
      beverageClass: deriveRecipeBeverageClass(recipe),
      sourceSuite: 'os',
    });
    const batch = await createBatchFromRecipeRun({
      recipeId: executableRecipe.id,
      recipeName: executableRecipe.name,
      recipeRunId: run.runId,
      expectedUnit: 'L',
      siteId: targetSiteId,
      recipe: executableRecipe,
      productSnapshot: productBinding.snapshot,
    });
    await reserveInventoryForRecipeRun({
      recipe: executableRecipe,
      recipeRunId: run.runId,
      batchId: batch.id,
      siteId: targetSiteId,
    });
    return res.status(200).json({
      success: true,
      data: {
        ...run,
        batchId: batch.id,
        lotCode: batch.lotCode,
        executionMode: normalizedExecutionMode,
        executionPlan: {
          resolvedTargetCount: compiledPlan.resolvedTargetCount,
          inferredTargetCount: compiledPlan.inferredTargetCount,
          unresolvedTargetAliases: compiledPlan.unresolvedTargetAliases,
          notes: compiledPlan.notes,
        },
      },
      preflight,
    });
  } catch (error) {
    console.error('Failed to start recipe run:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start recipe run.',
    });
  }
}
