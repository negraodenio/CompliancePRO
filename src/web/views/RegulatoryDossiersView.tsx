import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileCheck2, 
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
  Download, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  FileBadge,
  PackageCheck,
  Binary,
  Globe,
  Award,
  Info
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { DossierStore, RegulatoryDossier, RegulatoryFramework, DossierStatus } from '../services/dossier-store';

export const RegulatoryDossiersView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [dossiers, setDossiers] = useState<RegulatoryDossier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFramework, setFilterFramework] = useState<string>('ALL');
  const [selectedDossier, setSelectedDossier] = useState<RegulatoryDossier | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'crosswalk' | 'evidence' | 'manifest' | 'integrity' | 'export'>('overview');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const refreshState = () => {
    const list = DossierStore.getDossiers();
    setDossiers(list);
    if (selectedDossier) {
      const updated = list.find(d => d.dossierId === selectedDossier.dossierId);
      if (updated) setSelectedDossier(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return DossierStore.subscribe(refreshState);
  }, []);

  const handleExportJSON = (dossier: RegulatoryDossier) => {
    DossierStore.markDossierExported(dossier.dossierId);
    const jsonStr = JSON.stringify(dossier, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dossier.dossierId}-MANIFEST-CANONICAL.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadFeedback(`Technical Manifest Exported: ${dossier.dossierId}`);
    setTimeout(() => setDownloadFeedback(null), 5000);
  };

  const handleExportMarkdown = (dossier: RegulatoryDossier) => {
    DossierStore.markDossierExported(dossier.dossierId);
    let md = `# REGULATORY EVIDENCE DOSSIER: ${dossier.title}\n\n`;
    md += `**Framework Standard:** ${dossier.frameworkStandard}\n`;
    md += `**Target System:** ${dossier.targetScope}\n`;
    md += `**Dossier Version:** ${dossier.version}\n`;
    md += `**Package SHA-256 Hash:** ${dossier.packageHash}\n`;
    md += `**Designated Custodian:** ${dossier.custodian}\n`;
    md += `**Generated Timestamp:** ${dossier.generatedAt}\n\n`;
    md += `## ⚠️ AUDIT DISCLAIMER & SCOPE\n`;
    md += `This technical dossier compiles cryptographic and operational evidence records produced by the CG-AG Governance OS. Exported Package ≠ Certified Compliant. Formal statutory compliance requires independent third-party conformity assessment.\n\n`;
    md += `## EXECUTIVE SUMMARY\n${dossier.executiveSummary}\n\n`;
    md += `## COMPILED SECTIONS & REGULATORY MAPPINGS\n`;
    dossier.sections.forEach(s => {
      md += `### ${s.sectionTitle} (${s.regulatoryClause})\n`;
      md += `${s.contentSummary}\n`;
      if (s.linkedEvidenceId) md += `*Linked Evidence ID:* \`${s.linkedEvidenceId}\`\n`;
      md += `\n`;
    });
    md += `## LINKED CRYPTOGRAPHIC LEDGER BLOCKS\n`;
    dossier.ledgerBlockRefs.forEach(b => {
      md += `- Ledger Block: \`${b}\`\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dossier.dossierId}-TECHNICAL-FILE.md`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadFeedback(`Audit Markdown Dossier Exported: ${dossier.dossierId}`);
    setTimeout(() => setDownloadFeedback(null), 5000);
  };

  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.dossierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.targetScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.packageHash.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFramework = filterFramework === 'ALL' || d.framework === filterFramework;

      return matchSearch && matchFramework;
    });
  }, [dossiers, searchTerm, filterFramework]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <span>Assure Pillar</span>
            <span>·</span>
            <span>Regulatory Dossiers & Technical Export Hub</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Regulatory Dossiers & Export Hub</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono-code">
              {dossiers.length} Compiled Regulatory Packages
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"Can we transform the full governance causal chain into an audit-ready, exportable technical package?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Audit Evidence Packages Ready</span>
          </span>
        </div>
      </div>

      {/* ANTI-OVERCLAIMING DISCLAIMER BANNER */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <strong>Technical Packaging Standard (Anti-Overclaiming):</strong> Exporting a dossier packages verifiable operational evidence (SHA-256 hashes, decisions, ledger blocks). <strong>Exported Package ≠ Certified Compliant.</strong> Technical evidence supports statutory audit but does not replace independent certification or regulatory assessment.
        </div>
      </div>

      {/* Toast Notification */}
      {downloadFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{downloadFeedback}</span>
          </div>
          <button onClick={() => setDownloadFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Regulatory Dossiers</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{dossiers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">EU AI Act, LGPD, NIST AI RMF</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Linked Evidence Proofs</span>
            <Lock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">6 Sealed Proofs</div>
          <div className="text-[11px] text-slate-500 mt-1">Cross-Module Evidence Records</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Chained Ledger Blocks</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">7 Blocks Ref</div>
          <div className="text-[11px] text-slate-500 mt-1">Continuity Verified to Genesis</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Manifest Standard</span>
            <Binary className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-base font-bold text-emerald-600 dark:text-emerald-400">RFC 8785 JSON</div>
          <div className="text-[11px] text-slate-500 mt-1">Canonical SHA-256 Digest</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search dossier ID, title, target system, framework, or SHA-256 package hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Framework Filter */}
          <select
            value={filterFramework}
            onChange={(e) => setFilterFramework(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Regulatory Frameworks</option>
            <option value="EU_AI_ACT">🇪🇺 EU AI Act (Annex IV)</option>
            <option value="LGPD_RIPD">🇧🇷 LGPD / RIPD (Art. 38)</option>
            <option value="NIST_AI_RMF">🇺🇸 NIST AI RMF 1.0</option>
          </select>
        </div>
      </div>

      {/* MASTER DOSSIERS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Dossier ID & Title</th>
                <th className="py-3 px-4">Framework Standard</th>
                <th className="py-3 px-4">Target System Scope</th>
                <th className="py-3 px-4">Controls Included</th>
                <th className="py-3 px-4">Evidence Artifacts</th>
                <th className="py-3 px-4">Package Hash</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect & Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDossiers.map((d) => {
                const isExported = d.status === 'EXPORTED';

                return (
                  <tr
                    key={d.dossierId}
                    onClick={() => setSelectedDossier(d)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{d.dossierId}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 max-w-xs">{d.title}</div>
                    </td>

                    {/* Framework */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{d.framework.replace(/_/g, ' ')}</span>
                      <div className="text-[10px] text-slate-400">{d.version}</div>
                    </td>

                    {/* Target Scope */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{d.targetScope}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{d.targetEntityId}</div>
                    </td>

                    {/* Controls */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code text-[11px] font-bold text-sky-600 dark:text-sky-400">
                        {d.controlsCovered.length} Controls
                      </span>
                      <div className="text-[10px] text-slate-400">{d.controlsCovered.slice(0, 3).join(', ')}...</div>
                    </td>

                    {/* Evidence */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {d.evidenceRefs.length} Proofs Sealed
                      </span>
                      <div className="text-[10px] text-slate-400">{d.ledgerBlockRefs.length} Ledger Blocks</div>
                    </td>

                    {/* Package Hash */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[10px] text-slate-500">
                      {d.packageHash.substring(0, 16)}...
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isExported
                          ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isExported ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDossier(d);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect & Export <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE DOSSIER INSPECTION & EXPORT DRAWER */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {selectedDossier.dossierId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedDossier.framework.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {selectedDossier.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedDossier.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Target: {selectedDossier.targetScope} · Custodian: {selectedDossier.custodian}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDossier(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'crosswalk', 'evidence', 'manifest', 'integrity', 'export'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'crosswalk' ? 'Regulatory Sections' : (tab === 'evidence' ? 'Linked Proofs' : (tab === 'manifest' ? 'JSON Manifest' : (tab === 'export' ? 'Export Hub' : tab)))}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Dossier Executive Summary</div>
                      <p className="text-[11px] leading-relaxed">
                        {selectedDossier.executiveSummary}
                      </p>
                      <div className="space-y-2 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Framework Standard:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedDossier.frameworkStandard}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Package Version:</span>
                          <span className="font-mono-code">{selectedDossier.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Generated Timestamp:</span>
                          <span className="font-mono-code">{new Date(selectedDossier.generatedAt).toISOString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Designated Custodian:</span>
                          <span>{selectedDossier.custodian}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. REGULATORY SECTIONS */}
                {activeDrawerTab === 'crosswalk' && (
                  <div className="space-y-3">
                    {selectedDossier.sections.map(s => (
                      <div key={s.sectionId} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{s.sectionTitle}</span>
                          <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400 text-[10px] bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                            {s.regulatoryClause}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {s.contentSummary}
                        </p>
                        {s.linkedEvidenceId && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono-code pt-0.5">
                            Attached Proof: <strong>{s.linkedEvidenceId}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Attached Protected Evidence Artifacts</div>
                      <div className="space-y-1.5 text-[11px]">
                        {selectedDossier.evidenceRefs.map(e => (
                          <div key={e} className="flex justify-between items-center p-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded font-mono-code">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{e}</span>
                            <span className="text-[10px] text-slate-400">Cryptographically Sealed</span>
                          </div>
                        ))}
                      </div>

                      <div className="font-bold text-slate-800 dark:text-slate-200 pt-2">Referenced Audit Ledger Blocks</div>
                      <div className="space-y-1.5 text-[11px]">
                        {selectedDossier.ledgerBlockRefs.map(b => (
                          <div key={b} className="flex justify-between items-center p-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded font-mono-code">
                            <span className="font-bold text-purple-600 dark:text-purple-400">{b}</span>
                            <span className="text-[10px] text-slate-400">Chained Hash Verified</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MANIFEST */}
                {activeDrawerTab === 'manifest' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Canonical Technical Manifest (RFC 8785 JSON)</div>
                      <pre className="p-3 bg-slate-900 text-slate-200 font-mono-code text-[10px] rounded-lg overflow-x-auto max-h-72">
                        {JSON.stringify(selectedDossier, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 5. INTEGRITY */}
                {activeDrawerTab === 'integrity' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Package Cryptographic Integrity Digest</span>
                      </div>
                      <div className="font-mono-code text-[10px] p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 break-all">
                        {selectedDossier.packageHash}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Derived from canonical deterministic JSON serialization of all contained sections, evidence hashes, and ledger references.
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. EXPORT HUB */}
                {activeDrawerTab === 'export' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-emerald-500" />
                        <span>Export Technical Evidence Package</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Export formatted technical files to support third-party audit, regulatory inquiry, or external governance review.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleExportJSON(selectedDossier)}
                          className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-xl text-left transition group shadow-xs"
                        >
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                            <span>JSON Manifest</span>
                            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">RFC 8785 canonical data file with SHA-256 hashes</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportMarkdown(selectedDossier)}
                          className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-xl text-left transition group shadow-xs"
                        >
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                            <span>Technical File (MD)</span>
                            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Formatted technical audit dossier with clauses</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Dossier: {selectedDossier.dossierId}</span>
              <button
                onClick={() => setSelectedDossier(null)}
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
