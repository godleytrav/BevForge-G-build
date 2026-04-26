import type { Request, Response } from "express";
import { appendOpsMobileSyncedEvent } from "../../../../lib/mobile-event-store.js";

const toStringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export default async function handler(req: Request, res: Response) {
  try {
    const body = toRecord(req.body);
    const payload = toRecord(body.payload);
    const attachmentInput = toRecord(body.attachment);
    const event = await appendOpsMobileSyncedEvent({
      type: toStringValue(body.type) ?? "",
      summary: toStringValue(body.summary) ?? "",
      detail: toStringValue(body.detail),
      routeId: toStringValue(body.routeId),
      stopId: toStringValue(body.stopId),
      siteId: toStringValue(body.siteId),
      accountId: toStringValue(body.accountId),
      truckId: toStringValue(body.truckId),
      payload,
      createdAt: toStringValue(body.createdAt),
      attachment:
        toStringValue(attachmentInput.fileName) &&
        toStringValue(attachmentInput.mimeType) &&
        toStringValue(attachmentInput.dataUrl)
          ? {
              fileName: toStringValue(attachmentInput.fileName) ?? "",
              mimeType: toStringValue(attachmentInput.mimeType) ?? "",
              dataUrl: toStringValue(attachmentInput.dataUrl) ?? "",
            }
          : undefined,
    });

    return res.status(201).json({
      id: event.id,
      syncedAt: event.syncedAt,
      attachment: event.attachment
        ? {
            id: event.attachment.id,
            fileName: event.attachment.fileName,
            mimeType: event.attachment.mimeType,
            sizeBytes: event.attachment.sizeBytes,
          }
        : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = message.startsWith("Validation:") ? 400 : 500;
    if (statusCode === 500) {
      console.error("Failed to sync OPS mobile event:", error);
    }
    return res.status(statusCode).json({
      error:
        statusCode === 400
          ? message.replace("Validation:", "").trim()
          : "Failed to sync OPS mobile event.",
      message: statusCode === 500 ? message : undefined,
    });
  }
}
