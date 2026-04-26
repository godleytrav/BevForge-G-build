import type { Request, Response } from 'express';
import { readOpsCrmState } from '../../../../lib/crm-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const payload = await readOpsCrmState();
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to read OPS CRM state:', error);
    return res.status(500).json({ error: 'Failed to read OPS CRM state.' });
  }
}
