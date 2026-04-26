const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const toOptionalText = (value: unknown): string | undefined => {
  const text = toText(value).trim();
  return text.length > 0 ? text : undefined;
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

export const normalizeOsSiteId = (value: string | undefined): string => {
  const trimmed = (value ?? '').trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : 'main';
};

export const buildSiteSkuKey = (skuId: string, siteId: string | undefined): string =>
  `${skuId.trim()}|${normalizeOsSiteId(siteId)}`;

export interface OsInventoryCatalogItem {
  id: string;
  skuId: string;
  sku: string;
  siteId: string;
  name: string;
  category: string;
  unit: string;
  uom: string;
  onHandQty: number;
  allocatedQty: number;
  availableQty: number;
  reorderPointQty: number;
  defaultUnitPrice: number;
}

export interface OsProductCatalogRecord {
  productId: string;
  productCode: string;
  name: string;
  skuIds: string[];
  defaultSkuId?: string;
}

export interface OsPackageLotRecord {
  packageLotId: string;
  packageLotCode?: string;
  batchId?: string;
  batchCode?: string;
  skuId: string;
  siteId: string;
  packageType?: string;
  packageFormatCode?: string;
  assetId?: string;
  assetCode?: string;
  status?: string;
  totalUnits: number;
  allocatedUnits: number;
  shippedUnits: number;
  availableUnits: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OsSellableCatalogItem extends OsInventoryCatalogItem {
  productId?: string;
  productCode?: string;
  packageType?: string;
  packageFormatCode?: string;
  packageLots: OsPackageLotRecord[];
}

export const parseOsInventoryCatalog = (payload: unknown): OsInventoryCatalogItem[] => {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const items = isRecord(root) && Array.isArray(root.items) ? root.items : [];

  return items
    .filter(isRecord)
    .map((item) => {
      const id = toOptionalText(item.id);
      const skuId = toOptionalText(item.skuId ?? item.sku ?? item.id);
      const name = toOptionalText(item.name);
      if (!id || !skuId || !name) {
        return null;
      }

      const siteId = normalizeOsSiteId(toText(item.siteId, 'main'));
      const onHandQty = Math.max(0, toNumber(item.onHandQty ?? item.quantity_on_hand));
      const allocatedQty = Math.max(0, toNumber(item.allocatedQty ?? item.quantity_allocated));

      return {
        id,
        skuId,
        sku: toText(item.sku, skuId),
        siteId,
        name,
        category: toText(item.category, 'other'),
        unit: toText(item.unit ?? item.unit_of_measure, 'units') || 'units',
        uom: toText(item.unit ?? item.unit_of_measure, 'units') || 'units',
        onHandQty,
        allocatedQty,
        availableQty: Math.max(0, onHandQty - allocatedQty),
        reorderPointQty: Math.max(0, toNumber(item.reorderPointQty ?? item.reorder_point_qty ?? item.reorderPoint)),
        defaultUnitPrice: Math.max(0, toNumber(item.costPerUnit)),
      };
    })
    .filter((item): item is OsInventoryCatalogItem => item !== null);
};

export const parseOsProductCatalog = (payload: unknown): OsProductCatalogRecord[] => {
  const root = isRecord(payload) && 'data' in payload ? (payload as { data?: unknown }).data : payload;
  const products = Array.isArray(root) ? root : [];

  return products.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const item = entry;
    const productId = toOptionalText(item.productId);
    const productCode = toOptionalText(item.productCode);
    const name = toOptionalText(item.name ?? item.productName);
    const skuIds = Array.isArray(item.skuIds)
      ? item.skuIds.map((value) => toText(value).trim()).filter((value) => value.length > 0)
      : [];

    if (!productId || !productCode || !name || skuIds.length === 0) {
      return [];
    }

    return [{
      productId,
      productCode,
      name,
      skuIds,
      defaultSkuId: toOptionalText(item.defaultSkuId),
    }];
  });
};

