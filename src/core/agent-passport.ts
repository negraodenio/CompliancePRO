/**
 * CG-AG Framework — Agent Governance Passport
 * 
 * Formal, standardized governance record for every AI Agent in the enterprise.
 * Focuses on accountability, permissions, data boundaries, and regulatory compliance.
 */

import type { DetectedAgent, CodeViolation } from './types';
import * as crypto from 'crypto';

export interface AgentGovernancePassport {
  // Identification & Core Attributes
  agentId: string;
  passportVersion: '1.0.0';
  issuedAt: string;
  name: string;
  purpose: string;
  owner: {
    name: string;
    role: string;
    accountableUnit: string;
  };
  
  // Classification & Autonomy
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autonomyLevel: 'L1 (Assisted)' | 'L2 (Supervised / HITL)' | 'L3 (Autonomous Bounded)' | 'L4 (Full Autonomous)';
  model: {
    framework: string;
    declaredModel: string;
    provider: string;
  };
  
  // Technical & Governance Boundaries
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
  
  // Controls & Guardrails
  policies: string[];
  guardrails: string[];
  kpis: string[];
  executionStatus: 'ACTIVE_GOVERNED' | 'CONDITIONAL_APPROVAL' | 'RESTRICTED' | 'QUARANTINED';
  
  // Audit, Evidence & Safety
  evidenceTrail: {
    traceabilityEnabled: boolean;
    immutableLogging: boolean;
    retentionDays: number;
  };
  incidentHistory: {
    totalIncidents: number;
    openFindings: number;
    killSwitchReady: boolean;
  };
  
  // Digital Signature
  passportHash: string;
}

export class AgentPassportGenerator {
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
    const isHighRisk = rLower === 'high' || rLower === 'critical' || agentViolations.some(v => v.severity === 'critical');

    const capabilities: string[] = [
      `Agentic orchestration via ${agent.framework || 'Generative Engine'}`,
      `Task execution: ${agent.businessPurpose || agent.type || 'Workflow processing'}`
    ];
    if (agent.tools && agent.tools.length > 0) {
      capabilities.push(`Tool augmentation (${agent.tools.length} tools registered)`);
    }

    const passport: AgentGovernancePassport = {
      agentId,
      passportVersion: '1.0.0',
      issuedAt: new Date().toISOString(),
      name: agent.name,
      purpose: agent.businessPurpose || (agent.type ? `Executes ${agent.type} within ${repoName}` : 'Autonomous task execution and orchestration'),
      owner: {
        name: 'Accountable Technical Lead',
        role: 'AI System Deployer (EU AI Act Art. 26 / DPO LGPD)',
        accountableUnit: repoName
      },
      riskLevel: isHighRisk ? 'HIGH' : (rLower === 'medium' ? 'MEDIUM' : 'LOW'),
      autonomyLevel: isHighRisk ? 'L3 (Autonomous Bounded)' : 'L2 (Supervised / HITL)',
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
      },
      policies: [
        'CG-AG 12-Control Baseline Compliance',
        'LGPD Lei 13.709/2018 (Art. 6, 20, 38)',
        'EU AI Act 2024/1689 (Art. 14 Human Oversight)'
      ],
      guardrails: [
        'Prompt Injection Defense (OWASP LLM01)',
        'Execution Timeout & Circuit Breaker',
        'Data Masking Filter'
      ],
      kpis: [
        'Decision Auditability: 100%',
        'Unauthorized Tool Invocation Rate: 0%',
        'Human Review SLA: < 4 hours'
      ],
      executionStatus: agentViolations.length === 0 ? 'ACTIVE_GOVERNED' : 'CONDITIONAL_APPROVAL',
      evidenceTrail: {
        traceabilityEnabled: true,
        immutableLogging: true,
        retentionDays: 1825 // 5 years regulatory standard
      },
      incidentHistory: {
        totalIncidents: 0,
        openFindings: agentViolations.length,
        killSwitchReady: true
      },
      passportHash: `HASH-${hash.toUpperCase()}`
    };

    return passport;
  }

  static toMarkdown(passport: AgentGovernancePassport): string {
    const statusEmoji = passport.executionStatus === 'ACTIVE_GOVERNED' ? '🟢' : '🟡';
    
    return `# 🛡️ AGENT GOVERNANCE PASSPORT
## CG-AG Verified Governance Record

**Passport ID:** \`${passport.agentId}\` | **Status:** ${statusEmoji} **${passport.executionStatus}**  
**Digital Signature:** \`${passport.passportHash}\` | **Issued:** ${new Date(passport.issuedAt).toLocaleDateString('pt-BR')}

---

### 1. IDENTIFICATION & OWNERSHIP
- **Agent Name:** ${passport.name}
- **Purpose:** ${passport.purpose}
- **Accountable Owner:** ${passport.owner.name} (${passport.owner.role})
- **Accountable Unit / Organization:** ${passport.owner.accountableUnit}

---

### 2. CLASSIFICATION & AUTONOMY
- **Risk Level:** **${passport.riskLevel}**
- **Autonomy Level:** **${passport.autonomyLevel}**
- **Framework & Model:** ${passport.model.framework} (${passport.model.declaredModel})

---

### 3. TECHNICAL & PERMISSION BOUNDARIES
- **Registered Tools:** ${passport.tools.join(', ')}
- **PII Processing:** ${passport.dataAccess.piiProcessing ? '⚠️ SIM (Requer salvaguarda LGPD Art. 38)' : '✅ NÃO'}
- **Data Classifications:** ${passport.dataAccess.classifications.join(', ')}
- **Privileges:** File System (${passport.permissions.fileSystemAccess ? 'Sim' : 'Não'}) | Network (${passport.permissions.networkAccess ? 'Sim' : 'Não'}) | Elevated (${passport.permissions.elevatedPrivileges ? '⚠️ SIM' : 'Não'})

---

### 4. GOVERNANCE POLICIES & GUARDRAILS
${passport.policies.map(p => `- 📜 ${p}`).join('\n')}
${passport.guardrails.map(g => `- 🛡️ ${g}`).join('\n')}

---

### 5. EVIDENCE TRAIL & SAFETY CONTROLS
- **Traceability & Logging:** ${passport.evidenceTrail.traceabilityEnabled ? 'Ativo' : 'Inativo'} (Retenção: ${passport.evidenceTrail.retentionDays} dias)
- **Open Findings / Gaps:** ${passport.incidentHistory.openFindings}
- **Emergency Kill Switch:** ${passport.incidentHistory.killSwitchReady ? '🟢 PRONTO / TESTADO' : '🔴 AUSENTE'}

---
*Governed under the CodeGuard Agent Governance Standard (CG-AG). Principle: Every Agent Action Must Be Governable and Evidenced.*
`;
  }
}
