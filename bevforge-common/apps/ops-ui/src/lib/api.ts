/**
 * Centralized API client for BevForge
 * Handles all backend communication with consistent error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

const buildIdempotencyKey = (scope: string): string => {
  const randomUuid = globalThis.crypto?.randomUUID;
  const randomPart =
    typeof randomUuid === 'function'
      ? randomUuid.call(globalThis.crypto)
      : Math.random().toString(36).slice(2, 10);
  return `${scope}-${Date.now().toString(36)}-${randomPart}`;
};

/**
 * Build a request idempotency header for POST/PATCH style actions.
 */
export function createIdempotencyHeaders(scope: string): Record<string, string> {
  return {
    'Idempotency-Key': buildIdempotencyKey(scope),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      throw new ApiError(errorMessage, response.status, errorData);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(errorMessage, response.status);
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text() as T;
}

export async function apiGet<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = path;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url = `${path}?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  return handleResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  data?: unknown,
  options: ApiOptions = {}
): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

export async function apiPatch<T>(
  path: string,
  data?: unknown,
  options: ApiOptions = {}
): Promise<T> {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await fetch(path, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * Check if an API endpoint is implemented
 * Returns true if endpoint exists, false if not implemented
 */
export async function checkEndpoint(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.status !== 404 && response.status !== 501;
  } catch {
    return false;
  }
}
