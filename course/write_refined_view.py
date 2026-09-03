import os

view_content = '''import React, { useEffect, useState } from 'react';
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
    <div className="space-y-12 animate-fadeIn pb-12">

      {/* ========================================================================= */}
      {/* 01. SNAPSHOT (What did we discover?)                                      */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        {/* Top Banner / Headline */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-sky-500/30 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>Real AI Governance Scan Complete</span>
              </div>
              <button
                onClick={onResetScan}
                className="text-xs text-slate-400 hover:text-white underline transition cursor-pointer"
              >
                Scan Another Project
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-sky-400 tracking-widest uppercase">
                01 · AI Governance Snapshot
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Discover what your AI code exposes — before you deploy, govern or audit it.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
                Technical Ground Truth from <strong className="text-white">{result.repo?.name || 'Scanned Project'}</strong>: We discovered <strong className="text-sky-300">{agents.length} AI components</strong> and <strong className="text-cyan-300">{capabilities.length} operational capabilities</strong> in your scanned code.
                Below is the exact decomposition across production exposure, non-production supporting findings, and missing governance evidence.
              </p>
            </div>
          </div>
        </div>

        {/* 6 High-Level Snapshot KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">AI Components</span>
              <Bot className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{agents.length}</p>
            <p className="text-[10px] text-slate-400">Discovered in AST</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Capabilities</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{capabilities.length}</p>
            <p className="text-[10px] text-slate-400">Total Code Invocations</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 bg-emerald-950/15 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Production</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{scopeDecomp.productionCount}</p>
            <p className="text-[10px] text-emerald-400/80">Production Exposure</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Supporting</span>
              <FolderGit2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-300 font-mono">{scopeDecomp.nonProductionCount + scopeDecomp.infrastructureCount}</p>
            <p className="text-[10px] text-slate-400">Infra, Tests & Demos</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 bg-rose-950/10 space-y-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Unverified Auth</span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400 font-mono">
              {totalUnknownAuth}
            </p>
            <p className="text-[10px] text-rose-400/80">No verified auth in scope</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Compliance</span>
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{averageScore}%</p>
            <p className="text-[10px] text-slate-400">EU AI Act & LGPD</p>
          </div>
        </div>

        {/* Scope Breakdown Bar & Findings Audit Pill */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Scope Decomposition:</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong>{scopeDecomp.productionCount}</strong> Production Exposure
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong>{scopeDecomp.nonProductionCount}</strong> Test / Example / Benchmark
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <strong>{scopeDecomp.infrastructureCount}</strong> Infrastructure & Migrations
            </span>
            {scopeDecomp.unknownCount > 0 && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <strong>{scopeDecomp.unknownCount}</strong> Unknown Scope
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
            <span><strong>{findingsDecomp.totalTechnicalFindings}</strong> Technical Code Findings</span>
            <span>•</span>
            <span className="text-amber-400 font-bold"><strong>{findingsDecomp.highPriorityGovernanceFindings}</strong> High-Priority Governance Findings</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. BUSINESS PROCESS DISCOVERY (What does this AI do to your business?)  */}
      {/* ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                02 · Business Process Discovery
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                SIPOC · DERIVED FROM SCANNED EVIDENCE
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              What does this AI actually do to your business?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
              The scanned code indicates that AI components participate in software development workflows, including data inspection, file operations and automated task execution.
            </p>
          </div>
          {xray.domainContext && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inferred Domain: <strong>{xray.domainContext.domain}</strong></span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200">
                Confidence: {xray.domainContext.confidence}
              </span>
            </div>
          )}
        </div>

        {/* 4-Stage Visual Data & Decision Chain */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {xray.stages.map((stage, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    STAGE 0{stage.stageNumber}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getConfidenceBadge(stage.confidence)}`}>
                    {stage.confidence}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{stage.stageName}</h4>
                  <p className="text-[10px] font-mono text-sky-400 uppercase">{stage.technicalSipocRole}</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Discovered Entities:
                </span>
                <ul className="space-y-1">
                  {stage.items.map((item, iIdx) => (
                    <li key={iIdx} className="text-xs text-slate-200 font-mono truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
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
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        <div className="space-y-1 border-b border-slate-800 pb-4">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
            03 · Business Impact Analysis
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            What business processes and resources could be affected?
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-sky-400" />
              <span>Primary Business Process</span>
            </div>
            <p className="text-sm font-bold text-white">{xray.impact.primaryProcess}</p>
            <p className="text-[11px] text-slate-400">Core operational responsibility mapped from agent and tool ASTs.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Resources Affected</span>
            </div>
            <div className="space-y-1">
              {xray.impact.resourcesAffected.map((res, rIdx) => (
                <div key={rIdx} className="text-xs font-mono text-indigo-300 truncate">
                  • {res}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Potential Business Actions</span>
            </div>
            <div className="space-y-1">
              {xray.impact.potentialBusinessActions.map((act, aIdx) => (
                <div key={aIdx} className="text-xs font-mono text-amber-300 truncate">
                  ⚡ {act}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 bg-emerald-950/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Production Exposure</span>
            </div>
            <p className="text-sm font-bold text-white">{scopeDecomp.productionCount} capabilities identified in production code</p>
            <p className="text-[11px] text-rose-400/90 font-mono">Governance: Evidence Not Verified in Scanned Scope</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04. GOVERNANCE EXPOSURE (What can it do — and what evidence is missing?)   */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        {/* Canonical Invariant Banner */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center space-x-2 text-sky-400">
            <Shield className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              04 · Production Exposure & Canonical Governance Invariant
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
            Your code reveals declared and coded capabilities (e.g. tool definitions, database operations, cloud storage actions, shell executions). A code import or function call <strong className="text-white">NEVER</strong> constitutes legal or technical authorization. Unless supported by explicit IAM policies, database grants, or OAuth scopes, capabilities remain in state <code className="text-rose-300 font-mono">UNKNOWN_AUTHORIZATION</code>.
          </p>
        </div>

        {/* Capabilities Discovery Matrix (Ordered by Production Exposure) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white">
                Discovered Agent Capabilities & Permission Boundaries
              </h4>
              <p className="text-xs text-slate-400">
                Prioritized by operational scope: Production Exposure → Infrastructure → Non-Production / Supporting Tools
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {scopeDecomp.productionCount} Production
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {capabilities.length} Total
              </span>
            </div>
          </div>

          {capabilities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3">Agent / Origin</th>
                    <th className="py-2.5 px-3">System & Resource</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Capability State</th>
                    <th className="py-2.5 px-3">Authorization Evidence</th>
                    <th className="py-2.5 px-3">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {sortedCapabilities.slice(0, 10).map((cap, idx) => (
                    <tr key={idx} className={`hover:bg-slate-800/30 transition ${cap.scope === 'production' ? 'bg-emerald-950/5' : ''}`}>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${getScopeBadge(cap.scope)}`}>
                          {cap.scope ? cap.scope.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-sky-300 block">{cap.agentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px] block">{cap.filePath || 'scanned file'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-200 block truncate max-w-[200px]" title={cap.resourceTarget}>
                          {cap.resourceTarget}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase">{cap.systemType}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cap.isDestructive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {cap.action}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(cap.state)}`}>
                          {cap.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {cap.authorizationEvidence ? (
                          <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[160px] block">
                            {cap.authorizationEvidence.type} {cap.authorizationEvidence.grantedScope ? `(${cap.authorizationEvidence.grantedScope})` : ''}
                          </span>
                        ) : (
                          <span className="text-rose-400/80 italic text-[10px]">
                            No verified authorization evidence in scope
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {cap.anomalies && cap.anomalies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cap.anomalies.map((a, aIdx) => (
                              <span key={aIdx} className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {capabilities.length > 10 && (
                <p className="text-center text-xs text-slate-400 pt-3">
                  Showing top 10 of {capabilities.length} capabilities. Unlock full inventory in CG-AG Governance OS.
                </p>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold">No capabilities discovered in this scan.</p>
              <p className="text-xs text-slate-500">Zero synthetic or mocked capabilities were generated.</p>
            </div>
          )}
        </div>

        {/* Potentially Relevant Governance Areas (Regulatory Relevance) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Potentially Relevant Governance & Regulatory Frameworks</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>EU AI Act (Regulation 2024/1689)</span>
                <span className="text-[10px] text-sky-400 font-mono">Art. 9 / 14</span>
              </div>
              <p className="text-slate-400 text-[11px]">Requires technical risk management, record-keeping, and human oversight (HITL) for high-impact decision systems.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>GDPR / LGPD (Data Privacy)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Art. 20 / 22</span>
              </div>
              <p className="text-slate-400 text-[11px]">Governs automated data processing, customer profiling, and transparent auditing of algorithmic decisions.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center justify-between">
                <span>ISO/IEC 42001 & NIST AI RMF</span>
                <span className="text-[10px] text-indigo-400 font-mono">Global Standard</span>
              </div>
              <p className="text-slate-400 text-[11px]">Benchmark standards for AI management systems, role accountability, and verifiable traceability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05. AGENT PASSPORT PREVIEW (Can you prove who owns and controls it?)      */}
      {/* ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/30 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                05 · Agent Governance Passport (Preview)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PREVIEW · DERIVED FROM SCANNED EVIDENCE · NOT AN OFFICIAL RECORD
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Can your organization prove who owns and controls this AI?
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Fingerprint className="w-4 h-4 text-indigo-400" />
            <span>Formal Passport Teaser</span>
          </div>
        </div>

        {/* Passport Preview Card */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/20 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">AI Asset Name</span>
              <p className="text-base font-bold text-white font-mono">{xray.passportPreview.aiAsset}</p>
              {!xray.passportPreview.isProductionAsset && (
                <span className="text-[10px] font-mono text-amber-400/90 block pt-0.5">
                  ⚠️ No production-scoped AI persona identified; reflecting supporting / repository scope
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Business Process</span>
              <p className="text-sm font-semibold text-sky-300">{xray.passportPreview.businessProcess}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Business Owner</span>
              <p className="text-xs font-bold text-rose-400 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{xray.passportPreview.owner}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Identity & Role Binding</span>
              <p className="text-xs font-mono text-rose-300 bg-rose-950/30 border border-rose-800/40 px-2 py-1 rounded inline-block">
                {xray.passportPreview.identityBinding}
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-6">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Autonomy Level</span>
              <p className="text-xs font-mono text-amber-300 font-bold">
                {xray.passportPreview.autonomyLevel}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Capabilities</span>
                <span className="text-base font-bold text-cyan-300 font-mono">{xray.passportPreview.capabilitiesCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Unverified Auth</span>
                <span className="text-base font-bold text-rose-400 font-mono">{xray.passportPreview.unverifiedAuthCount}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Verified Human Oversight (HITL)</span>
              <p className="text-xs font-mono text-amber-400 font-semibold">
                {xray.passportPreview.verifiedHitl}
              </p>
            </div>
          </div>
        </div>

        {/* Passport CTA Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white">Issue & Sign Official Passport in Governance OS</h4>
            <p className="text-xs text-slate-300">Assign legal business owners, bind IAM roles, enforce approval gates, and issue signed verifiable credentials.</p>
          </div>
          <button
            onClick={onGovernFindings}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <span>Issue Official Passport</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. TECHNICAL EVIDENCE & CRYPTOGRAPHIC PROOF                               */}
      {/* ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="space-y-1 border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
            06 · Technical Evidence & Cryptographic Proof
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Every business conclusion above is traceable to technical evidence.
          </h3>
          <p className="text-xs text-slate-400">
            Static AST code analysis, service account bindings, and privacy-preserving in-memory analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>Execution Identities & Service Accounts</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {identities.filter(i => i.identityType !== 'unassigned').length} Bindings
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {identities.length > 0 
                ? identities.map(i => `${i.agentName}: ${i.identityType} (${i.roleMapped || 'unmapped'})`).join(', ')
                : 'Identity: UNKNOWN (Unassigned service account in scanned scope)'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                <span>Zero Secrets & Air-Gapped Privacy</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for privacy-preserving analysis: source code is analyzed in-memory in the browser and sensitive credential patterns are redacted before processing. All API keys, JWT bearer tokens, connection strings, and database passwords are redacted in memory.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
              <span>✓ In-Memory AST Analysis</span>
              <span>✓ RFC 8785 Compatible</span>
              <span>✓ SHA-256 Tamper Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07. COMMERCIAL CONVERSION CALL TO ACTION                                   */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>Turn Discovery into Governed Assets</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            You now know what your AI may be doing.
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            The next question is whether your organization can <strong className="text-white">govern and prove it</strong> to auditors, regulators, and customers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
          <button
            onClick={onGovernFindings}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm transition shadow-xl hover:shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Turn this discovered AI into a governed asset</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreGovernanceOs}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm border border-slate-700 transition cursor-pointer"
          >
            Explore CG-AG Governance OS
          </button>
        </div>
      </section>

    </div>
  );
};
'''

with open('../src/web/components/FreeScanSnapshotView.tsx', 'w', encoding='utf-8') as f:
    f.write(view_content.strip() + '\n')

print('Updated FreeScanSnapshotView.tsx with refined ordering and copy')
