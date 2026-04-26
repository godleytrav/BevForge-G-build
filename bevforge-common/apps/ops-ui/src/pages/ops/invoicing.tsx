import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Search, Download, Send, DollarSign, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiGet } from '@/lib/api';
import {
  loadOpsInvoiceState,
  persistOpsInvoiceState,
  type OpsInvoiceRecord,
  type OpsInvoiceStatus,
} from '@/lib/ops-invoices';
import {
  buildOpsTaxProfileSnapshot,
  calculateOpsTaxAmount,
  formatOpsSalesChannel,
  formatOpsTaxTreatment,
  type OpsTaxProfileSnapshot,
} from '@/lib/ops-tax';
import { printHTML } from '@/lib/printing';
import { generateQRCode } from '@/lib/qr-code';
import { buildSiteSummaries } from './logistics/data';
import { getOpsClientRecord, getOpsClientRecords, loadOpsCrmState } from './crm/data';
type InvoiceStatus = OpsInvoiceStatus;

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

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  containerType?: string;
}

type InvoiceRecord = OpsInvoiceRecord;

interface OrderLineItem {
  id: string;
  productName: string;
  containerType: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OpsOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  taxAmount?: number;
  taxProfileSnapshot?: OpsTaxProfileSnapshot;
  lineItems: OrderLineItem[];
}

interface InvoiceFormState {
  orderId: string;
  customerId: string;
  customerName: string;
  paymentTerms: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  status: InvoiceStatus;
}

interface InvoiceFormItem {
  description: string;
  quantity: number;
  unitPrice: number;
  containerType?: string;
}

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeOrderStatus = (value: unknown): OrderStatus => {
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

const normalizeOrderLineItems = (value: unknown): OrderLineItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item, index) => {
      const quantity = Math.max(0, toNumber(item.quantity ?? item.qty, 0));
      const unitPrice = toNumber(item.unit_price ?? item.unitPrice ?? item.price, 0);
      return {
        id: toStringValue(item.id, `line-${index}`),
        productName:
          toStringValue(item.product_name) ||
          toStringValue(item.productName) ||
          toStringValue(item.item_name) ||
          `Line Item ${index + 1}`,
        containerType:
          toStringValue(item.container_type) ||
          toStringValue(item.containerType) ||
          toStringValue(item.size) ||
          'Package',
        quantity,
        unitPrice,
        total: toNumber(item.total_price ?? item.totalPrice ?? item.total, quantity * unitPrice),
      };
    });
};

const normalizeOrdersPayload = (payload: unknown): OpsOrder[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(isRecord)
    .map((order, index) => {
      const id = toStringValue(order.id, `order-${index + 1}`);
      const customerName =
        toStringValue(order.customer_name) ||
        toStringValue(order.customerName) ||
        'Unknown Customer';
      const customerId =
        toStringValue(order.customer_id) ||
        toStringValue(order.customerId) ||
        customerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return {
        id,
        orderNumber: toStringValue(order.orderNumber || order.order_number || id),
        customerId,
        customerName,
        status: normalizeOrderStatus(order.status),
        totalAmount: toNumber(order.total_amount ?? order.total, 0),
        taxAmount: toNumber(order.tax_amount ?? order.tax, 0),
        taxProfileSnapshot: buildOpsTaxProfileSnapshot(
          order.taxProfileSnapshot ?? order.tax_profile_snapshot
        ),
        lineItems: normalizeOrderLineItems(order.lineItems ?? order.line_items),
      };
    });
};

const defaultInvoiceForm = (): InvoiceFormState => {
  const today = new Date();
  const due = new Date();
  due.setDate(today.getDate() + 30);

  return {
    orderId: '',
    customerId: '',
    customerName: '',
    paymentTerms: 'Net 30',
    issueDate: today.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    notes: '',
    status: 'draft',
  };
};

const defaultInvoiceItem = (): InvoiceFormItem => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  containerType: '',
});

const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500';
    case 'sent':
      return 'bg-blue-500';
    case 'overdue':
      return 'bg-red-500';
    case 'draft':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: InvoiceStatus) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4" />;
    case 'sent':
      return <Send className="h-4 w-4" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const buildContainerTally = (items: InvoiceItem[]): Array<{ containerType: string; quantity: number }> => {
  const tally = new Map<string, number>();

  items.forEach((item) => {
    const key = item.containerType?.trim() || 'Package';
    tally.set(key, (tally.get(key) ?? 0) + Math.max(0, item.quantity));
  });

  return Array.from(tally.entries()).map(([containerType, quantity]) => ({ containerType, quantity }));
};

