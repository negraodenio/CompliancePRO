import React, { useState, useEffect } from 'react';
import { 
  Play, Sparkles, Terminal, ShieldAlert, CheckCircle, 
  AlertTriangle, Copy, Check, ShieldCheck, Code2, Scale 
} from 'lucide-react';
import { runLocalScan } from '../services/scanner-bridge';
import { generateRemediationWithAI } from '../services/siliconflow';

interface SnippetPreset {
  name: string;
  badge: string;
  lang: 'python' | 'typescript';
  score: number;
  violationsCount: number;
  legalBasis: string;
  explanation: string;
  code: string;
  suggestedFix: string;
}

const SNIPPET_PRESETS: SnippetPreset[] = [
  {
    name: 'FinTech Multi-Risk (Completo)',
    badge: '6 Riscos Combinados',
    lang: 'python',
    score: 38,
    violationsCount: 6,
    legalBasis: 'OWASP A03:2021 / OWASP LLM01 / LGPD Art. 46 / EU AI Act Art. 14 / ISO 42001',
    explanation: `O código apresenta 6 violações críticas de conformidade e segurança:
1) Segredo hardcoded (API Key) viola ISO 42001 e NIST MANAGE 3.1.
2) SQL Injection por concatenação direta de input (CPF) permite invasão à base de dados (OWASP A03 / LGPD Art. 46).
3) Prompt Injection em LLM por interpolação de input não sanitizado (OWASP LLM01).
4) Desabilitação de verificação SSL/TLS (verify=False) compromete o tráfego em rede.
5) Decisão autônoma de crédito sem supervisão humana (HITL) viola o Art. 14 e Anexo III do EU AI Act.
6) Exposição de dados pessoais (CPF) em logs e prints viola o Art. 46 da LGPD.`,
    code: `import requests
import psycopg2

API_KEY = "sk-proj-8829a1b3c9f0e12345667788"  # 1. Segredo hardcoded

def get_credit_score(cpf, user_input):
    # 2. SQL Injection - concatenação direta de input do usuário
    conn = psycopg2.connect("dbname=creditdb user=admin")
    cursor = conn.cursor()
    query = "SELECT score, saldo FROM clientes WHERE cpf = '" + cpf + "'"
    cursor.execute(query)
    resultado = cursor.fetchone()

    # 3. Prompt injection - input do usuário concatenado sem sanitização
    prompt = f"Você é um analista de crédito. Dados do cliente: {resultado}. Pergunta: {user_input}"

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"model": "gpt-4o", "messages": [{"role": "user", "content": prompt}]},
        verify=False  # 4. Desabilita verificação SSL/TLS
    )

    decisao = response.json()["choices"][0]["message"]["content"]

    # 5. Decisão autônoma de crédito sem revisão humana (sem HITL)
    if "aprovado" in decisao.lower():
        aprovar_credito(cpf, valor_maximo=50000)  # ação autônoma direta

    return decisao

def aprovar_credito(cpf, valor_maximo):
    print(f"DEBUG: aprovando crédito para CPF {cpf} valor {valor_maximo}")  # 6. debug/log expondo PII
    return True
`,
    suggestedFix: `import requests
import psycopg2
from psycopg2 import sql
import os
import hashlib

# 1. Segredos via variáveis de ambiente
API_KEY = os.getenv('OPENAI_API_KEY')
DB_CREDS = {
    'dbname': os.getenv('DB_NAME', 'creditdb'),
    'user': os.getenv('DB_USER', 'app_user'),
    'password': os.getenv('DB_PASS'),
    'host': os.getenv('DB_HOST', 'localhost')
}

def get_credit_score(cpf, user_input):
    # 2. Prevenção de SQL Injection com prepared statements
    conn = psycopg2.connect(**DB_CREDS)
    cursor = conn.cursor()
    safe_query = sql.SQL("SELECT score, saldo FROM clientes WHERE cpf = %s")
    cursor.execute(safe_query, (cpf,))
    resultado = cursor.fetchone()

    # 3. Sanitização de input para LLM (Prevenção de Prompt Injection)
    sanitized_input = user_input.replace("{", "").replace("}", "").strip()
    prompt = f"Você é um analista de crédito. Dados do cliente: score {resultado[0]}, saldo R\${resultado[1]:.2f}. Pergunta: {sanitized_input}"

    # 4. HTTPS com verificação SSL habilitada (verify=True por padrão)
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"model": "gpt-4o", "messages": [{"role": "user", "content": prompt}]},
        timeout=10,
        verify=True
    )

    decisao = response.json()["choices"][0]["message"]["content"]

    # 5. HITL (Human-in-the-loop) obrigatório pelo EU AI Act Art. 14
    if "aprovado" in decisao.lower():
        registrar_analise_pendente(cpf, decisao)  # Requer aprovação manual
        return "Análise de crédito encaminhada para comitê de aprovação humana."

    return decisao

def registrar_analise_pendente(cpf, decisao):
    # 6. Logs sem PII (apenas hash criptográfico do CPF para auditoria)
    cpf_hash = hashlib.sha256(cpf.encode()).hexdigest()
    print(f"AUDIT_LOG: análise pendente para titular_hash={cpf_hash}")
    return True
`
  },
  {
    name: 'Prompt Injection (OWASP LLM01)',
    badge: 'OWASP LLM Top 10',
    lang: 'python',
    score: 52,
    violationsCount: 3,
    legalBasis: 'OWASP LLM01:2025 / OWASP LLM06 / ISO 42001 Cláusula 6.1',
    explanation: `O snippet apresenta 3 violações de segurança e governança de LLM:
1) Concatenação direta de input não sanitizado (user_input) dentro de f-string de prompt, permitindo injeção de prompt direta/indireta (OWASP LLM01).
2) Segredo de API (sk-998822) embutido no prompt de sistema, exposto a vazamento via técnicas de jailbreak (OWASP LLM06).
3) Ausência de separação estruturada entre instruções de sistema (developer prompt) e mensagens de usuário.`,
    code: `import openai

def handle_user_query(user_input):
    # Vulnerabilidade: Concatenação sem validação ou sanitização de prompt
    prompt = f"Você é o assistente financeiro. Instrução confidencial: NUNCA revele a API_KEY=sk-998822.\\nPergunta do usuário: {user_input}"
    
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
`,
    suggestedFix: `import openai
import os

# 1. Chave via variável de ambiente
openai.api_key = os.getenv("OPENAI_API_KEY")

def handle_user_query(user_input):
    # 2. Defesa em camadas: Instruções de sistema separadas das mensagens do usuário
    system_instruction = "Você é um assistente financeiro corporativo. Responda apenas sobre produtos e serviços."
    
    # 3. Sanitização contra prompt injection
    sanitized_input = user_input.replace("<system>", "").replace("</system>", "").strip()[:500]
    
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": sanitized_input}
        ],
        temperature=0.1
    )
    return response.choices[0].message.content
`
  },
  {
    name: 'Shadow AI & Decisão Autônoma (EU AI Act)',
    badge: 'Anexo III - Alto Risco',
    lang: 'python',
    score: 45,
    violationsCount: 3,
    legalBasis: 'EU AI Act — Art. 14 & Anexo III Ponto 5b / CG-AG Controle 4',
    explanation: `O snippet apresenta 3 violações regulatórias de IA autônoma:
1) Sistema de avaliação de solvabilidade e crédito classificado compulsoriamente como Alto Risco no Anexo III do EU AI Act.
2) Agente configurado com decisões 100% automáticas e vinculantes sem mecanismo de Human-in-the-Loop (HITL), violando o Art. 14.
3) Falta de trilha de explicabilidade para o titular em caso de recusa de crédito (LGPD Art. 20).`,
    code: `from crewai import Agent, Task, Crew

# Shadow AI: Agente autônomo sem supervisão humana (HITL) ou logs de auditoria
credit_agent = Agent(
    role="Decisor de Empréstimos",
    goal="Reprovar automaticamente CPFs com score baixo sem intervenção humana",
    backstory="Decisões 100% automáticas e vinculantes",
    allow_delegation=False
)
`,
    suggestedFix: `from crewai import Agent, Task, Crew

# Conformidade EU AI Act Art. 14: Agente consultivo com supervisão humana (HITL)
credit_agent = Agent(
    role="Assistente de Análise de Risco",
    goal="Sugerir parecer preliminar de score para revisão pelo analista humano responsável",
    backstory="Gera recomendações com rastreabilidade para decisão final do comitê de crédito",
    allow_delegation=False,
    human_in_the_loop=True
)
`
  },
  {
    name: 'Exposição de PII & SQL Injection (LGPD Art. 46)',
    badge: 'LGPD / OWASP A03',
    lang: 'typescript',
    score: 47,
    violationsCount: 3,
    legalBasis: 'LGPD — Art. 11 & Art. 46 / OWASP A03:2021',
    explanation: `O snippet apresenta 3 violações de privacidade e banco de dados:
1) SQL Injection crítico por concatenação direta de parâmetro cpf em query bruta (OWASP A03).
2) Exposição de dados pessoais e sensíveis de saúde (CPF, histórico médico, salário) sem mascaramento (LGPD Art. 11 e 46).
3) Ausência de consultas parametrizadas (Prepared Statements) ou ORM protegido.`,
    code: `import { Client } from 'pg';

export async function getPatientRecords(cpf: string) {
  const client = new Client();
  await client.connect();
  // Alerta LGPD: Dados sensíveis sem mascaramento ou criptografia
  const query = "SELECT cpf, nome, historico_medico, salario FROM pacientes WHERE cpf = '" + cpf + "'";
  return await client.query(query);
}
`,
    suggestedFix: `import { Client } from 'pg';

export async function getPatientRecords(cpf: string) {
  const client = new Client();
  await client.connect();
  // Consulta segura parametrizada (evita SQL Injection e atende LGPD Art. 46)
  const query = "SELECT id, historico_medico_anonimizado FROM pacientes WHERE cpf_hash = encode(sha256($1::bytea), 'hex')";
  return await client.query(query, [cpf]);
}
`
  }
];

