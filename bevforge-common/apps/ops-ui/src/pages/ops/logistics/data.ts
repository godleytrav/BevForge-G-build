import { apiGet, apiPost } from '@/lib/api';

export type LogisticsOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'approved'
  | 'in-packing'
  | 'packed'
  | 'loaded'
  | 'in-delivery'
  | 'delivered'
  | 'cancelled';

export interface LogisticsLineItem {
  id: string;
  productName: string;
  productCode?: string;
  skuId?: string;
  containerType: string;
  packageType?: string;
  packageFormatCode?: string;
  batchCode?: string;
  packageLotCode?: string;
  assetCode?: string;
  quantity: number;
}

export interface LogisticsOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: LogisticsOrderStatus;
  deliveryDate?: string;
  createdAt?: string;
  totalAmount: number;
  lineItems: LogisticsLineItem[];
}

export interface LogisticsSiteSummary {
  id: string;
  name: string;
  orderCount: number;
  activeOrderCount: number;
  deliveredOrderCount: number;
  onRouteOrderCount: number;
  nextDeliveryDate?: string;
  lastDeliveryDate?: string;
  orders: LogisticsOrder[];
}

export interface LogisticsSiteProfile {
  siteId: string;
  siteName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  deliveryWindow: string;
  receivingHours: string;
  dockNotes: string;
}

export interface LogisticsRouteSummary {
  id: string;
  dateKey: string;
  label: string;
  status: 'planning' | 'in-progress' | 'completed';
  orderCount: number;
  stopCount: number;
  orders: LogisticsOrder[];
}

export interface LogisticsTruckProfile {
  id: string;
  name: string;
  driver: string;
  homeBase: string;
  maxStops: number;
  vehicleType: LogisticsVehicleType;
  status: 'idle' | 'loading' | 'on-route' | 'maintenance';
}

export interface TruckPlanningPreference {
  truckId: string;
  targetType: 'none' | 'route' | 'site';
  targetId?: string;
}

export type LogisticsVehicleType = 'box-truck' | 'pickup-truck' | 'passenger-car';

export interface VehicleCapacityProfile {
  id: LogisticsVehicleType;
  label: string;
  maxPayloadLb: number;
  maxVolumeFt3: number;
  allowPallets: boolean;
  allowKegs: boolean;
}

export interface DeliveryScanEvent {
  id: string;
  orderId: string;
  truckId: string;
  stopId: string;
  stopName: string;
  scannedId: string;
  eventType: 'delivered' | 'returned';
  deliveredAt: string;
}

export interface TruckDispatchSnapshot {
  truckId: string;
  truckName: string;
  packagingId: string;
  destination: string;
  dispatchedAt: string;
  readiness: 'ready-for-delivery';
  totalItems: number;
  totalWeightLb: number;
  totalVolumeFt3: number;
  loadedPackagingIds: string[];
}

export interface TruckRouteProgress {
  truckId: string;
  routeActive: boolean;
  currentStopIndex: number;
  lastCompletedStopName?: string;
  deliveredByStop: Record<string, string[]>;
  updatedAt: string;
}

export interface LogisticsTruckAssignment {
  truck: LogisticsTruckProfile;
  status: LogisticsTruckProfile['status'];
  routeIds: string[];
  routeCount: number;
  stopCount: number;
  orderCount: number;
  nextRouteLabel?: string;
}

export interface OsSourceSnapshot {
  availableQty: number;
  lowStockItems: number;
  readyToReleaseLots: number;
  releasedLots: number;
}

export const defaultOsSourceSnapshot: OsSourceSnapshot = {
  availableQty: 0,
  lowStockItems: 0,
  readyToReleaseLots: 0,
  releasedLots: 0,
};

interface SharedOpsLogisticsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  fleet: LogisticsTruckProfile[];
  routeProgress: Record<string, TruckRouteProgress>;
  deliveryEvents: DeliveryScanEvent[];
  siteProfiles: Record<string, LogisticsSiteProfile>;
  truckDispatch: Record<string, TruckDispatchSnapshot>;
  truckPlanning: TruckPlanningPreference[];
}

const KNOWN_STATUSES: LogisticsOrderStatus[] = [
  'draft',
  'confirmed',
  'approved',
  'in-packing',
  'packed',
  'loaded',
  'in-delivery',
  'delivered',
  'cancelled',
];

const ACTIVE_ORDER_STATUSES = new Set<LogisticsOrderStatus>([
  'draft',
  'confirmed',
  'approved',
  'in-packing',
  'packed',
  'loaded',
  'in-delivery',
]);

const ROUTE_ORDER_STATUSES = new Set<LogisticsOrderStatus>([
  'approved',
  'in-packing',
  'packed',
  'loaded',
  'in-delivery',
]);

const NON_CANCELLED_COMPLETED_STATUSES = new Set<LogisticsOrderStatus>(['delivered', 'cancelled']);

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

const toDateKey = (value?: string): string => {
  if (!value) {
    return 'unscheduled';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return 'unscheduled';
  }
  return parsed.toISOString().slice(0, 10);
};

