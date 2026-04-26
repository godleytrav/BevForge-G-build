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
import { Plus, RefreshCw, Users } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  createConnectEmployee,
  updateConnectEmployee,
  type ConnectEmployee,
} from "./data";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

interface EmployeeFormState {
  displayName: string;
  email: string;
  phone: string;
  status: ConnectEmployee["status"];
  homeSiteId: string;
  assignedSiteIds: string;
  roles: string[];
}

const ROLE_OPTIONS = [
  "admin",
  "operator",
  "warehouse",
  "driver",
  "sales",
  "customer_success",
  "finance",
  "compliance",
] as const;

const defaultEmployeeForm = (): EmployeeFormState => ({
  displayName: "",
  email: "",
  phone: "",
  status: "active",
  homeSiteId: "",
  assignedSiteIds: "",
  roles: ["operator"],
});

const parseCsv = (value: string): string[] | undefined => {
  const rows = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return rows.length > 0 ? rows : undefined;
};

const roleLabel = (value: string): string =>
  value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export default function ConnectEmployeesPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const employees = overview?.employees ?? [];
  const tasks = overview?.tasks ?? [];
  const threads = overview?.threads ?? [];

  const [form, setForm] = useState<EmployeeFormState>(defaultEmployeeForm());
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EmployeeFormState>(
    defaultEmployeeForm(),
  );
  const [updating, setUpdating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const taskCountByEmployee = useMemo(() => {
    const next: Record<string, number> = {};
    for (const task of tasks) {
      if (task.createdById) {
        next[task.createdById] = (next[task.createdById] ?? 0) + 1;
      }
      for (const assigneeId of task.assigneeIds ?? []) {
        next[assigneeId] = (next[assigneeId] ?? 0) + 1;
      }
    }
    return next;
  }, [tasks]);

  const threadCountByEmployee = useMemo(() => {
    const next: Record<string, number> = {};
    for (const thread of threads) {
      for (const participant of thread.participants) {
        if (participant.actorType !== "employee") {
          continue;
        }
        next[participant.actorId] = (next[participant.actorId] ?? 0) + 1;
      }
    }
    return next;
  }, [threads]);

  const toggleRole = (
    currentRoles: string[],
    nextRole: (typeof ROLE_OPTIONS)[number],
  ): string[] => {
    if (currentRoles.includes(nextRole)) {
      const filtered = currentRoles.filter((role) => role !== nextRole);
      return filtered.length > 0 ? filtered : ["operator"];
    }
    return [...currentRoles, nextRole];
  };

  const handleCreateEmployee = async () => {
    if (!form.displayName.trim() || !form.homeSiteId.trim()) {
      setPageError("Display name and home site ID are required.");
      return;
    }

    setSubmitting(true);
    setPageError(null);
    try {
      await createConnectEmployee({
        displayName: form.displayName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        status: form.status,
        homeSiteId: form.homeSiteId,
        roles: form.roles,
        assignedSiteIds: parseCsv(form.assignedSiteIds),
      });
      setForm(defaultEmployeeForm());
      await refresh();
    } catch (createError) {
      setPageError(
        createError instanceof Error
          ? createError.message
          : "Failed to create employee",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (employee: ConnectEmployee) => {
    setEditEmployeeId(employee.id);
    setEditForm({
      displayName: employee.displayName,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      status: employee.status,
      homeSiteId: employee.homeSiteId,
      assignedSiteIds: (employee.assignedSiteIds ?? []).join(", "),
      roles: [...employee.roles],
    });
    setEditOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editEmployeeId) {
      return;
    }
    if (!editForm.displayName.trim() || !editForm.homeSiteId.trim()) {
      setPageError("Display name and home site ID are required.");
      return;
    }

    setUpdating(true);
    setPageError(null);
    try {
      await updateConnectEmployee(editEmployeeId, {
        displayName: editForm.displayName,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        status: editForm.status,
        homeSiteId: editForm.homeSiteId,
        roles: editForm.roles,
        assignedSiteIds: parseCsv(editForm.assignedSiteIds),
      });
      setEditOpen(false);
      setEditEmployeeId(null);
      await refresh();
    } catch (updateError) {
      setPageError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update employee",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Employees" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT employees...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Employees" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Employee Management
            </h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage CONNECT employee identity records, roles, and
              site assignments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>
              <Users className="mr-1 h-3.5 w-3.5" />
              {employees.length} Employees
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
            employees: employees.length,
            tasks: overview?.tasks.length ?? 0,
            campaigns: undefined,
            timesheets: undefined,
            accounts: opsAccounts.length,
            contacts: overview?.contacts.length ?? 0,
            threads: overview?.threads.length ?? 0,
          }}
        />

        {(error || pageError) && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">
              {pageError ?? error}
            </CardContent>
          </Card>
        )}

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </CardTitle>
            <CardDescription>
              Employee records are owned by CONNECT and used by tasks, threads,
              campaigns, and timesheets.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    displayName: event.target.value,
                  }))
                }
                placeholder="Taylor Nguyen"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: ConnectEmployee["status"]) =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="border-violet-300/35 bg-black/35">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="on_leave">on_leave</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="team.member@bevforge.local"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="+1 555 0100"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Home Site ID</Label>
              <Input
                value={form.homeSiteId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    homeSiteId: event.target.value,
                  }))
                }
                placeholder="site-main"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Assigned Site IDs (comma separated)</Label>
              <Input
                value={form.assignedSiteIds}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    assignedSiteIds: event.target.value,
                  }))
                }
                placeholder="site-main, site-west"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const selected = form.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          roles: toggleRole(prev.roles, role),
                        }))
                      }
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "border-violet-300/70 bg-violet-500/25 text-violet-50"
                          : "border-violet-400/35 bg-black/25 text-violet-100 hover:border-violet-300/55"
                      }`}
                    >
                      {roleLabel(role)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => void handleCreateEmployee()}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>
              Active workforce identity records currently used across CONNECT
              workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {employees.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No employees yet. Add your first employee above.
              </p>
            )}
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-violet-50">
                      {employee.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      employeeId: {employee.id}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusPillClass(employee.status)}>
                        {employee.status}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        homeSiteId: {employee.homeSiteId}
                      </Badge>
                      {employee.roles.map((role) => (
                        <Badge
                          key={`${employee.id}-${role}`}
                          className="border-violet-300/35 bg-violet-600/20 text-violet-100"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                    {(employee.assignedSiteIds ?? []).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        assignedSiteIds: {employee.assignedSiteIds?.join(", ")}
                      </p>
                    )}
                    {employee.email && (
                      <p className="text-xs text-muted-foreground">
                        {employee.email}
                      </p>
                    )}
                    {employee.phone && (
                      <p className="text-xs text-muted-foreground">
                        {employee.phone}
                      </p>
                    )}
                  </div>

                  <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Tasks</span>
                    <span className="text-right text-violet-100">
                      {taskCountByEmployee[employee.id] ?? 0}
                    </span>
                    <span>Threads</span>
                    <span className="text-right text-violet-100">
                      {threadCountByEmployee[employee.id] ?? 0}
                    </span>
                    <span>Updated</span>
                    <span className="text-right text-violet-100">
                      {formatDateTime(employee.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(employee)}
                  >
                    Edit Employee
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl border-violet-400/45 bg-slate-950/95">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee status, roles, and site assignments.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Display Name</Label>
                <Input
                  value={editForm.displayName}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      displayName: event.target.value,
                    }))
                  }
                  className="border-violet-300/35 bg-black/35"
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: ConnectEmployee["status"]) =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="border-violet-300/35 bg-black/35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="on_leave">on_leave</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  className="border-violet-300/35 bg-black/35"
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  className="border-violet-300/35 bg-black/35"
                />
              </div>
              <div className="space-y-1">
                <Label>Home Site ID</Label>
                <Input
                  value={editForm.homeSiteId}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      homeSiteId: event.target.value,
                    }))
                  }
                  className="border-violet-300/35 bg-black/35"
                />
              </div>
              <div className="space-y-1">
                <Label>Assigned Site IDs</Label>
                <Input
                  value={editForm.assignedSiteIds}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      assignedSiteIds: event.target.value,
                    }))
                  }
                  className="border-violet-300/35 bg-black/35"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const selected = editForm.roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            roles: toggleRole(prev.roles, role),
                          }))
                        }
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? "border-violet-300/70 bg-violet-500/25 text-violet-50"
                            : "border-violet-400/35 bg-black/25 text-violet-100 hover:border-violet-300/55"
                        }`}
                      >
                        {roleLabel(role)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditEmployeeId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleUpdateEmployee()}
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
