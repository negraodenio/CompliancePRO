import type { CodeViolation, SourceAnalysis, PackageAnalysis } from '../../core/types';

export interface RegulationScoreInfo {
  id: string;
  name: string;
  jurisdiction: string;
  category: string;
  description: string;
  articles: string[];
  score: number;
  status: 'compliant' | 'partial' | 'non_compliant';
  violationsCount: number;
  criticalCount: number;
  highCount: number;
  violations: Array<CodeViolation & { lawArticle: string; ruleTitle: string }>;
}

export interface PurposeClassification {
  riskTier: 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK' | 'PROHIBITED';
  domain: 'finance' | 'healthcare' | 'hr' | 'biometric' | 'general';
  annexReference: string;
  legalJustification: string;
  obligations: string[];
}

/**
 * Classifies system purpose based on EU AI Act Annex III domain rules.
 * This runs INDEPENDENTLY of code violations (Purpose-first classification).
 */
export function classifySystemPurpose(
  source?: SourceAnalysis,
  repoName: string = '',
  fileNames: string[] = []
): PurposeClassification {
  const allText = [
    repoName,
    ...fileNames,
    ...(source?.agents?.map(a => `${a.name} ${a.tools?.join(' ')} ${a.framework}`) || []),
    ...(source?.databaseTables || []),
    ...(source?.externalServices?.map(s => s.name) || []),
  ].join(' ').toLowerCase();

  // 1. Credit & Solvability Assessment (EU AI Act Annex III - Point 5b)
  if (
    /credit|cr[eé]dito|scoring|score_serasa|serasa|solvab|empr[eé]stimo|finan[çc]|lending|loan|risk_analyst|underwriting/i.test(allText)
  ) {
    return {
      riskTier: 'HIGH_RISK',
      domain: 'finance',
      annexReference: 'EU AI Act — Art. 6(2) & Anexo III, Ponto 5(b) (Avaliação de Crédito e Solvabilidade)',
      legalJustification: 'Sistema de IA destinado à avaliação de solvabilidade e pontuação de crédito de pessoas físicas. Classificação de Alto Risco mandatória por lei, independente da qualidade do código.',
      obligations: [
        'Sistema de Gestão de Riscos contínuo (Art. 9)',
        'Governança estrita de dados de treinamento e validação (Art. 10)',
        'Documentação técnica para conformidade (Art. 11)',
        'Registro automático de eventos / Logs imutáveis (Art. 12)',
        'Supervisão humana efetiva / Human-in-the-Loop (Art. 14)',
        'Explicabilidade de recusas de crédito (Art. 13 & LGPD Art. 20)',
      ],
    };
  }

  // 2. Healthcare & Medical Software (SaMD - EU AI Act Annex III / MDR)
  if (
    /health|sa[uú]de|paciente|patient|m[eé]dic|clinical|cl[íi]nic|diagn[oó]st|triagem|prescri|hospital|sintoma|disease/i.test(allText)
  ) {
    return {
      riskTier: 'HIGH_RISK',
      domain: 'healthcare',
      annexReference: 'EU AI Act — Anexo III & RDC ANVISA nº 657/2022 (Software Médico SaMD)',
      legalJustification: 'Sistema de IA com finalidade de diagnóstico, triagem clínica ou intervenção terapêutica. Classificação de Alto Risco mandatória com exigência de validação clínica e marcação CE.',
      obligations: [
        'Avaliação de Conformidade Sanitária e Clínica (Art. 43)',
        'Sistema de Gestão de Riscos Clínicos (Art. 9 & ANVISA RDC 657)',
        'Supervisão estrita por profissionais de saúde qualificados (Art. 14)',
        'Garantia de Não-Discriminação em Dados de Treinamento (Art. 10)',
      ],
    };
  }

  // 3. HR & Recruitment (EU AI Act Annex III - Point 4)
  if (
    /recrut|candidat|curricul|hire|hiring|interview|entrevista|admiss[aã]o|demiss[aã]o|employee|desempenho/i.test(allText)
  ) {
    return {
      riskTier: 'HIGH_RISK',
      domain: 'hr',
      annexReference: 'EU AI Act — Art. 6(2) & Anexo III, Ponto 4 (Emprego, Gestão de Trabalhadores e Recrutamento)',
      legalJustification: 'Sistema de IA utilizado para recrutamento, seleção, triagem de candidatos ou avaliação de desempenho de trabalhadores. Classificação mandatória de Alto Risco.',
      obligations: [
        'Auditoria periódica de viés e discriminação algorítmica (Art. 10)',
        'Transparência com os candidatos sobre o uso de IA (Art. 13)',
        'Supervisão humana antes da decisão final de contratação (Art. 14)',
      ],
    };
  }

  // 4. Biometric Identification (EU AI Act Annex III - Point 1)
  if (
    /face.?id|facial|biometr|reconhecimento\s+facial|fingerprint|digital/i.test(allText)
  ) {
    return {
      riskTier: 'HIGH_RISK',
      domain: 'biometric',
      annexReference: 'EU AI Act — Art. 6(2) & Anexo III, Ponto 1 (Identificação Biométrica Remota)',
      legalJustification: 'Sistema de IA com identificação biométrica. Requer autorizações rigorosas e avaliação de conformidade mandatória.',
      obligations: [
        'Consentimento explícito e base legal qualificada (LGPD Art. 11)',
        'Avaliação de Impacto algorítmico (RIPD / DPIA)',
        'Medidas de cibersegurança e mitigação de falsos positivos (Art. 15)',
      ],
    };
  }

  // 5. Conversational / Chatbot / General AI (Art. 50)
  return {
    riskTier: 'LIMITED_RISK',
    domain: 'general',
    annexReference: 'EU AI Act — Art. 50 (Obrigações de Transparência para Sistemas de IA Interativos)',
    legalJustification: 'Sistema de IA conversacional / utilitário. Requer aviso explícito ao usuário de que está interagindo com Inteligência Artificial e rotulagem de conteúdo.',
    obligations: [
      'Informar claramente aos usuários que estão interagindo com IA (Art. 50)',
      'Prevenção de geração de conteúdo ilegal / malicioso (Art. 50)',
      'Garantir mecanismos de opt-out e suporte humano quando solicitado',
    ],
  };
}

