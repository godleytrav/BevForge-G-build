import type { Request, Response } from 'express';
import {
  createReportArtifact,
  createInlineReportArtifact,
  type ReportArtifactFormat,
  type ReportType,
} from '../../../../lib/report-artifact-store.js';

const isReportType = (value: unknown): value is ReportType =>
  value === 'batches' ||
  value === 'packaging' ||
  value === 'movements' ||
  value === 'production' ||
  value === 'compliance';

const isFormat = (value: unknown): value is ReportArtifactFormat =>
  value === 'csv' || value === 'html';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      reportType?: ReportType;
      format?: ReportArtifactFormat;
      from?: string;
      to?: string;
      siteId?: string;
      fileName?: string;
      reportId?: string;
      reportTitle?: string;
      content?: string;
      contentType?: string;
    };

    if (!isReportType(body.reportType)) {
      return res.status(400).json({
        success: false,
        error: 'reportType is required.',
      });
    }
    if (!isFormat(body.format)) {
      return res.status(400).json({
        success: false,
        error: 'format must be csv or html.',
      });
    }
    if (!body.from || !body.to) {
      return res.status(400).json({
        success: false,
        error: 'from and to are required.',
      });
    }

    const artifact =
      typeof body.content === 'string' && body.content.length > 0
        ? await createInlineReportArtifact({
            reportType: body.reportType,
            format: body.format,
            from: body.from,
            to: body.to,
            siteId: body.siteId,
            fileName: body.fileName,
            content: body.content,
            contentType: body.contentType,
            reportId: body.reportId,
            reportTitle: body.reportTitle,
          })
        : await createReportArtifact({
            reportType: body.reportType,
            format: body.format,
            from: body.from,
            to: body.to,
            siteId: body.siteId,
            fileName: body.fileName,
            reportId: body.reportId,
            reportTitle: body.reportTitle,
          });

    return res.status(200).json({
      success: true,
      data: {
        artifact,
        downloadUrl: `/api/os/reports/artifacts/${artifact.id}`,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export report.',
    });
  }
}
