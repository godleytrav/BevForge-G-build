import type { Request, Response } from 'express';
import { getOrder } from '../../../lib/orders-store';

const readParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
    return value[0];
  }
  return null;
};

/**
 * GET /api/orders/:orderId
 * Fetch a single order with full details
 */
export default async function handler(req: Request, res: Response) {
  try {
    const orderId = readParam(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        error: message.replace('Validation:', '').trim(),
      });
    }
    return res.status(500).json({
      error: 'Failed to fetch order',
      message,
    });
  }
}
