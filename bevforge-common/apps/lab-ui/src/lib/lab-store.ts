import type { SavedLabRecipe } from './lab-types';
import { suiteBaseUrl } from './suite-links';

const RECIPES_KEY = 'lab-ui.saved-recipes.v1';
const ACTIVE_RECIPE_KEY = 'lab-ui.active-recipe.v1';

const remoteSyncEnabled = (import.meta.env.VITE_LAB_REMOTE_SYNC ?? '1') !== '0';
const remoteBaseUrl = (import.meta.env.VITE_OS_API_BASE as string | undefined)?.trim() || suiteBaseUrl('os');
const remoteImportToken = (import.meta.env.VITE_OS_IMPORT_TOKEN as string | undefined)?.trim() || '';

interface LabDraftsApiState {
  activeRecipeId?: string;
  drafts: SavedLabRecipe[];
}

const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failure in restricted environments
  }
};

const remoteEndpoint = (path: string): string => `${remoteBaseUrl.replace(/\/+$/, '')}${path}`;

const remoteHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(remoteImportToken ? { Authorization: `Bearer ${remoteImportToken}` } : {}),
});

const postDraftMutation = async (
  action: 'upsert' | 'delete' | 'set_active',
  payload: Record<string, unknown>
): Promise<void> => {
  if (!remoteSyncEnabled) return;
  try {
    await fetch(remoteEndpoint('/api/os/lab/drafts'), {
      method: 'POST',
      headers: remoteHeaders(),
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    // local storage remains source during offline/remote failure
  }
};

export const hydrateRecipesFromOs = async (): Promise<boolean> => {
  if (!remoteSyncEnabled) return false;
  try {
    const response = await fetch(remoteEndpoint('/api/os/lab/drafts'), {
      method: 'GET',
      headers: remoteHeaders(),
    });
    if (!response.ok) return false;
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; data?: LabDraftsApiState }
      | null;
    if (!payload?.success || !payload.data) return false;

    const drafts = Array.isArray(payload.data.drafts)
      ? payload.data.drafts
          .filter((entry) => entry && typeof entry.id === 'string' && entry.id.trim().length > 0)
          .map((entry) => ({ ...entry }))
      : [];

    writeStorage(RECIPES_KEY, drafts);
    if (payload.data.activeRecipeId && String(payload.data.activeRecipeId).trim()) {
      writeStorage(ACTIVE_RECIPE_KEY, String(payload.data.activeRecipeId).trim());
    }
    return true;
  } catch {
    return false;
  }
};

export const listSavedRecipes = (): SavedLabRecipe[] => {
  const records = readStorage<SavedLabRecipe[]>(RECIPES_KEY, []);
  return records
    .slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
};

export const getSavedRecipe = (recipeId: string): SavedLabRecipe | undefined =>
  listSavedRecipes().find((record) => record.id === recipeId);

const upsert = (recipe: SavedLabRecipe): void => {
  const records = listSavedRecipes();
  const next = records.filter((record) => record.id !== recipe.id);
  next.push(recipe);
  writeStorage(RECIPES_KEY, next);
};

export const saveRecipe = (
  payload: Omit<SavedLabRecipe, 'id' | 'created_at' | 'updated_at'>,
  recipeId?: string
): SavedLabRecipe => {
  const now = new Date().toISOString();
  const existing = recipeId ? getSavedRecipe(recipeId) : undefined;

  const record: SavedLabRecipe = {
    ...payload,
    id: existing?.id ?? `lab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  upsert(record);
  void postDraftMutation('upsert', { draft: record });
  setActiveRecipeId(record.id);
  return record;
};

export const deleteRecipe = (recipeId: string): void => {
  const records = listSavedRecipes().filter((record) => record.id !== recipeId);
  writeStorage(RECIPES_KEY, records);
  void postDraftMutation('delete', { recipeId });
  if (getActiveRecipeId() === recipeId) {
    clearActiveRecipeId();
  }
};

export const getActiveRecipeId = (): string | undefined => {
  const value = readStorage<string | null>(ACTIVE_RECIPE_KEY, null);
  return value ?? undefined;
};

export const setActiveRecipeId = (recipeId: string): void => {
  writeStorage(ACTIVE_RECIPE_KEY, recipeId);
  void postDraftMutation('set_active', { recipeId });
};

export const clearActiveRecipeId = (): void => {
  try {
    window.localStorage.removeItem(ACTIVE_RECIPE_KEY);
  } catch {
    // ignore
  }
  void postDraftMutation('set_active', { recipeId: '' });
};
