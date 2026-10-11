# COMPLYPRO — FINAL PRODUCTION & COMMERCIAL AUDIT

**Data:** 2026-10-06  
**Classificação final:** **C — BLOCKED**  
**Método:** inspeção do working tree, testes adversariais locais, suíte existente, build e verificações HTTP somente de leitura.  
**Objeto auditado:** baseline de UX atual, incluindo as alterações ainda não commitadas.

## Conclusão executiva

Existem implementações reais de compilação de políticas, HMAC de Passport, verificação SHA-256/Merkle, autorização de APIs e integração HTTP com um modelo real. Entretanto, o produto completo ainda não sustenta os claims de produção e demonstração comercial integral.

Bloqueios principais:

1. O domínio publicado responde **HTML da SPA com HTTP 200** nas rotas de API, health e readiness verificadas.
2. Os adapters CrewAI/NAT podem reportar **uma execução com zero chamadas observadas ao provider**.
3. A cadeia de evidências de runtime usa `PersistenceAdapter`, que neste caminho persiste em memória/localStorage, não em PostgreSQL; erros são absorvidos.
4. Discover/importação ainda cria inventário local separado do provisionamento autoritativo; autenticação e leitura da UI não estão integradas consistentemente ao backend de governança.
5. `npm test` terminou com **exit code 1**: uma asserção legada exige `COMPLETED` numa solicitação de outro tenant, enquanto a proteção corrigida retorna `BLOCKED`.

Foram aplicadas correções pontuais a defeitos P0/P1 demonstrados. **27 probes adversariais adicionais passaram**, assim como typecheck, build e um smoke de Discover. Dos 24 scripts originais, **23 passaram e um falhou**. As asserções e os scripts originais não foram alterados.

Este relatório substitui as conclusões de prontidão dos documentos anteriores para o baseline auditado. Não autoriza a frase “PRODUCT FROZEN — READY FOR COMMERCIAL VALIDATION”, pois a condição de parada positiva não foi satisfeita.

---

## 1. Project identity

| Campo | Verificado |
|---|---|
| PROJECT ROOT | `C:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner` |
| Git root | Mesmo diretório, confirmado por `git rev-parse --show-toplevel` |
| Remote | `https://github.com/negraodenio/CompliancePRO.git` — fetch/push |
| Branch | `main` |
| HEAD inicial | `bbf31f5745ab0b009ff622512042465070b51a95` |
| Package | `complypro-ai-scanner@1.0.0` |
| Produto | ComplyPRO — AI Agent Governance |
| Navegação principal | AI Agents · Discover · Evidence · Settings |
| Tese | KNOW · CONTROL · PROVE |
| Posicionamento | Build with your framework. Govern with ComplyPRO. |
| Stack inspecionada | React/Vite/TypeScript, Express, PostgreSQL/Supabase, adapters de runtime |
| Node local observado | `v22.19.0` |
| Projeto Vercel inspecionado, sem alterações | `standalone-compliance-scanner`, framework Vite, root `.`, Node `24.x` |

Todas as alterações deste trabalho estão neste repositório. A aplicação de outro diretório não foi objeto deste audit.

## 2. Baseline test results

Executados antes das correções de implementação:

| Comando | Resultado observado |
|---|---|
| `npm run typecheck` | PASS; nenhuma mensagem de erro TypeScript |
| `npm test` | PASS; execução chegou ao último script NAT |
| `npm run build` | PASS; client, server e worker bundle gerados |

Build inicial: 1.691 módulos client; JavaScript `index-Ik7xxb1h.js`, 1.546,92 kB; server `app.js`, 826,59 kB; worker runner 2,42 kB. Avisos de chunk grande e imports estáticos/dinâmicos coexistentes.

O script `test` contém **24 entrypoints**. A saída usa contagens locais heterogêneas; não existe um contador agregado padronizado que confirme automaticamente a cifra histórica “246”. Este audit não repete essa cifra como medição própria.

Os primeiros probes, ainda antes das correções, reproduziram **3 PASS / 15 FAIL em 18 verificações**. Verificações posteriores expandiram a cobertura para 27 probes. Novos casos foram adicionados após descobertas concretas, e não para substituir a suíte original.

Observações do baseline: erros de FK HTTP 409 em writes assíncronos de fixtures foram logados apesar de a suíte terminar com sucesso. O runner de migrations não aplicou SQL porque `DATABASE_URL` estava ausente.

## 3. Current working tree / proteção do baseline

### PRE-EXISTING USER CHANGES

```text
 M src/web/App.tsx
 M src/web/components/AppShell.tsx
 M src/web/views/AgentDetailView.tsx
 M src/web/views/SettingsView.tsx
?? FINAL-UX-SURFACE-REDUCTION.md
```

Stat inicial: **4 arquivos, 205 inserções, 226 remoções**. Foram lidos os quatro diffs e os relatórios `FINAL-UX-SURFACE-REDUCTION.md` e `PRODUCT-DEMO-READINESS.md` antes de editar implementação.

| Arquivo | Git blob hash inicial | Resultado de preservação |
|---|---|---|
| `src/web/App.tsx` | `7b76151cb7596ef5479015780b1e77ff4c440510` | Idêntico ao baseline do usuário |
| `src/web/components/AppShell.tsx` | `01fff1e2db1ed32a02ec49bbf9c20797ccdaf01e` | Idêntico ao baseline do usuário |
| `src/web/views/SettingsView.tsx` | `dfda54017208d500f2e1b271170b680e9c79c9d2` | Idêntico ao baseline do usuário |
| `FINAL-UX-SURFACE-REDUCTION.md` | `7e809d2286561f09cf40cbc4bd527ce39e8c149e` | Idêntico; mantido não rastreado |
| `src/web/views/AgentDetailView.tsx` | `8991896b0076239f8eb6054b249134016902dcc4` | Alterado pontualmente pelo audit; bloco contextual preservado, simulação de aprovação removida |

