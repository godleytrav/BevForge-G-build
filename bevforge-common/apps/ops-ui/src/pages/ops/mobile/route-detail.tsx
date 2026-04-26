import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import {
  formatMobileCurrency,
  mobileGlassClass,
  stopStatusClass,
} from "@/features/ops-mobile/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";

const progressValue = (completed: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (completed / total) * 100));
};

export default function OpsMobileRouteDetailPage() {
  const { routeId } = useParams();
  const { view } = useOpsMobile();
  const route = view.routes.find((candidate) => candidate.id === routeId);

  if (!route) {
    return (
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardContent className="space-y-4 p-4">
          <p className="text-lg font-semibold text-white">Route not found</p>
          <p className="text-sm text-white/65">
            This route is not present in the current mobile cache.
          </p>
          <Link
            to="/ops/mobile/routes"
            className="inline-flex items-center gap-2 text-sm text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to routes
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to="/ops/mobile/routes"
        className="inline-flex items-center gap-2 text-sm text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to routes
      </Link>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">{route.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/65">
                {route.truckName ?? "No truck assigned"} · {route.orderCount} orders
              </p>
              <p className="mt-1 text-sm text-white/65">
                {route.stopCount} stops · {formatMobileCurrency(route.totalValue)}
              </p>
            </div>
            <Badge className={route.currentStop ? stopStatusClass(route.currentStop.localStatus) : "border-white/15 bg-white/8 text-white/75"}>
              {route.currentStop?.siteName ?? route.status.replace("-", " ")}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/65">
              <span>Completion</span>
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
                Expected codes
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {route.expectedCodeCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Pending writes
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {route.pendingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Issues
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {route.issueCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {route.stops.map((stop) => (
          <Card
            key={stop.id}
            className={`${mobileGlassClass} rounded-[24px] transition hover:bg-white/[0.09]`}
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{stop.siteName}</p>
                  <p className="mt-1 text-sm text-white/60">
                    {stop.address || "Address missing"} · {stop.orderCount} orders
                  </p>
                </div>
                <Badge className={stopStatusClass(stop.localStatus)}>
                  {stop.localStatus.replace("-", " ")}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Stop value
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatMobileCurrency(stop.totalValue)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Expected
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {stop.expectedCodes.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Delivered
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {stop.eventSnapshot.deliveredCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Returns
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {stop.eventSnapshot.returnedCount}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {stop.expectedCodes.slice(0, 4).map((code) => (
                  <span
                    key={`${stop.id}-${code.kind}-${code.value}`}
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
                  >
                    {code.label}: {code.value}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/ops/mobile/stops/${stop.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
                >
                  Open stop
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={`/ops/mobile/accounts/${stop.siteId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                >
                  Open account
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

