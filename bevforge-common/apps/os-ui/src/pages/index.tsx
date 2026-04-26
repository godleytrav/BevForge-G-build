import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVolumeNumber } from '@/lib/volume-format';
import { formatTemperatureValue, useOsDisplaySettings } from '@/lib/os-display';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BatchProductSnapshot } from '@/features/products/types';
import { selectProductImage } from '@/features/products/types';
import {
  Package,
  Monitor,
  Plus,
  Beaker,
  Wheat,
  Hop,
  Apple,
  Wrench,
  Box,
  Beer,
  Gauge,
  ArrowRight,
  Clock,
  FlaskConical,
  ArrowRightLeft,
  PackageCheck,
  Boxes,
  ShieldCheck,
  BellRing,
  CalendarDays,
  FileText,
} from 'lucide-react';

type DashboardBatchStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'released'
  | 'allocated'
  | 'shipped'
  | 'canceled';

interface DashboardBatch {
  id: string;
  skuId?: string;
  batchCode?: string;
  lotCode: string;
  recipeName: string;
  recipeRunId?: string;
  status: DashboardBatchStatus;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  updatedAt: string;
  productSnapshot?: BatchProductSnapshot;
  actualResults?: {
    og?: number;
    fg?: number;
    sgLatest?: number;
    temperatureCLatest?: number;
    phLatest?: number;
    brixLatest?: number;
    abvPct?: number;
    residualSugarGplLatest?: number;
  };
  readingLog?: Array<{
    id: string;
    timestamp: string;
    og?: number;
    fg?: number;
    sg?: number;
    temperatureC?: number;
    ph?: number;
    brix?: number;
    residualSugarGpl?: number;
  }>;
}

interface DashboardBatchSummary {
  total: number;
  active?: number;
  inProgress: number;
  readyToRelease: number;
  released: number;
  shipped: number;
  onHandQty: number;
}

interface DashboardFulfillmentRequest {
  id: string;
  status:
    | 'queued'
    | 'accepted'
    | 'in_progress'
    | 'blocked'
    | 'completed'
    | 'canceled'
    | 'rejected';
  type: 'production' | 'packaging';
}

interface DashboardPackageLot {
  id: string;
  packageSkuId?: string;
}

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  category: 'schedule' | 'requests' | 'compliance' | 'operations' | 'manual';
  level: 'info' | 'warning' | 'error' | 'success';
  status: 'unread' | 'read' | 'dismissed';
  dueAt?: string;
  updatedAt: string;
  links?: {
    openPath?: string;
    openUrl?: string;
  };
}

interface DashboardSettingsState {
  activeProductionQuickMetrics?: ActiveQuickMetricKey[];
  activeProductionGraphMetrics?: ActiveQuickMetricKey[];
}

const progressByStatus: Record<DashboardBatchStatus, number> = {
  planned: 10,
  in_progress: 45,
  completed: 70,
  released: 85,
  allocated: 92,
  shipped: 100,
  canceled: 0,
};

const ACTIVE_DASHBOARD_BATCH_STATUSES: DashboardBatchStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'released',
  'allocated',
];

type ActiveQuickMetricKey =
  | 'temperatureC'
  | 'sg'
  | 'abv'
  | 'brix'
  | 'residualSugarGpl'
  | 'ph'
  | 'apparentAttenuation';

const ACTIVE_PRODUCTION_MAX_METRICS = 4;
const ACTIVE_PRODUCTION_DEFAULT_METRICS: ActiveQuickMetricKey[] = [
  'temperatureC',
  'sg',
  'abv',
  'residualSugarGpl',
];
const ACTIVE_PRODUCTION_DEFAULT_GRAPH_METRICS: ActiveQuickMetricKey[] = ['sg', 'temperatureC'];

const computeAbv = (og?: number, fg?: number): number | undefined => {
  if (og === undefined || fg === undefined) return undefined;
  if (og <= fg) return 0;
  return (og - fg) * 131.25;
};

const computeApparentAttenuation = (og?: number, gravity?: number): number | undefined => {
  if (og === undefined || gravity === undefined) return undefined;
  if (og <= 1) return undefined;
  if (gravity >= og) return 0;
  return ((og - gravity) / (og - 1)) * 100;
};

const computeBrixFromSpecificGravity = (gravity?: number): number | undefined => {
  if (gravity === undefined || !Number.isFinite(gravity)) return undefined;
  return (((182.4601 * gravity - 775.6821) * gravity + 1262.7794) * gravity - 669.5622);
};

