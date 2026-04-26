/**
 * Cleaning Queue and Maintenance Tracking System
 * Auto-routes returned kegs to cleaning and tracks maintenance status
 */

export interface CleaningQueueItem {
  id: string;
  containerId: string;
  containerType: string;
  productName: string;
  returnedFrom: string; // Customer ID
  returnedAt: Date;
  condition: 'clean' | 'dirty' | 'damaged';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface MaintenanceItem {
  id: string;
  containerId: string;
  containerType: string;
  issue: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  status: 'reported' | 'diagnosed' | 'in_repair' | 'completed' | 'scrapped';
  reportedAt: Date;
  reportedBy: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: Date;
  notes?: string;
}

export interface CleaningStats {
  totalQueued: number;
  inProgress: number;
  completedToday: number;
  averageTime: number; // minutes
  backlog: number;
}

/**
 * Auto-route returned containers to cleaning queue
 */
export function routeToCleaningQueue(
  containers: any[],
  returnedFrom: string
): CleaningQueueItem[] {
  const cleaningItems: CleaningQueueItem[] = [];

  containers.forEach((container) => {
    // Only kegs need cleaning
    if (container.type !== 'keg') {
      return;
    }

    // Determine condition and priority
    const condition = determineCondition(container);
    const priority = determinePriority(container, condition);

    const cleaningItem: CleaningQueueItem = {
      id: `CLN-${Date.now()}-${container.id}`,
      containerId: container.id,
      containerType: container.type,
      productName: container.productName,
      returnedFrom,
      returnedAt: new Date(),
      condition,
      priority,
      status: 'queued',
    };

    cleaningItems.push(cleaningItem);

    // Update container status
    container.status = 'cleaning';
    container.locationId = 'cleaning';
  });

  return cleaningItems;
}

/**
 * Determine container condition
 */
function determineCondition(container: any): 'clean' | 'dirty' | 'damaged' {
  // Check for damage indicators
  if (container.maintenanceRequired || container.damaged) {
    return 'damaged';
  }

  // Check how long it's been since last cleaning
  const daysSinceLastCleaning = container.lastCleanedAt
    ? Math.floor(
        (Date.now() - new Date(container.lastCleanedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  // If recently cleaned (< 7 days) and returned quickly, might be clean
  if (daysSinceLastCleaning < 7) {
    return 'clean';
  }

  return 'dirty';
}

/**
 * Determine cleaning priority
 */
function determinePriority(
  container: any,
  condition: string
): 'low' | 'normal' | 'high' | 'urgent' {
  // Damaged containers are urgent
  if (condition === 'damaged') {
    return 'urgent';
  }

  // Check inventory levels for this product
  const inventoryLevel = container.inventoryLevel || 'normal';
  if (inventoryLevel === 'critical') {
    return 'urgent';
  } else if (inventoryLevel === 'low') {
    return 'high';
  }

  // Check age of container
  const daysSinceReturn = container.returnedAt
    ? Math.floor(
        (Date.now() - new Date(container.returnedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  if (daysSinceReturn > 7) {
    return 'high';
  } else if (daysSinceReturn > 3) {
    return 'normal';
  }

  return 'low';
}

/**
 * Process cleaning completion
 */
export function completeCleaningItem(
  item: CleaningQueueItem,
  container: any,
  passed: boolean,
  notes?: string
): { success: boolean; maintenanceRequired: boolean; error?: string } {
  if (item.status !== 'in_progress') {
    return {
      success: false,
      maintenanceRequired: false,
      error: 'Item must be in progress to complete',
    };
  }

  if (passed) {
    // Cleaning passed - return to inventory
    item.status = 'completed';
    item.completedAt = new Date();
    item.notes = notes;

    container.status = 'empty';
    container.locationId = 'warehouse';
    container.lastCleanedAt = new Date();

    return {
      success: true,
      maintenanceRequired: false,
    };
  } else {
    // Cleaning failed - send to maintenance
    item.status = 'failed';
    item.completedAt = new Date();
    item.notes = notes || 'Failed cleaning inspection';

    container.status = 'maintenance';
    container.maintenanceRequired = true;

    return {
      success: true,
      maintenanceRequired: true,
    };
  }
}

/**
 * Create maintenance item
 */
export function createMaintenanceItem(
  container: any,
  issue: string,
  severity: MaintenanceItem['severity'],
  reportedBy: string
): MaintenanceItem {
  return {
    id: `MNT-${Date.now()}-${container.id}`,
    containerId: container.id,
    containerType: container.type,
    issue,
    severity,
    status: 'reported',
    reportedAt: new Date(),
    reportedBy,
  };
}

/**
 * Get cleaning queue statistics
 */
export function getCleaningStats(
  cleaningQueue: CleaningQueueItem[]
): CleaningStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalQueued = cleaningQueue.filter((item) => item.status === 'queued').length;
  const inProgress = cleaningQueue.filter(
    (item) => item.status === 'in_progress'
  ).length;
  const completedToday = cleaningQueue.filter(
    (item) =>
      item.status === 'completed' &&
      item.completedAt &&
      item.completedAt >= todayStart
  ).length;

  // Calculate average cleaning time
  const completedItems = cleaningQueue.filter(
    (item) => item.status === 'completed' && item.startedAt && item.completedAt
  );
  const totalTime = completedItems.reduce((sum, item) => {
    if (item.startedAt && item.completedAt) {
      return (
        sum +
        (item.completedAt.getTime() - item.startedAt.getTime()) / (1000 * 60)
      );
    }
    return sum;
  }, 0);
  const averageTime = completedItems.length > 0 ? totalTime / completedItems.length : 0;

  // Calculate backlog (items waiting > 24 hours)
  const backlog = cleaningQueue.filter((item) => {
    if (item.status !== 'queued') return false;
    const hoursSinceReturn =
      (now.getTime() - item.returnedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceReturn > 24;
  }).length;

  return {
    totalQueued,
    inProgress,
    completedToday,
    averageTime: Math.round(averageTime),
    backlog,
  };
}

/**
 * Get next cleaning item by priority
 */
export function getNextCleaningItem(
  cleaningQueue: CleaningQueueItem[]
): CleaningQueueItem | null {
  const queuedItems = cleaningQueue.filter((item) => item.status === 'queued');

  if (queuedItems.length === 0) {
    return null;
  }

  // Sort by priority (urgent > high > normal > low) and then by return date
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };

  queuedItems.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.returnedAt.getTime() - b.returnedAt.getTime();
  });

  return queuedItems[0];
}

/**
 * Start cleaning item
 */
export function startCleaningItem(
  item: CleaningQueueItem,
  assignedTo: string
): { success: boolean; error?: string } {
  if (item.status !== 'queued') {
    return {
      success: false,
      error: 'Item must be queued to start',
    };
  }

  item.status = 'in_progress';
  item.startedAt = new Date();
  item.assignedTo = assignedTo;

  return {
    success: true,
  };
}

/**
 * Get maintenance statistics
 */
export function getMaintenanceStats(maintenanceItems: MaintenanceItem[]): {
  totalOpen: number;
  inRepair: number;
  completedThisMonth: number;
  totalCost: number;
  criticalIssues: number;
} {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalOpen = maintenanceItems.filter(
    (item) => item.status === 'reported' || item.status === 'diagnosed'
  ).length;

  const inRepair = maintenanceItems.filter(
    (item) => item.status === 'in_repair'
  ).length;

  const completedThisMonth = maintenanceItems.filter(
    (item) =>
      item.status === 'completed' &&
      item.completedAt &&
      item.completedAt >= monthStart
  ).length;

  const totalCost = maintenanceItems
    .filter((item) => item.actualCost)
    .reduce((sum, item) => sum + (item.actualCost || 0), 0);

  const criticalIssues = maintenanceItems.filter(
    (item) => item.severity === 'critical' && item.status !== 'completed'
  ).length;

  return {
    totalOpen,
    inRepair,
    completedThisMonth,
    totalCost,
    criticalIssues,
  };
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: CleaningQueueItem['priority']): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-600 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'normal':
      return 'bg-blue-500 text-white';
    case 'low':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: MaintenanceItem['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'major':
      return 'bg-orange-500 text-white';
    case 'moderate':
      return 'bg-yellow-500 text-white';
    case 'minor':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}
