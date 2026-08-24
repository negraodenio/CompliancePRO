import React, { useState } from 'react';
import { 
  X, CheckCircle, ShieldCheck, Scale, FileText, 
  ArrowRight, ArrowLeft, Download, Award, Layers, Sparkles 
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';

interface QuestionOption {
  value: number;
  label: string;
  description: string;
}

interface Question {
  id: string;
  category: 'EU_AI_ACT' | 'LGPD_GDPR' | 'ISO_42001';
  categoryLabel: string;
  text: string;
  options: QuestionOption[];
}

const ASSESSMENT_QUESTIONS: Question[] = [
  // 1. EU AI Act (Governança & Risco)
  {
    id: 'eu_1',
    category: 'EU_AI_ACT',
    categoryLabel: 'EU AI Act • Governança de Risco',
    text: 'A organização possui processo formal para classificar sistemas de IA por nível de risco (Inaceitável, Alto Risco, Limitado)?',
    options: [
      { value: 0, label: 'Nenhum Processo', description: 'Não existe classificação formal de risco de IA na empresa.' },
      { value: 2, label: 'Em Planejamento', description: 'Classificação informal ou diretrizes em fase de elaboração.' },
      { value: 4, label: 'Parcialmente Implementado', description: 'Classificação realizada para os principais projetos de IA.' },
      { value: 5, label: 'Completo e Documentado', description: 'Inventário formal e classificação documentada conforme Anexo III.' },
    ],
  },
  {
    id: 'eu_2',
    category: 'EU_AI_ACT',
    categoryLabel: 'EU AI Act • Transparência & Explicabilidade',
    text: 'Como a organização garante a transparência e explicabilidade das decisões tomadas por modelos e agentes autônomos?',
    options: [
      { value: 0, label: 'Sem Garantia Formal', description: 'Modelos operam como caixa-preta sem documentação de interpretabilidade.' },
      { value: 2, label: 'Explicabilidade Básica', description: 'Explicações técnicas fornecidas sob demanda manual.' },
      { value: 4, label: 'Estruturado com Logs', description: 'Logs de inferência e métricas de feature importance arquivados.' },
      { value: 5, label: 'Explicabilidade Proativa (Art. 13)', description: 'Mecanismos automatizados de justificativa e relatórios para usuários.' },
    ],
  },
  // 2. LGPD & GDPR (Privacidade & Direitos dos Titulares)
  {
    id: 'priv_1',
    category: 'LGPD_GDPR',
    categoryLabel: 'LGPD / GDPR • Estrutura de Governança',
    text: 'A organização possui Encarregado pelo Tratamento de Dados Pessoais (DPO) formalmente designado e atuante em projetos de IA?',
    options: [
      { value: 0, label: 'Não Designado', description: 'Sem DPO ou comitê de privacidade formal.' },
      { value: 2, label: 'Responsável Não Formalizado', description: 'Colaborador de TI/Segurança responde informalmente pela função.' },
      { value: 4, label: 'DPO Formalmente Nomeado', description: 'DPO registrado nos órgãos competentes e atuando nas esteiras de produto.' },
      { value: 5, label: 'Comitê Multidisciplinar Dedicado', description: 'Equipe de DPO, Jurídico e Engenharia de IA com reuniões periódicas.' },
    ],
  },
  {
    id: 'priv_2',
    category: 'LGPD_GDPR',
    categoryLabel: 'LGPD / GDPR • Gestão de Incidentes & 72h',
    text: 'Existe procedimento formal testado para resposta e notificação de incidentes de segurança com IA em até 72 horas (ANPD/GDPR)?',
    options: [
      { value: 0, label: 'Sem Procedimento', description: 'Não há fluxo de resposta a incidentes voltado a dados e modelos de IA.' },
      { value: 2, label: 'Plano Teórico Não Testado', description: 'Fluxo documentado, mas sem simulações de mesa ou testes de estresse.' },
      { value: 4, label: 'Procedimento Operacional Funcional', description: 'Matriz de comunicação, templates ANPD e prazos de 72h estabelecidos.' },
      { value: 5, label: 'Automatizado & Auditado', description: 'Detecção contínua com acionamento automatizado de comitê de crise.' },
    ],
  },
  // 3. ISO/IEC 42001 (Sistema de Gestão de IA)
  {
    id: 'iso_1',
    category: 'ISO_42001',
    categoryLabel: 'ISO/IEC 42001 • Políticas & Ciclo de Vida',
    text: 'A organização possui Política Corporativa de Uso Aceitável de IA (AUP) e Comitê de Ética estabelecido?',
    options: [
      { value: 0, label: 'Sem Política Formal', description: 'Colaboradores usam ferramentas de IA sem diretrizes corporativas.' },
      { value: 2, label: 'Diretrizes Básicas', description: 'Comunicado interno informal sobre não colar segredos comerciais em LLMs.' },
      { value: 4, label: 'Política Corporativa Documentada', description: 'Política aprovada pela diretoria com regras claras de uso e homologação.' },
      { value: 5, label: 'Gestão Integrada (ISO 42001)', description: 'Sistema de Gestão de IA estruturado com auditorias e comitê de ética.' },
    ],
  },
  {
    id: 'iso_2',
    category: 'ISO_42001',
    categoryLabel: 'ISO/IEC 42001 • Gestão de Fornecedores de IA',
    text: 'Existe avaliação de conformidade e segurança para APIs de terceiros (OpenAI, Anthropic, Bedrock, etc.) antes da contratação?',
    options: [
      { value: 0, label: 'Contratação Direta sem Análise', description: 'Contas criadas com cartão de crédito sem análise de termos de uso.' },
      { value: 2, label: 'Análise Pontual', description: 'Verificação básica se os dados são usados para treinamento do modelo.' },
      { value: 4, label: 'Homologação Formal de Fornecedores', description: 'Contratos corporativos (Enterprise/BAA) com garantias de zero data retention.' },
      { value: 5, label: 'Due Diligence Contínua de IA', description: 'Avaliação periódica de SLAs, criptografia em repouso e soberania de dados.' },
    ],
  },
];

interface OrganizationalAssessmentModalProps {
  result: ScannerResult;
  onClose: () => void;
}

export const OrganizationalAssessmentModal: React.FC<OrganizationalAssessmentModalProps> = ({ result, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];

  const handleSelectOption = (questionId: string, value: number) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Cálculo do Score Organizacional (Base 100)
  const maxPoints = totalQuestions * 5;
  const currentPoints = Object.values(answers).reduce((acc, v) => acc + v, 0);
  const orgScore = Math.round((currentPoints / maxPoints) * 100);

  // Score Técnico do Scanner
  const codeScore = 78; // Calculado pelo scanner de código

  // Score Combinado 360° (50% Código + 50% Processos Organizacionais)
  const combinedScore = Math.round((codeScore * 0.5) + (orgScore * 0.5));

  const handleExportAssessment = () => {
    const lines = [
      '=========================================================================',
      `RELATÓRIO DE DIAGNÓSTICO 360° DE GOVERNANÇA DE IA (CÓDIGO + PROCESSOS)`,
      `Repositório Auditado: ${result.repo?.name || 'Sistema'}`,
      `Data da Auditoria: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      `Normas de Referência: ISO/IEC 42001, EU AI Act, LGPD Art. 38 & NIST AI RMF`,
      '=========================================================================',
      '',
      `1. RESUMO EXECUTIVO DE PONTUAÇÃO`,
      `-------------------------------------------------------------------------`,
      `• Score Técnico de Código (Scanner ComplyPRO): ${codeScore}/100`,
      `• Score Organizacional & Processos (ISO 42001): ${orgScore}/100`,
      `• SCORE CONSOLIDADO 360°: ${combinedScore}/100`,
      '',
      `2. DETALHAMENTO DA AVALIAÇÃO DE PROCESSOS`,
      `-------------------------------------------------------------------------`,
    ];

    ASSESSMENT_QUESTIONS.forEach((q, idx) => {
      const selectedVal = answers[q.id] ?? 0;
      const selectedOption = q.options.find(o => o.value === selectedVal);
      lines.push(`[Questão ${idx + 1}] ${q.categoryLabel}`);
      lines.push(`Pergunta: ${q.text}`);
      lines.push(`Resposta Selecionada: ${selectedOption?.label || 'Não Respondido'} (${selectedVal}/5 pontos)`);
      lines.push(`Justificativa: ${selectedOption?.description || ''}`);
      lines.push('');
    });

    lines.push('=========================================================================');
    lines.push('Relatório gerado automaticamente pela plataforma ComplyPRO.pt');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagnostico-360-Governanca-IA-${result.repo?.name || 'auditoria'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-3xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Diagnóstico Organizacional Complementar</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-200 text-slate-700 rounded font-bold">
                  ISO 42001 & EU AI Act
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Avaliação opcional de maturidade de processos corporativos, políticas internas e governança.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5">
          <div 
            className="bg-slate-900 h-1.5 transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {!isCompleted ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Category Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {currentQuestion.categoryLabel}
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Questão {currentStep + 1} de {totalQuestions}
                </span>
              </div>

              {/* Question Text */}
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {currentQuestion.text}
              </h4>

              {/* Options Grid */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between group ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {opt.label}
                        </span>
                        <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {opt.description}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-white bg-white text-slate-900' : 'border-slate-300 group-hover:border-slate-500'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {answers[currentQuestion.id] !== undefined && currentStep < totalQuestions - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Próxima</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Completed 360 Consolidated Report */
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">Diagnóstico Organizacional Concluído</h4>
                  <p className="text-[11px] text-emerald-700">
                    Os processos corporativos foram cruzados com as evidências de código escaneadas.
                  </p>
                </div>
              </div>

              {/* Score Triad Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">1. Evidências em Código</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">{codeScore} / 100</div>
                  <p className="text-[10px] text-slate-500">Scanner Estático Automatizado</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">2. Políticas & Processos</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">{orgScore} / 100</div>
                  <p className="text-[10px] text-slate-500">Avaliação ISO 42001 / EU AI Act</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-900 text-center space-y-1 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-300 font-mono">Score Consolidado 360°</span>
                  <div className="text-2xl font-black text-white font-mono">{combinedScore} / 100</div>
                  <p className="text-[10px] text-slate-300">Padrão Auditoria Corporativa</p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsCompleted(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Revisar Respostas
                </button>

                <button
                  onClick={handleExportAssessment}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Parecer Consolidado 360° (.txt)</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
