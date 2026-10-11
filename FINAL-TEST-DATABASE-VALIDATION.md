# ComplyPRO — Test Database Validation

**Data:** 2026-10-08  
**Resultado:** ACTION REQUIRED — acesso SQL/DDL do banco de teste indisponível.  
**Banco de TESTE confirmado:** `wabfvgyvjeilfirumclf`.  
**Banco de produção bloqueado para esta execução:** `efrmsnvibgrjuaotthrw`.

## Identificação e isolamento

- PASS: `.env.test.local` existe no ROOT autorizado e é ignorado por Git.
- PASS: URL HTTPS aponta ao projeto de TESTE `wabfvgyvjeilfirumclf`, diferente de produção.
- PASS: três credenciais requeridas estão presentes; project ref das keys JWT corresponde ao projeto de teste.
- PASS: GET do schema no projeto de teste retornou HTTP 200.
- Nenhum valor de credential foi impresso. Nenhum endpoint production foi chamado ou escrito neste trabalho.

## Schema antes das migrations

Inspeção real read-only do PostgREST de teste:

| Superfície ComplyPRO | Resultado |
|---|---|
| tenants/workspaces | Não exposta |
| audit_ledger_blocks/protected_evidence | Não exposta |
| agents/agent_passports/runtime_instances | Não exposta |
| execution_sessions | Não exposta |
| hitl_requests/hitl_decisions | Não exposta |
| agents.metadata | Não exposta |
| append_runtime_evidence | Não exposto |
| RLS/índices/constraints ComplyPRO | NOT VALIDATED — requer instalação/catálogo SQL |

Há RPCs do projeto anterior, mas não foi encontrado executor SQL autorizado. Eles não foram alterados ou utilizados para improvisar migrations. A limpeza dos registros anteriores foi informada pelo usuário; nenhum dado de linha foi recuperado ou modificado pelo agente.

## Migrations

**Aplicadas pelo agente: 0.**

As migrations EXISTENTES foram preservadas:

1. `src/server/db/migrations/001_initial_schema.sql`
2. `src/server/db/migrations/002_durable_runtime_and_rls.sql`
3. `src/server/db/migrations/003_runtime_evidence.sql`
4. `src/server/db/migrations/004_agent_discovery_metadata.sql`

O runner existente `npm run db:migrate` exige `DATABASE_URL`. Sem ela retorna success:true/applied:[]; essa resposta não foi usada como migration PASS e o runner não foi executado.

## Blocker exato / ação requerida

**TEST DATABASE MIGRATION ACCESS REQUIRED**

As keys SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY são credenciais REST do projeto, não uma conexão PostgreSQL privilegiada ou Supabase Management API token para DDL.

Para permitir execução pelo agente, adicionar em `.env.test.local` uma `DATABASE_URL` privilegiada pertencente exclusivamente ao projeto **wabfvgyvjeilfirumclf**, ou um token Supabase Management API autorizado para esse projeto. Os valores devem permanecer no arquivo ignorado/ambiente seguro, não no chat. A identidade do alvo será conferida antes de qualquer SQL.

Ação manual possível no projeto correto:

**https://supabase.com/dashboard/project/wabfvgyvjeilfirumclf/sql/new**

Executar somente os quatro arquivos existentes acima em ordem 001 → 002 → 003 → 004, cada arquivo completo, sem rodapés/contagem de linhas copiados do viewer. Não remover tabelas antigas, não criar migrations novas, não alterar policies/SQL dos arquivos. As migrations usam CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS e substituição das próprias functions/policies nomeadas; compatibilidade de objetos existentes deve ser respeitada.

## Comandos exigidos / contagens

| Comando | Status nesta execução |
|---|---|
| npm run typecheck | NOT VALIDATED — não executado após o bloqueio de instalação do schema |
| npm test | NOT VALIDATED — não iniciado; schema necessário ainda não disponível |
| npm run build | NOT VALIDATED — não executado após o bloqueio de instalação do schema |

**Testes executados nesta rodada: 0. PASS: 0. FAIL: 0.** Não são resultados de uma suite concluída. Os PASS históricos do deployment gate não foram contados como reexecução.

Nenhuma assertion, migration, código de produto ou UX foi alterado. Sem commits/push/deploy e sem writes production. Encerrado no blocker de migration access; após disponibilizar acesso/aplicar os quatro SQLs no projeto de teste, verificar o schema/RLS/RPC e executar os três comandos com configuração de teste explicitamente carregada e sem fallback production.
