# ComplyPRO — Final Production & Commercial Remediation

**Data:** 2026-10-06  
**Produto:** ComplyPRO — AI Agent Governance · KNOW · CONTROL · PROVE  
**Classificação final:** **C — BLOCKED**  
**Resultado local:** typecheck/build aprovados, 24 suites originais aprovadas e 70 checks adicionais aprovados.  
**ROOT:** `C:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner`  
**Remote / branch / HEAD:** `negraodenio/CompliancePRO` · `main` · `bbf31f5745ab0b009ff622512042465070b51a95`.

As correções dos contratos locais foram implementadas e verificadas. O ambiente publicado continua bloqueado por routing/configuração/persistência não implantados, e os limites de runtime da auditoria anterior continuam relevantes. PASS local não significa correção publicada nem isolamento de OS comprovado.

## 1. Original blockers

Referência: `FINAL-PRODUCTION-COMMERCIAL-AUDIT.md`, conclusões executivas e findings F27–F35.

| ID | Severidade | Bloqueio original | Status final | Resultado comprovado |
|---|---|---|---|---|
| B1 | P1 | Quality gate exigia COMPLETED para tentativa cross-tenant | **FIXED** | BLOCK/BLOCKED, provider 0, dados 0, sessão de outro tenant indisponível; suite aprovada |
| B2 | P1 | API, health e readiness publicados retornavam HTML da SPA | **REQUIRES INFRASTRUCTURE** | Adapter/rewrite e JSON corretos localmente; domínio ainda retorna HTML |
| B3 | P1 | CrewAI/NAT contabilizavam execução sem provider | **FIXED** | Counters e conclusão dependem de retorno confirmado do gateway; ausências/falhas não concluem |
| B4 | P1 | EvidenceLedger de runtime somente em memória/localStorage | **REQUIRES INFRASTRUCTURE** | Caminho durável implementado no DurableStore existente; SQL/ambiente real ainda precisam ser aplicados e validados |
| B5 | P1 | Discover/import/owner e auth não compartilhavam autoridade backend | **REQUIRES INFRASTRUCTURE** | Jornada HTTP autenticada/persistida comprovada com transporte local; publicação, metadata SQL e configuração real pendentes |

Os status de infraestrutura são deliberados: o código local foi corrigido, mas o bloqueio original no produto publicado não foi encerrado. Nenhum desses cinco casos foi descartado como `NOT A REAL DEFECT`.

## 2. Root cause

- **B1:** uma asserção antiga tratava leitura estrangeira COMPLETED com array vazio como isolamento suficiente. A implementação corrigida rejeita a tentativa antes de consultar o provider.
- **B2:** `vercel.json` encaminhava tudo a `index.html`; o bundle Express existente não tinha entrypoint Vercel. Readiness também não verificava dependências duráveis.
- **B3:** os adapters usavam autorização lógica de `requestCapability` e resultados sintetizados como prova de execução. Resume podia combinar claims de dois níveis e contabilizar uma chamada sem confirmação. Um stop também podia sobrescrever FAILED com conclusão baseada em um modelo anterior.
- **B4:** `EvidenceLedger.append` chamava o PersistenceAdapter de apresentação. Erros podiam ser absorvidos, e não havia append autoritativo/hash-chain CAS nem barreira antes/depois dos side effects.
- **B5:** o inventário local e os scans ingeridos eram usados como fonte de registros; import/owner não eram persistidos na tabela operacional. O auth Supabase do frontend e o auth do servidor Node tinham contratos distintos; fetches relativos omitiam identidade/organização.

## 3. Evidence

### Execução e isolamento

- E2E confirma primeiro uma leitura do próprio tenant; a tentativa estrangeira subsequente retorna BLOCKED/BLOCK, providerCallCount 0 e zero registros.
- Observações dos probes anteriores, agora: **CrewAI reported 1 / observed provider 1** e **NAT HITL reported 1 / observed provider 1**.
- Ambos os adapters: provider ausente/falhando não gera TOOL_EXECUTION/AGENT_EXECUTION_COMPLETED nem incremento bem-sucedido; duas aprovações concorrentes produzem uma execução e um fulfillment.
- Uma resposta MODEL anterior não transforma uma execução TOOL posteriormente FAILED em COMPLETED ao parar a sessão.
- Em modo production, revogação no banco bloqueia mesmo um Passport ainda válido no cache. MODEL/TOOL retornam BLOCKED com zero dispatch nessa situação.

### Persistência e auth

