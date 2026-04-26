/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type FlowCatalogProduct,
  type FlowKegAssignment,
  type FlowMenuItem,
  FLOW_PRIMARY_SITE_ID,
  type FlowPourEvent,
  type FlowTap,
  type FlowTapAssignment,
  flowCatalogProducts,
  flowKegAssignments,
  flowMenuItems,
  flowTapAssignments,
  flowPourEvents,
  flowSessions,
  flowTaps,
  type FlowSession,
} from "./data";

export type FlowRuntimeTapState = "ready" | "pouring" | "blocked" | "offline";
export type FlowSyncStatus = "online" | "offline" | "retrying";

export interface FlowQueuedEvent {
  event: FlowPourEvent;
  queueStatus: "queued" | "sent" | "accepted" | "failed";
  retries: number;
  lastAttemptAt?: string;
  lastError?: string;
}

export interface FlowControlIntent {
  id: string;
  tapId: string;
  intentType: "set_temp" | "set_co2" | "pause_tap" | "resume_tap" | "line_clean";
  requestedAt: string;
  requestedBy: string;
  targetTempC?: number;
  targetCo2Vol?: number;
  status: "queued" | "sent" | "acknowledged";
}

export interface FlowAuthorizePourRequest {
  siteId: string;
  tapAssignmentId?: string;
  tapId: string;
  productId?: string;
  productCode?: string;
  skuId: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  labelVersionId?: string;
  eventId: string;
  pourSizeOz: number;
  mode: "self_serve" | "bartender";
  sessionId?: string;
  token?: string;
}

export interface FlowAuthorizePourResponse {
  requestId: string;
  decision: "approved" | "blocked";
  reason?: string;
}

interface FlowRuntimeSnapshot {
  syncStatus: FlowSyncStatus;
  activeSiteId: string;
  tapStates: Record<string, FlowRuntimeTapState>;
  queuedEvents: FlowQueuedEvent[];
  sessions: FlowSession[];
  controlIntents: FlowControlIntent[];
}

interface CreatePourEventInput {
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  volume: number;
  uom: string;
  sourceMode: FlowPourEvent["sourceMode"];
  assignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  labelVersionId?: string;
  sessionId?: string;
  actorId?: string;
  durationMs?: number;
  eventId?: string;
}

interface CreateControlIntentInput {
  tapId: string;
  intentType: FlowControlIntent["intentType"];
  requestedBy: string;
  targetTempC?: number;
  targetCo2Vol?: number;
}

interface FlowRuntimeContextValue {
  syncStatus: FlowSyncStatus;
  setSyncStatus: (status: FlowSyncStatus) => void;
  activeSiteId: string;
  setActiveSiteId: (siteId: string) => void;
  taps: FlowTap[];
  assignments: FlowKegAssignment[];
  menuItems: FlowMenuItem[];
  products: FlowCatalogProduct[];
  tapAssignments: FlowTapAssignment[];
  tapStates: Record<string, FlowRuntimeTapState>;
  setTapState: (tapId: string, nextState: FlowRuntimeTapState) => void;
  queuedEvents: FlowQueuedEvent[];
  queueEvent: (input: CreatePourEventInput) => FlowPourEvent;
  runSyncPass: () => void;
  sessions: FlowSession[];
  upsertSessionStatus: (sessionId: string, status: FlowSession["status"]) => void;
  controlIntents: FlowControlIntent[];
  createControlIntent: (input: CreateControlIntentInput) => FlowControlIntent;
  buildAuthorizePourRequest: (args: {
    tapAssignmentId?: string;
    tapId: string;
    productId?: string;
    productCode?: string;
    skuId: string;
    packageLotId?: string;
    packageLotCode?: string;
    assetId?: string;
    assetCode?: string;
    labelVersionId?: string;
    pourSizeOz: number;
    mode: "self_serve" | "bartender";
    sessionId?: string;
    token?: string;
  }) => FlowAuthorizePourRequest;
  authorizePourStub: (request: FlowAuthorizePourRequest) => FlowAuthorizePourResponse;
}

const FLOW_RUNTIME_STORAGE_KEY = "bevforge.flow.runtime.snapshot.v1";

const defaultTapStateByStatus: Record<FlowRuntimeTapState, FlowRuntimeTapState> = {
  ready: "ready",
  pouring: "pouring",
  blocked: "blocked",
  offline: "offline",
};

const getDefaultTapState = (): Record<string, FlowRuntimeTapState> => {
  const result: Record<string, FlowRuntimeTapState> = {};
  flowTaps.forEach((tap) => {
    if (tap.status === "online") {
      result[tap.id] = defaultTapStateByStatus.ready;
      return;
    }
    if (tap.status === "maintenance") {
      result[tap.id] = defaultTapStateByStatus.blocked;
      return;
    }
    result[tap.id] = defaultTapStateByStatus.offline;
  });
  return result;
};

