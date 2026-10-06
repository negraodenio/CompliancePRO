# COMPLYPRO.PT — PRODUCT SIMPLIFICATION SPRINT
## MISSION: AGENT INVENTORY FIRST (FINAL DELIVERABLE)

---

### Executive Summary & New Product Promise

Following external evaluation comparing ComplyPRO against generalist LLM prompt outputs (such as Claude with CG-AG knowledge), this sprint radically simplified the information architecture and user experience of ComplyPRO without altering or deleting any core technical mechanisms.

**Nova Promessa:**
> *"Saiba que agentes existem.  
> Saiba o que eles podem fazer.  
> Controle o que lhes é permitido.  
> Prove o que realmente fizeram."*  
> *(“Know what your agents can do. Control what they are allowed to do. Prove what they actually did.”)*

**Novo Percurso Principal:**
$$\text{DISCOVER} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{GOVERN} \longrightarrow \text{PROVE}$$

**Entidade Central:**  
O **AGENT** é a entidade central e o primeiro destino pós-login. Scanner, Guardian, Compliance Compiler, Gateways, Runtime e Evidence permanecem como infraestrutura operacional e de garantia, sem sobrecarregar a primeira impressão do usuário.

---

### 1. Baseline

Antes de quaisquer alterações, o repositório foi auditado e executado:
- `npm run typecheck` (`tsc --noEmit`): Compilação estrita TypeScript sem erros.
- `npm test`: 22 suites de teste cobrindo Compliance Compiler, Guardian, Capability Gateway, Evidence Ledger, Agent Provisioning, Isolated Runtime, CrewAI Adapter, Agent Studio API, Governance Cockpit, Model/Tool/Data Gateways, End-to-End Governed Agent, Security S8-1, Persistence S8-2, Multi-Process Restart S8-2A, RLS Real S8-2B, Container Audit S8-3, Worker Sandbox S8-4, Active Governance S8-5 e Remediações Cirúrgicas de Segurança.
- `npm run build`: Vite build cliente + Vite SSR build servidor (`dist-server/app.js`) + Worker runner (`dist-server/sandbox/worker-runner.js`).

---

### 2. Navegação Anterior (Current Navigation)

A navegação anterior apresentava sobrecarga cognitiva e jargão excessivo na primeira tela:
- Mais de 25 destinos simultâneos no menu lateral;
- 4 destinos fixos + 4 grupos colapsáveis com 5 ou mais sub-ecrãs cada;
- Exposição direta de internals técnicos como "12 Controls Matrix", "SIPOC", "RFC 8785", "Annex IV", "Universal MCP", "10 Attacks", "Preflight";
- O usuário novo era confrontado com ferramentas de infraestrutura antes de saber se tinha agentes na organização e quem respondia por eles.

---

### 3. Nova Navegação (New Navigation)

A nova arquitetura simplifica drasticamente a barra superior e o menu primário para 5 destinos funcionais:

| Destino Principal | Identificador | Finalidade de Negócio |
| :--- | :--- | :--- |
| **AGENTS** | `ai-agents` | **Home principal pós-login:** Inventário de agentes, owners, risco e status de governança. |
| **DISCOVER** | `tools-scanner` | Sensor de código (AST Scanner para repositórios GitHub, ZIP e pastas). |
| **GOVERNANCE** | `overview-center` | Hub de conformidade, perfis regulatórios e matriz de controles. |
| **EVIDENCE** | `assure-evidence` | Livro-razão (Evidence Ledger) com provas imutáveis SHA-256 e Merkle roots. |
| **SETTINGS** | `settings` | Configurações organizacionais, chaves e políticas de acesso. |

*Progressive Disclosure:* Ferramentas avançadas de engenharia (*Agent Studio, Governance Cockpit, HITL Approvals, Incidents Failsafe, Universal MCP, CG-AG Academy*) continuam disponíveis no menu retrátil *"ADVANCED WORKSPACES"* e via atalhos contextuais dentro da página de cada agente.

