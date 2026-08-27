import React, { useState } from 'react';
import type { ScannerResult } from '../../core/types';
import { CONTROL_LIST } from '../../core/cg-ag-controls';
import { ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, Scale, X, ExternalLink } from 'lucide-react';

interface RegulationsGridProps {
  result?: ScannerResult | null;
}

interface RegulationItem {
  id: string;
  authority: string;
  flag: string;
  name: string;
  description: string;
  articles: string[];
  baseScore: number;
}

const GLOBAL_13_REGULATIONS: RegulationItem[] = [
  {
    id: 'EU_AI_ACT',
    authority: 'UNIÃO EUROPEIA',
    flag: '🇪🇺',
    name: 'EU AI Act (Regulamento 2024/1689)',
    description: 'Classificação de risco, transparência de modelos, avaliação de conformidade (Anexo III) e supervisão humana (Art. 14).',
    articles: ['Art. 6 (Sistemas de Alto Risco)', 'Art. 10 (Governança de Dados)', 'Art. 14 (Supervisão Humana)', 'Art. 15 (Robustez e Cibersegurança)'],
    baseScore: 100
  },
  {
    id: 'LGPD',
    authority: 'BRASIL',
    flag: '🇧🇷',
    name: 'LGPD (Lei Geral de Proteção de Dados)',
    description: 'Bases legais (Art. 7), dados sensíveis (Art. 11), segurança da informação (Art. 46) e geração do RIPD (Art. 38).',
    articles: ['Art. 6 (Princípios e Adequação)', 'Art. 20 (Revisão de Decisões Automatizadas)', 'Art. 38 (Relatório de Impacto RIPD)', 'Art. 46 (Segurança e Sigilo)'],
    baseScore: 72
  },
  {
    id: 'GDPR',
    authority: 'UNIÃO EUROPEIA',
    flag: '🇪🇺',
    name: 'GDPR (Regulamento Geral de Proteção de Dados)',
    description: 'Direito à explicação em decisões automatizadas (Art. 22), privacy by design (Art. 25) e DPIA (Art. 35).',
    articles: ['Art. 22 (Decisões Automatizadas)', 'Art. 25 (Privacy by Design)', 'Art. 35 (Data Protection Impact Assessment)'],
    baseScore: 72
  },
  {
    id: 'NIST_AI_RMF',
    authority: 'ESTADOS UNIDOS',
    flag: '🇺🇸',
    name: 'NIST AI RMF 1.0',
    description: 'Quatro funções centrais de governança: Govern (GOVERN), Map (MAP), Measure (MEASURE) e Manage (MANAGE).',
    articles: ['GOVERN 1.1 (Inventário e Donos)', 'MEASURE 2.7 (Defesa contra Prompt Injection)', 'MANAGE 2.4 (Continuidade e Failsafe)'],
    baseScore: 100
  },
  {
    id: 'ISO_42001',
    authority: 'INTERNACIONAL',
    flag: '🌐',
    name: 'ISO/IEC 42001:2023',
    description: 'Padrão global para estabelecimento, implementação e melhoria contínua de Sistemas de Gestão de IA responsável.',
    articles: ['A.6.2 (Inventário de IA)', 'A.8.2 (Segurança de Segredos e Chaves)', 'A.8.4 (Supervisão Humana)'],
    baseScore: 86
  },
  {
    id: 'OWASP_LLM',
    authority: 'CIBERSEGURANÇA GLOBAL',
    flag: '🛡️',
    name: 'OWASP Top 10 for LLMs',
    description: 'Proteção contra Prompt Injection (LLM01), Insecure Output Handling (LLM02), Training Data Poisoning e Denial of Service.',
    articles: ['LLM01 (Prompt Injection)', 'LLM02 (Insecure Output)', 'LLM06 (Excessive Agency & Permissions)'],
    baseScore: 47
  },
  {
    id: 'BACEN',
    authority: 'BRASIL (BACEN)',
    flag: '🏦',
    name: 'Resolução BCB nº 4.893 / 4.658',
    description: 'Requisitos de segurança cibernética, contratação de serviços de nuvem e governança de algoritmos de crédito.',
    articles: ['Art. 3 (Política de Segurança Cibernética)', 'Art. 12 (Continuidade Operacional e Resiliência)'],
    baseScore: 61
  },
  {
    id: 'ANVISA',
    authority: 'BRASIL (ANVISA)',
    flag: '🏥',
    name: 'RDC ANVISA (SaMD & Saúde)',
    description: 'Classificação de risco sanitário, validação clínica e rastreabilidade para algoritmos de diagnóstico e triagem médica.',
    articles: ['RDC 657/2022 (Software como Dispositivo Médico - SaMD)', 'Validação Clínica e Evidências'],
    baseScore: 100
  },
  {
    id: 'DORA',
    authority: 'UNIÃO EUROPEIA',
    flag: '🇪🇺',
    name: 'DORA (Digital Operational Resilience Act)',
    description: 'Gestão de riscos de TIC em entidades financeiras e requisitos rígidos de governança para terceiros e provedores de IA.',
    articles: ['Art. 9 (Proteção e Prevenção TIC)', 'Art. 11 (Continuidade e Resiliência)', 'Art. 28 (Riscos de Terceiros e Provedores IA)'],
    baseScore: 100
  },
  {
    id: 'NYC_144',
    authority: 'ESTADOS UNIDOS (NYC)',
    flag: '🇺🇸',
    name: 'NYC Local Law 144 (AEDT)',
    description: 'Auditoria anual obrigatória de viés algorítmico para ferramentas de decisão automatizada de emprego e RH.',
    articles: ['Auditoria Independente de Impacto', 'Aviso Prévio aos Candidatos'],
    baseScore: 100
  },
  {
    id: 'SEC_AI',
    authority: 'ESTADOS UNIDOS (SEC)',
    flag: '🇺🇸',
    name: 'SEC AI Governance Rules',
    description: 'Prevenção de conflitos de interesse no uso de análises preditivas e modelos de IA por corretoras e consultores.',
    articles: ['Divulgação de Riscos Algorítmicos', 'Mitigação de Conflito de Interesses'],
    baseScore: 100
  },
  {
    id: 'NIS2',
    authority: 'UNIÃO EUROPEIA',
    flag: '🇪🇺',
    name: 'NIS2 Directive (Cibersegurança)',
    description: 'Requisitos rigorosos de cibersegurança e governança de cadeia de suprimentos para setores críticos e essenciais.',
    articles: ['Art. 21 (Medidas de Gestão de Riscos de Cibersegurança)', 'Art. 23 (Notificação de Incidentes em 24h)'],
    baseScore: 100
  },
  {
    id: 'CCPA_CPRA',
    authority: 'ESTADOS UNIDOS (CALIFÓRNIA)',
    flag: '🇺🇸',
    name: 'CCPA / CPRA (California Privacy)',
    description: 'Direitos dos consumidores em relação à tomada de decisão automatizada e profiling de dados sensíveis.',
    articles: ['Opt-out de Tomada de Decisão Automatizada', 'Minimização e Propósito'],
    baseScore: 100
  }
];

