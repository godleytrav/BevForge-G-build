import type { Request, Response } from 'express';
import { readOpsLogisticsState } from '../../../../lib/logistics-state-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const payload = await readOpsLogisticsState();
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to read OPS logistics state:', error);
    return res.status(500).json({ error: 'Failed to read OPS logistics state.' });
  }
}
