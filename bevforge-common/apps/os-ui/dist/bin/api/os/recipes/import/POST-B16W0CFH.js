import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';

const nowIso$1 = () => (/* @__PURE__ */ new Date()).toISOString();
const makeId$1 = (prefix) => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};
const createPage = (name) => {
  const now = nowIso$1();
  return {
    id: makeId$1("page"),
    name,
    mode: "draft",
    nodes: [],
    edges: [],
    tags: [],
    createdAt: now,
    updatedAt: now
  };
};
const createDefaultProject = () => {
  const now = nowIso$1();
  return {
    schemaVersion: "1.0.0",
    id: makeId$1("project"),
    name: "BevForge OS Canvas Project",
    pages: [createPage("Master Layout")],
    createdAt: now,
    updatedAt: now
  };
};

const resolveRepoRoot = () => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "apps", "os-ui"))) {
    return cwd;
  }
  if (cwd.endsWith(path.join("apps", "os-ui"))) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
};
const repoRoot = resolveRepoRoot();
const commissioningRoot = path.join(repoRoot, "commissioning", "os");
const recipesRoot = path.join(commissioningRoot, "recipes");
const queueRoot = path.join(commissioningRoot, "queue");
const jobsRoot = path.join(commissioningRoot, "jobs");
const commissioningPaths = {
  root: commissioningRoot,
  projectFile: path.join(commissioningRoot, "canvas-project.json"),
  devicesFile: path.join(commissioningRoot, "devices.json"),
  labDraftsFile: path.join(commissioningRoot, "lab-drafts.json"),
  labHandoffAuditFile: path.join(commissioningRoot, "lab-handoff-audit.json"),
  automationRunsFile: path.join(commissioningRoot, "automation-runs.json"),
  recipeRunsFile: path.join(commissioningRoot, "recipe-runs.json"),
  recipeReadingsFile: path.join(commissioningRoot, "recipe-readings.json"),
  recipeRunboardProfilesFile: path.join(commissioningRoot, "recipe-runboard-profiles.json"),
  equipmentRoleMapFile: path.join(commissioningRoot, "equipment-role-map.json"),
  transferRouteMapFile: path.join(commissioningRoot, "transfer-route-map.json"),
  recipesDir: recipesRoot,
  recipeIndexFile: path.join(recipesRoot, "index.json"),
  queueRoot,
  queueInboxDir: path.join(queueRoot, "recipes"),
  queueRejectedDir: path.join(queueRoot, "rejected"),
  queueStatusFile: path.join(queueRoot, "status.json"),
  jobsDir: jobsRoot
};
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};
const readJsonOrDefault = async (filePath, fallback) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writeJson = async (filePath, data) => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}
`, "utf8");
};
const ensureCommissioningStore = async () => {
  await ensureDirectory(commissioningPaths.root);
  await ensureDirectory(commissioningPaths.recipesDir);
  await ensureDirectory(commissioningPaths.queueRoot);
  await ensureDirectory(commissioningPaths.queueInboxDir);
  await ensureDirectory(commissioningPaths.queueRejectedDir);
  await ensureDirectory(commissioningPaths.jobsDir);
};
const readCanvasProject = async () => {
  await ensureCommissioningStore();
  const fallback = createDefaultProject();
  const project = await readJsonOrDefault(
    commissioningPaths.projectFile,
    fallback
  );
  if (!project.pages || project.pages.length === 0) {
    return fallback;
  }
  return project;
};
const writeCanvasProject = async (project) => {
  await ensureCommissioningStore();
  const normalized = {
    ...project,
    schemaVersion: project.schemaVersion ?? "1.0.0",
    updatedAt: nowIso(),
    pages: (project.pages ?? []).map((page) => ({
      ...page,
      updatedAt: nowIso()
    }))
  };
  await writeJson(commissioningPaths.projectFile, normalized);
  return normalized;
};
const readDevices = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(commissioningPaths.devicesFile, []);
};
const writeDevices = async (devices) => {
  await ensureCommissioningStore();
  const normalized = devices.map((device) => ({
    ...device,
    updatedAt: nowIso()
  }));
  await writeJson(commissioningPaths.devicesFile, normalized);
  return normalized;
};
const appendImportedRecipe = async (recipe) => {
  await ensureCommissioningStore();
  const index = await readJsonOrDefault(
    commissioningPaths.recipeIndexFile,
    []
  );
  const updated = [recipe, ...index].slice(0, 200);
  await writeJson(commissioningPaths.recipeIndexFile, updated);
};
const readImportedRecipes = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(commissioningPaths.recipeIndexFile, []);
};
const defaultEquipmentRoleMapState = () => ({
  schemaVersion: "0.1.0",
  id: "equipment-role-map",
  updatedAt: nowIso(),
  roles: {}
});
const readEquipmentRoleMap = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(
    commissioningPaths.equipmentRoleMapFile,
    defaultEquipmentRoleMapState()
  );
};
const writeEquipmentRoleMap = async (patch) => {
  await ensureCommissioningStore();
  const current = await readEquipmentRoleMap();
  const nextRoles = { ...current.roles ?? {} };
  const allowedRoles = [
    "hlt_vessel",
    "mash_tun_vessel",
    "boil_kettle_vessel",
    "fermenter_primary",
    "heat_source_primary",
    "transfer_pump_primary",
    "glycol_pump",
    "glycol_supply_valve",
    "temp_sensor_mash",
    "temp_sensor_fermenter"
  ];
  for (const role of allowedRoles) {
    if (!(role in patch)) continue;
    const nextValue = patch[role];
    if (!nextValue || !String(nextValue).trim()) {
      delete nextRoles[role];
      continue;
    }
    nextRoles[role] = String(nextValue).trim();
  }
  const nextState = {
    schemaVersion: current.schemaVersion ?? "0.1.0",
    id: current.id ?? "equipment-role-map",
    updatedAt: nowIso(),
    roles: nextRoles
  };
  await writeJson(commissioningPaths.equipmentRoleMapFile, nextState);
  return nextState;
};
const defaultTransferRouteMapState = () => ({
  schemaVersion: "0.1.0",
  id: "transfer-route-map",
  updatedAt: nowIso(),
  routes: {}
});
const transferRouteKeys = [
  "hlt_to_mash",
  "mash_to_kettle",
  "kettle_to_fermenter",
  "fermenter_to_bright",
  "bright_to_packaging"
];
const readTransferRouteMap = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(
    commissioningPaths.transferRouteMapFile,
    defaultTransferRouteMapState()
  );
};
const writeTransferRouteMap = async (patch) => {
  await ensureCommissioningStore();
  const current = await readTransferRouteMap();
  const nextRoutes = {
    ...current.routes ?? {}
  };
  for (const key of transferRouteKeys) {
    if (!(key in patch)) continue;
    const nextValue = patch[key];
    if (!nextValue || typeof nextValue !== "object") {
      delete nextRoutes[key];
      continue;
    }
    const normalized = {
      enabled: nextValue.enabled === void 0 ? true : Boolean(nextValue.enabled),
      transferControllerRef: String(nextValue.transferControllerRef ?? "").trim() || void 0,
      pumpRef: String(nextValue.pumpRef ?? "").trim() || void 0,
      sourceValveRef: String(nextValue.sourceValveRef ?? "").trim() || void 0,
      destinationValveRef: String(nextValue.destinationValveRef ?? "").trim() || void 0,
      speedPct: Number.isFinite(Number(nextValue.speedPct)) && Number(nextValue.speedPct) >= 0 ? Number(nextValue.speedPct) : void 0,
      closeValvesOnComplete: nextValue.closeValvesOnComplete === void 0 ? true : Boolean(nextValue.closeValvesOnComplete),
      requireArmConfirm: nextValue.requireArmConfirm === void 0 ? key === "bright_to_packaging" : Boolean(nextValue.requireArmConfirm)
    };
    const hasTarget = Boolean(normalized.transferControllerRef) || Boolean(normalized.pumpRef) || Boolean(normalized.sourceValveRef) || Boolean(normalized.destinationValveRef);
    if (!hasTarget) {
      delete nextRoutes[key];
      continue;
    }
    nextRoutes[key] = normalized;
  }
  const nextState = {
    schemaVersion: current.schemaVersion ?? "0.1.0",
    id: current.id ?? "transfer-route-map",
    updatedAt: nowIso(),
    routes: nextRoutes
  };
  await writeJson(commissioningPaths.transferRouteMapFile, nextState);
  return nextState;
};
const defaultAutomationRunsState = () => ({
  schemaVersion: "0.1.0",
  id: "automation-runs",
  updatedAt: nowIso(),
  runs: []
});
const readAutomationRunsState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(
    commissioningPaths.automationRunsFile,
    defaultAutomationRunsState()
  );
};
const writeAutomationRunsState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "automation-runs",
    updatedAt: nowIso(),
    runs: [...state.runs ?? []].slice(-200)
  };
  await writeJson(commissioningPaths.automationRunsFile, normalized);
  return normalized;
};
const defaultRecipeRunsState = () => ({
  schemaVersion: "0.1.0",
  id: "recipe-runs",
  updatedAt: nowIso(),
  runs: []
});
const readRecipeRunsState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(
    commissioningPaths.recipeRunsFile,
    defaultRecipeRunsState()
  );
};
const writeRecipeRunsState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    ...state,
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "recipe-runs",
    updatedAt: nowIso(),
    runs: [...state.runs ?? []].slice(-200)
  };
  await writeJson(commissioningPaths.recipeRunsFile, normalized);
  return normalized;
};
const defaultLabDraftsState = () => ({
  schemaVersion: "0.1.0",
  id: "lab-drafts",
  updatedAt: nowIso(),
  activeRecipeId: void 0,
  drafts: []
});
const normalizeLabDraftRecord = (input) => ({
  ...input,
  id: String(input.id),
  name: input.name ? String(input.name) : void 0,
  created_at: input.created_at ? String(input.created_at) : void 0,
  updated_at: input.updated_at ? String(input.updated_at) : nowIso()
});
const readLabDraftsState = async () => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault(
    commissioningPaths.labDraftsFile,
    defaultLabDraftsState()
  );
  const drafts = Array.isArray(state.drafts) ? state.drafts.filter((entry) => entry && typeof entry.id === "string" && entry.id.trim().length > 0).map((entry) => normalizeLabDraftRecord(entry)) : [];
  return {
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "lab-drafts",
    updatedAt: state.updatedAt ?? nowIso(),
    activeRecipeId: state.activeRecipeId && String(state.activeRecipeId).trim() ? String(state.activeRecipeId).trim() : void 0,
    drafts
  };
};
const writeLabDraftsState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "lab-drafts",
    updatedAt: nowIso(),
    activeRecipeId: state.activeRecipeId && String(state.activeRecipeId).trim() ? String(state.activeRecipeId).trim() : void 0,
    drafts: [...state.drafts ?? []].filter((entry) => entry && typeof entry.id === "string" && entry.id.trim().length > 0).map((entry) => normalizeLabDraftRecord(entry)).slice(-500)
  };
  await writeJson(commissioningPaths.labDraftsFile, normalized);
  return normalized;
};
const upsertLabDraft = async (draft) => {
  await ensureCommissioningStore();
  const state = await readLabDraftsState();
  const normalizedDraft = normalizeLabDraftRecord(draft);
  const nextDrafts = state.drafts.filter((entry) => entry.id !== normalizedDraft.id);
  nextDrafts.push(normalizedDraft);
  nextDrafts.sort((a, b) => {
    const aUpdated = String(a.updated_at ?? "");
    const bUpdated = String(b.updated_at ?? "");
    return bUpdated.localeCompare(aUpdated);
  });
  return writeLabDraftsState({
    ...state,
    activeRecipeId: normalizedDraft.id,
    drafts: nextDrafts
  });
};
const deleteLabDraft = async (recipeId) => {
  await ensureCommissioningStore();
  const state = await readLabDraftsState();
  const nextDrafts = state.drafts.filter((entry) => entry.id !== recipeId);
  const nextActive = state.activeRecipeId === recipeId ? nextDrafts[0]?.id : state.activeRecipeId;
  return writeLabDraftsState({
    ...state,
    activeRecipeId: nextActive,
    drafts: nextDrafts
  });
};
const setActiveLabDraftId = async (recipeId) => {
  await ensureCommissioningStore();
  const state = await readLabDraftsState();
  const nextActive = recipeId && state.drafts.some((entry) => entry.id === recipeId) ? recipeId : void 0;
  return writeLabDraftsState({
    ...state,
    activeRecipeId: nextActive
  });
};
const defaultLabHandoffAuditState = () => ({
  schemaVersion: "0.1.0",
  id: "lab-handoff-audit",
  updatedAt: nowIso(),
  entries: []
});
const readLabHandoffAuditState = async () => {
  await ensureCommissioningStore();
  return readJsonOrDefault(
    commissioningPaths.labHandoffAuditFile,
    defaultLabHandoffAuditState()
  );
};
const writeLabHandoffAuditState = async (state) => {
  await ensureCommissioningStore();
  const normalized = {
    schemaVersion: state.schemaVersion ?? "0.1.0",
    id: state.id ?? "lab-handoff-audit",
    updatedAt: nowIso(),
    entries: [...state.entries ?? []].slice(-1e3)
  };
  await writeJson(commissioningPaths.labHandoffAuditFile, normalized);
  return normalized;
};
const appendLabHandoffAuditEntry = async (entry) => {
  await ensureCommissioningStore();
  const state = await readLabHandoffAuditState();
  const record = {
    id: entry.id ?? `lab-handoff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? nowIso(),
    status: entry.status,
    recipeId: entry.recipeId,
    recipeName: entry.recipeName,
    importedRecipeId: entry.importedRecipeId,
    importedFormat: entry.importedFormat,
    osBaseUrl: entry.osBaseUrl,
    dryRunOk: entry.dryRunOk,
    warningCount: entry.warningCount,
    errorCount: entry.errorCount,
    message: entry.message,
    source: entry.source
  };
  return writeLabHandoffAuditState({
    ...state,
    entries: [record, ...state.entries ?? []]
  });
};
const writeRawRecipeFile = async (fileName, content) => {
  await ensureCommissioningStore();
  const fullPath = path.join(commissioningPaths.recipesDir, fileName);
  await fs.writeFile(fullPath, content, "utf8");
  return fullPath;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const safeFileName = (value) => value.replace(/[^a-zA-Z0-9._-]/g, "_");
const toNumber = (value) => {
  if (value === null || value === void 0 || value === "") {
    return void 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : void 0;
};
const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};
const toText = (value) => {
  if (value === null || value === void 0) return void 0;
  const next = String(value).trim();
  return next.length > 0 ? next : void 0;
};
const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return void 0;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return void 0;
};
const round1 = (value) => Math.round(value * 10) / 10;
const toCelsius = (fahrenheit) => round1((fahrenheit - 32) * 5 / 9);
const maybeParseScalar = (value) => {
  if (value === null || value === void 0) return void 0;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value !== "string") return String(value);
  const trimmed = value.trim();
  if (!trimmed) return void 0;
  const bool = toBoolean(trimmed);
  if (bool !== void 0) return bool;
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) return numeric;
  return trimmed;
};
const addRequirement = (target, entry) => {
  const key = `${entry.category}:${String(entry.name).trim().toLowerCase()}`;
  if (target.some((item) => `${item.category}:${String(item.name).trim().toLowerCase()}` === key)) {
    return;
  }
  target.push(entry);
};
const toStepCommand = (value) => {
  const text = toText(value)?.toLowerCase();
  if (!text) return void 0;
  if (text === "on_off" || text === "open_close" || text === "route" || text === "set_value" || text === "trigger") {
    return text;
  }
  if (text.includes("open") || text.includes("close") || text.includes("valve") || text.includes("vent")) {
    return "open_close";
  }
  if (text.includes("route")) return "route";
  if (text.includes("set") || text.includes("heat") || text.includes("cool") || text.includes("pressure")) {
    return "set_value";
  }
  if (text.includes("pump") || text.includes("start") || text.includes("stop") || text.includes("relay") || text.includes("chiller") || text.includes("heater")) {
    return "on_off";
  }
  return "trigger";
};
const makeActionLabel = (stage, action, fallback) => {
  const readableAction = action.replaceAll("_", " ").trim();
  const readableStage = stage?.replaceAll("_", " ").trim();
  if (readableStage) {
    return `${readableStage}: ${readableAction || fallback}`;
  }
  return readableAction || fallback;
};
const durationFromAction = (action) => {
  if (!action || typeof action !== "object") return void 0;
  const direct = toNumber(action.duration_min ?? action.durationMin ?? action.duration);
  if (direct !== void 0) return direct;
  const days = toNumber(action.duration_days ?? action.durationDays);
  if (days !== void 0) return days * 24 * 60;
  return void 0;
};
const tempFromAction = (action) => {
  if (!action || typeof action !== "object") return void 0;
  const targetC = toNumber(
    action.target_c ?? action.targetC ?? action.temperature_c ?? action.temperatureC ?? action.temp_c ?? action.tempC
  );
  if (targetC !== void 0) return targetC;
  const targetF = toNumber(action.target_f ?? action.targetF ?? action.temp_f ?? action.tempF);
  if (targetF !== void 0) return toCelsius(targetF);
  return void 0;
};
const normalizeBevForge = (input, rawFile) => {
  const metadata = input?.metadata && typeof input.metadata === "object" ? input.metadata : {};
  const legacyMeta = input?.meta && typeof input.meta === "object" ? input.meta : {};
  const process2 = input.process ?? metadata.process ?? {};
  const ingredients = input.ingredients ?? metadata.ingredients ?? {};
  const explicitRequirements = ensureArray(
    input.requirements ?? metadata.requirements
  );
  const actionPool = ensureArray(input.actions ?? metadata.actions);
  const triggerPool = ensureArray(input.triggers ?? metadata.triggers);
  const triggersByActionId = /* @__PURE__ */ new Map();
  for (const trigger of triggerPool) {
    const actionId = toText(trigger?.action_id ?? trigger?.actionId);
    if (actionId) {
      triggersByActionId.set(actionId, trigger);
    }
  }
  const steps = [];
  const requirements = [];
  const pushStep = (step) => {
    steps.push({
      ...step,
      id: step.id || makeId("step"),
      name: step.name || "Recipe Step"
    });
  };
  const declaredSteps = ensureArray(input.steps);
  if (declaredSteps.length > 0) {
    declaredSteps.forEach((step, index) => {
      const params = step?.params && typeof step.params === "object" ? step.params : {};
      const actionName = toText(params.action ?? step.action ?? step.type) ?? "step";
      const durationMin = durationFromAction(params) ?? durationFromAction(step);
      const temperatureC = tempFromAction(params) ?? tempFromAction(step);
      const explicitAutoProceed = toBoolean(params.autoProceed) ?? toBoolean(step.autoProceed);
      const explicitConfirm = toBoolean(params.requiresUserConfirm) ?? toBoolean(step.requiresUserConfirm);
      const requiresUserConfirm = explicitConfirm ?? (explicitAutoProceed !== void 0 ? !explicitAutoProceed : false);
      pushStep({
        id: toText(step.id) ?? `step-${index + 1}`,
        name: toText(params.name ?? step.name) ?? makeActionLabel(toText(params.stage ?? step.stage), actionName, `Step ${index + 1}`),
        stage: toText(params.stage ?? step.stage),
        action: actionName,
        triggerWhen: toText(params.triggerWhen ?? step.triggerWhen ?? params.when ?? step.when),
        durationMin,
        temperatureC,
        targetDeviceId: toText(
          params.targetDeviceId ?? step.targetDeviceId ?? params.device ?? step.device
        ),
        command: toStepCommand(params.command ?? step.command ?? actionName),
        value: maybeParseScalar(params.value ?? step.value) ?? maybeParseScalar(params.targetValue ?? step.targetValue) ?? (temperatureC !== void 0 ? temperatureC : void 0),
        requiresUserConfirm,
        autoProceed: explicitAutoProceed ?? !requiresUserConfirm
      });
    });
  }
  if (steps.length === 0) {
    const actions = actionPool;
    if (actions.length > 0) {
      actions.forEach((action, index) => {
        const actionId = toText(action.id) ?? `action-${index + 1}`;
        const actionName = toText(action.action ?? action.type) ?? "action";
        const trigger = triggersByActionId.get(actionId);
        const durationMin = durationFromAction(action);
        const temperatureC = tempFromAction(action) ?? tempFromAction(trigger);
        const explicitAutoProceed = toBoolean(action.autoProceed);
        const explicitConfirm = toBoolean(action.requiresUserConfirm);
        const requiresUserConfirm = explicitConfirm ?? (explicitAutoProceed !== void 0 ? !explicitAutoProceed : actionName.includes("add") || actionName.includes("notify"));
        pushStep({
          id: actionId,
          name: toText(action.label ?? action.name) ?? makeActionLabel(toText(action.stage), actionName, `Action ${index + 1}`),
          stage: toText(action.stage),
          action: actionName,
          triggerWhen: toText(trigger?.when),
          durationMin,
          temperatureC,
          targetDeviceId: toText(action.targetDeviceId ?? action.device),
          command: toStepCommand(action.command ?? actionName),
          value: maybeParseScalar(action.value) ?? maybeParseScalar(action.targetValue) ?? (temperatureC !== void 0 ? temperatureC : void 0),
          requiresUserConfirm,
          autoProceed: explicitAutoProceed ?? !requiresUserConfirm
        });
      });
    }
  }
  if (steps.length === 0) {
    const mashSteps = ensureArray(process2.mash_steps);
    mashSteps.forEach((step, index) => {
      const temperatureC = toNumber(step.target_c ?? step.targetC ?? step.temperatureC);
      pushStep({
        id: `mash-${index + 1}`,
        name: toText(step.name) ?? `Mash Step ${index + 1}`,
        stage: "mash",
        action: "hold",
        durationMin: toNumber(step.duration_min ?? step.durationMin),
        temperatureC,
        command: "set_value",
        value: temperatureC,
        requiresUserConfirm: false,
        autoProceed: true
      });
    });
    const boilDuration = toNumber(
      process2.boil?.duration_min ?? process2.boil_time_min ?? input.hardware_prep?.boil?.boil_time_min ?? metadata.hardware_prep?.boil?.boil_time_min ?? input.batch?.boil_time_min
    );
    if (boilDuration !== void 0) {
      pushStep({
        id: "boil",
        name: "Boil",
        stage: "boil",
        action: "hold",
        durationMin: boilDuration,
        temperatureC: 100,
        command: "set_value",
        value: 100,
        requiresUserConfirm: false,
        autoProceed: true
      });
    }
    const fermentTarget = toNumber(
      process2.fermentation?.target_c ?? process2.fermentation?.primary_temp_c ?? process2.fermentation?.temp_c
    );
    if (fermentTarget !== void 0) {
      pushStep({
        id: "ferment-hold",
        name: "Fermentation Hold",
        stage: "fermentation",
        action: "hold_temp",
        durationMin: toNumber(process2.fermentation?.primary_days) !== void 0 ? Number(process2.fermentation.primary_days) * 24 * 60 : void 0,
        temperatureC: fermentTarget,
        command: "set_value",
        value: fermentTarget,
        requiresUserConfirm: false,
        autoProceed: true
      });
    }
  }
  const validCategories = /* @__PURE__ */ new Set([
    "yeast",
    "malt",
    "hops",
    "fruit",
    "packaging",
    "equipment",
    "other"
  ]);
  explicitRequirements.forEach((entry) => {
    const normalizedCategory = String(entry?.category ?? "other").toLowerCase();
    const category = validCategories.has(normalizedCategory) ? normalizedCategory : "other";
    addRequirement(requirements, {
      name: toText(entry?.name) ?? "Requirement",
      category,
      requiredQty: toNumber(entry?.requiredQty ?? entry?.qty ?? entry?.amount),
      unit: toText(entry?.unit)
    });
  });
  for (const hop of ensureArray(ingredients.hops)) {
    addRequirement(requirements, {
      name: toText(hop?.name) ?? "Hop",
      category: "hops",
      requiredQty: toNumber(hop?.amount_g ?? hop?.weight_g ?? hop?.amount),
      unit: toText(hop?.unit) ?? "g"
    });
  }
  for (const malt of ensureArray(ingredients.malts).concat(
    ensureArray(ingredients.fermentables)
  )) {
    addRequirement(requirements, {
      name: toText(malt?.name) ?? "Malt",
      category: "malt",
      requiredQty: toNumber(malt?.amount_kg ?? malt?.weight_kg ?? malt?.amount),
      unit: toText(malt?.unit) ?? "kg"
    });
  }
  for (const yeast of ensureArray(ingredients.yeast)) {
    addRequirement(requirements, {
      name: toText(yeast?.name) ?? "Yeast",
      category: "yeast",
      requiredQty: toNumber(yeast?.amount ?? yeast?.packs),
      unit: toText(yeast?.unit) ?? "packs"
    });
  }
  return {
    id: String(input.id ?? metadata.id ?? legacyMeta.id ?? makeId("recipe")),
    name: String(
      input.name ?? metadata.name ?? legacyMeta.name ?? "Imported BevForge Recipe"
    ),
    format: "bevforge",
    requirements,
    steps,
    rawFile,
    importedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
const normalizeBeerJson = (input, rawFile) => {
  const recipeRoot = input.recipe ?? input;
  const mashSteps = ensureArray(recipeRoot.mash?.steps);
  const boilTime = toNumber(recipeRoot.boilTime ?? recipeRoot.boil_time);
  const hops = ensureArray(recipeRoot.hops);
  const fermentables = ensureArray(recipeRoot.fermentables);
  const yeasts = ensureArray(recipeRoot.yeasts ?? recipeRoot.yeast);
  const steps = [];
  const requirements = [];
  mashSteps.forEach((step, index) => {
    steps.push({
      id: `mash-${index + 1}`,
      name: String(step.name ?? `Mash Step ${index + 1}`),
      stage: "mash",
      action: "hold",
      durationMin: toNumber(step.time ?? step.duration),
      temperatureC: toNumber(step.temperature ?? step.temp),
      command: "set_value",
      value: toNumber(step.temperature ?? step.temp),
      requiresUserConfirm: false,
      autoProceed: true
    });
  });
  if (boilTime !== void 0) {
    steps.push({
      id: "boil",
      name: "Boil",
      stage: "boil",
      action: "hold",
      durationMin: boilTime,
      temperatureC: 100,
      command: "set_value",
      value: 100,
      requiresUserConfirm: false,
      autoProceed: true
    });
  }
  hops.forEach((hop, index) => {
    const hopName = toText(hop.name) ?? `Hop ${index + 1}`;
    addRequirement(requirements, {
      name: hopName,
      category: "hops",
      requiredQty: toNumber(hop.amount ?? hop.weight ?? hop.weight_g),
      unit: toText(hop.unit) ?? "kg"
    });
    const hopTime = toNumber(hop.time ?? hop.time_min);
    steps.push({
      id: `hop-${index + 1}`,
      name: `Hop Add: ${hopName}`,
      stage: "boil",
      action: "hop_add",
      triggerWhen: hopTime !== void 0 ? `boil_min_remaining:${hopTime}` : "boil",
      durationMin: void 0,
      command: "trigger",
      value: true,
      requiresUserConfirm: true,
      autoProceed: false
    });
  });
  fermentables.forEach((fermentable) => {
    addRequirement(requirements, {
      name: toText(fermentable.name) ?? "Fermentable",
      category: "malt",
      requiredQty: toNumber(fermentable.amount ?? fermentable.weight ?? fermentable.weight_kg),
      unit: toText(fermentable.unit) ?? "kg"
    });
  });
  yeasts.forEach((yeast) => {
    addRequirement(requirements, {
      name: toText(yeast.name) ?? "Yeast",
      category: "yeast",
      requiredQty: toNumber(yeast.amount ?? yeast.packs),
      unit: toText(yeast.unit) ?? "packs"
    });
  });
  return {
    id: String(recipeRoot.id ?? makeId("recipe")),
    name: String(recipeRoot.name ?? "Imported Beer JSON Recipe"),
    format: "beer-json",
    requirements,
    steps,
    rawFile,
    importedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
const normalizeBeerXml = (input, rawFile) => {
  const recipe = ensureArray(input?.RECIPES?.RECIPE ?? input?.RECIPE)[0] ?? {};
  const mashSteps = ensureArray(recipe?.MASH?.MASH_STEPS?.MASH_STEP);
  const hops = ensureArray(recipe?.HOPS?.HOP);
  const fermentables = ensureArray(recipe?.FERMENTABLES?.FERMENTABLE);
  const yeasts = ensureArray(recipe?.YEASTS?.YEAST);
  const requirements = [];
  const steps = mashSteps.map((step, index) => ({
    id: `mash-${index + 1}`,
    name: String(step.NAME ?? `Mash Step ${index + 1}`),
    stage: "mash",
    action: "hold",
    durationMin: toNumber(step.STEP_TIME),
    temperatureC: toNumber(step.STEP_TEMP),
    command: "set_value",
    value: toNumber(step.STEP_TEMP),
    requiresUserConfirm: false,
    autoProceed: true
  }));
  const boilTime = toNumber(recipe.BOIL_TIME);
  if (boilTime !== void 0) {
    steps.push({
      id: "boil",
      name: "Boil",
      stage: "boil",
      action: "hold",
      durationMin: boilTime,
      temperatureC: 100,
      command: "set_value",
      value: 100,
      requiresUserConfirm: false,
      autoProceed: true
    });
  }
  hops.forEach((hop, index) => {
    const hopName = toText(hop.NAME) ?? `Hop ${index + 1}`;
    addRequirement(requirements, {
      name: hopName,
      category: "hops",
      requiredQty: toNumber(hop.AMOUNT),
      unit: "kg"
    });
    const hopTime = toNumber(hop.TIME);
    steps.push({
      id: `hop-${index + 1}`,
      name: `Hop Add: ${hopName}`,
      stage: "boil",
      action: "hop_add",
      triggerWhen: hopTime !== void 0 ? `boil_min_remaining:${hopTime}` : "boil",
      command: "trigger",
      value: true,
      requiresUserConfirm: true,
      autoProceed: false
    });
  });
  fermentables.forEach((fermentable) => {
    addRequirement(requirements, {
      name: toText(fermentable.NAME) ?? "Fermentable",
      category: "malt",
      requiredQty: toNumber(fermentable.AMOUNT),
      unit: "kg"
    });
  });
  yeasts.forEach((yeast) => {
    addRequirement(requirements, {
      name: toText(yeast.NAME) ?? "Yeast",
      category: "yeast",
      requiredQty: toNumber(yeast.AMOUNT),
      unit: toText(yeast.AMOUNT_IS_WEIGHT) === "TRUE" ? "kg" : "packs"
    });
  });
  const primaryTemp = toNumber(recipe.PRIMARY_TEMP);
  if (primaryTemp !== void 0) {
    steps.push({
      id: "fermentation-primary",
      name: "Primary Fermentation",
      stage: "fermentation",
      action: "hold_temp",
      temperatureC: primaryTemp,
      command: "set_value",
      value: primaryTemp,
      requiresUserConfirm: false,
      autoProceed: true
    });
  }
  return {
    id: makeId("recipe"),
    name: String(recipe.NAME ?? "Imported BeerXML Recipe"),
    format: "beer-xml",
    requirements,
    steps,
    rawFile,
    importedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
const normalizeBeerSmithBsmx = (input, rawFile) => {
  const recipe = ensureArray(input?.Recipes?.Data?.Recipe ?? input?.Recipes?.Recipe ?? input?.Recipe)[0] ?? {};
  const mashSteps = ensureArray(recipe?.F_R_MASH?.steps?.Data?.MashStep);
  const hops = ensureArray(recipe?.Ingredients?.Data?.Hops);
  const fermentables = ensureArray(recipe?.Ingredients?.Data?.Fermentable);
  const yeasts = ensureArray(recipe?.Ingredients?.Data?.Yeast);
  const requirements = [];
  const mashTempCandidates = mashSteps.map((step) => toNumber(step?.F_MS_STEP_TEMP)).filter((value) => Number.isFinite(value));
  const ageTempCandidates = [
    toNumber(recipe?.F_R_AGE?.F_A_PRIM_TEMP),
    toNumber(recipe?.F_R_AGE?.F_A_SEC_TEMP),
    toNumber(recipe?.F_R_AGE?.F_A_TERT_TEMP)
  ].filter((value) => Number.isFinite(value));
  const tempCandidates = [...mashTempCandidates, ...ageTempCandidates];
  const likelyFahrenheit = tempCandidates.some((value) => value > 95);
  const convertTemp = (value) => {
    const parsed = toNumber(value);
    if (parsed === void 0) return void 0;
    return likelyFahrenheit ? toCelsius(parsed) : parsed;
  };
  const steps = mashSteps.map((step, index) => {
    const temperatureC = convertTemp(step.F_MS_STEP_TEMP);
    return {
      id: `mash-${index + 1}`,
      name: toText(step.F_MS_NAME) ?? `Mash Step ${index + 1}`,
      stage: "mash",
      action: "hold",
      durationMin: toNumber(step.F_MS_STEP_TIME),
      temperatureC,
      command: "set_value",
      value: temperatureC,
      requiresUserConfirm: false,
      autoProceed: true
    };
  });
  const boilTime = toNumber(
    recipe?.F_R_EQUIPMENT?.F_E_BOIL_TIME ?? recipe?.F_R_BOIL_TIME
  );
  if (boilTime !== void 0) {
    steps.push({
      id: "boil",
      name: "Boil",
      stage: "boil",
      action: "hold",
      durationMin: boilTime,
      temperatureC: 100,
      command: "set_value",
      value: 100,
      requiresUserConfirm: false,
      autoProceed: true
    });
  }
  hops.forEach((hop, index) => {
    const hopName = toText(hop.F_H_NAME) ?? `Hop ${index + 1}`;
    addRequirement(requirements, {
      name: hopName,
      category: "hops",
      requiredQty: toNumber(hop.F_H_AMOUNT),
      unit: "kg"
    });
    const hopTime = toNumber(hop.F_H_BOIL_TIME);
    steps.push({
      id: `hop-${index + 1}`,
      name: `Hop Add: ${hopName}`,
      stage: "boil",
      action: "hop_add",
      triggerWhen: hopTime !== void 0 ? `boil_min_remaining:${hopTime}` : "boil",
      command: "trigger",
      value: true,
      requiresUserConfirm: true,
      autoProceed: false
    });
  });
  fermentables.forEach((fermentable) => {
    addRequirement(requirements, {
      name: toText(fermentable.F_F_NAME) ?? "Fermentable",
      category: "malt",
      requiredQty: toNumber(fermentable.F_F_AMOUNT),
      unit: "kg"
    });
  });
  yeasts.forEach((yeast) => {
    addRequirement(requirements, {
      name: toText(yeast.F_Y_NAME) ?? "Yeast",
      category: "yeast",
      requiredQty: toNumber(yeast.F_Y_AMOUNT),
      unit: "packs"
    });
  });
  const primaryDays = toNumber(recipe?.F_R_AGE?.F_A_PRIM_DAYS);
  const primaryTemp = convertTemp(recipe?.F_R_AGE?.F_A_PRIM_TEMP);
  if (primaryTemp !== void 0 || primaryDays !== void 0) {
    steps.push({
      id: "fermentation-primary",
      name: "Primary Fermentation",
      stage: "fermentation",
      action: "hold_temp",
      durationMin: primaryDays !== void 0 ? primaryDays * 24 * 60 : void 0,
      temperatureC: primaryTemp,
      command: "set_value",
      value: primaryTemp,
      requiresUserConfirm: false,
      autoProceed: true
    });
  }
  const secondaryDays = toNumber(recipe?.F_R_AGE?.F_A_SEC_DAYS);
  const secondaryTemp = convertTemp(recipe?.F_R_AGE?.F_A_SEC_TEMP);
  if (secondaryTemp !== void 0 || secondaryDays !== void 0) {
    steps.push({
      id: "fermentation-secondary",
      name: "Secondary Fermentation",
      stage: "fermentation",
      action: "hold_temp",
      durationMin: secondaryDays !== void 0 ? secondaryDays * 24 * 60 : void 0,
      temperatureC: secondaryTemp,
      command: "set_value",
      value: secondaryTemp,
      requiresUserConfirm: false,
      autoProceed: true
    });
  }
  return {
    id: makeId("recipe"),
    name: String(recipe?.F_R_NAME ?? "Imported BeerSmith Recipe"),
    format: "beer-smith-bsmx",
    requirements,
    steps,
    rawFile,
    importedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
async function handler(req, res) {
  try {
    const requiredToken = process.env.OS_RECIPE_IMPORT_TOKEN;
    if (requiredToken) {
      const tokenFromHeader = toText(req.headers["x-os-import-token"]) ?? toText(req.headers.authorization)?.replace(/^Bearer\s+/i, "");
      if (tokenFromHeader !== requiredToken) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized recipe import",
          message: "Valid import token required"
        });
      }
    }
    const { filename, content } = req.body;
    if (!filename || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        error: "filename and content are required"
      });
    }
    const safeName = safeFileName(filename);
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const rawFileName = `${stamp}-${safeName}`;
    await writeRawRecipeFile(rawFileName, content);
    const ext = path.extname(filename).toLowerCase();
    let normalized;
    if (ext === ".xml" || ext === ".bsmx") {
      const parsed = parser.parse(content);
      const isBeerSmith = ext === ".bsmx" || Boolean(parsed?.Recipes?.Data?.Recipe?.F_R_NAME) || Boolean(parsed?.Recipes?.Data?.Recipe?.F_R_MASH);
      normalized = isBeerSmith ? normalizeBeerSmithBsmx(parsed, rawFileName) : normalizeBeerXml(parsed, rawFileName);
    } else {
      const parsed = JSON.parse(content);
      const isBevForge = parsed?.schemaVersion || parsed?.steps || parsed?.meta?.source === "bevforge-lab" || parsed?.metadata?.source === "bevforge-lab" || parsed?.meta?.version || parsed?.metadata?.version || parsed?.metadata?.process || parsed?.metadata?.requirements || parsed?.metadata?.actions || parsed?.process || parsed?.actions || path.basename(filename).toLowerCase() === "bevforge.json" || filename.toLowerCase().endsWith(".bevforge.json");
      normalized = isBevForge ? normalizeBevForge(parsed, rawFileName) : normalizeBeerJson(parsed, rawFileName);
    }
    await appendImportedRecipe(normalized);
    return res.status(200).json({
      success: true,
      data: normalized,
      meta: {
        message: `Imported ${normalized.format} recipe`
      }
    });
  } catch (error) {
    console.error("Failed to import recipe:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to import recipe",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export { readAutomationRunsState as a, writeAutomationRunsState as b, commissioningPaths as c, readCanvasProject as d, ensureCommissioningStore as e, writeCanvasProject as f, readLabDraftsState as g, handler as h, deleteLabDraft as i, readLabHandoffAuditState as j, appendLabHandoffAuditEntry as k, readImportedRecipes as l, readDevices as m, readEquipmentRoleMap as n, writeEquipmentRoleMap as o, readTransferRouteMap as p, writeTransferRouteMap as q, readRecipeRunsState as r, setActiveLabDraftId as s, writeDevices as t, upsertLabDraft as u, writeRecipeRunsState as w };
