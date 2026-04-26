import { beforeEach, describe, expect, it } from 'vitest';
import {
  getGoogleApiUsageSnapshot,
  resetGoogleApiUsageForTests,
  trackGoogleMapScriptLoad,
  trackPlaceDetailsCall,
  trackPlaceSearchCall,
} from './google-api-usage';

describe('google-api-usage', () => {
  beforeEach(() => {
    resetGoogleApiUsageForTests();
  });

  it('tracks individual API counters', () => {
    expect(getGoogleApiUsageSnapshot()).toEqual({
      mapScriptLoads: 0,
      placeSearchCalls: 0,
      placeDetailsCalls: 0,
    });

    trackGoogleMapScriptLoad('test-map-load');
    trackPlaceSearchCall('test-search');
    trackPlaceDetailsCall('test-details');

    expect(getGoogleApiUsageSnapshot()).toEqual({
      mapScriptLoads: 1,
      placeSearchCalls: 1,
      placeDetailsCalls: 1,
    });
  });
});
