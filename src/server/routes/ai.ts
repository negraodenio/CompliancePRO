import { Router, Request, Response } from 'express';
import { CGAGErrorFactory, ErrorSanitizer } from '../../core/errors';

export const aiRouter = Router();

const SILICONFLOW_BASE_URL = 'https://api.siliconflow.com/v1/chat/completions';

export const ALLOWED_AI_MODELS = new Set([
  'deepseek-ai/DeepSeek-V3',
  'Qwen/Qwen2.5-72B-Instruct',
  'deepseek-ai/DeepSeek-R1',
  'Qwen/Qwen2.5-7B-Instruct'
]);

// Rate limiter storage (Sliding Window in memory: 30 req / 60 sec)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * POST /api/v1/ai/chat
 * Server-side AI completion proxy using server-side SILICONFLOW_API_KEY.
 * Enforces rate limiting, model allowlist, payload limits, and friendly errors.
 */
aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    // 1. Rate limiting
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';
    if (!checkRateLimit(clientIp)) {
      const err = CGAGErrorFactory.create('RATE_LIMITED', {
        message: 'Limite de requisições ao motor de IA excedido. Aguarde um momento antes de tentar novamente.',
        technicalDetails: `Rate limit exceeded for IP: ${clientIp}`
      });
      return res.status(429).json({ ok: false, error: err.toUserError() });
    }

    const { messages, model = 'deepseek-ai/DeepSeek-V3', temperature = 0.2, max_tokens = 2500, customApiKey } = req.body;

    // 2. Model allowlist verification
    if (!ALLOWED_AI_MODELS.has(model)) {
      const err = CGAGErrorFactory.create('INVALID_REQUEST', {
        message: `O modelo de IA '${model}' não é permitido ou não está homologado.`,
        technicalDetails: `Disallowed model requested: ${model}`
      });
      return res.status(400).json({ ok: false, error: err.toUserError() });
    }

    // 3. Payload sanity and bounds
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const err = CGAGErrorFactory.create('INVALID_REQUEST', {
        message: 'A requisição precisa conter a lista de mensagens formatada.'
      });
      return res.status(400).json({ ok: false, error: err.toUserError() });
    }

    if (messages.length > 50) {
      const err = CGAGErrorFactory.create('INVALID_REQUEST', {
        message: 'A lista de mensagens excede o limite máximo permitido (50 mensagens).'
      });
      return res.status(400).json({ ok: false, error: err.toUserError() });
    }

    let totalChars = 0;
    for (const msg of messages) {
      if (typeof msg?.content === 'string') {
        totalChars += msg.content.length;
      }
    }
    if (totalChars > 65536) {
      const err = CGAGErrorFactory.create('INVALID_REQUEST', {
        message: 'O payload de texto excede o limite máximo suportado (64KB).'
      });
      return res.status(400).json({ ok: false, error: err.toUserError() });
    }

    const clampedTokens = Math.min(Math.max(Number(max_tokens) || 2500, 1), 4096);

    // 4. Server-only API key resolution
    const apiKey = (typeof customApiKey === 'string' && customApiKey.trim().length > 0)
      ? customApiKey.trim()
      : process.env.SILICONFLOW_API_KEY;

    if (!apiKey) {
      const err = CGAGErrorFactory.create('PROVIDER_UNAVAILABLE', {
        message: 'O serviço de IA não está configurado no servidor.',
        technicalDetails: 'SILICONFLOW_API_KEY is not configured on server'
      });
      return res.status(503).json({ ok: false, error: err.toUserError() });
    }

    const response = await fetch(SILICONFLOW_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: Math.min(Math.max(Number(temperature) || 0.2, 0), 1),
        max_tokens: clampedTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const sanitized = ErrorSanitizer.sanitizeString(errorText);
      const isRateLimit = response.status === 429;
      const code = isRateLimit ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE';
      const err = CGAGErrorFactory.create(code, {
        technicalDetails: `SiliconFlow HTTP ${response.status}: ${sanitized}`
      });
      return res.status(isRateLimit ? 429 : 503).json({ ok: false, error: err.toUserError() });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Nenhuma resposta retornada pelo modelo.';
    return res.status(200).json({ ok: true, content });
  } catch (err: unknown) {
    const cgagErr = CGAGErrorFactory.fromUnknown(err);
    return res.status(500).json({ ok: false, error: cgagErr.toUserError() });
  }
});
