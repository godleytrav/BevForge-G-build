import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  buildOpsTaxProfileSnapshot,
  formatOpsAccountType,
  formatOpsCertificateStatus,
  formatOpsSalesChannel,
  formatOpsTaxTreatment,
  isOpsCertificateExpired,
  resolveOpsCertificateStatus,
  type OpsTaxProfileSnapshot,
} from '@/lib/ops-tax';
import { loadOpsInvoiceState, type OpsInvoiceRecord } from '@/lib/ops-invoices';
import { printHTML } from '@/lib/printing';
import { Calendar, Download, FileText, ReceiptText, ShieldCheck, Store, Truck } from 'lucide-react';
import { getOpsClientRecords, loadOpsCrmState } from './crm/data';

type TaxRange = 'month' | 'quarter' | 'year' | 'all';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

type StoredInvoice = Pick<
  OpsInvoiceRecord,
  'id' | 'invoiceNumber' | 'customerId' | 'customerName' | 'issueDate' | 'status' | 'subtotal' | 'tax' | 'total' | 'taxProfileSnapshot'
>;

const formatCurrency = (value: number): string =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Not set';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return value;
  }
  return parsed.toLocaleDateString();
};

const getRangeStart = (range: TaxRange): Date | null => {
  const now = new Date();
  if (range === 'all') {
    return null;
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === 'month') {
    start.setMonth(start.getMonth() - 1);
    return start;
  }
  if (range === 'quarter') {
    start.setMonth(start.getMonth() - 3);
    return start;
  }
  start.setFullYear(start.getFullYear() - 1);
  return start;
};

