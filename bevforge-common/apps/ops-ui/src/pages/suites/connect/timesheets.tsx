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
import { Clock3, LogIn, LogOut, RefreshCw } from "lucide-react";
import { ConnectSuiteNav } from "./ConnectSuiteNav";
import {
  clockOutConnectTimesheetEntry,
  createConnectTimesheetEntry,
  fetchConnectTimesheetEntries,
  updateConnectTimesheetStatus,
  type ConnectTimesheetEntry,
} from "./data";
import { useConnectOverview } from "./use-connect-overview";
import {
  connectBadgeStyle,
  connectGlassPanelStyle,
  formatDateTime,
  statusPillClass,
} from "./theme";

interface ClockInFormState {
  employeeId: string;
  siteId: string;
  breakMinutes: string;
  notes: string;
}

const defaultClockInForm = (
  employeeId = "connect-system",
): ClockInFormState => ({
  employeeId,
  siteId: "",
  breakMinutes: "0",
  notes: "",
});

const toHoursWorked = (entry: ConnectTimesheetEntry): string => {
  const start = new Date(entry.clockInAt).valueOf();
  const end = entry.clockOutAt
    ? new Date(entry.clockOutAt).valueOf()
    : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return "0.00";
  }
  const minutes = (end - start) / 60000 - entry.breakMinutes;
  return (Math.max(minutes, 0) / 60).toFixed(2);
};

export default function ConnectTimesheetsPage() {
  const { overview, opsAccounts, loading, error, refresh } =
    useConnectOverview();
  const employees = overview?.employees ?? [];
  const [entries, setEntries] = useState<ConnectTimesheetEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [actioningEntryId, setActioningEntryId] = useState<string | null>(null);
  const [reviewerId, setReviewerId] = useState(
    employees[0]?.id ?? "connect-system",
  );
  const [form, setForm] = useState<ClockInFormState>(
    defaultClockInForm(employees[0]?.id ?? "connect-system"),
  );

  const loadEntries = async () => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const rows = await fetchConnectTimesheetEntries();
      setEntries(rows);
    } catch (loadError) {
      setEntriesError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load timesheets",
      );
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const employeeNameById = useMemo(
    () =>
      new Map(employees.map((employee) => [employee.id, employee.displayName])),
    [employees],
  );

  const openEntries = entries.filter((entry) => entry.status === "open");
  const submittedEntries = entries.filter(
    (entry) => entry.status === "submitted",
  );
  const approvedEntries = entries.filter(
    (entry) => entry.status === "approved",
  );

  const handleClockIn = async () => {
    if (!form.employeeId) {
      setEntriesError("Employee is required.");
      return;
    }

    setClockingIn(true);
    setEntriesError(null);
    try {
      await createConnectTimesheetEntry({
        employeeId: form.employeeId,
        siteId: form.siteId || undefined,
        breakMinutes: Number(form.breakMinutes) || 0,
        notes: form.notes || undefined,
      });
      setForm(defaultClockInForm(form.employeeId));
      await loadEntries();
    } catch (clockInError) {
      setEntriesError(
        clockInError instanceof Error
          ? clockInError.message
          : "Failed to clock in",
      );
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async (entryId: string) => {
    setActioningEntryId(entryId);
    setEntriesError(null);
    try {
      await clockOutConnectTimesheetEntry(entryId, {});
      await loadEntries();
    } catch (clockOutError) {
      setEntriesError(
        clockOutError instanceof Error
          ? clockOutError.message
          : "Failed to clock out",
      );
    } finally {
      setActioningEntryId(null);
    }
  };

  const handleStatusUpdate = async (
    entryId: string,
    status: ConnectTimesheetEntry["status"],
  ) => {
    setActioningEntryId(entryId);
    setEntriesError(null);
    try {
      await updateConnectTimesheetStatus(entryId, {
        status,
        reviewerId,
      });
      await loadEntries();
    } catch (statusError) {
      setEntriesError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update timesheet status",
      );
    } finally {
      setActioningEntryId(null);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="CONNECT Timesheets" currentSuite="connect">
        <div className="flex h-80 items-center justify-center text-muted-foreground">
          Loading CONNECT timesheets...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="CONNECT Timesheets" currentSuite="connect">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-violet-50">
              Workforce Time Tracking
            </h1>
            <p className="mt-1 text-muted-foreground">
              Clock-in, clock-out, and approval workflow for employee shifts in
              CONNECT.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge style={connectBadgeStyle}>
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              {entries.length} Entries
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                void refresh();
                void loadEntries();
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
            campaigns: undefined,
            timesheets: entries.length,
            accounts: opsAccounts.length,
            contacts: overview?.contacts.length ?? 0,
            threads: overview?.threads.length ?? 0,
          }}
        />

        {(error || entriesError) && (
          <Card style={connectGlassPanelStyle}>
            <CardContent className="pt-6 text-red-200">
              {entriesError ?? error}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{openEntries.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{submittedEntries.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{approvedEntries.length}</p>
            </CardContent>
          </Card>
          <Card style={connectGlassPanelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{employees.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>Clock In</CardTitle>
            <CardDescription>
              Start a timesheet entry for current shift activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select
                value={form.employeeId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, employeeId: value }))
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
              <Label>Site ID (optional)</Label>
              <Input
                value={form.siteId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, siteId: event.target.value }))
                }
                placeholder="site-downtown"
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Break Minutes</Label>
              <Input
                type="number"
                min={0}
                value={form.breakMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    breakMinutes: event.target.value,
                  }))
                }
                className="border-violet-300/35 bg-black/35"
              />
            </div>
            <div className="space-y-1">
              <Label>Reviewer</Label>
              <Select value={reviewerId} onValueChange={setReviewerId}>
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
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                className="min-h-[90px] border-violet-300/35 bg-black/35"
                placeholder="Shift notes, blockers, or handoff details..."
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => void handleClockIn()}
                disabled={clockingIn}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {clockingIn ? "Clocking In..." : "Clock In"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={connectGlassPanelStyle}>
          <CardHeader>
            <CardTitle>Timesheet Entries</CardTitle>
            <CardDescription>
              Submit, approve, reject, and close shift entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {entriesLoading && (
              <p className="text-sm text-muted-foreground">
                Loading timesheet entries...
              </p>
            )}
            {!entriesLoading && entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No entries yet. Clock in to create the first shift entry.
              </p>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-violet-400/30 bg-black/25 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-violet-50">
                      {employeeNameById.get(entry.employeeId) ??
                        entry.employeeId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      In: {formatDateTime(entry.clockInAt)}
                      {entry.clockOutAt
                        ? ` • Out: ${formatDateTime(entry.clockOutAt)}`
                        : " • Active shift"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusPillClass(entry.status)}>
                        {entry.status}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        Hours: {toHoursWorked(entry)}
                      </Badge>
                      <Badge className="border-violet-300/35 bg-violet-600/20 text-violet-100">
                        Break: {entry.breakMinutes}m
                      </Badge>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground">
                        Notes: {entry.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!entry.clockOutAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actioningEntryId === entry.id}
                        onClick={() => void handleClockOut(entry.id)}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Clock Out
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningEntryId === entry.id}
                      onClick={() =>
                        void handleStatusUpdate(entry.id, "submitted")
                      }
                    >
                      Submit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningEntryId === entry.id}
                      onClick={() =>
                        void handleStatusUpdate(entry.id, "approved")
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningEntryId === entry.id}
                      onClick={() =>
                        void handleStatusUpdate(entry.id, "rejected")
                      }
                    >
                      Reject
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
