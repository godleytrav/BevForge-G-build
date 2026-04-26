import type { Edge, Node, Viewport } from '@xyflow/react';

export type CanvasMode = 'draft' | 'published';

export type WidgetType =
  | 'vessel'
  | 'pump'
  | 'valve'
  | 'packaging'
  | 'sensor'
  | 'heater'
  | 'pid'
  | 'button'
  | 'switch'
  | 'slider'
  | 'glycol_controller'
  | 'hlt_controller'
  | 'co2_controller'
  | 'transfer_controller'
  | 'recipe_executor'
  | 'automation'
  | 'display'
  | 'note';

export type EdgeKind = 'fluid' | 'data' | 'power' | 'ground';
export type FluidMedium = 'product' | 'glycol' | 'co2' | 'cip' | 'water' | 'gas';

export interface WidgetBindings {
  sensor?: string;
  actuator?: string;
  feedback?: string;
}

export interface WidgetConfig {
  automationSteps?: AutomationStep[];
  automationMode?: 'simple' | 'advanced';
  simpleAutomation?: SimpleAutomationRule;
  glycolController?: GlycolControllerRule;
  hltController?: HltControllerRule;
  co2Controller?: Co2ControllerRule;
  transferController?: TransferControllerRule;
  packagingNode?: PackagingNodeRule;
  recipeExecutor?: RecipeExecutorRule;
  recipeId?: string;
  recipeName?: string;
  recipeFormat?: ImportedRecipe['format'];
  recipeSteps?: ImportedRecipe['steps'];
  vesselType?: 'fermentor_conical' | 'bright_tank' | 'mash_tun' | 'hlt' | 'brew_kettle' | 'generic';
  sensorType?: SensorType;
  unit?: string;
  dummyMode?: boolean;
  dummyValue?: number;
  sensorSampleAtMs?: number;
  min?: number;
  max?: number;
  step?: number;
  setpointType?: SensorType;
  valveType?: '2way' | '3way';
  state?: 'on' | 'off';
  position?: 'open' | 'closed' | 'a_to_c' | 'b_to_c' | 'c_to_a' | 'c_to_b';
  capacity?: number;
  currentLevel?: number;
  temperature?: number;
  flowRate?: number;
  setpoint?: number;
  value?: number | string | boolean;
  autoProceed?: boolean;
  requireUserProceed?: boolean;
}

export interface PackagingNodeRule {
  lineKind?: 'keg_line' | 'canning_line' | 'bottling_line' | 'mixed';
  packageType?: 'keg' | 'can' | 'bottle' | 'case' | 'pallet' | 'custom';
  lineMode?: 'manual' | 'metered';
  supportedFormats?: string[];
  defaultFillSize?: string;
  throughputPerMin?: number;
  defaultSkuFamily?: string;
  beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
  runtimeState?: 'idle' | 'running' | 'paused' | 'disabled';
}

export interface GlycolControllerRule {
  sourceSensorDeviceId?: string;
  compareTo?: 'threshold' | 'setpoint_device';
  threshold?: number;
  setpointDeviceId?: string;
  hysteresis?: number;
  pollMs?: number;
  pumpDeviceId?: string;
  valveDeviceId?: string;
  chillerDeviceId?: string;
}

export interface HltControllerRule {
  enabled?: boolean;
  sourceSensorDeviceId?: string;
  compareTo?: 'threshold' | 'setpoint_device';
  threshold?: number;
  setpointDeviceId?: string;
  hysteresis?: number;
  pollMs?: number;
  heaterDeviceId?: string;
  recircPumpDeviceId?: string;
}

export interface Co2ControllerRule {
  enabled?: boolean;
  beverageStyle?: 'beer' | 'cider' | 'champagne' | 'wine' | 'seltzer' | 'custom';
  targetMode?: 'psi' | 'volumes';
  targetVolumes?: number;
  beverageTempF?: number;
  beverageTempSensorDeviceId?: string;
  compareTo?: 'threshold' | 'setpoint_device';
  threshold?: number;
  setpointDeviceId?: string;
  hysteresis?: number;
  pollMs?: number;
  maxPressurePsi?: number;
  sampleTimeoutMs?: number;
  maxPressureRisePsiPerMin?: number;
  purgeActive?: boolean;
  purgeCycles?: number;
  purgeInjectMs?: number;
  purgeVentMs?: number;
  alarmOutputDeviceId?: string;
  emitAlarmEvents?: boolean;
  lastAlarmReason?: string;
  inletValveDeviceId?: string;
  ventValveDeviceId?: string;
  runtimeState?: 'idle' | 'pressurizing' | 'venting' | 'disabled' | 'safety_stop';
}