- Os 23 checks de `production-authority-remediation.test.ts` exercitam os métodos reais do DurableStore/PostgREST/RPC, Express, Supabase auth e gateways contra **um servidor HTTP local controlado**.
- Import confirmado após POST persistido e GET autoritativo; reimport usa o mesmo ID, owner PATCH persiste, métricas incluem importados, sessão JWT/membership impõe tenant/RBAC.
- Novo processo Node, memória vazia, recupera inventário e MODEL_RESPONSE pelo transporte de banco existente.
- Cadeia com 1.005 entries exige duas páginas; preparação concorrente não duplica loads; adulteração invalida a cadeia.
- Falha de persistence impede o próximo dispatch; readiness não anuncia sucesso. Falha de leitura de inventário limpa o estado frontend anterior.
- O transporte local não executa SQL PostgreSQL. Portanto não prova aplicação, grants ou comportamento real da migration 003.

### Publicação verificada

`https://www.complypro.pt` continua devolvendo HTTP 200 `text/html; charset=utf-8` nos cinco endpoints da seção 7. Nenhuma correção local foi apresentada como publicada.

## 4. Fix

### B1 — teste cross-tenant

`tests/end-to-end-governed-agent.test.ts`: a expectativa passa a BLOCKED; adicionados verdict BLOCK, provider 0 e acesso à sessão limitado ao tenant. A proteção do gateway foi mantida.

### B2 — health, readiness e routing

- `src/server/health.ts`: `/health` é liveness; `/ready` production valida signing secret, saúde das filas duráveis, leitura da tabela e disponibilidade/permissão do append RPC.
- Readiness tem `scope: control-plane`, gateways provider-specific e HTTP 503/not_ready quando a autoridade não está disponível. Não afirma readiness de containers, processos de agentes ou todos os serviços externos.
- `api/server.ts`: adapter do Express existente, paths governados explícitos, tratamento de body já parseado pelo SDK, nenhuma escuta permanente sob Vercel.
- `vercel.json`: regras de health/ready/API antes da SPA; auth aponta ao FastAPI já existente no Render.
- `src/server/app.ts`: CORS para complypro.pt/www, X-Organization-Id/PATCH, preparação durável e resposta segura para falhas async das rotas novas.
- `tsconfig.json` inclui `api/` na verificação de tipos.

### B3 — confirmação de execução

- `src/core/adapters/governed-tool-execution.ts` reutiliza o ToolGateway existente; CrewAI/NAT chamam a interceptação real. Gateway é o dono do CAS HITL.
- toolExecutionCount incrementa somente em COMPLETED/ALLOW com providerCallCount 1. FAILED/BLOCKED e pedidos ainda não respondidos não são promovidos por stop.
- Tool provider ausente/falhando retorna falha; scanner provider faz HTTP autenticado e não fabrica score/scanId após falha. Credenciais com organização incompatível são rejeitadas.
- Model dispatcher padrão é HTTP fora de test; valida conteúdo/usage e registra calls. PostgreSQL/vector fixtures e conclusões dos helpers lógicos ficam limitados a test.
- `DurableStore.requireExecutionAuthority`: antes do dispatch production, lê Passport/runtime atuais com filtro de tenant, verifica relacionamento/status/assinatura; não usa autorização stale do processo.
- DATA production exige recurso nos scopes selados. Ausência de provider/resposta inválida não produz sucesso.
- APIs de provision/start/stop e sessões aguardam as gravações exigidas antes da confirmação.

### B4 — evidence durável

- A mesma EvidenceLedger continua calculando SHA-256/Merkle. `audit_ledger_blocks`, workspace `WS-RUNTIME`, é seu backing durável por `DurableStore.loadRuntimeEvidence/appendRuntimeEvidence`.
- `003_runtime_evidence.sql`: append transacional, lock advisory por tenant, idempotência, sequência/previousHash CAS, grants ao service_role e RLS de leitura. Reutiliza a tabela da migration 001.
- Production prepara/verifica a cadeia, serializa writes por tenant e exige flush antes do provider e antes da confirmação. Erros não voltam à memória como sucesso; APIs de evidência recarregam a autoridade.
- `executionId` é ligado às novas requests/responses e recibos de sessão; o hash mantém compatibilidade com entries anteriores sem esse campo.
- Production reset limpa cache sem apagar dados duráveis; carregamento paginado evita assumir o limite inicial do PostgREST como cadeia completa.
- Nenhum SQL foi aplicado neste trabalho.

