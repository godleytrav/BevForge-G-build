import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, MapPin, Package } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { getDeliveryScanEvents } from './logistics/data';

type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'approved'
  | 'in-packing'
  | 'packed'
  | 'loaded'
  | 'in-delivery'
  | 'delivered'
  | 'cancelled';

interface ForecastLineItem {
  productName: string;
  containerType: string;
  quantity: number;
  unitPrice: number;
}

interface ForecastOrder {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  lineItems: ForecastLineItem[];
}

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeStatus = (value: unknown): OrderStatus => {
  const status = toStringValue(value);
  const allowed: OrderStatus[] = [
    'draft',
    'confirmed',
    'approved',
    'in-packing',
    'packed',
    'loaded',
    'in-delivery',
    'delivered',
    'cancelled',
  ];
  if (allowed.includes(status as OrderStatus)) {
    return status as OrderStatus;
  }
  switch (status) {
    case 'submitted':
      return 'confirmed';
    case 'reserved':
      return 'approved';
    case 'partially_reserved':
      return 'in-packing';
    case 'backordered':
      return 'confirmed';
    case 'ready_to_fulfill':
      return 'loaded';
    case 'fulfilled':
      return 'delivered';
    case 'canceled':
      return 'cancelled';
    default:
      return 'draft';
  }
};

const normalizeLineItems = (value: unknown): ForecastLineItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      productName:
        toStringValue(item.product_name) ||
        toStringValue(item.productName) ||
        toStringValue(item.item_name) ||
        'Unknown Product',
      containerType:
        toStringValue(item.container_type) ||
        toStringValue(item.containerType) ||
        toStringValue(item.size) ||
        'Package',
      quantity: Math.max(0, toNumber(item.quantity ?? item.qty, 0)),
      unitPrice: Math.max(0, toNumber(item.unit_price ?? item.unitPrice ?? item.price, 0)),
    }));
};

const normalizeOrdersPayload = (payload: unknown): ForecastOrder[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(isRecord)
    .map((order, index) => {
      const customerName =
        toStringValue(order.customer_name) ||
        toStringValue(order.customerName) ||
        'Unknown Site';

      return {
        id: toStringValue(order.id, `order-${index + 1}`),
        customerId:
          toStringValue(order.customer_id) ||
          toStringValue(order.customerId) ||
          customerName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        customerName,
        orderDate:
          toStringValue(order.order_date) ||
          toStringValue(order.orderDate) ||
          toStringValue(order.created_at) ||
          new Date().toISOString(),
        status: normalizeStatus(order.status),
        totalAmount: Math.max(0, toNumber(order.total_amount ?? order.total, 0)),
        lineItems: normalizeLineItems(order.lineItems ?? order.line_items),
      };
    });
};

const getOrderUnits = (order: ForecastOrder): number => {
  return order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
};

