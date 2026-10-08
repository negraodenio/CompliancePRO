import crypto from 'crypto';
import { IsolatedWorker } from '../isolated-worker';
import { ToolGateway, ToolInvocationContext, ToolExecutionResponse } from '../tool-gateway';
import { EvidenceLedger } from '../evidence-ledger';
import { PassportSigner } from '../passport-signer';
import { DurableStore } from '../../server/db/durable-store';
import { AgentTask, ExecutionSession, AgentExecutionResult } from './runtime-adapter';

// Shared interception path for the two existing adapters. The gateway owns HITL CAS.
export async function persistSession(session: ExecutionSession): Promise<void> {
  const tenant = session.tenantId || 'TENANT-DEFAULT';
  try {
    await EvidenceLedger.flushPendingWrites(tenant);
    if (process.env.NODE_ENV === 'production') await DurableStore.saveExecutionSessionAsync(session, tenant);
    else DurableStore.saveExecutionSession(session, tenant);
  } catch (error) {
    session.status = 'FAILED';
    session.updatedAt = new Date().toISOString();
    throw error;
  }
}

export async function startToolSession(worker: IsolatedWorker, prefix = 'exec'): Promise<ExecutionSession> {
  await EvidenceLedger.prepareTenant(worker.passport.tenantId || 'TENANT-DEFAULT');
  const signature = PassportSigner.verify(worker.passport.passportFingerprint,
    PassportSigner.toSignInput(worker.passport, worker.agentId));
  if (!signature.valid && (prefix === 'exec_nat' || process.env.NODE_ENV === 'production'))
    throw new Error(`PASSPORT_VERIFICATION_FAILED: ${signature.reason}`);
  const now = new Date().toISOString();
  const session: ExecutionSession = {
    executionId: `${prefix}_${crypto.randomBytes(8).toString('hex')}`, agentId: worker.agentId,
    runtimeId: worker.runtimeId, passportId: worker.passportId, status: 'RUNNING',
    toolExecutionCount: 0, createdAt: now, updatedAt: now, tenantId: worker.passport.tenantId || 'TENANT-DEFAULT'
  };
  EvidenceLedger.append({ evidenceId: `ev_start_${crypto.randomUUID()}`, timestamp: now,
    eventType: 'AGENT_EXECUTION_STARTED', executionId: session.executionId, agentId: worker.agentId,
    passportFingerprint: worker.passport.passportFingerprint,
    complianceProfileId: worker.passport.complianceProfileChecksum,
    complianceProfileChecksum: worker.passport.complianceProfileChecksum,
    payloadDigest: crypto.createHash('sha256').update(session.executionId).digest('hex') }, session.tenantId);
  await persistSession(session);
  return session;
}

async function recordResult(worker: IsolatedWorker, session: ExecutionSession, response: ToolExecutionResponse): Promise<AgentExecutionResult> {
  const executed = response.status === 'COMPLETED' && response.verdict === 'ALLOW' && response.providerCallCount === 1;
  if (response.status === 'COMPLETED' && !executed) {
    response = { ...response, status: 'FAILED', error: 'PROVIDER_EXECUTION_UNCONFIRMED: ALLOW is not execution success.' };
  }
  session.status = response.status;
  session.updatedAt = new Date().toISOString();
  if (executed) {
    session.toolExecutionCount++;
    const common = { agentId: worker.agentId, passportFingerprint: worker.passport.passportFingerprint,
      complianceProfileId: worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: worker.passport.complianceProfileChecksum,
      channel: 'TOOL', capability: response.capability, verdict: 'ALLOW' as const,
      executionId: session.executionId,
      executionResult: 'SUCCESS' as const,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify(response.result ?? null)).digest('hex') };
    EvidenceLedger.append({ ...common, evidenceId: `ev_tool_${crypto.randomUUID()}`,
      timestamp: session.updatedAt, eventType: 'TOOL_EXECUTION' }, session.tenantId);
    EvidenceLedger.append({ ...common, evidenceId: `ev_complete_${crypto.randomUUID()}`,
      timestamp: session.updatedAt, eventType: 'AGENT_EXECUTION_COMPLETED' }, session.tenantId);
  } else if (response.status === 'BLOCKED' || response.status === 'FAILED') {
    EvidenceLedger.append({ evidenceId: `ev_denied_${crypto.randomUUID()}`, timestamp: session.updatedAt,
      eventType: response.status === 'BLOCKED' ? 'AGENT_EXECUTION_BLOCKED' : 'EXECUTION_FAILED',
      executionId: session.executionId,
      agentId: worker.agentId, passportFingerprint: worker.passport.passportFingerprint,
      complianceProfileId: worker.passport.complianceProfileChecksum,
      complianceProfileChecksum: worker.passport.complianceProfileChecksum,
      capability: response.capability, verdict: response.verdict,
      executionResult: response.status === 'BLOCKED' ? 'BLOCKED' : 'FAILED' }, session.tenantId);
  }
  await persistSession(session);
  return { executionId: session.executionId, status: session.status, toolExecuted: executed,
    toolExecutionCount: session.toolExecutionCount, gateId: response.gateId || session.gateId,
    result: response.result, error: response.error, decisionLatencyMs: response.decisionLatencyMs };
}

