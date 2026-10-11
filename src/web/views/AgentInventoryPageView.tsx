import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Search, 
  Terminal, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { 
  AgentInventoryStore, 
  InventoryAgent, 
  InventoryMetrics,
  AgentGovernanceStatus,
  AgentRiskTier
} from '../services/agent-inventory-store';
import { AddAgentModal } from '../components/AddAgentModal';

interface AgentInventoryPageViewProps {
  onSelectAgent: (agentId: string) => void;
  onNavigateToDiscover: () => void;
  onNavigateToStudio: () => void;
  onNavigateToCockpit?: () => void;
  onNavigateToGovernance?: () => void;
}

export const AgentInventoryPageView: React.FC<AgentInventoryPageViewProps> = ({
  onSelectAgent,
  onNavigateToDiscover,
  onNavigateToStudio,
}) => {
  const [agents, setAgents] = useState<InventoryAgent[]>(() => AgentInventoryStore.getAgents());
  const [metrics, setMetrics] = useState<InventoryMetrics>(() => AgentInventoryStore.getMetrics());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GOVERNED' | 'NEEDS_REVIEW' | 'HIGH_RISK'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBackendData = () => {
    setIsLoading(true);
    setErrorMessage(null);
    AgentInventoryStore.fetchFromBackend()
      .then(() => {
        setAgents(AgentInventoryStore.getAgents());
        setMetrics(AgentInventoryStore.getMetrics());
      })
      .catch((err) => {
        setErrorMessage(err?.message || 'Error loading agent inventory');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadBackendData();
    const update = () => {
      setAgents(AgentInventoryStore.getAgents());
      setMetrics(AgentInventoryStore.getMetrics());
    };
    const unsub = AgentInventoryStore.subscribe(update);
    return unsub;
  }, []);

  // Map internal status to the 4 canonical governance states
  const getGovernanceDisplay = (status: AgentGovernanceStatus) => {
    switch (status) {
      case 'GOVERNED':
      case 'RUNNING':
        return { label: 'Governed', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700 dark:text-emerald-300' };
      case 'PAUSED':
      case 'IMPORTED':
      case 'DISCOVERED':
        return { label: 'Needs Review', dotClass: 'bg-amber-500', textClass: 'text-amber-700 dark:text-amber-300' };
      case 'BLOCKED':
        return { label: 'Blocked', dotClass: 'bg-rose-500', textClass: 'text-rose-700 dark:text-rose-300' };
      case 'UNKNOWN':
      default:
        return { label: 'Unknown', dotClass: 'bg-slate-400', textClass: 'text-slate-600 dark:text-slate-400' };
    }
  };

  const getRiskDisplay = (risk: AgentRiskTier) => {
    switch (risk) {
      case 'CRITICAL':
        return { label: 'CRITICAL', textClass: 'text-rose-600 dark:text-rose-400 font-bold' };
      case 'HIGH':
        return { label: 'HIGH', textClass: 'text-rose-600 dark:text-rose-400 font-semibold' };
      case 'MEDIUM':
        return { label: 'MEDIUM', textClass: 'text-amber-600 dark:text-amber-400 font-medium' };
      case 'LOW':
      default:
        return { label: 'LOW', textClass: 'text-slate-600 dark:text-slate-400 font-medium' };
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.owner.department && agent.owner.department.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'GOVERNED') {
      return agent.status === 'GOVERNED' || agent.status === 'RUNNING';
    }
    if (statusFilter === 'NEEDS_REVIEW') {
      return agent.status === 'PAUSED' || agent.status === 'IMPORTED' || agent.status === 'DISCOVERED' || agent.status === 'UNKNOWN';
    }
    if (statusFilter === 'HIGH_RISK') {
      return agent.risk === 'HIGH' || agent.risk === 'CRITICAL';
    }
    return true;
  });

  const needsReviewCount = metrics.needAttentionAgents + metrics.unknownAgents;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header: Clean, Human, Focused */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Agents
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            See what your agents can access, what they're allowed to do, and where attention is needed.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onNavigateToDiscover}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Discover
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Agent</span>
          </button>
        </div>
      </div>

      {/* Discrete 4 Indicators: Calm, Typographic, No Card Wall */}
      <div className="flex flex-wrap items-center gap-8 py-1">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {metrics.totalAgents}
          </div>
        </div>

        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Governed
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {metrics.governedAgents}
          </div>
        </div>

        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Needs Review
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {needsReviewCount}
          </div>
        </div>

        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            High Risk
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {metrics.highRiskAgents}
          </div>
        </div>
      </div>

      {/* Agent Table: Central Element */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agents, owners, frameworks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600"
            />
          </div>

          {/* Clean Segmented Filter */}
          <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto text-xs">
            {([
              { id: 'ALL', label: 'All' },
              { id: 'GOVERNED', label: 'Governed' },
              { id: 'NEEDS_REVIEW', label: 'Needs Review' },
              { id: 'HIGH_RISK', label: 'High Risk' }
            ] as const).map(flt => (
              <button
                key={flt.id}
                onClick={() => setStatusFilter(flt.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  statusFilter === flt.id
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && agents.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading agents...</span>
          </div>
        )}

        {errorMessage && agents.length === 0 && (
          <div className="p-6 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>
            <button
              onClick={loadBackendData}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-medium hover:bg-slate-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {agents.length === 0 && !isLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                No agents yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add your first AI agent to start governing access, risk and activity.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold transition"
              >
                Create Agent
              </button>
              <button
                onClick={onNavigateToDiscover}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Discover
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Framework</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Governance</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      No agents matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map(agent => {
                    const gov = getGovernanceDisplay(agent.status);
                    const risk = getRiskDisplay(agent.risk);

                    return (
                      <tr 
                        key={agent.id}
                        onClick={() => onSelectAgent(agent.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        {/* Agent */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {agent.name}
                          </div>
                          {agent.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {agent.description}
                            </div>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {agent.owner.name === 'Unknown' ? (
                            <span className="text-slate-400 italic">Unassigned</span>
                          ) : (
                            <div>
                              <span className="font-medium">{agent.owner.name}</span>
                              {agent.owner.department && (
                                <span className="text-[10px] text-slate-400 block">{agent.owner.department}</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Framework */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {agent.framework}
                        </td>

                        {/* Risk */}
                        <td className="py-3.5 px-4">
                          <span className={risk.textClass}>
                            {risk.label}
                          </span>
                        </td>

                        {/* Governance */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-2 h-2 rounded-full ${gov.dotClass}`} />
                            <span className={`font-medium ${gov.textClass}`}>{gov.label}</span>
                          </div>
                        </td>

                        {/* Last Activity */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {agent.lastActivity || 'Recently'}
                        </td>

                        {/* Action link */}
                        <td className="py-3.5 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors ml-auto" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectBuild={onNavigateToStudio}
        onSelectDiscover={onNavigateToDiscover}
        onAgentCreated={(newId) => onSelectAgent(newId)}
      />
    </div>
  );
};
