/** NAT governed interception adapter. Uses the same existing gateway/CAS as CrewAI. */
import { AgentRuntimeAdapter, ExecutionSession, AgentTask, AgentExecutionResult } from './runtime-adapter';
import { IsolatedWorker } from '../isolated-worker';
import { ModelProvider, ModelMessage, ModelInvocationResponse } from '../model-gateway';
import { startToolSession, executeToolTask, resumeToolTask, persistSession, stopToolSession } from './governed-tool-execution';

export class NatRuntimeAdapter implements AgentRuntimeAdapter {
  public readonly worker: IsolatedWorker;
  private sessions = new Map<string, ExecutionSession>();
  private modelInferenceCounters = new Map<string, number>();
  constructor(worker: IsolatedWorker) { this.worker = worker; }
  public async start(): Promise<ExecutionSession> {
    const session = await startToolSession(this.worker, 'exec_nat');
    this.sessions.set(session.executionId, session);
    return session;
  }
  public async execute(session: ExecutionSession, task: AgentTask): Promise<AgentExecutionResult> {
    return executeToolTask(this.worker, this.requireSession(session.executionId), task);
  }
  public async resume(session: ExecutionSession, decision: 'APPROVED' | 'REJECTED', operatorId: string): Promise<AgentExecutionResult> {
    return resumeToolTask(this.worker, this.requireSession(session.executionId), decision, operatorId);
  }
  public async invokeModel(session: ExecutionSession, params: {
    provider: ModelProvider; model: string; messages: ModelMessage[]; maxTokens?: number; temperature?: number;
  }): Promise<ModelInvocationResponse> {
    const current = this.requireSession(session.executionId);
    if (current.status !== 'RUNNING') throw new Error(`ILLEGAL_SESSION_STATE: Cannot invoke model in ${current.status}`);
    const response = await this.worker.requestModel({ ...params, executionId: current.executionId });
    if (response.status === 'COMPLETED' && response.providerCallCount === 1) this.modelInferenceCounters.set(current.executionId,
      this.getModelInferenceCount(current.executionId) + 1);
    return response;
  }
  public async pause(session: ExecutionSession, reason: string, gateId?: string): Promise<void> {
    const current = this.requireSession(session.executionId);
    current.status = 'PAUSED'; current.pauseReason = reason; current.gateId = gateId;
    current.updatedAt = new Date().toISOString();
    await persistSession(current);
  }
  public async stop(session: ExecutionSession): Promise<void> {
    const current = this.requireSession(session.executionId);
    await stopToolSession(this.worker,current);
  }
  public getSession(id: string, tenantClaim?: string): ExecutionSession | undefined {
    const session = this.sessions.get(id);
    return session && (!tenantClaim || session.tenantId === tenantClaim) ? session : undefined;
  }
  public injectSession(session: ExecutionSession): void { this.sessions.set(session.executionId, session); }
  public getAllSessions(): ExecutionSession[] { return [...this.sessions.values()]; }
  public getToolExecutionCount(id: string): number { return this.sessions.get(id)?.toolExecutionCount || 0; }
  public getModelInferenceCount(id: string): number { return this.modelInferenceCounters.get(id) || 0; }
  private requireSession(id: string): ExecutionSession {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`UNKNOWN_EXECUTION_SESSION: ${id}`);
    return session;
  }
}
