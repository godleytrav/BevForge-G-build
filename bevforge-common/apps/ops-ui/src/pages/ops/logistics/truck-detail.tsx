import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { OpsCalendarSyncDevPanel } from '@/components/ops/OpsCalendarSyncDevPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { makeOpsCalendarRecordId, postOpsCalendarEvent } from '@/lib/ops-calendar';
import { buildOpsMobileRoutesLink } from '@/lib/ops-mobile-links';
import { normalizeScannedIdentifier } from '@/lib/driver-scan';
import { fetchOpsPackageUnits, type OpsPackageUnitRecord } from '@/lib/package-units';
import { printHTML } from '@/lib/printing';
import { generateQRCode } from '@/lib/qr-code';
import { ArrowLeft, Boxes, Printer, QrCode, Route, ScanLine, Truck } from 'lucide-react';
import {
  buildSiteSummaries,
  buildRouteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  formatDate,
  getDeliveryScanEvents,
  getTruckDispatchSnapshot,
  getTruckPlanningPreferences,
  getTruckRouteProgress,
  getVehicleCapacity,
  recordDeliveryScanEvent,
  getSiteProfile,
  saveTruckRouteProgress,
  type LogisticsOrder,
  type LogisticsTruckProfile,
  type TruckPlanningPreference,
  type TruckDispatchSnapshot,
  type TruckRouteProgress,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

type ScanFeedbackTone = 'delivered' | 'duplicate' | 'invalid-stop';

interface ScanFeedback {
  tone: ScanFeedbackTone;
  message: string;
}

interface TruckStopEntry {
  stopId: string;
  stopName: string;
  orders: LogisticsOrder[];
}

interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  createOscillator: () => {
    type: string;
    frequency: { setValueAtTime: (value: number, startTime: number) => void };
    connect: (destination: unknown) => void;
    start: (when?: number) => void;
    stop: (when?: number) => void;
  };
  createGain: () => {
    gain: {
      setValueAtTime: (value: number, startTime: number) => void;
      exponentialRampToValueAtTime: (value: number, endTime: number) => void;
    };
    connect: (destination: unknown) => void;
  };
  close: () => Promise<void>;
}

type AudioContextCtorLike = new () => AudioContextLike;