const toSiteFallbackId = (customerName: string, orderId: string): string => {
  const base = customerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? `site-${base}` : `site-${orderId}`;
};

const normalizeStatus = (value: unknown): LogisticsOrderStatus => {
  if (typeof value === 'string') {
    if (KNOWN_STATUSES.includes(value as LogisticsOrderStatus)) {
      return value as LogisticsOrderStatus;
    }
    switch (value) {
      case 'submitted':
        return 'confirmed';
      case 'reserved':
        return 'approved';
      case 'partially_reserved':
        return 'in-packing';
      case 'backordered':
        return 'confirmed';
      case 'ready_to_fulfill':
        return 'loaded';
      case 'fulfilled':
        return 'delivered';
      case 'canceled':
        return 'cancelled';
      default:
        break;
    }
  }
  return 'draft';
};

const normalizeLineItems = (value: unknown): LogisticsLineItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: toOptionalString(item.id) ?? `line-${index}`,
      productName: toOptionalString(item.product_name) ?? 'Unknown Product',
      productCode: toOptionalString(item.product_code ?? item.productCode),
      skuId: toOptionalString(item.sku_id ?? item.skuId),
      containerType: toOptionalString(item.container_type) ?? 'Package',
      packageType: toOptionalString(item.package_type ?? item.packageType),
      packageFormatCode: toOptionalString(item.package_format_code ?? item.packageFormatCode),
      batchCode: toOptionalString(item.batch_code ?? item.batchCode),
      packageLotCode: toOptionalString(item.package_lot_code ?? item.packageLotCode),
      assetCode: toOptionalString(item.asset_code ?? item.assetCode),
      quantity: Math.max(0, toNumber(item.quantity, 0)),
    }));
};

const normalizeOrders = (payload: unknown): LogisticsOrder[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(isRecord)
    .map((order, index) => {
      const id = toOptionalString(order.id) ?? `order-${index}`;
      const customerName =
        toOptionalString(order.customer_name) ?? toOptionalString(order.customerName) ?? 'Unknown Site';
      const customerId =
        toOptionalString(order.customer_id) ??
        toOptionalString(order.customerId) ??
        toSiteFallbackId(customerName, id);
      const totalAmount =
        toNumber(order.total_amount) || toNumber(order.total) || toNumber(order.line_total);

      return {
        id,
        orderNumber: toOptionalString(order.orderNumber) ?? id,
        customerId,
        customerName,
        status: normalizeStatus(order.status),
        deliveryDate:
          toOptionalString(order.delivery_date) ?? toOptionalString(order.deliveryDate),
        createdAt: toOptionalString(order.created_at) ?? toOptionalString(order.createdAt),
        totalAmount,
        lineItems: normalizeLineItems(order.lineItems),
      };
    });
};

const compareDateStrings = (a?: string, b?: string): number => {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }
  return new Date(a).valueOf() - new Date(b).valueOf();
};

const compareDateKeys = (a: string, b: string): number => {
  if (a === 'unscheduled' && b === 'unscheduled') {
    return 0;
  }
  if (a === 'unscheduled') {
    return 1;
  }
  if (b === 'unscheduled') {
    return -1;
  }
  return new Date(a).valueOf() - new Date(b).valueOf();
};

const formatRouteLabel = (dateKey: string): string => {
  if (dateKey === 'unscheduled') {
    return 'Unscheduled Route';
  }
  return DATE_FORMATTER.format(new Date(`${dateKey}T00:00:00`));
};

const parseInventorySnapshot = (payload: unknown): Pick<OsSourceSnapshot, 'availableQty' | 'lowStockItems'> => {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const summary = isRecord(root) && isRecord(root.summary) ? root.summary : null;

  if (!summary) {
    return {
      availableQty: 0,
      lowStockItems: 0,
    };
  }

  return {
    availableQty: toNumber(summary.availableValue),
    lowStockItems: toNumber(summary.lowStockItems),
  };
};

const parseBatchSnapshot = (
  payload: unknown
): Pick<OsSourceSnapshot, 'readyToReleaseLots' | 'releasedLots'> => {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const summary = isRecord(root) && isRecord(root.summary) ? root.summary : null;

  if (!summary) {
    return {
      readyToReleaseLots: 0,
      releasedLots: 0,
    };
  }

  return {
    readyToReleaseLots: toNumber(summary.readyToRelease),
    releasedLots: toNumber(summary.released),
  };
};

export const defaultLogisticsFleet: LogisticsTruckProfile[] = [
  {
    id: 'TRK-01',
    name: 'Northbound 01',
    driver: 'Alex Rivera',
    homeBase: 'Main Warehouse',
    maxStops: 10,
    vehicleType: 'box-truck',
    status: 'idle',
  },
  {
    id: 'TRK-02',
    name: 'City Loop 02',
    driver: 'Jordan Kim',
    homeBase: 'Main Warehouse',
    maxStops: 8,
    vehicleType: 'pickup-truck',
    status: 'idle',
  },
  {
    id: 'TRK-03',
    name: 'Reserve 03',
    driver: 'Maintenance Pool',
    homeBase: 'Service Bay',
    maxStops: 6,
    vehicleType: 'passenger-car',
    status: 'maintenance',
  },
];

