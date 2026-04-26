/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiPost, ApiError } from "@/lib/api";
import { normalizeScannedIdentifier } from "@/lib/driver-scan";
import {
  deleteOpsMobileProofAttachment,
  getOpsMobileProofAttachment,
} from "@/features/ops-mobile/proof-attachments";
import {
  fetchFleetProfiles,
  fetchLogisticsOrders,
  getTruckRouteProgress,
  recordDeliveryScanEvent,
  saveTruckRouteProgress,
  type LogisticsTruckProfile,
} from "@/pages/ops/logistics/data";
import { flushOpsCrmState } from "@/pages/ops/crm/data";
import {
  buildOpsMobileBaseData,
  buildOpsMobileView,
  type OpsMobileBaseData,
  type OpsMobileQueueItem,
  type OpsMobileQueueStatus,
  type OpsMobileScanMode,
  type OpsMobileStopLocalStatus,
  type OpsMobileStopSummary,
  type OpsMobileView,
} from "./data";

const MOBILE_STORAGE_KEY = "ops-mobile-pwa-state-v1";
const DRIVER_CHECKIN_STORAGE_KEY = "ops-logistics-driver-checkins-v1";
const DEFAULT_BLOCKED_GAP_ID = "ops-mobile-delivery-write-api";
const DEFAULT_BLOCKED_GAP_MESSAGE =
  "Queued action is stored locally because this OPS mobile flow does not have a remote write endpoint yet.";

interface DriverCheckInState {
  stopId: string;
  checkedInAt: string;
}

interface OpsMobilePersistentState {
  schemaVersion: string;
  lastHydratedAt?: string;
  lastSyncAt?: string;
  lastSyncMessage?: string;
  data: OpsMobileBaseData;
  queue: OpsMobileQueueItem[];
}

interface OpsMobileRuntimeState extends OpsMobilePersistentState {
  isOnline: boolean;
  hydrating: boolean;
  syncing: boolean;
  error?: string;
}

interface QueueEventDraft {
  type: OpsMobileQueueItem["type"];
  summary: string;
  detail?: string;
  routeId?: string;
  stopId?: string;
  siteId?: string;
  accountId?: string;
  truckId?: string;
  gapId?: string;
  gapMessage?: string;
  payload?: Record<string, unknown>;
  syncStatus?: OpsMobileQueueStatus;
}

interface ScanInput {
  mode: OpsMobileScanMode;
  rawValue: string;
  routeId?: string;
  stopId?: string;
  siteId?: string;
  truckId?: string;
  summary?: string;
  detail?: string;
}

export interface ScanResult {
  normalizedId: string;
  matchedExpected: boolean;
  matchedKind?: string;
}

interface OpsMobileContextValue {
  state: OpsMobileRuntimeState;
  view: OpsMobileView;
  refreshData: () => Promise<void>;
  syncQueue: () => Promise<void>;
  rebuildLocalData: () => void;
  enqueueQueueEvent: (draft: QueueEventDraft) => void;
  checkInStop: (
    stop: OpsMobileStopSummary,
    note?: string,
  ) => void;
  checkOutStop: (
    stop: OpsMobileStopSummary,
    note?: string,
  ) => void;
  setStopStatus: (
    stop: OpsMobileStopSummary,
    nextStatus: Extract<
      OpsMobileStopLocalStatus,
      "servicing" | "completed" | "issue"
    >,
    note?: string,
  ) => void;
  recordScan: (input: ScanInput) => ScanResult | null;
}

const emptyData = buildOpsMobileBaseData([], []);

const defaultPersistentState = (): OpsMobilePersistentState => ({
  schemaVersion: "1.0.0",
  data: emptyData,
  queue: [],
});

