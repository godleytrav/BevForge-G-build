import type { Request, Response } from 'express';
import {
  appendLabHandoffAuditEntry,
  type LabHandoffAuditStatus,
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

/**
 * POST /api/os/lab/handoff-audit
 *
 * Body: { entry: { status: 'sent'|'success'|'failed'|'blocked', ... } }
 */
export default async function handler(req: Request, res: Response) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized LAB handoff audit mutation',
      });
    }

    const { entry } = req.body as {
      entry?: {
        id?: string;
        timestamp?: string;
        status?: LabHandoffAuditStatus;
        recipeId?: string;
        recipeName?: string;
        importedRecipeId?: string;
        importedFormat?: string;
        osBaseUrl?: string;
        dryRunOk?: boolean;
        warningCount?: number;
        errorCount?: number;
        message?: string;
        source?: string;
      };
    };

    if (!entry || !entry.status) {
      return res.status(400).json({
        success: false,
        error: 'entry.status is required.',
      });
    }

    const validStatuses: LabHandoffAuditStatus[] = ['sent', 'success', 'failed', 'blocked'];
    if (!validStatuses.includes(entry.status)) {
      return res.status(400).json({
        success: false,
        error: 'entry.status must be one of sent, success, failed, blocked.',
      });
    }

    const state = await appendLabHandoffAuditEntry({
      id: entry.id,
      timestamp: entry.timestamp,
      status: entry.status,
      recipeId: entry.recipeId,
      recipeName: entry.recipeName,
      importedRecipeId: entry.importedRecipeId,
      importedFormat: entry.importedFormat,
      osBaseUrl: entry.osBaseUrl,
      dryRunOk: entry.dryRunOk,
      warningCount: entry.warningCount,
      errorCount: entry.errorCount,
      message: entry.message,
      source: entry.source,
    });

    return res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Failed to append LAB handoff audit entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to append LAB handoff audit entry.',
    });
  }
}
