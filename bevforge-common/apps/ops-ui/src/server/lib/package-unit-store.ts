import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const PACKAGE_UNIT_SCHEMA_VERSION = '1.0.0';

type PackageUnitType = 'six-pack' | 'case' | 'keg' | 'pallet' | 'truck';
type PackageUnitStatus =
  | 'staging'
  | 'reserved'
  | 'packed'
  | 'loaded'
  | 'ready_for_delivery'
  | 'delivered'
  | 'returned'
  | 'archived';
type PackageUnitLocationType =
  | 'staging'
  | 'container'
  | 'truck'
  | 'site'
  | 'warehouse'
  | 'archived';

interface PackageUnitRecord {
  schemaVersion: string;
  id: string;
  unitId: string;
  unitCode: string;
  unitType: PackageUnitType;
  label: string;
  productName: string;
  quantity: number;
  status: PackageUnitStatus;
  currentLocationType: PackageUnitLocationType;
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

interface PackageUnitEventRecord {
  schemaVersion: string;
  id: string;
  unitId: string;
  unitCode: string;
  unitType: PackageUnitType;
  eventType: string;
  summary: string;
  detail?: string;
  occurredAt: string;
  parentUnitId?: string;
  parentUnitCode?: string;
  locationType?: PackageUnitLocationType;
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

interface PackageUnitState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  units: PackageUnitRecord[];
  events: PackageUnitEventRecord[];
}

const nowIso = (): string => new Date().toISOString();

const defaultState = (): PackageUnitState => ({
  schemaVersion: PACKAGE_UNIT_SCHEMA_VERSION,
  id: 'ops-package-units',
  updatedAt: nowIso(),
  units: [],
  events: [],
});

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
const packageUnitStateFile = path.join(opsRoot, 'package-units.json');

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(packageUnitStateFile);
  } catch {
    await writeJson(packageUnitStateFile, defaultState());
  }
};

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

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

const isPackageUnitType = (value: unknown): value is PackageUnitType =>
  value === 'six-pack' || value === 'case' || value === 'keg' || value === 'pallet' || value === 'truck';

const isPackageUnitStatus = (value: unknown): value is PackageUnitStatus =>
  value === 'staging' ||
  value === 'reserved' ||
  value === 'packed' ||
  value === 'loaded' ||
  value === 'ready_for_delivery' ||
  value === 'delivered' ||
  value === 'returned' ||
  value === 'archived';

const isLocationType = (value: unknown): value is PackageUnitLocationType =>
  value === 'staging' ||
  value === 'container' ||
  value === 'truck' ||
  value === 'site' ||
  value === 'warehouse' ||
  value === 'archived';

const normalizeUnit = (value: unknown): PackageUnitRecord | null => {
  const row = toRecord(value);
  const unitId = toOptionalString(row.unitId) ?? toOptionalString(row.id);
  const unitCode = toOptionalString(row.unitCode);
  const unitType = row.unitType;
  const label = toOptionalString(row.label);
  const productName = toOptionalString(row.productName) ?? 'Unnamed package';
  const status = row.status;
  const currentLocationType = row.currentLocationType;

  if (
    !unitId ||
    !unitCode ||
    !isPackageUnitType(unitType) ||
    !label ||
    !isPackageUnitStatus(status) ||
    !isLocationType(currentLocationType)
  ) {
    return null;
  }

  return {
    schemaVersion: PACKAGE_UNIT_SCHEMA_VERSION,
    id: unitId,
    unitId,
    unitCode,
    unitType,
    label,
    productName,
    quantity: Math.max(0, toNumber(row.quantity, 0)),
    status,
    currentLocationType,
    activeOnCanvas: Boolean(row.activeOnCanvas),
    source: 'ops-canvas-logistics',
    productId: toOptionalString(row.productId),
    productCode: toOptionalString(row.productCode),
    skuId: toOptionalString(row.skuId),
    packageType: toOptionalString(row.packageType),
    packageFormatCode: toOptionalString(row.packageFormatCode),
    batchId: toOptionalString(row.batchId),
    batchCode: toOptionalString(row.batchCode),
    packageLotId: toOptionalString(row.packageLotId),
    packageLotCode: toOptionalString(row.packageLotCode),
    assetId: toOptionalString(row.assetId),
    assetCode: toOptionalString(row.assetCode),
    assignedSiteId: toOptionalString(row.assignedSiteId),
    assignedSiteName: toOptionalString(row.assignedSiteName),
    assignedOrderId: toOptionalString(row.assignedOrderId),
    currentLocationId: toOptionalString(row.currentLocationId),
    currentLocationLabel: toOptionalString(row.currentLocationLabel),
    parentUnitId: toOptionalString(row.parentUnitId),
    parentUnitCode: toOptionalString(row.parentUnitCode),
    childUnitIds: Array.isArray(row.childUnitIds)
      ? row.childUnitIds.filter((entry): entry is string => typeof entry === 'string')
      : [],
    childUnitCodes: Array.isArray(row.childUnitCodes)
      ? row.childUnitCodes.filter((entry): entry is string => typeof entry === 'string')
      : [],
    lastEventAt: toOptionalString(row.lastEventAt),
    createdAt: toOptionalString(row.createdAt) ?? nowIso(),
    updatedAt: toOptionalString(row.updatedAt) ?? nowIso(),
  };
};

