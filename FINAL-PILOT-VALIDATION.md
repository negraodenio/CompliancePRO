# COMPLYPRO FINAL PILOT VALIDATION

**Data:** 2026-10-09
**PRODUCTION:** https://www.complypro.pt
**Deployment validada:** `dpl_8cucm7gkVM4mJcDkaRCRQ8cAyn91` (commit `6a429dc`, auto-deploy Git integration → Vercel; builder `@vercel/vc-build`, node 24.x, `vercel-rusty-runtime-nodejs-1_51_7`)
**Gates anteriores:** COMMIT & PUSH (`680e422`), PRODUCTION DEPLOYMENT GATE (B), DEMO CONTAMINATION AUDIT (B), MINIMAL TOOL PROVIDER REMEDIATION (24/24 testes), COMMIT & PUSH GATE 2 (`6a429dc`).

## CLASSIFICAÇÃO FINAL: C — BLOCKED (defeito de produção que impede execução)

O control plane, a autenticação, o isolamento multi-tenant e as leituras KNOW/INSPECT/PROVE parciais validam ao vivo. Os fluxos **EXECUTION, HITL e o ciclo completo de runtime** estão **bloqueados por 3 defeitos de produção** (D1–D3) que, pela regra do gate, **não foram corrigidos durante o gate** — apenas reportados, com workarounds padrão HTTP aplicados onde viável.

## Resultado por fase

| Fase | Escopo | Resultado |
|---|---|---|
| 1. Setup/identidades | 2 tenants piloto (A = `587ec7ca-4a0d-489d-a1ad-3e77b0a8a039`, B = `db36935e-08e5-4618-b60c-e517d8e69294`), CISO+owner | **PASS** |
| 2. Auth | signup/login/login-refresh, Bearer + `x-organization-id`, 401 anônimo em `/agents` e `/auth/me` | **PASS** |
| 3. Isolamento | listagens tenant-scoped (A: 8 agents, B: 1 agent); B → runtime de A = **403 `CROSS_TENANT_ACCESS_DENIED`**; GETs cross-tenant = 404/403 | **PASS** |
| 4. KNOW/INSPECT | agents (lista+detalhe), runtimes (lista+detalhe), capabilities (13), compliance-profiles (3), tools/catalog, models/catalog, data/catalog — todos 200 autenticados | **PASS** |
| 5. Runtime lifecycle | 1º start → **200 RUNNING** (10:07:32, via workaround urlencoded); stop → estado STOPPED mas HTTP 500; restart → **FAILED**; start-retry ×3 → 500 | **PARTIAL/BLOQUEADO (D2)** |
| 6. EXECUTION | `executions/launch` exige `task.targetCapability`+`task.actionType` aninhados → impossível via workaround (D1); `executions/:id` 404 honesto | **NOT VALIDATED (D1)** |
| 7. HITL | nenhuma execução PAUSED real (não fabricada) → approve/reject sem-alvo real | **NOT VALIDATED (D1/D3)** |
| 8. CONTROL | guardian/health 200; `guardian/evaluate` alcançou a app (400 `UNKNOWN_COMPLIANCE_PROFILE` honesto); demo-live → 503 `PROVIDER_CONFIGURATION_MISSING` (fail-closed correto); tools/invoke → 500 timeout (D2) | **PARTIAL** |
| 9. PROVE | evidence/:agentId → 500 timeout (D2); `agents/metrics` → 503 `SERVER_AUTHORITY_UNAVAILABLE` (D4); execuções/evidências com leitura durable afetadas por D2 | **PARTIAL** |
| 10. DISCOVER | nenhum repositório autorizado ao executor | **NOT VALIDATED** |
| 11. Limpeza | harnesses, identidades, segredos e artefatos temporários removidos; git intocado (`6a429dc` == `origin/main`) | **PASS** |

## Defeitos de produção (não corrigidos no gate, conforme regra)

### D1 — BLOQUEANTE RAIZ: corpo JSON objeto → 503 pré-Express
- `POST /api/v1/*` com `Content-Type: application/json` e **objeto JSON com ≥1 chave** → **503 `{"ok":false,"error":"SERVER_CONFIGURATION_UNAVAILABLE"}`** em ~0.23–0.29s, **antes da auth**, sem headers Express → origem no `catch` de `api/server.ts:31` (leitura provável: `req.body !== undefined`, linha 29).
- **Matriz empírica:** `{}` · `[]` · `[{}]` · string raiz · sem corpo · GET · `text/plain` · `application/json-patch+json` · `application/vnd.api+json` · `application/x-www-form-urlencoded` → **passam** (chegam à app). `application/JSON` (case-insensitive) e `; charset=utf-8` → 503. BOM UTF-8 → 503. `/health` e `/ready` com corpo → 200 (retornam antes da linha 29).
- **Reprodução local** (harnesses com `NODE_ENV=production`, handler real de `api/server.ts`): **todos os corpos funcionam** → código saudável; defeito do ambiente Vercel/rusty-runtime ou da interação com `req.body`. WAF, hash de instância, rotação e regra por token **descartados**.
- **Impacto:** toda rota que exige objeto aninhado está inacessível: `executions/launch` (task aninhado obrigatório), `agents/provision` (framework aninhado), `agents/import`, `guardian/evaluate`, payloads de passport.
- **Workaround validado (padrão HTTP, sem código):** `application/x-www-form-urlencoded` com campos **planos** → rusty parseia com querystring (brackets/dots NÃO aninham). Usado com sucesso em `runtimes/start`.

