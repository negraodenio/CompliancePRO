import type { AcademyModule } from './types';

export const LEVEL2_MODULES: AcademyModule[] = [
  {
    id: 'ac-04-processos-sipoc',
    moduleNumber: 4,
    levelNumber: 2,
    title: 'Processos empresariais e SIPOC',
    subtitle: 'Mapear o processo antes de introduzir agentes: Suppliers, Inputs, Process, Outputs, Customers',
    difficulty: 'Básico',
    estimatedMinutes: 25,
    iconName: 'Workflow',
    relatedNavView: 'discover-agents',
    relatedNavLabel: 'Agents & Teams (SIPOC de agentes)',
    prerequisites: ['Módulo 3 — Conceitos essenciais de IA e agentes'],
    learningObjectives: [
      'Explicar o método SIPOC e o problema que resolve',
      'Construir um SIPOC completo para um processo empresarial',
      'Relacionar processo empresarial, sistema de IA, agente e controlo',
      'Ler a cadeia SIPOC que o ComplyPRO apresenta para agentes descobertos'
    ],
    conceptExplanation:
      'SIPOC é uma técnica estruturada de mapeamento de processos com cinco elementos: SUPPLIERS (fornecedores — quem fornece as entradas), INPUTS (entradas — dados, materiais, pedidas que entram no processo), PROCESS (processo — as atividades de transformação), OUTPUTS (saídas — o que o processo produz) e CUSTOMERS (clientes — quem recebe e usa as saídas). O acrónimo pode ser lido nos dois sentidos; o objetivo é o mesmo: delimitar um processo e torná-lo discutível por pessoas técnicas e de negócio no mesmo vocabulário.\n\nPorque é que isto importa para governança de IA? Porque agentes de IA são introduzidos DENTRO de processos. Antes de decidir que um agente automatiza uma etapa, é preciso saber: de onde vêm os dados (Inputs e Suppliers — incluindo se incluem dados pessoais), o que o agente exatamente faz (Process), o que produz (Outputs — incluindo decisões com efeito sobre pessoas) e quem é afetado (Customers — incluindo reguladores e auditores como clientes de evidências). Um agente inserido num processo sem este mapeamento é uma aposta sem contorno: não se consegue avaliar o impacto de uma falha nem definir o que é uma saída aceitável.\n\nRelação com o produto: o ComplyPRO NÃO dispõe de um editor nativo de SIPOC de processos empresariais — esta é uma ferramenta didática e de análise que o profissional aplica (com template, quadro branco ou documento). O que o produto FAZ é apresentar uma cadeia SIPOC estruturada para cada agente descoberto no inventário (Agents & Teams → botão SIPOC): Suppliers/Input/Process/Output/Customer derivados dos dados do agente e do seu repositório de origem, com um nível de confiança de derivação. Isto é a tradução técnica→de negócio do agente já existente. O exercício deste módulo ensina o método completo e ensina a ler a cadeia SIPOC do produto — sem fingir que existe um editor que não existe.\n\nLimitação a registar: a cadeia SIPOC derivada pelo produto reflete o que foi possível inferir do código e metadados disponíveis. É um ponto de partida para validação humana com o dono do processo, não um substituto por essa validação.',
    terminology: [
      { term: 'SIPOC', definition: 'Suppliers, Inputs, Process, Outputs, Customers — estrutura de delimitação de um processo empresarial.' },
      { term: 'Dono do processo (process owner)', definition: 'Pessoa responsável pela definição e desempenho do processo; interlocutor-chave na validação do mapeamento.' },
      { term: 'Fronteira do processo', definition: 'Onde o processo começa e termina — delimita o que é interno ao mapeamento e o que é ambiente (entradas/saídas externas).' },
      { term: 'Cadeia SIPOC do agente', definition: 'Vista no produto que apresenta o SIPOC derivado de um agente descoberto, com níveis de confiança de derivação.' },
      { term: 'Dados pessoais', definition: 'Informação relativa a pessoa identificada ou identificável (RGPD). A sua presença em Inputs/Outputs altera materialmente o perfil de risco e os requisitos.' }
    ],
    stepByStep: [
      { step: 'Escolha um processo real da sua organização', detail: 'Exemplo: tratamento de pedidos de apoio ao cliente, emissão de crédito, triagem de candidaturas.' },
      { step: 'Delimite o processo (início e fim)', detail: 'Ex.: de "pedido recebido" a "resposta enviada ao cliente". Tudo o que está antes é ambiente.' },
      { step: 'Preencha Outputs e Customers primeiro', detail: 'Começar pelo que sai e por quem recebe ajuda a evitar processos sem destino claro.' },
      { step: 'Preencha Inputs e Suppliers', detail: 'Identifique os dados que entram e de onde vêm. Marque explicitamente onde existem dados pessoais ou confidenciais.' },
      { step: 'Descreva o Processo em 4-7 atividades', detail: 'Actividades acionáveis; evite passos tão granulares que o mapeamento se torne ilegível.' },
      { step: 'Introduza o ponto de automação por IA', detail: 'Para cada candidatura a automação, assinale: que atividade, que dados, que saída e que decisão humana restante.' },
      { step: 'Valide com o dono do processo', detail: 'SIPOC sem validação do dono é hipótese. Registe as correções.' }
    ],
    businessExample:
      'Caso prático — apoio a pedidos de clientes numa operadora de telecomunicações:\n• Suppliers: CRM (histórico do cliente), sistema de faturação, base de conhecimento de políticas.\n• Inputs: texto do pedido (email/chat), identificador do cliente, histórico de consumo.\n• Process: (1) classificar a natureza do pedido; (2) consultar contas e histórico; (3) propor resolução; (4) executar quando autorizada; (5) registar e confirmar.\n• Outputs: resposta ao cliente, alteração de tarifa/quando autorizada, registo no CRM.\n• Customers: o cliente final, a equipa de apoio, auditoria interna (recebe os registos).\nCandidatura a agente: as atividades 1-3 (classificação e proposta). A atividade 4 (execução) exige supervisão humana enquanto decisão com efeito económico. Este desenho — automação onde o risco é controlado, supervisão onde o dano é material — é o padrão que os módulos seguintes formalizam.',
    commonMistakes: [
      { mistake: 'Mapear o processo como está documentado em vez de como opera', correction: 'Validações informais e atalhos reais alteramInputs e Suppliers. A entrevista ao dono revela o processo real.' },
      { mistake: 'Criar um SIPOC tão detalhado que deixa de ser discutível', correction: '4-7 atividades; granularidade de decisão, não de implementação.' },
      { mistake: 'Assumir que a cadeia SIPOC derivada pelo produto é definitiva', correction: 'É derivação com confiança — valide sempre com o dono do processo antes de decisões de governação.' }
    ],
    exercise: {
      goal: 'Construir um SIPOC completo de um processo real e identificar riscos e controlos propostos.',
      steps: [
        'Escolha um processo com potencial de automação por IA na sua organização.',
        'Preencha os cinco campos SIPOC (use o template: Suppliers | Inputs | Process | Outputs | Customers).',
        'Assinale Inputs/Outputs que contêm dados pessoais ou decisões com efeito sobre pessoas.',
        'Proponha dois controlos (ex.: aprovação humana antes de execução; registo de evidência de cada decisão).',
        'Abra o Agents & Teams no produto e compare o seu SIPOC com a cadeia SIPOC derivada de um agente de demonstração.'
      ],
      doneCriterion: 'SIPOC completo, riscos assinalados, dois controlos propostos e comparação com a cadeia do produto concluída.',
      targetNavView: 'discover-agents',
      targetLabel: 'Agents & Teams'
    },
    knowledgeCheck: [
      {
        id: 'q4-1',
        question: 'O que representa o "C" em SIPOC?',
        options: [
          'Controls (controles)',
          'Customers — quem recebe e usa as saídas do processo',
          'Compliance',
          'Code'
        ],
        correctIndex: 1,
        explanation: 'Customers são os destinatários das saídas. Identificar quem é afetado é essencial para avaliar impacto — incluindo clientes, reguladores e auditores como consumidores de evidências.'
      },
      {
        id: 'q4-2',
        question: 'Porque deve um SIPOC ser validado com o dono do processo?',
        options: [
          'Porque o SIPOC é um requisito legal de auditoria',
          'Porque o mapeamento reflete hipóteses sobre o processo real; o dono confirma ou corrige a realidade operacional',
          'Porque o produto exige essa validação técnica',
          'Para obter aprovação do orçamento'
        ],
        correctIndex: 1,
        explanation: 'SIPOC desenhado por terceiros é uma hipótese. A validação com o dono converte-a em referência utilizável para decisões de governação.'
      },
      {
        id: 'q4-3',
        question: 'O ComplyPRO oferece um editor nativo de SIPOC de processos empresariais?',
        options: [
          'Sim, com exportação para BPMN',
          'Não. Apresenta a cadeia SIPOC derivada de agentes descobertos; o mapeamento de processos empresariais é aplicado com ferramentas externas pelo profissional',
          'Sim, mas apenas em ambiente de demonstração',
          'Não porque o conceito SIPOC foi descontinuado'
        ],
        correctIndex: 1,
        explanation: 'O produto mostra SIPOC derivado de agentes (Agents & Teams). O mapeamento SIPOC de processos é uma competência do profissional — este módulo ensina-a sem inventar funcionalidades.'
      },
      {
        id: 'q4-4',
        question: 'Num SIPOC, um Input que contém dados pessoais deve ser:',
        options: [
          'Oculto por simplificação',
          'Explicitamente assinalado — altera os requisitos de proteção de dados e o perfil de risco da automação proposta',
          'Convertido em Output para rastreabilidade',
          'Removido para reduzir o âmbito'
        ],
        correctIndex: 1,
        explanation: 'Dados pessoais em Inputs/Outputs exigem tratamento específico (RGPD) e elevam o rigor dos controlos — invisibilidade não reduz risco, aumenta-o.'
      }
    ],
    skillsChecklist: [
      'Consigo construir um SIPOC completo e delimitar um processo',
      'Assinalo Inputs/Outputs com dados pessoais ou decisões de efeito',
      'Sei relacionar automação proposta a atividades específicas do SIPOC',
      'Sei ler a cadeia SIPOC derivada pelo produto e a sua confiança'
    ],
    summary:
      'SIPOC delimita processos no vocabulário comum de negócio e técnica. É o pré-requisito para introduzir agentes: sem processo mapeado, não há perfil de risco defensável. O produto apresenta cadeias SIPOC derivadas de agentes; o mapeamento empresarial é competência do profissional, validada com o dono do processo.',
    completionCriterion: 'Quiz com pelo menos 75% e SIPOC do exercício concluído.'
  },
  {
    id: 'ac-05-riscos',
    moduleNumber: 5,
    levelNumber: 2,
    title: 'Identificação e classificação de riscos',
    subtitle: 'Do inventário ao risco: criticidade, probabilidade, impacto e priorização',
    difficulty: 'Intermédio',
    estimatedMinutes: 22,
    iconName: 'AlertTriangle',
    relatedNavView: 'govern-risk',
    relatedNavLabel: 'Risk Engine',
    prerequisites: ['Módulo 4 — Processos empresariais e SIPOC'],
    learningObjectives: [
      'Estruturar a identificação de riscos a partir do inventário e do SIPOC',
      'Aplicar probabilidade × impacto × exposição na priorização',
      'Distinguir risco, vulnerabilidade e incidente',
      'Registar pressupostos, limitações e evidências necessárias de cada avaliação'
    ],
    conceptExplanation:
      'Risco de IA não é uma lista genérica de "viés" e "privacidade". É o resultado concreto de um sistema específico (agente, modelo, ferramentas, dados) operando num processo específico (SIPOC) com um falhanço possível. A estrutura recomendada: (1) ATIVO — o que está em causa (agente X, processo Y); (2) AMEAÇA — o que pode correr mal (prompt injection via dados de entrada, fuga de dados no Output, decisão errada sobre um cliente); (3) VULNERABILIDADE — por que é possível (ferramenta de execução sem limite, ausência de supervisão, dados sensíveis no contexto); (4) IMPACTO — consequência sobre pessoas, processos e organização.\n\nTrês dimensões orientam a priorização: PROBABILIDADE (quão provável é a materialização), IMPACTO (severidade quando se materializa) e EXPOSIÇÃO (quão amplo é o alcance — quantos clientes, que volume de decisões, que sensibilidade dos dados). No produto, o Risk Engine agrega achados do scanner (violações, dados sensíveis, ferramentas perigosas, sombra de IA sem inventário) numa visão de riscos priorizada — mas a qualidade da priorização depende da qualidade da identificação que este módulo ensina.\n\nDisciplina epistémica obrigatória: cada avaliação deve registar PRESSUPOSTOS (o que assumimos sobre o processo ou dados), LIMITAÇÕES (o que não foi possível verificar) e EVIDÊNCIAS NECESSÁRIAS (que prova falta para confirmar ou refutar). Uma avaliação sem estas três marcações é uma opinião — e opiniões não sustentam decisões de governação nem auditorias.',
    terminology: [
      { term: 'Ativo de IA', definition: 'Sistema de IA inventariado (agente, modelo, integração) com dono e âmbito definidos.' },
      { term: 'Ameaça', definition: 'Causa potencial de um evento adverso (ex.: atacante que injecta instruções nos dados de entrada).' },
      { term: 'Vulnerabilidade', definition: 'Fraqueza explorável (ex.: ferramenta de escrita sem limites de valor; ausência de supervisão humana).' },
      { term: 'Impacto', definition: 'Efeito sobre pessoas, processos, reputação ou obrigações legais quando o risco se materializa.' },
      { term: 'Exposição', definition: 'Amplitude do alcance potencial: número de decisões afetadas, sensibilidade dos dados, criticidade do processo.' },
      { term: 'Sombra de IA (shadow AI)', definition: 'Uso de sistemas de IA não inventariados nem aprovados — um risco de cobertura que o produto ajuda a reduzir via scanner.' }
    ],
    stepByStep: [
      { step: 'Parta do inventário e do SIPOC', detail: 'Ativos inventariados + processo mapeado = superfície de risco concreta.' },
      { step: 'Liste falhanços plausíveis por atividade', detail: 'Para cada atividade com automação proposta: o que pode correr mal, com que frequência e com que efeito.' },
      { step: 'Classifique dados e decisões', detail: 'Dados pessoais? Decisões com efeito sobre pessoas? Valores económicos? Este passo define o piso mínimo de controlos.' },
      { step: 'Atribua probabilidade, impacto e exposição', detail: 'Use escala consistente (ex.: Baixo/Médio/Alto). Documente a justificação de cada classificação.' },
      { step: 'Registe pressupostos, limitações e evidências necessárias', detail: 'Sem isto, a avaliação é opinião. Com isto, é um trabalho auditável.' },
      { step: 'Priorize e associe controlos candidatos', detail: 'Riscos altos primeiro; cada risco deve apontar a controlos (políticas, HITL, limites técnicos).' },
      { step: 'Contraste com o Risk Engine do produto', detail: 'Abra o Risk Engine e compare a sua identificação manual com os achados agregados do sistema.' }
    ],
    businessExample:
      'Numa operação de RH: agente de triagem de candidaturas (Process do SIPOC: classificar e priorizar CVs). Risco identificado: CLASSIFICAÇÃO INJUSTA — o modelo prioriza perfis com padrões históricos enviesados, excluindo candidatos qualificados (Ameaça: viés do modelo + dados de treino; Vulnerabilidade: ausência de supervisão humana na triagem final; Impacto: dano a candidatos + exposição legal sob regulamentação de IA de alto risco do EU AI Act; Exposição: todas as candidaturas). Evidências necessárias: amostra de decisões com resultado humano de referência, política de tratamento de dados de candidatura, definição do limiar de intervenção humana. Este é o tipo de estrutura que sustenta depois uma decisão registada no Decisions Pipeline.',
    commonMistakes: [
      { mistake: 'Avaliar riscos em abstrato, desconectados do processo', correction: 'Risco sem ativo+processo+falhanço concreto não prioriza nem informa controlos.' },
      { mistake: 'Usar impacto sem exposição', correction: 'Um erro grave que afeta 3 casos tem prioridade diferente do mesmo erro que afeta 30 000.' },
      { mistake: 'Publicar avaliações sem pressupostos e limitações', correction: 'Sem estas marcações, qualquer auditor (ou colega) não consegue calibrar a confiança da avaliação.' }
    ],
    exercise: {
      goal: 'Avaliar um cenário de utilização de IA com estrutura completa de risco.',
      steps: [
        'Retome o SIPOC do módulo 4.',
        'Identifique os dois riscos mais material do cenário de automação proposto.',
        'Para cada risco: ameaça, vulnerabilidade, impacto, probabilidade, exposição.',
        'Registe pressupostos, limitações e evidências necessárias.',
        'Abra o Risk Engine no produto e identifique um achado do sistema relacionado com o seu cenário.'
      ],
      doneCriterion: 'Dois riscos documentados com as cinco dimensões + pressupostos/limitações/evidências + ligação ao Risk Engine.',
      targetNavView: 'govern-risk',
      targetLabel: 'Risk Engine'
    },
    knowledgeCheck: [
      {
        id: 'q5-1',
        question: 'Qual é a estrutura mínima de um risco bem formulado?',
        options: [
          'Uma categoria (privacidade, viés) e uma nota de gravidade',
          'Ativo, ameaça, vulnerabilidade e impacto — ancorados num processo concreto',
          'Apenas a probabilidade estimada',
          'O nome do fornecedor do modelo'
        ],
        correctIndex: 1,
        explanation: 'Sem ativo e processo, o risco é genérico; sem ameaça/vulnerabilidade/impacto, não orienta controlos.'
      },
      {
        id: 'q5-2',
        question: 'Porque é a EXPOSIÇÃO uma dimensão separada do impacto?',
        options: [
          'Para complicar a matriz de risco',
          'Porque o mesmo impacto severo com alcance restrito tem prioridade diferente do que afeta toda a base de clientes',
          'Porque impacto só se aplica a dados pessoais',
          'Exposição é sinónimo de probabilidade'
        ],
        correctIndex: 1,
        explanation: 'Impacto = severidade; exposição = amplitude. Priorização correta pondera ambas.'
      },
      {
        id: 'q5-3',
        question: 'O que transforma uma avaliação de risco num documento auditável?',
        options: [
          'A assinatura do gestor',
          'O registo de pressupostos, limitações e evidências necessárias',
          'Uma escala de cores consistente',
          'A exportação em PDF'
        ],
        correctIndex: 1,
        explanation: 'Pressupostos, limitações e evidências necessárias permitem a terceiros calibrar e rever a avaliação — é isso que a torna auditável.'
      }
    ],
    skillsChecklist: [
      'Estruturo riscos com ativo, ameaça, vulnerabilidade e impacto',
      'Aplico probabilidade, impacto e exposição na priorização',
      'Registo pressupostos, limitações e evidências necessárias',
      'Ligo riscos identificados a controlos candidatos'
    ],
    summary:
      'Identificação de riscos ancorada em inventário + SIPOC; priorização por probabilidade × impacto × exposição; disciplina epistémica (pressupostos, limitações, evidências). O Risk Engine do produto agrega achados — a qualidade da decisão continua a depender da qualidade da identificação.',
    completionCriterion: 'Quiz com pelo menos 75% e avaliação do exercício documentada.'
  },
  {
    id: 'ac-06-scanner',
    moduleNumber: 6,
    levelNumber: 2,
    title: 'Utilização do scanner ComplyPRO',
    subtitle: 'Análise de código, interpretação de estados (PASS/WARN/FAIL, BLOCKED/FAILED) e investigação de resultados',
    difficulty: 'Intermédio',
    estimatedMinutes: 28,
    iconName: 'Terminal',
    relatedNavView: 'tools-scanner',
    relatedNavLabel: 'Scanner (Discover)',
    prerequisites: ['Módulo 5 — Identificação e classificação de riscos'],
    learningObjectives: [
      'Iniciar uma análise pelo fluxo real do produto',
      'Interpretar dimensões PASS/WARN/FAIL e a diferença entre BLOCKED e FAILED',
      'Investigar um resultado negativo até à causa',
      'Tratar falhas técnicas sem as confundir com decisões de conformidade'
    ],
    conceptExplanation:
      'O scanner do ComplyPRO é o sensor de descoberta: analisa código (ou repositórios configurados) e produz um resultado de análise (ScannerResult) com dimensões avaliadas. Cada dimensão responde a uma pergunta de governação (existe inventário de agentes? há dono explícito? há autonomia elevada? há dados sensíveis? há ferramentas perigosas? há configurações inseguras?) e devolve um estado: PASS (requisito observado), WARN (indícios que exigem revisão) ou FAIL (requisito não observado). Um veredito agregado (ALLOW) é produzido quando nenhum bloqueio se aplica.\n\nA distinção que evita erros caros: BLOCK versus FAILED. BLOCKED (recusa) ocorre quando uma POLÍTICA ou LIMITE DE AUTORIDADE impede uma ação — é uma decisão do sistema, fail-closed, com registo. FAILED ocorre quando uma OPERAÇÃO FALHOU TECNICAMENTE (um gateway de execução não respondeu, uma credencial inválida, um serviço em indisponibilidade). Tratar um FAILED como um resultado de conformidade é falso: a avaliação não se realizou. Tratar um BLOCK como falha técnica ignora uma decisão de política que exige investigação e possível revalidação.\n\nEvidências e falsos positivos: cada resultado carrega o contexto da observação (o que foi visto, em que ficheiro, com que configuração). WARN e FAIL devem ser investigados até causa; nem todos os falsos positivos são iguais — alguns refletem configuração do scanner, outros refletem risco real mal compreendido. A disciplina: investigar, documentar a causa, e só então decidir (corrigir, excecionar com justificação, ou registar decisão formal). O produto distingue explicitamente dados demonstrativos — um scan em modo de demonstração produz resultados de fixtures, não da sua base de código.',
    terminology: [
      { term: 'ScannerResult', definition: 'Resultado estruturado de uma análise: dimensões avaliadas, estados, achados e veredito agregado.' },
      { term: 'Dimensão de avaliação', definition: 'Pergunta de governação avaliada pelo scanner (ex.: presença de dono, ferramentas perigosas, dados sensíveis).' },
      { term: 'Veredito ALLOW', definition: 'Resultado agregado em que nenhum bloqueio de política se aplica — não significa ausência de riscos, significa ausência de bloqueio.' },
      { term: 'Modo de demonstração', definition: 'Execução do scanner com dados/fixtures de amostra; resultados identificados como demonstrativos.' },
      { term: 'Falso positivo', definition: 'Marcação de um achado que, na investigação, não representa risco real no contexto — exige investigação antes de qualquer exceção.' }
    ],
    stepByStep: [
      { step: 'Abra a área de descoberta (Scanner)', detail: 'O scanner é o ponto de entrada da esteira de descoberta.' },
      { step: 'Inicie uma análise no modo disponível', detail: 'Em ambiente de demonstração, os dados são fixtures identificadas. Com repositório configurado, a análise incide sobre o código próprio.' },
      { step: 'Aguarde o resultado e localize as dimensões', detail: 'Cada dimensão mostra estado e justificação — leia a justificação, não apenas a cor.' },
      { step: 'Identifique o veredito agregado', detail: 'ALLOW indica ausência de bloqueio. Reponha atenção a WARN/FAIL mesmo com ALLOW.' },
      { step: 'Investigue um FAIL ou WARN', detail: 'Abra o achado, localize a origem (ficheiro/configuração), determine causa real versus falsa positiva.' },
      { step: 'Distinga falha técnica de decisão', detail: 'Se a operação falhou (serviço indisponível, erro de execução), registe como incidente técnico — não como resultado de conformidade.' },
      { step: 'Documente e comunique', detail: 'Registe: o que foi avaliado, o que foi encontrado, causa investigada e ação proposta.' }
    ],
    businessExample:
      'Uma equipa executa o scanner e obtém FAIL numa dimensão de ferramentas perigosas: um agente de demonstração declara ferramenta de execução de alto privilégio. Investigação: o agente é real no inventário? Sim (fixture de demonstração identificada). A ferramenta é usada em produção? Não confirmado — evidência necessária: registo de execuções reais. Decisão provisória: manter o achado em observação, exigir ao dono confirmação do âmbito real de ferramentas. O erro comum seria fechar o achado como "falso positivo porque é demo" sem registar a evidência necessária — o produto distingue demo; a decisão de fechar deve ser igualmente documentada.',
    commonMistakes: [
      { mistake: 'Ler apenas as cores, não as justificações', correction: 'WARN e FAIL carregam a observação que permite investigar; a cor é o convite, a justificação é o material de trabalho.' },
      { mistake: 'Tratar FAILED (falha técnica) como FAIL de conformidade', correction: 'FAILED = a avaliação não se completou. Ação: resolver a falha e reavaliar — não decidir com base no vazio.' },
      { mistake: 'Fechar falsos positivos sem registar causa e evidência', correction: 'A exceção sem causa documentada é indistinguível de omissão numa auditoria.' }
    ],
    exercise: {
      goal: 'Executar uma análise e investigar um resultado negativo até à causa.',
      steps: [
        'Abra o scanner e execute/reponha uma análise em modo de demonstração.',
        'Identifique um WARN ou FAIL e registe a justificação apresentada.',
        'Formule a causa provável e a evidência necessária para a confirmar.',
        'Classifique: risco real, falsa positivo provável, ou indeterminado (exige mais dados).',
        'Compare com o achado correspondente no Risk Engine.'
      ],
      doneCriterion: 'Um resultado investigado com causa, classificação e evidência necessária registadas.',
      targetNavView: 'tools-scanner',
      targetLabel: 'Scanner'
    },
    knowledgeCheck: [
      {
        id: 'q6-1',
        question: 'O scanner devolveu FAILED numa execução de agente. Qual é a interpretação correta?',
        options: [
          'O agente está em incumprimento legal',
          'A operação falhou tecnicamente; a avaliação não se completou — resolva a falha e reavalie',
          'O agente foi bloqueado por política',
          'O utilizador foi aprovado automaticamente'
        ],
        correctIndex: 1,
        explanation: 'FAILED é falha técnica. Nenhum veredito de conformidade foi produzido — decidir sobre o vazio é um erro de processo.'
      },
      {
        id: 'q6-2',
        question: 'Qual a diferença entre BLOCKED e ALLOW no veredito do produto?',
        options: [
          'BLOCKED é erro; ALLOW é sucesso',
          'BLOCKED: uma política/autoridade recusou a ação (decisão fail-closed). ALLOW: nenhum bloqueio se aplicou — não é garantia de ausência de risco',
          'São intermutáveis',
          'ALLOW significa conformidade certificada'
        ],
        correctIndex: 1,
        explanation: 'BLOCKED é decisão de política; ALLOW é ausência de bloqueio. Nenhum dos dois é, por si, uma declaração de conformidade.'
      },
      {
        id: 'q6-3',
        question: 'Um scan em modo de demonstração produz:',
        options: [
          'Resultados da produção com atraso',
          'Resultados sobre fixtures (amostras), identificados como demonstrativos',
          'Resultados vazios',
          'Resultados aleatórios'
        ],
        correctIndex: 1,
        explanation: 'Modo de demonstração usa fixtures identificadas — nunca devem ser comunicados como avaliação do código da organização.'
      }
    ],
    skillsChecklist: [
      'Inicio análises pelo fluxo real do produto',
      'Distingo PASS/WARN/FAIL de BLOCKED/FAILED',
      'Investigo resultados negativos até causa e evidência necessária',
      'Comunico resultados sem sobreavaliar o que o scanner prova'
    ],
    summary:
      'O scanner é o sensor de descoberta: dimensões PASS/WARN/FAIL, veredito ALLOW, distinção BLOCKED (decisão) versus FAILED (falha técnica), investigação até causa e disciplina de evidências. Demonstração = fixtures identificadas.',
    completionCriterion: 'Quiz com pelo menos 75% e investigação do exercício concluída.'
  }
];
