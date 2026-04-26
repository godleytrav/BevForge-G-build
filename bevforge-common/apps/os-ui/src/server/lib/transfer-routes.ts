import type { CanvasNode, CanvasProject, RegisteredDevice } from '../../features/canvas/types.js';
import type {
  EquipmentRoleMapState,
  TransferRouteConfig,
  TransferRouteKey,
  TransferRouteMapState,
} from './commissioning-store.js';
import type { RecipeRunRecord, RecipeRunStepState } from './commissioning-store.js';

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const refForNode = (node: CanvasNode): string =>
  node.data.logicalDeviceId ?? `node:${node.id}`;

const sourcePages = (project: CanvasProject) => {
  const published = (project.pages ?? []).filter((page) => page.mode === 'published');
  return published.length > 0 ? published : (project.pages ?? []);
};

const allNodes = (project: CanvasProject): CanvasNode[] =>
  sourcePages(project).flatMap((page) => page.nodes ?? []);

export const transferRouteDefs: Array<{
  key: TransferRouteKey;
  label: string;
  fromLabel: string;
  toLabel: string;
}> = [
  {
    key: 'hlt_to_mash',
    label: 'HLT -> Mash Tun',
    fromLabel: 'HLT',
    toLabel: 'Mash Tun',
  },
  {
    key: 'mash_to_kettle',
    label: 'Mash Tun -> Boil Kettle',
    fromLabel: 'Mash Tun',
    toLabel: 'Boil Kettle',
  },
  {
    key: 'kettle_to_fermenter',
    label: 'Boil Kettle -> Fermenter',
    fromLabel: 'Boil Kettle',
    toLabel: 'Fermenter',
  },
  {
    key: 'fermenter_to_bright',
    label: 'Fermenter -> Bright Tank',
    fromLabel: 'Fermenter',
    toLabel: 'Bright Tank',
  },
  {
    key: 'bright_to_packaging',
    label: 'Bright Tank -> Packaging',
    fromLabel: 'Bright Tank',
    toLabel: 'Packaging',
  },
];

export const inferTransferRouteKey = (
  step?: Pick<RecipeRunStepState, 'name' | 'stage' | 'action' | 'triggerWhen'>
): TransferRouteKey | null => {
  if (!step) return null;
  const text = `${normalizeText(step.name)} ${normalizeText(step.stage)} ${normalizeText(
    step.action
  )} ${normalizeText(step.triggerWhen)}`;

  if (
    text.includes('packag') ||
    text.includes('keg') ||
    text.includes('bottle') ||
    text.includes('can')
  ) {
    return 'bright_to_packaging';
  }
  if (
    text.includes('bright') ||
    text.includes('conditioning') ||
    text.includes('brite')
  ) {
    return 'fermenter_to_bright';
  }
  if (
    normalizeText(step.stage) === 'fermentation' ||
    text.includes('fermenter') ||
    text.includes('transfer_complete') ||
    text.includes('chill')
  ) {
    return 'kettle_to_fermenter';
  }
  if (normalizeText(step.stage) === 'boil' || text.includes('kettle')) {
    return 'mash_to_kettle';
  }
  if (normalizeText(step.stage) === 'mash' || text.includes('hlt')) {
    return 'hlt_to_mash';
  }
  return null;
};

export const resolveNodeByRef = (
  nodes: CanvasNode[],
  ref?: string
): CanvasNode | undefined => {
  const normalized = String(ref ?? '').trim();
  if (!normalized) return undefined;
  if (normalized.startsWith('node:')) {
    const nodeId = normalized.slice('node:'.length);
    return nodes.find((node) => node.id === nodeId);
  }
  return (
    nodes.find((node) => node.data.logicalDeviceId === normalized) ??
    nodes.find((node) => node.id === normalized)
  );
};

const inferValveRefForKeywords = (
  nodes: CanvasNode[],
  includeKeywords: string[]
): string | undefined => {
  const candidate = nodes.find((node) => {
    if (node.data.widgetType !== 'valve') return false;
    const label = normalizeText(node.data.label);
    return includeKeywords.some((keyword) => label.includes(keyword));
  });
  return candidate ? refForNode(candidate) : undefined;
};

