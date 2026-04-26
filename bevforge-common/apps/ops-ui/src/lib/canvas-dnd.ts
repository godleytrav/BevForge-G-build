/**
 * Canvas Drag and Drop Utilities
 * 
 * Provides drag-and-drop functionality for moving containers and pallets
 * between locations on the logistics canvas.
 */

export interface DragItem {
  type: 'container' | 'pallet' | 'product';
  id: string;
  data: any;
  sourceLocation: string;
}

export interface DropZone {
  id: string;
  type: 'warehouse' | 'truck' | 'customer' | 'production' | 'cleaning';
  accepts: ('container' | 'pallet' | 'product')[];
}

/**
 * Check if a drag item can be dropped in a specific zone
 */
export function canDrop(item: DragItem, zone: DropZone): boolean {
  // Check if zone accepts this item type
  if (!zone.accepts.includes(item.type)) {
    return false;
  }

  // Additional business logic rules
  switch (zone.type) {
    case 'truck':
      // Trucks can only accept pallets or containers that are staged
      return item.type === 'pallet' || item.type === 'container';
    
    case 'customer':
      // Customers can only receive pallets or containers in transit
      return item.type === 'pallet' || item.type === 'container';
    
    case 'production':
      // Production can only accept empty containers
      return item.type === 'container';
    
    case 'cleaning':
      // Cleaning can only accept empty containers
      return item.type === 'container';
    
    case 'warehouse':
      // Warehouse accepts everything
      return true;
    
    default:
      return false;
  }
}

/**
 * Get visual feedback class for drop zones
 */
export function getDropZoneClass(
  isOver: boolean,
  canDrop: boolean,
  isDragging: boolean
): string {
  if (!isDragging) return '';
  
  if (isOver && canDrop) {
    return 'ring-2 ring-primary bg-primary/10';
  }
  
  if (isOver && !canDrop) {
    return 'ring-2 ring-destructive bg-destructive/10';
  }
  
  if (canDrop) {
    return 'ring-1 ring-muted-foreground/30';
  }
  
  return 'opacity-50';
}

/**
 * Handle drop action
 */
export async function handleDrop(
  item: DragItem,
  targetZone: DropZone
): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Replace with actual API call
    console.log('Moving item:', item, 'to zone:', targetZone);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Moved ${item.type} to ${targetZone.id}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to move ${item.type}: ${error}`,
    };
  }
}

/**
 * Get drag preview text
 */
export function getDragPreview(item: DragItem): string {
  switch (item.type) {
    case 'container':
      return `Container ${item.id}`;
    case 'pallet':
      return `Pallet ${item.id}`;
    case 'product':
      return `Product ${item.id}`;
    default:
      return 'Item';
  }
}
