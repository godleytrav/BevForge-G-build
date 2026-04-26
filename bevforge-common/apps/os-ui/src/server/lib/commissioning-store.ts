import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createDefaultProject } from '../../features/canvas/defaults';
import type { CanvasProject, ImportedRecipe, RegisteredDevice } from '../../features/canvas/types';

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'os-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'os-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const commissioningRoot = path.join(repoRoot, 'commissioning', 'os');
const recipesRoot = path.join(commissioningRoot, 'recipes');
const queueRoot = path.join(commissioningRoot, 'queue');
const jobsRoot = path.join(commissioningRoot, 'jobs');
const reportsRoot = path.join(commissioningRoot, 'reports');

export const commissioningPaths = {
  root: commissioningRoot,
  projectFile: path.join(commissioningRoot, 'canvas-project.json'),
  devicesFile: path.join(commissioningRoot, 'devices.json'),
  siteSettingsFile: path.join(commissioningRoot, 'site-settings.json'),
  locationsFile: path.join(commissioningRoot, 'locations.json'),
  labDraftsFile: path.join(commissioningRoot, 'lab-drafts.json'),
  labHandoffAuditFile: path.join(commissioningRoot, 'lab-handoff-audit.json'),
  automationRunsFile: path.join(commissioningRoot, 'automation-runs.json'),
  recipeRunsFile: path.join(commissioningRoot, 'recipe-runs.json'),
  recipeReadingsFile: path.join(commissioningRoot, 'recipe-readings.json'),
  recipeRunboardProfilesFile: path.join(commissioningRoot, 'recipe-runboard-profiles.json'),
  productCatalogFile: path.join(commissioningRoot, 'product-catalog.json'),
  productMediaDir: path.join(commissioningRoot, 'product-media'),
  equipmentRoleMapFile: path.join(commissioningRoot, 'equipment-role-map.json'),
  transferRouteMapFile: path.join(commissioningRoot, 'transfer-route-map.json'),
  recipesDir: recipesRoot,
  recipeIndexFile: path.join(recipesRoot, 'index.json'),
  queueRoot,
  queueInboxDir: path.join(queueRoot, 'recipes'),
  queueRejectedDir: path.join(queueRoot, 'rejected'),
  queueStatusFile: path.join(queueRoot, 'status.json'),
  jobsDir: jobsRoot,
  reportsDir: reportsRoot,
  reportArtifactsFile: path.join(commissioningRoot, 'report-artifacts.json'),
};

const nowIso = () => new Date().toISOString();

const normalizeBatchVolumeUnit = (value: unknown): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'bbl' || normalized === 'bbls' || normalized === 'barrel' || normalized === 'barrels') {
    return 'bbl';
  }
  if (
    normalized === 'gal' ||
    normalized === 'gals' ||
    normalized === 'gallon' ||
    normalized === 'gallons' ||
    normalized === 'g'
  ) {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return 'bbl';
};

const ensureDirectory = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown) => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

export const ensureCommissioningStore = async (): Promise<void> => {
  await ensureDirectory(commissioningPaths.root);
  await ensureDirectory(commissioningPaths.recipesDir);
  await ensureDirectory(commissioningPaths.queueRoot);
  await ensureDirectory(commissioningPaths.queueInboxDir);
  await ensureDirectory(commissioningPaths.queueRejectedDir);
  await ensureDirectory(commissioningPaths.jobsDir);
  await ensureDirectory(commissioningPaths.productMediaDir);
  await ensureDirectory(commissioningPaths.reportsDir);
};

export const readCanvasProject = async (): Promise<CanvasProject> => {
  await ensureCommissioningStore();
  const fallback = createDefaultProject();
  const project = await readJsonOrDefault<CanvasProject>(
    commissioningPaths.projectFile,
    fallback
  );

  if (!project.pages || project.pages.length === 0) {
    return fallback;
  }

  return project;
};

export const writeCanvasProject = async (
  project: CanvasProject
): Promise<CanvasProject> => {
  await ensureCommissioningStore();
  const normalized: CanvasProject = {
    ...project,
    schemaVersion: project.schemaVersion ?? '1.0.0',
    updatedAt: nowIso(),
    pages: (project.pages ?? []).map((page) => ({
      ...page,
      updatedAt: nowIso(),
    })),
  };
  await writeJson(commissioningPaths.projectFile, normalized);
  return normalized;
};

export const readDevices = async (): Promise<RegisteredDevice[]> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<RegisteredDevice[]>(commissioningPaths.devicesFile, []);
};

