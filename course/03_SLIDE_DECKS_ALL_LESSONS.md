# 📊 ESTRUTURA DE SLIDES EXECUTIVOS (DECK DE APRESENTAÇÃO)
## Formação: Especialista em Governança, Riscos & Auditoria de Agentes de IA
### *Padrão Visual: Estilo editorial sóbrio, tipografia clean (Inter / Outfit), fundo Dark Navy (#0B0F19) ou Light Slate (#F8FAFC), zero poluição visual.*

---

## 📑 MÓDULO 1: O TABULEIRO REGULATÓRIO GLOBAL DA IA

### Slide Deck 1.1 — O Fim do "Faroeste da IA"
- **Slide 1 [Capa]:** 
  - *Título:* Formação Executiva em Governança de IA & Agentes Autônomos
  - *Subtítulo:* Do Código-Fonte à Sala do Conselho
  - *Identidade:* ComplyPRO Academy • Certificação AIGOV™
- **Slide 2 [Contexto 2026]:**
  - *Headline:* A Transição de Era da Inteligência Artificial
  - *Colunas:* 
    - 2023-2024: Era da Experimentação (Provas de Conceito, Adoção Desregulada, Shadow AI).
    - 2025-2026+: Era da Responsabilidade & Auditoria (EU AI Act em vigor, ANPD fiscalizando, ISO 42001 exigida em licitações).
- **Slide 3 [O Custo da Inação]:**
  - *Métricas em Destaque:* € 35 Milhões (Teto EU AI Act), R$ 50 Milhões (Teto LGPD), Perda de Reputação & Responsabilidade Civil dos Diretores.
- **Slide 4 [A Ferramenta do Curso]:**
  - *Screenshot do ComplyPRO Light:* 6 meses de acesso hands-on incluído para todos os alunos.

---

### Slide Deck 1.2 — EU AI Act Decodificado (Anexo III e Sanções)
- **Slide 1 [Capa]:** Regulamento Europeu de IA (EU AI Act) — Arquitetura Jurídica
- **Slide 2 [A Pirâmide de Risco]:**
  - Diagrama em 4 Níveis:
    - 🔴 **Inaceitável:** Proibição Total (Social Scoring, Manipulação).
    - 🟠 **Alto Risco (Anexo III):** RH, Crédito, Saúde, Biometria, Infraestrutura Crítica (Exige Dossiê, Logs, HITL, Explicabilidade).
    - 🔵 **Risco Limitado (Art. 50):** Chatbots e Geração de Conteúdo (Transparência Obrigatória).
    - 🟢 **Risco Mínimo:** Filtros de spam, jogos.
- **Slide 3 [Extraterritorialidade]:**
  - Quando a lei europeia se aplica a empresas brasileiras e globais.
- **Slide 4 [Checklist de Auditoria Art. 11 a 15]:**
  - Tabela resumida de requisitos mandatórios para sistemas de Alto Risco.

---

## 📑 MÓDULO 2: ANATOMIA DE AGENTES, SHADOW AI & OWASP

### Slide Deck 2.1 — Da LLM aos Agentes Autônomos
- **Slide 1 [Capa]:** Arquitetura Técnica & Superfície de Ataque em Agentes
- **Slide 2 [Componentes de um Agente]:**
  - Bloco 1: LLM Engine (Raciocínio)
  - Bloco 2: Memory (Estado & Vetores)
  - Bloco 3: Tool Execution (APIs externas, SQL, Terminal)
  - Bloco 4: Autonomy Loop (ReAct, Reflexion, Multi-Agent Swarm)
- **Slide 3 [O Risco Jurídico da Ação]:**
  - Diferença entre *Sugerir Texto* e *Executar Transações Financeiras / Modificar Bancos de Dados*.
- **Slide 4 [Model Context Protocol - MCP]:**
  - Governança de conexões e permissões granulares de ferramentas.

---

### Slide Deck 2.3 — OWASP Top 10 para LLMs
- **Slide 1 [Capa]:** Vetores de Ataque em Modelos & Agentes
- **Slide 2 [LLM01: Prompt Injection Indireta]:**
  - Diagrama de fluxo de ataque via documentos e páginas web externas.
- **Slide 3 [LLM02: Insecure Output Handling]:**
  - Como saídas de LLM não sanitizadas causam injeção de SQL ou execução remota de código (RCE).
- **Slide 4 [Padrão de Mitigação]:**
  - Esquemas Pydantic / Zod estritos, Validação de Tipos e Guardrails de Entrada/Saída.

