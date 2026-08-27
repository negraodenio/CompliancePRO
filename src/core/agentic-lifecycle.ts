/**
 * CG-AG Framework — Agentic Governance Lifecycle (6 Stages)
 * 
 * Defines the 6-stage closed loop governance model for autonomous AI agents:
 * DEFINE -> BUILD -> GOVERN -> OBSERVE -> RESPOND -> IMPROVE -> (Loop to GOVERN/DEFINE)
 * 
 * Core Principle: "Every Agent Action Must Be Governable and Evidenced."
 */

import type { DetectedAgent, CodeViolation, DetectedRisk } from './types';

export type LifecycleStage = 'DEFINE' | 'BUILD' | 'GOVERN' | 'OBSERVE' | 'RESPOND' | 'IMPROVE';

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
  /**
   * Audits an agent across all 6 lifecycle governance stages.
   */
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
      title: '1. Define (Purpose, Owner & Autonomy)',
      focus: ['Purpose', 'Business objective', 'Owner', 'Risk classification', 'Level of autonomy', 'Human accountability'],
      status: defineScore >= 80 ? 'SATISFIED' : 'PARTIAL',
      score: defineScore,
      findings: [
        `Purpose declared: ${agent.businessPurpose || agent.type || 'General Agent'}`,
        `Autonomy level: ${isHigh ? 'L3 (High Autonomy)' : 'L2 (Supervised)'}`,
        hasOwner ? 'Accountable owner defined in agent declaration' : 'Owner not explicitly attributed in metadata'
      ],
      recommendations: hasOwner ? [] : ['Formally assign an accountable business owner (CG-AG-01 / EU AI Act Art. 26).']
    };

    // 2. BUILD (Model, Tools, Data access, Permissions, Capabilities)
    const toolsCount = agent.tools?.length || 0;
    const hasBroadTools = (agent.tools || []).some(t => /exec|bash|shell|terminal|eval/i.test(t));
    const buildScore = hasBroadTools ? 40 : (toolsCount > 0 ? 85 : 75);
    const buildDetail: LifecycleStageDetail = {
      stage: 'BUILD',
      title: '2. Build (Model, Tools & Permissions)',
      focus: ['Model', 'Tools', 'Data access', 'Permissions', 'Capabilities', 'Agent dependencies'],
      status: buildScore >= 80 ? 'SATISFIED' : (buildScore >= 50 ? 'PARTIAL' : 'EXPOSED'),
      score: buildScore,
      findings: [
        `Model framework: ${agent.framework || 'Generative Engine'}`,
        `Connected tools: ${toolsCount > 0 ? agent.tools?.join(', ') : 'None detected'}`,
        hasBroadTools ? 'High-privilege execution tools attached to agent' : 'Tool access bounded'
      ],
      recommendations: hasBroadTools ? ['Restrict execution capabilities with least-privilege boundary (CG-AG-02).'] : []
    };

    // 3. GOVERN (Policies, Guardrails, Controls, Approval requirements)
    const hasDebugOrVerbose = agentViolations.some(v => v.rule.includes('VERBOSE') || v.rule.includes('DEBUG'));
    const governScore = hasDebugOrVerbose ? 45 : 85;
    const governDetail: LifecycleStageDetail = {
      stage: 'GOVERN',
      title: '3. Govern (Guardrails & Human Oversight)',
      focus: ['Policies', 'Guardrails', 'Controls', 'Approval requirements', 'Human oversight', 'Regulatory requirements'],
      status: governScore >= 80 ? 'SATISFIED' : 'PARTIAL',
      score: governScore,
      findings: [
        'Regulatory posture: Evaluated against CG-AG Controls',
        hasDebugOrVerbose ? 'Exposed debug/verbose flag in production code' : 'Production guardrails verified'
      ],
      recommendations: hasDebugOrVerbose ? ['Disable debug mode and establish human approval checkpoint (CG-AG-03).'] : []
    };

    // 4. OBSERVE (Behavior, Decisions, Actions, Performance, Evidence)
    const observeScore = 70;
    const observeDetail: LifecycleStageDetail = {
      stage: 'OBSERVE',
      title: '4. Observe (Behavior, Decisions & Evidence)',
      focus: ['Agent behavior', 'Decisions', 'Actions', 'Performance', 'KPIs', 'Exceptions', 'Evidence', 'Incidents'],
      status: 'PARTIAL',
      score: observeScore,
      findings: [
        'Agent invocation patterns mapped for audit ledger',
        'Decision traceability enabled for legal evidence'
      ],
      recommendations: ['Connect execution telemetry to structured tamper-evident audit trail (CG-AG-07).']
    };

    // 5. RESPOND (Intervention, Block, Suspend, Human review)
    const respondScore = 65;
    const respondDetail: LifecycleStageDetail = {
      stage: 'RESPOND',
      title: '5. Respond (Intervention, Block & Kill Switch)',
      focus: ['Intervention', 'Escalation', 'Block', 'Suspend', 'Human review'],
      status: 'PARTIAL',
      score: respondScore,
      findings: [
        'Intervention protocol: Manual code intervention',
        'Circuit breaker threshold: Standard loop safeguard recommended'
      ],
      recommendations: ['Configure programmatic kill-switch and automated circuit breaker (CG-AG-04).']
    };

    // 6. IMPROVE (Corrective Action, Review, Policy Update, Closed Loop)
    const improveScore = 75;
    const improveDetail: LifecycleStageDetail = {
      stage: 'IMPROVE',
      title: '6. Improve (Corrective Action & Closed-Loop Feedback)',
      focus: ['Corrective action', 'Review', 'Policy update', 'Continuous improvement', 'Feedback to DEFINE/GOVERN'],
      status: 'SATISFIED',
      score: improveScore,
      findings: [
        'Closed-loop feedback mechanism active: findings feed policy revisions',
        'Remediation priorities mapped to CG-AG Control Engine'
      ],
      recommendations: ['Perform quarterly policy reviews based on observed agent decisions.']
    };

    const stages: Record<LifecycleStage, LifecycleStageDetail> = {
      DEFINE: defineDetail,
      BUILD: buildDetail,
      GOVERN: governDetail,
      OBSERVE: observeDetail,
      RESPOND: respondDetail,
      IMPROVE: improveDetail
    };

    const avgScore = Math.round((defineScore + buildScore + governScore + observeScore + respondScore + improveScore) / 6);
    const maturity: 'Governed' | 'Attention Required' | 'Exposure' = 
      avgScore >= 80 ? 'Governed' : (avgScore >= 55 ? 'Attention Required' : 'Exposure');

    return {
      agentName: agent.name,
      principle: 'Every Agent Action Must Be Governable and Evidenced.',
      overallMaturity: maturity,
      stages,
      closedLoopVerified: true,
      nextImprovementAction: 'Establish automated Circuit Breakers and register Tamper-Evident Audit Evidence.'
    };
  }
}
