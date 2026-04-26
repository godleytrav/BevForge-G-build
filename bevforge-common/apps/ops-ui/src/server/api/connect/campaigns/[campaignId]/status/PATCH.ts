import type { Request, Response } from "express";
import {
  updateConnectCampaignStatus,
  type UpdateConnectCampaignStatusInput,
} from "../../../../../lib/connect-engagement-store";

export default async function handler(req: Request, res: Response) {
  try {
    const campaignIdParam = req.params.campaignId;
    const campaignId = Array.isArray(campaignIdParam)
      ? campaignIdParam[0]
      : campaignIdParam;
    const payload = req.body as UpdateConnectCampaignStatusInput;

    if (!campaignId) {
      return res.status(400).json({
        error: "campaignId is required",
      });
    }

    const campaign = await updateConnectCampaignStatus(campaignId, payload);

    if (!campaign) {
      return res.status(404).json({
        error: `Campaign ${campaignId} was not found`,
      });
    }

    res.json({
      campaign,
      message: `Campaign ${campaignId} status updated`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to update CONNECT campaign status:", error);
    }

    res.status(statusCode).json({
      error: "Failed to update CONNECT campaign status",
      message,
    });
  }
}
