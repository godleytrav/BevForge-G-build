import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readRecipeRunsState, readSiteSettings } from './commissioning-store.js';
import { readBatchState } from './inventory-batch-store.js';

export type CalendarSuiteId = 'os' | 'ops' | 'lab' | 'flow' | 'connect';
export type CalendarEventType =
  | 'production'
  | 'inventory'
  | 'order'
  | 'delivery'
  | 'compliance'
  | 'schedule'
  | 'maintenance'
  | 'task'
  | 'note';
export type CalendarEventStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'blocked';
export type CalendarEventPriority = 'low' | 'medium' | 'high' | 'critical';

export interface CalendarEventRecord {
  schemaVersion: string;
  id: string;
  sourceSuite: CalendarSuiteId;
  sourceRecordId?: string;
  siteId?: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  priority?: CalendarEventPriority;
  startAt: string;
  endAt?: string;
  timezone?: string;
  allDay?: boolean;
  tags?: string[];
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface CalendarFeed {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  events: CalendarEventRecord[];
}

export interface CalendarQuery {
  from?: string;
  to?: string;
  suite?: CalendarSuiteId[];
  statuses?: CalendarEventStatus[];
  types?: CalendarEventType[];
  siteId?: string;
  search?: string;
}

export interface CalendarProjectionResult {
  events: CalendarEventRecord[];
  summary: {
    total: number;
    bySuite: Record<CalendarSuiteId, number>;
    byStatus: Record<CalendarEventStatus, number>;
  };
}

export interface CalendarCreateEventInput {
  id?: string;
  sourceSuite?: CalendarSuiteId;
  sourceRecordId?: string;
  siteId?: string;
  title: string;
  description?: string;
  type?: CalendarEventType | string;
  status?: CalendarEventStatus | string;
  priority?: CalendarEventPriority | string;
  startAt: string;
  endAt?: string;
  timezone?: string;
  allDay?: boolean;
  tags?: string[];
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface CalendarCreateEventResult {
  event: CalendarEventRecord;
  idempotent: boolean;
}

const suiteIds: CalendarSuiteId[] = ['os', 'ops', 'lab', 'flow', 'connect'];
const eventTypes: CalendarEventType[] = [
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
const eventStatuses: CalendarEventStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'canceled',
  'blocked',
];
const eventPriorities: CalendarEventPriority[] = ['low', 'medium', 'high', 'critical'];

const nowIso = (): string => new Date().toISOString();

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'os-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'os-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const commissioningRoot = path.join(repoRoot, 'commissioning');

const defaultFeed = (suite: CalendarSuiteId): CalendarFeed => ({
  schemaVersion: '1.0.0',
  id: `calendar-events-${suite}`,
  updatedAt: nowIso(),
  events: [],
});

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const suiteFeedPath = (suite: CalendarSuiteId): string =>
  path.join(commissioningRoot, suite, 'calendar-events.json');

const toText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const toIso = (value: unknown): string | undefined => {
  const text = toText(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const normalizeSuite = (value: unknown, fallback: CalendarSuiteId): CalendarSuiteId => {
  const text = toText(value)?.toLowerCase();
  if (!text) return fallback;
  return suiteIds.find((suite) => suite === text) ?? fallback;
};

const normalizeStatus = (value: unknown): CalendarEventStatus => {
  const text = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (!text) return 'planned';
  return eventStatuses.find((status) => status === text) ?? 'planned';
};

const normalizeType = (value: unknown): CalendarEventType => {
  const text = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (!text) return 'note';
  return eventTypes.find((type) => type === text) ?? 'note';
};

const normalizePriority = (value: unknown): CalendarEventPriority | undefined => {
  const text = toText(value)?.toLowerCase();
  if (!text) return undefined;
  return eventPriorities.find((priority) => priority === text);
};

const normalizeEvent = (
  input: unknown,
  suite: CalendarSuiteId,
  index: number
): CalendarEventRecord | null => {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const startAt = toIso(raw.startAt ?? raw.start_at ?? raw.date);
  const title = toText(raw.title ?? raw.name);
  if (!startAt || !title) return null;

  const id = toText(raw.id) ?? `${suite}-event-${index + 1}`;
  const schemaVersion = toText(raw.schemaVersion) ?? '1.0.0';
  const openPath = toText((raw.links as any)?.openPath ?? (raw.links as any)?.open_path);
  const openUrl = toText((raw.links as any)?.openUrl ?? (raw.links as any)?.open_url);
  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .map((tag) => toText(tag))
        .filter((tag): tag is string => Boolean(tag))
    : undefined;

  return {
    schemaVersion,
    id,
    sourceSuite: normalizeSuite(raw.sourceSuite ?? raw.source_suite, suite),
    sourceRecordId: toText(raw.sourceRecordId ?? raw.source_record_id),
    siteId: toText(raw.siteId ?? raw.site_id),
    title,
    description: toText(raw.description),
    type: normalizeType(raw.type),
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    startAt,
    endAt: toIso(raw.endAt ?? raw.end_at),
    timezone: toText(raw.timezone),
    allDay: typeof raw.allDay === 'boolean' ? raw.allDay : undefined,
    tags,
    links: openPath || openUrl ? { openPath, openUrl } : undefined,
    metadata:
      raw.metadata && typeof raw.metadata === 'object'
        ? (raw.metadata as Record<string, unknown>)
        : undefined,
  };
};

const readSuiteEvents = async (suite: CalendarSuiteId): Promise<CalendarEventRecord[]> => {
  const filePath = suiteFeedPath(suite);
  const parsed = await readJsonOrDefault<CalendarFeed | CalendarEventRecord[]>(
    filePath,
    defaultFeed(suite)
  );
  const rawEvents = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as CalendarFeed).events)
      ? (parsed as CalendarFeed).events
      : [];

  return rawEvents
    .map((event, index) => normalizeEvent(event, suite, index))
    .filter((event): event is CalendarEventRecord => event !== null);
};

const buildCalendarEventId = (): string =>
  `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createCalendarEvent = async (
  input: CalendarCreateEventInput
): Promise<CalendarCreateEventResult> => {
  const sourceSuite = normalizeSuite(input.sourceSuite, 'os');
  const title = toText(input.title);
  if (!title) {
    throw new Error('Validation: title is required.');
  }
  const startAt = toIso(input.startAt);
  if (!startAt) {
    throw new Error('Validation: startAt must be a valid ISO date-time.');
  }
  const endAt = toIso(input.endAt);
  if (endAt && Date.parse(endAt) < Date.parse(startAt)) {
    throw new Error('Validation: endAt must be greater than or equal to startAt.');
  }

  const nextEvent: CalendarEventRecord = {
    schemaVersion: '1.0.0',
    id: toText(input.id) ?? buildCalendarEventId(),
    sourceSuite,
    sourceRecordId: toText(input.sourceRecordId),
    siteId: toText(input.siteId),
    title,
    description: toText(input.description),
    type: normalizeType(input.type),
    status: normalizeStatus(input.status),
    priority: normalizePriority(input.priority),
    startAt,
    endAt,
    timezone: toText(input.timezone),
    allDay: input.allDay === true ? true : undefined,
    tags: Array.isArray(input.tags)
      ? input.tags
          .map((tag) => toText(tag))
          .filter((tag): tag is string => Boolean(tag))
      : undefined,
    links: {
      openPath: toText(input.links?.openPath),
      openUrl: toText(input.links?.openUrl),
    },
    metadata:
      input.metadata && typeof input.metadata === 'object'
        ? input.metadata
        : undefined,
  };
  if (!nextEvent.links?.openPath && !nextEvent.links?.openUrl) {
    delete nextEvent.links;
  }
  if (!nextEvent.tags || nextEvent.tags.length === 0) {
    delete nextEvent.tags;
  }

  const filePath = suiteFeedPath(sourceSuite);
  const parsed = await readJsonOrDefault<CalendarFeed | CalendarEventRecord[]>(
    filePath,
    defaultFeed(sourceSuite)
  );
  const rawEvents = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as CalendarFeed).events)
      ? (parsed as CalendarFeed).events
      : [];
  const events = rawEvents
    .map((event, index) => normalizeEvent(event, sourceSuite, index))
    .filter((event): event is CalendarEventRecord => event !== null);
  const existing = events.find((event) => event.id === nextEvent.id);
  if (existing) {
    return {
      event: existing,
      idempotent: true,
    };
  }
  events.push(nextEvent);
  events.sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt));

  const nextFeed: CalendarFeed = {
    schemaVersion: '1.0.0',
    id:
      Array.isArray(parsed)
        ? `calendar-events-${sourceSuite}`
        : toText((parsed as CalendarFeed).id) ?? `calendar-events-${sourceSuite}`,
    updatedAt: nowIso(),
    events,
  };
  await writeJson(filePath, nextFeed);
  return {
    event: nextEvent,
    idempotent: false,
  };
};

const mapRecipeRunStatus = (status: string): CalendarEventStatus => {
  if (status === 'running') return 'in_progress';
  if (status === 'paused' || status === 'waiting_confirm') return 'blocked';
  if (status === 'completed') return 'completed';
  if (status === 'failed') return 'blocked';
  if (status === 'canceled') return 'canceled';
  return 'planned';
};

const mapBatchStatus = (status: string): CalendarEventStatus => {
  if (status === 'in_progress' || status === 'allocated') return 'in_progress';
  if (status === 'completed' || status === 'released' || status === 'shipped') {
    return 'completed';
  }
  if (status === 'canceled') return 'canceled';
  return 'planned';
};

const daysInMonthUtc = (year: number, monthIndex: number): number =>
  new Date(Date.UTC(year, monthIndex + 1, 0, 12, 0, 0, 0)).getUTCDate();

const previousBusinessDayUtc = (date: Date): Date => {
  const next = new Date(date.getTime());
  while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
    next.setUTCDate(next.getUTCDate() - 1);
  }
  return next;
};

const isoAllDayDue = (year: number, monthIndex: number, day: number): string =>
  new Date(
    Date.UTC(year, monthIndex, Math.min(day, daysInMonthUtc(year, monthIndex)), 12, 0, 0, 0)
  ).toISOString();

const formatMonthYear = (year: number, monthIndex: number): string =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0, 0))
  );

const formatQuarterLabel = (year: number, quarterNumber: number): string => `Q${quarterNumber} ${year}`;
const formatAnnualLabel = (year: number): string => `Annual ${year}`;
const formatFiscalLabel = (year: number): string => `FY ${year}`;

const buildComplianceDeadlineEvents = async (): Promise<CalendarEventRecord[]> => {
  const settings = await readSiteSettings();
  const schedule = settings.reportingCalendar;
  if (!schedule?.autoCalendarDeadlines) {
    return [];
  }

  const startYear = new Date().getUTCFullYear() - 1;
  const endYear = new Date().getUTCFullYear() + 1;
  const timezone = settings.timezone;
  const events: CalendarEventRecord[] = [];

  const pushEvent = (params: {
    id: string;
    title: string;
    description: string;
    dueAt: string;
    reportId: string;
    frequency: string;
    deadlineSource: 'agency_schedule' | 'settings_driven';
    deadlineSourceNote: string;
  }) => {
    events.push({
      schemaVersion: '1.0.0',
      id: params.id,
      sourceSuite: 'os',
      sourceRecordId: params.reportId,
      siteId: settings.defaultSiteId,
      title: params.title,
      description: params.description,
      type: 'compliance',
      status: 'planned',
      startAt: params.dueAt,
      timezone,
      allDay: true,
      links: {
        openPath: '/reports',
      },
      metadata: {
        generatedFrom: 'reporting-calendar-settings',
        reportId: params.reportId,
        frequency: params.frequency,
        deadlineSource: params.deadlineSource,
        deadlineSourceNote: params.deadlineSourceNote,
      },
    });
  };

  if (schedule.ttbOperationsFrequency === 'monthly') {
    for (let year = startYear; year <= endYear; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        const dueDate = previousBusinessDayUtc(new Date(Date.UTC(year, month + 1, 15, 12, 0, 0, 0)));
        pushEvent({
          id: `compliance:ttb-operations:${year}-${String(month + 1).padStart(2, '0')}`,
          title: `TTB Operations Due — ${formatMonthYear(year, month)}`,
          description: `Report of Wine Premises Operations support for ${formatMonthYear(year, month)}. TTB monthly filings are generally due on the 15th day after period end; review the official due-date schedule for holiday adjustments.`,
          dueAt: dueDate.toISOString(),
          reportId: 'ttb_operations',
          frequency: 'monthly',
          deadlineSource: 'agency_schedule',
          deadlineSourceNote:
            'Agency due date. OS uses the filing cadence you selected in Settings to project these reminders.',
        });
      }
    }
  } else if (schedule.ttbOperationsFrequency === 'quarterly') {
    for (let year = startYear; year <= endYear; year += 1) {
      for (let quarter = 0; quarter < 4; quarter += 1) {
        const quarterNumber = quarter + 1;
        const dueMonth = quarter * 3 + 3;
        const dueDate = previousBusinessDayUtc(new Date(Date.UTC(year, dueMonth, 15, 12, 0, 0, 0)));
        pushEvent({
          id: `compliance:ttb-operations:${year}-q${quarterNumber}`,
          title: `TTB Operations Due — ${formatQuarterLabel(year, quarterNumber)}`,
          description: `Report of Wine Premises Operations support for ${formatQuarterLabel(year, quarterNumber)}. TTB quarterly filings are generally due on the 15th day after period end; review the official due-date schedule for holiday adjustments.`,
          dueAt: dueDate.toISOString(),
          reportId: 'ttb_operations',
          frequency: 'quarterly',
          deadlineSource: 'agency_schedule',
          deadlineSourceNote:
            'Agency due date. OS uses the filing cadence you selected in Settings to project these reminders.',
        });
      }
    }
  } else if (schedule.ttbOperationsFrequency === 'annual') {
    for (let year = startYear; year <= endYear; year += 1) {
      const dueDate = previousBusinessDayUtc(new Date(Date.UTC(year + 1, 0, 15, 12, 0, 0, 0)));
      pushEvent({
        id: `compliance:ttb-operations:${year}-annual`,
        title: `TTB Operations Due — ${formatAnnualLabel(year)}`,
        description: `Annual Report of Wine Premises Operations support for ${year}. Annual TTB filings are generally due on January 15 of the following year; review the official due-date schedule for holiday adjustments.`,
        dueAt: dueDate.toISOString(),
        reportId: 'ttb_operations',
        frequency: 'annual',
        deadlineSource: 'agency_schedule',
        deadlineSourceNote:
          'Agency due date. OS uses the filing cadence you selected in Settings to project these reminders.',
      });
    }
  }

  if (schedule.ttbExciseFrequency === 'quarterly') {
    for (let year = startYear; year <= endYear; year += 1) {
      for (let quarter = 0; quarter < 4; quarter += 1) {
        const quarterNumber = quarter + 1;
        const dueMonth = quarter * 3 + 3;
        const dueDate = previousBusinessDayUtc(new Date(Date.UTC(year, dueMonth, 14, 12, 0, 0, 0)));
        pushEvent({
          id: `compliance:ttb-excise:${year}-q${quarterNumber}`,
          title: `TTB Excise Due — ${formatQuarterLabel(year, quarterNumber)}`,
          description: `Federal excise support for ${formatQuarterLabel(year, quarterNumber)}. Quarterly TTB excise returns are generally due on the 14th day after period end; review the official due-date schedule for holiday adjustments.`,
          dueAt: dueDate.toISOString(),
          reportId: 'ttb_excise',
          frequency: 'quarterly',
          deadlineSource: 'agency_schedule',
          deadlineSourceNote:
            'Agency due date. OS uses the filing cadence you selected in Settings to project these reminders.',
        });
      }
    }
  } else if (schedule.ttbExciseFrequency === 'annual') {
    for (let year = startYear; year <= endYear; year += 1) {
      const dueDate = previousBusinessDayUtc(new Date(Date.UTC(year + 1, 0, 14, 12, 0, 0, 0)));
      pushEvent({
        id: `compliance:ttb-excise:${year}-annual`,
        title: `TTB Excise Due — ${formatAnnualLabel(year)}`,
        description: `Federal excise support for ${year}. Annual TTB excise returns are generally due on January 14 of the following year; review the official due-date schedule for holiday adjustments.`,
        dueAt: dueDate.toISOString(),
        reportId: 'ttb_excise',
        frequency: 'annual',
        deadlineSource: 'agency_schedule',
        deadlineSourceNote:
          'Agency due date. OS uses the filing cadence you selected in Settings to project these reminders.',
      });
    }
  }

  if (schedule.californiaCdtfaFrequency === 'monthly') {
    for (let year = startYear; year <= endYear; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        const dueDate = previousBusinessDayUtc(new Date(Date.UTC(year, month + 1, 15, 12, 0, 0, 0)));
        pushEvent({
          id: `compliance:ca-cdtfa:${year}-${String(month + 1).padStart(2, '0')}`,
          title: `California CDTFA Due — ${formatMonthYear(year, month)}`,
          description: `Alcohol beverage tax support for ${formatMonthYear(year, month)}. California returns are generally due on the 15th day of the following month; confirm agency holiday handling before filing.`,
          dueAt: dueDate.toISOString(),
          reportId: 'ca_cdtfa',
          frequency: 'monthly',
          deadlineSource: 'agency_schedule',
          deadlineSourceNote:
            'Agency due date. OS uses the filing cadence you selected in Settings to project these reminders.',
        });
      }
    }
  }

  if (schedule.californiaAbcEnabled) {
    for (let year = startYear; year <= endYear; year += 1) {
      pushEvent({
        id: `compliance:ca-abc:${year}`,
        title: `California ABC Annual Review — ${formatFiscalLabel(year)}`,
        description: `Annual winegrower / blender gallonage review for fiscal year ${year}. This reminder date is configurable in Settings so it can match your ABC reporting workflow.`,
        dueAt: isoAllDayDue(
          year,
          Math.max(0, schedule.californiaAbcReviewMonth - 1),
          schedule.californiaAbcReviewDay
        ),
        reportId: 'ca_abc',
        frequency: 'annual',
        deadlineSource: 'settings_driven',
        deadlineSourceNote:
          'Settings-driven reminder. Adjust the ABC review month and day in Settings to match your filing workflow.',
      });
    }
  }

  return events;
};

const buildOsDerivedEvents = async (): Promise<CalendarEventRecord[]> => {
  const [recipeRuns, batchState, complianceDeadlineEvents] = await Promise.all([
    readRecipeRunsState(),
    readBatchState(),
    buildComplianceDeadlineEvents(),
  ]);
  const runEvents = (recipeRuns.runs ?? []).map((run) => ({
    schemaVersion: '1.0.0',
    id: `recipe-run-${run.runId}`,
    sourceSuite: 'os' as const,
    sourceRecordId: run.runId,
    title: `Recipe Run: ${run.recipeName}`,
    description: `Current stage index ${run.currentStepIndex + 1}.`,
    type: 'production' as const,
    status: mapRecipeRunStatus(run.status),
    startAt: run.startedAt,
    endAt: run.endedAt,
    links: {
      openPath: `/os/recipe-execution?runId=${encodeURIComponent(run.runId)}`,
    },
    metadata: {
      recipeId: run.recipeId,
      status: run.status,
    },
  }));

  const batchEvents = (batchState.batches ?? []).map((batch) => {
    const scheduled = Boolean(batch.scheduledStartAt);
    const startAt = batch.scheduledStartAt ?? batch.createdAt;
    const endAt = batch.scheduledEndAt ?? batch.completedAt ?? batch.releasedAt;
    const plannedVessel = batch.plannedVesselLabel ? ` Planned vessel ${batch.plannedVesselLabel}.` : '';
    const type: CalendarEventType = scheduled ? 'schedule' : 'inventory';

    return {
      schemaVersion: '1.0.0',
      id: `batch-${batch.id}`,
      sourceSuite: 'os' as const,
      sourceRecordId: batch.id,
      siteId: batch.siteId,
      title: scheduled
        ? `Scheduled Batch ${batch.lotCode}: ${batch.recipeName}`
        : `Batch ${batch.lotCode}: ${batch.recipeName}`,
      description: scheduled
        ? `Status ${batch.status}. Planned ${batch.producedQty} ${batch.unit}.${plannedVessel}`
        : `Status ${batch.status}. Produced ${batch.producedQty} ${batch.unit}.${plannedVessel}`,
      type,
      status: mapBatchStatus(batch.status),
      startAt,
      endAt,
      links: {
        openPath: `/os/batches/${encodeURIComponent(batch.id)}`,
      },
      metadata: {
        recipeRunId: batch.recipeRunId,
        status: batch.status,
        batchKind: batch.batchKind,
        productionMode: batch.productionMode,
        plannedVesselLabel: batch.plannedVesselLabel,
      },
    };
  });

  return [...runEvents, ...batchEvents, ...complianceDeadlineEvents];
};

const includesToken = (value: string, query: string): boolean =>
  value.toLowerCase().includes(query.toLowerCase());

export const readUnifiedCalendarProjection = async (
  query?: CalendarQuery
): Promise<CalendarProjectionResult> => {
  const manualBySuite = await Promise.all(suiteIds.map((suite) => readSuiteEvents(suite)));
  const manualEvents = manualBySuite.flat();
  const osDerivedEvents = await buildOsDerivedEvents();
  let events = [...manualEvents, ...osDerivedEvents];

  const fromMs = query?.from ? Date.parse(query.from) : undefined;
  const toMs = query?.to ? Date.parse(query.to) : undefined;
  const suiteFilter = query?.suite ?? [];
  const statusFilter = query?.statuses ?? [];
  const typeFilter = query?.types ?? [];
  const siteIdFilter = toText(query?.siteId)?.toLowerCase();
  const search = toText(query?.search)?.toLowerCase();

  events = events.filter((event) => {
    const startMs = Date.parse(event.startAt);
    if (!Number.isFinite(startMs)) return false;
    if (fromMs !== undefined && Number.isFinite(fromMs) && startMs < fromMs) return false;
    if (toMs !== undefined && Number.isFinite(toMs) && startMs > toMs) return false;
    if (suiteFilter.length > 0 && !suiteFilter.includes(event.sourceSuite)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(event.status)) return false;
    if (typeFilter.length > 0 && !typeFilter.includes(event.type)) return false;
    if (siteIdFilter && (event.siteId ?? '').toLowerCase() !== siteIdFilter) return false;
    if (search) {
      const haystack = [
        event.title,
        event.description ?? '',
        event.sourceRecordId ?? '',
        event.type,
        event.status,
        event.sourceSuite,
      ].join(' ');
      if (!includesToken(haystack, search)) return false;
    }
    return true;
  });

  events.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

  const bySuite = Object.fromEntries(
    suiteIds.map((suite) => [suite, 0])
  ) as Record<CalendarSuiteId, number>;
  const byStatus = Object.fromEntries(
    eventStatuses.map((status) => [status, 0])
  ) as Record<CalendarEventStatus, number>;

  for (const event of events) {
    bySuite[event.sourceSuite] += 1;
    byStatus[event.status] += 1;
  }

  return {
    events,
    summary: {
      total: events.length,
      bySuite,
      byStatus,
    },
  };
};
