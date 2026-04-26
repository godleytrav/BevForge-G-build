import { Clock3, PauseCircle, PlayCircle, ShieldAlert, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlowSuiteLayout } from "./FlowSuiteLayout";
import { formatFlowDateTime, formatFlowQty } from "./data";
import { flowGlassPanelStyle, sessionStatusPillClass } from "./theme";
import { useFlowRuntime } from "./runtime";

export default function FlowSessionsPage() {
  return (
    <FlowSuiteLayout
      title="Sessions"
      description="Self-serve and bartender session policies at the FLOW edge runtime."
    >
      <FlowSessionsContent />
    </FlowSuiteLayout>
  );
}

function FlowSessionsContent() {
  const { sessions, upsertSessionStatus, queuedEvents, activeSiteId } = useFlowRuntime();

  const siteSessions = sessions.filter((session) => session.siteId === activeSiteId);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {siteSessions.filter((session) => session.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {siteSessions.filter((session) => session.status === "paused").length}
            </p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {siteSessions.filter((session) => session.status === "blocked").length}
            </p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queued Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{queuedEvents.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card style={flowGlassPanelStyle}>
        <CardHeader>
          <CardTitle>Session Runtime Controls</CardTitle>
          <CardDescription>
            FLOW controls session gating and serving runtime. OPS remains authority for wallet/commerce balances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {siteSessions.map((session) => {
            const consumedPercent =
              session.limitQty <= 0 ? 0 : Math.max(0, Math.min(100, (session.consumedQty / session.limitQty) * 100));
            const linkedEvents = queuedEvents.filter((queued) => queued.event.sessionId === session.id);

            return (
              <div key={session.id} className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-green-50">{session.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.mode.replace("_", " ")} • {session.allowedTapIds?.length ?? 0} taps
                    </p>
                  </div>
                  <Badge className={sessionStatusPillClass(session.status)}>{session.status}</Badge>
                </div>

                <div className="mt-2 space-y-1">
                  <Progress value={consumedPercent} className="h-2 bg-black/35" />
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatFlowQty(session.consumedQty, session.uom)} of {formatFlowQty(session.limitQty, session.uom)}
                    </span>
                    <span>{consumedPercent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upsertSessionStatus(session.id, "active")}
                  >
                    <PlayCircle className="mr-1 h-3.5 w-3.5" />
                    Set Active
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upsertSessionStatus(session.id, "paused")}
                  >
                    <PauseCircle className="mr-1 h-3.5 w-3.5" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upsertSessionStatus(session.id, "blocked")}
                  >
                    <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                    Block
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upsertSessionStatus(session.id, "closed")}
                  >
                    <Clock3 className="mr-1 h-3.5 w-3.5" />
                    Close
                  </Button>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  Updated {formatFlowDateTime(session.updatedAt)} • Queue events for session: {linkedEvents.length}
                </div>
              </div>
            );
          })}
          {siteSessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No sessions for selected site.</p>
          )}
        </CardContent>
      </Card>

      <Card style={flowGlassPanelStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Boundary Reminder
          </CardTitle>
          <CardDescription>
            FLOW session state may reference wallet token/customer identity. OPS remains source of truth for wallet
            value, account ledger, and order lifecycle.
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
