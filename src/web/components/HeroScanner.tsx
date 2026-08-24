import React, { useState, useRef } from 'react';
import { 
  Search, FolderUp, FileArchive, ArrowRight, Shield, 
  Sparkles, Landmark, Stethoscope, MessageSquare, CheckCircle, 
  Scale, BarChart3, Lock, Github, Cloud
} from 'lucide-react';
import { DEMO_PROJECTS, DemoProject } from '../services/demo-projects';

interface HeroScannerProps {
  onScanGitHub: (url: string) => void;
  onScanZip: (file: File) => void;
  onScanFolder: (fileList: FileList) => void;
  onSelectDemo: (demo: DemoProject) => void;
  isScanning: boolean;
  scanProgress: { message: string; percent: number };
}

export const HeroScanner: React.FC<HeroScannerProps> = ({
  onScanGitHub,
  onScanZip,
  onScanFolder,
  onSelectDemo,
  isScanning,
  scanProgress,
}) => {
  const [gitUrl, setGitUrl] = useState('https://github.com/negraodenio/CompliancePRO');
  const [isDragOver, setIsDragOver] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gitUrl.trim()) {
      onScanGitHub(gitUrl.trim());
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        onScanZip(file);
      } else {
        onScanFolder(e.dataTransfer.files);
      }
    }
  };

  return (
    <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Top Pill Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          <span>Motor 100% Gratuito & Independente</span>
          <span className="text-slate-300">|</span>
          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
          <span>Auditoria de 13 Regulações</span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5 mb-8">
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
          Governança, Riscos & Compliance <br className="hidden sm:block" />
          para <span className="font-sans font-extrabold text-[#2c4c7c]">Agentes e Modelos de IA</span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Escaneie repositórios para descobrir <strong>Shadow AI</strong>, avaliar conformidade com <br className="hidden sm:block" />
          <strong>EU AI Act, LGPD, GDPR, NIST AI RMF, ISO 42001 e OWASP</strong>, e gerar correções com inteligência artificial.
        </p>
      </div>

      {/* Main Scanner Box (Crisp White Executive Card) */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          
          {/* GitHub URL Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase font-mono">
              Repositório Git
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Github className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={isScanning}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning || !gitUrl.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <span>Escanear Repositório</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Drag & Drop or Upload bar */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`p-3 rounded-xl border border-dashed transition-all flex flex-wrap items-center justify-between text-xs gap-3 ${
              isDragOver ? 'border-slate-400 bg-slate-100' : 'border-slate-300 bg-slate-50/70'
            }`}
          >
            <div className="flex items-center space-x-2 text-slate-600">
              <Cloud className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Ou analise localmente sem subir para a nuvem: <strong>arraste pasta ou .zip aqui</strong></span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={(e) => e.target.files?.[0] && onScanZip(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={isScanning}
                className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer font-medium"
              >
                <FileArchive className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload .ZIP</span>
              </button>

              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                onChange={(e) => e.target.files && onScanFolder(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isScanning}
                className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer font-medium"
              >
                <FolderUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Selecionar Pasta</span>
              </button>
            </div>
          </div>

          {/* Scanning Progress Bar */}
          {isScanning && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-mono font-medium flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800 animate-pulse" />
                  <span>{scanProgress.message}</span>
                </span>
                <span className="text-slate-600 font-mono">{scanProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Demo Projects Quick Start */}
        <div className="mt-8">
          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Experimente com 1 clique (Projetos de Demonstração)
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Demo 1: FinTech */}
            <button
              onClick={() => onSelectDemo(DEMO_PROJECTS[0])}
              disabled={isScanning}
              className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <Landmark className="w-5 h-5 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    FinTech Credit Scoring Multi-Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sistema com CrewAI e LangChain tomando decisões autônomas de crédito e scoring.
                </p>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded">
                  RISCO ALTO - BCB / LGPD
                </span>
              </div>
            </button>

            {/* Demo 2: MedIA */}
            <button
              onClick={() => onSelectDemo(DEMO_PROJECTS[1] || DEMO_PROJECTS[0])}
              disabled={isScanning}
              className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <Stethoscope className="w-5 h-5 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                    MedIA Diagnostic Assistant
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Assistente médico para análise de exames clínicos, sintomas e triagem de pacientes com IA.
                </p>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded">
                  ALTO RISCO - EU AI ACT & ANVISA
                </span>
              </div>
            </button>

            {/* Demo 3: SmartCommerce */}
            <button
              onClick={() => onSelectDemo(DEMO_PROJECTS[2] || DEMO_PROJECTS[0])}
              disabled={isScanning}
              className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <MessageSquare className="w-5 h-5 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                    SmartCommerce Customer Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Chatbot de suporte com prompt injection vulnerabilities, MCP tools e integração com APIs.
                </p>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                  OWASP LLM TOP 10
                </span>
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* Feature Highlights Grid (Sober Executive 4-Column Bottom) */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto pt-8 border-t border-slate-200">
        
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Transparência Auditável</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Metodologia de pontuação pública e explicável para CISOs, DPOs e Auditores.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Scale className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">13 Regulações Suportadas</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Avaliação alinhada às principais normas de IA, privacidade, segurança e governança.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <BarChart3 className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Relatórios Executivos</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dashboards claros, evidências rastreáveis e planos de ação priorizados.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Lock className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Privacidade & Segurança</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Análise local opcional. Seus dados não são armazenados nem utilizados para treinamento.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
