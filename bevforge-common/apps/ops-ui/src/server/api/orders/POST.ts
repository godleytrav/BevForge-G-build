import type { Request, Response } from 'express';
import { createOrder } from '../../lib/orders-store';

const readIdempotencyKey = (req: Request): string | undefined => {
  const direct = req.headers['idempotency-key'];
  const fallback = req.headers['x-idempotency-key'];
  const raw = direct ?? fallback;
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return typeof raw === 'string' ? raw : undefined;
};

/**
 * POST /api/orders
 * Create a new order
 */
export default async function handler(req: Request, res: Response) {
  try {
    const idempotencyKey = readIdempotencyKey(req);
    const { order, idempotent } = await createOrder(req.body, {
      idempotencyKey,
    });
    return res.status(idempotent ? 200 : 201).json({
      ...order,
      idempotent,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.startsWith('Conflict:')) {
      return res.status(409).json({
        error: message.replace('Conflict:', '').trim(),
      });
    }
    if (message.startsWith('Validation:')) {
      return res.status(400).json({
        error: message.replace('Validation:', '').trim(),
      });
    }
    return res.status(500).json({
      error: 'Failed to create order',
      message,
    });
  }
}
