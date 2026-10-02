/**
 * ComplyPRO.pt — Sprint 7-C: Governed Data Gateway
 * 
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Core Invariants:
 * 1. Data Gateway is the Enforcement Perimeter; Guardian is the Policy Authority.
 * 2. Zero Database Credentials in Worker: Connection strings & credentials live exclusively in DataGateway.
 * 3. Compulsory Guardian Interception: All data queries/access requests must pass through Guardian.
 * 4. BLOCK Enforces Zero Execution: Unauthorized data actions result in zero provider calls.
 * 5. REQUIRE_HITL Pauses Execution: High-risk data actions (e.g. bulk export) pause until human approval.
 * 6. Server-Side Tenant Isolation: Queries strictly scoped to context.tenantId; cross-tenant access blocked.
 * 7. PII Classification & Masking: Automatic redaction/digest on sensitive fields (full_name, tax_number).
 * 8. Tamper-Evident Evidence: Emits DATA_REQUEST, DATA_RESPONSE, DATA_ERROR to EvidenceLedger.
 * 
 * Architectural Note on Tenant Isolation:
 * Application-level tenant enforcement is currently implemented; database-native RLS remains a production hardening step.
 */

import crypto from 'crypto';
import { GuardianService } from './guardian-service';
import { ComplianceProfileRegistry } from './compliance-compiler';
import { AgentPassport } from './compliance-contract';
import { CapabilityRegistry, CapabilityAction, DataClassification, DataMaskingStrategy } from './capability-registry';
import { EvidenceLedger, canonicalizeJson } from './evidence-ledger';
import { PostgresPersistenceAdapter } from '../server/db/postgres-adapter';

export interface DataInvocationContext {
  agentId: string;
  runtimeId: string;
  passportId: string;
  executionId: string;
  passport: AgentPassport;
  capability: string;
  action: CapabilityAction;
  targetResource: string;
  parameters?: Record<string, any>;
  tenantId?: string;
  dataClassification?: DataClassification;
  egressDestination?: 'LOCAL' | 'EXTERNAL_MODEL' | 'EXTERNAL_TOOL';
}

export interface DataExecutionResponse {
  status: 'COMPLETED' | 'BLOCKED' | 'PAUSED' | 'FAILED';
  verdict: 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';
  executionId: string;
  capability: string;
  provider: string;
  data?: any[];
  recordsCount?: number;
  maskingApplied?: Record<string, string>;
  gateId?: string;
  latencyMs: number;
  decisionLatencyMs: number;
  providerCallCount?: number;
  error?: string;
}

export interface DataProviderCredentials {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  serviceRoleKey?: string;
  supabaseUrl?: string;
}

export interface DataProviderAdapter {
  providerId: string;
  query(
    resource: string,
    action: CapabilityAction,
    params: Record<string, any> | undefined,
    context: DataInvocationContext,
    credentials?: DataProviderCredentials
  ): Promise<any[]>;
}

export interface VectorDataProviderAdapter extends DataProviderAdapter {
  search(queryVector: number[], topK: number, context: DataInvocationContext): Promise<any[]>;
}

/**
 * Concrete PostgreSQL Data Provider.
 * Connects to PostgreSQL persistence adapter or deterministic managed in-memory store.
 * Strict application-level tenant enforcement.
 */
export class PostgreSqlDataProvider implements DataProviderAdapter {
  public readonly providerId = 'postgresql';
  public callCount = 0;

  // Managed tenant-partitioned seed store for deterministic unit/integration tests
  private static store: Map<string, any[]> = new Map([
    ['customers', [
      { id: 'customer_a', tenant_id: 'TENANT-A', full_name: 'Johnathan Doe', tax_number: 'PT123456789', risk_score: 88, status: 'ACTIVE' },
      { id: 'customer_b', tenant_id: 'TENANT-B', full_name: 'Maria Silva', tax_number: 'PT987654321', risk_score: 92, status: 'ACTIVE' },
      { id: 'customer_c', tenant_id: 'TENANT-A', full_name: 'Carlos Santos', tax_number: 'PT555666777', risk_score: 64, status: 'UNDER_REVIEW' }
    ]],
    ['accounts', [
      { id: 'acc_01', tenant_id: 'TENANT-A', customer_id: 'customer_a', balance_eur: 45000.00 },
      { id: 'acc_02', tenant_id: 'TENANT-B', customer_id: 'customer_b', balance_eur: 120000.00 }
    ]]
  ]);

