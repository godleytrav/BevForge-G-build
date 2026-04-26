import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('🔄 Running manual migration...');
    
    // Read the SQL file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'drizzle', 'manual-migration-001.sql'),
      'utf-8'
    );
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await db.execute(sql.raw(statement));
      }
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
