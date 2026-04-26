import type { Request, Response } from "express";
import {
  readFlowRuntimeSnapshot,
  runFlowSyncPass,
  setFlowSyncStatus,
  type FlowSyncStatus,
} from "../../../lib/flow-runtime-store";

interface FlowSyncRequestBody {
  syncStatus?: FlowSyncStatus;
  runPass?: boolean;
}

/**
 * POST /api/flow/sync
 * Updates FLOW sync status and optionally executes one sync pass.
 */
export default async function handler(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as FlowSyncRequestBody;
    const shouldRunPass = body.runPass !== false;

    if (typeof body.syncStatus === "string") {
      await setFlowSyncStatus(body.syncStatus);
    }

    const syncResult = shouldRunPass ? await runFlowSyncPass() : undefined;
    const snapshot = await readFlowRuntimeSnapshot();

    return res.json({
      success: true,
      data: {
        syncResult,
        syncStatus: snapshot.queue.syncStatus,
        queue: {
          totalOutbox: snapshot.queue.outbox.length,
          queued: snapshot.queue.outbox.filter((entry) => entry.queueStatus === "queued").length,
          sent: snapshot.queue.outbox.filter((entry) => entry.queueStatus === "sent").length,
          accepted: snapshot.queue.outbox.filter((entry) => entry.queueStatus === "accepted").length,
          failed: snapshot.queue.outbox.filter((entry) => entry.queueStatus === "failed").length,
        },
      },
      boundaries: {
        os: "OS remains depletion source of truth; FLOW sync submits edge events for acceptance.",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = message.includes("invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to run FLOW sync:", error);
    }

    return res.status(statusCode).json({
      success: false,
      error: "Failed to run FLOW sync.",
      message,
    });
  }
}