const FLEET_STORAGE_KEY = 'ops-logistics-fleet-v1';
const ROUTE_PROGRESS_STORAGE_KEY = 'ops-logistics-route-progress-v1';
const DELIVERY_EVENTS_STORAGE_KEY = 'ops-logistics-delivery-events-v1';
const SITE_PROFILE_STORAGE_KEY = 'ops-logistics-site-profiles-v1';
const TRUCK_DISPATCH_STORAGE_KEY = 'ops-logistics-truck-dispatch-v1';
const TRUCK_PLANNING_STORAGE_KEY = 'ops-logistics-truck-planning-v1';
const LOGISTICS_STATE_API_PATH = '/api/ops/logistics/state';

const SEEDED_SITES: Array<{ id: string; name: string }> = [
  { id: 'site-joes-pub', name: "Joe's Pub" },
];

const SEEDED_SITE_PROFILES: LogisticsSiteProfile[] = [
  {
    siteId: 'site-joes-pub',
    siteName: "Joe's Pub",
    contactName: 'Joe Miller',
    phone: '(555) 210-4401',
    email: 'orders@joespub.test',
    address: '120 Dockside Ave, Test City, CA',
    deliveryWindow: '10:00 AM - 2:00 PM',
    receivingHours: 'Mon-Fri 9:00 AM - 5:00 PM',
    dockNotes: 'Rear alley dock, call ahead 15 minutes.',
  },
];

export const VEHICLE_CAPACITY: Record<LogisticsVehicleType, VehicleCapacityProfile> = {
  'box-truck': {
    id: 'box-truck',
    label: 'Box Truck',
    maxPayloadLb: 10000,
    maxVolumeFt3: 800,
    allowPallets: true,
    allowKegs: true,
  },
  'pickup-truck': {
    id: 'pickup-truck',
    label: 'Pickup Truck',
    maxPayloadLb: 1800,
    maxVolumeFt3: 70,
    allowPallets: false,
    allowKegs: true,
  },
  'passenger-car': {
    id: 'passenger-car',
    label: 'Passenger Car',
    maxPayloadLb: 850,
    maxVolumeFt3: 15,
    allowPallets: false,
    allowKegs: false,
  },
};

const canUseStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;
let logisticsStateHydrationPromise: Promise<void> | null = null;

const normalizeTruckProfile = (value: unknown): LogisticsTruckProfile | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = toOptionalString(value.id);
  const name = toOptionalString(value.name);
  const driver = toOptionalString(value.driver);
  const homeBase = toOptionalString(value.homeBase);
  const status = toOptionalString(value.status);
  const vehicleType = toOptionalString(value.vehicleType);
  const maxStops = Math.max(1, Math.floor(toNumber(value.maxStops, 1)));

  if (!id || !name || !homeBase) {
    return null;
  }

  const normalizedStatus: LogisticsTruckProfile['status'] =
    status === 'loading' || status === 'on-route' || status === 'maintenance' ? status : 'idle';
  const normalizedVehicleType: LogisticsVehicleType =
    vehicleType === 'pickup-truck' || vehicleType === 'passenger-car' ? vehicleType : 'box-truck';

  return {
    id,
    name,
    driver: driver ?? '',
    homeBase,
    maxStops,
    vehicleType: normalizedVehicleType,
    status: normalizedStatus,
  };
};

const normalizePlanningPreference = (value: unknown): TruckPlanningPreference | null => {
  if (!isRecord(value)) {
    return null;
  }
  const truckId = toOptionalString(value.truckId);
  const targetType = toOptionalString(value.targetType);
  const targetId = toOptionalString(value.targetId);
  if (!truckId) {
    return null;
  }
  const normalizedType: TruckPlanningPreference['targetType'] =
    targetType === 'route' || targetType === 'site' ? targetType : 'none';
  return {
    truckId,
    targetType: normalizedType,
    targetId,
  };
};

