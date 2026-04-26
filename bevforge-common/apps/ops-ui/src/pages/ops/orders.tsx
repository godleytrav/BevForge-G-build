import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Edit,
  Layers,
  MapPin,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiDelete, apiGet, apiPatch, apiPost, createIdempotencyHeaders } from '@/lib/api';
import {
  buildOpsTaxProfileSnapshot,
  calculateOpsTaxAmount,
  formatOpsSalesChannel,
  formatOpsTaxTreatment,
  type OpsTaxProfileSnapshot,
} from '@/lib/ops-tax';
import {
  buildOsSellableCatalog,
  buildProductLookupBySku,
  buildSiteSkuKey,
  groupPackageLotsBySkuSite,
  normalizeOsSiteId,
  parseOsInventoryCatalog,
  parseOsPackageLots,
  parseOsProductCatalog,
  type OsPackageLotRecord,
  type OsProductCatalogRecord,
  type OsSellableCatalogItem,
} from '@/lib/os-identity';
import { cn } from '@/lib/utils';
import { getDeliveryScanEvents } from './logistics/data';
import { getOpsClientRecord, getOpsClientRecords, loadOpsCrmState } from './crm/data';

type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'reserved'
  | 'partially_reserved'
  | 'backordered'
  | 'ready_to_fulfill'
  | 'fulfilled'
  | 'cancelled';

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'partially_reserved', label: 'Partially Reserved' },
  { value: 'backordered', label: 'Backordered' },
  { value: 'ready_to_fulfill', label: 'Ready To Fulfill' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ORDER_STATUS_SET = new Set<OrderStatus>(ORDER_STATUS_OPTIONS.map((entry) => entry.value));

const ACTION_REQUIRED_STATUSES: OrderStatus[] = ['draft', 'submitted', 'backordered'];
const ACTIVE_STATUSES: OrderStatus[] = [
  'reserved',
  'partially_reserved',
  'backordered',
  'ready_to_fulfill',
];

interface LineItem {
  id?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  productName?: string;
  containerTypeId?: string;
  containerType?: string;
  packageType?: string;
  packageFormatCode?: string;
  batchId?: string;
  batchCode?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  uom?: string;
  siteId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reservedQty?: number;
  shortQty?: number;
  reservationId?: string;
  reservationStatus?: 'reserved' | 'partially_reserved' | 'rejected' | 'committed' | 'released' | 'expired';
  reservationReasonCode?: string;
  reservationReasonMessage?: string;
  availabilitySnapshot?: {
    onHandQty?: number;
    allocatedQty?: number;
    availableQty?: number;
    uom?: string;
    asOf?: string;
    lotBreakdown?: Array<{
      lotId: string;
      packageLotId?: string;
      packageLotCode?: string;
      batchId?: string;
      batchCode?: string;
      assetId?: string;
      assetCode?: string;
      availableQty: number;
      expiresAt?: string;
    }>;
  };
  item_name?: string;
  qty?: number;
  price?: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  siteId?: string;
  customer_name: string;
  order_date: string;
  delivery_date?: string;
  status: OrderStatus;
  total_amount: number;
  taxAmount?: number;
  taxProfileSnapshot?: OpsTaxProfileSnapshot;
  lineItems: LineItem[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface FormLineItem {
  product_id: string;
  product_code: string;
  sku_id: string;
  item_name: string;
  container_type: string;
  package_type: string;
  package_format_code: string;
  uom: string;
  qty: number;
  price: number;
  availability?: {
    availableQty: number;
    onHandQty: number;
    allocatedQty: number;
    uom: string;
    asOf?: string;
    lotBreakdown?: Array<{
      lotId: string;
      packageLotId?: string;
      packageLotCode?: string;
      batchId?: string;
      batchCode?: string;
      assetId?: string;
      assetCode?: string;
      availableQty: number;
      expiresAt?: string;
    }>;
  };
  availabilityKey?: string;
  availabilityError?: string;
  availabilityLoading?: boolean;
}

interface OrderFormData {
  customer_id?: string;
  customer_name: string;
  site_id: string;
  order_date: string;
  status: OrderStatus;
}

interface CustomerOption {
  id: string;
  name: string;
}

type SellableCatalogItem = OsSellableCatalogItem;

type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';

type OrderSaveMode = 'draft' | 'submit';

const statusColors: Record<OrderStatus, string> = {
  draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  reserved: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  partially_reserved: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  backordered: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ready_to_fulfill: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  fulfilled: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const defaultFormData = (): OrderFormData => ({
  customer_id: '',
  customer_name: '',
  site_id: 'main',
  order_date: new Date().toISOString().split('T')[0],
  status: 'draft',
});

const defaultFormLineItem = (): FormLineItem => ({
  product_id: '',
  product_code: '',
  sku_id: '',
  item_name: '',
  container_type: 'Package',
  package_type: '',
  package_format_code: '',
  uom: 'units',
  qty: 1,
  price: 0,
});

interface DraftWorkflowSummary {
  lineCount: number;
  requestedUnits: number;
  availableUnits: number;
  shortUnits: number;
  selectedSkuLines: number;
  nextStep: string;
  nextDetail: string;
}

interface OrderWorkflowSummary {
  requestedUnits: number;
  reservedUnits: number;
  shortUnits: number;
  packageLotCount: number;
  logisticsEligible: boolean;
  nextStep: string;
  nextDetail: string;
}

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

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const toTrimmedString = (value: unknown): string | null => {
  const text = toStringValue(value).trim();
  return text.length > 0 ? text : null;
};

const getOrderLogisticsHref = (orderId: string): string =>
  `/ops/logistics?orderId=${encodeURIComponent(orderId)}&source=orders`;

const isOrderSubmitEligible = (status: OrderStatus): boolean =>
  status === 'draft' || status === 'submitted' || status === 'backordered' || status === 'partially_reserved';

const buildDraftWorkflowSummary = (
  items: FormLineItem[],
  missingVerifiedCertificate: boolean
): DraftWorkflowSummary => {
  const normalizedItems = items.filter(
    (item) => item.item_name.trim().length > 0 || item.sku_id.trim().length > 0
  );
  const requestedUnits = normalizedItems.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0);
  const availableUnits = normalizedItems.reduce((sum, item) => {
    const requested = Math.max(0, Number(item.qty) || 0);
    const available = Math.max(0, Number(item.availability?.availableQty ?? 0));
    return sum + Math.min(requested, available);
  }, 0);
  const shortUnits = normalizedItems.reduce((sum, item) => {
    const requested = Math.max(0, Number(item.qty) || 0);
    const available = Math.max(0, Number(item.availability?.availableQty ?? 0));
    return sum + Math.max(0, requested - available);
  }, 0);
  const selectedSkuLines = normalizedItems.filter((item) => item.sku_id.trim().length > 0).length;

  if (missingVerifiedCertificate) {
    return {
      lineCount: normalizedItems.length,
      requestedUnits,
      availableUnits,
      shortUnits,
      selectedSkuLines,
      nextStep: 'Verify certificate',
      nextDetail: 'OPS will block resale-exempt wholesale orders until the certificate on file is verified.',
    };
  }

  if (normalizedItems.length === 0 || selectedSkuLines === 0) {
    return {
      lineCount: normalizedItems.length,
      requestedUnits,
      availableUnits,
      shortUnits,
      selectedSkuLines,
      nextStep: 'Finish the draft',
      nextDetail: 'Select OS-backed SKUs for each line so OPS can check availability and traceability before submit.',
    };
  }

  if (shortUnits > 0) {
    return {
      lineCount: normalizedItems.length,
      requestedUnits,
      availableUnits,
      shortUnits,
      selectedSkuLines,
      nextStep: 'Review shortages',
      nextDetail: 'One or more lines are short against OS availability. Adjust quantity or submit knowing OPS may return partial reservation/backorder status.',
    };
  }

  return {
    lineCount: normalizedItems.length,
    requestedUnits,
    availableUnits,
    shortUnits,
    selectedSkuLines,
    nextStep: 'Submit to OS',
    nextDetail: 'This order is ready for reservation. Save it as a draft or submit it now to reserve inventory and unlock logistics staging.',
  };
};

const buildOrderWorkflowSummary = (order: Order): OrderWorkflowSummary => {
  const requestedUnits = order.lineItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const reservedUnits = order.lineItems.reduce((sum, item) => sum + Math.max(0, Number(item.reservedQty ?? 0) || 0), 0);
  const shortUnits = order.lineItems.reduce((sum, item) => sum + Math.max(0, Number(item.shortQty ?? 0) || 0), 0);
  const packageLotCount = order.lineItems.reduce((sum, item) => {
    const traceLots = new Set<string>();
    if (item.packageLotCode?.trim()) {
      traceLots.add(item.packageLotCode.trim());
    }
    item.availabilitySnapshot?.lotBreakdown?.forEach((entry) => {
      const nextCode = (entry.packageLotCode ?? '').trim();
      if (nextCode) {
        traceLots.add(nextCode);
      }
    });
    return sum + traceLots.size;
  }, 0);
  const logisticsEligible =
    order.status === 'reserved' || order.status === 'partially_reserved' || order.status === 'ready_to_fulfill';

  switch (order.status) {
    case 'draft':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Submit to OS',
        nextDetail: 'This order is still a draft. Submit it so OPS can reserve inventory and return a buildable status.',
      };
    case 'submitted':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Waiting on reservation',
        nextDetail: 'OPS has handed this order to OS for inventory checks. Refresh after reservation responses land.',
      };
    case 'backordered':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Review backorder',
        nextDetail:
          'OS could not fully reserve this order. Adjust quantities or resubmit when more product is available.',
      };
    case 'partially_reserved':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Build partial shipment',
        nextDetail:
          'OPS has reserved part of this order. Open logistics to build the reserved units and keep the shortage visible.',
      };
    case 'reserved':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Stage in logistics',
        nextDetail: 'Inventory is reserved. Move this order into the logistics canvas and let OPS suggest cases, pallets, and a truck.',
      };
    case 'ready_to_fulfill':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Load truck and deliver',
        nextDetail: 'This order is ready for truck assignment, delivery documents, and final handoff to the driver workflow.',
      };
    case 'fulfilled':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Complete',
        nextDetail: 'The order has been fulfilled. Use delivery tracking and invoicing for the closing steps.',
      };
    case 'cancelled':
      return {
        requestedUnits,
        reservedUnits,
        shortUnits,
        packageLotCount,
        logisticsEligible,
        nextStep: 'Cancelled',
        nextDetail: 'This order is no longer active in the OPS fulfillment flow.',
      };
  }
};

