import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Viewport,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Upload, Download, FlaskConical, PanelLeft, Trash2, Copy, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  createDefaultProject,
  createEdge,
  createNode,
  createPage,
  createRegisteredDevice,
  FLOW_WIDGET_TYPES,
  makeId,
} from './defaults';
import { annotateFluidEdges } from './fluid-routing';
import {
  resolveConnectionCompatibility,
  resolveNodePort,
} from './ports';
import { CanvasRuntimeProvider } from './runtime-context';
import WidgetNode from './WidgetNode';
import type {
  AutomationStep,
  CanvasEdge,
  CanvasNode,
  CanvasPage,
  CanvasProject,
  EdgeKind,
  FluidMedium,
  ImportedRecipe,
  RegisteredDevice,
  SensorType,
  WidgetType,
} from './types';

const nodeTypes = { widget: WidgetNode };

type AddWidgetOption = WidgetType | 'valve_3way';

const widgetOptions: AddWidgetOption[] = [
  'vessel',
  'pump',
  'valve',
  'valve_3way',
  'packaging',
  'sensor',
  'heater',
  'pid',
  'button',
  'switch',
  'slider',
  'glycol_controller',
  'hlt_controller',
  'co2_controller',
  'transfer_controller',
  'recipe_executor',
  'automation',
  'display',
  'note',
];

const widgetOptionLabel: Record<AddWidgetOption, string> = {
  vessel: 'Vessel',
  pump: 'Pump',
  valve: 'Valve (2-way)',
  valve_3way: 'Valve (3-way)',
  packaging: 'Packaging Line',
  sensor: 'Sensor',
  heater: 'Heater',
  pid: 'PID',
  button: 'Button',
  switch: 'Switch',
  slider: 'Slider',
  glycol_controller: 'Glycol Controller',
  hlt_controller: 'HLT Controller',
  co2_controller: 'CO2 Controller',
  transfer_controller: 'Transfer Controller',
  recipe_executor: 'Recipe Executor',
  automation: 'Automation',
  display: 'Display',
  note: 'Note',
};

const widgetAccentColor: Record<AddWidgetOption, string> = {
  vessel: '#0ea5e9',
  pump: '#2563eb',
  valve: '#06b6d4',
  valve_3way: '#06b6d4',
  packaging: '#ec4899',
  sensor: '#f59e0b',
  heater: '#ef4444',
  pid: '#8b5cf6',
  button: '#22c55e',
  switch: '#16a34a',
  slider: '#f97316',
  glycol_controller: '#0ea5e9',
  hlt_controller: '#f97316',
  co2_controller: '#22c55e',
  transfer_controller: '#2563eb',
  recipe_executor: '#7c3aed',
  automation: '#6366f1',
  display: '#14b8a6',
  note: '#64748b',
};

const deviceTypeOptions: WidgetType[] = [
  'vessel',
  'pump',
  'valve',
  'packaging',
  'sensor',
  'heater',
  'pid',
  'button',
  'switch',
  'slider',
  'glycol_controller',
  'hlt_controller',
  'co2_controller',
  'transfer_controller',
  'recipe_executor',
  'automation',
  'display',
  'note',
];

const sensorTypeOptions: SensorType[] = [
  'temperature',
  'sg',
  'ph',
  'abv',
  'brix',
  'ta',
  'so2',
  'psi',
  'flow',
  'humidity',
  'custom',
];

const parseMaybeNumber = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const parseCommaSeparatedValues = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const co2StylePresets: Record<
  'beer' | 'cider' | 'champagne' | 'wine' | 'seltzer' | 'custom',
  { targetPsi: number; targetVolumes: number; hysteresis: number; maxPressurePsi: number }
> = {
  beer: { targetPsi: 12, targetVolumes: 2.4, hysteresis: 0.5, maxPressurePsi: 25 },
  cider: { targetPsi: 10, targetVolumes: 2.6, hysteresis: 0.5, maxPressurePsi: 22 },
  champagne: { targetPsi: 30, targetVolumes: 5.5, hysteresis: 1, maxPressurePsi: 45 },
  wine: { targetPsi: 2, targetVolumes: 1.0, hysteresis: 0.3, maxPressurePsi: 10 },
  seltzer: { targetPsi: 25, targetVolumes: 4.2, hysteresis: 1, maxPressurePsi: 40 },
  custom: { targetPsi: 12, targetVolumes: 2.4, hysteresis: 0.5, maxPressurePsi: 25 },
};

const normalizeUnit = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const isFahrenheitUnit = (unit?: string): boolean => {
  const normalized = normalizeUnit(unit);
  return (
    normalized === 'f' ||
    normalized === 'degf' ||
    normalized === 'fahrenheit' ||
    normalized === '°f'
  );
};

const isCelsiusUnit = (unit?: string): boolean => {
  const normalized = normalizeUnit(unit);
  return (
    normalized === 'c' ||
    normalized === 'degc' ||
    normalized === 'celsius' ||
    normalized === '°c'
  );
};

const isTemperatureUnit = (unit?: string): boolean =>
  isFahrenheitUnit(unit) || isCelsiusUnit(unit);

const convertTemperature = (
  value: number,
  fromUnit?: string,
  toUnit?: string
): number => {
  if (!Number.isFinite(value)) return value;
  if (!isTemperatureUnit(fromUnit) || !isTemperatureUnit(toUnit)) return value;
  if (isFahrenheitUnit(fromUnit) === isFahrenheitUnit(toUnit)) return value;
  if (isCelsiusUnit(fromUnit) && isFahrenheitUnit(toUnit)) {
    return value * (9 / 5) + 32;
  }
  if (isFahrenheitUnit(fromUnit) && isCelsiusUnit(toUnit)) {
    return (value - 32) * (5 / 9);
  }
  return value;
};

const inferTemperatureUnitForNode = (node?: CanvasNode): string | undefined => {
  if (!node) return undefined;
  const candidateUnit = String(node.data.config.unit ?? '').trim();
  if (isTemperatureUnit(candidateUnit)) {
    return candidateUnit;
  }
  if (node.data.widgetType === 'hlt_controller' || node.data.widgetType === 'glycol_controller') {
    return 'F';
  }
  if (node.data.widgetType === 'sensor' && node.data.config.sensorType === 'temperature') {
    return 'F';
  }
  if (
    node.data.widgetType === 'slider' &&
    (node.data.config.setpointType === 'temperature' || isTemperatureUnit(candidateUnit))
  ) {
    return candidateUnit || 'F';
  }
  return undefined;
};

const toFahrenheit = (value: number, unit?: string): number => {
  return convertTemperature(value, unit, 'F');
};

const psiFromVolumesAtF = (volumes: number, tempF: number): number => {
  const psi =
    -16.6999 -
    0.0101059 * tempF +
    0.00116512 * tempF * tempF +
    0.173354 * tempF * volumes +
    4.24267 * volumes -
    0.0684226 * volumes * volumes;
  return Math.max(0, psi);
};

const fluidColorByMedium: Record<FluidMedium, { active: string; inactive: string }> = {
  product: { active: '#0ea5e9', inactive: '#7dd3fc' },
  glycol: { active: '#06b6d4', inactive: '#67e8f9' },
  co2: { active: '#22c55e', inactive: '#86efac' },
  cip: { active: '#10b981', inactive: '#6ee7b7' },
  water: { active: '#3b82f6', inactive: '#93c5fd' },
  gas: { active: '#f59e0b', inactive: '#fcd34d' },
};

const edgeStyleByKind: Record<EdgeKind, CSSProperties> = {
  fluid: { stroke: '#0ea5e9', strokeWidth: 2.2 },
  data: { stroke: '#f59e0b', strokeWidth: 1.8, filter: 'drop-shadow(0 0 2px #f59e0b)' },
  power: { stroke: '#dc2626', strokeWidth: 2.2 },
  ground: { stroke: '#111827', strokeWidth: 2.2 },
};

interface ControlEndpointOption {
  id: number;
  channelId: string;
  endpointKind: string;
  direction: string;
}

type UndoAction =
  | { type: 'wire'; edge: CanvasEdge }
  | { type: 'widget'; node: CanvasNode; edges: CanvasEdge[] }
  | { type: 'page'; page: CanvasPage; index: number };

interface Co2AlarmEvent {
  id: string;
  controllerId: string;
  controllerLabel: string;
  severity: 'warning' | 'critical' | 'info';
  message: string;
  at: string;
}

const isWritableEndpointDirection = (direction?: string | null) =>
  direction === 'output' || direction === 'bidirectional';

const isControlWidgetType = (widgetType: WidgetType) =>
  widgetType === 'button' || widgetType === 'switch' || widgetType === 'slider';

const warningSuggestion = (warning: string): string => {
  const text = warning.toLowerCase();
  if (text.includes('no fluid connection')) return 'Add at least one fluid line to this widget.';
  if (text.includes('no logical device assigned')) return 'Assign a logical device in Widget Config.';
  if (text.includes('missing sensor endpoint binding')) return 'Set Sensor Binding to a valid endpoint ID.';
  if (text.includes('missing sensor type')) return 'Set sensor type and unit in Widget Config.';
  if (text.includes('missing actuator endpoint binding')) return 'Set Actuator Binding to a valid endpoint ID.';
  if (text.includes('no power input line')) return 'Connect a red power line into the Power In handle.';
  if (text.includes('no control channel or endpoint mapping')) {
    return 'Set Driver Channel, Endpoint Override, or pick from I/O Channel Browser.';
  }
  if (text.includes('no automation steps configured')) return 'Open Automation widget config and add at least one step.';
  if (text.includes('simple automation missing source sensor or target device')) {
    return 'In Automation (Simple mode), set both Source Sensor and Target Device.';
  }
  if (text.includes('glycol controller missing source sensor')) {
    return 'Select a source temperature sensor in Glycol Controller config.';
  }
  if (text.includes('glycol controller missing output')) {
    return 'Assign at least one output device (pump, valve, or chiller) in Glycol Controller config.';
  }
  if (text.includes('hlt controller missing source sensor')) {
    return 'Select a source temperature sensor in HLT Controller config.';
  }
  if (text.includes('hlt controller missing output')) {
    return 'Assign at least one output device (heater or recirc pump) in HLT Controller config.';
  }
  if (text.includes('co2 controller missing source sensor')) {
    return 'Select a source pressure sensor in CO2 Controller config.';
  }
  if (text.includes('co2 controller missing output')) {
    return 'Assign at least one output valve in CO2 Controller config.';
  }
  if (text.includes('transfer controller missing pump')) {
    return 'Assign a pump output in Transfer Controller config.';
  }
  if (text.includes('transfer controller missing valves')) {
    return 'Assign at least one source or destination valve in Transfer Controller config.';
  }
  if (text.includes('recipe executor missing recipe steps')) {
    return 'Import a recipe file, then load it into Recipe Executor config.';
  }
  if (text.includes('recipe executor missing target mapping')) {
    return 'Wire Recipe Executor data-out to a target widget or set Control Mapping target.';
  }
  return 'Open widget config and complete missing wiring or bindings.';
};

const coerceAutomationValue = (value: string | number | boolean | undefined) => {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return true;
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return value;
};

const defaultCommandValue = (
  command: 'on_off' | 'open_close' | 'route' | 'set_value' | 'trigger',
  active: boolean
): string | number | boolean => {
  if (command === 'set_value') return active ? 1 : 0;
  if (command === 'trigger') return true;
  if (command === 'route') return active ? 'c_to_a' : 'c_to_b';
  if (command === 'open_close') return active ? 'open' : 'closed';
  return active ? 'on' : 'off';
};

const resolveNodeByAutomationRef = (
  nodes: CanvasNode[],
  refId?: string
): CanvasNode | undefined => {
  if (!refId) return undefined;
  if (refId.startsWith('node:')) {
    const nodeId = refId.slice('node:'.length);
    return nodes.find((node) => node.id === nodeId);
  }
  return nodes.find((node) => node.data.logicalDeviceId === refId);
};
const toAutomationRef = (node: CanvasNode): string =>
  node.data.logicalDeviceId ? node.data.logicalDeviceId : `node:${node.id}`;

type RecipeRunStatus =
  | 'running'
  | 'paused'
  | 'waiting_confirm'
  | 'completed'
  | 'failed'
  | 'canceled';

interface RecipeRunStepSnapshot {
  id: string;
  name: string;
  stage?: string;
  action?: string;
  triggerWhen?: string;
  command?: string;
  targetDeviceId?: string;
  value?: string | number | boolean;
  durationMin?: number;
  temperatureC?: number;
  requiresUserConfirm?: boolean;
  autoProceed?: boolean;
  status?: string;
  startedAt?: string;
  endedAt?: string;
}

interface RecipeRunSnapshot {
  runId: string;
  recipeId: string;
  recipeName: string;
  status: RecipeRunStatus;
  startedAt: string;
  endedAt?: string;
  currentStepIndex: number;
  steps: RecipeRunStepSnapshot[];
}

const activeRecipeStatuses: RecipeRunStatus[] = ['running', 'waiting_confirm', 'paused'];

const recipeRuntimeStateFromRun = (
  status: RecipeRunStatus
): NonNullable<CanvasNode['data']['config']['recipeExecutor']>['runtimeState'] => {
  if (status === 'running') return 'running';
  if (status === 'waiting_confirm') return 'waiting_confirm';
  if (status === 'paused') return 'paused';
  if (status === 'completed') return 'completed';
  return 'idle';
};

const normalizeRecipeText = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const toFiniteNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const stepExpectsTemperatureAdvance = (step: RecipeRunStepSnapshot): boolean => {
  const trigger = normalizeRecipeText(step.triggerWhen);
  if (trigger.includes('temp_reached') || trigger.includes('temperature_reached')) {
    return true;
  }
  const actionText = `${normalizeRecipeText(step.stage)} ${normalizeRecipeText(
    step.action
  )} ${normalizeRecipeText(step.name)}`;
  return (
    actionText.includes('heat') ||
    actionText.includes('chill') ||
    actionText.includes('cool') ||
    actionText.includes('crash') ||
    actionText.includes('target temp')
  );
};

const stepIsCoolingDirection = (step: RecipeRunStepSnapshot): boolean => {
  const actionText = `${normalizeRecipeText(step.stage)} ${normalizeRecipeText(
    step.action
  )} ${normalizeRecipeText(step.name)}`;
  return (
    actionText.includes('cool') ||
    actionText.includes('chill') ||
    actionText.includes('cold crash') ||
    actionText.includes('crash')
  );
};

const resolveTelemetryValueForStep = (
  nodes: CanvasNode[],
  step: RecipeRunStepSnapshot
): { measured: number; tolerance: number } | null => {
  const targetRef = String(step.targetDeviceId ?? '').trim();
  if (!targetRef) return null;
  const targetNode = resolveNodeByAutomationRef(nodes, targetRef);
  if (!targetNode) return null;

  if (targetNode.data.widgetType === 'sensor') {
    const measured = toFiniteNumber(
      targetNode.data.config.value ?? targetNode.data.config.dummyValue
    );
    if (measured === undefined) return null;
    const tolerance = Math.max(
      0.1,
      Math.abs(
        toFiniteNumber(targetNode.data.config.step) ??
          toFiniteNumber(step.value) ??
          0.5
      )
    );
    return { measured, tolerance };
  }

  if (targetNode.data.widgetType === 'hlt_controller') {
    const measured = toFiniteNumber(targetNode.data.config.value);
    if (measured === undefined) return null;
    const tolerance = Math.max(
      0.25,
      Math.abs(toFiniteNumber(targetNode.data.config.hltController?.hysteresis) ?? 1)
    );
    return { measured, tolerance };
  }

  if (targetNode.data.widgetType === 'glycol_controller') {
    const measured = toFiniteNumber(targetNode.data.config.value);
    if (measured === undefined) return null;
    const tolerance = Math.max(
      0.25,
      Math.abs(toFiniteNumber(targetNode.data.config.glycolController?.hysteresis) ?? 1)
    );
    return { measured, tolerance };
  }

  const measured = toFiniteNumber(targetNode.data.config.value ?? targetNode.data.config.dummyValue);
  if (measured === undefined) return null;
  return { measured, tolerance: 0.5 };
};

const recipeStepFingerprint = (steps: ImportedRecipe['steps'] = []): string =>
  steps
    .map((step) =>
      [
        normalizeRecipeText(step.name),
        normalizeRecipeText(step.stage),
        normalizeRecipeText(step.command),
      ].join('|')
    )
    .join('>');

const resolveRecipeIdForExecutor = (
  node: CanvasNode,
  importedRecipes: ImportedRecipe[]
): string => {
  const direct = String(node.data.config.recipeId ?? '').trim();
  if (direct) {
    return direct;
  }

  const nodeRecipeName = normalizeRecipeText(node.data.config.recipeName);
  if (nodeRecipeName) {
    const byName =
      importedRecipes.find(
        (recipe) => normalizeRecipeText(recipe.name) === nodeRecipeName
      ) ?? null;
    if (byName?.id) {
      return byName.id;
    }
  }

  const nodeSteps = (node.data.config.recipeSteps ?? []) as ImportedRecipe['steps'];
  if (nodeSteps.length > 0) {
    const targetFingerprint = recipeStepFingerprint(nodeSteps);
    const bySteps =
      importedRecipes.find(
        (recipe) => recipe.steps.length > 0 && recipeStepFingerprint(recipe.steps) === targetFingerprint
      ) ?? null;
    if (bySteps?.id) {
      return bySteps.id;
    }
  }

  return '';
};

const pickRunForExecutor = (
  runs: RecipeRunSnapshot[],
  recipeId: string,
  recipeName?: string
): RecipeRunSnapshot | null => {
  const candidates = runs.filter((run) => {
    if (recipeId) {
      return run.recipeId === recipeId;
    }
    return recipeName ? run.recipeName === recipeName : false;
  });
  if (candidates.length === 0) {
    return null;
  }
  const active =
    candidates.find((run) => activeRecipeStatuses.includes(run.status)) ?? null;
  if (active) {
    return active;
  }
  return [...candidates].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
};

const toRecipeExecutorRuleFromRun = (
  run: RecipeRunSnapshot,
  currentRule?: CanvasNode['data']['config']['recipeExecutor']
): NonNullable<CanvasNode['data']['config']['recipeExecutor']> => {
  const currentIndex = Math.max(-1, Number(run.currentStepIndex ?? -1));
  const activeStep =
    currentIndex >= 0 && currentIndex < run.steps.length
      ? run.steps[currentIndex]
      : undefined;
  const startedMs = activeStep?.startedAt ? Date.parse(activeStep.startedAt) : NaN;
  const running = activeRecipeStatuses.includes(run.status);
  return {
    enabled: currentRule?.enabled === true,
    running,
    paused: run.status === 'paused',
    awaitingConfirm: run.status === 'waiting_confirm',
    currentStepIndex: Math.max(0, currentIndex),
    stepStartedAtMs: Number.isFinite(startedMs) ? startedMs : undefined,
    activeStepId: activeStep?.id,
    autoProceedDefault: currentRule?.autoProceedDefault === true,
    runtimeState: recipeRuntimeStateFromRun(run.status),
  };
};

