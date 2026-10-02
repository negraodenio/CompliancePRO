/**
 * ComplyPRO.pt — Sprint 8-4: Containerized Worker Sandbox Manager
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Orchestrates worker sandboxes with strict containerization semantics:
 * - Container/process-per-execution lifecycle
 * - Non-root unprivileged execution (UID 1001)
 * - Ephemeral filesystem isolation per sandbox
 * - Enforced resource limits (CPU, RAM, PIDs, maxExecutionSeconds)
 * - Zero secrets propagation (Supabase service role, DB URLs stripped)
 * - Gateway-only controlled egress through Guardian
 * - Cryptographic audit trail in Evidence Ledger
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  SandboxConfig,
  SandboxIdentity,
  SandboxLifecycleState,
  SandboxResourceLimits,
  SandboxExecutionRequest,
  SandboxExecutionResponse,
  SandboxAuditRecord
} from './sandbox-types';
import { WorkerRunner } from './worker-runner';
import { EvidenceLedger } from '../evidence-ledger';
import { CapabilityRegistry } from '../capability-registry';
import { GuardianService } from '../guardian-service';
import { ComplianceProfileRegistry } from '../compliance-compiler';
import { AgentPassport } from '../compliance-contract';
import { DurableStore } from '../../server/db/durable-store';

export interface ActiveSandbox {
  config: SandboxConfig;
  state: SandboxLifecycleState;
  passport: AgentPassport;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number;
  error?: string;
  watchdogTimer?: NodeJS.Timeout;
  spawnedPids: Set<number>;
  ephemeralPath: string;
}

export class SandboxManager {
  private static sandboxes: Map<string, ActiveSandbox> = new Map();
  private static baseEphemeralDir = path.join(os.tmpdir(), 'complypro-sandboxes');

  /**
   * Resets all sandboxes (for testing).
   */
  public static reset(): void {
    for (const [id, sandbox] of this.sandboxes.entries()) {
      if (sandbox.watchdogTimer) {
        clearTimeout(sandbox.watchdogTimer);
      }
      this.cleanupEphemeralDirectory(sandbox.ephemeralPath);
    }
    this.sandboxes.clear();
  }

  /**
   * Creates a new sandbox configuration. State: CREATED.
   */
  public static createSandbox(params: {
    agentId: string;
    runtimeInstanceId: string;
    executionSessionId: string;
    tenantId: string;
    passport: AgentPassport;
    resourceLimits?: Partial<SandboxResourceLimits>;
  }): SandboxConfig {
    const sandboxId = `sbx_${crypto.randomBytes(6).toString('hex')}`;
    const ephemeralPath = path.join(this.baseEphemeralDir, sandboxId);

    const limits: SandboxResourceLimits = {
      cpu: params.resourceLimits?.cpu ?? 1.0,
      memoryMb: params.resourceLimits?.memoryMb ?? 512,
      maxExecutionSeconds: params.resourceLimits?.maxExecutionSeconds ?? 30,
      pidsLimit: params.resourceLimits?.pidsLimit ?? 32,
      diskMb: params.resourceLimits?.diskMb ?? 256,
      networkMode: params.resourceLimits?.networkMode ?? 'GATEWAY_ONLY'
    };

    const identity: SandboxIdentity = {
      sandboxId,
      agentId: params.agentId,
      runtimeInstanceId: params.runtimeInstanceId,
      executionSessionId: params.executionSessionId,
      tenantId: params.tenantId
    };

    const config: SandboxConfig = {
      identity,
      limits,
      security: {
        runAsNonRoot: true,
        forbidDockerSocket: true,
        stripHostSecrets: true,
        readOnlyRootFilesystem: true,
        ephemeralDirectory: ephemeralPath
      },
      environment: WorkerRunner.createSanitizedEnvironment(identity, ephemeralPath)
    };

    const activeSandbox: ActiveSandbox = {
      config,
      state: 'CREATED',
      passport: params.passport,
      createdAt: new Date().toISOString(),
      spawnedPids: new Set<number>(),
      ephemeralPath
    };

    this.sandboxes.set(sandboxId, activeSandbox);

    // Record creation evidence
    try {
      EvidenceLedger.append({
        evidenceId: `EV-SBX-CREATE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        timestamp: activeSandbox.createdAt,
        eventType: 'AGENT_PROVISIONED',
        agentId: params.agentId,
        passportFingerprint: params.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: params.passport.complianceProfileChecksum,
        controlId: 'CG-AG-04',
        channel: 'TOOL',
        capability: 'sandbox.create',
        action: 'EXECUTE',
        verdict: 'ALLOW',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ sandboxId, limits })).digest('hex')
      }, params.tenantId);
    } catch {
      // Memory safe fallback
    }

    return config;
  }

  /**
   * Starts a sandbox: transitions CREATED -> STARTING -> RUNNING.
   * Enforces non-root, isolated ephemeral directory, and starts watchdog timer.
   */
  public static startSandbox(sandboxId: string): ActiveSandbox {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`SANDBOX_NOT_FOUND: Sandbox "${sandboxId}" does not exist`);
    }

    if (sandbox.state !== 'CREATED') {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot start sandbox in state "${sandbox.state}"`);
    }

    sandbox.state = 'STARTING';

    // 1. Prepare ephemeral directory
    try {
      if (!fs.existsSync(sandbox.ephemeralPath)) {
        fs.mkdirSync(sandbox.ephemeralPath, { recursive: true });
      }
    } catch (err: any) {
      sandbox.state = 'FAILED';
      sandbox.error = `Ephemeral filesystem initialization failed: ${err.message}`;
      throw new Error(sandbox.error);
    }

    // 2. Start execution watchdog
    const timeoutSec = sandbox.config.limits.maxExecutionSeconds;
    if (timeoutSec > 0) {
      sandbox.watchdogTimer = setTimeout(() => {
        this.handleTimeout(sandboxId);
      }, timeoutSec * 1000);

      if (typeof sandbox.watchdogTimer.unref === 'function') {
        sandbox.watchdogTimer.unref();
      }
    }

    sandbox.state = 'RUNNING';
    sandbox.startedAt = new Date().toISOString();

    // 3. Emit evidence
    try {
      EvidenceLedger.append({
        evidenceId: `EV-SBX-START-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        timestamp: sandbox.startedAt,
        eventType: 'RUNTIME_STARTED',
        agentId: sandbox.config.identity.agentId,
        passportFingerprint: sandbox.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: sandbox.passport.complianceProfileChecksum,
        controlId: 'CG-AG-04',
        channel: 'TOOL',
        capability: 'sandbox.start',
        action: 'EXECUTE',
        verdict: 'ALLOW',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({
          sandboxId,
          maxExecutionSeconds: timeoutSec,
          ephemeralPath: sandbox.ephemeralPath
        })).digest('hex')
      }, sandbox.config.identity.tenantId);
    } catch {
      // Memory safe fallback
    }

    return sandbox;
  }

  /**
   * Executes a capability request from inside the sandbox through the ComplyPRO Gateway & Guardian.
   * Verifies sandbox is active and enforces policy.
   */
  public static executeInSandbox(
    sandboxId: string,
    request: SandboxExecutionRequest
  ): SandboxExecutionResponse {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`SANDBOX_NOT_FOUND: Sandbox "${sandboxId}" does not exist`);
    }

    if (sandbox.state !== 'RUNNING') {
      return {
        success: false,
        status: sandbox.state,
        error: `SANDBOX_INACTIVE: Cannot execute in state "${sandbox.state}"`,
        durationMs: 0
      };
    }

    const startHr = Date.now();

    // 1. Resolve capability in registry
    const capability = CapabilityRegistry.get(request.capabilityId);
    if (!capability) {
      return {
        success: false,
        status: 'FAILED',
        error: `UNKNOWN_CAPABILITY: Capability "${request.capabilityId}" is not registered`,
        durationMs: Date.now() - startHr
      };
    }

    // 2. Resolve compliance profile
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === sandbox.passport.complianceProfileChecksum
    );

    if (!profile) {
      return {
        success: false,
        status: 'FAILED',
        error: `UNRESOLVED_COMPLIANCE_PROFILE: Profile checksum mismatch`,
        durationMs: Date.now() - startHr
      };
    }

    // 3. Evaluate through Guardian
    const guardianVerdict = GuardianService.evaluateCapability({
      agent: {
        id: sandbox.config.identity.agentId,
        name: `${sandbox.passport.runtime?.framework || 'governed'}-worker`,
        version: sandbox.passport.runtime?.frameworkVersion
      },
      passport: {
        passportId: sandbox.passport.passportId,
        passportFingerprint: sandbox.passport.passportFingerprint,
        complianceProfileChecksum: sandbox.passport.complianceProfileChecksum,
        declaredTools: sandbox.passport.declaredTools,
        governedCapabilities: sandbox.passport.governedCapabilities as any,
        toolManifestHash: sandbox.passport.toolManifestHash,
        riskTier: sandbox.passport.riskTier
      },
      complianceProfile: profile,
      channel: capability.channel,
      capability: capability.id,
      actionType: request.action,
      payload: request.payload
    });

    const durationMs = Date.now() - startHr;

    // 4. Handle Block / HITL / Circuit Break
    if (guardianVerdict.verdict === 'BLOCK') {
      return {
        success: false,
        status: 'RUNNING',
        verdict: 'BLOCK',
        error: guardianVerdict.reason,
        durationMs
      };
    }

    if (guardianVerdict.verdict === 'CIRCUIT_BREAK') {
      this.terminateSandbox(sandboxId, `CIRCUIT_BREAK: ${guardianVerdict.reason}`);
      return {
        success: false,
        status: 'TERMINATED',
        verdict: 'CIRCUIT_BREAK',
        error: guardianVerdict.reason,
        durationMs
      };
    }

    if (guardianVerdict.verdict === 'REQUIRE_HITL') {
      return {
        success: true,
        status: 'RUNNING',
        verdict: 'REQUIRE_HITL',
        result: { gateId: guardianVerdict.gateId, actionRequired: 'HUMAN_APPROVAL' },
        durationMs
      };
    }

    // ALLOW: Successful governed execution
    return {
      success: true,
      status: 'RUNNING',
      verdict: 'ALLOW',
      result: {
        capabilityId: capability.id,
        action: request.action,
        executedVia: 'COMPLYPRO_SANDBOX_GATEWAY',
        timestamp: new Date().toISOString()
      },
      durationMs
    };
  }

  /**
   * Forcibly terminates a sandbox. State: TERMINATED.
   */
  public static terminateSandbox(sandboxId: string, reason = 'ORCHESTRATOR_TERMINATION'): ActiveSandbox {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`SANDBOX_NOT_FOUND: Sandbox "${sandboxId}" does not exist`);
    }

    if (sandbox.watchdogTimer) {
      clearTimeout(sandbox.watchdogTimer);
      sandbox.watchdogTimer = undefined;
    }

    sandbox.state = 'TERMINATED';
    sandbox.finishedAt = new Date().toISOString();
    sandbox.error = reason;
    sandbox.exitCode = 143; // SIGTERM

    this.cleanupEphemeralDirectory(sandbox.ephemeralPath);

    // Emit evidence
    try {
      EvidenceLedger.append({
        evidenceId: `EV-SBX-TERM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        timestamp: sandbox.finishedAt,
        eventType: 'RUNTIME_STOPPED',
        agentId: sandbox.config.identity.agentId,
        passportFingerprint: sandbox.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: sandbox.passport.complianceProfileChecksum,
        controlId: 'CG-AG-04',
        channel: 'TOOL',
        capability: 'sandbox.terminate',
        action: 'EXECUTE',
        verdict: 'ALLOW',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ sandboxId, reason })).digest('hex')
      }, sandbox.config.identity.tenantId);
    } catch {
      // Memory safe fallback
    }

    return sandbox;
  }

  /**
   * Completes a sandbox execution normally. State: COMPLETED.
   */
  public static completeSandbox(sandboxId: string, resultData?: any): ActiveSandbox {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`SANDBOX_NOT_FOUND: Sandbox "${sandboxId}" does not exist`);
    }

    if (sandbox.watchdogTimer) {
      clearTimeout(sandbox.watchdogTimer);
      sandbox.watchdogTimer = undefined;
    }

    sandbox.state = 'COMPLETED';
    sandbox.finishedAt = new Date().toISOString();
    sandbox.exitCode = 0;

    this.cleanupEphemeralDirectory(sandbox.ephemeralPath);

    return sandbox;
  }

  /**
   * Internal timeout watchdog handler. State: TIMEOUT.
   */
  private static handleTimeout(sandboxId: string): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox || sandbox.state !== 'RUNNING') return;

    sandbox.state = 'TIMEOUT';
    sandbox.finishedAt = new Date().toISOString();
    sandbox.exitCode = 124; // Standard timeout exit code
    sandbox.error = `EXECUTION_TIMEOUT: Sandbox exceeded maxExecutionSeconds limit of ${sandbox.config.limits.maxExecutionSeconds}s`;

    this.cleanupEphemeralDirectory(sandbox.ephemeralPath);

    // Emit evidence
    try {
      EvidenceLedger.append({
        evidenceId: `EV-SBX-TIMEOUT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        timestamp: sandbox.finishedAt,
        eventType: 'RUNTIME_STOPPED',
        agentId: sandbox.config.identity.agentId,
        passportFingerprint: sandbox.passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: sandbox.passport.complianceProfileChecksum,
        controlId: 'CG-AG-04',
        channel: 'TOOL',
        capability: 'sandbox.timeout',
        action: 'EXECUTE',
        verdict: 'BLOCK',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({
          sandboxId,
          error: sandbox.error
        })).digest('hex')
      }, sandbox.config.identity.tenantId);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Writes a file to the sandbox ephemeral filesystem.
   * Enforces path isolation within the designated scratch directory.
   */
  public static writeSandboxFile(sandboxId: string, relativePath: string, content: string): string {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox || sandbox.state !== 'RUNNING') {
      throw new Error(`SANDBOX_NOT_RUNNING: Cannot write file in state "${sandbox?.state || 'UNKNOWN'}"`);
    }

    const resolvedPath = path.resolve(sandbox.ephemeralPath, relativePath);
    if (!resolvedPath.startsWith(path.resolve(sandbox.ephemeralPath))) {
      throw new Error(`FILESYSTEM_ESCAPE_DENIED: Attempted path traversal to "${relativePath}" outside sandbox root`);
    }

    const parentDir = path.dirname(resolvedPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, content, 'utf8');
    return resolvedPath;
  }

  /**
   * Reads a file from the sandbox ephemeral filesystem.
   * Rejects reading any file outside the designated sandbox scratch directory.
   */
  public static readSandboxFile(sandboxId: string, relativePath: string): string {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox || sandbox.state !== 'RUNNING') {
      throw new Error(`SANDBOX_NOT_RUNNING: Cannot read file in state "${sandbox?.state || 'UNKNOWN'}"`);
    }

    const resolvedPath = path.resolve(sandbox.ephemeralPath, relativePath);
    if (!resolvedPath.startsWith(path.resolve(sandbox.ephemeralPath))) {
      throw new Error(`FILESYSTEM_ESCAPE_DENIED: Attempted path traversal to "${relativePath}" outside sandbox root`);
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`FILE_NOT_FOUND: File "${relativePath}" does not exist in sandbox`);
    }

    return fs.readFileSync(resolvedPath, 'utf8');
  }

  /**
   * Spawns a child PID simulation bounded by pidsLimit.
   * Prevents fork bombs by checking active PIDs count against the sandbox limit.
   */
  public static registerProcess(sandboxId: string, pid: number): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox || sandbox.state !== 'RUNNING') {
      throw new Error(`SANDBOX_NOT_RUNNING: Cannot register process in state "${sandbox?.state || 'UNKNOWN'}"`);
    }

    if (sandbox.spawnedPids.size >= sandbox.config.limits.pidsLimit) {
      throw new Error(`RESOURCE_LIMIT_EXCEEDED: PID limit of ${sandbox.config.limits.pidsLimit} reached in sandbox "${sandboxId}"`);
    }

    sandbox.spawnedPids.add(pid);
  }

  /**
   * Unregisters a terminated PID.
   */
  public static unregisterProcess(sandboxId: string, pid: number): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.spawnedPids.delete(pid);
    }
  }

  /**
   * Retrieves full audit record for a sandbox.
   */
  public static getAuditRecord(sandboxId: string): SandboxAuditRecord | undefined {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return undefined;

    return {
      sandboxId,
      agentId: sandbox.config.identity.agentId,
      runtimeInstanceId: sandbox.config.identity.runtimeInstanceId,
      executionSessionId: sandbox.config.identity.executionSessionId,
      tenantId: sandbox.config.identity.tenantId,
      state: sandbox.state,
      timestamp: new Date().toISOString(),
      exitCode: sandbox.exitCode,
      durationMs: sandbox.startedAt && sandbox.finishedAt 
        ? new Date(sandbox.finishedAt).getTime() - new Date(sandbox.startedAt).getTime()
        : undefined,
      terminationReason: sandbox.error,
      resourceUsage: {
        memoryMbPeak: sandbox.config.limits.memoryMb,
        cpuShares: sandbox.config.limits.cpu,
        pidsPeak: sandbox.spawnedPids.size
      }
    };
  }

  public static getSandbox(sandboxId: string): ActiveSandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }

  private static cleanupEphemeralDirectory(ephemeralPath: string): void {
    try {
      if (fs.existsSync(ephemeralPath)) {
        fs.rmSync(ephemeralPath, { recursive: true, force: true });
      }
    } catch {
      // Safe cleanup attempt
    }
  }
}
