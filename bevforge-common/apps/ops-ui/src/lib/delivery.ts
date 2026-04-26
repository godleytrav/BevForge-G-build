/**
 * Delivery Loading and Tracking System
 * Handles truck loading, route tracking, and delivery workflows
 */

export interface DeliveryRoute {
  id: string;
  truckId: string;
  driverId: string;
  status: 'planning' | 'loading' | 'in_transit' | 'delivering' | 'completed';
  scheduledDate: Date;
  stops: DeliveryStop[];
  containers: string[]; // Container IDs loaded on truck
  createdAt: Date;
  completedAt?: Date;
}

export interface DeliveryStop {
  id: string;
  routeId: string;
  customerId: string;
  customerName: string;
  address: string;
  sequence: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scheduledTime?: Date;
  arrivalTime?: Date;
  departureTime?: Date;
  items: DeliveryItem[];
  notes?: string;
}

export interface DeliveryItem {
  id: string;
  productName: string;
  containerType: string;
  quantityOrdered: number;
  quantityDelivered: number;
  containerIds: string[];
}

export interface Truck {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  status: 'available' | 'loading' | 'on_route' | 'maintenance';
  driverId?: string;
}

export interface Driver {
  id: string;
  name: string;
  status: 'available' | 'on_route' | 'off_duty';
  currentTruckId?: string;
}

/**
 * Validate truck loading
 */
export function validateTruckLoading(
  truck: Truck,
  containers: any[],
  driver?: Driver
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check truck exists and is available
  if (!truck) {
    errors.push('Truck must be selected');
    return { valid: false, errors, warnings };
  }

  if (truck.status === 'on_route') {
    errors.push('Cannot load truck that is already on route');
  }

  if (truck.status === 'maintenance') {
    errors.push('Truck is in maintenance and cannot be loaded');
  }

  // Check driver is assigned
  if (!driver) {
    errors.push('Driver must be assigned to truck');
  } else if (driver.status === 'on_route') {
    errors.push('Driver is already on another route');
  } else if (driver.status === 'off_duty') {
    warnings.push('Driver is currently off duty');
  }

  // Check capacity
  const totalContainers = containers.length;
  const utilizationPercent = (totalContainers / truck.capacity) * 100;

  if (totalContainers > truck.capacity) {
    errors.push(
      `Truck capacity exceeded: ${totalContainers}/${truck.capacity} containers (${utilizationPercent.toFixed(0)}%)`
    );
  } else if (utilizationPercent > 90) {
    warnings.push(
      `Truck near capacity: ${totalContainers}/${truck.capacity} containers (${utilizationPercent.toFixed(0)}%)`
    );
  }

  // Check containers are available
  const unavailableContainers = containers.filter(
    (c) => c.status === 'in_transit' || c.status === 'cleaning'
  );
  if (unavailableContainers.length > 0) {
    errors.push(
      `${unavailableContainers.length} containers are not available for loading`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate delivery stop
 */
export function validateDeliveryStop(
  stop: DeliveryStop,
  availableInventory: Record<string, number>
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check customer exists
  if (!stop.customerId) {
    errors.push('Customer must be selected');
  }

  // Check items
  if (!stop.items || stop.items.length === 0) {
    errors.push('At least one product must be added to delivery');
  }

  // Check inventory availability
  stop.items.forEach((item) => {
    const available = availableInventory[item.productName] || 0;
    if (item.quantityOrdered > available) {
      errors.push(
        `Insufficient inventory for ${item.productName}: ${item.quantityOrdered} ordered, ${available} available`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate route efficiency
 */
export function calculateRouteEfficiency(route: DeliveryRoute): {
  totalStops: number;
  completedStops: number;
  totalItems: number;
  deliveredItems: number;
  utilizationPercent: number;
  estimatedDuration: number; // minutes
} {
  const totalStops = route.stops.length;
  const completedStops = route.stops.filter(
    (s) => s.status === 'completed'
  ).length;

  const totalItems = route.stops.reduce(
    (sum, stop) =>
      sum + stop.items.reduce((itemSum, item) => itemSum + item.quantityOrdered, 0),
    0
  );

  const deliveredItems = route.stops.reduce(
    (sum, stop) =>
      sum +
      stop.items.reduce((itemSum, item) => itemSum + item.quantityDelivered, 0),
    0
  );

  const utilizationPercent = totalItems > 0 ? (deliveredItems / totalItems) * 100 : 0;

  // Estimate 30 minutes per stop + 15 minutes travel between stops
  const estimatedDuration = totalStops * 30 + (totalStops - 1) * 15;

  return {
    totalStops,
    completedStops,
    totalItems,
    deliveredItems,
    utilizationPercent,
    estimatedDuration,
  };
}

/**
 * Process partial delivery
 */
export function processPartialDelivery(
  stop: DeliveryStop,
  actualDeliveries: Record<string, number>
): {
  success: boolean;
  undeliveredItems: DeliveryItem[];
  returnToInventory: string[];
} {
  const undeliveredItems: DeliveryItem[] = [];
  const returnToInventory: string[] = [];

  stop.items.forEach((item) => {
    const delivered = actualDeliveries[item.id] || 0;
    const undelivered = item.quantityOrdered - delivered;

    if (undelivered > 0) {
      undeliveredItems.push({
        ...item,
        quantityOrdered: undelivered,
        quantityDelivered: 0,
      });

      // Mark containers for return to inventory
      const undeliveredContainerIds = item.containerIds.slice(delivered);
      returnToInventory.push(...undeliveredContainerIds);
    }

    item.quantityDelivered = delivered;
  });

  return {
    success: undeliveredItems.length === 0,
    undeliveredItems,
    returnToInventory,
  };
}

/**
 * Process customer returns
 */
export function processCustomerReturn(
  customerId: string,
  containers: any[],
  condition: 'clean' | 'damaged'
): {
  success: boolean;
  errors: string[];
  cleaningQueue: string[];
  maintenanceQueue: string[];
} {
  const errors: string[] = [];
  const cleaningQueue: string[] = [];
  const maintenanceQueue: string[] = [];

  containers.forEach((container) => {
    // Validate container was delivered to this customer
    if (container.locationId !== customerId) {
      errors.push(
        `Container ${container.id} was not delivered to this customer`
      );
      return;
    }

    // Route based on condition
    if (condition === 'clean') {
      // Clean containers go back to inventory
      container.status = 'empty';
      container.locationId = 'warehouse'; // Return to warehouse
    } else {
      // Damaged containers go to maintenance
      container.status = 'maintenance';
      maintenanceQueue.push(container.id);
    }

    // All returned kegs need cleaning
    if (container.type === 'keg') {
      cleaningQueue.push(container.id);
    }
  });

  return {
    success: errors.length === 0,
    errors,
    cleaningQueue,
    maintenanceQueue,
  };
}

/**
 * Get route status summary
 */
export function getRouteStatusSummary(route: DeliveryRoute): string {
  const efficiency = calculateRouteEfficiency(route);

  switch (route.status) {
    case 'planning':
      return `Planning route with ${efficiency.totalStops} stops`;
    case 'loading':
      return `Loading ${efficiency.totalItems} items for delivery`;
    case 'in_transit':
      return `En route: ${efficiency.completedStops}/${efficiency.totalStops} stops completed`;
    case 'delivering':
      return `Delivering: ${efficiency.deliveredItems}/${efficiency.totalItems} items delivered`;
    case 'completed':
      return `Completed: ${efficiency.deliveredItems} items delivered to ${efficiency.totalStops} stops`;
    default:
      return 'Unknown status';
  }
}
