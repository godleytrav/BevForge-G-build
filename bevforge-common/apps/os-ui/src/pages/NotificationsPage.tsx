import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock3, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, type NotificationCategory, type NotificationRecord } from '@/contexts/NotificationContext';

type NotificationFilter = 'all' | 'unread' | NotificationCategory;

const filterLabels: Record<NotificationFilter, string> = {
  all: 'All',
  unread: 'Unread',
  schedule: 'Schedule',
  requests: 'Requests',
  compliance: 'Compliance',
  operations: 'Operations',
  manual: 'Activity',
};

const levelBadgeClass: Record<NotificationRecord['level'], string> = {
  info: 'border-sky-500/60 bg-sky-500/10 text-sky-200',
  warning: 'border-amber-500/60 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/60 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200',
};

const categoryBadgeClass: Record<NotificationCategory, string> = {
  schedule: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200',
  requests: 'border-blue-500/60 bg-blue-500/10 text-blue-200',
  compliance: 'border-rose-500/60 bg-rose-500/10 text-rose-200',
  operations: 'border-violet-500/60 bg-violet-500/10 text-violet-200',
  manual: 'border-slate-500/60 bg-slate-500/10 text-slate-200',
};

const surfaceClass =
  'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)] text-white shadow-[0_18px_45px_rgba(2,6,23,0.35)]';

const relativeTime = (value?: string): string => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  const diffMs = parsed.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 1) return 'Now';
  if (diffHours > 0) {
    if (diffHours < 24) return `In ${diffHours} hr`;
    const diffDays = Math.ceil(diffHours / 24);
    return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }
  const overdueHours = Math.abs(diffHours);
  if (overdueHours < 24) return `${overdueHours} hr ago`;
  const overdueDays = Math.ceil(overdueHours / 24);
  return `${overdueDays} day${overdueDays === 1 ? '' : 's'} ago`;
};

const timestampLabel = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

