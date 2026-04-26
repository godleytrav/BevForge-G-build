import fs from 'node:fs/promises';
import type { Request, Response } from 'express';
import { getReportArtifactById } from '../../../../../lib/report-artifact-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const artifactIdParam = req.params.artifactId;
    const artifactId = Array.isArray(artifactIdParam) ? artifactIdParam[0] : artifactIdParam;
    if (!artifactId || !String(artifactId).trim()) {
      return res.status(400).json({
        success: false,
        error: 'artifactId is required.',
      });
    }

    const artifact = await getReportArtifactById(String(artifactId).trim());
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Report artifact not found.',
      });
    }

    let content = await fs.readFile(artifact.absolutePath, 'utf8');
    const autoprint =
      String(Array.isArray(req.query.autoprint) ? req.query.autoprint[0] : req.query.autoprint ?? '') === '1';

    res.setHeader('Content-Type', artifact.contentType);
    if (artifact.format === 'csv') {
      res.setHeader('Content-Disposition', `attachment; filename="${artifact.fileName}"`);
      return res.status(200).send(content);
    }

    if (autoprint) {
      content = content.replace(
        '</body>',
        '<script>window.addEventListener("load",()=>window.print());</script></body>'
      );
    }
    res.setHeader('Content-Disposition', `inline; filename="${artifact.fileName}"`);
    return res.status(200).send(content);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load report artifact.',
    });
  }
}
