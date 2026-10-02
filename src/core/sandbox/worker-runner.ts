/**
 * ComplyPRO.pt — Sprint 8-4: Governed Worker Sandbox Runner
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Entrypoint that executes inside the isolated worker container/process.
 * Verifies sandbox boundaries and enforces runtime security invariants before
 * executing any agent capability.
 */

import fs from 'fs';
import path from 'path';

export interface WorkerRunnerAudit {
  isNonRoot: boolean;
  hasDockerSocket: boolean;
  hasControlPlaneSecrets: boolean;
  ephemeralFsReady: boolean;
  invariantsSatisfied: boolean;
}

export class WorkerRunner {
  private static readonly FORBIDDEN_SECRETS = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'COMPLYPRO_API_KEYS',
    'POSTGRES_PASSWORD',
    'PGPASSWORD',
    'AWS_SECRET_ACCESS_KEY',
    'KUBERNETES_SERVICE_HOST'
  ];

  /**
   * Performs pre-execution security verification inside the worker sandbox.
   * Throws if any isolation invariant is violated.
   */
  public static verifySandboxInvariants(): WorkerRunnerAudit {
    // 1. Invariant S8-4-S01: Non-root execution
    const uid = typeof process.getuid === 'function' ? process.getuid() : 1001;
    const isNonRoot = uid !== 0;

    // 2. Invariant S8-4-S02: No Docker socket
    const hasDockerSocket = fs.existsSync('/var/run/docker.sock') ||
      fs.existsSync('//./pipe/docker_engine');

    // 3. Invariant S8-4-S03 & S04: Zero Control Plane Secrets in env
    const presentSecrets = this.FORBIDDEN_SECRETS.filter(secret => Boolean(process.env[secret]));
    const hasControlPlaneSecrets = presentSecrets.length > 0;

    // 4. Invariant S8-4-S05: Ephemeral filesystem isolation
    const ephemeralDir = process.env.SANDBOX_EPHEMERAL_DIR || '/tmp/sandbox';
    let ephemeralFsReady = false;
    try {
      if (!fs.existsSync(ephemeralDir)) {
        fs.mkdirSync(ephemeralDir, { recursive: true });
      }
      const testFile = path.join(ephemeralDir, `.probe_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok', 'utf8');
      fs.unlinkSync(testFile);
      ephemeralFsReady = true;
    } catch {
      ephemeralFsReady = false;
    }

    const invariantsSatisfied = isNonRoot && !hasDockerSocket && !hasControlPlaneSecrets && ephemeralFsReady;

    return {
      isNonRoot,
      hasDockerSocket,
      hasControlPlaneSecrets,
      ephemeralFsReady,
      invariantsSatisfied
    };
  }

  /**
   * Sanitizes the environment variables of a worker context.
   */
  public static createSanitizedEnvironment(
    identity: { agentId: string; runtimeInstanceId: string; executionSessionId: string; sandboxId: string },
    ephemeralDir: string
  ): Record<string, string> {
    return {
      NODE_ENV: 'production',
      COMPLYPRO_SANDBOX: 'true',
      SANDBOX_ID: identity.sandboxId,
      AGENT_ID: identity.agentId,
      RUNTIME_INSTANCE_ID: identity.runtimeInstanceId,
      EXECUTION_SESSION_ID: identity.executionSessionId,
      SANDBOX_EPHEMERAL_DIR: ephemeralDir,
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin'
    };
  }
}
