import { useEffect, useMemo, useState } from 'react';
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

interface LocationRecord {
  siteId: string;
  name: string;
  timezone: string;
  active: boolean;
  addressLine1?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
}

const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'UTC', label: 'UTC' },
];

const normalizeSiteId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9-_]/g, '');

const emptyLocation = (): LocationRecord => ({
  siteId: '',
  name: '',
  timezone: 'America/Los_Angeles',
  active: true,
  addressLine1: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  country: 'USA',
});

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [savedLocations, setSavedLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/os/locations');
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Failed to load locations.');
        }
        const next = (payload.data?.locations ?? []) as LocationRecord[];
        setLocations(next);
        setSavedLocations(next);
        setStatusMessage('');
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Failed to load locations.');
      } finally {
        setLoading(false);
      }
    };

    void loadLocations();
  }, []);

  const hasChanges = JSON.stringify(locations) !== JSON.stringify(savedLocations);

  const saveLocations = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/os/locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save locations.');
      }
      const next = (payload.data?.locations ?? []) as LocationRecord[];
      setLocations(next);
      setSavedLocations(next);
      setStatusMessage('Locations saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save locations.');
    } finally {
      setSaving(false);
    }
  };

  const addLocation = () => {
    setLocations((current) => [...current, emptyLocation()]);
  };

  const duplicateIds = useMemo(() => {
    const counts = new Map<string, number>();
    locations.forEach((location) => {
      const siteId = normalizeSiteId(location.siteId);
      if (!siteId) return;
      counts.set(siteId, (counts.get(siteId) ?? 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([siteId]) => siteId));
  }, [locations]);

  const hasIncompleteLocation = useMemo(
    () =>
      locations.some(
        (location) => normalizeSiteId(location.siteId).length === 0 || String(location.name ?? '').trim().length === 0
      ),
    [locations]
  );

  return (
    <AppShell currentSuite="os" pageTitle="Locations">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="mt-1 text-muted-foreground">
            Commission the production sites OS should recognize across batches, scheduling, reporting, and compliance.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Registry</CardTitle>
            <CardDescription>
              Every OS batch, calendar event, and report should resolve against one of these site profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locations.map((location, index) => {
              const normalizedSiteId = normalizeSiteId(location.siteId);
              const duplicate = normalizedSiteId ? duplicateIds.has(normalizedSiteId) : false;
              return (
                <div key={`${location.siteId || 'new'}-${index}`} className="rounded-lg border border-border/60 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Site ID</Label>
                      <Input
                        value={location.siteId}
                        onChange={(event) =>
                          setLocations((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, siteId: event.target.value } : entry
                            )
                          )
                        }
                        disabled={loading || saving}
                      />
                      {duplicate ? <p className="text-xs text-red-400">Site IDs must be unique.</p> : null}
                    </div>
                    <div className="space-y-1">
                      <Label>Location Name</Label>
                      <Input
                        value={location.name}
                        onChange={(event) =>
                          setLocations((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, name: event.target.value } : entry
                            )
                          )
                        }
                        disabled={loading || saving}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Time Zone</Label>
                      <Select
                        value={location.timezone}
                        onValueChange={(value) =>
                          setLocations((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, timezone: value } : entry
                            )
                          )
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
                    <div className="space-y-1 md:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={location.addressLine1 ?? ''}
                        onChange={(event) =>
                          setLocations((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, addressLine1: event.target.value } : entry
                            )
                          )
                        }
                        disabled={loading || saving}
                      />
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="space-y-1">
                        <Label>Active</Label>
                        <div className="pt-2">
                          <Switch
                            checked={location.active}
                            onCheckedChange={(checked) =>
                              setLocations((current) =>
                                current.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, active: checked } : entry
                                )
                              )
                            }
                            disabled={loading || saving}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setLocations((current) => current.filter((_, entryIndex) => entryIndex !== index))
                        }
                        disabled={loading || saving || locations.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={addLocation} disabled={loading || saving}>
                Add Location
              </Button>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/settings">Back to Settings</Link>
                </Button>
                <Button
                  onClick={() => void saveLocations()}
                  disabled={loading || saving || duplicateIds.size > 0 || hasIncompleteLocation || !hasChanges}
                >
                  Save Locations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">{loading ? 'Loading locations...' : statusMessage}</p>
      </div>
    </AppShell>
  );
}
