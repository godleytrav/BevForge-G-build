import type { Request, Response } from 'express';
import {
  updateConnectTaskStatus,
  type ConnectTask,
} from '../../../../../lib/connect-store';

export default async function handler(req: Request, res: Response) {
  try {
    const taskIdParam = req.params.taskId;
    const taskId = Array.isArray(taskIdParam) ? taskIdParam[0] : taskIdParam;
    const status = req.body?.status as ConnectTask['status'];

    if (!taskId) {
      return res.status(400).json({
        error: 'taskId is required',
      });
    }

    const updatedTask = await updateConnectTaskStatus(taskId, status);

    if (!updatedTask) {
      return res.status(404).json({
        error: `Task ${taskId} was not found`,
      });
    }

    res.json({
      task: updatedTask,
      message: `Task ${taskId} status updated`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('required') || message.includes('Invalid') ? 400 : 500;

    if (statusCode === 500) {
      console.error('Failed to update CONNECT task status:', error);
    }

    res.status(statusCode).json({
      error: 'Failed to update CONNECT task status',
      message,
    });
  }
}