export const writeDevices = async (
  devices: RegisteredDevice[]
): Promise<RegisteredDevice[]> => {
  await ensureCommissioningStore();
  const normalized = devices.map((device) => ({
    ...device,
    updatedAt: nowIso(),
  }));
  await writeJson(commissioningPaths.devicesFile, normalized);
  return normalized;
};

export const appendImportedRecipe = async (
  recipe: ImportedRecipe
): Promise<void> => {
  await ensureCommissioningStore();
  const index = await readJsonOrDefault<ImportedRecipe[]>(
    commissioningPaths.recipeIndexFile,
    []
  );
  const updated = [recipe, ...index].slice(0, 200);
  await writeJson(commissioningPaths.recipeIndexFile, updated);
};

export const readImportedRecipes = async (): Promise<ImportedRecipe[]> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<ImportedRecipe[]>(commissioningPaths.recipeIndexFile, []);
};

export interface SiteSettingsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  siteName: string;
  defaultSiteId: string;
  defaultVolumeUnit: string;
  temperatureUnit: 'C' | 'F';
  timezone: string;
  batchPrefix?: string;
  requireRecipeBeforeBatch: boolean;
  dashboard: DashboardSettings;
  complianceGuidance: ComplianceGuidanceSettings;
  reportingCalendar: ReportingCalendarSettings;
}

export type TtbOperationsFrequency = 'monthly' | 'quarterly' | 'annual' | 'disabled';
export type TtbExciseFrequency = 'quarterly' | 'annual' | 'disabled';
export type CdtfaFrequency = 'monthly' | 'disabled';

export interface ReportingCalendarSettings {
  autoCalendarDeadlines: boolean;
  ttbOperationsFrequency: TtbOperationsFrequency;
  ttbExciseFrequency: TtbExciseFrequency;
  californiaCdtfaFrequency: CdtfaFrequency;
  californiaAbcEnabled: boolean;
  californiaAbcReviewMonth: number;
  californiaAbcReviewDay: number;
}

export interface DashboardSettings {
  activeProductionQuickMetrics: string[];
  activeProductionGraphMetrics: string[];
}

export interface ComplianceGuidanceSettings {
  primarySalesChannel: 'direct_to_consumer' | 'mixed' | 'wholesale';
  interstateSalesDefault: boolean;
  retailFoodEstablishmentExemptLikely: boolean;
}

export interface LocationRecord {
  siteId: string;
  name: string;
  timezone: string;
  active: boolean;
  addressLine1?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
}

export interface LocationRegistryState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  locations: LocationRecord[];
}

const defaultReportingCalendarSettings = (): ReportingCalendarSettings => ({
  autoCalendarDeadlines: true,
  ttbOperationsFrequency: 'quarterly',
  ttbExciseFrequency: 'quarterly',
  californiaCdtfaFrequency: 'monthly',
  californiaAbcEnabled: true,
  californiaAbcReviewMonth: 7,
  californiaAbcReviewDay: 31,
});

const ACTIVE_PRODUCTION_METRIC_KEYS = [
  'temperatureC',
  'sg',
  'abv',
  'brix',
  'residualSugarGpl',
  'ph',
  'apparentAttenuation',
] as const;

const DEFAULT_ACTIVE_PRODUCTION_QUICK_METRICS = [
  'temperatureC',
  'sg',
  'abv',
  'residualSugarGpl',
];

const DEFAULT_ACTIVE_PRODUCTION_GRAPH_METRICS = ['sg', 'temperatureC'];

const normalizeDashboardMetrics = (
  value: unknown,
  fallback: string[],
  maxCount: number
): string[] => {
  if (!Array.isArray(value)) return fallback;
  const filtered = value.filter(
    (entry): entry is string =>
      typeof entry === 'string' &&
      ACTIVE_PRODUCTION_METRIC_KEYS.includes(entry as (typeof ACTIVE_PRODUCTION_METRIC_KEYS)[number])
  );
  const deduped = Array.from(new Set(filtered));
  return deduped.length > 0 ? deduped.slice(0, maxCount) : fallback;
};