const generateInvoicePrintHtml = (invoice: InvoiceRecord): string => {
  const qrPayload = JSON.stringify({
    type: 'invoice',
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    generatedAt: new Date().toISOString(),
  });

  const qrDataUrl = generateQRCode(qrPayload, { size: 180, color: '#111827', backgroundColor: '#ffffff' });

  const totalUnits = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const tally = buildContainerTally(invoice.items);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 16px; }
          .title { font-size: 28px; font-weight: 700; }
          .muted { color: #6b7280; font-size: 12px; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-top: 14px; }
          .panel { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f9fafb; font-weight: 600; }
          .right { text-align: right; }
          .summary { margin-top: 16px; max-width: 320px; margin-left: auto; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .summary-total { font-size: 18px; font-weight: 700; border-top: 2px solid #111827; margin-top: 6px; padding-top: 8px; }
          .qr-wrap { display: flex; align-items: center; gap: 14px; margin-top: 18px; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
          .qr-wrap img { width: 140px; height: 140px; border: 1px solid #e5e7eb; }
          .tally { margin-top: 16px; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
          .tally-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          @media print {
            @page { margin: 0.4in; size: letter; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Invoice</div>
            <div class="muted">BevForge OPS Invoicing</div>
          </div>
          <div>
            <div><strong>${invoice.invoiceNumber}</strong></div>
            <div class="muted">Issued: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
            <div class="muted">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
            <div class="muted">Status: ${invoice.status}</div>
          </div>
        </div>

        <div class="grid">
          <div class="panel">
            <div class="muted">Bill To</div>
            <div><strong>${invoice.customerName}</strong></div>
            <div class="muted">Client ID: ${invoice.customerId}</div>
          </div>
          <div class="panel">
            <div class="muted">Invoice Meta</div>
            <div>Order: ${invoice.orderId || 'Manual'}</div>
            <div>Terms: ${invoice.paymentTerms}</div>
            <div>Channel: ${formatOpsSalesChannel(invoice.taxProfileSnapshot.salesChannel)}</div>
            <div>Tax: ${formatOpsTaxTreatment(invoice.taxProfileSnapshot.taxTreatment)}</div>
            ${
              invoice.taxProfileSnapshot.resaleCertificateNumber
                ? `<div>Resale Cert: ${invoice.taxProfileSnapshot.resaleCertificateNumber}</div>`
                : ''
            }
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Container</th>
              <th class="right">Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.containerType || 'Package'}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">$${item.unitPrice.toFixed(2)}</td>
                <td class="right">$${item.total.toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>$${invoice.subtotal.toFixed(2)}</span></div>
          <div class="summary-row"><span>Tax</span><span>$${invoice.tax.toFixed(2)}</span></div>
          <div class="summary-row"><span>Paid</span><span>$${invoice.amountPaid.toFixed(2)}</span></div>
          <div class="summary-row summary-total"><span>Total</span><span>$${invoice.total.toFixed(2)}</span></div>
        </div>

        <div class="tally">
          <div><strong>Item Tally</strong></div>
          <div class="muted">Total line items: ${invoice.items.length} · Total units: ${totalUnits}</div>
          ${tally.map((entry) => `<div class="tally-row"><span>${entry.containerType}</span><span>${entry.quantity}</span></div>`).join('')}
        </div>

        <div class="qr-wrap">
          <img src="${qrDataUrl}" alt="Invoice QR" />
          <div>
            <div><strong>Invoice QR</strong></div>
            <div class="muted">Contains invoice id, number, client id, and generation timestamp.</div>
            <div class="muted">${invoice.id}</div>
          </div>
        </div>

        ${invoice.notes ? `<div style="margin-top:16px;"><strong>Notes:</strong><div>${invoice.notes}</div></div>` : ''}
      </body>
    </html>
  `;
};

export default function InvoicingPage() {
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [form, setForm] = useState<InvoiceFormState>(defaultInvoiceForm);
  const [formItems, setFormItems] = useState<InvoiceFormItem[]>([defaultInvoiceItem()]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await loadOpsCrmState();
        const payload = await apiGet<unknown>('/api/orders');
        if (!active) {
          return;
        }
        setOrders(normalizeOrdersPayload(payload));
        const invoiceState = await loadOpsInvoiceState();
        if (!active) {
          return;
        }
        setInvoices(invoiceState.invoices);
      } catch {
        if (active) {
          setOrders([]);
          setInvoices([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const clients = useMemo(() => {
    const siteClients = buildSiteSummaries(orders).map((site) => ({ id: site.id, name: site.name }));
    const localClients = getOpsClientRecords().map((client) => ({ id: client.id, name: client.name }));

    const map = new Map<string, { id: string; name: string }>();
    [...siteClients, ...localClients].forEach((entry) => {
      map.set(entry.id, entry);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const openCreate = () => {
    setForm(defaultInvoiceForm());
    setFormItems([defaultInvoiceItem()]);
    setIsCreateDialogOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
    const overdueAmount = invoices
      .filter((invoice) => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (invoice.total - invoice.amountPaid), 0);

    return {
      totalRevenue,
      totalPaid,
      totalOutstanding: totalRevenue - totalPaid,
      overdueAmount,
    };
  }, [invoices]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === form.orderId) ?? null;
  }, [orders, form.orderId]);

  const selectedClientRecord = useMemo(() => {
    if (!form.customerId) {
      return null;
    }
    return getOpsClientRecord(form.customerId);
  }, [form.customerId]);

  const activeTaxProfile = useMemo(
    () =>
      buildOpsTaxProfileSnapshot(
        selectedOrder?.taxProfileSnapshot ?? selectedClientRecord?.taxProfile ?? undefined
      ),
    [selectedClientRecord, selectedOrder]
  );

  const onOrderChange = (orderId: string) => {
    const order = orders.find((entry) => entry.id === orderId);
    if (!order) {
      setForm((prev) => ({ ...prev, orderId }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      orderId,
      customerId: order.customerId,
      customerName: order.customerName,
    }));

    setFormItems(
      order.lineItems.length > 0
        ? order.lineItems.map((item) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            containerType: item.containerType,
          }))
        : [defaultInvoiceItem()]
    );
  };

  const onCustomerChange = (customerId: string) => {
    const customer = clients.find((entry) => entry.id === customerId);
    setForm((prev) => ({
      ...prev,
      customerId,
      customerName: customer?.name || prev.customerName,
    }));
  };

  const addFormItem = () => {
    setFormItems((prev) => [...prev, defaultInvoiceItem()]);
  };

  const removeFormItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateFormItem = (index: number, field: keyof InvoiceFormItem, value: string | number) => {
    setFormItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const saveInvoice = () => {
    const validItems = formItems
      .map((item) => ({
        description: item.description.trim(),
        quantity: Math.max(0, Number(item.quantity) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        containerType: item.containerType?.trim() || 'Package',
      }))
      .filter((item) => item.description.length > 0 && item.quantity > 0);

    if (!form.customerName.trim()) {
      globalThis.alert?.('Customer is required.');
      return;
    }
    if (validItems.length === 0) {
      globalThis.alert?.('At least one invoice item is required.');
      return;
    }

    const subtotal = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = calculateOpsTaxAmount(subtotal, activeTaxProfile);
    const total = Number((subtotal + tax).toFixed(2));
    const now = new Date();

    const nextInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${now.getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      orderId: form.orderId || undefined,
      customerId: form.customerId || form.customerName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      customerName: form.customerName,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: form.status,
      subtotal,
      tax,
      total,
      taxProfileSnapshot: buildOpsTaxProfileSnapshot(activeTaxProfile),
      amountPaid: form.status === 'paid' ? total : 0,
      items: validItems.map((item, index) => ({
        id: `item-${index + 1}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: Number((item.quantity * item.unitPrice).toFixed(2)),
        containerType: item.containerType,
      })),
      notes: form.notes,
      paymentTerms: form.paymentTerms,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const nextInvoices = [nextInvoice, ...invoices];
    setInvoices(nextInvoices);
    void persistOpsInvoiceState(nextInvoices)
      .then((state) => setInvoices(state.invoices))
      .catch((error) => {
        console.error('Failed to persist OPS invoices:', error);
      });
    setIsCreateDialogOpen(false);
  };

  const setInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    const next = invoices.map((invoice) => {
      if (invoice.id !== invoiceId) {
        return invoice;
      }
      const amountPaid = status === 'paid' ? invoice.total : invoice.amountPaid;
      return {
        ...invoice,
        status,
        amountPaid,
        updatedAt: new Date().toISOString(),
      };
    });

    setInvoices(next);
    void persistOpsInvoiceState(next)
      .then((state) => setInvoices(state.invoices))
      .catch((error) => {
        console.error('Failed to persist OPS invoices:', error);
      });
  };

  const printInvoice = (invoice: InvoiceRecord) => {
    const html = generateInvoicePrintHtml(invoice);
    printHTML(html, invoice.invoiceNumber);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoicing</h1>
          <p className="text-muted-foreground">Manage invoices, print QR documents, and track payments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Generate invoice from an order or create manual billing lines.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Source Order (optional)</Label>
                  <Select value={form.orderId} onValueChange={onOrderChange}>
                    <SelectTrigger id="order">
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNumber} · {order.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={form.customerId} onValueChange={onCustomerChange}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedOrder && (
                <div className="rounded-md border border-border/60 bg-background/20 p-3 text-xs text-muted-foreground">
                  Source order status: {selectedOrder.status} · Total ${selectedOrder.totalAmount.toFixed(2)}
                </div>
              )}

              <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatOpsSalesChannel(activeTaxProfile.salesChannel)}</Badge>
                  <Badge variant="outline">{formatOpsTaxTreatment(activeTaxProfile.taxTreatment)}</Badge>
                  <Badge variant="outline">
                    Tax rate: {(activeTaxProfile.salesTaxRate * 100).toFixed(2)}%
                  </Badge>
                  {activeTaxProfile.resaleCertificateNumber && (
                    <Badge variant="outline">
                      Cert: {activeTaxProfile.resaleCertificateNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={form.paymentTerms}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, paymentTerms: value }))}
                  >
                    <SelectTrigger id="paymentTerms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value: InvoiceStatus) => setForm((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="sent">sent</SelectItem>
                      <SelectItem value="paid">paid</SelectItem>
                      <SelectItem value="overdue">overdue</SelectItem>
                      <SelectItem value="cancelled">cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={form.issueDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, issueDate: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invoice Items</Label>
                <div className="space-y-2 rounded-lg border p-4">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Container</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Line Total</div>
                  </div>

                  {formItems.map((item, index) => (
                    <div key={`line-${index}`} className="grid grid-cols-12 gap-2">
                      <Input
                        className="col-span-4"
                        value={item.description}
                        placeholder="Product or service"
                        onChange={(event) => updateFormItem(index, 'description', event.target.value)}
                      />
                      <Input
                        className="col-span-2"
                        value={item.containerType || ''}
                        placeholder="Keg/Case"
                        onChange={(event) => updateFormItem(index, 'containerType', event.target.value)}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        value={item.quantity}
                        onChange={(event) => updateFormItem(index, 'quantity', parseInt(event.target.value, 10) || 0)}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateFormItem(index, 'unitPrice', parseFloat(event.target.value) || 0)}
                      />
                      <div className="col-span-2 flex items-center justify-between rounded-md border px-2 text-sm">
                        <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => removeFormItem(index)}
                          disabled={formItems.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" className="w-full" onClick={addFormItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or payment instructions..."
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      ${formItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (9%):</span>
                    <span className="font-medium">
                      ${(formItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 0.09).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      ${
                        (
                          formItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) *
                          1.09
                        ).toFixed(2)
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveInvoice}>Create Invoice</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totals.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${totals.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unpaid balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totals.overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Past due</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices or customers..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | InvoiceStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">draft</SelectItem>
                <SelectItem value="sent">sent</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="overdue">overdue</SelectItem>
                <SelectItem value="cancelled">cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Create, print, and manage invoice documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(invoice.status)} flex w-fit items-center gap-1`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${invoice.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${invoice.amountPaid.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${(invoice.total - invoice.amountPaid).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => printInvoice(invoice)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setInvoiceStatus(invoice.id, 'sent')}>
                        <Send className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button variant="ghost" size="sm" onClick={() => setInvoiceStatus(invoice.id, 'paid')}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
