import type { ActiveNavView } from '../components/AppShell';

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AcademyModule {
  id: string;
  moduleNumber: number;
  title: string;
  subtitle: string;
  category: 'FOUNDATIONS' | 'DISCOVERY' | 'GOVERNANCE' | 'OPERATIONS' | 'ASSURANCE' | 'LAB';
  estimatedMinutes: number;
  iconName: string;
  relatedNavView?: ActiveNavView;
  whatIsIt: string;
  whyItExists: string;
  howItWorks: string;
  howToUse: string[];
  whatYouSee: string;
  howToInterpret: string[];
  crossModuleConnections: {
    source: string;
    relationship: string;
    target: string;
    targetNavView: ActiveNavView;
  }[];
  whatToDoAfter: string[];
  howToProveAndAudit: string;
  knowledgeCheck: KnowledgeCheckQuestion[];
  labAction?: {
    label: string;
    description: string;
    targetNavView: ActiveNavView;
  };
}

export interface AcademyProgress {
  completedModuleIds: string[];
  currentModuleId: string;
  quizScores: Record<string, number>;
  certificateIssuedAt?: string;
  certificateId?: string;
  studentName?: string;
}

const STORAGE_KEY_PROGRESS = 'cg_ag_academy_progress_v1';

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'mod-01',
    moduleNumber: 1,
    title: 'Introduction to CG-AG Governance OS',
    subtitle: 'Core Problem, Architectural Layers & The Canonical Control Plane',
    category: 'FOUNDATIONS',
    estimatedMinutes: 12,
    iconName: 'LayoutDashboard',
    relatedNavView: 'overview-center',
    whatIsIt: 'O CG-AG Governance OS é o sistema operacional de governança, conformidade e controle para inteligência artificial corporativa e sistemas multi-agentes. Ele atua como o Control Plane independente sobre todo o ciclo de vida de IA.',
    whyItExists: 'A maioria das empresas opera com Shadow AI descontrolada, agentes autônomos sem rastreabilidade e riscos regulatórios severos (EU AI Act, LGPD, NIST AI RMF). Ferramentas de observabilidade tradicionais focam apenas em latência técnica. O Governance OS provê controle de políticas, autorizações em tempo real, evidências seladas e auditoria forense.',
    howItWorks: 'A arquitetura divide-se estritamente em: Identity (RBAC/ABAC) ➔ Authorization Engine ➔ Control Plane (12 Controles CG-AG) ➔ Domain Stores ➔ Persistence Adapter (PostgreSQL / In-Memory com OCC) ➔ Evidence Store (RFC 8785) ➔ Audit Ledger (Cadeia SHA-256) ➔ Observability & Telemetry.',
    howToUse: [
      '1. Acesse o Governance Center (overview-center) para monitorar a saúde global e a postura de conformidade.',
      '2. Identifique os três KPIs principais: AI Governance Index, Active Agents e Critical Non-Conformances.',
      '3. Utilize o menu lateral esquerdo como a esteira progressiva: Discover ➔ Govern ➔ Operate ➔ Assure.'
    ],
    whatYouSee: 'Cards de maturidade, índice de governança em escala 0-100%, radar de conformidade em 13 regulações e feed em tempo real de eventos regulatórios.',
    howToInterpret: [
      'Score Geral > 85%: Ambiente em conformidade estruturada (Nível 4 NIST).',
      'Score 60-84%: Conformidade parcial com gaps mandatórios pendentes.',
      'Score < 60%: Estado de alto risco com exposição a multas ou vazamentos.'
    ],
    crossModuleConnections: [
      { source: 'Governance Center', relationship: 'agrega métricas de', target: 'AI Inventory', targetNavView: 'discover-inventory' },
      { source: 'Governance Center', relationship: 'alimenta decisões em', target: 'Decisions Pipeline', targetNavView: 'operate-decisions' }
    ],
    whatToDoAfter: [
      'Navegue para a esteira Discover para mapear os primeiros ativos.',
      'Execute um scan de código para popular a governança com dados reais.'
    ],
    howToProveAndAudit: 'Cada métrica exibida é apoiada por registros canônicos de evidência no Protected Evidence e ancorada no Audit Ledger.',
    knowledgeCheck: [
      {
        id: 'q1-1',
        question: 'Qual é o papel fundamental do CG-AG Governance OS no ecossistema de IA?',
        options: [
          'Atuar como um framework para treinar novos modelos LLM',
          'Funcionar como o Control Plane independente de governança, políticas e evidências',
          'Substituir o repositório de código dos desenvolvedores',
          'Apenas gerar relatórios em PDF estáticos sem conexão com código'
        ],
        correctIndex: 1,
        explanation: 'O CG-AG Governance OS é o Control Plane que estabelece políticas, limites de autonomia, barreiras de segurança e auditoria forense sobre o Data Plane.'
      },
      {
        id: 'q1-2',
        question: 'Qual é a sequência canônica da jornada de governança no sistema?',
        options: [
          'Assure ➔ Operate ➔ Govern ➔ Discover',
          'Discover ➔ Govern ➔ Operate ➔ Assure',
          'Deploy ➔ Ignore ➔ Audit ➔ Fix',
          'Operate ➔ Discover ➔ Assure ➔ Govern'
        ],
        correctIndex: 1,
        explanation: 'A esteira de governança segue a ordem natural: Discover (descobrir ativos) ➔ Govern (aplicar políticas e controles) ➔ Operate (decidir e remediar) ➔ Assure (evidenciar e auditar).'
      }
    ],
    labAction: {
      label: 'Abrir Governance Center',
      description: 'Explore os KPIs e a visão macro no Governance Center.',
      targetNavView: 'overview-center'
    }
  },
  {
    id: 'mod-02',
    moduleNumber: 2,
    title: 'The Governance Journey (Lifecycle Architecture)',
    subtitle: 'From Uncontrolled Codebase to Sealed Cryptographic Ledger',
    category: 'FOUNDATIONS',
    estimatedMinutes: 10,
    iconName: 'Activity',
    relatedNavView: 'overview-center',
    whatIsIt: 'A Jornada de Governança é a esteira de 4 fases que transforma ativos de IA não monitorados em sistemas corporativos totalmente controlados, auditáveis e conformes com regulações globais.',
    whyItExists: 'Sem uma esteira estruturada, equipes tentam aplicar compliance de forma pontual e desarticulada, gerando silos de informação e falhas graves de auditoria.',
    howItWorks: 'A jornada transita ciclicamente por 4 estágios: DISCOVER (Inventário, Agentes, Passports) ➔ GOVERN (12 Controles, Risk Engine, Políticas) ➔ OPERATE (Decisões, HITL Approvals, Remediação, FinOps) ➔ ASSURE (Evidências RFC 8785, Audit Ledger, Dossiês Regulatórios).',
    howToUse: [
      '1. Descubra ativos executando AST Scanners no código.',
      '2. Classifique o nível de autonomia e atribua Passports.',
      '3. Avalie conformidade com os 12 Controles CG-AG.',
      '4. Tome decisões formais e ative Human-in-the-Loop.',
      '5. Sele a evidência no Audit Ledger imutável.'
    ],
    whatYouSee: 'Diagrama de esteira conectando os 4 pilares com badges de status de cada ativo no pipeline.',
    howToInterpret: [
      'Fase Discover: Mapeia O QUE EXISTE.',
      'Fase Govern: Define O QUE É PERMITIDO.',
      'Fase Operate: Executa CONTROLES E APROVAÇÕES EM RUNTIME.',
      'Fase Assure: Prova MATURIDADE A AUDITORES E REGULADORES.'
    ],
    crossModuleConnections: [
      { source: 'Discover', relationship: 'transmite ativos para', target: 'Govern', targetNavView: 'govern-controls' },
      { source: 'Govern', relationship: 'gera exigências para', target: 'Operate', targetNavView: 'operate-decisions' },
      { source: 'Operate', relationship: 'produz provas para', target: 'Assure', targetNavView: 'assure-evidence' }
    ],
    whatToDoAfter: [
      'Compreender o papel do Scanner como o ponto de entrada da jornada.'
    ],
    howToProveAndAudit: 'Toda transição de fase é registrada com timestamp, identidade do operador e hash determinístico.',
    knowledgeCheck: [
      {
        id: 'q2-1',
        question: 'O que ocorre na fase ASSURE da esteira?',
        options: [
          'Criação de novos agentes sem supervisão',
          'Geração de evidências seladas RFC 8785 e encadeamento em blocos no Audit Ledger',
          'Execução do deploy em produção sem validações',
          'Configuração inicial de provedores de IA'
        ],
        correctIndex: 1,
        explanation: 'A fase Assure sela registros canônicos de evidência e os ancora na blockchain interna para comprovação regulatória.'
      }
    ],
    labAction: {
      label: 'Examinar 12 Controles',
      description: 'Veja como os controles canônicos sustentam a fase GOVERN.',
      targetNavView: 'govern-controls'
    }
  },
  {
    id: 'mod-03',
    moduleNumber: 3,
    title: 'Scan & Discovery (AST Sensor Engine)',
    subtitle: 'Deep Code Inspection, ScannerResult & The Ingestion Bridge',
    category: 'DISCOVERY',
    estimatedMinutes: 15,
    iconName: 'Terminal',
    relatedNavView: 'tools-scanner',
    whatIsIt: 'O Codebase & Repository AST Scanner é o sensor primário que inspeciona repositórios GitHub, pastas locais ou arquivos ZIP em busca de agentes, prompts, chamadas a LLMs, Shadow AI e vulnerabilidades.',
    whyItExists: 'Agentes de IA e chamadas de API frequentemente entram no código sem documentação ou homologação prévia da equipe de segurança.',
    howItWorks: 'O motor utiliza análise estática de sintaxe (AST) para Python, TypeScript, JavaScript e Notebooks. Ele produz um `ScannerResult` estruturado que é ingerido atomicamente pelo `ScanGovernanceBridge` nos Domain Stores do Governance OS.',
    howToUse: [
      '1. Acesse Tools & Ingestion Sensors ➔ Codebase Scanner.',
      '2. Cole a URL de um repositório GitHub público ou faça upload de um ZIP.',
      '3. Clique em "Escanear Repositório".',
      '4. Observe o banner de Ingestão AST e os botões de atalho para Agents & Teams e Decisions.'
    ],
    whatYouSee: 'Barra de progresso da análise sintática, contagem de agentes identificados, modelos detectados, estimativa de custos e lista detalhada de violações com linhas de código.',
    howToInterpret: [
      'Shadow AI Detectada: Chamadas de LLM (OpenAI, Anthropic, Mistral) usando chaves ou endpoints sem controle.',
      'Violações OWASP / LGPD: Falhas como SQL Injection em prompts, falta de sanitização ou exposição de CPF.',
      'ScanId & Fingerprint: Identificador único da análise que garante idempotência e rastreabilidade.'
    ],
    crossModuleConnections: [
      { source: 'Codebase Scanner', relationship: 'ingere agentes em', target: 'Agents & Teams', targetNavView: 'discover-agents' },
      { source: 'Codebase Scanner', relationship: 'roteia riscos para', target: 'Decisions Pipeline', targetNavView: 'operate-decisions' },
      { source: 'Codebase Scanner', relationship: 'alimenta FinOps em', target: 'Runtime FinOps', targetNavView: 'operate-runtime' }
    ],
    whatToDoAfter: [
      'Navegue para Discover ➔ Agents & Teams para conferir os agentes extraídos.',
      'Abra Operate ➔ Decisions Pipeline para revisar os achados operacionais gerados.'
    ],
    howToProveAndAudit: 'O payload canônico do scan é transformado em Evidência Selada no Protected Evidence com digest SHA-256.',
    knowledgeCheck: [
      {
        id: 'q3-1',
        question: 'O que o ScanGovernanceBridge faz com o ScannerResult gerado pelo scanner?',
        options: [
          'Salva um arquivo temporário e descarta após fechar a aba',
          'Distribui atomicamente agentes, riscos, evidências e blocos de ledger para os Domain Stores',
          'Envia o código-fonte proprietário para a nuvem pública',
          'Gera dados fictícios caso o scan não encontre nada'
        ],
        correctIndex: 1,
        explanation: 'O bridge ingere 100% dos dados reais do scan nos Domain Stores com controle transacional OCC e integridade de ledger.'
      }
    ],
    labAction: {
      label: 'Abrir Codebase Scanner',
      description: 'Experimente escanear um dos projetos de demonstração ou seu próprio repositório.',
      targetNavView: 'tools-scanner'
    }
  },
  {
    id: 'mod-04',
    moduleNumber: 4,
    title: 'AI Inventory (Systems, Models & Ownership)',
    subtitle: 'Cataloging Enterprise AI Assets, Custodians & Hosting Tiers',
    category: 'DISCOVERY',
    estimatedMinutes: 10,
    iconName: 'Layers',
    relatedNavView: 'discover-inventory',
    whatIsIt: 'O AI Inventory é o catálogo central de todos os sistemas de inteligência artificial, pipelines RAG, modelos preditivos e endpoints ativos na corporação.',
    whyItExists: 'Regulações como EU AI Act (Artigo 60) e ISO 42001 exigem um registro oficial e atualizado de todos os sistemas de IA em operação, com seus respectivos responsáveis legais e técnicos.',
    howItWorks: 'Combina sistemas cadastrados formalmente com os componentes descobertos via AST Scan. Cada registro possui Business Owner, Tech Lead, nível de risco, status de governança e vínculos a políticas.',
    howToUse: [
      '1. Acesse Discover ➔ AI Inventory.',
      '2. Filtre por Tipo de Sistema, Tier de Risco ou Status de Governança.',
      '3. Clique em qualquer sistema para abrir o Drawer de Detalhes e examinar os controles aplicados.'
    ],
    whatYouSee: 'Tabela de inventário com badges de ambiente (Production, Staging), score de maturidade, proprietário e contagem de ferramentas conectadas.',
    howToInterpret: [
      'GOVERNED: Sistema homologado e aderente às políticas obrigatórias.',
      'ATTENTION: Sistema com achados pendentes ou revisão de risco necessária.',
      'EXPOSURE: Sistema em produção sem salvaguardas ou com violações críticas.'
    ],
    crossModuleConnections: [
      { source: 'AI Inventory', relationship: 'possui agentes detalhados em', target: 'Agents & Teams', targetNavView: 'discover-agents' },
      { source: 'AI Inventory', relationship: 'é avaliado em', target: 'Assessments', targetNavView: 'discover-assessments' }
    ],
    whatToDoAfter: [
      'Verificar se os Tech Leads e Business Owners estão preenchidos para cada ativo.'
    ],
    howToProveAndAudit: 'O inventário exporta relatórios de conformidade compatíveis com o Artigo 60 do EU AI Act.',
    knowledgeCheck: [
      {
        id: 'q4-1',
        question: 'Por que o AI Inventory é um requisito mandatório de conformidade?',
        options: [
          'Porque reduz o custo de licenças de software em 90%',
          'Porque legislações como o EU AI Act e ISO 42001 exigem transparência e registro formal de sistemas de IA',
          'Para permitir o treinamento de modelos com dados de clientes',
          'Apenas para organizar pastas no computador'
        ],
        correctIndex: 1,
        explanation: 'O inventário garante que nenhuma IA opere na penumbra (Shadow AI), atendendo aos requisitos de transparência e auditoria das normas globais.'
      }
    ],
    labAction: {
      label: 'Acessar AI Inventory',
      description: 'Inspecione a listagem de sistemas e seus respectivos níveis de risco.',
      targetNavView: 'discover-inventory'
    }
  },
  {
    id: 'mod-05',
    moduleNumber: 5,
    title: 'Agents & Teams, Passports & SIPOC Flow',
    subtitle: 'Autonomy Tiers (L1-L4), Tool Boundaries & Business Architecture',
    category: 'DISCOVERY',
    estimatedMinutes: 15,
    iconName: 'Bot',
    relatedNavView: 'discover-agents',
    whatIsIt: 'Esta área gerencia a frota de agentes autônomos de IA, seus AI Passports digitais com assinaturas criptográficas e a arquitetura de negócio estruturada em SIPOC.',
    whyItExists: 'Agentes autônomos realizam ações no mundo real (chamadas de banco, envio de e-mails, transações). Eles necessitam de limites rígidos de autonomia e papéis de negócio transparentes.',
    howItWorks: 'Cada agente possui: Autonomy Level (L1 Assistivo até L4 Alta Autonomia), Tool Permissions (READ_ONLY, EXECUTE_HIGH_PRIVILEGE), Failsafe Boundaries, AI Passport assinado digitalmente e Cadeia SIPOC (Supplier ➔ Input ➔ Process ➔ Output ➔ Customer).',
    howToUse: [
      '1. Acesse Discover ➔ Agents & Teams.',
      '2. Clique no botão "SIPOC" em qualquer linha da tabela para abrir o fluxo de negócio do agente.',
      '3. Examine as 5 etapas: Fornecedor, Entrada, Processamento, Saída e Cliente.',
      '4. Clique na aba "Passport" para verificar a assinatura digital e validade do passaporte.'
    ],
    whatYouSee: 'Grade de agentes com framework (CrewAI, LangGraph, AutoGen), modelo base, temperatura, lista de ferramentas com permissões e drawer lateral com abas de Topologia, SIPOC, Autonomia e Passaporte.',
    howToInterpret: [
      'L1 (Assistive): Sugestões somente leitura sem execução autônoma.',
      'L2 (Supervised): Ações executadas com revisão humana obrigatória.',
      'L3 (Autonomous Bounded): Ações autônomas dentro de limites estritos de segurança.',
      'L4 (High Autonomy): Execução complexa com exigência mandatória de HITL em pontos críticos.'
    ],
    crossModuleConnections: [
      { source: 'Agents & Teams', relationship: 'autonomia L3/L4 dispara', target: 'HITL Approvals', targetNavView: 'operate-approvals' },
      { source: 'Agents & Teams', relationship: 'passaportes geram blocos em', target: 'Audit Ledger', targetNavView: 'assure-audit' }
    ],
    whatToDoAfter: [
      'Inspecione os 12 Controles CG-AG para entender as salvaguardas que limitam esses agentes.'
    ],
    howToProveAndAudit: 'O AI Passport possui assinatura digital inviolável SHA-256 e data de validade para auditorias externas.',
    knowledgeCheck: [
      {
        id: 'q5-1',
        question: 'O que o diagrama SIPOC do agente de IA representa na governança corporativa?',
        options: [
          'O consumo elétrico da GPU do servidor',
          'A cadeia completa de valor: Fornecedor (S), Entrada (I), Processo (P), Saída (O) e Destinatário (C)',
          'A linguagem de programação na qual o agente foi compilado',
          'A lista de senhas dos desenvolvedores'
        ],
        correctIndex: 1,
        explanation: 'O SIPOC conecta o código técnico ao processo corporativo, demonstrando aos auditores quem alimenta o agente e quem consome suas decisões.'
      }
    ],
    labAction: {
      label: 'Abrir Agents & Teams',
      description: 'Clique no botão SIPOC de um agente para inspecionar sua cadeia de dados.',
      targetNavView: 'discover-agents'
    }
  },
  {
    id: 'mod-06',
    moduleNumber: 6,
    title: 'The 12 Canonical CG-AG Controls',
    subtitle: 'From Asset Registry to Immutable Cryptographic Auditability',
    category: 'GOVERNANCE',
    estimatedMinutes: 15,
    iconName: 'CheckSquare',
    relatedNavView: 'govern-controls',
    whatIsIt: 'Os 12 Controles Canônicos CG-AG constituem o framework normativo que cobre todos os aspectos de segurança, privacidade, autonomia e conformidade de sistemas de IA.',
    whyItExists: 'Frameworks tradicionais de TI (como COBIT ou CIS) não abordam peculiaridades de IA como alucinações, drift de modelo, vazamento de prompt e autonomia descontrolada.',
    howItWorks: 'Cada controle possui regras determinísticas de avaliação, evidências exigidas e ações de remediação automáticas quando violado.',
    howToUse: [
      '1. Acesse Govern ➔ 12 CG-AG Controls.',
      '2. Filtre por status (Implemented, Partial, Deficient).',
      '3. Clique em um controle (ex: CG-AG-04 Failsafe & Circuit Breakers) para visualizar os requisitos técnicos.'
    ],
    whatYouSee: 'Matriz dos 12 controles: CG-AG-01 (Asset Inventory) até CG-AG-12 (Audit Ledger & Evidence Integrity), com barras de aderência e status de conformidade.',
    howToInterpret: [
      'CG-AG-01 a 04: Controles de Descoberta, Autonomia e Barreiras Failsafe.',
      'CG-AG-05 a 08: Controles de Segurança, Privacidade (PII) e Human-in-the-Loop.',
      'CG-AG-09 a 12: Controles de FinOps, Drift de Modelo, Dossiês e Trilha Imutável.'
    ],
    crossModuleConnections: [
      { source: '12 Controls', relationship: 'violações geram itens no', target: 'Risk Engine', targetNavView: 'govern-risk' },
      { source: '12 Controls', relationship: 'aderência alimenta', target: 'Compliance Frameworks', targetNavView: 'govern-compliance' }
    ],
    whatToDoAfter: [
      'Verifique se existem controles com status "Deficient" e abra o Risk Engine para tratá-los.'
    ],
    howToProveAndAudit: 'A matriz de controles é validada automaticamente por testes de regressão no CI/CD e ancorada em registros canônicos.',
    knowledgeCheck: [
      {
        id: 'q6-1',
        question: 'Qual controle CG-AG é responsável pelo mecanismo de Human-in-the-Loop?',
        options: [
          'CG-AG-01 (Asset Discovery)',
          'CG-AG-08 (Human-in-the-Loop & Decision Gates)',
          'CG-AG-10 (FinOps & Token Quota)',
          'CG-AG-06 (Privacy & LGPD)'
        ],
        correctIndex: 1,
        explanation: 'O controle CG-AG-08 estabelece as barreiras de aprovação humana mandatória para ações de alto risco ou impacto financeiro.'
      }
    ],
    labAction: {
      label: 'Explorar Matriz de Controles',
      description: 'Inspecione os 12 controles e seus critérios de conformidade.',
      targetNavView: 'govern-controls'
    }
  },
  {
    id: 'mod-07',
    moduleNumber: 7,
    title: 'Risk Engine & Operational Findings',
    subtitle: 'Synthesizing AST Risks, Violations, Shadow AI & PII into Findings',
    category: 'GOVERNANCE',
    estimatedMinutes: 12,
    iconName: 'AlertTriangle',
    relatedNavView: 'govern-risk',
    whatIsIt: 'O Risk Engine é o motor analítico que sintetiza todas as anomalias técnicas (vulnerabilidades AST, violações de regras, Shadow AI, vazamento de PII) em Achados Operacionais unificados (Operational Findings).',
    whyItExists: 'Relatórios brutos de scanners geram excesso de ruído ("alarming fatigue"). O Risk Engine classifica, deduplica e contextualiza os riscos pelo impacto real no negócio.',
    howItWorks: 'Mapeia cada achado em 4 níveis de severidade (CRITICAL, HIGH, MEDIUM, LOW) e categorias (AI_SECURITY, PRIVACY_LGPD, MODEL_SAFETY, AUTONOMY_RISK).',
    howToUse: [
      '1. Acesse Govern ➔ Risk Engine.',
      '2. Filtre por severidade CRITICAL ou HIGH.',
      '3. Inspecione o arquivo de origem, a linha de código e a recomendação técnica de mitigação.'
    ],
    whatYouSee: 'Gráfico de distribuição de severidade, matriz de probabilidade vs. impacto e feed de achados com links para o arquivo de origem.',
    howToInterpret: [
      'CRITICAL: Vulnerabilidades ativas como injeção direta de prompt, credenciais expostas em código ou agentes L4 sem barreiras.',
      'HIGH: Ausência de sanitização de PII ou uso de modelos não homologados em fluxos com dados de clientes.',
      'MEDIUM/LOW: Inconformidades de documentação ou desvios de boas práticas.'
    ],
    crossModuleConnections: [
      { source: 'Risk Engine', relationship: 'converte achados em decisões no', target: 'Decisions Pipeline', targetNavView: 'operate-decisions' },
      { source: 'Risk Engine', relationship: 'riscos críticos ativam', target: 'HITL Approvals', targetNavView: 'operate-approvals' }
    ],
    whatToDoAfter: [
      'Avançar para o Decisions Pipeline para registrar a tratativa formal de cada risco.'
    ],
    howToProveAndAudit: 'Cada finding possui rastreabilidade ao hash do arquivo e à regra violada.',
    knowledgeCheck: [
      {
        id: 'q7-1',
        question: 'Qual é o destino de um achado de risco categorizado como CRITICAL?',
        options: [
          'É arquivado automaticamente sem notificação',
          'Gera um Operational Finding no Decisions Pipeline e uma requisição de aprovação no HITL Approvals',
          'Bloqueia o computador do desenvolvedor',
          'Exclui o repositório de código'
        ],
        correctIndex: 1,
        explanation: 'Riscos críticos exigem decisão formal e aprovação humana (HITL) com plano de remediação obrigatório.'
      }
    ],
    labAction: {
      label: 'Abrir Risk Engine',
      description: 'Analise a distribuição de severidades e os achados operacionais ativos.',
      targetNavView: 'govern-risk'
    }
  },
  {
    id: 'mod-08',
    moduleNumber: 8,
    title: 'Decision Pipeline (The Authority Core)',
    subtitle: 'From Finding to Action: Recording Formal Governance Decisions',
    category: 'OPERATIONS',
    estimatedMinutes: 12,
    iconName: 'Scale',
    relatedNavView: 'operate-decisions',
    whatIsIt: 'O Decisions Pipeline é o módulo de tomada de decisão formal da corporação. Ele transforma achados de risco em deliberações registradas com autoridade formal.',
    whyItExists: 'Em auditorias, a maior falha é a falta de registro formal: quem aprovou a exceção? quem determinou a mitigação? quando foi decidido? O pipeline garante não-repúdio.',
    howItWorks: 'Permite 4 tipos de decisão: APPROVE_EXCEPTION (com prazo e justificativa), REQUIRE_REMEDIATION (abre ação no Remediation Store), TRIGGER_FAILSAFE (bloqueia o agente), ou ACCEPT_RISK (com aprovação C-Level).',
    howToUse: [
      '1. Acesse Operate ➔ Decisions Pipeline.',
      '2. Selecione um finding pendente de decisão.',
      '3. Escolha a ação formal (ex: Require Remediation).',
      '4. Registre a justificativa técnica e confirme.'
    ],
    whatYouSee: 'Quadro Kanban e listagem de decisões com status: PENDING_REVIEW, IN_ANALYSIS, APPROVED, REJECTED.',
    howToInterpret: [
      'Decisão Registrada: Gera automaticamente um registro de evidência selado e, se aplicável, um card de remediação.',
      'RACI Enforced: Apenas usuários com permissões RBAC/ABAC adequadas podem assinar decisões.'
    ],
    crossModuleConnections: [
      { source: 'Decisions Pipeline', relationship: 'gera ações de correção no', target: 'Remediation Actions', targetNavView: 'operate-actions' },
      { source: 'Decisions Pipeline', relationship: 'decisões de exceção disparam', target: 'Protected Evidence', targetNavView: 'assure-evidence' }
    ],
    whatToDoAfter: [
      'Acompanhar a execução das ações geradas em Remediation Actions.'
    ],
    howToProveAndAudit: 'A decisão é assinada com o ID do usuário, timestamp e gravada na blockchain interna do Audit Ledger.',
    knowledgeCheck: [
      {
        id: 'q8-1',
        question: 'O que acontece automaticamente quando uma decisão "Require Remediation" é tomada?',
        options: [
          'O sistema desliga todos os servidores',
          'Uma ação corretiva é criada no RemediationStore e uma evidência canônica é selada no EvidenceStore',
          'O código é excluído do GitHub',
          'Nada acontece até a próxima semana'
        ],
        correctIndex: 1,
        explanation: 'A tomada de decisão propaga a ordem para o plano operacional de remediação e registra a prova imutável no EvidenceStore.'
      }
    ],
    labAction: {
      label: 'Acessar Decisions Pipeline',
      description: 'Veja como os achados aguardam deliberação da equipe de governança.',
      targetNavView: 'operate-decisions'
    }
  },
  {
    id: 'mod-09',
    moduleNumber: 9,
    title: 'HITL Approvals (Human-in-the-Loop Gates)',
    subtitle: 'Step-Up Authorization, Escalation & Runtime Interception',
    category: 'OPERATIONS',
    estimatedMinutes: 12,
    iconName: 'LockKeyhole',
    relatedNavView: 'operate-approvals',
    whatIsIt: 'O HITL Approvals é a barreira de controle em que ações críticas de IA ou de governança são interceptadas e aguardam autorização humana explícita.',
    whyItExists: 'Ações que afetam pessoas diretamente (ex: recusa de crédito, diagnóstico médico, transações financeiras vultosas) não podem ser executadas de forma 100% autônoma por força de lei (Art. 20 LGPD, Art. 14 EU AI Act).',
    howItWorks: 'Quando um agente L3/L4 tenta executar uma ferramenta de alto privilégio ou quando um risco crítico é descoberto, um gate `PENDING_APPROVAL` é emitido com timeout e política de escalonamento.',
    howToUse: [
      '1. Acesse Operate ➔ HITL Approvals.',
      '2. Inspecione o payload da solicitação, o agente solicitante e o impacto financeiro/legal.',
      '3. Clique em "Approve" (Autorizar) ou "Reject" (Rejeitar com justificativa).'
    ],
    whatYouSee: 'Lista de aprovações pendentes com contagem regressiva de SLA, agente de origem, permissão solicitada e dados de contexto.',
    howToInterpret: [
      'PENDING_APPROVAL: Execução congelada no gate aguardando humano.',
      'APPROVED: Autorizado por operador credenciado.',
      'REJECTED: Operação abortada e barreira failsafe acionada.',
      'ESCALATED: Prazo estourado, encaminhado para o DPO / CISO.'
    ],
    crossModuleConnections: [
      { source: 'HITL Approvals', relationship: 'aprovações autorizam', target: 'Agents & Teams', targetNavView: 'discover-agents' },
      { source: 'HITL Approvals', relationship: 'cada decisão sela bloco em', target: 'Audit Ledger', targetNavView: 'assure-audit' }
    ],
    whatToDoAfter: [
      'Validar que todas as aprovações críticas foram tratadas dentro do SLA regulatório.'
    ],
    howToProveAndAudit: 'O log de aprovação contém assinatura criptográfica do aprovador humano, comprovando a supervisão ativa (Human Oversight).',
    knowledgeCheck: [
      {
        id: 'q9-1',
        question: 'Qual é o princípio legal e operacional do Human-in-the-Loop (HITL)?',
        options: [
          'Substituir completamente todos os operadores humanos por bots',
          'Garantir que decisões de alto impacto sobre pessoas físicas tenham supervisão e validação humana obrigatória',
          'Aumentar o tempo de resposta das aplicações para economizar servidores',
          'Permitir que agentes de IA alterem senhas de administradores'
        ],
        correctIndex: 1,
        explanation: 'O HITL atende aos requisitos de explicabilidade e supervisão humana mandatória estabelecidos pela LGPD e pelo EU AI Act.'
      }
    ],
    labAction: {
      label: 'Abrir HITL Approvals',
      description: 'Inspecione as filas de aprovação e as solicitações pendentes de autorização.',
      targetNavView: 'operate-approvals'
    }
  },
  {
    id: 'mod-10',
    moduleNumber: 10,
    title: 'Remediation Actions (Corrective Engineering)',
    subtitle: 'P0/P1 Resolution Workflows, Technical Owners & Verification',
    category: 'OPERATIONS',
    estimatedMinutes: 10,
    iconName: 'CheckCircle2',
    relatedNavView: 'operate-actions',
    whatIsIt: 'Remediation Actions é o centro de gerenciamento de planos de ação corretiva para eliminar vulnerabilidades, brechas de conformidade e riscos de código.',
    whyItExists: 'Descobrir riscos sem um fluxo de resolução rastreável gera passivo jurídico ("conhecia o risco e nada fez"). O módulo garante o ciclo de vida completo até o fechamento com verificação.',
    howItWorks: 'Cada ação de remediação possui Prioridade (P0 Crítico, P1 Alto, P2 Médio), Responsável Técnico (Owner), Data Limite (Due Date), Passos Técnicos de Correção e Status (OPEN, IN_PROGRESS, VERIFYING, RESOLVED).',
    howToUse: [
      '1. Acesse Operate ➔ Remediation Actions.',
      '2. Filtre por ações OPEN de prioridade P0.',
      '3. Aplique a correção recomendada no código.',
      '4. Atualize o status para VERIFYING para que o scanner revalide a correção.'
    ],
    whatYouSee: 'Quadro de ações com prazos, recomendações técnicas passo a passo e histórico de atualizações.',
    howToInterpret: [
      'P0 (SLA 24h): Correções de emergência para Shadow AI crítica ou injeções ativas.',
      'P1 (SLA 7d): Correções de PII desprotegida ou ausência de guardrails.',
      'RESOLVED: Risco mitigado e validado em novo scan.'
    ],
    crossModuleConnections: [
      { source: 'Remediation Actions', relationship: 'encerra achados no', target: 'Risk Engine', targetNavView: 'govern-risk' },
      { source: 'Remediation Actions', relationship: 'mudança de status gera bloco em', target: 'Audit Ledger', targetNavView: 'assure-audit' }
    ],
    whatToDoAfter: [
      'Executar um novo scan para atestar a eliminação da vulnerabilidade.'
    ],
    howToProveAndAudit: 'O fechamento da ação de remediação sela um registro de evidência provando a diligência corporativa perante reguladores.',
    knowledgeCheck: [
      {
        id: 'q10-1',
        question: 'Qual é o status que uma ação de remediação atinge quando o desenvolvedor submete a correção para revalidação?',
        options: [
          'DISMISSED',
          'VERIFYING',
          'IGNORED',
          'PROHIBITED'
        ],
        correctIndex: 1,
        explanation: 'O status VERIFYING indica que a correção foi aplicada e aguarda validação pelo scanner para o encerramento formal.'
      }
    ],
    labAction: {
      label: 'Acessar Remediation Actions',
      description: 'Veja os planos de ação corretiva abertos e seus respectivos donos.',
      targetNavView: 'operate-actions'
    }
  },
  {
    id: 'mod-11',
    moduleNumber: 11,
    title: 'Protected Evidence (RFC 8785 Sealed Records)',
    subtitle: 'Cryptographic Provenance, Canonical JSON & Tamper Resistance',
    category: 'ASSURANCE',
    estimatedMinutes: 15,
    iconName: 'FolderCheck',
    relatedNavView: 'assure-evidence',
    whatIsIt: 'O Protected Evidence é o cofre criptográfico que armazena todas as provas de conformidade, scans, autorizações HITL e decisões tomadas no Governance OS.',
    whyItExists: 'Em auditorias forenses ou litígios judiciais, prints de tela ou logs convencionais são descartados como provas manipuláveis. Evidências seladas em formato canônico têm validade jurídica internacional.',
    howItWorks: 'Utiliza o padrão RFC 8785 (JSON Canonicalization Scheme) para normalizar o payload de dados de forma estrita, gerando um hash criptográfico determinístico SHA-256 (`SHA256:<64_hex_digits>`) que é selado (`SEALED_IN_LEDGER`).',
    howToUse: [
      '1. Acesse Assure ➔ Protected Evidence.',
      '2. Localize um registro de evidência (ex: SCAN_INGESTION_EVIDENCE).',
      '3. Clique em "View Canonical JSON" para inspecionar o payload normalizado RFC 8785.',
      '4. Verifique o Integrity Digest e o status SEALED_IN_LEDGER.'
    ],
    whatYouSee: 'Tabela de evidências seladas com tipo, autor, timestamp UTC, hash SHA-256 e status de validação de integridade.',
    howToInterpret: [
      'CANONICAL_JSON_RFC8785: Chaves JSON ordenadas alfabeticamente sem espaços ou quebras inconsistentes.',
      'SEALED_IN_LEDGER: A evidência foi minerada em um bloco imutável do Audit Ledger e não pode mais ser alterada.'
    ],
    crossModuleConnections: [
      { source: 'Protected Evidence', relationship: 'é ancorada bloco a bloco no', target: 'Audit Ledger', targetNavView: 'assure-audit' },
      { source: 'Protected Evidence', relationship: 'alimenta as seções de prova em', target: 'Regulatory Dossiers', targetNavView: 'assure-reports' }
    ],
    whatToDoAfter: [
      'Navegar para o Audit Ledger para visualizar a cadeia de blocos que ancora essas evidências.'
    ],
    howToProveAndAudit: 'Auditores podem recalcular o SHA-256 do JSON canônico e atestar que a evidência permaneceu 100% inalterada.',
    knowledgeCheck: [
      {
        id: 'q11-1',
        question: 'Por que o padrão RFC 8785 (JSON Canonicalization) é essencial para as evidências de conformidade?',
        options: [
          'Porque reduz o tamanho do banco de dados em 50%',
          'Porque garante que qualquer ordenação de campos ou espaçamento produza exatamente o mesmo hash criptográfico SHA-256',
          'Porque traduz o JSON para código binário fechado',
          'Porque impede que desenvolvedores usem JavaScript'
        ],
        correctIndex: 1,
        explanation: 'A canonização RFC 8785 elimina ambiguidades de formatação, garantindo que o cálculo de hash seja 100% determinístico e auditável.'
      }
    ],
    labAction: {
      label: 'Abrir Protected Evidence',
      description: 'Inspecione os registros canônicos e seus respectivos hashes criptográficos.',
      targetNavView: 'assure-evidence'
    }
  },
  {
    id: 'mod-12',
    moduleNumber: 12,
    title: 'Audit Ledger (Immutable Cryptographic Chain)',
    subtitle: 'Genesis Block, SHA-256 Linking & Zero-Knowledge Verification',
    category: 'ASSURANCE',
    estimatedMinutes: 15,
    iconName: 'BookOpen',
    relatedNavView: 'assure-audit',
    whatIsIt: 'O Audit Ledger é a trilha de auditoria imutável construída sobre uma estrutura de encadeamento criptográfico de blocos (blockchain interna determinística).',
    whyItExists: 'Garante a impossibilidade de adulteração de logs retroativos ("anti-tampering"), impedindo que atores maliciosos ou administradores apaguem incidentes ou decisões passadas.',
    howItWorks: 'Cada bloco $n$ contém o hash do bloco anterior ($H_{n-1}$), o hash da evidência associada e seu próprio hash resultante: $H_n = \text{SHA256}(H_{n-1} \parallel \text{PayloadHash})$. Qualquer alteração em um bloco histórico quebra a cadeia inteira.',
    howToUse: [
      '1. Acesse Assure ➔ Audit Ledger.',
      '2. Observe a altura da cadeia (Block Height) e o bloco Genesis.',
      '3. Clique em "Run Ledger Cryptographic Verification" para verificar toda a cadeia.',
      '4. Inspecione os hashes dos blocos e a continuidade de elos.'
    ],
    whatYouSee: 'Linha do tempo visual de blocos interligados por hashes, relatório de integridade (Chain Valid: True, Broken Links: 0) e payload de cada transação.',
    howToInterpret: [
      'isChainValid: true ➔ A cadeia está íntegra e sem adulterações.',
      'Broken Links > 0 ➔ Alerta crítico de adulteração de histórico.',
      'Genesis Block ➔ Bloco 0 inaugural que ancora a raiz de confiança da corporação.'
    ],
    crossModuleConnections: [
      { source: 'Audit Ledger', relationship: 'ancora todas as ações de', target: 'Protected Evidence', targetNavView: 'assure-evidence' },
      { source: 'Audit Ledger', relationship: 'valida a integridade do', target: 'Operations Center', targetNavView: 'tools-operations' }
    ],
    whatToDoAfter: [
      'Executar a verificação criptográfica periódica para atestar conformidade contínua.'
    ],
    howToProveAndAudit: 'Relatório forense de integridade exportável diretamente para órgãos reguladores (ANPD, EU AI Office, BACEN).',
    knowledgeCheck: [
      {
        id: 'q12-1',
        question: 'Como o Audit Ledger detecta se um registro antigo foi adulterado no banco de dados?',
        options: [
          'Enviando um e-mail diário para o suporte',
          'Recalculando a cadeia: o hash do bloco adulterado não coincidirá com o PreviousHash do bloco seguinte, quebrando a cadeia',
          'Bloqueando o acesso ao servidor',
          'Através de uma senha mestra'
        ],
        correctIndex: 1,
        explanation: 'A matemática do encadeamento SHA-256 torna impossível modificar qualquer byte de um bloco anterior sem invalidar todos os blocos subsequentes.'
      }
    ],
    labAction: {
      label: 'Abrir Audit Ledger',
      description: 'Execute a verificação de integridade criptográfica da cadeia de blocos.',
      targetNavView: 'assure-audit'
    }
  },
  {
    id: 'mod-13',
    moduleNumber: 13,
    title: 'Runtime FinOps & Cost Governance',
    subtitle: 'Token Consumption, Spend Velocity, Quotas & Circuit Breakers',
    category: 'OPERATIONS',
    estimatedMinutes: 12,
    iconName: 'Activity',
    relatedNavView: 'operate-runtime',
    whatIsIt: 'O Runtime FinOps é o centro de controle financeiro e operacional para monitorar custos, tokens consumidos, provedores de IA e impor limites orçamentários rígidos.',
    whyItExists: 'Agentes autônomos e loops de RAG podem consumir milhões de tokens em poucos minutos caso entrem em loops infinitos, gerando contas astronômicas não previstas.',
    howItWorks: 'Consome os dados de telemetria e o `_costEstimate` dos scans. Monitora velocidade de tokens por segundo, consumo por esquadrão/departamento e dispara Circuit Breakers (bloqueio automático) ao atingir 95% do budget.',
    howToUse: [
      '1. Acesse Operate ➔ Runtime FinOps.',
      '2. Inspecione o gasto mensal acumulado em USD e BRL.',
      '3. Verifique a distribuição de tokens por modelo (GPT-4o, Claude 3.5, Mistral).',
      '4. Configure cotas mensais e limites de requisições por minuto (RPM).'
    ],
    whatYouSee: 'Medidores de orçamento, gráfico de consumo de tokens em tempo real, custo por mil tokens e status do Circuit Breaker.',
    howToInterpret: [
      'WITHIN_LIMIT: Consumo abaixo de 80% da cota mensal.',
      'NEAR_QUOTA: Consumo entre 80% e 95% da cota (notificação enviada).',
      'CIRCUIT_BREAKER_TRIPPED: Cota atingida; requisições não essenciais bloqueadas.'
    ],
    crossModuleConnections: [
      { source: 'Runtime FinOps', relationship: 'circuit breaker aciona bloqueio em', target: 'Incidents & Failsafe', targetNavView: 'operate-incidents' },
      { source: 'Codebase Scanner', relationship: 'alimenta a estimativa de custos em', target: 'Runtime FinOps', targetNavView: 'operate-runtime' }
    ],
    whatToDoAfter: [
      'Ajustar as cotas mensais de acordo com a previsão orçamentária do esquadrão.'
    ],
    howToProveAndAudit: 'Evidência de controle orçamentário e diligência de governança de recursos (CG-AG-10).'
    ,
    knowledgeCheck: [
      {
        id: 'q13-1',
        question: 'O que o mecanismo de Circuit Breaker faz no Runtime FinOps?',
        options: [
          'Reinicia o computador do usuário',
          'Bloqueia automaticamente chamadas adicionais de LLM ao atingir o limite orçamentário para evitar despesas descontroladas',
          'Aumenta o limite do cartão de crédito da empresa',
          'Desinstala os modelos de IA'
        ],
        correctIndex: 1,
        explanation: 'O Circuit Breaker atua como uma chave disjuntora de segurança, prevenindo prejuízos financeiros por chamadas anômalas ou loops de agentes.'
      }
    ],
    labAction: {
      label: 'Abrir Runtime FinOps',
      description: 'Analise o consumo de tokens e as métricas financeiras da frota de IA.',
      targetNavView: 'operate-runtime'
    }
  },
  {
    id: 'mod-14',
    moduleNumber: 14,
    title: 'Compliance Frameworks & Regulatory Dossiers',
    subtitle: 'EU AI Act, LGPD, NIST AI RMF, ISO 42001 & Exportable RIPD',
    category: 'GOVERNANCE',
    estimatedMinutes: 15,
    iconName: 'Scale',
    relatedNavView: 'govern-compliance',
    whatIsIt: 'Módulo dedicado ao mapeamento de conformidade jurídica e geração de Dossiês Regulatórios oficiais (como o RIPD da LGPD e o Conformity Assessment do EU AI Act).',
    whyItExists: 'Apresentar conformidade a órgãos como ANPD, BACEN, ANVISA ou auditores internacionais exige relatórios estruturados com fundamentação legal exata e cruzamento de evidências.',
    howItWorks: 'Cruza os achados do scan e as decisões registradas com 13 regulações globais, calculando o score de aderência por artigo de lei e identificando lacunas regulatórias (gaps).',
    howToUse: [
      '1. Acesse Govern ➔ Compliance Frameworks.',
      '2. Inspecione o status de cada regulação (EU AI Act, LGPD Art. 38, NIST RMF, ISO 42001, OWASP LLM).',
      '3. Navegue para Assure ➔ Regulatory Dossiers para gerar o parecer executivo ou exportar o dossiê em PDF/JSON.'
    ],
    whatYouSee: 'Cards de regulação com barras de conformidade, listagem de artigos violados, status de enquadramento de risco (ex: High Risk Anexo III) e botão para gerar Dossiê.',
    howToInterpret: [
      'HIGH RISK (Anexo III): Classificação mandatória da UE para IA de crédito, saúde, biometria ou infraestrutura crítica.',
      'COMPLIANT: Todos os artigos mandatórios atendidos com evidências válidas.',
      'ACTION_REQUIRED: Gaps legais abertos que exigem resolução.'
    ],
    crossModuleConnections: [
      { source: 'Compliance Frameworks', relationship: 'se apoia em evidências de', target: 'Protected Evidence', targetNavView: 'assure-evidence' },
      { source: 'Compliance Frameworks', relationship: 'exporta dossiês em', target: 'Regulatory Dossiers', targetNavView: 'assure-reports' }
    ],
    whatToDoAfter: [
      'Exportar o Dossiê Regulatório consolidado para validação jurídica pelo DPO / Jurídico.'
    ],
    howToProveAndAudit: 'Dossiê estruturado com referência a cada artigo de lei e aos respectivos hashes das evidências comprobatórias.',
    knowledgeCheck: [
      {
        id: 'q14-1',
        question: 'O que o Dossiê Regulatório do CG-AG Governance OS consolida para a diretoria e auditores?',
        options: [
          'Apenas o código-fonte puro sem explicações',
          'O enquadramento legal, score de conformidade, lacunas mitigadas e referências a evidências seladas',
          'A lista de compras de hardware do departamento de TI',
          'Um contrato de prestação de serviços'
        ],
        correctIndex: 1,
        explanation: 'O Dossiê consolida a postura jurídica e técnica completa, provando aos reguladores que a organização cumpre os deveres de transparência e mitigação de risco.'
      }
    ],
    labAction: {
      label: 'Abrir Compliance Frameworks',
      description: 'Inspecione a aderência às 13 regulações suportadas pela plataforma.',
      targetNavView: 'govern-compliance'
    }
  },
  {
    id: 'mod-15',
    moduleNumber: 15,
    title: 'Operations Center & Health Observability',
    subtitle: 'System Probes, Readiness, Queues & Production Telemetry',
    category: 'OPERATIONS',
    estimatedMinutes: 10,
    iconName: 'Activity',
    relatedNavView: 'tools-operations',
    whatIsIt: 'O Operations Center é o cockpit de observabilidade técnica e operacional que monitora a saúde dos serviços de governança, banco de dados, filas e conexões MCP.',
    whyItExists: 'Um sistema de governança fora do ar não pode autorizar ações HITL nem selar evidências. É imperativo garantir 99.99% de disponibilidade e monitoramento ativo de integridade.',
    howItWorks: 'Executa probes contínuos de Liveness e Readiness, mede latência de commits transacionais, monitora filas de eventos e alerta contra qualquer anomalia de persistência ou rede.',
    howToUse: [
      '1. Acesse Tools & Operations ➔ Operations Center.',
      '2. Verifique o status dos serviços: Database, OCC Lock Engine, Ledger Integrity, Alerting Engine.',
      '3. Inspecione a latência média e os alertas operacionais ativos.'
    ],
    whatYouSee: 'Métricas de saúde de serviços (HEALTHY, DEGRADED, DOWN), tempo de resposta em milissegundos e log estruturado de operações.',
    howToInterpret: [
      'HEALTHY: Todos os probes de persistência e validação criptográfica operando normalmente.',
      'DEGRADED: Latência elevada ou fila de eventos acumulando pendências.',
      'CRITICAL_ALERT: Falha de conexão com PostgreSQL ou divergência de OCC.'
    ],
    crossModuleConnections: [
      { source: 'Operations Center', relationship: 'monitora persistência de', target: 'Protected Evidence', targetNavView: 'assure-evidence' },
      { source: 'Operations Center', relationship: 'observa integridade do', target: 'Audit Ledger', targetNavView: 'assure-audit' }
    ],
    whatToDoAfter: [
      'Garantir que todos os semáforos estejam verdes antes de autorizar deploys em produção.'
    ],
    howToProveAndAudit: 'Métricas de SLA e disponibilidade registradas de forma contínua.',
    knowledgeCheck: [
      {
        id: 'q15-1',
        question: 'Qual é o objetivo primordial do Operations Center no Governance OS?',
        options: [
          'Programar novas funcionalidades em tempo real',
          'Garantir a alta disponibilidade, saúde das sondas (probes) e integridade de persistência do Control Plane',
          'Exibir anúncios publicitários corporativos',
          'Substituir o antivírus do sistema operacional'
        ],
        correctIndex: 1,
        explanation: 'O Operations Center assegura que a infraestrutura de governança permaneça resiliente, ativa e monitorada 24/7.'
      }
    ],
    labAction: {
      label: 'Abrir Operations Center',
      description: 'Inspecione a saúde dos serviços, probes de liveness e métricas do sistema.',
      targetNavView: 'tools-operations'
    }
  },
  {
    id: 'mod-16',
    moduleNumber: 16,
    title: 'Incidents, Containment & Recovery',
    subtitle: 'Fail-Safe Circuit Breakers, Rollback Strategies & Blast Radius Control',
    category: 'OPERATIONS',
    estimatedMinutes: 12,
    iconName: 'Zap',
    relatedNavView: 'operate-incidents',
    whatIsIt: 'O módulo de Incidentes e Failsafe gerencia anomalias graves em tempo de execução, permitindo o isolamento imediato de agentes comprometidos e a contenção do raio de explosão (Blast Radius).',
    whyItExists: 'Quando um agente sofre jailbreak, prompt injection ou alucinação destrutiva, a resposta deve ser imediata e automatizada, sem depender de reuniões de emergência.',
    howItWorks: 'Oferece acionamento de Circuit Breaker (interrupção do agente), Rollback de versão de prompt/modelo, isolamento de ferramentas (Tool Quarantining) e registro do plano de contenção.',
    howToUse: [
      '1. Acesse Operate ➔ Incidents & Failsafe.',
      '2. Identifique incidentes ativos.',
      '3. Acione o botão de emergência "Trip Circuit Breaker" ou "Quarantine Agent".',
      '4. Registre a causa raiz e determine o plano de recuperação.'
    ],
    whatYouSee: 'Lista de incidentes com severidade, agente envolvido, ferramentas impactadas e histórico de ações de contenção.',
    howToInterpret: [
      'CONTAINED: Agente isolado da rede e ferramentas bloqueadas.',
      'RESOLVING: Causa raiz identificada e correção em andamento.',
      'CLOSED: Incidente encerrado após verificação e auditoria.'
    ],
    crossModuleConnections: [
      { source: 'Incidents & Failsafe', relationship: 'bloqueia agentes em', target: 'Agents & Teams', targetNavView: 'discover-agents' },
      { source: 'Incidents & Failsafe', relationship: 'sela relatório de incidente em', target: 'Audit Ledger', targetNavView: 'assure-audit' }
    ],
    whatToDoAfter: [
      'Executar post-mortem e abrir ações corretivas em Remediation Actions.'
    ],
    howToProveAndAudit: 'Relatório de incidente compatível com o dever de notificação do Artigo 73 do EU AI Act.',
    knowledgeCheck: [
      {
        id: 'q16-1',
        question: 'O que o isolamento de ferramentas (Tool Quarantining) realiza em um incidente com agente de IA?',
        options: [
          'Deleta o computador do Tech Lead',
          'Revoga instantaneamente as permissões de execução do agente, impedindo que ele envie e-mails, acesse bancos ou execute ordens',
          'Aumenta o limite de tokens do agente',
          'Envia o incidente para as redes sociais'
        ],
        correctIndex: 1,
        explanation: 'A quarentena revoga as permissões de ferramentas do agente em runtime, contendo o impacto destrutivo instantaneamente.'
      }
    ],
    labAction: {
      label: 'Abrir Incidents & Failsafe',
      description: 'Veja os controles de contenção, isolamento e barreiras de failsafe.',
      targetNavView: 'operate-incidents'
    }
  },
  {
    id: 'mod-17',
    moduleNumber: 17,
    title: 'Production Cutover, Migrations & Deployment',
    subtitle: 'Preflight Gates, PostgreSQL Isolation, Multi-Tenant OCC & Rollback',
    category: 'ASSURANCE',
    estimatedMinutes: 15,
    iconName: 'Server',
    relatedNavView: 'tools-deployment',
    whatIsIt: 'O módulo de Produção e Deployment gerencia a transição segura do ambiente de Staging para a Produção corporativa, com validação de preflight, migrações de banco e plano de rollback.',
    whyItExists: 'A ativação cega de sistemas de IA em produção gera riscos de corrupção de dados, quebra de isolamento multi-tenant e falhas catastróficas sem possibilidade de retorno.',
    howItWorks: 'Executa 6 gates de preflight obrigatórios: Schema Reconciliation, PostgreSQL Persistence Adapter, Multi-Tenant Isolation, RBAC/ABAC Tokens, Backup Snapshot e Cutover Controller.',
    howToUse: [
      '1. Acesse Tools & Operations ➔ Production Deployment.',
      '2. Execute os testes de Preflight automatizados.',
      '3. Verifique o status de reconciliação de schema do PostgreSQL.',
      '4. Autorize o Cutover de produção apenas se todos os 6 gates estiverem verdes.'
    ],
    whatYouSee: 'Painel de controle de cutover, status de migrações SQL (001 a 006), verificação de tenant isolation e gatilho de rollback instantâneo.',
    howToInterpret: [
      'GOLIVE_SUCCESSFUL: Produção ativada com integridade verificada.',
      'PREFLIGHT_BLOCKED: Um ou mais gates de segurança falharam; cutover proibido.',
      'ROLLBACK_READY: Ponto de restauração válido disponível para reversão em < 30 segundos.'
    ],
    crossModuleConnections: [
      { source: 'Production Deployment', relationship: 'garante persistência para', target: 'Protected Evidence', targetNavView: 'assure-evidence' },
      { source: 'Production Deployment', relationship: 'registra o evento de cutover em', target: 'Audit Ledger', targetNavView: 'assure-audit' }
    ],
    whatToDoAfter: [
      'Concluir o curso com o End-to-End Governance Lab no Módulo 18.'
    ],
    howToProveAndAudit: 'Change Request (CR) formal com assinatura digital de todos os gates de preflight cumpridos.',
    knowledgeCheck: [
      {
        id: 'q17-1',
        question: 'O que o Cutover Controller exige antes de permitir a transição para Produção?',
        options: [
          'Apenas o envio de uma mensagem no Slack',
          'Que todos os gates de preflight (schema, migrações, isolamento de tenant, backup e integridade) sejam validados com sucesso',
          'Que todos os dados anteriores sejam deletados',
          'Nenhuma validação prévia é necessária'
        ],
        correctIndex: 1,
        explanation: 'O Cutover Controller impede a promoção de código ou dados para produção sem que todos os requisitos de segurança e persistência estejam estritamente comprovados.'
      }
    ],
    labAction: {
      label: 'Abrir Production Deployment',
      description: 'Inspecione os gates de preflight e a infraestrutura de persistência.',
      targetNavView: 'tools-deployment'
    }
  },
  {
    id: 'mod-18',
    moduleNumber: 18,
    title: 'End-to-End Governance Lab (Hands-on Simulation)',
    subtitle: 'The 16-Step Master Walkthrough from AST Scan to Ledger Sealing',
    category: 'LAB',
    estimatedMinutes: 20,
    iconName: 'GraduationCap',
    relatedNavView: 'tools-scanner',
    whatIsIt: 'O Laboratório Prático de Ponta a Ponta é a simulação guiada que conduz o operador por todas as 16 etapas do ciclo de vida de governança em um ambiente interativo.',
    whyItExists: 'Para fixar o aprendizado, o operador precisa vivenciar a cadeia de causa e efeito: como um scan no código gera agentes, que produzem achados, que exigem decisões, que ativam aprovações HITL, que geram planos de ação e são selados em evidências imutáveis.',
    howItWorks: 'Apresenta um fluxo interativo de 16 passos com validação em tempo real e atalhos diretos para cada tela correspondente da plataforma.',
    howToUse: [
      '1. Siga os 16 passos da esteira interativa abaixo.',
      '2. Execute cada etapa utilizando os botões de atalho correspondentes.',
      '3. Ao concluir todos os passos, desbloqueie seu Certificado Oficial de Operador da Plataforma.'
    ],
    whatYouSee: 'Checklist interativo de 16 passos com indicador de conclusão, badges de proveniência e emissor de certificado oficial.',
    howToInterpret: [
      'Passos 1-4: Descoberta e Catalogação de Ativos (Scan, Inventory, Agents, Passports).',
      'Passos 5-8: Governança e Avaliação de Risco (12 Controles, Risk Engine, Findings, Compliance).',
      'Passos 9-12: Operações e Ação Corretiva (Decisions, HITL Approvals, Remediations, FinOps).',
      'Passos 13-16: Asseguração e Auditoria Imutável (Evidence RFC 8785, Audit Ledger, Operations, Certification).'
    ],
    crossModuleConnections: [
      { source: 'End-to-End Lab', relationship: 'valida o ciclo completo em', target: 'Governance Center', targetNavView: 'overview-center' }
    ],
    whatToDoAfter: [
      'Emitir o Certificado Oficial de "CG-AG Governance OS — Operator Foundation" e operar a plataforma com autonomia total!'
    ],
    howToProveAndAudit: 'Certificado com identificador único, data de emissão e assinatura digital do trust root de governança.',
    knowledgeCheck: [
      {
        id: 'q18-1',
        question: 'O que o operador do CG-AG Governance OS domina ao concluir a esteira de ponta a ponta?',
        options: [
          'Apenas a criação de prompts básicos para chatbots',
          'A operação autônoma de toda a esteira de governança: descoberta, mitigação de riscos, decisões formais, barreiras HITL e auditoria criptográfica',
          'Configuração de redes de computadores físicas',
          'Edição de vídeos de marketing'
        ],
        correctIndex: 1,
        explanation: 'O operador adquire competência técnica e regulatória para conduzir a governança corporativa de IA em nível enterprise.'
      }
    ],
    labAction: {
      label: 'Iniciar Scan no Laboratório',
      description: 'Execute o primeiro passo da jornada abrindo o Codebase Scanner.',
      targetNavView: 'tools-scanner'
    }
  }
];