const complianceDeadlineSource = (
  notification: NotificationRecord
): { label: string; note?: string } | null => {
  if (notification.category !== 'compliance') return null;
  const source = String(notification.metadata?.deadlineSource ?? '').trim();
  const note = String(notification.metadata?.deadlineSourceNote ?? '').trim() || undefined;
  if (source === 'agency_schedule') {
    return { label: 'Agency schedule', note };
  }
  if (source === 'settings_driven') {
    return { label: 'Settings-driven', note };
  }
  return null;
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    summary,
    isLoading,
    statusText,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === 'all') return true;
      if (filter === 'unread') return notification.status === 'unread';
      return notification.category === filter;
    });
  }, [filter, notifications]);

  const todayCount = useMemo(
    () =>
      notifications.filter((notification) => {
        if (!notification.dueAt) return false;
        const due = new Date(notification.dueAt);
        const now = new Date();
        return (
          due.getFullYear() === now.getFullYear() &&
          due.getMonth() === now.getMonth() &&
          due.getDate() === now.getDate()
        );
      }).length,
    [notifications]
  );

  return (
    <AppShell currentSuite="os" pageTitle="Notifications">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              Upcoming work, request handoffs, and compliance reminders in one queue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refreshNotifications()} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => void markAllAsRead()} disabled={unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Unread',
              value: unreadCount,
              subtitle: unreadCount > 0 ? 'needs review' : 'clear',
              accentClass:
                'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
              iconClass: 'text-cyan-300',
              lineClass: 'via-cyan-300/40',
              filterValue: 'unread' as NotificationFilter,
            },
            {
              title: 'Due Today',
              value: todayCount,
              subtitle: todayCount > 0 ? 'deadlines on deck' : 'nothing due today',
              accentClass:
                'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
              iconClass: 'text-amber-300',
              lineClass: 'via-amber-300/40',
              filterValue: 'all' as NotificationFilter,
            },
            {
              title: 'Open Requests',
              value: summary.byCategory.requests,
              subtitle: summary.byCategory.requests > 0 ? 'handoff queue waiting' : 'request queue clear',
              accentClass:
                'border-sky-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(56,189,248,0.12)]',
              iconClass: 'text-sky-300',
              lineClass: 'via-sky-300/40',
              filterValue: 'requests' as NotificationFilter,
            },
            {
              title: 'Compliance',
              value: summary.byCategory.compliance,
              subtitle: summary.byCategory.compliance > 0 ? 'regulatory reminders active' : 'no compliance alerts',
              accentClass:
                'border-rose-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(244,63,94,0.12)]',
              iconClass: 'text-rose-300',
              lineClass: 'via-rose-300/40',
              filterValue: 'compliance' as NotificationFilter,
            },
          ].map((tile) => (
            <button
              key={tile.title}
              type="button"
              className="text-left"
              onClick={() => setFilter(tile.filterValue)}
            >
              <Card
                className={`overflow-hidden border-white/10 transition hover:border-primary/40 ${tile.accentClass} ${
                  filter === tile.filterValue ? 'ring-2 ring-cyan-300/60' : ''
                }`}
              >
                <CardContent className="relative p-5">
                  <div className={`absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent ${tile.lineClass} to-transparent`} />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Notifications</p>
                    <p className="mt-3 text-3xl font-semibold leading-none text-white">{tile.value}</p>
                  </div>
                  <div className="mt-5 space-y-1">
                    <p className="text-sm font-medium text-white">{tile.title}</p>
                    <p className="text-xs text-white/60">{tile.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        <Card className={surfaceClass}>
          <CardHeader className="pb-3">
            <CardTitle>Queue</CardTitle>
            <CardDescription>{statusText}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as NotificationFilter)}>
              <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                {(['all', 'unread', 'schedule', 'requests', 'compliance', 'operations', 'manual'] as NotificationFilter[]).map((value) => (
                  <TabsTrigger key={value} value={value} className="rounded-md border px-3 py-1.5">
                    {filterLabels[value]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {filteredNotifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
                <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-lg font-semibold">Nothing waiting right now.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scheduled work and request alerts will land here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const deadlineSource = complianceDeadlineSource(notification);
                  return (
                  <Card
                    key={notification.id}
                    className={`border-white/10 bg-black/20 transition-colors ${
                      notification.status === 'unread' ? 'border-cyan-300/35 bg-cyan-500/8' : ''
                    }`}
                  >
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={categoryBadgeClass[notification.category]}>
                            {filterLabels[notification.category]}
                          </Badge>
                          <Badge className={levelBadgeClass[notification.level]}>
                            {notification.level}
                          </Badge>
                          {notification.dueAt ? (
                            <Badge variant="outline" className="gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {relativeTime(notification.dueAt)}
                            </Badge>
                          ) : null}
                          {notification.category === 'compliance' ? (
                            <Badge variant="outline" className="gap-1">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Review
                            </Badge>
                          ) : null}
                          {deadlineSource ? (
                            <Badge variant="outline">
                              Deadline Source: {deadlineSource.label}
                            </Badge>
                          ) : null}
                        </div>

                        <div>
                          <p className="text-base font-semibold">{notification.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                          {deadlineSource?.note ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {deadlineSource.note}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{timestampLabel(notification.updatedAt)}</span>
                          {notification.sourceSuite ? (
                            <span>{String(notification.sourceSuite).toUpperCase()}</span>
                          ) : null}
                          {notification.status === 'unread' ? <span>Unread</span> : <span>Read</span>}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {notification.links?.openPath ? (
                          <Button
                            asChild
                            variant="secondary"
                            onClick={() => {
                              if (notification.status === 'unread') {
                                void markAsRead(notification.id);
                              }
                            }}
                          >
                            <Link to={notification.links.openPath}>Open</Link>
                          </Button>
                        ) : null}
                        {notification.links?.openUrl && !notification.links?.openPath ? (
                          <Button
                            asChild
                            variant="secondary"
                            onClick={() => {
                              if (notification.status === 'unread') {
                                void markAsRead(notification.id);
                              }
                            }}
                          >
                            <a href={notification.links.openUrl}>Open</a>
                          </Button>
                        ) : null}
                        {notification.status === 'unread' ? (
                          <Button
                            variant="outline"
                            disabled={busyId === notification.id}
                            onClick={async () => {
                              setBusyId(notification.id);
                              try {
                                await markAsRead(notification.id);
                              } finally {
                                setBusyId(null);
                              }
                            }}
                          >
                            Read
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busyId === notification.id}
                          onClick={async () => {
                            setBusyId(notification.id);
                            try {
                              await dismissNotification(notification.id);
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