const createFallbackSnapshot = (): FlowRuntimeSnapshot => ({
  syncStatus: "online",
  activeSiteId: FLOW_PRIMARY_SITE_ID,
  tapStates: getDefaultTapState(),
  queuedEvents: [],
  sessions: flowSessions,
  controlIntents: [],
});

const toIsoNow = (): string => new Date().toISOString();

const toIdSuffix = (): string => Math.random().toString(36).slice(2, 8);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asTapState = (value: unknown): FlowRuntimeTapState | undefined => {
  if (value === "ready" || value === "pouring" || value === "blocked" || value === "offline") {
    return value;
  }
  return undefined;
};

const normalizeTapStates = (value: unknown): Record<string, FlowRuntimeTapState> => {
  const defaults = getDefaultTapState();
  if (!isRecord(value)) {
    return defaults;
  }

  const next: Record<string, FlowRuntimeTapState> = { ...defaults };
  Object.entries(value).forEach(([tapId, tapState]) => {
    const normalized = asTapState(tapState);
    if (normalized) {
      next[tapId] = normalized;
    }
  });
  return next;
};

const normalizeQueueStatus = (
  value: unknown
): FlowQueuedEvent["queueStatus"] | undefined => {
  if (value === "queued" || value === "sent" || value === "accepted" || value === "failed") {
    return value;
  }
  return undefined;
};

const normalizeSourceMode = (
  value: unknown
): FlowPourEvent["sourceMode"] | undefined => {
  if (value === "bartender" || value === "self_serve" || value === "test" || value === "maintenance") {
    return value;
  }
  return undefined;
};

const normalizeQueuedEvents = (value: unknown): FlowQueuedEvent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const next: FlowQueuedEvent[] = [];
  value.forEach((entry) => {
    if (!isRecord(entry) || !isRecord(entry.event)) {
      return;
    }

    const eventId = asString(entry.event.eventId);
    const siteId = asString(entry.event.siteId);
    const tapId = asString(entry.event.tapId);
    const sourceMode = normalizeSourceMode(entry.event.sourceMode);
    const volume = asNumber(entry.event.volume);
    const uom = asString(entry.event.uom);
    const occurredAt = asString(entry.event.occurredAt);
    const queueStatus = normalizeQueueStatus(entry.queueStatus);

    if (!eventId || !siteId || !tapId || !sourceMode || typeof volume !== "number" || !uom || !occurredAt || !queueStatus) {
      return;
    }

    next.push({
      event: {
        schemaVersion: asString(entry.event.schemaVersion) ?? "0.1.0",
        eventId,
        siteId,
        tapId,
        tapAssignmentId: asString(entry.event.tapAssignmentId),
        assignmentId: asString(entry.event.assignmentId),
        kegAssetId: asString(entry.event.kegAssetId),
        assetId: asString(entry.event.assetId),
        assetCode: asString(entry.event.assetCode),
        productId: asString(entry.event.productId),
        productCode: asString(entry.event.productCode),
        skuId: asString(entry.event.skuId),
        batchId: asString(entry.event.batchId),
        packageLotId: asString(entry.event.packageLotId),
        packageLotCode: asString(entry.event.packageLotCode),
        labelVersionId: asString(entry.event.labelVersionId),
        volume,
        uom,
        durationMs: asNumber(entry.event.durationMs),
        sourceMode,
        sessionId: asString(entry.event.sessionId),
        actorId: asString(entry.event.actorId),
        occurredAt,
      },
      queueStatus,
      retries: asNumber(entry.retries) ?? 0,
      lastAttemptAt: asString(entry.lastAttemptAt),
      lastError: asString(entry.lastError),
    });
  });

  return next;
};

const normalizeSessionStatus = (value: unknown): FlowSession["status"] | undefined => {
  if (value === "active" || value === "paused" || value === "closed" || value === "blocked") {
    return value;
  }
  return undefined;
};

const normalizeSessionMode = (value: unknown): FlowSession["mode"] | undefined => {
  if (value === "self_serve" || value === "bartender" || value === "test") {
    return value;
  }
  return undefined;
};

