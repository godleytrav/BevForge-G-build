import type { Request, Response } from "express";
import { readFlowRuntimeSnapshot } from "../../../lib/flow-runtime-store";

/**
 * GET /api/flow/runtime
 * Returns FLOW runtime snapshot backed by JSON-on-disk commissioning files.
 */
export default async function handler(_req: Request, res: Response) {
  try {
    const snapshot = await readFlowRuntimeSnapshot();

    return res.json({
      success: true,
      data: snapshot,
      boundaries: {
        flow: "FLOW owns tap runtime, pour telemetry, and serving UI.",
        os: "OS remains source of truth for quantities, batches, reservations, and accepted depletion.",
        ops: "OPS remains source of truth for wallet/account/order lifecycle and logistics/compliance.",
      },
    });
  } catch (error) {
    console.error("Failed to load FLOW runtime snapshot:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load FLOW runtime snapshot.",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
