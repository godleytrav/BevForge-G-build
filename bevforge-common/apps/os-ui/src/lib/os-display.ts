import { useEffect, useState } from 'react';

export type TemperatureUnit = 'C' | 'F';
export const OS_DISPLAY_SETTINGS_EVENT = 'os:display-settings-changed';

export interface OsDisplaySettings {
  temperatureUnit: TemperatureUnit;
}

export const DEFAULT_OS_DISPLAY_SETTINGS: OsDisplaySettings = {
  temperatureUnit: 'C',
};

export const normalizeTemperatureUnit = (value: unknown): TemperatureUnit =>
  value === 'F' ? 'F' : 'C';

export const convertTemperatureFromC = (
  value: number | undefined,
  unit: TemperatureUnit
): number | undefined => {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return unit === 'F' ? value * (9 / 5) + 32 : value;
};

export const convertTemperatureToC = (
  value: number | undefined,
  unit: TemperatureUnit
): number | undefined => {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return unit === 'F' ? (value - 32) * (5 / 9) : value;
};

export const formatTemperatureValue = (
  value: number | undefined,
  unit: TemperatureUnit,
  digits = 1
): string => {
  const converted = convertTemperatureFromC(value, unit);
  if (converted === undefined) return '--';
  return converted.toFixed(digits);
};

export const formatTemperatureWithUnit = (
  value: number | undefined,
  unit: TemperatureUnit,
  digits = 1
): string => {
  const formatted = formatTemperatureValue(value, unit, digits);
  return formatted === '--' ? '--' : `${formatted} ${unit}`;
};

export const useOsDisplaySettings = (): OsDisplaySettings => {
  const [settings, setSettings] = useState<OsDisplaySettings>(DEFAULT_OS_DISPLAY_SETTINGS);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch('/api/os/settings');
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !mounted) return;
        setSettings({
          temperatureUnit: normalizeTemperatureUnit(payload.data?.temperatureUnit),
        });
      } catch {
        // Keep default display settings if the request fails.
      }
    };

    const handleSettingsChange = (event: Event) => {
      const detail = (event as CustomEvent<Partial<OsDisplaySettings>>).detail;
      if (!mounted || !detail) return;
      setSettings((current) => ({
        ...current,
        temperatureUnit: normalizeTemperatureUnit(detail.temperatureUnit ?? current.temperatureUnit),
      }));
    };

    window.addEventListener(OS_DISPLAY_SETTINGS_EVENT, handleSettingsChange as EventListener);
    void load();
    return () => {
      mounted = false;
      window.removeEventListener(OS_DISPLAY_SETTINGS_EVENT, handleSettingsChange as EventListener);
    };
  }, []);

  return settings;
};
