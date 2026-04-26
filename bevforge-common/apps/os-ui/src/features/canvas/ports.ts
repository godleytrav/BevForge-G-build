import type { CanvasNode, EdgeKind, FluidMedium } from './types';

export type PortDirection = 'in' | 'out';
export type PortMedium = FluidMedium | 'dynamic';

export interface PortContract {
  id: string;
  kind: EdgeKind;
  direction: PortDirection;
  medium?: PortMedium;
}

const DATA_PORTS: PortContract[] = [
  { id: 'data-in', kind: 'data', direction: 'in' },
  { id: 'data-out', kind: 'data', direction: 'out' },
];

const FLUID_PORTS: PortContract[] = [
  { id: 'fluid-in', kind: 'fluid', direction: 'in', medium: 'dynamic' },
  { id: 'fluid-out', kind: 'fluid', direction: 'out', medium: 'dynamic' },
];

const PACKAGING_PORTS: PortContract[] = [
  { id: 'fluid-in', kind: 'fluid', direction: 'in', medium: 'dynamic' },
];

const FLUID_3WAY_PORTS: PortContract[] = [
  { id: 'fluid-in-c', kind: 'fluid', direction: 'in', medium: 'dynamic' },
  { id: 'fluid-out-a', kind: 'fluid', direction: 'out', medium: 'dynamic' },
  { id: 'fluid-out-b', kind: 'fluid', direction: 'out', medium: 'dynamic' },
];

const VESSEL_AUX_PORTS: PortContract[] = [
  { id: 'glycol-in', kind: 'fluid', direction: 'in', medium: 'glycol' },
  { id: 'glycol-out', kind: 'fluid', direction: 'out', medium: 'glycol' },
  { id: 'gas-in', kind: 'fluid', direction: 'in', medium: 'gas' },
  { id: 'gas-out', kind: 'fluid', direction: 'out', medium: 'gas' },
];

const POWER_PORTS: PortContract[] = [
  { id: 'power-in', kind: 'power', direction: 'in' },
  { id: 'ground-in', kind: 'ground', direction: 'in' },
];

const FLOW_WIDGET_TYPES = new Set(['vessel', 'pump', 'valve', 'sensor', 'heater']);

export const getNodePortContracts = (node: CanvasNode): PortContract[] => {
  const ports: PortContract[] = [...DATA_PORTS];
  const { widgetType, config } = node.data;

  if (widgetType === 'valve' && config.valveType === '3way') {
    ports.push(...FLUID_3WAY_PORTS);
  } else if (widgetType === 'packaging') {
    ports.push(...PACKAGING_PORTS);
  } else if (FLOW_WIDGET_TYPES.has(widgetType)) {
    ports.push(...FLUID_PORTS);
  }

  if (widgetType === 'vessel') {
    ports.push(...VESSEL_AUX_PORTS);
  }
  if (widgetType === 'pump' || widgetType === 'heater' || widgetType === 'pid') {
    ports.push(...POWER_PORTS);
  }

  return ports;
};

export const resolveNodePort = (
  node: CanvasNode | undefined,
  handleId?: string | null
): PortContract | null => {
  if (!node || !handleId) return null;
  return getNodePortContracts(node).find((port) => port.id === handleId) ?? null;
};

interface CompatibilityInput {
  sourcePort: PortContract;
  targetPort: PortContract;
  activeFluidMedium: FluidMedium;
}

export const resolveConnectionCompatibility = ({
  sourcePort,
  targetPort,
  activeFluidMedium,
}: CompatibilityInput):
  | { ok: true; kind: EdgeKind; medium?: FluidMedium }
  | { ok: false; reason: string } => {
  if (sourcePort.direction !== 'out' || targetPort.direction !== 'in') {
    return { ok: false, reason: 'Connect OUT handle to IN handle.' };
  }
  if (sourcePort.kind !== targetPort.kind) {
    return { ok: false, reason: 'Connection type mismatch. Use matching colors/types only.' };
  }

  if (sourcePort.kind === 'fluid') {
    const sourceMedium =
      sourcePort.medium && sourcePort.medium !== 'dynamic' ? sourcePort.medium : undefined;
    const targetMedium =
      targetPort.medium && targetPort.medium !== 'dynamic' ? targetPort.medium : undefined;

    if (sourceMedium && targetMedium && sourceMedium !== targetMedium) {
      return { ok: false, reason: 'Fluid medium mismatch. Connect ports for the same medium.' };
    }

    return {
      ok: true,
      kind: 'fluid',
      medium: sourceMedium ?? targetMedium ?? activeFluidMedium,
    };
  }

  return { ok: true, kind: sourcePort.kind };
};
