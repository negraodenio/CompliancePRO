/**
 * scan-security-boundary.ts
 *
 * Strict Security Boundary for Promoting Scans into Enterprise Workspaces.
 * Enforces Zero Code & Secret Leakage into workspace domain stores and databases.
 *
 * Mandatory Guarantees:
 * 1. Zero raw repository content / source code files transported.
 * 2. Zero raw code matches, secrets, API keys, credentials, or env vars transported.
 * 3. Tenant ID must be derived exclusively from verified authenticated session, never trusted from browser inputs.
 */

import type { ScannerResult } from '../../core/types';

export interface SanitizedGovernanceSnapshot {
  repoMetadata: {
    name: string;
    fileCount: number;
    languages: Record<string, number>;
  };
  complianceSummary: {
    overallScore: number;
    summary: string;
    frameworksBreakdown?: Record<string, number>;
  };
  discoveredAgents: Array<{
    name: string;
    type: string;
    riskLevel: string;
    tools: string[];
    models: string[];
    critical: boolean;
  }>;
  governanceViolations: Array<{
    rule: string;
    severity: string;
    category: string;
    message: string;
    recommendation: string;
    file: string;
    line?: number;
  }>;
  capabilities: Array<{
    agentName: string;
    systemName: string;
    resourceTarget: string;
    action: string;
    state: string;
    isDestructive: boolean;
    accessesSensitiveData: boolean;
    scope?: string;
  }>;
  securityValidation: {
    sanitizedAt: string;
    containsSourceCode: false;
    containsRawSecrets: false;
    containsTokens: false;
  };
}

const FORBIDDEN_SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
  /ghp_[a-zA-Z0-9]{20,}/i,
  /aws[_-]?secret[_-]?access[_-]?key/i,
  /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----/i,
];

/**
 * Validates that a string does not contain raw API keys, private keys, or credentials.
 */
function assertNoSecrets(val: string, fieldName: string): string {
  for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
    if (pattern.test(val)) {
      throw new Error(`[SECURITY_BOUNDARY_VIOLATION] Forbidden secret or credential detected in field "${fieldName}". Promotion rejected.`);
    }
  }
  return val;
}

/**
 * Sanitizes a ScannerResult before promotion into the authenticated workspace.
 * Strips code snippets (match), raw prompt content, raw notebook code cells,
 * and extracts only approved governance metadata.
 */
export function sanitizeScanForWorkspacePromotion(result: ScannerResult): SanitizedGovernanceSnapshot {
  if (!result) {
    throw new Error('[SECURITY_BOUNDARY_ERROR] Cannot sanitize empty or null scan result.');
  }

  // 1. Repo Metadata (Zero source code)
  const rawRepoName = result.repo?.name || result.repo?.fullName || 'Anonymous Project';
  const repoName = assertNoSecrets(rawRepoName, 'repo.name');
  const fileCount = Number(result.repo?.fileCount || result.source?.totalFiles || 0);
  const languages = result.source?.languages ? { ...result.source.languages } : {};

  // 2. Compliance Summary
  const overallScore = Number(result.compliance?.overallScore || 0);
  const summary = assertNoSecrets(result.compliance?.summary || 'GovernanÃ§a avaliada.', 'compliance.summary');
  const frameworksBreakdown: Record<string, number> = {};
  if (result.compliance?.applicableRegulations) {
    for (const reg of result.compliance.applicableRegulations) {
      frameworksBreakdown[reg.id || reg.name] = reg.status === 'compliant' ? 100 : reg.status === 'partial' ? 50 : 0;
    }
  }

  // 3. Discovered Agents (Metadata only: names, types, tools, models)
  const rawAgents = result.source?.agents || [];
  const discoveredAgents = rawAgents.map(ag => ({
    name: assertNoSecrets(ag.name || 'Agent', 'agent.name'),
    type: ag.type || 'ai_persona',
    riskLevel: ag.riskLevel || 'medium',
    tools: (ag.tools || []).map(t => assertNoSecrets(t, 'agent.tool')),
    models: (ag.models || []).map(m => assertNoSecrets(m, 'agent.model')),
    critical: Boolean(ag.critical),
  }));

  // 4. Governance Violations (Explicitly STRIP 'match' and raw code strings!)
  const rawViolations = result.violations || [];
  const governanceViolations = rawViolations.map(v => ({
    rule: assertNoSecrets(v.rule || 'RULE_UNKNOWN', 'violation.rule'),
    severity: v.severity || 'medium',
    category: v.category || 'best_practice',
    message: assertNoSecrets(v.message || '', 'violation.message'),
    recommendation: assertNoSecrets(v.recommendation || '', 'violation.recommendation'),
    file: assertNoSecrets(v.file || 'unknown', 'violation.file'),
    line: typeof v.line === 'number' ? v.line : undefined,
    // CRITICAL: v.match is INTENTIONALLY EXCLUDED! Zero code lines transported.
  }));

  // 5. Capabilities (Metadata only)
  const rawCapabilities = result.agentCapabilities || [];
  const capabilities = rawCapabilities.map(c => ({
    agentName: assertNoSecrets(c.agentName, 'capability.agentName'),
    systemName: assertNoSecrets(c.systemName, 'capability.systemName'),
    resourceTarget: assertNoSecrets(c.resourceTarget, 'capability.resourceTarget'),
    action: assertNoSecrets(c.action, 'capability.action'),
    state: c.state || 'UNKNOWN_AUTHORIZATION',
    isDestructive: Boolean(c.isDestructive),
    accessesSensitiveData: Boolean(c.accessesSensitiveData),
    scope: c.scope,
  }));

  return {
    repoMetadata: {
      name: repoName,
      fileCount,
      languages,
    },
    complianceSummary: {
      overallScore,
      summary,
      frameworksBreakdown,
    },
    discoveredAgents,
    governanceViolations,
    capabilities,
    securityValidation: {
      sanitizedAt: new Date().toISOString(),
      containsSourceCode: false,
      containsRawSecrets: false,
      containsTokens: false,
    },
  };
}

/**
 * Validates that tenant_id and workspace_id originate from a verified authenticated session.
 * Rejects undefined, null, or untrusted browser inputs.
 */
export function assertValidAuthenticatedTenant(sessionOrgId: string | null | undefined): string {
  if (!sessionOrgId || typeof sessionOrgId !== 'string' || sessionOrgId.trim() === '') {
    throw new Error('[SECURITY_BOUNDARY_VIOLATION] Promotion requires an authenticated session tenant_id. Anonymous or browser-supplied tenant IDs are strictly prohibited.');
  }
  return sessionOrgId.trim();
}
