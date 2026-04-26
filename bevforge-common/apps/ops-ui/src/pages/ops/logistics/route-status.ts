import { getTruckRouteProgress, type LogisticsRouteSummary, type LogisticsTruckAssignment } from './data';

export type RouteStopLiveStatus = 'planned' | 'current' | 'completed';
export type SiteDeliveryStatus = 'scheduled' | 'in-route' | 'delivered';

export interface RouteStopSummary {
  id: string;
  routeId: string;
  routeLabel: string;
  siteId: string;
  siteName: string;
  orderCount: number;
  totalValue: number;
  orderIndex: number;
  status: RouteStopLiveStatus;
  stopsAhead: number;
  truckId?: string;
  truckName?: string;
}

export interface RouteLiveSummary {
  routeId: string;
  truckId?: string;
  truckName?: string;
  routeActive: boolean;
  completedStops: number;
  totalStops: number;
  currentStopId?: string;
  currentStopName?: string;
}

export interface SiteDeliverySnapshot {
  siteId: string;
  siteName: string;
  status: SiteDeliveryStatus;
  routeId: string;
  routeLabel: string;
  stopsAhead: number;
  truckId?: string;
  truckName?: string;
}

const ROUTE_STOP_ORDER_STORAGE_KEY = 'ops-logistics-route-stop-order-v1';

const canUseStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

const readRouteStopOrderStorage = (): Record<string, string[]> => {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ROUTE_STOP_ORDER_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([routeId, siteIds]) => [
        routeId,
        Array.isArray(siteIds) ? siteIds.filter((siteId): siteId is string => typeof siteId === 'string') : [],
      ])
    );
  } catch {
    return {};
  }
};

const writeRouteStopOrderStorage = (value: Record<string, string[]>) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ROUTE_STOP_ORDER_STORAGE_KEY, JSON.stringify(value));
};

export const getRouteStopOrder = (routeId: string): string[] => {
  const all = readRouteStopOrderStorage();
  return all[routeId] ?? [];
};

export const saveRouteStopOrder = (routeId: string, siteIds: string[]): void => {
  const all = readRouteStopOrderStorage();
  all[routeId] = siteIds;
  writeRouteStopOrderStorage(all);
};

export const resetRouteStopOrder = (routeId: string): void => {
  const all = readRouteStopOrderStorage();
  delete all[routeId];
  writeRouteStopOrderStorage(all);
};

const getRouteAssignment = (
  routeId: string,
  assignments: LogisticsTruckAssignment[]
): LogisticsTruckAssignment | null => {
  return assignments.find((assignment) => assignment.routeIds.includes(routeId)) ?? null;
};

