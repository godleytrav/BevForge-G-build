import type { Request, Response } from 'express';
import {
  readCanvasProject,
  readDevices,
  readEquipmentRoleMap,
  readImportedRecipes,
} from '../../../../lib/commissioning-store.js';
import { checkInventoryForRecipe } from '../../../../lib/inventory-batch-store.js';
import { buildRecipePreflightReport } from '../../../../lib/recipe-compatibility.js';

/**
 * POST /api/os/recipes/preflight
 *
 * Body: { recipeId: string, siteId?: string }
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { recipeId, siteId } = req.body as { recipeId?: string; siteId?: string };
    if (!recipeId) {
      return res.status(400).json({
        success: false,
        error: 'recipeId is required.',
      });
    }

    const [recipes, project, devices, equipmentRoleMap] = await Promise.all([
      readImportedRecipes(),
      readCanvasProject(),
      readDevices(),
      readEquipmentRoleMap(),
    ]);
    const recipe = recipes.find((candidate) => candidate.id === recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found.',
      });
    }

    const targetSiteId = String(siteId ?? 'main').trim().toLowerCase() || 'main';
    const inventoryChecks = await checkInventoryForRecipe(recipe, targetSiteId);
    const report = buildRecipePreflightReport(
      recipe,
      project,
      devices,
      equipmentRoleMap,
      inventoryChecks
    );
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Failed to build recipe preflight report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to build recipe preflight report.',
    });
  }
}
