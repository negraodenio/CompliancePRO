/**
 * CG-AG GOVERNANCE OS — BACKUP & RESTORE RECOVERY MANAGER
 * Phase 9.1 Step 4: Disaster Recovery & Causal Lineage Restorer
 */

import { PersistenceAdapter } from '../../web/services/persistence-adapter';
import { DatabaseReconciler, ReconciliationReport } from './reconciliation';
import crypto from 'crypto';

export interface BackupSnapshot {
  snapshotId: string;
  createdAt: string;
  tenantId: string;
  workspaceId: string;
  recordCounts: Record<string, number>;
  collectionsData: Record<string, any>;
  snapshotDigest: string;
}

export class BackupRestoreManager {
  /**
   * Generates a point-in-time backup snapshot with cryptographic digest
   */
  static createSnapshot(tenantId = 'TENANT-DEFAULT', workspaceId = 'WS-DEFAULT'): BackupSnapshot {
    const snapshotId = `BKP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const collections = [
      'findings',
      'hitl_gates',
      'remediations',
      'incidents',
      'finops',
      'evidence',
      'audit_ledger',
      'dossiers',
      'policies',
      'entities'
    ];

    const collectionsData: Record<string, any> = {};
    const recordCounts: Record<string, number> = {};

    for (const c of collections) {
      const data = PersistenceAdapter.read(c);
      collectionsData[c] = data;
      recordCounts[c] = Array.isArray(data) ? data.length : (data ? 1 : 0);
    }

    const payloadString = JSON.stringify({ tenantId, workspaceId, collectionsData });
    const snapshotDigest = crypto.createHash('sha256').update(payloadString).digest('hex');

    return {
      snapshotId,
      createdAt: new Date().toISOString(),
      tenantId,
      workspaceId,
      recordCounts,
      collectionsData,
      snapshotDigest: `SHA256:${snapshotDigest}`
    };
  }

  /**
   * Restores data from a backup snapshot and executes integrity reconciliation
   */
  static restoreSnapshot(snapshot: BackupSnapshot): {
    success: boolean;
    restoredCollections: number;
    reconciliation: ReconciliationReport;
  } {
    PersistenceAdapter.resetAllForTesting();
    PersistenceAdapter.setContext({
      tenantId: snapshot.tenantId,
      workspaceId: snapshot.workspaceId,
      environment: 'production'
    });

    let restoredCollections = 0;
    for (const [coll, data] of Object.entries(snapshot.collectionsData)) {
      if (data !== null && data !== undefined) {
        PersistenceAdapter.write(coll, data);
        restoredCollections++;
      }
    }

    const reconciliation = DatabaseReconciler.reconcileBaseline();

    return {
      success: true,
      restoredCollections,
      reconciliation
    };
  }
}
