import { mysqlTable, int, varchar, text, decimal, timestamp, boolean, json, index, primaryKey } from 'drizzle-orm/mysql-core';

// ============================================================================
// UNITS OF MEASURE
// ============================================================================

export const unitsOfMeasure = mysqlTable('units_of_measure', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 20 }).notNull().unique(), // gal, L, lb, kg, bbl, oz, etc.
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // volume, weight, count
  baseUnit: varchar('base_unit', { length: 20 }), // Reference to base unit for conversions
  conversionFactor: decimal('conversion_factor', { precision: 20, scale: 10 }), // Factor to convert to base unit
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ============================================================================
// LOCATIONS (Hierarchical)
// ============================================================================

export const locations = mysqlTable('locations', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 50 }).notNull().unique(), // Alphanumeric: "WH1-A-12-3"
  name: varchar('name', { length: 255 }).notNull(),
  parentId: int('parent_id'), // Self-reference for hierarchy
  locationType: varchar('location_type', { length: 50 }).notNull(), // warehouse, zone, aisle, shelf, bin, rack, barrel
  level: int('level').notNull().default(0), // 0=warehouse, 1=zone, 2=aisle, etc.
  capacity: decimal('capacity', { precision: 15, scale: 4 }), // Optional capacity
  capacityUom: varchar('capacity_uom', { length: 20 }), // Unit for capacity
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  parentIdx: index('parent_idx').on(table.parentId),
  typeIdx: index('type_idx').on(table.locationType),
}));

// ============================================================================
// ITEMS (Materials, Ingredients, Packaging, Finished Goods)
// ============================================================================

export const items = mysqlTable('items', {
  id: int('id').primaryKey().autoincrement(),
  itemCode: varchar('item_code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // yeast, malt, hops, fruit, additive, packaging, finished_good
  subcategory: varchar('subcategory', { length: 100 }), // ale_yeast, base_malt, aroma_hops, etc.
  
  // Inventory control
  trackLots: boolean('track_lots').notNull().default(true),
  defaultUom: varchar('default_uom', { length: 20 }).notNull(), // Primary unit
  alternateUom: varchar('alternate_uom', { length: 20 }), // Secondary unit
  conversionFactor: decimal('conversion_factor', { precision: 20, scale: 10 }), // Alternate to default
  
  // Costing (OS owns last cost for production planning)
  lastCost: decimal('last_cost', { precision: 15, scale: 4 }),
  costUom: varchar('cost_uom', { length: 20 }),
  
  // Reorder (basic - OPS extends this)
  reorderPoint: decimal('reorder_point', { precision: 15, scale: 4 }),
  reorderQty: decimal('reorder_qty', { precision: 15, scale: 4 }),
  
  // Category-specific data (JSON for flexibility)
  // Yeast fields
  yeastData: json('yeast_data').$type<{
    manufacturer?: string;
    strainCode?: string;
    strainName?: string;
    yeastFamily?: 'ale' | 'lager' | 'wine' | 'cider';
    form?: 'dry' | 'liquid';
    attenuationMinPct?: number;
    attenuationMaxPct?: number;
    alcoholTolerancePct?: number;
    tempRangeCMin?: number;
    tempRangeCMax?: number;
    flocculation?: 'low' | 'med' | 'high';
    fermentationSpeed?: 'slow' | 'med' | 'fast';
    preferredSugars?: string[];
    sorbitolNonfermentable?: boolean;
    glycerolProduction?: 'low' | 'med' | 'high';
    h2sRisk?: 'low' | 'med' | 'high';
    esterProfile?: string[];
    phenolProfile?: string[];
    mouthfeelEffect?: 'thin' | 'neutral' | 'round';
    aromaticIntensity?: number; // 1-5
    nutrientDemand?: 'low' | 'med' | 'high';
    rehydrationRequired?: boolean;
    killerFactor?: boolean;
  }>(),
  
  // Malt/Grain fields
  maltData: json('malt_data').$type<{
    grainType?: string;
    maltster?: string;
    origin?: string;
    ppg?: number; // Points per pound per gallon
    extractYieldPct?: number;
    moisturePct?: number;
    fermentability?: 'low' | 'med' | 'high';
    dextrinContribution?: 'low' | 'med' | 'high';
    colorLovibond?: number;
    bodyContribution?: number; // 1-5
    headRetentionEffect?: string;
    flavorNotes?: string[];
    sweetnessContribution?: number; // 1-5
    toastRoastLevel?: string;
  }>(),
  
  // Hops fields
  hopsData: json('hops_data').$type<{
    variety?: string;
    origin?: string;
    harvestYear?: number;
    alphaAcidPct?: number;
    betaAcidPct?: number;
    oilTotalMl100g?: number;
    oilBreakdown?: Record<string, number>; // myrcene, humulene, etc.
    aromaDescriptors?: string[];
    flavorDescriptors?: string[];
    perceivedBitternessQuality?: 'soft' | 'sharp' | 'resinous';
    storageIndex?: number;
    oxidationSensitivity?: string;
  }>(),
  
  // Fruit/Juice fields
  fruitData: json('fruit_data').$type<{
    glucosePct?: number;
    fructosePct?: number;
    sucrosePct?: number;
    sorbitolPct?: number;
    totalSugarGL?: number;
    brix?: number;
    phMin?: number;
    phMax?: number;
    taGLMin?: number;
    taGLMax?: number;
    dominantAcid?: string;
    polyphenolIndex?: number;
    tanninLevel?: 'low' | 'med' | 'high';
    pectinLevel?: string;
    yanMgLMin?: number;
    yanMgLMax?: number;
    clarified?: boolean;
    pasteurized?: boolean;
    concentrate?: boolean;
    harvestVarianceRating?: string;
    sourceVarianceRating?: string;
  }>(),
  
  // Additive fields
  additiveData: json('additive_data').$type<{
    functionalRole?: 'acid' | 'tannin' | 'nutrient' | 'enzyme' | 'fining' | 'other';
    effectiveRangeMin?: number;
    effectiveRangeMax?: number;
    activeCompound?: string;
    solubility?: string;
    reactionTime?: string;
    primaryEffect?: string;
    secondaryEffect?: string;
    overuseRisk?: string;
  }>(),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  categoryIdx: index('category_idx').on(table.category),
  codeIdx: index('code_idx').on(table.itemCode),
}));