const normalizeDashboardSettings = (
  value: Partial<DashboardSettings> | undefined,
  current?: DashboardSettings
): DashboardSettings => {
  const fallback = current ?? {
    activeProductionQuickMetrics: DEFAULT_ACTIVE_PRODUCTION_QUICK_METRICS,
    activeProductionGraphMetrics: DEFAULT_ACTIVE_PRODUCTION_GRAPH_METRICS,
  };
  const next = value ?? {};
  return {
    activeProductionQuickMetrics: normalizeDashboardMetrics(
      next.activeProductionQuickMetrics,
      fallback.activeProductionQuickMetrics,
      4
    ),
    activeProductionGraphMetrics: normalizeDashboardMetrics(
      next.activeProductionGraphMetrics,
      fallback.activeProductionGraphMetrics,
      4
    ),
  };
};

const normalizeComplianceGuidanceSettings = (
  value: Partial<ComplianceGuidanceSettings> | undefined,
  current?: ComplianceGuidanceSettings
): ComplianceGuidanceSettings => {
  const fallback = current ?? {
    primarySalesChannel: 'direct_to_consumer',
    interstateSalesDefault: false,
    retailFoodEstablishmentExemptLikely: true,
  };
  const next = value ?? {};
  return {
    primarySalesChannel:
      next.primarySalesChannel === 'mixed' || next.primarySalesChannel === 'wholesale'
        ? next.primarySalesChannel
        : next.primarySalesChannel === 'direct_to_consumer'
          ? next.primarySalesChannel
          : fallback.primarySalesChannel,
    interstateSalesDefault:
      typeof next.interstateSalesDefault === 'boolean'
        ? next.interstateSalesDefault
        : Boolean(fallback.interstateSalesDefault),
    retailFoodEstablishmentExemptLikely:
      typeof next.retailFoodEstablishmentExemptLikely === 'boolean'
        ? next.retailFoodEstablishmentExemptLikely
        : Boolean(fallback.retailFoodEstablishmentExemptLikely),
  };
};

const clampWholeNumber = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
};

const normalizeReportingCalendarSettings = (
  value: Partial<ReportingCalendarSettings> | undefined,
  current?: ReportingCalendarSettings
): ReportingCalendarSettings => {
  const fallback = current ?? defaultReportingCalendarSettings();
  const next = value ?? {};
  return {
    autoCalendarDeadlines:
      typeof next.autoCalendarDeadlines === 'boolean'
        ? next.autoCalendarDeadlines
        : Boolean(fallback.autoCalendarDeadlines),
    ttbOperationsFrequency:
      next.ttbOperationsFrequency === 'monthly' ||
      next.ttbOperationsFrequency === 'quarterly' ||
      next.ttbOperationsFrequency === 'annual' ||
      next.ttbOperationsFrequency === 'disabled'
        ? next.ttbOperationsFrequency
        : fallback.ttbOperationsFrequency,
    ttbExciseFrequency:
      next.ttbExciseFrequency === 'quarterly' ||
      next.ttbExciseFrequency === 'annual' ||
      next.ttbExciseFrequency === 'disabled'
        ? next.ttbExciseFrequency
        : fallback.ttbExciseFrequency,
    californiaCdtfaFrequency:
      next.californiaCdtfaFrequency === 'monthly' ||
      next.californiaCdtfaFrequency === 'disabled'
        ? next.californiaCdtfaFrequency
        : fallback.californiaCdtfaFrequency,
    californiaAbcEnabled:
      typeof next.californiaAbcEnabled === 'boolean'
        ? next.californiaAbcEnabled
        : Boolean(fallback.californiaAbcEnabled),
    californiaAbcReviewMonth: clampWholeNumber(
      next.californiaAbcReviewMonth,
      1,
      12,
      fallback.californiaAbcReviewMonth
    ),
    californiaAbcReviewDay: clampWholeNumber(
      next.californiaAbcReviewDay,
      1,
      31,
      fallback.californiaAbcReviewDay
    ),
  };
};

const defaultSiteSettingsState = (): SiteSettingsState => ({
  schemaVersion: '1.0.0',
  id: 'os-site-settings',
  updatedAt: nowIso(),
  siteName: 'Main Production Site',
  defaultSiteId: 'main',
  defaultVolumeUnit: 'bbl',
  temperatureUnit: 'C',
  timezone: 'America/Los_Angeles',
  batchPrefix: '',
  requireRecipeBeforeBatch: true,
  dashboard: normalizeDashboardSettings(undefined),
  complianceGuidance: normalizeComplianceGuidanceSettings(undefined),
  reportingCalendar: defaultReportingCalendarSettings(),
});

const normalizeSiteId = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9-_]/g, '') || 'main';

