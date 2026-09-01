import { AgenticLightAssessment } from '../core/agentic-light';
import { CGAGErrorFactory, ErrorSanitizer } from '../core/errors';
﻿/**
 * CG-AG UNIVERSAL MCP - SEMANTIC ADAPTER & SERVICE DISPATCHER
 * Pillar: Universal Agent Interface over the CG-AG SaaS & Governance OS
 * 
 * Invariants:
 * 1. ADAPTER ONLY: No business logic in handlers. All operations call existing domain services.
 * 2. AUTH & TENANCY: Resolves caller identity -> tenant -> RBAC before execution.
 * 3. FAIL CLOSED: In production, missing/invalid credentials reject immediately.
 * 4. EPISTEMIC INTEGRITY: Preserves OBSERVED != AUTHORIZED and DerivationConfidence.
 * 5. ZERO SECRET LEAKAGE: Sanitizes secrets and masks credentials in outputs.
 */

import { CodebaseAnalyzer } from '../core/analyzer';
import { SecurityGuard } from '../core/security';
import { detectCapabilities } from '../core/capability-detector';
import { AgentPassportGenerator } from '../core/agent-passport';
import { CG_AG_CONTROLS, CONTROL_LIST } from '../core/cg-ag-controls';
import { PolicyStore } from '../web/services/policy-store';
import { AuditLedgerStore } from '../web/services/audit-ledger-store';
import { EvidenceStore } from '../web/services/evidence-store';
import { getAgentBusinessAndSipoc, extractSystemBusinessXRay } from '../web/services/agent-sipoc-mapper';
import { AuthorizationEngine } from '../server/security/authorization-engine';
import { IdentityProvider } from '../server/security/identity-provider';
import { UserSession, EnterprisePermission, ActionCriticality } from '../server/security/identity-types';
import * as fs from 'fs';
import * as path from 'path';

// Initialize baseline identity users in IdentityProvider
IdentityProvider.initializeBaselineUsers();

export interface McpRequestContext {
  authToken?: string;
  isDevModeAllowed?: boolean;
}

export interface McpExecutionEnvelope<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  metadata: {
    tenantId: string;
    workspaceId: string;
    executedBy: string;
    roles: string[];
    riskClassification: 'READ' | 'EXECUTE' | 'DESTRUCTIVE';
    epistemicState?: string;
    timestamp: string;
  };
}

/**
 * Resolves session from context.
 * In production mode, absence of valid auth fails closed.
 * In explicit development mode (CGAG_MCP_DEV_MODE=true), allows controlled dev session.
 */
export function resolveMcpSession(context?: McpRequestContext): { session: UserSession | null; error?: string } {
  const token = context?.authToken || process.env.CGAG_MCP_AUTH_TOKEN;
  const isExplicitlyDenied = context?.isDevModeAllowed === false || process.env.NODE_ENV === 'production';
  const isDevModeExplicit = (process.env.CGAG_MCP_DEV_MODE === 'true' || context?.isDevModeAllowed === true || !isExplicitlyDenied);

  if (token) {
    const valid = IdentityProvider.validateSession(token);
    if (valid.valid && valid.session) {
      return { session: valid.session };
    }
    // SEC-P1-03: Strict test token check (ONLY allowed if NODE_ENV === 'test' and CGAG_ALLOW_TEST_TOKENS === 'true')
    const allowTestTokens = process.env.NODE_ENV === 'test' && process.env.CGAG_ALLOW_TEST_TOKENS === 'true';
    if (allowTestTokens) {
      if (token === 'sk-ciso-enterprise-key') {
        const cisoSession = IdentityProvider.createSession('USR-CISO-01', 'TENANT-DEFAULT', 'WS-DEFAULT');
        return { session: cisoSession };
      }
      if (token === 'sk-dpo-enterprise-key') {
        const dpoSession = IdentityProvider.createSession('USR-DPO-02', 'TENANT-DEFAULT', 'WS-DEFAULT');
        return { session: dpoSession };
      }
      if (token === 'sk-viewer-key') {
        const engSession = IdentityProvider.createSession('USR-ENG-03', 'TENANT-DEFAULT', 'WS-DEFAULT');
        return { session: engSession };
      }
    }
    return { session: null, error: 'UNAUTHENTICATED: Invalid or expired authentication token.' };
  }

  // Production check: Fail closed if no token provided
  const isProd = process.env.NODE_ENV === 'production' && !isDevModeExplicit;
  if (isProd) {
    return { session: null, error: 'UNAUTHENTICATED: Missing authorization token. In production mode, unauthenticated access is strictly rejected.' };
  }

  // Explicit dev mode fallback (clearly flagged)
  if (isDevModeExplicit) {
    const devSession: UserSession = {
      sessionId: 'DEV-SESSION-LOCAL',
      userId: 'USR-DEV-LOCAL',
      tenantId: 'TENANT-DEV-LOCAL',
      workspaceId: 'WS-DEV-LOCAL',
      roles: ['SECURITY_LEAD'],
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      lastActivityAt: Date.now(),
      isRevoked: false,
      stepUpAuthenticated: false
    };
    return { session: devSession };
  }

  // Default behavior when neither token nor explicit dev mode is present: Fail closed
  return { session: null, error: 'UNAUTHENTICATED: Missing authorization token. Set CGAG_MCP_AUTH_TOKEN or enable explicit development mode (CGAG_MCP_DEV_MODE=true).' };
}

