import {
  buildRouteSummaries,
  buildSiteSummaries,
  buildTruckAssignments,
  getDeliveryScanEvents,
  getSiteProfile,
  getTruckPlanningPreferences,
  type DeliveryScanEvent,
  type LogisticsLineItem,
  type LogisticsOrder,
  type LogisticsTruckProfile,
} from "@/pages/ops/logistics/data";
import {
  buildRouteLiveSummary,
  buildRouteStopSummaries,
} from "@/pages/ops/logistics/route-status";
import {
  getOpsClientRecords,
  type OpsClientRecord,
} from "@/pages/ops/crm/data";

export type OpsMobileGapScope = "endpoint" | "field";
export type OpsMobileGapSeverity = "info" | "warning" | "critical";
export type OpsMobileQueueStatus = "pending" | "blocked" | "synced";
export type OpsMobileScanMode =
  | "delivery"
  | "load"
  | "unload"
  | "return"
  | "empty"
  | "damaged";
export type OpsMobileStopLocalStatus =
  | "planned"
  | "current"
  | "checked-in"
  | "servicing"
  | "completed"
  | "issue"
  | "checked-out";
export type OpsMobileQueueItemType =
  | "stop_check_in"
  | "stop_check_out"
  | "stop_status"
  | "scan_recorded"
  | "note_logged"
  | "issue_logged"
  | "proof_logged"
  | "lead_created";

export interface OpsMobileGapFinding {
  id: string;
  scope: OpsMobileGapScope;
  severity: OpsMobileGapSeverity;
  title: string;
  detail: string;
  count?: number;
}

export interface OpsMobileCodeRef {
  kind: "skuId" | "packageLotCode" | "batchCode" | "assetCode";
  label: string;
  value: string;
}

export interface OpsMobileProductSummary {
  id: string;
  name: string;
  skuId?: string;
  orderCount: number;
  totalQuantity: number;
  packageTypes: string[];
  identifierKinds: OpsMobileCodeRef["kind"][];
}

export interface OpsMobileStopEventSnapshot {
  deliveredCount: number;
  returnedCount: number;
  deliveredIds: string[];
  returnedIds: string[];
  lastEventAt?: string;
}

export interface OpsMobileStopSummary {
  id: string;
  routeId: string;
  routeLabel: string;
  siteId: string;
  siteName: string;
  lat?: number;
  lng?: number;
  orderIndex: number;
  status: "planned" | "current" | "completed";
  stopsAhead: number;
  truckId?: string;
  truckName?: string;
  orderCount: number;
  totalValue: number;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  deliveryWindow: string;
  dockNotes: string;
  orders: LogisticsOrder[];
  expectedCodes: OpsMobileCodeRef[];
  lineItemsWithoutCodes: number;
  eventSnapshot: OpsMobileStopEventSnapshot;
}

export interface OpsMobileRouteSummary {
  id: string;
  label: string;
  status: "planning" | "in-progress" | "completed";
  orderCount: number;
  stopCount: number;
  truckId?: string;
  truckName?: string;
  progress: {
    routeActive: boolean;
    completedStops: number;
    totalStops: number;
    currentStopId?: string;
    currentStopName?: string;
  };
  stopIds: string[];
  totalValue: number;
  expectedCodeCount: number;
}

export interface OpsMobileAccountSummary {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  contactName: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  orderCount: number;
  activeOrderCount: number;
  deliveredOrderCount: number;
  onRouteOrderCount: number;
  nextDeliveryDate?: string;
  lastDeliveryDate?: string;
  lastRouteId?: string;
  lastRouteLabel?: string;
  recentStopIds: string[];
  notes: string;
}

export interface OpsMobileBaseData {
  orders: LogisticsOrder[];
  fleet: LogisticsTruckProfile[];
  routes: OpsMobileRouteSummary[];
  stops: OpsMobileStopSummary[];
  accounts: OpsMobileAccountSummary[];
  products: OpsMobileProductSummary[];
  gaps: OpsMobileGapFinding[];
}

