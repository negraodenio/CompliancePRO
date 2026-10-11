/**
 * ComplyPRO.pt — Sprint 7-A: Model Gateway
 * 
 * Core Invariants:
 * 1. Zero Model Secrets in Worker: API keys live exclusively inside Gateway credential boundary.
 * 2. Compulsory Guardian Interception: All model requests are evaluated against ComplianceProfile & Passport.
 * 3. BLOCK Enforces Zero Execution: Prohibited or undeclared models result in zero provider calls.
 * 4. Tamper-Evident Evidence: Emits MODEL_REQUEST, GUARDIAN_DECISION, MODEL_RESPONSE, MODEL_ERROR to EvidenceLedger.
 * 5. Token & Cost Accounting: Tracks promptTokens, completionTokens, and computes cost estimation in EUR.
 */

import crypto from 'crypto';
import { GuardianService } from './guardian-service';
import { ComplianceProfileRegistry } from './compliance-compiler';
import { AgentPassport } from './compliance-contract';
import { EvidenceLedger, canonicalizeJson } from './evidence-ledger';
import { DurableStore } from '../server/db/durable-store';

export type ModelProvider = 'openai' | 'azure-openai' | 'openrouter';

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelInvocationRequest {
  agentId: string;
  passportId: string;
  runtimeId: string;
  executionId?: string;
  passport: AgentPassport;
  provider: ModelProvider;
  model: string;
  messages: ModelMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  metadata?: Record<string, any>;
  privacyPolicy?: {
    redactPii?: boolean;
    storeFullPrompt?: boolean;
  };
  tenantId?: string;
}

export interface ModelTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelInvocationResponse {
  status: 'COMPLETED' | 'BLOCKED' | 'PAUSED' | 'FAILED';
  verdict: 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';
  executionId: string;
  provider: ModelProvider;
  model: string;
  responseMessage?: ModelMessage;
  tokenUsage?: ModelTokenUsage;
  estimatedCostEur?: number;
  latencyMs: number;
  decisionLatencyMs: number;
  gateId?: string;
  error?: string;
  providerCallCount?: number;
}

export interface ProviderCredentials {
  apiKey: string;
  endpoint?: string;
  apiVersion?: string;
}

export type ModelDispatcherFn = (
  provider: ModelProvider,
  model: string,
  messages: ModelMessage[],
  credentials: ProviderCredentials,
  options?: { maxTokens?: number; temperature?: number; timeoutMs?: number }
) => Promise<{
  content: string;
  usage: ModelTokenUsage;
}>;

export class ModelGateway {
  // SEC-P1: Gateway credential boundary — private in-memory vault NEVER exposed to workers
  private static credentialVault: Map<ModelProvider, ProviderCredentials> = new Map();
  private static customDispatcher?: ModelDispatcherFn;

