import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { commissioningPaths, ensureCommissioningStore } from './commissioning-store.js';
import {
  normalizeHumanCode,
  suggestProductCode,
} from '../../lib/identity-codes.js';
import type {
  BatchProductSnapshot,
  BeverageClass,
  LabelVersionRecord,
  ProductAssetRecord,
  ProductAssetStorage,
  ProductAssetVariantStorage,
  ProductCatalogState,
  ProductImageVariants,
  ProductRecord,
} from '../../features/products/types.js';

const nowIso = () => new Date().toISOString();

const readJsonOrDefault = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown) => {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const normalizeSkuId = (value: unknown): string => normalizeHumanCode(value);
const normalizeProductCode = (value: unknown): string => normalizeHumanCode(value);

const normalizeNameKey = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const toOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next.length > 0 ? next : undefined;
};

const normalizeImageValue = (value: unknown): string | undefined => {
  const next = toOptionalText(value);
  if (!next) return undefined;
  if (
    next.startsWith('data:image/') ||
    next.startsWith('http://') ||
    next.startsWith('https://') ||
    next.startsWith('/')
  ) {
    return next;
  }
  return next;
};

const normalizeBeverageClass = (value: unknown): BeverageClass => {
  const next = String(value ?? '')
    .trim()
    .toLowerCase();
  if (next === 'cider' || next === 'wine' || next === 'beer') {
    return next;
  }
  return 'other';
};

const normalizeImages = (value: ProductImageVariants | undefined): ProductImageVariants | undefined => {
  const images: ProductImageVariants = {
    thumbnailUrl: normalizeImageValue(value?.thumbnailUrl),
    cardImageUrl: normalizeImageValue(value?.cardImageUrl),
    fullImageUrl: normalizeImageValue(value?.fullImageUrl),
  };
  if (!images.thumbnailUrl && !images.cardImageUrl && !images.fullImageUrl) {
    return undefined;
  }
  return images;
};

const mimeToExtension = (mimeType: string): string => {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'image/svg+xml') return 'svg';
  return 'bin';
};

const parseDataUrl = (
  value: string
): { mimeType: string; buffer: Buffer; extension: string } | null => {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(value);
  if (!match) return null;
  const mimeType = match[1].trim().toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  return {
    mimeType,
    buffer,
    extension: mimeToExtension(mimeType),
  };
};

const mediaRouteForVariant = (assetId: string, variant: 'thumbnail' | 'card' | 'full'): string =>
  `/api/os/products/media/${assetId}/${variant}`;

const normalizeVariantStorage = (
  value: ProductAssetVariantStorage | undefined
): ProductAssetVariantStorage | undefined => {
  if (!value) return undefined;
  const fileName = toOptionalText(value.fileName);
  const mimeType = toOptionalText(value.mimeType);
  if (!fileName || !mimeType) return undefined;
  const sizeBytes = Number(value.sizeBytes);
  return {
    fileName,
    mimeType,
    sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
  };
};

const normalizeStorage = (value: ProductAssetStorage | undefined): ProductAssetStorage | undefined => {
  if (!value) return undefined;
  const mode = value.mode === 'file' ? 'file' : 'external';
  const variants = {
    thumbnail: normalizeVariantStorage(value.variants?.thumbnail),
    card: normalizeVariantStorage(value.variants?.card),
    full: normalizeVariantStorage(value.variants?.full),
  };
  if (!variants.thumbnail && !variants.card && !variants.full && mode !== 'external') {
    return undefined;
  }
  return {
    mode,
    variants:
      variants.thumbnail || variants.card || variants.full ? variants : undefined,
  };
};

const imagesMatch = (
  left: ProductImageVariants | undefined,
  right: ProductImageVariants | undefined
): boolean =>
  (normalizeImageValue(left?.thumbnailUrl) ?? '') ===
    (normalizeImageValue(right?.thumbnailUrl) ?? '') &&
  (normalizeImageValue(left?.cardImageUrl) ?? '') ===
    (normalizeImageValue(right?.cardImageUrl) ?? '') &&
  (normalizeImageValue(left?.fullImageUrl) ?? '') ===
    (normalizeImageValue(right?.fullImageUrl) ?? '');

