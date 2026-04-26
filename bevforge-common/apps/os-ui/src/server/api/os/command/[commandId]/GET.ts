import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { commandLog } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * GET /api/os/command/:commandId
 *
 * Query command status and lifecycle
 *
 * Returns:
 * {
 *   "commandId": "uuid",
 *   "status": "queued" | "sent" | "acked" | "succeeded" | "failed" | "blocked",
 *   "endpointId": number,
 *   "tileId": number | null,
 *   "commandType": "write" | "toggle" | "pulse",
 *   "requestedValue": any,
 *   "actualValue": any | null,
 *   "requestedAt": "ISO timestamp",
 *   "sentAt": "ISO timestamp" | null,
 *   "ackedAt": "ISO timestamp" | null,
 *   "completedAt": "ISO timestamp" | null,
 *   "requestedBy": string,
 *   "correlationId": string | null,
 *   "errorMessage": string | null
 * }
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { commandId } = req.params;

    if (!commandId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'commandId is required',
      });
    }

    // Query command log
    const [command] = await db
      .select()
      .from(commandLog)
      .where(eq(commandLog.commandId, commandId));

    if (!command) {
      return res.status(404).json({
        error: 'Command not found',
        message: `No command found with id ${commandId}`,
      });
    }

    // Parse JSON values
    let requestedValue = null;
    let actualValue = null;

    try {
      requestedValue = command.requestedValue ? JSON.parse(command.requestedValue) : null;
    } catch (e) {
      requestedValue = command.requestedValue;
    }

    try {
      actualValue = command.actualValue ? JSON.parse(command.actualValue) : null;
    } catch (e) {
      actualValue = command.actualValue;
    }

    // Return command details
    res.status(200).json({
      commandId: command.commandId,
      status: command.status,
      endpointId: command.endpointId,
      tileId: command.tileId,
      commandType: command.commandType,
      requestedValue,
      actualValue,
      requestedAt: command.requestedAt,
      sentAt: command.sentAt,
      ackedAt: command.ackedAt,
      completedAt: command.completedAt,
      requestedBy: command.requestedBy,
      correlationId: command.correlationId,
      errorMessage: command.errorMessage,
    });
  } catch (error) {
    console.error('Error fetching command:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}
