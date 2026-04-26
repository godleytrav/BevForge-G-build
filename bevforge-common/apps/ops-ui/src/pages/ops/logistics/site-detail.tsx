import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isKegPackageType, parseOsPackageLots } from '@/lib/os-identity';
import { ArrowLeft, Calendar, MapPin, Package } from 'lucide-react';
import { getOpsClientRecord, loadOpsCrmState } from '../crm/data';
import {
  buildRouteSummaries,
  buildSiteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  formatDate,
  formatDateTime,
  getSiteProfile,
  getTruckRouteProgress,
  getDeliveryScanEvents,
  type LogisticsOrder,
  type LogisticsOrderStatus,
  type LogisticsSiteProfile,
  type LogisticsTruckProfile,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

const getStatusBadgeClass = (status: LogisticsOrderStatus): string => {
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

export default function OpsLogisticsSiteDetailPage() {
  const { siteId } = useParams();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [kegsOnHand, setKegsOnHand] = useState(0);
  const [warehouseKegsOnHand, setWarehouseKegsOnHand] = useState(0);
  const [profile, setProfile] = useState<LogisticsSiteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [nextOrders, nextFleet] = await Promise.all([
        fetchLogisticsOrders(),
        fetchFleetProfiles(),
        loadOpsCrmState(),
      ]);
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setFleet(nextFleet);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const site = useMemo(() => {
    if (!siteId) {
      return undefined;
    }
    const orderSite = buildSiteSummaries(orders).find((candidate) => candidate.id === siteId);
    if (orderSite) {
      return orderSite;
    }

    const client = getOpsClientRecord(siteId);
    if (!client) {
      return undefined;
    }

    return {
      id: client.id,
      name: client.name,
      orderCount: 0,
      activeOrderCount: 0,
      deliveredOrderCount: 0,
      onRouteOrderCount: 0,
      nextDeliveryDate: undefined,
      lastDeliveryDate: undefined,
      orders: [],
    };
  }, [orders, siteId]);

  useEffect(() => {
    if (!site) {
      return;
    }
    setProfile(getSiteProfile(site.id, site.name));
  }, [site]);

  useEffect(() => {
    let active = true;
    if (!siteId) {
      return;
    }

    (async () => {
      try {
        const response = await globalThis.fetch(`/api/os/package-lots?siteId=${encodeURIComponent(siteId)}&status=active`);
        if (!response.ok) {
          if (active) {
            setKegsOnHand(0);
          }
          return;
        }
        const lots = parseOsPackageLots(await response.json());
        const total = lots.reduce<number>((sum, lot) => {
          if (!isKegPackageType(lot.packageType, lot.packageFormatCode)) {
            return sum;
          }
          return sum + lot.availableUnits;
        }, 0);
        if (active) {
          setKegsOnHand(total);
        }
      } catch {
        if (active) {
          setKegsOnHand(0);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [siteId]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await globalThis.fetch('/api/os/package-lots?siteId=main&status=active');
        if (!response.ok) {
          if (active) {
            setWarehouseKegsOnHand(0);
          }
          return;
        }
        const lots = parseOsPackageLots(await response.json());
        const total = lots.reduce<number>((sum, lot) => {
          if (!isKegPackageType(lot.packageType, lot.packageFormatCode)) {
            return sum;
          }
          return sum + lot.availableUnits;
        }, 0);
        if (active) {
          setWarehouseKegsOnHand(total);
        }
      } catch {
        if (active) {
          setWarehouseKegsOnHand(0);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const kegTracking = useMemo(() => {
    if (!site) {
      return {
        atSite: 0,
        onTruck: 0,
        inWarehouse: warehouseKegsOnHand,
        returned: 0,
      };
    }

    const isKegText = (value: string): boolean => {
      const text = value.toLowerCase();
      return (
        text.includes('keg') ||
        text.includes('1/6') ||
        text.includes('1/2') ||
        text.includes('half-keg') ||
        text.includes('full-keg')
      );
    };

    const deliveredKegEvents = getDeliveryScanEvents(undefined, 'delivered').filter(
      (event) => event.stopId === site.id && isKegText(event.scannedId)
    );
    const returnedKegEvents = getDeliveryScanEvents(undefined, 'returned').filter(
      (event) => event.stopId === site.id && isKegText(event.scannedId)
    );

    const onTruck = site.orders
      .filter((order) => order.status === 'loaded' || order.status === 'in-delivery')
      .reduce((sum, order) => {
        const kegQty = order.lineItems.reduce(
          (lineSum, lineItem) => {
            if (isKegPackageType(lineItem.packageType, lineItem.packageFormatCode)) {
              return lineSum + Math.max(0, lineItem.quantity);
            }
            if (!lineItem.packageType && !lineItem.packageFormatCode) {
              const container = lineItem.containerType.toLowerCase();
              const product = lineItem.productName.toLowerCase();
              if (container.includes('keg') || product.includes('keg')) {
                return lineSum + Math.max(0, lineItem.quantity);
              }
            }
            return lineSum;
          },
          0
        );
        return sum + kegQty;
      }, 0);

    return {
      atSite: Math.max(0, deliveredKegEvents.length - returnedKegEvents.length),
      onTruck,
      inWarehouse: warehouseKegsOnHand,
      returned: returnedKegEvents.length,
    };
  }, [site, warehouseKegsOnHand]);

  const liveOps = useMemo(() => {
    if (!site) {
      return null;
    }

    const routes = buildRouteSummaries(orders);
    const assignments = buildTruckAssignments(routes, fleet);
    const siteRoutes = routes.filter((route) =>
      route.orders.some((order) => (order.customerId || order.customerName) === site.id)
    );
    const activeRoute = siteRoutes.find((route) => route.status !== 'completed') ?? null;
    const assignedTruck = activeRoute
      ? assignments.find((assignment) => assignment.routeIds.includes(activeRoute.id))?.truck ?? null
      : null;
    const progress = assignedTruck ? getTruckRouteProgress(assignedTruck.id) : null;

    const stopList: string[] = [];
    if (activeRoute) {
      activeRoute.orders.forEach((order) => {
        const stopId = order.customerId || order.customerName;
        if (!stopList.includes(stopId)) {
          stopList.push(stopId);
        }
      });
    }
    const siteStopIndex = stopList.findIndex((stopId) => stopId === site.id);
    const currentStopIndex = progress?.currentStopIndex ?? 0;
    const stopsAhead =
      progress?.routeActive && siteStopIndex >= 0 ? Math.max(0, siteStopIndex - currentStopIndex) : 0;
    const etaMinutes =
      progress?.routeActive && siteStopIndex >= 0 && siteStopIndex >= currentStopIndex
        ? stopsAhead * 18
        : null;

    const allEvents = getDeliveryScanEvents().filter((event) => event.stopId === site.id);
    const lastCheckIn = allEvents.length > 0 ? allEvents[allEvents.length - 1] : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueOrders = site.orders.filter((order) => {
      if (!order.deliveryDate || order.status === 'delivered' || order.status === 'cancelled') {
        return false;
      }
      const deliveryDate = new Date(order.deliveryDate);
      if (Number.isNaN(deliveryDate.valueOf())) {
        return false;
      }
      return deliveryDate < today;
    }).length;
    const onTruckOrders = site.orders.filter(
      (order) => order.status === 'loaded' || order.status === 'in-delivery'
    ).length;

    return {
      activeRoute,
      assignedTruck,
      stopsAhead,
      etaMinutes,
      lastCheckIn,
      overdueOrders,
      onTruckOrders,
    };
  }, [fleet, orders, site]);

  if (loading) {
    return (
      <AppShell pageTitle="OPS Logistics Site" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading site details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!site) {
    return (
      <AppShell pageTitle="OPS Logistics Site" currentSuite="ops">
        <div className="space-y-6">
          <Button variant="outline" asChild>
            <Link to="/ops/logistics/sites" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sites
            </Link>
          </Button>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle>Site Not Found</CardTitle>
              <CardDescription>
                The selected site id is unavailable in OPS logistics and CRM.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={`OPS Site — ${site.name}`} currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/sites" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sites
              </Link>
            </Button>
            <h1 className="mt-3 text-3xl font-bold text-foreground">{site.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{site.id}</p>
          </div>
          <Button asChild>
            <Link to="/ops/logistics">Open Logistics Canvas</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{site.orderCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{site.activeOrderCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">On Route</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{site.onRouteOrderCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{site.deliveredOrderCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="text-lg">Site Profile</CardTitle>
            <CardDescription>Read-only snapshot. Edit account details in CRM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile ? (
              <p className="text-sm text-muted-foreground">Loading site profile...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact Name</p>
                    <p className="text-sm font-semibold">{profile.contactName || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="text-sm font-semibold">{profile.phone || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="text-sm font-semibold">{profile.email || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery Window</p>
                    <p className="text-sm font-semibold">{profile.deliveryWindow || 'Not set'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Receiving Hours</p>
                    <p className="text-sm font-semibold">{profile.receivingHours || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                    <p className="text-sm font-semibold">{profile.address || 'Not set'}</p>
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-background/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Dock Notes</p>
                  <p className="text-sm font-semibold">{profile.dockNotes || 'None'}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/ops/crm/records/client/${site.id}`}>Edit In CRM</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="text-lg">Live Operations</CardTitle>
            <CardDescription>Dispatch status, route placement, and quick support actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Truck</p>
                <p className="text-sm font-semibold">{liveOps?.assignedTruck?.name ?? 'Unassigned'}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Route</p>
                <p className="text-sm font-semibold">{liveOps?.activeRoute?.label ?? 'Not planned'}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Stops Ahead</p>
                <p className="text-sm font-semibold">{liveOps?.stopsAhead ?? 0}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ETA</p>
                <p className="text-sm font-semibold">
                  {typeof liveOps?.etaMinutes === 'number' ? `${liveOps.etaMinutes} min` : 'Pending'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">On Truck</p>
                <p className="text-sm font-semibold">{liveOps?.onTruckOrders ?? 0}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Overdue Orders</p>
                <p className="text-sm font-semibold">{liveOps?.overdueOrders ?? 0}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Check-In</p>
                <p className="text-sm font-semibold">
                  {liveOps?.lastCheckIn ? formatDateTime(liveOps.lastCheckIn.deliveredAt) : 'No check-ins'}
                </p>
              </div>
            </div>
            <div className="rounded-md border border-border/60 bg-background/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Kegs On Hand (OS)</p>
              <p className="text-sm font-semibold">{kegsOnHand}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                asChild
                disabled={!profile?.phone}
              >
                <a href={profile?.phone ? `tel:${profile.phone}` : '#'}>Call Site</a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                disabled={!profile?.email}
              >
                <a href={profile?.email ? `mailto:${profile.email}` : '#'}>Email Site</a>
              </Button>
              <Button size="sm" variant="outline" asChild disabled={!liveOps?.activeRoute}>
                <Link to={liveOps?.activeRoute ? `/ops/logistics/routes/${liveOps.activeRoute.id}` : '#'}>
                  Open Route
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/ops/orders?customer=${encodeURIComponent(site.name)}`}>Create Order</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/ops/crm/clients/${site.id}`}>Open CRM Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="text-lg">Keg Tracking</CardTitle>
            <CardDescription>OPS event flow + OS inventory snapshot for keg positioning.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">At Site</p>
                <p className="text-sm font-semibold">{kegTracking.atSite}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">On Truck</p>
                <p className="text-sm font-semibold">{kegTracking.onTruck}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">In Warehouse</p>
                <p className="text-sm font-semibold">{kegTracking.inWarehouse}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Returned</p>
                <p className="text-sm font-semibold">{kegTracking.returned}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Returned uses typed OPS return events.</p>
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-4 w-4" />
              Order Timeline
            </CardTitle>
            <CardDescription>
              Delivery schedule and status history for this location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {site.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/20 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{order.orderNumber}</p>
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {order.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Delivery: {formatDate(order.deliveryDate)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Site: {site.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Order Total</p>
                    <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Scanned delivered: {getDeliveryScanEvents(order.id, 'delivered').length}
                    </p>
                  </div>
                </div>
              ))}
              {site.orders.length === 0 && (
                <div className="rounded-lg border border-border/70 bg-background/20 p-4 text-sm text-muted-foreground">
                  No orders yet for this site.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