// ============================================================================
// LOTS (Traceability)
// ============================================================================

export const lots = mysqlTable('lots', {
  id: int('id').primaryKey().autoincrement(),
  itemId: int('item_id').notNull(),
  lotNumber: varchar('lot_number', { length: 100 }).notNull(),
  supplierLotRef: varchar('supplier_lot_ref', { length: 100 }),
  receivedDate: timestamp('received_date'),
  expirationDate: timestamp('expiration_date'),
  bestBeforeDate: timestamp('best_before_date'),
  manufacturingDate: timestamp('manufacturing_date'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  itemIdx: index('item_idx').on(table.itemId),
  lotIdx: index('lot_idx').on(table.lotNumber),
}));

// ============================================================================
// INVENTORY LEDGER (Canonical Movement Log)
// ============================================================================

export const inventoryLedger = mysqlTable('inventory_ledger', {
  id: int('id').primaryKey().autoincrement(),
  transactionDate: timestamp('transaction_date').notNull().defaultNow(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // receipt, consumption, production, transfer, adjustment, waste
  itemId: int('item_id').notNull(),
  lotId: int('lot_id'),
  locationId: int('location_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(), // Positive = in, Negative = out
  uom: varchar('uom', { length: 20 }).notNull(),
  
  // References
  batchId: int('batch_id'), // If related to batch
  transferId: int('transfer_id'), // If related to transfer
  referenceDoc: varchar('reference_doc', { length: 100 }), // PO#, SO#, etc. (OPS will use this)
  
  // Cost tracking (for COGS calculation)
  unitCost: decimal('unit_cost', { precision: 15, scale: 4 }),
  totalCost: decimal('total_cost', { precision: 15, scale: 4 }),
  
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  itemIdx: index('item_idx').on(table.itemId),
  locationIdx: index('location_idx').on(table.locationId),
  batchIdx: index('batch_idx').on(table.batchId),
  dateIdx: index('date_idx').on(table.transactionDate),
  typeIdx: index('type_idx').on(table.transactionType),
}));

// ============================================================================
// INVENTORY BALANCES (Current State - Derived from Ledger)
// ============================================================================

export const inventoryBalances = mysqlTable('inventory_balances', {
  itemId: int('item_id').notNull(),
  lotId: int('lot_id'),
  locationId: int('location_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull().default('0'),
  uom: varchar('uom', { length: 20 }).notNull(),
  lastMovement: timestamp('last_movement'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.itemId, table.locationId, table.lotId] }),
  itemIdx: index('item_idx').on(table.itemId),
  locationIdx: index('location_idx').on(table.locationId),
}));

