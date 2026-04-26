import type { Request, Response } from 'express';
import { appendRecipeRunReading } from '../../../../../../lib/recipe-readings-store.js';
import { recordBatchReadingByRecipeRunId } from '../../../../../../lib/inventory-batch-store.js';
import { validateMeasuredValues } from '../../../../../../lib/measurement-guards.js';

const toOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const toCelsius = (fahrenheit: number): number =>
  ((fahrenheit - 32) * 5) / 9;

/**
 * POST /api/os/recipes/run/:runId/readings
 */
export default async function handler(req: Request, res: Response) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: 'runId is required.',
      });
    }

    const body = req.body as {
      stepId?: string;
      kind?:
        | 'og'
        | 'fg'
        | 'sg'
        | 'temp'
        | 'ph'
        | 'abv'
        | 'brix'
        | 'ta'
        | 'so2'
        | 'residual_sugar'
        | 'va'
        | 'free_so2'
        | 'total_so2'
        | 'do'
        | 'snapshot'
        | 'note';
      source?: 'manual' | 'sensor';
      recordedAt?: string;
      temperatureC?: number;
      temperatureF?: number;
      sg?: number;
      ph?: number;
      abvPct?: number;
      brix?: number;
      titratableAcidityGpl?: number;
      so2Ppm?: number;
      residualSugarGpl?: number;
      volatileAcidityGpl?: number;
      freeSo2Ppm?: number;
      totalSo2Ppm?: number;
      dissolvedOxygenPpm?: number;
      note?: string;
    };

    const temperatureC =
      toOptionalNumber(body.temperatureC) ??
      (toOptionalNumber(body.temperatureF) !== undefined
        ? toCelsius(Number(body.temperatureF))
        : undefined);
    const sg = toOptionalNumber(body.sg);
    const ph = toOptionalNumber(body.ph);
    const brix = toOptionalNumber(body.brix);
    const titratableAcidityGpl = toOptionalNumber(body.titratableAcidityGpl);
    const so2Ppm = toOptionalNumber(body.so2Ppm);
    const residualSugarGpl = toOptionalNumber(body.residualSugarGpl);
    const volatileAcidityGpl = toOptionalNumber(body.volatileAcidityGpl);
    const freeSo2Ppm = toOptionalNumber(body.freeSo2Ppm);
    const totalSo2Ppm = toOptionalNumber(body.totalSo2Ppm);
    const dissolvedOxygenPpm = toOptionalNumber(body.dissolvedOxygenPpm);
    const abvPct = body.source === 'sensor' ? toOptionalNumber(body.abvPct) : undefined;

    if (body.source !== 'sensor' && body.kind === 'abv') {
      return res.status(400).json({
        success: false,
        error: 'ABV is calculated from gravity and cannot be manually recorded here.',
      });
    }
    if ((body.kind === 'og' || body.kind === 'fg' || body.kind === 'sg') && sg === undefined) {
      return res.status(400).json({
        success: false,
        error: `${body.kind.toUpperCase()} readings require a gravity value.`,
      });
    }

    validateMeasuredValues({
      sg,
      temperatureC,
      ph,
      abvPct,
      brix,
      titratableAcidityGpl,
      so2Ppm,
      residualSugarGpl,
      volatileAcidityGpl,
      freeSo2Ppm,
      totalSo2Ppm,
      dissolvedOxygenPpm,
    });

    const reading = await appendRecipeRunReading({
      runId: String(runId).trim(),
      stepId: body.stepId,
      kind: body.kind,
      source: body.source === 'sensor' ? 'sensor' : 'manual',
      recordedAt: body.recordedAt,
      temperatureC,
      sg,
      ph,
      abvPct,
      brix,
      titratableAcidityGpl,
      so2Ppm,
      residualSugarGpl,
      volatileAcidityGpl,
      freeSo2Ppm,
      totalSo2Ppm,
      dissolvedOxygenPpm,
      note: body.note,
    });

    const batch = await recordBatchReadingByRecipeRunId({
      recipeRunId: String(runId).trim(),
      kind: body.kind,
      temperatureC,
      sg,
      ph,
      abvPct,
      brix,
      titratableAcidityGpl,
      so2Ppm,
      residualSugarGpl,
      volatileAcidityGpl,
      freeSo2Ppm,
      totalSo2Ppm,
      dissolvedOxygenPpm,
      note: body.note,
    });

    return res.status(200).json({
      success: true,
      data: {
        reading,
        batchId: batch?.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to append recipe reading.';
    const statusCode = message.startsWith('Recipe run not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
