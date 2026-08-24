import React from 'react';
import { ShieldCheck, Sparkles, Settings, FileText, Github, Terminal, Zap } from 'lucide-react';
import { Logo } from './Logo';
import { getSelectedModel, AVAILABLE_MODELS } from '../services/siliconflow';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenExport?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasScanResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenExport,
  activeTab,
  setActiveTab,
  hasScanResult,
}) => {
  const currentModelId = getSelectedModel();
  const currentModel = AVAILABLE_MODELS.find(m => m.id === currentModelId) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('scanner')} 
          className="cursor-pointer"
        >
          <Logo size="md" showTagline={true} />
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
            <span>Auditoria & Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Code Playground</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* AI Engine Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11.5px] font-medium text-slate-300">ComplyPRO AI Engine</span>
          </div>

          {/* Export Report button (if scan exists) */}
          {hasScanResult && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Exportar Relatório</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
            title="Configurações & Chaves de API"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/negraodenio/CompliancePRO"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            title="Código no GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
