import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Route, Truck } from 'lucide-react';
import {
  buildRouteSummaries,
  fetchLogisticsOrders,
  formatDate,
  type LogisticsOrder,
  type LogisticsOrderStatus,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

type StopStatus = 'in-progress' | 'ready' | 'complete' | 'backlog';

const getStopStatus = (orders: LogisticsOrder[]): StopStatus => {
  const statuses = new Set(orders.map((order) => order.status));
  if (statuses.has('in-delivery')) {
    return 'in-progress';
  }
  if (statuses.size === 1 && statuses.has('delivered')) {
    return 'complete';
  }
  if (
    statuses.has('approved') ||
    statuses.has('in-packing') ||
    statuses.has('packed') ||
    statuses.has('loaded')
  ) {
    return 'ready';
  }
  return 'backlog';
};

const getOrderBadgeClass = (status: LogisticsOrderStatus): string => {
  switch (status) {
    case 'delivered':
      return 'bg-green-500/20 text-green-300 border-green-500/40';
    case 'cancelled':
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    case 'in-delivery':
    case 'loaded':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'approved':
    case 'in-packing':
    case 'packed':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    default:
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  }
};

const getStopBadgeClass = (status: StopStatus): string => {
  switch (status) {
    case 'in-progress':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'ready':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'complete':
      return 'bg-green-500/20 text-green-300 border-green-500/40';
    default:
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  }
};

export default function OpsLogisticsRouteDetailPage() {
  const { routeId } = useParams();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const nextOrders = await fetchLogisticsOrders();
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const route = useMemo(() => {
    if (!routeId) {
      return undefined;
    }
    return buildRouteSummaries(orders).find((candidate) => candidate.id === routeId);
  }, [orders, routeId]);

  const stops = useMemo(() => {
    if (!route) {
      return [];
    }

    const stopMap = new Map<string, { siteName: string; orders: LogisticsOrder[]; totalValue: number }>();

    route.orders.forEach((order) => {
      const stopKey = order.customerId || order.customerName;
      const existing = stopMap.get(stopKey);
      if (!existing) {
        stopMap.set(stopKey, {
          siteName: order.customerName,
          orders: [order],
          totalValue: order.totalAmount,
        });
        return;
      }

      existing.orders.push(order);
      existing.totalValue += order.totalAmount;
    });

    return Array.from(stopMap.entries())
      .map(([siteId, summary]) => ({
        siteId,
        siteName: summary.siteName,
        orders: summary.orders,
        totalValue: summary.totalValue,
        status: getStopStatus(summary.orders),
      }))
      .sort((a, b) => b.orders.length - a.orders.length);
  }, [route]);

  if (loading) {
    return (
      <AppShell pageTitle="OPS Route Details" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading route details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!route) {
    return (
      <AppShell pageTitle="OPS Route Details" currentSuite="ops">
        <div className="space-y-6">
          <Button variant="outline" asChild>
            <Link to="/ops/logistics/routes" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Routes
            </Link>
          </Button>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle>Route Not Found</CardTitle>
              <CardDescription>
                This route id is not present in the current OPS order grouping.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={`OPS Route — ${route.label}`} currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/routes" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Routes
              </Link>
            </Button>
            <h1 className="mt-3 text-3xl font-bold text-foreground">{route.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{route.id}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/trucks" className="gap-2">
                <Truck className="h-4 w-4" />
                Truck Board
              </Link>
            </Button>
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
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stops</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{route.stopCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{route.orderCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivery Window</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{route.label}</p>
            </CardContent>
          </Card>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4" />
              Route Stops
            </CardTitle>
            <CardDescription>Site-by-site breakdown for this route.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stops.map((stop) => (
                <div key={stop.siteId} className="rounded-lg border border-border/70 bg-background/20 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{stop.siteName}</p>
                      <p className="text-xs text-muted-foreground">{stop.siteId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStopBadgeClass(stop.status)}>
                        {stop.status.replace('-', ' ')}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/ops/logistics/sites/${stop.siteId}`}>Site</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {stop.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/30 px-3 py-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Delivery: {formatDate(order.deliveryDate)}
                          </p>
                        </div>
                        <Badge className={getOrderBadgeClass(order.status)}>
                          {order.status.replace('-', ' ')}
                        </Badge>
                        <p className="text-sm font-medium">${order.totalAmount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-border/60 pt-3 text-right text-sm font-semibold">
                    Stop Total: ${stop.totalValue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" asChild>
          <Link to="/ops/logistics" className="gap-2">
            <Route className="h-4 w-4" />
            Open Logistics Canvas
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
