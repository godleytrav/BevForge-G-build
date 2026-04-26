import type { Request, Response } from 'express';
import {
  createConnectThread,
  type CreateConnectThreadInput,
} from '../../../lib/connect-store';

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as CreateConnectThreadInput;
    const thread = await createConnectThread(payload);

    res.status(201).json({
      thread,
      message: 'CONNECT thread created',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('required') || message.includes('Invalid') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to create CONNECT thread:', error);
    }

    res.status(statusCode).json({
      error: 'Failed to create CONNECT thread',
      message,
    });
  }
}
