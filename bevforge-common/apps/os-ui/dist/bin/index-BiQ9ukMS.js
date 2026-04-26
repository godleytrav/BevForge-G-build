import express from 'express';
import path from 'node:path';
import { readFileSync, constants } from 'node:fs';
import fs from 'node:fs/promises';
import { c as commissioningPaths, h as handler$1, r as readRecipeRunsState, w as writeRecipeRunsState } from './api/os/recipes/import/POST-B16W0CFH.js';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { mysqlTable, timestamp, decimal, varchar, int, text, boolean, index, json, primaryKey } from 'drizzle-orm/mysql-core';
import { h as handler$2 } from './api/calendar/events/GET-DNBekL63.js';
import { h as handler$3 } from './api/calendar/events/POST-1Wn8nY2A.js';
import { h as handler$4 } from './api/commerce/create-checkout-session/POST-vy5ncz3K.js';
import { h as handler$5 } from './api/health/GET-CzFTnlth.js';
import { h as handler$6 } from './api/os/alarms/GET-CrZbhsBT.js';
import { h as handler$7 } from './api/os/automation/preview/POST-9t5IqZ5t.js';
import { h as handler$8 } from './api/os/automation/run/POST-C5jdG3c5.js';
import { h as handler$9 } from './api/os/automation/run/_runId_/stop/POST-BXDX6foY.js';
import { h as handler$a } from './api/os/automation/runs/GET-Db56UGmy.js';
import { h as handler$b } from './api/os/availability/GET-CCSKE-e3.js';
import { h as handler$c } from './api/os/batches/GET-BqayXPZJ.js';
import { h as handler$d } from './api/os/batches/POST-DA9qVwiY.js';
import { h as handler$e } from './api/os/batches/_batchId_/PUT-BqUhJLoz.js';
import { h as handler$f } from './api/os/bindings/GET-CBlLeGPj.js';
import { h as handler$g } from './api/os/canvas/project/GET-CnmRXS_Q.js';
import { h as handler$h } from './api/os/canvas/project/PUT-Cdap9Aq4.js';
import { h as handler$i } from './api/os/command/POST-B6XVB7C8.js';
import { h as handler$j } from './api/os/command/_commandId_/GET-MWQ0qNtW.js';
import { h as handler$k } from './api/os/endpoints/GET--VFXnif2.js';
import { h as handler$l } from './api/os/flow/pour-events/GET-LI4duKA3.js';
import { h as handler$m } from './api/os/flow/pour-events/POST-BiAC8STh.js';
import { h as handler$n } from './api/os/flow/profile/GET-BMXGnYPo.js';
import { h as handler$o } from './api/os/flow/profiles/GET-DkjfeaiI.js';
import { h as handler$p } from './api/os/flow/publish/POST-BmQ5MolT.js';
import { h as handler$q } from './api/os/flow/runtime-state/GET-C_mAHd3N.js';
import { h as handler$r } from './api/os/flow/runtime-state/POST-EN2fjUX3.js';
import { h as handler$s } from './api/os/groups/GET-AIkilshN.js';
import { h as handler$t } from './api/os/inventory/GET-CrrFrEI-.js';
import { h as handler$u } from './api/os/inventory/POST-63DoxhBH.js';
import { h as handler$v } from './api/os/inventory/movements/GET-nEKUmT4-.js';
import { h as handler$w } from './api/os/lab/drafts/GET-DQPGGql2.js';
import { h as handler$x } from './api/os/lab/drafts/POST-BWiZOCSv.js';
import { h as handler$y } from './api/os/lab/handoff-audit/GET-D2tje6Er.js';
import { h as handler$z } from './api/os/lab/handoff-audit/POST-rTRQjd0z.js';
import { h as handler$A } from './api/os/nodes/GET-DNrAg92b.js';
import { h as handler$B } from './api/os/recipes/GET-BkbgHPUS.js';
import { h as handler$C } from './api/os/recipes/equipment-map/GET-B3amRtsA.js';
import { h as handler$D } from './api/os/recipes/equipment-map/PUT-BOx4CE2l.js';
import { h as handler$E } from './api/os/recipes/inbox/scan/POST-GdIMZvhK.js';
import { h as handler$F } from './api/os/recipes/inbox/status/GET-nW5ddx7w.js';
import { h as handler$G } from './api/os/recipes/preflight/POST-CjPXUHbZ.js';
import { h as handler$H } from './api/os/recipes/run/start/POST-D6Buh6_-.js';
import { h as handler$I } from './api/os/recipes/run/_runId_/action/POST-KeDHAeBT.js';
import { h as handler$J } from './api/os/recipes/run/_runId_/readings/GET-DTywQnbH.js';
import { h as handler$K } from './api/os/recipes/run/_runId_/readings/POST-B03OoVgz.js';
import { h as handler$L } from './api/os/recipes/run/_runId_/readings/snapshot/POST-BtKu5lO2.js';
import { h as handler$M } from './api/os/recipes/run/_runId_/runboard/GET-9w4Y4NW_.js';
import { h as handler$N } from './api/os/recipes/run/_runId_/runboard/PUT-BARVGufU.js';
import { h as handler$O } from './api/os/recipes/run/_runId_/steps/_stepId_/PUT-CyklW7nd.js';
import { h as handler$P } from './api/os/recipes/run/_runId_/transfer/POST-D07T26AX.js';
import { h as handler$Q } from './api/os/recipes/runs/GET-BTXE7ND6.js';
import { h as handler$R } from './api/os/recipes/runs/reset/POST-DRzOisgq.js';
import { h as handler$S } from './api/os/recipes/transfer-map/GET-Bp9Lgxsk.js';
import { h as handler$T } from './api/os/recipes/transfer-map/PUT-8gcu6bK4.js';
import { h as handler$U } from './api/os/recipes/transfer-map/autofill/POST-DwOgle3C.js';
import { h as handler$V } from './api/os/registry/devices/GET-BTjrmZ2S.js';
import { h as handler$W } from './api/os/registry/devices/PUT-21RfBEzI.js';
import { h as handler$X } from './api/os/reservations/POST-CY1ug9iS.js';
import { h as handler$Y } from './api/os/reservations/_reservationId_/action/POST-DeWkyaX7.js';
import { h as handler$Z } from './api/os/telemetry/latest/GET-3oiY6Phk.js';
import { h as handler$_ } from './api/os/tiles/GET-BX2eJd-q.js';
import { h as handler$$ } from './api/os/tiles/_tileId_/GET-DX-KSLe9.js';

function getDatabaseCredentials() {
  const localPath = new URL("../../../config.json", import.meta.url).pathname;
  const allocPath = "/alloc/config.json";
  const read = (path) => JSON.parse(readFileSync(path, "utf8"));
  try {
    const cfg = read(localPath);
    const db = cfg.db ?? cfg.database ?? cfg;
    return {
      host: db.host ?? "localhost",
      port: db.port ?? 5432,
      user: db.user ?? "postgres",
      password: db.password ?? "postgres",
      database: db.database ?? "postgres"
    };
  } catch {
  }
  try {
    const cfg = read(allocPath);
    const db = cfg.db ?? cfg.database ?? cfg;
    return {
      host: db.host ?? "localhost",
      port: db.port ?? 5432,
      user: db.user ?? "postgres",
      password: db.password ?? "postgres",
      database: db.database ?? "postgres"
    };
  } catch {
    return { host: "localhost", port: 5432, user: "postgres", password: "postgres", database: "postgres" };
  }
}

