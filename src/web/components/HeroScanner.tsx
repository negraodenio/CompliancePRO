import React, { useState, useRef } from 'react';
import { 
  Search, FolderUp, FileArchive, ArrowRight, Shield, 
  Sparkles, Landmark, Stethoscope, MessageSquare, CheckCircle, 
  Scale, BarChart3, Lock, Github, Cloud, Terminal, Cpu,
  RefreshCw, CheckCircle2, AlertTriangle, Layers, Database
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
  const [activeTab, setActiveTab] = useState<'github' | 'zip' | 'folder' | 'demo'>('github');
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
    <div className="pt-2 pb-6 px-1 sm:px-2 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Banner / Pill Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Motor AST Estático & Dinâmico</span>
        </div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold backdrop-blur-sm">
          <Scale className="w-3.5 h-3.5" />
          <span>13 Regulações Globais (EU AI Act, LGPD, NIST, OWASP)</span>
        </div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold backdrop-blur-sm">
          <Lock className="w-3.5 h-3.5" />
          <span>Zero Data Retention • Análise Local</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Governança, Riscos & Compliance para{' '}
          <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-400 dark:from-sky-400 dark:via-indigo-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Agentes e Modelos de IA
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
          Escaneie repositórios e codebases para descobrir <strong>Shadow AI</strong>, catalogar agentes em arquitetura SIPOC, mapear violações de conformidade e alimentar o plano de controle de governança.
        </p>
      </div>

      {/* Ingestion Workstation Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden elevation-card">
        
        {/* Ingestion Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-1.5 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('github')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'github'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Repositório GitHub</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'zip'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            <span>Arquivo .ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('folder')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'folder'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Pasta Local</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Cenários Demo</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: GITHUB */}
          {activeTab === 'github' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase font-mono">
                  URL do Repositório Git (Público ou Privado)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Github className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      placeholder="https://github.com/empresa/meu-projeto-ia"
                      disabled={isScanning}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/70 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isScanning || !gitUrl.trim()}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md shadow-sky-500/10 active:scale-[0.99]"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processando AST...</span>
                      </>
                    ) : (
                      <>
                        <span>Escanear Repositório</span>
                        <ArrowRight className="w-4 h-4 text-sky-200" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dica: Repositórios públicos do GitHub são analisados em tempo real na memória. Chamadas a modelos LLM, agentes, ferramentas MCP e credenciais são catalogados automaticamente.
              </p>
            </form>
          )}

          {/* TAB 2: ZIP ARCHIVE */}
          {activeTab === 'zip' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
            >
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                disabled={isScanning}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onScanZip(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileArchive className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Arraste e solte seu arquivo .ZIP aqui</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ou selecione um arquivo compactado contendo seu código-fonte para ingestão imediata
                </p>
              </div>
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={isScanning}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
              >
                <FileArchive className="w-4 h-4" />
                <span>Selecionar Arquivo .ZIP</span>
              </button>
            </div>
          )}

          {/* TAB 3: FOLDER */}
          {activeTab === 'folder' && (
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center text-center gap-3">
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                directory=""
                className="hidden"
                disabled={isScanning}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onScanFolder(e.target.files);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FolderUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Ingestão Direta de Pasta de Código</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione um diretório em sua máquina local. Nenhum dado é enviado para servidores externos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isScanning}
                className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
              >
                <FolderUp className="w-4 h-4" />
                <span>Escolher Pasta no Disco</span>
              </button>
            </div>
          )}

          {/* TAB 4: DEMO SCENARIOS */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Selecione um Cenário Corporativo Pré-Configurado
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">1-Click Live Ingestion</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Demo 1: FinTech */}
                <button
                  onClick={() => onSelectDemo(DEMO_PROJECTS[0])}
                  disabled={isScanning}
                  className="text-left p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        FinTech Credit Scoring
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      CrewAI + LangChain com decisões autônomas de crédito, scoring e alta criticidade financeira.
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-md">
                      ALTO RISCO • BCB / LGPD
                    </span>
                  </div>
                </button>

                {/* Demo 2: MedIA */}
                <button
                  onClick={() => onSelectDemo(DEMO_PROJECTS[1] || DEMO_PROJECTS[0])}
                  disabled={isScanning}
                  className="text-left p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        MedIA Diagnostic Assistant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Assistente médico com análise de sintomas, dados clínicos sensíveis e triagem automatizada.
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-md">
                      ALTO RISCO • EU AI ACT / ANVISA
                    </span>
                  </div>
                </button>

                {/* Demo 3: SmartCommerce */}
                <button
                  onClick={() => onSelectDemo(DEMO_PROJECTS[2] || DEMO_PROJECTS[0])}
                  disabled={isScanning}
                  className="text-left p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        SmartCommerce Support
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Chatbot com MCP tools, chamadas externas de API e validação contra vulnerabilidades OWASP.
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md">
                      OWASP LLM TOP 10
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Progress Bar */}
          {isScanning && (
            <div className="p-4 bg-sky-50/80 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-900/50 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-900 dark:text-sky-300 font-mono font-semibold flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
                  <span>{scanProgress.message || 'Analisando AST e regras de conformidade...'}</span>
                </span>
                <span className="text-sky-700 dark:text-sky-400 font-mono font-bold">{scanProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-sky-100 dark:bg-sky-950/80 rounded-full overflow-hidden border border-sky-200 dark:border-sky-800">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Transparência Auditável</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Metodologia de pontuação explicável com evidências criptográficas para auditoria.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">13 Regulações Globais</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Alinhamento direto a normas de IA, privacidade e segurança cibernética corporativa.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Relatórios Executivos</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Dossiês regulatórios, matrizes de risco e planos de remediação estruturados.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Privacidade & Segurança</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Análise local opcional. Seus dados e códigos nunca são usados para treinamento.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