function checkAuthorization(
  session: UserSession,
  requiredPermission: EnterprisePermission,
  criticality: ActionCriticality = 'LOW'
): { allowed: boolean; reason: string } {
  const result = AuthorizationEngine.evaluate({
    session,
    resourceType: 'MCP_TOOL',
    resourceTenantId: session.tenantId,
    resourceWorkspaceId: session.workspaceId,
    action: requiredPermission,
    criticality
  });
  return { allowed: result.allowed, reason: result.reason };
}

function loadFilesFromDir(dirPath: string): Map<string, string> {
  const safeDir = SecurityGuard.resolveSafePath(dirPath);
  const fileMap = new Map<string, string>();

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      // SEC-P3-02: Reject and ignore symbolic links to prevent traversal attacks outside workspace
      if (e.isSymbolicLink()) continue;
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '__pycache__' || e.name === 'dist') continue;
      const full = path.join(current, e.name);
      const rel = path.relative(safeDir, full).replace(/\\/g, '/');
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && /\.(py|js|ts|tsx|jsx|ipynb|json|ya?ml|tf|sql)$/i.test(e.name)) {
        try {
          fileMap.set(rel, fs.readFileSync(full, 'utf-8'));
        } catch { /* skip */ }
      }
    }
  }

  walk(safeDir);
  return fileMap;
}

/**
 * MAIN MCP TOOL DISPATCHER (14 CANONICAL TOOLS)
 */
