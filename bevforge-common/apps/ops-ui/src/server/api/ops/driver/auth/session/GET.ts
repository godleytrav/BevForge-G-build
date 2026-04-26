import type { Request, Response } from 'express';
import { validateDriverSessionToken } from '../../../../../lib/driver-auth-store';

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
  if (!auth) {
    return undefined;
  }
  const lower = auth.toLowerCase();
  if (!lower.startsWith('bearer ')) {
    return undefined;
  }
  return auth.slice(7).trim();
};

export default async function handler(req: Request, res: Response) {
  try {
    const sessionToken = readSessionToken(req);
    const session = await validateDriverSessionToken(sessionToken);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized: driver session is missing or expired',
      });
    }
    return res.status(200).json(session);
  } catch (error) {
    console.error('Failed to validate driver session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Failed to validate driver session',
      message,
    });
  }
}
