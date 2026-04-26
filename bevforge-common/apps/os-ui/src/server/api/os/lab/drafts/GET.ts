import type { Request, Response } from 'express';
import { readLabDraftsState } from '../../../../lib/commissioning-store.js';

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

/**
 * GET /api/os/lab/drafts
 *
 * Returns LAB draft persistence state from OS commissioning storage.
 */
export default async function handler(req: Request, res: Response) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized LAB drafts access',
      });
    }

    const state = await readLabDraftsState();
    return res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Failed to read LAB drafts state:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read LAB drafts state.',
    });
  }
}
