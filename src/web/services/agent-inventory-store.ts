/**
 * ComplyPRO.pt — Agent Inventory Store
 * 
 * Central entity store for the Agent-Centric product model:
 * DISCOVER -> UNDERSTAND -> GOVERN -> PROVE
 * 
 * Tagline:
 * "Saiba que agentes existem.
 *  Saiba o que eles podem fazer.
 *  Controle o que lhes é permitido.
 *  Prove o que realmente fizeram."
 */

import type { ScannerResult } from '../../core/types';
import { ScanGovernanceBridge } from './scan-governance-bridge';
import { PersistenceAdapter } from './persistence-adapter';
import { governanceHeaders } from './governance-fetch';

export type AgentGovernanceStatus = 
  | 'UNKNOWN' 
  | 'DISCOVERED' 
  | 'IMPORTED' 
  | 'GOVERNED' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'BLOCKED' 
  | 'REVOKED';

export type AgentRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentAccessModel {
  name: string;
  allowed: boolean;
  provider: string;
}

export interface AgentAccessData {
  name: string;
  allowed: boolean;
  classification: string;
}

export interface AgentAccessTool {
  name: string;
  status: 'ALLOW' | 'HITL' | 'BLOCKED';
  boundary: string;
}

export interface AgentAccessConfig {
  models: AgentAccessModel[];
  data: AgentAccessData[];
  tools: AgentAccessTool[];
  network: {
    directInternet: boolean;
    description: string;
  };
  secrets: {
    directAccess: boolean;
    description: string;
  };
}

export interface AgentRiskDetails {
  riskTier: AgentRiskTier;
  riskFactors: string[];
  dataClassification: string;
  highRiskCapabilities: string[];
  openFindings: number;
  unknowns: string[];
}

export interface AgentGovernanceDetails {
  complianceProfile: string;
  passportStatus: 'VERIFIED' | 'PROVISIONAL' | 'REVOKED' | 'NOT_ISSUED';
  passportId: string;
  passportFingerprint: string;
  guardianStatus: 'ACTIVE' | 'MONITOR_ONLY' | 'DISABLED';
  policyVersion: string;
  hitlRules: string[];
  capabilitiesCount: number;
  governanceStatus: AgentGovernanceStatus;
}

export interface AgentActivityItem {
  id: string;
  timestamp: string;
  type: 'EXECUTION' | 'DECISION' | 'HITL' | 'BLOCKED' | 'EVIDENCE';
  summary: string;
  verdict?: 'ALLOW' | 'REQUIRE_HITL' | 'BLOCK' | 'APPROVED' | 'REJECTED';
  evidenceHash?: string;
}

export interface InventoryAgent {
  id: string;
  name: string;
  owner: {
    name: string;
    role: string;
    department: string;
  };
  framework: string;
  frameworkVersion: string;
  model: string;
  status: AgentGovernanceStatus;
  risk: AgentRiskTier;
  complianceProfile: string;
  created: string;
  lastActivity: string;
  description: string;
  access: AgentAccessConfig;
  riskDetails: AgentRiskDetails;
  governance: AgentGovernanceDetails;
  activity: AgentActivityItem[];
}

export interface InventoryMetrics {
  totalAgents: number;
  governedAgents: number;
  needAttentionAgents: number;
  unknownAgents: number;
  highRiskAgents: number;
  blockedActions: number;
  hitlPending: number;
}

const STORAGE_KEY = 'complypro_agent_inventory_v2';

const INITIAL_CANONICAL_AGENTS: InventoryAgent[] = [];

const isMockAgent = (a: any): boolean => {
  if (!a) return true;
  if (typeof a.id === 'string' && a.id.startsWith('canonical_')) return true;
  const ownerName = String(a.owner?.name || '').toLowerCase();
  const mockNames = ['joão', 'maria', 'pedro', 'carlos', 'ana', 'beatriz', 'ricardo', 'sofia', 'lucas', 'alexandre'];
  if (mockNames.some(m => ownerName.includes(m))) return true;
  return false;
};