const normalizeSessions = (value: unknown): FlowSession[] => {
  if (!Array.isArray(value)) {
    return flowSessions;
  }

  const next: FlowSession[] = [];
  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const id = asString(entry.id);
    const siteId = asString(entry.siteId);
    const status = normalizeSessionStatus(entry.status);
    const mode = normalizeSessionMode(entry.mode);
    const limitQty = asNumber(entry.limitQty);
    const consumedQty = asNumber(entry.consumedQty);
    const uom = asString(entry.uom);
    const startedAt = asString(entry.startedAt);
    const updatedAt = asString(entry.updatedAt);

    if (!id || !siteId || !status || !mode || typeof limitQty !== "number" || typeof consumedQty !== "number" || !uom || !startedAt || !updatedAt) {
      return;
    }

    const allowedTapIds = Array.isArray(entry.allowedTapIds)
      ? entry.allowedTapIds.filter((item): item is string => typeof item === "string")
      : undefined;

    next.push({
      schemaVersion: asString(entry.schemaVersion) ?? "0.1.0",
      id,
      siteId,
      status,
      mode,
      customerToken: asString(entry.customerToken),
      actorId: asString(entry.actorId),
      limitQty,
      consumedQty,
      uom,
      allowedTapIds,
      startedAt,
      endedAt: asString(entry.endedAt),
      updatedAt,
    });
  });

  return next.length > 0 ? next : flowSessions;
};

const normalizeControlIntentStatus = (
  value: unknown
): FlowControlIntent["status"] | undefined => {
  if (value === "queued" || value === "sent" || value === "acknowledged") {
    return value;
  }
  return undefined;
};

const normalizeControlIntentType = (
  value: unknown
): FlowControlIntent["intentType"] | undefined => {
  if (
    value === "set_temp" ||
    value === "set_co2" ||
    value === "pause_tap" ||
    value === "resume_tap" ||
    value === "line_clean"
  ) {
    return value;
  }
  return undefined;
};

const normalizeControlIntents = (value: unknown): FlowControlIntent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const next: FlowControlIntent[] = [];
  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const id = asString(entry.id);
    const tapId = asString(entry.tapId);
    const intentType = normalizeControlIntentType(entry.intentType);
    const requestedAt = asString(entry.requestedAt);
    const requestedBy = asString(entry.requestedBy);
    const status = normalizeControlIntentStatus(entry.status);

    if (!id || !tapId || !intentType || !requestedAt || !requestedBy || !status) {
      return;
    }

    next.push({
      id,
      tapId,
      intentType,
      requestedAt,
      requestedBy,
      targetTempC: asNumber(entry.targetTempC),
      targetCo2Vol: asNumber(entry.targetCo2Vol),
      status,
    });
  });

  return next;
};

const normalizeRuntimeTaps = (value: unknown): FlowTap[] => {
  if (!Array.isArray(value)) {
    return flowTaps;
  }

  const next = value
    .filter((entry): entry is FlowTap => {
      return (
        isRecord(entry) &&
        Boolean(asString(entry.id)) &&
        Boolean(asString(entry.siteId)) &&
        Boolean(asString(entry.name))
      );
    })
    .map((entry) => ({
      ...entry,
      schemaVersion: asString(entry.schemaVersion) ?? "0.1.0",
      id: asString(entry.id)!,
      siteId: asString(entry.siteId)!,
      name: asString(entry.name)!,
      status:
        entry.status === "online" || entry.status === "offline" || entry.status === "maintenance" || entry.status === "disabled"
          ? entry.status
          : "offline",
      meterType:
        entry.meterType === "hall_effect" || entry.meterType === "pulse_meter" || entry.meterType === "none" || entry.meterType === "other"
          ? entry.meterType
          : "other",
      displayOrder: asNumber(entry.displayOrder),
      temperatureProbeId: asString(entry.temperatureProbeId),
      lineTempC: asNumber(entry.lineTempC),
      flowRateOzPerMin: asNumber(entry.flowRateOzPerMin),
      notes: asString(entry.notes),
      createdAt: asString(entry.createdAt) ?? new Date(0).toISOString(),
      updatedAt: asString(entry.updatedAt) ?? new Date(0).toISOString(),
    }));

  return next.length > 0 ? next : flowTaps;
};

