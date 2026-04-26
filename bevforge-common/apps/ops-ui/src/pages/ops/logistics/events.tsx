import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CheckCircle2, Clock, RefreshCcw, XCircle } from 'lucide-react';
import {
  fetchLogisticsOrders,
  formatDate,
  formatDateTime,
  type LogisticsOrder,
  type LogisticsOrderStatus,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

interface LogisticsEvent {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  status: 'complete' | 'active' | 'cancelled' | 'update';
  orderNumber: string;
  siteId: string;
}

const eventFromOrder = (order: LogisticsOrder): LogisticsEvent => {
  const normalizedStatus: LogisticsOrderStatus = order.status;

  if (normalizedStatus === 'delivered') {
    return {
      id: `${order.id}-delivered`,
      title: 'Delivery Completed',
      detail: `${order.customerName} accepted ${order.orderNumber}`,
      occurredAt: order.deliveryDate ?? order.createdAt ?? new Date().toISOString(),
      status: 'complete',
      orderNumber: order.orderNumber,
      siteId: order.customerId,
    };
  }

  if (normalizedStatus === 'cancelled') {
    return {
      id: `${order.id}-cancelled`,
      title: 'Order Cancelled',
      detail: `${order.orderNumber} cancelled before fulfillment`,
      occurredAt: order.createdAt ?? new Date().toISOString(),
      status: 'cancelled',
      orderNumber: order.orderNumber,
      siteId: order.customerId,
    };
  }

  if (normalizedStatus === 'in-delivery' || normalizedStatus === 'loaded') {
    return {
      id: `${order.id}-in-delivery`,
      title: 'Truck Dispatch Active',
      detail: `${order.orderNumber} is in execution for ${order.customerName}`,
      occurredAt: order.deliveryDate ?? order.createdAt ?? new Date().toISOString(),
      status: 'active',
      orderNumber: order.orderNumber,
      siteId: order.customerId,
    };
  }

  if (normalizedStatus === 'approved' || normalizedStatus === 'in-packing' || normalizedStatus === 'packed') {
    return {
      id: `${order.id}-queue`,
      title: 'Dispatch Queue Update',
      detail: `${order.orderNumber} is staged for route planning`,
      occurredAt: order.deliveryDate ?? order.createdAt ?? new Date().toISOString(),
      status: 'update',
      orderNumber: order.orderNumber,
      siteId: order.customerId,
    };
  }

  return {
    id: `${order.id}-created`,
    title: 'Order Created',
    detail: `${order.orderNumber} entered logistics workflow`,
    occurredAt: order.createdAt ?? new Date().toISOString(),
    status: 'update',
    orderNumber: order.orderNumber,
    siteId: order.customerId,
  };
};

const getEventIcon = (status: LogisticsEvent['status']) => {
  switch (status) {
    case 'complete':
      return CheckCircle2;
    case 'active':
      return Clock;
    case 'cancelled':
      return XCircle;
    default:
      return RefreshCcw;
  }
};

const getEventBadge = (status: LogisticsEvent['status']): string => {
  switch (status) {
    case 'complete':
      return 'bg-green-500/20 text-green-300 border-green-500/40';
    case 'active':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'cancelled':
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    default:
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
};

export default function OpsLogisticsEventsPage() {
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

  const events = useMemo(() => {
    return orders
      .map(eventFromOrder)
      .sort((a, b) => new Date(b.occurredAt).valueOf() - new Date(a.occurredAt).valueOf());
  }, [orders]);

  if (loading) {
    return (
      <AppShell pageTitle="OPS Logistics Events" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading event stream...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS Logistics Events" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logistics Event Stream</h1>
            <p className="mt-1 text-muted-foreground">
              Timeline of delivery operations from OPS order lifecycle states.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/logistics">Logistics Canvas</Link>
            </Button>
            <Button asChild>
              <Link to="/ops/logistics/routes">View Routes</Link>
            </Button>
          </div>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-4 w-4" />
              Event Timeline
            </CardTitle>
            <CardDescription>
              For quantity and batch authority, defer to OS endpoints surfaced on the logistics hub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logistics events available yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const Icon = getEventIcon(event.status);
                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/20 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-md border border-border/70 bg-background/30 p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.detail}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(event.occurredAt)} · Event date {formatDate(event.occurredAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getEventBadge(event.status)}>{event.status}</Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/ops/logistics/sites/${event.siteId}`}>{event.orderNumber}</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