export default function OpsForecastPage() {
  const [orders, setOrders] = useState<ForecastOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const payload = await apiGet<unknown>('/api/orders');
        if (!active) {
          return;
        }
        setOrders(normalizeOrdersPayload(payload));
      } catch {
        if (active) {
          setOrders([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const days30 = new Date(now);
    days30.setDate(now.getDate() - 30);
    const days60 = new Date(now);
    days60.setDate(now.getDate() - 60);

    const deliveredOrders = orders.filter((order) => order.status === 'delivered');

    const deliveredLast30 = deliveredOrders.filter((order) => new Date(order.orderDate) >= days30);
    const deliveredPrev30 = deliveredOrders.filter((order) => {
      const date = new Date(order.orderDate);
      return date >= days60 && date < days30;
    });

    const unitsLast30 = deliveredLast30.reduce((sum, order) => sum + getOrderUnits(order), 0);
    const unitsPrev30 = deliveredPrev30.reduce((sum, order) => sum + getOrderUnits(order), 0);

    const growthPercent =
      unitsPrev30 > 0 ? Number((((unitsLast30 - unitsPrev30) / unitsPrev30) * 100).toFixed(1)) : 0;

    const projectedNext30Units = Math.max(0, Math.round(unitsLast30 * (1 + growthPercent / 100)));

    const activeDemandOrders = orders.filter((order) => {
      return ['approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(order.status);
    });

    const productMap = new Map<
      string,
      { productName: string; units: number; revenue: number; activeUnits: number; trendUnits: number }
    >();

    deliveredOrders.forEach((order) => {
      const inLast30 = new Date(order.orderDate) >= days30;
      order.lineItems.forEach((item) => {
        const key = `${item.productName}::${item.containerType}`;
        const current = productMap.get(key) ?? {
          productName: `${item.productName} (${item.containerType})`,
          units: 0,
          revenue: 0,
          activeUnits: 0,
          trendUnits: 0,
        };

        current.units += item.quantity;
        current.revenue += item.quantity * item.unitPrice;
        if (inLast30) {
          current.trendUnits += item.quantity;
        }
        productMap.set(key, current);
      });
    });

    activeDemandOrders.forEach((order) => {
      order.lineItems.forEach((item) => {
        const key = `${item.productName}::${item.containerType}`;
        const current = productMap.get(key) ?? {
          productName: `${item.productName} (${item.containerType})`,
          units: 0,
          revenue: 0,
          activeUnits: 0,
          trendUnits: 0,
        };
        current.activeUnits += item.quantity;
        productMap.set(key, current);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);

    const siteMap = new Map<
      string,
      { siteId: string; siteName: string; deliveredOrders: number; units: number; revenue: number; lastScanCount: number }
    >();

    deliveredOrders.forEach((order) => {
      const current = siteMap.get(order.customerId) ?? {
        siteId: order.customerId,
        siteName: order.customerName,
        deliveredOrders: 0,
        units: 0,
        revenue: 0,
        lastScanCount: 0,
      };

      current.deliveredOrders += 1;
      current.units += getOrderUnits(order);
      current.revenue += order.totalAmount;
      siteMap.set(order.customerId, current);
    });

    const scanEvents = getDeliveryScanEvents();
    scanEvents.forEach((event) => {
      const current = siteMap.get(event.stopId);
      if (current) {
        current.lastScanCount += 1;
      }
    });

    const topSites = Array.from(siteMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      deliveredOrders: deliveredOrders.length,
      unitsLast30,
      unitsPrev30,
      growthPercent,
      projectedNext30Units,
      activeDemandOrders: activeDemandOrders.length,
      topProducts,
      topSites,
    };
  }, [orders]);

  if (loading) {
    return (
      <AppShell pageTitle="OPS Forecast" currentSuite="ops">
        <div className="flex h-96 items-center justify-center text-muted-foreground">Loading forecast data...</div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Forecast" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Demand Forecast</h1>
            <p className="mt-1 text-muted-foreground">
              Product movement by site and delivered volume trend for planning.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/reports">Reports</Link>
            </Button>
            <Button asChild>
              <Link to="/ops/orders">Orders</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.deliveredOrders}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Units (Last 30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.unitsLast30}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="inline-flex items-center gap-1 text-2xl font-bold">
                <TrendingUp className="h-5 w-5" />
                {metrics.growthPercent >= 0 ? '+' : ''}
                {metrics.growthPercent}%
              </p>
              <p className="text-xs text-muted-foreground">vs prior 30 days</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projected Next 30d</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.projectedNext30Units}</p>
              <p className="text-xs text-muted-foreground">estimated units</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-4 w-4" />
                Top Products
              </CardTitle>
              <CardDescription>Delivered units and current in-flight demand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.topProducts.map((product) => (
                <div
                  key={product.productName}
                  className="rounded-md border border-border/60 bg-background/20 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">Revenue ${product.revenue.toFixed(2)}</p>
                    </div>
                    <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                      {product.units} delivered
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last 30d: {product.trendUnits} · In-flight demand: {product.activeUnits}
                  </p>
                </div>
              ))}
              {metrics.topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">No delivered product movement yet.</p>
              )}
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-4 w-4" />
                Top Sites
              </CardTitle>
              <CardDescription>Best-performing locations by delivered revenue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.topSites.map((site) => (
                <Link
                  key={site.siteId}
                  to={`/ops/logistics/sites/${site.siteId}`}
                  className="block rounded-md border border-border/60 bg-background/20 p-3 transition-colors hover:bg-accent/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{site.siteName}</p>
                      <p className="text-xs text-muted-foreground">{site.deliveredOrders} delivered orders</p>
                    </div>
                    <Badge className="border-green-500/40 bg-green-500/20 text-green-300">
                      ${site.revenue.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Units: {site.units} · Scanned events: {site.lastScanCount}
                  </p>
                </Link>
              ))}
              {metrics.topSites.length === 0 && (
                <p className="text-sm text-muted-foreground">No delivered site performance yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle>Planning Signal</CardTitle>
            <CardDescription>Use demand trend and in-flight queue for production/packaging alignment.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Active in-flight orders: <span className="font-medium text-foreground">{metrics.activeDemandOrders}</span>. Combine this with OS packaged availability before final route loading.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
