import type { Request, Response } from "express";
import {
  importConnectOpsCrmSnapshot,
  type ImportConnectOpsCrmSnapshotInput,
} from "../../../../lib/connect-store";

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as ImportConnectOpsCrmSnapshotInput;
    const result = await importConnectOpsCrmSnapshot(payload);

    res.status(201).json({
      ...result,
      message: "OPS CRM mirror imported into CONNECT",
      boundaries: {
        ownership:
          "OPS remains source of truth. CONNECT stores this as read-only CRM mirror data for communication workflows.",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") ||
      message.includes("must include") ||
      message.includes("Invalid")
        ? 400
        : 500;

    if (statusCode === 500) {
      console.error("Failed to import OPS CRM mirror into CONNECT:", error);
    }

    res.status(statusCode).json({
      error: "Failed to import OPS CRM mirror into CONNECT",
      message,
    });
  }
}
