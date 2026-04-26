import type { Request, Response } from 'express';
import { writeDevices } from '../../../../lib/commissioning-store.js';
import type { RegisteredDevice } from '../../../../../features/canvas/types.js';

export default async function handler(req: Request, res: Response) {
  try {
    const devices = req.body as RegisteredDevice[] | undefined;
    if (!Array.isArray(devices)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device payload',
      });
    }

    const saved = await writeDevices(devices);
    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    console.error('Failed to write devices:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to write device registry',
    });
  }
}
