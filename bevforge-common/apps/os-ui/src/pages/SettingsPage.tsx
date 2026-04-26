import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OS_DISPLAY_SETTINGS_EVENT } from '@/lib/os-display';

type TemperatureUnit = 'C' | 'F';
type TtbOperationsFrequency = 'monthly' | 'quarterly' | 'annual' | 'disabled';
type TtbExciseFrequency = 'quarterly' | 'annual' | 'disabled';
type CdtfaFrequency = 'monthly' | 'disabled';
type DashboardMetricKey =
  | 'temperatureC'
  | 'sg'
  | 'abv'
  | 'brix'
  | 'residualSugarGpl'
  | 'ph'
  | 'apparentAttenuation';

interface ComplianceGuidanceSettings {
  primarySalesChannel: 'direct_to_consumer' | 'mixed' | 'wholesale';
  interstateSalesDefault: boolean;
  retailFoodEstablishmentExemptLikely: boolean;
}

interface ReportingCalendarSettings {
  autoCalendarDeadlines: boolean;
  ttbOperationsFrequency: TtbOperationsFrequency;
  ttbExciseFrequency: TtbExciseFrequency;
  californiaCdtfaFrequency: CdtfaFrequency;
  californiaAbcEnabled: boolean;
  californiaAbcReviewMonth: number;
  californiaAbcReviewDay: number;
}

interface DashboardSettings {
  activeProductionQuickMetrics: DashboardMetricKey[];
  activeProductionGraphMetrics: DashboardMetricKey[];
}

interface SiteSettingsState {
  siteName: string;
  defaultSiteId: string;
  defaultVolumeUnit: string;
  temperatureUnit: TemperatureUnit;
  timezone: string;
  batchPrefix: string;
  requireRecipeBeforeBatch: boolean;
  dashboard: DashboardSettings;
  complianceGuidance: ComplianceGuidanceSettings;
  reportingCalendar: ReportingCalendarSettings;
}

interface LocationRecord {
  siteId: string;
  name: string;
  timezone: string;
  active: boolean;
}

const DEFAULT_SETTINGS: SiteSettingsState = {
  siteName: 'Main Production Site',
  defaultSiteId: 'main',
  defaultVolumeUnit: 'bbl',
  temperatureUnit: 'C',
  timezone: 'America/Los_Angeles',
  batchPrefix: '',
  requireRecipeBeforeBatch: true,
  dashboard: {
    activeProductionQuickMetrics: ['temperatureC', 'sg', 'abv', 'residualSugarGpl'],
    activeProductionGraphMetrics: ['sg', 'temperatureC'],
  },
  complianceGuidance: {
    primarySalesChannel: 'direct_to_consumer',
    interstateSalesDefault: false,
    retailFoodEstablishmentExemptLikely: true,
  },
  reportingCalendar: {
    autoCalendarDeadlines: true,
    ttbOperationsFrequency: 'quarterly',
    ttbExciseFrequency: 'quarterly',
    californiaCdtfaFrequency: 'monthly',
    californiaAbcEnabled: true,
    californiaAbcReviewMonth: 7,
    californiaAbcReviewDay: 31,
  },
};

const DASHBOARD_METRIC_OPTIONS: Array<{ value: DashboardMetricKey; label: string }> = [
  { value: 'temperatureC', label: 'Temperature' },
  { value: 'sg', label: 'Specific Gravity' },
  { value: 'abv', label: 'ABV' },
  { value: 'brix', label: 'Brix' },
  { value: 'residualSugarGpl', label: 'Residual Sugar' },
  { value: 'ph', label: 'pH' },
  { value: 'apparentAttenuation', label: 'Attenuation' },
];

const VOLUME_UNIT_OPTIONS = [
  { value: 'bbl', label: 'barrels (bbl)' },
  { value: 'gal', label: 'gallons (gal)' },
  { value: 'L', label: 'liters (L)' },
  { value: 'mL', label: 'milliliters (mL)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'UTC', label: 'UTC' },
];

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

const normalizeVolumeUnit = (value: unknown): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'bbl' || normalized === 'barrel' || normalized === 'barrels' || normalized === 'bbls') {
    return 'bbl';
  }
  if (normalized === 'gal' || normalized === 'gallon' || normalized === 'gallons' || normalized === 'gals' || normalized === 'g') {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return 'bbl';
};

