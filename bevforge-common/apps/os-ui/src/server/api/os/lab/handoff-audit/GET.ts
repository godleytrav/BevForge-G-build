import type { Request, Response } from 'express';
import { readLabHandoffAuditState } from '../../../../lib/commissioning-store.js';

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
 * GET /api/os/lab/handoff-audit
 *
 * Returns LAB handoff audit events.
 */
export default async function handler(req: Request, res: Response) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized LAB handoff audit access',
      });
    }

    const state = await readLabHandoffAuditState();
    return res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Failed to read LAB handoff audit state:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read LAB handoff audit state.',
    });
  }
}
