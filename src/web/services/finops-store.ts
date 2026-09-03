/**
 * Authoritative Store for AI Runtime FinOps, Token Quotas & Cost Governance
 * Causal Pipeline: Model Runtime -> Telemetry -> Budget Policy -> Attribution -> Anomaly -> Circuit Breaker -> Evidence
 */

import { DecisionStore } from './decision-store';
import { PersistenceAdapter } from './persistence-adapter';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type FinOpsStatus = 'WITHIN_LIMIT' | 'APPROACHING_LIMIT' | 'LIMIT_EXCEEDED' | 'THROTTLED' | 'FALLBACK_ACTIVE';
export type FinOpsEnforcementMode = 'RUNTIME_ENFORCED' | 'OBSERVED_ONLY' | 'STATIC_POLICY' | 'HYBRID';

export interface FinOpsEntityUsage {
  entityId: string;
  entityName: string;
  systemId: string;
  systemName: string;
  department: string;
  assignedSquad: string;
  primaryModel: string;
  modelProvider: 'OpenAI' | 'Anthropic' | 'Google' | 'Self-Hosted OSS';
  monthlyBudgetUSD: number;
  currentSpendUSD: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalRequests: number;
  avgLatencyMs: number;
  tokenQuotaMonthly: number;
  rateLimitRpm: number;
  status: FinOpsStatus;
  enforcementMode: FinOpsEnforcementMode;
  governingPolicyId: string;
  governingPolicyName: string;
  controlId: string;
  controlName: string;
  linkedIncidentId?: string;
  costPerThousandTokens: number;
  anomalyObserved?: string;
}

const STORAGE_KEY_FINOPS = 'cg_ag_finops_v1';