export function enrichViolationWithLaw(violation: CodeViolation): {
  regulationName: string;
  lawArticle: string;
  ruleTitle: string;
  regIds: string[];
} {
  const rule = (violation.rule || '').toUpperCase();
  const msg = (violation.message || '').toLowerCase();

  // 1. EU AI Act
  if (rule.includes('AI_ACT') || msg.includes('ai act') || rule.includes('SHADOW_AI') || msg.includes('autônomo') || msg.includes('autonomous')) {
    if (msg.includes('human') || msg.includes('supervis') || msg.includes('hitl')) {
      return {
        regulationName: 'EU AI Act',
        lawArticle: 'EU AI Act — Art. 14 (Supervisão Humana / HITL)',
        ruleTitle: 'Decisão de IA sem Supervisão Humana (HITL)',
        regIds: ['EU_AI_ACT', 'CG_AG', 'NIST_AI_RMF'],
      };
    }
    if (msg.includes('transpar') || msg.includes('disclose')) {
      return {
        regulationName: 'EU AI Act',
        lawArticle: 'EU AI Act — Art. 50 (Transparência Obrigatória de Interação com IA)',
        ruleTitle: 'Falta de Notificação de Interação com IA',
        regIds: ['EU_AI_ACT'],
      };
    }
    return {
      regulationName: 'EU AI Act',
      lawArticle: 'EU AI Act — Art. 9 & Anexo III (Gestão de Riscos de Alto Risco)',
      ruleTitle: 'Agente / Modelo de Alto Risco não Homologado',
      regIds: ['EU_AI_ACT', 'ISO_42001'],
    };
  }

  // 2. LGPD (Brazil)
  if (rule.includes('LGPD') || msg.includes('cpf') || msg.includes('cnpj') || msg.includes('rg') || msg.includes('titular') || msg.includes('lgpd')) {
    if (rule.includes('CPF') || msg.includes('cpf')) {
      return {
        regulationName: 'LGPD',
        lawArticle: 'LGPD — Art. 46 (Segurança e Confidencialidade de PII)',
        ruleTitle: 'Exposição de CPF em Texto Claro / Sem Mascaramento',
        regIds: ['LGPD', 'GDPR'],
      };
    }
    if (rule.includes('SENSITIVE') || msg.includes('sensível') || msg.includes('saúde') || msg.includes('biometr')) {
      return {
        regulationName: 'LGPD',
        lawArticle: 'LGPD — Art. 11 (Tratamento de Dados Pessoais Sensíveis)',
        ruleTitle: 'Dados Sensíveis sem Base Legal Específica',
        regIds: ['LGPD', 'ANVISA_RDC'],
      };
    }
    return {
      regulationName: 'LGPD',
      lawArticle: 'LGPD — Art. 7, I & Art. 38 (Consentimento e RIPD)',
      ruleTitle: 'Processamento de Dados Pessoais sem Registro de Consentimento',
      regIds: ['LGPD'],
    };
  }

  // 3. GDPR (Europe)
  if (rule.includes('GDPR') || msg.includes('gdpr') || rule.includes('EMAIL') || rule.includes('COOKIE') || rule.includes('CONSENT')) {
    if (rule.includes('EMAIL') || msg.includes('email')) {
      return {
        regulationName: 'GDPR',
        lawArticle: 'GDPR — Art. 5(1)(f) & Art. 32 (Segurança de Dados)',
        ruleTitle: 'Endereço de E-mail Hardcoded / Exposição Direta',
        regIds: ['GDPR', 'LGPD'],
      };
    }
    if (msg.includes('automated') || msg.includes('decision')) {
      return {
        regulationName: 'GDPR',
        lawArticle: 'GDPR — Art. 22 (Decisões Automatizadas e Profiling)',
        ruleTitle: 'Decisão Automatizada sem Direito à Explicação',
        regIds: ['GDPR', 'EU_AI_ACT'],
      };
    }
    return {
      regulationName: 'GDPR',
      lawArticle: 'GDPR — Art. 6 & Art. 25 (Data Protection by Design)',
      ruleTitle: 'Falta de Mecanismo de Privacidade por Padrão',
      regIds: ['GDPR'],
    };
  }

  // 4. OWASP & OWASP Top 10 for LLMs
  if (rule.includes('OWASP') || rule.includes('PROMPT') || rule.includes('INJECTION') || rule.includes('SQL') || rule.includes('XSS') || rule.includes('AUTH') || rule.includes('DEBUG') || rule.includes('SECRET') || rule.includes('CREDENTIAL')) {
    if (rule.includes('DEBUG') || msg.includes('debug') || rule.includes('A05')) {
      return {
        regulationName: 'OWASP Top 10',
        lawArticle: 'OWASP A05:2021 (Security Misconfiguration)',
        ruleTitle: 'Modo de Depuração (Debug Mode) Ativo em Produção',
        regIds: ['OWASP_LLM_TOP_10', 'ISO_42001', 'NIS2'],
      };
    }
    if (rule.includes('PROMPT') || msg.includes('prompt')) {
      return {
        regulationName: 'OWASP LLM Top 10',
        lawArticle: 'OWASP LLM01:2025 (Prompt Injection Direto/Indireto)',
        ruleTitle: 'Vulnerabilidade a Injeção de Prompt / Concatenação Insegura',
        regIds: ['OWASP_LLM_TOP_10', 'NIST_AI_RMF'],
      };
    }
    if (rule.includes('SQL') || msg.includes('sql') || msg.includes('query')) {
      return {
        regulationName: 'OWASP Security',
        lawArticle: 'OWASP A03:2021 (Injection Flaws) & LLM02',
        ruleTitle: 'Consulta SQL Não Parametrizada em Fluxo de IA',
        regIds: ['OWASP_LLM_TOP_10', 'BCB_4893', 'PCI_DSS'],
      };
    }
    if (rule.includes('SECRET') || rule.includes('CREDENTIAL') || rule.includes('PASSWORD') || rule.includes('API_KEY') || rule.includes('A07')) {
      return {
        regulationName: 'OWASP Security & ISO 42001',
        lawArticle: 'OWASP A07:2021 (Identification & Auth Failures) / NIST MANAGE 3.1',
        ruleTitle: 'Credencial / Chave Secreta Hardcoded no Código',
        regIds: ['OWASP_LLM_TOP_10', 'ISO_42001', 'NIS2'],
      };
    }
    if (rule.includes('CRYPTO') || rule.includes('SSL') || rule.includes('TLS') || rule.includes('A02')) {
      return {
        regulationName: 'OWASP Security',
        lawArticle: 'OWASP A02:2021 (Cryptographic Failures)',
        ruleTitle: 'Falha Criptográfica / Transporte Inseguro',
        regIds: ['OWASP_LLM_TOP_10', 'PCI_DSS', 'LGPD'],
      };
    }
    return {
      regulationName: 'OWASP Security',
      lawArticle: 'OWASP A01:2021 (Broken Access Control)',
      ruleTitle: 'Endpoint de IA Exposto sem Autenticação / Autorização',
      regIds: ['OWASP_LLM_TOP_10', 'NIS2', 'ISO_42001', 'NIST_AI_RMF', 'CG_AG'],
    };
  }

  // 5. Credential / Secrets
  if (rule.includes('CREDENTIAL') || rule.includes('SECRET') || rule.includes('KEY') || rule.includes('TOKEN') || rule.includes('PASSWORD')) {
    return {
      regulationName: 'Segurança & Criptografia',
      lawArticle: 'ISO/IEC 42001 Anexo A.8 & NIST AI RMF MANAGE 3.1',
      ruleTitle: 'Chave de API / Segredo Hardcoded no Código',
      regIds: ['ISO_42001', 'NIST_AI_RMF', 'NIS2', 'PCI_DSS'],
    };
  }

  // 6. Financial & BCB 4893
  if (rule.includes('BCB') || rule.includes('FINANCE') || msg.includes('crédito') || msg.includes('bank') || msg.includes('saldo') || msg.includes('serasa')) {
    return {
      regulationName: 'Resolução BCB nº 4.893',
      lawArticle: 'BCB nº 4.893 — Art. 15 (Auditoria de Algoritmos Financeiros)',
      ruleTitle: 'Modelo de Decisão Financeira sem Trilha de Auditoria',
      regIds: ['BCB_4893', 'DORA'],
    };
  }

  // 7. Healthcare & ANVISA
  if (rule.includes('ANVISA') || msg.includes('paciente') || msg.includes('médic') || msg.includes('diagnóst') || msg.includes('hospital') || msg.includes('sintoma')) {
    return {
      regulationName: 'RDC ANVISA nº 657/2022',
      lawArticle: 'RDC ANVISA nº 657 — Art. 8 (Software como Dispositivo Médico / SaMD)',
      ruleTitle: 'Algoritmo Clínico sem Validação e Registro Sanitário',
      regIds: ['ANVISA_RDC', 'EU_AI_ACT'],
    };
  }

  // 8. PCI-DSS
  if (rule.includes('PCI') || msg.includes('card') || msg.includes('cvv') || msg.includes('cartão') || msg.includes('pan')) {
    return {
      regulationName: 'PCI-DSS v4.0',
      lawArticle: 'PCI-DSS v4.0 — Requisito 3.4 (Proteção dos Dados do Portador de Cartão)',
      ruleTitle: 'Trânsito de Dados de Cartão de Crédito sem Criptografia',
      regIds: ['PCI_DSS'],
    };
  }

  // Default fallback
  return {
    regulationName: 'Governança Geral de IA',
    lawArticle: 'ISO/IEC 42001:2023 Cláusula 6.1 (Gestão de Riscos)',
    ruleTitle: violation.rule || 'Risco de Conformidade Detectado',
    regIds: ['ISO_42001', 'NIST_AI_RMF', 'CG_AG'],
  };
}