export const parseOsPackageLots = (payload: unknown): OsPackageLotRecord[] => {
  const root = isRecord(payload) && 'data' in payload ? (payload as { data?: unknown }).data : payload;
  const lots = Array.isArray(root) ? root : [];

  return lots.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const item = entry;
    const packageLotId = toOptionalText(item.packageLotId ?? item.id);
    const skuId = toOptionalText(item.skuId ?? item.packageSkuId);
    if (!packageLotId || !skuId) {
      return [];
    }

    const totalUnits = Math.max(0, toNumber(item.totalUnits));
    const allocatedUnits = Math.max(0, toNumber(item.allocatedUnits));
    const shippedUnits = Math.max(0, toNumber(item.shippedUnits));

    return [{
      packageLotId,
      packageLotCode: toOptionalText(item.packageLotCode ?? item.lotCode),
      batchId: toOptionalText(item.batchId),
      batchCode: toOptionalText(item.batchCode),
      skuId,
      siteId: normalizeOsSiteId(toText(item.siteId, 'main')),
      packageType: toOptionalText(item.packageType),
      packageFormatCode: toOptionalText(item.packageFormatCode),
      assetId: toOptionalText(item.assetId ?? item.kegAssetId),
      assetCode: toOptionalText(item.assetCode),
      status: toOptionalText(item.status),
      totalUnits,
      allocatedUnits,
      shippedUnits,
      availableUnits: Math.max(0, totalUnits - allocatedUnits - shippedUnits),
      createdAt: toOptionalText(item.createdAt),
      updatedAt: toOptionalText(item.updatedAt),
    }];
  });
};

export const buildProductLookupBySku = (
  products: OsProductCatalogRecord[]
): Map<string, OsProductCatalogRecord> => {
  const lookup = new Map<string, OsProductCatalogRecord>();
  products.forEach((product) => {
    product.skuIds.forEach((skuId) => {
      if (!lookup.has(skuId)) {
        lookup.set(skuId, product);
      }
    });
  });
  return lookup;
};

export const groupPackageLotsBySkuSite = (
  lots: OsPackageLotRecord[]
): Map<string, OsPackageLotRecord[]> => {
  const lookup = new Map<string, OsPackageLotRecord[]>();
  lots.forEach((lot) => {
    const key = buildSiteSkuKey(lot.skuId, lot.siteId);
    const existing = lookup.get(key);
    if (existing) {
      existing.push(lot);
      return;
    }
    lookup.set(key, [lot]);
  });

  lookup.forEach((entries) => {
    entries.sort((left, right) => {
      const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
      const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
      return rightTime - leftTime;
    });
  });

  return lookup;
};

export const buildOsSellableCatalog = (
  inventoryItems: OsInventoryCatalogItem[],
  products: OsProductCatalogRecord[],
  packageLots: OsPackageLotRecord[]
): OsSellableCatalogItem[] => {
  const productLookup = buildProductLookupBySku(products);
  const lotLookup = groupPackageLotsBySkuSite(packageLots);

  return inventoryItems
    .map((item) => {
      const product = productLookup.get(item.skuId);
      const lots = lotLookup.get(buildSiteSkuKey(item.skuId, item.siteId)) ?? [];
      const primaryLot = lots.find((lot) => lot.availableUnits > 0) ?? lots[0];

      return {
        ...item,
        productId: product?.productId,
        productCode: product?.productCode,
        packageType: primaryLot?.packageType,
        packageFormatCode: primaryLot?.packageFormatCode,
        packageLots: lots,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
};

export const isKegPackageType = (
  packageType?: string,
  packageFormatCode?: string
): boolean => {
  const normalizedType = (packageType ?? '').trim().toLowerCase();
  if (normalizedType === 'keg') {
    return true;
  }

  const normalizedFormat = (packageFormatCode ?? '').trim().toUpperCase();
  return normalizedFormat.startsWith('KEG');
};
