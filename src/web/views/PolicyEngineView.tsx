import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
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
  Activity, 
  Clock, 
  CheckSquare, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  FileBadge,
  AlertTriangle,
  History,
  Building2,
  Calendar
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { PolicyStore, GovernancePolicy, PolicyType, PolicyStatus, EnforcementMode } from '../services/policy-store';
import { DecisionStore } from '../services/decision-store';

export const PolicyEngineView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterEnforcement, setFilterEnforcement] = useState<string>('ALL');
  const [filterControl, setFilterControl] = useState<string>('ALL');
  const [selectedPolicy, setSelectedPolicy] = useState<GovernancePolicy | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'applicability' | 'controls' | 'enforcement' | 'exceptions' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; digest: string } | null>(null);

  // Exception modal state
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionOwner, setExceptionOwner] = useState('Roberto Silva');
  const [exceptionExpiry, setExceptionExpiry] = useState('2026-12-31');

  const refreshState = () => {
    const list = PolicyStore.getPolicies();
    setPolicies(list);
    if (selectedPolicy) {
      const updated = list.find(p => p.id === selectedPolicy.id);
      if (updated) setSelectedPolicy(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return PolicyStore.subscribe(refreshState);
  }, []);

  const handleRecordException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy || !exceptionReason) return;

    const res = PolicyStore.recordPolicyException(
      selectedPolicy.id,
      exceptionReason,
      exceptionOwner,
      exceptionExpiry
    );

    setIsExceptionModalOpen(false);
    setExceptionReason('');
    setFeedback({
      message: `Formal Policy Exception registered on ${selectedPolicy.id} with Human Accountable Sign-Off.`,
      digest: res.exception.evidenceDigest
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.applicableControls.some(c => c.controlId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = filterType === 'ALL' || p.type === filterType;
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
      const matchEnforcement = filterEnforcement === 'ALL' || p.enforcement.mode === filterEnforcement;
      const matchControl = filterControl === 'ALL' || p.applicableControls.some(c => c.controlId === filterControl);

      return matchSearch && matchType && matchStatus && matchEnforcement && matchControl;
    });
  }, [policies, searchTerm, filterType, filterStatus, filterEnforcement, filterControl]);

  const activeCount = policies.filter(p => p.status === 'ACTIVE').length;
  const reviewRequiredCount = policies.filter(p => p.guardrails.some(g => g.enforcementStatus === 'GAP_DETECTED')).length;
  const exceptionsCount = policies.reduce((acc, p) => acc + p.exceptions.filter(e => e.status === 'ACTIVE').length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Govern Pillar</span>
            <span>·</span>
            <span>Policy & Guardrail Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Policy Engine</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold font-mono-code">
              {activeCount} Active · {reviewRequiredCount} Review Required · {exceptionsCount} Exceptions
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Defines, applies, and evidences governance policies across the enterprise AI landscape.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code">
            Chain: Control → Policy → Applicability → Guardrail → Enforcement
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
                Integrity Hash: <strong>{feedback.digest}</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* EXECUTIVE SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active Policies</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Operational & Binding</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{reviewRequiredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Observed Gaps in Scope</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Exceptions</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{exceptionsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Formal Accountable Waivers</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Coverage & Enforcement</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">100% Configured</div>
          <div className="text-[11px] text-slate-500 mt-1">88% Observed · Runtime Instrumented</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search policy ID, title, description, owner, or CG-AG control..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Policy Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Policy Types</option>
            <option value="HUMAN_OVERSIGHT">Human Oversight</option>
            <option value="PRIVACY">Privacy & PII</option>
            <option value="ACCESS_TOOL">Access & Tool</option>
            <option value="RUNTIME">Runtime Safety</option>
            <option value="GOVERNANCE">Governance & Registry</option>
            <option value="SECURITY">Security & Audit</option>
          </select>

          {/* Enforcement Mode Filter */}
          <select
            value={filterEnforcement}
            onChange={(e) => setFilterEnforcement(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Enforcement Modes</option>
            <option value="STATIC">Static (CI/CD)</option>
            <option value="RUNTIME">Runtime Gateway</option>
            <option value="HYBRID">Hybrid (Static + Runtime)</option>
            <option value="HUMAN_GATE">Human Gate (HITL)</option>
          </select>

          {/* Control Filter */}
          <select
            value={filterControl}
            onChange={(e) => setFilterControl(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Controls</option>
            <option value="CG-AG-01">CG-AG-01 (Inventory)</option>
            <option value="CG-AG-02">CG-AG-02 (Tool Scoping)</option>
            <option value="CG-AG-03">CG-AG-03 (HITL Oversight)</option>
            <option value="CG-AG-04">CG-AG-04 (Circuit Breakers)</option>
            <option value="CG-AG-06">CG-AG-06 (Privacy & PII)</option>
            <option value="CG-AG-07">CG-AG-07 (Audit Logging)</option>
          </select>
        </div>
      </div>

      {/* PRIMARY POLICY TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Policy ID & Title</th>
                <th className="py-3 px-4">Type / Version</th>
                <th className="py-3 px-4">Accountable Owner</th>
                <th className="py-3 px-4">Applicable Scope</th>
                <th className="py-3 px-4">Supported Controls</th>
                <th className="py-3 px-4">Enforcement Mode</th>
                <th className="py-3 px-4">Status & Gaps</th>
                <th className="py-3 px-4 text-right">Investigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPolicies.map((policy) => {
                const hasGaps = policy.guardrails.some(g => g.enforcementStatus === 'GAP_DETECTED');
                const hasException = policy.exceptions.some(e => e.status === 'ACTIVE');

                const applicability = PolicyStore.evaluateApplicability(policy, {
                  industryId: activeProfile.id,
                  environment
                });

                return (
                  <tr
                    key={policy.id}
                    onClick={() => setSelectedPolicy(policy)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>{policy.title}</span>
                      </div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{policy.id}</div>
                    </td>

                    {/* Type & Version */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {policy.type.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">{policy.currentVersion}</div>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{policy.owner.name}</div>
                      <div className="text-[10px] text-slate-400">{policy.owner.role}</div>
                    </td>

                    {/* Scope */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-xs">{policy.scope}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          applicability.state === 'APPLICABLE' ? 'bg-emerald-500' : (applicability.state === 'EXCEPTION' ? 'bg-purple-500' : 'bg-slate-400')
                        }`} />
                        <span>{applicability.state}</span>
                      </div>
                    </td>

                    {/* Supported Controls */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {policy.applicableControls.map((c) => (
                          <span key={c.controlId} className="font-mono-code font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded text-[10px] border border-sky-200 dark:border-sky-800">
                            {c.controlId}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Enforcement Mode */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{policy.enforcement.mode}</span>
                      <div className="text-[10px] text-slate-400">{policy.enforcement.telemetrySensor}</div>
                    </td>

                    {/* Status & Gaps */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {hasException ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Exception Active
                        </span>
                      ) : (hasGaps ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                          🟡 Review Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          🟢 Active & Enforced
                        </span>
                      ))}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPolicy(policy);
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

      {/* RIGHT-SIDE SLIDE-OVER POLICY DETAIL DRAWER (6 TABS) */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedPolicy.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedPolicy.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono-code font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedPolicy.currentVersion}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedPolicy.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedPolicy.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'applicability', 'controls', 'enforcement', 'exceptions', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'controls' ? 'Controls & Guardrails' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[11px]">Accountable Policy Lead:</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedPolicy.accountableLead.name}</div>
                        <div className="text-[10px] text-slate-400">{selectedPolicy.accountableLead.role}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Author / Custodian:</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedPolicy.owner.name}</div>
                        <div className="text-[10px] text-slate-400">{selectedPolicy.owner.department}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Effective Date:</span>
                        <div className="font-mono-code mt-0.5 text-slate-900 dark:text-slate-100">{selectedPolicy.effectiveFrom}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Mandatory Review Date:</span>
                        <div className="font-mono-code mt-0.5 text-slate-900 dark:text-slate-100">{selectedPolicy.reviewDate}</div>
                      </div>
                    </div>

                    {/* Version History */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-sky-500" />
                        <span>Policy Version History</span>
                      </div>
                      <div className="space-y-2">
                        {selectedPolicy.versionHistory.map((ver) => (
                          <div key={ver.version} className="p-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold font-mono-code text-sky-600 dark:text-sky-400">{ver.version}</span>
                              <span className="text-slate-400">{ver.effectiveDate} · {ver.changedBy}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">{ver.changeSummary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. APPLICABILITY */}
                {activeDrawerTab === 'applicability' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Current Workspace Evaluation</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {activeProfile.name} ({environment})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {PolicyStore.evaluateApplicability(selectedPolicy, { industryId: activeProfile.id, environment }).rationale}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Applicability Matrix Criteria</div>
                      <div className="space-y-2 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400">Industries in Scope:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPolicy.applicabilityCriteria.industries.map(i => (
                              <span key={i} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono-code text-[10px]">
                                {i === '*' ? 'All Enterprise Verticals (*)' : i}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400">AI System Types:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPolicy.applicabilityCriteria.aiSystemTypes.map(st => (
                              <span key={st} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono-code text-[10px]">{st}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400">Autonomy Levels:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedPolicy.applicabilityCriteria.autonomyLevels.map(al => (
                              <span key={al} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px]">{al}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CONTROLS & GUARDRAILS */}
                {activeDrawerTab === 'controls' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Supported CG-AG Controls</div>
                      <div className="space-y-2">
                        {selectedPolicy.applicableControls.map(c => (
                          <div key={c.controlId} className="p-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
                            <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{c.controlId} · {c.controlName}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{c.relationship}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Technical Guardrail Rules</div>
                      <div className="space-y-2">
                        {selectedPolicy.guardrails.map(g => (
                          <div key={g.ruleId} className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{g.ruleTitle}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                g.enforcementStatus === 'GAP_DETECTED' 
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {g.enforcementStatus}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] font-mono-code">{g.specification}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>Configured: {g.configuredState}</span>
                              <span>Observed: {g.observedState}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ENFORCEMENT SEMANTICS */}
                {activeDrawerTab === 'enforcement' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Strict Enforcement Status Distinction</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Configured Coverage:</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{selectedPolicy.enforcement.configuredCoverage}</div>
                        </div>
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Observed Telemetry:</span>
                          <div className="font-bold text-amber-600 dark:text-amber-400">{selectedPolicy.enforcement.observedCoverage}</div>
                        </div>
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Active Enforcement:</span>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedPolicy.enforcement.enforcementCoverage}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Enforcement Mode:</span>
                        <span className="font-bold">{selectedPolicy.enforcement.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Telemetry Sensor:</span>
                        <span className="font-mono-code">{selectedPolicy.enforcement.telemetrySensor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Runtime Instrumented:</span>
                        <span>{selectedPolicy.enforcement.isRuntimeInstrumented ? '✅ Active Instrumentation' : '⚠️ Static Verification Only'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EXCEPTIONS */}
                {activeDrawerTab === 'exceptions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Formal Policy Exceptions & Waivers</span>
                      <button
                        onClick={() => setIsExceptionModalOpen(true)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold shadow-xs transition flex items-center gap-1"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Request Exception</span>
                      </button>
                    </div>

                    {selectedPolicy.exceptions.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
                        No active exceptions recorded. This policy is binding with 0 waivers.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPolicy.exceptions.map(exc => (
                          <div key={exc.exceptionId} className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-purple-900 dark:text-purple-200">{exc.exceptionId}</span>
                              <span className="text-[10px] font-mono-code text-slate-400">Expires: {exc.expiryDate}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-[11px]">{exc.reason}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono-code">
                              <span>Sign-Off: {exc.accountableOwner}</span>
                              <span>Digest: {exc.evidenceDigest}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. EVIDENCE & AUDIT */}
                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Tamper-Evident Evidence & Audit Link</span>
                      </div>
                      <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                        Integrity Hash: {selectedPolicy.evidenceReference}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chained into the Tamper-Evident Audit Ledger. Regulatory Overlays: {selectedPolicy.regulatoryOverlays.join(' · ')}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Policy ID: {selectedPolicy.id}</span>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEPTION REQUEST MODAL */}
      {isExceptionModalOpen && selectedPolicy && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-500" />
                <span>Register Formal Policy Exception</span>
              </h3>
              <button onClick={() => setIsExceptionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordException} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 text-[11px] font-semibold mb-1">Target Policy:</label>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200">
                  {selectedPolicy.id} · {selectedPolicy.title}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-semibold mb-1">Business & Technical Justification:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the business rationale, compensating controls in place, and risk mitigation boundary..."
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[11px] font-semibold mb-1">Accountable Approver:</label>
                  <input
                    type="text"
                    required
                    value={exceptionOwner}
                    onChange={(e) => setExceptionOwner(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[11px] font-semibold mb-1">Expiry / Review Date:</label>
                  <input
                    type="date"
                    required
                    value={exceptionExpiry}
                    onChange={(e) => setExceptionExpiry(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] text-purple-900 dark:text-purple-200">
                ⚠️ Recording a policy exception generates a permanent, cryptographically-hashed audit event in the protected ledger linked to your identity.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExceptionModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Authorize & Sign Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
