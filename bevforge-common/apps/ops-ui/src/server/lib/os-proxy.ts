import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

export type RequestContext = Request | { request: Request };

type ProxyOptions = {
  method?: string;
  path: string;
  request: Request;
};

const DEFAULT_OS_BASE_URL = "http://localhost:8080";

const resolveRequest = (input: RequestContext): Request =>
  input instanceof Request ? input : input.request;

const asHeaderValue = (value: string | string[] | undefined): string | null => {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === 'string' ? value : null;
};

const buildProxyOptions = async ({ method, path, request }: ProxyOptions) => {
  const headers = new Headers();
  const authHeader = request.headers.get("Authorization");
  const contentType = request.headers.get("Content-Type");
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? request.headers.get("X-Idempotency-Key");

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const init: RequestInit = {
    method: method ?? request.method,
    headers,
  };

  if (init.method && !["GET", "HEAD"].includes(init.method)) {
    init.body = await request.arrayBuffer();
  }

  const baseUrl = process.env.OS_BASE_URL ?? DEFAULT_OS_BASE_URL;
  const originalUrl = new URL(request.url);
  const targetUrl = new URL(path, baseUrl);
  targetUrl.search = originalUrl.search;

  return { init, targetUrl };
};

const buildExpressProxyOptions = ({
  method,
  path,
  req,
}: {
  method?: string;
  path: string;
  req: ExpressRequest;
}): { init: RequestInit; targetUrl: URL } => {
  const headers = new Headers();
  const authHeader = asHeaderValue(req.headers.authorization);
  const contentType = asHeaderValue(req.headers['content-type']);
  const idempotencyKey =
    asHeaderValue(req.headers['idempotency-key']) ??
    asHeaderValue(req.headers['x-idempotency-key']);

  if (authHeader) {
    headers.set('Authorization', authHeader);
  }
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }

  const init: RequestInit = {
    method: method ?? req.method,
    headers,
  };

  if (init.method && !['GET', 'HEAD'].includes(init.method.toUpperCase())) {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string' || req.body instanceof Buffer) {
        init.body = req.body;
      } else {
        init.body = JSON.stringify(req.body);
      }
    }
  }

  const baseUrl = process.env.OS_BASE_URL ?? DEFAULT_OS_BASE_URL;
  const originalUrl = new URL(req.originalUrl || req.url, 'http://localhost');
  const targetUrl = new URL(path, baseUrl);
  targetUrl.search = originalUrl.search;

  return { init, targetUrl };
};

const pipeFetchResponseToExpress = async (
  response: Response,
  res: ExpressResponse
): Promise<void> => {
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') {
      return;
    }
    res.setHeader(key, value);
  });
  const payload = Buffer.from(await response.arrayBuffer());
  res.status(response.status).send(payload);
};

export const proxyOsRequest = async (
  input: RequestContext,
  path: string,
  method?: string
): Promise<Response> => {
  try {
    const request = resolveRequest(input);
    const { init, targetUrl } = await buildProxyOptions({
      method,
      path,
      request,
    });

    const response = await fetch(targetUrl, init);
    const payload = await response.arrayBuffer();
    const headers = new Headers(response.headers);

    return new Response(payload, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OS backend unavailable";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const proxyOsExpressRequest = async (
  req: ExpressRequest,
  res: ExpressResponse,
  path: string,
  method?: string
): Promise<void> => {
  try {
    const { init, targetUrl } = buildExpressProxyOptions({
      method,
      path,
      req,
    });

    const response = await fetch(targetUrl, init);
    await pipeFetchResponseToExpress(response, res);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'OS backend unavailable';
    if (!res.headersSent) {
      res.status(502).json({ error: message });
    }
  }
};
