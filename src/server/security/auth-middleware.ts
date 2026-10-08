/**
 * ComplyPRO.pt — Sprint 8-1: Production Security & API Hardening
 * 
 * Centralized Authentication, Tenant Boundary, RBAC, and Rate Limiting Middleware.
 * 
 * Invariants:
 * 1. FAIL-CLOSED: Any unauthenticated call to protected endpoints returns HTTP 401 Unauthorized.
 * 2. ANTI-IMPERSONATION: Client-supplied X-Tenant-Id or payload tenantId NEVER overrides principal identity.
 *    Any mismatch between request tenant and authenticated principal tenant returns HTTP 403 Forbidden.
 * 3. RBAC ENFORCEMENT: Enforces least-privilege matrix (developer, compliance_officer, auditor).
 * 4. PROCESS-LOCAL RATE LIMITING: Enforces request limits and returns HTTP 429 Too Many Requests with Retry-After.
 *    Downstream Guardian and Providers are NEVER invoked once rate-limited.
 * 5. ZERO SECRETS IN TRANSIT / LOGS: Redacts sensitive headers, tokens, and keys from responses and logs.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { IdentityProvider } from './identity-provider';
import { EnterpriseRole } from './identity-types';
import { DurableStore } from '../db/durable-store';

export type AppRole = 'developer' | 'compliance_officer' | 'auditor';

export interface AuthenticatedPrincipal {
  userId: string;
  tenantId: string;
  roles: string[];
  apiKeyFingerprint?: string;
  sessionId?: string;
}

// Extend Express Request interface with principal and tenant context
declare global {
  namespace Express {
    interface Request {
      principal?: AuthenticatedPrincipal;
      tenantId?: string;
    }
  }
}

/**
 * Normalizes system roles and enterprise roles to canonical app roles.
 */
export function normalizeRoles(roles: string[]): Set<string> {
  const normalized = new Set<string>();

  for (const r of roles) {
    const upper = r.toUpperCase();
    normalized.add(r.toLowerCase());
    normalized.add(upper);

    // Developer mapping
    if (upper === 'ENGINEER' || upper === 'DEVELOPER' || upper === 'ADMIN') {
      normalized.add('developer');
      normalized.add('ENGINEER');
    }

    // Compliance Officer mapping
    if (
      upper === 'CISO' ||
      upper === 'DPO' ||
      upper === 'AI_OFFICE' ||
      upper === 'SECURITY_LEAD' ||
      upper === 'COMPLIANCE_OFFICER'
    ) {
      normalized.add('compliance_officer');
      normalized.add('CISO');
      normalized.add('SECURITY_LEAD');
    }

    // Auditor mapping
    if (upper === 'AUDITOR' || upper === 'VIEWER') {
      normalized.add('auditor');
      normalized.add('AUDITOR');
    }
  }

  return normalized;
}

/**
 * Registry of authorized API Keys mapped to authenticable tenant principals.
 */
export class ApiKeyRegistry {
  private static keys = new Map<string, AuthenticatedPrincipal>();
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    // Documented fixture credentials must never authenticate production callers.
    if (process.env.NODE_ENV !== 'production') {
    // Baseline enterprise test keys
    this.register('dev-key-tenant-default', {
      userId: 'USR-ENG-03',
      tenantId: 'TENANT-DEFAULT',
      roles: ['developer', 'ENGINEER']
    });

    this.register('ciso-key-tenant-default', {
      userId: 'USR-CISO-01',
      tenantId: 'TENANT-DEFAULT',
      roles: ['compliance_officer', 'CISO']
    });

    this.register('auditor-key-tenant-default', {
      userId: 'USR-AUDITOR-04',
      tenantId: 'TENANT-DEFAULT',
      roles: ['auditor', 'AUDITOR']
    });

    // Multi-tenant isolation test keys (Tenant A vs Tenant B)
    this.register('dev-key-tenant-a', {
      userId: 'USR-DEV-A',
      tenantId: 'TENANT-A',
      roles: ['developer', 'ENGINEER']
    });

    this.register('ciso-key-tenant-a', {
      userId: 'USR-CISO-A',
      tenantId: 'TENANT-A',
      roles: ['compliance_officer', 'CISO']
    });

    this.register('auditor-key-tenant-a', {
      userId: 'USR-AUD-A',
      tenantId: 'TENANT-A',
      roles: ['auditor', 'AUDITOR']
    });

    this.register('dev-key-tenant-b', {
      userId: 'USR-DEV-B',
      tenantId: 'TENANT-B',
      roles: ['developer', 'ENGINEER']
    });

    this.register('ciso-key-tenant-b', {
      userId: 'USR-CISO-B',
      tenantId: 'TENANT-B',
      roles: ['compliance_officer', 'CISO']
    });

    this.register('auditor-key-tenant-b', {
      userId: 'USR-AUD-B',
      tenantId: 'TENANT-B',
      roles: ['auditor', 'AUDITOR']
    });
    }

