/**
 * OS API Client Library
 * 
 * Provides typed functions to interact with the OS (Operating System) inventory API.
 * 
 * IMPORTANT: Currently points to mock OS API endpoints (/api/os/*).
 * When real OS is ready, change OS_API_BASE_URL to point to real OS server.
 * 
 * Example: const OS_API_BASE_URL = process.env.OS_API_URL || 'http://localhost:3001/api';
 */

// Configuration
const OS_API_BASE_URL = '/api/os'; // Mock OS API (same server)
// When real OS is ready: const OS_API_BASE_URL = process.env.OS_API_URL || 'http://localhost:3001/api';

// Types
export interface OSItem {
  id: string;
  sku: string;
  name: string;
  type: 'finished_good' | 'raw_material' | 'packaging';
  category: string;
  style?: string;
  abv?: number;
  ibu?: number;
  srm?: number;
  description: string;
  unit_of_measure: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface OSInventoryOnHand {
  item_id: string;
  sku: string;
  name: string;
  quantity_on_hand: number;
  quantity_available: number;
  quantity_allocated: number;
  unit_of_measure: string;
  location_id: string;
  location_name: string;
  last_counted_at: string;
  updated_at: string;
}

export interface OSBatch {
  id: string;
  batch_number: string;
  item_id: string;
  item_name: string;
  brew_date: string;
  package_date: string | null;
  best_by_date: string | null;
  batch_size: number;
  yield_actual: number | null;
  yield_expected: number;
  unit_of_measure: string;
  status: 'brewing' | 'fermenting' | 'conditioning' | 'packaging' | 'completed' | 'cancelled';
  brewer_name: string;
  quality_status: 'pending' | 'passed' | 'failed';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OSMovement {
  id: string;
  item_id: string;
  item_name: string;
  movement_type: 'receipt' | 'shipment' | 'transfer' | 'adjustment' | 'production' | 'consumption';
  quantity: number;
  unit_of_measure: string;
  from_location_id: string | null;
  from_location_name: string | null;
  to_location_id: string | null;
  to_location_name: string | null;
  reference_type: string | null;
  reference_id: string | null;
  batch_id: string | null;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface CreateMovementRequest {
  item_id: string;
  movement_type: 'receipt' | 'shipment' | 'transfer' | 'adjustment' | 'production' | 'consumption';
  quantity: number;
  from_location_id?: string;
  to_location_id?: string;
  reference_type?: string;
  reference_id?: string;
  batch_id?: string;
  notes?: string;
}

// API Response wrapper
interface OSAPIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    source?: string;
    message?: string;
  };
  summary?: any;
  error?: string;
}

// Helper function to make API calls
async function osApiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${OS_API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `OS API error: ${response.statusText}`);
    }

    const result: OSAPIResponse<T> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'OS API request failed');
    }

    return result.data;
  } catch (error) {
    console.error(`OS API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// ITEMS API
// ============================================================================

/**
 * Get all items (products and materials)
 */
export async function getItems(params?: {
  type?: 'finished_good' | 'raw_material' | 'packaging';
  category?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  search?: string;
}): Promise<OSItem[]> {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const query = queryParams.toString();
  return osApiFetch<OSItem[]>(`/items${query ? `?${query}` : ''}`);
}

/**
 * Get a single item by ID
 */
export async function getItem(itemId: string): Promise<OSItem> {
  const items = await getItems();
  const item = items.find(i => i.id === itemId);
  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }
  return item;
}

/**
 * Get finished goods (products) only
 */
export async function getProducts(): Promise<OSItem[]> {
  return getItems({ type: 'finished_good', status: 'active' });
}

// ============================================================================
// INVENTORY API
// ============================================================================

/**
 * Get inventory on-hand for all items or specific item
 */
export async function getInventoryOnHand(params?: {
  item_id?: string;
  location_id?: string;
  low_stock?: boolean;
}): Promise<OSInventoryOnHand[]> {
  const queryParams = new URLSearchParams();
  if (params?.item_id) queryParams.append('item_id', params.item_id);
  if (params?.location_id) queryParams.append('location_id', params.location_id);
  if (params?.low_stock) queryParams.append('low_stock', 'true');

  const query = queryParams.toString();
  return osApiFetch<OSInventoryOnHand[]>(`/inventory/on-hand${query ? `?${query}` : ''}`);
}

/**
 * Get stock level for a specific item
 */
export async function getItemStock(itemId: string): Promise<OSInventoryOnHand | null> {
  const inventory = await getInventoryOnHand({ item_id: itemId });
  return inventory[0] || null;
}

/**
 * Check if item has sufficient stock
 */
export async function checkStock(itemId: string, requiredQuantity: number): Promise<{
  available: boolean;
  quantity_available: number;
  quantity_required: number;
  shortage: number;
}> {
  const stock = await getItemStock(itemId);
  
  if (!stock) {
    return {
      available: false,
      quantity_available: 0,
      quantity_required: requiredQuantity,
      shortage: requiredQuantity,
    };
  }

  const available = stock.quantity_available >= requiredQuantity;
  const shortage = available ? 0 : requiredQuantity - stock.quantity_available;

  return {
    available,
    quantity_available: stock.quantity_available,
    quantity_required: requiredQuantity,
    shortage,
  };
}

// ============================================================================
// BATCHES API
// ============================================================================

/**
 * Get all batches or filter by item/status
 */
export async function getBatches(params?: {
  item_id?: string;
  status?: string;
  batch_number?: string;
}): Promise<OSBatch[]> {
  const queryParams = new URLSearchParams();
  if (params?.item_id) queryParams.append('item_id', params.item_id);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.batch_number) queryParams.append('batch_number', params.batch_number);

  const query = queryParams.toString();
  return osApiFetch<OSBatch[]>(`/batches${query ? `?${query}` : ''}`);
}

/**
 * Get batches for a specific item
 */
export async function getItemBatches(itemId: string): Promise<OSBatch[]> {
  return getBatches({ item_id: itemId });
}

// ============================================================================
// MOVEMENTS API
// ============================================================================

/**
 * Get inventory movements (history)
 */
export async function getMovements(params?: {
  item_id?: string;
  movement_type?: string;
  reference_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<OSMovement[]> {
  const queryParams = new URLSearchParams();
  if (params?.item_id) queryParams.append('item_id', params.item_id);
  if (params?.movement_type) queryParams.append('movement_type', params.movement_type);
  if (params?.reference_id) queryParams.append('reference_id', params.reference_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const query = queryParams.toString();
  return osApiFetch<OSMovement[]>(`/inventory/movements${query ? `?${query}` : ''}`);
}

/**
 * Create a new inventory movement
 */
export async function createMovement(movement: CreateMovementRequest): Promise<OSMovement> {
  return osApiFetch<OSMovement>('/inventory/movements', {
    method: 'POST',
    body: JSON.stringify(movement),
  });
}

/**
 * Record a shipment (when order is delivered)
 */
export async function recordShipment(params: {
  item_id: string;
  quantity: number;
  order_id: string;
  location_id?: string;
  notes?: string;
}): Promise<OSMovement> {
  return createMovement({
    item_id: params.item_id,
    movement_type: 'shipment',
    quantity: -Math.abs(params.quantity), // Negative for outbound
    from_location_id: params.location_id,
    reference_type: 'order',
    reference_id: params.order_id,
    notes: params.notes || `Shipped for order ${params.order_id}`,
  });
}

/**
 * Record a receipt (when inventory is received)
 */
export async function recordReceipt(params: {
  item_id: string;
  quantity: number;
  purchase_order_id?: string;
  location_id?: string;
  notes?: string;
}): Promise<OSMovement> {
  return createMovement({
    item_id: params.item_id,
    movement_type: 'receipt',
    quantity: Math.abs(params.quantity), // Positive for inbound
    to_location_id: params.location_id,
    reference_type: 'purchase_order',
    reference_id: params.purchase_order_id,
    notes: params.notes || 'Inventory received',
  });
}

/**
 * Record an adjustment (inventory correction)
 */
export async function recordAdjustment(params: {
  item_id: string;
  quantity: number;
  location_id?: string;
  reason: string;
}): Promise<OSMovement> {
  return createMovement({
    item_id: params.item_id,
    movement_type: 'adjustment',
    quantity: params.quantity,
    from_location_id: params.location_id,
    reference_type: 'adjustment',
    notes: params.reason,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get OS API configuration
 */
export function getOSConfig() {
  return {
    baseUrl: OS_API_BASE_URL,
    isMock: OS_API_BASE_URL.startsWith('/api/os'),
  };
}

/**
 * Check if OS API is available
 */
export async function checkOSConnection(): Promise<boolean> {
  try {
    await getItems();
    return true;
  } catch (error) {
    console.error('OS API connection failed:', error);
    return false;
  }
}
