import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    const { name, location, destination, scheduledDelivery, notes } = req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({
        error: 'Missing required fields: name and location are required',
      });
    }

    // TODO: Replace with actual database insertion
    // For now, return mock data
    const newPallet = {
      id: `pallet-${Date.now()}`,
      qrCode: `QR-${name}`,
      name,
      status: 'staged',
      currentLocation: location,
      locationType: 'warehouse',
      destination: destination || null,
      scheduledDelivery: scheduledDelivery || null,
      notes: notes || null,
      containers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      pallet: newPallet,
    });
  } catch (error) {
    console.error('Error creating pallet:', error);
    res.status(500).json({
      error: 'Failed to create pallet',
    });
  }
}