const writeTruckPlanningStorage = (preferences: TruckPlanningPreference[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(TRUCK_PLANNING_STORAGE_KEY, JSON.stringify(preferences));
};

const normalizeRouteProgress = (value: unknown): TruckRouteProgress | null => {
  if (!isRecord(value)) {
    return null;
  }
  const truckId = toOptionalString(value.truckId);
  if (!truckId) {
    return null;
  }
  const deliveredByStopValue = isRecord(value.deliveredByStop)
    ? Object.fromEntries(
        Object.entries(value.deliveredByStop).map(([stopId, ids]) => [
          stopId,
          Array.isArray(ids)
            ? ids.filter((entry): entry is string => typeof entry === 'string')
            : [],
        ]),
      )
    : {};

  return {
    truckId,
    routeActive: Boolean(value.routeActive),
    currentStopIndex: Math.max(0, Math.floor(toNumber(value.currentStopIndex, 0))),
    lastCompletedStopName: toOptionalString(value.lastCompletedStopName),
    deliveredByStop: deliveredByStopValue,
    updatedAt: toOptionalString(value.updatedAt) ?? new Date().toISOString(),
  };
};

const normalizeDeliveryEvent = (entry: unknown): DeliveryScanEvent | null => {
  if (!isRecord(entry)) {
    return null;
  }

  const eventType = toOptionalString(entry.eventType);
  const normalizedEventType: DeliveryScanEvent['eventType'] =
    eventType === 'returned' ? 'returned' : 'delivered';

  if (
    typeof entry.id !== 'string' ||
    typeof entry.orderId !== 'string' ||
    typeof entry.truckId !== 'string' ||
    typeof entry.stopId !== 'string' ||
    typeof entry.stopName !== 'string' ||
    typeof entry.scannedId !== 'string' ||
    typeof entry.deliveredAt !== 'string'
  ) {
    return null;
  }

  return {
    id: entry.id,
    orderId: entry.orderId,
    truckId: entry.truckId,
    stopId: entry.stopId,
    stopName: entry.stopName,
    scannedId: entry.scannedId,
    eventType: normalizedEventType,
    deliveredAt: entry.deliveredAt,
  };
};

const normalizeSiteProfile = (value: unknown): LogisticsSiteProfile | null => {
  if (!isRecord(value)) {
    return null;
  }
  const siteId = toOptionalString(value.siteId);
  const siteName = toOptionalString(value.siteName);
  if (!siteId || !siteName) {
    return null;
  }
  return {
    siteId,
    siteName,
    contactName: toOptionalString(value.contactName) ?? '',
    phone: toOptionalString(value.phone) ?? '',
    email: toOptionalString(value.email) ?? '',
    address: toOptionalString(value.address) ?? '',
    deliveryWindow: toOptionalString(value.deliveryWindow) ?? '',
    receivingHours: toOptionalString(value.receivingHours) ?? '',
    dockNotes: toOptionalString(value.dockNotes) ?? '',
  };
};

const normalizeDispatchSnapshot = (value: unknown): TruckDispatchSnapshot | null => {
  if (!isRecord(value)) {
    return null;
  }
  const truckId = toOptionalString(value.truckId);
  const truckName = toOptionalString(value.truckName);
  const packagingId = toOptionalString(value.packagingId);
  const destination = toOptionalString(value.destination);
  const dispatchedAt = toOptionalString(value.dispatchedAt);
  const readiness = toOptionalString(value.readiness);
  if (
    !truckId ||
    !truckName ||
    !packagingId ||
    !destination ||
    !dispatchedAt ||
    readiness !== 'ready-for-delivery'
  ) {
    return null;
  }
  return {
    truckId,
    truckName,
    packagingId,
    destination,
    dispatchedAt,
    readiness: 'ready-for-delivery',
    totalItems: Math.max(0, Math.floor(toNumber(value.totalItems, 0))),
    totalWeightLb: Math.max(0, toNumber(value.totalWeightLb, 0)),
    totalVolumeFt3: Math.max(0, toNumber(value.totalVolumeFt3, 0)),
    loadedPackagingIds: Array.isArray(value.loadedPackagingIds)
      ? value.loadedPackagingIds.filter((entry): entry is string => typeof entry === 'string')
      : [],
  };
};

const buildSharedLogisticsState = (): SharedOpsLogisticsState => ({
  schemaVersion: '1.0.0',
  id: 'ops-logistics-state',
  updatedAt: new Date().toISOString(),
  fleet: readFleetStorage(),
  routeProgress: readRouteProgressStorage(),
  deliveryEvents: readDeliveryEventsStorage(),
  siteProfiles: readSiteProfileStorage(),
  truckDispatch: readTruckDispatchStorage(),
  truckPlanning: getTruckPlanningPreferences(),
});

const shouldPromoteLocalLogisticsState = (): boolean =>
  Object.keys(readTruckDispatchStorage()).length > 0 ||
  Object.keys(readRouteProgressStorage()).length > 0 ||
  getTruckPlanningPreferences().length > 0 ||
  readDeliveryEventsStorage().length > 0;

const persistSharedLogisticsState = async (): Promise<void> => {
  const payload = buildSharedLogisticsState();
  await apiPost(LOGISTICS_STATE_API_PATH, payload);
};

const queuePersistSharedLogisticsState = () => {
  void (async () => {
    try {
      await persistSharedLogisticsState();
    } catch (error) {
      console.error('Failed to persist shared OPS logistics state', error);
    }
  })();
};

const applySharedLogisticsState = (payload: unknown) => {
  const row = isRecord(payload) ? payload : {};
  const localFleet = readFleetStorage();
  const localRouteProgress = readRouteProgressStorage();
  const localDeliveryEvents = readDeliveryEventsStorage();
  const localSiteProfiles = readSiteProfileStorage();
  const localTruckDispatch = readTruckDispatchStorage();
  const localTruckPlanning = getTruckPlanningPreferences();

  const fleet = Array.isArray(row.fleet)
    ? row.fleet
        .map(normalizeTruckProfile)
        .filter((truck): truck is LogisticsTruckProfile => truck !== null)
    : [];
  const routeProgress = isRecord(row.routeProgress)
    ? Object.fromEntries(
        Object.entries(row.routeProgress)
          .map(([truckId, value]) => [truckId, normalizeRouteProgress(value)])
          .filter((entry): entry is [string, TruckRouteProgress] => entry[1] !== null),
      )
    : {};
  const deliveryEvents = Array.isArray(row.deliveryEvents)
    ? row.deliveryEvents
        .map(normalizeDeliveryEvent)
        .filter((event): event is DeliveryScanEvent => event !== null)
    : [];
  const siteProfiles = isRecord(row.siteProfiles)
    ? Object.fromEntries(
        Object.entries(row.siteProfiles)
          .map(([siteId, value]) => [siteId, normalizeSiteProfile(value)])
          .filter((entry): entry is [string, LogisticsSiteProfile] => entry[1] !== null),
      )
    : {};
  const truckDispatch = isRecord(row.truckDispatch)
    ? Object.fromEntries(
        Object.entries(row.truckDispatch)
          .map(([truckId, value]) => [truckId, normalizeDispatchSnapshot(value)])
          .filter((entry): entry is [string, TruckDispatchSnapshot] => entry[1] !== null),
      )
    : {};
  const truckPlanning = Array.isArray(row.truckPlanning)
    ? row.truckPlanning
        .map(normalizePlanningPreference)
        .filter((item): item is TruckPlanningPreference => item !== null)
    : [];

  writeFleetStorage(fleet.length > 0 ? fleet : localFleet);
  writeRouteProgressStorage(
    Object.keys(routeProgress).length > 0 ? { ...localRouteProgress, ...routeProgress } : localRouteProgress,
  );
  writeDeliveryEventsStorage(deliveryEvents.length > 0 ? deliveryEvents : localDeliveryEvents);
  writeSiteProfileStorage({
    ...Object.fromEntries(SEEDED_SITE_PROFILES.map((profile) => [profile.siteId, profile])),
    ...localSiteProfiles,
    ...siteProfiles,
  });
  writeTruckDispatchStorage(
    Object.keys(truckDispatch).length > 0 ? { ...localTruckDispatch, ...truckDispatch } : localTruckDispatch,
  );
  writeTruckPlanningStorage(
    truckPlanning.length > 0
      ? [
          ...localTruckPlanning.filter(
            (entry) => !truckPlanning.some((remote) => remote.truckId === entry.truckId),
          ),
          ...truckPlanning,
        ]
      : localTruckPlanning,
  );
};

const hydrateSharedLogisticsState = async (): Promise<void> => {
  if (!canUseStorage()) {
    return;
  }
  if (!logisticsStateHydrationPromise) {
    logisticsStateHydrationPromise = (async () => {
      try {
        const payload = await apiGet<unknown>(LOGISTICS_STATE_API_PATH);
        applySharedLogisticsState(payload);
      } catch (error) {
        console.error('Failed to hydrate shared OPS logistics state', error);
      } finally {
        logisticsStateHydrationPromise = null;
      }
    })();
  }
  await logisticsStateHydrationPromise;
};

const readFleetStorage = (): LogisticsTruckProfile[] => {
  if (!canUseStorage()) {
    return defaultLogisticsFleet;
  }

  try {
    const raw = window.localStorage.getItem(FLEET_STORAGE_KEY);
    if (!raw) {
      return defaultLogisticsFleet;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultLogisticsFleet;
    }

    const trucks = parsed
      .map(normalizeTruckProfile)
      .filter((truck): truck is LogisticsTruckProfile => truck !== null);

    return trucks.length > 0 ? trucks : defaultLogisticsFleet;
  } catch {
    return defaultLogisticsFleet;
  }
};

const writeFleetStorage = (fleet: LogisticsTruckProfile[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(fleet));
};

export async function fetchFleetProfiles(): Promise<LogisticsTruckProfile[]> {
  await hydrateSharedLogisticsState();
  if (shouldPromoteLocalLogisticsState()) {
    queuePersistSharedLogisticsState();
  }
  return readFleetStorage();
}

export async function saveFleetProfiles(fleet: LogisticsTruckProfile[]): Promise<void> {
  writeFleetStorage(fleet);
  await persistSharedLogisticsState();
}

export async function upsertFleetProfile(profile: LogisticsTruckProfile): Promise<LogisticsTruckProfile[]> {
  const existing = readFleetStorage();
  const next = [...existing];
  const index = next.findIndex((truck) => truck.id === profile.id);
  if (index >= 0) {
    next[index] = profile;
  } else {
    next.push(profile);
  }
  writeFleetStorage(next);
  await persistSharedLogisticsState();
  return next;
}

const readRouteProgressStorage = (): Record<string, TruckRouteProgress> => {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ROUTE_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as Record<string, TruckRouteProgress>) : {};
  } catch {
    return {};
  }
};

