import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  Layers,
  MapPin,
  Route,
  ShieldCheck,
  Truck,
  Boxes,
  AlertTriangle,
} from 'lucide-react';
import {
  buildRouteSummaries,
  buildSiteSummaries,
  buildTruckAssignments,
  defaultOsSourceSnapshot,
  fetchLogisticsOrders,
  fetchOsSourceSnapshot,
  type LogisticsOrder,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

export default function OpsLogisticsHubPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [osSnapshot, setOsSnapshot] = useState(defaultOsSourceSnapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [nextOrders, nextSnapshot] = await Promise.all([
        fetchLogisticsOrders(),
        fetchOsSourceSnapshot(),
      ]);

      if (!active) {
        return;
      }

      setOrders(nextOrders);
      setOsSnapshot(nextSnapshot);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const siteSummaries = buildSiteSummaries(orders);
    const routeSummaries = buildRouteSummaries(orders);
    const truckAssignments = buildTruckAssignments(routeSummaries);

    const activeRoutes = routeSummaries.filter((route) => route.status !== 'completed').length;
    const onRouteTrucks = truckAssignments.filter((truck) => truck.status === 'on-route').length;
    const activeDeliveries = orders.filter(
      (order) => order.status !== 'delivered' && order.status !== 'cancelled'
    ).length;

    return {
      sites: siteSummaries,
      routes: routeSummaries,
      trucks: truckAssignments,
      counts: {
        activeRoutes,
        onRouteTrucks,
        activeDeliveries,
      },
    };
  }, [orders]);

  if (loading) {
    return (
      <AppShell pageTitle="OPS Logistics Hub" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading logistics hub...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Logistics Hub" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logistics Hub</h1>
            <p className="mt-1 text-muted-foreground">
              Plan packing, palletizing, routes, and delivery execution from one OPS workspace.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/ops/logistics/canvas">
              <Layers className="h-4 w-4" />
              Open Logistics Canvas
            </Link>
          </Button>
        </div>

        <Card className="border-blue-500/40 bg-blue-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-lg">OS Source-Of-Truth Snapshot</CardTitle>
            </div>
            <CardDescription>
              OPS plans and routing use OS inventory quantities and batch release state as read-only signals.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available Qty (OS)</p>
              <p className="text-2xl font-bold">{osSnapshot.availableQty}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Low Stock (OS)</p>
              <p className="text-2xl font-bold">{osSnapshot.lowStockItems}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ready Lots (OS)</p>
              <p className="text-2xl font-bold">{osSnapshot.readyToReleaseLots}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Released Lots (OS)</p>
              <p className="text-2xl font-bold">{osSnapshot.releasedLots}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.counts.activeDeliveries}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.counts.activeRoutes}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sites With Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.sites.length}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trucks On Route</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.counts.onRouteTrucks}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/ops/logistics/canvas" className="block">
            <Card className="h-full transition-colors hover:bg-accent/10" style={panelStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Canvas Workspace
                </CardTitle>
                <CardDescription>Drag product nodes into pallets and trucks.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Open Canvas <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/ops/logistics/sites" className="block">
            <Card className="h-full transition-colors hover:bg-accent/10" style={panelStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Site Management
                </CardTitle>
                <CardDescription>Track destination history and delivery backlog.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Open Sites <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/ops/logistics/trucks" className="block">
            <Card className="h-full transition-colors hover:bg-accent/10" style={panelStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Truck Board
                </CardTitle>
                <CardDescription>Monitor fleet status, assignments, and manifests.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Open Trucks <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/ops/logistics/routes" className="block">
            <Card className="h-full transition-colors hover:bg-accent/10" style={panelStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Route Planner
                </CardTitle>
                <CardDescription>Review route stop plans and progress by delivery date.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Open Routes <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Top Sites
              </CardTitle>
              <CardDescription>Sites with the largest open delivery workload.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.sites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No site data found from OPS orders.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.sites.slice(0, 4).map((site) => (
                    <Link
                      key={site.id}
                      to={`/ops/logistics/sites/${site.id}`}
                      className="flex items-center justify-between rounded-md border border-border/70 bg-background/20 px-3 py-2 transition-colors hover:bg-accent/10"
                    >
                      <div>
                        <p className="text-sm font-medium">{site.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {site.activeOrderCount} active · {site.deliveredOrderCount} delivered
                        </p>
                      </div>
                      <Badge variant={site.activeOrderCount > 0 ? 'default' : 'secondary'}>
                        {site.activeOrderCount > 0 ? 'Active' : 'Clear'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Route Watch
              </CardTitle>
              <CardDescription>Immediate routes and dispatch status.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.routes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No routes have been generated from orders.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.routes.slice(0, 4).map((route) => (
                    <Link
                      key={route.id}
                      to={`/ops/logistics/routes/${route.id}`}
                      className="flex items-center justify-between rounded-md border border-border/70 bg-background/20 px-3 py-2 transition-colors hover:bg-accent/10"
                    >
                      <div>
                        <p className="text-sm font-medium">{route.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.stopCount} stops · {route.orderCount} orders
                        </p>
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
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