const normalizeLocationRecord = (value: Partial<LocationRecord> | null | undefined): LocationRecord | null => {
  if (!value) return null;
  const rawSiteId = String(value.siteId ?? '').trim();
  if (!rawSiteId) return null;
  const siteId = normalizeSiteId(rawSiteId);
  const name = String(value.name ?? '').trim() || siteId;
  const timezone = String(value.timezone ?? 'America/Los_Angeles').trim() || 'America/Los_Angeles';
  return {
    siteId,
    name,
    timezone,
    active: value.active !== false,
    addressLine1: String(value.addressLine1 ?? '').trim() || undefined,
    city: String(value.city ?? '').trim() || undefined,
    stateRegion: String(value.stateRegion ?? '').trim() || undefined,
    postalCode: String(value.postalCode ?? '').trim() || undefined,
    country: String(value.country ?? '').trim() || undefined,
  };
};

const defaultLocationRegistryState = (settings?: SiteSettingsState): LocationRegistryState => ({
  schemaVersion: '1.0.0',
  id: 'os-locations',
  updatedAt: nowIso(),
  locations: [
    {
      siteId: normalizeSiteId(settings?.defaultSiteId ?? 'main'),
      name: String(settings?.siteName ?? 'Main Production Site').trim() || 'Main Production Site',
      timezone: String(settings?.timezone ?? 'America/Los_Angeles').trim() || 'America/Los_Angeles',
      active: true,
    },
  ],
});

export const readLocations = async (): Promise<LocationRegistryState> => {
  await ensureCommissioningStore();
  const settings = await readSiteSettings();
  const current = await readJsonOrDefault<LocationRegistryState>(
    commissioningPaths.locationsFile,
    defaultLocationRegistryState(settings)
  );
  const normalized = (current.locations ?? [])
    .map((entry) => normalizeLocationRecord(entry))
    .filter((entry): entry is LocationRecord => entry !== null);
  const defaultSiteId = normalizeSiteId(settings.defaultSiteId);
  if (!normalized.some((location) => location.siteId === defaultSiteId)) {
    normalized.unshift({
      siteId: defaultSiteId,
      name: String(settings.siteName ?? 'Main Production Site').trim() || 'Main Production Site',
      timezone: String(settings.timezone ?? 'America/Los_Angeles').trim() || 'America/Los_Angeles',
      active: true,
    });
  }
  return {
    schemaVersion: current.schemaVersion ?? '1.0.0',
    id: current.id ?? 'os-locations',
    updatedAt: String(current.updatedAt ?? nowIso()),
    locations: normalized,
  };
};

export const writeLocations = async (
  locations: Array<Partial<LocationRecord>>
): Promise<LocationRegistryState> => {
  await ensureCommissioningStore();
  const current = await readLocations();
  const deduped = new Map<string, LocationRecord>();
  for (const entry of locations) {
    const normalized = normalizeLocationRecord(entry);
    if (!normalized) continue;
    deduped.set(normalized.siteId, normalized);
  }
  const nextLocations = [...deduped.values()];
  if (nextLocations.length === 0) {
    nextLocations.push(...current.locations);
  }
  const next: LocationRegistryState = {
    schemaVersion: current.schemaVersion ?? '1.0.0',
    id: current.id ?? 'os-locations',
    updatedAt: nowIso(),
    locations: nextLocations,
  };
  await writeJson(commissioningPaths.locationsFile, next);
  return next;
};

export const readSiteSettings = async (): Promise<SiteSettingsState> => {
  await ensureCommissioningStore();
  const current = await readJsonOrDefault<SiteSettingsState>(
    commissioningPaths.siteSettingsFile,
    defaultSiteSettingsState()
  );
  const defaults = defaultSiteSettingsState();
  return {
    ...defaults,
    ...current,
    updatedAt: String(current.updatedAt ?? nowIso()),
    dashboard: normalizeDashboardSettings(current.dashboard, defaults.dashboard),
    complianceGuidance: normalizeComplianceGuidanceSettings(
      current.complianceGuidance,
      defaults.complianceGuidance
    ),
    reportingCalendar: normalizeReportingCalendarSettings(
      current.reportingCalendar,
      defaults.reportingCalendar
    ),
  };
};

