import type { AcademyModule } from './types';

export const LEVEL4_MODULES: AcademyModule[] = [
  {
    id: 'ac-10-governance-fundamentals',
    moduleNumber: 10,
    levelNumber: 4,
    title: 'Fundamentos de AI Governance',
    subtitle: 'Políticas, responsabilidades, ciclo de vida e a relação entre governação e evidência',
    difficulty: 'Intermédio',
    estimatedMinutes: 22,
    iconName: 'Shield',
    relatedNavView: 'govern-controls',
    relatedNavLabel: 'Controls Matrix',
    prerequisites: ['Módulo 9 — Testar e validar agentes'],
    learningObjectives: [
      'Descrever os componentes de um programa de governação de IA',
      'Explicar segregação de funções e responsabilidades',
      'Enquadrar o ciclo de vida do agente: registo, avaliação, aprovação, operação, alteração, incidente, desativação',
      'Relacionar governação com evidência auditável'
    ],
    conceptExplanation:
      'Governação de IA não é um documento — é um sistema de decisões com responsáveis, critérios e registos. Os componentes mínimos: POLÍTICAS (regras executáveis e não executáveis que traduzem requisitos e apetite de risco em instruções operacionais); RESPONSABILIDADES (quem define, quem opera, quem aprova, quem audita — segregação de funções quando o risco o justifica); INVENTÁRIO (o que existe, com dono); CONTROLOS (mecanismos que aplicam as políticas); EVIDÊNCIAS (prova de que controlos operaram e decisões foram tomadas); MELHORIA CONTÍNUA (incidentes, exceções e auditorias alimentam revisões).\n\nSegregação de funções: quem DESenha um agente não deve ser quem APROVA a sua entrada em produção de alto risco; quem OPERA não é quem AUDITA. O produto suporta esta separação através dos fluxos distintos de: especificação (Agent Studio), avaliação (Risk Engine, políticas), decisão (Decisions Pipeline), aprovação (HITL) e asseguração (evidências, auditoria, dossiers).\n\nCiclo de vida no produto: registo (módulo 8) → avaliação de risco (módulo 5) → avaliação de políticas (módulo 13) → decisão formal (Decisions Pipeline) → aprovação humana quando exigida (módulo 12) → operação monitorizada (incidentes, FinOps — módulo 17) → alterações (reavaliação quando agente, contexto ou evidências mudam) → incidentes (contenção e recuperação) → desativação (com registo).\n\nA relação governação↔evidência é bidirecional: governação PRODUZ evidências (cada decisão, aprovação, exceção gera registos); evidências SUSTENTAM governação (sem elas, as decisões são opiniões não verificáveis). Os módulos do nível 5 aprofundam a mecânica das evidências.',
    terminology: [
      { term: 'Política (policy)', definition: 'Regra de governação. No produto, políticas podem ser executáveis (guardrails avaliados em runtime) ou documentais.' },
      { term: 'Segregação de funções', definition: 'Separação entre quem implementa, quem aprova e quem audita, reduzindo conflitos de interesse e erros não detetados.' },
      { term: 'Apetite de risco', definition: 'Nível de risco que a organização aceita explicitamente — base para classificar exceções e priorizar controlos.' },
      { term: 'Ciclo de vida do agente', definition: 'Fases desde registo até desativação, com controlos e evidências por fase.' },
      { term: 'Exceção (exception)', definition: 'Desvio temporário e justificado de uma política, com validade e dono — nunca permanente nem silencioso.' }
    ],
    stepByStep: [
      { step: 'Abra a Controls Matrix (govern-controls)', detail: 'Observe o catálogo de controlos CG-AG e o seu estado de implementação.' },
      { step: 'Identifique as funções no seu contexto', detail: 'Defina: quem especifica, quem avalia, quem aprova, quem opera, quem audita — mesmo que numa PME sejam a mesma pessoa, declare as chapéus usadas.' },
      { step: 'Mapeie o ciclo de vida de um agente existente', detail: 'Para um agente real: em que fase está? Que evidências existem? Que decisões faltam?' },
      { step: 'Localize as políticas ativas', detail: 'No Policy Engine, identifique políticas ACTIVE e o seu estado de imposição (enforcement).' },
      { step: 'Relacione uma decisão a uma evidência', detail: 'Abra o Decisions Pipeline e uma evidência associada — confirme o vínculo decisão↔evidência.' }
    ],
    businessExample:
      'Numa organização de média dimensão, o comité de governança de IA reúne trimestralmente com três entregáveis: (1) inventário com donos e fases de ciclo de vida; (2) exceções ativas com validade e justificação; (3) incidentes e lições. O produto fornece a matéria-prima destes entregáveis (inventário, exceções em políticas, incidentes) — o comité produz as decisões e o registo delas. Sem esta cadência, a governação degrada para um inventário estático que ninguém usa.',
    commonMistakes: [
      { mistake: 'Confundir governança com um documento de política', correction: 'Política sem controlo executável, sem dono e sem evidência é intenção, não governação.' },
      { mistake: 'A mesma pessoa especifica, aprova e audita sem registo das chapéus', correction: 'Em organizações pequenas é frequente — mas declare-as e registe em que capacidade cada decisão foi tomada.' },
      { mistake: 'Exceções permanentes', correction: 'Exceção sem validade é ausência de política com desculpa. Revogue ou formalize.' }
    ],
    exercise: {
      goal: 'Elaborar um plano de governação para um agente (o do módulo 7/8).',
      steps: [
        'Defina funções: especificador, avaliador, aprovador, operador, auditor.',
        'Liste políticas aplicáveis ao agente.',
        'Defina a cadência de revisão e os gatilhos de reavaliação (mudança de ferramentas, dados, autonomia).',
        'Defina exceções admitidas e respetiva validade máxima.',
        'Identifique que evidências o agente deve produzir por operação.'
      ],
      doneCriterion: 'Plano com funções, políticas, cadência, exceções e evidências definidos.',
      targetNavView: 'govern-controls',
      targetLabel: 'Controls Matrix'
    },
    knowledgeCheck: [
      {
        id: 'q10-1',
        question: 'O que separa "governação" de "ter um documento de políticas"?',
        options: [
          'O tamanho do documento',
          'Controlos aplicáveis, donos, cadência e evidências de operação — política sem execução e prova é intenção',
          'A aprovação do conselho',
          'O formato (PDF vs Word)'
        ],
        correctIndex: 1,
        explanation: 'Governação opera: regras aplicadas por controlos, com responsáveis e registos que provam a operação.'
      },
      {
        id: 'q10-2',
        question: 'Numa organização pequena onde uma pessoa faz várias funções, a segregação de funções deve:',
        options: [
          'Ser ignorada — é só para grandes empresas',
          'Ser declarada com as chapéus assumidas e registos das decisões por capacidade',
          'Ser substituída por outsourcing',
          'Aplicar-se apenas a aprovações'
        ],
        correctIndex: 1,
        explanation: 'A restrição de recursos não elimina o conflito de interesses — torná-lo explícito e registado mitiga-o.'
      },
      {
        id: 'q10-3',
        question: 'Uma exceção de política corretamente desenhada tem:',
        options: [
          'Validade, dono, justificação e mecanismo de revogação',
          'Duração ilimitada enquanto o negócio precisar',
          'Apenas a aprovação do gestor direto',
          'Efeito retroativo'
        ],
        correctIndex: 0,
        explanation: 'Exceção temporária, atribuível, justificada e revogável — sem isto, é uma falha de política encapotada.'
      }
    ],
    skillsChecklist: [
      'Descrevo os componentes de um programa de governação',
      'Declaro funções e segregação no meu contexto',
      'Mapeio agentes a fases do ciclo de vida',
      'Relaciono decisões a evidências no produto'
    ],
    summary:
      'Governação = políticas + responsabilidades + controlos + evidências + melhoria. Ciclo de vida completo com evidências por fase. Exceções temporárias e registadas.',
    completionCriterion: 'Quiz com pelo menos 75% e plano de governação do exercício completo.'
  },
  {
    id: 'ac-11-cgag-controls',
    moduleNumber: 11,
    levelNumber: 4,
    title: 'CG-AGF e os 12 controlos de governação',
    subtitle: 'Do requisito ao controlo executável: inventário, autorização, HITL, segurança de prompt e a cadeia de rastreabilidade',
    difficulty: 'Avançado',
    estimatedMinutes: 30,
    iconName: 'ListChecks',
    relatedNavView: 'govern-compliance',
    relatedNavLabel: 'Compliance Frameworks',
    prerequisites: ['Módulo 10 — Fundamentos de AI Governance'],
    learningObjectives: [
      'Descrever os 12 controlos CG-AG implementados no produto',
      'Explicar a cadeia Regulação → Requisito → Controlo → Política executável → Perfil',
      'Mapear riscos de um agente aos controlos aplicáveis',
      'Distinguir controlo implementado, planeado e conceptual'
    ],
    conceptExplanation:
      'O CG-AGF (ComplyPRO Agent Governance Framework) organiza os controlos operacionais de governação de agentes em doze domínios, numerados CG-AG-01 a CG-AG-12: 01 Inventário e registo; 02 Âmbito e autorização de ferramentas; 03 Human-in-the-Loop; 04 Circuit breaker, timeout e anti-loop; 05 Segurança de prompt e proteção contra injeção; 06 Proteção de dados pessoais e desidentificação; 07 Trilho de auditoria e rastreio de decisões; 08 Gestão de segredos e credenciais; 09 Monitorização de drift, alucinação e viés; 10 FinOps, orçamento de tokens e rate limiting; 11 Resiliência, fallback e degradação elegante; 12 Governança de IA de terceiros e cadeia de fornecimento.\n\nA cadeia de rastreabilidade é o coração do framework: REGULAÇÃO (ex.: EU AI Act) → REQUISITO (ex.: REQ-EU-AIA-ART-14, supervisão humana eficaz) → CONTROLO CG-AG (ex.: CG-AG-03 HITL) → POLÍTICA EXECUTÁVEL (regra configurável no Policy Engine) → PERFIL DE CONFORMIDADE (agrupamento aplicável a ativos). Esta cadeia permite responder, em qualquer direção: "que requisitos este controlo serve?" e "que controlos protegem este requisito?".\n\nDisciplina de maturidade: o produto DISTINGUE o estado de imposição de cada política/guardrail — CONFIGURED (configurado), OBSERVED (observado, sem bloqueio), ENFORCED (executado, bloqueia desvios), GAP_DETECTED (lacuna detetada). Esta distinção é o antídoto contra a afirmação "temos controlos" quando na verdade têm-se configurações observadas. Nunca afirme que um controlo está ENFORCED sem verificar o estado no produto.\n\nExercício-chave deste módulo: pegar nos riscos do módulo 5/7 e mapeá-los aos controlos CG-AG — por exemplo: risco de ferramenta abusiva → CG-AG-02 (+ 03 se execução); risco de prompt injection → CG-AG-05 (+ 02); risco de fuga de dados → CG-AG-06 (+ 08).',
    terminology: [
      { term: 'CG-AGF', definition: 'ComplyPRO Agent Governance Framework — os 12 controlos operacionais de governação de agentes.' },
      { term: 'Controlo executável', definition: 'Política que pode ser avaliada/aplicada em runtime, não apenas documentada.' },
      { term: 'Cadeia de rastreabilidade', definition: 'Vínculo explícito regulação → requisito → controlo → política → perfil.' },
      { term: 'Enforcement status', definition: 'Estado de imposição: CONFIGURED, OBSERVED, ENFORCED ou GAP_DETECTED.' },
      { term: 'Perfil de conformidade', definition: 'Conjunto de requisitos e controlos aplicáveis a uma classe de ativos (ex.: agentes de alto risco).' }
    ],
    stepByStep: [
      { step: 'Abra a Controls Matrix', detail: 'Percorra os 12 controlos CG-AG e leia a descrição de cada um.' },
      { step: 'Abra Compliance Frameworks', detail: 'Observe a cadeia requisito→controlo para EU AI Act, RGPD, DORA, NIST, ISO.' },
      { step: 'Escolha um requisito e siga a cadeia', detail: 'Ex.: requisito de supervisão humana → controlo CG-AG-03 → política HITL associada → perfil aplicável.' },
      { step: 'Inverta a cadeia', detail: 'A partir de um controlo (ex.: CG-AG-06 proteção de dados), identifique que requisitos ele serve.' },
      { step: 'Verifique estados de imposição', detail: 'No Policy Engine, confirme para cada política relacionada: CONFIGURED, OBSERVED, ENFORCED ou GAP_DETECTED.' },
      { step: 'Mapeie os riscos do seu agente', detail: 'Use a tabela risco→controlo do exercício para o agente dos módulos 7-9.' }
    ],
    businessExample:
      'Mapeamento para o agente de triagem de candidaturas (alto risco regulatório): Risco classificação injusta → CG-AG-09 (monitorização de viés) + CG-AG-03 (HITL na triagem final); Risco fuga de dados de candidatos → CG-AG-06 (proteção PII) + CG-AG-02 (âmbito de ferramentas); Risco prompt injection via CVs → CG-AG-05 (+ CG-AG-04 como contenção); Risco sem rastreio de decisões → CG-AG-07 (audit trail). Este mapeamento é o anexo técnico de uma avaliação de conformidade do EU AI Act para sistemas de alto risco — cada linha é verificável no produto.',
    commonMistakes: [
      { mistake: 'Afirmar "temos os 12 controlos" sem verificar enforcement', correction: 'CONFIGURED ou OBSERVED não é ENFORCED. GAP_DETECTED é uma ação, não um estado confortável.' },
      { mistake: 'Mapear um risco a um único controlo quando o risco é multifatorial', correction: 'Combinações (ex.: 05+02 para injeção) são frequentemente necessárias — um controlo raramente cobre um risco inteiro.' },
      { mistake: 'Tratar o framework como certificação', correction: 'CG-AGF é um framework operacional do produto — não é selo de certificação de terceiros.' }
    ],
    exercise: {
      goal: 'Mapear os riscos do seu agente aos controlos CG-AG aplicáveis e verificar estados de imposição.',
      steps: [
        'Retome os dois riscos do módulo 5 para o seu agente.',
        'Para cada risco, selecione 1-3 controlos CG-AG justificando a escolha.',
        'Abra Compliance Frameworks e identifique um requisito formal servido por cada controlo.',
        'No Policy Engine, verifique o enforcement de pelo menos duas políticas relacionadas.',
        'Registe qualquer GAP_DETECTED como ação pendente.'
      ],
      doneCriterion: 'Mapa risco→controlo→requisito completo com estados de enforcement verificados.',
      targetNavView: 'govern-compliance',
      targetLabel: 'Compliance Frameworks'
    },
    knowledgeCheck: [
      {
        id: 'q11-1',
        question: 'Quantos controlos compõem o CG-AGF e qual é o identificador do controlo de Human-in-the-Loop?',
        options: [
          '8 controlos; HITL é CG-AG-01',
          '12 controlos; HITL é CG-AG-03',
          '10 controlos; HITL é CG-AG-05',
          '12 controlos; HITL é CG-AG-07'
        ],
        correctIndex: 1,
        explanation: 'O framework tem 12 controlos (CG-AG-01 a 12); Human-in-the-Loop é CG-AG-03.'
      },
      {
        id: 'q11-2',
        question: 'Uma política com enforcementStatus = OBSERVED significa:',
        options: [
          'A política não existe',
          'A política está configurada e os desvios são observados/registados, mas não são bloqueados',
          'A política está bloqueada permanentemente',
          'A política foi aprovada por auditor externo'
        ],
        correctIndex: 1,
        explanation: 'OBSERVED = visibilidade sem bloqueio. ENFORCED implicaria recusa de desvios — a diferença é material numa auditoria.'
      },
      {
        id: 'q11-3',
        question: 'A cadeia de rastreabilidade corre na ordem:',
        options: [
          'Política → Regulação → Perfil → Controlo',
          'Regulação → Requisito → Controlo CG-AG → Política executável → Perfil',
          'Controlo → Requisito → Regulação',
          'Perfil → Política → Requisito'
        ],
        correctIndex: 1,
        explanation: 'Esta ordem permite demonstrar como uma obrigação legal abstrata se materializa em controlo operacional e regra executável.'
      }
    ],
    skillsChecklist: [
      'Descrevo os 12 controlos CG-AG e as suas funções',
      'Sigo a cadeia regulação→requisito→controlo→política→perfil nos dois sentidos',
      'Distingo CONFIGURED/OBSERVED/ENFORCED/GAP_DETECTED',
      'Mapeio riscos do meu agente a controlos com justificação'
    ],
    summary:
      'CG-AGF: 12 controlos operacionais; cadeia de rastreabilidade requisito→controlo→política; distinção de enforcement evita sobreafirmações. Mapeamento risco→controlo é a ponte entre avaliação e conformidade.',
    completionCriterion: 'Quiz com pelo menos 75% e mapa risco→controlo→requisito do exercício completo.'
  },
  {
    id: 'ac-12-hitl',
    moduleNumber: 12,
    levelNumber: 4,
    title: 'Aprovações e Human-in-the-Loop',
    subtitle: 'Gates de decisão humana: revalidação, expiração, rejeição e registo com integridade',
    difficulty: 'Avançado',
    estimatedMinutes: 25,
    iconName: 'UserCheck',
    relatedNavView: 'operate-approvals',
    relatedNavLabel: 'HITL Approvals',
    prerequisites: ['Módulo 11 — CG-AGF e controlos de governação'],
    learningObjectives: [
      'Explicar quando a intervenção humana é exigida',
      'Distinguir pedido, aprovação e execução',
      'Aplicar regras de revalidação quando o contexto muda',
      'Tratar expirações, rejeições e escalamentos com registo'
    ],
    conceptExplanation:
      'Human-in-the-Loop no ComplyPRO é materializado nos gates de aprovação (HITL Approvals). Um gate nasce de uma condição: autonomia elevada, ferramenta de alto privilégio, decisão com efeito sobre pessoas, ou política que exige revisão. O ciclo distingue três momentos: PEDIDO (o sistema regista que uma ação aguarda decisão humana — estado PENDING_REVIEW); APROVAÇÃO ou REJEIÇÃO (uma pessoa com autoridade decide, com identidade e momento registados); EXECUÇÃO (a ação avança apenas após aprovação válida — fail-closed).\n\nRevalidação: uma aprovação é válida para o CONTEXTO em que foi tomada. Se o agente muda (novas ferramentas, nova versão), se os dados mudam (nova fonte com dados pessoais), ou se as evidências mudam (novo achado relevante), a aprovação anterior deve ser revalidada — o produto expõe digests de integridade sobre o payload de decisão (formato SHA256:…) e um sentinela explícito UNAVAILABLE quando nenhum digest válido existe. Nunca confie a uma aprovação expirada ou a um digest fabricado: `isComputedHitlDigest` distingue digests reais de sentinelas.\n\nExpiração e rejeição: gates podem expirar (decisão antiga, contexto superado) — expirar não é aprovar; é voltar a PENDING_REVIEW ou bloquear. Rejeição registra o motivo e, quando aplicável, dispara escalamento (novo nível de autoridade) ou remediação (alterar o agente e reavaliar). Todo o percurso — pedido, decisão, digest, rejeição, expiração — alimenta o trilho de auditoria.\n\nAnti-padrão crítico: aprovações em série ("aprovar tudo para desbloquear"). Um gate que é sempre aprovado em <1 minuto não é supervisão — é rubber-stamping. As métricas de tempo de aprovação (módulo 19) servem exatamente para detetar este padrão.',
    terminology: [
      { term: 'Gate HITL', definition: 'Ponto de aprovação humana obrigatória antes de uma ação de risco.' },
      { term: 'PENDING_REVIEW', definition: 'Estado de um gate que aguarda decisão humana.' },
      { term: 'Revalidação', definition: 'Revisão obrigatória de uma aprovação quando agente, contexto ou evidências mudam materialmente.' },
      { term: 'Digest de decisão', definition: 'Hash SHA-256 determinístico sobre o payload canónico da decisão HITL; sentinela UNAVAILABLE quando não calculável.' },
      { term: 'Escalamento', definition: 'Encaminhamento de uma decisão rejeitada ou vencida para autoridade superior ou para remediação.' }
    ],
    stepByStep: [
      { step: 'Abra HITL Approvals', detail: 'Localize gates em PENDING_REVIEW e observe os detalhes: ação solicitada, agente, contexto, risco.' },
      { step: 'Analise um pedido antes de decidir', detail: 'Verifique: o que exatamente será executado? Que dados? Que evidências de teste/aprovação anterior existem? O contexto mudou desde a última decisão?' },
      { step: 'Decida com fundamento', detail: 'Aprovar: a ação é proporcional, testada e dentro do âmbito. Rejeitar: indicar motivo; o produto regista a rejeição.' },
      { step: 'Verifique o registo de integridade', detail: 'Após decisão, confirme o digest SHA-256 associado — digests reais seguem o padrão SHA256:hex64; sentinela UNAVAILABLE indica ausência de digest válido.' },
      { step: 'Simule um cenário de revalidação', detail: 'Considere: se o agente ganhasse uma nova ferramenta, a aprovação anterior continuaria válida? (Não — revalidação obrigatória.)' },
      { step: 'Observe um gate expirado/rejeitado', detail: 'Como o produto apresenta gates rejeitados e o caminho de escalamento/remediação.' }
    ],
    businessExample:
      'Agente de faturação (módulo 7) propõe 14 ajustes de fatura. O gate HITL exige aprovação do dono financeiro para valores > 5 000€. O aprovador analisa: 12 ajustes dentro do padrão histórico, 2 com justificação insuficiente. Decide: aprovação parcial — 12 aprovados, 2 rejeitados com motivo "sem evidência de contrato". O produto regista: identidade do aprovador, momento, escopo da aprovação, digests. Duas semanas depois, o agente recebe ferramenta de emissão automática de notas de crédito — as aprovações anteriores devem ser revalidadas antes de qualquer nova execução. Esta é a disciplina que separa supervisão real de rubber-stamping.',
    commonMistakes: [
      { mistake: 'Aprovar sem ler o escopo exato da ação', correction: 'O pedido HITL detalha o que será executado — aprovar sem ler é transferir responsabilidade sem exercício de juízo.' },
      { mistake: 'Tratar digest UNAVAILABLE como válido', correction: 'UNAVAILABLE é sentinela explícita de ausência de prova de integridade — investigue, não confie.' },
      { mistake: 'Não revalidar após mudança do agente', correction: 'Aprovação é contextual; mudança material de ferramentas/dados anula o contexto e exige nova decisão.' }
    ],
    exercise: {
      goal: 'Simular o ciclo completo de um pedido de aprovação e avaliar quando revalidar.',
      steps: [
        'Abra HITL Approvals e selecione um gate PENDING_REVIEW de demonstração.',
        'Documente: ação, agente, dados, risco e evidências disponíveis.',
        'Simule a decisão (aprovar/rejeitar) e justifique com o contexto.',
        'Verifique o registo de digest da decisão.',
        'Descreva o que mudaria para exigir revalidação (duas alterações possíveis do agente ou contexto).'
      ],
      doneCriterion: 'Ciclo analisado, decisão justificada, digest verificado e dois gatilhos de revalidação definidos.',
      targetNavView: 'operate-approvals',
      targetLabel: 'HITL Approvals'
    },
    knowledgeCheck: [
      {
        id: 'q12-1',
        question: 'Uma aprovação HITL continua válida indefinidamente após ser concedida?',
        options: [
          'Sim — aprovação é permanente',
          'Não — é válida no contexto em que foi tomada; mudanças materiais de agente, dados ou evidências exigem revalidação',
          'Sim, mas apenas para o mesmo modelo',
          'Depende do preço do agente'
        ],
        correctIndex: 1,
        explanation: 'Aprovação contextual é o princípio central do HITL eficaz — revalidação protege contra deriva de contexto.'
      },
      {
        id: 'q12-2',
        question: 'Um gate apresenta evidenceDigest = "UNAVAILABLE". O que fazer?',
        options: [
          'Tratar como digest válido e aprovar',
          'Reconhecer que não existe prova de integridade calculável — investigar e não confiar no registo como se tivesse hash',
          'Bloquear permanentemente o produto',
          'Substituir por um hash aleatório'
        ],
        correctIndex: 1,
        explanation: 'UNAVAILABLE é sentinela honesta (nunca hash fabricado). A resposta correta é investigar a ausência, não fingir integridade.'
      },
      {
        id: 'q12-3',
        question: 'Um gestor aprova 40 gates em 8 minutos. Isto indica:',
        options: [
          'Excelente eficiência operacional',
          'Provável rubber-stamping — supervisão sem análise; deve ser investigado como falha de controlo',
          'Um bug do produto',
          'Aprovação legítima em lote'
        ],
        correctIndex: 1,
        explanation: 'Tempo de aprovação implausivelmente baixo é um indicador de supervisão nominal — métrica-chave do módulo 19.'
      }
    ],
    skillsChecklist: [
      'Distingo pedido, aprovação e execução',
      'Analiso gates com escopo, dados e evidências antes de decidir',
      'Reconheço digests reais versus sentinela UNAVAILABLE',
      'Defino gatilhos de revalidação para o meu agente'
    ],
    summary:
      'HITL: pedido (PENDING_REVIEW) → decisão fundamentada → execução fail-closed. Revalidação obrigatória em mudança de contexto; digests SHA-256 reais versus UNAVAILABLE; expiração/rejeição com escalamento. Rubber-stamping é falha de controlo.',
    completionCriterion: 'Quiz com pelo menos 75% e simulação do ciclo HITL concluída.'
  },
  {
    id: 'ac-13-politicas',
    moduleNumber: 13,
    levelNumber: 4,
    title: 'Políticas, perfis e regras de conformidade',
    subtitle: 'Do requisito à política executável: versões, guardrails, exceções e estados honestos',
    difficulty: 'Avançado',
    estimatedMinutes: 26,
    iconName: 'Scale',
    relatedNavView: 'govern-policies',
    relatedNavLabel: 'Policy Engine',
    prerequisites: ['Módulo 12 — Aprovações e Human-in-the-Loop'],
    learningObjectives: [
      'Relacionar requisito, controlo e política no Policy Engine',
      'Gerir versões, estados e exceções de políticas',
      'Interpretar guardrails e estados de imposição',
      'Evitar declarações de conformidade sem suporte'
    ],
    conceptExplanation:
      'O Policy Engine é onde a governação se torna operacional. Uma POLÍTICA no produto tem: identidade e descrição; VERSÕES (histórico de alterações — decisões devem referenciar a versão vigente à data); ESTADO (DRAFT → ACTIVE → SUSPENDED → RETIRED); GUARDRAILS (regras executáveis com enforcementStatus: CONFIGURED, OBSERVED, ENFORCED, GAP_DETECTED); EXCEÇÕES (desvios temporários com estado ACTIVE, EXPIRED ou REVOKED).\n\nA disciplina das versões é frequentemente negligenciada: uma aprovação tomada sob a Política P-07 v1 não é automaticamente válida sob a v2 se a v2 endureceu os requisitos. Registar a versão em cada decisão é o que permite reconstruir o que era exigido quando.\n\nGuardrails e honestidade de estado: um guardrail CONFIGURED apenas existe na configuração; OBSERVED mede e reporta; ENFORCED bloqueia desvios. A diferença entre "temos uma política anti-fuga de dados" (ACTIVE) e "a política está ENFORCED" (bloqueia efetivamente) é a diferença entre intenção e controlo. GAP_DETECTED significa que o sistema detetou uma lacuna entre o pretendido e o observado — é uma ação obrigatória, não um estado de descanso.\n\nExceções: cada exceção deve apontar à política, ao ativo, ao dono, à justificação e à validade. EXPIRED sem revogação ativa é um buraco: o desvio deixa de ser exceção autorizada e passa a ser violação não gerida. Revogar ou renovar formalmente são as únicas saídas honestas.\n\nConformidade sem sobreafirmação: o resultado de uma avaliação de política (PASS/FAIL por guardrail) é evidência de aderência ÀQUELA política naquela versão — não é certificação de conformidade regulatória. Comunica sempre o âmbito: "controlo X PASSA sob política Y v2, requisito Z" — nunca "estamos conformes com o EU AI Act".',
    terminology: [
      { term: 'Policy Engine', definition: 'Componente que gere políticas, versões, guardrails executáveis e exceções.' },
      { term: 'Guardrail', definition: 'Regra executável de uma política, com estado de imposição (enforcement).' },
      { term: 'Versão de política', definition: 'Snapshots imutáveis das regras; decisões devem referenciar a versão aplicada.' },
      { term: 'Exceção ativa', definition: 'Desvio temporário autorizado (ACTIVE) com validade e dono.' },
      { term: 'GAP_DETECTED', definition: 'Estado que sinaliza lacuna entre política pretendida e comportamento observado — exige ação.' }
    ],
    stepByStep: [
      { step: 'Abra o Policy Engine', detail: 'Liste políticas e identifique estados (DRAFT/ACTIVE/SUSPENDED/RETIRED).' },
      { step: 'Abra uma política ACTIVE', detail: 'Observe versões, guardrails e respetivos enforcementStatus.' },
      { step: 'Identifique um guardrail ENFORCED e um OBSERVED', detail: 'Compare: o que muda na prática? (bloqueio versus observação).' },
      { step: 'Localize exceções e valide estados', detail: 'Há exceções ACTIVE dentro do prazo? Alguma EXPIRED pendente de revogação?' },
      { step: 'Siga a ligação a requisito e controlo', detail: 'Devolva a política ao mapeamento requisito→controlo→política (módulo 11).' },
      { step: 'Pratique a comunicação honesta', detail: 'Escreva um parágrafo de estado: "Política X vN, guardrails A (ENFORCED) e B (OBSERVED), N exceções ativas" — sem extrapolar para conformidade regulatória.' }
    ],
    businessExample:
      'Política "Dados de candidatos" (P-CAND): v1 exigia apenas mascarar nomes; v2 (após análise RGPD) exige desidentificação de toda a informação identificativa e proíbe exportação para sistemas sem DPA. Um agente aprovado sob v1 tem aprovações que devem ser revalidadas sob v2. Guardrail G1 (bloqueio de exportação sem DPA) passa de OBSERVED a ENFORCED — a mudança deve ser comunicada às equipas com data de vigência. Duas exceções ACTIVE permitem, temporariamente, uma fonte legada; uma delas está a 5 dias do fim — renovar formalmente ou preparar conformidade. Este é o ciclo de vida real de uma política operacional.',
    commonMistakes: [
      { mistake: 'Ignorar versões em decisões e aprovações', correction: 'Referência a versão é o que permite reconstruir o exigido à data — sem ela, a decisão não é reproduzível.' },
      { mistake: 'Comunicar guardrail OBSERVED como proteção ativa', correction: 'OBSERVED mede; não protege. Comunicar como proteção é sobreafirmação de controlo.' },
      { mistake: 'Deixar exceções expiradas sem tratamento', correction: 'EXPIRED sem ação = desvio não autorizado operacionalmente. Revogue ou renove formalmente.' }
    ],
    exercise: {
      goal: 'Associar requisitos a controlos e definir evidências esperadas numa política real do produto.',
      steps: [
        'Selecione uma política ACTIVE no Policy Engine.',
        'Identifique o requisito e controlo CG-AG associados (cadeia do módulo 11).',
        'Liste os guardrails e o enforcement atual de cada um.',
        'Defina, para cada guardrail, a evidência esperada que sustentaria um PASS numa auditoria.',
        'Identifique exceções ativas e a data-limite de cada uma.'
      ],
      doneCriterion: 'Política mapeada com guardrails, enforcement, evidências esperadas e exceções com validade.',
      targetNavView: 'govern-policies',
      targetLabel: 'Policy Engine'
    },
    knowledgeCheck: [
      {
        id: 'q13-1',
        question: 'Porque devem decisões e aprovações referenciar a versão da política?',
        options: [
          'Para fins estatísticos',
          'Para permitir reconstruir o que era exigido à data da decisão — políticas mudam e a avaliação é contextual',
          'Porque o produto falha sem essa referência',
          'Para contar versões no relatório anual'
        ],
        correctIndex: 1,
        explanation: 'Reprodutibilidade temporal: sem versão, não se pode determinar qual era o requisito vigente quando se decidiu.'
      },
      {
        id: 'q13-2',
        question: 'Uma política ACTIVE com guardrails todos CONFIGURED oferece que nível de proteção?',
        options: [
          'Proteção total',
          'Nenhum enforcement operacional — os guardrails existem em configuração, sem observação nem bloqueio',
          'Proteção parcial automática',
          'Proteção legal presuntiva'
        ],
        correctIndex: 1,
        explanation: 'CONFIGURED é o estado mais fraco: existe no papel/configuração; o enforcement efetivo exige pelo menos OBSERVED, idealmente ENFORCED.'
      },
      {
        id: 'q13-3',
        question: 'Uma exceção com estado EXPIRED deve ser:',
        options: [
          'Mantida até alguém se lembrar',
          'Formalmente revogada ou renovada — EXPIRED sem ação é desvio não gerido',
          'Convertida automaticamente em política',
          'Apagada do sistema'
        ],
        correctIndex: 1,
        explanation: 'O ciclo de exceção só termina com revogação formal ou renovação justificada — expirar por omissão cria risco não gerido.'
      }
    ],
    skillsChecklist: [
      'Relaciono políticas a requisitos e controlos no produto',
      'Interpreto versões, estados e enforcement com precisão',
      'Gerir exceções com validade e dono',
      'Comunico estado de controlos sem sobreafirmação de conformidade'
    ],
    summary:
      'Policy Engine: políticas com versões, estados, guardrails (CONFIGURED→ENFORCED) e exceções temporárias. Decisões referenciam versões; comunicação honesta de enforcement; GAP_DETECTED e EXPIRED exigem ação.',
    completionCriterion: 'Quiz com pelo menos 75% e mapeamento da política do exercício completo.'
  }
];
