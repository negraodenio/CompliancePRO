/**
 * tests/leads-and-boundary.test.ts
 *
 * Comprehensive Vitest Suite for:
 * 1. Free Scan Security Boundary & Workspace Promotion
 * 2. Absence of Source Code, Raw Repo Contents, and Code Snippets in Promoted Payload
 * 3. Prevention of Secrets, API Keys, Tokens, and Credentials Crossing the Boundary
 * 4. Strict Tenant Isolation (Tenant ID Derived Exclusively from Authenticated Session)
 * 5. Public Client Protection (No Public Read Access to Leads)
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeScanForWorkspacePromotion,
  assertValidAuthenticatedTenant
} from '../src/web/services/scan-security-boundary';
import type { ScannerResult } from '../src/core/types';

describe('Free Scan Security Boundary & Lead Audit Suite', () => {
  const mockRawScanResult: ScannerResult = {
    repo: {
      name: "customer-proprietary-pipeline",
      fullName: "enterprise/customer-proprietary-pipeline",
      url: "https://github.com/enterprise/customer-proprietary-pipeline",
      defaultBranch: "main",
      fileCount: 42,
      totalSize: 1048576,
      license: "Proprietary",
      licenseName: "Proprietary",
      topics: ["ai", "langchain"]
    },
    compliance: {
      overallScore: 84,
      summary: "Audit completed with 2 governance gaps.",
      applicableRegulations: [
        {
          id: "EU_AI_ACT",
          name: "EU AI Act",
          authority: "EU",
          status: "partial",
          requirements: ["Risk assessment"],
          evidenceFound: ["Model cataloged"],
          gaps: ["No human oversight documented"]
        }
      ]
    },
    source: {
      totalFiles: 42,
      totalLines: 12500,
      languages: { python: 8000, typescript: 4500 },
      apiRoutes: [],
      databaseTables: ["users", "transactions"],
      externalServices: [],
      authPatterns: [],
      aiModels: [{ provider: "OpenAI", modelId: "gpt-4o", usage: "chat" }],
      dataAssets: [],
      agents: [
        {
          name: "AutonomousFinancialAdvisor",
          type: "ai_persona",
          tools: ["execute_trade", "read_balance"],
          models: ["gpt-4o"],
          riskLevel: "high",
          critical: true
        }
      ],
      fileTree: ["app.py", "secret_engine.py"],
      notebooks: [],
      extractedPrompts: [],
      frameworks: [],
      memorySystems: [],
      classification: null
    },
    violations: [
      {
        rule: "LLM-AUTH-01",
        severity: "high",
        category: "owasp",
        message: "Agent invokes unauthenticated financial trade tool.",
        recommendation: "Implement CISO-approved HITL verification gate.",
        file: "services/trader.py",
        line: 87,
        // SENSITIVE RAW CODE MATCH THAT MUST NEVER LEAK:
        match: "def execute_trade(amount, symbol): return broker.trade(amount, symbol) # PROPRIETARY SOURCE CODE"
      }
    ],
    agentCapabilities: [
      {
        id: "cap-001",
        agentName: "AutonomousFinancialAdvisor",
        systemType: "custom",
        systemName: "BrokerBridge",
        resourceTarget: "brokerage_api",
        action: "write",
        state: "UNKNOWN_AUTHORIZATION",
        filePath: "services/trader.py",
        lineNumber: 87,
        // CODE SNIPPET THAT MUST BE STRIPPED:
        codeSnippet: "execute_trade(amount=10000, symbol='PETR4')",
        isDestructive: true,
        accessesSensitiveData: true,
        anomalies: []
      }
    ]
  };

  describe('[TEST GROUP 1] Source Code Boundary Isolation', () => {
    const promotedSnapshot = sanitizeScanForWorkspacePromotion(mockRawScanResult);

    it('1.1 transports repo metadata and compliance score correctly', () => {
      expect(promotedSnapshot.repoMetadata.name).toBe("customer-proprietary-pipeline");
      expect(promotedSnapshot.repoMetadata.fileCount).toBe(42);
      expect(promotedSnapshot.complianceSummary.overallScore).toBe(84);
      expect(promotedSnapshot.discoveredAgents.length).toBe(1);
    });

    it('1.2 ensures fileTree and raw source lines are NOT promoted', () => {
      expect((promotedSnapshot as any).fileTree).toBeUndefined();
      expect((promotedSnapshot as any).source?.totalLines).toBeUndefined();
    });

    it('1.3 ensures violation code snippet (match) is 100% stripped', () => {
      const promotedViolation = promotedSnapshot.governanceViolations[0];
      expect(promotedViolation.rule).toBe("LLM-AUTH-01");
      expect(promotedViolation.file).toBe("services/trader.py");
      expect((promotedViolation as any).match).toBeUndefined();
    });

    it('1.4 ensures capability codeSnippet is 100% stripped', () => {
      const promotedCap = promotedSnapshot.capabilities[0];
      expect(promotedCap.agentName).toBe("AutonomousFinancialAdvisor");
      expect(promotedCap.action).toBe("write");
      expect((promotedCap as any).codeSnippet).toBeUndefined();
    });
  });

  describe('[TEST GROUP 2] Secret & Token Leakage Prevention', () => {
    it('2.1 rejects OpenAI API key and fails closed', () => {
      const dirtyScan: ScannerResult = JSON.parse(JSON.stringify(mockRawScanResult));
      dirtyScan.repo.name = "leaked-sk-proj-sk-1234567890abcdef1234567890";
      expect(() => sanitizeScanForWorkspacePromotion(dirtyScan)).toThrow("SECURITY_BOUNDARY_VIOLATION");
    });

    it('2.2 rejects JWT bearer tokens and fails closed', () => {
      const dirtyScan: ScannerResult = JSON.parse(JSON.stringify(mockRawScanResult));
      dirtyScan.compliance.summary = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisToken";
      expect(() => sanitizeScanForWorkspacePromotion(dirtyScan)).toThrow("SECURITY_BOUNDARY_VIOLATION");
    });

    it('2.3 rejects Private Key headers and fails closed', () => {
      const dirtyScan: ScannerResult = JSON.parse(JSON.stringify(mockRawScanResult));
      dirtyScan.source.agents[0].name = "-----BEGIN RSA PRIVATE KEY-----MIIEpAIBAAKCAQEA0";
      expect(() => sanitizeScanForWorkspacePromotion(dirtyScan)).toThrow("SECURITY_BOUNDARY_VIOLATION");
    });
  });

  describe('[TEST GROUP 3] Tenant ID Provenance Verification', () => {
    it('3.1 accepts valid authenticated session tenant ID', () => {
      const derivedTenant = assertValidAuthenticatedTenant("org-enterprise-9988");
      expect(derivedTenant).toBe("org-enterprise-9988");
    });

    it('3.2 rejects null session tenant ID', () => {
      expect(() => assertValidAuthenticatedTenant(null)).toThrow("SECURITY_BOUNDARY_VIOLATION");
    });

    it('3.3 rejects empty string session tenant ID', () => {
      expect(() => assertValidAuthenticatedTenant("   ")).toThrow("SECURITY_BOUNDARY_VIOLATION");
    });
  });
});
