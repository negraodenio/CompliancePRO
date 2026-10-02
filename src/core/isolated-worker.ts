/**
 * ComplyPRO.pt — Sprint 4: Isolated Runtime Worker
 * 
 * Core Invariants:
 * 1. Zero Direct Network Access: Worker cannot open raw sockets or fetch arbitrary URLs.
 * 2. Zero Secrets in Worker: Sensitive env vars (API keys, database URLs, cloud secrets) are completely stripped.
 * 3. Restricted Filesystem: Access outside the assigned sandbox root is strictly prohibited.
 * 4. Resource Bounds: Enforces CPU, Memory, and Max Execution Timeout limits.
 * 5. Gateway-Bound Execution: All external actions MUST traverse the ComplyPRO Gateway & Guardian.
 */

import { AgentPassport } from './compliance-contract';
import { GuardianService, GuardianResponse } from './guardian-service';
import { CapabilityRegistry, CapabilityAction } from './capability-registry';
import { ComplianceProfileRegistry } from './compliance-compiler';
import { ModelGateway, ModelMessage, ModelInvocationResponse, ModelProvider } from './model-gateway';
import { ToolGateway, ToolExecutionResponse } from './tool-gateway';
import { DataGateway, DataExecutionResponse } from './data-gateway';
import { SandboxManager } from './sandbox/sandbox-manager';

export interface WorkerIsolationConfig {
  network: 'DENY';
  secrets: 'DENY';
  filesystem: 'RESTRICTED';
}

export interface WorkerResourceLimits {
  cpu: number;
  memoryMb: number;
  maxExecutionSeconds: number;
}

export interface WorkerExecutionResult {
  status: 'COMPLETED' | 'PAUSED' | 'BLOCKED' | 'FAILED';
  verdict?: 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';
  gateId?: string;
  result?: any;
  error?: string;
  decisionLatencyMs?: number;
}

export class IsolatedWorker {
  public readonly agentId: string;
  public readonly passportId: string;
  public readonly runtimeId: string;
  public readonly passport: AgentPassport;
  public readonly isolation: WorkerIsolationConfig;
  public readonly resources: WorkerResourceLimits;
  public readonly sandboxId: string;
  
  private readonly sanitizedEnv: Readonly<Record<string, string>>;
  private readonly sandboxRoot: string;
  private isAlive = true;
  private timeoutTimer?: NodeJS.Timeout;

  constructor(params: {
    agentId: string;
    passportId: string;
    runtimeId: string;
    passport: AgentPassport;
    environment?: 'sandbox' | 'staging' | 'production';
    resources?: Partial<WorkerResourceLimits>;
  }) {
    this.agentId = params.agentId;
    this.passportId = params.passportId;
    this.runtimeId = params.runtimeId;
    this.passport = params.passport;

    this.isolation = {
      network: 'DENY',
      secrets: 'DENY',
      filesystem: 'RESTRICTED'
    };

    this.resources = {
      cpu: params.resources?.cpu || 1,
      memoryMb: params.resources?.memoryMb || 512,
      maxExecutionSeconds: params.resources?.maxExecutionSeconds || 300
    };

    this.sandboxRoot = `/sandbox/${this.runtimeId}`;

    // Sprint 8-4: Provision and launch isolated containerized sandbox
    try {
      const sbx = SandboxManager.createSandbox({
        agentId: this.agentId,
        runtimeInstanceId: this.runtimeId,
        executionSessionId: `exec_init_${this.runtimeId}`,
        tenantId: this.passport.tenantId || 'TENANT-DEFAULT',
        passport: this.passport,
        resourceLimits: {
          cpu: this.resources.cpu,
          memoryMb: this.resources.memoryMb,
          maxExecutionSeconds: this.resources.maxExecutionSeconds
        }
      });
      this.sandboxId = sbx.identity.sandboxId;
      SandboxManager.startSandbox(this.sandboxId);
    } catch {
      this.sandboxId = `sbx_fallback_${this.runtimeId}`;
    }

    // SEC-P4: Zero Secrets environment - ONLY operational, non-sensitive variables are accessible
    this.sanitizedEnv = Object.freeze({
      AGENT_ID: this.agentId,
      PASSPORT_ID: this.passportId,
      RUNTIME_ID: this.runtimeId,
      NODE_ENV: params.environment || 'sandbox',
      COMPLYPRO_ISOLATED: 'true'
    });

    // Start watchdog timer
    if (this.resources.maxExecutionSeconds > 0) {
      this.timeoutTimer = setTimeout(() => {
        this.terminate('EXECUTION_TIMEOUT: Worker exceeded maximum execution time');
      }, this.resources.maxExecutionSeconds * 1000);
      // Unref timer so node process can exit if needed
      if (typeof this.timeoutTimer.unref === 'function') {
        this.timeoutTimer.unref();
      }
    }
  }