  /**
   * Initializes default credentials from host environment if available.
   */
  static {
    if (process.env.OPENAI_API_KEY) {
      this.credentialVault.set('openai', { apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.AZURE_OPENAI_API_KEY) {
      this.credentialVault.set('azure-openai', {
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://complypro-azure.openai.azure.com/',
        apiVersion: '2024-06-01'
      });
    }
    if (process.env.OPENROUTER_API_KEY) {
      this.credentialVault.set('openrouter', {
        apiKey: process.env.OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1'
      });
    }
  }

  /**
   * Configures provider credentials within the secure Gateway boundary.
   */
  public static setProviderCredentials(provider: ModelProvider, creds: ProviderCredentials): void {
    if (!creds.apiKey || typeof creds.apiKey !== 'string') {
      throw new Error(`INVALID_CREDENTIALS: API key for provider ${provider} must be a non-empty string`);
    }
    this.credentialVault.set(provider, { ...creds });
  }

  /**
   * Removes provider credentials from vault.
   */
  public static removeProviderCredentials(provider: ModelProvider): void {
    this.credentialVault.delete(provider);
  }

  /**
   * Clears all credentials (useful for testing zero-secrets state).
   */
  public static clearCredentials(): void {
    this.credentialVault.clear();
  }

  /**
   * Registers a custom dispatcher (e.g. for deterministic mock testing or specialized HTTP clients).
   */
  public static setDispatcher(dispatcher: ModelDispatcherFn): void {
    this.customDispatcher = dispatcher;
  }

  /**
   * Resets custom dispatcher to default.
   */
  public static resetDispatcher(): void {
    this.customDispatcher = undefined;
  }

  /**
   * Standard production HTTP fetch dispatcher for real model providers (OpenAI, OpenRouter, Azure).
   * Performs outbound network call strictly within Gateway perimeter.
   * Throws REAL_PROVIDER_HTTP_ERROR on network or API failures (no silent fallback).
   */
  public static readonly realHttpDispatcher: ModelDispatcherFn = async (
    provider: ModelProvider,
    model: string,
    messages: ModelMessage[],
    credentials: ProviderCredentials,
    options?: { maxTokens?: number; temperature?: number; timeoutMs?: number }
  ) => {
    let url = credentials.endpoint || (provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');
    if (!url.endsWith('/chat/completions')) {
      url = `${url.replace(/\/+$/, '')}/chat/completions`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${credentials.apiKey}`
    };

    const payload = {
      model,
      messages,
      max_tokens: options?.maxTokens || 256,
      temperature: options?.temperature ?? 0.7
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(options?.timeoutMs || 30000)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`REAL_PROVIDER_HTTP_ERROR: HTTP ${res.status} ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('REAL_PROVIDER_RESPONSE_INVALID: Missing model response.');
    const promptTokens = data.usage?.prompt_tokens ?? Math.ceil(JSON.stringify(messages).length / 4);
    const completionTokens = data.usage?.completion_tokens ?? Math.ceil(content.length / 4);
    const totalTokens = data.usage?.total_tokens ?? (promptTokens + completionTokens);

    const usage: ModelTokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens
    };

    return { content, usage };
  };

  /**
   * Calculates token cost in EUR based on public model pricing standards.
   */
  public static estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const normalized = model.toLowerCase();
    let promptRatePer1M = 2.50; // default rate
    let completionRatePer1M = 10.00;

    if (normalized.includes('gpt-4o-mini')) {
      promptRatePer1M = 0.15;
      completionRatePer1M = 0.60;
    } else if (normalized.includes('gpt-4o') || normalized.includes('gpt-4-turbo')) {
      promptRatePer1M = 2.50;
      completionRatePer1M = 10.00;
    } else if (normalized.includes('gpt-3.5') || normalized.includes('gpt-35')) {
      promptRatePer1M = 0.50;
      completionRatePer1M = 1.50;
    }

    const cost = (promptTokens * promptRatePer1M) / 1_000_000 + (completionTokens * completionRatePer1M) / 1_000_000;
    return parseFloat(cost.toFixed(6));
  }

  /**
   * Invokes a model through the ComplyPRO Model Gateway with mandatory Guardian policy enforcement.
   */
  public static async invokeModel(request: ModelInvocationRequest): Promise<ModelInvocationResponse> {
    const startTime = Date.now();
    const executionId = request.executionId || `exec_mod_${crypto.randomBytes(4).toString('hex')}`;
    const evidenceTenant = request.tenantId || request.passport?.tenantId || 'TENANT-DEFAULT';
    await EvidenceLedger.prepareTenant(evidenceTenant);

    // 1. Validation of Core Identity
    if (!request.agentId || !request.passport || !request.model) {
      throw new Error('INVALID_MODEL_REQUEST: agentId, passport, and model must be specified');
    }

    if (request.provider !== 'openai' && request.provider !== 'azure-openai' && request.provider !== 'openrouter') {
      throw new Error(`UNSUPPORTED_PROVIDER: Provider "${request.provider}" is not supported. Use "openai", "azure-openai", or "openrouter".`);
    }

    // 2. Safe Payload Digesting (Zero sensitive/PII leakage in evidence)
    const promptSummary = request.messages.map(m => `${m.role}:${m.content.length}chars`).join('|');
    const estimatedPromptTokens = request.messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
    const requestDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        provider: request.provider,
        model: request.model,
        messagesSummary: promptSummary,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 1024
      }))
      .digest('hex');

