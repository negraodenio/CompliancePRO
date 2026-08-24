import React, { useState } from 'react';
import { Settings, Sparkles, Key, Check, Github, Shield, Cpu } from 'lucide-react';
import { 
  getSiliconFlowApiKey, setSiliconFlowApiKey, 
  getSelectedModel, setSelectedModel, AVAILABLE_MODELS 
} from '../services/siliconflow';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setKey] = useState(getSiliconFlowApiKey());
  const [model, setModel] = useState(getSelectedModel());
  const [gitToken, setGitToken] = useState(() => localStorage.getItem('github_token') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSiliconFlowApiKey(apiKey);
    setSelectedModel(model);
    if (gitToken.trim()) {
      localStorage.setItem('github_token', gitToken.trim());
    } else {
      localStorage.removeItem('github_token');
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg bg-[#0e1424] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        
        <div className="flex items-start justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-300 border border-purple-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurações & Motor de IA</h3>
              <p className="text-[11px] text-slate-400">ComplyPRO AI Engine & GitHub API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* AI Engine API Key */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chave de Acesso do Motor IA (API Key):</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3.5 py-2.5 bg-[#080c16] rounded-xl border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[11px] text-slate-400">
            Sua chave está salva localmente no navegador e não é enviada para servidores de terceiros.
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modelo de IA Selecionado:</span>
          </label>

          <div className="space-y-2">
            {AVAILABLE_MODELS.map((m) => (
              <label
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                  model === m.id
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-glow-purple'
                    : 'bg-surface border-surface-border hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-300 rounded font-mono">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{m.description}</p>
                </div>
                <input
                  type="radio"
                  name="model_choice"
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="mt-1 accent-purple-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Optional GitHub Token */}
        <div className="space-y-2 pt-2 border-t border-surface-border">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span>GitHub Personal Access Token (Opcional):</span>
          </label>
          <input
            type="password"
            value={gitToken}
            onChange={(e) => setGitToken(e.target.value)}
            placeholder="ghp_... (apenas se atingir o limite público do GitHub)"
            className="w-full px-3.5 py-2 bg-[#080c16] rounded-xl border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-surface-border flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-surface-border"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-glow-purple cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Salvo!</span>
              </>
            ) : (
              <span>Salvar Configurações</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
