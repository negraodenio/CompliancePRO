import React, { createContext, useContext, useState } from 'react';

export interface IndustryProfile {
  id: string;
  name: string;
  icon: string;
  regulations: string[];
  riskFocus: string[];
  sampleOrg: string;
  description: string;
}

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: 'financial-services',
    name: 'Financial Services',
    icon: '🏦',
    regulations: ['DORA (EU) 2022/2554', 'EU AI Act High-Risk (Credit)', 'LGPD Art. 20 (Automated Decisions)', 'BCB Res. 85'],
    riskFocus: ['Credit & Risk Scoring Autonomy', 'Third-Party AI Supply Chain', 'Operational Resilience', 'PII Financial Hygiene'],
    sampleOrg: 'Banco Digital Vanguard S.A.',
    description: 'Governance profile optimized for banking, fintechs, credit evaluation, and DORA resilience.'
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    icon: '🏥',
    regulations: ['EU AI Act Art. 6 (Medical AI)', 'LGPD Art. 11 (Sensitive Health Data)', 'GDPR Art. 9', 'HIPAA Rule'],
    riskFocus: ['Clinical Decision HITL Validation', 'Sensitive Patient PII Masking', 'Hallucination & Diagnostic Drift', 'Model Explainability'],
    sampleOrg: 'Global Health & Diagnostics Network',
    description: 'Governance profile for clinical AI, patient diagnostic tools, and strict health data privacy.'
  },
  {
    id: 'energy-utilities',
    name: 'Energy & Utilities',
    icon: '⚡',
    regulations: ['NIS2 Directive', 'Critical Infrastructure Act', 'ISO/IEC 42001', 'DORA Art. 11'],
    riskFocus: ['Grid Optimization Circuit Breakers', 'Critical Infrastructure Resilience', 'Zero-Loop Execution Bounds', 'Operational Continuity'],
    sampleOrg: 'SmartGrid Power & Utilities Corp',
    description: 'High-availability profile for smart grids, critical infrastructure, and autonomous control limits.'
  },
  {
    id: 'public-sector',
    name: 'Public Sector & Government',
    icon: '🏛️',
    regulations: ['EU AI Act Transparency', 'LGPD Art. 20 / LAI 12.527', 'NIST AI RMF 1.0 (Govern)', 'ISO 42001 A.8.4'],
    riskFocus: ['Non-Discrimination & Algorithmic Bias', 'Citizen Decision Traceability', 'Administrative Human Oversight', 'Public Audit Ledger'],
    sampleOrg: 'Ministério da Inovação e Serviços Públicos',
    description: 'Transparency and citizen-centric governance for public administration and automated services.'
  },
  {
    id: 'technology-saas',
    name: 'Technology & Enterprise SaaS',
    icon: '💻',
    regulations: ['OWASP Top 10 for LLMs', 'SOC 2 Type II', 'ISO 42001 A.8.2', 'EU AI Act General AI'],
    riskFocus: ['Prompt Injection & Exfiltration', 'Multi-Tenant Isolation', 'Shadow AI API Detection', 'FinOps Token Budgeting'],
    sampleOrg: 'CloudScale AI Technologies',
    description: 'Fast-moving profile focused on developer security, MCP tool boundaries, and prompt defense.'
  },
  {
    id: 'telecommunications',
    name: 'Telecommunications',
    icon: '📡',
    regulations: ['Anatel Cyber Resolution', 'LGPD Art. 6', 'DORA ICT Third-Party', 'ISO 27001 / 42001'],
    riskFocus: ['High-Volume Call Processing PII', 'Customer Service Bot Bounds', 'Infrastructure AI Reliability', 'Vendor AI Risk'],
    sampleOrg: 'Telecom Brasil Telecomunicações S.A.',
    description: 'High-throughput governance for customer service agents, network automation, and vendor AI.'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industry',
    icon: '🏭',
    regulations: ['Machinery Regulation 2023/1230', 'EU AI Act Safety Component', 'ISO 42001 A.8.4'],
    riskFocus: ['Industrial Edge AI Failsafe', 'Computer Vision Defect Drift', 'Operational Safety Boundaries', 'Sensor Telemetry Trace'],
    sampleOrg: 'Indústria Metalúrgica & Robótica S.A.',
    description: 'Safety-critical industrial profile for edge automation, robotics, and assembly vision systems.'
  },
  {
    id: 'retail-consumer',
    name: 'Retail & Consumer',
    icon: '🛒',
    regulations: ['Consumer Defense Code (CDC)', 'LGPD Art. 6 / 38 (RIPD)', 'EU AI Act Rec. Systems'],
    riskFocus: ['Dynamic Pricing Bias', 'Customer Profiling PII', 'Recommendation Safety', 'Marketing Copilot Guardrails'],
    sampleOrg: 'OmniVarejo Retail Group',
    description: 'Consumer privacy, automated pricing governance, and marketing agent oversight.'
  }
];

interface IndustryContextType {
  activeProfile: IndustryProfile;
  setActiveProfile: (profile: IndustryProfile) => void;
  environment: 'Production' | 'Staging' | 'Sandbox';
  setEnvironment: (env: 'Production' | 'Staging' | 'Sandbox') => void;
}

const IndustryContext = createContext<IndustryContextType>({
  activeProfile: INDUSTRY_PROFILES[0],
  setActiveProfile: () => {},
  environment: 'Production',
  setEnvironment: () => {}
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

  return (
    <IndustryContext.Provider value={{ activeProfile, setActiveProfile: handleSetProfile, environment, setEnvironment }}>
      {children}
    </IndustryContext.Provider>
  );
};

export const useIndustry = () => useContext(IndustryContext);