### CHANGES MADE BY THIS AUDIT

O diff final contra HEAD inclui as mudanças anteriores do usuário e as correções deste audit. Stat observado: **29 arquivos rastreados, 588 inserções, 510 remoções**. Esse total não inclui os novos arquivos não rastreados.

Dos 29 arquivos, três contêm exclusivamente os diffs já existentes (`App.tsx`, `AppShell.tsx`, `SettingsView.tsx`). `AgentDetailView.tsx` contém ambos os trabalhos. Os outros 25 arquivos rastreados foram alterados pelo audit. A lista de mudanças e justificativas está nas seções 21–22.

Novos arquivos do audit:

- `FINAL-PRODUCTION-COMMERCIAL-AUDIT.md`
- `tests/final-forensic-audit.test.ts`
- `tests/final-forensic-live-readonly.ts`
- `tests/final-forensic-discover-smoke.ts`

`git diff --name-only -- package.json package-lock.json tests` não retornou modificações rastreadas. Não houve commit, push, reset, restore, checkout, deploy, alteração de histórico ou execução de migrations.

## 4. KNOW validation

**Resultado: PARCIAL / bloqueio de integração.**

- `AgentProvisioner` produz identidades e Passports reais; APIs listam registros de seu store com checagem de tenant.
- `AgentInventoryPageView` calcula indicadores a partir de `AgentInventoryStore` e possui empty/loading/error states.
- O catálogo canônico inicial de agentes já estava vazio. Entretanto, `addAgent` fabricava fingerprint, Passport VERIFIED, atividade ALLOW, capabilities e identidade de administrador para registros locais.
- Correção: registros locais sem provisionamento agora não recebem esses recibos e defaults de governança; o default é `IMPORTED`, Passport `NOT_ISSUED`, Guardian `MONITOR_ONLY`, atividade vazia.
- Correção: cache local de inventário passa a usar chave derivada do contexto de tenant/workspace; sincronização de scans exige correspondência com o tenant da ingestão.
- Correção: reimportar o mesmo agente não promove `IMPORTED` para `GOVERNED` sem Passport verificado.
- Permanecem defaults inferidos no mapper de backend e na camada de scan, por exemplo modelo, escopo, profile e owner substitutos. Esses valores não devem ser apresentados como observação de execução ou propriedade verificada.
- Importação e edição de owner locais ainda não constituem confirmação de persistência no provisionador/backend.

Validação: suíte existente `real-agent-inventory.test.ts` PASS (15 casos), probes de reimportação e SSR de Agent Detail PASS. Não foi realizada uma sessão browser autenticada completa no ambiente publicado.

## 5. INSPECT validation

**Resultado: claims falsos corrigidos; dados incompletos continuam visíveis como lacuna.**

No baseline, qualquer agente HIGH apresentava uma transação fixa de €25.000, botão que só alterava estado React, aprovador `OP-SUPERVISOR` e recibo `#ev_9281`. Os fallbacks também inventavam CRM, dados de crédito e quatro eventos de atividade.

Correções em `AgentDetailView`:

- Bloco contextual de review mantido no mesmo lugar.
- Botão encaminha ao controle de runtime existente, sem fabricar aprovação.
- Pause/Resume deixam de alterar apenas o status local e passam a encaminhar para controles existentes.
- Models/tools/data/activity não são preenchidos com exemplos fictícios quando ausentes.
- Ausência de atividade aparece como ausência de dados no registro; não como prova de inexistência de execuções no backend.
- Modelo/Tool sem governança verificada é indicado como `Needs review`/`Declared` em vez de permissão inventada.
- Política fixa de €10.000 e fingerprint substituto foram removidos do detalhe operacional.

O owner, framework e risco ainda dependem da qualidade da projeção de inventário. A chamada `onOpenCockpit(id)` em `App.tsx` não transmite o ID ao estado interno do Cockpit; a navegação contextual completa não foi declarada validada.

Validação: inspeção do diff atual, SSR adversarial sem operações/recibos fictícios, typecheck e build.

## 6. CONTROL validation

**Resultado: enforcement direto de gateways real; runtime integrado incompleto.**

Positivos verificados:

- ToolGateway: capability READ-only não despacha DELETE após correção; zero chamadas ao provider instrumentado.
- DataGateway: tenant declarado pelo caller diferente do Passport resulta em BLOCK antes da query.
- ModelGateway: em produção o dispatcher padrão passa pelo transporte HTTP real; o probe substitui apenas o transporte e conta uma chamada.
- A suíte existente de provider real realizou chamada OpenRouter e recebeu `COMPLYPRO_REAL_MODEL_PROOF`, com 24 prompt tokens e 7 completion tokens na execução final.
- Capabilities/profiles desconhecidos são rejeitados nos caminhos cobertos.

Bloqueio demonstrado, repetido antes e depois das correções:

```json
{
  "crewai_reported_count": 1,
  "crewai_observed_provider_calls": 0,
  "nat_hitl_reported_count": 1,
  "nat_hitl_observed_provider_calls": 0
}
```

`CrewAiRuntimeAdapter.execute` usa `requestCapability`, cujo ALLOW constrói um resultado sem executar provider. O resume CrewAI também constrói um resultado. NAT resume chama `requestTool`, mas pode tratar PAUSED/erro como conclusão e incrementar contador.

