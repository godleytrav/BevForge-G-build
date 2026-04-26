import type { Request, Response } from 'express';
import { readCanvasProject } from '../../../../lib/commissioning-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const project = await readCanvasProject();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Failed to read canvas project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read canvas project',
    });
  }
}
