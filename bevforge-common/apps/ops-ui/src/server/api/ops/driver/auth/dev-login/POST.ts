import type { Request, Response } from 'express';
import {
  createDevDriverSession,
  isDriverDevBypassEnabled,
} from '../../../../../lib/driver-auth-store';

export default async function handler(req: Request, res: Response) {
  try {
    if (!isDriverDevBypassEnabled()) {
      return res.status(403).json({
        error: 'Unauthorized: dev driver bypass is disabled.',
      });
    }

    const result = await createDevDriverSession({
      driverId: req.body?.driverId,
      driverName: req.body?.driverName,
      deviceLabel: req.body?.deviceLabel,
      platform: req.body?.platform,
      sessionHours: req.body?.sessionHours,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message.startsWith('Validation:') || message.startsWith('Unauthorized:')
        ? 400
        : 500;

    if (statusCode === 500) {
      console.error('Failed to create dev driver session:', error);
    }

    return res.status(statusCode).json({
      error:
        statusCode === 400
          ? message.replace('Validation:', '').trim()
          : 'Failed to create dev driver session',
      message: statusCode === 500 ? message : undefined,
    });
  }
}
