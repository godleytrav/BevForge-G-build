import type { Request, Response } from "express";
import { listConnectEmployees } from "../../../lib/connect-store";

export default async function handler(_req: Request, res: Response) {
  try {
    const employees = await listConnectEmployees();

    res.json({
      employees,
      updatedAt: employees[0]?.updatedAt ?? new Date(0).toISOString(),
      boundaries: {
        connect:
          "CONNECT owns employee identity and workforce coordination records.",
      },
    });
  } catch (error) {
    console.error("Failed to load CONNECT employees:", error);
    res.status(500).json({
      error: "Failed to load CONNECT employees",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
