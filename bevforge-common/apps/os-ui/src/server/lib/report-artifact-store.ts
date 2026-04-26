import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { formatQuantityForUnit, formatVolumeNumber } from '../../lib/volume-format.js';
import { commissioningPaths, ensureCommissioningStore } from './commissioning-store.js';
import {
  listPackageLots,
  readBatchState,
  readInventoryMovements,
  readInventoryState,
} from './inventory-batch-store.js';
import { buildComplianceFeed } from './compliance-feed-store.js';

export type ReportType = 'batches' | 'packaging' | 'movements' | 'production' | 'compliance';
export type ReportArtifactFormat = 'csv' | 'html';

interface ReportSummaryCard {
  label: string;
  value: string;
  detail?: string;
}

interface ReportPreview {
  title: string;
  description: string;
  summaryCards: ReportSummaryCard[];
  columns: string[];
  rows: string[][];
  emptyText: string;
}

export interface ReportArtifactRecord {
  schemaVersion: string;
  id: string;
  reportType: ReportType;
  reportId?: string;
  reportTitle?: string;
  format: ReportArtifactFormat;
  siteId?: string;
  fileName: string;
  relativePath: string;
  absolutePath: string;
  contentType: string;
  createdAt: string;
  range: {
    from: string;
    to: string;
    label: string;
  };
}

interface ReportArtifactState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  artifacts: ReportArtifactRecord[];
}

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
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const csvEscape = (value: unknown): string => `"${String(value ?? '').replaceAll('"', '""')}"`;

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatDateTime = (value: string | undefined) => {
  const stamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(stamp) ? new Date(stamp).toLocaleString() : '--';
};

const formatDate = (value: string | undefined) => {
  const stamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(stamp) ? new Date(stamp).toLocaleDateString() : '--';
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const isWithinRange = (value: string | undefined, from: Date, to: Date) => {
  const stamp = value ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(stamp)) return false;
  return stamp >= from.getTime() && stamp <= to.getTime();
};

const sanitizeFileName = (value: string): string =>
  value
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'report';

const defaultArtifactState = (): ReportArtifactState => ({
  schemaVersion: '1.0.0',
  id: 'report-artifacts',
  updatedAt: nowIso(),
  artifacts: [],
});

const readReportArtifactState = async (): Promise<ReportArtifactState> => {
  await ensureCommissioningStore();
  return readJsonOrDefault<ReportArtifactState>(
    commissioningPaths.reportArtifactsFile,
    defaultArtifactState()
  );
};

const writeReportArtifactState = async (state: ReportArtifactState): Promise<void> => {
  await ensureCommissioningStore();
  await writeJson(commissioningPaths.reportArtifactsFile, state);
};

const buildRangeLabel = (from: Date, to: Date) => `${formatDate(from.toISOString())} to ${formatDate(to.toISOString())}`;

