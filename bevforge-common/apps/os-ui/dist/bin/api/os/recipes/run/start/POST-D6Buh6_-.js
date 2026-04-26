import { l as readImportedRecipes, d as readCanvasProject, m as readDevices, n as readEquipmentRoleMap } from '../../import/POST-B16W0CFH.js';
import { j as checkInventoryForRecipe, k as createBatchFromRecipeRun, l as reserveInventoryForRecipeRun } from '../../../../calendar/events/GET-DNBekL63.js';
import { j as recipeRunner } from '../../../../../index-BiQ9ukMS.js';
import { b as buildRecipePreflightReport } from '../../preflight/POST-CjPXUHbZ.js';

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();
const normalizeTargetId = (value) => normalizeText(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const validCommands = /* @__PURE__ */ new Set([
  "on_off",
  "open_close",
  "route",
  "set_value",
  "trigger"
]);
const targetAliasRoleCandidates = {
  mash_heater: ["heat_source_primary"],
  kettle_heater: ["heat_source_primary"],
  hlt_heater: ["heat_source_primary"],
  mash_temp_sensor: ["temp_sensor_mash"],
  ferment_temp_sensor: ["temp_sensor_fermenter"],
  ferment_temp_control: ["temp_sensor_fermenter", "glycol_pump", "glycol_supply_valve"],
  chiller_loop: ["glycol_pump", "glycol_supply_valve"],
  glycol_loop: ["glycol_pump", "glycol_supply_valve"],
  transfer_pump: ["transfer_pump_primary"],
  transfer_path: ["transfer_pump_primary"],
  heat_source_primary: ["heat_source_primary"],
  transfer_pump_primary: ["transfer_pump_primary"],
  glycol_pump: ["glycol_pump"],
  glycol_supply_valve: ["glycol_supply_valve"],
  hlt_vessel: ["hlt_vessel"],
  mash_tun_vessel: ["mash_tun_vessel"],
  boil_kettle_vessel: ["boil_kettle_vessel"],
  fermenter_primary: ["fermenter_primary"],
  temp_sensor_mash: ["temp_sensor_mash"],
  temp_sensor_fermenter: ["temp_sensor_fermenter"]
};
const commandFromStep = (step) => {
  if (step.command && validCommands.has(step.command)) {
    return step.command;
  }
  if (typeof step.temperatureC === "number" && Number.isFinite(step.temperatureC)) {
    return "set_value";
  }
  const actionText = `${normalizeText(step.stage)} ${normalizeText(step.action)} ${normalizeText(step.name)}`;
  if (actionText.includes("route") || actionText.includes("valve")) {
    return "route";
  }
  if (actionText.includes("toggle")) {
    return "on_off";
  }
  if (actionText.includes("transfer") || actionText.includes("pump") || actionText.includes("heat") || actionText.includes("cool")) {
    return "trigger";
  }
  return step.command;
};
const inferAliasFromStep = (step) => {
  const actionText = `${normalizeText(step.stage)} ${normalizeText(step.action)} ${normalizeText(step.name)}`;
  const isIngredientAdd = actionText.includes("hop_add") || actionText.includes("hop add") || actionText.includes("ingredient add") || actionText.includes("add ingredient");
  if (isIngredientAdd) return void 0;
  if (actionText.includes("cold_crash") || actionText.includes("cold crash") || actionText.includes("chill") || actionText.includes("cool")) {
    return "chiller_loop";
  }
  if (actionText.includes("ferment") || actionText.includes("diacetyl") || actionText.includes("hold_temp")) {
    return "ferment_temp_control";
  }
  if (actionText.includes("boil")) {
    return "kettle_heater";
  }
  if (actionText.includes("mash") || actionText.includes("strike") || actionText.includes("heat")) {
    return "mash_heater";
  }
  if (actionText.includes("transfer") || actionText.includes("pump")) {
    return "transfer_pump";
  }
  return void 0;
};
const nodeRef = (node) => node.data.logicalDeviceId ?? `node:${node.id}`;
const compileRecipeForExecution = (recipe, project, devices, equipmentRoleMap) => {
  const publishedPages = (project.pages ?? []).filter((page) => page.mode === "published");
  const sourcePages = publishedPages.length > 0 ? publishedPages : project.pages ?? [];
  const nodes = sourcePages.flatMap((page) => page.nodes ?? []);
  const roleMappings = equipmentRoleMap?.roles ?? {};
  const nodesById = /* @__PURE__ */ new Map();
  const nodesByLogicalId = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    nodesById.set(node.id, node);
    if (node.data.logicalDeviceId) {
      nodesByLogicalId.set(node.data.logicalDeviceId, node);
    }
  }
  const devicesById = /* @__PURE__ */ new Map();
  for (const device of devices) {
    devicesById.set(device.id, device);
  }
  const nodesOfType = (widgetTypes) => nodes.filter((node) => widgetTypes.includes(node.data.widgetType));
  const mappedRoleRef = (role) => {
    const mappedValue = roleMappings[role];
    if (!mappedValue) return void 0;
    const normalized = String(mappedValue).trim();
    if (!normalized) return void 0;
    if (normalized.startsWith("node:")) {
      const node = nodesById.get(normalized.slice("node:".length));
      return node ? nodeRef(node) : void 0;
    }
    const byLogical = nodesByLogicalId.get(normalized);
    if (byLogical) return nodeRef(byLogical);
    const byNodeId = nodesById.get(normalized);
    if (byNodeId) return nodeRef(byNodeId);
    if (devicesById.has(normalized)) {
      const byDeviceNode = nodesByLogicalId.get(normalized);
      return byDeviceNode ? nodeRef(byDeviceNode) : void 0;
    }
    return void 0;
  };
  const fallbackRefForRole = (role) => {
    if (role === "heat_source_primary") {
      const node = nodesOfType(["hlt_controller", "heater", "pid"])[0] ?? nodesOfType(["vessel"]).find(
        (candidate) => normalizeText(candidate.data.config.vesselType).includes("hlt")
      );
      return node ? nodeRef(node) : void 0;
    }
    if (role === "transfer_pump_primary") {
      const node = nodesOfType(["transfer_controller"])[0] ?? nodesOfType(["pump"])[0];
      return node ? nodeRef(node) : void 0;
    }
    if (role === "glycol_pump" || role === "glycol_supply_valve") {
      const node = nodesOfType(["glycol_controller"])[0] ?? nodesOfType(["pump", "valve"])[0];
      return node ? nodeRef(node) : void 0;
    }
    if (role === "temp_sensor_mash" || role === "temp_sensor_fermenter") {
      const node = nodesOfType(["sensor"])[0];
      return node ? nodeRef(node) : void 0;
    }
    if (role === "mash_tun_vessel" || role === "boil_kettle_vessel" || role === "fermenter_primary" || role === "hlt_vessel") {
      const node = nodesOfType(["vessel"])[0];
      return node ? nodeRef(node) : void 0;
    }
    return void 0;
  };
  const resolveRoleAliasToRef = (alias) => {
    const roles = targetAliasRoleCandidates[alias] ?? [];
    for (const role of roles) {
      const mapped = mappedRoleRef(role);
      if (mapped) return mapped;
    }
    for (const role of roles) {
      const fallback = fallbackRefForRole(role);
      if (fallback) return fallback;
    }
    return void 0;
  };
  let resolvedTargetCount = 0;
  let inferredTargetCount = 0;
  const unresolvedTargetAliases = /* @__PURE__ */ new Set();
  const notes = [];
  const nextSteps = recipe.steps.map((step) => {
    const nextStep = { ...step };
    let target = String(step.targetDeviceId ?? "").trim();
    let inferred = false;
    if (target) {
      if (target.startsWith("node:")) {
        const byNode = nodesById.get(target.slice("node:".length));
        if (byNode) {
          target = nodeRef(byNode);
        }
      } else {
        const byLogical = nodesByLogicalId.get(target);
        const byNode = nodesById.get(target);
        if (byLogical) {
          target = nodeRef(byLogical);
        } else if (byNode) {
          target = nodeRef(byNode);
        } else {
          const normalizedTarget = normalizeTargetId(target);
          const aliasResolved = resolveRoleAliasToRef(normalizedTarget);
          if (aliasResolved) {
            target = aliasResolved;
            resolvedTargetCount += 1;
            notes.push(`Resolved target alias "${step.targetDeviceId}" -> "${aliasResolved}"`);
          } else {
            unresolvedTargetAliases.add(normalizedTarget || target);
          }
        }
      }
    } else {
      const inferredAlias = inferAliasFromStep(step);
      if (inferredAlias) {
        const aliasResolved = resolveRoleAliasToRef(inferredAlias);
        if (aliasResolved) {
          target = aliasResolved;
          inferred = true;
          inferredTargetCount += 1;
          notes.push(`Inferred target "${inferredAlias}" for step "${step.name}"`);
        } else {
          unresolvedTargetAliases.add(inferredAlias);
        }
      }
    }
    nextStep.targetDeviceId = target || void 0;
    if (inferred && !step.triggerWhen && normalizeText(step.action) === "hold") {
      nextStep.triggerWhen = step.triggerWhen;
    }
    const nextCommand = commandFromStep(nextStep);
    nextStep.command = nextCommand;
    if (nextCommand === "set_value" && nextStep.value === void 0 && typeof nextStep.temperatureC === "number" && Number.isFinite(nextStep.temperatureC)) {
      nextStep.value = nextStep.temperatureC;
    }
    return nextStep;
  });
  return {
    recipe: {
      ...recipe,
      steps: nextSteps
    },
    resolvedTargetCount,
    inferredTargetCount,
    unresolvedTargetAliases: [...unresolvedTargetAliases],
    notes
  };
};

