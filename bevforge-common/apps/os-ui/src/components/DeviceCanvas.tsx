import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3 } from 'lucide-react';

export interface Device {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  status: 'operational' | 'warning' | 'error' | 'offline';
  connections?: string[]; // IDs of connected devices
}

interface DeviceCanvasProps {
  devices?: Device[];
  onDeviceMove?: (deviceId: string, x: number, y: number) => void;
  onDeviceClick?: (device: Device) => void;
  className?: string;
}

const statusColors = {
  operational: 'bg-green-100 border-green-500',
  warning: 'bg-yellow-100 border-yellow-500',
  error: 'bg-red-100 border-destructive',
  offline: 'bg-gray-100 border-gray-400',
};

export default function DeviceCanvas({
  devices = [],
  onDeviceMove,
  onDeviceClick,
  className = '',
}: DeviceCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [draggingDevice, setDraggingDevice] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, device: Device) => {
      e.stopPropagation();
      setDraggingDevice(device.id);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom - device.x,
          y: (e.clientY - rect.top) / zoom - device.y,
        });
      }
    },
    [zoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingDevice || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / zoom - dragOffset.x) / 20) * 20;
      const y = Math.round(((e.clientY - rect.top) / zoom - dragOffset.y) / 20) * 20;

      onDeviceMove?.(draggingDevice, x, y);
    },
    [draggingDevice, dragOffset, zoom, onDeviceMove]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingDevice(null);
  }, []);

  const drawConnection = (from: Device, to: Device) => {
    const fromX = from.x + 40;
    const fromY = from.y + 40;
    const toX = to.x + 40;
    const toY = to.y + 40;

    return (
      <line
        key={`${from.id}-${to.id}`}
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.6"
      />
    );
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowGrid(!showGrid)}
          className="bg-card/80 backdrop-blur-sm"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-card/80 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetZoom}
          className="bg-card/80 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-card/80 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative w-full h-full min-h-[600px] overflow-auto ${showGrid ? 'grid-pattern' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: draggingDevice ? 'grabbing' : 'default',
        }}
      >
        {/* Connection Lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {devices.map((device) =>
            device.connections?.map((connId) => {
              const connectedDevice = devices.find((d) => d.id === connId);
              return connectedDevice ? drawConnection(device, connectedDevice) : null;
            })
          )}
        </svg>

        {/* Devices */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
          }}
        >
          {devices.map((device) => (
            <div
              key={device.id}
              className={`absolute cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg ${
                draggingDevice === device.id ? 'z-50' : 'z-10'
              }`}
              style={{
                left: `${device.x}px`,
                top: `${device.y}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, device)}
              onClick={() => onDeviceClick?.(device)}
            >
              <div
                className={`w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-1 ${
                  statusColors[device.status]
                } bg-opacity-20 backdrop-blur-sm`}
              >
                <div className="text-xs font-mono font-semibold truncate w-full text-center px-1">
                  {device.type}
                </div>
                <div className="text-[10px] text-muted-foreground truncate w-full text-center px-1">
                  {device.name}
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    device.status === 'operational'
                      ? 'bg-green-500'
                      : device.status === 'warning'
                      ? 'bg-yellow-500'
                      : device.status === 'error'
                      ? 'bg-destructive'
                      : 'bg-gray-400'
                  } animate-pulse`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border px-4 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex gap-4">
          <span className="text-muted-foreground">Devices: {devices.length}</span>
          <span className="text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Operational</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Error</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
