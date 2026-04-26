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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, RefreshCw, Send } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  appendConnectThreadMessage,
  createConnectThread,
  updateConnectThreadStatus,
  type ConnectEventEntityType,
  type ConnectSourceSuite,
  type ConnectThread,
  type ConnectThreadMessage,
} from "./data";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

interface ThreadFormState {
  subject: string;
  status: ConnectThread["status"];
  channel: ConnectThread["channel"];
  opsAccountId: string;
  siteId: string;
  orderId: string;
  deliveryId: string;
  participantType: "employee" | "contact" | "system";
  participantId: string;
  participantName: string;
  initialMessage: string;
  sourceSuite: ConnectSourceSuite;
  entityType: ConnectEventEntityType;
  entityId: string;
}

const defaultForm = (
  defaultOpsAccountId = "",
  defaultParticipantId = "connect-system",
): ThreadFormState => ({
  subject: "",
  status: "open",
  channel: "internal",
  opsAccountId: defaultOpsAccountId,
  siteId: "",
  orderId: "",
  deliveryId: "",
  participantType: "employee",
  participantId: defaultParticipantId,
  participantName: "CONNECT System",
  initialMessage: "",
  sourceSuite: "ops",
  entityType: "order",
  entityId: "",
});

export default function ConnectThreadsPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyAuthorId, setReplyAuthorId] = useState("connect-system");
  const [replyAuthorType, setReplyAuthorType] =
    useState<ConnectThreadMessage["authorType"]>("employee");

  const threads = overview?.threads ?? [];
  const employees = overview?.employees ?? [];

  const [form, setForm] = useState<ThreadFormState>(
    defaultForm(opsAccounts[0]?.id ?? "", employees[0]?.id ?? "connect-system"),
  );

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }

    if (
      selectedThreadId &&
      !threads.some((thread) => thread.id === selectedThreadId)
    ) {
      setSelectedThreadId(threads[0]?.id ?? null);
    }
  }, [selectedThreadId, threads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );

  const accountNameById = useMemo(
    () => new Map(opsAccounts.map((account) => [account.id, account.name])),
    [opsAccounts],
  );

  const handleCreateThread = async () => {
    if (
      !form.subject.trim() ||
      !form.participantId.trim() ||
      !form.participantName.trim()
    ) {
      alert("Subject and participant fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const createdThread = await createConnectThread({
        subject: form.subject,
        status: form.status,
        channel: form.channel,
        opsAccountId: form.opsAccountId || undefined,
        siteId: form.siteId || undefined,
        orderId: form.orderId || undefined,
        deliveryId: form.deliveryId || undefined,
        participants: [
          {
            actorType: form.participantType,
            actorId: form.participantId,
            displayName: form.participantName,
          },
        ],
        initialMessage: form.initialMessage
          ? {
              authorId: form.participantId,
              authorType: form.participantType,
              body: form.initialMessage,
            }
          : undefined,
        links: form.entityId
          ? [
              {
                sourceSuite: form.sourceSuite,
                entityType: form.entityType,
                entityId: form.entityId,
                siteId: form.siteId || undefined,
                orderId: form.orderId || undefined,
              },
            ]
          : undefined,
      });

      await refresh();
      setSelectedThreadId(createdThread.id);
      setCreateOpen(false);
      setForm(
        defaultForm(
          opsAccounts[0]?.id ?? "",
          employees[0]?.id ?? "connect-system",
        ),
      );
    } catch (createError) {
      alert(
        createError instanceof Error
          ? createError.message
          : "Failed to create thread",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    threadId: string,
    status: ConnectThread["status"],
  ) => {
    try {
      await updateConnectThreadStatus(threadId, status);
      await refresh();
    } catch (statusError) {
      alert(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update thread status",
      );
    }
  };

  const handleSendReply = async () => {
    if (!selectedThread || !replyBody.trim() || !replyAuthorId.trim()) {
      return;
    }

    try {
      await appendConnectThreadMessage(selectedThread.id, {
        authorId: replyAuthorId,
        authorType: replyAuthorType,
        body: replyBody,
      });
      setReplyBody("");
      await refresh();
    } catch (replyError) {
      alert(
        replyError instanceof Error
          ? replyError.message
          : "Failed to send message",
      );
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Threads" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT threads...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Threads" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Operational Threads
            </h1>
            <p className="mt-1 text-muted-foreground">
              CONNECT communication threads with OPS reference IDs while
              preserving OS/OPS authority.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>{threads.length} Threads</Badge>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Thread
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl border-violet-400/45 bg-slate-950/95">
                <DialogHeader>
                  <DialogTitle>Create CONNECT Thread</DialogTitle>
                  <DialogDescription>
                    Communication records only. OPS account/order/delivery
                    updates must be submitted through OPS APIs.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="thread-subject">Subject</Label>
                    <Input
                      id="thread-subject"
                      value={form.subject}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          subject: event.target.value,
                        }))
                      }
                      placeholder="Delivery check-in for route 14"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="thread-status">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value: ConnectThread["status"]) =>
                          setForm((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger id="thread-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="waiting_external">
                            Waiting External
                          </SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="thread-channel">Channel</Label>
                      <Select
                        value={form.channel}
                        onValueChange={(value: ConnectThread["channel"]) =>
                          setForm((prev) => ({ ...prev, channel: value }))
                        }
                      >
                        <SelectTrigger id="thread-channel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">internal</SelectItem>
                          <SelectItem value="email">email</SelectItem>
                          <SelectItem value="sms">sms</SelectItem>
                          <SelectItem value="phone">phone</SelectItem>
                          <SelectItem value="chat">chat</SelectItem>
                          <SelectItem value="other">other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="thread-account">
                        opsAccountId (optional)
                      </Label>
                      <Input
                        id="thread-account"
                        value={form.opsAccountId}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            opsAccountId: event.target.value,
                          }))
                        }
                        placeholder={opsAccounts[0]?.id ?? "ops-account-001"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="thread-site-id">siteId</Label>
                      <Input
                        id="thread-site-id"
                        value={form.siteId}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            siteId: event.target.value,
                          }))
                        }
                        placeholder="site-main"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="thread-order-id">orderId</Label>
                      <Input
                        id="thread-order-id"
                        value={form.orderId}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            orderId: event.target.value,
                          }))
                        }
                        placeholder="ord-1005"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="thread-delivery-id">deliveryId</Label>
                      <Input
                        id="thread-delivery-id"
                        value={form.deliveryId}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            deliveryId: event.target.value,
                          }))
                        }
                        placeholder="del-2207"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="thread-participant-type">
                        Participant Type
                      </Label>
                      <Select
                        value={form.participantType}
                        onValueChange={(
                          value: "employee" | "contact" | "system",
                        ) =>
                          setForm((prev) => ({
                            ...prev,
                            participantType: value,
                          }))
                        }
                      >
                        <SelectTrigger id="thread-participant-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">employee</SelectItem>
                          <SelectItem value="contact">contact</SelectItem>
                          <SelectItem value="system">system</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="thread-participant-id">
                        Participant ID
                      </Label>
                      <Input
                        id="thread-participant-id"
                        value={form.participantId}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            participantId: event.target.value,
                          }))
                        }
                        placeholder="emp-ops-01"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="thread-participant-name">
                        Participant Name
                      </Label>
                      <Input
                        id="thread-participant-name"
                        value={form.participantName}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            participantName: event.target.value,
                          }))
                        }
                        placeholder="Taylor Nguyen"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="thread-initial-message">
                      Initial Message (optional)
                    </Label>
                    <Textarea
                      id="thread-initial-message"
                      value={form.initialMessage}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          initialMessage: event.target.value,
                        }))
                      }
                      placeholder="Summarize the communication context..."
                    />
                  </div>

                  <div className="rounded-md border border-violet-400/35 bg-black/25 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Cross-suite event link (optional)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="thread-source-suite">
                          Source Suite
                        </Label>
                        <Select
                          value={form.sourceSuite}
                          onValueChange={(value: ConnectSourceSuite) =>
                            setForm((prev) => ({ ...prev, sourceSuite: value }))
                          }
                        >
                          <SelectTrigger id="thread-source-suite">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="os">OS</SelectItem>
                            <SelectItem value="ops">OPS</SelectItem>
                            <SelectItem value="lab">LAB</SelectItem>
                            <SelectItem value="flow">FLOW</SelectItem>
                            <SelectItem value="connect">CONNECT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="thread-entity-type">Entity Type</Label>
                        <Select
                          value={form.entityType}
                          onValueChange={(value: ConnectEventEntityType) =>
                            setForm((prev) => ({ ...prev, entityType: value }))
                          }
                        >
                          <SelectTrigger id="thread-entity-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="order">order</SelectItem>
                            <SelectItem value="delivery">delivery</SelectItem>
                            <SelectItem value="reservation">
                              reservation
                            </SelectItem>
                            <SelectItem value="batch">batch</SelectItem>
                            <SelectItem value="inventory_item">
                              inventory_item
                            </SelectItem>
                            <SelectItem value="site">site</SelectItem>
                            <SelectItem value="task">task</SelectItem>
                            <SelectItem value="thread">thread</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="thread-entity-id">Entity ID</Label>
                        <Input
                          id="thread-entity-id"
                          value={form.entityId}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              entityId: event.target.value,
                            }))
                          }
                          placeholder="ord-1005"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleCreateThread()}
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create Thread"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ConnectSuiteNav
          counts={{
            inbox: (overview?.tasks.length ?? 0) + threads.length,
            messages: threads.length,
            employees: employees.length,
            tasks: overview?.tasks.length ?? 0,
            campaigns: undefined,
            timesheets: undefined,
            accounts: opsAccounts.length,
            contacts: overview?.contacts.length ?? 0,
            threads: threads.length,
          }}
        />

        {error && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
          <Card style={connectGlassPanelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Threads
              </CardTitle>
              <CardDescription>
                Select a thread to view message history and send updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {threads.length === 0 && (
                <p className="text-sm text-muted-foreground">No threads yet.</p>
              )}
              {threads.map((thread) => {
                const isSelected = selectedThreadId === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-violet-300/70 bg-violet-500/25"
                        : "border-violet-400/30 bg-black/25 hover:border-violet-300/60 hover:bg-violet-500/15"
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-violet-50">
                      {thread.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {thread.opsAccountId
                        ? (accountNameById.get(thread.opsAccountId) ??
                          thread.opsAccountId)
                        : "No opsAccountId"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge className={statusPillClass(thread.status)}>
                        {thread.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {thread.messages.length} msgs
                      </span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card style={connectGlassPanelStyle}>
            {!selectedThread && (
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Select a thread from the left to review messages.
              </CardContent>
            )}

            {selectedThread && (
              <>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>{selectedThread.subject}</CardTitle>
                      <CardDescription>
                        {selectedThread.opsAccountId
                          ? (accountNameById.get(selectedThread.opsAccountId) ??
                            selectedThread.opsAccountId)
                          : "No opsAccountId linked"}
                        {" • "}Updated{" "}
                        {formatDateTime(selectedThread.updatedAt)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedThread.status}
                        onValueChange={(value: ConnectThread["status"]) =>
                          void handleStatusChange(selectedThread.id, value)
                        }
                      >
                        <SelectTrigger className="w-[190px] border-violet-400/45 bg-black/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="waiting_external">
                            Waiting External
                          </SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge className={statusPillClass(selectedThread.status)}>
                        {selectedThread.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedThread.opsAccountId && (
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        opsAccountId: {selectedThread.opsAccountId}
                      </Badge>
                    )}
                    {selectedThread.siteId && (
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        siteId: {selectedThread.siteId}
                      </Badge>
                    )}
                    {selectedThread.orderId && (
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        orderId: {selectedThread.orderId}
                      </Badge>
                    )}
                    {selectedThread.deliveryId && (
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        deliveryId: {selectedThread.deliveryId}
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-[340px] space-y-2 overflow-y-auto rounded-lg border border-violet-400/25 bg-black/25 p-3">
                    {selectedThread.messages.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No messages yet.
                      </p>
                    )}
                    {selectedThread.messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-md border border-violet-400/20 bg-black/25 p-2"
                      >
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {message.authorType}:{message.authorId}
                          </span>
                          <span>{formatDateTime(message.createdAt)}</span>
                        </div>
                        <p className="text-sm text-violet-100">
                          {message.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-violet-400/30 bg-black/25 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Reply in thread
                    </p>
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <Select
                        value={replyAuthorType}
                        onValueChange={(
                          value: ConnectThreadMessage["authorType"],
                        ) => setReplyAuthorType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">employee</SelectItem>
                          <SelectItem value="contact">contact</SelectItem>
                          <SelectItem value="system">system</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={replyAuthorId}
                        onChange={(event) =>
                          setReplyAuthorId(event.target.value)
                        }
                        placeholder="Author ID"
                      />
                    </div>
                    <Textarea
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      placeholder="Write a reply..."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={() => void handleSendReply()}
                        disabled={!replyBody.trim()}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Reply
                      </Button>
                    </div>
                  </div>

                  {(selectedThread.links ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedThread.links?.map((link) => (
                        <Badge
                          key={link.id}
                          className="border-violet-300/35 bg-violet-600/20 text-violet-100"
                        >
                          {link.sourceSuite.toUpperCase()}:{link.entityType}=
                          {link.entityId}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
