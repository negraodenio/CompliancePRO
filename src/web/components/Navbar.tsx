import React from 'react';
import { ShieldCheck, Sparkles, Settings, FileText, Github, Terminal, Zap, GraduationCap } from 'lucide-react';
import { Logo } from './Logo';
import { getSelectedModel, AVAILABLE_MODELS } from '../services/siliconflow';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenExport?: () => void;
  onOpenAcademy?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasScanResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenExport,
  onOpenAcademy,
  activeTab,
  setActiveTab,
  hasScanResult,
}) => {
  const currentModelId = getSelectedModel();
  const currentModel = AVAILABLE_MODELS.find(m => m.id === currentModelId) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('scanner')} 
          className="cursor-pointer flex items-center space-x-2"
        >
          <Logo size="md" showTagline={true} />
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'scanner' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Auditoria & Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Terminal className={`w-3.5 h-3.5 ${activeTab === 'playground' ? 'text-purple-600' : 'text-slate-500'}`} />
            <span>Code Playground</span>
          </button>

          {onOpenAcademy && (
            <button
              onClick={onOpenAcademy}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 text-amber-700 bg-amber-50/80 hover:bg-amber-100/80 hover:text-amber-900 cursor-pointer border border-amber-200/70 shadow-2xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              <span>Curso & Certificação</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* AI Engine Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 font-semibold shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11.5px]">ComplyPRO AI Engine</span>
          </div>

          {/* Export Report button (if scan exists) */}
          {hasScanResult && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition-colors flex items-center space-x-2 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Exportar Relatório</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
            title="Configurações & Chaves de API"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/negraodenio/CompliancePRO"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-all shadow-2xs"
            title="Código no GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