export interface OpsMobileQueueItem {
  id: string;
  type: OpsMobileQueueItemType;
  syncStatus: OpsMobileQueueStatus;
  summary: string;
  detail?: string;
  routeId?: string;
  stopId?: string;
  siteId?: string;
  accountId?: string;
  truckId?: string;
  gapId?: string;
  gapMessage?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OpsMobileDerivedStop extends OpsMobileStopSummary {
  localStatus: OpsMobileStopLocalStatus;
  notes: OpsMobileQueueItem[];
  issues: OpsMobileQueueItem[];
  proofs: OpsMobileQueueItem[];
  scans: OpsMobileQueueItem[];
  timeline: OpsMobileQueueItem[];
  pendingCount: number;
  blockedCount: number;
  lastCheckInAt?: string;
  lastCheckOutAt?: string;
}

export interface OpsMobileDerivedRoute extends OpsMobileRouteSummary {
  stops: OpsMobileDerivedStop[];
  currentStop?: OpsMobileDerivedStop;
  pendingCount: number;
  blockedCount: number;
  issueCount: number;
}

export interface OpsMobileDerivedAccount extends OpsMobileAccountSummary {
  stops: OpsMobileDerivedStop[];
  pendingCount: number;
  blockedCount: number;
  issueCount: number;
}

export interface OpsMobileQueueSummary {
  pending: number;
  blocked: number;
  synced: number;
  total: number;
}

export interface OpsMobileView {
  routes: OpsMobileDerivedRoute[];
  stops: OpsMobileDerivedStop[];
  accounts: OpsMobileDerivedAccount[];
  currentStop?: OpsMobileDerivedStop;
  queueSummary: OpsMobileQueueSummary;
  recentQueue: OpsMobileQueueItem[];
  gaps: OpsMobileGapFinding[];
}

const STATIC_ENDPOINT_GAPS: OpsMobileGapFinding[] = [
  {
    id: "ops-mobile-delivery-write-api",
    scope: "endpoint",
    severity: "warning",
    title: "Mobile execution events sync to OPS, but dispatch replay is limited",
    detail:
      "OPS Mobile now syncs queued stop, scan, note, issue, and proof events back to OPS storage, but not every downstream logistics view replays those remote mobile events into route status automatically yet.",
  },
  {
    id: "ops-mobile-crm-visit-write-api",
    scope: "endpoint",
    severity: "info",
    title: "Warm visit sync uses CRM state persistence",
    detail:
      "OPS Mobile can persist CRM warm-visit records back into the shared OPS CRM state, but there is not yet a dedicated mobile-first CRM endpoint surface.",
  },
  {
    id: "ops-mobile-route-stop-api",
    scope: "endpoint",
    severity: "warning",
    title: "Route and stop detail are assembled client-side",
    detail:
      "There is no dedicated OPS mobile route-stop endpoint; this experience derives route, stop, and account context from `/api/orders`, fleet planning, and local OPS metadata.",
  },
];

const gapSeverityRank: Record<OpsMobileGapSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const queueStatusRank: Record<OpsMobileQueueStatus, number> = {
  pending: 0,
  blocked: 1,
  synced: 2,
};

const formatNameFallback = (value: string): string =>
  value.trim().length > 0 ? value : "Unnamed account";

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const makeQueueStatusSummary = (
  queue: OpsMobileQueueItem[],
): OpsMobileQueueSummary => {
  return queue.reduce<OpsMobileQueueSummary>(
    (summary, item) => {
      summary.total += 1;
      if (item.syncStatus === "pending") {
        summary.pending += 1;
      } else if (item.syncStatus === "blocked") {
        summary.blocked += 1;
      } else {
        summary.synced += 1;
      }
      return summary;
    },
    {
      pending: 0,
      blocked: 0,
      synced: 0,
      total: 0,
    },
  );
};

const buildCodeEntry = (
  seen: Set<string>,
  target: OpsMobileCodeRef[],
  kind: OpsMobileCodeRef["kind"],
  label: string,
  value?: string,
) => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return;
  }
  const key = `${kind}:${normalized}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  target.push({
    kind,
    label,
    value: normalized,
  });
};

export const collectLineItemCodes = (
  lineItem: LogisticsLineItem,
): OpsMobileCodeRef[] => {
  const seen = new Set<string>();
  const codes: OpsMobileCodeRef[] = [];

  buildCodeEntry(seen, codes, "skuId", "SKU", lineItem.skuId);
  buildCodeEntry(
    seen,
    codes,
    "packageLotCode",
    "Package Lot",
    lineItem.packageLotCode,
  );
  buildCodeEntry(
    seen,
    codes,
    "batchCode",
    "Batch",
    lineItem.batchCode,
  );
  buildCodeEntry(seen, codes, "assetCode", "Asset", lineItem.assetCode);

  return codes;
};

const buildStopEventSnapshot = (
  events: DeliveryScanEvent[],
  orders: LogisticsOrder[],
  siteId: string,
  truckId?: string,
): OpsMobileStopEventSnapshot => {
  const orderIds = new Set(orders.map((order) => order.id));
  const filtered = events
    .filter((event) => {
      if (event.stopId !== siteId) {
        return false;
      }
      if (truckId && event.truckId !== truckId) {
        return false;
      }
      if (orderIds.size > 0 && !orderIds.has(event.orderId)) {
        return false;
      }
      return true;
    })
    .sort((left, right) => left.deliveredAt.localeCompare(right.deliveredAt));

  const deliveredIds = Array.from(
    new Set(
      filtered
        .filter((event) => event.eventType === "delivered")
        .map((event) => event.scannedId),
    ),
  );
  const returnedIds = Array.from(
    new Set(
      filtered
        .filter((event) => event.eventType === "returned")
        .map((event) => event.scannedId),
    ),
  );

  return {
    deliveredCount: deliveredIds.length,
    returnedCount: returnedIds.length,
    deliveredIds,
    returnedIds,
    lastEventAt: filtered.at(-1)?.deliveredAt,
  };
};

const mergeExpectedCodes = (orders: LogisticsOrder[]): OpsMobileCodeRef[] => {
  const seen = new Set<string>();
  const codes: OpsMobileCodeRef[] = [];

  orders.flatMap((order) => order.lineItems).forEach((lineItem) => {
    collectLineItemCodes(lineItem).forEach((code) => {
      buildCodeEntry(seen, codes, code.kind, code.label, code.value);
    });
  });

  return codes;
};

const buildProductSummaries = (
  orders: LogisticsOrder[],
): OpsMobileProductSummary[] => {
  const productMap = new Map<
    string,
    {
      id: string;
      name: string;
      skuId?: string;
      orderIds: Set<string>;
      totalQuantity: number;
      packageTypes: Set<string>;
      identifierKinds: Set<OpsMobileCodeRef["kind"]>;
    }
  >();

  orders.forEach((order) => {
    order.lineItems.forEach((lineItem) => {
      const skuId = toOptionalString(lineItem.skuId);
      const id =
        skuId ??
        toOptionalString(lineItem.productCode) ??
        `product:${lineItem.productName}`;
      const existing = productMap.get(id);
      const bucket =
        existing ??
        {
          id,
          name: lineItem.productName,
          skuId,
          orderIds: new Set<string>(),
          totalQuantity: 0,
          packageTypes: new Set<string>(),
          identifierKinds: new Set<OpsMobileCodeRef["kind"]>(),
        };

      bucket.orderIds.add(order.id);
      bucket.totalQuantity += Math.max(0, lineItem.quantity);
      if (toOptionalString(lineItem.packageType)) {
        bucket.packageTypes.add(lineItem.packageType as string);
      }
      collectLineItemCodes(lineItem).forEach((code) =>
        bucket.identifierKinds.add(code.kind),
      );

      productMap.set(id, bucket);
    });
  });

  return Array.from(productMap.values())
    .map((product) => ({
      id: product.id,
      name: product.name,
      skuId: product.skuId,
      orderCount: product.orderIds.size,
      totalQuantity: product.totalQuantity,
      packageTypes: Array.from(product.packageTypes).sort(),
      identifierKinds: Array.from(product.identifierKinds).sort(),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

const buildDynamicGapFindings = (
  orders: LogisticsOrder[],
  stops: OpsMobileStopSummary[],
): OpsMobileGapFinding[] => {
  const lineItems = orders.flatMap((order) => order.lineItems);
  const lineItemsWithoutIdentifiers = lineItems.filter(
    (lineItem) => collectLineItemCodes(lineItem).length === 0,
  ).length;
  const stopsWithoutAddress = stops.filter(
    (stop) => stop.address.trim().length === 0,
  ).length;
  const stopsWithoutContact = stops.filter(
    (stop) => stop.contactName.trim().length === 0 && stop.phone.trim().length === 0,
  ).length;

  const gaps: OpsMobileGapFinding[] = [];

  if (lineItemsWithoutIdentifiers > 0) {
    gaps.push({
      id: "ops-mobile-scan-identifiers-missing",
      scope: "field",
      severity: "warning",
      title: "Some manifest lines cannot be reconciled by scan code",
      detail:
        "These order line items do not include `skuId`, `packageLotCode`, `batchCode`, or `assetCode`, so mobile scan matching falls back to raw text only.",
      count: lineItemsWithoutIdentifiers,
    });
  }

  if (stopsWithoutAddress > 0) {
    gaps.push({
      id: "ops-mobile-stop-address-missing",
      scope: "field",
      severity: "warning",
      title: "Some stops are missing route-ready address data",
      detail:
        "Mobile route execution can render the stop, but navigation and arrival context are incomplete because no address is available in OPS-local site metadata.",
      count: stopsWithoutAddress,
    });
  }

  if (stopsWithoutContact > 0) {
    gaps.push({
      id: "ops-mobile-stop-contact-missing",
      scope: "field",
      severity: "info",
      title: "Some stops are missing contact details",
      detail:
        "Route detail is available, but receiving contact information is absent for part of the current cached stop list.",
      count: stopsWithoutContact,
    });
  }

  return gaps;
};

const mergeGapFindings = (
  base: OpsMobileGapFinding[],
  additional: OpsMobileGapFinding[],
): OpsMobileGapFinding[] => {
  const byId = new Map<string, OpsMobileGapFinding>();

  [...base, ...additional].forEach((gap) => {
    const existing = byId.get(gap.id);
    if (!existing) {
      byId.set(gap.id, { ...gap });
      return;
    }

    byId.set(gap.id, {
      ...existing,
      count: (existing.count ?? 0) + (gap.count ?? 0) || undefined,
    });
  });

  return Array.from(byId.values()).sort((left, right) => {
    const severityDelta =
      gapSeverityRank[left.severity] - gapSeverityRank[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return left.title.localeCompare(right.title);
  });
};

export const buildOpsMobileBaseData = (
  orders: LogisticsOrder[],
  fleet: LogisticsTruckProfile[],
): OpsMobileBaseData => {
  const routeSummaries = buildRouteSummaries(orders);
  const planningPreferences = getTruckPlanningPreferences();
  const assignments = buildTruckAssignments(
    routeSummaries,
    fleet,
    planningPreferences,
  );
  const deliveryEvents = getDeliveryScanEvents();
  const clientRecords = getOpsClientRecords();
  const clientRecordById = new Map<string, OpsClientRecord>(
    clientRecords.map((record) => [record.id, record]),
  );

  const stops = routeSummaries
    .flatMap((route) => {
      const orderedStops = buildRouteStopSummaries(route, assignments);
      return orderedStops.map<OpsMobileStopSummary>((stop) => {
        const stopOrders = route.orders.filter(
          (order) => (order.customerId || order.customerName) === stop.siteId,
        );
        const siteProfile = getSiteProfile(stop.siteId, stop.siteName);
        const eventSnapshot = buildStopEventSnapshot(
          deliveryEvents,
          stopOrders,
          stop.siteId,
          stop.truckId,
        );
        const expectedCodes = mergeExpectedCodes(stopOrders);
        const lineItemsWithoutCodes = stopOrders
          .flatMap((order) => order.lineItems)
          .filter((lineItem) => collectLineItemCodes(lineItem).length === 0).length;

        return {
          id: stop.id,
          routeId: route.id,
          routeLabel: route.label,
          siteId: stop.siteId,
          siteName: stop.siteName,
          lat:
            typeof clientRecordById.get(stop.siteId)?.lat === "number"
              ? clientRecordById.get(stop.siteId)?.lat
              : undefined,
          lng:
            typeof clientRecordById.get(stop.siteId)?.lng === "number"
              ? clientRecordById.get(stop.siteId)?.lng
              : undefined,
          orderIndex: stop.orderIndex,
          status: stop.status,
          stopsAhead: stop.stopsAhead,
          truckId: stop.truckId,
          truckName: stop.truckName,
          orderCount: stop.orderCount,
          totalValue: stop.totalValue,
          address: siteProfile.address,
          contactName: siteProfile.contactName,
          phone: siteProfile.phone,
          email: siteProfile.email,
          deliveryWindow: siteProfile.deliveryWindow,
          dockNotes: siteProfile.dockNotes,
          orders: stopOrders,
          expectedCodes,
          lineItemsWithoutCodes,
          eventSnapshot,
        };
      });
    })
    .sort((left, right) => {
      if (left.routeLabel !== right.routeLabel) {
        return left.routeLabel.localeCompare(right.routeLabel);
      }
      return left.orderIndex - right.orderIndex;
    });

  const routes = routeSummaries
    .map<OpsMobileRouteSummary>((route) => {
      const routeStops = stops.filter((stop) => stop.routeId === route.id);
      const liveSummary = buildRouteLiveSummary(route, assignments);

      return {
        id: route.id,
        label: route.label,
        status: route.status,
        orderCount: route.orderCount,
        stopCount: route.stopCount,
        truckId: liveSummary.truckId,
        truckName: liveSummary.truckName,
        progress: {
          routeActive: liveSummary.routeActive,
          completedStops: liveSummary.completedStops,
          totalStops: liveSummary.totalStops,
          currentStopId: liveSummary.currentStopId,
          currentStopName: liveSummary.currentStopName,
        },
        stopIds: routeStops.map((stop) => stop.id),
        totalValue: routeStops.reduce((sum, stop) => sum + stop.totalValue, 0),
        expectedCodeCount: routeStops.reduce(
          (sum, stop) => sum + stop.expectedCodes.length,
          0,
        ),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const accounts = buildSiteSummaries(orders)
    .map<OpsMobileAccountSummary>((site) => {
      const siteProfile = getSiteProfile(site.id, site.name);
      const clientRecord = clientRecordById.get(site.id);
      const relatedStops = stops.filter((stop) => stop.siteId === site.id);
      const latestStop = relatedStops.at(-1);

      return {
        id: site.id,
        name: formatNameFallback(clientRecord?.name ?? site.name),
        address: clientRecord?.address || siteProfile.address,
        lat:
          typeof clientRecord?.lat === "number" && Number.isFinite(clientRecord.lat)
            ? clientRecord.lat
            : undefined,
        lng:
          typeof clientRecord?.lng === "number" && Number.isFinite(clientRecord.lng)
            ? clientRecord.lng
            : undefined,
        contactName: clientRecord?.contactName || siteProfile.contactName,
        phone: clientRecord?.phone || siteProfile.phone,
        email: clientRecord?.email || siteProfile.email,
        status: clientRecord?.status ?? "active",
        orderCount: site.orderCount,
        activeOrderCount: site.activeOrderCount,
        deliveredOrderCount: site.deliveredOrderCount,
        onRouteOrderCount: site.onRouteOrderCount,
        nextDeliveryDate: site.nextDeliveryDate,
        lastDeliveryDate: site.lastDeliveryDate,
        lastRouteId: latestStop?.routeId,
        lastRouteLabel: latestStop?.routeLabel,
        recentStopIds: relatedStops.map((stop) => stop.id),
        notes: clientRecord?.notes ?? siteProfile.dockNotes,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const dynamicGaps = buildDynamicGapFindings(orders, stops);

  return {
    orders,
    fleet,
    routes,
    stops,
    accounts,
    products: buildProductSummaries(orders),
    gaps: mergeGapFindings(STATIC_ENDPOINT_GAPS, dynamicGaps),
  };
};

const readPayloadStatus = (
  item: OpsMobileQueueItem,
): OpsMobileStopLocalStatus | undefined => {
  const value = item.payload.stopStatus;
  if (
    value === "planned" ||
    value === "current" ||
    value === "checked-in" ||
    value === "servicing" ||
    value === "completed" ||
    value === "issue" ||
    value === "checked-out"
  ) {
    return value;
  }
  return undefined;
};

const buildDerivedStop = (
  stop: OpsMobileStopSummary,
  queue: OpsMobileQueueItem[],
): OpsMobileDerivedStop => {
  const stopQueue = queue
    .filter((item) => item.stopId === stop.id)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const notes = stopQueue.filter((item) => item.type === "note_logged");
  const issues = stopQueue.filter((item) => item.type === "issue_logged");
  const proofs = stopQueue.filter((item) => item.type === "proof_logged");
  const scans = stopQueue.filter((item) => item.type === "scan_recorded");

  let localStatus: OpsMobileStopLocalStatus = stop.status === "current"
    ? "current"
    : stop.status === "completed"
      ? "completed"
      : "planned";
  let lastCheckInAt: string | undefined;
  let lastCheckOutAt: string | undefined;

  stopQueue.forEach((item) => {
    if (item.type === "stop_check_in") {
      lastCheckInAt = item.createdAt;
      localStatus = "checked-in";
      return;
    }

    if (item.type === "stop_check_out") {
      lastCheckOutAt = item.createdAt;
      localStatus = "checked-out";
      return;
    }

    if (item.type === "stop_status") {
      const nextStatus = readPayloadStatus(item);
      if (nextStatus) {
        localStatus = nextStatus;
      }
      return;
    }

    if (item.type === "issue_logged") {
      localStatus = "issue";
    }
  });

  if (
    lastCheckOutAt &&
    stop.status === "current" &&
    !stopQueue.some(
      (item) =>
        item.type === "stop_status" &&
        (readPayloadStatus(item) === "completed" ||
          readPayloadStatus(item) === "issue"),
    )
  ) {
    localStatus = "current";
  }

  return {
    ...stop,
    localStatus,
    notes,
    issues,
    proofs,
    scans,
    timeline: [...stopQueue].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    ),
    pendingCount: stopQueue.filter((item) => item.syncStatus === "pending").length,
    blockedCount: stopQueue.filter((item) => item.syncStatus === "blocked").length,
    lastCheckInAt,
    lastCheckOutAt,
  };
};

const buildBlockedGapFindings = (
  queue: OpsMobileQueueItem[],
): OpsMobileGapFinding[] => {
  const blocked = queue.filter((item) => item.syncStatus === "blocked");
  const findings = new Map<string, OpsMobileGapFinding>();

  blocked.forEach((item) => {
    const gapId = item.gapId ?? "ops-mobile-sync-blocked";
    const existing = findings.get(gapId);
    if (!existing) {
      findings.set(gapId, {
        id: gapId,
        scope: "endpoint",
        severity: "critical",
        title: item.gapMessage ?? item.summary,
        detail:
          item.gapMessage ??
          "This queued mobile action cannot sync remotely with the current OPS API surface.",
        count: 1,
      });
      return;
    }

    findings.set(gapId, {
      ...existing,
      count: (existing.count ?? 0) + 1,
    });
  });

  return Array.from(findings.values());
};

export const buildOpsMobileView = (
  data: OpsMobileBaseData,
  queue: OpsMobileQueueItem[],
): OpsMobileView => {
  const derivedStops = data.stops.map((stop) => buildDerivedStop(stop, queue));
  const routes = data.routes.map<OpsMobileDerivedRoute>((route) => {
    const routeStops = derivedStops.filter((stop) => stop.routeId === route.id);
    return {
      ...route,
      stops: routeStops,
      currentStop:
        routeStops.find((stop) => stop.localStatus === "checked-in") ??
        routeStops.find((stop) => stop.localStatus === "current"),
      pendingCount: routeStops.reduce((sum, stop) => sum + stop.pendingCount, 0),
      blockedCount: routeStops.reduce((sum, stop) => sum + stop.blockedCount, 0),
      issueCount: routeStops.filter((stop) => stop.localStatus === "issue").length,
    };
  });

  const accounts = data.accounts.map<OpsMobileDerivedAccount>((account) => {
    const relatedStops = derivedStops.filter((stop) => stop.siteId === account.id);
    return {
      ...account,
      stops: relatedStops,
      pendingCount: relatedStops.reduce((sum, stop) => sum + stop.pendingCount, 0),
      blockedCount: relatedStops.reduce((sum, stop) => sum + stop.blockedCount, 0),
      issueCount: relatedStops.filter((stop) => stop.localStatus === "issue").length,
    };
  });

  const currentStop =
    derivedStops.find((stop) => stop.localStatus === "checked-in") ??
    derivedStops.find((stop) => stop.localStatus === "current");

  const gaps = mergeGapFindings(data.gaps, buildBlockedGapFindings(queue));

  return {
    routes,
    stops: derivedStops,
    accounts,
    currentStop,
    queueSummary: makeQueueStatusSummary(queue),
    recentQueue: [...queue].sort((left, right) => {
      const statusDelta =
        queueStatusRank[left.syncStatus] - queueStatusRank[right.syncStatus];
      if (statusDelta !== 0) {
        return statusDelta;
      }
      return right.createdAt.localeCompare(left.createdAt);
    }),
    gaps,
  };
};