const buildReportPreview = async (params: {
  reportType: ReportType;
  from: Date;
  to: Date;
  siteId?: string;
}): Promise<ReportPreview> => {
  const siteId = params.siteId?.trim().toLowerCase() || undefined;
  const [batchState, packageLots, inventoryState, movementState] = await Promise.all([
    readBatchState(),
    listPackageLots(siteId ? { siteId } : {}),
    readInventoryState(),
    readInventoryMovements(),
  ]);

  const batches = (siteId
    ? batchState.batches.filter((batch) => String(batch.siteId).toLowerCase() === siteId)
    : batchState.batches
  ).filter((batch) => isWithinRange(batch.createdAt, params.from, params.to));

  const lots = packageLots.filter((lot) => isWithinRange(lot.createdAt, params.from, params.to));
  const inventoryItems = siteId
    ? inventoryState.items.filter((item) => String(item.siteId).toLowerCase() === siteId)
    : inventoryState.items;
  const movements = (siteId
    ? movementState.movements.filter((movement) => String(movement.siteId).toLowerCase() === siteId)
    : movementState.movements
  ).filter((movement) => isWithinRange(movement.createdAt, params.from, params.to));

  const inventoryItemById = new Map(inventoryItems.map((item) => [item.id, item] as const));
  const batchById = new Map(batchState.batches.map((batch) => [batch.id, batch] as const));

  if (params.reportType === 'batches') {
    const releasedCount = batches.filter((batch) => batch.status === 'released').length;
    const producedQty = sum(batches.map((batch) => Number(batch.producedQty)));
    return {
      title: 'Batch Report',
      description: 'Batches created in the selected range with production quantity and release state.',
      summaryCards: [
        { label: 'Batches', value: String(batches.length), detail: buildRangeLabel(params.from, params.to) },
        { label: 'Released', value: String(releasedCount), detail: 'ready for OPS handoff' },
        { label: 'Produced Qty', value: formatVolumeNumber(producedQty), detail: 'recorded output' },
      ],
      columns: ['Batch', 'Product', 'Status', 'Produced', 'Available', 'Created'],
      rows: batches
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map((batch) => {
          const available = Math.max(
            0,
            Number(batch.producedQty) - Number(batch.allocatedQty) - Number(batch.dispensedQty ?? 0)
          );
          return [
            batch.batchCode ?? batch.lotCode,
            batch.productSnapshot?.productCode ?? batch.recipeName,
            batch.status.replaceAll('_', ' '),
            `${formatVolumeNumber(Number(batch.producedQty))} ${batch.unit}`,
            `${formatVolumeNumber(available)} ${batch.unit}`,
            formatDateTime(batch.createdAt),
          ];
        }),
      emptyText: 'No batches fall inside this date range.',
    };
  }

  if (params.reportType === 'packaging') {
    const releasedLots = lots.filter((lot) => lot.releaseStatus === 'released' || lot.releaseStatus === 'shipped').length;
    const totalUnits = sum(lots.map((lot) => Number(lot.totalUnits)));
    const shippedUnits = sum(lots.map((lot) => Number(lot.shippedUnits)));
    return {
      title: 'Packaging Report',
      description: 'Package lots created in the selected range, tied back to source batch and sellable SKU.',
      summaryCards: [
        { label: 'Package Lots', value: String(lots.length), detail: buildRangeLabel(params.from, params.to) },
        { label: 'Released Lots', value: String(releasedLots), detail: 'released or shipped' },
        { label: 'Units Packaged', value: totalUnits.toFixed(0), detail: `${shippedUnits.toFixed(0)} shipped` },
      ],
      columns: ['Package Lot', 'Source Batch', 'SKU', 'Format', 'Release', 'Available', 'Created'],
      rows: lots
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map((lot) => {
          const available = Number(lot.totalUnits) - Number(lot.allocatedUnits) - Number(lot.shippedUnits);
          return [
            lot.packageLotCode ?? lot.lotCode,
            lot.batchCode ?? batchById.get(lot.batchId)?.batchCode ?? lot.batchId,
            lot.packageSkuId ?? lot.skuId ?? '--',
            lot.packageFormatCode ?? lot.packageType,
            lot.releaseStatus ?? 'held',
            `${Math.max(0, available).toFixed(0)} ${lot.unitOfMeasure ?? 'units'}`,
            formatDateTime(lot.createdAt),
          ];
        }),
      emptyText: 'No package lots fall inside this date range.',
    };
  }

  if (params.reportType === 'movements') {
    const shippedCount = movements.filter((movement) => movement.type === 'ship').length;
    const adjustedCount = movements.filter((movement) => movement.type === 'adjust').length;
    const movedQty = sum(movements.map((movement) => Number(movement.quantity)));
    return {
      title: 'Inventory Movement Report',
      description: 'Recorded ledger movements for production, packaging, removals, and corrections.',
      summaryCards: [
        { label: 'Movements', value: String(movements.length), detail: buildRangeLabel(params.from, params.to) },
        { label: 'Shipped', value: String(shippedCount), detail: 'movement rows' },
        { label: 'Adjusted Qty', value: formatVolumeNumber(movedQty), detail: `${adjustedCount} adjustments` },
      ],
      columns: ['When', 'Type', 'Item', 'Batch', 'Package Lot', 'Quantity', 'Reason'],
      rows: movements
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map((movement) => [
          formatDateTime(movement.createdAt),
          movement.type,
          inventoryItemById.get(movement.itemId)?.name ?? movement.itemId,
          movement.batchId ? batchById.get(movement.batchId)?.batchCode ?? movement.batchId : '--',
          movement.packageLotId
            ? packageLots.find((lot) => lot.id === movement.packageLotId)?.packageLotCode ?? movement.packageLotId
            : '--',
          `${formatQuantityForUnit(Number(movement.quantity), movement.unit)} ${movement.unit}`,
          movement.reasonCode ?? movement.reason ?? movement.actor ?? '--',
        ]),
      emptyText: 'No inventory movements fall inside this date range.',
    };
  }

  if (params.reportType === 'production') {
    const dailyMap = new Map<
      string,
      {
        batches: number;
        producedQty: number;
        packageLots: number;
        packagedUnits: number;
        shippedMoves: number;
      }
    >();
    for (const batch of batches) {
      const key = formatDate(batch.createdAt);
      const current = dailyMap.get(key) ?? {
        batches: 0,
        producedQty: 0,
        packageLots: 0,
        packagedUnits: 0,
        shippedMoves: 0,
      };
      current.batches += 1;
      current.producedQty += Number(batch.producedQty);
      dailyMap.set(key, current);
    }
    for (const lot of lots) {
      const key = formatDate(lot.createdAt);
      const current = dailyMap.get(key) ?? {
        batches: 0,
        producedQty: 0,
        packageLots: 0,
        packagedUnits: 0,
        shippedMoves: 0,
      };
      current.packageLots += 1;
      current.packagedUnits += Number(lot.totalUnits);
      dailyMap.set(key, current);
    }
    for (const movement of movements) {
      if (movement.type !== 'ship') continue;
      const key = formatDate(movement.createdAt);
      const current = dailyMap.get(key) ?? {
        batches: 0,
        producedQty: 0,
        packageLots: 0,
        packagedUnits: 0,
        shippedMoves: 0,
      };
      current.shippedMoves += 1;
      dailyMap.set(key, current);
    }
    const totalProducedQty = sum(batches.map((batch) => Number(batch.producedQty)));
    const totalPackagedUnits = sum(lots.map((lot) => Number(lot.totalUnits)));
    return {
      title: 'Production Summary Report',
      description: 'Range summary across batch creation, packaging output, and shipped movement activity.',
      summaryCards: [
        { label: 'Produced Qty', value: formatVolumeNumber(totalProducedQty), detail: `${batches.length} batches` },
        { label: 'Packaged Units', value: totalPackagedUnits.toFixed(0), detail: `${lots.length} package lots` },
        { label: 'Ship Movements', value: String(movements.filter((movement) => movement.type === 'ship').length), detail: buildRangeLabel(params.from, params.to) },
      ],
      columns: ['Date', 'Batches', 'Produced Qty', 'Package Lots', 'Units Packaged', 'Ship Moves'],
      rows: [...dailyMap.entries()]
        .sort(([left], [right]) => Date.parse(right) - Date.parse(left))
        .map(([date, row]) => [
          date,
          String(row.batches),
          formatVolumeNumber(row.producedQty),
          String(row.packageLots),
          row.packagedUnits.toFixed(0),
          String(row.shippedMoves),
        ]),
      emptyText: 'No production activity falls inside this date range.',
    };
  }

  const complianceFeed = await buildComplianceFeed({
    siteId,
    from: params.from.toISOString(),
    to: params.to.toISOString(),
    limit: 5000,
  });
  const complianceEvents = complianceFeed.events ?? [];
  return {
    title: 'Compliance Summary Report',
    description: 'Compliance event stream rollup for removals, losses, destruction, and audit support.',
    summaryCards: [
      { label: 'Events', value: String(complianceFeed.summary.totalEvents ?? 0), detail: buildRangeLabel(params.from, params.to) },
      {
        label: 'Loss / Destruction',
        value: String((complianceFeed.summary.byType.loss_recorded ?? 0) + (complianceFeed.summary.byType.destruction_recorded ?? 0)),
        detail: 'events recorded',
      },
      {
        label: 'Removals',
        value: String((complianceFeed.summary.byType.inventory_shipped ?? 0) + (complianceFeed.summary.byType.batch_shipped ?? 0)),
        detail: 'shipment/removal events',
      },
    ],
    columns: ['Occurred', 'Event', 'Batch / Lot', 'SKU', 'Quantity', 'Reason'],
    rows: complianceEvents
      .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
      .map((event) => [
        formatDateTime(event.occurredAt),
        event.eventType,
        event.lotCode ?? event.batchId ?? '--',
        event.skuId ?? '--',
        event.quantity ? `${event.quantity.value} ${event.quantity.uom}` : '--',
        event.reasonCode ?? event.reasonMessage ?? event.sourceRecord?.recordType ?? '--',
      ]),
    emptyText: 'No compliance events fall inside this date range.',
  };
};

