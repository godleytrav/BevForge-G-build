import type { Request, Response } from "express";
import { listConnectTimesheetEntries } from "../../../lib/connect-engagement-store";

export default async function handler(_req: Request, res: Response) {
  try {
    const entries = await listConnectTimesheetEntries();

    res.json({
      entries,
      updatedAt: entries[0]?.updatedAt ?? new Date(0).toISOString(),
      boundaries: {
        connect:
          "CONNECT owns employee coordination and timesheet workflows. OPS/OS ledgers are not mutated here.",
      },
    });
  } catch (error) {
    console.error("Failed to load CONNECT timesheets:", error);
    res.status(500).json({
      error: "Failed to load CONNECT timesheets",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