const inferPumpRef = (nodes: CanvasNode[], equipmentMap?: EquipmentRoleMapState): string | undefined => {
  const mapped = String(equipmentMap?.roles?.transfer_pump_primary ?? '').trim();
  if (mapped) {
    const mappedNode = resolveNodeByRef(nodes, mapped);
    if (mappedNode) return refForNode(mappedNode);
  }
  const transferController = nodes.find((node) => node.data.widgetType === 'transfer_controller');
  if (transferController) return refForNode(transferController);
  const pump = nodes.find((node) => node.data.widgetType === 'pump');
  return pump ? refForNode(pump) : undefined;
};

const inferRouteSuggestion = (
  routeKey: TransferRouteKey,
  nodes: CanvasNode[],
  equipmentMap?: EquipmentRoleMapState
): TransferRouteConfig | undefined => {
  const pumpRef = inferPumpRef(nodes, equipmentMap);
  const transferControllerNode = nodes.find(
    (node) => node.data.widgetType === 'transfer_controller'
  );
  const transferControllerRef = transferControllerNode
    ? refForNode(transferControllerNode)
    : undefined;

  const sourceKeywordsByRoute: Record<TransferRouteKey, string[]> = {
    hlt_to_mash: ['hlt'],
    mash_to_kettle: ['mash'],
    kettle_to_fermenter: ['kettle', 'boil'],
    fermenter_to_bright: ['ferment', 'bright'],
    bright_to_packaging: ['bright', 'packag', 'keg', 'bottle', 'can'],
  };

  const destinationKeywordsByRoute: Record<TransferRouteKey, string[]> = {
    hlt_to_mash: ['mash'],
    mash_to_kettle: ['kettle', 'boil'],
    kettle_to_fermenter: ['ferment'],
    fermenter_to_bright: ['bright'],
    bright_to_packaging: ['packag', 'keg', 'bottle', 'can'],
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
    return undefined;
  }

  return {
    enabled: true,
    transferControllerRef,
    pumpRef,
    sourceValveRef,
    destinationValveRef,
    closeValvesOnComplete: true,
    requireArmConfirm: routeKey === 'bright_to_packaging',
  };
};

export const buildSuggestedTransferRoutes = (
  project: CanvasProject,
  equipmentMap?: EquipmentRoleMapState,
  existing?: TransferRouteMapState
): Partial<Record<TransferRouteKey, TransferRouteConfig>> => {
  const nodes = allNodes(project);
  const next: Partial<Record<TransferRouteKey, TransferRouteConfig>> = {
    ...(existing?.routes ?? {}),
  };

  for (const route of transferRouteDefs) {
    const current = next[route.key];
    const hasCurrent =
      Boolean(current?.transferControllerRef) ||
      Boolean(current?.pumpRef) ||
      Boolean(current?.sourceValveRef) ||
      Boolean(current?.destinationValveRef);
    if (hasCurrent) continue;
    const suggested = inferRouteSuggestion(route.key, nodes, equipmentMap);
    if (suggested) {
      next[route.key] = suggested;
    }
  }
  return next;
};

export const buildTransferRouteOptions = (
  project: CanvasProject,
  devices: RegisteredDevice[]
): {
  source: 'published_pages' | 'all_pages';
  options: Array<{
    value: string;
    label: string;
    type: string;
    source: 'canvas' | 'registry';
  }>;
} => {
  const pages = sourcePages(project);
  const source = pages.some((page) => page.mode === 'published')
    ? 'published_pages'
    : 'all_pages';
  const nodes = pages.flatMap((page) => page.nodes ?? []);
  const options: Array<{
    value: string;
    label: string;
    type: string;
    source: 'canvas' | 'registry';
  }> = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (!['pump', 'valve', 'transfer_controller'].includes(node.data.widgetType)) continue;
    const refs = [node.id, node.data.logicalDeviceId].filter(Boolean) as string[];
    for (const ref of refs) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      options.push({
        value: ref,
        label: `${node.data.label} (${node.data.widgetType})`,
        type: node.data.widgetType,
        source: 'canvas',
      });
    }
  }

  for (const device of devices) {
    if (!['pump', 'valve', 'transfer_controller'].includes(device.type)) continue;
    if (seen.has(device.id)) continue;
    seen.add(device.id);
    options.push({
      value: device.id,
      label: `${device.name} (${device.type})`,
      type: device.type,
      source: 'registry',
    });
  }

  return { source, options };
};

