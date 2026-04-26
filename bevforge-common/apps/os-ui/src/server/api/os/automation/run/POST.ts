import type { Request, Response } from 'express';
import { automationRunner } from '../../../../lib/automation-runner.js';
import { readCanvasProject } from '../../../../lib/commissioning-store.js';
import type { CanvasNode } from '../../../../../features/canvas/types.js';

const toSteps = (node: CanvasNode) => {
  const mode = node.data.config.automationMode ?? 'simple';
  if (mode === 'advanced') {
    return (node.data.config.automationSteps ?? []).map((step, index) => ({
      id: step.id ?? `step-${index + 1}`,
      label: step.label,
      targetDeviceId: step.targetDeviceId,
      command: step.command,
      value: step.value,
      delayMs: step.delayMs,
    }));
  }

  const rule = node.data.config.simpleAutomation;
  if (!rule) return [];
  return [
    {
      id: 'simple-on',
      label: 'Simple Mode On Action',
      targetDeviceId: rule.targetDeviceId,
      command: rule.command,
      value: rule.onValue,
      delayMs: 0,
    },
  ];
};

/**
 * POST /api/os/automation/run
 *
 * Starts a backend automation run scaffold for an automation node.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { nodeId } = req.body as { nodeId?: string };
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        error: 'nodeId is required.',
      });
    }

    const project = await readCanvasProject();
    const page = project.pages.find((candidate) =>
      (candidate.nodes ?? []).some((node) => node.id === nodeId)
    );
    const node = page?.nodes?.find((candidate) => candidate.id === nodeId) as CanvasNode | undefined;

    if (!node || node.data.widgetType !== 'automation') {
      return res.status(404).json({
        success: false,
        error: 'Automation node not found.',
      });
    }

    const steps = toSteps(node);
    if (steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Automation node has no runnable steps.',
      });
    }

    const run = await automationRunner.startRun({
      nodeId: node.id,
      pageId: page?.id,
      steps,
    });

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error('Failed to start automation run:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start automation run.',
    });
  }
}