const writeRouteProgressStorage = (payload: Record<string, TruckRouteProgress>) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ROUTE_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
};

export function getTruckRouteProgress(truckId: string): TruckRouteProgress {
  const map = readRouteProgressStorage();
  const existing = map[truckId];
  if (existing && typeof existing.currentStopIndex === 'number' && isRecord(existing.deliveredByStop)) {
    return existing;
  }

  return {
    truckId,
    routeActive: false,
    currentStopIndex: 0,
    lastCompletedStopName: undefined,
    deliveredByStop: {},
    updatedAt: new Date().toISOString(),
  };
}

export function saveTruckRouteProgress(progress: TruckRouteProgress): void {
  const map = readRouteProgressStorage();
  map[progress.truckId] = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };
  writeRouteProgressStorage(map);
  queuePersistSharedLogisticsState();
}

const readDeliveryEventsStorage = (): DeliveryScanEvent[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DELIVERY_EVENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry): DeliveryScanEvent | null => {
        if (!isRecord(entry)) {
          return null;
        }

        const eventType = toOptionalString(entry.eventType);
        const normalizedEventType: DeliveryScanEvent['eventType'] =
          eventType === 'returned' ? 'returned' : 'delivered';

        if (
          typeof entry.id !== 'string' ||
          typeof entry.orderId !== 'string' ||
          typeof entry.truckId !== 'string' ||
          typeof entry.stopId !== 'string' ||
          typeof entry.stopName !== 'string' ||
          typeof entry.scannedId !== 'string' ||
          typeof entry.deliveredAt !== 'string'
        ) {
          return null;
        }

        return {
          id: entry.id,
          orderId: entry.orderId,
          truckId: entry.truckId,
          stopId: entry.stopId,
          stopName: entry.stopName,
          scannedId: entry.scannedId,
          eventType: normalizedEventType,
          deliveredAt: entry.deliveredAt,
        };
      })
      .filter((event): event is DeliveryScanEvent => event !== null);
  } catch {
    return [];
  }
};