Foi corrigido somente o defeito pontual em que status FAILED/unknown capability virava SUCCESS. A integração completa de execução/resume não foi reescrita neste audit. Contador interno não é prova de side effect real.

## 7. HITL validation

**Resultado: defeitos locais corrigidos; garantia end-to-end de produção não provada.**

- ToolGateway e adapters utilizam `DurableStore.claimExecutionSessionConditional`.
- Antes do audit, esse CAS não filtrava tenant. Corrigido tanto em PostgreSQL quanto em PostgREST, com validação do cache local.
- Em produção, CAS sem conexão configurada falha fechado. Esse comportamento anterior foi confirmado por probe, sem substituir por fallback permissivo.
- Em produção, writes PAUSED enfileirados são aguardados antes do CAS para evitar uma gravação atrasada sobrescrever o claim.
- DataGateway permitia dois approvals simultâneos executarem duas queries. Agora faz claim local síncrono antes de qualquer await, revalida pelo Guardian e exige gate/claim/decisão duráveis no caminho de produção.
- ToolGateway revalida HMAC no resume; alteração de declared tools após PAUSE bloqueia provider.
- Approve/reject REST passam a usar o user ID do principal autenticado, e não identidade arbitrária enviada no body.

Validação: probe DATA concorrente passou de duas para uma query; suite ToolGateway PASS; `s8-remediation-security.test.ts` PASS, inclusive revogação/suspensão/duplicidade; restart real existente PASS.

Limitações:

- O teste de claim multi-instance existente instrumenta transporte; não foi feito neste audit um novo race real entre dois hosts de produção.
- SLA/deadline de gates existe na projeção, mas não há verificação consistente de expiração no CAS/resume dos caminhos inspecionados.
- A conclusão durável de todas as operações DATA e a retomada de gateways após cold start ainda necessitam prova completa.
- Os counters dos adapters não provam uma execução externa após approval.

## 8. Passport validation

**Resultado: binding criptográfico verificado; defeito de recuperação corrigido para novas gravações.**

`PassportSigner.buildCanonicalPayload` vincula agent ID, tenant, framework/version, runtime version, profile checksum, policy version, manifest hash, capabilities/channel/risk/requiresHitl, declared tools/models/data scopes, risk tier e status.

Probes confirmaram que alterar identity, tenant, framework/version, checksum, manifest, tools, models, scopes, risk e HITL invalida a assinatura. Comparação utiliza `timingSafeEqual`.

Falhas concretas encontradas:

- Startup do Runtime só checava formato/comprimento da fingerprint. Agora verifica HMAC antes de iniciar worker.
- Persistência perdia `declaredModels`/`declaredDataScopes` e recuperação de runtime hardcodava CrewAI. Nova gravação conserva snapshot do Passport no JSONB `runtime_spec` existente e restaura essas declarações/framework.

Prova de recuperação após correção:

```json
{
  "passport_recovered_models": ["gpt-4o"],
  "passport_recovered_data_scopes": ["customers"],
  "passport_recovered_signature_valid": true
}
```

Não houve alteração de schema ou migration. Rows antigas sem snapshot podem não conter dados suficientes para reconstruir uma assinatura originalmente emitida com essas declarações; não foram reassinadas silenciosamente. Não há campo independente de agent version/expiry no contrato inspecionado além das versões descritas acima.

## 9. Tenant isolation validation

**Resultado: aplicação melhorada e casos negativos reais locais passaram; isolamento completo não certificado.**

- S8-1 confirma acesso autenticado A→A permitido, A→B negado, spoofing de headers/body e approvals de outro tenant negados.
- DataGateway deixava o Passport sobrescrever o tenant do caller no input do Guardian: corrigido.
- Supabase provider removia filtro com `TENANT-DEFAULT` e permitia `params.id` substituir filtro de organização: corrigido.
- Evidence endpoints utilizavam o contexto global do último tenant: corrigidos para caller tenant explícito, inclusive agent ID ausente do store.
- Guardian RPC aceitava context/passport de outro tenant e profile arbitrário no body: agora usa principal e profile registrado.
- Cache local de inventário e overrides do Evidence catalog foram limitados ao contexto correspondente.

Não foi declarada prova completa de troca de organização no browser, de todos os refreshes/caches, de todos os writers que ainda omitem tenant explícito, nem de JWTs de dois tenants distintos contra RLS nativa. A UI Auth e o IdP do Node apresentam contratos de integração diferentes.

## 10. RLS validation

**Resultado: política inspecionada e negação anônima confirmada; autenticados por tenant não comprovados integralmente.**

`002_durable_runtime_and_rls.sql` habilita e força RLS em seis tabelas operacionais. Policies usam `app.current_tenant_id` ou claims JWT top-level `tenant_id`/`organization_id`, com USING e WITH CHECK. `service_role` bypassa RLS por desenho.

Verificação read-only e suíte original:

| Tabela | GET com anon key | Resultado |
|---|---|---|
| agents | HTTP 200 | 0 rows |
| agent_passports | HTTP 200 | 0 rows |
| runtime_instances | HTTP 200 | 0 rows |
| execution_sessions | HTTP 200 | 0 rows |
| hitl_requests | HTTP 200 | 0 rows |
| hitl_decisions | HTTP 200 | 0 rows |

S8-2B executou 38 checks e reportou zero falhas, com fixtures de dois tenants, service role e anon. Contudo, sem `DATABASE_URL`, a fase pg/session variable não rodou; diferenciação anon/service-role não prova por si só a autorização de JWTs autenticados de Tenant A contra Tenant B.