const buildSalesReportHtml = (
  rangeLabel: string,
  invoices: StoredInvoice[]
): string => {
  const totals = invoices.reduce(
    (acc, invoice) => {
      acc.subtotal += invoice.subtotal;
      acc.tax += invoice.tax;
      acc.total += invoice.total;
      if (invoice.taxProfileSnapshot.salesChannel === 'retail') {
        acc.retail += invoice.total;
      } else if (invoice.taxProfileSnapshot.salesChannel === 'wholesale') {
        acc.wholesale += invoice.total;
      } else {
        acc.internal += invoice.total;
      }
      if (invoice.taxProfileSnapshot.taxTreatment === 'resale_exempt') {
        acc.exempt += invoice.subtotal;
      } else if (invoice.taxProfileSnapshot.taxTreatment === 'taxable') {
        acc.taxable += invoice.subtotal;
      }
      return acc;
    },
    {
      subtotal: 0,
      tax: 0,
      total: 0,
      retail: 0,
      wholesale: 0,
      internal: 0,
      taxable: 0,
      exempt: 0,
    }
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>OPS Tax Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 16px; }
          .title { font-size: 28px; font-weight: 700; }
          .muted { color: #6b7280; font-size: 12px; }
          .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
          .panel { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f9fafb; font-weight: 600; }
          .right { text-align: right; }
          @media print { @page { margin: 0.4in; size: letter landscape; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">OPS Sales Tax Report</div>
            <div class="muted">Range: ${rangeLabel}</div>
          </div>
          <div class="muted">Generated ${new Date().toLocaleString()}</div>
        </div>

        <div class="grid">
          <div class="panel"><strong>Gross Sales</strong><div>${formatCurrency(totals.total)}</div></div>
          <div class="panel"><strong>Taxable Sales</strong><div>${formatCurrency(totals.taxable)}</div></div>
          <div class="panel"><strong>Resale-Exempt Sales</strong><div>${formatCurrency(totals.exempt)}</div></div>
          <div class="panel"><strong>Tax Collected</strong><div>${formatCurrency(totals.tax)}</div></div>
          <div class="panel"><strong>Retail Sales</strong><div>${formatCurrency(totals.retail)}</div></div>
          <div class="panel"><strong>Wholesale Sales</strong><div>${formatCurrency(totals.wholesale)}</div></div>
          <div class="panel"><strong>Internal Transfers</strong><div>${formatCurrency(totals.internal)}</div></div>
          <div class="panel"><strong>Invoice Count</strong><div>${invoices.length}</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Channel</th>
              <th>Tax Treatment</th>
              <th>Certificate</th>
              <th class="right">Subtotal</th>
              <th class="right">Tax</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoices
              .map(
                (invoice) => `
                  <tr>
                    <td>${invoice.invoiceNumber}</td>
                    <td>${formatDate(invoice.issueDate)}</td>
                    <td>${invoice.customerName}</td>
                    <td>${formatOpsSalesChannel(invoice.taxProfileSnapshot.salesChannel)}</td>
                    <td>${formatOpsTaxTreatment(invoice.taxProfileSnapshot.taxTreatment)}</td>
                    <td>${invoice.taxProfileSnapshot.resaleCertificateNumber ?? ''}</td>
                    <td class="right">${formatCurrency(invoice.subtotal)}</td>
                    <td class="right">${formatCurrency(invoice.tax)}</td>
                    <td class="right">${formatCurrency(invoice.total)}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

const buildCertificateReportHtml = (
  accounts: Array<{
    id: string;
    name: string;
    taxProfile: OpsTaxProfileSnapshot;
  }>
): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>OPS Resale Certificate Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
        h1 { margin: 0 0 6px; }
        .muted { color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #f9fafb; font-weight: 600; }
        @media print { @page { margin: 0.4in; size: letter landscape; } }
      </style>
    </head>
    <body>
      <h1>OPS Resale Certificate Report</h1>
      <div class="muted">Generated ${new Date().toLocaleString()}</div>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Client ID</th>
            <th>Channel</th>
            <th>Account Type</th>
            <th>Tax Treatment</th>
            <th>Certificate Status</th>
            <th>Resale Certificate #</th>
            <th>Cert State</th>
            <th>Expires</th>
            <th>Seller Permit #</th>
          </tr>
        </thead>
        <tbody>
          ${accounts
            .map(
              (account) => `
                <tr>
                  <td>${account.name}</td>
                  <td>${account.id}</td>
                  <td>${formatOpsSalesChannel(account.taxProfile.salesChannel)}</td>
                  <td>${formatOpsAccountType(account.taxProfile.accountType)}</td>
                  <td>${formatOpsTaxTreatment(account.taxProfile.taxTreatment)}</td>
                  <td>${formatOpsCertificateStatus(resolveOpsCertificateStatus(account.taxProfile))}</td>
                  <td>${account.taxProfile.resaleCertificateNumber ?? ''}</td>
                  <td>${account.taxProfile.resaleCertificateState ?? ''}</td>
                  <td>${formatDate(account.taxProfile.resaleCertificateExpiresAt)}</td>
                  <td>${account.taxProfile.sellerPermitNumber ?? ''}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </body>
  </html>
`;

export default function TaxPage() {
  const [range, setRange] = useState<TaxRange>('month');
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);

  useEffect(() => {
    void (async () => {
      await loadOpsCrmState();
      const invoiceState = await loadOpsInvoiceState();
      setInvoices(
        invoiceState.invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          issueDate: invoice.issueDate,
          status: invoice.status,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          taxProfileSnapshot: buildOpsTaxProfileSnapshot(invoice.taxProfileSnapshot),
        })),
      );
    })();
  }, []);

  const clientRecords = useMemo(() => getOpsClientRecords(), []);
  const rangeStart = useMemo(() => getRangeStart(range), [range]);
  const rangeLabel = useMemo(() => {
    switch (range) {
      case 'quarter':
        return 'Last Quarter';
      case 'year':
        return 'Last Year';
      case 'all':
        return 'All Time';
      default:
        return 'Last 30 Days';
    }
  }, [range]);

  const filteredInvoices = useMemo(() => {
    if (!rangeStart) {
      return invoices;
    }
    return invoices.filter((invoice) => {
      const issueDate = new Date(invoice.issueDate);
      if (Number.isNaN(issueDate.valueOf())) {
        return false;
      }
      return issueDate >= rangeStart;
    });
  }, [invoices, rangeStart]);

  const totals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, invoice) => {
        acc.grossSales += invoice.total;
        acc.taxableSales +=
          invoice.taxProfileSnapshot.taxTreatment === 'taxable' ? invoice.subtotal : 0;
        acc.exemptSales +=
          invoice.taxProfileSnapshot.taxTreatment === 'resale_exempt' ? invoice.subtotal : 0;
        acc.taxCollected += invoice.tax;
        if (invoice.taxProfileSnapshot.salesChannel === 'wholesale') {
          acc.wholesaleSales += invoice.total;
        } else if (invoice.taxProfileSnapshot.salesChannel === 'internal') {
          acc.internalSales += invoice.total;
        } else {
          acc.retailSales += invoice.total;
        }
        return acc;
      },
      {
        grossSales: 0,
        taxableSales: 0,
        exemptSales: 0,
        taxCollected: 0,
        retailSales: 0,
        wholesaleSales: 0,
        internalSales: 0,
      }
    );
  }, [filteredInvoices]);

  const certificateAccounts = useMemo(
    () =>
      clientRecords.filter(
        (record) =>
          record.taxProfile.taxTreatment === 'resale_exempt' ||
          Boolean(record.taxProfile.resaleCertificateNumber) ||
          Boolean(record.taxProfile.sellerPermitNumber)
      ),
    [clientRecords]
  );

  const expiringCertificates = useMemo(() => {
    const fortyFiveDays = 45 * 24 * 60 * 60 * 1000;
    return certificateAccounts.filter((record) => {
      const expiresAt = record.taxProfile.resaleCertificateExpiresAt;
      if (!expiresAt) {
        return false;
      }
      if (isOpsCertificateExpired(expiresAt)) {
        return false;
      }
      const parsed = new Date(`${expiresAt}T23:59:59.999`).valueOf();
      const now = Date.now();
      return Number.isFinite(parsed) && parsed >= now && parsed <= now + fortyFiveDays;
    });
  }, [certificateAccounts]);

  const printSalesReport = () => {
    printHTML(buildSalesReportHtml(rangeLabel, filteredInvoices), 'ops-tax-sales-report');
  };

  const printCertificateReport = () => {
    printHTML(
      buildCertificateReportHtml(
        certificateAccounts.map((record) => ({
          id: record.id,
          name: record.name,
          taxProfile: record.taxProfile,
        }))
      ),
      'ops-resale-certificate-report'
    );
  };

  return (
    <AppShell pageTitle="OPS Tax Management" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tax Management</h1>
            <p className="mt-1 text-muted-foreground">
              Sales-tax reporting, wholesale exemption tracking, and printable compliance summaries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={range} onValueChange={(value: TaxRange) => setRange(value)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={printSalesReport}>
              <Download className="h-4 w-4" />
              Print Sales Report
            </Button>
            <Button variant="outline" className="gap-2" onClick={printCertificateReport}>
              <FileText className="h-4 w-4" />
              Print Certificate Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.grossSales)}</p>
              <p className="text-xs text-muted-foreground">{filteredInvoices.length} invoices in {rangeLabel.toLowerCase()}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxable Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.taxableSales)}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Exempt Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.exemptSales)}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.taxCollected)}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Certificates On File</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{certificateAccounts.length}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring In 45 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{expiringCertificates.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Store className="h-4 w-4" />
                Retail Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.retailSales)}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Truck className="h-4 w-4" />
                Wholesale Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.wholesaleSales)}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ReceiptText className="h-4 w-4" />
                Internal / Non-Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totals.internalSales)}</p>
            </CardContent>
          </Card>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle>Sales Tax Ledger</CardTitle>
            <CardDescription>
              Printable invoice-level breakdown for taxable retail sales and resale-exempt wholesale sales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No invoices were found in this range. Create invoices in OPS to build the sales-tax ledger.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-md border border-border/60 bg-background/20 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.customerName} · {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-muted-foreground">Tax {formatCurrency(invoice.tax)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{formatOpsSalesChannel(invoice.taxProfileSnapshot.salesChannel)}</Badge>
                      <Badge variant="outline">{formatOpsTaxTreatment(invoice.taxProfileSnapshot.taxTreatment)}</Badge>
                      <Badge variant="outline">
                        Rate {(invoice.taxProfileSnapshot.salesTaxRate * 100).toFixed(2)}%
                      </Badge>
                      {invoice.taxProfileSnapshot.resaleCertificateNumber && (
                        <Badge variant="outline">
                          Cert: {invoice.taxProfileSnapshot.resaleCertificateNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Resale Certificates & Permit Records
            </CardTitle>
            <CardDescription>
              Wholesale and exempt account tax paperwork stored on OPS CRM client records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificateAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certificate or permit records are stored on OPS clients yet.
              </p>
            ) : (
              certificateAccounts.map((record) => (
                <div key={record.id} className="rounded-md border border-border/60 bg-background/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{record.name}</p>
                      <p className="text-xs text-muted-foreground">{record.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{formatOpsSalesChannel(record.taxProfile.salesChannel)}</Badge>
                      <Badge variant="outline">{formatOpsAccountType(record.taxProfile.accountType)}</Badge>
                      <Badge variant="outline">{formatOpsTaxTreatment(record.taxProfile.taxTreatment)}</Badge>
                      <Badge variant="outline">
                        {formatOpsCertificateStatus(resolveOpsCertificateStatus(record.taxProfile))}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                    <p>Resale Cert: {record.taxProfile.resaleCertificateNumber || 'Not set'}</p>
                    <p>Cert State: {record.taxProfile.resaleCertificateState || 'Not set'}</p>
                    <p>Expires: {formatDate(record.taxProfile.resaleCertificateExpiresAt)}</p>
                    <p>Seller Permit: {record.taxProfile.sellerPermitNumber || 'Not set'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
