import type { Request, Response } from 'express';
import { upsertFlowRuntimeSnapshot, type FlowRuntimeSnapshot } from '../../../../lib/flow-store.js';

/**
 * POST /api/os/flow/runtime-state
 *
 * Accepts FLOW edge runtime heartbeat/state snapshots.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as FlowRuntimeSnapshot;
    if (!body.siteId || !String(body.siteId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'siteId is required.',
      });
    }
    const snapshot = await upsertFlowRuntimeSnapshot(body);
    return res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Failed to upsert FLOW runtime snapshot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upsert FLOW runtime snapshot.',
    });
  }
}
