import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Use POST to submit account create requests.",
    });
  }

  return res.status(409).json({
    error: "CONNECT account write blocked",
    message:
      "OPS owns account records. CONNECT must reference OPS account IDs and call OPS APIs for account changes.",
  });
}