const getStatusBadgeClass = (status: LogisticsTruckProfile['status']): string => {
  switch (status) {
    case 'on-route':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'loading':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'maintenance':
      return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    default:
      return 'bg-green-500/20 text-green-300 border-green-500/40';
  }
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const buildDispatchPacketHtml = (
  truckName: string,
  truckId: string,
  snapshot: TruckDispatchSnapshot,
  orders: LogisticsOrder[]
): string => {
  const totalUnits = orders.reduce(
    (sum, order) => sum + order.lineItems.reduce((lineSum, line) => lineSum + line.quantity, 0),
    0
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Dispatch Packet - ${escapeHtml(truckName)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin: 0 0 6px; font-size: 26px; }
          h2 { margin: 24px 0 10px; font-size: 18px; }
          .meta { margin: 0 0 4px; font-size: 13px; color: #4b5563; }
          .panel { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-top: 16px; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .summary-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
          .summary-label { font-size: 11px; text-transform: uppercase; color: #6b7280; }
          .summary-value { margin-top: 4px; font-size: 15px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; text-transform: uppercase; font-size: 11px; color: #374151; }
          ul { margin: 8px 0 0 18px; }
          @media print { @page { size: letter; margin: 0.5in; } }
        </style>
      </head>
      <body>
        <h1>OPS Dispatch Packet</h1>
        <p class="meta">Truck: ${escapeHtml(truckName)} (${escapeHtml(truckId)})</p>
        <p class="meta">Shipping ID: ${escapeHtml(snapshot.packagingId)}</p>
        <p class="meta">Destination: ${escapeHtml(snapshot.destination)}</p>
        <p class="meta">Dispatched: ${escapeHtml(new Date(snapshot.dispatchedAt).toLocaleString())}</p>

        <div class="panel">
          <div class="summary-grid">
            <div class="summary-item"><div class="summary-label">Loaded Items</div><div class="summary-value">${snapshot.totalItems}</div></div>
            <div class="summary-item"><div class="summary-label">Weight</div><div class="summary-value">${snapshot.totalWeightLb} lb</div></div>
            <div class="summary-item"><div class="summary-label">Volume</div><div class="summary-value">${snapshot.totalVolumeFt3} ft^3</div></div>
            <div class="summary-item"><div class="summary-label">Manifest Orders</div><div class="summary-value">${orders.length}</div></div>
            <div class="summary-item"><div class="summary-label">Manifest Units</div><div class="summary-value">${totalUnits}</div></div>
          </div>
        </div>

        <h2>Loaded Packaging IDs</h2>
        <div class="panel">
          ${
            snapshot.loadedPackagingIds.length === 0
              ? '<p class="meta">No package IDs recorded from canvas payload.</p>'
              : `<ul>${snapshot.loadedPackagingIds
                  .map((id) => `<li>${escapeHtml(id)}</li>`)
                  .join('')}</ul>`
          }
        </div>

        <h2>Manifest Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Client</th>
              <th>Status</th>
              <th>Delivery Date</th>
              <th>Line Items</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              orders.length === 0
                ? '<tr><td colspan="6">No orders assigned to this truck.</td></tr>'
                : orders
                    .map((order) => {
                      const lines =
                        order.lineItems.length === 0
                          ? 'No line items'
                          : order.lineItems
                              .map(
                                (line) =>
                                  `${escapeHtml(line.productName)} (${line.quantity} ${escapeHtml(line.containerType)})`
                              )
                              .join('<br/>');

                      return `
                        <tr>
                          <td>${escapeHtml(order.orderNumber)}</td>
                          <td>${escapeHtml(order.customerName)}</td>
                          <td>${escapeHtml(order.status)}</td>
                          <td>${escapeHtml(formatDate(order.deliveryDate))}</td>
                          <td>${lines}</td>
                          <td>${escapeHtml(formatMoney(order.totalAmount))}</td>
                        </tr>
                      `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </body>
    </html>
  `;
};

const buildDeliverySheetHtml = (truckName: string, truckId: string, stops: TruckStopEntry[]): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Delivery Sheet - ${escapeHtml(truckName)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin: 0 0 6px; font-size: 26px; }
          .meta { margin: 0 0 4px; font-size: 13px; color: #4b5563; }
          .stop { border: 1px solid #d1d5db; border-radius: 8px; margin-top: 14px; padding: 12px; }
          .stop h2 { margin: 0; font-size: 18px; }
          .stop p { margin: 6px 0; font-size: 12px; color: #4b5563; }
          .checklist { margin: 8px 0 0 0; padding: 0; list-style: none; }
          .checklist li { margin: 4px 0; font-size: 12px; }
          .box { display: inline-block; width: 14px; height: 14px; border: 1px solid #374151; margin-right: 8px; vertical-align: middle; }
          @media print { @page { size: letter; margin: 0.5in; } }
        </style>
      </head>
      <body>
        <h1>OPS Delivery Sheet</h1>
        <p class="meta">Truck: ${escapeHtml(truckName)} (${escapeHtml(truckId)})</p>
        <p class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</p>

        ${
          stops.length === 0
            ? '<p class="meta">No stops assigned.</p>'
            : stops
                .map((stop, index) => {
                  const allLines = stop.orders.flatMap((order) =>
                    order.lineItems.map((line) => ({
                      orderNumber: order.orderNumber,
                      productName: line.productName,
                      containerType: line.containerType,
                      quantity: line.quantity,
                    }))
                  );
                  return `
                    <section class="stop">
                      <h2>Stop ${index + 1}: ${escapeHtml(stop.stopName)}</h2>
                      <p>${stop.orders.length} orders · ${allLines.length} line items</p>
                      <ul class="checklist">
                        ${
                          allLines.length === 0
                            ? '<li><span class="box"></span>No manifest lines at this stop</li>'
                            : allLines
                                .map(
                                  (line) =>
                                    `<li><span class="box"></span>${escapeHtml(line.orderNumber)} · ${escapeHtml(
                                      line.productName
                                    )} (${line.quantity} ${escapeHtml(line.containerType)})</li>`
                                )
                                .join('')
                        }
                      </ul>
                    </section>
                  `;
                })
                .join('')
        }
      </body>
    </html>
  `;
};

const buildPayloadQrHtml = (
  truckName: string,
  truckId: string,
  snapshot: TruckDispatchSnapshot
): string => {
  const payload =
    buildOpsMobileRoutesLink({
      truckId,
      shippingId: snapshot.packagingId,
      destination: snapshot.destination,
    }) ??
    JSON.stringify({
      type: 'ops_dispatch_payload',
      truckId,
      shippingId: snapshot.packagingId,
      destination: snapshot.destination,
      dispatchedAt: snapshot.dispatchedAt,
      loadedPackagingIds: snapshot.loadedPackagingIds,
    });
  const qr = generateQRCode(payload, { size: 360 });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Payload QR - ${escapeHtml(truckName)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; text-align: center; color: #111827; }
          h1 { margin: 0 0 12px; font-size: 26px; }
          .meta { margin: 4px 0; font-size: 13px; color: #4b5563; }
          img { margin-top: 16px; border: 1px solid #d1d5db; padding: 12px; border-radius: 10px; width: 360px; height: 360px; }
          @media print { @page { size: letter; margin: 0.5in; } }
        </style>
      </head>
      <body>
        <h1>Truck Payload QR</h1>
        <p class="meta">Truck: ${escapeHtml(truckName)} (${escapeHtml(truckId)})</p>
        <p class="meta">Shipping ID: ${escapeHtml(snapshot.packagingId)}</p>
        <p class="meta">Destination: ${escapeHtml(snapshot.destination)}</p>
        <img src="${qr}" alt="payload qr"/>
      </body>
    </html>
  `;
};

export default function OpsLogisticsTruckDetailPage() {
  const { truckId } = useParams();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [packageUnits, setPackageUnits] = useState<OpsPackageUnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanValue, setScanValue] = useState('');
  const [progress, setProgress] = useState<TruckRouteProgress | null>(null);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [nextOrders, nextFleet, packageUnitState] = await Promise.all([
        fetchLogisticsOrders(),
        fetchFleetProfiles(),
        fetchOpsPackageUnits(),
      ]);
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setFleet(nextFleet);
      setPackageUnits(packageUnitState.units);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const detail = useMemo(() => {
    if (!truckId) {
      return undefined;
    }

    const routes = buildRouteSummaries(orders);
    const assignments = buildTruckAssignments(routes, fleet);
    const assignment = assignments.find((candidate) => candidate.truck.id === truckId);
    if (!assignment) {
      return undefined;
    }

    const assignedRoutes = routes.filter((route) => assignment.routeIds.includes(route.id));
    const manifestOrders = assignedRoutes.flatMap((route) => route.orders);

    return {
      assignment,
      assignedRoutes,
      manifestOrders,
    };
  }, [orders, fleet, truckId]);

  const planningPreference = useMemo<TruckPlanningPreference | null>(() => {
    if (!truckId) {
      return null;
    }
    return getTruckPlanningPreferences().find((entry) => entry.truckId === truckId) ?? null;
  }, [truckId]);

  const stops = useMemo<TruckStopEntry[]>(() => {
    if (!detail) {
      return [];
    }
    const map = new Map<string, TruckStopEntry>();
    detail.manifestOrders.forEach((order) => {
      const stopId = order.customerId || order.customerName;
      const existing = map.get(stopId);
      if (existing) {
        existing.orders.push(order);
      } else {
        map.set(stopId, {
          stopId,
          stopName: order.customerName,
          orders: [order],
        });
      }
    });
    const manifestStops = Array.from(map.values());
    if (manifestStops.length > 0) {
      return manifestStops;
    }

    if (planningPreference?.targetType === 'site' && planningPreference.targetId) {
      const site = buildSiteSummaries(orders).find((entry) => entry.id === planningPreference.targetId);
      const profile = getSiteProfile(
        planningPreference.targetId,
        site?.name ?? planningPreference.targetId
      );
      return [
        {
          stopId: planningPreference.targetId,
          stopName: site?.name ?? profile.siteName ?? planningPreference.targetId,
          orders: [],
        },
      ];
    }

    return manifestStops;
  }, [detail, planningPreference, orders]);

  const payloadUnits = useMemo(() => {
    if (!truckId) {
      return [];
    }
    const snapshot = getTruckDispatchSnapshot(truckId);
    return packageUnits
      .filter((unit) => {
        if (unit.currentLocationId === truckId) {
          return true;
        }
        if (snapshot?.loadedPackagingIds.includes(unit.unitCode)) {
          return true;
        }
        if (snapshot && unit.parentUnitCode === snapshot.packagingId) {
          return true;
        }
        return false;
      })
      .sort((left, right) => left.unitCode.localeCompare(right.unitCode));
  }, [packageUnits, truckId]);

  useEffect(() => {
    if (!truckId) {
      return;
    }
    setProgress(getTruckRouteProgress(truckId));
  }, [truckId]);

  const persistProgress = (next: TruckRouteProgress) => {
    setProgress(next);
    saveTruckRouteProgress(next);
  };

  const playScanTone = (tone: ScanFeedbackTone) => {
    if (typeof window === 'undefined') {
      return;
    }
    const windowAudio = window as unknown as {
      AudioContext?: AudioContextCtorLike;
      webkitAudioContext?: AudioContextCtorLike;
    };
    const AudioContextRef = windowAudio.AudioContext ?? windowAudio.webkitAudioContext;
    if (!AudioContextRef) {
      return;
    }
    const context = new AudioContextRef();
    const now = context.currentTime;

    const sequence: Array<{ freq: number; duration: number }> =
      tone === 'delivered'
        ? [
            { freq: 920, duration: 0.07 },
            { freq: 1220, duration: 0.09 },
          ]
        : tone === 'duplicate'
          ? [{ freq: 420, duration: 0.16 }]
          : [{ freq: 210, duration: 0.22 }];

    sequence.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.freq, now);
      gain.gain.setValueAtTime(0.0001, now);

      const startAt = now + index * 0.11;
      oscillator.connect(gain);
      gain.connect(context.destination);
      gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);

      oscillator.start(startAt);
      oscillator.stop(startAt + note.duration);
    });

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 500);
  };

  const reportScanFeedback = (feedback: ScanFeedback) => {
    setScanFeedback(feedback);
    playScanTone(feedback.tone);
  };

  const startRoute = () => {
    if (!truckId) {
      return;
    }
    const next: TruckRouteProgress = {
      truckId,
      routeActive: true,
      currentStopIndex: 0,
      lastCompletedStopName: undefined,
      deliveredByStop: progress?.deliveredByStop ?? {},
      updatedAt: new Date().toISOString(),
    };
    persistProgress(next);

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId('ops-logistics-route-start', truckId),
      title: `Route Started: ${detail?.assignment.truck.name ?? truckId}`,
      description: stops.length > 0 ? `First stop: ${stops[0]?.stopName ?? 'Unassigned'}` : 'No assigned stops.',
      type: 'delivery',
      status: 'in_progress',
      startAt: next.updatedAt,
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-route-start',
        truckId,
        truckName: detail?.assignment.truck.name,
        stopCount: stops.length,
      },
    });
  };

  const nextStop = () => {
    if (!progress || stops.length === 0) {
      return;
    }
    const currentStop = stops[progress.currentStopIndex];
    const atEnd = progress.currentStopIndex >= stops.length - 1;
    const next: TruckRouteProgress = {
      ...progress,
      routeActive: !atEnd,
      currentStopIndex: atEnd ? progress.currentStopIndex : progress.currentStopIndex + 1,
      lastCompletedStopName: currentStop?.stopName,
      updatedAt: new Date().toISOString(),
    };
    persistProgress(next);

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId(
        'ops-logistics-route-progress',
        truckId ?? '',
        currentStop?.stopId,
        next.currentStopIndex
      ),
      siteId: currentStop?.stopId,
      title: atEnd
        ? `Route Progress: ${detail?.assignment.truck.name ?? truckId} completed final stop`
        : `Route Progress: ${detail?.assignment.truck.name ?? truckId} advanced to next stop`,
      description: atEnd
        ? `Last completed stop: ${currentStop?.stopName ?? 'Unknown'}`
        : `Completed ${currentStop?.stopName ?? 'stop'}; next stop ${stops[next.currentStopIndex]?.stopName ?? 'N/A'}.`,
      type: 'delivery',
      status: atEnd ? 'completed' : 'in_progress',
      startAt: next.updatedAt,
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-route-progress',
        truckId,
        truckName: detail?.assignment.truck.name,
        completedStopId: currentStop?.stopId,
        completedStopName: currentStop?.stopName,
        nextStopId: stops[next.currentStopIndex]?.stopId,
        nextStopName: stops[next.currentStopIndex]?.stopName,
        atEnd,
      },
    });
  };

  const completeStop = () => {
    if (!progress || !progress.routeActive || stops.length === 0) {
      return;
    }
    nextStop();
  };

  const endRoute = () => {
    if (!progress) {
      return;
    }
    const next: TruckRouteProgress = {
      ...progress,
      routeActive: false,
      updatedAt: new Date().toISOString(),
    };
    persistProgress(next);

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId('ops-logistics-route-end', truckId ?? ''),
      title: `Route Ended: ${detail?.assignment.truck.name ?? truckId}`,
      description: progress.lastCompletedStopName
        ? `Last completed stop: ${progress.lastCompletedStopName}`
        : 'Route ended with no completed stops.',
      type: 'delivery',
      status: 'completed',
      startAt: next.updatedAt,
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-route-end',
        truckId,
        truckName: detail?.assignment.truck.name,
        lastCompletedStopName: progress.lastCompletedStopName,
      },
    });
  };

  const markScannedDelivered = () => {
    if (!truckId || !progress || !progress.routeActive || stops.length === 0) {
      reportScanFeedback({ tone: 'invalid-stop', message: 'Invalid stop: route is not active.' });
      return;
    }
    const normalizedScan = normalizeScannedIdentifier(scanValue);
    const scanId = normalizedScan.identifier.trim();
    if (!scanId) {
      reportScanFeedback({ tone: 'invalid-stop', message: 'Invalid stop: scan cannot be empty.' });
      return;
    }
    const currentStop = stops[progress.currentStopIndex];
    if (!currentStop) {
      reportScanFeedback({ tone: 'invalid-stop', message: 'Invalid stop: no current stop selected.' });
      return;
    }

    const existingForStop = progress.deliveredByStop[currentStop.stopId] ?? [];
    if (existingForStop.includes(scanId)) {
      setScanValue('');
      reportScanFeedback({
        tone: 'duplicate',
        message: `Duplicate scan: ${scanId} already marked delivered at ${currentStop.stopName}.`,
      });
      return;
    }

    const scannedAtOtherStop = Object.entries(progress.deliveredByStop).find(
      ([stopId, ids]) => stopId !== currentStop.stopId && ids.includes(scanId)
    );
    if (scannedAtOtherStop) {
      const stopName = stops.find((stop) => stop.stopId === scannedAtOtherStop[0])?.stopName ?? scannedAtOtherStop[0];
      setScanValue('');
      reportScanFeedback({
        tone: 'invalid-stop',
        message: `Invalid stop: ${scanId} was already delivered at ${stopName}.`,
      });
      return;
    }

    const targetOrder = currentStop.orders[existingForStop.length % Math.max(1, currentStop.orders.length)];
    const deliveryEvent = recordDeliveryScanEvent({
      orderId: targetOrder?.id ?? `ops-route-${truckId}-${currentStop.stopId}`,
      truckId,
      stopId: currentStop.stopId,
      stopName: currentStop.stopName,
      scannedId: scanId,
      eventType: 'delivered',
    });

    const next: TruckRouteProgress = {
      ...progress,
      deliveredByStop: {
        ...progress.deliveredByStop,
        [currentStop.stopId]: [...existingForStop, scanId],
      },
      updatedAt: new Date().toISOString(),
    };
    persistProgress(next);
    setScanValue('');
    reportScanFeedback({
      tone: 'delivered',
      message: `Delivered: ${scanId} recorded at ${currentStop.stopName}.`,
    });

    void postOpsCalendarEvent({
      sourceRecordId: deliveryEvent.id,
      siteId: currentStop.stopId,
      title: `Delivered: ${scanId}`,
      description: `${currentStop.stopName} · Truck ${detail?.assignment.truck.name ?? truckId}`,
      type: 'delivery',
      status: 'completed',
      startAt: deliveryEvent.deliveredAt,
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-scan-delivered',
        truckId,
        stopId: currentStop.stopId,
        stopName: currentStop.stopName,
        scannedId: scanId,
        orderId: targetOrder?.id,
        scannedRawValue: normalizedScan.rawValue,
        scannedQrType: normalizedScan.qrType,
      },
    });
  };

  const markScannedReturned = () => {
    if (!truckId || !progress || !progress.routeActive || stops.length === 0) {
      reportScanFeedback({ tone: 'invalid-stop', message: 'Invalid stop: route is not active.' });
      return;
    }
    const normalizedScan = normalizeScannedIdentifier(scanValue);
    const scanId = normalizedScan.identifier.trim();
    if (!scanId) {
      reportScanFeedback({ tone: 'invalid-stop', message: 'Invalid stop: scan cannot be empty.' });
      return;
    }
    const currentStop = stops[progress.currentStopIndex];
    if (!currentStop) {
      reportScanFeedback({ tone: 'invalid-stop', message: 'Invalid stop: no current stop selected.' });
      return;
    }

    const stopEvents = getDeliveryScanEvents(undefined).filter((event) => event.stopId === currentStop.stopId);
    const alreadyReturned = stopEvents.some(
      (event) => event.scannedId === scanId && event.eventType === 'returned'
    );
    if (alreadyReturned) {
      setScanValue('');
      reportScanFeedback({
        tone: 'duplicate',
        message: `Duplicate return: ${scanId} already marked returned at ${currentStop.stopName}.`,
      });
      return;
    }

    const deliveredAtStop = stopEvents.some(
      (event) => event.scannedId === scanId && event.eventType === 'delivered'
    );
    if (!deliveredAtStop) {
      reportScanFeedback({
        tone: 'invalid-stop',
        message: `Invalid return: ${scanId} has no delivered record at ${currentStop.stopName}.`,
      });
      return;
    }

    const targetOrder = currentStop.orders[0];
    const returnEvent = recordDeliveryScanEvent({
      orderId: targetOrder?.id ?? `ops-route-${truckId}-${currentStop.stopId}`,
      truckId,
      stopId: currentStop.stopId,
      stopName: currentStop.stopName,
      scannedId: scanId,
      eventType: 'returned',
    });

    setScanValue('');
    reportScanFeedback({
      tone: 'delivered',
      message: `Returned: ${scanId} recorded at ${currentStop.stopName}.`,
    });

    void postOpsCalendarEvent({
      sourceRecordId: returnEvent.id,
      siteId: currentStop.stopId,
      title: `Returned: ${scanId}`,
      description: `${currentStop.stopName} · Truck ${detail?.assignment.truck.name ?? truckId}`,
      type: 'delivery',
      status: 'completed',
      startAt: returnEvent.deliveredAt,
      links: {
        openPath: `/ops/logistics/trucks/${truckId}`,
      },
      metadata: {
        origin: 'ops-logistics-scan-returned',
        truckId,
        stopId: currentStop.stopId,
        stopName: currentStop.stopName,
        scannedId: scanId,
        orderId: targetOrder?.id,
        scannedRawValue: normalizedScan.rawValue,
        scannedQrType: normalizedScan.qrType,
      },
    });
  };

  if (loading) {
    return (
      <AppShell pageTitle="OPS Truck Details" currentSuite="ops">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading truck details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!detail) {
    return (
      <AppShell pageTitle="OPS Truck Details" currentSuite="ops">
        <div className="space-y-6">
          <Button variant="outline" asChild>
            <Link to="/ops/logistics/trucks" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Truck Board
            </Link>
          </Button>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle>Truck Not Found</CardTitle>
              <CardDescription>
                This truck id is not configured in the current logistics fleet profile.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  const { assignment, assignedRoutes, manifestOrders } = detail;
  const dispatchSnapshot = truckId ? getTruckDispatchSnapshot(truckId) : null;
  const safeProgress =
    progress ??
    (truckId
      ? getTruckRouteProgress(truckId)
      : {
          truckId: '',
          routeActive: false,
          currentStopIndex: 0,
          lastCompletedStopName: undefined,
          deliveredByStop: {},
          updatedAt: new Date().toISOString(),
        });
  const currentStop = stops[safeProgress.currentStopIndex];
  const stopsAhead = safeProgress.routeActive ? Math.max(0, stops.length - safeProgress.currentStopIndex - 1) : 0;
  const deliveredAtCurrentStop = currentStop ? safeProgress.deliveredByStop[currentStop.stopId]?.length ?? 0 : 0;
  const vehicleCapacity = getVehicleCapacity(assignment.truck.vehicleType);
  const printDispatchPacket = () => {
    if (!dispatchSnapshot || !truckId) {
      return;
    }
    const html = buildDispatchPacketHtml(
      assignment.truck.name,
      truckId,
      dispatchSnapshot,
      manifestOrders
    );
    printHTML(html, `Dispatch Packet - ${assignment.truck.name}`);
  };

  const printDeliverySheet = () => {
    if (!truckId) {
      return;
    }
    const html = buildDeliverySheetHtml(assignment.truck.name, truckId, stops);
    printHTML(html, `Delivery Sheet - ${assignment.truck.name}`);
  };

  const printPayloadQr = () => {
    if (!dispatchSnapshot || !truckId) {
      return;
    }
    const html = buildPayloadQrHtml(assignment.truck.name, truckId, dispatchSnapshot);
    printHTML(html, `Payload QR - ${assignment.truck.name}`);
  };

  return (
    <AppShell pageTitle={`OPS Truck — ${assignment.truck.name}`} currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/ops/logistics/trucks" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Truck Board
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/ops/logistics/driver/${assignment.truck.id}`} className="gap-2">
                  <ScanLine className="h-4 w-4" />
                  Driver App
                </Link>
              </Button>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-foreground">{assignment.truck.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{assignment.truck.id}</p>
          </div>
          <Badge className={getStatusBadgeClass(assignment.status)}>
            {dispatchSnapshot?.readiness === 'ready-for-delivery'
              ? 'ready for delivery'
              : assignment.status.replace('-', ' ')}
          </Badge>
        </div>

        {dispatchSnapshot && (
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ready Payload Snapshot</CardTitle>
              <CardDescription>Loaded from OPS canvas dispatch action.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipping ID</p>
                <p className="text-sm font-semibold">{dispatchSnapshot.packagingId}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Payload</p>
                <p className="text-sm font-semibold">{dispatchSnapshot.totalItems} items</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Weight</p>
                <p className="text-sm font-semibold">{dispatchSnapshot.totalWeightLb} lb</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Volume</p>
                <p className="text-sm font-semibold">{dispatchSnapshot.totalVolumeFt3} ft^3</p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3 md:col-span-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Destination</p>
                <p className="text-sm font-semibold">{dispatchSnapshot.destination}</p>
                <p className="text-xs text-muted-foreground">
                  Dispatched {new Date(dispatchSnapshot.dispatchedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-4">
                <Button size="sm" variant="outline" className="gap-2" onClick={printDispatchPacket}>
                  <Printer className="h-4 w-4" />
                  Print Dispatch Packet
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={printDeliverySheet}>
                  <Printer className="h-4 w-4" />
                  Print Delivery Sheet
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={printPayloadQr}>
                  <QrCode className="h-4 w-4" />
                  Print Payload QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Boxes className="h-4 w-4" />
              QR-Linked Payload Manifest
            </CardTitle>
            <CardDescription>
              Package units currently tied to this truck from the OPS package-unit ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payloadUnits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No package units are currently linked to this truck. Build and mark payloads ready in the logistics canvas first.
              </p>
            ) : (
              <div className="space-y-2">
                {payloadUnits.map((unit) => (
                  <div
                    key={unit.unitId}
                    className="rounded-lg border border-border/70 bg-background/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{unit.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {unit.unitCode} · {unit.productName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/40">
                          {unit.unitType}
                        </Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-500/40">
                          {unit.status.replaceAll('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <p>Product Code: {unit.productCode ?? 'Not set'}</p>
                      <p>SKU: {unit.skuId ?? 'Not set'}</p>
                      <p>Client: {unit.assignedSiteName ?? 'Not assigned'}</p>
                      <p>Batch: {unit.batchCode ?? 'Not set'}</p>
                      <p>Package Lot: {unit.packageLotCode ?? 'Not set'}</p>
                      <p>Asset: {unit.assetCode ?? 'Not set'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <OpsCalendarSyncDevPanel
          originPrefix="ops-logistics"
          title="Truck Route Calendar Sync (DEV)"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assigned Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{assignment.routeCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assigned Stops</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{assignment.stopCount}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Manifest Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{manifestOrders.length}</p>
            </CardContent>
          </Card>

          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{assignment.truck.driver}</p>
              <p className="text-xs text-muted-foreground">{assignment.truck.homeBase}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {vehicleCapacity.label} · {vehicleCapacity.maxPayloadLb} lb payload
              </p>
            </CardContent>
          </Card>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="h-4 w-4" />
              Route Runner
            </CardTitle>
            <CardDescription>Start route, move stop-by-stop, and mark scanned packages delivered.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="sticky top-2 z-10 rounded-lg border border-border/70 bg-background/95 px-3 py-2 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {safeProgress.routeActive
                      ? `Current: ${currentStop?.stopName ?? 'N/A'} · Stops ahead: ${stopsAhead}`
                      : 'Route not started'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={startRoute} disabled={safeProgress.routeActive || stops.length === 0}>
                      Start Route
                    </Button>
                    <Button size="sm" variant="outline" onClick={nextStop} disabled={!safeProgress.routeActive || stops.length === 0}>
                      Next Stop
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={completeStop}
                      disabled={!safeProgress.routeActive || stops.length === 0}
                    >
                      Complete Stop
                    </Button>
                    <Button size="sm" variant="destructive" onClick={endRoute} disabled={!safeProgress.routeActive}>
                      End Route
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-background/20 px-4 py-3 text-sm">
                <p className="font-medium">
                  {safeProgress.routeActive
                    ? `Current stop: ${currentStop?.stopName ?? 'N/A'}`
                    : 'Route not started'}
                </p>
                {safeProgress.lastCompletedStopName && (
                  <p className="text-muted-foreground">Last stop: {safeProgress.lastCompletedStopName}</p>
                )}
                <p className="text-muted-foreground">Stops ahead: {stopsAhead}</p>
                {safeProgress.routeActive && currentStop && (
                  <p className="text-muted-foreground">
                    Client update: truck is at {currentStop.stopName}, {stopsAhead} stops remain after this.
                  </p>
                )}
                {assignedRoutes.length === 0 && (
                  <p className="mt-1 text-muted-foreground">
                    {planningPreference?.targetType === 'site' && planningPreference.targetId
                      ? `Quick target active: ${currentStop?.stopName ?? planningPreference.targetId}.`
                      : 'No assigned routes yet. Assign this truck in route planning.'}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border/70 bg-background/20 p-3">
                <p className="mb-2 text-sm font-medium">Delivery Scan</p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={scanValue}
                    onChange={(event) => setScanValue(event.target.value)}
                    placeholder="Scan package/box/keg/pallet QR id"
                    className="max-w-sm"
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={markScannedDelivered}
                    disabled={!safeProgress.routeActive}
                    >
                      <ScanLine className="h-4 w-4" />
                      Mark Delivered
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={markScannedReturned}
                      disabled={!safeProgress.routeActive}
                    >
                      <ScanLine className="h-4 w-4" />
                      Mark Returned
                    </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Delivered at current stop: {deliveredAtCurrentStop}
                </p>
                {scanFeedback && (
                  <div
                    className={`mt-2 rounded-md border px-2 py-1 text-xs ${
                      scanFeedback.tone === 'delivered'
                        ? 'border-green-500/40 bg-green-500/10 text-green-300'
                        : scanFeedback.tone === 'duplicate'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-red-500/40 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {scanFeedback.message}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {stops.map((stop, index) => {
                  const deliveredCount = safeProgress.deliveredByStop[stop.stopId]?.length ?? 0;
                  const isCurrent = safeProgress.routeActive && index === safeProgress.currentStopIndex;
                  const isCompleted = index < safeProgress.currentStopIndex;
                  return (
                    <div
                      key={stop.stopId}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-background/20 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{stop.stopName}</p>
                        <p className="text-xs text-muted-foreground">
                          {stop.orders.length} orders · {Math.max(0, stop.orders.length - deliveredCount)} pending
                        </p>
                      </div>
                      <Badge
                        className={
                          isCurrent
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : isCompleted
                              ? 'bg-green-500/20 text-green-300 border-green-500/40'
                              : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                        }
                      >
                        {isCurrent ? 'current' : isCompleted ? 'completed' : `${Math.max(0, index - safeProgress.currentStopIndex)} stops ahead`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Boxes className="h-4 w-4" />
              Manifest Orders
            </CardTitle>
            <CardDescription>Order payload scheduled for this truck.</CardDescription>
          </CardHeader>
          <CardContent>
            {manifestOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders are assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {manifestOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background/20 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Delivery: {formatDate(order.deliveryDate)}
                    </div>
                    <Badge className="w-fit bg-slate-500/20 text-slate-300 border-slate-500/40">
                      {order.status.replace('-', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Scanned delivered: {getDeliveryScanEvents(order.id, 'delivered').length}
                    </p>
                    <div className="text-sm font-medium">${order.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" asChild>
          <Link to="/ops/logistics" className="gap-2">
            <Truck className="h-4 w-4" />
            Open Logistics Canvas
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
