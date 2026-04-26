import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  Beer,
  Box,
  Boxes,
  PanelRightOpen,
  Package2,
  Printer,
  QrCode,
  RefreshCw,
  Truck,
  Unplug,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { OpsCalendarSyncDevPanel } from '@/components/ops/OpsCalendarSyncDevPanel';
import { apiGet } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Link, useSearchParams } from 'react-router-dom';
import { makeOpsCalendarRecordId, postOpsCalendarEvent } from '@/lib/ops-calendar';
import { printHTML } from '@/lib/printing';
import { generateQRCode } from '@/lib/qr-code';
import {
  buildPackageUnitQrPayload,
  syncOpsPackageUnits,
  type OpsPackageUnitEventRecord,
  type OpsPackageUnitRecord,
  type OpsPackageUnitSyncPayload,
} from '@/lib/package-units';
import {
  buildOsSellableCatalog,
  parseOsInventoryCatalog,
  parseOsPackageLots,
  parseOsProductCatalog,
  type OsSellableCatalogItem,
} from '@/lib/os-identity';
import { getOpsClientRecords, loadOpsCrmState, type OpsClientRecord } from '@/pages/ops/crm/data';
import {
  fetchFleetProfiles,
  getVehicleCapacity,
  saveFleetProfiles,
  saveTruckDispatchSnapshot,
  type LogisticsTruckProfile,
} from './logistics/data';

type NodeType = 'six-pack' | 'case' | 'keg' | 'pallet' | 'truck';
type ProductNodeType = 'six-pack' | 'case' | 'keg';
type ContainerNodeType = 'case' | 'pallet' | 'truck';

interface NodeData {
  unitId?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  packageType?: string;
  packageFormatCode?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  reservationId?: string;
  reservationStatus?: 'reserved' | 'partially_reserved' | 'rejected';
  reservationShortQty?: number;
  reservationReason?: string;
  truckId?: string;
  assignedSiteId?: string;
  assignedSiteName?: string;
  productName: string;
  batchId: string;
  batchCode?: string;
  quantity: number;
  packagingId: string;
  destination: string;
  capacity: number;
}

interface AvailabilitySnapshot {
  schemaVersion: string;
  skuId: string;
  siteId: string;
  onHandQty: number;
  allocatedQty: number;
  availableQty: number;
  uom: string;
  asOf: string;
}

interface AllocationResponse {
  schemaVersion: string;
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
  respondedAt: string;
}

interface AssistedOrderLine {
  id: string;
  productName: string;
  productCode?: string;
  skuId?: string;
  containerType: string;
  packageType?: string;
  packageFormatCode?: string;
  batchCode?: string;
  packageLotCode?: string;
  assetCode?: string;
  quantity: number;
}

interface AssistedOrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  deliveryDate?: string;
  lineItems: AssistedOrderLine[];
}

interface CanvasNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
  data: NodeData;
}

interface NodeSpec {
  width: number;
  height: number;
  label: string;
  icon: LucideIcon;
  accentClass: string;
}

interface LoadEstimate {
  weightLb: number;
  volumeFt3: number;
}

interface ContainerLimits {
  maxItems: number;
  maxWeightLb: number;
  maxVolumeFt3: number;
  allowPallets: boolean;
  allowKegs: boolean;
}

interface DropEvaluation {
  accepted: boolean;
  reason?: string;
  blockedBy?: 'rule' | 'capacity';
  limits: ContainerLimits;
  projectedItems: number;
  projectedWeightLb: number;
  projectedVolumeFt3: number;
  deltaWeightLb: number;
  deltaVolumeFt3: number;
}

interface PaletteItem {
  type: NodeType;
  ariaLabel: string;
  icon: LucideIcon;
  accentClass: string;
}

type DragPayload =
  | { kind: 'palette'; nodeType: NodeType }
  | { kind: 'node'; nodeId: string; offsetX: number; offsetY: number };

const NODE_SPECS: Record<NodeType, NodeSpec> = {
  'six-pack': {
    width: 192,
    height: 146,
    label: '6-Pack',
    icon: Package2,
    accentClass: 'border-cyan-400/70 bg-cyan-500/10',
  },
  case: {
    width: 192,
    height: 146,
    label: 'Case',
    icon: Box,
    accentClass: 'border-sky-400/70 bg-sky-500/10',
  },
  keg: {
    width: 192,
    height: 146,
    label: 'Keg',
    icon: Beer,
    accentClass: 'border-sky-400/70 bg-sky-500/10',
  },
  pallet: {
    width: 260,
    height: 176,
    label: 'Pallet',
    icon: Boxes,
    accentClass: 'border-cyan-500/70 bg-cyan-500/10',
  },
  truck: {
    width: 300,
    height: 198,
    label: 'Truck',
    icon: Truck,
    accentClass: 'border-cyan-500/70 bg-cyan-500/10',
  },
};

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'six-pack',
    ariaLabel: 'Add 6-pack widget',
    icon: Package2,
    accentClass: 'border-cyan-400/70 bg-cyan-500/10',
  },
  {
    type: 'case',
    ariaLabel: 'Add case widget',
    icon: Box,
    accentClass: 'border-sky-400/70 bg-sky-500/10',
  },
  {
    type: 'keg',
    ariaLabel: 'Add keg widget',
    icon: Beer,
    accentClass: 'border-sky-400/70 bg-sky-500/10',
  },
  {
    type: 'pallet',
    ariaLabel: 'Add pallet tile',
    icon: Boxes,
    accentClass: 'border-cyan-500/70 bg-cyan-500/10',
  },
  {
    type: 'truck',
    ariaLabel: 'Add truck tile',
    icon: Truck,
    accentClass: 'border-cyan-500/70 bg-cyan-500/10',
  },
];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const isContainerType = (type: NodeType): type is ContainerNodeType =>
  type === 'case' || type === 'pallet' || type === 'truck';

const isProductType = (type: NodeType): type is ProductNodeType =>
  type === 'six-pack' || type === 'case' || type === 'keg';

const NODE_SIZE: Record<NodeType, number> = {
  'six-pack': 1,
  case: 2,
  keg: 3,
  pallet: 4,
  truck: 5,
};

const PALLET_LIMITS: ContainerLimits = {
  maxItems: 16,
  maxWeightLb: 2200,
  maxVolumeFt3: 64,
  allowPallets: false,
  allowKegs: true,
};

const DEFAULT_TRUCK_LIMITS: ContainerLimits = {
  maxItems: 24,
  maxWeightLb: 10000,
  maxVolumeFt3: 800,
  allowPallets: true,
  allowKegs: true,
};

const parseKegWeight = (name: string): number => {
  const normalized = name.toLowerCase();
  if (normalized.includes('1/2') || normalized.includes('half')) {
    return 165;
  }
  if (normalized.includes('full') || normalized.includes('15.5')) {
    return 165;
  }
  return 58;
};

const estimateProductLoad = (node: CanvasNode): LoadEstimate => {
  const name = node.data.productName.toLowerCase();
  const quantity = Math.max(1, node.data.quantity);

  if (node.type === 'six-pack') {
    const perUnitWeight = name.includes('16oz') || name.includes('16 oz') ? 6.7 : 5.2;
    const perUnitVolume = name.includes('16oz') || name.includes('16 oz') ? 0.42 : 0.36;
    return {
      weightLb: perUnitWeight * quantity,
      volumeFt3: perUnitVolume * quantity,
    };
  }

  if (node.type === 'case') {
    const caseWeight = name.includes('750') ? 32 : name.includes('16oz') || name.includes('16 oz') ? 29 : 22;
    const caseVolume = name.includes('750') ? 1.6 : name.includes('16oz') || name.includes('16 oz') ? 1.9 : 1.7;
    return {
      weightLb: caseWeight * quantity,
      volumeFt3: caseVolume * quantity,
    };
  }

  if (node.type === 'keg') {
    const kegWeight = parseKegWeight(name);
    const kegVolume = kegWeight >= 150 ? 7 : 3.2;
    return {
      weightLb: kegWeight * quantity,
      volumeFt3: kegVolume * quantity,
    };
  }

  return { weightLb: 0, volumeFt3: 0 };
};

const estimateNodeLoadRecursive = (node: CanvasNode, allNodes: CanvasNode[]): LoadEstimate => {
  const children = allNodes.filter((candidate) => candidate.parentId === node.id);

  if (children.length > 0) {
    const childLoad = children.reduce(
      (sum, child) => {
        const itemLoad = estimateNodeLoadRecursive(child, allNodes);
        return {
          weightLb: sum.weightLb + itemLoad.weightLb,
          volumeFt3: sum.volumeFt3 + itemLoad.volumeFt3,
        };
      },
      { weightLb: 0, volumeFt3: 0 }
    );

    if (node.type === 'pallet') {
      return { weightLb: childLoad.weightLb + 40, volumeFt3: childLoad.volumeFt3 + 4.5 };
    }

    if (node.type === 'case') {
      return { weightLb: childLoad.weightLb + 2, volumeFt3: childLoad.volumeFt3 + 0.2 };
    }

    return childLoad;
  }

  return estimateProductLoad(node);
};