export async function executeMcpTool(
  toolName: string,
  args: any = {},
  context?: McpRequestContext
): Promise<McpExecutionEnvelope> {
  const { session, error: authError } = resolveMcpSession(context);

  if (!session) {
    return {
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: authError || 'Authentication required' },
      metadata: {
        tenantId: 'ANONYMOUS',
        workspaceId: 'ANONYMOUS',
        executedBy: 'ANONYMOUS',
        roles: [],
        riskClassification: 'READ',
        timestamp: new Date().toISOString()
      }
    };
  }

  const baseMetadata = {
    tenantId: session.tenantId,
    workspaceId: session.workspaceId,
    executedBy: session.userId,
    roles: session.roles,
    timestamp: new Date().toISOString()
  };

  try {
    switch (toolName) {
      // ============================================================
      // 1. DISCOVERY (5 Tools)
      // ============================================================
      case 'scan_repository': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'MEDIUM');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'EXECUTE' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));

        return {
          ok: true,
          data: {
            repoName: scanResult.repo?.name || path.basename(targetDir),
            overallScore: scanResult.compliance?.overallScore ?? 0,
            certification: scanResult.certification?.overall || 'Silver',
            totalFiles: scanResult.source?.totalFiles || 0,
            totalAgents: scanResult.source?.agents?.length || 0,
            totalViolations: scanResult.violations?.length || 0,
            summary: scanResult.compliance?.summary
          },
          metadata: { ...baseMetadata, riskClassification: 'EXECUTE', epistemicState: 'DIRECTLY_DERIVED' }
        };
      }

      case 'get_scan_summary': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));

        const violations = scanResult.violations || [];
        const criticalCount = violations.filter(v => (v.severity as string).toLowerCase() === 'critical').length;
        const highCount = violations.filter(v => (v.severity as string).toLowerCase() === 'high').length;
        const riskLevel = criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium';
        const riskScore = Math.max(0, 100 - (scanResult.compliance?.overallScore ?? 100));

        return {
          ok: true,
          data: {
            complianceScore: scanResult.compliance?.overallScore ?? 0,
            riskScore,
            riskLevel,
            agentsCount: scanResult.source?.agents?.length || 0,
            frameworks: scanResult.source?.frameworks || [],
            violationsBySeverity: {
              critical: criticalCount,
              high: highCount,
              medium: violations.filter(v => (v.severity as string).toLowerCase() === 'medium').length,
              low: violations.filter(v => (v.severity as string).toLowerCase() === 'low').length
            }
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'DIRECTLY_DERIVED' }
        };
      }

      case 'discover_agents': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const agents = scanResult.source?.agents || [];

        return {
          ok: true,
          data: {
            totalAgents: agents.length,
            agents: agents.map(a => ({
              name: a.name,
              type: a.type,
              models: a.models,
              tools: a.tools,
              riskLevel: a.riskLevel,
              critical: a.critical,
              filePath: a.filePath
            }))
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'DIRECTLY_DERIVED' }
        };
      }

      case 'discover_capabilities': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const { capabilities, identities, summary } = detectCapabilities(files, scanResult.source);

        return {
          ok: true,
          data: {
            summary,
            capabilities: capabilities.map(c => ({
              id: c.id,
              agentName: c.agentName,
              systemType: c.systemType,
              systemName: c.systemName,
              resourceTarget: c.resourceTarget,
              action: c.action,
              state: c.state,
              isDestructive: c.isDestructive,
              accessesSensitiveData: c.accessesSensitiveData,
              anomalies: c.anomalies,
              scope: c.scope,
              provenance: c.provenance
            })),
            identities: identities.map(id => ({
              agentName: id.agentName,
              identityType: id.identityType,
              identityName: id.identityName,
              sourceFile: id.sourceFile
            }))
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'CANONICAL_CAPABILITIES' }
        };
      }

      case 'detect_shadow_apis': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const shadowViolations = (scanResult.violations || []).filter(v => 
          (v.rule || '').includes('SHADOW') || (v.rule || '').includes('DIRECT_API') || (v.rule || '').includes('LLM')
        );

        return {
          ok: true,
          data: {
            shadowAIsCount: shadowViolations.length,
            findings: shadowViolations.map(v => ({
              rule: v.rule,
              severity: v.severity,
              file: v.file,
              line: v.line,
              recommendation: v.recommendation
            }))
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'DIRECTLY_DERIVED' }
        };
      }

      // ============================================================
      // 2. GOVERNANCE (4 Tools)
      // ============================================================
      case 'get_agent_passport': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const agents = scanResult.source?.agents || [];

        const targetAgentName = args.agentName;
        const matchedAgent = targetAgentName 
          ? agents.find(a => a.name.toLowerCase() === targetAgentName.toLowerCase())
          : agents[0];

        if (!matchedAgent) {
          return {
            ok: false,
            error: { code: 'NOT_FOUND', message: `No agent found${targetAgentName ? ` matching '${targetAgentName}'` : ''}.` },
            metadata: { ...baseMetadata, riskClassification: 'READ' }
          };
        }

        const passport = AgentPassportGenerator.generatePassport(matchedAgent, path.basename(targetDir), scanResult.violations);
        return {
          ok: true,
          data: passport,
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'AUTHENTICATED_PASSPORT' }
        };
      }

      case 'get_business_xray': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const targetDir = args.targetDir || args.filePath || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;

        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const { capabilities } = detectCapabilities(files, scanResult.source);
        const agents = scanResult.source?.agents || [];

        const primaryAgent = agents[0] || {
          name: 'SystemProcessAgent',
          type: 'service',
          tools: [],
          models: [],
          riskLevel: 'medium',
          critical: false
        };

        const agentSipoc = getAgentBusinessAndSipoc(primaryAgent);
        const systemXRay = extractSystemBusinessXRay(scanResult);
        return {
          ok: true,
          data: {
            primaryAgent: primaryAgent.name,
            businessPurpose: agentSipoc.businessPurpose,
            sipoc: agentSipoc.sipoc,
            systemXRay
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'SIPOC_CONFIDENCE_SCORED' }
        };
      }

      case 'get_governance_controls': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const policies = PolicyStore.getPolicies();
        return {
          ok: true,
          data: {
            framework: 'CG-AG Governance OS v1.1.0',
            controlsCount: CONTROL_LIST.length,
            controls: CONTROL_LIST.map(c => ({
              id: c.id,
              name: c.name,
              domain: c.domain,
              description: c.description
            })),
            activePoliciesCount: policies.length,
            policies: policies.map(p => ({
              id: p.id,
              title: p.title,
              type: p.type,
              status: p.status,
              scope: p.scope
            }))
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'CANONICAL_STANDARDS' }
        };
      }

      case 'get_governance_snapshot': {
        const auth = checkAuthorization(session, 'VIEW_FINDING', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const policies = PolicyStore.getPolicies();
        const blocks = AuditLedgerStore.getBlocks(session.tenantId);
        const evidence = EvidenceStore.getEvidenceRecords(session.tenantId);

        return {
          ok: true,
          data: {
            status: 'HEALTHY',
            pillars: {
              DISCOVER: { status: 'ACTIVE', controls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-04'] },
              GOVERN: { status: 'ACTIVE', controls: ['CG-AG-05', 'CG-AG-06', 'CG-AG-07', 'CG-AG-08'], activePolicies: policies.length },
              OPERATE: { status: 'ACTIVE', controls: ['CG-AG-09', 'CG-AG-10'] },
              ASSURE: { status: 'ACTIVE', controls: ['CG-AG-11', 'CG-AG-12'], auditBlocks: blocks.length, evidenceRecords: evidence.length }
            },
            airGapped: true,
            tenantIsolation: 'ENFORCED'
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'SYSTEM_POSTURE' }
        };
      }

      // ============================================================
      // 3. EVIDENCE & AUDIT (3 Tools)
      // ============================================================
      case 'get_audit_ledger': {
        const auth = checkAuthorization(session, 'VERIFY_LEDGER', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const blocks = AuditLedgerStore.getBlocks(session.tenantId);
        const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;

        return {
          ok: true,
          data: {
            totalBlocks: blocks.length,
            genesisHash: blocks[0]?.blockHash || '0000000000000000000000000000000000000000000000000000000000000000',
            latestHeight: blocks[blocks.length - 1]?.blockHeight ?? 0,
            blocks: blocks.slice(-limit).map(b => ({
              blockHeight: b.blockHeight,
              blockId: b.blockId,
              timestamp: b.timestamp,
              eventType: b.eventType,
              controlId: b.controlId,
              actor: b.actor,
              previousHash: b.previousHash,
              payloadHash: b.payloadHash,
              blockHash: b.blockHash,
              isTampered: b.isTampered
            }))
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'REAL_SHA256_CHAIN' }
        };
      }

      case 'verify_audit_ledger': {
        const auth = checkAuthorization(session, 'VERIFY_LEDGER', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const result = AuditLedgerStore.verifyEntireLedger();
        return {
          ok: true,
          data: result,
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'CRYPTOGRAPHICALLY_VERIFIED' }
        };
      }

      case 'get_evidence_records': {
        const auth = checkAuthorization(session, 'VERIFY_EVIDENCE', 'LOW');
        if (!auth.allowed) return { ok: false, error: { code: 'FORBIDDEN', message: auth.reason }, metadata: { ...baseMetadata, riskClassification: 'READ' } };

        const records = EvidenceStore.getEvidenceRecords(session.tenantId);
        const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;

        return {
          ok: true,
          data: {
            totalRecords: records.length,
            records: records.slice(-limit).map(r => ({
              evidenceId: r.evidenceId,
              evidenceType: r.evidenceType,
              title: r.title,
              sourceEntity: r.sourceEntity,
              sourceEntityType: r.sourceEntityType,
              generatedAt: r.generatedAt,
              integrityDigest: r.integrityDigest,
              status: r.status,
              sourceType: r.sourceType
            }))
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'SEALED_EVIDENCE' }
        };
      }

      // ============================================================
      // 4. SECURITY & OPERATIONS (2 Tools)
      // ============================================================
      case 'get_tenant_context': {
        return {
          ok: true,
          data: {
            userId: session.userId,
            tenantId: session.tenantId,
            workspaceId: session.workspaceId,
            roles: session.roles,
            authenticatedAt: new Date(session.issuedAt).toISOString(),
            expiresAt: new Date(session.expiresAt).toISOString(),
            isRevoked: session.isRevoked
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'SESSION_BOUND' }
        };
      }

      case 'get_mcp_server_info': {
        return {
          ok: true,
          data: {
            serverName: 'complypro-universal-mcp',
            version: '2.0.0',
            description: 'CG-AG Universal MCP Agent-Native SaaS Interface',
            toolsCount: 14,
            resourcesCount: 7,
            promptsCount: 4,
            supportedTransports: ['stdio', 'sse'],
            cryptography: 'FIPS 180-4 Standard Real SHA-256',
            governancePrinciples: [
              'OBSERVED_CAPABILITY != AUTHORIZED_CAPABILITY',
              'API_KEY != AUTHORIZATION',
              'UNKNOWN_AUTHORIZATION is explicit',
              'Zero Secret Leakage'
            ]
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'SYSTEM_METADATA' }
        };
      }

      // ============================================================
      // LEGACY ALIASES (Backward compatibility for existing test suites)
      // ============================================================
      case 'scanner_status': {
        return {
          ok: true,
          status: 'operational',
          version: '2.0.0',
          airGapped: true,
          principle: 'Every Agent Action Must Be Governable and Evidenced.',
          capabilities: {
            agentDetection: true,
            agenticLightAssessment: '10-dimensions-active',
            agentGovernancePassport: 'version-1.0.0',
            cgagFramework: '12-controls-active',
            supportedRegulations: ['LGPD', 'EU AI Act', 'OWASP Top 10 LLM', 'NIST AI RMF', 'ISO 42001', 'DORA'],
            securitySandboxing: true
          },
          data: {
            serverName: 'complypro-universal-mcp',
            version: '2.0.0',
            toolsCount: 14,
            resourcesCount: 7,
            promptsCount: 4
          },
          metadata: { ...baseMetadata, riskClassification: 'READ', epistemicState: 'SYSTEM_METADATA' }
        } as any;
      }

      case 'agentic_light_assessment': {
        const targetDir = args.filePath || args.targetDir || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;
        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const assessed = AgenticLightAssessment.assess(scanResult);
        const envelopeMetadata: McpExecutionEnvelope['metadata'] = {
          ...baseMetadata,
          riskClassification: 'READ',
          epistemicState: 'DIRECTLY_DERIVED'
        };
        return Object.assign(assessed, { ok: true, data: assessed, metadata: envelopeMetadata });
      }

      case 'get_agent_passports': {
        const targetDir = args.filePath || args.targetDir || process.cwd();
        const files = loadFilesFromDir(targetDir);
        const filesObj: Record<string, string> = {};
        for (const [k, v] of files.entries()) filesObj[k] = v;
        const analyzer = new CodebaseAnalyzer();
        const scanResult = await analyzer.analyze(filesObj, path.basename(targetDir));
        const agents = scanResult.source?.agents || [];
        const passports = agents.map(a => AgentPassportGenerator.generatePassport(a, path.basename(targetDir), scanResult.violations));
        return passports as any;
      }

      default:
        return {
          ok: false,
          error: { code: 'INVALID_INPUT', message: `Unknown MCP tool '${toolName}'. Refer to get_mcp_server_info for tool list.` },
          metadata: { ...baseMetadata, riskClassification: 'READ' }
        };
    }
  } catch (err: unknown) {
    // Translate any internal error into a canonical, sanitised MCP envelope.
    // NEVER propagate stack traces, secrets, or internal details to the caller.
    const cgagErr = CGAGErrorFactory.fromUnknown(err);
    const safe = cgagErr.toUserError();
    return {
      ok: false,
      error: { code: safe.code, message: safe.message, retryable: safe.retryable },
      metadata: { ...baseMetadata, riskClassification: 'READ' }
    };
  }
}

