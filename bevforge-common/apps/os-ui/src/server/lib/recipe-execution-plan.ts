import type {
  CanvasNode,
  CanvasProject,
  ImportedRecipe,
  RegisteredDevice,
} from '../../features/canvas/types.js';
import type {
  EquipmentRoleId,
  EquipmentRoleMapState,
} from './commissioning-store.js';

const normalizeText = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase();

const normalizeTargetId = (value: unknown): string =>
  normalizeText(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const validCommands = new Set<NonNullable<ImportedRecipe['steps'][number]['command']>>([
  'on_off',
  'open_close',
  'route',
  'set_value',
  'trigger',
]);

const targetAliasRoleCandidates: Record<string, EquipmentRoleId[]> = {
  mash_heater: ['heat_source_primary'],
  kettle_heater: ['heat_source_primary'],
  hlt_heater: ['heat_source_primary'],
  mash_temp_sensor: ['temp_sensor_mash'],
  ferment_temp_sensor: ['temp_sensor_fermenter'],
  ferment_temp_control: ['temp_sensor_fermenter', 'glycol_pump', 'glycol_supply_valve'],
  chiller_loop: ['glycol_pump', 'glycol_supply_valve'],
  glycol_loop: ['glycol_pump', 'glycol_supply_valve'],
  transfer_pump: ['transfer_pump_primary'],
  transfer_path: ['transfer_pump_primary'],
  heat_source_primary: ['heat_source_primary'],
  transfer_pump_primary: ['transfer_pump_primary'],
  glycol_pump: ['glycol_pump'],
  glycol_supply_valve: ['glycol_supply_valve'],
  hlt_vessel: ['hlt_vessel'],
  mash_tun_vessel: ['mash_tun_vessel'],
  boil_kettle_vessel: ['boil_kettle_vessel'],
  fermenter_primary: ['fermenter_primary'],
  temp_sensor_mash: ['temp_sensor_mash'],
  temp_sensor_fermenter: ['temp_sensor_fermenter'],
};

const commandFromStep = (
  step: ImportedRecipe['steps'][number]
): ImportedRecipe['steps'][number]['command'] => {
  if (step.command && validCommands.has(step.command)) {
    return step.command;
  }
  if (typeof step.temperatureC === 'number' && Number.isFinite(step.temperatureC)) {
    return 'set_value';
  }
  const actionText = `${normalizeText(step.stage)} ${normalizeText(step.action)} ${normalizeText(step.name)}`;
  if (actionText.includes('route') || actionText.includes('valve')) {
    return 'route';
  }
  if (actionText.includes('toggle')) {
    return 'on_off';
  }
  if (
    actionText.includes('transfer') ||
    actionText.includes('pump') ||
    actionText.includes('heat') ||
    actionText.includes('cool')
  ) {
    return 'trigger';
  }
  return step.command;
};

const inferAliasFromStep = (step: ImportedRecipe['steps'][number]): string | undefined => {
  const actionText = `${normalizeText(step.stage)} ${normalizeText(step.action)} ${normalizeText(step.name)}`;
  const isIngredientAdd =
    actionText.includes('hop_add') ||
    actionText.includes('hop add') ||
    actionText.includes('ingredient add') ||
    actionText.includes('add ingredient');
  if (isIngredientAdd) return undefined;

  if (
    actionText.includes('cold_crash') ||
    actionText.includes('cold crash') ||
    actionText.includes('chill') ||
    actionText.includes('cool')
  ) {
    return 'chiller_loop';
  }
  if (
    actionText.includes('ferment') ||
    actionText.includes('diacetyl') ||
    actionText.includes('hold_temp')
  ) {
    return 'ferment_temp_control';
  }
  if (actionText.includes('boil')) {
    return 'kettle_heater';
  }
  if (actionText.includes('mash') || actionText.includes('strike') || actionText.includes('heat')) {
    return 'mash_heater';
  }
  if (actionText.includes('transfer') || actionText.includes('pump')) {
    return 'transfer_pump';
  }
  return undefined;
};

const nodeRef = (node: CanvasNode): string =>
  node.data.logicalDeviceId ?? `node:${node.id}`;

export interface RecipeExecutionPlanResult {
  recipe: ImportedRecipe;
  resolvedTargetCount: number;
  inferredTargetCount: number;
  unresolvedTargetAliases: string[];
  notes: string[];
}

export const compileRecipeForExecution = (
  recipe: ImportedRecipe,
  project: CanvasProject,
  devices: RegisteredDevice[],
  equipmentRoleMap?: EquipmentRoleMapState
): RecipeExecutionPlanResult => {
  const publishedPages = (project.pages ?? []).filter((page) => page.mode === 'published');
  const sourcePages = publishedPages.length > 0 ? publishedPages : (project.pages ?? []);
  const nodes = sourcePages.flatMap((page) => page.nodes ?? []);
  const roleMappings = equipmentRoleMap?.roles ?? {};

  const nodesById = new Map<string, CanvasNode>();
  const nodesByLogicalId = new Map<string, CanvasNode>();
  for (const node of nodes) {
    nodesById.set(node.id, node);
    if (node.data.logicalDeviceId) {
      nodesByLogicalId.set(node.data.logicalDeviceId, node);
    }
  }

  const devicesById = new Map<string, RegisteredDevice>();
  for (const device of devices) {
    devicesById.set(device.id, device);
  }

  const nodesOfType = (widgetTypes: Array<CanvasNode['data']['widgetType']>): CanvasNode[] =>
    nodes.filter((node) => widgetTypes.includes(node.data.widgetType));

  const mappedRoleRef = (role: EquipmentRoleId): string | undefined => {
    const mappedValue = roleMappings[role];
    if (!mappedValue) return undefined;
    const normalized = String(mappedValue).trim();
    if (!normalized) return undefined;
    if (normalized.startsWith('node:')) {
      const node = nodesById.get(normalized.slice('node:'.length));
      return node ? nodeRef(node) : undefined;
    }
    const byLogical = nodesByLogicalId.get(normalized);
    if (byLogical) return nodeRef(byLogical);
    const byNodeId = nodesById.get(normalized);
    if (byNodeId) return nodeRef(byNodeId);
    if (devicesById.has(normalized)) {
      const byDeviceNode = nodesByLogicalId.get(normalized);
      return byDeviceNode ? nodeRef(byDeviceNode) : undefined;
    }
    return undefined;
  };

  const fallbackRefForRole = (role: EquipmentRoleId): string | undefined => {
    if (role === 'heat_source_primary') {
      const node =
        nodesOfType(['hlt_controller', 'heater', 'pid'])[0] ??
        nodesOfType(['vessel']).find((candidate) =>
          normalizeText(candidate.data.config.vesselType).includes('hlt')
        );
      return node ? nodeRef(node) : undefined;
    }
    if (role === 'transfer_pump_primary') {
      const node =
        nodesOfType(['transfer_controller'])[0] ?? nodesOfType(['pump'])[0];
      return node ? nodeRef(node) : undefined;
    }
    if (role === 'glycol_pump' || role === 'glycol_supply_valve') {
      const node =
        nodesOfType(['glycol_controller'])[0] ??
        nodesOfType(['pump', 'valve'])[0];
      return node ? nodeRef(node) : undefined;
    }
    if (role === 'temp_sensor_mash' || role === 'temp_sensor_fermenter') {
      const node = nodesOfType(['sensor'])[0];
      return node ? nodeRef(node) : undefined;
    }
    if (role === 'mash_tun_vessel' || role === 'boil_kettle_vessel' || role === 'fermenter_primary' || role === 'hlt_vessel') {
      const node = nodesOfType(['vessel'])[0];
      return node ? nodeRef(node) : undefined;
    }
    return undefined;
  };

  const resolveRoleAliasToRef = (alias: string): string | undefined => {
    const roles = targetAliasRoleCandidates[alias] ?? [];
    for (const role of roles) {
      const mapped = mappedRoleRef(role);
      if (mapped) return mapped;
    }
    for (const role of roles) {
      const fallback = fallbackRefForRole(role);
      if (fallback) return fallback;
    }
    return undefined;
  };

  let resolvedTargetCount = 0;
  let inferredTargetCount = 0;
  const unresolvedTargetAliases = new Set<string>();
  const notes: string[] = [];

  const nextSteps = recipe.steps.map((step) => {
    const nextStep: ImportedRecipe['steps'][number] = { ...step };
    let target = String(step.targetDeviceId ?? '').trim();
    let inferred = false;

    if (target) {
      if (target.startsWith('node:')) {
        const byNode = nodesById.get(target.slice('node:'.length));
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

    nextStep.targetDeviceId = target || undefined;
    if (inferred && !step.triggerWhen && normalizeText(step.action) === 'hold') {
      nextStep.triggerWhen = step.triggerWhen;
    }

    const nextCommand = commandFromStep(nextStep);
    nextStep.command = nextCommand;
    if (
      nextCommand === 'set_value' &&
      nextStep.value === undefined &&
      typeof nextStep.temperatureC === 'number' &&
      Number.isFinite(nextStep.temperatureC)
    ) {
      nextStep.value = nextStep.temperatureC;
    }
    return nextStep;
  });

  return {
    recipe: {
      ...recipe,
      steps: nextSteps,
    },
    resolvedTargetCount,
    inferredTargetCount,
    unresolvedTargetAliases: [...unresolvedTargetAliases],
    notes,
  };
};
