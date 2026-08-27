import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Cpu, 
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
  Zap, 
  Clock, 
  Sliders, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building2,
  PieChart,
  Coins,
  Gauge
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { FinOpsStore, FinOpsEntityUsage, FinOpsStatus, FinOpsEnforcementMode } from '../services/finops-store';

export const RuntimeFinOpsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [usageList, setUsageList] = useState<FinOpsEntityUsage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<FinOpsEntityUsage | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'telemetry' | 'quotas' | 'policies' | 'anomalies' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; entityId: string; digest: string } | null>(null);

  // Form state for quota recalibration
  const [newBudget, setNewBudget] = useState<number>(2500);
  const [newQuota, setNewQuota] = useState<number>(20000000);
  const [newMode, setNewMode] = useState<FinOpsEnforcementMode>('RUNTIME_ENFORCED');
  const [quotaRationale, setQuotaRationale] = useState('');

  const refreshState = () => {
    const list = FinOpsStore.getUsage();
    setUsageList(list);
    if (selectedEntity) {
      const updated = list.find(e => e.entityId === selectedEntity.entityId);
      if (updated) {
        setSelectedEntity(updated);
        setNewBudget(updated.monthlyBudgetUSD);
        setNewQuota(updated.tokenQuotaMonthly);
        setNewMode(updated.enforcementMode);
      }
    }
  };

  useEffect(() => {
    refreshState();
    return FinOpsStore.subscribe(refreshState);
  }, []);

  const handleUpdateQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity || !quotaRationale.trim()) return;

    const res = FinOpsStore.updateBudgetAndQuota(
      selectedEntity.entityId,
      newBudget,
      newQuota,
      newMode,
      quotaRationale
    );

    setQuotaRationale('');
    setFeedback({
      message: `FinOps Quota & Budget updated for [${selectedEntity.entityName}]. Enforcement Mode: ${newMode}.`,
      entityId: res.entity.entityId,
      digest: res.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredList = useMemo(() => {
    return usageList.filter((item) => {
      const matchSearch = item.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.primaryModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.assignedSquad.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = filterDepartment === 'ALL' || item.department === filterDepartment;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [usageList, searchTerm, filterDepartment, filterStatus]);

  const totalSpend = usageList.reduce((acc, curr) => acc + curr.currentSpendUSD, 0);
  const totalBudget = usageList.reduce((acc, curr) => acc + curr.monthlyBudgetUSD, 0);
  const totalTokens = usageList.reduce((acc, curr) => acc + curr.totalTokens, 0);
  const throttledCount = usageList.filter(e => e.status === 'THROTTLED' || e.status === 'FALLBACK_ACTIVE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Operate Pillar</span>
            <span>·</span>
            <span>Runtime FinOps, Token Quotas & Cost Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Runtime FinOps & Resource Quotas</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono-code">
              ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${totalBudget.toLocaleString()} MTD
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"How much is AI consuming, who owns the spend, what policy bounds it, and are there active throttles?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-500" />
            <span>Telemetry & Quotas Synchronized</span>
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
                Entity ID: <strong>{feedback.entityId}</strong> | Ledger Hash: <strong>{feedback.digest}</strong>
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
            <span className="font-semibold text-slate-700 dark:text-slate-300">Total AI Spend (MTD)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Allocation: ${totalBudget.toLocaleString()} ({(totalSpend / totalBudget * 100).toFixed(1)}%)</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Token Volume (MTD)</span>
            <Coins className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
            {(totalTokens / 1000000).toFixed(1)}M Tokens
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Prompt: 33.3M · Completion: 9.9M</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active Fallbacks & Throttles</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{throttledCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Safe Fallback & Rate Limits Active</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Average Unit Cost</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${(totalSpend / totalTokens * 1000).toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Blended Effective Cost / 1k Tokens</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity, system, squad, department, or primary model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Risk & Compliance">Risk & Compliance</option>
            <option value="Marketing & Growth">Marketing & Growth</option>
            <option value="Core Engineering">Core Engineering</option>
            <option value="IT & Infrastructure">IT & Infrastructure</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All FinOps States</option>
            <option value="WITHIN_LIMIT">🟢 Within Limit</option>
            <option value="APPROACHING_LIMIT">🟡 Approaching Limit (&gt;75%)</option>
            <option value="FALLBACK_ACTIVE">⚡ Fallback Active</option>
            <option value="THROTTLED">🔴 Throttled</option>
          </select>
        </div>
      </div>

      {/* MASTER FINOPS ALLOCATION & QUOTAS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Entity & AI System</th>
                <th className="py-3 px-4">Department & Squad</th>
                <th className="py-3 px-4">Primary Model</th>
                <th className="py-3 px-4">Spend vs Budget (USD)</th>
                <th className="py-3 px-4">Token Quota Progress</th>
                <th className="py-3 px-4">Enforcement Mode</th>
                <th className="py-3 px-4">FinOps Status</th>
                <th className="py-3 px-4 text-right">Inspect & Govern</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredList.map((item) => {
                const isOver = item.status === 'FALLBACK_ACTIVE' || item.status === 'THROTTLED';
                const isWarn = item.status === 'APPROACHING_LIMIT';
                const spendPct = Math.min(100, Math.round((item.currentSpendUSD / item.monthlyBudgetUSD) * 100));

                return (
                  <tr
                    key={item.entityId}
                    onClick={() => {
                      setSelectedEntity(item);
                      setNewBudget(item.monthlyBudgetUSD);
                      setNewQuota(item.tokenQuotaMonthly);
                      setNewMode(item.enforcementMode);
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Entity & System */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <Activity className={`w-3.5 h-3.5 shrink-0 ${isOver ? 'text-rose-500' : (isWarn ? 'text-amber-500' : 'text-emerald-500')}`} />
                        <span>{item.entityName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-code mt-0.5">{item.entityId} · {item.systemName}</div>
                    </td>

                    {/* Department & Squad */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.department}</div>
                      <div className="text-[10px] text-slate-400">{item.assignedSquad}</div>
                    </td>

                    {/* Primary Model */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code font-bold text-slate-900 dark:text-slate-100">{item.primaryModel}</span>
                      <div className="text-[10px] text-slate-400">{item.modelProvider}</div>
                    </td>

                    {/* Spend vs Budget */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        ${item.currentSpendUSD.toFixed(2)} <span className="text-slate-400 font-normal text-[10px]">/ ${item.monthlyBudgetUSD}</span>
                      </div>
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isOver ? 'bg-rose-500' : (isWarn ? 'bg-amber-500' : 'bg-emerald-500')}`} 
                          style={{ width: `${spendPct}%` }}
                        />
                      </div>
                    </td>

                    {/* Token Quota Progress */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono-code text-[11px] text-slate-800 dark:text-slate-200">
                        {(item.totalTokens / 1000000).toFixed(1)}M / {(item.tokenQuotaMonthly / 1000000).toFixed(0)}M tokens
                      </div>
                      <div className="text-[10px] text-slate-400">{item.totalRequests.toLocaleString()} requests · {item.avgLatencyMs}ms avg</div>
                    </td>

                    {/* Enforcement Mode */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.enforcementMode.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* FinOps Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOver
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                          : (isWarn
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOver ? 'bg-rose-500' : (isWarn ? 'bg-amber-500' : 'bg-emerald-500')}`} />
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntity(item);
                          setNewBudget(item.monthlyBudgetUSD);
                          setNewQuota(item.tokenQuotaMonthly);
                          setNewMode(item.enforcementMode);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect & Govern <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE FINOPS INVESTIGATION & GOVERNANCE DRAWER */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedEntity.entityId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedEntity.department}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {selectedEntity.primaryModel}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedEntity.entityName}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Assigned: {selectedEntity.assignedSquad} · Parent: {selectedEntity.systemName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'telemetry', 'quotas', 'policies', 'anomalies', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'quotas' ? 'Budget & Quota Limits' : (tab === 'policies' ? 'Policy & Enforcement' : tab)}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">FinOps Cost Attribution Hierarchy</div>
                      <div className="space-y-2 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Department:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedEntity.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Engineering Squad:</span>
                          <span>{selectedEntity.assignedSquad}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Governing Policy:</span>
                          <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedEntity.governingPolicyId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Lifecycle Status:</span>
                          <span className="font-bold">{selectedEntity.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TELEMETRY */}
                {activeDrawerTab === 'telemetry' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Observed Token & Request Telemetry</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
                          <span className="text-slate-400">Prompt Tokens:</span>
                          <div className="font-mono-code font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {selectedEntity.promptTokens.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
                          <span className="text-slate-400">Completion Tokens:</span>
                          <div className="font-mono-code font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {selectedEntity.completionTokens.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Invocations:</span>
                          <span className="font-mono-code">{selectedEntity.totalRequests.toLocaleString()} requests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Average Inference Latency:</span>
                          <span className="font-mono-code">{selectedEntity.avgLatencyMs} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unit Cost Rate:</span>
                          <span className="font-mono-code">${selectedEntity.costPerThousandTokens} / 1k tokens</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BUDGETS & QUOTAS FORM */}
                {activeDrawerTab === 'quotas' && (
                  <div className="space-y-4">
                    <form onSubmit={handleUpdateQuota} className="space-y-4">
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-900 dark:text-sky-200 leading-relaxed text-[11px]">
                        ⚙️ <strong>FinOps Quota Governance:</strong> Calibrate monthly budget and token limits. Changes are signed and recorded in the audit ledger.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            Monthly Budget (USD):
                          </label>
                          <input
                            type="number"
                            required
                            value={newBudget}
                            onChange={(e) => setNewBudget(Number(e.target.value))}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            Token Quota (Monthly):
                          </label>
                          <input
                            type="number"
                            required
                            value={newQuota}
                            onChange={(e) => setNewQuota(Number(e.target.value))}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono-code"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Enforcement Gateway Mode:
                        </label>
                        <select
                          value={newMode}
                          onChange={(e) => setNewMode(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                        >
                          <option value="RUNTIME_ENFORCED">🛡️ RUNTIME_ENFORCED (Hard Gateway Throttling)</option>
                          <option value="HYBRID">⚡ HYBRID (Alert at 80%, Soft Fallback at 100%)</option>
                          <option value="STATIC_POLICY">📋 STATIC_POLICY (Budget Cap in Config)</option>
                          <option value="OBSERVED_ONLY">👁️ OBSERVED_ONLY (Telemetry Monitored Only)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Mandatory Re-Calibration Justification:
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="State the business rationale and financial justification for updating these limits..."
                          value={quotaRationale}
                          onChange={(e) => setQuotaRationale(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Sign & Apply FinOps Quota Update</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. POLICIES & ENFORCEMENT */}
                {activeDrawerTab === 'policies' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Enforcement Posture & Anti-Overclaiming Matrix</div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Configured Budget:</span>
                          <span className="font-mono-code font-bold">${selectedEntity.monthlyBudgetUSD}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Observed Usage:</span>
                          <span className="font-mono-code">${selectedEntity.currentSpendUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Active Enforcement Mode:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedEntity.enforcementMode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Supported CG-AG Control:</span>
                          <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedEntity.controlId} {selectedEntity.controlName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. ANOMALIES & CIRCUIT BREAKER LINK */}
                {activeDrawerTab === 'anomalies' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Observed FinOps Anomalies</div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {selectedEntity.anomalyObserved || 'No anomalous cost velocity or token spikes currently detected.'}
                      </p>
                      {selectedEntity.linkedIncidentId && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-amber-800 dark:text-amber-300 font-bold">Linked Runtime Incident:</span>
                            <span className="font-mono-code font-bold text-rose-600 dark:text-rose-400">{selectedEntity.linkedIncidentId}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Automatic circuit breaker active in Incidents & Failsafe Center.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Tamper-Evident FinOps Digest</span>
                      </div>
                      <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                        Integrity Hash: DIGEST-FINOPS-TELEMETRY-{selectedEntity.entityId}-SHA256
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chained into the Protected Audit Ledger upon budget recalibration and monthly closing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Entity: {selectedEntity.entityId}</span>
              <button
                onClick={() => setSelectedEntity(null)}
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