const canUseStorage = (): boolean =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const readPersistentState = (): OpsMobilePersistentState => {
  if (!canUseStorage()) {
    return defaultPersistentState();
  }

  try {
    const raw = window.localStorage.getItem(MOBILE_STORAGE_KEY);
    if (!raw) {
      return defaultPersistentState();
    }
    const parsed = JSON.parse(raw) as Partial<OpsMobilePersistentState>;

    return {
      schemaVersion:
        typeof parsed.schemaVersion === "string"
          ? parsed.schemaVersion
          : "1.0.0",
      lastHydratedAt:
        typeof parsed.lastHydratedAt === "string"
          ? parsed.lastHydratedAt
          : undefined,
      lastSyncAt:
        typeof parsed.lastSyncAt === "string" ? parsed.lastSyncAt : undefined,
      lastSyncMessage:
        typeof parsed.lastSyncMessage === "string"
          ? parsed.lastSyncMessage
          : undefined,
      data:
        parsed.data &&
        typeof parsed.data === "object" &&
        Array.isArray((parsed.data as OpsMobileBaseData).routes)
          ? (parsed.data as OpsMobileBaseData)
          : emptyData,
      queue: Array.isArray(parsed.queue)
        ? (parsed.queue as OpsMobileQueueItem[])
        : [],
    };
  } catch {
    return defaultPersistentState();
  }
};

const writePersistentState = (state: OpsMobileRuntimeState) => {
  if (!canUseStorage()) {
    return;
  }

  const payload: OpsMobilePersistentState = {
    schemaVersion: state.schemaVersion,
    lastHydratedAt: state.lastHydratedAt,
    lastSyncAt: state.lastSyncAt,
    lastSyncMessage: state.lastSyncMessage,
    data: state.data,
    queue: state.queue,
  };
  window.localStorage.setItem(MOBILE_STORAGE_KEY, JSON.stringify(payload));
};

const readDriverCheckIns = (): Record<string, DriverCheckInState> => {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DRIVER_CHECKIN_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    return parsed as Record<string, DriverCheckInState>;
  } catch {
    return {};
  }
};

const writeDriverCheckIns = (value: Record<string, DriverCheckInState>) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(
    DRIVER_CHECKIN_STORAGE_KEY,
    JSON.stringify(value),
  );
};

const saveDriverCheckIn = (
  truckId: string,
  value: DriverCheckInState | null,
) => {
  const all = readDriverCheckIns();
  if (value) {
    all[truckId] = value;
  } else {
    delete all[truckId];
  }
  writeDriverCheckIns(all);
};

const nowIso = (): string => new Date().toISOString();

