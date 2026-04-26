import { Gauge, Snowflake, Thermometer, Waves, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlowSuiteLayout } from "./FlowSuiteLayout";
import {
  calculateRemainingPercent,
  formatFlowDateTime,
  formatFlowQty,
  getTapDiagnostics,
} from "./data";
import { flowGlassPanelStyle } from "./theme";
import { type FlowRuntimeTapState, useFlowRuntime } from "./runtime";

const runtimeStateClass: Record<FlowRuntimeTapState, string> = {
  ready: "border-green-500/45 bg-green-500/20 text-green-100",
  pouring: "border-cyan-500/45 bg-cyan-500/20 text-cyan-100",
  blocked: "border-amber-500/50 bg-amber-500/20 text-amber-100",
  offline: "border-red-500/45 bg-red-500/20 text-red-100",
};

export default function FlowTapsPage() {
  return (
    <FlowSuiteLayout
      title="Tap Runtime"
      description="FLOW edge runtime cards for per-tap availability, temp/CO2 telemetry, and control intents."
    >
      <FlowTapsContent />
    </FlowSuiteLayout>
  );
}

function FlowTapsContent() {
  const { taps, assignments, products, tapAssignments, tapStates, setTapState, controlIntents, createControlIntent } =
    useFlowRuntime();

  const orderedTaps = [...taps].sort(
    (left, right) => (left.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.displayOrder ?? Number.MAX_SAFE_INTEGER)
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {orderedTaps.map((tap) => {
          const runtimeState = tapStates[tap.id] ?? "offline";
          const assignment =
            assignments.find((entry) => entry.tapId === tap.id && entry.status === "active") ??
            [...assignments]
              .filter((entry) => entry.tapId === tap.id)
              .sort((left, right) => new Date(right.updatedAt).valueOf() - new Date(left.updatedAt).valueOf())[0];
          const tapAssignment =
            tapAssignments.find((entry) => entry.tapId === tap.id) ??
            tapAssignments.find((entry) => entry.tapAssignmentId === assignment?.tapAssignmentId);
          const product = products.find(
            (entry) => entry.productId === (tapAssignment?.productId ?? assignment?.productId)
          );
          const diagnostics = getTapDiagnostics(tap.id);
          const remainingPercent = assignment ? calculateRemainingPercent(assignment) : 0;

          return (
            <Card key={tap.id} style={flowGlassPanelStyle}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{tap.name}</CardTitle>
                    <CardDescription>
                      {tap.siteId} • {tap.meterType.replace("_", " ")}
                    </CardDescription>
                  </div>
                  <Badge className={runtimeStateClass[runtimeState]}>{runtimeState}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border border-green-400/25 bg-black/25 p-2">
                    <p className="text-xs text-muted-foreground">Temp</p>
                    <p className="mt-1 flex items-center font-medium">
                      <Thermometer className="mr-1 h-3.5 w-3.5" />
                      {diagnostics.tempC.toFixed(1)} C
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-400/25 bg-black/25 p-2">
                    <p className="text-xs text-muted-foreground">CO2</p>
                    <p className="mt-1 flex items-center font-medium">
                      <Gauge className="mr-1 h-3.5 w-3.5" />
                      {diagnostics.co2Vol.toFixed(2)} vol
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-400/25 bg-black/25 p-2">
                    <p className="text-xs text-muted-foreground">Pressure</p>
                    <p className="mt-1 flex items-center font-medium">
                      <Waves className="mr-1 h-3.5 w-3.5" />
                      {diagnostics.co2Psi.toFixed(1)} psi
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                  <p className="text-sm font-medium">Mounted Assignment</p>
                  {assignment ? (
                    <div className="mt-2 space-y-2 text-sm">
                      <p className="font-medium text-green-50">
                        {tapAssignment?.productName ?? product?.name ?? assignment.productCode ?? assignment.skuId}
                      </p>
                      <Progress value={remainingPercent} className="h-2 bg-black/35" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFlowQty(assignment.remainingQty, assignment.uom)} remaining</span>
                        <span>{remainingPercent.toFixed(1)}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-green-400/20 bg-black/20 p-3 text-xs">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Product Code</p>
                          <p className="mt-1 font-medium text-green-50">{tapAssignment?.productCode ?? assignment.productCode ?? "--"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">SKU</p>
                          <p className="mt-1 font-medium text-green-50">{assignment.skuId}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Package Lot</p>
                          <p className="mt-1 font-medium text-green-50">
                            {assignment.packageLotCode ?? tapAssignment?.packageLotCode ?? "--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Asset</p>
                          <p className="mt-1 font-medium text-green-50">
                            {assignment.assetCode ?? tapAssignment?.assetCode ?? assignment.assetId ?? "--"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-green-400/20 bg-black/15 p-3 text-xs text-muted-foreground">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em]">Product ID</p>
                          <p className="mt-1 truncate font-mono text-[11px] text-green-100/80">
                            {tapAssignment?.productId ?? assignment.productId ?? "--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em]">Label Version</p>
                          <p className="mt-1 truncate font-mono text-[11px] text-green-100/80">
                            {tapAssignment?.labelVersionId ?? assignment.labelVersionId ?? "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No active keg assignment.</p>
                  )}
                </div>

                <div className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                  <p className="mb-2 text-sm font-medium">Runtime State</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setTapState(tap.id, "ready")}>
                      Ready
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTapState(tap.id, "pouring")}>
                      Pouring
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTapState(tap.id, "blocked")}>
                      Blocked
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTapState(tap.id, "offline")}>
                      Offline
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-green-400/25 bg-black/25 p-3">
                  <p className="mb-2 text-sm font-medium">Control Intents (Stub)</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        createControlIntent({
                          tapId: tap.id,
                          intentType: "set_temp",
                          requestedBy: "flow-ui",
                          targetTempC: Number((diagnostics.tempC - 0.3).toFixed(1)),
                        })
                      }
                    >
                      <Snowflake className="mr-1 h-3.5 w-3.5" />
                      Temp -0.3C
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        createControlIntent({
                          tapId: tap.id,
                          intentType: "set_co2",
                          requestedBy: "flow-ui",
                          targetCo2Vol: Number((diagnostics.co2Vol + 0.05).toFixed(2)),
                        })
                      }
                    >
                      <Gauge className="mr-1 h-3.5 w-3.5" />
                      CO2 +0.05
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        createControlIntent({ tapId: tap.id, intentType: "line_clean", requestedBy: "flow-ui" })
                      }
                    >
                      <Wrench className="mr-1 h-3.5 w-3.5" />
                      Line Clean
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={flowGlassPanelStyle}>
        <CardHeader>
          <CardTitle>Recent Control Intents</CardTitle>
          <CardDescription>
            Intent messages represent edge-runtime requests and do not directly mutate OS inventory/control truth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {controlIntents.length === 0 && (
            <p className="text-sm text-muted-foreground">No control intents created yet.</p>
          )}
          {controlIntents.slice(0, 8).map((intent) => (
            <div key={intent.id} className="rounded-lg border border-green-400/25 bg-black/25 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {intent.intentType} • {intent.tapId}
                </p>
                <Badge variant="outline">{intent.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Requested {formatFlowDateTime(intent.requestedAt)} by {intent.requestedBy}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
