/** CrewAI governed interception adapter. Execution success comes only from the provider gateway. */
import { AgentRuntimeAdapter, ExecutionSession, AgentTask, AgentExecutionResult } from './runtime-adapter';
import { IsolatedWorker } from '../isolated-worker';
import { startToolSession, executeToolTask, resumeToolTask, persistSession, stopToolSession } from './governed-tool-execution';

export class CrewAiRuntimeAdapter implements AgentRuntimeAdapter {
  private worker: IsolatedWorker;
  private sessions = new Map<string, ExecutionSession>();
  constructor(worker: IsolatedWorker) { this.worker = worker; }
  public async start(): Promise<ExecutionSession> {
    const session = await startToolSession(this.worker);
    this.sessions.set(session.executionId, session);
    return session;
  }
  public async execute(session: ExecutionSession, task: AgentTask): Promise<AgentExecutionResult> {
    return executeToolTask(this.worker, this.requireSession(session.executionId), task);
  }
  public async resume(session: ExecutionSession, decision: 'APPROVED' | 'REJECTED', operatorId: string): Promise<AgentExecutionResult> {
    return resumeToolTask(this.worker, this.requireSession(session.executionId), decision, operatorId);
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
  private requireSession(id: string): ExecutionSession {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`UNKNOWN_EXECUTION_SESSION: ${id}`);
    return session;
  }
}
