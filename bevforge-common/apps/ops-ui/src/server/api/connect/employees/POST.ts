import type { Request, Response } from "express";
import {
  createConnectEmployee,
  type CreateConnectEmployeeInput,
} from "../../../lib/connect-store";

export default async function handler(req: Request, res: Response) {
  try {
    const payload = req.body as CreateConnectEmployeeInput;
    const employee = await createConnectEmployee(payload);

    res.status(201).json({
      employee,
      message: "CONNECT employee created",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to create CONNECT employee:", error);
    }

    res.status(statusCode).json({
      error: "Failed to create CONNECT employee",
      message,
    });
  }
}
