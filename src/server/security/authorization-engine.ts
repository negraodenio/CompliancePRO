/**
 * CG-AG GOVERNANCE OS — ENTERPRISE RBAC/ABAC AUTHORIZATION ENGINE
 * Phase 9.2: Backend Policy Enforcement & Privileged Action Gates
 */

import {
  EnterpriseRole,
  EnterprisePermission,
  AuthorizationContext,
  AuthorizationResult,
  ActionCriticality
} from './identity-types';
import crypto from 'crypto';

export class AuthorizationEngine {
  /**
   * RBAC Matrix: Role to Allowed Permissions Map
   */
  private static rolePermissions: Record<EnterpriseRole, EnterprisePermission[]> = {
    CISO: [
      'VIEW_FINDING',
      'CREATE_DECISION',
      'APPROVE_HITL',
      'REJECT_HITL',
      'EXECUTE_REMEDIATION',
      'TRIGGER_CIRCUIT_BREAKER',
      'VERIFY_EVIDENCE',
      'VERIFY_LEDGER',
      'EXPORT_DOSSIER',
      'MANAGE_POLICY',
      'MANAGE_TENANT'
    ],
    DPO: [
      'VIEW_FINDING',
      'CREATE_DECISION',
      'VERIFY_EVIDENCE',
      'VERIFY_LEDGER',
      'EXPORT_DOSSIER',
      'MANAGE_POLICY'
    ],
    AI_OFFICE: [
      'VIEW_FINDING',
      'CREATE_DECISION',
      'APPROVE_HITL',
      'REJECT_HITL',
      'VERIFY_EVIDENCE',
      'VERIFY_LEDGER',
      'EXPORT_DOSSIER',
      'MANAGE_POLICY'
    ],
    LEGAL: [
      'VIEW_FINDING',
      'CREATE_DECISION',
      'VERIFY_EVIDENCE',
      'EXPORT_DOSSIER'
    ],
    BOARD: [
      'VIEW_FINDING',
      'VERIFY_EVIDENCE',
      'VERIFY_LEDGER',
      'EXPORT_DOSSIER'
    ],
    SECURITY_LEAD: [
      'VIEW_FINDING',
      'CREATE_DECISION',
      'APPROVE_HITL',
      'REJECT_HITL',
      'EXECUTE_REMEDIATION',
      'TRIGGER_CIRCUIT_BREAKER',
      'VERIFY_EVIDENCE'
    ],
    ENGINEER: [
      'VIEW_FINDING',
      'EXECUTE_REMEDIATION',
      'VERIFY_EVIDENCE'
    ],
    AUDITOR: [
      'VIEW_FINDING',
      'VERIFY_EVIDENCE',
      'VERIFY_LEDGER',
      'EXPORT_DOSSIER'
    ],
    VIEWER: [
      'VIEW_FINDING'
    ]
  };

  /**
   * Evaluates RBAC & ABAC authorization rules at the backend/persistence boundary
   */
  static evaluate(context: AuthorizationContext): AuthorizationResult {
    const { session, action, criticality, resourceTenantId, resourceWorkspaceId } = context;

    // 1. Session Liveness & Revocation Check
    if (session.isRevoked) {
      return { allowed: false, reason: 'SESSION_REVOKED: Operation rejected due to revoked credentials' };
    }

    if (Date.now() > session.expiresAt) {
      return { allowed: false, reason: 'SESSION_EXPIRED: Operation rejected due to expired session' };
    }

    // 2. Strict Tenant & Workspace Boundary Enforcement
    if (resourceTenantId && resourceTenantId !== session.tenantId) {
      return {
        allowed: false,
        reason: `TENANT_VIOLATION: User in tenant [${session.tenantId}] cannot access resource in [${resourceTenantId}]`
      };
    }

    if (resourceWorkspaceId && resourceWorkspaceId !== session.workspaceId) {
      return {
        allowed: false,
        reason: `WORKSPACE_VIOLATION: User in workspace [${session.workspaceId}] cannot access resource in [${resourceWorkspaceId}]`
      };
    }

    // 3. RBAC Permission Check
    const userPermissions = new Set<EnterprisePermission>();
    for (const role of session.roles) {
      const perms = this.rolePermissions[role] || [];
      perms.forEach(p => userPermissions.add(p));
    }

    if (!userPermissions.has(action)) {
      return {
        allowed: false,
        reason: `RBAC_DENIED: Roles [${session.roles.join(', ')}] do not grant permission [${action}]`
      };
    }

    // 4. ABAC Privileged Action & Step-Up Authentication Check
    if (criticality === 'HIGH' || criticality === 'CRITICAL') {
      const isStepUpActive = session.stepUpAuthenticated && (!session.stepUpExpiresAt || Date.now() < session.stepUpExpiresAt);
      if (!isStepUpActive && (action === 'APPROVE_HITL' || action === 'MANAGE_POLICY' || action === 'MANAGE_TENANT')) {
        return {
          allowed: false,
          stepUpRequired: true,
          reason: `STEP_UP_REQUIRED: Critical action [${action}] requires step-up re-authentication`
        };
      }
    }

    // 5. Generate Security Audit Evidence Digest
    const auditPayload = JSON.stringify({
      userId: session.userId,
      tenantId: session.tenantId,
      workspaceId: session.workspaceId,
      action,
      criticality,
      timestamp: new Date().toISOString()
    });
    const securityEvidenceDigest = `SHA256:${crypto.createHash('sha256').update(auditPayload).digest('hex')}`;

    return {
      allowed: true,
      reason: 'AUTHORIZATION_GRANTED: Request complies with RBAC, ABAC and tenant scoping invariants',
      securityEvidenceDigest
    };
  }
}
