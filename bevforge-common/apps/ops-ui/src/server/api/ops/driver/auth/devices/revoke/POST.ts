import type { Request, Response } from 'express';
import {
  isDriverAuthAdminKeyValid,
  revokeDriverTrustedDevice,
} from '../../../../../../lib/driver-auth-store';

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

    const revoked = await revokeDriverTrustedDevice(req.body?.deviceId);
    return res.status(200).json({
      revoked,
    });
  } catch (error) {
    console.error('Failed to revoke trusted driver device:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Failed to revoke trusted device',
      message,
    });
  }
}