export async function executeToolTask(worker: IsolatedWorker, session: ExecutionSession, task: AgentTask): Promise<AgentExecutionResult> {
  if (session.status !== 'RUNNING') throw new Error(`ILLEGAL_SESSION_STATE: Cannot execute in ${session.status}`);
  const context: ToolInvocationContext = {
    agentId: worker.agentId, runtimeId: worker.runtimeId, passportId: worker.passportId,
    executionId: session.executionId, passport: worker.passport, capability: task.targetCapability,
    action: task.actionType, payload: task.payload, tenantId: session.tenantId
  };
  EvidenceLedger.append({ evidenceId: `ev_request_${crypto.randomUUID()}`, timestamp: new Date().toISOString(),
    eventType: 'CAPABILITY_REQUESTED', executionId: session.executionId, agentId: worker.agentId, passportFingerprint: worker.passport.passportFingerprint,
    complianceProfileId: worker.passport.complianceProfileChecksum,
    complianceProfileChecksum: worker.passport.complianceProfileChecksum,
    capability: task.targetCapability, action: task.actionType }, session.tenantId);
  const response = await worker.requestTool(task.targetCapability, task.actionType, task.payload, session.executionId);
  if (response.status === 'PAUSED') {
    session.pendingCapability = task.targetCapability;
    session.pendingContext = context;
    session.gateId = response.gateId;
    session.pauseReason = response.error || 'REQUIRE_HITL';
  }
  return recordResult(worker, session, response);
}

export async function resumeToolTask(worker: IsolatedWorker, session: ExecutionSession,
  decision: 'APPROVED' | 'REJECTED', operatorId: string): Promise<AgentExecutionResult> {
  if (session.status !== 'PAUSED') throw new Error(`ILLEGAL_SESSION_STATE: Cannot resume ${session.status}`);
  // No second claim or synthetic ALLOW event in the adapter.
  const response = await ToolGateway.resumeExecution(session.executionId, decision, operatorId);
  return recordResult(worker, session, response);
}

export async function stopToolSession(worker: IsolatedWorker, session: ExecutionSession): Promise<void> {
  if (session.status === 'RUNNING') {
    const entries = EvidenceLedger.getEntries(worker.agentId,session.tenantId).filter(entry=>entry.executionId===session.executionId);
    const responseTypes = {MODEL_REQUEST:'MODEL_RESPONSE',TOOL_REQUEST:'TOOL_RESPONSE',DATA_REQUEST:'DATA_RESPONSE'};
    const requests = entries.map((entry,index)=>({entry,index})).filter(({entry})=>entry.eventType in responseTypes);
    const allConfirmed = requests.length>0 && requests.every(({entry,index})=>{
      const next=entries.findIndex((candidate,nextIndex)=>nextIndex>index && candidate.eventType===entry.eventType && candidate.capability===entry.capability);
      return entries.slice(index+1,next<0 ? undefined : next).some(candidate=>candidate.eventType===responseTypes[entry.eventType as keyof typeof responseTypes] &&
        candidate.capability===entry.capability && candidate.executionResult==='SUCCESS');
    });
    const failure=entries.find(entry=>entry.executionResult==='FAILED' || entry.executionResult==='BLOCKED');
    const signature=PassportSigner.verify(worker.passport.passportFingerprint,PassportSigner.toSignInput(worker.passport,worker.agentId));
    const confirmedModel=signature.valid && allConfirmed && !failure;
    session.status = failure?.executionResult==='FAILED' ? 'FAILED' : confirmedModel ? 'COMPLETED' : 'BLOCKED';
    if (confirmedModel) EvidenceLedger.append({ evidenceId:`ev_model_complete_${crypto.randomUUID()}`,
      timestamp:new Date().toISOString(),eventType:'AGENT_EXECUTION_COMPLETED',executionId:session.executionId,
      agentId:worker.agentId,passportFingerprint:worker.passport.passportFingerprint,
      complianceProfileId:worker.passport.complianceProfileChecksum,
      complianceProfileChecksum:worker.passport.complianceProfileChecksum,executionResult:'SUCCESS' },session.tenantId);
  } else if (session.status === 'PAUSED') session.status='BLOCKED';
  session.updatedAt = new Date().toISOString();
  await persistSession(session);
}
