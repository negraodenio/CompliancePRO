import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  Lock, 
  UserCheck, 
  Layers, 
  Bot, 
  Wrench, 
  FileText, 
  Activity, 
  Clock, 
  CheckSquare, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { DecisionStore, OperationalFinding } from '../services/decision-store';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type RiskCategory = 
  | 'AI_SECURITY'
  | 'PRIVACY_DATA'
  | 'AUTONOMY_OVERSIGHT'
  | 'MODEL_RISK'
  | 'TOOL_AUTHORIZATION'
  | 'RESILIENCE'
  | 'FINOPS_COST'
  | 'SUPPLY_CHAIN';

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DecisionType = 'PENDING_DECISION' | 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | 'ESCALATE';

export interface GovernanceRiskRecord {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedTarget: {
    systemName: string;
    systemId: string;
    agentName?: string;
    agentId?: string;
    team?: string;
    model?: string;
    toolsAffected?: string[];
  };
  controlId: string;
  controlName: string;
  findingId: string;
  findingSummary: string;
  accountableOwner: {
    name: string;
    role: string;
    department: string;
  };
  status: 'OPEN' | 'IN_TREATMENT' | 'ACCEPTED' | 'ESCALATED' | 'RESOLVED';
  decisionStatus: DecisionType;
  decisionId?: string;
  treatment: {
    actionRequired: string;
    assignedTo: string;
    targetDueDate: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  };
  evidenceDigest: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_RISKS: GovernanceRiskRecord[] = [
  {
    id: 'RISK-2026-0042',
    title: 'Autonomous Loan Approval without Tier-2 HITL Checkpoint',
    description: 'Credit Risk Agent autonomously executes underwriting decisions exceeding R$ 50,000 without mandatory human sign-off trigger, creating regulatory exposure under EU AI Act Art. 14 and credit model risk.',
    category: 'AUTONOMY_OVERSIGHT',
    severity: 'CRITICAL',
    likelihood: 'HIGH',
    impact: 'HIGH',
    riskLevel: 'CRITICAL',
    affectedTarget: {
      systemName: 'Credit Risk Scoring Orchestrator',
      systemId: 'SYS-CREDIT-001',
      agentName: 'Credit Risk Evaluator',
      agentId: 'AGT-CREDIT-911E',
      team: 'Credit Underwriting Squad',
      model: 'gpt-4-turbo (CrewAI 0.1.x)',
      toolsAffected: ['LoanOfferGenerator']
    },
    controlId: 'CG-AG-03',
    controlName: 'Human-in-the-Loop Oversight',
    findingId: 'FIND-001',
    findingSummary: 'Credit Scoring Agent operates autonomous loan approvals without Tier-2 HITL oversight',
    accountableOwner: {
      name: 'Roberto Silva',
      role: 'CISO & Credit Risk Lead',
      department: 'Risk & Compliance'
    },
    status: 'OPEN',
    decisionStatus: 'PENDING_DECISION',
    treatment: {
      actionRequired: 'Enforce mandatory Human-in-the-Loop checkpoint for loans > R$ 50,000',
      assignedTo: 'AppSec & Risk Engineering',
      targetDueDate: '2026-09-05',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0042-SHA256',
    createdAt: '2026-08-25T10:00:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  },
  {
    id: 'RISK-2026-0043',
    title: 'Unmonitored Shadow LLM Endpoint Processing PII',
    description: 'Direct uncataloged OpenAI API invocation detected in marketing service, bypassing corporate SecurityGuard proxies and data anonymization filters (LGPD Art. 38 & 46).',
    category: 'PRIVACY_DATA',
    severity: 'HIGH',
    likelihood: 'HIGH',
    impact: 'HIGH',
    riskLevel: 'HIGH',
    affectedTarget: {
      systemName: 'Direct Marketing Prompt Service',
      systemId: 'SYS-SHADOW-003',
      team: 'Growth Marketing',
      model: 'gpt-4-0613 (OpenAI SDK Direct)'
    },
    controlId: 'CG-AG-06',
    controlName: 'Data Privacy & PII Protection',
    findingId: 'FIND-002',
    findingSummary: 'Direct unmonitored LLM invocation detected bypassing PII de-identification filter',
    accountableOwner: {
      name: 'Carlos DPO',
      role: 'Data Protection Officer',
      department: 'Privacy Office'
    },
    status: 'OPEN',
    decisionStatus: 'PENDING_DECISION',
    treatment: {
      actionRequired: 'Route through SecurityGuard sanitization pipeline (LGPD Art. 38)',
      assignedTo: 'Growth Tech Team',
      targetDueDate: '2026-09-02',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0043-SHA256',
    createdAt: '2026-08-26T14:30:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  },
  {
    id: 'RISK-2026-0044',
    title: 'Unbounded High-Privilege Execution Tool Attached to Agent',
    description: 'High-privilege bash execution tool attached without least-privilege boundary or explicit whitelist, exposing agent to potential prompt injection tool misuse (OWASP LLM06).',
    category: 'TOOL_AUTHORIZATION',
    severity: 'HIGH',
    likelihood: 'MEDIUM',
    impact: 'HIGH',
    riskLevel: 'HIGH',
    affectedTarget: {
      systemName: 'System Maintenance Bot',
      systemId: 'SYS-MAINT-007',
      agentName: 'Ops Executor',
      agentId: 'AGT-OPS-1102',
      team: 'Platform Engineering',
      model: 'claude-3-5-sonnet',
      toolsAffected: ['BashTool', 'SystemExecutor']
    },
    controlId: 'CG-AG-02',
    controlName: 'Agent & Tool Scoping',
    findingId: 'FIND-003',
    findingSummary: 'High-privilege execution tool attached without least-privilege boundary',
    accountableOwner: {
      name: 'Security Engineering Lead',
      role: 'AppSec Architect',
      department: 'Cybersecurity'
    },
    status: 'OPEN',
    decisionStatus: 'PENDING_DECISION',
    treatment: {
      actionRequired: 'Restrict to read-only tool boundary with explicit whitelist',
      assignedTo: 'DevOps Security',
      targetDueDate: '2026-09-08',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0044-SHA256',
    createdAt: '2026-08-27T08:00:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  },
  {
    id: 'RISK-2026-0045',
    title: 'Multi-Agent Execution Loop Lacks Circuit Breaker Timeout',
    description: 'Multi-agent orchestration crew lacks automated max_iterations limit and execution timeout, risking unbounded loops and operational denial-of-service.',
    category: 'RESILIENCE',
    severity: 'MEDIUM',
    likelihood: 'LOW',
    impact: 'MEDIUM',
    riskLevel: 'MEDIUM',
    affectedTarget: {
      systemName: 'Multi-Agent Wealth Management Group',
      systemId: 'SYS-INVEST-005',
      team: 'Wealth Management AI Team',
      model: 'claude-3-5-sonnet (AutoGen)'
    },
    controlId: 'CG-AG-04',
    controlName: 'Runtime Safety & Circuit Breakers',
    findingId: 'FIND-004',
    findingSummary: 'Missing automated Circuit Breaker timeout on multi-agent execution loop',
    accountableOwner: {
      name: 'AI Platform Engineering',
      role: 'Platform Lead',
      department: 'Core Engineering'
    },
    status: 'OPEN',
    decisionStatus: 'PENDING_DECISION',
    treatment: {
      actionRequired: 'Configure max_iterations=5 and timeout=120s guardrails',
      assignedTo: 'AI Core Team',
      targetDueDate: '2026-09-15',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0045-SHA256',
    createdAt: '2026-08-27T09:30:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  }
];

export const RiskEngineView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile } = useIndustry();
  const [risks, setRisks] = useState<GovernanceRiskRecord[]>(INITIAL_RISKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<GovernanceRiskRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'exposure' | 'control' | 'decision' | 'treatment' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; decisionId: string; hash: string } | null>(null);

  // Sync with real DecisionStore on mount
  useEffect(() => {
    const findings = DecisionStore.getFindings();
    setRisks((prev) =>
      prev.map((r) => {
        const matchingFinding = findings.find((f) => f.id === r.findingId);
        if (matchingFinding && matchingFinding.decision) {
          return {
            ...r,
            decisionStatus: matchingFinding.decision.decision as DecisionType,
            decisionId: matchingFinding.decision.decisionId,
            status: matchingFinding.decision.decision === 'ACCEPT' ? 'ACCEPTED' : (matchingFinding.decision.decision === 'ESCALATE' ? 'ESCALATED' : 'IN_TREATMENT')
          };
        }
        return r;
      })
    );
  }, []);

  const handleExecuteDecision = (risk: GovernanceRiskRecord, decisionType: 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | 'ESCALATE') => {
    // Map to DecisionStore action
    const mappedStoreType: 'MITIGATE' | 'ACCEPT' | 'ESCALATE' = 
      decisionType === 'TRANSFER' || decisionType === 'AVOID' ? 'MITIGATE' : decisionType;

    const res = DecisionStore.recordDecision(risk.findingId, mappedStoreType);

    const updated = risks.map((r) => {
      if (r.id === risk.id) {
        return {
          ...r,
          decisionStatus: decisionType,
          decisionId: res.decision.decisionId,
          status: decisionType === 'ACCEPT' ? 'ACCEPTED' as const : (decisionType === 'ESCALATE' ? 'ESCALATED' as const : 'IN_TREATMENT' as const),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    setRisks(updated);
    if (selectedRisk && selectedRisk.id === risk.id) {
      setSelectedRisk({
        ...selectedRisk,
        decisionStatus: decisionType,
        decisionId: res.decision.decisionId,
        status: decisionType === 'ACCEPT' ? 'ACCEPTED' : (decisionType === 'ESCALATE' ? 'ESCALATED' : 'IN_TREATMENT')
      });
    }

    setFeedback({
      message: `Human Governance Decision [${decisionType}] recorded on ${risk.id}.`,
      decisionId: res.decision.decisionId,
      hash: res.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.affectedTarget.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.accountableOwner.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeverity = filterSeverity === 'ALL' || r.severity === filterSeverity;
      const matchCategory = filterCategory === 'ALL' || r.category === filterCategory;
      const matchDecision = filterDecision === 'ALL' || r.decisionStatus === filterDecision;

      return matchSearch && matchSeverity && matchCategory && matchDecision;
    });
  }, [risks, searchTerm, filterSeverity, filterCategory, filterDecision]);

  const criticalCount = risks.filter((r) => r.severity === 'CRITICAL').length;
  const highCount = risks.filter((r) => r.severity === 'HIGH').length;
  const pendingDecisionsCount = risks.filter((r) => r.decisionStatus === 'PENDING_DECISION').length;
  const inTreatmentCount = risks.filter((r) => r.status === 'IN_TREATMENT').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Govern Pillar</span>
            <span>·</span>
            <span>Risk Exposure Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Enterprise AI Risk Engine</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold font-mono-code">
              {pendingDecisionsCount} Decisions Required
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"Where is AI governance exposure, why does it exist, who owns it, and what governance decision is required?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code">
            Pipeline: Control → Finding → Risk → Decision → Action
          </span>
        </div>
      </div>

      {/* Decision Feedback Toast */}
      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold">{feedback.message}</span>
              <span className="ml-2 font-mono-code text-[11px] text-emerald-700 dark:text-emerald-300">
                Decision: <strong>{feedback.decisionId}</strong> | Integrity Hash: <strong>{feedback.hash}</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUMMARY COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Critical Risks</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">High Likelihood × High Impact</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">High Risks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{highCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Security & Privacy Gaps</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pending Decisions</span>
            <UserCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{pendingDecisionsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting Accountable Sign-off</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">In Treatment</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{inTreatmentCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Remediation Action Active</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search risk ID, title, affected target, control, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🔵 Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="AUTONOMY_OVERSIGHT">Autonomy & HITL</option>
            <option value="PRIVACY_DATA">Privacy & PII</option>
            <option value="TOOL_AUTHORIZATION">Tool Authorization</option>
            <option value="RESILIENCE">Resilience & Failsafe</option>
          </select>

          {/* Decision Status Filter */}
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="PENDING_DECISION">⚠️ Pending Decision</option>
            <option value="MITIGATE">✓ Mitigated</option>
            <option value="ACCEPT">✓ Accepted</option>
            <option value="ESCALATE">▲ Escalated</option>
          </select>
        </div>
      </div>

      {/* PRIMARY RISK TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Risk ID & Title</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Target</th>
                <th className="py-3 px-4">CG-AG Control</th>
                <th className="py-3 px-4">Accountable Owner</th>
                <th className="py-3 px-4">Decision Status</th>
                <th className="py-3 px-4">Treatment Action</th>
                <th className="py-3 px-4 text-right">Investigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRisks.map((risk) => {
                const isCritical = risk.severity === 'CRITICAL';
                const isHigh = risk.severity === 'HIGH';
                const isPending = risk.decisionStatus === 'PENDING_DECISION';

                return (
                  <tr
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'text-rose-500' : (isHigh ? 'text-amber-500' : 'text-blue-500')}`} />
                        <span>{risk.title}</span>
                      </div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{risk.id} · {risk.category.replace(/_/g, ' ')}</div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : (isHigh
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800')
                      }`}>
                        {risk.severity}
                      </span>
                    </td>

                    {/* Affected Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{risk.affectedTarget.systemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">
                        {risk.affectedTarget.agentName ? `Agent: ${risk.affectedTarget.agentName}` : `System: ${risk.affectedTarget.systemId}`}
                      </div>
                    </td>

                    {/* CG-AG Control */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {risk.controlId}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{risk.controlName}</div>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{risk.accountableOwner.name}</div>
                      <div className="text-[10px] text-slate-400">{risk.accountableOwner.role}</div>
                    </td>

                    {/* Decision Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPending
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                          : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        {risk.decisionStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Treatment Action */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-xs">{risk.treatment.actionRequired}</div>
                      <div className="text-[10px] text-slate-400">Due: {risk.treatment.targetDueDate}</div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRisk(risk);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Investigate <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE SLIDE-OVER RISK INVESTIGATION DRAWER */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      {selectedRisk.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedRisk.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {selectedRisk.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedRisk.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedRisk.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRisk(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'exposure', 'control', 'decision', 'treatment', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'control' ? 'Control & Finding' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Methodology Breakdown */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Deterministic Risk Methodology</span>
                        <span className="font-mono-code text-[11px] text-sky-600 dark:text-sky-400">Likelihood × Impact</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Likelihood:</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{selectedRisk.likelihood}</div>
                        </div>
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Impact:</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{selectedRisk.impact}</div>
                        </div>
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg">
                          <span className="text-[10px] text-rose-500 font-semibold">Calculated Level:</span>
                          <div className="font-bold text-rose-600 dark:text-rose-400">{selectedRisk.riskLevel}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[11px]">Accountable Owner:</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedRisk.accountableOwner.name}</div>
                        <div className="text-[10px] text-slate-400">{selectedRisk.accountableOwner.role}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Department / Unit:</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedRisk.accountableOwner.department}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Governance Decision State:</span>
                        <div className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">{selectedRisk.decisionStatus.replace(/_/g, ' ')}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Operational Status:</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedRisk.status}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. EXPOSURE */}
                {activeDrawerTab === 'exposure' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-500" />
                      <span>Affected AI Architecture & Target</span>
                    </div>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target AI System:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedRisk.affectedTarget.systemName}</span>
                      </div>
                      {selectedRisk.affectedTarget.agentName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Autonomous Agent:</span>
                          <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedRisk.affectedTarget.agentName} ({selectedRisk.affectedTarget.agentId})</span>
                        </div>
                      )}
                      {selectedRisk.affectedTarget.team && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Squad / Team:</span>
                          <span>{selectedRisk.affectedTarget.team}</span>
                        </div>
                      )}
                      {selectedRisk.affectedTarget.model && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Foundation Model:</span>
                          <span className="font-mono-code">{selectedRisk.affectedTarget.model}</span>
                        </div>
                      )}
                      {selectedRisk.affectedTarget.toolsAffected && (
                        <div>
                          <span className="text-slate-400">Tools in Scope:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedRisk.affectedTarget.toolsAffected.map((t) => (
                              <span key={t} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono-code text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. CONTROL & FINDING CAUSAL CHAIN */}
                {activeDrawerTab === 'control' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Causal Chain: Why Does This Risk Exist?</div>
                      <div className="space-y-3">
                        <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">1. Governance Control In Scope</div>
                          <div className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">{selectedRisk.controlId} · {selectedRisk.controlName}</div>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
                        </div>

                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">2. Observed Finding / Gap</div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200 mt-0.5">{selectedRisk.findingSummary}</div>
                          <div className="text-[10px] font-mono-code text-slate-400 mt-1">Ref: {selectedRisk.findingId}</div>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
                        </div>

                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg">
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">3. Resulting Exposure Risk</div>
                          <div className="font-bold text-rose-900 dark:text-rose-200 mt-0.5">{selectedRisk.title}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. HUMAN DECISION */}
                {activeDrawerTab === 'decision' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Human Governance Decision Sign-Off</span>
                      <span className="text-[10px] text-slate-400">Accountable Lead: {selectedRisk.accountableOwner.name}</span>
                    </div>

                    {selectedRisk.decisionStatus === 'PENDING_DECISION' ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          Under CG-AG Governance OS, risks do not automatically become actions. Choose an explicit, accountable decision:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleExecuteDecision(selectedRisk, 'MITIGATE')}
                            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>1. MITIGATE (Apply Guardrails)</span>
                          </button>
                          <button
                            onClick={() => handleExecuteDecision(selectedRisk, 'ACCEPT')}
                            className="p-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <span>2. ACCEPT (Formal Sign-Off)</span>
                          </button>
                          <button
                            onClick={() => handleExecuteDecision(selectedRisk, 'TRANSFER')}
                            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>3. TRANSFER (Insurance/Vendor)</span>
                          </button>
                          <button
                            onClick={() => handleExecuteDecision(selectedRisk, 'ESCALATE')}
                            className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>4. ESCALATE (Board / C-Level)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Governance Decision Formally Executed</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          Decision Type: <strong className="text-emerald-600 dark:text-emerald-400">{selectedRisk.decisionStatus}</strong>
                        </div>
                        <div className="font-mono-code text-[11px] text-slate-500">
                          Decision ID: {selectedRisk.decisionId || 'DEC-2026-RESOLVED'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. TREATMENT */}
                {activeDrawerTab === 'treatment' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Treatment Plan & Corrective Action</div>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Assigned Action:</span>
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg mt-1 font-semibold text-slate-900 dark:text-slate-100">
                          {selectedRisk.treatment.actionRequired}
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Assigned Treatment Squad:</span>
                        <span className="font-semibold">{selectedRisk.treatment.assignedTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Resolution Due Date:</span>
                        <span className="font-mono-code font-bold text-slate-900 dark:text-slate-100">{selectedRisk.treatment.targetDueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Treatment Lifecycle Status:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{selectedRisk.treatment.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. EVIDENCE & AUDIT */}
                {activeDrawerTab === 'evidence' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Evidence & Audit Link</span>
                    </div>
                    <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      Integrity Hash: {selectedRisk.evidenceDigest}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Chained into the Tamper-Evident Audit Ledger upon risk identification and decision registration.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Risk ID: {selectedRisk.id}</span>
              <button
                onClick={() => setSelectedRisk(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
