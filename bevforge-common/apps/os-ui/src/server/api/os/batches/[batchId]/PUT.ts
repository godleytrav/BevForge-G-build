import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  getBatchById,
  updateBatchOutput,
} from '../../../../lib/inventory-batch-store.js';
import { validateMeasuredValues } from '../../../../lib/measurement-guards.js';
import { upsertCoreProduct } from '../../../../lib/product-catalog-store.js';
import type { BeverageClass } from '../../../../../features/products/types.js';
import { convertVolume } from '../../../../../lib/volume-format.js';

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

export default async function handler(req: Request, res: Response) {
  try {
    const batchIdParam = req.params.batchId;
    const batchId = Array.isArray(batchIdParam) ? batchIdParam[0] : batchIdParam;
    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: 'batchId is required.',
      });
    }
    const body = req.body as {
      producedQty?: number;
      unit?: string;
      recipeName?: string;
      skuId?: string;
      status?: 'in_progress' | 'completed' | 'released' | 'allocated' | 'shipped' | 'canceled';
      productionMode?: 'scheduled_runboard' | 'cellar';
      scheduledStartAt?: string;
      scheduledEndAt?: string;
      plannedVesselLabel?: string;
      plannedVesselKind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
      actualResults?: {
        og?: number;
        fg?: number;
        sgLatest?: number;
        abvPct?: number;
        phLatest?: number;
        brixLatest?: number;
        titratableAcidityGplLatest?: number;
        so2PpmLatest?: number;
        residualSugarGplLatest?: number;
        estimatedResidualSugarGplLatest?: number;
        volatileAcidityGplLatest?: number;
        freeSo2PpmLatest?: number;
        totalSo2PpmLatest?: number;
        dissolvedOxygenPpmLatest?: number;
        temperatureCLatest?: number;
        finalLabAbvPct?: number;
        finalLabPh?: number;
        finalLabBrix?: number;
        finalLabResidualSugarGpl?: number;
        finalLabTitratableAcidityGpl?: number;
        finalLabFreeSo2Ppm?: number;
        finalLabTotalSo2Ppm?: number;
        finalLabDissolvedOxygenPpm?: number;
        finalLabRecordedAt?: string;
        finalLabRecordedBy?: string;
        finalVolumeQty?: number;
        finalVolumeUnit?: string;
      };
      appendDeviation?: {
        field?:
          | 'step_duration'
          | 'hold_temperature'
          | 'gravity'
          | 'abv'
          | 'ph'
          | 'volume'
          | 'transfer'
          | 'packaging'
          | 'other';
        planned?: string | number | boolean;
        actual?: string | number | boolean;
        unit?: string;
        note?: string;
        source?: 'manual' | 'sensor' | 'automation';
        actor?: string;
        reasonCode?: string;
      };
      sourceInputs?: Array<{
        id?: string;
        category?: string;
        name?: string;
        lotCode?: string;
        sourceName?: string;
        quantity?: number;
        unit?: string;
        brix?: number;
        note?: string;
      }>;
      readingLog?: unknown[];
      treatmentLog?: unknown[];
      volumeCheckpoints?: unknown[];
      sensoryQcRecords?: unknown[];
      stageTimeline?: unknown[];
      packageLotIds?: string[];
      fulfillmentRequestIds?: string[];
      notes?: string;
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
    };

    const hasMutation =
      body.producedQty !== undefined ||
      body.unit !== undefined ||
      body.recipeName !== undefined ||
      body.skuId !== undefined ||
      body.status !== undefined ||
      body.productionMode !== undefined ||
      body.scheduledStartAt !== undefined ||
      body.scheduledEndAt !== undefined ||
      body.plannedVesselLabel !== undefined ||
      body.plannedVesselKind !== undefined ||
      body.actualResults !== undefined ||
      body.appendDeviation !== undefined ||
      body.sourceInputs !== undefined ||
      body.readingLog !== undefined ||
      body.treatmentLog !== undefined ||
      body.volumeCheckpoints !== undefined ||
      body.sensoryQcRecords !== undefined ||
      body.stageTimeline !== undefined ||
      body.packageLotIds !== undefined ||
      body.fulfillmentRequestIds !== undefined ||
      body.notes !== undefined ||
      body.product !== undefined;

    if (!hasMutation) {
      return res.status(400).json({
        success: false,
        error:
          'At least one batch update field is required (producedQty, unit, recipeName, skuId, status, productionMode, scheduledStartAt, scheduledEndAt, plannedVesselLabel, plannedVesselKind, actualResults, appendDeviation, sourceInputs, readingLog, treatmentLog, volumeCheckpoints, sensoryQcRecords, stageTimeline, packageLotIds, fulfillmentRequestIds, notes, product).',
      });
    }

    const existing = await getBatchById(batchId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found.',
      });
    }

    if (body.producedQty !== undefined && !Number.isFinite(Number(body.producedQty))) {
      return res.status(400).json({
        success: false,
        error: 'producedQty must be a finite number when provided.',
      });
    }

    if (body.appendDeviation && !body.appendDeviation.field) {
      return res.status(400).json({
        success: false,
        error: 'appendDeviation.field is required when appendDeviation is provided.',
      });
    }

    try {
      validateMeasuredValues({
        og: body.actualResults?.og,
        fg: body.actualResults?.fg,
        sgLatest: body.actualResults?.sgLatest,
        temperatureC: body.actualResults?.temperatureCLatest,
        ph: body.actualResults?.phLatest,
        abvPct: body.actualResults?.abvPct,
        brixLatest: body.actualResults?.brixLatest,
        titratableAcidityGplLatest: body.actualResults?.titratableAcidityGplLatest,
        so2PpmLatest: body.actualResults?.so2PpmLatest,
        residualSugarGplLatest: body.actualResults?.residualSugarGplLatest,
        volatileAcidityGplLatest: body.actualResults?.volatileAcidityGplLatest,
        freeSo2PpmLatest: body.actualResults?.freeSo2PpmLatest,
        totalSo2PpmLatest: body.actualResults?.totalSo2PpmLatest,
        dissolvedOxygenPpmLatest: body.actualResults?.dissolvedOxygenPpmLatest,
      });
      validateMeasuredValues({
        abvPct: body.actualResults?.finalLabAbvPct,
        ph: body.actualResults?.finalLabPh,
        brix: body.actualResults?.finalLabBrix,
        titratableAcidityGpl: body.actualResults?.finalLabTitratableAcidityGpl,
        residualSugarGpl: body.actualResults?.finalLabResidualSugarGpl,
        freeSo2Ppm: body.actualResults?.finalLabFreeSo2Ppm,
        totalSo2Ppm: body.actualResults?.finalLabTotalSo2Ppm,
        dissolvedOxygenPpm: body.actualResults?.finalLabDissolvedOxygenPpm,
      });
      for (const entry of body.readingLog ?? []) {
        if (!entry || typeof entry !== 'object') continue;
        const reading = entry as Record<string, unknown>;
        validateMeasuredValues({
          og: typeof reading.og === 'number' ? reading.og : undefined,
          fg: typeof reading.fg === 'number' ? reading.fg : undefined,
          sg: typeof reading.sg === 'number' ? reading.sg : undefined,
          temperatureC: typeof reading.temperatureC === 'number' ? reading.temperatureC : undefined,
          ph: typeof reading.ph === 'number' ? reading.ph : undefined,
          brix: typeof reading.brix === 'number' ? reading.brix : undefined,
          titratableAcidityGpl:
            typeof reading.titratableAcidityGpl === 'number'
              ? reading.titratableAcidityGpl
              : undefined,
          so2Ppm: typeof reading.so2Ppm === 'number' ? reading.so2Ppm : undefined,
          residualSugarGpl:
            typeof reading.residualSugarGpl === 'number' ? reading.residualSugarGpl : undefined,
          volatileAcidityGpl:
            typeof reading.volatileAcidityGpl === 'number'
              ? reading.volatileAcidityGpl
              : undefined,
          freeSo2Ppm: typeof reading.freeSo2Ppm === 'number' ? reading.freeSo2Ppm : undefined,
          totalSo2Ppm: typeof reading.totalSo2Ppm === 'number' ? reading.totalSo2Ppm : undefined,
          dissolvedOxygenPpm:
            typeof reading.dissolvedOxygenPpm === 'number'
              ? reading.dissolvedOxygenPpm
              : undefined,
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid measured values.',
      });
    }

    const productSnapshot =
      body.product !== undefined || body.recipeName !== undefined || body.skuId !== undefined
        ? (
            await upsertCoreProduct({
              productId: body.product?.productId ?? existing.productSnapshot?.productId,
              productCode: body.product?.productCode ?? existing.productSnapshot?.productCode,
              productName:
                String(body.product?.productName ?? '').trim() ||
                String(body.recipeName ?? existing.productSnapshot?.productName ?? existing.recipeName).trim() ||
                existing.recipeName,
              skuId: body.skuId ?? existing.skuId,
              beverageClass: body.product?.beverageClass ?? existing.productSnapshot?.beverageClass,
              images:
                body.product?.images ?? existing.productSnapshot?.images,
              sourceSuite: 'os',
            })
          ).snapshot
        : undefined;
    const appendDeviation = body.appendDeviation
      ? {
          ...body.appendDeviation,
          field: body.appendDeviation.field ?? 'other',
        }
      : undefined;

    const nextUnit = normalizeBatchUnit(body.unit ?? existing.unit);
    const nextProducedQty =
      body.producedQty !== undefined ? Number(body.producedQty) : Number(existing.producedQty);
    const producedQtyChanged =
      body.producedQty !== undefined || (body.unit !== undefined && nextUnit !== normalizeBatchUnit(existing.unit));
    const convertedExistingQty =
      nextUnit === normalizeBatchUnit(existing.unit)
        ? Number(existing.producedQty)
        : (convertVolume(Number(existing.producedQty), existing.unit, nextUnit) ?? Number(existing.producedQty));
    const autoVolumeDeviation =
      producedQtyChanged && !appendDeviation
        ? {
            field: 'volume' as const,
            planned: Number.isFinite(convertedExistingQty) ? convertedExistingQty : Number(existing.producedQty),
            actual: nextProducedQty,
            unit: nextUnit,
            note: 'Manual bulk quantity updated on batch record.',
            source: 'manual' as const,
            actor: undefined,
            reasonCode: 'manual_bulk_adjustment',
          }
        : undefined;

    const nextVolumeCheckpoints = [
      ...(body.volumeCheckpoints !== undefined ? body.volumeCheckpoints : (existing.volumeCheckpoints ?? [])),
    ];
    if (producedQtyChanged) {
      nextVolumeCheckpoints.push({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        stage: 'other',
        quantity: nextProducedQty,
        unit: nextUnit,
        note: `Auto bulk ledger checkpoint. Manual quantity update from ${Number(existing.producedQty)} ${existing.unit} to ${nextProducedQty} ${nextUnit}.`,
      });
    }

    const nextFinalVolumeQty = body.actualResults?.finalVolumeQty;
    const nextFinalVolumeUnit = body.actualResults?.finalVolumeUnit
      ? normalizeBatchUnit(body.actualResults.finalVolumeUnit)
      : normalizeBatchUnit(existing.actualResults?.finalVolumeUnit ?? nextUnit);
    const existingFinalVolumeQty = existing.actualResults?.finalVolumeQty;
    const finalVolumeChanged =
      body.actualResults?.finalVolumeQty !== undefined ||
      (body.actualResults?.finalVolumeUnit !== undefined &&
        nextFinalVolumeUnit !== normalizeBatchUnit(existing.actualResults?.finalVolumeUnit ?? nextUnit));
    if (finalVolumeChanged && Number.isFinite(Number(nextFinalVolumeQty))) {
      nextVolumeCheckpoints.push({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        stage: 'ending',
        quantity: Number(nextFinalVolumeQty),
        unit: nextFinalVolumeUnit,
        note:
          existingFinalVolumeQty !== undefined
            ? `Auto ending volume checkpoint. Updated from ${Number(existingFinalVolumeQty)} ${existing.actualResults?.finalVolumeUnit ?? nextFinalVolumeUnit} to ${Number(nextFinalVolumeQty)} ${nextFinalVolumeUnit}.`
            : `Auto ending volume checkpoint recorded at ${Number(nextFinalVolumeQty)} ${nextFinalVolumeUnit}.`,
      });
    }

    const updated = await updateBatchOutput({
      batchId,
      producedQty: nextProducedQty,
      unit: nextUnit,
      recipeName: body.recipeName ?? existing.recipeName,
      skuId: body.skuId ?? existing.skuId,
      status: body.status ?? existing.status,
      productionMode: body.productionMode ?? existing.productionMode,
      scheduledStartAt:
        body.scheduledStartAt !== undefined ? body.scheduledStartAt : existing.scheduledStartAt,
      scheduledEndAt:
        body.scheduledEndAt !== undefined ? body.scheduledEndAt : existing.scheduledEndAt,
      plannedVesselLabel:
        body.plannedVesselLabel !== undefined
          ? body.plannedVesselLabel
          : existing.plannedVesselLabel,
      plannedVesselKind:
        body.plannedVesselKind !== undefined
          ? body.plannedVesselKind
          : existing.plannedVesselKind,
      actualResults: body.actualResults,
      appendDeviation: appendDeviation ?? autoVolumeDeviation,
      sourceInputs: body.sourceInputs,
      readingLog: body.readingLog,
      treatmentLog: body.treatmentLog,
      volumeCheckpoints: nextVolumeCheckpoints,
      sensoryQcRecords: body.sensoryQcRecords,
      stageTimeline: body.stageTimeline,
      packageLotIds: body.packageLotIds,
      fulfillmentRequestIds: body.fulfillmentRequestIds,
      notes: body.notes,
      productSnapshot,
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Failed to update batch:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update batch.',
    });
  }
}
