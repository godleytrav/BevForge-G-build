import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
// Validation utilities available if needed
// import { validateContainerMove, formatValidationMessage } from '@/lib/validation';
import { getAllAlerts, getAlertColor, getAlertIcon, type Alert } from '@/lib/alerts';

import { QRCodeDisplay } from '@/components/canvas/QRCodeDisplay';
import {
  generateContainerLabel,
  generatePalletManifest,

  printHTML,
} from '@/lib/printing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Package,
  Truck,

  Boxes,
  Beer,
  Wine,
  Droplet,

  Printer,
  Bell,

  Factory,
  Home,
  RotateCcw,
  Shield,
  QrCode,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,

  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Types
// LocationType interface available if needed for future features

interface ProductGroup {
  productId: string;
  productName: string;
  containerType: 'keg' | 'case' | 'bottle' | 'can';
  quantity: number;
  containers: Container[];
}

interface Container {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  type: 'keg' | 'case' | 'bottle' | 'can';
  status: string;
  locationId: string;
  palletId?: string;
  qrCode?: string;
}

interface Order {
  id: string;
  customer: string;
  items: Container[];
  status: 'pending' | 'approved' | 'loaded' | 'in-route' | 'delivered';
  truckId?: string;
}

interface TruckManifest {
  id: string;
  name: string;
  route: string;
  capacity: number;
  orders: Order[];
}

// Stage definitions
const stages = [
  { id: 'tax', name: 'Tax Determination', icon: Shield, color: 'text-purple-500' },
  { id: 'production', name: 'Production', icon: Factory, color: 'text-blue-500' },
  { id: 'packaging', name: 'Packaging', icon: Package, color: 'text-green-500' },
  { id: 'delivery', name: 'Delivery', icon: Truck, color: 'text-orange-500' },
  { id: 'restaurant', name: 'Restaurant', icon: Home, color: 'text-red-500' },
  { id: 'returns', name: 'Returns', icon: RotateCcw, color: 'text-gray-500' },
];

// Mock data
const mockContainers: Container[] = [
  {
    id: 'K001',
    productId: 'P001',
    productName: 'IPA',
    batchId: 'B2024-045',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K001',
  },
  {
    id: 'K002',
    productId: 'P001',
    productName: 'IPA',
    batchId: 'B2024-045',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K002',
  },
  {
    id: 'C045',
    productId: 'P002',
    productName: 'Bottles (12-pack)',
    batchId: 'B2024-046',
    type: 'case',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-C045',
  },
  {
    id: 'K010',
    productId: 'P003',
    productName: 'Lager',
    batchId: 'B2024-047',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K010',
  },
  {
    id: 'K011',
    productId: 'P003',
    productName: 'Lager',
    batchId: 'B2024-047',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K011',
  },
  {
    id: 'K012',
    productId: 'P003',
    productName: 'Lager',
    batchId: 'B2024-047',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K012',
  },
  {
    id: 'K020',
    productId: 'P004',
    productName: 'Stout',
    batchId: 'B2024-048',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K020',
  },
  {
    id: 'K021',
    productId: 'P004',
    productName: 'Stout',
    batchId: 'B2024-048',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K021',
  },
  {
    id: 'K022',
    productId: 'P004',
    productName: 'Stout',
    batchId: 'B2024-048',
    type: 'keg',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-K022',
  },
  {
    id: 'C050',
    productId: 'P005',
    productName: 'Cans (6-pack)',
    batchId: 'B2024-049',
    type: 'case',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-C050',
  },
  {
    id: 'C051',
    productId: 'P005',
    productName: 'Cans (6-pack)',
    batchId: 'B2024-049',
    type: 'case',
    status: 'available',
    locationId: 'staging',
    qrCode: 'QR-C051',
  },
];

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: "Joe's Bar",
    items: [mockContainers[0], mockContainers[1], mockContainers[2]],
    status: 'pending',
  },
  {
    id: 'ORD-002',
    customer: 'Main St Pub',
    items: [mockContainers[3], mockContainers[4], mockContainers[5], mockContainers[6], mockContainers[7]],
    status: 'pending',
  },
  {
    id: 'ORD-003',
    customer: 'Downtown Pub',
    items: [mockContainers[8], mockContainers[9], mockContainers[10]],
    status: 'pending',
  },
];

const mockTrucks: TruckManifest[] = [
  { id: 'TRUCK-1', name: 'Truck #1', route: 'Route A', capacity: 20, orders: [] },
  { id: 'TRUCK-2', name: 'Truck #2', route: 'Route B', capacity: 20, orders: [] },
  { id: 'TRUCK-3', name: 'Truck #3', route: 'Route C', capacity: 15, orders: [] },
];

