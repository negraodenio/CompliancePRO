import type { AcademyModule } from './types';

export const LEVEL5_MODULES: AcademyModule[] = [
  {
    id: 'ac-14-evidencias',
    moduleNumber: 14,
    levelNumber: 5,
    title: 'Evidências e integridade',
    subtitle: 'Proveniência, hashes e a diferença entre hash, assinatura e prova — factos versus alegações',
    difficulty: 'Avançado',
    estimatedMinutes: 26,
    iconName: 'Fingerprint',
    relatedNavView: 'assure-evidence',
    relatedNavLabel: 'Protected Evidence',
    prerequisites: ['Módulo 13 — Políticas, perfis e regras de conformidade'],
    learningObjectives: [
      'Definir o que constitui uma evidência útil',
      'Distinguir hash, assinatura digital e prova criptográfica',
      'Reconhecer dados demonstrativos, fixtures e sentinelas de indisponibilidade',
      'Analisar um registo e separar factos demonstrados de alegações'
    ],
    conceptExplanation:
      'Uma evidência útil responde a: O QUE foi observado ou decidido, QUANDO, POR QUÊ (qual regra ou pedido), COM QUE RESULTADO e COM QUE INTEGRIDADE. Um screenshot sem contexto não é evidência; um registo com proveniência, momento, regra aplicada e digest verificável é.\n\nTrês conceitos frequentemente confundidos: HASH (resumo determinístico do conteúdo — permite detetar alteração; o mesmo conteúdo gera sempre o mesmo hash; mudar um byte muda o hash); ASSINATURA DIGITAL (hash + chave privada — prova autoria: "a entidade X assinou este conteúdo"); PROVA CRIPTOGRÁFICA mais ampla (cadeias de hashes, timestamps com âncoras, comprovações que um auditor pode reconstruir). O ComplyPRO calcula hashes SHA-256 determinísticos sobre payloads canónicos (evidências, decisões HITL, blocos do audit ledger) e distingue honestamente os estados: digest CALCULADO (formato SHA256:hex64) versus sentinela UNAVAILABLE (quando o cálculo falhou ou não se aplica — NUNCA um hash fabricado). Esta honestidade é um diferencial: a maioria dos sistemas prefere inventar um hash a mostrar uma lacuna; o ComplyPRO mostra a lacuna.\n\nClassificação de origem dos dados — essencial para honestidade analítica: EVIDÊNCIA REAL (derivada de operações verificáveis no ambiente configurado); FIXTURE (amostra de demonstração, identificada); SIMULAÇÃO (cenário produzido para exercício); INDISPONÍVEL (dado não acessível — com sentinela explícita). Confundir fixture com evidência real é a forma mais rápida de destruir credibilidade perante um auditor.\n\nLimitações dos mecanismos de integridade: um hash prova que o conteúdo NÃO mudou desde o cálculo; não prova que o conteúdo é verdadeiro, completo ou representativo. Hash sobre dados falsos é um hash fiel de falsidade. Integridade ≠ veracidade — a validação do conteúdo é sempre humana e contextual.',
    terminology: [
      { term: 'SHA-256', definition: 'Função de resumo criptográfico que produz um digest de 256 bits; determinística e sensível a qualquer alteração.' },
      { term: 'Digest canónico', definition: 'Hash calculado sobre representação canónica (ordenada, normalizada) dos dados, garantindo reprodutibilidade.' },
      { term: 'Sentinela UNAVAILABLE', definition: 'Valor explícito que indica ausência de digest válido — nunca substituído por hash fabricado.' },
      { term: 'Proveniência', definition: 'Origem do registo: quem/que sistema produziu, em que contexto e a partir de que dados.' },
      { term: 'Audit ledger', definition: 'Cadeia imutável de blocos com hashes encadeados, permitindo detetar adulteração de qualquer bloco histórico.' }
    ],
    stepByStep: [
      { step: 'Abra Protected Evidence', detail: 'Observe os registos de evidência e os campos de integridade.' },
      { step: 'Identifique um digest calculado', detail: 'Formato esperado: SHA256: seguido de 64 caracteres hexadecimais.' },
      { step: 'Localize uma sentinela UNAVAILABLE', detail: 'Compreenda por que existe e o que comunica: ausência honesta de prova.' },
      { step: 'Classifique a origem dos dados exibidos', detail: 'Real, fixture de demonstração, simulação ou indisponível — o produto identifica estas origens.' },
      { step: 'Abra o Audit Ledger', detail: 'Observe a cadeia de blocos com hashes encadeados e o bloco génesis.' },
      { step: 'Analise um registo completo', detail: 'Preencha: o que, quando, porquê, resultado, integridade, origem. O que é FACTO? O que é ALEGAÇÃO? O que está INDISPONÍVEL?' }
    ],
    businessExample:
      'Auditor pede "prova de que o agente X foi aprovado antes de operar". Pacote de evidência correto: (1) registo de decisão no Decisions Pipeline com momento e decidente; (2) gate HITL com digest SHA256 real sobre o payload de aprovação; (3) versão da política aplicável à data; (4) resultados de testes associados (módulo 9). Pacote incorreto: print de ecrã sem timestamp, sem âmbito e sem integridade — alegação sem suporte. Se o digest do gate mostrasse UNAVAILABLE, o pacote deve declarar explicitamente "integridade da decisão não verificável por digest — lacuna registada" em vez de omitir.',
    commonMistakes: [
      { mistake: 'Tratar hash como prova de verdade', correction: 'Hash prova não-alteração; a veracidade e completude do conteúdo exigem validação humana.' },
      { mistake: 'Ocultar sentinelas UNAVAILABLE em relatórios', correction: 'A omissão de uma lacuna de integridade é pior do que a própria lacuna para um auditor.' },
      { mistake: 'Comunicar fixtures como evidências reais', correction: 'Origem deve acompanhar sempre o dado — demonstração identificada como demonstração.' }
    ],
    exercise: {
      goal: 'Analisar um registo de evidência e separar factos demonstrados de alegações.',
      steps: [
        'Abra Protected Evidence e selecione um registo.',
        'Identifique: o que foi observado/decidido, quando, regra aplicada, resultado.',
        'Verifique a integridade: digest calculado ou sentinela?',
        'Classifique a origem dos dados (real/fixture/simulação/indisponível).',
        'Escreva: 3 factos demonstrados, 1 alegação que exige validação e 1 lacuna (se existir).'
      ],
      doneCriterion: 'Análise completa com factos, alegações e lacunas separados.',
      targetNavView: 'assure-evidence',
      targetLabel: 'Protected Evidence'
    },
    knowledgeCheck: [
      {
        id: 'q14-1',
        question: 'Qual a diferença fundamental entre hash e assinatura digital?',
        options: [
          'Nenhuma — são sinónimos',
          'Hash resume conteúdo e deteta alteração; assinatura associa hash a uma identidade (chave privada), provando autoria',
          'Assinatura é mais rápida que hash',
          'Hash só funciona em PDF'
        ],
        correctIndex: 1,
        explanation: 'Integridade (hash) e autoria (assinatura) são propriedades distintas — uma auditoria forte pode exigir ambas.'
      },
      {
        id: 'q14-2',
        question: 'Um digest de decisão mostra "UNAVAILABLE". A interpretação correta é:',
        options: [
          'O sistema falhou gravemente e deve ser ignorado',
          'Não existe digest válido calculável para este registo — é uma lacuna honesta a registar, nunca um hash a inventar',
          'O registo é seguro por ter valor especial',
          'Significa que o digest é opcional e pode ser ignorado nos relatórios'
        ],
        correctIndex: 1,
        explanation: 'UNAVAILABLE é a política de honestidade do produto: mostrar a lacuna em vez de fabricar prova.'
      },
      {
        id: 'q14-3',
        question: 'Um conteúdo com hash verificável é necessariamente verdadeiro?',
        options: [
          'Sim — hash garante verdade',
          'Não — hash garante apenas que o conteúdo não mudou desde o cálculo; veracidade e completude exigem validação humana',
          'Sim, se o algoritmo for SHA-256',
          'Sim, se estiver no audit ledger'
        ],
        correctIndex: 1,
        explanation: 'Integridade ≠ veracidade. Esta distinção é o coração da maturidade analítica em evidências.'
      }
    ],
    skillsChecklist: [
      'Defino evidência útil com os cinco elementos',
      'Distingo hash, assinatura e prova ampliada',
      'Reconheço sentinelas UNAVAILABLE e classifico origens de dados',
      'Separo factos, alegações e lacunas num registo'
    ],
    summary:
      'Evidência = proveniência + momento + regra + resultado + integridade. Hash ≠ assinatura ≠ prova; UNAVAILABLE é honestidade; integridade não implica veracidade; origem (real/fixture) acompanha sempre o dado.',
    completionCriterion: 'Quiz com pelo menos 75% e análise do registo do exercício completa.'
  },
  {
    id: 'ac-15-dossiers',
    moduleNumber: 15,
    levelNumber: 5,
    title: 'Dossiers e preparação para auditoria',
    subtitle: 'Reunir resultados, controlos e evidências num pacote defensável — e exportá-lo honestamente',
    difficulty: 'Avançado',
    estimatedMinutes: 24,
    iconName: 'FolderCheck',
    relatedNavView: 'assure-reports',
    relatedNavLabel: 'Regulatory Dossiers',
    prerequisites: ['Módulo 14 — Evidências e integridade'],
    learningObjectives: [
      'Explicar a finalidade de um dossier de governação',
      'Reunir resultados, controlos e evidências num pacote coerente',
      'Identificar campos em falta e declarações que exigem suporte',
      'Preparar um dossier para revisão por auditor'
    ],
    conceptExplanation:
      'Um dossier de governação é o pacote que responde, num conjunto coerente, à pergunta "mostre-me" de um auditor, regulador ou comité: o que existe (inventario), o que foi avaliado (riscos, políticas), o que foi decidido (decisões, aprovações), o que prova (evidências com integridade) e o que falta (lacunas declaradas). O Regulatory Dossiers view do ComplyPRO agrega estas peças para um âmbito selecionado e suporta exportação.\n\nA disciplina central do dossier é a HONESTIDADE DAS DECLARAÇÕES: cada afirmação deve apontar a evidência; cada evidência deve ter origem e integridade classificadas; cada lacuna deve ser declarada em vez de omitida. O produto reforça esta disciplina: os pacotes de exportação exibem o hash SHA-256 do conteúdo empacotado (recomputável e verificável) e identificam os padrões de embalagem aplicados, sem alegações de "selagem criptográfica" que não se sustentam na mecânica implementada. Nunca afirme num dossier o que o produto não prova — ex.: "assinado por autoridade externa" quando existe apenas hash interno.\n\nPreparação para revisão: um auditor experiente testa três coisas: (1) coerência (o inventário bate certo com as decisões? aprovações anteriores a registos?); (2) reprodutibilidade (consegue recalcular um hash? consegue seguir a cadeia requisito→controlo→política→decisão?); (3) honestidade (as lacunas estão declaradas ou escondidas?). Prepare o dossier passando nestes três testes ANTES da revisão — uma lacuna declarada com plano de ação destrói menos credibilidade do que uma omissão descoberta.\n\nExportação: quando exportar, o ficheiro resultante é um snapshot — registe a data, o âmbito e a versão das políticas aplicáveis. Dossiers vivem num momento temporal; comunicar sem data é cometer o erro de tratar fotografia como filme.',
    terminology: [
      { term: 'Dossier de governação', definition: 'Pacote estruturado de inventário, avaliação, decisões, aprovações e evidências para um âmbito definido.' },
      { term: 'Âmbito (scope)', definition: 'Delimitação do dossier: que ativos, que período, que processos.' },
      { term: 'Snapshot', definition: 'Estado do dossier no momento da exportação — não acompanha alterações posteriores.' },
      { term: 'Hash de pacote', definition: 'SHA-256 do conteúdo exportado, verificável por quem recebe o ficheiro.' },
      { term: 'Lacuna declarada', definition: 'Ausência de evidência ou cobertura explicitamente registada, com dono e plano — preferível a omissão.' }
    ],
    stepByStep: [
      { step: 'Abra Regulatory Dossiers', detail: 'Selecione o âmbito (agente, avaliação ou periodo) disponível.' },
      { step: 'Verifique a cobertura', detail: 'Inventário presente? Riscos? Decisões? Aprovações? Evidências? Identifique ausências.' },
      { step: 'Siga três afirmações até evidência', detail: 'Para três afirmações do dossier, localize a evidência que as suporta. Se não existir, é alegação — marque.' },
      { step: 'Verifique a integridade dos pacotes', detail: 'Confirme hashes de pacote e a origem dos dados incluídos (real vs fixture).' },
      { step: 'Elabore a secção de lacunas', detail: 'Liste o que falta, porquê, quem é dono e quando será resolvido.' },
      { step: 'Prepare a narrativa do auditor', detail: 'Um parágrafo de contexto, escopo, metodologia, achados, decisões, lacunas e plano — antes de qualquer exportação.' },
      { step: 'Exporte (quando aplicável)', detail: 'Registe data, âmbito e versões; comunique o hash do pacote ao destinatário.' }
    ],
    businessExample:
      'Dossier trimestral de governança para o comité: âmbito = 5 agentes de alto risco. Estrutura: (1) inventário com donos e fases; (2) riscos abertos por agente; (3) decisões e aprovações do trimestre com digests; (4) exceções de políticas com validade; (5) incidentes e estado; (6) lacunas: 2 agentes sem evidência de teste de injeção (plano: sprint seguinte); 1 gate com digest UNAVAILABLE investigado. O comité recebe a fotografia datada + o hash do pacote + o plano de lacunas. Esta é uma apresentação que sobrevive a perguntas incómodas — porque as respostas estão no dossier, não na memória de alguém.',
    commonMistakes: [
      { mistake: 'Exportar sem declarar âmbito e data', correction: 'Snapshot sem data é inutilizável numa linha do tempo de auditoria.' },
      { mistake: 'Omitir lacunas para "apresentar melhor"', correction: 'Omissão descoberta destrói mais credibilidade do que lacuna declarada com plano.' },
      { mistake: 'Alegar selagem ou certificação que o produto não executa', correction: 'Hash de pacote ≠ selo de autoridade externa. Descreva exatamente o mecanismo de integridade existente.' }
    ],
    exercise: {
      goal: 'Preparar um dossier de avaliação de um caso de utilização.',
      steps: [
        'Defina o âmbito (agente ou caso dos módulos anteriores).',
        'Reúna: inventário, riscos, políticas, decisões, aprovações, evidências disponíveis.',
        'Siga três afirmações até à evidência; marque alegações sem suporte.',
        'Elabore a secção de lacunas com donos e planos.',
        'Registe a data de preparação e o que exportaria (ou exporte em demonstração).'
      ],
      doneCriterion: 'Dossier estruturado com três afirmações verificadas, lacunas declaradas e snapshot datado.',
      targetNavView: 'assure-reports',
      targetLabel: 'Regulatory Dossiers'
    },
    knowledgeCheck: [
      {
        id: 'q15-1',
        question: 'A qualidade fundamental de um dossier de auditoria é:',
        options: [
          'Quantidade de páginas',
          'Honestidade das declarações: cada afirmação aponta a evidência; lacunas declaradas',
          'Uso de gráficos coloridos',
          'Sigilo do conteúdo'
        ],
        correctIndex: 1,
        explanation: 'Audidores testam coerência, reprodutibilidade e honestidade — quantidade e estética não substituem nenhuma das três.'
      },
      {
        id: 'q15-2',
        question: 'Um dossier exportado é:',
        options: [
          'Um filme sempre atualizado',
          'Um snapshot datado de um âmbito — não acompanha alterações posteriores',
          'Uma base de dados viva',
          'Uma certificação'
        ],
        correctIndex: 1,
        explanation: 'Snapshot: data, âmbito e versões devem ser comunicados com a exportação.'
      },
      {
        id: 'q15-3',
        question: 'O hash SHA-256 de um pacote exportado prova:',
        options: [
          'Que o conteúdo é legalmente válido',
          'Que o conteúdo não foi alterado desde o cálculo — integridade, não veracidade nem autoridade',
          'Que o auditor aprovou o conteúdo',
          'Que o conteúdo está encriptado'
        ],
        correctIndex: 1,
        explanation: 'Hash de pacote permite ao destinatário verificar não-alteração — mais nada. Não é selo legal nem encriptação.'
      }
    ],
    skillsChecklist: [
      'Estruturo dossiers com âmbito, cobertura e narrativa',
      'Sigo afirmações até evidências e marco alegações',
      'Declaro lacunas com dono e plano',
      'Comunico snapshots datados com hash de pacote'
    ],
    summary:
      'Dossier = pacote coerente e honesto (inventário→avaliação→decisões→evidências→lacunas). Snapshot datado; hash de pacote verificável; jamais sobreafirmar mecanismos de integridade.',
    completionCriterion: 'Quiz com pelo menos 75% e dossier do exercício preparado.'
  },
  {
    id: 'ac-16-multi-tenancy',
    moduleNumber: 16,
    levelNumber: 5,
    title: 'Multi-tenancy e segurança operacional',
    subtitle: 'Separação de dados, menor privilégio e teste de acessos indevidos sem tocar dados de terceiros',
    difficulty: 'Avançado',
    estimatedMinutes: 25,
    iconName: 'Building2',
    relatedNavView: 'manage-team',
    relatedNavLabel: 'Team Management',
    prerequisites: ['Módulo 15 — Dossiers e preparação para auditoria'],
    learningObjectives: [
      'Explicar o conceito de tenant e a separação de dados',
      'Aplicar o princípio do menor privilégio a acessos e credenciais',
      'Identificar riscos de fuga de dados entre tenants',
      'Desenhar testes de acesso indevido em ambiente controlado'
    ],
    conceptExplanation:
      'Multi-tenancy: a plataforma serve múltiplas organizações (tenants) com separação lógica (e, em arquiteturas maduras, física) dos dados. Cada tenant vê exclusivamente os seus ativos, evidências e decisões. A quebra desta separação — fuga de dados entre tenants — é um dos incidentes mais graves em SaaS B2B: expõe dados de um cliente a outro, com consequências regulatórias (RGPD) e contratuais severas.\n\nO princípio do menor privilégio aplica-se em três camadas: UTILIZADOR (cada pessoa tem o acesso mínimo à sua função); SERVIÇO (componentes do sistema usam credenciais escopadas — o produto distingue anon key de service role key, com permissões radicalmente diferentes); TENANT (as consultas são sempre escopadas ao tenant autenticado — políticas de isolamento, como RLS (Row-Level Security) em bases de dados Postgres/Supabase, forçam o filtro no próprio banco, não apenas na aplicação).\n\nTestes de acesso indevido — em ambiente controlado e SEM tocar dados reais de outros clientes: verificar que um utilizador do tenant A não consegue listar, buscar por identificador ou exportar recursos do tenant B; que identificadores manipulados (troca de UUID) não retornam dados alheios; que funções administrativas exigem autorização explícita. O produto mantém testes automatizados destas verificações (suítes de isolamento e RLS) — o princípio que o módulo ensina é que ESTES TESTES DEVEM EXISTIR E CORRER em cada alteração de esquema ou autorização.\n\nCredenciais: nunca em repositório, nunca em logs, nunca em URLs partilháveis. Segredos de produção nunca usados em testes; testes usam credenciais TEST de projetos separados. O produto e os seus pipelines seguem esta disciplina (provisionamento de ambiente TEST em CI a partir de secrets do repositório, com validação criptográfica de que as chaves pertencem ao projeto TEST).',
    terminology: [
      { term: 'Tenant', definition: 'Unidade de isolamento multi-organizacional: dados e recursos pertencem a uma organização específica.' },
      { term: 'RLS (Row-Level Security)', definition: 'Mecanismo de base de dados que força filtros de tenant no próprio banco, independentemente da aplicação.' },
      { term: 'Service role key', definition: 'Credencial de serviço com permissões amplas — o alvo mais valioso para um atacante; uso estritamente necessário.' },
      { term: 'Anon key', definition: 'Credencial de acesso anónimo com permissões limitadas pelas políticas configuradas.' },
      { term: 'Fuga de dados (data leak)', definition: 'Exposição não autorizada de dados de um tenant a outra parte — incidente grave com obrigações de notificação.' }
    ],
    stepByStep: [
      { step: 'Abra Team Management', detail: 'Observe a estrutura de organizações, membros e funções.' },
      { step: 'Identifique o escopo de cada função', detail: 'Que capacidades tem cada função? Alguma excede o necessário para a função?' },
      { step: 'Compreenda o modelo de isolamento', detail: 'Consultas escopadas ao tenant; em arquiteturas com RLS, o banco força o filtro.' },
      { step: 'Revise a disciplina de credenciais', detail: 'Confirme: credenciais em secrets, nunca em código; ambiente TEST separado de produção.' },
      { step: 'Desenhe um teste de acesso indevido', detail: 'Cenário: utilizador do tenant A tenta aceder a recurso conhecido do tenant B por identificador direto. Resultado esperado: negação e registo.' },
      { step: 'Verifique testes automatizados existentes', detail: 'O repositório mantém suítes de isolamento/RLS — localize-as e confirme que correm no runner de governação.' }
    ],
    businessExample:
      'Uma consultora de compliance usa a plataforma com três clientes (três tenants). O analista da Cliente A está a preparar um dossier e "experimenta" colar um UUID de evidência que viu numa demonstração multi-cliente. Com isolamento correto: o recurso do tenant B não existe para o analista — a consulta devolve vazio/negação, e o evento pode ser registado. Sem isolamento: o analista obtém dados de outro cliente — fuga grave. O teste descrito no passo 5 valida exatamente esta fronteira, em ambiente controlado, sem nunca expor dados reais de terceiros.',
    commonMistakes: [
      { mistake: 'Confiar apenas no isolamento da camada de aplicação', correction: 'RLS no banco protege mesmo quando uma falha de aplicação escapa de filtros — defesa em profundidade.' },
      { mistake: 'Usar service role no frontend ou em scripts ad-hoc', correction: 'Service role é para operações de serviço escopadas e auditadas — nunca para cliente ou teste casual.' },
      { mistake: 'Testar isolamento contra produção', correction: 'Testes de acesso usam ambientes TEST com dados sintéticos — nunca dados reais de outros tenants.' }
    ],
    exercise: {
      goal: 'Avaliar um cenário de acesso indevido e desenhar o teste correspondente (sem dados reais).',
      steps: [
        'Descreva o cenário: quem, que recurso alheio, que vetor (identificador direto, exportação, busca).',
        'Defina o resultado esperado com isolamento correto (negação + registo).',
        'Identifique que mecanismos do produto/esquema sustentam a negação (escopo de tenant, RLS, autorização).',
        'Desenhe o teste automatizado correspondente (dados sintéticos de dois tenants fictícios).',
        'Verifique nas suítes existentes do repositório um teste equivalente e o seu resultado no runner.'
      ],
      doneCriterion: 'Cenário, resultado esperado, mecanismos, teste desenhado e suíte existente verificada.',
      targetNavView: 'manage-team',
      targetLabel: 'Team Management'
    },
    knowledgeCheck: [
      {
        id: 'q16-1',
        question: 'Qual é a consequência mais grave de uma fuga de dados entre tenants?',
        options: [
          'Perda de desempenho',
          'Exposição de dados de um cliente a outro, com obrigações regulatórias e contratuais severas',
          'Um bug visual',
          'Custo adicional de tokens'
        ],
        correctIndex: 1,
        explanation: 'É o incidente mais grave em SaaS multi-tenant: violação de confiança, de contratos e potencialmente do RGPD (notificação obrigatória).'
      },
      {
        id: 'q16-2',
        question: 'RLS (Row-Level Security) funciona porque:',
        options: [
          'Filtra resultados na interface do utilizador',
          'Força o filtro de tenant no motor da base de dados, protegendo mesmo quando a aplicação falha',
          'Encripta cada linha',
          'Limita o número de queries por minuto'
        ],
        correctIndex: 1,
        explanation: 'Defesa na camada de dados: mesmo uma falha de aplicação não escapa do filtro forçado pelo banco.'
      },
      {
        id: 'q16-3',
        question: 'Credenciais de produção em testes:',
        options: [
          'São aceitáveis se o teste for rápido',
          'São proibidas — testes usam ambiente TEST com credenciais próprias e projetos separados',
          'São aceitáveis se não forem commitadas',
          'São recomendadas para fidelidade'
        ],
        correctIndex: 1,
        explanation: 'Qualquer uso de credenciais de produção em testes expande a superfície de exposição — a disciplina é separação total.'
      }
    ],
    skillsChecklist: [
      'Explico tenant, isolamento e RLS',
      'Aplico menor privilégio a utilizadores, serviços e tenants',
      'Desenho testes de acesso indevido com dados sintéticos',
      'Reconheço a disciplina de credenciais TEST versus produção'
    ],
    summary:
      'Multi-tenancy exige isolamento verificável (aplicação + RLS), menor privilégio em três camadas, testes de acesso indevido com dados sintéticos e separação absoluta de credenciais TEST/produção.',
    completionCriterion: 'Quiz com pelo menos 75% e cenário de teste de isolamento desenhado.'
  },
  {
    id: 'ac-17-incidentes',
    moduleNumber: 17,
    levelNumber: 5,
    title: 'Monitorização, falhas e incidentes',
    subtitle: 'Fail-closed versus falha técnica, circuit breakers, contenção e recuperação',
    difficulty: 'Avançado',
    estimatedMinutes: 26,
    iconName: 'Siren',
    relatedNavView: 'operate-incidents',
    relatedNavLabel: 'Incidents & Failsafe',
    prerequisites: ['Módulo 16 — Multi-tenancy e segurança operacional'],
    learningObjectives: [
      'Distinguir bloqueio de segurança (fail-closed) de falha técnica',
      'Explicar o comportamento fail-closed e as suas limitações',
      'Gerir um incidente: deteção, contenção, recuperação, lição',
      'Aplicar suspensão e recuperação segura de agentes'
    ],
    conceptExplanation:
      'Dois estados que as equipas confundem sob pressão: BLOQUEIO DE SEGURANÇA (fail-closed) — o sistema RECUSA uma ação porque uma política ou limite de autoridade se aplica (ex.: gateway sem credenciais válidas não executa — veredito BLOCK com status FAILED de operação recusada; política de risco recusa ferramenta). FALHA TÉCNICA — a operação não completou por razão técnica (serviço indisponível, timeout, erro de rede). Fail-closed é DESIGNADO: perante incerteza ou falha de autorização, a resposta segura é recusar, não deixar passar. A LIMITAÇÃO do fail-closed deve ser comunicada: recusas em massa por falha de configuração podem parar operações legítimas — por isso os incidentes de fail-closed em série são incidentes de disponibilidade, não apenas de segurança.\n\nCircuit breakers e anti-loop: mecanismos que interrompem ciclos de falha (repetição infinita de chamadas falhadas, loops de agente a agente, gasto descontrolado de tokens). O CG-AG-04 materializa estes controlos. Timeouts e orçamentos de tokens (CG-AG-10) limitam o dano de uma execução descontrolada.\n\nGestão de incidente — ciclo: DETEÇÃO (alerta, probe, utilizador); TRIAGE (severidade, âmbito, dados afetados); CONTENAÇÃO (suspender agente, revogar credencial, isolar sistema — no produto: containmentStatus progressivo, ex.: CONTAINED, RECOVERY_PENDING); ERADICAÇÃO/RESOLUÇÃO; RECUPERAÇÃO (retomada controlada — não "ligar tudo e rezar"); LIÇÃO (retrospectiva alimenta políticas, testes e inventário). O Incidents view do produto regista incidentes com estado de contenção e evolução.\n\nSuspensão e recuperação segura: suspender um agente é decisão de governação com registo (quem, quando, porquê). A recuperação exige: causa removida, evidências de correção, reavaliação se o contexto mudou, e preferencialmente nova aprovação para agentes de alto risco. "Des-suspender" sem verificações transforma a contenção num intervalo.',
    terminology: [
      { term: 'Fail-closed', definition: 'Comportamento de recusar ação perante falha ou incerteza de autorização/configuração — segurança primeiro, disponibilidade depois.' },
      { term: 'Circuit breaker', definition: 'Mecanismo que interrompe sequências de falha repetida para evitar cascata (ex.: loop de retries, gasto descontrolado).' },
      { term: 'Contenção (containment)', definition: 'Ações imediatas para limitar dano: suspender agente, revogar acesso, isolar componente.' },
      { term: 'Blast radius', definition: 'Amplitude máxima do dano possível de uma falha — deve ser minimizada no desenho (limites, âmbito, isolamento).' },
      { term: 'Retrospectiva (post-mortem)', definition: 'Análise sem culpa do incidente que produz ações corretivas mensuráveis.' }
    ],
    stepByStep: [
      { step: 'Abra Incidents & Failsafe', detail: 'Observe incidentes registados e respetivos estados de contenção.' },
      { step: 'Classifique um evento: bloqueio ou falha?', detail: 'Pergunte: o sistema recusou por política/autoridade (fail-closed) ou a operação falhou tecnicamente?' },
      { step: 'Pratique a comunicação de um fail-closed', detail: 'Redija: "Ação X bloqueada por política Y (fail-closed). Impacto: operações tipo Z suspensas. Próximo passo: verificar credenciais/configuração." — factual, sem alarmismo nem eufemismo.' },
      { step: 'Execute mentalmente a contenção', detail: 'Para um incidente simulado: que passos imediatos? (suspender agente, revogar chave, isolar integração.)' },
      { step: 'Defina critérios de recuperação', detail: 'Para a suspensão do agente: causa removida? Evidências? Reavaliação? Nova aprovação?' },
      { step: 'Elabore a lição', detail: 'Que controlo, política ou teste teria evitado ou reduzido o incidente? Associe a ação a dono.' }
    ],
    businessExample:
      'Alerta: 200 bloqueios em 10 minutos num gateway de execução. Triagem: causa = expiração de credencial de serviço (falha de rotação); classificação = fail-closed funcionando como desenhado (recusa perante autorização inválida) + incidente de disponibilidade. Contenção: rotação de credencial, verificação de gates afetados. Recuperação: monitorização de taxa de bloqueio por 24h; lição: automação de rotação com alerta a 15 dias do fim — ação donada à plataforma, prazo 30 dias. Sem esta retrospectiva, o mesmo incidente repete-se no próximo ciclo de credencial.',
    commonMistakes: [
      { mistake: 'Comunicar fail-closed como "bug do sistema"', correction: 'É o sistema a funcionar como desenhado — comunicar como tal evita pressão para desativar segurança.' },
      { mistake: 'Recuperar sem causa removida e evidências', correction: 'Retomada sobre causa viva converte contenção em intervalo e gera segundo incidente.' },
      { mistake: 'Incidentes sem dono de lição e prazo', correction: 'Retrospectiva sem ação atribuída é terapia de grupo — as lições tornam-se controlos ou repetem-se.' }
    ],
    exercise: {
      goal: 'Responder a uma falha de gateway (cenário) com o ciclo completo de incidente.',
      steps: [
        'Cenário: execuções de agente retornando erro 500 em massa (gateway em falha).',
        'Classifique: falha técnica (não é decisão de conformidade).',
        'Defina contenção imediata (suspender agente afetado? isolar gateway? comunicação a stakeholders?).',
        'Defina critérios de recuperação verificáveis.',
        'Formule a lição e a ação corretiva com dono e prazo.'
      ],
      doneCriterion: 'Classificação, contenção, critérios de recuperação e lição documentados.',
      targetNavView: 'operate-incidents',
      targetLabel: 'Incidents & Failsafe'
    },
    knowledgeCheck: [
      {
        id: 'q17-1',
        question: 'Um gateway retorna erro 500 em massa. O estado correto é:',
        options: [
          'FAIL de conformidade do agente',
          'Falha técnica — a avaliação/execução não se completou; tratar como incidente técnico, não como decisão de política',
          'BLOCK por política',
          'Sucesso com degradação'
        ],
        correctIndex: 1,
        explanation: '500 = falha técnica. Confundi-la com decisão de conformidade distorce métricas e decisões — a lição do módulo 6 aplicada a operações.'
      },
      {
        id: 'q17-2',
        question: 'A principal LIMITAÇÃO do fail-closed a comunicar é:',
        options: [
          'É inseguro',
          'Falhas de configuração podem causar recusas em massa de operações legítimas — impacto de disponibilidade a gerir',
          'É lento',
          'Não funciona com microserviços'
        ],
        correctIndex: 1,
        explanation: 'Fail-closed privilegia segurança; o custo é disponibilidade sob falha de configuração — por isso existe CG-AG-11 (resiliência/fallback) e monitorização.'
      },
      {
        id: 'q17-3',
        question: 'Antes de levantar a suspensão de um agente de alto risco, é obrigatório:',
        options: [
          'Apenas pedir desculpa aos utilizadores',
          'Confirmar causa removida, evidências de correção, reavaliação do contexto e nova aprovação quando exigida',
          'Aumentar o orçamento de tokens',
          'Nada — suspensão é temporária por definição'
        ],
        correctIndex: 1,
        explanation: 'Recuperação segura é um processo com evidências — "des-suspender" sem verificações anula a contenção.'
      }
    ],
    skillsChecklist: [
      'Distingo fail-closed de falha técnica em tempo real',
      'Comunico bloqueios e falhas com factualidade',
      'Executo contenção e defino recuperação verificável',
      'Produzo lições com dono e prazo'
    ],
    summary:
      'Fail-closed é desenho, não bug — com custo de disponibilidade a gerir. Incidente: deteção→triagem→contenção→recuperação verificável→lição atribuída. Nunca recuperar sobre causa viva.',
    completionCriterion: 'Quiz com pelo menos 75% e resposta ao cenário de incidente completa.'
  }
];
