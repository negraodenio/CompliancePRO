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
 * Calcula o Nível de Maturidade de Governança de IA com base no Modelo de Maturidade ComplyPRO,
 * relacionando evidências técnicas do código aos princípios da ISO/IEC 42001, CMMI (Níveis 1-5)
 * e às quatro funções do NIST AI RMF (GOVERN, MAP, MEASURE, MANAGE).
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
  if (hasAgents) strengths.push(`Inventário de ${agents.length} agentes/modelos de IA mapeado (Função MAP).`);
  if (!hasHardcodedKeys) strengths.push('Gerenciamento seguro de credenciais via variáveis de ambiente.');
  if (hasLoopProtection) strengths.push('Controles de execução contra loops infinitos em agentes autônomos.');
  if (hasHumanInTheLoop) strengths.push('Mecanismos de supervisão humana (HITL) identificados no código.');

  // Avaliação de lacunas encontradas
  if (hasShadowAI) gaps.push(`${shadowAI.length} chamada(s) a LLM sem governança centralizada (Shadow AI).`);
  if (criticalCount > 0) gaps.push(`${criticalCount} vulnerabilidade(s) crítica(s) de segurança/conformidade.`);
  if (!hasInputValidation) gaps.push('Ausência de sanitização formal de prompts contra injeção direta/indireta.');
  if (highCount > 0) gaps.push(`${highCount} achado(s) de alta severidade regulatória pendente(s).`);

  // Regra de Classificação de Nível (Modelo ComplyPRO):
  
  // Nível 1: Práticas inexistentes, informais ou predominantemente reativas (Shadow AI, chaves expostas)
  if (hasHardcodedKeys || (hasShadowAI && criticalCount >= 2) || (agents.length === 0 && externalServices.length > 0)) {
    return {
      level: 1,
      title: 'Nível 1 — Ad-Hoc / Não Gerenciado',
      shortTitle: 'Ad-Hoc',
      badge: 'NÍVEL 1 (AD-HOC)',
      rationale: 'Uso de IA sem inventário formal, presença de chaves expostas no código ou Shadow AI não controlada.',
      strengths,
      gaps,
      nextLevelCriteria: 'Mapear todos os agentes e chamadas a LLMs, eliminar credenciais em código e documentar o contexto de uso.',
    };
  }

  // Nível 2: Primeiros mecanismos de identificação e controle começam a existir (MAP do NIST AI RMF)
  if (criticalCount > 0 || hasShadowAI || !hasHumanInTheLoop || highCount > 2) {
    return {
      level: 2,
      title: 'Nível 2 — Emergente / Identificação',
      shortTitle: 'Identificação',
      badge: 'NÍVEL 2 (EMERGENTE)',
      rationale: `A organização começou a mapear o seu ecossistema com ${agents.length} agente(s) e modelos identificados, mas ainda possui pendências de controles e governança (Função MAP do NIST AI RMF).`,
      strengths,
      gaps,
      nextLevelCriteria: 'Incorporar políticas de segurança, sanitização de prompts e controles repetíveis nas esteiras de desenvolvimento.',
    };
  }

  // Nível 3: Governance e controles formalizados e incorporados ao ciclo de desenvolvimento
  if (highCount > 0 || !hasInputValidation) {
    return {
      level: 3,
      title: 'Nível 3 — Estruturado / Controles Implementados',
      shortTitle: 'Estruturado',
      badge: 'NÍVEL 3 (ESTRUTURADO)',
      rationale: 'Controles de segurança, guardrails de prompt e processos de tratamento de risco formalizados no ciclo de vida de desenvolvimento (Processos definidos e repetíveis CMMI).',
      strengths,
      gaps,
      nextLevelCriteria: 'Operacionalizar métricas de risco e performance, formalizar RACI/ownership e implementar monitoramento contínuo (MEASURE).',
    };
  }

  // Nível 4: Controles operacionalizados, monitorizados e medidos (MEASURE do NIST AI RMF)
  if (violations.length > 0) {
    return {
      level: 4,
      title: 'Nível 4 — Gerenciado & Quantificado',
      shortTitle: 'Gerenciado',
      badge: 'NÍVEL 4 (GERENCIADO)',
      rationale: 'Controles técnicos sólidos com Human-in-the-Loop formalizado, rastreabilidade e métricas de risco ativas (Alinhado à dimensão MEASURE do NIST AI RMF).',
      strengths,
      gaps,
      nextLevelCriteria: 'Estabelecer sistema de melhoria contínua baseada em dados, análise de tendências e gestão dinâmica de drift.',
    };
  }

  // Nível 5: AI Governance funciona como um sistema contínuo de gestão, medição e melhoria (Optimizing CMMI / ISO 42001)
  return {
    level: 5,
    title: 'Nível 5 — Otimizado & Melhoria Contínua',
    shortTitle: 'Otimizado',
    badge: 'NÍVEL 5 (OTIMIZADO)',
    rationale: 'Governança de IA opera como um sistema contínuo de gestão, auditoria probatória e evolução baseada em métricas e evidências (Conceito Optimizing CMMI).',
    strengths,
    gaps,
    nextLevelCriteria: 'Manter auditorias contínuas pós-deploy e recertificações de maturidade periódicas.',
  };
}