### B5 — Discover → Inventory autenticado

- `authenticateTokenOrKey` valida JWT no Supabase `/auth/v1/user` e membership em `organization_members`; principal/user/tenant/roles vêm dessa autoridade.
- Import usa tenant do principal, ID determinístico e persistência em `agents`; default IMPORTED, sem Passport/runtime emitidos. Reimport não promove governança.
- `004_agent_discovery_metadata.sql` adiciona JSONB para owner/model/tool/source/risk declarados; é necessária porque esses atributos não tinham slot durável na tabela operacional.
- GET/list/detail/metrics/owner PATCH compartilham registros autoritativos. Passport VERIFIED é projeção de verificação HMAC real, não simples presença de objeto. Status arbitrário não é promovido por owner PATCH.
- `AgentInventoryStore`: import/update async, confirmação backend, sem ingestão automática de drafts/caches como inventário; protege troca de organização contra respostas atrasadas.
- `governance-fetch.ts` anexa Bearer/org somente a APIs governadas same-origin e preserva Request/init headers.
- Banner/modal aguardam confirmação e liberam estado de submit após erros. Import single/all compartilham a mesma identidade de discovery.
- Layout/nav/design congelados não foram remodelados.

## 5. Tests added/changed

| Arquivo | Mudança / justificativa |
|---|---|
| `tests/end-to-end-governed-agent.test.ts` | Corrige expectativa insegura de COMPLETED cross-tenant e fortalece provider/state assertions |
| `tests/real-agent-inventory.test.ts` | Import/update passam por HTTP autenticado async; atribuir owner não emite Passport nem status GOVERNED |
| `tests/s8-4-worker-sandbox.test.ts` | DATA/MODEL usam seus gateways; asserts contam query/dispatch, em vez de autorização pelo tool adapter |
| `tests/s8-3-container-audit.test.ts` | Processo production compilado sem banco deve health 200 e readiness JSON 503, não readiness fictício 200 |
| `tests/bootstrap-provider-fixtures.ts` | Providers explícitos exclusivamente NODE_ENV=test; nenhuma fixture instalada no runtime production |
| `tests/run-governance-suites.mjs` | Mesmos 24 entrypoints originais, mesma ordem, subprocessos test e resumo de exit codes; nenhum skip |
| `tests/blocker-remediation.test.ts` | 20 checks: execução, falhas, stop, concorrência HITL, barriers, cache recovery, import/tenant/health |
| `tests/production-authority-remediation.test.ts` | 23 checks de contratos production com transporte HTTP local, incluindo processo independente |
| `tests/final-forensic-audit.test.ts` | Mantém os 27 probes de segurança, atualizados para import async e dependências duráveis explícitas |
| `tests/final-forensic-live-readonly.ts` | GETs publicados/anon e inspeção read-only do OpenAPI; imprime somente status/presença, nunca credentials/rows |

O runner test usa fixtures claramente identificadas. O score 94.5/scan_fixture que aparece em logs antigos pertence à fixture do teste, não à implementação do scanner real. Testes live originais mantêm suas fixtures/teardown próprios.

## 6. Regression validation

- **24/24 suites originais PASS**, inclusive security/RBAC, assinatura/revogação, CAS, tenant isolation, model/tool/data, restart operacional, inventory e harness Python NAT 1.9.0.
- **70 checks adicionais PASS:** 20 remediation + 23 production contract + 27 forensic.
- Probes continuam negando assinatura adulterada, READ→DELETE, profile/model/scope desconhecido, tenant spoofing, data approvals duplicados, IDs estrangeiros e FS sibling escape.
- Bundle gerado não contém os valores das credenciais de servidor configuradas verificadas; hashing UTF-8/chain/tampering e private GitHub auth continuam aprovados.
- Discover smoke: **2 files, 3 detecções, 8 riscos, 13 regulações**.
- `git diff --check` passou após remover um whitespace introduzido nesta remediação.

### UX congelada — hashes conferidos

Todos idênticos aos hashes registrados no início desta remediação:

