const DRIVER_SESSION_STORAGE_KEY = 'ops-driver-session-token-v1';

export interface DriverAuthPublicDriver {
  id: string;
  name: string;
  role: 'driver' | 'dispatcher' | 'admin';
  active: boolean;
}

export interface DriverAuthPublicDevice {
  id: string;
  driverId: string;
  label: string;
  platform?: string;
  registeredAt: string;
  lastSeenAt: string;
  revoked: boolean;
}

export interface DriverAuthPublicSession {
  id: string;
  driverId: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
}

export interface DriverAuthSessionValidation {
  session: DriverAuthPublicSession;
  driver: DriverAuthPublicDriver;
  device: DriverAuthPublicDevice;
}

export interface DriverAuthPairResponse extends DriverAuthSessionValidation {
  sessionToken: string;
}

export interface DriverAuthIssuePairingCodeResponse {
  pairingCode: string;
  codeHint: string;
  createdAt: string;
  expiresAt: string;
  driver: DriverAuthPublicDriver;
  warning?: string;
}

const toErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    const message = record.error ?? record.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim();
    }
  }
  return fallback;
};

type FetchResponse = Awaited<ReturnType<typeof globalThis.fetch>>;

const readJson = async (response: FetchResponse): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const readHeaderToken = (sessionToken?: string): Record<string, string> => {
  if (!sessionToken) {
    return {};
  }
  return {
    'x-ops-driver-session': sessionToken,
  };
};

export const getStoredDriverSessionToken = (): string | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  const value = window.localStorage.getItem(DRIVER_SESSION_STORAGE_KEY);
  return value && value.trim().length > 0 ? value : null;
};

export const setStoredDriverSessionToken = (token: string): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(DRIVER_SESSION_STORAGE_KEY, token);
};

export const clearStoredDriverSessionToken = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(DRIVER_SESSION_STORAGE_KEY);
};

export const validateDriverSession = async (
  sessionToken: string
): Promise<DriverAuthSessionValidation> => {
  const response = await globalThis.fetch('/api/ops/driver/auth/session', {
    method: 'GET',
    headers: {
      ...readHeaderToken(sessionToken),
    },
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(payload, 'Driver session is invalid.'));
  }
  return payload as DriverAuthSessionValidation;
};

export const pairDriverDevice = async (input: {
  pairingCode: string;
  deviceLabel: string;
  platform?: string;
  sessionHours?: number;
}): Promise<DriverAuthPairResponse> => {
  const response = await globalThis.fetch('/api/ops/driver/auth/pair', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(payload, 'Failed to pair driver device.'));
  }
  return payload as DriverAuthPairResponse;
};

export const createDevDriverSession = async (input: {
  deviceLabel: string;
  driverId?: string;
  driverName?: string;
  platform?: string;
  sessionHours?: number;
}): Promise<DriverAuthPairResponse> => {
  const response = await globalThis.fetch('/api/ops/driver/auth/dev-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(payload, 'Failed to enter OPS Mobile in dev mode.'));
  }
  return payload as DriverAuthPairResponse;
};

export const logoutDriverSession = async (sessionToken: string): Promise<void> => {
  await globalThis.fetch('/api/ops/driver/auth/logout', {
    method: 'POST',
    headers: {
      ...readHeaderToken(sessionToken),
    },
  });
};

export const issueDriverPairingCode = async (input: {
  adminKey: string;
  driverId: string;
  driverName?: string;
  issuedBy?: string;
  ttlMinutes?: number;
}): Promise<DriverAuthIssuePairingCodeResponse> => {
  const response = await globalThis.fetch('/api/ops/driver/auth/pairing-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ops-admin-key': input.adminKey,
    },
    body: JSON.stringify({
      driverId: input.driverId,
      driverName: input.driverName,
      issuedBy: input.issuedBy,
      ttlMinutes: input.ttlMinutes,
    }),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(payload, 'Failed to issue pairing code.'));
  }
  return payload as DriverAuthIssuePairingCodeResponse;
};
