import type { Request, Response } from "express";
import {
  updateConnectEmployee,
  type UpdateConnectEmployeeInput,
} from "../../../../lib/connect-store";

export default async function handler(req: Request, res: Response) {
  try {
    const employeeIdParam = req.params.employeeId;
    const employeeId = Array.isArray(employeeIdParam)
      ? employeeIdParam[0]
      : employeeIdParam;
    const payload = req.body as UpdateConnectEmployeeInput;

    if (!employeeId) {
      return res.status(400).json({
        error: "employeeId is required",
      });
    }

    const employee = await updateConnectEmployee(employeeId, payload);

    if (!employee) {
      return res.status(404).json({
        error: `Employee ${employeeId} was not found`,
      });
    }

    res.json({
      employee,
      message: `Employee ${employeeId} updated`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      message.includes("required") || message.includes("Invalid") ? 400 : 500;

    if (statusCode === 500) {
      console.error("Failed to update CONNECT employee:", error);
    }

    res.status(statusCode).json({
      error: "Failed to update CONNECT employee",
      message,
    });
  }
}
