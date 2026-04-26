import type { Request, Response } from 'express';

/**
 * GET /api/batches
 * Fetch all production batches
 * 
 * NOTE: Batches are created during production and linked to products.
 * This endpoint returns an empty array until production batches are created.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    // TODO: Connect to database when batch production is implemented
    // For now, return empty array (no batches created yet)
    const batches: any[] = [];

    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batches',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