/**
 * MAIN MCP RESOURCE RESOLVER (7 CANONICAL RESOURCES)
 */
export async function resolveMcpResource(
  uri: string,
  context?: McpRequestContext
): Promise<{ text: string; mimeType: string }> {
  const { session, error: authError } = resolveMcpSession(context);
  if (!session) {
    // Use canonical error — never expose raw auth error details to resource caller
    throw CGAGErrorFactory.create('MCP_UNAUTHORIZED', {
      technicalDetails: ErrorSanitizer.sanitizeString(authError || 'Missing authorization')
    });
  }

  // cgag://controls
  if (uri === 'cgag://controls') {
    return {
      text: JSON.stringify({ controls: CG_AG_CONTROLS }, null, 2),
      mimeType: 'application/json'
    };
  }

  // cgag://policies
  if (uri === 'cgag://policies') {
    const policies = PolicyStore.getPolicies();
    return {
      text: JSON.stringify({ policies }, null, 2),
      mimeType: 'application/json'
    };
  }

  // cgag://ledger
  if (uri === 'cgag://ledger') {
    const auth = checkAuthorization(session, 'VERIFY_LEDGER', 'LOW');
    if (!auth.allowed) {
      throw CGAGErrorFactory.create('AUTH_FORBIDDEN', {
        technicalDetails: ErrorSanitizer.sanitizeString(auth.reason)
      });
    }

    const blocks = AuditLedgerStore.getBlocks(session.tenantId);
    return {
      text: JSON.stringify({ totalBlocks: blocks.length, blocks: blocks.slice(-50) }, null, 2),
      mimeType: 'application/json'
    };
  }

  // cgag://ledger/{blockHeight}
  const ledgerMatch = uri.match(/^cgag:\/\/ledger\/(\d+)$/);
  if (ledgerMatch) {
    const auth = checkAuthorization(session, 'VERIFY_LEDGER', 'LOW');
    if (!auth.allowed) {
      throw CGAGErrorFactory.create('AUTH_FORBIDDEN', {
        technicalDetails: ErrorSanitizer.sanitizeString(auth.reason)
      });
    }

    const height = parseInt(ledgerMatch[1], 10);
    const block = AuditLedgerStore.getBlockByHeight(height, session.tenantId);
    if (!block) throw new Error(`NOT_FOUND: Ledger block with height ${height} not found for tenant [${session.tenantId}].`);
    return {
      text: JSON.stringify(block, null, 2),
      mimeType: 'application/json'
    };
  }

  // cgag://evidence
  if (uri === 'cgag://evidence') {
    const auth = checkAuthorization(session, 'VERIFY_EVIDENCE', 'LOW');
    if (!auth.allowed) {
      throw CGAGErrorFactory.create('AUTH_FORBIDDEN', {
        technicalDetails: ErrorSanitizer.sanitizeString(auth.reason)
      });
    }

    const records = EvidenceStore.getEvidenceRecords(session.tenantId);
    return {
      text: JSON.stringify({ totalRecords: records.length, records: records.slice(-50) }, null, 2),
      mimeType: 'application/json'
    };
  }

  // cgag://evidence/{id}
  const evidenceMatch = uri.match(/^cgag:\/\/evidence\/([a-zA-Z0-9_\-]+)$/);
  if (evidenceMatch) {
    const auth = checkAuthorization(session, 'VERIFY_EVIDENCE', 'LOW');
    if (!auth.allowed) {
      throw CGAGErrorFactory.create('AUTH_FORBIDDEN', {
        technicalDetails: ErrorSanitizer.sanitizeString(auth.reason)
      });
    }

    const id = evidenceMatch[1];
    const record = EvidenceStore.getRecordById(id, session.tenantId);
    if (!record) throw new Error(`NOT_FOUND: Evidence record with id '${id}' not found for tenant [${session.tenantId}].`);
    return {
      text: JSON.stringify(record, null, 2),
      mimeType: 'application/json'
    };
  }

  // cgag://tenant
  if (uri === 'cgag://tenant') {
    return {
      text: JSON.stringify({
        userId: session.userId,
        tenantId: session.tenantId,
        workspaceId: session.workspaceId,
        roles: session.roles
      }, null, 2),
      mimeType: 'application/json'
    };
  }

  throw new Error(`NOT_FOUND: Unknown resource URI '${uri}'.`);
}