const normalizeRuntimeAssignments = (value: unknown): FlowKegAssignment[] => {
  if (!Array.isArray(value)) {
    return flowKegAssignments;
  }

  const next = value
    .filter((entry): entry is FlowKegAssignment => {
      return (
        isRecord(entry) &&
        Boolean(asString(entry.id)) &&
        Boolean(asString(entry.siteId)) &&
        Boolean(asString(entry.tapId)) &&
        Boolean(asString(entry.skuId)) &&
        typeof asNumber(entry.startQty) === "number" &&
        typeof asNumber(entry.remainingQty) === "number"
      );
    })
    .map((entry) => ({
      ...entry,
      schemaVersion: asString(entry.schemaVersion) ?? "0.1.0",
      id: asString(entry.id)!,
      siteId: asString(entry.siteId)!,
      tapId: asString(entry.tapId)!,
      tapAssignmentId: asString(entry.tapAssignmentId),
      kegAssetId: asString(entry.kegAssetId),
      assetId: asString(entry.assetId),
      assetCode: asString(entry.assetCode),
      productId: asString(entry.productId),
      productCode: asString(entry.productCode),
      skuId: asString(entry.skuId)!,
      batchId: asString(entry.batchId),
      packageLotId: asString(entry.packageLotId),
      packageLotCode: asString(entry.packageLotCode),
      lotId: asString(entry.lotId),
      labelVersionId: asString(entry.labelVersionId),
      uom: asString(entry.uom) ?? "oz",
      startQty: asNumber(entry.startQty) ?? 0,
      remainingQty: asNumber(entry.remainingQty) ?? 0,
      status:
        entry.status === "active" || entry.status === "empty" || entry.status === "removed" || entry.status === "error"
          ? entry.status
          : "error",
      assignedAt: asString(entry.assignedAt) ?? new Date(0).toISOString(),
      endedAt: asString(entry.endedAt),
      updatedAt: asString(entry.updatedAt) ?? new Date(0).toISOString(),
    }));

  return next.length > 0 ? next : flowKegAssignments;
};

const normalizeRuntimeMenuItems = (value: unknown): FlowMenuItem[] => {
  if (!Array.isArray(value)) {
    return flowMenuItems;
  }

  const next = value
    .filter((entry): entry is FlowMenuItem => {
      return (
        isRecord(entry) &&
        Boolean(asString(entry.id)) &&
        Boolean(asString(entry.siteId)) &&
        Boolean(asString(entry.skuId)) &&
        Boolean(asString(entry.name))
      );
    })
    .map((entry) => ({
      ...entry,
      schemaVersion: asString(entry.schemaVersion) ?? "0.1.0",
      id: asString(entry.id)!,
      siteId: asString(entry.siteId)!,
      tapAssignmentId: asString(entry.tapAssignmentId),
      tapId: asString(entry.tapId),
      productId: asString(entry.productId),
      productCode: asString(entry.productCode),
      skuId: asString(entry.skuId)!,
      batchId: asString(entry.batchId),
      packageLotId: asString(entry.packageLotId),
      packageLotCode: asString(entry.packageLotCode),
      assetId: asString(entry.assetId),
      assetCode: asString(entry.assetCode),
      labelVersionId: asString(entry.labelVersionId),
      name: asString(entry.name)!,
      style: asString(entry.style),
      abv: asNumber(entry.abv),
      ibu: asNumber(entry.ibu),
      servingTempC: asNumber(entry.servingTempC),
      tastingNotes: asString(entry.tastingNotes),
      status:
        entry.status === "on_tap" || entry.status === "coming_soon" || entry.status === "out_of_stock" || entry.status === "hidden"
          ? entry.status
          : "hidden",
      story: asString(entry.story),
      imageUrl: asString(entry.imageUrl),
      imageAssetId: asString(entry.imageAssetId),
      createdAt: asString(entry.createdAt) ?? new Date(0).toISOString(),
      updatedAt: asString(entry.updatedAt) ?? new Date(0).toISOString(),
    }));

  return next.length > 0 ? next : flowMenuItems;
};

const normalizeRuntimeProducts = (value: unknown): FlowCatalogProduct[] => {
  if (!Array.isArray(value)) {
    return flowCatalogProducts;
  }

  const next = value
    .filter((entry): entry is FlowCatalogProduct => {
      return (
        isRecord(entry) &&
        Boolean(asString(entry.productId)) &&
        Boolean(asString(entry.name))
      );
    })
    .map((entry) => ({
      ...entry,
      schemaVersion: asString(entry.schemaVersion) ?? "1.0.0",
      id: asString(entry.id) ?? asString(entry.productId)!,
      productId: asString(entry.productId)!,
      productCode: asString(entry.productCode),
      name: asString(entry.name)!,
      beverageClass:
        entry.beverageClass === "beer" || entry.beverageClass === "cider" || entry.beverageClass === "wine" || entry.beverageClass === "other"
          ? entry.beverageClass
          : "other",
      skuIds: Array.isArray(entry.skuIds) ? entry.skuIds.filter((item): item is string => typeof item === "string") : [],
      defaultSkuId: asString(entry.defaultSkuId),
      currentAssetId: asString(entry.currentAssetId),
      currentLabelVersionId: asString(entry.currentLabelVersionId),
      assets: Array.isArray(entry.assets)
        ? entry.assets
            .filter((asset) => isRecord(asset) && Boolean(asString(asset.assetId)))
            .map((asset) => ({
              assetId: asString(asset.assetId)!,
              altText: asString(asset.altText),
              images: isRecord(asset.images)
                ? {
                    thumbnailUrl: asString(asset.images.thumbnailUrl),
                    cardImageUrl: asString(asset.images.cardImageUrl),
                    fullImageUrl: asString(asset.images.fullImageUrl),
                  }
                : {},
              createdAt: asString(asset.createdAt) ?? new Date(0).toISOString(),
              updatedAt: asString(asset.updatedAt) ?? new Date(0).toISOString(),
            }))
        : [],
      createdAt: asString(entry.createdAt) ?? new Date(0).toISOString(),
      updatedAt: asString(entry.updatedAt) ?? new Date(0).toISOString(),
    }));

  return next.length > 0 ? next : flowCatalogProducts;
};

