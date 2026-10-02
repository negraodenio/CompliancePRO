# 🛡️ CodeGuard Compliance Scanner (Standalone Engine)

Motor Enterprise de Descoberta Estática e Análise de Conformidade para Agentes de IA, Modelos Fundacionais, Riscos e Regulações Globais.

---

## 🎯 Visão Geral

O **CodeGuard Compliance Scanner** é uma solução independente capaz de escanear repositórios de código (GitHub, GitLab, Bitbucket, Azure DevOps, Gitea) e infraestrutura para:

1. **Detectar Agentes de IA & Shadow AI**: Identifica automaticamente agentes declarados e não declarados no código.
2. **Classificar Frameworks & Modelos**: Reconhece LangChain, CrewAI, AutoGPT, LlamaIndex, OpenAI Swarm, Semantic Kernel, Haystack, DSPy, MCP e mais de 40 provedores/modelos de LLM.
3. **Mapear Riscos e Linhagem de Dados**: Analisa fluxo de dados, acessos a bancos, segredos expostos, prompts vulneráveis e dados sensíveis (PII).
4. **Avaliar Conformidade com 13 Regulações**:
   - 🇪🇺 **EU AI Act** (Artigos 6, 9, 10, 11, 12, 13, 14, 15, 50, 52)
   - 🇧🇷 **LGPD** (Artigos 6, 7, 11, 14, 18, 37, 38, 46, 48 + Geração de RIPD)
   - 🇪🇺 **GDPR** (Artigos 5, 6, 9, 13, 15, 22, 25, 30, 32, 35)
   - 🇧🇷 **Resolução BCB nº 4.893 / 4.658** (Banco Central do Brasil / Setor Financeiro)
   - 🇧🇷 **RDC ANVISA** (Software como Dispositivo Médico / Saúde)
   - 🇺🇸 **NIST AI RMF 1.0** (Govern, Map, Measure, Manage)
   - 🌐 **ISO/IEC 42001:2023** (Sistema de Gestão de Inteligência Artificial)
   - 🛡️ **OWASP Top 10 for LLMs** (Prompt Injection, Insecure Output, Data Poisoning, etc.)
   - 🏦 **DORA** (Digital Operational Resilience Act - UE)
   - 🔒 **NIS2** (Network and Information Security Directive)
   - 📜 [**CG-AG (CodeGuard Agent Governance Framework)**](./docs/CG_AG_FRAMEWORK_SPECIFICATION.md) — Matriz Completa de 12 Controles de Governança de Agentes de IA
   - 👓 [**Metodologia de Leitura & Lentes Executivas C-Level**](./docs/LENTES_EXECUTIVAS_E_METODOLOGIA_LEITURA.md) — Como o scanner lê cada item e a visão de CISO, DPO, CIO, Board e CFO

---

## 📁 Estrutura da Pasta `standalone-compliance-scanner/`

```
standalone-compliance-scanner/
├── src/
│   ├── index.ts                # Ponto de entrada e exports públicos
│   ├── core/                   # Motores de análise e detecção
│   │   ├── agent-detector.ts   # Detecção de agentes e personas
│   │   ├── framework-detector.ts # LangChain, CrewAI, AutoGPT, etc.
│   │   ├── model-parser.ts     # Parser de chamadas de LLM (GPT-4o, Claude, etc.)
│   │   ├── memory-detector.ts  # Vetores, Redis, Postgres, BufferMemory
│   │   ├── notebook-parser.ts  # Análise de Jupyter Notebooks (.ipynb)
│   │   ├── risk-detector.ts    # Detecção de vulnerabilidades e riscos
│   │   ├── shadow-ai.ts        # Detecção de IA oculta / não aprovada
│   │   ├── violations.ts       # Matriz de violações regulatórias
│   │   ├── compliance.ts       # Avaliador central de conformidade
│   │   ├── classifier.ts       # Classificador de arquitetura
│   │   └── types.ts            # Tipos e interfaces de dados
│   ├── regulations/            # Módulos específicos de regulação
│   │   ├── lgpd.ts             # LGPD & gerador de RIPD
│   │   ├── gdpr.ts             # GDPR & direitos do titular
│   │   ├── bcb-4893.ts         # Regulação Bancária / BCB
│   │   └── anvisa.ts           # Regulação de Saúde / ANVISA
│   ├── connectors/             # Conectores com provedores Git
│   │   ├── github.ts           # GitHub API connector
│   │   ├── gitlab.ts           # GitLab connector
│   │   ├── bitbucket.ts        # Bitbucket connector
│   │   ├── azure-devops.ts     # Azure DevOps connector
│   │   └── gitea.ts            # Gitea & Forgejo connector
│   └── enrichment/             # Mapeamento e inteligência profunda
│       ├── lgpd-pii.ts         # Mapeamento semântico de PII
│       ├── lineage.ts          # Linhagem de ponta a ponta
│       ├── trust-zone.ts       # Zonas de confiança e isolamento
│       └── finops.ts           # Estimativa de custos e tokens
├── package.json
└── README.md
```

---

## 🚀 Como Usar Como Biblioteca

