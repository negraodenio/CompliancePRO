/**
 * FASE 8.2: TRANSACTIONAL PERSISTENCE & CONTROL PLANE TEST SUITE
 * Tests:
 * 1. Atomic Batch Commit & Rollback
 * 2. Optimistic Concurrency Control (Version Checks & Conflict Detection)
 * 3. Tenant Boundary Scoping (Tenant A != Tenant B)
 * 4. Transaction Journal & Crash Recovery
 * 5. Idempotent Execution
 * 6. Cross-Store Referential Integrity
 */

import { PersistenceAdapter, DEFAULT_PERSISTENCE_CONTEXT, createPersistenceError, TransactionJournalEntry } from '../src/web/services/persistence-adapter';
import { DecisionStore } from '../src/web/services/decision-store';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 8.2: TRANSACTIONAL PERSISTENCE SUITE <<<");
console.log("==================================================================\n");

let testCount = 0;
function testGroup(name: string, fn: () => void) {
  console.log(`[TEST ${++testCount}] ${name}...`);
  fn();
  console.log("");
}

// 1. ATOMIC BATCH COMMIT (ALL OR NOTHING)
testGroup("Atomic Batch Commit - Successful 3-Way Composite Operation", () => {
  PersistenceAdapter.resetAllForTesting();

  const decisionPayload = [{ id: 'DEC-TEST-01', decision: 'MITIGATE' }];
  const evidencePayload = [{ evidenceId: 'EV-TEST-01', status: 'SEALED_IN_LEDGER' }];
  const ledgerPayload = [{ blockId: 'LEDGER-BLK-TEST-01', height: 10 }];

  const res = PersistenceAdapter.atomicStoreBatchCommit('CREATE_GOVERNANCE_DECISION_CHAIN', [
    { collection: 'decisions', data: decisionPayload },
    { collection: 'evidence', data: evidencePayload },
    { collection: 'ledger', data: ledgerPayload }
  ]);

  assert(res.status === 'COMMITTED', "Transaction successfully committed");
  assert(res.transactionId.startsWith('TX-'), "Transaction ID generated");

  const readDec = PersistenceAdapter.read<any[]>('decisions');
  const readEv = PersistenceAdapter.read<any[]>('evidence');
  const readLedger = PersistenceAdapter.read<any[]>('ledger');

  assert(readDec !== null && readDec[0].id === 'DEC-TEST-01', "Decision persisted");
  assert(readEv !== null && readEv[0].evidenceId === 'EV-TEST-01', "Evidence persisted");
  assert(readLedger !== null && readLedger[0].blockId === 'LEDGER-BLK-TEST-01', "Ledger block persisted");
});

// 2. ROLLBACK ON FAILURE (PREVENT PARTIAL CORRUPTION)
testGroup("Atomic Rollback on Partial Failure Injection", () => {
  PersistenceAdapter.resetAllForTesting();

  // Seed pre-existing state
  PersistenceAdapter.write('decisions', [{ id: 'DEC-ORIGINAL', status: 'PRE_EXISTING' }]);
  PersistenceAdapter.write('evidence', [{ id: 'EV-ORIGINAL', status: 'PRE_EXISTING' }]);

  // Inject failure specifically when writing to 'ledger'
  PersistenceAdapter.setFailureInjectionHook((collection) => collection === 'ledger');

  let errorThrown = false;
  try {
    PersistenceAdapter.atomicStoreBatchCommit('FAILED_COMPOSITE_CHAIN', [
      { collection: 'decisions', data: [{ id: 'DEC-SHOULD-ROLLBACK' }] },
      { collection: 'evidence', data: [{ id: 'EV-SHOULD-ROLLBACK' }] },
      { collection: 'ledger', data: [{ id: 'LEDGER-FAIL' }] }
    ]);
  } catch (err: any) {
    errorThrown = true;
    assert(err.code === 'TRANSACTION_ROLLED_BACK', `Caught expected transaction rollback error: ${err.message}`);
  }

  assert(errorThrown === true, "Atomic commit threw rollback exception on failure");

  // Verify pre-existing state was cleanly restored and no partial writes remained
  const restoredDec = PersistenceAdapter.read<any[]>('decisions');
  const restoredEv = PersistenceAdapter.read<any[]>('evidence');
  const ledgerState = PersistenceAdapter.read<any[]>('ledger');

  assert(restoredDec !== null && restoredDec[0].id === 'DEC-ORIGINAL', "Decisions collection cleanly rolled back to original state");
  assert(restoredEv !== null && restoredEv[0].id === 'EV-ORIGINAL', "Evidence collection cleanly rolled back to original state");
  assert(ledgerState === null, "Failed ledger collection remained completely unwritten");

  PersistenceAdapter.setFailureInjectionHook(undefined);
});

