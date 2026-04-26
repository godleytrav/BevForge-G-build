import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ImportedRecipe } from '@/features/canvas/types';
import { selectProductImage, type ProductRecord } from '@/features/products/types';
import {
  FlaskConical,
  Play,
  Pause,
  CheckCircle2,
  SkipForward,
  StopCircle,
  RefreshCcw,
  Gauge,
  Beaker,
  Upload,
  Trash2,
  Timer,
  ArrowRightLeft,
  Wand2,
} from 'lucide-react';

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

interface RecipeRunStep {
  id: string;
  name: string;
  stage?: string;
  action?: string;
  triggerWhen?: string;
  command?: string;
  targetDeviceId?: string;
  value?: string | number | boolean;
  durationMin?: number;
  temperatureC?: number;
  requiresUserConfirm?: boolean;
  autoProceed?: boolean;
  status: RecipeRunStepStatus;
  startedAt?: string;
  endedAt?: string;
  message?: string;
}

interface RecipeRun {
  runId: string;
  recipeId: string;
  recipeName: string;
  executionMode?: RecipeExecutionMode;
  status: RecipeRunStatus;
  startedAt: string;
  endedAt?: string;
  currentStepIndex: number;
  steps: RecipeRunStep[];
}

interface RecipeInboxStatus {
  started: boolean;
  activeInboxDir: string;
  usingFallbackInbox: boolean;
  pollingMs: number;
  lastScan?: {
    scannedAt: string;
    filesSeen: number;
    ingested: number;
    rejected: number;
    errors: number;
  };
}

type PreflightStatus = 'compatible' | 'needs_override' | 'incompatible';

interface RecipePreflightRequirement {
  id: string;
  label: string;
  outcome: 'met' | 'fallback' | 'missing';
  detail: string;
  missingSeverity?: 'blocker' | 'warning';
  manualFallback?: string;
  matchedDeviceIds: string[];
  matchedLabels: string[];
}

interface RecipePreflightReport {
  recipeId: string;
  recipeName: string;
  status: PreflightStatus;
  readyToRun: boolean;
  requiresManualOverride: boolean;
  blockers: string[];
  warnings: string[];
  requirements: RecipePreflightRequirement[];
  inferredStages: string[];
  equipment: {
    source: 'published_pages' | 'all_pages';
    pageCount: number;
    nodeCount: number;
    widgetCounts: Record<string, number>;
    vesselTypeCounts: Record<string, number>;
  };
  missingTargetDevices: string[];
  roleMappings: Partial<Record<EquipmentRoleId, string>>;
  inventoryChecks: Array<{
    requirementName: string;
    status: 'ok' | 'low' | 'missing';
    matchedItemName?: string;
    availableQty?: number;
  }>;
  generatedAt: string;
}

type EquipmentRoleId =
  | 'hlt_vessel'
  | 'mash_tun_vessel'
  | 'boil_kettle_vessel'
  | 'fermenter_primary'
  | 'heat_source_primary'
  | 'transfer_pump_primary'
  | 'glycol_pump'
  | 'glycol_supply_valve'
  | 'temp_sensor_mash'
  | 'temp_sensor_fermenter';

interface EquipmentRoleMapState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  roles: Partial<Record<EquipmentRoleId, string>>;
}

interface EquipmentRoleOption {
  value: string;
  label: string;
  type: string;
  source: 'canvas' | 'registry';
}

interface EquipmentRoleMapPayload {
  map: EquipmentRoleMapState;
  options: EquipmentRoleOption[];
  source: 'published_pages' | 'all_pages';
}

type TransferRouteKey =
  | 'hlt_to_mash'
  | 'mash_to_kettle'
  | 'kettle_to_fermenter'
  | 'fermenter_to_bright'
  | 'bright_to_packaging';

interface TransferRouteConfig {
  enabled?: boolean;
  transferControllerRef?: string;
  pumpRef?: string;
  sourceValveRef?: string;
  destinationValveRef?: string;
  speedPct?: number;
  closeValvesOnComplete?: boolean;
  requireArmConfirm?: boolean;
}

interface TransferRouteMapState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  routes: Partial<Record<TransferRouteKey, TransferRouteConfig>>;
}

interface TransferRouteDef {
  key: TransferRouteKey;
  label: string;
  fromLabel: string;
  toLabel: string;
}

interface TransferRouteMapPayload {
  map: TransferRouteMapState;
  routeDefs: TransferRouteDef[];
  options: Array<{
    value: string;
    label: string;
    type: string;
    source: 'canvas' | 'registry';
  }>;
  source: 'published_pages' | 'all_pages';
  suggestedRoutes: Partial<Record<TransferRouteKey, TransferRouteConfig>>;
}