// ============================================================================
// BATCHES (Production Runs)
// ============================================================================

export const batches = mysqlTable('batches', {
  id: int('id').primaryKey().autoincrement(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull().unique(),
  batchName: varchar('batch_name', { length: 255 }).notNull(),
  recipeId: int('recipe_id'), // Reference to LAB recipe (when LAB installed)
  productItemId: int('product_item_id'), // What finished good this produces
  
  status: varchar('status', { length: 50 }).notNull().default('planned'), // planned, in_progress, fermenting, conditioning, packaging, completed, cancelled
  
  // Volumes
  plannedVolume: decimal('planned_volume', { precision: 15, scale: 4 }),
  actualVolume: decimal('actual_volume', { precision: 15, scale: 4 }),
  volumeUom: varchar('volume_uom', { length: 20 }),
  
  // Gravity readings
  originalGravity: decimal('original_gravity', { precision: 6, scale: 4 }),
  finalGravity: decimal('final_gravity', { precision: 6, scale: 4 }),
  
  // Dates
  startDate: timestamp('start_date'),
  brewDate: timestamp('brew_date'),
  fermentationStartDate: timestamp('fermentation_start_date'),
  fermentationEndDate: timestamp('fermentation_end_date'),
  packagingDate: timestamp('packaging_date'),
  completedDate: timestamp('completed_date'),
  
  // Location tracking
  currentLocationId: int('current_location_id'), // Current vessel/tank
  
  // Costing
  totalCost: decimal('total_cost', { precision: 15, scale: 4 }),
  costPerUnit: decimal('cost_per_unit', { precision: 15, scale: 4 }),
  
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  statusIdx: index('status_idx').on(table.status),
  productIdx: index('product_idx').on(table.productItemId),
  locationIdx: index('location_idx').on(table.currentLocationId),
}));

// ============================================================================
// BATCH MATERIALS (Planned vs Actual Usage)
// ============================================================================

export const batchMaterials = mysqlTable('batch_materials', {
  id: int('id').primaryKey().autoincrement(),
  batchId: int('batch_id').notNull(),
  itemId: int('item_id').notNull(),
  lotId: int('lot_id'),
  
  // Planned
  plannedQuantity: decimal('planned_quantity', { precision: 15, scale: 4 }).notNull(),
  plannedUom: varchar('planned_uom', { length: 20 }).notNull(),
  
  // Actual
  actualQuantity: decimal('actual_quantity', { precision: 15, scale: 4 }),
  actualUom: varchar('actual_uom', { length: 20 }),
  
  // Costing
  unitCost: decimal('unit_cost', { precision: 15, scale: 4 }),
  totalCost: decimal('total_cost', { precision: 15, scale: 4 }),
  
  addedAt: timestamp('added_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  batchIdx: index('batch_idx').on(table.batchId),
  itemIdx: index('item_idx').on(table.itemId),
}));

// ============================================================================
// BATCH OUTPUTS (What Batches Produce)
// ============================================================================

export const batchOutputs = mysqlTable('batch_outputs', {
  id: int('id').primaryKey().autoincrement(),
  batchId: int('batch_id').notNull(),
  itemId: int('item_id').notNull(), // Finished good item
  lotId: int('lot_id'), // Generated lot for output
  locationId: int('location_id').notNull(), // Where output is stored
  
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  
  outputDate: timestamp('output_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  batchIdx: index('batch_idx').on(table.batchId),
  itemIdx: index('item_idx').on(table.itemId),
  locationIdx: index('location_idx').on(table.locationId),
}));

