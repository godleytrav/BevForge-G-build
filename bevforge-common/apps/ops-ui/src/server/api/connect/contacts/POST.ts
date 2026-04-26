import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use POST for import-only contact sync endpoints.',
    });
  }

  return res.status(409).json({
    error: 'CONNECT contact write blocked',
    message:
      'OPS owns customer CRM records. Import contacts from OPS CRM mirror and keep CONNECT contacts read-only.',
  });
}