---

### 4. Agent Inventory Design (AI AGENTS Home)

A tela inicial (`/agents` ou vista `ai-agents`) responde de imediato:
*"Que agentes existem na minha organização?"*

#### 4.1 Dashboard Conciso (Sem métricas decorativas)
Responde estritamente às 6 perguntas essenciais:
- **Total Agents:** Quantos agentes existem em inventário? (ex: 12)
- **Governed:** Quantos possuem passaporte emitido e supervisão ativa? (ex: 9)
- **Need Attention:** Quantos demandam intervenção? (ex: 2)
- **Unknown:** Quantos não possuem proprietário ou passaporte? (ex: 1)
- **High Risk:** Quantos se enquadram no Art. 6 do EU AI Act? (ex: 3)
- **Blocked Actions:** Quantas chamadas foram interceptadas pelo Guardian? (ex: 17)
- **HITL Pending:** Quantas aprovações humanas estão na fila? (ex: 2)

#### 4.2 Tabela do Inventário
Exibe:
- **Agent:** Nome, ID técnico e quantidade de ferramentas;
- **Owner:** Nome do responsável e departamento formal;
- **Framework / Model:** Ex: `CrewAI (gpt-4o)`, `LangGraph (gpt-4o-mini)`, `LiteLLM (claude-3-5-sonnet)`;
- **Risk:** `HIGH`, `MEDIUM`, `LOW`, `CRITICAL`;
- **Status:** Estados padronizados: `UNKNOWN`, `DISCOVERED`, `IMPORTED`, `GOVERNED`, `RUNNING`, `PAUSED`, `BLOCKED`, `REVOKED`;
- **Ação:** Botão de navegação `[ Ver Agente → ]`.

#### 4.3 Ações de Abertura (+ Add Agent)
O modal **+ Add Agent** oferece exatamente três caminhos sem confundir o usuário:
1. **BUILD HERE:** Criação nativa de agente com limites de sandbox e perfil de conformidade (conduz ao Agent Studio).
2. **IMPORT:** Importação direta via formulário ou manifesto de configuração existente.
3. **DISCOVER:** Descoberta automatizada em repositório via sensor AST (conduz ao Scanner).

Atalhos inferiores:
`[ Discover Agents ]` • `[ Import Repository ]` • `[ Create Agent ]`

---

### 5. Agent Detail Design (`/agents/:agentId`)

Ao selecionar qualquer agente no inventário, o ComplyPRO abre uma visão dedicada com 5 abas organizadas por divulgação progressiva:

1. **OVERVIEW:**
   - Identidade (Nome, ID, descrição funcional);
   - Responsável (Nome, cargo e esquadra/departamento);
   - Framework e versão de runtime;
   - Modelo de linguagem principal;
   - Status de governança e tier de risco;
   - Data de registro e timestamp da última atividade.

2. **ACCESS ("What can this agent access?"):**
   - **MODELS:** Lista explícita de modelos autorizados pelo Model Gateway (ex: `✓ GPT-4o`, `✓ Azure OpenAI`, `✕ Prohibited Unchecked Models`).
   - **DATA:** Escopos de dados autorizados pelo Data Gateway com classificação de sigilo (ex: `✓ Customer DB [Confidential]`, `✓ Credit History [Financial]`, `✕ Raw Payroll DB [Restricted]`).
   - **TOOLS:** Matriz de ferramentas e permissões com status de enforcement:
     - `✓ customer.read` (ALLOW)
     - `✓ credit.read` (ALLOW)
     - `⚠ credit.approve` (HITL REQUIRED — Alçadas > €10.000)
     - `✕ database.admin` (BLOCKED — Operações DDL proibidas)
   - **NETWORK:** Confirmação do sandbox air-gapped (`✕ Direct Internet Access: BLOCKED`).
   - **SECRETS:** Confirmação de zero injeção direta de tokens (`✕ Direct Secrets: DENIED`).