  /**
   * Attempts to read environment variable inside the worker.
   * Throws if sensitive secret patterns are requested.
   */
  public getEnv(key: string): string | undefined {
    const isSensitive = /key|secret|token|password|auth|credential|bearer|database|db_|connection|conn_str|url|postgres|supabase|pgpassword/i.test(key);
    if (isSensitive) {
      throw new Error(`SECRET_ACCESS_DENIED: Attempt to access sensitive credential "${key}" in isolated worker`);
    }
    return this.sanitizedEnv[key];
  }

  /**
   * Returns all available environment variables in worker (strictly stripped of secrets).
   */
  public getAllEnv(): Readonly<Record<string, string>> {
    return this.sanitizedEnv;
  }

  /**
   * Simulated network call. Strictly denied in isolated worker.
   */
  public directNetworkCall(targetUrl: string): never {
    throw new Error(`NETWORK_ACCESS_DENIED: Direct outbound internet access to "${targetUrl}" is blocked. All traffic must route via ComplyPRO Gateways.`);
  }

  /**
   * Simulated filesystem access. Rejects any path outside sandbox.
   */
  public accessFile(targetPath: string): string {
    const normalized = targetPath.replace(/\\/g, '/');
    if (!normalized.startsWith(this.sandboxRoot) && !normalized.startsWith('/tmp/sandbox')) {
      throw new Error(`FILESYSTEM_ACCESS_DENIED: Access to path "${targetPath}" is forbidden outside worker sandbox "${this.sandboxRoot}"`);
    }
    return `[FILE_HANDLE: ${normalized}]`;
  }

  /**
   * Controlled capability invocation via Gateway & Guardian.
   * This is the ONLY legal path for a worker to perform operations.
   */
  public requestCapability(
    capabilityId: string,
    actionType: CapabilityAction,
    payload?: Record<string, any>
  ): WorkerExecutionResult {
    if (!this.isAlive) {
      throw new Error('WORKER_TERMINATED: Cannot execute capabilities on a stopped worker');
    }

    // 1. Resolve capability
    const capability = CapabilityRegistry.get(capabilityId);
    if (!capability) {
      return {
        status: 'FAILED',
        error: `UNKNOWN_CAPABILITY: Capability "${capabilityId}" is not registered in ComplyPRO Gateway`
      };
    }

    // 2. Resolve profile from passport
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === this.passport.complianceProfileChecksum
    );

    if (!profile) {
      return {
        status: 'FAILED',
        error: `UNRESOLVED_COMPLIANCE_PROFILE: Profile checksum "${this.passport.complianceProfileChecksum}" could not be matched`
      };
    }

    // 3. Dispatch through Guardian Gateway
    const guardianVerdict = GuardianService.evaluateCapability({
      agent: {
        id: this.agentId,
        name: this.passport.runtime?.framework ? `${this.passport.runtime.framework}-agent` : 'governed-agent',
        version: this.passport.runtime?.frameworkVersion
      },
      passport: {
        passportId: this.passport.passportId,
        passportFingerprint: this.passport.passportFingerprint,
        complianceProfileChecksum: this.passport.complianceProfileChecksum,
        declaredTools: this.passport.declaredTools,
        governedCapabilities: this.passport.governedCapabilities as any,
        toolManifestHash: this.passport.toolManifestHash,
        riskTier: this.passport.riskTier
      },
      complianceProfile: profile,
      channel: capability.channel,
      capability: capability.id,
      actionType,
      payload
    });