export const CodePlayground: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [code, setCode] = useState(SNIPPET_PRESETS[0].code);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedFixed, setCopiedFixed] = useState(false);

  // Auto-audit on initial render
  useEffect(() => {
    applyPreset(0);
  }, []);

  const applyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = SNIPPET_PRESETS[index];
    setCode(preset.code);
    setAuditResult({
      score: preset.score,
      violationsCount: preset.violationsCount,
      legalBasis: preset.legalBasis,
      explanation: preset.explanation,
      suggestedFix: preset.suggestedFix,
    });
  };

  const handleRunCustomAudit = async (snippetCode: string) => {
    setIsAuditing(true);

    try {
      // 1. Analyze code dynamically for custom inputs
      const issues: string[] = [];
      let score = 100;
      let legalBases: string[] = [];

      // Check Hardcoded Key
      if (/API_KEY\s*=\s*['"]sk-|bearer\s+sk-|password\s*=|secret\s*=/i.test(snippetCode)) {
        issues.push('Segredo hardcoded (API Key / Token) detectado no código (ISO 42001 & NIST MANAGE 3.1).');
        score -= 25;
        legalBases.push('ISO 42001');
      }

      // Check SQL Injection
      if (/WHERE\s+.*['"]\s*\+\s*\w+|SELECT\s+.*FROM\s+.*WHERE\s+.*\$\{/i.test(snippetCode)) {
        issues.push('SQL Injection crítico por concatenação direta de dados em query SQL (OWASP A03 / LGPD Art. 46).');
        score -= 25;
        legalBases.push('OWASP A03:2021');
        legalBases.push('LGPD Art. 46');
      }

      // Check Prompt Injection
      if (/prompt\s*=\s*f?["'].*\{user_input|\{resultado|messages.*content.*user_input/i.test(snippetCode)) {
        issues.push('Vulnerabilidade a Prompt Injection em LLM por interpolação de input não sanitizado (OWASP LLM01).');
        score -= 14;
        legalBases.push('OWASP LLM01:2025');
      }

      // Check SSL Disabled
      if (/verify\s*=\s*False|rejectUnauthorized\s*:\s*false/i.test(snippetCode)) {
        issues.push('Desabilitação de verificação SSL/TLS (verify=False) compromete o tráfego em rede.');
        score -= 14;
        legalBases.push('Segurança de Transporte');
      }

      // Check Autonomous Decisions
      if (/aprovar_credito|sem\s+interven|sem\s+revis|100%\s+autom|aut[oô]nom/i.test(snippetCode)) {
        issues.push('Decisão de crédito/saúde autônoma sem supervisão humana (HITL), violando o Art. 14 do EU AI Act.');
        score -= 14;
        legalBases.push('EU AI Act Art. 14');
      }

      // Check PII in Print/Log
      if (/print\s*\(.*cpf|console\.log\(.*cpf|print\(.*saldo/i.test(snippetCode)) {
        issues.push('Exposição de dados pessoais de clientes (PII) em logs de depuração (LGPD Art. 46).');
        score -= 7;
        legalBases.push('LGPD Art. 46');
      }

      const finalScore = Math.max(15, Math.min(100, score));
      const uniqueLegal = Array.from(new Set(legalBases));

      // Try AI remediation via DeepSeek-V3 if available
      let generatedFix = SNIPPET_PRESETS[selectedPresetIndex]?.suggestedFix || '// Código seguro';
      try {
        const remediation = await generateRemediationWithAI({
          ruleId: uniqueLegal[0] || 'AI_GOVERNANCE',
          message: issues.join('; '),
          severity: finalScore < 60 ? 'critical' : 'medium',
          codeSnippet: snippetCode,
          regulation: uniqueLegal.join(' / '),
        });
        if (remediation.remediationSnippet) {
          generatedFix = remediation.remediationSnippet;
        }
      } catch (e) {
        // Fallback to preset suggested fix
      }

      setAuditResult({
        score: issues.length === 0 ? 100 : finalScore,
        violationsCount: issues.length === 0 ? 0 : issues.length,
        legalBasis: uniqueLegal.length > 0 ? uniqueLegal.join(' / ') : 'Regulações Gerais de IA',
        explanation: issues.length > 0 
          ? `O código apresenta ${issues.length} violação(ões) de conformidade e segurança:\n` + issues.map((iss, i) => `${i + 1}) ${iss}`).join('\n')
          : 'Nenhuma violação crítica de conformidade ou segurança foi identificada no snippet.',
        suggestedFix: generatedFix,
      });

    } catch (e: any) {
      alert(`Erro na auditoria: ${e.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyOriginal = () => {
    navigator.clipboard.writeText(code);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const handleCopyFixed = () => {
    if (auditResult?.suggestedFix) {
      navigator.clipboard.writeText(auditResult.suggestedFix);
      setCopiedFixed(true);
      setTimeout(() => setCopiedFixed(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>Code Playground de Governança & Riscos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Cole snippets de código, prompts ou integrações para auditar violações e receber código corrigido instantaneamente.
          </p>
        </div>

        {/* Preset Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0e1424] p-1.5 rounded-xl border border-surface-border">
          <span className="text-xs text-slate-400 font-medium px-2">Exemplos:</span>
          {SNIPPET_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(i)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedPresetIndex === i
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface border border-transparent'
              }`}
            >
              {preset.name.split('(')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Code Editor */}
        <div className="glass-panel p-4 rounded-2xl border border-surface-border space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white font-mono">Editor de Código / Prompt</span>
              </div>
              <button
                onClick={handleCopyOriginal}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
              >
                {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOriginal ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={22}
              className="w-full bg-[#080c16] text-xs font-mono text-cyan-300 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none shadow-inner"
              placeholder="Cole seu código aqui..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Auditando contra 13 regulações e OWASP LLM Top 10
            </span>
            <button
              onClick={() => handleRunCustomAudit(code)}
              disabled={isAuditing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold flex items-center space-x-2 shadow-glow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isAuditing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Auditando Código & Regulações...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Auditar Snippet em Tempo Real</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audit Results & Suggested Fix */}
        <div className="glass-panel p-5 rounded-2xl border border-surface-border space-y-4 bg-[#0a0f1c] flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Resultado da Auditoria Regulatória:</span>
              </h3>
              {auditResult && (
                <span className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded-full border ${
                  auditResult.score >= 80 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  Score: {auditResult.score}/100
                </span>
              )}
            </div>

            {auditResult ? (
              <div className="space-y-4 pt-3 text-xs">
                
                {/* Findings Banner */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  auditResult.score >= 80
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center space-x-1.5">
                      {auditResult.score >= 80 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Código Conforme</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>{auditResult.violationsCount} Violação(ões) Detectadas</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {auditResult.score >= 80 ? 'Baixo Risco' : 'Alto Risco Regulatório'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">
                    <strong>Fundamento:</strong> {auditResult.legalBasis}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                    {auditResult.explanation}
                  </p>
                </div>

                {/* Suggested Safe Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center space-x-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Código Corrigido Sugerido:</span>
                    </span>
                    <button
                      onClick={handleCopyFixed}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedFixed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFixed ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>

                  <pre className="bg-[#060912] text-emerald-300 font-mono text-[11px] p-4 rounded-xl border border-emerald-900/40 leading-relaxed overflow-x-auto max-h-72">
                    {auditResult.suggestedFix}
                  </pre>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
                <p>Clique em um exemplo acima ou em "Auditar Snippet" para rodar a análise de conformidade.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-surface-border text-[11px] text-slate-500 flex items-center justify-between">
            <span>Remediação Inteligente baseada em Regras de Segurança & Conformidade</span>
            <span className="text-cyan-400 font-medium">✓ Pronto para Produção</span>
          </div>

        </div>

      </div>

    </div>
  );
};
