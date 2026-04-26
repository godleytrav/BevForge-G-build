import type { Request, Response } from 'express';
import { createComplianceEvent } from '../../../lib/compliance-store';

/**
 * POST /api/compliance/events
 * Optional OPS-side manual compliance note/event creation.
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

    const created = await createComplianceEvent({
      id: typeof body.id === 'string' ? body.id : undefined,
      eventType: typeof body.eventType === 'string' ? body.eventType : undefined,
      eventStatus: typeof body.eventStatus === 'string' ? body.eventStatus : undefined,
      sourceSuite: 'ops',
      sourceRecord:
        body.sourceRecord && typeof body.sourceRecord === 'object'
          ? (body.sourceRecord as {
              recordType?: string;
              recordId?: string;
              openPath?: string;
              originSuite?: 'os' | 'ops' | 'lab' | 'flow' | 'connect';
            })
          : {
              recordType: 'manual',
              recordId: `manual-${Date.now().toString(36)}`,
            },
      siteId: typeof body.siteId === 'string' ? body.siteId : undefined,
      occurredAt:
        typeof body.occurredAt === 'string'
          ? body.occurredAt
          : new Date().toISOString(),
      recordedAt:
        typeof body.recordedAt === 'string' ? body.recordedAt : undefined,
      reasonCode:
        typeof body.reasonCode === 'string' ? body.reasonCode : undefined,
      reasonMessage:
        typeof body.reasonMessage === 'string' ? body.reasonMessage : undefined,
      quantity:
        body.quantity && typeof body.quantity === 'object'
          ? (body.quantity as {
              value?: number;
              uom?: string;
              direction?: 'in' | 'out' | 'none';
            })
          : undefined,
      metadata:
        body.metadata && typeof body.metadata === 'object'
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create compliance event.';
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        success: false,
        error: message.replace('Validation:', '').trim(),
      });
    }
    console.error('Failed to create compliance event:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create compliance event.',
      message,
    });
  }
}