// ============================================================================
// BATCH TRANSFERS (Tank/Vessel Movements)
// ============================================================================

export const batchTransfers = mysqlTable('batch_transfers', {
  id: int('id').primaryKey().autoincrement(),
  batchId: int('batch_id').notNull(),
  fromLocationId: int('from_location_id').notNull(),
  toLocationId: int('to_location_id').notNull(),
  
  transferType: varchar('transfer_type', { length: 50 }).notNull(), // fermentor_to_bright, bright_to_keg, bright_to_barrel, etc.
  
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  
  // Readings at transfer
  gravity: decimal('gravity', { precision: 6, scale: 4 }),
  temperature: decimal('temperature', { precision: 5, scale: 2 }),
  temperatureUnit: varchar('temperature_unit', { length: 1 }).default('F'), // F or C
  
  transferDate: timestamp('transfer_date').notNull(),
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  batchIdx: index('batch_idx').on(table.batchId),
  fromIdx: index('from_idx').on(table.fromLocationId),
  toIdx: index('to_idx').on(table.toLocationId),
  dateIdx: index('date_idx').on(table.transferDate),
}));

// ============================================================================
// FERMENTATION LOGS (Temperature, Gravity Tracking)
// ============================================================================

export const fermentationLogs = mysqlTable('fermentation_logs', {
  id: int('id').primaryKey().autoincrement(),
  batchId: int('batch_id').notNull(),
  logDate: timestamp('log_date').notNull(),
  
  gravity: decimal('gravity', { precision: 6, scale: 4 }),
  temperature: decimal('temperature', { precision: 5, scale: 2 }),
  temperatureUnit: varchar('temperature_unit', { length: 1 }).default('F'),
  
  ph: decimal('ph', { precision: 4, scale: 2 }),
  pressure: decimal('pressure', { precision: 6, scale: 2 }),
  pressureUnit: varchar('pressure_unit', { length: 10 }).default('PSI'),
  
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  batchIdx: index('batch_idx').on(table.batchId),
  dateIdx: index('date_idx').on(table.logDate),
}));

// ============================================================================
// OS CONTROL PANEL TABLES
// ============================================================================

// ============================================================================
// CONTROLLER NODES (Physical Hardware)
// ============================================================================

export const controllerNodes = mysqlTable('controller_nodes', {
  id: int('id').primaryKey().autoincrement(),
  nodeId: varchar('node_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  nodeType: varchar('node_type', { length: 50 }).notNull(), // raspberry_pi, esp32, arduino, io_hub
  ipAddress: varchar('ip_address', { length: 45 }),
  macAddress: varchar('mac_address', { length: 17 }),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('offline'), // online, offline, fault, maintenance
  lastSeen: timestamp('last_seen'),
  lastHeartbeat: timestamp('last_heartbeat'),
  
  // Capabilities
  capabilities: json('capabilities').$type<{
    digitalOutputs?: number;
    digitalInputs?: number;
    pwmOutputs?: number;
    analogInputs?: number;
    oneWireBus?: boolean;
    i2cBus?: boolean;
    spiBus?: boolean;
    bleBluetooth?: boolean;
  }>(),
  
  // Configuration
  config: json('config').$type<{
    pollingIntervalMs?: number;
    timeoutMs?: number;
    retryAttempts?: number;
    failsafeMode?: 'all_off' | 'hold_last' | 'custom';
  }>(),
  
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  nodeIdIdx: index('node_id_idx').on(table.nodeId),
  statusIdx: index('status_idx').on(table.status),
  activeIdx: index('active_idx').on(table.isActive),
}));

// ============================================================================
// HARDWARE ENDPOINTS (I/O Channels)
// ============================================================================

