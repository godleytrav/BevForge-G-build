import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  isTransientHttpStatus,
  makeCalendarEventId,
  queueCalendarSyncFailure,
  replayCalendarSyncQueue,
  type CalendarCreateRequestPayload,
} from '@/features/calendar/calendar-sync-queue';

type CalendarSuiteId = 'os' | 'ops' | 'lab' | 'flow' | 'connect';
type CalendarEventStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'blocked';

interface CalendarEventRecord {
  id: string;
  sourceSuite: CalendarSuiteId;
  sourceRecordId?: string;
  siteId?: string;
  title: string;
  description?: string;
  type: string;
  status: CalendarEventStatus;
  startAt: string;
  endAt?: string;
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

interface CalendarSummary {
  total: number;
  bySuite: Record<CalendarSuiteId, number>;
  byStatus: Record<CalendarEventStatus, number>;
}

interface CalendarCreateDraft {
  sourceSuite: CalendarSuiteId;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: CalendarEventStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  siteId: string;
  allDay: boolean;
}

const suiteIds: CalendarSuiteId[] = ['os', 'ops', 'lab', 'flow', 'connect'];
const statusIds: CalendarEventStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'canceled',
  'blocked',
];

const suiteLabels: Record<CalendarSuiteId, string> = {
  os: 'OS',
  ops: 'OPS',
  lab: 'LAB',
  flow: 'FLOW',
  connect: 'CONNECT',
};

const suiteBadgeClass: Record<CalendarSuiteId, string> = {
  os: 'border-cyan-400/60 text-cyan-300 bg-cyan-500/10',
  ops: 'border-blue-400/60 text-blue-300 bg-blue-500/10',
  lab: 'border-amber-400/60 text-amber-300 bg-amber-500/10',
  flow: 'border-green-400/60 text-green-300 bg-green-500/10',
  connect: 'border-violet-400/60 text-violet-300 bg-violet-500/10',
};

const suiteDotClass: Record<CalendarSuiteId, string> = {
  os: 'bg-cyan-400',
  ops: 'bg-blue-400',
  lab: 'bg-amber-400',
  flow: 'bg-green-400',
  connect: 'bg-violet-400',
};

const statusLabel: Record<CalendarEventStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  canceled: 'Canceled',
  blocked: 'Blocked',
};

const statusBadgeClass: Record<CalendarEventStatus, string> = {
  planned: 'border-slate-500/70 text-slate-200 bg-slate-500/10',
  in_progress: 'border-sky-400/70 text-sky-300 bg-sky-500/10',
  completed: 'border-emerald-400/70 text-emerald-300 bg-emerald-500/10',
  canceled: 'border-zinc-500/70 text-zinc-300 bg-zinc-500/10',
  blocked: 'border-red-500/70 text-red-300 bg-red-500/10',
};

const statusDotClass: Record<CalendarEventStatus, string> = {
  planned: 'bg-slate-400',
  in_progress: 'bg-sky-400',
  completed: 'bg-emerald-400',
  canceled: 'bg-zinc-400',
  blocked: 'bg-red-400',
};

const eventTypeDotClass: Record<string, string> = {
  production: 'bg-cyan-400',
  inventory: 'bg-emerald-400',
  order: 'bg-indigo-400',
  delivery: 'bg-blue-400',
  compliance: 'bg-rose-400',
  schedule: 'bg-violet-400',
  maintenance: 'bg-amber-400',
  task: 'bg-lime-400',
  note: 'bg-slate-400',
};

const calendarEventTypes = [
  'production',
  'inventory',
  'order',
  'delivery',
  'compliance',
  'schedule',
  'maintenance',
  'task',
  'note',
];

const defaultSummary: CalendarSummary = {
  total: 0,
  bySuite: { os: 0, ops: 0, lab: 0, flow: 0, connect: 0 },
  byStatus: { planned: 0, in_progress: 0, completed: 0, canceled: 0, blocked: 0 },
};

const defaultStatusFilter = (): Record<CalendarEventStatus, boolean> => ({
  planned: true,
  in_progress: true,
  completed: true,
  canceled: true,
  blocked: true,
});

const defaultSuiteFilter = (): Record<CalendarSuiteId, boolean> => ({
  os: true,
  ops: true,
  lab: true,
  flow: true,
  connect: true,
});

const sameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const localDateKey = (iso: string): string => format(new Date(iso), 'yyyy-MM-dd');
const toDateInputValue = (value: Date): string => format(value, 'yyyy-MM-dd');