export const writeSiteSettings = async (
  patch: Partial<Omit<SiteSettingsState, 'reportingCalendar' | 'complianceGuidance' | 'dashboard'>> & {
    complianceGuidance?: Partial<ComplianceGuidanceSettings>;
    reportingCalendar?: Partial<ReportingCalendarSettings>;
    dashboard?: Partial<DashboardSettings>;
  }
): Promise<SiteSettingsState> => {
  await ensureCommissioningStore();
  const current = await readSiteSettings();
  const next: SiteSettingsState = {
    ...current,
    ...patch,
    schemaVersion: current.schemaVersion ?? '1.0.0',
    id: current.id ?? 'os-site-settings',
    updatedAt: nowIso(),
    siteName: String(patch.siteName ?? current.siteName ?? 'Main Production Site').trim() || 'Main Production Site',
    defaultSiteId: String(patch.defaultSiteId ?? current.defaultSiteId ?? 'main').trim() || 'main',
    defaultVolumeUnit: normalizeBatchVolumeUnit(patch.defaultVolumeUnit ?? current.defaultVolumeUnit ?? 'bbl'),
    temperatureUnit:
      patch.temperatureUnit === 'F'
        ? 'F'
        : patch.temperatureUnit === 'C'
          ? 'C'
          : current.temperatureUnit === 'F'
            ? 'F'
            : 'C',
    timezone: String(patch.timezone ?? current.timezone ?? 'America/Los_Angeles').trim() || 'America/Los_Angeles',
    batchPrefix: String(patch.batchPrefix ?? current.batchPrefix ?? '').trim(),
    requireRecipeBeforeBatch:
      typeof patch.requireRecipeBeforeBatch === 'boolean'
        ? patch.requireRecipeBeforeBatch
        : Boolean(current.requireRecipeBeforeBatch),
    dashboard: normalizeDashboardSettings(patch.dashboard, current.dashboard),
    complianceGuidance: normalizeComplianceGuidanceSettings(
      patch.complianceGuidance,
      current.complianceGuidance
    ),
    reportingCalendar: normalizeReportingCalendarSettings(
      patch.reportingCalendar,
      current.reportingCalendar
    ),
  };
  await writeJson(commissioningPaths.siteSettingsFile, next);
  const currentLocations = await readLocations();
  if (!currentLocations.locations.some((location) => location.siteId === normalizeSiteId(next.defaultSiteId))) {
    await writeLocations([
      ...currentLocations.locations,
      {
        siteId: next.defaultSiteId,
        name: next.siteName,
        timezone: next.timezone,
        active: true,
      },
    ]);
  }
  return next;
};

export type EquipmentRoleId =
  | 'hlt_vessel'
  | 'mash_tun_vessel'
  | 'boil_kettle_vessel'
  | 'fermenter_primary'
  | 'heat_source_primary'
  | 'transfer_pump_primary'
  | 'glycol_pump'
  | 'glycol_supply_valve'
  | 'temp_sensor_mash'
  | 'temp_sensor_fermenter';

export interface EquipmentRoleMapState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  roles: Partial<Record<EquipmentRoleId, string>>;
}

const defaultEquipmentRoleMapState = (): EquipmentRoleMapState => ({
  schemaVersion: '0.1.0',
  id: 'equipment-role-map',
  updatedAt: nowIso(),
  roles: {},
});

export const readEquipmentRoleMap = async (): Promise<EquipmentRoleMapState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<EquipmentRoleMapState>(
    commissioningPaths.equipmentRoleMapFile,
    defaultEquipmentRoleMapState()
  );
};

export const writeEquipmentRoleMap = async (
  patch: Partial<Record<EquipmentRoleId, string | null | undefined>>
): Promise<EquipmentRoleMapState> => {
  await ensureCommissioningStore();
  const current = await readEquipmentRoleMap();
  const nextRoles: Partial<Record<EquipmentRoleId, string>> = { ...(current.roles ?? {}) };
  const allowedRoles: EquipmentRoleId[] = [
    'hlt_vessel',
    'mash_tun_vessel',
    'boil_kettle_vessel',
    'fermenter_primary',
    'heat_source_primary',
    'transfer_pump_primary',
    'glycol_pump',
    'glycol_supply_valve',
    'temp_sensor_mash',
    'temp_sensor_fermenter',
  ];

  for (const role of allowedRoles) {
    if (!(role in patch)) continue;
    const nextValue = patch[role];
    if (!nextValue || !String(nextValue).trim()) {
      delete nextRoles[role];
      continue;
    }
    nextRoles[role] = String(nextValue).trim();
  }

  const nextState: EquipmentRoleMapState = {
    schemaVersion: current.schemaVersion ?? '0.1.0',
    id: current.id ?? 'equipment-role-map',
    updatedAt: nowIso(),
    roles: nextRoles,
  };
  await writeJson(commissioningPaths.equipmentRoleMapFile, nextState);
  return nextState;
};