const writeDeliveryEventsStorage = (events: DeliveryScanEvent[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(DELIVERY_EVENTS_STORAGE_KEY, JSON.stringify(events));
};

export function recordDeliveryScanEvent(
  event: Omit<DeliveryScanEvent, 'id' | 'deliveredAt' | 'eventType'> & {
    eventType?: DeliveryScanEvent['eventType'];
  }
): DeliveryScanEvent {
  const next: DeliveryScanEvent = {
    ...event,
    eventType: event.eventType ?? 'delivered',
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    deliveredAt: new Date().toISOString(),
  };

  const existing = readDeliveryEventsStorage();
  existing.push(next);
  writeDeliveryEventsStorage(existing);
  queuePersistSharedLogisticsState();
  return next;
}

export function getDeliveryScanEvents(
  orderId?: string,
  eventType?: DeliveryScanEvent['eventType']
): DeliveryScanEvent[] {
  const events = readDeliveryEventsStorage();
  return events.filter((event) => {
    if (orderId && event.orderId !== orderId) {
      return false;
    }
    if (eventType && event.eventType !== eventType) {
      return false;
    }
    return true;
  });
}

export function getVehicleCapacity(vehicleType: LogisticsVehicleType): VehicleCapacityProfile {
  return VEHICLE_CAPACITY[vehicleType];
}

const readSiteProfileStorage = (): Record<string, LogisticsSiteProfile> => {
  if (!canUseStorage()) {
    return Object.fromEntries(SEEDED_SITE_PROFILES.map((profile) => [profile.siteId, profile]));
  }

  try {
    const raw = window.localStorage.getItem(SITE_PROFILE_STORAGE_KEY);
    if (!raw) {
      return Object.fromEntries(SEEDED_SITE_PROFILES.map((profile) => [profile.siteId, profile]));
    }
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return Object.fromEntries(SEEDED_SITE_PROFILES.map((profile) => [profile.siteId, profile]));
    }
    return parsed as Record<string, LogisticsSiteProfile>;
  } catch {
    return Object.fromEntries(SEEDED_SITE_PROFILES.map((profile) => [profile.siteId, profile]));
  }
};

const writeSiteProfileStorage = (profiles: Record<string, LogisticsSiteProfile>) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(SITE_PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

const makeDefaultSiteProfile = (siteId: string, siteName: string): LogisticsSiteProfile => ({
  siteId,
  siteName,
  contactName: '',
  phone: '',
  email: '',
  address: '',
  deliveryWindow: '',
  receivingHours: '',
  dockNotes: '',
});

export function getSiteProfile(siteId: string, siteName: string): LogisticsSiteProfile {
  const map = readSiteProfileStorage();
  return map[siteId] ?? makeDefaultSiteProfile(siteId, siteName);
}

export function saveSiteProfile(profile: LogisticsSiteProfile): void {
  const map = readSiteProfileStorage();
  map[profile.siteId] = profile;
  writeSiteProfileStorage(map);
  queuePersistSharedLogisticsState();
}

const readTruckDispatchStorage = (): Record<string, TruckDispatchSnapshot> => {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(TRUCK_DISPATCH_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return {};
    }
    return parsed as Record<string, TruckDispatchSnapshot>;
  } catch {
    return {};
  }
};