export interface TransferControllerRule {
  enabled?: boolean;
  transferActive?: boolean;
  autoMapWiring?: boolean;
  pumpMode?: 'fsd' | 'vsd';
  transferSpeedPct?: number;
  rampSeconds?: number;
  pollMs?: number;
  pumpDeviceId?: string;
  sourceValveDeviceIds?: string[];
  destinationValveDeviceIds?: string[];
  runtimeState?: 'idle' | 'running' | 'disabled';
}

export interface RecipeExecutorRule {
  enabled?: boolean;
  running?: boolean;
  paused?: boolean;
  awaitingConfirm?: boolean;
  currentStepIndex?: number;
  stepStartedAtMs?: number;
  activeStepId?: string;
  autoProceedDefault?: boolean;
  runtimeState?: 'idle' | 'running' | 'waiting_confirm' | 'paused' | 'completed' | 'disabled';
}

export interface AutomationStep {
  id: string;
  label?: string;
  targetDeviceId?: string;
  command?: 'on_off' | 'open_close' | 'route' | 'set_value' | 'trigger';
  value?: string | number | boolean;
  delayMs?: number;
}

export type SensorType =
  | 'temperature'
  | 'sg'
  | 'ph'
  | 'abv'
  | 'brix'
  | 'ta'
  | 'so2'
  | 'psi'
  | 'flow'
  | 'humidity'
  | 'custom';

export interface SimpleAutomationRule {
  sourceSensorDeviceId?: string;
  compareTo?: 'threshold' | 'setpoint_device';
  operator?: 'gt' | 'gte' | 'lt' | 'lte';
  threshold?: number;
  setpointDeviceId?: string;
  hysteresis?: number;
  targetDeviceId?: string;
  command?: 'on_off' | 'open_close' | 'route' | 'set_value' | 'trigger';
  onValue?: string | number | boolean;
  offValue?: string | number | boolean;
  pollMs?: number;
}

export interface CanvasWidgetData extends Record<string, unknown> {
  label: string;
  widgetType: WidgetType;
  config: WidgetConfig;
  logicalDeviceId?: string;
  bindings?: WidgetBindings;
  control?: {
    targetDeviceId?: string;
    command?: 'on_off' | 'open_close' | 'route' | 'set_value' | 'trigger';
    driverType?: 'usb_relay' | 'gpio' | 'dummy' | string;
    channel?: string;
    endpointId?: number;
    min?: number;
    max?: number;
  };
  notes?: string;
}

export type CanvasNode = Node<CanvasWidgetData, 'widget'>;

export interface CanvasEdgeData extends Record<string, unknown> {
  kind: EdgeKind;
  medium?: FluidMedium;
  active?: boolean;
  flowRate?: number;
}

export type CanvasEdge = Edge<CanvasEdgeData>;

export interface CanvasPage {
  id: string;
  name: string;
  mode: CanvasMode;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport?: Viewport;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CanvasProject {
  schemaVersion: string;
  id: string;
  name: string;
  pages: CanvasPage[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisteredDevice {
  id: string;
  name: string;
  type: WidgetType;
  driver: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ImportedRecipe {
  id: string;
  name: string;
  format: 'bevforge' | 'beer-json' | 'beer-xml' | 'beer-smith-bsmx';
  requirements?: Array<{
    name: string;
    category: 'yeast' | 'malt' | 'hops' | 'fruit' | 'packaging' | 'equipment' | 'other';
    requiredQty?: number;
    unit?: string;
  }>;
  steps: Array<{
    id: string;
    name: string;
    stage?: string;
    action?: string;
    triggerWhen?: string;
    durationMin?: number;
    temperatureC?: number;
    targetDeviceId?: string;
    command?: AutomationStep['command'];
    value?: string | number | boolean;
    requiresUserConfirm?: boolean;
    autoProceed?: boolean;
  }>;
  metadata?: Record<string, unknown>;
  complianceProfile?: Record<string, unknown>;
  recipeComplianceSnapshot?: Record<string, unknown>;
  recipeRevision?: string;
  rawFile: string;
  importedAt: string;
}
