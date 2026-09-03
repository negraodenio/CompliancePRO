import os

content = """import React, { useEffect, useState } from 'react';
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
  Fingerprint
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

  const totalUnknownAuth = capSummary?.unknownAuthorizationCount ?? capabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length;
  const highRiskFindings = (result.violations || []).filter(v => v.severity === 'critical' || v.severity === 'high');
  const averageScore = Math.round(result.compliance?.overallScore ?? 0);

  // Extract Business & Governance X-Ray (SIPOC, Impact, Passport Preview)
  const xray = extractSystemBusinessXRay(result);

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

  const getConfidenceBadge = (conf: 'DIRECTLY_DERIVED' | 'INFERRED' | 'UNKNOWN') => {
    switch (conf) {
      case 'DIRECTLY_DERIVED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'INFERRED':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
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

            <div className="max-w-3xl space-y-2">
              <div className="text-xs font-mono font-semibold text-sky-400 tracking-wider uppercase">
                01 · AI Governance Snapshot
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Technical Ground Truth from {result.repo?.name || 'Scanned Project'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                We discovered <strong className="text-sky-300">{agents.length} AI agents</strong> and agent-like components in your scanned code. Now see which business processes they may affect — and what governance evidence is missing.
              </p>
            </div>
          </div>
        </div>

        {/* 6 High-Level Snapshot KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">AI Agents</span>
              <Bot className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{agents.length}</p>
            <p className="text-[10px] text-slate-400">Discovered in AST</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">AI Models</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{models.length}</p>
            <p className="text-[10px] text-slate-400">Endpoints & LLMs</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Capabilities</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{capabilities.length}</p>
            <p className="text-[10px] text-slate-400">Tools, DB, S3, APIs</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
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
              <span className="text-[11px] font-semibold uppercase tracking-wider">High Risks</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400 font-mono">{highRiskFindings.length}</p>
            <p className="text-[10px] text-slate-400">High-Priority Findings</p>
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
          </div>
          {xray.industryContext && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inferred Sector: {xray.industryContext.sector}</span>
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

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>Governance Status</span>
            </div>
            <p className="text-sm font-bold text-rose-400">{xray.impact.governanceStatus}</p>
            <p className="text-[11px] text-slate-400">Requires formal IAM/SQL policies or CG-AG Governance OS registration.</p>
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
              04 · Canonical Governance Invariant
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
            Your code reveals declared and coded capabilities (e.g. tool definitions, database operations, cloud storage actions, shell executions). A code import or function call <strong>NEVER</strong> constitutes legal or technical authorization. Unless supported by explicit IAM policies, database grants, or OAuth scopes, capabilities remain in state <code className="text-rose-400 font-mono font-semibold">UNKNOWN_AUTHORIZATION</code>.
          </p>
        </div>

        {/* Discovered Agent Capabilities Matrix */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-white">
                Discovered Agent Capabilities & Permission Boundaries
              </h4>
              <p className="text-xs text-slate-400">
                The canonical chain: Agent → Identity → Role → System → Resource → Action → Authorization Evidence
              </p>
            </div>
            <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              {capabilities.length} Capabilities Discovered
            </span>
          </div>

          {capabilities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Agent / Origin</th>
                    <th className="py-2.5 px-3">System & Resource</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Capability State</th>
                    <th className="py-2.5 px-3">Authorization Evidence</th>
                    <th className="py-2.5 px-3">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {capabilities.slice(0, 8).map((cap, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        <div className="truncate max-w-[140px]" title={cap.agentName}>
                          {cap.agentName}
                        </div>
                        {cap.scope && (
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">
                            Scope: {cap.scope}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-medium truncate max-w-[160px]" title={cap.resourceTarget}>
                          {cap.resourceTarget}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cap.systemType}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cap.isDestructive 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {cap.action} {cap.isDestructive ? '⚠️ (DESTRUCTIVE)' : ''}
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
              {capabilities.length > 8 && (
                <p className="text-center text-xs text-slate-400 pt-3">
                  Showing 8 of {capabilities.length} capabilities. Unlock full inventory in CG-AG Governance OS.
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
              <p className="text-xs font-mono text-amber-300">{xray.passportPreview.identityBinding}</p>
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 pt-4 md:pt-0">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Autonomy Level</span>
              <p className="text-xs font-mono text-slate-300">{xray.passportPreview.autonomyLevel}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Capabilities</span>
                <p className="text-lg font-bold text-white font-mono">{xray.passportPreview.capabilitiesCount}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Unverified Auth</span>
                <p className="text-lg font-bold text-rose-400 font-mono">{xray.passportPreview.unverifiedAuthCount}</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Verified Human Oversight (HITL)</span>
              <p className="text-xs font-mono text-slate-400">{xray.passportPreview.verifiedHitl}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={onGovernFindings}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Issue & Sign Official Passport in Governance OS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. TECHNICAL EVIDENCE ("Every business conclusion is traceable")         */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
            06 · Technical Evidence & Cryptographic Proof
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Every business conclusion above is traceable to technical evidence.
          </h3>
          <p className="text-xs text-slate-400">
            Static AST code analysis, service account bindings, and privacy-preserving in-memory analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Execution Identities & Service Accounts</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {identities.length} Bindings
              </span>
            </div>
            <div className="space-y-2">
              {identities.length > 0 ? (
                identities.map((idBinding, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="text-white font-bold">{idBinding.agentName}</div>
                      <div className="text-[10px] text-slate-400">Type: {idBinding.identityType}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      idBinding.identityType === 'unassigned'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {idBinding.roleMapped || 'ROLE: UNKNOWN'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 text-center text-xs text-slate-400">
                  Identity: UNKNOWN (Unassigned service account in scanned scope)
                </div>
              )}
            </div>
          </div>

          {/* Security & Sanitization Guarantee */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                <span>Zero Secrets & Air-Gapped Privacy</span>
              </h4>
              <span className="text-xs font-mono text-emerald-400">VERIFIED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Designed for privacy-preserving analysis: source code is analyzed in-memory in the browser and sensitive credential patterns are redacted before processing. All API keys, JWT bearer tokens, connection strings, and database passwords are <strong>redacted in memory</strong>.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">✓ In-Memory AST Analysis</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">✓ RFC 8785 Compatible</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">✓ SHA-256 Tamper Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07. COMMERCIAL CONVERSION CALL TO ACTION                                   */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-950 border-2 border-sky-500/50 text-white shadow-2xl text-center space-y-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
            CG-AG GOVERNANCE OS
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            You now know what your AI may be doing.
            <br />
            <span className="text-sky-300">The next question is whether your organization can govern and prove it.</span>
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create your enterprise workspace now to ingest these discovered findings into your immutable Cryptographic Ledger, issue official AI Passports, enforce verified HITL approval gates, and generate audit-ready conformity dossiers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto pt-2">
          <button
            onClick={onGovernFindings}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Turn this discovered AI into a governed asset →</span>
          </button>
          
          <button
            onClick={onExploreGovernanceOs}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition cursor-pointer"
          >
            Explore Governance OS
          </button>
        </div>
      </section>

    </div>
  );
};
"""

with open('../src/web/components/FreeScanSnapshotView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('FreeScanSnapshotView.tsx written successfully')
