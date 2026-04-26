import type { Request, Response } from 'express';

/**
 * GET /api/inventory/movements
 * Fetch inventory movements for a product
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { product_id } = req.query;

    // Mock data - replace with actual database queries
    const movements = [
      {
        id: 1,
        product_id: parseInt(product_id as string) || 1,
        type: 'in',
        quantity: 20,
        from_location: 'Production',
        to_location: 'Warehouse A',
        date: '2025-12-18T14:30:00Z',
        reference: 'BATCH-2025-003',
        notes: 'Completed batch transfer',
      },
      {
        id: 2,
        product_id: parseInt(product_id as string) || 1,
        type: 'out',
        quantity: 10,
        from_location: 'Warehouse A',
        to_location: 'Truck #3',
        date: '2025-12-19T09:00:00Z',
        reference: 'ORDER-1234',
        notes: 'Delivery to Craft Beer Co.',
      },
      {
        id: 3,
        product_id: parseInt(product_id as string) || 1,
        type: 'adjustment',
        quantity: -2,
        from_location: 'Warehouse A',
        to_location: 'Warehouse A',
        date: '2025-12-19T10:15:00Z',
        reference: 'ADJ-001',
        notes: 'Damaged kegs removed from inventory',
      },
    ];

    res.json(movements);
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory movements',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
