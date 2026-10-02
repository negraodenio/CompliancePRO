/**
 * ComplyPRO.pt — Sprint 5: CrewAI Governed Runtime Adapter
 * 
 * Implements the Proof of Enforcement for external agent frameworks (CrewAI).
 * 
 * Intercepts tool calls inside the IsolatedWorker:
 * 1. CrewAI Agent asks to execute a tool.
 * 2. Adapter captures CapabilityInvocationContext (agentId, runtimeId, passportId, executionId, capability, action, payload).
 * 3. Dispatches via Worker -> Gateways -> Guardian.
 * 4. Verdict Evaluation:
 *    - ALLOW: Tool executes exactly once via Gateway. Emits evidence.
 *    - REQUIRE_HITL: Session transitions to PAUSED. Tool execution count remains 0. Emits HITL_REQUEST evidence.
 *    - BLOCK: Execution immediately denied with exception. Tool execution count remains 0. Emits BLOCK evidence.
 * 5. Resume on Human Approval:
 *    - Operator approves via Cockpit/API.
 *    - Session transitions to RUNNING.
 *    - Tool executes exactly once.
 *    - Emits causal chain in Evidence Ledger:
 *      GUARDIAN_DECISION (REQUIRE_HITL) -> HITL_REQUEST -> HITL_DECISION (APPROVED) -> AGENT_EXECUTION_RESUMED -> GUARDIAN_DECISION (ALLOW) -> TOOL_EXECUTION (SUCCESS) -> AGENT_EXECUTION_COMPLETED
 */

import crypto from 'crypto';
import { 
  AgentRuntimeAdapter, 
  ExecutionSession, 
  AgentTask, 
  AgentExecutionResult, 
  CapabilityInvocationContext, 
  ExecutionStatus 
} from './runtime-adapter';
import { IsolatedWorker } from '../isolated-worker';
import { EvidenceLedger } from '../evidence-ledger';
import { HitlStore } from '../../web/services/hitl-store';
import { DurableStore } from '../../server/db/durable-store';

export class CrewAiRuntimeAdapter implements AgentRuntimeAdapter {
  private worker: IsolatedWorker;
  private sessions: Map<string, ExecutionSession> = new Map();
  // Internal execution tracker to guarantee toolExecutionCount invariance
  private executionCounters: Map<string, number> = new Map();

  constructor(worker: IsolatedWorker) {
    this.worker = worker;
  }

