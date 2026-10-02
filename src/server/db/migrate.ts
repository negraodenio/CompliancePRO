/**
 * ComplyPRO.pt — Database Migration Runner
 * 
 * Executes versioned migrations from src/server/db/migrations/
 * against PostgreSQL when DATABASE_URL is configured.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export async function runMigrations(): Promise<{ success: boolean; applied: string[]; error?: string }> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('[Migrator] DATABASE_URL is not set. For Supabase Cloud, migrations are applied via the Supabase Dashboard or CLI.');
    return { success: true, applied: [] };
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    const migrationsDir = path.resolve(process.cwd(), 'src/server/db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`[Migrator] Found ${files.length} versioned migration(s):`, files);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`[Migrator] Applying ${file}...`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');

      applied.push(file);
      console.log(`[Migrator] Applied ${file} successfully.`);
    }

    return { success: true, applied };
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Migrator] Migration failed:', err.message);
    return { success: false, applied, error: err.message };
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].includes('migrate')) {
  runMigrations().then(res => {
    if (!res.success) {
      process.exit(1);
    }
  });
}
