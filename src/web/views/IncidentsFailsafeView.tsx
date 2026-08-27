import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, 
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
  Radio,
  PowerOff,
  RefreshCw,
  Sliders,
  Flame,
  ShieldX
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { IncidentStore, AIIncident, ContainmentStatus, CircuitBreakerAction } from '../services/incident-store';

export const IncidentsFailsafeView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [incidents, setIncidents] = useState<AIIncident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<AIIncident | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'signal' | 'circuit' | 'investigation' | 'recovery' | 'evidence'>('overview');
  const [feedback, setFeedback] = useState<{ message: string; incidentId: string; digest: string } | null>(null);

  // Form state for recovery gate
  const [recoveryRationale, setRecoveryRationale] = useState('');
  const [approvedByName, setApprovedByName] = useState('Roberto Silva (CISO & Accountable Lead)');

  const refreshState = () => {
    const list = IncidentStore.getIncidents();
    setIncidents(list);
    if (selectedIncident) {
      const updated = list.find(i => i.incidentId === selectedIncident.incidentId);
      if (updated) setSelectedIncident(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return IncidentStore.subscribe(refreshState);
  }, []);

  const handleAuthorizeRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !recoveryRationale.trim()) return;

    const res = IncidentStore.authorizeSystemRecovery(
      selectedIncident.incidentId,
      recoveryRationale,
      approvedByName
    );

    setRecoveryRationale('');
    setFeedback({
      message: `System Recovery Authorized for [${selectedIncident.affectedEntity}]. Incident [${selectedIncident.incidentId}] formally resolved.`,
      incidentId: res.incident.incidentId,
      digest: res.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const matchSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.incidentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.affectedEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.triggerSignal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.circuitBreaker.ruleName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'ALL' || i.containmentStatus === filterStatus;
      const matchSeverity = filterSeverity === 'ALL' || i.severity === filterSeverity;

      return matchSearch && matchStatus && matchSeverity;
    });
  }, [incidents, searchTerm, filterStatus, filterSeverity]);

  const activeIncidentsCount = incidents.filter(i => i.containmentStatus !== 'RECOVERED' && i.containmentStatus !== 'TERMINATED').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.containmentStatus !== 'RECOVERED').length;
  const containedCount = incidents.filter(i => i.containmentStatus === 'CONTAINED' || i.containmentStatus === 'RECOVERY_PENDING').length;
  const recoveredCount = incidents.filter(i => i.containmentStatus === 'RECOVERED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Operate Pillar</span>
            <span>·</span>
            <span>AI Incident Response, Failsafes & Circuit Breakers</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Incidents & Circuit Breakers</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold font-mono-code">
              {containedCount} Systems Contained
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"What happened, what was the AI doing, what containment mechanism tripped, and is it safe to resume?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Circuit Breakers Armed</span>
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
                Incident ID: <strong>{feedback.incidentId}</strong> | Ledger Hash: <strong>{feedback.digest}</strong>
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
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active Incidents</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{activeIncidentsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Under Active Containment / Triage</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Contained AI Systems</span>
            <ShieldX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{containedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Failsafe / Safe Fallback Active</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Critical Incidents</span>
            <AlertTriangle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Hard Kill-Switch Executed</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Recovered / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{recoveredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Safe Resumption Verified</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident ID, title, affected entity, signal, or circuit breaker rule..."
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
            <option value="ALL">All Containment States</option>
            <option value="CONTAINED">🔴 Contained (Hard Kill)</option>
            <option value="RECOVERY_PENDING">🟡 Recovery Pending</option>
            <option value="INVESTIGATING">🔵 Investigating</option>
            <option value="RECOVERED">🟢 Recovered / Normal</option>
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

      {/* MASTER INCIDENTS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Incident ID & Title</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected AI Entity</th>
                <th className="py-3 px-4">Trigger Signal & Metric</th>
                <th className="py-3 px-4">Circuit Breaker Action</th>
                <th className="py-3 px-4">Containment State</th>
                <th className="py-3 px-4 text-right">Investigate & Failsafe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredIncidents.map((inc) => {
                const isContained = inc.containmentStatus === 'CONTAINED' || inc.containmentStatus === 'RECOVERY_PENDING';
                const isRecovered = inc.containmentStatus === 'RECOVERED';
                const isCritical = inc.severity === 'CRITICAL';

                return (
                  <tr
                    key={inc.incidentId}
                    onClick={() => setSelectedIncident(inc)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <Zap className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'text-rose-500' : 'text-amber-500'}`} />
                        <span>{inc.incidentId}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 max-w-xs">{inc.title}</div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{new Date(inc.timestamp).toLocaleTimeString()} · {inc.incidentType}</div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>

                    {/* Affected AI Entity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{inc.affectedEntity}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{inc.systemName}</div>
                    </td>

                    {/* Trigger Signal */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 max-w-xs">
                        {inc.triggerSignal}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono-code">{inc.observedMetric}</div>
                    </td>

                    {/* Circuit Breaker */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        {inc.circuitBreaker.actionTaken}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">{inc.circuitBreaker.ruleName}</div>
                    </td>

                    {/* Containment State */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isContained
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                          : (isRecovered
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isContained ? 'bg-rose-500' : (isRecovered ? 'bg-emerald-500' : 'bg-amber-500')}`} />
                        {inc.containmentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
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

      {/* RIGHT-SIDE INCIDENT INVESTIGATION & FAILSAFE DRAWER */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      {selectedIncident.incidentId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedIncident.affectedEntity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {selectedIncident.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedIncident.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Parent System: {selectedIncident.systemName} · Control: {selectedIncident.controlId} {selectedIncident.controlName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'signal', 'circuit', 'investigation', 'recovery', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'circuit' ? 'Circuit Breaker' : (tab === 'recovery' ? 'Safe Recovery Gate' : tab)}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Incident Event Metadata</div>
                      <div className="space-y-2 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Incident Type:</span>
                          <span className="font-mono-code font-bold">{selectedIncident.incidentType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Detection Timestamp:</span>
                          <span className="font-mono-code">{new Date(selectedIncident.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Governing Control:</span>
                          <span className="font-semibold text-sky-600 dark:text-sky-400">{selectedIncident.controlId} {selectedIncident.controlName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Containment:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">{selectedIncident.containmentStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RUNTIME SIGNAL TELEMETRY */}
                {activeDrawerTab === 'signal' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Observed Runtime Signal & Anomaly Vector</div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {selectedIncident.triggerSignal}
                      </p>
                      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Observed Telemetry Metric:</span>
                          <code className="font-mono-code font-bold text-rose-600 dark:text-rose-400">{selectedIncident.observedMetric}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Threshold Breached:</span>
                          <span className="font-mono-code text-slate-700 dark:text-slate-300">{selectedIncident.thresholdBreached}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CIRCUIT BREAKER ACTUATOR */}
                {activeDrawerTab === 'circuit' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <PowerOff className="w-4 h-4 text-rose-500" />
                        <span>Tripped Circuit Breaker Configuration</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rule Triggered:</span>
                          <span className="font-mono-code font-bold">{selectedIncident.circuitBreaker.ruleName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Containment Action:</span>
                          <span className="font-mono-code font-bold text-rose-600 dark:text-rose-400">{selectedIncident.circuitBreaker.actionTaken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tripped Timestamp:</span>
                          <span className="font-mono-code">{new Date(selectedIncident.circuitBreaker.triggeredAt).toLocaleTimeString()}</span>
                        </div>
                        {selectedIncident.circuitBreaker.fallbackRoute && (
                          <div className="pt-1">
                            <span className="text-slate-400">Safe Fallback Destination:</span>
                            <div className="p-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded font-mono-code text-slate-800 dark:text-slate-200 mt-1">
                              {selectedIncident.circuitBreaker.fallbackRoute}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. INVESTIGATION & ROOT CAUSE */}
                {activeDrawerTab === 'investigation' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Root Cause Analysis</div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {selectedIncident.investigation?.rootCause || 'Under active root cause investigation by AppSec & AI Team.'}
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Investigator:</span>
                          <span className="font-semibold">{selectedIncident.investigation?.investigator} ({selectedIncident.investigation?.role})</span>
                        </div>
                        {selectedIncident.investigation?.linkedRemediationId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Linked Remediation Action:</span>
                            <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedIncident.investigation.linkedRemediationId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SAFE RECOVERY GATE */}
                {activeDrawerTab === 'recovery' && (
                  <div className="space-y-4">
                    {selectedIncident.containmentStatus !== 'RECOVERED' ? (
                      <form onSubmit={handleAuthorizeRecovery} className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 leading-relaxed text-[11px]">
                          🛡️ <strong>Safety Resume Verification:</strong> Authorizing system resumption unfreezes the circuit breaker and allows the autonomous agent or pipeline to resume normal operations.
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                            1. Safety Resumption Rationale & Root Cause Verification:
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="State how root cause was mitigated and verify that it is safe to unfreeze the agent/system..."
                            value={recoveryRationale}
                            onChange={(e) => setRecoveryRationale(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 text-[11px] font-semibold mb-1">Authorizing Approver:</label>
                          <input
                            type="text"
                            required
                            value={approvedByName}
                            onChange={(e) => setApprovedByName(e.target.value)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Verify Safety & Authorize System Resume</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>System Formally Recovered & Returned to Service</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          Resumption Rationale: {selectedIncident.investigation?.recoveryRationale}
                        </div>
                        <div className="font-mono-code text-[10px] text-slate-500 pt-1">
                          Approved By: {selectedIncident.investigation?.resumeApprovedBy} · Resumed At: {selectedIncident.investigation?.resumedAt}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Tamper-Evident Incident Digest</span>
                      </div>
                      <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                        Integrity Hash: {selectedIncident.investigation?.evidenceDigest || 'DIGEST-INCIDENT-NO-SIGNATURE'}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chained into the Protected Audit Ledger upon containment and safe recovery.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Incident Ref: {selectedIncident.incidentId}</span>
              <button
                onClick={() => setSelectedIncident(null)}
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
