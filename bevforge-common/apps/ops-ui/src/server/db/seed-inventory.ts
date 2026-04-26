import { db } from './client';
import { products, productVariants, inventory, locations, containerTypes } from './schema';

/**
 * Seed script for Phase 1: Core Inventory System
 * 
 * Creates sample data:
 * - 5 products (different beer styles)
 * - Multiple variants per product (kegs, bottles, cans)
 * - Initial stock levels
 * - Warehouse location
 */

async function seedInventory() {
  console.log('🌱 Starting inventory seed...\n');

  try {
    // Create warehouse location if it doesn't exist
    const warehouseId = 'LOC-WAREHOUSE-001';
    await db.insert(locations).values({
      id: warehouseId,
      name: 'Main Warehouse',
      type: 'warehouse',
      address: '123 Brewery Lane, Brewtown, ST 12345',
      contactName: 'Warehouse Manager',
      contactPhone: '(555) 100-0001',
      contactEmail: 'warehouse@bevforge.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

    console.log('✅ Warehouse location created\n');

    // Create container types if they don't exist
    const containerTypesData = [
      {
        id: 'CT-KEG-50L',
        name: '50L Keg',
        category: 'keg' as const,
        volumeGallons: '13.21',
        depositAmount: '50.00',
        isReturnable: true,
      },
      {
        id: 'CT-KEG-30L',
        name: '30L Keg',
        category: 'keg' as const,
        volumeGallons: '7.93',
        depositAmount: '30.00',
        isReturnable: true,
      },
      {
        id: 'CT-KEG-20L',
        name: '20L Keg',
        category: 'keg' as const,
        volumeGallons: '5.28',
        depositAmount: '25.00',
        isReturnable: true,
      },
      {
        id: 'CT-CASE-12OZ',
        name: 'Case (24x12oz cans)',
        category: 'case' as const,
        volumeGallons: '2.25',
        depositAmount: '0.00',
        isReturnable: false,
      },
      {
        id: 'CT-CASE-16OZ',
        name: 'Case (24x16oz cans)',
        category: 'case' as const,
        volumeGallons: '3.00',
        depositAmount: '0.00',
        isReturnable: false,
      },
      {
        id: 'CT-CASE-330ML',
        name: 'Case (24x330ml bottles)',
        category: 'case' as const,
        volumeGallons: '2.09',
        depositAmount: '0.00',
        isReturnable: false,
      },
      {
        id: 'CT-6PACK-12OZ',
        name: '6-pack (12oz cans)',
        category: 'sixpack' as const,
        volumeGallons: '0.56',
        depositAmount: '0.00',
        isReturnable: false,
      },
    ];

    for (const ct of containerTypesData) {
      await db.insert(containerTypes).values({
        ...ct,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    }

    console.log('✅ Container types created\n');

    // Create 5 products with variants
    const productsData = [
      {
        id: 'PROD-001',
        sku: 'HT-IPA-001',
        name: 'Hoppy Trail IPA',
        productType: 'beer' as const,
        style: 'West Coast IPA',
        abv: '6.50',
        ibu: 65,
        srm: 8,
        description: 'A bold West Coast IPA with citrus and pine notes',
        tastingNotes: 'Grapefruit, pine, slight caramel malt backbone',
        ingredients: 'Water, Malted Barley, Hops (Cascade, Centennial, Chinook), Yeast',
        status: 'active' as const,
        variants: [
          {
            id: 'VAR-001-KEG50',
            containerTypeId: 'CT-KEG-50L',
            variantSku: 'HT-IPA-001-KEG50',
            size: '50L',
            unitOfMeasure: 'liters' as const,
            packSize: 'Single',
            wholesalePrice: '180.00',
            retailPrice: '220.00',
            taproomPrice: '7.00',
            productionCost: '120.00',
            depositAmount: '50.00',
            stock: 25,
            minStock: 10,
          },
          {
            id: 'VAR-001-CASE12',
            containerTypeId: 'CT-CASE-12OZ',
            variantSku: 'HT-IPA-001-CASE12',
            size: '12oz',
            unitOfMeasure: 'ounces' as const,
            packSize: 'Case (24 cans)',
            unitsPerCase: 24,
            wholesalePrice: '48.00',
            retailPrice: '54.00',
            taproomPrice: '2.50',
            productionCost: '32.00',
            depositAmount: '0.00',
            stock: 150,
            minStock: 50,
          },
          {
            id: 'VAR-001-6PACK',
            containerTypeId: 'CT-6PACK-12OZ',
            variantSku: 'HT-IPA-001-6PACK',
            size: '12oz',
            unitOfMeasure: 'ounces' as const,
            packSize: '6-pack',
            unitsPerCase: 6,
            wholesalePrice: '12.00',
            retailPrice: '13.99',
            taproomPrice: '12.99',
            productionCost: '8.00',
            depositAmount: '0.00',
            stock: 200,
            minStock: 75,
          },
        ],
      },
      {
        id: 'PROD-002',
        sku: 'GL-LAGER-001',
        name: 'Golden Lager',
        productType: 'beer' as const,
        style: 'German-style Lager',
        abv: '4.80',
        ibu: 22,
        srm: 4,
        description: 'Crisp and refreshing German-style lager',
        tastingNotes: 'Clean, bready malt, subtle hop bitterness',
        ingredients: 'Water, Pilsner Malt, Noble Hops, Lager Yeast',
        status: 'active' as const,
        variants: [
          {
            id: 'VAR-002-KEG50',
            containerTypeId: 'CT-KEG-50L',
            variantSku: 'GL-LAGER-001-KEG50',
            size: '50L',
            unitOfMeasure: 'liters' as const,
            packSize: 'Single',
            wholesalePrice: '160.00',
            retailPrice: '200.00',
            taproomPrice: '6.00',
            productionCost: '100.00',
            depositAmount: '50.00',
            stock: 30,
            minStock: 15,
          },
          {
            id: 'VAR-002-CASE330',
            containerTypeId: 'CT-CASE-330ML',
            variantSku: 'GL-LAGER-001-CASE330',
            size: '330ml',
            unitOfMeasure: 'milliliters' as const,
            packSize: 'Case (24 bottles)',
            unitsPerCase: 24,
            wholesalePrice: '42.00',
            retailPrice: '48.00',
            taproomPrice: '2.25',
            productionCost: '28.00',
            depositAmount: '0.00',
            stock: 180,
            minStock: 60,
          },
        ],
      },
      {
        id: 'PROD-003',
        sku: 'DN-STOUT-001',
        name: 'Dark Night Stout',
        productType: 'beer' as const,
        style: 'Coffee Stout',
        abv: '5.20',
        ibu: 35,
        srm: 40,
        description: 'Rich coffee stout with chocolate notes',
        tastingNotes: 'Roasted coffee, dark chocolate, smooth finish',
        ingredients: 'Water, Malted Barley, Roasted Barley, Coffee, Hops, Yeast',
        status: 'active' as const,
        variants: [
          {
            id: 'VAR-003-KEG30',
            containerTypeId: 'CT-KEG-30L',
            variantSku: 'DN-STOUT-001-KEG30',
            size: '30L',
            unitOfMeasure: 'liters' as const,
            packSize: 'Single',
            wholesalePrice: '120.00',
            retailPrice: '150.00',
            taproomPrice: '7.50',
            productionCost: '80.00',
            depositAmount: '30.00',
            stock: 20,
            minStock: 8,
          },
          {
            id: 'VAR-003-CASE16',
            containerTypeId: 'CT-CASE-16OZ',
            variantSku: 'DN-STOUT-001-CASE16',
            size: '16oz',
            unitOfMeasure: 'ounces' as const,
            packSize: 'Case (24 cans)',
            unitsPerCase: 24,
            wholesalePrice: '56.00',
            retailPrice: '64.00',
            taproomPrice: '3.00',
            productionCost: '38.00',
            depositAmount: '0.00',
            stock: 100,
            minStock: 40,
          },
        ],
      },
      {
        id: 'PROD-004',
        sku: 'PA-ALE-001',
        name: 'Pale Ale',
        productType: 'beer' as const,
        style: 'American Pale Ale',
        abv: '5.50',
        ibu: 42,
        srm: 10,
        description: 'Balanced American Pale Ale with citrus hops',
        tastingNotes: 'Orange, grapefruit, balanced malt sweetness',
        ingredients: 'Water, Pale Malt, Crystal Malt, American Hops, Yeast',
        status: 'active' as const,
        variants: [
          {
            id: 'VAR-004-KEG50',
            containerTypeId: 'CT-KEG-50L',
            variantSku: 'PA-ALE-001-KEG50',
            size: '50L',
            unitOfMeasure: 'liters' as const,
            packSize: 'Single',
            wholesalePrice: '170.00',
            retailPrice: '210.00',
            taproomPrice: '6.50',
            productionCost: '110.00',
            depositAmount: '50.00',
            stock: 18,
            minStock: 12,
          },
          {
            id: 'VAR-004-CASE12',
            containerTypeId: 'CT-CASE-12OZ',
            variantSku: 'PA-ALE-001-CASE12',
            size: '12oz',
            unitOfMeasure: 'ounces' as const,
            packSize: 'Case (24 cans)',
            unitsPerCase: 24,
            wholesalePrice: '45.00',
            retailPrice: '52.00',
            taproomPrice: '2.50',
            productionCost: '30.00',
            depositAmount: '0.00',
            stock: 120,
            minStock: 50,
          },
        ],
      },
      {
        id: 'PROD-005',
        sku: 'WW-WHEAT-001',
        name: 'Wheat Wave',
        productType: 'beer' as const,
        style: 'American Wheat Ale',
        abv: '4.50',
        ibu: 18,
        srm: 5,
        description: 'Light and refreshing wheat ale',
        tastingNotes: 'Citrus, wheat, slightly tart finish',
        ingredients: 'Water, Wheat Malt, Pale Malt, Hops, Yeast',
        status: 'seasonal' as const,
        variants: [
          {
            id: 'VAR-005-KEG20',
            containerTypeId: 'CT-KEG-20L',
            variantSku: 'WW-WHEAT-001-KEG20',
            size: '20L',
            unitOfMeasure: 'liters' as const,
            packSize: 'Single',
            wholesalePrice: '90.00',
            retailPrice: '110.00',
            taproomPrice: '6.00',
            productionCost: '60.00',
            depositAmount: '25.00',
            stock: 12,
            minStock: 5,
          },
          {
            id: 'VAR-005-6PACK',
            containerTypeId: 'CT-6PACK-12OZ',
            variantSku: 'WW-WHEAT-001-6PACK',
            size: '12oz',
            unitOfMeasure: 'ounces' as const,
            packSize: '6-pack',
            unitsPerCase: 6,
            wholesalePrice: '10.00',
            retailPrice: '11.99',
            taproomPrice: '10.99',
            productionCost: '6.50',
            depositAmount: '0.00',
            stock: 80,
            minStock: 30,
          },
        ],
      },
    ];

    // Insert products and variants
    for (const productData of productsData) {
      const { variants, ...product } = productData;

      // Insert product
      await db.insert(products).values({
        ...product,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

      console.log(`✅ Product created: ${product.name}`);

      // Insert variants and inventory
      for (const variant of variants) {
        const { stock, minStock, ...variantData } = variant;

        await db.insert(productVariants).values({
          ...variantData,
          productId: product.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

        // Create inventory record
        await db.insert(inventory).values({
          id: `INV-${variant.id}`,
          variantId: variant.id,
          locationId: warehouseId,
          quantityOnHand: stock,
          quantityAllocated: 0,
          quantityAvailable: stock,
          quantityInProduction: 0,
          minStockLevel: minStock,
          maxStockLevel: minStock * 3,
          reorderQuantity: minStock * 2,
          lastCountedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

        console.log(`  ✅ Variant: ${variantData.size} ${variantData.packSize} - Stock: ${stock}`);
      }

      console.log('');
    }

    console.log('🎉 Inventory seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - 5 products created`);
    console.log(`  - 13 product variants created`);
    console.log(`  - 13 inventory records created`);
    console.log(`  - 7 container types created`);
    console.log(`  - 1 warehouse location created\n`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run the seed
seedInventory()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
