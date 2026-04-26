import { AppShell } from '@/components/AppShell';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Package,
  ShoppingCart,
  DollarSign,
  FileText,
  Download,
  Truck,
  AlertTriangle,
  Clock,
  XCircle,
  Tag,
  FlaskConical,
  ShieldCheck,
  LayoutGrid,
  Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customer_name: string;
  customer_id: string;
  status: string;
  total_amount: number;
  deposit_amount: number;
  delivery_date: string;
  delivery_time: string;
  order_source: string;
  lineItems: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  createdAt: string;
}

interface OSInventoryItem {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  onHandQty: number;
  allocatedQty: number;
  reorderPointQty: number;
}

interface OSInventorySummary {
  totalItems: number;
  lowStockItems: number;
  onHandValue: number;
  allocatedValue: number;
  availableValue: number;
}

interface OSBatchSummary {
  total: number;
  inProgress: number;
  readyToRelease: number;
  released: number;
  shipped: number;
  onHandQty: number;
}

interface OSBatchRecord {
  status?: string;
  producedQty?: number;
  allocatedQty?: number;
}

interface GoalsQuickLook {
  scenarioName: string;
  annualRevenueTarget: number;
  monthlyKegs: number;
  monthlyCases: number;
  wholesaleAccounts: number;
  clubMembers: number;
  monthlyCans: number;
}

const defaultInventorySummary: OSInventorySummary = {
  totalItems: 0,
  lowStockItems: 0,
  onHandValue: 0,
  allocatedValue: 0,
  availableValue: 0,
};

const defaultBatchSummary: OSBatchSummary = {
  total: 0,
  inProgress: 0,
  readyToRelease: 0,
  released: 0,
  shipped: 0,
  onHandQty: 0,
};

const defaultGoalsQuickLook: GoalsQuickLook = {
  scenarioName: 'No scenario',
  annualRevenueTarget: 0,
  monthlyKegs: 0,
  monthlyCases: 0,
  wholesaleAccounts: 0,
  clubMembers: 0,
  monthlyCans: 0,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);

const parseOrders = (payload: unknown): Order[] => {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload as Order[];
};

const parseInventoryPayload = (
  payload: unknown
): { items: OSInventoryItem[]; summary: OSInventorySummary } => {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const itemsSource = isRecord(root) && Array.isArray(root.items) ? root.items : [];
  const items = itemsSource
    .filter(isRecord)
    .map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? 'Unknown'),
      sku: item.sku ? String(item.sku) : undefined,
      unit: String(item.unit ?? 'units'),
      onHandQty: toNumber(item.onHandQty),
      allocatedQty: toNumber(item.allocatedQty),
      reorderPointQty: toNumber(item.reorderPointQty),
    }));

  const computedLowStockItems = items.filter(
    (item) => Math.max(0, item.onHandQty - item.allocatedQty) <= item.reorderPointQty
  ).length;
  const computedOnHandValue = items.reduce((sum, item) => sum + item.onHandQty, 0);
  const computedAllocatedValue = items.reduce((sum, item) => sum + item.allocatedQty, 0);

  const summarySource = isRecord(root) && isRecord(root.summary) ? root.summary : null;
  if (!summarySource) {
    return {
      items,
      summary: {
        totalItems: items.length,
        lowStockItems: computedLowStockItems,
        onHandValue: computedOnHandValue,
        allocatedValue: computedAllocatedValue,
        availableValue: Math.max(0, computedOnHandValue - computedAllocatedValue),
      },
    };
  }

  return {
    items,
    summary: {
      totalItems: toNumber(summarySource.totalItems, items.length),
      lowStockItems: toNumber(summarySource.lowStockItems, computedLowStockItems),
      onHandValue: toNumber(summarySource.onHandValue, computedOnHandValue),
      allocatedValue: toNumber(summarySource.allocatedValue, computedAllocatedValue),
      availableValue: toNumber(
        summarySource.availableValue,
        Math.max(0, computedOnHandValue - computedAllocatedValue)
      ),
    },
  };
};

