import type { Request, Response } from 'express';
import { db } from '../../../db/client';
import { alerts } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    // Get active alerts
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.isResolved, false))
      .orderBy(desc(alerts.createdAt))
      .limit(50);

    res.json({
      alerts: activeAlerts,
      count: activeAlerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching canvas alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch canvas alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
