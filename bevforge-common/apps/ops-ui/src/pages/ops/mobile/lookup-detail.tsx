import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import {
  describeOpsMobileLookupLocation,
  findOpsMobileLookupResult,
} from "@/features/ops-mobile/lookup";
import {
  formatMobileCurrency,
  formatMobileDateTime,
  mobileGlassClass,
  stopStatusClass,
} from "@/features/ops-mobile/ui";
import { collectLineItemCodes } from "@/features/ops-mobile/data";
import {
  fetchOpsPackageUnits,
  type OpsPackageUnitEventRecord,
  type OpsPackageUnitRecord,
} from "@/lib/package-units";
import { normalizeScannedIdentifier } from "@/lib/driver-scan";
import { ArrowLeft, Box, MapPinned, PackageSearch, ScanLine } from "lucide-react";

const formatToken = (value: string): string => value.replace(/_/g, " ");

const summarizePackageLocation = (unit: OpsPackageUnitRecord): string => {
  if (unit.assignedSiteName) {
    return `Assigned to ${unit.assignedSiteName}.`;
  }
  if (unit.currentLocationLabel) {
    return `${unit.currentLocationLabel}.`;
  }
  return `Tracked in OPS package ledger as ${formatToken(unit.status)}.`;
};

export default function OpsMobileLookupDetailPage() {
  const { identifier } = useParams();
  const { view } = useOpsMobile();
  const [matchedUnit, setMatchedUnit] = useState<OpsPackageUnitRecord | null>(null);
  const [matchedEvents, setMatchedEvents] = useState<OpsPackageUnitEventRecord[]>([]);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [packageLookupError, setPackageLookupError] = useState<string | null>(null);

  const rawIdentifier = useMemo(
    () => decodeURIComponent(identifier ?? "").trim(),
    [identifier],
  );
  const normalizedScan = useMemo(
    () => normalizeScannedIdentifier(rawIdentifier),
    [rawIdentifier],
  );
  const normalizedIdentifier = normalizedScan.identifier;
  const result = useMemo(
    () => findOpsMobileLookupResult(view, normalizedIdentifier),
    [view, normalizedIdentifier],
  );

  useEffect(() => {
    let active = true;

    if (!normalizedIdentifier) {
      setMatchedUnit(null);
      setMatchedEvents([]);
      setLoadingUnit(false);
      setPackageLookupError(null);
      return () => {
        active = false;
      };
    }

    setLoadingUnit(true);
    setPackageLookupError(null);

    void fetchOpsPackageUnits({ identifier: normalizedIdentifier })
      .then((state) => {
        if (!active) {
          return;
        }
        setMatchedUnit(state.units[0] ?? null);
        setMatchedEvents(state.events);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setMatchedUnit(null);
        setMatchedEvents([]);
        setPackageLookupError(
          error instanceof Error
            ? error.message
            : "Failed to query the OPS package ledger.",
        );
      })
      .finally(() => {
        if (active) {
          setLoadingUnit(false);
        }
      });

    return () => {
      active = false;
    };
  }, [normalizedIdentifier]);

  if (!normalizedIdentifier) {
    return (
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardContent className="space-y-4 p-4">
          <p className="text-lg font-semibold text-white">Lookup not found</p>
          <p className="text-sm text-white/65">
            No scan value was provided to OPS Mobile.
          </p>
          <Link
            to="/ops/mobile/scan"
            className="inline-flex items-center gap-2 text-sm text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to scan
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!result && !matchedUnit && !loadingUnit) {
    return (
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardContent className="space-y-4 p-4">
          <p className="text-lg font-semibold text-white">Lookup not found</p>
          <p className="text-sm text-white/65">
            {packageLookupError
              ? packageLookupError
              : "This scanned identifier is not present in the current OPS route cache or the shared package ledger."}
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white/55">
            Scanned as <span className="font-semibold text-white">{normalizedIdentifier}</span>
            {normalizedScan.rawValue !== normalizedIdentifier ? (
              <span className="block pt-1 text-white/45">
                Raw QR payload: {normalizedScan.rawValue}
              </span>
            ) : null}
          </div>
          <Link
            to="/ops/mobile/scan"
            className="inline-flex items-center gap-2 text-sm text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to scan
          </Link>
        </CardContent>
      </Card>
    );
  }

  const primaryMatch = result?.lineMatches[0];
  const primaryStop =
    primaryMatch?.stop ??
    result?.expectedStops[0] ??
    result?.deliveredStops[0] ??
    result?.returnedStops[0];
  const lineItemCodes = primaryMatch
    ? collectLineItemCodes(primaryMatch.lineItem)
    : primaryStop?.expectedCodes.filter((code) => code.value === normalizedIdentifier) ?? [];
  const locationSummary = result
    ? describeOpsMobileLookupLocation(result)
    : matchedUnit
      ? summarizePackageLocation(matchedUnit)
      : "Checking the shared OPS package ledger.";
  const isKegLike =
    Boolean(primaryMatch?.lineItem.containerType.toLowerCase().includes("keg")) ||
    result?.matchedKind === "assetCode" ||
    matchedUnit?.unitType === "keg" ||
    Boolean(matchedUnit?.assetCode);
  const relatedStops = result
    ? Array.from(
        new Map(
          [
            ...result.expectedStops,
            ...result.deliveredStops,
            ...result.returnedStops,
          ].map((stop) => [stop.id, stop]),
        ).values(),
      )
    : [];

  return (
    <div className="space-y-4">
      <Link
        to="/ops/mobile/scan"
        className="inline-flex items-center gap-2 text-sm text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to scan
      </Link>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <PackageSearch className="h-5 w-5" />
            {isKegLike ? "Keg lookup" : "Item lookup"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Scanned identifier
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {normalizedIdentifier}
              </p>
              <p className="mt-2 text-sm text-white/65">
                {primaryMatch
                  ? `${primaryMatch.lineItem.productName} · ${primaryMatch.lineItem.quantity} ${primaryMatch.lineItem.containerType}`
                  : matchedUnit
                    ? `${matchedUnit.productName} · ${matchedUnit.quantity} ${matchedUnit.unitType}`
                    : "Matched from the current OPS route cache or shared package ledger."}
              </p>
            </div>
            {result?.matchedLabel ? (
              <Badge className="border-cyan-300/25 bg-cyan-300/12 text-cyan-100">
                {result.matchedLabel}
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Location
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {locationSummary}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Stops
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {relatedStops.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Codes
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {lineItemCodes.length || (matchedUnit ? 1 : 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Source
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {result && matchedUnit
                  ? "Route cache + package ledger"
                  : result
                    ? "Route cache"
                    : loadingUnit
                      ? "Checking ledger"
                      : "Package ledger"}
              </p>
            </div>
          </div>

          {normalizedScan.rawValue !== normalizedIdentifier ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white/55">
              Raw QR payload
              <p className="mt-1 break-all text-sm text-white/70">
                {normalizedScan.rawValue}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            >
              <Link to="/ops/mobile/scan">
                <ScanLine className="mr-2 h-4 w-4" />
                Scan another code
              </Link>
            </Button>
            {primaryStop ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
              >
                <Link to={`/ops/mobile/stops/${primaryStop.id}`}>
                  <MapPinned className="mr-2 h-4 w-4" />
                  Open stop
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {matchedUnit ? (
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Box className="h-5 w-5" />
              Package-unit detail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Product
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {matchedUnit.productName}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {matchedUnit.unitCode} · {matchedUnit.quantity} {matchedUnit.unitType}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  OPS status
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatToken(matchedUnit.status)}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {matchedUnit.currentLocationLabel ??
                    formatToken(matchedUnit.currentLocationType)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Identity chain
                </p>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  <p>Product code: {matchedUnit.productCode ?? "Not set"}</p>
                  <p>SKU: {matchedUnit.skuId ?? "Not set"}</p>
                  <p>Batch: {matchedUnit.batchCode ?? "Not set"}</p>
                  <p>Package lot: {matchedUnit.packageLotCode ?? "Not set"}</p>
                  <p>Asset: {matchedUnit.assetCode ?? "Not set"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Assignment
                </p>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  <p>Client: {matchedUnit.assignedSiteName ?? "Not assigned"}</p>
                  <p>Order: {matchedUnit.assignedOrderId ?? "Not assigned"}</p>
                  <p>Parent unit: {matchedUnit.parentUnitCode ?? "None"}</p>
                  <p>
                    Children:{" "}
                    {matchedUnit.childUnitCodes.length > 0
                      ? matchedUnit.childUnitCodes.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>

            {matchedEvents.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Recent movement
                </p>
                <div className="mt-3 space-y-3">
                  {matchedEvents.slice(0, 6).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/25 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {event.summary}
                          </p>
                          {event.detail ? (
                            <p className="mt-1 text-sm text-white/60">{event.detail}</p>
                          ) : null}
                        </div>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                          {formatMobileDateTime(event.occurredAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {primaryMatch ? (
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Box className="h-5 w-5" />
              Manifest detail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Product
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {primaryMatch.lineItem.productName}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {primaryMatch.lineItem.quantity} {primaryMatch.lineItem.containerType}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Order
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {primaryMatch.orderNumber}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {formatMobileCurrency(primaryMatch.stop.totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Route positions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {relatedStops.map((stop) => (
            <div
              key={stop.id}
              className="rounded-2xl border border-white/10 bg-white/6 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{stop.siteName}</p>
                  <p className="mt-1 text-sm text-white/60">
                    {stop.routeLabel} · {stop.address || "Address missing"}
                  </p>
                </div>
                <Badge className={stopStatusClass(stop.localStatus)}>
                  {stop.localStatus.replace("-", " ")}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                {stop.eventSnapshot.deliveredIds.includes(normalizedIdentifier) ? (
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                    Delivered here
                  </span>
                ) : null}
                {stop.eventSnapshot.returnedIds.includes(normalizedIdentifier) ? (
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-100">
                    Returned here
                  </span>
                ) : null}
                {stop.expectedCodes.some((code) => code.value === normalizedIdentifier) ? (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
                    Expected here
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
                >
                  <Link to={`/ops/mobile/stops/${stop.id}`}>Stop detail</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
                >
                  <Link to={`/ops/mobile/accounts/${stop.siteId}`}>Account detail</Link>
                </Button>
              </div>

              {stop.eventSnapshot.lastEventAt ? (
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/40">
                  Last route event {formatMobileDateTime(stop.eventSnapshot.lastEventAt)}
                </p>
              ) : null}
            </div>
          ))}

          {relatedStops.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
              No route stops in the current mobile cache reference this identifier yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
