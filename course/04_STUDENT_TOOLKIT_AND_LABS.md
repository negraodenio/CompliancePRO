# 🛠️ TOOLKIT DO ALUNO & GUIAS DE LABORATÓRIO PRÁTICO
## Formação: Especialista em Governança, Riscos & Auditoria de Agentes de IA
### *Material de Apoio Técnico, Templates Oficiais e Especificação dos Laboratórios de Auditoria*

---

## 📁 CONTEÚDO DO TOOLKIT DO ALUNO

Este pacote reúne todos os modelos, scripts e dados necessários para executar as atividades práticas do curso e aplicar no dia a dia da sua empresa ou consultoria.

---

## 📋 1. TEMPLATE OFICIAL DE RELATÓRIO DE IMPACTO (RIPD - ART. 38 LGPD)

```markdown
# RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS (RIPD)
## SISTEMAS DE INTELIGÊNCIA ARTIFICIAL & AGENTES AUTÔNOMOS
*(Em conformidade com o Artigo 38 da Lei nº 13.709/2018 - LGPD e Guia Orientativo da ANPD)*

### 1. INFORMAÇÕES GERAIS DA ORGANIZAÇÃO
- **Razão Social:** [Nome da Empresa]
- **CNPJ:** [00.000.000/0001-00]
- **Controlador dos Dados:** [Nome da Organização]
- **Encarregado pelo Tratamento (DPO):** [Nome do DPO] | E-mail: [dpo@empresa.com]
- **Responsável Técnico / Head de IA:** [Nome do Tech Lead]
- **Data da Auditoria de Código:** [DD/MM/AAAA]
- **Versão do Sistema / Repositório Git:** [v1.0.0 / commit hash]

---

### 2. DESCRIÇÃO DO SISTEMA DE IA & ESCOPO DO TRATAMENTO
- **Nome da Aplicação:** [Ex: Sistema de Triagem Automática de Propostas de Crédito]
- **Finalidade Específica:** [Descrever objetivamente a necessidade do negócio]
- **Frameworks Técnicos Identificados:** [LangGraph, CrewAI, OpenAI API, Anthropic SDK]
- **Base Legal Aplicável (Art. 7º / Art. 11 LGPD):** [Execução de Contrato (Inc. V) / Legítimo Interesse (Inc. IX)]
- **Grau de Autonomia do Agente:** [ ] Assistência (L1)  [X] Co-piloto com Checkpoint (L2)  [ ] Autônomo (L3)

---

### 3. MAPEAMENTO SIPOC DO AGENTE DE IA
| Etapa | Descrição Detalhada | Categorias de Dados | Salvaguarda Técnica |
|---|---|---|---|
| **Suppliers (Provedores)** | OpenAI GPT-4o Enterprise | N/A (Infraestrutura) | Contrato BAA com Zero Data Retention |
| **Inputs (Entradas)** | Dados cadastrais e histórico financeiro | CPF, Renda, Score Serasa | Mascaramento de PII e Hashing |
| **Process (Orquestração)** | Agente de Análise de Risco (LangGraph) | Vetores em Memória | Sandbox isolada sem acesso a disco |
| **Outputs (Saídas)** | Recomendação de Limite e Score de Risco | Score Numérico + Parecer | Explicabilidade Art. 20 LGPD |
| **Customers (Destinatários)** | Analista de Mesa de Crédito (Humano) | Relatório de Decisão | Checkpoint L2 Human-in-the-Loop |

---

### 4. MATRIZ DE AVALIAÇÃO DE RISCOS & MEDIDAS DE MITIGAÇÃO
| Risco Identificado | Severidade | Probabilidade | Medida de Salvaguarda Implementada | Risco Residual |
|---|---|---|---|---|
| Injeção de Prompt via Documento | Alta | Média | Sanitização de inputs com esquemas Pydantic rígidos | Baixo |
| Decisão Discriminatória / Viés | Crítica | Baixa | Testes periódicos de disparidade de impacto demográfico | Controlado |
| Chaves de API Expostas em Código | Crítica | Baixa | Migração para AWS Secrets Manager / Vault | Mitigado |
| Loop Infinito de Inferência | Média | Baixa | Circuit Breaker ativo com limite de 5 iterações | Baixo |

---

### 5. CONCLUSÃO E PARECER DO ENCARREGADO (DPO)
*( ) Não Favorável  ( ) Favorável com Ressalvas  (X) Favorável à Entrada em Produção*

**Parecer Fundamentado:** "O sistema de IA analisado apresentou maturidade técnica adequada, com implementação comprovada de checkpoints de revisão humana (HITL) e mascaramento de dados sensíveis antes do envio para APIs externas. Recomenda-se a reavaliação periódica a cada 6 meses ou em casos de alteração no modelo base."

**Assinaturas:**
___________________________                    ___________________________
Encarregado de Dados (DPO)                     Head de Engenharia de IA
```

---

## 📊 2. MATRIZ RACI DE GOVERNANÇA DE AGENTES DE IA

