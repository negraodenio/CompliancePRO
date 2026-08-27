import React, { useState, useMemo, useEffect } from 'react';
import { 
  LockKeyhole, 
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
  Play,
  FileBadge,
  Check,
  Ban,
  Radio,
  Sliders
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { HitlStore, HITLApprovalRequest, GateStatus } from '../services/hitl-store';

export const HitlApprovalsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [gates, setGates] = useState<HITLApprovalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRiskTier, setFilterRiskTier] = useState<string>('ALL');
  const [selectedGate, setSelectedGate] = useState<HITLApprovalRequest | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'gate' | 'policy' | 'payload' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; gateId: string; digest: string } | null>(null);

  // Form state for live approval/rejection
  const [approvalRationale, setApprovalRationale] = useState('');
  const [approverName, setApproverName] = useState('Roberto Silva');

  const refreshState = () => {
    const list = HitlStore.getGates();
    setGates(list);
    if (selectedGate) {
      const updated = list.find(g => g.gateId === selectedGate.gateId);
      if (updated) setSelectedGate(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return HitlStore.subscribe(refreshState);
  }, []);

  const handleAction = (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedGate || !approvalRationale) return;

    const res = HitlStore.executeHumanApproval(
      selectedGate.gateId,
      decision,
      approvalRationale,
      approverName
    );

    setApprovalRationale('');
    setFeedback({
      message: `Runtime Human Gate [${decision}] executed on ${selectedGate.gateId}. ${res.gate.approvalOutcome?.executionState === 'AUTHORIZATION_GRANTED' ? 'Execution Authorization Granted' : 'Execution Formally Blocked'}.`,
      gateId: res.gate.gateId,
      digest: res.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredGates = useMemo(() => {
    return gates.filter((g) => {
      const matchSearch = g.actionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.gateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.triggerReason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'ALL' || g.status === filterStatus;
      const matchRisk = filterRiskTier === 'ALL' || g.riskTier === filterRiskTier;

      return matchSearch && matchStatus && matchRisk;
    });
  }, [gates, searchTerm, filterStatus, filterRiskTier]);

  const pendingCount = gates.filter(g => g.status === 'PENDING_REVIEW').length;
  const blockedCount = gates.filter(g => g.status === 'REJECTED' || g.status === 'EXPIRED_BLOCKED').length;
  const approvedTodayCount = gates.filter(g => g.status === 'APPROVED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Operate Pillar</span>
            <span>·</span>
            <span>Runtime Human-in-the-Loop Mission Control</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>HITL Approvals & Human Gates</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold font-mono-code">
              {pendingCount} Intercepted Actions
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"Which autonomous agent actions are currently blocked awaiting human authorization before execution?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Interceptor Telemetry Active</span>
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
                Gate ID: <strong>{feedback.gateId}</strong> | Integrity Hash: <strong>{feedback.digest}</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MISSION CONTROL STATS (Strictly consistent with state: 2 Pending, 0 Authorized, 1 Blocked) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pending Human Gates</span>
            <LockKeyhole className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous Actions Intercepted</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Blocked / Terminated</span>
            <Ban className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{blockedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Human Rejections & Interventions</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Authorized Executions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedTodayCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Execution Authorizations Granted</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active Gate Threshold</span>
            <Sliders className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-base font-bold text-sky-600 dark:text-sky-400">Tier-2 High Impact</div>
          <div className="text-[11px] text-slate-500 mt-1">&gt; R$ 50,000 / Batch &gt; 5k</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search gate ID, action title, autonomous agent, system, or trigger reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Gate Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Gate Statuses</option>
            <option value="PENDING_REVIEW">⚠️ Pending Review (Blocked)</option>
            <option value="APPROVED">🟢 Authorized</option>
            <option value="REJECTED">🔴 Rejected / Terminated</option>
          </select>

          {/* Risk Tier Filter */}
          <select
            value={filterRiskTier}
            onChange={(e) => setFilterRiskTier(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">🔴 Critical Tier</option>
            <option value="HIGH">🟠 High Tier</option>
            <option value="MEDIUM">🟡 Medium Tier</option>
          </select>
        </div>
      </div>

      {/* MASTER HUMAN GATES TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Gate ID & Requested Action</th>
                <th className="py-3 px-4">Autonomous Agent</th>
                <th className="py-3 px-4">Trigger Reason / Threshold</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Gate Status</th>
                <th className="py-3 px-4 text-right">Authorize Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredGates.map((gate) => {
                const isPending = gate.status === 'PENDING_REVIEW';
                const isApproved = gate.status === 'APPROVED';
                const isCritical = gate.riskTier === 'CRITICAL';

                return (
                  <tr
                    key={gate.gateId}
                    onClick={() => setSelectedGate(gate)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Gate ID & Action */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <LockKeyhole className={`w-3.5 h-3.5 shrink-0 ${isPending ? 'text-rose-500' : (isApproved ? 'text-emerald-500' : 'text-slate-400')}`} />
                        <span>{gate.actionTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">{gate.gateId} · {gate.requestedActionType}</div>
                    </td>

                    {/* Agent */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{gate.agentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{gate.agentId}</div>
                    </td>

                    {/* Trigger Reason */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 max-w-xs">
                        {gate.triggerReason}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono-code">{gate.thresholdApplied}</div>
                    </td>

                    {/* Risk Tier */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {gate.riskTier}
                      </span>
                    </td>

                    {/* SLA Deadline */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[11px] text-slate-500">
                      {new Date(gate.slaDeadline).toLocaleTimeString()}
                    </td>

                    {/* Gate Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPending
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                          : (isApproved
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : (isApproved ? 'bg-emerald-500' : 'bg-slate-400')}`} />
                        {gate.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGate(gate);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect Gate <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE RUNTIME GATE INVESTIGATION DRAWER */}
      {selectedGate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedGate.gateId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedGate.agentName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {selectedGate.riskTier}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedGate.actionTitle}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Target Method: <code className="font-mono-code text-slate-800 dark:text-slate-200">{selectedGate.requestedActionType}</code>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGate(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'gate', 'policy', 'payload', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'gate' ? 'Live Approval Gate' : (tab === 'payload' ? 'Tool Payload' : tab)}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Autonomous Agent:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{selectedGate.agentName} ({selectedGate.agentId})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parent AI System:</span>
                        <span className="font-semibold">{selectedGate.systemName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trigger Reason:</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{selectedGate.triggerReason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Threshold Boundary:</span>
                        <span className="font-mono-code font-bold">{selectedGate.thresholdApplied}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Execution State:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">BLOCKED (Awaiting Human Authorization)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LIVE APPROVAL GATE */}
                {activeDrawerTab === 'gate' && (
                  <div className="space-y-4">
                    {selectedGate.status === 'PENDING_REVIEW' ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 leading-relaxed text-[11px]">
                          ⚠️ <strong>Action Execution Intercepted:</strong> The agent cannot continue until an authorized human grants or rejects the tool execution request.
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            Mandatory Sign-Off Rationale / Audit Justification:
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Enter the justification for authorizing or rejecting this high-impact action..."
                            value={approvalRationale}
                            onChange={(e) => setApprovalRationale(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAction('APPROVE')}
                            disabled={!approvalRationale.trim()}
                            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Authorize Action Execution</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAction('REJECT')}
                            disabled={!approvalRationale.trim()}
                            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Reject & Terminate Execution</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Human Gate Resolution Executed</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          Outcome: <strong className="text-emerald-600 dark:text-emerald-400">{selectedGate.status}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          Rationale: {selectedGate.approvalOutcome?.rationale}
                        </div>
                        <div className="font-mono-code text-[10px] text-slate-500 pt-1">
                          Signatory: {selectedGate.approvalOutcome?.decidedBy} · Decided At: {selectedGate.approvalOutcome?.decidedAt}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. POLICY & TRIGGER */}
                {activeDrawerTab === 'policy' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Enforced Governance Rule</div>
                      <div className="p-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
                        <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedGate.policyId}</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedGate.policyName}</div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Supported Control:</span>
                        <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedGate.controlId} {selectedGate.controlName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TOOL PAYLOAD */}
                {activeDrawerTab === 'payload' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Intercepted Tool Invocation Payload</div>
                      <pre className="p-3 bg-slate-900 text-slate-200 font-mono-code text-[11px] rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedGate.actionPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 5. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Tamper-Evident Gate Digest</span>
                      </div>
                      <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                        Integrity Hash: {selectedGate.approvalOutcome?.evidenceDigest || 'DIGEST-GATE-PENDING-SIGNATURE'}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Cryptographically recorded upon gate resolution and chained into the audit ledger.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Gate ID: {selectedGate.gateId}</span>
              <button
                onClick={() => setSelectedGate(null)}
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
