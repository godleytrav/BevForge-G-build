import type { Request, Response } from 'express';
import { writeCanvasProject } from '../../../../lib/commissioning-store.js';
import type { CanvasProject } from '../../../../../features/canvas/types.js';

export default async function handler(req: Request, res: Response) {
  try {
    const project = req.body as CanvasProject | undefined;
    if (!project || !project.pages) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project payload',
      });
    }

    const saved = await writeCanvasProject(project);
    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    console.error('Failed to write canvas project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to write canvas project',
    });
  }
}
