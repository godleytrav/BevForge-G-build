import type { Request, Response } from "express";
import {
  updateConnectTimesheetStatus,
  type UpdateConnectTimesheetStatusInput,
} from "../../../../../lib/connect-engagement-store";

export default async function handler(req: Request, res: Response) {
  try {
    const entryIdParam = req.params.entryId;
    const entryId = Array.isArray(entryIdParam)
      ? entryIdParam[0]
      : entryIdParam;
    const payload = req.body as UpdateConnectTimesheetStatusInput;

    if (!entryId) {
      return res.status(400).json({
        error: "entryId is required",
      });
    }

    const entry = await updateConnectTimesheetStatus(entryId, payload);

    if (!entry) {
      return res.status(404).json({
        error: `Timesheet entry ${entryId} was not found`,
      });
    }

    res.json({
      entry,
      message: `Timesheet entry ${entryId} status updated`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to update CONNECT timesheet status:", error);
    }

    res.status(statusCode).json({
      error: "Failed to update CONNECT timesheet status",
      message,
    });
  }
}
