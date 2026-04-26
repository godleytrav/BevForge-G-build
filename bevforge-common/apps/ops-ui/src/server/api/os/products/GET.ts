import type { Request, Response } from 'express';
import { proxyOsExpressRequest, proxyOsRequest, RequestContext } from '../../../lib/os-proxy';

export const GET = (request: RequestContext) =>
  proxyOsRequest(request, '/api/os/products');

export default async function handler(req: Request, res: Response) {
  await proxyOsExpressRequest(req, res, '/api/os/products');
}
