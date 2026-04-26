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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, RefreshCw, Send, Plus } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  appendConnectThreadMessage,
  createConnectThread,
  updateConnectThreadStatus,
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

interface NewThreadFormState {
  subject: string;
  opsAccountId: string;
  channel: ConnectThread["channel"];
  status: ConnectThread["status"];
  authorId: string;
  message: string;
}

const defaultForm = (authorId = "connect-system"): NewThreadFormState => ({
  subject: "",
  opsAccountId: "",
  channel: "email",
  status: "open",
  authorId,
  message: "",
});

export default function ConnectMessagesPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const threads = overview?.threads ?? [];
  const employees = overview?.employees ?? [];
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [composerAuthorId, setComposerAuthorId] = useState(
    employees[0]?.id ?? "connect-system",
  );
  const [createForm, setCreateForm] = useState<NewThreadFormState>(
    defaultForm(employees[0]?.id ?? "connect-system"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const selectedThread = useMemo(() => {
    const fallback = threads[0];
    if (!selectedThreadId) {
      return fallback ?? null;
    }
    return threads.find((thread) => thread.id === selectedThreadId) ?? fallback;
  }, [threads, selectedThreadId]);

  const accountNameById = useMemo(
    () => new Map(opsAccounts.map((account) => [account.id, account.name])),
    [opsAccounts],
  );

  const participantLabel = (message: ConnectThreadMessage): string => {
    const participant = selectedThread?.participants.find(
      (item) => item.actorId === message.authorId,
    );
    if (participant?.displayName) {
      return participant.displayName;
    }
    return message.authorId;
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !composer.trim()) {
      return;
    }

    setSubmitting(true);
    setThreadError(null);

    try {
      await appendConnectThreadMessage(selectedThread.id, {
        authorId: composerAuthorId || "connect-system",
        authorType: "employee",
        body: composer,
      });
      setComposer("");
      await refresh();
    } catch (sendError) {
      setThreadError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send message",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateThread = async () => {
    if (!createForm.subject.trim() || !createForm.message.trim()) {
      setThreadError("Thread subject and initial message are required.");
      return;
    }

    setCreateSubmitting(true);
    setThreadError(null);

    try {
      const created = await createConnectThread({
        subject: createForm.subject,
        status: createForm.status,
        channel: createForm.channel,
        opsAccountId: createForm.opsAccountId || undefined,
        participants: [
          {
            actorType: "employee",
            actorId: createForm.authorId || "connect-system",
            displayName:
              employees.find((employee) => employee.id === createForm.authorId)
                ?.displayName ?? "CONNECT Team",
          },
        ],
        initialMessage: {
          authorId: createForm.authorId || "connect-system",
          authorType: "employee",
          body: createForm.message,
        },
      });

      setCreateForm(defaultForm(createForm.authorId || "connect-system"));
      await refresh();
      setSelectedThreadId(created.id);
    } catch (createError) {
      setThreadError(
        createError instanceof Error
          ? createError.message
          : "Failed to create thread",
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleThreadStatusChange = async (
    threadId: string,
    status: ConnectThread["status"],
  ) => {
    try {
      await updateConnectThreadStatus(threadId, status);
      await refresh();
    } catch (statusError) {
      setThreadError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update thread status",
      );
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Messages" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT messages...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Messages" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Messaging Workspace
            </h1>
            <p className="mt-1 text-muted-foreground">
              Streamlined internal and customer messaging built on CONNECT
              threads with OPS references.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              {threads.length} Threads
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

        {(error || threadError) && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">
              {threadError ?? error}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
          <Card style={connectGlassPanelStyle}>
            <CardHeader>
              <CardTitle>Conversation List</CardTitle>
              <CardDescription>
                Active message channels and pending external responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {threads.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No threads yet. Create the first thread below.
                </p>
              )}
              {threads.map((thread) => {
                const latest = thread.messages[thread.messages.length - 1];
                const isSelected = selectedThread?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-violet-300/70 bg-violet-500/20"
                        : "border-violet-400/30 bg-black/25 hover:border-violet-300/55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-violet-50">
                          {thread.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {thread.channel} • {thread.messages.length} messages
                        </p>
                      </div>
                      <Badge className={statusPillClass(thread.status)}>
                        {thread.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {latest && (
                      <p className="mt-2 line-clamp-2 text-xs text-violet-100/90">
                        {participantLabel(latest)}: {latest.body}
                      </p>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card style={connectGlassPanelStyle}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>
                    {selectedThread?.subject ?? "Thread Detail"}
                  </CardTitle>
                  <CardDescription>
                    {selectedThread
                      ? `Channel: ${selectedThread.channel}`
                      : "Select a thread to view and reply."}
                  </CardDescription>
                </div>
                {selectedThread && (
                  <Select
                    value={selectedThread.status}
                    onValueChange={(value: ConnectThread["status"]) =>
                      void handleThreadStatusChange(selectedThread.id, value)
                    }
                  >
                    <SelectTrigger className="w-[180px] border-violet-300/35 bg-black/35">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">open</SelectItem>
                      <SelectItem value="waiting_external">
                        waiting_external
                      </SelectItem>
                      <SelectItem value="resolved">resolved</SelectItem>
                      <SelectItem value="closed">closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedThread ? (
                <>
                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {selectedThread.messages.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No messages in this thread yet.
                      </p>
                    )}
                    {selectedThread.messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-violet-50">
                            {participantLabel(message)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-violet-100">
                          {message.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-violet-400/30 bg-black/25 p-3">
                    <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
                      <Select
                        value={composerAuthorId}
                        onValueChange={setComposerAuthorId}
                      >
                        <SelectTrigger className="border-violet-300/35 bg-black/35">
                          <SelectValue placeholder="Author" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.displayName}
                            </SelectItem>
                          ))}
                          <SelectItem value="connect-system">
                            CONNECT System
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={composer}
                        onChange={(event) => setComposer(event.target.value)}
                        placeholder="Type a reply..."
                        className="min-h-[80px] border-violet-300/35 bg-black/35"
                      />
                      <Button
                        onClick={() => void handleSendMessage()}
                        disabled={submitting || !composer.trim()}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No thread selected.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Message Thread
            </CardTitle>
            <CardDescription>
              Create a communication thread tied to OPS account references.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input
                value={createForm.subject}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                placeholder="Delivery reschedule follow-up"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>OPS Account (optional)</Label>
              <Select
                value={createForm.opsAccountId || "none"}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    opsAccountId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="border-violet-300/35 bg-black/35">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No account link</SelectItem>
                  {opsAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {accountNameById.get(account.id) ?? account.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Channel</Label>
              <Select
                value={createForm.channel}
                onValueChange={(value: ConnectThread["channel"]) =>
                  setCreateForm((prev) => ({ ...prev, channel: value }))
                }
              >
                <SelectTrigger className="border-violet-300/35 bg-black/35">
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
              <Label>Author</Label>
              <Select
                value={createForm.authorId}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, authorId: value }))
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
            <div className="space-y-1 md:col-span-2">
              <Label>Initial Message</Label>
              <Textarea
                value={createForm.message}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                placeholder="Summarize context and requested action..."
                className="min-h-[96px] border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => void handleCreateThread()}
                disabled={createSubmitting}
              >
                {createSubmitting ? "Creating..." : "Create Message Thread"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
