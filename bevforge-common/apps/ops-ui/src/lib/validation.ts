/**
 * Validation utilities for Canvas Keg Tracking System
 * Implements business rules and data validation
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Container {
  id: string;
  product: string;
  type: string;
  status: string;
  batchId?: string;
  fillDate?: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  containers: Container[];
}

export interface Pallet {
  id: string;
  location: string;
  destination?: string;
  scheduledDelivery?: string;
  containers: Container[];
  capacity?: number;
}

/**
 * Inventory Validation
 */
export function validateInventoryAllocation(
  requested: number,
  available: number
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (requested > available) {
    result.valid = false;
    result.errors.push(
      `Cannot allocate ${requested} units. Only ${available} available.`
    );
  }

  if (requested < 0) {
    result.valid = false;
    result.errors.push('Cannot create negative inventory');
  }

  // Warn on low stock (< 10% of normal)
  const normalStock = 100; // This should come from product config
  if (available - requested < normalStock * 0.1) {
    result.warnings.push(
      `Low stock warning: Only ${available - requested} units will remain`
    );
  }

  return result;
}

/**
 * Capacity Validation
 */
export function validatePalletCapacity(
  currentCount: number,
  addingCount: number,
  capacity: number
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const newTotal = currentCount + addingCount;
  const utilizationPercent = (newTotal / capacity) * 100;

  // Warn when approaching capacity (>90%)
  if (utilizationPercent > 90 && utilizationPercent <= 100) {
    result.warnings.push(
      `Pallet approaching capacity: ${newTotal}/${capacity} (${utilizationPercent.toFixed(0)}%)`
    );
  }

  // Allow overfill with warning (up to 150%)
  if (utilizationPercent > 100 && utilizationPercent <= 150) {
    result.warnings.push(
      `Pallet over capacity: ${newTotal}/${capacity} (${utilizationPercent.toFixed(0)}%)`
    );
  }

  // Block if exceeding 150%
  if (utilizationPercent > 150) {
    result.valid = false;
    result.errors.push(
      `Cannot exceed 150% capacity. Current: ${newTotal}/${capacity} (${utilizationPercent.toFixed(0)}%)`
    );
  }

  return result;
}

export function validateTruckCapacity(
  currentCount: number,
  addingCount: number,
  capacity: number
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const newTotal = currentCount + addingCount;

  // Error when truck at capacity (100%)
  if (newTotal > capacity) {
    result.valid = false;
    result.errors.push(
      `Truck at capacity. Cannot add ${addingCount} more units. Current: ${currentCount}/${capacity}`
    );
    result.warnings.push(
      'Consider scheduling a second delivery for remaining items'
    );
  }

  // Warn when approaching capacity (>90%)
  const utilizationPercent = (newTotal / capacity) * 100;
  if (utilizationPercent > 90 && utilizationPercent <= 100) {
    result.warnings.push(
      `Truck approaching capacity: ${newTotal}/${capacity} (${utilizationPercent.toFixed(0)}%)`
    );
  }

  return result;
}

/**
 * Date Validation
 */
export function validateDeliveryDate(deliveryDate: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const delivery = new Date(deliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Delivery date cannot be in past
  if (delivery < today) {
    result.valid = false;
    result.errors.push('Delivery date cannot be in the past');
  }

  // Warn if delivery scheduled > 30 days out
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (delivery > thirtyDaysFromNow) {
    result.warnings.push(
      'Delivery scheduled more than 30 days in advance'
    );
  }

  return result;
}

export function validateFillDate(fillDate: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const fill = new Date(fillDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Fill date cannot be in future
  if (fill > today) {
    result.valid = false;
    result.errors.push('Fill date cannot be in the future');
  }

  return result;
}

export function validateReturnDate(
  deliveryDate: string,
  returnDate: string
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const delivery = new Date(deliveryDate);
  const returnD = new Date(returnDate);

  // Expected return date must be after delivery date
  if (returnD <= delivery) {
    result.valid = false;
    result.errors.push('Return date must be after delivery date');
  }

  return result;
}

/**
 * Relationship Validation
 */
export function validateCustomerExists(
  customerId: string,
  customers: { id: string }[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!customers.find((c) => c.id === customerId)) {
    result.valid = false;
    result.errors.push('Customer must exist before creating order');
  }

  return result;
}

export function validateProductExists(
  productName: string,
  products: { name: string }[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!products.find((p) => p.name === productName)) {
    result.valid = false;
    result.errors.push('Product must exist before adding to order');
  }

  return result;
}

export function validateLocationExists(
  locationId: string,
  locations: Location[]
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!locations.find((l) => l.id === locationId)) {
    result.valid = false;
    result.errors.push('Location must exist');
  }

  return result;
}

/**
 * Business Logic Validation
 */
export function validateContainerDelivery(
  container: Container
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Cannot deliver empty containers (must have product)
  if (!container.product || container.product.trim() === '') {
    result.valid = false;
    result.errors.push('Cannot deliver empty containers');
  }

  return result;
}

export function validateContainerDeletion(
  container: Container
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Cannot delete container if in-transit or at-customer
  if (
    container.status === 'in-transit' ||
    container.status === 'at-customer'
  ) {
    result.valid = false;
    result.errors.push(
      `Cannot delete container with status: ${container.status}`
    );
  }

  return result;
}

export function validateContainerFill(
  container: Container
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Cannot fill keg that's already filled
  if (container.status === 'filled' || container.status === 'at-customer') {
    result.valid = false;
    result.errors.push('Container is already filled');
  }

  return result;
}

export function validateContainerCleaning(
  container: Container
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Cannot clean keg that's not empty
  if (container.status !== 'empty' && container.status !== 'returned') {
    result.valid = false;
    result.errors.push('Container must be empty before cleaning');
  }

  return result;
}

/**
 * Drag and Drop Validation
 */
export function validateContainerMove(
  container: Container,
  fromLocation: Location,
  toLocation: Location
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Cannot move container if in-transit
  if (container.status === 'in-transit') {
    result.valid = false;
    result.errors.push('Cannot move container that is in-transit');
  }

  // Warn if moving from customer location
  if (fromLocation.type === 'customer') {
    result.warnings.push(
      'Moving container from customer location - ensure proper return process'
    );
  }

  // Warn if moving to cleaning without proper status
  if (
    toLocation.type === 'cleaning' &&
    container.status !== 'empty' &&
    container.status !== 'returned'
  ) {
    result.warnings.push(
      'Container should be empty before moving to cleaning'
    );
  }

  // Check truck capacity if moving to truck
  if (toLocation.type === 'truck' && toLocation.capacity) {
    const currentCount = toLocation.containers.length;
    const capacityCheck = validateTruckCapacity(
      currentCount,
      1,
      toLocation.capacity
    );
    result.errors.push(...capacityCheck.errors);
    result.warnings.push(...capacityCheck.warnings);
    if (!capacityCheck.valid) {
      result.valid = false;
    }
  }

  return result;
}

/**
 * Helper function to display validation results
 */
export function formatValidationMessage(result: ValidationResult): string {
  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push('Errors:', ...result.errors.map((e) => `  • ${e}`));
  }

  if (result.warnings.length > 0) {
    messages.push('Warnings:', ...result.warnings.map((w) => `  ⚠ ${w}`));
  }

  return messages.join('\n');
}
