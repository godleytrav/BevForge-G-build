import type { Request, Response } from 'express';
import { proxyOsExpressRequest, proxyOsRequest, RequestContext } from '../../../../lib/os-proxy';

/**
 * GET /api/os/compliance/feed
 * Proxy pass-through to OS compliance feed endpoint.
 */
export const GET = (request: RequestContext) =>
  proxyOsRequest(request, '/api/os/compliance/feed');

export default async function handler(req: Request, res: Response) {
  await proxyOsExpressRequest(req, res, '/api/os/compliance/feed');
}