const parseBatchSummary = (payload: unknown): OSBatchSummary => {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const batchesSource = isRecord(root) && Array.isArray(root.batches) ? root.batches : [];
  const batches = batchesSource.filter(isRecord) as OSBatchRecord[];

  const computedSummary: OSBatchSummary = {
    total: batches.length,
    inProgress: batches.filter((batch) => batch.status === 'in_progress').length,
    readyToRelease: batches.filter((batch) => batch.status === 'completed').length,
    released: batches.filter((batch) => batch.status === 'released').length,
    shipped: batches.filter((batch) => batch.status === 'shipped').length,
    onHandQty: batches.reduce(
      (sum, batch) => sum + Math.max(0, toNumber(batch.producedQty) - toNumber(batch.allocatedQty)),
      0
    ),
  };

  const summarySource = isRecord(root) && isRecord(root.summary) ? root.summary : null;
  if (!summarySource) {
    return computedSummary;
  }

  return {
    total: toNumber(summarySource.total, computedSummary.total),
    inProgress: toNumber(summarySource.inProgress, computedSummary.inProgress),
    readyToRelease: toNumber(summarySource.readyToRelease, computedSummary.readyToRelease),
    released: toNumber(summarySource.released, computedSummary.released),
    shipped: toNumber(summarySource.shipped, computedSummary.shipped),
    onHandQty: toNumber(summarySource.onHandQty, computedSummary.onHandQty),
  };
};

const parseGoalsQuickLook = (payload: unknown): GoalsQuickLook => {
  const root = isRecord(payload) && isRecord(payload.data)
    ? payload.data
    : isRecord(payload)
      ? payload
      : null;

  if (!root || !Array.isArray(root.scenarios)) {
    return defaultGoalsQuickLook;
  }

  const scenarios = root.scenarios.filter(isRecord);
  if (scenarios.length === 0) {
    return defaultGoalsQuickLook;
  }

  const activeScenarioId =
    typeof root.activeScenarioId === 'string' ? root.activeScenarioId : undefined;
  const activeScenario =
    scenarios.find((scenario) => String(scenario.id ?? '') === activeScenarioId) ??
    scenarios[0];

  const derived = isRecord(activeScenario.derived) ? activeScenario.derived : null;
  const revenue = derived && isRecord(derived.revenue) ? derived.revenue : null;
  const units = derived && isRecord(derived.units) ? derived.units : null;
  const targets = derived && isRecord(derived.targets) ? derived.targets : null;

  const monthlyHalfBblKegs = toNumber(targets?.monthlyHalfBblKegs);
  const monthlySixthBblKegs = toNumber(targets?.monthlySixthBblKegs);
  const monthlyCases = toNumber(targets?.monthlyCases);

  return {
    scenarioName:
      typeof activeScenario.name === 'string' && activeScenario.name.trim()
        ? activeScenario.name
        : 'Active Scenario',
    annualRevenueTarget: toNumber(
      revenue?.annualTarget,
      toNumber(activeScenario.annualRevenueGoal)
    ),
    monthlyKegs: monthlyHalfBblKegs + monthlySixthBblKegs,
    monthlyCases,
    wholesaleAccounts: toNumber(targets?.wholesaleAccountsNeeded),
    clubMembers: toNumber(targets?.clubMembersNeeded),
    monthlyCans: toNumber(units?.cans, monthlyCases * 24) / 12,
  };
};

