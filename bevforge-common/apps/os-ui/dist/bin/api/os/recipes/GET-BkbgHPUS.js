import { l as readImportedRecipes } from './import/POST-B16W0CFH.js';

async function handler(_req, res) {
  try {
    const recipes = await readImportedRecipes();
    return res.status(200).json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error("Failed to load imported recipes:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load imported recipes."
    });
  }
}

export { handler as h };