export function calculateRegulationScores(
  violations: CodeViolation[],
  regDefinitions: Array<{ id: string; name: string; jurisdiction: string; category: string; description: string; articles: string[] }>
): RegulationScoreInfo[] {
  const enrichedViolations = (violations || []).map(v => {
    const law = enrichViolationWithLaw(v);
    return {
      ...v,
      lawArticle: law.lawArticle,
      ruleTitle: law.ruleTitle,
      regIds: law.regIds,
    };
  });

  return regDefinitions.map(reg => {
    const matchingViolations = enrichedViolations.filter(v => v.regIds.includes(reg.id));
    const criticalCount = matchingViolations.filter(v => v.severity === 'critical').length;
    const highCount = matchingViolations.filter(v => v.severity === 'high').length;
    const mediumCount = matchingViolations.filter(v => v.severity === 'medium').length;
    const lowCount = matchingViolations.filter(v => v.severity === 'low' || !v.severity).length;

    // Strict Base 100 points
    let score = 100;
    score -= (criticalCount * 25);
    score -= (highCount * 14);
    score -= (mediumCount * 7);
    score -= (lowCount * 3);

    score = Math.max(0, Math.min(100, score));

    let status: 'compliant' | 'partial' | 'non_compliant' = 'compliant';
    if (criticalCount > 0 || score < 60) {
      status = 'non_compliant';
    } else if (highCount > 0 || mediumCount > 0 || score < 85) {
      status = 'partial';
    }

    return {
      id: reg.id,
      name: reg.name,
      jurisdiction: reg.jurisdiction,
      category: reg.category,
      description: reg.description,
      articles: reg.articles,
      score,
      status,
      violationsCount: matchingViolations.length,
      criticalCount,
      highCount,
      violations: matchingViolations,
    };
  });
}