const eventTimeLabel = (event: CalendarEventRecord): string => {
  const start = format(new Date(event.startAt), 'h:mm a');
  if (!event.endAt) return start;
  return `${start} - ${format(new Date(event.endAt), 'h:mm a')}`;
};

const eventTypeLabel = (value: string): string =>
  value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const dateCellLabel = (value: Date): string =>
  format(value, 'EEEE, MMM d, yyyy');

const sortEvents = (events: CalendarEventRecord[]): CalendarEventRecord[] =>
  [...events].sort(
    (left, right) => Date.parse(left.startAt) - Date.parse(right.startAt)
  );

export default function CalendarPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [summary, setSummary] = useState<CalendarSummary>(defaultSummary);
  const [status, setStatus] = useState('Loading calendar...');
  const [isLoading, setIsLoading] = useState(false);

  const [rangeDays, setRangeDays] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [suiteFilter, setSuiteFilter] = useState<Record<CalendarSuiteId, boolean>>(
    defaultSuiteFilter
  );
  const [statusFilter, setStatusFilter] = useState<Record<CalendarEventStatus, boolean>>(
    defaultStatusFilter
  );
  const [typeFilter, setTypeFilter] = useState<Record<string, boolean>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createDraft, setCreateDraft] = useState<CalendarCreateDraft>({
    sourceSuite: 'ops',
    title: '',
    description: '',
    date: toDateInputValue(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    type: 'schedule',
    status: 'planned',
    priority: 'medium',
    siteId: 'main',
    allDay: false,
  });
  const longPressTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const activeSuiteTab = useMemo<'all' | CalendarSuiteId>(() => {
    const value = searchParams.get('suite');
    if (!value) return 'all';
    return suiteIds.includes(value as CalendarSuiteId)
      ? (value as CalendarSuiteId)
      : 'all';
  }, [searchParams]);

  const calendarBasePath = location.pathname.startsWith('/os/calendar')
    ? '/os/calendar'
    : '/calendar';
  const suiteForNewEvent: CalendarSuiteId = 'ops';

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openCreateDialogForDay = (day: Date) => {
    setSelectedDate(day);
    setCurrentMonth(startOfMonth(day));
    setCreateDialogError(null);
    setCreateDraft({
      sourceSuite: suiteForNewEvent,
      title: '',
      description: '',
      date: toDateInputValue(day),
      startTime: '09:00',
      endTime: '10:00',
      type: 'schedule',
      status: 'planned',
      priority: 'medium',
      siteId: 'main',
      allDay: false,
    });
    setCreateDialogOpen(true);
  };

  const onDayPointerDown = (event: PointerEvent<HTMLButtonElement>, day: Date) => {
    if (event.pointerType === 'mouse') {
      return;
    }
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      openCreateDialogForDay(day);
      longPressTimerRef.current = null;
    }, 450);
  };

  const onDayPointerEnd = () => {
    clearLongPressTimer();
  };

  const postCalendarPayload = async (
    payload: CalendarCreateRequestPayload
  ): Promise<{ ok: boolean; status: number; message?: string }> => {
    const response = await globalThis.fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok && Boolean(body?.success),
      status: response.status,
      message: typeof body?.error === 'string' ? body.error : undefined,
    };
  };

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const to = new Date(now.getTime() + Number(rangeDays) * 24 * 60 * 60 * 1000);
      const params = new globalThis.URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const response = await globalThis.fetch(`/api/calendar/events?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load calendar.');
      }
      setEvents((payload.data?.events ?? []) as CalendarEventRecord[]);
      setSummary((payload.data?.summary ?? defaultSummary) as CalendarSummary);
      setStatus('Calendar loaded.');
    } catch (error) {
      setEvents([]);
      setSummary(defaultSummary);
      setStatus(error instanceof Error ? error.message : 'Failed to load calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, [rangeDays]);

  const replayFailedSyncQueue = async (
    announce = true
  ): Promise<{ delivered: number; remaining: number; attempted: number }> => {
    if (typeof window === 'undefined') {
      return { delivered: 0, remaining: 0, attempted: 0 };
    }
    const result = await replayCalendarSyncQueue(window.localStorage, {
      postPayload: postCalendarPayload,
    });
    if (result.delivered > 0) {
      await loadEvents();
      if (announce) {
        setStatus(
          `Recovered ${result.delivered} queued event${result.delivered === 1 ? '' : 's'}.`
        );
      }
    }
    return result;
  };

  useEffect(() => {
    void replayFailedSyncQueue();
  }, []);

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    []
  );

  const buildIsoFromDraft = (dateText: string, timeText: string): string | null => {
    const [year, month, day] = dateText.split('-').map((value) => Number(value));
    const [hours, minutes] = timeText.split(':').map((value) => Number(value));
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return null;
    }
    const next = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (Number.isNaN(next.getTime())) return null;
    return next.toISOString();
  };

  const submitCreateEvent = async () => {
    setCreateDialogError(null);
    const title = createDraft.title.trim();
    if (!title) {
      setCreateDialogError('Title is required.');
      return;
    }

    let startAt: string | null;
    let endAt: string | undefined;
    if (createDraft.allDay) {
      startAt = buildIsoFromDraft(createDraft.date, '00:00');
      endAt = buildIsoFromDraft(createDraft.date, '23:59') ?? undefined;
    } else {
      startAt = buildIsoFromDraft(createDraft.date, createDraft.startTime);
      endAt =
        createDraft.endTime.trim().length > 0
          ? buildIsoFromDraft(createDraft.date, createDraft.endTime) ?? undefined
          : undefined;
    }
    if (!startAt) {
      setCreateDialogError('Invalid date or time.');
      return;
    }
    if (endAt && Date.parse(endAt) < Date.parse(startAt)) {
      setCreateDialogError('End time must be after start time.');
      return;
    }

    const requestId = makeCalendarEventId();
    const requestPayload: CalendarCreateRequestPayload = {
      id: requestId,
      sourceSuite: createDraft.sourceSuite,
      title,
      description: createDraft.description.trim() || undefined,
      siteId: createDraft.siteId.trim() || undefined,
      type: createDraft.type,
      status: createDraft.status,
      priority: createDraft.priority,
      startAt,
      endAt,
      allDay: createDraft.allDay,
      metadata: {
        createdFrom: 'calendar-ui',
        clientRequestId: requestId,
      },
    };

    setCreatingEvent(true);
    try {
      const result = await postCalendarPayload(requestPayload);
      if (result.ok) {
        setCreateDialogOpen(false);
        await loadEvents();
        const replay = await replayFailedSyncQueue(false);
        setStatus(
          replay.delivered > 0
            ? `Created "${title}" and recovered ${replay.delivered} queued event${replay.delivered === 1 ? '' : 's'}.`
            : `Created event "${title}".`
        );
        return;
      }

      if (!isTransientHttpStatus(result.status)) {
        setCreateDialogError(result.message ?? 'Failed to create calendar event.');
        return;
      }

      if (typeof window !== 'undefined') {
        queueCalendarSyncFailure(
          window.localStorage,
          requestPayload,
          result.message ?? `HTTP ${result.status}`
        );
      }
      setCreateDialogOpen(false);
      setStatus('Event queued for retry due to temporary connection issue.');
    } catch (error) {
      if (typeof window !== 'undefined') {
        queueCalendarSyncFailure(
          window.localStorage,
          requestPayload,
          error instanceof Error ? error.message : 'Network error'
        );
      }
      setCreateDialogOpen(false);
      setStatus('Event queued for retry due to temporary connection issue.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const availableTypes = useMemo(
    () =>
      [...new Set(events.map((event) => event.type).filter((type) => type && type.length > 0))].sort(),
    [events]
  );
  const selectableTypes = useMemo(
    () => [...new Set([...calendarEventTypes, ...availableTypes])],
    [availableTypes]
  );

  useEffect(() => {
    setTypeFilter((current) => {
      const next = { ...current };
      let changed = false;
      for (const type of availableTypes) {
        if (!(type in next)) {
          next[type] = true;
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (!availableTypes.includes(key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [availableTypes]);

  const filteredEvents = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return sortEvents(
      events.filter((event) => {
        if (activeSuiteTab !== 'all' && event.sourceSuite !== activeSuiteTab) {
          return false;
        }
        if (!suiteFilter[event.sourceSuite]) {
          return false;
        }
        if (!statusFilter[event.status]) {
          return false;
        }
        if (typeFilter[event.type] === false) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = [
          event.title,
          event.description ?? '',
          event.type,
          event.status,
          event.sourceSuite,
          event.sourceRecordId ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      })
    );
  }, [activeSuiteTab, events, searchQuery, statusFilter, suiteFilter, typeFilter]);

  const visibleSummary = useMemo(() => {
    const bySuite = { os: 0, ops: 0, lab: 0, flow: 0, connect: 0 } as Record<
      CalendarSuiteId,
      number
    >;
    const byStatus = {
      planned: 0,
      in_progress: 0,
      completed: 0,
      canceled: 0,
      blocked: 0,
    } as Record<CalendarEventStatus, number>;

    for (const event of filteredEvents) {
      bySuite[event.sourceSuite] += 1;
      byStatus[event.status] += 1;
    }

    return {
      total: filteredEvents.length,
      bySuite,
      byStatus,
    };
  }, [filteredEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventRecord[]>();
    for (const event of filteredEvents) {
      const key = localDateKey(event.startAt);
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    }
    return map;
  }, [filteredEvents]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayEvents = useMemo(
    () => sortEvents(eventsByDay.get(localDateKey(selectedDate)) ?? []),
    [eventsByDay, selectedDate]
  );

  const resetLegendFilters = () => {
    setSuiteFilter(defaultSuiteFilter());
    setStatusFilter(defaultStatusFilter());
    setTypeFilter(
      Object.fromEntries(availableTypes.map((type) => [type, true])) as Record<string, boolean>
    );
  };

  return (
    <AppShell currentSuite="ops" pageTitle="Universal Calendar">
      <div className="space-y-6 lg:pr-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Universal Calendar</h1>
            <p className="mt-1 text-muted-foreground">
              Shared calendar projection with suite-owned events.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{status}</p>
          </div>
          <Button variant="outline" onClick={() => void loadEvents()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search events..."
                  className="pl-9"
                />
              </div>
              <Select value={rangeDays} onValueChange={setRangeDays}>
                <SelectTrigger>
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Link
            to={calendarBasePath}
            className="block"
            aria-current={activeSuiteTab === 'all' ? 'page' : undefined}
          >
            <Card
              className={`transition-colors ${
                activeSuiteTab === 'all'
                  ? 'border-primary/70 bg-primary/10'
                  : 'hover:bg-accent/10'
              }`}
            >
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.total}</div>
                <p className="text-xs text-muted-foreground">Visible Events</p>
              </CardContent>
            </Card>
          </Link>
          {suiteIds.map((suite) => (
            <Link
              key={suite}
              to={`${calendarBasePath}?suite=${suite}`}
              className="block"
              aria-current={activeSuiteTab === suite ? 'page' : undefined}
            >
              <Card
                className={`transition-colors ${
                  activeSuiteTab === suite
                    ? 'border-primary/70 bg-primary/10'
                    : 'hover:bg-accent/10'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{summary.bySuite[suite] ?? 0}</div>
                  <p className="text-xs text-muted-foreground">{suiteLabels[suite]}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4" />
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <CardDescription>
                  {dateCellLabel(selectedDate)} • {selectedDayEvents.length} event
                  {selectedDayEvents.length === 1 ? '' : 's'}
                </CardDescription>
                <p className="mt-1 text-xs text-muted-foreground">
                  Single click to select day. Double click (desktop) or long press (mobile) to add event.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(startOfMonth(today));
                    setSelectedDate(today);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEvents = sortEvents(eventsByDay.get(key) ?? []);
                const isSelected = sameDay(day, selectedDate);
                const inMonth = isSameMonth(day, currentMonth);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => openCreateDialogForDay(day)}
                    onPointerDown={(event) => onDayPointerDown(event, day)}
                    onPointerUp={onDayPointerEnd}
                    onPointerCancel={onDayPointerEnd}
                    onPointerLeave={onDayPointerEnd}
                    className={`min-h-[120px] rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? 'border-primary/70 bg-primary/10'
                        : 'border-border/70 bg-card/50 hover:bg-accent/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          inMonth ? 'text-foreground' : 'text-muted-foreground/50'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      {isToday(day) && (
                        <span className="rounded-full bg-primary/30 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="rounded border border-border/60 px-1.5 py-1 text-[11px]"
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className={`h-2 w-2 rounded-full ${suiteDotClass[event.sourceSuite]}`}
                            />
                            <span className="truncate font-medium">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events • {dateCellLabel(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on selected date.</p>
            ) : (
              selectedDayEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border/70 bg-card/70 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={suiteBadgeClass[event.sourceSuite]}>
                      {suiteLabels[event.sourceSuite]}
                    </Badge>
                    <Badge variant="outline" className={statusBadgeClass[event.status]}>
                      {statusLabel[event.status]}
                    </Badge>
                    <Badge variant="outline">{eventTypeLabel(event.type)}</Badge>
                    <span className="text-xs text-muted-foreground">{eventTimeLabel(event)}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  {(event.links?.openPath || event.links?.openUrl) && (
                    <div className="mt-2">
                      {event.links?.openPath ? (
                        <Link
                          to={event.links.openPath}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open Source Record
                        </Link>
                      ) : (
                        <a
                          href={event.links?.openUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open Source Record
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create Calendar Event</DialogTitle>
            <DialogDescription>
              Adds a suite-owned event to the universal calendar feed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-1">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={createDraft.title}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Event title"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Owning Suite</label>
                <Select
                  value={createDraft.sourceSuite}
                  onValueChange={(value) =>
                    setCreateDraft((current) => ({
                      ...current,
                      sourceSuite: value as CalendarSuiteId,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suiteIds.map((suite) => (
                      <SelectItem key={suite} value={suite}>
                        {suiteLabels[suite]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Event Type</label>
                <Select
                  value={createDraft.type}
                  onValueChange={(value) =>
                    setCreateDraft((current) => ({ ...current, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {eventTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={createDraft.date}
                  onChange={(event) =>
                    setCreateDraft((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Site</label>
                <Input
                  value={createDraft.siteId}
                  onChange={(event) =>
                    setCreateDraft((current) => ({ ...current, siteId: event.target.value }))
                  }
                  placeholder="main"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={createDraft.allDay}
                onCheckedChange={(checked) =>
                  setCreateDraft((current) => ({ ...current, allDay: checked === true }))
                }
              />
              <span>All day event</span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                <Input
                  type="time"
                  disabled={createDraft.allDay}
                  value={createDraft.startTime}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">End Time</label>
                <Input
                  type="time"
                  disabled={createDraft.allDay}
                  value={createDraft.endTime}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  value={createDraft.status}
                  onValueChange={(value) =>
                    setCreateDraft((current) => ({
                      ...current,
                      status: value as CalendarEventStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusIds.map((statusId) => (
                      <SelectItem key={statusId} value={statusId}>
                        {statusLabel[statusId]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select
                  value={createDraft.priority}
                  onValueChange={(value) =>
                    setCreateDraft((current) => ({
                      ...current,
                      priority: value as CalendarCreateDraft['priority'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={createDraft.description}
                onChange={(event) =>
                  setCreateDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional details and execution notes..."
                rows={3}
              />
            </div>

            {createDialogError && (
              <p className="text-xs font-medium text-red-400">{createDialogError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creatingEvent}
            >
              Cancel
            </Button>
            <Button onClick={submitCreateEvent} disabled={creatingEvent}>
              {creatingEvent ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className={`fixed right-0 top-20 z-40 h-[calc(100vh-5.5rem)] transition-transform duration-200 ${
          filtersOpen ? 'translate-x-0' : 'translate-x-[288px]'
        }`}
      >
        <button
          type="button"
          aria-label={filtersOpen ? 'Close filters' : 'Open filters'}
          onClick={() => setFiltersOpen((open) => !open)}
          className="absolute -left-8 top-1/2 -translate-y-1/2 rounded-l-md border border-r-0 border-border bg-card/95 px-2 py-3 hover:bg-accent/10"
        >
          {filtersOpen ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>

        <div className="h-full w-72 overflow-y-auto border-l border-border bg-card/95 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Event Key + Filters</h2>
            <Button size="sm" variant="ghost" onClick={resetLegendFilters}>
              Reset
            </Button>
          </div>

          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suites
              </h3>
              <div className="space-y-2">
                {suiteIds.map((suite) => (
                  <label key={suite} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={suiteFilter[suite]}
                      onCheckedChange={(checked) =>
                        setSuiteFilter((current) => ({
                          ...current,
                          [suite]: checked === true,
                        }))
                      }
                    />
                    <span className={`h-2.5 w-2.5 rounded-full ${suiteDotClass[suite]}`} />
                    <span>{suiteLabels[suite]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </h3>
              <div className="space-y-2">
                {statusIds.map((statusId) => (
                  <label key={statusId} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={statusFilter[statusId]}
                      onCheckedChange={(checked) =>
                        setStatusFilter((current) => ({
                          ...current,
                          [statusId]: checked === true,
                        }))
                      }
                    />
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass[statusId]}`} />
                    <span>{statusLabel[statusId]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Event Types
              </h3>
              <div className="space-y-2">
                {availableTypes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No typed events in range.</p>
                ) : (
                  availableTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={typeFilter[type] !== false}
                        onCheckedChange={(checked) =>
                          setTypeFilter((current) => ({
                            ...current,
                            [type]: checked === true,
                          }))
                        }
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${eventTypeDotClass[type] ?? 'bg-slate-400'}`}
                      />
                      <span>{eventTypeLabel(type)}</span>
                    </label>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Source Window
              </h3>
              <p className="text-xs text-muted-foreground">
                Loaded {summary.total} total events from API window; showing {visibleSummary.total}{' '}
                after filters.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
