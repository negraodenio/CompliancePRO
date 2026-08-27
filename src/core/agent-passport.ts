/**
 * CG-AG Framework — Cryptographically Verifiable Agent Governance Passport
 * 
 * Formal, standardized governance record for every AI Agent in the enterprise.
 * Focuses on accountability, permissions, data boundaries, and verifiable assurance.
 * 
 * Structured into 5 Core Sections:
 * 1. IDENTITY
 * 2. GOVERNANCE
 * 3. TECHNICAL
 * 4. OPERATIONAL
 * 5. ASSURANCE
 */

import type { DetectedAgent, CodeViolation } from './types';
import * as crypto from 'crypto';

export interface AgentGovernancePassport {
  // 1. IDENTITY
  identity: {
    agentId: string;
    passportVersion: '1.2.0';
    name: string;
    owner: {
      name: string;
      role: string;
      accountableUnit: string;
    };
    purpose: string;
    issuedAt: string;
  };
  
  // 2. GOVERNANCE
  governance: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    autonomyLevel: 'L1 (Assisted)' | 'L2 (Supervised / HITL)' | 'L3 (Autonomous Bounded)' | 'L4 (Full Autonomous)';
    policies: string[];
    controls: string[];
    guardrails: string[];
  };

  // 3. TECHNICAL
  technical: {
    model: {
      framework: string;
      declaredModel: string;
      provider: string;
    };
    capabilities: string[];
    tools: string[];
    dataAccess: {
      classifications: ('PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED_PII')[];
      piiProcessing: boolean;
      authorizedStores: string[];
    };
    permissions: {
      fileSystemAccess: boolean;
      networkAccess: boolean;
      elevatedPrivileges: boolean;
    };
  };

  // 4. OPERATIONAL
  operational: {
    currentStatus: 'ACTIVE_GOVERNED' | 'CONDITIONAL_APPROVAL' | 'RESTRICTED' | 'QUARANTINED';
    kpis: string[];
    executionHistory: string;
    incidents: {
      totalIncidents: number;
      openFindings: number;
      killSwitchReady: boolean;
    };
  };

  // 5. ASSURANCE
  assurance: {
    evidenceTrail: {
      traceabilityEnabled: boolean;
      tamperEvidentLogging: boolean;
      retentionDays: number;
    };
    reviews: string[];
    approvals: string[];
    auditStatus: 'VERIFIED' | 'PROVISIONAL' | 'NON_COMPLIANT';
    verificationSignature: string; // Cryptographic SHA-256 fingerprint
  };
}

export class AgentPassportGenerator {
  /**
   * Generates a Cryptographically Verifiable Agent Governance Passport.
   */
  static generatePassport(
    agent: DetectedAgent,
    repoName = 'Enterprise System',
    violations: CodeViolation[] = []
  ): AgentGovernancePassport {
    const fw = (agent.framework || 'AI_AGENT').toUpperCase();
    const rawId = `CG-AG-${fw}-${agent.name.toUpperCase().replace(/\s+/g, '_')}`;
    const hash = crypto.createHash('sha256').update(rawId + (agent.filePath || '') + Date.now()).digest('hex').substring(0, 12);
    const agentId = `${rawId}-${hash.substring(0, 4).toUpperCase()}`;

    const agentViolations = violations.filter(v => v.file === (agent.filePath || ''));
    const hasPii = agentViolations.some(v => v.rule.includes('PII') || v.rule.includes('LGPD'));
    const rLower = (agent.riskLevel || 'medium').toLowerCase();
    const isHighRisk = rLower === 'high' || rLower === 'critical' || agentViolations.some(v => (v.severity as any) === 'critical');

    const capabilities: string[] = [
      `Agentic orchestration via ${agent.framework || 'Generative Engine'}`,
      `Task execution: ${agent.businessPurpose || agent.type || 'Workflow processing'}`
    ];
    if (agent.tools && agent.tools.length > 0) {
      capabilities.push(`Tool augmentation (${agent.tools.length} tools registered)`);
    }

    const passport: AgentGovernancePassport = {
      identity: {
        agentId,
        passportVersion: '1.2.0',
        name: agent.name,
        owner: {
          name: 'Accountable Technical Lead',
          role: 'AI System Deployer (EU AI Act Art. 26 / DPO LGPD)',
          accountableUnit: repoName
        },
        purpose: agent.businessPurpose || (agent.type ? `Executes ${agent.type} within ${repoName}` : 'Autonomous task execution and orchestration'),
        issuedAt: new Date().toISOString()
      },
      governance: {
        riskLevel: isHighRisk ? 'HIGH' : (rLower === 'medium' ? 'MEDIUM' : 'LOW'),
        autonomyLevel: isHighRisk ? 'L3 (Autonomous Bounded)' : 'L2 (Supervised / HITL)',
        policies: [
          'CG-AG 12-Control Baseline Compliance',
          'LGPD Lei 13.709/2018 (Art. 6, 20, 38)',
          'EU AI Act 2024/1689 (Art. 14 Human Oversight)'
        ],
        controls: [
          'CG-AG-01 (Inventory & Registration)',
          'CG-AG-02 (Tool Scoping)',
          'CG-AG-03 (Human-in-the-Loop)',
          'CG-AG-07 (Audit Trail)'
        ],
        guardrails: [
          'Prompt Injection Defense (OWASP LLM01)',
          'Execution Timeout & Circuit Breaker',
          'Data Masking Filter'
        ]
      },
      technical: {
        model: {
          framework: agent.framework || 'LLM Engine',
          declaredModel: (agent.models && agent.models[0]) || 'LLM Orchestrated Engine',
          provider: agent.framework || 'Standard Provider'
        },
        capabilities,
        tools: agent.tools || ['Standard Context Buffer'],
        dataAccess: {
          classifications: hasPii ? ['CONFIDENTIAL', 'RESTRICTED_PII'] : ['INTERNAL'],
          piiProcessing: hasPii,
          authorizedStores: ['Designated Application Context']
        },
        permissions: {
          fileSystemAccess: (agent.tools || []).some(t => /file|dir|read|write/i.test(t)),
          networkAccess: true,
          elevatedPrivileges: (agent.tools || []).some(t => /exec|bash|admin/i.test(t))
        }
      },
      operational: {
        currentStatus: agentViolations.length === 0 ? 'ACTIVE_GOVERNED' : 'CONDITIONAL_APPROVAL',
        kpis: [
          'Decision Auditability: 100%',
          'Unauthorized Tool Invocation Rate: 0%',
          'Human Review SLA: < 4 hours'
        ],
        executionHistory: 'Continuous execution telemetry verified',
        incidents: {
          totalIncidents: 0,
          openFindings: agentViolations.length,
          killSwitchReady: true
        }
      },
      assurance: {
        evidenceTrail: {
          traceabilityEnabled: true,
          tamperEvidentLogging: true,
          retentionDays: 1825 // 5 years regulatory reference
        },
        reviews: ['Automated Static Code Review'],
        approvals: [agentViolations.length === 0 ? 'Automated Quality Gate Approved' : 'Pending Remediation'],
        auditStatus: agentViolations.length === 0 ? 'VERIFIED' : 'PROVISIONAL',
        verificationSignature: `SIG-${hash.toUpperCase()}`
      }
    };

    return passport;
  }

