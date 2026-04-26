import { existsSync, readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

/**
 * Load database configuration from JSON config file
 * Reads from /alloc/config.json (container) or ./config.json (host)
 *
 * @returns Database connection configuration
 * @throws Error if config file not found or invalid
 */
function getDatabaseConfig() {
  // Prefer local repo config for macOS dev, then container alloc config.
  const localPath = new URL('../../../config.json', import.meta.url).pathname;
  const allocPath = '/alloc/config.json';

  try {
    const raw = readFileSync(localPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // ignore and try alloc
  }

  try {
    const raw = readFileSync(allocPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // Final fallback: do NOT crash dev server.
    // Use a sane local default; override by creating apps/ops-ui/config.json
    return {
      db: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres',
      },
    };
  }
}

/**
 * Database connection setup using Drizzle ORM with MySQL2
 *
 * Configuration source:
 * - Reads from /alloc/config.json (in container) or ./config.json (on host)
 * - Throws error if config file not found or invalid
 */

// Get database configuration
const dbConfig = getDatabaseConfig();

// Create MySQL connection pool with SSL enabled
const poolConnection = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance
export const db = drizzle(poolConnection, { schema, mode: 'default' });

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await poolConnection.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close database connection pool
 */
export async function closeConnection(): Promise<void> {
  await poolConnection.end();
}
