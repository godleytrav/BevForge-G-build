import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { OpsCalendarSyncDevPanel } from '@/components/ops/OpsCalendarSyncDevPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { makeOpsCalendarRecordId, postOpsCalendarEvent } from '@/lib/ops-calendar';
import { normalizeScannedIdentifier } from '@/lib/driver-scan';
import { ArrowLeft, Camera, CheckCheck, MapPinned, ScanLine, Truck, Undo2 } from 'lucide-react';
import { DriverAccessCard } from './driver-access-card';
import { useDriverSession } from './use-driver-session';
import {
  buildSiteSummaries,
  buildRouteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  getDeliveryScanEvents,
  getSiteProfile,
  getTruckPlanningPreferences,
  getTruckRouteProgress,
  recordDeliveryScanEvent,
  saveTruckRouteProgress,
  type LogisticsOrder,
  type LogisticsTruckProfile,
  type TruckPlanningPreference,
  type TruckRouteProgress,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

type ScanFeedbackTone = 'ok' | 'duplicate' | 'error';

interface ScanFeedback {
  tone: ScanFeedbackTone;
  message: string;
}

interface TruckStopEntry {
  stopId: string;
  stopName: string;
  orders: LogisticsOrder[];
  address?: string;
}

interface DriverCheckInState {
  stopId: string;
  checkedInAt: string;
}

interface QRDetectionResult {
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect(source: unknown): Promise<QRDetectionResult[]>;
}

type BarcodeDetectorCtorLike = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const DRIVER_CHECKIN_STORAGE_KEY = 'ops-logistics-driver-checkins-v1';

const canUseStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

const readDriverCheckInStorage = (): Record<string, DriverCheckInState> => {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DRIVER_CHECKIN_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed as Record<string, DriverCheckInState>;
  } catch {
    return {};
  }
};

const writeDriverCheckInStorage = (value: Record<string, DriverCheckInState>) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(DRIVER_CHECKIN_STORAGE_KEY, JSON.stringify(value));
};

const getDriverCheckIn = (truckId: string): DriverCheckInState | null => {
  const all = readDriverCheckInStorage();
  return all[truckId] ?? null;
};

const saveDriverCheckIn = (truckId: string, value: DriverCheckInState | null): void => {
  const all = readDriverCheckInStorage();
  if (value) {
    all[truckId] = value;
  } else {
    delete all[truckId];
  }
  writeDriverCheckInStorage(all);
};

const buildStopsFromOrders = (orders: LogisticsOrder[]): TruckStopEntry[] => {
  const map = new Map<string, TruckStopEntry>();
  orders.forEach((order) => {
    const stopId = order.customerId || order.customerName;
    const existing = map.get(stopId);
    if (existing) {
      existing.orders.push(order);
      return;
    }
    const profile = getSiteProfile(stopId, order.customerName);
    map.set(stopId, {
      stopId,
      stopName: order.customerName,
      orders: [order],
      address: profile.address || undefined,
    });
  });
  return Array.from(map.values());
};

const getNavigationUrls = (stop?: TruckStopEntry): { apple: string; google: string } | null => {
  if (!stop) {
    return null;
  }

  const query = [stop.stopName, stop.address].filter((value) => Boolean(value)).join(' ');
  if (!query) {
    return null;
  }
  const encoded = encodeURIComponent(query);
  return {
    apple: `https://maps.apple.com/?q=${encoded}`,
    google: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
  };
};

const getBarcodeDetectorCtor = (): BarcodeDetectorCtorLike | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtorLike }).BarcodeDetector ?? null;
};

