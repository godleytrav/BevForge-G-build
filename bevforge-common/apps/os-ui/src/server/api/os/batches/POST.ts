import type { Request, Response } from 'express';
import { createManualBatch, getBatchById } from '../../../lib/inventory-batch-store.js';
import { upsertCoreProduct } from '../../../lib/product-catalog-store.js';
import type { BeverageClass } from '../../../../features/products/types.js';

const normalizeBatchUnit = (value: unknown): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'bbl' || normalized === 'bbls' || normalized === 'barrel' || normalized === 'barrels') {
    return 'bbl';
  }
  if (
    normalized === 'gal' ||
    normalized === 'gals' ||
    normalized === 'gallon' ||
    normalized === 'gallons' ||
    normalized === 'g'
  ) {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return 'bbl';
};

/**
 * POST /api/os/batches
 *
 * Creates a manual batch record without changing recipe-run automation behavior.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      recipeName?: string;
      recipeId?: string;
      recipeRunId?: string;
      sourceBatchId?: string;
      skuId?: string;
      siteId?: string;
      lotCode?: string;
      producedQty?: number;
      unit?: string;
      status?: 'planned' | 'in_progress';
      batchKind?: 'source' | 'derived';
      productionMode?: 'scheduled_runboard' | 'cellar';
      scheduledStartAt?: string;
      scheduledEndAt?: string;
      plannedVesselLabel?: string;
      plannedVesselKind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
      product?: {
        productId?: string;
        productCode?: string;
        productName?: string;
        beverageClass?: BeverageClass;
        images?: {
          thumbnailUrl?: string;
          cardImageUrl?: string;
          fullImageUrl?: string;
        };
      };
      intendedRecipeTargets?: {
        targetAbvPct?: number;
        targetResidualSugarPct?: number;
        targetResidualSugarGpl?: number;
        targetSweetnessLevel?: 'bone_dry' | 'semi_dry' | 'semi_sweet' | 'sweet';
      };
      sourceInputs?: Array<{
        id?: string;
        category?: string;
        name?: string;
        lotCode?: string;
        sourceName?: string;
        quantity?: number;
        unit?: string;
        note?: string;
      }>;
      readingLog?: unknown[];
      treatmentLog?: unknown[];
      volumeCheckpoints?: unknown[];
      sensoryQcRecords?: unknown[];
      stageTimeline?: unknown[];
    };

    const batchKind = body.batchKind === 'derived' ? 'derived' : 'source';
    const sourceBatchId = String(body.sourceBatchId ?? '').trim();
    const sourceBatch = sourceBatchId ? await getBatchById(sourceBatchId) : null;

    if (sourceBatchId && !sourceBatch) {
      return res.status(404).json({
        success: false,
        error: 'Selected source batch no longer exists.',
      });
    }

    if (batchKind === 'derived' && !sourceBatch) {
      return res.status(400).json({
        success: false,
        error: 'Derived batches must be created from an active source batch.',
      });
    }

    if (sourceBatch) {
      const availableQty = Math.max(
        0,
        sourceBatch.producedQty - sourceBatch.allocatedQty - (sourceBatch.dispensedQty ?? 0)
      );
      const sourceEligible =
        sourceBatch.batchKind !== 'derived' &&
        sourceBatch.status !== 'planned' &&
        sourceBatch.status !== 'canceled' &&
        sourceBatch.status !== 'shipped' &&
        availableQty > 0;
      if (batchKind === 'derived' && !sourceEligible) {
        return res.status(409).json({
          success: false,
          error: 'Selected source batch is no longer eligible for a derived split.',
        });
      }
    }

    const recipeName = String(body.recipeName ?? sourceBatch?.recipeName ?? '').trim();
    if (!recipeName) {
      return res.status(400).json({
        success: false,
        error: 'recipeName is required.',
      });
    }

    if (
      body.status !== undefined &&
      body.status !== 'planned' &&
      body.status !== 'in_progress'
    ) {
      return res.status(400).json({
        success: false,
        error: 'status must be planned or in_progress.',
      });
    }

    const resolvedSkuId = String(body.skuId ?? sourceBatch?.skuId ?? '').trim() || undefined;
    const resolvedSiteId = String(body.siteId ?? sourceBatch?.siteId ?? 'main').trim() || 'main';
    const resolvedUnit = normalizeBatchUnit(body.unit ?? sourceBatch?.unit ?? 'L');
    const resolvedStatus =
      body.status ?? (batchKind === 'derived' ? 'in_progress' : 'planned');
    const resolvedVesselLabel = String(body.plannedVesselLabel ?? '').trim();
    const resolvedVesselKind = resolvedVesselLabel ? body.plannedVesselKind : undefined;
    const enteredContainerAt =
      resolvedStatus === 'in_progress' && resolvedVesselLabel ? new Date().toISOString() : undefined;

    const productBinding = await upsertCoreProduct({
      productId: body.product?.productId ?? sourceBatch?.productSnapshot?.productId,
      productCode: body.product?.productCode ?? sourceBatch?.productSnapshot?.productCode,
      productName:
        String(body.product?.productName ?? sourceBatch?.productSnapshot?.productName ?? '').trim() ||
        recipeName,
      skuId: resolvedSkuId,
      beverageClass: body.product?.beverageClass ?? sourceBatch?.productSnapshot?.beverageClass,
      images: body.product?.images ?? sourceBatch?.productSnapshot?.images,
      sourceSuite: 'os',
    });

    const batch = await createManualBatch({
      recipeName,
      recipeId: body.recipeId ?? sourceBatch?.recipeId,
      recipeRunId: body.recipeRunId,
      skuId: resolvedSkuId,
      siteId: resolvedSiteId,
      lotCode: body.lotCode,
      producedQty: body.producedQty,
      unit: resolvedUnit,
      status: resolvedStatus,
      batchKind,
      productionMode: body.productionMode ?? (batchKind === 'derived' ? 'cellar' : undefined),
      scheduledStartAt: body.scheduledStartAt,
      scheduledEndAt: body.scheduledEndAt,
      plannedVesselLabel: resolvedVesselLabel || undefined,
      plannedVesselKind: resolvedVesselKind,
      rootBatchId: sourceBatch?.rootBatchId ?? sourceBatch?.id,
      parentBatchId: sourceBatch?.id,
      parentBatchCode: sourceBatch?.batchCode ?? sourceBatch?.lotCode,
      containerLabel: resolvedVesselLabel || undefined,
      containerKind: resolvedVesselKind,
      enteredContainerAt,
      productSnapshot: productBinding.snapshot,
      intendedRecipeTargets:
        body.intendedRecipeTargets ?? sourceBatch?.intendedRecipe?.targets,
      actualResults: sourceBatch?.actualResults,
      sourceInputs: body.sourceInputs,
      readingLog: body.readingLog,
      treatmentLog: body.treatmentLog,
      volumeCheckpoints: body.volumeCheckpoints,
      sensoryQcRecords: body.sensoryQcRecords,
      stageTimeline: body.stageTimeline,
    });

    return res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create manual batch.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
