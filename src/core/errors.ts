/**
 * CG-AG CANONICAL ERROR SYSTEM
 * ============================================================
 * Centralised error model for SaaS, POD and Universal MCP.
 *
 * Design principles:
 *  1. STRUCTURAL separation — user-safe data vs internal context never mixed.
 *  2. Epistemic integrity — OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY preserved.
 *  3. Zero secret leakage — sanitiser runs on every user-facing path.
 *  4. Retryability — each code carries an explicit retryable flag.
 *  5. HTTP mapping — optional, only for the REST/Express layer.
 *
 * NOTE: This module does NOT alter Engine, MCP tools, Governance, Passport,
 * Evidence, SIPOC, Audit Ledger, Authentication architecture, or Persistence.
 */

// ============================================================
// 1. CANONICAL ERROR CODES
// ============================================================

export type CGAGErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_FORBIDDEN'
  | 'TENANT_ACCESS_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'INVALID_REPOSITORY'
  | 'REPOSITORY_UNAVAILABLE'
  | 'SCAN_FAILED'
  | 'SCAN_TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'MCP_CONNECTION_FAILED'
  | 'MCP_UNAUTHORIZED'
  | 'MCP_TOOL_DENIED'
  | 'POLICY_BLOCKED'
  | 'HITL_REQUIRED'
  | 'CAPABILITY_NOT_VERIFIED'
  | 'EVIDENCE_NOT_FOUND'
  | 'EVIDENCE_NOT_VERIFIED'
  | 'LEDGER_VERIFICATION_FAILED'
  | 'INTERNAL_ERROR';

// ============================================================
// 2. CATEGORIES & SEVERITY
// ============================================================

export type CGAGErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'tenant'
  | 'validation'
  | 'scan'
  | 'provider'
  | 'mcp'
  | 'governance'
  | 'evidence'
  | 'audit'
  | 'system';

export type CGAGErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

// ============================================================
// 3. USER-SAFE ERROR ENVELOPE (what is returned to callers)
// ============================================================

export interface CGAGUserError {
  code: CGAGErrorCode;
  message: string;       // friendly, translated, no internal details
  severity: CGAGErrorSeverity;
  category: CGAGErrorCategory;
  retryable: boolean;
  correlationId?: string;
}

// ============================================================
// 4. INTERNAL ERROR CONTEXT (never sent to user/MCP client)
// ============================================================

interface CGAGInternalContext {
  technicalDetails?: string;
  cause?: unknown;
  correlationId?: string;
}

// ============================================================
// 5. CGAGError CLASS
// ============================================================

export class CGAGError extends Error {
  readonly code: CGAGErrorCode;
  readonly severity: CGAGErrorSeverity;
  readonly category: CGAGErrorCategory;
  readonly retryable: boolean;
  readonly correlationId?: string;

  // Internal only — NEVER serialised to user output
  private readonly _technicalDetails?: string;
  private readonly _cause?: unknown;

  constructor(
    code: CGAGErrorCode,
    message: string,
    options?: {
      severity?: CGAGErrorSeverity;
      category?: CGAGErrorCategory;
      retryable?: boolean;
      correlationId?: string;
      technicalDetails?: string;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'CGAGError';
    this.code = code;
    this.severity = options?.severity ?? CGAGErrorCatalog[code]?.severity ?? 'error';
    this.category = options?.category ?? CGAGErrorCatalog[code]?.category ?? 'system';
    this.retryable = options?.retryable ?? CGAGErrorCatalog[code]?.retryable ?? false;
    this.correlationId = options?.correlationId;
    this._technicalDetails = options?.technicalDetails;
    this._cause = options?.cause;
  }

  /**
   * Returns ONLY the user-safe representation.
   * technicalDetails, cause, and stack are NEVER included.
   */
  toUserError(): CGAGUserError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      category: this.category,
      retryable: this.retryable,
      ...(this.correlationId ? { correlationId: this.correlationId } : {})
    };
  }

  /**
   * Returns internal context for structured logging ONLY.
   * Must never be serialised and sent to a client.
   */
  toInternalLog(): CGAGInternalContext & { code: CGAGErrorCode; category: CGAGErrorCategory } {
    return {
      code: this.code,
      category: this.category,
      correlationId: this.correlationId,
      technicalDetails: this._technicalDetails
        ? ErrorSanitizer.sanitizeString(this._technicalDetails)
        : undefined,
      cause: undefined // cause is suppressed entirely — may contain credentials
    };
  }
}

// ============================================================
// 6. ERROR CATALOG — default metadata per code
// ============================================================

interface ErrorCatalogEntry {
  message: string;
  severity: CGAGErrorSeverity;
  category: CGAGErrorCategory;
  retryable: boolean;
}

