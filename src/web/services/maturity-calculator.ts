import type { ScannerResult } from '../../core/types';

export interface MaturityEvaluation {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  shortTitle: string;
  badge: string;
  rationale: string;
  strengths: string[];
  gaps: string[];
  nextLevelCriteria: string;
}

/**
 * Calcula de forma auditável e determinística o Nível de Maturidade de Governança de IA
 * alinhado aos pilares de CMMI, ISO/IEC 42001 e NIST AI RMF (GOVERN, MAP, MEASURE, MANAGE).
 */
export function calculateMaturityLevel(result: ScannerResult): MaturityEvaluation {
  const violations = result.violations || [];
  const agents = result.source?.agents || [];
  const shadowAI = result.shadowAI || [];
  const externalServices = result.source?.externalServices || [];

  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const highCount = violations.filter(v => v.severity === 'high').length;
  const hasHardcodedKeys = violations.some(v => v.rule === 'SEC-001' || (v.message || '').includes('Hardcoded'));
  const hasShadowAI = shadowAI.length > 0;
  const hasAgents = agents.length > 0;
  
  const hasHumanInTheLoop = agents.some(a => !a.isAutonomous || (a as any).humanOversight);
  const hasLoopProtection = violations.every(v => v.rule !== 'AG-002');
  const hasInputValidation = violations.every(v => v.rule !== 'AG-001' && v.rule !== 'SEC-002');

  const strengths: string[] = [];
  const gaps: string[] = [];

  // Avaliação de forças identificadas
  if (hasAgents) strengths.push(`Inventário de ${agents.length} agentes/frameworks mapeado.`);
  if (!hasHardcodedKeys) strengths.push('Gerenciamento de credenciais via variáveis de ambiente.');
  if (hasLoopProtection) strengths.push('Ausência de loops infinitos não controlados em agentes.');
  if (hasHumanInTheLoop) strengths.push('Supervisão humana (HITL) identificada em parte dos fluxos.');

  // Avaliação de lacunas encontradas
  if (criticalCount > 0) gaps.push(`${criticalCount} vulnerabilidade(s) crítica(s) identificada(s).`);
  if (hasShadowAI) gaps.push(`${shadowAI.length} chamada(s) a LLM sem governança centralizada (Shadow AI).`);
  if (!hasInputValidation) gaps.push('Ausência de sanitização formal de prompts contra injeção.');
  if (highCount > 0) gaps.push(`${highCount} achado(s) de alta severidade regulatória pendente(s).`);

  // Regra de Classificação de Nível:
  
  // Nível 1: Se tem Shadow AI descontrolada, chaves expostas ou muitas violações críticas
  if (hasHardcodedKeys || (hasShadowAI && criticalCount >= 2) || (agents.length === 0 && externalServices.length > 0)) {
    return {
      level: 1,
      title: 'Nível 1 - Ad-Hoc / Não Gerenciado',
      shortTitle: 'Ad-Hoc',
      badge: 'NÍVEL 1 (AD-HOC)',
      rationale: 'Uso disperso de APIs de IA sem inventário formal, presença de chaves em código ou Shadow AI ativa.',
      strengths,
      gaps,
      nextLevelCriteria: 'Eliminar credenciais em código, inventariar todas as chamadas a LLMs e estruturar rastreabilidade estática.',
    };
  }

  // Nível 2: Possui código analisado e inventário estático mapeado, mas ainda possui violações e falta governança ativa de runtime
  if (criticalCount > 0 || hasShadowAI || !hasHumanInTheLoop || highCount > 2) {
    return {
      level: 2,
      title: 'Nível 2 - Emergente / Mapeamento Estático',
      shortTitle: 'Emergente',
      badge: 'NÍVEL 2 (EMERGENTE)',
      rationale: `O repositório possui mapeamento estático e inventário de ${agents.length} agente(s), porém foram identificadas ${violations.length} pendência(s) de conformidade (${criticalCount} críticas, ${highCount} altas) que impedem a homologação formal.`,
      strengths,
      gaps,
      nextLevelCriteria: 'Remediar violações críticas/altas, homologar Custodiantes Técnicos (RACI) e instituir supervisão humana (HITL).',
    };
  }

  // Nível 3: Sem violações críticas, HITL ativo, mas sem telemetria em tempo real
  if (highCount > 0 || !hasInputValidation) {
    return {
      level: 3,
      title: 'Nível 3 - Definido & Estruturado',
      shortTitle: 'Definido',
      badge: 'NÍVEL 3 (DEFINIDO)',
      rationale: 'Processos de supervisão humana (HITL) e governança estática estabelecidos, com 0 violações críticas.',
      strengths,
      gaps,
      nextLevelCriteria: 'Implementar guardrails de runtime em produção, telemetria de tokens (FinOps) e SLAs.',
    };
  }

  // Nível 4: 0 críticas, 0 altas, guardrails ativos
  if (violations.length > 0) {
    return {
      level: 4,
      title: 'Nível 4 - Quantitativamente Gerenciado',
      shortTitle: 'Gerenciado',
      badge: 'NÍVEL 4 (GERENCIADO)',
      rationale: 'Controles técnicos sólidos em código, matriz de governança preenchida e guardrails implementados.',
      strengths,
      gaps,
      nextLevelCriteria: 'Automatizar bloqueios em esteiras de CI/CD e monitoramento contínuo de deriva de modelos (Model Drift).',
    };
  }

  // Nível 5: Excelência regulatória máxima (0 violações em todas as 13 regulações)
  return {
    level: 5,
    title: 'Nível 5 - Otimização Contínua',
    shortTitle: 'Otimizado',
    badge: 'NÍVEL 5 (OTIMIZADO)',
    rationale: '100% de conformidade com as 13 regulações, trilhas imutáveis de auditoria e arquitetura resiliente.',
    strengths,
    gaps,
    nextLevelCriteria: 'Manter auditorias contínuas pós-deploy e recertificações anuais ISO 42001.',
  };
}
