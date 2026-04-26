const FLOW_MIRROR_SITE_ID = "site-denver-rino";

const nowIso = (): string => new Date().toISOString();

const daysAgo = (days: number): string => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const buildProductArt = (params: {
  title: string;
  subtitle: string;
  accentStart: string;
  accentEnd: string;
  bgStart: string;
  bgEnd: string;
}): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${params.title}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${params.bgStart}" />
          <stop offset="100%" stop-color="${params.bgEnd}" />
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${params.accentStart}" />
          <stop offset="100%" stop-color="${params.accentEnd}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" rx="48" />
      <circle cx="240" cy="160" r="220" fill="url(#accent)" opacity="0.28" />
      <circle cx="1020" cy="760" r="260" fill="url(#accent)" opacity="0.18" />
      <path d="M0 680 C240 560 360 820 620 700 S980 520 1200 650 L1200 900 L0 900 Z" fill="url(#accent)" opacity="0.20" />
      <rect x="88" y="88" width="1024" height="724" rx="32" fill="rgba(9,15,14,0.42)" stroke="rgba(255,255,255,0.16)" />
      <text x="120" y="650" font-family="Georgia, serif" font-size="92" fill="#F7FFF8" font-weight="700">${params.title}</text>
      <text x="120" y="728" font-family="Arial, sans-serif" font-size="34" fill="rgba(247,255,248,0.78)">${params.subtitle}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export interface FlowProductImageVariants {
  thumbnailUrl?: string;
  cardImageUrl?: string;
  fullImageUrl?: string;
}

export interface FlowCatalogProductAsset {
  assetId: string;
  altText?: string;
  images: FlowProductImageVariants;
  createdAt: string;
  updatedAt: string;
}

export interface FlowCatalogProduct {
  schemaVersion: string;
  id: string;
  productId: string;
  productCode?: string;
  name: string;
  beverageClass: "beer" | "cider" | "wine" | "other";
  skuIds: string[];
  defaultSkuId?: string;
  currentAssetId?: string;
  currentLabelVersionId?: string;
  assets: FlowCatalogProductAsset[];
  createdAt: string;
  updatedAt: string;
}

export type FlowTapAssignmentStatus = "active" | "paused" | "offline_only" | "disabled";

