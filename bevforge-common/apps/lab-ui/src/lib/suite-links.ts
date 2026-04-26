export type SuiteId = 'os' | 'ops' | 'lab' | 'flow' | 'connect';

const SUITE_DEFAULT_PORTS: Record<SuiteId, number> = {
  os: 5181,
  ops: 5182,
  lab: 5175,
  flow: 5182,
  connect: 5182,
};

const SUITE_ENV_URLS: Record<SuiteId, string | undefined> = {
  os: import.meta.env.VITE_OS_SUITE_URL as string | undefined,
  ops: import.meta.env.VITE_OPS_SUITE_URL as string | undefined,
  lab: import.meta.env.VITE_LAB_SUITE_URL as string | undefined,
  flow: import.meta.env.VITE_FLOW_SUITE_URL as string | undefined,
  connect: import.meta.env.VITE_CONNECT_SUITE_URL as string | undefined,
};

const normalizeBaseUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, '');
};

const buildDefaultBaseUrl = (suiteId: SuiteId): string => {
  const port = SUITE_DEFAULT_PORTS[suiteId];
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${port}`;
  }
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
};

export const suiteBaseUrl = (suiteId: SuiteId): string => {
  return normalizeBaseUrl(SUITE_ENV_URLS[suiteId]) ?? buildDefaultBaseUrl(suiteId);
};

export const suiteRouteUrl = (suiteId: SuiteId, routePath: string): string => {
  const baseUrl = suiteBaseUrl(suiteId);
  const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  try {
    const parsed = new URL(baseUrl);
    const basePath = parsed.pathname.replace(/\/+$/, '');
    if (
      basePath.length > 0 &&
      (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`))
    ) {
      return `${parsed.origin}${normalizedPath}`;
    }
  } catch {
    // Keep simple concatenation fallback for non-URL env values.
  }
  return `${baseUrl}${normalizedPath}`;
};
