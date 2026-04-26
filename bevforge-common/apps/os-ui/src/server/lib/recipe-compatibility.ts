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
import type { InventoryRequirementCheck } from './inventory-batch-store.js';

type RequirementOutcome = 'met' | 'fallback' | 'missing';
type MissingSeverity = 'blocker' | 'warning';

export interface RecipePreflightRequirement {
  id: string;
  label: string;
  outcome: RequirementOutcome;
  detail: string;
  missingSeverity?: MissingSeverity;
  manualFallback?: string;
  matchedDeviceIds: string[];
  matchedLabels: string[];
}

export interface RecipePreflightReport {
  recipeId: string;
  recipeName: string;
  status: 'compatible' | 'needs_override' | 'incompatible';
  readyToRun: boolean;
  requiresManualOverride: boolean;
  blockers: string[];
  warnings: string[];
  requirements: RecipePreflightRequirement[];
  inferredStages: string[];
  equipment: {
    source: 'published_pages' | 'all_pages';
    pageCount: number;
    nodeCount: number;
    widgetCounts: Record<string, number>;
    vesselTypeCounts: Record<string, number>;
  };
  missingTargetDevices: string[];
  roleMappings: Partial<Record<EquipmentRoleId, string>>;
  inventoryChecks: InventoryRequirementCheck[];
  generatedAt: string;
}

const nowIso = () => new Date().toISOString();

const normalizeText = (value: string | undefined): string =>
  String(value ?? '').trim().toLowerCase();