const normalizeSiteId = (value: string | undefined): string => normalizeOsSiteId(value);

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const formatStatusLabel = (status: OrderStatus): string =>
  status.replace(/_/g, ' ');

const parseAvailabilitySnapshot = (payload: unknown): FormLineItem['availability'] | null => {
  if (!isRecord(payload)) {
    return null;
  }
  const availableQty = toNumber(payload.availableQty, Number.NaN);
  const onHandQty = toNumber(payload.onHandQty, Number.NaN);
  const allocatedQty = toNumber(payload.allocatedQty, Number.NaN);
  const uom = toTrimmedString(payload.uom) ?? 'units';
  if (!Number.isFinite(availableQty) || !Number.isFinite(onHandQty) || !Number.isFinite(allocatedQty)) {
    return null;
  }
  return {
    availableQty: Math.max(0, availableQty),
    onHandQty: Math.max(0, onHandQty),
    allocatedQty: Math.max(0, allocatedQty),
    uom,
    asOf: toTrimmedString(payload.asOf) ?? undefined,
    lotBreakdown: Array.isArray(payload.lotBreakdown)
      ? payload.lotBreakdown
          .filter(isRecord)
          .map((entry) => ({
            lotId: toStringValue(entry.lotId),
            packageLotId: toTrimmedString(entry.packageLotId ?? entry.lotId) ?? undefined,
            packageLotCode: toTrimmedString(entry.packageLotCode) ?? undefined,
            batchId: toTrimmedString(entry.batchId) ?? undefined,
            batchCode: toTrimmedString(entry.batchCode) ?? undefined,
            assetId: toTrimmedString(entry.assetId) ?? undefined,
            assetCode: toTrimmedString(entry.assetCode) ?? undefined,
            availableQty: Math.max(0, toNumber(entry.availableQty)),
            expiresAt: toTrimmedString(entry.expiresAt) ?? undefined,
          }))
      : undefined,
  };
};

const toSiteIdFromName = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? `site-${slug}` : '';
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeStatus = (value: unknown): OrderStatus => {
  if (typeof value === 'string') {
    if (ORDER_STATUS_SET.has(value as OrderStatus)) {
      return value as OrderStatus;
    }
    switch (value) {
      case 'confirmed':
        return 'submitted';
      case 'approved':
        return 'reserved';
      case 'in-packing':
      case 'packed':
      case 'loaded':
        return 'ready_to_fulfill';
      case 'in-delivery':
      case 'delivered':
        return 'fulfilled';
      case 'canceled':
        return 'cancelled';
      default:
        break;
    }
  }
  return 'draft';
};

const normalizeLineItems = (value: unknown): LineItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item, index) => {
      const quantity = Math.max(0, toNumber(item.quantity ?? item.qty, 0));
      const unitPrice = toNumber(item.unit_price ?? item.unitPrice ?? item.price, 0);
      const totalPrice =
        toNumber(item.total_price ?? item.totalPrice ?? item.total, quantity * unitPrice);

      const productName =
        toStringValue(item.product_name) ||
        toStringValue(item.productName) ||
        toStringValue(item.item_name) ||
        `Line Item ${index + 1}`;
      const availabilitySnapshotRaw = item.availability_snapshot ?? item.availabilitySnapshot;
      const availabilitySnapshot = isRecord(availabilitySnapshotRaw)
        ? availabilitySnapshotRaw
        : null;

      return {
        id: toStringValue(item.id) || `line-${index}`,
        productId: toStringValue(item.product_id || item.productId),
        productCode: toStringValue(item.product_code || item.productCode),
        skuId: toStringValue(item.sku_id || item.skuId),
        productName,
        containerTypeId: toStringValue(item.container_type_id || item.containerTypeId),
        containerType: toStringValue(item.container_type || item.containerType),
        packageType: toStringValue(item.package_type || item.packageType),
        packageFormatCode: toStringValue(item.package_format_code || item.packageFormatCode),
        batchId: toStringValue(item.batch_id || item.batchId),
        batchCode: toStringValue(item.batch_code || item.batchCode),
        packageLotId: toStringValue(item.package_lot_id || item.packageLotId),
        packageLotCode: toStringValue(item.package_lot_code || item.packageLotCode),
        assetId: toStringValue(item.asset_id || item.assetId || item.kegAssetId),
        assetCode: toStringValue(item.asset_code || item.assetCode),
        uom: toStringValue(item.uom),
        siteId: toStringValue(item.site_id || item.siteId),
        quantity,
        unitPrice,
        totalPrice,
        reservedQty: toNumber(item.reserved_qty ?? item.reservedQty, 0),
        shortQty: toNumber(item.short_qty ?? item.shortQty, 0),
        reservationId: toStringValue(item.reservation_id || item.reservationId),
        reservationStatus: toStringValue(item.reservation_status || item.reservationStatus) as LineItem['reservationStatus'],
        reservationReasonCode: toStringValue(item.reservation_reason_code || item.reservationReasonCode),
        reservationReasonMessage: toStringValue(item.reservation_reason_message || item.reservationReasonMessage),
        availabilitySnapshot: availabilitySnapshot
          ? {
              onHandQty: toNumber(availabilitySnapshot.onHandQty),
              allocatedQty: toNumber(availabilitySnapshot.allocatedQty),
              availableQty: toNumber(availabilitySnapshot.availableQty),
              uom: toStringValue(availabilitySnapshot.uom),
              asOf: toStringValue(availabilitySnapshot.asOf),
              lotBreakdown: Array.isArray(availabilitySnapshot.lotBreakdown)
                ? availabilitySnapshot.lotBreakdown
                    .filter(isRecord)
                    .map((entry) => ({
                      lotId: toStringValue(entry.lotId),
                      packageLotId: toStringValue(entry.packageLotId || entry.lotId),
                      packageLotCode: toStringValue(entry.packageLotCode),
                      batchId: toStringValue(entry.batchId),
                      batchCode: toStringValue(entry.batchCode),
                      assetId: toStringValue(entry.assetId),
                      assetCode: toStringValue(entry.assetCode),
                      availableQty: toNumber(entry.availableQty),
                      expiresAt: toStringValue(entry.expiresAt),
                    }))
                : undefined,
            }
          : undefined,
        item_name: productName,
        qty: quantity,
        price: unitPrice,
      };
    });
};