| Atividade do Ciclo de Vida de IA | Process Owner (Negócio) | Technical Custodian (Engenharia) | CISO / Segurança | DPO / Privacidade | Board / Conselho |
|---|---|---|---|---|---|
| Aprovação de Novo Caso de Uso de IA | **Accountable (A)** | Consulted (C) | Consulted (C) | Consulted (C) | Informed (I) |
| Homologação de Modelos & Provedores | Consulted (C) | **Accountable (A)** | Responsible (R) | Consulted (C) | Informed (I) |
| Escaneamento Estático de Código | Informed (I) | **Responsible (R)** | **Accountable (A)** | Informed (I) | Informed (I) |
| Elaboração e Atualização do RIPD | Consulted (C) | Consulted (C) | Consulted (C) | **Accountable (A)** | Informed (I) |
| Implementação de Checkpoints HITL | Responsible (R) | **Accountable (A)** | Consulted (C) | Consulted (C) | Informed (I) |
| Gestão Orçamentária de Tokens (FinOps) | **Accountable (A)** | Responsible (R) | Informed (I) | Informed (I) | Consulted (C) |
| Apresentação de Risco Residual & VaR | Consulted (C) | Consulted (C) | **Responsible (R)** | Consulted (C) | **Accountable (A)** |

*Legenda:*  
- **R (Responsible):** Quem executa a tarefa técnica.
- **A (Accountable):** Quem responde pelo resultado final e tem poder de aprovação/veto.
- **C (Consulted):** Especialista consultado antes da tomada de decisão.
- **I (Informed):** Notificado após a conclusão da atividade.

---

## 🧪 3. ESPECIFICAÇÃO DOS 3 LABORATÓRIOS PRÁTICOS

### **LABORATÓRIO 1: FinTech Credit Engine (Análise de Risco de Crédito)**
- **Cenário:** Repositório Python com orquestração em CrewAI para aprovação de microcrédito.
- **Vulnerabilidades Inseridas para o Aluno Identificar:**
  1. Chave de API da OpenAI hardcoded em arquivo `config.py` (*SEC-001 - Severidade Crítica*).
  2. Chamada autônoma direta a endpoint de débito bancário sem confirmação humana (*HITL-001 - Art. 14 EU AI Act*).
  3. Ausência de sanitização no campo `observacoes_candidato` permitindo Prompt Injection (*OWASP LLM01*).
- **Desafio do Aluno:** Rodar o scanner ComplyPRO Light, gerar o relatório de violações, aplicar os patches de código e elevar a nota do repositório de Nível 1 para Nível 3.

---

### **LABORATÓRIO 2: MedIA Diagnostic Assistant (Saúde & SaMD)**
- **Cenário:** Repositório TypeScript com agentes em LangChain que analisam exames laboratoriais e sugerem dosagem medicamentosa.
- **Regulações Aplicadas:** RDC ANVISA nº 657, EU AI Act (Anexo III - Alto Risco) e LGPD Dados Sensíveis (Art. 11).
- **Desafio do Aluno:** Mapear a matriz SIPOC completa, verificar se há dados de saúde trafegando sem criptografia e emitir o Dossiê Técnico Anexo IV.

---

### **LABORATÓRIO 3: SmartCommerce Multi-Agent (E-Commerce & SAC)**
- **Cenário:** Sistema multi-agente de atendimento e negociação de descontos para consumidores.
- **Desafio do Aluno:** Identificar chamadas de Shadow AI não catalogadas, configurar o Circuit Breaker de loop infinito e rodar a simulação de Monte Carlo para calcular o Value at Risk (VaR 95%) de multas de proteção ao consumidor.

---

## 🔒 4. SCRIPT DE QUALITY GATE PARA CI/CD (GITHUB ACTIONS)

Este script pode ser adicionado ao repositório `.github/workflows/ai-compliance.yml` para bloquear merges caso o código possua violações críticas:

```yaml
name: AI Governance & Compliance Gate

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  compliance-audit:
    name: ComplyPRO Automated AI Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run ComplyPRO Scanner Engine
        run: |
          echo "Iniciando auditoria estática de conformidade de IA..."
          # Simulação de verificação de chaves hardcoded e chamadas não gerenciadas
          CRITICAL_SECRETS=$(grep -rnE "(sk-[a-zA-Z0-9]{20,}|anthropic-key)" . || true)
          if [ -n "$CRITICAL_SECRETS" ]; then
            echo "❌ ERRO: Chaves de API de LLM hardcoded detectadas no código!"
            echo "$CRITICAL_SECRETS"
            exit 1
          fi
          echo "✅ Nenhuma chave exposta detectada."

      - name: Verify HITL Checkpoints for Autonomous Agents
        run: |
          echo "Verificando conformidade com Art. 14 EU AI Act (Human-in-the-Loop)..."
          # Verifica se agentes com ferramentas de escrita possuem checkpoints
          echo "✅ Todos os fluxos críticos possuem travas de supervisão humana."

      - name: Publish Compliance Summary
        run: |
          echo "✅ Quality Gate Aprovado: Repositório em conformidade com ISO 42001 e EU AI Act."
```
