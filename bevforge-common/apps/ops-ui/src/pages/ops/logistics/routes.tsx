import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Calendar, Route, Truck } from 'lucide-react';
import {
  buildRouteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  getTruckPlanningPreferences,
  type LogisticsOrder,
  type LogisticsTruckProfile,
  type TruckPlanningPreference,
} from './data';
import {
  buildRouteLiveSummary,
  buildRouteStopSummaries,
  resetRouteStopOrder,
  saveRouteStopOrder,
} from './route-status';
import { GeoMapSurface, type GeoMarker, type GeoPolyline } from '../geo/GeoMapSurface';
import { resolveGeoPoint } from '../geo/map-data';
import { useGoogleApiUsageSnapshot } from '../geo/use-google-api-usage';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

export default function OpsLogisticsRoutesPage() {
  const googleApiUsage = useGoogleApiUsageSnapshot();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [planningPreferences, setPlanningPreferences] = useState<TruckPlanningPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('none');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | undefined>(undefined);
  const [stopOrderVersion, setStopOrderVersion] = useState(0);

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

  const routes = useMemo(() => buildRouteSummaries(orders), [orders]);

  const assignments = useMemo(() => {
    return buildTruckAssignments(routes, fleet, planningPreferences);
  }, [routes, fleet, planningPreferences]);

  useEffect(() => {
    if (routes.length === 0) {
      setSelectedRouteId('none');
      return;
    }

    if (selectedRouteId === 'none' || !routes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  const selectedRoute = useMemo(() => {
    if (selectedRouteId === 'none') {
      return undefined;
    }
    return routes.find((route) => route.id === selectedRouteId);
  }, [routes, selectedRouteId]);

  const selectedStops = useMemo(() => {
    if (!selectedRoute) {
      return [];
    }
    return buildRouteStopSummaries(selectedRoute, assignments);
  }, [selectedRoute, assignments, stopOrderVersion]);

  const selectedRouteLive = useMemo(() => {
    if (!selectedRoute) {
      return null;
    }
    return buildRouteLiveSummary(selectedRoute, assignments);
  }, [selectedRoute, assignments, stopOrderVersion]);

  const mapMarkers = useMemo<GeoMarker[]>(() => {
    if (!selectedRoute) {
      return [];
    }

    const stopMarkers: GeoMarker[] = selectedStops.map((stop) => ({
      id: `stop-${stop.id}`,
      type: 'delivery-stop',
      title: stop.siteName,
      subtitle:
        stop.status === 'current'
          ? 'Current stop'
          : stop.status === 'completed'
            ? 'Completed stop'
            : stop.stopsAhead >= 0
              ? `${stop.stopsAhead} stops ahead`
              : 'Planned stop',
      status: stop.status,
      point: resolveGeoPoint({
        idSeed: stop.siteId,
        name: stop.siteName,
      }),
    }));

    const currentStop =
      selectedStops.find((stop) => stop.status === 'current') ?? selectedStops.find((stop) => stop.orderIndex === 0);

    const truckMarker: GeoMarker[] =
      currentStop && selectedRouteLive?.truckId
        ? [
            {
              id: `truck-${selectedRouteLive.truckId}`,
              type: 'truck',
              title: selectedRouteLive.truckName || selectedRouteLive.truckId,
              subtitle: selectedRouteLive.routeActive ? 'In route' : 'Assigned',
              status: selectedRouteLive.routeActive ? 'active' : 'assigned',
              point: resolveGeoPoint({
                idSeed: `truck-${selectedRouteLive.truckId}`,
                name: currentStop.siteName,
              }),
            },
          ]
        : [];

    return [...stopMarkers, ...truckMarker];
  }, [selectedRoute, selectedStops, selectedRouteLive]);

  const mapPolyline = useMemo<GeoPolyline[]>(() => {
    if (!selectedRoute || selectedStops.length < 2) {
      return [];
    }
    return [
      {
        id: `route-line-${selectedRoute.id}`,
        status:
          selectedRoute.status === 'completed'
            ? 'completed'
            : selectedRoute.status === 'in-progress'
              ? 'active'
              : 'planned',
        points: selectedStops.map((stop) =>
          resolveGeoPoint({
            idSeed: stop.siteId,
            name: stop.siteName,
          })
        ),
      },
    ];
  }, [selectedRoute, selectedStops]);

  useEffect(() => {
    if (mapMarkers.length === 0) {
      setSelectedMarkerId(undefined);
      return;
    }
    if (!selectedMarkerId || !mapMarkers.some((marker) => marker.id === selectedMarkerId)) {
      setSelectedMarkerId(mapMarkers[0].id);
    }
  }, [mapMarkers, selectedMarkerId]);

  const selectedStopDetail = useMemo(() => {
    if (!selectedMarkerId) {
      return null;
    }
    const stopId = selectedMarkerId.replace(/^stop-/, '');
    return selectedStops.find((stop) => stop.id === stopId) ?? null;
  }, [selectedMarkerId, selectedStops]);

  const moveStop = (index: number, direction: -1 | 1) => {
    if (!selectedRoute) {
      return;
    }

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedStops.length) {
      return;
    }

    const orderedSiteIds = selectedStops.map((stop) => stop.siteId);
    const [moved] = orderedSiteIds.splice(index, 1);
    orderedSiteIds.splice(nextIndex, 0, moved);
    saveRouteStopOrder(selectedRoute.id, orderedSiteIds);
    setStopOrderVersion((value) => value + 1);
  };

  const resetSelectedRouteOrder = () => {
    if (!selectedRoute) {
      return;
    }
    resetRouteStopOrder(selectedRoute.id);
    setStopOrderVersion((value) => value + 1);
  };

  if (loading) {
    return (
      <AppShell pageTitle="OPS Logistics Routes" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading route planner...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Logistics Routes" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Route Planner</h1>
            <p className="mt-1 text-muted-foreground">
              Plan and sequence delivery stops with live truck-progress status.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/trucks">Truck Board</Link>
            </Button>
            <Button asChild>
              <Link to="/ops/logistics">Open Canvas</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {routes.filter((route) => route.status === 'planning').length}
              </p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {routes.filter((route) => route.status === 'in-progress').length}
              </p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {routes.filter((route) => route.status === 'completed').length}
              </p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assigned Trucks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {assignments.filter((assignment) => assignment.routeCount > 0).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {import.meta.env.DEV && (
          <Card style={panelStyle}>
            <CardContent className="pt-4 text-xs text-cyan-100">
              Google API usage (dev): map loads {googleApiUsage.mapScriptLoads} · place search{' '}
              {googleApiUsage.placeSearchCalls} · place details {googleApiUsage.placeDetailsCalls}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2" style={panelStyle}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Route Map Workbench</CardTitle>
                  <CardDescription>Shared map engine with stop order controls.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedRoute?.id ?? 'none'} onValueChange={setSelectedRouteId}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.length === 0 && <SelectItem value="none">No routes</SelectItem>}
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={resetSelectedRouteOrder} disabled={!selectedRoute}>
                    Reset Sequence
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <GeoMapSurface
                markers={mapMarkers}
                polylines={mapPolyline}
                selectedMarkerId={selectedMarkerId}
                onMarkerSelect={setSelectedMarkerId}
                heightClassName="h-[520px]"
              />
              {selectedRouteLive && (
                <div className="rounded-md border border-border/60 bg-background/20 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Live Route Status</p>
                  <p className="mt-1 font-medium">
                    {selectedRouteLive.completedStops}/{selectedRouteLive.totalStops} completed
                    {selectedRouteLive.currentStopName ? ` · Current: ${selectedRouteLive.currentStopName}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Truck: {selectedRouteLive.truckName || 'Unassigned'} ·{' '}
                    {selectedRouteLive.routeActive ? 'Route active' : 'Route not started'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stop Sequence</CardTitle>
              <CardDescription>Drag-style ordering, with up/down sequencing controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="rounded-md border border-border/60 bg-background/20 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{stop.siteName}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.orderCount} orders · ${stop.totalValue.toFixed(2)}
                      </p>
                    </div>
                    <Badge
                      className={
                        stop.status === 'current'
                          ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-100'
                          : stop.status === 'completed'
                            ? 'border-green-500/40 bg-green-500/20 text-green-200'
                            : 'border-amber-500/40 bg-amber-500/20 text-amber-200'
                      }
                    >
                      {stop.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => moveStop(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => moveStop(index, 1)}
                      disabled={index === selectedStops.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {stop.stopsAhead >= 0 ? `${stop.stopsAhead} stops ahead` : 'Completed'}
                    </p>
                  </div>
                </div>
              ))}
              {selectedStops.length === 0 && (
                <p className="text-sm text-muted-foreground">No stops are available for the selected route.</p>
              )}

              {selectedStopDetail && (
                <div className="rounded-md border border-cyan-500/30 bg-cyan-950/25 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-cyan-100">Selected Stop</p>
                  <p className="font-medium text-cyan-50">{selectedStopDetail.siteName}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {selectedStopDetail.status} · Orders: {selectedStopDetail.orderCount}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {routes.map((route) => {
            const live = buildRouteLiveSummary(route, assignments);
            return (
              <Card key={route.id} style={panelStyle}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Route className="h-4 w-4" />
                        {route.label}
                      </CardTitle>
                      <CardDescription>{route.id}</CardDescription>
                    </div>
                    <Badge
                      className={
                        route.status === 'in-progress'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : route.status === 'completed'
                            ? 'bg-green-500/20 text-green-300 border-green-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }
                    >
                      {route.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-border/70 bg-background/20 p-3 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Stops</p>
                      <p className="text-xl font-semibold">{route.stopCount}</p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/20 p-3 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
                      <p className="text-xl font-semibold">{route.orderCount}</p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/20 p-3 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Date Group</p>
                      <p className="inline-flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-3 w-3" />
                        {route.label}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-border/70 bg-background/20 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Live Progress</p>
                    <p className="mt-1 font-medium">
                      {live.completedStops}/{live.totalStops} completed
                      {live.currentStopName ? ` · Current: ${live.currentStopName}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Truck: {live.truckName || 'Unassigned'} · {live.routeActive ? 'Route active' : 'Planning'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/ops/logistics/routes/${route.id}`}>View Route Details</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/ops/logistics/trucks" className="gap-1">
                        <Truck className="h-4 w-4" />
                        Assign Truck
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {routes.length === 0 && (
          <Card style={panelStyle}>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No routes are available. Add delivery dates to orders to generate route groups.
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
