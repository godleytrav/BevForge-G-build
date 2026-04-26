const nowId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const normalizeStep = (step, index) => ({
  id: step.id ?? nowId(`step-${index + 1}`),
  kind: step.kind ?? "command",
  targetDeviceId: step.targetDeviceId,
  command: step.command,
  value: step.value,
  delayMs: step.delayMs ? Math.max(0, Number(step.delayMs)) : void 0,
  requireUserProceed: step.requireUserProceed
});
const buildPlanFromCanvasAutomation = (definition) => ({
  schemaVersion: "0.1.0",
  id: nowId("plan"),
  sourceType: "canvas_automation",
  sourceId: definition.id,
  metadata: {
    name: definition.name ?? definition.id
  },
  steps: (definition.steps ?? []).map(
    (step, index) => normalizeStep(
      {
        id: step.id,
        kind: step.delayMs ? "delay" : "command",
        targetDeviceId: step.targetDeviceId,
        command: step.command,
        value: step.value,
        delayMs: step.delayMs
      },
      index
    )
  )
});
const buildPlanFromRecipe = (recipe) => {
  const steps = [];
  for (const [index, recipeStep] of (recipe.steps ?? []).entries()) {
    steps.push(
      normalizeStep(
        {
          id: recipeStep.id ?? nowId(`recipe-step-${index + 1}`),
          kind: "command",
          targetDeviceId: recipeStep.targetDeviceId,
          command: recipeStep.command ?? "trigger",
          value: recipeStep.value ?? true,
          requireUserProceed: recipeStep.requiresUserConfirm ?? false
        },
        index
      )
    );
    if (recipeStep.durationMin && recipeStep.durationMin > 0) {
      steps.push(
        normalizeStep(
          {
            kind: "delay",
            delayMs: Math.round(recipeStep.durationMin * 6e4)
          },
          index + 1e3
        )
      );
    }
  }
  return {
    schemaVersion: "0.1.0",
    id: nowId("plan"),
    sourceType: "recipe",
    sourceId: recipe.id,
    metadata: {
      name: recipe.name ?? recipe.id
    },
    steps
  };
};

async function handler(req, res) {
  try {
    const mode = String(req.body?.mode ?? "");
    if (mode === "canvas") {
      const definition = req.body?.definition;
      if (!definition?.id || !Array.isArray(definition.steps)) {
        return res.status(400).json({
          success: false,
          error: "Invalid canvas automation definition."
        });
      }
      const plan = buildPlanFromCanvasAutomation(definition);
      return res.status(200).json({
        success: true,
        data: plan
      });
    }
    if (mode === "recipe") {
      const definition = req.body?.definition;
      if (!definition?.id || !Array.isArray(definition.steps)) {
        return res.status(400).json({
          success: false,
          error: "Invalid recipe execution definition."
        });
      }
      const plan = buildPlanFromRecipe(definition);
      return res.status(200).json({
        success: true,
        data: plan
      });
    }
    return res.status(400).json({
      success: false,
      error: 'mode must be "canvas" or "recipe".'
    });
  } catch (error) {
    console.error("Automation preview failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to build execution plan."
    });
  }
}

export { handler as h };
