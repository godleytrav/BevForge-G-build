/**
 * Control Dataset Seed Script
 * 
 * This script seeds the database with realistic test data:
 * - 3 customer locations (pre-existing)
 * - 3 products (1 can, 1 bottle, 1 keg)
 * - 3 container types
 * - 3 orders (web, email, phone)
 * 
 * Run with: pnpm db:seed
 */

import { db } from './client';
import { 
  locations,
  products, 
  containerTypes,
  orders, 
  orderLineItems
} from './schema';

async function seedControlDataset() {
  console.log('🌱 Starting control dataset seed...\\n');

  try {
    // Step 1: Create 3 Customer Locations (Pre-existing)
    console.log('👥 Creating customer locations...');
    
    await db.insert(locations).values([
      {
        id: 'CUST-001',
        name: 'Downtown Pub',
        type: 'customer',
        address: '123 Main Street',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        contactName: 'Mike Johnson',
        contactPhone: '(555) 123-4567',
        contactEmail: 'mike@downtownpub.com',
        notes: 'Regular customer, weekly orders',
      },
      {
        id: 'CUST-002',
        name: 'Riverside Restaurant',
        type: 'customer',
        address: '456 River Road',
        city: 'Portland',
        state: 'OR',
        zipCode: '97202',
        contactName: 'Sarah Chen',
        contactPhone: '(555) 234-5678',
        contactEmail: 'sarah@riverside.com',
        notes: 'Prefers phone orders, delivery on Thursdays',
      },
      {
        id: 'CUST-003',
        name: 'City Bar & Grill',
        type: 'customer',
        address: '789 Downtown Ave',
        city: 'Portland',
        state: 'OR',
        zipCode: '97203',
        contactName: 'Tom Martinez',
        contactPhone: '(555) 345-6789',
        contactEmail: 'tom@citybargrill.com',
        notes: 'Email orders only, requires 24hr notice',
      },
    ]);

    console.log(`✅ Created 3 customer locations`);
    console.log(`   - Downtown Pub (ID: CUST-001)`);
    console.log(`   - Riverside Restaurant (ID: CUST-002)`);
    console.log(`   - City Bar & Grill (ID: CUST-003)\\n`);

    // Step 2: Create 3 Container Types
    console.log('📦 Creating container types...');

    await db.insert(containerTypes).values([
      {
        id: 'CAN-355',
        name: '355ml Can',
        category: 'can',
        size: '355ml',
        unitsPerCase: 24,
        depositAmount: '0.00',
        isReturnable: false,
      },
      {
        id: 'BTL-330',
        name: '330ml Bottle',
        category: 'bottle',
        size: '330ml',
        unitsPerCase: 24,
        depositAmount: '0.00',
        isReturnable: true,
      },
      {
        id: 'KEG-50L',
        name: '50L Keg',
        category: 'keg',
        size: '50L',
        unitsPerCase: 1,
        depositAmount: '50.00',
        isReturnable: true,
      },
    ]);

    console.log(`✅ Created 3 container types\\n`);

    // Step 3: Create 3 Products (Can, Bottle, Keg)
    console.log('🍺 Creating products...');

    await db.insert(products).values([
      {
        id: 'PROD-001',
        sku: 'IPA-CAN-355',
        name: 'Hoppy Trail IPA',
        description: 'West Coast IPA with citrus and pine notes',
        category: 'beer',
        type: 'IPA',
        abv: '6.5',
        ibu: 65,
        status: 'active',
      },
      {
        id: 'PROD-002',
        sku: 'LAGER-BTL-330',
        name: 'Golden Lager',
        description: 'Crisp, refreshing German-style lager',
        category: 'beer',
        type: 'Lager',
        abv: '4.8',
        ibu: 22,
        status: 'active',
      },
      {
        id: 'PROD-003',
        sku: 'STOUT-KEG-50L',
        name: 'Dark Night Stout',
        description: 'Rich, creamy stout with coffee and chocolate notes',
        category: 'beer',
        type: 'Stout',
        abv: '5.2',
        ibu: 35,
        status: 'active',
      },
    ]);

    console.log(`✅ Created 3 products`);
    console.log(`   - Hoppy Trail IPA (can, ID: PROD-001)`);
    console.log(`   - Golden Lager (bottle, ID: PROD-002)`);
    console.log(`   - Dark Night Stout (keg, ID: PROD-003)\\n`);

    // Step 4: Create Order #1 - WEB ORDER (System Generated)
    console.log('🌐 Creating WEB order (system-generated)...');

    await db.insert(orders).values({
      id: 'ORD-WEB-001',
      orderNumber: 'WEB-2025-001',
      customerId: 'CUST-001',
      status: 'draft', // Needs approval
      orderSource: 'website',
      orderDate: new Date('2024-12-24T09:15:00'),
      deliveryDate: new Date('2024-12-26T10:00:00'),
      subtotal: '96.00', // 2 cases x $48
      tax: '8.64', // 9% tax
      shipping: '15.00',
      total: '119.64',
      depositAmount: '0.00',
      depositPaid: false,
      paymentStatus: 'pending',
      paymentMethod: 'credit_card',
      deliveryMethod: 'delivery',
      notes: 'Customer requested morning delivery. Order auto-generated from website.',
      internalNotes: 'System-generated web order - needs approval before fulfillment',
    });

    await db.insert(orderLineItems).values([
      {
        id: 'LINE-WEB-001',
        orderId: 'ORD-WEB-001',
        productId: 'PROD-001',
        containerTypeId: 'CAN-355',
        quantity: 2, // 2 cases
        unitPrice: '48.00',
        subtotal: '96.00',
        tax: '8.64',
        total: '104.64',
        notes: 'Hoppy Trail IPA - 24x355ml cans per case',
      },
    ]);

    console.log(`✅ Created order: WEB-2025-001`);
    console.log(`   - Customer: Downtown Pub`);
    console.log(`   - Source: Website (system-generated)`);
    console.log(`   - Status: draft (needs approval)`);
    console.log(`   - Total: $119.64`);
    console.log(`   - Items: 2 cases Hoppy Trail IPA (cans)\\n`);

    // Step 5: Create Order #2 - PHONE ORDER (Manual Entry)
    console.log('📞 Creating PHONE order (manual entry)...');

    await db.insert(orders).values({
      id: 'ORD-PHONE-001',
      orderNumber: 'PHONE-2025-001',
      customerId: 'CUST-002',
      status: 'draft', // Needs approval
      orderSource: 'phone',
      orderDate: new Date('2024-12-24T11:30:00'),
      deliveryDate: new Date('2024-12-27T14:00:00'),
      subtotal: '260.00', // 5 cases x $52
      tax: '23.40', // 9% tax
      shipping: '20.00',
      total: '303.40',
      depositAmount: '0.00',
      depositPaid: false,
      paymentStatus: 'pending',
      paymentMethod: 'invoice',
      deliveryMethod: 'delivery',
      notes: 'Customer called in order. Prefers Thursday afternoon delivery.',
      internalNotes: 'Phone order taken by staff - customer requested NET30 payment terms',
    });

    await db.insert(orderLineItems).values([
      {
        id: 'LINE-PHONE-001',
        orderId: 'ORD-PHONE-001',
        productId: 'PROD-002',
        containerTypeId: 'BTL-330',
        quantity: 5, // 5 cases
        unitPrice: '52.00',
        subtotal: '260.00',
        tax: '23.40',
        total: '283.40',
        notes: 'Golden Lager - 24x330ml bottles per case',
      },
    ]);

    console.log(`✅ Created order: PHONE-2025-001`);
    console.log(`   - Customer: Riverside Restaurant`);
    console.log(`   - Source: Phone (manual entry)`);
    console.log(`   - Status: draft (needs approval)`);
    console.log(`   - Total: $303.40`);
    console.log(`   - Items: 5 cases Golden Lager (bottles)\\n`);

    // Step 6: Create Order #3 - EMAIL ORDER (Manual Entry)
    console.log('📧 Creating EMAIL order (manual entry)...');

    await db.insert(orders).values({
      id: 'ORD-EMAIL-001',
      orderNumber: 'EMAIL-2025-001',
      customerId: 'CUST-003',
      status: 'draft', // Needs approval
      orderSource: 'email',
      orderDate: new Date('2024-12-24T13:45:00'),
      deliveryDate: new Date('2024-12-25T16:00:00'),
      subtotal: '284.00', // 1 keg ($180) + 2 cases ($52 x 2)
      tax: '25.56', // 9% tax
      shipping: '25.00',
      total: '334.56',
      depositAmount: '50.00', // Keg deposit
      depositPaid: false,
      paymentStatus: 'pending',
      paymentMethod: 'invoice',
      deliveryMethod: 'delivery',
      notes: 'Customer emailed order. Rush delivery requested for Christmas event.',
      internalNotes: 'Email order - customer needs keg for holiday event, priority delivery',
    });

    await db.insert(orderLineItems).values([
      {
        id: 'LINE-EMAIL-001',
        orderId: 'ORD-EMAIL-001',
        productId: 'PROD-003',
        containerTypeId: 'KEG-50L',
        quantity: 1, // 1 keg
        unitPrice: '180.00',
        subtotal: '180.00',
        tax: '16.20',
        total: '196.20',
        notes: 'Dark Night Stout - 50L keg',
      },
      {
        id: 'LINE-EMAIL-002',
        orderId: 'ORD-EMAIL-001',
        productId: 'PROD-002',
        containerTypeId: 'BTL-330',
        quantity: 2, // 2 cases
        unitPrice: '52.00',
        subtotal: '104.00',
        tax: '9.36',
        total: '113.36',
        notes: 'Golden Lager - 24x330ml bottles per case',
      },
    ]);

    console.log(`✅ Created order: EMAIL-2025-001`);
    console.log(`   - Customer: City Bar & Grill`);
    console.log(`   - Source: Email (manual entry)`);
    console.log(`   - Status: draft (needs approval)`);
    console.log(`   - Total: $334.56 (includes $50.00 keg deposit)`);
    console.log(`   - Items: 1 keg Dark Night Stout + 2 cases Golden Lager (bottles)\\n`);

    // Summary
    console.log('✅ Control dataset seed complete!\\n');
    console.log('📊 Summary:');
    console.log('   - 3 customer locations created');
    console.log('   - 3 container types created');
    console.log('   - 3 products created (can, bottle, keg)');
    console.log('   - 3 orders created (web, phone, email)');
    console.log('   - All orders in "draft" status (need approval)\\n');
    console.log('🎯 Next steps:');
    console.log('   1. Hard refresh your browser');
    console.log('   2. Go to /ops/orders');
    console.log('   3. Review and approve orders');
    console.log('   4. Test full workflow from draft → delivered\\n');

  } catch (error) {
    console.error('❌ Error seeding control dataset:', error);
    throw error;
  }
}

// Run the seed
seedControlDataset()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