const normalizeTimezone = (value: unknown): string => {
  const normalized = String(value ?? '').trim();
  return TIMEZONE_OPTIONS.some((option) => option.value === normalized)
    ? normalized
    : 'America/Los_Angeles';
};

const normalizeReportingCalendar = (value: unknown): ReportingCalendarSettings => {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    autoCalendarDeadlines:
      typeof current.autoCalendarDeadlines === 'boolean'
        ? current.autoCalendarDeadlines
        : DEFAULT_SETTINGS.reportingCalendar.autoCalendarDeadlines,
    ttbOperationsFrequency:
      current.ttbOperationsFrequency === 'monthly' ||
      current.ttbOperationsFrequency === 'quarterly' ||
      current.ttbOperationsFrequency === 'annual' ||
      current.ttbOperationsFrequency === 'disabled'
        ? (current.ttbOperationsFrequency as TtbOperationsFrequency)
        : DEFAULT_SETTINGS.reportingCalendar.ttbOperationsFrequency,
    ttbExciseFrequency:
      current.ttbExciseFrequency === 'quarterly' ||
      current.ttbExciseFrequency === 'annual' ||
      current.ttbExciseFrequency === 'disabled'
        ? (current.ttbExciseFrequency as TtbExciseFrequency)
        : DEFAULT_SETTINGS.reportingCalendar.ttbExciseFrequency,
    californiaCdtfaFrequency:
      current.californiaCdtfaFrequency === 'monthly' ||
      current.californiaCdtfaFrequency === 'disabled'
        ? (current.californiaCdtfaFrequency as CdtfaFrequency)
        : DEFAULT_SETTINGS.reportingCalendar.californiaCdtfaFrequency,
    californiaAbcEnabled:
      typeof current.californiaAbcEnabled === 'boolean'
        ? current.californiaAbcEnabled
        : DEFAULT_SETTINGS.reportingCalendar.californiaAbcEnabled,
    californiaAbcReviewMonth: Math.min(
      12,
      Math.max(
        1,
        Number.isFinite(Number(current.californiaAbcReviewMonth))
          ? Math.round(Number(current.californiaAbcReviewMonth))
          : DEFAULT_SETTINGS.reportingCalendar.californiaAbcReviewMonth
      )
    ),
    californiaAbcReviewDay: Math.min(
      31,
      Math.max(
        1,
        Number.isFinite(Number(current.californiaAbcReviewDay))
          ? Math.round(Number(current.californiaAbcReviewDay))
          : DEFAULT_SETTINGS.reportingCalendar.californiaAbcReviewDay
      )
    ),
  };
};

const normalizeComplianceGuidance = (value: unknown): ComplianceGuidanceSettings => {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    primarySalesChannel:
      current.primarySalesChannel === 'mixed' || current.primarySalesChannel === 'wholesale'
        ? (current.primarySalesChannel as ComplianceGuidanceSettings['primarySalesChannel'])
        : 'direct_to_consumer',
    interstateSalesDefault:
      typeof current.interstateSalesDefault === 'boolean'
        ? current.interstateSalesDefault
        : DEFAULT_SETTINGS.complianceGuidance.interstateSalesDefault,
    retailFoodEstablishmentExemptLikely:
      typeof current.retailFoodEstablishmentExemptLikely === 'boolean'
        ? current.retailFoodEstablishmentExemptLikely
        : DEFAULT_SETTINGS.complianceGuidance.retailFoodEstablishmentExemptLikely,
  };
};

const normalizeDashboardMetrics = (
  value: unknown,
  fallback: DashboardMetricKey[],
  maxCount: number
): DashboardMetricKey[] => {
  if (!Array.isArray(value)) return fallback;
  const filtered = value.filter(
    (entry): entry is DashboardMetricKey =>
      typeof entry === 'string' &&
      DASHBOARD_METRIC_OPTIONS.some((option) => option.value === entry)
  );
  const deduped = Array.from(new Set(filtered));
  return deduped.length > 0 ? deduped.slice(0, maxCount) : fallback;
};

