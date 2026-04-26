import type { Request, Response } from 'express';
import { syncOpsPackageUnits } from '../../../lib/package-unit-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const payload =
      typeof req.body === 'object' && req.body !== null
        ? (req.body as { units?: unknown[]; events?: unknown[] })
        : {};
    const state = await syncOpsPackageUnits(payload);
    return res.status(200).json(state);
  } catch (error) {
    console.error('Failed to sync OPS package units:', error);
    return res.status(500).json({ error: 'Failed to sync OPS package units.' });
  }
}