export const CGAGErrorCatalog: Record<CGAGErrorCode, ErrorCatalogEntry> = {
  AUTH_REQUIRED: {
    message: 'Sua sessão expirou. Faça login novamente para continuar.',
    severity: 'warning',
    category: 'authentication',
    retryable: false
  },
  AUTH_FORBIDDEN: {
    message: 'Você não tem permissão para realizar esta ação.',
    severity: 'warning',
    category: 'authorization',
    retryable: false
  },
  TENANT_ACCESS_DENIED: {
    message: 'Este recurso não está disponível para sua organização.',
    severity: 'warning',
    category: 'tenant',
    retryable: false
  },
  RESOURCE_NOT_FOUND: {
    message: 'O recurso solicitado não foi encontrado.',
    severity: 'warning',
    category: 'validation',
    retryable: false
  },
  INVALID_REQUEST: {
    message: 'A solicitação não pôde ser processada porque alguns dados são inválidos.',
    severity: 'warning',
    category: 'validation',
    retryable: false
  },
  INVALID_REPOSITORY: {
    message: 'O endereço do repositório não é válido.',
    severity: 'warning',
    category: 'validation',
    retryable: false
  },
  REPOSITORY_UNAVAILABLE: {
    message: 'Não foi possível acessar o repositório informado.',
    severity: 'error',
    category: 'scan',
    retryable: true
  },
  SCAN_FAILED: {
    message: 'Não foi possível concluir a análise. Tente novamente.',
    severity: 'error',
    category: 'scan',
    retryable: true
  },
  SCAN_TIMEOUT: {
    message: 'A análise demorou mais que o esperado. Tente novamente.',
    severity: 'error',
    category: 'scan',
    retryable: true
  },
  PROVIDER_UNAVAILABLE: {
    message: 'O serviço de IA está temporariamente indisponível.',
    severity: 'error',
    category: 'provider',
    retryable: true
  },
  RATE_LIMITED: {
    message: 'Muitas solicitações. Aguarde alguns instantes e tente novamente.',
    severity: 'warning',
    category: 'provider',
    retryable: true
  },
  MCP_CONNECTION_FAILED: {
    message: 'Não foi possível conectar ao Universal MCP.',
    severity: 'error',
    category: 'mcp',
    retryable: true
  },
  MCP_UNAUTHORIZED: {
    message: 'O Universal MCP recusou a solicitação por falta de autorização.',
    severity: 'warning',
    category: 'mcp',
    retryable: false
  },
  MCP_TOOL_DENIED: {
    message: 'Esta operação não está autorizada para sua sessão.',
    severity: 'warning',
    category: 'mcp',
    retryable: false
  },
  POLICY_BLOCKED: {
    message: 'A política de governança bloqueou esta operação.',
    severity: 'warning',
    category: 'governance',
    retryable: false
  },
  HITL_REQUIRED: {
    message: 'Esta operação requer aprovação humana antes de continuar.',
    severity: 'warning',
    category: 'governance',
    retryable: false
  },
  CAPABILITY_NOT_VERIFIED: {
    // EPISTEMIC INVARIANT: OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY
    // The message deliberately states "identified but not verified" —
    // it NEVER says "not authorised" or "does not exist".
    message: 'A capacidade foi identificada, mas sua autorização não foi verificada.',
    severity: 'warning',
    category: 'governance',
    retryable: false
  },
  EVIDENCE_NOT_FOUND: {
    // EPISTEMIC INVARIANT: Absence of evidence ≠ evidence of absence
    // The message says "not found in scope" not "does not exist".
    message: 'Não foi encontrada evidência suficiente no escopo analisado.',
    severity: 'warning',
    category: 'evidence',
    retryable: false
  },
  EVIDENCE_NOT_VERIFIED: {
    message: 'A evidência necessária não pôde ser verificada.',
    severity: 'error',
    category: 'evidence',
    retryable: false
  },
  LEDGER_VERIFICATION_FAILED: {
    message: 'A integridade do registro de auditoria não pôde ser confirmada.',
    severity: 'critical',
    category: 'audit',
    retryable: false
  },
  INTERNAL_ERROR: {
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    severity: 'error',
    category: 'system',
    retryable: false
  }
};

// ============================================================
// 7. ERROR FACTORY
// ============================================================

export class CGAGErrorFactory {
  /**
   * Creates a CGAGError from a canonical code using catalog defaults.
   * Optionally override the friendly message and supply internal-only context.
   */
  static create(
    code: CGAGErrorCode,
    options?: {
      message?: string;           // override friendly message
      correlationId?: string;
      technicalDetails?: string;  // internal only, never sent to user
      cause?: unknown;            // internal only
    }
  ): CGAGError {
    const catalog = CGAGErrorCatalog[code];
    return new CGAGError(code, options?.message ?? catalog.message, {
      severity: catalog.severity,
      category: catalog.category,
      retryable: catalog.retryable,
      correlationId: options?.correlationId,
      technicalDetails: options?.technicalDetails,
      cause: options?.cause
    });
  }

