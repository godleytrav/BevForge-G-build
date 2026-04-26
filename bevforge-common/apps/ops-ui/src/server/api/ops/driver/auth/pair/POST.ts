import type { Request, Response } from 'express';
import { exchangeDriverPairingCode } from '../../../../../lib/driver-auth-store';

export default async function handler(req: Request, res: Response) {
  try {
    const result = await exchangeDriverPairingCode({
      pairingCode: req.body?.pairingCode,
      deviceLabel: req.body?.deviceLabel,
      platform: req.body?.platform,
      sessionHours: req.body?.sessionHours,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.startsWith('Validation:') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to pair driver device:', error);
    }

    return res.status(statusCode).json({
      error: statusCode === 400 ? message.replace('Validation:', '').trim() : 'Failed to pair driver device',
      message: statusCode === 500 ? message : undefined,
    });
  }
}
