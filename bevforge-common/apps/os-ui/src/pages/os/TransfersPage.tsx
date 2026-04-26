import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import ProcessAssetTile from '@/components/ProcessAssetTile';
import { useNotifications } from '@/contexts/NotificationContext';
import type { BatchProductSnapshot } from '@/features/products/types';
import {
  LIQUID_UNIT_OPTIONS,
  coerceLiquidUnit,
  convertVolume,
  formatVolumeNumber,
} from '@/lib/volume-format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRightLeft, CheckCircle2, GitBranch, Waves } from 'lucide-react';

type TransferRunStatus = 'active' | 'completed' | 'canceled';
type TransferDestinationKind = 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
type TransferWorkspaceTab = 'station' | 'history';
type TransferRunFilter = 'all' | 'active' | 'completed';

interface BatchRecord {
  id: string;
  siteId: string;
  batchCode?: string;
  skuId?: string;
  lotCode: string;
  recipeName: string;
  status: string;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  productSnapshot?: BatchProductSnapshot;
}

interface TransferDestination {
  id: string;
  label: string;
  kind: TransferDestinationKind;
  capacityQty?: number;
  plannedQty: number;
  actualQty: number;
  branchCode?: string;
  treatmentType?: 'none' | 'oak_aged' | 'lees_aged' | 'blend' | 'backsweetened' | 'carbonated' | 'filtered' | 'other';
  derivedProductId?: string;
  derivedProductCode?: string;
  derivedProductName?: string;
  childBatchId?: string;
  childBatchCode?: string;
  childLotCode?: string;
}

interface TransferRunRecord {
  id: string;
  siteId: string;
  sourceBatchId: string;
  sourceLotCode: string;
  sourceRecipeName: string;
  sourceUnit: string;
  sourceAvailableQty: number;
  mode: 'manual' | 'auto';
  status: TransferRunStatus;
  destinations: TransferDestination[];
  operator?: string;
  lossReasonCode?: string;
  notes?: string;
  lossQty: number;
  startedAt: string;
  completedAt?: string;
}

const destinationOptions: Array<{ value: TransferDestinationKind; label: string }> = [
  { value: 'vessel', label: 'Vessel' },
  { value: 'bright_tank', label: 'Bright Tank' },
  { value: 'barrel', label: 'Barrel' },
  { value: 'package_line', label: 'Package Line' },
  { value: 'other', label: 'Other' },
];

