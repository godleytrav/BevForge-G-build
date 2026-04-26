import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteRecipe, hydrateRecipesFromOs, listSavedRecipes, setActiveRecipeId } from '../lib/lab-store';

export function LabLibraryPage() {
  const navigate = useNavigate();
  const [refreshToken, setRefreshToken] = useState(0);

  const recipes = useMemo(() => listSavedRecipes(), [refreshToken]);

  const refresh = () => setRefreshToken((value) => value + 1);

  useEffect(() => {
    let active = true;
    void hydrateRecipesFromOs().finally(() => {
      if (active) refresh();
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="lab-page">
      <header className="lab-page-head">
        <div>
          <h1>LAB Recipe Library</h1>
          <p>Saved dynamic drafts. Load, export, or delete as you iterate.</p>
        </div>
        <div className="lab-actions">
          <Link className="button" to="/lab/builder">
            Open Builder
          </Link>
        </div>
      </header>

      <article className="card">
        {recipes.length === 0 ? (
          <p className="hint">No saved drafts yet. Build and save one from the dynamic builder.</p>
        ) : (
          <div className="library-grid">
            {recipes.map((recipe) => (
              <article key={recipe.id} className="library-card">
                <header>
                  <h2>{recipe.name}</h2>
                  <small>
                    {recipe.style_key || 'style_not_set'} · {recipe.beverage}
                  </small>
                </header>

                <p className="hint">
                  Updated {new Date(recipe.updated_at).toLocaleString()} · Batch {recipe.proposal.batch_size_l}L
                </p>

                <div className="library-metrics">
                  <span>
                    ABV {recipe.proposal.targets.abv.min.toFixed(1)}-{recipe.proposal.targets.abv.max.toFixed(1)}%
                  </span>
                  <span>
                    IBU {recipe.proposal.targets.ibu.min.toFixed(0)}-{recipe.proposal.targets.ibu.max.toFixed(0)}
                  </span>
                  <span>
                    SRM {recipe.proposal.targets.srm.min.toFixed(1)}-{recipe.proposal.targets.srm.max.toFixed(1)}
                  </span>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      setActiveRecipeId(recipe.id);
                      navigate(`/lab/builder?recipeId=${recipe.id}`);
                    }}
                  >
                    Load Builder
                  </button>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() => {
                      setActiveRecipeId(recipe.id);
                      navigate(`/lab/exports?recipeId=${recipe.id}`);
                    }}
                  >
                    Open Exports
                  </button>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() => {
                      deleteRecipe(recipe.id);
                      refresh();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
