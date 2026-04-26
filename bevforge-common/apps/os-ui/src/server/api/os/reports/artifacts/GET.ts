import type { Request, Response } from 'express';
import { listReportArtifacts } from '../../../../lib/report-artifact-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const artifacts = await listReportArtifacts();
    return res.status(200).json({
      success: true,
      data: artifacts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load report artifacts.',
    });
  }
}