`001_initial_schema.sql` não contém RLS para o catálogo inicial de evidências/governança. `protected_evidence`, `audit_ledger_blocks`, `ai_entities`, `governance_policies` responderam HTTP 404 no probe anon; isso indica ausência de superfície verificável por essa rota/role, não prova de policy aplicada nessas tabelas.

Não foram modificadas policies, grants, schemas ou migrations.

## 11. Worker security validation

**Resultado: perímetros lógicos verificados; isolamento de OS não demonstrado.**

- Ambiente sanitizado fornecido pelos helpers não contém as credenciais verificadas; signing secret não é incluído nesse objeto.
- Métodos `directNetworkCall` e `accessFile` rejeitam as tentativas cobertas, mas estão documentados no código como simulados.
- Watchdogs/timers existem e o teste S8-4 cobre transições timeout/termination.
- `SandboxManager` usa diretórios reais; havia escape de prefixo para sibling directory. A validação foi corrigida com `path.relative`, e o probe registra a tentativa sem escrever fora do sandbox.
- Dockerfile/compose contêm non-root, limites, tmpfs e restrições. Porém RuntimeManager/SandboxManager não lançam efetivamente esse container ou um processo de agente separado neste caminho.
- PID limits são registrados em um Set; não constituem por si só contenção de fork bomb no OS.

S8-4 PASS (36 checks/crucibles) significa cobertura dos helpers e configurações existentes. Não equivale a prova de que código não confiável esteja impedido de chamar `fetch`, sockets, filesystem ou `process.env` no processo do control plane. Não foi acrescentado um novo sandbox/runtime.

## 12. Gateway validation

| Caso | Validação observada |
|---|---|
| Tool READ-only + DELETE | BLOCK; zero chamadas instrumentadas após correção |
| Tool desconhecido | BLOCK antes de dispatch; contrato de mensagem preservado |
| Model não autorizado | Suítes existentes confirmam BLOCK/zero provider calls |
| Model produção, dispatcher default | Probe conta uma chamada HTTP; não usa texto determinístico default |
| Data caller/passport tenants diferentes | BLOCK antes de provider |
| Data unknown profile/checksum malformado | S8 remediation PASS; FAIL CLOSED/zero chamadas |
| Table identifier malicioso | Rejeitado antes de SQL; identifier válido é quoted |
| PostgreSQL desconectado em produção | Fallback de fixtures desabilitado |
| DATA approvals simultâneos | Uma query observada, segunda rejeitada |

Limitações preservadas e reportadas: ToolGateway pode fabricar resultado quando não há adapter; `CompliancePROToolProvider` pode produzir score fixo 94,5 após ausência/falha do remoto; provider vector mock não está isolado automaticamente por deployment. A leitura Supabase usa `organization_id` em tabelas genéricas, e a granularidade de target resource não está completamente ligada ao manifesto. Essas rotas não foram anunciadas como providers reais integralmente validados.

## 13. Evidence validation

**Resultado: hashing/verificação reais; durabilidade de runtime insuficiente.**

- Core `EvidenceLedger` usa SHA-256, previousHash, sequência e Merkle; mutação de entries e provas é detectada pela suíte original.
- Cadeias de tenants independentes existem em memória; endpoints agora consultam caller tenant explicitamente.
- A cadeia core persiste por `PersistenceAdapter.write('evidence_chain', ...)`, cuja implementação deste caminho é localStorage ou Map. Não escreve PostgreSQL.
- `append`, `ensureInitialized`, Guardian finalization e ActiveGovernanceBus têm catch/fallback. Não existe prova de fail-closed durável de toda a evidência em produção.
- A causalidade do verifier é limitada a eventos por agente/capability; o schema não estabelece vínculo completo por execution ID em todos os registros.

Correções do catálogo frontend:

- Fresh tenant não recebe seis records fictícios.
- `verifyRecordIntegrity` recalcula digest e verifica linkage disponível; não retorna mais true incondicional.
- Digest de scan deixa de repetir um hash de 32 bits sob rótulo SHA256 e usa o helper SHA-256 existente.
- SHA-256 universal recebe UTF-8 correto; ledger browser recalcula payloadHash/blockHash e genesis/linkage.
- Toast diferencia falha, match de payload e linkage efetivamente estabelecido.
- Wording passa a tamper-evident/verifiable, sem confundir hashing com storage immutable/WORM.

O catálogo local não foi substituído pelo ledger backend. Conectar ambos de forma durável seria trabalho de integração/persistência adicional; permanece bloqueio P1.

## 14. Discover / Scanner validation

**Resultado: engine ativo, paths mantidos, persistência de importação parcial.**

GitHub, ZIP, pasta e cenários demo continuam ligados a `runLocalScan`. As análises AST/config, riscos, PII, compliance, CI/CD/IaC e capabilities não foram reescritas.

Smoke final independente:

```json
{"fileCount":2,"agents":["agent","CrewAI_agent","MCP_Server_audit"],"riskCount":8,"regulationCount":13}
```

Defeito P1 demonstrado: metadata/tree privados recebiam token, conteúdo raw não. Correção repassa os headers existentes para `raw.githubusercontent.com`; probe de transporte detecta um arquivo privado, antes zero.

`DiscoveredAgentsBanner` oferece Review/Add/Ignore. Importação local mantém `IMPORTED`, não simula Passport emitido, e reimportação não eleva status sem autoridade. Entretanto, o import ainda não grava um novo registro autoritativo no backend/provisionador.

