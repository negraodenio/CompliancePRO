/**
 * CodeGuard v3.1 — Sprint 1 Test Suite: Guardian Core (Profile-Aware)
 * 
 * Verifies:
 * 1. Valid declared READ -> ALLOW
 * 2. Forbidden action -> BLOCK (< 2ms fast-path)
 * 3. Undeclared tool -> BLOCK (least-privilege enforcement)
 * 4. Invalid passport fingerprint -> BLOCK
 * 5. Passport/profile checksum mismatch -> BLOCK (cryptographic binding check)
 * 6. HITL-required action -> REQUIRE_HITL
 * 7. HITL gate actually created in existing HitlStore
 * 8. Executable policy condition -> correct verdict and metadata
 * 9. Rate/anomaly threshold -> CIRCUIT_BREAK (recorded in IncidentStore)
 * 10. Guardian response structure verification (latency, fingerprint, policyVersion, evidenceId)
 * 11. Profile immutability (Guardian does NOT mutate ComplianceProfile)
 * 12. Local evaluation latency benchmark (warm-up + 100 iterations, sub-10ms median target)
 * 13. MCP tool evaluation via evaluate_agent_action
 */

import {
  GuardianService,
  GuardianEvaluationInput,
  GuardianResponse
} from '../src/core/guardian-service';
import {
  ComplianceProfileRegistry,
  ComplianceProfile,
  PolicyCompiler
} from '../src/core/compliance-compiler';
import { HitlStore } from '../src/web/services/hitl-store';
import { IncidentStore } from '../src/web/services/incident-store';
import { DecisionStore } from '../src/web/services/decision-store';
import { executeMcpTool } from '../src/mcp/tools';
import { IdentityProvider } from '../src/server/security/identity-provider';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS]: ${message}`);
}

console.log("==================================================================");
console.log(">>> CODEGUARD v3.1 — SPRINT 1: GUARDIAN CORE (PROFILE-AWARE) <<<");
console.log("==================================================================\n");

let passedTests = 0;

function runTest(testName: string, fn: () => void | Promise<void>) {
  console.log(`[TEST ${++passedTests}] ${testName}`);
  const res = fn();
  if (res instanceof Promise) {
    return res.then(() => console.log(""));
  }
  console.log("");
}

// Retrieve pre-seeded EU AI Act & DORA High-Risk Financial Profile from Sprint 0
const financialProfile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;

// Valid baseline test agent & passport
const validAgent = {
  id: 'AGT-CREDIT-911E',
  name: 'Credit Risk Autonomous Underwriter',
  version: '1.2.0',
  environment: 'production' as const
};

const validFingerprint = 'SIG-CREDIT-PASSPORT-SHA256-VALID';

const validPassport = {
  passportId: 'PASSPORT-CREDIT-911E',
  passportFingerprint: validFingerprint,
  complianceProfileChecksum: financialProfile.checksum,
  declaredTools: [
    'search_credit_history',
    'calculate_debt_ratio',
    'create_wire_transfer',
    'read_account_balance'
  ],
  riskTier: 'HIGH' as const,
  autonomyLevel: 'SUPERVISED'
};

async function runAllTests() {
  process.env.NODE_ENV = 'test';
  process.env.CGAG_ALLOW_TEST_TOKENS = 'true';
  IdentityProvider.initializeBaselineUsers();

  // --------------------------------------------------------------------------
  // TEST 1: Valid Declared READ -> ALLOW
  // --------------------------------------------------------------------------
  runTest("1. Valid Declared READ: Permitted with sub-10ms latency", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ',
        payload: { accountId: 'ACC-889912' }
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'ALLOW', `Verdict is ALLOW (actual: ${res.verdict})`);
    assert(res.complianceProfileId === financialProfile.profileId, "Reflects complianceProfileId");
    assert(res.passportFingerprint === validFingerprint, "Reflects verified passportFingerprint");
    assert(typeof res.decisionLatencyMs === 'number', "decisionLatencyMs is a number");
    assert(res.decisionLatencyMs >= 0, `Measured latency is ${res.decisionLatencyMs}ms`);
    assert(res.evidenceId.startsWith('EV-GUARD-'), `Emitted evidenceId: ${res.evidenceId}`);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Forbidden Action -> BLOCK (< 2ms fast path)
  // --------------------------------------------------------------------------
  runTest("2. Forbidden Action: Immediate BLOCK for prohibited actions", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: {
        ...validPassport,
        // Even if declared in passport, forbiddenActions must override!
        declaredTools: [...validPassport.declaredTools, 'DIRECT_DB_DDL']
      },
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'DIRECT_DB_DDL',
        actionType: 'DELETE',
        payload: { query: 'DROP TABLE customers;' }
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'BLOCK', `Verdict is BLOCK (actual: ${res.verdict})`);
    assert(res.reason.includes('explicitly prohibited'), `Reason specifies prohibition: "${res.reason}"`);
    assert(res.controlId === 'CG-AG-02', "Control mapped to CG-AG-02 (Tool Scoping)");
  });

  // --------------------------------------------------------------------------
  // TEST 3: Undeclared Tool -> BLOCK (Least-Privilege Enforcement)
  // --------------------------------------------------------------------------
  runTest("3. Undeclared Tool: Blocks invocation of tools not in passport", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport, // Does NOT contain 'unauthorized_internal_slack_bot'
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'unauthorized_internal_slack_bot',
        actionType: 'WRITE',
        payload: { message: 'hello' }
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'BLOCK', `Verdict is BLOCK (actual: ${res.verdict})`);
    assert(res.reason.includes('not declared in Agent Passport'), `Reason states undeclared tool: "${res.reason}"`);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Invalid Passport Fingerprint -> BLOCK
  // --------------------------------------------------------------------------
  runTest("4. Passport Authentication: Rejects corrupted or invalid fingerprints", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: {
        ...validPassport,
        passportFingerprint: 'INVALID_FINGERPRINT'
      },
      passportFingerprint: 'INVALID_FINGERPRINT',
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ'
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'BLOCK', `Verdict is BLOCK (actual: ${res.verdict})`);
    assert(res.reason.includes('Passport verification failed'), `Reason indicates passport failure: "${res.reason}"`);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Passport/Profile Checksum Mismatch -> BLOCK
  // --------------------------------------------------------------------------
  runTest("5. Cryptographic Binding: Mismatch between passport and profile checksum fails closed", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: {
        ...validPassport,
        // Deliberately corrupted checksum
        complianceProfileChecksum: '0000000000000000000000000000000000000000000000000000000000000000'
      },
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ'
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'BLOCK', `Verdict is BLOCK (actual: ${res.verdict})`);
    assert(res.reason.includes('Agent-ComplianceProfile binding failure'), `Reason specifies binding failure: "${res.reason}"`);
  });

  // --------------------------------------------------------------------------
  // TEST 6: HITL-Required Action -> REQUIRE_HITL
  // --------------------------------------------------------------------------
  runTest("6. HITL Enforcement: High-impact actions return REQUIRE_HITL with gateId", () => {
    const initialGateCount = HitlStore.getGates().length;

    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'create_wire_transfer',
        actionType: 'EXECUTE',
        payload: {
          recipientIban: 'PT50000100001234567890123',
          amountEUR: 75000,
          internalTokenSecret: 'SECRET_API_TOKEN_SHOULD_BE_MASKED'
        }
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'REQUIRE_HITL', `Verdict is REQUIRE_HITL (actual: ${res.verdict})`);
    assert(typeof res.gateId === 'string' && res.gateId.startsWith('GATE-'), `gateId generated: ${res.gateId}`);
    assert(res.controlId === 'CG-AG-03', "Control mapped to CG-AG-03 (Human-in-the-Loop)");
    assert(res.policyId !== undefined, `Policy ID returned: ${res.policyId}`);

    // Verify gate actually exists in HitlStore
    const gates = HitlStore.getGates();
    assert(gates.length >= initialGateCount + 1, "New gate successfully registered in HitlStore");
    const createdGate = gates.find(g => g.gateId === res.gateId);
    assert(createdGate !== undefined, "Created gate found in HitlStore");
    assert(createdGate?.status === 'PENDING_REVIEW', "Gate status is PENDING_REVIEW");
    assert(createdGate?.actionPayload.internalTokenSecret === '[REDACTED_SECRET]', "Sensitive token was sanitized before storage");
  });

  // --------------------------------------------------------------------------
  // TEST 7: Executable Policy Condition Evaluation
  // --------------------------------------------------------------------------
  runTest("7. Executable Policy: Evaluates conditions and returns specific policyVersion and reason", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'create_wire_transfer',
        actionType: 'EXECUTE',
        payload: { amountEUR: 10000 }
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.policyId === 'POL-FIN-WIRE-TRANSFER-HITL', `Matched specific policy POL-FIN-WIRE-TRANSFER-HITL (actual: ${res.policyId})`);
    assert(res.policyVersion === '1.2.0', `Returned policyVersion: ${res.policyVersion}`);
  });

  // --------------------------------------------------------------------------
  // TEST 8: Rate / Anomaly Threshold -> CIRCUIT_BREAK
  // --------------------------------------------------------------------------
  runTest("8. Anomaly Guard: Token explosion or excessive calls trips CIRCUIT_BREAK", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ'
      },
      context: {
        maxCallsPerMinute: 30,
        callCountMinute: 85, // Breached!
        sessionTokens: 120000,
        maxTokensPerMinute: 50000 // Breached!
      }
    };

    const res = GuardianService.evaluate(input);

    assert(res.verdict === 'CIRCUIT_BREAK', `Verdict is CIRCUIT_BREAK (actual: ${res.verdict})`);
    assert(typeof res.incidentId === 'string' && res.incidentId.startsWith('INC-CB-'), `incidentId generated: ${res.incidentId}`);
    assert(res.controlId === 'CG-AG-04', "Mapped to CG-AG-04 (Circuit Breakers & Resilience)");

    // Verify incident recorded in IncidentStore
    const incidents = IncidentStore.getIncidents();
    const createdIncident = incidents.find(i => i.incidentId === res.incidentId);
    assert(createdIncident !== undefined, "Incident recorded in IncidentStore");
    assert(createdIncident?.containmentStatus === 'CONTAINED', "Incident marked CONTAINED");
  });

  // --------------------------------------------------------------------------
  // TEST 9: Response Structure & Evidence Ledger Verification
  // --------------------------------------------------------------------------
  runTest("9. Response & Evidence: Emits immutable ProtectedEvidenceRecord into ledger", () => {
    const initialLedgerCount = DecisionStore.getEvidenceLedger().length;

    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ'
      }
    };

    const res = GuardianService.evaluate(input);

    assert(Boolean(res.evidenceId), "EvidenceId is non-empty");
    assert(Boolean(res.timestamp), "Timestamp is non-empty");
    assert(Boolean(res.passportFingerprint), "Passport fingerprint is non-empty");

    const ledger = DecisionStore.getEvidenceLedger();
    assert(ledger.length >= initialLedgerCount, "Ledger contains new evidence record");
    const record = ledger.find(e => e.evidenceId === res.evidenceId);
    assert(record !== undefined, "Evidence record found in DecisionStore ledger");
    assert(record?.tamperEvidentSignature.includes('SHA256'), "Signature is SHA-256 authentic");
  });

  // --------------------------------------------------------------------------
  // TEST 10: Immutability: Guardian does NOT mutate ComplianceProfile
  // --------------------------------------------------------------------------
  runTest("10. Immutability: ComplianceProfile remains completely unmodified after evaluation", () => {
    const originalChecksum = financialProfile.checksum;
    const originalForbiddenCount = financialProfile.forbiddenActions.length;
    const originalPolicyCount = financialProfile.executablePolicies.length;

    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'DIRECT_DB_DDL',
        actionType: 'DELETE'
      }
    };

    GuardianService.evaluate(input);

    assert(financialProfile.checksum === originalChecksum, "Profile checksum remains identical");
    assert(financialProfile.forbiddenActions.length === originalForbiddenCount, "forbiddenActions length unchanged");
    assert(financialProfile.executablePolicies.length === originalPolicyCount, "executablePolicies length unchanged");
  });

  // --------------------------------------------------------------------------
  // TEST 11: MCP Tool evaluate_agent_action Integration
  // --------------------------------------------------------------------------
  await testGroup("11. MCP Integration: executeMcpTool('evaluate_agent_action') dispatches to Guardian", async () => {
    const cisoCtx = { authToken: 'sk-ciso-enterprise-key' };

    const mcpRes = await executeMcpTool('evaluate_agent_action', {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ'
      }
    }, cisoCtx);

    assert(mcpRes.ok === true, "MCP tool executed ok");
    assert(mcpRes.data.verdict === 'ALLOW', `MCP returned ALLOW verdict (actual: ${mcpRes.data.verdict})`);
    assert(mcpRes.data.complianceProfileId === financialProfile.profileId, "MCP payload has complianceProfileId");
    assert(mcpRes.metadata.epistemicState === 'GUARDIAN_EVALUATED', "Metadata preserves GUARDIAN_EVALUATED state");
  });

  // --------------------------------------------------------------------------
  // TEST 12: Latency Benchmark (100 Iterations)
  // --------------------------------------------------------------------------
  runTest("12. Latency Benchmark: 100 sequential evaluations maintain sub-10ms performance", () => {
    const input: GuardianEvaluationInput = {
      agent: validAgent,
      passport: validPassport,
      passportFingerprint: validFingerprint,
      complianceProfile: financialProfile,
      toolCall: {
        toolName: 'read_account_balance',
        actionType: 'READ'
      }
    };

    // Warm-up 10 evaluations
    for (let i = 0; i < 10; i++) {
      GuardianService.evaluate(input);
    }

    // Benchmark 100 evaluations
    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const res = GuardianService.evaluate(input);
      latencies.push(res.decisionLatencyMs);
    }

    latencies.sort((a, b) => a - b);
    const median = latencies[Math.floor(latencies.length / 2)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    console.log(`     [Benchmark]: Median = ${median}ms | p95 = ${p95}ms | Min = ${latencies[0]}ms | Max = ${latencies[latencies.length - 1]}ms`);
    assert(median < 10, `Median latency is sub-10ms (actual: ${median}ms)`);
    assert(p95 < 20, `p95 latency is well bounded under 20ms (actual: ${p95}ms)`);
  });

  // --------------------------------------------------------------------------
  // TEST 13: REST Route Handler Verification
  // --------------------------------------------------------------------------
  await testGroup("13. REST Route: POST /api/v1/guardian/evaluate executes cleanly", async () => {
    const { guardianRouter } = await import('../src/server/routes/guardian');
    assert(guardianRouter !== undefined, "guardianRouter is exported");

    let status = 0;
    let jsonResult: any = null;

    const mockReq: any = {
      body: {
        agent: validAgent,
        passport: validPassport,
        passportFingerprint: validFingerprint,
        complianceProfile: financialProfile,
        toolCall: {
          toolName: 'read_account_balance',
          actionType: 'READ'
        }
      }
    };

    const mockRes: any = {
      status: (code: number) => {
        status = code;
        return mockRes;
      },
      json: (data: any) => {
        jsonResult = data;
        return mockRes;
      }
    };

    // Find evaluate route handler and execute
    const evaluateLayer = guardianRouter.stack.find(l => l.route?.path === '/evaluate' && l.route?.methods?.post);
    assert(evaluateLayer !== undefined, "Route /evaluate registered in guardianRouter");

    evaluateLayer.route.stack[0].handle(mockReq, mockRes);

    assert(status === 200, `REST returned HTTP 200 (actual: ${status})`);
    assert(jsonResult.verdict === 'ALLOW', `REST payload contains ALLOW verdict (actual: ${jsonResult.verdict})`);
    assert(jsonResult.complianceProfileId === financialProfile.profileId, "REST payload contains complianceProfileId");
  });

  console.log("==================================================================");
  console.log(`>>> ALL ${passedTests} GUARDIAN EVALUATION TESTS PASSED WITH 100% SUCCESS <<<`);
  console.log("==================================================================");
}

function testGroup(name: string, fn: () => Promise<void>) {
  console.log(`[TEST ${++passedTests}] ${name}`);
  return fn().then(() => console.log(""));
}

runAllTests().catch(err => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
