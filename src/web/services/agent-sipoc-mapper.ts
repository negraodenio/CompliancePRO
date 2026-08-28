import type { DetectedAgent, AgentSipoc } from '../../core/types';

/**
 * Maps an agent name, framework, tools, and context to a clear business role
 * and structured SIPOC (Supplier, Input, Process, Output, Customer) chain.
 */
export function getAgentBusinessAndSipoc(agent: DetectedAgent): {
  businessPurpose: string;
  sipoc: AgentSipoc;
} {
  const name = (agent.name || '').toLowerCase();
  const framework = (agent.framework || '').toLowerCase();
  const tools = agent.tools || [];
  const toolsStr = tools.join(' ').toLowerCase();

  // 1. Reviewer / Evaluator / Quality Gate
  if (name.includes('review') || name.includes('evaluat') || name.includes('critique') || name.includes('judge')) {
    return {
      businessPurpose: 'Avaliação de qualidade, aderência às diretrizes éticas e validação de respostas antes do envio ao cliente.',
      sipoc: {
        businessRole: 'Controle de Qualidade & Auditoria de Respostas',
        supplier: 'Agente Gerador / Pipeline RAG',
        input: 'Resposta candidata gerada + Critérios de validação',
        process: 'Verificação de alucinações, tom de voz e conformidade com políticas',
        output: 'Parecer de aprovação (Pass/Fail) e feedback de correção',
        customer: 'Agente Finalizador ou Usuário Solicitante',
        processOwner: 'Gerência de Qualidade, Ética & Risco de IA',
        technicalCustodian: 'Engenharia de Prompt & Avaliação de Modelos',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 2. Router / Orchestrator / Dispatcher
  if (name.includes('router') || name.includes('orchestrat') || name.includes('dispatch') || name.includes('supervisor')) {
    return {
      businessPurpose: 'Triagem semântica de solicitações de clientes e direcionamento dinâmico para agentes especialistas.',
      sipoc: {
        businessRole: 'Triagem e Roteamento Inteligente de Demandas',
        supplier: 'Interface do Usuário / API Gateway',
        input: 'Mensagem em linguagem natural / Prompt do cliente',
        process: 'Classificação de intenção via embeddings e regras de negócio',
        output: 'Roteamento com payload JSON para o agente de destino',
        customer: 'Agentes Especialistas do Grafo de Atendimento',
        processOwner: 'Operações & Experiência do Cliente (CX)',
        technicalCustodian: 'Arquitetura de Sistemas & Orquestração',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 3. Memory / Context / State Store
  if (name.includes('memory') || name.includes('state') || name.includes('context') || name.includes('history')) {
    return {
      businessPurpose: 'Gerenciamento de memória de curto e longo prazo, retenção de contexto de sessão e persistência de dados.',
      sipoc: {
        businessRole: 'Gestão de Memória & Contexto de Sessão',
        supplier: 'Histórico de Interações / Banco de Sessão',
        input: 'Identificador de usuário (ID) + Logs de conversas anteriores',
        process: 'Recuperação semântica de contexto relevante em cache/vetores',
        output: 'Sumário contextual estruturado injetado no prompt',
        customer: 'Agentes de Raciocínio e Tomada de Decisão',
        processOwner: 'Encarregado de Proteção de Dados (DPO) & Privacidade',
        technicalCustodian: 'Engenharia de Dados & Cache Vetorial',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 4. Research / RAG / Document Search
  if (name.includes('research') || name.includes('rag') || name.includes('search') || name.includes('retriev') || name.includes('doc')) {
    return {
      businessPurpose: 'Pesquisa contextual, recuperação de conhecimento em bases documentais não-estruturadas e grounding de fatos.',
      sipoc: {
        businessRole: 'Pesquisa Contextual & Recuperação em Base de Dados (RAG)',
        supplier: 'Base Vetorial (Vector DB) / Repositório de Documentos NoSQL',
        input: 'Consulta/pergunta do usuário + Embeddings de busca',
        process: 'Busca por similaridade vetorial e re-ranking de trechos relevantes',
        output: 'Trechos de documentos citados e referências fáticas em JSON',
        customer: 'Agente de Síntese e Geração de Respostas',
        processOwner: 'Gestão de Conhecimento & Operações de IA',
        technicalCustodian: 'Engenharia de MLOps & Base Vetorial',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 5. Tool / Function Execution / Data Transformation (e.g. NoSQL to SQL)
  if (name.includes('tool') || name.includes('execut') || name.includes('action') || name.includes('transform')) {
    const hasDb = toolsStr.includes('database') || toolsStr.includes('sql') || toolsStr.includes('postgres');
    return {
      businessPurpose: 'Execução de ferramentas de integração, transformação de payloads de dados e sincronização entre sistemas.',
      sipoc: {
        businessRole: 'Execução de Ações & Integração de Dados',
        supplier: 'Agente Decisor / Fila de Tarefas',
        input: 'Comando estruturado com parâmetros de chamada (ex: payload JSON)',
        process: hasDb 
          ? 'Consulta a registros, transformação de dados e gravação em banco relacional SQL' 
          : 'Chamada a endpoints de API externa e tratamento de respostas',
        output: 'Status de execução e dados sincronizados/gravados com sucesso',
        customer: 'Banco de Dados da Empresa / Sistema Transacional',
        processOwner: 'Segurança da Informação (CISO) & Infraestrutura',
        technicalCustodian: 'Engenharia de Backend & Integrações',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 6. Debate / Multi-Agent Consensus
  if (name.includes('debate') || name.includes('consensus') || name.includes('multi_agent')) {
    return {
      businessPurpose: 'Consenso multi-agente e debate estruturado entre diferentes perspectivas para mitigar vieses e alucinações.',
      sipoc: {
        businessRole: 'Consenso & Redução de Alucinações Multi-Agente',
        supplier: 'Múltiplos Agentes Especialistas',
        input: 'Argumentos e respostas concorrentes de diferentes LLMs',
        process: 'Rodadas de validação cruzada e alinhamento de premissas',
        output: 'Decisão consolidada e fundamentada em evidências',
        customer: 'Diretoria / Usuário Final da Aplicação',
        processOwner: 'Comitê Executivo de Ética & Risco de IA',
        technicalCustodian: 'Pesquisa & Desenvolvimento em IA (R&D)',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 7. Credit / Finance / Risk Agent
  if (name.includes('credit') || name.includes('financ') || name.includes('risk') || name.includes('scoring')) {
    return {
      businessPurpose: 'Análise de perfil financeiro, cálculo de score de crédito e recomendação de limite com supervisão humana.',
      sipoc: {
        businessRole: 'Avaliação de Risco de Crédito & Finanças',
        supplier: 'Cadastro de Clientes / Bureaus de Crédito',
        input: 'Dados de renda, histórico de pagamentos e valor solicitado',
        process: 'Modelagem preditiva e cálculo de risco de inadimplência',
        output: 'Parecer técnico de crédito com recomendação de taxa e limite',
        customer: 'Mesa de Crédito (Human-in-the-Loop) e Core Bancário',
        processOwner: 'Diretoria de Risco de Crédito & Compliance Regulatório',
        technicalCustodian: 'Modelagem Estatística & Engenharia de Risco',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 8. ReAct / Chat / Conversational Agent
  if (name.includes('react') || name.includes('chat') || name.includes('convers') || name.includes('assistant')) {
    return {
      businessPurpose: 'Atendimento interativo ao cliente, solução de dúvidas e execução autônoma de passos de raciocínio (ReAct).',
      sipoc: {
        businessRole: 'Assistente Conversacional & Raciocínio ReAct',
        supplier: 'Usuário Final / Portal de Atendimento',
        input: 'Mensagem de texto / Dúvida do cliente',
        process: 'Loop de raciocínio (Thought ➔ Action ➔ Observation)',
        output: 'Resposta clara em linguagem natural e ações disparadas',
        customer: 'Cliente Final no Canal de Atendimento',
        processOwner: 'Gerência de Atendimento & Canais Digitais',
        technicalCustodian: 'Engenharia de Chatbots & Aplicações Conversacionais',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 9. Default Fallback (Dynamic & Contextual)
  const cleanName = agent.name.replace(/^lang(chain|graph)_/i, '').replace(/_/g, ' ');
  const detectedFw = inferAgentFramework(agent);
  return {
    businessPurpose: `Processamento e orquestração de tarefas para o nó [${cleanName}], integrando modelos de linguagem e ferramentas de negócio.`,
    sipoc: {
      businessRole: `Processamento do Nó [${cleanName}]`,
      supplier: 'Pipeline de Execução / Grafo de Estado',
      input: 'Estado atual do fluxo e dados de entrada',
      process: `Execução de lógica via ${detectedFw} com verificação de segurança`,
      output: 'Estado atualizado e dados processados para a próxima etapa',
      customer: 'Próximo Nó do Grafo / Sistema de Destino',
      processOwner: 'Liderança de Produto & Engenharia de IA',
      technicalCustodian: 'Time de Desenvolvimento de IA',
      governanceStatus: 'PENDENTE_COMITE',
    },
  };
}

/**
 * Accurately infers framework from agent name, tools, and path
 * avoiding any fallback to 'Framework Genérico'.
 */
export function inferAgentFramework(agent: DetectedAgent): string {
  if (agent.framework && 
      agent.framework !== 'Framework Genérico' && 
      agent.framework !== 'Generic' && 
      agent.framework !== 'Custom Agent') {
    return agent.framework;
  }
  const name = (agent.name || '').toLowerCase();
  const filePath = (agent.filePath || '').toLowerCase();
  const tools = (agent.tools || []).join(' ').toLowerCase();

  if (name.includes('langgraph') || filePath.includes('langgraph') || tools.includes('langgraph') || filePath.includes('multi_agent')) {
    return 'LangGraph';
  }
  if (name.includes('crewai') || filePath.includes('crewai') || tools.includes('crewai')) {
    return 'CrewAI';
  }
  if (name.includes('autogen') || filePath.includes('autogen') || tools.includes('autogen')) {
    return 'AutoGen';
  }
  if (name.includes('langchain') || filePath.includes('langchain') || tools.includes('langchain')) {
    return 'LangChain';
  }
  if (name.includes('dify') || filePath.includes('dify') || tools.includes('dify')) {
    return 'Dify';
  }
  if (name.includes('llama_index') || name.includes('llamaindex') || filePath.includes('llama')) {
    return 'LlamaIndex';
  }
  if (name.includes('claude') || name.includes('anthropic') || filePath.includes('claude')) {
    return 'Anthropic Claude';
  }
  if (name.includes('openai') || filePath.includes('openai') || tools.includes('openai')) {
    return 'OpenAI Agents SDK';
  }
  if (name.includes('mcp') || filePath.includes('mcp') || tools.includes('mcp')) {
    return 'Model Context Protocol (MCP)';
  }
  if (name.includes('rag') || name.includes('retriev')) {
    return 'Agentic RAG Engine';
  }
  if (name.includes('react') || name.includes('executor')) {
    return 'ReAct Agent Pipeline';
  }
  return 'Python AI Workflow';
}


import type { 
  ScannerResult, 
  SystemBusinessXRay, 
  BusinessXRayFlowStage, 
  BusinessImpactSummary, 
  AgentPassportPreviewData 
} from '../../core/types';

/**
 * Extracts a structured, epistemically-grounded Business & Governance X-Ray from a ScannerResult.
 * Translates low-level AST/database/capability discoveries into a 4-stage business process chain,
 * a business impact summary, and an Agent Passport Preview.
 */
export function extractSystemBusinessXRay(result: ScannerResult): SystemBusinessXRay {
  const agents: DetectedAgent[] = result.source?.agents || [];
  const capabilities = result.agentCapabilities || [];
  const identities = result.agentIdentities || [];
  const repoName = result.repo?.name || 'Scanned System';

  // 1. STAGE 1: Customer / Source Data (SUPPLIERS & INPUTS)
  const readCaps = capabilities.filter(c => c.action === 'READ');
  const readResources = Array.from(new Set(readCaps.map(c => c.resourceTarget))).filter(Boolean);
  const stage1Items = readResources.length > 0
    ? readResources.map(r => 'Database Resource: ' + r)
    : (agents.length > 0 ? ['API Ingestion / Natural Language Prompts', 'Contextual Model Payloads'] : ['Scanned Source Code Input']);
  const stage1Confidence = readResources.length > 0 ? 'DIRECTLY_DERIVED' : 'INFERRED';

  // 2. STAGE 2: AI Assessment & Reasoning (PROCESS & DECISION)
  const agentNames = Array.from(new Set(agents.map(a => a.name))).slice(0, 6);
  const stage2Items = agentNames.length > 0
    ? agentNames.map(name => 'Autonomous Agent: ' + name)
    : ['Heuristic & Algorithmic Decision Engine'];
  const stage2Confidence = agentNames.length > 0 ? 'DIRECTLY_DERIVED' : 'INFERRED';

  // 3. STAGE 3: Decision & Execution (OUTPUTS & ACTIONS)
  const writeCaps = capabilities.filter(c => c.action === 'WRITE' || c.action === 'EXECUTE' || c.action === 'DELETE');
  const writeResources = Array.from(new Set(writeCaps.map(c => c.resourceTarget + ' (' + c.action + ')'))).filter(Boolean);
  const stage3Items = writeResources.length > 0
    ? writeResources.map(r => 'Direct Execution Target: ' + r)
    : (capabilities.length > 0 
        ? Array.from(new Set(capabilities.map(c => c.resourceTarget + ' (' + c.action + ')')))
        : ['Model Response Generation', 'Downstream State Update']);
  const stage3Confidence = writeResources.length > 0 ? 'DIRECTLY_DERIVED' : 'INFERRED';

  // 4. STAGE 4: Business Outcome & Stakeholders (CUSTOMERS & OUTCOMES)
  const primaryAgent = agents[0];
  let outcomeDesc = 'Operational Business Pipeline / Downstream Consumers';
  if (primaryAgent) {
    const { sipoc } = getAgentBusinessAndSipoc(primaryAgent);
    if (sipoc.customer) {
      outcomeDesc = sipoc.customer;
    }
  }
  const stage4Items = [
    'Impacted Domain: ' + outcomeDesc,
    'Governance Target: Production AI Asset Catalog'
  ];
  const stage4Confidence = 'INFERRED';

  const stages: BusinessXRayFlowStage[] = [
    {
      stageNumber: 1,
      stageName: 'Customer / Source Data',
      technicalSipocRole: 'SUPPLIERS & INPUTS',
      description: 'Data assets, tables, and ingestion sources fed into the autonomous components.',
      items: stage1Items,
      confidence: stage1Confidence,
      sourceEvidence: readResources.length > 0 ? readResources.length + ' tables accessed via SQL/ORM READ' : 'AST Inferred'
    },
    {
      stageNumber: 2,
      stageName: 'AI Assessment & Reasoning',
      technicalSipocRole: 'PROCESS & DECISION',
      description: 'Discovered agents, orchestrators, and prompt-driven reasoning workflows.',
      items: stage2Items,
      confidence: stage2Confidence,
      sourceEvidence: agents.length + ' agents detected in AST'
    },
    {
      stageNumber: 3,
      stageName: 'Decision & System Actions',
      technicalSipocRole: 'OUTPUTS & ACTIONS',
      description: 'Coded mutations, database writes, external tool invocations, and shell actions.',
      items: stage3Items,
      confidence: stage3Confidence,
      sourceEvidence: capabilities.length + ' operational capabilities discovered'
    },
    {
      stageNumber: 4,
      stageName: 'Business Outcome & Impact',
      technicalSipocRole: 'CUSTOMERS & OUTCOMES',
      description: 'Downstream business consumers, production environments, and regulatory scope.',
      items: stage4Items,
      confidence: stage4Confidence,
      sourceEvidence: 'Contextual Architecture Derivation'
    }
  ];

  // 5. BUSINESS IMPACT SUMMARY
  let primaryProcessName = 'General Automated Operations';
  if (primaryAgent) {
    const { sipoc } = getAgentBusinessAndSipoc(primaryAgent);
    primaryProcessName = sipoc.businessRole || primaryAgent.name;
  } else if (capabilities.some(c => c.resourceTarget.includes('patch') || c.resourceTarget.includes('repo'))) {
    primaryProcessName = 'Automated Code Remediation & Patching';
  } else if (capabilities.some(c => c.resourceTarget.includes('credit') || c.resourceTarget.includes('loan'))) {
    primaryProcessName = 'Autonomous Credit Underwriting';
  }

  const allAffectedResources = Array.from(new Set(capabilities.map(c => c.resourceTarget + ' (' + c.systemType + ')'))).slice(0, 5);
  const distinctActions = Array.from(new Set(capabilities.map(c => c.action + ' on ' + c.resourceTarget))).slice(0, 5);

  const impact: BusinessImpactSummary = {
    primaryProcess: primaryProcessName,
    resourcesAffected: allAffectedResources.length > 0 ? allAffectedResources : ['Application Memory / Prompt Context'],
    potentialBusinessActions: distinctActions.length > 0 ? distinctActions : ['LLM Inference Execution'],
    governanceStatus: 'Evidence Not Verified in Scanned Scope'
  };

  // 6. AGENT PASSPORT PREVIEW DATA
  const unverifiedCount = result.capabilitiesSummary?.unknownAuthorizationCount 
    ?? capabilities.filter(c => !c.authorizationEvidence || c.state === 'UNKNOWN_AUTHORIZATION').length;

  const assignedIdentity = identities.find(id => id.identityType !== 'unassigned');

  const passportPreview: AgentPassportPreviewData = {
    aiAsset: primaryAgent?.name || repoName,
    businessProcess: primaryProcessName,
    owner: 'UNKNOWN (Unassigned Business Owner)',
    identityBinding: assignedIdentity 
      ? assignedIdentity.agentName + ' -> ' + (assignedIdentity.roleMapped || assignedIdentity.identityType)
      : 'UNASSIGNED (No IAM / Service Account Binding Verified)',
    autonomyLevel: 'NOT VERIFIED IN SCANNED SCOPE',
    capabilitiesCount: capabilities.length,
    unverifiedAuthCount: unverifiedCount,
    verifiedHitl: 'NOT VERIFIED IN SCANNED SCOPE'
  };

  // 7. INDUSTRY CONTEXT (INFERRED)
  const fullText = (repoName + ' ' + capabilities.map(c => c.resourceTarget).join(' ') + ' ' + agents.map(a => a.name).join(' ')).toLowerCase();
  let industrySector: string | undefined;
  let industryEvidence: string | undefined;

  if (/credit|loan|bank|fraud|fintech|payment|underwriting|invest/i.test(fullText)) {
    industrySector = 'FinTech & Financial Services';
    industryEvidence = 'Keywords and resource targets related to credit, transactions, or financial ledger';
  } else if (/patient|health|clinical|doctor|hipaa|medical|hospital/i.test(fullText)) {
    industrySector = 'Healthcare & Life Sciences';
    industryEvidence = 'Keywords and resource targets related to clinical, medical, or patient data';
  } else if (/patch|code|repo|git|deploy|ci|cd|build|test/i.test(fullText)) {
    industrySector = 'Software Engineering & Autonomous DevOps';
    industryEvidence = 'Keywords and capabilities related to repository files, code patches, and execution';
  }

  return {
    stages,
    impact,
    passportPreview,
    industryContext: industrySector ? {
      sector: industrySector,
      evidence: industryEvidence!,
      confidence: 'INFERRED_FROM_EVIDENCE'
    } : undefined
  };
}
