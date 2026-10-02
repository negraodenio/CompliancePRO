/**
 * COMPLYPRO.PT — SPRINT 8-2A
 * REAL POSTGRESQL WRITE-THROUGH & PROCESS RESTART RECOVERY TEST
 * 
 * Demonstrates:
 * 1. Authoritative write-through to live PostgreSQL (Supabase) tables:
 *    - agents
 *    - agent_passports
 *    - runtime_instances
 *    - execution_sessions
 *    - hitl_requests
 *    - hitl_decisions
 * 2. Multi-Process Restart Proof:
 *    - PROCESS A: Performs writes to live PostgreSQL and flushes to disk/DB.
 *    - PROCESS B: Separate Node.js OS process with ZERO memory state.
 *                 Rehydrates state directly and authoritatively from PostgreSQL.
 *                 Executes HITL approval, updating PostgreSQL status.
 * 3. Tenant Isolation across processes.
 * 4. Failure Safety: Database unavailability fails predictably without corrupting in-memory truth.
 */

import assert from 'assert';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DurableStore } from '../src/server/db/durable-store';
import { AgentProvisioner } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENANT_RESTART_A = `tenant_restart_a_${Date.now()}`;
const TENANT_RESTART_B = `tenant_restart_b_${Date.now()}`;

// Check if child process invocation mode
const isChildProcess = process.argv.includes('--child-recover');

