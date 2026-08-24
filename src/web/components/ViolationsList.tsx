import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, Filter, Code2, CheckCircle,
  ChevronDown, ExternalLink, ArrowRight, ShieldCheck 
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

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse';
      case 'high':
        return 'bg-orange-950/80 text-orange-300 border-orange-800/80';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Violações de Conformidade & Artigos de Lei ({violations.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Mapeamento legal exato por artigo de regulação violado com correção automática por IA.
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-surface p-1 rounded-xl border border-surface-border text-xs">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por artigo de lei (ex: Art. 14, LGPD, OWASP), arquivo ou mensagem..."
          className="w-full px-3.5 py-2 bg-surface text-xs text-white placeholder-slate-500 rounded-xl border border-surface-border focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Violations Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-surface-border text-slate-400 text-xs">
            Nenhuma violação encontrada para os filtros selecionados. 🎉
          </div>
        ) : (
          filtered.map((v, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border border-surface-border hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSeverityBadge(v.severity)}`}>
                      {v.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {v.lawArticle}
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 font-mono">
                      {v.rule}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-white leading-snug">{v.message}</h4>
                  
                  {v.recommendation && (
                    <p className="text-xs text-slate-400 flex items-start space-x-1.5 pt-1">
                      <span className="text-emerald-400 font-semibold shrink-0">💡 Recomendação:</span>
                      <span>{v.recommendation}</span>
                    </p>
                  )}
                </div>

                {/* Compliance Remediation Trigger */}
                <button
                  onClick={() => setSelectedViolationForFix({
                    ruleId: v.rule,
                    message: v.message,
                    severity: v.severity,
                    file: v.file,
                    line: v.line,
                    regulation: v.lawArticle,
                    codeSnippet: v.match,
                  })}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Plano de Conformidade</span>
                </button>
              </div>

              {/* Code Reference / Snippet if available */}
              {v.file && (
                <div className="bg-[#0a0f1c] p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">📁 {v.file}{v.line ? `:${v.line}` : ''}</span>
                  {v.match && (
                    <span className="text-slate-400 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono truncate max-w-sm">
                      {v.match}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* AI Remediation Modal */}
      {selectedViolationForFix && (
        <RemediationModal
          violation={selectedViolationForFix}
          onClose={() => setSelectedViolationForFix(null)}
        />
      )}
    </div>
  );
};
