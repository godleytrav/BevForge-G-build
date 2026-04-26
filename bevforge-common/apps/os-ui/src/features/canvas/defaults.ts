import type {
  CanvasEdge,
  CanvasNode,
  CanvasPage,
  CanvasProject,
  RegisteredDevice,
  WidgetConfig,
  WidgetType,
  FluidMedium,
} from './types';

export const FLOW_WIDGET_TYPES: WidgetType[] = [
  'vessel',
  'pump',
  'valve',
  'packaging',
  'sensor',
  'heater',
];

const nowIso = () => new Date().toISOString();

export const makeId = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};

export const defaultWidgetConfig = (widgetType: WidgetType): WidgetConfig => {
  switch (widgetType) {
    case 'vessel':
      return {
        vesselType: 'fermentor_conical',
        capacity: 100,
        currentLevel: 0,
        temperature: 20,
      };
    case 'pump':
      return { state: 'off', flowRate: 0 };
    case 'valve':
      return { valveType: '2way', position: 'closed' };
    case 'packaging':
      return {
        state: 'off',
        packagingNode: {
          lineKind: 'keg_line',
          packageType: 'keg',
          lineMode: 'manual',
          supportedFormats: ['1/2 bbl', '1/6 bbl'],
          defaultFillSize: '1/2 bbl',
          throughputPerMin: 2,
          defaultSkuFamily: '',
          beverageClass: 'cider',
          runtimeState: 'idle',
        },
      };
    case 'sensor':
      return {
        value: 0,
        sensorType: 'temperature',
        unit: 'F',
        dummyMode: true,
        dummyValue: 68,
        sensorSampleAtMs: Date.now(),
        min: 0,
        max: 250,
        step: 1,
      };
    case 'heater':
      return { state: 'off', setpoint: 68, temperature: 20 };
    case 'pid':
      return {
        setpoint: 68,
        value: 68,
        autoProceed: false,
        requireUserProceed: true,
      };
    case 'button':
      return {
        state: 'off',
        autoProceed: false,
        requireUserProceed: true,
      };
    case 'switch':
      return { state: 'off' };
    case 'slider':
      return {
        value: 68,
        setpointType: 'temperature',
        unit: 'F',
        min: 32,
        max: 212,
        step: 1,
      };
    case 'glycol_controller':
      return {
        state: 'off',
        value: 68,
        setpoint: 65,
        unit: 'F',
        glycolController: {
          compareTo: 'threshold',
          threshold: 65,
          hysteresis: 1,
          pollMs: 1000,
        },
      };
    case 'hlt_controller':
      return {
        state: 'off',
        value: 150,
        setpoint: 152,
        unit: 'F',
        min: 50,
        max: 180,
        step: 0.5,
        hltController: {
          enabled: false,
          compareTo: 'threshold',
          threshold: 152,
          hysteresis: 1,
          pollMs: 1000,
        },
      };
    case 'co2_controller':
      return {
        state: 'off',
        value: 0,
        setpoint: 12,
        unit: 'PSI',
        min: 0,
        max: 40,
        step: 0.1,
        co2Controller: {
          enabled: false,
          beverageStyle: 'beer',
          targetMode: 'psi',
          targetVolumes: 2.4,
          beverageTempF: 38,
          compareTo: 'threshold',
          threshold: 12,
          hysteresis: 0.5,
          pollMs: 1000,
          maxPressurePsi: 25,
          sampleTimeoutMs: 0,
          maxPressureRisePsiPerMin: 0,
          purgeActive: false,
          purgeCycles: 3,
          purgeInjectMs: 4000,
          purgeVentMs: 2000,
          emitAlarmEvents: true,
          runtimeState: 'disabled',
        },
      };
    case 'transfer_controller':
      return {
        state: 'off',
        value: 60,
        unit: '%',
        min: 0,
        max: 100,
        step: 1,
        transferController: {
          enabled: false,
          transferActive: false,
          autoMapWiring: true,
          pumpMode: 'fsd',
          transferSpeedPct: 60,
          rampSeconds: 5,
          pollMs: 500,
          sourceValveDeviceIds: [],
          destinationValveDeviceIds: [],
          runtimeState: 'disabled',
        },
      };
    case 'recipe_executor':
      return {
        state: 'off',
        recipeId: '',
        recipeName: '',
        recipeFormat: undefined,
        recipeSteps: [],
        recipeExecutor: {
          enabled: false,
          running: false,
          paused: false,
          awaitingConfirm: false,
          currentStepIndex: 0,
          autoProceedDefault: false,
          runtimeState: 'disabled',
        },
      };
    case 'automation':
      return {
        automationMode: 'simple',
        simpleAutomation: {
          compareTo: 'threshold',
          operator: 'gt',
          threshold: 69,
          hysteresis: 1,
          command: 'on_off',
          onValue: 'on',
          offValue: 'off',
          pollMs: 1000,
        },
        automationSteps: [],
        requireUserProceed: true,
      };
    case 'display':
      return { value: '--' };
    case 'note':
      return {};
    default:
      return {};
  }
};

export const createNode = (
  widgetType: WidgetType,
  position = { x: 120, y: 120 },
  label?: string
): CanvasNode => {
  const id = makeId(widgetType);
  const defaultLabel =
    widgetType === 'packaging'
      ? `PACKAGING LINE ${id.slice(-4)}`
      : `${widgetType.toUpperCase()} ${id.slice(-4)}`;
  return {
    id,
    type: 'widget',
    position,
    data: {
      label: label ?? defaultLabel,
      widgetType,
      config: defaultWidgetConfig(widgetType),
    },
  };
};

export const createEdge = (
  source: string,
  target: string,
  kind: 'fluid' | 'data' | 'power' | 'ground',
  medium?: FluidMedium
): CanvasEdge => ({
  id: makeId('edge'),
  source,
  target,
  type: kind === 'fluid' ? 'smoothstep' : 'default',
  data: kind === 'fluid' ? { kind, medium: medium ?? 'product' } : { kind },
});

export const createPage = (name: string): CanvasPage => {
  const now = nowIso();
  return {
    id: makeId('page'),
    name,
    mode: 'draft',
    nodes: [],
    edges: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const createDefaultProject = (): CanvasProject => {
  const now = nowIso();
  return {
    schemaVersion: '1.0.0',
    id: makeId('project'),
    name: 'BevForge OS Canvas Project',
    pages: [createPage('Master Layout')],
    createdAt: now,
    updatedAt: now,
  };
};

export const createRegisteredDevice = (
  name: string,
  type: WidgetType,
  id?: string
): RegisteredDevice => {
  const now = nowIso();
  return {
    id: id ?? makeId('dev'),
    name,
    type,
    driver: 'dummy',
    config: {},
    createdAt: now,
    updatedAt: now,
  };
};
