import type { Request, Response } from 'express';
import { readImportedRecipes } from '../../../lib/commissioning-store.js';

/**
 * GET /api/os/recipes
 *
 * Returns imported recipe index.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const recipes = await readImportedRecipes();
    return res.status(200).json({
      success: true,
      data: recipes,
    });
  } catch (error) {
    console.error('Failed to load imported recipes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load imported recipes.',
    });
  }
}