export interface FlowTapAssignment {
  schemaVersion: string;
  id: string;
  tapAssignmentId: string;
  siteId: string;
  tapId: string;
  productId: string;
  productCode?: string;
  productName?: string;
  skuId: string;
  packageLotId?: string;
  packageLotCode?: string;
  assetId?: string;
  assetCode?: string;
  labelVersionId?: string;
  beverageClass?: string;
  style?: string;
  abv?: number;
  tastingNotes?: string;
  imageAssetId?: string;
  imageUrl?: string;
  pourSizesOz?: number[];
  status: FlowTapAssignmentStatus;
  dispenseTargetId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const createdAt = daysAgo(120);
const updatedAt = nowIso();

const hopCircuitImage = buildProductArt({
  title: "Hop Circuit",
  subtitle: "West Coast IPA / citrus resin",
  accentStart: "#22C55E",
  accentEnd: "#84CC16",
  bgStart: "#08120F",
  bgEnd: "#103322",
});

const riverbankImage = buildProductArt({
  title: "Riverbank",
  subtitle: "German pils / crisp mineral snap",
  accentStart: "#7DD3FC",
  accentEnd: "#22C55E",
  bgStart: "#061219",
  bgEnd: "#103222",
});

const emberImage = buildProductArt({
  title: "Ember Stout",
  subtitle: "Oatmeal stout / cocoa roast",
  accentStart: "#FB923C",
  accentEnd: "#F59E0B",
  bgStart: "#180E09",
  bgEnd: "#2A1610",
});

const citrusImage = buildProductArt({
  title: "Citrus Session",
  subtitle: "Session ale / bright lemon peel",
  accentStart: "#FACC15",
  accentEnd: "#22C55E",
  bgStart: "#0D1407",
  bgEnd: "#1E3A18",
});

const rotatorImage = buildProductArt({
  title: "Rotator Sour",
  subtitle: "Mixed culture / tart cherry",
  accentStart: "#F472B6",
  accentEnd: "#FB7185",
  bgStart: "#160A14",
  bgEnd: "#2C1023",
});

export const flowCatalogProducts: FlowCatalogProduct[] = [
  {
    schemaVersion: "1.0.0",
    id: "flow-product-hop-circuit",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    name: "Hop Circuit IPA",
    beverageClass: "beer",
    skuIds: ["HF-HOP-CIRCUIT-KEG15"],
    defaultSkuId: "HF-HOP-CIRCUIT-KEG15",
    currentAssetId: "flow-asset-hop-circuit",
    currentLabelVersionId: "label-hop-circuit-v3",
    assets: [
      {
        assetId: "flow-asset-hop-circuit",
        altText: "Hop Circuit IPA hero art",
        images: {
          thumbnailUrl: hopCircuitImage,
          cardImageUrl: hopCircuitImage,
          fullImageUrl: hopCircuitImage,
        },
        createdAt,
        updatedAt,
      },
    ],
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-product-riverbank",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402",
    productCode: "HF-RIVERBANK",
    name: "Riverbank Pils",
    beverageClass: "beer",
    skuIds: ["HF-RIVERBANK-KEG15"],
    defaultSkuId: "HF-RIVERBANK-KEG15",
    currentAssetId: "flow-asset-riverbank",
    currentLabelVersionId: "label-riverbank-v2",
    assets: [
      {
        assetId: "flow-asset-riverbank",
        altText: "Riverbank Pils hero art",
        images: {
          thumbnailUrl: riverbankImage,
          cardImageUrl: riverbankImage,
          fullImageUrl: riverbankImage,
        },
        createdAt,
        updatedAt,
      },
    ],
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-product-ember",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f403",
    productCode: "HF-EMBER-STOUT",
    name: "Ember Stout",
    beverageClass: "beer",
    skuIds: ["HF-EMBER-STOUT-KEG15"],
    defaultSkuId: "HF-EMBER-STOUT-KEG15",
    currentAssetId: "flow-asset-ember",
    currentLabelVersionId: "label-ember-v4",
    assets: [
      {
        assetId: "flow-asset-ember",
        altText: "Ember Stout hero art",
        images: {
          thumbnailUrl: emberImage,
          cardImageUrl: emberImage,
          fullImageUrl: emberImage,
        },
        createdAt,
        updatedAt,
      },
    ],
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-product-citrus",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    name: "Citrus Session",
    beverageClass: "beer",
    skuIds: ["HF-CITRUS-SESSION-KEG10"],
    defaultSkuId: "HF-CITRUS-SESSION-KEG10",
    currentAssetId: "flow-asset-citrus",
    currentLabelVersionId: "label-citrus-v5",
    assets: [
      {
        assetId: "flow-asset-citrus",
        altText: "Citrus Session hero art",
        images: {
          thumbnailUrl: citrusImage,
          cardImageUrl: citrusImage,
          fullImageUrl: citrusImage,
        },
        createdAt,
        updatedAt,
      },
    ],
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-product-rotator",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f405",
    productCode: "HF-ROTATOR-SOUR",
    name: "Rotator Sour",
    beverageClass: "beer",
    skuIds: ["HF-ROTATOR-SOUR-KEG10"],
    defaultSkuId: "HF-ROTATOR-SOUR-KEG10",
    currentAssetId: "flow-asset-rotator",
    currentLabelVersionId: "label-rotator-v1",
    assets: [
      {
        assetId: "flow-asset-rotator",
        altText: "Rotator Sour hero art",
        images: {
          thumbnailUrl: rotatorImage,
          cardImageUrl: rotatorImage,
          fullImageUrl: rotatorImage,
        },
        createdAt,
        updatedAt,
      },
    ],
    createdAt,
    updatedAt,
  },
];

export const flowTapAssignments: FlowTapAssignment[] = [
  {
    schemaVersion: "1.0.0",
    id: "flow-tap-assignment-01",
    tapAssignmentId: "flow-tap-assignment-01",
    siteId: FLOW_MIRROR_SITE_ID,
    tapId: "tap-01",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f401",
    productCode: "HF-HOP-CIRCUIT",
    productName: "Hop Circuit IPA",
    skuId: "HF-HOP-CIRCUIT-KEG15",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f201",
    packageLotCode: "HF-HOP-CIRCUIT-KEG15-B21-P03",
    assetId: "asset-keg-ipa-8804",
    assetCode: "KEG-RINO-8804",
    labelVersionId: "label-hop-circuit-v3",
    beverageClass: "beer",
    style: "West Coast IPA",
    abv: 6.7,
    tastingNotes: "Pine resin, grapefruit zest, dry finish.",
    imageAssetId: "flow-asset-hop-circuit",
    imageUrl: hopCircuitImage,
    pourSizesOz: [6, 8, 12, 22],
    status: "active",
    dispenseTargetId: "dispense-node-tap-01",
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-tap-assignment-02",
    tapAssignmentId: "flow-tap-assignment-02",
    siteId: FLOW_MIRROR_SITE_ID,
    tapId: "tap-02",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f402",
    productCode: "HF-RIVERBANK",
    productName: "Riverbank Pils",
    skuId: "HF-RIVERBANK-KEG15",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f202",
    packageLotCode: "HF-RIVERBANK-KEG15-B17-P04",
    assetId: "asset-keg-pils-4471",
    assetCode: "KEG-RINO-4471",
    labelVersionId: "label-riverbank-v2",
    beverageClass: "beer",
    style: "German Pilsner",
    abv: 5.1,
    tastingNotes: "Cracker malt, herbal hop snap, clean bitterness.",
    imageAssetId: "flow-asset-riverbank",
    imageUrl: riverbankImage,
    pourSizesOz: [6, 8, 12, 22],
    status: "active",
    dispenseTargetId: "dispense-node-tap-02",
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-tap-assignment-03",
    tapAssignmentId: "flow-tap-assignment-03",
    siteId: FLOW_MIRROR_SITE_ID,
    tapId: "tap-03",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f403",
    productCode: "HF-EMBER-STOUT",
    productName: "Ember Stout",
    skuId: "HF-EMBER-STOUT-KEG15",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f203",
    packageLotCode: "HF-EMBER-STOUT-KEG15-B09-P02",
    assetId: "asset-keg-stout-2210",
    assetCode: "KEG-RINO-2210",
    labelVersionId: "label-ember-v4",
    beverageClass: "beer",
    style: "Oatmeal Stout",
    abv: 6.2,
    tastingNotes: "Dark chocolate, espresso, toasted oat.",
    imageAssetId: "flow-asset-ember",
    imageUrl: emberImage,
    pourSizesOz: [6, 8, 12],
    status: "paused",
    dispenseTargetId: "dispense-node-tap-03",
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-tap-assignment-04",
    tapAssignmentId: "flow-tap-assignment-04",
    siteId: FLOW_MIRROR_SITE_ID,
    tapId: "tap-04",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f404",
    productCode: "HF-CITRUS-SESSION",
    productName: "Citrus Session",
    skuId: "HF-CITRUS-SESSION-KEG10",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f204",
    packageLotCode: "HF-CITRUS-SESSION-KEG10-B13-P06",
    assetId: "asset-keg-citrus-9920",
    assetCode: "KEG-RINO-9920",
    labelVersionId: "label-citrus-v5",
    beverageClass: "beer",
    style: "Session Ale",
    abv: 4.4,
    tastingNotes: "Lemon peel, floral hops, bright finish.",
    imageAssetId: "flow-asset-citrus",
    imageUrl: citrusImage,
    pourSizesOz: [6, 8, 12, 22],
    status: "active",
    dispenseTargetId: "dispense-node-tap-04",
    createdAt,
    updatedAt,
  },
  {
    schemaVersion: "1.0.0",
    id: "flow-tap-assignment-05",
    tapAssignmentId: "flow-tap-assignment-05",
    siteId: FLOW_MIRROR_SITE_ID,
    tapId: "tap-05",
    productId: "6c0a7f78-6f6e-4c74-93d2-2e31e2a1f405",
    productCode: "HF-ROTATOR-SOUR",
    productName: "Rotator Sour",
    skuId: "HF-ROTATOR-SOUR-KEG10",
    packageLotId: "8b514d50-f613-4e25-abd3-410587f4f205",
    packageLotCode: "HF-ROTATOR-SOUR-KEG10-B06-P01",
    assetId: "asset-keg-rotator-1455",
    assetCode: "KEG-RINO-1455",
    labelVersionId: "label-rotator-v1",
    beverageClass: "beer",
    style: "Mixed Culture Sour",
    abv: 5.8,
    tastingNotes: "Tart cherry, light funk, dry finish.",
    imageAssetId: "flow-asset-rotator",
    imageUrl: rotatorImage,
    pourSizesOz: [6, 8, 12],
    status: "disabled",
    dispenseTargetId: "dispense-node-tap-05",
    createdAt,
    updatedAt,
  },
];

export const getFlowProductById = (productId?: string): FlowCatalogProduct | undefined =>
  flowCatalogProducts.find((product) => product.productId === productId);

export const getFlowTapAssignmentById = (tapAssignmentId?: string): FlowTapAssignment | undefined =>
  flowTapAssignments.find((assignment) => assignment.tapAssignmentId === tapAssignmentId);

export const getFlowTapAssignmentForTap = (tapId?: string): FlowTapAssignment | undefined =>
  flowTapAssignments.find((assignment) => assignment.tapId === tapId);

export const getFlowProductImageUrl = (productId?: string, assetId?: string): string | undefined => {
  const product = getFlowProductById(productId);
  if (!product) {
    return undefined;
  }

  const preferredAsset =
    product.assets.find((entry) => entry.assetId === assetId) ??
    product.assets.find((entry) => entry.assetId === product.currentAssetId) ??
    product.assets[0];

  return preferredAsset?.images.cardImageUrl ?? preferredAsset?.images.fullImageUrl ?? preferredAsset?.images.thumbnailUrl;
};