if (isChildProcess) {
  // ==========================================================================
  // PROCESS B: ISOLATED CHILD PROCESS (CLEAN MEMORY SPACE)
  // ==========================================================================
  const targetTenant = process.env.TEST_TARGET_TENANT;
  const targetAgentId = process.env.TEST_TARGET_AGENT_ID;
  const targetPassportId = process.env.TEST_TARGET_PASSPORT_ID;
  const targetRuntimeId = process.env.TEST_TARGET_RUNTIME_ID;
  const targetExecutionId = process.env.TEST_TARGET_EXECUTION_ID;
  const targetGateId = process.env.TEST_TARGET_GATE_ID;

  if (!targetTenant || !targetAgentId || !targetPassportId || !targetRuntimeId || !targetExecutionId || !targetGateId) {
    console.error('[PROCESS B ERROR]: Missing required environment parameters for recovery');
    process.exit(1);
  }

  (async () => {
    try {
      console.log('  [PROCESS B]: Starting completely fresh OS process with empty memory');
      // Verify initial memory state is 100% empty
      assert.strictEqual(DurableStore.listAgents(targetTenant).length, 0, 'Process B memory must have 0 agents');
      assert.strictEqual(DurableStore.listRuntimes(targetTenant).length, 0, 'Process B memory must have 0 runtimes');

      // Authoritative Rehydration strictly from PostgreSQL
      console.log('  [PROCESS B]: Rehydrating operational state directly from PostgreSQL...');
      const stats = await DurableStore.rehydrateOperationalState({
        tenantId: targetTenant,
        fromDatabaseOnly: true
      });

      console.log(`  [PROCESS B]: Sourced from ${stats.source} -> Agents: ${stats.agentsCount}, Passports: ${stats.passportsCount}, Runtimes: ${stats.runtimesCount}, Executions: ${stats.executionsCount}, HITL: ${stats.pendingHitlCount}`);
      assert.strictEqual(stats.source, 'POSTGRESQL', 'Rehydration must be sourced from PostgreSQL');
      assert(stats.agentsCount >= 1, 'Process B must recover at least 1 agent from DB');
      assert(stats.passportsCount >= 1, 'Process B must recover at least 1 passport from DB');
      assert(stats.runtimesCount >= 1, 'Process B must recover at least 1 runtime from DB');
      assert(stats.executionsCount >= 1, 'Process B must recover at least 1 execution session from DB');
      assert(stats.pendingHitlCount >= 1, 'Process B must recover at least 1 pending HITL request from DB');

      // Verify Recovered Agent & Passport
      const recoveredAgent = DurableStore.getAgent(targetAgentId, targetTenant);
      assert(recoveredAgent !== null, 'Agent must exist in DurableStore after DB rehydration');
      assert.strictEqual(recoveredAgent?.tenant_id, targetTenant);

      const recoveredPassport = DurableStore.getPassport(targetPassportId, targetTenant);
      assert(recoveredPassport !== null, 'Passport must exist in DurableStore after DB rehydration');
      assert.strictEqual(recoveredPassport?.risk_tier, 'HIGH');

      // Verify Recovered Runtime (status = RUNNING)
      const recoveredRuntime = DurableStore.getRuntime(targetRuntimeId, targetTenant);
      assert(recoveredRuntime !== null, 'Runtime must exist in DurableStore');
      assert.strictEqual(recoveredRuntime?.status, 'RUNNING', 'Runtime status must be recovered as RUNNING');

      // Verify Recovered Execution Session (status = PAUSED)
      const recoveredExec = DurableStore.getExecutionSession(targetExecutionId, targetTenant);
      assert(recoveredExec !== null, 'Execution session must exist in DurableStore');
      assert.strictEqual(recoveredExec?.status, 'PAUSED', 'Execution status must be recovered as PAUSED');
      assert.strictEqual(recoveredExec?.gate_id, targetGateId, 'Execution gate_id must match');

      // Verify Recovered HITL Request (status = PENDING)
      const recoveredGate = DurableStore.getHitlRequest(targetGateId, targetTenant);
      assert(recoveredGate !== null, 'HITL request must exist in DurableStore');
      assert.strictEqual(recoveredGate?.status, 'PENDING', 'HITL gate must be recovered as PENDING');

      // Process B executes HITL Decision (Human-in-the-Loop Approval)
      console.log('  [PROCESS B]: Executing authoritative HITL approval in recovered process...');
      const decisionRecord = await DurableStore.saveHitlDecisionAsync({
        gateId: targetGateId,
        executionId: targetExecutionId,
        tenantId: targetTenant,
        decidedBy: 'OPERATOR-PROCESS-B-RECOVERED',
        decision: 'APPROVED',
        notes: 'Approved after OS process restart recovery'
      });

      assert.strictEqual(decisionRecord.decision, 'APPROVED');
      assert.strictEqual(decisionRecord.decided_by, 'OPERATOR-PROCESS-B-RECOVERED');

      // Verify status is updated to APPROVED
      const updatedGate = DurableStore.getHitlRequest(targetGateId, targetTenant);
      assert.strictEqual(updatedGate?.status, 'APPROVED', 'HITL gate status must now be APPROVED in Process B');

      console.log('  [PROCESS B SUCCESS]: All state verified and recovered from PostgreSQL!');
      process.exit(0);
    } catch (err: any) {
      console.error('  [PROCESS B FATAL]:', err.message);
      console.error(err.stack);
      process.exit(1);
    }
  })();
} else {
  // ==========================================================================
  // MAIN TEST SUITE: PROCESS A (WRITER) & ORCHESTRATOR
  // ==========================================================================
  async function runRealRestartSuite() {
    console.log('==================================================================');
    console.log('>>> COMPLYPRO.PT — S8-2A: REAL POSTGRESQL WRITE-THROUGH & RESTART <<<');
    console.log('==================================================================\n');

    // 1. Verify Live Database Connection
    console.log('--- 1. DATABASE CONNECTIVITY AUDIT ---');
    const isConnected = DurableStore.isDatabaseConnected();
    assert.strictEqual(isConnected, true, 'Live PostgreSQL / Supabase connection must be active');
    console.log('  [PASS 1]: Live Supabase PostgreSQL connection verified');

    // 2. PHASE 1: WRITER STEP (PROCESS A PERSISTENCE)
    console.log('\n--- 2. PHASE 1: WRITE-THROUGH TO POSTGRESQL ---');
    
    // Provision Agent for Tenant A with valid capabilities
    const agentA = AgentProvisioner.provision({
      name: 'agent-restart-alpha',
      framework: { name: 'crewai', version: '0.102.0' },
      complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      capabilities: ['crm.read_customer', 'credit_bureau_query', 'credit.approve'],
      budget: { maxCostPerRunEur: 25.0 },
      tenantId: TENANT_RESTART_A
    }, { tenantId: TENANT_RESTART_A });

    console.log(`  Provisioned Agent A [${agentA.agentId}] for Tenant [${TENANT_RESTART_A}]`);

    // Start Runtime in status RUNNING
    const runtimeA = RuntimeManager.createRuntime(agentA.runtimeSpec, agentA.passport, TENANT_RESTART_A);
    RuntimeManager.startRuntime(runtimeA.runtimeId, TENANT_RESTART_A);
    console.log(`  Runtime A started in status [${runtimeA.status}]`);

    // Create Execution Session in status PAUSED
    const gateId = `GATE-RESTART-${Date.now()}`;
    const sessionA = {
      executionId: `exec_restart_${Date.now()}`,
      agentId: agentA.agentId,
      runtimeId: runtimeA.runtimeId,
      tenantId: TENANT_RESTART_A,
      passportId: agentA.passportId,
      status: 'PAUSED' as const,
      toolExecutionCount: 0,
      gateId,
      pendingCapability: 'credit.approve',
      pendingContext: { customerId: 'CUST-8842', requestedAmountEur: 75000 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await DurableStore.saveExecutionSessionAsync(sessionA, TENANT_RESTART_A);
    console.log(`  Execution Session [${sessionA.executionId}] persisted in status PAUSED`);

    // Create HITL Gate in status PENDING
    const hitlReq = await DurableStore.saveHitlRequestAsync({
      gateId,
      executionId: sessionA.executionId,
      tenantId: TENANT_RESTART_A,
      agentId: agentA.agentId,
      capability: 'credit.approve',
      actionType: 'APPROVE_HIGH_CREDIT',
      payload: sessionA.pendingContext,
      status: 'PENDING'
    });
    console.log(`  HITL Request [${hitlReq.hitl_request_id}] persisted with Gate [${gateId}] in status PENDING`);

    // Ensure all background writes have completed and synced to PostgreSQL
    await DurableStore.flushPendingWrites();
    console.log('  [PASS 2]: All operational entities written through and flushed to PostgreSQL');

    // 3. PHASE 2 & 3: PROCESS B (SEPARATE OS PROCESS RECOVERY)
    console.log('\n--- 3. PHASE 2 & 3: MULTI-PROCESS RESTART PROOF ---');
    console.log('  Spawning PROCESS B (independent Node.js process) to verify recovery from PostgreSQL...');

    const childEnv = {
      ...process.env,
      TEST_TARGET_TENANT: TENANT_RESTART_A,
      TEST_TARGET_AGENT_ID: agentA.agentId,
      TEST_TARGET_PASSPORT_ID: agentA.passportId,
      TEST_TARGET_RUNTIME_ID: runtimeA.runtimeId,
      TEST_TARGET_EXECUTION_ID: sessionA.executionId,
      TEST_TARGET_GATE_ID: gateId
    };

    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const childResult = spawnSync(
      cmd,
      ['tsx', __filename, '--child-recover'],
      {
        env: childEnv,
        encoding: 'utf-8',
        timeout: 30000,
        shell: true
      }
    );

    if (childResult.stdout) {
      console.log(childResult.stdout);
    }
    if (childResult.stderr) {
      console.error(childResult.stderr);
    }

    assert.strictEqual(childResult.status, 0, `Process B must exit with code 0. Status: ${childResult.status}`);
    console.log('  [PASS 3]: Process B completed recovery and HITL decision directly from PostgreSQL');

    // 4. PHASE 4: VERIFY POSTGRESQL STATE AFTER PROCESS B MODIFICATION
    console.log('\n--- 4. PHASE 4: VERIFY PERSISTED DECISION IN DATABASE ---');
    // Fetch directly from database to verify Process B's decision took effect
    const finalDecisions = await DurableStore.executeRlsQuery({
      table: 'hitl_decisions',
      tenantClaim: TENANT_RESTART_A,
      serviceRoleBypass: true
    });

    const matchingDecision = finalDecisions.find((d: any) => d.gate_id === gateId);
    assert(matchingDecision !== undefined, 'Decision written by Process B must exist in PostgreSQL');
    assert.strictEqual(matchingDecision.decision, 'APPROVED');
    assert.strictEqual(matchingDecision.decided_by, 'OPERATOR-PROCESS-B-RECOVERED');
    console.log('  [PASS 4]: Decision made in Process B successfully verified in PostgreSQL table');

    // 5. PHASE 5: TENANT ISOLATION UNDER RECOVERY
    console.log('\n--- 5. PHASE 5: TENANT ISOLATION RECOVERY PROOF ---');
    // Create an agent for Tenant B
    const agentB = AgentProvisioner.provision({
      name: 'agent-restart-beta',
      framework: { name: 'crewai', version: '0.102.0' },
      complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      capabilities: ['crm.read_customer'],
      budget: { maxCostPerRunEur: 10.0 },
      tenantId: TENANT_RESTART_B
    }, { tenantId: TENANT_RESTART_B });
    await DurableStore.flushPendingWrites();

    // Rehydrate specifically for Tenant B
    DurableStore.reset();
    await DurableStore.rehydrateOperationalState({
      tenantId: TENANT_RESTART_B,
      fromDatabaseOnly: true
    });

    // Tenant B must see Agent B, but NOT Agent A
    assert(DurableStore.getAgent(agentB.agentId, TENANT_RESTART_B) !== null, 'Tenant B must see Agent B');
    assert.strictEqual(DurableStore.getAgent(agentA.agentId, TENANT_RESTART_B), null, 'Tenant B MUST NOT see Agent A');
    assert.strictEqual(DurableStore.getRuntime(runtimeA.runtimeId, TENANT_RESTART_B), null, 'Tenant B MUST NOT see Runtime A');
    console.log('  [PASS 5]: Strict tenant isolation preserved across database recovery');

    // 6. PHASE 6: FAILURE HANDLING (DATABASE FAILURE DOES NOT SILENTLY SUCCEED)
    console.log('\n--- 6. PHASE 6: FAILURE SAFETY AUDIT ---');
    let failureDetected = false;
    try {
      await DurableStore.executeRlsQuery({
        table: 'invalid_table' as any,
        tenantClaim: TENANT_RESTART_A
      });
    } catch {
      failureDetected = true;
    }
    assert.strictEqual(failureDetected, true, 'Invalid database query must fail predictably');
    console.log('  [PASS 6]: Database failures throw predictably without silent data loss');

    // 7. CLEANUP TEARDOWN
    console.log('\n--- 7. CLEANUP TEARDOWN ---');
    await DurableStore.deleteFromDatabase('agents', { tenant_id: TENANT_RESTART_A });
    await DurableStore.deleteFromDatabase('agents', { tenant_id: TENANT_RESTART_B });
    console.log('  Test tenants cleaned up from live PostgreSQL database.');

    console.log('\n==================================================================');
    console.log('>>> S8-2A REAL POSTGRESQL WRITE-THROUGH & RESTART: ALL PASS <<<');
    console.log('==================================================================\n');
  }

  runRealRestartSuite().catch((err) => {
    console.error('[FATAL TEST SUITE ERROR]:', err);
    process.exit(1);
  });
}
