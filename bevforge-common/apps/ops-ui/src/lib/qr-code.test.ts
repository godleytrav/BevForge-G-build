import { describe, expect, it } from 'vitest';
import { generateContainerQR, generatePalletQR, generateQRCode, parseQRCode } from './qr-code';

describe('qr-code', () => {
  it('generates an SVG data URL for QR output', () => {
    const dataUrl = generateQRCode('ops:qr:test');
    expect(dataUrl.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('creates container and pallet QR images as data URLs', () => {
    expect(generateContainerQR('K-100').startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(generatePalletQR('PALLET-7').startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('parses JSON payloads safely', () => {
    const parsed = parseQRCode('{"type":"container","id":"K-100"}');
    expect(parsed).toEqual({
      type: 'container',
      id: 'K-100',
    });
    expect(parseQRCode('not-json')).toBeNull();
  });
});
