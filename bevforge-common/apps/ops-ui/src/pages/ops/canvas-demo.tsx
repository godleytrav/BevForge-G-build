import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Printer, Package, Truck, Home, Factory, RotateCcw, Shield } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

// Mock data
const mockOrders = [
  {
    id: 'ORD-001',
    customer: "Joe's Bar",
    items: ['2x Keg (IPA)', '1x Case (Bottles, 12-pack)'],
    status: 'pending' as const,
  },
  {
    id: 'ORD-002',
    customer: 'Main St Pub',
    items: ['5x Keg (Lager)'],
    status: 'pending' as const,
  },
  {
    id: 'ORD-003',
    customer: 'Downtown Pub',
    items: ['3x Keg (Stout)', '2x Case (Cans, 6-pack)'],
    status: 'pending' as const,
  },
];

const stages = [
  { id: 'tax', name: 'Tax Determination', icon: Shield, color: 'text-purple-500', angle: 0 },
  { id: 'production', name: 'Production House', icon: Factory, color: 'text-blue-500', angle: 60 },
  { id: 'packaging', name: 'Packaging', icon: Package, color: 'text-green-500', angle: 120 },
  { id: 'delivery', name: 'Delivery', icon: Truck, color: 'text-orange-500', angle: 180 },
  { id: 'restaurant', name: 'Restaurant', icon: Home, color: 'text-red-500', angle: 240 },
  { id: 'returns', name: 'Returns/Empties', icon: RotateCcw, color: 'text-gray-500', angle: 300 },
];

