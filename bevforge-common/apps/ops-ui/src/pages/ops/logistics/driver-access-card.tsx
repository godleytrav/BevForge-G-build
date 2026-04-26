import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldCheck } from 'lucide-react';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

interface DriverAccessCardProps {
  defaultDeviceLabel: string;
  pairingPending: boolean;
  error?: string | null;
  onPair: (pairingCode: string, deviceLabel: string) => Promise<void> | void;
}

export function DriverAccessCard({
  defaultDeviceLabel,
  pairingPending,
  error,
  onPair,
}: DriverAccessCardProps) {
  const [pairingCode, setPairingCode] = useState('');
  const [deviceLabel, setDeviceLabel] = useState(defaultDeviceLabel);

  const submit = async () => {
    const code = pairingCode.trim().toUpperCase();
    const label = deviceLabel.trim();
    if (!code || !label) {
      return;
    }
    await onPair(code, label);
  };

  return (
    <Card style={panelStyle}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Driver Device Pairing Required
        </CardTitle>
        <CardDescription>
          Ask dispatcher to issue a pairing code from Truck Board. This device must be trusted before route scans are allowed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="driver-pairing-code">Pairing Code</Label>
          <Input
            id="driver-pairing-code"
            value={pairingCode}
            onChange={(event) => setPairingCode(event.target.value.toUpperCase())}
            placeholder="AB12CD34"
            autoComplete="one-time-code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver-device-label">Device Label</Label>
          <Input
            id="driver-device-label"
            value={deviceLabel}
            onChange={(event) => setDeviceLabel(event.target.value)}
            placeholder="iPhone 15 Driver"
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <Button
          className="gap-2"
          onClick={() => {
            void submit();
          }}
          disabled={pairingPending || pairingCode.trim().length === 0 || deviceLabel.trim().length === 0}
        >
          <KeyRound className="h-4 w-4" />
          {pairingPending ? 'Pairing Device...' : 'Pair Device'}
        </Button>
      </CardContent>
    </Card>
  );
}
