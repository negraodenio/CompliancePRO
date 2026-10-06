/**
 * ComplyPRO.pt — Sprint 3: Active Governed Agent Provisioner
 * 
 * Invariants:
 * 1. ZERO external code/repo dependency: Creates governed agent units from specifications.
 * 2. Framework-Agnostic: Framework is stored as runtime metadata; no framework execution occurs in S3.
 * 3. Deterministic Binding: Agent <-> Passport <-> Profile Checksum <-> Capability Manifest Hash.
 * 4. Idempotent: Idempotency-Key guarantees duplicate requests return identical provisioning.
 * 5. Evidence Genesis: Records AGENT_PROVISIONED event immediately in tamper-evident EvidenceLedger.
 */

import crypto from 'crypto';
import { ComplianceProfileRegistry } from './compliance-compiler';
import { AgentPassport, ComplianceProfile } from './compliance-contract';
import { CapabilityRegistry, GovernedCapability } from './capability-registry';
import { EvidenceLedger, canonicalizeJson } from './evidence-ledger';
import { PassportSigner } from './passport-signer';
import { PersistenceAdapter } from '../web/services/persistence-adapter';
import { DurableStore } from '../server/db/durable-store';

export interface BudgetSpecification {
  maxCostPerRunEur: number;
  maxTokensPerStep?: number;
  maxCallsPerMinute?: number;
}

export interface FrameworkMetadata {
  name: string;
  version: string;
}

export interface AgentDefinition {
  name: string;
  framework: FrameworkMetadata;
  complianceProfile: string;
  capabilities: string[];
  budget: BudgetSpecification;
  environment?: 'sandbox' | 'staging' | 'production';
  tenantId?: string;
}

export interface RuntimeSpecification {
  runtimeId: string;
  agentId: string;
  isolation: {
    network: 'DENY';
    secrets: 'DENY';
  };
  gateways: {
    tool: 'REQUIRED';
    model: 'REQUIRED';
    data: 'REQUIRED';
  };
  passportId: string;
  status: 'CREATED';
}

export interface AgentProvisioningResponse {
  agentId: string;
  passportId: string;
  runtimeId: string;
  name: string;
  framework: FrameworkMetadata;
  status: 'PROVISIONED';
  guardianStatus: 'ACTIVE';
  evidenceStatus: 'INITIALIZED';
  complianceProfileId: string;
  complianceProfileChecksum: string;
  governedCapabilities: number;
  toolManifestHash: string;
  passportFingerprint: string;
  passport: AgentPassport;
  runtimeSpec: RuntimeSpecification;
  createdAt: string;
  tenantId?: string;
}

export class AgentProvisioner {
  private static idempotencyStore: Map<string, AgentProvisioningResponse> = new Map();
  private static agentsStore: Map<string, AgentProvisioningResponse> = new Map();

  /**
   * Resets stores (for tests).
   */
  public static reset(): void {
    this.idempotencyStore.clear();
    this.agentsStore.clear();
  }

