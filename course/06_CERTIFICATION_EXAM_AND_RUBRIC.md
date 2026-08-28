# 🎓 EXAME OFICIAL DE CERTIFICAÇÃO & RUBRICA DE AVALIAÇÃO
## Certificação: Certified AI Governance & Agentic Auditor (AIGOV™)
### *Formação: Especialista em Governança, Riscos & Auditoria de Agentes de IA*

---

## 🎯 1. ESTRUTURAÇÃO DO EXAME DE CERTIFICAÇÃO

Para receber o título e o selo digital de **Certified AI Governance & Agentic Auditor (AIGOV™)**, o candidato deve atender a dois requisitos complementares:

1. **Exame Teórico-Prático Online:** Obter pontuação mínima de **80% (16 de 20 questões)** no exame de múltipla escolha com cenários reais.
2. **Submissão do Projeto Prático de Auditoria:** Auditar um dos repositórios-desafio com o software ComplyPRO Light e submeter o **Parecer 360°** e o **RIPD Oficial**, alcançando nota mínima de **80/100** na Rubrica de Avaliação.

---

## 📝 2. BANCO DE QUESTÕES DO EXAME (AMOSTRA DE 5 QUESTÕES COM GABARITO)

### **Questão 1 (EU AI Act - Classificação)**
**Enunciado:** Uma empresa de recrutamento desenvolveu um agente em CrewAI que analisa currículos e perfis do LinkedIn para ranquear candidatos e descartar automaticamente os 50% piores antes de qualquer triagem humana. Conforme o EU AI Act, qual é a classificação correta desse sistema?
- [ ] A) Risco Mínimo, pois apenas lê currículos públicos.
- [ ] B) Risco Limitado (Art. 50), exigindo apenas aviso de uso de IA no site.
- [X] **C) Alto Risco Mandatório (Anexo III, Item 4 - Emprego e Gestão de Trabalhadores), exigindo Dossiê Técnico, logs e supervisão humana (Art. 14).**
- [ ] D) Risco Inaceitável (Proibido), sendo vedada sua implementação em qualquer hipótese.
*Justificativa:* O Anexo III, ponto 4 do EU AI Act classifica expressamente sistemas de IA utilizados para recrutamento, triagem e seleção de trabalhadores como sistemas de Alto Risco.

---

### **Questão 2 (LGPD - Human-in-the-Loop)**
**Enunciado:** Um cliente bancário teve seu limite de cartão de crédito reduzido para zero por um agente autônomo e solicitou a revisão da decisão com base no Artigo 20 da LGPD. Qual a obrigação técnica da instituição?
- [ ] A) Informar que o algoritmo é proprietário e protegido por segredo industrial, negando qualquer explicação.
- [X] **B) Fornecer informações claras sobre os critérios e procedimentos utilizados, garantindo o direito à revisão por pessoa natural quando solicitado.**
- [ ] C) Executar um novo prompt na LLM e enviar o log bruto em formato JSON ao titular.
- [ ] D) A LGPD não prevê direito de revisão para decisões tomadas por modelos de deep learning.
*Justificativa:* O Art. 20 da LGPD assegura ao titular o direito de solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais.

---

### **Questão 3 (Segurança - OWASP LLM01)**
**Enunciado:** Durante uma auditoria de código com o ComplyPRO Light, o auditor identificou a seguinte linha em um agente de suporte: `query = f"SELECT * FROM clientes WHERE historico LIKE '%{user_input}%'"`. Qual a vulnerabilidade presente?
- [ ] A) Risco de violação de copyright do modelo.
- [ ] B) Erro de concorrência de threads.
- [X] **C) Vulnerabilidade crítica de Injeção Direta combinada com Insecure Output Handling, permitindo vazamento de base de dados.**
- [ ] D) Conformidade total com a norma ISO/IEC 42001.
*Justificativa:* A concatenação direta de entrada não tratada do usuário (`user_input`) em comandos e prompts gera vetor direto de injeção e manipulação de banco de dados.

---

### **Questão 4 (FinOps & Resiliência)**
**Enunciado:** O que caracteriza a implementação de um *Circuit Breaker* em um sistema multi-agente?
- [ ] A) Um componente que aumenta o número de chamadas de API em caso de erro.
- [X] **B) Uma trava de software que interrompe a execução e previne custos descontrolados quando um agente entra em loop infinito de raciocínio ou atinge o teto de tokens.**
- [ ] C) Um modelo de deep learning treinado especificamente para gerar termos de uso.
- [ ] D) Uma cláusula contratual de isenção de responsabilidade.
*Justificativa:* Circuit Breakers atuam como disjuntores de software para cortar execuções desgovernadas e proteger o orçamento e a infraestrutura.

---