const BASELINE_FINOPS: FinOpsEntityUsage[] = [
  {
    entityId: 'AGT-CREDIT-911E',
    entityName: 'Credit Risk Evaluator',
    systemId: 'SYS-CREDIT-001',
    systemName: 'Credit Risk Scoring Orchestrator',
    department: 'Risk & Compliance',
    assignedSquad: 'Squad Credit-Core',
    primaryModel: 'gpt-4o',
    modelProvider: 'OpenAI',
    monthlyBudgetUSD: 2500,
    currentSpendUSD: 1842.50,
    promptTokens: 11200000,
    completionTokens: 3620000,
    totalTokens: 14820000,
    totalRequests: 42100,
    avgLatencyMs: 640,
    tokenQuotaMonthly: 20000000,
    rateLimitRpm: 120,
    status: 'APPROACHING_LIMIT',
    enforcementMode: 'RUNTIME_ENFORCED',
    governingPolicyId: 'POL-CG-AG-06-01',
    governingPolicyName: 'Enterprise AI Resource Quota & Cost Governance Policy',
    controlId: 'CG-AG-06',
    controlName: 'Cost & Resource Quotas',
    costPerThousandTokens: 0.0125,
    anomalyObserved: 'Batch credit evaluation spiked token velocity during end-of-month portfolio review.'
  },
  {
    entityId: 'AGT-SUPPORT-49F1',
    entityName: 'Customer Campaign Bot',
    systemId: 'SYS-MKTG-002',
    systemName: 'Automated CRM Campaign Dispatcher',
    department: 'Marketing & Growth',
    assignedSquad: 'Squad CX-AI',
    primaryModel: 'claude-3-5-sonnet',
    modelProvider: 'Anthropic',
    monthlyBudgetUSD: 1500,
    currentSpendUSD: 1612.80,
    promptTokens: 9800000,
    completionTokens: 4100000,
    totalTokens: 13900000,
    totalRequests: 31200,
    avgLatencyMs: 820,
    tokenQuotaMonthly: 12000000,
    rateLimitRpm: 90,
    status: 'FALLBACK_ACTIVE',
    enforcementMode: 'RUNTIME_ENFORCED',
    governingPolicyId: 'POL-CG-AG-06-01',
    governingPolicyName: 'Enterprise AI Resource Quota & Cost Governance Policy',
    controlId: 'CG-AG-06',
    controlName: 'Cost & Resource Quotas',
    linkedIncidentId: 'INC-2026-0087',
    costPerThousandTokens: 0.015,
    anomalyObserved: 'Token velocity reached 284k tokens/min. Tripped CB-RULE-FINOPS-03 into Safe Fallback mode.'
  },
  {
    entityId: 'SYS-DATA-004',
    entityName: 'Data Enrichment Pipeline',
    systemId: 'SYS-DATA-004',
    systemName: 'Data Enrichment Microservice',
    department: 'Core Engineering',
    assignedSquad: 'Squad Data-Platform',
    primaryModel: 'gpt-4o-mini',
    modelProvider: 'OpenAI',
    monthlyBudgetUSD: 1000,
    currentSpendUSD: 412.30,
    promptTokens: 8200000,
    completionTokens: 1400000,
    totalTokens: 9600000,
    totalRequests: 54900,
    avgLatencyMs: 310,
    tokenQuotaMonthly: 25000000,
    rateLimitRpm: 300,
    status: 'WITHIN_LIMIT',
    enforcementMode: 'HYBRID',
    governingPolicyId: 'POL-CG-AG-06-01',
    governingPolicyName: 'Enterprise AI Resource Quota & Cost Governance Policy',
    controlId: 'CG-AG-06',
    controlName: 'Cost & Resource Quotas',
    costPerThousandTokens: 0.0006
  },
  {
    entityId: 'AGT-OPS-1102',
    entityName: 'Ops Executor',
    systemId: 'SYS-MAINT-007',
    systemName: 'System Maintenance Bot',
    department: 'IT & Infrastructure',
    assignedSquad: 'Squad Infra-Sec',
    primaryModel: 'llama-3.1-70b-instruct',
    modelProvider: 'Self-Hosted OSS',
    monthlyBudgetUSD: 800,
    currentSpendUSD: 512.60,
    promptTokens: 4100000,
    completionTokens: 850000,
    totalTokens: 4950000,
    totalRequests: 8200,
    avgLatencyMs: 450,
    tokenQuotaMonthly: 10000000,
    rateLimitRpm: 60,
    status: 'THROTTLED',
    enforcementMode: 'RUNTIME_ENFORCED',
    governingPolicyId: 'POL-CG-AG-06-01',
    governingPolicyName: 'Enterprise AI Resource Quota & Cost Governance Policy',
    controlId: 'CG-AG-06',
    controlName: 'Cost & Resource Quotas',
    linkedIncidentId: 'INC-2026-0091',
    costPerThousandTokens: 0.0035,
    anomalyObserved: '16 repetitive loop attempts consumed rapid GPU inference time prior to kill-switch.'
  }
];

export class FinOpsStore {
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

  static getUsage(tenantId?: string): FinOpsEntityUsage[] {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const saved = PersistenceAdapter.read<FinOpsEntityUsage[]>('finops', STORAGE_KEY_FINOPS);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (this.scanFinOpsOverride && (!tenantId || PersistenceAdapter.getContext().tenantId === 'TENANT-DEFAULT')) {
      return JSON.parse(JSON.stringify(this.scanFinOpsOverride));
    }
    return JSON.parse(JSON.stringify(BASELINE_FINOPS));
  }

    private static scanFinOpsOverride: FinOpsEntityUsage[] | null = null;

