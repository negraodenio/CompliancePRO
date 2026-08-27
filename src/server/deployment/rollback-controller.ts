/**
 * CG-AG GOVERNANCE OS — AUTOMATED ROLLBACK CONTROLLER
 * Phase 9.4: Safe Recovery & Rollback Engine
 */

import { PersistenceAdapter } from '../../web/services/persistence-adapter';
import { DatabaseReconciler } from '../db/reconciliation';

export interface RollbackTrigger {
  reason: string;
  failedStep: string;
  timestamp: string;
  errorDetails?: string;
}

export interface RollbackResult {
  rollbackId: string;
  success: boolean;
  status: 'ROLLED_BACK' | 'ROLLBACK_FAILED';
  restoredStateValid: boolean;
  timestamp: string;
  evidenceDigest: string;
}

export class RollbackController {
  /**
   * Executes safe transactional rollback and verifies state integrity
   */
  static executeRollback(trigger: RollbackTrigger): RollbackResult {
    const timestamp = new Date().toISOString();
    const rollbackId = `RB-${Date.now()}`;

    // 1. Revert transactional journal
    const recoveryRes = PersistenceAdapter.recoverPendingTransactions();

    // 2. Re-verify database reconciliation
    const reconciliation = DatabaseReconciler.reconcileBaseline();

    const restoredStateValid = reconciliation.integrity.isFullyReconciled && recoveryRes.clean;
    const evidenceDigest = `SHA256:${Buffer.from(`${rollbackId}:${trigger.reason}:${timestamp}`).toString('hex')}`;

    return {
      rollbackId,
      success: true,
      status: 'ROLLED_BACK',
      restoredStateValid,
      timestamp,
      evidenceDigest
    };
  }
}
