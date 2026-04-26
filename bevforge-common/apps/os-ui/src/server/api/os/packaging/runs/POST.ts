import type { Request, Response } from 'express';
import { createPackagingRun } from '../../../../lib/process-runs-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      sourceBatchId?: string;
      siteId?: string;
      mode?: 'manual' | 'auto';
      packageType?: 'keg' | 'can' | 'bottle' | 'case' | 'pallet' | 'other';
      packageFormatCode?: string;
      containerStyle?: string;
      outputSkuId?: string;
      operator?: string;
      packageLineLabel?: string;
      lossReasonCode?: string;
      rejectionReasonCode?: string;
      assetId?: string;
      assetCode?: string;
      assetCodes?: string[];
      plannedUnits?: number;
      notes?: string;
      complianceSnapshot?: {
        beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
        brandName?: string;
        productName?: string;
        classDesignation?: string;
        taxClass?: 'hard_cider' | 'still_wine' | 'sparkling_wine' | 'beer' | 'other';
        colaReference?: string;
        formulaReference?: string;
        abvPct?: number;
        netContentsStatement?: string;
        appellation?: string;
        vintageYear?: string;
        sulfiteDeclaration?: string;
        healthWarningIncluded?: boolean;
        interstateSale?: boolean;
        formulaRequired?: boolean;
        fdaLabelReviewComplete?: boolean;
        ingredientStatementReviewed?: boolean;
        allergenReviewComplete?: boolean;
        hardCiderQualified?: boolean;
        notes?: string;
      };
    };

    if (!body.sourceBatchId || !String(body.sourceBatchId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'sourceBatchId is required.',
      });
    }
    if (!body.packageType) {
      return res.status(400).json({
        success: false,
        error: 'packageType is required.',
      });
    }
    const run = await createPackagingRun({
      sourceBatchId: String(body.sourceBatchId).trim(),
      siteId: body.siteId,
      mode: body.mode,
      packageType: body.packageType,
      packageFormatCode: body.packageFormatCode,
      containerStyle: body.containerStyle ? String(body.containerStyle).trim() : undefined,
      outputSkuId: body.outputSkuId ? String(body.outputSkuId).trim() : undefined,
      operator: body.operator ? String(body.operator).trim() : undefined,
      packageLineLabel: body.packageLineLabel ? String(body.packageLineLabel).trim() : undefined,
      lossReasonCode: body.lossReasonCode ? String(body.lossReasonCode).trim() : undefined,
      rejectionReasonCode:
        body.rejectionReasonCode ? String(body.rejectionReasonCode).trim() : undefined,
      assetId: body.assetId ? String(body.assetId).trim() : undefined,
      assetCode: body.assetCode ? String(body.assetCode).trim() : undefined,
      assetCodes: Array.isArray(body.assetCodes) ? body.assetCodes : undefined,
      plannedUnits: Number(body.plannedUnits ?? 0),
      notes: body.notes,
      complianceSnapshot: body.complianceSnapshot,
    });

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create packaging run.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