  static ingestScanFinOps(monthlyUsd: number, monthlyTokens: number, providerSummary: Record<string, number>, tenantId?: string) {
    const primaryProvider = Object.keys(providerSummary)[0] || 'OpenAI';
    const mappedProvider: FinOpsEntityUsage['modelProvider'] = 
      primaryProvider.toLowerCase().includes('anthropic') ? 'Anthropic' :
      primaryProvider.toLowerCase().includes('google') ? 'Google' :
      primaryProvider.toLowerCase().includes('local') || primaryProvider.toLowerCase().includes('mistral') ? 'Self-Hosted OSS' : 'OpenAI';

    const scannedEntity: FinOpsEntityUsage = {
      entityId: 'FINOPS-SCAN-01',
      entityName: 'Scanned AI Application Fleet',
      systemId: 'SYS-SCAN-CORE',
      systemName: 'Scanned Production AI System',
      department: 'Quantitative AI Engineering',
      assignedSquad: 'Trading Algorithmic Systems',
      primaryModel: 'gpt-4o',
      modelProvider: mappedProvider,
      monthlyBudgetUSD: Math.round(monthlyUsd * 1.5),
      currentSpendUSD: monthlyUsd,
      promptTokens: Math.round(monthlyTokens * 0.4),
      completionTokens: Math.round(monthlyTokens * 0.6),
      totalTokens: monthlyTokens,
      totalRequests: Math.round(monthlyTokens / 800),
      avgLatencyMs: 240,
      tokenQuotaMonthly: Math.round(monthlyTokens * 2),
      rateLimitRpm: 500,
      status: 'WITHIN_LIMIT',
      enforcementMode: 'RUNTIME_ENFORCED',
      governingPolicyId: 'POL-FINOPS-01',
      governingPolicyName: 'Enterprise AI Token Quota & Cost Control Policy',
      controlId: 'CG-AG-10',
      controlName: 'FinOps AI Token Quota & Cost Control',
      costPerThousandTokens: 0.002
    };

    this.scanFinOpsOverride = [scannedEntity];
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.write('finops', [scannedEntity], STORAGE_KEY_FINOPS);
    this.notify();
  }

  static resetToBaseline(tenantId?: string) {
    this.scanFinOpsOverride = null;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.delete('finops', STORAGE_KEY_FINOPS);
    this.notify();
  }

  static updateBudgetAndQuota(
    entityId: string,
    newBudgetUSD: number,
    newTokenQuota: number,
    newEnforcementMode: FinOpsEnforcementMode,
    rationale: string,
    updatedBy = 'Roberto Silva (CISO & Accountable Lead)',
    tenantId?: string
  ): { entity: FinOpsEntityUsage; evidence: ProtectedEvidenceRecord } {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const list = this.getUsage(tenantId);
    const index = list.findIndex(e => e.entityId === entityId);
    if (index === -1) {
      throw new Error(`Entity ${entityId} not found in FinOps store`);
    }

    const target = list[index];
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const digest = `DIGEST-FINOPS-QUOTA-${hash}-SHA256`;

    const updated: FinOpsEntityUsage = {
      ...target,
      monthlyBudgetUSD: newBudgetUSD,
      tokenQuotaMonthly: newTokenQuota,
      enforcementMode: newEnforcementMode,
      status: target.currentSpendUSD > newBudgetUSD ? 'LIMIT_EXCEEDED' : 'WITHIN_LIMIT'
    };

    list[index] = updated;
    PersistenceAdapter.write('finops', list, STORAGE_KEY_FINOPS);

    // Record Protected Evidence in Ledger
    const evidence: ProtectedEvidenceRecord = {
      evidenceId: `EV-FINOPS-${Date.now().toString(36).toUpperCase()}`,
      entityType: 'AGENT',
      entityId: target.entityId,
      controlId: target.controlId,
      eventType: 'DECISION_EXECUTION',
      timestamp: new Date().toISOString(),
      tamperEvidentSignature: digest,
      payloadSummary: `FinOps Budget/Quota re-calibrated for ${target.entityName} to $${newBudgetUSD} / ${newTokenQuota} tokens by ${updatedBy}: ${rationale}`,
      retentionDays: 1825
    };

    const ledger = [evidence, ...DecisionStore.getEvidenceLedger(tenantId)];
    PersistenceAdapter.write('evidence_ledger', ledger.slice(0, 30), 'cg_ag_unified_evidence_v2');

    this.notify();
    return { entity: updated, evidence };
  }
}
