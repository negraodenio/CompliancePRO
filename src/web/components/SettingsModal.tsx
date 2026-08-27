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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5">
        
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <Settings className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Configurações & Motor de IA</h3>
              <p className="text-[11px] text-slate-500">ComplyPRO AI Engine & GitHub API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* AI Engine API Key */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Key className="w-3.5 h-3.5 text-slate-600" />
            <span>Chave de Acesso do Motor IA (API Key):</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
          />
          <p className="text-[11px] text-slate-500">
            Sua chave está salva localmente no navegador e não é enviada para servidores de terceiros.
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-600" />
            <span>Modelo de IA Selecionado:</span>
          </label>

          <div className="space-y-2">
            {AVAILABLE_MODELS.map((m) => (
              <label
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                  model === m.id
                    ? 'bg-slate-50 border-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{m.name}</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-700 rounded font-mono border border-slate-200 font-bold">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{m.description}</p>
                </div>
                <input
                  type="radio"
                  name="model_choice"
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="mt-1 accent-slate-900"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Optional GitHub Token */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Github className="w-3.5 h-3.5 text-slate-600" />
            <span>GitHub Personal Access Token (Opcional):</span>
          </label>
          <input
            type="password"
            value={gitToken}
            onChange={(e) => setGitToken(e.target.value)}
            placeholder="ghp_... (apenas se atingir o limite público do GitHub)"
            className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
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
