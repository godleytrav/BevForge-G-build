import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  OpsMobileDerivedAccount,
  OpsMobileDerivedStop,
} from "@/features/ops-mobile/data";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import {
  formatMobileCount,
  formatMobileDate,
  mobileGlassClass,
  stopStatusClass,
} from "@/features/ops-mobile/ui";
import {
  Clock3,
  LocateFixed,
  MapPin,
  Search,
  Truck,
} from "lucide-react";

type MobileHomeFilter = "deliveries" | "nearby" | "recent" | "all";
type MobileLocationState =
  | "idle"
  | "locating"
  | "ready"
  | "unsupported"
  | "unavailable"
  | "denied";

interface MobileCoordinates {
  lat: number;
  lng: number;
  capturedAt: string;
}

interface AccountWithDistance {
  account: OpsMobileDerivedAccount;
  distanceMiles?: number;
}

const LOCATION_STORAGE_KEY = "ops-mobile-home-last-location-v1";
const NEARBY_SUGGESTION_MILES = 2;
const ACCOUNT_RESULT_LIMIT = 8;

const readCachedLocation = (): MobileCoordinates | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<MobileCoordinates>;
    if (
      typeof parsed.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed.lng === "number" &&
      Number.isFinite(parsed.lng) &&
      typeof parsed.capturedAt === "string"
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        capturedAt: parsed.capturedAt,
      };
    }
  } catch {
    return null;
  }
  return null;
};

const saveCachedLocation = (value: MobileCoordinates) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(value));
};

const isActionableAccount = (account: OpsMobileDerivedAccount): boolean =>
  account.activeOrderCount > 0 ||
  account.onRouteOrderCount > 0 ||
  account.pendingCount > 0 ||
  account.stops.some(
    (stop) =>
      stop.localStatus === "current" ||
      stop.localStatus === "checked-in" ||
      stop.localStatus === "servicing",
  );

const isRecentAccount = (account: OpsMobileDerivedAccount): boolean =>
  account.recentStopIds.length > 0 || Boolean(account.lastDeliveryDate);

const normalizeSearch = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const matchesAccountSearch = (
  account: OpsMobileDerivedAccount,
  query: string,
): boolean => {
  const normalized = normalizeSearch(query);
  if (!normalized) {
    return true;
  }

  const haystack = [
    account.name,
    account.address,
    account.contactName,
    account.phone,
    account.email,
    account.lastRouteLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

const calculateDistanceMiles = (
  origin: MobileCoordinates,
  lat?: number,
  lng?: number,
): number | undefined => {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return undefined;
  }

  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat - origin.lat);
  const dLng = toRadians(lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
};

const compareOperationalAccounts = (
  left: AccountWithDistance,
  right: AccountWithDistance,
): number => {
  const accountLeft = left.account;
  const accountRight = right.account;

  if (accountRight.onRouteOrderCount !== accountLeft.onRouteOrderCount) {
    return accountRight.onRouteOrderCount - accountLeft.onRouteOrderCount;
  }
  if (accountRight.activeOrderCount !== accountLeft.activeOrderCount) {
    return accountRight.activeOrderCount - accountLeft.activeOrderCount;
  }
  if (accountRight.pendingCount !== accountLeft.pendingCount) {
    return accountRight.pendingCount - accountLeft.pendingCount;
  }
  if (
    typeof left.distanceMiles === "number" &&
    typeof right.distanceMiles === "number" &&
    left.distanceMiles !== right.distanceMiles
  ) {
    return left.distanceMiles - right.distanceMiles;
  }
  if (accountLeft.nextDeliveryDate && accountRight.nextDeliveryDate) {
    return accountLeft.nextDeliveryDate.localeCompare(accountRight.nextDeliveryDate);
  }
  return accountLeft.name.localeCompare(accountRight.name);
};

const formatDistance = (value?: number): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (value < 0.2) {
    return "On site";
  }
  if (value < 10) {
    return `${value.toFixed(1)} mi away`;
  }
  return `${Math.round(value)} mi away`;
};