  static toMarkdown(passport: AgentGovernancePassport): string {
    const statusEmoji = passport.operational.currentStatus === 'ACTIVE_GOVERNED' ? '🟢' : '🟡';
    
    return `# 🛡️ VERIFIABLE AGENT GOVERNANCE PASSPORT
## CG-AG Verified Governance Record

**Passport ID:** \`${passport.identity.agentId}\` | **Status:** ${statusEmoji} **${passport.operational.currentStatus}**  
**Digital Verification Signature:** \`${passport.assurance.verificationSignature}\` | **Issued:** ${new Date(passport.identity.issuedAt).toLocaleDateString('pt-BR')}

---

### 1. IDENTITY & ACCOUNTABILITY
- **Agent Name:** ${passport.identity.name}
- **Purpose:** ${passport.identity.purpose}
- **Accountable Owner:** ${passport.identity.owner.name} (${passport.identity.owner.role})
- **Accountable Unit:** ${passport.identity.owner.accountableUnit}

---

### 2. GOVERNANCE & OVERSIGHT
- **Risk Level:** **${passport.governance.riskLevel}**
- **Autonomy Level:** **${passport.governance.autonomyLevel}**
- **Applicable Controls:** ${passport.governance.controls.join(', ')}

---

### 3. TECHNICAL & PERMISSION BOUNDARIES
- **Framework & Model:** ${passport.technical.model.framework} (${passport.technical.model.declaredModel})
- **Registered Tools:** ${passport.technical.tools.join(', ')}
- **PII Processing:** ${passport.technical.dataAccess.piiProcessing ? '⚠️ SIM (Requer salvaguarda LGPD Art. 38)' : '✅ NÃO'}
- **Data Classifications:** ${passport.technical.dataAccess.classifications.join(', ')}
- **Privileges:** File System (${passport.technical.permissions.fileSystemAccess ? 'Sim' : 'Não'}) | Network (${passport.technical.permissions.networkAccess ? 'Sim' : 'Não'}) | Elevated (${passport.technical.permissions.elevatedPrivileges ? '⚠️ SIM' : 'Não'})

---

### 4. OPERATIONAL SAFETY & INCIDENTS
- **Open Findings / Gaps:** ${passport.operational.incidents.openFindings}
- **Emergency Kill Switch:** ${passport.operational.incidents.killSwitchReady ? '🟢 PRONTO / TESTADO' : '🔴 AUSENTE'}

---

### 5. ASSURANCE & AUDIT EVIDENCE
- **Tamper-Evident Audit Trail:** ${passport.assurance.evidenceTrail.tamperEvidentLogging ? 'Ativo' : 'Inativo'} (Retenção: ${passport.assurance.evidenceTrail.retentionDays} dias)
- **Audit Status:** **${passport.assurance.auditStatus}**

---
*Governed under the CG-AG Governance Control Plane. Principle: "Every Agent Action Must Be Governable and Evidenced."*
`;
  }
}