export class AgentInventoryStore {
  private static agents: InventoryAgent[] = [];
  private static listeners: Array<() => void> = [];
  private static isInitialized = false;
  private static activeScope = '';
  private static serverMetrics: InventoryMetrics | null = null;

  static initialize() {
    const scope = PersistenceAdapter.buildScopedKey('agent_inventory', STORAGE_KEY);
    if (this.isInitialized && this.activeScope === scope) return;
    this.activeScope = scope;
    this.agents = [];
    this.serverMetrics = null;

    // Browser caches and scan drafts are not authoritative inventory records.
    this.isInitialized = true;
  }

  static async fetchFromBackend(authHeader?: string, tenantHeader?: string): Promise<InventoryAgent[]> {
    this.initialize();
    if (typeof fetch === 'undefined') throw new Error('AUTHORITATIVE_INVENTORY_TRANSPORT_UNAVAILABLE');
    const scope = this.activeScope;

    try {
      const headers: Record<string, string> = governanceHeaders();
      if (authHeader) headers['Authorization'] = authHeader;
      if (tenantHeader) headers['x-tenant-id'] = tenantHeader;

      const res = await fetch('/api/v1/agents', { headers });
      if (!res.ok) throw new Error(`Authoritative inventory unavailable: HTTP ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data.agents)) throw new Error('AUTHORITATIVE_INVENTORY_RESPONSE_INVALID');
      const backendAgents = data.agents;
      if (PersistenceAdapter.buildScopedKey('agent_inventory', STORAGE_KEY) !== scope) {
        this.initialize();
        return [...this.agents];
      }

      const mappedAgents: InventoryAgent[] = backendAgents.map((ag: any) => {
        const governed = ag.passportVerified === true && ag.passport?.status === 'GOVERNED';
        const status = ag.passport?.status === 'REVOKED' ? 'REVOKED' : ag.status === 'PROVISIONED'
          ? (governed ? 'GOVERNED' : 'UNKNOWN') : ag.status || 'UNKNOWN';
        const tools = (ag.passport?.declaredTools || ag.discovery?.tools || []).map((t: string) => ({
          name: t,
          status: (!governed ? 'BLOCKED' : t.includes('approve') || t.includes('transfer') ? 'HITL' : t.includes('prohibit') || t.includes('admin') ? 'BLOCKED' : 'ALLOW') as any,
          boundary: 'Governed Runtime'
        }));

        const ownerName = ag.owner?.name || (typeof ag.owner === 'string' ? ag.owner : 'Unknown');
        const ownerRole = ag.owner?.role || (ownerName !== 'Unknown' ? 'Assigned AI Owner' : 'Not assigned');
        const ownerDept = ag.owner?.department || 'Unassigned';

        return {
          id: ag.agentId,
          name: ag.name,
          owner: {
            name: ownerName,
            role: ownerRole,
            department: ownerDept
          },
           framework: ag.framework?.name || 'Unknown',
           frameworkVersion: ag.framework?.version || 'Unknown',
           model: ag.passport?.declaredModels?.[0] || ag.discovery?.models?.[0] || 'Unknown',
           status: status as AgentGovernanceStatus,
           risk: (ag.passport?.riskTier || ag.discovery?.risk || 'MEDIUM') as AgentRiskTier,
          complianceProfile: ag.complianceProfileId || ag.complianceProfileChecksum || 'CP-COMPILED',
          created: ag.createdAt ? ag.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
           lastActivity: ag.lastActivity || 'No runtime activity reported',
          description: ag.description || `Agente corporativo registrado no ComplyPRO.`,
          access: {
             models: (ag.passport?.declaredModels || ag.discovery?.models || []).map((m: string) => ({
              name: m,
               allowed: governed,
              provider: 'Model Gateway'
            })),
             data: (ag.passport?.declaredDataScopes || []).map((d: string) => ({
              name: d,
              allowed: governed,
              classification: 'Internal'
            })),
             tools,
            network: { directInternet: false, description: 'Gateway-mediated access; OS isolation not verified.' },
            secrets: { directAccess: false, description: 'Credentials remain in server-side gateways; OS isolation not verified.' }
          },
          riskDetails: {
            riskTier: ag.passport?.riskTier || 'MEDIUM',
            riskFactors: [`Perfil de governança ativo: ${ag.complianceProfileId || 'Standard'}`],
            dataClassification: 'Interno',
            highRiskCapabilities: tools.filter((t: any) => t.status === 'HITL').map((t: any) => t.name),
          openFindings: ag.discovery?.openFindings || 0,
            unknowns: ownerName === 'Unknown' ? ['Responsável formal não atribuído'] : []
          },
          governance: {
            complianceProfile: ag.complianceProfileId || 'CP-COMPILED',
             passportStatus: !ag.passport ? 'NOT_ISSUED' : ag.passport.status === 'REVOKED' ? 'REVOKED' : ag.passportVerified ? 'VERIFIED' : 'PROVISIONAL',
             passportId: ag.passportId || ag.passport?.passportId || '',
             passportFingerprint: ag.passportFingerprint || ag.passport?.passportFingerprint || '',
             guardianStatus: ag.guardianStatus || 'MONITOR_ONLY',
            policyVersion: '1.0.0',
            hitlRules: ['Operações privilegiadas requerem autorização humana'],
            capabilitiesCount: ag.governedCapabilities || tools.length,
            governanceStatus: status as AgentGovernanceStatus
          },
          activity: []
        };
      });

      this.agents = mappedAgents;
      this.serverMetrics = null;

      // Also fetch real backend metrics from EvidenceLedger and DurableStore
      try {
        const metricsRes = await fetch('/api/v1/agents/metrics', { headers });
        if (metricsRes.ok) {
          const mData = await metricsRes.json();
          this.serverMetrics = {
            totalAgents: mData.totalAgents ?? this.agents.length,
            governedAgents: mData.governedAgents ?? 0,
            needAttentionAgents: mData.needAttentionAgents ?? 0,
            unknownAgents: mData.unknownAgents ?? 0,
            highRiskAgents: mData.highRiskAgents ?? 0,
            blockedActions: mData.blockedActions ?? 0,
            hitlPending: mData.hitlPending ?? 0
          };
        }
      } catch {
        // Fall back to local calculation if metrics endpoint is unavailable
      }

      if (PersistenceAdapter.buildScopedKey('agent_inventory', STORAGE_KEY) !== scope) {
        this.initialize();
        return [...this.agents];
      }

      this.persist();
      this.notify();
    } catch (e) {
      if (this.activeScope === scope) {
        this.agents = [];
        this.serverMetrics = null;
        this.notify();
      }
      console.warn('[AgentInventoryStore] Backend fetch error:', e);
      throw e;
    }

    return [...this.agents];
  }

  static async updateAgent(id: string, updates: Partial<InventoryAgent>) {
    const response=await fetch(`/api/v1/agents/${encodeURIComponent(id)}`,{method:'PATCH',
      headers:{...governanceHeaders(),'Content-Type':'application/json'},body:JSON.stringify(updates)});
    if(!response.ok) throw new Error(`Agent update was not persisted: HTTP ${response.status}`);
    await this.fetchFromBackend();
  }

  static getAgents(): InventoryAgent[] {
    this.initialize();
    return [...this.agents];
  }

  static getAgent(id: string): InventoryAgent | undefined {
    this.initialize();
    return this.agents.find(a => a.id === id);
  }

  static async addAgent(agent: Partial<InventoryAgent> & { name: string }): Promise<InventoryAgent> {
    const response = await fetch('/api/v1/agents/import',{method:'POST',
      headers:{...governanceHeaders(),'Content-Type':'application/json'}, body:JSON.stringify({
        name:agent.name,framework:agent.framework || 'Unknown',models:agent.model ? [agent.model] : [],
        owner:agent.owner,description:agent.description,risk:agent.risk
      })});
    if (!response.ok) throw new Error(`Import was not persisted: HTTP ${response.status}`);
    const saved = await response.json();
    const mapped = await this.fetchFromBackend();
    const confirmed = mapped.find(item=>item.id===saved.agentId);
    if (!confirmed) throw new Error('IMPORTED_AGENT_NOT_IN_AUTHORITATIVE_INVENTORY');
    return confirmed;
  }

  private static stageAgent(agent: Partial<InventoryAgent> & { name: string }): InventoryAgent {
    this.initialize();

    const id = agent.id || ('agt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));
    const newAgent: InventoryAgent = {
      id,
      name: agent.name,
      owner: agent.owner || {
        name: 'Unknown',
        role: 'Not assigned',
        department: 'Unassigned'
      },
      framework: agent.framework || 'Unknown',
      frameworkVersion: agent.frameworkVersion || 'Unknown',
      model: agent.model || 'Unknown',
      status: agent.status || 'IMPORTED',
      risk: agent.risk || 'HIGH',
      complianceProfile: agent.complianceProfile || 'Not assigned',
      created: agent.created || new Date().toISOString().split('T')[0],
      lastActivity: 'Criado agora',
      description: agent.description || `Agente ${agent.name} registrado no ComplyPRO.`,
      access: agent.access || {
        models: agent.model ? [{ name: agent.model, allowed: false, provider: 'Not provisioned' }] : [],
        data: [],
        tools: [],
        network: { directInternet: false, description: 'Runtime isolation not verified; provisioning required.' },
        secrets: { directAccess: false, description: 'Gateway credential boundary not verified.' }
      },
      riskDetails: agent.riskDetails || {
        riskTier: agent.risk || 'HIGH',
        riskFactors: ['Unprovisioned inventory record; governance review required'],
        dataClassification: 'Unknown',
        highRiskCapabilities: [],
        openFindings: 0,
        unknowns: ['No authoritative runtime or passport has been issued']
      },
      governance: agent.governance || {
        complianceProfile: agent.complianceProfile || 'Not assigned',
        passportStatus: 'NOT_ISSUED',
        passportId: '',
        passportFingerprint: '',
        guardianStatus: 'MONITOR_ONLY',
        policyVersion: 'Not assigned',
        hitlRules: [],
        capabilitiesCount: agent.access?.tools?.length || 0,
        governanceStatus: agent.status || 'IMPORTED'
      },
      activity: agent.activity || []
    };

    this.agents.unshift(newAgent);
    this.persist();
    this.notify();
    return newAgent;
  }

  static async updateAgentStatus(id: string, status: AgentGovernanceStatus) {
    await this.updateAgent(id, {status});
  }

  static async importFromScanResult(result: ScannerResult): Promise<InventoryAgent[]> {
    const imported: InventoryAgent[] = [];
    for (const agent of result.source?.agents || []) {
      const response = await fetch('/api/v1/agents/import',{method:'POST',headers:{...governanceHeaders(),'Content-Type':'application/json'},
        body:JSON.stringify({name:agent.name,framework:agent.framework || 'Unknown',sourceRepository:result.repo?.fullName || result.repo?.name,
          sourcePath:agent.filePath,description:agent.businessPurpose,tools:agent.tools || [],risk:agent.riskLevel?.toUpperCase(),
          openFindings:result.violations?.length || 0,owner:result.owner ? {name:result.owner.label,role:result.owner.role,department:result.owner.teams?.[0]} : undefined,
          models:result.source.aiModels?.map(model=>model.modelId) || []})});
      if (!response.ok) throw new Error(`Scan import was not persisted: HTTP ${response.status}`);
      const saved = await response.json();
      const confirmed = (await this.fetchFromBackend()).find(item=>item.id===saved.agentId);
      if (!confirmed) throw new Error('IMPORTED_AGENT_NOT_IN_AUTHORITATIVE_INVENTORY');
      imported.push(confirmed);
    }
    return imported;
  }

  private static stageScanResult(result: ScannerResult): InventoryAgent[] {
    this.initialize();
    const rawAgents = result.source?.agents || [];
    const imported: InventoryAgent[] = [];

    for (let idx = 0; idx < rawAgents.length; idx++) {
      const ag = rawAgents[idx] as any;
      const cleanName = ag.name || `Discovered Agent ${idx + 1}`;
      
      // Check if already in inventory
      const existing = this.agents.find(a => a.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        if (existing.governance.passportStatus !== 'VERIFIED') {
          existing.status = 'IMPORTED';
          existing.governance.governanceStatus = 'IMPORTED';
        }
        existing.lastActivity = 'Atualizado via Scan';
        imported.push(existing);
        continue;
      }

      const agentId = `agt_scan_${Date.now().toString(36)}_${idx}`;
      const isHighRisk = ag.riskLevel === 'critical' || ag.riskLevel === 'high' || (result.risks && result.risks.length > 3);
      const riskTier: AgentRiskTier = isHighRisk ? 'HIGH' : ag.riskLevel === 'medium' ? 'MEDIUM' : 'LOW';

      const newAgent: InventoryAgent = {
        id: agentId,
        name: cleanName,
        owner: {
          name: result.owner?.label || 'Unknown',
          role: result.owner?.role || 'Not assigned',
          department: result.owner?.teams?.[0] || 'Unassigned'
        },
        framework: ag.framework || 'CrewAI',
        frameworkVersion: '1.0.0',
        model: ag.model || result.source?.aiModels?.[0]?.modelId || 'gpt-4o',
        status: 'IMPORTED',
        risk: riskTier,
        complianceProfile: isHighRisk ? 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL' : 'CP-INTERNAL-GOVERNANCE-L2',
        created: new Date().toISOString().split('T')[0],
        lastActivity: 'Descoberto via Codebase Scan',
        description: ag.description || `Agente detectado no repositório ${result.repo?.name || 'Local'}.`,
        access: {
          models: [{ name: ag.model || 'gpt-4o', allowed: true, provider: 'Gateway Managed' }],
          data: [{ name: 'Scanned Project Scope', allowed: true, classification: 'Internal' }],
          tools: (ag.tools || ['default_tool']).map((t: any) => ({
            name: typeof t === 'string' ? t : t.name || 'custom_tool',
            status: typeof t === 'string' && t.includes('delete') ? 'BLOCKED' : 'ALLOW',
            boundary: 'Repository Scope'
          })),
          network: {
            directInternet: false,
            description: 'Canal de internet restrito pelo Sandbox.'
          },
          secrets: {
            directAccess: false,
            description: 'Credenciais protegidas por Vault / mTLS.'
          }
        },
        riskDetails: {
          riskTier,
          riskFactors: (result.risks || []).slice(0, 3).map(r => r.title || r.description || r.id),
          dataClassification: 'Código / Configuração',
          highRiskCapabilities: (ag.tools || []).filter((t: any) => String(t).includes('admin') || String(t).includes('exec')),
          openFindings: (result.violations || []).length,
          unknowns: ['Aguardando emissão formal de passaporte']
        },
        governance: {
          complianceProfile: isHighRisk ? 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL' : 'CP-INTERNAL-GOVERNANCE-L2',
          passportStatus: 'NOT_ISSUED',
          passportId: '',
          passportFingerprint: '',
          guardianStatus: 'MONITOR_ONLY',
          policyVersion: 'v1.0.0',
          hitlRules: ['Operações privilegiadas requerem aprovação'],
          capabilitiesCount: (ag.tools || []).length || 1,
          governanceStatus: 'IMPORTED'
        },
        activity: []
      };

      this.agents.unshift(newAgent);
      imported.push(newAgent);
    }

    this.persist();
    this.notify();
    return imported;
  }

  private static syncWithIngestedScans() {
    if (ScanGovernanceBridge.getLastIngestion()?.tenantId !== PersistenceAdapter.getContext().tenantId) return;
    const ingested = ScanGovernanceBridge.getIngestedAgents();
    if (ingested && ingested.length > 0) {
      for (const ing of ingested) {
        if (!this.agents.some(a => a.name.toLowerCase() === ing.name.toLowerCase())) {
          this.agents.push({
            id: ing.id,
            name: ing.name,
            owner: ing.owner,
            framework: ing.framework,
            frameworkVersion: '1.0.0',
            model: ing.model,
            status: 'DISCOVERED',
            risk: ing.riskClassification === 'HIGH_RISK_ART6' ? 'HIGH' : ing.riskClassification === 'LIMITED_RISK' ? 'MEDIUM' : 'LOW',
            complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
            created: new Date().toISOString().split('T')[0],
            lastActivity: 'Descoberto via Scan recente',
            description: ing.description,
            access: {
              models: [{ name: ing.model, allowed: true, provider: 'Gateway' }],
              data: [{ name: 'Scanned Data', allowed: true, classification: 'Internal' }],
              tools: ing.tools.map(t => ({
                name: t.name,
                status: t.permission === 'EXECUTE_HIGH_PRIVILEGE' ? 'HITL' : 'ALLOW',
                boundary: t.boundary
              })),
              network: { directInternet: false, description: 'Air-Gapped.' },
              secrets: { directAccess: false, description: 'Protegido.' }
            },
            riskDetails: {
              riskTier: ing.riskClassification === 'HIGH_RISK_ART6' ? 'HIGH' : 'MEDIUM',
              riskFactors: ['Agente importado através do sensor de repositórios'],
              dataClassification: 'Interno',
              highRiskCapabilities: [],
              openFindings: 0,
              unknowns: []
            },
            governance: {
              complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
              passportStatus: 'PROVISIONAL',
              passportId: ing.passport.passportId,
              passportFingerprint: ing.passport.digitalSignature,
              guardianStatus: 'ACTIVE',
              policyVersion: 'v1.0.0',
              hitlRules: [ing.hitlCheckpoint.trigger],
              capabilitiesCount: ing.tools.length,
              governanceStatus: 'DISCOVERED'
            },
            activity: []
          });
        }
      }
    }
  }

  static getMetrics(): InventoryMetrics {
    this.initialize();
    const total = this.agents.length;
    const governed = this.agents.filter(a => a.status === 'GOVERNED' || a.status === 'RUNNING').length;
    const needAttention = this.agents.filter(a => a.status === 'PAUSED' || a.status === 'IMPORTED' || a.status === 'DISCOVERED').length;
    const unknown = this.agents.filter(a => a.status === 'UNKNOWN' || a.owner?.name === 'Unknown').length;
    const highRisk = this.agents.filter(a => a.risk === 'HIGH' || a.risk === 'CRITICAL').length;
    
    // Real blocked actions (from server EvidenceLedger or local store events)
    const blockedActions = this.serverMetrics ? this.serverMetrics.blockedActions : this.agents.reduce((acc, a) => {
      const blockedInAct = a.activity.filter(ac => ac.verdict === 'BLOCK' || ac.type === 'BLOCKED').length;
      return acc + (blockedInAct > 0 ? blockedInAct : a.status === 'BLOCKED' ? 1 : 0);
    }, 0);

    // Real HITL pending (from server DurableStore or local store sessions)
    const hitlPending = this.serverMetrics ? this.serverMetrics.hitlPending : this.agents.reduce((acc, a) => {
      const pendingInAct = a.activity.filter(ac => ac.verdict === 'REQUIRE_HITL').length;
      return acc + (pendingInAct > 0 ? pendingInAct : a.status === 'PAUSED' ? 1 : 0);
    }, 0);

    return {
      totalAgents: total,
      governedAgents: governed,
      needAttentionAgents: needAttention,
      unknownAgents: unknown,
      highRiskAgents: highRisk,
      blockedActions,
      hitlPending
    };
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('[AgentInventoryStore] Listener error:', e);
      }
    }
  }

  private static persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.activeScope, JSON.stringify(this.agents));
      } catch (e) {
        console.warn('[AgentInventoryStore] Storage write warning:', e);
      }
    }
  }
}
