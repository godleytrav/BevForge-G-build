import { trackPlaceDetailsCall, trackPlaceSearchCall } from './google-api-usage';
import type { GeoPoint } from './map-data';

export type PlaceSearchMode = 'text' | 'nearby';

export interface PlaceSearchRequest {
  mode: PlaceSearchMode;
  query: string;
  center?: GeoPoint;
  radiusMeters?: number;
  explicitUserAction: boolean;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address?: string;
  location?: GeoPoint;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
}

export interface PlaceDetailsRequest {
  placeId: string;
  explicitImportClick: boolean;
}

export interface PlaceDetailsResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location?: GeoPoint;
  phone?: string;
  website?: string;
  types: string[];
}

export const PLACE_SEARCH_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types';

// Field mask intentionally minimal to keep Places billing low.
export const PLACE_DETAILS_FIELD_MASK =
  'displayName,formattedAddress,location,internationalPhoneNumber,websiteUri,types';

const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const GOOGLE_PLACES_NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const GOOGLE_PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

interface GoogleDisplayName {
  text?: string;
}

interface GoogleLocation {
  latitude?: number;
  longitude?: number;
}

interface GooglePlace {
  id?: string;
  displayName?: GoogleDisplayName;
  formattedAddress?: string;
  location?: GoogleLocation;
  rating?: number;
  userRatingCount?: number;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
}

interface GooglePlacesSearchResponse {
  places?: GooglePlace[];
}

interface FetchRequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface FetchResponseLike {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

type FetchLike = (input: string, init?: FetchRequestConfig) => Promise<FetchResponseLike>;

const readGoogleMapsApiKey = (): string => {
  const keyFromVite =
    typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_GOOGLE_MAPS_API_KEY === 'string'
      ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      : '';

  if (keyFromVite.trim().length > 0) {
    return keyFromVite.trim();
  }

  const keyFromProcess = typeof process !== 'undefined' ? process.env.VITE_GOOGLE_MAPS_API_KEY : '';
  if (typeof keyFromProcess === 'string' && keyFromProcess.trim().length > 0) {
    return keyFromProcess.trim();
  }

  throw new Error('VITE_GOOGLE_MAPS_API_KEY is required for Places API requests.');
};

const ensureExplicitAction = (allowed: boolean, action: 'search' | 'details') => {
  if (!allowed) {
    throw new Error(
      action === 'search'
        ? 'Places Search blocked: explicit user submit is required.'
        : 'Place Details blocked: explicit import click is required.'
    );
  }
};

const ensureFetchAvailable = (): FetchLike => {
  const fetchImpl = globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch API is unavailable in this runtime.');
  }
  return fetchImpl.bind(globalThis) as unknown as FetchLike;
};

const toGeoPoint = (value?: GoogleLocation): GeoPoint | undefined => {
  if (!value || typeof value.latitude !== 'number' || typeof value.longitude !== 'number') {
    return undefined;
  }
  return { lat: value.latitude, lng: value.longitude };
};

const toPlaceSearchResult = (place: GooglePlace): PlaceSearchResult | null => {
  const placeId = place.id;
  const name = place.displayName?.text;
  if (!placeId || !name) {
    return null;
  }

  return {
    placeId,
    name,
    address: place.formattedAddress,
    location: toGeoPoint(place.location),
    rating: typeof place.rating === 'number' ? place.rating : undefined,
    userRatingsTotal:
      typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
    types: Array.isArray(place.types) ? place.types.filter((entry): entry is string => typeof entry === 'string') : undefined,
  };
};

const toNearbyType = (query: string): string => {
  const normalized = query.trim().toLowerCase().replace(/[^a-z_ ]+/g, '').replace(/\s+/g, '_');
  if (!normalized) {
    throw new Error('Nearby search requires a place type keyword (for example: restaurant, bar, cafe).');
  }
  return normalized;
};

const buildSearchBody = (request: PlaceSearchRequest): Record<string, unknown> => {
  const radiusMeters = Math.max(200, Math.min(request.radiusMeters ?? 2500, 50000));

  if (request.mode === 'nearby') {
    if (!request.center) {
      throw new Error('Nearby search requires a center point.');
    }
    return {
      includedTypes: [toNearbyType(request.query)],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: request.center.lat,
            longitude: request.center.lng,
          },
          radius: radiusMeters,
        },
      },
    };
  }

  const body: Record<string, unknown> = {
    textQuery: request.query.trim(),
    maxResultCount: 20,
  };

  if (request.center) {
    body.locationBias = {
      circle: {
        center: {
          latitude: request.center.lat,
          longitude: request.center.lng,
        },
        radius: radiusMeters,
      },
    };
  }

  return body;
};

const buildGoogleHeaders = (fieldMask: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': readGoogleMapsApiKey(),
    'X-Goog-FieldMask': fieldMask,
  };
};

const parseJsonResponse = async <T>(response: FetchResponseLike): Promise<T> => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : `HTTP ${response.status}`;
    throw new Error(`Google Places request failed: ${message}`);
  }
  return payload as T;
};

export const searchPlacesExplicit = async (request: PlaceSearchRequest): Promise<PlaceSearchResult[]> => {
  ensureExplicitAction(request.explicitUserAction, 'search');
  const trimmedQuery = request.query.trim();
  if (!trimmedQuery) {
    throw new Error('Places Search requires a keyword.');
  }

  const fetchImpl = ensureFetchAvailable();
  const url =
    request.mode === 'nearby'
      ? GOOGLE_PLACES_NEARBY_SEARCH_URL
      : GOOGLE_PLACES_TEXT_SEARCH_URL;

  trackPlaceSearchCall(`places-search-${request.mode}`);

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: buildGoogleHeaders(PLACE_SEARCH_FIELD_MASK),
    body: JSON.stringify(buildSearchBody(request)),
  });

  const payload = await parseJsonResponse<GooglePlacesSearchResponse>(response);
  const places = Array.isArray(payload.places) ? payload.places : [];

  return places
    .map(toPlaceSearchResult)
    .filter((entry): entry is PlaceSearchResult => entry !== null);
};

export const fetchPlaceDetailsOnImport = async (
  request: PlaceDetailsRequest
): Promise<PlaceDetailsResult> => {
  ensureExplicitAction(request.explicitImportClick, 'details');
  const placeId = request.placeId.trim();
  if (!placeId) {
    throw new Error('Place Details requires a valid placeId.');
  }

  const fetchImpl = ensureFetchAvailable();
  trackPlaceDetailsCall('place-details-import');

  const response = await fetchImpl(
    `${GOOGLE_PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`,
    {
      method: 'GET',
      headers: buildGoogleHeaders(PLACE_DETAILS_FIELD_MASK),
    }
  );

  const payload = await parseJsonResponse<GooglePlace>(response);
  const resolvedName = payload.displayName?.text;
  if (!resolvedName) {
    throw new Error('Place Details did not return displayName.');
  }

  return {
    placeId,
    name: resolvedName,
    formattedAddress: payload.formattedAddress ?? '',
    location: toGeoPoint(payload.location),
    phone: payload.internationalPhoneNumber,
    website: payload.websiteUri,
    types: Array.isArray(payload.types)
      ? payload.types.filter((entry): entry is string => typeof entry === 'string')
      : [],
  };
};
