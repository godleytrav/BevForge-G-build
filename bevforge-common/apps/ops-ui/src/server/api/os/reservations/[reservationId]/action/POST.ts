import type { Request, Response } from 'express';
import { proxyOsExpressRequest, proxyOsRequest, RequestContext } from '../../../../../lib/os-proxy';

const readParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
    return value[0];
  }
  return null;
};

const resolveReservationActionPath = (request: RequestContext): string | null => {
  const req = request instanceof Request ? request : request.request;
  const pathname = new globalThis.URL(req.url).pathname;
  const match = pathname.match(/\/api\/os\/reservations\/([^/]+)\/action\/?$/);
  if (!match) {
    return null;
  }
  return `/api/os/reservations/${decodeURIComponent(match[1])}/action`;
};

export const POST = (request: RequestContext) => {
  const resolved = resolveReservationActionPath(request);
  if (!resolved) {
    return new Response(
      JSON.stringify({ error: 'Invalid reservation action path.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return proxyOsRequest(request, resolved, 'POST');
};

export default async function handler(req: Request, res: Response) {
  const reservationId = readParam(req.params.reservationId);
  if (!reservationId) {
    res.status(400).json({ error: 'reservationId is required.' });
    return;
  }
  const resolved = `/api/os/reservations/${encodeURIComponent(reservationId)}/action`;
  await proxyOsExpressRequest(req, res, resolved, 'POST');
}
