import type { Request, Response } from 'express';
import { reconcilePackagingIntegrity } from '../../../../lib/process-runs-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as { apply?: boolean };
    const report = await reconcilePackagingIntegrity({
      apply: body.apply === true,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reconcile packaging integrity.';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