  /**
   * Generates deterministic Tool Manifest Hash from a list of resolved capabilities.
   */
  public static calculateToolManifestHash(capabilities: GovernedCapability[]): string {
    const sorted = [...capabilities].sort((a, b) => a.id.localeCompare(b.id));
    const canonical = canonicalizeJson(sorted.map(c => ({
      id: c.id,
      channel: c.channel,
      riskLevel: c.riskLevel,
      allowedActions: [...c.allowedActions].sort(),
      dataClassification: c.dataClassification,
      hitlRequired: c.hitl?.required || false
    })));
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Provisions a governed agent from an AgentDefinition.
   */
  public static provision(
    definition: AgentDefinition,
    options?: { idempotencyKey?: string; tenantId?: string }
  ): AgentProvisioningResponse {
    const tenantId = options?.tenantId || definition.tenantId || 'TENANT-DEFAULT';
    const idempotencyKey = options?.idempotencyKey;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const cacheKey = `${tenantId}:${idempotencyKey}`;
      const existing = this.idempotencyStore.get(cacheKey);
      if (existing) {
        return existing;
      }
      const persisted = DurableStore.getIdempotentAgent(tenantId, idempotencyKey);
      if (persisted) {
        const stored = this.agentsStore.get(persisted.agent_id);
        if (stored) return stored;
      }
    }

    // 2. Validate Agent Definition Basics
    if (!definition.name || definition.name.trim().length < 3) {
      throw new Error('INVALID_AGENT_DEFINITION: Agent name must be at least 3 characters long');
    }
    if (!definition.framework || !definition.framework.name || !definition.framework.version) {
      throw new Error('INVALID_AGENT_DEFINITION: Framework name and version are required');
    }

    // 3. Validate Budget Specification
    if (!definition.budget || definition.budget.maxCostPerRunEur <= 0 || definition.budget.maxCostPerRunEur > 10000) {
      throw new Error('INVALID_BUDGET: maxCostPerRunEur must be greater than 0 and less than or equal to 10000');
    }
    if (definition.budget.maxTokensPerStep !== undefined && definition.budget.maxTokensPerStep <= 0) {
      throw new Error('INVALID_BUDGET: maxTokensPerStep must be greater than 0');
    }
    if (definition.budget.maxCallsPerMinute !== undefined && definition.budget.maxCallsPerMinute <= 0) {
      throw new Error('INVALID_BUDGET: maxCallsPerMinute must be greater than 0');
    }

    // 4. Resolve Compliance Profile
    const profile = ComplianceProfileRegistry.getProfile(definition.complianceProfile);
    if (!profile) {
      throw new Error(`UNKNOWN_COMPLIANCE_PROFILE: Compliance profile "${definition.complianceProfile}" is not registered`);
    }

    // 5. Resolve Capabilities & Check Compatibility
    if (!definition.capabilities || definition.capabilities.length === 0) {
      throw new Error('INVALID_CAPABILITIES: Agent must be provisioned with at least one capability');
    }

    const resolvedCapabilities: GovernedCapability[] = [];
    const forbiddenActions = profile.forbiddenActions || [];

    for (const capId of definition.capabilities) {
      const cap = CapabilityRegistry.get(capId);
      if (!cap) {
        throw new Error(`UNKNOWN_CAPABILITY: Capability "${capId}" is not registered in CapabilityRegistry`);
      }

      // Check against forbidden actions of the profile
      const isForbidden = forbiddenActions.some(f => 
        f === cap.id || 
        cap.id.toUpperCase().includes(f.toUpperCase()) ||
        (f.includes(':') && f.split(':')[1] === cap.id)
      );

      if (isForbidden) {
        throw new Error(`CAPABILITY_NOT_ALLOWED: Capability "${cap.id}" is explicitly prohibited by ComplianceProfile "${profile.profileId}"`);
      }

      resolvedCapabilities.push(cap);
    }

    // 6. Generate IDs
    const randomHex = crypto.randomBytes(4).toString('hex');
    const agentId = `agt_${randomHex}`;
    const passportId = `pass_${randomHex}`;
    const runtimeId = `rt_${randomHex}`;
    const createdAt = new Date().toISOString();

    // 7. Calculate Tool Manifest Hash
    const toolManifestHash = this.calculateToolManifestHash(resolvedCapabilities);

    // 8. Construct Agent Passport with Cryptographic HMAC Signature
    const governedCapabilities = resolvedCapabilities.map(c => ({
      capability: c.id,
      channel: c.channel,
      riskTier: c.riskLevel,
      requiresHitl: c.hitl?.required || false
    }));

    const riskTier = profile.mandatoryControls.includes('CG-AG-03') ? 'HIGH' : 'MEDIUM';
    const declaredTools = resolvedCapabilities.map(c => c.id);
    const declaredModels = (definition as any).declaredModels || [];
    const declaredDataScopes = (definition as any).declaredDataScopes || [];

    const passportFingerprint = PassportSigner.sign({
      passportId,
      agentId,
      tenantId,
      framework: definition.framework.name,
      frameworkVersion: definition.framework.version,
      runtimeVersion: 'complypro-runtime-v1.0',
      toolManifestHash,
      complianceProfileChecksum: profile.checksum,
      policyVersion: profile.version || '1.0.0',
      capabilities: governedCapabilities,
      declaredTools,
      declaredModels,
      declaredDataScopes,
      riskTier,
      status: 'GOVERNED'
    });

    const passport: AgentPassport = {
      passportId,
      passportFingerprint,
      complianceProfileChecksum: profile.checksum,
      declaredTools,
      governedCapabilities,
      declaredModels: declaredModels.length > 0 ? declaredModels : undefined,
      declaredDataScopes: declaredDataScopes.length > 0 ? declaredDataScopes : undefined,
      runtime: {
        framework: definition.framework.name,
        frameworkVersion: definition.framework.version,
        runtimeVersion: 'complypro-runtime-v1.0'
      },
      toolManifestHash,
      riskTier,
      status: 'GOVERNED',
      tenantId
    };

    // 9. Construct Runtime Specification
    const runtimeSpec: RuntimeSpecification = {
      runtimeId,
      agentId,
      isolation: {
        network: 'DENY',
        secrets: 'DENY'
      },
      gateways: {
        tool: 'REQUIRED',
        model: 'REQUIRED',
        data: 'REQUIRED'
      },
      passportId,
      status: 'CREATED'
    };

    // 10. Record AGENT_PROVISIONED in EvidenceLedger
    const payloadDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        toolManifestHash,
        runtimeId,
        budget: definition.budget,
        environment: definition.environment || 'sandbox'
      }))
      .digest('hex');

    EvidenceLedger.append({
      evidenceId: `EV-PROV-${Date.now().toString(36).toUpperCase()}-${randomHex.toUpperCase()}`,
      timestamp: createdAt,
      eventType: 'AGENT_PROVISIONED',
      agentId,
      passportFingerprint: passport.passportFingerprint,
      complianceProfileId: profile.profileId,
      complianceProfileChecksum: profile.checksum,
      controlId: 'CG-AG-01', // Inventory & Registration
      channel: 'TOOL',
      capability: 'agent.provision',
      action: 'EXECUTE',
      verdict: 'ALLOW',
      payloadDigest
    }, tenantId);

    // 11. Assemble Response
    const response: AgentProvisioningResponse = {
      agentId,
      passportId,
      runtimeId,
      name: definition.name,
      framework: definition.framework,
      status: 'PROVISIONED',
      guardianStatus: 'ACTIVE',
      evidenceStatus: 'INITIALIZED',
      complianceProfileId: profile.profileId,
      complianceProfileChecksum: profile.checksum,
      governedCapabilities: resolvedCapabilities.length,
      toolManifestHash,
      passportFingerprint: passport.passportFingerprint,
      passport,
      runtimeSpec,
      createdAt,
      tenantId
    };

    // 12. Persist
    this.agentsStore.set(agentId, response);
    if (idempotencyKey) {
      const cacheKey = `${tenantId}:${idempotencyKey}`;
      this.idempotencyStore.set(cacheKey, response);
    }

    // Persist to DurableStore (relational / PostgreSQL / Supabase)
    try {
      DurableStore.saveAgent(response, tenantId, idempotencyKey);
    } catch (e) {
      // Memory safe fallback
    }

    return response;
  }

  public static signPassport(passport: AgentPassport, agentId?: string): string {
    const effectiveAgentId = agentId || passport.passportId.replace('pass_', 'agt_');
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === passport.complianceProfileChecksum
    );
    const fingerprint = PassportSigner.sign({
      passportId: passport.passportId,
      agentId: effectiveAgentId,
      tenantId: passport.tenantId,
      framework: passport.runtime?.framework,
      frameworkVersion: passport.runtime?.frameworkVersion,
      runtimeVersion: passport.runtime?.runtimeVersion,
      toolManifestHash: passport.toolManifestHash,
      complianceProfileChecksum: passport.complianceProfileChecksum,
      policyVersion: profile?.version || '1.0.0',
      capabilities: passport.governedCapabilities || passport.declaredTools,
      declaredTools: passport.declaredTools,
      declaredModels: (passport as any).declaredModels || [],
      declaredDataScopes: (passport as any).declaredDataScopes || [],
      riskTier: passport.riskTier,
      status: passport.status
    });
    passport.passportFingerprint = fingerprint;
    return fingerprint;
  }

  public static injectProvisionedAgent(agent: AgentProvisioningResponse): void {
    this.agentsStore.set(agent.agentId, agent);
  }

  public static getAgent(agentId: string, tenantClaim?: string): AgentProvisioningResponse | undefined {
    let memory = this.agentsStore.get(agentId);
    if (!memory) {
      const stored = DurableStore.getAgent(agentId, tenantClaim);
      if (stored) {
        const passRec = DurableStore.getPassport(`pass_${agentId.replace('agt_', '')}`, tenantClaim);
        if (passRec) {
          const passport: AgentPassport = {
            passportId: passRec.passport_id,
            passportFingerprint: passRec.passport_fingerprint,
            complianceProfileChecksum: passRec.compliance_profile_checksum,
            declaredTools: passRec.declared_tools,
            governedCapabilities: passRec.governed_capabilities,
            runtime: {
              framework: stored.framework_name,
              frameworkVersion: stored.framework_version,
              runtimeVersion: 'complypro-runtime-v1.0'
            },
            toolManifestHash: passRec.tool_manifest_hash,
            riskTier: passRec.risk_tier as any,
            status: passRec.status as any,
            tenantId: passRec.tenant_id
          };
          const reconstructed: AgentProvisioningResponse = {
            agentId: stored.agent_id,
            passportId: passRec.passport_id,
            runtimeId: `rt_${agentId.replace('agt_', '')}`,
            name: stored.name,
            framework: { name: stored.framework_name, version: stored.framework_version },
            status: 'PROVISIONED',
            guardianStatus: 'ACTIVE',
            evidenceStatus: 'INITIALIZED',
            complianceProfileId: stored.compliance_profile,
            complianceProfileChecksum: passRec.compliance_profile_checksum,
            governedCapabilities: passRec.governed_capabilities.length,
            toolManifestHash: passRec.tool_manifest_hash,
            passportFingerprint: passRec.passport_fingerprint,
            passport,
            runtimeSpec: passRec.runtime_spec,
            createdAt: stored.created_at,
            tenantId: stored.tenant_id
          };
          this.injectProvisionedAgent(reconstructed);
          memory = reconstructed;
        }
      }
    }
    if (memory) {
      if (tenantClaim && memory.tenantId && memory.tenantId !== tenantClaim) {
        return undefined; // RLS denial
      }
      return memory;
    }
    return undefined;
  }

  public static listAgents(tenantClaim?: string): AgentProvisioningResponse[] {
    const list = Array.from(this.agentsStore.values());
    if (tenantClaim) {
      return list.filter(a => (a.tenantId || 'TENANT-DEFAULT') === tenantClaim);
    }
    return list;
  }
}