export default function CanvasDemo() {
  const [orders, setOrders] = useState(mockOrders);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [truckLoad, setTruckLoad] = useState<typeof mockOrders>([]);
  const { addNotification } = useNotifications();

  const handleApprove = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status: 'approved' as const } : order
      )
    );
    addNotification({
      title: 'Order Approved',
      message: `Order ${orderId} has been approved for loading`,
      type: 'success',
    });
  };

  const handleLoadToTruck = (order: typeof mockOrders[0]) => {
    if (order.status !== 'approved') {
      addNotification({
        title: 'Cannot Load',
        message: 'Order must be approved before loading',
        type: 'error',
      });
      return;
    }
    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: 'loaded' as const } : o))
    );
    setTruckLoad(prev => [...prev, { ...order, status: 'loaded' as const }]);
    addNotification({
      title: 'Loaded to Truck',
      message: `${order.customer} order loaded to TRUCK-1`,
      type: 'success',
    });
  };

  const getStageContent = (stageId: string) => {
    switch (stageId) {
      case 'tax':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Bonded storage tracking for TTB compliance
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Current Inventory:</span>
                <span className="font-medium">2,450 units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax Liability:</span>
                <span className="font-medium text-orange-500">$12,450.00</span>
              </div>
            </div>
          </div>
        );
      case 'production':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active production batches</p>
            <div className="space-y-1">
              <div className="text-sm">Batch #2024-045 - IPA (Fermenting)</div>
              <div className="text-sm">Batch #2024-046 - Lager (Conditioning)</div>
              <div className="text-sm">Batch #2024-047 - Stout (Packaging)</div>
            </div>
          </div>
        );
      case 'packaging':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Packaging operations</p>
            <div className="space-y-1">
              <div className="text-sm">Kegs filled today: 45</div>
              <div className="text-sm">Bottles packaged: 1,200</div>
              <div className="text-sm">Cans packaged: 2,400</div>
            </div>
          </div>
        );
      case 'delivery':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">TRUCK-1 - Route A</h4>
              <Badge variant="outline">Capacity: 75%</Badge>
            </div>
            {truckLoad.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items loaded yet</p>
            ) : (
              <div className="space-y-2">
                {truckLoad.map((order, idx) => (
                  <div key={order.id} className="border-l-2 border-primary pl-3 py-1">
                    <div className="text-sm font-medium">
                      Stop {idx + 1}: {order.customer}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button size="sm" className="w-full">
              Start Route
            </Button>
          </div>
        );
      case 'restaurant':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active customer locations</p>
            <div className="space-y-1">
              <div className="text-sm">Joe's Bar - 12 kegs on-site</div>
              <div className="text-sm">Main St Pub - 8 kegs on-site</div>
              <div className="text-sm">Downtown Pub - 15 kegs on-site</div>
            </div>
          </div>
        );
      case 'returns':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Empty containers awaiting pickup</p>
            <div className="space-y-1">
              <div className="text-sm">Kegs to collect: 23</div>
              <div className="text-sm">Cases to collect: 8</div>
              <div className="text-sm">Next pickup: Tomorrow 9:00 AM</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const selectedStageData = stages.find(s => s.id === selectedStage);

  // Calculate positions for stages on a circle
  const radius = 280; // Distance from center
  const centerX = 400; // Center of the canvas
  const centerY = 400;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Logistics Canvas</h1>
              <p className="text-sm text-muted-foreground">Circular Lifecycle Demo</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="container mx-auto px-6 py-8">
        <div className="relative" style={{ height: '800px' }}>
          {/* SVG for the circular connection line */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '800px', height: '800px', left: '50%', transform: 'translateX(-50%)' }}
          >
            {/* Main circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              strokeDasharray="8 4"
              opacity="0.5"
            />
            
            {/* Connection lines between stages */}
            {stages.map((stage, idx) => {
              const nextStage = stages[(idx + 1) % stages.length];
              const x1 = centerX + radius * Math.cos((stage.angle * Math.PI) / 180);
              const y1 = centerY + radius * Math.sin((stage.angle * Math.PI) / 180);
              const x2 = centerX + radius * Math.cos((nextStage.angle * Math.PI) / 180);
              const y2 = centerY + radius * Math.sin((nextStage.angle * Math.PI) / 180);
              
              return (
                <line
                  key={`line-${stage.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  opacity="0.3"
                />
              );
            })}
          </svg>

          {/* Stage nodes */}
          {stages.map(stage => {
            const x = centerX + radius * Math.cos((stage.angle * Math.PI) / 180);
            const y = centerY + radius * Math.sin((stage.angle * Math.PI) / 180);
            const Icon = stage.icon;
            const isSelected = selectedStage === stage.id;

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id === selectedStage ? null : stage.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
                style={{
                  left: '50%',
                  top: 0,
                  marginLeft: `${x - centerX}px`,
                  marginTop: `${y}px`,
                }}
              >
                <div
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl bg-card border-2 transition-all ${
                    isSelected
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ width: '140px' }}
                >
                  {/* Glow effect when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse" />
                  )}
                  
                  <div
                    className={`relative z-10 p-3 rounded-full bg-background border-2 ${
                      isSelected ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${stage.color}`} />
                  </div>
                  <span className="relative z-10 text-xs font-medium text-center leading-tight">
                    {stage.name}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Center staging area */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: '50%',
              top: `${centerY}px`,
              width: '360px',
              height: '360px',
            }}
          >
            <Card className="h-full border-2 border-primary shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-center">Staging Area</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                <div className="space-y-3">
                  {orders.map(order => (
                    <Card
                      key={order.id}
                      className={`border-l-4 ${
                        order.status === 'pending'
                          ? 'border-l-yellow-500'
                          : order.status === 'approved'
                          ? 'border-l-green-500'
                          : 'border-l-blue-500'
                      }`}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">{order.customer}</div>
                            <div className="text-xs text-muted-foreground">{order.id}</div>
                          </div>
                          <Badge
                            variant={
                              order.status === 'pending'
                                ? 'secondary'
                                : order.status === 'approved'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-muted-foreground">
                              • {item}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => handleApprove(order.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {order.status === 'approved' && (
                            <Button
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => handleLoadToTruck(order)}
                            >
                              Load to Truck
                            </Button>
                          )}
                          {order.status === 'loaded' && (
                            <Badge variant="outline" className="flex-1 justify-center">
                              On Truck
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stage detail panel */}
        {selectedStage && (
          <Card className="mt-6 border-2 border-primary animate-in slide-in-from-bottom-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                {selectedStageData && (
                  <>
                    <div className={`p-2 rounded-lg bg-background border`}>
                      <selectedStageData.icon className={`h-5 w-5 ${selectedStageData.color}`} />
                    </div>
                    <CardTitle>{selectedStageData.name}</CardTitle>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>{getStageContent(selectedStage)}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