const equipmentRoleDefs: Array<{
  id: EquipmentRoleId;
  label: string;
  description: string;
  preferredTypes: string[];
}> = [
  {
    id: 'hlt_vessel',
    label: 'HLT Vessel',
    description: 'Primary hot liquor tank used for strike/heating water.',
    preferredTypes: ['vessel'],
  },
  {
    id: 'mash_tun_vessel',
    label: 'Mash Tun Vessel',
    description: 'Main mash vessel for mash steps.',
    preferredTypes: ['vessel'],
  },
  {
    id: 'boil_kettle_vessel',
    label: 'Boil Kettle Vessel',
    description: 'Primary kettle for boil stages.',
    preferredTypes: ['vessel'],
  },
  {
    id: 'fermenter_primary',
    label: 'Primary Fermenter',
    description: 'Primary fermentation vessel.',
    preferredTypes: ['vessel'],
  },
  {
    id: 'heat_source_primary',
    label: 'Primary Heat Source',
    description: 'Heater/PID output used for recipe temperature control.',
    preferredTypes: ['heater', 'pid'],
  },
  {
    id: 'transfer_pump_primary',
    label: 'Primary Transfer Pump',
    description: 'Main transfer pump used in recipe steps.',
    preferredTypes: ['pump'],
  },
  {
    id: 'glycol_pump',
    label: 'Glycol Pump',
    description: 'Pump used for cooling loops.',
    preferredTypes: ['pump', 'glycol_controller'],
  },
  {
    id: 'glycol_supply_valve',
    label: 'Glycol Supply Valve',
    description: 'Valve controlling glycol flow to jackets/zones.',
    preferredTypes: ['valve'],
  },
  {
    id: 'temp_sensor_mash',
    label: 'Mash Temperature Sensor',
    description: 'Primary mash temperature feedback sensor.',
    preferredTypes: ['sensor'],
  },
  {
    id: 'temp_sensor_fermenter',
    label: 'Fermenter Temperature Sensor',
    description: 'Primary fermentation temperature feedback sensor.',
    preferredTypes: ['sensor'],
  },
];

const statusTone: Record<RecipeRunStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  running: 'default',
  paused: 'secondary',
  waiting_confirm: 'outline',
  completed: 'secondary',
  failed: 'destructive',
  canceled: 'outline',
};

const preflightTone: Record<
  PreflightStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  compatible: 'secondary',
  needs_override: 'outline',
  incompatible: 'destructive',
};

const toNumberOrNull = (value: string): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatDurationClock = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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

