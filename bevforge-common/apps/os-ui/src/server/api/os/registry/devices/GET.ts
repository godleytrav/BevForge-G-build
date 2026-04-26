import type { Request, Response } from 'express';
import { readDevices } from '../../../../lib/commissioning-store.js';

export default async function handler(_req: Request, res: Response) {
  try {
    const devices = await readDevices();
    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    console.error('Failed to read devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read device registry',
    });
  }
}