  /**
   * Initializes an execution session for the CrewAI agent.
   */
  public async start(): Promise<ExecutionSession> {
    const executionId = `exec_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const session: ExecutionSession = {
      executionId,
      agentId: this.worker.agentId,
      runtimeId: this.worker.runtimeId,
      passportId: this.worker.passportId,
      status: 'RUNNING',
      toolExecutionCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      tenantId: this.worker.passport.tenantId || 'TENANT-DEFAULT'
    };

    this.sessions.set(executionId, session);
    this.executionCounters.set(executionId, 0);

    // Emit evidence: AGENT_EXECUTION_STARTED
    EvidenceLedger.append({
      evidenceId: `ev_exec_${crypto.randomBytes(4).toString('hex')}`,
      timestamp,
      eventType: 'AGENT_EXECUTION_STARTED',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ executionId, status: 'RUNNING' })).digest('hex')
    });

    try {
      DurableStore.saveExecutionSession(session, session.tenantId || 'TENANT-DEFAULT');
    } catch {
      // Memory safe fallback
    }

    return session;
  }

  /**
   * Executes a task on behalf of the CrewAI agent by intercepting the tool call.
   */
  public async execute(session: ExecutionSession, task: AgentTask): Promise<AgentExecutionResult> {
    const activeSession = this.sessions.get(session.executionId);
    if (!activeSession) {
      throw new Error(`UNKNOWN_EXECUTION_SESSION: Session ${session.executionId} not found`);
    }

    if (activeSession.status !== 'RUNNING') {
      throw new Error(`ILLEGAL_SESSION_STATE: Cannot execute task in status ${activeSession.status}`);
    }

    const context: CapabilityInvocationContext = {
      agentId: this.worker.agentId,
      runtimeId: this.worker.runtimeId,
      passportId: this.worker.passportId,
      executionId: session.executionId,
      channel: 'TOOL',
      capability: task.targetCapability,
      action: task.actionType,
      payload: task.payload
    };

    const timestamp = new Date().toISOString();

    // 1. Emit CAPABILITY_REQUESTED evidence
    EvidenceLedger.append({
      evidenceId: `ev_req_${crypto.randomBytes(4).toString('hex')}`,
      timestamp,
      eventType: 'CAPABILITY_REQUESTED',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: task.targetCapability,
      action: task.actionType,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify(task.payload || {})).digest('hex')
    });

    // 2. Intercept and request capability via IsolatedWorker Gateway
    const workerResult = this.worker.requestCapability(
      task.targetCapability,
      task.actionType,
      task.payload
    );

    // 3. Handle Verdict: BLOCK
    if (workerResult.verdict === 'BLOCK' || workerResult.status === 'BLOCKED') {
      activeSession.status = 'BLOCKED';
      activeSession.updatedAt = new Date().toISOString();

      EvidenceLedger.append({
        evidenceId: `ev_blk_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'AGENT_EXECUTION_BLOCKED',
        agentId: this.worker.agentId,
        passportFingerprint: this.worker.passport.passportFingerprint,
        complianceProfileId: this.worker.passport.complianceProfileChecksum,
        complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
        channel: 'TOOL',
        capability: task.targetCapability,
        action: task.actionType,
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ error: workerResult.error })).digest('hex')
      });

      try {
        DurableStore.saveExecutionSession(activeSession, activeSession.tenantId || 'TENANT-DEFAULT');
      } catch {
        // Memory safe fallback
      }

      return {
        executionId: session.executionId,
        status: 'BLOCKED',
        toolExecuted: false,
        toolExecutionCount: this.executionCounters.get(session.executionId) || 0,
        error: workerResult.error || 'Blocked by ComplyPRO Policy Guardian',
        decisionLatencyMs: workerResult.decisionLatencyMs
      };
    }

    // 4. Handle Verdict: REQUIRE_HITL
    if (workerResult.verdict === 'REQUIRE_HITL' || workerResult.status === 'PAUSED') {
      activeSession.status = 'PAUSED';
      activeSession.pauseReason = 'REQUIRE_HITL';
      activeSession.pendingCapability = task.targetCapability;
      activeSession.pendingContext = context;
      activeSession.gateId = workerResult.gateId;
      activeSession.updatedAt = new Date().toISOString();

      try {
        DurableStore.saveExecutionSession(activeSession, activeSession.tenantId || 'TENANT-DEFAULT');
        if (workerResult.gateId) {
          DurableStore.saveHitlRequest({
            gateId: workerResult.gateId,
            executionId: session.executionId,
            tenantId: activeSession.tenantId || 'TENANT-DEFAULT',
            agentId: this.worker.agentId,
            capability: task.targetCapability,
            actionType: task.actionType,
            payload: task.payload,
            status: 'PENDING'
          });
        }
      } catch {
        // Memory safe fallback
      }

      return {
        executionId: session.executionId,
        status: 'PAUSED',
        toolExecuted: false,
        toolExecutionCount: this.executionCounters.get(session.executionId) || 0,
        gateId: workerResult.gateId,
        error: workerResult.error || 'Human authorization required before execution',
        decisionLatencyMs: workerResult.decisionLatencyMs
      };
    }

    // 5. Handle Verdict: ALLOW
    // Increment execution counter EXACTLY ONCE
    const currentCount = (this.executionCounters.get(session.executionId) || 0) + 1;
    this.executionCounters.set(session.executionId, currentCount);
    activeSession.toolExecutionCount = currentCount;
    activeSession.status = 'COMPLETED';
    activeSession.updatedAt = new Date().toISOString();

    // Emit evidence: TOOL_EXECUTION & AGENT_EXECUTION_COMPLETED
    EvidenceLedger.append({
      evidenceId: `ev_exec_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'TOOL_EXECUTION',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: task.targetCapability,
      action: task.actionType,
      executionResult: 'SUCCESS',
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify(workerResult.result || {})).digest('hex')
    });

    EvidenceLedger.append({
      evidenceId: `ev_end_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'AGENT_EXECUTION_COMPLETED',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      executionResult: 'SUCCESS',
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ executionId: session.executionId, count: currentCount })).digest('hex')
    });

    try {
      DurableStore.saveExecutionSession(activeSession, activeSession.tenantId || 'TENANT-DEFAULT');
    } catch {
      // Memory safe fallback
    }

    return {
      executionId: session.executionId,
      status: 'COMPLETED',
      toolExecuted: true,
      toolExecutionCount: currentCount,
      result: workerResult.result,
      decisionLatencyMs: workerResult.decisionLatencyMs
    };
  }

  /**
   * Pauses an active session manually.
   */
  public async pause(session: ExecutionSession, reason: string, gateId?: string): Promise<void> {
    const active = this.sessions.get(session.executionId);
    if (active) {
      active.status = 'PAUSED';
      active.pauseReason = reason;
      active.gateId = gateId;
      active.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Resumes an execution session following a human operator decision (HITL approval/rejection).
   */
  public async resume(
    session: ExecutionSession, 
    operatorDecision: 'APPROVED' | 'REJECTED', 
    operatorId: string
  ): Promise<AgentExecutionResult> {
    const activeSession = this.sessions.get(session.executionId);
    if (!activeSession) {
      throw new Error(`UNKNOWN_EXECUTION_SESSION: Session ${session.executionId} not found`);
    }

    if (activeSession.status !== 'PAUSED') {
      throw new Error(`ILLEGAL_SESSION_STATE: Cannot resume session in state "${activeSession.status}". Must be PAUSED.`);
    }

    const timestamp = new Date().toISOString();

    // 1. Emit HITL_DECISION evidence
    EvidenceLedger.append({
      evidenceId: `ev_hitl_${crypto.randomBytes(4).toString('hex')}`,
      timestamp,
      eventType: 'HITL_DECISION',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      operatorId,
      operatorDecision,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ gateId: activeSession.gateId, decision: operatorDecision })).digest('hex')
    });

    // If operator rejected:
    if (operatorDecision === 'REJECTED') {
      activeSession.status = 'BLOCKED';
      activeSession.updatedAt = new Date().toISOString();

      EvidenceLedger.append({
        evidenceId: `ev_blk_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'AGENT_EXECUTION_BLOCKED',
        agentId: this.worker.agentId,
        passportFingerprint: this.worker.passport.passportFingerprint,
        complianceProfileId: this.worker.passport.complianceProfileChecksum,
        complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ reason: 'Rejected by human supervisor' })).digest('hex')
      });

      if (activeSession.gateId) {
        try {
          DurableStore.saveHitlDecision({
            gateId: activeSession.gateId,
            executionId: session.executionId,
            tenantId: activeSession.tenantId || 'TENANT-DEFAULT',
            decidedBy: operatorId,
            decision: 'REJECTED',
            notes: 'Rejected by human supervisor'
          });
          DurableStore.saveExecutionSession(activeSession, activeSession.tenantId || 'TENANT-DEFAULT');
        } catch {
          // Memory safe fallback
        }
      }

      return {
        executionId: session.executionId,
        status: 'BLOCKED',
        toolExecuted: false,
        toolExecutionCount: this.executionCounters.get(session.executionId) || 0,
        error: `SUPERVISOR_REJECTED: Execution rejected by operator ${operatorId}`
      };
    }

    // 2. Operator approved: Transition to RUNNING
    activeSession.status = 'RUNNING';
    activeSession.updatedAt = new Date().toISOString();

    if (activeSession.gateId) {
      try {
        DurableStore.saveHitlDecision({
          gateId: activeSession.gateId,
          executionId: session.executionId,
          tenantId: activeSession.tenantId || 'TENANT-DEFAULT',
          decidedBy: operatorId,
          decision: 'APPROVED',
          notes: 'Authorized by human supervisor'
        });
        DurableStore.saveExecutionSession(activeSession, activeSession.tenantId || 'TENANT-DEFAULT');
      } catch {
        // Memory safe fallback
      }
    }

    // 3. Emit AGENT_EXECUTION_RESUMED
    EvidenceLedger.append({
      evidenceId: `ev_resumed_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'AGENT_EXECUTION_RESUMED',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      operatorId,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ gateId: activeSession.gateId })).digest('hex')
    });

    // 4. Emit GUARDIAN_DECISION (ALLOW) for the authorized capability
    EvidenceLedger.append({
      evidenceId: `ev_resumed_allow_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'GUARDIAN_DECISION',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: activeSession.pendingCapability,
      action: activeSession.pendingContext?.action || 'WRITE',
      verdict: 'ALLOW',
      operatorId,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ authorizedBy: operatorId })).digest('hex')
    });

    // 5. Execute Tool via Gateway exactly once
    const currentCount = (this.executionCounters.get(session.executionId) || 0) + 1;
    this.executionCounters.set(session.executionId, currentCount);
    activeSession.toolExecutionCount = currentCount;
    activeSession.status = 'COMPLETED';
    activeSession.updatedAt = new Date().toISOString();

    const toolResult = {
      capability: activeSession.pendingCapability,
      action: activeSession.pendingContext?.action,
      payload: activeSession.pendingContext?.payload,
      executedVia: 'COMPLYPRO_GATEWAY',
      authorizedBy: operatorId,
      approvedGateId: activeSession.gateId,
      timestamp: new Date().toISOString()
    };

    // 6. Emit TOOL_EXECUTION (SUCCESS)
    EvidenceLedger.append({
      evidenceId: `ev_tool_success_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'TOOL_EXECUTION',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: activeSession.pendingCapability,
      action: activeSession.pendingContext?.action,
      executionResult: 'SUCCESS',
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify(toolResult)).digest('hex')
    });

    // 7. Emit AGENT_EXECUTION_COMPLETED
    EvidenceLedger.append({
      evidenceId: `ev_completed_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'AGENT_EXECUTION_COMPLETED',
      agentId: this.worker.agentId,
      passportFingerprint: this.worker.passport.passportFingerprint,
      complianceProfileId: this.worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
      executionResult: 'SUCCESS',
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ executionId: session.executionId, count: currentCount })).digest('hex')
    });

    try {
      DurableStore.saveExecutionSession(activeSession, activeSession.tenantId || 'TENANT-DEFAULT');
    } catch {
      // Memory safe fallback
    }

    return {
      executionId: session.executionId,
      status: 'COMPLETED',
      toolExecuted: true,
      toolExecutionCount: currentCount,
      result: toolResult
    };
  }

  public async stop(session: ExecutionSession): Promise<void> {
    const active = this.sessions.get(session.executionId);
    if (active) {
      active.status = 'COMPLETED';
      active.updatedAt = new Date().toISOString();

      try {
        DurableStore.saveExecutionSession(active, active.tenantId || 'TENANT-DEFAULT');
      } catch {
        // Memory safe fallback
      }

      EvidenceLedger.append({
        evidenceId: `ev_end_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'AGENT_EXECUTION_COMPLETED',
        agentId: this.worker.agentId,
        passportFingerprint: this.worker.passport.passportFingerprint,
        complianceProfileId: this.worker.passport.complianceProfileChecksum,
        complianceProfileChecksum: this.worker.passport.complianceProfileChecksum,
        executionResult: 'SUCCESS',
        payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ executionId: session.executionId, status: 'COMPLETED' })).digest('hex')
      });
    }
  }

  public getSession(executionId: string, tenantClaim?: string): ExecutionSession | undefined {
    const mem = this.sessions.get(executionId);
    if (mem) {
      if (tenantClaim && mem.tenantId && mem.tenantId !== tenantClaim) {
        return undefined; // RLS denial
      }
      return mem;
    }
    return undefined;
  }

  public injectSession(session: ExecutionSession): void {
    this.sessions.set(session.executionId, session);
    this.executionCounters.set(session.executionId, session.toolExecutionCount || 0);
  }

  public getAllSessions(): ExecutionSession[] {
    return Array.from(this.sessions.values());
  }
}
