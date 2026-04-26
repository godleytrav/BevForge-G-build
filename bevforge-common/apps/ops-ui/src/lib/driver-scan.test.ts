import { describe, expect, it } from 'vitest';
import { normalizeScannedIdentifier } from './driver-scan';

describe('normalizeScannedIdentifier', () => {
  it('returns raw ids when scan is plain text', () => {
    const result = normalizeScannedIdentifier(' PKG-2201 ');
    expect(result.identifier).toBe('PKG-2201');
    expect(result.rawValue).toBe('PKG-2201');
  });

  it('extracts id from QR JSON payload', () => {
    const result = normalizeScannedIdentifier('{"type":"container","id":"PKG-2201"}');
    expect(result.identifier).toBe('PKG-2201');
    expect(result.qrType).toBe('container');
  });

  it('falls back to shipping id for payload QR records', () => {
    const result = normalizeScannedIdentifier(
      '{"type":"ops_dispatch_payload","shippingId":"TRK-01-LOAD-1"}'
    );
    expect(result.identifier).toBe('TRK-01-LOAD-1');
    expect(result.qrType).toBe('ops_dispatch_payload');
  });

  it('prefers OPS tracking codes over internal ids when they are present', () => {
    const result = normalizeScannedIdentifier(
      '{"type":"package_lot","id":"b3c9c705-3640-4d0a-bcb2-7d99f0b95fdf","packageLotCode":"LOT-22-A","batchCode":"BATCH-18"}'
    );
    expect(result.identifier).toBe('LOT-22-A');
    expect(result.qrType).toBe('package_lot');
  });

  it('supports asset and sku identifiers in QR JSON payloads', () => {
    expect(
      normalizeScannedIdentifier('{"type":"asset","assetCode":"KEG-4412","id":"asset-1"}')
        .identifier
    ).toBe('KEG-4412');
    expect(
      normalizeScannedIdentifier('{"type":"product","skuId":"SKU-HAZY-12OZ","id":"product-1"}')
        .identifier
    ).toBe('SKU-HAZY-12OZ');
  });

  it('prefers stable package-unit codes when OPS package-unit QR is scanned', () => {
    expect(
      normalizeScannedIdentifier(
        '{"type":"ops_package_unit","unitId":"unit-123","unitCode":"CASE-2041","packageLotCode":"LOT-44-A"}'
      ).identifier
    ).toBe('CASE-2041');
  });

  it('supports qr: prefix shorthand', () => {
    const result = normalizeScannedIdentifier('qr:PALLET-22');
    expect(result.identifier).toBe('PALLET-22');
  });

  it('extracts lookup identifiers from OPS mobile deep links', () => {
    const result = normalizeScannedIdentifier(
      'http://192.168.4.174:5182/ops/mobile/lookup/PKG-2202?type=ops_package_unit&unitId=case-1'
    );
    expect(result.identifier).toBe('PKG-2202');
    expect(result.qrType).toBe('ops_mobile_lookup');
  });
});
