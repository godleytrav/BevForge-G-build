import { apiGet, apiPost } from '@/lib/api';
import { buildOpsTaxProfileSnapshot, type OpsTaxProfileSnapshot } from '@/lib/ops-tax';

export type OpsInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface OpsInvoiceItemRecord {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  containerType?: string;
}

export interface OpsInvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: OpsInvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  taxProfileSnapshot: OpsTaxProfileSnapshot;
  amountPaid: number;
  items: OpsInvoiceItemRecord[];
  notes?: string;
  paymentTerms: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpsInvoiceState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  invoices: OpsInvoiceRecord[];
}

const INVOICE_STATE_API_PATH = '/api/ops/invoices';
const LEGACY_INVOICE_STORAGE_KEY = 'ops-invoices-v1';

const canUseStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

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

const normalizeInvoiceStatus = (value: unknown): OpsInvoiceStatus => {
  const allowed: OpsInvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  const status = toStringValue(value, 'draft') as OpsInvoiceStatus;
  return allowed.includes(status) ? status : 'draft';
};

const normalizeInvoiceItem = (value: unknown, index: number): OpsInvoiceItemRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const description = toStringValue(value.description);
  if (!description) {
    return null;
  }

  return {
    id: toStringValue(value.id, `item-${index + 1}`),
    description,
    quantity: Math.max(0, toNumber(value.quantity, 0)),
    unitPrice: Math.max(0, toNumber(value.unitPrice ?? value.unit_price, 0)),
    total: Math.max(0, toNumber(value.total, 0)),
    containerType: toStringValue(value.containerType ?? value.container_type),
  };
};

export const normalizeOpsInvoice = (value: unknown): OpsInvoiceRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = toStringValue(value.id);
  const invoiceNumber = toStringValue(value.invoiceNumber ?? value.invoice_number);
  const customerId = toStringValue(value.customerId ?? value.customer_id);
  const customerName = toStringValue(value.customerName ?? value.customer_name);
  if (!id || !invoiceNumber || !customerId || !customerName) {
    return null;
  }

  const items = Array.isArray(value.items)
    ? value.items
        .map((item, index) => normalizeInvoiceItem(item, index))
        .filter((item): item is OpsInvoiceItemRecord => item !== null)
    : [];

  return {
    id,
    invoiceNumber,
    orderId: toStringValue(value.orderId ?? value.order_id) || undefined,
    customerId,
    customerName,
    issueDate: toStringValue(value.issueDate ?? value.issue_date),
    dueDate: toStringValue(value.dueDate ?? value.due_date),
    status: normalizeInvoiceStatus(value.status),
    subtotal: Math.max(0, toNumber(value.subtotal, 0)),
    tax: Math.max(0, toNumber(value.tax, 0)),
    total: Math.max(0, toNumber(value.total, 0)),
    taxProfileSnapshot: buildOpsTaxProfileSnapshot(
      value.taxProfileSnapshot ?? value.tax_profile_snapshot,
    ),
    amountPaid: Math.max(0, toNumber(value.amountPaid ?? value.amount_paid, 0)),
    items,
    notes: toStringValue(value.notes) || undefined,
    paymentTerms: toStringValue(value.paymentTerms ?? value.payment_terms, 'Net 30'),
    createdAt: toStringValue(value.createdAt ?? value.created_at),
    updatedAt: toStringValue(value.updatedAt ?? value.updated_at),
  };
};

export const normalizeOpsInvoiceState = (value: unknown): OpsInvoiceState => {
  const row = isRecord(value) ? value : {};
  return {
    schemaVersion: '1.0.0',
    id: 'ops-invoices',
    updatedAt: toStringValue(row.updatedAt) || new Date().toISOString(),
    invoices: Array.isArray(row.invoices)
      ? row.invoices
          .map((invoice) => normalizeOpsInvoice(invoice))
          .filter((invoice): invoice is OpsInvoiceRecord => invoice !== null)
      : [],
  };
};

const readLegacyInvoices = (): OpsInvoiceRecord[] => {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(LEGACY_INVOICE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((invoice) => normalizeOpsInvoice(invoice))
      .filter((invoice): invoice is OpsInvoiceRecord => invoice !== null);
  } catch {
    return [];
  }
};

const clearLegacyInvoices = (): void => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(LEGACY_INVOICE_STORAGE_KEY);
};

export const loadOpsInvoiceState = async (): Promise<OpsInvoiceState> => {
  const serverState = normalizeOpsInvoiceState(await apiGet<unknown>(INVOICE_STATE_API_PATH));
  if (serverState.invoices.length > 0) {
    return serverState;
  }

  const legacyInvoices = readLegacyInvoices();
  if (legacyInvoices.length === 0) {
    return serverState;
  }

  const migrated = normalizeOpsInvoiceState(
    await apiPost<unknown>(INVOICE_STATE_API_PATH, {
      ...serverState,
      invoices: legacyInvoices,
    }),
  );
  clearLegacyInvoices();
  return migrated;
};

export const persistOpsInvoiceState = async (invoices: OpsInvoiceRecord[]): Promise<OpsInvoiceState> =>
  normalizeOpsInvoiceState(
    await apiPost<unknown>(INVOICE_STATE_API_PATH, {
      schemaVersion: '1.0.0',
      id: 'ops-invoices',
      updatedAt: new Date().toISOString(),
      invoices,
    }),
  );