export type TransferRouteKey =
  | 'hlt_to_mash'
  | 'mash_to_kettle'
  | 'kettle_to_fermenter'
  | 'fermenter_to_bright'
  | 'bright_to_packaging';

export interface TransferRouteConfig {
  enabled?: boolean;
  transferControllerRef?: string;
  pumpRef?: string;
  sourceValveRef?: string;
  destinationValveRef?: string;
  speedPct?: number;
  closeValvesOnComplete?: boolean;
  requireArmConfirm?: boolean;
}

export interface TransferRouteMapState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  routes: Partial<Record<TransferRouteKey, TransferRouteConfig>>;
}

const defaultTransferRouteMapState = (): TransferRouteMapState => ({
  schemaVersion: '0.1.0',
  id: 'transfer-route-map',
  updatedAt: nowIso(),
  routes: {},
});

const transferRouteKeys: TransferRouteKey[] = [
  'hlt_to_mash',
  'mash_to_kettle',
  'kettle_to_fermenter',
  'fermenter_to_bright',
  'bright_to_packaging',
];

export const readTransferRouteMap = async (): Promise<TransferRouteMapState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<TransferRouteMapState>(
    commissioningPaths.transferRouteMapFile,
    defaultTransferRouteMapState()
  );
};

export const writeTransferRouteMap = async (
  patch: Partial<Record<TransferRouteKey, Partial<TransferRouteConfig> | null | undefined>>
): Promise<TransferRouteMapState> => {
  await ensureCommissioningStore();
  const current = await readTransferRouteMap();
  const nextRoutes: Partial<Record<TransferRouteKey, TransferRouteConfig>> = {
    ...(current.routes ?? {}),
  };

  for (const key of transferRouteKeys) {
    if (!(key in patch)) continue;
    const nextValue = patch[key];
    if (!nextValue || typeof nextValue !== 'object') {
      delete nextRoutes[key];
      continue;
    }
    const normalized: TransferRouteConfig = {
      enabled: nextValue.enabled === undefined ? true : Boolean(nextValue.enabled),
      transferControllerRef:
        String(nextValue.transferControllerRef ?? '').trim() || undefined,
      pumpRef: String(nextValue.pumpRef ?? '').trim() || undefined,
      sourceValveRef: String(nextValue.sourceValveRef ?? '').trim() || undefined,
      destinationValveRef:
        String(nextValue.destinationValveRef ?? '').trim() || undefined,
      speedPct:
        Number.isFinite(Number(nextValue.speedPct)) &&
        Number(nextValue.speedPct) >= 0
          ? Number(nextValue.speedPct)
          : undefined,
      closeValvesOnComplete:
        nextValue.closeValvesOnComplete === undefined
          ? true
          : Boolean(nextValue.closeValvesOnComplete),
      requireArmConfirm:
        nextValue.requireArmConfirm === undefined
          ? key === 'bright_to_packaging'
          : Boolean(nextValue.requireArmConfirm),
    };
    const hasTarget =
      Boolean(normalized.transferControllerRef) ||
      Boolean(normalized.pumpRef) ||
      Boolean(normalized.sourceValveRef) ||
      Boolean(normalized.destinationValveRef);
    if (!hasTarget) {
      delete nextRoutes[key];
      continue;
    }
    nextRoutes[key] = normalized;
  }

  const nextState: TransferRouteMapState = {
    schemaVersion: current.schemaVersion ?? '0.1.0',
    id: current.id ?? 'transfer-route-map',
    updatedAt: nowIso(),
    routes: nextRoutes,
  };
  await writeJson(commissioningPaths.transferRouteMapFile, nextState);
  return nextState;
};

export interface AutomationRunStepState {
  id: string;
  label?: string;
  targetDeviceId?: string;
  command?: string;
  value?: string | number | boolean;
  delayMs?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  endedAt?: string;
  message?: string;
}

export interface AutomationRunRecord {
  runId: string;
  nodeId: string;
  pageId?: string;
  status: 'running' | 'completed' | 'failed' | 'canceled';
  startedAt: string;
  endedAt?: string;
  currentStepIndex: number;
  steps: AutomationRunStepState[];
}

export interface AutomationRunsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  runs: AutomationRunRecord[];
}

const defaultAutomationRunsState = (): AutomationRunsState => ({
  schemaVersion: '0.1.0',
  id: 'automation-runs',
  updatedAt: nowIso(),
  runs: [],
});

