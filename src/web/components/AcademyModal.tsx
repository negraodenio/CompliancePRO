import React, { useState } from 'react';
import { 
  X, GraduationCap, ShieldCheck, CheckCircle2, 
  Download, BookOpen, Video, Award, Clock, ArrowRight, Sparkles, Terminal, FileText
} from 'lucide-react';

interface AcademyModalProps {
  onClose: () => void;
}

export const AcademyModal: React.FC<AcademyModalProps> = ({ onClose }) => {
  const [activeModule, setActiveModule] = useState(1);
  const [licenseActivated, setLicenseActivated] = useState(true);

  const modules = [
    {
      id: 1,
      title: 'Módulo 1: O Tabuleiro Regulatório Global',
      duration: '6 Horas',
      lessons: [
        '1.1 O Fim do "Faroeste da IA" & Novo Cenário',
        '1.2 EU AI Act Decodificado: Anexo III e Multas de €35M',
        '1.3 LGPD & GDPR em Modelos Generativos (Art. 38)',
        '1.4 ISO/IEC 42001 & NIST AI RMF (4 Pilares)',
        '1.5 Resolução BCB nº 4.893 & RDC ANVISA nº 657',
      ],
    },
    {
      id: 2,
      title: 'Módulo 2: Anatomia de Agentes & OWASP Top 10',
      duration: '6 Horas',
      lessons: [
        '2.1 Da LLM aos Agentes Autônomos (CrewAI, LangGraph)',
        '2.2 Shadow AI na Prática: Rastreando Chamadas Ocultas',
        '2.3 Injeção de Prompt Direta e Indireta (OWASP LLM01)',
        '2.4 Model Context Protocol (MCP) & Permissões',
      ],
    },
    {
      id: 3,
      title: 'Módulo 3: Laboratório Prático Hands-On (ComplyPRO)',
      duration: '8 Horas',
      lessons: [
        '3.1 Ativação da Licença de 6 Meses da Ferramenta Light',
        '3.2 Escaneamento 100% Client-Side de Repositórios',
        '3.3 Mapeamento SIPOC de Agentes de IA',
        '3.4 Matriz RACI: Process Owners vs Technical Custodians',
      ],
    },
    {
      id: 4,
      title: 'Módulo 4: Governança de Runtime & FinOps',
      duration: '6 Horas',
      lessons: [
        '4.1 Human-in-the-Loop (HITL) Obrigatório (Art. 14)',
        '4.2 Circuit Breakers contra Loops Infinitos',
        '4.3 FinOps de Tokens: Cache Semântico e Alocação de Squads',
        '4.4 Quality Gates de Governança em CI/CD',
      ],
    },
    {
      id: 5,
      title: 'Módulo 5: Simulação Monte Carlo & Lentes C-Level',
      duration: '8 Horas',
      lessons: [
        '5.1 Falando a Língua dos C-Levels (CISO, DPO, CIO, CFO, Board)',
        '5.2 Simulação de Monte Carlo com 10.000 Cenários (VaR 95%)',
        '5.3 Calculando o ROI da Remediação Preventiva',
        '5.4 Pareceres para Seguradoras de Riscos Cibernéticos',
      ],
    },
    {
      id: 6,
      title: 'Módulo 6: Dossiês Formais & Certificação AIGOV™',
      duration: '6 Horas',
      lessons: [
        '6.1 Geração Automática do RIPD Oficial (Art. 38 LGPD)',
        '6.2 Dossiê Técnico do EU AI Act (Anexo IV)',
        '6.3 Projeto Prático Final com Repositório-Desafio',
        '6.4 Emissão da Certificação Profissional AIGOV™',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-[#111827] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">ComplyPRO Academy • Formação Executiva</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">
                  Certificação AIGOV™
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Especialista em Governança, Riscos & Auditoria de Agentes de IA (Do Código à Sala do Conselho)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6-Month License Benefit Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              Benefício Exclusivo do Aluno:
            </span>
            <span className="text-xs text-slate-600">
              6 Meses de Licença Integral da Ferramenta ComplyPRO Light Inclusos
            </span>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold rounded-lg">
            Ativação Hands-On Imediata
          </span>
        </div>

        {/* Content Tabs */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Carga Horária</span>
              <div className="text-lg font-black text-slate-900 font-mono">40 Horas</div>
              <p className="text-[10px] text-slate-500">24h Aulas + 16h Labs</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Formato Aulas</span>
              <div className="text-lg font-black text-slate-900 font-mono">Avatar HD</div>
              <p className="text-[10px] text-slate-500">Gravação Executiva</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Software Oficial</span>
              <div className="text-lg font-black text-slate-900 font-mono">6 Meses</div>
              <p className="text-[10px] text-slate-500">ComplyPRO Light Full</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-900 text-center space-y-0.5 shadow-sm">
              <span className="text-[10px] text-slate-300 font-bold uppercase">Certificação</span>
              <div className="text-lg font-black text-amber-400 font-mono">AIGOV™</div>
              <p className="text-[10px] text-slate-300">Selo Internacional</p>
            </div>
          </div>

          {/* Module Selector & Lessons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Module List Sidebar */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono block">
                Trilha Curricular (6 Módulos)
              </span>
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    activeModule === m.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-2">{m.title}</span>
                  <span className={`text-[10px] font-mono shrink-0 ${activeModule === m.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {m.duration}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Module Detail */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {modules.find(m => m.id === activeModule)?.title}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Carga Horária Estimada: {modules.find(m => m.id === activeModule)?.duration}
                  </span>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono bg-white text-slate-800 border border-slate-300 rounded font-bold">
                  Módulo {activeModule} de 6
                </span>
              </div>

              {/* Lesson Items */}
              <div className="space-y-2">
                {modules.find(m => m.id === activeModule)?.lessons.map((lesson, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-800 font-medium"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span>{lesson}</span>
                    </div>
                    <Video className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Included Kit Handouts */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-slate-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Kit do Aluno Completo Disponível:</span>
                <span className="text-slate-600">Templates de RIPD (LGPD Art. 38), Matriz RACI de Agentes e Scripts de CI/CD</span>
              </div>
            </div>
            <button
              onClick={() => alert('Os arquivos do curso foram gerados com sucesso na pasta /course do seu projeto!')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Pacote do Aluno</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
