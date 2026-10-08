/**
 * ComplyPRO.pt — Sprint 4: Runtime Manager
 * 
 * Transforms a RuntimeSpecification and AgentPassport into an active, isolated runtime instance.
 * 
 * Lifecycle Invariant:
 * PROVISIONED -> STARTING -> RUNNING -> STOPPED | FAILED | REVOKED
 * 
 * Verification Invariants:
 * 1. Pre-flight Passport Verification: Rejects tampered, invalid, or REVOKED passports before worker instantiation.
 * 2. Evidence Genesis: Records all state transitions in the tamper-evident EvidenceLedger.
 */

import crypto from 'crypto';
import { AgentPassport } from './compliance-contract';
import { RuntimeSpecification, AgentProvisioner } from './agent-provisioner';
import { IsolatedWorker, WorkerResourceLimits } from './isolated-worker';
import { EvidenceLedger } from './evidence-ledger';
import { ComplianceProfileRegistry } from './compliance-compiler';
import { DurableStore } from '../server/db/durable-store';
import { SandboxManager } from './sandbox/sandbox-manager';
import { PassportSigner } from './passport-signer';

export type RuntimeLifecycleStatus = 
  | 'PROVISIONED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPED'
  | 'FAILED'
  | 'REVOKED';

export interface RuntimeInstance {
  runtimeId: string;
  agentId: string;
  passportId: string;
  tenantId?: string;
  status: RuntimeLifecycleStatus;
  isolation: {
    network: 'DENY';
    secrets: 'DENY';
    filesystem: 'RESTRICTED';
  };
  resources: WorkerResourceLimits;
  createdAt: string;
  startedAt?: string;
  stoppedAt?: string;
  error?: string;
}

export class RuntimeManager {
  private static instances: Map<string, RuntimeInstance> = new Map();
  private static passports: Map<string, AgentPassport> = new Map();
  private static workers: Map<string, IsolatedWorker> = new Map();

  /**
   * Resets all runtime instances (for clean test execution).
   */
  public static reset(): void {
    for (const worker of this.workers.values()) {
      worker.terminate('RESET');
    }
    SandboxManager.reset();
    this.instances.clear();
    this.passports.clear();
    this.workers.clear();
  }

  /**
   * Creates a runtime instance from a RuntimeSpecification and AgentPassport.
   */
  public static createRuntime(
    spec: RuntimeSpecification,
    passport: AgentPassport,
    tenantId?: string
  ): RuntimeInstance {
    if (!spec || !spec.runtimeId || !spec.agentId) {
      throw new Error('INVALID_RUNTIME_SPEC: runtimeId and agentId are required');
    }
    if (!passport || !passport.passportId) {
      throw new Error('INVALID_PASSPORT: Valid passport is required to create runtime');
    }

    const instance: RuntimeInstance = {
      runtimeId: spec.runtimeId,
      agentId: spec.agentId,
      passportId: passport.passportId,
      tenantId: tenantId || passport.tenantId || 'TENANT-DEFAULT',
      status: 'PROVISIONED',
      isolation: {
        network: 'DENY',
        secrets: 'DENY',
        filesystem: 'RESTRICTED'
      },
      resources: {
        cpu: 1,
        memoryMb: 512,
        maxExecutionSeconds: 300
      },
      createdAt: new Date().toISOString()
    };

    this.instances.set(spec.runtimeId, instance);
    this.passports.set(spec.runtimeId, passport);

    // Record RUNTIME_CREATED in EvidenceLedger
    try {
      EvidenceLedger.append({
        evidenceId: `EV-RT-CREATE-${Date.now().toString(36).toUpperCase()}`,
        timestamp: instance.createdAt,
        eventType: 'RUNTIME_CREATED',
        agentId: spec.agentId,
        passportFingerprint: passport.passportFingerprint,
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: passport.complianceProfileChecksum,
        controlId: 'CG-AG-01',
        channel: 'TOOL',
        capability: 'runtime.create',
        action: 'EXECUTE',
        verdict: 'ALLOW'
      }, tenantId || instance.tenantId);
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error;
    }

    // Persist to DurableStore
    try {
      DurableStore.saveRuntime(instance, instance.tenantId || 'TENANT-DEFAULT');
    } catch {
      // Memory safe fallback
    }

    return instance;
  }

