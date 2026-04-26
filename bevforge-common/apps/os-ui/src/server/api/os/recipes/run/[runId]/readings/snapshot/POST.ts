import type { Request, Response } from 'express';
import { readCanvasProject } from '../../../../../../../lib/commissioning-store.js';
import { recipeRunner } from '../../../../../../../lib/recipe-runner.js';
import { appendRecipeRunReading } from '../../../../../../../lib/recipe-readings-store.js';
import { recordBatchReadingByRecipeRunId } from '../../../../../../../lib/inventory-batch-store.js';
import { validateMeasuredValues } from '../../../../../../../lib/measurement-guards.js';
import type { CanvasNode } from '../../../../../../../../features/canvas/types.js';

const toOptionalNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const sensorValue = (node: CanvasNode): number | undefined => {
  const config = node.data.config ?? {};
  const direct = toOptionalNumber(config.value);
  if (direct !== undefined) return direct;
  const dummy = toOptionalNumber(config.dummyValue);
  if (dummy !== undefined) return dummy;
  return undefined;
};

/**
 * POST /api/os/recipes/run/:runId/readings/snapshot
 *
 * Captures current sensor values from commissioned canvas and appends one sensor reading.
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

    const [project, runs] = await Promise.all([readCanvasProject(), recipeRunner.snapshot()]);
    const run = runs.find((entry) => entry.runId === runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Run not found.',
      });
    }

    const sourcePages =
      (project.pages ?? []).filter((page) => page.mode === 'published').length > 0
        ? (project.pages ?? []).filter((page) => page.mode === 'published')
        : (project.pages ?? []);
    const sensors = sourcePages
      .flatMap((page) => page.nodes ?? [])
      .filter((node) => node.data.widgetType === 'sensor');

    let temperatureC: number | undefined;
    let sg: number | undefined;
    let ph: number | undefined;
    let abvPct: number | undefined;
    let brix: number | undefined;
    let titratableAcidityGpl: number | undefined;
    let so2Ppm: number | undefined;
    const labels: string[] = [];

    for (const sensor of sensors) {
      const type = String(sensor.data.config.sensorType ?? 'temperature').toLowerCase();
      const value = sensorValue(sensor);
      if (value === undefined) continue;
      labels.push(sensor.data.label);
      if (type === 'temperature' && temperatureC === undefined) {
        const unit = String(sensor.data.config.unit ?? 'C').toUpperCase();
        temperatureC = unit === 'F' ? ((value - 32) * 5) / 9 : value;
      } else if (type === 'sg' && sg === undefined) {
        sg = value;
      } else if (type === 'ph' && ph === undefined) {
        ph = value;
      } else if (type === 'abv' && abvPct === undefined) {
        abvPct = value;
      } else if (type === 'brix' && brix === undefined) {
        brix = value;
      } else if ((type === 'ta' || type === 'titratable_acidity') && titratableAcidityGpl === undefined) {
        titratableAcidityGpl = value;
      } else if ((type === 'so2' || type === 'sulfite') && so2Ppm === undefined) {
        so2Ppm = value;
      }
    }

    const step = run.steps[run.currentStepIndex];
    if (temperatureC === undefined && step?.temperatureC !== undefined) {
      temperatureC = step.temperatureC;
    }

    if (
      temperatureC === undefined &&
      sg === undefined &&
      ph === undefined &&
      abvPct === undefined &&
      brix === undefined &&
      titratableAcidityGpl === undefined &&
      so2Ppm === undefined
    ) {
      return res.status(409).json({
        success: false,
        error: 'No sensor values available to capture.',
      });
    }

    validateMeasuredValues({
      temperatureC,
      sg,
      ph,
      abvPct,
      brix,
      titratableAcidityGpl,
      so2Ppm,
    });

    const reading = await appendRecipeRunReading({
      runId: String(runId).trim(),
      stepId: step?.id,
      kind: 'snapshot',
      source: 'sensor',
      temperatureC,
      sg,
      ph,
      abvPct,
      brix,
      titratableAcidityGpl,
      so2Ppm,
      note:
        labels.length > 0
          ? `Canvas snapshot from sensors: ${labels.slice(0, 6).join(', ')}${
              labels.length > 6 ? '...' : ''
            }`
          : 'Canvas snapshot from active step',
    });

    await recordBatchReadingByRecipeRunId({
      recipeRunId: String(runId).trim(),
      kind: 'snapshot',
      temperatureC,
      sg,
      ph,
      abvPct,
      brix,
      titratableAcidityGpl,
      so2Ppm,
      note:
        labels.length > 0
          ? `Canvas snapshot from sensors: ${labels.slice(0, 6).join(', ')}${
              labels.length > 6 ? '...' : ''
            }`
          : 'Canvas snapshot from active step',
    });

    return res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to capture sensor snapshot.';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
