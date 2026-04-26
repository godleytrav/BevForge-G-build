import type { Request, Response } from "express";
import { listConnectCampaigns } from "../../../lib/connect-engagement-store";

export default async function handler(_req: Request, res: Response) {
  try {
    const campaigns = await listConnectCampaigns();

    res.json({
      campaigns,
      updatedAt: campaigns[0]?.updatedAt ?? new Date(0).toISOString(),
      boundaries: {
        ops: "OPS remains source of truth for CRM and fulfillment records. CONNECT campaigns are communication-only workflows.",
      },
    });
  } catch (error) {
    console.error("Failed to load CONNECT campaigns:", error);
    res.status(500).json({
      error: "Failed to load CONNECT campaigns",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
