/**
 * Container Tracking System
 * Generates unique IDs and manages hierarchical packaging relationships
 */

export type ContainerType = 'keg' | 'bottle' | 'can' | 'case' | 'pallet';
export type ContainerStatus = 'production' | 'packaging' | 'staging' | 'loaded' | 'in-transit' | 'delivered' | 'returned';

export interface Container {
  id: string;
  type: ContainerType;
  productName: string;
  batchNumber: string;
  status: ContainerStatus;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Hierarchical relationships
  parentId?: string; // For items in cases/pallets
  childIds?: string[]; // For cases/pallets containing items
  
  // Container-specific details
  volume?: string; // e.g., "15.5 gal" for kegs, "12 oz" for bottles
  quantity?: number; // For cases (12-pack, 24-pack)
  weight?: number; // For pallets
  
  // Tracking details
  location?: string;
  orderId?: string;
  customerId?: string;
  truckId?: string;
  
  // History
  history: ContainerHistoryEntry[];
}

export interface ContainerHistoryEntry {
  timestamp: Date;
  action: string;
  location: string;
  userId?: string;
  notes?: string;
}

export interface Truck {
  id: string;
  name: string;
  route: string;
  driver?: string;
  capacity: number; // Max weight in lbs
  currentLoad: number; // Current weight in lbs
  status: 'idle' | 'loading' | 'on-road' | 'delivered';
  departureTime?: Date;
  containers: string[]; // Container IDs
  qrCode: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'restaurant' | 'distributor' | 'warehouse';
  address: string;
  containers: string[]; // Container IDs on-site
  pendingReturns: string[]; // Empty container IDs
  deliveryHistory: DeliveryRecord[];
}

export interface DeliveryRecord {
  date: Date;
  truckId: string;
  containerIds: string[];
  signedBy?: string;
}

// ID Generators
let kegCounter = 1;
let caseCounter = 1;
let palletCounter = 1;
let bottleCounter = 1;
let canCounter = 1;

export function generateContainerId(type: ContainerType): string {
  switch (type) {
    case 'keg':
      return `KEG-${String(kegCounter++).padStart(4, '0')}`;
    case 'case':
      return `CASE-${String(caseCounter++).padStart(4, '0')}`;
    case 'pallet':
      return `PLT-${String(palletCounter++).padStart(4, '0')}`;
    case 'bottle':
      return `BTL-${String(bottleCounter++).padStart(4, '0')}`;
    case 'can':
      return `CAN-${String(canCounter++).padStart(4, '0')}`;
  }
}

export function generateQRCode(id: string): string {
  // In production, this would generate actual QR code data
  // For now, return a data URL that represents the ID
  return `qr:${id}`;
}

export function generateTruckId(): string {
  return `TRUCK-${Math.floor(Math.random() * 100)}`;
}

// Container Creation
export function createContainer(
  type: ContainerType,
  productName: string,
  batchNumber: string,
  options?: Partial<Container>
): Container {
  const id = generateContainerId(type);
  const now = new Date();
  
  return {
    id,
    type,
    productName,
    batchNumber,
    status: 'production',
    qrCode: generateQRCode(id),
    createdAt: now,
    updatedAt: now,
    history: [
      {
        timestamp: now,
        action: 'Created',
        location: 'Production',
      },
    ],
    ...options,
  };
}

// Hierarchical Packaging
export function createCase(
  containers: Container[],
  productName: string,
  batchNumber: string
): Container {
  const caseId = generateContainerId('case');
  const now = new Date();
  
  // Calculate total weight
  const totalWeight = containers.reduce((sum, c) => sum + (c.weight || 0), 0);
  
  return {
    id: caseId,
    type: 'case',
    productName,
    batchNumber,
    status: 'packaging',
    qrCode: generateQRCode(caseId),
    createdAt: now,
    updatedAt: now,
    quantity: containers.length,
    weight: totalWeight,
    childIds: containers.map(c => c.id),
    history: [
      {
        timestamp: now,
        action: 'Case Created',
        location: 'Packaging',
        notes: `Contains ${containers.length} items`,
      },
    ],
  };
}