const resolveBrixValue = (directBrix?: number, gravity?: number): number | undefined =>
  directBrix !== undefined ? directBrix : computeBrixFromSpecificGravity(gravity);

const formatMaybeNumber = (
  value: number | undefined,
  digits: number,
  suffix?: string
): string => {
  if (value === undefined || !Number.isFinite(value)) return '--';
  return `${value.toFixed(digits)}${suffix ?? ''}`;
};

const buildTrendChart = (series: Array<{ id: string; timestamp: string; value: number }>) => {
  if (series.length === 0) return null;
  const values = series.map((entry) => entry.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range === 0 ? Math.max(Math.abs(maxValue) * 0.08, 0.1) : range * 0.14;
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;
  const width = 720;
  const height = 180;
  const left = 16;
  const right = 16;
  const top = 16;
  const bottom = 26;
  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;
  const points = series.map((entry, index) => {
    const x =
      series.length === 1
        ? left + usableWidth / 2
        : left + (index / (series.length - 1)) * usableWidth;
    const y =
      top + (1 - (entry.value - chartMin) / Math.max(chartMax - chartMin, 0.0001)) * usableHeight;
    return { ...entry, x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${path} L ${points.at(-1)?.x.toFixed(2)} ${(height - bottom).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - bottom).toFixed(2)} Z`
      : '';
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    chartMin,
    chartMax,
    minValue,
    maxValue,
    latestValue: values.at(-1),
    points,
    path,
    areaPath,
  };
};

const ACTIVE_PRODUCTION_METRICS: Array<{
  key: ActiveQuickMetricKey;
  label: string;
  digits: number;
  colorClass: string;
  stroke: string;
  fill: string;
}> = [
  { key: 'temperatureC', label: 'Temp', digits: 1, colorClass: 'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]', stroke: '#22d3ee', fill: 'rgba(34,211,238,0.18)' },
  { key: 'sg', label: 'SG', digits: 3, colorClass: 'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]', stroke: '#10b981', fill: 'rgba(16,185,129,0.18)' },
  { key: 'abv', label: 'ABV', digits: 2, colorClass: 'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]', stroke: '#f59e0b', fill: 'rgba(245,158,11,0.18)' },
  { key: 'brix', label: 'Brix', digits: 2, colorClass: 'border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]', stroke: '#8b5cf6', fill: 'rgba(139,92,246,0.18)' },
  { key: 'residualSugarGpl', label: 'RS', digits: 2, colorClass: 'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]', stroke: '#34d399', fill: 'rgba(52,211,153,0.18)' },
  { key: 'ph', label: 'pH', digits: 2, colorClass: 'border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-fuchsia-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(232,121,249,0.12)]', stroke: '#e879f9', fill: 'rgba(232,121,249,0.18)' },
  { key: 'apparentAttenuation', label: 'Attenuation', digits: 1, colorClass: 'border-lime-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] text-lime-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(163,230,53,0.12)]', stroke: '#a3e635', fill: 'rgba(163,230,53,0.18)' },
];

const ACTIVE_PRODUCTION_METRIC_KEYS = ACTIVE_PRODUCTION_METRICS.map((metric) => metric.key);

const normalizeSelectedActiveMetrics = (value: unknown): ActiveQuickMetricKey[] => {
  if (!Array.isArray(value)) return ACTIVE_PRODUCTION_DEFAULT_METRICS;
  const filtered = value.filter((entry): entry is ActiveQuickMetricKey =>
    typeof entry === 'string' && ACTIVE_PRODUCTION_METRIC_KEYS.includes(entry as ActiveQuickMetricKey)
  );
  const deduped = Array.from(new Set(filtered));
  return deduped.length > 0
    ? deduped.slice(0, ACTIVE_PRODUCTION_MAX_METRICS)
    : ACTIVE_PRODUCTION_DEFAULT_METRICS;
};

const normalizeSelectedGraphMetrics = (value: unknown): ActiveQuickMetricKey[] => {
  if (!Array.isArray(value)) return ACTIVE_PRODUCTION_DEFAULT_GRAPH_METRICS;
  const filtered = value.filter((entry): entry is ActiveQuickMetricKey =>
    typeof entry === 'string' && ACTIVE_PRODUCTION_METRIC_KEYS.includes(entry as ActiveQuickMetricKey)
  );
  const deduped = Array.from(new Set(filtered));
  return deduped.length > 0
    ? deduped.slice(0, ACTIVE_PRODUCTION_MAX_METRICS)
    : ACTIVE_PRODUCTION_DEFAULT_GRAPH_METRICS;
};

export default function HomePage() {
  const navigate = useNavigate();
  const { notifications, isLoading: notificationsLoading } = useNotifications();
  const { temperatureUnit } = useOsDisplaySettings();
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [dashboardBatches, setDashboardBatches] = useState<DashboardBatch[]>([]);
  const [recentBatchStatus, setRecentBatchStatus] = useState('Loading latest batches...');
  const [batchSummary, setBatchSummary] = useState<DashboardBatchSummary | null>(null);
  const [openRequestCount, setOpenRequestCount] = useState(0);
  const [packageLotCount, setPackageLotCount] = useState(0);
  const [selectedActiveMetrics, setSelectedActiveMetrics] = useState<ActiveQuickMetricKey[]>(
    ACTIVE_PRODUCTION_DEFAULT_METRICS
  );
  const [selectedActiveGraphMetrics, setSelectedActiveGraphMetrics] = useState<ActiveQuickMetricKey[]>(
    ACTIVE_PRODUCTION_DEFAULT_GRAPH_METRICS
  );

  const categories = [
    {
      id: 'yeast',
      name: 'Yeast',
      icon: Beaker,
      description: 'Ale, lager, wine yeast',
      isIngredient: true,
    },
    {
      id: 'malt',
      name: 'Malt & Grain',
      icon: Wheat,
      description: 'Base, specialty, adjunct',
      isIngredient: true,
    },
    {
      id: 'hops',
      name: 'Hops',
      icon: Hop,
      description: 'Bittering, aroma, dual-purpose',
      isIngredient: true,
    },
    {
      id: 'fruit',
      name: 'Fruit & Adjuncts',
      icon: Apple,
      description: 'Fruit, spices, additives',
      isIngredient: true,
    },
    {
      id: 'equipment',
      name: 'Equipment',
      icon: Wrench,
      description: 'Tools, parts, supplies',
      isIngredient: false,
    },
    {
      id: 'packaging',
      name: 'Packaging',
      icon: Box,
      description: 'Bottles, caps, labels',
      isIngredient: false,
    },
    {
      id: 'kegs',
      name: 'Kegs & Barrels',
      icon: Beer,
      description: 'Kegs, casks, barrels',
      isIngredient: false,
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setShowAddItemDialog(false);
    navigate(`/os/inventory/add?category=${categoryId}`);
  };

  useEffect(() => {
    let mounted = true;

    const loadDashboardState = async () => {
      try {
        const [batchesResponse, requestsResponse, packageLotsResponse, settingsResponse] = await Promise.all([
          window.fetch('/api/os/batches'),
          window.fetch('/api/os/fulfillment/requests'),
          window.fetch('/api/os/package-lots'),
          window.fetch('/api/os/settings'),
        ]);
        const batchesPayload = await batchesResponse.json().catch(() => null);
        const requestsPayload = await requestsResponse.json().catch(() => null);
        const packageLotsPayload = await packageLotsResponse.json().catch(() => null);
        const settingsPayload = await settingsResponse.json().catch(() => null);
        if (!batchesResponse.ok || !batchesPayload?.success) {
          throw new Error(batchesPayload?.error ?? 'Failed to load recent batches.');
        }
        if (!mounted) return;
        const batches = (batchesPayload.data?.batches ?? []) as DashboardBatch[];
        const summary = (batchesPayload.data?.summary ?? null) as DashboardBatchSummary | null;
        const requests = (requestsPayload?.data ?? []) as DashboardFulfillmentRequest[];
        const lots = (packageLotsPayload?.data ?? []) as DashboardPackageLot[];
        const dashboardSettings = (settingsPayload?.data?.dashboard ?? null) as DashboardSettingsState | null;
        setDashboardBatches(
          [...batches].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        );
        setBatchSummary(summary);
        setOpenRequestCount(
          requests.filter((request) =>
            ['queued', 'accepted', 'in_progress', 'blocked'].includes(request.status)
          ).length
        );
        setPackageLotCount(lots.length);
        setSelectedActiveMetrics(
          normalizeSelectedActiveMetrics(dashboardSettings?.activeProductionQuickMetrics)
        );
        setSelectedActiveGraphMetrics(
          normalizeSelectedGraphMetrics(dashboardSettings?.activeProductionGraphMetrics)
        );
        setRecentBatchStatus('Latest production runs');
      } catch (error) {
        if (!mounted) return;
        setDashboardBatches([]);
        setBatchSummary(null);
        setOpenRequestCount(0);
        setPackageLotCount(0);
        setRecentBatchStatus(
          error instanceof Error ? error.message : 'Failed to load recent batches.'
        );
      }
    };

    void loadDashboardState();
    return () => {
      mounted = false;
    };
  }, []);

  const recentBatchCards = useMemo(
    () =>
      dashboardBatches.slice(0, 3).map((batch) => {
        const availableQty = Math.max(
          0,
          batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)
        );
        return {
          id: batch.id,
          batchCode: batch.batchCode,
          lotCode: batch.lotCode,
          recipeName: batch.recipeName,
          statusLabel: batch.status.replaceAll('_', ' '),
          progress: progressByStatus[batch.status] ?? 0,
          availableQty,
          unit: batch.unit,
          cardImageUrl: selectProductImage(batch.productSnapshot?.images, 'card'),
        };
      }),
    [dashboardBatches]
  );

  const activeProductionBatches = useMemo(
    () =>
      dashboardBatches.filter((batch) =>
        ACTIVE_DASHBOARD_BATCH_STATUSES.includes(batch.status)
      ),
    [dashboardBatches]
  );

  const activeProductionBatch = useMemo(
    () =>
      [...activeProductionBatches].sort((left, right) => {
        const score = (batch: DashboardBatch) => {
          const statusScore =
            batch.status === 'in_progress'
              ? 50
              : batch.status === 'planned'
                ? 40
                : batch.status === 'completed'
                  ? 30
                  : batch.status === 'released'
                    ? 20
                    : batch.status === 'allocated'
                      ? 10
                      : 0;
          const runboardBonus = batch.recipeRunId ? 5 : 0;
          return statusScore + runboardBonus;
        };
        const scoreDelta = score(right) - score(left);
        if (scoreDelta !== 0) return scoreDelta;
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      })[0] ?? null,
    [activeProductionBatches]
  );

  const activeProductionMetricSeries = useMemo(() => {
    if (!activeProductionBatch?.readingLog) {
      return {} as Record<ActiveQuickMetricKey, Array<{ id: string; timestamp: string; value: number }>>;
    }
    const metricMap = ACTIVE_PRODUCTION_METRIC_KEYS.reduce(
      (accumulator, metric) => {
        accumulator[metric] = [];
        return accumulator;
      },
      {} as Record<ActiveQuickMetricKey, Array<{ id: string; timestamp: string; value: number }>>
    );

    activeProductionBatch.readingLog.forEach((entry) => {
      const currentGravity = entry.sg ?? entry.fg;
      const ogGravity = entry.og ?? activeProductionBatch.actualResults?.og;
      const valueByMetric: Record<ActiveQuickMetricKey, number | undefined> = {
        temperatureC:
          entry.temperatureC !== undefined
            ? Number(formatTemperatureValue(entry.temperatureC, temperatureUnit, 1))
            : undefined,
        sg: currentGravity,
        abv: computeAbv(ogGravity, currentGravity),
        brix: resolveBrixValue(entry.brix, currentGravity ?? ogGravity),
        residualSugarGpl: entry.residualSugarGpl,
        ph: entry.ph,
        apparentAttenuation: computeApparentAttenuation(ogGravity, currentGravity),
      };
      (Object.entries(valueByMetric) as Array<[ActiveQuickMetricKey, number | undefined]>).forEach(
        ([metric, value]) => {
          if (value === undefined || !Number.isFinite(value)) return;
          metricMap[metric].push({
            id: `${entry.id}-${metric}`,
            timestamp: entry.timestamp,
            value,
          });
        }
      );
    });

    return metricMap;
  }, [activeProductionBatch, temperatureUnit]);

  const activeProductionCharts = useMemo(
    () =>
      ACTIVE_PRODUCTION_METRIC_KEYS.reduce(
        (accumulator, metric) => {
          accumulator[metric] = buildTrendChart(activeProductionMetricSeries[metric] ?? []);
          return accumulator;
        },
        {} as Record<ActiveQuickMetricKey, ReturnType<typeof buildTrendChart>>
      ),
    [activeProductionMetricSeries]
  );

  const activeMetricValue = useCallback(
    (metricKey: ActiveQuickMetricKey): number | undefined => {
      if (!activeProductionBatch) return undefined;
      const actualResults = activeProductionBatch.actualResults;
      const currentGravity = actualResults?.sgLatest ?? actualResults?.fg;
      switch (metricKey) {
        case 'temperatureC':
          return actualResults?.temperatureCLatest !== undefined
            ? Number(formatTemperatureValue(actualResults.temperatureCLatest, temperatureUnit, 1))
            : undefined;
        case 'sg':
          return currentGravity;
        case 'abv':
          return actualResults?.abvPct ?? computeAbv(actualResults?.og, currentGravity);
        case 'brix':
          return resolveBrixValue(actualResults?.brixLatest, currentGravity);
        case 'residualSugarGpl':
          return actualResults?.residualSugarGplLatest;
        case 'ph':
          return actualResults?.phLatest;
        case 'apparentAttenuation':
          return computeApparentAttenuation(actualResults?.og, currentGravity);
        default:
          return undefined;
      }
    },
    [activeProductionBatch, temperatureUnit]
  );

  const activeMetricSuffix = useCallback(
    (metricKey: ActiveQuickMetricKey): string | undefined => {
      if (metricKey === 'temperatureC') return undefined;
      if (metricKey === 'abv' || metricKey === 'apparentAttenuation') return '%';
      if (metricKey === 'residualSugarGpl') return ' g/L';
      return undefined;
    },
    []
  );

  const selectedActiveMetricCards = useMemo(
    () =>
      selectedActiveMetrics.map((metricKey) => {
        const config =
          ACTIVE_PRODUCTION_METRICS.find((metric) => metric.key === metricKey) ??
          ACTIVE_PRODUCTION_METRICS[0];
        return {
          key: metricKey,
          config,
          displayValue: formatMaybeNumber(
            activeMetricValue(metricKey),
            config.digits,
            activeMetricSuffix(metricKey)
          ),
        };
      }),
    [activeMetricSuffix, activeMetricValue, selectedActiveMetrics]
  );

  const selectedActiveGraphEntries = useMemo(
    () =>
      selectedActiveGraphMetrics
        .map((metricKey) => {
          const chart = activeProductionCharts[metricKey];
          const config =
            ACTIVE_PRODUCTION_METRICS.find((metric) => metric.key === metricKey) ??
            ACTIVE_PRODUCTION_METRICS[0];
          return chart ? { metricKey, chart, config } : null;
        })
        .filter(
          (
            entry
          ): entry is {
            metricKey: ActiveQuickMetricKey;
            chart: NonNullable<ReturnType<typeof buildTrendChart>>;
            config: (typeof ACTIVE_PRODUCTION_METRICS)[number];
          } => entry !== null
        ),
    [activeProductionCharts, selectedActiveGraphMetrics]
  );

  const primaryActiveGraphEntry = selectedActiveGraphEntries[0] ?? null;

  const unreadNotifications = useMemo(
    () =>
      (notifications as DashboardNotification[]).filter(
        (notification) => notification.status === 'unread'
      ),
    [notifications]
  );

  const complianceDueCount = useMemo(
    () =>
      unreadNotifications.filter(
        (notification) => notification.category === 'compliance'
      ).length,
    [unreadNotifications]
  );

  const attentionItems = useMemo(
    () => unreadNotifications.slice(0, 4),
    [unreadNotifications]
  );

  const calendarReminderCount = useMemo(
    () =>
      unreadNotifications.filter(
        (notification) =>
          notification.category === 'schedule' ||
          notification.category === 'compliance'
      ).length,
    [unreadNotifications]
  );

  const resolveNotificationPath = (notification: DashboardNotification): string => {
    if (notification.links?.openPath) return notification.links.openPath;
    if (notification.category === 'requests') return '/os/requests';
    if (notification.category === 'compliance') return '/os/compliance';
    if (notification.category === 'schedule') return '/calendar?suite=os';
    return '/notifications';
  };

  const relativeDueLabel = (value?: string): string => {
    if (!value) return 'Updated recently';
    const diffMs = new Date(value).getTime() - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Number.isNaN(diffHours)) return 'Updated recently';
    if (diffHours < 0) {
      const hoursAgo = Math.abs(diffHours);
      if (hoursAgo < 24) return `${Math.max(1, hoursAgo)} hr ago`;
      const daysAgo = Math.ceil(hoursAgo / 24);
      return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
    }
    if (diffHours < 24) return `Due in ${Math.max(1, diffHours)} hr`;
    const days = Math.ceil(diffHours / 24);
    return `Due in ${days} day${days === 1 ? '' : 's'}`;
  };

  const categoryLabel = (value: DashboardNotification['category']): string => {
    if (value === 'requests') return 'Requests';
    if (value === 'compliance') return 'Compliance';
    if (value === 'schedule') return 'Schedule';
    if (value === 'operations') return 'Operations';
    return 'Activity';
  };

  const snapshotCards = [
    {
      title: 'Active Batches',
      value: batchSummary?.active ?? activeProductionBatches.length,
      subtitle: 'open production records',
      icon: FlaskConical,
      onClick: () => navigate('/os/batches'),
      accentClass:
        'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
      iconClass: 'text-cyan-300',
      lineClass: 'via-cyan-300/40',
    },
    {
      title: 'Requests',
      value: openRequestCount,
      subtitle: openRequestCount > 0 ? 'need attention' : 'clear',
      icon: Clock,
      onClick: () => navigate('/os/requests'),
      accentClass:
        'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
      iconClass: 'text-amber-300',
      lineClass: 'via-amber-300/40',
    },
    {
      title: 'Compliance Due',
      value: complianceDueCount,
      subtitle: complianceDueCount > 0 ? 'deadlines in queue' : 'no active reminders',
      icon: ShieldCheck,
      onClick: () => navigate('/notifications'),
      accentClass:
        'border-rose-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(244,63,94,0.12)]',
      iconClass: 'text-rose-300',
      lineClass: 'via-rose-300/40',
    },
    {
      title: 'Package Lots',
      value: packageLotCount,
      subtitle: `${batchSummary?.released ?? 0} released to OPS`,
      icon: PackageCheck,
      onClick: () => navigate('/os/packaged-products'),
      accentClass:
        'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]',
      iconClass: 'text-emerald-300',
      lineClass: 'via-emerald-300/40',
    },
  ];

  const quickAccessCards = [
    {
      title: 'Batches',
      subtitle: 'Current production records',
      chips: [`${batchSummary?.total ?? 0} total`, `${batchSummary?.active ?? activeProductionBatches.length} active`],
      icon: FlaskConical,
      onClick: () => navigate('/os/batches'),
    },
    {
      title: 'Inventory',
      subtitle: 'Stock, receiving, and vendors',
      chips: ['Raw materials', 'Packaging stock'],
      icon: Package,
      onClick: () => navigate('/os/inventory'),
    },
    {
      title: 'Packaging',
      subtitle: 'Runs, lots, and released product',
      chips: [`${packageLotCount} lots`, `${batchSummary?.released ?? 0} released`],
      icon: Boxes,
      onClick: () => navigate('/os/packaging'),
    },
    {
      title: 'Transfers',
      subtitle: 'Cellar moves and split runs',
      chips: ['Batch moves', 'Volume tracked'],
      icon: ArrowRightLeft,
      onClick: () => navigate('/os/transfers'),
    },
    {
      title: 'Requests',
      subtitle: 'OPS and suite demand queue',
      chips: [`${openRequestCount} open`, 'Linked fulfillment'],
      icon: BellRing,
      onClick: () => navigate('/os/requests'),
    },
    {
      title: 'Reports',
      subtitle: 'TTB, CDTFA, and support schedules',
      chips: [`${complianceDueCount} due`, 'Filing support'],
      icon: FileText,
      onClick: () => navigate('/reports'),
    },
    {
      title: 'Calendar',
      subtitle: 'Scheduled work and deadlines',
      chips: [`${calendarReminderCount} reminders`, 'OS projection'],
      icon: CalendarDays,
      onClick: () => navigate('/calendar?suite=os'),
    },
    {
      title: 'Compliance',
      subtitle: 'Review packaging and feed gaps',
      chips: [`${complianceDueCount} reminders`, 'Feed visibility'],
      icon: ShieldCheck,
      onClick: () => navigate('/os/compliance'),
    },
    {
      title: 'Control Panel',
      subtitle: 'Canvas, runtime, and live controls',
      chips: ['Live controls', 'Device layout'],
      icon: Gauge,
      onClick: () => navigate('/os/control-panel'),
    },
  ];

  return (
    <AppShell currentSuite="os" pageTitle="OS Dashboard">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              OS Live
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">OS Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Production, inventory, and cellar visibility in one operational command surface.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddItemDialog(true)}
              className="gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Inventory
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/os/batches/new')}
              className="gap-2"
              size="lg"
            >
              <Beer className="h-5 w-5" />
              New Batch
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/reports')}
              className="gap-2"
              size="lg"
            >
              <FileText className="h-5 w-5" />
              Reports
            </Button>
            <Button
              onClick={() => navigate('/os/control-panel')}
              className="gap-2"
              size="lg"
            >
              <Monitor className="h-5 w-5" />
              Open Control Panel
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card
            className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(12,17,28,0.98)_0%,rgba(7,12,22,0.98)_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            onClick={() =>
              activeProductionBatch?.recipeRunId
                ? navigate(`/os/brewday/${encodeURIComponent(activeProductionBatch.recipeRunId)}`)
                : activeProductionBatch
                  ? navigate(`/os/batches/${encodeURIComponent(activeProductionBatch.id)}`)
                  : navigate('/os/batches')
            }
          >
            <CardContent className="space-y-5 p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-white/10">
                    <FlaskConical className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
                      Live Now
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight">Active Production</h2>
                  </div>
                </div>
                <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200 md:block">
                  {activeProductionBatch
                    ? activeProductionBatch.recipeRunId
                      ? 'Runboard Ready'
                      : 'Batch Record'
                    : 'Idle'}
                </div>
              </div>
              {activeProductionBatch ? (
                <div className="space-y-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-center">
                    <div className="grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
                      {selectProductImage(activeProductionBatch.productSnapshot?.images, 'thumbnail') ? (
                        <img
                          src={selectProductImage(activeProductionBatch.productSnapshot?.images, 'thumbnail')}
                          alt={activeProductionBatch.productSnapshot?.productName ?? activeProductionBatch.recipeName}
                          className="mx-auto h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.25)] sm:mx-0"
                        />
                      ) : (
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:mx-0">
                          No Art
                        </div>
                      )}
                      <div className="min-w-0 space-y-3 text-center sm:text-left">
                        <div>
                          <p className="truncate text-2xl font-semibold">
                            {activeProductionBatch.productSnapshot?.productName ?? activeProductionBatch.recipeName}
                          </p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {activeProductionBatch.batchCode ?? activeProductionBatch.lotCode}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
                          <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 font-medium text-foreground capitalize">
                            {activeProductionBatch.status.replaceAll('_', ' ')}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 font-medium text-foreground">
                            SKU {activeProductionBatch.skuId ?? activeProductionBatch.productSnapshot?.productCode ?? '--'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 font-medium text-foreground">
                            {batchSummary?.active ?? activeProductionBatches.length} Active
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                        Current Vessel
                      </p>
                      <div className="mt-3 space-y-2">
                        <p className="text-lg font-semibold text-white">
                          {activeProductionBatch.batchCode ?? activeProductionBatch.lotCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activeProductionBatch.recipeRunId ? 'Runboard linked' : 'Batch record active'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatVolumeNumber(
                            Math.max(
                              0,
                              activeProductionBatch.producedQty -
                                activeProductionBatch.allocatedQty -
                                (activeProductionBatch.dispensedQty ?? 0)
                            )
                          )}{' '}
                          {activeProductionBatch.unit} available
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
                  >
                    {selectedActiveMetricCards.map((card) => (
                      <div
                        key={card.key}
                        className={`relative min-h-28 overflow-hidden rounded-2xl border px-4 py-4 ${card.config.colorClass}`}
                      >
                        <div className="absolute inset-x-3.5 top-3.5 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.24em] text-current/65">
                          {card.config.label}
                        </p>
                        <p className="mt-6 font-mono text-[2rem] font-semibold leading-none text-current">
                          {card.displayValue}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                          Trend View
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {selectedActiveGraphEntries.length > 0
                            ? selectedActiveGraphEntries.map((entry) => entry.config.label).join(' • ')
                            : 'No graph metrics selected'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Controlled from Settings → Dashboard.
                      </p>
                    </div>
                    {primaryActiveGraphEntry ? (
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                          <svg viewBox={`0 0 ${primaryActiveGraphEntry.chart.width} ${primaryActiveGraphEntry.chart.height}`} className="h-[180px] w-full">
                            <defs>
                              {selectedActiveGraphEntries.length === 1 ? (
                                <linearGradient id={`active-production-${primaryActiveGraphEntry.metricKey}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={primaryActiveGraphEntry.config.fill} />
                                  <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                                </linearGradient>
                              ) : null}
                            </defs>
                            {selectedActiveGraphEntries.length === 1 ? (
                              <path d={primaryActiveGraphEntry.chart.areaPath} fill={`url(#active-production-${primaryActiveGraphEntry.metricKey})`} />
                            ) : null}
                            {selectedActiveGraphEntries.map(({ metricKey, chart, config }) => (
                              <g key={`active-graph-${metricKey}`}>
                                <path
                                  d={chart.path}
                                  fill="none"
                                  stroke={config.stroke}
                                  strokeWidth="3"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                {chart.points.map((point) => (
                                  <circle
                                    key={point.id}
                                    cx={point.x}
                                    cy={point.y}
                                    r="3.5"
                                    fill={config.stroke}
                                    stroke="rgba(15,23,42,0.95)"
                                    strokeWidth="2"
                                  />
                                ))}
                              </g>
                            ))}
                          </svg>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedActiveGraphEntries.map(({ metricKey, config }) => (
                            <span
                              key={`active-legend-${metricKey}`}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: config.stroke }}
                              />
                              {config.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No trend readings recorded yet for this active batch.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No active batch record yet. Launch from New Batch or Recipe Launcher to start production.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-2 font-medium text-foreground">
                      Active {batchSummary?.active ?? activeProductionBatches.length}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-2 font-medium text-foreground">
                      Ready {batchSummary?.readyToRelease ?? 0}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-2 font-medium text-foreground">
                      On Hand {batchSummary?.onHandQty ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {snapshotCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  className="text-left"
                >
                  <Card className={`h-full overflow-hidden border-white/10 transition-colors hover:border-primary/40 ${card.accentClass}`}>
                    <CardContent className="relative p-5">
                      <div className={`absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent ${card.lineClass} to-transparent`} />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">OS Snapshot</p>
                          <p className="mt-3 text-3xl font-semibold leading-none text-white">{card.value}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                          <Icon className={`h-5 w-5 ${card.iconClass}`} />
                        </div>
                      </div>
                      <div className="mt-5 space-y-1">
                        <p className="text-sm font-medium text-white">{card.title}</p>
                        <p className="text-xs text-white/60">{card.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 xl:col-span-2 xl:grid-cols-3">
            {quickAccessCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  className="text-left"
                >
                  <Card className="h-full border-white/10 bg-white/5 transition-shadow hover:shadow-glow-lg">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-3 ring-1 ring-white/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-semibold">{card.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{card.subtitle}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {card.chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-white/10 bg-black/10 px-3 py-2 font-medium text-foreground"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Attention Queue</CardTitle>
                  <CardDescription>
                    {notificationsLoading
                      ? 'Loading OS reminders...'
                      : unreadNotifications.length > 0
                        ? `${unreadNotifications.length} unread reminders`
                        : 'No active reminders'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}>
                  Open Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attentionItems.length === 0 ? (
                  <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    Nothing urgent right now. Compliance deadlines, scheduled work, and requests will surface here.
                  </div>
                ) : (
                  attentionItems.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => navigate(resolveNotificationPath(notification))}
                      className="flex w-full items-start justify-between gap-3 rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted/70"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{categoryLabel(notification.category)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {relativeDueLabel(notification.dueAt ?? notification.updatedAt)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Batches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Recent Batches</CardTitle>
                  <CardDescription>{recentBatchStatus}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/os/batches')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBatchCards.length === 0 ? (
                  <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    No recent batches yet. Start one from New Batch or Recipe Launcher.
                  </div>
                ) : (
                  recentBatchCards.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        {batch.cardImageUrl ? (
                          <img
                            src={batch.cardImageUrl}
                            alt={batch.recipeName}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                            No art
                          </div>
                        )}
                        <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            {batch.batchCode ?? batch.lotCode}
                          </span>
                          <span className="text-sm font-medium">{batch.recipeName}</span>
                        </div>
                        <div className="mb-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${batch.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{batch.progress}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {batch.statusLabel} • {formatVolumeNumber(batch.availableQty)} {batch.unit} available
                        </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/os/batches/${batch.id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Category Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Select the type of item you want to add
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    {category.isIngredient && (
                      <span className="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        LAB-Tracked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
