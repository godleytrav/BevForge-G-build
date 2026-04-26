import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ComplianceSuiteId = 'os' | 'ops' | 'lab' | 'flow' | 'connect';
type ComplianceEventStatus = 'recorded' | 'voided' | 'amended';
type ComplianceReportStatus = 'draft' | 'reviewed' | 'submitted' | 'accepted' | 'amended';

interface ComplianceSourceRecord {
  recordType: string;
  recordId: string;
  openPath?: string;
}

interface ComplianceQuantity {
  value: number;
  uom: string;
  direction: 'in' | 'out' | 'none';
}

interface ComplianceEventRecord {
  id: string;
  eventType: string;
  eventStatus: ComplianceEventStatus;
  sourceSuite: ComplianceSuiteId;
  sourceRecord: ComplianceSourceRecord;
  siteId: string;
  occurredAt: string;
  recordedAt: string;
  skuId?: string;
  batchId?: string;
  lotCode?: string;
  quantity?: ComplianceQuantity;
  reasonCode?: string;
  reasonMessage?: string;
}

interface ComplianceSyncState {
  lastSyncAt?: string;
  lastSourceFeedId?: string;
  cursor?: {
    sort?: string;
    hasMore?: boolean;
    nextAfter?: {
      occurredAt?: string;
      id?: string;
    };
  };
}

interface ComplianceTotals {
  uom: string;
  onHandStartQty: number;
  producedQty: number;
  removedQty: number;
  destroyedQty: number;
  lossQty: number;
  onHandEndQty: number;
}

interface CompliancePeriodReport {
  id: string;
  siteId: string;
  status: ComplianceReportStatus;
  sourceFeedId: string;
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  totals: ComplianceTotals;
}

interface EventListResponse {
  success: boolean;
  data: ComplianceEventRecord[];
  summary?: {
    total: number;
    sourceSuite: {
      os: number;
      ops: number;
    };
  };
}

interface SyncResponse {
  success: boolean;
  data: {
    sourceFeedId: string;
    inserted: number;
    updated: number;
    unchanged: number;
    totalEvents: number;
    syncState?: ComplianceSyncState;
  };
}

interface ReportsResponse {
  success: boolean;
  data: CompliancePeriodReport[];
  syncState?: ComplianceSyncState;
}

interface ReportCreateResponse {
  success: boolean;
  data: CompliancePeriodReport;
}

interface SyncOptions {
  silent?: boolean;
}

const AUTO_SYNC_INTERVAL_MS = 2 * 60 * 1000;

