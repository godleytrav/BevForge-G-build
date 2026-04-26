import { p as readTransferRouteMap, d as readCanvasProject, f as writeCanvasProject } from '../../../import/POST-B16W0CFH.js';
import { j as recipeRunner } from '../../../../../../index-BiQ9ukMS.js';

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();
const refForNode = (node) => node.data.logicalDeviceId ?? `node:${node.id}`;
const sourcePages = (project) => {
  const published = (project.pages ?? []).filter((page) => page.mode === "published");
  return published.length > 0 ? published : project.pages ?? [];
};
const allNodes = (project) => sourcePages(project).flatMap((page) => page.nodes ?? []);
const transferRouteDefs = [
  {
    key: "hlt_to_mash",
    label: "HLT -> Mash Tun",
    fromLabel: "HLT",
    toLabel: "Mash Tun"
  },
  {
    key: "mash_to_kettle",
    label: "Mash Tun -> Boil Kettle",
    fromLabel: "Mash Tun",
    toLabel: "Boil Kettle"
  },
  {
    key: "kettle_to_fermenter",
    label: "Boil Kettle -> Fermenter",
    fromLabel: "Boil Kettle",
    toLabel: "Fermenter"
  },
  {
    key: "fermenter_to_bright",
    label: "Fermenter -> Bright Tank",
    fromLabel: "Fermenter",
    toLabel: "Bright Tank"
  },
  {
    key: "bright_to_packaging",
    label: "Bright Tank -> Packaging",
    fromLabel: "Bright Tank",
    toLabel: "Packaging"
  }
];
const inferTransferRouteKey = (step) => {
  if (!step) return null;
  const text = `${normalizeText(step.name)} ${normalizeText(step.stage)} ${normalizeText(
    step.action
  )} ${normalizeText(step.triggerWhen)}`;
  if (text.includes("packag") || text.includes("keg") || text.includes("bottle")) {
    return "bright_to_packaging";
  }
  if (text.includes("bright") || text.includes("conditioning") || text.includes("brite")) {
    return "fermenter_to_bright";
  }
  if (normalizeText(step.stage) === "fermentation" || text.includes("fermenter") || text.includes("transfer_complete") || text.includes("chill")) {
    return "kettle_to_fermenter";
  }
  if (normalizeText(step.stage) === "boil" || text.includes("kettle")) {
    return "mash_to_kettle";
  }
  if (normalizeText(step.stage) === "mash" || text.includes("hlt")) {
    return "hlt_to_mash";
  }
  return null;
};
const resolveNodeByRef = (nodes, ref) => {
  const normalized = String(ref ?? "").trim();
  if (!normalized) return void 0;
  if (normalized.startsWith("node:")) {
    const nodeId = normalized.slice("node:".length);
    return nodes.find((node) => node.id === nodeId);
  }
  return nodes.find((node) => node.data.logicalDeviceId === normalized) ?? nodes.find((node) => node.id === normalized);
};
const inferValveRefForKeywords = (nodes, includeKeywords) => {
  const candidate = nodes.find((node) => {
    if (node.data.widgetType !== "valve") return false;
    const label = normalizeText(node.data.label);
    return includeKeywords.some((keyword) => label.includes(keyword));
  });
  return candidate ? refForNode(candidate) : void 0;
};
const inferPumpRef = (nodes, equipmentMap) => {
  const mapped = String(equipmentMap?.roles?.transfer_pump_primary ?? "").trim();
  if (mapped) {
    const mappedNode = resolveNodeByRef(nodes, mapped);
    if (mappedNode) return refForNode(mappedNode);
  }
  const transferController = nodes.find((node) => node.data.widgetType === "transfer_controller");
  if (transferController) return refForNode(transferController);
  const pump = nodes.find((node) => node.data.widgetType === "pump");
  return pump ? refForNode(pump) : void 0;
};
const inferRouteSuggestion = (routeKey, nodes, equipmentMap) => {
  const pumpRef = inferPumpRef(nodes, equipmentMap);
  const transferControllerNode = nodes.find(
    (node) => node.data.widgetType === "transfer_controller"
  );
  const transferControllerRef = transferControllerNode ? refForNode(transferControllerNode) : void 0;
  const sourceKeywordsByRoute = {
    hlt_to_mash: ["hlt"],
    mash_to_kettle: ["mash"],
    kettle_to_fermenter: ["kettle", "boil"],
    fermenter_to_bright: ["ferment", "bright"],
    bright_to_packaging: ["bright", "packag", "keg", "bottle"]
  };
  const destinationKeywordsByRoute = {
    hlt_to_mash: ["mash"],
    mash_to_kettle: ["kettle", "boil"],
    kettle_to_fermenter: ["ferment"],
    fermenter_to_bright: ["bright"],
    bright_to_packaging: ["packag", "keg", "bottle"]
  };
  const sourceValveRef = inferValveRefForKeywords(
    nodes,
    sourceKeywordsByRoute[routeKey]
  );
  const destinationValveRef = inferValveRefForKeywords(
    nodes,
    destinationKeywordsByRoute[routeKey]
  );
  if (!pumpRef && !transferControllerRef && !sourceValveRef && !destinationValveRef) {
    return void 0;
  }
  return {
    enabled: true,
    transferControllerRef,
    pumpRef,
    sourceValveRef,
    destinationValveRef,
    closeValvesOnComplete: true,
    requireArmConfirm: routeKey === "bright_to_packaging"
  };
};
const buildSuggestedTransferRoutes = (project, equipmentMap, existing) => {
  const nodes = allNodes(project);
  const next = {
    ...existing?.routes ?? {}
  };
  for (const route of transferRouteDefs) {
    const current = next[route.key];
    const hasCurrent = Boolean(current?.transferControllerRef) || Boolean(current?.pumpRef) || Boolean(current?.sourceValveRef) || Boolean(current?.destinationValveRef);
    if (hasCurrent) continue;
    const suggested = inferRouteSuggestion(route.key, nodes, equipmentMap);
    if (suggested) {
      next[route.key] = suggested;
    }
  }
  return next;
};
const buildTransferRouteOptions = (project, devices) => {
  const pages = sourcePages(project);
  const source = pages.some((page) => page.mode === "published") ? "published_pages" : "all_pages";
  const nodes = pages.flatMap((page) => page.nodes ?? []);
  const options = [];
  const seen = /* @__PURE__ */ new Set();
  for (const node of nodes) {
    if (!["pump", "valve", "transfer_controller"].includes(node.data.widgetType)) continue;
    const refs = [node.id, node.data.logicalDeviceId].filter(Boolean);
    for (const ref of refs) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      options.push({
        value: ref,
        label: `${node.data.label} (${node.data.widgetType})`,
        type: node.data.widgetType,
        source: "canvas"
      });
    }
  }
  for (const device of devices) {
    if (!["pump", "valve", "transfer_controller"].includes(device.type)) continue;
    if (seen.has(device.id)) continue;
    seen.add(device.id);
    options.push({
      value: device.id,
      label: `${device.name} (${device.type})`,
      type: device.type,
      source: "registry"
    });
  }
  return { source, options };
};
const normalizeValvePosition = (node, active) => {
  if (node.data.config.valveType === "3way") {
    return active ? "c_to_a" : "c_to_b";
  }
  return active ? "open" : "closed";
};
const applyRouteConfigToNode = (node, route, action) => {
  const active = action === "start";
  if (node.data.widgetType === "transfer_controller") {
    const speedPct = Number.isFinite(Number(route.speedPct)) && Number(route.speedPct) > 0 ? Number(route.speedPct) : node.data.config.transferController?.transferSpeedPct;
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          value: speedPct ?? node.data.config.value,
          state: active ? "on" : "off",
          transferController: {
            ...node.data.config.transferController,
            transferActive: active,
            transferSpeedPct: speedPct ?? node.data.config.transferController?.transferSpeedPct
          }
        }
      }
    };
  }
  if (node.data.widgetType === "pump") {
    const speedPct = Number.isFinite(Number(route.speedPct)) && Number(route.speedPct) > 0 ? Number(route.speedPct) : Number(node.data.config.value ?? 60);
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          value: active ? speedPct : 0,
          state: active ? "on" : "off"
        }
      }
    };
  }
  if (node.data.widgetType === "valve") {
    const shouldClose = action === "complete" && route.closeValvesOnComplete !== false;
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          position: shouldClose ? normalizeValvePosition(node, false) : normalizeValvePosition(node, true),
          state: node.data.config.valveType === "3way" ? void 0 : shouldClose ? "off" : "on"
        }
      }
    };
  }
  return node;
};
const applyTransferRouteToProject = (project, route, action) => {
  const nodes = allNodes(project);
  const refs = [
    route.transferControllerRef,
    route.pumpRef,
    route.sourceValveRef,
    route.destinationValveRef
  ].filter(Boolean);
  const targetIds = refs.map((ref) => resolveNodeByRef(nodes, ref)).filter((node) => Boolean(node)).map((node) => node.id);
  const targetSet = new Set(targetIds);
  if (targetSet.size === 0) {
    return { project, appliedNodeIds: [] };
  }
  const nextPages = (project.pages ?? []).map((page) => ({
    ...page,
    nodes: (page.nodes ?? []).map(
      (node) => targetSet.has(node.id) ? applyRouteConfigToNode(node, route, action) : node
    )
  }));
  return {
    project: {
      ...project,
      pages: nextPages
    },
    appliedNodeIds: [...targetSet]
  };
};
const resolveRunAndCurrentStep = (runs, runId) => {
  const run = runs.find((item) => item.runId === runId);
  if (!run) return null;
  const step = run.currentStepIndex >= 0 && run.currentStepIndex < run.steps.length ? run.steps[run.currentStepIndex] : null;
  return { run, step };
};