const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const validRecipeFormats = /* @__PURE__ */ new Set([
  "bevforge",
  "beer-json",
  "beer-xml",
  "beer-smith-bsmx"
]);
const validStepCommands = /* @__PURE__ */ new Set([
  "on_off",
  "open_close",
  "route",
  "set_value",
  "trigger"
]);
const validRequirementCategories = /* @__PURE__ */ new Set([
  "yeast",
  "malt",
  "hops",
  "fruit",
  "packaging",
  "equipment",
  "other"
]);
const toOptionalString = (value) => {
  if (typeof value !== "string") return void 0;
  const next = value.trim();
  return next.length > 0 ? next : void 0;
};
const toOptionalNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const toOptionalBool = (value) => typeof value === "boolean" ? value : void 0;
const normalizeExecutionMode = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "manual") return "manual";
  if (normalized === "hybrid") return "hybrid";
  return "automated";
};
const toManualExecutionRecipe = (recipe) => ({
  ...recipe,
  steps: recipe.steps.map((step) => {
    const text = `${String(step.stage ?? "").toLowerCase()} ${String(step.action ?? "").toLowerCase()} ${String(step.name ?? "").toLowerCase()}`;
    const isTransferStep = text.includes("transfer") || String(step.triggerWhen ?? "").toLowerCase().includes("transfer_complete");
    const hasDuration = Number.isFinite(Number(step.durationMin)) && Number(step.durationMin) > 0;
    return {
      ...step,
      targetDeviceId: void 0,
      requiresUserConfirm: hasDuration ? false : true,
      autoProceed: false,
      triggerWhen: isTransferStep ? step.triggerWhen ?? "transfer_complete" : step.triggerWhen
    };
  })
});
const normalizeInlineRecipe = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const input = value;
  const rawSteps = Array.isArray(input.steps) ? input.steps : [];
  if (rawSteps.length === 0) {
    return null;
  }
  const id = toOptionalString(input.id) ?? `inline-${Date.now().toString(36)}`;
  const name = toOptionalString(input.name) ?? "Canvas Recipe";
  const format = validRecipeFormats.has(input.format) ? input.format : "bevforge";
  const requirements = Array.isArray(input.requirements) ? input.requirements.reduce((acc, raw) => {
    const candidate = raw;
    const reqName = toOptionalString(candidate.name);
    const category = toOptionalString(candidate.category);
    if (!reqName || !category || !validRequirementCategories.has(category)) {
      return acc;
    }
    const next = {
      name: reqName,
      category
    };
    const requiredQty = toOptionalNumber(candidate.requiredQty);
    const unit = toOptionalString(candidate.unit);
    if (requiredQty !== void 0) {
      next.requiredQty = requiredQty;
    }
    if (unit !== void 0) {
      next.unit = unit;
    }
    acc.push(next);
    return acc;
  }, []) : void 0;
  const steps = rawSteps.map((rawStep, index) => {
    const step = rawStep;
    const command = toOptionalString(step.command);
    const valueCandidate = step.value;
    return {
      id: toOptionalString(step.id) ?? `step-${index + 1}`,
      name: toOptionalString(step.name) ?? `Step ${index + 1}`,
      stage: toOptionalString(step.stage),
      action: toOptionalString(step.action),
      triggerWhen: toOptionalString(step.triggerWhen),
      durationMin: toOptionalNumber(step.durationMin),
      temperatureC: toOptionalNumber(step.temperatureC),
      targetDeviceId: toOptionalString(step.targetDeviceId),
      command: command && validStepCommands.has(command) ? command : void 0,
      value: typeof valueCandidate === "string" || typeof valueCandidate === "number" || typeof valueCandidate === "boolean" ? valueCandidate : void 0,
      requiresUserConfirm: toOptionalBool(step.requiresUserConfirm),
      autoProceed: toOptionalBool(step.autoProceed)
    };
  });
  return {
    id,
    name,
    format,
    requirements,
    steps,
    rawFile: toOptionalString(input.rawFile) ?? `inline://${id}.json`,
    importedAt: toOptionalString(input.importedAt) ?? nowIso()
  };
};
async function handler(req, res) {
  try {
    const {
      recipeId,
      recipe: inlineRecipeInput,
      allowManualOverride,
      siteId,
      executionMode
    } = req.body;
    if (!recipeId && !inlineRecipeInput) {
      return res.status(400).json({
        success: false,
        error: "recipeId or recipe payload is required."
      });
    }
    const [recipes, project, devices, equipmentRoleMap] = await Promise.all([
      readImportedRecipes(),
      readCanvasProject(),
      readDevices(),
      readEquipmentRoleMap()
    ]);
    const recipeFromIndex = recipeId ? recipes.find((candidate) => candidate.id === recipeId) ?? null : null;
    const recipe = recipeFromIndex ?? normalizeInlineRecipe(inlineRecipeInput);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: recipeId ? "Recipe not found." : "Inline recipe payload is invalid."
      });
    }
    const normalizedExecutionMode = normalizeExecutionMode(executionMode);
    const targetSiteId = String(siteId ?? "main").trim().toLowerCase() || "main";
    const inventoryChecks = await checkInventoryForRecipe(recipe, targetSiteId);
    const preflight = buildRecipePreflightReport(
      recipe,
      project,
      devices,
      equipmentRoleMap,
      inventoryChecks
    );
    const manualMode = normalizedExecutionMode === "manual";
    if (preflight.status === "incompatible" && !manualMode) {
      return res.status(409).json({
        success: false,
        error: "Recipe is not compatible with the current commissioned system.",
        preflight
      });
    }
    const requiresOverrideAck = preflight.status === "needs_override" || manualMode && preflight.status === "incompatible";
    if (requiresOverrideAck && allowManualOverride !== true) {
      return res.status(409).json({
        success: false,
        error: manualMode && preflight.status === "incompatible" ? "Manual mode requires override acknowledgement because required equipment is missing." : "Recipe requires manual override acknowledgement before start.",
        preflight
      });
    }
    const compiledPlan = compileRecipeForExecution(
      recipe,
      project,
      devices,
      equipmentRoleMap
    );
    const executableRecipe = manualMode ? toManualExecutionRecipe(compiledPlan.recipe) : compiledPlan.recipe;
    const run = await recipeRunner.startRun(executableRecipe, {
      executionMode: normalizedExecutionMode
    });
    const batch = await createBatchFromRecipeRun({
      recipeId: executableRecipe.id,
      recipeName: executableRecipe.name,
      recipeRunId: run.runId,
      expectedUnit: "L",
      siteId: targetSiteId
    });
    await reserveInventoryForRecipeRun({
      recipe: executableRecipe,
      recipeRunId: run.runId,
      batchId: batch.id,
      siteId: targetSiteId
    });
    return res.status(200).json({
      success: true,
      data: {
        ...run,
        batchId: batch.id,
        lotCode: batch.lotCode,
        executionMode: normalizedExecutionMode,
        executionPlan: {
          resolvedTargetCount: compiledPlan.resolvedTargetCount,
          inferredTargetCount: compiledPlan.inferredTargetCount,
          unresolvedTargetAliases: compiledPlan.unresolvedTargetAliases,
          notes: compiledPlan.notes
        }
      },
      preflight
    });
  } catch (error) {
    console.error("Failed to start recipe run:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start recipe run."
    });
  }
}

export { handler as h };