const toNodeRedJson = (page: CanvasPage): unknown[] => {
  const outgoing = new Map<string, string[]>();
  for (const edge of page.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  return page.nodes.map((node) => ({
    id: node.id,
    z: page.id,
    type: node.data.widgetType,
    name: node.data.label,
    x: Math.round(node.position.x),
    y: Math.round(node.position.y),
    wires: [outgoing.get(node.id) ?? []],
    bevforge: {
      logicalDeviceId: node.data.logicalDeviceId,
      bindings: node.data.bindings ?? {},
      config: node.data.config ?? {},
      control: node.data.control ?? {},
    },
  }));
};

const nodeRedTypeToWidgetType = (value: string | undefined): WidgetType => {
  if (!value) return 'note';
  if (
    ['vessel', 'pump', 'valve', 'packaging', 'sensor', 'heater', 'pid', 'button', 'switch', 'slider', 'glycol_controller', 'hlt_controller', 'co2_controller', 'transfer_controller', 'recipe_executor', 'automation', 'display', 'note'].includes(
      value
    )
  ) {
    return value as WidgetType;
  }
  if (value.includes('packag') || value.includes('keg') || value.includes('bottl') || value.includes('can')) {
    return 'packaging';
  }
  if (value.includes('pump')) return 'pump';
  if (value.includes('valve')) return 'valve';
  if (value.includes('temp') || value.includes('sensor')) return 'sensor';
  if (value.includes('pid')) return 'pid';
  if (value.includes('display')) return 'display';
  if (value.includes('vessel') || value.includes('tank')) return 'vessel';
  return 'note';
};

const fromNodeRedJson = (raw: unknown): { nodes: CanvasNode[]; edges: CanvasEdge[] } => {
  if (!Array.isArray(raw)) {
    throw new Error('Node-RED JSON must be an array');
  }

  const nodes: CanvasNode[] = raw.map((item: any) => {
    const widgetType = nodeRedTypeToWidgetType(item.type);
    return {
      id: String(item.id ?? makeId('node')),
      type: 'widget',
      position: {
        x: parseMaybeNumber(String(item.x)) ?? 100,
        y: parseMaybeNumber(String(item.y)) ?? 100,
      },
      data: {
        label: String(item.name ?? widgetType.toUpperCase()),
        widgetType,
        logicalDeviceId: item.bevforge?.logicalDeviceId,
        bindings: item.bevforge?.bindings ?? {},
        config: item.bevforge?.config ?? {},
        control: item.bevforge?.control ?? {},
      },
    };
  });

  const edges: CanvasEdge[] = [];
  for (const item of raw as any[]) {
    const source = String(item.id);
    const firstOutput = Array.isArray(item.wires?.[0]) ? item.wires[0] : [];
    for (const target of firstOutput) {
      edges.push({
        id: makeId('edge'),
        source,
        target: String(target),
        type: 'smoothstep',
        data: { kind: 'fluid' },
      });
    }
  }

  return { nodes, edges };
};

const isExternalFlowWidget = (widgetType: WidgetType) =>
  FLOW_WIDGET_TYPES.includes(widgetType);

const CanvasStudioInner = () => {
  const navigate = useNavigate();
  const { setCenter } = useReactFlow();
  const [project, setProject] = useState<CanvasProject | null>(null);
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [importedRecipes, setImportedRecipes] = useState<ImportedRecipe[]>([]);
  const [selectedImportedRecipeId, setSelectedImportedRecipeId] = useState<string>('');
  const [availableControlEndpoints, setAvailableControlEndpoints] = useState<ControlEndpointOption[]>([]);
  const [activePageId, setActivePageId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [wireDeleteTarget, setWireDeleteTarget] = useState<CanvasEdge | null>(null);
  const [pageDeleteTarget, setPageDeleteTarget] = useState<CanvasPage | null>(null);
  const [lastUndoAction, setLastUndoAction] = useState<UndoAction | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [activeFluidMedium, setActiveFluidMedium] = useState<FluidMedium>('product');
  const [status, setStatus] = useState<string>('Loading canvas project...');
  const [co2AlarmEvents, setCo2AlarmEvents] = useState<Co2AlarmEvent[]>([]);
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [newDeviceType, setNewDeviceType] = useState<WidgetType>('sensor');
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [rawEdges, setRawEdges, onEdgesChange] = useEdgesState<CanvasEdge>([]);
  const nodeRedInputRef = useRef<HTMLInputElement>(null);
  const activePageIdRef = useRef<string>('');
  const simpleAutomationStateRef = useRef<Map<string, boolean>>(new Map());
  const glycolControllerStateRef = useRef<Map<string, boolean>>(new Map());
  const glycolControllerDispatchStateRef = useRef<Map<string, string>>(new Map());
  const hltControllerStateRef = useRef<Map<string, boolean>>(new Map());
  const hltControllerDispatchStateRef = useRef<Map<string, string>>(new Map());
  const co2ControllerDispatchStateRef = useRef<Map<string, string>>(new Map());
  const co2PressureStateRef = useRef<Map<string, { value: number; at: number }>>(new Map());
  const co2PurgeStateRef = useRef<Map<string, { phase: 'inject' | 'vent'; cycle: number; phaseStartedAt: number }>>(
    new Map()
  );
  const co2AlarmStateRef = useRef<Map<string, string>>(new Map());
  const transferControllerDispatchStateRef = useRef<Map<string, string>>(new Map());
  const recipeExecutorDispatchStateRef = useRef<Map<string, string>>(new Map());
  const recipeExecutorRunIdRef = useRef<Map<string, string>>(new Map());
  const recipeExecutorAdvanceStateRef = useRef<Map<string, string>>(new Map());

  const currentPage = useMemo(() => {
    if (!project) return null;
    return project.pages.find((page) => page.id === activePageId) ?? null;
  }, [project, activePageId]);
  const currentMode = currentPage?.mode ?? 'draft';

  useEffect(() => {
    activePageIdRef.current = activePageId;
  }, [activePageId]);

  const runtimeControl = useCallback(
    async (nodeId: string, action: string, value: string | number | boolean) => {
      const sourceNode = nodes.find((item) => item.id === nodeId);
      if (!sourceNode) {
        return;
      }

      if (sourceNode.data.widgetType === 'sensor') {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === sourceNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      value: Number(value),
                      dummyValue: Number(value),
                      sensorSampleAtMs: Date.now(),
                    },
                  },
                }
              : node
          )
        );
        setStatus(`Sensor value updated: ${sourceNode.data.label}`);
        return;
      }

      if (sourceNode.data.widgetType === 'glycol_controller') {
        const nextValue = Number(value);
        if (!Number.isFinite(nextValue)) {
          return;
        }
        setNodes((prev) =>
          prev.map((node) =>
            node.id === sourceNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      setpoint: nextValue,
                      glycolController: {
                        ...node.data.config.glycolController,
                        threshold: nextValue,
                      },
                    },
                  },
                }
              : node
          )
        );
        setStatus(`Glycol target updated: ${sourceNode.data.label}`);
        return;
      }

      if (sourceNode.data.widgetType === 'hlt_controller') {
        const nextValue = Number(value);
        if (!Number.isFinite(nextValue)) {
          return;
        }
        setNodes((prev) =>
          prev.map((node) =>
            node.id === sourceNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      setpoint: nextValue,
                      hltController: {
                        ...node.data.config.hltController,
                        threshold: nextValue,
                      },
                    },
                  },
                }
              : node
          )
        );
        setStatus(`HLT target updated: ${sourceNode.data.label}`);
        return;
      }

      if (sourceNode.data.widgetType === 'co2_controller') {
        if (action === 'trigger_purge') {
          const nextActive = Boolean(value);
          setNodes((prev) =>
            prev.map((node) =>
              node.id === sourceNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      config: {
                        ...node.data.config,
                        co2Controller: {
                          ...node.data.config.co2Controller,
                          purgeActive: nextActive,
                        },
                      },
                    },
                  }
                : node
            )
          );
          setStatus(nextActive ? 'CO2 purge started.' : 'CO2 purge stopped.');
          return;
        }
        const nextValue = Number(value);
        if (!Number.isFinite(nextValue)) {
          return;
        }
        setNodes((prev) =>
          prev.map((node) =>
            node.id === sourceNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      setpoint: nextValue,
                      co2Controller: {
                        ...node.data.config.co2Controller,
                        threshold: nextValue,
                      },
                    },
                  },
                }
              : node
          )
        );
        setStatus(`CO2 target updated: ${sourceNode.data.label}`);
        return;
      }

      if (sourceNode.data.widgetType === 'transfer_controller') {
        if (action === 'trigger_transfer') {
          const nextActive = Boolean(value);
          setNodes((prev) =>
            prev.map((node) =>
              node.id === sourceNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      config: {
                        ...node.data.config,
                        transferController: {
                          ...node.data.config.transferController,
                          transferActive: nextActive,
                        },
                      },
                    },
                  }
                : node
            )
          );
          setStatus(nextActive ? 'Transfer started.' : 'Transfer stopped.');
          return;
        }
        if (action === 'set_value') {
          const nextValue = Number(value);
          if (!Number.isFinite(nextValue)) {
            return;
          }
          setNodes((prev) =>
            prev.map((node) =>
              node.id === sourceNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      config: {
                        ...node.data.config,
                        value: nextValue,
                        transferController: {
                          ...node.data.config.transferController,
                          transferSpeedPct: nextValue,
                        },
                      },
                    },
                  }
                : node
            )
          );
          setStatus(`Transfer speed updated: ${sourceNode.data.label}`);
          return;
        }
      }

      if (sourceNode.data.widgetType === 'recipe_executor') {
        const recipeId = resolveRecipeIdForExecutor(sourceNode, importedRecipes);
        const inlineSteps = Array.isArray(sourceNode.data.config.recipeSteps)
          ? (sourceNode.data.config.recipeSteps as ImportedRecipe['steps'])
          : [];
        const hasInlineRecipe = inlineSteps.length > 0;
        if (action === 'recipe_start' && !recipeId && !hasInlineRecipe) {
          setStatus('Recipe executor has no recipe loaded.');
          return;
        }

        const startAction = action === 'recipe_start';
        const endpoint = startAction
          ? '/api/os/recipes/run/start'
          : (() => {
              const linkedRunId = recipeExecutorRunIdRef.current.get(sourceNode.id);
              if (linkedRunId) {
                return `/api/os/recipes/run/${linkedRunId}/action`;
              }
              return '';
            })();

        if (!startAction && !endpoint) {
          try {
            const runsResponse = await fetch('/api/os/recipes/runs');
            const runsPayload = await runsResponse.json().catch(() => null);
            const runs = Array.isArray(runsPayload?.data)
              ? (runsPayload.data as RecipeRunSnapshot[])
              : [];
            const matchedRun = pickRunForExecutor(
              runs,
              recipeId,
              sourceNode.data.config.recipeName
            );
            if (matchedRun?.runId) {
              recipeExecutorRunIdRef.current.set(sourceNode.id, matchedRun.runId);
            } else {
              setStatus('No active recipe run linked to this recipe executor.');
              return;
            }
          } catch (error) {
            console.error('Failed to resolve linked recipe run:', error);
            setStatus('Failed to resolve active recipe run for this executor.');
            return;
          }
        }

        const runId = recipeExecutorRunIdRef.current.get(sourceNode.id);
        if (!startAction && !runId) {
          setStatus('No active recipe run linked to this recipe executor.');
          return;
        }

        const actionMap: Partial<Record<string, 'pause' | 'resume' | 'confirm' | 'next' | 'stop'>> = {
          recipe_stop: 'stop',
          recipe_next: 'next',
          recipe_confirm: 'confirm',
        };
        if (action === 'recipe_pause') {
          actionMap.recipe_pause = Boolean(value) ? 'pause' : 'resume';
        }
        if (!startAction && !actionMap[action]) {
          setStatus('Unsupported recipe action.');
          return;
        }

        try {
          const inlineRecipeName =
            String(sourceNode.data.config.recipeName ?? sourceNode.data.label ?? '')
              .trim() || 'Canvas Recipe';
          const inlineRecipeFormat = (
            ['bevforge', 'beer-json', 'beer-xml', 'beer-smith-bsmx'].includes(
              String(sourceNode.data.config.recipeFormat ?? '')
            )
              ? sourceNode.data.config.recipeFormat
              : 'bevforge'
          ) as ImportedRecipe['format'];
          const startPayload = recipeId
            ? {
                recipeId,
              }
            : {
                recipe: {
                  id: `inline-${sourceNode.id}`,
                  name: inlineRecipeName,
                  format: inlineRecipeFormat,
                  steps: inlineSteps,
                  rawFile: `inline://${sourceNode.id}.json`,
                  importedAt: new Date().toISOString(),
                },
              };

          const response = await fetch(
            startAction ? '/api/os/recipes/run/start' : `/api/os/recipes/run/${runId}/action`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                startAction
                  ? startPayload
                  : {
                      action: actionMap[action],
                    }
              ),
            }
          );
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.success) {
            throw new Error(payload?.error ?? `Recipe action failed (${response.status})`);
          }

          const run = payload.data as RecipeRunSnapshot;
          if (run?.runId) {
            recipeExecutorRunIdRef.current.set(sourceNode.id, run.runId);
          }

          const completedOrStopped =
            run.status === 'completed' ||
            run.status === 'canceled' ||
            run.status === 'failed';
          if (completedOrStopped) {
            recipeExecutorDispatchStateRef.current.delete(sourceNode.id);
            recipeExecutorRunIdRef.current.delete(sourceNode.id);
          } else {
            recipeExecutorDispatchStateRef.current.delete(sourceNode.id);
          }

          setNodes((prev) =>
            prev.map((node) => {
              if (node.id !== sourceNode.id) return node;
              const nextRule = toRecipeExecutorRuleFromRun(
                run,
                node.data.config.recipeExecutor
              );
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    recipeId: run.recipeId,
                    recipeName: run.recipeName,
                    recipeSteps: run.steps as ImportedRecipe['steps'],
                    state: nextRule.running ? 'on' : 'off',
                    recipeExecutor: nextRule,
                  },
                },
              };
            })
          );

          if (action === 'recipe_start') {
            setStatus(`Recipe started: ${run.recipeName}`);
          } else if (action === 'recipe_stop') {
            setStatus('Recipe stopped.');
          } else if (action === 'recipe_pause') {
            setStatus(Boolean(value) ? 'Recipe paused.' : 'Recipe resumed.');
          } else if (action === 'recipe_next') {
            setStatus('Moved to next recipe step.');
          } else if (action === 'recipe_confirm') {
            setStatus('Recipe step confirmed.');
          }
        } catch (error) {
          console.error('Recipe executor action failed:', error);
          setStatus(error instanceof Error ? error.message : 'Recipe action failed.');
        }
        return;
      }

      if (sourceNode.data.widgetType === 'automation') {
        // Start backend scaffold run tracking (non-blocking).
        void fetch('/api/os/automation/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId: sourceNode.id }),
        }).catch((error) => {
          console.error('Backend automation run start failed:', error);
        });

        const steps = (sourceNode.data.config.automationSteps ?? []) as AutomationStep[];
        if (steps.length === 0) {
          setStatus('Automation has no steps configured.');
          return;
        }

        const wait = (ms: number) =>
          new Promise<void>((resolve) => setTimeout(resolve, ms));

        for (const step of steps) {
          const delayMs = Math.max(0, Number(step.delayMs ?? 0));
          if (delayMs > 0) {
            await wait(delayMs);
          }

          if (!step.targetDeviceId) {
            continue;
          }

          const targetNode =
            nodes.find((node) => node.data.logicalDeviceId === step.targetDeviceId) ?? null;
          if (!targetNode || targetNode.data.widgetType === 'automation') {
            continue;
          }

          const targetIsThreeWayValve =
            targetNode.data.widgetType === 'valve' && targetNode.data.config.valveType === '3way';
          const nextValvePosition = (onValue?: boolean) => {
            if (targetIsThreeWayValve) {
              if (typeof onValue === 'boolean') return onValue ? 'c_to_a' : 'c_to_b';
              return targetNode.data.config.position === 'c_to_a' ? 'c_to_b' : 'c_to_a';
            }
            if (typeof onValue === 'boolean') return onValue ? 'open' : 'closed';
            return targetNode.data.config.position === 'open' ? 'closed' : 'open';
          };

          let actionValue = coerceAutomationValue(step.value);
          if (step.command === 'on_off') {
            if (targetNode.data.widgetType === 'valve') {
              actionValue = typeof actionValue === 'boolean' ? nextValvePosition(actionValue) : nextValvePosition();
            } else if (typeof actionValue === 'boolean') {
              actionValue = actionValue ? 'on' : 'off';
            } else if (actionValue === true) {
              actionValue = targetNode.data.config.state === 'on' ? 'off' : 'on';
            }
          }
          if (step.command === 'open_close') {
            if (targetNode.data.widgetType === 'valve') {
              actionValue = typeof actionValue === 'boolean' ? nextValvePosition(actionValue) : nextValvePosition();
            } else if (typeof actionValue === 'boolean') {
              actionValue = actionValue ? 'on' : 'off';
            }
          }
          if (step.command === 'route') {
            if (targetNode.data.widgetType === 'valve') {
              actionValue = typeof actionValue === 'boolean' ? nextValvePosition(actionValue) : nextValvePosition();
            } else if (typeof actionValue === 'boolean') {
              actionValue = actionValue ? 1 : 0;
            }
          }
          if (step.command === 'set_value' && actionValue === true) {
            actionValue = 1;
          }

          setNodes((prev) =>
            prev.map((node) => {
              if (node.id !== targetNode.id) return node;
              const patch =
                node.data.widgetType === 'valve'
                  ? { ...node.data.config, position: String(actionValue) as any }
                  : node.data.widgetType === 'slider'
                  ? { ...node.data.config, value: Number(actionValue) }
                  : node.data.widgetType === 'pump' && typeof actionValue === 'number'
                  ? {
                      ...node.data.config,
                      value: Number(actionValue),
                      state: Number(actionValue) > 0 ? 'on' : 'off',
                    }
                  : node.data.widgetType === 'sensor'
                  ? {
                      ...node.data.config,
                      value: Number(actionValue),
                      dummyValue: Number(actionValue),
                      sensorSampleAtMs: Date.now(),
                    }
                  : { ...node.data.config, state: String(actionValue) as any };
              return {
                ...node,
                data: {
                  ...node.data,
                  config: patch,
                },
              };
            })
          );

          let endpoint = parseMaybeNumber(targetNode.data.bindings?.actuator);
          if (!endpoint && targetNode.data.control?.endpointId) {
            endpoint = Number(targetNode.data.control.endpointId);
          }
          if (!endpoint && sourceNode.data.control?.endpointId) {
            endpoint = Number(sourceNode.data.control.endpointId);
          }

          const channelCandidates = [targetNode.data.control?.channel, sourceNode.data.control?.channel].filter(
            (candidate): candidate is string => Boolean(candidate)
          );

          if (!endpoint && channelCandidates.length > 0) {
            const matchedLocal = availableControlEndpoints.find(
              (ep) =>
                channelCandidates.some((channel) => ep.channelId === channel) &&
                isWritableEndpointDirection(ep.direction)
            );
            if (matchedLocal) {
              endpoint = matchedLocal.id;
            }
          }

          if (!endpoint) {
            continue;
          }

          try {
            await fetch('/api/os/command', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpointId: endpoint,
                value: actionValue,
                commandType: 'write',
                correlationId: `canvas-automation-${sourceNode.id}-${step.id}-${Date.now()}`,
              }),
            });
          } catch (error) {
            console.error('Automation runtime command failed:', error);
          }
        }

        setStatus(`Automation executed: ${sourceNode.data.label}`);
        return;
      }

      let targetNode = sourceNode;
      if (isControlWidgetType(sourceNode.data.widgetType)) {
        const targetDeviceId = sourceNode.data.control?.targetDeviceId;
        if (targetDeviceId) {
          targetNode =
            nodes.find((item) => item.data.logicalDeviceId === targetDeviceId) ?? sourceNode;
        } else {
          const connectedTargetId = rawEdges.find(
            (edge) =>
              edge.source === sourceNode.id &&
              (edge.data?.kind ?? 'fluid') === 'data'
          )?.target;
          if (connectedTargetId) {
            targetNode =
              nodes.find((item) => item.id === connectedTargetId) ?? sourceNode;
          }
        }
      }

      const command = sourceNode.data.control?.command ?? 'trigger';
      const targetIsThreeWayValve =
        targetNode.data.widgetType === 'valve' && targetNode.data.config.valveType === '3way';
      const targetNextValvePosition = (onValue?: boolean) => {
        if (targetIsThreeWayValve) {
          if (typeof onValue === 'boolean') return onValue ? 'c_to_a' : 'c_to_b';
          return targetNode.data.config.position === 'c_to_a' ? 'c_to_b' : 'c_to_a';
        }
        if (typeof onValue === 'boolean') return onValue ? 'open' : 'closed';
        return targetNode.data.config.position === 'open' ? 'closed' : 'open';
      };
      const mappedValue = (() => {
        if (sourceNode.data.widgetType === 'button') {
          if (command === 'on_off') {
            if (targetNode.data.widgetType === 'valve') return targetNextValvePosition();
            return targetNode.data.config.state === 'on' ? 'off' : 'on';
          }
          if (command === 'open_close') {
            if (targetNode.data.widgetType === 'valve') return targetNextValvePosition();
            return targetNode.data.config.state === 'on' ? 'off' : 'on';
          }
          if (command === 'route') {
            if (targetNode.data.widgetType === 'valve') return targetNextValvePosition();
            return true;
          }
          if (command === 'set_value') return 1;
          if (targetNode.data.widgetType === 'pump' || targetNode.data.widgetType === 'heater') {
            return targetNode.data.config.state === 'on' ? 'off' : 'on';
          }
          if (targetNode.data.widgetType === 'valve') {
            return targetNextValvePosition();
          }
          return true;
        }

        if (sourceNode.data.widgetType === 'switch') {
          if (command === 'open_close') {
            if (targetNode.data.widgetType === 'valve') return targetNextValvePosition(value === 'on');
            return value === 'on' ? 'on' : 'off';
          }
          if (command === 'route') {
            if (targetNode.data.widgetType === 'valve') return targetNextValvePosition(value === 'on');
            return value === 'on' ? 1 : 0;
          }
          if (command === 'on_off' && targetNode.data.widgetType === 'valve') {
            return targetNextValvePosition(value === 'on');
          }
          return value === 'on' ? 'on' : 'off';
        }

        return value;
      })();

      const applyNodeValue = (node: CanvasNode, nextValue: string | number | boolean): CanvasNode => {
        const patch =
          node.data.widgetType === 'valve'
            ? { ...node.data.config, position: String(nextValue) as any }
            : node.data.widgetType === 'slider'
            ? { ...node.data.config, value: Number(nextValue) }
            : node.data.widgetType === 'pump' && typeof nextValue === 'number'
            ? {
                ...node.data.config,
                value: Number(nextValue),
                state: Number(nextValue) > 0 ? 'on' : 'off',
              }
            : node.data.widgetType === 'sensor'
            ? {
                ...node.data.config,
                value: Number(nextValue),
                dummyValue: Number(nextValue),
                sensorSampleAtMs: Date.now(),
              }
            : { ...node.data.config, state: String(nextValue) as any };
        return {
          ...node,
          data: {
            ...node.data,
            config: patch,
          },
        };
      };

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === sourceNode.id && isControlWidgetType(sourceNode.data.widgetType)) {
            if (sourceNode.data.widgetType === 'switch') {
              return applyNodeValue(node, mappedValue);
            }
            if (sourceNode.data.widgetType === 'slider') {
              return applyNodeValue(node, mappedValue);
            }
          }
          if (node.id === targetNode.id) {
            return applyNodeValue(node, mappedValue);
          }
          return node;
        })
      );

      let endpoint = parseMaybeNumber(targetNode.data.bindings?.actuator);
      if (!endpoint && targetNode.data.control?.endpointId) {
        endpoint = Number(targetNode.data.control.endpointId);
      }
      if (!endpoint && sourceNode.data.control?.endpointId) {
        endpoint = Number(sourceNode.data.control.endpointId);
      }

      const channelCandidates = [
        targetNode.data.control?.channel,
        sourceNode.data.control?.channel,
      ].filter((candidate): candidate is string => Boolean(candidate));

      if (
        sourceNode.data.widgetType === 'slider' &&
        sourceNode.id === targetNode.id &&
        !sourceNode.data.control?.targetDeviceId &&
        channelCandidates.length === 0 &&
        !sourceNode.data.control?.endpointId
      ) {
        setStatus(`Setpoint updated locally: ${sourceNode.data.label}`);
        return;
      }

      if (!endpoint && channelCandidates.length > 0) {
        const matchedLocal = availableControlEndpoints.find(
          (ep) =>
            channelCandidates.some((channel) => ep.channelId === channel) &&
            isWritableEndpointDirection(ep.direction)
        );
        if (matchedLocal) {
          endpoint = matchedLocal.id;
        } else {
          try {
            const endpointRes = await fetch('/api/os/endpoints?limit=1000');
            const endpointPayload = await endpointRes.json().catch(() => null);
            const endpointRows = Array.isArray(endpointPayload?.data) ? endpointPayload.data : [];
            const matched = endpointRows.find(
              (ep: any) =>
                channelCandidates.some(
                  (channel) => String(ep.channelId ?? '') === String(channel)
                ) && isWritableEndpointDirection(ep.direction)
            );
            if (matched?.id) {
              endpoint = Number(matched.id);
            }
          } catch (error) {
            console.error('Endpoint lookup failed:', error);
          }
        }
      }

      if (!endpoint) {
        setStatus('No endpoint resolved for this control. Set actuator/endpoint/channel binding.');
        return;
      }

      try {
        const response = await fetch('/api/os/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpointId: endpoint,
            value: mappedValue,
            commandType: 'write',
            correlationId: `canvas-runtime-${nodeId}-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message ?? `Command failed (${response.status})`);
        }
        setStatus(`Command sent to endpoint ${endpoint}.`);
      } catch (error) {
        console.error('Runtime command failed:', error);
      }
    },
    [availableControlEndpoints, importedRecipes, nodes, rawEdges, setNodes]
  );

  useEffect(() => {
    if (currentMode !== 'published') {
      simpleAutomationStateRef.current.clear();
      return;
    }

    const automationNodes = nodes.filter(
      (node) =>
        node.data.widgetType === 'automation' &&
        node.data.config.automationMode === 'simple' &&
        node.data.config.simpleAutomation
    );
    const pollingMs = Math.max(
      250,
      Math.min(
        ...automationNodes.map((node) => Number(node.data.config.simpleAutomation?.pollMs ?? 1000))
      )
    );

    const evaluate = async () => {

      for (const automationNode of automationNodes) {
        const rule = automationNode.data.config.simpleAutomation;
        if (!rule?.sourceSensorDeviceId || !rule?.targetDeviceId) {
          continue;
        }

        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        const targetNode = resolveNodeByAutomationRef(nodes, rule.targetDeviceId);
        if (!sensorNode || !targetNode) {
          continue;
        }

        const sensorValue = Number(sensorNode.data.config.value ?? sensorNode.data.config.dummyValue);
        if (!Number.isFinite(sensorValue)) {
          continue;
        }

        let baseline = Number(rule.threshold ?? 0);
        if (rule.compareTo === 'setpoint_device' && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointValue = Number(setpointNode?.data.config.value);
          if (!Number.isFinite(setpointValue)) {
            continue;
          }
          baseline = setpointValue;
        }

        const operator = rule.operator ?? 'gt';
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 0));
        const wasActive = simpleAutomationStateRef.current.get(automationNode.id) ?? false;

        let isActive = wasActive;
        if (operator === 'gt' || operator === 'gte') {
          if (!wasActive) {
            isActive = sensorValue >= baseline + hysteresis;
          } else {
            isActive = sensorValue > baseline - hysteresis;
          }
        } else {
          if (!wasActive) {
            isActive = sensorValue <= baseline - hysteresis;
          } else {
            isActive = sensorValue < baseline + hysteresis;
          }
        }

        if (isActive === wasActive) {
          continue;
        }

        simpleAutomationStateRef.current.set(automationNode.id, isActive);
        const command = rule.command ?? 'on_off';
        const rawValue = isActive ? rule.onValue : rule.offValue;
        const actionValue =
          rawValue === undefined
            ? defaultCommandValue(command, isActive)
            : coerceAutomationValue(rawValue);

        await runtimeControl(targetNode.id, command, actionValue);
      }
    };

    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1000);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, runtimeControl]);

  useEffect(() => {
    if (currentMode !== 'published') {
      glycolControllerStateRef.current.clear();
      glycolControllerDispatchStateRef.current.clear();
      return;
    }

    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === 'glycol_controller' && node.data.config.glycolController
    );
    if (controllerNodes.length === 0) {
      glycolControllerStateRef.current.clear();
      glycolControllerDispatchStateRef.current.clear();
      return;
    }

    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => Number(node.data.config.glycolController?.pollMs ?? 1000))
      )
    );

    const evaluate = async () => {
      const telemetryUpdates = new Map<
        string,
        { value: number; setpoint: number; state: 'on' | 'off' }
      >();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.glycolController;
        if (!rule?.sourceSensorDeviceId) {
          continue;
        }
        const controllerUnit = inferTemperatureUnitForNode(controllerNode) ?? 'F';

        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        if (!sensorNode) {
          continue;
        }

        const rawSensorValue = Number(
          sensorNode.data.config.value ?? sensorNode.data.config.dummyValue
        );
        if (!Number.isFinite(rawSensorValue)) {
          continue;
        }
        const sensorUnit = inferTemperatureUnitForNode(sensorNode) ?? controllerUnit;
        const sensorValue = convertTemperature(
          rawSensorValue,
          sensorUnit,
          controllerUnit
        );

        let baseline = Number(rule.threshold ?? controllerNode.data.config.setpoint ?? 65);
        if (rule.compareTo === 'setpoint_device' && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointRaw = Number(
            setpointNode?.data.config.value ?? setpointNode?.data.config.setpoint
          );
          if (!Number.isFinite(setpointRaw)) {
            continue;
          }
          const setpointUnit =
            inferTemperatureUnitForNode(setpointNode) ?? controllerUnit;
          baseline = convertTemperature(setpointRaw, setpointUnit, controllerUnit);
        }

        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 1));
        const wasActive = glycolControllerStateRef.current.get(controllerNode.id) ?? false;
        let isActive = wasActive;
        if (!wasActive) {
          isActive = sensorValue >= baseline + hysteresis;
        } else {
          isActive = sensorValue > baseline - hysteresis;
        }

        telemetryUpdates.set(controllerNode.id, {
          value: sensorValue,
          setpoint: baseline,
          state: isActive ? 'on' : 'off',
        });

        glycolControllerStateRef.current.set(controllerNode.id, isActive);
        const configTargetRefs = [rule.pumpDeviceId, rule.valveDeviceId, rule.chillerDeviceId].filter(
          (item): item is string => Boolean(item)
        );
        const wiredTargetNodes = rawEdges
          .filter(
            (edge) =>
              (edge.data?.kind ?? 'fluid') === 'data' &&
              edge.source === controllerNode.id
          )
          .map((edge) => nodes.find((candidate) => candidate.id === edge.target))
          .filter(
            (targetNode): targetNode is CanvasNode =>
              Boolean(targetNode) &&
              (targetNode.data.widgetType === 'pump' ||
                targetNode.data.widgetType === 'valve' ||
                targetNode.data.widgetType === 'heater' ||
                targetNode.data.widgetType === 'pid')
          );
        const configTargetNodes = configTargetRefs
          .map((targetRef) => resolveNodeByAutomationRef(nodes, targetRef))
          .filter(
            (targetNode): targetNode is CanvasNode =>
              Boolean(targetNode) &&
              (targetNode.data.widgetType === 'pump' ||
                targetNode.data.widgetType === 'valve' ||
                targetNode.data.widgetType === 'heater' ||
                targetNode.data.widgetType === 'pid')
          );
        const targetNodeMap = new Map<string, CanvasNode>();
        for (const targetNode of [...configTargetNodes, ...wiredTargetNodes]) {
          if (targetNode.id === controllerNode.id) continue;
          targetNodeMap.set(targetNode.id, targetNode);
        }
        const targetNodes = Array.from(targetNodeMap.values());
        const targetHash = targetNodes
          .map((targetNode) => targetNode.id)
          .sort()
          .join('|');
        const dispatchKey = `${isActive ? '1' : '0'}:${targetHash}`;
        const lastDispatchKey = glycolControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        glycolControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);
        const outputUpdates = new Map<string, string | number | boolean>();
        for (const targetNode of targetNodes) {
          let command: AutomationStep['command'] = 'on_off';
          let actionValue: string | number | boolean = isActive ? 'on' : 'off';
          if (targetNode.data.widgetType === 'valve') {
            command = 'open_close';
            if (targetNode.data.config.valveType === '3way') {
              actionValue = isActive ? 'c_to_a' : 'c_to_b';
            } else {
              actionValue = isActive ? 'open' : 'closed';
            }
          }
          outputUpdates.set(targetNode.id, actionValue);
          await runtimeControl(targetNode.id, command, actionValue);
        }
        if (outputUpdates.size > 0) {
          setNodes((prev) =>
            prev.map((node) => {
              const nextValue = outputUpdates.get(node.id);
              if (nextValue === undefined) return node;
              if (node.data.widgetType === 'valve') {
                if (String(node.data.config.position ?? '') === String(nextValue)) return node;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      position: String(nextValue) as any,
                    },
                  },
                };
              }
              if (String(node.data.config.state ?? '') === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    state: String(nextValue) as any,
                  },
                },
              };
            })
          );
        }
      }

      if (telemetryUpdates.size > 0) {
        setNodes((prev) => {
          let hasVisualStateChanges = false;
          const next = prev.map((node) => {
            const update = telemetryUpdates.get(node.id);
            if (!update) return node;
            const currentValue = Number(node.data.config.value ?? NaN);
            const currentSetpoint = Number(node.data.config.setpoint ?? NaN);
            const currentState = String(node.data.config.state ?? 'off');
            const nextThreshold =
              (node.data.config.glycolController?.compareTo ?? 'threshold') === 'threshold'
                ? update.setpoint
                : node.data.config.glycolController?.threshold;
            const currentThreshold = node.data.config.glycolController?.threshold;
            if (
              currentValue === update.value &&
              currentSetpoint === update.setpoint &&
              currentState === update.state &&
              currentThreshold === nextThreshold
            ) {
              return node;
            }
            hasVisualStateChanges = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: update.value,
                  setpoint: update.setpoint,
                  state: update.state,
                  glycolController: {
                    ...node.data.config.glycolController,
                    threshold: nextThreshold,
                  },
                },
              },
            };
          });
          return hasVisualStateChanges ? next : prev;
        });
      }
    };

    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1000);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);

  useEffect(() => {
    if (currentMode !== 'published') {
      transferControllerDispatchStateRef.current.clear();
      return;
    }

    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === 'transfer_controller' && node.data.config.transferController
    );
    if (controllerNodes.length === 0) {
      transferControllerDispatchStateRef.current.clear();
      return;
    }

    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => Number(node.data.config.transferController?.pollMs ?? 500))
      )
    );

    const evaluate = async () => {
      const controllerUpdates = new Map<
        string,
        { state: 'on' | 'off'; runtimeState: 'idle' | 'running' | 'disabled'; speedPct: number }
      >();
      const outputUpdates = new Map<string, string | number | boolean>();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.transferController;
        if (!rule) {
          continue;
        }

        const wiredTargets = rawEdges
          .filter(
            (edge) =>
              (edge.data?.kind ?? 'fluid') === 'data' &&
              edge.source === controllerNode.id
          )
          .map((edge) => nodes.find((candidate) => candidate.id === edge.target))
          .filter((targetNode): targetNode is CanvasNode => Boolean(targetNode));
        const wiredPump = wiredTargets.find((target) => target.data.widgetType === 'pump');
        const wiredValves = wiredTargets.filter((target) => target.data.widgetType === 'valve');

        const configPump =
          rule.pumpDeviceId ? resolveNodeByAutomationRef(nodes, rule.pumpDeviceId) : undefined;
        const pumpNode =
          (configPump && configPump.data.widgetType === 'pump' ? configPump : undefined) ??
          wiredPump;

        const sourceRefNodes = (rule.sourceValveDeviceIds ?? [])
          .map((ref) => resolveNodeByAutomationRef(nodes, ref))
          .filter(
            (node): node is CanvasNode => Boolean(node) && node.data.widgetType === 'valve'
          );
        const destinationRefNodes = (rule.destinationValveDeviceIds ?? [])
          .map((ref) => resolveNodeByAutomationRef(nodes, ref))
          .filter(
            (node): node is CanvasNode => Boolean(node) && node.data.widgetType === 'valve'
          );

        const useAuto = rule.autoMapWiring !== false;
        let sourceValves = sourceRefNodes;
        let destinationValves = destinationRefNodes;
        if (useAuto && sourceValves.length === 0 && destinationValves.length === 0) {
          const split = Math.ceil(wiredValves.length / 2);
          sourceValves = wiredValves.slice(0, split);
          destinationValves = wiredValves.slice(split);
        }

        const enabled = rule.enabled === true;
        const active = enabled && rule.transferActive === true;
        const runtimeState: 'idle' | 'running' | 'disabled' = !enabled
          ? 'disabled'
          : active
          ? 'running'
          : 'idle';
        const speedPct = Math.max(
          0,
          Math.min(100, Number(rule.transferSpeedPct ?? controllerNode.data.config.value ?? 60))
        );
        const pumpMode = rule.pumpMode ?? 'fsd';
        controllerUpdates.set(controllerNode.id, {
          state: runtimeState === 'running' ? 'on' : 'off',
          runtimeState,
          speedPct,
        });

        const sourceIds = sourceValves.map((valve) => valve.id).sort().join('|');
        const destinationIds = destinationValves.map((valve) => valve.id).sort().join('|');
        const dispatchKey = `${runtimeState}:${pumpMode}:${speedPct}:${pumpNode?.id ?? ''}:${sourceIds}:${destinationIds}`;
        const lastDispatchKey = transferControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        transferControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);

        for (const valve of sourceValves) {
          const nextPosition =
            runtimeState === 'running'
              ? valve.data.config.valveType === '3way'
                ? 'c_to_a'
                : 'open'
              : valve.data.config.valveType === '3way'
              ? 'c_to_b'
              : 'closed';
          outputUpdates.set(valve.id, nextPosition);
          await runtimeControl(valve.id, 'open_close', nextPosition);
        }
        for (const valve of destinationValves) {
          const nextPosition =
            runtimeState === 'running'
              ? valve.data.config.valveType === '3way'
                ? 'c_to_b'
                : 'open'
              : valve.data.config.valveType === '3way'
              ? 'c_to_a'
              : 'closed';
          outputUpdates.set(valve.id, nextPosition);
          await runtimeControl(valve.id, 'open_close', nextPosition);
        }
        if (pumpNode) {
          const pumpValue: string | number =
            runtimeState === 'running'
              ? pumpMode === 'vsd'
                ? speedPct
                : 'on'
              : pumpMode === 'vsd'
              ? 0
              : 'off';
          outputUpdates.set(pumpNode.id, pumpValue);
          await runtimeControl(
            pumpNode.id,
            typeof pumpValue === 'number' ? 'set_value' : 'on_off',
            pumpValue
          );
        }
      }

      if (outputUpdates.size > 0) {
        setNodes((prev) =>
          prev.map((node) => {
            const nextValue = outputUpdates.get(node.id);
            if (nextValue === undefined) return node;
            if (node.data.widgetType === 'valve') {
              if (String(node.data.config.position ?? '') === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    position: String(nextValue) as any,
                  },
                },
              };
            }
            if (node.data.widgetType === 'pump' && typeof nextValue === 'number') {
              if (
                Number(node.data.config.value ?? NaN) === nextValue &&
                String(node.data.config.state ?? '') === (nextValue > 0 ? 'on' : 'off')
              ) {
                return node;
              }
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    value: nextValue,
                    state: nextValue > 0 ? 'on' : 'off',
                  },
                },
              };
            }
            if (String(node.data.config.state ?? '') === String(nextValue)) return node;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  state: String(nextValue) as any,
                },
              },
            };
          })
        );
      }

      if (controllerUpdates.size > 0) {
        setNodes((prev) => {
          let changed = false;
          const next = prev.map((node) => {
            const update = controllerUpdates.get(node.id);
            if (!update) return node;
            if (
              String(node.data.config.state ?? 'off') === update.state &&
              node.data.config.transferController?.runtimeState === update.runtimeState &&
              Number(node.data.config.transferController?.transferSpeedPct ?? NaN) ===
                update.speedPct &&
              Number(node.data.config.value ?? NaN) === update.speedPct
            ) {
              return node;
            }
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  state: update.state,
                  value: update.speedPct,
                  transferController: {
                    ...node.data.config.transferController,
                    transferSpeedPct: update.speedPct,
                    runtimeState: update.runtimeState,
                  },
                },
              },
            };
          });
          return changed ? next : prev;
        });
      }
    };

    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 500);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);

  useEffect(() => {
    if (currentMode !== 'published') {
      recipeExecutorDispatchStateRef.current.clear();
      recipeExecutorRunIdRef.current.clear();
      recipeExecutorAdvanceStateRef.current.clear();
      return;
    }

    const executorNodes = nodes.filter(
      (node) => node.data.widgetType === 'recipe_executor' && node.data.config.recipeExecutor
    );
    if (executorNodes.length === 0) {
      recipeExecutorDispatchStateRef.current.clear();
      recipeExecutorRunIdRef.current.clear();
      recipeExecutorAdvanceStateRef.current.clear();
      return;
    }

    const evaluate = async () => {
      let runs: RecipeRunSnapshot[] = [];
      try {
        const response = await fetch('/api/os/recipes/runs');
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Failed to load recipe runs');
        }
        runs = Array.isArray(payload.data)
          ? (payload.data as RecipeRunSnapshot[])
          : [];
      } catch (error) {
        console.error('Failed to poll recipe runs for canvas executor:', error);
        return;
      }

      const controllerUpdates = new Map<
        string,
        {
          state: 'on' | 'off';
          recipeId: string;
          recipeName: string;
          recipeSteps: ImportedRecipe['steps'];
          recipeExecutor: NonNullable<CanvasNode['data']['config']['recipeExecutor']>;
        }
      >();
      for (const controllerNode of executorNodes) {
        const recipeId = resolveRecipeIdForExecutor(controllerNode, importedRecipes);
        const linkedRunId = recipeExecutorRunIdRef.current.get(controllerNode.id);
        let run =
          runs.find((candidate) => candidate.runId === linkedRunId) ??
          pickRunForExecutor(runs, recipeId, controllerNode.data.config.recipeName) ??
          null;

        if (!run) {
          recipeExecutorDispatchStateRef.current.delete(controllerNode.id);
          recipeExecutorRunIdRef.current.delete(controllerNode.id);
          recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
          const currentRule = controllerNode.data.config.recipeExecutor ?? {};
          const idleRule: NonNullable<CanvasNode['data']['config']['recipeExecutor']> = {
            enabled: currentRule.enabled === true,
            running: false,
            paused: false,
            awaitingConfirm: false,
            currentStepIndex: 0,
            stepStartedAtMs: undefined,
            activeStepId: undefined,
            autoProceedDefault: currentRule.autoProceedDefault === true,
            runtimeState: currentRule.enabled === true ? 'idle' : 'disabled',
          };
          controllerUpdates.set(controllerNode.id, {
            state: 'off',
            recipeId,
            recipeName: controllerNode.data.config.recipeName ?? '',
            recipeSteps: (controllerNode.data.config.recipeSteps ?? []) as ImportedRecipe['steps'],
            recipeExecutor: idleRule,
          });
          continue;
        }

        recipeExecutorRunIdRef.current.set(controllerNode.id, run.runId);
        const nextRule = toRecipeExecutorRuleFromRun(
          run,
          controllerNode.data.config.recipeExecutor
        );
        const state: 'on' | 'off' = nextRule.running ? 'on' : 'off';
        const runSteps = run.steps as ImportedRecipe['steps'];

        if (!nextRule.running || run.status === 'completed' || run.status === 'canceled' || run.status === 'failed') {
          recipeExecutorDispatchStateRef.current.delete(controllerNode.id);
          recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
          if (run.status === 'completed' || run.status === 'canceled' || run.status === 'failed') {
            recipeExecutorRunIdRef.current.delete(controllerNode.id);
          }
        }

        const activeStep =
          run.currentStepIndex >= 0 && run.currentStepIndex < run.steps.length
            ? run.steps[run.currentStepIndex]
            : undefined;
        if (
          nextRule.running &&
          activeStep &&
          activeStep.status !== 'completed' &&
          activeStep.status !== 'failed' &&
          activeStep.status !== 'skipped'
        ) {
          const activeAdvanceKey = `${run.runId}:${activeStep.id}`;
          const lastAdvanceKey = recipeExecutorAdvanceStateRef.current.get(
            controllerNode.id
          );
          if (lastAdvanceKey && lastAdvanceKey !== activeAdvanceKey) {
            recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
          }

          const stepMeta = activeStep as ImportedRecipe['steps'][number] & {
            targetDeviceId?: string;
            command?: string;
            value?: string | number | boolean;
          };
          const targetRef =
            stepMeta.targetDeviceId ?? controllerNode.data.control?.targetDeviceId;
          let resolvedTargetNode: CanvasNode | undefined;
          const rawCommand =
            stepMeta.command ?? controllerNode.data.control?.command ?? undefined;
          const command = ['on_off', 'open_close', 'route', 'set_value', 'trigger'].includes(
            String(rawCommand)
          )
            ? (rawCommand as AutomationStep['command'])
            : undefined;
          if (targetRef && command) {
            const targetNode = resolveNodeByAutomationRef(nodes, targetRef);
            if (targetNode) {
              resolvedTargetNode = targetNode;
            }
            if (targetNode && targetNode.id !== controllerNode.id) {
              const fallbackValue =
                command === 'set_value' && Number.isFinite(Number(activeStep.temperatureC))
                  ? Number(activeStep.temperatureC)
                  : defaultCommandValue(command, true);
              let actionValue =
                stepMeta.value === undefined
                  ? fallbackValue
                  : coerceAutomationValue(stepMeta.value);
              if (
                command === 'set_value' &&
                typeof actionValue === 'number' &&
                (toFiniteNumber(stepMeta.temperatureC) !== undefined ||
                  stepExpectsTemperatureAdvance(activeStep))
              ) {
                const targetUnit = inferTemperatureUnitForNode(targetNode);
                if (isTemperatureUnit(targetUnit)) {
                  actionValue = convertTemperature(actionValue, 'C', targetUnit);
                }
              }
              const dispatchKey = `${run.runId}:${activeStep.id}:${targetNode.id}:${command}:${String(
                actionValue
              )}`;
              const lastDispatch =
                recipeExecutorDispatchStateRef.current.get(controllerNode.id);
              if (dispatchKey !== lastDispatch) {
                recipeExecutorDispatchStateRef.current.set(
                  controllerNode.id,
                  dispatchKey
                );
                await runtimeControl(targetNode.id, command, actionValue);
              }
            }
          }

          let targetTemperature = toFiniteNumber(
            stepMeta.temperatureC ?? stepMeta.value
          );
          const telemetryTargetNode =
            resolvedTargetNode ??
            (targetRef ? resolveNodeByAutomationRef(nodes, targetRef) : undefined);
          if (targetTemperature !== undefined) {
            const targetUnit = inferTemperatureUnitForNode(telemetryTargetNode);
            if (isTemperatureUnit(targetUnit)) {
              targetTemperature = convertTemperature(
                targetTemperature,
                'C',
                targetUnit
              );
            }
          }
          const stepStatus = String(activeStep.status ?? 'pending');
          const canAutoAdvance =
            stepStatus === 'running' || stepStatus === 'waiting_confirm';
          if (
            canAutoAdvance &&
            targetTemperature !== undefined &&
            stepExpectsTemperatureAdvance(activeStep)
          ) {
            const telemetry = resolveTelemetryValueForStep(nodes, {
              ...activeStep,
              targetDeviceId: targetRef,
            });
            if (telemetry) {
              const reached = stepIsCoolingDirection(activeStep)
                ? telemetry.measured <= targetTemperature + telemetry.tolerance
                : telemetry.measured >= targetTemperature - telemetry.tolerance;
              if (reached) {
                if (
                  recipeExecutorAdvanceStateRef.current.get(controllerNode.id) !==
                  activeAdvanceKey
                ) {
                  recipeExecutorAdvanceStateRef.current.set(
                    controllerNode.id,
                    activeAdvanceKey
                  );
                  try {
                    const response = await fetch(
                      `/api/os/recipes/run/${run.runId}/action`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'next' }),
                      }
                    );
                    const payload = await response.json().catch(() => null);
                    if (!response.ok || !payload?.success) {
                      throw new Error(
                        payload?.error ??
                          'Failed to advance recipe step on temperature target.'
                      );
                    }
                    setStatus(
                      `Recipe step complete (target reached): ${activeStep.name}`
                    );
                  } catch (error) {
                    console.error(
                      'Failed to auto-advance recipe step after target reached:',
                      error
                    );
                    recipeExecutorAdvanceStateRef.current.delete(
                      controllerNode.id
                    );
                  }
                }
              } else if (
                recipeExecutorAdvanceStateRef.current.get(controllerNode.id) ===
                activeAdvanceKey
              ) {
                recipeExecutorAdvanceStateRef.current.delete(controllerNode.id);
              }
            }
          }
        }

        controllerUpdates.set(controllerNode.id, {
          state,
          recipeId: run.recipeId,
          recipeName: run.recipeName,
          recipeSteps: runSteps,
          recipeExecutor: nextRule,
        });
      }

      if (controllerUpdates.size > 0) {
        setNodes((prev) => {
          let changed = false;
          const next = prev.map((node) => {
            const update = controllerUpdates.get(node.id);
            if (!update) return node;
            if (
              String(node.data.config.state ?? 'off') === update.state &&
              String(node.data.config.recipeId ?? '') === String(update.recipeId ?? '') &&
              String(node.data.config.recipeName ?? '') === String(update.recipeName ?? '') &&
              JSON.stringify(node.data.config.recipeSteps ?? []) ===
                JSON.stringify(update.recipeSteps ?? []) &&
              JSON.stringify(node.data.config.recipeExecutor ?? {}) ===
                JSON.stringify(update.recipeExecutor)
            ) {
              return node;
            }
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  recipeId: update.recipeId,
                  recipeName: update.recipeName,
                  recipeSteps: update.recipeSteps,
                  state: update.state,
                  recipeExecutor: update.recipeExecutor,
                },
              },
            };
          });
          return changed ? next : prev;
        });
      }
    };

    const interval = window.setInterval(evaluate, 500);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, importedRecipes, nodes, runtimeControl, setNodes]);

  useEffect(() => {
    if (currentMode !== 'published') {
      co2ControllerDispatchStateRef.current.clear();
      co2PressureStateRef.current.clear();
      co2PurgeStateRef.current.clear();
      co2AlarmStateRef.current.clear();
      return;
    }

    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === 'co2_controller' && node.data.config.co2Controller
    );
    if (controllerNodes.length === 0) {
      co2ControllerDispatchStateRef.current.clear();
      co2PressureStateRef.current.clear();
      co2PurgeStateRef.current.clear();
      co2AlarmStateRef.current.clear();
      return;
    }

    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => Number(node.data.config.co2Controller?.pollMs ?? 1000))
      )
    );

    const evaluate = async () => {
      const controllerUpdates = new Map<
        string,
        {
          value: number;
          setpoint: number;
          state: 'on' | 'off';
          runtimeState: 'idle' | 'pressurizing' | 'venting' | 'disabled' | 'safety_stop';
          alarmReason?: string;
          co2Patch?: Partial<NonNullable<CanvasNode['data']['config']['co2Controller']>>;
        }
      >();
      const now = Date.now();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.co2Controller;
        if (!rule?.sourceSensorDeviceId) {
          continue;
        }

        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        if (!sensorNode) {
          continue;
        }
        const pressurePsi = Number(sensorNode.data.config.value ?? sensorNode.data.config.dummyValue);
        if (!Number.isFinite(pressurePsi)) {
          continue;
        }

        let baseline = Number(rule.threshold ?? controllerNode.data.config.setpoint ?? 12);
        let co2Patch: Partial<NonNullable<CanvasNode['data']['config']['co2Controller']>> = {};
        if (rule.compareTo === 'setpoint_device' && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointValue = Number(setpointNode?.data.config.value ?? setpointNode?.data.config.setpoint);
          if (!Number.isFinite(setpointValue)) {
            continue;
          }
          baseline = setpointValue;
        } else if ((rule.targetMode ?? 'psi') === 'volumes') {
          let beverageTempF = Number(rule.beverageTempF ?? 38);
          if (rule.beverageTempSensorDeviceId) {
            const tempNode = resolveNodeByAutomationRef(nodes, rule.beverageTempSensorDeviceId);
            const rawTemp = Number(tempNode?.data.config.value ?? tempNode?.data.config.dummyValue);
            if (Number.isFinite(rawTemp)) {
              beverageTempF = toFahrenheit(rawTemp, String(tempNode?.data.config.unit ?? 'F'));
            }
          }
          const targetVolumes = Math.max(0, Number(rule.targetVolumes ?? 2.4));
          baseline = psiFromVolumesAtF(targetVolumes, beverageTempF);
          co2Patch = {
            ...co2Patch,
            threshold: baseline,
            beverageTempF,
          };
        }

        const enabled = rule.enabled === true;
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 0.5));
        const maxPressurePsi = Number(rule.maxPressurePsi ?? 25);
        const sampleTimeoutMs = Math.max(0, Number(rule.sampleTimeoutMs ?? 0));
        const maxRisePsiPerMin = Math.max(0, Number(rule.maxPressureRisePsiPerMin ?? 0));
        const sensorSampleAtMs = Number(sensorNode.data.config.sensorSampleAtMs ?? 0);
        const staleTelemetry =
          enabled &&
          sampleTimeoutMs > 0 &&
          sensorSampleAtMs > 0 &&
          now - sensorSampleAtMs > sampleTimeoutMs;

        let riseRateExceeded = false;
        const prevPressure = co2PressureStateRef.current.get(controllerNode.id);
        if (prevPressure && now > prevPressure.at) {
          const risePsiPerMin =
            ((pressurePsi - prevPressure.value) / (now - prevPressure.at)) * 60000;
          if (maxRisePsiPerMin > 0 && risePsiPerMin > maxRisePsiPerMin) {
            riseRateExceeded = true;
          }
        }
        co2PressureStateRef.current.set(controllerNode.id, { value: pressurePsi, at: now });
        let alarmReason: string | undefined;
        let runtimeState: 'idle' | 'pressurizing' | 'venting' | 'disabled' | 'safety_stop' = 'disabled';
        if (enabled) {
          const purgeInjectMs = Math.max(200, Number(rule.purgeInjectMs ?? 4000));
          const purgeVentMs = Math.max(200, Number(rule.purgeVentMs ?? 2000));
          const purgeCycles = Math.max(1, Math.floor(Number(rule.purgeCycles ?? 3)));
          const purgeEnabled = rule.purgeActive === true;

          if (purgeEnabled) {
            let purgeState = co2PurgeStateRef.current.get(controllerNode.id);
            if (!purgeState) {
              purgeState = { phase: 'inject', cycle: 1, phaseStartedAt: now };
            } else {
              const phaseDuration =
                purgeState.phase === 'inject' ? purgeInjectMs : purgeVentMs;
              if (now - purgeState.phaseStartedAt >= phaseDuration) {
                if (purgeState.phase === 'inject') {
                  purgeState = { ...purgeState, phase: 'vent', phaseStartedAt: now };
                } else if (purgeState.cycle >= purgeCycles) {
                  purgeState = undefined;
                  co2Patch = { ...co2Patch, purgeActive: false };
                } else {
                  purgeState = {
                    phase: 'inject',
                    cycle: purgeState.cycle + 1,
                    phaseStartedAt: now,
                  };
                }
              }
            }
            if (purgeState) {
              co2PurgeStateRef.current.set(controllerNode.id, purgeState);
              runtimeState = purgeState.phase === 'inject' ? 'pressurizing' : 'venting';
            } else {
              co2PurgeStateRef.current.delete(controllerNode.id);
            }
          } else {
            co2PurgeStateRef.current.delete(controllerNode.id);
          }

          if (staleTelemetry || riseRateExceeded) {
            runtimeState = 'safety_stop';
            co2Patch = { ...co2Patch, purgeActive: false };
            alarmReason = staleTelemetry
              ? 'Pressure sensor telemetry stale.'
              : 'Pressure rising too fast.';
            co2PurgeStateRef.current.delete(controllerNode.id);
          } else if (Number.isFinite(maxPressurePsi) && pressurePsi >= maxPressurePsi) {
            runtimeState = 'safety_stop';
            co2Patch = { ...co2Patch, purgeActive: false };
            alarmReason = `Pressure exceeded max (${maxPressurePsi.toFixed(1)} PSI).`;
            co2PurgeStateRef.current.delete(controllerNode.id);
          } else if (runtimeState !== 'pressurizing' && runtimeState !== 'venting') {
            // Normal hold control when not in purge phase.
            if (pressurePsi <= baseline - hysteresis) {
              runtimeState = 'pressurizing';
            } else if (pressurePsi >= baseline + hysteresis) {
              runtimeState = 'venting';
            } else {
              runtimeState = 'idle';
            }
          }
        } else {
          co2PurgeStateRef.current.delete(controllerNode.id);
        }
        const isActive = runtimeState === 'pressurizing' || runtimeState === 'venting';
        controllerUpdates.set(controllerNode.id, {
          value: pressurePsi,
          setpoint: baseline,
          state: isActive ? 'on' : 'off',
          runtimeState,
          alarmReason,
          co2Patch,
        });

        const configTargetRefs = [rule.inletValveDeviceId, rule.ventValveDeviceId].filter(
          (item): item is string => Boolean(item)
        );
        const wiredValves = rawEdges
          .filter(
            (edge) =>
              (edge.data?.kind ?? 'fluid') === 'data' &&
              edge.source === controllerNode.id
          )
          .map((edge) => nodes.find((candidate) => candidate.id === edge.target))
          .filter(
            (targetNode): targetNode is CanvasNode =>
              Boolean(targetNode) && targetNode.data.widgetType === 'valve'
          );
        const configValves = configTargetRefs
          .map((targetRef) => resolveNodeByAutomationRef(nodes, targetRef))
          .filter(
            (targetNode): targetNode is CanvasNode =>
              Boolean(targetNode) && targetNode.data.widgetType === 'valve'
          );
        const valveById = new Map<string, CanvasNode>();
        for (const valve of [...configValves, ...wiredValves]) {
          if (valve.id === controllerNode.id) continue;
          valveById.set(valve.id, valve);
        }
        const valves = Array.from(valveById.values());
        const inletValve =
          (rule.inletValveDeviceId && resolveNodeByAutomationRef(nodes, rule.inletValveDeviceId)) ||
          valves[0];
        const ventValve =
          (rule.ventValveDeviceId && resolveNodeByAutomationRef(nodes, rule.ventValveDeviceId)) ||
          valves.find((valve) => valve.id !== inletValve?.id);
        const alarmTarget = rule.alarmOutputDeviceId
          ? resolveNodeByAutomationRef(nodes, rule.alarmOutputDeviceId)
          : undefined;
        const hasAlarm = runtimeState === 'safety_stop';
        const dispatchKey = `${runtimeState}:${inletValve?.id ?? ''}:${ventValve?.id ?? ''}:${
          alarmTarget?.id ?? ''
        }:${hasAlarm ? '1' : '0'}`;
        const lastDispatchKey = co2ControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        co2ControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);

        const outputUpdates = new Map<string, string | number | boolean>();
        if (inletValve && inletValve.data.widgetType === 'valve') {
          const inletValue =
            runtimeState === 'pressurizing'
              ? inletValve.data.config.valveType === '3way'
                ? 'c_to_a'
                : 'open'
              : runtimeState === 'safety_stop'
              ? inletValve.data.config.valveType === '3way'
                ? 'c_to_b'
                : 'closed'
              : inletValve.data.config.valveType === '3way'
              ? 'c_to_b'
              : 'closed';
          outputUpdates.set(inletValve.id, inletValue);
          await runtimeControl(inletValve.id, 'open_close', inletValue);
        }
        if (ventValve && ventValve.data.widgetType === 'valve') {
          const ventValue =
            runtimeState === 'venting' || runtimeState === 'safety_stop'
              ? ventValve.data.config.valveType === '3way'
                ? 'c_to_a'
                : 'open'
              : ventValve.data.config.valveType === '3way'
              ? 'c_to_b'
              : 'closed';
          outputUpdates.set(ventValve.id, ventValue);
          await runtimeControl(ventValve.id, 'open_close', ventValue);
        }
        if (
          alarmTarget &&
          alarmTarget.id !== controllerNode.id &&
          alarmTarget.data.widgetType !== 'sensor' &&
          alarmTarget.data.widgetType !== 'display' &&
          alarmTarget.data.widgetType !== 'note'
        ) {
          const alarmValue: string | number | boolean =
            alarmTarget.data.widgetType === 'valve'
              ? hasAlarm
                ? alarmTarget.data.config.valveType === '3way'
                  ? 'c_to_a'
                  : 'open'
                : alarmTarget.data.config.valveType === '3way'
                ? 'c_to_b'
                : 'closed'
              : hasAlarm
              ? 'on'
              : 'off';
          outputUpdates.set(alarmTarget.id, alarmValue);
          await runtimeControl(
            alarmTarget.id,
            alarmTarget.data.widgetType === 'valve' ? 'open_close' : 'on_off',
            alarmValue
          );
        }
        if (outputUpdates.size > 0) {
          setNodes((prev) =>
            prev.map((node) => {
              const nextValue = outputUpdates.get(node.id);
              if (nextValue === undefined) return node;
              if (node.data.widgetType === 'valve') {
                if (String(node.data.config.position ?? '') === String(nextValue)) return node;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      position: String(nextValue) as any,
                    },
                  },
                };
              }
              if (String(node.data.config.state ?? '') === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    state: String(nextValue) as any,
                  },
                },
              };
            })
          );
        }
      }

      if (controllerUpdates.size > 0) {
        setNodes((prev) => {
          let changed = false;
          const next = prev.map((node) => {
            const update = controllerUpdates.get(node.id);
            if (!update) return node;
            const currentRuntime = node.data.config.co2Controller?.runtimeState ?? 'disabled';
            const nextThreshold =
              (node.data.config.co2Controller?.compareTo ?? 'threshold') === 'threshold'
                ? update.setpoint
                : node.data.config.co2Controller?.threshold;
            const currentPatch = node.data.config.co2Controller ?? {};
            const nextPatch = {
              ...currentPatch,
              ...(update.co2Patch ?? {}),
              lastAlarmReason: update.alarmReason,
            };
            if (
              Number(node.data.config.value ?? NaN) === update.value &&
              Number(node.data.config.setpoint ?? NaN) === update.setpoint &&
              String(node.data.config.state ?? 'off') === update.state &&
              currentRuntime === update.runtimeState &&
              node.data.config.co2Controller?.threshold === nextThreshold &&
              currentPatch.purgeActive === nextPatch.purgeActive &&
              currentPatch.lastAlarmReason === nextPatch.lastAlarmReason
            ) {
              return node;
            }
            changed = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: update.value,
                  setpoint: update.setpoint,
                  state: update.state,
                  co2Controller: {
                    ...nextPatch,
                    runtimeState: update.runtimeState,
                    threshold: nextThreshold,
                  },
                },
              },
            };
          });
          return changed ? next : prev;
        });

        const eventsToAdd: Co2AlarmEvent[] = [];
        for (const controllerNode of controllerNodes) {
          const update = controllerUpdates.get(controllerNode.id);
          if (!update) continue;
          const previousReason = co2AlarmStateRef.current.get(controllerNode.id);
          const nextReason = update.alarmReason;
          if (nextReason && previousReason !== nextReason) {
            if (controllerNode.data.config.co2Controller?.emitAlarmEvents !== false) {
              eventsToAdd.push({
                id: makeId('co2-alarm'),
                controllerId: controllerNode.id,
                controllerLabel: controllerNode.data.label,
                severity: 'critical',
                message: nextReason,
                at: new Date().toISOString(),
              });
            }
            setStatus(`CO2 alarm: ${controllerNode.data.label} - ${nextReason}`);
          } else if (!nextReason && previousReason) {
            if (controllerNode.data.config.co2Controller?.emitAlarmEvents !== false) {
              eventsToAdd.push({
                id: makeId('co2-alarm-clear'),
                controllerId: controllerNode.id,
                controllerLabel: controllerNode.data.label,
                severity: 'info',
                message: 'CO2 alarm cleared.',
                at: new Date().toISOString(),
              });
            }
          }
          if (nextReason) {
            co2AlarmStateRef.current.set(controllerNode.id, nextReason);
          } else {
            co2AlarmStateRef.current.delete(controllerNode.id);
          }
        }
        if (eventsToAdd.length > 0) {
          setCo2AlarmEvents((prev) => [...eventsToAdd, ...prev].slice(0, 40));
        }
      }
    };

    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1000);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);

  useEffect(() => {
    if (currentMode !== 'published') {
      hltControllerStateRef.current.clear();
      hltControllerDispatchStateRef.current.clear();
      return;
    }

    const controllerNodes = nodes.filter(
      (node) => node.data.widgetType === 'hlt_controller' && node.data.config.hltController
    );
    if (controllerNodes.length === 0) {
      hltControllerStateRef.current.clear();
      hltControllerDispatchStateRef.current.clear();
      return;
    }

    const pollingMs = Math.max(
      250,
      Math.min(
        ...controllerNodes.map((node) => Number(node.data.config.hltController?.pollMs ?? 1000))
      )
    );

    const evaluate = async () => {
      const telemetryUpdates = new Map<
        string,
        { value: number; setpoint: number; state: 'on' | 'off' }
      >();
      for (const controllerNode of controllerNodes) {
        const rule = controllerNode.data.config.hltController;
        if (!rule?.sourceSensorDeviceId) {
          continue;
        }
        const controllerUnit = inferTemperatureUnitForNode(controllerNode) ?? 'F';

        const sensorNode = resolveNodeByAutomationRef(nodes, rule.sourceSensorDeviceId);
        if (!sensorNode) {
          continue;
        }

        const rawSensorValue = Number(
          sensorNode.data.config.value ?? sensorNode.data.config.dummyValue
        );
        if (!Number.isFinite(rawSensorValue)) {
          continue;
        }
        const sensorUnit = inferTemperatureUnitForNode(sensorNode) ?? controllerUnit;
        const sensorValue = convertTemperature(
          rawSensorValue,
          sensorUnit,
          controllerUnit
        );

        let baseline = Number(rule.threshold ?? controllerNode.data.config.setpoint ?? 152);
        if (rule.compareTo === 'setpoint_device' && rule.setpointDeviceId) {
          const setpointNode = resolveNodeByAutomationRef(nodes, rule.setpointDeviceId);
          const setpointRaw = Number(
            setpointNode?.data.config.value ?? setpointNode?.data.config.setpoint
          );
          if (!Number.isFinite(setpointRaw)) {
            continue;
          }
          const setpointUnit =
            inferTemperatureUnitForNode(setpointNode) ?? controllerUnit;
          baseline = convertTemperature(setpointRaw, setpointUnit, controllerUnit);
        }

        const enabled = rule.enabled === true;
        const hysteresis = Math.max(0, Number(rule.hysteresis ?? 1));
        const wasActive = hltControllerStateRef.current.get(controllerNode.id) ?? false;
        let isActive = false;
        if (enabled) {
          if (!wasActive) {
            isActive = sensorValue <= baseline - hysteresis;
          } else {
            isActive = sensorValue < baseline + hysteresis;
          }
        }

        telemetryUpdates.set(controllerNode.id, {
          value: sensorValue,
          setpoint: baseline,
          state: isActive ? 'on' : 'off',
        });

        hltControllerStateRef.current.set(controllerNode.id, isActive);
        const configTargetRefs = [rule.heaterDeviceId, rule.recircPumpDeviceId].filter(
          (item): item is string => Boolean(item)
        );
        const wiredTargetNodes = rawEdges
          .filter(
            (edge) =>
              (edge.data?.kind ?? 'fluid') === 'data' &&
              edge.source === controllerNode.id
          )
          .map((edge) => nodes.find((candidate) => candidate.id === edge.target))
          .filter(
            (targetNode): targetNode is CanvasNode =>
              Boolean(targetNode) &&
              (targetNode.data.widgetType === 'heater' ||
                targetNode.data.widgetType === 'pump')
          );
        const configTargetNodes = configTargetRefs
          .map((targetRef) => resolveNodeByAutomationRef(nodes, targetRef))
          .filter(
            (targetNode): targetNode is CanvasNode =>
              Boolean(targetNode) &&
              (targetNode.data.widgetType === 'heater' ||
                targetNode.data.widgetType === 'pump')
          );
        const targetNodeMap = new Map<string, CanvasNode>();
        for (const targetNode of [...configTargetNodes, ...wiredTargetNodes]) {
          if (targetNode.id === controllerNode.id) continue;
          targetNodeMap.set(targetNode.id, targetNode);
        }
        const targetNodes = Array.from(targetNodeMap.values());
        const targetHash = targetNodes
          .map((targetNode) => targetNode.id)
          .sort()
          .join('|');
        const dispatchKey = `${enabled ? '1' : '0'}:${isActive ? '1' : '0'}:${targetHash}`;
        const lastDispatchKey = hltControllerDispatchStateRef.current.get(controllerNode.id);
        if (dispatchKey === lastDispatchKey) {
          continue;
        }
        hltControllerDispatchStateRef.current.set(controllerNode.id, dispatchKey);
        const outputUpdates = new Map<string, string | number | boolean>();
        for (const targetNode of targetNodes) {
          const actionValue: string | number | boolean = isActive ? 'on' : 'off';
          outputUpdates.set(targetNode.id, actionValue);
          await runtimeControl(targetNode.id, 'on_off', actionValue);
        }
        if (outputUpdates.size > 0) {
          setNodes((prev) =>
            prev.map((node) => {
              const nextValue = outputUpdates.get(node.id);
              if (nextValue === undefined) return node;
              if (String(node.data.config.state ?? '') === String(nextValue)) return node;
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    state: String(nextValue) as any,
                  },
                },
              };
            })
          );
        }
      }

      if (telemetryUpdates.size > 0) {
        setNodes((prev) => {
          let hasVisualStateChanges = false;
          const next = prev.map((node) => {
            const update = telemetryUpdates.get(node.id);
            if (!update) return node;
            const currentValue = Number(node.data.config.value ?? NaN);
            const currentSetpoint = Number(node.data.config.setpoint ?? NaN);
            const currentState = String(node.data.config.state ?? 'off');
            const nextThreshold =
              (node.data.config.hltController?.compareTo ?? 'threshold') === 'threshold'
                ? update.setpoint
                : node.data.config.hltController?.threshold;
            const currentThreshold = node.data.config.hltController?.threshold;
            if (
              currentValue === update.value &&
              currentSetpoint === update.setpoint &&
              currentState === update.state &&
              currentThreshold === nextThreshold
            ) {
              return node;
            }
            hasVisualStateChanges = true;
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  value: update.value,
                  setpoint: update.setpoint,
                  state: update.state,
                  hltController: {
                    ...node.data.config.hltController,
                    threshold: nextThreshold,
                  },
                },
              },
            };
          });
          return hasVisualStateChanges ? next : prev;
        });
      }
    };

    const interval = window.setInterval(evaluate, Number.isFinite(pollingMs) ? pollingMs : 1000);
    void evaluate();
    return () => {
      window.clearInterval(interval);
    };
  }, [currentMode, nodes, rawEdges, runtimeControl, setNodes]);

  const writableControlEndpoints = useMemo(
    () => availableControlEndpoints.filter((endpoint) => isWritableEndpointDirection(endpoint.direction)),
    [availableControlEndpoints]
  );

  const displayedEdges = useMemo(
    () =>
      annotateFluidEdges(nodes, rawEdges).map((edge) => {
        const kind = (edge.data?.kind ?? 'fluid') as EdgeKind;
        if (kind === 'fluid') {
          const medium = (edge.data?.medium ?? 'product') as FluidMedium;
          const mediumColor = fluidColorByMedium[medium]?.active ?? fluidColorByMedium.product.active;
          return {
            ...edge,
            type: 'step',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: mediumColor,
              width: 16,
              height: 16,
            },
          };
        }
        return {
          ...edge,
          type: 'default',
          animated: true,
          style: edgeStyleByKind[kind],
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color:
              kind === 'data'
                ? '#f59e0b'
                : kind === 'power'
                ? '#dc2626'
                : '#111827',
            width: 14,
            height: 14,
          },
        };
      }),
    [nodes, rawEdges]
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );
  const selectedImportedRecipe = useMemo(
    () =>
      importedRecipes.find((recipe) => recipe.id === selectedImportedRecipeId) ??
      importedRecipes[0] ??
      null,
    [importedRecipes, selectedImportedRecipeId]
  );

  const applyProjectToEditor = useCallback((incomingProject: CanvasProject) => {
    const firstPage = incomingProject.pages[0];
    const pageId = activePageIdRef.current || firstPage?.id || '';
    const page =
      incomingProject.pages.find((candidate) => candidate.id === pageId) ??
      firstPage ??
      createPage('Master Layout');
    setActivePageId(page.id);
    setNodes(page.nodes ?? []);
    setRawEdges(page.edges ?? []);
  }, [setNodes, setRawEdges]);

  const loadProject = useCallback(async () => {
    try {
      setStatus('Loading commissioning project from disk...');
      const [projectRes, devicesRes, endpointsRes, recipesRes] = await Promise.all([
        fetch('/api/os/canvas/project'),
        fetch('/api/os/registry/devices'),
        fetch('/api/os/endpoints?limit=1000'),
        fetch('/api/os/recipes'),
      ]);

      if (!projectRes.ok || !devicesRes.ok) {
        throw new Error(`API unavailable (${projectRes.status}/${devicesRes.status})`);
      }

      const projectPayload = await projectRes.json().catch(() => null);
      const devicePayload = await devicesRes.json().catch(() => null);
      const endpointsPayload = endpointsRes.ok
        ? await endpointsRes.json().catch(() => null)
        : null;
      const recipesPayload = recipesRes.ok
        ? await recipesRes.json().catch(() => null)
        : null;

      const loadedProject: CanvasProject =
        projectPayload?.data && projectPayload.success
          ? projectPayload.data
          : createDefaultProject();
      const loadedDevices: RegisteredDevice[] =
        devicePayload?.data && devicePayload.success ? devicePayload.data : [];
      const loadedRecipes: ImportedRecipe[] =
        recipesPayload?.data && recipesPayload.success ? recipesPayload.data : [];

      setProject(loadedProject);
      setDevices(loadedDevices);
      setImportedRecipes(loadedRecipes);
      setSelectedImportedRecipeId((current) =>
        current && loadedRecipes.some((recipe) => recipe.id === current)
          ? current
          : loadedRecipes[0]?.id ?? ''
      );
      setAvailableControlEndpoints(
        Array.isArray(endpointsPayload?.data)
          ? (endpointsPayload.data as any[])
              .filter(
                (ep) =>
                  typeof ep?.id === 'number' &&
                  typeof ep?.channelId === 'string' &&
                  typeof ep?.endpointKind === 'string' &&
                  typeof ep?.direction === 'string'
              )
              .map((ep) => ({
                id: ep.id,
                channelId: ep.channelId,
                endpointKind: ep.endpointKind,
                direction: ep.direction,
              }))
          : []
      );
      applyProjectToEditor(loadedProject);
      setStatus('Canvas project loaded.');
    } catch (error) {
      console.error('Failed to load canvas project:', error);
      const fallback = createDefaultProject();
      setProject(fallback);
      setDevices([]);
      setImportedRecipes([]);
      setSelectedImportedRecipeId('');
      setAvailableControlEndpoints([]);
      applyProjectToEditor(fallback);
      setStatus('Loaded fallback project (API unavailable).');
    }
  }, [applyProjectToEditor]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!currentPage) return;
    setNodes(currentPage.nodes ?? []);
    setRawEdges(currentPage.edges ?? []);
    setSelectedNodeId(null);
  }, [currentPage, setNodes, setRawEdges]);

  useEffect(() => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const inboundDataByTarget = new Map<string, CanvasNode[]>();
    const outboundDataBySource = new Map<string, CanvasNode[]>();

    for (const edge of rawEdges) {
      if ((edge.data?.kind ?? 'fluid') !== 'data') continue;
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      if (!sourceNode || !targetNode) continue;
      const inbound = inboundDataByTarget.get(edge.target) ?? [];
      inbound.push(sourceNode);
      inboundDataByTarget.set(edge.target, inbound);
      const outbound = outboundDataBySource.get(edge.source) ?? [];
      outbound.push(targetNode);
      outboundDataBySource.set(edge.source, outbound);
    }

    let changedAny = false;
    const nextNodes = nodes.map((node) => {
      if (
        node.data.widgetType !== 'glycol_controller' &&
        node.data.widgetType !== 'hlt_controller' &&
        node.data.widgetType !== 'co2_controller' &&
        node.data.widgetType !== 'transfer_controller' &&
        node.data.widgetType !== 'recipe_executor'
      ) {
        return node;
      }

      const inbound = inboundDataByTarget.get(node.id) ?? [];
      const outbound = outboundDataBySource.get(node.id) ?? [];
      const sourceSensor = inbound.find((source) => source.data.widgetType === 'sensor');
      const pumpTarget = outbound.find((target) => target.data.widgetType === 'pump');
      const valveTarget = outbound.find((target) => target.data.widgetType === 'valve');
      const controlTarget = outbound.find(
        (target) =>
          target.data.widgetType !== 'sensor' &&
          target.data.widgetType !== 'display' &&
          target.data.widgetType !== 'note'
      );
      const chillerTarget = outbound.find(
        (target) => target.data.widgetType === 'heater' || target.data.widgetType === 'pid'
      );
      const heaterTarget = outbound.find((target) => target.data.widgetType === 'heater');
      const valveTargets = outbound.filter((target) => target.data.widgetType === 'valve');

      const nextSourceSensorDeviceId = sourceSensor
        ? toAutomationRef(sourceSensor)
        : undefined;
      const nextPumpDeviceId = pumpTarget ? toAutomationRef(pumpTarget) : undefined;
      const nextValveDeviceId = valveTarget ? toAutomationRef(valveTarget) : undefined;
      const nextChillerDeviceId = chillerTarget
        ? toAutomationRef(chillerTarget)
        : undefined;

      if (node.data.widgetType === 'glycol_controller') {
        const current = node.data.config.glycolController ?? {};
        if (
          current.sourceSensorDeviceId === nextSourceSensorDeviceId &&
          current.pumpDeviceId === nextPumpDeviceId &&
          current.valveDeviceId === nextValveDeviceId &&
          current.chillerDeviceId === nextChillerDeviceId
        ) {
          return node;
        }

        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              glycolController: {
                ...current,
                sourceSensorDeviceId: nextSourceSensorDeviceId,
                pumpDeviceId: nextPumpDeviceId,
                valveDeviceId: nextValveDeviceId,
                chillerDeviceId: nextChillerDeviceId,
              },
            },
          },
        };
      }

      const nextHeaterDeviceId = heaterTarget ? toAutomationRef(heaterTarget) : undefined;
      const nextRecircPumpDeviceId = nextPumpDeviceId;
      const nextInletValveDeviceId = valveTargets[0] ? toAutomationRef(valveTargets[0]) : undefined;
      const nextVentValveDeviceId = valveTargets[1] ? toAutomationRef(valveTargets[1]) : undefined;
      const nextSourceValveRefs = valveTargets
        .slice(0, Math.ceil(valveTargets.length / 2))
        .map((valve) => toAutomationRef(valve));
      const nextDestinationValveRefs = valveTargets
        .slice(Math.ceil(valveTargets.length / 2))
        .map((valve) => toAutomationRef(valve));

      if (node.data.widgetType === 'co2_controller') {
        const current = node.data.config.co2Controller ?? {};
        if (
          current.sourceSensorDeviceId === nextSourceSensorDeviceId &&
          current.inletValveDeviceId === nextInletValveDeviceId &&
          current.ventValveDeviceId === nextVentValveDeviceId
        ) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              co2Controller: {
                ...current,
                sourceSensorDeviceId: nextSourceSensorDeviceId,
                inletValveDeviceId: nextInletValveDeviceId,
                ventValveDeviceId: nextVentValveDeviceId,
              },
            },
          },
        };
      }

      if (node.data.widgetType === 'transfer_controller') {
        const current = node.data.config.transferController ?? {};
        const autoMap = current.autoMapWiring !== false;
        const currentSource = current.sourceValveDeviceIds ?? [];
        const currentDestination = current.destinationValveDeviceIds ?? [];
        const nextSource = autoMap ? nextSourceValveRefs : currentSource;
        const nextDestination = autoMap ? nextDestinationValveRefs : currentDestination;
        const sourceSame =
          currentSource.length === nextSource.length &&
          currentSource.every((ref, idx) => ref === nextSource[idx]);
        const destinationSame =
          currentDestination.length === nextDestination.length &&
          currentDestination.every((ref, idx) => ref === nextDestination[idx]);
        if (current.pumpDeviceId === nextPumpDeviceId && sourceSame && destinationSame) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              transferController: {
                ...current,
                pumpDeviceId: nextPumpDeviceId,
                sourceValveDeviceIds: nextSource,
                destinationValveDeviceIds: nextDestination,
              },
            },
          },
        };
      }

      if (node.data.widgetType === 'recipe_executor') {
        const nextTargetDeviceId = controlTarget
          ? toAutomationRef(controlTarget)
          : undefined;
        const inferredCommand =
          controlTarget?.data.widgetType === 'valve'
            ? 'open_close'
            : controlTarget?.data.widgetType === 'slider'
            ? 'set_value'
            : controlTarget?.data.widgetType === 'pump'
            ? 'on_off'
            : node.data.control?.command ?? 'trigger';
        if (node.data.control?.targetDeviceId === nextTargetDeviceId && node.data.control?.command === inferredCommand) {
          return node;
        }
        changedAny = true;
        return {
          ...node,
          data: {
            ...node.data,
            control: {
              ...node.data.control,
              targetDeviceId: nextTargetDeviceId,
              command: inferredCommand,
            },
          },
        };
      }

      const current = node.data.config.hltController ?? {};
      if (
        current.sourceSensorDeviceId === nextSourceSensorDeviceId &&
        current.heaterDeviceId === nextHeaterDeviceId &&
        current.recircPumpDeviceId === nextRecircPumpDeviceId
      ) {
        return node;
      }
      changedAny = true;
      return {
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            hltController: {
              ...current,
              sourceSensorDeviceId: nextSourceSensorDeviceId,
              heaterDeviceId: nextHeaterDeviceId,
              recircPumpDeviceId: nextRecircPumpDeviceId,
            },
          },
        },
      };
    });

    if (changedAny) {
      setNodes(nextNodes);
      setStatus('Auto-configured controller outputs from data wiring.');
    }
  }, [nodes, rawEdges, setNodes]);

  // Propagate wired sensor values over data lines so vessel/display widgets
  // reflect upstream sensor telemetry in real time.
  useEffect(() => {
    const dataEdges = rawEdges.filter((edge) => (edge.data?.kind ?? 'fluid') === 'data');
    if (dataEdges.length === 0) return;

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const incomingByTarget = new Map<string, CanvasNode[]>();
    for (const edge of dataEdges) {
      const source = nodeById.get(edge.source);
      if (!source || source.data.widgetType !== 'sensor') continue;
      const list = incomingByTarget.get(edge.target) ?? [];
      list.push(source);
      incomingByTarget.set(edge.target, list);
    }

    if (incomingByTarget.size === 0) return;

    setNodes((prev) => {
      let changed = false;
      const next = prev.map((node) => {
        const sensorSources = incomingByTarget.get(node.id) ?? [];
        if (sensorSources.length === 0) return node;

        const tempSensor = sensorSources.find(
          (sensor) => sensor.data.config.sensorType === 'temperature'
        );
        const firstSensor = sensorSources[0];

        if (node.data.widgetType === 'vessel') {
          const source = tempSensor ?? firstSensor;
          const numeric = Number(source.data.config.value ?? source.data.config.dummyValue);
          if (!Number.isFinite(numeric)) return node;
          if (Number(node.data.config.temperature) === numeric) return node;
          changed = true;
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                temperature: numeric,
              },
            },
          };
        }

        if (node.data.widgetType === 'display') {
          const source = tempSensor ?? firstSensor;
          const value = source.data.config.value ?? source.data.config.dummyValue ?? '--';
          if (String(node.data.config.value ?? '--') === String(value)) return node;
          changed = true;
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                value,
              },
            },
          };
        }

        return node;
      });

      return changed ? next : prev;
    });
  }, [nodes, rawEdges, setNodes]);

  const stripRuntimeData = (node: CanvasNode): CanvasNode => {
    const persistedData = node.data;
    return {
      id: node.id,
      type: node.type ?? 'widget',
      position: node.position,
      data: persistedData,
    };
  };

  const commitProject = useCallback(
    (baseProject: CanvasProject | null): CanvasProject | null => {
      if (!baseProject) return null;
      const now = new Date().toISOString();
      const updatedPages = baseProject.pages.map((page) => {
        if (page.id !== activePageId) return page;
        return {
          ...page,
          nodes: nodes.map((node) => stripRuntimeData(node)),
          edges: rawEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type ?? 'smoothstep',
            data:
              (edge.data?.kind ?? 'fluid') === 'fluid'
                ? { kind: 'fluid', medium: edge.data?.medium ?? 'product' }
                : { kind: edge.data?.kind ?? 'fluid' },
          })),
          updatedAt: now,
        };
      });

      return {
        ...baseProject,
        pages: updatedPages,
        updatedAt: now,
      };
    },
    [activePageId, nodes, rawEdges]
  );

  const persistAll = useCallback(
    async (nextProject: CanvasProject, nextDevices: RegisteredDevice[]) => {
      setStatus('Saving to commissioning JSON files...');
      const [projectRes, devicesRes] = await Promise.all([
        fetch('/api/os/canvas/project', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextProject),
        }),
        fetch('/api/os/registry/devices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextDevices),
        }),
      ]);
      if (!projectRes.ok || !devicesRes.ok) {
        throw new Error(`Save failed (${projectRes.status}/${devicesRes.status})`);
      }
      setStatus('Saved.');
    },
    []
  );

  const handleSave = useCallback(async () => {
    try {
      const nextProject = commitProject(project);
      if (!nextProject) return;
      setProject(nextProject);
      await persistAll(nextProject, devices);
    } catch (error) {
      console.error('Save failed:', error);
      setStatus('Save failed.');
    }
  }, [commitProject, project, devices, persistAll]);

  const upsertDeviceForNode = useCallback(
    (node: CanvasNode): CanvasNode => {
      if (!isExternalFlowWidget(node.data.widgetType)) {
        return node;
      }
      const logicalDeviceId = node.data.logicalDeviceId ?? `dev-${node.id}`;

      setDevices((prev) => {
        if (prev.some((device) => device.id === logicalDeviceId)) {
          return prev;
        }
        return [
          ...prev,
          createRegisteredDevice(node.data.label, node.data.widgetType, logicalDeviceId),
        ];
      });

      return {
        ...node,
        data: {
          ...node.data,
          logicalDeviceId,
        },
      };
    },
    []
  );

  const handleAddNode = useCallback(
    (widgetOption: AddWidgetOption, logicalDeviceId?: string) => {
      const mode = currentPage?.mode ?? 'draft';
      const position = { x: 120 + nodes.length * 18, y: 120 + nodes.length * 14 };
      const widgetType: WidgetType = widgetOption === 'valve_3way' ? 'valve' : widgetOption;
      let nextNode = createNode(widgetType, position);
      if (widgetOption === 'valve_3way') {
        nextNode = {
          ...nextNode,
          data: {
            ...nextNode.data,
            label: `VALVE 3-WAY ${nextNode.id.slice(-4)}`,
            config: {
              ...nextNode.data.config,
              valveType: '3way',
              position: 'c_to_a',
            },
          },
        };
      }
      if (
        widgetType === 'button' ||
        widgetType === 'switch' ||
        widgetType === 'slider' ||
        widgetType === 'pump' ||
        widgetType === 'valve' ||
        widgetType === 'heater'
      ) {
        nextNode = {
          ...nextNode,
          data: {
            ...nextNode.data,
            control: {
              command:
                widgetType === 'slider'
                  ? 'set_value'
                  : widgetType === 'valve'
                  ? 'open_close'
                  : 'on_off',
              driverType: 'dummy',
            },
          },
        };
      }
      if (logicalDeviceId) {
        nextNode = {
          ...nextNode,
          data: {
            ...nextNode.data,
            logicalDeviceId,
          },
        };
      }
      nextNode = upsertDeviceForNode(nextNode);
      const nextNodes = [...nodes, nextNode];
      setNodes(nextNodes);
      setSelectedNodeId(nextNode.id);
      // Force camera to the newly added node so adds are always visible.
      setTimeout(() => {
        setCenter(nextNode.position.x, nextNode.position.y, {
          zoom: 1,
          duration: 250,
        });
      }, 0);
      if (mode !== 'draft' && project && currentPage) {
        const now = new Date().toISOString();
        setProject({
          ...project,
          pages: project.pages.map((page) =>
            page.id === currentPage.id
              ? {
                  ...page,
                  mode: 'draft',
                  nodes: nextNodes,
                  edges: rawEdges,
                  updatedAt: now,
                }
              : page
          ),
          updatedAt: now,
        });
        setStatus(
          `Switched to Draft and added ${widgetOptionLabel[widgetOption]} widget. Nodes: ${nextNodes.length}`
        );
      } else {
        setStatus(
          `Added ${widgetOptionLabel[widgetOption]} widget. Nodes: ${nextNodes.length}`
        );
      }
    },
    [currentPage, nodes, project, rawEdges, setCenter, setNodes, upsertDeviceForNode]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      const sourcePort = resolveNodePort(sourceNode, connection.sourceHandle);
      const targetPort = resolveNodePort(targetNode, connection.targetHandle);
      if (!sourcePort || !targetPort) {
        setStatus('Invalid connection handles.');
        return;
      }

      const compatibility = resolveConnectionCompatibility({
        sourcePort,
        targetPort,
        activeFluidMedium,
      });
      if (!compatibility.ok) {
        setStatus(compatibility.reason);
        return;
      }

      const medium = compatibility.kind === 'fluid' ? compatibility.medium : undefined;
      const next = createEdge(connection.source, connection.target, compatibility.kind, medium);
      setRawEdges((prev) => [
        ...prev,
        {
          ...next,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          style: compatibility.kind === 'fluid'
            ? {
                stroke: fluidColorByMedium[medium ?? 'product'].active,
                strokeWidth: 2.2,
              }
            : edgeStyleByKind[compatibility.kind],
        },
      ]);
      setStatus(
        compatibility.kind === 'fluid'
          ? `Connected ${medium ?? 'product'} flow line.`
          : `Connected ${compatibility.kind} line.`
      );
    },
    [activeFluidMedium, nodes, setRawEdges]
  );

  const confirmDeleteWire = useCallback(() => {
    if (!wireDeleteTarget) return;
    setLastUndoAction({ type: 'wire', edge: wireDeleteTarget });
    setRawEdges((prev) => prev.filter((edge) => edge.id !== wireDeleteTarget.id));
    setStatus('Wire deleted.');
    setWireDeleteTarget(null);
  }, [setRawEdges, wireDeleteTarget]);

  const updateSelectedNode = useCallback(
    (partial: Partial<CanvasNode['data']>) => {
      if (!selectedNodeId) return;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...partial,
                },
              }
            : node
        )
      );
    },
    [selectedNodeId, setNodes]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    const nodeToDelete = nodes.find((node) => node.id === selectedNodeId);
    if (!nodeToDelete) return;
    const edgesToDelete = rawEdges.filter(
      (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
    );
    setLastUndoAction({ type: 'widget', node: nodeToDelete, edges: edgesToDelete });
    setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
    setRawEdges((prev) =>
      prev.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
    setStatus('Widget deleted.');
  }, [nodes, rawEdges, selectedNodeId, setNodes, setRawEdges]);

  const duplicateNodeById = useCallback(
    (nodeId: string) => {
      const source = nodes.find((node) => node.id === nodeId);
      if (!source) return;
      const duplicated: CanvasNode = {
        ...source,
        id: makeId(source.data.widgetType),
        position: {
          x: source.position.x + 40,
          y: source.position.y + 40,
        },
        data: {
          ...source.data,
          label: `${source.data.label} Copy`,
          logicalDeviceId: undefined,
          bindings: {},
        },
      };
      setNodes((prev) => [...prev, duplicated]);
      setSelectedNodeId(duplicated.id);
      setStatus('Widget duplicated (unbound).');
    },
    [nodes, setNodes]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      if (!selectedNodeId) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        return;
      }
      event.preventDefault();
      deleteSelectedNode();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelectedNode, selectedNodeId]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const switchPage = (pageId: string) => {
    const committed = commitProject(project);
    if (!committed) return;
    setProject(committed);
    setActivePageId(pageId);
    const next = committed.pages.find((page) => page.id === pageId);
    if (next) {
      setNodes(next.nodes);
      setRawEdges(next.edges);
      setSelectedNodeId(null);
    }
  };

  const handleAddPage = () => {
    if (!project) return;
    const committed = commitProject(project) ?? project;
    const page = createPage(`Page ${committed.pages.length + 1}`);
    const nextProject = {
      ...committed,
      pages: [...committed.pages, page],
      updatedAt: new Date().toISOString(),
    };
    setProject(nextProject);
    setActivePageId(page.id);
    setNodes([]);
    setRawEdges([]);
  };

  const requestDeletePage = () => {
    if (!project || !currentPage || project.pages.length <= 1) return;
    setPageDeleteTarget(currentPage);
  };

  const confirmDeletePage = () => {
    if (!project || !currentPage || project.pages.length <= 1 || !pageDeleteTarget) return;
    const committed = commitProject(project) ?? project;
    const removedIndex = committed.pages.findIndex((page) => page.id === pageDeleteTarget.id);
    if (removedIndex >= 0) {
      setLastUndoAction({
        type: 'page',
        page: committed.pages[removedIndex],
        index: removedIndex,
      });
    }
    const remaining = committed.pages.filter((page) => page.id !== pageDeleteTarget.id);
    if (remaining.length === 0) {
      setPageDeleteTarget(null);
      return;
    }
    const nextProject = {
      ...committed,
      pages: remaining,
      updatedAt: new Date().toISOString(),
    };
    setProject(nextProject);
    setActivePageId(remaining[0].id);
    setNodes(remaining[0].nodes);
    setRawEdges(remaining[0].edges);
    setSelectedNodeId(null);
    setPageDeleteTarget(null);
  };

  const handleUndoLastDelete = useCallback(() => {
    if (!lastUndoAction) return;

    if (lastUndoAction.type === 'wire') {
      setRawEdges((prev) =>
        prev.some((edge) => edge.id === lastUndoAction.edge.id)
          ? prev
          : [...prev, lastUndoAction.edge]
      );
      setStatus('Restored deleted wire.');
      setLastUndoAction(null);
      return;
    }

    if (lastUndoAction.type === 'widget') {
      setNodes((prev) =>
        prev.some((node) => node.id === lastUndoAction.node.id)
          ? prev
          : [...prev, lastUndoAction.node]
      );
      setRawEdges((prev) => {
        const existingIds = new Set(prev.map((edge) => edge.id));
        const restored = lastUndoAction.edges.filter((edge) => !existingIds.has(edge.id));
        return restored.length > 0 ? [...prev, ...restored] : prev;
      });
      setSelectedNodeId(lastUndoAction.node.id);
      setStatus('Restored deleted widget.');
      setLastUndoAction(null);
      return;
    }

    if (!project) return;
    const committed = commitProject(project) ?? project;
    if (committed.pages.some((page) => page.id === lastUndoAction.page.id)) {
      setLastUndoAction(null);
      return;
    }
    const insertIndex = Math.max(0, Math.min(lastUndoAction.index, committed.pages.length));
    const restoredPages = [...committed.pages];
    restoredPages.splice(insertIndex, 0, lastUndoAction.page);
    const nextProject = {
      ...committed,
      pages: restoredPages,
      updatedAt: new Date().toISOString(),
    };
    setProject(nextProject);
    setActivePageId(lastUndoAction.page.id);
    setNodes(lastUndoAction.page.nodes);
    setRawEdges(lastUndoAction.page.edges);
    setSelectedNodeId(null);
    setStatus(`Restored deleted page "${lastUndoAction.page.name}".`);
    setLastUndoAction(null);
  }, [commitProject, lastUndoAction, project, setNodes, setRawEdges]);

  const setPageMode = (mode: 'draft' | 'published') => {
    if (!project || !currentPage) return;
    const committed = commitProject(project) ?? project;
    const nextProject = {
      ...committed,
      pages: committed.pages.map((page) =>
        page.id === currentPage.id
          ? { ...page, mode, updatedAt: new Date().toISOString() }
          : page
      ),
      updatedAt: new Date().toISOString(),
    };
    setProject(nextProject);
  };

  const handleCreateDevice = () => {
    if (!newDeviceName.trim()) return;
    const name = newDeviceName.trim();
    setDevices((prev) => [
      ...prev,
      createRegisteredDevice(name, newDeviceType),
    ]);
    setNewDeviceName('');
    setStatus(`Registered device: ${name}`);
  };

  const handleNodeRedExport = () => {
    if (!currentPage) return;
    const page = {
      ...currentPage,
      nodes: nodes.map((node) => stripRuntimeData(node)),
      edges: rawEdges,
    };
    const json = JSON.stringify(toNodeRedJson(page), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${page.name.replace(/\s+/g, '-').toLowerCase()}-nodered.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleNodeRedImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = fromNodeRedJson(parsed);
      setNodes(imported.nodes.map((node) => upsertDeviceForNode(node)));
      setRawEdges(imported.edges);
      setStatus(`Imported Node-RED flow: ${file.name}`);
    } catch (error) {
      console.error('Failed to import Node-RED JSON:', error);
      setStatus('Node-RED import failed.');
    } finally {
      event.target.value = '';
    }
  };

  const normalizedLibraryFilter = libraryFilter.trim().toLowerCase();
  const filteredWidgetOptions = widgetOptions.filter((widget) =>
    `${widget} ${widgetOptionLabel[widget]}`.toLowerCase().includes(normalizedLibraryFilter)
  );
  const filteredDevices = devices.filter((device) => {
    if (!normalizedLibraryFilter) return true;
    const haystack = `${device.name} ${device.id} ${device.type} ${device.driver}`.toLowerCase();
    return haystack.includes(normalizedLibraryFilter);
  });
  const automationDeviceOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; type: WidgetType }> = [];
    const seen = new Set<string>();

    for (const node of nodes) {
      const value = node.data.logicalDeviceId
        ? node.data.logicalDeviceId
        : `node:${node.id}`;
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({
        value,
        label: `${node.data.label} (${node.data.widgetType})`,
        type: node.data.widgetType,
      });
    }

    for (const device of devices) {
      if (seen.has(device.id)) continue;
      seen.add(device.id);
      options.push({
        value: device.id,
        label: `${device.name} (${device.type})`,
        type: device.type,
      });
    }

    return options;
  }, [devices, nodes]);
  const simulationSensors = useMemo(
    () =>
      nodes.filter((node) => node.data.widgetType === 'sensor').map((node) => ({
        id: node.id,
        label: node.data.label,
        value: Number(node.data.config.value ?? node.data.config.dummyValue ?? 0),
        min: Number(node.data.config.min ?? 0),
        max: Number(node.data.config.max ?? 100),
        step: Number(node.data.config.step ?? 1),
        unit: String(node.data.config.unit ?? ''),
        dummyMode: Boolean(node.data.config.dummyMode),
      })),
    [nodes]
  );
  const setSimulationSensorValue = useCallback(
    (nodeId: string, value: number) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...node.data.config,
                    value,
                    dummyValue: value,
                    dummyMode: true,
                    sensorSampleAtMs: Date.now(),
                  },
                },
              }
            : node
        )
      );
      setStatus(`Simulation value updated for sensor ${nodeId}.`);
    },
    [setNodes]
  );

  const buildWarnings = useMemo(() => {
    const warnings: string[] = [];
    const edgeByNode = new Map<string, CanvasEdge[]>();
    for (const edge of rawEdges) {
      const src = edgeByNode.get(edge.source) ?? [];
      src.push(edge);
      edgeByNode.set(edge.source, src);
      const dst = edgeByNode.get(edge.target) ?? [];
      dst.push(edge);
      edgeByNode.set(edge.target, dst);
    }

    for (const node of nodes) {
      const edgesForNode = edgeByNode.get(node.id) ?? [];
      const fluidEdges = edgesForNode.filter((e) => (e.data?.kind ?? 'fluid') === 'fluid');
      const outboundDataEdges = edgesForNode.filter(
        (e) => e.source === node.id && (e.data?.kind ?? 'fluid') === 'data'
      );
      const powerInEdges = edgesForNode.filter(
        (e) => e.target === node.id && e.targetHandle === 'power-in'
      );
      const hasLogical = Boolean(node.data.logicalDeviceId);
      const driverType = String(node.data.control?.driverType ?? 'dummy').trim().toLowerCase();
      const requiresHardwareBinding = driverType !== 'dummy';

      if (
        isExternalFlowWidget(node.data.widgetType) &&
        node.data.widgetType !== 'sensor' &&
        fluidEdges.length === 0
      ) {
        warnings.push(`${node.data.label}: no fluid connection.`);
      }
      if (
        (node.data.widgetType === 'pump' ||
          node.data.widgetType === 'valve' ||
          node.data.widgetType === 'sensor' ||
          node.data.widgetType === 'heater' ||
          node.data.widgetType === 'pid') &&
        !hasLogical
      ) {
        warnings.push(`${node.data.label}: no logical device assigned.`);
      }
      if (
        node.data.widgetType === 'sensor' &&
        node.data.config.dummyMode !== true &&
        !node.data.bindings?.sensor
      ) {
        warnings.push(`${node.data.label}: missing sensor endpoint binding.`);
      }
      if (node.data.widgetType === 'sensor' && !node.data.config.sensorType) {
        warnings.push(`${node.data.label}: missing sensor type.`);
      }
      if (
        (node.data.widgetType === 'pump' ||
          node.data.widgetType === 'valve' ||
          node.data.widgetType === 'heater') &&
        requiresHardwareBinding &&
        !node.data.bindings?.actuator
      ) {
        warnings.push(`${node.data.label}: missing actuator endpoint binding.`);
      }
      if (
        (node.data.widgetType === 'pump' || node.data.widgetType === 'heater' || node.data.widgetType === 'pid') &&
        requiresHardwareBinding &&
        powerInEdges.length === 0
      ) {
        warnings.push(`${node.data.label}: no power input line.`);
      }
      if (
        (node.data.widgetType === 'button' ||
          node.data.widgetType === 'switch' ||
          node.data.widgetType === 'slider') &&
        !node.data.control?.channel &&
        !node.data.control?.endpointId &&
        !node.data.control?.targetDeviceId &&
        outboundDataEdges.length === 0
      ) {
        warnings.push(`${node.data.label}: no control channel or endpoint mapping.`);
      }
      if (
        node.data.widgetType === 'automation' &&
        (!node.data.config.automationSteps || node.data.config.automationSteps.length === 0)
      ) {
        if ((node.data.config.automationMode ?? 'simple') === 'advanced') {
          warnings.push(`${node.data.label}: no automation steps configured.`);
        }
      }
      if (
        node.data.widgetType === 'automation' &&
        (node.data.config.automationMode ?? 'simple') === 'simple'
      ) {
        const rule = node.data.config.simpleAutomation;
        if (!rule?.sourceSensorDeviceId || !rule?.targetDeviceId) {
          warnings.push(`${node.data.label}: simple automation missing source sensor or target device.`);
        }
      }
      if (node.data.widgetType === 'glycol_controller') {
        const glycol = node.data.config.glycolController;
        if (!glycol?.sourceSensorDeviceId) {
          warnings.push(`${node.data.label}: glycol controller missing source sensor.`);
        }
        if (!glycol?.pumpDeviceId && !glycol?.valveDeviceId && !glycol?.chillerDeviceId) {
          warnings.push(`${node.data.label}: glycol controller missing output.`);
        }
      }
      if (node.data.widgetType === 'hlt_controller') {
        const hlt = node.data.config.hltController;
        if (hlt?.enabled !== true) {
          continue;
        }
        if (!hlt.sourceSensorDeviceId) {
          warnings.push(`${node.data.label}: hlt controller missing source sensor.`);
        }
        if (!hlt.heaterDeviceId && !hlt.recircPumpDeviceId) {
          warnings.push(`${node.data.label}: hlt controller missing output.`);
        }
      }
      if (node.data.widgetType === 'co2_controller') {
        const co2 = node.data.config.co2Controller;
        if (co2?.enabled !== true) {
          continue;
        }
        if (!co2.sourceSensorDeviceId) {
          warnings.push(`${node.data.label}: co2 controller missing source sensor.`);
        }
        if (!co2.inletValveDeviceId && !co2.ventValveDeviceId) {
          warnings.push(`${node.data.label}: co2 controller missing output.`);
        }
      }
      if (node.data.widgetType === 'transfer_controller') {
        const transfer = node.data.config.transferController;
        if (transfer?.enabled !== true) {
          continue;
        }
        if (!transfer.pumpDeviceId) {
          warnings.push(`${node.data.label}: transfer controller missing pump.`);
        }
        const sourceCount = transfer.sourceValveDeviceIds?.filter(Boolean).length ?? 0;
        const destinationCount = transfer.destinationValveDeviceIds?.filter(Boolean).length ?? 0;
        if (sourceCount + destinationCount === 0) {
          warnings.push(`${node.data.label}: transfer controller missing valves.`);
        }
      }
      if (node.data.widgetType === 'packaging') {
        const packaging = node.data.config.packagingNode;
        if ((packaging?.lineMode ?? 'manual') === 'metered' && !node.data.bindings?.sensor) {
          warnings.push(`${node.data.label}: metered packaging line missing sensor binding.`);
        }
        if ((packaging?.supportedFormats?.filter(Boolean).length ?? 0) === 0) {
          warnings.push(`${node.data.label}: packaging line missing supported formats.`);
        }
      }
      if (node.data.widgetType === 'recipe_executor') {
        const recipe = node.data.config.recipeExecutor;
        if (recipe?.enabled !== true) {
          continue;
        }
        const stepCount = node.data.config.recipeSteps?.length ?? 0;
        if (stepCount === 0) {
          warnings.push(`${node.data.label}: recipe executor missing recipe steps.`);
        }
        if (stepCount > 0) {
          const hasFallbackTarget = Boolean(node.data.control?.targetDeviceId);
          const hasStepTarget = (node.data.config.recipeSteps ?? []).some((step) => {
            const stepMeta = step as ImportedRecipe['steps'][number] & { targetDeviceId?: string };
            return Boolean(stepMeta.targetDeviceId);
          });
          if (!hasFallbackTarget && !hasStepTarget) {
            warnings.push(`${node.data.label}: recipe executor missing target mapping.`);
          }
        }
      }
    }

    return warnings;
  }, [nodes, rawEdges]);

  const pageViewport: Viewport = currentPage?.viewport ?? { x: 0, y: 0, zoom: 1 };
  const handleConfigureNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);
  const runtimeContextValue = useMemo(
    () => ({
      mode: currentMode,
      onConfigure: handleConfigureNode,
      onControl: runtimeControl,
    }),
    [currentMode, handleConfigureNode, runtimeControl]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <Select value={activePageId} onValueChange={switchPage}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {(project?.pages ?? []).map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.name} ({page.mode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleAddPage}>
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </Button>
          <Button variant="outline" onClick={requestDeletePage}>
            Delete Page
          </Button>

          <Select value={currentMode} onValueChange={(value) => setPageMode(value as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => nodeRedInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import Node-RED
          </Button>
          <Button variant="outline" onClick={handleNodeRedExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Node-RED
          </Button>

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button onClick={() => navigate('/os/recipe-execution')}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Open Recipe Execution
          </Button>

          <span className="ml-auto text-xs text-muted-foreground">{status}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={handleUndoLastDelete}
            disabled={!lastUndoAction}
            title="Restore last delete action"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Undo Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-amber-700"
            onClick={() => setWarningsOpen(true)}
            title="Open build warnings"
          >
            <AlertTriangle className="mr-1 h-3.5 w-3.5" />
            Warnings: {buildWarnings.length}
          </Button>
          <span className="text-xs text-muted-foreground">Nodes: {nodes.length}</span>
        </CardContent>
      </Card>

      <div className="relative min-h-0 flex-1">
        <Card className="h-full">
          <CardContent className="h-full p-0">
            <CanvasRuntimeProvider value={runtimeContextValue}>
              <ReactFlow
                nodes={nodes}
                edges={displayedEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                nodeTypes={nodeTypes}
                onEdgeClick={(event, edge) => {
                  event.preventDefault();
                  if (currentMode !== 'draft') {
                    setStatus('Switch to Draft mode to delete wires.');
                    return;
                  }
                  setWireDeleteTarget(edge as CanvasEdge);
                }}
                onNodeClick={(_, node) => {
                  setSelectedNodeId(node.id);
                  if (currentMode === 'draft') {
                    setWidgetConfigOpen(true);
                  }
                }}
                onNodeDoubleClick={(_, node) => {
                  setSelectedNodeId(node.id);
                  setLibraryOpen(true);
                }}
                onNodeContextMenu={(event, node) => {
                  event.preventDefault();
                  setSelectedNodeId(node.id);
                  setContextMenu({
                    x: event.clientX,
                    y: event.clientY,
                    nodeId: node.id,
                  });
                }}
                onPaneClick={() => {
                  setSelectedNodeId(null);
                  setWidgetConfigOpen(false);
                  setContextMenu(null);
                }}
                fitView
                defaultViewport={pageViewport}
                nodesDraggable={currentMode === 'draft'}
                nodesConnectable={currentMode === 'draft'}
                panOnDrag
                noPanClassName="bf-no-pan"
                elementsSelectable
              >
                <Background gap={16} />
                <MiniMap />
                <Controls />
              </ReactFlow>
            </CanvasRuntimeProvider>
          </CardContent>
        </Card>

        {contextMenu && currentMode === 'draft' && (
          <div
            className="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                setSelectedNodeId(contextMenu.nodeId);
                setWidgetConfigOpen(true);
                setContextMenu(null);
              }}
            >
              Configure
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                duplicateNodeById(contextMenu.nodeId);
                setContextMenu(null);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedNodeId(contextMenu.nodeId);
                deleteSelectedNode();
                setContextMenu(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}

        <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="absolute right-0 top-1/2 z-20 h-14 -translate-y-1/2 rounded-l-md rounded-r-none px-2"
              title="Open Canvas Panel"
            >
              <PanelLeft className="h-4 w-4 rotate-180" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[340px] p-0 sm:w-[420px]">
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle>Canvas Panel</SheetTitle>
              <SheetDescription>
                Widgets, devices, selected widget config, and recipe import in one slideout.
              </SheetDescription>
            </SheetHeader>

            <div className="border-b border-border p-4">
              <Input
                value={libraryFilter}
                onChange={(event) => setLibraryFilter(event.target.value)}
                placeholder="Search widgets or devices"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Current page mode: <span className="font-medium">{currentMode}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                <span className="rounded bg-sky-100 px-1 text-sky-800">Fluid</span>
                <span className="rounded bg-amber-100 px-1 text-amber-800">Data</span>
                <span className="rounded bg-red-100 px-1 text-red-800">Power</span>
                <span className="rounded bg-slate-200 px-1 text-slate-800">Ground</span>
                <span className="text-muted-foreground">Connect OUT -&gt; IN only</span>
              </div>
              <div className="mt-2 space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Fluid Medium</Label>
                <Select value={activeFluidMedium} onValueChange={(value) => setActiveFluidMedium(value as FluidMedium)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="glycol">Glycol</SelectItem>
                    <SelectItem value="co2">CO2</SelectItem>
                    <SelectItem value="cip">CIP</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-13rem)] p-4">
              <div className="space-y-6 pr-3">
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Add Widget
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredWidgetOptions.map((option) => (
                      <Button
                        key={`widget-option-${option}`}
                        variant="outline"
                        className="justify-between border-l-4"
                        style={{ borderLeftColor: widgetAccentColor[option] }}
                        onClick={() => handleAddNode(option)}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: widgetAccentColor[option] }}
                          />
                          {widgetOptionLabel[option]}
                        </span>
                        <span className="text-xs text-muted-foreground">Add</span>
                      </Button>
                    ))}
                    {filteredWidgetOptions.length === 0 && (
                      <p className="text-xs text-muted-foreground">No widgets match this filter.</p>
                    )}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Device Widgets
                  </h3>
                  <div className="space-y-2">
                    {filteredDevices.map((device) => (
                      <button
                        key={device.id}
                        type="button"
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ borderLeftWidth: 4, borderLeftColor: widgetAccentColor[device.type as AddWidgetOption] }}
                        onClick={() => handleAddNode(device.type, device.id)}
                      >
                        <p className="text-sm font-medium text-foreground">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.type} · {device.driver} · {device.id}
                        </p>
                      </button>
                    ))}
                    {filteredDevices.length === 0 && (
                      <p className="text-xs text-muted-foreground">No devices match this filter.</p>
                    )}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Simulation Panel
                  </h3>
                  <div className="space-y-2 rounded-md border border-border p-3">
                    {simulationSensors.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Add sensor widgets to simulate values.</p>
                    ) : (
                      simulationSensors.map((sensor) => (
                        <div key={`sim-${sensor.id}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{sensor.label}</p>
                            <span className="text-[11px] text-muted-foreground">
                              {sensor.value}
                              {sensor.unit ? ` ${sensor.unit}` : ''}
                              {sensor.dummyMode ? ' (dummy)' : ''}
                            </span>
                          </div>
                          <input
                            className="w-full"
                            type="range"
                            min={sensor.min}
                            max={sensor.max}
                            step={sensor.step}
                            value={sensor.value}
                            onChange={(event) => setSimulationSensorValue(sensor.id, Number(event.target.value))}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Register Device
                  </h3>
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <Input
                      value={newDeviceName}
                      onChange={(event) => setNewDeviceName(event.target.value)}
                      placeholder="Brew Pump A"
                    />
                    <Select
                      value={newDeviceType}
                      onValueChange={(value) => setNewDeviceType(value as WidgetType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Device type" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypeOptions.map((type) => (
                          <SelectItem key={`library-device-type-${type}`} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="w-full" variant="outline" onClick={handleCreateDevice}>
                      Add Device
                    </Button>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    CO2 Alarm Events
                  </h3>
                  <div className="space-y-2 rounded-md border border-border p-3">
                    {co2AlarmEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No CO2 alarm events yet.</p>
                    ) : (
                      co2AlarmEvents.slice(0, 8).map((event) => (
                        <div
                          key={event.id}
                          className={`rounded border p-2 text-xs ${
                            event.severity === 'critical'
                              ? 'border-red-300 bg-red-50 text-red-900'
                              : event.severity === 'warning'
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-slate-50 text-slate-900'
                          }`}
                        >
                          <p className="font-medium">{event.controllerLabel}</p>
                          <p>{event.message}</p>
                          <p className="mt-1 text-[10px] opacity-80">
                            {new Date(event.at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Widget Config
                  </h3>
                  {selectedNode ? (
                    <div className="space-y-3 rounded-md border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Double-click a widget to open this config.
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={deleteSelectedNode}
                          disabled={currentMode !== 'draft'}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="widget-label">Label</Label>
                        <Input
                          id="widget-label"
                          value={selectedNode.data.label}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              label: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Logical Device</Label>
                        <Select
                          value={selectedNode.data.logicalDeviceId ?? '__none'}
                          onValueChange={(value) =>
                            updateSelectedNode({
                              logicalDeviceId: value === '__none' ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger disabled={currentMode !== 'draft'}>
                            <SelectValue placeholder="Select device" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Unbound</SelectItem>
                            {devices.map((device) => (
                              <SelectItem key={device.id} value={device.id}>
                                {device.name} ({device.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="binding-sensor">Sensor Binding</Label>
                        <Input
                          id="binding-sensor"
                          value={selectedNode.data.bindings?.sensor ?? ''}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              bindings: {
                                ...(selectedNode.data.bindings ?? {}),
                                sensor: event.target.value || undefined,
                              },
                            })
                          }
                          placeholder="Endpoint ID"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="binding-actuator">Actuator Binding</Label>
                        <Input
                          id="binding-actuator"
                          value={selectedNode.data.bindings?.actuator ?? ''}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              bindings: {
                                ...(selectedNode.data.bindings ?? {}),
                                actuator: event.target.value || undefined,
                              },
                            })
                          }
                          placeholder="Endpoint ID"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="binding-feedback">Feedback Binding</Label>
                        <Input
                          id="binding-feedback"
                          value={selectedNode.data.bindings?.feedback ?? ''}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              bindings: {
                                ...(selectedNode.data.bindings ?? {}),
                                feedback: event.target.value || undefined,
                              },
                            })
                          }
                          placeholder="Endpoint ID"
                        />
                      </div>

                      {selectedNode.data.widgetType === 'vessel' && (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor="cfg-capacity">Capacity (L)</Label>
                            <Input
                              id="cfg-capacity"
                              type="number"
                              value={String(selectedNode.data.config.capacity ?? '')}
                              disabled={currentMode !== 'draft'}
                              onChange={(event) =>
                                updateSelectedNode({
                                  config: {
                                    ...selectedNode.data.config,
                                    capacity: parseMaybeNumber(event.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="cfg-level">Current Level (L)</Label>
                            <Input
                              id="cfg-level"
                              type="number"
                              value={String(selectedNode.data.config.currentLevel ?? '')}
                              disabled={currentMode !== 'draft'}
                              onChange={(event) =>
                                updateSelectedNode({
                                  config: {
                                    ...selectedNode.data.config,
                                    currentLevel: parseMaybeNumber(event.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                        </>
                      )}

                      {selectedNode.data.widgetType === 'sensor' && (
                        <div className="space-y-1">
                          <Label htmlFor="cfg-sensor-value">Display Value</Label>
                          <Input
                            id="cfg-sensor-value"
                            value={String(selectedNode.data.config.value ?? '')}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  value: parseMaybeNumber(event.target.value) ?? event.target.value,
                                  sensorSampleAtMs: Date.now(),
                                },
                              })
                            }
                          />
                        </div>
                      )}

                      {selectedNode.data.widgetType === 'heater' && (
                        <div className="space-y-1">
                          <Label htmlFor="cfg-setpoint">Setpoint (C)</Label>
                          <Input
                            id="cfg-setpoint"
                            type="number"
                            value={String(selectedNode.data.config.setpoint ?? '')}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  setpoint: parseMaybeNumber(event.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      )}

                      {selectedNode.data.widgetType === 'pid' && (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor="cfg-pid-setpoint">Target Setpoint</Label>
                            <Input
                              id="cfg-pid-setpoint"
                              type="number"
                              value={String(selectedNode.data.config.setpoint ?? '')}
                              disabled={currentMode !== 'draft'}
                              onChange={(event) =>
                                updateSelectedNode({
                                  config: {
                                    ...selectedNode.data.config,
                                    setpoint: parseMaybeNumber(event.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            In automation mode, recipes can require confirmation per step.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a widget on canvas to configure it.
                    </p>
                  )}
                </section>

                <section className="space-y-2 text-xs text-muted-foreground">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recipe Execution
                  </h3>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/os/recipe-execution')}
                  >
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Open Recipe Execution
                  </Button>
                  <p>Recipe import and run controls are handled on the dedicated execution page.</p>
                  <div className="rounded border border-border p-2">
                    <p className="font-medium text-foreground">
                      Imported recipes available: {importedRecipes.length}
                    </p>
                    {selectedImportedRecipe ? (
                      <p>Latest: {selectedImportedRecipe.name}</p>
                    ) : (
                      <p>No imported recipes available yet.</p>
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={widgetConfigOpen} onOpenChange={setWidgetConfigOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Widget Config</DialogTitle>
            <DialogDescription>
              Edit-mode popup for selected widget.
            </DialogDescription>
          </DialogHeader>
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{selectedNode.data.widgetType}</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteSelectedNode();
                    setWidgetConfigOpen(false);
                  }}
                  disabled={currentMode !== 'draft'}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>

              <div className="space-y-1">
                <Label htmlFor="popup-widget-label">Label</Label>
                <Input
                  id="popup-widget-label"
                  value={selectedNode.data.label}
                  disabled={currentMode !== 'draft'}
                  onChange={(event) =>
                    updateSelectedNode({
                      label: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Logical Device</Label>
                <Select
                  value={selectedNode.data.logicalDeviceId ?? '__none'}
                  onValueChange={(value) =>
                    updateSelectedNode({
                      logicalDeviceId: value === '__none' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger disabled={currentMode !== 'draft'}>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Unbound</SelectItem>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} ({device.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Control Mapping</p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label>Target Device</Label>
                    <Select
                      value={selectedNode.data.control?.targetDeviceId ?? '__none'}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          control: {
                            ...(selectedNode.data.control ?? {}),
                            targetDeviceId: value === '__none' ? undefined : value,
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue placeholder="Select target device" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {devices.map((device) => (
                          <SelectItem key={`ctrl-dev-${device.id}`} value={device.id}>
                            {device.name} ({device.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Command</Label>
                    <Select
                      value={selectedNode.data.control?.command ?? 'trigger'}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          control: {
                            ...(selectedNode.data.control ?? {}),
                            command: value as any,
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trigger">Trigger</SelectItem>
                        <SelectItem value="on_off">On/Off</SelectItem>
                        <SelectItem value="open_close">Open/Close</SelectItem>
                        <SelectItem value="route">Route A/B</SelectItem>
                        <SelectItem value="set_value">Set Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Driver</Label>
                    <Select
                      value={selectedNode.data.control?.driverType ?? 'dummy'}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          control: {
                            ...(selectedNode.data.control ?? {}),
                            driverType: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dummy">dummy</SelectItem>
                        <SelectItem value="usb_relay">usb_relay</SelectItem>
                        <SelectItem value="gpio">gpio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>I/O Channel Browser</Label>
                    <Select
                      value={String(selectedNode.data.control?.endpointId ?? '__none')}
                      onValueChange={(value) => {
                        const selectedEndpoint =
                          value === '__none'
                            ? null
                            : writableControlEndpoints.find((endpoint) => String(endpoint.id) === value) ?? null;
                        updateSelectedNode({
                          control: {
                            ...(selectedNode.data.control ?? {}),
                            endpointId: selectedEndpoint?.id,
                            channel: selectedEndpoint?.channelId ?? selectedNode.data.control?.channel,
                          },
                        });
                      }}
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue placeholder="Select discovered endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Manual channel only</SelectItem>
                        {writableControlEndpoints.map((endpoint) => (
                          <SelectItem key={`ctrl-ep-${endpoint.id}`} value={String(endpoint.id)}>
                            #{endpoint.id} · {endpoint.channelId} · {endpoint.endpointKind} · {endpoint.direction}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Pick a discovered endpoint or use manual channel/endpoint fields below.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-control-channel">Driver Channel</Label>
                    <Input
                      id="popup-control-channel"
                      value={selectedNode.data.control?.channel ?? ''}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          control: {
                            ...(selectedNode.data.control ?? {}),
                            channel: event.target.value || undefined,
                          },
                        })
                      }
                      placeholder="usb:3 or gpio:17"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-control-endpoint">Endpoint Override (optional)</Label>
                    <Input
                      id="popup-control-endpoint"
                      type="number"
                      value={String(selectedNode.data.control?.endpointId ?? '')}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          control: {
                            ...(selectedNode.data.control ?? {}),
                            endpointId: parseMaybeNumber(event.target.value),
                          },
                        })
                      }
                      placeholder="Endpoint ID"
                    />
                  </div>
                </div>
              </div>
              {(selectedNode.data.widgetType === 'sensor' ||
                selectedNode.data.widgetType === 'display' ||
                selectedNode.data.widgetType === 'vessel' ||
                selectedNode.data.widgetType === 'packaging') && (
                <div className="space-y-1">
                  <Label htmlFor="popup-binding-sensor">Sensor Binding</Label>
                  <Input
                    id="popup-binding-sensor"
                    value={selectedNode.data.bindings?.sensor ?? ''}
                    disabled={currentMode !== 'draft'}
                    onChange={(event) =>
                      updateSelectedNode({
                        bindings: {
                          ...(selectedNode.data.bindings ?? {}),
                          sensor: event.target.value || undefined,
                        },
                      })
                    }
                    placeholder="Endpoint ID"
                  />
                </div>
              )}

              {(selectedNode.data.widgetType === 'pump' ||
                selectedNode.data.widgetType === 'valve' ||
                selectedNode.data.widgetType === 'heater' ||
                selectedNode.data.widgetType === 'button' ||
                selectedNode.data.widgetType === 'pid') && (
                <div className="space-y-1">
                  <Label htmlFor="popup-binding-actuator">Actuator Binding</Label>
                  <Input
                    id="popup-binding-actuator"
                    value={selectedNode.data.bindings?.actuator ?? ''}
                    disabled={currentMode !== 'draft'}
                    onChange={(event) =>
                      updateSelectedNode({
                        bindings: {
                          ...(selectedNode.data.bindings ?? {}),
                          actuator: event.target.value || undefined,
                        },
                      })
                    }
                    placeholder="Endpoint ID"
                  />
                </div>
              )}

              {(selectedNode.data.widgetType === 'pump' ||
                selectedNode.data.widgetType === 'valve' ||
                selectedNode.data.widgetType === 'heater' ||
                selectedNode.data.widgetType === 'pid') && (
                <div className="space-y-1">
                  <Label htmlFor="popup-binding-feedback">Feedback Binding</Label>
                  <Input
                    id="popup-binding-feedback"
                    value={selectedNode.data.bindings?.feedback ?? ''}
                    disabled={currentMode !== 'draft'}
                    onChange={(event) =>
                      updateSelectedNode({
                        bindings: {
                          ...(selectedNode.data.bindings ?? {}),
                          feedback: event.target.value || undefined,
                        },
                      })
                    }
                    placeholder="Endpoint ID"
                  />
                </div>
              )}

              {selectedNode.data.widgetType === 'vessel' && (
                <>
                  <div className="space-y-1">
                    <Label>Vessel Type</Label>
                    <Select
                      value={String(selectedNode.data.config.vesselType ?? 'fermentor_conical')}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            vesselType: value as any,
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fermentor_conical">Fermentor (Conical)</SelectItem>
                        <SelectItem value="bright_tank">Bright Tank</SelectItem>
                        <SelectItem value="mash_tun">Mash Tun</SelectItem>
                        <SelectItem value="hlt">Hot Liquor Tank</SelectItem>
                        <SelectItem value="brew_kettle">Brew Kettle</SelectItem>
                        <SelectItem value="generic">Generic Vessel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-cfg-capacity">Capacity (L)</Label>
                    <Input
                      id="popup-cfg-capacity"
                      type="number"
                      value={String(selectedNode.data.config.capacity ?? '')}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            capacity: parseMaybeNumber(event.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-cfg-level">Current Level (L)</Label>
                    <Input
                      id="popup-cfg-level"
                      type="number"
                      value={String(selectedNode.data.config.currentLevel ?? '')}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            currentLevel: parseMaybeNumber(event.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedNode.data.widgetType === 'packaging' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Packaging node is the logical package destination on canvas. Use it for keg, can,
                    and bottle lines while ledger pages track the actual lots and counts.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Line Type</Label>
                      <Select
                        value={selectedNode.data.config.packagingNode?.lineKind ?? 'keg_line'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              packagingNode: {
                                ...selectedNode.data.config.packagingNode,
                                lineKind: value as 'keg_line' | 'canning_line' | 'bottling_line' | 'mixed',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keg_line">Keg Line</SelectItem>
                          <SelectItem value="canning_line">Canning Line</SelectItem>
                          <SelectItem value="bottling_line">Bottling Line</SelectItem>
                          <SelectItem value="mixed">Mixed Packaging</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Package Type</Label>
                      <Select
                        value={selectedNode.data.config.packagingNode?.packageType ?? 'keg'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              packagingNode: {
                                ...selectedNode.data.config.packagingNode,
                                packageType: value as 'keg' | 'can' | 'bottle' | 'case' | 'pallet' | 'custom',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keg">Keg</SelectItem>
                          <SelectItem value="can">Can</SelectItem>
                          <SelectItem value="bottle">Bottle</SelectItem>
                          <SelectItem value="case">Case</SelectItem>
                          <SelectItem value="pallet">Pallet</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Line Mode</Label>
                      <Select
                        value={selectedNode.data.config.packagingNode?.lineMode ?? 'manual'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              packagingNode: {
                                ...selectedNode.data.config.packagingNode,
                                lineMode: value as 'manual' | 'metered',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="metered">Metered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Beverage Class</Label>
                      <Select
                        value={selectedNode.data.config.packagingNode?.beverageClass ?? 'cider'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              packagingNode: {
                                ...selectedNode.data.config.packagingNode,
                                beverageClass: value as 'cider' | 'wine' | 'beer' | 'other',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cider">Cider</SelectItem>
                          <SelectItem value="wine">Wine</SelectItem>
                          <SelectItem value="beer">Beer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="popup-packaging-fill-size">Default Fill Size</Label>
                      <Input
                        id="popup-packaging-fill-size"
                        value={selectedNode.data.config.packagingNode?.defaultFillSize ?? ''}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              packagingNode: {
                                ...selectedNode.data.config.packagingNode,
                                defaultFillSize: event.target.value,
                              },
                            },
                          })
                        }
                        placeholder="12 oz, 750 mL, 1/2 bbl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-packaging-throughput">Throughput (units/min)</Label>
                      <Input
                        id="popup-packaging-throughput"
                        type="number"
                        value={String(selectedNode.data.config.packagingNode?.throughputPerMin ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              packagingNode: {
                                ...selectedNode.data.config.packagingNode,
                                throughputPerMin: parseMaybeNumber(event.target.value),
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-packaging-formats">Supported Formats</Label>
                    <Input
                      id="popup-packaging-formats"
                      value={(selectedNode.data.config.packagingNode?.supportedFormats ?? []).join(', ')}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            packagingNode: {
                              ...selectedNode.data.config.packagingNode,
                              supportedFormats: parseCommaSeparatedValues(event.target.value),
                            },
                          },
                        })
                      }
                      placeholder="1/2 bbl, 1/6 bbl, 12 oz, 16 oz"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-packaging-sku-family">Default SKU Family / Prefix</Label>
                    <Input
                      id="popup-packaging-sku-family"
                      value={selectedNode.data.config.packagingNode?.defaultSkuFamily ?? ''}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            packagingNode: {
                              ...selectedNode.data.config.packagingNode,
                              defaultSkuFamily: event.target.value,
                            },
                          },
                        })
                      }
                      placeholder="CIDER-DRY or WINE-ROSE"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Use sensor binding above for metered lines. Packaging counts and compliance stay
                    in OS packaging runs and inventory ledger.
                  </p>
                </div>
              )}

              {selectedNode.data.widgetType === 'pump' && (
                <div className="space-y-1">
                  <Label htmlFor="popup-cfg-flow-rate">Nominal Flow Rate (L/min)</Label>
                  <Input
                    id="popup-cfg-flow-rate"
                    type="number"
                    value={String(selectedNode.data.config.flowRate ?? '')}
                    disabled={currentMode !== 'draft'}
                    onChange={(event) =>
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          flowRate: parseMaybeNumber(event.target.value),
                        },
                      })
                    }
                  />
                </div>
              )}

              {selectedNode.data.widgetType === 'valve' && (
                <>
                  <div className="space-y-1">
                    <Label>Valve Type</Label>
                    <Select
                      value={String(selectedNode.data.config.valveType ?? '2way')}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            valveType: value as '2way' | '3way',
                            position: value === '3way' ? 'c_to_a' : 'closed',
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2way">2-way</SelectItem>
                        <SelectItem value="3way">3-way</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Default Position</Label>
                    <Select
                      value={String(
                        selectedNode.data.config.position ??
                          (selectedNode.data.config.valveType === '3way'
                            ? 'c_to_a'
                            : 'closed')
                      )}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            position: value as any,
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedNode.data.config.valveType === '3way' ? (
                          <>
                            <SelectItem value="c_to_a">C to A</SelectItem>
                            <SelectItem value="c_to_b">C to B</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedNode.data.widgetType === 'sensor' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Sensor Type</Label>
                      <Select
                        value={selectedNode.data.config.sensorType ?? 'temperature'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              sensorType: value as SensorType,
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sensorTypeOptions.map((option) => (
                            <SelectItem key={`sensor-type-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-sensor-unit">Unit</Label>
                      <Input
                        id="popup-cfg-sensor-unit"
                        value={String(selectedNode.data.config.unit ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              unit: event.target.value,
                            },
                          })
                        }
                        placeholder="F, C, SG, PSI, %"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-sensor-min">Min</Label>
                      <Input
                        id="popup-cfg-sensor-min"
                        type="number"
                        value={String(selectedNode.data.config.min ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              min: parseMaybeNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-sensor-max">Max</Label>
                      <Input
                        id="popup-cfg-sensor-max"
                        type="number"
                        value={String(selectedNode.data.config.max ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              max: parseMaybeNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-sensor-step">Step</Label>
                      <Input
                        id="popup-cfg-sensor-step"
                        type="number"
                        value={String(selectedNode.data.config.step ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              step: parseMaybeNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popup-cfg-sensor-value">Sensor Value (live or dummy)</Label>
                    <Input
                      id="popup-cfg-sensor-value"
                      type="number"
                      value={String(selectedNode.data.config.value ?? selectedNode.data.config.dummyValue ?? '')}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) => {
                        const next = parseMaybeNumber(event.target.value) ?? 0;
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            value: next,
                            dummyValue: next,
                            sensorSampleAtMs: Date.now(),
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.widgetType === 'slider' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Setpoint Type</Label>
                      <Select
                        value={selectedNode.data.config.setpointType ?? 'temperature'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              setpointType: value as SensorType,
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sensorTypeOptions.map((option) => (
                            <SelectItem key={`setpoint-type-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-slider-unit">Unit</Label>
                      <Input
                        id="popup-cfg-slider-unit"
                        value={String(selectedNode.data.config.unit ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              unit: event.target.value,
                            },
                          })
                        }
                        placeholder="F, C, SG, PSI, %"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-slider-min">Min</Label>
                      <Input
                        id="popup-cfg-slider-min"
                        type="number"
                        value={String(selectedNode.data.config.min ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              min: parseMaybeNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-slider-max">Max</Label>
                      <Input
                        id="popup-cfg-slider-max"
                        type="number"
                        value={String(selectedNode.data.config.max ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              max: parseMaybeNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="popup-cfg-slider-step">Step</Label>
                      <Input
                        id="popup-cfg-slider-step"
                        type="number"
                        value={String(selectedNode.data.config.step ?? '')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              step: parseMaybeNumber(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.widgetType === 'glycol_controller' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Thermostat-style glycol control. Uses sensor + setpoint to drive pump/valve/chiller outputs.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Controller</Label>
                      <Select
                        value={selectedNode.data.config.hltController?.enabled ? 'enabled' : 'disabled'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                enabled: value === 'enabled',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="enabled">Enabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Unit</Label>
                      <Input
                        value={String(selectedNode.data.config.unit ?? 'F')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              unit: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Compare To</Label>
                      <Select
                        value={selectedNode.data.config.glycolController?.compareTo ?? 'threshold'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                compareTo: value as 'threshold' | 'setpoint_device',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="threshold">Local Target</SelectItem>
                          <SelectItem value="setpoint_device">Setpoint Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Min</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.min ?? 32)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              min: parseMaybeNumber(event.target.value) ?? 32,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Max</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.max ?? 80)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              max: parseMaybeNumber(event.target.value) ?? 80,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Step</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.step ?? 0.5)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              step: parseMaybeNumber(event.target.value) ?? 0.5,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {(selectedNode.data.config.glycolController?.compareTo ?? 'threshold') === 'threshold' ? (
                    <div className="space-y-1">
                      <Label>Target Setpoint</Label>
                      <Input
                        type="number"
                        value={String(
                          selectedNode.data.config.setpoint ??
                            selectedNode.data.config.glycolController?.threshold ??
                            65
                        )}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) => {
                          const next = parseMaybeNumber(event.target.value) ?? 65;
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              setpoint: next,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                threshold: next,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label>Setpoint Device (slider/sensor)</Label>
                      <Select
                        value={selectedNode.data.config.glycolController?.setpointDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                setpointDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select setpoint device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'slider' || device.type === 'sensor')
                            .map((device) => (
                              <SelectItem key={`glycol-setpoint-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Source Sensor</Label>
                      <Select
                        value={selectedNode.data.config.glycolController?.sourceSensorDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                sourceSensorDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select source sensor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'sensor')
                            .map((device) => (
                              <SelectItem key={`glycol-source-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Hysteresis</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.glycolController?.hysteresis ?? 1)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                hysteresis: parseMaybeNumber(event.target.value) ?? 1,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Poll Interval (ms)</Label>
                    <Input
                      type="number"
                      value={String(selectedNode.data.config.glycolController?.pollMs ?? 1000)}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            glycolController: {
                              ...(selectedNode.data.config.glycolController ?? {}),
                              pollMs: parseMaybeNumber(event.target.value) ?? 1000,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <Label>Pump Output</Label>
                      <Select
                        value={selectedNode.data.config.glycolController?.pumpDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                pumpDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select pump target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'pump')
                            .map((device) => (
                              <SelectItem key={`glycol-pump-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Valve Output</Label>
                      <Select
                        value={selectedNode.data.config.glycolController?.valveDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                valveDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select valve target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'valve')
                            .map((device) => (
                              <SelectItem key={`glycol-valve-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Chiller Output</Label>
                      <Select
                        value={selectedNode.data.config.glycolController?.chillerDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              glycolController: {
                                ...(selectedNode.data.config.glycolController ?? {}),
                                chillerDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select chiller target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'pump' || device.type === 'heater')
                            .map((device) => (
                              <SelectItem key={`glycol-chiller-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.widgetType === 'hlt_controller' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Thermostat-style HLT heat control. Uses source temperature to drive heater and recirc pump.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Unit</Label>
                      <Input
                        value={String(selectedNode.data.config.unit ?? 'F')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              unit: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Compare To</Label>
                      <Select
                        value={selectedNode.data.config.hltController?.compareTo ?? 'threshold'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                compareTo: value as 'threshold' | 'setpoint_device',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="threshold">Local Target</SelectItem>
                          <SelectItem value="setpoint_device">Setpoint Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Min</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.min ?? 50)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              min: parseMaybeNumber(event.target.value) ?? 50,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Max</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.max ?? 180)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              max: parseMaybeNumber(event.target.value) ?? 180,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Step</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.step ?? 0.5)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              step: parseMaybeNumber(event.target.value) ?? 0.5,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {(selectedNode.data.config.hltController?.compareTo ?? 'threshold') === 'threshold' ? (
                    <div className="space-y-1">
                      <Label>Target Setpoint</Label>
                      <Input
                        type="number"
                        value={String(
                          selectedNode.data.config.setpoint ??
                            selectedNode.data.config.hltController?.threshold ??
                            152
                        )}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) => {
                          const next = parseMaybeNumber(event.target.value) ?? 152;
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              setpoint: next,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                threshold: next,
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label>Setpoint Device (slider/sensor)</Label>
                      <Select
                        value={selectedNode.data.config.hltController?.setpointDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                setpointDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select setpoint device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'slider' || device.type === 'sensor')
                            .map((device) => (
                              <SelectItem key={`hlt-setpoint-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Source Sensor</Label>
                      <Select
                        value={selectedNode.data.config.hltController?.sourceSensorDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                sourceSensorDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select source sensor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'sensor')
                            .map((device) => (
                              <SelectItem key={`hlt-source-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Hysteresis</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.hltController?.hysteresis ?? 1)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                hysteresis: parseMaybeNumber(event.target.value) ?? 1,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Poll Interval (ms)</Label>
                    <Input
                      type="number"
                      value={String(selectedNode.data.config.hltController?.pollMs ?? 1000)}
                      disabled={currentMode !== 'draft'}
                      onChange={(event) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            hltController: {
                              ...(selectedNode.data.config.hltController ?? {}),
                              pollMs: parseMaybeNumber(event.target.value) ?? 1000,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <Label>Heater Output</Label>
                      <Select
                        value={selectedNode.data.config.hltController?.heaterDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                heaterDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select heater target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'heater')
                            .map((device) => (
                              <SelectItem key={`hlt-heater-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Recirc Pump Output</Label>
                      <Select
                        value={selectedNode.data.config.hltController?.recircPumpDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              hltController: {
                                ...(selectedNode.data.config.hltController ?? {}),
                                recircPumpDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select recirc pump target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'pump')
                            .map((device) => (
                              <SelectItem key={`hlt-pump-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.widgetType === 'co2_controller' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    CO2 pressure control with beverage style presets and optional vent control.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Controller</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.enabled ? 'enabled' : 'disabled'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                enabled: value === 'enabled',
                                runtimeState: value === 'enabled' ? 'idle' : 'disabled',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="enabled">Enabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Style</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.beverageStyle ?? 'beer'}
                        onValueChange={(value) => {
                          const style = value as 'beer' | 'cider' | 'champagne' | 'wine' | 'seltzer' | 'custom';
                          const preset = co2StylePresets[style];
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              setpoint: preset.targetPsi,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                beverageStyle: style,
                                threshold: preset.targetPsi,
                                targetVolumes: preset.targetVolumes,
                                hysteresis: preset.hysteresis,
                                maxPressurePsi: preset.maxPressurePsi,
                              },
                            },
                          });
                        }}
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beer">Beer</SelectItem>
                          <SelectItem value="cider">Cider</SelectItem>
                          <SelectItem value="champagne">Champagne</SelectItem>
                          <SelectItem value="wine">Wine</SelectItem>
                          <SelectItem value="seltzer">Seltzer</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Unit</Label>
                      <Input
                        value={String(selectedNode.data.config.unit ?? 'PSI')}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              unit: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Compare To</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.compareTo ?? 'threshold'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                compareTo: value as 'threshold' | 'setpoint_device',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="threshold">Local Target</SelectItem>
                          <SelectItem value="setpoint_device">Setpoint Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Target Mode</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.targetMode ?? 'psi'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                targetMode: value as 'psi' | 'volumes',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="psi">PSI</SelectItem>
                          <SelectItem value="volumes">CO2 Volumes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Source Sensor</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.sourceSensorDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                sourceSensorDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select pressure sensor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'sensor')
                            .map((device) => (
                              <SelectItem key={`co2-source-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(selectedNode.data.config.co2Controller?.compareTo ?? 'threshold') === 'threshold' ? (
                    (selectedNode.data.config.co2Controller?.targetMode ?? 'psi') === 'volumes' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>Target Volumes</Label>
                            <Input
                              type="number"
                              value={String(selectedNode.data.config.co2Controller?.targetVolumes ?? 2.4)}
                              disabled={currentMode !== 'draft'}
                              onChange={(event) => {
                                const next = parseMaybeNumber(event.target.value) ?? 2.4;
                                updateSelectedNode({
                                  config: {
                                    ...selectedNode.data.config,
                                    co2Controller: {
                                      ...(selectedNode.data.config.co2Controller ?? {}),
                                      targetVolumes: next,
                                    },
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Beverage Temp (F)</Label>
                            <Input
                              type="number"
                              value={String(selectedNode.data.config.co2Controller?.beverageTempF ?? 38)}
                              disabled={currentMode !== 'draft'}
                              onChange={(event) => {
                                const next = parseMaybeNumber(event.target.value) ?? 38;
                                updateSelectedNode({
                                  config: {
                                    ...selectedNode.data.config,
                                    co2Controller: {
                                      ...(selectedNode.data.config.co2Controller ?? {}),
                                      beverageTempF: next,
                                    },
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Beverage Temp Sensor (optional)</Label>
                          <Select
                            value={selectedNode.data.config.co2Controller?.beverageTempSensorDeviceId ?? '__none'}
                            onValueChange={(value) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  co2Controller: {
                                    ...(selectedNode.data.config.co2Controller ?? {}),
                                    beverageTempSensorDeviceId: value === '__none' ? undefined : value,
                                  },
                                },
                              })
                            }
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue placeholder="Select temp sensor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {automationDeviceOptions
                                .filter((device) => device.type === 'sensor')
                                .map((device) => (
                                  <SelectItem key={`co2-temp-src-${device.value}`} value={device.value}>
                                    {device.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label>Target Pressure</Label>
                        <Input
                          type="number"
                          value={String(
                            selectedNode.data.config.setpoint ??
                              selectedNode.data.config.co2Controller?.threshold ??
                              12
                          )}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) => {
                            const next = parseMaybeNumber(event.target.value) ?? 12;
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                setpoint: next,
                                co2Controller: {
                                  ...(selectedNode.data.config.co2Controller ?? {}),
                                  threshold: next,
                                },
                              },
                            });
                          }}
                        />
                      </div>
                    )
                  ) : (
                    <div className="space-y-1">
                      <Label>Setpoint Device (slider/sensor)</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.setpointDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                setpointDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select setpoint device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'slider' || device.type === 'sensor')
                            .map((device) => (
                              <SelectItem key={`co2-setpoint-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Hysteresis</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.co2Controller?.hysteresis ?? 0.5)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                hysteresis: parseMaybeNumber(event.target.value) ?? 0.5,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Max Pressure</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.co2Controller?.maxPressurePsi ?? 25)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                maxPressurePsi: parseMaybeNumber(event.target.value) ?? 25,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Poll Interval (ms)</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.co2Controller?.pollMs ?? 1000)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                pollMs: parseMaybeNumber(event.target.value) ?? 1000,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Sensor Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.co2Controller?.sampleTimeoutMs ?? 0)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                sampleTimeoutMs: parseMaybeNumber(event.target.value) ?? 0,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Max Rise (PSI/min)</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.co2Controller?.maxPressureRisePsiPerMin ?? 0)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                maxPressureRisePsiPerMin:
                                  parseMaybeNumber(event.target.value) ?? 0,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Set timeout/rise to 0 to disable those safety filters.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Alarm Output Device</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.alarmOutputDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                alarmOutputDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select alarm output" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter(
                              (device) =>
                                device.type !== 'sensor' &&
                                device.type !== 'vessel' &&
                                device.type !== 'display' &&
                                device.type !== 'note' &&
                                device.type !== 'automation'
                            )
                            .map((device) => (
                              <SelectItem key={`co2-alarm-output-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Emit Alarm Events</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.emitAlarmEvents === false ? 'off' : 'on'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                emitAlarmEvents: value === 'on',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on">On</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded border border-border/70 p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Purge</Label>
                        <Select
                          value={selectedNode.data.config.co2Controller?.purgeActive ? 'on' : 'off'}
                          onValueChange={(value) =>
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                co2Controller: {
                                  ...(selectedNode.data.config.co2Controller ?? {}),
                                  purgeActive: value === 'on',
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger disabled={currentMode !== 'draft'}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            <SelectItem value="on">On</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Purge Cycles</Label>
                        <Input
                          type="number"
                          value={String(selectedNode.data.config.co2Controller?.purgeCycles ?? 3)}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                co2Controller: {
                                  ...(selectedNode.data.config.co2Controller ?? {}),
                                  purgeCycles: parseMaybeNumber(event.target.value) ?? 3,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Inject (ms)</Label>
                        <Input
                          type="number"
                          value={String(selectedNode.data.config.co2Controller?.purgeInjectMs ?? 4000)}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                co2Controller: {
                                  ...(selectedNode.data.config.co2Controller ?? {}),
                                  purgeInjectMs: parseMaybeNumber(event.target.value) ?? 4000,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Vent (ms)</Label>
                        <Input
                          type="number"
                          value={String(selectedNode.data.config.co2Controller?.purgeVentMs ?? 2000)}
                          disabled={currentMode !== 'draft'}
                          onChange={(event) =>
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                co2Controller: {
                                  ...(selectedNode.data.config.co2Controller ?? {}),
                                  purgeVentMs: parseMaybeNumber(event.target.value) ?? 2000,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Inlet Valve</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.inletValveDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                inletValveDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select inlet valve" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'valve')
                            .map((device) => (
                              <SelectItem key={`co2-inlet-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Vent Valve</Label>
                      <Select
                        value={selectedNode.data.config.co2Controller?.ventValveDeviceId ?? '__none'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              co2Controller: {
                                ...(selectedNode.data.config.co2Controller ?? {}),
                                ventValveDeviceId: value === '__none' ? undefined : value,
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue placeholder="Select vent valve" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {automationDeviceOptions
                            .filter((device) => device.type === 'valve')
                            .map((device) => (
                              <SelectItem key={`co2-vent-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.widgetType === 'transfer_controller' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Transfer route control for multi-valve paths with FSD or VSD pump support.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Controller</Label>
                      <Select
                        value={selectedNode.data.config.transferController?.enabled ? 'enabled' : 'disabled'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              transferController: {
                                ...(selectedNode.data.config.transferController ?? {}),
                                enabled: value === 'enabled',
                                runtimeState: value === 'enabled' ? 'idle' : 'disabled',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="enabled">Enabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Auto-map Wiring</Label>
                      <Select
                        value={selectedNode.data.config.transferController?.autoMapWiring === false ? 'off' : 'on'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              transferController: {
                                ...(selectedNode.data.config.transferController ?? {}),
                                autoMapWiring: value === 'on',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on">On</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Pump Mode</Label>
                      <Select
                        value={selectedNode.data.config.transferController?.pumpMode ?? 'fsd'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              transferController: {
                                ...(selectedNode.data.config.transferController ?? {}),
                                pumpMode: value as 'fsd' | 'vsd',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fsd">FSD (On/Off)</SelectItem>
                          <SelectItem value="vsd">VSD (Speed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Speed (%)</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.transferController?.transferSpeedPct ?? 60)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              value: parseMaybeNumber(event.target.value) ?? 60,
                              transferController: {
                                ...(selectedNode.data.config.transferController ?? {}),
                                transferSpeedPct: parseMaybeNumber(event.target.value) ?? 60,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Ramp (sec)</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.transferController?.rampSeconds ?? 5)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              transferController: {
                                ...(selectedNode.data.config.transferController ?? {}),
                                rampSeconds: parseMaybeNumber(event.target.value) ?? 5,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Poll Interval (ms)</Label>
                      <Input
                        type="number"
                        value={String(selectedNode.data.config.transferController?.pollMs ?? 500)}
                        disabled={currentMode !== 'draft'}
                        onChange={(event) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              transferController: {
                                ...(selectedNode.data.config.transferController ?? {}),
                                pollMs: parseMaybeNumber(event.target.value) ?? 500,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Pump Output</Label>
                    <Select
                      value={selectedNode.data.config.transferController?.pumpDeviceId ?? '__none'}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            transferController: {
                              ...(selectedNode.data.config.transferController ?? {}),
                              pumpDeviceId: value === '__none' ? undefined : value,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue placeholder="Select pump target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {automationDeviceOptions
                          .filter((device) => device.type === 'pump')
                          .map((device) => (
                            <SelectItem key={`transfer-pump-${device.value}`} value={device.value}>
                              {device.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Source Valves</Label>
                      {[0, 1, 2].map((slot) => {
                        const values = selectedNode.data.config.transferController?.sourceValveDeviceIds ?? [];
                        return (
                          <Select
                            key={`transfer-source-${slot}`}
                            value={values[slot] ?? '__none'}
                            onValueChange={(value) => {
                              const next = [...values];
                              next[slot] = value === '__none' ? '' : value;
                              const compact = next.filter(Boolean);
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  transferController: {
                                    ...(selectedNode.data.config.transferController ?? {}),
                                    sourceValveDeviceIds: compact,
                                  },
                                },
                              });
                            }}
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue placeholder={`Source Valve ${slot + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {automationDeviceOptions
                                .filter((device) => device.type === 'valve')
                                .map((device) => (
                                  <SelectItem key={`transfer-source-opt-${slot}-${device.value}`} value={device.value}>
                                    {device.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Valves</Label>
                      {[0, 1, 2].map((slot) => {
                        const values = selectedNode.data.config.transferController?.destinationValveDeviceIds ?? [];
                        return (
                          <Select
                            key={`transfer-dest-${slot}`}
                            value={values[slot] ?? '__none'}
                            onValueChange={(value) => {
                              const next = [...values];
                              next[slot] = value === '__none' ? '' : value;
                              const compact = next.filter(Boolean);
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  transferController: {
                                    ...(selectedNode.data.config.transferController ?? {}),
                                    destinationValveDeviceIds: compact,
                                  },
                                },
                              });
                            }}
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue placeholder={`Destination Valve ${slot + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {automationDeviceOptions
                                .filter((device) => device.type === 'valve')
                                .map((device) => (
                                  <SelectItem key={`transfer-dest-opt-${slot}-${device.value}`} value={device.value}>
                                    {device.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.widgetType === 'recipe_executor' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Executes imported recipe steps with optional confirmation gates and target dispatch.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Controller</Label>
                      <Select
                        value={selectedNode.data.config.recipeExecutor?.enabled ? 'enabled' : 'disabled'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              recipeExecutor: {
                                ...(selectedNode.data.config.recipeExecutor ?? {}),
                                enabled: value === 'enabled',
                                runtimeState: value === 'enabled' ? 'idle' : 'disabled',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="enabled">Enabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Default Step Mode</Label>
                      <Select
                        value={selectedNode.data.config.recipeExecutor?.autoProceedDefault ? 'auto' : 'confirm'}
                        onValueChange={(value) =>
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              recipeExecutor: {
                                ...(selectedNode.data.config.recipeExecutor ?? {}),
                                autoProceedDefault: value === 'auto',
                              },
                            },
                          })
                        }
                      >
                        <SelectTrigger disabled={currentMode !== 'draft'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirm">Confirm Required</SelectItem>
                          <SelectItem value="auto">Auto Proceed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 rounded border border-border/70 p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {selectedNode.data.config.recipeName || 'No recipe loaded'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {selectedNode.data.config.recipeFormat
                            ? `Format: ${selectedNode.data.config.recipeFormat}`
                            : 'Load from imported recipes on the execution page.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentMode !== 'draft' || !selectedImportedRecipe}
                        onClick={() => {
                          if (!selectedImportedRecipe) return;
                          updateSelectedNode({
                            config: {
                              ...selectedNode.data.config,
                              recipeId: selectedImportedRecipe.id,
                              recipeName: selectedImportedRecipe.name,
                              recipeFormat: selectedImportedRecipe.format,
                              recipeSteps: selectedImportedRecipe.steps.map((step) => ({ ...step })),
                              state: 'off',
                              recipeExecutor: {
                                ...(selectedNode.data.config.recipeExecutor ?? {}),
                                running: false,
                                paused: false,
                                awaitingConfirm: false,
                                currentStepIndex: 0,
                                stepStartedAtMs: undefined,
                                activeStepId: undefined,
                                runtimeState:
                                  selectedNode.data.config.recipeExecutor?.enabled === true
                                    ? 'idle'
                                    : 'disabled',
                              },
                            },
                          });
                          recipeExecutorDispatchStateRef.current.delete(selectedNode.id);
                          recipeExecutorRunIdRef.current.delete(selectedNode.id);
                          setStatus(`Loaded recipe into executor: ${selectedImportedRecipe.name}`);
                        }}
                      >
                        Load Recipe
                      </Button>
                    </div>
                    <Select
                      value={selectedImportedRecipeId || '__none'}
                      onValueChange={(value) =>
                        setSelectedImportedRecipeId(value === '__none' ? '' : value)
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft' || importedRecipes.length === 0}>
                        <SelectValue placeholder="Select imported recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {importedRecipes.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No imported recipes
                          </SelectItem>
                        ) : (
                          importedRecipes.map((recipe) => (
                            <SelectItem key={`recipe-import-opt-${recipe.id}`} value={recipe.id}>
                              {recipe.name} ({recipe.steps.length} steps)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Steps</p>
                        <p className="font-medium text-foreground">
                          {selectedNode.data.config.recipeSteps?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Step</p>
                        <p className="font-medium text-foreground">
                          {Math.min(
                            Number(selectedNode.data.config.recipeExecutor?.currentStepIndex ?? 0) + 1,
                            Math.max(1, Number(selectedNode.data.config.recipeSteps?.length ?? 0))
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Runtime</p>
                        <p className="font-medium text-foreground">
                          {String(
                            selectedNode.data.config.recipeExecutor?.runtimeState ??
                              'disabled'
                          ).replaceAll('_', ' ')}
                        </p>
                      </div>
                    </div>

                    {(selectedNode.data.config.recipeSteps ?? []).length > 0 ? (
                      <div className="max-h-72 space-y-2 overflow-auto rounded border border-border/60 p-2 text-[11px]">
                        {(selectedNode.data.config.recipeSteps ?? []).map((step, index) => {
                          const mode =
                            step.requiresUserConfirm === true
                              ? 'confirm'
                              : step.autoProceed === true
                              ? 'auto'
                              : 'confirm';
                          return (
                            <div key={`recipe-step-${step.id}`} className="space-y-2 rounded border border-border/60 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium text-foreground">
                                  {index + 1}. {step.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px]"
                                    disabled={currentMode !== 'draft' || index === 0}
                                    onClick={() => {
                                      const steps = [...(selectedNode.data.config.recipeSteps ?? [])];
                                      [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: steps,
                                        },
                                      });
                                    }}
                                  >
                                    Up
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px]"
                                    disabled={currentMode !== 'draft' || index >= (selectedNode.data.config.recipeSteps?.length ?? 0) - 1}
                                    onClick={() => {
                                      const steps = [...(selectedNode.data.config.recipeSteps ?? [])];
                                      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: steps,
                                        },
                                      });
                                    }}
                                  >
                                    Down
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="h-6 px-2 text-[10px]"
                                    disabled={currentMode !== 'draft'}
                                    onClick={() =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).filter(
                                            (candidate) => candidate.id !== step.id
                                          ),
                                        },
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label>Step Name</Label>
                                <Input
                                  value={step.name}
                                  disabled={currentMode !== 'draft'}
                                  onChange={(event) =>
                                    updateSelectedNode({
                                      config: {
                                        ...selectedNode.data.config,
                                        recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                          (candidate) =>
                                            candidate.id === step.id
                                              ? {
                                                  ...candidate,
                                                  name: event.target.value,
                                                }
                                              : candidate
                                        ),
                                      },
                                    })
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label>Stage</Label>
                                  <Input
                                    value={String(step.stage ?? '')}
                                    placeholder="mash, boil, fermentation"
                                    disabled={currentMode !== 'draft'}
                                    onChange={(event) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    stage: event.target.value,
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Command</Label>
                                  <Select
                                    value={step.command ?? 'trigger'}
                                    onValueChange={(value) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    command: value as AutomationStep['command'],
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  >
                                    <SelectTrigger disabled={currentMode !== 'draft'}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="trigger">Trigger</SelectItem>
                                      <SelectItem value="on_off">On/Off</SelectItem>
                                      <SelectItem value="open_close">Open/Close</SelectItem>
                                      <SelectItem value="route">Route</SelectItem>
                                      <SelectItem value="set_value">Set Value</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label>Target Device</Label>
                                  <Select
                                    value={step.targetDeviceId ?? '__none'}
                                    onValueChange={(value) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    targetDeviceId: value === '__none' ? undefined : value,
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  >
                                    <SelectTrigger disabled={currentMode !== 'draft'}>
                                      <SelectValue placeholder="Select target device" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none">None</SelectItem>
                                      {automationDeviceOptions
                                        .filter((device) => device.type !== 'note' && device.type !== 'display')
                                        .map((device) => (
                                          <SelectItem key={`recipe-step-target-${step.id}-${device.value}`} value={device.value}>
                                            {device.label}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Value (optional)</Label>
                                  <Input
                                    value={String(step.value ?? '')}
                                    disabled={currentMode !== 'draft'}
                                    placeholder="on, off, 68, c_to_a"
                                    onChange={(event) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    value: event.target.value,
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label>Duration (min)</Label>
                                  <Input
                                    type="number"
                                    value={String(step.durationMin ?? '')}
                                    disabled={currentMode !== 'draft'}
                                    onChange={(event) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    durationMin: parseMaybeNumber(event.target.value),
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Target Temp (C)</Label>
                                  <Input
                                    type="number"
                                    value={String(step.temperatureC ?? '')}
                                    disabled={currentMode !== 'draft'}
                                    onChange={(event) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    temperatureC: parseMaybeNumber(event.target.value),
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Step Mode</Label>
                                  <Select
                                    value={mode}
                                    onValueChange={(value) =>
                                      updateSelectedNode({
                                        config: {
                                          ...selectedNode.data.config,
                                          recipeSteps: (selectedNode.data.config.recipeSteps ?? []).map(
                                            (candidate) =>
                                              candidate.id === step.id
                                                ? {
                                                    ...candidate,
                                                    requiresUserConfirm: value === 'confirm',
                                                    autoProceed: value === 'auto',
                                                  }
                                                : candidate
                                          ),
                                        },
                                      })
                                    }
                                  >
                                    <SelectTrigger disabled={currentMode !== 'draft'}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="confirm">Confirm</SelectItem>
                                      <SelectItem value="auto">Auto</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded border border-dashed border-border/70 p-2 text-[11px] text-muted-foreground">
                        No steps loaded. Import a recipe, then click "Load Latest Import".
                      </p>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentMode !== 'draft'}
                      onClick={() =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            recipeSteps: [
                              ...(selectedNode.data.config.recipeSteps ?? []),
                              {
                                id: makeId('recipe-step'),
                                name: `Step ${(selectedNode.data.config.recipeSteps?.length ?? 0) + 1}`,
                                stage: 'manual',
                                action: 'manual',
                                command: 'trigger',
                                requiresUserConfirm: true,
                                autoProceed: false,
                              },
                            ],
                          },
                        })
                      }
                    >
                      Add Step
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentMode !== 'draft'}
                      onClick={() => {
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            state: 'off',
                            recipeExecutor: {
                              ...(selectedNode.data.config.recipeExecutor ?? {}),
                              running: false,
                              paused: false,
                              awaitingConfirm: false,
                              currentStepIndex: 0,
                              stepStartedAtMs: undefined,
                              activeStepId: undefined,
                              runtimeState:
                                selectedNode.data.config.recipeExecutor?.enabled === true
                                  ? 'idle'
                                  : 'disabled',
                            },
                          },
                        });
                        recipeExecutorDispatchStateRef.current.delete(selectedNode.id);
                        recipeExecutorRunIdRef.current.delete(selectedNode.id);
                      }}
                    >
                      Reset Progress
                    </Button>
                  </div>
                </div>
              )}

              {(selectedNode.data.widgetType === 'heater' ||
                selectedNode.data.widgetType === 'pid') && (
                <div className="space-y-1">
                  <Label htmlFor="popup-cfg-setpoint">Setpoint (C)</Label>
                  <Input
                    id="popup-cfg-setpoint"
                    type="number"
                    value={String(selectedNode.data.config.setpoint ?? '')}
                    disabled={currentMode !== 'draft'}
                    onChange={(event) =>
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          setpoint: parseMaybeNumber(event.target.value),
                        },
                      })
                    }
                  />
                </div>
              )}

              {selectedNode.data.widgetType === 'automation' && (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="space-y-1">
                    <Label>Automation UI Mode</Label>
                    <Select
                      value={selectedNode.data.config.automationMode ?? 'simple'}
                      onValueChange={(value) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            automationMode: value as 'simple' | 'advanced',
                          },
                        })
                      }
                    >
                      <SelectTrigger disabled={currentMode !== 'draft'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple (When/Then)</SelectItem>
                        <SelectItem value="advanced">Advanced (Step Sequence)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedNode.data.config.automationMode ?? 'simple') === 'simple' && (
                    <div className="space-y-2 rounded border border-border/70 p-2">
                      <p className="text-xs text-muted-foreground">
                        Trigger by sensor value and control a target device automatically.
                      </p>
                      <div className="space-y-1">
                        <Label>Source Sensor</Label>
                        <Select
                          value={selectedNode.data.config.simpleAutomation?.sourceSensorDeviceId ?? '__none'}
                          onValueChange={(value) =>
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                simpleAutomation: {
                                  ...(selectedNode.data.config.simpleAutomation ?? {}),
                                  sourceSensorDeviceId: value === '__none' ? undefined : value,
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger disabled={currentMode !== 'draft'}>
                            <SelectValue placeholder="Select sensor device" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">None</SelectItem>
                            {automationDeviceOptions
                              .filter((device) => device.type === 'sensor')
                              .map((device) => (
                                <SelectItem key={`simple-sensor-${device.value}`} value={device.value}>
                                  {device.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Compare To</Label>
                          <Select
                            value={selectedNode.data.config.simpleAutomation?.compareTo ?? 'threshold'}
                            onValueChange={(value) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    compareTo: value as 'threshold' | 'setpoint_device',
                                  },
                                },
                              })
                            }
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="threshold">Threshold</SelectItem>
                              <SelectItem value="setpoint_device">Setpoint Device</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Operator</Label>
                          <Select
                            value={selectedNode.data.config.simpleAutomation?.operator ?? 'gt'}
                            onValueChange={(value) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    operator: value as 'gt' | 'gte' | 'lt' | 'lte',
                                  },
                                },
                              })
                            }
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gt">{'>'}</SelectItem>
                              <SelectItem value="gte">{'>='}</SelectItem>
                              <SelectItem value="lt">{'<'}</SelectItem>
                              <SelectItem value="lte">{'<='}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(selectedNode.data.config.simpleAutomation?.compareTo ?? 'threshold') === 'threshold' ? (
                        <div className="space-y-1">
                          <Label>Threshold</Label>
                          <Input
                            type="number"
                            value={String(selectedNode.data.config.simpleAutomation?.threshold ?? '')}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    threshold: parseMaybeNumber(event.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label>Setpoint Device (slider/sensor)</Label>
                          <Select
                            value={selectedNode.data.config.simpleAutomation?.setpointDeviceId ?? '__none'}
                            onValueChange={(value) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    setpointDeviceId: value === '__none' ? undefined : value,
                                  },
                                },
                              })
                            }
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue placeholder="Select setpoint device" />
                            </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">None</SelectItem>
                            {automationDeviceOptions
                              .filter((device) => device.type === 'slider' || device.type === 'sensor')
                              .map((device) => (
                                <SelectItem key={`simple-setpoint-${device.value}`} value={device.value}>
                                  {device.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Hysteresis</Label>
                          <Input
                            type="number"
                            value={String(selectedNode.data.config.simpleAutomation?.hysteresis ?? 0)}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    hysteresis: parseMaybeNumber(event.target.value) ?? 0,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Poll Interval (ms)</Label>
                          <Input
                            type="number"
                            value={String(selectedNode.data.config.simpleAutomation?.pollMs ?? 1000)}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    pollMs: parseMaybeNumber(event.target.value) ?? 1000,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Target Device</Label>
                        <Select
                          value={selectedNode.data.config.simpleAutomation?.targetDeviceId ?? '__none'}
                          onValueChange={(value) =>
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                simpleAutomation: {
                                  ...(selectedNode.data.config.simpleAutomation ?? {}),
                                  targetDeviceId: value === '__none' ? undefined : value,
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger disabled={currentMode !== 'draft'}>
                            <SelectValue placeholder="Select target device" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">None</SelectItem>
                            {automationDeviceOptions.map((device) => (
                              <SelectItem key={`simple-target-${device.value}`} value={device.value}>
                                {device.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label>Command</Label>
                          <Select
                            value={selectedNode.data.config.simpleAutomation?.command ?? 'on_off'}
                            onValueChange={(value) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    command: value as AutomationStep['command'],
                                  },
                                },
                              })
                            }
                          >
                            <SelectTrigger disabled={currentMode !== 'draft'}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="on_off">On/Off</SelectItem>
                              <SelectItem value="open_close">Open/Close</SelectItem>
                              <SelectItem value="route">Route A/B</SelectItem>
                              <SelectItem value="set_value">Set Value</SelectItem>
                              <SelectItem value="trigger">Trigger</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>On Value</Label>
                          <Input
                            value={String(selectedNode.data.config.simpleAutomation?.onValue ?? '')}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    onValue: event.target.value,
                                  },
                                },
                              })
                            }
                            placeholder="on / open / c_to_a / 70"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Off Value</Label>
                          <Input
                            value={String(selectedNode.data.config.simpleAutomation?.offValue ?? '')}
                            disabled={currentMode !== 'draft'}
                            onChange={(event) =>
                              updateSelectedNode({
                                config: {
                                  ...selectedNode.data.config,
                                  simpleAutomation: {
                                    ...(selectedNode.data.config.simpleAutomation ?? {}),
                                    offValue: event.target.value,
                                  },
                                },
                              })
                            }
                            placeholder="off / closed / c_to_b / 65"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedNode.data.config.automationMode ?? 'simple') === 'advanced' && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Automation Steps</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={currentMode !== 'draft'}
                          onClick={() => {
                            const existing = selectedNode.data.config.automationSteps ?? [];
                            const nextStep: AutomationStep = {
                              id: makeId('step'),
                              label: `Step ${existing.length + 1}`,
                              command: 'on_off',
                              value: 'on',
                              delayMs: 0,
                            };
                            updateSelectedNode({
                              config: {
                                ...selectedNode.data.config,
                                automationSteps: [...existing, nextStep],
                              },
                            });
                          }}
                        >
                          Add Step
                        </Button>
                      </div>
                      {(selectedNode.data.config.automationSteps ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Add steps to run multiple device commands with optional delays.
                        </p>
                      ) : (
                        (selectedNode.data.config.automationSteps ?? []).map((step, index) => (
                          <div key={step.id ?? `${index}`} className="space-y-2 rounded border border-border/70 p-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">Step {index + 1}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={currentMode !== 'draft'}
                                onClick={() =>
                                  updateSelectedNode({
                                    config: {
                                      ...selectedNode.data.config,
                                      automationSteps: (selectedNode.data.config.automationSteps ?? []).filter(
                                        (candidate) => candidate.id !== step.id
                                      ),
                                    },
                                  })
                                }
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <Label>Target Device</Label>
                              <Select
                                value={step.targetDeviceId ?? '__none'}
                                onValueChange={(value) =>
                                  updateSelectedNode({
                                    config: {
                                      ...selectedNode.data.config,
                                      automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                                        (candidate) =>
                                          candidate.id === step.id
                                            ? {
                                                ...candidate,
                                                targetDeviceId: value === '__none' ? undefined : value,
                                              }
                                            : candidate
                                      ),
                                    },
                                  })
                                }
                              >
                                <SelectTrigger disabled={currentMode !== 'draft'}>
                                  <SelectValue placeholder="Select target device" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none">None</SelectItem>
                                  {devices.map((device) => (
                                    <SelectItem key={`step-device-${step.id}-${device.id}`} value={device.id}>
                                      {device.name} ({device.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label>Command</Label>
                                <Select
                                  value={step.command ?? 'on_off'}
                                  onValueChange={(value) =>
                                    updateSelectedNode({
                                      config: {
                                        ...selectedNode.data.config,
                                        automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                                          (candidate) =>
                                            candidate.id === step.id
                                              ? {
                                                  ...candidate,
                                                  command: value as AutomationStep['command'],
                                                }
                                              : candidate
                                        ),
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger disabled={currentMode !== 'draft'}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="on_off">On/Off</SelectItem>
                                    <SelectItem value="open_close">Open/Close</SelectItem>
                                    <SelectItem value="route">Route A/B</SelectItem>
                                    <SelectItem value="set_value">Set Value</SelectItem>
                                    <SelectItem value="trigger">Trigger</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label>Delay (ms)</Label>
                                <Input
                                  type="number"
                                  value={String(step.delayMs ?? 0)}
                                  disabled={currentMode !== 'draft'}
                                  onChange={(event) =>
                                    updateSelectedNode({
                                      config: {
                                        ...selectedNode.data.config,
                                        automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                                          (candidate) =>
                                            candidate.id === step.id
                                              ? {
                                                  ...candidate,
                                                  delayMs: parseMaybeNumber(event.target.value) ?? 0,
                                                }
                                              : candidate
                                        ),
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label>Value (optional)</Label>
                              <Input
                                value={String(step.value ?? '')}
                                disabled={currentMode !== 'draft'}
                                onChange={(event) =>
                                  updateSelectedNode({
                                    config: {
                                      ...selectedNode.data.config,
                                      automationSteps: (selectedNode.data.config.automationSteps ?? []).map(
                                        (candidate) =>
                                          candidate.id === step.id
                                            ? {
                                                ...candidate,
                                                value: event.target.value,
                                              }
                                            : candidate
                                      ),
                                    },
                                  })
                                }
                                placeholder="on, off, true, false, 50, c_to_a"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              )}

              {(selectedNode.data.widgetType === 'button' ||
                selectedNode.data.widgetType === 'display' ||
                selectedNode.data.widgetType === 'note') && (
                <p className="text-xs text-muted-foreground">
                  This widget has minimal config. Use label and bindings.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No widget selected.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={warningsOpen} onOpenChange={setWarningsOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Build Warnings</DialogTitle>
            <DialogDescription>
              Wiring and configuration checks with suggested fixes.
            </DialogDescription>
          </DialogHeader>
          {buildWarnings.length === 0 ? (
            <p className="text-sm text-emerald-600">No build warnings.</p>
          ) : (
            <div className="space-y-2">
              {buildWarnings.map((warning, index) => (
                <div key={`warnings-dialog-${index}`} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-900">{warning}</p>
                  <p className="mt-1 text-xs text-amber-800">
                    Suggested fix: {warningSuggestion(warning)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(wireDeleteTarget)} onOpenChange={(open) => !open && setWireDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Wire</DialogTitle>
            <DialogDescription>Would you like to delete this wire?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWireDeleteTarget(null)}>
              No
            </Button>
            <Button variant="destructive" onClick={confirmDeleteWire}>
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pageDeleteTarget)} onOpenChange={(open) => !open && setPageDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Would you like to delete page "{pageDeleteTarget?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPageDeleteTarget(null)}>
              No
            </Button>
            <Button variant="destructive" onClick={confirmDeletePage}>
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={nodeRedInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleNodeRedImport}
      />
    </div>
  );
};

export default function CanvasStudio() {
  return (
    <ReactFlowProvider>
      <CanvasStudioInner />
    </ReactFlowProvider>
  );
}