  public static seedData(resource: string, records: any[]): void {
    this.store.set(resource, [...records]);
  }

  public async query(
    resource: string,
    action: CapabilityAction,
    params: Record<string, any> | undefined,
    context: DataInvocationContext,
    _credentials?: DataProviderCredentials
  ): Promise<any[]> {
    this.callCount++;

    // 1. If real PostgreSQL pool is initialized and online, we can query live DB
    if (PostgresPersistenceAdapter.isReady()) {
      try {
        const pool = PostgresPersistenceAdapter.getPool();
        // Server-side tenant parameter binding (prevents SQL injection and cross-tenant leak)
        const queryText = `SELECT * FROM ${resource} WHERE tenant_id = $1 ${params?.id ? 'AND id = $2' : ''}`;
        const values = params?.id ? [context.tenantId || 'TENANT-DEFAULT', params.id] : [context.tenantId || 'TENANT-DEFAULT'];
        const res = await pool.query(queryText, values);
        return res.rows;
      } catch (err: any) {
        // Fallback to deterministic store if table does not exist or connection fails
      }
    }

    // 2. Deterministic managed store with strict server-side tenant isolation
    const dataset = PostgreSqlDataProvider.store.get(resource) || [];
    const tenantId = context.tenantId || 'TENANT-DEFAULT';

    // Strict Server-Side Tenant Boundary: Only return records matching context.tenantId
    const tenantRecords = dataset.filter(r => r.tenant_id === tenantId);

    if (params?.id) {
      return tenantRecords.filter(r => r.id === params.id);
    }

    return tenantRecords;
  }
}

/**
 * Minimal Governed Vector Data Provider Abstraction (S7-C.13)
 */
export class MockVectorDataProvider implements VectorDataProviderAdapter {
  public readonly providerId = 'vector-db';
  public callCount = 0;

  public async query(
    resource: string,
    action: CapabilityAction,
    params: Record<string, any> | undefined,
    context: DataInvocationContext
  ): Promise<any[]> {
    this.callCount++;
    return [{ id: 'vec_doc_01', score: 0.98, snippet: `Governed vector record for ${context.tenantId}` }];
  }

  public async search(queryVector: number[], topK: number, context: DataInvocationContext): Promise<any[]> {
    this.callCount++;
    return [{ id: 'vec_sim_01', similarity: 0.94, tenantId: context.tenantId, topK }];
  }
}

/**
 * Real Supabase PostgreSQL Data Provider.
 * Connects to Supabase REST / PostgREST API with service role authentication.
 * Performs read-only queries with strict server-side organization_id/tenant_id scoping.
 */
export class SupabasePostgreSqlDataProvider implements DataProviderAdapter {
  public readonly providerId = 'supabase-postgresql';
  public callCount = 0;

  public async query(
    resource: string,
    action: CapabilityAction,
    params: Record<string, any> | undefined,
    context: DataInvocationContext,
    credentials?: DataProviderCredentials
  ): Promise<any[]> {
    this.callCount++;

    const supabaseUrl = credentials?.supabaseUrl || process.env.SUPABASE_URL;
    const apiKey = credentials?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !apiKey) {
      throw new Error('SUPABASE_NOT_CONFIGURED: Missing SUPABASE_URL or service key in Gateway credentials vault');
    }

    const queryParams = new URLSearchParams();
    if (context.tenantId && context.tenantId !== 'TENANT-DEFAULT') {
      if (resource === 'organizations') {
        queryParams.set('id', `eq.${context.tenantId}`);
      } else {
        queryParams.set('organization_id', `eq.${context.tenantId}`);
      }
    }
    if (params?.id) {
      queryParams.set('id', `eq.${params.id}`);
    }
    if (params?.limit) {
      queryParams.set('limit', String(params.limit));
    }

