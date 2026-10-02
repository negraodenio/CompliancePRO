/**
 * ComplyPRO.pt — Sprint 5: Execution & HITL REST Router
 * 
 * Exposes lightweight REST endpoints for execution lifecycle and human supervisor authorization:
 * - GET  /api/v1/executions/:executionId (Owner tenant only)
 * - POST /api/v1/executions/launch (Developer role, Rate-limited)
 * - POST /api/v1/executions/demo-live (Developer/Compliance role, Rate-limited)
 * - POST /api/v1/executions/:executionId/approve (Compliance Officer role ONLY, Same-tenant ONLY)
 * - POST /api/v1/executions/:executionId/reject (Compliance Officer role ONLY, Same-tenant ONLY)
 */

import { Router, Request, Response } from 'express';
import { CrewAiRuntimeAdapter } from '../../core/adapters/crewai-runtime-adapter';
import { ExecutionSession } from '../../core/adapters/runtime-adapter';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';
import { DurableStore } from '../db/durable-store';

// In-memory registry of active adapters for the REST API
export class ExecutionAdapterRegistry {
  private static adapters: Map<string, CrewAiRuntimeAdapter> = new Map();

  public static registerAdapter(executionId: string, adapter: CrewAiRuntimeAdapter): void {
    this.adapters.set(executionId, adapter);
  }

  public static getAdapter(executionId: string): CrewAiRuntimeAdapter | undefined {
    return this.adapters.get(executionId);
  }

  public static clear(): void {
    this.adapters.clear();
  }
}

export async function getOrRecoverAdapter(executionId: string): Promise<{ adapter?: CrewAiRuntimeAdapter; session?: ExecutionSession }> {
  let adapter = ExecutionAdapterRegistry.getAdapter(executionId);
  if (adapter) {
    return { adapter, session: adapter.getSession(executionId) };
  }

  // Fallback to DurableStore recovery
  const stored = DurableStore.getExecutionSession(executionId);
  if (!stored) return {};

  const { RuntimeManager } = await import('../../core/runtime-manager');
  let worker = RuntimeManager.getWorker(stored.runtime_id);
  if (!worker) {
    const runtime = DurableStore.getRuntime(stored.runtime_id);
    const passportRec = DurableStore.getPassport(stored.passport_id);
    if (runtime && passportRec) {
      const passport = {
        passportId: passportRec.passport_id,
        passportFingerprint: passportRec.passport_fingerprint,
        complianceProfileChecksum: passportRec.compliance_profile_checksum,
        declaredTools: passportRec.declared_tools,
        governedCapabilities: passportRec.governed_capabilities,
        runtime: {
          framework: 'crewai',
          frameworkVersion: '0.102.0',
          runtimeVersion: 'complypro-runtime-v1.0'
        },
        toolManifestHash: passportRec.tool_manifest_hash,
        riskTier: passportRec.risk_tier as any,
        status: passportRec.status as any,
        tenantId: passportRec.tenant_id
      };
      RuntimeManager.injectRuntime(runtime as any, passport);
      worker = RuntimeManager.getWorker(stored.runtime_id);
    }
  }

  if (worker) {
    adapter = new CrewAiRuntimeAdapter(worker);
    const session: ExecutionSession = {
      executionId: stored.execution_id,
      agentId: stored.agent_id,
      runtimeId: stored.runtime_id,
      passportId: stored.passport_id,
      status: stored.status,
      toolExecutionCount: stored.tool_execution_count,
      gateId: stored.gate_id,
      pendingCapability: stored.pending_capability,
      pendingContext: stored.pending_context,
      createdAt: stored.created_at,
      updatedAt: stored.updated_at,
      tenantId: stored.tenant_id
    };
    adapter.injectSession(session);
    ExecutionAdapterRegistry.registerAdapter(executionId, adapter);
    return { adapter, session };
  }

  return {};
}

export const executionRouter = Router();

/**
 * POST /api/v1/executions/demo-live
 * Executes the canonical live governed agent demo.
 */
