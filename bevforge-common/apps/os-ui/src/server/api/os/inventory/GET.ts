import type { Request, Response } from 'express';
import {
  buildInventorySummary,
  readBatchState,
  readInventoryState,
  readPackageLotState,
  type BatchRecord,
  type InventoryItemRecord,
  type PackageLotRecord,
} from '../../../lib/inventory-batch-store.js';
import { listProducts } from '../../../lib/product-catalog-store.js';
import type { ProductRecord } from '../../../../features/products/types.js';

const normalizeSiteId = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const normalizeSkuId = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .toUpperCase();

const readMetadataText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const derivePackageFormatCode = (
  skuId: string | undefined,
  productCode: string | undefined
): string | undefined => {
  if (!skuId || !productCode) return undefined;
  const normalizedSkuId = normalizeSkuId(skuId);
  const normalizedProductCode = String(productCode).trim().toUpperCase();
  const prefix = `${normalizedProductCode}-`;
  if (!normalizedSkuId.startsWith(prefix)) return undefined;
  const next = normalizedSkuId.slice(prefix.length).trim();
  return next.length > 0 ? next : undefined;
};

type EnrichedInventoryItem = InventoryItemRecord & {
  productId?: string;
  productCode?: string;
  productName?: string;
  beverageClass?: ProductRecord['beverageClass'];
  packageFormatCode?: string;
  packageType?: PackageLotRecord['packageType'];
  packagedLotCount?: number;
  packagedInBondQty?: number;
  packagedReleasedQty?: number;
  packagedAllocatedQty?: number;
  packagedShippedQty?: number;
  packagedTotalQty?: number;
  packagedReleaseState?: PackageLotRecord['releaseStatus'] | 'mixed';
};

const sortNewestFirst = <T extends { updatedAt?: string; createdAt?: string }>(items: T[]) =>
  [...items].sort((left, right) => {
    const leftStamp = Date.parse(left.updatedAt ?? left.createdAt ?? '') || 0;
    const rightStamp = Date.parse(right.updatedAt ?? right.createdAt ?? '') || 0;
    return rightStamp - leftStamp;
  });

const summarizePackageLots = (lots: PackageLotRecord[]) => {
  const releaseStates = new Set<string>();
  return lots.reduce(
    (summary, lot) => {
      const releaseStatus = lot.releaseStatus ?? 'held';
      const totalUnits = Math.max(0, Number(lot.totalUnits) || 0);
      const allocatedUnits = Math.max(0, Number(lot.allocatedUnits) || 0);
      const shippedUnits = Math.max(0, Number(lot.shippedUnits) || 0);
      const availableUnits = Math.max(0, totalUnits - allocatedUnits - shippedUnits);
      releaseStates.add(releaseStatus);
      summary.packagedLotCount += 1;
      summary.packagedAllocatedQty += allocatedUnits;
      summary.packagedShippedQty += shippedUnits;
      summary.packagedTotalQty += totalUnits;
      if (releaseStatus === 'released') {
        summary.packagedReleasedQty += availableUnits;
      } else if (releaseStatus === 'held' || releaseStatus === 'ready') {
        summary.packagedInBondQty += availableUnits;
      }
      return summary;
    },
    {
      packagedLotCount: 0,
      packagedInBondQty: 0,
      packagedReleasedQty: 0,
      packagedAllocatedQty: 0,
      packagedShippedQty: 0,
      packagedTotalQty: 0,
      packagedReleaseState: undefined as PackageLotRecord['releaseStatus'] | 'mixed' | undefined,
      releaseStates,
    }
  );
};