| Arquivo | Git blob hash |
|---|---|
| `src/web/App.tsx` | `7b76151cb7596ef5479015780b1e77ff4c440510` |
| `src/web/components/AppShell.tsx` | `01fff1e2db1ed32a02ec49bbf9c20797ccdaf01e` |
| `src/web/views/AgentInventoryPageView.tsx` | `f170d72c2efa400d1b7d3203c1306b9ddd072e5a` |
| `src/web/views/AgentDetailView.tsx` | `4e83b8bd1ebe755aa0f183357057a01f1a744cc7` |
| `src/web/views/ProtectedEvidenceView.tsx` | `4e72ccc827c3951f85bc1f63decd79db2066b915` |
| `src/web/views/SettingsView.tsx` | `dfda54017208d500f2e1b271170b680e9c79c9d2` |
| `src/web/context/RoleLensContext.tsx` | `d0089984c4f9722bff3011da86563f29c35545d9` |
| `src/web/context/IndustryContext.tsx` | `57eb531f0198377e6275dcced80f1d7564befc98` |
| `FINAL-UX-SURFACE-REDUCTION.md` | `7e809d2286561f09cf40cbc4bd527ce39e8c149e` |

As alterações de AppShell/Views visíveis em `git diff` contra HEAD são baseline pré-remediação. Os callbacks de import e o transporte foram corrigidos sem mudar JSX/layout dessas views.

## 7. Production validation

### Domínio publicado — somente leitura

| Endpoint | HTTP | Content-Type | Avaliação |
|---|---|---|---|
| `/api/v1/agents` | 200 | text/html | Não é resposta de inventário |
| `/api/v1/capabilities` | 200 | text/html | Não é resposta da API |
| `/api/v1/auth/me` | 200 | text/html | Jornada de auth não validada |
| `/health` | 200 | text/html | Não é liveness do servidor |
| `/ready` | 200 | text/html | Não é readiness do servidor |

Asset publicado: `/assets/index-BpAq8IpC.js`; HTTP 200, sem o valor OpenRouter específico da configuração local. É distinto do bundle novo local.

### Vercel — metadata de configuração

Projeto `standalone-compliance-scanner`, ID `prj_QnuJqFCMQIaOPLGQmUVoV1QtImKY`, org `team_jX0CYN2Rp0Y2MTiaSiUakKEJ`. `vercel env ls production` listou as oito variáveis anteriores: VITE_API_URL, VITE_SUPABASE_URL/ANON_KEY, SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY, OPENROUTER_API_KEY e VITE_SILICONFLOW_API_KEY.

**COMPLYPRO_PASSPORT_SECRET e seus aliases não foram listados.** Nenhuma variável foi criada, puxada/decriptada ou alterada. Uma publicação deste código precisa do signing secret válido para habilitar APIs governadas; health continua independente e readiness falha fechado.

### Banco configurado localmente — limite de atribuição

- OpenAPI via service-role: HTTP 200; `append_runtime_evidence`, `audit_ledger_blocks` e `agents.metadata` não estão expostos nessa configuração inspecionada.
- Anon: seis tabelas operacionais HTTP 200/zero rows; quatro tabelas iniciais de governance/evidence HTTP 404.
- O URL Supabase literal local **não foi encontrado no asset publicado**. Não foi confirmada equivalência entre a configuração local e o banco do backend publicado. Ausência no OpenAPI não foi transformada em afirmação de que o SQL inexiste em todo ambiente.
- Portanto as novas migrations não são declaradas aplicadas em production e native authenticated RLS de dois tenants não é declarado provado.

### Compatibilidade operacional

O adapter Vercel suporta os endpoints HTTP do control plane; a prova local inclui GET/POST e request body pré-parseado. Vercel não passa a supervisionar workers permanentes por receber esse adapter. Routing/persistence/auth requerem publicação e verificação no ambiente alvo.

## 8. Remaining limitations

| Severidade | Status | Limitação real / condição pendente |
|---|---|---|
| P1 | **REQUIRES INFRASTRUCTURE** | Domínio ainda usa publicação SPA anterior; JSON de API/health/readiness não está no ambiente publicado |
| P1 | **REQUIRES INFRASTRUCTURE** | Signing secret válido e alinhamento de Supabase/auth/organization_members no backend alvo não foram configurados/verificados |
| P1 | **REQUIRES INFRASTRUCTURE** | Aplicar/validar 003/004 após verificar 001/002 no banco correto; provar append/reload/restart reais com os grants/RLS do deployment |
| P1 | **NOT FIXED** | F32: runtime ainda não demonstra container/processo de agente não confiável realmente lançado e isolado de OS; configuração/helpers não equivalem a essa prova |
| P1 | **NOT FIXED** | F33: deadlines/expiry e recuperação completa de todos os gateways HITL, crash após side effect e garantia distribuída irrestrita não foram demonstrados |
| P1 | **NOT FIXED** | Catálogo browser de Evidence e o contexto/fila completos do Cockpit continuam limitados pelo baseline congelado; catálogo local não equivale à cadeia runtime durável |
| P2 | **NOT FIXED** | Sessão browser autenticada real, alternância de dois usuários/organizações e RLS native JWT do ambiente alvo não foram executadas com contas reais |
| P2 | **NOT FIXED** | Warns de chunks/imports e metadata declarativa/inferida residual não representam prova de execução, identidade do owner ou certificação regulatória |
| P3 | **NOT FIXED** | README/comentários legados, scripts auxiliares e código de apresentação não utilizado permanecem dívida fora dos cinco contratos remediados |