const makeDestination = (): TransferDestination => ({
  id:
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `dest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: 'Destination',
  kind: 'vessel',
  plannedQty: 0,
  actualQty: 0,
  treatmentType: 'none',
});

const availableQty = (batch: BatchRecord | null): number =>
  batch ? Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0)) : 0;

const cloneDestination = (destination: TransferDestination): TransferDestination => ({
  ...destination,
});

const formatDateTime = (value: string | undefined) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const isTodayLocal = (value: string | undefined) => {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  );
};

export default function TransfersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [runs, setRuns] = useState<TransferRunRecord[]>([]);
  const [sourceBatchId, setSourceBatchId] = useState(searchParams.get('sourceBatchId') ?? '');
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  const [destinations, setDestinations] = useState<TransferDestination[]>([makeDestination()]);
  const [statusText, setStatusText] = useState('Loading transfer workspace...');
  const [busy, setBusy] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<TransferWorkspaceTab>('station');
  const [runFilter, setRunFilter] = useState<TransferRunFilter>('all');
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const [completionRun, setCompletionRun] = useState<TransferRunRecord | null>(null);
  const [completionLossQty, setCompletionLossQty] = useState('0');
  const [completionLossUnit, setCompletionLossUnit] = useState('bbl');
  const [completionLossReasonCode, setCompletionLossReasonCode] = useState('spill');
  const [completionOperator, setCompletionOperator] = useState('');
  const [transferPreview, setTransferPreview] = useState<{
    status: 'idle' | 'previewing' | 'previewed';
    sourceQty: number | null;
    destinationQtyById: Record<string, number>;
    progress: number;
    runId?: string;
  }>({
    status: 'idle',
    sourceQty: null,
    destinationQtyById: {},
    progress: 0,
  });
  const [selectedAsset, setSelectedAsset] = useState<
    | {
        type: 'batch';
        batch: BatchRecord;
      }
    | {
        type: 'destination';
        destination: TransferDestination;
      }
    | null
  >(null);

  const sourceBatch = batches.find((batch) => batch.id === sourceBatchId) ?? null;
  const sourceBatchOptions = useMemo(() => {
    const visible = batches.filter((batch) => {
      if (batch.id === sourceBatchId) return true;
      if (availableQty(batch) <= 0) return false;
      return !['released', 'shipped', 'canceled'].includes(batch.status);
    });
    return visible;
  }, [batches, sourceBatchId]);
  const selectedDestination =
    selectedAsset?.type === 'destination'
      ? destinations.find((destination) => destination.id === selectedAsset.destination.id) ??
        selectedAsset.destination
      : null;

  const stagedTransferQty = useMemo(
    () => destinations.reduce((sum, destination) => sum + Math.max(0, Number(destination.actualQty) || 0), 0),
    [destinations]
  );

  const stagedTransferRemaining = useMemo(() => {
    if (!sourceBatch) return 0;
    return Math.max(0, availableQty(sourceBatch) - stagedTransferQty);
  }, [sourceBatch, stagedTransferQty]);

  const load = async () => {
    try {
      const [batchResponse, runResponse] = await Promise.all([
        fetch('/api/os/batches'),
        fetch('/api/os/transfers'),
      ]);
      const batchPayload = await batchResponse.json().catch(() => null);
      const runPayload = await runResponse.json().catch(() => null);
      if (!batchResponse.ok || !batchPayload?.success) {
        throw new Error(batchPayload?.error ?? 'Failed to load batches.');
      }
      if (!runResponse.ok || !runPayload?.success) {
        throw new Error(runPayload?.error ?? 'Failed to load transfer runs.');
      }
      const nextBatches = (batchPayload.data?.batches ?? []) as BatchRecord[];
      const nextRuns = (runPayload.data ?? []) as TransferRunRecord[];
      setBatches(nextBatches);
      setRuns(nextRuns);
      setSourceBatchId((current) => current || nextBatches[0]?.id || '');
      setStatusText('Transfer workspace ready.');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to load transfer workspace.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateDestination = (id: string, patch: Partial<TransferDestination>) => {
    setDestinations((current) =>
      current.map((destination) =>
        destination.id === id ? { ...destination, ...patch } : destination
      )
    );
  };

  const addDestination = () => {
    const next = makeDestination();
    setDestinations((current) => [...current, next]);
    setSelectedAsset({ type: 'destination', destination: next });
  };

  const createRun = async (): Promise<TransferRunRecord | null> => {
    if (!sourceBatch) {
      setStatusText('Select a source batch first.');
      return null;
    }
    if (destinations.length === 0) {
      setStatusText('Add at least one destination.');
      return null;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/os/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBatchId: sourceBatch.id,
          siteId: sourceBatch.siteId,
          mode,
          destinations,
          operator,
          notes,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to create transfer run.');
      }
      void addNotification({
        title: 'Transfer Run Started',
        message: `${sourceBatch.batchCode ?? sourceBatch.lotCode} transfer is now active.`,
        type: 'info',
        category: 'operations',
        openPath: `/os/transfers?sourceBatchId=${encodeURIComponent(sourceBatch.id)}`,
        sourceRecordId: sourceBatch.id,
      }).catch(() => undefined);
      toast.success('Transfer run started');
      await load();
      return (payload?.data as TransferRunRecord | undefined) ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transfer run.';
      setStatusText(message);
      toast.error(message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const openCompleteDialog = (run: TransferRunRecord) => {
    setCompletionRun(run);
    setCompletionLossQty(String(run.lossQty ?? 0));
    setCompletionLossUnit(coerceLiquidUnit(run.sourceUnit, coerceLiquidUnit(sourceBatch?.unit, 'bbl')));
    setCompletionLossReasonCode(run.lossReasonCode ?? 'spill');
    setCompletionOperator(run.operator ?? operator);
  };

  const previewTransferRun = async (run: TransferRunRecord) => {
    const matchedSource = batches.find((batch) => batch.id === run.sourceBatchId) ?? sourceBatch;
    const startSourceQty =
      matchedSource
        ? Math.max(0, matchedSource.producedQty - matchedSource.allocatedQty - (matchedSource.dispensedQty ?? 0))
        : Math.max(0, Number(run.sourceAvailableQty) + run.destinations.reduce((sum, destination) => sum + destination.actualQty, 0));
    const endSourceQty = Math.max(
      0,
      startSourceQty - run.destinations.reduce((sum, destination) => sum + destination.actualQty, 0)
    );
    const durationMs = run.mode === 'auto' ? 2400 : 1400;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const progress = Math.max(0, Math.min(1, (now - startTime) / durationMs));
        const destinationQtyById = Object.fromEntries(
          run.destinations.map((destination) => [
            destination.id,
            Math.max(0, destination.actualQty) * progress,
          ])
        );
        setTransferPreview({
          status: progress < 1 ? 'previewing' : 'previewed',
          sourceQty: startSourceQty + (endSourceQty - startSourceQty) * progress,
          destinationQtyById,
          progress,
          runId: run.id,
        });
        if (progress < 1) {
          requestAnimationFrame(tick);
          return;
        }
        resolve();
      };
      requestAnimationFrame(tick);
    });

    openCompleteDialog(run);
    setStatusText('Review loss, then complete the transfer record.');
  };

  const requestTransferConfirmation = () => {
    if (busy || !sourceBatch) return;
    setConfirmTransferOpen(true);
  };

  const confirmTransferFromWorkspace = async () => {
    setConfirmTransferOpen(false);
    const run = await createRun();
    if (run) {
      await previewTransferRun(run);
    }
  };

  const submitCompleteRun = async () => {
    if (!completionRun) return;
    setBusy(true);
    try {
      const nextLossQtyRaw = Math.max(0, Number(completionLossQty) || 0);
      const nextLossQty =
        nextLossQtyRaw > 0
          ? convertVolume(nextLossQtyRaw, completionLossUnit, completionRun.sourceUnit) ?? nextLossQtyRaw
          : 0;
      const response = await fetch(`/api/os/transfers/${completionRun.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          lossQty: nextLossQty,
          operator: completionOperator.trim() || undefined,
          lossReasonCode: nextLossQty > 0 ? completionLossReasonCode : undefined,
          destinations: completionRun.destinations,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to complete transfer run.');
      }
      void addNotification({
        title: 'Transfer Run Completed',
        message: `${completionRun.sourceLotCode} transfer closed and child batches were created.`,
        type: 'success',
        category: 'operations',
        openPath: `/os/batches/${encodeURIComponent(completionRun.sourceBatchId)}`,
        sourceRecordId: completionRun.sourceBatchId,
      }).catch(() => undefined);
      toast.success('Transfer run completed');
      setCompletionRun(null);
      setCompletionLossQty('0');
      setCompletionLossUnit(coerceLiquidUnit(sourceBatch?.unit, 'bbl'));
      setCompletionLossReasonCode('spill');
      setCompletionOperator('');
      setTransferPreview({
        status: 'idle',
        sourceQty: null,
        destinationQtyById: {},
        progress: 0,
      });
      setDestinations([makeDestination()]);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete transfer run.';
      setStatusText(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const activeRuns = runs.filter((run) => run.status === 'active');
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const movedToday = runs
    .filter((run) => run.status === 'completed' && isTodayLocal(run.completedAt))
    .reduce(
      (sum, run) => sum + run.destinations.reduce((inner, destination) => inner + destination.actualQty, 0),
      0
    );
  const filteredRuns = useMemo(() => {
    if (runFilter === 'active') return activeRuns;
    if (runFilter === 'completed') return completedRuns;
    return runs;
  }, [activeRuns, completedRuns, runFilter, runs]);

  const loadRunIntoStation = (run: TransferRunRecord) => {
    setSourceBatchId(run.sourceBatchId);
    setMode(run.mode);
    setOperator(run.operator ?? '');
    setNotes(run.notes ?? '');
    setDestinations(run.destinations.map(cloneDestination));
    setSelectedAsset(null);
    setActiveWorkspaceTab('station');
    setRunFilter('all');
    setStatusText(`Loaded ${run.sourceLotCode} transfer setup back into the station.`);
  };

  return (
    <AppShell currentSuite="os" pageTitle="Transfers">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transfers</h1>
            <p className="text-muted-foreground">
              Move live batch volume into vessels, barrels, and derived branches without losing source traceability.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/os/batches')}>
              Open Batches
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/packaging')}>
              Open Packaging
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Active Runs',
              value: activeRuns.length,
              subtitle: 'currently moving or awaiting closeout',
              icon: ArrowRightLeft,
              onClick: () => {
                setActiveWorkspaceTab('history');
                setRunFilter('active');
              },
              isActive: activeWorkspaceTab === 'history' && runFilter === 'active',
              accentClass:
                'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(34,211,238,0.12)]',
              iconClass: 'text-cyan-300',
              lineClass: 'via-cyan-300/40',
            },
            {
              title: 'Completed Runs',
              value: completedRuns.length,
              subtitle: 'closed transfer records',
              icon: CheckCircle2,
              onClick: () => {
                setActiveWorkspaceTab('history');
                setRunFilter('completed');
              },
              isActive: activeWorkspaceTab === 'history' && runFilter === 'completed',
              accentClass:
                'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]',
              iconClass: 'text-emerald-300',
              lineClass: 'via-emerald-300/40',
            },
            {
              title: 'Moved Today',
              value: movedToday.toFixed(1),
              subtitle: sourceBatch?.unit ?? 'source units completed today',
              icon: Waves,
              onClick: () => {
                setActiveWorkspaceTab('history');
                setRunFilter('completed');
              },
              isActive: activeWorkspaceTab === 'history' && runFilter === 'completed',
              accentClass:
                'border-violet-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]',
              iconClass: 'text-violet-300',
              lineClass: 'via-violet-300/40',
            },
            {
              title: 'Destinations Staged',
              value: destinations.length,
              subtitle: 'vessels or branches in the current draft',
              icon: GitBranch,
              onClick: () => {
                setActiveWorkspaceTab('station');
                setRunFilter('all');
              },
              isActive: activeWorkspaceTab === 'station',
              accentClass:
                'border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(245,158,11,0.12)]',
              iconClass: 'text-amber-300',
              lineClass: 'via-amber-300/40',
            },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <button key={tile.title} type="button" className="text-left" onClick={tile.onClick}>
                <Card className={`overflow-hidden border-white/10 transition hover:border-cyan-300/35 ${tile.accentClass} ${tile.isActive ? 'ring-2 ring-cyan-300/60' : ''}`}>
                  <CardContent className="relative p-5">
                  <div className={`absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent ${tile.lineClass} to-transparent`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Transfer</p>
                      <p className="mt-3 text-3xl font-semibold leading-none text-white">{tile.value}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                      <Icon className={`h-5 w-5 ${tile.iconClass}`} />
                    </div>
                  </div>
                  <div className="mt-5 space-y-1">
                    <p className="text-sm font-medium text-white">{tile.title}</p>
                    <p className="text-xs text-white/60">{tile.subtitle}</p>
                  </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        <Tabs value={activeWorkspaceTab} onValueChange={(value) => setActiveWorkspaceTab(value as TransferWorkspaceTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="station">Transfer Station</TabsTrigger>
            <TabsTrigger value="history">Run History</TabsTrigger>
          </TabsList>

          <TabsContent value="station">
            <Card className="overflow-hidden border-cyan-400/18 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_56px_rgba(0,0,0,0.3)]">
              <CardHeader className="border-b border-white/10 bg-black/10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Transfer Station</p>
                    <CardTitle className="mt-2 text-white">Current Run</CardTitle>
                    <CardDescription>
                      Manual-first vessel and barrel transfer builder with source-aware fill visuals.
                    </CardDescription>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/65">
                    {mode === 'manual' ? 'Manual Line' : 'Auto Line'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <button
                type="button"
                onClick={() => setSelectedAsset(sourceBatch ? { type: 'batch', batch: sourceBatch } : null)}
                className="rounded-3xl border border-cyan-500/18 bg-cyan-500/6 p-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Source Setup</p>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/55">
                    {sourceBatch ? 'Ready' : 'Select source'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-white">
                  {sourceBatch
                    ? `${sourceBatch.batchCode ?? sourceBatch.lotCode} • ${formatVolumeNumber(availableQty(sourceBatch))} ${sourceBatch.unit} available`
                    : 'Choose the active source batch'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mode, operator, and source context for this vessel transfer.
                </p>
              </button>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Summary</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Mode</p>
                    <p className="mt-1 text-sm font-medium text-white">{mode === 'manual' ? 'Manual' : 'Auto'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Destinations</p>
                    <p className="mt-1 text-sm font-medium text-white">{destinations.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Operator</p>
                    <p className="mt-1 text-sm font-medium text-white">{operator || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Notes</p>
                    <p className="mt-1 text-sm font-medium text-white">{notes.trim() || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Staged Qty</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {sourceBatch ? `${formatVolumeNumber(stagedTransferQty)} ${sourceBatch.unit}` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Remaining</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {sourceBatch ? `${formatVolumeNumber(stagedTransferRemaining)} ${sourceBatch.unit}` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Station Flow</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Select the source batch, define the destination vessels or branches, then run the transfer from the station control.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Mode</p>
                    <p className="mt-1 text-sm font-medium text-white">{mode === 'manual' ? 'Manual' : 'Auto'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Destinations</p>
                    <p className="mt-1 text-sm font-medium text-white">{destinations.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-1 col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Source Available</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {sourceBatch ? `${formatVolumeNumber(availableQty(sourceBatch))} ${sourceBatch.unit}` : '--'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-1 col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Staged Transfer</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {sourceBatch ? `${formatVolumeNumber(stagedTransferQty)} ${sourceBatch.unit}` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_132px_minmax(0,1fr)] xl:items-center">
                <div>
                  {sourceBatch ? (
                    <ProcessAssetTile
                      label={sourceBatch.recipeName}
                      subtitle={sourceBatch.batchCode ?? sourceBatch.lotCode}
                      variant="source"
                      currentQty={transferPreview.sourceQty ?? availableQty(sourceBatch)}
                      capacityQty={Math.max(sourceBatch.producedQty, availableQty(sourceBatch))}
                      unit={sourceBatch.unit}
                      accentClassName="fill-cyan-400/75"
                      onClick={() => setSelectedAsset({ type: 'batch', batch: sourceBatch })}
                    />
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-sm text-muted-foreground">
                      Select a source batch to visualize the transfer.
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={requestTransferConfirmation}
                    disabled={busy || !sourceBatch || destinations.length === 0}
                    className="rounded-full border border-cyan-400/25 bg-cyan-500/10 p-5 transition hover:border-cyan-400/45 hover:bg-cyan-500/16 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Transfer run"
                  >
                    <ArrowRightLeft className="h-7 w-7 text-cyan-300" />
                  </button>
                  <div className="space-y-1 text-center">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Run Control</p>
                    <p className="text-xs text-slate-400">
                      {busy ? 'Transfer in progress' : 'Start the current vessel transfer'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {destinations.map((destination) => (
                    <ProcessAssetTile
                      key={destination.id}
                      label={destination.derivedProductName || destination.label}
                      subtitle={
                        destination.childBatchCode ||
                        destination.branchCode ||
                        destination.kind.replaceAll('_', ' ')
                      }
                      variant={
                        destination.kind === 'barrel'
                          ? 'barrel'
                          : destination.kind === 'bright_tank'
                            ? 'bright_tank'
                            : destination.kind === 'package_line'
                              ? 'package_line'
                              : 'vessel'
                      }
                      currentQty={transferPreview.destinationQtyById[destination.id] ?? 0}
                      capacityQty={destination.capacityQty ?? destination.actualQty}
                      unit={sourceBatch?.unit ?? 'L'}
                      accentClassName={
                        destination.kind === 'barrel' ? 'fill-amber-400/70' : 'fill-emerald-400/70'
                      }
                      onClick={() => setSelectedAsset({ type: 'destination', destination })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedAsset(sourceBatch ? { type: 'batch', batch: sourceBatch } : null)}
                className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Source Setup</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {sourceBatch ? `${sourceBatch.batchCode ?? sourceBatch.lotCode} • ${mode}` : 'Choose the source batch'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Batch selection, mode, operator, and notes.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (destinations.length === 0) {
                    addDestination();
                    return;
                  }
                  setSelectedAsset({
                    type: 'destination',
                    destination: selectedDestination ?? destinations[0],
                  });
                }}
                className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Destination Setup</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {destinations.length} destination{destinations.length === 1 ? '' : 's'} configured
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vessel type, planned qty, treatment, branching, and derived batch identity.
                </p>
              </button>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Destination Routing</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {destinations.map((destination, index) => (
                    <Button
                      key={destination.id}
                      variant="outline"
                      onClick={() => setSelectedAsset({ type: 'destination', destination })}
                    >
                      {destination.label || `Destination ${index + 1}`}
                    </Button>
                  ))}
                  <Button variant="outline" onClick={addDestination}>
                    Add Destination
                  </Button>
                </div>
              </div>
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.92)_0%,rgba(6,14,26,0.98)_100%)]">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-white">Run History</CardTitle>
                    <CardDescription>Active runs stay editable until completed. Completed runs can be loaded back into the station as a template.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={runFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setRunFilter('all')}>
                      All
                    </Button>
                    <Button variant={runFilter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setRunFilter('active')}>
                      Active
                    </Button>
                    <Button variant={runFilter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setRunFilter('completed')}>
                      Completed
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {runFilter === 'all'
                      ? 'No transfer runs recorded yet.'
                      : `No ${runFilter} transfer runs found.`}
                  </p>
                ) : (
                  filteredRuns.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {run.sourceLotCode} • {run.sourceRecipeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.mode} • {run.destinations.length} destinations • loss {run.lossQty}{' '}
                        {run.sourceUnit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(run.operator ?? 'No operator')} • loss reason {run.lossReasonCode ?? '--'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Started {formatDateTime(run.startedAt)} • Completed {formatDateTime(run.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                        {run.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadRunIntoStation(run)}
                      >
                        Load to Station
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/os/batches/${encodeURIComponent(run.sourceBatchId)}`)}
                      >
                        Open Batch
                      </Button>
                      {run.status === 'active' ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            loadRunIntoStation(run);
                            await previewTransferRun(run);
                          }}
                          disabled={busy}
                        >
                          Complete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
          {statusText}
        </div>
      </div>

      <Dialog open={Boolean(selectedAsset)} onOpenChange={(open) => (!open ? setSelectedAsset(null) : null)}>
        <DialogContent className="max-h-[88vh] overflow-auto border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white sm:max-w-[860px]">
          {selectedAsset?.type === 'batch' ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Source Setup</DialogTitle>
                <DialogDescription className="text-white/65">
                  Pick the live source batch and set the operating context for this transfer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
                  <div className="rounded-3xl border border-cyan-400/18 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Select Source</p>
                    <div className="mt-4 space-y-2">
                      <Label className="text-white/80">Source Batch</Label>
                      <select
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={sourceBatchId}
                        onChange={(event) => setSourceBatchId(event.target.value)}
                      >
                        <option value="">Select source batch</option>
                        {sourceBatchOptions.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batchCode ?? batch.lotCode} - {batch.recipeName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {sourceBatch ? (
                      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Available</p>
                          <p className="mt-2 font-mono text-lg font-semibold text-white">
                            {formatVolumeNumber(availableQty(sourceBatch))} {sourceBatch.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Status</p>
                          <p className="mt-2 text-sm font-medium text-white">{sourceBatch.status.replaceAll('_', ' ')}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Produced</p>
                          <p className="mt-2 font-mono text-lg font-semibold text-white">
                            {formatVolumeNumber(sourceBatch.producedQty)} {sourceBatch.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Recipe</p>
                          <p className="mt-2 text-sm font-medium text-white">{sourceBatch.recipeName}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Source Context</p>
                    {sourceBatch ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-semibold text-white">{sourceBatch.batchCode ?? sourceBatch.lotCode}</p>
                        <p className="text-sm text-white/65">{sourceBatch.productSnapshot?.productName ?? sourceBatch.recipeName}</p>
                        <p className="text-sm text-white/55">{sourceBatch.productSnapshot?.productCode ?? sourceBatch.skuId ?? '--'}</p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-white/55">No source selected yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operating Mode</p>
                    <div className="mt-4 space-y-2">
                      <Label className="text-white/80">Mode</Label>
                      <select
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={mode}
                        onChange={(event) => setMode(event.target.value as 'manual' | 'auto')}
                      >
                        <option value="manual">Manual</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operator</p>
                    <div className="mt-4 space-y-2">
                      <Label className="text-white/80">Operator Name</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={operator}
                        onChange={(event) => setOperator(event.target.value)}
                        placeholder="Cellar operator"
                      />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Batch Record</p>
                    <div className="mt-4">
                      {sourceBatch ? (
                        <Button onClick={() => navigate(`/os/batches/${sourceBatch.id}`)}>Open Batch</Button>
                      ) : (
                        <p className="text-sm text-white/55">Select a source batch first.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Transfer Note</p>
                  <div className="mt-4 space-y-2">
                    <Label className="text-white/80">Notes</Label>
                    <Textarea
                      className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : selectedDestination ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedDestination.label || 'Destination Setup'}</DialogTitle>
                <DialogDescription className="text-white/65">
                  Configure the transfer destination directly from the visual tile.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
                  <div className="rounded-3xl border border-emerald-400/18 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Destination Definition</p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-white/80">Destination Label</Label>
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          value={selectedDestination.label}
                          onChange={(event) =>
                            updateDestination(selectedDestination.id, { label: event.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Destination Type</Label>
                        <select
                          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                          value={selectedDestination.kind}
                          onChange={(event) =>
                            updateDestination(selectedDestination.id, {
                              kind: event.target.value as TransferDestinationKind,
                            })
                          }
                        >
                          {destinationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Capacity</Label>
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          value={selectedDestination.capacityQty ?? ''}
                          onChange={(event) =>
                            updateDestination(selectedDestination.id, {
                              capacityQty:
                                event.target.value.trim() === '' ? undefined : Number(event.target.value),
                            })
                          }
                          placeholder={`Capacity ${sourceBatch?.unit ?? ''}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Treatment</Label>
                        <select
                          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                          value={selectedDestination.treatmentType ?? 'none'}
                          onChange={(event) =>
                            updateDestination(selectedDestination.id, {
                              treatmentType: event.target.value as TransferDestination['treatmentType'],
                            })
                          }
                        >
                          <option value="none">No treatment</option>
                          <option value="oak_aged">Oak aged</option>
                          <option value="lees_aged">Lees aged</option>
                          <option value="blend">Blend</option>
                          <option value="backsweetened">Backsweetened</option>
                          <option value="carbonated">Carbonated</option>
                          <option value="filtered">Filtered</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Current Destination</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <p><span className="text-white/45">Kind</span><br />{selectedDestination.kind.replaceAll('_', ' ')}</p>
                      <p><span className="text-white/45">Planned</span><br />{formatVolumeNumber(selectedDestination.plannedQty)} {sourceBatch?.unit ?? 'L'}</p>
                      <p><span className="text-white/45">Actual</span><br />{formatVolumeNumber(selectedDestination.actualQty)} {sourceBatch?.unit ?? 'L'}</p>
                      <p><span className="text-white/45">Branch</span><br />{selectedDestination.branchCode ?? '--'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Transfer Quantities</p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-white/80">Planned Qty</Label>
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          value={selectedDestination.plannedQty}
                          onChange={(event) =>
                            updateDestination(selectedDestination.id, {
                              plannedQty: Number(event.target.value),
                              actualQty: Number(event.target.value),
                            })
                          }
                          placeholder={`Planned ${sourceBatch?.unit ?? ''}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Actual Qty</Label>
                        <Input
                          className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                          value={selectedDestination.actualQty}
                          onChange={(event) =>
                            updateDestination(selectedDestination.id, {
                              actualQty: Number(event.target.value),
                            })
                          }
                          placeholder={`Actual ${sourceBatch?.unit ?? ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Child Batch</p>
                    <div className="mt-4">
                      {selectedDestination.childBatchId ? (
                        <Button onClick={() => navigate(`/os/batches/${selectedDestination.childBatchId}`)}>
                          Open Child Batch
                        </Button>
                      ) : (
                        <p className="text-sm text-white/55">Child batch is created when the transfer run completes.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Branch Identity</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">Branch Code</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={selectedDestination.branchCode ?? ''}
                        onChange={(event) =>
                          updateDestination(selectedDestination.id, { branchCode: event.target.value })
                        }
                        placeholder="Branch code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Derived Product Code</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={selectedDestination.derivedProductCode ?? ''}
                        onChange={(event) =>
                          updateDestination(selectedDestination.id, {
                            derivedProductCode: event.target.value,
                          })
                        }
                        placeholder="Derived product code"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-white/80">Derived Product Name</Label>
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={selectedDestination.derivedProductName ?? ''}
                        onChange={(event) =>
                          updateDestination(selectedDestination.id, {
                            derivedProductName: event.target.value,
                          })
                        }
                        placeholder="Derived product name"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDestinations((current) =>
                        current.filter((destination) => destination.id !== selectedDestination.id)
                      );
                      setSelectedAsset(null);
                    }}
                  >
                    Remove Destination
                  </Button>
                  <Button onClick={() => setSelectedAsset(null)}>Continue to Station</Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmTransferOpen} onOpenChange={setConfirmTransferOpen}>
        <DialogContent className="max-w-lg border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Start Transfer Run?</DialogTitle>
            <DialogDescription className="text-white/65">
              Confirm the source, staged destinations, and intent before opening the vessel transfer run.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Source Batch</span>
              <span className="font-medium text-foreground">
                {sourceBatch?.batchCode ?? sourceBatch?.lotCode ?? '--'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium text-foreground">
                {sourceBatch ? `${formatVolumeNumber(availableQty(sourceBatch))} ${sourceBatch.unit}` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Destinations</span>
              <span className="font-medium text-foreground">{destinations.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-medium text-foreground">{mode === 'manual' ? 'Manual' : 'Auto'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Staged Qty</span>
              <span className="font-medium text-foreground">
                {sourceBatch ? `${formatVolumeNumber(stagedTransferQty)} ${sourceBatch.unit}` : '--'}
              </span>
            </div>
            {destinations.length > 0 ? (
              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Destination Plan</p>
                {destinations.map((destination, index) => (
                  <div key={destination.id} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {destination.label || `Destination ${index + 1}`}
                    </span>
                    <span className="font-medium text-foreground">
                      {sourceBatch
                        ? `${formatVolumeNumber(destination.actualQty)} ${sourceBatch.unit}`
                        : formatVolumeNumber(destination.actualQty)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmTransferOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void confirmTransferFromWorkspace()} disabled={busy || !sourceBatch || destinations.length === 0}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completionRun)} onOpenChange={(open) => (!open ? setCompletionRun(null) : null)}>
        <DialogContent className="max-w-xl border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.98)_0%,rgba(7,12,22,0.99)_100%)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Complete Transfer Run</DialogTitle>
            <DialogDescription className="text-white/65">
              Record any loss after the transfer is finished, then close the run.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Summary</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Source</p>
                  <p className="mt-1 text-sm text-white">{completionRun?.sourceLotCode ?? '--'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Destinations</p>
                  <p className="mt-1 text-sm text-white">{completionRun?.destinations.length ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="space-y-2">
                  <Label className="text-white/80">Operator</Label>
                  <Input
                    className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                    value={completionOperator}
                    onChange={(event) => setCompletionOperator(event.target.value)}
                    placeholder="Cellar operator"
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Loss Record</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Transferred Qty</p>
                    <p className="mt-1 text-sm text-white">
                      {completionRun
                        ? `${formatVolumeNumber(
                            completionRun.destinations.reduce(
                              (sum, destination) => sum + destination.actualQty,
                              0
                            )
                          )} ${completionRun.sourceUnit}`
                        : '--'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Loss Qty</Label>
                    <div className="flex gap-2">
                      <Input
                        className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/35"
                        value={completionLossQty}
                        onChange={(event) => setCompletionLossQty(event.target.value)}
                        placeholder={completionRun?.sourceUnit ?? ''}
                      />
                      <select
                        className="h-10 min-w-[132px] rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                        value={completionLossUnit}
                        onChange={(event) => setCompletionLossUnit(event.target.value)}
                      >
                        {LIQUID_UNIT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Loss Reason</Label>
                    <select
                      className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
                      value={completionLossReasonCode}
                      onChange={(event) => setCompletionLossReasonCode(event.target.value)}
                      disabled={Math.max(0, Number(completionLossQty) || 0) <= 0}
                    >
                      <option value="spill">Spill</option>
                      <option value="dump">Dump</option>
                      <option value="breakage">Breakage</option>
                      <option value="purge_loss">Purge Loss</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompletionRun(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitCompleteRun()} disabled={busy}>
              Complete Run
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