### Slide Deck 2.4 — Model Context Protocol (MCP) & Permissões
- **Slide 1 [Capa]:** Governança de Tools & Protocolo MCP
- **Slide 2 [Superfície de Ataque das Tools]:** O perigo de permissões abertas de escrita e execução em ferramentas de agentes.
- **Slide 3 [Padrão Least-Privilege]:** Delimitação de acessos somente-leitura e escopos restritos.

---

### Slide Deck 2.5 — Agentic Governance Lifecycle & Agent Passport
- **Slide 1 [Capa]:** O Ciclo de Governança Agentic & Crachá Digital do Agente
- **Slide 2 [Princípio Central]:** *"Every Agent Action Must Be Governable and Evidenced."*
- **Slide 3 [O Ciclo em 5 Etapas]:**
  - **1. DEFINE:** Propósito, Owner formal e Nível de Autonomia.
  - **2. BUILD:** Modelos homologados, Tools e Permissões limitadas.
  - **3. GOVERN:** Guardrails, Políticas e Controles de Aprovação.
  - **4. OBSERVE:** Comportamento, Decisões, Telemetria e Evidências.
  - **5. RESPOND:** Intervenção, Circuit Breakers e Kill Switch imediato.
  - *(Loop fechado: **IMPROVE** como retorno contínuo).*
- **Slide 4 [Agent Governance Passport]:**
  - A anatomia do Passaporte: ID único, Owner, Nível de Autonomia, Permissões, Guardrails, Histórico de Incidentes e Assinatura Digital.

---

## 📑 MÓDULO 3: LABORATÓRIO HANDS-ON COM COMPLYPRO LIGHT

### Slide Deck 3.2 — Guia Prático de Escaneamento
- **Slide 1 [Capa]:** Auditoria Prática de Repositórios de Código
- **Slide 2 [Privacidade Client-Side]:**
  - Diagrama comprovando processamento 100% no navegador (Web Workers + AST local).
- **Slide 3 [Passo a Passo de Execução]:**
  - 1. Inserção de Repositório Git / Upload ZIP
  - 2. Mapeamento de Dependências (LangChain, CrewAI, OpenAI, Anthropic)
  - 3. Detecção de 13 Regulações & Chaves Hardcoded
  - 4. Emissão do Score Geral de Conformidade
- **Slide 4 [Interpretação do Score Geral]:**
  - Como a ponderação por domínio de negócio protege a avaliação contra falsos positivos.

---

### Slide Deck 3.3 — Matriz SIPOC de Governança
- **Slide 1 [Capa]:** Rastreabilidade de Agentes: Framework SIPOC
- **Slide 2 [Os 5 Pilares]:**
  - **S**uppliers: Provedores de Base (OpenAI, Bedrock, Anthropic)
  - **I**nputs: Dados de Entrada & Variáveis de Prompt
  - **P**rocess: Orquestração e Agentes Autônomos
  - **O**utputs: Decisões geradas e respostas estruturadas
  - **C**ustomers: Usuários finais e sistemas downstream
- **Slide 3 [Exemplo Real]:**
  - SIPOC de um Agente de Análise de Risco de Crédito FinTech.

---

### Slide Deck 3.5 — CG-AG Agentic Light (10 Dimensões)
- **Slide 1 [Capa]:** Diagnóstico Rápido de Governança Agentic
- **Slide 2 [As 10 Dimensões]:**
  - Purpose, Ownership, Autonomy, Data, Tools, Permissions, Policy, Observability, Evidence, Response.
- **Slide 3 [Agentic Governance Score]:**
  - 🟢 **Governed** (>=80%) • 🟡 **Attention Required** (60-79%) • 🔴 **Exposure** (<60%).
- **Slide 4 [Plano de Ação Corretiva]:**
  - Priorização P1 a P4 de controles ausentes e emissão de Passaportes.

---

## 📑 MÓDULO 4: GOVERNANÇA DE RUNTIME & FINOPS

### Slide Deck 4.1 — Human-in-the-Loop (HITL) & Supervisão
- **Slide 1 [Capa]:** Supervisão Humana Obrigatória em Sistemas de IA
- **Slide 2 [Níveis de Autonomia]:**
  - L1: Assistência (Humano Decide, IA Sugere)
  - L2: Co-Piloto com Checkpoint Obrigatório (IA Executa após Aprovação Humana)
  - L3: Autonomia Supervisionada (IA Executa com Alerta de Exceção)
  - L4: Autonomia Total (Proibida em Alto Risco Anexo III)
- **Slide 3 [Implementando Checkpoints no Código]:**
  - Padrão de código com LangGraph e State Graphs com pausas interativas.

---

