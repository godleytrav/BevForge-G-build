import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildOpsTaxProfileSnapshot, type OpsTaxProfileSnapshot } from '@/lib/ops-tax';

const ORDERS_SCHEMA_VERSION = '1.0.0';

const ORDER_STATUS_VALUES = [
  'draft',
  'submitted',
  'reserved',
  'partially_reserved',
  'backordered',
  'ready_to_fulfill',
  'fulfilled',
  'cancelled',
] as const;

const ORDER_SOURCE_VALUES = ['website', 'phone', 'email', 'in_person', 'system'] as const;

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUS_VALUES);
const ORDER_SOURCE_SET = new Set<string>(ORDER_SOURCE_VALUES);

const ORDER_STATUS_TRANSITIONS: Record<OpsOrderStatus, OpsOrderStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['draft', 'reserved', 'partially_reserved', 'backordered', 'cancelled'],
  reserved: ['ready_to_fulfill', 'partially_reserved', 'backordered', 'cancelled'],
  partially_reserved: ['reserved', 'backordered', 'cancelled'],
  backordered: ['reserved', 'partially_reserved', 'cancelled'],
  ready_to_fulfill: ['fulfilled', 'cancelled'],
  fulfilled: [],
  cancelled: [],
};

const RESERVATION_SYNC_STATUSES = new Set<OpsOrderStatus>([
  'submitted',
  'reserved',
  'partially_reserved',
  'backordered',
]);

export type OpsOrderStatus = (typeof ORDER_STATUS_VALUES)[number];
type OpsOrderSource = (typeof ORDER_SOURCE_VALUES)[number];
type OpsReservationStatus =
  | 'reserved'
  | 'partially_reserved'
  | 'rejected'
  | 'committed'
  | 'released'
  | 'expired';

interface AvailabilitySnapshot {
  schemaVersion?: string;
  skuId?: string;
  siteId?: string;
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
}

interface AllocationResponse {
  schemaVersion?: string;
  reservationId: string;
  requestId: string;
  orderId: string;
  lineId: string;
  status: 'reserved' | 'partially_reserved' | 'rejected';
  allocatedQty: number;
  shortQty: number;
  reasonCode?: string;
  reasonMessage?: string;
  availabilitySnapshot: AvailabilitySnapshot;
  respondedAt?: string;
}

interface OpsOrderLineItem {
  id: string;
  product_id: string;
  product_code?: string;
  sku_id?: string;
  product_name: string;
  container_type_id: string;
  container_type: string;
  package_type?: string;
  package_format_code?: string;
  batch_id?: string;
  batch_code?: string;
  package_lot_id?: string;
  package_lot_code?: string;
  asset_id?: string;
  asset_code?: string;
  uom?: string;
  site_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reserved_qty?: number;
  short_qty?: number;
  reservation_id?: string;
  reservation_status?: OpsReservationStatus;
  reservation_reason_code?: string;
  reservation_reason_message?: string;
  availability_snapshot?: AvailabilitySnapshot;
  reservation_request_id?: string;
  fulfillment_request_id?: string;
  fulfillment_request_status?: 'queued' | 'sent' | 'failed';
  fulfillment_request_message?: string;
  notes?: string;
}

interface OpsOrderRecord {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  site_id: string;
  order_date: string;
  delivery_date?: string;
  status: OpsOrderStatus;
  source: OpsOrderSource;
  subtotal: number;
  tax_amount: number;
  deposit_amount: number;
  total_amount: number;
  tax_profile_snapshot: OpsTaxProfileSnapshot;
  notes?: string;
  delivery_instructions?: string;
  line_items: OpsOrderLineItem[];
  created_at: string;
  updated_at: string;
}

interface OpsOrdersState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  orders: OpsOrderRecord[];
}

interface OpsOrderIdempotencyEntry {
  key: string;
  scope: string;
  request_hash: string;
  order_id: string;
  created_at: string;
  updated_at: string;
}

interface OpsOrderIdempotencyState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  entries: OpsOrderIdempotencyEntry[];
}

type UnknownRecord = Record<string, unknown>;

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'ops-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'ops-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const opsRoot = path.join(repoRoot, 'commissioning', 'ops');
const ordersFile = path.join(opsRoot, 'orders.json');
const idempotencyFile = path.join(opsRoot, 'orders-idempotency.json');
const OS_BASE_URL = process.env.OS_BASE_URL ?? 'http://localhost:8080';
const DEFAULT_OS_SITE_ID = 'main';

const nowIso = (): string => new Date().toISOString();

const defaultState = (): OpsOrdersState => ({
  schemaVersion: ORDERS_SCHEMA_VERSION,
  id: 'ops-orders',
  updatedAt: nowIso(),
  orders: [],
});

const defaultIdempotencyState = (): OpsOrderIdempotencyState => ({
  schemaVersion: ORDERS_SCHEMA_VERSION,
  id: 'ops-orders-idempotency',
  updatedAt: nowIso(),
  entries: [],
});

const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(ordersFile);
  } catch {
    await writeJson(ordersFile, defaultState());
  }
};

const ensureIdempotencyFile = async (): Promise<void> => {
  try {
    await fs.access(idempotencyFile);
  } catch {
    await writeJson(idempotencyFile, defaultIdempotencyState());
  }
};

const readState = async (): Promise<OpsOrdersState> => {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(ordersFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OpsOrdersState>;
    const normalized = normalizeState(parsed);
    return normalized;
  } catch {
    return defaultState();
  }
};

const writeState = async (state: OpsOrdersState): Promise<void> => {
  await writeJson(ordersFile, state);
};

