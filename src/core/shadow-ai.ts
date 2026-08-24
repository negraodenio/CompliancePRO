import type { ShadowAIFinding, SourceAnalysis } from './types';

const KNOWN_PROVIDERS = [
  'openai', 'anthropic', 'mistral', 'google-ai', 'huggingface', 'cohere', 'deepseek',
  'langgraph', 'langchain', 'ollama', 'azure', 'bedrock', 'groq', 'together', 'qwen'
];
const GOVERNED_PATTERNS = [/auth|token|session|apiKey|middleware|protect/i, /registry|governance|audit|approved/i];

function isGoverned(content: string): boolean {
  return GOVERNED_PATTERNS.some(p => p.test(content));
}

function detectProvider(content: string, filePath?: string): { provider: string; modelId: string | null } {
  for (const p of KNOWN_PROVIDERS) {
    if (new RegExp(p, 'i').test(content) || (filePath && new RegExp(p, 'i').test(filePath))) {
      const modelMatch = content.match(/(gpt-4o|gpt-4|gpt-3\.5|claude-3-5|claude|mistral-large|mistral|deepseek-r1|deepseek-v3|deepseek|gemini-1\.5|gemini|llama-3|qwen-2\.5|qwen|dall-e|whisper|text-embedding)/i);
      return { 
        provider: p.toUpperCase(), 
        modelId: modelMatch ? modelMatch[0] : 'Motor de Inferência LLM' 
      };
    }
  }

  // Check generic LLM call indicators
  if (/ChatOpenAI|ChatAnthropic|ChatGoogleGenerativeAI|OpenAIEmbeddings/i.test(content)) {
    return { provider: 'LANGCHAIN / OPENAI', modelId: 'ChatModel Pipeline' };
  }

  return { provider: 'MOTOR DE INFERÊNCIA LLM', modelId: 'Pipeline de Linguagem' };
}

export function detectShadowAI(files: Map<string, string>, source: SourceAnalysis): ShadowAIFinding[] {
  const findings: ShadowAIFinding[] = [];

  for (const agent of source.agents) {
    if (agent.models.includes('llm')) {
      // Check if the file content for this agent exists in the map
      const fileKey = Array.from(files.keys()).find(k => k.includes(agent.name));
      if (fileKey) {
        const content = files.get(fileKey) ?? '';
        if (!isGoverned(content)) {
          const providerInfo = detectProvider(content, fileKey);
          findings.push({
            file: fileKey,
            provider: providerInfo.provider,
            modelId: providerInfo.modelId,
            usage: 'chat',
            governed: false,
            reason: agent.critical ? 'Agente de IA sem registro formal de governança' : 'Uso de modelo LLM sem catálogo de governança',
          });
        }
      }
    }
  }

  // Also check files not mapped as agents but containing LLM calls (including Python, JS, TS, Jupyter)
  for (const [path, content] of Array.from(files)) {
    if (!content) continue;
    if (!path.endsWith('.ts') && !path.endsWith('.tsx') && !path.endsWith('.js') && !path.endsWith('.py') && !path.endsWith('.ipynb')) continue;
    // Skip files already checked via agents
    if (source.agents.some(a => path.includes(a.name))) continue;
    // Skip node_modules and config files
    if (path.includes('node_modules') || path.includes('/config/')) continue;

    const hasApiCall = /\.chat\.completions|\.generate|\.create\b|\.invoke|\.stream|ChatOpenAI|ChatAnthropic|LLMChain|AgentExecutor|StateGraph/i.test(content);
    const providerInfo = detectProvider(content, path);

    if (hasApiCall && !isGoverned(content)) {
      findings.push({
        file: path,
        provider: providerInfo.provider,
        modelId: providerInfo.modelId,
        usage: hasApiCall ? 'chat' : 'inference',
        governed: false,
        reason: 'Chamada LLM detectada sem registro prévio de governança',
      });
    }
  }

  return findings;
}