const normalizeTargetId = (value: string | undefined): string =>
  normalizeText(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const nodeDeviceId = (node: CanvasNode): string =>
  node.data.logicalDeviceId ?? node.id;

const nodeLabel = (node: CanvasNode): string =>
  `${node.data.label} (${node.data.widgetType})`;

const addRequirementMessage = (
  requirement: RecipePreflightRequirement,
  blockers: string[],
  warnings: string[]
) => {
  if (requirement.outcome === 'met') return;
  const base = `${requirement.label}: ${requirement.detail}`;
  const withFallback = requirement.manualFallback
    ? `${base} Fallback: ${requirement.manualFallback}`
    : base;
  if (requirement.outcome === 'missing' && requirement.missingSeverity === 'blocker') {
    blockers.push(withFallback);
    return;
  }
  warnings.push(withFallback);
};

const inferRecipeStages = (recipe: ImportedRecipe): string[] => {
  const stages = new Set<string>();
  recipe.steps.forEach((step) => {
    const stage = normalizeText(step.stage);
    if (stage) stages.add(stage);
    const action = normalizeText(step.action);
    if (action.includes('mash')) stages.add('mash');
    if (action.includes('boil') || action.includes('whirlpool')) stages.add('boil');
    if (action.includes('ferment') || action.includes('cold_crash')) stages.add('fermentation');
    if (action.includes('transfer') || action.includes('pump')) stages.add('transfer');
    if (action.includes('cool') || action.includes('chill')) stages.add('cooling');
  });
  return [...stages];
};

const includesAny = (haystack: string[], needles: string[]) =>
  haystack.some((value) => needles.some((needle) => value.includes(needle)));

interface ResolvedMappedRole {
  role: EquipmentRoleId;
  configuredValue?: string;
  resolvedNode?: CanvasNode;
  resolvedDevice?: RegisteredDevice;
}

export const buildRecipePreflightReport = (
  recipe: ImportedRecipe,
  project: CanvasProject,
  devices: RegisteredDevice[],
  equipmentRoleMap?: EquipmentRoleMapState,
  inventoryChecks: InventoryRequirementCheck[] = []
): RecipePreflightReport => {
  const publishedPages = (project.pages ?? []).filter((page) => page.mode === 'published');
  const sourcePages = publishedPages.length > 0 ? publishedPages : (project.pages ?? []);
  const source = publishedPages.length > 0 ? 'published_pages' : 'all_pages';
  const nodes = sourcePages.flatMap((page) => page.nodes ?? []);
  const roleMappings = equipmentRoleMap?.roles ?? {};

  const nodesByType = (widgetType: string) =>
    nodes.filter((node) => node.data.widgetType === widgetType);
  const vesselNodes = nodesByType('vessel');
  const heaterNodes = nodesByType('heater');
  const pumpNodes = nodesByType('pump');
  const valveNodes = nodesByType('valve');
  const glycolControllerNodes = nodesByType('glycol_controller');
  const sensorNodes = nodesByType('sensor');

  const vesselByType = (vesselType: string) =>
    vesselNodes.filter(
      (node) => normalizeText(String(node.data.config?.vesselType ?? 'generic')) === vesselType
    );

  const temperatureSensors = sensorNodes.filter(
    (node) => normalizeText(String(node.data.config?.sensorType ?? 'temperature')) === 'temperature'
  );

  const nodeByAnyId = new Map<string, CanvasNode>();
  nodes.forEach((node) => {
    nodeByAnyId.set(node.id, node);
    if (node.data.logicalDeviceId) {
      nodeByAnyId.set(node.data.logicalDeviceId, node);
    }
  });
  const deviceById = new Map<string, RegisteredDevice>();
  devices.forEach((device) => deviceById.set(device.id, device));

  const resolveMappedRole = (role: EquipmentRoleId): ResolvedMappedRole => {
    const configuredValue = roleMappings[role];
    if (!configuredValue) {
      return { role };
    }
    return {
      role,
      configuredValue,
      resolvedNode: nodeByAnyId.get(configuredValue),
      resolvedDevice: deviceById.get(configuredValue),
    };
  };

  const mappedNodeIds = (...roles: EquipmentRoleId[]) =>
    roles
      .map((role) => resolveMappedRole(role))
      .flatMap((entry) => {
        if (entry.resolvedNode) {
          return [nodeDeviceId(entry.resolvedNode)];
        }
        if (entry.resolvedDevice) {
          return [entry.resolvedDevice.id];
        }
        return [];
      });

  const mappedLabels = (...roles: EquipmentRoleId[]) =>
    roles
      .map((role) => resolveMappedRole(role))
      .flatMap((entry) => {
        if (entry.resolvedNode) return [nodeLabel(entry.resolvedNode)];
        if (entry.resolvedDevice) {
          return [`${entry.resolvedDevice.name} (${entry.resolvedDevice.type})`];
        }
        return [];
      });

  const widgetCounts: Record<string, number> = {};
  nodes.forEach((node) => {
    const key = node.data.widgetType;
    widgetCounts[key] = (widgetCounts[key] ?? 0) + 1;
  });

  const vesselTypeCounts: Record<string, number> = {};
  vesselNodes.forEach((node) => {
    const key = String(node.data.config?.vesselType ?? 'generic');
    vesselTypeCounts[key] = (vesselTypeCounts[key] ?? 0) + 1;
  });

  const stages = inferRecipeStages(recipe);
  const stepTexts = recipe.steps.map((step) =>
    `${normalizeText(step.stage)} ${normalizeText(step.action)} ${normalizeText(step.name)}`
  );
  const hasMash = stages.includes('mash');
  const hasBoil = stages.includes('boil');
  const hasFermentation = stages.includes('fermentation');
  const hasTransfer = stages.includes('transfer');
  const hasCooling =
    stages.includes('cooling') || includesAny(stepTexts, ['cool', 'chill', 'cold crash', 'glycol']);
  const hasHeating =
    hasMash || hasBoil || includesAny(stepTexts, ['heat', 'strike', 'hlt', 'hold_temp', 'set_value']);

  const requirements: RecipePreflightRequirement[] = [];
  const addRequirement = (requirement: RecipePreflightRequirement) => {
    requirements.push(requirement);
  };

  if (nodes.length === 0) {
    addRequirement({
      id: 'commissioned-canvas',
      label: 'Commissioned Equipment',
      outcome: 'missing',
      detail: 'No equipment widgets were found on the selected canvas pages.',
      missingSeverity: 'blocker',
      manualFallback:
        'Add and publish your main brewhouse devices on canvas before starting recipe execution.',
      matchedDeviceIds: [],
      matchedLabels: [],
    });
  }

  if (source === 'all_pages' && (project.pages ?? []).length > 0) {
    addRequirement({
      id: 'published-pages',
      label: 'Published Canvas Pages',
      outcome: 'fallback',
      detail: 'No published canvas pages found; using draft pages for equipment detection.',
      missingSeverity: 'warning',
      manualFallback:
        'Publish the production pages so recipe execution always resolves against locked layouts.',
      matchedDeviceIds: [],
      matchedLabels: [],
    });
  }

  if (hasMash) {
    const mappedMashTun = resolveMappedRole('mash_tun_vessel');
    const mashTun = vesselByType('mash_tun');
    if (mappedMashTun.configuredValue) {
      if (mappedMashTun.resolvedNode || mappedMashTun.resolvedDevice) {
        addRequirement({
          id: 'mash-vessel',
          label: 'Mash Vessel',
          outcome: 'met',
          detail: `Mapped role \`mash_tun_vessel\` -> ${mappedMashTun.configuredValue}.`,
          matchedDeviceIds: mappedNodeIds('mash_tun_vessel'),
          matchedLabels: mappedLabels('mash_tun_vessel'),
        });
      } else {
        addRequirement({
          id: 'mash-vessel',
          label: 'Mash Vessel',
          outcome: 'missing',
          detail: `Mapped mash tun device not found: ${mappedMashTun.configuredValue}.`,
          missingSeverity: 'blocker',
          manualFallback: 'Update equipment role mapping or assign a valid mash tun.',
          matchedDeviceIds: [],
          matchedLabels: [],
        });
      }
    } else if (mashTun.length > 0) {
      addRequirement({
        id: 'mash-vessel',
        label: 'Mash Vessel',
        outcome: 'met',
        detail: 'Mash tun detected.',
        matchedDeviceIds: mashTun.map(nodeDeviceId),
        matchedLabels: mashTun.map(nodeLabel),
      });
    } else if (vesselNodes.length > 0) {
      addRequirement({
        id: 'mash-vessel',
        label: 'Mash Vessel',
        outcome: 'fallback',
        detail: 'No mash tun vessel type found.',
        missingSeverity: 'warning',
        manualFallback:
          'Assign one vessel as mash tun in widget config, or run mash steps manually.',
        matchedDeviceIds: vesselNodes.map(nodeDeviceId),
        matchedLabels: vesselNodes.map(nodeLabel),
      });
    } else {
      addRequirement({
        id: 'mash-vessel',
        label: 'Mash Vessel',
        outcome: 'missing',
        detail: 'Mash stage exists but no vessel is available.',
        missingSeverity: 'blocker',
        manualFallback: 'Add a vessel widget before executing mash stages.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  if (hasHeating) {
    const mappedHlt = resolveMappedRole('hlt_vessel');
    const mappedHeatSource = resolveMappedRole('heat_source_primary');
    const hlt = vesselByType('hlt');
    if (mappedHlt.configuredValue) {
      if (mappedHlt.resolvedNode || mappedHlt.resolvedDevice) {
        addRequirement({
          id: 'strike-heat-source',
          label: 'Heat Source (HLT / Heater)',
          outcome: 'met',
          detail: `Mapped role \`hlt_vessel\` -> ${mappedHlt.configuredValue}.`,
          matchedDeviceIds: mappedNodeIds('hlt_vessel'),
          matchedLabels: mappedLabels('hlt_vessel'),
        });
      } else {
        addRequirement({
          id: 'strike-heat-source',
          label: 'Heat Source (HLT / Heater)',
          outcome: 'missing',
          detail: `Mapped HLT device not found: ${mappedHlt.configuredValue}.`,
          missingSeverity: 'blocker',
          manualFallback: 'Update equipment role mapping or configure a valid HLT vessel.',
          matchedDeviceIds: [],
          matchedLabels: [],
        });
      }
    } else if (mappedHeatSource.configuredValue) {
      if (mappedHeatSource.resolvedNode || mappedHeatSource.resolvedDevice) {
        addRequirement({
          id: 'strike-heat-source',
          label: 'Heat Source (HLT / Heater)',
          outcome: 'fallback',
          detail: `Mapped role \`heat_source_primary\` -> ${mappedHeatSource.configuredValue}.`,
          missingSeverity: 'warning',
          manualFallback:
            'No HLT mapped; confirm process is compatible with heater-direct operations.',
          matchedDeviceIds: mappedNodeIds('heat_source_primary'),
          matchedLabels: mappedLabels('heat_source_primary'),
        });
      } else {
        addRequirement({
          id: 'strike-heat-source',
          label: 'Heat Source (HLT / Heater)',
          outcome: 'missing',
          detail: `Mapped heat source not found: ${mappedHeatSource.configuredValue}.`,
          missingSeverity: 'blocker',
          manualFallback: 'Update equipment role mapping or configure a valid heat source.',
          matchedDeviceIds: [],
          matchedLabels: [],
        });
      }
    } else if (hlt.length > 0) {
      addRequirement({
        id: 'strike-heat-source',
        label: 'Heat Source (HLT / Heater)',
        outcome: 'met',
        detail: 'HLT vessel detected for strike/heating tasks.',
        matchedDeviceIds: hlt.map(nodeDeviceId),
        matchedLabels: hlt.map(nodeLabel),
      });
    } else if (heaterNodes.length > 0 && vesselNodes.length > 0) {
      addRequirement({
        id: 'strike-heat-source',
        label: 'Heat Source (HLT / Heater)',
        outcome: 'fallback',
        detail: 'No HLT found; heater-based fallback is available.',
        missingSeverity: 'warning',
        manualFallback:
          'You can heat manually in mash tun/kettle and continue with override acknowledgement.',
        matchedDeviceIds: [...heaterNodes.map(nodeDeviceId), ...vesselNodes.map(nodeDeviceId)],
        matchedLabels: [...heaterNodes.map(nodeLabel), ...vesselNodes.map(nodeLabel)],
      });
    } else {
      addRequirement({
        id: 'strike-heat-source',
        label: 'Heat Source (HLT / Heater)',
        outcome: 'missing',
        detail: 'Heating steps exist but no HLT or heater is available.',
        missingSeverity: 'blocker',
        manualFallback:
          'Install/configure a heater path or run heating outside BevForge and proceed manually.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  if (hasBoil) {
    const mappedKettle = resolveMappedRole('boil_kettle_vessel');
    const mappedHeatSource = resolveMappedRole('heat_source_primary');
    const kettles = vesselByType('brew_kettle');
    if (mappedKettle.configuredValue) {
      if (mappedKettle.resolvedNode || mappedKettle.resolvedDevice) {
        const hasMappedHeat = Boolean(mappedHeatSource.resolvedNode || mappedHeatSource.resolvedDevice);
        addRequirement({
          id: 'boil-system',
          label: 'Boil System',
          outcome: hasMappedHeat ? 'met' : 'fallback',
          detail: hasMappedHeat
            ? `Mapped boil kettle and heat source detected.`
            : `Mapped boil kettle detected, but heat source role is not mapped.`,
          missingSeverity: hasMappedHeat ? undefined : 'warning',
          manualFallback: hasMappedHeat
            ? undefined
            : 'Map `heat_source_primary` or run heating manually and confirm steps.',
          matchedDeviceIds: [
            ...mappedNodeIds('boil_kettle_vessel'),
            ...mappedNodeIds('heat_source_primary'),
          ],
          matchedLabels: [
            ...mappedLabels('boil_kettle_vessel'),
            ...mappedLabels('heat_source_primary'),
          ],
        });
      } else {
        addRequirement({
          id: 'boil-system',
          label: 'Boil System',
          outcome: 'missing',
          detail: `Mapped boil kettle not found: ${mappedKettle.configuredValue}.`,
          missingSeverity: 'blocker',
          manualFallback: 'Update equipment role mapping for `boil_kettle_vessel`.',
          matchedDeviceIds: [],
          matchedLabels: [],
        });
      }
    } else if (kettles.length > 0 && heaterNodes.length > 0) {
      addRequirement({
        id: 'boil-system',
        label: 'Boil System',
        outcome: 'met',
        detail: 'Boil kettle and heater detected.',
        matchedDeviceIds: [...kettles.map(nodeDeviceId), ...heaterNodes.map(nodeDeviceId)],
        matchedLabels: [...kettles.map(nodeLabel), ...heaterNodes.map(nodeLabel)],
      });
    } else if (vesselNodes.length > 0) {
      addRequirement({
        id: 'boil-system',
        label: 'Boil System',
        outcome: 'fallback',
        detail: 'Boil stage found, but dedicated kettle/heater mapping is incomplete.',
        missingSeverity: 'warning',
        manualFallback:
          'You can boil manually, then confirm/advance recipe steps from the execution page.',
        matchedDeviceIds: vesselNodes.map(nodeDeviceId),
        matchedLabels: vesselNodes.map(nodeLabel),
      });
    } else {
      addRequirement({
        id: 'boil-system',
        label: 'Boil System',
        outcome: 'missing',
        detail: 'Boil stage exists but no vessel is available.',
        missingSeverity: 'blocker',
        manualFallback: 'Add a kettle/vessel and heater path before executing boil stages.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  if (hasFermentation) {
    const mappedFermenter = resolveMappedRole('fermenter_primary');
    const fermenters = [
      ...vesselByType('fermentor_conical'),
      ...vesselByType('bright_tank'),
    ];
    if (mappedFermenter.configuredValue) {
      if (mappedFermenter.resolvedNode || mappedFermenter.resolvedDevice) {
        addRequirement({
          id: 'fermentation-vessel',
          label: 'Fermentation Vessel',
          outcome: 'met',
          detail: `Mapped role \`fermenter_primary\` -> ${mappedFermenter.configuredValue}.`,
          matchedDeviceIds: mappedNodeIds('fermenter_primary'),
          matchedLabels: mappedLabels('fermenter_primary'),
        });
      } else {
        addRequirement({
          id: 'fermentation-vessel',
          label: 'Fermentation Vessel',
          outcome: 'missing',
          detail: `Mapped fermenter not found: ${mappedFermenter.configuredValue}.`,
          missingSeverity: 'blocker',
          manualFallback: 'Update equipment role mapping or assign a valid fermenter.',
          matchedDeviceIds: [],
          matchedLabels: [],
        });
      }
    } else if (fermenters.length > 0) {
      addRequirement({
        id: 'fermentation-vessel',
        label: 'Fermentation Vessel',
        outcome: 'met',
        detail: 'Fermentation vessel detected.',
        matchedDeviceIds: fermenters.map(nodeDeviceId),
        matchedLabels: fermenters.map(nodeLabel),
      });
    } else if (vesselNodes.length > 0) {
      addRequirement({
        id: 'fermentation-vessel',
        label: 'Fermentation Vessel',
        outcome: 'fallback',
        detail: 'No fermentor/bright tank type found.',
        missingSeverity: 'warning',
        manualFallback:
          'Use a generic vessel and verify fermentation controls manually.',
        matchedDeviceIds: vesselNodes.map(nodeDeviceId),
        matchedLabels: vesselNodes.map(nodeLabel),
      });
    } else {
      addRequirement({
        id: 'fermentation-vessel',
        label: 'Fermentation Vessel',
        outcome: 'missing',
        detail: 'Fermentation stage exists but no vessel is available.',
        missingSeverity: 'blocker',
        manualFallback: 'Add a fermentation vessel before starting this recipe.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  if (hasTransfer) {
    const mappedTransferPump = resolveMappedRole('transfer_pump_primary');
    if (mappedTransferPump.configuredValue) {
      if (mappedTransferPump.resolvedNode || mappedTransferPump.resolvedDevice) {
        addRequirement({
          id: 'transfer-path',
          label: 'Transfer Path',
          outcome: 'met',
          detail: `Mapped role \`transfer_pump_primary\` -> ${mappedTransferPump.configuredValue}.`,
          matchedDeviceIds: mappedNodeIds('transfer_pump_primary'),
          matchedLabels: mappedLabels('transfer_pump_primary'),
        });
      } else {
        addRequirement({
          id: 'transfer-path',
          label: 'Transfer Path',
          outcome: 'fallback',
          detail: `Mapped transfer pump not found: ${mappedTransferPump.configuredValue}.`,
          missingSeverity: 'warning',
          manualFallback:
            'Update mapping, or continue with manual transfer and confirm each step.',
          matchedDeviceIds: [],
          matchedLabels: [],
        });
      }
    } else if (pumpNodes.length > 0) {
      addRequirement({
        id: 'transfer-path',
        label: 'Transfer Path',
        outcome: 'met',
        detail: 'Pump detected for transfer operations.',
        matchedDeviceIds: pumpNodes.map(nodeDeviceId),
        matchedLabels: pumpNodes.map(nodeLabel),
      });
    } else {
      addRequirement({
        id: 'transfer-path',
        label: 'Transfer Path',
        outcome: 'fallback',
        detail: 'Transfer-related steps found but no pump is mapped.',
        missingSeverity: 'warning',
        manualFallback:
          'Use gravity/manual transfer and confirm the corresponding recipe steps.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  if (hasCooling) {
    const mappedGlycolPump = resolveMappedRole('glycol_pump');
    const mappedGlycolValve = resolveMappedRole('glycol_supply_valve');
    if (mappedGlycolPump.configuredValue || mappedGlycolValve.configuredValue) {
      const hasResolved = Boolean(
        mappedGlycolPump.resolvedNode ||
          mappedGlycolPump.resolvedDevice ||
          mappedGlycolValve.resolvedNode ||
          mappedGlycolValve.resolvedDevice
      );
      addRequirement({
        id: 'cooling-control',
        label: 'Cooling Control',
        outcome: hasResolved ? 'met' : 'fallback',
        detail: hasResolved
          ? 'Mapped glycol cooling role(s) detected.'
          : 'Mapped glycol role(s) are not resolved to installed equipment.',
        missingSeverity: hasResolved ? undefined : 'warning',
        manualFallback: hasResolved
          ? undefined
          : 'Update glycol role mapping or run cooling manually.',
        matchedDeviceIds: [
          ...mappedNodeIds('glycol_pump'),
          ...mappedNodeIds('glycol_supply_valve'),
        ],
        matchedLabels: [
          ...mappedLabels('glycol_pump'),
          ...mappedLabels('glycol_supply_valve'),
        ],
      });
    } else if (glycolControllerNodes.length > 0) {
      addRequirement({
        id: 'cooling-control',
        label: 'Cooling Control',
        outcome: 'met',
        detail: 'Glycol controller detected for cooling stages.',
        matchedDeviceIds: glycolControllerNodes.map(nodeDeviceId),
        matchedLabels: glycolControllerNodes.map(nodeLabel),
      });
    } else if (pumpNodes.length > 0 && valveNodes.length > 0) {
      addRequirement({
        id: 'cooling-control',
        label: 'Cooling Control',
        outcome: 'fallback',
        detail: 'Cooling stages exist without glycol controller.',
        missingSeverity: 'warning',
        manualFallback:
          'Run cooling manually or build a glycol controller widget for closed-loop control.',
        matchedDeviceIds: [...pumpNodes.map(nodeDeviceId), ...valveNodes.map(nodeDeviceId)],
        matchedLabels: [...pumpNodes.map(nodeLabel), ...valveNodes.map(nodeLabel)],
      });
    } else {
      addRequirement({
        id: 'cooling-control',
        label: 'Cooling Control',
        outcome: 'fallback',
        detail: 'Cooling stages exist but no clear cooling hardware path was detected.',
        missingSeverity: 'warning',
        manualFallback:
          'Manual cold-crash/cooling is possible; confirm each step during execution.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  if (hasHeating || hasCooling || hasFermentation) {
    const mappedMashTemp = resolveMappedRole('temp_sensor_mash');
    const mappedFermentTemp = resolveMappedRole('temp_sensor_fermenter');
    if (mappedMashTemp.configuredValue || mappedFermentTemp.configuredValue) {
      const hasResolved = Boolean(
        mappedMashTemp.resolvedNode ||
          mappedMashTemp.resolvedDevice ||
          mappedFermentTemp.resolvedNode ||
          mappedFermentTemp.resolvedDevice
      );
      addRequirement({
        id: 'temperature-feedback',
        label: 'Temperature Feedback',
        outcome: hasResolved ? 'met' : 'fallback',
        detail: hasResolved
          ? 'Mapped temperature sensor role(s) detected.'
          : 'Mapped temperature sensor role(s) are unresolved.',
        missingSeverity: hasResolved ? undefined : 'warning',
        manualFallback: hasResolved
          ? undefined
          : 'Update temperature sensor role mapping or monitor temperature manually.',
        matchedDeviceIds: [
          ...mappedNodeIds('temp_sensor_mash'),
          ...mappedNodeIds('temp_sensor_fermenter'),
        ],
        matchedLabels: [
          ...mappedLabels('temp_sensor_mash'),
          ...mappedLabels('temp_sensor_fermenter'),
        ],
      });
    } else if (temperatureSensors.length > 0) {
      addRequirement({
        id: 'temperature-feedback',
        label: 'Temperature Feedback',
        outcome: 'met',
        detail: 'Temperature sensor detected.',
        matchedDeviceIds: temperatureSensors.map(nodeDeviceId),
        matchedLabels: temperatureSensors.map(nodeLabel),
      });
    } else {
      addRequirement({
        id: 'temperature-feedback',
        label: 'Temperature Feedback',
        outcome: 'fallback',
        detail: 'No temperature sensor is mapped for temp-controlled stages.',
        missingSeverity: 'warning',
        manualFallback:
          'You can use manual thermometer readings and adjust step values on the fly.',
        matchedDeviceIds: [],
        matchedLabels: [],
      });
    }
  }

  const knownDeviceIds = new Set<string>();
  nodes.forEach((node) => {
    knownDeviceIds.add(node.id);
    if (node.data.logicalDeviceId) {
      knownDeviceIds.add(node.data.logicalDeviceId);
    }
  });
  devices.forEach((device) => knownDeviceIds.add(device.id));

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
  const aliasResolvesToMappedEquipment = (targetId: string): boolean => {
    const aliasRoles = targetAliasRoleCandidates[normalizeTargetId(targetId)];
    if (!aliasRoles || aliasRoles.length === 0) {
      return false;
    }
    return aliasRoles.some((role) => {
      const mapped = resolveMappedRole(role);
      return Boolean(mapped.resolvedNode || mapped.resolvedDevice);
    });
  };

  const missingTargetDevices = recipe.steps
    .map((step) => step.targetDeviceId)
    .filter((targetId): targetId is string => Boolean(targetId))
    .filter((targetId) => !knownDeviceIds.has(targetId))
    .filter((targetId) => !aliasResolvesToMappedEquipment(targetId));

  if (missingTargetDevices.length > 0) {
    addRequirement({
      id: 'step-target-mapping',
      label: 'Step Target Mapping',
      outcome: 'fallback',
      detail: `${missingTargetDevices.length} step target(s) are not mapped to installed equipment.`,
      missingSeverity: 'warning',
      manualFallback:
        'Map missing targets in canvas/config, or run those steps manually and confirm progression.',
      matchedDeviceIds: [],
      matchedLabels: [],
    });
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  requirements.forEach((requirement) =>
    addRequirementMessage(requirement, blockers, warnings)
  );

  const dedupedMissingTargets = [...new Set(missingTargetDevices)];
  if (dedupedMissingTargets.length > 0) {
    warnings.push(
      `Unmapped target device IDs: ${dedupedMissingTargets.slice(0, 6).join(', ')}${
        dedupedMissingTargets.length > 6 ? '...' : ''
      }`
    );
  }

  const missingInventory = inventoryChecks.filter((check) => check.status === 'missing');
  const lowInventory = inventoryChecks.filter((check) => check.status === 'low');
  const inventoryOverrideRequired = missingInventory.length > 0;
  if (missingInventory.length > 0) {
    warnings.push(
      `Inventory missing for required inputs: ${missingInventory
        .slice(0, 6)
        .map((item) => item.requirementName)
        .join(', ')}${missingInventory.length > 6 ? '...' : ''}`
    );
  }
  if (lowInventory.length > 0) {
    warnings.push(
      `Low inventory for: ${lowInventory
        .slice(0, 6)
        .map((item) => item.requirementName)
        .join(', ')}${lowInventory.length > 6 ? '...' : ''}`
    );
  }

  const requiresManualOverride = requirements.some(
    (requirement) =>
      requirement.outcome === 'fallback' &&
      requirement.id !== 'published-pages' &&
      requirement.id !== 'step-target-mapping'
  ) || inventoryOverrideRequired;
  const status =
    blockers.length > 0
      ? 'incompatible'
      : requiresManualOverride
        ? 'needs_override'
        : 'compatible';

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    status,
    readyToRun: status !== 'incompatible',
    requiresManualOverride,
    blockers,
    warnings,
    requirements,
    inferredStages: stages,
    equipment: {
      source,
      pageCount: sourcePages.length,
      nodeCount: nodes.length,
      widgetCounts,
      vesselTypeCounts,
    },
    missingTargetDevices: dedupedMissingTargets,
    roleMappings,
    inventoryChecks,
    generatedAt: nowIso(),
  };
};