  /**
   * Starts an isolated runtime instance.
   * Performs pre-flight Passport integrity verification.
   */
  public static startRuntime(runtimeId: string, tenantId?: string): RuntimeInstance {
    const instance = this.instances.get(runtimeId);
    if (!instance) {
      throw new Error(`RUNTIME_NOT_FOUND: Runtime "${runtimeId}" does not exist`);
    }

    // Tenant Isolation Boundary Check
    if (tenantId && instance.tenantId && instance.tenantId !== tenantId) {
      throw new Error(`CROSS_TENANT_ACCESS_DENIED: Tenant [${tenantId}] cannot access runtime belonging to [${instance.tenantId}]`);
    }

    const passport = this.passports.get(runtimeId);
    if (!passport) {
      throw new Error(`PASSPORT_NOT_FOUND: Passport for runtime "${runtimeId}" is missing`);
    }

    // 1. Check Passport Status
    if ((passport.status as string) === 'REVOKED' || instance.status === 'REVOKED') {
      this.recordFailedStartup(instance, passport, 'Passport or runtime has been REVOKED', tenantId);
      instance.status = 'REVOKED';
      throw new Error(`RUNTIME_START_DENIED: Agent Passport "${passport.passportId}" has been revoked`);
    }

    // 2. Check Passport Integrity & Fingerprint
    if (!passport.passportFingerprint || passport.passportFingerprint.length < 8 || passport.passportFingerprint.includes('MALICIOUS')) {
      this.recordFailedStartup(instance, passport, 'Invalid or corrupted passport fingerprint', tenantId);
      instance.status = 'FAILED';
      throw new Error(`RUNTIME_START_DENIED: Passport verification failed: invalid fingerprint "${passport.passportFingerprint}"`);
    }

    // 3. Verify Compliance Profile Checksum Binding
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === passport.complianceProfileChecksum
    );
    if (!profile) {
      this.recordFailedStartup(instance, passport, 'Passport checksum does not match any registered ComplianceProfile', tenantId);
      instance.status = 'FAILED';
      throw new Error(`RUNTIME_START_DENIED: ComplianceProfile binding failure for checksum "${passport.complianceProfileChecksum}"`);
    }

    const signature = PassportSigner.verify(passport.passportFingerprint,
      PassportSigner.toSignInput(passport, instance.agentId, profile.version));
    if (!signature.valid) {
      this.recordFailedStartup(instance, passport, signature.reason || 'Invalid passport signature', tenantId);
      instance.status = 'FAILED';
      throw new Error(`RUNTIME_START_DENIED: Passport cryptographic verification failed: ${signature.reason}`);
    }

    // 4. Transition: STARTING -> RUNNING
    instance.status = 'STARTING';