const makeStableUnitId = (prefix: string): string => {
  const randomUuid = globalThis.crypto?.randomUUID;
  const suffix =
    typeof randomUuid === 'function'
      ? randomUuid.call(globalThis.crypto)
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${suffix}`;
};

const resolveCanvasUnitStatus = (node: CanvasNode, allNodes: CanvasNode[]): OpsPackageUnitRecord['status'] => {
  if (node.type === 'truck') {
    return 'staging';
  }
  if (node.parentId) {
    const parent = allNodes.find((candidate) => candidate.id === node.parentId);
    if (parent?.type === 'truck') {
      return 'loaded';
    }
    return 'packed';
  }
  if (node.data.reservationStatus === 'reserved' || node.data.reservationStatus === 'partially_reserved') {
    return 'reserved';
  }
  return 'staging';
};

const resolveCanvasLocation = (
  node: CanvasNode,
  allNodes: CanvasNode[],
): Pick<OpsPackageUnitRecord, 'currentLocationType' | 'currentLocationId' | 'currentLocationLabel'> => {
  if (!node.parentId) {
    return {
      currentLocationType: 'staging',
      currentLocationId: 'ops-canvas-staging',
      currentLocationLabel: 'OPS canvas staging',
    };
  }

  const parent = allNodes.find((candidate) => candidate.id === node.parentId);
  if (!parent) {
    return {
      currentLocationType: 'staging',
      currentLocationId: 'ops-canvas-staging',
      currentLocationLabel: 'OPS canvas staging',
    };
  }

  if (parent.type === 'truck') {
    return {
      currentLocationType: 'truck',
      currentLocationId: parent.data.truckId ?? parent.data.packagingId,
      currentLocationLabel: parent.label,
    };
  }

  return {
    currentLocationType: 'container',
    currentLocationId: parent.data.unitId ?? parent.id,
    currentLocationLabel: parent.label,
  };
};

const buildPackageUnitRecordFromNode = (
  node: CanvasNode,
  allNodes: CanvasNode[],
): OpsPackageUnitRecord => {
  const parent = node.parentId ? allNodes.find((candidate) => candidate.id === node.parentId) : null;
  const childNodes = allNodes.filter((candidate) => candidate.parentId === node.id);
  const location = resolveCanvasLocation(node, allNodes);

  return {
    schemaVersion: '1.0.0',
    id: node.data.unitId ?? node.id,
    unitId: node.data.unitId ?? node.id,
    unitCode: node.data.packagingId,
    unitType: node.type,
    label: node.label,
    productName: node.data.productName,
    quantity: Math.max(0, node.data.quantity),
    status: resolveCanvasUnitStatus(node, allNodes),
    currentLocationType: location.currentLocationType,
    currentLocationId: location.currentLocationId,
    currentLocationLabel: location.currentLocationLabel,
    activeOnCanvas: true,
    source: 'ops-canvas-logistics',
    productId: node.data.productId,
    productCode: node.data.productCode,
    skuId: node.data.skuId,
    packageType: node.data.packageType,
    packageFormatCode: node.data.packageFormatCode,
    batchId: node.data.batchId,
    batchCode: node.data.batchCode,
    packageLotId: node.data.packageLotId,
    packageLotCode: node.data.packageLotCode,
    assetId: node.data.assetId,
    assetCode: node.data.assetCode,
    assignedSiteId: node.data.assignedSiteId,
    assignedSiteName: node.data.assignedSiteName,
    assignedOrderId: node.data.reservationId ? `ops-canvas-${node.id}` : undefined,
    parentUnitId: parent?.data.unitId,
    parentUnitCode: parent?.data.packagingId,
    childUnitIds: childNodes.map((child) => child.data.unitId ?? child.id),
    childUnitCodes: childNodes.map((child) => child.data.packagingId),
    lastEventAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const buildPackageUnitPrintHtml = (
  unit: OpsPackageUnitRecord,
  contents: OpsPackageUnitRecord[],
): string => {
  const qr = generateQRCode(buildPackageUnitQrPayload(unit), {
    size: 300,
    color: '#111827',
    backgroundColor: '#ffffff',
  });
  const lines = [
    unit.productCode ? `Product Code: ${unit.productCode}` : null,
    unit.skuId ? `SKU: ${unit.skuId}` : null,
    unit.batchCode ? `Batch: ${unit.batchCode}` : null,
    unit.packageLotCode ? `Package Lot: ${unit.packageLotCode}` : null,
    unit.assetCode ? `Asset: ${unit.assetCode}` : null,
    unit.assignedSiteName ? `Client: ${unit.assignedSiteName}` : null,
    unit.currentLocationLabel ? `Location: ${unit.currentLocationLabel}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .map((line) => `<p class="meta">${line}</p>`)
    .join('');
  const contentsHtml =
    contents.length > 0
      ? `<div class="contents"><p class="section">Contents</p><ul>${contents
          .map((item) => `<li>${item.label} · ${item.unitCode}${item.productName ? ` · ${item.productName}` : ''}</li>`)
          .join('')}</ul></div>`
      : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${unit.label} QR</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          .wrap { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
          img { width: 300px; height: 300px; border: 1px solid #d1d5db; padding: 10px; border-radius: 10px; }
          h1 { margin: 0 0 10px; font-size: 28px; }
          .meta { margin: 6px 0; font-size: 14px; color: #374151; }
          .section { margin: 18px 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
          ul { margin: 0; padding-left: 18px; }
          li { margin: 4px 0; font-size: 13px; color: #374151; }
          @media print { @page { size: letter; margin: 0.5in; } }
        </style>
      </head>
      <body>
        <div class="wrap">
          <img src="${qr}" alt="QR code" />
          <div>
            <h1>${unit.label}</h1>
            <p class="meta">Code: ${unit.unitCode}</p>
            <p class="meta">Type: ${unit.unitType}</p>
            <p class="meta">Product: ${unit.productName}</p>
            ${lines}
            ${contentsHtml}
          </div>
        </div>
      </body>
    </html>
  `;
};

const normalizeBuildOrders = (payload: unknown): AssistedOrderRecord[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry, index) => {
      const lineItems = Array.isArray(entry.lineItems)
        ? entry.lineItems
            .filter((line): line is Record<string, unknown> => typeof line === 'object' && line !== null)
            .map((line, lineIndex) => ({
              id: typeof line.id === 'string' ? line.id : `line-${index}-${lineIndex}`,
              productName:
                (typeof line.productName === 'string' && line.productName) ||
                (typeof line.product_name === 'string' && line.product_name) ||
                `Line ${lineIndex + 1}`,
              productCode:
                typeof line.productCode === 'string'
                  ? line.productCode
                  : typeof line.product_code === 'string'
                    ? line.product_code
                    : undefined,
              skuId:
                typeof line.skuId === 'string'
                  ? line.skuId
                  : typeof line.sku_id === 'string'
                    ? line.sku_id
                    : undefined,
              containerType:
                (typeof line.containerType === 'string' && line.containerType) ||
                (typeof line.container_type === 'string' && line.container_type) ||
                'Package',
              packageType:
                typeof line.packageType === 'string'
                  ? line.packageType
                  : typeof line.package_type === 'string'
                    ? line.package_type
                    : undefined,
              packageFormatCode:
                typeof line.packageFormatCode === 'string'
                  ? line.packageFormatCode
                  : typeof line.package_format_code === 'string'
                    ? line.package_format_code
                    : undefined,
              batchCode:
                typeof line.batchCode === 'string'
                  ? line.batchCode
                  : typeof line.batch_code === 'string'
                    ? line.batch_code
                    : undefined,
              packageLotCode:
                typeof line.packageLotCode === 'string'
                  ? line.packageLotCode
                  : typeof line.package_lot_code === 'string'
                    ? line.package_lot_code
                    : undefined,
              assetCode:
                typeof line.assetCode === 'string'
                  ? line.assetCode
                  : typeof line.asset_code === 'string'
                    ? line.asset_code
                    : undefined,
              quantity:
                typeof line.quantity === 'number' && Number.isFinite(line.quantity)
                  ? Math.max(0, Math.round(line.quantity))
                  : typeof line.quantity === 'string'
                    ? Math.max(0, Math.round(Number(line.quantity) || 0))
                    : 0,
            }))
            .filter((line) => line.quantity > 0)
        : [];

      return {
        id: typeof entry.id === 'string' ? entry.id : `order-${index + 1}`,
        orderNumber:
          (typeof entry.orderNumber === 'string' && entry.orderNumber) ||
          (typeof entry.order_number === 'string' && entry.order_number) ||
          `ORDER-${index + 1}`,
        customerId:
          (typeof entry.customerId === 'string' && entry.customerId) ||
          (typeof entry.customer_id === 'string' && entry.customer_id) ||
          '',
        customerName:
          (typeof entry.customerName === 'string' && entry.customerName) ||
          (typeof entry.customer_name === 'string' && entry.customer_name) ||
          'Unknown Client',
        status:
          (typeof entry.status === 'string' && entry.status) ||
          'draft',
        deliveryDate:
          typeof entry.deliveryDate === 'string'
            ? entry.deliveryDate
            : typeof entry.delivery_date === 'string'
              ? entry.delivery_date
              : undefined,
        lineItems,
      };
    })
    .filter((order) => order.lineItems.length > 0);
};

const inferNodeTypeFromLine = (line: AssistedOrderLine): ProductNodeType => {
  const descriptor = `${line.packageType ?? ''} ${line.packageFormatCode ?? ''} ${line.containerType}`.toLowerCase();
  if (descriptor.includes('keg')) {
    return 'keg';
  }
  if ((descriptor.includes('six') || descriptor.includes('6')) && descriptor.includes('pack')) {
    return 'six-pack';
  }
  return 'case';
};

interface PackageUnitEventOptions {
  detail?: string;
  metadata?: Record<string, unknown>;
}

const buildPackageUnitEventFromNode = (
  node: CanvasNode,
  allNodes: CanvasNode[],
  eventType: string,
  summary: string,
  options: PackageUnitEventOptions = {},
): OpsPackageUnitEventRecord => {
  const unit = buildPackageUnitRecordFromNode(node, allNodes);

  return {
    schemaVersion: '1.0.0',
    id: `pkg-event-${eventType}-${unit.unitId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    unitId: unit.unitId,
    unitCode: unit.unitCode,
    unitType: unit.unitType,
    eventType,
    summary,
    detail: options.detail,
    occurredAt: new Date().toISOString(),
    parentUnitId: unit.parentUnitId,
    parentUnitCode: unit.parentUnitCode,
    locationType: unit.currentLocationType,
    locationId: unit.currentLocationId,
    locationLabel: unit.currentLocationLabel,
    assignedSiteId: unit.assignedSiteId,
    assignedSiteName: unit.assignedSiteName,
    productCode: unit.productCode,
    skuId: unit.skuId,
    batchCode: unit.batchCode,
    packageLotCode: unit.packageLotCode,
    assetCode: unit.assetCode,
    metadata: options.metadata,
  };
};

const collectDescendantNodes = (rootNodeId: string, allNodes: CanvasNode[]): CanvasNode[] => {
  const descendants: CanvasNode[] = [];
  const queue = allNodes.filter((node) => node.parentId === rootNodeId);

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      continue;
    }
    descendants.push(node);
    queue.push(...allNodes.filter((candidate) => candidate.parentId === node.id));
  }

  return descendants;
};

const createDefaultData = (type: NodeType): NodeData => {
  if (type === 'pallet') {
    return {
      unitId: makeStableUnitId(type),
      productName: 'Mixed Load',
      batchId: 'N/A',
      batchCode: 'N/A',
      quantity: 0,
      packagingId: 'PLT-000',
      destination: 'Staging Lane A',
      capacity: 16,
    };
  }

  if (type === 'truck') {
    return {
      unitId: makeStableUnitId(type),
      productName: 'Route Load',
      batchId: 'N/A',
      batchCode: 'N/A',
      quantity: 0,
      packagingId: 'TRK-000',
      destination: 'Route Alpha',
      capacity: 24,
    };
  }

  return {
    unitId: makeStableUnitId(type),
    productName: type === 'keg' ? 'Cider Keg' : type === 'case' ? 'Cider Case' : 'Cider 6-Pack',
    batchId: 'BATCH-001',
    batchCode: 'BATCH-001',
    quantity: type === 'keg' ? 1 : 2,
    packagingId: `PKG-${Math.floor(Math.random() * 9000 + 1000)}`,
    destination: 'Staging',
    capacity: type === 'case' ? 4 : 0,
  };
};

const getCarrierSlotPosition = (
  carrier: CanvasNode,
  slotIndex: number,
  productWidth: number,
  productHeight: number
): { x: number; y: number } => {
  if (carrier.type === 'pallet') {
    const columns = 2;
    const gapX = 12;
    const gapY = 10;
    const startX = carrier.x + 14;
    const startY = carrier.y + 74;

    return {
      x: startX + (slotIndex % columns) * (productWidth + gapX),
      y: startY + Math.floor(slotIndex / columns) * (productHeight + gapY),
    };
  }

  const columns = 3;
  const gapX = 8;
  const gapY = 8;
  const startX = carrier.x + 18;
  const startY = carrier.y + 92;

  return {
    x: startX + (slotIndex % columns) * (productWidth + gapX),
    y: startY + Math.floor(slotIndex / columns) * (productHeight + gapY),
  };
};

const resolveContainerLimits = (
  containerNode: CanvasNode,
  fleetMap: Map<string, LogisticsTruckProfile>
): ContainerLimits => {
  if (containerNode.type === 'pallet') {
    return { ...PALLET_LIMITS, maxItems: Math.max(1, containerNode.data.capacity) };
  }

  if (containerNode.type === 'truck') {
    const selectedTruck = containerNode.data.truckId ? fleetMap.get(containerNode.data.truckId) : null;
    if (!selectedTruck) {
      return { ...DEFAULT_TRUCK_LIMITS, maxItems: Math.max(1, containerNode.data.capacity) };
    }

    const vehicle = getVehicleCapacity(selectedTruck.vehicleType);
    return {
      maxItems: Math.max(1, containerNode.data.capacity),
      maxWeightLb: vehicle.maxPayloadLb,
      maxVolumeFt3: vehicle.maxVolumeFt3,
      allowPallets: vehicle.allowPallets,
      allowKegs: vehicle.allowKegs,
    };
  }

  return {
    maxItems: Math.max(1, containerNode.data.capacity),
    maxWeightLb: Number.POSITIVE_INFINITY,
    maxVolumeFt3: Number.POSITIVE_INFINITY,
    allowPallets: true,
    allowKegs: true,
  };
};

const gaugeToneClass = (ratio: number): string => {
  const pct = ratio * 100;
  if (pct >= 95) {
    return 'bg-red-400';
  }
  if (pct >= 80) {
    return 'bg-amber-300';
  }
  return 'bg-cyan-300';
};

const ShippingTruckOutline = () => (
  <svg viewBox="0 0 216 160" className="h-full w-full" aria-hidden>
    <g fill="none" stroke="#a5f3fc" strokeWidth="1.8" strokeMiterlimit="10">
      <path d="M74.52,93.92c-16.29,0-32.59.01-48.88-.02-1.77,0-3.56-.14-5.29-.48-4.24-.84-6.91-3.59-7.75-8.13-.38-2.08-.5-4.25-.5-6.38-.03-17.4,0-34.8.03-52.21,0-1.57.07-3.16.33-4.7.9-5.35,3.78-8.34,8.9-9.03,2.27-.31,4.6-.25,6.9-.25,17.23,0,34.45.02,51.68.04,10.25.02,20.5.08,30.75.08,4.55,0,9.1-.17,13.64-.13,1.6.01,3.24.26,4.8.67,3.86,1.01,6.31,3.72,6.93,7.89.44,2.91.43,5.92.44,8.89.03,16.5.02,33,0,49.5,0,1.73-.02,3.5-.3,5.2-.82,5.07-3.52,7.92-8.24,8.77-1.5.27-3.04.39-4.55.39-16.29.03-32.59.02-48.88.02,0-.04,0-.08,0-.12Z" />
      <path d="M86.96,99.24c3.22,0,6.09,0,8.95,0,10.34.01,20.69.06,31.03,0,1.73,0,3.5-.23,5.17-.69,5.11-1.39,8.04-5.12,8.85-10.59.48-3.22.56-6.53.57-9.8.03-8.16-.08-16.33-.12-24.49,0-1.2-.02-2.41.08-3.61.42-4.98,2.51-7.38,7.12-7.99,5.75-.77,11.43-.11,16.86,1.96,17.82,6.78,27.72,20.55,30.29,40.5.87,6.78.52,13.63.28,20.46-.06,1.64-.11,3.28-.22,4.91-.26,3.88-2.19,6.38-5.57,7.6-1.75.63-3.56.97-5.43.73-1.77-.23-3.12-1.17-4-2.79-.57-1.06-1.05-2.21-1.43-3.37-1.68-5.18-4.21-9.71-8.49-12.88-4.93-3.64-10.47-4.53-16.26-3.62-8.41,1.31-13.76,6.65-16.66,15.06-.29.85-.58,1.7-.91,2.53-1.42,3.54-3.96,5.33-7.51,5.4-1.8.04-3.61-.06-5.42-.16-5.11-.28-10.2-.04-15.31.4-2.77.24-5.62.15-8.38-.23-6.44-.88-10.49-4.91-12.17-11.6-.62-2.46-.89-5.03-1.35-7.74ZM179.06,74.98c.01-.2.04-.3.02-.38-1.25-4.56-2.62-9.07-4.81-13.23-1.37-2.62-3.04-4.99-5.44-6.63-4.51-3.08-9.31-2.77-14.12-1.12-2.66.91-4.12,3.09-4.2,6.11-.11,4.39,1.15,8.37,3.55,11.9,1.39,2.04,3.34,3.24,5.7,3.4,1.69.12,3.42.05,5.11-.16,4.73-.6,9.45-1.97,14.19.11Z" />
      <path d="M12.33,148.34c2.34-2.14,4.68-4.29,7.02-6.43,1.59-1.45,3.15-2.94,4.78-4.34.42-.36,1.04-.6,1.57-.6,12.93-.06,25.86-.08,38.79-.11,15.76-.03,31.53-.05,47.29-.08,14.42-.03,28.85-.07,43.27-.11.21,0,.41-.02.86-.05-1.32-.43-2.42-.73-3.49-1.14-6.46-2.42-9.89-7.37-10.44-14.65-.24-3.16-.04-6.3.94-9.32,1.61-4.95,4.82-8.12,9.47-9.57,3.88-1.2,7.82-1.3,11.73-.21,4.88,1.36,8.18,4.66,9.82,9.8,1.17,3.68,1.43,7.47.83,11.3-1.05,6.72-4.97,10.71-10.8,12.8-.88.31-1.78.56-2.66.97h26.98c-1.4,1.31-2.57,2.42-3.78,3.5-.16.15-.47.13-.71.15-11.54.56-23.09,1.11-34.63,1.67-16.06.78-32.11,1.57-48.17,2.35-16.24.79-32.49,1.58-48.73,2.36-10.33.5-20.66.99-30.99,1.48-2.95.14-5.91.29-8.86.44-.03-.07-.05-.15-.08-.22ZM151.05,118.61c0,4.94,2.76,7.94,7.3,7.94,4.87,0,7.41-3.32,7.43-7.78.02-4.12-2.25-8.01-7.25-8.01-4.67,0-7.49,2.95-7.48,7.86Z" />
      <path d="M69.74,136.62c-5.01-.14-9.19-1.41-12.47-5.14-1.78-2.02-2.9-4.43-3.5-7.1-.9-3.97-.92-7.96.12-11.91,1.34-5.1,4.36-8.57,9.02-10.3,3.95-1.46,8-1.69,12.06-.6,5.47,1.46,8.66,5.47,10.38,11.04,2.25,7.3.86,13.82-3.91,19.43-2.36,2.78-5.59,3.91-9.01,4.36-1.02.13-2.05.16-2.67.21ZM62.41,118.89c-.05,4.62,2.76,7.57,7.27,7.65,4.14.07,7.49-3.27,7.52-7.49.03-5.01-2.96-8.21-7.75-8.28-4.29-.06-6.99,3.06-7.04,8.12Z" />
      <path d="M37.01,99.44c2.04-.1,4.08-.19,6.12-.29.09,0,.2-.03.27.02,1.64,1.02,3.33.42,5.01.21.89-.11,1.79-.19,2.69-.15.89.04,1.3.7,1.32,1.62,0,.33,0,.68-.06,1-.65,3.13-1.19,6.3-2.02,9.37-1.46,5.46-4.55,7.71-9.8,7.28-1.41-.12-2.84-.44-4.2-.87-3.09-.99-5.01-3.24-5.76-6.62-.52-2.34-.61-4.7-.25-7.07.49-3.16,2-4.6,4.98-4.76.56-.03,1.12,0,1.68,0,0,.09,0,.18,0,.28Z" />
    </g>
  </svg>
);

export default function CanvasLogisticsPage() {
  const [searchParams] = useSearchParams();
  const defaultSiteId = 'main';
  const idCounterRef = useRef(1);
  const unpackOffsetRef = useRef(0);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const packageUnitPersistRef = useRef<Promise<unknown>>(Promise.resolve());
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configDialogNodeId, setConfigDialogNodeId] = useState<string | null>(null);
  const [hoveredCarrierId, setHoveredCarrierId] = useState<string | null>(null);
  const [carrierFlash, setCarrierFlash] = useState<Record<string, 'success' | 'warning'>>({});
  const [widgetMenuOpen, setWidgetMenuOpen] = useState(false);
  const [deleteConfirmNodeId, setDeleteConfirmNodeId] = useState<string | null>(null);
  const [productSetupNodeId, setProductSetupNodeId] = useState<string | null>(null);
  const [productSetupProductId, setProductSetupProductId] = useState<string>('');
  const [inventoryItems, setInventoryItems] = useState<OsSellableCatalogItem[]>([]);
  const [productSetupSiteId, setProductSetupSiteId] = useState<string>(defaultSiteId);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [reservePending, setReservePending] = useState(false);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [clientRecords, setClientRecords] = useState<OpsClientRecord[]>([]);
  const [buildOrders, setBuildOrders] = useState<AssistedOrderRecord[]>([]);
  const [buildOrderId, setBuildOrderId] = useState<string>('');
  const [truckSelectNodeId, setTruckSelectNodeId] = useState<string | null>(null);
  const [truckSelectValue, setTruckSelectValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Drag widgets onto the canvas. Drop package nodes on pallets or trucks to load.'
  );
  const requestedBuildOrderId = searchParams.get('orderId')?.trim() ?? '';
  const logisticsEntrySource = searchParams.get('source')?.trim() ?? '';

  const createNode = (type: NodeType, x: number, y: number): CanvasNode => {
    const spec = NODE_SPECS[type];
    const id = `${type}-${idCounterRef.current++}`;

    return {
      id,
      type,
      label: `${spec.label} ${idCounterRef.current - 1}`,
      x,
      y,
      width: spec.width,
      height: spec.height,
      data: createDefaultData(type),
    };
  };

  const createStarterLayout = (): CanvasNode[] => {
    const truck = createNode('truck', 700, 76);
    truck.data.destination = 'Route North - Truck 01';
    truck.data.packagingId = 'TRK-01';
    truck.data.truckId = 'TRK-01';

    const pallet = createNode('pallet', 380, 150);
    pallet.data.destination = 'Dock Lane 2';
    pallet.data.packagingId = 'PLT-110';

    const keg = createNode('keg', 104, 82);
    keg.data.productName = 'Dry Cider Keg';
    keg.data.batchId = 'BATCH-2201';
    keg.data.batchCode = 'BATCH-2201';
    keg.data.packagingId = 'PKG-2201';

    const caseNode = createNode('case', 112, 268);
    caseNode.data.productName = 'Apple Case';
    caseNode.data.batchId = 'BATCH-2202';
    caseNode.data.batchCode = 'BATCH-2202';
    caseNode.data.packagingId = 'PKG-2202';

    const sixPack = createNode('six-pack', 120, 442);
    sixPack.data.productName = 'Pear 6-Pack';
    sixPack.data.batchId = 'BATCH-2203';
    sixPack.data.batchCode = 'BATCH-2203';
    sixPack.data.packagingId = 'PKG-2203';

    return [truck, pallet, keg, caseNode, sixPack];
  };

  const [nodes, setNodes] = useState<CanvasNode[]>(() => createStarterLayout());

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const configDialogNode = useMemo(
    () => (configDialogNodeId ? nodes.find((node) => node.id === configDialogNodeId) ?? null : null),
    [configDialogNodeId, nodes]
  );

  const configDialogContents = useMemo(() => {
    if (!configDialogNodeId) {
      return [];
    }
    return nodes.filter((node) => node.parentId === configDialogNodeId);
  }, [configDialogNodeId, nodes]);

  const productSetupNode = useMemo(
    () => (productSetupNodeId ? nodes.find((node) => node.id === productSetupNodeId) ?? null : null),
    [nodes, productSetupNodeId]
  );

  const productSetupItem = useMemo(
    () => inventoryItems.find((item) => item.id === productSetupProductId) ?? null,
    [inventoryItems, productSetupProductId]
  );
  const fleetMap = useMemo(() => new Map(fleet.map((truck) => [truck.id, truck])), [fleet]);
  const clientMap = useMemo(() => new Map(clientRecords.map((client) => [client.id, client])), [clientRecords]);
  const selectedBuildOrder = useMemo(
    () => buildOrders.find((order) => order.id === buildOrderId) ?? null,
    [buildOrderId, buildOrders],
  );
  const requestedBuildOrder = useMemo(
    () => buildOrders.find((order) => order.id === requestedBuildOrderId) ?? null,
    [buildOrders, requestedBuildOrderId]
  );
  const configAssignedClient =
    configDialogNode?.data.assignedSiteId ? clientMap.get(configDialogNode.data.assignedSiteId) ?? null : null;

  const configInventoryItem =
    configDialogNode &&
    isProductType(configDialogNode.type) &&
    (configDialogNode.data.productId || configDialogNode.data.skuId)
      ? inventoryItems.find(
          (item) =>
            item.id === configDialogNode.data.productId ||
            item.productId === configDialogNode.data.productId ||
            (!!configDialogNode.data.skuId && item.skuId === configDialogNode.data.skuId)
        ) ?? null
      : null;

  const configAvailableQty = configInventoryItem
    ? Math.max(0, configInventoryItem.onHandQty - configInventoryItem.allocatedQty)
    : null;
  const configContainerLimits =
    configDialogNode && isContainerType(configDialogNode.type)
      ? resolveContainerLimits(configDialogNode, fleetMap)
      : null;
  const configContainerLoad =
    configDialogNode && isContainerType(configDialogNode.type)
      ? configDialogContents.reduce(
          (sum, item) => {
            const load = estimateNodeLoadRecursive(item, nodes);
            return {
              weightLb: sum.weightLb + load.weightLb,
              volumeFt3: sum.volumeFt3 + load.volumeFt3,
            };
          },
          { weightLb: 0, volumeFt3: 0 }
        )
      : { weightLb: 0, volumeFt3: 0 };
  const configDialogUnit =
    configDialogNode ? buildPackageUnitRecordFromNode(configDialogNode, nodes) : null;

  useEffect(() => {
    if (!requestedBuildOrderId || !requestedBuildOrder) {
      return;
    }
    if (buildOrderId === requestedBuildOrderId) {
      return;
    }

    setBuildOrderId(requestedBuildOrderId);
    setStatusMessage(
      `Selected ${requestedBuildOrder.orderNumber} from Orders. Review the order, then build cases, pallets, and truck placement here.`
    );
  }, [buildOrderId, requestedBuildOrder, requestedBuildOrderId]);
  const configDialogUnitContents = configDialogContents.map((item) =>
    buildPackageUnitRecordFromNode(item, nodes)
  );
  const configDialogQrDataUrl = configDialogUnit
    ? generateQRCode(buildPackageUnitQrPayload(configDialogUnit), {
        size: 220,
        color: '#a5f3fc',
        backgroundColor: '#0f172a',
      })
    : null;

  const productSetupAvailableQty = productSetupItem
    ? Math.max(0, productSetupItem.onHandQty - productSetupItem.allocatedQty)
    : 0;

  useEffect(() => {
    let active = true;

    const loadOsReferences = async () => {
      setInventoryLoading(true);
      setInventoryError(null);

      try {
        const [inventoryRes, productsRes, packageLotsRes] = await Promise.all([
          globalThis.fetch('/api/os/inventory?siteId=main'),
          globalThis.fetch('/api/os/products'),
          globalThis.fetch('/api/os/package-lots?siteId=main&status=active'),
        ]);
        const inventoryPayload = inventoryRes.ok ? await inventoryRes.json() : null;
        const productsPayload = productsRes.ok ? await productsRes.json() : null;
        const packageLotsPayload = packageLotsRes.ok ? await packageLotsRes.json() : null;

        if (!active) {
          return;
        }

        const sellableCatalog = buildOsSellableCatalog(
          parseOsInventoryCatalog(inventoryPayload),
          parseOsProductCatalog(productsPayload),
          parseOsPackageLots(packageLotsPayload)
        );
        const ordersPayload = await apiGet<unknown>('/api/orders').catch(() => []);

        setInventoryItems(sellableCatalog);
        setBuildOrders(normalizeBuildOrders(ordersPayload));
        if (!productsRes.ok || !packageLotsRes.ok) {
          setInventoryError('Some OS identity metadata is unavailable. Core inventory is still loaded.');
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load OS inventory.';
        setInventoryError(message);
        setInventoryItems([]);
        setBuildOrders([]);
      } finally {
        if (active) {
          setInventoryLoading(false);
        }
      }
    };

    loadOsReferences();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void loadOpsCrmState()
      .then(() => {
        if (!active) {
          return;
        }
        setClientRecords(getOpsClientRecords());
      })
      .catch((error) => {
        console.error('Failed to load OPS CRM clients for package assignment', error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const nextFleet = await fetchFleetProfiles();
      if (!active) {
        return;
      }
      setFleet(nextFleet);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Delete' || !selectedNodeId) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('role') === 'combobox' ||
          target.isContentEditable);

      if (isTypingTarget) {
        return;
      }

      event.preventDefault();
      setDeleteConfirmNodeId(selectedNodeId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedNodeId]);

  const queuePackageUnitSync = useCallback((payload: OpsPackageUnitSyncPayload) => {
    packageUnitPersistRef.current = packageUnitPersistRef.current
      .catch(() => undefined)
      .then(() => syncOpsPackageUnits(payload))
      .catch((error) => {
        console.error('Failed to sync OPS package-unit state:', error);
      });

    return packageUnitPersistRef.current;
  }, []);

  const packageUnitSyncSignature = useMemo(
    () =>
      JSON.stringify(
        nodes
          .map((node) => ({
            id: node.id,
            type: node.type,
            label: node.label,
            parentId: node.parentId ?? null,
            unitId: node.data.unitId ?? null,
            packagingId: node.data.packagingId,
            quantity: node.data.quantity,
            destination: node.data.destination,
            capacity: node.data.capacity,
            productId: node.data.productId ?? null,
            productCode: node.data.productCode ?? null,
            skuId: node.data.skuId ?? null,
            packageType: node.data.packageType ?? null,
            packageFormatCode: node.data.packageFormatCode ?? null,
            batchId: node.data.batchId,
            batchCode: node.data.batchCode ?? null,
            packageLotId: node.data.packageLotId ?? null,
            packageLotCode: node.data.packageLotCode ?? null,
            assetId: node.data.assetId ?? null,
            assetCode: node.data.assetCode ?? null,
            reservationId: node.data.reservationId ?? null,
            reservationStatus: node.data.reservationStatus ?? null,
            reservationShortQty: node.data.reservationShortQty ?? null,
            truckId: node.data.truckId ?? null,
            assignedSiteId: node.data.assignedSiteId ?? null,
            assignedSiteName: node.data.assignedSiteName ?? null,
          }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      ),
    [nodes],
  );

  useEffect(() => {
    void queuePackageUnitSync({
      units: nodes.map((node) => buildPackageUnitRecordFromNode(node, nodes)),
    });
  }, [nodes, packageUnitSyncSignature, queuePackageUnitSync]);

  const productCount = nodes.filter((node) => isProductType(node.type)).length;
  const palletCount = nodes.filter((node) => node.type === 'pallet').length;
  const truckCount = nodes.filter((node) => node.type === 'truck').length;
  const loadedCount = nodes.filter((node) => Boolean(node.parentId)).length;

  const clearDragState = () => {
    setDragPayload(null);
    setHoveredCarrierId(null);
  };

  const openProductSetupForNode = (node: CanvasNode) => {
    if (!isProductType(node.type)) {
      return;
    }

    setProductSetupNodeId(node.id);

    if (node.data.productId) {
      const byIdentity = inventoryItems.find(
        (item) =>
          item.id === node.data.productId ||
          item.productId === node.data.productId ||
          (!!node.data.skuId && item.skuId === node.data.skuId)
      );
      if (byIdentity) {
        setProductSetupProductId(byIdentity.id);
        return;
      }
    }

    const byName = inventoryItems.find(
      (item) => item.name.toLowerCase() === node.data.productName.toLowerCase()
    );
    setProductSetupProductId(byName?.id ?? '');
  };

  const openTruckSelectorForNode = (nodeId: string, preferredTruckId?: string) => {
    setTruckSelectNodeId(nodeId);
    if (preferredTruckId && fleet.some((truck) => truck.id === preferredTruckId)) {
      setTruckSelectValue(preferredTruckId);
      return;
    }
    setTruckSelectValue(fleet[0]?.id ?? '');
  };

  const loadFleet = async () => {
    const nextFleet = await fetchFleetProfiles();
    setFleet(nextFleet);
  };

  const flashCarrier = (carrierId: string, tone: 'success' | 'warning') => {
    setCarrierFlash((previous) => ({ ...previous, [carrierId]: tone }));
    window.setTimeout(() => {
      setCarrierFlash((previous) => {
        const next = { ...previous };
        delete next[carrierId];
        return next;
      });
    }, 420);
  };

  const canNestNodeInContainer = (childType: NodeType, parentType: NodeType): boolean => {
    if (!isContainerType(parentType)) {
      return false;
    }
    if (childType === 'truck') {
      return false;
    }
    if (NODE_SIZE[childType] >= NODE_SIZE[parentType]) {
      return false;
    }
    return true;
  };

  const buildPreviewNode = (type: NodeType): CanvasNode => ({
    id: `preview-${type}`,
    type,
    label: NODE_SPECS[type].label,
    x: 0,
    y: 0,
    width: NODE_SPECS[type].width,
    height: NODE_SPECS[type].height,
    data: createDefaultData(type),
  });

  const evaluateDropIntoContainer = useCallback((
    allNodes: CanvasNode[],
    draggedNode: CanvasNode,
    containerNode: CanvasNode
  ): DropEvaluation => {
    const limits = resolveContainerLimits(containerNode, fleetMap);

    if (draggedNode.id === containerNode.id) {
      return {
        accepted: false,
        blockedBy: 'rule',
        reason: 'A node cannot be dropped into itself.',
        limits,
        projectedItems: 0,
        projectedWeightLb: 0,
        projectedVolumeFt3: 0,
        deltaWeightLb: 0,
        deltaVolumeFt3: 0,
      };
    }

    if (!canNestNodeInContainer(draggedNode.type, containerNode.type)) {
      return {
        accepted: false,
        blockedBy: 'rule',
        reason: `${draggedNode.label} cannot be loaded into ${containerNode.label}.`,
        limits,
        projectedItems: 0,
        projectedWeightLb: 0,
        projectedVolumeFt3: 0,
        deltaWeightLb: 0,
        deltaVolumeFt3: 0,
      };
    }

    if (!limits.allowPallets && draggedNode.type === 'pallet') {
      return {
        accepted: false,
        blockedBy: 'rule',
        reason: `${containerNode.label} cannot accept pallets.`,
        limits,
        projectedItems: 0,
        projectedWeightLb: 0,
        projectedVolumeFt3: 0,
        deltaWeightLb: 0,
        deltaVolumeFt3: 0,
      };
    }

    if (!limits.allowKegs && draggedNode.type === 'keg') {
      return {
        accepted: false,
        blockedBy: 'rule',
        reason: `${containerNode.label} cannot accept kegs.`,
        limits,
        projectedItems: 0,
        projectedWeightLb: 0,
        projectedVolumeFt3: 0,
        deltaWeightLb: 0,
        deltaVolumeFt3: 0,
      };
    }

    const alreadyLoaded = allNodes.filter(
      (node) => node.parentId === containerNode.id && node.id !== draggedNode.id
    );
    const carriedLoad = alreadyLoaded.reduce(
      (sum, loadedNode) => {
        const load = estimateNodeLoadRecursive(loadedNode, allNodes);
        return {
          weightLb: sum.weightLb + load.weightLb,
          volumeFt3: sum.volumeFt3 + load.volumeFt3,
        };
      },
      { weightLb: 0, volumeFt3: 0 }
    );
    const draggedLoad = estimateNodeLoadRecursive(draggedNode, allNodes);
    const projectedItems = alreadyLoaded.length + 1;
    const projectedWeightLb = carriedLoad.weightLb + draggedLoad.weightLb;
    const projectedVolumeFt3 = carriedLoad.volumeFt3 + draggedLoad.volumeFt3;

    if (projectedItems > limits.maxItems) {
      return {
        accepted: false,
        blockedBy: 'capacity',
        reason: `${containerNode.label} is at capacity.`,
        limits,
        projectedItems,
        projectedWeightLb,
        projectedVolumeFt3,
        deltaWeightLb: draggedLoad.weightLb,
        deltaVolumeFt3: draggedLoad.volumeFt3,
      };
    }

    if (projectedWeightLb > limits.maxWeightLb) {
      return {
        accepted: false,
        blockedBy: 'capacity',
        reason: `${containerNode.label} exceeds payload limit (${Math.round(projectedWeightLb)}/${Math.round(limits.maxWeightLb)} lb).`,
        limits,
        projectedItems,
        projectedWeightLb,
        projectedVolumeFt3,
        deltaWeightLb: draggedLoad.weightLb,
        deltaVolumeFt3: draggedLoad.volumeFt3,
      };
    }

    if (projectedVolumeFt3 > limits.maxVolumeFt3) {
      return {
        accepted: false,
        blockedBy: 'capacity',
        reason: `${containerNode.label} exceeds volume limit (${projectedVolumeFt3.toFixed(1)}/${limits.maxVolumeFt3.toFixed(1)} ft^3).`,
        limits,
        projectedItems,
        projectedWeightLb,
        projectedVolumeFt3,
        deltaWeightLb: draggedLoad.weightLb,
        deltaVolumeFt3: draggedLoad.volumeFt3,
      };
    }

    return {
      accepted: true,
      limits,
      projectedItems,
      projectedWeightLb,
      projectedVolumeFt3,
      deltaWeightLb: draggedLoad.weightLb,
      deltaVolumeFt3: draggedLoad.volumeFt3,
    };
  }, [fleetMap]);

  const isDescendantOf = useCallback((nodeId: string, possibleAncestorId: string): boolean => {
    let current = nodes.find((node) => node.id === nodeId);
    while (current?.parentId) {
      if (current.parentId === possibleAncestorId) {
        return true;
      }
      current = nodes.find((node) => node.id === current?.parentId);
    }
    return false;
  }, [nodes]);

  const canContainerAcceptDrop = (containerId: string): boolean => {
    if (!dragPayload) {
      return false;
    }

    const containerNode = nodes.find((node) => node.id === containerId && isContainerType(node.type));
    if (!containerNode) {
      return false;
    }

    if (dragPayload.kind === 'palette') {
      if (!isProductType(dragPayload.nodeType)) {
        return false;
      }
      const previewNode = buildPreviewNode(dragPayload.nodeType);
      const evaluation = evaluateDropIntoContainer(nodes, previewNode, containerNode);
      if (!evaluation.accepted) {
        return false;
      }
      return true;
    }

    const draggedNode = nodes.find((node) => node.id === dragPayload.nodeId);
    if (!draggedNode) {
      return false;
    }
    if (draggedNode.id === containerId) {
      return false;
    }
    if (isDescendantOf(containerId, draggedNode.id)) {
      return false;
    }
    const evaluation = evaluateDropIntoContainer(nodes, draggedNode, containerNode);
    return evaluation.accepted;
  };

  const dropPreview = useMemo(() => {
    if (!hoveredCarrierId || !dragPayload) {
      return null;
    }

    const containerNode = nodes.find((node) => node.id === hoveredCarrierId && isContainerType(node.type));
    if (!containerNode) {
      return null;
    }

    if (dragPayload.kind === 'palette') {
      if (!isProductType(dragPayload.nodeType)) {
        return {
          accepted: false,
          reason: 'Only package widgets can be loaded into containers.',
          projectedItems: 0,
          projectedWeightLb: 0,
          projectedVolumeFt3: 0,
          limits: resolveContainerLimits(containerNode, fleetMap),
          deltaWeightLb: 0,
          deltaVolumeFt3: 0,
        } as DropEvaluation;
      }
      return evaluateDropIntoContainer(nodes, buildPreviewNode(dragPayload.nodeType), containerNode);
    }

    const draggedNode = nodes.find((node) => node.id === dragPayload.nodeId);
    if (!draggedNode || isDescendantOf(containerNode.id, draggedNode.id)) {
      return {
        accepted: false,
        reason: 'Cannot create a circular package hierarchy.',
        projectedItems: 0,
        projectedWeightLb: 0,
        projectedVolumeFt3: 0,
        limits: resolveContainerLimits(containerNode, fleetMap),
        deltaWeightLb: 0,
        deltaVolumeFt3: 0,
      } as DropEvaluation;
    }
    return evaluateDropIntoContainer(nodes, draggedNode, containerNode);
  }, [dragPayload, evaluateDropIntoContainer, fleetMap, hoveredCarrierId, isDescendantOf, nodes]);

  const getCanvasDropPoint = (event: DragEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const addNodeAtPoint = (nodeType: NodeType, pointX: number, pointY: number, canvasW: number, canvasH: number) => {
    const spec = NODE_SPECS[nodeType];
    const nextNode = createNode(
      nodeType,
      clamp(pointX - spec.width / 2, 8, Math.max(8, canvasW - spec.width - 8)),
      clamp(pointY - 24, 8, Math.max(8, canvasH - spec.height - 8))
    );

    setNodes((previous) => [...previous, nextNode]);
    void queuePackageUnitSync({
      events: [
        buildPackageUnitEventFromNode(
          nextNode,
          [...nodes, nextNode],
          'created_on_canvas',
          `${nextNode.label} added to OPS logistics canvas.`,
          {
            metadata: {
              widgetType: nextNode.type,
            },
          },
        ),
      ],
    });
    setSelectedNodeId(nextNode.id);
    setStatusMessage(`${spec.label} added to canvas.`);
    openProductSetupForNode(nextNode);
    if (nodeType === 'truck') {
      openTruckSelectorForNode(nextNode.id, nextNode.data.truckId);
    }
  };

  const addNodeNearCenter = (nodeType: NodeType) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 580;
    const centerY = rect ? rect.height / 2 : 300;
    const width = rect?.width ?? 1200;
    const height = rect?.height ?? 700;

    addNodeAtPoint(nodeType, centerX, centerY, width, height);
  };

  const buildFromSelectedOrder = () => {
    if (!selectedBuildOrder) {
      setStatusMessage('Select an order first for assisted build.');
      return;
    }

    const client = clientMap.get(selectedBuildOrder.customerId) ?? null;
    const generatedNodes: CanvasNode[] = [];
    const baseX = 72;
    const baseY = 96;

    selectedBuildOrder.lineItems.forEach((line, lineIndex) => {
      const nodeType = inferNodeTypeFromLine(line);
      for (let quantityIndex = 0; quantityIndex < line.quantity; quantityIndex += 1) {
        const nextNode = createNode(
          nodeType,
          baseX + (quantityIndex % 4) * 216,
          baseY + (lineIndex * 170) + Math.floor(quantityIndex / 4) * 156,
        );
        nextNode.label = `${selectedBuildOrder.orderNumber} ${NODE_SPECS[nodeType].label} ${quantityIndex + 1}`;
        nextNode.data = {
          ...nextNode.data,
          productName: line.productName,
          productCode: line.productCode,
          skuId: line.skuId,
          packageType: line.packageType,
          packageFormatCode: line.packageFormatCode,
          batchCode: line.batchCode,
          packageLotCode: line.packageLotCode,
          assetCode: line.assetCode,
          quantity: 1,
          destination: client?.name ?? selectedBuildOrder.customerName,
          assignedSiteId: client?.id,
          assignedSiteName: client?.name,
          packagingId: `${selectedBuildOrder.orderNumber}-${line.id}-${quantityIndex + 1}`,
        };
        generatedNodes.push(nextNode);
      }
    });

    if (generatedNodes.length === 0) {
      setStatusMessage('The selected order has no shippable line items to stage.');
      return;
    }

    setNodes((previous) => [...previous, ...generatedNodes]);
    void queuePackageUnitSync({
      events: generatedNodes.map((node) =>
        buildPackageUnitEventFromNode(
          node,
          [...nodes, ...generatedNodes],
          'built_from_order',
          `${node.label} staged from ${selectedBuildOrder.orderNumber}.`,
          {
            metadata: {
              orderId: selectedBuildOrder.id,
              orderNumber: selectedBuildOrder.orderNumber,
              customerId: selectedBuildOrder.customerId,
            },
          },
        ),
      ),
    });
    setStatusMessage(
      `Built ${generatedNodes.length} package units from ${selectedBuildOrder.orderNumber}. Review and adjust on the canvas.`,
    );
  };

  const suggestCases = () => {
    const looseSixPacks = nodes.filter((node) => node.type === 'six-pack' && !node.parentId);
    if (looseSixPacks.length < 2) {
      setStatusMessage('Need at least two loose 6-packs on staging before OPS can suggest case grouping.');
      return;
    }

    const groups: CanvasNode[][] = [];
    for (let index = 0; index < looseSixPacks.length; index += 4) {
      groups.push(looseSixPacks.slice(index, index + 4));
    }

    const generatedCases = groups.map((group, index) => {
      const node = createNode('case', 460 + (index % 2) * 210, 110 + Math.floor(index / 2) * 184);
      node.label = `Suggested Case ${index + 1}`;
      node.data = {
        ...node.data,
        productName: group[0]?.data.productName ?? 'Mixed Case',
        productCode: group[0]?.data.productCode,
        skuId: group[0]?.data.skuId,
        batchCode: group[0]?.data.batchCode,
        packageLotCode: group[0]?.data.packageLotCode,
        quantity: 0,
        capacity: 4,
        destination: group[0]?.data.destination ?? 'Staging',
        assignedSiteId: group[0]?.data.assignedSiteId,
        assignedSiteName: group[0]?.data.assignedSiteName,
        packagingId: `CASE-SUG-${Date.now().toString(36)}-${index + 1}`,
      };
      return node;
    });

    const nextNodes = [...nodes, ...generatedCases].map((node) => ({ ...node }));
    generatedCases.forEach((caseNode, index) => {
      const group = groups[index] ?? [];
      group.forEach((item, slotIndex) => {
        const target = nextNodes.find((candidate) => candidate.id === item.id);
        const carrier = nextNodes.find((candidate) => candidate.id === caseNode.id);
        if (!target || !carrier) {
          return;
        }
        const slot = getCarrierSlotPosition(carrier, slotIndex, target.width, target.height);
        target.parentId = caseNode.id;
        target.x = slot.x;
        target.y = slot.y;
      });
    });

    setNodes(nextNodes);
    setStatusMessage(`OPS suggested ${generatedCases.length} case containers for loose 6-pack units.`);
  };

  const suggestPallets = () => {
    const looseUnits = nodes.filter(
      (node) => !node.parentId && (node.type === 'case' || node.type === 'keg' || node.type === 'six-pack'),
    );
    if (looseUnits.length === 0) {
      setStatusMessage('No loose packages are available to palletize.');
      return;
    }

    const groups: CanvasNode[][] = [];
    for (let index = 0; index < looseUnits.length; index += 8) {
      groups.push(looseUnits.slice(index, index + 8));
    }

    const generatedPallets = groups.map((group, index) => {
      const pallet = createNode('pallet', 720 + (index % 2) * 280, 120 + Math.floor(index / 2) * 220);
      pallet.label = `Suggested Pallet ${index + 1}`;
      pallet.data = {
        ...pallet.data,
        productName: group[0]?.data.productName ?? 'Mixed Load',
        quantity: 0,
        capacity: 16,
        destination: group[0]?.data.destination ?? 'Dock staging',
        assignedSiteId: group[0]?.data.assignedSiteId,
        assignedSiteName: group[0]?.data.assignedSiteName,
        packagingId: `PLT-SUG-${Date.now().toString(36)}-${index + 1}`,
      };
      return pallet;
    });

    const nextNodes = [...nodes, ...generatedPallets].map((node) => ({ ...node }));
    generatedPallets.forEach((pallet, index) => {
      const group = groups[index] ?? [];
      group.forEach((item, slotIndex) => {
        const target = nextNodes.find((candidate) => candidate.id === item.id);
        const carrier = nextNodes.find((candidate) => candidate.id === pallet.id);
        if (!target || !carrier) {
          return;
        }
        const slot = getCarrierSlotPosition(carrier, slotIndex, target.width, target.height);
        target.parentId = pallet.id;
        target.x = slot.x;
        target.y = slot.y;
      });
    });

    setNodes(nextNodes);
    setStatusMessage(`OPS suggested ${generatedPallets.length} pallets for loose staged packages.`);
  };

  const suggestTruck = () => {
    const stagedLoads = nodes.filter(
      (node) => !node.parentId && (node.type === 'pallet' || node.type === 'case' || node.type === 'keg'),
    );
    if (stagedLoads.length === 0) {
      setStatusMessage('No staged pallets or packages are available to load onto a truck.');
      return;
    }

    const existingTruck = nodes.find((node) => node.type === 'truck' && !node.parentId) ?? null;
    const selectedFleetTruck = fleet[0] ?? null;
    const truckNode = existingTruck ?? createNode('truck', 1020, 84);

    if (!existingTruck) {
      truckNode.label = selectedFleetTruck?.name ?? truckNode.label;
      truckNode.data = {
        ...truckNode.data,
        truckId: selectedFleetTruck?.id,
        packagingId: selectedFleetTruck?.id ?? truckNode.data.packagingId,
        destination: selectedFleetTruck?.homeBase ?? truckNode.data.destination,
      };
    }

    const nextNodes = existingTruck ? nodes.map((node) => ({ ...node })) : [...nodes, truckNode].map((node) => ({ ...node }));
    const carrier = nextNodes.find((node) => node.id === truckNode.id);
    if (!carrier) {
      setStatusMessage('OPS could not initialize a truck suggestion.');
      return;
    }

    stagedLoads.slice(0, carrier.data.capacity).forEach((item, index) => {
      const target = nextNodes.find((node) => node.id === item.id);
      if (!target) {
        return;
      }
      const slot = getCarrierSlotPosition(carrier, index, target.width, target.height);
      target.parentId = carrier.id;
      target.x = slot.x;
      target.y = slot.y;
    });

    setNodes(nextNodes);
    setStatusMessage(
      existingTruck
        ? `${existingTruck.label} updated with suggested staged load assignment.`
        : `${truckNode.label} created and loaded with staged pallets/packages.`,
    );
  };

  const unpackNodeToCanvas = (nodeId: string) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) {
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 1200;
    const height = rect?.height ?? 700;
    const offset = unpackOffsetRef.current % 6;
    unpackOffsetRef.current += 1;

    const unpackedNode: CanvasNode = {
      ...node,
      parentId: undefined,
      x: clamp(width * 0.16 + offset * 28, 8, Math.max(8, width - node.width - 8)),
      y: clamp(height * 0.22 + offset * 22, 8, Math.max(8, height - node.height - 8)),
    };
    const nextNodesForEvent = nodes.map((candidate) => (candidate.id === nodeId ? unpackedNode : candidate));

    setNodes((previous) =>
      previous.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        return {
          ...node,
          parentId: undefined,
          x: clamp(width * 0.16 + offset * 28, 8, Math.max(8, width - node.width - 8)),
          y: clamp(height * 0.22 + offset * 22, 8, Math.max(8, height - node.height - 8)),
        };
      })
    );

    void queuePackageUnitSync({
      events: [
        buildPackageUnitEventFromNode(
          unpackedNode,
          nextNodesForEvent,
          'unpacked_to_staging',
          `${unpackedNode.label} moved back to staging.`,
          {
            detail: 'Operator unpacked this unit from its parent container back to the staging canvas.',
          },
        ),
      ],
    });

    setStatusMessage('Item unpacked back to staging canvas.');
  };

  const deleteNode = (nodeId: string) => {
    const targetNode = nodes.find((node) => node.id === nodeId) ?? null;
    if (targetNode) {
      void releaseReservationForNode(targetNode).catch((error) => {
        const message = error instanceof Error ? error.message : 'unknown release error';
        setStatusMessage(`Node deleted, but OS reservation release failed: ${message}`);
      });

      if (isContainerType(targetNode.type)) {
        nodes
          .filter((node) => node.parentId === targetNode.id)
          .forEach((child) => {
            void releaseReservationForNode(child).catch(() => {
              // Keep deletion resilient; status message above already informs operator on failures.
            });
        });
      }
    }

    if (targetNode) {
      const directChildren = nodes.filter((node) => node.parentId === nodeId);
      const archivedTarget: OpsPackageUnitRecord = {
        ...buildPackageUnitRecordFromNode(targetNode, nodes),
        activeOnCanvas: false,
        status: 'archived',
        currentLocationType: 'archived',
        currentLocationId: 'ops-canvas-archive',
        currentLocationLabel: 'OPS canvas archive',
      };

      const childEvents = directChildren.map((child) =>
        buildPackageUnitEventFromNode(
          {
            ...child,
            parentId: undefined,
          },
          nodes.map((candidate) => (candidate.id === child.id ? { ...child, parentId: undefined } : candidate)),
          'unpacked_to_staging',
          `${child.label} moved back to staging when ${targetNode.label} was removed.`,
        ),
      );

      void queuePackageUnitSync({
        units: [archivedTarget],
        events: [
          buildPackageUnitEventFromNode(
            targetNode,
            nodes,
            'archived_from_canvas',
            `${targetNode.label} removed from OPS logistics canvas.`,
            {
              detail: 'Widget was deleted from the canvas. Historical traceability remains in OPS.',
            },
          ),
          ...childEvents,
        ],
      });
    }

    setNodes((previous) => {
      const target = previous.find((node) => node.id === nodeId);
      if (!target) {
        return previous;
      }

      const withoutTarget = previous.filter((node) => node.id !== nodeId);
      if (!isContainerType(target.type)) {
        return withoutTarget;
      }

      return withoutTarget.map((node) => {
        if (node.parentId !== nodeId) {
          return node;
        }

        return {
          ...node,
          parentId: undefined,
          x: Math.max(20, node.x - 160),
          y: Math.max(20, node.y + 40),
        };
      });
    });

    setSelectedNodeId((current) => (current === nodeId ? null : current));
    setConfigDialogNodeId((current) => (current === nodeId ? null : current));
    setDeleteConfirmNodeId((current) => (current === nodeId ? null : current));
    setProductSetupNodeId((current) => (current === nodeId ? null : current));
    setStatusMessage('Node deleted. Any loaded items were moved back to staging.');
  };

  const markTruckReadyForDelivery = async (truckNodeId: string) => {
    const truckNode = nodes.find((node) => node.id === truckNodeId && node.type === 'truck');
    if (!truckNode) {
      setStatusMessage('Truck widget not found.');
      return;
    }

    const truckId = truckNode.data.truckId;
    if (!truckId) {
      setStatusMessage('Select a fleet truck first before marking ready.');
      return;
    }

    const loadedNodes = nodes.filter((node) => node.parentId === truckNode.id);
    if (loadedNodes.length === 0) {
      setStatusMessage('Truck has no loaded contents to dispatch.');
      return;
    }

    const payloadNodes = [truckNode, ...collectDescendantNodes(truckNode.id, nodes)];

    const aggregateLoad = loadedNodes.reduce(
      (sum, item) => {
        const load = estimateNodeLoadRecursive(item, nodes);
        return {
          weightLb: sum.weightLb + load.weightLb,
          volumeFt3: sum.volumeFt3 + load.volumeFt3,
        };
      },
      { weightLb: 0, volumeFt3: 0 }
    );
    const dispatchedAt = new Date().toISOString();

    saveTruckDispatchSnapshot({
      truckId,
      truckName: truckNode.label,
      packagingId: truckNode.data.packagingId,
      destination: truckNode.data.destination,
      readiness: 'ready-for-delivery',
      dispatchedAt,
      totalItems: loadedNodes.length,
      totalWeightLb: Math.round(aggregateLoad.weightLb),
      totalVolumeFt3: Number(aggregateLoad.volumeFt3.toFixed(1)),
      loadedPackagingIds: loadedNodes.map((item) => item.data.packagingId).filter((id) => Boolean(id)),
    });

    void queuePackageUnitSync({
      units: payloadNodes.map((node) => {
        const unit = buildPackageUnitRecordFromNode(node, nodes);
        return {
          ...unit,
          activeOnCanvas: false,
          status: 'ready_for_delivery',
          currentLocationType: 'truck',
          currentLocationId: truckId,
          currentLocationLabel: truckNode.label,
          parentUnitId: node.id === truckNode.id ? undefined : unit.parentUnitId,
          parentUnitCode: node.id === truckNode.id ? undefined : unit.parentUnitCode,
        };
      }),
      events: payloadNodes.map((node) =>
        buildPackageUnitEventFromNode(
          node,
          nodes,
          'marked_ready_for_delivery',
          `${node.label} assigned to dispatch ${truckNode.data.packagingId}.`,
          {
            detail: `${truckNode.label} was marked ready for delivery and removed from the active staging canvas.`,
            metadata: {
              truckId,
              dispatchId: truckNode.data.packagingId,
              destination: truckNode.data.destination,
            },
          },
        ),
      ),
    });

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId(
        'ops-dispatch-ready',
        truckId,
        truckNode.data.packagingId
      ),
      title: `Truck Ready: ${truckNode.label}`,
      description: `Payload ${loadedNodes.length} items · ${Math.round(aggregateLoad.weightLb)} lb · ${aggregateLoad.volumeFt3.toFixed(1)} ft^3 · ${truckNode.data.destination}`,
      type: 'delivery',
      status: 'planned',
      startAt: dispatchedAt,
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-canvas-dispatch',
        truckId,
        truckName: truckNode.label,
        packagingId: truckNode.data.packagingId,
        destination: truckNode.data.destination,
        totalItems: loadedNodes.length,
        totalWeightLb: Math.round(aggregateLoad.weightLb),
        totalVolumeFt3: Number(aggregateLoad.volumeFt3.toFixed(1)),
        loadedPackagingIds: loadedNodes.map((item) => item.data.packagingId).filter(Boolean),
      },
    });

    const nextFleet: LogisticsTruckProfile[] = fleet.map((truck) => {
      if (truck.id !== truckId) {
        return truck;
      }
      return {
        ...truck,
        status: 'loading' as LogisticsTruckProfile['status'],
      };
    });
    setFleet(nextFleet);
    await saveFleetProfiles(nextFleet);

    setNodes((previous) =>
      previous.filter((node) => node.id !== truckNode.id && node.parentId !== truckNode.id)
    );
    setConfigDialogNodeId(null);
    setSelectedNodeId((current) => (current === truckNode.id ? null : current));
    setStatusMessage(
      `${truckNode.label} marked Ready for Delivery. Payload sent to truck board and removed from canvas.`
    );
  };

  const requestDeleteNode = (nodeId: string) => {
    setDeleteConfirmNodeId(nodeId);
  };

  const confirmDeleteNode = () => {
    if (!deleteConfirmNodeId) {
      return;
    }
    deleteNode(deleteConfirmNodeId);
    setDeleteConfirmNodeId(null);
  };

  const assignToContainer = (draggedNodeId: string, containerId: string) => {
    let assignmentAccepted = false;
    let blockedByCapacity = false;
    let blockedByRule = false;
    let assignmentMessage = '';
    let assignedContainerLabel = 'container';
    let draggedLabel = 'Package';
    let assignedNodeSnapshot: CanvasNode | undefined;
    let assignedNodesSnapshot: CanvasNode[] = [];

    setNodes((previous) => {
      const draggedNode = previous.find((node) => node.id === draggedNodeId);
      const containerNode = previous.find((node) => node.id === containerId);

      if (!draggedNode || !containerNode || !isContainerType(containerNode.type)) {
        assignmentMessage = 'Drop a package on a valid container.';
        return previous;
      }
      if (draggedNode.id === containerId) {
        blockedByRule = true;
        assignmentMessage = 'A node cannot be dropped into itself.';
        return previous;
      }

      let ancestor = containerNode.parentId
        ? previous.find((node) => node.id === containerNode.parentId)
        : null;
      while (ancestor) {
        if (ancestor.id === draggedNode.id) {
          blockedByRule = true;
          assignmentMessage = 'Cannot create a circular package hierarchy.';
          return previous;
        }
        ancestor = ancestor.parentId ? previous.find((node) => node.id === ancestor?.parentId) ?? null : null;
      }

      const evaluation = evaluateDropIntoContainer(previous, draggedNode, containerNode);
      if (!evaluation.accepted) {
        if (evaluation.blockedBy === 'capacity') {
          blockedByCapacity = true;
        } else {
          blockedByRule = true;
        }
        assignmentMessage = evaluation.reason ?? `${containerNode.label} cannot accept this item.`;
        return previous;
      }

      const alreadyLoaded = previous.filter(
        (node) => node.parentId === containerId && node.id !== draggedNodeId
      );

      const slot = getCarrierSlotPosition(
        containerNode,
        alreadyLoaded.length,
        draggedNode.width,
        draggedNode.height
      );

      assignmentAccepted = true;
      assignedContainerLabel = containerNode.label;
      assignmentMessage = `${draggedNode.label} loaded onto ${containerNode.label}.`;
      draggedLabel = draggedNode.label;
      assignedNodesSnapshot = previous.map((node) =>
        node.id === draggedNodeId
          ? {
              ...node,
              parentId: containerId,
              x: slot.x,
              y: slot.y,
            }
          : node,
      );
      assignedNodeSnapshot = assignedNodesSnapshot.find((node) => node.id === draggedNodeId);

      return previous.map((node) => {
        if (node.id !== draggedNodeId) {
          return node;
        }

        return {
          ...node,
          parentId: containerId,
          x: slot.x,
          y: slot.y,
        };
      });
    });

    setStatusMessage(assignmentMessage || 'Update applied.');

    if (assignmentAccepted) {
      if (assignedNodeSnapshot && assignedNodesSnapshot.length > 0) {
        void queuePackageUnitSync({
          events: [
            buildPackageUnitEventFromNode(
              assignedNodeSnapshot,
              assignedNodesSnapshot,
              'loaded_into_container',
              `${draggedLabel} loaded into ${assignedContainerLabel}.`,
            ),
          ],
        });
      }
      setSelectedNodeId(draggedNodeId);
      flashCarrier(containerId, 'success');
      return;
    }

    if (blockedByCapacity || blockedByRule) {
      flashCarrier(containerId, 'warning');
    }
  };

  const handlePaletteDragStart = (event: DragEvent<HTMLElement>, nodeType: NodeType) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', nodeType);
    setDragPayload({ kind: 'palette', nodeType });
  };

  const handleNodeDragStart = (event: DragEvent<HTMLDivElement>, nodeId: string) => {
    const elementRect = event.currentTarget.getBoundingClientRect();

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', nodeId);

    setDragPayload({
      kind: 'node',
      nodeId,
      offsetX: event.clientX - elementRect.left,
      offsetY: event.clientY - elementRect.top,
    });
  };

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!dragPayload) {
      return;
    }

    const point = getCanvasDropPoint(event);
    if (!point) {
      clearDragState();
      return;
    }

    if (dragPayload.kind === 'palette') {
      addNodeAtPoint(dragPayload.nodeType, point.x, point.y, point.width, point.height);
      clearDragState();
      return;
    }

    setNodes((previous) =>
      previous.map((node) => {
        if (node.id !== dragPayload.nodeId) {
          return node;
        }

        return {
          ...node,
          x: clamp(point.x - dragPayload.offsetX, 8, Math.max(8, point.width - node.width - 8)),
          y: clamp(point.y - dragPayload.offsetY, 8, Math.max(8, point.height - node.height - 8)),
          parentId: undefined,
        };
      })
    );

    setStatusMessage('Node moved on canvas.');
    clearDragState();
  };

  const handleCarrierDrop = (event: DragEvent<HTMLDivElement>, carrierId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!dragPayload) {
      return;
    }

    if (dragPayload.kind === 'palette') {
      if (!isProductType(dragPayload.nodeType)) {
        setStatusMessage('That widget cannot be dropped into this container.');
        flashCarrier(carrierId, 'warning');
        clearDragState();
        return;
      }

      const newProduct = createNode(dragPayload.nodeType, 32, 32);
      setNodes((previous) => [...previous, newProduct]);
      assignToContainer(newProduct.id, carrierId);
      openProductSetupForNode(newProduct);
      clearDragState();
      return;
    }

    assignToContainer(dragPayload.nodeId, carrierId);
    clearDragState();
  };

  const handleManifestDragStart = (event: DragEvent<HTMLDivElement>, nodeId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', nodeId);
    setDragPayload({
      kind: 'node',
      nodeId,
      offsetX: 24,
      offsetY: 24,
    });
    setStatusMessage('Drag item to canvas to unpack, or drop into another valid container.');
  };

  const handleManifestDragEnd = (nodeId: string) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) {
      clearDragState();
      return;
    }

    if (node.parentId) {
      // Dialog overlay can swallow drop events. This guarantees drag-out unpacks to staging.
      unpackNodeToCanvas(nodeId);
    }

    clearDragState();
  };

  const updateNodeById = (nodeId: string, updater: (node: CanvasNode) => CanvasNode) => {
    setNodes((previous) => previous.map((node) => (node.id === nodeId ? updater(node) : node)));
  };

  const makeRequestId = (prefix: string, nodeId: string) =>
    `${prefix}-${nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const readAvailability = async (skuId: string, siteId: string): Promise<AvailabilitySnapshot> => {
    const response = await globalThis.fetch(
      `/api/os/availability?skuId=${encodeURIComponent(skuId)}&siteId=${encodeURIComponent(siteId)}`
    );
    if (!response.ok) {
      throw new Error(`Availability lookup failed (${response.status})`);
    }
    return (await response.json()) as AvailabilitySnapshot;
  };

  const releaseReservationForNode = async (node: CanvasNode) => {
    if (!node.data.reservationId) {
      return;
    }
    if (node.data.reservationStatus !== 'reserved' && node.data.reservationStatus !== 'partially_reserved') {
      return;
    }

    const actionPayload = {
      schemaVersion: '1.0.0',
      actionId: makeRequestId('release', node.id),
      reservationId: node.data.reservationId,
      orderId: `ops-canvas-${node.id}`,
      lineId: node.id,
      action: 'release',
      reasonCode: 'line_edited',
      reasonMessage: 'Widget deleted in OPS logistics canvas.',
      occurredAt: new Date().toISOString(),
    };

    const response = await globalThis.fetch(
      `/api/os/reservations/${encodeURIComponent(node.data.reservationId)}/action`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`Release failed (${response.status})`);
    }
  };

  const applyProductSelection = async () => {
    if (!productSetupNode || !productSetupItem) {
      return;
    }

    setReservePending(true);
    try {
      const siteId = productSetupSiteId.trim() || defaultSiteId;
      const availability = await readAvailability(productSetupItem.skuId, siteId);
      const primaryLot =
        productSetupItem.packageLots.find((lot) => lot.availableUnits > 0) ?? productSetupItem.packageLots[0];

      const reservePayload = {
        schemaVersion: '1.0.0',
        requestId: makeRequestId('reserve', productSetupNode.id),
        orderId: `ops-canvas-${productSetupNode.id}`,
        lineId: productSetupNode.id,
        skuId: productSetupItem.skuId,
        requestedQty: productSetupNode.data.quantity,
        uom: availability.uom || productSetupItem.unit,
        siteId,
        allowPartial: true,
        requestedAt: new Date().toISOString(),
        metadata: {
          source: 'ops-logistics-canvas',
          widgetType: productSetupNode.type,
          packagingId: productSetupNode.data.packagingId,
        },
      };

      const response = await globalThis.fetch('/api/os/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservePayload),
      });

      if (!response.ok) {
        throw new Error(`Reservation failed (${response.status})`);
      }

      const allocation = (await response.json()) as AllocationResponse;

      const appliedNode: CanvasNode = {
        ...productSetupNode,
        data: {
          ...productSetupNode.data,
          productId: productSetupItem.productId ?? productSetupItem.id,
          productCode: productSetupItem.productCode,
          skuId: productSetupItem.skuId,
          packageType: productSetupItem.packageType,
          packageFormatCode: productSetupItem.packageFormatCode,
          productName: productSetupItem.name,
          batchId: primaryLot?.batchId ?? productSetupNode.data.batchId,
          batchCode: primaryLot?.batchCode ?? productSetupNode.data.batchCode,
          packageLotId: primaryLot?.packageLotId,
          packageLotCode: primaryLot?.packageLotCode,
          assetId: primaryLot?.assetId,
          assetCode: primaryLot?.assetCode,
          reservationId: allocation.reservationId,
          reservationStatus: allocation.status,
          reservationShortQty: allocation.shortQty,
          reservationReason: allocation.reasonMessage ?? allocation.reasonCode,
        },
      };
      const nextNodesForEvent = nodes.map((node) => (node.id === productSetupNode.id ? appliedNode : node));

      updateNodeById(productSetupNode.id, (node) => ({
        ...node,
        data: {
          ...node.data,
          productId: productSetupItem.productId ?? productSetupItem.id,
          productCode: productSetupItem.productCode,
          skuId: productSetupItem.skuId,
          packageType: productSetupItem.packageType,
          packageFormatCode: productSetupItem.packageFormatCode,
          productName: productSetupItem.name,
          batchId: primaryLot?.batchId ?? node.data.batchId,
          batchCode: primaryLot?.batchCode ?? node.data.batchCode,
          packageLotId: primaryLot?.packageLotId,
          packageLotCode: primaryLot?.packageLotCode,
          assetId: primaryLot?.assetId,
          assetCode: primaryLot?.assetCode,
          reservationId: allocation.reservationId,
          reservationStatus: allocation.status,
          reservationShortQty: allocation.shortQty,
          reservationReason: allocation.reasonMessage ?? allocation.reasonCode,
        },
      }));

      void queuePackageUnitSync({
        events: [
          buildPackageUnitEventFromNode(
            appliedNode,
            nextNodesForEvent,
            'reserved_from_os',
            `${productSetupItem.name} reserved from OS for ${appliedNode.label}.`,
            {
              detail:
                allocation.status === 'reserved'
                  ? `OS fully reserved ${allocation.allocatedQty} units for this package.`
                  : `OS reserved ${allocation.allocatedQty} units with ${allocation.shortQty} short.`,
              metadata: {
                reservationId: allocation.reservationId,
                status: allocation.status,
                shortQty: allocation.shortQty,
                siteId,
              },
            },
          ),
        ],
      });

      if (allocation.status === 'reserved') {
        setStatusMessage(
          `${productSetupItem.name} reserved in OS (${allocation.allocatedQty}/${reservePayload.requestedQty}).`
        );
      } else if (allocation.status === 'partially_reserved') {
        setStatusMessage(
          `Partial reservation for ${productSetupItem.name}: ${allocation.allocatedQty} reserved, ${allocation.shortQty} short.`
        );
      } else {
        setStatusMessage(
          `Reservation rejected for ${productSetupItem.name}: ${allocation.reasonMessage ?? 'inventory shortage'}.`
        );
      }

      setConfigDialogNodeId(productSetupNode.id);
      setProductSetupNodeId(null);
      setProductSetupProductId('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reserve inventory in OS.';
      setStatusMessage(`OPS could not reserve from OS: ${message}`);
    } finally {
      setReservePending(false);
    }
  };

  return (
    <AppShell currentSuite="ops" pageTitle="OPS Logistics Canvas" showNavigationDrawer={false}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OPS Logistics Canvas</h1>
            <p className="mt-1 text-muted-foreground">
              Build virtual packaging, drag products to pallets/trucks, and manage shipping IDs in one flow.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/driver">Driver App</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/trucks">Trucks</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/routes">Routes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/sites">Sites</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="border-cyan-500/40 bg-cyan-500/10">
            <CardContent className="pt-4">
              <p className="text-xs uppercase tracking-wide text-cyan-200">Product Nodes</p>
              <p className="text-2xl font-bold text-cyan-100">{productCount}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/40 bg-cyan-500/10">
            <CardContent className="pt-4">
              <p className="text-xs uppercase tracking-wide text-cyan-200">Pallets</p>
              <p className="text-2xl font-bold text-cyan-100">{palletCount}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/40 bg-cyan-500/10">
            <CardContent className="pt-4">
              <p className="text-xs uppercase tracking-wide text-cyan-200">Trucks</p>
              <p className="text-2xl font-bold text-cyan-100">{truckCount}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/40 bg-cyan-500/10">
            <CardContent className="pt-4">
              <p className="text-xs uppercase tracking-wide text-cyan-200">Loaded Items</p>
              <p className="text-2xl font-bold text-cyan-100">{loadedCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-cyan-500/40 bg-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-base text-cyan-100">Assisted Build</CardTitle>
            <CardDescription>
              Start from an existing OPS order, then let OPS suggest cases, pallets, and truck assignment for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logisticsEntrySource === 'orders' && requestedBuildOrder && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-3 text-xs text-cyan-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">Opened from order {requestedBuildOrder.orderNumber}</p>
                    <p className="mt-1 text-cyan-50/80">
                      {requestedBuildOrder.customerName} · {requestedBuildOrder.lineItems.reduce((sum, line) => sum + line.quantity, 0)} units queued for packaging review.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/ops/orders">Back to Orders</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <Label htmlFor="assisted-order">Order</Label>
                <Select value={buildOrderId} onValueChange={setBuildOrderId}>
                  <SelectTrigger id="assisted-order">
                    <SelectValue placeholder="Select an order to stage on canvas" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} · {order.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                {selectedBuildOrder ? (
                  <>
                    <p className="font-semibold text-cyan-100">{selectedBuildOrder.customerName}</p>
                    <p>{selectedBuildOrder.lineItems.length} line items</p>
                    <p>{selectedBuildOrder.lineItems.reduce((sum, line) => sum + line.quantity, 0)} shippable units</p>
                    <p>Status: {selectedBuildOrder.status}</p>
                    <p className="pt-1 text-cyan-50/80">
                      Build from order to stage units, then let OPS suggest cases, pallets, and truck placement.
                    </p>
                  </>
                ) : (
                  <p>Select an order to generate a packaging suggestion.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={buildFromSelectedOrder} disabled={!selectedBuildOrder}>
                Build From Order
              </Button>
              <Button variant="outline" onClick={suggestCases}>
                Suggest Cases
              </Button>
              <Button variant="outline" onClick={suggestPallets}>
                Suggest Pallet
              </Button>
              <Button variant="outline" onClick={suggestTruck}>
                Suggest Truck
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <Card className="border-cyan-500/50 bg-[#0e1318]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-cyan-100">Virtual Staging Canvas</CardTitle>
                  <CardDescription>
                    Drag package widgets to pallet/truck tiles. Click any node to edit details.
                  </CardDescription>
                </div>
                <Badge className="border-cyan-500/50 bg-cyan-500/20 text-cyan-100">Live Draft</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className="relative min-h-[700px] w-full overflow-hidden rounded-lg border border-cyan-900/60"
                style={{
                  backgroundColor: '#0b1015',
                  backgroundImage:
                    'linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleCanvasDrop}
              >
                {nodes
                  .filter((node) => !node.parentId)
                  .map((node) => {
                  const spec = NODE_SPECS[node.type];
                  const Icon = spec.icon;
                  const loadedNodes = nodes.filter((candidate) => candidate.parentId === node.id);
                  const limits = resolveContainerLimits(node, fleetMap);
                  const aggregateLoad = loadedNodes.reduce(
                    (sum, loadedNode) => {
                      const load = estimateNodeLoadRecursive(loadedNode, nodes);
                      return {
                        weightLb: sum.weightLb + load.weightLb,
                        volumeFt3: sum.volumeFt3 + load.volumeFt3,
                      };
                    },
                    { weightLb: 0, volumeFt3: 0 }
                  );
                  const itemRatio = limits.maxItems > 0 ? loadedNodes.length / limits.maxItems : 0;
                  const weightRatio =
                    Number.isFinite(limits.maxWeightLb) && limits.maxWeightLb > 0
                      ? aggregateLoad.weightLb / limits.maxWeightLb
                      : 0;
                  const volumeRatio =
                    Number.isFinite(limits.maxVolumeFt3) && limits.maxVolumeFt3 > 0
                      ? aggregateLoad.volumeFt3 / limits.maxVolumeFt3
                      : 0;
                  const loadRatio = Math.max(itemRatio, weightRatio, volumeRatio);
                  const assignedCarrier = node.parentId ? nodeMap.get(node.parentId) : null;
                  const boundTruck = node.type === 'truck' && node.data.truckId ? fleetMap.get(node.data.truckId) : null;
                  const interactionClass = `${selectedNodeId === node.id ? 'ring-2 ring-cyan-300' : ''} ${
                    isContainerType(node.type) && hoveredCarrierId === node.id && canContainerAcceptDrop(node.id)
                      ? 'ring-2 ring-cyan-200 animate-pulse'
                      : ''
                  } ${
                    isContainerType(node.type) && hoveredCarrierId === node.id && !canContainerAcceptDrop(node.id)
                      ? 'ring-2 ring-slate-400'
                      : ''
                  } ${
                    carrierFlash[node.id] === 'success'
                      ? 'ring-2 ring-green-300 animate-pulse'
                      : carrierFlash[node.id] === 'warning'
                        ? 'ring-2 ring-slate-400 animate-pulse'
                        : ''
                  }`;

                  return (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(event) => handleNodeDragStart(event, node.id)}
                      onDragEnd={clearDragState}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setConfigDialogNodeId(node.id);
                      }}
                      onDragOver={
                        isContainerType(node.type)
                          ? (event) => {
                              event.preventDefault();
                            setHoveredCarrierId(node.id);
                            }
                          : undefined
                      }
                      onDragLeave={
                        isContainerType(node.type)
                          ? () => {
                              setHoveredCarrierId((current) => (current === node.id ? null : current));
                            }
                          : undefined
                      }
                      onDrop={
                        isContainerType(node.type)
                          ? (event) => {
                              handleCarrierDrop(event, node.id);
                              setHoveredCarrierId(null);
                            }
                          : undefined
                      }
                      className={`absolute cursor-grab ${interactionClass} ${
                        node.type === 'truck'
                          ? 'rounded-lg border border-transparent bg-transparent shadow-none'
                          : `rounded-lg border shadow-xl ${spec.accentClass}`
                      }`}
                      style={{
                        left: node.x,
                        top: node.y,
                        width: node.width,
                        height: node.height,
                      }}
                    >
                      {node.type === 'truck' ? (
                        <div className="relative h-full w-full">
                          <ShippingTruckOutline />

                          <div className="absolute left-[13%] top-[8%] h-[44%] w-[48%] rounded-xl border border-cyan-900/40 bg-black/45 p-2">
                            <p className="truncate text-[11px] font-semibold tracking-wide text-cyan-100">{node.label}</p>
                            {boundTruck && (
                              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                                {boundTruck.id} · {boundTruck.driver}
                              </p>
                            )}
                            <p className="mt-1 truncate text-[11px] text-muted-foreground">{node.data.destination}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Load: {loadedNodes.length}/{limits.maxItems}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {Math.round(aggregateLoad.weightLb)}/{Math.round(limits.maxWeightLb)} lb
                            </p>
                            <div className="mt-1.5 space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="w-7 text-[9px] text-muted-foreground">Itm</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800/80">
                                  <div
                                    className={`h-full ${gaugeToneClass(itemRatio)}`}
                                    style={{ width: `${Math.min(100, Math.round(itemRatio * 100))}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-7 text-[9px] text-muted-foreground">Wgt</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800/80">
                                  <div
                                    className={`h-full ${gaugeToneClass(weightRatio)}`}
                                    style={{ width: `${Math.min(100, Math.round(weightRatio * 100))}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-7 text-[9px] text-muted-foreground">Vol</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-800/80">
                                  <div
                                    className={`h-full ${gaugeToneClass(volumeRatio)}`}
                                    style={{ width: `${Math.min(100, Math.round(volumeRatio * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <p className="mt-1 truncate text-[10px] text-muted-foreground">
                              ID: {node.data.packagingId}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between border-b border-cyan-900/40 bg-cyan-950/70 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-cyan-200" />
                              <p className="text-xs font-semibold tracking-wide text-cyan-100">{node.label}</p>
                            </div>
                            <Badge className="border-cyan-500/40 bg-cyan-500/20 text-[10px] text-cyan-100">
                              {spec.label}
                            </Badge>
                          </div>

                          <div className="space-y-2 p-3 text-xs">
                            {isProductType(node.type) ? (
                              <>
                                <p className="font-semibold text-foreground">{node.data.productName}</p>
                                {node.data.productCode && (
                                  <p className="text-muted-foreground">Product Code: {node.data.productCode}</p>
                                )}
                                {node.data.skuId && (
                                  <p className="text-muted-foreground">SKU: {node.data.skuId}</p>
                                )}
                                {(node.data.packageLotCode || node.data.batchCode || node.data.assetCode) && (
                                  <p className="text-muted-foreground">
                                    Trace: {node.data.packageLotCode ?? 'No package lot'}
                                    {node.data.batchCode ? ` · ${node.data.batchCode}` : ''}
                                    {node.data.assetCode ? ` · ${node.data.assetCode}` : ''}
                                  </p>
                                )}
                                <p className="text-muted-foreground">Qty: {node.data.quantity}</p>
                                <p className="text-muted-foreground">OPS Pack ID: {node.data.packagingId}</p>
                                <p className="text-muted-foreground">
                                  {assignedCarrier ? `Loaded on: ${assignedCarrier.label}` : 'Unassigned (staging)'}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-[11px] text-muted-foreground">
                                  <p className="text-cyan-100">Container Load</p>
                                  <p>{Math.round(loadRatio * 100)}% full</p>
                                </div>
                                  <div className="text-right">
                                    <p className="text-[11px] text-muted-foreground">Destination</p>
                                    <p className="font-medium text-foreground">{node.data.destination}</p>
                                  </div>
                                </div>
                                <div className="rounded border border-cyan-900/40 bg-black/20 px-2 py-1 text-[11px] text-muted-foreground">
                                  Loaded: {loadedNodes.length}/{limits.maxItems} · {Math.round(aggregateLoad.weightLb)} lb
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-cyan-100">
          {statusMessage}
        </div>

        <OpsCalendarSyncDevPanel
          originPrefix="ops-logistics"
          title="Logistics Calendar Sync (DEV)"
        />

        {dropPreview && (
          <Card
            className={`border ${
              dropPreview.accepted ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-amber-500/50 bg-amber-500/10'
            }`}
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
              <div>
                <p className={dropPreview.accepted ? 'text-cyan-100' : 'text-amber-200'}>
                  {dropPreview.accepted
                    ? `Drop Preview: +${Math.round(dropPreview.deltaWeightLb)} lb, +${dropPreview.deltaVolumeFt3.toFixed(1)} ft^3`
                    : `Drop Blocked: ${dropPreview.reason ?? 'Container rule violation'}`}
                </p>
                {dropPreview.accepted && (
                  <p className="text-muted-foreground">
                    Result: items {dropPreview.projectedItems}/{dropPreview.limits.maxItems}, payload{' '}
                    {Math.round(dropPreview.projectedWeightLb)}/{Math.round(dropPreview.limits.maxWeightLb)} lb, volume{' '}
                    {dropPreview.projectedVolumeFt3.toFixed(1)}/{dropPreview.limits.maxVolumeFt3.toFixed(1)} ft^3
                  </p>
                )}
              </div>
              {dropPreview.accepted && (
                <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                  {Math.round(
                    Math.max(
                      (dropPreview.projectedItems / Math.max(1, dropPreview.limits.maxItems)) * 100,
                      (dropPreview.projectedWeightLb / Math.max(1, dropPreview.limits.maxWeightLb)) * 100,
                      (dropPreview.projectedVolumeFt3 / Math.max(0.01, dropPreview.limits.maxVolumeFt3)) * 100
                    )
                  )}
                  % projected
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {!widgetMenuOpen && (
          <button
            type="button"
            aria-label="Open widget drawer"
            title="Open widget drawer"
            onClick={() => setWidgetMenuOpen(true)}
            className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-cyan-500/60 bg-cyan-950/90 p-2 text-cyan-100 shadow-lg transition hover:bg-cyan-900"
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
        )}

        <Sheet open={widgetMenuOpen} onOpenChange={setWidgetMenuOpen}>
          <SheetContent
            side="right"
            className="w-[110px] border-cyan-900/60 bg-[#0d1218]/95 p-3"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">Widget Drawer</SheetTitle>
              <SheetDescription className="sr-only">
                Icon-based widget controls for adding nodes to the canvas.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-2">
              {PALETTE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.type}
                    type="button"
                    size="icon"
                    variant="outline"
                    title={item.ariaLabel}
                    aria-label={item.ariaLabel}
                    draggable
                    onDragStart={(event) => handlePaletteDragStart(event, item.type)}
                    onDragEnd={clearDragState}
                    onClick={() => addNodeNearCenter(item.type)}
                    className={`h-12 w-12 border ${item.accentClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        <Dialog
          open={Boolean(configDialogNode)}
          onOpenChange={(open) => {
            if (!open) {
              setConfigDialogNodeId(null);
            }
          }}
        >
          <DialogContent className="border-cyan-900/60 bg-[#11161d] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-cyan-100">
                {configDialogNode?.label ?? 'Widget'} Configuration
              </DialogTitle>
              <DialogDescription>
                Canvas is quick view. This popup is full details and configuration for the selected widget.
              </DialogDescription>
            </DialogHeader>

            {configDialogNode && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cfg-label">Label</Label>
                    <Input
                      id="cfg-label"
                      value={configDialogNode.label}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        updateNodeById(configDialogNode.id, (node) => ({ ...node, label: nextValue }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cfg-id">Shipping / Packaging ID</Label>
                    <Input
                      id="cfg-id"
                      value={configDialogNode.data.packagingId}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        updateNodeById(configDialogNode.id, (node) => ({
                          ...node,
                          data: { ...node.data, packagingId: nextValue },
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cfg-destination">Destination / Route</Label>
                    <Input
                      id="cfg-destination"
                      value={configDialogNode.data.destination}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        updateNodeById(configDialogNode.id, (node) => ({
                          ...node,
                          data: { ...node.data, destination: nextValue },
                        }));
                      }}
                    />
                  </div>
                  <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                    <p>Type: {NODE_SPECS[configDialogNode.type].label}</p>
                    <p>
                      Loaded on:{' '}
                      {configDialogNode.parentId
                        ? nodes.find((node) => node.id === configDialogNode.parentId)?.label ?? 'Unknown'
                        : 'Staging canvas'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="cfg-client">Assigned Client / Site</Label>
                      <Select
                        value={configDialogNode.data.assignedSiteId ?? '__none__'}
                        onValueChange={(value) => {
                          const nextClient = value === '__none__' ? null : clientMap.get(value) ?? null;
                          const nextNode: CanvasNode = {
                            ...configDialogNode,
                            data: {
                              ...configDialogNode.data,
                              assignedSiteId: nextClient?.id,
                              assignedSiteName: nextClient?.name,
                              destination:
                                nextClient &&
                                (configDialogNode.data.destination === 'Staging' ||
                                  configDialogNode.data.destination.trim().length === 0)
                                  ? nextClient.name
                                  : configDialogNode.data.destination,
                            },
                          };
                          const nextNodesForEvent = nodes.map((node) =>
                            node.id === configDialogNode.id ? nextNode : node,
                          );
                          updateNodeById(configDialogNode.id, (node) => ({
                            ...node,
                            data: {
                              ...node.data,
                              assignedSiteId: nextClient?.id,
                              assignedSiteName: nextClient?.name,
                              destination:
                                nextClient && (node.data.destination === 'Staging' || node.data.destination.trim().length === 0)
                                  ? nextClient.name
                                  : node.data.destination,
                            },
                          }));
                          void queuePackageUnitSync({
                            events: [
                              buildPackageUnitEventFromNode(
                                nextNode,
                                nextNodesForEvent,
                                'assignment_updated',
                                nextClient
                                  ? `${configDialogNode.label} assigned to ${nextClient.name}.`
                                  : `${configDialogNode.label} client assignment cleared.`,
                              ),
                            ],
                          });
                          setStatusMessage(
                            nextClient
                              ? `${configDialogNode.label} assigned to ${nextClient.name}.`
                              : `${configDialogNode.label} client assignment cleared.`
                          );
                        }}
                      >
                        <SelectTrigger id="cfg-client">
                          <SelectValue placeholder="No client assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No client assigned</SelectItem>
                          {clientRecords.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                              {client.city ? ` · ${client.city}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        Attach this unit to a destination client while keeping the QR stable for future moves and recalls.
                      </p>
                    </div>

                    <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                      <p className="font-semibold text-cyan-100">Package Unit Snapshot</p>
                      <p>Unit Code: {configDialogUnit?.unitCode ?? configDialogNode.data.packagingId}</p>
                      <p>Status: {configDialogUnit?.status ?? 'staging'}</p>
                      <p>Location: {configDialogUnit?.currentLocationLabel ?? 'OPS canvas staging'}</p>
                      <p>Client: {configAssignedClient?.name ?? configDialogNode.data.assignedSiteName ?? 'Not assigned'}</p>
                      {configAssignedClient?.address && (
                        <p>
                          Destination Address: {configAssignedClient.address}
                          {configAssignedClient.city ? `, ${configAssignedClient.city}` : ''}
                        </p>
                      )}
                      {configDialogUnit?.productCode && <p>Product Code: {configDialogUnit.productCode}</p>}
                      {configDialogUnit?.skuId && <p>SKU: {configDialogUnit.skuId}</p>}
                      {configDialogUnit?.batchCode && <p>Batch: {configDialogUnit.batchCode}</p>}
                      {configDialogUnit?.packageLotCode && <p>Package Lot: {configDialogUnit.packageLotCode}</p>}
                      {configDialogUnit?.assetCode && <p>Asset: {configDialogUnit.assetCode}</p>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-900/40 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-cyan-100">QR Label</p>
                        <p className="text-[11px] text-muted-foreground">
                          Print once, then let OPS update pallet, truck, route, and client state behind the code.
                        </p>
                      </div>
                      <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                        {configDialogUnit?.unitType ?? NODE_SPECS[configDialogNode.type].label}
                      </Badge>
                    </div>
                    {configDialogQrDataUrl ? (
                      <div className="mt-3 space-y-3">
                        <div className="overflow-hidden rounded-lg border border-cyan-900/40 bg-slate-950/80 p-3">
                          <img
                            src={configDialogQrDataUrl}
                            alt={`${configDialogNode.label} QR`}
                            className="mx-auto h-44 w-44 rounded-md object-contain"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              if (!configDialogUnit) {
                                return;
                              }
                              printHTML(buildPackageUnitPrintHtml(configDialogUnit, configDialogUnitContents));
                            }}
                          >
                            <Printer className="h-4 w-4" />
                            Print QR
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              setStatusMessage(
                                `QR preview ready for ${configDialogNode.label}. Scan resolves ${configDialogUnit?.unitCode ?? configDialogNode.data.packagingId} in OPS.`
                              );
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                            Preview Ready
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded border border-dashed border-cyan-900/40 px-3 py-5 text-xs text-muted-foreground">
                        QR preview unavailable until this unit has a stable package identity.
                      </div>
                    )}
                  </div>
                </div>

                {isProductType(configDialogNode.type) ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="cfg-product">Product</Label>
                        <Input
                          id="cfg-product"
                          value={configDialogNode.data.productName}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            updateNodeById(configDialogNode.id, (node) => ({
                              ...node,
                              data: { ...node.data, productName: nextValue },
                            }));
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cfg-batch">Batch Code</Label>
                        <Input
                          id="cfg-batch"
                          value={configDialogNode.data.batchCode ?? configDialogNode.data.batchId}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            updateNodeById(configDialogNode.id, (node) => ({
                              ...node,
                              data: { ...node.data, batchCode: nextValue, batchId: nextValue },
                            }));
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cfg-qty">Quantity</Label>
                        <Input
                          id="cfg-qty"
                          type="number"
                          min={1}
                          value={configDialogNode.data.quantity}
                          onChange={(event) => {
                            const parsed = Number(event.target.value);
                            updateNodeById(configDialogNode.id, (node) => ({
                              ...node,
                              data: {
                                ...node.data,
                                quantity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                              },
                            }));
                          }}
                        />
                      </div>
                    </div>

                    {configInventoryItem && configAvailableQty !== null && configAvailableQty <= 0 && (
                      <div className="rounded border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        <p className="font-semibold">OPS Warning: this product is not currently packaged in OS.</p>
                        <p>
                          Available packaged: {configAvailableQty}. Use setup flow to reserve this line in OS.
                        </p>
                      </div>
                    )}
                    <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                      {configDialogNode.data.productCode && <p>Product Code: {configDialogNode.data.productCode}</p>}
                      {configDialogNode.data.skuId && <p>SKU: {configDialogNode.data.skuId}</p>}
                      {configDialogNode.data.packageLotCode && <p>Package Lot: {configDialogNode.data.packageLotCode}</p>}
                      {configDialogNode.data.batchCode && <p>Batch Code: {configDialogNode.data.batchCode}</p>}
                      {configDialogNode.data.assetCode && <p>Asset Code: {configDialogNode.data.assetCode}</p>}
                    </div>
                    {configDialogNode.data.reservationStatus && (
                      <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                        <p>OS reservation status: {configDialogNode.data.reservationStatus}</p>
                        {typeof configDialogNode.data.reservationShortQty === 'number' &&
                          configDialogNode.data.reservationShortQty > 0 && (
                            <p>Short quantity: {configDialogNode.data.reservationShortQty}</p>
                          )}
                        {configDialogNode.data.reservationReason && (
                          <p>Reason: {configDialogNode.data.reservationReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cfg-capacity">Capacity (items)</Label>
                        <Input
                          id="cfg-capacity"
                          type="number"
                          min={1}
                          value={configDialogNode.data.capacity}
                          onChange={(event) => {
                            const parsed = Number(event.target.value);
                            updateNodeById(configDialogNode.id, (node) => ({
                              ...node,
                              data: {
                                ...node.data,
                                capacity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                              },
                            }));
                          }}
                        />
                      </div>
                      <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                        <p>Current Load: {configDialogContents.length}</p>
                        <p>
                          Available Slots:{' '}
                          {Math.max(
                            0,
                            (configContainerLimits?.maxItems ?? configDialogNode.data.capacity) - configDialogContents.length
                          )}
                        </p>
                        {configContainerLimits && (
                          <>
                            <p>
                              Weight: {Math.round(configContainerLoad.weightLb)}/
                              {Math.round(configContainerLimits.maxWeightLb)} lb
                            </p>
                            <p>
                              Volume: {configContainerLoad.volumeFt3.toFixed(1)}/
                              {configContainerLimits.maxVolumeFt3.toFixed(1)} ft^3
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {configDialogNode.type === 'truck' && (
                      <div className="space-y-2">
                        <Label htmlFor="cfg-truck-select">Fleet Truck</Label>
                        <Select
                          value={configDialogNode.data.truckId ?? ''}
                          onValueChange={(value) => {
                            const selectedTruck = fleetMap.get(value);
                            const selectedCapacity = selectedTruck
                              ? getVehicleCapacity(selectedTruck.vehicleType)
                              : null;
                            updateNodeById(configDialogNode.id, (node) => ({
                              ...node,
                              label: selectedTruck ? selectedTruck.name : node.label,
                              data: {
                                ...node.data,
                                truckId: value,
                                packagingId: selectedTruck?.id ?? node.data.packagingId,
                                destination: selectedTruck?.homeBase ?? node.data.destination,
                                capacity: selectedCapacity
                                  ? selectedCapacity.id === 'box-truck'
                                    ? 24
                                    : selectedCapacity.id === 'pickup-truck'
                                      ? 10
                                      : 4
                                  : node.data.capacity,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger id="cfg-truck-select">
                            <SelectValue placeholder="Select truck profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {fleet.map((truck) => (
                              <SelectItem key={truck.id} value={truck.id}>
                                {truck.name} ({truck.id}) · {getVehicleCapacity(truck.vehicleType).label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {configDialogNode.data.truckId && fleetMap.get(configDialogNode.data.truckId) && (
                          <p className="text-xs text-muted-foreground">
                            Vehicle: {getVehicleCapacity(fleetMap.get(configDialogNode.data.truckId)!.vehicleType).label}
                            {' · '}
                            Payload {Math.round(resolveContainerLimits(configDialogNode, fleetMap).maxWeightLb)} lb
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isContainerType(configDialogNode.type) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Loaded Contents
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Drag items from this list back to the canvas to unpack.
                    </p>
                    {configDialogContents.length === 0 ? (
                      <div className="rounded border border-cyan-900/40 bg-black/20 p-2 text-xs text-muted-foreground">
                        No loaded items.
                      </div>
                    ) : (
                      <div className="max-h-40 space-y-2 overflow-auto pr-1">
                        {configDialogContents.map((item) => (
                          <div
                            key={`cfg-${item.id}`}
                            draggable
                            onDragStart={(event) => handleManifestDragStart(event, item.id)}
                            onDragEnd={() => handleManifestDragEnd(item.id)}
                            className="flex cursor-grab items-center justify-between rounded border border-cyan-900/40 bg-black/20 px-2 py-1 text-xs"
                          >
                            <span className="truncate text-foreground">{item.label}</span>
                            <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                              {NODE_SPECS[item.type].label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Separator className="bg-cyan-900/40" />

                <div className="flex flex-wrap gap-2">
                  {configDialogNode.type === 'truck' && (
                    <Button
                      className="gap-2"
                      onClick={() => {
                        void markTruckReadyForDelivery(configDialogNode.id);
                      }}
                    >
                      Ready For Delivery
                    </Button>
                  )}
                  {isProductType(configDialogNode.type) && configDialogNode.parentId && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => unpackNodeToCanvas(configDialogNode.id)}
                    >
                      <Unplug className="h-4 w-4" />
                      Unpack To Canvas
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => requestDeleteNode(configDialogNode.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Remove Widget
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(productSetupNode && isProductType(productSetupNode.type))}
          onOpenChange={(open) => {
            if (!open) {
              setProductSetupNodeId(null);
              setProductSetupProductId('');
            }
          }}
        >
          <DialogContent className="border-cyan-900/60 bg-[#11161d] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-cyan-100">
                {productSetupNode?.label ?? 'New Widget'} Product Setup
              </DialogTitle>
              <DialogDescription>
                Pick the product from OS inventory before staging this package for delivery.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-site">Site ID</Label>
                <Input
                  id="setup-site"
                  value={productSetupSiteId}
                  onChange={(event) => setProductSetupSiteId(event.target.value || defaultSiteId)}
                  placeholder="main"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-product">OS Inventory Product</Label>
                <Select
                  value={productSetupProductId}
                  onValueChange={(value) => setProductSetupProductId(value)}
                  disabled={inventoryLoading || inventoryItems.length === 0}
                >
                  <SelectTrigger id="setup-product">
                    <SelectValue
                      placeholder={
                        inventoryLoading ? 'Loading OS inventory...' : 'Select product from OS inventory'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                        {item.productCode ? ` · ${item.productCode}` : ''}
                        {` · ${item.skuId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inventoryError && (
                  <p className="text-xs text-amber-300">
                    OS inventory unavailable: {inventoryError}
                  </p>
                )}
              </div>

              {productSetupItem && (
                <div className="rounded border border-cyan-900/40 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                  <p>On hand: {productSetupItem.onHandQty}</p>
                  <p>Allocated: {productSetupItem.allocatedQty}</p>
                  <p>Available packaged: {productSetupAvailableQty}</p>
                  {productSetupItem.productCode && <p>Product Code: {productSetupItem.productCode}</p>}
                  <p>SKU: {productSetupItem.skuId}</p>
                  {productSetupItem.packageType && <p>Package Type: {productSetupItem.packageType}</p>}
                  {productSetupItem.packageFormatCode && <p>Format: {productSetupItem.packageFormatCode}</p>}
                  {productSetupItem.packageLots[0]?.packageLotCode && (
                    <p>
                      Active Lot: {productSetupItem.packageLots[0].packageLotCode}
                      {productSetupItem.packageLots[0].batchCode
                        ? ` · ${productSetupItem.packageLots[0].batchCode}`
                        : ''}
                    </p>
                  )}
                </div>
              )}

              {productSetupItem && productSetupAvailableQty <= 0 && (
                <div className="rounded border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  <p className="font-semibold">OPS Warning: product not yet packaged for delivery.</p>
                  <p>OS is source-of-truth and currently shows no available packaged units for this item.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={applyProductSelection} disabled={!productSetupItem || reservePending}>
                  {reservePending ? 'Reserving...' : 'Reserve In OS + Apply'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setProductSetupNodeId(null);
                    setProductSetupProductId('');
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(deleteConfirmNodeId)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteConfirmNodeId(null);
            }
          }}
        >
          <DialogContent className="border-cyan-900/60 bg-[#11161d] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-cyan-100">Delete Selected Widget?</DialogTitle>
              <DialogDescription>
                This removes the widget from canvas. If it is a container, loaded items will be moved back to staging.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirmNodeId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteNode}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(truckSelectNodeId)}
          onOpenChange={(open) => {
            if (!open) {
              setTruckSelectNodeId(null);
              setTruckSelectValue('');
            }
          }}
        >
          <DialogContent className="border-cyan-900/60 bg-[#11161d] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-cyan-100">Select Fleet Truck</DialogTitle>
              <DialogDescription>Bind this truck widget to a real fleet unit from OPS.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={truckSelectValue} onValueChange={setTruckSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose truck" />
                </SelectTrigger>
                <SelectContent>
                  {fleet.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.name} ({truck.id}) · {getVehicleCapacity(truck.vehicleType).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={loadFleet}>
                  Refresh Fleet
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTruckSelectNodeId(null);
                      setTruckSelectValue('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!truckSelectNodeId || !truckSelectValue) {
                        return;
                      }
                      const selectedTruck = fleetMap.get(truckSelectValue);
                      const selectedCapacity = selectedTruck
                        ? getVehicleCapacity(selectedTruck.vehicleType)
                        : null;
                      updateNodeById(truckSelectNodeId, (node) => ({
                        ...node,
                        label: selectedTruck ? selectedTruck.name : node.label,
                        data: {
                          ...node.data,
                          truckId: truckSelectValue,
                          packagingId: selectedTruck?.id ?? node.data.packagingId,
                          destination: selectedTruck?.homeBase ?? node.data.destination,
                          capacity: selectedCapacity
                            ? selectedCapacity.id === 'box-truck'
                              ? 24
                              : selectedCapacity.id === 'pickup-truck'
                                ? 10
                                : 4
                            : node.data.capacity,
                        },
                      }));
                      setTruckSelectNodeId(null);
                      setTruckSelectValue('');
                    }}
                  >
                    Apply Truck
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
