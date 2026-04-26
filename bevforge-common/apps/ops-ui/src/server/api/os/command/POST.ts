import type { Request, Response } from 'express';
import { proxyOsExpressRequest, proxyOsRequest, RequestContext } from "../../../lib/os-proxy";

export const POST = (request: RequestContext) =>
  proxyOsRequest(request, "/api/os/command", "POST");

export default async function handler(req: Request, res: Response) {
  await proxyOsExpressRequest(req, res, '/api/os/command', 'POST');
}
