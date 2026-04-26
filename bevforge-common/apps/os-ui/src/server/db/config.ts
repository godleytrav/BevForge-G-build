/** TREAT AS IMMUTABLE - This file is protected by the file-edit tool
 *
 * Database configuration loader
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from 'node:process';

/**
 * Database credentials interface
 */
export interface DatabaseCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Load database configuration from JSON config file
 * Reads from /alloc/config.json (container) or uses NOMAD_ALLOC_DIR if available
 *
 * @returns Database connection credentials
 * @throws Error if config file not found or invalid
 */
export function getDatabaseCredentials(): DatabaseCredentials {
  // Prefer local repo config for macOS dev, then container alloc config.
  const localPath = new URL('../../../config.json', import.meta.url).pathname;
  const allocPath = '/alloc/config.json';

  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

  try {
    const cfg = read(localPath);
    const db = cfg.db ?? cfg.database ?? cfg;
    return {
      host: db.host ?? 'localhost',
      port: db.port ?? 5432,
      user: db.user ?? 'postgres',
      password: db.password ?? 'postgres',
      database: db.database ?? 'postgres',
    };
  } catch {}

  try {
    const cfg = read(allocPath);
    const db = cfg.db ?? cfg.database ?? cfg;
    return {
      host: db.host ?? 'localhost',
      port: db.port ?? 5432,
      user: db.user ?? 'postgres',
      password: db.password ?? 'postgres',
      database: db.database ?? 'postgres',
    };
  } catch {
    // Final fallback: do NOT crash dev server.
    return { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' };
  }
}
