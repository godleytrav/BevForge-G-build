import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Printer,
  Package,
  Truck as TruckIcon,
  Home,
  Factory,
  RotateCcw,
  Shield,
  Plus,
  QrCode,
  Beer,
  Wine,
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiGet, apiPatch } from '@/lib/api';
import { ContainerDetailModal } from '@/components/canvas/ContainerDetailModal';
import {
  type Container,
  type Truck,
  type Location,
  createContainer,
  createCase as createCaseContainer,
  createPallet as createPalletContainer,
  createTruck,
  createLocation,
  loadContainerOnTruck,
  startTruckRoute,
  updateContainerStatus,
  getTruckCapacityPercentage,
} from '@/lib/container-tracking';

// Delivery route interfaces
interface DeliveryStop {
  id: string;
  customerId: string;
  customerName: string;
  orderIds: string[];
  containerIds: string[];
  status: 'pending' | 'completed';
  completedAt?: Date;
}

interface DeliveryRoute {
  id: string;
  truckId: string;
  stops: DeliveryStop[];
  currentStopIndex: number;
  status: 'planning' | 'in-progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

// Packing workspace interfaces
interface PackingItem {
  id: string;
  type: 'bottle' | 'six-pack' | 'keg';
  product: string;
  batchId: string;
  orderId: string;
  customerId: string;
  weight: number;
}

interface Case {
  id: string;
  items: PackingItem[];
  type: 'bottle-case' | 'six-pack-case';
  product: string;
  weight: number;
  createdAt: Date;
}

interface OrderItem {
  type: 'Keg' | 'Case';
  product: string;
  quantity: number;
}

interface Order {
  id: string;
  customer: string;
  customerId: string;
  items: OrderItem[];
  status: 'pending' | 'approved' | 'loaded' | 'in-delivery' | 'delivered';
  totalValue?: number;
  createdAt?: string;
}

interface ApiLineItem {
  container_type?: string;
  product_name?: string;
  quantity?: number;
}

interface ApiOrder {
  id: string;
  customer_id?: string;
  customer_name?: string;
  lineItems?: ApiLineItem[];
}

const isPackingItem = (item: PackingItem | Case): item is PackingItem =>
  'orderId' in item;

const toOrderItems = (lineItems: ApiLineItem[]): OrderItem[] =>
  lineItems.map((item) => ({
    type: item.container_type?.toLowerCase().includes('keg') ? 'Keg' : 'Case',
    product: item.product_name ?? 'Unknown Product',
    quantity: Number(item.quantity ?? 0),
  }));

const buildContainersFromOrder = (order: Order): Container[] => {
  const built: Container[] = [];
  let containerIndex = 0;

  order.items.forEach((item) => {
    const containerType: Container['type'] = item.type === 'Keg' ? 'keg' : 'case';
    for (let i = 0; i < item.quantity; i++) {
      built.push(
        createContainer(containerType, item.product, `BATCH-${order.id}-${containerIndex++}`, {
          orderId: order.id,
          customerId: order.customerId,
          status: order.status === 'approved' ? 'staging' : 'production',
          location: order.status === 'approved' ? 'Staging Area' : 'Production',
          weight: containerType === 'keg' ? 160 : 30,
          volume: containerType === 'keg' ? '15.5 gal' : '2.25 gal',
          quantity: containerType === 'case' ? 1 : undefined,
        })
      );
    }
  });

  return built;
};

const buildPackingItemsFromOrder = (order: Order): PackingItem[] => {
  const items: PackingItem[] = [];
  let packingIndex = 0;

  order.items.forEach((item) => {
    if (item.type === 'Keg') {
      for (let i = 0; i < item.quantity; i++) {
        items.push({
          id: `pack-${order.id}-${packingIndex++}`,
          type: 'keg',
          product: item.product,
          batchId: `BATCH-${order.id}-${packingIndex}`,
          orderId: order.id,
          customerId: order.customerId,
          weight: 160,
        });
      }
      return;
    }

    // Cases break into two six-packs in the virtual packing workspace.
    for (let i = 0; i < item.quantity * 2; i++) {
      items.push({
        id: `pack-${order.id}-${packingIndex++}`,
        type: 'six-pack',
        product: item.product,
        batchId: `BATCH-${order.id}-${packingIndex}`,
        orderId: order.id,
        customerId: order.customerId,
        weight: 15,
      });
    }
  });

  return items;
};

// Orders are now fetched from OPS API via /api/orders?status=approved

// Workflow stages
const stages = [
  { id: 'production', name: 'Production', icon: Factory, color: 'bg-blue-500' },
  { id: 'packaging', name: 'Packaging', icon: Package, color: 'bg-green-500' },
  { id: 'packing', name: 'Packing', icon: Package, color: 'bg-teal-500' },
  { id: 'delivery', name: 'Delivery', icon: TruckIcon, color: 'bg-orange-500' },
  { id: 'tax', name: 'Tax Determination', icon: Shield, color: 'bg-purple-500' },
  { id: 'restaurant', name: 'Restaurant', icon: Home, color: 'bg-red-500' },
  { id: 'returns', name: 'Keg Returns', icon: RotateCcw, color: 'bg-gray-500' },
];

export default function CanvasLogistics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>('delivery');
  const [containers, setContainers] = useState<Container[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([
    createTruck('TRUCK-1', 'Route A', 10000),
  ]);
  const [locations, setLocations] = useState<Location[]>([
    createLocation("Joe's Bar", 'restaurant', '123 Main St'),
    createLocation('Main St Pub', 'restaurant', '456 Oak Ave'),
    createLocation('Downtown Pub', 'restaurant', '789 Elm St'),
  ]);
  const [deliveryRoutes, setDeliveryRoutes] = useState<DeliveryRoute[]>([]);
  const [draggedStopIndex, setDraggedStopIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Packing workspace state
  const [availableItems, setAvailableItems] = useState<PackingItem[]>([]);
  const [caseBuilder, setCaseBuilder] = useState<PackingItem[]>([]);
  const [draggedPackingItem, setDraggedPackingItem] = useState<PackingItem | Case | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
    container?: Container;
    truck?: Truck;
    location?: Location;
  } | null>(null);
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customer: '',
    product: '',
    containerType: 'keg' as 'keg' | 'case' | 'bottle',
    quantity: 1,
  });
  const [selectionMode, setSelectionMode] = useState<'case' | 'pallet' | null>(null);
  const { addNotification: pushGlobalNotification } = useNotifications();

  const addNotification = ({
    title,
    message,
    description,
    type = 'system',
  }: {
    title: string;
    message?: string;
    description?: string;
    type?: 'success' | 'error' | 'info' | 'production' | 'sales' | 'compliance' | 'inventory' | 'system';
  }) => {
    const normalizedType =
      type === 'success'
        ? 'production'
        : type === 'error'
          ? 'system'
          : type === 'info'
            ? 'system'
            : type;

    pushGlobalNotification({
      title,
      description: description ?? message ?? '',
      time: 'Just now',
      type: normalizedType,
      icon: type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'bell',
    });
  };

  // Fetch approved orders from OPS
  useEffect(() => {
    fetchApprovedOrders();
  }, []);

  const fetchApprovedOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await apiGet<ApiOrder[]>('/api/orders?status=approved');

      const transformedOrders: Order[] = data.map((order) => ({
        id: order.id,
        customer: order.customer_name ?? 'Unknown Customer',
        customerId: order.customer_id ?? 'unknown-customer',
        items: toOrderItems(order.lineItems ?? []),
        status: 'approved' as const,
      }));

      setOrders(transformedOrders);
      setContainers(transformedOrders.flatMap(buildContainersFromOrder));
      setAvailableItems(transformedOrders.flatMap(buildPackingItemsFromOrder));
    } catch (error) {
      console.error('Failed to fetch approved orders:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load approved orders',
        type: 'error',
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiPatch(`/api/orders/${orderId}`, { status });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleApprove = (orderId: string) => {
    let approvedOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        approvedOrder = { ...order, status: 'approved' };
        return approvedOrder;
      })
    );

    setContainers((prev) =>
      prev.map((container) =>
        container.orderId === orderId
          ? updateContainerStatus(
              container,
              'staging',
              'Staging Area',
              'Order approved for truck loading'
            )
          : container
      )
    );

    if (!approvedOrder) return;

    const packingItems = buildPackingItemsFromOrder(approvedOrder);
    setAvailableItems((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const nextItems = packingItems.filter((item) => !existingIds.has(item.id));
      return [...prev, ...nextItems];
    });

    void updateOrderStatus(orderId, 'approved');
    addNotification({
      title: 'Order Approved',
      message: `${approvedOrder.customer} is ready for loading`,
      type: 'success',
    });
  };

  const handleLoadToTruck = (order: Order) => {
    if (order.status !== 'approved') {
      addNotification({
        title: 'Cannot Load',
        message: 'Order must be approved before loading',
        type: 'error',
      });
      return;
    }
    
    const truck = trucks[0];
    
    // Load containers onto truck
    let updatedTruck = truck;
    const updatedContainers = containers.map((container) => {
      if (container.orderId === order.id) {
        updatedTruck = loadContainerOnTruck(updatedTruck, container);
        return updateContainerStatus(container, 'loaded', 'Truck', `Loaded on ${truck.name}`);
      }
      return container;
    });
    
    setTrucks([updatedTruck]);
    setContainers(updatedContainers);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'loaded' as const } : o))
    );
    
    // Update order status in OPS
    updateOrderStatus(order.id, 'loaded');
    
    addNotification({
      title: 'Loaded to Truck',
      message: `${order.customer} order loaded to ${truck.name}`,
      type: 'success',
    });
    
    // Update route plan after loading (pass updated truck to avoid stale state)
    updateRoutePlan(updatedTruck.id, updatedTruck);
  };
  
  // Update route plan based on loaded containers
  const updateRoutePlan = (truckId: string, updatedTruck?: typeof trucks[0]) => {
    const truck = updatedTruck || trucks.find((t) => t.id === truckId);
    if (!truck || truck.containers.length === 0) {
      // Remove route if truck is empty
      setDeliveryRoutes((prev) => prev.filter((r) => r.truckId !== truckId));
      return;
    }
    
    // Group containers by customer
    const containersByCustomer = new Map<string, typeof containers>();
    truck.containers.forEach((containerId) => {
      const container = containers.find((c) => c.id === containerId);
      if (container && container.customerId) {
        const existing = containersByCustomer.get(container.customerId) || [];
        containersByCustomer.set(container.customerId, [...existing, container]);
      }
    });
    
    // Create stops for each customer
    const stops: DeliveryStop[] = Array.from(containersByCustomer.entries()).map(
      ([customerId, customerContainers]) => {
        const firstContainer = customerContainers[0];
        const orderIds = [...new Set(customerContainers.map((c) => c.orderId).filter(Boolean))];
        
        // Find the order to get the actual customer name
        const order = orders.find((o) => o.id === firstContainer.orderId);
        const customerName = order?.customer || customerId;
        
        return {
          id: `stop-${truckId}-${customerId}-${Date.now()}`,
          customerId,
          customerName, // Use actual customer name from order
          orderIds: orderIds as string[],
          containerIds: customerContainers.map((c) => c.id),
          status: 'pending',
        };
      }
    );
    console.log('🛑 Created stops:', stops.length, stops.map(s => ({ id: s.id, customer: s.customerName, containers: s.containerIds.length })));
    
    // Check if route already exists
    const existingRoute = deliveryRoutes.find((r) => r.truckId === truckId);
    console.log('🔍 Existing route:', existingRoute ? `Found with ${existingRoute.stops.length} stops` : 'Not found');
    
    if (existingRoute) {
      // Build a map of existing stops by customerId
      const existingStopsMap = new Map(existingRoute.stops.map(s => [s.customerId, s]));
      
      // Merge: preserve existing stops, add new ones
      const mergedStops: DeliveryStop[] = [];
      
      // First, add all existing stops (in their current order)
      existingRoute.stops.forEach((existingStop) => {
        const newStop = stops.find(s => s.customerId === existingStop.customerId);
        if (newStop) {
          // Update existing stop with new container data
          mergedStops.push({
            ...existingStop,
            containerIds: newStop.containerIds,
            orderIds: newStop.orderIds,
            customerName: newStop.customerName, // Update name in case it changed
          });
        } else {
          // Keep existing stop even if no containers (might be completed)
          mergedStops.push(existingStop);
        }
      });
      
      // Then, add any new stops that weren't in the existing route
      stops.forEach((newStop) => {
        if (!existingStopsMap.has(newStop.customerId)) {
          mergedStops.push(newStop);
        }
      });
      
      console.log('✅ Merged stops:', mergedStops.length, mergedStops.map(s => s.customerName));
      
      setDeliveryRoutes((prev) =>
        prev.map((route) =>
          route.truckId === truckId
            ? { ...route, stops: mergedStops }
            : route
        )
      );
    } else {
      // Create new route
      const newRoute: DeliveryRoute = {
        id: `route-${truckId}-${Date.now()}`,
        truckId,
        stops,
        currentStopIndex: 0,
        status: 'planning',
      };
      console.log('✨ Created new route with', stops.length, 'stops');
      
      setDeliveryRoutes((prev) => [...prev, newRoute]);
    }
  };

  const handleStartRoute = () => {
    const truck = trucks[0];
    const route = deliveryRoutes.find((r) => r.truckId === truck.id && r.status === 'planning');
    
    if (!route) {
      addNotification({
        title: 'Cannot Start Route',
        message: 'No route planned for this truck',
        type: 'error',
      });
      return;
    }
    
    if (route.stops.length === 0) {
      addNotification({
        title: 'Cannot Start Route',
        message: 'Route has no stops',
        type: 'error',
      });
      return;
    }
    
    // Update route status to in-progress
    setDeliveryRoutes((prev) =>
      prev.map((r) =>
        r.id === route.id
          ? { ...r, status: 'in-progress' as const, startedAt: new Date() }
          : r
      )
    );
    
    // Update truck status
    const updatedTruck = startTruckRoute(truck);
    setTrucks([updatedTruck]);
    
    // Update container statuses
    setContainers((prev) =>
      prev.map((container) =>
        truck.containers.includes(container.id)
          ? updateContainerStatus(container, 'in-transit', 'On Road', 'Truck departed')
          : container
      )
    );
    
    // Update order status to in-delivery for all orders on this route
    const orderIds = new Set<string>();
    route.stops.forEach(stop => {
      stop.orderIds.forEach(orderId => orderIds.add(orderId));
    });
    orderIds.forEach(orderId => {
      updateOrderStatus(orderId, 'in-delivery');
    });
    
    addNotification({
      title: 'Route Started',
      message: `Started route with ${route.stops.length} stop${route.stops.length > 1 ? 's' : ''}. Tax determination triggered (TTB requirement)`,
      type: 'success',
    });
  };

  const handleContainerClick = (container: Container) => {
    setSelectedDetail({ container });
  };

  const handleTruckClick = (truck: Truck) => {
    setSelectedDetail({ truck });
  };

  const handleLocationClick = (location: Location) => {
    setSelectedDetail({ location });
  };

  // Automation functions
  const toggleContainerSelection = (containerId: string) => {
    setSelectedContainers((prev) =>
      prev.includes(containerId)
        ? prev.filter((id) => id !== containerId)
        : [...prev, containerId]
    );
  };

  const handleCreateCase = () => {
    if (selectedContainers.length < 12) {
      addNotification({
        title: 'Cannot Create Case',
        message: 'Select at least 12 bottles to create a case',
        type: 'error',
      });
      return;
    }

    const selectedItems = containers.filter((c) => selectedContainers.includes(c.id));
    if (selectedItems.length === 0) return;

    const builtCase = createCaseContainer(
      selectedItems,
      selectedItems[0].productName,
      selectedItems[0].batchNumber
    );
    const newCase = updateContainerStatus(
      {
        ...builtCase,
        orderId: selectedItems[0].orderId,
        customerId: selectedItems[0].customerId,
        location: 'Staging Area',
      },
      'staging',
      'Staging Area',
      'Case assembled in OPS packing workspace'
    );

    // Set parent-child relationships
    const updatedContainers = containers.map((c) =>
      selectedContainers.includes(c.id) ? { ...c, parentId: newCase.id } : c
    );

    setContainers([...updatedContainers, newCase]);
    setSelectedContainers([]);
    setSelectionMode(null);

    addNotification({
      title: 'Case Created',
      message: `Created ${newCase.id} with ${selectedContainers.length} bottles`,
      type: 'success',
    });
  };

  const handleCreatePallet = () => {
    if (selectedContainers.length === 0) {
      addNotification({
        title: 'Cannot Create Pallet',
        message: 'Select containers to add to pallet',
        type: 'error',
      });
      return;
    }

    const selectedItems = containers.filter((c) => selectedContainers.includes(c.id));
    if (selectedItems.length === 0) return;
    const totalWeight = selectedItems.reduce((sum, c) => sum + (c.weight ?? 0), 0);

    const builtPallet = createPalletContainer(
      selectedItems,
      `Assembled from ${selectedItems.length} container(s) in staging`
    );
    const uniqueOrderIds = [...new Set(selectedItems.map((item) => item.orderId).filter(Boolean))];
    const uniqueCustomerIds = [...new Set(selectedItems.map((item) => item.customerId).filter(Boolean))];
    const newPallet = updateContainerStatus(
      {
        ...builtPallet,
        orderId: uniqueOrderIds.length === 1 ? uniqueOrderIds[0] : undefined,
        customerId: uniqueCustomerIds.length === 1 ? uniqueCustomerIds[0] : undefined,
        location: 'Staging Area',
      },
      'staging',
      'Staging Area',
      'Pallet assembled in OPS staging'
    );

    // Set parent-child relationships
    const updatedContainers = containers.map((c) =>
      selectedContainers.includes(c.id) ? { ...c, parentId: newPallet.id } : c
    );

    setContainers([...updatedContainers, newPallet]);
    setSelectedContainers([]);
    setSelectionMode(null);

    addNotification({
      title: 'Pallet Created',
      message: `Created ${newPallet.id} with ${selectedContainers.length} containers (${totalWeight.toFixed(0)} lbs)`,
      type: 'success',
    });
  };

  const handleCreateOrder = () => {
    if (!newOrderForm.customer || !newOrderForm.product) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select customer and product',
      });
      return;
    }

    // Create new order first to get the order ID
    const orderId = `ORD-${String(orders.length + 1).padStart(4, '0')}`;
    const customerId = newOrderForm.customer.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const containerType: Container['type'] =
      newOrderForm.containerType === 'bottle' ? 'bottle' : newOrderForm.containerType;

    // Generate containers for the order
    const newContainers: Container[] = Array.from({ length: newOrderForm.quantity }, (_, index) =>
      createContainer(containerType, newOrderForm.product, `BATCH-${orderId}-${index + 1}`, {
        status: 'production',
        location: 'Production',
        weight: containerType === 'keg' ? 160 : containerType === 'case' ? 30 : 2,
        volume: containerType === 'keg' ? '15.5 gal' : containerType === 'case' ? '2.25 gal' : '0.75 L',
        orderId,
        customerId,
      })
    );

    // Create new order
    const newOrder: Order = {
      id: orderId,
      customer: newOrderForm.customer,
      customerId: customerId,
      status: 'pending',
      items: [
        {
          type: containerType === 'keg' ? 'Keg' : 'Case',
          product: newOrderForm.product,
          quantity: newOrderForm.quantity,
        },
      ],
      totalValue: newOrderForm.quantity * 100,
      createdAt: new Date().toISOString(),
    };

    setOrders([...orders, newOrder]);
    setContainers([...containers, ...newContainers]);
    setShowCreateOrderDialog(false);
    setNewOrderForm({
      customer: '',
      product: '',
      containerType: 'keg',
      quantity: 1,
    });

    addNotification({
      type: 'success',
      title: 'Order Created',
      message: `Order ${newOrder.id} created with ${newOrderForm.quantity} ${newOrderForm.containerType}(s)`,
    });
  };

  const handleCompleteStop = (truckId: string) => {
    const truck = trucks.find((t) => t.id === truckId);
    const route = deliveryRoutes.find((r) => r.truckId === truckId && r.status === 'in-progress');
    
    if (!truck || truck.status !== 'on-road') {
      addNotification({
        type: 'error',
        title: 'Cannot Complete Stop',
        message: 'Truck not found or not on road',
      });
      return;
    }
    
    if (!route) {
      addNotification({
        type: 'error',
        title: 'Cannot Complete Stop',
        message: 'No active delivery route found',
      });
      return;
    }
    
    const currentStop = route.stops[route.currentStopIndex];
    if (!currentStop) {
      addNotification({
        type: 'error',
        title: 'Cannot Complete Stop',
        message: 'No current stop found',
      });
      return;
    }
    
    // Move only this stop's containers to customer location
    const deliveredContainers = containers.map((c) =>
      currentStop.containerIds.includes(c.id)
        ? { ...c, location: currentStop.customerId, status: 'delivered' as const }
        : c
    );
    
    // Remove delivered containers from truck
    const remainingContainers = truck.containers.filter(
      (id) => !currentStop.containerIds.includes(id)
    );
    
    // Update order status for this stop's orders
    const updatedOrders = orders.map((o) =>
      currentStop.orderIds.includes(o.id)
        ? { ...o, status: 'delivered' as const }
        : o
    );
    
    // Update order status in OPS for delivered orders
    currentStop.orderIds.forEach(orderId => {
      updateOrderStatus(orderId, 'delivered');
    });
    
    // Create or update customer location
    const existingLocation = locations.find((l) => l.id === currentStop.customerId);
    if (!existingLocation) {
      const newLocation: Location = {
        id: currentStop.customerId,
        name: currentStop.customerName,
        type: 'restaurant',
        address: '123 Main St',
        containers: currentStop.containerIds,
        pendingReturns: [],
        deliveryHistory: [],
      };
      setLocations([...locations, newLocation]);
    } else {
      setLocations(
        locations.map((l) =>
          l.id === currentStop.customerId
            ? { ...l, containers: [...l.containers, ...currentStop.containerIds] }
            : l
        )
      );
    }
    
    // Mark current stop as completed
    const updatedStop = { ...currentStop, status: 'completed' as const, completedAt: new Date() };
    const isLastStop = route.currentStopIndex === route.stops.length - 1;
    
    // Update route
    const updatedRoute: DeliveryRoute = {
      ...route,
      stops: route.stops.map((s, i) => (i === route.currentStopIndex ? updatedStop : s)),
      currentStopIndex: isLastStop ? route.currentStopIndex : route.currentStopIndex + 1,
      status: isLastStop ? 'completed' : 'in-progress',
      completedAt: isLastStop ? new Date() : undefined,
    };
    
    setDeliveryRoutes(
      deliveryRoutes.map((r) => (r.id === route.id ? updatedRoute : r))
    );
    
    // Update truck
    const updatedTruck = {
      ...truck,
      containers: remainingContainers,
      status: isLastStop ? ('idle' as const) : ('on-road' as const),
    };
    
    setContainers(deliveredContainers);
    setTrucks(trucks.map((t) => (t.id === truckId ? updatedTruck : t)));
    setOrders(updatedOrders);
    
    const nextStopMessage = isLastStop
      ? 'Route complete! Truck returning to brewery.'
      : `Next stop: ${route.stops[route.currentStopIndex + 1].customerName}`;
    
    addNotification({
      type: 'success',
      title: `Stop ${route.currentStopIndex + 1} of ${route.stops.length} Complete`,
      message: `${currentStop.containerIds.length} containers delivered to ${currentStop.customerName}. ${nextStopMessage}`,
    });
  };

  const handleReorderStops = (truckId: string, fromIndex: number, toIndex: number) => {
    console.log('🔄 handleReorderStops called:', { truckId, fromIndex, toIndex });
    const route = deliveryRoutes.find((r) => r.truckId === truckId);
    if (!route) {
      console.log('❌ Route not found for truck:', truckId);
      return;
    }
    console.log('📍 Route status:', route.status, 'Stops:', route.stops.map(s => s.customerName));

    // In planning mode, reorder all stops
    if (route.status === 'planning') {
      console.log('✅ Planning mode - reordering stops');
      const newStops = [...route.stops];
      const [movedStop] = newStops.splice(fromIndex, 1);
      newStops.splice(toIndex, 0, movedStop);
      console.log('📋 New order:', newStops.map(s => s.customerName));

      const updatedRoute = { ...route, stops: newStops };
      setDeliveryRoutes(deliveryRoutes.map((r) => (r.id === route.id ? updatedRoute : r)));

      addNotification({
        type: 'success',
        title: 'Stops Reordered',
        message: `Moved ${movedStop.customerName} to position ${toIndex + 1}`,
      });
      return;
    }

    // In progress mode, can't reorder the current stop (it's already in progress)
    const adjustedFromIndex = fromIndex + route.currentStopIndex + 1;
    const adjustedToIndex = toIndex + route.currentStopIndex + 1;

    if (adjustedFromIndex < route.currentStopIndex + 1 || adjustedToIndex < route.currentStopIndex + 1) {
      addNotification({
        type: 'error',
        title: 'Cannot Reorder',
        message: 'Cannot reorder current or completed stops',
      });
      return;
    }

    // Reorder the stops array
    const newStops = [...route.stops];
    const [movedStop] = newStops.splice(adjustedFromIndex, 1);
    newStops.splice(adjustedToIndex, 0, movedStop);

    // Update route
    const updatedRoute = { ...route, stops: newStops };
    setDeliveryRoutes(deliveryRoutes.map((r) => (r.id === route.id ? updatedRoute : r)));

    addNotification({
      type: 'success',
      title: 'Stops Reordered',
      message: `Moved ${movedStop.customerName} to position ${toIndex + 1}`,
    });
  };

  const handleMarkEmpty = (containerId: string) => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return;

    // Move container to returns
    const updatedContainer = { ...container, status: 'returned' as const, location: 'returns' };
    setContainers(containers.map((c) => (c.id === containerId ? updatedContainer : c)));

    // Remove from location
    setLocations(
      locations.map((l) => ({
        ...l,
        containers: l.containers.filter((id) => id !== containerId),
      }))
    );

    addNotification({
      type: 'info',
      title: 'Container Returned',
      message: `${containerId} marked as empty and moved to returns`,
    });
  };

  const handleProcessReturn = (containerId: string) => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return;

    // Move container back to production (ready for refill)
    const updatedContainer = {
      ...container,
      status: 'production' as const,
      location: 'Production',
      batchNumber: 'RETURN-READY',
    };
    setContainers(containers.map((c) => (c.id === containerId ? updatedContainer : c)));

    addNotification({
      type: 'success',
      title: 'Return Processed',
      message: `${containerId} cleaned and ready for refill`,
    });
  };

  const getStageInfo = () => {
    if (!selectedStage) return null;

    switch (selectedStage) {
      case 'production':
        return {
          title: 'Production',
          content: (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded">
                <h4 className="font-semibold mb-2">Active Batches</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>BATCH-2024-001 (IPA)</span>
                    <Badge variant="outline">Fermenting</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>BATCH-2024-002 (Lager)</span>
                    <Badge variant="outline">Conditioning</Badge>
                  </div>
                </div>
              </div>
            </div>
          ),
        };
      case 'packaging':
        return {
          title: 'Packaging',
          content: (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded">
                <h4 className="font-semibold mb-2">Today's Packaging</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Kegs Filled</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cases Packed</span>
                    <span className="font-semibold">48</span>
                  </div>
                </div>
              </div>
            </div>
          ),
        };
      case 'packing':
        return {
          title: 'Interactive Packing Workspace',
          content: (
            <div className="space-y-4">
              {/* Available Items Pool */}
              <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Available Items ({availableItems.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items available. Approve orders to generate packing items.</p>
                  ) : (
                    availableItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedPackingItem(item);
                          e.dataTransfer.effectAllowed = 'move';
                          console.log('🎯 Drag start:', item.type, item.product);
                        }}
                        onDragEnd={() => {
                          setDraggedPackingItem(null);
                          console.log('🏁 Drag end');
                        }}
                        className="bg-card border border-border p-3 rounded cursor-move hover:border-primary hover:shadow-md transition-all"
                      >
                        <div className="text-sm font-medium">
                          {item.type === 'keg' ? '🛢️' : item.type === 'six-pack' ? '📦' : '🍺'} {item.product}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.type} • {item.weight}lbs
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Case Builder */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded">
                <h4 className="font-semibold mb-3">Case Builder (2 items → 1 case)</h4>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedPackingItem && isPackingItem(draggedPackingItem) && draggedPackingItem.type !== 'keg') {
                      setCaseBuilder(prev => {
                        const newBuilder = [...prev, draggedPackingItem];
                        
                        // Remove from available items
                        setAvailableItems(current => current.filter(i => i.id !== draggedPackingItem.id));
                        
                        // If we have 2 items, create a case
                        if (newBuilder.length === 2) {
                          const newCase: Case = {
                            id: `case-${Date.now()}`,
                            items: newBuilder,
                            type: newBuilder[0].type === 'bottle' ? 'bottle-case' : 'six-pack-case',
                            product: newBuilder[0].product,
                            weight: newBuilder.reduce((sum, item) => sum + item.weight, 0),
                            createdAt: new Date(),
                          };
                          
                          console.log('📦 Created case:', newCase);
                          addNotification({
                            title: 'Case Created',
                            message: `Combined 2 ${newBuilder[0].type}s into a case`,
                            type: 'success',
                          });
                          
                          // Clear builder and add case to available items for pallet
                          setTimeout(() => {
                            setCaseBuilder([]);
                            // Add case back as draggable item (we'll handle this differently)
                          }, 500);
                          
                          return [];
                        }
                        
                        return newBuilder;
                      });
                    }
                    setDraggedPackingItem(null);
                  }}
                  className={`min-h-[120px] border-2 border-dashed rounded-lg flex items-center justify-center gap-4 transition-all ${
                    draggedPackingItem && isPackingItem(draggedPackingItem) && draggedPackingItem.type !== 'keg'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-border'
                  }`}
                >
                  {caseBuilder.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Drop 2 bottles or 2 six-packs here to create a case</p>
                  ) : (
                    <>
                      {caseBuilder.map((item) => (
                        <div key={item.id} className="bg-card border border-border p-2 rounded">
                          <div className="text-sm font-medium">
                            {item.type === 'six-pack' ? '📦' : '🍺'} {item.product}
                          </div>
                        </div>
                      ))}
                      {caseBuilder.length === 1 && (
                        <div className="text-sm text-muted-foreground">+ Drop 1 more to create case</div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Pallet Builder - Coming Soon */}
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded">
                <h4 className="font-semibold mb-3">Pallet Builder (3x3 Grid)</h4>
                <div className="text-sm text-muted-foreground">
                  🚧 Pallet grid coming in next step...
                </div>
              </div>
            </div>
          ),
        };
      case 'delivery':
        const truck = trucks[0];
        const capacity = getTruckCapacityPercentage(truck);
        console.log('Delivery stage - All routes:', deliveryRoutes);
        // Find either planning or in-progress route
        const activeRoute = deliveryRoutes.find((r) => r.truckId === truck.id && (r.status === 'planning' || r.status === 'in-progress'));
        console.log('Active route for truck:', activeRoute);
        const routeStatus = activeRoute?.status;
        const routeCurrentIndex = activeRoute?.currentStopIndex ?? 0;
        const currentStop = activeRoute && activeRoute.status === 'in-progress' ? activeRoute.stops[activeRoute.currentStopIndex] : null;
        const remainingStops = activeRoute ? (activeRoute.status === 'planning' ? activeRoute.stops : activeRoute.stops.slice(activeRoute.currentStopIndex + 1)) : [];
        
        return {
          title: 'Delivery',
          content: (
            <div className="space-y-3">
              <div 
                className="bg-orange-500/10 border border-orange-500/20 p-4 rounded cursor-pointer hover:bg-orange-500/20 transition-colors"
                onClick={() => handleTruckClick(truck)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{truck.name} - {truck.route}</h4>
                    <Badge variant="outline" className="mt-1">
                      {truck.status.toUpperCase().replace('-', ' ')}
                    </Badge>
                    {activeRoute && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {activeRoute.status === 'planning' 
                          ? `Planned Route: ${activeRoute.stops.length} stop${activeRoute.stops.length > 1 ? 's' : ''}`
                          : `Stop ${activeRoute.currentStopIndex + 1} of ${activeRoute.stops.length}`
                        }
                      </div>
                    )}
                  </div>
                  <TruckIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Capacity</span>
                    <span className="font-semibold">{capacity}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${capacity}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Loaded Items</span>
                    <span className="font-semibold">{truck.containers.length}</span>
                  </div>
                </div>
                
                {/* Current Stop Info */}
                {currentStop && (
                  <div className="mt-3 p-3 bg-background/50 rounded border border-border">
                    <div className="text-sm font-semibold mb-2">Current Stop:</div>
                    <div className="text-sm">
                      <div className="font-medium">{currentStop.customerName}</div>
                      <div className="text-muted-foreground">
                        {currentStop.containerIds.length} container{currentStop.containerIds.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Orders: {currentStop.orderIds.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Remaining/Planned Stops */}
                {remainingStops.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold mb-2 text-muted-foreground">
                      {routeStatus === 'planning' ? 'Planned Stops:' : 'Remaining Stops:'}
                    </div>
                    <div className="space-y-2">
                      {remainingStops.map((stop, displayIndex) => {
                        // Calculate actual index in the full route
                        const actualIndex = routeStatus === 'planning' 
                          ? displayIndex 
                          : routeCurrentIndex + 1 + displayIndex;
                        
                        return (
                        <div key={stop.id}>
                          {/* Drop zone above */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDragOverIndex(actualIndex);
                            }}
                            onDragLeave={() => {
                              setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverIndex(null);
                              if (draggedStopIndex !== null && draggedStopIndex !== actualIndex) {
                                console.log('🔄 Drop: moving stop from', draggedStopIndex, 'to', actualIndex);
                                handleReorderStops(truck.id, draggedStopIndex, actualIndex);
                              }
                            }}
                            className={`rounded transition-all duration-200 ease-in-out ${
                              dragOverIndex === actualIndex 
                                ? 'h-20 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center my-2' 
                                : 'h-2'
                            }`}
                          >
                            {dragOverIndex === actualIndex && (
                              <div className="text-sm font-semibold text-primary flex items-center gap-2 animate-pulse">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                Drop Here to Reorder
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Draggable stop tile */}
                          <div
                            draggable
                            onDragStart={(e) => {
                              console.log('🎯 Drag start: stop', actualIndex, stop.customerName);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedStopIndex(actualIndex);
                            }}
                            onDragEnd={() => {
                              console.log('🏁 Drag end: resetting state');
                              setDraggedStopIndex(null);
                            }}
                            className={`text-xs bg-card border border-border rounded-md p-2 flex items-center gap-2 cursor-move hover:border-primary transition-all duration-200 ${
                              draggedStopIndex === actualIndex ? 'opacity-40 scale-95 shadow-lg' : 'hover:shadow-md'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                              {actualIndex + 1}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{stop.customerName}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {stop.containerIds.length} container{stop.containerIds.length > 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="text-muted-foreground">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )})}
                      
                      {/* Drop zone at bottom */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverIndex(remainingStops.length);
                        }}
                        onDragLeave={() => {
                          setDragOverIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverIndex(null);
                          if (draggedStopIndex !== null) {
                            const lastIndex = routeStatus === 'planning' 
                              ? remainingStops.length - 1 
                              : routeCurrentIndex + remainingStops.length;
                            console.log('🔄 Drop at bottom: moving stop from', draggedStopIndex, 'to', lastIndex);
                            handleReorderStops(truck.id, draggedStopIndex, lastIndex);
                          }
                        }}
                        className={`rounded transition-all duration-200 ease-in-out ${
                          dragOverIndex === remainingStops.length 
                            ? 'h-20 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center my-2' 
                            : 'h-2'
                        }`}
                      >
                        {dragOverIndex === remainingStops.length && (
                          <div className="text-sm font-semibold text-primary flex items-center gap-2 animate-pulse">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            Drop Here to Reorder
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {truck.status === 'loading' && (
                  <Button
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRoute();
                    }}
                  >
                    Start Route
                  </Button>
                )}
                {truck.status === 'on-road' && currentStop && (
                  <Button
                    className="w-full mt-3"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteStop(truck.id);
                    }}
                  >
                    Complete Stop {routeCurrentIndex + 1}
                  </Button>
                )}
              </div>
            </div>
          ),
        };
      case 'tax':
        const bondedContainers = containers.filter((c) => c.status === 'staging' || c.status === 'production');
        return {
          title: 'Tax Determination',
          content: (
            <div className="space-y-3">
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded">
                <h4 className="font-semibold mb-2">Bonded Storage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Containers in Bond</span>
                    <span className="font-semibold">{bondedContainers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Liability</span>
                    <span className="font-semibold text-purple-600">$0.00</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Tax triggered when product leaves bonded facility (TTB requirement)
                </p>
              </div>
            </div>
          ),
        };
      case 'restaurant':
        return {
          title: 'Restaurant',
          content: (
            <div className="space-y-3">
              {locations.map((location) => {
                const locationContainers = containers.filter((c) =>
                  location.containers.includes(c.id)
                );
                return (
                  <div
                    key={location.id}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded cursor-pointer hover:bg-red-500/20 transition-colors"
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{location.name}</h4>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                      </div>
                      <Home className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Kegs On-Site</span>
                      <span className="font-semibold">{locationContainers.length}</span>
                    </div>
                    {locationContainers.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {locationContainers.slice(0, 3).map((container) => (
                          <div key={container.id} className="flex justify-between items-center text-sm">
                            <span>{container.id} - {container.productName}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkEmpty(container.id);
                              }}
                            >
                              Mark Empty
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ),
        };
      case 'returns':
        const returnedContainers = containers.filter((c) => c.status === 'returned');
        return {
          title: 'Keg Returns',
          content: (
            <div className="space-y-3">
              <div className="bg-gray-500/10 border border-gray-500/20 p-4 rounded">
                <h4 className="font-semibold mb-2">Empty Containers</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Awaiting Processing</span>
                    <span className="font-semibold">{returnedContainers.length}</span>
                  </div>
                </div>
                {returnedContainers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {returnedContainers.slice(0, 5).map((container) => (
                      <div key={container.id} className="flex justify-between items-center text-sm">
                        <span>{container.id} - {container.productName}</span>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessReturn(container.id);
                          }}
                        >
                          Process Return
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        };
      default:
        return null;
    }
  };

  const stageInfo = getStageInfo();
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrders = orders.filter((o) => o.status === 'approved');
  const stagingCount = containers.filter((c) => c.status === 'staging').length;
  const loadedCount = containers.filter((c) => c.status === 'loaded' || c.status === 'in-transit').length;
  const deliveredCount = containers.filter((c) => c.status === 'delivered').length;
  const returnsCount = containers.filter((c) => c.status === 'returned').length;

  const handleOpenCreateOrder = () => {
    setShowCreateOrderDialog(true);
  };

  const handlePrintSelectedLabels = () => {
    if (selectedContainers.length === 0) {
      addNotification({
        title: 'No Selection',
        message: 'Select one or more containers to print labels',
        type: 'info',
      });
      return;
    }
    addNotification({
      title: 'Label Print Queued',
      message: `Printing labels for ${selectedContainers.length} container(s)`,
      type: 'success',
    });
  };

  const handleGenerateSelectedQR = () => {
    if (selectedContainers.length === 0) {
      addNotification({
        title: 'No Selection',
        message: 'Select one or more containers to generate QR assets',
        type: 'info',
      });
      return;
    }
    addNotification({
      title: 'QR Generation Queued',
      message: `Generated QR payloads for ${selectedContainers.length} container(s)`,
      type: 'success',
    });
  };

  const handleAlertsSummary = () => {
    addNotification({
      title: 'Stage Snapshot',
      message: `Staging: ${stagingCount}, Loaded/In-Transit: ${loadedCount}, Delivered: ${deliveredCount}, Returns: ${returnsCount}`,
      type: 'info',
    });
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* Workflow Tiles */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Logistics Management</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Pending Orders: {pendingOrders.length}</Badge>
              <Badge variant="secondary">Approved Orders: {approvedOrders.length}</Badge>
              <Badge variant="outline">Staging: {stagingCount}</Badge>
              <Badge variant="outline">Loaded/In-Transit: {loadedCount}</Badge>
              <Badge variant="outline">Returns: {returnsCount}</Badge>
            </div>
            {loadingOrders && <Badge variant="outline">Syncing approved orders...</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm" onClick={handleOpenCreateOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenCreateOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Add Container
            </Button>
            <Button
              variant={selectionMode === 'case' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectionMode(selectionMode === 'case' ? null : 'case')}
            >
              <Package className="h-4 w-4 mr-2" />
              Create Case {selectionMode === 'case' && `(${selectedContainers.length}/12)`}
            </Button>
            <Button
              variant={selectionMode === 'pallet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectionMode(selectionMode === 'pallet' ? null : 'pallet')}
            >
              <Package className="h-4 w-4 mr-2" />
              Create Pallet {selectionMode === 'pallet' && `(${selectedContainers.length})`}
            </Button>
            {selectedContainers.length > 0 && selectionMode && (
              <Button
                variant="default"
                size="sm"
                onClick={selectionMode === 'case' ? handleCreateCase : handleCreatePallet}
              >
                Confirm {selectionMode === 'case' ? 'Case' : 'Pallet'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrintSelectedLabels}>
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateSelectedQR}>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR
            </Button>
            <Button variant="outline" size="sm" onClick={handleAlertsSummary}>
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
          </div>
        </div>

        {/* Linear Workflow */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = selectedStage === stage.id;
            const stageContainers = containers.filter((c) => {
              if (stage.id === 'production') return c.status === 'production';
              if (stage.id === 'packaging') return c.status === 'packaging';
              if (stage.id === 'packing') return availableItems.length > 0 || caseBuilder.length > 0;
              if (stage.id === 'delivery') return c.status === 'loaded' || c.status === 'in-transit';
              if (stage.id === 'tax') return c.status === 'staging';
              if (stage.id === 'restaurant') return c.status === 'delivered';
              if (stage.id === 'returns') return c.status === 'returned';
              return false;
            });

            return (
              <Card
                key={stage.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedStage(stage.id)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`${stage.color} p-3 rounded-full text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{stage.name}</p>
                      <p className="text-xl font-bold">
                        {stage.id === 'packing'
                          ? availableItems.length + caseBuilder.length
                          : stageContainers.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-4 p-4 overflow-hidden bg-background">
        {/* Virtual Staging Area */}
        <div className="w-full xl:w-1/2 min-h-0 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">Virtual Staging Area</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Pending Orders
                  </h3>
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border-2 border-yellow-500/20 bg-yellow-500/10 p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{order.customer}</h4>
                            <p className="text-sm text-muted-foreground">{order.id}</p>
                          </div>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            {order.status}
                          </Badge>
                        </div>
                        <ul className="space-y-1 mb-3">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              {item.type === 'Keg' ? (
                                <Beer className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Wine className="h-4 w-4 text-purple-600" />
                              )}
                              <span>
                                {item.quantity}x {item.type} ({item.product})
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleApprove(order.id)}
                        >
                          Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready to Load */}
              {approvedOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Ready to Load
                  </h3>
                  <div className="space-y-3">
                    {approvedOrders.map((order) => {
                      const orderContainers = containers.filter(
                        (c) => c.orderId === order.id
                      );
                      return (
                        <div
                          key={order.id}
                          className="border-2 border-green-500/20 bg-green-500/10 p-4 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{order.customer}</h4>
                              <p className="text-sm text-muted-foreground">{order.id}</p>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              {order.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 mb-3">
                            {orderContainers.map((container) => (
                              <div
                                key={container.id}
                                className="text-sm flex items-center justify-between bg-card border border-border p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                                onClick={(e) => {
                                  if (selectionMode) {
                                    e.stopPropagation();
                                    toggleContainerSelection(container.id);
                                  } else {
                                    handleContainerClick(container);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {selectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedContainers.includes(container.id)}
                                      onChange={() => toggleContainerSelection(container.id)}
                                      className="h-4 w-4"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  {container.type === 'keg' ? (
                                    <Beer className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <Wine className="h-4 w-4 text-purple-600" />
                                  )}
                                  <span className="font-mono text-xs">{container.id}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {container.productName}
                                </span>
                              </div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleLoadToTruck(order)}
                          >
                            Load to Truck
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pendingOrders.length === 0 && approvedOrders.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No orders are staged right now. Create or approve an order to begin packing.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stage Info */}
        <div className="w-full xl:w-1/2 min-h-0 flex flex-col overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">{stageInfo?.title || 'Select a Stage'}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {stageInfo ? (
                stageInfo.content
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click on a workflow stage above to view details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <ContainerDetailModal
          container={selectedDetail.container}
          truck={selectedDetail.truck}
          location={selectedDetail.location}
          allContainers={containers}
          onClose={() => setSelectedDetail(null)}
          onPrint={() => {
            addNotification({
              title: 'Print Initiated',
              message: 'Printing tracking label...',
              type: 'success',
            });
          }}
        />
      )}

      {/* Create Order Dialog */}
      <Dialog open={showCreateOrderDialog} onOpenChange={setShowCreateOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <select
                className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                value={newOrderForm.customer}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, customer: e.target.value })}
              >
                <option value="">Select Customer</option>
                <option value="Downtown Pub">Downtown Pub</option>
                <option value="Riverside Bistro">Riverside Bistro</option>
                <option value="The Craft House">The Craft House</option>
                <option value="Main Street Bar">Main Street Bar</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Product</label>
              <select
                className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                value={newOrderForm.product}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, product: e.target.value })}
              >
                <option value="">Select Product</option>
                <option value="Pale Ale">Pale Ale</option>
                <option value="IPA">IPA</option>
                <option value="Stout">Stout</option>
                <option value="Lager">Lager</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Container Type</label>
              <select
                className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                value={newOrderForm.containerType}
                onChange={(e) =>
                  setNewOrderForm({
                    ...newOrderForm,
                    containerType: e.target.value as 'keg' | 'case' | 'bottle',
                  })
                }
              >
                <option value="keg">Keg (15.5 gal)</option>
                <option value="case">Case (24 bottles)</option>
                <option value="bottle">Bottle (750ml)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                value={newOrderForm.quantity}
                onChange={(e) =>
                  setNewOrderForm({ ...newOrderForm, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateOrderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder}>Create Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
