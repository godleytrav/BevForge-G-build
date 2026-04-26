import type { Request, Response } from 'express';
import { proxyOsExpressRequest, proxyOsRequest, RequestContext } from "../../../../lib/os-proxy";

const readParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
    return value[0];
  }
  return null;
};

export const GET = (request: RequestContext) => {
  const resolved = request instanceof Request ? request : request.request;
  const path = new globalThis.URL(resolved.url).pathname;
  return proxyOsRequest(request, path);
};

export default async function handler(req: Request, res: Response) {
  const tileId = readParam(req.params.tileId);
  if (!tileId) {
    res.status(400).json({ error: 'tileId is required.' });
    return;
  }
  const path = `/api/os/tiles/${encodeURIComponent(tileId)}`;
  await proxyOsExpressRequest(req, res, path);
}