Outros limites relevantes:

- Fixtures antigas ainda geram HTTP 409 de FK em writes async não production (`rt_tampered_test`, `PASS-S8-4-ALPHA`), mesmo com exit 0. Não foram apresentados como confirmação durável. Caminhos production tocados aguardam persistência e falham fechado.
- Um conflito de append CAS ou perda de autoridade bloqueia o tenant/processo antes do side effect; não é substituído por retry permissivo ou memória. Disponibilidade/recuperação distribuída requer validação operacional.
- Providers financeiros/scanner externos precisam de adapters/credenciais reais já suportados/configurados. Não foram criadas integrações novas; provider ausente falha.
- Rows históricas sem snapshot/scopes suficientes não recebem assinatura ou permissões inventadas. DATA production exige scope selado.
- Testes de configuração Docker/non-root e chamadas de helpers não certificam isolamento físico. O harness NAT continua um POC de interceptação.

## 9. Final test result

| Comando / check | Resultado final |
|---|---|
| `npm run typecheck` | **PASS — exit 0** |
| `npm run build` | **PASS — exit 0**, client + server + worker |
| `npm test` | **PASS — exit 0**, **24 PASS / 0 FAIL** |
| `npx tsx tests/blocker-remediation.test.ts` | **PASS — exit 0**, 20 checks |
| `npx tsx tests/production-authority-remediation.test.ts` | **PASS — exit 0**, 23 checks com transporte local controlado |
| `npx tsx tests/final-forensic-audit.test.ts` | **PASS — exit 0**, 27/0; reexecutado sobre o bundle novo |
| `npx tsx tests/final-forensic-discover-smoke.ts` | **PASS — exit 0** |
| `npx tsx tests/final-forensic-live-readonly.ts` | Coleção read-only concluída; findings de produção ainda bloqueantes |
| `git diff --check` | **PASS**, sem whitespace errors |
| Hashes de UX | **9/9 idênticos** |

Build local: 1.692 módulos client; `dist/assets/index-DATjV-mh.js` 1.535,00 kB (gzip 364,01 kB), CSS 99,52 kB; `dist-server/app.js` 832,79 kB; worker 2,42 kB. Warnings não bloqueantes permanecem.

Prova adicional da suite original: OpenRouter retornou `COMPLYPRO_REAL_MODEL_PROOF`, 24 prompt/7 completion tokens; restart operacional existente recuperou entidades em outro processo; 38 checks anon/service-role RLS passaram. Esses testes não provam o novo SQL de runtime evidence nem JWT tenant RLS real.

Log do runner final: `C:\Users\denio\.local\share\opencode\tool-output\tool_11279c42c0018WU1vXcYu7Ehm0`.

## 10. Final recommendation

### C — BLOCKED

A divergência do quality gate foi resolvida e os contratos locais de execução, authority, evidence, import/auth e health/readiness passaram nos limites descritos. O produto publicado ainda não atende à condição **READY FOR COMMERCIAL VALIDATION**: publicação/configuração/migrations são pendências P1, e não foi estabelecida ausência de todos os P0/P1 no produto integral.

Próxima validação operacional, com autorização específica: confirmar o backend/banco corretos e suas migrations/grants, configurar o signing secret, publicar routing/server e repetir os checks JSON/tenant/persistence com contas reais. A liberação integral também depende de resolver os limites de runtime/HITL acima; essas exigências não foram convertidas em features novas nesta remediação.

`git status --short`, `git diff --stat`, `git diff` e hashes foram revisados. O diff contra HEAD inclui o baseline anterior. Mudanças e arquivos novos continuam no working tree para revisão.

**Sem commit, push, deploy, reset, restore, checkout, alteração de Git history ou aplicação de SQL.** A remediação encerra com evidências e limites explícitos, mantendo a superfície de UX congelada.