export const hardwareEndpoints = mysqlTable('hardware_endpoints', {
  id: int('id').primaryKey().autoincrement(),
  controllerId: int('controller_id').notNull(),
  channelId: varchar('channel_id', { length: 100 }).notNull(),
  
  // Capability metadata
  endpointKind: varchar('endpoint_kind', { length: 20 }).notNull(), // DI, DO, AI, AO, PWM, I2C, SPI, UART, 1WIRE, MODBUS, VIRTUAL
  valueType: varchar('value_type', { length: 20 }).notNull(), // bool, int, float, string, json
  direction: varchar('direction', { length: 20 }).notNull(), // input, output, bidirectional
  
  // Units and scaling
  unit: varchar('unit', { length: 50 }),
  rangeMin: decimal('range_min', { precision: 15, scale: 4 }),
  rangeMax: decimal('range_max', { precision: 15, scale: 4 }),
  scale: decimal('scale', { precision: 15, scale: 6 }),
  offset: decimal('offset', { precision: 15, scale: 4 }),
  invert: boolean('invert').notNull().default(false),
  
  // Timing
  samplePeriodMs: int('sample_period_ms'),
  
  // Output behavior
  writeMode: varchar('write_mode', { length: 20 }), // latched, momentary, pulse
  pulseDurationMs: int('pulse_duration_ms'),
  
  // Safety
  failsafeValue: varchar('failsafe_value', { length: 255 }),
  
  // Configuration (endpoint-specific)
  config: json('config').$type<{
    // Digital output
    invertLogic?: boolean;
    
    // PWM output
    pwmFrequencyHz?: number;
    pwmResolutionBits?: number;
    
    // Analog input
    adcResolutionBits?: number;
    voltageRangeMin?: number;
    voltageRangeMax?: number;
    
    // Pulse input (flow meter)
    pulsesPerUnit?: number;
    debounceMs?: number;
    
    // Temperature sensor
    sensorAddress?: string;
    offsetCalibration?: number;
    
    // BLE device
    bleAddress?: string;
    bleServiceUuid?: string;
    
    // Modbus
    modbusAddress?: number;
    modbusRegister?: number;
    modbusFunction?: number;
  }>(),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('ok'), // ok, fault, disconnected, calibrating
  lastRead: timestamp('last_read'),
  lastWrite: timestamp('last_write'),
  
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  controllerIdx: index('controller_idx').on(table.controllerId),
  kindIdx: index('kind_idx').on(table.endpointKind),
  statusIdx: index('status_idx').on(table.status),
  activeIdx: index('active_idx').on(table.isActive),
}));

// ============================================================================
// ENDPOINT CURRENT (Fast-access cache)
// ============================================================================

