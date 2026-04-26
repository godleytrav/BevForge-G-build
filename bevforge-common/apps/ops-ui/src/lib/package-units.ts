import { apiGet, apiPost } from '@/lib/api';
import { buildOpsMobileLookupLink } from '@/lib/ops-mobile-links';

export type OpsPackageUnitType = 'six-pack' | 'case' | 'keg' | 'pallet' | 'truck';
export type OpsPackageUnitStatus =
  | 'staging'
  | 'reserved'
  | 'packed'
  | 'loaded'
  | 'ready_for_delivery'
  | 'delivered'
  | 'returned'
  | 'archived';
export type OpsPackageUnitLocationType =
  | 'staging'
  | 'container'
  | 'truck'
  | 'site'
  | 'warehouse'
  | 'archived';

export interface OpsPackageUnitRecord {
  schemaVersion: string;
  id: string;
  unitId: string;
  unitCode: string;
  unitType: OpsPackageUnitType;
  label: string;
  productName: string;
  quantity: number;
  status: OpsPackageUnitStatus;
  currentLocationType: OpsPackageUnitLocationType;
  activeOnCanvas: boolean;
  source: 'ops-canvas-logistics';
  productId?: string;
  productCode?: string;
  skuId?: string;
  packageType?: string;
  packageFormatCode?: string;
  batchId?: string;
  batchCode?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  assignedSiteId?: string;
  assignedSiteName?: string;
  assignedOrderId?: string;
  currentLocationId?: string;
  currentLocationLabel?: string;
  parentUnitId?: string;
  parentUnitCode?: string;
  childUnitIds: string[];
  childUnitCodes: string[];
  lastEventAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpsPackageUnitEventRecord {
  schemaVersion: string;
  id: string;
  unitId: string;
  unitCode: string;
  unitType: OpsPackageUnitType;
  eventType: string;
  summary: string;
  detail?: string;
  occurredAt: string;
  parentUnitId?: string;
  parentUnitCode?: string;
  locationType?: OpsPackageUnitLocationType;
  locationId?: string;
  locationLabel?: string;
  assignedSiteId?: string;
  assignedSiteName?: string;
  productCode?: string;
  skuId?: string;
  batchCode?: string;
  packageLotCode?: string;
  assetCode?: string;
  metadata?: Record<string, unknown>;
}

export interface OpsPackageUnitState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  units: OpsPackageUnitRecord[];
  events: OpsPackageUnitEventRecord[];
}

export interface OpsPackageUnitSyncPayload {
  units?: OpsPackageUnitRecord[];
  events?: OpsPackageUnitEventRecord[];
}

export const syncOpsPackageUnits = async (
  payload: OpsPackageUnitSyncPayload,
): Promise<OpsPackageUnitState> => apiPost<OpsPackageUnitState>('/api/ops/package-units', payload);

export const fetchOpsPackageUnits = async (
  params?: Record<string, string>,
): Promise<OpsPackageUnitState> =>
  apiGet<OpsPackageUnitState>('/api/ops/package-units', { params });

export const buildPackageUnitQrLink = (
  unit: Pick<
    OpsPackageUnitRecord,
    | 'unitId'
    | 'unitCode'
    | 'unitType'
    | 'productCode'
    | 'skuId'
    | 'batchCode'
    | 'packageLotCode'
    | 'assetCode'
  >,
  options?: { baseUrl?: string },
): string | null => {
  return buildOpsMobileLookupLink(unit.unitCode, {
    baseUrl: options?.baseUrl,
    query: {
      type: 'ops_package_unit',
      unitId: unit.unitId,
      unitCode: unit.unitCode,
      unitType: unit.unitType,
      productCode: unit.productCode,
      skuId: unit.skuId,
      batchCode: unit.batchCode,
      packageLotCode: unit.packageLotCode,
      assetCode: unit.assetCode,
      schemaVersion: '1.0.0',
    },
  });
};

export const buildPackageUnitQrPayload = (unit: Pick<
  OpsPackageUnitRecord,
  | 'unitId'
  | 'unitCode'
  | 'unitType'
  | 'productCode'
  | 'skuId'
  | 'batchCode'
  | 'packageLotCode'
  | 'assetCode'
>): string =>
  buildPackageUnitQrLink(unit) ??
  JSON.stringify({
    type: 'ops_package_unit',
    unitId: unit.unitId,
    unitCode: unit.unitCode,
    unitType: unit.unitType,
    productCode: unit.productCode,
    skuId: unit.skuId,
    batchCode: unit.batchCode,
    packageLotCode: unit.packageLotCode,
    assetCode: unit.assetCode,
    schemaVersion: '1.0.0',
  });