export function createPallet(
  containers: Container[],
  notes?: string
): Container {
  const palletId = generateContainerId('pallet');
  const now = new Date();
  
  // Calculate total weight
  const totalWeight = containers.reduce((sum, c) => sum + (c.weight || 50), 0); // Default 50 lbs per container
  
  // Get unique product names
  const products = [...new Set(containers.map(c => c.productName))];
  const productName = products.length === 1 ? products[0] : 'Mixed Products';
  
  return {
    id: palletId,
    type: 'pallet',
    productName,
    batchNumber: 'MIXED',
    status: 'packaging',
    qrCode: generateQRCode(palletId),
    createdAt: now,
    updatedAt: now,
    weight: totalWeight,
    childIds: containers.map(c => c.id),
    history: [
      {
        timestamp: now,
        action: 'Pallet Created',
        location: 'Packaging',
        notes: notes || `Contains ${containers.length} containers`,
      },
    ],
  };
}

// Container Updates
export function updateContainerStatus(
  container: Container,
  status: ContainerStatus,
  location: string,
  notes?: string
): Container {
  const now = new Date();
  
  return {
    ...container,
    status,
    location,
    updatedAt: now,
    history: [
      ...container.history,
      {
        timestamp: now,
        action: `Status changed to ${status}`,
        location,
        notes,
      },
    ],
  };
}

export function addContainerToTruck(
  container: Container,
  truckId: string
): Container {
  const now = new Date();
  
  return {
    ...container,
    status: 'loaded',
    truckId,
    updatedAt: now,
    history: [
      ...container.history,
      {
        timestamp: now,
        action: 'Loaded onto truck',
        location: 'Staging Area',
        notes: `Truck: ${truckId}`,
      },
    ],
  };
}

// Truck Management
export function createTruck(name: string, route: string, capacity: number = 10000): Truck {
  return {
    id: generateTruckId(),
    name,
    route,
    capacity,
    currentLoad: 0,
    status: 'idle',
    containers: [],
    qrCode: generateQRCode(name),
  };
}

export function loadContainerOnTruck(truck: Truck, container: Container): Truck {
  const containerWeight = container.weight || 50; // Default 50 lbs
  
  return {
    ...truck,
    currentLoad: truck.currentLoad + containerWeight,
    containers: [...truck.containers, container.id],
    status: 'loading',
  };
}

export function startTruckRoute(truck: Truck): Truck {
  return {
    ...truck,
    status: 'on-road',
    departureTime: new Date(),
  };
}

// Location Management
export function createLocation(name: string, type: Location['type'], address: string): Location {
  return {
    id: `LOC-${name.replace(/\s+/g, '-').toUpperCase()}`,
    name,
    type,
    address,
    containers: [],
    pendingReturns: [],
    deliveryHistory: [],
  };
}

export function deliverToLocation(
  location: Location,
  truckId: string,
  containerIds: string[]
): Location {
  return {
    ...location,
    containers: [...location.containers, ...containerIds],
    deliveryHistory: [
      ...location.deliveryHistory,
      {
        date: new Date(),
        truckId,
        containerIds,
      },
    ],
  };
}

// Utility Functions
export function getContainerWeight(container: Container): number {
  if (container.weight) return container.weight;
  
  // Default weights by type
  switch (container.type) {
    case 'keg':
      return 160; // Full 15.5 gal keg ~160 lbs
    case 'case':
      return 30; // Case of bottles ~30 lbs
    case 'bottle':
      return 2.5; // Single bottle ~2.5 lbs
    case 'can':
      return 0.8; // Single can ~0.8 lbs
    case 'pallet':
      return container.childIds ? container.childIds.length * 50 : 500;
    default:
      return 50;
  }
}

export function getTruckCapacityPercentage(truck: Truck): number {
  return Math.round((truck.currentLoad / truck.capacity) * 100);
}

export function canAddToTruck(truck: Truck, container: Container): boolean {
  const containerWeight = getContainerWeight(container);
  return truck.currentLoad + containerWeight <= truck.capacity;
}
