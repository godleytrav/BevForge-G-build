import type { Request, Response } from "express";
import {
  enqueueFlowPourEvent,
  type EnqueueFlowPourEventInput,
  readFlowRuntimeSnapshot,
} from "../../../lib/flow-runtime-store";

/**
 * POST /api/flow/pour-events
 * Enqueues a FLOW pour event with idempotency by eventId.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as EnqueueFlowPourEventInput | undefined;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({
        success: false,
        error: "Request body is required.",
      });
    }

    const result = await enqueueFlowPourEvent(payload);
    const snapshot = await readFlowRuntimeSnapshot();
    const statusCode = result.duplicate ? 200 : 201;

    return res.status(statusCode).json({
      success: true,
      data: result,
      queue: {
        syncStatus: snapshot.queue.syncStatus,
        totalOutbox: snapshot.queue.outbox.length,
      },
      boundaries: {
        os: "OS accepts/rejects depletion; FLOW only emits telemetry events.",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("invalid") || message.includes("must be")
        ? 400
        : 500;

    if (statusCode === 500) {
      console.error("Failed to enqueue FLOW pour event:", error);
    }

    return res.status(statusCode).json({
      success: false,
      error: "Failed to enqueue FLOW pour event.",
      message,
    });
  }
}