const enrichInventoryItems = (params: {
  items: InventoryItemRecord[];
  packageLots: PackageLotRecord[];
  batches: BatchRecord[];
  products: ProductRecord[];
}): EnrichedInventoryItem[] => {
  const packageLotsBySku = new Map<string, PackageLotRecord>();
  for (const lot of sortNewestFirst(params.packageLots)) {
    const skuId = normalizeSkuId(lot.packageSkuId ?? lot.skuId);
    if (!skuId || packageLotsBySku.has(skuId)) continue;
    packageLotsBySku.set(skuId, lot);
  }

  const batchesBySku = new Map<string, BatchRecord>();
  for (const batch of sortNewestFirst(params.batches)) {
    const skuId = normalizeSkuId(batch.skuId);
    if (!skuId || batchesBySku.has(skuId)) continue;
    batchesBySku.set(skuId, batch);
  }

  const productsBySku = new Map<string, ProductRecord>();
  for (const product of sortNewestFirst(params.products)) {
    const skuIds = new Set([
      normalizeSkuId(product.defaultSkuId),
      ...product.skuIds.map((entry) => normalizeSkuId(entry)),
    ]);
    for (const skuId of skuIds) {
      if (!skuId || productsBySku.has(skuId)) continue;
      productsBySku.set(skuId, product);
    }
  }

  return params.items.map((item) => {
    const skuId = normalizeSkuId(item.skuId ?? item.sku ?? item.id);
    const lot = packageLotsBySku.get(skuId);
    const allLots = params.packageLots.filter(
      (entry) =>
        normalizeSkuId(entry.packageSkuId ?? entry.skuId) === skuId &&
        normalizeSiteId(entry.siteId) === normalizeSiteId(item.siteId)
    );
    const batch = batchesBySku.get(skuId);
    const product = productsBySku.get(skuId);
    const metadata = (lot?.metadata ?? {}) as Record<string, unknown>;
    const complianceSnapshot =
      metadata.complianceSnapshot && typeof metadata.complianceSnapshot === 'object'
        ? (metadata.complianceSnapshot as Record<string, unknown>)
        : undefined;

    const productId =
      readMetadataText(metadata.productId) ??
      batch?.productSnapshot?.productId ??
      product?.productId;
    const productCode =
      readMetadataText(metadata.productCode) ??
      batch?.productSnapshot?.productCode ??
      product?.productCode;
    const productName =
      readMetadataText(metadata.productName) ??
      readMetadataText(complianceSnapshot?.productName) ??
      batch?.productSnapshot?.productName ??
      product?.name;
    const beverageClass =
      (readMetadataText(metadata.beverageClass) as ProductRecord['beverageClass'] | undefined) ??
      (readMetadataText(complianceSnapshot?.beverageClass) as
        | ProductRecord['beverageClass']
        | undefined) ??
      batch?.productSnapshot?.beverageClass ??
      product?.beverageClass;
    const packageFormatCode =
      lot?.packageFormatCode ??
      readMetadataText(metadata.packageFormatCode) ??
      derivePackageFormatCode(skuId, productCode);
    const lotSummary = summarizePackageLots(allLots);
    const packagedReleaseState =
      lotSummary.releaseStates.size === 1
        ? (([...lotSummary.releaseStates][0] ?? 'held') as PackageLotRecord['releaseStatus'])
        : lotSummary.releaseStates.size > 1
          ? 'mixed'
          : undefined;

    return {
      ...item,
      productId,
      productCode,
      productName,
      beverageClass,
      packageFormatCode,
      packageType: lot?.packageType,
      packagedLotCount: lotSummary.packagedLotCount || undefined,
      packagedInBondQty: lotSummary.packagedInBondQty || undefined,
      packagedReleasedQty: lotSummary.packagedReleasedQty || undefined,
      packagedAllocatedQty: lotSummary.packagedAllocatedQty || undefined,
      packagedShippedQty: lotSummary.packagedShippedQty || undefined,
      packagedTotalQty: lotSummary.packagedTotalQty || undefined,
      packagedReleaseState,
    };
  });
};

export default async function handler(_req: Request, res: Response) {
  try {
    const [state, packageLots, batches, products] = await Promise.all([
      readInventoryState(),
      readPackageLotState(),
      readBatchState(),
      listProducts(),
    ]);
    const siteParam = _req.query.siteId;
    const siteId = Array.isArray(siteParam) ? siteParam[0] : siteParam;
    const normalizedSiteId = siteId && String(siteId).trim() ? normalizeSiteId(siteId) : null;
    const items = normalizedSiteId
      ? state.items.filter((item) => String(item.siteId).toLowerCase() === normalizedSiteId)
      : state.items;
    const filteredPackageLots = normalizedSiteId
      ? packageLots.lots.filter((lot) => normalizeSiteId(lot.siteId) === normalizedSiteId)
      : packageLots.lots;
    const filteredBatches = normalizedSiteId
      ? batches.batches.filter((batch) => normalizeSiteId(batch.siteId) === normalizedSiteId)
      : batches.batches;
    const enrichedItems = enrichInventoryItems({
      items,
      packageLots: filteredPackageLots,
      batches: filteredBatches,
      products,
    });
    return res.status(200).json({
      success: true,
      data: {
        items: enrichedItems,
        summary: buildInventorySummary(items),
        siteId: normalizedSiteId ?? undefined,
        updatedAt: state.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to load inventory:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load inventory.',
    });
  }
}