export const readAutomationRunsState = async (): Promise<AutomationRunsState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<AutomationRunsState>(
    commissioningPaths.automationRunsFile,
    defaultAutomationRunsState()
  );
};

export const writeAutomationRunsState = async (
  state: AutomationRunsState
): Promise<AutomationRunsState> => {
  await ensureCommissioningStore();
  const normalized: AutomationRunsState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'automation-runs',
    updatedAt: nowIso(),
    runs: [...(state.runs ?? [])].slice(-200),
  };
  await writeJson(commissioningPaths.automationRunsFile, normalized);
  return normalized;
};

export interface RecipeRunStepState {
  id: string;
  name: string;
  stage?: string;
  action?: string;
  triggerWhen?: string;
  command?: string;
  targetDeviceId?: string;
  value?: string | number | boolean;
  durationMin?: number;
  temperatureC?: number;
  requiresUserConfirm?: boolean;
  autoProceed?: boolean;
  status: 'pending' | 'running' | 'waiting_confirm' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  endedAt?: string;
  message?: string;
}

export interface RecipeRunRecord {
  runId: string;
  recipeId: string;
  recipeName: string;
  executionMode?: 'automated' | 'hybrid' | 'manual';
  sourceFile?: string;
  status: 'running' | 'paused' | 'waiting_confirm' | 'completed' | 'failed' | 'canceled';
  startedAt: string;
  endedAt?: string;
  currentStepIndex: number;
  steps: RecipeRunStepState[];
}

export interface RecipeRunsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  runs: RecipeRunRecord[];
}

const defaultRecipeRunsState = (): RecipeRunsState => ({
  schemaVersion: '0.1.0',
  id: 'recipe-runs',
  updatedAt: nowIso(),
  runs: [],
});

export const readRecipeRunsState = async (): Promise<RecipeRunsState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<RecipeRunsState>(
    commissioningPaths.recipeRunsFile,
    defaultRecipeRunsState()
  );
};

export const writeRecipeRunsState = async (
  state: RecipeRunsState
): Promise<RecipeRunsState> => {
  await ensureCommissioningStore();
  const normalized: RecipeRunsState = {
    ...state,
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'recipe-runs',
    updatedAt: nowIso(),
    runs: [...(state.runs ?? [])].slice(-200),
  };
  await writeJson(commissioningPaths.recipeRunsFile, normalized);
  return normalized;
};

export interface LabDraftRecord {
  id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface LabDraftsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  activeRecipeId?: string;
  drafts: LabDraftRecord[];
}

const defaultLabDraftsState = (): LabDraftsState => ({
  schemaVersion: '0.1.0',
  id: 'lab-drafts',
  updatedAt: nowIso(),
  activeRecipeId: undefined,
  drafts: [],
});

const normalizeLabDraftRecord = (input: LabDraftRecord): LabDraftRecord => ({
  ...input,
  id: String(input.id),
  name: input.name ? String(input.name) : undefined,
  created_at: input.created_at ? String(input.created_at) : undefined,
  updated_at: input.updated_at ? String(input.updated_at) : nowIso(),
});

export const readLabDraftsState = async (): Promise<LabDraftsState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<LabDraftsState>(
    commissioningPaths.labDraftsFile,
    defaultLabDraftsState()
  );
  const drafts = Array.isArray(state.drafts)
    ? state.drafts
        .filter((entry) => entry && typeof entry.id === 'string' && entry.id.trim().length > 0)
        .map((entry) => normalizeLabDraftRecord(entry))
    : [];
  return {
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'lab-drafts',
    updatedAt: state.updatedAt ?? nowIso(),
    activeRecipeId:
      state.activeRecipeId && String(state.activeRecipeId).trim()
        ? String(state.activeRecipeId).trim()
        : undefined,
    drafts,
  };
};

export const writeLabDraftsState = async (
  state: LabDraftsState
): Promise<LabDraftsState> => {
  await ensureCommissioningStore();
  const normalized: LabDraftsState = {
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'lab-drafts',
    updatedAt: nowIso(),
    activeRecipeId:
      state.activeRecipeId && String(state.activeRecipeId).trim()
        ? String(state.activeRecipeId).trim()
        : undefined,
    drafts: [...(state.drafts ?? [])]
      .filter((entry) => entry && typeof entry.id === 'string' && entry.id.trim().length > 0)
      .map((entry) => normalizeLabDraftRecord(entry))
      .slice(-500),
  };
  await writeJson(commissioningPaths.labDraftsFile, normalized);
  return normalized;
};

