import type { Request, Response } from 'express';
import { readOpsInvoiceState } from '../../../lib/invoice-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const payload = await readOpsInvoiceState();
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to read OPS invoice state:', error);
    return res.status(500).json({ error: 'Failed to read OPS invoice state.' });
  }
}
