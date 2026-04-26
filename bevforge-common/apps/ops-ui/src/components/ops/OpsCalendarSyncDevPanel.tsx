import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  OPS_CALENDAR_SYNC_EVENT,
  clearOpsCalendarSyncLog,
  getOpsCalendarSyncLog,
  type OpsCalendarSyncLogEntry,
} from '@/lib/ops-calendar';

interface OpsCalendarSyncDevPanelProps {
  originPrefix?: string;
  title?: string;
  maxRows?: number;
}

export function OpsCalendarSyncDevPanel({
  originPrefix,
  title = 'OPS Calendar Sync (DEV)',
  maxRows = 8,
}: OpsCalendarSyncDevPanelProps) {
  const [entries, setEntries] = useState<OpsCalendarSyncLogEntry[]>(() =>
    getOpsCalendarSyncLog()
  );

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
      return;
    }

    const refresh = () => setEntries(getOpsCalendarSyncLog());
    window.addEventListener(OPS_CALENDAR_SYNC_EVENT, refresh);
    return () => {
      window.removeEventListener(OPS_CALENDAR_SYNC_EVENT, refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!originPrefix) {
      return entries;
    }
    return entries.filter((entry) => entry.origin?.startsWith(originPrefix));
  }, [entries, originPrefix]);

  const visible = filtered.slice(0, Math.max(1, maxRows));
  const successCount = filtered.filter((entry) => entry.success).length;
  const failureCount = filtered.filter((entry) => !entry.success).length;

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className="border-cyan-500/40 bg-cyan-500/10">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm text-cyan-100">{title}</CardTitle>
            <CardDescription className="text-xs">
              Success {successCount} · Failed {failureCount}
              {originPrefix ? ` · Filter ${originPrefix}` : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEntries(getOpsCalendarSyncLog())}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearOpsCalendarSyncLog();
                setEntries([]);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sync attempts captured yet.</p>
        ) : (
          visible.map((entry) => (
            <div
              key={entry.id}
              className={`rounded border px-2 py-1 text-xs ${
                entry.success
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/40 bg-red-500/10 text-red-200'
              }`}
            >
              <p className="font-medium">
                {entry.success ? 'OK' : 'FAIL'} · {entry.title}
              </p>
              <p className="text-[11px] opacity-90">
                {new Date(entry.createdAt).toLocaleTimeString()} · {entry.type}
                {entry.origin ? ` · ${entry.origin}` : ''}
              </p>
              {entry.error && <p className="text-[11px]">{entry.error}</p>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
