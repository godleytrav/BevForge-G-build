import type { Request, Response } from 'express';
import type { TransferRouteKey } from '../../../../../../lib/commissioning-store.js';
import {
  readCanvasProject,
  readTransferRouteMap,
  writeCanvasProject,
} from '../../../../../../lib/commissioning-store.js';
import { recipeRunner } from '../../../../../../lib/recipe-runner.js';
import {
  applyTransferRouteToProject,
  inferTransferRouteKey,
  resolveRunAndCurrentStep,
} from '../../../../../../lib/transfer-routes.js';

const validRouteKeys: TransferRouteKey[] = [
  'hlt_to_mash',
  'mash_to_kettle',
  'kettle_to_fermenter',
  'fermenter_to_bright',
  'bright_to_packaging',
];

/**
 * POST /api/os/recipes/run/:runId/transfer
 *
 * Body:
 * - action: "start" | "complete"
 * - routeKey?: TransferRouteKey
 * - armConfirmed?: boolean
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
      action?: 'start' | 'complete';
      routeKey?: TransferRouteKey;
      armConfirmed?: boolean;
    };
    const action = body?.action;
    if (action !== 'start' && action !== 'complete') {
      return res.status(400).json({
        success: false,
        error: 'action must be "start" or "complete".',
      });
    }

    const runs = await recipeRunner.snapshot();
    const runState = resolveRunAndCurrentStep(runs, runId);
    if (!runState) {
      return res.status(404).json({
        success: false,
        error: 'Run not found.',
      });
    }
    const { step, run } = runState;
    if (!step) {
      return res.status(409).json({
        success: false,
        error: 'No active recipe step for transfer.',
      });
    }

    const inferred = inferTransferRouteKey(step);
    const routeKey = validRouteKeys.includes(body?.routeKey as TransferRouteKey)
      ? (body?.routeKey as TransferRouteKey)
      : inferred;
    if (!routeKey) {
      return res.status(409).json({
        success: false,
        error: 'Unable to determine transfer route for current step.',
      });
    }

    const [map, project] = await Promise.all([
      readTransferRouteMap(),
      readCanvasProject(),
    ]);
    const route = map.routes?.[routeKey];
    if (!route || route.enabled === false) {
      return res.status(409).json({
        success: false,
        error: `Transfer route "${routeKey}" is not configured.`,
      });
    }

    if (
      action === 'start' &&
      route.requireArmConfirm === true &&
      body.armConfirmed !== true
    ) {
      return res.status(409).json({
        success: false,
        error: 'Packaging transfer requires explicit arm confirmation.',
        requiresArmConfirm: true,
        routeKey,
      });
    }

    const result = applyTransferRouteToProject(project, route, action);
    if (result.appliedNodeIds.length === 0) {
      return res.status(409).json({
        success: false,
        error: `No mapped pump/valve/controller nodes found for route "${routeKey}".`,
      });
    }

    const updatedProject = await writeCanvasProject(result.project);
    return res.status(200).json({
      success: true,
      data: {
        runId: run.runId,
        recipeName: run.recipeName,
        stepId: step.id,
        stepName: step.name,
        routeKey,
        action,
        appliedNodeIds: result.appliedNodeIds,
        projectUpdatedAt: updatedProject.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to execute transfer route:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute transfer route.',
    });
  }
}
