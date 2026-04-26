import type { Request, Response } from 'express';
import { listOrders } from '../../lib/orders-store';

export default async function handler(req: Request, res: Response) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const payload = await listOrders(status);
    return res.json(payload);
  } catch (error) {
    console.error('Error fetching orders:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        error: message.replace('Validation:', '').trim(),
      });
    }
    return res.status(500).json({
      error: 'Failed to fetch orders',
      message,
    });
  }
}
