import type { Request, Response } from "express";
import { readConnectSnapshot } from "../../../lib/connect-store";

export default async function handler(_req: Request, res: Response) {
  try {
    const snapshot = await readConnectSnapshot();

    res.json({
      ...snapshot,
      boundaries: {
        os: "OS remains source of truth for inventory, batches, and reservations.",
        ops: "OPS remains source of truth for CRM, order lifecycle, and logistics execution.",
      },
    });
  } catch (error) {
    console.error("Failed to load CONNECT overview:", error);
    res.status(500).json({
      error: "Failed to load CONNECT overview",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
