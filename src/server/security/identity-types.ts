/**
 * CG-AG GOVERNANCE OS — ENTERPRISE IDENTITY & ACCESS CONTROL TYPES
 * Phase 9.2: Identity, RBAC, ABAC & Privileged Action Contracts
 */

export type EnterpriseRole =
  | 'CISO'
  | 'DPO'
  | 'AI_OFFICE'
  | 'LEGAL'
  | 'BOARD'
  | 'SECURITY_LEAD'
  | 'ENGINEER'
  | 'AUDITOR'
  | 'VIEWER';

export type EnterprisePermission =
  | 'VIEW_FINDING'
  | 'CREATE_DECISION'
  | 'APPROVE_HITL'
  | 'REJECT_HITL'
  | 'EXECUTE_REMEDIATION'
  | 'TRIGGER_CIRCUIT_BREAKER'
  | 'VERIFY_EVIDENCE'
  | 'VERIFY_LEDGER'
  | 'EXPORT_DOSSIER'
  | 'MANAGE_POLICY'
  | 'MANAGE_TENANT';

export type ActionCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserIdentity {
  userId: string;
  email: string;
  fullName: string;
  department: string;
  isActive: boolean;
  mfaEnrolled: boolean;
}

export interface TenantMembership {
  tenantId: string;
  workspaceId: string;
  roles: EnterpriseRole[];
  assignedAt: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
  roles: EnterpriseRole[];
  issuedAt: number;
  expiresAt: number;
  lastActivityAt: number;
  isRevoked: boolean;
  stepUpAuthenticated: boolean;
  stepUpExpiresAt?: number;
}

export interface AuthorizationContext {
  session: UserSession;
  resourceType: string;
  resourceId?: string;
  resourceTenantId?: string;
  resourceWorkspaceId?: string;
  action: EnterprisePermission;
  criticality: ActionCriticality;
  attributes?: Record<string, any>;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason: string;
  stepUpRequired?: boolean;
  securityEvidenceDigest?: string;
}
