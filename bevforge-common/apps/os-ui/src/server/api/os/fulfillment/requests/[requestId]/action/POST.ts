import type { Request, Response } from 'express';
import { applyFulfillmentRequestAction } from '../../../../../../lib/inventory-batch-store.js';

/**
 * POST /api/os/fulfillment/requests/:requestId/action
 */
export default async function handler(req: Request, res: Response) {
  try {
    const requestIdParam = req.params.requestId;
    const requestId = Array.isArray(requestIdParam) ? requestIdParam[0] : requestIdParam;
    if (!requestId || !String(requestId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'requestId is required.',
      });
    }

    const body = req.body as {
      actionId?: string;
      action?:
        | 'accept'
        | 'start'
        | 'block'
        | 'complete'
        | 'cancel'
        | 'reject'
        | 'link_batch'
        | 'link_package_lot'
        | 'note';
      actor?: string;
      note?: string;
      linkedBatchId?: string;
      linkedPackageLotId?: string;
    };

    const action = body.action;
    if (
      action !== 'accept' &&
      action !== 'start' &&
      action !== 'block' &&
      action !== 'complete' &&
      action !== 'cancel' &&
      action !== 'reject' &&
      action !== 'link_batch' &&
      action !== 'link_package_lot' &&
      action !== 'note'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'action must be one of accept/start/block/complete/cancel/reject/link_batch/link_package_lot/note.',
      });
    }
    if (action === 'link_batch' && !String(body.linkedBatchId ?? '').trim()) {
      return res.status(400).json({
        success: false,
        error: 'linkedBatchId is required when action=link_batch.',
      });
    }
    if (
      action === 'link_package_lot' &&
      !String(body.linkedPackageLotId ?? '').trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'linkedPackageLotId is required when action=link_package_lot.',
      });
    }

    const updated = await applyFulfillmentRequestAction({
      requestId: String(requestId).trim(),
      actionId: body.actionId ? String(body.actionId).trim() : undefined,
      action,
      actor: body.actor,
      note: body.note,
      linkedBatchId: body.linkedBatchId,
      linkedPackageLotId: body.linkedPackageLotId,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Fulfillment request not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to apply fulfillment request action.';
    const statusCode =
      message.includes('not found')
        ? 404
        : message.includes('required')
          ? 400
          : message.includes('requires a linked batch or package lot')
            ? 400
          : message.includes('Invalid status transition')
            ? 409
          : message.includes('site does not match')
            ? 409
            : 500;
    if (statusCode === 500) {
      console.error('Failed to apply fulfillment request action:', error);
    }
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
