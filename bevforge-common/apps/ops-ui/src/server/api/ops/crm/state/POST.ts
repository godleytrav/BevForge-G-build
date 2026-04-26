import type { Request, Response } from 'express';
import { writeOpsCrmState } from '../../../../lib/crm-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const payload = await writeOpsCrmState(req.body);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to write OPS CRM state:', error);
    return res.status(500).json({ error: 'Failed to write OPS CRM state.' });
  }
}
