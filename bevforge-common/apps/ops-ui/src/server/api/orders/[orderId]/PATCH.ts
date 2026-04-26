import type { Request, Response } from 'express';
import { updateOrder } from '../../../lib/orders-store';

const readParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
    return value[0];
  }
  return null;
};

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
 * PATCH /api/orders/:orderId
 * Update order details or status
 */
export default async function handler(req: Request, res: Response) {
  try {
    const orderId = readParam(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const idempotencyKey = readIdempotencyKey(req);
    const { order: updatedOrder, idempotent } = await updateOrder(orderId, req.body, {
      idempotencyKey,
    });
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({
      success: true,
      order: updatedOrder,
      idempotent,
      message: `Order ${orderId} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating order:', error);
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
      error: 'Failed to update order',
      message,
    });
  }
}