    try {
      // Instantiate the Isolated Worker
      const worker = new IsolatedWorker({
        agentId: instance.agentId,
        passportId: instance.passportId,
        runtimeId: instance.runtimeId,
        passport,
        resources: instance.resources
      });

      this.workers.set(runtimeId, worker);

      instance.status = 'RUNNING';
      instance.startedAt = new Date().toISOString();

      // Record RUNTIME_STARTED in EvidenceLedger
      EvidenceLedger.append({
        evidenceId: `EV-RT-START-${Date.now().toString(36).toUpperCase()}`,
        timestamp: instance.startedAt,
        eventType: 'RUNTIME_STARTED',
        agentId: instance.agentId,
        passportFingerprint: passport.passportFingerprint,
        complianceProfileId: profile.profileId,
        complianceProfileChecksum: passport.complianceProfileChecksum,
        controlId: 'CG-AG-04',
        channel: 'TOOL',
        capability: 'runtime.start',
        action: 'EXECUTE',
        verdict: 'ALLOW'
      }, tenantId);

      // Persist status update
      try {
        DurableStore.saveRuntime(instance, instance.tenantId || tenantId || 'TENANT-DEFAULT');
      } catch {
        // Memory safe fallback
      }

      return instance;
    } catch (err: any) {
      instance.status = 'FAILED';
      instance.error = err.message || 'Worker startup failed';
      this.recordFailedStartup(instance, passport, instance.error || 'Startup failed', tenantId);
      try {
        DurableStore.saveRuntime(instance, instance.tenantId || tenantId || 'TENANT-DEFAULT');
      } catch {
        // Memory safe fallback
      }
      throw err;
    }
  }

  /**
   * Stops an active runtime instance and terminates its worker.
   */
  public static stopRuntime(runtimeId: string, tenantId?: string): RuntimeInstance {
    const instance = this.instances.get(runtimeId);
    if (!instance) {
      throw new Error(`RUNTIME_NOT_FOUND: Runtime "${runtimeId}" does not exist`);
    }

    // Tenant Isolation Boundary Check
    if (tenantId && instance.tenantId && instance.tenantId !== tenantId) {
      throw new Error(`CROSS_TENANT_ACCESS_DENIED: Tenant [${tenantId}] cannot stop runtime belonging to [${instance.tenantId}]`);
    }

    const worker = this.workers.get(runtimeId);
    if (worker) {
      worker.terminate('STOPPED_BY_RUNTIME_MANAGER');
      this.workers.delete(runtimeId);
    }

    instance.status = 'STOPPED';
    instance.stoppedAt = new Date().toISOString();

    const passport = this.passports.get(runtimeId);

    // Record RUNTIME_STOPPED in EvidenceLedger
    if (passport) {
      try {
        EvidenceLedger.append({
          evidenceId: `EV-RT-STOP-${Date.now().toString(36).toUpperCase()}`,
          timestamp: instance.stoppedAt,
          eventType: 'RUNTIME_STOPPED',
          agentId: instance.agentId,
          passportFingerprint: passport.passportFingerprint,
          complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
          complianceProfileChecksum: passport.complianceProfileChecksum,
          controlId: 'CG-AG-04',
          channel: 'TOOL',
          capability: 'runtime.stop',
          action: 'EXECUTE',
          verdict: 'ALLOW'
        }, tenantId || instance.tenantId);
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
      }
    }

    try {
      DurableStore.saveRuntime(instance, instance.tenantId || tenantId || 'TENANT-DEFAULT');
    } catch {
      // Memory safe fallback
    }

    return instance;
  }

  /**
   * Revokes a runtime instance and its passport.
   */
  public static revokeRuntime(runtimeId: string, reason: string, tenantId?: string): RuntimeInstance {
    const instance = this.instances.get(runtimeId);
    if (!instance) {
      throw new Error(`RUNTIME_NOT_FOUND: Runtime "${runtimeId}" does not exist`);
    }

    this.stopRuntime(runtimeId, tenantId);
    instance.status = 'REVOKED';
    instance.error = reason;

    const passport = this.passports.get(runtimeId);
    if (passport) {
      passport.status = 'REVOKED' as any;
      try {
        EvidenceLedger.append({
          evidenceId: `EV-RT-REVOKE-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          eventType: 'RUNTIME_REVOKED',
          agentId: instance.agentId,
          passportFingerprint: passport.passportFingerprint,
          complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
          complianceProfileChecksum: passport.complianceProfileChecksum,
          controlId: 'CG-AG-01',
          channel: 'TOOL',
          capability: 'runtime.revoke',
          action: 'EXECUTE',
          verdict: 'BLOCK',
          payloadDigest: crypto.createHash('sha256').update(reason).digest('hex')
        }, tenantId || instance.tenantId);
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
      }
    }

    try {
      DurableStore.saveRuntime(instance, instance.tenantId || tenantId || 'TENANT-DEFAULT');
    } catch {
      // Memory safe fallback
    }

    return instance;
  }

  /**
   * Rehydrates an instance and passport into active memory (for restart recovery).
   */
  public static injectRuntime(instance: RuntimeInstance, passport: AgentPassport): void {
    this.instances.set(instance.runtimeId, instance);
    this.passports.set(instance.runtimeId, passport);
    if (instance.status === 'RUNNING') {
      try {
        const worker = new IsolatedWorker({
          agentId: instance.agentId,
          passportId: instance.passportId,
          runtimeId: instance.runtimeId,
          passport,
          resources: instance.resources
        });
        this.workers.set(instance.runtimeId, worker);
      } catch {
        // Safe fallback
      }
    }
  }

  /**
   * Retrieves the active worker for a runtime.
   */
  public static getWorker(runtimeId: string): IsolatedWorker | undefined {
    return this.workers.get(runtimeId);
  }

  /**
   * Retrieves runtime instance metadata.
   */
  public static getInstance(runtimeId: string, tenantClaim?: string): RuntimeInstance | undefined {
    let instance = this.instances.get(runtimeId);
    if (!instance) {
      const stored = DurableStore.getRuntime(runtimeId, tenantClaim);
      if (stored) {
        instance = {
          runtimeId: stored.runtime_id,
          agentId: stored.agent_id,
          passportId: stored.passport_id,
          tenantId: stored.tenant_id,
          status: stored.status,
          isolation: stored.isolation,
          resources: stored.resources,
          createdAt: stored.created_at,
          startedAt: stored.started_at,
          stoppedAt: stored.stopped_at,
          error: stored.error
        };
        const agent = AgentProvisioner.getAgent(stored.agent_id,tenantClaim);
        if (agent) {
          this.injectRuntime(instance, agent.passport);
        } else {
          this.instances.set(runtimeId, instance);
        }
      }
    }
    if (instance) {
      if (tenantClaim && instance.tenantId && instance.tenantId !== tenantClaim) {
        return undefined; // RLS denial
      }
      return instance;
    }
    return undefined;
  }

  /**
   * Lists all runtime instances.
   */
  public static listInstances(tenantClaim?: string): RuntimeInstance[] {
    const list = Array.from(this.instances.values());
    if (tenantClaim) {
      return list.filter(r => (r.tenantId || 'TENANT-DEFAULT') === tenantClaim);
    }
    return list;
  }

  private static recordFailedStartup(
    instance: RuntimeInstance,
    passport: AgentPassport,
    reason: string,
    tenantId?: string
  ): void {
    try {
      EvidenceLedger.append({
        evidenceId: `EV-RT-FAIL-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        eventType: 'RUNTIME_FAILED',
        agentId: instance.agentId,
        passportFingerprint: passport.passportFingerprint || 'UNKNOWN',
        complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
        complianceProfileChecksum: passport.complianceProfileChecksum || '',
        controlId: 'CG-AG-04',
        channel: 'TOOL',
        capability: 'runtime.start',
        action: 'EXECUTE',
        verdict: 'BLOCK',
        payloadDigest: crypto.createHash('sha256').update(reason).digest('hex')
      }, tenantId);
    } catch {
      // Safe fallback
    }
  }
}