const getOrderedStopIds = (routeId: string, stopIds: string[]): string[] => {
  const saved = getRouteStopOrder(routeId);
  const seen = new Set<string>();
  const ordered = saved.filter((id) => stopIds.includes(id) && !seen.has(id) && seen.add(id));
  stopIds.forEach((id) => {
    if (!seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  });
  return ordered;
};

const getRouteStopStatus = (
  route: LogisticsRouteSummary,
  index: number,
  totalStops: number,
  routeActive: boolean,
  currentStopIndex: number
): RouteStopLiveStatus => {
  if (route.status === 'completed') {
    return 'completed';
  }

  if (!routeActive) {
    return 'planned';
  }

  if (currentStopIndex >= totalStops) {
    return 'completed';
  }

  if (index < currentStopIndex) {
    return 'completed';
  }
  if (index === currentStopIndex) {
    return 'current';
  }
  return 'planned';
};

export const buildRouteStopSummaries = (
  route: LogisticsRouteSummary,
  assignments: LogisticsTruckAssignment[]
): RouteStopSummary[] => {
  const baseStopMap = new Map<
    string,
    {
      siteId: string;
      siteName: string;
      orderCount: number;
      totalValue: number;
    }
  >();

  route.orders.forEach((order) => {
    const siteId = order.customerId || order.customerName;
    const existing = baseStopMap.get(siteId);
    if (!existing) {
      baseStopMap.set(siteId, {
        siteId,
        siteName: order.customerName,
        orderCount: 1,
        totalValue: order.totalAmount,
      });
      return;
    }
    existing.orderCount += 1;
    existing.totalValue += order.totalAmount;
  });

  const stopIds = Array.from(baseStopMap.keys());
  const orderedIds = getOrderedStopIds(route.id, stopIds);

  const assignment = getRouteAssignment(route.id, assignments);
  const progress = assignment ? getTruckRouteProgress(assignment.truck.id) : null;
  const routeActive = Boolean(progress?.routeActive);
  const currentStopIndex = Math.max(0, progress?.currentStopIndex ?? 0);

  return orderedIds.map((siteId, index) => {
    const stop = baseStopMap.get(siteId);
    if (!stop) {
      return {
        id: `${route.id}-${siteId}`,
        routeId: route.id,
        routeLabel: route.label,
        siteId,
        siteName: siteId,
        orderCount: 0,
        totalValue: 0,
        orderIndex: index,
        status: 'planned',
        stopsAhead: 0,
        truckId: assignment?.truck.id,
        truckName: assignment?.truck.name,
      } satisfies RouteStopSummary;
    }

    const status = getRouteStopStatus(route, index, orderedIds.length, routeActive, currentStopIndex);
    const stopsAhead =
      routeActive && status === 'planned' ? Math.max(0, index - currentStopIndex) : status === 'current' ? 0 : -1;

    return {
      id: `${route.id}-${siteId}`,
      routeId: route.id,
      routeLabel: route.label,
      siteId,
      siteName: stop.siteName,
      orderCount: stop.orderCount,
      totalValue: stop.totalValue,
      orderIndex: index,
      status,
      stopsAhead,
      truckId: assignment?.truck.id,
      truckName: assignment?.truck.name,
    } satisfies RouteStopSummary;
  });
};

export const buildRouteLiveSummary = (
  route: LogisticsRouteSummary,
  assignments: LogisticsTruckAssignment[]
): RouteLiveSummary => {
  const stops = buildRouteStopSummaries(route, assignments);
  const currentStop = stops.find((stop) => stop.status === 'current');
  const completedStops = stops.filter((stop) => stop.status === 'completed').length;
  const assignment = getRouteAssignment(route.id, assignments);
  const progress = assignment ? getTruckRouteProgress(assignment.truck.id) : null;

  return {
    routeId: route.id,
    truckId: assignment?.truck.id,
    truckName: assignment?.truck.name,
    routeActive: Boolean(progress?.routeActive),
    completedStops,
    totalStops: stops.length,
    currentStopId: currentStop?.siteId,
    currentStopName: currentStop?.siteName,
  };
};

const statusPriority: Record<SiteDeliveryStatus, number> = {
  'in-route': 3,
  scheduled: 2,
  delivered: 1,
};

const mapStopStatusToSiteStatus = (status: RouteStopLiveStatus): SiteDeliveryStatus => {
  if (status === 'current') {
    return 'in-route';
  }
  if (status === 'planned') {
    return 'scheduled';
  }
  return 'delivered';
};

export const buildSiteDeliveryStatusMap = (
  routes: LogisticsRouteSummary[],
  assignments: LogisticsTruckAssignment[]
): Record<string, SiteDeliverySnapshot> => {
  const siteMap: Record<string, SiteDeliverySnapshot> = {};

  routes.forEach((route) => {
    const stops = buildRouteStopSummaries(route, assignments);
    stops.forEach((stop) => {
      const status = mapStopStatusToSiteStatus(stop.status);
      const nextSnapshot: SiteDeliverySnapshot = {
        siteId: stop.siteId,
        siteName: stop.siteName,
        status,
        routeId: route.id,
        routeLabel: route.label,
        stopsAhead: stop.stopsAhead < 0 ? 0 : stop.stopsAhead,
        truckId: stop.truckId,
        truckName: stop.truckName,
      };
      const existing = siteMap[stop.siteId];
      if (!existing || statusPriority[status] > statusPriority[existing.status]) {
        siteMap[stop.siteId] = nextSnapshot;
      }
    });
  });

  return siteMap;
};
