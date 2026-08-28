import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, Filter, Code2, CheckCircle,
  ChevronDown, ExternalLink, ArrowRight, ShieldCheck, Search,
  Sparkles, FileCode, CheckCircle2, Shield, Copy, Check
} from 'lucide-react';
import type { ScannerResult, CodeViolation } from '../../core/types';
import { enrichViolationWithLaw } from '../services/regulation-mapper';
import { RemediationModal } from './RemediationModal';

interface ViolationsListProps {
  result: ScannerResult;
}

export const ViolationsList: React.FC<ViolationsListProps> = ({ result }) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolationForFix, setSelectedViolationForFix] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const rawViolations = result.violations || [];

  // Enrich every violation with law article and regulation metadata
  const violations = rawViolations.map(v => {
    const law = enrichViolationWithLaw(v);
    return {
      ...v,
      lawArticle: law.lawArticle,
      ruleTitle: law.ruleTitle,
      regulationName: law.regulationName,
    };
  });

  const filtered = violations.filter(v => {
    const matchesSeverity = severityFilter === 'ALL' || v.severity?.toUpperCase() === severityFilter;
    const matchesSearch = !searchQuery || 
      v.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.rule?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.lawArticle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.file?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.regulationName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      
      {/* Header and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Violações de Conformidade & Artigos de Lei</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {violations.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mapeamento legal por artigo regulatório violado com plano de conformidade técnico e remediação.
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                severityFilter === sev
                  ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por artigo de lei (ex: Art. 14, LGPD, OWASP), arquivo, função ou mensagem..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111827] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-mono"
        />
      </div>

      {/* Violations Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs elevation-card">
            Nenhuma violação encontrada para os filtros selecionados.
          </div>
        ) : (
          filtered.map((v, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5 elevation-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getSeverityBadge(v.severity)}`}>
                      {v.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-900 dark:text-slate-100 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {v.lawArticle}
                    </span>
                    <span className="text-[10px] bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
                      {v.rule}
                    </span>
                    {v.regulationName && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold">
                        {v.regulationName}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {v.message}
                  </h4>
                  
                  {v.recommendation && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Recomendação Técnica: </strong>
                        <span>{v.recommendation}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compliance Remediation Trigger */}
                <button
                  onClick={() => setSelectedViolationForFix({
                    ruleId: v.rule,
                    message: v.message,
                    codeSnippet: v.match,
                    lawArticle: v.lawArticle,
                    filePath: v.file,
                    severity: v.severity,
                    recommendation: v.recommendation
                  })}
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plano de Remediação (IA)</span>
                </button>
              </div>

              {/* Code AST Snippet */}
              {v.match && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs shadow-inner">
                  <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-slate-300 truncate">{v.file}:{v.line || 1}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(v.match || '', idx)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 overflow-x-auto text-[11px] leading-relaxed text-slate-200 bg-[#0a0f1d]">
                    <code>{v.match}</code>
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Remediation Modal */}
      {selectedViolationForFix && (
        <RemediationModal
          violation={selectedViolationForFix}
          onClose={() => setSelectedViolationForFix(null)}
        />
      )}

    </div>
  );
};
