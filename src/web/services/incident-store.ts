/**
 * Authoritative Store for AI Incidents, Failsafes & Runtime Circuit Breakers
 * Causal Pipeline: Signal -> Incident -> Circuit Breaker -> Containment -> Investigation -> Recovery -> Evidence
 */

import { DecisionStore } from './decision-store';
import { PersistenceAdapter } from './persistence-adapter';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ContainmentStatus = 'DETECTED' | 'CONTAINED' | 'INVESTIGATING' | 'RECOVERY_PENDING' | 'RECOVERED' | 'TERMINATED';
export type CircuitBreakerAction = 'HARD_KILL' | 'SAFE_FALLBACK' | 'RATE_LIMIT_ISOLATION';

export interface AIIncident {
  incidentId: string;
  title: string;
  timestamp: string;
  affectedEntity: string;
  entityId: string;
  systemId: string;
  systemName: string;
  incidentType: 'TOOL_LOOPING_ANOMALY' | 'UNAUTHORIZED_ESCALATION' | 'PROMPT_INJECTION_ATTEMPT' | 'RECURRING_POLICY_BREACH' | 'COST_TOKEN_EXPLOSION';
  severity: IncidentSeverity;
  triggerSignal: string;
  observedMetric: string;
  thresholdBreached: string;
  controlId: string;
  controlName: string;
  circuitBreaker: {
    ruleName: string;
    actionTaken: CircuitBreakerAction;
    triggeredAt: string;
    fallbackRoute?: string;
  };
  containmentStatus: ContainmentStatus;
  investigation?: {
    investigator: string;
    role: string;
    rootCause: string;
    linkedRemediationId?: string;
    resumedAt?: string;
    resumeApprovedBy?: string;
    recoveryRationale?: string;
    evidenceDigest: string;
  };
}

const STORAGE_KEY_INCIDENTS = 'cg_ag_incidents_v1';

const BASELINE_INCIDENTS: AIIncident[] = [
  {
    incidentId: 'INC-2026-0091',
    title: 'Autonomous Tool Looping & Unchecked DDL Execution Attempt',
    timestamp: '2026-08-27T17:22:15Z',
    affectedEntity: 'Ops Executor (AGT-OPS-1102)',
    entityId: 'AGT-OPS-1102',
    systemId: 'SYS-MAINT-007',
    systemName: 'System Maintenance Bot',
    incidentType: 'TOOL_LOOPING_ANOMALY',
    severity: 'CRITICAL',
    triggerSignal: '16 repetitive PostgreSQL DDL invocation calls detected within 10 seconds without state progression',
    observedMetric: 'Loop Count: 16 iterations / 10s (Anomaly Factor: 8.4x)',
    thresholdBreached: 'Max Autonomous Loops = 10 iterations',
    controlId: 'CG-AG-10',
    controlName: 'Incident Management & Failsafes',
    circuitBreaker: {
      ruleName: 'CB-RULE-LOOP-01 (Max Autonomous Iteration Limiter)',
      actionTaken: 'HARD_KILL',
      triggeredAt: '2026-08-27T17:22:16Z',
      fallbackRoute: 'Execution Thread Terminated & API Token Revoked'
    },
    containmentStatus: 'CONTAINED',
    investigation: {
      investigator: 'Carlos Mendoza',
      role: 'Principal Staff Engineer',
      rootCause: 'Database schema query returned non-standard error structure, causing the agent reasoning loop to re-attempt DDL execution infinitely.',
      linkedRemediationId: 'ACT-2026-0042',
      evidenceDigest: 'DIGEST-INC-0091-CONTAIN-SHA256'
    }
  },
  {
    incidentId: 'INC-2026-0087',
    title: 'Anomalous Token Consumption Spike on Customer Outreach Agent',
    timestamp: '2026-08-27T16:05:40Z',
    affectedEntity: 'Customer Campaign Bot (AGT-SUPPORT-49F1)',
    entityId: 'AGT-SUPPORT-49F1',
    systemId: 'SYS-MKTG-002',
    systemName: 'Automated CRM Campaign Dispatcher',
    incidentType: 'COST_TOKEN_EXPLOSION',
    severity: 'HIGH',
    triggerSignal: 'Token velocity exceeded 250,000 tokens/min during bulk marketing audience generation',
    observedMetric: '284,500 tokens/min (Budget Threshold: 100,000 tokens/min)',
    thresholdBreached: 'Max Rate = 100k tokens/min',
    controlId: 'CG-AG-06',
    controlName: 'Cost & Resource Quotas',
    circuitBreaker: {
      ruleName: 'CB-RULE-FINOPS-03 (Token Velocity Limiter)',
      actionTaken: 'SAFE_FALLBACK',
      triggeredAt: '2026-08-27T16:05:42Z',
      fallbackRoute: 'Throttled to Tier-3 Deterministic Template Generator (Zero-LLM Mode)'
    },
    containmentStatus: 'RECOVERY_PENDING',
    investigation: {
      investigator: 'Juliana Paes',
      role: 'Senior Data Platform Lead',
      rootCause: 'Batch audience segment payload lacked pagination, causing the agent to load all 15k customer profiles into a single context window.',
      linkedRemediationId: 'ACT-2026-0019',
      recoveryRationale: 'Chunking pagination implemented and verified in staging.',
      evidenceDigest: 'DIGEST-INC-0087-FALLBACK-SHA256'
    }
  },
  {
    incidentId: 'INC-2026-0072',
    title: 'Direct Shadow AI OpenAI Endpoint Connection Breach',
    timestamp: '2026-08-26T11:15:00Z',
    affectedEntity: 'Data Enrichment Microservice (SYS-DATA-004)',
    entityId: 'SYS-DATA-004',
    systemId: 'SYS-DATA-004',
    systemName: 'Data Enrichment Pipeline',
    incidentType: 'RECURRING_POLICY_BREACH',
    severity: 'HIGH',
    triggerSignal: 'Outbound HTTP connection to api.openai.com bypassing corporate AI gateway proxy',
    observedMetric: 'Direct external egress socket opened on port 443',
    thresholdBreached: 'Zero Unproxied LLM Egress Policy',
    controlId: 'CG-AG-01',
    controlName: 'AI & Agent Inventory',
    circuitBreaker: {
      ruleName: 'CB-RULE-NETSEC-02 (AI Gateway Enforcement)',
      actionTaken: 'RATE_LIMIT_ISOLATION',
      triggeredAt: '2026-08-26T11:15:02Z',
      fallbackRoute: 'Egress traffic redirected to corporate gateway proxy'
    },
    containmentStatus: 'RECOVERED',
    investigation: {
      investigator: 'Roberto Silva',
      role: 'CISO & Accountable Lead',
      rootCause: 'Legacy hardcoded OpenAI client found in microservice v1.4 deployment.',
      linkedRemediationId: 'ACT-2026-0019',
      resumedAt: '2026-08-26T16:00:00Z',
      resumeApprovedBy: 'Roberto Silva (CISO)',
      recoveryRationale: 'Microservice re-routed to Corporate Gateway proxy with verified token validation.',
      evidenceDigest: 'DIGEST-INC-0072-RECOVERED-SHA256'
    }
  }
];

