# 🎓 PLANO DE ENSINO & MATRIZ CURRICULAR (SYLLABUS)
## Formação Executiva: Especialista em Governança, Riscos & Auditoria de Agentes de IA
### *Da Análise de Código à Sala do Conselho — Com 6 Meses de Acesso à Plataforma ComplyPRO (Light)*

---

## 1. DADOS GERAIS DO CURSO

- **Carga Horária Total:** 40 horas (24h videoaulas + 16h laboratórios práticos e projeto final).
- **Modalidade:** 100% Online Assíncrono com Aulas em Vídeo (Gravação com Avatar Executivo) + Laboratórios Hands-On no Software ComplyPRO.
- **Ferramenta Oficial do Aluno:** 6 meses de acesso irrestrito à versão standalone da plataforma ComplyPRO (Scanner de 13 Regulações, Detecção de Shadow AI, Inventário SIPOC, Matriz RACI, Simulação Monte Carlo e Gerador de RIPD).
- **Público-Alvo:** CISOs, DPOs, CIOs, Heads de IA/ML, Engenheiros de Software, Tech Leads, Consultores de Compliance, Auditores de TI e Advogados de Direito Digital.
- **Certificação Emitida:** *Certified AI Governance & Agentic Auditor (AIGOV™)* com credencial digital verificável e selo de conformidade.

---

## 2. ESTRUTURA DOS MÓDULOS E OBJETIVOS DE APRENDIZAGEM

### **MÓDULO 1: O Tabuleiro Regulatório Global da IA (6 Horas)**
**Competência Desenvolvida:** Capacidade de classificar qualquer sistema ou agente de IA nas 13 principais regulações globais e calcular a exposição inicial a riscos jurídicos.

- **Aula 1.1:** O Fim do "Faroeste da IA" — O novo imperativo de governança corporativa e conformidade legal.
- **Aula 1.2:** **EU AI Act Decodificado:** Classificação de Risco (Inaceitável, Alto Risco - Anexo III, Risco Limitado - Art. 50 e Risco Mínimo). Penalidades de até €35M / 7% do faturamento.
- **Aula 1.3:** **LGPD & GDPR em Modelos Generativos:** Artigo 38 da LGPD, Princípio da Prestação de Contas, Finalidade e o Relatório de Impacto à Proteção de Dados (RIPD).
- **Aula 1.4:** **ISO/IEC 42001 & NIST AI RMF:** Implementando o Sistema de Gestão de IA (SGA) e os 4 pilares do NIST (*Govern, Map, Measure, Manage*).
- **Aula 1.5:** **Regulações Setoriais Críticas:** Resolução BCB nº 4.893 (Setor Financeiro), RDC ANVISA nº 657 (Saúde & SaMD), DORA, NIS2 e PCI-DSS v4.0.

---

### **MÓDULO 2: Anatomia, Shadow AI & Vetores de Ataque em Agentes (6 Horas)**
**Competência Desenvolvida:** Capacidade de dissecar arquiteturas de agentes autônomos (CrewAI, LangChain, LangGraph, Swarm) e identificar vulnerabilidades e Shadow AI em código.

- **Aula 2.1:** De LLMs Isoladas a Agentes Autônomos: Entendendo a anatomia de ferramentas (*tools*), memória de longo prazo e loops de decisão.
- **Aula 2.2:** **Shadow AI na Prática:** Como desenvolvedores e equipes de produto conectam APIs de IA sem governança de TI e como rastrear essas chamadas.
- **Aula 2.3:** **OWASP Top 10 para LLMs & Agentes:** Injeção de Prompt Direta e Indireta (LLM01), Exfiltração de Dados (LLM02), Alucinações Induzidas e Execução Insegura de Código.
- **Aula 2.4:** **Model Context Protocol (MCP) & Permissões de Ferramentas:** Como auditar endpoints e evitar que agentes executem ações destrutivas em bancos de dados e APIs externas.
- **Aula 2.5:** **CG-AG Agentic Governance Lifecycle & Agent Passport:** O ciclo fechado de governança (*Define ➔ Build ➔ Govern ➔ Observe ➔ Respond ➔ Improve*), o princípio central *"Every Agent Action Must Be Governable and Evidenced"* e a emissão do crachá formal de governança do agente (*Agent Governance Passport*).

---

### **MÓDULO 3: Laboratório Prático com a Plataforma ComplyPRO (Light) (8 Horas)**
**Competência Desenvolvida:** Domínio da ferramenta de auditoria de código para escanear repositórios, gerar o inventário SIPOC, emitir passaportes e rodar o assessment Agentic Light de 10 dimensões.

