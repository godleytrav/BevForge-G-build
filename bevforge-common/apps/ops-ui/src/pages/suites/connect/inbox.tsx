import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  RefreshCw,
  BriefcaseBusiness,
  UsersRound,
  ClipboardCheck,
  Clock3,
} from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  connectSoftBadgeStyle,
  connectTextColor,
  formatDateTime,
  statusPillClass,
} from "./theme";

export default function ConnectInboxPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();

  const openTasks =
    overview?.tasks.filter(
      (task) => task.status !== "done" && task.status !== "canceled",
    ) ?? [];
  const waitingThreads =
    overview?.threads.filter(
      (thread) =>
        thread.status === "waiting_external" || thread.status === "open",
    ) ?? [];
  const recentTasks = [...openTasks].slice(0, 5);
  const recentThreads = [...(overview?.threads ?? [])].slice(0, 5);
  const recentActivities = [...(overview?.activities ?? [])].slice(0, 6);

  const linksBySuite = (overview?.links ?? []).reduce<Record<string, number>>(
    (acc, link) => {
      acc[link.sourceSuite] = (acc[link.sourceSuite] ?? 0) + 1;
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Inbox" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT inbox...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Inbox" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: connectTextColor }}
            >
              CONNECT Inbox
            </h1>
            <p className="mt-1 text-muted-foreground">
              Employee and CRM communications across CONNECT-owned workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>
              <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
              {openTasks.length} Open Tasks
            </Badge>
            <Badge style={connectBadgeStyle}>
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              {waitingThreads.length} Active Threads
            </Badge>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <ConnectSuiteNav
          counts={{
            inbox: openTasks.length + waitingThreads.length,
            messages: overview?.threads.length ?? 0,
            employees: overview?.employees.length ?? 0,
            tasks: overview?.tasks.length ?? 0,
            campaigns: undefined,
            timesheets: undefined,
            accounts: opsAccounts.length,
            contacts: overview?.contacts.length ?? 0,
            threads: overview?.threads.length ?? 0,
          }}
        />

        {error && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Tasks Awaiting Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{openTasks.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                OPS Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{opsAccounts.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                CRM Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {overview?.contacts.length ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card style={connectGlassPanelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Recent Task Queue
              </CardTitle>
              <CardDescription>
                CONNECT tasks can reference OS/OPS IDs, but do not mutate their
                ledgers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              )}
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-violet-400/25 bg-black/25 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-violet-50">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDateTime(task.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusPillClass(task.priority)}>
                        {task.priority.replace("_", " ")}
                      </Badge>
                      <Badge className={statusPillClass(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/connect/tasks">Open Tasks</Link>
              </Button>
            </CardContent>
          </Card>

          <Card style={connectGlassPanelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Active Threads
              </CardTitle>
              <CardDescription>
                Operational communications and customer follow-up threads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentThreads.length === 0 && (
                <p className="text-sm text-muted-foreground">No threads yet.</p>
              )}
              {recentThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="rounded-lg border border-violet-400/25 bg-black/25 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-violet-50">
                        {thread.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {thread.messages.length} messages • Updated{" "}
                        {formatDateTime(thread.updatedAt)}
                      </p>
                    </div>
                    <Badge className={statusPillClass(thread.status)}>
                      {thread.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/connect/threads">Open Threads</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              CONNECT activity log with OPS references only. Account/order
              updates must flow through OPS APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No CONNECT activity yet.
              </p>
            )}
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-violet-400/25 bg-black/25 p-3"
              >
                <p className="text-sm text-violet-100">{activity.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.entityType}:{activity.entityId} •{" "}
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4" />
              Cross-Suite Reference Summary
            </CardTitle>
            <CardDescription>
              CONNECT stores references only. Quantity, batch, reservation, and
              order lifecycle writes stay in OS/OPS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(linksBySuite).length === 0 && (
                <Badge style={connectSoftBadgeStyle}>
                  No cross-suite links yet
                </Badge>
              )}
              {Object.entries(linksBySuite).map(([suiteId, count]) => (
                <Badge key={suiteId} style={connectSoftBadgeStyle}>
                  {suiteId.toUpperCase()}: {count}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="border-violet-400/30 bg-black/25">
                <CardHeader>
                  <CardTitle className="text-sm">OS Boundary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {overview?.boundaries.os}
                </CardContent>
              </Card>
              <Card className="border-violet-400/30 bg-black/25">
                <CardHeader>
                  <CardTitle className="text-sm">OPS Boundary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {overview?.boundaries.ops}
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/connect/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/connect/campaigns">Campaigns</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/connect/timesheets">Timesheets</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/connect/accounts">
                  <UsersRound className="mr-2 h-4 w-4" />
                  OPS Accounts
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/connect/contacts">Contacts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
