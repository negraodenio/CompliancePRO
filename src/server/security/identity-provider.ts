/**
 * CG-AG GOVERNANCE OS — IDENTITY PROVIDER ABSTRACTION
 * Phase 9.2: Pluggable Identity & Session Manager
 */

import { UserIdentity, UserSession, EnterpriseRole, TenantMembership } from './identity-types';
import crypto from 'crypto';

export interface IdPConfig {
  providerType: 'MOCK_MEMORY' | 'OIDC' | 'SAML2' | 'OAUTH2';
  sessionTtlMs?: number;
  idleTimeoutMs?: number;
}

export class IdentityProvider {
  private static sessions = new Map<string, UserSession>();
  private static users = new Map<string, { user: UserIdentity; memberships: TenantMembership[] }>();
  private static sessionTtlMs = 8 * 60 * 60 * 1000; // 8 hours
  private static idleTimeoutMs = 30 * 60 * 1000; // 30 minutes

  static initializeBaselineUsers(): void {
    this.users.clear();
    this.sessions.clear();

    const baselineUsers: Array<{ user: UserIdentity; memberships: TenantMembership[] }> = [
      {
        user: {
          userId: 'USR-CISO-01',
          email: 'roberto.silva@enterprise.ai',
          fullName: 'Roberto Silva',
          department: 'Security & Risk',
          isActive: true,
          mfaEnrolled: true
        },
        memberships: [
          { tenantId: 'TENANT-DEFAULT', workspaceId: 'WS-DEFAULT', roles: ['CISO', 'SECURITY_LEAD'], assignedAt: '2026-08-25T00:00:00Z' }
        ]
      },
      {
        user: {
          userId: 'USR-DPO-02',
          email: 'carlos.eduardo@enterprise.ai',
          fullName: 'Carlos Eduardo',
          department: 'Legal & Privacy',
          isActive: true,
          mfaEnrolled: true
        },
        memberships: [
          { tenantId: 'TENANT-DEFAULT', workspaceId: 'WS-DEFAULT', roles: ['DPO', 'AUDITOR'], assignedAt: '2026-08-25T00:00:00Z' }
        ]
      },
      {
        user: {
          userId: 'USR-ENG-03',
          email: 'lucas.albuquerque@enterprise.ai',
          fullName: 'Lucas Albuquerque',
          department: 'Core Banking Engineering',
          isActive: true,
          mfaEnrolled: false
        },
        memberships: [
          { tenantId: 'TENANT-DEFAULT', workspaceId: 'WS-DEFAULT', roles: ['ENGINEER'], assignedAt: '2026-08-25T00:00:00Z' }
        ]
      },
      {
        user: {
          userId: 'USR-AUDITOR-04',
          email: 'auditor.external@auditcorp.com',
          fullName: 'External Regulatory Auditor',
          department: 'Compliance Audit',
          isActive: true,
          mfaEnrolled: true
        },
        memberships: [
          { tenantId: 'TENANT-DEFAULT', workspaceId: 'WS-DEFAULT', roles: ['AUDITOR', 'VIEWER'], assignedAt: '2026-08-25T00:00:00Z' }
        ]
      }
    ];

    for (const item of baselineUsers) {
      this.users.set(item.user.userId, item);
    }

    const mcpSecret = process.env.CGAG_MCP_AUTH_TOKEN;
    if (mcpSecret && mcpSecret.trim() !== '') {
      this.bootstrapServiceSession(mcpSecret);
    }
  }

  static bootstrapServiceSession(token: string, userId = 'USR-CISO-01', tenantId = 'TENANT-DEFAULT', workspaceId = 'WS-DEFAULT'): UserSession {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Service token cannot be empty');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    const sessionId = `SES-SVC-${tokenHash}`;

    // Idempotency: Reuse existing unrevoked and unexpired service session
    const existing = this.sessions.get(sessionId) || this.sessions.get(token);
    if (existing && !existing.isRevoked && Date.now() < existing.expiresAt) {
      existing.lastActivityAt = Date.now();
      return existing;
    }

    if (this.users.size === 0) {
      this.initializeBaselineUsers();
    }

    const userRecord = this.users.get(userId);
    if (!userRecord || !userRecord.user.isActive) {
      throw new Error(`Service user [${userId}] not found or inactive`);
    }

    const membership = userRecord.memberships.find(m => m.tenantId === tenantId && m.workspaceId === workspaceId);
    if (!membership) {
      throw new Error(`Service user [${userId}] has no membership in tenant [${tenantId}] / workspace [${workspaceId}]`);
    }

    const now = Date.now();
    const session: UserSession = {
      sessionId,
      userId,
      tenantId,
      workspaceId,
      roles: membership.roles,
      issuedAt: now,
      expiresAt: now + 365 * 24 * 60 * 60 * 1000,
      lastActivityAt: now,
      isRevoked: false,
      stepUpAuthenticated: false
    };

    this.sessions.set(token, session);
    this.sessions.set(sessionId, session);
    return session;
  }

  static createSession(userId: string, tenantId: string, workspaceId: string): UserSession {
    const userRecord = this.users.get(userId);
    if (!userRecord || !userRecord.user.isActive) {
      throw new Error(`User [${userId}] not found or inactive`);
    }

    const membership = userRecord.memberships.find(m => m.tenantId === tenantId && m.workspaceId === workspaceId);
    if (!membership) {
      throw new Error(`User [${userId}] has no membership in tenant [${tenantId}] / workspace [${workspaceId}]`);
    }

    const now = Date.now();
    const sessionId = `SES-${now}-${crypto.randomBytes(6).toString('hex')}`;
    const session: UserSession = {
      sessionId,
      userId,
      tenantId,
      workspaceId,
      roles: membership.roles,
      issuedAt: now,
      expiresAt: now + this.sessionTtlMs,
      lastActivityAt: now,
      isRevoked: false,
      stepUpAuthenticated: false
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  static validateSession(sessionId: string): { valid: boolean; session?: UserSession; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, error: 'SESSION_NOT_FOUND' };
    }

    if (session.isRevoked) {
      return { valid: false, error: 'SESSION_REVOKED' };
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      return { valid: false, error: 'SESSION_EXPIRED' };
    }

    const isServiceSession = session.sessionId.startsWith('SES-SVC-');
    if (!isServiceSession && now - session.lastActivityAt > this.idleTimeoutMs) {
      session.isRevoked = true;
      return { valid: false, error: 'SESSION_IDLE_TIMEOUT' };
    }

    session.lastActivityAt = now;
    return { valid: true, session };
  }

  static revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isRevoked = true;
    }
  }

  static triggerStepUp(sessionId: string, durationMs = 15 * 60 * 1000): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.isRevoked) return false;

    session.stepUpAuthenticated = true;
    session.stepUpExpiresAt = Date.now() + durationMs;
    return true;
  }
}
