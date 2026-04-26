import { useEffect, useState } from 'react';
import {
  getGoogleApiUsageSnapshot,
  subscribeGoogleApiUsage,
  type GoogleApiUsageSnapshot,
} from './google-api-usage';

export const useGoogleApiUsageSnapshot = (): GoogleApiUsageSnapshot => {
  const [snapshot, setSnapshot] = useState<GoogleApiUsageSnapshot>(() => getGoogleApiUsageSnapshot());

  useEffect(() => {
    return subscribeGoogleApiUsage(setSnapshot);
  }, []);

  return snapshot;
};