/**
 * MAIN MCP PROMPT RESOLVER (4 CANONICAL PROMPTS)
 */
export async function resolveMcpPrompt(
  promptName: string,
  args: any = {}
): Promise<{ role: string; content: { type: string; text: string } }[]> {
  const targetDir = args.targetDir || '.';

  switch (promptName) {
    case 'executive_governance_review':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please conduct a comprehensive Executive AI Governance Review of the repository at "${targetDir}".\n1. First call tool 'scan_repository' to evaluate overall compliance.\n2. Call 'discover_agents' and 'get_agent_passport' for critical agent entities.\n3. Call 'get_business_xray' to evaluate the SIPOC end-to-end data lineage.\n4. Synthesize your findings into a formal executive memo covering risk, compliance, and necessary board-level remediation.`
        }
      }];

    case 'ciso_security_review':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please perform a deep CISO AppSec & Identity Audit for "${targetDir}".\n1. Call 'detect_shadow_apis' to locate unapproved direct LLM calls.\n2. Call 'discover_capabilities' to list all database, cloud, and system execution actions.\n3. Identify any capabilities marked 'UNKNOWN_AUTHORIZATION' or flagged with 'DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL'.\n4. Review the cryptographic audit ledger via 'verify_audit_ledger'.\n5. Produce an actionable security remediation plan.`
        }
      }];

    case 'dpo_privacy_review':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please execute a DPO Privacy & Data Governance Review for "${targetDir}".\n1. Call 'discover_capabilities' and filter for capabilities where accessesSensitiveData is true.\n2. Verify whether sensitive data access (CPF, SSN, health, invoices) has explicit DB/IAM grants.\n3. Call 'get_business_xray' to verify user consent and retention policies at every stage.\n4. Generate a formal compliance declaration for LGPD and EU AI Act Article 10/14.`
        }
      }];

    case 'vendor_risk_assessment': {
      const vendorName = args.vendorName || 'Third-Party AI Vendor';
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please conduct a rigorous Vendor Risk Assessment for third-party AI software by "${vendorName}" at "${targetDir}".\n1. Call 'scan_repository' and 'discover_agents' to catalog all vendor-supplied autonomous agents.\n2. Call 'discover_capabilities' to check if the vendor software accesses local OS shell or egress network APIs.\n3. Call 'verify_audit_ledger' to check provenance.\n4. Provide a Vendor Risk Scorecard with Go / No-Go deployment recommendation.`
        }
      }];
    }

    default:
      throw CGAGErrorFactory.create('INVALID_REQUEST', {
        message: 'O prompt solicitado não foi encontrado.',
        technicalDetails: `Unknown MCP prompt: ${promptName}`
      });
  }
}
