import type { Request, Response } from "express";
import {
  createConnectCampaign,
  type CreateConnectCampaignInput,
} from "../../../lib/connect-engagement-store";

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as CreateConnectCampaignInput;
    const campaign = await createConnectCampaign(payload);

    res.status(201).json({
      campaign,
      message: "CONNECT campaign created",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to create CONNECT campaign:", error);
    }

    res.status(statusCode).json({
      error: "Failed to create CONNECT campaign",
      message,
    });
  }
}