const normalizeDashboard = (value: unknown): DashboardSettings => {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    activeProductionQuickMetrics: normalizeDashboardMetrics(
      current.activeProductionQuickMetrics,
      DEFAULT_SETTINGS.dashboard.activeProductionQuickMetrics,
      4
    ),
    activeProductionGraphMetrics: normalizeDashboardMetrics(
      current.activeProductionGraphMetrics,
      DEFAULT_SETTINGS.dashboard.activeProductionGraphMetrics,
      4
    ),
  };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsState>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<SiteSettingsState>(DEFAULT_SETTINGS);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const toggleDashboardMetric = (
    target: 'activeProductionQuickMetrics' | 'activeProductionGraphMetrics',
    metric: DashboardMetricKey,
    maxCount: number
  ) => {
    setSettings((current) => {
      const existing = current.dashboard[target];
      const next = existing.includes(metric)
        ? existing.filter((entry) => entry !== metric)
        : [...existing, metric].slice(-maxCount);
      return {
        ...current,
        dashboard: {
          ...current.dashboard,
          [target]: next.length > 0 ? next : existing,
        },
      };
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const [settingsResponse, locationsResponse] = await Promise.all([
          fetch('/api/os/settings'),
          fetch('/api/os/locations'),
        ]);
        const [payload, locationsPayload] = await Promise.all([
          settingsResponse.json().catch(() => null),
          locationsResponse.json().catch(() => null),
        ]);
        if (!settingsResponse.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Failed to load settings.');
        }
        if (!locationsResponse.ok || !locationsPayload?.success) {
          throw new Error(locationsPayload?.error ?? 'Failed to load locations.');
        }

        const nextSettings: SiteSettingsState = {
          siteName: String(payload.data?.siteName ?? DEFAULT_SETTINGS.siteName),
          defaultSiteId: String(payload.data?.defaultSiteId ?? DEFAULT_SETTINGS.defaultSiteId),
          defaultVolumeUnit: normalizeVolumeUnit(payload.data?.defaultVolumeUnit),
          temperatureUnit: payload.data?.temperatureUnit === 'F' ? 'F' : 'C',
          timezone: normalizeTimezone(payload.data?.timezone),
          batchPrefix: String(payload.data?.batchPrefix ?? ''),
          requireRecipeBeforeBatch:
            typeof payload.data?.requireRecipeBeforeBatch === 'boolean'
              ? payload.data.requireRecipeBeforeBatch
              : DEFAULT_SETTINGS.requireRecipeBeforeBatch,
          dashboard: normalizeDashboard(payload.data?.dashboard),
          complianceGuidance: normalizeComplianceGuidance(payload.data?.complianceGuidance),
          reportingCalendar: normalizeReportingCalendar(payload.data?.reportingCalendar),
        };

        setSettings(nextSettings);
        setSavedSettings(nextSettings);
        setLocations((locationsPayload.data?.locations ?? []) as LocationRecord[]);
        setStatusMessage('');
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/os/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save settings.');
      }

      const nextSettings: SiteSettingsState = {
        siteName: String(payload.data?.siteName ?? settings.siteName),
        defaultSiteId: String(payload.data?.defaultSiteId ?? settings.defaultSiteId),
        defaultVolumeUnit: normalizeVolumeUnit(payload.data?.defaultVolumeUnit ?? settings.defaultVolumeUnit),
        temperatureUnit: payload.data?.temperatureUnit === 'F' ? 'F' : 'C',
        timezone: normalizeTimezone(payload.data?.timezone ?? settings.timezone),
        batchPrefix: String(payload.data?.batchPrefix ?? settings.batchPrefix),
        requireRecipeBeforeBatch:
          typeof payload.data?.requireRecipeBeforeBatch === 'boolean'
            ? payload.data.requireRecipeBeforeBatch
            : settings.requireRecipeBeforeBatch,
        dashboard: normalizeDashboard(payload.data?.dashboard ?? settings.dashboard),
        complianceGuidance: normalizeComplianceGuidance(
          payload.data?.complianceGuidance ?? settings.complianceGuidance
        ),
        reportingCalendar: normalizeReportingCalendar(
          payload.data?.reportingCalendar ?? settings.reportingCalendar
        ),
      };

      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      window.dispatchEvent(
        new CustomEvent(OS_DISPLAY_SETTINGS_EVENT, {
          detail: { temperatureUnit: nextSettings.temperatureUnit },
        })
      );
      setStatusMessage('Settings saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Set the defaults OS should use across batch creation, process records, and reporting.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Site Defaults</CardTitle>
            <CardDescription>
              These values are used as the starting point for new work unless a batch or record overrides them.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                value={settings.siteName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, siteName: event.target.value }))
                }
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-1">
              <Label>Default Site</Label>
              <Select
                value={settings.defaultSiteId}
                onValueChange={(value) =>
                  setSettings((current) => ({ ...current, defaultSiteId: value }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default site" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.siteId} value={location.siteId}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Default Volume Unit</Label>
              <Select
                value={normalizeVolumeUnit(settings.defaultVolumeUnit)}
                onValueChange={(value) =>
                  setSettings((current) => ({ ...current, defaultVolumeUnit: value }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOLUME_UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Temperature Unit</Label>
              <Select
                value={settings.temperatureUnit}
                onValueChange={(value) =>
                  setSettings((current) => ({ ...current, temperatureUnit: value as TemperatureUnit }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">Celsius (C)</SelectItem>
                  <SelectItem value="F">Fahrenheit (F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Time Zone</Label>
              <Select
                value={normalizeTimezone(settings.timezone)}
                onValueChange={(value) =>
                  setSettings((current) => ({ ...current, timezone: value }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="batch-prefix">Batch Prefix</Label>
              <Input
                id="batch-prefix"
                value={settings.batchPrefix}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, batchPrefix: event.target.value }))
                }
                placeholder="GC"
                disabled={loading || saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Guidance</CardTitle>
            <CardDescription>
              These defaults help OS warn along the right path without forcing filings that may not apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Primary Sales Channel</Label>
              <Select
                value={settings.complianceGuidance.primarySalesChannel}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    complianceGuidance: {
                      ...current.complianceGuidance,
                      primarySalesChannel: value as ComplianceGuidanceSettings['primarySalesChannel'],
                    },
                  }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_to_consumer">Direct to Consumer Primary</SelectItem>
                  <SelectItem value="mixed">Mixed Channel</SelectItem>
                  <SelectItem value="wholesale">Wholesale Primary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Default Interstate Path</Label>
              <Select
                value={settings.complianceGuidance.interstateSalesDefault ? 'yes' : 'no'}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    complianceGuidance: {
                      ...current.complianceGuidance,
                      interstateSalesDefault: value === 'yes',
                    },
                  }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default path" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Intrastate by Default</SelectItem>
                  <SelectItem value="yes">Interstate by Default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4 md:col-span-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Retail Food Establishment Exemption Likely</Label>
                <p className="text-sm text-muted-foreground">
                  Use this when the site is primarily direct-to-consumer and OS should treat FDA registration as a review item instead of a default assumption.
                </p>
              </div>
              <Switch
                checked={settings.complianceGuidance.retailFoodEstablishmentExemptLikely}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({
                    ...current,
                    complianceGuidance: {
                      ...current.complianceGuidance,
                      retailFoodEstablishmentExemptLikely: checked,
                    },
                  }))
                }
                disabled={loading || saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Calendar</CardTitle>
            <CardDescription>
              Automatic deadline reminders feed the calendar and notification queue. Adjust these to match your actual filing cadence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border px-3 py-3 md:col-span-2">
              <div className="space-y-1">
                <Label>Automatic deadline reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Creates OS calendar events for reporting due windows and sends them into notifications automatically.
                </p>
              </div>
              <Switch
                checked={settings.reportingCalendar.autoCalendarDeadlines}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      autoCalendarDeadlines: checked,
                    },
                  }))
                }
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-1">
              <Label>TTB Operations</Label>
              <Select
                value={settings.reportingCalendar.ttbOperationsFrequency}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      ttbOperationsFrequency: value as TtbOperationsFrequency,
                    },
                  }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>TTB Excise</Label>
              <Select
                value={settings.reportingCalendar.ttbExciseFrequency}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      ttbExciseFrequency: value as TtbExciseFrequency,
                    },
                  }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>California CDTFA Alcohol Beverage Tax</Label>
              <Select
                value={settings.reportingCalendar.californiaCdtfaFrequency}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      californiaCdtfaFrequency: value as CdtfaFrequency,
                    },
                  }))
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-3">
              <div className="space-y-1">
                <Label>California ABC annual reminder</Label>
                <p className="text-sm text-muted-foreground">
                  Use this for your annual gallonage review window.
                </p>
              </div>
              <Switch
                checked={settings.reportingCalendar.californiaAbcEnabled}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      californiaAbcEnabled: checked,
                    },
                  }))
                }
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-1">
              <Label>ABC Reminder Month</Label>
              <Select
                value={String(settings.reportingCalendar.californiaAbcReviewMonth)}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      californiaAbcReviewMonth: Number(value),
                    },
                  }))
                }
                disabled={loading || saving || !settings.reportingCalendar.californiaAbcEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>ABC Reminder Day</Label>
              <Select
                value={String(settings.reportingCalendar.californiaAbcReviewDay)}
                onValueChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    reportingCalendar: {
                      ...current.reportingCalendar,
                      californiaAbcReviewDay: Number(value),
                    },
                  }))
                }
                disabled={loading || saving || !settings.reportingCalendar.californiaAbcEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Rules</CardTitle>
            <CardDescription>
              Keep batch entry tighter by deciding whether new source batches must start from a saved recipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
              <div className="space-y-1">
                <Label htmlFor="recipe-required" className="text-base">
                  Require recipe before batch
                </Label>
                <p className="text-sm text-muted-foreground">
                  Leave this on to keep source batches anchored to a saved recipe name.
                </p>
              </div>
              <Switch
                id="recipe-required"
                checked={settings.requireRecipeBeforeBatch}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({ ...current, requireRecipeBeforeBatch: checked }))
                }
                disabled={loading || saving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Choose what the Active Production tile shows on the OS dashboard. Keep it to a fast glance here and the full detail on the batch page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div>
                <Label className="text-base">Active Production quick-look metrics</Label>
                <p className="text-sm text-muted-foreground">
                  Pick up to 4 values for the quick metric row.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DASHBOARD_METRIC_OPTIONS.map((option) => {
                  const checked = settings.dashboard.activeProductionQuickMetrics.includes(option.value);
                  return (
                    <label
                      key={`quick-${option.value}`}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDashboardMetric('activeProductionQuickMetrics', option.value, 4)}
                        disabled={loading || saving}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-base">Active Production graph metrics</Label>
                <p className="text-sm text-muted-foreground">
                  Pick one or more metrics for the quick trend view.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DASHBOARD_METRIC_OPTIONS.map((option) => {
                  const checked = settings.dashboard.activeProductionGraphMetrics.includes(option.value);
                  return (
                    <label
                      key={`graph-${option.value}`}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDashboardMetric('activeProductionGraphMetrics', option.value, 4)}
                        disabled={loading || saving}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>
              Manage the commissioned site profiles OS should use across batches, calendar, and reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {locations.length > 0 ? `${locations.length} location profiles commissioned.` : 'No location profiles commissioned yet.'}
            </p>
            <Button asChild variant="outline">
              <Link to="/os/locations">Manage Locations</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading settings...' : statusMessage || ' '}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSettings(savedSettings)}
              disabled={loading || saving || !hasChanges}
            >
              Reset
            </Button>
            <Button onClick={() => void saveSettings()} disabled={loading || saving || !hasChanges}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
