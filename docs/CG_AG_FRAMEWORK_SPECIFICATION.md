# 📜 CG-AG: Framework de Governança de Agentes Autônomos de IA
### *CodeGuard Agent Governance Framework — Matriz de 12 Controles Auditáveis*
**Versão:** 1.0.0 Enterprise  
**Classificação:** Padrão Técnico de Governança, Riscos & Conformidade de IA  
**Autor:** ComplyPRO Ecosystem  
**Compatibilidade:** ISO/IEC 42001:2023 • NIST AI RMF 1.0 • EU AI Act (Regulamento 2024/1689) • LGPD • OWASP LLM Top 10  

---

## 🎯 1. Visão Geral e Propósito

O **CG-AG (CodeGuard Agent Governance Framework)** é um framework técnico determinístico criado para preencher a lacuna entre as exigências regulatórias abstratas (como o *EU AI Act* e a *ISO 42001*) e a **realidade do código-fonte e arquitetura de sistemas baseados em LLMs e Agentes Autônomos** (LangChain, CrewAI, AutoGen, Semantic Kernel, LlamaIndex, MCP).

Diferente de frameworks puramente documentais, o CG-AG foi desenhado para ser **100% auditável estaticamente em código e validável em tempo de execução (runtime)**.

---

## 🏛️ 2. Matriz dos 12 Controles de Governança (CG-AG-01 a CG-AG-12)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    CG-AG: MATRIZ DE 12 CONTROLES DE IA                      │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│   MAP & INVENTÁRIO   │  SEGURANÇA & GUARD   │     OPERAÇÃO & AUDITORIA       │
│  CG-AG-01 a CG-AG-04 │  CG-AG-05 a CG-AG-08 │     CG-AG-09 a CG-AG-12        │
└──────────────────────┴──────────────────────┴────────────────────────────────┘
```

---

### [CG-AG-01] Inventário & Registro Central de Modelos e Agentes
* **Domínio NIST:** MAP 1.1 / ISO 42001 A.5.2
* **Objetivo:** Garantir que nenhum agente, LLM ou serviço de inferência opere sem registro formal de propriedade (ownership) e versão de modelo.
* **Requisito Técnico:** Cada agente instanciado no código deve declarar: `name`, `model_id`, `custodian` (Dono RACI) e `purpose`.
* **Critério de Falha (Shadow AI):** Chamadas diretas a bibliotecas como `openai`, `anthropic`, `google.generativeai` sem passagem por gateway ou registro centralizado.
* **Evidência Auditável:** Arquivo de registro estático ou manifesto IaC de agentes.

---

### [CG-AG-02] Limitação de Escopo & Autorização de Ferramentas (Tool Scoping / MCP)
* **Domínio NIST:** MANAGE 2.4 / OWASP LLM07
* **Objetivo:** Impedir que agentes autônomos recebam permissões excessivas de execução em bancos de dados, APIs ou sistema operacional.
* **Requisito Técnico:** Toda ferramenta acoplada ao agente (Functions / MCP Tools) deve possuir lista explícita de comandos permitidos (Whitelisting) e validação de schema de entrada/saída.
* **Critério de Falha:** Agentes com permissão genérica de `execute_query("*")`, `eval()` ou acesso total a sistema de arquivos sem restrição de diretório.
* **Evidência Auditável:** Schemas JSON e decoradores de restrição de escopo de ferramentas.

---

### [CG-AG-03] Supervisão Humana Mandatória (Human-in-the-Loop — HITL)
* **Domínio NIST:** GOVERN 1.2 / EU AI Act Art. 14 / LGPD Art. 20
* **Objetivo:** Assegurar que decisões com impacto jurídico, financeiro ou sanitário sobre pessoas naturais não sejam executadas sem aprovação humana prévia.
* **Requisito Técnico:** Funções de alto risco (`approve_credit`, `diagnose_patient`, `delete_record`, `transfer_funds`) devem disparar um checkpoint de aprovação assíncrono (Human-in-the-Loop L2).
* **Critério de Falha:** Agentes autônomos executando mutações de dados ou decisões vinculantes com `isAutonomous: true` e sem barreira humana.
* **Evidência Auditável:** Middleware ou decorador `@require_human_approval` no pipeline.

---

### [CG-AG-04] Circuit Breaker, Timeout & Proteção Anti-Loop Infinito
* **Domínio NIST:** MANAGE 3.1 / OWASP LLM04 / DORA Art. 11
* **Objetivo:** Evitar exaustão de recursos, travamentos de produção e custos descontrolados de API decorrentes de loops de reflexão entre múltiplos agentes.
* **Requisito Técnico:** Todo loop de agente (`AgentExecutor`, `while`, tarefas recursivas) deve conter `max_iterations <= 10` e `timeout <= 60s`.
* **Critério de Falha:** Loops de orquestração de agentes sem parâmetros `max_iterations` ou `max_execution_time`.
* **Evidência Auditável:** Configuração explícita de `max_iterations` nas classes controladoras de agentes.

---

### [CG-AG-05] Sanitização de Prompts & Proteção contra Prompt Injection
* **Domínio NIST:** MANAGE 2.1 / OWASP LLM01
* **Objetivo:** Proteger a camada de instrução do modelo contra injeções diretas de usuário e injeções indiretas vindas de documentos/APIs externas.
* **Requisito Técnico:** Inputs de usuários não podem ser concatenados diretamente em strings de prompt (`f"Prompt {user_input}"`). Uso mandatório de classes de mensagens (`SystemMessage`, `HumanMessage`) e validadores de prompt (Guardrails).
* **Critério de Falha:** Concatenação insegura de strings de prompt em pontos de entrada não sanitizados.
* **Evidência Auditável:** Uso de templates tipados (`ChatPromptTemplate`) e filtros de injeção.

---

### [CG-AG-06] Proteção de Dados Pessoais & Desidentificação de PII
* **Domínio NIST:** GOVERN 2.3 / LGPD Art. 7, 11, 46 / GDPR Art. 25 & 32
* **Objetivo:** Impedir o vazamento de dados pessoais identificáveis (CPF, RG, E-mail, Cartão, Biometria, Saúde) para prompts e logs de terceiros.
* **Requisito Técnico:** Camada de pré-processamento com anonimização / mascaramento regex de PII antes do envio à API de LLM.
* **Critério de Falha:** Envio de campos sensíveis em texto claro nos payloads de mensagens do modelo.
* **Evidência Auditável:** Pipeline de desidentificação de dados (ex: Microsoft Presidio, regex sanitizers).

---

### [CG-AG-07] Trilha Imutável de Auditoria e Decisão (Audit Trail)
* **Domínio NIST:** MEASURE 2.7 / ISO 42001 A.8.4 / EU AI Act Art. 12
* **Objetivo:** Garantir a reprodutibilidade, explicabilidade e capacidade probatória de todas as inferências e ações dos agentes para auditorias externas.
* **Requisito Técnico:** Gravação estruturada de: `timestamp`, `agent_id`, `prompt_hash`, `tools_called`, `output_rationale` e `response_tokens` em armazenamento protegido contra alteração.
* **Critério de Falha:** Execução de agentes sem logs de auditoria ou gravação de histórico apenas em memória volátil.
* **Evidência Auditável:** Configuração de logging estruturado (OpenTelemetry, Langfuse, Arize, Tracing nativo).

---

### [CG-AG-08] Gerenciamento Seguro de Credenciais e Segredos
* **Domínio NIST:** GOVERN 3.2 / OWASP LLM06 / BCB Res. 4893
* **Objetivo:** Proibir terminantemente o armazenamento de chaves de API e senhas diretamente no código ou em repositórios Git.
* **Requisito Técnico:** Chaves (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, tokens) devem ser injetadas exclusivamente via variáveis de ambiente (`process.env`, `os.environ`) ou Secrets Managers (AWS Secrets, HashiCorp Vault, Azure KeyVault).
* **Critério de Falha:** Strings com formato `sk-...`, `ghp-...` ou credenciais em arquivos de código ou `.env` commitados.
* **Evidência Auditável:** Arquivos `.env.example` e ausência de hardcoded secrets nas branches de release.

---

### [CG-AG-09] Monitoramento de Deriva, Alucinação & Viés (Model Drift)
* **Domínio NIST:** MEASURE 2.3 & 2.6 / ISO 42001 A.9.2
* **Objetivo:** Detectar degradação de performance, respostas tendenciosas e alucinações de agentes em ambiente de produção.
* **Requisito Técnico:** Mecanismos de validação de consistência semântica e medição de confiança estatística da resposta antes da entrega ao usuário.
* **Critério de Falha:** Falta de telemetria de precisão ou ausência de monitoramento de taxa de erro de saída.
* **Evidência Auditável:** Implementação de avaliadores de qualidade (RAG Triad, LLM-as-a-Judge, Groundedness checks).

---

### [CG-AG-10] FinOps, Orçamento de Tokens & Rate Limiting
* **Domínio NIST:** MANAGE 3.2 / DORA Art. 6
* **Objetivo:** Controlar o custo operacional de inferência, evitar ataques de negação de serviço e instituir limites de consumo por usuário/departamento.
* **Requisito Técnico:** Implementação de limitadores de taxa (`rateLimit`), contagem de tokens por requisição e cache semântico para prompts recorrentes.
* **Critério de Falha:** Endpoints de IA expostos publicamente sem autenticação ou limites de requisições por minuto.
* **Evidência Auditável:** Middleware de rate-limit e orçamentos configurados por chave de API.

---

### [CG-AG-11] Resiliência, Fallback Determinístico & Graceful Degradation
* **Domínio NIST:** MANAGE 2.3 / ISO 42001 A.8.5
* **Objetivo:** Assegurar continuidade de negócios quando um provedor de LLM estiver indisponível (outage) ou degradado.
* **Requisito Técnico:** Bloco de captura de exceções com chaveamento automático para modelo secundário ou fallback para resposta determinística baseada em regras.
* **Critério de Falha:** Falta de bloco `try/catch` ao redor de chamadas de rede de IA, gerando `500 Internal Server Error` na aplicação.
* **Evidência Auditável:** Lógica de retry com backoff exponencial e modelos de contingência.

---

### [CG-AG-12] Governança de Terceiros & Supply Chain de IA
* **Domínio NIST:** GOVERN 1.5 / EU AI Act Art. 25 / DORA Art. 28
* **Objetivo:** Auditar dependências externas, bibliotecas de IA, plugins comunitários e MCP Servers para evitar vulnerabilidades na cadeia de suprimentos.
* **Requisito Técnico:** Travamento de versões de dependências (`package-lock.json`, `poetry.lock`, `requirements.txt`) e escaneamento periódico de CVEs.
* **Critério de Falha:** Uso de pacotes de IA não mantidos ou bibliotecas com vulnerabilidades críticas conhecidas.
* **Evidência Auditável:** Relatório de verificação de vulnerabilidades de dependências (Software Bill of Materials — SBOM).

---

## 🗺️ 3. Mapeamento Regulatório Cruzado do CG-AG

| Controle CG-AG | ISO/IEC 42001:2023 | NIST AI RMF | EU AI Act (2024/1689) | LGPD / GDPR | OWASP LLM |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CG-AG-01 (Inventário)** | Cláusula 6.1 / A.5.2 | MAP 1.1, MAP 1.5 | Art. 6, Art. 50 | Art. 37 (Registro) | LLM08 |
| **CG-AG-02 (Tool Scoping)** | Anexo A.6.2 | MANAGE 2.4 | Art. 9 (Mitigação) | Art. 46 (Segurança) | LLM07 |
| **CG-AG-03 (HITL)** | Cláusula 8.2 / A.8.2 | GOVERN 1.2 | Art. 14 (Supervisão) | Art. 20 (Revisão) | LLM09 |
| **CG-AG-04 (Anti-Loop)** | Anexo A.8.5 | MANAGE 3.1 | Art. 15 (Robustez) | Art. 46 (Segurança) | LLM04 |
| **CG-AG-05 (Prompt Guard)** | Anexo A.6.1 | MANAGE 2.1 | Art. 15 (Cibersegurança) | Art. 46 (Segurança) | LLM01, LLM02 |
| **CG-AG-06 (Privacidade PII)** | Anexo A.7.2 | GOVERN 2.3 | Art. 10 (Governança Dados) | Art. 7, 11, 18, 38 | LLM06 |
| **CG-AG-07 (Audit Trail)** | Cláusula 9.1 / A.8.4 | MEASURE 2.7 | Art. 12 (Logs) | Art. 38 (RIPD) | LLM08 |
| **CG-AG-08 (Secrets Mgmt)** | Anexo A.6.1 | GOVERN 3.2 | Art. 15 (Segurança) | Art. 46 (Boas Práticas) | LLM06 |
| **CG-AG-09 (Drift & Bias)** | Cláusula 9.2 / A.9.2 | MEASURE 2.3, 2.6 | Art. 10 (Vieses) | Art. 20 (Não-discriminação) | LLM03 |
| **CG-AG-10 (FinOps & Rate)** | Anexo A.8.5 | MANAGE 3.2 | Art. 15 (Disponibilidade) | - | LLM04 |
| **CG-AG-11 (Resiliência)** | Anexo A.8.5 | MANAGE 2.3 | Art. 15 (Robustez Técnica) | Art. 46 (Continuidade) | - |
| **CG-AG-12 (Supply Chain)** | Anexo A.5.4 | GOVERN 1.5 | Art. 25 (Cadeia de Valor) | Art. 39 (Operadores) | LLM05 |

---

## 💻 4. Como o Scanner ComplyPRO Avalia o CG-AG

O motor do scanner analisa a árvore de arquivos estática (`.ts`, `.py`, `.js`, `.json`, `.yaml`, `.tf`) e executa:

1. **Parser de AST e Regex Semântico:** Identifica padrões de instâncias de agentes (ex: `Agent(role=...)`, `ChatOpenAI(...)`).
2. **Checagem de Guardrails:** Procura por parâmetros `max_iterations`, middlewares de sanitização e decoradores de supervisão humana.
3. **Detecção de Shadow AI:** Mapeia chamadas diretas a APIs de modelos sem anotações de governança.
4. **Cálculo de Score CG-AG (0 a 100):** Subtrai penalidades conforme a gravidade das violações aos 12 controles.

---

> 📌 **Documento Oficial do Ecossistema ComplyPRO**  
> Para detalhes de implementação de código, consulte os módulos em `src/core/risk-detector.ts` e `src/web/components/PersonaViews.tsx`.
