with open('../src/web/context/IndustryContext.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Enhance IndustryProfile interface and list
enhanced_context_code = """import React, { createContext, useContext, useState } from 'react';

export interface IndustryProfile {
  id: string;
  name: string;
  icon: string;
  regulations: string[];
  riskFocus: string[];
  sampleOrg: string;
  description: string;
  mandatoryControls: string[];
  priorityKeywords: string[];
}

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: 'financial-services',
    name: 'Financial Services',
    icon: '🏛️',
    regulations: ['DORA (EU) 2022/2554', 'EU AI Act High-Risk (Credit)', 'LGPD Art. 20 (Automated Decisions)', 'BCB Res. 4893', 'PCI-DSS v4.0'],
    riskFocus: ['Credit & Risk Scoring Autonomy', 'Third-Party AI Supply Chain', 'Operational Resilience', 'PII Financial Hygiene', 'Transaction Integrity'],
    sampleOrg: 'Banco Digital Vanguard S.A.',
    description: 'Governance profile optimized for banking, fintechs, credit evaluation, and DORA/BCB 4893 resilience.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-06', 'CG-AG-07', 'CG-AG-11'],
    priorityKeywords: ['credit', 'financial', 'invoice', 'dora', 'bcb', 'pci', 'bank', 'payment', 'salary', 'card', 'cpf', 'underwriting']
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    icon: '🏥',
    regulations: ['EU AI Act Art. 6 (Medical AI)', 'LGPD Art. 11 (Sensitive Health Data)', 'GDPR Art. 9', 'HIPAA Rule', 'ANVISA RDC 657'],
    riskFocus: ['Clinical Decision HITL Validation', 'Sensitive Patient PII Masking', 'Hallucination & Diagnostic Drift', 'Model Explainability'],
    sampleOrg: 'Global Health & Diagnostics Network',
    description: 'Governance profile for clinical AI, patient diagnostic tools, and strict health data privacy.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-03', 'CG-AG-05', 'CG-AG-06', 'CG-AG-07', 'CG-AG-10'],
    priorityKeywords: ['health', 'patient', 'medical', 'hipaa', 'anvisa', 'diagnostic', 'clinical', 'treatment', 'drug', 'doctor', 'hospital']
  },
  {
    id: 'energy-utilities',
    name: 'Energy & Utilities',
    icon: '⚡',
    regulations: ['NIS2 Directive', 'Critical Infrastructure Act', 'ISO/IEC 42001', 'DORA Art. 11'],
    riskFocus: ['Grid Optimization Circuit Breakers', 'Critical Infrastructure Resilience', 'Zero-Loop Execution Bounds', 'Operational Continuity'],
    sampleOrg: 'SmartGrid Power & Utilities Corp',
    description: 'High-availability profile for smart grids, critical infrastructure, and autonomous control limits.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-04', 'CG-AG-07', 'CG-AG-09', 'CG-AG-12'],
    priorityKeywords: ['grid', 'energy', 'infrastructure', 'nis2', 'power', 'telemetry', 'scada', 'utility', 'circuit', 'blackout']
  },
  {
    id: 'public-sector',
    name: 'Public Sector & Government',
    icon: '🏛️',
    regulations: ['EU AI Act Transparency', 'LGPD Art. 20 / LAI 12.527', 'NIST AI RMF 1.0 (Govern)', 'ISO 42001 A.8.4'],
    riskFocus: ['Non-Discrimination & Algorithmic Bias', 'Citizen Decision Traceability', 'Administrative Human Oversight', 'Public Audit Ledger'],
    sampleOrg: 'Ministério da Inovação e Serviços Públicos',
    description: 'Transparency and citizen-centric governance for public administration and automated services.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-03', 'CG-AG-05', 'CG-AG-07', 'CG-AG-08', 'CG-AG-10'],
    priorityKeywords: ['citizen', 'government', 'public', 'transparency', 'bias', 'administrative', 'lai', 'social', 'welfare']
  },
  {
    id: 'technology-saas',
    name: 'Technology & Enterprise SaaS',
    icon: '💻',
    regulations: ['OWASP Top 10 for LLMs', 'SOC 2 Type II', 'ISO 42001 A.8.2', 'EU AI Act General AI'],
    riskFocus: ['Prompt Injection & Exfiltration', 'Multi-Tenant Isolation', 'Shadow AI API Detection', 'FinOps Token Budgeting'],
    sampleOrg: 'CloudScale AI Technologies',
    description: 'Fast-moving profile focused on developer security, MCP tool boundaries, and prompt defense.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-04', 'CG-AG-05', 'CG-AG-11'],
    priorityKeywords: ['prompt', 'injection', 'tenant', 'token', 'saas', 'api', 'cloud', 'mcp', 'developer', 'shadow', 'llm']
  },
  {
    id: 'telecommunications',
    name: 'Telecommunications',
    icon: '📡',
    regulations: ['Anatel Cyber Resolution', 'LGPD Art. 6', 'DORA ICT Third-Party', 'ISO 27001 / 42001'],
    riskFocus: ['High-Volume Call Processing PII', 'Customer Service Bot Bounds', 'Infrastructure AI Reliability', 'Vendor AI Risk'],
    sampleOrg: 'Telecom Brasil Telecomunicações S.A.',
    description: 'High-throughput governance for customer service agents, network automation, and vendor AI.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-06', 'CG-AG-07', 'CG-AG-09'],
    priorityKeywords: ['telecom', 'phone', 'call', 'anatel', 'cdr', 'network', 'customer', 'routing', 'sms']
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industry',
    icon: '🏭',
    regulations: ['Machinery Regulation 2023/1230', 'EU AI Act Safety Component', 'ISO 42001 A.8.4'],
    riskFocus: ['Industrial Edge AI Failsafe', 'Computer Vision Defect Drift', 'Operational Safety Boundaries', 'Sensor Telemetry Trace'],
    sampleOrg: 'Indústria Metalúrgica & Robótica S.A.',
    description: 'Safety-critical industrial profile for edge automation, robotics, and assembly vision systems.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-04', 'CG-AG-07', 'CG-AG-12'],
    priorityKeywords: ['factory', 'robot', 'machinery', 'defect', 'sensor', 'industrial', 'plant', 'assembly', 'safety']
  },
  {
    id: 'retail-consumer',
    name: 'Retail & Consumer',
    icon: '🛒',
    regulations: ['Consumer Defense Code (CDC)', 'LGPD Art. 6 / 38 (RIPD)', 'EU AI Act Rec. Systems'],
    riskFocus: ['Dynamic Pricing Bias', 'Customer Profiling PII', 'Recommendation Safety', 'Marketing Copilot Guardrails'],
    sampleOrg: 'OmniVarejo Retail Group',
    description: 'Consumer privacy, automated pricing governance, and marketing agent oversight.',
    mandatoryControls: ['CG-AG-01', 'CG-AG-03', 'CG-AG-05', 'CG-AG-06', 'CG-AG-10'],
    priorityKeywords: ['retail', 'cart', 'order', 'pricing', 'recommendation', 'ecommerce', 'checkout', 'consumer', 'cdc']
  }
];

interface IndustryContextType {
  activeProfile: IndustryProfile;
  setActiveProfile: (profile: IndustryProfile) => void;
  environment: 'Production' | 'Staging' | 'Sandbox';
  setEnvironment: (env: 'Production' | 'Staging' | 'Sandbox') => void;
  isRegulationPriority: (regNameOrId: string) => boolean;
  isRiskIndustryRelevant: (title: string, category: string, fileOrSnippet?: string) => boolean;
  isControlMandatory: (controlId: string) => boolean;
}

const IndustryContext = createContext<IndustryContextType>({
  activeProfile: INDUSTRY_PROFILES[0],
  setActiveProfile: () => {},
  environment: 'Production',
  setEnvironment: () => {},
  isRegulationPriority: () => false,
  isRiskIndustryRelevant: () => false,
  isControlMandatory: () => false
});

export const IndustryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState<IndustryProfile>(() => {
    const saved = localStorage.getItem('cg_ag_industry');
    const match = INDUSTRY_PROFILES.find(p => p.id === saved);
    return match || INDUSTRY_PROFILES[0];
  });

  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Sandbox'>('Production');

  const handleSetProfile = (p: IndustryProfile) => {
    setActiveProfile(p);
    localStorage.setItem('cg_ag_industry', p.id);
  };

  const isRegulationPriority = (regNameOrId: string): boolean => {
    if (!regNameOrId) return false;
    const lower = regNameOrId.toLowerCase();
    return activeProfile.regulations.some(r => {
      const rLower = r.toLowerCase();
      return lower.includes(rLower.slice(0, 4)) || rLower.includes(lower.slice(0, 4)) || lower.includes('dora') && rLower.includes('dora') || lower.includes('bcb') && rLower.includes('bcb') || lower.includes('hipaa') && rLower.includes('hipaa') || lower.includes('anvisa') && rLower.includes('anvisa');
    });
  };

  const isRiskIndustryRelevant = (title: string, category: string, fileOrSnippet?: string): boolean => {
    const combined = `${title} ${category} ${fileOrSnippet || ''}`.toLowerCase();
    return activeProfile.priorityKeywords.some(kw => combined.includes(kw.toLowerCase()));
  };

  const isControlMandatory = (controlId: string): boolean => {
    return activeProfile.mandatoryControls.includes(controlId);
  };

  return (
    <IndustryContext.Provider value={{ 
      activeProfile, 
      setActiveProfile: handleSetProfile, 
      environment, 
      setEnvironment,
      isRegulationPriority,
      isRiskIndustryRelevant,
      isControlMandatory
    }}>
      {children}
    </IndustryContext.Provider>
  );
};

export const useIndustry = () => useContext(IndustryContext);
"""

with open('../src/web/context/IndustryContext.tsx', 'w', encoding='utf-8') as f:
    f.write(enhanced_context_code)

print('Updated IndustryContext.tsx with rich helpers')
