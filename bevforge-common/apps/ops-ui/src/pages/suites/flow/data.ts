import {
  type FlowCatalogProduct,
  type FlowTapAssignment,
  flowCatalogProducts,
  flowTapAssignments,
  getFlowProductById,
  getFlowProductImageUrl,
  getFlowTapAssignmentById,
  getFlowTapAssignmentForTap,
} from "@/features/flow/catalog-mirror";

export interface FlowTap {
  schemaVersion: string;
  id: string;
  siteId: string;
  name: string;
  displayOrder?: number;
  status: "online" | "offline" | "maintenance" | "disabled";
  meterType: "hall_effect" | "pulse_meter" | "none" | "other";
  temperatureProbeId?: string;
  lineTempC?: number;
  flowRateOzPerMin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowKegAssignment {
  schemaVersion: string;
  id: string;
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  lotId?: string;
  labelVersionId?: string;
  uom: string;
  startQty: number;
  remainingQty: number;
  status: "active" | "empty" | "removed" | "error";
  assignedAt: string;
  endedAt?: string;
  updatedAt: string;
}

export interface FlowPourEvent {
  schemaVersion: string;
  eventId: string;
  siteId: string;
  tapId: string;
  tapAssignmentId?: string;
  assignmentId?: string;
  kegAssetId?: string;
  assetId?: string;
  assetCode?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  labelVersionId?: string;
  volume: number;
  uom: string;
  durationMs?: number;
  sourceMode: "bartender" | "self_serve" | "test" | "maintenance";
  sessionId?: string;
  actorId?: string;
  occurredAt: string;
}

export interface FlowSession {
  schemaVersion: string;
  id: string;
  siteId: string;
  mode: "self_serve" | "bartender" | "test";
  status: "active" | "paused" | "closed" | "blocked";
  customerToken?: string;
  actorId?: string;
  limitQty: number;
  consumedQty: number;
  uom: string;
  allowedTapIds?: string[];
  startedAt: string;
  endedAt?: string;
  updatedAt: string;
}

export interface FlowMenuItem {
  schemaVersion: string;
  id: string;
  siteId: string;
  tapAssignmentId?: string;
  tapId?: string;
  productId?: string;
  productCode?: string;
  skuId: string;
  batchId?: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  labelVersionId?: string;
  name: string;
  style?: string;
  abv?: number;
  ibu?: number;
  servingTempC?: number;
  tastingNotes?: string;
  status: "on_tap" | "coming_soon" | "out_of_stock" | "hidden";
  story?: string;
  imageUrl?: string;
  imageAssetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowOsDepletionStatus {
  eventId: string;
  status: "accepted" | "pending" | "rejected";
  osLedgerRef?: string;
  acceptedAt?: string;
  reason?: string;
}

export interface FlowTapDiagnostics {
  tempC: number;
  co2Vol: number;
  co2Psi: number;
  humidityPct?: number;
  updatedAt: string;
}

const isoFromOffset = (milliseconds: number): string =>
  new Date(Date.now() - milliseconds).toISOString();

const minutesAgo = (minutes: number): string => isoFromOffset(minutes * 60_000);
const hoursAgo = (hours: number): string => minutesAgo(hours * 60);
const daysAgo = (days: number): string => hoursAgo(days * 24);

export const FLOW_PRIMARY_SITE_ID = "site-denver-rino";

export {
  flowCatalogProducts,
  flowTapAssignments,
  getFlowProductById,
  getFlowProductImageUrl,
  getFlowTapAssignmentById,
  getFlowTapAssignmentForTap,
};
export type { FlowCatalogProduct, FlowTapAssignment };

export const flowTaps: FlowTap[] = [
  {
    schemaVersion: "0.1.0",
    id: "tap-01",
    siteId: FLOW_PRIMARY_SITE_ID,
    name: "Tap 01 · Hop Circuit IPA",
    displayOrder: 1,
    status: "online",
    meterType: "hall_effect",
    temperatureProbeId: "probe-01",
    lineTempC: 3.2,
    flowRateOzPerMin: 52,
    notes: "Main IPA handle near expo line.",
    createdAt: daysAgo(220),
    updatedAt: minutesAgo(3),
  },
  {
    schemaVersion: "0.1.0",
    id: "tap-02",
    siteId: FLOW_PRIMARY_SITE_ID,
    name: "Tap 02 · Riverbank Pils",
    displayOrder: 2,
    status: "online",
    meterType: "pulse_meter",
    temperatureProbeId: "probe-02",
    lineTempC: 3.4,
    flowRateOzPerMin: 47,
    notes: "High volume lager line.",
    createdAt: daysAgo(220),
    updatedAt: minutesAgo(8),
  },
  {
    schemaVersion: "0.1.0",
    id: "tap-03",
    siteId: FLOW_PRIMARY_SITE_ID,
    name: "Tap 03 · Ember Stout",
    displayOrder: 3,
    status: "maintenance",
    meterType: "hall_effect",
    temperatureProbeId: "probe-03",
    lineTempC: 5.1,
    flowRateOzPerMin: 0,
    notes: "Scheduled line clean and coupler swap.",
    createdAt: daysAgo(220),
    updatedAt: minutesAgo(26),
  },
  {
    schemaVersion: "0.1.0",
    id: "tap-04",
    siteId: FLOW_PRIMARY_SITE_ID,
    name: "Tap 04 · Citrus Session",
    displayOrder: 4,
    status: "online",
    meterType: "pulse_meter",
    temperatureProbeId: "probe-04",
    lineTempC: 2.8,
    flowRateOzPerMin: 41,
    notes: "Self-serve station A.",
    createdAt: daysAgo(180),
    updatedAt: minutesAgo(2),
  },
  {
    schemaVersion: "0.1.0",
    id: "tap-05",
    siteId: FLOW_PRIMARY_SITE_ID,
    name: "Tap 05 · Rotator",
    displayOrder: 5,
    status: "offline",
    meterType: "none",
    notes: "Offline pending next keg assignment.",
    createdAt: daysAgo(140),
    updatedAt: hoursAgo(3),
  },
];

export const flowKegAssignments: FlowKegAssignment[] = [
  {
    schemaVersion: "0.1.0",
    id: "assign-1001",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-01",
    tapAssignmentId: "flow-tap-assignment-01",
    kegAssetId: "keg-ipa-8804",
    assetId: "asset-keg-ipa-8804",
    assetCode: "KEG-RINO-8804",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    skuId: "sku-hop-circuit-ipa",
    batchId: "batch-ipa-2026-021",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f201",
    packageLotCode: "HF-HOP-CIRCUIT-KEG15-B21-P03",
    lotId: "lot-ipa-2026-021-a",
    labelVersionId: "label-hop-circuit-v3",
    uom: "oz",
    startQty: 1984,
    remainingQty: 742,
    status: "active",
    assignedAt: daysAgo(5),
    updatedAt: minutesAgo(4),
  },
  {
    schemaVersion: "0.1.0",
    id: "assign-1002",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-02",
    tapAssignmentId: "flow-tap-assignment-02",
    kegAssetId: "keg-pils-4471",
    assetId: "asset-keg-pils-4471",
    assetCode: "KEG-RINO-4471",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402",
    productCode: "HF-RIVERBANK",
    skuId: "sku-riverbank-pils",
    batchId: "batch-pils-2026-017",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f202",
    packageLotCode: "HF-RIVERBANK-KEG15-B17-P04",
    lotId: "lot-pils-2026-017-b",
    labelVersionId: "label-riverbank-v2",
    uom: "oz",
    startQty: 1984,
    remainingQty: 318,
    status: "active",
    assignedAt: daysAgo(4),
    updatedAt: minutesAgo(10),
  },
  {
    schemaVersion: "0.1.0",
    id: "assign-1003",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-03",
    tapAssignmentId: "flow-tap-assignment-03",
    kegAssetId: "keg-stout-2210",
    assetId: "asset-keg-stout-2210",
    assetCode: "KEG-RINO-2210",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f403",
    productCode: "HF-EMBER-STOUT",
    skuId: "sku-ember-stout",
    batchId: "batch-stout-2026-009",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f203",
    packageLotCode: "HF-EMBER-STOUT-KEG15-B09-P02",
    lotId: "lot-stout-2026-009-a",
    labelVersionId: "label-ember-v4",
    uom: "oz",
    startQty: 1984,
    remainingQty: 0,
    status: "empty",
    assignedAt: daysAgo(8),
    endedAt: hoursAgo(7),
    updatedAt: hoursAgo(7),
  },
  {
    schemaVersion: "0.1.0",
    id: "assign-1004",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-04",
    tapAssignmentId: "flow-tap-assignment-04",
    kegAssetId: "keg-citrus-9920",
    assetId: "asset-keg-citrus-9920",
    assetCode: "KEG-RINO-9920",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    skuId: "sku-citrus-session",
    batchId: "batch-session-2026-013",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f204",
    packageLotCode: "HF-CITRUS-SESSION-KEG10-B13-P06",
    lotId: "lot-session-2026-013-c",
    labelVersionId: "label-citrus-v5",
    uom: "oz",
    startQty: 640,
    remainingQty: 286,
    status: "active",
    assignedAt: daysAgo(2),
    updatedAt: minutesAgo(2),
  },
  {
    schemaVersion: "0.1.0",
    id: "assign-1005",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-05",
    tapAssignmentId: "flow-tap-assignment-05",
    kegAssetId: "keg-rotator-1455",
    assetId: "asset-keg-rotator-1455",
    assetCode: "KEG-RINO-1455",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f405",
    productCode: "HF-ROTATOR-SOUR",
    skuId: "sku-rotator-sour",
    batchId: "batch-sour-2026-006",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f205",
    packageLotCode: "HF-ROTATOR-SOUR-KEG10-B06-P01",
    lotId: "lot-sour-2026-006-a",
    labelVersionId: "label-rotator-v1",
    uom: "oz",
    startQty: 640,
    remainingQty: 0,
    status: "removed",
    assignedAt: daysAgo(13),
    endedAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

export const flowPourEvents: FlowPourEvent[] = [
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9001",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-01",
    tapAssignmentId: "flow-tap-assignment-01",
    assignmentId: "assign-1001",
    kegAssetId: "keg-ipa-8804",
    assetId: "asset-keg-ipa-8804",
    assetCode: "KEG-RINO-8804",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    skuId: "sku-hop-circuit-ipa",
    batchId: "batch-ipa-2026-021",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f201",
    packageLotCode: "HF-HOP-CIRCUIT-KEG15-B21-P03",
    labelVersionId: "label-hop-circuit-v3",
    volume: 16,
    uom: "oz",
    durationMs: 8400,
    sourceMode: "bartender",
    actorId: "employee-ops-03",
    occurredAt: minutesAgo(6),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9002",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-04",
    tapAssignmentId: "flow-tap-assignment-04",
    assignmentId: "assign-1004",
    kegAssetId: "keg-citrus-9920",
    assetId: "asset-keg-citrus-9920",
    assetCode: "KEG-RINO-9920",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    skuId: "sku-citrus-session",
    batchId: "batch-session-2026-013",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f204",
    packageLotCode: "HF-CITRUS-SESSION-KEG10-B13-P06",
    labelVersionId: "label-citrus-v5",
    volume: 10,
    uom: "oz",
    durationMs: 6100,
    sourceMode: "self_serve",
    sessionId: "session-selfserve-220",
    actorId: "guest-token-77",
    occurredAt: minutesAgo(9),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9003",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-02",
    tapAssignmentId: "flow-tap-assignment-02",
    assignmentId: "assign-1002",
    kegAssetId: "keg-pils-4471",
    assetId: "asset-keg-pils-4471",
    assetCode: "KEG-RINO-4471",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402",
    productCode: "HF-RIVERBANK",
    skuId: "sku-riverbank-pils",
    batchId: "batch-pils-2026-017",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f202",
    packageLotCode: "HF-RIVERBANK-KEG15-B17-P04",
    labelVersionId: "label-riverbank-v2",
    volume: 14,
    uom: "oz",
    durationMs: 7300,
    sourceMode: "bartender",
    actorId: "employee-ops-11",
    occurredAt: minutesAgo(13),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9004",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-04",
    tapAssignmentId: "flow-tap-assignment-04",
    assignmentId: "assign-1004",
    kegAssetId: "keg-citrus-9920",
    assetId: "asset-keg-citrus-9920",
    assetCode: "KEG-RINO-9920",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    skuId: "sku-citrus-session",
    batchId: "batch-session-2026-013",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f204",
    packageLotCode: "HF-CITRUS-SESSION-KEG10-B13-P06",
    labelVersionId: "label-citrus-v5",
    volume: 8,
    uom: "oz",
    durationMs: 4800,
    sourceMode: "self_serve",
    sessionId: "session-selfserve-220",
    actorId: "guest-token-77",
    occurredAt: minutesAgo(18),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9005",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-01",
    tapAssignmentId: "flow-tap-assignment-01",
    assignmentId: "assign-1001",
    kegAssetId: "keg-ipa-8804",
    assetId: "asset-keg-ipa-8804",
    assetCode: "KEG-RINO-8804",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    skuId: "sku-hop-circuit-ipa",
    batchId: "batch-ipa-2026-021",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f201",
    packageLotCode: "HF-HOP-CIRCUIT-KEG15-B21-P03",
    labelVersionId: "label-hop-circuit-v3",
    volume: 12,
    uom: "oz",
    durationMs: 6500,
    sourceMode: "self_serve",
    sessionId: "session-selfserve-220",
    actorId: "guest-token-77",
    occurredAt: minutesAgo(21),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9006",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-02",
    tapAssignmentId: "flow-tap-assignment-02",
    assignmentId: "assign-1002",
    kegAssetId: "keg-pils-4471",
    assetId: "asset-keg-pils-4471",
    assetCode: "KEG-RINO-4471",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402",
    productCode: "HF-RIVERBANK",
    skuId: "sku-riverbank-pils",
    batchId: "batch-pils-2026-017",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f202",
    packageLotCode: "HF-RIVERBANK-KEG15-B17-P04",
    labelVersionId: "label-riverbank-v2",
    volume: 5,
    uom: "oz",
    durationMs: 3100,
    sourceMode: "test",
    sessionId: "session-linecheck-16",
    actorId: "employee-ops-11",
    occurredAt: minutesAgo(39),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9007",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-03",
    tapAssignmentId: "flow-tap-assignment-03",
    assignmentId: "assign-1003",
    kegAssetId: "keg-stout-2210",
    assetId: "asset-keg-stout-2210",
    assetCode: "KEG-RINO-2210",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f403",
    productCode: "HF-EMBER-STOUT",
    skuId: "sku-ember-stout",
    batchId: "batch-stout-2026-009",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f203",
    packageLotCode: "HF-EMBER-STOUT-KEG15-B09-P02",
    labelVersionId: "label-ember-v4",
    volume: 6,
    uom: "oz",
    durationMs: 4400,
    sourceMode: "maintenance",
    actorId: "employee-ops-02",
    occurredAt: minutesAgo(72),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9008",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-01",
    tapAssignmentId: "flow-tap-assignment-01",
    assignmentId: "assign-1001",
    kegAssetId: "keg-ipa-8804",
    assetId: "asset-keg-ipa-8804",
    assetCode: "KEG-RINO-8804",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    skuId: "sku-hop-circuit-ipa",
    batchId: "batch-ipa-2026-021",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f201",
    packageLotCode: "HF-HOP-CIRCUIT-KEG15-B21-P03",
    labelVersionId: "label-hop-circuit-v3",
    volume: 16,
    uom: "oz",
    durationMs: 7900,
    sourceMode: "bartender",
    actorId: "employee-ops-03",
    occurredAt: hoursAgo(2),
  },
  {
    schemaVersion: "0.1.0",
    eventId: "pour-evt-9009",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapId: "tap-04",
    tapAssignmentId: "flow-tap-assignment-04",
    assignmentId: "assign-1004",
    kegAssetId: "keg-citrus-9920",
    assetId: "asset-keg-citrus-9920",
    assetCode: "KEG-RINO-9920",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    skuId: "sku-citrus-session",
    batchId: "batch-session-2026-013",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f204",
    packageLotCode: "HF-CITRUS-SESSION-KEG10-B13-P06",
    labelVersionId: "label-citrus-v5",
    volume: 12,
    uom: "oz",
    durationMs: 7100,
    sourceMode: "self_serve",
    sessionId: "session-selfserve-219",
    actorId: "guest-token-18",
    occurredAt: hoursAgo(4),
  },
];

export const flowSessions: FlowSession[] = [
  {
    schemaVersion: "0.1.0",
    id: "session-selfserve-220",
    siteId: FLOW_PRIMARY_SITE_ID,
    mode: "self_serve",
    status: "active",
    customerToken: "guest-token-77",
    limitQty: 48,
    consumedQty: 30,
    uom: "oz",
    allowedTapIds: ["tap-01", "tap-02", "tap-04"],
    startedAt: minutesAgo(44),
    updatedAt: minutesAgo(3),
  },
  {
    schemaVersion: "0.1.0",
    id: "session-selfserve-219",
    siteId: FLOW_PRIMARY_SITE_ID,
    mode: "self_serve",
    status: "paused",
    customerToken: "guest-token-18",
    limitQty: 64,
    consumedQty: 54,
    uom: "oz",
    allowedTapIds: ["tap-01", "tap-04"],
    startedAt: hoursAgo(5),
    updatedAt: hoursAgo(1),
  },
  {
    schemaVersion: "0.1.0",
    id: "session-bartender-101",
    siteId: FLOW_PRIMARY_SITE_ID,
    mode: "bartender",
    status: "active",
    actorId: "employee-ops-03",
    limitQty: 320,
    consumedQty: 118,
    uom: "oz",
    allowedTapIds: ["tap-01", "tap-02", "tap-04"],
    startedAt: hoursAgo(2),
    updatedAt: minutesAgo(4),
  },
  {
    schemaVersion: "0.1.0",
    id: "session-linecheck-16",
    siteId: FLOW_PRIMARY_SITE_ID,
    mode: "test",
    status: "closed",
    actorId: "employee-ops-11",
    limitQty: 12,
    consumedQty: 5,
    uom: "oz",
    allowedTapIds: ["tap-02"],
    startedAt: hoursAgo(2),
    endedAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
];

export const flowMenuItems: FlowMenuItem[] = [
  {
    schemaVersion: "0.1.0",
    id: "menu-01",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapAssignmentId: "flow-tap-assignment-01",
    tapId: "tap-01",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    skuId: "sku-hop-circuit-ipa",
    batchId: "batch-ipa-2026-021",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f201",
    packageLotCode: "HF-HOP-CIRCUIT-KEG15-B21-P03",
    assetId: "asset-keg-ipa-8804",
    assetCode: "KEG-RINO-8804",
    labelVersionId: "label-hop-circuit-v3",
    name: "Hop Circuit IPA",
    style: "West Coast IPA",
    abv: 6.7,
    ibu: 62,
    servingTempC: 4,
    tastingNotes: "Pine resin, grapefruit zest, dry finish.",
    status: "on_tap",
    story: "Brewed for bright bitterness and quick reset between pours.",
    imageUrl: getFlowProductImageUrl("6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401", "flow-asset-hop-circuit"),
    imageAssetId: "flow-asset-hop-circuit",
    createdAt: daysAgo(90),
    updatedAt: hoursAgo(1),
  },
  {
    schemaVersion: "0.1.0",
    id: "menu-02",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapAssignmentId: "flow-tap-assignment-02",
    tapId: "tap-02",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402",
    productCode: "HF-RIVERBANK",
    skuId: "sku-riverbank-pils",
    batchId: "batch-pils-2026-017",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f202",
    packageLotCode: "HF-RIVERBANK-KEG15-B17-P04",
    assetId: "asset-keg-pils-4471",
    assetCode: "KEG-RINO-4471",
    labelVersionId: "label-riverbank-v2",
    name: "Riverbank Pils",
    style: "German Pilsner",
    abv: 5.1,
    ibu: 34,
    servingTempC: 3,
    tastingNotes: "Cracker malt, herbal hop snap, clean bitterness.",
    status: "on_tap",
    story: "Cold conditioned for six weeks.",
    imageUrl: getFlowProductImageUrl("6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402", "flow-asset-riverbank"),
    imageAssetId: "flow-asset-riverbank",
    createdAt: daysAgo(90),
    updatedAt: hoursAgo(1),
  },
  {
    schemaVersion: "0.1.0",
    id: "menu-03",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapAssignmentId: "flow-tap-assignment-03",
    tapId: "tap-03",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f403",
    productCode: "HF-EMBER-STOUT",
    skuId: "sku-ember-stout",
    batchId: "batch-stout-2026-009",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f203",
    packageLotCode: "HF-EMBER-STOUT-KEG15-B09-P02",
    assetId: "asset-keg-stout-2210",
    assetCode: "KEG-RINO-2210",
    labelVersionId: "label-ember-v4",
    name: "Ember Stout",
    style: "Oatmeal Stout",
    abv: 6.2,
    ibu: 38,
    servingTempC: 6,
    tastingNotes: "Dark chocolate, espresso, toasted oat.",
    status: "coming_soon",
    story: "Returning after line maintenance and fresh keg mount.",
    imageUrl: getFlowProductImageUrl("6c0a7f78-6f6e-4c74-93d2-2e31e2a1f403", "flow-asset-ember"),
    imageAssetId: "flow-asset-ember",
    createdAt: daysAgo(120),
    updatedAt: hoursAgo(2),
  },
  {
    schemaVersion: "0.1.0",
    id: "menu-04",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapAssignmentId: "flow-tap-assignment-04",
    tapId: "tap-04",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    skuId: "sku-citrus-session",
    batchId: "batch-session-2026-013",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f204",
    packageLotCode: "HF-CITRUS-SESSION-KEG10-B13-P06",
    assetId: "asset-keg-citrus-9920",
    assetCode: "KEG-RINO-9920",
    labelVersionId: "label-citrus-v5",
    name: "Citrus Session",
    style: "Session Ale",
    abv: 4.4,
    ibu: 22,
    servingTempC: 3,
    tastingNotes: "Lemon peel, floral hops, bright finish.",
    status: "on_tap",
    story: "Self-serve favorite with light body and clean finish.",
    imageUrl: getFlowProductImageUrl("6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404", "flow-asset-citrus"),
    imageAssetId: "flow-asset-citrus",
    createdAt: daysAgo(65),
    updatedAt: minutesAgo(30),
  },
  {
    schemaVersion: "0.1.0",
    id: "menu-05",
    siteId: FLOW_PRIMARY_SITE_ID,
    tapAssignmentId: "flow-tap-assignment-05",
    tapId: "tap-05",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f405",
    productCode: "HF-ROTATOR-SOUR",
    skuId: "sku-rotator-sour",
    batchId: "batch-sour-2026-006",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f205",
    packageLotCode: "HF-ROTATOR-SOUR-KEG10-B06-P01",
    assetId: "asset-keg-rotator-1455",
    assetCode: "KEG-RINO-1455",
    labelVersionId: "label-rotator-v1",
    name: "Rotator Sour",
    style: "Mixed Culture Sour",
    abv: 5.8,
    ibu: 8,
    servingTempC: 5,
    tastingNotes: "Tart cherry, light funk, dry finish.",
    status: "out_of_stock",
    story: "Awaiting next canning split and keg transfer.",
    imageUrl: getFlowProductImageUrl("6c0a7f78-6f6e-4c74-93d2-2e31e2a1f405", "flow-asset-rotator"),
    imageAssetId: "flow-asset-rotator",
    createdAt: daysAgo(70),
    updatedAt: daysAgo(1),
  },
];

export const flowOsDepletionStatuses: FlowOsDepletionStatus[] = [
  {
    eventId: "pour-evt-9001",
    status: "accepted",
    osLedgerRef: "os-ledger-558001",
    acceptedAt: minutesAgo(4),
  },
  {
    eventId: "pour-evt-9002",
    status: "accepted",
    osLedgerRef: "os-ledger-558002",
    acceptedAt: minutesAgo(8),
  },
  {
    eventId: "pour-evt-9003",
    status: "accepted",
    osLedgerRef: "os-ledger-558003",
    acceptedAt: minutesAgo(11),
  },
  {
    eventId: "pour-evt-9004",
    status: "pending",
  },
  {
    eventId: "pour-evt-9005",
    status: "pending",
  },
  {
    eventId: "pour-evt-9006",
    status: "accepted",
    osLedgerRef: "os-ledger-558004",
    acceptedAt: minutesAgo(36),
  },
  {
    eventId: "pour-evt-9007",
    status: "rejected",
    reason: "Assignment ended before event commit window.",
  },
  {
    eventId: "pour-evt-9008",
    status: "accepted",
    osLedgerRef: "os-ledger-557943",
    acceptedAt: hoursAgo(2),
  },
  {
    eventId: "pour-evt-9009",
    status: "accepted",
    osLedgerRef: "os-ledger-557901",
    acceptedAt: hoursAgo(4),
  },
];

export const flowTapDiagnosticsById: Record<string, FlowTapDiagnostics> = {
  "tap-01": {
    tempC: 3.2,
    co2Vol: 2.45,
    co2Psi: 12.8,
    humidityPct: 44,
    updatedAt: minutesAgo(2),
  },
  "tap-02": {
    tempC: 3.4,
    co2Vol: 2.5,
    co2Psi: 13.2,
    humidityPct: 46,
    updatedAt: minutesAgo(5),
  },
  "tap-03": {
    tempC: 5.1,
    co2Vol: 2.2,
    co2Psi: 9.7,
    humidityPct: 51,
    updatedAt: minutesAgo(12),
  },
  "tap-04": {
    tempC: 2.8,
    co2Vol: 2.35,
    co2Psi: 11.9,
    humidityPct: 42,
    updatedAt: minutesAgo(3),
  },
  "tap-05": {
    tempC: 4.9,
    co2Vol: 2.1,
    co2Psi: 8.6,
    humidityPct: 49,
    updatedAt: hoursAgo(2),
  },
};

const flowTapNameMap = new Map(flowTaps.map((tap) => [tap.id, tap.name]));

const toMillis = (isoDate: string): number => {
  const parsed = new Date(isoDate).valueOf();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getTapDisplayName = (tapId: string): string => flowTapNameMap.get(tapId) ?? tapId;

export const getTapDiagnostics = (tapId: string): FlowTapDiagnostics => {
  return (
    flowTapDiagnosticsById[tapId] ?? {
      tempC: 0,
      co2Vol: 0,
      co2Psi: 0,
      updatedAt: new Date(0).toISOString(),
    }
  );
};

export const flowSiteIds = Array.from(new Set(flowTaps.map((tap) => tap.siteId)));

export const getAssignmentForTap = (tapId: string): FlowKegAssignment | undefined => {
  const activeAssignment = flowKegAssignments.find(
    (assignment) => assignment.tapId === tapId && assignment.status === "active"
  );
  if (activeAssignment) {
    return activeAssignment;
  }

  return [...flowKegAssignments]
    .filter((assignment) => assignment.tapId === tapId)
    .sort((left, right) => toMillis(right.updatedAt) - toMillis(left.updatedAt))[0];
};

export const getMenuItemByTapAssignmentId = (tapAssignmentId: string): FlowMenuItem | undefined =>
  flowMenuItems.find((item) => item.tapAssignmentId === tapAssignmentId);

export const getFlowEventLedgerStatus = (
  eventId: string
): FlowOsDepletionStatus["status"] | "pending" => {
  return flowOsDepletionStatuses.find((status) => status.eventId === eventId)?.status ?? "pending";
};

export const calculateRemainingPercent = (assignment: Pick<FlowKegAssignment, "startQty" | "remainingQty">): number => {
  if (assignment.startQty <= 0) {
    return 0;
  }

  const ratio = (assignment.remainingQty / assignment.startQty) * 100;
  return Math.max(0, Math.min(100, ratio));
};

export const formatFlowDateTime = (value?: string): string => {
  if (!value) {
    return "Not set";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "Not set";
  }
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatFlowQty = (value: number, uom: string): string => `${value.toFixed(1)} ${uom}`;

export interface FlowOverviewSnapshot {
  totalTaps: number;
  onlineTaps: number;
  activeAssignments: number;
  lowRemainingAssignments: number;
  emptyAssignments: number;
  activeSessions: number;
  onTapMenuItems: number;
  eventsLastHour: number;
  totalVolumeLastHour: number;
  averagePourVolume: number;
  osAcceptedEvents: number;
  osPendingEvents: number;
  osRejectedEvents: number;
}

export const getFlowOverviewSnapshot = (referenceDate = new Date()): FlowOverviewSnapshot => {
  const oneHourAgo = referenceDate.getTime() - 60 * 60 * 1_000;
  const eventsLastHour = flowPourEvents.filter((event) => toMillis(event.occurredAt) >= oneHourAgo);
  const activeAssignments = flowKegAssignments.filter((assignment) => assignment.status === "active");
  const lowRemainingAssignments = activeAssignments.filter(
    (assignment) => calculateRemainingPercent(assignment) <= 20
  );
  const totalVolumeLastHour = eventsLastHour.reduce((total, event) => total + event.volume, 0);
  const eventCount = eventsLastHour.length;

  const osAcceptedEvents = flowOsDepletionStatuses.filter((status) => status.status === "accepted").length;
  const osPendingEvents = flowOsDepletionStatuses.filter((status) => status.status === "pending").length;
  const osRejectedEvents = flowOsDepletionStatuses.filter((status) => status.status === "rejected").length;

  return {
    totalTaps: flowTaps.length,
    onlineTaps: flowTaps.filter((tap) => tap.status === "online").length,
    activeAssignments: activeAssignments.length,
    lowRemainingAssignments: lowRemainingAssignments.length,
    emptyAssignments: flowKegAssignments.filter((assignment) => assignment.status === "empty").length,
    activeSessions: flowSessions.filter((session) => session.status === "active").length,
    onTapMenuItems: flowMenuItems.filter((item) => item.status === "on_tap").length,
    eventsLastHour: eventCount,
    totalVolumeLastHour,
    averagePourVolume: eventCount > 0 ? totalVolumeLastHour / eventCount : 0,
    osAcceptedEvents,
    osPendingEvents,
    osRejectedEvents,
  };
};

export const getTapPourDistribution = (
  windowHours = 24,
  referenceDate = new Date()
): Array<{
  tapId: string;
  tapName: string;
  totalVolume: number;
  eventCount: number;
}> => {
  const threshold = referenceDate.getTime() - windowHours * 60 * 60 * 1_000;
  const byTap = new Map<string, { totalVolume: number; eventCount: number }>();

  flowPourEvents.forEach((event) => {
    const eventMillis = toMillis(event.occurredAt);
    if (eventMillis < threshold) {
      return;
    }

    const current = byTap.get(event.tapId) ?? { totalVolume: 0, eventCount: 0 };
    current.totalVolume += event.volume;
    current.eventCount += 1;
    byTap.set(event.tapId, current);
  });

  return [...byTap.entries()]
    .map(([tapId, metrics]) => ({
      tapId,
      tapName: getTapDisplayName(tapId),
      totalVolume: metrics.totalVolume,
      eventCount: metrics.eventCount,
    }))
    .sort((left, right) => right.totalVolume - left.totalVolume);
};

export const getRecentFlowEvents = (limit = 25): FlowPourEvent[] => {
  return [...flowPourEvents]
    .sort((left, right) => toMillis(right.occurredAt) - toMillis(left.occurredAt))
    .slice(0, limit);
};