const bumpRevision = (previousRevision: string | undefined): string => {
  const normalized = toOptionalText(previousRevision);
  if (!normalized) return 'v1';
  const match = /^v(\d+)$/i.exec(normalized);
  if (match) {
    return `v${Number(match[1]) + 1}`;
  }
  return `${normalized}-next`;
};

const normalizeAsset = (value: ProductAssetRecord): ProductAssetRecord => ({
  assetId: String(value.assetId ?? randomUUID()).trim() || randomUUID(),
  altText: toOptionalText(value.altText),
  images: normalizeImages(value.images) ?? {},
  storage: normalizeStorage(value.storage),
  createdAt: toOptionalText(value.createdAt) ?? nowIso(),
  updatedAt: toOptionalText(value.updatedAt) ?? nowIso(),
});

const normalizeLabelVersion = (value: LabelVersionRecord): LabelVersionRecord => ({
  labelVersionId: String(value.labelVersionId ?? randomUUID()).trim() || randomUUID(),
  assetId: toOptionalText(value.assetId),
  revision: toOptionalText(value.revision) ?? 'v1',
  sourceSuite:
    value.sourceSuite === 'ops' ||
    value.sourceSuite === 'lab' ||
    value.sourceSuite === 'flow' ||
    value.sourceSuite === 'connect'
      ? value.sourceSuite
      : 'os',
  createdAt: toOptionalText(value.createdAt) ?? nowIso(),
  updatedAt: toOptionalText(value.updatedAt) ?? nowIso(),
});

const normalizeProduct = (value: ProductRecord): ProductRecord => {
  const assets = Array.isArray(value.assets) ? value.assets.map(normalizeAsset) : [];
  const labelVersions = Array.isArray(value.labelVersions)
    ? value.labelVersions.map(normalizeLabelVersion)
    : [];
  const fallbackProductCode = suggestProductCode({
    productName: toOptionalText(value.name) ?? 'Product',
  });
  return {
    productId: String(value.productId ?? randomUUID()).trim() || randomUUID(),
    productCode: normalizeProductCode(value.productCode) || fallbackProductCode,
    name: toOptionalText(value.name) ?? 'Product',
    beverageClass: normalizeBeverageClass(value.beverageClass),
    skuIds: Array.isArray(value.skuIds)
      ? value.skuIds.map((entry) => normalizeSkuId(entry)).filter(Boolean)
      : [],
    defaultSkuId: toOptionalText(value.defaultSkuId)
      ? normalizeSkuId(value.defaultSkuId)
      : undefined,
    currentAssetId: toOptionalText(value.currentAssetId),
    currentLabelVersionId: toOptionalText(value.currentLabelVersionId),
    assets,
    labelVersions,
    createdAt: toOptionalText(value.createdAt) ?? nowIso(),
    updatedAt: toOptionalText(value.updatedAt) ?? nowIso(),
  };
};

const defaultCatalogState = (): ProductCatalogState => ({
  schemaVersion: '1.0.0',
  id: 'product-catalog',
  updatedAt: nowIso(),
  products: [],
});

const persistVariantFile = async (params: {
  assetId: string;
  variant: 'thumbnail' | 'card' | 'full';
  dataUrl: string;
}): Promise<{ url: string; storage: ProductAssetVariantStorage }> => {
  const parsed = parseDataUrl(params.dataUrl);
  if (!parsed) {
    throw new Error(`Invalid data URL for ${params.variant} image.`);
  }
  const assetDir = path.join(commissioningPaths.productMediaDir, params.assetId);
  await fs.mkdir(assetDir, { recursive: true });
  const fileName = `${params.variant}.${parsed.extension}`;
  const filePath = path.join(assetDir, fileName);
  await fs.writeFile(filePath, parsed.buffer);
  return {
    url: mediaRouteForVariant(params.assetId, params.variant),
    storage: {
      fileName,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.buffer.byteLength,
    },
  };
};