/**
 * Context-aware weighted overall score calculation.
 * Prioritizes sector-specific regulations (Finance weights BCB/EU AI Act higher; Healthcare weights ANVISA/EU AI Act higher).
 */
export function calculateOverallScore(
  regulationScores: RegulationScoreInfo[],
  domain: 'finance' | 'healthcare' | 'hr' | 'biometric' | 'general' = 'general'
): { score: number; formulaText: string; domainWeights: Record<string, number> } {
  if (!regulationScores || regulationScores.length === 0) {
    return { score: 100, formulaText: '100% (Sem violações)', domainWeights: {} };
  }

  // Domain specific weights (Context-Aware Weighting - Option C)
  const weights: Record<string, number> = {};
  for (const r of regulationScores) {
    weights[r.id] = 1; // baseline weight
  }

  if (domain === 'finance') {
    weights['BCB_4893'] = 3;
    weights['EU_AI_ACT'] = 3;
    weights['LGPD'] = 2;
    weights['GDPR'] = 2;
    weights['OWASP_LLM_TOP_10'] = 2;
    weights['PCI_DSS'] = 2;
    weights['DORA'] = 2;
  } else if (domain === 'healthcare') {
    weights['ANVISA_RDC'] = 3;
    weights['EU_AI_ACT'] = 3;
    weights['LGPD'] = 2;
    weights['GDPR'] = 2;
    weights['ISO_42001'] = 2;
  } else {
    weights['EU_AI_ACT'] = 2;
    weights['LGPD'] = 2;
    weights['OWASP_LLM_TOP_10'] = 2;
    weights['ISO_42001'] = 2;
    weights['NIST_AI_RMF'] = 2;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const r of regulationScores) {
    const w = weights[r.id] || 1;
    weightedSum += (r.score * w);
    totalWeight += w;
  }

  const finalScore = Math.round(weightedSum / totalWeight);

  const formulaText = `Score Geral = Σ(Score_Reg × Peso_Contexto) / ${totalWeight}`;

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    formulaText,
    domainWeights: weights,
  };
}