    // 3. Resolve Matching Compliance Profile
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === request.passport.complianceProfileChecksum
    );
    const profileId = profile?.profileId || 'UNKNOWN_PROFILE';

    // 4. Emit MODEL_REQUEST in Evidence Ledger
    EvidenceLedger.append({
      evidenceId: `ev_mreq_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'MODEL_REQUEST',
      executionId,
      agentId: request.agentId,
      passportFingerprint: request.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: request.passport.complianceProfileChecksum,
      channel: 'MODEL',
      capability: request.model,
      action: 'EXECUTE',
      verdict: 'ALLOW',
      payloadDigest: requestDigest
    }, evidenceTenant);

    if (!profile) {
      const errorMsg = `UNRESOLVED_COMPLIANCE_PROFILE: Profile checksum "${request.passport.complianceProfileChecksum}" could not be matched`;
      EvidenceLedger.append({
        evidenceId: `ev_merr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'MODEL_ERROR',
        executionId,
        agentId: request.agentId,
        passportFingerprint: request.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: request.passport.complianceProfileChecksum,
        channel: 'MODEL',
        capability: request.model,
        action: 'EXECUTE',
        verdict: 'BLOCK',
        executionResult: 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);

      return {
        status: 'FAILED',
        verdict: 'BLOCK',
        executionId,
        provider: request.provider,
        model: request.model,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    // 5. Guardian Policy Evaluation
    const guardianVerdict = GuardianService.evaluateModelInvocation({
      agent: {
        id: request.agentId,
        name: request.passport.runtime?.framework ? `${request.passport.runtime.framework}-agent` : 'governed-agent',
        version: request.passport.runtime?.frameworkVersion
      },
      passport: {
        ...request.passport,
        tenantId: request.passport.tenantId || request.tenantId
      },
      complianceProfile: profile,
      modelName: request.model,
      promptTokens: estimatedPromptTokens,
      payload: {
        provider: request.provider,
        model: request.model,
        maxTokens: request.maxTokens,
        ...(request.metadata || {})
      },
      context: {
        tenantId: request.tenantId || request.passport.tenantId
      }
    });

    const decisionLatencyMs = guardianVerdict.decisionLatencyMs;

    // 6. Handle Guardian Decisions
    if (guardianVerdict.verdict === 'BLOCK' || guardianVerdict.verdict === 'CIRCUIT_BREAK') {
      EvidenceLedger.append({
        evidenceId: `ev_merr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'MODEL_ERROR',
        executionId,
        agentId: request.agentId,
        passportFingerprint: request.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: request.passport.complianceProfileChecksum,
        channel: 'MODEL',
        capability: request.model,
        action: 'EXECUTE',
        verdict: guardianVerdict.verdict,
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(guardianVerdict.reason).digest('hex')
      }, evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);

      return {
        status: 'BLOCKED',
        verdict: guardianVerdict.verdict,
        executionId,
        provider: request.provider,
        model: request.model,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: guardianVerdict.reason
      };
    }

    if (guardianVerdict.verdict === 'REQUIRE_HITL') {
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      return {
        status: 'PAUSED',
        verdict: 'REQUIRE_HITL',
        gateId: guardianVerdict.gateId,
        executionId,
        provider: request.provider,
        model: request.model,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: guardianVerdict.reason
      };
    }

    // 7. ALLOW: Execute call via Provider (Gateway Credential Boundary)
    const creds = this.credentialVault.get(request.provider);
    if (!creds && !this.customDispatcher) {
      // If neither credentials nor dispatcher are provided, throw specific gateway error
      const errorMsg = `PROVIDER_CREDENTIALS_MISSING: Gateway possesses no credentials for provider "${request.provider}"`;
      EvidenceLedger.append({evidenceId:`ev_merr_${crypto.randomUUID()}`,timestamp:new Date().toISOString(),
        eventType:'MODEL_ERROR',executionId,agentId:request.agentId,passportFingerprint:request.passport.passportFingerprint,
        complianceProfileId:profileId,complianceProfileChecksum:request.passport.complianceProfileChecksum,
        channel:'MODEL',capability:request.model,verdict:'BLOCK',executionResult:'FAILED'},evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      return {
        status: 'FAILED',
        verdict: 'BLOCK',
        executionId,
        provider: request.provider,
        model: request.model,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    const effectiveCreds: ProviderCredentials = creds || { apiKey: 'complypro_gateway_mock_key' };

    let content = '';
    let usage: ModelTokenUsage = { promptTokens: estimatedPromptTokens, completionTokens: 48, totalTokens: estimatedPromptTokens + 48 };
    let providerCallCount = 0;

    try {
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      await DurableStore.requireExecutionAuthority(request);
      const dispatcher = this.customDispatcher ||
        (process.env.NODE_ENV !== 'test' ? this.realHttpDispatcher : undefined);
      if (dispatcher) {
        providerCallCount = 1;
        const dispatchRes = await dispatcher(
          request.provider,
          request.model,
          request.messages,
          effectiveCreds,
          { maxTokens: request.maxTokens, temperature: request.temperature, timeoutMs: request.timeoutMs }
        );
        content = dispatchRes.content;
        usage = dispatchRes.usage;
        if (typeof content !== 'string' || !usage ||
            ![usage.promptTokens,usage.completionTokens,usage.totalTokens].every(value=>Number.isFinite(value) && value>=0)) {
          throw new Error('MODEL_PROVIDER_RESPONSE_INVALID');
        }
      } else {
        // Explicit test environment only; never selected for development/production.
        providerCallCount = 1;
        content = `[ComplyPRO Governed Output via ${request.provider}/${request.model}]: Analysis complete under profile ${profile.profileId}.`;
        const completionTokens = Math.ceil(content.length / 4);
        usage = {
          promptTokens: estimatedPromptTokens,
          completionTokens,
          totalTokens: estimatedPromptTokens + completionTokens
        };
      }
    } catch (dispatchErr: any) {
      const errorMsg = `MODEL_EXECUTION_ERROR: ${dispatchErr.message}`;
      const denied = dispatchErr.message?.startsWith('CURRENT_EXECUTION_AUTHORITY_DENIED');
      EvidenceLedger.append({
        evidenceId: `ev_merr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'MODEL_ERROR',
        executionId,
        agentId: request.agentId,
        passportFingerprint: request.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: request.passport.complianceProfileChecksum,
        channel: 'MODEL',
        capability: request.model,
        action: 'EXECUTE',
        verdict: 'BLOCK',
        executionResult: denied ? 'BLOCKED' : 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);

      return {
        status: denied ? 'BLOCKED' : 'FAILED',
        verdict: 'BLOCK',
        executionId,
        provider: request.provider,
        model: request.model,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount,
        error: errorMsg
      };
    }

    const estimatedCostEur = this.estimateCost(request.model, usage.promptTokens, usage.completionTokens);
    const totalLatencyMs = Date.now() - startTime;

    // 8. Record MODEL_RESPONSE in Evidence Ledger
    const responseDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        provider: request.provider,
        model: request.model,
        usage,
        estimatedCostEur,
        contentLength: content.length
      }))
      .digest('hex');

    EvidenceLedger.append({
      evidenceId: `ev_mres_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'MODEL_RESPONSE',
      executionId,
      agentId: request.agentId,
      passportFingerprint: request.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: request.passport.complianceProfileChecksum,
      channel: 'MODEL',
      capability: request.model,
      action: 'EXECUTE',
      verdict: 'ALLOW',
      executionResult: 'SUCCESS',
      payloadDigest: responseDigest
    }, evidenceTenant);
    await EvidenceLedger.flushPendingWrites(evidenceTenant);

    return {
      status: 'COMPLETED',
      verdict: 'ALLOW',
      executionId,
      provider: request.provider,
      model: request.model,
      responseMessage: { role: 'assistant', content },
      tokenUsage: usage,
      estimatedCostEur,
      latencyMs: totalLatencyMs,
      decisionLatencyMs,
      providerCallCount
    };
  }
}
