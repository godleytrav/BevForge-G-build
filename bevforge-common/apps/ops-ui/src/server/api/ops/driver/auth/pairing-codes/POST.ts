import type { Request, Response } from 'express';
import {
  isDriverAuthAdminKeyValid,
  issueDriverPairingCode,
} from '../../../../../lib/driver-auth-store';

const readHeader = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === 'string' ? value : undefined;
};

export default async function handler(req: Request, res: Response) {
  try {
    const adminKey = readHeader(req.headers['x-ops-admin-key']);
    if (!isDriverAuthAdminKeyValid(adminKey)) {
      return res.status(401).json({
        error: 'Unauthorized: invalid admin key',
      });
    }

    const result = await issueDriverPairingCode({
      driverId: req.body?.driverId,
      driverName: req.body?.driverName,
      issuedBy: req.body?.issuedBy,
      ttlMinutes: req.body?.ttlMinutes,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.startsWith('Validation:') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to issue driver pairing code:', error);
    }

    return res.status(statusCode).json({
      error: statusCode === 400 ? message.replace('Validation:', '').trim() : 'Failed to issue pairing code',
      message: statusCode === 500 ? message : undefined,
    });
  }
}
