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
import { Plus, RefreshCw } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  createConnectTask,
  updateConnectTaskStatus,
  type ConnectEventEntityType,
  type ConnectSourceSuite,
  type ConnectTask,
} from "./data";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

interface TaskFormState {
  title: string;
  description: string;
  status: ConnectTask["status"];
  priority: ConnectTask["priority"];
  taskType: NonNullable<ConnectTask["taskType"]>;
  createdById: string;
  assigneeId: string;
  opsAccountId: string;
  siteId: string;
  orderId: string;
  deliveryId: string;
  dueAt: string;
  sourceSuite: ConnectSourceSuite;
  entityType: ConnectEventEntityType;
  entityId: string;
}

const defaultForm = (defaultEmployeeId = ""): TaskFormState => ({
  title: "",
  description: "",
  status: "open",
  priority: "normal",
  taskType: "communication",
  createdById: defaultEmployeeId,
  assigneeId: "",
  opsAccountId: "",
  siteId: "",
  orderId: "",
  deliveryId: "",
  dueAt: "",
  sourceSuite: "ops",
  entityType: "order",
  entityId: "",
});

export default function ConnectTasksPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const employees = overview?.employees ?? [];
  const tasks = overview?.tasks ?? [];
  const defaultCreatorId = employees[0]?.id ?? "connect-system";

  const [form, setForm] = useState<TaskFormState>(
    defaultForm(defaultCreatorId),
  );

  const openTaskCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== "done" && task.status !== "canceled",
      ).length,
    [tasks],
  );

  const handleCreateTask = async () => {
    if (!form.title.trim() || !form.createdById.trim()) {
      alert("Title and Created By are required.");
      return;
    }

    const dueAtDate = form.dueAt ? new Date(form.dueAt) : null;
    const dueAt =
      dueAtDate && !Number.isNaN(dueAtDate.valueOf())
        ? dueAtDate.toISOString()
        : undefined;

    setSubmitting(true);
    try {
      await createConnectTask({
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        taskType: form.taskType,
        createdById: form.createdById,
        assigneeIds: form.assigneeId ? [form.assigneeId] : undefined,
        opsAccountId: form.opsAccountId || undefined,
        siteId: form.siteId || undefined,
        orderId: form.orderId || undefined,
        deliveryId: form.deliveryId || undefined,
        dueAt,
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
      setCreateOpen(false);
      setForm(defaultForm(defaultCreatorId));
    } catch (createError) {
      alert(
        createError instanceof Error
          ? createError.message
          : "Failed to create task",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    taskId: string,
    status: ConnectTask["status"],
  ) => {
    setUpdatingTaskId(taskId);
    try {
      await updateConnectTaskStatus(taskId, status);
      await refresh();
    } catch (statusError) {
      alert(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update task status",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Tasks" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT tasks...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Tasks" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Task Assignment
            </h1>
            <p className="mt-1 text-muted-foreground">
              CONNECT-owned work items with OPS reference IDs (`opsAccountId`,
              `orderId`, `deliveryId`, `siteId`).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>{openTaskCount} Open</Badge>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl border-violet-400/45 bg-slate-950/95">
                <DialogHeader>
                  <DialogTitle>Create CONNECT Task</DialogTitle>
                  <DialogDescription>
                    CONNECT can reference OPS/OS IDs, but order lifecycle and
                    quantity writes remain outside CONNECT.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="task-title">Title</Label>
                    <Input
                      id="task-title"
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Follow up on delayed order handoff"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Capture context, owner expectations, and any operational dependencies."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="task-status">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value: ConnectTask["status"]) =>
                          setForm((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger id="task-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select
                        value={form.priority}
                        onValueChange={(value: ConnectTask["priority"]) =>
                          setForm((prev) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger id="task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="task-created-by">Created By</Label>
                      <Select
                        value={form.createdById}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, createdById: value }))
                        }
                      >
                        <SelectTrigger id="task-created-by">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.length === 0 && (
                            <SelectItem value="connect-system">
                              connect-system
                            </SelectItem>
                          )}
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="task-assignee">Assignee (optional)</Label>
                      <Select
                        value={form.assigneeId || "none"}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            assigneeId: value === "none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger id="task-assignee">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-md border border-violet-400/35 bg-black/25 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      OPS references (optional)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="task-ops-account">opsAccountId</Label>
                        <Input
                          id="task-ops-account"
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
                      <div className="space-y-1">
                        <Label htmlFor="task-site-id">siteId</Label>
                        <Input
                          id="task-site-id"
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
                        <Label htmlFor="task-order-id">orderId</Label>
                        <Input
                          id="task-order-id"
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
                        <Label htmlFor="task-delivery-id">deliveryId</Label>
                        <Input
                          id="task-delivery-id"
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="task-due-at">Due At (optional)</Label>
                      <Input
                        id="task-due-at"
                        type="datetime-local"
                        value={form.dueAt}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            dueAt: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="task-type">Task Type</Label>
                      <Select
                        value={form.taskType}
                        onValueChange={(
                          value: NonNullable<ConnectTask["taskType"]>,
                        ) => setForm((prev) => ({ ...prev, taskType: value }))}
                      >
                        <SelectTrigger id="task-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="communication">
                            communication
                          </SelectItem>
                          <SelectItem value="delivery_followup">
                            delivery_followup
                          </SelectItem>
                          <SelectItem value="inventory_check">
                            inventory_check
                          </SelectItem>
                          <SelectItem value="quality_hold">
                            quality_hold
                          </SelectItem>
                          <SelectItem value="customer_service">
                            customer_service
                          </SelectItem>
                          <SelectItem value="compliance">compliance</SelectItem>
                          <SelectItem value="manual_override_review">
                            manual_override_review
                          </SelectItem>
                          <SelectItem value="other">other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-md border border-violet-400/35 bg-black/25 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Cross-suite event link (optional)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="task-source-suite">Source Suite</Label>
                        <Select
                          value={form.sourceSuite}
                          onValueChange={(value: ConnectSourceSuite) =>
                            setForm((prev) => ({ ...prev, sourceSuite: value }))
                          }
                        >
                          <SelectTrigger id="task-source-suite">
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
                        <Label htmlFor="task-entity-type">Entity Type</Label>
                        <Select
                          value={form.entityType}
                          onValueChange={(value: ConnectEventEntityType) =>
                            setForm((prev) => ({ ...prev, entityType: value }))
                          }
                        >
                          <SelectTrigger id="task-entity-type">
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
                        <Label htmlFor="task-entity-id">Entity ID</Label>
                        <Input
                          id="task-entity-id"
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
                    onClick={() => void handleCreateTask()}
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ConnectSuiteNav
          counts={{
            inbox: openTaskCount + (overview?.threads.length ?? 0),
            messages: overview?.threads.length ?? 0,
            employees: employees.length,
            tasks: tasks.length,
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

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>Task Queue</CardTitle>
            <CardDescription>
              CONNECT task updates stay inside CONNECT. OPS and OS records are
              referenced by ID only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-violet-50">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Created by {task.createdById} • Updated{" "}
                      {formatDateTime(task.updatedAt)}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusPillClass(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.taskType && (
                        <Badge className={statusPillClass(task.taskType)}>
                          {task.taskType}
                        </Badge>
                      )}
                      {task.opsAccountId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          opsAccountId: {task.opsAccountId}
                        </Badge>
                      )}
                      {task.siteId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          siteId: {task.siteId}
                        </Badge>
                      )}
                      {task.orderId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          orderId: {task.orderId}
                        </Badge>
                      )}
                      {task.deliveryId && (
                        <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                          deliveryId: {task.deliveryId}
                        </Badge>
                      )}
                      {(task.links ?? []).map((link) => (
                        <Badge
                          key={link.id}
                          className="border-violet-300/35 bg-violet-600/20 text-violet-100"
                        >
                          {link.sourceSuite.toUpperCase()}:{link.entityType}=
                          {link.entityId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={task.status}
                      onValueChange={(value: ConnectTask["status"]) =>
                        void handleStatusChange(task.id, value)
                      }
                      disabled={updatingTaskId === task.id}
                    >
                      <SelectTrigger className="w-[180px] border-violet-400/45 bg-black/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={statusPillClass(task.status)}>
                      {task.status.replace("_", " ")}
                    </Badge>
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