const buildQueueItem = (draft: QueueEventDraft): OpsMobileQueueItem => {
  const timestamp = nowIso();
  return {
    id: `ops-mobile-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    type: draft.type,
    syncStatus: draft.syncStatus ?? "pending",
    summary: draft.summary,
    detail: draft.detail,
    routeId: draft.routeId,
    stopId: draft.stopId,
    siteId: draft.siteId,
    accountId: draft.accountId,
    truckId: draft.truckId,
    gapId: draft.gapId,
    gapMessage: draft.gapMessage,
    payload: draft.payload ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const defaultRuntimeState = (): OpsMobileRuntimeState => {
  const persistent = readPersistentState();
  return {
    ...persistent,
    isOnline:
      typeof navigator === "undefined" ? true : Boolean(navigator.onLine),
    hydrating: false,
    syncing: false,
    error: undefined,
  };
};

const OpsMobileContext = createContext<OpsMobileContextValue | null>(null);

const resolveBlockedGap = (
  item: OpsMobileQueueItem,
): { gapId: string; gapMessage: string } => {
  return {
    gapId: item.gapId ?? DEFAULT_BLOCKED_GAP_ID,
    gapMessage: item.gapMessage ?? DEFAULT_BLOCKED_GAP_MESSAGE,
  };
};

const isPermanentSyncError = (error: unknown): boolean => {
  if (error instanceof ApiError && typeof error.status === "number") {
    return error.status >= 400 && error.status < 500;
  }
  return false;
};

const syncQueueItemToOps = async (item: OpsMobileQueueItem): Promise<void> => {
  const payload = { ...(item.payload ?? {}) } as Record<string, unknown>;
  let attachment:
    | {
        fileName: string;
        mimeType: string;
        dataUrl: string;
      }
    | undefined;

  if (item.type === "lead_created") {
    await flushOpsCrmState();
  }

  if (item.type === "proof_logged") {
    const proofAttachmentId =
      typeof payload.proofAttachmentId === "string"
        ? payload.proofAttachmentId
        : undefined;
    if (proofAttachmentId) {
      const stored = await getOpsMobileProofAttachment(proofAttachmentId);
      if (!stored) {
        throw new Error("Stored proof attachment is missing from this device.");
      }
      attachment = {
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        dataUrl: stored.dataUrl,
      };
    }
  }

  await apiPost("/api/ops/mobile/events", {
    type: item.type,
    summary: item.summary,
    detail: item.detail,
    routeId: item.routeId,
    stopId: item.stopId,
    siteId: item.siteId,
    accountId: item.accountId,
    truckId: item.truckId,
    createdAt: item.createdAt,
    payload,
    attachment,
  });

  const syncedAttachmentId =
    item.type === "proof_logged" && typeof payload.proofAttachmentId === "string"
      ? payload.proofAttachmentId
      : null;
  if (syncedAttachmentId) {
    await deleteOpsMobileProofAttachment(syncedAttachmentId).catch(() => undefined);
  }
};

const advanceRouteIfCurrentStopCompleted = (
  stop: OpsMobileStopSummary,
  allStops: OpsMobileStopSummary[],
) => {
  if (!stop.truckId) {
    return;
  }

  const progress = getTruckRouteProgress(stop.truckId);
  const routeStops = allStops
    .filter((candidate) => candidate.routeId === stop.routeId)
    .sort((left, right) => left.orderIndex - right.orderIndex);

  if (
    !progress.routeActive ||
    progress.currentStopIndex < 0 ||
    progress.currentStopIndex >= routeStops.length
  ) {
    return;
  }

  const currentStop = routeStops[progress.currentStopIndex];
  if (currentStop?.siteId !== stop.siteId) {
    return;
  }

  const atEnd = progress.currentStopIndex >= routeStops.length - 1;
  saveTruckRouteProgress({
    truckId: stop.truckId,
    routeActive: !atEnd,
    currentStopIndex: atEnd
      ? progress.currentStopIndex
      : progress.currentStopIndex + 1,
    lastCompletedStopName: stop.siteName,
    deliveredByStop: progress.deliveredByStop,
    updatedAt: nowIso(),
  });

  saveDriverCheckIn(stop.truckId, null);
};

export function OpsMobileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpsMobileRuntimeState>(() =>
    defaultRuntimeState(),
  );

  const updateState = useCallback(
    (updater: (current: OpsMobileRuntimeState) => OpsMobileRuntimeState) => {
      setState((current) => {
        const next = updater(current);
        writePersistentState(next);
        return next;
      });
    },
    [],
  );

  const rebuildLocalData = useCallback(() => {
    updateState((current) => ({
      ...current,
      data: buildOpsMobileBaseData(current.data.orders, current.data.fleet),
    }));
  }, [updateState]);

  const refreshData = useCallback(async () => {
    updateState((current) => ({
      ...current,
      hydrating: true,
      error: undefined,
    }));

    try {
      const [orders, fleet] = await Promise.all([
        fetchLogisticsOrders(),
        fetchFleetProfiles(),
      ]);

      updateState((current) => ({
        ...current,
        hydrating: false,
        error: undefined,
        lastHydratedAt: nowIso(),
        data: buildOpsMobileBaseData(
          orders,
          Array.isArray(fleet) ? (fleet as LogisticsTruckProfile[]) : [],
        ),
      }));
    } catch (error) {
      updateState((current) => ({
        ...current,
        hydrating: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh OPS mobile data.",
      }));
    }
  }, [updateState]);

  const enqueueQueueEvent = useCallback(
    (draft: QueueEventDraft) => {
      const nextItem = buildQueueItem(draft);

      updateState((current) => ({
        ...current,
        queue: [nextItem, ...current.queue],
      }));
    },
    [updateState],
  );

  const checkInStop = useCallback(
    (stop: OpsMobileStopSummary, note?: string) => {
      if (!stop.truckId) {
        return;
      }

      const checkedInAt = nowIso();
      saveDriverCheckIn(stop.truckId, {
        stopId: stop.siteId,
        checkedInAt,
      });

      updateState((current) => ({
        ...current,
        queue: [
          buildQueueItem({
            type: "stop_check_in",
            summary: `Checked in at ${stop.siteName}`,
            detail: note,
            routeId: stop.routeId,
            stopId: stop.id,
            siteId: stop.siteId,
            accountId: stop.siteId,
            truckId: stop.truckId,
            payload: {
              checkedInAt,
            },
          }),
          ...current.queue,
        ],
        data: buildOpsMobileBaseData(current.data.orders, current.data.fleet),
      }));
    },
    [updateState],
  );

  const checkOutStop = useCallback(
    (stop: OpsMobileStopSummary, note?: string) => {
      if (!stop.truckId) {
        return;
      }

      saveDriverCheckIn(stop.truckId, null);

      updateState((current) => ({
        ...current,
        queue: [
          buildQueueItem({
            type: "stop_check_out",
            summary: `Checked out from ${stop.siteName}`,
            detail: note,
            routeId: stop.routeId,
            stopId: stop.id,
            siteId: stop.siteId,
            accountId: stop.siteId,
            truckId: stop.truckId,
            payload: {
              checkedOutAt: nowIso(),
            },
          }),
          ...current.queue,
        ],
        data: buildOpsMobileBaseData(current.data.orders, current.data.fleet),
      }));
    },
    [updateState],
  );

  const setStopStatus = useCallback(
    (
      stop: OpsMobileStopSummary,
      nextStatus: Extract<
        OpsMobileStopLocalStatus,
        "servicing" | "completed" | "issue"
      >,
      note?: string,
    ) => {
      updateState((current) => {
        if (nextStatus === "completed") {
          advanceRouteIfCurrentStopCompleted(stop, current.data.stops);
        }

        return {
          ...current,
          queue: [
            buildQueueItem({
              type: "stop_status",
              summary: `${stop.siteName} marked ${nextStatus.replace("-", " ")}`,
              detail: note,
              routeId: stop.routeId,
              stopId: stop.id,
              siteId: stop.siteId,
              accountId: stop.siteId,
              truckId: stop.truckId,
              payload: {
                stopStatus: nextStatus,
                note,
              },
            }),
            ...current.queue,
          ],
          data: buildOpsMobileBaseData(current.data.orders, current.data.fleet),
        };
      });
    },
    [updateState],
  );

  const recordScan = useCallback(
    (input: ScanInput): ScanResult | null => {
      const normalized = normalizeScannedIdentifier(input.rawValue);
      const normalizedId = normalized.identifier.trim();
      if (!normalizedId) {
        return null;
      }

      const stop = state.data.stops.find((candidate) => candidate.id === input.stopId);
      const route =
        state.data.routes.find((candidate) => candidate.id === input.routeId) ??
        (stop
          ? state.data.routes.find((candidate) => candidate.id === stop.routeId)
          : undefined);
      const comparisonCodes =
        stop?.expectedCodes ??
        route?.stopIds
          .flatMap((stopId) =>
            state.data.stops.find((candidate) => candidate.id === stopId)
              ?.expectedCodes ?? [],
          ) ??
        [];
      const matchedCode = comparisonCodes.find(
        (code) => code.value.toLowerCase() === normalizedId.toLowerCase(),
      );

      if (
        stop &&
        stop.truckId &&
        (input.mode === "delivery" || input.mode === "return")
      ) {
        const progress = getTruckRouteProgress(stop.truckId);
        const currentStopIds = progress.deliveredByStop[stop.siteId] ?? [];
        const nextDeliveredByStop =
          input.mode === "delivery"
            ? {
                ...progress.deliveredByStop,
                [stop.siteId]: Array.from(
                  new Set([...currentStopIds, normalizedId]),
                ),
              }
            : progress.deliveredByStop;

        recordDeliveryScanEvent({
          orderId: stop.orders[0]?.id ?? `ops-mobile-${stop.routeId}-${stop.siteId}`,
          truckId: stop.truckId,
          stopId: stop.siteId,
          stopName: stop.siteName,
          scannedId: normalizedId,
          eventType: input.mode === "return" ? "returned" : "delivered",
        });

        saveTruckRouteProgress({
          ...progress,
          deliveredByStop: nextDeliveredByStop,
          updatedAt: nowIso(),
        });
      }

      updateState((current) => ({
        ...current,
        queue: [
          buildQueueItem({
            type: "scan_recorded",
            summary:
              input.summary ??
              `${input.mode.replace("-", " ")} scan recorded`,
            detail:
              input.detail ??
              `${normalizedId}${matchedCode ? ` matched ${matchedCode.label}` : ""}`,
            routeId: route?.id ?? input.routeId,
            stopId: stop?.id ?? input.stopId,
            siteId: stop?.siteId ?? input.siteId,
            accountId: stop?.siteId ?? input.siteId,
            truckId: stop?.truckId ?? input.truckId,
            payload: {
              mode: input.mode,
              rawValue: input.rawValue,
              normalizedId,
              matchedExpected: Boolean(matchedCode),
              matchedKind: matchedCode?.kind,
              matchedLabel: matchedCode?.label,
            },
          }),
          ...current.queue,
        ],
        data: buildOpsMobileBaseData(current.data.orders, current.data.fleet),
      }));

      return {
        normalizedId,
        matchedExpected: Boolean(matchedCode),
        matchedKind: matchedCode?.label,
      };
    },
    [state.data.routes, state.data.stops, updateState],
  );

  const syncQueue = useCallback(async () => {
    updateState((current) => ({
      ...current,
      syncing: true,
      error: undefined,
    }));

    const currentQueue = state.queue;
    const updates = await Promise.all(
      currentQueue.map(async (item) => {
        if (item.syncStatus === "synced") {
          return item;
        }

        try {
          await syncQueueItemToOps(item);
          return {
            ...item,
            syncStatus: "synced" as const,
            gapId: undefined,
            gapMessage: undefined,
            updatedAt: nowIso(),
          };
        } catch (error) {
          if (isPermanentSyncError(error)) {
            const blocked = resolveBlockedGap(item);
            return {
              ...item,
              syncStatus: "blocked" as const,
              gapId: blocked.gapId,
              gapMessage:
                error instanceof Error ? error.message : blocked.gapMessage,
              updatedAt: nowIso(),
            };
          }

          return {
            ...item,
            syncStatus: "pending" as const,
            gapId: undefined,
            gapMessage:
              error instanceof Error ? error.message : "Waiting for OPS network access.",
            updatedAt: nowIso(),
          };
        }
      }),
    );

    updateState((current) => {
      const queue = current.queue.map((item) => {
        const next = updates.find((candidate) => candidate.id === item.id);
        return next ?? item;
      });
      const pendingCount = queue.filter((item) => item.syncStatus === "pending").length;
      const blockedCount = queue.filter((item) => item.syncStatus === "blocked").length;
      const syncedCount = queue.filter((item) => item.syncStatus === "synced").length;

      return {
        ...current,
        syncing: false,
        lastSyncAt: nowIso(),
        lastSyncMessage:
          blockedCount > 0
            ? `${syncedCount} synced, ${blockedCount} blocked, ${pendingCount} still pending network retry.`
            : pendingCount > 0
              ? `${syncedCount} synced, ${pendingCount} pending retry.`
              : syncedCount > 0
                ? `All queued mobile actions are synced to OPS.`
                : "No queued mobile actions needed syncing.",
        queue,
      };
    });
  }, [state.queue, updateState]);

  useEffect(() => {
    const handleOnline = () => {
      updateState((current) => ({
        ...current,
        isOnline: true,
      }));
      void refreshData();
      void syncQueue();
    };

    const handleOffline = () => {
      updateState((current) => ({
        ...current,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshData, syncQueue, updateState]);

  useEffect(() => {
    if (!state.lastHydratedAt) {
      void refreshData();
    }
  }, [refreshData, state.lastHydratedAt]);

  const view = useMemo(
    () => buildOpsMobileView(state.data, state.queue),
    [state.data, state.queue],
  );

  const value = useMemo<OpsMobileContextValue>(
    () => ({
      state,
      view,
      refreshData,
      syncQueue,
      rebuildLocalData,
      enqueueQueueEvent,
      checkInStop,
      checkOutStop,
      setStopStatus,
      recordScan,
    }),
    [
      state,
      view,
      refreshData,
      syncQueue,
      rebuildLocalData,
      enqueueQueueEvent,
      checkInStop,
      checkOutStop,
      setStopStatus,
      recordScan,
    ],
  );

  return (
    <OpsMobileContext.Provider value={value}>
      {children}
    </OpsMobileContext.Provider>
  );
}

export const useOpsMobile = (): OpsMobileContextValue => {
  const context = useContext(OpsMobileContext);
  if (!context) {
    throw new Error("useOpsMobile must be used within OpsMobileProvider.");
  }
  return context;
};