Inicialmente o smoke inline falhou por quoting PowerShell; o primeiro script smoke usou a propriedade errada (`regulations`). Corrigido o próprio probe para o contrato real `applicableRegulations`, sem alterar a engine ou enfraquecer a checagem. GitHub real privado com credencial de usuário, seleção ZIP/FileList e cliques browser não foram executados neste audit.

## 15. Create Agent validation

**Resultado: falsa criação governada removida; jornada publicada ainda bloqueada.**

- O fluxo `Build with ComplyPRO` ignorava `onSelectBuild` e criava um objeto local com GOV/Passport fictício.
- Correção usa o callback já existente e encaminha ao Agent Studio existente, que possui chamadas de provision/start/launch reais.
- `Bring existing agent` continua como registro local/importado para revisão, sem prometer emissão de Passport.
- Provisionador backend valida profile, capabilities, budget e emite HMAC antes do runtime.
- Backend studio API tests PASS, mas APIs da SPA publicada retornam HTML e Studio/Cockpit não anexavam identidade autenticada consistente às chamadas relativas.

Não foram adicionados frameworks, creation modes ou Studio NAT.

## 16. NAT validation

**Resultado: POC funcional; produção integral não demonstrada.**

- `nat-runtime-adapter.ts`, interface comum, verificação de Passport e chamadas de gateways inspecionadas.
- Casos negativos/concorrência da suíte original NAT passaram; o harness upstream Python `nvidia-nat==1.9.0` rodou.
- Declarações assinadas e framework deixam de ser perdidos na nova persistência/recovery.
- Capability desconhecida não gera conclusão bem-sucedida/crash de hash após correção pontual.
- Probe observa resume reportando count 1 com provider count 0. Esse bloqueio permaneceu.
- Middleware Python possui evaluator local/default allow e não verifica HMAC/backend quando não há evaluator externo. Isso prova interception POC, não integração de produção com toda a autoridade do control plane.

NAT não foi expandido nem reposicionado como produto. ComplyPRO permanece o control plane pretendido.

## 17. Production configuration validation

**Segredos:** ausência de signing secret em `NODE_ENV=production` falha fechada; fallback conhecido e legacy mock fingerprints continuam restritos ao caminho não production inspecionado. Não foi alterado o secret real nem feita rotação.

**Autenticação:** fixture API keys antes eram sempre registradas, mesmo em production; agora não são. As chaves configuradas explicitamente pelo mecanismo já existente continuam suportadas.

**Frontend bundle:** o build inicial continha o valor real configurado de `OPENROUTER_API_KEY`, introduzido por `VITE_OPENROUTER_API_KEY` em `.env.local` quando `import.meta.env` era expandido. Valores não foram exibidos. `vite.config.ts` limita a exposição às configurações públicas usadas. A checagem examinou oito nomes de credenciais e comparou os valores presentes na configuração local; nenhum desses valores foi encontrado no bundle final.

**Ambiente publicado:** asset `/assets/index-BpAq8IpC.js` não continha esse mesmo valor configurado. A descoberta no artefato local não foi convertida em afirmação de comprometimento desse asset publicado.

**Configuração restante:** defaults de CORS production usam domínio antigo; Auth UI pode cair em localhost:8000; gateways e Studio usam chamadas relativas sem um contrato comum de auth/base URL. Compose não passa o signing secret exigido. Readiness/airGapped metadata não testa todos os subsistemas reais. Esses pontos são reportados, não remodelados em uma nova arquitetura de deployment.

## 18. Vercel compatibility validation

Probe read-only em `https://www.complypro.pt`:

| Endpoint | HTTP | Content-Type |
|---|---|---|
| `/api/v1/agents` | 200 | text/html; charset=utf-8 |
| `/api/v1/capabilities` | 200 | text/html; charset=utf-8 |
| `/api/v1/auth/me` | 200 | text/html; charset=utf-8 |
| `/health` | 200 | text/html; charset=utf-8 |
| `/ready` | 200 | text/html; charset=utf-8 |

`vercel.json` reescreve todas as rotas para `/index.html`; projeto é Vite. O backend Express e seus stores/timers não são disponibilizados como APIs por essa configuração.

Maps globais de agents/adapters/runtimes, persistência de evidência em processo, filesystem temporário, watchdogs e falta de rehydration no startup são incompatíveis com tratar o processo serverless como store durável ou supervisor permanente.

`createServerApp` não realiza bootstrap durável automático; `AgentProvisioner.listAgents` consulta store de processo. Um teste que chama rehydration explicitamente não prova que o deployment o faz. Não houve criação de functions, proxy/backend novo ou deploy neste audit.

## 19. Commercial claims validation

| Claim | Resultado |
|---|---|
| KNOW · CONTROL · PROVE | Tese mantida; integração completa ainda bloqueada |
| “Build with your framework. Govern with ComplyPRO.” | Posicionamento mantido; demonstrar limites de POC/integração |
| Immutable/immutably logged | Corrigido em copy visível tocada para verifiable/tamper-evident |
| “100% match / VERIFIED” após falha HTTP | Defaults de sucesso do Cockpit/Evidence removidos |
| Agent born governed no modal local | Encaminhamento ao provisionamento existente; sem recibo local fictício |
| Worker separado/air-gapped | Não provado pelo objeto worker; Cockpit não anuncia PID isolado como observado |
| Exactly one execution | Há claims/CAS reais, mas counter de adapter pode ser 1 com provider 0 |
| PostgreSQL Evidence Ledger | Não sustentado pelo caminho core que usa Map/localStorage |
| Full native tenant isolation | Não inferida de anon=0 e service-role bypass |
| Fully compliant/certified | Nenhuma certificação regulatória/acreditada foi comprovada pelo audit; scores/tiers são assessment interno |
| Real-time / production-ready | Não sustentado end-to-end pelo deployment atual |
| Zero secrets / cryptographically secure | Ambiente sanitizado e HMAC comprovados nos limites testados; não garantia universal de isolamento de processo |