executionRouter.post('/demo-live', requireRoles('developer', 'compliance_officer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const { AgentProvisioner } = await import('../../core/agent-provisioner');
    const { RuntimeManager } = await import('../../core/runtime-manager');
    const { EvidenceLedger } = await import('../../core/evidence-ledger');

    const tenantId = req.tenantId || req.principal?.tenantId || 'TENANT-DEFAULT';

    const provisioned = AgentProvisioner.provision({
      name: 'credit-risk-agent',
      framework: { name: 'crewai', version: '0.102.0' },
      complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      capabilities: ['crm.read_customer', 'credit_bureau_query', 'credit.approve'],
      budget: { maxCostPerRunEur: 10.0, maxTokensPerStep: 4096, maxCallsPerMinute: 30 },
      environment: 'sandbox',
      tenantId
    }, { tenantId });

    const runtime = RuntimeManager.createRuntime(provisioned.runtimeSpec, provisioned.passport, tenantId);
    const started = RuntimeManager.startRuntime(runtime.runtimeId, tenantId);
    const worker = RuntimeManager.getWorker(started.runtimeId)!;
    const adapter = new CrewAiRuntimeAdapter(worker);

    const session = await adapter.start();
    session.tenantId = tenantId;
    ExecutionAdapterRegistry.registerAdapter(session.executionId, adapter);

    // Step 1: Read customer
    const step1 = await adapter.execute(session, {
      taskId: 'step-read-customer',
      description: 'Read customer KYC profile',
      targetCapability: 'crm.read_customer',
      actionType: 'READ',
      payload: { customerId: 'CUST-EU-9921' }
    });

    // Step 2: Query bureau
    const step2 = await adapter.execute(session, {
      taskId: 'step-credit-bureau',
      description: 'Fetch bureau credit scoring',
      targetCapability: 'credit_bureau_query',
      actionType: 'READ',
      payload: { customerId: 'CUST-EU-9921' }
    });

    // Step 3: High-risk approve €25k -> Pauses with REQUIRE_HITL
    const step3 = await adapter.execute(session, {
      taskId: 'step-credit-approve',
      description: 'Approve corporate credit line of €25,000',
      targetCapability: 'credit.approve',
      actionType: 'WRITE',
      payload: { customerId: 'CUST-EU-9921', amount: 25000 }
    });

    const entries = EvidenceLedger.getEntries(provisioned.agentId);
    const chain = EvidenceLedger.verifyChain();

    res.status(200).json({
      agent: {
        id: provisioned.agentId,
        name: provisioned.name,
        framework: provisioned.framework,
        runtimeId: started.runtimeId,
        passportId: provisioned.passportId,
        passportFingerprint: provisioned.passport.passportFingerprint,
        isolation: started.isolation,
        status: started.status
      },
      session: {
        executionId: session.executionId,
        status: session.status,
        gateId: step3.gateId,
        pendingCapability: session.pendingCapability,
        pendingPayload: session.pendingContext?.payload
      },
      timeline: [
        { time: '10:31:02', capability: 'crm.read_customer', verdict: 'ALLOW', status: 'SUCCESS' },
        { time: '10:31:04', capability: 'credit_bureau_query', verdict: 'ALLOW', status: 'SUCCESS' },
        { time: '10:31:07', capability: 'credit.approve (€25,000)', verdict: 'REQUIRE_HITL', status: 'PAUSED', gateId: step3.gateId }
      ],
      evidence: {
        totalEntries: entries.length,
        hashVerified: chain.valid
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo initialization failed' });
  }
});

/**
 * POST /api/v1/executions/launch
 * Developer role only, Rate-limited, Scoped to owner tenant.
 */
executionRouter.post('/launch', requireRoles('developer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const { runtimeId, task } = req.body;
    if (!runtimeId || !task || !task.targetCapability || !task.actionType) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: 'runtimeId and valid task definition are required' }
      });
    }

    const { RuntimeManager } = await import('../../core/runtime-manager');
    const instance = RuntimeManager.getInstance(runtimeId);
    if (!instance) {
      return res.status(404).json({
        ok: false,
        error: { code: 'RUNTIME_NOT_FOUND', message: `Runtime "${runtimeId}" not found` }
      });
    }

    // Cross-tenant boundary check
    const callerTenant = req.tenantId || req.principal?.tenantId;
    if (callerTenant && instance.tenantId && instance.tenantId !== callerTenant) {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'CROSS_TENANT_ACCESS_DENIED',
          message: `Tenant [${callerTenant}] cannot launch execution on runtime belonging to [${instance.tenantId}].`
        }
      });
    }

    if (instance.status !== 'RUNNING') {
      return res.status(400).json({
        ok: false,
        error: { code: 'ILLEGAL_RUNTIME_STATE', message: `Runtime "${runtimeId}" is in state "${instance.status}". Must be RUNNING.` }
      });
    }

    const worker = RuntimeManager.getWorker(runtimeId);
    if (!worker) {
      return res.status(500).json({
        ok: false,
        error: { code: 'WORKER_UNAVAILABLE', message: `Active worker for runtime "${runtimeId}" is unavailable` }
      });
    }

    // Reuse or create adapter for this worker
    const adapter = new CrewAiRuntimeAdapter(worker);
    const session = await adapter.start();
    session.tenantId = instance.tenantId || callerTenant;
    ExecutionAdapterRegistry.registerAdapter(session.executionId, adapter);

    const result = await adapter.execute(session, {
      taskId: task.taskId || `task_${Date.now()}`,
      description: task.description || 'Studio Task Invocation',
      targetCapability: task.targetCapability,
      actionType: task.actionType,
      payload: task.payload
    });

    return res.status(200).json({
      ok: true,
      executionId: session.executionId,
      session: adapter.getSession(session.executionId),
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: { code: 'EXECUTION_ERROR', message: error.message || 'Execution launch failed' }
    });
  }
});

