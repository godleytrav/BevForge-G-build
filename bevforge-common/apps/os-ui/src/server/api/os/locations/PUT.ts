import type { Request, Response } from 'express';
import { writeLocations } from '../../../lib/commissioning-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      locations?: Array<{
        siteId?: string;
        name?: string;
        timezone?: string;
        active?: boolean;
        addressLine1?: string;
        city?: string;
        stateRegion?: string;
        postalCode?: string;
        country?: string;
      }>;
    };

    const next = await writeLocations(body.locations ?? []);
    return res.status(200).json({
      success: true,
      data: next,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save locations.',
    });
  }
}