const buildCsvContent = (preview: ReportPreview): string =>
  [
    preview.columns.map(csvEscape).join(','),
    ...preview.rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n');

const buildHtmlContent = (preview: ReportPreview, rangeLabel: string): string => {
  const summaryHtml = preview.summaryCards
    .map(
      (card) => `
        <div class="summary-card">
          <div class="summary-label">${escapeHtml(card.label)}</div>
          <div class="summary-value">${escapeHtml(card.value)}</div>
          <div class="summary-detail">${escapeHtml(card.detail ?? '')}</div>
        </div>
      `
    )
    .join('');
  const tableHead = preview.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const tableRows = preview.rows
    .map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`)
    .join('');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(preview.title)} — ${escapeHtml(rangeLabel)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
      h1 { margin: 0 0 6px; font-size: 24px; }
      p { margin: 0 0 12px; color: #4b5563; }
      .meta { margin-bottom: 24px; font-size: 12px; color: #6b7280; }
      .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
      .summary-card { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; }
      .summary-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 8px; }
      .summary-value { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      .summary-detail { font-size: 12px; color: #6b7280; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; font-size: 12px; }
      th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      @media print { @page { size: letter; margin: 0.5in; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(preview.title)}</h1>
    <p>${escapeHtml(preview.description)}</p>
    <div class="meta">Range: ${escapeHtml(rangeLabel)} • Generated ${escapeHtml(new Date().toLocaleString())}</div>
    <div class="summary-grid">${summaryHtml}</div>
    <table>
      <thead><tr>${tableHead}</tr></thead>
      <tbody>${tableRows || `<tr><td colspan="${preview.columns.length}">${escapeHtml(preview.emptyText)}</td></tr>`}</tbody>
    </table>
  </body>
</html>`;
};

export const createReportArtifact = async (params: {
  reportType: ReportType;
  format: ReportArtifactFormat;
  from: string;
  to: string;
  siteId?: string;
  fileName?: string;
  reportId?: string;
  reportTitle?: string;
}): Promise<ReportArtifactRecord> => {
  await ensureCommissioningStore();
  const from = new Date(params.from);
  const to = new Date(params.to);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) {
    throw new Error('from and to must be valid ISO date values.');
  }
  const preview = await buildReportPreview({
    reportType: params.reportType,
    from,
    to,
    siteId: params.siteId,
  });
  const extension = params.format === 'csv' ? 'csv' : 'html';
  const baseName = sanitizeFileName(
    params.fileName || `${params.reportType}-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}`
  );
  const id = randomUUID();
  const stampedName = `${baseName}-${id.slice(0, 8)}.${extension}`;
  const relativePath = path.join('reports', stampedName);
  const absolutePath = path.join(commissioningPaths.root, relativePath);
  const content =
    params.format === 'csv'
      ? buildCsvContent(preview)
      : buildHtmlContent(preview, buildRangeLabel(from, to));
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');

  const artifact: ReportArtifactRecord = {
    schemaVersion: '1.0.0',
    id,
    reportType: params.reportType,
    reportId: params.reportId?.trim() || undefined,
    reportTitle: params.reportTitle?.trim() || undefined,
    format: params.format,
    siteId: params.siteId?.trim().toLowerCase() || undefined,
    fileName: stampedName,
    relativePath,
    absolutePath,
    contentType: params.format === 'csv' ? 'text/csv; charset=utf-8' : 'text/html; charset=utf-8',
    createdAt: nowIso(),
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: buildRangeLabel(from, to),
    },
  };

  const state = await readReportArtifactState();
  await writeReportArtifactState({
    ...state,
    updatedAt: nowIso(),
    artifacts: [artifact, ...state.artifacts].slice(0, 500),
  });
  return artifact;
};

