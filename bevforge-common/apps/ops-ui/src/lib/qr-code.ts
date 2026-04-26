import { qrcodegen } from './qr-core-nayuki';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrection?: 'low' | 'medium' | 'quartile' | 'high';
}

const toBase64 = (value: string): string => {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value);
  }
  throw new Error('Base64 encoding is not available in this runtime.');
};

const toSvgDataUrl = (svg: string): string => `data:image/svg+xml;base64,${toBase64(svg)}`;

const resolveEcc = (
  value: QRCodeOptions['errorCorrection']
): qrcodegen.QrCode.Ecc => {
  switch (value) {
    case 'low':
      return qrcodegen.QrCode.Ecc.LOW;
    case 'quartile':
      return qrcodegen.QrCode.Ecc.QUARTILE;
    case 'high':
      return qrcodegen.QrCode.Ecc.HIGH;
    default:
      return qrcodegen.QrCode.Ecc.MEDIUM;
  }
};

export function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): string {
  const {
    size = 200,
    margin = 4,
    color = '#000000',
    backgroundColor = '#FFFFFF',
    errorCorrection = 'medium',
  } = options;

  const safeMargin = Number.isFinite(margin) ? Math.max(0, Math.floor(margin)) : 4;
  const qr = qrcodegen.QrCode.encodeText(text, resolveEcc(errorCorrection));
  const moduleSize = qr.size + safeMargin * 2;
  const pixelScale = Math.max(1, Math.floor(size / moduleSize));
  const pixelSize = moduleSize * pixelScale;
  let path = '';

  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (qr.getModule(x, y)) {
        path += `M${x + safeMargin},${y + safeMargin}h1v1h-1z`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${moduleSize} ${moduleSize}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges"><rect width="${moduleSize}" height="${moduleSize}" fill="${backgroundColor}"/>${path ? `<path d="${path}" fill="${color}"/>` : ''}</svg>`;
  return toSvgDataUrl(svg);
}

/**
 * Generate QR code for a container
 */
export function generateContainerQR(containerId: string): string {
  const data = JSON.stringify({
    type: 'container',
    id: containerId,
    timestamp: Date.now(),
  });
  return generateQRCode(data);
}

/**
 * Generate QR code for a pallet
 */
export function generatePalletQR(palletId: string): string {
  const data = JSON.stringify({
    type: 'pallet',
    id: palletId,
    timestamp: Date.now(),
  });
  return generateQRCode(data);
}

/**
 * Parse QR code data
 */
export function parseQRCode(data: string): Record<string, unknown> | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Download QR code as image
 */
export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