const writeTruckDispatchStorage = (value: Record<string, TruckDispatchSnapshot>) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(TRUCK_DISPATCH_STORAGE_KEY, JSON.stringify(value));
};

export function saveTruckDispatchSnapshot(snapshot: TruckDispatchSnapshot): void {
  const map = readTruckDispatchStorage();
  map[snapshot.truckId] = snapshot;
  writeTruckDispatchStorage(map);
  queuePersistSharedLogisticsState();
}

export function getTruckDispatchSnapshot(truckId: string): TruckDispatchSnapshot | null {
  const map = readTruckDispatchStorage();
  return map[truckId] ?? null;
}

export function getTruckPlanningPreferences(): TruckPlanningPreference[] {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(TRUCK_PLANNING_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizePlanningPreference)
      .filter((item): item is TruckPlanningPreference => item !== null);
  } catch {
    return [];
  }
}

export function saveTruckPlanningPreference(preference: TruckPlanningPreference): TruckPlanningPreference[] {
  const existing = getTruckPlanningPreferences();
  const filtered = existing.filter((item) => item.truckId !== preference.truckId);
  const next = preference.targetType === 'none' ? filtered : [...filtered, preference];
  writeTruckPlanningStorage(next);
  queuePersistSharedLogisticsState();
  return next;
}

export async function fetchLogisticsOrders(): Promise<LogisticsOrder[]> {
  try {
    const payload = await apiGet<unknown>('/api/orders');
    return normalizeOrders(payload);
  } catch (error) {
    console.error('Failed to fetch OPS logistics orders', error);
    return [];
  }
}

export async function fetchOsSourceSnapshot(): Promise<OsSourceSnapshot> {
  try {
    const [inventoryResult, batchResult] = await Promise.allSettled([
      apiGet<unknown>('/api/os/inventory'),
      apiGet<unknown>('/api/os/batches'),
    ]);

    const inventoryData =
      inventoryResult.status === 'fulfilled'
        ? parseInventorySnapshot(inventoryResult.value)
        : { availableQty: 0, lowStockItems: 0 };

    const batchData =
      batchResult.status === 'fulfilled'
        ? parseBatchSnapshot(batchResult.value)
        : { readyToReleaseLots: 0, releasedLots: 0 };

    return {
      availableQty: inventoryData.availableQty,
      lowStockItems: inventoryData.lowStockItems,
      readyToReleaseLots: batchData.readyToReleaseLots,
      releasedLots: batchData.releasedLots,
    };
  } catch (error) {
    console.error('Failed to fetch OS source snapshot for OPS logistics', error);
    return defaultOsSourceSnapshot;
  }
}

export function isActiveLogisticsStatus(status: LogisticsOrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.has(status);
}

export function isRouteStatus(status: LogisticsOrderStatus): boolean {
  return ROUTE_ORDER_STATUSES.has(status);
}

export function formatDate(value?: string): string {
  if (!value) {
    return 'Not scheduled';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return 'Not scheduled';
  }
  return DATE_FORMATTER.format(parsed);
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return 'Not available';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return 'Not available';
  }
  return DATE_TIME_FORMATTER.format(parsed);
}

export function buildSiteSummaries(orders: LogisticsOrder[]): LogisticsSiteSummary[] {
  const siteMap = new Map<string, LogisticsSiteSummary>();
  const now = new Date();

  orders.forEach((order) => {
    const siteId = order.customerId || toSiteFallbackId(order.customerName, order.id);
    const existing = siteMap.get(siteId);

    if (!existing) {
      siteMap.set(siteId, {
        id: siteId,
        name: order.customerName,
        orderCount: 0,
        activeOrderCount: 0,
        deliveredOrderCount: 0,
        onRouteOrderCount: 0,
        nextDeliveryDate: undefined,
        lastDeliveryDate: undefined,
        orders: [],
      });
    }

    const site = siteMap.get(siteId);
    if (!site) {
      return;
    }

    site.orderCount += 1;
    site.orders.push(order);

    if (isActiveLogisticsStatus(order.status)) {
      site.activeOrderCount += 1;
    }

    if (isRouteStatus(order.status)) {
      site.onRouteOrderCount += 1;
    }

    if (order.status === 'delivered') {
      site.deliveredOrderCount += 1;
    }

    if (order.deliveryDate) {
      const deliveryDate = new Date(order.deliveryDate);
      if (!Number.isNaN(deliveryDate.valueOf())) {
        if (deliveryDate >= now && isActiveLogisticsStatus(order.status)) {
          if (
            !site.nextDeliveryDate ||
            compareDateStrings(order.deliveryDate, site.nextDeliveryDate) < 0
          ) {
            site.nextDeliveryDate = order.deliveryDate;
          }
        }

        if (order.status === 'delivered') {
          if (
            !site.lastDeliveryDate ||
            compareDateStrings(order.deliveryDate, site.lastDeliveryDate) > 0
          ) {
            site.lastDeliveryDate = order.deliveryDate;
          }
        }
      }
    }
  });

  SEEDED_SITES.forEach((site) => {
    if (siteMap.has(site.id)) {
      return;
    }

    siteMap.set(site.id, {
      id: site.id,
      name: site.name,
      orderCount: 0,
      activeOrderCount: 0,
      deliveredOrderCount: 0,
      onRouteOrderCount: 0,
      nextDeliveryDate: undefined,
      lastDeliveryDate: undefined,
      orders: [],
    });
  });

  return Array.from(siteMap.values()).sort((a, b) => {
    if (b.activeOrderCount !== a.activeOrderCount) {
      return b.activeOrderCount - a.activeOrderCount;
    }
    return a.name.localeCompare(b.name);
  });
}

