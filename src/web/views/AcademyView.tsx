import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Circle,
  PlayCircle,
  ExternalLink,
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  ListChecks,
  FileCheck2,
  Award,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  MessageSquareQuote,
  BookMarked,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  ACADEMY_MODULES,
  ACADEMY_LEVELS,
  ACADEMY_GLOSSARY,
  getAcademyModuleById,
  getNextAcademyModule,
  getPreviousAcademyModule,
  searchAcademyModules,
  getGlossaryEntries,
  AcademyStore,
  QUIZ_PASS_THRESHOLD
} from '../services/academy-store';
import type { AcademyModule, AcademyProgress, AcademyLevel } from '../data/academy';
import type { ActiveNavView } from '../components/AppShell';

interface AcademyViewProps {
  onNavigate: (view: ActiveNavView) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState<AcademyProgress>(() => AcademyStore.getProgress());
  const [activeModuleId, setActiveModuleId] = useState<string>(
    () => AcademyStore.getProgress().currentModuleId || ACADEMY_MODULES[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'percurso' | 'glossario'>('percurso');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(
    () => new Set([getAcademyModuleById(AcademyStore.getProgress().currentModuleId || ACADEMY_MODULES[0]?.id || '')?.levelNumber ?? 1])
  );
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [glossaryQuery, setGlossaryQuery] = useState('');

  const activeModule = getAcademyModuleById(activeModuleId) ?? ACADEMY_MODULES[0];
  const completionPercent = AcademyStore.getCompletionPercent(progress);
  const certificateEligible = AcademyStore.isCertificateEligible(progress);

  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    if (activeModule) {
      const updated = AcademyStore.setCurrentModule(activeModule.id);
      setProgress(updated);
    }
  }, [activeModuleId]);

  const searchResults = useMemo(() => searchAcademyModules(searchQuery), [searchQuery]);
  const glossaryEntries = useMemo(() => getGlossaryEntries(glossaryQuery), [glossaryQuery]);