const normalizeRuntimeTapAssignments = (value: unknown): FlowTapAssignment[] => {
  if (!Array.isArray(value)) {
    return flowTapAssignments;
  }

  const next = value
    .filter((entry): entry is FlowTapAssignment => {
      return (
        isRecord(entry) &&
        Boolean(asString(entry.tapAssignmentId)) &&
        Boolean(asString(entry.siteId)) &&
        Boolean(asString(entry.tapId)) &&
        Boolean(asString(entry.productId)) &&
        Boolean(asString(entry.skuId))
      );
    })
    .map((entry) => ({
      ...entry,
      schemaVersion: asString(entry.schemaVersion) ?? "1.0.0",
      id: asString(entry.id) ?? asString(entry.tapAssignmentId)!,
      tapAssignmentId: asString(entry.tapAssignmentId)!,
      siteId: asString(entry.siteId)!,
      tapId: asString(entry.tapId)!,
      productId: asString(entry.productId)!,
      productCode: asString(entry.productCode),
      productName: asString(entry.productName),
      skuId: asString(entry.skuId)!,
      packageLotId: asString(entry.packageLotId),
      packageLotCode: asString(entry.packageLotCode),
      assetId: asString(entry.assetId),
      assetCode: asString(entry.assetCode),
      labelVersionId: asString(entry.labelVersionId),
      beverageClass: asString(entry.beverageClass),
      style: asString(entry.style),
      abv: asNumber(entry.abv),
      tastingNotes: asString(entry.tastingNotes),
      imageAssetId: asString(entry.imageAssetId),
      imageUrl: asString(entry.imageUrl),
      pourSizesOz: Array.isArray(entry.pourSizesOz)
        ? entry.pourSizesOz.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
        : undefined,
      status:
        entry.status === "active" || entry.status === "paused" || entry.status === "offline_only" || entry.status === "disabled"
          ? entry.status
          : "disabled",
      dispenseTargetId: asString(entry.dispenseTargetId),
      createdAt: asString(entry.createdAt) ?? new Date(0).toISOString(),
      updatedAt: asString(entry.updatedAt) ?? new Date(0).toISOString(),
    }));

  return next.length > 0 ? next : flowTapAssignments;
};

const safeStorageGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures in restricted browser contexts.
  }
};

const parseRuntimeSnapshot = (value: string | null): FlowRuntimeSnapshot => {
  if (!value) {
    return createFallbackSnapshot();
  }

  try {
    const parsed = JSON.parse(value) as Partial<FlowRuntimeSnapshot>;
    if (!parsed || typeof parsed !== "object") {
      return createFallbackSnapshot();
    }
    return {
      syncStatus:
        parsed.syncStatus === "online" || parsed.syncStatus === "offline" || parsed.syncStatus === "retrying"
          ? parsed.syncStatus
          : "online",
      activeSiteId: typeof parsed.activeSiteId === "string" ? parsed.activeSiteId : FLOW_PRIMARY_SITE_ID,
      tapStates: normalizeTapStates(parsed.tapStates),
      queuedEvents: normalizeQueuedEvents(parsed.queuedEvents),
      sessions: normalizeSessions(parsed.sessions),
      controlIntents: normalizeControlIntents(parsed.controlIntents),
    };
  } catch {
    return createFallbackSnapshot();
  }
};

const normalizeSyncStatus = (value: unknown): FlowSyncStatus => {
  if (value === "online" || value === "offline" || value === "retrying") {
    return value;
  }
  return "online";
};

const reconcileTapStatesFromRuntime = (
  value: unknown,
  current: Record<string, FlowRuntimeTapState>
): Record<string, FlowRuntimeTapState> => {
  const next: Record<string, FlowRuntimeTapState> = {
    ...getDefaultTapState(),
    ...current,
  };

  if (!Array.isArray(value)) {
    return next;
  }

  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const tapId = asString(entry.id);
    const tapStatus = asString(entry.status);
    if (!tapId || !tapStatus) {
      return;
    }

    if (tapStatus === "maintenance") {
      next[tapId] = "blocked";
      return;
    }
    if (tapStatus === "offline" || tapStatus === "disabled") {
      next[tapId] = "offline";
      return;
    }
    if (tapStatus === "online" && next[tapId] !== "pouring") {
      next[tapId] = "ready";
    }
  });

  return next;
};