const unitsOfMeasure = mysqlTable("units_of_measure", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  // gal, L, lb, kg, bbl, oz, etc.
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  // volume, weight, count
  baseUnit: varchar("base_unit", { length: 20 }),
  // Reference to base unit for conversions
  conversionFactor: decimal("conversion_factor", { precision: 20, scale: 10 }),
  // Factor to convert to base unit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
const locations = mysqlTable("locations", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  // Alphanumeric: "WH1-A-12-3"
  name: varchar("name", { length: 255 }).notNull(),
  parentId: int("parent_id"),
  // Self-reference for hierarchy
  locationType: varchar("location_type", { length: 50 }).notNull(),
  // warehouse, zone, aisle, shelf, bin, rack, barrel
  level: int("level").notNull().default(0),
  // 0=warehouse, 1=zone, 2=aisle, etc.
  capacity: decimal("capacity", { precision: 15, scale: 4 }),
  // Optional capacity
  capacityUom: varchar("capacity_uom", { length: 20 }),
  // Unit for capacity
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  parentIdx: index("parent_idx").on(table.parentId),
  typeIdx: index("type_idx").on(table.locationType)
}));
const items = mysqlTable("items", {
  id: int("id").primaryKey().autoincrement(),
  itemCode: varchar("item_code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  // yeast, malt, hops, fruit, additive, packaging, finished_good
  subcategory: varchar("subcategory", { length: 100 }),
  // ale_yeast, base_malt, aroma_hops, etc.
  // Inventory control
  trackLots: boolean("track_lots").notNull().default(true),
  defaultUom: varchar("default_uom", { length: 20 }).notNull(),
  // Primary unit
  alternateUom: varchar("alternate_uom", { length: 20 }),
  // Secondary unit
  conversionFactor: decimal("conversion_factor", { precision: 20, scale: 10 }),
  // Alternate to default
  // Costing (OS owns last cost for production planning)
  lastCost: decimal("last_cost", { precision: 15, scale: 4 }),
  costUom: varchar("cost_uom", { length: 20 }),
  // Reorder (basic - OPS extends this)
  reorderPoint: decimal("reorder_point", { precision: 15, scale: 4 }),
  reorderQty: decimal("reorder_qty", { precision: 15, scale: 4 }),
  // Category-specific data (JSON for flexibility)
  // Yeast fields
  yeastData: json("yeast_data").$type(),
  // Malt/Grain fields
  maltData: json("malt_data").$type(),
  // Hops fields
  hopsData: json("hops_data").$type(),
  // Fruit/Juice fields
  fruitData: json("fruit_data").$type(),
  // Additive fields
  additiveData: json("additive_data").$type(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  codeIdx: index("code_idx").on(table.itemCode)
}));
const lots = mysqlTable("lots", {
  id: int("id").primaryKey().autoincrement(),
  itemId: int("item_id").notNull(),
  lotNumber: varchar("lot_number", { length: 100 }).notNull(),
  supplierLotRef: varchar("supplier_lot_ref", { length: 100 }),
  receivedDate: timestamp("received_date"),
  expirationDate: timestamp("expiration_date"),
  bestBeforeDate: timestamp("best_before_date"),
  manufacturingDate: timestamp("manufacturing_date"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  itemIdx: index("item_idx").on(table.itemId),
  lotIdx: index("lot_idx").on(table.lotNumber)
}));
const inventoryLedger = mysqlTable("inventory_ledger", {
  id: int("id").primaryKey().autoincrement(),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(),
  // receipt, consumption, production, transfer, adjustment, waste
  itemId: int("item_id").notNull(),
  lotId: int("lot_id"),
  locationId: int("location_id").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  // Positive = in, Negative = out
  uom: varchar("uom", { length: 20 }).notNull(),
  // References
  batchId: int("batch_id"),
  // If related to batch
  transferId: int("transfer_id"),
  // If related to transfer
  referenceDoc: varchar("reference_doc", { length: 100 }),
  // PO#, SO#, etc. (OPS will use this)
  // Cost tracking (for COGS calculation)
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 4 }),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  itemIdx: index("item_idx").on(table.itemId),
  locationIdx: index("location_idx").on(table.locationId),
  batchIdx: index("batch_idx").on(table.batchId),
  dateIdx: index("date_idx").on(table.transactionDate),
  typeIdx: index("type_idx").on(table.transactionType)
}));
const inventoryBalances = mysqlTable("inventory_balances", {
  itemId: int("item_id").notNull(),
  lotId: int("lot_id"),
  locationId: int("location_id").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  uom: varchar("uom", { length: 20 }).notNull(),
  lastMovement: timestamp("last_movement"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.itemId, table.locationId, table.lotId] }),
  itemIdx: index("item_idx").on(table.itemId),
  locationIdx: index("location_idx").on(table.locationId)
}));
const batches = mysqlTable("batches", {
  id: int("id").primaryKey().autoincrement(),
  batchNumber: varchar("batch_number", { length: 100 }).notNull().unique(),
  batchName: varchar("batch_name", { length: 255 }).notNull(),
  recipeId: int("recipe_id"),
  // Reference to LAB recipe (when LAB installed)
  productItemId: int("product_item_id"),
  // What finished good this produces
  status: varchar("status", { length: 50 }).notNull().default("planned"),
  // planned, in_progress, fermenting, conditioning, packaging, completed, cancelled
  // Volumes
  plannedVolume: decimal("planned_volume", { precision: 15, scale: 4 }),
  actualVolume: decimal("actual_volume", { precision: 15, scale: 4 }),
  volumeUom: varchar("volume_uom", { length: 20 }),
  // Gravity readings
  originalGravity: decimal("original_gravity", { precision: 6, scale: 4 }),
  finalGravity: decimal("final_gravity", { precision: 6, scale: 4 }),
  // Dates
  startDate: timestamp("start_date"),
  brewDate: timestamp("brew_date"),
  fermentationStartDate: timestamp("fermentation_start_date"),
  fermentationEndDate: timestamp("fermentation_end_date"),
  packagingDate: timestamp("packaging_date"),
  completedDate: timestamp("completed_date"),
  // Location tracking
  currentLocationId: int("current_location_id"),
  // Current vessel/tank
  // Costing
  totalCost: decimal("total_cost", { precision: 15, scale: 4 }),
  costPerUnit: decimal("cost_per_unit", { precision: 15, scale: 4 }),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  productIdx: index("product_idx").on(table.productItemId),
  locationIdx: index("location_idx").on(table.currentLocationId)
}));
const batchMaterials = mysqlTable("batch_materials", {
  id: int("id").primaryKey().autoincrement(),
  batchId: int("batch_id").notNull(),
  itemId: int("item_id").notNull(),
  lotId: int("lot_id"),
  // Planned
  plannedQuantity: decimal("planned_quantity", { precision: 15, scale: 4 }).notNull(),
  plannedUom: varchar("planned_uom", { length: 20 }).notNull(),
  // Actual
  actualQuantity: decimal("actual_quantity", { precision: 15, scale: 4 }),
  actualUom: varchar("actual_uom", { length: 20 }),
  // Costing
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 15, scale: 4 }),
  addedAt: timestamp("added_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  batchIdx: index("batch_idx").on(table.batchId),
  itemIdx: index("item_idx").on(table.itemId)
}));
const batchOutputs = mysqlTable("batch_outputs", {
  id: int("id").primaryKey().autoincrement(),
  batchId: int("batch_id").notNull(),
  itemId: int("item_id").notNull(),
  // Finished good item
  lotId: int("lot_id"),
  // Generated lot for output
  locationId: int("location_id").notNull(),
  // Where output is stored
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 20 }).notNull(),
  outputDate: timestamp("output_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  batchIdx: index("batch_idx").on(table.batchId),
  itemIdx: index("item_idx").on(table.itemId),
  locationIdx: index("location_idx").on(table.locationId)
}));
const batchTransfers = mysqlTable("batch_transfers", {
  id: int("id").primaryKey().autoincrement(),
  batchId: int("batch_id").notNull(),
  fromLocationId: int("from_location_id").notNull(),
  toLocationId: int("to_location_id").notNull(),
  transferType: varchar("transfer_type", { length: 50 }).notNull(),
  // fermentor_to_bright, bright_to_keg, bright_to_barrel, etc.
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  uom: varchar("uom", { length: 20 }).notNull(),
  // Readings at transfer
  gravity: decimal("gravity", { precision: 6, scale: 4 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  temperatureUnit: varchar("temperature_unit", { length: 1 }).default("F"),
  // F or C
  transferDate: timestamp("transfer_date").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  batchIdx: index("batch_idx").on(table.batchId),
  fromIdx: index("from_idx").on(table.fromLocationId),
  toIdx: index("to_idx").on(table.toLocationId),
  dateIdx: index("date_idx").on(table.transferDate)
}));
const fermentationLogs = mysqlTable("fermentation_logs", {
  id: int("id").primaryKey().autoincrement(),
  batchId: int("batch_id").notNull(),
  logDate: timestamp("log_date").notNull(),
  gravity: decimal("gravity", { precision: 6, scale: 4 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  temperatureUnit: varchar("temperature_unit", { length: 1 }).default("F"),
  ph: decimal("ph", { precision: 4, scale: 2 }),
  pressure: decimal("pressure", { precision: 6, scale: 2 }),
  pressureUnit: varchar("pressure_unit", { length: 10 }).default("PSI"),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  batchIdx: index("batch_idx").on(table.batchId),
  dateIdx: index("date_idx").on(table.logDate)
}));
const controllerNodes = mysqlTable("controller_nodes", {
  id: int("id").primaryKey().autoincrement(),
  nodeId: varchar("node_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nodeType: varchar("node_type", { length: 50 }).notNull(),
  // raspberry_pi, esp32, arduino, io_hub
  ipAddress: varchar("ip_address", { length: 45 }),
  macAddress: varchar("mac_address", { length: 17 }),
  firmwareVersion: varchar("firmware_version", { length: 50 }),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("offline"),
  // online, offline, fault, maintenance
  lastSeen: timestamp("last_seen"),
  lastHeartbeat: timestamp("last_heartbeat"),
  // Capabilities
  capabilities: json("capabilities").$type(),
  // Configuration
  config: json("config").$type(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  nodeIdIdx: index("node_id_idx").on(table.nodeId),
  statusIdx: index("status_idx").on(table.status),
  activeIdx: index("active_idx").on(table.isActive)
}));
const hardwareEndpoints = mysqlTable("hardware_endpoints", {
  id: int("id").primaryKey().autoincrement(),
  controllerId: int("controller_id").notNull(),
  channelId: varchar("channel_id", { length: 100 }).notNull(),
  // Capability metadata
  endpointKind: varchar("endpoint_kind", { length: 20 }).notNull(),
  // DI, DO, AI, AO, PWM, I2C, SPI, UART, 1WIRE, MODBUS, VIRTUAL
  valueType: varchar("value_type", { length: 20 }).notNull(),
  // bool, int, float, string, json
  direction: varchar("direction", { length: 20 }).notNull(),
  // input, output, bidirectional
  // Units and scaling
  unit: varchar("unit", { length: 50 }),
  rangeMin: decimal("range_min", { precision: 15, scale: 4 }),
  rangeMax: decimal("range_max", { precision: 15, scale: 4 }),
  scale: decimal("scale", { precision: 15, scale: 6 }),
  offset: decimal("offset", { precision: 15, scale: 4 }),
  invert: boolean("invert").notNull().default(false),
  // Timing
  samplePeriodMs: int("sample_period_ms"),
  // Output behavior
  writeMode: varchar("write_mode", { length: 20 }),
  // latched, momentary, pulse
  pulseDurationMs: int("pulse_duration_ms"),
  // Safety
  failsafeValue: varchar("failsafe_value", { length: 255 }),
  // Configuration (endpoint-specific)
  config: json("config").$type(),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("ok"),
  // ok, fault, disconnected, calibrating
  lastRead: timestamp("last_read"),
  lastWrite: timestamp("last_write"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  controllerIdx: index("controller_idx").on(table.controllerId),
  kindIdx: index("kind_idx").on(table.endpointKind),
  statusIdx: index("status_idx").on(table.status),
  activeIdx: index("active_idx").on(table.isActive)
}));
const endpointCurrent = mysqlTable("endpoint_current", {
  endpointId: int("endpoint_id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  // Value columns
  valueBool: boolean("value_bool"),
  valueInt: int("value_int"),
  valueFloat: decimal("value_float", { precision: 15, scale: 6 }),
  valueString: varchar("value_string", { length: 255 }),
  valueJson: json("value_json"),
  // Quality
  quality: varchar("quality", { length: 20 }).notNull().default("good"),
  // good, uncertain, bad
  qualityReason: varchar("quality_reason", { length: 255 }),
  // Source
  source: varchar("source", { length: 20 }).notNull().default("hardware"),
  // hardware, derived, manual, sim
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
const deviceTiles = mysqlTable("device_tiles", {
  id: int("id").primaryKey().autoincrement(),
  tileId: varchar("tile_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  tileType: varchar("tile_type", { length: 50 }).notNull(),
  // vessel, temp_sensor, pump, valve, etc.
  // Canvas position
  positionX: decimal("position_x", { precision: 10, scale: 2 }),
  positionY: decimal("position_y", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  // Visual
  iconName: varchar("icon_name", { length: 100 }),
  colorTheme: varchar("color_theme", { length: 50 }),
  // Type-specific configuration
  config: json("config"),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("operational"),
  // operational, warning, error, offline, maintenance
  // Grouping
  groupId: int("group_id"),
  parentTileId: int("parent_tile_id"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  tileIdIdx: index("tile_id_idx").on(table.tileId),
  typeIdx: index("type_idx").on(table.tileType),
  statusIdx: index("status_idx").on(table.status),
  groupIdx: index("group_idx").on(table.groupId),
  parentIdx: index("parent_idx").on(table.parentTileId),
  activeIdx: index("active_idx").on(table.isActive)
}));
const tileEndpointBindings = mysqlTable("tile_endpoint_bindings", {
  id: int("id").primaryKey().autoincrement(),
  tileId: int("tile_id").notNull(),
  endpointId: int("endpoint_id").notNull(),
  // Binding semantics
  bindingRole: varchar("binding_role", { length: 50 }).notNull(),
  // pv, sp, output, state, alarm, permissive
  direction: varchar("direction", { length: 20 }).notNull(),
  // read, write, bidirectional
  // Role label
  role: varchar("role", { length: 100 }),
  // Scaling/transformation per binding
  transform: json("transform").$type(),
  // Priority
  priority: int("priority").notNull().default(0),
  order: int("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  tileIdx: index("tile_idx").on(table.tileId),
  endpointIdx: index("endpoint_idx").on(table.endpointId),
  roleIdx: index("role_idx").on(table.bindingRole),
  directionIdx: index("direction_idx").on(table.direction),
  activeIdx: index("active_idx").on(table.isActive)
}));
const deviceGroups = mysqlTable("device_groups", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  groupType: varchar("group_type", { length: 50 }).notNull(),
  // layout, safety_zone, manifold, batch_area, custom
  // Rules
  rules: json("rules").$type(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  typeIdx: index("type_idx").on(table.groupType),
  activeIdx: index("active_idx").on(table.isActive)
}));
const systemSafetyState = mysqlTable("system_safety_state", {
  id: int("id").primaryKey().autoincrement(),
  siteId: varchar("site_id", { length: 100 }).notNull().unique(),
  // E-stop state
  estopActive: boolean("estop_active").notNull().default(false),
  estopSource: varchar("estop_source", { length: 255 }),
  estopActivatedAt: timestamp("estop_activated_at"),
  estopLatched: boolean("estop_latched").notNull().default(false),
  // Global safety mode
  safetyMode: varchar("safety_mode", { length: 50 }).notNull().default("normal"),
  // normal, restricted, maintenance, emergency
  // Acknowledgment
  ackRequired: boolean("ack_required").notNull().default(false),
  ackedBy: varchar("acked_by", { length: 100 }),
  ackedAt: timestamp("acked_at"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  siteIdx: index("site_idx").on(table.siteId)
}));
const systemSafetyLog = mysqlTable("system_safety_log", {
  id: int("id").primaryKey().autoincrement(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  siteId: varchar("site_id", { length: 100 }).notNull(),
  // Transition
  previousState: varchar("previous_state", { length: 100 }).notNull(),
  newState: varchar("new_state", { length: 100 }).notNull(),
  // Cause
  triggeredBy: varchar("triggered_by", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  // Action taken
  actionsTaken: json("actions_taken").$type(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  siteIdx: index("site_idx").on(table.siteId)
}));
const telemetryReadings = mysqlTable("telemetry_readings", {
  id: int("id").primaryKey().autoincrement(),
  timestamp: timestamp("timestamp").notNull(),
  endpointId: int("endpoint_id").notNull(),
  tileId: int("tile_id"),
  // Value columns
  valueBool: boolean("value_bool"),
  valueNum: decimal("value_num", { precision: 15, scale: 6 }),
  valueString: varchar("value_string", { length: 255 }),
  valueJson: json("value_json"),
  // Metadata
  unit: varchar("unit", { length: 50 }),
  // Quality
  quality: varchar("quality", { length: 20 }).notNull().default("good"),
  // good, uncertain, bad
  qualityReason: varchar("quality_reason", { length: 255 }),
  // Source
  source: varchar("source", { length: 20 }).notNull().default("hardware"),
  // hardware, derived, manual, sim
  // Context
  batchId: int("batch_id"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  endpointTimestampIdx: index("endpoint_timestamp_idx").on(table.endpointId, table.timestamp),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  tileIdx: index("tile_idx").on(table.tileId),
  batchIdx: index("batch_idx").on(table.batchId),
  qualityIdx: index("quality_idx").on(table.quality)
}));
const commandLog = mysqlTable("command_log", {
  id: int("id").primaryKey().autoincrement(),
  commandId: varchar("command_id", { length: 100 }).notNull().unique(),
  correlationId: varchar("correlation_id", { length: 100 }).notNull(),
  // Timing (full lifecycle)
  requestedAt: timestamp("requested_at").notNull(),
  sentAt: timestamp("sent_at"),
  ackedAt: timestamp("acked_at"),
  completedAt: timestamp("completed_at"),
  // Command details
  commandType: varchar("command_type", { length: 50 }).notNull(),
  // manual, automation, safety, system
  action: varchar("action", { length: 100 }).notNull(),
  // Target
  targetTileId: int("target_tile_id"),
  targetEndpointId: int("target_endpoint_id"),
  // Command data
  requestedValue: varchar("requested_value", { length: 255 }),
  appliedValue: varchar("applied_value", { length: 255 }),
  previousValue: varchar("previous_value", { length: 255 }),
  commandData: json("command_data").$type(),
  // Result
  status: varchar("status", { length: 50 }).notNull().default("queued"),
  // queued, sent, acked, succeeded, failed, blocked
  failureReason: text("failure_reason"),
  // Attribution
  requestedByUserId: varchar("requested_by_user_id", { length: 100 }),
  requestedByService: varchar("requested_by_service", { length: 100 }),
  // Safety
  interlockCheckPassed: boolean("interlock_check_passed").notNull().default(true),
  blockedByInterlockId: int("blocked_by_interlock_id"),
  interlockDetails: text("interlock_details"),
  // Node response
  nodeResponse: json("node_response").$type(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  requestedAtIdx: index("requested_at_idx").on(table.requestedAt),
  correlationIdx: index("correlation_idx").on(table.correlationId),
  commandIdIdx: index("command_id_idx").on(table.commandId),
  statusIdx: index("status_idx").on(table.status),
  tileIdx: index("tile_idx").on(table.targetTileId),
  userIdx: index("user_idx").on(table.requestedByUserId)
}));
const safetyInterlocks = mysqlTable("safety_interlocks", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  // Scope
  interlockType: varchar("interlock_type", { length: 50 }).notNull(),
  // estop, permissive, conditional, timer
  mode: varchar("mode", { length: 50 }).notNull(),
  // permissive, trip, advisory
  priority: int("priority").notNull().default(0),
  // Condition
  condition: json("condition").$type(),
  // Action
  affectedTiles: json("affected_tiles").$type(),
  blockActions: json("block_actions").$type(),
  // Response
  onViolationAction: varchar("on_violation_action", { length: 50 }).notNull(),
  // block, force_off, force_value, latch_until_ack
  forceValue: varchar("force_value", { length: 255 }),
  alarmMessage: text("alarm_message"),
  // Latching and acknowledgment
  latched: boolean("latched").notNull().default(false),
  ackRequired: boolean("ack_required").notNull().default(false),
  // Severity
  severity: varchar("severity", { length: 50 }).notNull().default("warning"),
  // info, warning, critical
  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  typeIdx: index("type_idx").on(table.interlockType),
  modeIdx: index("mode_idx").on(table.mode),
  priorityIdx: index("priority_idx").on(table.priority),
  severityIdx: index("severity_idx").on(table.severity),
  activeIdx: index("active_idx").on(table.isActive)
}));
const interlockEvaluations = mysqlTable("interlock_evaluations", {
  id: int("id").primaryKey().autoincrement(),
  interlockId: int("interlock_id").notNull(),
  evaluatedAt: timestamp("evaluated_at").notNull(),
  // Result
  result: varchar("result", { length: 20 }).notNull(),
  // pass, fail
  // Details (explainability)
  details: json("details").$type(),
  // Action taken
  actionTaken: varchar("action_taken", { length: 255 }),
  // Context
  commandLogId: int("command_log_id"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  interlockIdx: index("interlock_idx").on(table.interlockId),
  evaluatedAtIdx: index("evaluated_at_idx").on(table.evaluatedAt),
  resultIdx: index("result_idx").on(table.result),
  commandIdx: index("command_idx").on(table.commandLogId)
}));
const deviceStateHistory = mysqlTable("device_state_history", {
  id: int("id").primaryKey().autoincrement(),
  timestamp: timestamp("timestamp").notNull(),
  tileId: int("tile_id").notNull(),
  // State change
  previousState: varchar("previous_state", { length: 255 }).notNull(),
  newState: varchar("new_state", { length: 255 }).notNull(),
  // Context
  changeReason: varchar("change_reason", { length: 50 }).notNull(),
  // manual, automation, safety, timeout, fault
  commandLogId: int("command_log_id"),
  // Duration tracking
  durationSeconds: int("duration_seconds"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  tileIdx: index("tile_idx").on(table.tileId),
  reasonIdx: index("reason_idx").on(table.changeReason)
}));
const alarmEvents = mysqlTable("alarm_events", {
  id: int("id").primaryKey().autoincrement(),
  timestamp: timestamp("timestamp").notNull(),
  // Source
  tileId: int("tile_id"),
  endpointId: int("endpoint_id"),
  alarmType: varchar("alarm_type", { length: 50 }).notNull(),
  // high, low, fault, offline, safety, custom
  severity: varchar("severity", { length: 50 }).notNull(),
  // info, warning, critical
  // Details
  message: text("message").notNull(),
  value: varchar("value", { length: 255 }),
  threshold: varchar("threshold", { length: 255 }),
  // Status
  status: varchar("status", { length: 50 }).notNull().default("active"),
  // active, acknowledged, cleared, suppressed
  acknowledgedBy: varchar("acknowledged_by", { length: 100 }),
  acknowledgedAt: timestamp("acknowledged_at"),
  clearedAt: timestamp("cleared_at"),
  // Context
  batchId: int("batch_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
}, (table) => ({
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  tileIdx: index("tile_idx").on(table.tileId),
  endpointIdx: index("endpoint_idx").on(table.endpointId),
  statusIdx: index("status_idx").on(table.status),
  severityIdx: index("severity_idx").on(table.severity),
  typeIdx: index("type_idx").on(table.alarmType)
}));

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  alarmEvents,
  batchMaterials,
  batchOutputs,
  batchTransfers,
  batches,
  commandLog,
  controllerNodes,
  deviceGroups,
  deviceStateHistory,
  deviceTiles,
  endpointCurrent,
  fermentationLogs,
  hardwareEndpoints,
  interlockEvaluations,
  inventoryBalances,
  inventoryLedger,
  items,
  locations,
  lots,
  safetyInterlocks,
  systemSafetyLog,
  systemSafetyState,
  telemetryReadings,
  tileEndpointBindings,
  unitsOfMeasure
}, Symbol.toStringTag, { value: 'Module' }));

const dbConfig = getDatabaseCredentials();
const poolConnection = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
const db = drizzle(poolConnection, { schema, mode: "default" });
async function closeConnection() {
  await poolConnection.end();
}

const DEFAULT_SYSTEM_INBOX = "/var/bevforge/os/queue/recipes";
const nowIso$1 = () => (/* @__PURE__ */ new Date()).toISOString();
const makeJobId = () => `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const safeFileName = (value) => value.replace(/[^a-zA-Z0-9._-]/g, "_");
const readJson = (content) => JSON.parse(content);
const validateBevForgeContract = (value) => {
  const errors = [];
  const warnings = [];
  if (!value || typeof value !== "object") {
    return {
      valid: false,
      errors: ["Payload is not a JSON object."],
      warnings
    };
  }
  const input = value;
  const meta = input.meta;
  if (!meta || typeof meta !== "object") {
    errors.push("Missing `meta` block.");
  } else if (typeof meta.version !== "string" || !meta.version.trim()) {
    warnings.push("Missing `meta.version`; default routing may be used.");
  }
  if (!input.process && !Array.isArray(input.actions) && !Array.isArray(input.steps)) {
    errors.push("Missing executable content (`process`, `actions`, or `steps`).");
  }
  if (!input.metrics && !input.targets) {
    warnings.push("Missing `metrics`/`targets` block.");
  }
  if (!input.hardware_prep) {
    warnings.push("Missing `hardware_prep` block.");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
const moveFile = async (sourcePath, destinationPath) => {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch (error) {
    const err = error;
    if (err.code === "EXDEV") {
      await fs.copyFile(sourcePath, destinationPath);
      await fs.unlink(sourcePath);
      return;
    }
    throw error;
  }
};
const toExpressReq = (filename, content) => ({ body: { filename, content } });
const toExpressRes = () => {
  let code = 200;
  let jsonBody = null;
  const res = {
    status(nextCode) {
      code = nextCode;
      return res;
    },
    json(payload) {
      jsonBody = payload;
      return res;
    }
  };
  return {
    res,
    getCode: () => code,
    getJson: () => jsonBody
  };
};
class RecipeInboxService {
  started = false;
  activeInboxDir = commissioningPaths.queueInboxDir;
  usingFallbackInbox = true;
  timer = null;
  scanInProgress = false;
  lastScan;
  pollingMs = 5e3;
  resolveSystemInboxDir() {
    const configured = process.env.BEVFORGE_OS_RECIPE_INBOX?.trim();
    return configured && configured.length > 0 ? configured : DEFAULT_SYSTEM_INBOX;
  }
  async chooseInboxDir() {
    const systemDir = this.resolveSystemInboxDir();
    try {
      await fs.mkdir(systemDir, { recursive: true });
      await fs.access(systemDir, constants.R_OK | constants.W_OK);
      this.activeInboxDir = systemDir;
      this.usingFallbackInbox = false;
      return;
    } catch {
      await fs.mkdir(commissioningPaths.queueInboxDir, { recursive: true });
      this.activeInboxDir = commissioningPaths.queueInboxDir;
      this.usingFallbackInbox = true;
    }
  }
  async writeQueueStatus(result) {
    await fs.mkdir(path.dirname(commissioningPaths.queueStatusFile), { recursive: true });
    await fs.writeFile(
      commissioningPaths.queueStatusFile,
      `${JSON.stringify(result, null, 2)}
`,
      "utf8"
    );
  }
  async start() {
    if (this.started) return;
    this.started = true;
    await this.chooseInboxDir();
    await this.scanNow();
    this.timer = setInterval(() => {
      void this.scanNow();
    }, this.pollingMs);
    if (this.timer && typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }
  async stop() {
    this.started = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  status() {
    return {
      started: this.started,
      activeInboxDir: this.activeInboxDir,
      usingFallbackInbox: this.usingFallbackInbox,
      pollingMs: this.pollingMs,
      lastScan: this.lastScan
    };
  }
  async scanNow() {
    if (this.scanInProgress) {
      return this.lastScan ?? {
        scannedAt: nowIso$1(),
        activeInboxDir: this.activeInboxDir,
        usingFallbackInbox: this.usingFallbackInbox,
        filesSeen: 0,
        ingested: 0,
        rejected: 0,
        errors: 0,
        jobs: []
      };
    }
    this.scanInProgress = true;
    try {
      await this.chooseInboxDir();
      await fs.mkdir(commissioningPaths.jobsDir, { recursive: true });
      await fs.mkdir(commissioningPaths.queueRejectedDir, { recursive: true });
      const entries = await fs.readdir(this.activeInboxDir, { withFileTypes: true });
      const candidateFiles = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).filter((name) => name.toLowerCase().endsWith(".bevforge.json"));
      const jobs = [];
      let ingested = 0;
      let rejected = 0;
      let errors = 0;
      for (const fileName of candidateFiles) {
        const sourcePath = path.join(this.activeInboxDir, fileName);
        const jobId = makeJobId();
        const createdAt = nowIso$1();
        try {
          const content = await fs.readFile(sourcePath, "utf8");
          const parsed = readJson(content);
          const validation = validateBevForgeContract(parsed);
          if (!validation.valid) {
            const rejectedName = `${jobId}-${safeFileName(fileName)}`;
            const rejectedPath = path.join(commissioningPaths.queueRejectedDir, rejectedName);
            await moveFile(sourcePath, rejectedPath);
            const reasonLogPath = `${rejectedPath}.reason.json`;
            await fs.writeFile(
              reasonLogPath,
              `${JSON.stringify(
                {
                  rejectedAt: createdAt,
                  sourceFile: fileName,
                  errors: validation.errors,
                  warnings: validation.warnings
                },
                null,
                2
              )}
`,
              "utf8"
            );
            rejected += 1;
            jobs.push({
              jobId,
              sourceFile: fileName,
              status: "rejected",
              reason: validation.errors.join(" "),
              warnings: validation.warnings,
              createdAt,
              rejectedFile: rejectedPath
            });
            continue;
          }
          const ext = path.extname(fileName).toLowerCase() || ".json";
          const jobDir = path.join(commissioningPaths.jobsDir, jobId);
          await fs.mkdir(jobDir, { recursive: true });
          const inputFile = path.join(jobDir, `input${ext}`);
          await moveFile(sourcePath, inputFile);
          const req = toExpressReq(fileName, content);
          const fake = toExpressRes();
          await handler$1(req, fake.res);
          const payload = fake.getJson();
          if (fake.getCode() >= 400 || !payload?.success) {
            throw new Error(String(payload?.error ?? "Import handler failed"));
          }
          const imported = payload.data;
          const statusFile = path.join(jobDir, "status.json");
          await fs.writeFile(
            statusFile,
            `${JSON.stringify(
              {
                jobId,
                status: "ingested",
                createdAt,
                inputFile,
                recipe: {
                  id: imported.id,
                  name: imported.name,
                  format: imported.format,
                  stepCount: imported.steps.length
                },
                warnings: validation.warnings
              },
              null,
              2
            )}
`,
            "utf8"
          );
          if (validation.warnings.length > 0) {
            const warningSidecar = path.join(jobDir, "warnings.json");
            await fs.writeFile(
              warningSidecar,
              `${JSON.stringify(validation.warnings, null, 2)}
`,
              "utf8"
            );
          }
          ingested += 1;
          jobs.push({
            jobId,
            sourceFile: fileName,
            status: "ingested",
            createdAt,
            warnings: validation.warnings,
            recipe: {
              id: imported.id,
              name: imported.name,
              format: imported.format,
              stepCount: imported.steps.length
            },
            jobDir
          });
        } catch (error) {
          errors += 1;
          const reason = error instanceof Error ? error.message : "Unknown error";
          try {
            const rejectedName = `${jobId}-${safeFileName(fileName)}`;
            const rejectedPath = path.join(commissioningPaths.queueRejectedDir, rejectedName);
            await moveFile(sourcePath, rejectedPath);
          } catch {
          }
          jobs.push({
            jobId,
            sourceFile: fileName,
            status: "error",
            reason,
            createdAt
          });
        }
      }
      const result = {
        scannedAt: nowIso$1(),
        activeInboxDir: this.activeInboxDir,
        usingFallbackInbox: this.usingFallbackInbox,
        filesSeen: candidateFiles.length,
        ingested,
        rejected,
        errors,
        jobs
      };
      this.lastScan = result;
      await this.writeQueueStatus(result);
      return result;
    } finally {
      this.scanInProgress = false;
    }
  }
}
const recipeInboxService = new RecipeInboxService();

const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const toNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const normalizeTrigger = (value) => String(value ?? "").trim().toLowerCase();
class RecipeRunner {
  runs = /* @__PURE__ */ new Map();
  initialized = false;
  ticker = null;
  ticking = false;
  async ensureInitialized() {
    if (!this.initialized) {
      const state = await readRecipeRunsState();
      for (const run of state.runs) {
        this.runs.set(run.runId, run);
      }
      this.initialized = true;
    }
    if (!this.ticker) {
      this.ticker = setInterval(() => {
        void this.tick();
      }, 1e3);
      if (typeof this.ticker.unref === "function") {
        this.ticker.unref();
      }
    }
  }
  async shutdown() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
  async persist() {
    await writeRecipeRunsState({
      schemaVersion: "0.1.0",
      id: "recipe-runs",
      updatedAt: nowIso(),
      runs: [...this.runs.values()]
    });
  }
  async snapshot() {
    await this.ensureInitialized();
    return [...this.runs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }
  async resetRuns() {
    await this.ensureInitialized();
    const clearedRunIds = [...this.runs.keys()];
    this.runs.clear();
    await this.persist();
    return clearedRunIds;
  }
  coerceStepValue(value) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return void 0;
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
    return trimmed;
  }
  async startRun(recipe, options) {
    await this.ensureInitialized();
    const runId = randomUUID();
    const executionMode = options?.executionMode ?? "automated";
    const run = {
      runId,
      recipeId: recipe.id,
      recipeName: recipe.name,
      executionMode,
      sourceFile: recipe.rawFile,
      status: "running",
      startedAt: nowIso(),
      currentStepIndex: recipe.steps.length > 0 ? 0 : -1,
      steps: recipe.steps.map((step, index) => ({
        id: step.id ?? `step-${index + 1}`,
        name: step.name ?? `Step ${index + 1}`,
        stage: step.stage,
        action: step.action,
        triggerWhen: step.triggerWhen,
        command: step.command,
        targetDeviceId: step.targetDeviceId,
        value: this.coerceStepValue(step.value),
        durationMin: step.durationMin,
        temperatureC: step.temperatureC,
        requiresUserConfirm: step.requiresUserConfirm,
        autoProceed: step.autoProceed,
        status: "pending"
      }))
    };
    if (run.steps.length === 0) {
      run.status = "completed";
      run.endedAt = nowIso();
      run.currentStepIndex = -1;
    }
    this.runs.set(runId, run);
    await this.persist();
    return run;
  }
  resolveCurrentStep(run) {
    if (run.currentStepIndex < 0) return void 0;
    return run.steps[run.currentStepIndex];
  }
  completeCurrentStep(run, message) {
    const step = this.resolveCurrentStep(run);
    if (!step) return;
    step.status = "completed";
    step.endedAt = nowIso();
    if (message) {
      step.message = message;
    }
  }
  advanceStep(run) {
    const nextIndex = run.currentStepIndex + 1;
    if (nextIndex >= run.steps.length) {
      run.currentStepIndex = run.steps.length - 1;
      run.status = "completed";
      run.endedAt = nowIso();
      return;
    }
    run.currentStepIndex = nextIndex;
    if (run.status !== "paused") {
      run.status = "running";
    }
  }
  async controlRun(runId, action) {
    await this.ensureInitialized();
    const run = this.runs.get(runId);
    if (!run) return null;
    if (action === "stop") {
      run.status = "canceled";
      run.endedAt = nowIso();
      await this.persist();
      return run;
    }
    if (action === "pause") {
      if (run.status === "running" || run.status === "waiting_confirm") {
        run.status = "paused";
      }
      await this.persist();
      return run;
    }
    if (action === "resume") {
      if (run.status === "paused") {
        const step = this.resolveCurrentStep(run);
        run.status = step?.status === "waiting_confirm" ? "waiting_confirm" : "running";
      }
      await this.persist();
      return run;
    }
    if (action === "confirm") {
      const step = this.resolveCurrentStep(run);
      if (step && step.status === "waiting_confirm") {
        this.completeCurrentStep(run, "User confirmed step.");
        this.advanceStep(run);
      }
      await this.persist();
      return run;
    }
    if (action === "next") {
      const step = this.resolveCurrentStep(run);
      if (step && step.status !== "completed") {
        this.completeCurrentStep(run, "Advanced manually by brewer.");
      }
      this.advanceStep(run);
      await this.persist();
      return run;
    }
    return run;
  }
  async updateStep(runId, stepId, patch) {
    await this.ensureInitialized();
    const run = this.runs.get(runId);
    if (!run) return null;
    const step = run.steps.find((candidate) => candidate.id === stepId);
    if (!step) return null;
    if (patch.name !== void 0) step.name = patch.name;
    if (patch.durationMin !== void 0) {
      step.durationMin = patch.durationMin === null ? void 0 : patch.durationMin;
    }
    if (patch.temperatureC !== void 0) {
      step.temperatureC = patch.temperatureC === null ? void 0 : patch.temperatureC;
    }
    if (patch.value !== void 0) {
      step.value = patch.value === null ? void 0 : this.coerceStepValue(patch.value);
    }
    if (patch.targetDeviceId !== void 0) {
      step.targetDeviceId = patch.targetDeviceId ?? void 0;
    }
    if (patch.command !== void 0) {
      step.command = patch.command ?? void 0;
    }
    if (patch.triggerWhen !== void 0) {
      step.triggerWhen = patch.triggerWhen ?? void 0;
    }
    if (patch.requiresUserConfirm !== void 0) {
      step.requiresUserConfirm = patch.requiresUserConfirm;
    }
    if (patch.autoProceed !== void 0) {
      step.autoProceed = patch.autoProceed;
    }
    await this.persist();
    return run;
  }
  async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.ensureInitialized();
      let changed = false;
      const nowMs = Date.now();
      for (const run of this.runs.values()) {
        if (run.status !== "running" && run.status !== "waiting_confirm") {
          continue;
        }
        const step = this.resolveCurrentStep(run);
        if (!step) {
          run.status = "completed";
          run.endedAt = nowIso();
          changed = true;
          continue;
        }
        if (step.status === "pending") {
          step.startedAt = nowIso();
          const durationMin2 = toNumber(step.durationMin);
          const manualTimedStep = run.executionMode === "manual" && durationMin2 !== void 0 && durationMin2 > 0;
          const trigger = normalizeTrigger(step.triggerWhen);
          if (trigger.includes("transfer_complete")) {
            step.status = "waiting_confirm";
            step.message = "Waiting for transfer completion confirmation.";
            run.status = "waiting_confirm";
            changed = true;
            continue;
          }
          step.message = step.targetDeviceId ? `Target ${step.targetDeviceId} scheduled (${step.command ?? "trigger"}).` : run.executionMode === "manual" ? "Manual mode step: run physically and confirm when complete." : "No target mapped. Step running as instruction-only.";
          if (step.requiresUserConfirm === true && !manualTimedStep) {
            step.status = "waiting_confirm";
            run.status = "waiting_confirm";
          } else {
            step.status = "running";
            run.status = "running";
          }
          changed = true;
          continue;
        }
        if (step.status === "waiting_confirm") {
          run.status = "waiting_confirm";
          continue;
        }
        if (step.status !== "running") {
          continue;
        }
        const durationMin = toNumber(step.durationMin);
        if (durationMin !== void 0 && durationMin > 0) {
          const startedMs = step.startedAt ? Date.parse(step.startedAt) : nowMs;
          if (Number.isFinite(startedMs) && nowMs - startedMs >= durationMin * 6e4) {
            if (run.executionMode === "manual") {
              step.status = "waiting_confirm";
              run.status = "waiting_confirm";
              step.message = "Timer complete. Confirm step to continue.";
            } else {
              this.completeCurrentStep(run);
              this.advanceStep(run);
            }
            changed = true;
            continue;
          }
          run.status = "running";
          continue;
        }
        if (step.autoProceed === true && run.executionMode !== "manual") {
          this.completeCurrentStep(run);
          this.advanceStep(run);
          changed = true;
          continue;
        }
        step.status = "waiting_confirm";
        run.status = "waiting_confirm";
        changed = true;
      }
      if (changed) {
        await this.persist();
      }
    } finally {
      this.ticking = false;
    }
  }
}
const recipeRunner = new RecipeRunner();

// ServerHook
const serverBefore = (server) => {
  void recipeInboxService.start().catch((error) => {
    console.error("Recipe inbox watcher failed to start:", error);
  });

  const shutdown = async (signal) => {
    console.log(`Got ${signal}, shutting down gracefully...`);

    try {
      await recipeInboxService.stop();
      await recipeRunner.shutdown();
      // Close database connection pool before exiting
      await closeConnection();
      console.log("Database connections closed");
    } catch (error) {
      console.error("Error closing database connections:", error);
    }

    process.exit(0);
  };

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.on(signal, shutdown);
  });

  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
};

const serverAfter = (server) => {
  // Add SPA fallback for client-side routing
  // This middleware serves index.html for any GET request that doesn't match
  // an API endpoint or static file, enabling React Router to handle the route
  server.use((req, res, next) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if this is an API request
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip if this is a static asset request (has file extension)
    if (path.extname(req.path)) {
      return next();
    }

    // For all other GET requests, serve index.html to support client-side routing
    res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
  });

  const errorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      next(err);
    }
  };
  server.use(errorHandler);
};

// Public RESTful API Methods and Paths
// This section describes the available HTTP methods and their corresponding endpoints (paths).
// GET  /api/calendar/events/                            src/server/api/calendar/events/GET.ts
// POST /api/calendar/events/                            src/server/api/calendar/events/POST.ts
// POST /api/commerce/create-checkout-session/           src/server/api/commerce/create-checkout-session/POST.ts
// GET  /api/health/                                     src/server/api/health/GET.ts
// GET  /api/os/alarms/                                  src/server/api/os/alarms/GET.ts
// POST /api/os/automation/preview/                      src/server/api/os/automation/preview/POST.ts
// POST /api/os/automation/run/                          src/server/api/os/automation/run/POST.ts
// POST /api/os/automation/run/:runId/stop/              src/server/api/os/automation/run/[runId]/stop/POST.ts
// GET  /api/os/automation/runs/                         src/server/api/os/automation/runs/GET.ts
// GET  /api/os/availability/                            src/server/api/os/availability/GET.ts
// GET  /api/os/batches/                                 src/server/api/os/batches/GET.ts
// POST /api/os/batches/                                 src/server/api/os/batches/POST.ts
// PUT  /api/os/batches/:batchId/                        src/server/api/os/batches/[batchId]/PUT.ts
// GET  /api/os/bindings/                                src/server/api/os/bindings/GET.ts
// GET  /api/os/canvas/project/                          src/server/api/os/canvas/project/GET.ts
// PUT  /api/os/canvas/project/                          src/server/api/os/canvas/project/PUT.ts
// POST /api/os/command/                                 src/server/api/os/command/POST.ts
// GET  /api/os/command/:commandId/                      src/server/api/os/command/[commandId]/GET.ts
// GET  /api/os/endpoints/                               src/server/api/os/endpoints/GET.ts
// GET  /api/os/flow/pour-events/                        src/server/api/os/flow/pour-events/GET.ts
// POST /api/os/flow/pour-events/                        src/server/api/os/flow/pour-events/POST.ts
// GET  /api/os/flow/profile/                            src/server/api/os/flow/profile/GET.ts
// GET  /api/os/flow/profiles/                           src/server/api/os/flow/profiles/GET.ts
// POST /api/os/flow/publish/                            src/server/api/os/flow/publish/POST.ts
// GET  /api/os/flow/runtime-state/                      src/server/api/os/flow/runtime-state/GET.ts
// POST /api/os/flow/runtime-state/                      src/server/api/os/flow/runtime-state/POST.ts
// GET  /api/os/groups/                                  src/server/api/os/groups/GET.ts
// GET  /api/os/inventory/                               src/server/api/os/inventory/GET.ts
// POST /api/os/inventory/                               src/server/api/os/inventory/POST.ts
// GET  /api/os/inventory/movements/                     src/server/api/os/inventory/movements/GET.ts
// GET  /api/os/lab/drafts/                              src/server/api/os/lab/drafts/GET.ts
// POST /api/os/lab/drafts/                              src/server/api/os/lab/drafts/POST.ts
// GET  /api/os/lab/handoff-audit/                       src/server/api/os/lab/handoff-audit/GET.ts
// POST /api/os/lab/handoff-audit/                       src/server/api/os/lab/handoff-audit/POST.ts
// GET  /api/os/library/hardware/                        src/server/api/os/library/hardware/GET.ts
// GET  /api/os/nodes/                                   src/server/api/os/nodes/GET.ts
// GET  /api/os/recipes/                                 src/server/api/os/recipes/GET.ts
// GET  /api/os/recipes/equipment-map/                   src/server/api/os/recipes/equipment-map/GET.ts
// PUT  /api/os/recipes/equipment-map/                   src/server/api/os/recipes/equipment-map/PUT.ts
// POST /api/os/recipes/import/                          src/server/api/os/recipes/import/POST.ts
// POST /api/os/recipes/inbox/scan/                      src/server/api/os/recipes/inbox/scan/POST.ts
// GET  /api/os/recipes/inbox/status/                    src/server/api/os/recipes/inbox/status/GET.ts
// POST /api/os/recipes/preflight/                       src/server/api/os/recipes/preflight/POST.ts
// POST /api/os/recipes/run/start/                       src/server/api/os/recipes/run/start/POST.ts
// POST /api/os/recipes/run/:runId/action/               src/server/api/os/recipes/run/[runId]/action/POST.ts
// GET  /api/os/recipes/run/:runId/readings/             src/server/api/os/recipes/run/[runId]/readings/GET.ts
// POST /api/os/recipes/run/:runId/readings/             src/server/api/os/recipes/run/[runId]/readings/POST.ts
// POST /api/os/recipes/run/:runId/readings/snapshot/    src/server/api/os/recipes/run/[runId]/readings/snapshot/POST.ts
// GET  /api/os/recipes/run/:runId/runboard/             src/server/api/os/recipes/run/[runId]/runboard/GET.ts
// PUT  /api/os/recipes/run/:runId/runboard/             src/server/api/os/recipes/run/[runId]/runboard/PUT.ts
// PUT  /api/os/recipes/run/:runId/steps/:stepId/        src/server/api/os/recipes/run/[runId]/steps/[stepId]/PUT.ts
// POST /api/os/recipes/run/:runId/transfer/             src/server/api/os/recipes/run/[runId]/transfer/POST.ts
// GET  /api/os/recipes/runs/                            src/server/api/os/recipes/runs/GET.ts
// POST /api/os/recipes/runs/reset/                      src/server/api/os/recipes/runs/reset/POST.ts
// GET  /api/os/recipes/transfer-map/                    src/server/api/os/recipes/transfer-map/GET.ts
// PUT  /api/os/recipes/transfer-map/                    src/server/api/os/recipes/transfer-map/PUT.ts
// POST /api/os/recipes/transfer-map/autofill/           src/server/api/os/recipes/transfer-map/autofill/POST.ts
// GET  /api/os/registry/devices/                        src/server/api/os/registry/devices/GET.ts
// PUT  /api/os/registry/devices/                        src/server/api/os/registry/devices/PUT.ts
// POST /api/os/reservations/                            src/server/api/os/reservations/POST.ts
// POST /api/os/reservations/:reservationId/action/      src/server/api/os/reservations/[reservationId]/action/POST.ts
// GET  /api/os/telemetry/latest/                        src/server/api/os/telemetry/latest/GET.ts
// GET  /api/os/tiles/                                   src/server/api/os/tiles/GET.ts
// GET  /api/os/tiles/:tileId/                           src/server/api/os/tiles/[tileId]/GET.ts

const internal  = [
  handler$2  && { cb: handler$2 , method: "get"  , route: "/calendar/events/"                         , url: "/api/calendar/events/"                         , source: "src/server/api/calendar/events/GET.ts"                           },
  handler$3  && { cb: handler$3 , method: "post" , route: "/calendar/events/"                         , url: "/api/calendar/events/"                         , source: "src/server/api/calendar/events/POST.ts"                          },
  handler$4  && { cb: handler$4 , method: "post" , route: "/commerce/create-checkout-session/"        , url: "/api/commerce/create-checkout-session/"        , source: "src/server/api/commerce/create-checkout-session/POST.ts"         },
  handler$5  && { cb: handler$5 , method: "get"  , route: "/health/"                                  , url: "/api/health/"                                  , source: "src/server/api/health/GET.ts"                                    },
  handler$6  && { cb: handler$6 , method: "get"  , route: "/os/alarms/"                               , url: "/api/os/alarms/"                               , source: "src/server/api/os/alarms/GET.ts"                                 },
  handler$7  && { cb: handler$7 , method: "post" , route: "/os/automation/preview/"                   , url: "/api/os/automation/preview/"                   , source: "src/server/api/os/automation/preview/POST.ts"                    },
  handler$8  && { cb: handler$8 , method: "post" , route: "/os/automation/run/"                       , url: "/api/os/automation/run/"                       , source: "src/server/api/os/automation/run/POST.ts"                        },
  handler$9  && { cb: handler$9 , method: "post" , route: "/os/automation/run/:runId/stop/"           , url: "/api/os/automation/run/:runId/stop/"           , source: "src/server/api/os/automation/run/[runId]/stop/POST.ts"           },
  handler$a  && { cb: handler$a , method: "get"  , route: "/os/automation/runs/"                      , url: "/api/os/automation/runs/"                      , source: "src/server/api/os/automation/runs/GET.ts"                        },
  handler$b  && { cb: handler$b , method: "get"  , route: "/os/availability/"                         , url: "/api/os/availability/"                         , source: "src/server/api/os/availability/GET.ts"                           },
  handler$c  && { cb: handler$c , method: "get"  , route: "/os/batches/"                              , url: "/api/os/batches/"                              , source: "src/server/api/os/batches/GET.ts"                                },
  handler$d  && { cb: handler$d , method: "post" , route: "/os/batches/"                              , url: "/api/os/batches/"                              , source: "src/server/api/os/batches/POST.ts"                               },
  handler$e  && { cb: handler$e , method: "put"  , route: "/os/batches/:batchId/"                     , url: "/api/os/batches/:batchId/"                     , source: "src/server/api/os/batches/[batchId]/PUT.ts"                      },
  handler$f  && { cb: handler$f , method: "get"  , route: "/os/bindings/"                             , url: "/api/os/bindings/"                             , source: "src/server/api/os/bindings/GET.ts"                               },
  handler$g  && { cb: handler$g , method: "get"  , route: "/os/canvas/project/"                       , url: "/api/os/canvas/project/"                       , source: "src/server/api/os/canvas/project/GET.ts"                         },
  handler$h  && { cb: handler$h , method: "put"  , route: "/os/canvas/project/"                       , url: "/api/os/canvas/project/"                       , source: "src/server/api/os/canvas/project/PUT.ts"                         },
  handler$i  && { cb: handler$i , method: "post" , route: "/os/command/"                              , url: "/api/os/command/"                              , source: "src/server/api/os/command/POST.ts"                               },
  handler$j  && { cb: handler$j , method: "get"  , route: "/os/command/:commandId/"                   , url: "/api/os/command/:commandId/"                   , source: "src/server/api/os/command/[commandId]/GET.ts"                    },
  handler$k  && { cb: handler$k , method: "get"  , route: "/os/endpoints/"                            , url: "/api/os/endpoints/"                            , source: "src/server/api/os/endpoints/GET.ts"                              },
  handler$l  && { cb: handler$l , method: "get"  , route: "/os/flow/pour-events/"                     , url: "/api/os/flow/pour-events/"                     , source: "src/server/api/os/flow/pour-events/GET.ts"                       },
  handler$m  && { cb: handler$m , method: "post" , route: "/os/flow/pour-events/"                     , url: "/api/os/flow/pour-events/"                     , source: "src/server/api/os/flow/pour-events/POST.ts"                      },
  handler$n  && { cb: handler$n , method: "get"  , route: "/os/flow/profile/"                         , url: "/api/os/flow/profile/"                         , source: "src/server/api/os/flow/profile/GET.ts"                           },
  handler$o  && { cb: handler$o , method: "get"  , route: "/os/flow/profiles/"                        , url: "/api/os/flow/profiles/"                        , source: "src/server/api/os/flow/profiles/GET.ts"                          },
  handler$p  && { cb: handler$p , method: "post" , route: "/os/flow/publish/"                         , url: "/api/os/flow/publish/"                         , source: "src/server/api/os/flow/publish/POST.ts"                          },
  handler$q  && { cb: handler$q , method: "get"  , route: "/os/flow/runtime-state/"                   , url: "/api/os/flow/runtime-state/"                   , source: "src/server/api/os/flow/runtime-state/GET.ts"                     },
  handler$r  && { cb: handler$r , method: "post" , route: "/os/flow/runtime-state/"                   , url: "/api/os/flow/runtime-state/"                   , source: "src/server/api/os/flow/runtime-state/POST.ts"                    },
  handler$s  && { cb: handler$s , method: "get"  , route: "/os/groups/"                               , url: "/api/os/groups/"                               , source: "src/server/api/os/groups/GET.ts"                                 },
  handler$t  && { cb: handler$t , method: "get"  , route: "/os/inventory/"                            , url: "/api/os/inventory/"                            , source: "src/server/api/os/inventory/GET.ts"                              },
  handler$u  && { cb: handler$u , method: "post" , route: "/os/inventory/"                            , url: "/api/os/inventory/"                            , source: "src/server/api/os/inventory/POST.ts"                             },
  handler$v  && { cb: handler$v , method: "get"  , route: "/os/inventory/movements/"                  , url: "/api/os/inventory/movements/"                  , source: "src/server/api/os/inventory/movements/GET.ts"                    },
  handler$w  && { cb: handler$w , method: "get"  , route: "/os/lab/drafts/"                           , url: "/api/os/lab/drafts/"                           , source: "src/server/api/os/lab/drafts/GET.ts"                             },
  handler$x  && { cb: handler$x , method: "post" , route: "/os/lab/drafts/"                           , url: "/api/os/lab/drafts/"                           , source: "src/server/api/os/lab/drafts/POST.ts"                            },
  handler$y  && { cb: handler$y , method: "get"  , route: "/os/lab/handoff-audit/"                    , url: "/api/os/lab/handoff-audit/"                    , source: "src/server/api/os/lab/handoff-audit/GET.ts"                      },
  handler$z  && { cb: handler$z , method: "post" , route: "/os/lab/handoff-audit/"                    , url: "/api/os/lab/handoff-audit/"                    , source: "src/server/api/os/lab/handoff-audit/POST.ts"                     },
  undefined,
  handler$A  && { cb: handler$A , method: "get"  , route: "/os/nodes/"                                , url: "/api/os/nodes/"                                , source: "src/server/api/os/nodes/GET.ts"                                  },
  handler$B  && { cb: handler$B , method: "get"  , route: "/os/recipes/"                              , url: "/api/os/recipes/"                              , source: "src/server/api/os/recipes/GET.ts"                                },
  handler$C  && { cb: handler$C , method: "get"  , route: "/os/recipes/equipment-map/"                , url: "/api/os/recipes/equipment-map/"                , source: "src/server/api/os/recipes/equipment-map/GET.ts"                  },
  handler$D  && { cb: handler$D , method: "put"  , route: "/os/recipes/equipment-map/"                , url: "/api/os/recipes/equipment-map/"                , source: "src/server/api/os/recipes/equipment-map/PUT.ts"                  },
  handler$1  && { cb: handler$1 , method: "post" , route: "/os/recipes/import/"                       , url: "/api/os/recipes/import/"                       , source: "src/server/api/os/recipes/import/POST.ts"                        },
  handler$E  && { cb: handler$E , method: "post" , route: "/os/recipes/inbox/scan/"                   , url: "/api/os/recipes/inbox/scan/"                   , source: "src/server/api/os/recipes/inbox/scan/POST.ts"                    },
  handler$F  && { cb: handler$F , method: "get"  , route: "/os/recipes/inbox/status/"                 , url: "/api/os/recipes/inbox/status/"                 , source: "src/server/api/os/recipes/inbox/status/GET.ts"                   },
  handler$G  && { cb: handler$G , method: "post" , route: "/os/recipes/preflight/"                    , url: "/api/os/recipes/preflight/"                    , source: "src/server/api/os/recipes/preflight/POST.ts"                     },
  handler$H  && { cb: handler$H , method: "post" , route: "/os/recipes/run/start/"                    , url: "/api/os/recipes/run/start/"                    , source: "src/server/api/os/recipes/run/start/POST.ts"                     },
  handler$I  && { cb: handler$I , method: "post" , route: "/os/recipes/run/:runId/action/"            , url: "/api/os/recipes/run/:runId/action/"            , source: "src/server/api/os/recipes/run/[runId]/action/POST.ts"            },
  handler$J  && { cb: handler$J , method: "get"  , route: "/os/recipes/run/:runId/readings/"          , url: "/api/os/recipes/run/:runId/readings/"          , source: "src/server/api/os/recipes/run/[runId]/readings/GET.ts"           },
  handler$K  && { cb: handler$K , method: "post" , route: "/os/recipes/run/:runId/readings/"          , url: "/api/os/recipes/run/:runId/readings/"          , source: "src/server/api/os/recipes/run/[runId]/readings/POST.ts"          },
  handler$L  && { cb: handler$L , method: "post" , route: "/os/recipes/run/:runId/readings/snapshot/" , url: "/api/os/recipes/run/:runId/readings/snapshot/" , source: "src/server/api/os/recipes/run/[runId]/readings/snapshot/POST.ts" },
  handler$M  && { cb: handler$M , method: "get"  , route: "/os/recipes/run/:runId/runboard/"          , url: "/api/os/recipes/run/:runId/runboard/"          , source: "src/server/api/os/recipes/run/[runId]/runboard/GET.ts"           },
  handler$N  && { cb: handler$N , method: "put"  , route: "/os/recipes/run/:runId/runboard/"          , url: "/api/os/recipes/run/:runId/runboard/"          , source: "src/server/api/os/recipes/run/[runId]/runboard/PUT.ts"           },
  handler$O  && { cb: handler$O , method: "put"  , route: "/os/recipes/run/:runId/steps/:stepId/"     , url: "/api/os/recipes/run/:runId/steps/:stepId/"     , source: "src/server/api/os/recipes/run/[runId]/steps/[stepId]/PUT.ts"     },
  handler$P  && { cb: handler$P , method: "post" , route: "/os/recipes/run/:runId/transfer/"          , url: "/api/os/recipes/run/:runId/transfer/"          , source: "src/server/api/os/recipes/run/[runId]/transfer/POST.ts"          },
  handler$Q  && { cb: handler$Q , method: "get"  , route: "/os/recipes/runs/"                         , url: "/api/os/recipes/runs/"                         , source: "src/server/api/os/recipes/runs/GET.ts"                           },
  handler$R  && { cb: handler$R , method: "post" , route: "/os/recipes/runs/reset/"                   , url: "/api/os/recipes/runs/reset/"                   , source: "src/server/api/os/recipes/runs/reset/POST.ts"                    },
  handler$S  && { cb: handler$S , method: "get"  , route: "/os/recipes/transfer-map/"                 , url: "/api/os/recipes/transfer-map/"                 , source: "src/server/api/os/recipes/transfer-map/GET.ts"                   },
  handler$T  && { cb: handler$T , method: "put"  , route: "/os/recipes/transfer-map/"                 , url: "/api/os/recipes/transfer-map/"                 , source: "src/server/api/os/recipes/transfer-map/PUT.ts"                   },
  handler$U  && { cb: handler$U , method: "post" , route: "/os/recipes/transfer-map/autofill/"        , url: "/api/os/recipes/transfer-map/autofill/"        , source: "src/server/api/os/recipes/transfer-map/autofill/POST.ts"         },
  handler$V  && { cb: handler$V , method: "get"  , route: "/os/registry/devices/"                     , url: "/api/os/registry/devices/"                     , source: "src/server/api/os/registry/devices/GET.ts"                       },
  handler$W  && { cb: handler$W , method: "put"  , route: "/os/registry/devices/"                     , url: "/api/os/registry/devices/"                     , source: "src/server/api/os/registry/devices/PUT.ts"                       },
  handler$X  && { cb: handler$X , method: "post" , route: "/os/reservations/"                         , url: "/api/os/reservations/"                         , source: "src/server/api/os/reservations/POST.ts"                          },
  handler$Y  && { cb: handler$Y , method: "post" , route: "/os/reservations/:reservationId/action/"   , url: "/api/os/reservations/:reservationId/action/"   , source: "src/server/api/os/reservations/[reservationId]/action/POST.ts"   },
  handler$Z  && { cb: handler$Z , method: "get"  , route: "/os/telemetry/latest/"                     , url: "/api/os/telemetry/latest/"                     , source: "src/server/api/os/telemetry/latest/GET.ts"                       },
  handler$_  && { cb: handler$_ , method: "get"  , route: "/os/tiles/"                                , url: "/api/os/tiles/"                                , source: "src/server/api/os/tiles/GET.ts"                                  },
  handler$$  && { cb: handler$$ , method: "get"  , route: "/os/tiles/:tileId/"                        , url: "/api/os/tiles/:tileId/"                        , source: "src/server/api/os/tiles/[tileId]/GET.ts"                         }
].filter(it => it);

internal.map((it) => {
  const { method, route, url, source } = it;
  return { method, url, route, source };
});

internal.map(
  (it) => it.method?.toUpperCase() + "\t" + it.url
);

const applyRouters = (applyRouter) => {
  internal.forEach((it) => {
    it.cb = it.cb;
    applyRouter(it);
  });
};

// src/api-server/handler.ts
var handler = express();
applyRouters((props) => {
  const { method, route, path, cb } = props;
  if (handler[method]) {
    if (Array.isArray(cb)) {
      handler[method](route, ...cb);
    } else {
      handler[method](route, cb);
    }
  } else {
    console.log("Not Support", method, "for", route, "in", handler);
  }
});

export { alarmEvents as a, telemetryReadings as b, commandLog as c, db as d, endpointCurrent as e, deviceGroups as f, controllerNodes as g, hardwareEndpoints as h, interlockEvaluations as i, recipeRunner as j, deviceTiles as k, serverBefore as l, handler as m, serverAfter as n, schema as o, recipeInboxService as r, safetyInterlocks as s, tileEndpointBindings as t };
