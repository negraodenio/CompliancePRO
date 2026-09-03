import React, { useEffect, useState } from 'react';
import { FunnelAnalytics } from '../services/funnel-analytics';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Bot, 
  Cpu, 
  Layers, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  AlertOctagon, 
  Database, 
  Zap, 
  FileBadge, 
  Building2, 
  Scale, 
  FileCheck2,
  KeyRound,
  EyeOff,
  UserCheck,
  ChevronRight,
  Workflow,
  Briefcase,
  Activity,
  FileSearch,
  ExternalLink,
  Fingerprint,
  Code2,
  Server,
  FolderGit2,
  HelpCircle
} from 'lucide-react';
import type { ScannerResult, AgentCapability } from '../../core/types';
import { extractSystemBusinessXRay } from '../services/agent-sipoc-mapper';

interface FreeScanSnapshotViewProps {
  result: ScannerResult;
  onGovernFindings: () => void;
  onExploreGovernanceOs: () => void;
  onResetScan: () => void;
}

export const FreeScanSnapshotView: React.FC<FreeScanSnapshotViewProps> = ({
  result,
  onGovernFindings,
  onExploreGovernanceOs,
  onResetScan,
}) => {
  const agents = result.source?.agents || result.agentClassifications || [];
  const models = result.source?.aiModels || [];
  const capabilities = result.agentCapabilities || [];
  const identities = result.agentIdentities || [];
  const capSummary = result.capabilitiesSummary;
  const violations = result.violations || [];

  const totalUnknownAuth = capSummary?.unknownAuthorizationCount ?? capabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length;
  const averageScore = Math.round(result.compliance?.overallScore ?? 0);

  // Extract Business & Governance X-Ray (Scope decomposition, SIPOC, Impact, Passport Preview)
  const xray = extractSystemBusinessXRay(result);

  const scopeDecomp = xray.scopeDecomposition || {
    productionCount: capabilities.filter(c => c.scope === 'production').length,
    nonProductionCount: capabilities.filter(c => c.scope === 'test' || c.scope === 'example' || c.scope === 'benchmark' || c.scope === 'fixture').length,
    infrastructureCount: capabilities.filter(c => c.scope === 'infrastructure').length,
    unknownCount: capabilities.filter(c => c.scope === 'unknown' || !c.scope).length
  };

  const findingsDecomp = xray.findingsDecomposition || {
    totalTechnicalFindings: violations.length,
    highPriorityGovernanceFindings: scopeDecomp.productionCount,
    productionScopeHighRiskFindings: scopeDecomp.productionCount
  };

  // Sort capabilities: production first -> infrastructure -> example -> benchmark -> test -> unknown
  const sortedCapabilities = [...capabilities].sort((a, b) => {
    const scopePriority = (s?: string) => {
      if (s === 'production') return 1;
      if (s === 'infrastructure') return 2;
      if (s === 'example') return 3;
      if (s === 'benchmark') return 4;
      if (s === 'test' || s === 'fixture') return 5;
      return 6;
    };
    return scopePriority(a.scope) - scopePriority(b.scope);
  });

  useEffect(() => {
    FunnelAnalytics.track('SNAPSHOT_VIEWED', {
      agentsCount: agents.length,
      modelsCount: models.length,
      capabilitiesCount: capabilities.length,
      unknownAuthCount: totalUnknownAuth,
      complianceScore: averageScore
    });
  }, [result]);

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'AUTHORIZED_CAPABILITY':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'DECLARED_CAPABILITY':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'OBSERVED_CAPABILITY':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'USED_CAPABILITY':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'UNKNOWN_AUTHORIZATION':
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  };

  const getScopeBadge = (scope?: string) => {
    switch (scope) {
      case 'production':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
      case 'infrastructure':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'test':
      case 'fixture':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'example':
      case 'benchmark':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800/80 text-slate-500 border-slate-700';
    }
  };

  const getConfidenceBadge = (conf: 'DIRECTLY_DERIVED' | 'INFERRED' | 'NOT_VERIFIED' | 'UNKNOWN') => {
    switch (conf) {
      case 'DIRECTLY_DERIVED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'INFERRED':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'NOT_VERIFIED':
      case 'UNKNOWN':
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-2">

      {/* ========================================================================= */}
      {/* 01. SNAPSHOT (What did we discover?)                                      */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        {/* Compact Integrated Header */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-sky-500/30 text-white shadow-md relative overflow-hidden technical-hatch-footer space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                <span>Real AI Governance Scan Complete</span>
              </div>
              <span className="text-xs font-mono text-slate-300">
                Project: <strong className="text-white">{result.repo?.name || 'Scanned Project'}</strong>
              </span>
            </div>
            <button
              onClick={onResetScan}
              className="text-[11px] text-slate-400 hover:text-white underline transition cursor-pointer font-mono"
            >
              Scan Another Project
            </button>
          </div>

          <div className="space-y-0.5 relative z-10">
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
              01 · AI Governance Snapshot: Ground Truth from Scanned Code
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              Discovered <strong className="text-sky-300">{agents.length} AI components</strong> and <strong className="text-cyan-300">{capabilities.length} operational capabilities</strong>. Below is the exact decomposition across production exposure, non-production supporting findings, and missing governance evidence.
            </p>
          </div>
        </div>

        {/* 6 High-Level Snapshot KPI Cards — Compact & Nested */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">AI Components</span>
              <Bot className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">{agents.length}</p>
            <p className="text-[9px] text-slate-400">Discovered in AST</p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Capabilities</span>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">{capabilities.length}</p>
            <p className="text-[9px] text-slate-400">Total Code Invocations</p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-900/80 border border-emerald-500/30 bg-emerald-950/15 space-y-0.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Production</span>
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">{scopeDecomp.productionCount}</p>
            <p className="text-[9px] text-emerald-400/80">Production Exposure</p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Supporting</span>
              <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-300 font-mono">{scopeDecomp.nonProductionCount + scopeDecomp.infrastructureCount}</p>
            <p className="text-[9px] text-slate-400">Infra, Tests & Demos</p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-900/80 border border-rose-500/20 bg-rose-950/10 space-y-0.5">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Unverified Auth</span>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-rose-400 font-mono">{totalUnknownAuth}</p>
            <p className="text-[9px] text-rose-400/80">No verified auth in scope</p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Compliance</span>
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">{averageScore}%</p>
            <p className="text-[9px] text-slate-400">EU AI Act & LGPD</p>
          </div>
        </div>

        {/* Scope Breakdown Bar & Findings Audit Pill — Compact */}
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Scope:</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <strong>{scopeDecomp.productionCount}</strong> Production
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <strong>{scopeDecomp.nonProductionCount}</strong> Tests/Examples
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <strong>{scopeDecomp.infrastructureCount}</strong> Infra
            </span>
            {scopeDecomp.unknownCount > 0 && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <strong>{scopeDecomp.unknownCount}</strong> Unknown
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-1 md:pt-0 md:pl-3">
            <span><strong>{findingsDecomp.totalTechnicalFindings}</strong> Code Findings</span>
            <span>•</span>
            <span className="text-amber-400 font-bold"><strong>{findingsDecomp.highPriorityGovernanceFindings}</strong> High-Priority</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. BUSINESS PROCESS DISCOVERY (What does this AI do to your business?)  */}
      {/* ========================================================================= */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden technical-hatch-footer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                02 · Business Process Discovery
              </span>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                SIPOC · SCANNED EVIDENCE
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              What does this AI actually do to your business?
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              The scanned code indicates AI participation in software development workflows, data inspection, file operations and task execution.
            </p>
          </div>
          {xray.domainContext && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono shrink-0">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Domain: <strong>{xray.domainContext.domain}</strong></span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200">
                {xray.domainContext.confidence}
              </span>
            </div>
          )}
        </div>

        {/* 4-Stage Visual Data & Decision Chain — Compact */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 relative">
          {xray.stages.map((stage, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2.5 hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    STAGE 0{stage.stageNumber}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getConfidenceBadge(stage.confidence)}`}>
                    {stage.confidence}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{stage.stageName}</h4>
                  <p className="text-[9px] font-mono text-sky-400 uppercase">{stage.technicalSipocRole}</p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="space-y-0.5 pt-1.5 border-t border-slate-800/80">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Discovered Entities:
                </span>
                <ul className="space-y-0.5">
                  {stage.items.map((item, iIdx) => (
                    <li key={iIdx} className="text-[11px] text-slate-200 font-mono truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 03. BUSINESS IMPACT ANALYSIS (What could this AI affect?)                  */}
      {/* ========================================================================= */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 relative overflow-hidden technical-hatch-footer">
        <div className="space-y-0.5 border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
            03 · Business Impact Analysis
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            What business processes and resources could be affected?
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span>Primary Process</span>
            </div>
            <p className="text-xs font-bold text-white">{xray.impact.primaryProcess}</p>
            <p className="text-[10px] text-slate-400">Mapped from agent & tool ASTs.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Resources Affected</span>
            </div>
            <div className="space-y-0.5">
              {xray.impact.resourcesAffected.map((res, rIdx) => (
                <div key={rIdx} className="text-[11px] font-mono text-indigo-300 truncate">
                  • {res}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Potential Actions</span>
            </div>
            <div className="space-y-0.5">
              {xray.impact.potentialBusinessActions.map((act, aIdx) => (
                <div key={aIdx} className="text-[11px] font-mono text-amber-300 truncate">
                  ⚡ {act}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-emerald-500/30 bg-emerald-950/10 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Production Exposure</span>
            </div>
            <p className="text-xs font-bold text-white">{scopeDecomp.productionCount} capabilities identified</p>
            <p className="text-[10px] text-rose-400/90 font-mono">Evidence Not Verified</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04. GOVERNANCE EXPOSURE (What can it do — and what evidence is missing?)   */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        {/* Canonical Invariant Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 relative overflow-hidden technical-hatch-footer">
          <div className="flex items-center space-x-2 text-sky-400">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              04 · Production Exposure & Canonical Governance Invariant
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-white">
            OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            A code import or function call <strong className="text-white">NEVER</strong> constitutes legal or technical authorization. Unless supported by explicit IAM policies, database grants, or OAuth scopes, capabilities remain in state <code className="text-rose-300 font-mono">UNKNOWN_AUTHORIZATION</code>.
          </p>
        </div>

        {/* Capabilities Discovery Matrix */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 relative overflow-hidden technical-hatch-footer">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-sm font-bold text-white">
                Discovered Agent Capabilities & Permission Boundaries
              </h4>
              <p className="text-[11px] text-slate-400">
                Prioritized by scope: Production Exposure → Infrastructure → Non-Production / Supporting Tools
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                {scopeDecomp.productionCount} Production
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                {capabilities.length} Total
              </span>
            </div>
          </div>

          {capabilities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                    <th className="py-2 px-2.5">Scope</th>
                    <th className="py-2 px-2.5">Agent / Origin</th>
                    <th className="py-2 px-2.5">System & Resource</th>
                    <th className="py-2 px-2.5">Action</th>
                    <th className="py-2 px-2.5">Capability State</th>
                    <th className="py-2 px-2.5">Authorization Evidence</th>
                    <th className="py-2 px-2.5">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {sortedCapabilities.slice(0, 10).map((cap, idx) => (
                    <tr key={idx} className={`hover:bg-slate-800/30 transition ${cap.scope === 'production' ? 'bg-emerald-950/5' : ''}`}>
                      <td className="py-2 px-2.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getScopeBadge(cap.scope)}`}>
                          {cap.scope ? cap.scope.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="font-semibold text-sky-300 block text-[11px]">{cap.agentName}</span>
                        <span className="text-[9px] text-slate-500 font-mono truncate max-w-[130px] block">{cap.filePath || 'scanned file'}</span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="text-slate-200 block truncate max-w-[180px] text-[11px]" title={cap.resourceTarget}>
                          {cap.resourceTarget}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">{cap.systemType}</span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          cap.isDestructive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {cap.action}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getStatusBadge(cap.state)}`}>
                          {cap.state}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-slate-400">
                        {cap.authorizationEvidence ? (
                          <span className="text-emerald-400 font-mono text-[9px] truncate max-w-[150px] block">
                            {cap.authorizationEvidence.type} {cap.authorizationEvidence.grantedScope ? `(${cap.authorizationEvidence.grantedScope})` : ''}
                          </span>
                        ) : (
                          <span className="text-rose-400/80 italic text-[9px]">
                            No verified auth in scope
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5">
                        {cap.anomalies && cap.anomalies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cap.anomalies.map((a, aIdx) => (
                              <span key={aIdx} className="px-1 py-0.2 rounded text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[9px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {capabilities.length > 10 && (
                <p className="text-center text-[10px] text-slate-400 pt-2 font-mono">
                  Showing top 10 of {capabilities.length} capabilities. Unlock full inventory in CG-AG Governance OS.
                </p>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 space-y-1">
              <p className="text-xs font-semibold">No capabilities discovered in this scan.</p>
              <p className="text-[10px] text-slate-500">Zero synthetic or mocked capabilities were generated.</p>
            </div>
          )}
        </div>

        {/* Regulatory Relevance */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Potentially Relevant Governance & Regulatory Frameworks</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="font-bold text-white flex items-center justify-between text-xs">
                <span>EU AI Act</span>
                <span className="text-[9px] text-sky-400 font-mono">Art. 9 / 14</span>
              </div>
              <p className="text-slate-400 text-[10px]">Technical risk management, record-keeping, and human oversight (HITL).</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="font-bold text-white flex items-center justify-between text-xs">
                <span>GDPR / LGPD</span>
                <span className="text-[9px] text-emerald-400 font-mono">Art. 20 / 22</span>
              </div>
              <p className="text-slate-400 text-[10px]">Automated data processing, customer profiling, and transparent auditing.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="font-bold text-white flex items-center justify-between text-xs">
                <span>ISO 42001 & NIST AI</span>
                <span className="text-[9px] text-indigo-400 font-mono">Standard</span>
              </div>
              <p className="text-slate-400 text-[10px]">AI management systems, role accountability, and verifiable traceability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05. AGENT PASSPORT PREVIEW (Can you prove who owns and controls it?)      */}
      {/* ========================================================================= */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/30 space-y-3 relative overflow-hidden technical-hatch-footer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                05 · Agent Governance Passport (Preview)
              </span>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PREVIEW · SCANNED EVIDENCE
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Can your organization prove who owns and controls this AI?
            </h3>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
            <span>Formal Passport Teaser</span>
          </div>
        </div>

        {/* Passport Preview Card — Compact */}
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-indigo-500/20 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">AI Asset Name</span>
              <p className="text-sm font-bold text-white font-mono">{xray.passportPreview.aiAsset}</p>
              {!xray.passportPreview.isProductionAsset && (
                <span className="text-[9px] font-mono text-amber-400/90 block">
                  ⚠️ Supporting / repository scope
                </span>
              )}
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Business Process</span>
              <p className="text-xs font-semibold text-sky-300">{xray.passportPreview.businessProcess}</p>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Business Owner</span>
              <p className="text-xs font-bold text-rose-400 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{xray.passportPreview.owner}</span>
              </p>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Identity & Role Binding</span>
              <p className="text-[11px] font-mono text-rose-300 bg-rose-950/30 border border-rose-800/40 px-1.5 py-0.5 rounded inline-block">
                {xray.passportPreview.identityBinding}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-4">
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Autonomy Level</span>
              <p className="text-xs font-mono text-amber-300 font-bold">
                {xray.passportPreview.autonomyLevel}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-md bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Capabilities</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">{xray.passportPreview.capabilitiesCount}</span>
              </div>
              <div className="p-2 rounded-md bg-slate-900/60 border border-slate-800">
                <span className="text-[9px] text-slate-400 block">Unverified Auth</span>
                <span className="text-sm font-bold text-rose-400 font-mono">{xray.passportPreview.unverifiedAuthCount}</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Human Oversight (HITL)</span>
              <p className="text-xs font-mono text-amber-400 font-semibold">
                {xray.passportPreview.verifiedHitl}
              </p>
            </div>
          </div>
        </div>

        {/* Passport CTA Trigger — Compact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-xs font-bold text-white">Issue & Sign Official Passport in Governance OS</h4>
            <p className="text-[11px] text-slate-300">Assign legal business owners, bind IAM roles, enforce approval gates, and issue signed verifiable credentials.</p>
          </div>
          <button
            onClick={onGovernFindings}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Issue Official Passport</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. TECHNICAL EVIDENCE & CRYPTOGRAPHIC PROOF                               */}
      {/* ========================================================================= */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 relative overflow-hidden technical-hatch-footer">
        <div className="space-y-0.5 border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
            06 · Technical Evidence & Cryptographic Proof
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Every business conclusion above is traceable to technical evidence.
          </h3>
          <p className="text-[11px] text-slate-400">
            Static AST code analysis, service account bindings, and privacy-preserving in-memory analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                <span>Execution Identities & Accounts</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                {identities.filter(i => i.identityType !== 'unassigned').length} Bindings
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              {identities.length > 0 
                ? identities.map(i => `${i.agentName}: ${i.identityType} (${i.roleMapped || 'unmapped'})`).join(', ')
                : 'Identity: UNKNOWN (Unassigned service account in scanned scope)'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Secrets & Air-Gapped Privacy</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In-memory browser analysis with redaction of API keys, JWT bearer tokens, connection strings, and passwords.
            </p>
            <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-slate-500">
              <span>✓ In-Memory AST</span>
              <span>✓ RFC 8785</span>
              <span>✓ SHA-256 Tamper Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07. COMMERCIAL CONVERSION CALL TO ACTION                                   */}
      {/* ========================================================================= */}
      <section className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 text-center space-y-3 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-1.5 relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-mono">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Turn Discovery into Governed Assets</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            You now know what your AI may be doing.
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The next question is whether your organization can <strong className="text-white">govern and prove it</strong> to auditors, regulators, and customers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 relative z-10 pt-1">
          <button
            onClick={onGovernFindings}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Turn this discovered AI into a governed asset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExploreGovernanceOs}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
          >
            Explore CG-AG Governance OS
          </button>
        </div>
      </section>

    </div>
  );
};
