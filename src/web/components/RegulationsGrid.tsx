import React, { useState } from 'react';
import { 
  Scale, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, 
  ShieldAlert, ExternalLink, FileText, Lock, ArrowRight, Sparkles
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { calculateRegulationScores, RegulationScoreInfo } from '../services/regulation-mapper';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';

interface RegulationsGridProps {
  result: ScannerResult;
}

const REGULATION_DEFINITIONS = [
  {
    id: 'EU_AI_ACT',
    name: 'EU AI Act',
    jurisdiction: 'União Europeia 🇪🇺',
    category: 'Regulação Abrangente de IA',
    description: 'Classificação de risco, transparência de modelos, avaliação de conformidade (Anexo III) e supervisão humana (Art. 14).',
    articles: ['Art. 6 (Classificação)', 'Art. 9 (Gestão de Riscos)', 'Art. 10 (Dados & Governança)', 'Art. 14 (Supervisão Humana)', 'Art. 50 (Transparência)'],
  },
  {
    id: 'LGPD',
    name: 'LGPD (Lei Geral de Proteção de Dados)',
    jurisdiction: 'Brasil 🇧🇷',
    category: 'Privacidade & Proteção de Dados',
    description: 'Bases legais (Art. 7), dados sensíveis (Art. 11), segurança da informação (Art. 46) e Geração de RIPD (Art. 38).',
    articles: ['Art. 7 (Base Legal)', 'Art. 11 (Dados Sensíveis)', 'Art. 18 (Direitos do Titular)', 'Art. 38 (RIPD)', 'Art. 46 (Segurança)'],
  },
  {
    id: 'GDPR',
    name: 'GDPR (Regulamento Geral de Proteção)',
    jurisdiction: 'União Europeia 🇪🇺',
    category: 'Privacidade & Proteção de Dados',
    description: 'Direito à explicação em decisões automatizadas (Art. 22), privacy by design (Art. 25) e DPIA (Art. 35).',
    articles: ['Art. 5 (Princípios)', 'Art. 22 (Decisões Automatizadas)', 'Art. 25 (Privacy by Design)', 'Art. 32 (Segurança)', 'Art. 35 (DPIA)'],
  },
  {
    id: 'NIST_AI_RMF',
    name: 'NIST AI RMF 1.0',
    jurisdiction: 'Estados Unidos 🇺🇸',
    category: 'Framework de Risco de IA',
    description: 'Quatro funções centrais de governança: Govern (GOVERN), Map (MAP), Measure (MEASURE) e Manage (MANAGE).',
    articles: ['GOVERN 1.1 (Políticas)', 'MAP 1.5 (Contexto & Riscos)', 'MEASURE 2.3 (Métricas de Viés)', 'MANAGE 3.1 (Controles Ativos)'],
  },
  {
    id: 'ISO_42001',
    name: 'ISO/IEC 42001:2023',
    jurisdiction: 'Internacional 🌐',
    category: 'Sistema de Gestão de IA (AIMS)',
    description: 'Padrão global para estabelecimento, implementação e melhoria contínua de Sistemas de Gestão de IA responsáveis.',
    articles: ['Cláusula 6.1 (Ações de Risco)', 'Cláusula 8.2 (Avaliação de IA)', 'Anexo A.5 (Uso Responsável)', 'Anexo A.8 (Ciclo de Vida)'],
  },
  {
    id: 'OWASP_LLM_TOP_10',
    name: 'OWASP Top 10 for LLMs',
    jurisdiction: 'Cibersegurança Global 🛡️',
    category: 'Segurança de Aplicações com IA',
    description: 'Proteção contra Prompt Injection (LLM01), Insecure Output Handling (LLM02), Training Data Poisoning (LLM03) e Denial of Service (LLM04).',
    articles: ['LLM01 (Prompt Injection)', 'LLM02 (Insecure Output)', 'LLM06 (Sensitive Info Disclosure)', 'LLM07 (Insecure Plugin/Tool)'],
  },
  {
    id: 'BCB_4893',
    name: 'Resolução BCB nº 4.893 / 4.658',
    jurisdiction: 'Brasil (Bacen) 🏦',
    category: 'Setor Financeiro & Bancário',
    description: 'Requisitos de segurança cibernética, contratação de serviços de processamento em nuvem e governança de algoritmos de crédito.',
    articles: ['Art. 3 (Política de Segurança)', 'Art. 7 (Controles em Nuvem)', 'Art. 12 (Continuidade de Negócios)', 'Art. 15 (Auditoria de Modelos)'],
  },
  {
    id: 'ANVISA_RDC',
    name: 'RDC ANVISA (SaMD & Saúde)',
    jurisdiction: 'Brasil (ANVISA) 🏥',
    category: 'Software como Dispositivo Médico',
    description: 'Classificação de risco sanitário, validação clínica e rastreabilidade para algoritmos de diagnóstico e triagem médica.',
    articles: ['RDC 657/2022 (Software Médico)', 'Classificação Classe I a IV', 'Validação Clínica & Evidências', 'Rastreabilidade de Decisões'],
  },
  {
    id: 'DORA',
    name: 'DORA (Digital Operational Resilience)',
    jurisdiction: 'União Europeia 🇪🇺',
    category: 'Resiliência Operacional Financeira',
    description: 'Gestão de riscos de TIC em entidades financeiras e requisitos rígidos de governança para terceiros e provedores de IA.',
    articles: ['Art. 6 (Gestão de Riscos TIC)', 'Art. 11 (Resposta a Incidentes)', 'Art. 28 (Riscos de Provedores Terceiros de IA)'],
  },
  {
    id: 'NIS2',
    name: 'NIS2 Directive',
    jurisdiction: 'União Europeia 🇪🇺',
    category: 'Segurança de Redes & Infraestrutura',
    description: 'Medidas de gerenciamento de riscos de segurança cibernética e obrigações de notificação de incidentes críticos.',
    articles: ['Art. 21 (Medidas de Gestão de Riscos)', 'Art. 23 (Notificação de Incidentes em 24h)'],
  },
  {
    id: 'PCI_DSS',
    name: 'PCI-DSS v4.0',
    jurisdiction: 'Setor de Meios de Pagamento 💳',
    category: 'Segurança de Cartões & Pagamentos',
    description: 'Proibição de trânsito de dados de cartão de crédito (PAN/CVV) em logs e prompts não criptografados.',
    articles: ['Requisito 3 (Proteção de Dados do Portador)', 'Requisito 6 (Desenvolvimento Seguro)', 'Requisito 10 (Auditoria e Logs)'],
  },
  {
    id: 'CG_AG',
    name: 'CG-AG (12 Controles de Agentes)',
    jurisdiction: 'Framework Aberto de Governança 📜',
    category: 'Controles Autônomos de Agentes',
    description: '12 controles essenciais: HITL, Limites de Gastos (FinOps), Sandbox de Tools, Timeout de Loop, Sanitização de Memória e Kill-Switch.',
    articles: ['Controle 1 (Kill-Switch)', 'Controle 4 (Human-in-the-Loop)', 'Controle 7 (Rate Limit de Tools)', 'Controle 12 (Auditoria Contínua)'],
  },
];

export const RegulationsGrid: React.FC<RegulationsGridProps> = ({ result }) => {
  const [selectedReg, setSelectedReg] = useState<RegulationScoreInfo | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseContext, setEnterpriseContext] = useState('');

  // Dynamic real score calculation connected directly to the code violations
  const regulationScores = calculateRegulationScores(result.violations || [], REGULATION_DEFINITIONS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Scale className="w-5 h-5 text-slate-700" />
            <span>Matriz de Conformidade (13 Regulações Globais)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Scores calculados dinamicamente com base nas evidências de código e artigos legais correspondentes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {regulationScores.map((reg) => {
          const isCompliant = reg.status === 'compliant';
          const isCritical = reg.status === 'non_compliant';

          return (
            <div
              key={reg.id}
              onClick={() => setSelectedReg(reg)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-md ${
                isCritical
                  ? 'border-rose-200 hover:border-rose-400 bg-rose-50/30'
                  : !isCompliant
                  ? 'border-amber-200 hover:border-amber-400 bg-amber-50/30'
                  : 'border-slate-200/90 hover:border-blue-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">{reg.jurisdiction}</span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                      {reg.name}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10.5px] font-black rounded-md border shrink-0 font-mono ${
                    isCompliant
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isCritical
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {reg.score}%
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {reg.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={`font-mono font-bold ${
                  isCompliant ? 'text-emerald-700' : isCritical ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {isCompliant ? '✓ 0 Violações' : `⚠️ ${reg.violationsCount} Violação(ões)`}
                </span>
                <span className="text-blue-700 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5 font-bold text-xs">
                  <span>Ver parecer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔒 Gerador Automatizado de Dossiê Técnico EU AI Act (Art. 11 & Anexo IV) - Sober Enterprise Teaser */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xs mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <FileText className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Gerador Automatizado de Dossiê Técnico EU AI Act (Art. 11 & Anexo IV)</span>
                <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
                  Enterprise
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Documentação técnica oficial probatória para organismos notificados e auditorias da União Europeia</p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
            Conformidade Art. 11
          </span>
        </div>

        {/* Blurred Technical Dossier Sections */}
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-2 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs filter blur-[3.5px] select-none pointer-events-none opacity-40">
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">1. Arquitetura & Especificação do Sistema</span>
              <p className="text-[10px] text-slate-500">Diagrama de nós, fluxos de inferência, versões de pesos e hiperparâmetros de base.</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">2. Ficha de Dados & Bias Mitigation</span>
              <p className="text-[10px] text-slate-500">Auditoria de vieses, proveniência de dados e medidas de desidentificação de PII.</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">3. Plano de Vigilância Pós-Mercado</span>
              <p className="text-[10px] text-slate-500">Monitoramento de drift contínuo, relatórios de acidentes graves e plano de contingência.</p>
            </div>
          </div>

          {/* Floating Action Overlay with Lock */}
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-5 gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                <Lock className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Exportação Completa do Dossiê Técnico para Conformidade CE
                </h4>
                <p className="text-[11px] text-slate-300 max-w-xl">
                  Gere o dossiê formal de conformidade de alta complexidade exigido pelo Anexo IV do EU AI Act com um único clique.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEnterpriseContext('Gerador de Dossiê Técnico EU AI Act (Art. 11 & Anexo IV)');
                setShowEnterpriseModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>Conhecer Módulo Enterprise</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise Lead Capture Modal */}
      {showEnterpriseModal && (
        <EnterpriseLeadModal onClose={() => setShowEnterpriseModal(false)} featureContext={enterpriseContext} />
      )}

      {/* Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono text-slate-500 font-bold uppercase">{selectedReg.jurisdiction} • {selectedReg.category}</span>
                <div className="flex items-center space-x-3 mt-1">
                  <h3 className="text-xl font-bold text-slate-900">{selectedReg.name}</h3>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${
                    selectedReg.status === 'compliant'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedReg.status === 'non_compliant'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    Score: {selectedReg.score}% ({selectedReg.status === 'compliant' ? 'Conforme' : selectedReg.status === 'non_compliant' ? 'Não Conforme' : 'Atenção Necessária'})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {selectedReg.description}
            </p>

            {/* Violations associated with this regulation */}
            {selectedReg.violationsCount > 0 && (
              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Violações Identificadas nesta Regulação ({selectedReg.violationsCount}):</span>
                </h4>
                <div className="space-y-2">
                  {selectedReg.violations.map((v, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-mono">{v.lawArticle}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                          {v.severity}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-snug">{v.message}</p>
                      {v.file && (
                        <span className="text-[10px] text-slate-500 font-mono block">📁 {v.file}{v.line ? `:${v.line}` : ''}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Audit Scope */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Artigos e Controles Auditados:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedReg.articles.map((art, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{art}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReg(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