Documentos antigos de classificação A foram preservados como histórico; não foram usados como prova nem editados para simular validação atual.

## 20. UX regression / ten-second test

**Navegação:** preservada exatamente, comprovada também por blob hashes de AppShell/App/Settings inalterados desde o baseline do usuário.

| Pergunta | Destino identificado no código |
|---|---|
| Onde estão meus agentes? | AI Agents |
| Como trazer agentes existentes? | Discover |
| Onde ver o que ocorreu? | Evidence |
| Onde configurar? | Settings |
| Onde revisar ação perigosa? | Agent Detail → Review Approvals / controles existentes |

A heurística de encontrabilidade passa na estrutura. Não foi cronometrado um comprador real nem feita certificação de UX com browser/usuários. A falsa aprovação contextual foi substituída por review, não por outro menu/dashboard.

Gap P2 preservado: após scans, handlers de `App.tsx` podem abrir `overview-center` em vez de manter o resultado em Discover; o usuário precisa voltar para Review/Add. Gap P1: o ID contextual do agente não é efetivamente transmitido ao Cockpit e a fila real não é carregada por toda a jornada publicada. São inconsistências de fluxo, não justificativa para redesign automático.

## 21. Findings by severity

Referências nesta tabela nomeiam os componentes/funções auditados. “Existia” significa presente no working tree antes de iniciar o audit, inclusive mudanças intencionais não commitadas. “Corrigido” refere-se ao código/build **local**, não ao deployment publicado.

### Defeitos P0/P1 corrigidos pontualmente

| ID | Severidade | Evidência / componente afetado | Existia | Corrigido | Validação |
|---|---|---|---|---|---|
| F01 | P0 | Chave OpenRouter real no production bundle por expansão Vite env; `vite.config.ts` | Sim | Sim, local | Probe passou de valor presente para zero matches no bundle final; live conhecido não tinha esse valor |
| F02 | P0 | `ApiKeyRegistry.initialize` aceitava fixture keys em production | Sim | Sim | HTTP agents com fixture key: 200 → 401 em production |
| F03 | P0 | `ToolGateway.invokeTool` executava DELETE em capability READ-only | Sim | Sim | ALLOW/provider 1 → BLOCK/provider 0 |
| F04 | P0 | `ToolGateway.resumeExecution` não revalidava HMAC após tampering | Sim | Sim | declaredTools alterado após PAUSE: COMPLETED → BLOCKED, zero calls |
| F05 | P0 | DataGateway usava tenant do Passport em lugar do caller | Sim | Sim | Caller B/Passport A: BLOCK antes de query |
| F06 | P0 | DATA approvals concorrentes produziam duas queries | Sim | Sim no perímetro testado | Dois callers: uma query e um fulfillment; CAS/decisão exigidos no caminho production |
| F07 | P0 | Supabase provider removia tenant filter no default e sobrescrevia org ID | Sim | Sim | Transporte instrumentado confirma filtro também em TENANT-DEFAULT |
| F08 | P0 | `PostgreSqlDataProvider.query` interpolava identifier controlável | Sim | Sim | Identifier injetado rejeitado antes de SQL |
| F09 | P0 | CAS de DurableStore omitindo tenant em cache/SQL/REST | Sim | Sim | Claim de tenant errado negado; inspeção dos dois predicates e suite de claims |
| F10 | P0 | Evidence API consultava cadeia do último contexto global | Sim | Sim | ID ausente do store com entry de B não vaza para auditor A |
| F11 | P0 | Guardian RPC permitia context/passport de B a principal A e escrevia evidência | Sim | Sim | HTTP 403 antes de alterar chain de B |
| F12 | P1 | Guardian RPC confiava no profile enviado pelo caller | Sim | Sim | Profile fake de mesmo checksum ignorado em RPC autenticado; profile registrado usado |
| F13 | P1 | Runtime startup aceitava fingerprint forjada de formato válido | Sim | Sim | HMAC forjado rejeitado antes de worker startup |
| F14 | P1 | Passport recovery perdia modelos/scopes e framework | Sim | Sim para novas gravações | Snapshot JSONB existente; listas recuperadas e assinatura válida; restart suite PASS |
| F15 | P1 | Model dispatcher production retornava conteúdo determinístico sem HTTP | Sim | Sim | Transporte default production contado uma vez; provider real existente PASS |
| F16 | P1 | Agent Detail mostrava approval/op/recibo fixos e operações inexistentes | Sim; receipt do diff recente do usuário | Sim | SSR sem eventos/IDs fictícios; callback de review existente, sem setApproval fake |
| F17 | P1 | AddAgentModal ignorava Build callback e criava GOV/Passport local falso | Sim | Sim no ponto de falsa emissão | Encaminha Studio; drafts sem Passport VERIFIED/fingerprint/atividade fabricados |
| F18 | P1 | Evidence catalog seed de seis records e verify=true incondicional | Sim | Sim | Fresh tenant=0; tampering de payload detectado |
| F19 | P1 | Scan hash era 32-bit repetido; ledger browser não recalculava hashes | Sim | Sim | SHA-256 UTF-8 comparado com node crypto; alteração de bloco invalida verificação |
| F20 | P1 | Cockpit fabricava success, metrics, verification e export após falha HTTP | Sim | Sim nesses fallbacks | Inspeção de callbacks/exports, typecheck/build; exemplos residuais identificados como ilustrativos |
| F21 | P1 | Claims immutable/crypto verification extrapolados | Sim | Sim nas strings tocadas | Diff das strings; storage WORM não foi alegado |
| F22 | P1 | Rescan promovia imported→governed sem provisionar | Sim | Sim | Replay continua IMPORTED/sem Passport VERIFIED |
| F23 | P1 | Unknown capability FAILED virava SUCCESS/crash no adapter | Sim | Sim | CrewAI e NAT retornam falha/count 0 nos probes |
| F24 | P1 | Raw files privados do GitHub não recebiam auth headers | Sim | Sim | Conteúdo de fixture privada: files.size 0 → 1 |
| F25 | P1 | FS sandbox aceitava sibling com prefixo da pasta permitida | Sim | Sim no lexical boundary | Probe com write observado sem I/O externo; path.relative rejeita escape |
| F26 | P1 | `executionRouter` aceitava operator ID arbitrário do body | Sim | Sim | Identidade vem do principal; suíte RBAC/approvals existente PASS |