export default function CanvasHybrid() {
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [trucks, setTrucks] = useState<TruckManifest[]>(mockTrucks);
  const [selectedStage, setSelectedStage] = useState<string>('delivery');
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  // Load alerts
  useEffect(() => {
    const loadedAlerts = getAllAlerts();
    setAlerts(loadedAlerts);
  }, []);

  // Handle approve order
  const handleApprove = (orderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status: 'approved' as const } : order
      )
    );
    addNotification({
      type: 'system',
      title: 'Order Approved',
      description: `Order ${orderId} has been approved for loading`,
      time: 'Just now',
      icon: 'check-circle'
    });
  };

  // Handle load to truck
  const handleLoadToTruck = (order: Order, truckId: string) => {
    if (order.status !== 'approved') {
      addNotification({
        type: 'system',
        title: 'Cannot Load',
        description: 'Order must be approved before loading',
        time: 'Just now',
        icon: 'alert-circle'
      });
      return;
    }

    setOrders(prev =>
      prev.map(o =>
        o.id === order.id ? { ...o, status: 'loaded' as const, truckId } : o
      )
    );

    setTrucks(prev =>
      prev.map(truck =>
        truck.id === truckId
          ? { ...truck, orders: [...truck.orders, { ...order, status: 'loaded', truckId }] }
          : truck
      )
    );

    addNotification({
      type: 'system',
      title: 'Loaded to Truck',
      description: `${order.customer} order loaded to ${truckId}`,
      time: 'Just now',
      icon: 'truck'
    });
  };

  // Handle start route
  const handleStartRoute = (truckId: string) => {
    setTrucks(prev =>
      prev.map(truck =>
        truck.id === truckId
          ? {
              ...truck,
              orders: truck.orders.map(order => ({ ...order, status: 'in-route' as const })),
            }
          : truck
      )
    );

    addNotification({
      type: 'system',
      title: 'Route Started',
      description: `${truckId} is now in route`,
      time: 'Just now',
      icon: 'truck'
    });
  };

  // Handle print label
  const handlePrintLabel = (container: Container) => {
    const html = generateContainerLabel(container);
    printHTML(html);
    addNotification({
      type: 'system',
      title: 'Label Printed',
      description: `Label for ${container.id} sent to printer`,
      time: 'Just now',
      icon: 'printer'
    });
  };

  // Handle print truck manifest
  const handlePrintTruckManifest = (truck: TruckManifest) => {
    const containers = truck.orders.flatMap(order => order.items);
    const html = generatePalletManifest({
      id: truck.id,
      name: truck.name,
      containers,
      createdAt: new Date().toISOString(),
    });
    printHTML(html);
    addNotification({
      type: 'system',
      title: 'Manifest Printed',
      description: `Manifest for ${truck.name} sent to printer`,
      time: 'Just now',
      icon: 'printer'
    });
  };

  // Get container icon
  const getContainerIcon = (type: string) => {
    switch (type) {
      case 'keg':
        return Beer;
      case 'case':
        return Boxes;
      case 'bottle':
        return Wine;
      case 'can':
        return Droplet;
      default:
        return Package;
    }
  };

  // Get stage content for info bar
  const getStageContent = (stageId: string) => {
    switch (stageId) {
      case 'tax':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">2,450</div>
                  <div className="text-sm text-muted-foreground">Units in Bonded Storage</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-500">$12,450</div>
                  <div className="text-sm text-muted-foreground">Tax Liability</div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'production':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">Active Batches</h4>
            <div className="space-y-2">
              {['B2024-045 - IPA (Fermenting)', 'B2024-046 - Lager (Conditioning)', 'B2024-047 - Stout (Packaging)'].map(
                batch => (
                  <Card key={batch}>
                    <CardContent className="p-3">
                      <div className="text-sm">{batch}</div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        );
      case 'packaging':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">45</div>
                  <div className="text-sm text-muted-foreground">Kegs Filled</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">1,200</div>
                  <div className="text-sm text-muted-foreground">Bottles Packaged</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">2,400</div>
                  <div className="text-sm text-muted-foreground">Cans Packaged</div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'delivery':
        return (
          <Tabs defaultValue={trucks[0]?.id} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {trucks.map(truck => (
                <TabsTrigger key={truck.id} value={truck.id}>
                  {truck.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {trucks.map(truck => (
              <TabsContent key={truck.id} value={truck.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{truck.name} - {truck.route}</h4>
                    <p className="text-sm text-muted-foreground">
                      Capacity: {truck.orders.reduce((sum, o) => sum + o.items.length, 0)}/{truck.capacity} units
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintTruckManifest(truck)}
                      disabled={truck.orders.length === 0}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Manifest
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStartRoute(truck.id)}
                      disabled={truck.orders.length === 0 || truck.orders.some(o => o.status === 'in-route')}
                    >
                      Start Route
                    </Button>
                  </div>
                </div>

                {truck.orders.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No orders loaded yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {truck.orders.map((order, idx) => (
                      <Card key={order.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">Stop {idx + 1}: {order.customer}</div>
                              <div className="text-sm text-muted-foreground">{order.id}</div>
                            </div>
                            <Badge
                              variant={order.status === 'in-route' ? 'default' : 'outline'}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {order.items.map(item => {
                              const Icon = getContainerIcon(item.type);
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => setSelectedContainer(item)}
                                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">{item.productName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.id} • Batch {item.batchId}
                                      </div>
                                    </div>
                                  </div>
                                  <QrCode className="h-4 w-4 text-muted-foreground" />
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        );
      case 'restaurant':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">Active Locations</h4>
            <div className="grid grid-cols-3 gap-4">
              {["Joe's Bar", 'Main St Pub', 'Downtown Pub'].map(location => (
                <Card key={location}>
                  <CardContent className="p-4">
                    <div className="font-medium">{location}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.floor(Math.random() * 20) + 5} kegs on-site
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'returns':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">23</div>
                  <div className="text-sm text-muted-foreground">Kegs to Collect</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-sm text-muted-foreground">Cases to Collect</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium">Tomorrow 9:00 AM</div>
                  <div className="text-sm text-muted-foreground">Next Pickup</div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const selectedStageData = stages.find(s => s.id === selectedStage);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'approved');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Logistics Canvas</h1>
              <p className="text-sm text-muted-foreground">Hybrid System</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAlerts(true)}
                className="relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerts
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {alerts.length}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Navigation */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 py-2">
            {stages.map(stage => {
              const Icon = stage.icon;
              const isSelected = selectedStage === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? '' : stage.color}`} />
                  <span className="text-sm font-medium">{stage.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content - 50/50 Split */}
      <div className="flex-1 flex flex-col">
        {/* Staging Area - Top 50% */}
        <div className="flex-1 border-b bg-background">
          <div className="container mx-auto px-6 py-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Staging Area</h2>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Order
              </Button>
            </div>

            {pendingOrders.length === 0 ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders in Staging</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new order to get started
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-3 gap-4 pb-4">
                  {pendingOrders.map(order => (
                    <Card
                      key={order.id}
                      className={`border-l-4 ${
                        order.status === 'pending'
                          ? 'border-l-yellow-500'
                          : 'border-l-green-500'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{order.customer}</CardTitle>
                            <p className="text-xs text-muted-foreground">{order.id}</p>
                          </div>
                          <Badge
                            variant={order.status === 'pending' ? 'secondary' : 'default'}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          {order.items.map(item => {
                            const Icon = getContainerIcon(item.type);
                            return (
                              <button
                                key={item.id}
                                onClick={() => setSelectedContainer(item)}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">{item.productName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.id}
                                    </div>
                                  </div>
                                </div>
                                <QrCode className="h-4 w-4 text-muted-foreground" />
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex gap-2 pt-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleApprove(order.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {order.status === 'approved' && (
                            <div className="flex gap-2 flex-1">
                              {trucks.slice(0, 2).map(truck => (
                                <Button
                                  key={truck.id}
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleLoadToTruck(order, truck.id)}
                                >
                                  {truck.name}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Info Bar - Bottom 50% */}
        <div className="flex-1 bg-card">
          <div className="container mx-auto px-6 py-6 h-full">
            {selectedStageData && (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-background border">
                    <selectedStageData.icon className={`h-5 w-5 ${selectedStageData.color}`} />
                  </div>
                  <h2 className="text-lg font-semibold">{selectedStageData.name}</h2>
                </div>
                <ScrollArea className="flex-1">
                  {getStageContent(selectedStage)}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container Detail Sheet */}
      <Sheet open={!!selectedContainer} onOpenChange={() => setSelectedContainer(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedContainer && (
            <>
              <SheetHeader>
                <SheetTitle>Container Details</SheetTitle>
                <SheetDescription>
                  {selectedContainer.type.toUpperCase()} #{selectedContainer.id}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Product</span>
                    <span className="text-sm font-medium">{selectedContainer.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Batch ID</span>
                    <span className="text-sm font-medium">{selectedContainer.batchId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge>{selectedContainer.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">{selectedContainer.type}</span>
                  </div>
                </div>

                {selectedContainer.qrCode && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">QR Code</h4>
                    <div className="flex justify-center p-4 bg-background rounded-lg border">
                      <QRCodeDisplay type="container" id={selectedContainer.id} label={selectedContainer.product} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handlePrintLabel(selectedContainer)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowQRCode(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR Code
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Alerts Dialog */}
      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Active Alerts</DialogTitle>
            <DialogDescription>
              {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} requiring attention
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {alerts.map(alert => {
                const Icon = getAlertIcon(alert.type);
                const color = getAlertColor(alert.severity);
                return (
                  <Card key={alert.id} className={`border-l-4 ${color}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