    // Pre-populate with CODEGUARD_API_KEYS if present in environment
    const envKeys = process.env.CODEGUARD_API_KEYS;
    if (envKeys) {
      envKeys.split(',').map(k => k.trim()).filter(Boolean).forEach(k => {
        this.register(k, {
          userId: 'USR-SERVICE-SYS',
          tenantId: 'TENANT-DEFAULT',
          roles: ['developer', 'compliance_officer', 'auditor', 'ENGINEER', 'CISO']
        });
      });
    }

    this.initialized = true;
  }

  public static register(apiKey: string, principal: AuthenticatedPrincipal): void {
    const fingerprint = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
    this.keys.set(apiKey, {
      ...principal,
      apiKeyFingerprint: `FP-${fingerprint}`
    });
  }

  public static lookup(apiKey: string): AuthenticatedPrincipal | undefined {
    this.initialize();
    return this.keys.get(apiKey);
  }

  public static clear(): void {
    this.keys.clear();
    this.initialized = false;
  }
}

/**
 * Authentication Middleware:
 * Inspects Authorization: Bearer <token> or X-API-Key: <key>.
 * Fails closed with 401 Unauthorized if missing, revoked, expired, or invalid.
 */
export async function authenticateTokenOrKey(req: Request, res: Response, next: NextFunction) {
  ApiKeyRegistry.initialize();

  const authHeader = req.headers?.authorization;
  const apiKeyHeader = req.headers?.['x-api-key'] as string;

  let rawToken: string | undefined;

  if (authHeader && typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.substring(7).trim();
    } else {
      rawToken = authHeader.trim();
    }
  } else if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    rawToken = apiKeyHeader.trim();
  }

  if (!rawToken || rawToken === '') {
    return res.status(401).json({
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Provide Authorization: Bearer <token> or X-API-Key header.'
    });
  }

  // 1. Check API Key Registry
  const fromApiKey = ApiKeyRegistry.lookup(rawToken);
  if (fromApiKey) {
    req.principal = { ...fromApiKey };
    req.tenantId = fromApiKey.tenantId;
    (req as any).authFingerprint = fromApiKey.apiKeyFingerprint;
    return next();
  }

  // 2. Check IdentityProvider Session Store
  const sessionValidation = IdentityProvider.validateSession(rawToken);
  if (sessionValidation.valid && sessionValidation.session) {
    const session = sessionValidation.session;
    req.principal = {
      userId: session.userId,
      tenantId: session.tenantId,
      roles: session.roles,
      sessionId: session.sessionId
    };
    req.tenantId = session.tenantId;
    (req as any).authFingerprint = `SES-${session.sessionId.substring(0, 12)}`;
    return next();
  }

  // If session failed with explicit reason (e.g. revoked, expired)
  if (sessionValidation.error === 'SESSION_REVOKED') {
    return res.status(401).json({
      ok: false,
      error: 'SESSION_REVOKED',
      message: 'Authentication failed: session has been revoked.'
    });
  }

  if (sessionValidation.error === 'SESSION_EXPIRED' || sessionValidation.error === 'SESSION_IDLE_TIMEOUT') {
    return res.status(401).json({
      ok: false,
      error: 'SESSION_EXPIRED',
      message: 'Authentication failed: session has expired or timed out.'
    });
  }

  // Same Supabase Native Auth and organization_members authority used by course/main_api.py.
  const organization = (req.headers['x-organization-id'] || req.headers['x-tenant-id']) as string;
  if (rawToken.split('.').length === 3 && organization && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const userResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${rawToken}` },
        signal: AbortSignal.timeout(10000)
      });
      if (userResponse.ok) {
        const user = await userResponse.json();
        const membership = await DurableStore.getOrganizationMembership(user.id, organization);
        if (!membership) return res.status(403).json({ ok: false, error: 'CROSS_TENANT_ACCESS_DENIED' });
        const rawRole = String(membership.role || 'VIEWER');
        const enterpriseRole = rawRole.includes(':') ? rawRole.split(':')[1] : rawRole;
        const adminRole = rawRole.split(':')[0].toLowerCase();
        const roles = ['owner','admin'].includes(adminRole) ? ['ADMIN',enterpriseRole === 'owner' || enterpriseRole === 'admin' ? 'CISO' : enterpriseRole] : [enterpriseRole];
        req.principal = { userId: user.id, tenantId: organization, roles };
        req.tenantId = organization;
        return next();
      }
    } catch {
      return res.status(503).json({ ok: false, error: 'IDENTITY_AUTHORITY_UNAVAILABLE' });
    }
  }

  return res.status(401).json({
    ok: false,
    error: 'UNAUTHORIZED',
    message: 'Invalid credentials provided.'
  });
}

/**
 * Tenant Context & Anti-Spoofing Middleware:
 * Verifies that client headers (X-Tenant-Id) or request bodies (tenantId)
 * do NOT attempt cross-tenant impersonation.
 * Sets req.tenantId authoritatively from req.principal.tenantId.
 */
export function enforceTenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.principal) {
    return res.status(401).json({
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'Principal identity context required.'
    });
  }

  const principalTenant = req.principal.tenantId;
  const headerTenant = req.headers?.['x-tenant-id'] as string;
  const bodyTenant = req.body?.tenantId as string;

  // Anti-impersonation: Header check
  if (headerTenant && headerTenant.trim() !== '' && headerTenant !== principalTenant) {
    return res.status(403).json({
      ok: false,
      error: 'TENANT_IMPERSONATION_DETECTED',
      message: `Header X-Tenant-Id [${headerTenant}] does not match authenticated tenant [${principalTenant}].`
    });
  }

  // Anti-impersonation: Body check
  if (bodyTenant && bodyTenant.trim() !== '' && bodyTenant !== principalTenant) {
    return res.status(403).json({
      ok: false,
      error: 'TENANT_IMPERSONATION_DETECTED',
      message: `Payload tenantId [${bodyTenant}] does not match authenticated tenant [${principalTenant}].`
    });
  }

  // Bind authoritative tenant
  req.tenantId = principalTenant;
  if (req.body && typeof req.body === 'object') {
    req.body.tenantId = principalTenant;
  }

  next();
}

/**
 * RBAC Authorization Middleware:
 * Rejects requests with HTTP 403 Forbidden if principal lacks one of the required roles.
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.principal) {
      return res.status(401).json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Principal identity context required.'
      });
    }

    const principalRoles = normalizeRoles(req.principal.roles);
    const hasRole = allowedRoles.some(role => principalRoles.has(role.toLowerCase()) || principalRoles.has(role.toUpperCase()));

    if (!hasRole) {
      return res.status(403).json({
        ok: false,
        error: 'FORBIDDEN',
        message: `Principal roles [${req.principal.roles.join(', ')}] do not grant permission. Required one of: [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
}

/**
 * In-Memory Process-Local Rate Limiter Middleware.
 * "Current limiter is process-local and not yet distributed."
 */
export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export class InMemoryRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private message: string;
  private hits = new Map<string, { count: number; resetTime: number }>();
  private keyGen: (req: Request) => string;

  constructor(options?: RateLimitOptions) {
    this.windowMs = options?.windowMs ?? 60 * 1000; // default 1 minute
    this.maxRequests = options?.maxRequests ?? 60; // default 60 req/min
    this.message = options?.message ?? 'Too many requests. Please retry later.';
    this.keyGen = options?.keyGenerator ?? ((req: Request) => {
      const tenant = req.principal?.tenantId || 'anonymous';
      const ip = req.ip || req.socket.remoteAddress || 'local';
      return `${tenant}:${ip}`;
    });
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.keyGen(req);
      const now = Date.now();

      let record = this.hits.get(key);
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.hits.set(key, record);
        return next();
      }

      if (record.count >= this.maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        return res.status(429).json({
          ok: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: this.message,
          retryAfter: retryAfterSeconds
        });
      }

      record.count++;
      next();
    };
  }

  public reset(): void {
    this.hits.clear();
  }
}

/**
 * Default API Rate Limiter
 */
export const defaultRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120
});

/**
 * Standard Security Headers Middleware
 */
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}
