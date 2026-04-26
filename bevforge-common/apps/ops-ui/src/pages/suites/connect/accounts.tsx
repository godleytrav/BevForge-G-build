import { useMemo } from "react";
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
import { RefreshCw } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

export default function ConnectAccountsPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();

  const contacts = overview?.contacts ?? [];
  const tasks = overview?.tasks ?? [];
  const threads = overview?.threads ?? [];

  const contactCountByAccount = useMemo(() => {
    return contacts.reduce<Record<string, number>>((acc, contact) => {
      acc[contact.opsAccountId] = (acc[contact.opsAccountId] ?? 0) + 1;
      return acc;
    }, {});
  }, [contacts]);

  const taskCountByAccount = useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      if (!task.opsAccountId) {
        return acc;
      }
      acc[task.opsAccountId] = (acc[task.opsAccountId] ?? 0) + 1;
      return acc;
    }, {});
  }, [tasks]);

  const threadCountByAccount = useMemo(() => {
    return threads.reduce<Record<string, number>>((acc, thread) => {
      if (!thread.opsAccountId) {
        return acc;
      }
      acc[thread.opsAccountId] = (acc[thread.opsAccountId] ?? 0) + 1;
      return acc;
    }, {});
  }, [threads]);

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Accounts" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading OPS accounts...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Accounts" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              OPS Account Directory
            </h1>
            <p className="mt-1 text-muted-foreground">
              Read-only OPS CRM account mirror for CONNECT tasks, contacts, and
              threads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>
              {opsAccounts.length} OPS Accounts
            </Badge>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <ConnectSuiteNav
          counts={{
            inbox:
              (overview?.tasks.length ?? 0) + (overview?.threads.length ?? 0),
            messages: overview?.threads.length ?? 0,
            employees: overview?.employees.length ?? 0,
            tasks: overview?.tasks.length ?? 0,
            campaigns: undefined,
            timesheets: undefined,
            accounts: opsAccounts.length,
            contacts: contacts.length,
            threads: threads.length,
          }}
        />

        {error && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">{error}</CardContent>
          </Card>
        )}

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>OPS Accounts (Read-Only)</CardTitle>
            <CardDescription>
              Update account lifecycle data in OPS CRM and re-import into
              CONNECT. CONNECT does not directly mutate OPS account records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opsAccounts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No OPS accounts imported yet. Use CONNECT Contacts to run an OPS
                CRM import.
              </p>
            )}
            {opsAccounts.map((account) => (
              <div
                key={account.id}
                className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-violet-50">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      opsAccountId: {account.id}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusPillClass(account.status)}>
                        {account.status}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        type: {account.type}
                      </Badge>
                      {account.primarySiteId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          primarySiteId: {account.primarySiteId}
                        </Badge>
                      )}
                    </div>
                    {account.address && (
                      <p className="text-xs text-muted-foreground">
                        {account.address}
                      </p>
                    )}
                    {account.email && (
                      <p className="text-xs text-muted-foreground">
                        {account.email}
                      </p>
                    )}
                    {account.phone && (
                      <p className="text-xs text-muted-foreground">
                        {account.phone}
                      </p>
                    )}
                  </div>

                  <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>CONNECT Contacts</span>
                    <span className="text-right text-violet-100">
                      {contactCountByAccount[account.id] ?? 0}
                    </span>
                    <span>CONNECT Tasks</span>
                    <span className="text-right text-violet-100">
                      {taskCountByAccount[account.id] ?? 0}
                    </span>
                    <span>CONNECT Threads</span>
                    <span className="text-right text-violet-100">
                      {threadCountByAccount[account.id] ?? 0}
                    </span>
                    <span>Mirrored At</span>
                    <span className="text-right text-violet-100">
                      {formatDateTime(account.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
