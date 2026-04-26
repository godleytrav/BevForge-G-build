import type { Request, Response } from 'express';
import { completePackagingRun } from '../../../../../../lib/process-runs-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    if (!runId || !String(runId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'runId is required.',
      });
    }

    const body = req.body as {
      action?: 'complete';
      completedUnits?: number;
      rejectedUnits?: number;
      sourceQtyUsed?: number;
      lossQty?: number;
      operator?: string;
      packageLineLabel?: string;
      lossReasonCode?: string;
      rejectionReasonCode?: string;
      assetId?: string;
      assetCode?: string;
      assetCodes?: string[];
    };

    if (body.action !== 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Only action=complete is supported.',
      });
    }

    const run = await completePackagingRun({
      runId: String(runId).trim(),
      completedUnits: Number(body.completedUnits ?? 0),
      rejectedUnits: body.rejectedUnits,
      sourceQtyUsed: Number(body.sourceQtyUsed ?? 0),
      lossQty: body.lossQty,
      operator: body.operator ? String(body.operator).trim() : undefined,
      packageLineLabel: body.packageLineLabel ? String(body.packageLineLabel).trim() : undefined,
      lossReasonCode: body.lossReasonCode ? String(body.lossReasonCode).trim() : undefined,
      rejectionReasonCode:
        body.rejectionReasonCode ? String(body.rejectionReasonCode).trim() : undefined,
      assetId: body.assetId ? String(body.assetId).trim() : undefined,
      assetCode: body.assetCode ? String(body.assetCode).trim() : undefined,
      assetCodes: Array.isArray(body.assetCodes) ? body.assetCodes : undefined,
    });

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update packaging run.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