export const endpointCurrent = mysqlTable('endpoint_current', {
  endpointId: int('endpoint_id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  
  // Value columns
  valueBool: boolean('value_bool'),
  valueInt: int('value_int'),
  valueFloat: decimal('value_float', { precision: 15, scale: 6 }),
  valueString: varchar('value_string', { length: 255 }),
  valueJson: json('value_json'),
  
  // Quality
  quality: varchar('quality', { length: 20 }).notNull().default('good'), // good, uncertain, bad
  qualityReason: varchar('quality_reason', { length: 255 }),
  
  // Source
  source: varchar('source', { length: 20 }).notNull().default('hardware'), // hardware, derived, manual, sim
  
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ============================================================================
// DEVICE TILES (Virtual Devices on Canvas)
// ============================================================================

export const deviceTiles = mysqlTable('device_tiles', {
  id: int('id').primaryKey().autoincrement(),
  tileId: varchar('tile_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  tileType: varchar('tile_type', { length: 50 }).notNull(), // vessel, temp_sensor, pump, valve, etc.
  
  // Canvas position
  positionX: decimal('position_x', { precision: 10, scale: 2 }),
  positionY: decimal('position_y', { precision: 10, scale: 2 }),
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  
  // Visual
  iconName: varchar('icon_name', { length: 100 }),
  colorTheme: varchar('color_theme', { length: 50 }),
  
  // Type-specific configuration
  config: json('config'),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('operational'), // operational, warning, error, offline, maintenance
  
  // Grouping
  groupId: int('group_id'),
  parentTileId: int('parent_tile_id'),
  
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  tileIdIdx: index('tile_id_idx').on(table.tileId),
  typeIdx: index('type_idx').on(table.tileType),
  statusIdx: index('status_idx').on(table.status),
  groupIdx: index('group_idx').on(table.groupId),
  parentIdx: index('parent_idx').on(table.parentTileId),
  activeIdx: index('active_idx').on(table.isActive),
}));

// ============================================================================
// TILE ENDPOINT BINDINGS (Multi-bind support)
// ============================================================================

export const tileEndpointBindings = mysqlTable('tile_endpoint_bindings', {
  id: int('id').primaryKey().autoincrement(),
  tileId: int('tile_id').notNull(),
  endpointId: int('endpoint_id').notNull(),
  
  // Binding semantics
  bindingRole: varchar('binding_role', { length: 50 }).notNull(), // pv, sp, output, state, alarm, permissive
  direction: varchar('direction', { length: 20 }).notNull(), // read, write, bidirectional
  
  // Role label
  role: varchar('role', { length: 100 }),
  
  // Scaling/transformation per binding
  transform: json('transform').$type<{
    scale?: number;
    offset?: number;
    invert?: boolean;
    clamp?: { min: number; max: number };
    deadband?: number;
    smoothing?: number;
    mapTable?: Array<{ input: number; output: number }>;
    formula?: string;
    debounceMs?: number;
  }>(),
  
  // Priority
  priority: int('priority').notNull().default(0),
  order: int('order').notNull().default(0),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  tileIdx: index('tile_idx').on(table.tileId),
  endpointIdx: index('endpoint_idx').on(table.endpointId),
  roleIdx: index('role_idx').on(table.bindingRole),
  directionIdx: index('direction_idx').on(table.direction),
  activeIdx: index('active_idx').on(table.isActive),
}));

// ============================================================================
// DEVICE GROUPS (Layout, Safety Zones, Manifolds)
// ============================================================================

export const deviceGroups = mysqlTable('device_groups', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  groupType: varchar('group_type', { length: 50 }).notNull(), // layout, safety_zone, manifold, batch_area, custom
  
  // Rules
  rules: json('rules').$type<{
    mutualExclusion?: boolean;
    sequenceRequired?: boolean;
    interlockGroupId?: number;
  }>(),
  
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  typeIdx: index('type_idx').on(table.groupType),
  activeIdx: index('active_idx').on(table.isActive),
}));

// ============================================================================
// SYSTEM SAFETY STATE (E-stop, Global Interlocks)
// ============================================================================

export const systemSafetyState = mysqlTable('system_safety_state', {
  id: int('id').primaryKey().autoincrement(),
  siteId: varchar('site_id', { length: 100 }).notNull().unique(),
  
  // E-stop state
  estopActive: boolean('estop_active').notNull().default(false),
  estopSource: varchar('estop_source', { length: 255 }),
  estopActivatedAt: timestamp('estop_activated_at'),
  estopLatched: boolean('estop_latched').notNull().default(false),
  
  // Global safety mode
  safetyMode: varchar('safety_mode', { length: 50 }).notNull().default('normal'), // normal, restricted, maintenance, emergency
  
  // Acknowledgment
  ackRequired: boolean('ack_required').notNull().default(false),
  ackedBy: varchar('acked_by', { length: 100 }),
  ackedAt: timestamp('acked_at'),
  
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  siteIdx: index('site_idx').on(table.siteId),
}));

// ============================================================================
// SYSTEM SAFETY LOG (Safety State Transitions)
// ============================================================================

export const systemSafetyLog = mysqlTable('system_safety_log', {
  id: int('id').primaryKey().autoincrement(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  siteId: varchar('site_id', { length: 100 }).notNull(),
  
  // Transition
  previousState: varchar('previous_state', { length: 100 }).notNull(),
  newState: varchar('new_state', { length: 100 }).notNull(),
  
  // Cause
  triggeredBy: varchar('triggered_by', { length: 255 }).notNull(),
  reason: text('reason').notNull(),
  
  // Action taken
  actionsTaken: json('actions_taken').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  siteIdx: index('site_idx').on(table.siteId),
}));

// ============================================================================
// TELEMETRY READINGS (Time-series Process Values)
// ============================================================================

