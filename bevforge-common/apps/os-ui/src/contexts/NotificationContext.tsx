import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory =
  | 'schedule'
  | 'requests'
  | 'compliance'
  | 'operations'
  | 'manual';
export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface NotificationRecord {
  id: string;
  kind: 'derived' | 'manual';
  category: NotificationCategory;
  level: NotificationLevel;
  title: string;
  message: string;
  sourceSuite?: string;
  sourceType?: 'calendar' | 'fulfillment_request' | 'manual';
  sourceRecordId?: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  readAt?: string;
  dismissedAt?: string;
  links?: {
    openPath?: string;
    openUrl?: string;
  };
  metadata?: Record<string, unknown>;
}

interface NotificationSummary {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
}

interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  summary: NotificationSummary;
  isLoading: boolean;
  statusText: string;
  refreshNotifications: (options?: { quiet?: boolean }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  addNotification: (notification: {
    title: string;
    message: string;
    type?: NotificationLevel;
    level?: NotificationLevel;
    category?: NotificationCategory;
    sourceRecordId?: string;
    openPath?: string;
    openUrl?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
}

const emptySummary = (): NotificationSummary => ({
  total: 0,
  unread: 0,
  byCategory: {
    schedule: 0,
    requests: 0,
    compliance: 0,
    operations: 0,
    manual: 0,
  },
});

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const toastForLevel = (level: NotificationLevel, title: string, message: string) => {
  if (level === 'success') {
    toast.success(title, { description: message, duration: 2500 });
    return;
  }
  if (level === 'warning') {
    toast.warning(title, { description: message, duration: 3000 });
    return;
  }
  if (level === 'error') {
    toast.error(title, { description: message, duration: 3500 });
    return;
  }
  toast(title, { description: message, duration: 2500 });
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>(emptySummary);
  const [statusText, setStatusText] = useState('Loading notifications...');
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const refreshNotifications = useCallback(async (options?: { quiet?: boolean }) => {
    const quiet = options?.quiet === true;
    if (!quiet) setIsLoading(true);
    try {
      const response = await fetch('/api/os/notifications');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load notifications.');
      }
      const nextNotifications = ((payload.data?.notifications ?? []) as NotificationRecord[]).filter(
        (entry) => entry.status !== 'dismissed'
      );
      const nextSummary = (payload.data?.summary ?? emptySummary()) as NotificationSummary;

      if (initializedRef.current) {
        for (const notification of nextNotifications) {
          if (notification.status !== 'unread') continue;
          if (seenIdsRef.current.has(notification.id)) continue;
          seenIdsRef.current.add(notification.id);
          toastForLevel(notification.level, notification.title, notification.message);
        }
      } else {
        nextNotifications.forEach((notification) => {
          seenIdsRef.current.add(notification.id);
        });
        initializedRef.current = true;
      }

      setNotifications(nextNotifications);
      setSummary(nextSummary);
      setStatusText('Notifications ready.');
    } catch (error) {
      setStatusText(
        error instanceof Error ? error.message : 'Failed to load notifications.'
      );
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshNotifications({ quiet: true });
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [refreshNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      const response = await fetch('/api/os/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to mark notification as read.');
      }
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, status: 'read', readAt: new Date().toISOString() }
            : notification
        )
      );
      await refreshNotifications({ quiet: true });
    },
    [refreshNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    const response = await fetch('/api/os/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to mark notifications as read.');
    }
    const nextNotifications = ((payload.data?.notifications ?? []) as NotificationRecord[]).filter(
      (entry) => entry.status !== 'dismissed'
    );
    setNotifications(nextNotifications);
    setSummary((payload.data?.summary ?? emptySummary()) as NotificationSummary);
  }, []);

  const dismissNotification = useCallback(async (id: string) => {
    const response = await fetch('/api/os/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss', id }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to dismiss notification.');
    }
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    await refreshNotifications({ quiet: true });
  }, [refreshNotifications]);

  const addNotification = useCallback(
    async (notification: {
      title: string;
      message: string;
      type?: NotificationLevel;
      level?: NotificationLevel;
      category?: NotificationCategory;
      sourceRecordId?: string;
      openPath?: string;
      openUrl?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const level = notification.level ?? notification.type ?? 'info';
      const response = await fetch('/api/os/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: notification.title,
          message: notification.message,
          level,
          category: notification.category,
          sourceRecordId: notification.sourceRecordId,
          openPath: notification.openPath,
          openUrl: notification.openUrl,
          metadata: notification.metadata,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to create notification.');
      }
      const created = payload.data as NotificationRecord;
      seenIdsRef.current.add(created.id);
      toastForLevel(level, created.title, created.message);
      await refreshNotifications({ quiet: true });
    },
    [refreshNotifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status === 'unread').length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        summary,
        isLoading,
        statusText,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
