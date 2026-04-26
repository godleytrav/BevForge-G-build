import type { Request, Response } from 'express';
import {
  getComplianceSyncState,
  listComplianceReports,
} from '../../../lib/compliance-store';

/**
 * GET /api/compliance/reports
 * Lists OPS compliance period reports.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteId =
      typeof req.query.siteId === 'string' ? req.query.siteId : undefined;
    const reports = await listComplianceReports(siteId);
    const syncState = await getComplianceSyncState();

    return res.json({
      success: true,
      data: reports,
      syncState,
    });
  } catch (error) {
    console.error('Failed to fetch compliance reports:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance reports.',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
