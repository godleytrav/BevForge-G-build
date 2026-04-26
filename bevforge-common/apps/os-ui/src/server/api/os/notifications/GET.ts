import type { Request, Response } from 'express';
import { listNotifications } from '../../../lib/notifications-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const listing = await listNotifications();
    return res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load notifications.',
    });
  }
}
