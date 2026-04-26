import type { Request, Response } from 'express';
import { createTransferRun } from '../../../lib/process-runs-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      sourceBatchId?: string;
      siteId?: string;
      mode?: 'manual' | 'auto';
      destinations?: Array<{
        id?: string;
        label?: string;
        kind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
        capacityQty?: number;
        plannedQty?: number;
        actualQty?: number;
      }>;
      lossQty?: number;
      operator?: string;
      lossReasonCode?: string;
      notes?: string;
    };

    if (!body.sourceBatchId || !String(body.sourceBatchId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'sourceBatchId is required.',
      });
    }
    if (!Array.isArray(body.destinations) || body.destinations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one destination is required.',
      });
    }

    const run = await createTransferRun({
      sourceBatchId: String(body.sourceBatchId).trim(),
      siteId: body.siteId,
      mode: body.mode,
      destinations: body.destinations,
      lossQty: body.lossQty,
      operator: body.operator ? String(body.operator).trim() : undefined,
      lossReasonCode: body.lossReasonCode ? String(body.lossReasonCode).trim() : undefined,
      notes: body.notes,
    });

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create transfer run.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