const normalizeValvePosition = (
  node: CanvasNode,
  active: boolean
): CanvasNode['data']['config']['position'] => {
  if (node.data.config.valveType === '3way') {
    return active ? 'c_to_a' : 'c_to_b';
  }
  return active ? 'open' : 'closed';
};

const applyRouteConfigToNode = (
  node: CanvasNode,
  route: TransferRouteConfig,
  action: 'start' | 'complete'
): CanvasNode => {
  const active = action === 'start';
  if (node.data.widgetType === 'transfer_controller') {
    const speedPct =
      Number.isFinite(Number(route.speedPct)) && Number(route.speedPct) > 0
        ? Number(route.speedPct)
        : node.data.config.transferController?.transferSpeedPct;
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          value: speedPct ?? node.data.config.value,
          state: active ? 'on' : 'off',
          transferController: {
            ...node.data.config.transferController,
            transferActive: active,
            transferSpeedPct: speedPct ?? node.data.config.transferController?.transferSpeedPct,
          },
        },
      },
    };
  }
  if (node.data.widgetType === 'pump') {
    const speedPct =
      Number.isFinite(Number(route.speedPct)) && Number(route.speedPct) > 0
        ? Number(route.speedPct)
        : Number(node.data.config.value ?? 60);
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          value: active ? speedPct : 0,
          state: active ? 'on' : 'off',
        },
      },
    };
  }
  if (node.data.widgetType === 'valve') {
    const shouldClose =
      action === 'complete' && route.closeValvesOnComplete !== false;
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          position: shouldClose
            ? normalizeValvePosition(node, false)
            : normalizeValvePosition(node, true),
          state:
            node.data.config.valveType === '3way'
              ? undefined
              : shouldClose
              ? 'off'
              : 'on',
        },
      },
    };
  }
  return node;
};

export const applyTransferRouteToProject = (
  project: CanvasProject,
  route: TransferRouteConfig,
  action: 'start' | 'complete'
): {
  project: CanvasProject;
  appliedNodeIds: string[];
} => {
  const nodes = allNodes(project);
  const refs = [
    route.transferControllerRef,
    route.pumpRef,
    route.sourceValveRef,
    route.destinationValveRef,
  ].filter(Boolean) as string[];
  const targetIds = refs
    .map((ref) => resolveNodeByRef(nodes, ref))
    .filter((node): node is CanvasNode => Boolean(node))
    .map((node) => node.id);
  const targetSet = new Set(targetIds);
  if (targetSet.size === 0) {
    return { project, appliedNodeIds: [] };
  }

  const nextPages = (project.pages ?? []).map((page) => ({
    ...page,
    nodes: (page.nodes ?? []).map((node) =>
      targetSet.has(node.id) ? applyRouteConfigToNode(node, route, action) : node
    ),
  }));

  return {
    project: {
      ...project,
      pages: nextPages,
    },
    appliedNodeIds: [...targetSet],
  };
};

export const resolveRunAndCurrentStep = (
  runs: RecipeRunRecord[],
  runId: string
): { run: RecipeRunRecord; step: RecipeRunStepState | null } | null => {
  const run = runs.find((item) => item.runId === runId);
  if (!run) return null;
  const step =
    run.currentStepIndex >= 0 && run.currentStepIndex < run.steps.length
      ? run.steps[run.currentStepIndex]
      : null;
  return { run, step };
};