export class IncidentStore {
  private static listeners: Array<() => void> = [];

  static subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private static notify() {
    this.listeners.forEach(fn => fn());
  }

  static getIncidents(tenantId?: string): AIIncident[] {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const saved = PersistenceAdapter.read<AIIncident[]>('incidents', STORAGE_KEY_INCIDENTS);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return JSON.parse(JSON.stringify(BASELINE_INCIDENTS));
  }

  static resetToBaseline(tenantId?: string) {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.delete('incidents', STORAGE_KEY_INCIDENTS);
    this.notify();
  }

  static authorizeSystemRecovery(
    incidentId: string,
    recoveryRationale: string,
    approvedBy = 'Roberto Silva (CISO & Accountable Lead)',
    tenantId?: string
  ): { incident: AIIncident; evidence: ProtectedEvidenceRecord } {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const incidents = this.getIncidents(tenantId);
    const index = incidents.findIndex(i => i.incidentId === incidentId);
    if (index === -1) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const target = incidents[index];
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const digest = `DIGEST-INC-RESUME-${hash}-SHA256`;

    const updated: AIIncident = {
      ...target,
      containmentStatus: 'RECOVERED',
      investigation: {
        ...(target.investigation || { investigator: approvedBy, role: 'CISO', rootCause: 'Incident investigated' }),
        resumedAt: new Date().toISOString(),
        resumeApprovedBy: approvedBy,
        recoveryRationale,
        evidenceDigest: digest
      }
    };

    incidents[index] = updated;
    PersistenceAdapter.write('incidents', incidents, STORAGE_KEY_INCIDENTS);

    // Record Protected Evidence in Ledger
    const evidence: ProtectedEvidenceRecord = {
      evidenceId: `EV-INC-${Date.now().toString(36).toUpperCase()}`,
      entityType: 'AGENT',
      entityId: target.entityId,
      controlId: target.controlId,
      eventType: 'CIRCUIT_BREAK',
      timestamp: new Date().toISOString(),
      tamperEvidentSignature: digest,
      payloadSummary: `AI Incident Formally Recovered [${target.incidentId}] on ${target.affectedEntity} by ${approvedBy}: ${recoveryRationale}`,
      retentionDays: 1825
    };

    const ledger = [evidence, ...DecisionStore.getEvidenceLedger(tenantId)];
    PersistenceAdapter.write('evidence_ledger', ledger.slice(0, 30), 'cg_ag_unified_evidence_v2');

    this.notify();
    return { incident: updated, evidence };
  }
}
