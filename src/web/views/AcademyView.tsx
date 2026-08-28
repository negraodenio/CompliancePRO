import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ArrowRight,
  Award,
  RotateCcw,
  Sparkles,
  HelpCircle,
  PlayCircle,
  ExternalLink,
  Layers,
  Activity,
  Terminal,
  Bot,
  CheckSquare,
  AlertTriangle,
  Scale,
  LockKeyhole,
  FolderCheck,
  Zap,
  Server,
  Download,
  Share2,
  FileCheck,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import {
  ACADEMY_MODULES,
  AcademyModule,
  AcademyStore,
  AcademyProgress
} from '../services/academy-store';
import type { ActiveNavView } from '../components/AppShell';

interface AcademyViewProps {
  onNavigate: (view: ActiveNavView) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState<AcademyProgress>(() => AcademyStore.getProgress());
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    const p = AcademyStore.getProgress();
    return p.currentModuleId || 'mod-01';
  });

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showQuizFeedback, setShowQuizFeedback] = useState<Record<string, boolean>>({});
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState(progress.studentName || 'Enterprise AI Governance Operator');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Lab step completion tracker for Module 18
  const [completedLabSteps, setCompletedLabSteps] = useState<number[]>([]);

  useEffect(() => {
    const p = AcademyStore.getProgress();
    setProgress(p);
  }, [selectedModuleId]);

  const activeModule = useMemo(() => {
    return ACADEMY_MODULES.find(m => m.id === selectedModuleId) || ACADEMY_MODULES[0];
  }, [selectedModuleId]);

  const completionPercentage = useMemo(() => {
    return Math.round((progress.completedModuleIds.length / ACADEMY_MODULES.length) * 100);
  }, [progress.completedModuleIds]);

  const isCurrentModuleCompleted = useMemo(() => {
    return progress.completedModuleIds.includes(activeModule.id);
  }, [progress.completedModuleIds, activeModule.id]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckQuiz = (questionId: string) => {
    setShowQuizFeedback(prev => ({ ...prev, [questionId]: true }));
  };

  const handleCompleteCurrentModule = () => {
    const updated = AcademyStore.markModuleCompleted(activeModule.id, 100);
    setProgress(updated);

    if (updated.completedModuleIds.length === ACADEMY_MODULES.length) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setShowCertificateModal(true);
    } else {
      const currentIdx = ACADEMY_MODULES.findIndex(m => m.id === activeModule.id);
      if (currentIdx < ACADEMY_MODULES.length - 1) {
        setSelectedModuleId(ACADEMY_MODULES[currentIdx + 1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Tem certeza que deseja reiniciar o seu progresso no curso?')) {
      const initial = AcademyStore.resetProgress();
      setProgress(initial);
      setSelectedModuleId('mod-01');
      setSelectedAnswers({});
      setShowQuizFeedback({});
      setCompletedLabSteps([]);
    }
  };

  const handleSaveStudentName = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = AcademyStore.setStudentName(studentNameInput);
    setProgress(updated);
  };

  const toggleLabStep = (stepNumber: number) => {
    setCompletedLabSteps(prev => 
      prev.includes(stepNumber) ? prev.filter(s => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const filteredModules = useMemo(() => {
    return ACADEMY_MODULES.filter(m => {
      const matchCat = filterCategory === 'ALL' || m.category === filterCategory;
      const matchSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(m.moduleNumber).includes(searchTerm);
      return matchCat && matchSearch;
    });
  }, [filterCategory, searchTerm]);

  // Icon selector helper
  const renderCategoryIcon = (category: AcademyModule['category']) => {
    switch (category) {
      case 'FOUNDATIONS': return <LayoutDashboardIcon className="w-4 h-4 text-indigo-500" />;
      case 'DISCOVERY': return <Terminal className="w-4 h-4 text-sky-500" />;
      case 'GOVERNANCE': return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'OPERATIONS': return <Activity className="w-4 h-4 text-amber-500" />;
      case 'ASSURANCE': return <ShieldCheck className="w-4 h-4 text-cyan-500" />;
      case 'LAB': return <GraduationCap className="w-4 h-4 text-purple-500" />;
      default: return <BookOpen className="w-4 h-4 text-slate-500" />;
    }
  };

  function LayoutDashboardIcon(props: { className?: string }) {
    return <Layers {...props} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* 1. Header Banner & Progress Indicator */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-800/40 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-inner">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  CG-AG Academy — Enterprise AI Governance
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  18 MODULES • IN-PRODUCT
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Formação oficial de operadores e engenheiros de governança, conformidade e auditoria de IA.
              </p>
            </div>
          </div>

          {/* Quick Actions & Certification */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {progress.completedModuleIds.length === ACADEMY_MODULES.length && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center space-x-1.5 animate-pulse"
              >
                <Award className="w-4 h-4" />
                <span>Ver Certificado Oficial</span>
              </button>
            )}
            <button
              onClick={handleResetProgress}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
              title="Reiniciar progresso do curso"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetar</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-200 font-medium flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Progresso da Formação: <strong>{progress.completedModuleIds.length} de {ACADEMY_MODULES.length} Módulos Concluídos</strong></span>
            </span>
            <span className="font-mono font-bold text-indigo-300">{completionPercentage}% Concluído</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-indigo-900/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid: Modules Drawer (Left) & Active Module Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Modules Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Filters and Search */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5 elevation-card">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar módulo ou conceito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {['ALL', 'FOUNDATIONS', 'DISCOVERY', 'GOVERNANCE', 'OPERATIONS', 'ASSURANCE', 'LAB'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition ${
                    filterCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Module List */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 max-h-[750px] overflow-y-auto elevation-card">
            {filteredModules.map((mod) => {
              const isSelected = mod.id === selectedModuleId;
              const isDone = progress.completedModuleIds.includes(mod.id);

              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedModuleId(mod.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full p-3 rounded-xl text-left transition flex items-start space-x-3 border ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                      : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500'
                      }`}>
                        {mod.moduleNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                        MOD {String(mod.moduleNumber).padStart(2, '0')} • {mod.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{mod.estimatedMinutes} min</span>
                    </div>
                    <div className={`text-xs font-bold truncate mt-0.5 ${
                      isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {mod.title}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {mod.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Module Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Module Header */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 elevation-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {renderCategoryIcon(activeModule.category)}
                <span>MÓDULO {String(activeModule.moduleNumber).padStart(2, '0')} • {activeModule.category}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Duração Estimada: <strong>{activeModule.estimatedMinutes} minutos</strong></span>
                {isCurrentModuleCompleted && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Concluído</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeModule.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeModule.subtitle}
              </p>
            </div>

            {/* Quick Live Navigation Button */}
            {activeModule.relatedNavView && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                  <PlayCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Área Real no Sistema: <strong>{activeModule.relatedNavView}</strong></span>
                </div>
                <button
                  onClick={() => onNavigate(activeModule.relatedNavView!)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                >
                  <span>Abrir Tela Real</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Module 18 Special Component: 16-Step Guided Walkthrough */}
          {activeModule.id === 'mod-18' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-purple-200 dark:border-purple-900/50 p-6 elevation-card space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Esteira Prática de 16 Etapas (End-to-End Walkthrough)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Marque cada etapa conforme você executa no sistema para desbloquear a sua certificação final:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                {[
                  { step: 1, label: '1. Selecionar Repositório ou Demo', target: 'tools-scanner' as ActiveNavView },
                  { step: 2, label: '2. Executar Scan AST de Código', target: 'tools-scanner' as ActiveNavView },
                  { step: 3, label: '3. Examinar AI Inventory de Sistemas', target: 'discover-inventory' as ActiveNavView },
                  { step: 4, label: '4. Verificar Frota & Passports de Agentes', target: 'discover-agents' as ActiveNavView },
                  { step: 5, label: '5. Abrir Cadeia SIPOC do Agente', target: 'discover-agents' as ActiveNavView },
                  { step: 6, label: '6. Avaliar Conformidade nos 12 Controles', target: 'govern-controls' as ActiveNavView },
                  { step: 7, label: '7. Analisar Riscos no Risk Engine', target: 'govern-risk' as ActiveNavView },
                  { step: 8, label: '8. Revisar Frameworks & EU AI Act', target: 'govern-compliance' as ActiveNavView },
                  { step: 9, label: '9. Registrar Decisão no Decision Pipeline', target: 'operate-decisions' as ActiveNavView },
                  { step: 10, label: '10. Aprovar Gate Humano (HITL)', target: 'operate-approvals' as ActiveNavView },
                  { step: 11, label: '11. Acompanhar Ações de Remediação', target: 'operate-actions' as ActiveNavView },
                  { step: 12, label: '12. Inspecionar Failsafe e Incidentes', target: 'operate-incidents' as ActiveNavView },
                  { step: 13, label: '13. Monitorar FinOps & Consumo de Tokens', target: 'operate-runtime' as ActiveNavView },
                  { step: 14, label: '14. Inspecionar Evidência Canônica RFC 8785', target: 'assure-evidence' as ActiveNavView },
                  { step: 15, label: '15. Executar Verificação no Audit Ledger', target: 'assure-audit' as ActiveNavView },
                  { step: 16, label: '16. Emitir Dossiê Regulatório & RIPD', target: 'assure-reports' as ActiveNavView }
                ].map((item) => {
                  const isDone = completedLabSteps.includes(item.step);
                  return (
                    <div
                      key={item.step}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isDone
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/80'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => toggleLabStep(item.step)}
                        className="flex items-center space-x-2.5 text-left"
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                          isDone
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 text-transparent'
                        }`}>
                          ✓
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDone ? 'text-purple-950 dark:text-purple-200 line-through opacity-80' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {item.label}
                        </span>
                      </button>

                      <button
                        onClick={() => onNavigate(item.target)}
                        className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 text-purple-800 dark:text-purple-200 text-[10px] font-bold transition flex items-center space-x-1 shrink-0 ml-2"
                      >
                        <span>Ir ➔</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Core Instructional Sections (WHAT, WHY, HOW, USE, INTERPRET, ACT, AUDIT) */}
          <div className="space-y-4">
            
            {/* WHAT & WHY Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card space-y-2">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>1. O que é? (What is it?)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeModule.whatIsIt}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card space-y-2">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>2. Por que existe? (Why it exists?)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeModule.whyItExists}
                </p>
              </div>
            </div>

            {/* HOW IT WORKS Under the Hood */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card space-y-2.5">
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>3. Como funciona sob o capô? (How it works?)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {activeModule.howItWorks}
              </p>
            </div>

            {/* HOW TO USE Step-by-Step */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card space-y-3">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>4. Como utilizar no dia a dia? (Step-by-Step Guide)</span>
              </div>
              <div className="space-y-2">
                {activeModule.howToUse.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT YOU SEE & INTERPRETATION */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>5. O que você vê & Como interpretar os resultados?</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40">
                {activeModule.whatYouSee}
              </p>
              <div className="space-y-2">
                {activeModule.howToInterpret.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-2 font-mono">
                    <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CROSS-MODULE CONNECTIONS ARCHITECTURE */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-[#111827] dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 elevation-card space-y-3">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>6. Como este módulo se conecta aos outros menus? (Cross-Module Map)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeModule.crossModuleConnections.map((conn, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{conn.source}</span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {conn.relationship}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">➔ {conn.target}</span>
                      <button
                        onClick={() => onNavigate(conn.targetNavView)}
                        className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold transition flex items-center space-x-1"
                      >
                        <span>Abrir</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT TO DO AFTER & AUDITABILITY */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card space-y-2.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>7. O que fazer a seguir & Como comprovar em auditoria?</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {activeModule.howToProveAndAudit}
              </p>
            </div>
          </div>

          {/* 4. Interactive Knowledge Check (Quiz) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-indigo-200 dark:border-indigo-900/50 p-6 elevation-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Knowledge Check — Teste Rápido de Fixação</span>
              </div>
              <span className="text-[11px] text-slate-400">{activeModule.knowledgeCheck.length} questão(ões)</span>
            </div>

            <div className="space-y-6">
              {activeModule.knowledgeCheck.map((q, qIdx) => {
                const selected = selectedAnswers[q.id];
                const isChecked = showQuizFeedback[q.id];
                const isCorrect = selected === q.correctIndex;

                return (
                  <div key={q.id} className="space-y-3 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                        {qIdx + 1}
                      </span>
                      <span className="leading-relaxed">{q.question}</span>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 pl-7">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = selected === optIdx;
                        let optionStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400';

                        if (isChecked) {
                          if (optIdx === q.correctIndex) {
                            optionStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
                          } else if (isThisSelected && !isCorrect) {
                            optionStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isThisSelected) {
                          optionStyle = 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full p-2.5 rounded-lg border text-left text-xs transition flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {isChecked && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit / Check Button */}
                    <div className="pl-7 pt-1 flex items-center justify-between">
                      {!isChecked ? (
                        <button
                          disabled={selected === undefined}
                          onClick={() => handleCheckQuiz(q.id)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition"
                        >
                          Verificar Resposta
                        </button>
                      ) : (
                        <div className={`text-xs p-3 rounded-lg w-full ${
                          isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        }`}>
                          <div className="font-bold mb-1 flex items-center space-x-1.5">
                            <span>{isCorrect ? '✅ Resposta Correta!' : '❌ Incorreto.'}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Complete Module & Next Module Footer */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Conclusão do Módulo {activeModule.moduleNumber}
              </span>
              <span className="text-xs text-slate-500">
                {isCurrentModuleCompleted ? 'Este módulo já foi concluído com sucesso.' : 'Ao concluir, você avançará para o próximo módulo da formação.'}
              </span>
            </div>

            <button
              onClick={handleCompleteCurrentModule}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 shrink-0"
            >
              <span>{isCurrentModuleCompleted ? 'Avançar para Próximo Módulo' : 'Marcar como Concluído & Avançar'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Official Certificate of Completion Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-amber-500/40 shadow-2xl max-w-2xl w-full p-8 space-y-6 relative overflow-hidden">
            
            {/* Decorative Gold Header */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
            
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 text-amber-600 dark:text-amber-400 mb-1">
                <Award className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Certificado Oficial de Conclusão
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                CG-AG GOVERNANCE OS — OPERATOR FOUNDATION
              </p>
            </div>

            {/* Certificate Body Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-50/40 to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border border-amber-200/80 dark:border-amber-900/50 space-y-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold">
                Certificamos que
              </p>
              
              <form onSubmit={handleSaveStudentName} className="max-w-md mx-auto">
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="Seu Nome Completo ou Cargo"
                  className="w-full text-center text-lg font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-indigo-500 pb-1 focus:outline-hidden"
                />
              </form>

              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                concluiu com êxito todos os <strong>18 Módulos de Formação Prática</strong> do CG-AG Governance OS, dominando a esteira canônica de Governança, Ingestão AST, Riscos, Human-in-the-Loop, Evidências Canônicas RFC 8785 e Encadeamento no Audit Ledger.
              </p>

              {/* Verification Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200/60 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
                <div>
                  <span className="block font-bold text-slate-700 dark:text-slate-300">ID DO CERTIFICADO:</span>
                  <span>{progress.certificateId || 'CERT-CGAG-PROD-2026'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-700 dark:text-slate-300">DATA DE EMISSÃO:</span>
                  <span>{progress.certificateIssuedAt ? new Date(progress.certificateIssuedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