const normalizeOrdersPayload = (payload: unknown): Order[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(isRecord)
    .map((order, index) => {
      const id = toStringValue(order.id, `order-${index + 1}`);
      const orderDate =
        toStringValue(order.order_date) ||
        toStringValue(order.orderDate) ||
        toStringValue(order.created_at) ||
        new Date().toISOString();

      const lineItems = normalizeLineItems(order.lineItems ?? order.line_items);

      return {
        id,
        orderNumber: toStringValue(order.orderNumber || order.order_number || order.id),
        customerId: toStringValue(order.customer_id || order.customerId),
        siteId: toStringValue(order.site_id || order.siteId, 'main'),
        customer_name:
          toStringValue(order.customer_name) ||
          toStringValue(order.customerName) ||
          'Unknown Customer',
        order_date: orderDate,
        delivery_date: toStringValue(order.delivery_date || order.deliveryDate),
        status: normalizeStatus(order.status),
        total_amount: toNumber(order.total_amount ?? order.total, 0),
        taxAmount: toNumber(order.tax_amount ?? order.tax, 0),
        taxProfileSnapshot: buildOpsTaxProfileSnapshot(
          order.taxProfileSnapshot ?? order.tax_profile_snapshot
        ),
        lineItems,
        notes: toStringValue(order.notes),
        createdAt: toStringValue(order.created_at || order.createdAt || orderDate),
        updatedAt: toStringValue(order.updated_at || order.updatedAt),
      };
    });
};

const orderToFormLineItems = (order: Order): FormLineItem[] => {
  if (!Array.isArray(order.lineItems) || order.lineItems.length === 0) {
    return [defaultFormLineItem()];
  }

  return order.lineItems.map((item) => ({
    product_id: item.productId || '',
    product_code: item.productCode || '',
    sku_id: item.skuId || '',
    item_name: item.productName || item.item_name || 'Unknown Product',
    container_type: item.containerType || 'Package',
    package_type: item.packageType || '',
    package_format_code: item.packageFormatCode || '',
    uom: item.uom || item.availabilitySnapshot?.uom || 'units',
    qty: Math.max(1, Number(item.quantity ?? item.qty ?? 1)),
    price: Number(item.unitPrice ?? item.price ?? 0),
    availability:
      item.availabilitySnapshot && typeof item.availabilitySnapshot.availableQty === 'number'
        ? {
            availableQty: Math.max(0, Number(item.availabilitySnapshot.availableQty)),
            onHandQty: Math.max(0, Number(item.availabilitySnapshot.onHandQty ?? 0)),
            allocatedQty: Math.max(0, Number(item.availabilitySnapshot.allocatedQty ?? 0)),
            uom: item.availabilitySnapshot.uom || item.uom || 'units',
            asOf: item.availabilitySnapshot.asOf,
            lotBreakdown: item.availabilitySnapshot.lotBreakdown,
          }
        : undefined,
    availabilityKey: item.skuId
      ? buildSiteSkuKey(item.skuId, item.siteId || order.siteId || 'main')
      : undefined,
  }));
};