### Bloqueios e limitações restantes

| ID | Severidade | Evidência / componente afetado | Existia | Corrigido | Validação / motivo de permanência |
|---|---|---|---|---|---|
| F27 | P1 | Vercel SPA rewrite retorna HTML nas APIs/health/ready | Sim | Não | Cinco GETs HTTP 200 text/html, projeto Vite inspecionado; requer integração/deployment, não realizado |
| F28 | P1 | Adapters contam 1 execução com 0 provider calls | Sim | Não, salvo unknown failure | Probe repetido antes/depois e inspeção de execute/resume; integração de runtime não reescrita |
| F29 | P1 | Core EvidenceLedger só grava Map/localStorage e absorve erros | Sim | Não | `EvidenceLedger.append` → `PersistenceAdapter.write`; implementação do adapter não conecta DB nesse caminho |
| F30 | P1 | Provision/cache confirma antes de commit, async writes falham sem invalidar resposta | Sim | Não | `saveAgent/saveRuntime/saveExecutionSession` e catch; HTTP 409 logados na suíte; corrigir todo contrato exigiria trabalho de persistência transversal |
| F31 | P1 | Inventário/import/owner locais não são projeção durável única; auth/base URL UI inconsistente | Sim | Parcial | Receipts/cache/status falsos corrigidos; import ainda não chama provisionador; Studio/Inventory/Cockpit relative fetch/auth inspecionados |
| F32 | P1 | Worker/OS isolation anunciado não é efetivamente lançado pelo runtime | Sim | Parcial apenas lexical FS/copy | Métodos simulados; SandboxManager não spawna processo/container; configurações Docker não equivalem à execução |
| F33 | P1 | Expiry e restart/commit completo de todos os HITL gateways não comprovados | Sim | Parcial CAS/assinatura/DATA local | Deadlines de projeção não checados consistentemente; registry local de gateways e counters não provam exactly-once externo |
| F34 | P1 | Mapper backend inventa alguns modelos/scopes/flags e não liga toda activity/approvals | Sim | Parcial defaults locais | `AgentInventoryStore.fetchFromBackend`, Cockpit sem fila/contexto completo; reportado sem novo read model/API |
| F35 | P1 | Quality gate conflita com exigência explícita de BLOCK cross-tenant | Expectativa já existia; falha exposta pela correção | Não | `end-to-end-governed-agent.test.ts:467` exige COMPLETED; implementação agora BLOCKED; teste/proteção preservados |
| F36 | P1 | Data plane inicial de evidências/RLS não comprovado no ambiente | Sim | Não | SQL 001 sem RLS dessas tabelas; quatro probes anon 404; ausência de prova, não demonstração de vazamento dessas tabelas |
| F37 | P2 | Native authenticated tenant RLS / pg session path não validado | Sim | Não | DATABASE_URL ausente; 38 checks anon/service role não comprovam JWT A→B; não fabricada validação |
| F38 | P2 | Scan metadata substituto e filtros/cache/metrics com semântica incompleta | Sim | Não | Owner/stars/forks/defaults; status/métricas não são garantia de runtime governado; engine não reescrita |
| F39 | P2 | Discover pode redirecionar ao overview avançado após scan | Sim, no baseline de UX | Não | Inspeção de quatro handlers App.tsx; fluxo Review exige retorno a Discover; App preservado |
| F40 | P2 | Chunk grande, timeouts/provider specifics, dead fixtures e dívida de deployment | Sim | Não | Build warnings; timeoutMs não aplicado no HTTP dispatcher; mocks/provider fallback e flags de readiness reportados |
| F41 | P3 | README/comentários preservam nomenclatura legada | Sim | Não | Identidade Git/package/UI confirmam ComplyPRO; rebrand/refactor não realizado |

Limite de classificação: não se declara “nenhum P0/P1 restante” no produto integral. Foram corrigidos os casos pontuais demonstrados e mantidos os bloqueios/transversais documentados. Nenhuma limitação desconhecida foi transformada em alegação de segurança total.

## 22. Changes actually made

