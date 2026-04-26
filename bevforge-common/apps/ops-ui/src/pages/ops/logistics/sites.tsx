import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isKegPackageType, parseOsPackageLots } from '@/lib/os-identity';
import { MapPin, Search } from 'lucide-react';
import { getOpsClientRecords, loadOpsCrmState, type OpsClientRecord } from '../crm/data';
import {
  buildSiteSummaries,
  fetchLogisticsOrders,
  type LogisticsOrder,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

export default function OpsLogisticsSitesPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [clientRecords, setClientRecords] = useState<OpsClientRecord[]>([]);
  const [siteStock, setSiteStock] = useState<Record<string, { onHand: number; kegsOnHand: number }>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      await loadOpsCrmState();
      const nextOrders = await fetchLogisticsOrders();
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setClientRecords(getOpsClientRecords());
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const sites = useMemo(() => {
    const orderSites = buildSiteSummaries(orders);
    const siteMap = new Map(orderSites.map((site) => [site.id, site]));

    clientRecords.forEach((client) => {
      if (siteMap.has(client.id)) {
        return;
      }
      siteMap.set(client.id, {
        id: client.id,
        name: client.name,
        orderCount: 0,
        activeOrderCount: 0,
        deliveredOrderCount: 0,
        onRouteOrderCount: 0,
        nextDeliveryDate: undefined,
        lastDeliveryDate: undefined,
        orders: [],
      });
    });

    return Array.from(siteMap.values()).sort((a, b) => {
      if (b.activeOrderCount !== a.activeOrderCount) {
        return b.activeOrderCount - a.activeOrderCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [orders, clientRecords]);

  useEffect(() => {
    let active = true;

    async function loadSiteOnHand() {
      const entries: Array<[string, { onHand: number; kegsOnHand: number }]> = await Promise.all(
        sites.map(async (site) => {
          try {
            const [inventoryResponse, packageLotsResponse] = await Promise.all([
              globalThis.fetch(`/api/os/inventory?siteId=${encodeURIComponent(site.id)}`),
              globalThis.fetch(`/api/os/package-lots?siteId=${encodeURIComponent(site.id)}&status=active`),
            ]);
            if (!inventoryResponse.ok) {
              return [site.id, { onHand: 0, kegsOnHand: 0 }];
            }
            const payload = await inventoryResponse.json();
            const root =
              typeof payload === 'object' && payload !== null && 'data' in payload
                ? (payload as { data?: unknown }).data
                : payload;
            const items =
              typeof root === 'object' && root !== null && 'items' in (root as Record<string, unknown>)
                ? ((root as { items?: unknown }).items as unknown[])
                : [];

            const onHand = Array.isArray(items)
              ? items.reduce<number>((sum, item) => {
                  if (typeof item !== 'object' || item === null) {
                    return sum;
                  }
                  const qty = Number((item as Record<string, unknown>).onHandQty ?? 0);
                  return sum + (Number.isFinite(qty) ? qty : 0);
                }, 0)
              : 0;
            const packageLots = packageLotsResponse.ok
              ? parseOsPackageLots(await packageLotsResponse.json())
              : [];
            const kegsOnHand = packageLots.reduce<number>((sum, lot) => {
              if (!isKegPackageType(lot.packageType, lot.packageFormatCode)) {
                return sum;
              }
              return sum + lot.availableUnits;
            }, 0);

            return [site.id, { onHand, kegsOnHand }];
          } catch {
            return [site.id, { onHand: 0, kegsOnHand: 0 }];
          }
        })
      );

      if (!active) {
        return;
      }

      setSiteStock(Object.fromEntries(entries) as Record<string, { onHand: number; kegsOnHand: number }>);
    }

    if (sites.length > 0) {
      void loadSiteOnHand();
    } else {
      setSiteStock({});
    }

    return () => {
      active = false;
    };
  }, [sites]);

  const filteredSites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sites;
    }

    return sites.filter(
      (site) =>
        site.name.toLowerCase().includes(normalized) || site.id.toLowerCase().includes(normalized)
    );
  }, [query, sites]);

  if (loading) {
    return (
      <AppShell pageTitle="OPS Logistics Sites" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading site management...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Logistics Sites" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Site Management</h1>
            <p className="mt-1 text-muted-foreground">
              Review delivery workload and order history by destination.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/logistics">Logistics Canvas</Link>
            </Button>
            <Button asChild>
              <Link to="/ops/logistics">Open Canvas</Link>
            </Button>
          </div>
        </div>

        <Card style={panelStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Find Site</CardTitle>
            <CardDescription>Search by site/account name or id.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sites or accounts"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredSites.map((site) => (
            <Link key={site.id} to={`/ops/logistics/sites/${site.id}`} className="block">
              <Card
                style={panelStyle}
                className="h-full cursor-pointer transition-colors hover:bg-accent/10"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-4 w-4" />
                        {site.name}
                      </CardTitle>
                      <CardDescription>{site.id}</CardDescription>
                    </div>
                    <Badge
                      className={
                        site.activeOrderCount > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-green-500/20 text-green-300 border-green-500/40'
                      }
                    >
                      {site.activeOrderCount > 0 ? 'Active queue' : 'No active queue'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border border-border/60 bg-background/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
                      <p className="text-xl font-semibold">{site.orderCount}</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">On Route</p>
                      <p className="text-xl font-semibold">{site.onRouteOrderCount}</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Past Orders</p>
                      <p className="text-sm font-medium">{site.deliveredOrderCount}</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">On Hand</p>
                      <p className="text-sm font-medium">{siteStock[site.id]?.onHand ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Kegs: {siteStock[site.id]?.kegsOnHand ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredSites.length === 0 && (
          <Card style={panelStyle}>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No sites matched your search.
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
