import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import {
  getTruckDispatchSnapshot,
  getTruckPlanningPreferences,
  getTruckRouteProgress,
  getVehicleCapacity,
} from "@/pages/ops/logistics/data";
import {
  formatMobileCurrency,
  mobileGlassClass,
  stopStatusClass,
} from "@/features/ops-mobile/ui";

const progressValue = (completed: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (completed / total) * 100));
};

export default function OpsMobileRoutesPage() {
  const [searchParams] = useSearchParams();
  const { state, view } = useOpsMobile();
  const planningByTruckId = new Map(
    getTruckPlanningPreferences().map((entry) => [entry.truckId, entry]),
  );
  const highlightedTruckId = searchParams.get("truckId")?.trim() ?? "";
  const highlightedShippingId = searchParams.get("shippingId")?.trim() ?? "";
  const highlightedDestination = searchParams.get("destination")?.trim() ?? "";

  return (
    <div className="space-y-4">
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Mobile route board</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Routes
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {view.routes.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Trucks
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {state.data.fleet.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Current stop
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {view.currentStop?.siteName ?? "None"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Pending writes
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {view.queueSummary.pending}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Fleet dispatch board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {highlightedTruckId || highlightedShippingId ? (
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm text-cyan-50">
              Opened from payload QR
              <p className="mt-2 text-white/80">
                Truck: {highlightedTruckId || "Not set"}
                {highlightedShippingId ? ` · Dispatch: ${highlightedShippingId}` : ""}
                {highlightedDestination ? ` · ${highlightedDestination}` : ""}
              </p>
            </div>
          ) : null}

          {state.data.fleet.length > 0 ? (
            state.data.fleet.map((truck) => {
              const dispatchSnapshot = getTruckDispatchSnapshot(truck.id);
              const progress = getTruckRouteProgress(truck.id);
              const planning = planningByTruckId.get(truck.id);
              const capacity = getVehicleCapacity(truck.vehicleType);

              return (
                <div
                  key={truck.id}
                  className={`rounded-2xl border p-4 ${
                    highlightedTruckId && highlightedTruckId === truck.id
                      ? "border-cyan-300/30 bg-cyan-300/12"
                      : "border-white/10 bg-white/6"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{truck.name}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {truck.id} · {capacity.label}
                      </p>
                    </div>
                    <Badge
                      className={
                        dispatchSnapshot
                          ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                          : truck.status === "on-route"
                            ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-100"
                            : "border-white/15 bg-white/8 text-white/75"
                      }
                    >
                      {dispatchSnapshot
                        ? "ready payload"
                        : progress.routeActive
                          ? "in route"
                          : truck.status.replace("-", " ")}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                    <span>{truck.driver || "No driver assigned"}</span>
                    <span>{truck.homeBase}</span>
                    <span>{truck.maxStops} stop max</span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Payload
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {dispatchSnapshot?.packagingId ?? "Not loaded"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Route target
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {planning?.targetType === "route"
                          ? planning.targetId ?? "Assigned route"
                          : planning?.targetType === "site"
                            ? planning.targetId ?? "Assigned site"
                            : "None"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Progress
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {progress.routeActive
                          ? `Stop ${progress.currentStopIndex + 1}`
                          : "Idle"}
                      </p>
                    </div>
                  </div>

                  {dispatchSnapshot ? (
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                      <span>{dispatchSnapshot.destination}</span>
                      <span>{dispatchSnapshot.totalItems} items</span>
                      <span>{dispatchSnapshot.totalWeightLb} lb</span>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
              No trucks are cached yet.
            </div>
          )}
        </CardContent>
      </Card>

      {view.routes.length > 0 ? (
        <div className="space-y-4">
          {view.routes.map((route) => (
            <Link key={route.id} to={`/ops/mobile/routes/${route.id}`} className="block">
              <Card className={`${mobileGlassClass} rounded-[26px] transition hover:bg-white/[0.09]`}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{route.label}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {route.truckName ?? "No truck assigned"} · {route.orderCount} orders · {route.stopCount} stops
                      </p>
                    </div>

                    <Badge className={route.currentStop ? stopStatusClass(route.currentStop.localStatus) : "border-white/15 bg-white/8 text-white/75"}>
                      {route.currentStop?.siteName ?? route.status.replace("-", " ")}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/65">
                      <span>Route completion</span>
                      <span>
                        {route.progress.completedStops}/{route.progress.totalStops}
                      </span>
                    </div>
                    <Progress
                      value={progressValue(
                        route.progress.completedStops,
                        route.progress.totalStops,
                      )}
                      className="h-2 bg-white/10"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Value
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatMobileCurrency(route.totalValue)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Expected codes
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {route.expectedCodeCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Queue
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {route.pendingCount} pending
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {route.stops.map((stop) => (
                      <div
                        key={stop.id}
                        className="min-w-[170px] rounded-2xl border border-white/10 bg-white/6 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {stop.siteName}
                            </p>
                            <p className="mt-1 text-xs text-white/55">
                              {stop.orderCount} orders
                            </p>
                          </div>
                          <Badge className={stopStatusClass(stop.localStatus)}>
                            {stop.localStatus.replace("-", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardContent className="p-4 text-sm text-white/70">
            No routes are available from the current OPS order cache. This mobile
            surface will populate automatically once OPS orders have delivery dates
            and route groupings.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