export const RegulationsGrid: React.FC<RegulationsGridProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'regulations'>('controls');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const violations = result?.violations || [];

  const getControlStatus = (controlId: string) => {
    const hasViolation = violations.some(v => v.rule.toLowerCase().includes(controlId.toLowerCase()) || v.category === 'owasp');
    if (hasViolation) return { status: 'PARTIAL', label: '1 Finding', color: 'amber' };
    return { status: 'EFFECTIVE', label: 'Effective', color: 'emerald' };
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs: 12 CG-AG Controls vs Global Frameworks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'controls'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📜 The 12 CG-AG Controls (Control Engine)
          </button>
          <button
            onClick={() => setActiveTab('regulations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'regulations'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚖️ Global Regulatory Reference Matrix (13 Frameworks)
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-code">
          Operational Baseline
        </div>
      </div>

      {/* TAB 1: THE 12 CG-AG CONTROLS */}
      {activeTab === 'controls' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CONTROL_LIST.map((ctrl) => {
            const { status, label, color } = getControlStatus(ctrl.id);
            const isEmerald = color === 'emerald';

            return (
              <div
                key={ctrl.id}
                onClick={() => setSelectedItem(ctrl)}
                className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition cursor-pointer flex flex-col justify-between space-y-3 group elevation-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-code text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/50">
                      {ctrl.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isEmerald
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                    }`}>
                      {label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {ctrl.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {ctrl.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 capitalize">
                    Domain: <strong className="text-slate-700 dark:text-slate-300">{ctrl.domain.replace('_', ' ')}</strong>
                  </span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                    Inspect <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GLOBAL REGULATORY MATRIX */}
      {activeTab === 'regulations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {GLOBAL_13_REGULATIONS.map((reg) => {
            const score = reg.baseScore;
            const isHigh = score >= 80;
            const isMedium = score >= 60 && score < 80;

            return (
              <div
                key={reg.id}
                onClick={() => setSelectedItem(reg)}
                className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition cursor-pointer flex flex-col justify-between space-y-3 group elevation-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {reg.authority} {reg.flag}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isHigh
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                        : (isMedium
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                          : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80')
                    }`}>
                      {score}%
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {reg.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {reg.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className={score === 100 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                    {score === 100 ? '✓ 0 Violações' : '⚠️ Violações Detectadas'}
                  </span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                    Ver parecer <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono-code text-xs text-sky-600 dark:text-sky-400 font-bold">
                  {selectedItem.id || selectedItem.authority}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedItem.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedItem.description}
            </p>

            {selectedItem.articles && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Principais Artigos / Requisitos:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.articles.map((art: string) => (
                    <span key={art} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px]">
                      {art}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-medium transition"
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
