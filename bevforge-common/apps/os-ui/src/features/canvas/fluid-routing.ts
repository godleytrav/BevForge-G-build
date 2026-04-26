import type { CSSProperties } from 'react';
import { FLOW_WIDGET_TYPES } from './defaults';
import type { CanvasEdge, CanvasNode, FluidMedium, WidgetType } from './types';

const FLUID_COLORS: Record<FluidMedium, { active: string; inactive: string }> = {
  product: { active: '#0ea5e9', inactive: '#7dd3fc' },
  glycol: { active: '#06b6d4', inactive: '#67e8f9' },
  co2: { active: '#22c55e', inactive: '#86efac' },
  cip: { active: '#10b981', inactive: '#6ee7b7' },
  water: { active: '#3b82f6', inactive: '#93c5fd' },
  gas: { active: '#f59e0b', inactive: '#fcd34d' },
};

const FLOW_SET = new Set<WidgetType>(FLOW_WIDGET_TYPES);

const isFlowNode = (node: CanvasNode | undefined): node is CanvasNode =>
  Boolean(node && FLOW_SET.has(node.data.widgetType));

const canPassThrough = (node: CanvasNode): boolean => {
  const { widgetType, config } = node.data;
  if (widgetType === 'valve') {
    if (config.valveType === '3way') {
      return Boolean(config.position);
    }
    return config.position !== 'closed';
  }
  if (widgetType === 'pump') {
    return config.state === 'on';
  }
  return true;
};

const isFluidEdge = (edge: CanvasEdge): boolean =>
  (edge.data?.kind ?? 'fluid') === 'fluid';
const edgeMedium = (edge: CanvasEdge): FluidMedium =>
  (edge.data?.medium as FluidMedium | undefined) ?? 'product';

const activeFluidStyle = (medium: FluidMedium): CSSProperties => ({
  stroke: FLUID_COLORS[medium].active,
  strokeWidth: 3,
  filter: `drop-shadow(0 0 4px ${FLUID_COLORS[medium].active})`,
});

const inactiveFluidStyle = (medium: FluidMedium): CSSProperties => ({
  stroke: FLUID_COLORS[medium].inactive,
  strokeWidth: 2,
  opacity: 0.95,
});
const matchesHandle = (
  handleId: string | undefined,
  expected: string[]
): boolean => {
  if (!handleId) return true;
  return expected.includes(handleId);
};

export const annotateFluidEdges = (
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): CanvasEdge[] => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingBySource = new Map<string, CanvasEdge[]>();

  for (const edge of edges) {
    if (!isFluidEdge(edge)) {
      continue;
    }
    const list = outgoingBySource.get(edge.source) ?? [];
    list.push(edge);
    outgoingBySource.set(edge.source, list);
  }

  const activeEdgeIds = new Set<string>();
  const media: FluidMedium[] = ['product', 'glycol', 'co2', 'cip', 'water', 'gas'];

  for (const medium of media) {
    const queue = nodes
      .filter(
        (node) =>
          node.data.widgetType === 'pump' && node.data.config.state === 'on'
      )
      .map((node) => ({ id: node.id, pressurized: true }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const visitKey = `${current.id}:${current.pressurized ? '1' : '0'}`;
      if (visited.has(visitKey)) {
        continue;
      }
      visited.add(visitKey);

      const currentNode = nodeById.get(current.id);
      if (!isFlowNode(currentNode) || !canPassThrough(currentNode)) {
        continue;
      }

      const outgoing = outgoingBySource.get(current.id) ?? [];
      for (const edge of outgoing) {
        if (edgeMedium(edge) !== medium) {
          continue;
        }
        if (currentNode.data.widgetType === 'valve') {
          if (currentNode.data.config.valveType === '3way') {
            const position = currentNode.data.config.position;
            const selectedOut =
              position === 'c_to_b' || position === 'b_to_c'
                ? `${medium === 'product' ? 'fluid' : medium}-out-b`
                : `${medium === 'product' ? 'fluid' : medium}-out-a`;
            const fallbackOut =
              position === 'c_to_b' || position === 'b_to_c'
                ? 'fluid-out-b'
                : 'fluid-out-a';
            if (!matchesHandle(edge.sourceHandle, [selectedOut, fallbackOut])) {
              continue;
            }
          } else {
            const expectedOut = `${medium === 'product' ? 'fluid' : medium}-out`;
            if (!matchesHandle(edge.sourceHandle, [expectedOut, 'fluid-out'])) {
              continue;
            }
          }
        }
        const targetNode = nodeById.get(edge.target);
        if (!isFlowNode(targetNode)) {
          continue;
        }

        if (targetNode.data.widgetType === 'valve') {
          if (targetNode.data.config.valveType === '3way') {
            const expectedIn = `${medium === 'product' ? 'fluid' : medium}-in-c`;
            if (!matchesHandle(edge.targetHandle, [expectedIn, 'fluid-in-c'])) {
              continue;
            }
          } else {
            const expectedIn = `${medium === 'product' ? 'fluid' : medium}-in`;
            if (!matchesHandle(edge.targetHandle, [expectedIn, 'fluid-in'])) {
              continue;
            }
          }
        }

        const nextPressurized = current.pressurized || targetNode.data.widgetType === 'pump';
        if (canPassThrough(targetNode) && nextPressurized) {
          activeEdgeIds.add(edge.id);
          queue.push({ id: targetNode.id, pressurized: nextPressurized });
        }
      }
    }
  }

  return edges.map((edge) => {
    if (!isFluidEdge(edge)) {
      return {
        ...edge,
        animated: false,
      };
    }

    const isActive = activeEdgeIds.has(edge.id);
    const medium = edgeMedium(edge);
    return {
      ...edge,
      type: 'smoothstep',
      animated: isActive,
      data: {
        ...(edge.data ?? { kind: 'fluid' }),
        kind: 'fluid',
        medium,
        active: isActive,
      },
      style: isActive ? activeFluidStyle(medium) : inactiveFluidStyle(medium),
    };
  });
};
