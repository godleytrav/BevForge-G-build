import type { ReactNode } from "react";
import { BarChart3, Droplet, FileText, Package } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlowSuiteNav } from "./FlowSuiteNav";
import { getFlowOverviewSnapshot } from "./data";
import { flowBadgeStyle, flowSoftBadgeStyle, flowTextColor } from "./theme";
import { FlowRuntimeProvider, useFlowRuntime } from "./runtime";

interface FlowSuiteLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function FlowSuiteLayout({ title, description, children }: FlowSuiteLayoutProps) {
  return (
    <FlowRuntimeProvider>
      <FlowSuiteLayoutContent title={title} description={description}>
        {children}
      </FlowSuiteLayoutContent>
    </FlowRuntimeProvider>
  );
}

function FlowSuiteLayoutContent({ title, description, children }: FlowSuiteLayoutProps) {
  const overview = getFlowOverviewSnapshot();
  const { syncStatus, setSyncStatus, queuedEvents, runSyncPass } = useFlowRuntime();

  return (
    <AppShell pageTitle={`FLOW ${title}`} currentSuite="flow">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: flowTextColor }}>
              {title}
            </h1>
            <p className="mt-1 text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge style={flowBadgeStyle}>
              <Droplet className="mr-1 h-3.5 w-3.5" />
              {overview.onlineTaps}/{overview.totalTaps} Online Taps
            </Badge>
            <Badge style={flowBadgeStyle}>
              <Package className="mr-1 h-3.5 w-3.5" />
              {overview.activeAssignments} Active Assignments
            </Badge>
            <Badge style={flowBadgeStyle}>
              <BarChart3 className="mr-1 h-3.5 w-3.5" />
              {overview.eventsLastHour} Events (1h)
            </Badge>
            <Badge style={flowSoftBadgeStyle}>
              <FileText className="mr-1 h-3.5 w-3.5" />
              {overview.onTapMenuItems} On Tap
            </Badge>
            <Badge style={flowSoftBadgeStyle}>Sync: {syncStatus}</Badge>
            <Badge style={flowSoftBadgeStyle}>Queue: {queuedEvents.length}</Badge>
            <div className="flex items-center gap-1">
              <Button size="sm" variant={syncStatus === "online" ? "default" : "outline"} onClick={() => setSyncStatus("online")}>
                Online
              </Button>
              <Button
                size="sm"
                variant={syncStatus === "retrying" ? "default" : "outline"}
                onClick={() => setSyncStatus("retrying")}
              >
                Retrying
              </Button>
              <Button
                size="sm"
                variant={syncStatus === "offline" ? "default" : "outline"}
                onClick={() => setSyncStatus("offline")}
              >
                Offline
              </Button>
              <Button size="sm" variant="outline" onClick={runSyncPass}>
                Sync Pass
              </Button>
            </div>
          </div>
        </div>

        <FlowSuiteNav
          counts={{
            taps: overview.onlineTaps,
            kiosk: overview.onTapMenuItems,
            sessions: overview.activeSessions,
            analytics: overview.eventsLastHour,
          }}
        />

        {children}
      </div>
    </AppShell>
  );
}
