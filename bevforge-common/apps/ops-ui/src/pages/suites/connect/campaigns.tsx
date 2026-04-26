import { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, RefreshCw } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  createConnectCampaign,
  fetchConnectCampaigns,
  updateConnectCampaignStatus,
  type ConnectCampaign,
} from "./data";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

interface CampaignFormState {
  name: string;
  channel: ConnectCampaign["channel"];
  audienceLabel: string;
  ownerId: string;
  scheduledFor: string;
  subject: string;
  content: string;
}

const defaultCampaignForm = (
  ownerId = "connect-system",
): CampaignFormState => ({
  name: "",
  channel: "email",
  audienceLabel: "OPS CRM mirror contacts",
  ownerId,
  scheduledFor: "",
  subject: "",
  content: "",
});

export default function ConnectCampaignsPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const employees = overview?.employees ?? [];
  const [campaigns, setCampaigns] = useState<ConnectCampaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignFormState>(
    defaultCampaignForm(employees[0]?.id ?? "connect-system"),
  );

  const loadCampaigns = async () => {
    setCampaignLoading(true);
    setCampaignError(null);
    try {
      const rows = await fetchConnectCampaigns();
      setCampaigns(rows);
    } catch (loadError) {
      setCampaignError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load campaigns",
      );
    } finally {
      setCampaignLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const runningCampaigns = campaigns.filter(
    (campaign) => campaign.status === "running",
  );
  const scheduledCampaigns = campaigns.filter(
    (campaign) => campaign.status === "scheduled",
  );
  const draftCampaigns = campaigns.filter(
    (campaign) => campaign.status === "draft",
  );

  const opsAudienceCount = useMemo(() => opsAccounts.length, [opsAccounts]);

  const handleCreateCampaign = async () => {
    if (
      !form.name.trim() ||
      !form.content.trim() ||
      !form.audienceLabel.trim()
    ) {
      setCampaignError("Campaign name, audience, and content are required.");
      return;
    }

    setSubmitting(true);
    setCampaignError(null);
    try {
      await createConnectCampaign({
        name: form.name,
        channel: form.channel,
        audienceLabel: form.audienceLabel,
        ownerId: form.ownerId || "connect-system",
        subject: form.subject || undefined,
        content: form.content,
        scheduledFor: form.scheduledFor || undefined,
      });
      setForm(defaultCampaignForm(form.ownerId || "connect-system"));
      await loadCampaigns();
    } catch (createError) {
      setCampaignError(
        createError instanceof Error
          ? createError.message
          : "Failed to create campaign",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (
    campaignId: string,
    status: ConnectCampaign["status"],
  ) => {
    setStatusUpdatingId(campaignId);
    setCampaignError(null);
    try {
      await updateConnectCampaignStatus(campaignId, { status });
      await loadCampaigns();
    } catch (statusError) {
      setCampaignError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update campaign status",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Campaigns" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT campaigns...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Campaigns" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Campaign Control
            </h1>
            <p className="mt-1 text-muted-foreground">
              Internal and external communication campaigns powered by CONNECT
              with OPS CRM mirror audiences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>
              <Megaphone className="mr-1 h-3.5 w-3.5" />
              {campaigns.length} Campaigns
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                void refresh();
                void loadCampaigns();
              }}
            >
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
            employees: employees.length,
            tasks: overview?.tasks.length ?? 0,
            campaigns: campaigns.length,
            timesheets: undefined,
            accounts: opsAccounts.length,
            contacts: overview?.contacts.length ?? 0,
            threads: overview?.threads.length ?? 0,
          }}
        />

        {(error || campaignError) && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">
              {campaignError ?? error}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Running</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{runningCampaigns.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{scheduledCampaigns.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{draftCampaigns.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">OPS Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{opsAudienceCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </CardTitle>
            <CardDescription>
              Campaigns execute communication workflows only. CRM/order changes
              remain in OPS.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Campaign Name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="March Delivery Reminder"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Channel</Label>
              <Select
                value={form.channel}
                onValueChange={(value: ConnectCampaign["channel"]) =>
                  setForm((prev) => ({ ...prev, channel: value }))
                }
              >
                <SelectTrigger className="border-violet-300/35 bg-black/35">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">email</SelectItem>
                  <SelectItem value="sms">sms</SelectItem>
                  <SelectItem value="internal">internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Audience Label</Label>
              <Input
                value={form.audienceLabel}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    audienceLabel: event.target.value,
                  }))
                }
                placeholder="Active on-premise wholesale accounts"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Owner</Label>
              <Select
                value={form.ownerId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, ownerId: value }))
                }
              >
                <SelectTrigger className="border-violet-300/35 bg-black/35">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.displayName}
                    </SelectItem>
                  ))}
                  <SelectItem value="connect-system">CONNECT System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Scheduled For (optional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduledFor: event.target.value,
                  }))
                }
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Subject (optional)</Label>
              <Input
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Upcoming delivery window update"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
                className="min-h-[110px] border-violet-300/35 bg-black/35"
                placeholder="Write campaign copy and call to action..."
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => void handleCreateCampaign()}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>Campaign Queue</CardTitle>
            <CardDescription>
              Launch, pause, or complete campaigns with clear communication
              audit visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignLoading && (
              <p className="text-sm text-muted-foreground">
                Loading campaigns...
              </p>
            )}
            {!campaignLoading && campaigns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No campaigns yet. Create one above.
              </p>
            )}
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-violet-50">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.channel} • {campaign.audienceLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusPillClass(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        Sent: {campaign.metrics.sent}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        Opened: {campaign.metrics.opened}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        Replied: {campaign.metrics.replied}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDateTime(campaign.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusUpdatingId === campaign.id}
                      onClick={() =>
                        void handleStatusUpdate(campaign.id, "scheduled")
                      }
                    >
                      Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusUpdatingId === campaign.id}
                      onClick={() =>
                        void handleStatusUpdate(campaign.id, "running")
                      }
                    >
                      Launch
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusUpdatingId === campaign.id}
                      onClick={() =>
                        void handleStatusUpdate(campaign.id, "paused")
                      }
                    >
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={statusUpdatingId === campaign.id}
                      onClick={() =>
                        void handleStatusUpdate(campaign.id, "completed")
                      }
                    >
                      Complete
                    </Button>
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
