const resolveConfiguredMobileOrigin = (): string | undefined => {
  const configuredOrigin = (
    import.meta as { env?: Record<string, string | undefined> }
  ).env?.VITE_OPS_PUBLIC_MOBILE_ORIGIN;
  if (typeof configuredOrigin === "string" && configuredOrigin.trim().length > 0) {
    return configuredOrigin.trim();
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.origin;
};

export const resolveOpsMobileOrigin = (): string | undefined =>
  resolveConfiguredMobileOrigin();

export const buildOpsMobileLookupLink = (
  identifier: string,
  options?: {
    baseUrl?: string;
    query?: Record<string, string | undefined>;
  },
): string | null => {
  const baseUrl = options?.baseUrl ?? resolveConfiguredMobileOrigin();
  if (!baseUrl || !identifier.trim()) {
    return null;
  }

  const url = new globalThis.URL(
    `/ops/mobile/lookup/${encodeURIComponent(identifier.trim())}`,
    baseUrl,
  );

  Object.entries(options?.query ?? {}).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim().length > 0) {
      url.searchParams.set(key, value.trim());
    }
  });

  return url.toString();
};

export const buildOpsMobileRoutesLink = (
  options?: {
    baseUrl?: string;
    truckId?: string;
    shippingId?: string;
    destination?: string;
  },
): string | null => {
  const baseUrl = options?.baseUrl ?? resolveConfiguredMobileOrigin();
  if (!baseUrl) {
    return null;
  }

  const url = new globalThis.URL("/ops/mobile/routes", baseUrl);
  if (options?.truckId?.trim()) {
    url.searchParams.set("truckId", options.truckId.trim());
  }
  if (options?.shippingId?.trim()) {
    url.searchParams.set("shippingId", options.shippingId.trim());
  }
  if (options?.destination?.trim()) {
    url.searchParams.set("destination", options.destination.trim());
  }
  return url.toString();
};
