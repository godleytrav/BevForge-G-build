import { BarChart3, Clock3, CloudCog, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowSuiteLayout } from "./FlowSuiteLayout";
import {
  flowOsDepletionStatuses,
  formatFlowDateTime,
  formatFlowQty,
  getFlowOverviewSnapshot,
  getRecentFlowEvents,
  getTapDisplayName,
  getTapPourDistribution,
} from "./data";
import { flowGlassPanelStyle, flowSoftBadgeStyle, ledgerStatusPillClass, sourceModePillClass } from "./theme";
import { useFlowRuntime } from "./runtime";

export default function FlowAnalyticsPage() {
  return (
    <FlowSuiteLayout
      title="Analytics"
      description="Taproom telemetry, queue health, and OS depletion acceptance visibility."
    >
      <FlowAnalyticsContent />
    </FlowSuiteLayout>
  );
}

function FlowAnalyticsContent() {
  const overview = getFlowOverviewSnapshot();
  const recentEvents = getRecentFlowEvents(24);
  const distribution = getTapPourDistribution(24);
  const { syncStatus, runSyncPass, queuedEvents } = useFlowRuntime();

  const queuedCount = queuedEvents.filter((event) => event.queueStatus === "queued").length;
  const failedCount = queuedEvents.filter((event) => event.queueStatus === "failed").length;
  const acceptedCount = queuedEvents.filter((event) => event.queueStatus === "accepted").length;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.eventsLastHour}</p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume (1h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.totalVolumeLastHour.toFixed(1)} oz</p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{queuedCount}</p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{failedCount}</p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{acceptedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card style={flowGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top Taps by Volume (24h)
            </CardTitle>
            <CardDescription>Distribution from FLOW edge telemetry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {distribution.map((row) => (
              <div key={row.tapId} className="rounded-lg border border-green-400/25 bg-black/25 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-green-50">{row.tapName}</p>
                  <Badge style={flowSoftBadgeStyle}>{row.totalVolume.toFixed(1)} oz</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{row.eventCount} events</p>
              </div>
            ))}
            {distribution.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent telemetry distribution.</p>
            )}
          </CardContent>
        </Card>

        <Card style={flowGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudCog className="h-4 w-4" />
              Runtime Sync Queue
            </CardTitle>
            <CardDescription>Edge queue status for event sync to OS control-plane.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge style={flowSoftBadgeStyle}>Sync Mode: {syncStatus}</Badge>
              <Button size="sm" variant="outline" onClick={runSyncPass}>
                Run Sync Pass
              </Button>
            </div>
            {queuedEvents.slice(0, 10).map((queued) => (
              <div key={queued.event.eventId} className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-green-50">{queued.event.eventId}</p>
                  <Badge className={ledgerStatusPillClass(queued.queueStatus === "failed" ? "rejected" : queued.queueStatus === "accepted" ? "accepted" : "pending")}>
                    {queued.queueStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getTapDisplayName(queued.event.tapId)} • {formatFlowQty(queued.event.volume, queued.event.uom)} • retries {queued.retries}
                </p>
                {queued.lastError && <p className="text-xs text-red-200">{queued.lastError}</p>}
              </div>
            ))}
            {queuedEvents.length === 0 && <p className="text-sm text-muted-foreground">No queued runtime events.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card style={flowGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              OS Depletion Acceptance
            </CardTitle>
            <CardDescription>
              FLOW event ids are idempotent; OS acceptance determines depletion truth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {flowOsDepletionStatuses.map((status) => (
              <div key={status.eventId} className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-green-50">{status.eventId}</p>
                  <Badge className={ledgerStatusPillClass(status.status)}>{status.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {status.osLedgerRef ? `OS ref ${status.osLedgerRef}` : "No OS reference yet"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card style={flowGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Recent Event Stream
            </CardTitle>
            <CardDescription>Latest FLOW events across bartender and kiosk modes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.eventId} className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-green-50">{getTapDisplayName(event.tapId)}</p>
                  <Badge className={sourceModePillClass(event.sourceMode)}>
                    {event.sourceMode.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFlowQty(event.volume, event.uom)} • {formatFlowDateTime(event.occurredAt)} • {event.eventId}
                </p>
                {(event.productCode || event.packageLotCode || event.assetCode) && (
                  <p className="text-xs text-muted-foreground">
                    {[event.productCode, event.packageLotCode, event.assetCode].filter(Boolean).join(" / ")}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
