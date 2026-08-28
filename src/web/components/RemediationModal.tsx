import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Copy, AlertTriangle, ShieldCheck, FileCode, Lightbulb, X, Code2 } from 'lucide-react';
import { generateRemediationWithAI, RemediationResult } from '../services/siliconflow';

interface RemediationModalProps {
  violation: any | null;
  onClose: () => void;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({ violation, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RemediationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!violation) return;
    let active = true;

    const fetchRemediation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await generateRemediationWithAI({
          ruleId: violation.ruleId || violation.id || 'RULE_UNKNOWN',
          message: violation.message || violation.description || 'Violação detectada',
          severity: violation.severity || 'high',
          file: violation.filePath || violation.file,
          line: violation.line,
          regulation: violation.lawArticle || violation.regulation,
          codeSnippet: violation.codeSnippet || violation.snippet || violation.code,
        });
        if (active) setResult(res);
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRemediation();

    return () => {
      active = false;
    };
  }, [violation]);

  if (!violation) return null;

  const handleCopyCode = () => {
    if (result?.remediationSnippet) {
      navigator.clipboard.writeText(result.remediationSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden elevation-card flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Plano de Remediação & Código Corrigido
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {violation.ruleId} • {violation.lawArticle || 'Governança IA'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Finding Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Violação Identificada
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              {violation.message}
            </p>
            {violation.filePath && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                Arquivo: <span className="text-indigo-500 dark:text-indigo-400">{violation.filePath}</span>
              </p>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Gerando patch de conformidade e código remediado com IA...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          ) : result ? (
            <div className="space-y-4">
              
              {/* Explanation / Recommendation */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Explicação & Justificativa Técnica</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  {result.explanation || 'Remediação gerada para adequação aos controles normativos.'}
                </p>
              </div>

              {/* Fixed Code Preview */}
              {result.remediationSnippet && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-emerald-500" />
                      <span>Código Remediado Sugerido</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs">
                    <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-slate-200 bg-[#0a0f1d]">
                      <code>{result.remediationSnippet}</code>
                    </pre>
                  </div>
                </div>
              )}

            </div>
          ) : null}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
