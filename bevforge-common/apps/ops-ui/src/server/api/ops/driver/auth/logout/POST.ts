import type { Request, Response } from 'express';
import { revokeDriverSessionToken } from '../../../../../lib/driver-auth-store';

const readHeader = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === 'string' ? value : undefined;
};

const readSessionToken = (req: Request): string | undefined => {
  const direct = readHeader(req.headers['x-ops-driver-session']);
  if (direct) {
    return direct;
  }
  const auth = readHeader(req.headers.authorization);
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return undefined;
  }
  return auth.slice(7).trim();
};

export default async function handler(req: Request, res: Response) {
  try {
    const sessionToken = readSessionToken(req);
    if (!sessionToken) {
      return res.status(400).json({
        error: 'Session token is required.',
      });
    }

    await revokeDriverSessionToken(sessionToken);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Failed to revoke driver session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Failed to revoke driver session',
      message,
    });
  }
}
