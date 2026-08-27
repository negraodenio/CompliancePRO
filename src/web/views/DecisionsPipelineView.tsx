import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  Lock, 
  UserCheck, 
  Layers, 
  Bot, 
  FileText, 
  Activity, 
  Clock, 
  CheckSquare, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  ArrowUpRight,
  FileBadge,
  UserCog,
  Check
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { DecisionStore, OperationalFinding } from '../services/decision-store';
import { GovernanceDecision } from '../../core/governance-control-plane';

export const DecisionsPipelineView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [findings, setFindings] = useState<OperationalFinding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecisionType, setFilterDecisionType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<OperationalFinding | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'deliberate' | 'action' | 'accountability' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; decisionId: string; digest: string } | null>(null);

  // Form state for live deliberation
  const [selectedChoice, setSelectedChoice] = useState<'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | 'ESCALATE'>('MITIGATE');
  const [rationale, setRationale] = useState('');
  const [approverName, setApproverName] = useState('Roberto Silva');
  const [approverRole, setApproverRole] = useState('CISO & Accountable Lead');
  const [stakeholderGroup, setStakeholderGroup] = useState<'CISO' | 'DPO' | 'AI_OFFICE' | 'LEGAL' | 'BOARD'>('CISO');

  const refreshState = () => {
    const list = DecisionStore.getFindings();
    setFindings(list);
    if (selectedItem) {
      const updated = list.find(f => f.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return DecisionStore.subscribe(refreshState);
  }, []);

  const handleExecuteDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !rationale) return;

    const res = DecisionStore.recordDecision(
      selectedItem.id,
      selectedChoice,
      { name: approverName, role: approverRole, stakeholderGroup }
    );

    setRationale('');
    setFeedback({
      message: `Formal Governance Decision [${selectedChoice}] registered with Human Accountability.`,
      decisionId: res.decision.decisionId,
      digest: res.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredItems = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch = f.finding.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.riskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.decision && f.decision.decisionId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchChoice = filterDecisionType === 'ALL' || f.decisionType === filterDecisionType;
      const matchSeverity = filterSeverity === 'ALL' || f.severity === filterSeverity;
      const matchStatus = filterStatus === 'ALL' || f.status === filterStatus;

      return matchSearch && matchChoice && matchSeverity && matchStatus;
    });
  }, [findings, searchTerm, filterDecisionType, filterSeverity, filterStatus]);

  const pendingCount = findings.filter(f => f.status === 'PENDING_DECISION').length;
  const mitigateCount = findings.filter(f => f.decisionType === 'MITIGATE').length;
  const acceptCount = findings.filter(f => f.decisionType === 'ACCEPT').length;
  const escalateCount = findings.filter(f => f.decisionType === 'ESCALATE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Operate Pillar</span>
            <span>·</span>
            <span>Human Deliberation & Accountability Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Decisions Pipeline</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold font-mono-code">
              {pendingCount} Pending Sign-Off
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Operationalizes <strong>Risk ≠ Decision ≠ Action</strong>: Every exposure requires an accountable human choice before execution.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code">
            Pipeline: Finding → Risk → Human Decision → Action → Evidence
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
                Decision ID: <strong>{feedback.decisionId}</strong> | Integrity Hash: <strong>{feedback.digest}</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pending Decisions</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting Accountable Deliberation</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Mitigation Decisions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mitigateCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Guardrails & Treatment Assigned</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Accepted Risk Waivers</span>
            <Scale className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{acceptCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Formal Executive Approvals</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Escalated to Board</span>
            <ShieldAlert className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{escalateCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">C-Level Deliberation</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search decision ID, finding, risk ID, control, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Decision Type Filter */}
          <select
            value={filterDecisionType}
            onChange={(e) => setFilterDecisionType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Decision Choices</option>
            <option value="PENDING_DECISION">⚠️ Pending Decision</option>
            <option value="MITIGATE">🛡️ Mitigate</option>
            <option value="ACCEPT">📝 Accept</option>
            <option value="TRANSFER">🔄 Transfer</option>
            <option value="ESCALATE">▲ Escalate</option>
          </select>

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
        </div>
      </div>

      {/* PRIMARY DECISIONS MASTER TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Decision ID & Finding</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Target AI Entity</th>
                <th className="py-3 px-4">CG-AG Control</th>
                <th className="py-3 px-4">Accountable Lead</th>
                <th className="py-3 px-4">Decision Status</th>
                <th className="py-3 px-4">Assigned Treatment</th>
                <th className="py-3 px-4 text-right">Deliberate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map((item) => {
                const isPending = item.status === 'PENDING_DECISION';
                const isCritical = item.severity === 'CRITICAL';
                const isHigh = item.severity === 'HIGH';

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <Scale className={`w-3.5 h-3.5 shrink-0 ${isPending ? 'text-rose-500' : 'text-emerald-500'}`} />
                        <span>{item.decision ? item.decision.decisionId : 'PENDING-DELIBERATION'}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 truncate max-w-xs">{item.finding}</div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{item.id} · {item.riskId}</div>
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
                        {item.severity}
                      </span>
                    </td>

                    {/* Target AI Entity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.agentName || item.systemId}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{item.sourceTarget}</div>
                    </td>

                    {/* CG-AG Control */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {item.controlId}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.controlName}</div>
                    </td>

                    {/* Accountable Lead */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.owner.name}</div>
                      <div className="text-[10px] text-slate-400">{item.owner.role}</div>
                    </td>

                    {/* Decision Choice */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPending
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                          : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        {item.decisionType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Assigned Treatment */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-xs">{item.treatment.actionRequired}</div>
                      <div className="text-[10px] text-slate-400">Assigned: {item.treatment.assignedTo}</div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Deliberate <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE DELIBERATION DRAWER */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedItem.decision ? selectedItem.decision.decisionId : selectedItem.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedItem.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {selectedItem.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedItem.finding}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Target: {selectedItem.sourceTarget} · Control: {selectedItem.controlId} {selectedItem.controlName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'deliberate', 'action', 'accountability', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'deliberate' ? 'Human Deliberation Gate' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Causal Exposure & Decision Pipeline</div>
                      <div className="space-y-2 text-slate-700 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Finding Reference:</span>
                          <span className="font-mono-code font-bold text-slate-900 dark:text-slate-100">{selectedItem.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Calculated Risk ID:</span>
                          <span className="font-mono-code font-bold text-rose-600 dark:text-rose-400">{selectedItem.riskId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Governance Control:</span>
                          <span className="font-semibold text-sky-600 dark:text-sky-400">{selectedItem.controlId} · {selectedItem.controlName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Decision Status:</span>
                          <span className="font-bold">{selectedItem.decisionType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Recommended Governance Response</div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {selectedItem.recommendedAction}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. DELIBERATE GATE */}
                {activeDrawerTab === 'deliberate' && (
                  <div className="space-y-4">
                    {selectedItem.status === 'PENDING_DECISION' ? (
                      <form onSubmit={handleExecuteDecision} className="space-y-4">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                            1. Select Accountable Decision Choice:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedChoice('MITIGATE')}
                              className={`p-3 rounded-lg border text-left transition ${
                                selectedChoice === 'MITIGATE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold'
                                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>🛡️ 1. MITIGATE</span>
                                {selectedChoice === 'MITIGATE' && <Check className="w-4 h-4 text-emerald-500" />}
                              </div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5">Enforce guardrails & assign technical action.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedChoice('ACCEPT')}
                              className={`p-3 rounded-lg border text-left transition ${
                                selectedChoice === 'ACCEPT'
                                  ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-900 dark:text-sky-100 font-bold'
                                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>📝 2. ACCEPT</span>
                                {selectedChoice === 'ACCEPT' && <Check className="w-4 h-4 text-sky-500" />}
                              </div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5">Formally accept risk with accountable sign-off.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedChoice('TRANSFER')}
                              className={`p-3 rounded-lg border text-left transition ${
                                selectedChoice === 'TRANSFER'
                                  ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-900 dark:text-blue-100 font-bold'
                                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>🔄 3. TRANSFER</span>
                                {selectedChoice === 'TRANSFER' && <Check className="w-4 h-4 text-blue-500" />}
                              </div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5">Transfer liability via SLA / Insurance.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedChoice('ESCALATE')}
                              className={`p-3 rounded-lg border text-left transition ${
                                selectedChoice === 'ESCALATE'
                                  ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-100 font-bold'
                                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>▲ 4. ESCALATE</span>
                                {selectedChoice === 'ESCALATE' && <Check className="w-4 h-4 text-rose-500" />}
                              </div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5">Escalate to C-Level / Board of Directors.</p>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            2. Mandatory Decision Rationale & Justification:
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="State the formal justification, risk acceptance boundaries, and technical rationale..."
                            value={rationale}
                            onChange={(e) => setRationale(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-500 text-[11px] font-semibold mb-1">Accountable Approver:</label>
                            <input
                              type="text"
                              required
                              value={approverName}
                              onChange={(e) => setApproverName(e.target.value)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 text-[11px] font-semibold mb-1">Stakeholder Body:</label>
                            <select
                              value={stakeholderGroup}
                              onChange={(e) => setStakeholderGroup(e.target.value as any)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                            >
                              <option value="CISO">CISO / AppSec</option>
                              <option value="DPO">DPO / Privacy Office</option>
                              <option value="AI_OFFICE">AI Governance Office</option>
                              <option value="LEGAL">Legal & Regulatory</option>
                              <option value="BOARD">Board of Directors</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Execute & Sign Governance Decision</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Formal Governance Decision Executed</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          Decision Choice: <strong className="text-emerald-600 dark:text-emerald-400">{selectedItem.decisionType}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Rationale: {selectedItem.decision?.rationale || 'Decision formally executed in Governance OS.'}
                        </div>
                        <div className="font-mono-code text-[10px] text-slate-500 pt-1">
                          Decision ID: {selectedItem.decision?.decisionId} · Decided At: {selectedItem.decision?.decidedAt}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ACTION PLAN */}
                {activeDrawerTab === 'action' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Remediation & Treatment Action Plan</div>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Assigned Action Item:</span>
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg mt-1 font-semibold text-slate-900 dark:text-slate-100">
                          {selectedItem.treatment.actionRequired}
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Assigned Technical Squad:</span>
                        <span className="font-semibold">{selectedItem.treatment.assignedTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target SLA Due Date:</span>
                        <span className="font-mono-code font-bold text-slate-900 dark:text-slate-100">{selectedItem.treatment.targetDueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Action Lifecycle Status:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{selectedItem.treatment.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ACCOUNTABILITY */}
                {activeDrawerTab === 'accountability' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCog className="w-4 h-4 text-sky-500" />
                      <span>Accountable Approver Profile</span>
                    </div>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lead Signatory:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedItem.owner.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Organizational Role:</span>
                        <span>{selectedItem.owner.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Department:</span>
                        <span>{selectedItem.owner.department}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Digest & Audit Ledger Reference</span>
                    </div>
                    <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      Integrity Hash: {selectedItem.evidenceDigest}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Chained into the Protected Audit Ledger upon decision execution.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Decision Ref: {selectedItem.decision?.decisionId || selectedItem.id}</span>
              <button
                onClick={() => setSelectedItem(null)}
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
