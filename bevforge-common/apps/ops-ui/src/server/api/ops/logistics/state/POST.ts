import type { Request, Response } from 'express';
import { writeOpsLogisticsState } from '../../../../lib/logistics-state-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const payload = await writeOpsLogisticsState(req.body);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to write OPS logistics state:', error);
    return res.status(500).json({ error: 'Failed to write OPS logistics state.' });
  }
}
