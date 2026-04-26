import type { Request, Response } from 'express';
import { db } from '../../../db/client';
import { locations, containers, products } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    // Get all locations with container counts grouped by product
    const locationsData = await db
      .select({
        locationId: locations.id,
        locationName: locations.name,
        locationType: locations.type,
        capacity: locations.capacity,
        productId: products.id,
        productName: products.name,
        productType: products.type,
        containerCount: sql<number>`count(${containers.id})`,
        totalVolume: sql<number>`COALESCE(sum(${containers.volume}), 0)`,
      })
      .from(locations)
      .leftJoin(containers, eq(containers.locationId, locations.id))
      .leftJoin(products, eq(containers.productId, products.id))
      .groupBy(
        locations.id,
        locations.name,
        locations.type,
        locations.capacity,
        products.id,
        products.name,
        products.type
      )
      .orderBy(locations.name);

    // Group data by location
    const locationMap = new Map<string, any>();

    locationsData.forEach((row) => {
      if (!locationMap.has(row.locationId)) {
        locationMap.set(row.locationId, {
          id: row.locationId,
          name: row.locationName,
          type: row.locationType,
          capacity: row.capacity,
          products: [],
        });
      }

      const location = locationMap.get(row.locationId);
      
      if (row.productId) {
        location.products.push({
          productId: row.productId,
          productName: row.productName,
          productType: row.productType,
          containerCount: Number(row.containerCount),
          totalVolume: Number(row.totalVolume || 0),
        });
      }
    });

    const result = Array.from(locationMap.values());

    res.json({
      locations: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching canvas locations:', error);
    res.status(500).json({
      error: 'Failed to fetch canvas locations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
