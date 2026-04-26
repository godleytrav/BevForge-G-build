import type { Request, Response } from 'express';
import { readSiteSettings } from '../../../lib/commissioning-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const settings = await readSiteSettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load settings.',
    });
  }
}