const readIdempotencyState = async (): Promise<OpsOrderIdempotencyState> => {
  await ensureIdempotencyFile();

  try {
    const raw = await fs.readFile(idempotencyFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OpsOrderIdempotencyState>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries
          .map((entry) => normalizeIdempotencyEntry(entry))
          .filter((entry): entry is OpsOrderIdempotencyEntry => entry !== null)
      : [];
    return {
      schemaVersion: ORDERS_SCHEMA_VERSION,
      id: 'ops-orders-idempotency',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
      entries,
    };
  } catch {
    return defaultIdempotencyState();
  }
};

const writeIdempotencyState = async (state: OpsOrderIdempotencyState): Promise<void> => {
  await writeJson(idempotencyFile, state);
};

const asRecord = (value: unknown): UnknownRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as UnknownRecord;
};

const asString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const parseIsoDate = (value: unknown): string | null => {
  const raw = asString(value);
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }
  return parsed.toISOString();
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const clampNonNegative = (value: number | null, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return value < 0 ? 0 : value;
};

const clampOptionalNonNegative = (value: number | null): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return value < 0 ? 0 : value;
};

const stableSerialize = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const pairs = keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`);
  return `{${pairs.join(',')}}`;
};

const hashRequestPayload = (value: unknown): string =>
  createHash('sha256').update(stableSerialize(value)).digest('hex');

const generateOrderId = (): string =>
  `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const generateLineId = (): string =>
  `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const generateOrderNumber = (orders: OpsOrderRecord[]): string => {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `OPS-${datePrefix}-`;
  const count = orders.filter((order) => order.order_number.startsWith(prefix)).length;
  const sequence = String(count + 1).padStart(3, '0');
  return `${prefix}${sequence}`;
};

const normalizeIdempotencyEntry = (value: unknown): OpsOrderIdempotencyEntry | null => {
  const entry = asRecord(value);
  if (!entry) {
    return null;
  }

  const key = asString(entry.key);
  const scope = asString(entry.scope);
  const requestHash = asString(entry.request_hash);
  const orderId = asString(entry.order_id);
  if (!key || !scope || !requestHash || !orderId) {
    return null;
  }

  return {
    key,
    scope,
    request_hash: requestHash,
    order_id: orderId,
    created_at: parseIsoDate(entry.created_at) ?? nowIso(),
    updated_at: parseIsoDate(entry.updated_at) ?? nowIso(),
  };
};

const normalizeLegacyStatus = (value: string): OpsOrderStatus | null => {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
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
      return null;
  }
};

const normalizeStatus = (value: unknown, fallback: OpsOrderStatus = 'draft'): OpsOrderStatus => {
  const status = asString(value);
  if (!status) {
    return fallback;
  }
  if (ORDER_STATUS_SET.has(status)) {
    return status as OpsOrderStatus;
  }
  const legacy = normalizeLegacyStatus(status);
  if (legacy) {
    return legacy;
  }
  return fallback;
};

const parseStatusFilter = (value: string): OpsOrderStatus | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (ORDER_STATUS_SET.has(trimmed)) {
    return trimmed as OpsOrderStatus;
  }
  return normalizeLegacyStatus(trimmed);
};

const normalizeSource = (value: unknown): OpsOrderSource => {
  const source = asString(value);
  if (!source || !ORDER_SOURCE_SET.has(source)) {
    return 'system';
  }
  return source as OpsOrderSource;
};

const normalizeLineItem = (value: unknown, index: number): OpsOrderLineItem | null => {
  const input = asRecord(value);
  if (!input) {
    return null;
  }

  const quantity = clampNonNegative(asNumber(input.quantity ?? input.qty), 0);
  const unitPrice = clampNonNegative(asNumber(input.unit_price ?? input.unitPrice ?? input.price), 0);
  const explicitTotal = asNumber(input.total_price ?? input.totalPrice ?? input.total);
  const total = clampNonNegative(explicitTotal, quantity * unitPrice);

  const productName =
    asString(input.product_name ?? input.productName ?? input.item_name) ?? `Line Item ${index + 1}`;
  const containerType = asString(input.container_type ?? input.containerType) ?? 'Package';

  if (quantity <= 0) {
    return null;
  }

  const providedProductId = asString(input.product_id ?? input.productId);
  const providedSkuId = asString(input.sku_id ?? input.skuId);
  const providedContainerTypeId = asString(input.container_type_id ?? input.containerTypeId);
  const productSlug = slugify(productName);
  const containerSlug = slugify(containerType);
  const reservationStatus = asString(input.reservation_status ?? input.reservationStatus);
  const normalizedReservationStatus: OpsReservationStatus | undefined =
    reservationStatus === 'reserved' ||
    reservationStatus === 'partially_reserved' ||
    reservationStatus === 'rejected' ||
    reservationStatus === 'committed' ||
    reservationStatus === 'released' ||
    reservationStatus === 'expired'
      ? reservationStatus
      : undefined;

  const availabilitySnapshot = asRecord(input.availability_snapshot ?? input.availabilitySnapshot);

  return {
    id: asString(input.id) ?? generateLineId(),
    product_id: providedProductId ?? (productSlug.length > 0 ? `product-${productSlug}` : 'product-generic'),
    product_code: asString(input.product_code ?? input.productCode) ?? undefined,
    sku_id: providedSkuId ?? undefined,
    product_name: productName,
    container_type_id:
      providedContainerTypeId ?? (containerSlug.length > 0 ? `container-${containerSlug}` : 'container-package'),
    container_type: containerType,
    package_type: asString(input.package_type ?? input.packageType) ?? undefined,
    package_format_code:
      asString(input.package_format_code ?? input.packageFormatCode) ?? undefined,
    batch_id: asString(input.batch_id ?? input.batchId) ?? undefined,
    batch_code: asString(input.batch_code ?? input.batchCode) ?? undefined,
    package_lot_id: asString(input.package_lot_id ?? input.packageLotId) ?? undefined,
    package_lot_code:
      asString(input.package_lot_code ?? input.packageLotCode) ?? undefined,
    asset_id: asString(input.asset_id ?? input.assetId ?? input.kegAssetId) ?? undefined,
    asset_code: asString(input.asset_code ?? input.assetCode) ?? undefined,
    uom: asString(input.uom) ?? undefined,
    site_id: asString(input.site_id ?? input.siteId) ?? undefined,
    quantity,
    unit_price: unitPrice,
    total_price: total,
    reserved_qty: clampOptionalNonNegative(asNumber(input.reserved_qty ?? input.reservedQty)),
    short_qty: clampOptionalNonNegative(asNumber(input.short_qty ?? input.shortQty)),
    reservation_id: asString(input.reservation_id ?? input.reservationId) ?? undefined,
    reservation_status: normalizedReservationStatus,
    reservation_reason_code:
      asString(input.reservation_reason_code ?? input.reservationReasonCode) ?? undefined,
    reservation_reason_message:
      asString(input.reservation_reason_message ?? input.reservationReasonMessage) ?? undefined,
    availability_snapshot: availabilitySnapshot
      ? (availabilitySnapshot as unknown as AvailabilitySnapshot)
      : undefined,
    reservation_request_id:
      asString(input.reservation_request_id ?? input.reservationRequestId) ?? undefined,
    fulfillment_request_id:
      asString(input.fulfillment_request_id ?? input.fulfillmentRequestId) ?? undefined,
    fulfillment_request_status:
      asString(input.fulfillment_request_status ?? input.fulfillmentRequestStatus) === 'failed'
        ? 'failed'
        : asString(input.fulfillment_request_status ?? input.fulfillmentRequestStatus) === 'sent'
          ? 'sent'
          : asString(input.fulfillment_request_status ?? input.fulfillmentRequestStatus) === 'queued'
            ? 'queued'
            : undefined,
    fulfillment_request_message:
      asString(input.fulfillment_request_message ?? input.fulfillmentRequestMessage) ?? undefined,
    notes: asString(input.notes) ?? undefined,
  };
};

const normalizeLineItems = (value: unknown): OpsOrderLineItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => normalizeLineItem(entry, index))
    .filter((entry): entry is OpsOrderLineItem => entry !== null);
};

const normalizeRecord = (value: unknown): OpsOrderRecord | null => {
  const input = asRecord(value);
  if (!input) {
    return null;
  }

  const id = asString(input.id);
  const orderNumber = asString(input.order_number);
  const customerId = asString(input.customer_id);
  const customerName = asString(input.customer_name);
  const orderDate = parseIsoDate(input.order_date);

  if (!id || !orderNumber || !customerId || !customerName || !orderDate) {
    return null;
  }

  const lineItems = normalizeLineItems(input.line_items ?? input.lineItems);
  const subtotal =
    clampNonNegative(asNumber(input.subtotal), 0) ||
    lineItems.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = clampNonNegative(asNumber(input.tax_amount), 0);
  const depositAmount = clampNonNegative(asNumber(input.deposit_amount), 0);
  const totalAmount =
    clampNonNegative(asNumber(input.total_amount), 0) || subtotal + taxAmount + depositAmount;

  const siteId = asString(input.site_id ?? input.siteId) ?? DEFAULT_OS_SITE_ID;
  const taxProfileSnapshot = buildOpsTaxProfileSnapshot(
    input.tax_profile_snapshot ?? input.taxProfileSnapshot
  );

  return {
    id,
    order_number: orderNumber,
    customer_id: customerId,
    customer_name: customerName,
    site_id: siteId,
    order_date: orderDate,
    delivery_date: parseIsoDate(input.delivery_date) ?? undefined,
    status: normalizeStatus(input.status),
    source: normalizeSource(input.source),
    subtotal,
    tax_amount: taxAmount,
    deposit_amount: depositAmount,
    total_amount: totalAmount,
    tax_profile_snapshot: taxProfileSnapshot,
    notes: asString(input.notes) ?? undefined,
    delivery_instructions: asString(input.delivery_instructions) ?? undefined,
    line_items: lineItems,
    created_at: parseIsoDate(input.created_at) ?? nowIso(),
    updated_at: parseIsoDate(input.updated_at) ?? nowIso(),
  };
};

const normalizeState = (value: Partial<OpsOrdersState>): OpsOrdersState => {
  const recordsRaw = Array.isArray(value.orders) ? value.orders : [];
  const orders = recordsRaw
    .map((entry) => normalizeRecord(entry))
    .filter((entry): entry is OpsOrderRecord => entry !== null)
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));

  return {
    schemaVersion: ORDERS_SCHEMA_VERSION,
    id: 'ops-orders',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
    orders,
  };
};

const toApiLineItem = (lineItem: OpsOrderLineItem) => ({
  ...lineItem,
  skuId: lineItem.sku_id,
  productName: lineItem.product_name,
  containerType: lineItem.container_type,
  uom: lineItem.uom,
  siteId: lineItem.site_id,
  reservedQty: lineItem.reserved_qty,
  shortQty: lineItem.short_qty,
  reservationId: lineItem.reservation_id,
  reservationStatus: lineItem.reservation_status,
  reservationReasonCode: lineItem.reservation_reason_code,
  reservationReasonMessage: lineItem.reservation_reason_message,
  availabilitySnapshot: lineItem.availability_snapshot,
  reservationRequestId: lineItem.reservation_request_id,
  fulfillmentRequestId: lineItem.fulfillment_request_id,
  fulfillmentRequestStatus: lineItem.fulfillment_request_status,
  fulfillmentRequestMessage: lineItem.fulfillment_request_message,
  unitPrice: lineItem.unit_price,
  totalPrice: lineItem.total_price,
});

const toApiOrder = (order: OpsOrderRecord) => ({
  ...order,
  orderNumber: order.order_number,
  customerId: order.customer_id,
  customerName: order.customer_name,
  siteId: order.site_id,
  orderDate: order.order_date,
  deliveryDate: order.delivery_date,
  total: order.total_amount,
  taxProfileSnapshot: order.tax_profile_snapshot,
  createdAt: order.created_at,
  updatedAt: order.updated_at,
  lineItems: order.line_items.map(toApiLineItem),
});

const parseCreatePayload = (payload: unknown, existingOrders: OpsOrderRecord[]): OpsOrderRecord => {
  const input = asRecord(payload);
  if (!input) {
    throw new Error('Validation: order payload is required.');
  }

  const customerName = asString(input.customer_name ?? input.customerName);
  if (!customerName) {
    throw new Error('Validation: customer_name is required.');
  }

  const lineItems = normalizeLineItems(input.line_items ?? input.lineItems);
  if (lineItems.length === 0) {
    throw new Error('Validation: at least one valid line item is required.');
  }

  const now = nowIso();
  const subtotalFromLines = lineItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotal = clampNonNegative(asNumber(input.subtotal), subtotalFromLines);
  const taxAmount = clampNonNegative(asNumber(input.tax_amount ?? input.tax), 0);
  const depositAmount = clampNonNegative(asNumber(input.deposit_amount), 0);
  const totalAmount = clampNonNegative(asNumber(input.total_amount ?? input.total), subtotal + taxAmount + depositAmount);

  const customerId =
    asString(input.customer_id ?? input.customerId) ??
    (() => {
      const slug = slugify(customerName);
      return slug.length > 0 ? `site-${slug}` : `site-${Date.now().toString(36)}`;
    })();

  const siteId = asString(input.site_id ?? input.siteId) ?? DEFAULT_OS_SITE_ID;
  const taxProfileSnapshot = buildOpsTaxProfileSnapshot(
    input.tax_profile_snapshot ?? input.taxProfileSnapshot
  );
  assertTaxProfileCompliance(taxProfileSnapshot);

  return {
    id: asString(input.id) ?? generateOrderId(),
    order_number: asString(input.order_number ?? input.orderNumber) ?? generateOrderNumber(existingOrders),
    customer_id: customerId,
    customer_name: customerName,
    site_id: siteId,
    order_date: parseIsoDate(input.order_date ?? input.orderDate) ?? now,
    delivery_date: parseIsoDate(input.delivery_date ?? input.deliveryDate) ?? undefined,
    status: normalizeStatus(input.status, 'draft'),
    source: normalizeSource(input.source),
    subtotal,
    tax_amount: taxAmount,
    deposit_amount: depositAmount,
    total_amount: totalAmount,
    tax_profile_snapshot: taxProfileSnapshot,
    notes: asString(input.notes) ?? undefined,
    delivery_instructions: asString(input.delivery_instructions) ?? undefined,
    line_items: lineItems,
    created_at: now,
    updated_at: now,
  };
};

const parseUpdatePayload = (payload: unknown): UnknownRecord => {
  const input = asRecord(payload);
  if (!input) {
    throw new Error('Validation: update payload is required.');
  }
  return input;
};

const validateIdempotencyReplay = (
  entry: OpsOrderIdempotencyEntry,
  requestHash: string
): void => {
  if (entry.request_hash !== requestHash) {
    throw new Error('Conflict: idempotency key already used with different payload.');
  }
};

const assertStatusTransition = (current: OpsOrderStatus, next: OpsOrderStatus): void => {
  if (current === next) {
    return;
  }

  const allowed = ORDER_STATUS_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new Error(`Validation: invalid status transition from ${current} to ${next}.`);
  }
};

const shouldSyncFulfillment = (): boolean => process.env.NODE_ENV !== 'test';

const buildStableOperationId = (prefix: string, parts: Array<string | number>): string => {
  const digest = createHash('sha256')
    .update(parts.map((part) => String(part)).join('|'))
    .digest('hex')
    .slice(0, 24);
  return `${prefix}-${digest}`;
};

const assertTaxProfileCompliance = (taxProfile: OpsTaxProfileSnapshot): void => {
  if (
    taxProfile.taxTreatment === 'resale_exempt' &&
    taxProfile.certificateStatus !== 'verified'
  ) {
    throw new Error(
      'Validation: resale-exempt wholesale orders require a verified certificate on file.'
    );
  }
};

const buildOsUrl = (pathname: string, params?: Record<string, string>): globalThis.URL => {
  const url = new globalThis.URL(pathname, OS_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url;
};

const parseJsonResponse = async <T>(response: globalThis.Response): Promise<T> => {
  if (!response.ok) {
    const fallback = `OS request failed (${response.status})`;
    let detail = fallback;
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      detail = payload.error || payload.message || fallback;
    } catch {
      // Keep fallback.
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
};

const canReserveLine = (line: OpsOrderLineItem): boolean => {
  return (line.sku_id ?? '').trim().length > 0;
};

const readAvailability = async (skuId: string, siteId: string): Promise<AvailabilitySnapshot> => {
  const url = buildOsUrl('/api/os/availability', { skuId, siteId });
  const response = await globalThis.fetch(url, { method: 'GET' });
  return parseJsonResponse<AvailabilitySnapshot>(response);
};

const reserveInventory = async (payload: {
  requestId: string;
  orderId: string;
  lineId: string;
  skuId: string;
  requestedQty: number;
  uom: string;
  siteId: string;
}): Promise<AllocationResponse> => {
  const response = await globalThis.fetch(buildOsUrl('/api/os/reservations'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': payload.requestId,
    },
    body: JSON.stringify({
      schemaVersion: '1.0.0',
      requestId: payload.requestId,
      orderId: payload.orderId,
      lineId: payload.lineId,
      skuId: payload.skuId,
      requestedQty: payload.requestedQty,
      uom: payload.uom,
      siteId: payload.siteId,
      allowPartial: true,
      requestedAt: nowIso(),
    }),
  });
  return parseJsonResponse<AllocationResponse>(response);
};

const postFulfillmentRequest = async (payload: {
  requestId: string;
  orderId: string;
  lineId: string;
  skuId: string;
  siteId: string;
  requestedQty: number;
  shortQty: number;
  reasonCode?: string;
  reasonMessage?: string;
}): Promise<{ status: 'sent' | 'failed'; message: string }> => {
  try {
    const response = await globalThis.fetch(buildOsUrl('/api/os/command'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': payload.requestId,
      },
      body: JSON.stringify({
        schemaVersion: '1.0.0',
        requestId: payload.requestId,
        command: 'fulfillment_request',
        payload: {
          originSuite: 'ops',
          orderId: payload.orderId,
          lineId: payload.lineId,
          skuId: payload.skuId,
          siteId: payload.siteId,
          requestedQty: payload.requestedQty,
          shortQty: payload.shortQty,
          reasonCode: payload.reasonCode,
          reasonMessage: payload.reasonMessage,
          requestedAt: nowIso(),
        },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return {
        status: 'failed',
        message: text || `OS fulfillment request failed (${response.status}).`,
      };
    }
    return {
      status: 'sent',
      message: 'Fulfillment request sent to OS.',
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'OS fulfillment request failed.',
    };
  }
};

const applyReservationAction = async (params: {
  reservationId: string;
  actionId: string;
  orderId: string;
  lineId: string;
  action: 'commit' | 'release' | 'expire';
  reasonCode:
    | 'picked'
    | 'shipped'
    | 'order_canceled'
    | 'line_edited'
    | 'reservation_timeout'
    | 'manual_override';
  reasonMessage: string;
}): Promise<void> => {
  const response = await globalThis.fetch(
    buildOsUrl(`/api/os/reservations/${encodeURIComponent(params.reservationId)}/action`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': params.actionId,
      },
      body: JSON.stringify({
        schemaVersion: '1.0.0',
        actionId: params.actionId,
        reservationId: params.reservationId,
        orderId: params.orderId,
        lineId: params.lineId,
        action: params.action,
        reasonCode: params.reasonCode,
        reasonMessage: params.reasonMessage,
        occurredAt: nowIso(),
      }),
    }
  );
  await parseJsonResponse<unknown>(response);
};

const releaseOrderReservations = async (
  order: OpsOrderRecord,
  reasonCode: 'order_canceled' | 'line_edited'
): Promise<OpsOrderRecord> => {
  if (!shouldSyncFulfillment()) {
    return order;
  }

  const lineItems = [...order.line_items];
  for (let index = 0; index < lineItems.length; index += 1) {
    const line = lineItems[index];
    if (!line.reservation_id) {
      continue;
    }
    if (line.reservation_status !== 'reserved' && line.reservation_status !== 'partially_reserved') {
      continue;
    }

    const actionId = buildStableOperationId('ops-release', [
      order.id,
      line.id,
      line.reservation_id,
      reasonCode,
    ]);

    try {
      await applyReservationAction({
        reservationId: line.reservation_id,
        actionId,
        orderId: order.id,
        lineId: line.id,
        action: 'release',
        reasonCode,
        reasonMessage:
          reasonCode === 'order_canceled'
            ? 'OPS order canceled.'
            : 'OPS order line edited.',
      });
      lineItems[index] = {
        ...line,
        reservation_status: 'released',
      };
    } catch (error) {
      lineItems[index] = {
        ...line,
        reservation_reason_message:
          error instanceof Error ? error.message : 'Failed to release reservation.',
      };
    }
  }

  return {
    ...order,
    line_items: lineItems,
    updated_at: nowIso(),
  };
};

const commitOrderReservations = async (order: OpsOrderRecord): Promise<OpsOrderRecord> => {
  if (!shouldSyncFulfillment()) {
    return order;
  }

  const lineItems = [...order.line_items];
  for (let index = 0; index < lineItems.length; index += 1) {
    const line = lineItems[index];
    if (!line.reservation_id) {
      continue;
    }
    if (line.reservation_status !== 'reserved' && line.reservation_status !== 'partially_reserved') {
      continue;
    }

    const actionId = buildStableOperationId('ops-commit', [
      order.id,
      line.id,
      line.reservation_id,
      'shipped',
    ]);

    try {
      await applyReservationAction({
        reservationId: line.reservation_id,
        actionId,
        orderId: order.id,
        lineId: line.id,
        action: 'commit',
        reasonCode: 'shipped',
        reasonMessage: 'OPS order fulfilled.',
      });
      lineItems[index] = {
        ...line,
        reservation_status: 'committed',
      };
    } catch (error) {
      lineItems[index] = {
        ...line,
        reservation_reason_message:
          error instanceof Error ? error.message : 'Failed to commit reservation.',
      };
    }
  }

  return {
    ...order,
    line_items: lineItems,
    updated_at: nowIso(),
  };
};

const syncSubmittedOrderReservations = async (order: OpsOrderRecord): Promise<OpsOrderRecord> => {
  if (!shouldSyncFulfillment()) {
    return order;
  }

  const nextLineItems: OpsOrderLineItem[] = [];
  for (const line of order.line_items) {
    const requestedQty = Math.max(0, line.quantity);
    const skuId = (line.sku_id ?? '').trim();
    const siteId = (line.site_id ?? order.site_id ?? DEFAULT_OS_SITE_ID).trim() || DEFAULT_OS_SITE_ID;

    if (!canReserveLine(line)) {
      const fulfillmentRequestId = buildStableOperationId('ops-fulfillment-request', [
        order.id,
        line.id,
        skuId || 'missing-sku',
        requestedQty,
        siteId,
      ]);
      const fulfillmentRequest = await postFulfillmentRequest({
        requestId: fulfillmentRequestId,
        orderId: order.id,
        lineId: line.id,
        skuId: skuId || 'missing-sku',
        siteId,
        requestedQty,
        shortQty: requestedQty,
        reasonCode: 'unknown_sku',
        reasonMessage: 'Order line is missing an OS SKU mapping.',
      });
      nextLineItems.push({
        ...line,
        sku_id: skuId || undefined,
        site_id: siteId,
        reserved_qty: 0,
        short_qty: requestedQty,
        reservation_status: 'rejected',
        reservation_reason_code: 'unknown_sku',
        reservation_reason_message: 'Order line is missing an OS SKU mapping.',
        fulfillment_request_id: fulfillmentRequestId,
        fulfillment_request_status: fulfillmentRequest.status,
        fulfillment_request_message: fulfillmentRequest.message,
      });
      continue;
    }

    try {
      const availability = await readAvailability(skuId, siteId);
      const uom = (line.uom ?? availability.uom ?? 'units').trim();
      const requestId = buildStableOperationId('ops-reserve', [
        order.id,
        line.id,
        skuId,
        requestedQty,
        uom,
        siteId,
      ]);
      const allocation = await reserveInventory({
        requestId,
        orderId: order.id,
        lineId: line.id,
        skuId,
        requestedQty,
        uom,
        siteId,
      });

      const needsFulfillmentRequest =
        allocation.status !== 'reserved' ||
        allocation.shortQty > 0;
      let fulfillmentRequestId: string | undefined;
      let fulfillmentRequestStatus: 'queued' | 'sent' | 'failed' | undefined;
      let fulfillmentRequestMessage: string | undefined;
      if (needsFulfillmentRequest) {
        fulfillmentRequestId = buildStableOperationId('ops-fulfillment-request', [
          order.id,
          line.id,
          skuId,
          allocation.shortQty,
          siteId,
        ]);
        const fulfillmentRequest = await postFulfillmentRequest({
          requestId: fulfillmentRequestId,
          orderId: order.id,
          lineId: line.id,
          skuId,
          siteId,
          requestedQty,
          shortQty: allocation.shortQty,
          reasonCode: allocation.reasonCode,
          reasonMessage: allocation.reasonMessage,
        });
        fulfillmentRequestStatus = fulfillmentRequest.status;
        fulfillmentRequestMessage = fulfillmentRequest.message;
      }

      nextLineItems.push({
        ...line,
        sku_id: skuId,
        uom,
        site_id: siteId,
        reserved_qty: allocation.allocatedQty,
        short_qty: allocation.shortQty,
        reservation_id: allocation.reservationId,
        reservation_status: allocation.status,
        reservation_reason_code: allocation.reasonCode,
        reservation_reason_message: allocation.reasonMessage,
        availability_snapshot: allocation.availabilitySnapshot,
        reservation_request_id: requestId,
        fulfillment_request_id: fulfillmentRequestId,
        fulfillment_request_status: fulfillmentRequestStatus,
        fulfillment_request_message: fulfillmentRequestMessage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OS reservation failed.';
      const fulfillmentRequestId = buildStableOperationId('ops-fulfillment-request', [
        order.id,
        line.id,
        skuId,
        requestedQty,
        siteId,
      ]);
      const fulfillmentRequest = await postFulfillmentRequest({
        requestId: fulfillmentRequestId,
        orderId: order.id,
        lineId: line.id,
        skuId,
        siteId,
        requestedQty,
        shortQty: requestedQty,
        reasonCode: 'validation_error',
        reasonMessage: message,
      });
      nextLineItems.push({
        ...line,
        sku_id: skuId,
        site_id: siteId,
        reserved_qty: 0,
        short_qty: requestedQty,
        reservation_status: 'rejected',
        reservation_reason_code: 'validation_error',
        reservation_reason_message: message,
        reservation_request_id: buildStableOperationId('ops-reserve-failed', [order.id, line.id, skuId]),
        fulfillment_request_id: fulfillmentRequestId,
        fulfillment_request_status: fulfillmentRequest.status,
        fulfillment_request_message: fulfillmentRequest.message,
      });
    }
  }

  const anyReserved = nextLineItems.some(
    (line) => line.reservation_status === 'reserved' && (line.short_qty ?? 0) <= 0
  );
  const anyPartial = nextLineItems.some((line) => line.reservation_status === 'partially_reserved');
  const anyRejected = nextLineItems.some((line) => line.reservation_status === 'rejected');

  let status: OpsOrderStatus = 'backordered';
  if (anyReserved && !anyPartial && !anyRejected) {
    status = 'reserved';
  } else if (anyReserved || anyPartial) {
    status = 'partially_reserved';
  }

  return {
    ...order,
    status,
    line_items: nextLineItems,
    updated_at: nowIso(),
  };
};

interface IdempotencyOptions {
  idempotencyKey?: string;
}

interface CreateOrderResult {
  order: ReturnType<typeof toApiOrder>;
  idempotent: boolean;
}

interface UpdateOrderResult {
  order: ReturnType<typeof toApiOrder> | null;
  idempotent: boolean;
}

export const listOrders = async (status?: string): Promise<ReturnType<typeof toApiOrder>[]> => {
  const state = await readState();
  if (!status) {
    return state.orders.map(toApiOrder);
  }

  const normalizedStatus = parseStatusFilter(status);
  if (!normalizedStatus) {
    throw new Error('Validation: invalid status filter.');
  }

  const filtered = state.orders.filter((order) => order.status === normalizedStatus);
  return filtered.map(toApiOrder);
};

export const getOrder = async (orderId: string): Promise<ReturnType<typeof toApiOrder> | null> => {
  const state = await readState();
  const found = state.orders.find((entry) => entry.id === orderId);
  return found ? toApiOrder(found) : null;
};

export const createOrder = async (
  payload: unknown,
  options: IdempotencyOptions = {}
): Promise<CreateOrderResult> => {
  const state = await readState();
  const idempotencyState = await readIdempotencyState();
  const idempotencyKey = asString(options.idempotencyKey);
  const requestHash = hashRequestPayload(payload);
  const scope = 'create';

  if (idempotencyKey) {
    const existingEntry = idempotencyState.entries.find(
      (entry) => entry.scope === scope && entry.key === idempotencyKey
    );
    if (existingEntry) {
      validateIdempotencyReplay(existingEntry, requestHash);
      const existingOrder = state.orders.find((entry) => entry.id === existingEntry.order_id);
      if (!existingOrder) {
        throw new Error('Conflict: idempotency key points to missing order record.');
      }
      return {
        order: toApiOrder(existingOrder),
        idempotent: true,
      };
    }
  }

  const order = parseCreatePayload(payload, state.orders);

  if (state.orders.some((entry) => entry.id === order.id)) {
    throw new Error(`Validation: order id ${order.id} already exists.`);
  }

  if (state.orders.some((entry) => entry.order_number === order.order_number)) {
    throw new Error(`Validation: order number ${order.order_number} already exists.`);
  }

  let nextOrder = order;
  if (RESERVATION_SYNC_STATUSES.has(nextOrder.status)) {
    nextOrder = await syncSubmittedOrderReservations({
      ...nextOrder,
      status: 'submitted',
    });
  } else if (nextOrder.status === 'fulfilled') {
    nextOrder = await commitOrderReservations(nextOrder);
  } else if (nextOrder.status === 'cancelled') {
    nextOrder = await releaseOrderReservations(nextOrder, 'order_canceled');
  }

  state.orders.unshift(nextOrder);
  state.updatedAt = nowIso();
  await writeState(state);

  if (idempotencyKey) {
    const now = nowIso();
    idempotencyState.entries.push({
      key: idempotencyKey,
      scope,
      request_hash: requestHash,
      order_id: nextOrder.id,
      created_at: now,
      updated_at: now,
    });
    idempotencyState.updatedAt = now;
    await writeIdempotencyState(idempotencyState);
  }

  return {
    order: toApiOrder(nextOrder),
    idempotent: false,
  };
};

export const updateOrder = async (
  orderId: string,
  payload: unknown,
  options: IdempotencyOptions = {}
): Promise<UpdateOrderResult> => {
  const state = await readState();
  const idempotencyState = await readIdempotencyState();
  const idempotencyKey = asString(options.idempotencyKey);
  const requestHash = hashRequestPayload(payload);
  const scope = `update:${orderId}`;

  if (idempotencyKey) {
    const existingEntry = idempotencyState.entries.find(
      (entry) => entry.scope === scope && entry.key === idempotencyKey
    );
    if (existingEntry) {
      validateIdempotencyReplay(existingEntry, requestHash);
      const existingOrder = state.orders.find((entry) => entry.id === existingEntry.order_id);
      return {
        order: existingOrder ? toApiOrder(existingOrder) : null,
        idempotent: true,
      };
    }
  }

  const index = state.orders.findIndex((entry) => entry.id === orderId);
  if (index < 0) {
    return {
      order: null,
      idempotent: false,
    };
  }

  const existing = state.orders[index];
  const input = parseUpdatePayload(payload);

  const requestedStatus =
    input.status !== undefined ? normalizeStatus(input.status, existing.status) : existing.status;
  const statusValue: OpsOrderStatus =
    existing.status === 'draft' && RESERVATION_SYNC_STATUSES.has(requestedStatus)
      ? 'submitted'
      : requestedStatus;
  assertStatusTransition(existing.status, statusValue);

  const customerName =
    input.customer_name !== undefined || input.customerName !== undefined
      ? asString(input.customer_name ?? input.customerName)
      : existing.customer_name;
  if (!customerName) {
    throw new Error('Validation: customer_name cannot be empty.');
  }

  const providedCustomerId = asString(input.customer_id ?? input.customerId);
  const customerId =
    providedCustomerId ??
    (customerName === existing.customer_name ? existing.customer_id : `site-${slugify(customerName) || Date.now().toString(36)}`);
  const siteId = asString(input.site_id ?? input.siteId) ?? existing.site_id;

  let lineItems = existing.line_items;
  const lineItemsWereUpdated = input.line_items !== undefined || input.lineItems !== undefined;
  if (lineItemsWereUpdated) {
    const parsed = normalizeLineItems(input.line_items ?? input.lineItems);
    if (parsed.length === 0) {
      throw new Error('Validation: at least one valid line item is required.');
    }
    lineItems = parsed;
  }

  const subtotalFromLines = lineItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotal =
    input.subtotal !== undefined
      ? clampNonNegative(asNumber(input.subtotal), subtotalFromLines)
      : lineItems === existing.line_items
        ? existing.subtotal
        : subtotalFromLines;

  const taxAmount =
    input.tax_amount !== undefined || input.tax !== undefined
      ? clampNonNegative(asNumber(input.tax_amount ?? input.tax), existing.tax_amount)
      : existing.tax_amount;

  const depositAmount =
    input.deposit_amount !== undefined
      ? clampNonNegative(asNumber(input.deposit_amount), existing.deposit_amount)
      : existing.deposit_amount;

  const totalAmount =
    input.total_amount !== undefined || input.total !== undefined
      ? clampNonNegative(asNumber(input.total_amount ?? input.total), subtotal + taxAmount + depositAmount)
      : subtotal + taxAmount + depositAmount;
  const taxProfileSnapshot =
    input.tax_profile_snapshot !== undefined || input.taxProfileSnapshot !== undefined
      ? buildOpsTaxProfileSnapshot(input.tax_profile_snapshot ?? input.taxProfileSnapshot)
      : existing.tax_profile_snapshot;
  assertTaxProfileCompliance(taxProfileSnapshot);

  let updated: OpsOrderRecord = {
    ...existing,
    order_number: asString(input.order_number ?? input.orderNumber) ?? existing.order_number,
    customer_id: customerId,
    customer_name: customerName,
    site_id: siteId,
    order_date: parseIsoDate(input.order_date ?? input.orderDate) ?? existing.order_date,
    delivery_date:
      input.delivery_date === null || input.deliveryDate === null
        ? undefined
        : parseIsoDate(input.delivery_date ?? input.deliveryDate) ?? existing.delivery_date,
    status: statusValue,
    source: normalizeSource(input.source ?? existing.source),
    subtotal,
    tax_amount: taxAmount,
    deposit_amount: depositAmount,
    total_amount: totalAmount,
    tax_profile_snapshot: taxProfileSnapshot,
    notes:
      input.notes !== undefined
        ? asString(input.notes) ?? undefined
        : existing.notes,
    delivery_instructions:
      input.delivery_instructions !== undefined
        ? asString(input.delivery_instructions) ?? undefined
        : existing.delivery_instructions,
    line_items: lineItems,
    updated_at: nowIso(),
  };

  const existingHasActiveReservations = existing.line_items.some(
    (line) =>
      !!line.reservation_id &&
      (line.reservation_status === 'reserved' || line.reservation_status === 'partially_reserved')
  );
  const siteChanged = siteId !== existing.site_id;
  if (
    existingHasActiveReservations &&
    (updated.status === 'cancelled' || updated.status === 'draft' || lineItemsWereUpdated || siteChanged)
  ) {
    const releaseReasonCode =
      updated.status === 'cancelled' ? 'order_canceled' : 'line_edited';
    const releasedExisting = await releaseOrderReservations(existing, releaseReasonCode);
    if (!lineItemsWereUpdated && !siteChanged) {
      updated = {
        ...updated,
        line_items: releasedExisting.line_items,
        updated_at: nowIso(),
      };
    }
  }

  if (RESERVATION_SYNC_STATUSES.has(updated.status)) {
    updated = await syncSubmittedOrderReservations({
      ...updated,
      status: 'submitted',
    });
  } else if (updated.status === 'fulfilled') {
    updated = await commitOrderReservations(updated);
    updated = {
      ...updated,
      status: 'fulfilled',
      updated_at: nowIso(),
    };
  } else if (updated.status === 'cancelled') {
    updated = {
      ...updated,
      status: 'cancelled',
      updated_at: nowIso(),
    };
  }

  if (
    state.orders.some((entry, entryIndex) => entryIndex !== index && entry.order_number === updated.order_number)
  ) {
    throw new Error(`Validation: order number ${updated.order_number} already exists.`);
  }

  state.orders[index] = updated;
  state.updatedAt = nowIso();
  await writeState(state);

  if (idempotencyKey) {
    const now = nowIso();
    idempotencyState.entries.push({
      key: idempotencyKey,
      scope,
      request_hash: requestHash,
      order_id: updated.id,
      created_at: now,
      updated_at: now,
    });
    idempotencyState.updatedAt = now;
    await writeIdempotencyState(idempotencyState);
  }

  return {
    order: toApiOrder(updated),
    idempotent: false,
  };
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  const state = await readState();
  const index = state.orders.findIndex((entry) => entry.id === orderId);
  if (index < 0) {
    return false;
  }

  state.orders.splice(index, 1);
  state.updatedAt = nowIso();
  await writeState(state);
  return true;
};

export const getOrderStatuses = (): OpsOrderStatus[] => [...ORDER_STATUS_VALUES];
