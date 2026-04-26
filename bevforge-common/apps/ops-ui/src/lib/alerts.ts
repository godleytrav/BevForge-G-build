/**
 * Alert and Risk Indicator System
 * Monitors inventory, capacity, returns, and deposits
 */

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertType =
  | 'overdue_return'
  | 'low_inventory'
  | 'over_capacity'
  | 'deposit_imbalance'
  | 'expiring_product'
  | 'maintenance_due';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  locationId?: string;
  containerId?: string;
  productName?: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  containers: Container[];
}

export interface Container {
  id: string;
  productName: string;
  type: string;
  status: string;
  fillDate?: Date;
  expectedReturnDate?: Date;
  locationId: string;
  batchNumber?: string;
}

/**
 * Check for overdue returns
 * Containers at customer locations past expected return date
 */
export function checkOverdueReturns(
  locations: Location[],
  containers: Container[]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Find customer locations
  const customerLocations = locations.filter((loc) => loc.type === 'customer');

  customerLocations.forEach((location) => {
    const locationContainers = containers.filter(
      (c) => c.locationId === location.id && c.expectedReturnDate
    );

    locationContainers.forEach((container) => {
      if (container.expectedReturnDate && container.expectedReturnDate < now) {
        const daysOverdue = Math.floor(
          (now.getTime() - container.expectedReturnDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const severity: AlertSeverity =
          daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'error' : 'warning';

        alerts.push({
          id: `overdue-${container.id}`,
          type: 'overdue_return',
          severity,
          title: 'Overdue Return',
          message: `${container.productName} at ${location.name} is ${daysOverdue} days overdue`,
          locationId: location.id,
          containerId: container.id,
          productName: container.productName,
          timestamp: now,
          acknowledged: false,
        });
      }
    });
  });

  return alerts;
}

/**
 * Check for low inventory
 * Warn when product inventory falls below threshold
 */
export function checkLowInventory(
  containers: Container[],
  thresholds: Record<string, number> = {}
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Group containers by product
  const productCounts: Record<string, number> = {};
  containers.forEach((container) => {
    if (container.status === 'filled' || container.status === 'empty') {
      productCounts[container.productName] =
        (productCounts[container.productName] || 0) + 1;
    }
  });

  // Check each product against threshold
  Object.entries(productCounts).forEach(([productName, count]) => {
    const threshold = thresholds[productName] || 10; // Default threshold: 10 units

    if (count < threshold) {
      const severity: AlertSeverity =
        count === 0 ? 'critical' : count < threshold / 2 ? 'error' : 'warning';

      alerts.push({
        id: `low-inventory-${productName}`,
        type: 'low_inventory',
        severity,
        title: 'Low Inventory',
        message: `${productName} inventory is low: ${count} units (threshold: ${threshold})`,
        productName,
        timestamp: now,
        acknowledged: false,
      });
    }
  });

  return alerts;
}

/**
 * Check for over-capacity locations
 * Warn when locations exceed their capacity limits
 */
export function checkOverCapacity(locations: Location[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  locations.forEach((location) => {
    if (!location.capacity) return;

    const containerCount = location.containers.length;
    const utilizationPercent = (containerCount / location.capacity) * 100;

    if (containerCount > location.capacity) {
      alerts.push({
        id: `over-capacity-${location.id}`,
        type: 'over_capacity',
        severity: 'error',
        title: 'Over Capacity',
        message: `${location.name} is over capacity: ${containerCount}/${location.capacity} (${utilizationPercent.toFixed(0)}%)`,
        locationId: location.id,
        timestamp: now,
        acknowledged: false,
      });
    } else if (utilizationPercent >= 90) {
      alerts.push({
        id: `near-capacity-${location.id}`,
        type: 'over_capacity',
        severity: 'warning',
        title: 'Near Capacity',
        message: `${location.name} is near capacity: ${containerCount}/${location.capacity} (${utilizationPercent.toFixed(0)}%)`,
        locationId: location.id,
        timestamp: now,
        acknowledged: false,
      });
    }
  });

  return alerts;
}

/**
 * Check for deposit imbalances
 * Track containers at customer locations vs deposits received
 */
export function checkDepositImbalance(
  locations: Location[],
  containers: Container[],
  deposits: Record<string, { paid: number; owed: number }>
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Find customer locations
  const customerLocations = locations.filter((loc) => loc.type === 'customer');

  customerLocations.forEach((location) => {
    const locationContainers = containers.filter(
      (c) => c.locationId === location.id
    );
    const containerCount = locationContainers.length;

    const depositInfo = deposits[location.id] || { paid: 0, owed: 0 };
    const expectedDeposit = containerCount * 30; // $30 per container
    const imbalance = expectedDeposit - depositInfo.paid;

    if (imbalance > 0 && containerCount > 0) {
      const severity: AlertSeverity =
        imbalance > 500 ? 'error' : imbalance > 200 ? 'warning' : 'info';

      alerts.push({
        id: `deposit-imbalance-${location.id}`,
        type: 'deposit_imbalance',
        severity,
        title: 'Deposit Imbalance',
        message: `${location.name} has ${containerCount} containers but deposit shortfall of $${imbalance}`,
        locationId: location.id,
        timestamp: now,
        acknowledged: false,
      });
    }
  });

  return alerts;
}

/**
 * Check for expiring products
 * Warn about products approaching expiration
 */
export function checkExpiringProducts(containers: Container[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  containers.forEach((container) => {
    if (container.fillDate && container.status === 'filled') {
      // Assume 90-day shelf life
      const expirationDate = new Date(
        container.fillDate.getTime() + 90 * 24 * 60 * 60 * 1000
      );

      if (expirationDate < now) {
        alerts.push({
          id: `expired-${container.id}`,
          type: 'expiring_product',
          severity: 'critical',
          title: 'Product Expired',
          message: `${container.productName} (${container.batchNumber}) has expired`,
          containerId: container.id,
          productName: container.productName,
          timestamp: now,
          acknowledged: false,
        });
      } else if (expirationDate < thirtyDaysFromNow) {
        const daysUntilExpiration = Math.floor(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        alerts.push({
          id: `expiring-${container.id}`,
          type: 'expiring_product',
          severity: 'warning',
          title: 'Product Expiring Soon',
          message: `${container.productName} (${container.batchNumber}) expires in ${daysUntilExpiration} days`,
          containerId: container.id,
          productName: container.productName,
          timestamp: now,
          acknowledged: false,
        });
      }
    }
  });

  return alerts;
}

/**
 * Get all alerts for the system
 */
export function getAllAlerts(
  locations: Location[],
  containers: Container[],
  deposits: Record<string, { paid: number; owed: number }> = {},
  inventoryThresholds: Record<string, number> = {}
): Alert[] {
  const alerts: Alert[] = [
    ...checkOverdueReturns(locations, containers),
    ...checkLowInventory(containers, inventoryThresholds),
    ...checkOverCapacity(locations),
    ...checkDepositImbalance(locations, containers, deposits),
    ...checkExpiringProducts(containers),
  ];

  // Sort by severity and timestamp
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
  };

  return alerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

/**
 * Get alert badge color based on severity
 */
export function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    case 'warning':
      return 'bg-yellow-500 text-white';
    case 'info':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

/**
 * Get alert icon based on type
 */
export function getAlertIcon(type: AlertType): string {
  switch (type) {
    case 'overdue_return':
      return '⏰';
    case 'low_inventory':
      return '📦';
    case 'over_capacity':
      return '⚠️';
    case 'deposit_imbalance':
      return '💰';
    case 'expiring_product':
      return '⏳';
    case 'maintenance_due':
      return '🔧';
    default:
      return '🔔';
  }
}
