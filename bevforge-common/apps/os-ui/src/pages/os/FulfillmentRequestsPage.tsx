import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import MetricCard from '@/components/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  PackageCheck,
  AlertTriangle,
  Clock3,
} from 'lucide-react';

type FulfillmentRequestType = 'production' | 'packaging';

type FulfillmentRequestStatus =
  | 'queued'
  | 'accepted'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'canceled'
  | 'rejected';

interface BatchOption {
  id: string;
  lotCode: string;
  recipeName: string;
  siteId: string;
  status: string;
}

interface FulfillmentRequestRecord {
  id: string;
  requestId: string;
  sourceSuite: 'ops' | 'os' | 'lab' | 'flow' | 'connect';
  type: FulfillmentRequestType;
  status: FulfillmentRequestStatus;
  siteId: string;
  skuId: string;
  requestedQty: number;
  uom: string;
  orderId?: string;
  lineId?: string;
  linkedBatchIds: string[];
  linkedPackageLotIds: string[];
  events?: Array<{
    action?: string;
    note?: string;
    timestamp?: string;
  }>;
  updatedAt: string;
}

const makeActionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export default function FulfillmentRequestsPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [requests, setRequests] = useState<FulfillmentRequestRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [status, setStatus] = useState('Loading fulfillment requests...');
  const [busyRequestKey, setBusyRequestKey] = useState<string | null>(null);
  const [newRequestType, setNewRequestType] = useState<FulfillmentRequestType>('packaging');
  const [newRequestSiteId, setNewRequestSiteId] = useState('main');
  const [newRequestSkuId, setNewRequestSkuId] = useState('');
  const [newRequestQty, setNewRequestQty] = useState('1');
  const [newRequestUom, setNewRequestUom] = useState('units');

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId]
  );

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ),
    [requests]
  );

  const summary = useMemo(() => {
    const open = requests.filter((request) =>
      ['queued', 'accepted', 'in_progress', 'blocked'].includes(request.status)
    ).length;
    const blocked = requests.filter((request) => request.status === 'blocked').length;
    const packaging = requests.filter((request) => request.type === 'packaging').length;
    const production = requests.filter((request) => request.type === 'production').length;
    return { open, blocked, packaging, production };
  }, [requests]);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/os/fulfillment/requests');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load fulfillment queue.');
      }
      setRequests((payload.data ?? []) as FulfillmentRequestRecord[]);
      setStatus('Fulfillment inbox loaded.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to load fulfillment queue.'
      );
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const response = await fetch('/api/os/batches');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load batches for linking.');
      }
      setBatches((payload.data?.batches ?? []) as BatchOption[]);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to load batches for linking.'
      );
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadRequests(), loadBatches()]);
  }, [loadBatches, loadRequests]);

  const queueFulfillmentRequest = async () => {
    const skuId = newRequestSkuId.trim();
    const siteId = newRequestSiteId.trim() || 'main';
    const qty = Number(newRequestQty);
    const uom = newRequestUom.trim() || 'units';
    if (!skuId) {
      setStatus('SKU ID is required to queue a fulfillment request.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setStatus('Requested qty must be greater than zero.');
      return;
    }
    const requestId = `os-ui-${Date.now()}`;
    setBusyRequestKey(`queue:${requestId}`);
    try {
      const response = await fetch('/api/os/fulfillment/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          sourceSuite: 'os',
          type: newRequestType,
          siteId,
          skuId,
          requestedQty: qty,
          uom,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to queue fulfillment request.');
      }
      await loadRequests();
      setStatus(`Queued fulfillment request ${requestId}.`);
      setNewRequestSkuId('');
      setNewRequestQty('1');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to queue fulfillment request.'
      );
    } finally {
      setBusyRequestKey(null);
    }
  };

  const applyFulfillmentAction = async (
    request: FulfillmentRequestRecord,
    action:
      | 'accept'
      | 'start'
      | 'block'
      | 'complete'
      | 'cancel'
      | 'reject'
      | 'link_batch'
  ) => {
    const busyKey = `${request.requestId}:${action}`;
    if (busyRequestKey) return;

    if (action === 'link_batch') {
      if (!selectedBatchId || !selectedBatch) {
        setStatus('Select a target batch before linking.');
        return;
      }
      if (selectedBatch.siteId !== request.siteId) {
        setStatus(
          `Site mismatch: request is ${request.siteId}, selected batch is ${selectedBatch.siteId}.`
        );
        return;
      }
    }

    setBusyRequestKey(busyKey);
    try {
      const body =
        action === 'link_batch'
          ? {
              actionId: makeActionId(),
              action,
              actor: 'os-ui',
              linkedBatchId: selectedBatchId,
            }
          : { actionId: makeActionId(), action, actor: 'os-ui' };
      const response = await fetch(`/api/os/fulfillment/requests/${request.requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to update fulfillment request.');
      }
      await loadRequests();
      setStatus(`Request ${request.requestId} action applied: ${action}.`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to update fulfillment request.'
      );
    } finally {
      setBusyRequestKey(null);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Requests">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fulfillment Requests</h1>
          <p className="mt-1 text-muted-foreground">
            OPS and the other suites hand off production and packaging demand here before OS fulfills it.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/os/batches')}>
              Back to Batches
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/transfers')}>
              Transfers
            </Button>
            <Button variant="outline" onClick={() => navigate('/os/packaging')}>
              Packaging
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Open Requests"
            value={summary.open}
            unit="requests"
            icon={Clock3}
            status="info"
          />
          <MetricCard
            title="Blocked"
            value={summary.blocked}
            unit="requests"
            icon={AlertTriangle}
            status={summary.blocked > 0 ? 'warning' : 'operational'}
          />
          <MetricCard
            title="Packaging"
            value={summary.packaging}
            unit="requests"
            icon={PackageCheck}
            status="operational"
          />
          <MetricCard
            title="Production"
            value={summary.production}
            unit="requests"
            icon={ArrowRightLeft}
            status="info"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Queue New Request</CardTitle>
              <CardDescription>
                Use this when OS itself needs to enqueue packaging or production work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <select
                    className="h-9 w-full rounded border border-input bg-background px-3 text-sm"
                    value={newRequestType}
                    onChange={(event) =>
                      setNewRequestType(event.target.value as FulfillmentRequestType)
                    }
                  >
                    <option value="packaging">packaging</option>
                    <option value="production">production</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Site ID</Label>
                  <Input
                    value={newRequestSiteId}
                    onChange={(event) => setNewRequestSiteId(event.target.value)}
                    placeholder="main"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">SKU ID</Label>
                  <Input
                    value={newRequestSkuId}
                    onChange={(event) => setNewRequestSkuId(event.target.value)}
                    placeholder="SKU-CIDER-KEG"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    value={newRequestQty}
                    onChange={(event) => setNewRequestQty(event.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">UOM</Label>
                  <Input
                    value={newRequestUom}
                    onChange={(event) => setNewRequestUom(event.target.value)}
                    placeholder="units"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => void queueFulfillmentRequest()}
                  disabled={Boolean(busyRequestKey)}
                >
                  Queue Request
                </Button>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Link Target Batch
                </p>
                <select
                  className="h-9 w-full rounded border border-input bg-background px-3 text-sm"
                  value={selectedBatchId}
                  onChange={(event) => setSelectedBatchId(event.target.value)}
                >
                  <option value="">Select batch for linking</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.lotCode} - {batch.recipeName} ({batch.siteId})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected batch: {selectedBatch ? `${selectedBatch.lotCode} • ${selectedBatch.status}` : 'none'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Inbox</CardTitle>
              <CardDescription>
                This is the operator-facing queue for packaging and production demand coming into OS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fulfillment requests queued.</p>
              ) : (
                sortedRequests.map((request) => (
                  <div key={request.id} className="space-y-2 rounded border border-border p-3">
                    {request.events?.[0]?.note ? (
                      <p className="rounded border border-border/80 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                        {request.events[0].note}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {request.type} • {request.skuId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.requestId} • site {request.siteId} • source {request.sourceSuite}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.requestedQty} {request.uom} • linked batches {request.linkedBatchIds.length} • linked package lots {request.linkedPackageLotIds.length}
                        </p>
                      </div>
                      <Badge variant={request.status === 'completed' ? 'secondary' : 'outline'}>
                        {request.status.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busyRequestKey)}
                        onClick={() => void applyFulfillmentAction(request, 'accept')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busyRequestKey)}
                        onClick={() => void applyFulfillmentAction(request, 'start')}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busyRequestKey)}
                        onClick={() => void applyFulfillmentAction(request, 'complete')}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busyRequestKey)}
                        onClick={() => void applyFulfillmentAction(request, 'block')}
                      >
                        Block
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busyRequestKey)}
                        onClick={() => void applyFulfillmentAction(request, 'cancel')}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busyRequestKey)}
                        onClick={() => void applyFulfillmentAction(request, 'reject')}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={Boolean(busyRequestKey) || !selectedBatchId}
                        onClick={() => void applyFulfillmentAction(request, 'link_batch')}
                      >
                        Link Selected Batch
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">{status}</p>
      </div>
    </AppShell>
  );
}
