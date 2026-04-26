import { parseQRCode } from './qr-code';

interface ParsedScanIdentifier {
  identifier: string;
  rawValue: string;
  qrType?: string;
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const parseLookupIdentifierFromUrl = (value: string): string | undefined => {
  try {
    const url = new globalThis.URL(value);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const lookupIndex = pathSegments.findIndex(
      (segment, index) =>
        segment === 'lookup' &&
        pathSegments[index - 2] === 'ops' &&
        pathSegments[index - 1] === 'mobile'
    );

    if (lookupIndex >= 0) {
      const routeIdentifier = pathSegments[lookupIndex + 1];
      if (routeIdentifier) {
        return decodeURIComponent(routeIdentifier);
      }
    }

    const identifierParam =
      url.searchParams.get('identifier') ??
      url.searchParams.get('unitCode') ??
      url.searchParams.get('unitId') ??
      url.searchParams.get('packageLotCode') ??
      url.searchParams.get('assetCode') ??
      url.searchParams.get('batchCode') ??
      url.searchParams.get('skuId');

    return toOptionalString(identifierParam);
  } catch {
    return undefined;
  }
};

export const normalizeScannedIdentifier = (rawValue: string): ParsedScanIdentifier => {
  const trimmed = rawValue.trim();
  const lookupIdentifier = parseLookupIdentifierFromUrl(trimmed);
  if (lookupIdentifier) {
    return {
      identifier: lookupIdentifier,
      rawValue: trimmed,
      qrType: 'ops_mobile_lookup',
    };
  }

  const parsed = parseQRCode(trimmed);
  if (parsed) {
    const qrType = toOptionalString(parsed.type);
    const id =
      toOptionalString(parsed.unitCode) ??
      toOptionalString(parsed.unitId) ??
      toOptionalString(parsed.packageLotCode) ??
      toOptionalString(parsed.assetCode) ??
      toOptionalString(parsed.batchCode) ??
      toOptionalString(parsed.skuId) ??
      toOptionalString(parsed.shippingId) ??
      toOptionalString(parsed.packagingId) ??
      toOptionalString(parsed.id);

    if (id) {
      return {
        identifier: id,
        rawValue: trimmed,
        qrType,
      };
    }
  }

  if (trimmed.toLowerCase().startsWith('qr:')) {
    const extracted = trimmed.slice(3).trim();
    if (extracted.length > 0) {
      return {
        identifier: extracted,
        rawValue: trimmed,
      };
    }
  }

  return {
    identifier: trimmed,
    rawValue: trimmed,
  };
};