const pickFirstSiteId = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const siteId = asString(entry.siteId);
    if (siteId) {
      return siteId;
    }
  }
  return undefined;
};

const fetchJson = async (path: string, init?: globalThis.RequestInit): Promise<unknown> => {
  const response = await globalThis.fetch(path, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`FLOW runtime API request failed (${response.status})`);
  }
  return payload;
};

const runtimeContext = createContext<FlowRuntimeContextValue | undefined>(undefined);

const makeEventId = (siteId: string, tapId: string): string => {
  const compactTimestamp = Date.now().toString(36);
  return `flow-${siteId}-${tapId}-${compactTimestamp}-${toIdSuffix()}`;
};

const existingEventIdSet = new Set(flowPourEvents.map((event) => event.eventId));

export function FlowRuntimeProvider({ children }: { children: ReactNode }) {
  const [syncStatus, setSyncStatusState] = useState<FlowSyncStatus>("online");
  const [activeSiteId, setActiveSiteId] = useState(FLOW_PRIMARY_SITE_ID);
  const [taps, setTaps] = useState<FlowTap[]>(flowTaps);
  const [assignments, setAssignments] = useState<FlowKegAssignment[]>(flowKegAssignments);
  const [menuItems, setMenuItems] = useState<FlowMenuItem[]>(flowMenuItems);
  const [products, setProducts] = useState<FlowCatalogProduct[]>(flowCatalogProducts);
  const [tapAssignments, setTapAssignments] = useState<FlowTapAssignment[]>(flowTapAssignments);
  const [tapStates, setTapStates] = useState<Record<string, FlowRuntimeTapState>>(() => getDefaultTapState());
  const [queuedEvents, setQueuedEvents] = useState<FlowQueuedEvent[]>([]);
  const [sessions, setSessions] = useState<FlowSession[]>(flowSessions);
  const [controlIntents, setControlIntents] = useState<FlowControlIntent[]>([]);

  const applyRuntimeApiSnapshot = useCallback((value: unknown): boolean => {
    if (!isRecord(value)) {
      return false;
    }

    const queue = isRecord(value.queue) ? value.queue : undefined;
    const nextSyncStatus = normalizeSyncStatus(queue?.syncStatus);
    const nextQueuedEvents = normalizeQueuedEvents(queue?.outbox);
    const nextSessions = normalizeSessions(value.sessions);
    const nextTaps = normalizeRuntimeTaps(value.taps);
    const nextAssignments = normalizeRuntimeAssignments(value.assignments);
    const nextMenuItems = normalizeRuntimeMenuItems(value.menuItems);
    const nextProducts = normalizeRuntimeProducts(value.products);
    const nextTapAssignments = normalizeRuntimeTapAssignments(value.tapAssignments);
    const nextSiteId =
      pickFirstSiteId(value.tapAssignments) ??
      pickFirstSiteId(value.sessions) ??
      pickFirstSiteId(value.taps) ??
      pickFirstSiteId(value.menuItems) ??
      pickFirstSiteId(value.assignments) ??
      pickFirstSiteId(value.events);

    setSyncStatusState(nextSyncStatus);
    setQueuedEvents(nextQueuedEvents);
    setSessions(nextSessions);
    setTaps(nextTaps);
    setAssignments(nextAssignments);
    setMenuItems(nextMenuItems);
    setProducts(nextProducts);
    setTapAssignments(nextTapAssignments);
    setTapStates((current) => reconcileTapStatesFromRuntime(value.taps, current));
    if (nextSiteId) {
      setActiveSiteId(nextSiteId);
    }

    return true;
  }, []);

  const refreshFromApi = useCallback(async (): Promise<boolean> => {
    try {
      const payload = await fetchJson("/api/flow/runtime");
      if (!isRecord(payload)) {
        return false;
      }
      return applyRuntimeApiSnapshot(payload.data);
    } catch {
      return false;
    }
  }, [applyRuntimeApiSnapshot]);

  useEffect(() => {
    const snapshot = parseRuntimeSnapshot(safeStorageGet(FLOW_RUNTIME_STORAGE_KEY));
    setSyncStatusState(snapshot.syncStatus);
    setActiveSiteId(snapshot.activeSiteId);
    setTaps(flowTaps);
    setAssignments(flowKegAssignments);
    setMenuItems(flowMenuItems);
    setProducts(flowCatalogProducts);
    setTapAssignments(flowTapAssignments);
    setTapStates(snapshot.tapStates);
    setQueuedEvents(snapshot.queuedEvents);
    setSessions(snapshot.sessions);
    setControlIntents(snapshot.controlIntents);
    void refreshFromApi();
  }, [refreshFromApi]);

  useEffect(() => {
    const snapshot: FlowRuntimeSnapshot = {
      syncStatus,
      activeSiteId,
      tapStates,
      queuedEvents,
      sessions,
      controlIntents,
    };
    safeStorageSet(FLOW_RUNTIME_STORAGE_KEY, JSON.stringify(snapshot));
  }, [activeSiteId, controlIntents, queuedEvents, sessions, syncStatus, tapStates]);

  const setSyncStatus = useCallback(
    (status: FlowSyncStatus) => {
      setSyncStatusState(status);
      void (async () => {
        try {
          await fetchJson("/api/flow/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              syncStatus: status,
              runPass: false,
            }),
          });
          await refreshFromApi();
        } catch {
          // Keep local sync mode when API is unavailable.
        }
      })();
    },
    [refreshFromApi]
  );

  const setTapState = useCallback((tapId: string, nextState: FlowRuntimeTapState) => {
    setTapStates((current) => ({
      ...current,
      [tapId]: nextState,
    }));
  }, []);

  const queueEvent = useCallback(
    (input: CreatePourEventInput): FlowPourEvent => {
      let eventId = input.eventId ?? makeEventId(input.siteId, input.tapId);
      while (existingEventIdSet.has(eventId) || queuedEvents.some((queued) => queued.event.eventId === eventId)) {
        eventId = makeEventId(input.siteId, input.tapId);
      }

      const event: FlowPourEvent = {
        schemaVersion: "0.1.0",
        eventId,
        siteId: input.siteId,
        tapId: input.tapId,
        tapAssignmentId: input.tapAssignmentId,
        assignmentId: input.assignmentId,
        kegAssetId: input.kegAssetId,
        assetId: input.assetId,
        assetCode: input.assetCode,
        productId: input.productId,
        productCode: input.productCode,
        skuId: input.skuId,
        batchId: input.batchId,
        packageLotId: input.packageLotId,
        packageLotCode: input.packageLotCode,
        labelVersionId: input.labelVersionId,
        volume: input.volume,
        uom: input.uom,
        durationMs: input.durationMs ?? 4500,
        sourceMode: input.sourceMode,
        sessionId: input.sessionId,
        actorId: input.actorId,
        occurredAt: toIsoNow(),
      };

      setQueuedEvents((current) => {
        if (current.some((queued) => queued.event.eventId === event.eventId)) {
          return current;
        }

        return [
          {
            event,
            queueStatus: syncStatus === "offline" ? "queued" : "sent",
            retries: 0,
            lastAttemptAt: syncStatus === "offline" ? undefined : toIsoNow(),
          },
          ...current,
        ];
      });

      void (async () => {
        try {
          const payload = await fetchJson("/api/flow/pour-events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          });
          const refreshed = await refreshFromApi();
          if (refreshed) {
            return;
          }

          const responseRow = isRecord(payload) && isRecord(payload.data) ? payload.data : undefined;
          const remoteQueueStatusRaw = responseRow?.queueStatus;
          const remoteQueueStatus =
            remoteQueueStatusRaw === "committed"
              ? "accepted"
              : normalizeQueueStatus(remoteQueueStatusRaw);

          if (!remoteQueueStatus) {
            return;
          }

          setQueuedEvents((current) =>
            current.map((queued) =>
              queued.event.eventId === event.eventId
                ? {
                    ...queued,
                    queueStatus: remoteQueueStatus,
                    lastAttemptAt: toIsoNow(),
                    lastError: remoteQueueStatus === "failed" ? queued.lastError ?? "Remote enqueue failed" : undefined,
                  }
                : queued
            )
          );
        } catch {
          setQueuedEvents((current) =>
            current.map((queued) => {
              if (queued.event.eventId !== event.eventId || queued.queueStatus === "queued") {
                return queued;
              }
              return {
                ...queued,
                queueStatus: "failed",
                retries: queued.retries + 1,
                lastAttemptAt: toIsoNow(),
                lastError: "Unable to reach FLOW enqueue endpoint",
              };
            })
          );
        }
      })();

      return event;
    },
    [queuedEvents, refreshFromApi, syncStatus]
  );

  const runSyncPass = useCallback(() => {
    void (async () => {
      try {
        await fetchJson("/api/flow/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            runPass: true,
          }),
        });

        const refreshed = await refreshFromApi();
        if (refreshed) {
          return;
        }
      } catch {
        // Fall through to local simulation when API is unavailable.
      }

      setQueuedEvents((current) => {
        if (syncStatus === "offline") {
          return current;
        }

        return current.map((queued, index) => {
          const isEligible =
            queued.queueStatus === "queued" || queued.queueStatus === "failed" || queued.queueStatus === "sent";
          if (!isEligible) {
            return queued;
          }

          if (syncStatus === "retrying" && index % 3 === 0) {
            return {
              ...queued,
              queueStatus: "failed",
              retries: queued.retries + 1,
              lastAttemptAt: toIsoNow(),
              lastError: "Temporary link failure to OS control-plane",
            };
          }

          return {
            ...queued,
            queueStatus: "accepted",
            retries: queued.retries,
            lastAttemptAt: toIsoNow(),
            lastError: undefined,
          };
        });
      });
    })();
  }, [refreshFromApi, syncStatus]);

  const upsertSessionStatus = useCallback((sessionId: string, status: FlowSession["status"]) => {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId ? { ...session, status, updatedAt: toIsoNow() } : session
      )
    );
  }, []);

  const createControlIntent = useCallback((input: CreateControlIntentInput): FlowControlIntent => {
    const intent: FlowControlIntent = {
      id: `intent-${Date.now().toString(36)}-${toIdSuffix()}`,
      tapId: input.tapId,
      intentType: input.intentType,
      requestedAt: toIsoNow(),
      requestedBy: input.requestedBy,
      targetTempC: input.targetTempC,
      targetCo2Vol: input.targetCo2Vol,
      status: syncStatus === "offline" ? "queued" : "sent",
    };

    setControlIntents((current) => [intent, ...current].slice(0, 40));
    return intent;
  }, [syncStatus]);

  const buildAuthorizePourRequest = useCallback(
    (args: {
      tapAssignmentId?: string;
      tapId: string;
      productId?: string;
      productCode?: string;
      skuId: string;
      packageLotId?: string;
      packageLotCode?: string;
      assetId?: string;
      assetCode?: string;
      labelVersionId?: string;
      pourSizeOz: number;
      mode: "self_serve" | "bartender";
      sessionId?: string;
      token?: string;
    }): FlowAuthorizePourRequest => {
      const eventId = makeEventId(activeSiteId, args.tapId);
      return {
        siteId: activeSiteId,
        tapAssignmentId: args.tapAssignmentId,
        tapId: args.tapId,
        productId: args.productId,
        productCode: args.productCode,
        skuId: args.skuId,
        packageLotId: args.packageLotId,
        packageLotCode: args.packageLotCode,
        assetId: args.assetId,
        assetCode: args.assetCode,
        labelVersionId: args.labelVersionId,
        eventId,
        pourSizeOz: args.pourSizeOz,
        mode: args.mode,
        sessionId: args.sessionId,
        token: args.token,
      };
    },
    [activeSiteId]
  );

  const authorizePourStub = useCallback((request: FlowAuthorizePourRequest): FlowAuthorizePourResponse => {
    if (!request.token || request.token.trim().length < 4) {
      return {
        requestId: `ops-auth-${Date.now().toString(36)}`,
        decision: "blocked",
        reason: "Missing or invalid wallet token",
      };
    }

    return {
      requestId: `ops-auth-${Date.now().toString(36)}`,
      decision: "approved",
    };
  }, []);

  const contextValue = useMemo<FlowRuntimeContextValue>(
    () => ({
      syncStatus,
      setSyncStatus,
      activeSiteId,
      setActiveSiteId,
      taps,
      assignments,
      menuItems,
      products,
      tapAssignments,
      tapStates,
      setTapState,
      queuedEvents,
      queueEvent,
      runSyncPass,
      sessions,
      upsertSessionStatus,
      controlIntents,
      createControlIntent,
      buildAuthorizePourRequest,
      authorizePourStub,
    }),
    [
      activeSiteId,
      assignments,
      authorizePourStub,
      buildAuthorizePourRequest,
      controlIntents,
      createControlIntent,
      menuItems,
      products,
      queueEvent,
      queuedEvents,
      runSyncPass,
      sessions,
      setSyncStatus,
      setTapState,
      syncStatus,
      tapAssignments,
      tapStates,
      taps,
      upsertSessionStatus,
    ]
  );

  return <runtimeContext.Provider value={contextValue}>{children}</runtimeContext.Provider>;
}

export const useFlowRuntime = (): FlowRuntimeContextValue => {
  const contextValue = useContext(runtimeContext);
  if (!contextValue) {
    throw new Error("useFlowRuntime must be used within FlowRuntimeProvider");
  }
  return contextValue;
};