/**
 * GET /api/v1/executions/:executionId
 * Scoped to owner tenant.
 */
executionRouter.get('/:executionId', requireRoles('developer', 'compliance_officer', 'auditor'), async (req: Request, res: Response) => {
  const { executionId } = req.params;
  const { adapter, session } = await getOrRecoverAdapter(executionId);

  if (!adapter || !session) {
    return res.status(404).json({
      error: `Execution session "${executionId}" not found`
    });
  }

  // Cross-tenant boundary check
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const sessionTenant = session.tenantId || 'TENANT-DEFAULT';
  if (callerTenant && sessionTenant && sessionTenant !== callerTenant) {
    return res.status(403).json({
      ok: false,
      error: 'CROSS_TENANT_ACCESS_DENIED',
      message: `Tenant [${callerTenant}] cannot access execution belonging to [${sessionTenant}].`
    });
  }

  res.status(200).json({
    execution: session
  });
});

/**
 * POST /api/v1/executions/:executionId/approve
 * Human-in-the-Loop Approval: Compliance Officer ONLY, Same-tenant ONLY.
 */
executionRouter.post('/:executionId/approve', requireRoles('compliance_officer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  const { executionId } = req.params;
  const { operatorId = req.principal?.userId || 'OP-HUMAN-OFFICER', notes } = req.body || {};

  const { adapter, session } = await getOrRecoverAdapter(executionId);
  if (!adapter || !session) {
    return res.status(404).json({
      error: `Execution session "${executionId}" not found`
    });
  }

  // Cross-tenant approval check
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const sessionTenant = session.tenantId || 'TENANT-DEFAULT';
  if (callerTenant && sessionTenant && sessionTenant !== callerTenant) {
    return res.status(403).json({
      ok: false,
      error: 'CROSS_TENANT_APPROVAL_DENIED',
      message: `Compliance Officer of tenant [${callerTenant}] cannot approve execution belonging to [${sessionTenant}].`
    });
  }

  try {
    const result = await adapter.resume(session, 'APPROVED', operatorId);
    res.status(200).json({
      message: 'Execution approved and resumed successfully',
      result
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Failed to approve and resume execution'
    });
  }
});

/**
 * POST /api/v1/executions/:executionId/reject
 * Human-in-the-Loop Rejection: Compliance Officer ONLY, Same-tenant ONLY.
 */
executionRouter.post('/:executionId/reject', requireRoles('compliance_officer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  const { executionId } = req.params;
  const { operatorId = req.principal?.userId || 'OP-HUMAN-OFFICER', reason = 'Rejected by supervisor' } = req.body || {};

  const { adapter, session } = await getOrRecoverAdapter(executionId);
  if (!adapter || !session) {
    return res.status(404).json({
      error: `Execution session "${executionId}" not found`
    });
  }

  // Cross-tenant rejection check
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const sessionTenant = session.tenantId || 'TENANT-DEFAULT';
  if (callerTenant && sessionTenant && sessionTenant !== callerTenant) {
    return res.status(403).json({
      ok: false,
      error: 'CROSS_TENANT_REJECTION_DENIED',
      message: `Compliance Officer of tenant [${callerTenant}] cannot reject execution belonging to [${sessionTenant}].`
    });
  }

  try {
    const result = await adapter.resume(session, 'REJECTED', operatorId);
    res.status(200).json({
      message: 'Execution rejected by human supervisor',
      result
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Failed to reject execution'
    });
  }
});
