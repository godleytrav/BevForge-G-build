import type { Request, Response } from 'express';
import { createCalendarEvent } from '../../../lib/calendar-store.js';

/**
 * POST /api/calendar/events
 *
 * Body:
 * - sourceSuite?: "os" | "ops" | "lab" | "flow" | "connect"
 * - title: string
 * - startAt: ISO datetime
 * - endAt?: ISO datetime
 * - type?: string
 * - status?: string
 * - priority?: string
 * - siteId?: string
 * - description?: string
 * - sourceRecordId?: string
 * - links?: { openPath?: string; openUrl?: string }
 * - metadata?: object
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body is required.',
      });
    }

    const created = await createCalendarEvent({
      id: typeof body.id === 'string' ? body.id : undefined,
      sourceSuite: body.sourceSuite as any,
      sourceRecordId: typeof body.sourceRecordId === 'string' ? body.sourceRecordId : undefined,
      siteId: typeof body.siteId === 'string' ? body.siteId : undefined,
      title: typeof body.title === 'string' ? body.title : '',
      description: typeof body.description === 'string' ? body.description : undefined,
      type: typeof body.type === 'string' ? body.type : undefined,
      status: typeof body.status === 'string' ? body.status : undefined,
      priority: typeof body.priority === 'string' ? body.priority : undefined,
      startAt: typeof body.startAt === 'string' ? body.startAt : '',
      endAt: typeof body.endAt === 'string' ? body.endAt : undefined,
      timezone: typeof body.timezone === 'string' ? body.timezone : undefined,
      allDay: typeof body.allDay === 'boolean' ? body.allDay : undefined,
      tags: Array.isArray(body.tags)
        ? body.tags.filter((entry): entry is string => typeof entry === 'string')
        : undefined,
      links:
        body.links && typeof body.links === 'object'
          ? {
              openPath:
                typeof (body.links as any).openPath === 'string'
                  ? (body.links as any).openPath
                  : undefined,
              openUrl:
                typeof (body.links as any).openUrl === 'string'
                  ? (body.links as any).openUrl
                  : undefined,
            }
          : undefined,
      metadata:
        body.metadata && typeof body.metadata === 'object'
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });

    return res.status(created.idempotent ? 200 : 201).json({
      success: true,
      data: created.event,
      meta: {
        idempotent: created.idempotent,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create calendar event.';
    const isValidation = message.startsWith('Validation:');
    if (isValidation) {
      return res.status(400).json({
        success: false,
        error: message.replace('Validation:', '').trim(),
      });
    }
    console.error('Failed to create calendar event:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create calendar event.',
    });
  }
}
