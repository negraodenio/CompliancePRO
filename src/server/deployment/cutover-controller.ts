/**
 * CG-AG GOVERNANCE OS — CUTOVER CONTROLLER
 * Phase 9.4: State Machine & Formal Operator Authorization Gate
 */

import { ProductionPreflightEngine } from './production-preflight';
import crypto from 'crypto';

export type CutoverState =
  | 'PRECHECK'
  | 'READY_FOR_CUTOVER'
  | 'CUTOVER_REQUESTED'
  | 'CUTOVER_EXECUTING'
  | 'HEALTH_VALIDATION'
  | 'CUTOVER_SUCCESS'
  | 'ROLLBACK_REQUIRED'
  | 'ROLLED_BACK'
  | 'BLOCKED';

export interface OperatorAuthorization {
  operatorId: string;
  operatorRole: string;
  changeRequestId: string;
  reason: string;
  stepUpToken: string;
  authorizedAt: string;
  evidenceDigest: string;
}

export interface CutoverRecord {
  cutoverId: string;
  state: CutoverState;
  initiatedAt: string;
  completedAt?: string;
  authorization?: OperatorAuthorization;
  preflightPassed: boolean;
  healthVerified: boolean;
  rollbackTriggered: boolean;
}

export class CutoverController {
  private static activeCutover: CutoverRecord = {
    cutoverId: 'CUTOVER-INITIAL',
    state: 'READY_FOR_CUTOVER',
    initiatedAt: new Date().toISOString(),
    preflightPassed: true,
    healthVerified: false,
    rollbackTriggered: false
  };

  static getCurrentState(): CutoverRecord {
    return { ...this.activeCutover };
  }

  /**
   * Evaluates preflight and prepares cutover state
   */
  static evaluateReadiness(): CutoverState {
    const preflight = ProductionPreflightEngine.evaluatePreflight();
    if (!preflight.isReadyForCutover) {
      this.activeCutover.state = 'BLOCKED';
      this.activeCutover.preflightPassed = false;
    } else {
      this.activeCutover.state = 'READY_FOR_CUTOVER';
      this.activeCutover.preflightPassed = true;
    }
    return this.activeCutover.state;
  }

  /**
   * Registers formal operator authorization request (Does NOT execute cutover automatically)
   */
  static requestCutoverAuthorization(
    operatorId: string,
    operatorRole: string,
    changeRequestId: string,
    reason: string
  ): { success: boolean; cutoverId: string; state: CutoverState; authorization: OperatorAuthorization } {
    if (this.activeCutover.state === 'BLOCKED') {
      throw new Error('Cannot request cutover: Preflight checks are in BLOCKED state');
    }

    const authorizedAt = new Date().toISOString();
    const stepUpToken = `STEPUP-${crypto.randomBytes(8).toString('hex')}`;
    const authPayload = JSON.stringify({ operatorId, operatorRole, changeRequestId, reason, authorizedAt });
    const evidenceDigest = `SHA256:${crypto.createHash('sha256').update(authPayload).digest('hex')}`;

    const authorization: OperatorAuthorization = {
      operatorId,
      operatorRole,
      changeRequestId,
      reason,
      stepUpToken,
      authorizedAt,
      evidenceDigest
    };

    const cutoverId = `CUTOVER-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    this.activeCutover = {
      cutoverId,
      state: 'CUTOVER_REQUESTED',
      initiatedAt: authorizedAt,
      authorization,
      preflightPassed: true,
      healthVerified: false,
      rollbackTriggered: false
    };

    return {
      success: true,
      cutoverId,
      state: 'CUTOVER_REQUESTED',
      authorization
    };
  }
}
