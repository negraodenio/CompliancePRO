/**
 * ComplyPRO.pt — Sprint 8-4: Containerized Worker Sandbox Contract
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Formal definitions for the Worker Sandbox boundary, lifecycle, resource constraints,
 * and security invariants between the Control Plane and Worker Runtimes.
 */

import { CapabilityAction } from '../capability-registry';

export type SandboxLifecycleState =
  | 'CREATED'
  | 'STARTING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'TERMINATED';

export interface SandboxIdentity {
  readonly sandboxId: string;
  readonly agentId: string;
  readonly runtimeInstanceId: string;
  readonly executionSessionId: string;
  readonly tenantId: string;
}

export interface SandboxResourceLimits {
  /** Maximum CPU cores/shares allocated (e.g., 0.5, 1.0) */
  cpu: number;
  /** Maximum RAM in Megabytes */
  memoryMb: number;
  /** Maximum execution duration in seconds before hard watchdog kill */
  maxExecutionSeconds: number;
  /** Maximum concurrent processes/threads (PIDs limit to prevent fork bombs) */
  pidsLimit: number;
  /** Maximum ephemeral disk space in Megabytes */
  diskMb: number;
  /** Network isolation profile */
  networkMode: 'NONE' | 'GATEWAY_ONLY';
}

export interface SandboxSecurityConfig {
  /** Enforces unprivileged execution (e.g. UID 1001 / node user) */
  readonly runAsNonRoot: boolean;
  /** Disallows mounting or accessing Docker socket (/var/run/docker.sock) */
  readonly forbidDockerSocket: boolean;
  /** Strips all host environment variables, service role keys, and cloud credentials */
  readonly stripHostSecrets: boolean;
  /** Root filesystem mount is read-only except designated ephemeral directory */
  readonly readOnlyRootFilesystem: boolean;
  /** Isolated ephemeral scratch directory dedicated solely to this sandbox */
  readonly ephemeralDirectory: string;
}

export interface SandboxConfig {
  identity: SandboxIdentity;
  limits: SandboxResourceLimits;
  security: SandboxSecurityConfig;
  environment: Record<string, string>;
}

export interface SandboxExecutionRequest {
  capabilityId: string;
  action: CapabilityAction;
  payload?: Record<string, any>;
}

export interface SandboxExecutionResponse {
  success: boolean;
  status: SandboxLifecycleState;
  verdict?: 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';
  result?: any;
  error?: string;
  durationMs: number;
  evidenceId?: string;
}

export interface SandboxAuditRecord {
  sandboxId: string;
  agentId: string;
  runtimeInstanceId: string;
  executionSessionId: string;
  tenantId: string;
  state: SandboxLifecycleState;
  timestamp: string;
  exitCode?: number;
  durationMs?: number;
  terminationReason?: string;
  resourceUsage?: {
    memoryMbPeak?: number;
    cpuShares?: number;
    pidsPeak?: number;
  };
}
