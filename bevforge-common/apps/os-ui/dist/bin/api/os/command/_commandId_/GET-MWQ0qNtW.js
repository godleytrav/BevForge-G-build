import { d as db, c as commandLog } from '../../../../index-BiQ9ukMS.js';
import { eq } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { commandId } = req.params;
    if (!commandId) {
      return res.status(400).json({
        error: "Invalid request",
        message: "commandId is required"
      });
    }
    const [command] = await db.select().from(commandLog).where(eq(commandLog.commandId, commandId));
    if (!command) {
      return res.status(404).json({
        error: "Command not found",
        message: `No command found with id ${commandId}`
      });
    }
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
      errorMessage: command.errorMessage
    });
  } catch (error) {
    console.error("Error fetching command:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
