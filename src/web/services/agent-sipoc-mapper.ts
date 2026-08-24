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
      },
    };
  }

  // 9. Default Fallback (Dynamic & Contextual)
  const cleanName = agent.name.replace(/^lang(chain|graph)_/i, '').replace(/_/g, ' ');
  return {
    businessPurpose: `Processamento e orquestração de tarefas para o nó [${cleanName}], integrando modelos de linguagem e ferramentas de negócio.`,
    sipoc: {
      businessRole: `Processamento do Nó [${cleanName}]`,
      supplier: 'Pipeline de Execução / Grafo de Estado',
      input: 'Estado atual do fluxo e dados de entrada',
      process: `Execução de lógica via ${agent.framework || 'Framework de IA'} com verificação de segurança`,
      output: 'Estado atualizado e dados processados para a próxima etapa',
      customer: 'Próximo Nó do Grafo / Sistema de Destino',
    },
  };
}
