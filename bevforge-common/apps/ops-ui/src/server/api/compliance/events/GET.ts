import type { Request, Response } from 'express';
import { listComplianceEvents } from '../../../lib/compliance-store';

/**
 * GET /api/compliance/events
 * Returns OPS compliance ledger events (ingested from OS feed + OPS notes).
 */
export default async function handler(req: Request, res: Response) {
  try {
    const siteId =
      typeof req.query.siteId === 'string' ? req.query.siteId : undefined;
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const sourceSuite =
      typeof req.query.sourceSuite === 'string'
        ? (req.query.sourceSuite as 'os' | 'ops' | 'lab' | 'flow' | 'connect')
        : undefined;
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined;
    const eventType =
      typeof req.query.eventType === 'string' ? req.query.eventType : undefined;

    const events = await listComplianceEvents({
      siteId,
      from,
      to,
      sourceSuite,
      search,
      eventType,
    });

    return res.json({
      success: true,
      data: events,
      summary: {
        total: events.length,
        sourceSuite: {
          os: events.filter((event) => event.sourceSuite === 'os').length,
          ops: events.filter((event) => event.sourceSuite === 'ops').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching compliance events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
