/**
 * Printing Utility Library
 * Handles printing of labels, manifests, and invoices for containers and pallets
 */

import { generateContainerQR, generatePalletQR } from './qr-code';

export interface Container {
  id: string;
  type: 'keg' | 'case' | 'bottle' | 'can';
  productName: string;
  batchId?: string;
  fillDate?: string;
  expiryDate?: string;
  volume?: string;
}

export interface Pallet {
  id: string;
  locationId: string;
  destinationId?: string;
  scheduledDelivery?: string;
  notes?: string;
  containers: Container[];
}

export interface PrintOptions {
  includeQRCode?: boolean;
  includeBatchInfo?: boolean;
  includeBarcode?: boolean;
  paperSize?: 'letter' | 'a4' | 'label-4x6' | 'label-2x4';
}

/**
 * Generate HTML for a container label
 */
export function generateContainerLabel(
  container: Container,
  options: PrintOptions = {}
): string {
  const {
    includeQRCode = true,
    includeBatchInfo = true,
  } = options;

  const qrCode = includeQRCode
    ? generateContainerQR(container.id)
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Container Label - ${container.id}</title>
        <style>
          @media print {
            @page { margin: 0; size: 4in 6in; }
            body { margin: 0.5in; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 4in;
          }
          .label {
            border: 2px solid #000;
            padding: 15px;
            text-align: center;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .product {
            font-size: 18px;
            margin-bottom: 15px;
          }
          .qr-code {
            margin: 15px auto;
            display: flex;
            justify-content: center;
          }
          .qr-code img {
            width: 150px;
            height: 150px;
          }
          .details {
            font-size: 12px;
            text-align: left;
            margin-top: 15px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .label-text {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="title">${container.type}</div>
          <div class="product">${container.productName}</div>
          ${includeQRCode ? `<div class="qr-code"><img src="${qrCode}" alt="container qr code" /></div>` : ''}
          <div class="details">
            <div class="detail-row">
              <span class="label-text">ID:</span>
              <span>${container.id}</span>
            </div>
            ${includeBatchInfo && container.batchId ? `
              <div class="detail-row">
                <span class="label-text">Batch:</span>
                <span>${container.batchId}</span>
              </div>
            ` : ''}
            ${includeBatchInfo && container.fillDate ? `
              <div class="detail-row">
                <span class="label-text">Fill Date:</span>
                <span>${new Date(container.fillDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${includeBatchInfo && container.expiryDate ? `
              <div class="detail-row">
                <span class="label-text">Expiry:</span>
                <span>${new Date(container.expiryDate).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${container.volume ? `
              <div class="detail-row">
                <span class="label-text">Volume:</span>
                <span>${container.volume}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for a pallet manifest
 */
export function generatePalletManifest(
  pallet: Pallet,
  locationName: string,
  destinationName?: string,
  options: PrintOptions = {}
): string {
  const { includeQRCode = true } = options;

  const qrCode = includeQRCode
    ? generatePalletQR(pallet.id)
    : '';

  // Group containers by product
  const productGroups = pallet.containers.reduce((acc, container) => {
    const key = `${container.productName}-${container.type}`;
    if (!acc[key]) {
      acc[key] = {
        productName: container.productName,
        type: container.type,
        containers: [],
      };
    }
    acc[key].containers.push(container);
    return acc;
  }, {} as Record<string, { productName: string; type: string; containers: Container[] }>);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Pallet Manifest - ${pallet.id}</title>
        <style>
          @media print {
            @page { margin: 0.5in; size: letter; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 8.5in;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .pallet-id {
            font-size: 24px;
            color: #666;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 5px;
          }
          .info-label {
            font-weight: bold;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
          }
          .qr-section {
            text-align: center;
            margin: 30px 0;
          }
          .qr-section img {
            width: 200px;
            height: 200px;
          }
          .contents-section {
            margin-top: 30px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          .product-group {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .product-header {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .container-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            font-size: 12px;
          }
          .container-item {
            padding: 5px;
            background: #f5f5f5;
            border-radius: 3px;
          }
          .summary {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border: 2px solid #000;
            border-radius: 5px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 16px;
          }
          .summary-total {
            font-weight: bold;
            font-size: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PALLET MANIFEST</div>
          <div class="pallet-id">Pallet ID: ${pallet.id}</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="info-label">Origin Location</div>
            <div class="info-value">${locationName}</div>
          </div>
          ${destinationName ? `
            <div class="info-box">
              <div class="info-label">Destination</div>
              <div class="info-value">${destinationName}</div>
            </div>
          ` : ''}
          ${pallet.scheduledDelivery ? `
            <div class="info-box">
              <div class="info-label">Scheduled Delivery</div>
              <div class="info-value">${new Date(pallet.scheduledDelivery).toLocaleDateString()}</div>
            </div>
          ` : ''}
          <div class="info-box">
            <div class="info-label">Manifest Date</div>
            <div class="info-value">${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        ${includeQRCode ? `
          <div class="qr-section">
            <img src="${qrCode}" alt="pallet qr code" />
            <div style="margin-top: 10px; font-size: 14px; color: #666;">
              Scan to track pallet
            </div>
          </div>
        ` : ''}

        <div class="contents-section">
          <div class="section-title">Pallet Contents</div>
          ${Object.values(productGroups).map(group => `
            <div class="product-group">
              <div class="product-header">
                ${group.productName} - ${group.type.toUpperCase()} (${group.containers.length})
              </div>
              <div class="container-list">
                ${group.containers.map(c => `
                  <div class="container-item">
                    ${c.id}${c.batchId ? ` (${c.batchId})` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>Total Products:</span>
            <span>${Object.keys(productGroups).length}</span>
          </div>
          <div class="summary-row">
            <span>Total Containers:</span>
            <span>${pallet.containers.length}</span>
          </div>
          ${pallet.notes ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc;">
              <div style="font-weight: bold; margin-bottom: 5px;">Notes:</div>
              <div>${pallet.notes}</div>
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for batch printing multiple container labels
 */
export function generateBatchLabels(
  containers: Container[],
  options: PrintOptions = {}
): string {
  const labels = containers.map(container => 
    generateContainerLabel(container, options)
  );

  // Combine all labels into a single document with page breaks
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Batch Labels - ${containers.length} containers</title>
        <style>
          @media print {
            @page { margin: 0; size: 4in 6in; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${labels.map((label, index) => `
          <div class="${index < labels.length - 1 ? 'page-break' : ''}">
            ${label.replace(/<!DOCTYPE html>.*?<body>/s, '').replace(/<\/body>.*?<\/html>/s, '')}
          </div>
        `).join('')}
      </body>
    </html>
  `;
}

/**
 * Print HTML content in a new window
 */
export function printHTML(html: string, title: string = 'Print') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    globalThis.alert('Please allow pop-ups to print');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.title = title;
  printWindow.document.close();
  printWindow.focus();

  // Wait for content to load before printing
  globalThis.setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Download HTML as PDF (opens print dialog with save as PDF option)
 */
export function downloadAsPDF(html: string, filename: string) {
  printHTML(html, filename);
}
