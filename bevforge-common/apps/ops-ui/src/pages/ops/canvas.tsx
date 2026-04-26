import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { validateContainerMove, formatValidationMessage } from '@/lib/validation';
import { getAllAlerts, getAlertColor, getAlertIcon, type Alert } from '@/lib/alerts';
import { routeToCleaningQueue, getCleaningStats, type CleaningQueueItem } from '@/lib/cleaning';
import { CreatePalletDialog } from '@/components/canvas/CreatePalletDialog';
import { QRCodeDisplay } from '@/components/canvas/QRCodeDisplay';
import {
  generateContainerLabel,
  generatePalletManifest,
  generateBatchLabels,
  printHTML,
} from '@/lib/printing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Plus,
  Package,
  Truck,
  Warehouse,
  MapPin,
  AlertCircle,
  Boxes,
  Beer,
  Wine,
  Droplet,
  GripVertical,
  Printer,
  Bell,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'truck' | 'customer' | 'production' | 'cleaning';
  capacity?: number;
  products: ProductGroup[];
}

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
}



export default function CanvasPage() {
  const { addNotification } = useNotifications();
  const [locations, setLocations] = useState<Location[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'container' | 'pallet' | 'product';
    data: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'warehouse' as Location['type'],
  });
  const [newContainer, setNewContainer] = useState({
    productName: '',
    type: 'keg' as Container['type'],
    quantity: 1,
    locationId: '',
    batchId: 'B-001',
  });
  const [draggedItem, setDraggedItem] = useState<{
    containerId: string;
    productName: string;
    containerType: string;
    fromLocationId: string;
  } | null>(null);
  const [pallets, setPallets] = useState<any[]>([]);
  // const [cleaningQueue, setCleaningQueue] = useState<CleaningQueueItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locationsRes, alertsRes] = await Promise.all([
        fetch('/api/canvas/locations'),
        fetch('/api/canvas/alerts'),
      ]);

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData.locations || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute alerts whenever locations change
  useEffect(() => {
    const allContainers = locations.flatMap((loc) => loc.products.flatMap(p => p.containers));
    const computedAlerts = getAllAlerts(locations, allContainers);
    setAlerts(computedAlerts);
    
    // Push critical alerts to notification system
    computedAlerts.forEach(alert => {
      if (alert.severity === 'critical' || alert.severity === 'error') {
        addNotification({
          title: alert.title,
          description: alert.message,
          time: 'Just now',
          type: alert.type === 'overdue_return' || alert.type === 'deposit_imbalance' ? 'sales' : 
                alert.type === 'low_inventory' || alert.type === 'over_capacity' ? 'inventory' : 'system',
          icon: 'alert-circle',
        });
      }
    });
  }, [locations, addNotification]);

  const handleAddLocation = () => {
    const location: Location = {
      id: `LOC-${Date.now()}`,
      name: newLocation.name,
      type: newLocation.type,
      products: [],
    };
    setLocations([...locations, location]);
    setShowAddLocation(false);
    setNewLocation({ name: '', type: 'warehouse' });
  };

  const handleDragStart = useCallback(
    (containerId: string, productName: string, containerType: string, fromLocationId: string) => {
      setDraggedItem({ containerId, productName, containerType, fromLocationId });
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDrop = useCallback(
    (toLocationId: string) => {
      if (!draggedItem) return;

      // Find source and destination locations
      const fromLocation = locations.find((l) => l.id === draggedItem.fromLocationId);
      const toLocation = locations.find((l) => l.id === toLocationId);
      
      if (!fromLocation || !toLocation) return;

      // Find the container being moved
      const container = fromLocation.products
        .find(
          (p) =>
            p.productName === draggedItem.productName &&
            p.containerType === draggedItem.containerType
        )
        ?.containers.find((c) => c.id === draggedItem.containerId);

      if (!container) return;

      // Validate the move
      const validation = validateContainerMove(
        {
          id: container.id,
          product: container.productName,
          type: container.type,
          status: container.status,
          batchId: container.batchId,
        },
        {
          id: fromLocation.id,
          name: fromLocation.name,
          type: fromLocation.type,
          capacity: fromLocation.capacity,
          containers: fromLocation.products.flatMap((p) => p.containers),
        },
        {
          id: toLocation.id,
          name: toLocation.name,
          type: toLocation.type,
          capacity: toLocation.capacity,
          containers: toLocation.products.flatMap((p) => p.containers),
        }
      );

      // Show validation errors
      if (!validation.valid) {
        alert(formatValidationMessage(validation));
        setDraggedItem(null);
        return;
      }

      // Show validation warnings (but allow the move)
      if (validation.warnings.length > 0) {
        const proceed = confirm(
          formatValidationMessage(validation) + '\n\nProceed anyway?'
        );
        if (!proceed) {
          setDraggedItem(null);
          return;
        }
      }

      // Update locations state
      setLocations((prevLocations) => {
        const newLocations = prevLocations.map((loc) => {
          // Remove from source location
          if (loc.id === draggedItem.fromLocationId) {
            return {
              ...loc,
              products: loc.products.map((prod) => {
                if (
                  prod.productName === draggedItem.productName &&
                  prod.containerType === draggedItem.containerType
                ) {
                  return {
                    ...prod,
                    quantity: prod.quantity - 1,
                    containers: prod.containers.filter(
                      (c) => c.id !== draggedItem.containerId
                    ),
                  };
                }
                return prod;
              }).filter((prod) => prod.quantity > 0),
            };
          }

          // Add to destination location
          if (loc.id === toLocationId) {
            const container = locations
              .find((l) => l.id === draggedItem.fromLocationId)
              ?.products.find(
                (p) =>
                  p.productName === draggedItem.productName &&
                  p.containerType === draggedItem.containerType
              )
              ?.containers.find((c) => c.id === draggedItem.containerId);

            if (!container) return loc;

            const existingProduct = loc.products.find(
              (p) =>
                p.productName === draggedItem.productName &&
                p.containerType === draggedItem.containerType
            );

            if (existingProduct) {
              return {
                ...loc,
                products: loc.products.map((prod) =>
                  prod.productName === draggedItem.productName &&
                  prod.containerType === draggedItem.containerType
                    ? {
                        ...prod,
                        quantity: prod.quantity + 1,
                        containers: [...prod.containers, container],
                      }
                    : prod
                ),
              };
            } else {
              return {
                ...loc,
                products: [
                  ...loc.products,
                  {
                    productId: container.productId,
                    productName: container.productName,
                    containerType: container.type,
                    quantity: 1,
                    containers: [container],
                  },
                ],
              };
            }
          }

          return loc;
        });

        return newLocations;
      });

      setDraggedItem(null);
      
      // Notify user of successful move
      if (draggedItem.type === 'container') {
        const container = locations
          .flatMap(l => l.containers)
          .find(c => c.id === draggedItem.id);
        const toLocation = locations.find(l => l.id === toLocationId);
        if (container && toLocation) {
          addNotification({
            title: 'Container Moved',
            description: `${container.productName} moved to ${toLocation.name}`,
            time: 'Just now',
            type: 'inventory',
            icon: 'package',
          });
        }
      }
    },
    [draggedItem, locations, addNotification]
  );

  const handleAddContainer = () => {
    if (!newContainer.locationId) return;

    const containers: Container[] = [];
    for (let i = 0; i < newContainer.quantity; i++) {
      containers.push({
        id: `${newContainer.type.toUpperCase()}-${Date.now()}-${i}`,
        productId: `PROD-${Date.now()}`,
        productName: newContainer.productName,
        batchId: newContainer.batchId,
        type: newContainer.type,
        status: 'available',
        locationId: newContainer.locationId,
      });
    }

    // Update location with new containers
    setLocations(
      locations.map((loc) => {
        if (loc.id === newContainer.locationId) {
          const existingProduct = loc.products.find(
            (p) =>
              p.productName === newContainer.productName &&
              p.containerType === newContainer.type
          );

          if (existingProduct) {
            return {
              ...loc,
              products: loc.products.map((p) =>
                p.productName === newContainer.productName &&
                p.containerType === newContainer.type
                  ? {
                      ...p,
                      quantity: p.quantity + newContainer.quantity,
                      containers: [...p.containers, ...containers],
                    }
                  : p
              ),
            };
          } else {
            return {
              ...loc,
              products: [
                ...loc.products,
                {
                  productId: `PROD-${Date.now()}`,
                  productName: newContainer.productName,
                  containerType: newContainer.type,
                  quantity: newContainer.quantity,
                  containers,
                },
              ],
            };
          }
        }
        return loc;
      })
    );

    setShowAddContainer(false);
    setNewContainer({
      productName: '',
      type: 'keg',
      quantity: 1,
      locationId: '',
      batchId: 'B-001',
    });
  };

  const handleCreatePallet = (palletData: {
    name: string;
    location: string;
    destination?: string;
    scheduledDelivery?: string;
    notes?: string;
  }) => {
    const newPallet = {
      id: `PALLET-${Date.now()}`,
      ...palletData,
      containers: [],
      createdAt: new Date().toISOString(),
    };
    setPallets([...pallets, newPallet]);
    
    // Notify user of pallet creation
    addNotification({
      title: 'Pallet Created',
      description: `${palletData.name} ${palletData.destination ? `scheduled for delivery to ${palletData.destination}` : 'created successfully'}`,
      time: 'Just now',
      type: 'production',
      icon: 'package',
    });
  };

  // Print handlers
  const handlePrintContainerLabel = (container: Container) => {
    const html = generateContainerLabel(container, {
      includeQRCode: true,
      includeBatchInfo: true,
    });
    printHTML(html, `Label-${container.id}`);
  };

  const handlePrintBatchLabels = (containers: Container[]) => {
    const html = generateBatchLabels(containers, {
      includeQRCode: true,
      includeBatchInfo: true,
    });
    printHTML(html, `Batch-Labels-${containers.length}`);
  };

  const handlePrintPalletManifest = (pallet: typeof pallets[0]) => {
    const location = locations.find(l => l.id === pallet.location);
    const destination = pallet.destination
      ? locations.find(l => l.id === pallet.destination)
      : undefined;

    const html = generatePalletManifest(
      {
        id: pallet.id,
        locationId: pallet.location,
        destinationId: pallet.destination,
        scheduledDelivery: pallet.scheduledDelivery,
        notes: pallet.notes,
        containers: pallet.containers,
      },
      location?.name || 'Unknown',
      destination?.name,
      { includeQRCode: true }
    );
    printHTML(html, `Manifest-${pallet.id}`);
  };

  const handlePrintLocationLabels = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    const containers = location.containers;
    if (containers.length === 0) {
      alert('No containers to print');
      return;
    }

    handlePrintBatchLabels(containers);
  }

  const getLocationIcon = (type: Location['type']) => {
    switch (type) {
      case 'warehouse':
        return <Warehouse className="h-5 w-5" />;
      case 'truck':
        return <Truck className="h-5 w-5" />;
      case 'customer':
        return <MapPin className="h-5 w-5" />;
      case 'production':
        return <Boxes className="h-5 w-5" />;
      case 'cleaning':
        return <Droplet className="h-5 w-5" />;
    }
  };

  const getContainerIcon = (type: Container['type']) => {
    switch (type) {
      case 'keg':
        return <Beer className="h-4 w-4" />;
      case 'case':
        return <Package className="h-4 w-4" />;
      case 'bottle':
        return <Wine className="h-4 w-4" />;
      case 'can':
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading canvas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Alert Bar */}
      {alerts.length > 0 && (
        <div className="border-b bg-destructive/10 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">
              {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {alerts.slice(0, 3).map((alert) => (
                <Badge key={alert.id} variant="destructive">
                  {alert.message}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Logistics Canvas</h2>
            <Badge variant="secondary">{locations.length} Locations</Badge>
            {alerts.length > 0 && (
              <Badge 
                variant="destructive" 
                className="gap-1 cursor-pointer hover:bg-red-700"
                onClick={() => setShowAlerts(true)}
              >
                <Bell className="h-3 w-3" />
                {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                  <DialogDescription>
                    Create a new location for tracking containers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input
                      id="location-name"
                      placeholder="e.g., Warehouse A, Truck #3"
                      value={newLocation.name}
                      onChange={(e) =>
                        setNewLocation({ ...newLocation, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-type">Location Type</Label>
                    <Select
                      value={newLocation.type}
                      onValueChange={(value: Location['type']) =>
                        setNewLocation({ ...newLocation, type: value })
                      }
                    >
                      <SelectTrigger id="location-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddLocation(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddLocation}
                    disabled={!newLocation.name}
                  >
                    Add Location
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddContainer} onOpenChange={setShowAddContainer}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Containers
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Containers</DialogTitle>
                  <DialogDescription>
                    Add kegs, cases, bottles, or cans to a location
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      placeholder="e.g., Hopped Cider, Dry Cider"
                      value={newContainer.productName}
                      onChange={(e) =>
                        setNewContainer({
                          ...newContainer,
                          productName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="container-type">Container Type</Label>
                    <Select
                      value={newContainer.type}
                      onValueChange={(value: Container['type']) =>
                        setNewContainer({ ...newContainer, type: value })
                      }
                    >
                      <SelectTrigger id="container-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keg">Keg</SelectItem>
                        <SelectItem value="case">Case</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="can">Can (6-pack)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newContainer.quantity}
                      onChange={(e) =>
                        setNewContainer({
                          ...newContainer,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={newContainer.locationId}
                      onValueChange={(value) =>
                        setNewContainer({ ...newContainer, locationId: value })
                      }
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} ({loc.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch ID</Label>
                    <Input
                      id="batch"
                      placeholder="e.g., B-001"
                      value={newContainer.batchId}
                      onChange={(e) =>
                        setNewContainer({
                          ...newContainer,
                          batchId: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddContainer(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddContainer}
                    disabled={
                      !newContainer.productName || !newContainer.locationId
                    }
                  >
                    Add Containers
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <CreatePalletDialog
              onCreatePallet={handleCreatePallet}
              locations={locations}
            />
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Locations Grid */}
        <ScrollArea className="flex-1 p-6">
          {locations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Locations</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a location to start tracking containers
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowAddLocation(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className="p-4 transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-2', 'ring-primary');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-primary');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-primary');
                    handleDrop(location.id);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getLocationIcon(location.type)}
                      <div>
                        <h3 className="font-semibold">{location.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {location.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {location.products.reduce(
                          (sum, p) => sum + p.quantity,
                          0
                        )}{' '}
                        items
                      </Badge>
                      {location.type === 'cleaning' && cleaningQueue.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Droplet className="h-3 w-3" />
                          {cleaningQueue.filter(item => item.status === 'queued').length} queued
                        </Badge>
                      )}
                      {location.type === 'truck' && location.products.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            alert(`Loading truck ${location.name} with ${location.products.reduce((sum, p) => sum + p.quantity, 0)} containers. Delivery workflow would start here.`);
                          }}
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Load
                        </Button>
                      )}
                    </div>
                  </div>

                  {location.products.length === 0 ? (
                    <div className="py-8 text-center">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No containers
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {location.products.map((product) => (
                        <button
                          key={`${product.productId}-${product.containerType}`}
                          onClick={() =>
                            setSelectedItem({ type: 'product', data: product })
                          }
                          className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getContainerIcon(product.containerType)}
                              <div>
                                <p className="font-medium text-sm">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {product.containerType}
                                </p>
                              </div>
                            </div>
                            <Badge>{product.quantity}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Detail Panel */}
        {selectedItem && (
          <div className="w-96 border-l bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                ×
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {selectedItem.type === 'product' && (
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold">
                      {selectedItem.data.productName}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintBatchLabels(selectedItem.data.containers)}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Container Type
                      </Label>
                      <p className="capitalize">
                        {selectedItem.data.containerType}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Total Quantity
                      </Label>
                      <p>{selectedItem.data.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Containers
                      </Label>
                      <div className="mt-2 space-y-2">
                        {selectedItem.data.containers.map(
                          (container: Container) => (
                            <div
                              key={container.id}
                              className="w-full rounded border p-3 text-left text-sm hover:bg-accent"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div
                                  draggable
                                  onDragStart={() => {
                                    const location = locations.find((loc) =>
                                      loc.products.some((p) =>
                                        p.containers.some((c) => c.id === container.id)
                                      )
                                    );
                                    if (location) {
                                      handleDragStart(
                                        container.id,
                                        container.productName,
                                        container.type,
                                        location.id
                                      );
                                    }
                                  }}
                                  onDragEnd={handleDragEnd}
                                  onClick={() =>
                                    setSelectedItem({
                                      type: 'container',
                                      data: container,
                                    })
                                  }
                                  className="flex flex-1 cursor-move items-center gap-2"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-medium">
                                        {container.id}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {container.status}
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Batch: {container.batchId}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePrintContainerLabel(container)}
                                    title="Print Label"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <QRCodeDisplay
                                    type="container"
                                    id={container.id}
                                    label={`${container.productName} - ${container.type}`}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Alerts Panel */}
      <Sheet open={showAlerts} onOpenChange={setShowAlerts}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              System Alerts
            </SheetTitle>
            <SheetDescription>
              {alerts.length} active alert{alerts.length > 1 ? 's' : ''} requiring attention
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge className={getAlertColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        {alert.productName && (
                          <Badge variant="outline" className="text-xs">
                            {alert.productName}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
