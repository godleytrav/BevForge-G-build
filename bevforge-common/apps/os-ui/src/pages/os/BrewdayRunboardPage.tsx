import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  ArrowUpRight,
  AlertTriangle,
  Beaker,
  CheckCircle2,
  Clock3,
  Gauge,
  PackageCheck,
  Pause,
  Play,
  RefreshCcw,
  ShieldCheck,
  SkipForward,
  StopCircle,
} from 'lucide-react';
import { formatVolumeNumber } from '@/lib/volume-format';
import { getBatchOperationalReadiness } from '@/lib/production-readiness';
import {
  convertTemperatureToC,
  formatTemperatureValue,
  useOsDisplaySettings,
} from '@/lib/os-display';

type RecipeExecutionMode = 'automated' | 'hybrid' | 'manual';
type RecipeRunStatus =
  | 'running'
  | 'paused'
  | 'waiting_confirm'
  | 'completed'
  | 'failed'
  | 'canceled';
type RecipeRunStepStatus =
  | 'pending'
  | 'running'
  | 'waiting_confirm'
  | 'completed'
  | 'failed'
  | 'skipped';
type ReadingKind =
  | 'og'
  | 'fg'
  | 'sg'
  | 'temp'
  | 'ph'
  | 'abv'
  | 'brix'
  | 'ta'
  | 'so2'
  | 'residual_sugar'
  | 'va'
  | 'free_so2'
  | 'total_so2'
  | 'do'
  | 'snapshot'
  | 'note';
type TransferRouteKey =
  | 'hlt_to_mash'
  | 'mash_to_kettle'
  | 'kettle_to_fermenter'
  | 'fermenter_to_bright'
  | 'bright_to_packaging';

interface RecipeRunStep {
  id: string;
  name: string;
  stage?: string;
  action?: string;
  triggerWhen?: string;
  durationMin?: number;
  temperatureC?: number;
  status: RecipeRunStepStatus;
  startedAt?: string;
  message?: string;
}

interface RecipeRun {
  runId: string;
  recipeId: string;
  recipeName: string;
  executionMode?: RecipeExecutionMode;
  status: RecipeRunStatus;
  startedAt: string;
  currentStepIndex: number;
  steps: RecipeRunStep[];
}

interface BatchActualResults {
  og?: number;
  fg?: number;
  sgLatest?: number;
  abvPct?: number;
  phLatest?: number;
  brixLatest?: number;
  titratableAcidityGplLatest?: number;
  so2PpmLatest?: number;
  residualSugarGplLatest?: number;
  volatileAcidityGplLatest?: number;
  freeSo2PpmLatest?: number;
  totalSo2PpmLatest?: number;
  dissolvedOxygenPpmLatest?: number;
  temperatureCLatest?: number;
  finalVolumeQty?: number;
  finalVolumeUnit?: string;
}

interface BatchProductSnapshot {
  productId?: string;
  productCode?: string;
  productName?: string;
  labelAssetId?: string;
  labelVersionId?: string;
  beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
}

interface BatchRecord {
  id: string;
  siteId: string;
  batchKind?: 'source' | 'derived';
  batchCode?: string;
  lotCode: string;
  recipeRunId?: string;
  recipeName: string;
  status: string;
  productionMode?: 'scheduled_runboard' | 'cellar';
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  plannedVesselLabel?: string;
  plannedVesselKind?: 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  productSnapshot?: BatchProductSnapshot;
  actualResults?: BatchActualResults;
  treatmentLog?: Array<{
    id: string;
    timestamp: string;
    type: string;
    stage?: string;
    actor?: string;
    quantity?: number;
    unit?: string;
    lotCode?: string;
    note?: string;
  }>;
  volumeCheckpoints?: Array<{
    id: string;
    timestamp: string;
    stage: string;
    quantity: number;
    unit: string;
    note?: string;
    actor?: string;
  }>;
  sensoryQcRecords?: Array<{
    id: string;
    timestamp: string;
    stage?: string;
    visualNotes?: string;
    aromaNotes?: string;
    tasteNotes?: string;
    passFail?: string;
    approvalDecision?: string;
    actor?: string;
    note?: string;
  }>;
  stageTimeline?: Array<{
    id: string;
    timestamp: string;
    stage: string;
    actor?: string;
    note?: string;
  }>;
}

interface PackageLotRecord {
  id: string;
  packageLotCode?: string;
  lotCode: string;
  packageType: string;
  packageSkuId?: string;
  totalUnits: number;
  unitOfMeasure?: string;
}

interface RunboardProfile {
  runId: string;
  targetOg?: number;
  targetFg?: number;
  targetAbvPct?: number;
  notes?: string;
  updatedAt: string;
}

interface RecipeRunReading {
  id: string;
  runId: string;
  stepId?: string;
  kind?: ReadingKind;
  source: 'manual' | 'sensor';
  recordedAt: string;
  temperatureC?: number;
  sg?: number;
  ph?: number;
  abvPct?: number;
  brix?: number;
  titratableAcidityGpl?: number;
  so2Ppm?: number;
  residualSugarGpl?: number;
  volatileAcidityGpl?: number;
  freeSo2Ppm?: number;
  totalSo2Ppm?: number;
  dissolvedOxygenPpm?: number;
  note?: string;
}

