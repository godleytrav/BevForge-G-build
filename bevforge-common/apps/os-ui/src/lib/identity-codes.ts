export type IdentityPackageType = 'keg' | 'can' | 'bottle' | 'case' | 'pallet' | 'other';

export const DEFAULT_ORG_PREFIX = 'GC';
export const DEFAULT_PRODUCT_LINE = 'CORE';

export const PACKAGE_FORMAT_OPTIONS: Record<
  IdentityPackageType,
  Array<{ code: string; label: string }>
> = {
  keg: [
    { code: 'KEG05', label: '5 gal keg' },
    { code: 'KEG10', label: '10 gal keg' },
    { code: 'KEG15', label: '15.5 gal keg' },
  ],
  can: [
    { code: 'CAN12', label: '12 oz can' },
    { code: 'CAN16', label: '16 oz can' },
    { code: 'CAN19', label: '19.2 oz can' },
  ],
  bottle: [
    { code: 'BTL08', label: '8 oz bottle' },
    { code: 'BTL12', label: '12 oz bottle' },
    { code: 'BTL16', label: '16 oz bottle' },
    { code: 'BTL22', label: '22 oz bottle' },
    { code: 'BTL24', label: '24 oz bottle' },
    { code: 'BTL375', label: '375 mL bottle' },
    { code: 'BTL750', label: '750 mL bottle' },
  ],
  case: [{ code: 'CASE', label: 'Case' }],
  pallet: [{ code: 'PALLET', label: 'Pallet' }],
  other: [{ code: 'OTHER', label: 'Other package' }],
};

export const DEFAULT_PACKAGE_FORMAT_CODE: Record<IdentityPackageType, string> = {
  keg: 'KEG15',
  can: 'CAN12',
  bottle: 'BTL750',
  case: 'CASE',
  pallet: 'PALLET',
  other: 'OTHER',
};

export const PACKAGE_STYLE_OPTIONS: Partial<Record<IdentityPackageType, string[]>> = {
  can: ['standard', 'sleek', 'slim'],
  bottle: ['standard', 'longneck', 'stubby', 'bomber', 'wine'],
  keg: ['sankey', 'pin-lock', 'ball-lock'],
};

const STOP_WORDS = new Set(['the', 'and', 'of', 'a', 'an']);

export const normalizeHumanCode = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const normalizeCodeSegment = (value: unknown): string => normalizeHumanCode(value);

export const productShortCodeFromName = (name: string): string => {
  const tokens = String(name ?? '')
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.toLowerCase())
    .filter((entry) => !STOP_WORDS.has(entry));

  const selected = (tokens.length > 0 ? tokens : ['product'])
    .slice(0, 3)
    .map((entry) => normalizeCodeSegment(entry).slice(0, 8))
    .filter(Boolean);

  return selected.join('-') || 'PRODUCT';
};

export const suggestProductCode = (params: {
  productName: string;
  orgPrefix?: string;
  lineCode?: string;
}): string => {
  const orgPrefix = normalizeCodeSegment(params.orgPrefix || DEFAULT_ORG_PREFIX) || DEFAULT_ORG_PREFIX;
  const lineCode = normalizeCodeSegment(params.lineCode || DEFAULT_PRODUCT_LINE) || DEFAULT_PRODUCT_LINE;
  const shortCode = productShortCodeFromName(params.productName);
  return normalizeHumanCode([orgPrefix, lineCode, shortCode].filter(Boolean).join('-'));
};

export const suggestSkuCode = (params: {
  productCode?: string;
  packageFormatCode?: string;
  packageType?: IdentityPackageType;
  productName?: string;
  lineCode?: string;
  orgPrefix?: string;
}): string => {
  const baseProductCode =
    normalizeCodeSegment(params.productCode) ||
    suggestProductCode({
      productName: params.productName || 'Product',
      lineCode: params.lineCode,
      orgPrefix: params.orgPrefix,
    });
  const packageFormatCode =
    normalizeCodeSegment(params.packageFormatCode) ||
    DEFAULT_PACKAGE_FORMAT_CODE[params.packageType ?? 'other'];
  return normalizeHumanCode(`${baseProductCode}-${packageFormatCode}`);
};

export const packageTypeFromFormatCode = (value: string | undefined): IdentityPackageType => {
  const normalized = normalizeCodeSegment(value);
  if (normalized.startsWith('KEG')) return 'keg';
  if (normalized.startsWith('CAN')) return 'can';
  if (normalized.startsWith('BTL')) return 'bottle';
  if (normalized === 'CASE') return 'case';
  if (normalized === 'PALLET') return 'pallet';
  return 'other';
};

export const batchSequenceLabel = (sequence: number): string =>
  `B${String(Math.max(1, sequence)).padStart(2, '0')}`;

export const packageSequenceLabel = (sequence: number): string =>
  `P${String(Math.max(1, sequence)).padStart(2, '0')}`;

export const normalizeBranchCode = (value: string | undefined): string | undefined => {
  const normalized = normalizeCodeSegment(value);
  return normalized || undefined;
};

export const extractBatchSuffix = (batchCode: string, productCode?: string): string => {
  const normalizedBatchCode = normalizeCodeSegment(batchCode);
  const normalizedProductCode = normalizeCodeSegment(productCode);
  const batchSequenceMatch = normalizedBatchCode.match(/(?:^|-)B\d+(?:-[A-Z0-9]+)*$/);
  if (batchSequenceMatch) {
    return batchSequenceMatch[0].replace(/^-/, '');
  }
  if (
    normalizedProductCode &&
    normalizedBatchCode.startsWith(`${normalizedProductCode}-`)
  ) {
    return normalizedBatchCode.slice(normalizedProductCode.length + 1);
  }
  return normalizedBatchCode;
};