```typescript
import { analyzeSourceCode, evaluateCompliance } from '@codeguard/compliance-scanner';

// 1. Analisar os arquivos do repositório
const sourceAnalysis = await analyzeSourceCode({
  files: [
    { path: 'src/agent.ts', content: 'const agent = new Agent({ ... })' },
    { path: 'src/db.ts', content: 'const users = db.query("SELECT cpf, email FROM users")' }
  ]
});

// 2. Avaliar conformidade regulatória
const complianceReport = evaluateCompliance(sourceAnalysis, {
  regulations: ['EU_AI_ACT', 'LGPD', 'OWASP_LLM', 'CG_AG'],
  domain: 'finance'
});

console.log('Score Geral:', complianceReport.overallScore);
console.log('Violações Detectadas:', complianceReport.violations);
```

---

## 🐳 Containerização & Produção (Sprint 8-3)

O ComplyPRO possui imagem Docker oficial multi-stage, segura e otimizada para produção:

- **Base**: `node:20-alpine` (mínima e auditada)
- **Multi-Stage**: Build isolado no stage `builder`, imagem final enxuta no stage `runner`
- **Segurança**: Usuário não-privilegiado (`USER node`), zero secrets embutidas
- **Probes Nativas**: `HEALTHCHECK` configurado no endpoint `/health`
- **Configuração**: 100% via variáveis de ambiente (`process.env`)

### 1. Build Local da Imagem

```bash
docker build -t complypro-server:latest .
```

### 2. Execução do Container

```bash
docker run -d \
  --name complypro-production \
  -p 3000:3000 \
  -e PORT=3000 \
  -e COMPLYPRO_ENV=production \
  -e COMPLYPRO_API_KEYS="{\"sec_corp_key_001\":{\"tenantId\":\"tenant_corp_alpha\",\"role\":\"compliance_officer\"}}" \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  complypro-server:latest
```

### 3. Execução via Docker Compose

Para orquestração local sem conflito de banco (utilizando Supabase Gerenciado):

```bash
docker compose up -d
docker compose ps
docker compose logs -f complypro-server
```

---

## 🩺 Endpoints de Health & Readiness

| Endpoint | Tipo | Autenticação | Descrição |
| :--- | :--- | :--- | :--- |
| `GET /health` | Liveness | Pública | Verifica disponibilidade do servidor HTTP e timestamp |
| `GET /ready` | Readiness | Pública | Valida prontidão dos subsistemas: Guardian, Gateways, Persistência |
| `GET /guardian/health`| Subsystem | Pública | Retorna integridade da política e cache do Guardian |

*Nota de Segurança*: Nenhum endpoint expõe chaves, tokens, strings de conexão ou dados sensíveis.

---

## 🔄 Estratégia de Migração de Banco de Dados

As migrações SQL são versionadas e idempotentes no diretório `src/server/db/migrations/`:

- `001_initial_schema.sql`: Tabelas fundamentais de governança, evidências e audit log
- `002_durable_runtime_and_rls.sql`: Tabelas de runtime durável (`complypro_agents`, `complypro_runtimes`, `complypro_executions`, `complypro_hitl_gates`) e Row Level Security (RLS) nativa

### Executando Migrações

Via script automatizado:
```bash
npm run db:migrate
```

*Nota*: Se conectado via connection string direta PostgreSQL (`DATABASE_URL`), as migrações são aplicadas sequencialmente em transação segura. No Supabase Cloud com PostgREST, as migrações podem ser aplicadas diretamente via Supabase CLI (`supabase db push`) ou Dashboard SQL Editor. **Nenhum comando DROP destrutivo é permitido em produção.**

---

## 🧪 Suíte de Testes & CI/CD

Pipeline automatizado no GitHub Actions (`.github/workflows/ci.yml`):

1. **Static Analysis & Typecheck**: `npx tsc --noEmit`
2. **Quality & Regression Tests**: `npm test` (18 suítes completas, 284 testes unitários, de integração, container e sandbox)
3. **Production Bundle Build**: `npm run build`
4. **Container Build & Smoke Test**:
   - `docker build` com multi-stage caching
   - Container startup com verificação de `USER node` (non-root)
   - Probes ativas de `/health` e `/ready` com validação de status HTTP 200

---

## 🔒 Containerized Worker Sandbox (Sprint 8-4)

O ComplyPRO implementa uma fronteira formal de isolamento entre o **Control Plane** e os **Worker Runtimes**:

- **Isolamento de Processo & Container**: `Dockerfile.worker` dedicado, base `node:20-alpine`, executando como `USER node` (UID 1001).
- **Zero Secrets**: Ambientes de worker são completamente expurgados de `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` e credenciais de nuvem.
- **Filesystem Efêmero**: Cada sandbox recebe um diretório scratchpad isolado (`/tmp/complypro-sandboxes/<sandboxId>`) com verificação contra path traversal. Arquivos são apagados no encerramento.
- **Limites de Recursos**: CPU, Memória, PID limits (prevenção contra fork bombs) e timeout obrigatório via watchdog timer.
- **Mediação Total via Gateways**: Nenhuma chamada externa é permitida diretamente pelo worker; toda requisição passa pelo Guardian para avaliação de política e emissão de evidência criptográfica.


