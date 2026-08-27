import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, 
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
  GitPullRequest,
  Check,
  FileCheck2,
  Users,
  Timer
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { RemediationStore, RemediationAction, RemediationStatus } from '../services/remediation-store';

export const RemediationActionsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<RemediationAction | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'technical' | 'verification' | 'squad' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; actionId: string; digest: string } | null>(null);

  // Form state for verification gate
  const [closureRationale, setClosureRationale] = useState('');
  const [testOutcome, setTestOutcome] = useState('Automated test suite re-scan passed with zero compliance violations.');
  const [verifiedByName, setVerifiedByName] = useState('Roberto Silva (CISO & Accountable Lead)');

  const refreshState = () => {
    const list = RemediationStore.getActions();
    setActions(list);
    if (selectedAction) {
      const updated = list.find(a => a.actionId === selectedAction.actionId);
      if (updated) setSelectedAction(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return RemediationStore.subscribe(refreshState);
  }, []);

  const handleVerifyClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !closureRationale.trim()) return;

    const res = RemediationStore.verifyAndCloseAction(
      selectedAction.actionId,
      closureRationale,
      testOutcome,
      verifiedByName
    );

    setClosureRationale('');
    setFeedback({
      message: `Remediation Action [${selectedAction.actionId}] verified and formally CLOSED with audit evidence.`,
      actionId: res.action.actionId,
      digest: res.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.actionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.riskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.assignedSquad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.assignedLead.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.controlId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
      const matchSeverity = filterSeverity === 'ALL' || a.severity === filterSeverity;

      return matchSearch && matchStatus && matchSeverity;
    });
  }, [actions, searchTerm, filterStatus, filterSeverity]);

  const openCount = actions.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;
  const pendingVerifCount = actions.filter(a => a.status === 'PENDING_VERIFICATION').length;
  const overdueCount = actions.filter(a => a.status === 'OVERDUE').length;
  const closedCount = actions.filter(a => a.status === 'VERIFIED_CLOSED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Operate Pillar</span>
            <span>·</span>
            <span>Technical Remediation & Governance Loop Closure</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Remediation Actions</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold font-mono-code">
              {pendingVerifCount} Pending Verification
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"What must be changed, who owns it, by when, and how do we verify the remediation resolved the risk?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code">
            Cycle: Decision → Action → Squad SLA → Verification → Closed
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
                Action ID: <strong>{feedback.actionId}</strong> | Ledger Hash: <strong>{feedback.digest}</strong>
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
            <span className="font-semibold text-slate-700 dark:text-slate-300">In Progress Actions</span>
            <Wrench className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{openCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Assigned to Technical Squads</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pending Verification</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingVerifCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Fix Deployed · Awaiting Audit Gate</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Overdue SLA</span>
            <Timer className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-300">{overdueCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero Breach of Remediation SLA</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Verified & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{closedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Control Verified Effective</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search action ID, title, risk ID, squad, lead, or control..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">🔵 In Progress</option>
            <option value="PENDING_VERIFICATION">🟡 Pending Verification</option>
            <option value="OPEN">⚪ Open</option>
            <option value="VERIFIED_CLOSED">🟢 Verified & Closed</option>
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
          </select>
        </div>
      </div>

      {/* MASTER REMEDIATION ACTIONS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Action ID & Remediation Scope</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Causal Origin (Risk & Decision)</th>
                <th className="py-3 px-4">Target AI Entity</th>
                <th className="py-3 px-4">Assigned Squad & Lead</th>
                <th className="py-3 px-4">SLA Due Date</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Inspect & Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredActions.map((action) => {
                const isPendingVerif = action.status === 'PENDING_VERIFICATION';
                const isClosed = action.status === 'VERIFIED_CLOSED';
                const isCritical = action.severity === 'CRITICAL';

                return (
                  <tr
                    key={action.actionId}
                    onClick={() => setSelectedAction(action)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Action ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <Wrench className={`w-3.5 h-3.5 shrink-0 ${isClosed ? 'text-emerald-500' : (isPendingVerif ? 'text-amber-500' : 'text-sky-500')}`} />
                        <span>{action.actionId}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 max-w-sm">{action.title}</div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{action.controlId} {action.controlName}</div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {action.severity}
                      </span>
                    </td>

                    {/* Causal Origin */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono-code text-slate-800 dark:text-slate-200 font-bold">{action.riskId}</div>
                      <div className="font-mono-code text-[10px] text-slate-400">{action.decisionId} · {action.findingId}</div>
                    </td>

                    {/* Target AI Entity */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{action.affectedEntity}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{action.targetRepository}</div>
                    </td>

                    {/* Assigned Squad & Lead */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{action.assignedSquad}</div>
                      <div className="text-[10px] text-slate-400">{action.assignedLead}</div>
                    </td>

                    {/* SLA Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[11px] text-slate-500">
                      {new Date(action.dueDate).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPendingVerif
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                          : (isClosed
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : (isPendingVerif ? 'bg-amber-500' : 'bg-sky-500')}`} />
                        {action.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAction(action);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect & Verify <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE REMEDIATION DRAWER */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedAction.actionId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedAction.assignedSquad}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {selectedAction.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedAction.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Target: {selectedAction.affectedEntity} · Control: {selectedAction.controlId} {selectedAction.controlName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'technical', 'verification', 'squad', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'verification' ? 'Verification Gate' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Causal Traceability Pipeline</div>
                      <div className="space-y-2 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Originating Finding:</span>
                          <span className="font-mono-code font-bold">{selectedAction.findingId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Risk Exposure:</span>
                          <span className="font-mono-code font-bold text-rose-600 dark:text-rose-400">{selectedAction.riskId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Governance Decision:</span>
                          <span className="font-mono-code font-bold text-emerald-600 dark:text-emerald-400">{selectedAction.decisionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Governed Control:</span>
                          <span className="font-semibold text-sky-600 dark:text-sky-400">{selectedAction.controlId} {selectedAction.controlName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Verification Protocol:</span>
                          <span className="font-mono-code">{selectedAction.verificationMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TECHNICAL SCOPE */}
                {activeDrawerTab === 'technical' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Technical Scope & Implementation Instructions</div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {selectedAction.technicalScope}
                      </p>
                      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Repository:</span>
                          <code className="font-mono-code text-slate-900 dark:text-slate-100">{selectedAction.targetRepository}</code>
                        </div>
                        {selectedAction.pullRequestRef && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Linked Pull Request:</span>
                            <span className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                              <GitPullRequest className="w-3.5 h-3.5" />
                              {selectedAction.pullRequestRef}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. VERIFICATION GATE */}
                {activeDrawerTab === 'verification' && (
                  <div className="space-y-4">
                    {selectedAction.status !== 'VERIFIED_CLOSED' ? (
                      <form onSubmit={handleVerifyClosure} className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 leading-relaxed text-[11px]">
                          🛡️ <strong>Governance Verification Requirement:</strong> A remediation action cannot be marked as closed without formal verification that the control is functioning effectively.
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            1. Verification Test Outcome / Automated Scan Result:
                          </label>
                          <input
                            type="text"
                            required
                            value={testOutcome}
                            onChange={(e) => setTestOutcome(e.target.value)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            2. Mandatory Closure Rationale & Effectiveness Proof:
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="State how the implementation was verified and why the underlying risk is resolved..."
                            value={closureRationale}
                            onChange={(e) => setClosureRationale(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 text-[11px] font-semibold mb-1">Verifying Lead / Auditor:</label>
                          <input
                            type="text"
                            required
                            value={verifiedByName}
                            onChange={(e) => setVerifiedByName(e.target.value)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Formally Close Remediation Action</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Remediation Verified & Formally Closed</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          Verification Outcome: <strong>{selectedAction.verificationDetails?.testOutcome}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          Closure Rationale: {selectedAction.verificationDetails?.closureRationale}
                        </div>
                        <div className="font-mono-code text-[10px] text-slate-500 pt-1">
                          Verified By: {selectedAction.verificationDetails?.verifiedBy} · Verified At: {selectedAction.verificationDetails?.verifiedAt}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SQUAD ACCOUNTABILITY */}
                {activeDrawerTab === 'squad' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-slate-700 dark:text-slate-300">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-500" />
                      <span>Assigned Engineering Squad</span>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Engineering Squad:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedAction.assignedSquad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lead Engineer:</span>
                        <span>{selectedAction.assignedLead} ({selectedAction.leadRole})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SLA Window:</span>
                        <span className="font-mono-code">{selectedAction.slaDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Due Date:</span>
                        <span className="font-mono-code font-bold text-slate-900 dark:text-slate-100">{new Date(selectedAction.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Closure Digest</span>
                    </div>
                    <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      Integrity Hash: {selectedAction.verificationDetails?.evidenceDigest || 'DIGEST-ACTION-OPEN-NO-CLOSURE-SIGNATURE'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Chained into the Protected Audit Ledger upon formal verification and closure.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Action Ref: {selectedAction.actionId}</span>
              <button
                onClick={() => setSelectedAction(null)}
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