### **Questão 5 (Métricas - Simulação Monte Carlo)**
**Enunciado:** Em uma apresentação para o Conselho de Administração, o CISO informou que o *Value at Risk (VaR 95%)* de conformidade de IA do projeto é de € 1.200.000. O que esse valor significa tecnicamente?
- [ ] A) Que a empresa certamente pagará € 1.200.000 em multas no próximo mês.
- [X] **B) Que, em 95% dos cenários estocásticos simulados, o impacto financeiro máximo de sanções e passivos regulatórios não ultrapassará € 1.200.000.**
- [ ] C) Que o custo de desenvolvimento do modelo foi de € 1.200.000.
- [ ] D) Que o faturamento da empresa sofrerá um desconto fixo de € 1.200.000.
*Justificativa:* O VaR a 95% de confiança representa a perda financeira máxima esperada sob condições normais de probabilidade, excluindo os 5% de cauda extrema (Expected Shortfall).

---

## 📊 3. RUBRICA DE AVALIAÇÃO DO PROJETO PRÁTICO (100 PONTOS)

| Critério de Avaliação | Peso | Excelente (90-100%) | Adequado (70-89%) | Insuficiente (<70%) |
|---|---|---|---|---|
| **1. Precisão no Escaneamento & Diagnóstico** | 25 pts | Identificou 100% das violações críticas (chaves, Shadow AI e falta de HITL). | Identificou a maioria das violações, deixando escapar falhas secundárias. | Não identificou vulnerabilidades críticas no código. |
| **2. Mapeamento SIPOC & RACI** | 25 pts | SIPOC completo com dados, fornecedores e clientes bem delineados; papéis RACI claros. | SIPOC genérico ou matriz RACI incompleta. | Ausência de mapeamento de fluxo de agentes. |
| **3. Qualidade Técnica do RIPD (LGPD)** | 25 pts | RIPD completo com bases legais sólidas, análise de necessidade e medidas de mitigação. | RIPD com preenchimento básico e poucas salvaguardas. | Documento incompleto ou sem embasamento regulatório. |
| **4. Parecer Executivo & Simulação Monte Carlo** | 25 pts | Relatório claro para C-Level com cálculo de VaR 95%, ROI de remediação e plano de ação. | Relatório excessivamente técnico sem métricas financeiras. | Ausência de recomendações práticas para o Conselho. |

---

## 📜 4. MODELO DO CERTIFICADO DIGITAL DE CONCLUSÃO

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                            COMPLYPRO ACADEMY                                 │
│                                                                              │
│                       CERTIFICADO DE CONCLUSÃO                               │
│                                                                              │
│   Certificamos que                                                           │
│                                                                              │
│                           [NOME DO ALUNO]                                    │
│                                                                              │
│   concluiu com êxito a Formação Executiva Avançada em                        │
│   GOVERNANÇA, RISCOS & AUDITORIA DE AGENTES DE IA (40 Horas)                 │
│   e cumpriu todos os requisitos técnicos de auditoria de código,             │
│   simulação estocástica e adequação ao EU AI Act, LGPD e ISO/IEC 42001,      │
│   sendo diplomado com a credencial profissional:                             │
│                                                                              │
│              CERTIFIED AI GOVERNANCE & AGENTIC AUDITOR (AIGOV™)              │
│                                                                              │
│   Credencial nº: AIGOV-2026-[HASH]           Data de Emissão: [DD/MM/AAAA]    │
│   Verificação de Autenticidade: complypro.pt/verify/[HASH]                   │
│                                                                              │
│   ___________________________              ___________________________       │
│   Diretor Acadêmico ComplyPRO              Head de Governança e Auditoria    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```


---

### ❓ Questão 11: Invariante de Autorização em Agentes de IA
**Pergunta:** Durante um scan estático, o auditor identifica que um agente possui a ferramenta `@tool` `delete_customer_records` e executa comandos SQL `DELETE FROM customers`. No entanto, nenhum arquivo de IAM Policy ou SQL Grant foi encontrado no repositório. Qual deve ser a classificação formal dessa capacidade no AI Passport?

- A) `AUTHORIZED_CAPABILITY`, pois a ferramenta foi explicitamente declarada pelo desenvolvedor com o decorador `@tool`.
- B) `AUTHORIZED_CAPABILITY`, pois o agente pertence ao processo SIPOC de Gestão de Clientes.
- C) `OBSERVED_CAPABILITY` com estado de autorização `UNKNOWN_AUTHORIZATION`, gerando anomalia de `OBSERVED_BUT_UNAUTHORIZED` e exigindo portão HITL. *(CORRETA)*
- D) A capacidade deve ser ignorada pelo scanner, pois não possui grant oficial.

**Justificativa:** A regra canônica de governança estabelece que `OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY`. Nem a declaração do código nem a participação em um processo de negócio SIPOC constituem autorização formal. Somente evidências explícitas (DB Grant, IAM, OAuth) podem conceder o status de autorizada.
