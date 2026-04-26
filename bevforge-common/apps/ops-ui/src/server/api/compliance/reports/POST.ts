import type { Request, Response } from 'express';
import { generateCompliancePeriodReport } from '../../../lib/compliance-store';

/**
 * POST /api/compliance/reports
 * Generates a new OPS period report from ingested OS compliance events.
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

    const jurisdiction =
      body.jurisdiction && typeof body.jurisdiction === 'object'
        ? (body.jurisdiction as {
            countryCode: string;
            regionCode: string;
            agency: string;
            permitId?: string;
            facilityId?: string;
          })
        : undefined;

    if (!jurisdiction) {
      return res.status(400).json({
        success: false,
        error: 'jurisdiction is required.',
      });
    }

    const report = await generateCompliancePeriodReport({
      siteId: typeof body.siteId === 'string' ? body.siteId : '',
      from: typeof body.from === 'string' ? body.from : '',
      to: typeof body.to === 'string' ? body.to : '',
      sourceFeedId:
        typeof body.sourceFeedId === 'string' ? body.sourceFeedId : undefined,
      status:
        typeof body.status === 'string'
          ? (body.status as 'draft' | 'reviewed' | 'submitted' | 'accepted' | 'amended')
          : undefined,
      jurisdiction,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    });

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate compliance report.';
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        success: false,
        error: message.replace('Validation:', '').trim(),
      });
    }
    console.error('Failed to generate compliance report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report.',
      message,
    });
  }
}
