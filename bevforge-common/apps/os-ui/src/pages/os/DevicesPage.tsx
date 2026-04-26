import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import DeviceCanvas, { Device } from '@/components/DeviceCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Gauge, Save, RotateCcw, ExternalLink } from 'lucide-react';

// Mock initial devices
const initialDevices: Device[] = [
  {
    id: 'dev-1',
    type: 'TANK',
    name: 'Tank-01',
    x: 100,
    y: 100,
    status: 'operational',
    connections: ['dev-2'],
  },
  {
    id: 'dev-2',
    type: 'PUMP',
    name: 'Pump-A',
    x: 300,
    y: 100,
    status: 'operational',
    connections: ['dev-3'],
  },
  {
    id: 'dev-3',
    type: 'VALVE',
    name: 'Valve-01',
    x: 500,
    y: 100,
    status: 'warning',
  },
  {
    id: 'dev-4',
    type: 'SENSOR',
    name: 'Temp-01',
    x: 100,
    y: 300,
    status: 'operational',
  },
  {
    id: 'dev-5',
    type: 'TANK',
    name: 'Tank-02',
    x: 300,
    y: 300,
    status: 'error',
  },
];

export default function DevicesPage() {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [savedDevices, setSavedDevices] = useState<Device[]>(initialDevices);

  const handleSave = () => {
    // TODO: Save device layout to backend
    console.log('Saving device layout...', devices);
    setSavedDevices(devices);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    setDevices(savedDevices);
    setHasUnsavedChanges(false);
  };

  const handleDeviceMove = (deviceId: string, x: number, y: number) => {
    if (!isEditMode) return;
    setDevices((prev) =>
      prev.map((device) => (device.id === deviceId ? { ...device, x, y } : device))
    );
    setHasUnsavedChanges(true);
  };

  const handleDeviceClick = (device: Device) => {
    console.log('Device clicked:', device);
  };

  return (
    <AppShell currentSuite="os" pageTitle="Device Layout">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Device Layout</h1>
            <p className="text-muted-foreground mt-1">
              Configure your brewery device layout and connections
            </p>
          </div>
          <Button
            onClick={() => navigate('/os/control-panel')}
            className="gap-2"
          >
            <Gauge className="h-4 w-4" />
            Open Control Panel
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Layout Controls</CardTitle>
            <CardDescription>
              Enable edit mode to drag devices and configure connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-mode"
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                  />
                  <Label htmlFor="edit-mode" className="cursor-pointer">
                    Edit Mode {isEditMode ? '(Enabled)' : '(Disabled)'}
                  </Label>
                </div>
                {hasUnsavedChanges && (
                  <span className="text-sm text-yellow-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasUnsavedChanges}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Layout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Canvas */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <DeviceCanvas
              devices={devices}
              onDeviceMove={handleDeviceMove}
              onDeviceClick={handleDeviceClick}
              className="h-[600px]"
            />
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Edit Mode</h4>
                <p className="text-muted-foreground">
                  Enable edit mode to drag devices around the canvas. {isEditMode ? 'You can now drag devices!' : 'Currently in view-only mode.'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Control Panel</h4>
                <p className="text-muted-foreground">
                  Use the Control Panel for real-time monitoring and control of your devices during production.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Save Changes</h4>
                <p className="text-muted-foreground">
                  Remember to save your layout changes. Unsaved changes will be lost when you navigate away.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
