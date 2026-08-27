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

  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Violações de Conformidade & Artigos de Lei ({violations.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Mapeamento legal exato por artigo de regulação violado com plano de conformidade técnico.
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
          className="w-full px-4 py-2.5 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-2xs"
        />
      </div>

      {/* Violations Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-2xs">
            Nenhuma violação encontrada para os filtros selecionados.
          </div>
        ) : (
          filtered.map((v, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getSeverityBadge(v.severity)}`}>
                      {v.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {v.lawArticle}
                    </span>
                    <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded text-slate-600 border border-slate-200 font-mono">
                      {v.rule}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">{v.message}</h4>
                  
                  {v.recommendation && (
                    <p className="text-xs text-slate-600 flex items-start space-x-1.5 pt-1">
                      <span className="text-emerald-700 font-bold shrink-0">Recomendação:</span>
                      <span>{v.recommendation}</span>
                    </p>
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
                  })}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Plano de Conformidade</span>
                </button>
              </div>

              {/* Code Snippet */}
              {v.match && (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 font-mono text-xs">
                  <div className="px-3 py-1 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{v.file}:{v.line || 1}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Evidência em Código</span>
                  </div>
                  <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed text-slate-200">
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
