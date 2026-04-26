import { mysqlTable, varchar, decimal, int, text, timestamp, mysqlEnum, boolean, date } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// OPS SCHEMA - BUSINESS LAYER ONLY
// ============================================================================
// This schema focuses on business operations: customers, orders, invoicing
// Physical inventory truth lives in OS (Operating System) module
// OPS reads inventory data via OS API - never duplicates quantities
// ============================================================================

// ----------------------------------------------------------------------------
// PRODUCTS - Business Profile Only (References OS Items)
// ----------------------------------------------------------------------------
// This table stores business metadata for products
// Physical inventory quantities come from OS API
export const products = mysqlTable('products', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  style: varchar('style', { length: 100 }),
  abv: decimal('abv', { precision: 4, scale: 2 }),
  ibu: int('ibu'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// CONTAINER TYPES - Package Definitions
// ----------------------------------------------------------------------------
export const containerTypes = mysqlTable('container_types', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  size: varchar('size', { length: 50 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  units_per_case: int('units_per_case').default(1),
  deposit_amount: decimal('deposit_amount', { precision: 10, scale: 2 }).default('0.00'),
  created_at: timestamp('created_at').defaultNow(),
});

// ----------------------------------------------------------------------------
// CUSTOMERS - Business Relationships
// ----------------------------------------------------------------------------
export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contact_name: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  customer_type: mysqlEnum('customer_type', ['retail', 'wholesale', 'distributor', 'taproom']).default('retail'),
  status: mysqlEnum('status', ['active', 'inactive', 'suspended']).default('active'),
  credit_limit: decimal('credit_limit', { precision: 10, scale: 2 }).default('0.00'),
  payment_terms: varchar('payment_terms', { length: 50 }).default('net_30'),
  tax_exempt: boolean('tax_exempt').default(false),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// ORDERS - Sales Orders
// ----------------------------------------------------------------------------
export const orders = mysqlTable('orders', {
  id: varchar('id', { length: 50 }).primaryKey(),
  order_number: varchar('order_number', { length: 50 }).notNull().unique(),
  customer_id: varchar('customer_id', { length: 50 }).notNull(),
  order_date: timestamp('order_date').notNull(),
  delivery_date: timestamp('delivery_date'),
  status: mysqlEnum('status', ['draft', 'approved', 'packed', 'loaded', 'delivered', 'cancelled']).default('draft'),
  source: mysqlEnum('source', ['website', 'phone', 'email', 'in_person', 'system']).default('system'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  deposit_amount: decimal('deposit_amount', { precision: 10, scale: 2 }).default('0.00'),
  total_amount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  delivery_instructions: text('delivery_instructions'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// ORDER LINE ITEMS - Order Details
// ----------------------------------------------------------------------------
export const orderLineItems = mysqlTable('order_line_items', {
  id: varchar('id', { length: 50 }).primaryKey(),
  order_id: varchar('order_id', { length: 50 }).notNull(),
  product_id: varchar('product_id', { length: 50 }).notNull(),
  container_type_id: varchar('container_type_id', { length: 50 }).notNull(),
  quantity: int('quantity').notNull(),
  unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  deposit_per_unit: decimal('deposit_per_unit', { precision: 10, scale: 2 }).default('0.00'),
  line_total: decimal('line_total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
});

// ----------------------------------------------------------------------------
// BATCHES - Production Runs (Minimal - Full data in OS)
// ----------------------------------------------------------------------------
// This is a reference table only
// Full batch data (materials, yields, QC) lives in OS
export const batches = mysqlTable('batches', {
  id: varchar('id', { length: 50 }).primaryKey(),
  batch_number: varchar('batch_number', { length: 50 }).notNull().unique(),
  product_id: varchar('product_id', { length: 50 }).notNull(),
  brew_date: date('brew_date').notNull(),
  package_date: date('package_date'),
  status: mysqlEnum('status', ['planning', 'brewing', 'fermenting', 'conditioning', 'packaging', 'completed', 'cancelled']).default('planning'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// INVOICES - Billing Documents
// ----------------------------------------------------------------------------
export const invoices = mysqlTable('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  invoice_number: varchar('invoice_number', { length: 50 }).notNull().unique(),
  order_id: varchar('order_id', { length: 50 }),
  customer_id: varchar('customer_id', { length: 50 }).notNull(),
  invoice_date: timestamp('invoice_date').notNull(),
  due_date: timestamp('due_date').notNull(),
  status: mysqlEnum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  total_amount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  amount_paid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0.00'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// VENDORS - Supplier Relationships
// ----------------------------------------------------------------------------
export const vendors = mysqlTable('vendors', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contact_name: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  vendor_type: mysqlEnum('vendor_type', ['ingredients', 'packaging', 'equipment', 'services', 'other']).default('other'),
  status: mysqlEnum('status', ['active', 'inactive']).default('active'),
  payment_terms: varchar('payment_terms', { length: 50 }).default('net_30'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// PURCHASE ORDERS - Procurement
// ----------------------------------------------------------------------------
export const purchaseOrders = mysqlTable('purchase_orders', {
  id: varchar('id', { length: 50 }).primaryKey(),
  po_number: varchar('po_number', { length: 50 }).notNull().unique(),
  vendor_id: varchar('vendor_id', { length: 50 }).notNull(),
  order_date: timestamp('order_date').notNull(),
  expected_date: timestamp('expected_date'),
  status: mysqlEnum('status', ['draft', 'sent', 'confirmed', 'received', 'cancelled']).default('draft'),
  total_amount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ----------------------------------------------------------------------------
// RELATIONS
// ----------------------------------------------------------------------------
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
  lineItems: many(orderLineItems),
}));

export const orderLineItemsRelations = relations(orderLineItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderLineItems.order_id],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderLineItems.product_id],
    references: [products.id],
  }),
  containerType: one(containerTypes, {
    fields: [orderLineItems.container_type_id],
    references: [containerTypes.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  invoices: many(invoices),
}));

export const batchesRelations = relations(batches, ({ one }) => ({
  product: one(products, {
    fields: [batches.product_id],
    references: [products.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, {
    fields: [invoices.customer_id],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [invoices.order_id],
    references: [orders.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  vendor: one(vendors, {
    fields: [purchaseOrders.vendor_id],
    references: [vendors.id],
  }),
}));
