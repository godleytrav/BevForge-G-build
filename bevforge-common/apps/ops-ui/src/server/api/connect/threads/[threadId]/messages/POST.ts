import type { Request, Response } from 'express';
import {
  appendConnectThreadMessage,
  type AppendConnectThreadMessageInput,
} from '../../../../../lib/connect-store';

export default async function handler(req: Request, res: Response) {
  try {
    const threadIdParam = req.params.threadId;
    const threadId = Array.isArray(threadIdParam) ? threadIdParam[0] : threadIdParam;
    const payload = req.body as AppendConnectThreadMessageInput;

    if (!threadId) {
      return res.status(400).json({
        error: 'threadId is required',
      });
    }

    const updatedThread = await appendConnectThreadMessage(threadId, payload);

    if (!updatedThread) {
      return res.status(404).json({
        error: `Thread ${threadId} was not found`,
      });
    }

    res.status(201).json({
      thread: updatedThread,
      message: `Message appended to thread ${threadId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('required') || message.includes('Invalid') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to append CONNECT thread message:', error);
    }

    res.status(statusCode).json({
      error: 'Failed to append CONNECT thread message',
      message,
    });
  }
}
