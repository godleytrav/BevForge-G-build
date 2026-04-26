import type { Request, Response } from 'express';
import { db } from '../../../db/client';
import { products } from '../../../db/schema';

export default async function handler(_req: Request, res: Response) {
  try {
    // Fetch all products
    const allProducts = await db.select().from(products);

    // Transform to match expected format
    const productsFormatted = allProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category,
      type: product.type,
      abv: product.abv ? parseFloat(product.abv.toString()) : null,
      ibu: product.ibu || null,
      status: product.status,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    }));

    res.json(productsFormatted);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}