const validRouteKeys = [
  "hlt_to_mash",
  "mash_to_kettle",
  "kettle_to_fermenter",
  "fermenter_to_bright",
  "bright_to_packaging"
];
async function handler(req, res) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: "runId is required."
      });
    }
    const body = req.body;
    const action = body?.action;
    if (action !== "start" && action !== "complete") {
      return res.status(400).json({
        success: false,
        error: 'action must be "start" or "complete".'
      });
    }
    const runs = await recipeRunner.snapshot();
    const runState = resolveRunAndCurrentStep(runs, runId);
    if (!runState) {
      return res.status(404).json({
        success: false,
        error: "Run not found."
      });
    }
    const { step, run } = runState;
    if (!step) {
      return res.status(409).json({
        success: false,
        error: "No active recipe step for transfer."
      });
    }
    const inferred = inferTransferRouteKey(step);
    const routeKey = validRouteKeys.includes(body?.routeKey) ? body?.routeKey : inferred;
    if (!routeKey) {
      return res.status(409).json({
        success: false,
        error: "Unable to determine transfer route for current step."
      });
    }
    const [map, project] = await Promise.all([
      readTransferRouteMap(),
      readCanvasProject()
    ]);
    const route = map.routes?.[routeKey];
    if (!route || route.enabled === false) {
      return res.status(409).json({
        success: false,
        error: `Transfer route "${routeKey}" is not configured.`
      });
    }
    if (action === "start" && route.requireArmConfirm === true && body.armConfirmed !== true) {
      return res.status(409).json({
        success: false,
        error: "Packaging transfer requires explicit arm confirmation.",
        requiresArmConfirm: true,
        routeKey
      });
    }
    const result = applyTransferRouteToProject(project, route, action);
    if (result.appliedNodeIds.length === 0) {
      return res.status(409).json({
        success: false,
        error: `No mapped pump/valve/controller nodes found for route "${routeKey}".`
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
        projectUpdatedAt: updatedProject.updatedAt
      }
    });
  } catch (error) {
    console.error("Failed to execute transfer route:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to execute transfer route."
    });
  }
}

export { buildSuggestedTransferRoutes as a, buildTransferRouteOptions as b, handler as h, transferRouteDefs as t };
