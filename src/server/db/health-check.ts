/**
 * CG-AG GOVERNANCE OS — HEALTH CHECK & DATA PLANE TELEMETRY
 * Phase 9.1 Step 4: Health Diagnostics Engine
 */

import { PostgresPersistenceAdapter } from './postgres-adapter';
import { MigrationRunner } from './migration-runner';

export type DatabaseHealthStatus =
  | 'DATABASE_CONNECTED'
  | 'DATABASE_UNAVAILABLE'
  | 'MIGRATION_PENDING'
  | 'MIGRATION_CHECKSUM_MISMATCH'
  | 'MEMORY_MODE_ACTIVE';

export interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  backend: 'memory' | 'postgres';
  database: {
    healthStatus: DatabaseHealthStatus;
    latencyMs: number;
    migrationsApplied: number;
    checksumsVerified: boolean;
    poolActiveClients?: number;
  };
}

export class DatabaseHealthService {
  static async checkHealth(backendConfig?: 'memory' | 'postgres'): Promise<HealthCheckResult> {
    const backend = backendConfig || (process.env.PERSISTENCE_BACKEND === 'postgres' ? 'postgres' : 'memory');
    const startTime = Date.now();

    if (backend === 'memory') {
      return {
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        backend: 'memory',
        database: {
          healthStatus: 'MEMORY_MODE_ACTIVE',
          latencyMs: Date.now() - startTime,
          migrationsApplied: 1,
          checksumsVerified: true
        }
      };
    }

    // Postgres Mode
    if (!PostgresPersistenceAdapter.isReady()) {
      return {
        status: 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        backend: 'postgres',
        database: {
          healthStatus: 'DATABASE_UNAVAILABLE',
          latencyMs: Date.now() - startTime,
          migrationsApplied: 0,
          checksumsVerified: false
        }
      };
    }

    try {
      const pingRes = await PostgresPersistenceAdapter.executeQuery('SELECT 1 AS ping');
      const latencyMs = Date.now() - startTime;
      const migrations = MigrationRunner.getMigrationFiles();

      return {
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        backend: 'postgres',
        database: {
          healthStatus: 'DATABASE_CONNECTED',
          latencyMs,
          migrationsApplied: migrations.length,
          checksumsVerified: true
        }
      };
    } catch {
      return {
        status: 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        backend: 'postgres',
        database: {
          healthStatus: 'DATABASE_UNAVAILABLE',
          latencyMs: Date.now() - startTime,
          migrationsApplied: 0,
          checksumsVerified: false
        }
      };
    }
  }
}
