import { db } from './client';
import { sql } from 'drizzle-orm';

async function updateExistingProducts() {
  try {
    console.log('🔄 Updating existing products with default values...');
    
    // Update existing products to have SKU values
    await db.execute(sql`
      UPDATE products 
      SET 
        sku = CONCAT('SKU-', id),
        product_type = 'beer',
        status = 'active',
        is_active = TRUE
      WHERE sku IS NULL OR sku = ''
    `);
    
    console.log('✅ Products updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateExistingProducts();