export const upsertLabDraft = async (
  draft: LabDraftRecord
): Promise<LabDraftsState> => {
  await ensureCommissioningStore();
  const state = await readLabDraftsState();
  const normalizedDraft = normalizeLabDraftRecord(draft);
  const nextDrafts = state.drafts.filter((entry) => entry.id !== normalizedDraft.id);
  nextDrafts.push(normalizedDraft);
  nextDrafts.sort((a, b) => {
    const aUpdated = String(a.updated_at ?? '');
    const bUpdated = String(b.updated_at ?? '');
    return bUpdated.localeCompare(aUpdated);
  });
  return writeLabDraftsState({
    ...state,
    activeRecipeId: normalizedDraft.id,
    drafts: nextDrafts,
  });
};

export const deleteLabDraft = async (recipeId: string): Promise<LabDraftsState> => {
  await ensureCommissioningStore();
  const state = await readLabDraftsState();
  const nextDrafts = state.drafts.filter((entry) => entry.id !== recipeId);
  const nextActive =
    state.activeRecipeId === recipeId ? nextDrafts[0]?.id : state.activeRecipeId;
  return writeLabDraftsState({
    ...state,
    activeRecipeId: nextActive,
    drafts: nextDrafts,
  });
};

export const setActiveLabDraftId = async (
  recipeId?: string
): Promise<LabDraftsState> => {
  await ensureCommissioningStore();
  const state = await readLabDraftsState();
  const nextActive =
    recipeId && state.drafts.some((entry) => entry.id === recipeId)
      ? recipeId
      : undefined;
  return writeLabDraftsState({
    ...state,
    activeRecipeId: nextActive,
  });
};

export type LabHandoffAuditStatus = 'sent' | 'success' | 'failed' | 'blocked';

export interface LabHandoffAuditEntry {
  id: string;
  timestamp: string;
  status: LabHandoffAuditStatus;
  recipeId?: string;
  recipeName?: string;
  importedRecipeId?: string;
  importedFormat?: string;
  osBaseUrl?: string;
  dryRunOk?: boolean;
  warningCount?: number;
  errorCount?: number;
  message?: string;
  source?: string;
}

export interface LabHandoffAuditState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  entries: LabHandoffAuditEntry[];
}

const defaultLabHandoffAuditState = (): LabHandoffAuditState => ({
  schemaVersion: '0.1.0',
  id: 'lab-handoff-audit',
  updatedAt: nowIso(),
  entries: [],
});

export const readLabHandoffAuditState = async (): Promise<LabHandoffAuditState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<LabHandoffAuditState>(
    commissioningPaths.labHandoffAuditFile,
    defaultLabHandoffAuditState()
  );
};

export const writeLabHandoffAuditState = async (
  state: LabHandoffAuditState
): Promise<LabHandoffAuditState> => {
  await ensureCommissioningStore();
  const normalized: LabHandoffAuditState = {
    schemaVersion: state.schemaVersion ?? '0.1.0',
    id: state.id ?? 'lab-handoff-audit',
    updatedAt: nowIso(),
    entries: [...(state.entries ?? [])].slice(-1000),
  };
  await writeJson(commissioningPaths.labHandoffAuditFile, normalized);
  return normalized;
};

export const appendLabHandoffAuditEntry = async (
  entry: Omit<LabHandoffAuditEntry, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  }
): Promise<LabHandoffAuditState> => {
  await ensureCommissioningStore();
  const state = await readLabHandoffAuditState();
  const record: LabHandoffAuditEntry = {
    id: entry.id ?? `lab-handoff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? nowIso(),
    status: entry.status,
    recipeId: entry.recipeId,
    recipeName: entry.recipeName,
    importedRecipeId: entry.importedRecipeId,
    importedFormat: entry.importedFormat,
    osBaseUrl: entry.osBaseUrl,
    dryRunOk: entry.dryRunOk,
    warningCount: entry.warningCount,
    errorCount: entry.errorCount,
    message: entry.message,
    source: entry.source,
  };
  return writeLabHandoffAuditState({
    ...state,
    entries: [record, ...(state.entries ?? [])],
  });
};

export const writeRawRecipeFile = async (
  fileName: string,
  content: string
): Promise<string> => {
  await ensureCommissioningStore();
  const fullPath = path.join(commissioningPaths.recipesDir, fileName);
  await fs.writeFile(fullPath, content, 'utf8');
  return fullPath;
};