  const selectModule = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setActiveTab('percurso');
    const mod = getAcademyModuleById(moduleId);
    if (mod) {
      setExpandedLevels((prev) => new Set([...Array.from(prev), mod.levelNumber]));
    }
  };

  const toggleLevel = (levelNumber: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelNumber)) next.delete(levelNumber);
      else next.add(levelNumber);
      return next;
    });
  };

  const isModuleCompleted = (moduleId: string): boolean =>
    progress.completedModuleIds.includes(moduleId);

  const isExerciseDone = (moduleId: string): boolean =>
    progress.exerciseDoneModuleIds.includes(moduleId);

  const handleQuizSubmit = () => {
    if (!activeModule) return;
    const correct = activeModule.knowledgeCheck.filter(
      (q) => quizAnswers[q.id] === q.correctIndex
    ).length;
    const score = Math.round((correct / activeModule.knowledgeCheck.length) * 100);
    setQuizSubmitted(true);
    setProgress(AcademyStore.recordQuizScore(activeModule.id, score));
  };

  const handleExerciseToggle = () => {
    if (!activeModule) return;
    const next = !isExerciseDone(activeModule.id);
    setProgress(AcademyStore.setExerciseDone(activeModule.id, next));
  };

  const handleResetProgress = () => {
    if (window.confirm('Repor todo o progresso da Academia? Esta ação não pode ser anulada.')) {
      const fresh = AcademyStore.resetProgress();
      setProgress(fresh);
      setActiveModuleId(fresh.currentModuleId);
    }
  };

  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameInput.trim() || !certificateEligible) return;
    setProgress(AcademyStore.issueCertificate(studentNameInput));
  };

  const quizScore = activeModule
    ? Math.round(
        (activeModule.knowledgeCheck.filter((q) => quizAnswers[q.id] === q.correctIndex).length /
          activeModule.knowledgeCheck.length) *
          100
      )
    : 0;

  const bestQuizScore = activeModule ? progress.quizBestScores[activeModule.id] ?? 0 : 0;
  const moduleReadyToComplete =
    activeModule && bestQuizScore >= QUIZ_PASS_THRESHOLD && isExerciseDone(activeModule.id);

  const renderLevelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout':
        return <Sparkles className="w-4 h-4" />;
      case 'Search':
        return <Search className="w-4 h-4" />;
      case 'Bot':
        return <GraduationCap className="w-4 h-4" />;
      case 'Shield':
        return <FileCheck2 className="w-4 h-4" />;
      case 'FolderCheck':
        return <ClipboardList className="w-4 h-4" />;
      case 'Award':
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white space-y-4 elevation-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-200">
              <GraduationCap className="w-4 h-4" />
              <span>ComplyPRO Academy</span>
            </div>
            <h1 className="text-2xl font-bold">Academia de Governação de Agentes de IA</h1>
            <p className="text-sm text-indigo-100 max-w-2xl">
              Percurso progressivo do primeiro acesso ao projeto final: processos e SIPOC, agentes,
              governação, evidências e auditoria — com exemplos do produto real.
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={() => {
                setStudentNameInput(progress.studentName || '');
                setShowCertificateModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold transition flex items-center space-x-2"
            >
              <Award className="w-4 h-4" />
              <span>{progress.certificateIssuedAt ? 'Ver Certificado' : 'Certificado'}</span>
            </button>
            <button
              onClick={handleResetProgress}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Repor progresso</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-indigo-100">
            <span>
              Progresso: <strong>{progress.completedModuleIds.length} de {ACADEMY_MODULES.length} módulos</strong>
              {progress.studentName ? ` • ${progress.studentName}` : ''}
            </span>
            <span className="font-bold">{completionPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar módulos, conceitos, terminologia…"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="text-xs text-indigo-100">
            {searchResults.length} módulo(s) correspondem a «{searchQuery}».
            {searchResults.length > 0 && (
              <span className="ml-2">
                {searchResults.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      selectModule(r.id);
                      setSearchQuery('');
                    }}
                    className="underline hover:text-white mr-3"
                  >
                    M{r.moduleNumber}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        {(
          [
            { id: 'percurso', label: 'Percurso de aprendizagem', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'glossario', label: 'Glossário técnico', icon: <BookMarked className="w-4 h-4" /> }
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'glossario' && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 elevation-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Glossário técnico</h2>
              <p className="text-xs text-slate-500">
                {glossaryEntries.length} termos — terminologia do produto e da governação de IA.
              </p>
            </div>
            <input
              type="text"
              value={glossaryQuery}
              onChange={(e) => setGlossaryQuery(e.target.value)}
              placeholder="Filtrar termos…"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {glossaryEntries.map((entry) => (
              <div
                key={entry.term}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{entry.term}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{entry.definition}</p>
                {entry.relatedModuleIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.relatedModuleIds.map((mid) => {
                      const m = getAcademyModuleById(mid);
                      return m ? (
                        <button
                          key={mid}
                          onClick={() => selectModule(mid)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold"
                        >
                          M{m.moduleNumber}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'percurso' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: curriculum levels */}
          <div className="lg:col-span-4 space-y-3">
            {ACADEMY_LEVELS.map((level: AcademyLevel) => {
              const isExpanded = expandedLevels.has(level.levelNumber);
              const levelModules = level.moduleIds
                .map((id) => getAcademyModuleById(id))
                .filter((m): m is AcademyModule => !!m);
              const levelCompleted = levelModules.filter((m) => isModuleCompleted(m.id)).length;
              return (
                <div
                  key={level.levelNumber}
                  className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden elevation-card"
                >
                  <button
                    onClick={() => toggleLevel(level.levelNumber)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center space-x-2.5 text-left">
                      <span className="text-indigo-600 dark:text-indigo-400">{renderLevelIcon(level.iconName)}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Nível {level.levelNumber} — {level.title}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {levelCompleted}/{levelModules.length} concluídos
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {levelModules.map((mod) => {
                        const isSelected = mod.id === activeModuleId;
                        const completed = isModuleCompleted(mod.id);
                        return (
                          <button
                            key={mod.id}
                            onClick={() => selectModule(mod.id)}
                            className={`w-full px-4 py-2.5 text-left transition ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 border-l-4 border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 min-w-0">
                                {completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    isSelected
                                      ? 'text-indigo-900 dark:text-indigo-200'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {mod.moduleNumber}. {mod.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                {mod.estimatedMinutes}min
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="text-[10px] text-slate-400 px-2 leading-relaxed">
              O progresso é guardado neste navegador. A conclusão de cada módulo exige quiz ≥{' '}
              {QUIZ_PASS_THRESHOLD}% e exercício prático marcado como concluído.
            </div>
          </div>

          {/* Right: active lesson */}
          {activeModule && (
            <div className="lg:col-span-8 space-y-4">
              {/* Lesson header */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 elevation-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <span>
                      Módulo {String(activeModule.moduleNumber).padStart(2, '0')} • Nível {activeModule.levelNumber} • {activeModule.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{activeModule.estimatedMinutes} min</span>
                    </span>
                    {isModuleCompleted(activeModule.id) && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Concluído</span>
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeModule.title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeModule.subtitle}</p>

                {activeModule.prerequisites.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    <strong>Pré-requisitos:</strong> {activeModule.prerequisites.join(' • ')}
                  </div>
                )}

                {activeModule.relatedNavView && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                      <PlayCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        Área real no produto: <strong>{activeModule.relatedNavLabel ?? activeModule.relatedNavView}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate(activeModule.relatedNavView!)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Learning objectives */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-2">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>Objetivos de aprendizagem</span>
                </div>
                <ul className="space-y-1.5">
                  {activeModule.learningObjectives.map((obj, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                      <span className="text-indigo-500 mt-0.5">▸</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concept explanation */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-3">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Explicação conceptual</span>
                </div>
                {activeModule.conceptExplanation.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              {/* Terminology */}
              {activeModule.terminology.length > 0 && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-3">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>Terminologia essencial</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {activeModule.terminology.map((t) => (
                      <div
                        key={t.term}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{t.term}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {t.definition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step by step */}
              {activeModule.stepByStep.length > 0 && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-3">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Demonstração passo a passo</span>
                  </div>
                  <ol className="space-y-2.5">
                    {activeModule.stepByStep.map((s, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{s.step}</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                            {s.detail}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Business example */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-sky-200 dark:border-sky-900/50 p-5 elevation-card space-y-2">
                <div className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  <span>Exemplo empresarial</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeModule.businessExample}
                </p>
              </div>

              {/* Common mistakes */}
              {activeModule.commonMistakes.length > 0 && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5 elevation-card space-y-3">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Erros frequentes e como os evitar</span>
                  </div>
                  <div className="space-y-2.5">
                    {activeModule.commonMistakes.map((cm, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40"
                      >
                        <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          ✗ {cm.mistake}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                          <strong className="text-emerald-700 dark:text-emerald-400">✓ Correção:</strong> {cm.correction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-5 elevation-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Exercício prático</span>
                  </div>
                  <button
                    onClick={handleExerciseToggle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 border ${
                      isExerciseDone(activeModule.id)
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isExerciseDone(activeModule.id) ? 'Concluído' : 'Marcar como concluído'}</span>
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeModule.exercise.goal}</p>
                <ol className="space-y-1.5">
                  {activeModule.exercise.steps.map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-px">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-200">
                  <strong>Critério de conclusão do exercício:</strong> {activeModule.exercise.doneCriterion}
                </div>
              </div>

              {/* Knowledge check */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Questionário de avaliação ({QUIZ_PASS_THRESHOLD}% para concluir)</span>
                  </div>
                  {bestQuizScore > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      Melhor pontuação: {bestQuizScore}%
                    </span>
                  )}
                </div>

                {activeModule.knowledgeCheck.map((q) => {
                  const selected = quizAnswers[q.id];
                  const isCorrect = selected === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border ${
                        quizSubmitted
                          ? isCorrect
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-900 dark:text-white mb-2">{q.question}</div>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <label
                            key={oi}
                            className={`flex items-start space-x-2 text-xs p-2 rounded-lg border cursor-pointer transition ${
                              selected === oi
                                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            } ${quizSubmitted ? 'pointer-events-none' : ''}`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={selected === oi}
                              onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                              className="mt-0.5"
                              disabled={quizSubmitted}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                      {quizSubmitted && (
                        <div className="mt-2 text-[11px] leading-relaxed">
                          <div className={`font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isCorrect ? '✓ Resposta correta' : `✗ Resposta incorreta — correta: ${q.options[q.correctIndex]}`}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 mt-1">{q.explanation}</div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < activeModule.knowledgeCheck.length}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition"
                  >
                    Submeter respostas ({Object.keys(quizAnswers).length}/{activeModule.knowledgeCheck.length})
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Pontuação: {quizScore}%{' '}
                      {quizScore >= QUIZ_PASS_THRESHOLD ? (
                        <span className="text-emerald-600 dark:text-emerald-400">— requisito atingido</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          — necessita de {QUIZ_PASS_THRESHOLD}%; reveja as explicações e repita
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    >
                      Repetir questionário
                    </button>
                  </div>
                )}
              </div>

              {/* Skills checklist */}
              {activeModule.skillsChecklist.length > 0 && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-2">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Competências adquiridas</span>
                  </div>
                  <ul className="space-y-1.5">
                    {activeModule.skillsChecklist.map((skill, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary + criterion + limitations */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 elevation-card space-y-3">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Resumo final
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activeModule.summary}</p>
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
                  <strong>Critério de conclusão:</strong> {activeModule.completionCriterion}
                </div>
                {activeModule.limitations && activeModule.limitations.length > 0 && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                    <strong>Limitações:</strong> {activeModule.limitations.join(' • ')}
                  </div>
                )}
                {moduleReadyToComplete && !isModuleCompleted(activeModule.id) && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                    ✓ Requisitos do módulo cumpridos — módulo marcado como concluído.
                  </div>
                )}
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between">
                {getPreviousAcademyModule(activeModule.id) ? (
                  <button
                    onClick={() => selectModule(getPreviousAcademyModule(activeModule.id)!.id)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition flex items-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>
                      Anterior: M{getPreviousAcademyModule(activeModule.id)!.moduleNumber}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {getNextAcademyModule(activeModule.id) ? (
                  <button
                    onClick={() => selectModule(getNextAcademyModule(activeModule.id)!.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <span>
                      Seguinte: M{getNextAcademyModule(activeModule.id)!.moduleNumber} —{' '}
                      {getNextAcademyModule(activeModule.id)!.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">
                    {certificateEligible
                      ? 'Percurso completo — emita o seu certificado.'
                      : 'Último módulo do percurso.'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 elevation-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-500" />
                <span>Certificado de Conclusão</span>
              </h3>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {certificateEligible ? (
              progress.certificateIssuedAt ? (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl border-2 border-indigo-300 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-[#111827] text-center space-y-3">
                    <GraduationCap className="w-10 h-10 mx-auto text-indigo-600 dark:text-indigo-400" />
                    <div className="text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                      ComplyPRO Academy
                    </div>
                    <div className="text-sm text-slate-500">Certificado de Conclusão do Percurso</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {progress.studentName || 'Formando'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Concluiu os {ACADEMY_MODULES.length} módulos do percurso de
                      <br />
                      Governação de Agentes de IA
                    </div>
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                      Emitido em {new Date(progress.certificateIssuedAt).toLocaleDateString('pt-PT')} • Ref.{' '}
                      {progress.certificateId}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong>Nota:</strong> este certificado é emitido pela própria plataforma ComplyPRO para
                    registar a conclusão do percurso formativo interno. Não possui valor de acreditação
                    externa, certificação profissional reconhecida por reguladores nem validade jurídica de
                    habilitação.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleIssueCertificate} className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Todos os {ACADEMY_MODULES.length} módulos concluídos. Introduza o nome a constar no certificado.
                  </p>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition"
                  >
                    Emitir certificado
                  </button>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Emitido pela plataforma ComplyPRO — sem valor de acreditação externa.
                  </p>
                </form>
              )
            ) : (
              <div className="space-y-3 text-center py-4">
                <Award className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  O certificado fica disponível quando os {ACADEMY_MODULES.length} módulos estiverem concluídos.
                </p>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {progress.completedModuleIds.length}/{ACADEMY_MODULES.length} módulos ({completionPercent}%)
                </div>
                <button
                  onClick={() => {
                    setShowCertificateModal(false);
                    const nextId = AcademyStore.getNextUncompletedModuleId(progress);
                    if (nextId) selectModule(nextId);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Continuar percurso
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
