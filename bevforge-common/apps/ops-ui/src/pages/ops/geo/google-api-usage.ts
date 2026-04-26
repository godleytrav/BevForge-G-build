export interface GoogleApiUsageSnapshot {
  mapScriptLoads: number;
  placeSearchCalls: number;
  placeDetailsCalls: number;
}

type GoogleApiUsageMetric = keyof GoogleApiUsageSnapshot;
type UsageListener = (snapshot: GoogleApiUsageSnapshot) => void;

const GLOBAL_USAGE_KEY = '__BEVFORGE_OPS_GOOGLE_API_USAGE__';
const listeners = new Set<UsageListener>();

const createEmptySnapshot = (): GoogleApiUsageSnapshot => ({
  mapScriptLoads: 0,
  placeSearchCalls: 0,
  placeDetailsCalls: 0,
});

let serverSnapshot = createEmptySnapshot();

interface UsageRoot {
  __BEVFORGE_OPS_GOOGLE_API_USAGE__?: GoogleApiUsageSnapshot;
}

const isBrowser = (): boolean => typeof window !== 'undefined';

const getMutableSnapshot = (): GoogleApiUsageSnapshot => {
  if (isBrowser()) {
    const root = globalThis as UsageRoot;
    if (!root[GLOBAL_USAGE_KEY]) {
      root[GLOBAL_USAGE_KEY] = createEmptySnapshot();
    }
    return root[GLOBAL_USAGE_KEY]!;
  }
  return serverSnapshot;
};

const isDev = (): boolean => {
  try {
    return Boolean(import.meta.env.DEV);
  } catch {
    return false;
  }
};

const cloneSnapshot = (snapshot: GoogleApiUsageSnapshot): GoogleApiUsageSnapshot => ({
  mapScriptLoads: snapshot.mapScriptLoads,
  placeSearchCalls: snapshot.placeSearchCalls,
  placeDetailsCalls: snapshot.placeDetailsCalls,
});

const emitSnapshot = (reason: string): GoogleApiUsageSnapshot => {
  const snapshot = cloneSnapshot(getMutableSnapshot());
  listeners.forEach((listener) => listener(snapshot));

  if (isDev()) {
    console.info(`[OPS Maps API Usage] ${reason}`, snapshot);
  }

  return snapshot;
};

export const trackGoogleApiUsage = (
  metric: GoogleApiUsageMetric,
  reason: string
): GoogleApiUsageSnapshot => {
  const snapshot = getMutableSnapshot();
  snapshot[metric] += 1;
  return emitSnapshot(reason);
};

export const trackGoogleMapScriptLoad = (reason = 'maps-script-load') =>
  trackGoogleApiUsage('mapScriptLoads', reason);

export const trackPlaceSearchCall = (reason = 'places-search') =>
  trackGoogleApiUsage('placeSearchCalls', reason);

export const trackPlaceDetailsCall = (reason = 'place-details') =>
  trackGoogleApiUsage('placeDetailsCalls', reason);

export const getGoogleApiUsageSnapshot = (): GoogleApiUsageSnapshot =>
  cloneSnapshot(getMutableSnapshot());

export const subscribeGoogleApiUsage = (listener: UsageListener): (() => void) => {
  listeners.add(listener);
  listener(getGoogleApiUsageSnapshot());
  return () => {
    listeners.delete(listener);
  };
};

export const resetGoogleApiUsageForTests = (): void => {
  if (isBrowser()) {
    const root = globalThis as UsageRoot;
    root[GLOBAL_USAGE_KEY] = createEmptySnapshot();
  } else {
    serverSnapshot = createEmptySnapshot();
  }
  emitSnapshot('usage-reset');
};