  /**
   * Converts any unknown thrown value into a canonical CGAGError.
   * NEVER propagates the original message if it may contain secrets.
   */
  static fromUnknown(err: unknown, correlationId?: string): CGAGError {
    if (err instanceof CGAGError) {
      return err;
    }

    const rawMessage = err instanceof Error ? err.message : String(err);
    // Sanitize the raw message before storing it as technicalDetails (internal log)
    const sanitized = ErrorSanitizer.sanitizeString(rawMessage);

    // Map known internal error patterns to canonical codes
    const code = inferCodeFromRawMessage(rawMessage);

    return CGAGErrorFactory.create(code, {
      correlationId,
      technicalDetails: sanitized
      // cause intentionally omitted — may contain credentials
    });
  }
}

// ============================================================
// 8. INTERNAL PATTERN → CANONICAL CODE MAPPING
// ============================================================

function inferCodeFromRawMessage(raw: string): CGAGErrorCode {
  const lower = raw.toLowerCase();
  if (lower.includes('unauthenticated') || lower.includes('auth_required') || lower.includes('session expired')) {
    return 'AUTH_REQUIRED';
  }
  if (lower.includes('forbidden') || lower.includes('auth_forbidden') || lower.includes('not allowed')) {
    return 'AUTH_FORBIDDEN';
  }
  if (lower.includes('not_found') || lower.includes('not found')) {
    return 'RESOURCE_NOT_FOUND';
  }
  if (lower.includes('invalid_input') || lower.includes('invalid request') || lower.includes('validation')) {
    return 'INVALID_REQUEST';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'SCAN_TIMEOUT';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'RATE_LIMITED';
  }
  if (lower.includes('provider') || lower.includes('unavailable') || lower.includes('503')) {
    return 'PROVIDER_UNAVAILABLE';
  }
  if (lower.includes('ledger') || lower.includes('chain integrity')) {
    return 'LEDGER_VERIFICATION_FAILED';
  }
  if (lower.includes('evidence')) {
    return 'EVIDENCE_NOT_FOUND';
  }
  if (lower.includes('policy') || lower.includes('blocked')) {
    return 'POLICY_BLOCKED';
  }
  if (lower.includes('hitl') || lower.includes('human approval')) {
    return 'HITL_REQUIRED';
  }
  if (lower.includes('mcp') && lower.includes('unauthorized')) {
    return 'MCP_UNAUTHORIZED';
  }
  if (lower.includes('mcp') && lower.includes('denied')) {
    return 'MCP_TOOL_DENIED';
  }
  if (lower.includes('repository') && lower.includes('not found')) {
    return 'INVALID_REPOSITORY';
  }
  if (lower.includes('scan') || lower.includes('analys')) {
    return 'SCAN_FAILED';
  }
  return 'INTERNAL_ERROR';
}

// ============================================================
// 9. ERROR SANITIZER
// ============================================================