export function buildRouteSummaries(orders: LogisticsOrder[]): LogisticsRouteSummary[] {
  const routeMap = new Map<string, LogisticsRouteSummary>();

  orders.forEach((order) => {
    const dateKey = toDateKey(order.deliveryDate);
    const routeId = `route-${dateKey}`;
    const existing = routeMap.get(routeId);

    if (!existing) {
      routeMap.set(routeId, {
        id: routeId,
        dateKey,
        label: formatRouteLabel(dateKey),
        status: 'planning',
        orderCount: 0,
        stopCount: 0,
        orders: [],
      });
    }

    const route = routeMap.get(routeId);
    if (!route) {
      return;
    }

    route.orderCount += 1;
    route.orders.push(order);
  });

  return Array.from(routeMap.values())
    .map((route) => {
      const uniqueStops = new Set(route.orders.map((order) => order.customerId || order.customerName));
      const hasInProgressOrder = route.orders.some((order) => order.status === 'in-delivery');
      const allCompleted = route.orders.every((order) => NON_CANCELLED_COMPLETED_STATUSES.has(order.status));
      const routeStatus: LogisticsRouteSummary['status'] = hasInProgressOrder
        ? 'in-progress'
        : allCompleted
          ? 'completed'
          : 'planning';

      return {
        ...route,
        stopCount: uniqueStops.size,
        status: routeStatus,
      };
    })
    .sort((a, b) => compareDateKeys(a.dateKey, b.dateKey));
}

export function buildTruckAssignments(
  routes: LogisticsRouteSummary[],
  fleet: LogisticsTruckProfile[] = defaultLogisticsFleet,
  planningPreferences: TruckPlanningPreference[] = getTruckPlanningPreferences()
): LogisticsTruckAssignment[] {
  const assignments = fleet.map((truck) => ({
    truck,
    status: truck.status,
    routeIds: [] as string[],
    routeCount: 0,
    stopCount: 0,
    orderCount: 0,
    nextRouteLabel: undefined as string | undefined,
  }));

  const assignableIndexes = assignments
    .map((assignment, index) => ({ index, status: assignment.status }))
    .filter((assignment) => assignment.status !== 'maintenance')
    .map((assignment) => assignment.index);

  if (assignableIndexes.length === 0) {
    return assignments;
  }

  const activeRoutes = routes.filter((route) => route.status !== 'completed');
  const unassignedRouteIds = new Set(activeRoutes.map((route) => route.id));

  const applyRouteToAssignment = (route: LogisticsRouteSummary, assignmentIndex: number) => {
    const target = assignments[assignmentIndex];
    target.routeIds.push(route.id);
    target.routeCount += 1;
    target.stopCount += route.stopCount;
    target.orderCount += route.orderCount;
    if (!target.nextRouteLabel) {
      target.nextRouteLabel = route.label;
    }
    if (target.status !== 'maintenance') {
      target.status = route.status === 'in-progress' ? 'on-route' : 'loading';
    }
    unassignedRouteIds.delete(route.id);
  };

  planningPreferences.forEach((preference) => {
    const assignmentIndex = assignments.findIndex((assignment) => assignment.truck.id === preference.truckId);
    if (assignmentIndex < 0) {
      return;
    }
    if (assignments[assignmentIndex].status === 'maintenance') {
      return;
    }

    if (preference.targetType === 'route' && preference.targetId) {
      const route = activeRoutes.find((candidate) => candidate.id === preference.targetId);
      if (!route || !unassignedRouteIds.has(route.id)) {
        return;
      }
      applyRouteToAssignment(route, assignmentIndex);
      return;
    }

    if (preference.targetType === 'site' && preference.targetId) {
      const route = activeRoutes.find(
        (candidate) =>
          unassignedRouteIds.has(candidate.id) &&
          candidate.orders.some(
            (order) => (order.customerId || order.customerName) === preference.targetId
          )
      );
      if (!route) {
        return;
      }
      applyRouteToAssignment(route, assignmentIndex);
    }
  });

  Array.from(unassignedRouteIds).forEach((routeId, index) => {
    const route = activeRoutes.find((candidate) => candidate.id === routeId);
    if (!route) {
      return;
    }
    const assignmentIndex = assignableIndexes[index % assignableIndexes.length];
    applyRouteToAssignment(route, assignmentIndex);
  });

  return assignments;
}
