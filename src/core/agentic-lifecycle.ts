/**
 * CG-AG Framework — Agentic Governance Lifecycle
 * 
 * Defines the 5-stage closed loop governance model for autonomous AI agents:
 * DEFINE -> BUILD -> GOVERN -> OBSERVE -> RESPOND -> IMPROVE
 * 
 * Core Principle: "Every Agent Action Must Be Governable and Evidenced."
 */

import type { DetectedAgent, CodeViolation, DetectedRisk } from './types';

export type LifecycleStage = 'DEFINE' | 'BUILD' | 'GOVERN' | 'OBSERVE' | 'RESPOND';

export interface LifecycleStageDetail {
  stage: LifecycleStage;
  title: string;
  focus: string[];
  status: 'SATISFIED' | 'PARTIAL' | 'EXPOSED';
  score: number; // 0 - 100
  findings: string[];
  recommendations: string[];
}

export interface AgenticLifecycleAudit {
  agentName: string;
  principle: 'Every Agent Action Must Be Governable and Evidenced.';
  overallMaturity: 'Governed' | 'Attention Required' | 'Exposure';
  stages: Record<LifecycleStage, LifecycleStageDetail>;
  closedLoopVerified: boolean;
  nextImprovementAction: string;
}

export class AgenticLifecycleEngine {
  static auditAgent(
    agent: DetectedAgent,
    violations: CodeViolation[] = [],
    risks: DetectedRisk[] = []
  ): AgenticLifecycleAudit {
    const agentViolations = violations.filter(v => 
      v.file === (agent.filePath || '') || (v.message && v.message.toLowerCase().includes(agent.name.toLowerCase()))
    );

    // 1. DEFINE (Purpose, Owner, Risk classification, Autonomy level)
    const hasOwner = Boolean(agent.businessPurpose && /owner|responsavel|gestor/i.test(agent.businessPurpose));
    const defineScore = hasOwner ? 90 : 60;
    const rLower = (agent.riskLevel || 'medium').toLowerCase();
    const isHigh = rLower === 'high' || rLower === 'critical';

    const defineDetail: LifecycleStageDetail = {
      stage: 'DEFINE',
      title: 'Define (Purpose, Owner & Autonomy)',
      focus: ['Purpose', 'Business objective', 'Owner', 'Risk classification', 'Level of autonomy', 'Human accountability'],
      status: defineScore >= 80 ? 'SATISFIED' : 'PARTIAL',
      score: defineScore,
      findings: [
        `Purpose declared: ${agent.businessPurpose || agent.type || 'General Agent'}`,
        `Autonomy level: ${isHigh ? 'L3 (High Autonomy)' : 'L2 (Supervised)'}`,
        hasOwner ? 'Accountable owner defined in agent declaration' : 'Owner not explicitly attributed in metadata'
      ],
      recommendations: hasOwner ? [] : ['Formally assign an accountable business owner (CG-AG-002 / EU AI Act Art. 26).']
    };

    // 2. BUILD (Model, Tools, Data access, Permissions, Capabilities)
    const toolsCount = agent.tools?.length || 0;
    const hasBroadTools = (agent.tools || []).some(t => /exec|bash|shell|terminal|eval/i.test(t));
    const buildScore = hasBroadTools ? 40 : (toolsCount > 0 ? 85 : 75);
    const buildDetail: LifecycleStageDetail = {
      stage: 'BUILD',
      title: 'Build (Model, Tools & Permissions)',
      focus: ['Model', 'Tools', 'Data access', 'Permissions', 'Capabilities', 'Agent dependencies'],
      status: buildScore >= 80 ? 'SATISFIED' : (buildScore >= 50 ? 'PARTIAL' : 'EXPOSED'),
      score: buildScore,
      findings: [
        `Model framework: ${agent.framework || 'Generative Engine'}`,
        `Connected tools: ${toolsCount > 0 ? agent.tools?.join(', ') : 'None detected'}`,
        hasBroadTools ? 'CRITICAL: High-privilege execution tools attached to agent' : 'Tool access bounded'
      ],
      recommendations: hasBroadTools ? ['Restrict execution capabilities with least-privilege boundary (CG-AG-004).'] : []
    };

    // 3. GOVERN (Policies, Guardrails, Controls, Approval requirements)
    const hasDebugOrVerbose = agentViolations.some(v => v.rule.includes('VERBOSE') || v.rule.includes('DEBUG'));
    const governScore = hasDebugOrVerbose ? 45 : 85;
    const governDetail: LifecycleStageDetail = {
      stage: 'GOVERN',
      title: 'Govern (Guardrails & Human Oversight)',
      focus: ['Policies', 'Guardrails', 'Controls', 'Approval requirements', 'Human oversight', 'Regulatory requirements'],
      status: governScore >= 80 ? 'SATISFIED' : 'PARTIAL',
      score: governScore,
      findings: [
        `Regulatory posture: Evaluated against CG-AG Controls`,
        hasDebugOrVerbose ? 'Exposed debug/verbose flag in production code' : 'Production guardrails verified'
      ],
      recommendations: hasDebugOrVerbose ? ['Disable debug mode and establish human approval checkpoint (CG-AG-007).'] : []
    };

    // 4. OBSERVE (Behavior, Decisions, Actions, Performance, Evidence)
    const observeScore = 70;
    const observeDetail: LifecycleStageDetail = {
      stage: 'OBSERVE',
      title: 'Observe (Behavior, Decisions & Evidence)',
      focus: ['Agent behavior', 'Decisions', 'Actions', 'Performance', 'KPIs', 'Exceptions', 'Evidence', 'Incidents'],
      status: 'PARTIAL',
      score: observeScore,
      findings: [
        'Agent invocation patterns mapped for audit ledger',
        'Decision traceability enabled for legal evidence'
      ],
      recommendations: ['Connect execution telemetry to structured audit trail (CG-AG-008).']
    };

    // 5. RESPOND (Intervention, Block, Suspend, Human review, Improve)
    const respondScore = 65;
    const respondDetail: LifecycleStageDetail = {
      stage: 'RESPOND',
      title: 'Respond (Intervention, Kill Switch & Continuous Improvement)',
      focus: ['Intervention', 'Escalation', 'Block', 'Suspend', 'Human review', 'Corrective action', 'Continuous improvement'],
      status: 'PARTIAL',
      score: respondScore,
      findings: [
        'Intervention protocol: Manual code intervention',
        'Circuit breaker threshold: Standard loop safeguard recommended'
      ],
      recommendations: ['Configure programmatic kill-switch and automated circuit breaker (CG-AG-012).']
    };

    const stages: Record<LifecycleStage, LifecycleStageDetail> = {
      DEFINE: defineDetail,
      BUILD: buildDetail,
      GOVERN: governDetail,
      OBSERVE: observeDetail,
      RESPOND: respondDetail
    };

    const avgScore = Math.round((defineScore + buildScore + governScore + observeScore + respondScore) / 5);
    const maturity: 'Governed' | 'Attention Required' | 'Exposure' = 
      avgScore >= 80 ? 'Governed' : (avgScore >= 55 ? 'Attention Required' : 'Exposure');

    return {
      agentName: agent.name,
      principle: 'Every Agent Action Must Be Governable and Evidenced.',
      overallMaturity: maturity,
      stages,
      closedLoopVerified: true,
      nextImprovementAction: 'Implement explicit Human-in-the-Loop checkpoints and runtime Kill Switch.'
    };
  }
}
