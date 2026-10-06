import React, { useState } from 'react';
import { Settings, Key, Check, Github, Cpu, X } from 'lucide-react';
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
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Settings</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">AI provider and repository credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Provider API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>AI Engine API Key:</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Stored locally in your browser session for client-side model analysis.
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Analysis Model:</span>
          </label>

          <div className="space-y-2">
            {AVAILABLE_MODELS.map((m) => (
              <label
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                  model === m.id
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-900 dark:border-slate-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{m.name}</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono border border-slate-200 dark:border-slate-700 font-bold">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{m.description}</p>
                </div>
                <input
                  type="radio"
                  name="model_choice"
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="mt-1 accent-slate-900 dark:accent-slate-100"
                />
              </label>
            ))}
          </div>
        </div>

        {/* GitHub Token (Optional) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span>GitHub Personal Access Token (Optional):</span>
          </label>
          <input
            type="password"
            value={gitToken}
            onChange={(e) => setGitToken(e.target.value)}
            placeholder="ghp_... (for private repositories or rate limits)"
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
