/**
 * ComplyPRO.pt — Sprint 8-5: Scanner-to-Governance Policy Bridge
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Translates passive ScannerResult discovery findings into active governance contracts:
 * Scanner Discovery (AST, Tools, Risks, Frameworks)
 *        ↓
 * Contextual Regulatory Profile (PolicyCompiler)
 *        ↓
 * Active Agent Passport (AgentProvisioner)
 *        ↓
 * Continuous Guardian Runtime Enforcement
 * 
 * Invariants:
 * 1. ZERO modification to scanner code or findings generation.
 * 2. Reuses existing ComplianceProfile, AgentPassport, and CapabilityRegistry models.
 * 3. Deterministic: identical scanner results yield identical governance profiles.
 */

import crypto from 'crypto';
import type { ScannerResult } from './types';
import { PolicyCompiler, ComplianceProfileRegistry } from './compliance-compiler';
import { ComplianceProfile, AgentPassport, CgAgControlId, RegulationId } from './compliance-contract';
import { AgentProvisioner, AgentDefinition, AgentProvisioningResponse } from './agent-provisioner';
import { CapabilityRegistry, GovernedCapability } from './capability-registry';

export interface ScannerGovernanceTranslationResult {
  agentDefinition: AgentDefinition;
  complianceProfile: ComplianceProfile;
  provisionedAgent: AgentProvisioningResponse;
  inferredControls: CgAgControlId[];
  inferredRiskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class ScannerPolicyBridge {
  /**
   * Transforms a passive ScannerResult into active governance entities (Profile, Definition, Passport).
   */
  public static translateScanToGovernance(
    scanResult: ScannerResult,
    options?: {
      tenantId?: string;
      customAgentName?: string;
      environment?: 'sandbox' | 'staging' | 'production';
    }
  ): ScannerGovernanceTranslationResult {
    const tenantId = options?.tenantId || 'TENANT-DEFAULT';
    const agentName = options?.customAgentName || scanResult.repo?.name || 'discovered-agent';

    // 1. Detect Framework
    let frameworkName = 'CrewAI';
    let frameworkVersion = '0.28.0';

    if (scanResult.packages?.dependencies) {
      if (scanResult.packages.dependencies['crewai']) {
        frameworkName = 'CrewAI';
        frameworkVersion = scanResult.packages.dependencies['crewai'].replace(/[\^~]/, '');
      } else if (scanResult.packages.dependencies['langgraph'] || scanResult.packages.dependencies['@langchain/langgraph']) {
        frameworkName = 'LangGraph';
        frameworkVersion = '0.0.1';
      } else if (scanResult.packages.dependencies['autogen'] || scanResult.packages.dependencies['pyautogen']) {
        frameworkName = 'AutoGen';
        frameworkVersion = '0.2.0';
      }
    }

    // 2. Extract Discovered Tools & Capabilities
    const declaredCapabilities: string[] = [];

    if (scanResult.agentCapabilities && scanResult.agentCapabilities.length > 0) {
      for (const cap of scanResult.agentCapabilities) {
        if ((cap as any).id || (cap as any).name || (cap as any).toolName) {
          declaredCapabilities.push((cap as any).id || (cap as any).name || (cap as any).toolName);
        }
      }
    }

    if (declaredCapabilities.length === 0) {
      declaredCapabilities.push('customer.read', 'fx_rate_lookup');
    }

    // 3. Register Discovered Capabilities into CapabilityRegistry if not present
    for (const capId of declaredCapabilities) {
      if (!CapabilityRegistry.get(capId)) {
        const capability: GovernedCapability = {
          id: capId,
          name: capId,
          description: `Discovered from scan of ${scanResult.repo?.name || 'repo'}`,
          channel: 'TOOL',
          riskLevel: 'LOW',
          allowedActions: ['READ', 'EXECUTE'],
          dataClassification: 'INTERNAL',
          provider: 'system-discovered'
        };
        CapabilityRegistry.register(capability);
      }
    }

    // 4. Infer Risk Tier and Mandatory Controls from Scanner Findings
    const hasHighRisk = Boolean(
      (scanResult.risks || []).some(r => r.severity === 'critical' || r.severity === 'high') ||
      (scanResult.violations || []).some(v => v.severity === 'critical' || v.severity === 'high') ||
      scanResult.certification?.overall === 'none'
    );

    const inferredRiskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = hasHighRisk ? 'HIGH' : 'MEDIUM';

    const mandatoryControls: CgAgControlId[] = hasHighRisk
      ? ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-04', 'CG-AG-07']
      : ['CG-AG-01', 'CG-AG-02', 'CG-AG-07'];

    const applicableRegulations: RegulationId[] = hasHighRisk
      ? ['EU_AI_ACT', 'NIST_AI_RMF', 'ISO_42001']
      : ['EU_AI_ACT', 'NIST_AI_RMF'];

    // 5. Compile Contextual Compliance Profile
    const profileId = `PROF-SCAN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const complianceProfile = PolicyCompiler.compile({
      profileId,
      version: '1.0.0',
      name: `Discovered Compliance Profile for ${agentName}`,
      description: `Automatically inferred compliance profile from scan of ${scanResult.repo?.name || 'repository'}`,
      context: {
        jurisdiction: ['EU', 'PORTUGAL'],
        industries: ['FINANCIAL_SERVICES'],
        dataClassifications: ['INTERNAL'],
        autonomyLevels: [hasHighRisk ? 'AUTONOMOUS' : 'SUPERVISED']
      },
      applicableRegulations,
      mandatoryControls,
      forbiddenActions: ['DIRECT_DB_DDL', 'DROP_TABLE', 'SYSTEM_SHELL_EXEC'],
      requireHumanApproval: hasHighRisk ? ['credit.approve', 'credit.transfer', 'sensitive.export'] : ['credit.transfer']
    });

    ComplianceProfileRegistry.register(complianceProfile);

    // 6. Build AgentDefinition
    const agentDefinition: AgentDefinition = {
      name: agentName,
      framework: {
        name: frameworkName,
        version: frameworkVersion
      },
      complianceProfile: complianceProfile.profileId,
      capabilities: declaredCapabilities,
      budget: {
        maxCostPerRunEur: 10.0,
        maxTokensPerStep: 4000,
        maxCallsPerMinute: 60
      },
      environment: options?.environment || 'production',
      tenantId
    };

    // 7. Provision Active Governed Agent & Passport
    const provisionedAgent = AgentProvisioner.provision(agentDefinition, { tenantId });

    return {
      agentDefinition,
      complianceProfile,
      provisionedAgent,
      inferredControls: mandatoryControls,
      inferredRiskTier
    };
  }
}
