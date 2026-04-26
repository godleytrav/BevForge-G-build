import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import {
  appendImportedRecipe,
  readImportedRecipes,
  writeRawRecipeFile,
} from '../../../lib/commissioning-store.js';
import { upsertCoreProduct } from '../../../lib/product-catalog-store.js';
import type { ImportedRecipe } from '../../../../features/canvas/types.js';
import type { BeverageClass } from '../../../../features/products/types.js';

const nowIso = () => new Date().toISOString();

const toOptionalText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const next = value.trim();
  return next.length > 0 ? next : undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const safeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();

const normalizeBeverageClass = (value: unknown): BeverageClass => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'cider') return 'cider';
  if (normalized === 'wine') return 'wine';
  if (normalized === 'beer') return 'beer';
  return 'other';
};

/**
 * POST /api/os/recipes
 *
 * Creates a lightweight recipe shell so batch creation can stay recipe-first.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      name?: string;
      productCode?: string;
      beverageClass?: BeverageClass;
      targetAbvPct?: number;
      targetResidualSugarPct?: number;
      targetSweetnessLevel?: 'bone_dry' | 'semi_dry' | 'semi_sweet' | 'sweet';
      defaultUnit?: string;
    };

    const name = toOptionalText(body.name);
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required.',
      });
    }

    const existingRecipes = await readImportedRecipes();
    if (existingRecipes.some((recipe) => recipe.name.trim().toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: 'A recipe with that name already exists.',
      });
    }

    const beverageClass = normalizeBeverageClass(body.beverageClass);
    const targetAbvPct = toOptionalNumber(body.targetAbvPct);
    if (targetAbvPct !== undefined && targetAbvPct < 0) {
      return res.status(400).json({
        success: false,
        error: 'targetAbvPct cannot be negative.',
      });
    }
    const targetResidualSugarPct = toOptionalNumber(body.targetResidualSugarPct);
    if (targetResidualSugarPct !== undefined && targetResidualSugarPct < 0) {
      return res.status(400).json({
        success: false,
        error: 'targetResidualSugarPct cannot be negative.',
      });
    }
    const targetSweetnessLevel = toOptionalText(body.targetSweetnessLevel)?.toLowerCase();
    const normalizedTargetSweetnessLevel =
      targetSweetnessLevel === 'bone_dry' ||
      targetSweetnessLevel === 'semi_dry' ||
      targetSweetnessLevel === 'semi_sweet' ||
      targetSweetnessLevel === 'sweet'
        ? targetSweetnessLevel
        : undefined;

    const defaultUnit = toOptionalText(body.defaultUnit) ?? 'L';
    const productBinding = await upsertCoreProduct({
      productCode: toOptionalText(body.productCode),
      productName: name,
      beverageClass,
      sourceSuite: 'os',
    });

    const recipeId = randomUUID();
    const importedAt = nowIso();
    const metadata: Record<string, unknown> = {
      schemaVersion: '1.0.0',
      source: 'manual-inline',
      createdFrom: 'os-new-batch',
      productId: productBinding.product.productId,
      productCode: productBinding.product.productCode,
      beverageClass,
      defaultUnit,
    };
    if (targetAbvPct !== undefined) {
      metadata.targetAbvPct = targetAbvPct;
    }
    if (targetResidualSugarPct !== undefined) {
      metadata.targetResidualSugarPct = targetResidualSugarPct;
      metadata.targetResidualSugarGpl = Number((targetResidualSugarPct * 10).toFixed(2));
    }
    if (normalizedTargetSweetnessLevel) {
      metadata.targetSweetnessLevel = normalizedTargetSweetnessLevel;
    }

    const recipe: ImportedRecipe = {
      id: recipeId,
      name,
      format: 'bevforge',
      steps: [
        {
          id: 'step-1',
          name: 'Define process',
          stage: 'planning',
          action: 'review',
          requiresUserConfirm: true,
          autoProceed: false,
        },
      ],
      metadata,
      rawFile: '',
      importedAt,
    };

    const rawFileName = `${Date.now()}-${safeFileName(name)}.json`;
    await writeRawRecipeFile(
      rawFileName,
      `${JSON.stringify(
        {
          schemaVersion: '1.0.0',
          id: recipeId,
          name,
          format: 'bevforge',
          metadata,
          steps: recipe.steps,
        },
        null,
        2
      )}\n`
    );

    recipe.rawFile = rawFileName;
    await appendImportedRecipe(recipe);

    return res.status(200).json({
      success: true,
      data: {
        recipe,
        product: productBinding.product,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recipe.',
    });
  }
}
