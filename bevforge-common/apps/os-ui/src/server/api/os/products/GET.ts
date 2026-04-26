import type { Request, Response } from 'express';
import { listProducts } from '../../../lib/product-catalog-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const products = await listProducts();
    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Failed to load product catalog:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load product catalog.',
    });
  }
}