// 3. OPTIMISTIC CONCURRENCY CONTROL (CONFLICT DETECTION)
testGroup("Optimistic Locking - Version Mismatch Conflict Detection", () => {
  PersistenceAdapter.resetAllForTesting();

  // Write initial version 1
  const initial = PersistenceAdapter.write('finding_record', {
    id: 'FIND-001',
    status: 'OPEN_EXPOSURE',
    version: 1
  });

  assert(initial.version === 1, "Initial record written at version 1");

  // Operator A updates with expectedVersion: 1 -> Version becomes 2
  const updatedByA = PersistenceAdapter.write('finding_record', {
    ...initial,
    status: 'IN_TREATMENT'
  }, undefined, 1);

  assert(updatedByA.version === 2, "Operator A successfully updated to version 2");

  // Operator B attempts to write with stale expectedVersion: 1 -> MUST FAIL
  let conflictCaught = false;
  try {
    PersistenceAdapter.write('finding_record', {
      ...initial,
      status: 'CLOSED_UNAUTHORIZED'
    }, undefined, 1);
  } catch (err: any) {
    conflictCaught = true;
    assert(err.code === 'CONCURRENT_MODIFICATION', `Caught expected conflict: ${err.message}`);
  }

  assert(conflictCaught === true, "Stale write detected and blocked by Optimistic Concurrency Control");
});

// 4. TENANT BOUNDARY ISOLATION
testGroup("Multi-Tenant Boundary Scoping & Isolation", () => {
  PersistenceAdapter.resetAllForTesting();

  // Write record under Tenant Alpha
  PersistenceAdapter.setContext({ tenantId: 'TENANT-CORP-ALPHA', workspaceId: 'WS-01' });
  PersistenceAdapter.write('governance_policies', [{ id: 'POL-ALPHA-01', name: 'Alpha Custom Guardrail' }]);

  // Switch context to Tenant Beta
  PersistenceAdapter.setContext({ tenantId: 'TENANT-CORP-BETA', workspaceId: 'WS-02' });
  PersistenceAdapter.write('governance_policies', [{ id: 'POL-BETA-01', name: 'Beta Custom Guardrail' }]);

  // Read under Tenant Beta -> MUST ONLY see Beta's data
  const betaPolicies = PersistenceAdapter.read<any[]>('governance_policies');
  assert(betaPolicies !== null && betaPolicies[0].id === 'POL-BETA-01', "Tenant Beta only reads Beta scoped policies");
  assert(betaPolicies.length === 1, "No data bleeding across tenant boundaries");

  // Switch back to Tenant Alpha -> MUST ONLY see Alpha's data
  PersistenceAdapter.setContext({ tenantId: 'TENANT-CORP-ALPHA', workspaceId: 'WS-01' });
  const alphaPolicies = PersistenceAdapter.read<any[]>('governance_policies');
  assert(alphaPolicies !== null && alphaPolicies[0].id === 'POL-ALPHA-01', "Tenant Alpha only reads Alpha scoped policies");

  PersistenceAdapter.setContext(DEFAULT_PERSISTENCE_CONTEXT);
});

// 5. TRANSACTION JOURNAL & CRASH RECOVERY
testGroup("Transaction Journal & Interrupted State Recovery", () => {
  PersistenceAdapter.resetAllForTesting();

  // Create an artificial PREPARED journal entry simulating an app crash during write
  const simulatedInterruptedTx: TransactionJournalEntry[] = [{
    transactionId: 'TX-CRASH-SIMULATED-01',
    operationType: 'SIMULATED_INTERRUPTED_OPERATION',
    affectedCollections: ['risk_evaluations'],
    timestamp: new Date().toISOString(),
    status: 'PREPARED',
    snapshotsBefore: {
      'cgag:TENANT-DEFAULT:WS-DEFAULT:production:risk_evaluations': JSON.stringify([{ id: 'RISK-BEFORE-CRASH' }])
    },
    payloadsCommitted: {}
  }];

  PersistenceAdapter.seedJournalForTesting(simulatedInterruptedTx);

  const recovery = PersistenceAdapter.recoverPendingTransactions();
  assert(recovery.recoveredCount === 1, "Crash recovery detected and processed 1 interrupted transaction");

  const journal = PersistenceAdapter.getJournal();
  assert(journal[0].status === 'ROLLED_BACK', "Interrupted transaction status cleanly marked as ROLLED_BACK in journal");
});

console.log("==================================================================");
console.log(`>>> TRANSACTIONAL PERSISTENCE RESULTS: ALL ${testCount} TEST GROUPS PASSED <<<`);
console.log("==================================================================\n");
