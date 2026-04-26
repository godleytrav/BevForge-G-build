import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearStoredDriverSessionToken,
  createDevDriverSession,
  getStoredDriverSessionToken,
  logoutDriverSession,
  pairDriverDevice,
  setStoredDriverSessionToken,
  validateDriverSession,
  type DriverAuthSessionValidation,
} from '@/lib/driver-auth';

export type DriverSessionStatus = 'checking' | 'unauthenticated' | 'authenticated';

export interface DriverSessionController {
  status: DriverSessionStatus;
  session: DriverAuthSessionValidation | null;
  error: string | null;
  pairingPending: boolean;
  defaultDeviceLabel: string;
  canUseDevBypass: boolean;
  pairWithCode: (pairingCode: string, deviceLabel: string) => Promise<void>;
  signInWithDevBypass: (deviceLabel: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const buildDefaultDeviceLabel = (): string => {
  if (typeof navigator === 'undefined') {
    return 'Driver Device';
  }
  const nav = navigator as { userAgentData?: { platform?: string }; platform?: string };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? 'Mobile';
  return `${platform} Driver`;
};

export function useDriverSession(): DriverSessionController {
  const [status, setStatus] = useState<DriverSessionStatus>('checking');
  const [session, setSession] = useState<DriverAuthSessionValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pairingPending, setPairingPending] = useState(false);
  const defaultDeviceLabel = useMemo(() => buildDefaultDeviceLabel(), []);
  const canUseDevBypass = import.meta.env.DEV;

  useEffect(() => {
    let active = true;

    async function restore() {
      const token = getStoredDriverSessionToken();
      if (!token) {
        if (active) {
          setSession(null);
          setStatus('unauthenticated');
          setError(null);
        }
        return;
      }

      try {
        const validated = await validateDriverSession(token);
        if (!active) {
          return;
        }
        setSession(validated);
        setStatus('authenticated');
        setError(null);
      } catch {
        clearStoredDriverSessionToken();
        if (!active) {
          return;
        }
        setSession(null);
        setStatus('unauthenticated');
        setError('Driver session expired. Pair this device again.');
      }
    }

    void restore();

    return () => {
      active = false;
    };
  }, []);

  const pairWithCode = useCallback(async (pairingCode: string, deviceLabel: string) => {
    setPairingPending(true);
    setError(null);
    try {
      const paired = await pairDriverDevice({
        pairingCode,
        deviceLabel,
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      setStoredDriverSessionToken(paired.sessionToken);
      setSession({
        session: paired.session,
        driver: paired.driver,
        device: paired.device,
      });
      setStatus('authenticated');
    } catch (pairError) {
      setStatus('unauthenticated');
      setSession(null);
      setError(pairError instanceof Error ? pairError.message : 'Failed to pair device.');
    } finally {
      setPairingPending(false);
    }
  }, []);

  const signInWithDevBypass = useCallback(async (deviceLabel: string) => {
    setPairingPending(true);
    setError(null);
    try {
      const paired = await createDevDriverSession({
        deviceLabel,
        driverName: 'Travis Partlow',
        platform: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      setStoredDriverSessionToken(paired.sessionToken);
      setSession({
        session: paired.session,
        driver: paired.driver,
        device: paired.device,
      });
      setStatus('authenticated');
    } catch (pairError) {
      setStatus('unauthenticated');
      setSession(null);
      setError(
        pairError instanceof Error
          ? pairError.message
          : 'Failed to enter OPS Mobile in dev mode.',
      );
    } finally {
      setPairingPending(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = getStoredDriverSessionToken();
    if (token) {
      await logoutDriverSession(token).catch(() => undefined);
    }
    clearStoredDriverSessionToken();
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  return {
    status,
    session,
    error,
    pairingPending,
    defaultDeviceLabel,
    canUseDevBypass,
    pairWithCode,
    signInWithDevBypass,
    signOut,
  };
}
