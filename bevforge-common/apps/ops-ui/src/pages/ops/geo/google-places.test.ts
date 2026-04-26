import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGoogleApiUsageSnapshot, resetGoogleApiUsageForTests } from './google-api-usage';
import {
  fetchPlaceDetailsOnImport,
  PLACE_DETAILS_FIELD_MASK,
  PLACE_SEARCH_FIELD_MASK,
  searchPlacesExplicit,
} from './google-places';

const mockFetch = vi.fn();
const mockOkJson = (payload: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => payload,
  });

describe('google-places explicit guardrails', () => {
  beforeEach(() => {
    resetGoogleApiUsageForTests();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    process.env.VITE_GOOGLE_MAPS_API_KEY = 'test-key';
  });

  it('blocks Places Search without explicit user action', async () => {
    await expect(
      searchPlacesExplicit({
        mode: 'text',
        query: 'pub',
        explicitUserAction: false,
      })
    ).rejects.toThrow('explicit user submit');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(getGoogleApiUsageSnapshot().placeSearchCalls).toBe(0);
  });

  it('runs Places Text Search only when explicitly requested', async () => {
    mockFetch.mockResolvedValueOnce(
      await mockOkJson({
        places: [
          {
            id: 'place-text-1',
            displayName: { text: 'Farmhaus' },
            formattedAddress: '8230 Auburn Folsom Rd',
            location: { latitude: 38.75, longitude: -121.17 },
            rating: 4.6,
            userRatingCount: 210,
            types: ['restaurant'],
          },
        ],
      })
    );

    const results = await searchPlacesExplicit({
      mode: 'text',
      query: 'restaurant',
      center: { lat: 38.58, lng: -121.49 },
      explicitUserAction: true,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe('https://places.googleapis.com/v1/places:searchText');
    const requestInit = mockFetch.mock.calls[0]?.[1] as {
      method?: string;
      headers?: Record<string, string>;
    };
    expect(requestInit.method).toBe('POST');
    expect(requestInit.headers?.['X-Goog-FieldMask']).toBe(PLACE_SEARCH_FIELD_MASK);
    expect(results[0]).toMatchObject({
      placeId: 'place-text-1',
      name: 'Farmhaus',
    });
    expect(getGoogleApiUsageSnapshot().placeSearchCalls).toBe(1);
  });

  it('runs Places Nearby Search endpoint for nearby mode', async () => {
    mockFetch.mockResolvedValueOnce(await mockOkJson({ places: [] }));

    await searchPlacesExplicit({
      mode: 'nearby',
      query: 'restaurant',
      center: { lat: 38.58, lng: -121.49 },
      explicitUserAction: true,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe('https://places.googleapis.com/v1/places:searchNearby');
    expect(getGoogleApiUsageSnapshot().placeSearchCalls).toBe(1);
  });

  it('blocks Place Details without explicit import click', async () => {
    await expect(
      fetchPlaceDetailsOnImport({
        placeId: 'place-text-1',
        explicitImportClick: false,
      })
    ).rejects.toThrow('explicit import click');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(getGoogleApiUsageSnapshot().placeDetailsCalls).toBe(0);
  });

  it('requests Place Details with the minimal field mask on explicit import', async () => {
    mockFetch.mockResolvedValueOnce(
      await mockOkJson({
        displayName: { text: 'Farmhaus' },
        formattedAddress: '8230 Auburn Folsom Rd, Granite Bay, CA',
        location: { latitude: 38.75, longitude: -121.17 },
        internationalPhoneNumber: '+1 916-772-3276',
        websiteUri: 'https://www.farmhausgb.com/',
        types: ['restaurant'],
      })
    );

    const details = await fetchPlaceDetailsOnImport({
      placeId: 'place-text-1',
      explicitImportClick: true,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, requestInit] = mockFetch.mock.calls[0] as [
      string,
      { method?: string; headers?: Record<string, string> }
    ];
    expect(url).toBe('https://places.googleapis.com/v1/places/place-text-1');
    expect(requestInit.method).toBe('GET');
    expect(requestInit.headers?.['X-Goog-FieldMask']).toBe(PLACE_DETAILS_FIELD_MASK);
    expect(details).toMatchObject({
      placeId: 'place-text-1',
      name: 'Farmhaus',
      website: 'https://www.farmhausgb.com/',
    });
    expect(getGoogleApiUsageSnapshot().placeDetailsCalls).toBe(1);
  });
});
