import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Upload, 
  ArrowRight, 
  Cpu,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AgentInventoryStore, AgentRiskTier } from '../services/agent-inventory-store';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuild: () => void;
  onSelectDiscover: () => void;
  onAgentCreated?: (agentId: string) => void;
}

export const AddAgentModal: React.FC<AddAgentModalProps> = ({
  isOpen,
  onClose,
  onSelectDiscover,
  onAgentCreated
}) => {
  const [mode, setMode] = useState<'CHOICE' | 'BUILD' | 'BRING'>('CHOICE');

  // Agent form state
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerDept, setOwnerDept] = useState('Engineering');
  const [framework, setFramework] = useState('NVIDIA NeMo Agent Toolkit (NAT)');
  const [model, setModel] = useState('gpt-4o');
  const [risk, setRisk] = useState<AgentRiskTier>('HIGH');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateAgent = (e: React.FormEvent, isNativeBuild: boolean) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newAgent = AgentInventoryStore.addAgent({
      name: name.trim(),
      owner: {
        name: ownerName.trim() || 'AI Owner',
        role: 'Lead',
        department: ownerDept.trim() || 'Engineering'
      },
      framework: framework,
      model: model,
      risk: risk,
      status: isNativeBuild ? 'GOVERNED' : 'IMPORTED',
      description: description.trim() || (isNativeBuild 
        ? `Governed agent created with ComplyPRO native governance passport.`
        : `Agent ${name} connected to ComplyPRO governance perimeter.`)
    });

    setIsSubmitting(false);
    onClose();
    if (onAgentCreated) {
      onAgentCreated(newAgent.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Agent
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create an AI agent born governed or connect an existing one.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {mode === 'CHOICE' ? (
            <div className="space-y-4">
              <div 
                onClick={() => setMode('BUILD')}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Build with ComplyPRO
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-10 leading-relaxed">
                  Born governed. Created with a pre-configured Agent Passport, active Guardian boundaries, and automatic audit ledger.
                </p>
              </div>

              <div 
                onClick={() => setMode('BRING')}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                      Bring existing agent
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-10 leading-relaxed">
                  Connect an agent built outside ComplyPRO (CrewAI, LangGraph, NAT, or custom script) and issue a governing passport.
                </p>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    onClose();
                    onSelectDiscover();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Or scan code to discover agents automatically →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => handleCreateAgent(e, mode === 'BUILD')} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('CHOICE')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  ← Back to options
                </button>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {mode === 'BUILD' ? 'Build Governed Agent' : 'Connect Existing Agent'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Credit Approval, Customer Support, Research Assistant"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Owner
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Finance, Tech Lead"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Operations, Support"
                      value={ownerDept}
                      onChange={(e) => setOwnerDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Framework
                    </label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
                    >
                      <option value="NVIDIA NeMo Agent Toolkit (NAT)">NVIDIA NeMo Agent Toolkit (NAT)</option>
                      <option value="CrewAI">CrewAI</option>
                      <option value="LangGraph">LangGraph</option>
                      <option value="OpenAI Agents">OpenAI Agents</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
                    >
                      <option value="gpt-4o">GPT-4o (Model Gateway)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                      <option value="gpt-4o-mini">GPT-4o mini</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Risk Tier
                  </label>
                  <div className="flex items-center space-x-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(r => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRisk(r)}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer ${
                          risk === r 
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of what this agent is designed to do..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMode('CHOICE')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {mode === 'BUILD' ? 'Create Governed Agent' : 'Connect Agent'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