export default function OpsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<OSInventoryItem[]>([]);
  const [inventorySummary, setInventorySummary] =
    useState<OSInventorySummary>(defaultInventorySummary);
  const [, setBatchSummary] = useState<OSBatchSummary>(defaultBatchSummary);
  const [goalsQuickLook, setGoalsQuickLook] =
    useState<GoalsQuickLook>(defaultGoalsQuickLook);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, inventoryRes, batchesRes, goalsRes] = await Promise.all([
          globalThis.fetch('/api/orders'),
          globalThis.fetch('/api/os/inventory'),
          globalThis.fetch('/api/os/batches'),
          globalThis.fetch('/api/goals/scenarios'),
        ]);

        const ordersData = ordersRes.ok ? await ordersRes.json() : [];
        const inventoryData = inventoryRes.ok ? await inventoryRes.json() : null;
        const batchesData = batchesRes.ok ? await batchesRes.json() : null;
        const goalsData = goalsRes.ok ? await goalsRes.json() : null;

        setOrders(parseOrders(ordersData));

        const parsedInventory = parseInventoryPayload(inventoryData);
        setInventoryItems(parsedInventory.items);
        setInventorySummary(parsedInventory.summary);

        setBatchSummary(parseBatchSummary(batchesData));
        setGoalsQuickLook(parseGoalsQuickLook(goalsData));
      } catch (error) {
        console.error('Error fetching OPS dashboard data:', error);
        setOrders([]);
        setInventoryItems([]);
        setInventorySummary(defaultInventorySummary);
        setBatchSummary(defaultBatchSummary);
        setGoalsQuickLook(defaultGoalsQuickLook);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate real stats from API data
  const ordersRequiringAction = orders.filter(
    (order) => order.status === 'draft' || order.status === 'confirmed'
  ).length;

  const ordersUnfulfilled = orders.filter(
    (order) => order.status !== 'delivered' && order.status !== 'cancelled'
  ).length;

  const ordersDelivered = orders.filter((order) => order.status === 'delivered').length;

  // Only count sales from delivered orders (payment received)
  const salesTotal = orders
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const lowStockItems = inventorySummary.lowStockItems;

  // Inventory at risk sourced from OS inventory summary
  const inventoryAtRisk = lowStockItems;

  // Deliveries scheduled (approved or in-delivery status)
  const deliveriesScheduled = orders.filter((order) =>
    ['approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(order.status)
  ).length;

  // Overdue deliveries (past delivery date and not delivered)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveriesOverdue = orders.filter((order) => {
    if (order.status === 'delivered' || order.status === 'cancelled') return false;
    const deliveryDate = new Date(order.delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate < today;
  }).length;

  // Compliance - no real data yet, set to 0
  const complianceDeadlines = 0;
  const complianceStatus: 'compliant' | 'at-risk' =
    complianceDeadlines > 0 ? 'at-risk' : 'compliant';

  const totalInventoryItems = inventorySummary.totalItems || inventoryItems.length;
  const sellableProducts = inventoryItems.filter(
    (item) => Math.max(0, item.onHandQty - item.allocatedQty) > 0
  );
  const sellableProductCount = sellableProducts.length;
  const sellableAvailableUnits = sellableProducts.reduce(
    (sum, item) => sum + Math.max(0, item.onHandQty - item.allocatedQty),
    0
  );
  const sellableLowStock = sellableProducts.filter(
    (item) => Math.max(0, item.onHandQty - item.allocatedQty) <= item.reorderPointQty
  ).length;
  const clientKeyForOrder = (order: Order) => order.customer_id || order.customer_name;
  const crmClientCount = new Set(orders.map(clientKeyForOrder)).size;
  const crmActiveClientCount = new Set(
    orders
      .filter((order) => order.status !== 'delivered' && order.status !== 'cancelled')
      .map(clientKeyForOrder)
  ).size;

  // Orders requiring action (draft or confirmed)
  const actionableOrders = orders
    .filter((order) => order.status === 'draft' || order.status === 'confirmed')
    .map((order) => ({
      id: order.orderNumber,
      customer: order.customer_name,
      issue: order.status === 'draft' ? 'Needs approval' : 'Ready for processing',
      priority: order.status === 'draft' ? 'high' : 'medium',
    }));

  // Delivery status (scheduled deliveries)
  const deliveryStatus = orders
    .filter((order) =>
      ['approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(order.status)
    )
    .map((order) => {
      const deliveryDate = new Date(order.delivery_date);
      const isOverdue = deliveryDate < today;
      return {
        id: order.orderNumber,
        destination: order.customer_name,
        status: isOverdue ? 'overdue' : order.status === 'in-delivery' ? 'in-transit' : 'scheduled',
        dueDate: new Date(order.delivery_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      };
    });

  // Sales by channel (only from delivered orders)
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const salesByChannel = [
    {
      channel: 'Website',
      amount: deliveredOrders
        .filter((order) => order.order_source === 'web')
        .reduce((sum, order) => sum + order.total_amount, 0),
      count: deliveredOrders.filter((order) => order.order_source === 'web').length,
    },
    {
      channel: 'Phone',
      amount: deliveredOrders
        .filter((order) => order.order_source === 'phone')
        .reduce((sum, order) => sum + order.total_amount, 0),
      count: deliveredOrders.filter((order) => order.order_source === 'phone').length,
    },
    {
      channel: 'Email',
      amount: deliveredOrders
        .filter((order) => order.order_source === 'email')
        .reduce((sum, order) => sum + order.total_amount, 0),
      count: deliveredOrders.filter((order) => order.order_source === 'email').length,
    },
  ].filter((channel) => channel.count > 0); // Only show channels with delivered orders

  // Calculate percentages
  const totalChannelSales = salesByChannel.reduce((sum, channel) => sum + channel.amount, 0);
  const salesByChannelWithPercent = salesByChannel.map((channel) => ({
    ...channel,
    percent: totalChannelSales > 0 ? Math.round((channel.amount / totalChannelSales) * 100) : 0,
  }));

  // Recent orders (last 3)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map((order) => ({
      id: order.orderNumber,
      customer: order.customer_name,
      amount: `${parseFloat(String(order.total_amount)).toFixed(2)}`,
      status:
        order.status === 'delivered'
          ? 'Delivered'
          : order.status === 'approved'
            ? 'Processing'
            : order.status === 'draft'
              ? 'Draft'
              : 'In Progress',
    }));

  // Inventory alerts (low stock items from OS available quantity)
  const inventoryAlerts = inventoryItems
    .map((item) => ({
      product: item.name,
      quantity: Math.max(0, item.onHandQty - item.allocatedQty),
      unit: item.unit,
      reorderPoint: item.reorderPointQty,
    }))
    .filter((item) => item.quantity <= item.reorderPoint);

  if (loading) {
    return (
      <AppShell pageTitle="OPS — Business Overview">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS — Business Overview">
      <div className="space-y-6">
        {/* Header with Date Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OPS — Business Overview</h1>
            <p className="text-muted-foreground mt-1">BevForge operations dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">
              Inventory quantities and batch lifecycle are sourced from OS APIs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/ops/logistics">
                <Truck className="h-4 w-4" />
                Logistics Canvas
              </Link>
            </Button>
            <Select defaultValue="today">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CRITICAL ALERTS BANNER */}
        {(ordersRequiringAction > 0 ||
          deliveriesOverdue > 0 ||
          complianceDeadlines > 0 ||
          inventoryAtRisk > 0) && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Items Requiring Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {ordersRequiringAction > 0 && (
                  <Link to="/ops/orders" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{ordersRequiringAction}</Badge>
                    <span>Orders need action</span>
                  </Link>
                )}
                {deliveriesOverdue > 0 && (
                  <Link to="/ops/orders" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{deliveriesOverdue}</Badge>
                    <span>Overdue deliveries</span>
                  </Link>
                )}
                {complianceDeadlines > 0 && (
                  <Link to="/ops/compliance" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{complianceDeadlines}</Badge>
                    <span>Compliance deadlines approaching</span>
                  </Link>
                )}
                {inventoryAtRisk > 0 && (
                  <Link to="/ops/inventory" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{inventoryAtRisk}</Badge>
                    <span>OS inventory items at risk</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick-Look Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Orders Requiring Action Tile */}
          <Link to="/ops/orders">
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${ordersRequiringAction > 0 ? 'border-yellow-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = ordersRequiringAction > 0
                  ? '0 0 20px rgba(234, 179, 8, 0.4)'
                  : '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders - Action Required</CardTitle>
                <AlertCircle className={`h-4 w-4 ${ordersRequiringAction > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${ordersRequiringAction > 0 ? 'text-yellow-500' : ''}`}>
                  {ordersRequiringAction}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersRequiringAction > 0 ? 'Need immediate attention' : 'All orders processed'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Orders <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Deliveries Tile */}
          <Link to="/ops/logistics/routes">
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${deliveriesOverdue > 0 ? 'border-red-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = deliveriesOverdue > 0
                  ? '0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveriesScheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {deliveriesOverdue > 0 ? (
                    <span className="text-red-500 font-semibold">{deliveriesOverdue} overdue</span>
                  ) : deliveriesScheduled > 0 ? (
                    'All on schedule'
                  ) : (
                    'No scheduled deliveries'
                  )}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  Open Route Planner <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Compliance Tile */}
          <Link to="/ops/compliance">
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${complianceStatus === 'at-risk' ? 'border-yellow-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = complianceStatus === 'at-risk'
                  ? '0 0 20px rgba(234, 179, 8, 0.4)'
                  : '0 0 20px rgba(34, 197, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                {complianceStatus === 'at-risk' ? (
                  <Clock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{complianceDeadlines}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {complianceStatus === 'at-risk' ? 'Deadlines approaching' : 'All requirements met'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Compliance <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Inventory At Risk Tile */}
          <Link to="/ops/inventory">
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${inventoryAtRisk > 0 ? 'border-red-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = inventoryAtRisk > 0
                  ? '0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory At Risk</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${inventoryAtRisk > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${inventoryAtRisk > 0 ? 'text-red-500' : ''}`}>
                  {inventoryAtRisk}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryAtRisk > 0 ? 'Low stock in OS availability' : 'OS stock levels healthy'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Inventory <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Sales Tile */}
          <Link to="/ops/sales">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${parseFloat(String(salesTotal)).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersDelivered > 0 ? `From ${ordersDelivered} delivered order${ordersDelivered > 1 ? 's' : ''}` : 'No sales yet'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Sales <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* All Orders Tile */}
          <Link to="/ops/orders">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersUnfulfilled > 0 ? `${ordersUnfulfilled} unfulfilled` : 'All orders fulfilled'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View All Orders <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Sellable Products Tile */}
          <Link to="/ops/products">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sellable Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sellableProductCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sellableLowStock > 0
                    ? `${sellableLowStock} sellable products low stock`
                    : `${sellableAvailableUnits} units ready for sale/delivery`}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Products <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Clients Tile */}
          <Link to="/ops/crm">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CRM Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmClientCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {crmClientCount > 0
                    ? `${crmActiveClientCount} clients with active orders`
                    : 'No client records'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  Open CRM <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(200, 15%, 65%)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <CardContent className="py-4">
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-3">
                <span className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Goals Quick Look
                </span>
                <span className="px-1 text-sm text-muted-foreground">
                  Scenario: <span className="font-medium text-foreground">{goalsQuickLook.scenarioName}</span>
                </span>
                <Link to="/ops/goals" className="hover:underline">
                  <span className="flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 transition-colors hover:bg-accent/20">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="text-sm font-semibold">{formatCurrency(goalsQuickLook.annualRevenueTarget)}</span>
                  </span>
                </Link>
                <Link
                  to="/ops/goals"
                  className="hover:underline"
                >
                  <span className="flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 transition-colors hover:bg-accent/20">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Kegs/mo</span>
                    <span className="text-sm font-semibold">{formatNumber(goalsQuickLook.monthlyKegs)}</span>
                  </span>
                </Link>
                <Link
                  to={`/ops/goals?lock=wholesaleAccountsNeeded&value=${encodeURIComponent(
                    String(goalsQuickLook.wholesaleAccounts)
                  )}`}
                  className="hover:underline"
                >
                  <span className="flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 transition-colors hover:bg-accent/20">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Clients</span>
                    <span className="text-sm font-semibold">{formatNumber(goalsQuickLook.wholesaleAccounts)}</span>
                  </span>
                </Link>
                <Link
                  to={`/ops/goals?lock=clubMembersNeeded&value=${encodeURIComponent(
                    String(goalsQuickLook.clubMembers)
                  )}`}
                  className="hover:underline"
                >
                  <span className="flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 transition-colors hover:bg-accent/20">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Memberships</span>
                    <span className="text-sm font-semibold">{formatNumber(goalsQuickLook.clubMembers)}</span>
                  </span>
                </Link>
                <Link
                  to="/ops/goals"
                  className="hover:underline"
                >
                  <span className="flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 transition-colors hover:bg-accent/20">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cans/mo</span>
                    <span className="text-sm font-semibold">{formatNumber(goalsQuickLook.monthlyCans)}</span>
                  </span>
                </Link>
                <Button variant="link" size="sm" className="h-auto px-1" asChild>
                  <Link to="/ops/goals">Open Goals</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid hsl(200, 15%, 65%)',
          backdropFilter: 'blur(12px)',
        }}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Fast-access operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/products">
                  <Package className="mr-2 h-4 w-4" />
                  Create New Product
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/inventory">
                  <Download className="mr-2 h-4 w-4" />
                  Receive Inventory
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/sales">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Sync Website Store
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/invoicing">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/reports">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/forecast">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Demand Forecast
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/crm">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Clients
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/logistics">
                  <Truck className="mr-2 h-4 w-4" />
                  Open Logistics Canvas
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/canvas-classic">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Open Classic Canvas
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Links */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid hsl(200, 15%, 65%)',
          backdropFilter: 'blur(12px)',
        }}>
        <CardHeader>
          <CardTitle>OPS Workspaces</CardTitle>
          <CardDescription>Direct links to active OPS pages and restored canvas variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/logistics">
                <Truck className="mr-2 h-4 w-4" />
                Logistics Canvas
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/logistics/sites">
                <Truck className="mr-2 h-4 w-4" />
                Site Management
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/crm">
                <Users className="mr-2 h-4 w-4" />
                CRM Clients
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/logistics/trucks">
                <Truck className="mr-2 h-4 w-4" />
                Truck Board
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/logistics/routes">
                <Truck className="mr-2 h-4 w-4" />
                Route Planner
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/logistics/events">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Event Stream
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/forecast">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Forecast
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ops/canvas-hybrid">
                <LayoutGrid className="mr-2 h-4 w-4" />
                  Canvas Hybrid
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/canvas-v3">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Canvas V3
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/labels">
                  <Tag className="mr-2 h-4 w-4" />
                  Labels & QR
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/recipes">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Recipes
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/quality">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Quality
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/ops/tax">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Tax
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Supporting Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Requiring Action */}
          {actionableOrders.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Orders Requiring Action</CardTitle>
                <CardDescription>Issues that need resolution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actionableOrders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      to="/ops/orders"
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{order.id}</p>
                          <Badge
                            variant={order.priority === 'high' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {order.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                        <p className="text-xs text-yellow-500 mt-1">{order.issue}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                {actionableOrders.length > 3 && (
                  <Button variant="link" className="mt-3 p-0 h-auto text-xs w-full justify-center" asChild>
                    <Link to="/ops/orders">View all {actionableOrders.length} orders</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Status */}
          {deliveryStatus.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>Scheduled and in-transit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveryStatus.slice(0, 4).map((delivery) => (
                    <Link
                      key={delivery.id}
                      to="/ops/logistics/routes"
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{delivery.id}</p>
                          {delivery.status === 'overdue' && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {delivery.status === 'in-transit' && (
                            <Truck className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{delivery.destination}</p>
                        <p className={`text-xs mt-1 ${delivery.status === 'overdue' ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                          Due: {delivery.dueDate}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales by Channel */}
          {salesByChannelWithPercent.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Sales by Channel</CardTitle>
                <CardDescription>From delivered orders only</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesByChannelWithPercent.map((channel) => (
                    <div key={channel.channel} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{channel.channel}</p>
                        <p className="text-xs text-muted-foreground">{channel.percent}% of total</p>
                      </div>
                      <p className="text-sm font-bold">${parseFloat(String(channel.amount)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{order.amount}</p>
                        <p className="text-xs text-muted-foreground">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Alerts */}
          {inventoryAlerts.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items needing attention from OS availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.slice(0, 4).map((item, idx) => (
                    <Link
                      key={idx}
                      to="/ops/inventory"
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product}</p>
                        <p className="text-xs font-semibold text-orange-500">Low stock</p>
                      </div>
                      <p className="text-sm font-bold">{item.quantity} {item.unit}</p>
                    </Link>
                  ))}
                </div>
                {inventoryAlerts.length > 4 && (
                  <Button variant="link" className="mt-3 p-0 h-auto text-xs w-full justify-center" asChild>
                    <Link to="/ops/inventory">View all alerts</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State */}
        {orders.length === 0 && totalInventoryItems === 0 && crmClientCount === 0 && (
          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(200, 15%, 65%)',
            backdropFilter: 'blur(12px)',
          }}>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start by creating orders in OPS and confirming inventory in OS.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/ops/inventory">
                    <Package className="mr-2 h-4 w-4" />
                    View Inventory
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/ops/orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Create Order
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