### D2 — BLOQUEANTE OPERACIONAL: timeout abortivo (~1.0–1.5s) em escritas/leituras durable
- **500 `{"ok":false,"error":"The operation was aborted due to timeout"}`** reproduzível em: `runtimes/stop`, `runtimes/start` (após stop), `tools/invoke` (3/3), `evidence/:agentId`.
- A mensagem **não existe em `src/`**; `AbortSignal.timeout` em src são 10s/15s/30s (nenhum ≤1.5s). O erro é **cacheado** em `EvidenceLedger.durableErrors` (`src/core/evidence-ledger.ts:174`) e re-thrown instantaneamente em chamadas seguintes.
- Sequência real: **1º start funcionou** (10:07:32, RUNNING) → stop/restart falharam → `rt_a2f5f393` (agt_a2f5f393) ficou **FAILED/stuck**; start-from-FAILED também 500. Origem exata do sinal de aborto não determinada sem logs.
- **Impacto:** ciclo runtime parcialmente degradado, `tools/invoke` (caminho de execução governada) inoperante, leitura de evidência inoperante.

### D3 — FAIL-CLOSED POR DESIGN (correto): demo-live sem providers reais
- `executions/demo-live` → 503 `PROVIDER_CONFIGURATION_MISSING`: `crm.read_customer`→salesforce-mcp-server, `credit_bureau_query`→schufa-experian-gateway, `credit.approve`→core-banking-system — **nenhum registrado**; apenas `compliancepro-api` em `ToolGateway` (`src/core/tool-gateway.ts:128`).
- Verificado ao vivo pós-remediação. Fail-closed correto; **sem providers reais não há fluxo HITL real**.

### D4 — Observação: `GET /agents/metrics` → 503 `SERVER_AUTHORITY_UNAVAILABLE`
- A app responde com erro honesto; métricas indisponíveis na produção atual.

## Evidências positivas (ao vivo, produção real)

- **Auth:** 401 anônimo; tokens renovados via `POST /api/v1/auth/login`; `/auth/me` 200.
- **Isolamento:** B → runtime de A = 403 `CROSS_TENANT_ACCESS_DENIED` com UUIDs corretos; listagens separadas por tenant.
- **Fail-closed:** demo-live 503 com código de erro específico; `guardian/evaluate` 400 honesto; execução inexistente = 404 honesto.
- **Infra:** build do commit `6a429dc` confirmado no log do deployment (mesmo builder/node/runtime layer dos deploys anteriores — infraestrutura idêntica).
- **Catálogo/estado:** capabilities, profiles, catálogos de tools/models/data e detalhe de agent/runtime todos 200 autenticados.

## Restrições cumpridas

- Nenhum commit/push/deploy manual; nenhuma migration/RLS/schema/auth alterada; nenhum usuário além dos 2 piloto; nenhuma execução/HITL fabricada; nenhum teste skipado para simular PASS; nenhum teste fixture gravado em produção (artefatos de teste deixados: agents `agt_scan_1ed7844a60cfee0c3ea6f346`, `agt_scan_81626e6cfaa410c84a8e1434`, `agt_scan_5d0f1eee025b88372b289625`, `agt_a2f5f393`; runtime `rt_a2f5f393` = FAILED/stuck). Credenciais, tokens e arquivos `pilot-identities.json`/`pilot-secrets.json` **deletados**; nenhum artefato com credenciais permanece em `%TEMP%\opencode`.
- Git: `HEAD = origin/main = 6a429dc`, árvore apenas com untracked preexistentes documentados (`FINAL-*.md`, `COMPLYPRO-TEST-MIGRATIONS.sql`, 4 artefatos de teste em `tests/`). Harnesses de diagnóstico `tests/_repro-start.ts` e `tests/_repro-handler.ts` **removidos**.

## Recomendações pós-gate (NÃO executadas neste gate)

1. **D1:** não executar leitura de `req.body` antes do Express no wrapper Vercel (`api/server.ts:29`), ou tornar o catch defensivo; validar com a matriz de corpos acima em produção.
2. **D2:** obter logs do runtime para determinar o `AbortSignal`/fetch que aborta em ~1.5s; investigar estado stuck de `rt_a2f5f393`; limpar `durableErrors` entre requests.
3. **D3:** registar providers reais (Salesforce/Schufa/core-banking) ou declarar o fluxo demo-live fora do piloto.
4. **D4:** investigar `SERVER_AUTHORITY_UNAVAILABLE` em `agents/metrics`.
5. **DISCOVER:** fornecer repositório autorizado para validar a fase.

**STOP.**