/**
 * Patterns of secrets that must NEVER appear in any user-facing output.
 *
 * Architecture note: regex is a SECONDARY defence layer.
 * Primary protection is structural: CGAGError.toUserError() never exposes
 * technicalDetails, stack, or cause. The sanitiser is applied defensively
 * on top of that structural guarantee.
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // SiliconFlow API keys (sk- prefix, 40+ chars)
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, label: '[REDACTED:API_KEY]' },
  // OpenRouter keys (sk-or-v1-)
  { pattern: /sk-or-v1-[a-zA-Z0-9]{20,}/g, label: '[REDACTED:OPENROUTER_KEY]' },
  // GitHub tokens
  { pattern: /ghp_[a-zA-Z0-9]{20,}/g, label: '[REDACTED:GITHUB_TOKEN]' },
  // Supabase JWT / Supabase anon/service keys (long eyJ... JWT)
  { pattern: /eyJ[a-zA-Z0-9_.-]{40,}/g, label: '[REDACTED:JWT]' },
  // Bearer tokens
  { pattern: /Bearer\s+[a-zA-Z0-9._\-]{20,}/gi, label: 'Bearer [REDACTED:TOKEN]' },
  // Basic auth
  { pattern: /Basic\s+[a-zA-Z0-9+/=]{10,}/gi, label: 'Basic [REDACTED:CREDENTIALS]' },
  // Generic password= / password:
  { pattern: /password[=:]\s*["']?[^\s"',;)]{4,}["']?/gi, label: 'password=[REDACTED]' },
  // Connection strings (postgres://, mongodb://, mysql://)
  { pattern: /(postgres|postgresql|mongodb|mysql|redis):\/\/[^\s"']+/gi, label: '[REDACTED:CONNECTION_STRING]' },
  // Supabase service role key pattern (long JWT starting with eyJ)
  { pattern: /SUPABASE_SERVICE_ROLE_KEY[=:]\s*["']?[^\s"',;)]{20,}["']?/gi, label: 'SUPABASE_SERVICE_ROLE_KEY=[REDACTED]' },
  // API keys in env var style (KEY=value)
  { pattern: /(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[=:]\s*["']?[^\s"',;)]{8,}["']?/gi, label: '[REDACTED:SECRET_VALUE]' },
  // Windows absolute paths (C:\, D:\)
  { pattern: /[A-Z]:\\[^\s"']{10,}/gi, label: '[REDACTED:PATH]' },
  // Unix absolute paths with home or system dirs
  { pattern: /\/(?:home|Users|root|etc|var|srv)\/[^\s"']{5,}/g, label: '[REDACTED:PATH]' }
];

export class ErrorSanitizer {
  /**
   * Sanitises a string by redacting all detected secret patterns.
   * Primary defence is structural (toUserError never exposes internals).
   * This is a secondary layer applied on every user-facing string.
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return input ?? '';
    let result = input;
    for (const { pattern, label } of SECRET_PATTERNS) {
      result = result.replace(pattern, label);
    }
    return result;
  }

  /**
   * Sanitises any value recursively.
   * Handles: string | Error | object | array | nested objects.
   * Returns a sanitised COPY — never mutates the original.
   */
  static sanitize<T>(value: T): T {
    if (typeof value === 'string') {
      return ErrorSanitizer.sanitizeString(value) as unknown as T;
    }
    if (value instanceof Error) {
      // Return a plain object — never a live Error with stack
      return {
        message: ErrorSanitizer.sanitizeString(value.message)
        // stack intentionally omitted
      } as unknown as T;
    }
    if (Array.isArray(value)) {
      return value.map(item => ErrorSanitizer.sanitize(item)) as unknown as T;
    }
    if (value !== null && typeof value === 'object') {
      const sensitiveKeyPattern = /^(password|secret|token|apikey|api_key|authorization|auth|credential|credentials|service_role_key)$/i;
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        // Skip internal fields that should never reach user output
        if (['stack', 'technicalDetails', 'cause', '_cause', '_technicalDetails'].includes(key)) {
          continue;
        }
        if (sensitiveKeyPattern.test(key) && typeof val === 'string') {
          result[key] = '[REDACTED:SECRET_VALUE]';
        } else {
          result[key] = ErrorSanitizer.sanitize(val);
        }
      }
      return result as unknown as T;
    }
    return value;
  }

  /**
   * Builds a user-safe MCP error envelope from any error value.
   * Guarantees: no stack, no technicalDetails, no secrets.
   */
  static toMcpErrorEnvelope(err: unknown): {
    error: { code: CGAGErrorCode; message: string; retryable: boolean };
  } {
    const cgagErr = CGAGErrorFactory.fromUnknown(err);
    const safe = cgagErr.toUserError();
    return {
      error: {
        code: safe.code,
        message: safe.message,
        retryable: safe.retryable
      }
    };
  }
}

// ============================================================
// 10. HTTP STATUS MAPPER (REST/Express layer only)
// MCP (stdio/SSE) does NOT use HTTP status codes.
// ============================================================

export const HTTP_STATUS_MAP: Record<CGAGErrorCode, number> = {
  AUTH_REQUIRED: 401,
  AUTH_FORBIDDEN: 403,
  TENANT_ACCESS_DENIED: 403,
  RESOURCE_NOT_FOUND: 404,
  INVALID_REQUEST: 400,
  INVALID_REPOSITORY: 400,
  REPOSITORY_UNAVAILABLE: 503,
  SCAN_FAILED: 500,
  SCAN_TIMEOUT: 504,
  PROVIDER_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  MCP_CONNECTION_FAILED: 503,
  MCP_UNAUTHORIZED: 401,
  MCP_TOOL_DENIED: 403,
  POLICY_BLOCKED: 403,
  HITL_REQUIRED: 403,
  CAPABILITY_NOT_VERIFIED: 422,
  EVIDENCE_NOT_FOUND: 404,
  EVIDENCE_NOT_VERIFIED: 422,
  LEDGER_VERIFICATION_FAILED: 500,
  INTERNAL_ERROR: 500
};

export function getHttpStatus(code: CGAGErrorCode): number {
  return HTTP_STATUS_MAP[code] ?? 500;
}
