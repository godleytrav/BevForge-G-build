import type { Request, Response } from 'express';
import {
  updateConnectThreadStatus,
  type ConnectThread,
} from '../../../../../lib/connect-store';

export default async function handler(req: Request, res: Response) {
  try {
    const threadIdParam = req.params.threadId;
    const threadId = Array.isArray(threadIdParam) ? threadIdParam[0] : threadIdParam;
    const status = req.body?.status as ConnectThread['status'];

    if (!threadId) {
      return res.status(400).json({
        error: 'threadId is required',
      });
    }

    const updatedThread = await updateConnectThreadStatus(threadId, status);

    if (!updatedThread) {
      return res.status(404).json({
        error: `Thread ${threadId} was not found`,
      });
    }

    res.json({
      thread: updatedThread,
      message: `Thread ${threadId} status updated`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('required') || message.includes('Invalid') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to update CONNECT thread status:', error);
    }

    res.status(statusCode).json({
      error: 'Failed to update CONNECT thread status',
      message,
    });
  }
}
