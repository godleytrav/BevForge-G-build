import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { OpsCalendarSyncDevPanel } from '@/components/ops/OpsCalendarSyncDevPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { makeOpsCalendarRecordId, postOpsCalendarEvent } from '@/lib/ops-calendar';
import { issueDriverPairingCode, type DriverAuthIssuePairingCodeResponse } from '@/lib/driver-auth';
import { KeyRound, Plus, Route, Truck } from 'lucide-react';
import {
  buildSiteSummaries,
  buildRouteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  getTruckDispatchSnapshot,
  getTruckPlanningPreferences,
  getTruckRouteProgress,
  getVehicleCapacity,
  saveFleetProfiles,
  saveTruckPlanningPreference,
  type LogisticsOrder,
  type TruckPlanningPreference,
  type LogisticsTruckProfile,
  type LogisticsVehicleType,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

const getStatusBadgeClass = (status: LogisticsTruckProfile['status']): string => {
  switch (status) {
    case 'on-route':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'loading':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'maintenance':
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    default:
      return 'bg-green-500/20 text-green-300 border-green-500/40';
  }
};

export default function OpsLogisticsTrucksPage() {
  const DRIVER_ADMIN_KEY_STORAGE_KEY = 'ops-driver-admin-key-v1';
  const navigate = useNavigate();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [planningPreferences, setPlanningPreferences] = useState<TruckPlanningPreference[]>([]);
  const [targetSearchByTruck, setTargetSearchByTruck] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTruck, setNewTruck] = useState<LogisticsTruckProfile>({
    id: '',
    name: '',
    driver: '',
    homeBase: 'Main Warehouse',
    maxStops: 10,
    vehicleType: 'box-truck',
    status: 'idle',
  });
  const [pairingOpen, setPairingOpen] = useState(false);
  const [pairingTruckId, setPairingTruckId] = useState('');
  const [pairingAdminKey, setPairingAdminKey] = useState('');
  const [pairingResult, setPairingResult] = useState<DriverAuthIssuePairingCodeResponse | null>(null);
  const [pairingPending, setPairingPending] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [nextOrders, nextFleet] = await Promise.all([fetchLogisticsOrders(), fetchFleetProfiles()]);
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setFleet(nextFleet);
      setPlanningPreferences(getTruckPlanningPreferences());
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    const stored = window.localStorage.getItem(DRIVER_ADMIN_KEY_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      setPairingAdminKey(stored);
    }
  }, [DRIVER_ADMIN_KEY_STORAGE_KEY]);

  const routeSummaries = useMemo(() => buildRouteSummaries(orders), [orders]);
  const siteSummaries = useMemo(() => buildSiteSummaries(orders), [orders]);

  const truckAssignments = useMemo(() => {
    return buildTruckAssignments(routeSummaries, fleet, planningPreferences);
  }, [routeSummaries, fleet, planningPreferences]);

  useEffect(() => {
    if (fleet.length === 0) {
      return;
    }
    if (!pairingTruckId || !fleet.some((truck) => truck.id === pairingTruckId)) {
      setPairingTruckId(fleet[0].id);
    }
  }, [fleet, pairingTruckId]);

  const addTruck = async () => {
    const trimmedId = newTruck.id.trim();
    const trimmedName = newTruck.name.trim();
    const trimmedDriver = newTruck.driver.trim();
    const trimmedHomeBase = newTruck.homeBase.trim();

    if (!trimmedId || !trimmedName || !trimmedHomeBase) {
      return;
    }
    if (fleet.some((truck) => truck.id === trimmedId)) {
      return;
    }

    const nextFleet = [
      ...fleet,
      {
        ...newTruck,
        id: trimmedId,
        name: trimmedName,
        driver: trimmedDriver,
        homeBase: trimmedHomeBase,
      },
    ];
    setFleet(nextFleet);
    await saveFleetProfiles(nextFleet);
    setAddOpen(false);
    setNewTruck({
      id: '',
      name: '',
      driver: '',
      homeBase: 'Main Warehouse',
      maxStops: 10,
      vehicleType: 'box-truck',
      status: 'idle',
    });
  };

  const processStage = (
    assignment: (typeof truckAssignments)[number],
    hasReadyPayload: boolean
  ): { percent: number; label: string } => {
    const progress = getTruckRouteProgress(assignment.truck.id);
    if (assignment.status === 'maintenance') {
      return { percent: 0, label: 'Maintenance' };
    }
    if (progress.routeActive || assignment.status === 'on-route') {
      return { percent: 85, label: 'En Route' };
    }
    if (hasReadyPayload) {
      return { percent: 62, label: 'Ready For Delivery' };
    }
    if (assignment.status === 'loading') {
      return { percent: 42, label: 'Loading' };
    }
    return { percent: 12, label: 'Idle' };
  };

  const processToneClass = (percent: number): string => {
    if (percent >= 85) {
      return 'bg-blue-400';
    }
    if (percent >= 60) {
      return 'bg-cyan-300';
    }
    if (percent >= 40) {
      return 'bg-amber-300';
    }
    return 'bg-slate-400';
  };

  const getPlanningValueForTruck = (truckId: string): string => {
    const preference = planningPreferences.find((entry) => entry.truckId === truckId);
    if (!preference || preference.targetType === 'none' || !preference.targetId) {
      return 'none';
    }
    return `${preference.targetType}:${preference.targetId}`;
  };

  const updatePlanning = (truckId: string, value: string) => {
    let preference: TruckPlanningPreference;
    if (value === 'none') {
      preference = { truckId, targetType: 'none' };
    } else if (value.startsWith('route:')) {
      preference = { truckId, targetType: 'route', targetId: value.slice('route:'.length) };
    } else if (value.startsWith('site:')) {
      preference = { truckId, targetType: 'site', targetId: value.slice('site:'.length) };
    } else {
      preference = { truckId, targetType: 'none' };
    }
    const next = saveTruckPlanningPreference(preference);
    setPlanningPreferences(next);

    const truck = fleet.find((entry) => entry.id === truckId);
    const routeLabel =
      preference.targetType === 'route'
        ? routeSummaries.find((route) => route.id === preference.targetId)?.label
        : undefined;
    const site = preference.targetType === 'site'
      ? siteSummaries.find((entry) => entry.id === preference.targetId)
      : undefined;

    if (preference.targetType === 'none') {
      void postOpsCalendarEvent({
        sourceRecordId: makeOpsCalendarRecordId('ops-truck-target-clear', truckId),
        title: `Truck Target Cleared: ${truck?.name ?? truckId}`,
        description: 'Quick route/location target removed from truck planning.',
        type: 'schedule',
        status: 'canceled',
        links: {
          openPath: `/ops/logistics/trucks/${truckId}`,
        },
        metadata: {
          origin: 'ops-logistics-truck-target-cleared',
          truckId,
          truckName: truck?.name,
        },
      });
      return;
    }

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId(
        'ops-truck-target-set',
        truckId,
        preference.targetType,
        preference.targetId
      ),
      siteId: preference.targetType === 'site' ? preference.targetId : undefined,
      title: `Truck Target Updated: ${truck?.name ?? truckId}`,
      description:
        preference.targetType === 'route'
          ? `Assigned route target: ${routeLabel ?? preference.targetId}`
          : `Assigned site target: ${site?.name ?? preference.targetId}`,
      type: 'schedule',
      status: 'planned',
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-truck-target-updated',
        truckId,
        truckName: truck?.name,
        targetType: preference.targetType,
        targetId: preference.targetId,
        routeLabel,
        siteName: site?.name,
      },
    });
  };

  const updateTruckDriver = async (truckId: string, driver: string) => {
    const nextFleet = fleet.map((truck) =>
      truck.id === truckId ? { ...truck, driver } : truck
    );
    setFleet(nextFleet);
    await saveFleetProfiles(nextFleet);
  };

  const issuePairingForTruck = async () => {
    const selectedTruck = fleet.find((entry) => entry.id === pairingTruckId);
    if (!selectedTruck) {
      setPairingError('Select a truck first.');
      return;
    }
    const trimmedAdminKey = pairingAdminKey.trim();
    if (!trimmedAdminKey) {
      setPairingError('Admin key is required.');
      return;
    }

    setPairingPending(true);
    setPairingError(null);
    setPairingResult(null);
    try {
      const derivedDriverId = `driver-${selectedTruck.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const derivedDriverName = selectedTruck.driver.trim() || `${selectedTruck.name} Driver`;
      const result = await issueDriverPairingCode({
        adminKey: trimmedAdminKey,
        driverId: derivedDriverId,
        driverName: derivedDriverName,
        issuedBy: 'ops-truck-board',
      });
      setPairingResult(result);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DRIVER_ADMIN_KEY_STORAGE_KEY, trimmedAdminKey);
      }
    } catch (pairingIssueError) {
      setPairingError(
        pairingIssueError instanceof Error
          ? pairingIssueError.message
          : 'Failed to issue pairing code.'
      );
    } finally {
      setPairingPending(false);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="OPS Logistics Trucks" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading truck board...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Logistics Trucks" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Truck Board</h1>
            <p className="mt-1 text-muted-foreground">
              Fleet readiness and route assignment rollup.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Truck
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPairingResult(null);
                setPairingError(null);
                setPairingOpen(true);
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Issue Driver Pairing
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/driver">Driver App</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics">Logistics Canvas</Link>
            </Button>
            <Button asChild>
              <Link to="/ops/logistics/routes">View Routes</Link>
            </Button>
          </div>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Fleet Truck</DialogTitle>
              <DialogDescription>Create a truck profile for route assignment and canvas loading.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="truck-id">Truck ID</Label>
                <Input
                  id="truck-id"
                  placeholder="TRK-04"
                  value={newTruck.id}
                  onChange={(event) => setNewTruck((prev) => ({ ...prev, id: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="truck-name">Name</Label>
                <Input
                  id="truck-name"
                  placeholder="Downtown Loop 04"
                  value={newTruck.name}
                  onChange={(event) => setNewTruck((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="truck-driver">Driver</Label>
                <Input
                  id="truck-driver"
                  placeholder="Optional"
                  value={newTruck.driver}
                  onChange={(event) => setNewTruck((prev) => ({ ...prev, driver: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="truck-home">Home Base</Label>
                <Input
                  id="truck-home"
                  value={newTruck.homeBase}
                  onChange={(event) => setNewTruck((prev) => ({ ...prev, homeBase: event.target.value }))}
                />
              </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Vehicle Type</Label>
                    <Select
                      value={newTruck.vehicleType}
                      onValueChange={(value: LogisticsVehicleType) =>
                        setNewTruck((prev) => ({ ...prev, vehicleType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="box-truck">Box Truck</SelectItem>
                        <SelectItem value="pickup-truck">Pickup Truck</SelectItem>
                        <SelectItem value="passenger-car">Passenger Car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="truck-max-stops">Max Stops</Label>
                    <Input
                    id="truck-max-stops"
                    type="number"
                    min={1}
                    value={newTruck.maxStops}
                    onChange={(event) =>
                      setNewTruck((prev) => ({
                        ...prev,
                        maxStops: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={newTruck.status}
                    onValueChange={(value: LogisticsTruckProfile['status']) =>
                      setNewTruck((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="loading">Loading</SelectItem>
                      <SelectItem value="on-route">On Route</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTruck}>Save Truck</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={pairingOpen} onOpenChange={setPairingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Driver Pairing Code</DialogTitle>
              <DialogDescription>
                Generate a short-lived pairing code for driver device enrollment. Share the code directly with the driver.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Truck</Label>
                <Select value={pairingTruckId} onValueChange={setPairingTruckId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {fleet.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.name} ({truck.id}) · {truck.driver || 'Driver unassigned'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="driver-admin-key">Admin Key</Label>
                <Input
                  id="driver-admin-key"
                  type="password"
                  value={pairingAdminKey}
                  onChange={(event) => setPairingAdminKey(event.target.value)}
                  placeholder="OPS_DRIVER_ADMIN_KEY"
                  autoComplete="off"
                />
              </div>

              {pairingError && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {pairingError}
                </div>
              )}

              {pairingResult && (
                <div className="rounded-md border border-cyan-500/40 bg-cyan-500/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-cyan-100">Pairing Code</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.2em] text-cyan-50">
                    {pairingResult.pairingCode}
                  </p>
                  <p className="mt-2 text-xs text-cyan-100">
                    Driver: {pairingResult.driver.name} ({pairingResult.driver.id})
                  </p>
                  <p className="text-xs text-cyan-100">
                    Expires: {new Date(pairingResult.expiresAt).toLocaleString()}
                  </p>
                  {pairingResult.warning && (
                    <p className="mt-1 text-xs text-amber-200">{pairingResult.warning}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPairingOpen(false)}>
                Close
              </Button>
              <Button onClick={() => { void issuePairingForTruck(); }} disabled={pairingPending}>
                {pairingPending ? 'Issuing...' : 'Issue Pairing Code'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {fleet.length === 0 && (
          <Card style={panelStyle}>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No trucks configured. Add your first fleet truck to assign routes and load from canvas.
            </CardContent>
          </Card>
        )}

        {fleet.length > 0 && truckAssignments.length === 0 && (
          <Card style={panelStyle}>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Fleet is configured but no assignments were generated for active routes.
            </CardContent>
          </Card>
        )}

        <OpsCalendarSyncDevPanel
          originPrefix="ops-logistics"
          title="Truck Planning Calendar Sync (DEV)"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {truckAssignments.map((assignment) => {
            const dispatchSnapshot = getTruckDispatchSnapshot(assignment.truck.id);
            return (
            <Link key={assignment.truck.id} to={`/ops/logistics/trucks/${assignment.truck.id}`} className="block">
            <Card className="h-full cursor-pointer transition-colors hover:bg-accent/10" style={panelStyle}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-4 w-4" />
                      {assignment.truck.name}
                    </CardTitle>
                    <CardDescription>{assignment.truck.id}</CardDescription>
                  </div>
                  <Badge className={getStatusBadgeClass(assignment.status)}>
                    {dispatchSnapshot?.readiness === 'ready-for-delivery'
                      ? 'ready for delivery'
                      : assignment.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dispatchSnapshot && (
                  <div className="rounded-md border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-cyan-100">Ready Payload</p>
                    <p className="mt-1 font-medium text-cyan-100">
                      {dispatchSnapshot.packagingId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dispatchSnapshot.destination}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Items: {dispatchSnapshot.totalItems} · Weight:{' '}
                      {dispatchSnapshot.totalWeightLb} lb · Volume:{' '}
                      {dispatchSnapshot.totalVolumeFt3} ft^3
                    </p>
                  </div>
                )}

                <div className="rounded-md border border-border/70 bg-background/20 p-3">
                  {(() => {
                    const stage = processStage(assignment, Boolean(dispatchSnapshot));
                    return (
                      <>
                        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Process</span>
                          <span>{stage.label}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded bg-slate-700/70">
                          <div
                            className={`h-full ${processToneClass(stage.percent)}`}
                            style={{ width: `${stage.percent}%` }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div
                  className="rounded-md border border-border/70 bg-background/20 p-3 text-sm"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Quick Route/Location Target
                  </p>
                  <Input
                    value={targetSearchByTruck[assignment.truck.id] ?? ''}
                    onChange={(event) =>
                      setTargetSearchByTruck((prev) => ({
                        ...prev,
                        [assignment.truck.id]: event.target.value,
                      }))
                    }
                    placeholder="Search routes or sites"
                    className="mb-2 h-8"
                  />
                  <Select
                    value={getPlanningValueForTruck(assignment.truck.id)}
                    onValueChange={(value) => updatePlanning(assignment.truck.id, value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No quick target</SelectItem>
                      {routeSummaries
                        .filter((route) =>
                          route.label.toLowerCase().includes((targetSearchByTruck[assignment.truck.id] ?? '').toLowerCase())
                        )
                        .map((route) => (
                          <SelectItem key={`route-${route.id}`} value={`route:${route.id}`}>
                            Route: {route.label}
                          </SelectItem>
                        ))}
                      {siteSummaries
                        .filter((site) =>
                          site.name.toLowerCase().includes((targetSearchByTruck[assignment.truck.id] ?? '').toLowerCase())
                        )
                        .map((site) => (
                          <SelectItem key={`site-${site.id}`} value={`site:${site.id}`}>
                            Site: {site.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border border-border/70 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Routes</p>
                    <p className="text-xl font-semibold">{assignment.routeCount}</p>
                  </div>
                  <div className="rounded-md border border-border/70 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Stops</p>
                    <p className="text-xl font-semibold">{assignment.stopCount}</p>
                  </div>
                  <div className="rounded-md border border-border/70 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
                    <p className="text-xl font-semibold">{assignment.orderCount}</p>
                  </div>
                  <div className="rounded-md border border-border/70 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</p>
                    <p className="text-sm font-medium">{assignment.truck.maxStops} stops max</p>
                  </div>
                </div>

                <div className="rounded-md border border-border/70 bg-background/20 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Driver</p>
                  <div
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <Input
                      value={assignment.truck.driver}
                      onChange={(event) => {
                        void updateTruckDriver(assignment.truck.id, event.target.value);
                      }}
                      placeholder="Optional"
                      className="mt-1 h-8"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Home Base: {assignment.truck.homeBase}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vehicle: {getVehicleCapacity(assignment.truck.vehicleType).label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Payload: {getVehicleCapacity(assignment.truck.vehicleType).maxPayloadLb} lb
                  </p>
                  {assignment.nextRouteLabel && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Route className="h-3 w-3" />
                      Next Route: {assignment.nextRouteLabel}
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Route start/next-stop controls are inside Truck Details.
                </p>
                <div
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/ops/logistics/driver/${assignment.truck.id}`)}
                  >
                    Open Driver App
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Link>
          )})}
        </div>
      </div>
    </AppShell>
  );
}
