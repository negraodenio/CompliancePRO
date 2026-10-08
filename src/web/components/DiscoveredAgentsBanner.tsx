import React, { useState } from 'react';
import { 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Plus, 
  Eye, 
  Check 
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { AgentInventoryStore } from '../services/agent-inventory-store';

interface DiscoveredAgentsBannerProps {
  scanResult: ScannerResult;
  onNavigateToAgent: (agentId: string) => void;
  onNavigateToInventory: () => void;
}

export const DiscoveredAgentsBanner: React.FC<DiscoveredAgentsBannerProps> = ({
  scanResult,
  onNavigateToAgent,
  onNavigateToInventory
}) => {
  const [importedIds, setImportedIds] = useState<Record<string, string>>({});
  const [ignoredNames, setIgnoredNames] = useState<Record<string, boolean>>({});
  const [reviewedName, setReviewedName] = useState<string | null>(null);
  const [isImportingAll, setIsImportingAll] = useState(false);

  const rawAgents = scanResult.source?.agents || [];
  const repoName = scanResult.repo?.name || 'Local Repository';

  const visibleAgents = rawAgents.filter(a => !ignoredNames[a.name]);

  const handleImportSingle = async (agent: any, idx: number) => {
    try {
      const [newAgent] = await AgentInventoryStore.importFromScanResult({
        ...scanResult, source: {...scanResult.source, agents:[{...agent,name:agent.name || `Discovered Agent ${idx + 1}`}]} as ScannerResult['source']
      });
      setImportedIds(prev => ({ ...prev, [agent.name]: newAgent.id }));
    } catch {
      window.alert('Agent import could not be confirmed. Please retry when the backend is available.');
    }
  };

  const handleImportAll = async () => {
    setIsImportingAll(true);
    try {
      const imported = await AgentInventoryStore.importFromScanResult(scanResult);
      const idMap: Record<string, string> = {};
      imported.forEach(a => { idMap[a.name] = a.id; });
      setImportedIds(prev => ({ ...prev, ...idMap }));
    } catch {
      window.alert('Inventory import could not be confirmed. Please retry; confirmed records will not be duplicated.');
    } finally {
      setIsImportingAll(false);
    }
  };

  const handleIgnore = (agentName: string) => {
    setIgnoredNames(prev => ({ ...prev, [agentName]: true }));
    if (reviewedName === agentName) setReviewedName(null);
  };

  if (visibleAgents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Discovered Agents ({visibleAgents.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review discovered agents and bring them under ComplyPRO governance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleImportAll}
            disabled={isImportingAll}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Add All to Inventory
          </button>
          <button
            onClick={onNavigateToInventory}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            View Inventory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {visibleAgents.map((agent, idx) => {
          const isImported = Boolean(importedIds[agent.name]);
          const targetId = importedIds[agent.name];
          const isReviewed = reviewedName === agent.name;
          const isHighRisk = agent.riskLevel === 'critical' || agent.riskLevel === 'high';

          return (
            <div 
              key={agent.name || idx}
              className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    {agent.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span>{agent.framework || 'Framework detected'}</span>
                    <span> · </span>
                    <span>{(agent as any).model || 'gpt-4o'}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  isHighRisk 
                    ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800'
                }`}>
                  {isHighRisk ? 'HIGH RISK' : 'MEDIUM RISK'}
                </span>
              </div>

              {/* Review details drawer (Progressive disclosure) */}
              {isReviewed && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Detected Capabilities:
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>Tools: {(agent.tools || ['API call', 'Read database']).join(', ')}</div>
                    <div>Source: {agent.filePath || repoName}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Add to Inventory, Review, Ignore */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                {isImported ? (
                  <button
                    onClick={() => onNavigateToAgent(targetId)}
                    className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In Inventory →</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleImportSingle(agent, idx)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded transition"
                  >
                    Add to Inventory
                  </button>
                )}

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setReviewedName(isReviewed ? null : agent.name)}
                    className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-xs transition"
                  >
                    {isReviewed ? 'Hide Details' : 'Review'}
                  </button>

                  <button
                    onClick={() => handleIgnore(agent.name)}
                    className="px-2 py-1 text-slate-400 hover:text-rose-600 text-xs transition"
                    title="Ignore this agent"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