3. **RISK:**
   - Tier de risco regulatório (EU AI Act Anexo III);
   - Fatores de risco identificados;
   - Classificação de dados em trânsito;
   - Capacidades de alto risco sob custódia;
   - Incógnitas e pontos de atenção (*Unknowns*).

4. **GOVERNANCE:**
   - Perfil de conformidade ativo (ex: `CP-EU-AI-ACT-HIGH-RISK-FINANCIAL`);
   - Passaporte digital com identificador e assinatura criptográfica `HMAC-SHA256`;
   - Status de enforcement contínuo do Guardian;
   - Versão de política aplicada;
   - Regras formais de aprovação humana (HITL).

5. **ACTIVITY:**
   - Histórico em tempo real de execuções;
   - Decisões tomadas pelo Guardian (`ALLOW`, `REQUIRE_HITL`, `BLOCK`);
   - Resoluções de aprovações humanas;
   - Provas imutáveis com hashes criptográficos SHA-256 e conformidade com RFC 8785.

---

### 6. Reposicionamento do Scanner (Scanner Repositioning)

O sensor de repositórios não é o produto final — é a porta de entrada para a descoberta contínua de agentes:
$$\text{REPOSITORY SCAN} \longrightarrow \text{AGENT DETECTED} \longrightarrow \text{IMPORT INTO COMPLYPRO} \longrightarrow \text{GOVERNED INVENTORY}$$