export const telemetryReadings = mysqlTable('telemetry_readings', {
  id: int('id').primaryKey().autoincrement(),
  timestamp: timestamp('timestamp').notNull(),
  endpointId: int('endpoint_id').notNull(),
  tileId: int('tile_id'),
  
  // Value columns
  valueBool: boolean('value_bool'),
  valueNum: decimal('value_num', { precision: 15, scale: 6 }),
  valueString: varchar('value_string', { length: 255 }),
  valueJson: json('value_json'),
  
  // Metadata
  unit: varchar('unit', { length: 50 }),
  
  // Quality
  quality: varchar('quality', { length: 20 }).notNull().default('good'), // good, uncertain, bad
  qualityReason: varchar('quality_reason', { length: 255 }),
  
  // Source
  source: varchar('source', { length: 20 }).notNull().default('hardware'), // hardware, derived, manual, sim
  
  // Context
  batchId: int('batch_id'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  endpointTimestampIdx: index('endpoint_timestamp_idx').on(table.endpointId, table.timestamp),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  tileIdx: index('tile_idx').on(table.tileId),
  batchIdx: index('batch_idx').on(table.batchId),
  qualityIdx: index('quality_idx').on(table.quality),
}));

// ============================================================================
// COMMAND LOG (Audit Trail with Full Lifecycle)
// ============================================================================

export const commandLog = mysqlTable('command_log', {
  id: int('id').primaryKey().autoincrement(),
  commandId: varchar('command_id', { length: 100 }).notNull().unique(),
  correlationId: varchar('correlation_id', { length: 100 }).notNull(),
  
  // Timing (full lifecycle)
  requestedAt: timestamp('requested_at').notNull(),
  sentAt: timestamp('sent_at'),
  ackedAt: timestamp('acked_at'),
  completedAt: timestamp('completed_at'),
  
  // Command details
  commandType: varchar('command_type', { length: 50 }).notNull(), // manual, automation, safety, system
  action: varchar('action', { length: 100 }).notNull(),
  
  // Target
  targetTileId: int('target_tile_id'),
  targetEndpointId: int('target_endpoint_id'),
  
  // Command data
  requestedValue: varchar('requested_value', { length: 255 }),
  appliedValue: varchar('applied_value', { length: 255 }),
  previousValue: varchar('previous_value', { length: 255 }),
  
  commandData: json('command_data').$type<{
    duration?: number;
    reason?: string;
    parameters?: any;
  }>(),
  
  // Result
  status: varchar('status', { length: 50 }).notNull().default('queued'), // queued, sent, acked, succeeded, failed, blocked
  failureReason: text('failure_reason'),
  
  // Attribution
  requestedByUserId: varchar('requested_by_user_id', { length: 100 }),
  requestedByService: varchar('requested_by_service', { length: 100 }),
  
  // Safety
  interlockCheckPassed: boolean('interlock_check_passed').notNull().default(true),
  blockedByInterlockId: int('blocked_by_interlock_id'),
  interlockDetails: text('interlock_details'),
  
  // Node response
  nodeResponse: json('node_response').$type<{
    errorCode?: string;
    message?: string;
    rawResponse?: any;
  }>(),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  requestedAtIdx: index('requested_at_idx').on(table.requestedAt),
  correlationIdx: index('correlation_idx').on(table.correlationId),
  commandIdIdx: index('command_id_idx').on(table.commandId),
  statusIdx: index('status_idx').on(table.status),
  tileIdx: index('tile_idx').on(table.targetTileId),
  userIdx: index('user_idx').on(table.requestedByUserId),
}));

// ============================================================================
// SAFETY INTERLOCKS (Safety Rules with Full Action Types)
// ============================================================================

export const safetyInterlocks = mysqlTable('safety_interlocks', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  // Scope
  interlockType: varchar('interlock_type', { length: 50 }).notNull(), // estop, permissive, conditional, timer
  mode: varchar('mode', { length: 50 }).notNull(), // permissive, trip, advisory
  priority: int('priority').notNull().default(0),
  
  // Condition
  condition: json('condition').$type<{
    inputTileId?: number;
    requiredState?: boolean;
    targetTileId?: number;
    targetState?: string;
    minOffTimeSeconds?: number;
    minOnTimeSeconds?: number;
    expression?: string;
  }>(),
  
  // Action
  affectedTiles: json('affected_tiles').$type<number[]>(),
  blockActions: json('block_actions').$type<string[]>(),
  
  // Response
  onViolationAction: varchar('on_violation_action', { length: 50 }).notNull(), // block, force_off, force_value, latch_until_ack
  forceValue: varchar('force_value', { length: 255 }),
  alarmMessage: text('alarm_message'),
  
  // Latching and acknowledgment
  latched: boolean('latched').notNull().default(false),
  ackRequired: boolean('ack_required').notNull().default(false),
  
  // Severity
  severity: varchar('severity', { length: 50 }).notNull().default('warning'), // info, warning, critical
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  lastTriggered: timestamp('last_triggered'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  typeIdx: index('type_idx').on(table.interlockType),
  modeIdx: index('mode_idx').on(table.mode),
  priorityIdx: index('priority_idx').on(table.priority),
  severityIdx: index('severity_idx').on(table.severity),
  activeIdx: index('active_idx').on(table.isActive),
}));