const patchStep = async (
  runId: string,
  stepId: string,
  patch: Record<string, unknown>
) => {
  await fetch(`/api/os/recipes/run/${runId}/steps/${stepId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
};

const normalizeNameKey = (value: string | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export default function RecipeExecutionPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<ImportedRecipe[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [runs, setRuns] = useState<RecipeRun[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<RecipeExecutionMode>('automated');
  const [activeRunId, setActiveRunId] = useState<string>('');
  const [inboxStatus, setInboxStatus] = useState<RecipeInboxStatus | null>(null);
  const [preflight, setPreflight] = useState<RecipePreflightReport | null>(null);
  const [equipmentMap, setEquipmentMap] = useState<EquipmentRoleMapState | null>(null);
  const [equipmentMapOptions, setEquipmentMapOptions] = useState<EquipmentRoleOption[]>([]);
  const [equipmentMapSource, setEquipmentMapSource] = useState<'published_pages' | 'all_pages'>('all_pages');
  const [equipmentMapOpen, setEquipmentMapOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState<Partial<Record<EquipmentRoleId, string>>>({});
  const [transferMap, setTransferMap] = useState<TransferRouteMapState | null>(null);
  const [transferRouteDefs, setTransferRouteDefs] = useState<TransferRouteDef[]>([]);
  const [transferOptions, setTransferOptions] = useState<
    Array<{ value: string; label: string; type: string; source: 'canvas' | 'registry' }>
  >([]);
  const [transferMapSource, setTransferMapSource] = useState<'published_pages' | 'all_pages'>('all_pages');
  const [transferMapOpen, setTransferMapOpen] = useState(false);
  const [transferDraft, setTransferDraft] = useState<
    Partial<Record<TransferRouteKey, TransferRouteConfig>>
  >({});
  const [statusMessage, setStatusMessage] = useState<string>('Loading recipe launcher data...');
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadRecipes = useCallback(async () => {
    const response = await fetch('/api/os/recipes');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load recipes');
    }
    const nextRecipes = (payload.data ?? []) as ImportedRecipe[];
    setRecipes(nextRecipes);
    if (!selectedRecipeId && nextRecipes.length > 0) {
      setSelectedRecipeId(nextRecipes[0].id);
    }
  }, [selectedRecipeId]);

  const loadProducts = useCallback(async () => {
    const response = await fetch('/api/os/products');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load product catalog');
    }
    setProducts((payload.data ?? []) as ProductRecord[]);
  }, []);

  const loadRuns = useCallback(async () => {
    const response = await fetch('/api/os/recipes/runs');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load recipe runs');
    }
    const nextRuns = (payload.data ?? []) as RecipeRun[];
    setRuns(nextRuns);
    if (nextRuns.length === 0) {
      setActiveRunId('');
      return;
    }
    const running = nextRuns.find((run) => run.status === 'running' || run.status === 'waiting_confirm' || run.status === 'paused');
    if (running) {
      setActiveRunId(running.runId);
      return;
    }
    if (activeRunId && !nextRuns.some((run) => run.runId === activeRunId)) {
      setActiveRunId(nextRuns[0].runId);
      return;
    }
    if (!activeRunId) {
      setActiveRunId(nextRuns[0].runId);
    }
  }, [activeRunId]);

  const loadInboxStatus = useCallback(async () => {
    const response = await fetch('/api/os/recipes/inbox/status');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load inbox status');
    }
    setInboxStatus(payload.data as RecipeInboxStatus);
  }, []);

  const loadEquipmentMap = useCallback(async () => {
    const response = await fetch('/api/os/recipes/equipment-map');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load equipment role map');
    }
    const data = payload.data as EquipmentRoleMapPayload;
    setEquipmentMap(data.map);
    setEquipmentMapOptions(data.options ?? []);
    setEquipmentMapSource(data.source ?? 'all_pages');
    setRoleDraft(data.map?.roles ?? {});
  }, []);

  const loadTransferMap = useCallback(async () => {
    const response = await fetch('/api/os/recipes/transfer-map');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to load transfer route map');
    }
    const data = payload.data as TransferRouteMapPayload;
    setTransferMap(data.map);
    setTransferRouteDefs(data.routeDefs ?? []);
    setTransferOptions(data.options ?? []);
    setTransferMapSource(data.source ?? 'all_pages');
    setTransferDraft(
      Object.keys(data.map?.routes ?? {}).length > 0
        ? (data.map.routes ?? {})
        : (data.suggestedRoutes ?? {})
    );
  }, []);

  const loadPreflight = useCallback(async (recipeId: string) => {
    const response = await fetch('/api/os/recipes/preflight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? 'Failed to evaluate recipe compatibility');
    }
    setPreflight(payload.data as RecipePreflightReport);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        loadRecipes(),
        loadProducts(),
        loadRuns(),
        loadInboxStatus(),
        loadEquipmentMap(),
        loadTransferMap(),
      ]);
      if (selectedRecipeId) {
        await loadPreflight(selectedRecipeId);
      }
      setStatusMessage('Recipe execution data refreshed.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Refresh failed.');
    }
  }, [
    loadEquipmentMap,
    loadInboxStatus,
    loadPreflight,
    loadProducts,
    loadRecipes,
    loadRuns,
    loadTransferMap,
    selectedRecipeId,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void Promise.all([loadRuns(), loadInboxStatus()]).catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [loadInboxStatus, loadRuns]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedRecipeId) {
      setPreflight(null);
      return;
    }
    void loadPreflight(selectedRecipeId).catch((error) => {
      setPreflight(null);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to evaluate recipe compatibility.'
      );
    });
  }, [loadPreflight, selectedRecipeId]);

  const activeRun = useMemo(
    () => runs.find((run) => run.runId === activeRunId) ?? runs[0] ?? null,
    [activeRunId, runs]
  );
  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [recipes, selectedRecipeId]
  );
  const selectedRecipeProduct = useMemo(() => {
    if (!selectedRecipe) return null;
    const metadata =
      selectedRecipe.metadata && typeof selectedRecipe.metadata === 'object'
        ? (selectedRecipe.metadata as Record<string, unknown>)
        : {};
    const productIdCandidate = String(
      metadata.productId ?? metadata.product_id ?? ''
    ).trim();
    if (productIdCandidate) {
      return products.find((product) => product.productId === productIdCandidate) ?? null;
    }
    const nameKey = normalizeNameKey(selectedRecipe.name);
    return products.find((product) => normalizeNameKey(product.name) === nameKey) ?? null;
  }, [products, selectedRecipe]);
  const selectedRecipeImage = useMemo(() => {
    if (!selectedRecipeProduct) return undefined;
    return selectProductImage(
      selectedRecipeProduct.assets.find(
        (asset) => asset.assetId === selectedRecipeProduct.currentAssetId
      )?.images,
      'full'
    );
  }, [selectedRecipeProduct]);
  useEffect(() => {
    if (!activeRun) return;
    if (activeRun.status !== 'running' && activeRun.status !== 'waiting_confirm') return;
    const interval = window.setInterval(() => {
      void fetch(`/api/os/recipes/run/${activeRun.runId}/readings/snapshot`, {
        method: 'POST',
      }).catch(() => undefined);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [activeRun]);

  const currentStep = useMemo(() => {
    if (!activeRun) return null;
    if (activeRun.currentStepIndex < 0 || activeRun.currentStepIndex >= activeRun.steps.length) {
      return null;
    }
    return activeRun.steps[activeRun.currentStepIndex];
  }, [activeRun]);
  const currentStepRemainingSeconds = useMemo(() => {
    if (!currentStep) return null;
    const durationMin = Number(currentStep.durationMin);
    if (!Number.isFinite(durationMin) || durationMin <= 0) return null;
    const startedMs = currentStep.startedAt ? Date.parse(currentStep.startedAt) : NaN;
    if (!Number.isFinite(startedMs)) return null;
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
    const totalSeconds = Math.floor(durationMin * 60);
    return Math.max(0, totalSeconds - elapsedSeconds);
  }, [currentStep, nowMs]);
  const currentStepIsTransferGate = useMemo(
    () => stepIsTransferGate(currentStep),
    [currentStep]
  );
  const currentTransferRouteKey = useMemo(
    () => inferTransferRouteKey(currentStep),
    [currentStep]
  );
  const currentTransferRouteConfig = useMemo(() => {
    if (!currentTransferRouteKey || !transferMap?.routes) return null;
    return transferMap.routes[currentTransferRouteKey] ?? null;
  }, [currentTransferRouteKey, transferMap]);
  const transferControllerOptions = useMemo(
    () => transferOptions.filter((option) => option.type === 'transfer_controller'),
    [transferOptions]
  );
  const transferPumpOptions = useMemo(
    () => transferOptions.filter((option) => option.type === 'pump'),
    [transferOptions]
  );
  const transferValveOptions = useMemo(
    () => transferOptions.filter((option) => option.type === 'valve'),
    [transferOptions]
  );

  const startRun = async (params?: {
    allowManualOverride?: boolean;
    mode?: RecipeExecutionMode;
  }) => {
    if (!selectedRecipeId) return;
    const mode = params?.mode ?? executionMode;
    const allowManualOverride = params?.allowManualOverride === true;
    setBusy(true);
    try {
      const response = await fetch('/api/os/recipes/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          allowManualOverride,
          executionMode: mode,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        if (payload?.preflight) {
          setPreflight(payload.preflight as RecipePreflightReport);
        }
        throw new Error(payload?.error ?? 'Failed to start recipe run');
      }
      if (payload?.preflight) {
        setPreflight(payload.preflight as RecipePreflightReport);
      }
      const run = payload.data as RecipeRun;
      setActiveRunId(run.runId);
      await loadRuns();
      setStatusMessage(
        `Started ${run.executionMode ?? mode} recipe run: ${run.recipeName}`
      );
      navigate(`/os/brewday/${encodeURIComponent(run.runId)}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to start recipe run.');
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: 'pause' | 'resume' | 'confirm' | 'next' | 'stop') => {
    if (!activeRun) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Recipe action failed');
      }
      await loadRuns();
      setStatusMessage(`Run action executed: ${action}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Run action failed.');
    } finally {
      setBusy(false);
    }
  };

  const executeTransferRoute = async (
    action: 'start' | 'complete',
    armConfirmed: boolean = false
  ): Promise<boolean> => {
    if (!activeRun || !currentStepIsTransferGate) {
      setStatusMessage('Current step is not a transfer step.');
      return false;
    }
    if (!currentTransferRouteKey) {
      setStatusMessage('Transfer route could not be inferred for current step.');
      return false;
    }
    try {
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          routeKey: currentTransferRouteKey,
          armConfirmed,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        if (payload?.requiresArmConfirm) {
          const confirmed = window.confirm(
            'Packaging transfer safety check: confirm line is connected and ready before arming transfer.'
          );
          if (confirmed) {
            return executeTransferRoute(action, true);
          }
        }
        throw new Error(payload?.error ?? 'Transfer route action failed');
      }
      await loadTransferMap();
      if (action === 'start') {
        setStatusMessage(`Transfer route started: ${currentTransferRouteKey.replaceAll('_', ' ')}`);
      } else {
        setStatusMessage(`Transfer route completed: ${currentTransferRouteKey.replaceAll('_', ' ')}`);
      }
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Transfer route action failed.');
      return false;
    }
  };

  const runTransfer = async () => {
    setBusy(true);
    try {
      await executeTransferRoute('start');
    } finally {
      setBusy(false);
    }
  };

  const confirmTransfer = async () => {
    if (!activeRun) return;
    setBusy(true);
    try {
      await executeTransferRoute('complete');
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to confirm transfer step');
      }
      await loadRuns();
      setStatusMessage('Transfer confirmed and recipe advanced.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Transfer confirmation failed.');
    } finally {
      setBusy(false);
    }
  };

  const confirmManualTransfer = async () => {
    if (!activeRun || !currentStepIsTransferGate) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/os/recipes/run/${activeRun.runId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to confirm manual transfer step');
      }
      await loadRuns();
      setStatusMessage('Manual transfer confirmed and recipe advanced.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Manual transfer confirmation failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const scanInbox = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/os/recipes/inbox/scan', {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Inbox scan failed');
      }
      await refresh();
      const scanned = payload.data?.filesSeen ?? 0;
      const ingested = payload.data?.ingested ?? 0;
      setStatusMessage(`Inbox scan complete. Files: ${scanned}, ingested: ${ingested}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Inbox scan failed.');
    } finally {
      setBusy(false);
    }
  };

  const resetRunHistory = async () => {
    if (!window.confirm('Clear recipe run history and release recipe-run inventory reservations?')) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/os/recipes/runs/reset', {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to reset recipe run history');
      }
      await refresh();
      const summary = payload.data as {
        clearedRuns?: number;
        releasedQty?: number;
      };
      setStatusMessage(
        `Run history reset. Cleared runs: ${summary?.clearedRuns ?? 0}. Released qty: ${
          summary?.releasedQty ?? 0
        }.`
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to reset recipe run history.'
      );
    } finally {
      setBusy(false);
    }
  };

  const importRecipeFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const content = await file.text();
      const response = await fetch('/api/os/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Recipe import failed');
      }
      await refresh();
      setStatusMessage(`Imported recipe: ${payload.data?.name ?? file.name}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Recipe import failed.');
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  const openEquipmentMap = () => {
    setRoleDraft(equipmentMap?.roles ?? {});
    setEquipmentMapOpen(true);
  };

  const openTransferMap = () => {
    setTransferDraft(transferMap?.routes ?? {});
    setTransferMapOpen(true);
  };

  const updateRoleDraft = (role: EquipmentRoleId, value: string) => {
    setRoleDraft((prev) => ({
      ...prev,
      [role]: value,
    }));
  };

  const updateTransferDraft = (
    routeKey: TransferRouteKey,
    patch: Partial<TransferRouteConfig>
  ) => {
    setTransferDraft((prev) => ({
      ...prev,
      [routeKey]: {
        ...(prev[routeKey] ?? {}),
        ...patch,
      },
    }));
  };

  const saveEquipmentMap = async () => {
    setBusy(true);
    try {
      const roles = equipmentRoleDefs.reduce<Partial<Record<EquipmentRoleId, string | null>>>(
        (acc, definition) => {
          const value = roleDraft[definition.id];
          acc[definition.id] = value && value !== '__none' ? value : null;
          return acc;
        },
        {}
      );

      const response = await fetch('/api/os/recipes/equipment-map', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save equipment role map');
      }

      await loadEquipmentMap();
      if (selectedRecipeId) {
        await loadPreflight(selectedRecipeId);
      }
      setEquipmentMapOpen(false);
      setStatusMessage('Equipment role map saved.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save equipment role map.'
      );
    } finally {
      setBusy(false);
    }
  };

  const autoFillTransferMap = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/os/recipes/transfer-map/autofill', {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to auto-build transfer route profile');
      }
      await loadTransferMap();
      setTransferDraft(payload.data?.routes ?? {});
      setStatusMessage('Transfer route profile auto-built from current canvas.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to auto-build transfer route profile.'
      );
    } finally {
      setBusy(false);
    }
  };

  const saveTransferMap = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/os/recipes/transfer-map', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: transferDraft }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save transfer route profile');
      }
      await loadTransferMap();
      setTransferMapOpen(false);
      setStatusMessage('Transfer route profile saved.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save transfer route profile.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Recipe Launcher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recipe Launcher</h1>
            <p className="text-muted-foreground mt-1">
              Choose a recipe, run preflight, and launch a live batch into brewday.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                navigate(
                  activeRunId
                    ? `/os/brewday/${encodeURIComponent(activeRunId)}`
                    : '/os/brewday'
                )
              }
            >
              <Beaker className="h-4 w-4" />
              Open Brewday Runboard
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate('/os/control-panel')}>
              <Gauge className="h-4 w-4" />
              Open Control Panel
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => importInputRef.current?.click()} disabled={busy}>
              <Upload className="h-4 w-4" />
              Import Recipe File
            </Button>
            <Button variant="outline" className="gap-2" onClick={scanInbox} disabled={busy}>
              <Upload className="h-4 w-4" />
              Scan Inbox
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => void refresh()} disabled={busy}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2" onClick={resetRunHistory} disabled={busy}>
              <Trash2 className="h-4 w-4" />
              Clear Run Log
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inbox Status</CardTitle>
            <CardDescription>Filesystem queue watcher for LAB recipe handoff.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Watcher</p>
              <p className="font-medium">{inboxStatus?.started ? 'Running' : 'Stopped'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Inbox</p>
              <p className="font-mono text-xs break-all">{inboxStatus?.activeInboxDir ?? '--'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fallback Mode</p>
              <p className="font-medium">{inboxStatus?.usingFallbackInbox ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Scan</p>
              <p className="font-medium">{inboxStatus?.lastScan?.scannedAt ?? '--'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Counts</p>
              <p className="font-medium">
                {inboxStatus?.lastScan
                  ? `files ${inboxStatus.lastScan.filesSeen} / in ${inboxStatus.lastScan.ingested} / rej ${inboxStatus.lastScan.rejected}`
                  : '--'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Run Setup</CardTitle>
              <CardDescription>
                Select an imported recipe, review compatibility, then start execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Recipe</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No recipes imported
                      </SelectItem>
                    ) : (
                      recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} ({recipe.steps.length} steps)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Execution Mode</Label>
                <Select
                  value={executionMode}
                  onValueChange={(value) => setExecutionMode(value as RecipeExecutionMode)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select execution mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automated">Automated (Canvas + hardware)</SelectItem>
                    <SelectItem value="hybrid">Hybrid (automation + manual handoffs)</SelectItem>
                    <SelectItem value="manual">Manual (operator-driven brewday)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {executionMode === 'manual'
                    ? 'Manual mode runs recipe steps without target-device dispatch and supports manual transfer/readings.'
                    : executionMode === 'hybrid'
                      ? 'Hybrid mode keeps automation targets but allows manual overrides during execution.'
                      : 'Automated mode expects commissioned controls from canvas and role mappings.'}
                </p>
              </div>
              {selectedRecipeProduct ? (
                <div className="overflow-hidden rounded-xl border border-border bg-muted/15">
                  {selectedRecipeImage ? (
                    <img
                      src={selectedRecipeImage}
                      alt={selectedRecipeProduct.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : null}
                  <div className="space-y-1 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{selectedRecipeProduct.name}</p>
                      <Badge variant="outline">{selectedRecipeProduct.beverageClass}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Product {selectedRecipeProduct.productId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Label version {selectedRecipeProduct.currentLabelVersionId ?? '--'}
                    </p>
                  </div>
                </div>
              ) : null}
              <Button
                className="w-full gap-2"
                onClick={() => void startRun({ allowManualOverride: false })}
                disabled={
                  busy ||
                  !selectedRecipeId ||
                  recipes.length === 0 ||
                  preflight?.status !== 'compatible'
                }
              >
                <Play className="h-4 w-4" />
                Start Recipe Run
              </Button>
              {(preflight?.status === 'needs_override' ||
                (executionMode === 'manual' && preflight?.status === 'incompatible')) && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    void startRun({
                      allowManualOverride: true,
                    })
                  }
                  disabled={busy || !selectedRecipeId || recipes.length === 0}
                >
                  <Play className="h-4 w-4" />
                  {executionMode === 'manual' && preflight?.status === 'incompatible'
                    ? 'Start Manual Run (Override Required)'
                    : 'Start With Manual Override'}
                </Button>
              )}

              {preflight ? (
                <div className="rounded border border-border p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Compatibility Check</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={preflightTone[preflight.status]}>
                        {preflight.status.replaceAll('_', ' ')}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={openEquipmentMap} disabled={busy}>
                        Resolve Equipment Roles
                      </Button>
                      <Button variant="outline" size="sm" onClick={openTransferMap} disabled={busy}>
                        Transfer Routes
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stages: {preflight.inferredStages.length > 0 ? preflight.inferredStages.join(', ') : 'none detected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Equipment scope: {preflight.equipment.source === 'published_pages' ? 'Published pages' : 'Draft fallback'} • nodes {preflight.equipment.nodeCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role mappings: {Object.keys(preflight.roleMappings ?? {}).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inventory checks: {preflight.inventoryChecks?.length ?? 0}
                  </p>
                  {preflight.blockers.length > 0 && (
                    <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800 space-y-1">
                      {preflight.blockers.slice(0, 4).map((issue, index) => (
                        <p key={`preflight-blocker-${index}`}>• {issue}</p>
                      ))}
                    </div>
                  )}
                  {preflight.warnings.length > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 space-y-1">
                      {preflight.warnings.slice(0, 4).map((issue, index) => (
                        <p key={`preflight-warning-${index}`}>• {issue}</p>
                      ))}
                    </div>
                  )}
                  {(preflight.inventoryChecks?.length ?? 0) > 0 && (
                    <div className="rounded border border-border p-2 text-xs space-y-1">
                      {preflight.inventoryChecks.slice(0, 4).map((check, index) => (
                        <p key={`inventory-check-${index}`} className="text-muted-foreground">
                          {check.status === 'missing' ? 'Missing' : check.status === 'low' ? 'Low' : 'OK'}: {check.requirementName}
                          {check.matchedItemName ? ` -> ${check.matchedItemName}` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Compatibility check will run when a recipe is selected.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Run</span>
                {activeRun ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {String(activeRun.executionMode ?? 'automated')}
                    </Badge>
                    <Badge variant={statusTone[activeRun.status]}>
                      {activeRun.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline">No Run</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {activeRun ? `${activeRun.recipeName} • ${activeRun.steps.length} steps` : 'Start a recipe to begin execution.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeRun ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => void runAction(activeRun.status === 'paused' ? 'resume' : 'pause')} disabled={busy}>
                      {activeRun.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {activeRun.status === 'paused' ? 'Resume' : 'Pause'}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => void runAction('confirm')} disabled={busy || activeRun.status !== 'waiting_confirm'}>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Step
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => void runAction('next')} disabled={busy}>
                      <SkipForward className="h-4 w-4" />
                      Next Step
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => void runAction('stop')} disabled={busy}>
                      <StopCircle className="h-4 w-4" />
                      Stop Run
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={runTransfer}
                      disabled={busy || !currentStepIsTransferGate}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Run Transfer
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={confirmTransfer}
                      disabled={busy || !currentStepIsTransferGate || activeRun.status !== 'waiting_confirm'}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Confirm Transfer
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={confirmManualTransfer}
                      disabled={busy || !currentStepIsTransferGate || activeRun.status !== 'waiting_confirm'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Manual Transfer Done
                    </Button>
                  </div>

                  {currentStep ? (
                    <div className="rounded border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          Step {activeRun.currentStepIndex + 1}: {currentStep.name}
                        </p>
                        <Badge variant="outline">{currentStep.status.replaceAll('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {currentStep.message ?? 'Adjust variables as needed, then confirm/next.'}
                      </p>
                      {currentStepRemainingSeconds !== null && (
                        <div className="rounded border border-border/70 bg-muted/30 px-3 py-2 text-xs flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5" />
                            Current Step Timer
                          </span>
                          <span className="font-mono font-semibold">
                            {formatDurationClock(currentStepRemainingSeconds)}
                          </span>
                        </div>
                      )}
                      {currentStepIsTransferGate && (
                        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-2">
                          <span>
                            Transfer step detected. Use `Run Transfer` for mapped automation, then `Confirm Transfer`, or use `Manual Transfer Done` if transfer is operator-managed.
                            {currentTransferRouteConfig
                              ? ` Pump: ${currentTransferRouteConfig.pumpRef ?? 'none'}`
                              : ' Route profile not configured.'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            Route: {currentTransferRouteKey ? currentTransferRouteKey.replaceAll('_', ' ') : 'unresolved'}
                          </Badge>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label>Duration (min)</Label>
                          <Input
                            type="number"
                            value={String(currentStep.durationMin ?? '')}
                            onBlur={(event) =>
                              void patchStep(
                                activeRun.runId,
                                currentStep.id,
                                { durationMin: toNumberOrNull(event.target.value) }
                              ).then(loadRuns)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Target Temp (C)</Label>
                          <Input
                            type="number"
                            value={String(currentStep.temperatureC ?? '')}
                            onBlur={(event) =>
                              void patchStep(
                                activeRun.runId,
                                currentStep.id,
                                { temperatureC: toNumberOrNull(event.target.value) }
                              ).then(loadRuns)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Target Device</Label>
                          <Input
                            value={String(currentStep.targetDeviceId ?? '')}
                            onBlur={(event) =>
                              void patchStep(
                                activeRun.runId,
                                currentStep.id,
                                { targetDeviceId: event.target.value || null }
                              ).then(loadRuns)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Value</Label>
                          <Input
                            value={String(currentStep.value ?? '')}
                            onBlur={(event) =>
                              void patchStep(
                                activeRun.runId,
                                currentStep.id,
                                { value: event.target.value || null }
                              ).then(loadRuns)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active step.</p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FlaskConical className="h-4 w-4" />
                  Start a recipe run to see execution controls.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run History</CardTitle>
            <CardDescription>Recent recipe runs and progress snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recipe runs yet.</p>
            ) : (
              <div className="space-y-2">
                {runs.slice(0, 8).map((run) => (
                  <button
                    key={run.runId}
                    type="button"
                    className={`w-full rounded border p-3 text-left transition-colors ${
                      activeRun?.runId === run.runId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/10'
                    }`}
                    onClick={() => setActiveRunId(run.runId)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{run.recipeName}</p>
                      <Badge variant={statusTone[run.status]}>
                        {run.status.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {run.steps.length} steps • mode {run.executionMode ?? 'automated'} • started {run.startedAt}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </CardContent>
        </Card>

        <Dialog open={equipmentMapOpen} onOpenChange={setEquipmentMapOpen}>
          <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-[760px]">
            <DialogHeader>
              <DialogTitle>Equipment Role Mapping</DialogTitle>
              <DialogDescription>
                Assign required recipe roles to installed equipment for deterministic preflight checks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Equipment source: {equipmentMapSource === 'published_pages' ? 'Published pages' : 'Draft fallback'} • options {equipmentMapOptions.length}
              </p>
              <div className="space-y-3">
                {equipmentRoleDefs.map((definition) => {
                  const preferredOptions = equipmentMapOptions.filter((option) =>
                    definition.preferredTypes.includes(option.type)
                  );
                  const selectableOptions =
                    preferredOptions.length > 0 ? preferredOptions : equipmentMapOptions;
                  return (
                    <div key={definition.id} className="rounded border border-border p-3 space-y-2">
                      <div>
                        <p className="text-sm font-medium">{definition.label}</p>
                        <p className="text-xs text-muted-foreground">{definition.description}</p>
                      </div>
                      <Select
                        value={roleDraft[definition.id] ?? '__none'}
                        onValueChange={(value) =>
                          updateRoleDraft(definition.id, value === '__none' ? '' : value)
                        }
                      >
                        <SelectTrigger disabled={busy}>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Unassigned</SelectItem>
                          {selectableOptions.map((option) => (
                            <SelectItem key={`${definition.id}-${option.value}`} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEquipmentMapOpen(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={() => void saveEquipmentMap()} disabled={busy}>
                  Save Role Mapping
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={transferMapOpen} onOpenChange={setTransferMapOpen}>
          <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Transfer Route Profile</DialogTitle>
              <DialogDescription>
                Save deterministic pump/valve routes once; Recipe Launcher uses these for transfer steps.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Source: {transferMapSource === 'published_pages' ? 'Published pages' : 'Draft fallback'} • options {transferOptions.length}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void autoFillTransferMap()}
                  disabled={busy}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Auto-Build
                </Button>
              </div>
              <div className="space-y-3">
                {transferRouteDefs.map((route) => {
                  const draft = transferDraft[route.key] ?? {};
                  return (
                    <div key={route.key} className="rounded border border-border p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{route.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {route.fromLabel} {'->'} {route.toLabel}
                          </p>
                        </div>
                        <Select
                          value={draft.enabled === false ? 'disabled' : 'enabled'}
                          onValueChange={(value) =>
                            updateTransferDraft(route.key, { enabled: value === 'enabled' })
                          }
                        >
                          <SelectTrigger className="w-[160px]" disabled={busy}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Transfer Controller</Label>
                          <Select
                            value={draft.transferControllerRef ?? '__none'}
                            onValueChange={(value) =>
                              updateTransferDraft(route.key, {
                                transferControllerRef: value === '__none' ? undefined : value,
                              })
                            }
                          >
                            <SelectTrigger disabled={busy}>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {transferControllerOptions.map((option) => (
                                <SelectItem key={`${route.key}-controller-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Pump</Label>
                          <Select
                            value={draft.pumpRef ?? '__none'}
                            onValueChange={(value) =>
                              updateTransferDraft(route.key, {
                                pumpRef: value === '__none' ? undefined : value,
                              })
                            }
                          >
                            <SelectTrigger disabled={busy}>
                              <SelectValue placeholder="Select pump" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {transferPumpOptions.map((option) => (
                                <SelectItem key={`${route.key}-pump-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Source Valve</Label>
                          <Select
                            value={draft.sourceValveRef ?? '__none'}
                            onValueChange={(value) =>
                              updateTransferDraft(route.key, {
                                sourceValveRef: value === '__none' ? undefined : value,
                              })
                            }
                          >
                            <SelectTrigger disabled={busy}>
                              <SelectValue placeholder="Select source valve" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {transferValveOptions.map((option) => (
                                <SelectItem key={`${route.key}-source-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Destination Valve</Label>
                          <Select
                            value={draft.destinationValveRef ?? '__none'}
                            onValueChange={(value) =>
                              updateTransferDraft(route.key, {
                                destinationValveRef: value === '__none' ? undefined : value,
                              })
                            }
                          >
                            <SelectTrigger disabled={busy}>
                              <SelectValue placeholder="Select destination valve" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {transferValveOptions.map((option) => (
                                <SelectItem key={`${route.key}-dest-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Pump Speed (%)</Label>
                          <Input
                            type="number"
                            value={String(draft.speedPct ?? '')}
                            onChange={(event) =>
                              updateTransferDraft(route.key, {
                                speedPct: toNumberOrNull(event.target.value) ?? undefined,
                              })
                            }
                            disabled={busy}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Complete Behavior</Label>
                          <Select
                            value={draft.closeValvesOnComplete === false ? 'leave_open' : 'close'}
                            onValueChange={(value) =>
                              updateTransferDraft(route.key, {
                                closeValvesOnComplete: value !== 'leave_open',
                              })
                            }
                          >
                            <SelectTrigger disabled={busy}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="close">Close valves on complete</SelectItem>
                              <SelectItem value="leave_open">Leave valves open</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTransferMapOpen(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={() => void saveTransferMap()} disabled={busy}>
                  Save Transfer Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,.xml,.bsmx,application/json,text/xml,application/xml"
          className="hidden"
          onChange={importRecipeFile}
        />
      </div>
    </AppShell>
  );
}
