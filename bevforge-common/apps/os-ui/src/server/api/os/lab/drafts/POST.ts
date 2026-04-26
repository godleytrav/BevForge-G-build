import type { Request, Response } from 'express';
import {
  deleteLabDraft,
  setActiveLabDraftId,
  upsertLabDraft,
} from '../../../../lib/commissioning-store.js';

const isAuthorized = (req: Request): boolean => {
  const requiredToken = process.env.OS_RECIPE_IMPORT_TOKEN;
  if (!requiredToken) return true;
  const headerToken =
    (typeof req.headers['x-os-import-token'] === 'string'
      ? req.headers['x-os-import-token']
      : undefined) ||
    (typeof req.headers.authorization === 'string'
      ? req.headers.authorization.replace(/^Bearer\s+/i, '')
      : undefined);
  return headerToken === requiredToken;
};

type DraftAction = 'upsert' | 'delete' | 'set_active';

/**
 * POST /api/os/lab/drafts
 *
 * Body:
 * - { action: 'upsert', draft: Record<string, unknown> }
 * - { action: 'delete', recipeId: string }
 * - { action: 'set_active', recipeId?: string }
 */
export default async function handler(req: Request, res: Response) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized LAB drafts mutation',
      });
    }

    const { action, draft, recipeId } = req.body as {
      action?: DraftAction;
      draft?: Record<string, unknown>;
      recipeId?: string;
    };

    if (action === 'upsert') {
      if (!draft || typeof draft !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'draft object is required for upsert.',
        });
      }
      const draftId = typeof draft.id === 'string' ? draft.id.trim() : '';
      if (!draftId) {
        return res.status(400).json({
          success: false,
          error: 'draft.id is required for upsert.',
        });
      }
      const state = await upsertLabDraft({
        ...draft,
        id: draftId,
      });
      return res.status(200).json({
        success: true,
        data: state,
      });
    }

    if (action === 'delete') {
      const nextId = String(recipeId ?? '').trim();
      if (!nextId) {
        return res.status(400).json({
          success: false,
          error: 'recipeId is required for delete.',
        });
      }
      const state = await deleteLabDraft(nextId);
      return res.status(200).json({
        success: true,
        data: state,
      });
    }

    if (action === 'set_active') {
      const nextId = String(recipeId ?? '').trim() || undefined;
      const state = await setActiveLabDraftId(nextId);
      return res.status(200).json({
        success: true,
        data: state,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Valid action is required (upsert, delete, set_active).',
    });
  } catch (error) {
    console.error('Failed to mutate LAB drafts state:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mutate LAB drafts state.',
    });
  }
}