// ============================================================================
// INTERLOCK EVALUATIONS (Explainability Log)
// ============================================================================

export const interlockEvaluations = mysqlTable('interlock_evaluations', {
  id: int('id').primaryKey().autoincrement(),
  interlockId: int('interlock_id').notNull(),
  evaluatedAt: timestamp('evaluated_at').notNull(),
  
  // Result
  result: varchar('result', { length: 20 }).notNull(), // pass, fail
  
  // Details (explainability)
  details: json('details').$type<{
    conditionFailed?: string;
    currentPVs?: Record<string, number | boolean>;
    thresholds?: Record<string, number | boolean>;
    involvedBindings?: number[];
    affectedCommand?: string;
  }>(),
  
  // Action taken
  actionTaken: varchar('action_taken', { length: 255 }),
  
  // Context
  commandLogId: int('command_log_id'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  interlockIdx: index('interlock_idx').on(table.interlockId),
  evaluatedAtIdx: index('evaluated_at_idx').on(table.evaluatedAt),
  resultIdx: index('result_idx').on(table.result),
  commandIdx: index('command_idx').on(table.commandLogId),
}));

// ============================================================================
// DEVICE STATE HISTORY (State Change Tracking)
// ============================================================================

export const deviceStateHistory = mysqlTable('device_state_history', {
  id: int('id').primaryKey().autoincrement(),
  timestamp: timestamp('timestamp').notNull(),
  tileId: int('tile_id').notNull(),
  
  // State change
  previousState: varchar('previous_state', { length: 255 }).notNull(),
  newState: varchar('new_state', { length: 255 }).notNull(),
  
  // Context
  changeReason: varchar('change_reason', { length: 50 }).notNull(), // manual, automation, safety, timeout, fault
  commandLogId: int('command_log_id'),
  
  // Duration tracking
  durationSeconds: int('duration_seconds'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  tileIdx: index('tile_idx').on(table.tileId),
  reasonIdx: index('reason_idx').on(table.changeReason),
}));

// ============================================================================
// ALARM EVENTS (Alarm Tracking and Acknowledgment)
// ============================================================================

export const alarmEvents = mysqlTable('alarm_events', {
  id: int('id').primaryKey().autoincrement(),
  timestamp: timestamp('timestamp').notNull(),
  
  // Source
  tileId: int('tile_id'),
  endpointId: int('endpoint_id'),
  alarmType: varchar('alarm_type', { length: 50 }).notNull(), // high, low, fault, offline, safety, custom
  severity: varchar('severity', { length: 50 }).notNull(), // info, warning, critical
  
  // Details
  message: text('message').notNull(),
  value: varchar('value', { length: 255 }),
  threshold: varchar('threshold', { length: 255 }),
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, acknowledged, cleared, suppressed
  acknowledgedBy: varchar('acknowledged_by', { length: 100 }),
  acknowledgedAt: timestamp('acknowledged_at'),
  clearedAt: timestamp('cleared_at'),
  
  // Context
  batchId: int('batch_id'),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  timestampIdx: index('timestamp_idx').on(table.timestamp),
  tileIdx: index('tile_idx').on(table.tileId),
  endpointIdx: index('endpoint_idx').on(table.endpointId),
  statusIdx: index('status_idx').on(table.status),
  severityIdx: index('severity_idx').on(table.severity),
  typeIdx: index('type_idx').on(table.alarmType),
}));
