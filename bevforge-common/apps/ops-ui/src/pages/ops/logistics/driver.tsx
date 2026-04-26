import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Route, ScanLine, Truck, UserRound } from 'lucide-react';
import {
  buildRouteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  getTruckDispatchSnapshot,
  getTruckRouteProgress,
  type LogisticsOrder,
  type LogisticsTruckProfile,
} from './data';
import { DriverAccessCard } from './driver-access-card';
import { useDriverSession } from './use-driver-session';

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

export default function OpsLogisticsDriverPage() {
  const driverSession = useDriverSession();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (driverSession.status !== 'authenticated') {
      return;
    }

    setLoading(true);
    let active = true;

    async function loadData() {
      const [nextOrders, nextFleet] = await Promise.all([fetchLogisticsOrders(), fetchFleetProfiles()]);
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setFleet(nextFleet);
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [driverSession.status]);

  const routeSummaries = useMemo(() => buildRouteSummaries(orders), [orders]);
  const assignments = useMemo(() => buildTruckAssignments(routeSummaries, fleet), [routeSummaries, fleet]);

  if (driverSession.status === 'checking' || (driverSession.status === 'authenticated' && loading)) {
    return (
      <AppShell pageTitle="OPS Driver App" currentSuite="ops" showNavigationDrawer={false}>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading driver runs...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (driverSession.status !== 'authenticated') {
    return (
      <AppShell pageTitle="OPS Driver App" currentSuite="ops" showNavigationDrawer={false}>
        <div className="mx-auto max-w-xl space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Driver App Access</h1>
          <p className="text-sm text-muted-foreground">
            Device pairing is required before route execution and delivery scanning.
          </p>
          <DriverAccessCard
            defaultDeviceLabel={driverSession.defaultDeviceLabel}
            pairingPending={driverSession.pairingPending}
            error={driverSession.error}
            onPair={driverSession.pairWithCode}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Driver App" currentSuite="ops" showNavigationDrawer={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Driver App</h1>
            <p className="mt-1 text-muted-foreground">
              Select a truck to run stops and scan delivered or returned packages.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in as {driverSession.session?.driver.name} on {driverSession.session?.device.label}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/trucks">Truck Board</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics">Logistics Canvas</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void driverSession.signOut();
              }}
            >
              Sign Out Device
            </Button>
          </div>
        </div>

        {assignments.length === 0 && (
          <Card style={panelStyle}>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No fleet trucks are configured yet. Add trucks from Truck Board to start driver runs.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const progress = getTruckRouteProgress(assignment.truck.id);
            const dispatchSnapshot = getTruckDispatchSnapshot(assignment.truck.id);
            const runStatus = progress.routeActive
              ? 'route active'
              : dispatchSnapshot
                ? 'ready payload'
                : assignment.status.replace('-', ' ');

            return (
              <Link key={assignment.truck.id} to={`/ops/logistics/driver/${assignment.truck.id}`} className="block">
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
                      <Badge className={getStatusBadgeClass(assignment.status)}>{runStatus}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border border-border/70 bg-background/20 p-3 text-sm">
                      <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <UserRound className="h-3 w-3" />
                        Driver
                      </p>
                      <p className="mt-1 font-medium">{assignment.truck.driver || 'Unassigned'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{assignment.truck.homeBase}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-md border border-border/70 bg-background/20 p-2">
                        <p className="text-xs text-muted-foreground">Routes</p>
                        <p className="font-semibold">{assignment.routeCount}</p>
                      </div>
                      <div className="rounded-md border border-border/70 bg-background/20 p-2">
                        <p className="text-xs text-muted-foreground">Stops</p>
                        <p className="font-semibold">{assignment.stopCount}</p>
                      </div>
                      <div className="rounded-md border border-border/70 bg-background/20 p-2">
                        <p className="text-xs text-muted-foreground">Orders</p>
                        <p className="font-semibold">{assignment.orderCount}</p>
                      </div>
                    </div>

                    {dispatchSnapshot && (
                      <div className="rounded-md border border-cyan-500/40 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                        Ready payload: {dispatchSnapshot.packagingId} · {dispatchSnapshot.totalItems} items
                      </div>
                    )}

                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Route className="h-3 w-3" />
                      Open run and scan check-ins
                      <ScanLine className="h-3 w-3" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
