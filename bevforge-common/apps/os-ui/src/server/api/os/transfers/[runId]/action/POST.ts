import type { Request, Response } from 'express';
import { completeTransferRun } from '../../../../../lib/process-runs-store.js';

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
      lossQty?: number;
      destinations?: Array<{
        id?: string;
        label?: string;
        kind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
        capacityQty?: number;
        plannedQty?: number;
        actualQty?: number;
      }>;
      operator?: string;
      lossReasonCode?: string;
    };

    if (body.action !== 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Only action=complete is supported.',
      });
    }

    const run = await completeTransferRun({
      runId: String(runId).trim(),
      lossQty: body.lossQty,
      operator: body.operator ? String(body.operator).trim() : undefined,
      lossReasonCode: body.lossReasonCode ? String(body.lossReasonCode).trim() : undefined,
      destinations: body.destinations,
    });

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update transfer run.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