- Segurança de build: allowlist de env público no Vite.
- Auth/tenant: isolamento de fixture keys em production, nested tenant/profile Guardian, scope de Evidence APIs, tenant em claims.
- Gateways: validade de actions/tools, assinatura no resume, tenant DATA, CAS DATA, query identifiers e fallback de PostgreSQL production.
- Runtime: HMAC no start, restauração de declarações/framework pelo JSONB existente, estado FAILED não tratado como execução concluída.
- UI/claims: receipts/op IDs/atividade fictícios removidos do detalhe; Build usa o Studio já existente; Cockpit não inventa verificação/approval/export; termos defensáveis de evidência.
- Evidence local: seed default vazio, digest real, verificação de payload/chain, UTF-8 correto e scope do catalog.
- Scanner connector: manutenção de auth nos raw content requests privados.
- FS helper: lexical path boundary para leitura/escrita.
- Verificação: novos probes/coletores/smoke, sem modificar scripts ou asserts originais.

Alterações não representam nova feature, framework, dashboard, navegação, engine, schema, integração externa ou arquitetura de deployment. Os trechos substituídos eram falsos defaults/receipts ou defeitos reproduzidos. APIs e capacidades existentes foram preservadas; exemplos de política que permaneceram no Cockpit passaram a ter rótulo explícito ilustrativo.

## 23. Tests after changes

| Check final | Resultado |
|---|---|
| `npm run typecheck` | **PASS — exit 0**, nenhuma mensagem de erro |
| `npm test` | **FAIL — exit 1**, cross-tenant expectation em `end-to-end-governed-agent.test.ts:467` |
| Entry points originais executados integralmente | **23 PASS / 1 FAIL**; os 11 após o abort foram executados individualmente, todos exit 0 |
| `npx tsx tests/final-forensic-audit.test.ts` | **PASS — 27 passed / 0 failed, exit 0** |
| `npx tsx tests/final-forensic-discover-smoke.ts` | **PASS — exit 0**, 2 files, 3 detecções, 8 riscos, 13 regulations |
| `npx tsx tests/final-forensic-live-readonly.ts` | Coleção read-only concluída; resultados de rotas/RLS registrados nas seções 10/18 |
| `npm run build` | **PASS — exit 0** |

Regressões intermediárias investigadas:

1. Guardian unit test invoca diretamente o handler sem middleware; foi preservado o contrato standalone não production, sem dispensar auth da aplicação ou de production.
2. Tool negative test depende do motivo `not declared`; mensagem de rejeição passou a descrever precisamente a ausência de declaração no registry, sem permitir dispatch.
3. E2E original considera consulta cross-tenant com status COMPLETED/rows vazias um sucesso. Não foi relaxada a rejeição nem modificada a asserção para esconder a divergência.

Não foram removidos/skipped tests, trocados expected results ou reduzidas assertions. Suíte original permanece exatamente igual. Os probes usam providers/transports instrumentados e estados de teste isolados; suas observações de blockers não são rotuladas como PASS de produção.

## 24. Build result

Build final gerou:

| Artefato | Tamanho observado |
|---|---|
| `dist/index.html` | 4,70 kB |
| `dist/assets/index-BujPsOS8.css` | 99,52 kB; gzip 14,53 kB |
| `dist/assets/index-CEN8iarf.js` | 1.532,83 kB; gzip 363,43 kB |
| `dist-server/app.js` | 826,97 kB |
| `dist-server/sandbox/worker-runner.js` | 2,42 kB |

Exit 0 para client + server + worker. Avisos não bloqueantes de chunk grande/imports coexistentes continuam. Novo bundle não contém os valores das credenciais de servidor configuradas verificadas. Esse build **não foi publicado**.

## 25. Remaining risks / limites de validação

- Produto publicado e working tree auditado são versões distintas; nenhum fix local pode ser anunciado como aplicado em produção.
- Integração real do runtime/provider, evidência durável/fail-closed, bootstrap/cold start e auth/read model permanecem requisitos de liberação.
- Operações DATA têm proteção local/CAS adicionada, mas não foi alegada garantia distribuída irrestrita sob crash, timeout e todos os failures de commit.
- Causalidade por execution ID, anchors externos de evidência e imutabilidade de storage não foram demonstrados.
- OS sandbox, rede/FS/process isolation de código não confiável e ciclo containerizado efetivo não foram comprovados pelo runtime atual.
- RLS nativa autenticada de dois tenants, policies do catálogo inicial e configuração externa de production não foram certificadas.
- Não foi feita avaliação jurídica/certificação regulatória, medição de usabilidade com comprador real, nem teste browser E2E autenticado do site.
- Os testes existentes de live DB usam suas próprias fixtures e teardown. Novos probes do audit não escreveram dados no DB de produção; probe externo adicional foi exclusivamente GET/read-only. Migrations não foram aplicadas.
- Assinatura restituída por snapshot foi validada para novas gravações; registros históricos incompletos não receberam assinatura artificial.

## 26. Final recommendation

### C — BLOCKED

Não declarar ComplyPRO production/commercial-demo ready neste baseline. A segurança dos casos corrigidos melhorou, mas compilação e passes de componentes não resolvem os bloqueios de integração/publicação/durabilidade nem a divergência do quality gate.

A condição positiva de parada exige, entre outros itens, zero falhas de testes, nenhum P0/P1 restante, CONTROL com side effect real, PROVE durável e jornada Discover/Create funcionando no ambiente. Esses critérios não estão todos satisfeitos.

Este audit termina com findings, correções pontuais e evidências entregues. A expansão do produto permanece congelada. A próxima liberação precisa demonstrar resolução dos bloqueios identificados antes de sustentar claims de produção, demos integrais ou pilotos; não exige tornar o produto maior.

**Não houve commit, push, deploy ou alteração de Git history.** O working tree foi preservado como baseline, acrescido das mudanças de audit descritas. `git status --short`, `git diff --stat` e `git diff` foram exibidos; os hashes de preservação de UX foram conferidos.
