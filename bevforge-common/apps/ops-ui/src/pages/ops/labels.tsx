import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet } from '@/lib/api';
import { buildOpsMobileLookupLink, buildOpsMobileRoutesLink } from '@/lib/ops-mobile-links';
import { buildPackageUnitQrPayload, fetchOpsPackageUnits, type OpsPackageUnitRecord } from '@/lib/package-units';
import { printHTML } from '@/lib/printing';
import { generateQRCode } from '@/lib/qr-code';
import { Boxes, Printer, QrCode, Search, Truck } from 'lucide-react';

type LabelScope = 'all' | 'units' | 'lots' | 'dispatches';

interface PackageLotSummary {
  packageLotId: string;
  packageLotCode?: string;
  batchCode?: string;
  skuId: string;
  productCode?: string;
  siteId: string;
  packageType?: string;
  packageFormatCode?: string;
  assetCode?: string;
  availableUnits: number;
}

interface DispatchSnapshot {
  truckId: string;
  truckName: string;
  packagingId: string;
  destination: string;
  dispatchedAt: string;
  readiness: 'ready-for-delivery';
  totalItems: number;
  totalWeightLb: number;
  totalVolumeFt3: number;
  loadedPackagingIds: string[];
}

interface LogisticsStatePayload {
  truckDispatch?: Record<string, DispatchSnapshot>;
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

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizePackageLots = (payload: unknown): PackageLotSummary[] => {
  const root = isRecord(payload) && 'data' in payload ? payload.data : payload;
  if (!Array.isArray(root)) {
    return [];
  }

  return root
    .filter(isRecord)
    .map((entry) => ({
      packageLotId: toStringValue(entry.packageLotId ?? entry.id),
      packageLotCode: toStringValue(entry.packageLotCode ?? entry.lotCode) || undefined,
      batchCode: toStringValue(entry.batchCode) || undefined,
      skuId: toStringValue(entry.skuId ?? entry.packageSkuId),
      productCode: toStringValue(entry.productCode) || undefined,
      siteId: toStringValue(entry.siteId, 'main'),
      packageType: toStringValue(entry.packageType) || undefined,
      packageFormatCode: toStringValue(entry.packageFormatCode) || undefined,
      assetCode: toStringValue(entry.assetCode) || undefined,
      availableUnits: Math.max(0, toNumber(entry.availableUnits)),
    }))
    .filter((entry) => entry.packageLotId && entry.skuId);
};

const normalizeDispatches = (payload: unknown): DispatchSnapshot[] => {
  const row = isRecord(payload) ? payload : {};
  const dispatchMap = isRecord(row.truckDispatch) ? row.truckDispatch : {};
  return Object.values(dispatchMap)
    .filter(isRecord)
    .map((entry) => ({
      truckId: toStringValue(entry.truckId),
      truckName: toStringValue(entry.truckName),
      packagingId: toStringValue(entry.packagingId),
      destination: toStringValue(entry.destination),
      dispatchedAt: toStringValue(entry.dispatchedAt),
      readiness: 'ready-for-delivery' as const,
      totalItems: Math.max(0, toNumber(entry.totalItems)),
      totalWeightLb: Math.max(0, toNumber(entry.totalWeightLb)),
      totalVolumeFt3: Math.max(0, toNumber(entry.totalVolumeFt3)),
      loadedPackagingIds: Array.isArray(entry.loadedPackagingIds)
        ? entry.loadedPackagingIds.map((value) => toStringValue(value)).filter(Boolean)
        : [],
    }))
    .filter((entry) => entry.truckId && entry.packagingId);
};

const buildSimpleLabelHtml = (title: string, metaLines: string[], payload: string): string => {
  const qr = generateQRCode(payload, { size: 320, color: '#111827', backgroundColor: '#ffffff' });
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          .wrap { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
          img { width: 320px; height: 320px; border: 1px solid #d1d5db; padding: 10px; border-radius: 10px; }
          h1 { margin: 0 0 10px; font-size: 28px; }
          p { margin: 6px 0; font-size: 14px; color: #374151; }
          @media print { @page { size: letter; margin: 0.5in; } }
        </style>
      </head>
      <body>
        <div class="wrap">
          <img src="${qr}" alt="QR code" />
          <div>
            <h1>${escapeHtml(title)}</h1>
            ${metaLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        </div>
      </body>
    </html>
  `;
};

export default function LabelsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<LabelScope>('all');
  const [packageUnits, setPackageUnits] = useState<OpsPackageUnitRecord[]>([]);
  const [packageLots, setPackageLots] = useState<PackageLotSummary[]>([]);
  const [dispatches, setDispatches] = useState<DispatchSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [packageUnitState, packageLotsPayload, logisticsState] = await Promise.all([
          fetchOpsPackageUnits(),
          apiGet<unknown>('/api/os/package-lots?siteId=main&status=active'),
          apiGet<LogisticsStatePayload>('/api/ops/logistics/state'),
        ]);
        if (!active) {
          return;
        }
        setPackageUnits(packageUnitState.units);
        setPackageLots(normalizePackageLots(packageLotsPayload));
        setDispatches(normalizeDispatches(logisticsState));
      } catch (error) {
        console.error('Failed to load OPS label station data:', error);
        if (!active) {
          return;
        }
        setPackageUnits([]);
        setPackageLots([]);
        setDispatches([]);
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

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredUnits = useMemo(
    () =>
      packageUnits.filter((unit) => {
        if (scope !== 'all' && scope !== 'units') {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        return [
          unit.label,
          unit.unitCode,
          unit.productName,
          unit.productCode,
          unit.batchCode,
          unit.packageLotCode,
          unit.assignedSiteName,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch));
      }),
    [normalizedSearch, packageUnits, scope],
  );

  const filteredLots = useMemo(
    () =>
      packageLots.filter((lot) => {
        if (scope !== 'all' && scope !== 'lots') {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        return [
          lot.packageLotCode,
          lot.batchCode,
          lot.skuId,
          lot.productCode,
          lot.assetCode,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch));
      }),
    [normalizedSearch, packageLots, scope],
  );

  const filteredDispatches = useMemo(
    () =>
      dispatches.filter((dispatch) => {
        if (scope !== 'all' && scope !== 'dispatches') {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        return [
          dispatch.truckId,
          dispatch.truckName,
          dispatch.packagingId,
          dispatch.destination,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      }),
    [dispatches, normalizedSearch, scope],
  );

  const printPackageUnit = (unit: OpsPackageUnitRecord) => {
    printHTML(
      buildSimpleLabelHtml(
        `${unit.label} QR`,
        [
          `Unit Code: ${unit.unitCode}`,
          `Type: ${unit.unitType}`,
          `Product: ${unit.productName}`,
          `Product Code: ${unit.productCode ?? 'Not set'}`,
          `SKU: ${unit.skuId ?? 'Not set'}`,
          `Batch: ${unit.batchCode ?? 'Not set'}`,
          `Package Lot: ${unit.packageLotCode ?? 'Not set'}`,
          `Asset: ${unit.assetCode ?? 'Not set'}`,
          `Client: ${unit.assignedSiteName ?? 'Not assigned'}`,
        ],
        buildPackageUnitQrPayload(unit),
      ),
      unit.unitCode,
    );
  };

  const printPackageLot = (lot: PackageLotSummary) => {
    const lotIdentifier = lot.packageLotCode ?? lot.packageLotId;
    const payload =
      buildOpsMobileLookupLink(lotIdentifier, {
        query: {
          type: 'package_lot',
          packageLotId: lot.packageLotId,
          packageLotCode: lot.packageLotCode,
          batchCode: lot.batchCode,
          skuId: lot.skuId,
          assetCode: lot.assetCode,
          schemaVersion: '1.0.0',
        },
      }) ??
      JSON.stringify({
        type: 'package_lot',
        packageLotId: lot.packageLotId,
        packageLotCode: lot.packageLotCode,
        batchCode: lot.batchCode,
        skuId: lot.skuId,
        assetCode: lot.assetCode,
        schemaVersion: '1.0.0',
      });

    printHTML(
      buildSimpleLabelHtml(
        `${lot.packageLotCode ?? lot.packageLotId} QR`,
        [
          `Package Lot: ${lot.packageLotCode ?? lot.packageLotId}`,
          `Batch: ${lot.batchCode ?? 'Not set'}`,
          `SKU: ${lot.skuId}`,
          `Product Code: ${lot.productCode ?? 'Not set'}`,
          `Format: ${lot.packageFormatCode ?? lot.packageType ?? 'Package'}`,
          `Asset: ${lot.assetCode ?? 'Not set'}`,
          `Available Units: ${lot.availableUnits}`,
        ],
        payload,
      ),
      lot.packageLotCode ?? lot.packageLotId,
    );
  };

  const printDispatch = (dispatch: DispatchSnapshot) => {
    const payload =
      buildOpsMobileRoutesLink({
        truckId: dispatch.truckId,
        shippingId: dispatch.packagingId,
        destination: dispatch.destination,
      }) ??
      JSON.stringify({
        type: 'ops_dispatch_payload',
        truckId: dispatch.truckId,
        shippingId: dispatch.packagingId,
        destination: dispatch.destination,
        dispatchedAt: dispatch.dispatchedAt,
        loadedPackagingIds: dispatch.loadedPackagingIds,
      });

    printHTML(
      buildSimpleLabelHtml(
        `${dispatch.truckName} Payload QR`,
        [
          `Truck: ${dispatch.truckName} (${dispatch.truckId})`,
          `Dispatch: ${dispatch.packagingId}`,
          `Destination: ${dispatch.destination}`,
          `Items: ${dispatch.totalItems}`,
          `Weight: ${dispatch.totalWeightLb} lb`,
          `Volume: ${dispatch.totalVolumeFt3} ft^3`,
        ],
        payload,
      ),
      dispatch.packagingId,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OPS Label Station</h1>
          <p className="text-muted-foreground">
            Print QR labels for package units, package lots, pallets, and truck payloads from one OPS print surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/ops/logistics">Open Logistics Canvas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/ops/logistics/trucks">Truck Board</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card style={panelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Package Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{packageUnits.length}</p>
            <p className="text-xs text-muted-foreground">Cases, kegs, pallets, trucks, and other QR-tracked units</p>
          </CardContent>
        </Card>
        <Card style={panelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Package Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{packageLots.length}</p>
            <p className="text-xs text-muted-foreground">OS-backed package lots available for warehouse labeling</p>
          </CardContent>
        </Card>
        <Card style={panelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready Dispatches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dispatches.length}</p>
            <p className="text-xs text-muted-foreground">Truck payloads ready for QR print and delivery packets</p>
          </CardContent>
        </Card>
      </div>

      <Card style={panelStyle}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search unit code, package lot, batch, client, or truck..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-lg"
              />
            </div>
            <Select value={scope} onValueChange={(value: LabelScope) => setScope(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All label sources</SelectItem>
                <SelectItem value="units">Package units only</SelectItem>
                <SelectItem value="lots">Package lots only</SelectItem>
                <SelectItem value="dispatches">Truck payloads only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card style={panelStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Package Unit Labels
          </CardTitle>
          <CardDescription>
            Stable OPS units that keep the same QR while pallet, truck, client, and location state changes behind the scenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading label station data...</p>
          ) : filteredUnits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching package units found.</p>
          ) : (
            <div className="space-y-3">
              {filteredUnits.map((unit) => (
                <div key={unit.unitId} className="rounded-lg border border-border/70 bg-background/20 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{unit.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {unit.unitCode} · {unit.productName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/40">
                        {unit.unitType}
                      </Badge>
                      <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-500/40">
                        {unit.status.replaceAll('_', ' ')}
                      </Badge>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => printPackageUnit(unit)}>
                        <Printer className="h-4 w-4" />
                        Print QR
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <p>Product Code: {unit.productCode ?? 'Not set'}</p>
                    <p>SKU: {unit.skuId ?? 'Not set'}</p>
                    <p>Client: {unit.assignedSiteName ?? 'Not assigned'}</p>
                    <p>Batch: {unit.batchCode ?? 'Not set'}</p>
                    <p>Package Lot: {unit.packageLotCode ?? 'Not set'}</p>
                    <p>Asset: {unit.assetCode ?? 'Not set'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Package Lot Labels
            </CardTitle>
            <CardDescription>
              Print OS-backed lot labels when you need direct batch/package-lot traceability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredLots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching package lots found.</p>
            ) : (
              filteredLots.map((lot) => (
                <div key={lot.packageLotId} className="rounded-lg border border-border/70 bg-background/20 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lot.packageLotCode ?? lot.packageLotId}</p>
                      <p className="text-xs text-muted-foreground">
                        {lot.skuId}
                        {lot.productCode ? ` · ${lot.productCode}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => printPackageLot(lot)}>
                      <Printer className="h-4 w-4" />
                      Print QR
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <p>Batch: {lot.batchCode ?? 'Not set'}</p>
                    <p>Format: {lot.packageFormatCode ?? lot.packageType ?? 'Package'}</p>
                    <p>Asset: {lot.assetCode ?? 'Not set'}</p>
                    <p>Available Units: {lot.availableUnits}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Truck Payload Labels
            </CardTitle>
            <CardDescription>
              Print route-level dispatch QR labels for trucks that are already marked ready for delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredDispatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ready dispatch payloads found.</p>
            ) : (
              filteredDispatches.map((dispatch) => (
                <div key={dispatch.packagingId} className="rounded-lg border border-border/70 bg-background/20 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{dispatch.truckName}</p>
                      <p className="text-xs text-muted-foreground">
                        {dispatch.packagingId} · {dispatch.destination}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => printDispatch(dispatch)}>
                      <Printer className="h-4 w-4" />
                      Print QR
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <p>Items: {dispatch.totalItems}</p>
                    <p>Weight: {dispatch.totalWeightLb} lb</p>
                    <p>Volume: {dispatch.totalVolumeFt3} ft^3</p>
                    <p>Loaded IDs: {dispatch.loadedPackagingIds.length}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