**Implementado:**
- Novo componente [`DiscoveredAgentsBanner`](file:///c:/Users/denio/Documents/Denio/PluginVIbeCOde/standalone-compliance-scanner/src/web/components/DiscoveredAgentsBanner.tsx) que surge imediatamente após qualquer scan bem-sucedido.
- Apresenta cada agente detectado no código (como *LiteLLM Agent*, *Credit Risk Evaluator*, etc.) com frameworks, modelos, ferramentas e riscos.
- Botões de 1 clique:
  - `[ Importar no ComplyPRO ]`
  - `[ Importar Todos para o ComplyPRO ]`
  - `[ Ver no Inventário AI Agents → ]`
- O fluxo termina sempre no inventário de agentes e na sua governança operacional, eliminando a sensação de "relatório estático isolado".

---

### 7. Superfícies de UI Ocultadas / Reorganizadas

Nenhum código foi excluído. As superfícies foram organizadas em camadas contextuais:
- **Barra de navegação:** Reduzida de 25+ itens desordenados para 5 destinos principais claros (`AGENTS`, `DISCOVER`, `GOVERNANCE`, `EVIDENCE`, `SETTINGS`).
- **Cockpit e Studio:** Movidos de botões isolados para atalhos contextuais no cabeçalho do agente e na seção retrátil *"ADVANCED WORKSPACES"*.
- **Controles Técnicos Individuais:** Integrados contextualmente dentro do perfil de cada agente (Aba *Access* e Aba *Governance*).
- **Traduções e Jargão:** Padronização da terminologia com hierarquia clara e remoção de termos contraditórios ou incompletos.

---

### 8. Capacidades de Backend Preservadas (100% Core Intacto)

Todas as seguintes capacidades permanecem íntegras, funcionais e auditadas:
- Scanner estático AST & Conectores de repositório;
- Compliance Compiler & Compliance Contract;
- 12 Controles CG-AG e Perfis Regulatórios;
- Guardian Service & Active Governance Bus;
- Agent Provisioner & Assinatura Criptográfica de Passaportes (HMAC-SHA256);
- Evidence Ledger (RFC 8785) e Merkle Tree Verifier;
- Worker Sandbox isolado (Air-Gapped, Non-Root, Zero Token Leakage);
- Model Gateway, Tool Gateway e Data Gateway;
- Human-in-the-Loop (HITL) com retomada atômica de execução única;
- Persistência durável PostgreSQL (Supabase) e Row Level Security (RLS);
- Autenticação multitenant e isolamento de tenants;
- Servidor MCP Universal (Stdio e SSE).

---

### 9. Testes Antes e Depois (Tests Before / After)

| Etapa | Testes Executados | Resultado |
| :--- | :--- | :--- |
| **Baseline Inicial** | `tsc --noEmit` + 22 suites de teste + `vite build` | ✅ 100% Pass (Zero regressões) |
| **Após Simplificação** | `tsc --noEmit` | ✅ 100% Pass (Zero erros de tipo) |
| **Após Simplificação** | `npm test` (Todas as 22 suites do core) | ✅ 100% Pass (Todos os 230+ asserções passaram) |
| **Após Simplificação** | `npm run build` (Bundle cliente + SSR server + Worker) | ✅ 100% Pass (Build gerado com sucesso) |

---

### 10. Evidência de Rotas & Navegação

- **`/` (ou `/agents`):** Renderiza [`AgentInventoryPageView`](file:///c:/Users/denio/Documents/Denio/PluginVIbeCOde/standalone-compliance-scanner/src/web/views/AgentInventoryPageView.tsx) exibindo o inventário consolidado de agentes da organização, métricas diretas e caminhos rápidos de adição.
- **`/agents/:agentId`:** Renderiza [`AgentDetailView`](file:///c:/Users/denio/Documents/Denio/PluginVIbeCOde/standalone-compliance-scanner/src/web/views/AgentDetailView.tsx) com as abas *Overview*, *Access*, *Risk*, *Governance* e *Activity*.
- **`/discover` (ou `tools-scanner`):** Renderiza o Codebase Scanner conectado com importação direta via [`DiscoveredAgentsBanner`](file:///c:/Users/denio/Documents/Denio/PluginVIbeCOde/standalone-compliance-scanner/src/web/components/DiscoveredAgentsBanner.tsx).
- **`/governance`:** Central de conformidade e matriz de governança.
- **`/evidence`:** Livro-razão e trilha de auditoria.

---

### 11. Débito de UX Restante

1. **Sincronização Bidirecional Backend-Frontend:** Embora o [`AgentInventoryStore`](file:///c:/Users/denio/Documents/Denio/PluginVIbeCOde/standalone-compliance-scanner/src/web/services/agent-inventory-store.ts) persista em `localStorage` e se sincronize com os agentes extraídos de scans, uma sincronização automática via WebSockets com instâncias de runtime distribuídas enriquecerá ainda mais o status de agentes remotos.
2. **Edição Granular de Limites de Ferramentas:** A interface atual permite alternar o status de execução e visualizar restrições; a edição inline de alçadas em euros sem passar pelo Studio poderá ser adicionada num sprint subsequente.

---

### 12. Recomendações de Produto

1. **Manter o Posicionamento "Agent Inventory First":** Qualquer nova funcionalidade adicionada nos próximos sprints deve estar ancorada no Agente como entidade central, e não em painéis isolados.
2. **Promover a Diferenciação Técnica vs LLMs Genéricos:** Continuar destacando que o ComplyPRO não é um assistente de texto, mas uma camada operacional persistente com passaportes criptográficos, contenção em sandbox e livro-razão imutável de evidências.
3. **Avaliar Integrações de Frameworks (NAT / AgentScope) Apenas sob Este Modelo:** Quando frameworks futuros forem incorporados, devem alimentar este mesmo inventário padronizado sem fragmentar a navegação.

---

### Verificação da Métrica de 60 Segundos

> **Pergunta:** *"Se eu sou um cliente novo, consigo entender em menos de 60 segundos quais agentes existem, quem é responsável por eles, o que podem acessar, qual o risco e se estão governados?"*  
>  
> **Resposta:** **SIM.** A nova home lista de imediato os agentes, seus responsáveis, nível de risco e status de governança. Ao clicar em qualquer agente, a aba *Access* detalha exatamente o que o agente pode acessar e sob quais travas.
>  
> **Status do Sprint:** **SPRINT PASSED.**
