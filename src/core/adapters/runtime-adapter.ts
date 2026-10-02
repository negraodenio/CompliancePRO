/**
 * ComplyPRO.pt — Sprint 5: Framework-Agnostic Runtime Adapter Interface
 * 
 * Defines standard lifecycle and interception protocols for executing external agent
 * frameworks (CrewAI, LangGraph, etc.) strictly inside an IsolatedWorker perimeter.
 * 
 * Rules:
 * 1. The agent framework NEVER receives raw credentials.
 * 2. The adapter intercepts every tool invocation BEFORE execution.
 * 3. The adapter dispatches the invocation to ComplyPRO Gateways & Guardian.
 * 4. The adapter halts/pauses execution upon REQUIRE_HITL without executing the tool.
 * 5. The adapter only executes the tool when explicitly authorized with ALLOW.
 */

import { GovernanceChannel } from '../guardian-service';
import { CapabilityAction } from '../capability-registry';
import { IsolatedWorker } from '../isolated-worker';
import { AgentPassport } from '../compliance-contract';

export type ExecutionStatus = 'CREATED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'BLOCKED' | 'FAILED';

export interface CapabilityInvocationContext {
  agentId: string;
  runtimeId: string;
  passportId: string;
  executionId: string;
  channel: GovernanceChannel;
  capability: string;
  action: CapabilityAction;
  payload?: Record<string, any>;
}

export interface ExecutionSession {
  executionId: string;
  agentId: string;
  runtimeId: string;
  passportId: string;
  status: ExecutionStatus;
  pauseReason?: string;
  pendingCapability?: string;
  pendingContext?: CapabilityInvocationContext;
  gateId?: string;
  toolExecutionCount: number;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

export interface AgentTask {
  taskId: string;
  description: string;
  actionType: CapabilityAction;
  targetCapability: string;
  payload?: Record<string, any>;
}

export interface AgentExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  toolExecuted: boolean;
  toolExecutionCount: number;
  gateId?: string;
  result?: any;
  error?: string;
  decisionLatencyMs?: number;
}

export interface AgentRuntimeAdapter {
  start(worker: IsolatedWorker): Promise<ExecutionSession>;
  execute(session: ExecutionSession, task: AgentTask): Promise<AgentExecutionResult>;
  pause(session: ExecutionSession, reason: string, gateId?: string): Promise<void>;
  resume(session: ExecutionSession, operatorDecision: 'APPROVED' | 'REJECTED', operatorId: string): Promise<AgentExecutionResult>;
  stop(session: ExecutionSession): Promise<void>;
}
