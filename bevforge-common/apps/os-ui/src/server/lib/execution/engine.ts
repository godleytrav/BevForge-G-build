import type {
  CanvasAutomationDefinition,
  ExecutionPlan,
  ExecutionStep,
  RecipeExecutionDefinition,
} from './types.js';

const nowId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeStep = (step: Partial<ExecutionStep>, index: number): ExecutionStep => ({
  id: step.id ?? nowId(`step-${index + 1}`),
  kind: step.kind ?? 'command',
  targetDeviceId: step.targetDeviceId,
  command: step.command,
  value: step.value,
  delayMs: step.delayMs ? Math.max(0, Number(step.delayMs)) : undefined,
  requireUserProceed: step.requireUserProceed,
});

export const buildPlanFromCanvasAutomation = (
  definition: CanvasAutomationDefinition
): ExecutionPlan => ({
  schemaVersion: '0.1.0',
  id: nowId('plan'),
  sourceType: 'canvas_automation',
  sourceId: definition.id,
  metadata: {
    name: definition.name ?? definition.id,
  },
  steps: (definition.steps ?? []).map((step, index) =>
    normalizeStep(
      {
        id: step.id,
        kind: step.delayMs ? 'delay' : 'command',
        targetDeviceId: step.targetDeviceId,
        command: step.command,
        value: step.value,
        delayMs: step.delayMs,
      },
      index
    )
  ),
});

export const buildPlanFromRecipe = (
  recipe: RecipeExecutionDefinition
): ExecutionPlan => {
  const steps: ExecutionStep[] = [];
  for (const [index, recipeStep] of (recipe.steps ?? []).entries()) {
    steps.push(
      normalizeStep(
        {
          id: recipeStep.id ?? nowId(`recipe-step-${index + 1}`),
          kind: 'command',
          targetDeviceId: recipeStep.targetDeviceId,
          command: recipeStep.command ?? 'trigger',
          value: recipeStep.value ?? true,
          requireUserProceed: recipeStep.requiresUserConfirm ?? false,
        },
        index
      )
    );
    if (recipeStep.durationMin && recipeStep.durationMin > 0) {
      steps.push(
        normalizeStep(
          {
            kind: 'delay',
            delayMs: Math.round(recipeStep.durationMin * 60_000),
          },
          index + 1000
        )
      );
    }
  }

  return {
    schemaVersion: '0.1.0',
    id: nowId('plan'),
    sourceType: 'recipe',
    sourceId: recipe.id,
    metadata: {
      name: recipe.name ?? recipe.id,
    },
    steps,
  };
};