export class AcademyStore {
  private static memoryProgress: AcademyProgress | null = null;

  static getProgress(): AcademyProgress {
    if (this.memoryProgress) {
      return JSON.parse(JSON.stringify(this.memoryProgress));
    }
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.memoryProgress = parsed;
          return parsed;
        } catch (e) {
          // fallback
        }
      }
    }
    const initial: AcademyProgress = {
      completedModuleIds: [],
      currentModuleId: 'mod-01',
      quizScores: {}
    };
    this.memoryProgress = initial;
    return initial;
  }

  static saveProgress(progress: AcademyProgress) {
    this.memoryProgress = JSON.parse(JSON.stringify(progress));
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
      } catch (e) {
        // fallback
      }
    }
  }

  static markModuleCompleted(moduleId: string, score?: number) {
    const current = this.getProgress();
    const completedSet = new Set(current.completedModuleIds);
    completedSet.add(moduleId);

    const scores = { ...current.quizScores };
    if (score !== undefined) {
      scores[moduleId] = score;
    }

    const currentIdx = ACADEMY_MODULES.findIndex(m => m.id === moduleId);
    let nextModuleId = current.currentModuleId;
    if (currentIdx !== -1 && currentIdx < ACADEMY_MODULES.length - 1) {
      nextModuleId = ACADEMY_MODULES[currentIdx + 1].id;
    }

    const updated: AcademyProgress = {
      ...current,
      completedModuleIds: Array.from(completedSet),
      currentModuleId: nextModuleId,
      quizScores: scores
    };

    if (updated.completedModuleIds.length === ACADEMY_MODULES.length && !updated.certificateId) {
      updated.certificateId = `CERT-CGAG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      updated.certificateIssuedAt = new Date().toISOString();
      updated.studentName = current.studentName || 'Enterprise AI Governance Operator';
    }

    this.saveProgress(updated);
    return updated;
  }

  static setStudentName(name: string) {
    const current = this.getProgress();
    current.studentName = name;
    this.saveProgress(current);
    return current;
  }

  static resetProgress() {
    const initial: AcademyProgress = {
      completedModuleIds: [],
      currentModuleId: 'mod-01',
      quizScores: {}
    };
    this.saveProgress(initial);
    return initial;
  }
}