const resolveStoredImages = async (params: {
  assetId: string;
  images: ProductImageVariants | undefined;
  existingAsset?: ProductAssetRecord | null;
}): Promise<{ images: ProductImageVariants; storage?: ProductAssetStorage }> => {
  const nextImages: ProductImageVariants = {};
  const nextStorageVariants: NonNullable<ProductAssetStorage['variants']> = {};
  let fileBacked = false;

  const variants: Array<{
    key: 'thumbnail' | 'card' | 'full';
    field: keyof ProductImageVariants;
  }> = [
    { key: 'thumbnail', field: 'thumbnailUrl' },
    { key: 'card', field: 'cardImageUrl' },
    { key: 'full', field: 'fullImageUrl' },
  ];

  for (const variant of variants) {
    const incoming = normalizeImageValue(params.images?.[variant.field]);
    if (!incoming) continue;
    if (incoming.startsWith('data:image/')) {
      const persisted = await persistVariantFile({
        assetId: params.assetId,
        variant: variant.key,
        dataUrl: incoming,
      });
      nextImages[variant.field] = persisted.url;
      nextStorageVariants[variant.key] = persisted.storage;
      fileBacked = true;
      continue;
    }
    nextImages[variant.field] = incoming;
    const existingStorage = params.existingAsset?.storage?.variants?.[variant.key];
    if (incoming === params.existingAsset?.images?.[variant.field] && existingStorage) {
      nextStorageVariants[variant.key] = existingStorage;
      fileBacked = true;
    }
  }

  return {
    images: nextImages,
    storage:
      fileBacked || nextStorageVariants.thumbnail || nextStorageVariants.card || nextStorageVariants.full
        ? {
            mode:
              nextStorageVariants.thumbnail || nextStorageVariants.card || nextStorageVariants.full
                ? 'file'
                : 'external',
            variants:
              nextStorageVariants.thumbnail || nextStorageVariants.card || nextStorageVariants.full
                ? nextStorageVariants
                : undefined,
          }
        : params.existingAsset?.storage?.mode === 'external'
          ? { mode: 'external' }
          : undefined,
  };
};

const productSnapshotFromRecord = (product: ProductRecord): BatchProductSnapshot => {
  const activeAsset = product.assets.find((asset) => asset.assetId === product.currentAssetId);
  return {
    productId: product.productId,
    productCode: product.productCode,
    productName: product.name,
    beverageClass: product.beverageClass,
    labelAssetId: activeAsset?.assetId,
    labelVersionId: product.currentLabelVersionId,
    images: activeAsset?.images,
    updatedAt: nowIso(),
  };
};

export const readProductCatalog = async (): Promise<ProductCatalogState> => {
  await ensureCommissioningStore();
  const state = await readJsonOrDefault<ProductCatalogState>(
    commissioningPaths.productCatalogFile,
    defaultCatalogState()
  );
  return {
    schemaVersion: String(state.schemaVersion ?? '1.0.0'),
    id: String(state.id ?? 'product-catalog'),
    updatedAt: toOptionalText(state.updatedAt) ?? nowIso(),
    products: Array.isArray(state.products) ? state.products.map(normalizeProduct) : [],
  };
};

const writeProductCatalog = async (state: ProductCatalogState): Promise<ProductCatalogState> => {
  await ensureCommissioningStore();
  const normalized: ProductCatalogState = {
    schemaVersion: String(state.schemaVersion ?? '1.0.0'),
    id: String(state.id ?? 'product-catalog'),
    updatedAt: nowIso(),
    products: (state.products ?? []).map(normalizeProduct),
  };
  await writeJson(commissioningPaths.productCatalogFile, normalized);
  return normalized;
};