const createClientId = () =>
  globalThis.crypto?.randomUUID?.() ?? `brewday-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toNumberOrUndefined = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const next = Number(trimmed);
  return Number.isFinite(next) ? next : undefined;
};

const countDecimals = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed.includes('.')) return 0;
  return trimmed.split('.')[1]?.length ?? 0;
};

const validateGravityField = (
  label: string,
  rawValue: string,
  options: { min: number; max: number; requireOgRange?: boolean }
): string | undefined => {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return `${label} must be a number.`;
  if (countDecimals(trimmed) > 3) {
    return `${label} should use 3 decimals, like 1.055.`;
  }
  if (parsed < options.min || parsed > options.max) {
    return `${label} must be between ${options.min.toFixed(3)} and ${options.max.toFixed(3)}.`;
  }
  if (options.requireOgRange && parsed < 1.01) {
    return `${label} looks too low for an original gravity reading.`;
  }
  return undefined;
};

const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      remaining
    ).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const stepIsTransferGate = (step: RecipeRunStep | null): boolean => {
  if (!step) return false;
  const text = `${step.name ?? ''} ${step.stage ?? ''} ${step.action ?? ''} ${step.triggerWhen ?? ''}`
    .trim()
    .toLowerCase();
  return text.includes('transfer');
};

const inferTransferRouteKey = (step: RecipeRunStep | null): TransferRouteKey | null => {
  if (!step) return null;
  const text = `${step.name ?? ''} ${step.stage ?? ''} ${step.action ?? ''} ${step.triggerWhen ?? ''}`
    .trim()
    .toLowerCase();
  if (text.includes('packag') || text.includes('keg') || text.includes('bottle')) {
    return 'bright_to_packaging';
  }
  if (text.includes('bright') || text.includes('conditioning') || text.includes('brite')) {
    return 'fermenter_to_bright';
  }
  if (text.includes('ferment') || text.includes('transfer_complete') || text.includes('chill')) {
    return 'kettle_to_fermenter';
  }
  if (text.includes('boil') || text.includes('kettle')) {
    return 'mash_to_kettle';
  }
  if (text.includes('mash') || text.includes('hlt')) {
    return 'hlt_to_mash';
  }
  return null;
};

const calculateAbv = (og?: number, fg?: number): number | undefined => {
  if (og === undefined || fg === undefined) return undefined;
  if (og <= fg) return 0;
  return (og - fg) * 131.25;
};

const formatNumber = (value: number | undefined, digits: number): string =>
  value === undefined || !Number.isFinite(value) ? '--' : value.toFixed(digits);

export default function BrewdayRunboardPage() {
  const navigate = useNavigate();
  const params = useParams<{ runId?: string }>();
  const { temperatureUnit } = useOsDisplaySettings();
  const [run, setRun] = useState<RecipeRun | null>(null);
  const [profile, setProfile] = useState<RunboardProfile | null>(null);
  const [readings, setReadings] = useState<RecipeRunReading[]>([]);
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [scheduledBatches, setScheduledBatches] = useState<BatchRecord[]>([]);
  const [packageLots, setPackageLots] = useState<PackageLotRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading brewday runboard...');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [readingDraft, setReadingDraft] = useState<{
    kind: ReadingKind;
    temperatureC: string;
    sg: string;
    ph: string;
    brix: string;
    titratableAcidityGpl: string;
    so2Ppm: string;
    residualSugarGpl: string;
    volatileAcidityGpl: string;
    freeSo2Ppm: string;
    totalSo2Ppm: string;
    dissolvedOxygenPpm: string;
    note: string;
  }>({
    kind: 'sg',
    temperatureC: '',
    sg: '',
    ph: '',
    brix: '',
    titratableAcidityGpl: '',
    so2Ppm: '',
    residualSugarGpl: '',
    volatileAcidityGpl: '',
    freeSo2Ppm: '',
    totalSo2Ppm: '',
    dissolvedOxygenPpm: '',
    note: '',
  });
  const [profileDraft, setProfileDraft] = useState<{
    targetOg: string;
    targetFg: string;
    targetAbvPct: string;
    notes: string;
  }>({
    targetOg: '',
    targetFg: '',
    targetAbvPct: '',
    notes: '',
  });
  const [treatmentDraft, setTreatmentDraft] = useState({
    type: 'sulfite_addition',
    stage: 'cellar',
    quantity: '',
    unit: 'ppm',
    lotCode: '',
    actor: '',
    note: '',
  });
  const [volumeDraft, setVolumeDraft] = useState({
    stage: 'start',
    quantity: '',
    unit: 'L',
    actor: '',
    note: '',
  });
  const [timelineDraft, setTimelineDraft] = useState({
    stage: 'fermentation_start',
    actor: '',
    note: '',
  });
  const [qcDraft, setQcDraft] = useState({
    stage: 'cellar',
    visualNotes: '',
    aromaNotes: '',
    tasteNotes: '',
    passFail: 'pass',
    approvalDecision: 'approved',
    actor: '',
    note: '',
  });

  const targetRunId = params.runId ? String(params.runId).trim() : '';

  const loadRuns = useCallback(async () => {
    const response = await fetch('/api/os/recipes/runs');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load recipe runs');
    }
    const nextRuns = (payload.data ?? []) as RecipeRun[];
    return nextRuns;
  }, []);

  const loadRunboard = useCallback(
    async (runId: string) => {
      const response = await fetch(`/api/os/recipes/run/${runId}/runboard`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load runboard');
      }
      const nextRun = payload.data?.run as RecipeRun;
      const nextProfile = (payload.data?.profile ?? null) as RunboardProfile | null;
      setRun(nextRun);
      setProfile(nextProfile);
      setBatch((payload.data?.batch ?? null) as BatchRecord | null);
      setPackageLots((payload.data?.packageLots ?? []) as PackageLotRecord[]);
      setProfileDraft({
        targetOg: nextProfile?.targetOg !== undefined ? String(nextProfile.targetOg) : '',
        targetFg: nextProfile?.targetFg !== undefined ? String(nextProfile.targetFg) : '',
        targetAbvPct:
          nextProfile?.targetAbvPct !== undefined ? String(nextProfile.targetAbvPct) : '',
        notes: nextProfile?.notes ?? '',
      });
      return nextRun;
    },
    []
  );

  const loadReadings = useCallback(async (runId: string) => {
    const response = await fetch(`/api/os/recipes/run/${runId}/readings?limit=300`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load run readings');
    }
    setReadings((payload.data ?? []) as RecipeRunReading[]);
  }, []);

  const loadScheduledBatches = useCallback(async () => {
    const response = await fetch('/api/os/batches');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load scheduled batches');
    }
    const nextBatches = ((payload.data?.batches ?? []) as BatchRecord[])
      .filter(
        (entry) =>
          entry.batchKind !== 'derived' &&
          entry.productionMode !== 'cellar' &&
          (entry.status === 'planned' || entry.status === 'in_progress')
      )
      .sort((left, right) => {
        const leftMs = left.scheduledStartAt
          ? Date.parse(left.scheduledStartAt)
          : Number.POSITIVE_INFINITY;
        const rightMs = right.scheduledStartAt
          ? Date.parse(right.scheduledStartAt)
          : Number.POSITIVE_INFINITY;
        return leftMs - rightMs;
      });
    setScheduledBatches(nextBatches);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await loadScheduledBatches();
      const nextRuns = await loadRuns();
      const selected =
        (targetRunId ? nextRuns.find((entry) => entry.runId === targetRunId) : null) ??
        nextRuns.find(
          (entry) =>
            entry.status === 'running' ||
            entry.status === 'waiting_confirm' ||
            entry.status === 'paused'
        ) ??
        nextRuns[0];
      if (!selected) {
        setRun(null);
        setBatch(null);
        setPackageLots([]);
        setReadings([]);
        setStatusMessage('No active recipe run found. Scheduled source batches still appear below.');
        return;
      }
      if (!targetRunId || targetRunId !== selected.runId) {
        navigate(`/os/brewday/${encodeURIComponent(selected.runId)}`, { replace: true });
      }
      await Promise.all([loadRunboard(selected.runId), loadReadings(selected.runId)]);
      setStatusMessage('Brewday runboard updated.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to refresh runboard.');
    }
  }, [loadReadings, loadRunboard, loadRuns, loadScheduledBatches, navigate, targetRunId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!run || (run.status !== 'running' && run.status !== 'waiting_confirm')) return;
    const interval = window.setInterval(() => {
      void fetch(`/api/os/recipes/run/${run.runId}/readings/snapshot`, {
        method: 'POST',
      }).catch(() => undefined);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [run]);

  const currentStep = useMemo(() => {
    if (!run) return null;
    if (run.currentStepIndex < 0 || run.currentStepIndex >= run.steps.length) return null;
    return run.steps[run.currentStepIndex] ?? null;
  }, [run]);

  const remainingSeconds = useMemo(() => {
    if (!currentStep) return null;
    const durationMin = Number(currentStep.durationMin);
    if (!Number.isFinite(durationMin) || durationMin <= 0) return null;
    const startedMs = currentStep.startedAt ? Date.parse(currentStep.startedAt) : NaN;
    if (!Number.isFinite(startedMs)) return null;
    const totalSeconds = Math.floor(durationMin * 60);
    const elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
    return Math.max(0, totalSeconds - elapsed);
  }, [currentStep, nowMs]);

  const sgReadings = useMemo(
    () =>
      readings
        .filter((reading) => reading.sg !== undefined)
        .sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt)),
    [readings]
  );
  const ogReading = useMemo(
    () => sgReadings.find((reading) => reading.kind === 'og') ?? sgReadings[0],
    [sgReadings]
  );
  const fgReading = useMemo(() => {
    const explicit = [...sgReadings]
      .reverse()
      .find((reading) => reading.kind === 'fg');
    if (explicit) return explicit;
    if (run?.status === 'completed' || run?.status === 'canceled' || run?.status === 'failed') {
      return sgReadings[sgReadings.length - 1];
    }
    return undefined;
  }, [run?.status, sgReadings]);
  const latestSg = sgReadings.length > 0 ? sgReadings[sgReadings.length - 1] : undefined;
  const latestTemp = useMemo(
    () =>
      readings.find((reading) => reading.temperatureC !== undefined)?.temperatureC ??
      currentStep?.temperatureC,
    [currentStep?.temperatureC, readings]
  );
  const latestPh = readings.find((reading) => reading.ph !== undefined)?.ph;
  const latestAbv = readings.find((reading) => reading.abvPct !== undefined)?.abvPct;
  const latestBrix = readings.find((reading) => reading.brix !== undefined)?.brix;
  const latestTitratableAcidity = readings.find(
    (reading) => reading.titratableAcidityGpl !== undefined
  )?.titratableAcidityGpl;
  const latestSo2 = readings.find((reading) => reading.so2Ppm !== undefined)?.so2Ppm;
  const latestResidualSugar = readings.find((reading) => reading.residualSugarGpl !== undefined)?.residualSugarGpl;
  const latestVa = readings.find((reading) => reading.volatileAcidityGpl !== undefined)?.volatileAcidityGpl;
  const latestFreeSo2 = readings.find((reading) => reading.freeSo2Ppm !== undefined)?.freeSo2Ppm;
  const latestTotalSo2 = readings.find((reading) => reading.totalSo2Ppm !== undefined)?.totalSo2Ppm;
  const latestDissolvedOxygen = readings.find((reading) => reading.dissolvedOxygenPpm !== undefined)?.dissolvedOxygenPpm;

  const targetOg = profile?.targetOg;
  const targetFg = profile?.targetFg;
  const computedAbv = calculateAbv(
    ogReading?.sg ?? targetOg,
    latestSg?.sg ?? fgReading?.sg
  );
  const targetAbv = profile?.targetAbvPct ?? calculateAbv(targetOg, targetFg);
  const readingValidation = useMemo(() => {
    const fieldErrors: { sg?: string } = {};
    const issues: string[] = [];
    const kind = readingDraft.kind;
    const gravityInput = readingDraft.sg;

    if (kind === 'og') {
      fieldErrors.sg = validateGravityField('OG', gravityInput, {
        min: 1.01,
        max: 1.2,
        requireOgRange: true,
      });
    } else if (kind === 'fg' || kind === 'sg') {
      fieldErrors.sg = validateGravityField(kind === 'fg' ? 'FG' : 'Current SG', gravityInput, {
        min: 0.9,
        max: 1.2,
      });
    }

    const ogValue =
      kind === 'og'
        ? toNumberOrUndefined(readingDraft.sg)
        : batch?.actualResults?.og ?? ogReading?.sg ?? targetOg;
    const fgValue = kind === 'fg' ? toNumberOrUndefined(readingDraft.sg) : undefined;
    const sgValue = kind === 'sg' ? toNumberOrUndefined(readingDraft.sg) : latestSg?.sg;

    if (kind === 'fg' && ogValue !== undefined && fgValue !== undefined && ogValue < fgValue) {
      issues.push('OG should be greater than or equal to FG.');
    }
    if (kind === 'sg' && ogValue !== undefined && sgValue !== undefined && ogValue < sgValue) {
      issues.push('OG should be greater than or equal to the current SG.');
    }
    if ((kind === 'og' || kind === 'fg' || kind === 'sg') && !gravityInput.trim()) {
      issues.push('Enter a gravity value for this reading type.');
    }

    const hasObservedInput =
      Boolean(readingDraft.temperatureC.trim()) ||
      Boolean(readingDraft.sg.trim()) ||
      Boolean(readingDraft.ph.trim()) ||
      Boolean(readingDraft.brix.trim()) ||
      Boolean(readingDraft.titratableAcidityGpl.trim()) ||
      Boolean(readingDraft.so2Ppm.trim()) ||
      Boolean(readingDraft.residualSugarGpl.trim()) ||
      Boolean(readingDraft.volatileAcidityGpl.trim()) ||
      Boolean(readingDraft.freeSo2Ppm.trim()) ||
      Boolean(readingDraft.totalSo2Ppm.trim()) ||
      Boolean(readingDraft.dissolvedOxygenPpm.trim()) ||
      Boolean(readingDraft.note.trim());

    return {
      fieldErrors,
      issues,
      hasErrors: Boolean(fieldErrors.sg) || issues.length > 0,
      hasObservedInput,
    };
  }, [batch?.actualResults?.og, latestSg?.sg, ogReading?.sg, readingDraft, targetOg]);

  const currentStepTransferGate = stepIsTransferGate(currentStep);
  const currentTransferRouteKey = inferTransferRouteKey(currentStep);
  const linkedBatchAvailableQty = batch
    ? Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0))
    : 0;
  const scheduledQueue = useMemo(
    () =>
      scheduledBatches.map((entry) => ({
        ...entry,
        isCurrentRunBatch: Boolean(batch && entry.id === batch.id),
      })),
    [batch, scheduledBatches]
  );
  const batchReadiness = getBatchOperationalReadiness({
    batchStatus: batch?.status,
    productSnapshot: batch?.productSnapshot,
    actualResults: batch?.actualResults,
    recipeRunId: batch?.recipeRunId,
    packageLotCount: packageLots.length,
  });

  const runAction = async (action: 'pause' | 'resume' | 'confirm' | 'next' | 'stop') => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Run action failed');
      }
      await refresh();
      setStatusMessage(`Action complete: ${action}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Run action failed.');
    } finally {
      setBusy(false);
    }
  };

  const runTransfer = async (action: 'start' | 'complete') => {
    if (!run || !currentStepTransferGate) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          routeKey: currentTransferRouteKey,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Transfer action failed');
      }
      if (action === 'complete') {
        await runAction('confirm');
      } else {
        await refresh();
      }
      setStatusMessage(
        action === 'start' ? 'Transfer route started.' : 'Transfer route complete and confirmed.'
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Transfer action failed.');
    } finally {
      setBusy(false);
    }
  };

  const confirmManualTransfer = async () => {
    await runAction('confirm');
    setStatusMessage('Manual transfer confirmed.');
  };

  const captureSnapshot = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/readings/snapshot`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'No sensor snapshot available');
      }
      await loadReadings(run.runId);
      setStatusMessage('Sensor snapshot recorded.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to capture snapshot.');
    } finally {
      setBusy(false);
    }
  };

  const addReading = async () => {
    if (!run) return;
    if (readingValidation.hasErrors || !readingValidation.hasObservedInput) {
      setStatusMessage('Fix the highlighted reading values before recording.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: currentStep?.id,
          kind: readingDraft.kind,
          source: 'manual',
          temperatureC: convertTemperatureToC(
            toNumberOrUndefined(readingDraft.temperatureC),
            temperatureUnit
          ),
          sg: toNumberOrUndefined(readingDraft.sg),
          ph: toNumberOrUndefined(readingDraft.ph),
          brix: toNumberOrUndefined(readingDraft.brix),
          titratableAcidityGpl: toNumberOrUndefined(readingDraft.titratableAcidityGpl),
          so2Ppm: toNumberOrUndefined(readingDraft.so2Ppm),
          residualSugarGpl: toNumberOrUndefined(readingDraft.residualSugarGpl),
          volatileAcidityGpl: toNumberOrUndefined(readingDraft.volatileAcidityGpl),
          freeSo2Ppm: toNumberOrUndefined(readingDraft.freeSo2Ppm),
          totalSo2Ppm: toNumberOrUndefined(readingDraft.totalSo2Ppm),
          dissolvedOxygenPpm: toNumberOrUndefined(readingDraft.dissolvedOxygenPpm),
          note: readingDraft.note || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to add reading');
      }
      setReadingDraft({
        kind: 'sg',
        temperatureC: '',
        sg: '',
        ph: '',
        brix: '',
        titratableAcidityGpl: '',
        so2Ppm: '',
        residualSugarGpl: '',
        volatileAcidityGpl: '',
        freeSo2Ppm: '',
        totalSo2Ppm: '',
        dissolvedOxygenPpm: '',
        note: '',
      });
      await loadReadings(run.runId);
      setStatusMessage('Reading added.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to add reading.');
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${run.runId}/runboard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetOg: toNumberOrUndefined(profileDraft.targetOg),
          targetFg: toNumberOrUndefined(profileDraft.targetFg),
          targetAbvPct: toNumberOrUndefined(profileDraft.targetAbvPct),
          notes: profileDraft.notes || null,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save brew targets');
      }
      await refresh();
      setStatusMessage('Brew targets saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save brew targets.');
    } finally {
      setBusy(false);
    }
  };

  const updateLinkedBatchRecord = async (payload: Record<string, unknown>, successMessage: string) => {
    if (!batch) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/batches/${batch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producedQty: batch.producedQty,
          unit: batch.unit,
          status: batch.status,
          ...payload,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? 'Failed to update linked batch record.');
      }
      await refresh();
      setStatusMessage(successMessage);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to update linked batch record.'
      );
    } finally {
      setBusy(false);
    }
  };

  const saveBrewdayProductionRecord = async () => {
    if (!batch) return;
    const nextTreatmentLog =
      treatmentDraft.quantity.trim() ||
      treatmentDraft.note.trim() ||
      treatmentDraft.lotCode.trim() ||
      treatmentDraft.actor.trim()
        ? [
            ...(batch.treatmentLog ?? []),
            {
              id: createClientId(),
              timestamp: new Date().toISOString(),
              type: treatmentDraft.type.trim() || 'other',
              stage: treatmentDraft.stage.trim() || undefined,
              quantity: toNumberOrUndefined(treatmentDraft.quantity),
              unit: treatmentDraft.unit.trim() || undefined,
              lotCode: treatmentDraft.lotCode.trim() || undefined,
              actor: treatmentDraft.actor.trim() || undefined,
              note: treatmentDraft.note.trim() || undefined,
            },
          ]
        : batch.treatmentLog ?? [];
    await updateLinkedBatchRecord(
      {
        treatmentLog: nextTreatmentLog,
        volumeCheckpoints: volumeDraft.quantity.trim()
          ? [
              ...(batch.volumeCheckpoints ?? []),
              {
                id: createClientId(),
                timestamp: new Date().toISOString(),
                stage: volumeDraft.stage.trim() || 'other',
                quantity: Number(volumeDraft.quantity),
                unit: volumeDraft.unit.trim() || batch.unit,
                actor: volumeDraft.actor.trim() || undefined,
                note: volumeDraft.note.trim() || undefined,
              },
            ]
          : batch.volumeCheckpoints ?? [],
        stageTimeline: timelineDraft.stage.trim()
          ? [
              ...(batch.stageTimeline ?? []),
              {
                id: createClientId(),
                timestamp: new Date().toISOString(),
                stage: timelineDraft.stage.trim(),
                actor: timelineDraft.actor.trim() || undefined,
                note: timelineDraft.note.trim() || undefined,
              },
            ]
          : batch.stageTimeline ?? [],
        sensoryQcRecords:
          qcDraft.visualNotes.trim() ||
          qcDraft.aromaNotes.trim() ||
          qcDraft.tasteNotes.trim() ||
          qcDraft.note.trim()
            ? [
                ...(batch.sensoryQcRecords ?? []),
                {
                  id: createClientId(),
                  timestamp: new Date().toISOString(),
                  stage: qcDraft.stage.trim() || undefined,
                  visualNotes: qcDraft.visualNotes.trim() || undefined,
                  aromaNotes: qcDraft.aromaNotes.trim() || undefined,
                  tasteNotes: qcDraft.tasteNotes.trim() || undefined,
                  passFail: qcDraft.passFail.trim() || undefined,
                  approvalDecision: qcDraft.approvalDecision.trim() || undefined,
                  actor: qcDraft.actor.trim() || undefined,
                  note: qcDraft.note.trim() || undefined,
                },
              ]
            : batch.sensoryQcRecords ?? [],
        actualResults: {
          residualSugarGplLatest:
            toNumberOrUndefined(readingDraft.residualSugarGpl) ?? batch.actualResults?.residualSugarGplLatest,
          volatileAcidityGplLatest:
            toNumberOrUndefined(readingDraft.volatileAcidityGpl) ?? batch.actualResults?.volatileAcidityGplLatest,
          freeSo2PpmLatest:
            toNumberOrUndefined(readingDraft.freeSo2Ppm) ?? batch.actualResults?.freeSo2PpmLatest,
          totalSo2PpmLatest:
            toNumberOrUndefined(readingDraft.totalSo2Ppm) ?? batch.actualResults?.totalSo2PpmLatest,
          dissolvedOxygenPpmLatest:
            toNumberOrUndefined(readingDraft.dissolvedOxygenPpm) ??
            batch.actualResults?.dissolvedOxygenPpmLatest,
        },
      },
      'Linked batch production record updated.'
    );
  };

  return (
    <AppShell currentSuite="os" pageTitle="Brewday Runboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Brewday Runboard</h1>
            <p className="text-muted-foreground mt-1">
              Batch-to-package operator workflow for manual cellar work and automation-assisted runs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/os/calendar')}>
              Open Calendar
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/recipe-execution')}>
              Recipe Launcher
            </Button>
            <Button variant="outline" onClick={() => void refresh()} disabled={busy}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle>Scheduled Production Queue</CardTitle>
            <CardDescription>
              Source batches scheduled into the runboard lane. Use this as the main fermentor production queue, while cellar monitoring stays on each batch record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-5 text-sm text-muted-foreground">
                No scheduled source batches yet. Create a source batch, add a scheduled start, and it will show up here and on the Calendar.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {scheduledQueue.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/os/batches/${encodeURIComponent(entry.id)}`}
                    className="rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-background/80"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold leading-tight text-foreground">
                          {entry.productSnapshot?.productName || entry.recipeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.batchCode || entry.lotCode}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="secondary">{entry.status.replaceAll('_', ' ')}</Badge>
                          {entry.plannedVesselLabel ? (
                            <Badge variant="outline">{entry.plannedVesselLabel}</Badge>
                          ) : null}
                          {entry.isCurrentRunBatch ? (
                            <Badge className="border border-emerald-400/20 bg-emerald-500/15 text-emerald-200">
                              live run
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-xl border border-cyan-400/20 bg-slate-950/60 px-3 py-2 text-right shadow-inner shadow-cyan-950/40">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
                          scheduled
                        </p>
                        <p className="font-mono text-sm text-cyan-50">
                          {entry.scheduledStartAt
                            ? new Date(entry.scheduledStartAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : 'unscheduled'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!run ? (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                No active recipe run found.
              </p>
              <Button asChild>
                <Link to="/os/recipe-execution">Open Recipe Launcher</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Run Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{run.executionMode ?? 'automated'}</Badge>
                    <Badge>{run.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{run.recipeName}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">OG</p>
                  <p className="text-2xl font-semibold">
                    {formatNumber(ogReading?.sg ?? targetOg, 3)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    target {formatNumber(targetOg, 3)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">FG / Current SG</p>
                  <p className="text-2xl font-semibold">
                    {fgReading?.sg !== undefined
                      ? formatNumber(fgReading.sg, 3)
                      : latestSg?.sg !== undefined
                        ? formatNumber(latestSg.sg, 3)
                        : '--'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    target {formatNumber(targetFg, 3)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">ABV</p>
                  <p className="text-2xl font-semibold">
                    {formatNumber(latestAbv ?? computedAbv, 2)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    target {formatNumber(targetAbv, 2) !== '--' ? `${formatNumber(targetAbv, 2)}%` : '--'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Temp / pH</p>
                  <p className="text-2xl font-semibold">
                    {formatNumber(latestTemp, 1) !== '--' ? `${formatNumber(latestTemp, 1)}C` : '--'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    pH {formatNumber(latestPh, 2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Linked Batch</CardTitle>
                  <CardDescription>
                    Use this as the production record while you run manual cellar work and transfers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {batch ? (
                    <>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Batch</p>
                          <p className="font-mono font-medium">{batch.batchCode ?? batch.lotCode}</p>
                          <p className="text-xs text-muted-foreground mt-1">{batch.status}</p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Product</p>
                          <p className="font-medium">
                            {batch.productSnapshot?.productName ?? batch.recipeName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {batch.productSnapshot?.productCode ?? '--'}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Available Qty</p>
                          <p className="font-medium">
                            {formatVolumeNumber(linkedBatchAvailableQty)} {batch.unit}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Site {batch.siteId}</p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Package Lots</p>
                          <p className="font-medium">{packageLots.length}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {packageLots.length > 0
                              ? packageLots
                                  .slice(0, 1)
                                  .map((lot) => lot.packageLotCode ?? lot.lotCode)
                                  .join(', ')
                              : 'None yet'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">OG</p>
                          <p className="font-medium">
                            {formatNumber(batch.actualResults?.og ?? ogReading?.sg ?? targetOg, 3)}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Current SG / FG</p>
                          <p className="font-medium">
                            {formatNumber(
                              batch.actualResults?.fg ??
                                batch.actualResults?.sgLatest ??
                                latestSg?.sg ??
                                targetFg,
                              3
                            )}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Temp</p>
                          <p className="font-medium">
                            {formatTemperatureValue(
                              batch.actualResults?.temperatureCLatest ?? latestTemp,
                              temperatureUnit,
                              1
                            ) !== '--'
                              ? `${formatTemperatureValue(
                                  batch.actualResults?.temperatureCLatest ?? latestTemp,
                                  temperatureUnit,
                                  1
                                )} °${temperatureUnit}`
                              : '--'}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">pH</p>
                          <p className="font-medium">
                            {formatNumber(batch.actualResults?.phLatest ?? latestPh, 2)}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">ABV</p>
                          <p className="font-medium">
                            {formatNumber(batch.actualResults?.abvPct ?? latestAbv ?? computedAbv, 2)}
                            %
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Brix</p>
                          <p className="font-medium">
                            {formatNumber(batch.actualResults?.brixLatest ?? latestBrix, 2)}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">TA</p>
                          <p className="font-medium">
                            {formatNumber(
                              batch.actualResults?.titratableAcidityGplLatest ??
                                latestTitratableAcidity,
                              2
                            ) !== '--'
                              ? `${formatNumber(
                                  batch.actualResults?.titratableAcidityGplLatest ??
                                    latestTitratableAcidity,
                                  2
                                )} g/L`
                              : '--'}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">SO2 / Sulfite</p>
                          <p className="font-medium">
                            {formatNumber(batch.actualResults?.so2PpmLatest ?? latestSo2, 0) !== '--'
                              ? `${formatNumber(batch.actualResults?.so2PpmLatest ?? latestSo2, 0)} ppm`
                              : '--'}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Residual Sugar</p>
                          <p className="font-medium">
                            {formatNumber(
                              batch.actualResults?.residualSugarGplLatest ?? latestResidualSugar,
                              2
                            ) !== '--'
                              ? `${formatNumber(
                                  batch.actualResults?.residualSugarGplLatest ?? latestResidualSugar,
                                  2
                                )} g/L`
                              : '--'}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">VA</p>
                          <p className="font-medium">
                            {formatNumber(
                              batch.actualResults?.volatileAcidityGplLatest ?? latestVa,
                              2
                            ) !== '--'
                              ? `${formatNumber(
                                  batch.actualResults?.volatileAcidityGplLatest ?? latestVa,
                                  2
                                )} g/L`
                              : '--'}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Free / Total SO2</p>
                          <p className="font-medium">
                            {formatNumber(batch.actualResults?.freeSo2PpmLatest ?? latestFreeSo2, 0)} /{' '}
                            {formatNumber(batch.actualResults?.totalSo2PpmLatest ?? latestTotalSo2, 0)}
                          </p>
                        </div>
                        <div className="rounded border border-border p-3">
                          <p className="text-xs text-muted-foreground">Dissolved O2</p>
                          <p className="font-medium">
                            {formatNumber(
                              batch.actualResults?.dissolvedOxygenPpmLatest ?? latestDissolvedOxygen,
                              2
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => navigate(`/os/batches/${batch.id}`)}>
                          <ArrowUpRight className="mr-1 h-4 w-4" />
                          Open Batch
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/os/transfers?sourceBatchId=${batch.id}`)}
                        >
                          <ArrowRightLeft className="mr-1 h-4 w-4" />
                          Open Transfers
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/os/packaging?sourceBatchId=${batch.id}`)}
                        >
                          <PackageCheck className="mr-1 h-4 w-4" />
                          Open Packaging
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This run is not yet linked to a batch record. Start from Recipe Launcher or
                      create a manual batch so OS can track the lot through packaging.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Production Readiness</CardTitle>
                  <CardDescription>
                    Quick month-one checklist for manual cider workflow and traceability.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">Required checks complete</p>
                      <p className="text-xs text-muted-foreground">
                        {batchReadiness.requiredPassCount} of {batchReadiness.requiredTotal} required
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {batchReadiness.overallTone === 'ready' ? (
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      )}
                      <span className="text-sm font-medium">
                        {batchReadiness.overallTone === 'ready' ? 'Ready to advance' : 'Needs attention'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {batchReadiness.items.map((item) => (
                      <div
                        key={item.key}
                        className={`rounded border p-2 text-sm ${
                          item.ok
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : item.required
                              ? 'border-amber-500/30 bg-amber-500/5'
                              : 'border-border bg-background/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{item.label}</p>
                          <div className="flex items-center gap-2">
                            {item.required ? (
                              <Badge variant="outline">Required</Badge>
                            ) : (
                              <Badge variant="outline">Advisory</Badge>
                            )}
                            <Badge variant={item.ok ? 'secondary' : 'outline'}>
                              {item.ok ? 'Logged' : 'Missing'}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Current Step</CardTitle>
                  <CardDescription>
                    Step {run.currentStepIndex + 1} of {run.steps.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentStep ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{currentStep.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currentStep.stage ?? '--'} • {currentStep.action ?? '--'}
                          </p>
                        </div>
                        <Badge variant="outline">{currentStep.status}</Badge>
                      </div>
                      {remainingSeconds !== null && (
                        <div className="rounded border border-border p-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock3 className="h-4 w-4" />
                            Step Timer
                          </span>
                          <span className="font-mono font-semibold">{formatClock(remainingSeconds)}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => void runAction(run.status === 'paused' ? 'resume' : 'pause')}
                          disabled={busy}
                        >
                          {run.status === 'paused' ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                          {run.status === 'paused' ? 'Resume' : 'Pause'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void runAction('confirm')}
                          disabled={busy || run.status !== 'waiting_confirm'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button variant="outline" onClick={() => void runAction('next')} disabled={busy}>
                          <SkipForward className="h-4 w-4 mr-1" />
                          Next
                        </Button>
                        <Button variant="destructive" onClick={() => void runAction('stop')} disabled={busy}>
                          <StopCircle className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                        <Button variant="outline" onClick={() => void captureSnapshot()} disabled={busy}>
                          <Gauge className="h-4 w-4 mr-1" />
                          Capture Sensors
                        </Button>
                        <Button asChild variant="outline">
                          <Link to="/os/control-panel">Control Panel</Link>
                        </Button>
                      </div>
                      {currentStepTransferGate && (
                        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 space-y-2">
                          <p>
                            Transfer gate detected ({currentTransferRouteKey ?? 'unresolved'}). Use mapped transfer or manual confirm.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void runTransfer('start')}
                              disabled={busy}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                              Run Transfer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void runTransfer('complete')}
                              disabled={busy}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                              Confirm Transfer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void confirmManualTransfer()}
                              disabled={busy}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Manual Transfer Done
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No current step.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brew Targets</CardTitle>
                  <CardDescription>Set expected OG/FG/ABV for batch tracking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label>Target OG</Label>
                    <Input
                      value={profileDraft.targetOg}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, targetOg: event.target.value }))
                      }
                      placeholder="1.058"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Target FG</Label>
                    <Input
                      value={profileDraft.targetFg}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, targetFg: event.target.value }))
                      }
                      placeholder="1.012"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Target ABV %</Label>
                    <Input
                      value={profileDraft.targetAbvPct}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, targetAbvPct: event.target.value }))
                      }
                      placeholder="6.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Input
                      value={profileDraft.notes}
                      onChange={(event) =>
                        setProfileDraft((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Expected high attenuation"
                    />
                  </div>
                  <Button onClick={() => void saveProfile()} disabled={busy} className="w-full">
                    Save Targets
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Readings & Brew Log</CardTitle>
                <CardDescription>
                  Record OG/FG/daily readings and cider cellar measurements for the production record.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4 xl:grid-cols-8">
                  <div className="space-y-1">
                    <Label>Reading Type</Label>
                    <Select
                      value={readingDraft.kind}
                      onValueChange={(value) =>
                        setReadingDraft((prev) => ({ ...prev, kind: value as ReadingKind }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="og">OG</SelectItem>
                        <SelectItem value="sg">Daily SG</SelectItem>
                        <SelectItem value="fg">FG</SelectItem>
                        <SelectItem value="temp">Temperature</SelectItem>
                        <SelectItem value="ph">pH</SelectItem>
                        <SelectItem value="brix">Brix</SelectItem>
                        <SelectItem value="ta">TA</SelectItem>
                        <SelectItem value="so2">SO2 / Sulfite</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{`Temp °${temperatureUnit}`}</Label>
                    <Input
                      value={readingDraft.temperatureC}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, temperatureC: event.target.value }))
                      }
                      placeholder={temperatureUnit === 'F' ? '64.8' : '18.2'}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {readingDraft.kind === 'og'
                        ? 'OG'
                        : readingDraft.kind === 'fg'
                          ? 'FG'
                          : 'SG'}
                    </Label>
                    <Input
                      value={readingDraft.sg}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, sg: event.target.value }))
                      }
                      placeholder="1.012"
                    />
                    {readingValidation.fieldErrors.sg ? (
                      <p className="text-xs text-amber-300">{readingValidation.fieldErrors.sg}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Label>pH</Label>
                    <Input
                      value={readingDraft.ph}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, ph: event.target.value }))
                      }
                      placeholder="4.30"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Brix</Label>
                    <Input
                      value={readingDraft.brix}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, brix: event.target.value }))
                      }
                      placeholder="11.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>TA (g/L)</Label>
                    <Input
                      value={readingDraft.titratableAcidityGpl}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({
                          ...prev,
                          titratableAcidityGpl: event.target.value,
                        }))
                      }
                      placeholder="6.20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>SO2 / Sulfite (ppm)</Label>
                    <Input
                      value={readingDraft.so2Ppm}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, so2Ppm: event.target.value }))
                      }
                      placeholder="35"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Residual Sugar (g/L)</Label>
                    <Input
                      value={readingDraft.residualSugarGpl}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, residualSugarGpl: event.target.value }))
                      }
                      placeholder="4.20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>VA (g/L)</Label>
                    <Input
                      value={readingDraft.volatileAcidityGpl}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, volatileAcidityGpl: event.target.value }))
                      }
                      placeholder="0.55"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Free SO2 (ppm)</Label>
                    <Input
                      value={readingDraft.freeSo2Ppm}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, freeSo2Ppm: event.target.value }))
                      }
                      placeholder="22"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Total SO2 (ppm)</Label>
                    <Input
                      value={readingDraft.totalSo2Ppm}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, totalSo2Ppm: event.target.value }))
                      }
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Dissolved O2 (ppm)</Label>
                    <Input
                      value={readingDraft.dissolvedOxygenPpm}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({
                          ...prev,
                          dissolvedOxygenPpm: event.target.value,
                        }))
                      }
                      placeholder="0.09"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Note</Label>
                    <Input
                      value={readingDraft.note}
                      onChange={(event) =>
                        setReadingDraft((prev) => ({ ...prev, note: event.target.value }))
                      }
                      placeholder="Hydrometer @ 2:15 PM"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Readings attach to current run and step for traceability, including cellar Brix,
                    TA, SO2, residual sugar, VA, and dissolved oxygen.
                  </p>
                  <Button
                    onClick={() => void addReading()}
                    disabled={busy || !readingValidation.hasObservedInput || readingValidation.hasErrors}
                  >
                    <Beaker className="h-4 w-4 mr-1" />
                    Add Reading
                  </Button>
                </div>
                {readingValidation.issues.length > 0 ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                    <div className="space-y-1">
                      {readingValidation.issues.map((issue) => (
                        <p key={issue} className="text-xs text-amber-200">
                          {issue}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {readings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No readings captured yet.</p>
                ) : (
                  <div className="space-y-2">
                    {readings.slice(0, 12).map((reading) => (
                      <div key={reading.id} className="rounded border border-border p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{reading.kind ?? 'reading'}</Badge>
                            <Badge variant="outline">{reading.source}</Badge>
                            <span className="text-muted-foreground">{reading.recordedAt}</span>
                          </div>
                          {reading.stepId && (
                            <span className="text-muted-foreground">step {reading.stepId}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-muted-foreground">
                          {reading.temperatureC !== undefined && (
                            <span>Temp {formatTemperatureValue(reading.temperatureC, temperatureUnit, 1)}°{temperatureUnit}</span>
                          )}
                          {reading.sg !== undefined && <span>SG {reading.sg.toFixed(3)}</span>}
                          {reading.ph !== undefined && <span>pH {reading.ph.toFixed(2)}</span>}
                          {reading.abvPct !== undefined && (
                            <span>ABV {reading.abvPct.toFixed(2)}%</span>
                          )}
                          {reading.brix !== undefined && (
                            <span>Brix {reading.brix.toFixed(2)}</span>
                          )}
                          {reading.titratableAcidityGpl !== undefined && (
                            <span>TA {reading.titratableAcidityGpl.toFixed(2)} g/L</span>
                          )}
                          {reading.so2Ppm !== undefined && (
                            <span>SO2 {reading.so2Ppm.toFixed(0)} ppm</span>
                          )}
                          {reading.residualSugarGpl !== undefined && (
                            <span>RS {reading.residualSugarGpl.toFixed(2)} g/L</span>
                          )}
                          {reading.volatileAcidityGpl !== undefined && (
                            <span>VA {reading.volatileAcidityGpl.toFixed(2)} g/L</span>
                          )}
                          {reading.freeSo2Ppm !== undefined && (
                            <span>Free SO2 {reading.freeSo2Ppm.toFixed(0)} ppm</span>
                          )}
                          {reading.totalSo2Ppm !== undefined && (
                            <span>Total SO2 {reading.totalSo2Ppm.toFixed(0)} ppm</span>
                          )}
                          {reading.dissolvedOxygenPpm !== undefined && (
                            <span>DO {reading.dissolvedOxygenPpm.toFixed(2)} ppm</span>
                          )}
                        </div>
                        {reading.note && <p className="mt-1 text-muted-foreground">{reading.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batch Production Record</CardTitle>
                <CardDescription>
                  Optional batch-linked cellar events, yields, and QC entries while you work the runboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!batch ? (
                  <p className="text-sm text-muted-foreground">
                    Link or create a batch first to log production record events from Brewday.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <div className="space-y-3 rounded border border-border p-4">
                        <p className="text-sm font-medium">Cellar Treatment</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Type</Label>
                            <Input
                              value={treatmentDraft.type}
                              onChange={(event) =>
                                setTreatmentDraft((prev) => ({ ...prev, type: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Stage</Label>
                            <Input
                              value={treatmentDraft.stage}
                              onChange={(event) =>
                                setTreatmentDraft((prev) => ({ ...prev, stage: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Quantity</Label>
                            <Input
                              value={treatmentDraft.quantity}
                              onChange={(event) =>
                                setTreatmentDraft((prev) => ({ ...prev, quantity: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Unit</Label>
                            <Input
                              value={treatmentDraft.unit}
                              onChange={(event) =>
                                setTreatmentDraft((prev) => ({ ...prev, unit: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Lot Code</Label>
                            <Input
                              value={treatmentDraft.lotCode}
                              onChange={(event) =>
                                setTreatmentDraft((prev) => ({ ...prev, lotCode: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Operator</Label>
                            <Input
                              value={treatmentDraft.actor}
                              onChange={(event) =>
                                setTreatmentDraft((prev) => ({ ...prev, actor: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Notes</Label>
                          <Textarea
                            value={treatmentDraft.note}
                            onChange={(event) =>
                              setTreatmentDraft((prev) => ({ ...prev, note: event.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3 rounded border border-border p-4">
                        <p className="text-sm font-medium">Volume Checkpoint</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Stage</Label>
                            <Input
                              value={volumeDraft.stage}
                              onChange={(event) =>
                                setVolumeDraft((prev) => ({ ...prev, stage: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Quantity</Label>
                            <Input
                              value={volumeDraft.quantity}
                              onChange={(event) =>
                                setVolumeDraft((prev) => ({ ...prev, quantity: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Unit</Label>
                            <Input
                              value={volumeDraft.unit}
                              onChange={(event) =>
                                setVolumeDraft((prev) => ({ ...prev, unit: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Operator</Label>
                            <Input
                              value={volumeDraft.actor}
                              onChange={(event) =>
                                setVolumeDraft((prev) => ({ ...prev, actor: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Notes</Label>
                          <Textarea
                            value={volumeDraft.note}
                            onChange={(event) =>
                              setVolumeDraft((prev) => ({ ...prev, note: event.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3 rounded border border-border p-4">
                        <p className="text-sm font-medium">Stage Timeline</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Stage Event</Label>
                            <Input
                              value={timelineDraft.stage}
                              onChange={(event) =>
                                setTimelineDraft((prev) => ({ ...prev, stage: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Operator</Label>
                            <Input
                              value={timelineDraft.actor}
                              onChange={(event) =>
                                setTimelineDraft((prev) => ({ ...prev, actor: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Notes</Label>
                          <Textarea
                            value={timelineDraft.note}
                            onChange={(event) =>
                              setTimelineDraft((prev) => ({ ...prev, note: event.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3 rounded border border-border p-4">
                        <p className="text-sm font-medium">Sensory & QC</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Stage</Label>
                            <Input
                              value={qcDraft.stage}
                              onChange={(event) =>
                                setQcDraft((prev) => ({ ...prev, stage: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Operator</Label>
                            <Input
                              value={qcDraft.actor}
                              onChange={(event) =>
                                setQcDraft((prev) => ({ ...prev, actor: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Pass / Fail / Hold</Label>
                            <Input
                              value={qcDraft.passFail}
                              onChange={(event) =>
                                setQcDraft((prev) => ({ ...prev, passFail: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Approval</Label>
                            <Input
                              value={qcDraft.approvalDecision}
                              onChange={(event) =>
                                setQcDraft((prev) => ({
                                  ...prev,
                                  approvalDecision: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Visual Notes</Label>
                          <Textarea
                            value={qcDraft.visualNotes}
                            onChange={(event) =>
                              setQcDraft((prev) => ({ ...prev, visualNotes: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Aroma Notes</Label>
                          <Textarea
                            value={qcDraft.aromaNotes}
                            onChange={(event) =>
                              setQcDraft((prev) => ({ ...prev, aromaNotes: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Taste Notes</Label>
                          <Textarea
                            value={qcDraft.tasteNotes}
                            onChange={(event) =>
                              setQcDraft((prev) => ({ ...prev, tasteNotes: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>QC Note</Label>
                          <Textarea
                            value={qcDraft.note}
                            onChange={(event) =>
                              setQcDraft((prev) => ({ ...prev, note: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Save optional production-record events directly to the linked batch while you work.
                      </div>
                      <Button onClick={() => void saveBrewdayProductionRecord()} disabled={busy}>
                        Save Production Record
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card className="bg-muted/40">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
