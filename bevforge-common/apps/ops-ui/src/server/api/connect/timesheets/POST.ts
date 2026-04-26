import type { Request, Response } from "express";
import {
  createConnectTimesheetEntry,
  type CreateConnectTimesheetEntryInput,
} from "../../../lib/connect-engagement-store";

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as CreateConnectTimesheetEntryInput;
    const entry = await createConnectTimesheetEntry(payload);

    res.status(201).json({
      entry,
      message: "CONNECT timesheet clock-in recorded",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to create CONNECT timesheet entry:", error);
    }

    res.status(statusCode).json({
      error: "Failed to create CONNECT timesheet entry",
      message,
    });
  }
}