export const listProducts = async (): Promise<ProductRecord[]> => {
  const state = await readProductCatalog();
  return state.products;
};

export const getProductById = async (productId: string): Promise<ProductRecord | null> => {
  const normalized = String(productId ?? '').trim();
  if (!normalized) return null;
  const state = await readProductCatalog();
  return state.products.find((product) => product.productId === normalized) ?? null;
};

export const getProductAssetById = async (
  assetId: string
): Promise<{ product: ProductRecord; asset: ProductAssetRecord } | null> => {
  const normalizedAssetId = toOptionalText(assetId);
  if (!normalizedAssetId) return null;
  const state = await readProductCatalog();
  for (const product of state.products) {
    const asset = product.assets.find((candidate) => candidate.assetId === normalizedAssetId);
    if (asset) {
      return { product, asset };
    }
  }
  return null;
};

export const upsertCoreProduct = async (params: {
  productId?: string;
  productCode?: string;
  productName: string;
  skuId?: string;
  beverageClass?: BeverageClass;
  images?: ProductImageVariants;
  sourceSuite?: LabelVersionRecord['sourceSuite'];
}): Promise<{ product: ProductRecord; snapshot: BatchProductSnapshot }> => {
  const state = await readProductCatalog();
  const normalizedProductId = toOptionalText(params.productId);
  const requestedProductCode = normalizeProductCode(params.productCode);
  const normalizedSkuId = params.skuId ? normalizeSkuId(params.skuId) : undefined;
  const normalizedImages = normalizeImages(params.images);
  const normalizedProductName = toOptionalText(params.productName) ?? 'Product';
  const normalizedNameKey = normalizeNameKey(normalizedProductName);
  const sourceSuite =
    params.sourceSuite === 'ops' ||
    params.sourceSuite === 'lab' ||
    params.sourceSuite === 'flow' ||
    params.sourceSuite === 'connect'
      ? params.sourceSuite
      : 'os';

  const index = state.products.findIndex((product) => {
    if (normalizedProductId && product.productId === normalizedProductId) return true;
    if (normalizedSkuId && product.skuIds.includes(normalizedSkuId)) return true;
    if (!normalizedProductId && !normalizedSkuId && normalizedNameKey) {
      return normalizeNameKey(product.name) === normalizedNameKey;
    }
    return false;
  });

  const now = nowIso();
  const existing = index >= 0 ? state.products[index] : null;
  const usedProductCodes = new Set(
    state.products
      .filter((product) => !existing || product.productId !== existing.productId)
      .map((product) => normalizeProductCode(product.productCode))
      .filter(Boolean)
  );

  const ensureUniqueProductCode = (candidate: string): string => {
    const normalizedCandidate = normalizeProductCode(candidate);
    if (!normalizedCandidate) {
      return '';
    }
    if (!usedProductCodes.has(normalizedCandidate)) {
      return normalizedCandidate;
    }
    let index = 2;
    while (usedProductCodes.has(`${normalizedCandidate}-${index}`)) {
      index += 1;
    }
    return `${normalizedCandidate}-${index}`;
  };

  const nextProductCode = ensureUniqueProductCode(
    requestedProductCode ||
      existing?.productCode ||
      suggestProductCode({
        productName: normalizedProductName,
      })
  );

  const currentAsset =
    existing?.assets.find((asset) => asset.assetId === existing.currentAssetId) ?? null;
  const currentLabelVersion =
    existing?.labelVersions.find(
      (version) => version.labelVersionId === existing.currentLabelVersionId
    ) ?? null;
  const labelImagesChanged =
    normalizedImages !== undefined &&
    !imagesMatch(currentAsset?.images, normalizedImages);
  const shouldCreateLabelRevision =
    normalizedImages !== undefined && (!existing || labelImagesChanged);
  const assetId =
    normalizedImages !== undefined
      ? shouldCreateLabelRevision
        ? randomUUID()
        : currentAsset?.assetId ?? existing?.currentAssetId ?? randomUUID()
      : existing?.currentAssetId;
  const labelVersionId = shouldCreateLabelRevision
    ? randomUUID()
    : existing?.currentLabelVersionId;

  const nextAssets = [...(existing?.assets ?? [])];
  if (normalizedImages !== undefined && assetId) {
    const assetIndex = nextAssets.findIndex((asset) => asset.assetId === assetId);
    const existingAsset = assetIndex >= 0 ? nextAssets[assetIndex] : null;
    const mergedImages: ProductImageVariants = {
      ...(existingAsset?.images ?? {}),
      ...normalizedImages,
    };
    const resolvedImages = await resolveStoredImages({
      assetId,
      images: mergedImages,
      existingAsset,
    });
    const nextAsset: ProductAssetRecord = {
      assetId,
      altText: `${normalizedProductName} label`,
      images: resolvedImages.images,
      storage: resolvedImages.storage,
      createdAt: assetIndex >= 0 ? nextAssets[assetIndex].createdAt : now,
      updatedAt: now,
    };
    if (assetIndex >= 0) {
      nextAssets[assetIndex] = nextAsset;
    } else {
      nextAssets.push(nextAsset);
    }
  }

  const nextLabelVersions = [...(existing?.labelVersions ?? [])];
  if (labelVersionId) {
    const labelIndex = nextLabelVersions.findIndex(
      (version) => version.labelVersionId === labelVersionId
    );
    const nextLabelVersion: LabelVersionRecord = {
      labelVersionId,
      assetId,
      revision:
        labelIndex >= 0
          ? nextLabelVersions[labelIndex].revision
          : shouldCreateLabelRevision
            ? bumpRevision(currentLabelVersion?.revision)
            : 'v1',
      sourceSuite,
      createdAt: labelIndex >= 0 ? nextLabelVersions[labelIndex].createdAt : now,
      updatedAt: now,
    };
    if (labelIndex >= 0) {
      nextLabelVersions[labelIndex] = nextLabelVersion;
    } else {
      nextLabelVersions.push(nextLabelVersion);
    }
  }

  const nextProduct: ProductRecord = normalizeProduct({
    productId: normalizedProductId ?? existing?.productId ?? randomUUID(),
    productCode: nextProductCode,
    name: normalizedProductName,
    beverageClass: params.beverageClass ?? existing?.beverageClass ?? 'other',
    skuIds: Array.from(
      new Set([...(existing?.skuIds ?? []), ...(normalizedSkuId ? [normalizedSkuId] : [])])
    ),
    defaultSkuId: normalizedSkuId ?? existing?.defaultSkuId,
    currentAssetId: assetId,
    currentLabelVersionId: labelVersionId,
    assets: nextAssets,
    labelVersions: nextLabelVersions,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  const nextProducts = [...state.products];
  if (index >= 0) {
    nextProducts[index] = nextProduct;
  } else {
    nextProducts.unshift(nextProduct);
  }

  await writeProductCatalog({
    ...state,
    products: nextProducts,
  });

  return {
    product: nextProduct,
    snapshot: productSnapshotFromRecord(nextProduct),
  };
};

export const updateProductRecord = async (params: {
  productId: string;
  productCode?: string;
  productName?: string;
  skuId?: string;
  beverageClass?: BeverageClass;
  images?: ProductImageVariants;
}): Promise<{ product: ProductRecord; snapshot: BatchProductSnapshot }> => {
  const existing = await getProductById(params.productId);
  if (!existing) {
    throw new Error('Product not found.');
  }
  return upsertCoreProduct({
    productId: existing.productId,
    productCode: params.productCode ?? existing.productCode,
    productName: params.productName ?? existing.name,
    skuId: params.skuId ?? existing.defaultSkuId,
    beverageClass: params.beverageClass ?? existing.beverageClass,
    images: params.images,
    sourceSuite: 'os',
  });
};
