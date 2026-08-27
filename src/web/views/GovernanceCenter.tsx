import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Bot, 
  CheckCircle2, 
  Scale, 
  ArrowUpRight, 
  FileText, 
  Lock, 
  ExternalLink, 
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  FileBadge,
  Sparkles,
  Zap,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useIndustry } from '../context/IndustryContext';

interface FindingItem {
  id: string;
  finding: string;
  sourceTarget: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  owner: string;
  status: 'PENDING_DECISION' | 'APPROVED' | 'IN_REMEDIATION' | 'ACCEPTED';
  recommendedAction: string;
  controlId: string;
}

export const GovernanceCenter: React.FC<{ onNavigateToScanner: () => void; onNavigateToPassports: () => void; onNavigateToControls: () => void }> = ({
  onNavigateToScanner,
  onNavigateToPassports,
  onNavigateToControls
}) => {
  const { activeProfile, environment } = useIndustry();

  // Operational Action Queue Data (Realistically modeled from scanner engine)
  const [findings, setFindings] = useState<FindingItem[]>([
    {
      id: 'FIND-001',
      finding: 'Credit Scoring Agent operates autonomous loan approvals without Tier-2 HITL oversight',
      sourceTarget: 'agents/credit_agent.py (Credit Evaluator)',
      severity: 'CRITICAL',
      owner: 'Roberto Silva (CISO & Credit Risk Lead)',
      status: 'PENDING_DECISION',
      recommendedAction: 'Enforce mandatory Human-in-the-Loop checkpoint for loans > R$ 50,000',
      controlId: 'CG-AG-03'
    },
    {
      id: 'FIND-002',
      finding: 'Direct unmonitored LLM invocation detected bypassing PII de-identification filter',
      sourceTarget: 'services/direct_llm.py (Shadow AI Endpoint)',
      severity: 'HIGH',
      owner: 'Carlos DPO (Data Protection Officer)',
      status: 'PENDING_DECISION',
      recommendedAction: 'Route through SecurityGuard sanitization pipeline (LGPD Art. 38)',
      controlId: 'CG-AG-06'
    },
    {
      id: 'FIND-003',
      finding: 'High-privilege tool attached with arbitrary execution permissions',
      sourceTarget: 'tools/system_executor.ts (BashTool)',
      severity: 'HIGH',
      owner: 'Security Engineering Lead',
      status: 'PENDING_DECISION',
      recommendedAction: 'Restrict to least-privilege read-only operational boundary',
      controlId: 'CG-AG-02'
    },
    {
      id: 'FIND-004',
      finding: 'Missing automated Circuit Breaker on multi-agent execution loop',
      sourceTarget: 'crew/orchestration.py (CrewAI Team)',
      severity: 'MEDIUM',
      owner: 'AI Platform Engineering',
      status: 'PENDING_DECISION',
      recommendedAction: 'Set max_iterations=5 and timeout=120s guardrails',
      controlId: 'CG-AG-04'
    }
  ]);

  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  const handleDecision = (id: string, actionType: 'MITIGATE' | 'ACCEPT' | 'ESCALATE') => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: actionType === 'MITIGATE' ? 'IN_REMEDIATION' : (actionType === 'ACCEPT' ? 'ACCEPTED' : 'PENDING_DECISION') } : f));
    setDecisionFeedback(`Decision recorded: ${actionType} applied to ${id}. Tamper-evident proof logged in Audit Ledger.`);
    setTimeout(() => setDecisionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Context Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Level 2 Control Plane</span>
            <span>·</span>
            <span>{activeProfile.name} Profile</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Governance Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time posture, accountable decisions, and auditable evidence across the enterprise AI landscape.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={onNavigateToScanner}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-medium shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ingest / Scan Codebase</span>
          </button>
        </div>
      </div>

      {/* Decision Feedback Toast */}
      {decisionFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{decisionFeedback}</span>
          </div>
          <button onClick={() => setDecisionFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: DUAL POSTURE & LANDSCAPE STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: CG-AG Governance Score (12 Controls) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 elevation-card relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">CG-AG Score</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">12 Controls</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">84%</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              🟢 Governed
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '84%' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>10/12 Controls Active</span>
            <button onClick={onNavigateToControls} className="text-sky-600 hover:underline">View Matrix →</button>
          </div>
        </div>

        {/* Metric 2: Agentic Governance Score (10 Dims) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 elevation-card relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Agentic Score</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">10 Dims (Light)</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">76%</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center">
              🟡 Attention
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '76%' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>27 Agents Audited</span>
            <button onClick={onNavigateToPassports} className="text-sky-600 hover:underline">Passports →</button>
          </div>
        </div>

        {/* Metric 3: AI Landscape Inventory */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">AI Landscape</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">142</span>
            <span className="text-[11px] text-slate-500">Entities Cataloged</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>🤖 27 Agents</span>
            <span>🧠 14 Models</span>
            <span>🔌 8 Tools</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 text-right">
            <span>100% In-Memory Validated</span>
          </div>
        </div>

        {/* Metric 4: Risk & Exposure */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Exposure Gaps</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">3</span>
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">High / Critical</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>1 Missing HITL</span>
            <span>1 Shadow PII</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            <span>Human Review Required</span>
          </div>
        </div>

        {/* Metric 5: Tamper-Evident Assurance */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Audit Assurance</span>
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">100%</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Traceable</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Ledger: SHA-256</span>
            <span>Ret: 1825 Days</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            <span>EU AI Act Art. 12 & LGPD 38</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: INDUSTRY CONTEXT BANNER */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 via-slate-900/40 to-indigo-950/30 border border-sky-800/30 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <span className="text-2xl p-1 bg-slate-800/80 rounded-lg border border-slate-700">{activeProfile.icon}</span>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeProfile.name} Governance Profile</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono-code">{environment}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                {activeProfile.description}
              </p>
            </div>
          </div>

          {/* Supported Regulatory References */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeProfile.regulations.map(reg => (
              <span key={reg} className="px-2 py-1 bg-slate-800/80 border border-slate-700/80 rounded text-[10px] text-slate-300 font-medium">
                ⚖️ {reg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: WHAT NEEDS ATTENTION? (OPERATIONAL DECISION QUEUE) */}
      <div className="rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 elevation-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎯 What Needs Attention?</span>
              <span className="text-xs font-normal text-slate-500">({findings.filter(f => f.status === 'PENDING_DECISION').length} Open Operational Findings)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every critical risk requires an explicit human decision: <strong className="text-slate-700 dark:text-slate-300">Accept, Mitigate, Transfer, Avoid, or Escalate</strong>.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono-code">
            Pipeline: Risk → Decision → Action
          </div>
        </div>

        {/* Findings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Severity / Control</th>
                <th className="py-2.5 px-4">Finding & Affected Component</th>
                <th className="py-2.5 px-4">Accountable Owner</th>
                <th className="py-2.5 px-4">Recommended Action</th>
                <th className="py-2.5 px-4 text-right">Human Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {findings.map((item) => {
                const isCritical = item.severity === 'CRITICAL';
                const isHigh = item.severity === 'HIGH';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCritical
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : (isHigh
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300')
                        }`}>
                          {item.severity}
                        </span>
                        <span className="font-mono-code text-[11px] text-slate-400">{item.controlId}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.finding}</div>
                      <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">{item.sourceTarget}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{item.owner.split('(')[0]}</div>
                      <div className="text-[10px] text-slate-400">{item.owner.split('(')[1]?.replace(')', '')}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="text-xs">{item.recommendedAction}</div>
                      <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">Status: {item.status}</div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.status === 'PENDING_DECISION' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleDecision(item.id, 'MITIGATE')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium shadow-sm transition"
                            title="Apply safeguard and schedule remediation action"
                          >
                            Mitigate
                          </button>
                          <button
                            onClick={() => handleDecision(item.id, 'ACCEPT')}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition"
                            title="Formally accept risk with accountable sign-off"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecision(item.id, 'ESCALATE')}
                            className="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded text-[11px] font-medium border border-rose-200 dark:border-rose-800 transition"
                            title="Escalate to C-Level / Board"
                          >
                            Escalate
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Decided ({item.status})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: CONTROL PLANE OPERATIONAL PREVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: 12 Controls Coverage Breakdown */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 elevation-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>📜 12 CG-AG Controls Coverage</span>
            </h3>
            <button onClick={onNavigateToControls} className="text-xs text-sky-600 hover:underline">Full View →</button>
          </div>
          <p className="text-[11px] text-slate-500">Distribution across the 4 Control Plane operational groupings:</p>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <span>Discover (CG-AG-01, 12)</span>
                <span className="text-emerald-500 font-bold">100% Effective</span>
              </div>
              <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <span>Govern (CG-AG-02, 05, 06, 08)</span>
                <span className="text-amber-500 font-bold">75% (1 Gap)</span>
              </div>
              <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <span>Operate (CG-AG-03, 04, 10, 11)</span>
                <span className="text-amber-500 font-bold">75% (1 HITL Gap)</span>
              </div>
              <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <span>Assure (CG-AG-07, 09)</span>
                <span className="text-emerald-500 font-bold">100% Active</span>
              </div>
              <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Verifiable Agent Passports Sample */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 elevation-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🪪 Agent Passports</span>
            </h3>
            <button onClick={onNavigateToPassports} className="text-xs text-sky-600 hover:underline">All Passports →</button>
          </div>
          <p className="text-[11px] text-slate-500">Cryptographically verifiable identity badges for autonomous agents:</p>

          <div className="space-y-2">
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">Credit Risk Evaluator</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-semibold">🟡 Conditional</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">CG-AG-CREWAI-CREDIT-911E</div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                <span>Owner: Roberto Silva</span>
                <span>Autonomy: L3 Bounded</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">Customer Support Orchestrator</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">🟢 Governed</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">CG-AG-LANGGRAPH-SUPPORT-49F1</div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                <span>Owner: Customer Ops</span>
                <span>Autonomy: L2 Supervised</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Tamper-Evident Audit Ledger Feed */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 elevation-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒 Tamper-Evident Audit Stream</span>
            </h3>
            <span className="text-[10px] text-emerald-600 font-mono-code">Live Stream</span>
          </div>
          <p className="text-[11px] text-slate-500">Continuous cryptographic ledger of governance events and reviews:</p>

          <div className="space-y-2 font-mono-code text-[11px]">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>EVENT: DECISION_APPLIED</span>
                <span>2m ago</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">Decision: MITIGATE on CG-AG-03</div>
              <div className="text-[10px] text-slate-400 mt-1">Hash: SIG-48E9F108AB31</div>
            </div>

            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>EVENT: PASSPORT_ISSUED</span>
                <span>14m ago</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">Credit Risk Agent Token Issued</div>
              <div className="text-[10px] text-slate-400 mt-1">Hash: SIG-911EB3A0C872</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