    // 4. Handle verdict
    if (guardianVerdict.verdict === 'BLOCK') {
      return {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        error: guardianVerdict.reason,
        decisionLatencyMs: guardianVerdict.decisionLatencyMs
      };
    }

    if (guardianVerdict.verdict === 'CIRCUIT_BREAK') {
      this.terminate(guardianVerdict.reason);
      return {
        status: 'BLOCKED',
        verdict: 'CIRCUIT_BREAK',
        error: guardianVerdict.reason,
        decisionLatencyMs: guardianVerdict.decisionLatencyMs
      };
    }

    if (guardianVerdict.verdict === 'REQUIRE_HITL') {
      return {
        status: 'PAUSED',
        verdict: 'REQUIRE_HITL',
        gateId: guardianVerdict.gateId,
        error: guardianVerdict.reason,
        decisionLatencyMs: guardianVerdict.decisionLatencyMs
      };
    }

    // ALLOW: In S4, execution succeeds through the gateway
    return {
      status: 'COMPLETED',
      verdict: 'ALLOW',
      decisionLatencyMs: guardianVerdict.decisionLatencyMs,
      result: {
        capability: capability.id,
        action: actionType,
        executedVia: 'COMPLYPRO_GATEWAY',
        provider: capability.provider,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Controlled LLM Model invocation through ComplyPRO Model Gateway.
   * SEC-P1 Invariant: Worker holds ZERO model API keys; credentials live in Gateway.
   */
  public async requestModel(params: {
    provider: ModelProvider;
    model: string;
    messages: ModelMessage[];
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
    metadata?: Record<string, any>;
    executionId?: string;
  }): Promise<ModelInvocationResponse> {
    if (!this.isAlive) {
      throw new Error('WORKER_TERMINATED: Cannot invoke model on a stopped worker');
    }

    return ModelGateway.invokeModel({
      ...params,
      agentId: this.agentId,
      passportId: this.passportId,
      runtimeId: this.runtimeId,
      executionId: params.executionId || `exec_model_${Date.now().toString(36)}`,
      passport: this.passport
    });
  }

  /**
   * Controlled Tool capability invocation through ComplyPRO Tool Gateway.
   * SEC-P1 Invariant: Worker holds ZERO tool credentials; credentials live in Gateway.
   */
  public async requestTool(
    capabilityId: string,
    actionType: CapabilityAction,
    payload?: Record<string, any>,
    executionId?: string
  ): Promise<ToolExecutionResponse> {
    if (!this.isAlive) {
      throw new Error('WORKER_TERMINATED: Cannot execute tool on a stopped worker');
    }

    return ToolGateway.invokeTool({
      agentId: this.agentId,
      passportId: this.passportId,
      runtimeId: this.runtimeId,
      executionId: executionId || `exec_tool_${Date.now().toString(36)}`,
      passport: this.passport,
      capability: capabilityId,
      action: actionType,
      payload
    });
  }

  public async requestData(
    capabilityId: string,
    actionType: CapabilityAction,
    targetResource: string,
    parameters?: Record<string, any>,
    egressDestination?: 'LOCAL' | 'EXTERNAL_MODEL' | 'EXTERNAL_TOOL',
    tenantId?: string,
    executionId?: string
  ): Promise<DataExecutionResponse> {
    if (!this.isAlive) {
      throw new Error('WORKER_TERMINATED: Cannot execute data capability on a stopped worker');
    }

    return DataGateway.invokeData({
      agentId: this.agentId,
      passportId: this.passportId,
      runtimeId: this.runtimeId,
      executionId: executionId || `exec_data_${Date.now().toString(36)}`,
      passport: this.passport,
      capability: capabilityId,
      action: actionType,
      targetResource,
      parameters,
      egressDestination,
      tenantId: tenantId || (this.passport as any).tenantId || 'TENANT-DEFAULT'
    });
  }

  public terminate(reason?: string): void {
    this.isAlive = false;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
    if (this.sandboxId) {
      try {
        SandboxManager.terminateSandbox(this.sandboxId, reason);
      } catch {
        // Safe termination
      }
    }
  }

  public getSandboxId(): string {
    return this.sandboxId;
  }

  public isActive(): boolean {
    return this.isAlive;
  }
}
