import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcurementLine {
  id: string;
  itemId: string;
  itemName: string;
  skuId: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  status: 'ordered' | 'partially_received' | 'received' | 'canceled';
}

interface ProcurementOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorUrl?: string;
  status: 'ordered' | 'partially_received' | 'received' | 'canceled';
  orderedAt: string;
  expectedAt?: string;
  lines: ProcurementLine[];
}

export default function InventoryOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [status, setStatus] = useState('Loading pending orders...');
  const [receiveQtyByLine, setReceiveQtyByLine] = useState<Record<string, string>>({});
  const [busyLineId, setBusyLineId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/os/inventory/procurement/orders?status=pending');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to load pending orders.');
      }
      const nextOrders = (payload.data ?? []) as ProcurementOrder[];
      setOrders(nextOrders);
      setStatus('Pending vendor orders loaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load pending orders.');
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openLines = useMemo(
    () =>
      orders.flatMap((order) =>
        order.lines
          .filter((line) => line.status === 'ordered' || line.status === 'partially_received')
          .map((line) => ({ order, line }))
      ),
    [orders]
  );

  const receiveLine = async (orderId: string, line: ProcurementLine) => {
    const outstanding = Math.max(0, Number(line.orderedQty) - Number(line.receivedQty));
    const rawQty = receiveQtyByLine[line.id];
    const qty = Number(rawQty && rawQty.trim() ? rawQty : outstanding);
    if (!Number.isFinite(qty) || qty <= 0) {
      setStatus('Receive qty must be greater than zero.');
      return;
    }
    setBusyLineId(line.id);
    try {
      const response = await fetch(`/api/os/inventory/procurement/orders/${orderId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId: line.id,
          receivedQty: qty,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to receive line.');
      }
      await loadOrders();
      setStatus(`Checked in ${qty} ${line.unit} for ${line.itemName}.`);
      setReceiveQtyByLine((prev) => ({ ...prev, [line.id]: '' }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to receive line.');
    } finally {
      setBusyLineId(null);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="Inventory Orders Check-In">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pending Vendor Check-In</h1>
            <p className="mt-1 text-muted-foreground">
              Receive incoming vendor inventory into on-hand stock.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/os/inventory')}>
            Back to Inventory
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-sm text-muted-foreground">Open Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{openLines.length}</div>
              <p className="text-sm text-muted-foreground">Open Lines</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {openLines.reduce(
                  (sum, entry) =>
                    sum + Math.max(0, entry.line.orderedQty - entry.line.receivedQty),
                  0
                )}
              </div>
              <p className="text-sm text-muted-foreground">Outstanding Qty</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Lines</CardTitle>
            <CardDescription>
              Check in full or partial quantities per line.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending lines to receive.</p>
            ) : (
              openLines.map(({ order, line }) => {
                const outstanding = Math.max(0, line.orderedQty - line.receivedQty);
                const receiveQty = receiveQtyByLine[line.id] ?? String(outstanding);
                return (
                  <div key={line.id} className="rounded border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{line.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.poNumber} • {order.vendorName} • {line.skuId}
                        </p>
                      </div>
                      <Badge variant="outline">{line.status.replaceAll('_', ' ')}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div>
                        <Label className="text-xs text-muted-foreground">Ordered</Label>
                        <p className="pt-2 font-mono">
                          {line.orderedQty} {line.unit}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Received</Label>
                        <p className="pt-2 font-mono">
                          {line.receivedQty} {line.unit}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Outstanding</Label>
                        <p className="pt-2 font-mono">
                          {outstanding} {line.unit}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Receive Qty</Label>
                        <Input
                          type="number"
                          value={receiveQty}
                          onChange={(event) =>
                            setReceiveQtyByLine((prev) => ({
                              ...prev,
                              [line.id]: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          className="w-full"
                          onClick={() => void receiveLine(order.id, line)}
                          disabled={busyLineId === line.id}
                        >
                          Check In
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">{status}</p>
      </div>
    </AppShell>
  );
}
