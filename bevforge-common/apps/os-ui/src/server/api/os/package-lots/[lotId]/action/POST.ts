import type { Request, Response } from 'express';
import {
  applyPackageLotAction,
  type PackageLotEventAction,
  type PackageLotReleaseStatus,
} from '../../../../../lib/inventory-batch-store.js';

const isPackageLotAction = (value: unknown): value is PackageLotEventAction =>
  value === 'release_status' ||
  value === 'ship' ||
  value === 'return' ||
  value === 'empty_return' ||
  value === 'rework' ||
  value === 'destroy' ||
  value === 'adjust' ||
  value === 'assign_asset' ||
  value === 'note';

const isReleaseStatus = (value: unknown): value is PackageLotReleaseStatus =>
  value === 'held' || value === 'ready' || value === 'released' || value === 'shipped';

export default async function handler(req: Request, res: Response) {
  try {
    const lotIdParam = req.params.lotId;
    const lotId = Array.isArray(lotIdParam) ? lotIdParam[0] : lotIdParam;
    if (!lotId || !String(lotId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'lotId is required.',
      });
    }

    const body = req.body as {
      action?: PackageLotEventAction;
      quantity?: number;
      quantityDelta?: number;
      releaseStatus?: PackageLotReleaseStatus;
      note?: string;
      reasonCode?: string;
      actor?: string;
      assetId?: string;
      assetCode?: string;
      assetCodes?: string[];
      metadata?: Record<string, unknown>;
    };

    if (!isPackageLotAction(body.action)) {
      return res.status(400).json({
        success: false,
        error:
          'action is required and must be one of release_status, ship, return, empty_return, rework, destroy, adjust, assign_asset, note.',
      });
    }
    if (body.releaseStatus !== undefined && !isReleaseStatus(body.releaseStatus)) {
      return res.status(400).json({
        success: false,
        error: 'releaseStatus must be held, ready, released, or shipped when provided.',
      });
    }

    const lot = await applyPackageLotAction({
      lotId: String(lotId).trim(),
      action: body.action,
      quantity: body.quantity,
      quantityDelta: body.quantityDelta,
      releaseStatus: body.releaseStatus,
      note: body.note,
      reasonCode: body.reasonCode,
      actor: body.actor,
      assetId: body.assetId,
      assetCode: body.assetCode,
      assetCodes: Array.isArray(body.assetCodes) ? body.assetCodes : undefined,
      metadata: body.metadata,
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: 'Package lot not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: lot,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update package lot.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