const eventTypeBadgeClass = (eventType: string): string => {
  if (eventType.includes('loss') || eventType.includes('destruction')) {
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  }
  if (eventType.includes('ship') || eventType.includes('remov') || eventType.includes('pour')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (eventType.includes('produce') || eventType.includes('batch')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
};

const statusBadgeClass: Record<ComplianceEventStatus, string> = {
  recorded: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  voided: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  amended: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

const formatTypeLabel = (value: string): string =>
  value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toDateInput = (value: Date): string => value.toISOString().slice(0, 10);
const dateToStartIso = (date: string): string => new Date(`${date}T00:00:00.000Z`).toISOString();
const dateToEndIso = (date: string): string => new Date(`${date}T23:59:59.999Z`).toISOString();

export default function CompliancePage() {
  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const [siteId, setSiteId] = useState('main');
  const [fromDate, setFromDate] = useState(toDateInput(defaultFrom));
  const [toDate, setToDate] = useState(toDateInput(today));
  const [sourceFilter, setSourceFilter] = useState<'all' | ComplianceSuiteId>('all');
  const [search, setSearch] = useState('');

  const [countryCode, setCountryCode] = useState('US');
  const [regionCode, setRegionCode] = useState('CA');
  const [agency, setAgency] = useState('ABC');
  const [permitId, setPermitId] = useState('');

  const [events, setEvents] = useState<ComplianceEventRecord[]>([]);
  const [reports, setReports] = useState<CompliancePeriodReport[]>([]);
  const [syncState, setSyncState] = useState<ComplianceSyncState | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const syncingRef = useRef(false);
  const syncStateRef = useRef<ComplianceSyncState | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const [eventsResponse, reportsResponse] = await Promise.all([
        apiGet<EventListResponse>('/api/compliance/events', {
          params: {
            siteId,
            from: dateToStartIso(fromDate),
            to: dateToEndIso(toDate),
            ...(sourceFilter !== 'all' ? { sourceSuite: sourceFilter } : {}),
          },
        }),
        apiGet<ReportsResponse>('/api/compliance/reports', {
          params: { siteId },
        }),
      ]);

      setEvents(Array.isArray(eventsResponse.data) ? eventsResponse.data : []);
      setReports(Array.isArray(reportsResponse.data) ? reportsResponse.data : []);
      setSyncState(reportsResponse.syncState ?? null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load compliance data.'
      );
      setEvents([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, siteId, sourceFilter, toDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    syncStateRef.current = syncState;
  }, [syncState]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) => {
      const haystack = [
        event.id,
        event.eventType,
        event.sourceRecord.recordId,
        event.batchId ?? '',
        event.lotCode ?? '',
        event.skuId ?? '',
        event.reasonCode ?? '',
        event.reasonMessage ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [events, search]);

  const osEventCount = events.filter((event) => event.sourceSuite === 'os').length;

  const handleSync = useCallback(async (options: SyncOptions = {}): Promise<void> => {
    if (syncingRef.current) {
      return;
    }
    try {
      syncingRef.current = true;
      setSyncing(true);
      if (!options.silent) {
        setError(null);
        setSyncMessage(null);
      }
      const cursor = syncStateRef.current?.cursor?.nextAfter;
      const response = await apiPost<SyncResponse>('/api/compliance/sync', {
        siteId,
        from: dateToStartIso(fromDate),
        to: dateToEndIso(toDate),
        afterOccurredAt: cursor?.occurredAt,
        afterId: cursor?.id,
      });
      const nextSyncState = response.data.syncState ?? syncStateRef.current;
      setSyncState(nextSyncState);
      syncStateRef.current = nextSyncState;
      if (!options.silent) {
        setSyncMessage(
          `Synced feed ${response.data.sourceFeedId}: +${response.data.inserted} inserted, ${response.data.updated} updated, ${response.data.unchanged} unchanged.`
        );
      }
      await loadData();
    } catch (syncError) {
      if (!options.silent) {
        setError(
          syncError instanceof Error
            ? syncError.message
            : 'Failed to sync OS compliance feed.'
        );
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [fromDate, loadData, siteId, toDate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    void handleSync({ silent: true });
    const intervalId = window.setInterval(() => {
      void handleSync({ silent: true });
    }, AUTO_SYNC_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [handleSync]);

  const handleGenerateReport = async (): Promise<void> => {
    try {
      setGenerating(true);
      setError(null);
      const response = await apiPost<ReportCreateResponse>('/api/compliance/reports', {
        siteId,
        from: dateToStartIso(fromDate),
        to: dateToEndIso(toDate),
        jurisdiction: {
          countryCode,
          regionCode,
          agency,
          permitId: permitId.trim() || undefined,
        },
      });
      setReports((current) => [response.data, ...current]);
      setSyncMessage(`Generated report ${response.data.id}.`);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'Failed to generate period report.'
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance</h1>
          <p className="mt-1 text-muted-foreground">
            OPS ingest + filing workflow from OS compliance feed.
          </p>
          {syncState?.lastSyncAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last sync: {new Date(syncState.lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => void handleSync()} disabled={syncing}>
            <ShieldCheck className={`mr-2 h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync From OS'}
          </Button>
        </div>
      </div>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="site-id">Site</Label>
              <Input id="site-id" value={siteId} onChange={(e) => setSiteId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-date">From</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-filter">Source</Label>
              <Select
                value={sourceFilter}
                onValueChange={(value: 'all' | ComplianceSuiteId) => setSourceFilter(value)}
              >
                <SelectTrigger id="source-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="os">OS</SelectItem>
                  <SelectItem value="ops">OPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search-events">Search</Label>
              <Input
                id="search-events"
                placeholder="event id, sku, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country-code">Jurisdiction Country</Label>
              <Input
                id="country-code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-code">Jurisdiction Region</Label>
              <Input
                id="region-code"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Input id="agency" value={agency} onChange={(e) => setAgency(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-sm space-y-2">
              <Label htmlFor="permit-id">Permit ID (optional)</Label>
              <Input
                id="permit-id"
                value={permitId}
                onChange={(e) => setPermitId(e.target.value)}
              />
            </div>
            <Button onClick={() => void handleGenerateReport()} disabled={generating}>
              <FileText className="mr-2 h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Period Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {syncMessage && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 text-sm text-emerald-300">{syncMessage}</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-2xl">{events.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>OS Events</CardDescription>
            <CardTitle className="text-2xl">{osEventCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>OPS Notes/Events</CardDescription>
            <CardTitle className="text-2xl">{events.length - osEventCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reports</CardDescription>
            <CardTitle className="text-2xl">{reports.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Events ({filteredEvents.length})</CardTitle>
          <CardDescription>
            Canonical compliance events ingested idempotently from OS feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No compliance events for this filter.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={eventTypeBadgeClass(event.eventType)}>
                      {formatTypeLabel(event.eventType)}
                    </Badge>
                    <Badge className={statusBadgeClass[event.eventStatus]}>
                      {formatTypeLabel(event.eventStatus)}
                    </Badge>
                    <Badge variant="outline" className="uppercase">
                      {event.sourceSuite}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{event.id}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Occurred:</span>{' '}
                      {new Date(event.occurredAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Site:</span> {event.siteId}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source Record:</span>{' '}
                      {event.sourceRecord.recordType} / {event.sourceRecord.recordId}
                    </div>
                    {event.quantity && (
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>{' '}
                        {event.quantity.value} {event.quantity.uom} ({event.quantity.direction})
                      </div>
                    )}
                    {event.skuId && (
                      <div>
                        <span className="text-muted-foreground">SKU:</span> {event.skuId}
                      </div>
                    )}
                    {event.batchId && (
                      <div>
                        <span className="text-muted-foreground">Batch:</span> {event.batchId}
                      </div>
                    )}
                    {event.reasonMessage && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Note:</span>{' '}
                        {event.reasonMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Period Reports ({reports.length})</CardTitle>
          <CardDescription>OPS filing packets generated from ingested OS feed events.</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports generated yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {report.status}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">{report.id}</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Period:</span>{' '}
                      {new Date(report.period.from).toLocaleDateString()} -{' '}
                      {new Date(report.period.to).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Generated:</span>{' '}
                      {new Date(report.generatedAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source Feed:</span>{' '}
                      {report.sourceFeedId}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Totals:</span>{' '}
                      {report.totals.producedQty} produced / {report.totals.removedQty} removed /{' '}
                      {report.totals.onHandEndQty} ending ({report.totals.uom})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
