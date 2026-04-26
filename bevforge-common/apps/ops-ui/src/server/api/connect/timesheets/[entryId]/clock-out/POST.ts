import type { Request, Response } from "express";
import {
  clockOutConnectTimesheetEntry,
  type ClockOutConnectTimesheetEntryInput,
} from "../../../../../lib/connect-engagement-store";

export default async function handler(req: Request, res: Response) {
  try {
    const entryIdParam = req.params.entryId;
    const entryId = Array.isArray(entryIdParam)
      ? entryIdParam[0]
      : entryIdParam;
    const payload = req.body as ClockOutConnectTimesheetEntryInput;

    if (!entryId) {
      return res.status(400).json({
        error: "entryId is required",
      });
    }

    const entry = await clockOutConnectTimesheetEntry(entryId, payload);

    if (!entry) {
      return res.status(404).json({
        error: `Timesheet entry ${entryId} was not found`,
      });
    }

    res.status(201).json({
      entry,
      message: `Timesheet entry ${entryId} clocked out`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to clock out CONNECT timesheet entry:", error);
    }

    res.status(statusCode).json({
      error: "Failed to clock out CONNECT timesheet entry",
      message,
    });
  }
}