const feedbackClassByTone: Record<ScanFeedbackTone, string> = {
  ok: 'border-green-500/40 bg-green-500/10 text-green-300',
  duplicate: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export default function OpsLogisticsDriverDetailPage() {
  const { truckId } = useParams();
  const driverSession = useDriverSession();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanValue, setScanValue] = useState('');
  const [progress, setProgress] = useState<TruckRouteProgress | null>(null);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [checkIn, setCheckIn] = useState<DriverCheckInState | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const scanLoopBusyRef = useRef(false);

  useEffect(() => {
    if (driverSession.status !== 'authenticated') {
      return;
    }

    setLoading(true);
    let active = true;

    async function loadData() {
      const [nextOrders, nextFleet] = await Promise.all([fetchLogisticsOrders(), fetchFleetProfiles()]);
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setFleet(nextFleet);
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [driverSession.status]);

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

    const manifestStops = buildStopsFromOrders(detail.manifestOrders);
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
          address: profile.address || undefined,
        },
      ];
    }

    return [];
  }, [detail, planningPreference, orders]);

  useEffect(() => {
    if (!truckId) {
      return;
    }
    setProgress(getTruckRouteProgress(truckId));
    setCheckIn(getDriverCheckIn(truckId));
  }, [truckId]);

  const persistProgress = (next: TruckRouteProgress) => {
    setProgress(next);
    saveTruckRouteProgress(next);
  };

  const persistCheckIn = (next: DriverCheckInState | null) => {
    if (!truckId) {
      return;
    }
    setCheckIn(next);
    saveDriverCheckIn(truckId, next);
  };

  const reportScanFeedback = (feedback: ScanFeedback) => {
    setScanFeedback(feedback);
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
    persistCheckIn(null);

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId('ops-driver-route-start', truckId),
      title: `Driver Route Started: ${detail?.assignment.truck.name ?? truckId}`,
      description: stops.length > 0 ? `First stop: ${stops[0]?.stopName ?? 'Unassigned'}` : 'No assigned stops.',
      type: 'delivery',
      status: 'in_progress',
      startAt: next.updatedAt,
      links: {
        openPath: `/ops/logistics/driver/${truckId}`,
      },
      metadata: {
        origin: 'ops-driver-route-start',
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
    persistCheckIn(null);

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId(
        'ops-driver-route-progress',
        truckId ?? '',
        currentStop?.stopId,
        next.currentStopIndex
      ),
      siteId: currentStop?.stopId,
      title: atEnd
        ? `Driver Route Progress: ${detail?.assignment.truck.name ?? truckId} completed final stop`
        : `Driver Route Progress: ${detail?.assignment.truck.name ?? truckId} advanced stop`,
      description: atEnd
        ? `Last completed stop: ${currentStop?.stopName ?? 'Unknown'}`
        : `Completed ${currentStop?.stopName ?? 'stop'}; next stop ${stops[next.currentStopIndex]?.stopName ?? 'N/A'}.`,
      type: 'delivery',
      status: atEnd ? 'completed' : 'in_progress',
      startAt: next.updatedAt,
      links: {
        openPath: `/ops/logistics/driver/${truckId}`,
      },
      metadata: {
        origin: 'ops-driver-route-progress',
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
    persistCheckIn(null);

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId('ops-driver-route-end', truckId ?? ''),
      title: `Driver Route Ended: ${detail?.assignment.truck.name ?? truckId}`,
      description: progress.lastCompletedStopName
        ? `Last completed stop: ${progress.lastCompletedStopName}`
        : 'Route ended with no completed stops.',
      type: 'delivery',
      status: 'completed',
      startAt: next.updatedAt,
      links: {
        openPath: `/ops/logistics/driver/${truckId}`,
      },
      metadata: {
        origin: 'ops-driver-route-end',
        truckId,
        truckName: detail?.assignment.truck.name,
        lastCompletedStopName: progress.lastCompletedStopName,
      },
    });
  };

  const checkInCurrentStop = () => {
    if (!progress || !progress.routeActive || stops.length === 0) {
      reportScanFeedback({ tone: 'error', message: 'Route is not active. Start route first.' });
      return;
    }
    const currentStop = stops[progress.currentStopIndex];
    if (!currentStop) {
      reportScanFeedback({ tone: 'error', message: 'No current stop selected.' });
      return;
    }
    const next: DriverCheckInState = {
      stopId: currentStop.stopId,
      checkedInAt: new Date().toISOString(),
    };
    persistCheckIn(next);
    reportScanFeedback({ tone: 'ok', message: `Checked in at ${currentStop.stopName}.` });

    void postOpsCalendarEvent({
      sourceRecordId: makeOpsCalendarRecordId('ops-driver-check-in', truckId ?? '', currentStop.stopId),
      siteId: currentStop.stopId,
      title: `Driver Check-In: ${currentStop.stopName}`,
      description: `Truck ${detail?.assignment.truck.name ?? truckId} checked in at stop.`,
      type: 'delivery',
      status: 'in_progress',
      startAt: next.checkedInAt,
      links: {
        openPath: `/ops/logistics/driver/${truckId}`,
      },
      metadata: {
        origin: 'ops-driver-check-in',
        truckId,
        truckName: detail?.assignment.truck.name,
        stopId: currentStop.stopId,
        stopName: currentStop.stopName,
      },
    });
  };

  const markScannedDelivered = () => {
    if (!truckId || !progress || !progress.routeActive || stops.length === 0) {
      reportScanFeedback({ tone: 'error', message: 'Route is not active.' });
      return;
    }
    const normalizedScan = normalizeScannedIdentifier(scanValue);
    const scanId = normalizedScan.identifier.trim();
    if (!scanId) {
      reportScanFeedback({ tone: 'error', message: 'Scan value cannot be empty.' });
      return;
    }
    const currentStop = stops[progress.currentStopIndex];
    if (!currentStop) {
      reportScanFeedback({ tone: 'error', message: 'No current stop selected.' });
      return;
    }
    if (!checkIn || checkIn.stopId !== currentStop.stopId) {
      reportScanFeedback({ tone: 'error', message: `Check in at ${currentStop.stopName} before scanning.` });
      return;
    }

    const existingForStop = progress.deliveredByStop[currentStop.stopId] ?? [];
    if (existingForStop.includes(scanId)) {
      setScanValue('');
      reportScanFeedback({
        tone: 'duplicate',
        message: `${scanId} is already marked delivered at ${currentStop.stopName}.`,
      });
      return;
    }

    const scannedAtOtherStop = Object.entries(progress.deliveredByStop).find(
      ([stopId, ids]) => stopId !== currentStop.stopId && ids.includes(scanId)
    );
    if (scannedAtOtherStop) {
      const stopName =
        stops.find((stop) => stop.stopId === scannedAtOtherStop[0])?.stopName ?? scannedAtOtherStop[0];
      setScanValue('');
      reportScanFeedback({
        tone: 'error',
        message: `${scanId} was already delivered at ${stopName}.`,
      });
      return;
    }

    const targetOrder = currentStop.orders[existingForStop.length % Math.max(1, currentStop.orders.length)];
    const deliveryEvent = recordDeliveryScanEvent({
      orderId: targetOrder?.id ?? `ops-driver-${truckId}-${currentStop.stopId}`,
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
      tone: 'ok',
      message: `Delivered ${scanId} at ${currentStop.stopName}.`,
    });

    void postOpsCalendarEvent({
      sourceRecordId: deliveryEvent.id,
      siteId: currentStop.stopId,
      title: `Driver Delivered: ${scanId}`,
      description: `${currentStop.stopName} · Truck ${detail?.assignment.truck.name ?? truckId}`,
      type: 'delivery',
      status: 'completed',
      startAt: deliveryEvent.deliveredAt,
      links: {
        openPath: `/ops/logistics/driver/${truckId}`,
      },
      metadata: {
        origin: 'ops-driver-scan-delivered',
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
      reportScanFeedback({ tone: 'error', message: 'Route is not active.' });
      return;
    }
    const normalizedScan = normalizeScannedIdentifier(scanValue);
    const scanId = normalizedScan.identifier.trim();
    if (!scanId) {
      reportScanFeedback({ tone: 'error', message: 'Scan value cannot be empty.' });
      return;
    }
    const currentStop = stops[progress.currentStopIndex];
    if (!currentStop) {
      reportScanFeedback({ tone: 'error', message: 'No current stop selected.' });
      return;
    }
    if (!checkIn || checkIn.stopId !== currentStop.stopId) {
      reportScanFeedback({ tone: 'error', message: `Check in at ${currentStop.stopName} before scanning.` });
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
        message: `${scanId} is already marked returned at ${currentStop.stopName}.`,
      });
      return;
    }

    const deliveredAtStop = stopEvents.some(
      (event) => event.scannedId === scanId && event.eventType === 'delivered'
    );
    if (!deliveredAtStop) {
      reportScanFeedback({
        tone: 'error',
        message: `${scanId} has no delivered record at ${currentStop.stopName}.`,
      });
      return;
    }

    const targetOrder = currentStop.orders[0];
    const returnEvent = recordDeliveryScanEvent({
      orderId: targetOrder?.id ?? `ops-driver-${truckId}-${currentStop.stopId}`,
      truckId,
      stopId: currentStop.stopId,
      stopName: currentStop.stopName,
      scannedId: scanId,
      eventType: 'returned',
    });

    setScanValue('');
    reportScanFeedback({
      tone: 'ok',
      message: `Returned ${scanId} at ${currentStop.stopName}.`,
    });

    void postOpsCalendarEvent({
      sourceRecordId: returnEvent.id,
      siteId: currentStop.stopId,
      title: `Driver Returned: ${scanId}`,
      description: `${currentStop.stopName} · Truck ${detail?.assignment.truck.name ?? truckId}`,
      type: 'delivery',
      status: 'completed',
      startAt: returnEvent.deliveredAt,
      links: {
        openPath: `/ops/logistics/driver/${truckId}`,
      },
      metadata: {
        origin: 'ops-driver-scan-returned',
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

  useEffect(() => {
    if (!cameraOpen) {
      return;
    }

    const DetectorCtor = getBarcodeDetectorCtor();
    if (!DetectorCtor) {
      setCameraError('Camera QR scanning is not supported in this browser. Use manual scan input.');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable on this device.');
      return;
    }

    let active = true;
    let stream: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let timerId: number | null = null;
    const detector = new DetectorCtor({ formats: ['qr_code'] });
    const videoElement = videoRef.current;

    const bootScanner = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          return;
        }
        if (!videoElement) {
          setCameraError('Camera preview failed to initialize.');
          return;
        }
        videoElement.srcObject = stream;
        await videoElement.play();

        timerId = window.setInterval(async () => {
          if (!active || !videoElement || scanLoopBusyRef.current) {
            return;
          }
          scanLoopBusyRef.current = true;
          try {
            const detections = await detector.detect(videoElement);
            const match = detections.find((entry) => typeof entry.rawValue === 'string' && entry.rawValue.trim().length > 0);
            if (match?.rawValue) {
              const normalizedScan = normalizeScannedIdentifier(match.rawValue);
              const nextValue = normalizedScan.identifier.trim();
              if (!nextValue) {
                return;
              }
              setScanValue(nextValue);
              setScanFeedback({
                tone: 'ok',
                message: `Scanned ${nextValue}. Choose Delivered or Returned.`,
              });
              setCameraOpen(false);
            }
          } catch {
            // Ignore transient detector errors while scanning frames.
          } finally {
            scanLoopBusyRef.current = false;
          }
        }, 260);
      } catch {
        setCameraError('Camera permission denied or camera unavailable. Use manual scan input.');
      }
    };

    void bootScanner();

    return () => {
      active = false;
      scanLoopBusyRef.current = false;
      if (timerId !== null) {
        window.clearInterval(timerId);
      }
      if (stream) {
        stream.getTracks().forEach((track: { stop: () => void }) => track.stop());
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [cameraOpen]);

  if (driverSession.status === 'checking' || (driverSession.status === 'authenticated' && loading)) {
    return (
      <AppShell pageTitle="OPS Driver Run" currentSuite="ops" showNavigationDrawer={false}>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading driver run...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (driverSession.status !== 'authenticated') {
    return (
      <AppShell pageTitle="OPS Driver Run" currentSuite="ops" showNavigationDrawer={false}>
        <div className="mx-auto max-w-xl space-y-4">
          <Button variant="outline" asChild>
            <Link to="/ops/logistics/driver" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Driver App
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Driver Run Access</h1>
          <p className="text-sm text-muted-foreground">
            Pair this phone before loading route details and scanning delivery QR codes.
          </p>
          <DriverAccessCard
            defaultDeviceLabel={driverSession.defaultDeviceLabel}
            pairingPending={driverSession.pairingPending}
            error={driverSession.error}
            onPair={driverSession.pairWithCode}
          />
        </div>
      </AppShell>
    );
  }

  if (!detail || !truckId) {
    return (
      <AppShell pageTitle="OPS Driver Run" currentSuite="ops" showNavigationDrawer={false}>
        <div className="space-y-6">
          <Button variant="outline" asChild>
            <Link to="/ops/logistics/driver" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Driver App
            </Link>
          </Button>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle>Truck Not Found</CardTitle>
              <CardDescription>This truck id is not configured in fleet profiles.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  const safeProgress =
    progress ??
    ({
      truckId,
      routeActive: false,
      currentStopIndex: 0,
      lastCompletedStopName: undefined,
      deliveredByStop: {},
      updatedAt: new Date().toISOString(),
    } satisfies TruckRouteProgress);
  const currentStop = stops[safeProgress.currentStopIndex];
  const stopsAhead = safeProgress.routeActive ? Math.max(0, stops.length - safeProgress.currentStopIndex - 1) : 0;
  const deliveredAtCurrentStop = currentStop ? safeProgress.deliveredByStop[currentStop.stopId]?.length ?? 0 : 0;
  const returnedAtCurrentStop = currentStop
    ? getDeliveryScanEvents(undefined, 'returned').filter((event) => event.truckId === truckId && event.stopId === currentStop.stopId).length
    : 0;
  const navigationUrls = getNavigationUrls(currentStop);
  const checkedInAtCurrentStop = Boolean(checkIn && currentStop && checkIn.stopId === currentStop.stopId);

  return (
    <AppShell pageTitle={`OPS Driver — ${detail.assignment.truck.name}`} currentSuite="ops" showNavigationDrawer={false}>
      <div className="space-y-4 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button variant="outline" asChild>
              <Link to="/ops/logistics/driver" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Driver App
              </Link>
            </Button>
            <h1 className="mt-3 text-2xl font-bold text-foreground">{detail.assignment.truck.name}</h1>
            <p className="text-sm text-muted-foreground">
              {detail.assignment.truck.id} · {detail.assignment.truck.driver || 'Driver unassigned'}
            </p>
            <p className="text-xs text-muted-foreground">
              Signed in as {driverSession.session?.driver.name} on {driverSession.session?.device.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={safeProgress.routeActive ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'}>
              {safeProgress.routeActive ? 'route active' : 'route idle'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void driverSession.signOut();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <OpsCalendarSyncDevPanel
          originPrefix="ops-driver"
          title="Driver Calendar Sync (DEV)"
        />

        <Card style={panelStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Stop</CardTitle>
            <CardDescription>Check in, navigate, then scan fulfillment and return QR codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-border/70 bg-background/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Now Serving</p>
              <p className="mt-1 text-lg font-semibold">{safeProgress.routeActive ? currentStop?.stopName ?? 'No stop selected' : 'Route not started'}</p>
              {currentStop?.address && <p className="text-xs text-muted-foreground">{currentStop.address}</p>}
              {safeProgress.lastCompletedStopName && (
                <p className="mt-1 text-xs text-muted-foreground">Last completed: {safeProgress.lastCompletedStopName}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Stops ahead: {stopsAhead}</p>
              {checkedInAtCurrentStop && checkIn && (
                <p className="mt-1 text-xs text-cyan-200">Checked in at {new Date(checkIn.checkedInAt).toLocaleTimeString()}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button size="sm" onClick={startRoute} disabled={safeProgress.routeActive || stops.length === 0}>
                Start Route
              </Button>
              <Button size="sm" variant="outline" onClick={checkInCurrentStop} disabled={!safeProgress.routeActive || !currentStop}>
                <CheckCheck className="mr-1 h-4 w-4" />
                Check In
              </Button>
              <Button size="sm" variant="outline" onClick={nextStop} disabled={!safeProgress.routeActive || stops.length === 0}>
                Next Stop
              </Button>
              <Button size="sm" variant="destructive" onClick={endRoute} disabled={!safeProgress.routeActive}>
                End Route
              </Button>
            </div>

            {navigationUrls && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={navigationUrls.apple} target="_blank" rel="noreferrer" className="gap-1">
                    <MapPinned className="h-4 w-4" />
                    Apple Maps
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={navigationUrls.google} target="_blank" rel="noreferrer" className="gap-1">
                    <MapPinned className="h-4 w-4" />
                    Google Maps
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">QR Scan Check-In</CardTitle>
            <CardDescription>Scan package/box/keg/pallet IDs for delivered fulfillment and returns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                placeholder="Scan or enter QR id"
                className="max-w-md"
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setCameraOpen((value) => !value)}
              >
                <Camera className="h-4 w-4" />
                {cameraOpen ? 'Close Camera' : 'Use Camera'}
              </Button>
            </div>

            {cameraOpen && (
              <div className="max-w-md overflow-hidden rounded-md border border-border/70 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
              </div>
            )}
            {cameraError && <p className="text-xs text-amber-300">{cameraError}</p>}

            <div className="grid grid-cols-2 gap-2 sm:max-w-md">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={markScannedDelivered}
                disabled={!safeProgress.routeActive}
              >
                <ScanLine className="h-4 w-4" />
                Mark Delivered
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={markScannedReturned}
                disabled={!safeProgress.routeActive}
              >
                <Undo2 className="h-4 w-4" />
                Mark Returned
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Delivered at stop: {deliveredAtCurrentStop} · Returned at stop: {returnedAtCurrentStop}
            </div>

            {scanFeedback && (
              <div className={`rounded-md border px-2 py-1 text-xs ${feedbackClassByTone[scanFeedback.tone]}`}>
                {scanFeedback.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stop Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stops.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No stops assigned. Assign routes or quick targets from Truck Board.
              </p>
            )}
            {stops.map((stop, index) => {
              const deliveredCount = safeProgress.deliveredByStop[stop.stopId]?.length ?? 0;
              const isCurrent = safeProgress.routeActive && index === safeProgress.currentStopIndex;
              const isCompleted = index < safeProgress.currentStopIndex;
              return (
                <div
                  key={stop.stopId}
                  className="flex items-center justify-between rounded-md border border-border/70 bg-background/20 px-3 py-2"
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
                    {isCurrent
                      ? 'current'
                      : isCompleted
                        ? 'completed'
                        : `${Math.max(0, index - safeProgress.currentStopIndex)} ahead`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button variant="outline" asChild>
          <Link to={`/ops/logistics/trucks/${truckId}`} className="gap-2">
            <Truck className="h-4 w-4" />
            Open Truck Details
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