- **Aula 3.1:** Ativação e Configuração da sua Licença de 6 Meses do ComplyPRO Light.
- **Aula 3.2:** **Escaneamento de Repositórios:** Auditoria 100% Client-side via URL do GitHub, upload de `.zip` ou pastas locais sem envio de código para servidores externos.
- **Aula 3.3:** **Mapeamento SIPOC de Agentes:** Rastreando Fornecedores (*Suppliers*), Entradas de Prompt (*Inputs*), Processos de Inferência (*Process*), Saídas de Decisão (*Outputs*) e Clientes/Sistemas Impactados (*Customers*).
- **Aula 3.4:** **Matriz RACI de IA:** Atribuindo o *Process Owner* (Negócio) e o *Technical Custodian* (Engenharia) para cada agente em produção.
- **Aula 3.5:** **CG-AG Agentic Light (10 Dimensões):** Execução do diagnóstico rápido de governança agentic produzindo o *Agentic Governance Score* (🟢 Governed, 🟡 Attention, 🔴 Exposure), análise de gaps e passaportes digitais.

---

### **MÓDULO 7: Governança em Tempo de Execução, Circuit Breakers & FinOps (6 Horas)**
**Competência Desenvolvida:** Capacidade de implementar defesas ativas, supervisão humana obrigatória (*Human-in-the-Loop*) e controle orçamentário de tokens.

- **Aula 4.1:** **Human-in-the-Loop (HITL) Obrigatório:** Quando a lei proíbe decisões 100% autônomas (Crédito, Recrutamento, Diagnóstico Médico) e como implementar a trava L2.
- **Aula 4.2:** **Circuit Breakers de Loops Infinitos:** Protegendo a infraestrutura contra agentes presos em raciocínio recursivo e estouro de memória.
- **Aula 4.3:** **FinOps de Tokens e Gestão de Custos:** Alocação de budget por squad, estratégias de Cache Semântico e substituição de LLMs caras por Small Language Models (SLMs).
- **Aula 4.4:** **Quality Gates de Governança em CI/CD:** Bloqueando merges no GitHub Actions e GitLab CI quando houver violações de conformidade.

---

### **MÓDULO 7: Métricas Executivas, Simulação Monte Carlo & Lentes C-Level (8 Horas)**
**Competência Desenvolvida:** Traduzir achados técnicos de código em impacto financeiro e relatórios estratégicos para o Conselho de Administração, CISO, CIO, DPO e CFO.

- **Aula 5.1:** Falando a Língua dos C-Levels: As 5 Lentes Executivas de Governança.
- **Aula 5.2:** **Simulação Estocástica de Monte Carlo (10.000 Cenários):** Como calcular o *Value at Risk (VaR a 95% de confiança)* e o *Expected Shortfall (CVaR)* de penalidades regulatórias.
- **Aula 5.3:** **Calculando o ROI da Remediação:** Como demonstrar matematicamente que R$ 10.000 investidos em correção de código evitam um passivo de R$ 2.500.000.
- **Aula 5.4:** **Pareceres para Seguradoras de Riscos Cibernéticos:** Como qualificar a empresa para apólices de responsabilidade civil de IA.

---

### **MÓDULO 7: Dossiês Regulatórios, RIPD Automatizado & Projeto de Certificação (6 Horas)**
**Competência Desenvolvida:** Emitir a documentação legal exigida pelas autoridades fiscalizadoras (ANPD e União Europeia) e obter a certificação profissional.

- **Aula 6.1:** **Geração do RIPD Oficial (Art. 38 LGPD):** Exportação do relatório visual e textual homologado para submissão à ANPD.
- **Aula 6.2:** **Dossiê Técnico do EU AI Act (Anexo IV):** Estruturação da documentação de arquitetura, métricas de acurácia e medidas de robustez cibernética.
- **Aula 6.3:** **Projeto Prático Final:** Escanear um dos 3 repositórios-desafio (FinTech, MedIA ou SmartCommerce), corrigir as violações e gerar o Parecer 360°.
- **Aula 6.4:** **Banca de Avaliação & Emissão da Certificação Profissional AIGOV™.**

---

## 🎯 CRITÉRIOS DE AVALIAÇÃO & CERTIFICAÇÃO

Para obter a certificação **AIGOV™ (Certified AI Governance & Agentic Auditor)**, o aluno deve:
1. Concluir 100% das videoaulas e quizzes de validação de cada módulo.
2. Executar a auditoria prática de um repositório real utilizando a plataforma ComplyPRO Light.
3. Submeter o **Parecer Consolidado 360°** e o **RIPD Oficial** gerados pelo sistema, obtendo pontuação mínima de 80/100 na rubrica de avaliação.
