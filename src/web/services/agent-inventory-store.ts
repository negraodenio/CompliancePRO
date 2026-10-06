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
import { ScanGovernanceBridge, IngestedAgentEntity } from './scan-governance-bridge';

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
  private static serverMetrics: InventoryMetrics | null = null;

  static initialize() {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.agents = parsed.filter(a => !isMockAgent(a));
            this.isInitialized = true;
            this.syncWithIngestedScans();
            return;
          }
        }
      } catch (e) {
        console.warn('[AgentInventoryStore] Storage read warning:', e);
      }
    }

    this.agents = [];
    this.isInitialized = true;
    this.syncWithIngestedScans();
    this.persist();
  }

  static async fetchFromBackend(authHeader?: string, tenantHeader?: string): Promise<InventoryAgent[]> {
    this.initialize();
    if (typeof fetch === 'undefined') return [...this.agents];

    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers['Authorization'] = authHeader;
      if (tenantHeader) headers['x-tenant-id'] = tenantHeader;

      const res = await fetch('/api/v1/agents', { headers });
      if (!res.ok) return [...this.agents];

      const data = await res.json();
      const backendAgents = data.agents || [];

      // Preserve local scan agents that are not yet provisioned on the backend
      const localScans = this.agents.filter(a => a.id.startsWith('agt_scan_'));

      const mappedAgents: InventoryAgent[] = backendAgents.map((ag: any) => {
        const tools = (ag.passport?.declaredTools || []).map((t: string) => ({
          name: t,
          status: (t.includes('approve') || t.includes('transfer') ? 'HITL' : t.includes('prohibit') || t.includes('admin') ? 'BLOCKED' : 'ALLOW') as any,
          boundary: 'Governed Runtime'
        }));

        const ownerName = ag.owner?.name || ag.owner || (ag.tenantId ? 'Unknown' : 'Unknown');
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
          framework: ag.framework?.name || 'Custom',
          frameworkVersion: ag.framework?.version || '1.0.0',
          model: (ag.passport?.declaredModels && ag.passport.declaredModels[0]) || 'gpt-4o',
          status: (ag.status === 'PROVISIONED' ? 'GOVERNED' : ag.status || 'GOVERNED') as AgentGovernanceStatus,
          risk: (ag.passport?.riskTier || 'MEDIUM') as AgentRiskTier,
          complianceProfile: ag.complianceProfileId || ag.complianceProfileChecksum || 'CP-COMPILED',
          created: ag.createdAt ? ag.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          lastActivity: ag.lastActivity || 'Ativo via Backend',
          description: ag.description || `Agente corporativo registrado no ComplyPRO.`,
          access: {
            models: (ag.passport?.declaredModels || ['gpt-4o']).map((m: string) => ({
              name: m,
              allowed: true,
              provider: 'Model Gateway'
            })),
            data: (ag.passport?.declaredDataScopes || ['Default Scope']).map((d: string) => ({
              name: d,
              allowed: true,
              classification: 'Internal'
            })),
            tools: tools.length > 0 ? tools : [
              { name: 'read_resource', status: 'ALLOW', boundary: 'REST Gateway' }
            ],
            network: { directInternet: false, description: 'Air-Gapped Sandbox. Tráfego somente via Gateway.' },
            secrets: { directAccess: false, description: 'Zero injeção de tokens. mTLS gerenciado.' }
          },
          riskDetails: {
            riskTier: ag.passport?.riskTier || 'MEDIUM',
            riskFactors: [`Perfil de governança ativo: ${ag.complianceProfileId || 'Standard'}`],
            dataClassification: 'Interno',
            highRiskCapabilities: tools.filter((t: any) => t.status === 'HITL').map((t: any) => t.name),
            openFindings: 0,
            unknowns: ownerName === 'Unknown' ? ['Responsável formal não atribuído'] : []
          },
          governance: {
            complianceProfile: ag.complianceProfileId || 'CP-COMPILED',
            passportStatus: ag.passport?.status === 'REVOKED' ? 'REVOKED' : 'VERIFIED',
            passportId: ag.passportId || ag.passport?.passportId || `PASS-${ag.agentId}`,
            passportFingerprint: ag.passportFingerprint || ag.passport?.passportFingerprint || 'HMAC-SHA256',
            guardianStatus: 'ACTIVE',
            policyVersion: '1.0.0',
            hitlRules: ['Operações privilegiadas requerem autorização humana'],
            capabilitiesCount: ag.governedCapabilities || tools.length,
            governanceStatus: (ag.status === 'PROVISIONED' ? 'GOVERNED' : ag.status || 'GOVERNED') as AgentGovernanceStatus
          },
          activity: []
        };
      });

      this.agents = [...mappedAgents, ...localScans];

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

      this.persist();
      this.notify();
    } catch (e) {
      console.warn('[AgentInventoryStore] Backend fetch error:', e);
    }

    return [...this.agents];
  }

  static updateAgent(id: string, updates: Partial<InventoryAgent>) {
    this.initialize();
    const agent = this.agents.find(a => a.id === id);
    if (agent) {
      Object.assign(agent, updates);
      this.persist();
      this.notify();
    }
  }

  static getAgents(): InventoryAgent[] {
    this.initialize();
    return [...this.agents];
  }

  static getAgent(id: string): InventoryAgent | undefined {
    this.initialize();
    return this.agents.find(a => a.id === id);
  }

  static addAgent(agent: Partial<InventoryAgent> & { name: string }): InventoryAgent {
    this.initialize();

    const id = agent.id || ('agt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));
    const newAgent: InventoryAgent = {
      id,
      name: agent.name,
      owner: agent.owner || {
        name: 'Administrador',
        role: 'AI Owner',
        department: 'Engineering'
      },
      framework: agent.framework || 'CrewAI',
      frameworkVersion: agent.frameworkVersion || '1.0.0',
      model: agent.model || 'gpt-4o',
      status: agent.status || 'GOVERNED',
      risk: agent.risk || 'HIGH',
      complianceProfile: agent.complianceProfile || 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      created: agent.created || new Date().toISOString().split('T')[0],
      lastActivity: 'Criado agora',
      description: agent.description || `Agente ${agent.name} registrado no ComplyPRO.`,
      access: agent.access || {
        models: [{ name: agent.model || 'gpt-4o', allowed: true, provider: 'OpenAI Enterprise' }],
        data: [{ name: 'Default Enterprise Scope', allowed: true, classification: 'Internal' }],
        tools: [
          { name: 'read_resource', status: 'ALLOW', boundary: 'REST /api/read' },
          { name: 'execute_action', status: 'HITL', boundary: 'Requer aprovação humana' },
          { name: 'admin_delete', status: 'BLOCKED', boundary: 'Ação crítica bloqueada' }
        ],
        network: { directInternet: false, description: 'Air-Gapped Sandbox. Tráfego somente via Gateway.' },
        secrets: { directAccess: false, description: 'Zero injeção de tokens. mTLS gerenciado.' }
      },
      riskDetails: agent.riskDetails || {
        riskTier: agent.risk || 'HIGH',
        riskFactors: ['Agente recém-criado em monitoramento ativo'],
        dataClassification: 'Interno',
        highRiskCapabilities: ['execute_action'],
        openFindings: 0,
        unknowns: []
      },
      governance: agent.governance || {
        complianceProfile: agent.complianceProfile || 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        passportStatus: 'VERIFIED',
        passportId: `PASS-${id.toUpperCase()}`,
        passportFingerprint: `SHA256:${id.split('').reverse().join('')}1122334455`,
        guardianStatus: 'ACTIVE',
        policyVersion: 'v1.0.0',
        hitlRules: ['Ações de alto risco exigem confirmação em fila'],
        capabilitiesCount: 3,
        governanceStatus: agent.status || 'GOVERNED'
      },
      activity: agent.activity || [
        {
          id: `act_${Date.now()}`,
          timestamp: 'Agora',
          type: 'EVIDENCE',
          summary: `Agente provisionado e integrado ao inventário`,
          verdict: 'ALLOW',
          evidenceHash: '00112233445566778899'
        }
      ]
    };

    this.agents.unshift(newAgent);
    this.persist();
    this.notify();
    return newAgent;
  }

  static updateAgentStatus(id: string, status: AgentGovernanceStatus) {
    this.initialize();
    const agent = this.agents.find(a => a.id === id);
    if (agent) {
      agent.status = status;
      agent.governance.governanceStatus = status;
      agent.lastActivity = `Status atualizado para ${status}`;
      agent.activity.unshift({
        id: `act_${Date.now()}`,
        timestamp: 'Agora',
        type: status === 'BLOCKED' ? 'BLOCKED' : status === 'PAUSED' ? 'DECISION' : 'EXECUTION',
        summary: `Status de governança alterado para ${status}`,
        verdict: status === 'BLOCKED' ? 'BLOCK' : status === 'PAUSED' ? 'REQUIRE_HITL' : 'ALLOW'
      });
      this.persist();
      this.notify();
    }
  }

  static importFromScanResult(result: ScannerResult): InventoryAgent[] {
    this.initialize();
    const rawAgents = result.source?.agents || [];
    const imported: InventoryAgent[] = [];

    for (let idx = 0; idx < rawAgents.length; idx++) {
      const ag = rawAgents[idx] as any;
      const cleanName = ag.name || `Discovered Agent ${idx + 1}`;
      
      // Check if already in inventory
      const existing = this.agents.find(a => a.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        existing.status = 'GOVERNED';
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
          name: result.owner?.label || 'Time de Engenharia',
          role: result.owner?.role || 'Lead Developer',
          department: result.owner?.teams?.[0] || 'AI Platform'
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
          passportStatus: 'PROVISIONAL',
          passportId: `PASS-SCAN-${agentId.toUpperCase().slice(-6)}`,
          passportFingerprint: `SHA256:scan_${agentId}_${Date.now()}`,
          guardianStatus: 'ACTIVE',
          policyVersion: 'v1.0.0',
          hitlRules: ['Operações privilegiadas requerem aprovação'],
          capabilitiesCount: (ag.tools || []).length || 1,
          governanceStatus: 'IMPORTED'
        },
        activity: [
          {
            id: `act_${Date.now()}_${idx}`,
            timestamp: 'Agora',
            type: 'EVIDENCE',
            summary: `Descoberto no scan do repositório ${result.repo?.name || 'Local'} e importado para o ComplyPRO`,
            verdict: 'ALLOW',
            evidenceHash: `scan_${idx}_hash`
          }
        ]
      };

      this.agents.unshift(newAgent);
      imported.push(newAgent);
    }

    this.persist();
    this.notify();
    return imported;
  }

  private static syncWithIngestedScans() {
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.agents));
      } catch (e) {
        console.warn('[AgentInventoryStore] Storage write warning:', e);
      }
    }
  }
}
