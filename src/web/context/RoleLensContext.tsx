import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnterpriseRole } from '../../server/security/identity-types';
import { ActiveNavView } from '../components/AppShell';

export type RoleLensId = 
  | 'ciso'
  | 'dpo'
  | 'ai-office'
  | 'security-lead'
  | 'engineer'
  | 'auditor'
  | 'board'
  | 'all-modules';

export interface RoleLensDefinition {
  id: RoleLensId;
  name: string;
  shortLabel: string;
  role: EnterpriseRole | 'ALL';
  icon: string;
  tagline: string;
  defaultLandingView: ActiveNavView;
  priorityViews: ActiveNavView[];
  description: string;
  badgeColor: string;
}

export const ROLE_LENSES: RoleLensDefinition[] = [
  {
    id: 'ciso',
    name: 'CISO & Lead Risk Officer',
    shortLabel: 'CISO Lens',
    role: 'CISO',
    icon: '🛡️',
    tagline: 'Governança Executiva, Riscos Críticos & Aprovações HITL',
    defaultLandingView: 'overview-center',
    priorityViews: ['overview-center', 'govern-risk', 'operate-approvals', 'govern-controls'],
    description: 'Foco em apetite de risco corporativo, controles normativos CG-AG e aprovação de decisões de alta criticidade.',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    id: 'dpo',
    name: 'Data Protection Officer (DPO)',
    shortLabel: 'DPO Lens',
    role: 'DPO',
    icon: '⚖️',
    tagline: 'Conformidade Regulatória, LGPD/AI Act & Dossiês RIPD',
    defaultLandingView: 'govern-compliance',
    priorityViews: ['govern-compliance', 'assure-reports', 'assure-evidence', 'discover-inventory'],
    description: 'Foco em inventário de dados pessoais/sensíveis, RIPD (Art. 38 LGPD), conformidade com o EU AI Act e dossiês técnicos.',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
  },
  {
    id: 'ai-office',
    name: 'AI Office & Head of Governance',
    shortLabel: 'AI Office Lens',
    role: 'AI_OFFICE',
    icon: '🏛️',
    tagline: 'Pipeline de Decisões, Maturidade & FinOps de Modelos',
    defaultLandingView: 'operate-decisions',
    priorityViews: ['operate-decisions', 'discover-assessments', 'operate-runtime', 'overview-center'],
    description: 'Foco em deliberação de mitigações, esteira de agentes, maturidade organizacional e controle orçamentário FinOps.',
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
  },
  {
    id: 'security-lead',
    name: 'Security Lead & Incident Commander',
    shortLabel: 'Security Lead',
    role: 'SECURITY_LEAD',
    icon: '🔐',
    tagline: 'Defesa Ativa, Circuit Breakers & Contenção Failsafe',
    defaultLandingView: 'operate-incidents',
    priorityViews: ['operate-incidents', 'govern-policies', 'operate-approvals', 'operate-actions'],
    description: 'Foco em telemetria em tempo real, detecção de loops adversariais, disparo de circuit breakers e políticas de segurança.',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  },
  {
    id: 'engineer',
    name: 'AI & Software Engineer',
    shortLabel: 'Engineer Lens',
    role: 'ENGINEER',
    icon: '💻',
    tagline: 'AST Scanner, SIPOC de Agentes & Patches de Remediação',
    defaultLandingView: 'tools-scanner',
    priorityViews: ['tools-scanner', 'discover-agents', 'operate-actions', 'discover-inventory'],
    description: 'Foco em ingestão de código, detecção de Shadow AI, catalogação de ferramentas MCP e aplicação de correções automatizadas.',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    id: 'auditor',
    name: 'Independent Regulatory Auditor',
    shortLabel: 'Auditor Lens',
    role: 'AUDITOR',
    icon: '🔍',
    tagline: 'Audit Ledger Imutável, Evidência RFC 8785 & Cadeia Hash',
    defaultLandingView: 'assure-audit',
    priorityViews: ['assure-audit', 'assure-evidence', 'assure-reports', 'govern-controls'],
    description: 'Foco em verificação matemática de blocos SHA-256, hashes canônicos de evidência e atestados de conformidade independente.',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  },
  {
    id: 'board',
    name: 'Board of Directors & Executive C-Level',
    shortLabel: 'Board / C-Level',
    role: 'BOARD',
    icon: '📊',
    tagline: 'Visão Macro Executiva, Exposição Residual & Certificação',
    defaultLandingView: 'overview-center',
    priorityViews: ['overview-center', 'assure-reports', 'learn-academy', 'govern-controls'],
    description: 'Foco em métricas executivas agregadas, certificação corporativa de IA e resumos regulatórios para conselheiros.',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  {
    id: 'all-modules',
    name: 'All Modules (Full OS Architecture)',
    shortLabel: 'Full OS (18 Modules)',
    role: 'ALL',
    icon: '🌐',
    tagline: 'Visão Panorâmica de Toda a Arquitetura do Governance OS',
    defaultLandingView: 'overview-center',
    priorityViews: [],
    description: 'Acesso simultâneo e sem filtragem aos 18 módulos organizados por domínios clássicos de governança.',
    badgeColor: 'text-slate-300 bg-slate-500/10 border-slate-500/30'
  }
];

interface RoleLensContextType {
  activeLens: RoleLensDefinition;
  setRoleLensById: (id: RoleLensId, triggerNavigation?: boolean) => void;
  userEffectiveRole: EnterpriseRole;
  setUserEffectiveRole: (role: EnterpriseRole) => void;
  isLensPrioritized: boolean;
}

const RoleLensContext = createContext<RoleLensContextType>({
  activeLens: ROLE_LENSES[0],
  setRoleLensById: () => {},
  userEffectiveRole: 'CISO',
  setUserEffectiveRole: () => {},
  isLensPrioritized: true
});

export const RoleLensProvider: React.FC<{
  children: React.ReactNode;
  onNavigate?: (view: ActiveNavView) => void;
}> = ({ children, onNavigate }) => {
  const [userEffectiveRole, setUserEffectiveRoleState] = useState<EnterpriseRole>(() => {
    const saved = localStorage.getItem('cgag_user_role') as EnterpriseRole;
    return saved || 'CISO';
  });

  const [activeLensId, setActiveLensId] = useState<RoleLensId>(() => {
    const saved = localStorage.getItem('cgag_active_lens') as RoleLensId;
    if (saved && ROLE_LENSES.some(l => l.id === saved)) {
      return saved;
    }
    // Auto-resolve by user role
    const matched = ROLE_LENSES.find(l => l.role === 'CISO');
    return matched ? matched.id : 'ciso';
  });

  const activeLens = ROLE_LENSES.find(l => l.id === activeLensId) || ROLE_LENSES[0];

  const setRoleLensById = (id: RoleLensId, triggerNavigation: boolean = false) => {
    const target = ROLE_LENSES.find(l => l.id === id);
    if (!target) return;
    setActiveLensId(id);
    localStorage.setItem('cgag_active_lens', id);

    if (triggerNavigation && onNavigate && target.defaultLandingView) {
      onNavigate(target.defaultLandingView);
    }
  };

  const setUserEffectiveRole = (role: EnterpriseRole) => {
    setUserEffectiveRoleState(role);
    localStorage.setItem('cgag_user_role', role);

    // Auto-align lens with new effective role if lens is currently tied to roles
    const matchedLens = ROLE_LENSES.find(l => l.role === role);
    if (matchedLens) {
      setActiveLensId(matchedLens.id);
      localStorage.setItem('cgag_active_lens', matchedLens.id);
    }
  };

  return (
    <RoleLensContext.Provider value={{
      activeLens,
      setRoleLensById,
      userEffectiveRole,
      setUserEffectiveRole,
      isLensPrioritized: activeLens.id !== 'all-modules'
    }}>
      {children}
    </RoleLensContext.Provider>
  );
};

export const useRoleLens = () => useContext(RoleLensContext);