export const createInlineReportArtifact = async (params: {
  reportType: ReportType;
  format: ReportArtifactFormat;
  from: string;
  to: string;
  siteId?: string;
  fileName?: string;
  content: string;
  contentType?: string;
  reportId?: string;
  reportTitle?: string;
}): Promise<ReportArtifactRecord> => {
  await ensureCommissioningStore();
  const from = new Date(params.from);
  const to = new Date(params.to);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) {
    throw new Error('from and to must be valid ISO date values.');
  }
  const extension = params.format === 'csv' ? 'csv' : 'html';
  const baseName = sanitizeFileName(
    params.fileName || `${params.reportType}-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}`
  );
  const id = randomUUID();
  const stampedName = `${baseName}-${id.slice(0, 8)}.${extension}`;
  const relativePath = path.join('reports', stampedName);
  const absolutePath = path.join(commissioningPaths.root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, params.content, 'utf8');

  const artifact: ReportArtifactRecord = {
    schemaVersion: '1.0.0',
    id,
    reportType: params.reportType,
    reportId: params.reportId?.trim() || undefined,
    reportTitle: params.reportTitle?.trim() || undefined,
    format: params.format,
    siteId: params.siteId?.trim().toLowerCase() || undefined,
    fileName: stampedName,
    relativePath,
    absolutePath,
    contentType:
      params.contentType?.trim() ||
      (params.format === 'csv' ? 'text/csv; charset=utf-8' : 'text/html; charset=utf-8'),
    createdAt: nowIso(),
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: buildRangeLabel(from, to),
    },
  };

  const state = await readReportArtifactState();
  await writeReportArtifactState({
    ...state,
    updatedAt: nowIso(),
    artifacts: [artifact, ...state.artifacts].slice(0, 500),
  });
  return artifact;
};

export const listReportArtifacts = async (): Promise<ReportArtifactRecord[]> => {
  const state = await readReportArtifactState();
  return state.artifacts;
};

export const getReportArtifactById = async (
  artifactId: string
): Promise<ReportArtifactRecord | null> => {
  const state = await readReportArtifactState();
  return state.artifacts.find((artifact) => artifact.id === artifactId) ?? null;
};
