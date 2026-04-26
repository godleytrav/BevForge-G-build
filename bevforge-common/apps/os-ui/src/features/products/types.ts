export type BeverageClass = 'cider' | 'wine' | 'beer' | 'other';

export interface ProductImageVariants {
  thumbnailUrl?: string;
  cardImageUrl?: string;
  fullImageUrl?: string;
}

export interface ProductAssetVariantStorage {
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
}

export interface ProductAssetStorage {
  mode: 'file' | 'external';
  variants?: {
    thumbnail?: ProductAssetVariantStorage;
    card?: ProductAssetVariantStorage;
    full?: ProductAssetVariantStorage;
  };
}

export interface ProductAssetRecord {
  assetId: string;
  altText?: string;
  images: ProductImageVariants;
  storage?: ProductAssetStorage;
  createdAt: string;
  updatedAt: string;
}

export interface LabelVersionRecord {
  labelVersionId: string;
  assetId?: string;
  revision: string;
  sourceSuite: 'os' | 'ops' | 'lab' | 'flow' | 'connect';
  createdAt: string;
  updatedAt: string;
}

export interface ProductRecord {
  productId: string;
  productCode: string;
  name: string;
  beverageClass: BeverageClass;
  skuIds: string[];
  defaultSkuId?: string;
  currentAssetId?: string;
  currentLabelVersionId?: string;
  assets: ProductAssetRecord[];
  labelVersions: LabelVersionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  products: ProductRecord[];
}

export interface BatchProductSnapshot {
  productId: string;
  productCode: string;
  productName: string;
  beverageClass: BeverageClass;
  labelAssetId?: string;
  labelVersionId?: string;
  images?: ProductImageVariants;
  updatedAt: string;
}

export interface ProductIdentityDraft {
  productId?: string;
  productCode?: string;
  productName: string;
  beverageClass: BeverageClass;
  thumbnailUrl?: string;
  cardImageUrl?: string;
  fullImageUrl?: string;
}

export const selectProductImage = (
  images: ProductImageVariants | undefined,
  preferred: 'thumbnail' | 'card' | 'full' = 'card'
): string | undefined => {
  if (!images) return undefined;
  if (preferred === 'thumbnail') {
    return images.thumbnailUrl ?? images.cardImageUrl ?? images.fullImageUrl;
  }
  if (preferred === 'full') {
    return images.fullImageUrl ?? images.cardImageUrl ?? images.thumbnailUrl;
  }
  return images.cardImageUrl ?? images.fullImageUrl ?? images.thumbnailUrl;
};
