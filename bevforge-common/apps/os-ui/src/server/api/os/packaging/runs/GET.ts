import type { Request, Response } from 'express';
import { listPackagingRuns } from '../../../../lib/process-runs-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const siteParam = Array.isArray(req.query.siteId) ? req.query.siteId[0] : req.query.siteId;
    const statusParam = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    const status =
      statusParam === 'active' || statusParam === 'completed' || statusParam === 'canceled'
        ? statusParam
        : undefined;
    const runs = await listPackagingRuns({
      siteId: siteParam ? String(siteParam) : undefined,
      status,
    });
    return res.status(200).json({
      success: true,
      data: runs,
    });
  } catch (error) {
    console.error('Failed to load packaging runs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load packaging runs.',
    });
  }
}