export default function Orders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<SellableCatalogItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<OsProductCatalogRecord[]>([]);
  const [packageLots, setPackageLots] = useState<OsPackageLotRecord[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>(defaultFormData);
  const [lineItems, setLineItems] = useState<FormLineItem[]>([defaultFormLineItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [lineValidationErrors, setLineValidationErrors] = useState<Record<number, string>>({});
  const customerFilterId = searchParams.get('customerId')?.trim() ?? '';

  const customerOptions = useMemo<CustomerOption[]>(() => {
    const map = new Map<string, CustomerOption>();

    getOpsClientRecords().forEach((record) => {
      if (!record.id || !record.name) {
        return;
      }
      map.set(record.id, {
        id: record.id,
        name: record.name,
      });
    });

    orders.forEach((order) => {
      const derivedId = order.customerId || toSiteIdFromName(order.customer_name);
      if (!derivedId || map.has(derivedId)) {
        return;
      }
      map.set(derivedId, {
        id: derivedId,
        name: order.customer_name || derivedId,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const selectedClientRecord = useMemo(() => {
    if (formData.customer_id?.trim()) {
      return getOpsClientRecord(formData.customer_id.trim());
    }
    return null;
  }, [formData.customer_id]);

  const activeTaxProfile = useMemo(
    () =>
      buildOpsTaxProfileSnapshot(
        selectedClientRecord?.taxProfile ?? editingOrder?.taxProfileSnapshot ?? undefined
      ),
    [editingOrder?.taxProfileSnapshot, selectedClientRecord]
  );

  const subtotalPreview = useMemo(
    () => lineItems.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0) * Math.max(0, Number(item.price) || 0), 0),
    [lineItems]
  );

  const taxPreview = useMemo(
    () => calculateOpsTaxAmount(subtotalPreview, activeTaxProfile),
    [activeTaxProfile, subtotalPreview]
  );

  const totalPreview = useMemo(() => subtotalPreview + taxPreview, [subtotalPreview, taxPreview]);
  const missingVerifiedCertificate =
    activeTaxProfile.taxTreatment === 'resale_exempt' &&
    activeTaxProfile.certificateStatus !== 'verified';

  useEffect(() => {
    const customerName = searchParams.get('customer');
    const customerId = searchParams.get('customerId');
    if (!customerName) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      customer_id: customerId ?? prev.customer_id,
      customer_name: customerName || prev.customer_name,
    }));
    setIsCreateOpen(true);
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      await loadOpsCrmState();
      await Promise.all([fetchOrders(), fetchSellableCatalog()]);
    })();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await apiGet<unknown>('/api/orders');
      setOrders(normalizeOrdersPayload(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellableCatalog = async () => {
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const [inventoryResult, productsResult, packageLotsResult] = await Promise.allSettled([
        apiGet<unknown>('/api/os/inventory'),
        apiGet<unknown>('/api/os/products'),
        apiGet<unknown>('/api/os/package-lots?status=active'),
      ]);

      if (inventoryResult.status !== 'fulfilled') {
        throw inventoryResult.reason;
      }

      const inventoryItems = parseOsInventoryCatalog(inventoryResult.value);
      const products = productsResult.status === 'fulfilled' ? parseOsProductCatalog(productsResult.value) : [];
      const lots = packageLotsResult.status === 'fulfilled' ? parseOsPackageLots(packageLotsResult.value) : [];

      const blockedCategories = new Set(['yeast', 'malt', 'hops', 'fruit', 'equipment']);
      const sellableCatalog = buildOsSellableCatalog(inventoryItems, products, lots);
      const preferredItems = sellableCatalog.filter(
        (item) => !blockedCategories.has(item.category.toLowerCase())
      );

      setCatalogItems(preferredItems.length > 0 ? preferredItems : sellableCatalog);
      setProductCatalog(products);
      setPackageLots(lots);

      const warnings: string[] = [];
      if (productsResult.status !== 'fulfilled') {
        warnings.push('product identity metadata unavailable');
      }
      if (packageLotsResult.status !== 'fulfilled') {
        warnings.push('package-lot lineage unavailable');
      }
      setCatalogError(warnings.length > 0 ? warnings.join('; ') : null);
    } catch (catalogLoadError) {
      setCatalogItems([]);
      setProductCatalog([]);
      setPackageLots([]);
      setCatalogError(
        catalogLoadError instanceof Error ? catalogLoadError.message : 'Failed to load OS sellable catalog.'
      );
    } finally {
      setCatalogLoading(false);
    }
  };

  const refreshLineAvailability = async (lineIndex: number, skuId: string, siteId: string): Promise<void> => {
    const normalizedSkuId = skuId.trim();
    if (!normalizedSkuId) {
      return;
    }
    const normalizedSiteId = normalizeSiteId(siteId);
    const availabilityKey = buildSiteSkuKey(normalizedSkuId, normalizedSiteId);

    setLineItems((prev) =>
      prev.map((line, index) =>
        index === lineIndex
          ? {
              ...line,
              availabilityLoading: true,
              availabilityError: undefined,
              availabilityKey,
            }
          : line
      )
    );

    try {
      const payload = await apiGet<unknown>(
        `/api/os/availability?skuId=${encodeURIComponent(normalizedSkuId)}&siteId=${encodeURIComponent(normalizedSiteId)}`
      );
      const snapshot = parseAvailabilitySnapshot(payload);
      if (!snapshot) {
        throw new Error('OS availability response was invalid.');
      }
      setLineItems((prev) =>
        prev.map((line, index) =>
          index === lineIndex
            ? {
                ...line,
                availability: snapshot,
                availabilityError: undefined,
                availabilityLoading: false,
                availabilityKey,
                uom: line.uom || snapshot.uom || 'units',
              }
            : line
        )
      );
    } catch (availabilityError) {
      setLineItems((prev) =>
        prev.map((line, index) =>
          index === lineIndex
            ? {
                ...line,
                availabilityLoading: false,
                availability: undefined,
                availabilityError:
                  availabilityError instanceof Error
                    ? availabilityError.message
                    : 'Failed to load OS availability.',
                availabilityKey,
              }
            : line
        )
      );
    }
  };

  const normalizeEditableLineItems = (): {
    normalized: FormLineItem[];
    errors: Record<number, string>;
  } => {
    const errors: Record<number, string> = {};
    const normalized = lineItems.map((item, index) => {
      const skuId = item.sku_id.trim();
      const itemName = item.item_name.trim();
      const qty = Math.max(0, Number(item.qty) || 0);
      const price = Math.max(0, Number(item.price) || 0);
      const uom = item.uom.trim() || 'units';
      const containerType = item.container_type.trim() || 'Package';

      if (!skuId) {
        errors[index] = 'Select a product from OS catalog.';
      } else if (!itemName) {
        errors[index] = 'Selected product name is missing.';
      } else if (qty <= 0) {
        errors[index] = 'Quantity must be greater than zero.';
      }

      return {
        ...item,
        product_id: item.product_id.trim(),
        product_code: item.product_code.trim(),
        sku_id: skuId,
        item_name: itemName,
        qty,
        price,
        uom,
        container_type: containerType,
        package_type: item.package_type.trim(),
        package_format_code: item.package_format_code.trim(),
      };
    });

    return { normalized, errors };
  };

  const toOrderPayloadLineItems = (items: FormLineItem[], siteId: string) => {
    const normalizedSiteId = normalizeSiteId(siteId);
    return items.map((item) => ({
      sku_id: item.sku_id,
      product_id: item.product_id.trim() || undefined,
      product_code: item.product_code.trim() || undefined,
      product_name: item.item_name,
      item_name: item.item_name,
      container_type: item.container_type || 'Package',
      container_type_id: `container-${slugify(item.container_type || 'package')}`,
      package_type: item.package_type.trim() || undefined,
      package_format_code: item.package_format_code.trim() || undefined,
      quantity: item.qty,
      qty: item.qty,
      uom: item.uom || 'units',
      site_id: normalizedSiteId,
      siteId: normalizedSiteId,
      unit_price: item.price,
      price: item.price,
      total_price: item.qty * item.price,
      total: item.qty * item.price,
    }));
  };

  const handleCreateOrder = async (mode: OrderSaveMode = 'draft') => {
    try {
      setSubmitting(true);

      const { normalized, errors: lineErrors } = normalizeEditableLineItems();
      setLineValidationErrors(lineErrors);
      if (!formData.customer_name.trim()) {
        globalThis.alert?.('Customer name is required.');
        return;
      }
      if (missingVerifiedCertificate) {
        globalThis.alert?.('Resale-exempt orders require a verified certificate on file.');
        return;
      }
      if (Object.keys(lineErrors).length > 0 || normalized.length === 0) {
        globalThis.alert?.('Fix line item errors before creating the order.');
        return;
      }

      const subtotal = normalized.reduce((sum, item) => sum + item.qty * item.price, 0);
      const taxAmount = calculateOpsTaxAmount(subtotal, activeTaxProfile);
      const total = subtotal + taxAmount;
      await apiPost('/api/orders', {
        ...formData,
        status: mode === 'submit' ? 'submitted' : formData.status,
        customer_id: formData.customer_id?.trim() || undefined,
        site_id: normalizeSiteId(formData.site_id),
        line_items: toOrderPayloadLineItems(normalized, formData.site_id),
        subtotal,
        tax_amount: taxAmount,
        tax_profile_snapshot: buildOpsTaxProfileSnapshot(activeTaxProfile),
        total,
      }, {
        headers: createIdempotencyHeaders('ops-orders-create'),
      });

      await fetchOrders();
      setIsCreateOpen(false);
      resetForm();
      if (mode === 'submit') {
        globalThis.alert?.('Order created and submitted. OPS refreshed reservation status from OS.');
      }
    } catch (err) {
      globalThis.alert?.(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrder = async (mode: OrderSaveMode = 'draft') => {
    if (!editingOrder) {
      return;
    }

    try {
      setSubmitting(true);

      const { normalized, errors: lineErrors } = normalizeEditableLineItems();
      setLineValidationErrors(lineErrors);
      if (!formData.customer_name.trim()) {
        globalThis.alert?.('Customer name is required.');
        return;
      }
      if (missingVerifiedCertificate) {
        globalThis.alert?.('Resale-exempt orders require a verified certificate on file.');
        return;
      }
      if (Object.keys(lineErrors).length > 0 || normalized.length === 0) {
        globalThis.alert?.('Fix line item errors before updating the order.');
        return;
      }

      const subtotal = normalized.reduce((sum, item) => sum + item.qty * item.price, 0);
      const taxAmount = calculateOpsTaxAmount(subtotal, activeTaxProfile);
      const total = subtotal + taxAmount;
      await apiPatch(`/api/orders/${editingOrder.id}`, {
        ...formData,
        status: mode === 'submit' ? 'submitted' : formData.status,
        customer_id: formData.customer_id?.trim() || undefined,
        site_id: normalizeSiteId(formData.site_id),
        line_items: toOrderPayloadLineItems(normalized, formData.site_id),
        subtotal,
        tax_amount: taxAmount,
        tax_profile_snapshot: buildOpsTaxProfileSnapshot(activeTaxProfile),
        total,
      }, {
        headers: createIdempotencyHeaders(`ops-orders-update-${editingOrder.id}`),
      });

      await fetchOrders();
      setEditingOrder(null);
      resetForm();
      if (mode === 'submit') {
        globalThis.alert?.('Order updated and submitted. OPS refreshed reservation status from OS.');
      }
    } catch (err) {
      globalThis.alert?.(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await apiDelete(`/api/orders/${orderId}`);
      await fetchOrders();
    } catch (err) {
      globalThis.alert?.(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  const handleSubmitOrder = async (orderId: string) => {
    if (!globalThis.confirm?.('Submit this order to OS for reservation and availability checks?')) {
      return;
    }

    try {
      await apiPatch(`/api/orders/${orderId}`, {
        status: 'submitted',
      }, {
        headers: createIdempotencyHeaders(`ops-orders-submit-${orderId}`),
      });
      await fetchOrders();
      globalThis.alert?.('Order submitted. OPS refreshed reservation status from OS.');
    } catch (err) {
      globalThis.alert?.(err instanceof Error ? err.message : 'Failed to submit order');
    }
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customerId || toSiteIdFromName(order.customer_name),
      customer_name: order.customer_name,
      site_id: normalizeSiteId(order.siteId),
      order_date: order.order_date?.slice(0, 10) || new Date().toISOString().split('T')[0],
      status: order.status,
    });
    setLineValidationErrors({});
    setLineItems(orderToFormLineItems(order));
  };

  const resetForm = () => {
    setFormData(defaultFormData());
    setLineItems([defaultFormLineItem()]);
    setLineValidationErrors({});
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, defaultFormLineItem()]);
    setLineValidationErrors({});
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setLineValidationErrors({});
  };

  const updateLineItem = (index: number, field: keyof FormLineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
    setLineValidationErrors((prev) => {
      if (!(index in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const selectCatalogLineItem = (index: number, catalogItem: SellableCatalogItem) => {
    const siteId = normalizeSiteId(formData.site_id);
    const availabilityKey = buildSiteSkuKey(catalogItem.skuId, siteId);
    setLineItems((prev) => {
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        product_id: catalogItem.productId ?? current.product_id,
        product_code: catalogItem.productCode ?? current.product_code,
        sku_id: catalogItem.skuId,
        item_name: catalogItem.name,
        container_type: catalogItem.packageType || current.container_type || 'Package',
        package_type: catalogItem.packageType ?? current.package_type,
        package_format_code: catalogItem.packageFormatCode ?? current.package_format_code,
        uom: catalogItem.uom || current.uom || 'units',
        price:
          (Number(current.price) || 0) > 0
            ? Number(current.price) || 0
            : catalogItem.defaultUnitPrice > 0
              ? catalogItem.defaultUnitPrice
              : 0,
        availability: {
          availableQty: catalogItem.availableQty,
          onHandQty: catalogItem.onHandQty,
          allocatedQty: catalogItem.allocatedQty,
          uom: catalogItem.uom,
          lotBreakdown: catalogItem.packageLots.map((lot) => ({
            lotId: lot.packageLotId,
            packageLotId: lot.packageLotId,
            packageLotCode: lot.packageLotCode,
            batchId: lot.batchId,
            batchCode: lot.batchCode,
            assetId: lot.assetId,
            assetCode: lot.assetCode,
            availableQty: lot.availableUnits,
            expiresAt: undefined,
          })),
        },
        availabilityError: undefined,
        availabilityLoading: false,
        availabilityKey,
      };
      return next;
    });
    setLineValidationErrors((prev) => {
      if (!(index in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[index];
      return next;
    });
    void refreshLineAvailability(index, catalogItem.skuId, siteId);
  };

  const selectedSiteId = normalizeSiteId(formData.site_id);
  const productBySku = useMemo(() => buildProductLookupBySku(productCatalog), [productCatalog]);
  const packageLotsBySkuSite = useMemo(() => groupPackageLotsBySkuSite(packageLots), [packageLots]);
  const siteCatalogItems = useMemo(
    () => catalogItems.filter((item) => normalizeSiteId(item.siteId) === selectedSiteId),
    [catalogItems, selectedSiteId]
  );
  const siteOptions = useMemo(() => {
    const options = new Set<string>(['main']);
    catalogItems.forEach((item) => options.add(normalizeSiteId(item.siteId)));
    orders.forEach((order) => {
      if (order.siteId) {
        options.add(normalizeSiteId(order.siteId));
      }
    });
    if (formData.site_id) {
      options.add(normalizeSiteId(formData.site_id));
    }
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [catalogItems, formData.site_id, orders]);

  useEffect(() => {
    lineItems.forEach((item, index) => {
      const skuId = item.sku_id.trim();
      if (!skuId) {
        return;
      }
      const targetKey = buildSiteSkuKey(skuId, selectedSiteId);
      if (item.availabilityLoading || item.availabilityKey === targetKey) {
        return;
      }
      void refreshLineAvailability(index, skuId, selectedSiteId);
    });
  }, [lineItems, selectedSiteId]);

  const applyDatePreset = (preset: DateRangePreset) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset === 'all') {
      setStartDate(undefined);
      setEndDate(undefined);
      setDatePreset('all');
      return;
    }

    if (preset === 'today') {
      setStartDate(startOfToday);
      setEndDate(startOfToday);
      setDatePreset('today');
      return;
    }

    if (preset === 'week') {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - 6);
      setStartDate(startOfWeek);
      setEndDate(startOfToday);
      setDatePreset('week');
      return;
    }

    if (preset === 'custom') {
      setDatePreset('custom');
      return;
    }

    const startOfMonth = new Date(startOfToday);
    startOfMonth.setDate(startOfToday.getDate() - 29);
    setStartDate(startOfMonth);
    setEndDate(startOfToday);
    setDatePreset('month');
  };

  const stats = useMemo(() => {
    return {
      total: orders.length,
      actionRequired: orders.filter((order) => ACTION_REQUIRED_STATUSES.includes(order.status)).length,
      inFlight: orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length,
      fulfilled: orders.filter((order) => order.status === 'fulfilled').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
      fulfilledRevenue: orders
        .filter((order) => order.status === 'fulfilled')
        .reduce((sum, order) => sum + toNumber(order.total_amount), 0),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedCustomerFilterId = customerFilterId.toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.orderNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const orderDate = new Date(order.order_date);
      const orderTime = orderDate.getTime();
      const startBoundary = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0).getTime()
        : undefined;
      const endBoundary = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime()
        : undefined;
      const matchesStartDate = startBoundary === undefined || orderTime >= startBoundary;
      const matchesEndDate = endBoundary === undefined || orderTime <= endBoundary;

      const orderCustomerId = (order.customerId || '').toLowerCase();
      const fallbackCustomerId = toSiteIdFromName(order.customer_name).toLowerCase();
      const matchesCustomerContext =
        normalizedCustomerFilterId.length === 0
        || orderCustomerId === normalizedCustomerFilterId
        || fallbackCustomerId === normalizedCustomerFilterId;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate && matchesCustomerContext;
    });
  }, [orders, searchQuery, statusFilter, startDate, endDate, customerFilterId]);

  const actionOrders = filteredOrders.filter((order) => ACTION_REQUIRED_STATUSES.includes(order.status));
  const activeOrders = filteredOrders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const fulfilledOrders = filteredOrders.filter((order) => order.status === 'fulfilled');
  const workflowCounts = useMemo(
    () => ({
      drafts: filteredOrders.filter((order) => order.status === 'draft').length,
      waitingOnOs: filteredOrders.filter((order) => order.status === 'submitted').length,
      readyForBuild: filteredOrders.filter((order) => buildOrderWorkflowSummary(order).logisticsEligible).length,
      truckReady: filteredOrders.filter((order) => order.status === 'ready_to_fulfill').length,
    }),
    [filteredOrders]
  );

  if (loading) {
    return (
      <AppShell currentSuite="ops">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading orders...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentSuite="ops">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="mt-1 text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.actionRequired}</div>
              <p className="mt-1 text-xs text-muted-foreground">Draft + submitted + backordered</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Flight</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.inFlight}</div>
              <p className="mt-1 text-xs text-muted-foreground">Reserved through fulfillment prep</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fulfilled Revenue</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${stats.fulfilledRevenue.toFixed(2)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stats.fulfilled} fulfilled</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders Management</h1>
            <p className="mt-1 text-muted-foreground">Manage customer orders and fulfillment lifecycle</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <OrderFormBody
                formData={formData}
                setFormData={setFormData}
                customerOptions={customerOptions}
                siteOptions={siteOptions}
                catalogItems={siteCatalogItems}
                catalogLoading={catalogLoading}
                catalogError={catalogError}
                lineItems={lineItems}
                lineValidationErrors={lineValidationErrors}
                addLineItem={addLineItem}
                removeLineItem={removeLineItem}
                updateLineItem={updateLineItem}
                selectCatalogLineItem={selectCatalogLineItem}
                taxProfile={activeTaxProfile}
                subtotal={subtotalPreview}
                taxAmount={taxPreview}
                total={totalPreview}
                missingVerifiedCertificate={missingVerifiedCertificate}
                showStatusField={false}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleCreateOrder('draft')}
                  disabled={submitting || missingVerifiedCertificate}
                >
                  {submitting ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button onClick={() => void handleCreateOrder('submit')} disabled={submitting || missingVerifiedCertificate}>
                  {submitting ? 'Submitting...' : 'Create + Submit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or order #"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(value) => {
                      setStartDate(value);
                      setDatePreset('custom');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(value) => {
                      setEndDate(value);
                      setDatePreset('custom');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant={datePreset === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyDatePreset('all')}
              >
                All
              </Button>
              <Button
                variant={datePreset === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyDatePreset('today')}
              >
                Day
              </Button>
              <Button
                variant={datePreset === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyDatePreset('week')}
              >
                Week
              </Button>
              <Button
                variant={datePreset === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyDatePreset('month')}
              >
                Month
              </Button>
              <Button
                variant={datePreset === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyDatePreset('custom')}
              >
                Custom
              </Button>
              {customerFilterId && (
                <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                  Location filter: {customerFilterId}
                </Badge>
              )}
            </div>

            {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    applyDatePreset('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">OPS Order Flow</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">1. Draft Orders</p>
                    <p className="mt-1 text-2xl font-semibold">{workflowCounts.drafts}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Finish client, site, and SKU selection before submit.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">2. Waiting On OS</p>
                    <p className="mt-1 text-2xl font-semibold">{workflowCounts.waitingOnOs}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Submitted orders are checking reservation status and shortages.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">3. Ready For Build</p>
                    <p className="mt-1 text-2xl font-semibold">{workflowCounts.readyForBuild}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Reserved orders can move into cases, pallets, and truck staging.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">4. Truck Ready</p>
                    <p className="mt-1 text-2xl font-semibold">{workflowCounts.truckReady}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use the truck board for payload QR, delivery sheets, and dispatch.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <p className="text-sm font-semibold text-cyan-100">Quick Handoff</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Jump straight from order review into packaging or truck planning without hunting through OPS.
                </p>
                <div className="mt-4 space-y-2">
                  <Button asChild className="w-full justify-between">
                    <Link to="/ops/logistics">
                      <span className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Open Logistics Canvas
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/ops/logistics/trucks">
                      <span className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Open Truck Board
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-card/50 backdrop-blur">
            <TabsTrigger value="all">All ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="action">Needs Action ({actionOrders.length})</TabsTrigger>
            <TabsTrigger value="active">In Flight ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled ({fulfilledOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <OrderList
              orders={filteredOrders}
              productBySku={productBySku}
              packageLotsBySkuSite={packageLotsBySkuSite}
              onEdit={openEditModal}
              onDelete={handleDeleteOrder}
              onSubmit={handleSubmitOrder}
            />
          </TabsContent>

          <TabsContent value="action" className="space-y-4">
            <OrderList
              orders={actionOrders}
              productBySku={productBySku}
              packageLotsBySkuSite={packageLotsBySkuSite}
              onEdit={openEditModal}
              onDelete={handleDeleteOrder}
              onSubmit={handleSubmitOrder}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <OrderList
              orders={activeOrders}
              productBySku={productBySku}
              packageLotsBySkuSite={packageLotsBySkuSite}
              onEdit={openEditModal}
              onDelete={handleDeleteOrder}
              onSubmit={handleSubmitOrder}
            />
          </TabsContent>

          <TabsContent value="fulfilled" className="space-y-4">
            <OrderList
              orders={fulfilledOrders}
              productBySku={productBySku}
              packageLotsBySkuSite={packageLotsBySkuSite}
              onEdit={openEditModal}
              onDelete={handleDeleteOrder}
              onSubmit={handleSubmitOrder}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={Boolean(editingOrder)} onOpenChange={(open) => !open && setEditingOrder(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Order #{editingOrder?.orderNumber ?? editingOrder?.id}</DialogTitle>
            </DialogHeader>
            <OrderFormBody
              formData={formData}
              setFormData={setFormData}
              customerOptions={customerOptions}
              siteOptions={siteOptions}
              catalogItems={siteCatalogItems}
              catalogLoading={catalogLoading}
              catalogError={catalogError}
              lineItems={lineItems}
              lineValidationErrors={lineValidationErrors}
              addLineItem={addLineItem}
              removeLineItem={removeLineItem}
              updateLineItem={updateLineItem}
              selectCatalogLineItem={selectCatalogLineItem}
              taxProfile={activeTaxProfile}
              subtotal={subtotalPreview}
              taxAmount={taxPreview}
              total={totalPreview}
              missingVerifiedCertificate={missingVerifiedCertificate}
              showStatusField
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleUpdateOrder('draft')}
                disabled={submitting || missingVerifiedCertificate}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
              {isOrderSubmitEligible(formData.status) && (
                <Button onClick={() => void handleUpdateOrder('submit')} disabled={submitting || missingVerifiedCertificate}>
                  {submitting ? 'Submitting...' : 'Save + Submit'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

interface OrderFormBodyProps {
  formData: OrderFormData;
  setFormData: Dispatch<SetStateAction<OrderFormData>>;
  customerOptions: CustomerOption[];
  siteOptions: string[];
  catalogItems: SellableCatalogItem[];
  catalogLoading: boolean;
  catalogError: string | null;
  lineItems: FormLineItem[];
  lineValidationErrors: Record<number, string>;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  updateLineItem: (index: number, field: keyof FormLineItem, value: string | number) => void;
  selectCatalogLineItem: (index: number, catalogItem: SellableCatalogItem) => void;
  taxProfile: OpsTaxProfileSnapshot;
  subtotal: number;
  taxAmount: number;
  total: number;
  missingVerifiedCertificate: boolean;
  showStatusField: boolean;
}

function OrderFormBody({
  formData,
  setFormData,
  customerOptions,
  siteOptions,
  catalogItems,
  catalogLoading,
  catalogError,
  lineItems,
  lineValidationErrors,
  addLineItem,
  removeLineItem,
  updateLineItem,
  selectCatalogLineItem,
  taxProfile,
  subtotal,
  taxAmount,
  total,
  missingVerifiedCertificate,
  showStatusField,
}: OrderFormBodyProps) {
  const selectedCustomer = customerOptions.find((entry) => entry.id === formData.customer_id);
  const selectedSiteId = normalizeSiteId(formData.site_id);
  const workflowSummary = useMemo(
    () => buildDraftWorkflowSummary(lineItems, missingVerifiedCertificate),
    [lineItems, missingVerifiedCertificate]
  );

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer_id">Existing Client</Label>
          <Select
            value={formData.customer_id && formData.customer_id.length > 0 ? formData.customer_id : 'manual'}
            onValueChange={(value) => {
              if (value === 'manual') {
                setFormData((prev) => ({ ...prev, customer_id: '' }));
                return;
              }
              const option = customerOptions.find((entry) => entry.id === value);
              setFormData((prev) => ({
                ...prev,
                customer_id: value,
                customer_name: option?.name ?? prev.customer_name,
              }));
            }}
          >
            <SelectTrigger id="customer_id">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual entry</SelectItem>
              {customerOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer Name</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(event) =>
              setFormData((prev) => {
                const nextName = event.target.value;
                const keepSelected = selectedCustomer && normalizeText(selectedCustomer.name) === normalizeText(nextName);
                return {
                  ...prev,
                  customer_name: nextName,
                  customer_id: keepSelected ? prev.customer_id : '',
                };
              })
            }
            placeholder="John Smith"
          />
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-4', showStatusField ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        <div className="space-y-2">
          <Label htmlFor="order_date">Order Date</Label>
          <Input
            id="order_date"
            type="date"
            value={formData.order_date}
            onChange={(event) => setFormData((prev) => ({ ...prev, order_date: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site_id">Fulfillment Site</Label>
          <Select
            value={selectedSiteId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, site_id: normalizeSiteId(value) }))}
          >
            <SelectTrigger id="site_id">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {siteOptions.map((siteId) => (
                <SelectItem key={siteId} value={siteId}>
                  {siteId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showStatusField && (
          <div className="space-y-2">
            <Label htmlFor="status">Workflow Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: OrderStatus) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{formatOpsSalesChannel(taxProfile.salesChannel)}</Badge>
            <Badge variant="outline">{formatOpsTaxTreatment(taxProfile.taxTreatment)}</Badge>
            <Badge variant="outline">Tax rate: {(taxProfile.salesTaxRate * 100).toFixed(2)}%</Badge>
            {taxProfile.resaleCertificateNumber && (
              <Badge variant="outline">Resale Cert: {taxProfile.resaleCertificateNumber}</Badge>
            )}
            {taxProfile.sellerPermitNumber && (
              <Badge variant="outline">Seller Permit: {taxProfile.sellerPermitNumber}</Badge>
            )}
          </div>
          {taxProfile.taxTreatment === 'resale_exempt' && !taxProfile.resaleCertificateNumber && (
            <p className="mt-2 text-xs text-amber-300">
              This account is marked resale-exempt, but no resale certificate number is saved yet.
            </p>
          )}
          {missingVerifiedCertificate && (
            <p className="mt-2 text-xs text-red-300">
              This resale-exempt account does not have a verified certificate on file. OPS will block the order until the certificate is verified.
            </p>
          )}
        </div>

        <div className="rounded-md border border-border/60 bg-background/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Fulfillment Readiness</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">
                {selectedCustomer?.name ?? (formData.customer_name || 'Not set')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Site</p>
              <p className="font-medium text-foreground">{selectedSiteId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lines</p>
              <p className="font-medium text-foreground">{workflowSummary.lineCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requested Units</p>
              <p className="font-medium text-foreground">{workflowSummary.requestedUnits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Covered By OS</p>
              <p className="font-medium text-foreground">{workflowSummary.availableUnits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Short Units</p>
              <p className={cn('font-medium', workflowSummary.shortUnits > 0 ? 'text-amber-300' : 'text-foreground')}>
                {workflowSummary.shortUnits}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs">
            <p className="font-medium text-foreground">{workflowSummary.nextStep}</p>
            <p className="mt-1 text-muted-foreground">{workflowSummary.nextDetail}</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>Line Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {catalogError && (
          <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            OS identity metadata: {catalogError}
          </div>
        )}

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={`line-${index}`} className="rounded-md border border-border/60 p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr,1fr,1fr,auto]">
                <div className="min-w-0">
                  <Label className="mb-1 block text-xs text-muted-foreground">Product (OS SKU)</Label>
                  <ProductCombobox
                    items={catalogItems}
                    valueSkuId={item.sku_id}
                    fallbackLabel={item.item_name}
                    loading={catalogLoading}
                    onSelect={(selected) => selectCatalogLineItem(index, selected)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.qty}
                    onChange={(event) => updateLineItem(index, 'qty', parseInt(event.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Unit Price</Label>
                  <Input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(event) => updateLineItem(index, 'price', parseFloat(event.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {item.product_code && <Badge variant="outline">Product Code: {item.product_code}</Badge>}
                <Badge variant="outline">SKU: {item.sku_id || 'not selected'}</Badge>
                {item.package_type && <Badge variant="outline">Package: {item.package_type}</Badge>}
                {item.package_format_code && (
                  <Badge variant="outline">Format: {item.package_format_code}</Badge>
                )}
                <Badge variant="outline">Site: {selectedSiteId}</Badge>
                <Badge variant="outline">UOM: {item.uom || 'units'}</Badge>
                {item.availability?.lotBreakdown && item.availability.lotBreakdown.length > 0 && (
                  <Badge variant="outline">
                    OS Lots: {item.availability.lotBreakdown.filter((entry) => entry.packageLotCode).length}
                  </Badge>
                )}
                {item.availabilityLoading && (
                  <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-200">Checking availability...</Badge>
                )}
                {item.availability && !item.availabilityLoading && (
                  <Badge
                    className={
                      item.availability.availableQty >= Math.max(0, Number(item.qty) || 0)
                        ? 'border-green-500/30 bg-green-500/10 text-green-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }
                  >
                    Available: {item.availability.availableQty} {item.availability.uom}
                  </Badge>
                )}
                {item.availability &&
                  !item.availabilityLoading &&
                  item.availability.availableQty < Math.max(0, Number(item.qty) || 0) && (
                    <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                      Short by {Math.max(0, (Number(item.qty) || 0) - item.availability.availableQty)}{' '}
                      {item.availability.uom}
                    </Badge>
                  )}
                {item.availabilityError && (
                  <Badge className="border-red-500/30 bg-red-500/10 text-red-300">
                    Availability error: {item.availabilityError}
                  </Badge>
                )}
              </div>

              {lineValidationErrors[index] && (
                <p className="mt-2 text-xs text-red-400">{lineValidationErrors[index]}</p>
              )}

              {item.availability?.lotBreakdown && item.availability.lotBreakdown.length > 0 && (
                <div className="mt-2 rounded-md border border-border/60 bg-background/30 px-3 py-2 text-[11px] text-muted-foreground">
                  <p className="font-medium text-foreground">OS Traceability Snapshot</p>
                  <div className="mt-1 space-y-1">
                    {item.availability.lotBreakdown.slice(0, 3).map((entry) => (
                      <p key={`${entry.packageLotId ?? entry.lotId}-${entry.batchCode ?? entry.batchId ?? 'trace'}`}>
                        {entry.packageLotCode ?? entry.packageLotId ?? entry.lotId}
                        {entry.batchCode || entry.batchId
                          ? ` · ${entry.batchCode ?? entry.batchId}`
                          : ''}
                        {entry.assetCode || entry.assetId
                          ? ` · ${entry.assetCode ?? entry.assetId}`
                          : ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total:</span>
            <span className="text-xl font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductComboboxProps {
  items: SellableCatalogItem[];
  valueSkuId: string;
  fallbackLabel?: string;
  loading: boolean;
  onSelect: (item: SellableCatalogItem) => void;
}

function ProductCombobox({ items, valueSkuId, fallbackLabel, loading, onSelect }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.skuId === valueSkuId);
  const label = selected
    ? `${selected.name} (${selected.productCode ?? selected.skuId})`
    : fallbackLabel && fallbackLabel.trim().length > 0
      ? fallbackLabel
      : loading
        ? 'Loading OS products...'
        : 'Select product';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap"
        >
          <span className="truncate text-left">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search product or SKU..." />
          <CommandList>
            <CommandEmpty>{loading ? 'Loading...' : 'No products found for this site.'}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={`${item.siteId}-${item.skuId}`}
                  value={`${item.name} ${item.skuId} ${item.category}`}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      valueSkuId === item.skuId ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.productCode ? `${item.productCode} · ` : ''}
                      {item.skuId} · {item.availableQty} {item.uom} available
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const dedupeCodes = (values: Array<string | undefined>, limit = 3): string[] => {
  const unique: string[] = [];
  values.forEach((value) => {
    const next = (value ?? '').trim();
    if (!next || unique.includes(next)) {
      return;
    }
    unique.push(next);
  });
  return unique.slice(0, limit);
};

interface OrderListProps {
  orders: Order[];
  productBySku: Map<string, OsProductCatalogRecord>;
  packageLotsBySkuSite: Map<string, OsPackageLotRecord[]>;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onSubmit: (orderId: string) => void;
}

function OrderList({ orders, productBySku, packageLotsBySkuSite, onEdit, onDelete, onSubmit }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="py-12 text-center text-muted-foreground">No orders matched this view.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          productBySku={productBySku}
          packageLotsBySkuSite={packageLotsBySkuSite}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubmit={onSubmit}
        />
      ))}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  productBySku: Map<string, OsProductCatalogRecord>;
  packageLotsBySkuSite: Map<string, OsPackageLotRecord[]>;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onSubmit: (orderId: string) => void;
}

function OrderCard({ order, productBySku, packageLotsBySkuSite, onEdit, onDelete, onSubmit }: OrderCardProps) {
  const deliveryEvents = getDeliveryScanEvents(order.id, 'delivered');
  const deliveredCount = deliveryEvents.length;
  const targetCount = order.lineItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity)), 0);
  const lastDelivery = deliveryEvents[deliveryEvents.length - 1];
  const workflowSummary = buildOrderWorkflowSummary(order);
  const deliveryState =
    deliveredCount === 0 ? 'none' : targetCount > 0 && deliveredCount >= targetCount ? 'delivered' : 'partial';

  return (
    <Card className="bg-card/50 backdrop-blur transition-colors hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.customer_name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Order #{order.orderNumber ?? order.id}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge className={statusColors[order.status]}>{formatStatusLabel(order.status)}</Badge>
            {isOrderSubmitEligible(order.status) && (
              <Button variant="default" size="sm" onClick={() => onSubmit(order.id)} className="bg-cyan-600 hover:bg-cyan-700">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Submit
              </Button>
            )}
            {workflowSummary.logisticsEligible && (
              <Button asChild size="sm" variant="outline">
                <Link to={getOrderLogisticsHref(order.id)}>
                  <Layers className="mr-1 h-4 w-4" />
                  Build In Logistics
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(order)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-medium">{new Date(order.order_date).toLocaleDateString()}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-border/70 bg-background/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fulfillment Site</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                {normalizeSiteId(order.siteId || 'main')}
              </p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Requested</p>
              <p className="mt-1 text-sm font-medium text-foreground">{workflowSummary.requestedUnits} units</p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reserved</p>
              <p className="mt-1 text-sm font-medium text-foreground">{workflowSummary.reservedUnits} units</p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Short / Trace Lots</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {workflowSummary.shortUnits} short
                {workflowSummary.packageLotCount > 0 ? ` · ${workflowSummary.packageLotCount} lots` : ''}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs">
            <p className="font-medium text-cyan-100">{workflowSummary.nextStep}</p>
            <p className="mt-1 text-muted-foreground">{workflowSummary.nextDetail}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">
              {formatOpsSalesChannel(order.taxProfileSnapshot?.salesChannel ?? 'retail')}
            </Badge>
            <Badge variant="outline">
              {formatOpsTaxTreatment(order.taxProfileSnapshot?.taxTreatment ?? 'taxable')}
            </Badge>
            <Badge variant="outline">
              Tax rate: {(((order.taxProfileSnapshot?.salesTaxRate ?? 0.09) * 100)).toFixed(2)}%
            </Badge>
            {order.taxProfileSnapshot?.resaleCertificateNumber && (
              <Badge variant="outline">
                Cert: {order.taxProfileSnapshot.resaleCertificateNumber}
              </Badge>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-medium">Line Items:</p>
            <div className="space-y-2">
              {order.lineItems.map((item) => (
                <div key={item.id} className="rounded-md border border-border/70 bg-background/20 px-2 py-1.5 text-sm">
                  {(() => {
                    const normalizedSkuId = (item.skuId ?? '').trim();
                    const siteId = normalizeSiteId(item.siteId || order.siteId || 'main');
                    const productMeta = normalizedSkuId ? productBySku.get(normalizedSkuId) : undefined;
                    const activeLots = normalizedSkuId
                      ? packageLotsBySkuSite.get(buildSiteSkuKey(normalizedSkuId, siteId)) ?? []
                      : [];
                    const traceLotCodes = dedupeCodes([
                      item.packageLotCode,
                      ...(item.availabilitySnapshot?.lotBreakdown?.map((entry) => entry.packageLotCode) ?? []),
                      ...activeLots.map((lot) => lot.packageLotCode),
                    ]);
                    const traceBatchCodes = dedupeCodes([
                      item.batchCode,
                      ...(item.availabilitySnapshot?.lotBreakdown?.map((entry) => entry.batchCode) ?? []),
                      ...activeLots.map((lot) => lot.batchCode),
                    ]);
                    const traceAssetCodes = dedupeCodes([
                      item.assetCode,
                      ...(item.availabilitySnapshot?.lotBreakdown?.map((entry) => entry.assetCode) ?? []),
                      ...activeLots.map((lot) => lot.assetCode),
                    ]);

                    return (
                      <>
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {item.quantity}x {item.productName || 'Unknown'}
                            </p>
                            {(item.productCode || productMeta?.productCode) && (
                              <p className="truncate text-xs text-muted-foreground">
                                Product: {item.productCode || productMeta?.productCode}
                              </p>
                            )}
                            {normalizedSkuId && (
                              <p className="truncate text-xs text-muted-foreground">SKU: {normalizedSkuId}</p>
                            )}
                          </div>
                          <span className="font-medium">${(item.totalPrice || item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                        {(traceLotCodes.length > 0 || traceBatchCodes.length > 0 || traceAssetCodes.length > 0) && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {traceLotCodes.length > 0 && <p>Package lots: {traceLotCodes.join(', ')}</p>}
                            {traceBatchCodes.length > 0 && <p>Batches: {traceBatchCodes.join(', ')}</p>}
                            {traceAssetCodes.length > 0 && <p>Assets: {traceAssetCodes.join(', ')}</p>}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {(item.reservationStatus || item.reservedQty || item.shortQty || item.reservationReasonMessage) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <p>
                        OS: {item.reservationStatus ? item.reservationStatus.replace(/_/g, ' ') : 'pending'} · Reserved{' '}
                        {Math.max(0, Number(item.reservedQty ?? 0))}/{item.quantity} · Short{' '}
                        {Math.max(0, Number(item.shortQty ?? 0))}
                      </p>
                      {(item.reservationReasonCode || item.reservationReasonMessage) && (
                        <p className="text-amber-400">
                          {item.reservationReasonCode ? `${item.reservationReasonCode}: ` : ''}
                          {item.reservationReasonMessage ?? 'No reason provided'}
                        </p>
                      )}
                      {typeof item.availabilitySnapshot?.availableQty === 'number' && (
                        <p>
                          Availability snapshot: {item.availabilitySnapshot.availableQty}
                          {item.availabilitySnapshot.uom ? ` ${item.availabilitySnapshot.uom}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border/70 bg-background/20 px-3 py-2 text-xs">
            <p className="font-medium text-foreground">Delivery Tracking</p>
            <p className="text-muted-foreground">
              Scanned: {deliveredCount}
              {targetCount > 0 ? `/${targetCount}` : ''}
            </p>
            {lastDelivery && (
              <p className="text-muted-foreground">
                Last: {lastDelivery.stopName} at {new Date(lastDelivery.deliveredAt).toLocaleString()}
              </p>
            )}
            <Badge
              className={
                deliveryState === 'delivered'
                  ? 'mt-2 border-green-500/20 bg-green-500/20 text-green-500'
                  : deliveryState === 'partial'
                    ? 'mt-2 border-amber-500/20 bg-amber-500/20 text-amber-500'
                    : 'mt-2 border-slate-500/20 bg-slate-500/20 text-slate-300'
              }
            >
              {deliveryState === 'delivered'
                ? 'line status: delivered'
                : deliveryState === 'partial'
                  ? 'line status: partially delivered'
                  : 'line status: not delivered'}
            </Badge>
          </div>

          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>${toNumber(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total:</span>
              <span>${toNumber(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {(workflowSummary.logisticsEligible || order.status === 'ready_to_fulfill') && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              {workflowSummary.logisticsEligible && (
                <Button asChild>
                  <Link to={getOrderLogisticsHref(order.id)}>
                    <Layers className="mr-2 h-4 w-4" />
                    Open Assisted Build
                  </Link>
                </Button>
              )}
              {order.status === 'ready_to_fulfill' && (
                <Button asChild variant="outline">
                  <Link to="/ops/logistics/trucks">
                    <Truck className="mr-2 h-4 w-4" />
                    Move To Truck Board
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