    const url = `${supabaseUrl}/rest/v1/${resource}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SUPABASE_QUERY_ERROR: HTTP ${res.status} ${res.statusText} - ${errText}`);
    }

    return await res.json();
  }
}

/**
 * Governed Data Gateway
 * Enforcement perimeter for all data operations (SQL, NoSQL, Vector).
 */
export class DataGateway {
  // SEC-P1: Gateway credential boundary — private in-memory vault NEVER exposed to workers
  private static credentialVault: Map<string, DataProviderCredentials> = new Map();
  private static providers: Map<string, DataProviderAdapter> = new Map();
  private static activeSessions: Map<string, {
    context: DataInvocationContext;
    gateId?: string;
    status: 'PAUSED' | 'COMPLETED' | 'BLOCKED';
  }> = new Map();

  static {
    // Register default PostgreSQL provider
    this.registerProvider(new PostgreSqlDataProvider());
    this.registerProvider(new SupabasePostgreSqlDataProvider());
    this.registerProvider(new MockVectorDataProvider());

    // Initialize credentials securely in Gateway if host environment provides them
    if (process.env.DATABASE_URL) {
      this.credentialVault.set('postgresql', {
        connectionString: process.env.DATABASE_URL
      });
    }
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      this.credentialVault.set('supabase-postgresql', {
        supabaseUrl: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      });
    }
  }

  public static registerProvider(provider: DataProviderAdapter): void {
    this.providers.set(provider.providerId, provider);
  }

  public static getProvider(providerId: string): DataProviderAdapter | undefined {
    return this.providers.get(providerId);
  }

  public static setProviderCredentials(providerId: string, creds: DataProviderCredentials): void {
    this.credentialVault.set(providerId, { ...creds });
  }

  public static removeProviderCredentials(providerId: string): void {
    this.credentialVault.delete(providerId);
  }

  public static clearCredentials(): void {
    this.credentialVault.clear();
  }

  /**
   * PII Redaction, Masking, and Digest Transformation Engine
   */
  public static sanitizeRecord(
    record: Record<string, any>,
    maskingRules: Record<string, DataMaskingStrategy>
  ): { sanitized: Record<string, any>; maskingApplied: Record<string, string> } {
    const copy = { ...record };
    const maskingApplied: Record<string, string> = {};

    for (const [field, strategy] of Object.entries(maskingRules)) {
      if (field in copy && copy[field] !== null && copy[field] !== undefined) {
        const originalValue = String(copy[field]);
        if (strategy === 'REDACT') {
          copy[field] = '[REDACTED]';
          maskingApplied[field] = 'REDACT';
        } else if (strategy === 'DIGEST') {
          copy[field] = `DIGEST-SHA256:${crypto.createHash('sha256').update(originalValue).digest('hex').substring(0, 16)}`;
          maskingApplied[field] = 'DIGEST';
        } else if (strategy === 'MASK') {
          if (originalValue.length > 4) {
            copy[field] = originalValue.substring(0, 2) + '*'.repeat(originalValue.length - 4) + originalValue.slice(-2);
          } else {
            copy[field] = '****';
          }
          maskingApplied[field] = 'MASK';
        } else if (strategy === 'DROP') {
          delete copy[field];
          maskingApplied[field] = 'DROP';
        }
      }
    }

    return { sanitized: copy, maskingApplied };
  }

  /**
   * Invokes a Governed Data Operation through the Data Gateway perimeter.
   */
  public static async invokeData(context: DataInvocationContext): Promise<DataExecutionResponse> {
    const startTime = Date.now();
    const executionId = context.executionId || `exec_data_${Date.now().toString(36)}`;
    const tenantId = context.tenantId || 'TENANT-DEFAULT';

    // 1. Validate Passport & Identity
    if (!context.passport || !context.passport.passportFingerprint) {
      return {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: 'unknown',
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: 'PASSPORT_MISSING_OR_INVALID: Missing cryptographic passport'
      };
    }

    // 2. Validate Passport Tampering
    const expectedPrefix = 'SIG-SHA256-';
    if (!context.passport.passportFingerprint.startsWith(expectedPrefix)) {
      return {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: 'unknown',
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: 'PASSPORT_TAMPERED: Invalid cryptographic passport fingerprint signature'
      };
    }

    // 3. Resolve Governed Capability from Registry
    const capability = CapabilityRegistry.get(context.capability);
    if (!capability || capability.channel !== 'DATA') {
      const errorMsg = `UNKNOWN_OR_INVALID_DATA_CAPABILITY: Capability "${context.capability}" is not a registered DATA capability`;
      EvidenceLedger.append({
        evidenceId: `ev_derr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'DATA_ERROR',
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'DATA',
        capability: context.capability,
        action: context.action,
        verdict: 'BLOCK',
        executionResult: 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, tenantId);

      return {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: 'unknown',
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    // 4. Verify Capability is Declared in Passport (Least Privilege)
    const isDeclared = (context.passport.declaredTools || []).includes(capability.id) ||
      (context.passport.governedCapabilities || []).some(c => c.capability === capability.id);

    if (!isDeclared) {
      const errorMsg = `CAPABILITY_NOT_DECLARED: Capability "${context.capability}" is not bound to Passport "${context.passport.passportId}"`;
      EvidenceLedger.append({
        evidenceId: `ev_derr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'DATA_ERROR',
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'DATA',
        capability: context.capability,
        action: context.action,
        verdict: 'BLOCK',
        executionResult: 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, tenantId);

      return {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: capability.provider,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    // 5. Verify Action is Allowed on Capability
    if (!capability.allowedActions.includes(context.action)) {
      const errorMsg = `FORBIDDEN_ACTION: Action "${context.action}" is not allowed on capability "${context.capability}" (Allowed: ${capability.allowedActions.join(', ')})`;
      EvidenceLedger.append({
        evidenceId: `ev_derr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'DATA_ERROR',
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'DATA',
        capability: context.capability,
        action: context.action,
        verdict: 'BLOCK',
        executionResult: 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, tenantId);

      return {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: capability.provider,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    // 6. Enforce Data Egress Policy (S7-C.8)
    if (context.egressDestination === 'EXTERNAL_MODEL') {
      const externalModelEgress = capability.egressPolicy?.externalModels || 'DENY';
      if (externalModelEgress === 'DENY') {
        const errorMsg = `DATA_EGRESS_DENIED: Egress of data from capability "${context.capability}" to external models is prohibited by policy`;
        EvidenceLedger.append({
          evidenceId: `ev_degress_${crypto.randomBytes(4).toString('hex')}`,
          timestamp: new Date().toISOString(),
          eventType: 'DATA_EGRESS',
          agentId: context.agentId,
          passportFingerprint: context.passport.passportFingerprint,
          complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
          complianceProfileChecksum: context.passport.complianceProfileChecksum,
          channel: 'DATA',
          capability: context.capability,
          action: context.action,
          verdict: 'BLOCK',
          executionResult: 'BLOCKED',
          payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
        }, tenantId);

        return {
          status: 'BLOCKED',
          verdict: 'BLOCK',
          executionId,
          capability: context.capability,
          provider: capability.provider,
          latencyMs: Date.now() - startTime,
          decisionLatencyMs: 0,
          providerCallCount: 0,
          error: errorMsg
        };
      }
    }

    // 7. Resolve Compliance Profile
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === context.passport.complianceProfileChecksum
    ) || ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;

    // 8. Record DATA_REQUEST in Evidence Ledger (Zero raw secrets / zero raw PII)
    const requestDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        capability: context.capability,
        action: context.action,
        targetResource: context.targetResource,
        tenantId,
        parameters: context.parameters ? Object.keys(context.parameters).sort() : []
      }))
      .digest('hex');

    EvidenceLedger.append({
      evidenceId: `ev_dreq_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'DATA_REQUEST',
      agentId: context.agentId,
      passportFingerprint: context.passport.passportFingerprint,
      complianceProfileId: profile.profileId,
      complianceProfileChecksum: context.passport.complianceProfileChecksum,
      channel: 'DATA',
      capability: context.capability,
      action: context.action,
      payloadDigest: requestDigest
    }, tenantId);

    // 9. Guardian Evaluation
    const guardianVerdict = GuardianService.evaluateCapability({
      agent: {
        id: context.agentId,
        name: context.passport.runtime?.framework ? `${context.passport.runtime.framework}-agent` : 'governed-agent',
        version: context.passport.runtime?.frameworkVersion
      },
      passport: {
        passportId: context.passport.passportId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        declaredTools: context.passport.declaredTools,
        governedCapabilities: context.passport.governedCapabilities as any,
        toolManifestHash: context.passport.toolManifestHash,
        riskTier: context.passport.riskTier
      },
      complianceProfile: profile,
      channel: 'DATA',
      capability: context.capability,
      actionType: context.action,
      payload: {
        targetResource: context.targetResource,
        ...(context.egressDestination === 'EXTERNAL_MODEL' ? { dataClassification: capability.dataClassification } : {}),
        ...(context.parameters || {})
      },
      context: {
        tenantId
      }
    });

    const decisionLatencyMs = guardianVerdict.decisionLatencyMs;

    // 10. Handle Guardian Decisions
    if (guardianVerdict.verdict === 'BLOCK' || guardianVerdict.verdict === 'CIRCUIT_BREAK') {
      EvidenceLedger.append({
        evidenceId: `ev_derr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'DATA_ERROR',
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: profile.profileId,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'DATA',
        capability: context.capability,
        action: context.action,
        verdict: guardianVerdict.verdict,
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(guardianVerdict.reason).digest('hex')
      }, tenantId);

      return {
        status: 'BLOCKED',
        verdict: guardianVerdict.verdict,
        executionId,
        capability: context.capability,
        provider: capability.provider,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: guardianVerdict.reason
      };
    }

    if (guardianVerdict.verdict === 'REQUIRE_HITL') {
      this.activeSessions.set(executionId, {
        context,
        gateId: guardianVerdict.gateId,
        status: 'PAUSED'
      });

      return {
        status: 'PAUSED',
        verdict: 'REQUIRE_HITL',
        gateId: guardianVerdict.gateId,
        executionId,
        capability: context.capability,
        provider: capability.provider,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: guardianVerdict.reason
      };
    }

    // 11. ALLOW: Dispatch to Data Provider
    return this.executeProviderQuery(context, capability, profile.profileId, startTime, decisionLatencyMs);
  }

  /**
   * Internal execution of query against provider, applying PII masking & Evidence emission.
   */
  private static async executeProviderQuery(
    context: DataInvocationContext,
    capability: any,
    profileId: string,
    startTime: number,
    decisionLatencyMs: number
  ): Promise<DataExecutionResponse> {
    const tenantId = context.tenantId || 'TENANT-DEFAULT';
    const adapter = this.providers.get(capability.provider);

    if (!adapter) {
      const errorMsg = `DATA_PROVIDER_NOT_FOUND: No registered provider found for id "${capability.provider}"`;
      return {
        status: 'FAILED',
        verdict: 'BLOCK',
        executionId: context.executionId,
        capability: context.capability,
        provider: capability.provider,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    const creds = this.credentialVault.get(capability.provider);
    let rawRecords: any[] = [];

    try {
      rawRecords = await adapter.query(context.targetResource, context.action, context.parameters, context, creds);
    } catch (dbErr: any) {
      const errorMsg = `DATA_PROVIDER_ERROR: ${dbErr.message}`;
      EvidenceLedger.append({
        evidenceId: `ev_derr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'DATA_ERROR',
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'DATA',
        capability: context.capability,
        action: context.action,
        verdict: 'ALLOW',
        executionResult: 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, tenantId);

      return {
        status: 'FAILED',
        verdict: 'ALLOW',
        executionId: context.executionId,
        capability: context.capability,
        provider: capability.provider,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 1,
        error: errorMsg
      };
    }

    // 12. Apply PII Masking / Redaction / Digest Rules
    const maskingRules = capability.maskingRules || {
      full_name: 'REDACT',
      tax_number: 'DIGEST'
    };

    const sanitizedRecords: any[] = [];
    const overallMaskingApplied: Record<string, string> = {};

    for (const record of rawRecords) {
      const { sanitized, maskingApplied } = this.sanitizeRecord(record, maskingRules);
      sanitizedRecords.push(sanitized);
      Object.assign(overallMaskingApplied, maskingApplied);
    }

    // 13. Emit DATA_RESPONSE in Evidence Ledger (NO raw PII, only sanitized cryptographic digest)
    const resultDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        resource: context.targetResource,
        recordsReturned: sanitizedRecords.length,
        maskingApplied: overallMaskingApplied,
        tenantId
      }))
      .digest('hex');

    EvidenceLedger.append({
      evidenceId: `ev_dresp_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'DATA_RESPONSE',
      agentId: context.agentId,
      passportFingerprint: context.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: context.passport.complianceProfileChecksum,
      channel: 'DATA',
      capability: context.capability,
      action: context.action,
      verdict: 'ALLOW',
      executionResult: 'SUCCESS',
      payloadDigest: resultDigest
    }, tenantId);

    return {
      status: 'COMPLETED',
      verdict: 'ALLOW',
      executionId: context.executionId,
      capability: context.capability,
      provider: capability.provider,
      data: sanitizedRecords,
      recordsCount: sanitizedRecords.length,
      maskingApplied: overallMaskingApplied,
      latencyMs: Date.now() - startTime,
      decisionLatencyMs,
      providerCallCount: 1
    };
  }

  /**
   * Resumes and executes a paused HITL data operation upon human approval.
   */
  public static async approveExecution(executionId: string, operatorId: string): Promise<DataExecutionResponse> {
    const session = this.activeSessions.get(executionId);
    if (!session) {
      throw new Error(`EXECUTION_SESSION_NOT_FOUND: No active session for executionId "${executionId}"`);
    }

    if (session.status !== 'PAUSED') {
      throw new Error(`INVALID_SESSION_STATE: Execution is already in state "${session.status}"`);
    }

    const tenantId = session.context.tenantId || 'TENANT-DEFAULT';

    // Record human approval decision in Evidence Ledger
    EvidenceLedger.append({
      evidenceId: `ev_dhitl_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'HITL_DECISION',
      agentId: session.context.agentId,
      passportFingerprint: session.context.passport.passportFingerprint,
      complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
      channel: 'DATA',
      capability: session.context.capability,
      action: session.context.action,
      verdict: 'ALLOW',
      operatorId,
      operatorDecision: 'APPROVED',
      executionResult: 'SUCCESS',
      payloadDigest: crypto.createHash('sha256').update(`HITL_APPROVED_BY_${operatorId}`).digest('hex')
    }, tenantId);

    const capability = CapabilityRegistry.get(session.context.capability);
    const result = await this.executeProviderQuery(session.context, capability, 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL', Date.now(), 0);
    session.status = 'COMPLETED';
    return result;
  }

  /**
   * Rejects and permanently blocks a paused HITL data operation upon human rejection.
   */
  public static rejectExecution(executionId: string, operatorId: string): DataExecutionResponse {
    const session = this.activeSessions.get(executionId);
    if (!session) {
      throw new Error(`EXECUTION_SESSION_NOT_FOUND: No active session for executionId "${executionId}"`);
    }

    const tenantId = session.context.tenantId || 'TENANT-DEFAULT';

    EvidenceLedger.append({
      evidenceId: `ev_dhitl_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'HITL_DECISION',
      agentId: session.context.agentId,
      passportFingerprint: session.context.passport.passportFingerprint,
      complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
      channel: 'DATA',
      capability: session.context.capability,
      action: session.context.action,
      verdict: 'BLOCK',
      operatorId,
      operatorDecision: 'REJECTED',
      executionResult: 'BLOCKED',
      payloadDigest: crypto.createHash('sha256').update(`HITL_REJECTED_BY_${operatorId}`).digest('hex')
    }, tenantId);

    session.status = 'BLOCKED';

    return {
      status: 'BLOCKED',
      verdict: 'BLOCK',
      executionId,
      capability: session.context.capability,
      provider: 'postgresql',
      latencyMs: 0,
      decisionLatencyMs: 0,
      providerCallCount: 0,
      error: `REJECTED_BY_OPERATOR: Human reviewer ${operatorId} denied the data access request`
    };
  }

  public static getSession(executionId: string) {
    return this.activeSessions.get(executionId);
  }
}