const getLocationSupport = (): {
  hasGeolocation: boolean;
  secureContext: boolean;
} => {
  if (typeof window === "undefined") {
    return {
      hasGeolocation: false,
      secureContext: false,
    };
  }

  const hostname = window.location.hostname;
  return {
    hasGeolocation:
      typeof navigator !== "undefined" && "geolocation" in navigator,
    secureContext:
      window.isSecureContext ||
      hostname === "localhost" ||
      hostname === "127.0.0.1",
  };
};

export default function OpsMobileHomePage() {
  const { view, refreshData, syncQueue } = useOpsMobile();
  const currentStop = view.currentStop;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MobileHomeFilter>("deliveries");
  const [location, setLocation] = useState<MobileCoordinates | null>(() =>
    readCachedLocation(),
  );
  const [locationState, setLocationState] = useState<MobileLocationState>(() =>
    readCachedLocation() ? "ready" : "idle",
  );
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const locationSupport = useMemo(() => getLocationSupport(), []);

  useEffect(() => {
    if (
      location ||
      !locationSupport.hasGeolocation ||
      !locationSupport.secureContext
    ) {
      if (!locationSupport.hasGeolocation) {
        setLocationState("unsupported");
        setLocationMessage("This device does not expose browser location services.");
      } else if (!locationSupport.secureContext) {
        setLocationState((current) => (current === "ready" ? current : "unavailable"));
        setLocationMessage(
          "Nearby check-in needs a secure OPS host. Search and delivery filters still work.",
        );
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          capturedAt: new Date().toISOString(),
        };
        setLocation(nextLocation);
        setLocationState("ready");
        setLocationMessage("Nearby check-in suggestions are live.");
        saveCachedLocation(nextLocation);
      },
      () => {
        setLocationState("idle");
        setLocationMessage(
          "Enable location when you're ready and OPS Mobile can suggest the nearest stop.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 7_500,
      },
    );
  }, [location, locationSupport.hasGeolocation, locationSupport.secureContext]);

  const refreshLocation = () => {
    if (!locationSupport.hasGeolocation) {
      setLocationState("unsupported");
      setLocationMessage("This device does not expose browser location services.");
      return;
    }
    if (!locationSupport.secureContext) {
      setLocationState("unavailable");
      setLocationMessage(
        "Location assist needs a secure OPS host or localhost. On this LAN host, use search until the secure deployment is live.",
      );
      return;
    }

    setLocationState("locating");
    setLocationMessage("Checking your current position for the nearest stop...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          capturedAt: new Date().toISOString(),
        };
        setLocation(nextLocation);
        setLocationState("ready");
        setLocationMessage("Nearby check-in suggestion updated.");
        saveCachedLocation(nextLocation);
      },
      (error) => {
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "idle");
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location access is blocked on this device right now. Search still works."
            : "OPS Mobile could not refresh your position. Search or route filters still work.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 7_500,
      },
    );
  };

  const accountsWithDistance = useMemo<AccountWithDistance[]>(
    () =>
      view.accounts.map((account) => ({
        account,
        distanceMiles: location
          ? calculateDistanceMiles(location, account.lat, account.lng)
          : undefined,
      })),
    [location, view.accounts],
  );

  const stopDistances = useMemo(
    () =>
      view.stops
        .map((stop) => ({
          stop,
          distanceMiles: location
            ? calculateDistanceMiles(location, stop.lat, stop.lng)
            : undefined,
        }))
        .filter(
          (entry): entry is { stop: OpsMobileDerivedStop; distanceMiles: number } =>
            typeof entry.distanceMiles === "number" &&
            Number.isFinite(entry.distanceMiles),
        )
        .sort((left, right) => left.distanceMiles - right.distanceMiles),
    [location, view.stops],
  );

  const filterCounts = useMemo(
    () => ({
      deliveries: view.accounts.filter(isActionableAccount).length,
      nearby: accountsWithDistance.filter(
        (entry) => typeof entry.distanceMiles === "number",
      ).length,
      recent: view.accounts.filter(isRecentAccount).length,
      all: view.accounts.length,
    }),
    [accountsWithDistance, view.accounts],
  );

  const visibleAccounts = useMemo(() => {
    const filtered = accountsWithDistance
      .filter(({ account, distanceMiles }) => {
        if (!matchesAccountSearch(account, search)) {
          return false;
        }

        switch (filter) {
          case "deliveries":
            return isActionableAccount(account);
          case "nearby":
            return typeof distanceMiles === "number";
          case "recent":
            return isRecentAccount(account);
          default:
            return true;
        }
      })
      .sort((left, right) => {
        if (filter === "nearby") {
          const leftDistance = left.distanceMiles ?? Number.POSITIVE_INFINITY;
          const rightDistance = right.distanceMiles ?? Number.POSITIVE_INFINITY;
          if (leftDistance !== rightDistance) {
            return leftDistance - rightDistance;
          }
        }
        return compareOperationalAccounts(left, right);
      });

    return {
      results: filtered.slice(0, ACCOUNT_RESULT_LIMIT),
      hiddenCount: Math.max(0, filtered.length - ACCOUNT_RESULT_LIMIT),
    };
  }, [accountsWithDistance, filter, search]);

  const nearbyStopSuggestion = useMemo(() => {
    if (currentStop) {
      return {
        stop: currentStop,
        distanceMiles: undefined,
      };
    }
    return stopDistances.find(
      (entry) =>
        entry.stop.localStatus !== "completed" &&
        entry.distanceMiles <= NEARBY_SUGGESTION_MILES,
    );
  }, [currentStop, stopDistances]);

  const nearbyAccountSuggestion = useMemo(() => {
    if (nearbyStopSuggestion) {
      return undefined;
    }
    return accountsWithDistance
      .filter(
        (entry) =>
          typeof entry.distanceMiles === "number" &&
          entry.distanceMiles <= NEARBY_SUGGESTION_MILES,
      )
      .sort(compareOperationalAccounts)[0];
  }, [accountsWithDistance, nearbyStopSuggestion]);

  const filterButtons: Array<{
    id: MobileHomeFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "deliveries",
      label: "Deliveries",
      count: filterCounts.deliveries,
    },
    {
      id: "nearby",
      label: "Nearby",
      count: filterCounts.nearby,
    },
    {
      id: "recent",
      label: "Recent",
      count: filterCounts.recent,
    },
    {
      id: "all",
      label: "All",
      count: filterCounts.all,
    },
  ];

  return (
    <div className="space-y-4">
      {currentStop ? (
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/65">
                Current stop
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {currentStop.siteName}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={stopStatusClass(currentStop.localStatus)}>
                  {currentStop.localStatus.replace("-", " ")}
                </Badge>
                <Badge className="border-white/15 bg-white/8 text-white/75">
                  {currentStop.expectedCodes.length} codes
                </Badge>
                <Badge className="border-white/15 bg-white/8 text-white/75">
                  {currentStop.eventSnapshot.returnedCount} returns
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              >
                <Link to={`/ops/mobile/stops/${currentStop.id}`}>Open stop</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/15 bg-slate-950/35 text-white hover:bg-slate-900/60"
              >
                <Link to="/ops/mobile/scan">Scan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section>
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-white">Client check-in workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((entry) => (
                <Button
                  key={entry.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={
                    filter === entry.id
                      ? "rounded-full border-cyan-300/40 bg-cyan-300/12 text-cyan-100 hover:bg-cyan-300/18"
                      : "rounded-full border-white/15 bg-slate-950/35 text-white hover:bg-slate-900/60"
                  }
                  onClick={() => setFilter(entry.id)}
                >
                  {formatMobileCount(entry.count)} {entry.label}
                </Button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search clients, contact, phone, route, or address"
                  className="h-11 rounded-2xl border-white/10 bg-slate-950/35 pl-10 text-white placeholder:text-white/35"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs text-white/55">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full px-3 text-white hover:bg-slate-900/60"
                  onClick={refreshLocation}
                >
                  <LocateFixed className="mr-2 h-4 w-4" />
                  {locationState === "ready" ? "Refresh location" : "Use my location"}
                </Button>
              </div>
              {locationMessage ? (
                <p className="mt-2 text-xs text-white/50">{locationMessage}</p>
              ) : null}
            </div>

            {nearbyStopSuggestion ? (
              <Link
                to={`/ops/mobile/stops/${nearbyStopSuggestion.stop.id}`}
                className="block rounded-2xl border border-cyan-300/18 bg-cyan-300/10 p-4 transition hover:bg-cyan-300/14"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">
                      {currentStop ? "Current stop" : "Suggested check-in"}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {nearbyStopSuggestion.stop.siteName}
                    </p>
                    <p className="mt-1 text-sm text-white/65">
                      {nearbyStopSuggestion.stop.routeLabel}
                    </p>
                  </div>
                  <Badge className={stopStatusClass(nearbyStopSuggestion.stop.localStatus)}>
                    {currentStop
                      ? nearbyStopSuggestion.stop.localStatus.replace("-", " ")
                      : formatDistance(nearbyStopSuggestion.distanceMiles) ??
                        "Open stop"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/75">
                  <span>{nearbyStopSuggestion.stop.orderCount} orders</span>
                  <span>{nearbyStopSuggestion.stop.expectedCodes.length} codes</span>
                  <span>{nearbyStopSuggestion.stop.eventSnapshot.returnedCount} returns</span>
                </div>
              </Link>
            ) : nearbyAccountSuggestion ? (
              <Link
                to={`/ops/mobile/accounts/${nearbyAccountSuggestion.account.id}`}
                className="block rounded-2xl border border-cyan-300/18 bg-cyan-300/10 p-4 transition hover:bg-cyan-300/14"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">
                      Nearby account
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {nearbyAccountSuggestion.account.name}
                    </p>
                    <p className="mt-1 text-sm text-white/65">
                      {nearbyAccountSuggestion.account.contactName ||
                        nearbyAccountSuggestion.account.phone ||
                        "Open account"}
                    </p>
                  </div>
                  <Badge className="border-cyan-300/30 bg-cyan-300/12 text-cyan-100">
                    {formatDistance(nearbyAccountSuggestion.distanceMiles) ?? "Nearby"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/75">
                  <span>{nearbyAccountSuggestion.account.activeOrderCount} active</span>
                  <span>{nearbyAccountSuggestion.account.pendingCount} pending</span>
                  <span>{nearbyAccountSuggestion.account.phone || "No phone"}</span>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
                OPS Mobile will suggest a stop here when you have a current route or a
                nearby client with saved coordinates.
              </div>
            )}

            <div className="space-y-3">
              {visibleAccounts.results.map(({ account, distanceMiles }) => (
                <Link
                  key={account.id}
                  to={`/ops/mobile/accounts/${account.id}`}
                  className="block rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:bg-slate-900/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{account.name}</p>
                        {account.onRouteOrderCount > 0 ? (
                          <Badge className="border-cyan-300/30 bg-cyan-300/12 text-cyan-100">
                            <Truck className="mr-1 h-3.5 w-3.5" />
                            In route
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="border-white/15 bg-white/8 text-white/75">
                        {account.activeOrderCount} active
                      </Badge>
                      {formatDistance(distanceMiles) ? (
                        <p className="mt-2 text-xs text-cyan-100/75">
                          {formatDistance(distanceMiles)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                    {account.nextDeliveryDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatMobileDate(account.nextDeliveryDate)}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {account.contactName || account.phone || "Open account"}
                    </span>
                    {account.pendingCount > 0 ? (
                      <span>{account.pendingCount} queued</span>
                    ) : null}
                  </div>
                </Link>
              ))}

              {visibleAccounts.results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
                  No accounts match this filter yet. Switch to another filter or search
                  a client directly.
                </div>
              ) : null}

              {visibleAccounts.hiddenCount > 0 ? (
                <p className="text-xs text-white/45">
                  Showing the first {ACCOUNT_RESULT_LIMIT} accounts to keep home clear.
                  Refine the filter or search to narrow the list further.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-slate-950/25 px-4 py-3 text-sm text-white/60">
        <div className="flex flex-wrap gap-3">
          <span>{view.queueSummary.pending} pending</span>
          <span>{view.queueSummary.blocked} blocked</span>
          <span>{view.queueSummary.synced} synced</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/15 bg-slate-950/35 text-white hover:bg-slate-900/60"
            onClick={() => {
              void syncQueue();
            }}
          >
            Sync
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-white/15 bg-slate-950/35 text-white hover:bg-slate-900/60"
            onClick={() => {
              void refreshData();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
