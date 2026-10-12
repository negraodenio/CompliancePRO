import type { AcademyModule } from './types';

export const LEVEL6_MODULES: AcademyModule[] = [
  {
    id: 'ac-18-regulamentacao',
    moduleNumber: 18,
    levelNumber: 6,
    title: 'Regulamentação e frameworks',
    subtitle: 'EU AI Act, RGPD, DORA, NIST AI RMF e ISO 42001 — enquadramento rigoroso e limites da interpretação',
    difficulty: 'Avançado',
    estimatedMinutes: 30,
    iconName: 'Globe',
    relatedNavView: 'govern-compliance',
    relatedNavLabel: 'Compliance Frameworks',
    prerequisites: ['Módulo 17 — Monitorização, falhas e incidentes'],
    learningObjectives: [
      'Enquadrar cada regulamentação: âmbito e obrigações centrais para IA',
      'Distinguir obrigação legal, norma, boa prática e política interna',
      'Usar a cadeia de mapeamento do produto sem sobreafirmar conformidade',
      'Reconhecer os limites da interpretação automática e a necessidade de validação jurídica'
    ],
    conceptExplanation:
      'Quatro categorias de normas convivem num programa de governança — confundi-las é um erro clássico: OBRIGAÇÃO LEGAL (incumprimento tem consequências jurídicas — ex.: EU AI Act, RGPD, DORA); NORMA VOLUNTÁRIA (adotada por compromisso ou contrato — ex.: ISO/IEC 42001, ISO 27001); BOA PRÁTICA (referencial de maturidade — ex.: NIST AI RMF); POLÍTICA INTERNA (regras próprias da organização, frequentemente mais estritas que o mínimo legal).\n\nEU AI Act (Regulamento (UE) 2024/1689): classifica sistemas de IA por risco (inalcanceável, mínimo, limitado, alto) com obrigações crescentes — para alto risco: gestão de riscos, dados de qualidade, documentação técnica, logging, transparência, supervisão humana, robustez e precisão, e conformidade avaliada antes da colocação no mercado. Sistemas de IA generativa e de emotion recognition têm obrigações específicas. Aplicação faseada ao longo de 2025-2027. O produto mapeia requisitos (ex.: REQ-EU-AIA-ART-14 supervisão humana → CG-AG-03; ART-09 gestão de riscos → CG-AG-04; ART-12 logging → CG-AG-07).\n\nRGPD (GDPR): aplica-se sempre que dados pessoais são processados — incluindo o contexto de um agente de IA (dados de treino, contexto, outputs). Princípios: licitude, minimização, limitação de finalidade, segurança; direitos do titular; Avaliação de Impacto (DPIA) quando alto risco; proteção por desenho (ART-25 → CG-AG-06). O AI Act não substitui o RGPD — aplicam-se em cumulação.\n\nDORA (Regulamento (UE) 2022/2554): resiliência operacional digital para o setor financeiro — gestão de riscos TIC, incidentes, testes operacionais, dependências de terceiros (IA de fornecedores entra aqui → CG-AG-12). ISO/IEC 42001: sistema de gestão de IA (requisitos de gestão, contexto, liderança, planeamento, suporte, avaliação de desempenho, melhoria). NIST AI RMF: funções GOVERN, MAP, MEASURE, MANAGE — referencial de maturidade, não certificação legal. LGPD (Brasil) alinha-se estruturalmente com o RGPD.\n\nLIMITES CRÍTICOS: o ComplyPRO produz mapeamentos requisito→controlo→política→avaliação. Isto é matéria-prima para conformidade — NÃO é parecer jurídico, NÃO é certificação, NÃO é "declaração de conformidade automática". A interpretação de como um sistema específico se enquadra (é high-risk? que obrigações exatamente? que cláusulas contratuais com fornecedores?) exige validação jurídica especializada. O produto distingue e apoia; nunca substitui.',
    terminology: [
      { term: 'EU AI Act', definition: 'Regulamento (UE) 2024/1689 sobre inteligência artificial, com classificação por risco e obrigações graduadas; aplicação faseada 2025-2027.' },
      { term: 'RGPD/GDPR', definition: 'Regulamento (UE) 2016/679 de proteção de dados pessoais — aplica-se ao processamento de dados por sistemas de IA.' },
      { term: 'DORA', definition: 'Regulamento (UE) 2022/2554 sobre resiliência operacional digital do setor financeiro.' },
      { term: 'ISO/IEC 42001', definition: 'Norma internacional de sistemas de gestão de IA — requisitos de gestão, não certificação legal de produtos.' },
      { term: 'NIST AI RMF', definition: 'Framework de gestão de riscos de IA do NIST — referencial voluntário de maturidade (GOVERN, MAP, MEASURE, MANAGE).' },
      { term: 'DPIA/AIA', definition: 'Avaliação de Impacto (proteção de dados / sistemas de alto risco) — processo documentado exigido em contextos de alto risco.' }
    ],
    stepByStep: [
      { step: 'Abra Compliance Frameworks', detail: 'Observe os frameworks mapeados no produto e os requisitos catalogados.' },
      { step: 'Selecione um requisito do EU AI Act', detail: 'Ex.: ART-14 supervisão humana. Siga a cadeia até controlo CG-AG e política.' },
      { step: 'Repita para RGPD e DORA', detail: 'Identifique como o mesmo controlo CG-AG serve requisitos de frameworks diferentes (ex.: CG-AG-06 serve RGPD ART-25 e LGPD).' },
      { step: 'Classifique a natureza de cada requisito', detail: 'Legal (EU AI Act, RGPD), contractual/sectorial (DORA), norma (ISO), referencial (NIST).' },
      { step: 'Identifique o que está fora do alcance do produto', detail: 'Liste: parecer jurídico, classificação final de risco do sistema, certificação de terceiros.' },
      { step: 'Formule uma afirmação honesta de estado', detail: 'Ex.: "Requisitos mapeados e controlos avaliados; enquadramento legal final pendente de validação jurídica."' }
    ],
    businessExample:
      'Um banco europeu avalia um agente de apoio a decisões de crédito (alto risco sob o AI Act + DORA por ser setor financeiro + RGPD por dados de titulares). Pacote de governança: mapeamento ART-9/10/13/14/15→CG-AG-01/03/05/07; DPIA atualizado; registo de logging (CG-AG-07); supervisão humana eficaz demonstrada com gates HITL e métricas de tempo de aprovação; fornecedor do modelo avaliado sob DORA gestão de terceiros (CG-AG-12). O parecer final de classificação e obrigações formais é do jurídico/compliance — com o produto a fornecer a evidência operacional verificável. Esta divisão de trabalho é o modelo profissional.',
    commonMistakes: [
      { mistake: 'Declarar "conformes com o EU AI Act" por mapeamento completo de controlos', correction: 'Mapeamento + avaliações = evidência operacional; conformidade legal = conclusão jurídica com âmbito do sistema definido.' },
      { mistake: 'Tratar ISO 42001 como certificação legal obrigatória', correction: 'É norma voluntária de gestão — valiosa, mas categoria diferente de obrigação legal.' },
      { mistake: 'Assumir que AI Act substitui RGPD', correction: 'Aplicam-se em cumulação — proteção de dados e regulamentação de riscos de IA são regimes complementares.' }
    ],
    exercise: {
      goal: 'Estruturar o enquadramento regulatório do seu caso de uso (módulos anteriores).',
      steps: [
        'Identifique frameworks aplicáveis (AI Act? RGPD? DORA? ISO desejada?).',
        'Classifique cada requisito central como legal, norma, boa prática ou política interna.',
        'Siga no produto a cadeia de dois requisitos até controlos e políticas.',
        'Liste três perguntas que exigem validação jurídica (fora do alcance do produto).',
        'Redija a afirmação honesta de estado para o seu caso.'
      ],
      doneCriterion: 'Enquadramento classificado, cadeias verificadas no produto, perguntas jurídicas e afirmação honesta.',
      targetNavView: 'govern-compliance',
      targetLabel: 'Compliance Frameworks'
    },
    knowledgeCheck: [
      {
        id: 'q18-1',
        question: 'Sob o EU AI Act, a supervisão humana eficaz de sistemas de alto risco corresponde a qual artigo e controlo mapeado no produto?',
        options: [
          'ART-10 → CG-AG-06',
          'ART-14 → CG-AG-03 (Human-in-the-Loop)',
          'ART-9 → CG-AG-10',
          'ART-50 → CG-AG-01'
        ],
        correctIndex: 1,
        explanation: 'ART-14 (human oversight) mapeia a CG-AG-03 no produto — cadeia demonstrável em Compliance Frameworks.'
      },
      {
        id: 'q18-2',
        question: 'Um mapeamento completo de controlos no produto equivale a:',
        options: [
          'Uma declaração de conformidade legal',
          'Evidência operacional verificável que suporta — mas não substitui — a conclusão jurídica de conformidade',
          'Uma certificação ISO',
          'Um parecer do regulador'
        ],
        correctIndex: 1,
        explanation: 'A fronteira honesta: produto = evidência operacional; jurídico = conclusão de enquadramento legal.'
      },
      {
        id: 'q18-3',
        question: 'ISO/IEC 42001 e NIST AI RMF são, respetivamente:',
        options: [
          'Uma lei europeia e um contrato',
          'Uma norma voluntária de gestão de IA e um referencial voluntário de maturidade — nenhum dos dois é obrigação legal por si',
          'Dois regulamentos da UE',
          'Certificações obrigatórias para vender na UE'
        ],
        correctIndex: 1,
        explanation: 'Categorias diferentes de obrigatoriedade — confundir norma com lei gera planeamento regulatório errado.'
      },
      {
        id: 'q18-4',
        question: 'Um agente de IA processa dados de clientes no contexto do RGPD. O AI Act:',
        options: [
          'Substitui integralmente o RGPD nesse contexto',
          'Aplica-se em cumulação com o RGPD — regimes complementares',
          'Não se aplica se o sistema não for alto risco',
          'Só se aplica a órgãos públicos'
        ],
        correctIndex: 1,
        explanation: 'Regimes cumulativos: riscos de IA e proteção de dados são obrigações paralelas.'
      }
    ],
    skillsChecklist: [
      'Classifico obrigações legais, normas, boas práticas e políticas internas',
      'Sigo cadeias requisito→controlo→política no produto para AI Act, RGPD, DORA',
      'Delimitei o que exige validação jurídica',
      'Formulo afirmações de estado sem sobreafirmação de conformidade'
    ],
    summary:
      'Quatro categorias normativas; AI Act/RGPD/DORA cumulativos; ISO 42001 e NIST como voluntários; produto = evidência operacional; conclusão jurídica = validação especializada. Afirmações honestas sempre.',
    completionCriterion: 'Quiz com pelo menos 75% e enquadramento do exercício completo.'
  },
  {
    id: 'ac-19-metricas',
    moduleNumber: 19,
    levelNumber: 6,
    title: 'Métricas e melhoria contínua',
    subtitle: 'Indicadores de maturidade, armadilhas de métricas manipuláveis e planos de melhoria',
    difficulty: 'Avançado',
    estimatedMinutes: 22,
    iconName: 'TrendingUp',
    relatedNavView: 'overview-center',
    relatedNavLabel: 'Centro de Visão Geral',
    prerequisites: ['Módulo 18 — Regulamentação e frameworks'],
    learningObjectives: [
      'Selecionar indicadores de risco, cobertura, evidência, decisão e incidente',
      'Reconhecer armadilhas de métricas manipuláveis (Goodhart)',
      'Construir um plano de melhoria de governação com ações mensuráveis'
    ],
    conceptExplanation:
      'Métricas de governança existem para orientar decisões — não para decorar dashboards. Famílias recomendadas: COBERTURA DE INVENTÁRIO (% de sistemas de IA conhecidos com dono e classificação — o denominador é sempre estimado e deve ser declarado); COBERTURA E QUALIDADE DE EVIDÊNCIAS (% de decisões com digest verificável; % de lacunas UNAVAILABLE com plano); RESULTADOS DE TESTES (taxa de conformidade em casos adversos; cobertura da bateria); INCIDENTES (número, severidade, tempo de contenção, tempo de recuperação); DECISÕES E APROVAÇÕES (tempo de aprovação, taxa de rejeição, idade de gates pendentes — gates envelhecidos são dívida de supervisão); QUALIDADE DE CONTROLOS (evolução de enforcement: quantos guardrails passaram de OBSERVED a ENFORCED; quantos GAP_DETECTED abertos); EXCEÇÕES (número, idade, taxa de expiração sem tratamento).\n\nArmadilhas (efeito Goodhart): quando uma métrica se torna alvo, deixa de ser boa métrica. Exemplos: "100% de aprovações concluídas" pode esconder rubber-stamping (olhar tempo de aprovação — módulo 12); "0 incidentes" pode esconder sub-registro (olhar proxys: bloqueios fail-closed, chamadas de suporte); "X% de agentes avaliados" pode esconder avaliações rasas (olhar qualidade: evidências por avaliação); "score alto de governança" ponderado mal pode subir sem melhoria real de risco (decompor o score). Regra: cada métrica deve ter uma métrica-espelho que a torna difícil de inflacionar honestamente.\n\nPlano de melhoria: para cada lacuna de métrica → ação específica, dono, prazo, métrica-alvo e métrica-espelho. Ex.: "reduzir gates PENDING_REVIEW > 7 dias de 12 para <3 em 30 dias (dono: compliance; espelho: tempo médio de aprovação sem cair abaixo de 4h)". Métricas sem ação são decoração; ações sem métrica são intenção.',
    terminology: [
      { term: 'Goodhart', definition: 'Lei informal: quando uma medida se torna alvo, deixa de ser boa medida — induz otimização tética.' },
      { term: 'Métrica-espelho', definition: 'Indicador complementar que dificulta a inflação dishonesto de outra métrica.' },
      { term: 'Denominador declarado', definition: 'Transparência sobre a base de cálculo de uma métrica (ex.: "% de sistemas inventariados" — inventariados de quanto?).' },
      { term: 'Idade de gate', definition: 'Tempo desde criação de um pedido HITL — gates envelhecidos indicam supervisão emperrada ou abandono.' },
      { term: 'Melhoria contínua', definition: 'Ciclo: medir → diagnosticar → agir com dono e prazo → remedar → medir efeito.' }
    ],
    stepByStep: [
      { step: 'Abra o Centro de Visão Geral', detail: 'Observe os indicadores de maturidade e cobertura apresentados.' },
      { step: 'Liste métricas das sete famílias para o seu programa', detail: 'Cobertura, evidências, testes, incidentes, decisões, controlos, exceções.' },
      { step: 'Para cada métrica, defina denominador e fonte', detail: 'O que exatamente é medido, de onde vem, com que frequência.' },
      { step: 'Associe métricas-espelho', detail: 'Para as três mais inflacionáveis, defina o contraponto.' },
      { step: 'Identifique as duas lacunas mais graves', detail: 'Pelas métricas atuais: onde está o maior défice de maturidade?' },
      { step: 'Escreva o plano de melhoria', detail: 'Ação, dono, prazo, métrica-alvo e espelho para cada lacuna.' }
    ],
    businessExample:
      'Plano trimestral de um programa de governança: (1) Ação: inventariar sistemas shadow detectados pelo scanner; dono: arquitetura; prazo: 60 dias; alvo: 100% dos achados de sombra com dono atribuído; espelho: amostra manual confirmando denominador. (2) Ação: endurecer 5 guardrails de OBSERVED para ENFORCED; dono: plataforma; prazo: 90 dias; alvo: 5 transições; espelho: taxa de bloqueios resultantes (para não esconder impacto operacional). Este plano sobrevive a auditoria porque cada linha tem alvo verificável e espelho anti-tética.',
    commonMistakes: [
      { mistake: 'Otimizar o score agregado sem decompor', correction: 'Score subiu? Descubra qual componente e se a melhoria é real ou de peso.' },
      { mistake: 'Celebrar "zero incidentes" sem verificar sub-registro', correction: 'Proxys (bloqueios, tickets, chamadas) revelam atividade que a métrica oficial pode esconder.' },
      { mistake: 'Métricas sem dono e sem ação', correction: 'Indicador sem dono de melhoria é decoração — e a organização pára de olhar.' }
    ],
    exercise: {
      goal: 'Construir um plano de melhoria de governação com métricas e espelhos.',
      steps: [
        'Selecione duas lacunas identificadas nas métricas do seu contexto.',
        'Para cada uma: métrica atual, alvo mensurável, ação, dono, prazo.',
        'Defina a métrica-espelho de cada alvo.',
        'Descreva a cadência de revisão (mensal? trimestral?) e o gatilho de exceção.',
        'Verifique no Centro de Visão Geral que dados do produto apoiam a medição inicial.'
      ],
      doneCriterion: 'Plano com duas ações completas (alvo, dono, prazo, espelho, cadência) e baseline do produto verificada.',
      targetNavView: 'overview-center',
      targetLabel: 'Centro de Visão Geral'
    },
    knowledgeCheck: [
      {
        id: 'q19-1',
        question: 'A métrica "tempo médio de aprovação HITL = 2 minutos" deve levantar:',
        options: [
          'Celebrificação da eficiência',
          'Suspeita de rubber-stamping — supervisão sem análise; cruzar com taxa de rejeição e complexidade das decisões',
          'Uma otimização do modelo',
          'Nada — 2 minutos é ideal'
        ],
        correctIndex: 1,
        explanation: 'Tempo implausivelmente baixo sugere supervisão nominal — o espelho (rejeições, amostragem de qualidade) testa a hipótese.'
      },
      {
        id: 'q19-2',
        question: 'O efeito Goodhart em métricas de governança significa:',
        options: [
          'Métricas devem ser proibidas',
          'Quando uma métrica se torna alvo, é otimizada teticamente — por isso cada métrica precisa de espelho',
          'Só métricas automáticas são válidas',
          'Scores não devem existir'
        ],
        correctIndex: 1,
        explanation: 'Não se elimina métrica; diseña-se contra a otimização tética com espelhos e decomposição.'
      },
      {
        id: 'q19-3',
        question: 'Um plano de melhoria defensável contém:',
        options: [
          'Apenas a meta numérica',
          'Ação específica, dono, prazo, métrica-alvo e métrica-espelho',
          'Apenas o orçamento',
          'Apenas o risco associado'
        ],
        correctIndex: 1,
        explanation: 'Sem dono e prazo, é intenção; sem espelho, é inflacionável; sem ação concreta, é desejo.'
      }
    ],
    skillsChecklist: [
      'Seleciono métricas das sete famílias de governança',
      'Reconheço e protejo-me contra Goodhart com espelhos',
      'Declaro denominadores e fontes',
      'Escrevo planos com ação, dono, prazo, alvo e espelho'
    ],
    summary:
      'Métricas orientam decisões: cobertura, evidências, testes, incidentes, decisões, controlos, exceções. Espelhos contra tética; denominadores declarados; planos com dono e prazo.',
    completionCriterion: 'Quiz com pelo menos 75% e plano de melhoria do exercício completo.'
  },
  {
    id: 'ac-20-projeto-final',
    moduleNumber: 20,
    levelNumber: 6,
    title: 'Projeto final de ponta a ponta',
    subtitle: 'Caso empresarial completo: do SIPOC à decisão de aprovação fundamentada, com rubrica explícita',
    difficulty: 'Avançado',
    estimatedMinutes: 45,
    iconName: 'Award',
    relatedNavView: 'assure-readiness',
    relatedNavLabel: 'System Readiness',
    prerequisites: [
      'Módulos 1-19 concluídos (ou conhecimento equivalente demonstrado)',
      'Acesso ao produto para consultas das áreas referenciadas'
    ],
    learningObjectives: [
      'Integrar todas as competências do percurso num caso empresarial único',
      'Produzir entregáveis completos: SIPOC, especificação, riscos, políticas, testes, aprovação, evidências, dossier, monitorização',
      'Aplicar a rubrica de avaliação de forma auto-avaliável e revista por pares',
      'Emitir uma decisão fundamentada de aprovação, condicionamento ou bloqueio'
    ],
    conceptExplanation:
      'O projeto final consolida o percurso num entregável único, avaliado por rubrica. O caso base (adaptável ao contexto de cada aluno):\n\nCASO — "Aprovação assistida de crédito para pequenas empresas": um banco de média dimensão pretende um agente de IA que analisa pedidos de crédito de PME, consulta dados internos (SCORING, histórico bancário, simulações), prepara uma recomendação de decisão e encaminha para aprovação humana. O agente NÃO executa aprovações nem desembolsos.\n\nENTREGÁVEIS (um por competência do percurso):\n1. SIPOC do processo de aprovação de crédito (módulo 4) — com dados pessoais assinalados.\n2. Identificação e classificação de riscos (módulo 5) — mínimo 3 riscos com as 5 dimensões.\n3. Especificação do agente (módulo 7) — 7 componentes completas.\n4. Registo no Agent Studio (módulo 8) — no produto, com lacunas de prontidão listadas.\n5. Bateria de testes (módulo 9) — normais, limites, adversos, permissões + critérios.\n6. Mapeamento risco→controlo CG-AG→requisito (módulo 11) — mínimo 6 mapeamentos.\n7. Políticas e exceções (módulo 13) — políticas aplicáveis, guardrails, 1 exceção desenhada.\n8. Fluxo HITL (módulo 12) — pontos de aprovação, autoridade, revalidação.\n9. Pacote de evidências (módulo 14) — classificação de origens e integridades.\n10. Dossier (módulo 15) — âmbito, cobertura, lacunas declaradas.\n11. Monitorização e incidentes (módulo 19 + 17) — métricas, espelhos, 1 plano de incidente.\n12. DECISÃO FUNDAMENTADA — aprovar, aprovar condicionadamente ou bloquear, com justificação que cita evidências e assume lacunas.\n\nRUBRICA (5 critérios × 4 níveis: Insuficiente / Adequado / Sólido / Exemplar):\n• Rigor factual (afirmações suportadas; sem sobreafirmação de conformidade; origens classificadas).\n• Cobertura dos entregáveis (1-11 completos e interligados).\n• Qualidade das decisões (critérios ex-ante; decisões proporcionais; HITL bem desenhado).\n• Honestidade analítica (lacunas declaradas; limitações do produto reconhecidas; validação jurídica delimitada).\n• Qualidade de comunicação (claro para auditor; estrutura; terminologia correta).\n\nAuto-avaliação obrigatória antes de submissão; revisão por par recomendada. O certificado da Academia atesta conclusão do percurso formativo — NÃO é certificação profissional externa.',
    terminology: [
      { term: 'Decisão fundamentada', definition: 'Aprovação, condicionamento ou bloqueio com justificação citando evidências, critérios e lacunas assumidas.' },
      { term: 'Condicionamento', definition: 'Aprovação com restrições operacionais explícitas (âmbito reduzido, supervisão reforçada, validade limitada).' },
      { term: 'Rubrica', definition: 'Matriz de critérios × níveis de desempenho que torna a avaliação transparente e comparável.' },
      { term: 'Auto-avaliação', definition: 'Aplicação honesta da rubrica ao próprio trabalho antes de submissão — prática de maturidade analítica.' }
    ],
    stepByStep: [
      { step: 'Leia o caso e as restrições', detail: 'Registos: agente não executa decisões; dados incluem informações de PME com potencial pessoal; regulamentação: EU AI Act (provável alto risco — justifique), RGPD, DORA (se aplicável ao banco).'},
      { step: 'Produce os entregáveis 1-3 (SIPOC, riscos, especificação)', detail: 'Base do trabalho — cada um alimenta os seguintes.' },
      { step: 'Registe no produto e execute testes (entregáveis 4-5)', detail: 'Use o Agent Studio e as áreas de teste/simulação; cole evidence dos resultados.' },
      { step: 'Mapeie controlos e políticas (entregáveis 6-7)', detail: 'Cadeia completa no produto; estados de enforcement verificados.' },
      { step: 'Desenhe HITL e evidências (entregáveis 8-9)', detail: 'Pontos de aprovação, digests, classificação de origens.' },
      { step: 'Prepare dossier e monitorização (entregáveis 10-11)', detail: 'Cobertura, lacunas com dono e prazo; métricas com espelhos; plano de incidente.' },
      { step: 'Emita a decisão fundamentada (entregável 12)', detail: 'Aprovar / condicionar / bloquear — justifique com evidências e assuma lacunas. A rigorosidade vence o otimismo.' },
      { step: 'Auto-avalie com a rubrica', detail: 'Classifique cada critério; identifique o nível atual e o que falta para o seguinte.' }
    ],
    businessExample:
      'Decisão-exemplo de referência (não copiar — fundamentar no seu trabalho): "APROVAR CONDICIONADAMENTE o agente de apoio a crédito para PME, sob as condições: (1) âmbito limitado a crédito < 250k€ e clientes com histórico > 24 meses; (2) aprovação humana obrigatória em 100% das recomendações, com tempo mínimo de análise documentada; (3) monitorização mensal de viés por segmento (métrica + espelho: reclamações); (4) exceção temporária de 90 dias para fonte legada de scoring, com plano de substituição; (5) revalidação obrigatória em qualquer mudança de modelo ou fonte de dados. Lacunas assumidas: sem evidência de stress-test de prompt injection sobre documentos de clientes (plano: 30 dias); parecer jurídico de classificação AI Act pendente." Esta decisão é defensável: proporcional, condicionada, com lacunas assumidas.',
    commonMistakes: [
      { mistake: 'Decidir aprovar por otimismo ("parece seguro")', correction: 'A decisão deve citar evidências e assumir lacunas — otimismo não é critério.' },
      { mistake: 'Entregáveis desconectados (SIPOC ≠ riscos ≠ testes)', correction: 'A rubrica avalia interligação: cada entregável deve referenciar os anteriores.' },
      { mistake: 'Auto-avaliação inflacionada', correction: 'Auto-avaliação honesta é prática de maturidade — a revisão por par existe para calibrar.' }
    ],
    exercise: {
      goal: 'Produzir o projeto completo do caso e emitir a decisão fundamentada com auto-avaliação pela rubrica.',
      steps: [
        'Produza os 11 entregáveis técnicos do caso.',
        'Emita a decisão fundamentada (entregável 12).',
        'Auto-avalie os 5 critérios da rubrica com nível e justificação.',
        'Identifique o entregável mais fraco e o plano de melhoria.',
        'Opcional mas recomendado: revisão por colega com a mesma rubrica.'
      ],
      doneCriterion: 'Doze entregáveis produzidos, decisão emitida, auto-avaliação completa com plano de melhoria.',
      targetNavView: 'assure-readiness',
      targetLabel: 'System Readiness'
    },
    knowledgeCheck: [
      {
        id: 'q20-1',
        question: 'Numa decisão fundamentada de aprovação condicionada, é obrigatório:',
        options: [
          'Apenas a assinatura do gestor',
          'As condições operacionais explícitas, validade, métricas de acompanhamento e lacunas assumidas',
          'Apenas o prazo de validade',
          'Apenas a lista de riscos'
        ],
        correctIndex: 1,
        explanation: 'Condicionamento sem condições explícitas e verificáveis é aprovação disfarçada.'
      },
      {
        id: 'q20-2',
        question: 'O certificado emitido pela Academia ComplyPRO atesta:',
        options: [
          'Certificação profissional reconhecida por reguladores',
          'A conclusão do percurso formativo da plataforma — sem valor de acreditação externa',
          'Conformidade legal do aluno com o EU AI Act',
          'Competência jurídica em proteção de dados'
        ],
        correctIndex: 1,
        explanation: 'Honestidade de rótulo: é certificado de plataforma, não acreditação externa — o produto aplica a mesma disciplina de honestidade a todos os seus artefactos.'
      },
      {
        id: 'q20-3',
        question: 'Uma lacuna conhecida (ex.: sem teste de injeção sobre documentos) numa decisão deve ser:',
        options: [
          'Omitida para não enfraquecer a aprovação',
          'Assumida explicitamente na decisão, com plano, dono e prazo',
          'Convertida em risco baixo automaticamente',
          'Transferida para o fornecedor do modelo'
        ],
        correctIndex: 1,
        explanation: 'Lacuna assumida com plano é sinal de maturidade; omissão descoberta é sinal de fraqueza de governação.'
      }
    ],
    skillsChecklist: [
      'Integro SIPOC, riscos, especificação, testes, controlos, políticas, HITL, evidências, dossier e métricas',
      'Emito decisões proporcionais com condições verificáveis',
      'Declaro lacunas com plano na própria decisão',
      'Auto-avalio com rubrica de forma honesta e calibrada'
    ],
    summary:
      'Projeto final: 12 entregáveis interligados num caso real, decisão fundamentada (aprovar/condicionar/bloquear) e auto-avaliação por rubrica. O percurso completo: processo→agente→governação→evidência→decisão.',
    completionCriterion: 'Quiz com pelo menos 75% e projeto completo com decisão emitida e auto-avaliação.',
    limitations: [
      'O certificado é emitido pela plataforma e não tem valor de acreditação externa'
    ]
  }
];
