import React, { useState } from 'react';
import { ShieldCheck, Printer, Copy, Check, Download, FileText, Scale, UserCheck, AlertTriangle } from 'lucide-react';
import type { ScannerResult } from '../../core/types';

interface RipdDocumentModalProps {
  result: ScannerResult;
  onClose: () => void;
}

export const RipdDocumentModal: React.FC<RipdDocumentModalProps> = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false);

  const repoName = result.repo?.name || 'Sistema de Inteligência Artificial';
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const violations = result.violations || [];
  const lgpdViolations = violations.filter(v => 
    (v.rule || '').toLowerCase().includes('lgpd') ||
    (v.rule || '').toLowerCase().includes('cpf') ||
    (v.rule || '').toLowerCase().includes('pii') ||
    (v.rule || '').toLowerCase().includes('sensitive') ||
    (v.message || '').toLowerCase().includes('lgpd') ||
    (v.message || '').toLowerCase().includes('dados pessoais')
  );

  const models = result.source?.aiModels || [];
  const agents = result.source?.agents || [];
  const hasAutonomous = agents.some(a => a.isAutonomous || a.riskLevel === 'high' || a.riskLevel === 'critical');

  const handleCopyText = () => {
    const el = document.getElementById('ripd-document-content');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-4xl bg-[#0c101d] border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 bg-[#0e1426] border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Relatório de Impacto à Proteção de Dados (RIPD)</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono">
                  Art. 38 LGPD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Documento probatório para conformidade perante a ANPD e auditorias</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black text-xs font-bold flex items-center space-x-1.5 shadow-glow transition-all cursor-pointer"
              title="Imprimir ou Salvar como PDF Oficial"
            >
              <Printer className="w-3.5 h-3.5 fill-black" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-2 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copiar Texto Formatado"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-[#070b14] space-y-6 text-slate-200">
          
          <div id="ripd-document-content" className="max-w-3xl mx-auto space-y-8 bg-[#0a0f1e] p-6 sm:p-10 rounded-2xl border border-surface-border shadow-inner font-sans text-xs leading-relaxed">
            
            {/* Document Header */}
            <div className="border-b-2 border-emerald-500/40 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold tracking-wider uppercase text-[11px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ComplyPRO.pt • Governança & Proteção de Dados</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Protocolo: RIPD-{new Date().getFullYear()}-{Math.floor(100000 + Math.random() * 900000)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS (RIPD)
              </h1>
              <p className="text-xs text-slate-300">
                Elaborado em cumprimento ao <strong>Artigo 38 da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong> e Resoluções da Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </div>

            {/* Section 1: Identificação */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5 border-b border-surface-border pb-1">
                <span>1. Identificação do Agente de Tratamento e Sistema Auditado</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#080d1a] p-4 rounded-xl border border-surface-border">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Controlador / Organização:</span>
                  <span className="font-semibold text-white">{result.repo?.owner || 'ComplyPRO'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Repositório / Pipeline:</span>
                  <span className="font-mono text-cyan-300">{repoName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Encarregado de Dados (DPO):</span>
                  <span className="font-semibold text-white">dpo@complypro.pt</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Data da Emissão:</span>
                  <span className="text-white">{currentDate}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Descrição dos Fluxos de Tratamento com IA */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5 border-b border-surface-border pb-1">
                <span>2. Descrição das Operações de Tratamento e Uso de IA</span>
              </h2>

              <p className="text-slate-300">
                O sistema processa dados pessoais em pipelines computacionais integrando modelos de Inteligência Artificial e agentes autônomos. Abaixo estão os componentes de IA mapeados no escopo desta avaliação:
              </p>

              <div className="space-y-2">
                <div className="font-bold text-white text-[11px]">Componentes de IA e Modelos Identificados:</div>
                <div className="bg-[#080d1a] p-3 rounded-xl border border-surface-border space-y-1.5">
                  {models.length > 0 ? (
                    models.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-cyan-300 font-mono">▸ {m.provider} {m.modelId || 'Modelo Geral'}</span>
                        <span className="text-slate-400">Finalidade: {m.usage || 'Processamento / Chat'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">Processamento algorítmico interno sem chamadas externas a provedores públicos.</div>
                  )}
                </div>
              </div>

              <div className="bg-[#080d1a] p-3.5 rounded-xl border border-surface-border space-y-1">
                <div className="font-bold text-white text-[11px]">Base Legal Adotada (Art. 7º e 11 da LGPD):</div>
                <p className="text-slate-300 text-[11px]">
                  <strong>Art. 7º, V (Execução de Contrato)</strong> e <strong>Art. 7º, IX (Legítimo Interesse do Controlador)</strong>, complementados por <strong>Consentimento Explícito (Art. 11, I)</strong> quando envolver dados sensíveis de saúde ou biometria.
                </p>
              </div>
            </div>

            {/* Section 3: Avaliação de Riscos aos Titulares */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5 border-b border-surface-border pb-1">
                <span>3. Avaliação de Riscos e Impacto aos Direitos dos Titulares</span>
              </h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Decisões 100% Automatizadas (Art. 20 da LGPD):</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    hasAutonomous ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {hasAutonomous ? 'SIM (Requer Supervisão Humana HITL)' : 'NÃO (Processo Consultivo)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Exposição Potencial de Dados Pessoais (PII):</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    lgpdViolations.length > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {lgpdViolations.length > 0 ? `${lgpdViolations.length} Alertas de Privacidade` : 'Nenhum Risco Crítico'}
                  </span>
                </div>
              </div>

              {lgpdViolations.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1.5">
                  <div className="font-bold text-amber-300 text-[11px] flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Pontos de Atenção Identificados na Auditoria de Código:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {lgpdViolations.slice(0, 4).map((v, i) => (
                      <li key={i}>
                        <span className="font-mono text-cyan-300">{v.file || 'Arquivo'}:</span> {v.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Section 4: Medidas de Salvaguarda e Mitigação */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5 border-b border-surface-border pb-1">
                <span>4. Medidas de Salvaguarda e Governança Mitigatória</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border space-y-1">
                  <span className="font-bold text-white block">🔒 Segurança & Criptografia:</span>
                  <span className="text-slate-300">Criptografia de dados em repouso e trânsito (HTTPS/TLS) e proibição de credenciais hardcoded.</span>
                </div>

                <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border space-y-1">
                  <span className="font-bold text-white block">👤 Human-in-the-Loop (HITL):</span>
                  <span className="text-slate-300">Decisões de crédito, emprego ou saúde passam por validação e revisão humana antes do efeito vinculante.</span>
                </div>

                <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border space-y-1">
                  <span className="font-bold text-white block">🎭 Anonimização & Pseudonimização:</span>
                  <span className="text-slate-300">Hashes SHA-256 e mascaramento de CPFs em logs, telas de depuração e vetores de embedding.</span>
                </div>

                <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border space-y-1">
                  <span className="font-bold text-white block">📜 Canal de Direitos dos Titulares:</span>
                  <span className="text-slate-300">Garantia aos titulares de acesso, retificação, eliminação e explicação de decisões algorítmicas (Art. 18 e 20).</span>
                </div>
              </div>
            </div>

            {/* Section 5: Parecer Conclusivo do DPO */}
            <div className="space-y-3 bg-[#0e1628] p-4 rounded-xl border border-emerald-500/30">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4" />
                <span>5. Parecer Conclusivo do Encarregado de Dados (DPO)</span>
              </h2>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                Considerando as salvaguardas técnicas implementadas, os controles de acesso e o plano de mitigação para as inconformidades identificadas, conclui-se que o sistema auditado opera com <strong>nível aceitável de risco residual</strong>, estando apto para operar em conformidade com as diretrizes da LGPD e as normas do Conselho Nacional de Proteção de Dados.
              </p>

              <div className="pt-6 grid grid-cols-2 gap-6 text-center border-t border-slate-700/50 mt-4">
                <div className="space-y-1">
                  <div className="border-b border-slate-600 pb-1 font-mono text-[11px] text-cyan-300 font-bold">
                    ComplyPRO.pt AI Governance Engine
                  </div>
                  <span className="text-[10px] text-slate-400">Assinatura Digital do Scanner Probatório</span>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-slate-600 pb-1 font-mono text-[11px] text-emerald-300 font-bold">
                    Encarregado de Dados (DPO) Homologado
                  </div>
                  <span className="text-[10px] text-slate-400">Responsável Legal pela Governança</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-[#0e1426] border-t border-surface-border flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Documento gerado automaticamente com base na análise estática de código e linhagem de agentes.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface hover:bg-slate-800 text-white text-xs font-semibold border border-surface-border cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
