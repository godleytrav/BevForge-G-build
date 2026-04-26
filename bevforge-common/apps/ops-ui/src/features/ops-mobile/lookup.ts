import type { LogisticsLineItem } from "@/pages/ops/logistics/data";
import {
  collectLineItemCodes,
  type OpsMobileCodeRef,
  type OpsMobileDerivedStop,
  type OpsMobileView,
} from "./data";

export interface OpsMobileLookupLineMatch {
  id: string;
  stop: OpsMobileDerivedStop;
  orderId: string;
  orderNumber: string;
  lineItem: LogisticsLineItem;
  matchedCode: OpsMobileCodeRef;
}

export interface OpsMobileLookupResult {
  identifier: string;
  matchedKind?: OpsMobileCodeRef["kind"];
  matchedLabel?: string;
  lineMatches: OpsMobileLookupLineMatch[];
  expectedStops: OpsMobileDerivedStop[];
  deliveredStops: OpsMobileDerivedStop[];
  returnedStops: OpsMobileDerivedStop[];
}

const matchesIdentifier = (value: string, identifier: string): boolean =>
  value.trim().toLowerCase() === identifier.trim().toLowerCase();

const uniqueStops = (stops: OpsMobileDerivedStop[]): OpsMobileDerivedStop[] => {
  const seen = new Set<string>();
  return stops.filter((stop) => {
    if (seen.has(stop.id)) {
      return false;
    }
    seen.add(stop.id);
    return true;
  });
};

export const findOpsMobileLookupResult = (
  view: OpsMobileView,
  rawIdentifier: string,
): OpsMobileLookupResult | null => {
  const identifier = rawIdentifier.trim();
  if (!identifier) {
    return null;
  }

  const lineMatches: OpsMobileLookupLineMatch[] = [];
  const seenLineMatches = new Set<string>();

  view.stops.forEach((stop) => {
    stop.orders.forEach((order) => {
      order.lineItems.forEach((lineItem) => {
        collectLineItemCodes(lineItem).forEach((code) => {
          if (!matchesIdentifier(code.value, identifier)) {
            return;
          }

          const key = [
            stop.id,
            order.id,
            lineItem.id,
            code.kind,
            code.value,
          ].join(":");
          if (seenLineMatches.has(key)) {
            return;
          }
          seenLineMatches.add(key);

          lineMatches.push({
            id: key,
            stop,
            orderId: order.id,
            orderNumber: order.orderNumber,
            lineItem,
            matchedCode: code,
          });
        });
      });
    });
  });

  const expectedStops = uniqueStops(
    view.stops.filter((stop) =>
      stop.expectedCodes.some((code) => matchesIdentifier(code.value, identifier)),
    ),
  );
  const deliveredStops = uniqueStops(
    view.stops.filter((stop) =>
      stop.eventSnapshot.deliveredIds.some((value) =>
        matchesIdentifier(value, identifier),
      ),
    ),
  );
  const returnedStops = uniqueStops(
    view.stops.filter((stop) =>
      stop.eventSnapshot.returnedIds.some((value) =>
        matchesIdentifier(value, identifier),
      ),
    ),
  );

  if (
    lineMatches.length === 0 &&
    expectedStops.length === 0 &&
    deliveredStops.length === 0 &&
    returnedStops.length === 0
  ) {
    return null;
  }

  const primaryCode =
    lineMatches[0]?.matchedCode ??
    expectedStops
      .flatMap((stop) => stop.expectedCodes)
      .find((code) => matchesIdentifier(code.value, identifier));

  return {
    identifier,
    matchedKind: primaryCode?.kind,
    matchedLabel: primaryCode?.label,
    lineMatches,
    expectedStops,
    deliveredStops,
    returnedStops,
  };
};

export const describeOpsMobileLookupLocation = (
  result: OpsMobileLookupResult,
): string => {
  const activeStop = result.expectedStops.find(
    (stop) =>
      stop.localStatus === "checked-in" ||
      stop.localStatus === "current" ||
      stop.localStatus === "servicing",
  );
  if (activeStop) {
    return `Expected at ${activeStop.siteName} on ${activeStop.routeLabel}.`;
  }

  if (result.deliveredStops.length > 0) {
    return `Delivered at ${result.deliveredStops[0].siteName}.`;
  }

  if (result.returnedStops.length > 0) {
    return `Returned from ${result.returnedStops[0].siteName}.`;
  }

  if (result.expectedStops.length > 0) {
    return `Expected on ${result.expectedStops[0].routeLabel}.`;
  }

  return "This identifier is in the current OPS mobile cache, but no route location has been inferred yet.";
};
