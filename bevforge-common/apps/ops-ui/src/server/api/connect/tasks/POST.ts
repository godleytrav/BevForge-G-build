import type { Request, Response } from 'express';
import {
  createConnectTask,
  type CreateConnectTaskInput,
} from '../../../lib/connect-store';

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as CreateConnectTaskInput;
    const task = await createConnectTask(payload);

    res.status(201).json({
      task,
      message: 'CONNECT task created',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('required') || message.includes('Invalid') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to create CONNECT task:', error);
    }

    res.status(statusCode).json({
      error: 'Failed to create CONNECT task',
      message,
    });
  }
}
