import { useMemo, useState } from "react";
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
import { Download, RefreshCw } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  buildConnectOpsCrmImportPayloadFromLocalStorage,
  importConnectOpsCrmSnapshot,
  type ConnectOpsCrmImportResult,
} from "./data";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

export default function ConnectContactsPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] =
    useState<ConnectOpsCrmImportResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const contacts = overview?.contacts ?? [];
  const accountNameById = useMemo(
    () => new Map(opsAccounts.map((account) => [account.id, account.name])),
    [opsAccounts],
  );

  const handleImportOpsCrm = async () => {
    setSyncing(true);
    setSyncError(null);

    try {
      const payload = buildConnectOpsCrmImportPayloadFromLocalStorage();
      const result = await importConnectOpsCrmSnapshot(payload);
      setSyncResult(result);
      await refresh();
    } catch (importError) {
      console.error(
        "Failed to import OPS CRM mirror into CONNECT:",
        importError,
      );
      setSyncError(
        importError instanceof Error
          ? importError.message
          : "Failed to import OPS CRM mirror",
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Contacts" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT contacts...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Contacts" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Contact Directory
            </h1>
            <p className="mt-1 text-muted-foreground">
              Read-only OPS CRM contacts mirrored into CONNECT for employee
              communication workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>{contacts.length} Contacts</Badge>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => void handleImportOpsCrm()}
              disabled={syncing}
            >
              <Download className="mr-2 h-4 w-4" />
              {syncing ? "Importing..." : "Import OPS CRM"}
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
            threads: overview?.threads.length ?? 0,
          }}
        />

        {error && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">{error}</CardContent>
          </Card>
        )}

        {syncError && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">{syncError}</CardContent>
          </Card>
        )}

        {syncResult && (
          <Card style={connectGlassPanelStyle}>
            <CardHeader>
              <CardTitle>Last OPS CRM Import</CardTitle>
              <CardDescription>
                OPS remains source of truth for CRM. CONNECT stores imported
                contacts as a communication mirror only.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-violet-100">
              Imported {syncResult.accountsImported} accounts and{" "}
              {syncResult.contactsImported} contacts at{" "}
              {formatDateTime(syncResult.importedAt)}.
            </CardContent>
          </Card>
        )}

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>Mirrored Contacts (Read-Only)</CardTitle>
            <CardDescription>
              Update lead/account/contact records in OPS CRM, then re-import
              into CONNECT. CONNECT does not directly mutate OPS CRM records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No mirrored contacts yet. Use Import OPS CRM to load contacts
                into CONNECT.
              </p>
            )}
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-violet-50">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {accountNameById.get(contact.opsAccountId) ??
                        contact.opsAccountId}
                      {contact.title ? ` • ${contact.title}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusPillClass(contact.status)}>
                        {contact.status}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        opsAccountId: {contact.opsAccountId}
                      </Badge>
                      {contact.siteId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          siteId: {contact.siteId}
                        </Badge>
                      )}
                      {contact.orderId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          orderId: {contact.orderId}
                        </Badge>
                      )}
                      {contact.deliveryId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          deliveryId: {contact.deliveryId}
                        </Badge>
                      )}
                      {(contact.tags ?? []).map((tag) => (
                        <Badge
                          key={`${contact.id}-${tag}`}
                          className="border-violet-300/35 bg-violet-600/20 text-violet-100"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-[240px] space-y-1 text-right text-xs text-muted-foreground">
                    {contact.channels.map((channel, index) => (
                      <p key={`${contact.id}-${channel.type}-${index}`}>
                        {channel.type}:{" "}
                        <span className="text-violet-100">{channel.value}</span>
                      </p>
                    ))}
                    <p>
                      Updated{" "}
                      <span className="text-violet-100">
                        {formatDateTime(contact.updatedAt)}
                      </span>
                    </p>
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