const normalizeEvent = (value: unknown): PackageUnitEventRecord | null => {
  const row = toRecord(value);
  const unitId = toOptionalString(row.unitId);
  const unitCode = toOptionalString(row.unitCode);
  const unitType = row.unitType;
  const eventType = toOptionalString(row.eventType);
  const summary = toOptionalString(row.summary);
  if (!unitId || !unitCode || !isPackageUnitType(unitType) || !eventType || !summary) {
    return null;
  }

  return {
    schemaVersion: PACKAGE_UNIT_SCHEMA_VERSION,
    id: toOptionalString(row.id) ?? `pkg-event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    unitId,
    unitCode,
    unitType,
    eventType,
    summary,
    detail: toOptionalString(row.detail),
    occurredAt: toOptionalString(row.occurredAt) ?? nowIso(),
    parentUnitId: toOptionalString(row.parentUnitId),
    parentUnitCode: toOptionalString(row.parentUnitCode),
    locationType: isLocationType(row.locationType) ? row.locationType : undefined,
    locationId: toOptionalString(row.locationId),
    locationLabel: toOptionalString(row.locationLabel),
    assignedSiteId: toOptionalString(row.assignedSiteId),
    assignedSiteName: toOptionalString(row.assignedSiteName),
    productCode: toOptionalString(row.productCode),
    skuId: toOptionalString(row.skuId),
    batchCode: toOptionalString(row.batchCode),
    packageLotCode: toOptionalString(row.packageLotCode),
    assetCode: toOptionalString(row.assetCode),
    metadata: typeof row.metadata === 'object' && row.metadata !== null ? (row.metadata as Record<string, unknown>) : undefined,
  };
};

const normalizeState = (value: unknown): PackageUnitState => {
  const row = toRecord(value);
  return {
    schemaVersion: PACKAGE_UNIT_SCHEMA_VERSION,
    id: 'ops-package-units',
    updatedAt: toOptionalString(row.updatedAt) ?? nowIso(),
    units: Array.isArray(row.units)
      ? row.units.map(normalizeUnit).filter((entry): entry is PackageUnitRecord => entry !== null)
      : [],
    events: Array.isArray(row.events)
      ? row.events.map(normalizeEvent).filter((entry): entry is PackageUnitEventRecord => entry !== null)
      : [],
  };
};

export const readOpsPackageUnitState = async (): Promise<PackageUnitState> => {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(packageUnitStateFile, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
};

const writeState = async (state: PackageUnitState): Promise<PackageUnitState> => {
  const next = normalizeState(state);
  next.updatedAt = nowIso();
  await writeJson(packageUnitStateFile, next);
  return next;
};

interface SyncPayload {
  units?: unknown[];
  events?: unknown[];
}

const syncDerivedChildren = (units: PackageUnitRecord[]): PackageUnitRecord[] => {
  const childIdsByParent = new Map<string, string[]>();
  const childCodesByParent = new Map<string, string[]>();

  units.forEach((unit) => {
    if (!unit.parentUnitId) {
      return;
    }
    childIdsByParent.set(unit.parentUnitId, [...(childIdsByParent.get(unit.parentUnitId) ?? []), unit.unitId]);
    childCodesByParent.set(unit.parentUnitId, [...(childCodesByParent.get(unit.parentUnitId) ?? []), unit.unitCode]);
  });

  return units.map((unit) => ({
    ...unit,
    childUnitIds: childIdsByParent.get(unit.unitId) ?? [],
    childUnitCodes: childCodesByParent.get(unit.unitId) ?? [],
  }));
};

export const syncOpsPackageUnits = async (payload: SyncPayload): Promise<PackageUnitState> => {
  const current = await readOpsPackageUnitState();
  const byId = new Map(current.units.map((unit) => [unit.unitId, unit]));
  const nextEvents = Array.isArray(payload.events)
    ? payload.events.map(normalizeEvent).filter((entry): entry is PackageUnitEventRecord => entry !== null)
    : [];

  if (Array.isArray(payload.units)) {
    payload.units
      .map(normalizeUnit)
      .filter((entry): entry is PackageUnitRecord => entry !== null)
      .forEach((unit) => {
        const existing = byId.get(unit.unitId);
        byId.set(unit.unitId, {
          ...existing,
          ...unit,
          createdAt: existing?.createdAt ?? unit.createdAt,
          updatedAt: nowIso(),
        });
      });
  }

  nextEvents.forEach((event) => {
    const currentUnit = byId.get(event.unitId);
    if (currentUnit) {
      byId.set(event.unitId, {
        ...currentUnit,
        lastEventAt: event.occurredAt,
        updatedAt: nowIso(),
      });
    }
  });

  const nextState = await writeState({
    ...current,
    units: syncDerivedChildren(Array.from(byId.values()).sort((left, right) => left.unitCode.localeCompare(right.unitCode))),
    events: [...current.events, ...nextEvents]
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .slice(-4000),
  });

  return nextState;
};