### Slide Deck 4.3 — FinOps de Tokens & Otimização de Custos
- **Slide 1 [Capa]:** Gestão Financeira de Tokens e Prevenção de Desperdício
- **Slide 2 [A Curva de Custo de Inferência]:**
  - Como chamadas repetitivas e prompts excessivos drenam o orçamento de TI.
- **Slide 3 [As 3 Alavancas de FinOps]:**
  - 1. Cache Semântico (Até 40% de economia)
  - 2. Roteamento Inteligente (SLM vs LLM)
  - 3. Circuit Breakers de Limite de Tokens por Sessão

---

## 📑 MÓDULO 5: SIMULAÇÃO MONTE CARLO & LENTES C-LEVEL

### Slide Deck 5.2 — Simulação Estocástica de Monte Carlo
- **Slide 1 [Capa]:** Traduzindo Código em Risco Financeiro: Simulação Monte Carlo
- **Slide 2 [Por que 10.000 Iterações?]:**
  - Modelagem atuarial com distribuição log-normal para eventos de baixa probabilidade e alto impacto (Multas Regulatórias).
- **Slide 3 [Métricas Principais]:**
  - **VaR 95%:** Valor Máximo em Risco com 95% de confiança.
  - **CVaR (Expected Shortfall):** Média de perda no pior cenário de 5%.
  - **Probabilidade de Sanção:** Chance estatística de fiscalização ativa.
- **Slide 4 [Demonstração no Dashboard]:**
  - Como apresentar a curva de probabilidade para diretores e seguradoras.

---

## 📑 MÓDULO 6: DOSSIÊS REGULATÓRIOS & CERTIFICAÇÃO

### Slide Deck 6.1 — Geração e Defesa do RIPD Oficial
- **Slide 1 [Capa]:** Emissão do Relatório de Impacto à Proteção de Dados (Art. 38 LGPD)
- **Slide 2 [Estrutura do Documento Oficial]:**
  - 1. Descrição dos Fluxos de Tratamento e IA
  - 2. Identificação de Agentes e Modelos
  - 3. Avaliação de Necessidade e Proporcionalidade
  - 4. Medidas de Segurança e Mitigação de Riscos
- **Slide 3 [Apresentação à ANPD]:**
  - Prazos legais de resposta e boas práticas de entrega.
- **Slide 4 [Encerramento & Certificação AIGOV™]:**
  - *Selo Oficial:* Certified AI Governance & Agentic Auditor (AIGOV™)
  - *Validação:* QR Code e Hash Criptográfico na Blockchain/Registro Digital ComplyPRO
  - *Call to Action:* Submeter projeto prático e solicitar emissão da credencial.


---

## 🎯 SLIDE DECK: MÓDULO 3 — AI AGENT CAPABILITY & PERMISSION DISCOVERY

### Slide 1: A Nova Fronteira da Auditoria de IA
- **Título:** Do "Quem é o Agente?" para o "O Que Ele Efetivamente Pode Fazer?"
- **Cadeia Canônica:** Agente → Identidade → Role → Sistema → Recurso → Ação → Permissão
- **Alerta de Governança:** Conhecer apenas o prompt ou o nome do agente é insuficiente para compliance.

### Slide 2: A Matriz dos 5 Estados de Capability
- 🟢 **AUTHORIZED_CAPABILITY:** Concessão explícita comprovada por IAM Policy, DB Grant ou Escopo OAuth.
- 🟡 **DECLARED_CAPABILITY:** Ferramenta declarada em construtor ou manifesto de framework.
- 🔵 **OBSERVED_CAPABILITY:** Chamada ou query observada fisicamente na análise de AST.
- 🟣 **USED_CAPABILITY:** Evidência de execução ativa em runtime/logs.
- 🔴 **UNKNOWN_AUTHORIZATION:** Capability observada SEM evidência de autorização formal (Risco P0).

### Slide 3: Invariante Fundamental de Segurança
- **Regra de Ouro:** `OBSERVED ≠ AUTHORIZED`
- O fato de um agente possuir o código `cursor.execute("SELECT * FROM invoices")` NÃO significa que ele está autorizado.
- A participação de um agente em um processo SIPOC de negócio NUNCA confere privilégios técnicos.

### Slide 4: Anomalias de Segurança Detectadas
- ⚠️ **Excessive Wildcard Permissions:** Políticas IAM com `Action: "*"` ou `Resource: "*"`.
- 🚨 **Destructive Actions without HITL:** Execuções de `DROP TABLE`, `TRUNCATE` ou `s3.delete_objects()`.
- 🔍 **Identity Mismatch & Cross-System Access:** Agente acessando ERP e Office 365 sem vínculo de Service Account.
