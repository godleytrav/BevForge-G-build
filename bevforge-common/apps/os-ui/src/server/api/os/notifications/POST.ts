import type { Request, Response } from 'express';
import {
  createNotification,
  dismissNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationCategory,
  type NotificationLevel,
} from '../../../lib/notifications-store.js';

const toText = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const normalizeAction = (value: unknown): 'create' | 'mark_read' | 'mark_all_read' | 'dismiss' => {
  const normalized = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (
    normalized === 'create' ||
    normalized === 'mark_read' ||
    normalized === 'mark_all_read' ||
    normalized === 'dismiss'
  ) {
    return normalized;
  }
  return 'create';
};

const normalizeLevel = (value: unknown): NotificationLevel | undefined => {
  const normalized = toText(value)?.toLowerCase();
  if (
    normalized === 'info' ||
    normalized === 'warning' ||
    normalized === 'error' ||
    normalized === 'success'
  ) {
    return normalized;
  }
  return undefined;
};

const normalizeCategory = (value: unknown): NotificationCategory | undefined => {
  const normalized = toText(value)?.toLowerCase().replaceAll('-', '_');
  if (
    normalized === 'schedule' ||
    normalized === 'requests' ||
    normalized === 'compliance' ||
    normalized === 'operations' ||
    normalized === 'manual'
  ) {
    return normalized;
  }
  return undefined;
};

export default async function handler(req: Request, res: Response) {
  try {
    const action = normalizeAction(req.body?.action);

    if (action === 'mark_read') {
      const id = toText(req.body?.id);
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Notification id is required.',
        });
      }
      await markNotificationRead(id);
      return res.status(200).json({
        success: true,
      });
    }

    if (action === 'dismiss') {
      const id = toText(req.body?.id);
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Notification id is required.',
        });
      }
      await dismissNotification(id);
      return res.status(200).json({
        success: true,
      });
    }

    if (action === 'mark_all_read') {
      await markAllNotificationsRead();
      const listing = await listNotifications();
      return res.status(200).json({
        success: true,
        data: listing,
      });
    }

    const title = toText(req.body?.title);
    const message = toText(req.body?.message);
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required.',
      });
    }

    const notification = await createNotification({
      title,
      message,
      level: normalizeLevel(req.body?.level ?? req.body?.type),
      category: normalizeCategory(req.body?.category),
      sourceRecordId: toText(req.body?.sourceRecordId),
      openPath: toText(req.body?.openPath),
      openUrl: toText(req.body?.openUrl),
      metadata:
        req.body?.metadata && typeof req.body.metadata === 'object'
          ? (req.body.metadata as Record<string, unknown>)
          : undefined,
    });

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notifications.',
    });
  }
}
