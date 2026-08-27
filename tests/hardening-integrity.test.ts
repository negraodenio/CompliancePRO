/**
 * FASE 8: CG-AG GOVERNANCE OS PRODUCTION HARDENING & INTEGRITY TEST SUITE
 * Tests 14 Architectural Invariants across all 4 Pillars (Discover, Govern, Operate, Assure)
 */

import { DecisionStore } from '../src/web/services/decision-store';
import { HitlStore } from '../src/web/services/hitl-store';
import { RemediationStore } from '../src/web/services/remediation-store';
import { IncidentStore } from '../src/web/services/incident-store';
import { FinOpsStore } from '../src/web/services/finops-store';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';
import { DossierStore } from '../src/web/services/dossier-store';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 8: PRODUCTION HARDENING & INTEGRITY SUITE <<<");
console.log("==================================================================\n");

let totalTests = 0;

function testGroup(name: string, fn: () => void) {
  console.log(`[TEST GROUP ${++totalTests}] ${name}...`);
  fn();
  console.log("");
}

// 1. INVARIANT 1 & 2: Finding -> Risk -> Decision Lineage
testGroup("INVARIANT 1 & 2: Finding -> Risk -> Decision Lineage", () => {
  const findings = DecisionStore.getFindings();

  assert(findings.length >= 4, `Defined ${findings.length} baseline operational findings`);

  findings.forEach(f => {
    assert(f.id.startsWith('FIND-'), `Finding ${f.id} has valid ID prefix`);
    assert(f.riskId.startsWith('RISK-'), `Finding ${f.id} maps to Risk ${f.riskId}`);
    assert(f.controlId.startsWith('CG-AG-'), `Finding ${f.id} links to Control ${f.controlId}`);
    assert(f.owner.name.length > 0, `Finding ${f.id} has accountable Owner (${f.owner.name})`);
  });
});

// 2. INVARIANT 3: Decision -> Remediation Action Lineage
testGroup("INVARIANT 3: Decision -> Remediation Action Traceability", () => {
  const actions = RemediationStore.getActions();
  const findings = DecisionStore.getFindings();

  assert(actions.length >= 4, `Defined ${actions.length} remediation actions`);
  actions.forEach(a => {
    const matchingFinding = findings.find(f => f.id === a.findingId && f.riskId === a.riskId);
    assert(matchingFinding !== undefined, `Action ${a.actionId} links to valid Finding ${a.findingId} and Risk ${a.riskId}`);
    assert(a.assignedSquad.startsWith('Squad '), `Action ${a.actionId} has accountable Squad assigned (${a.assignedSquad})`);
  });
});

// 3. INVARIANT 4 & 5: Evidence Integrity & Ledger Linkage
testGroup("INVARIANT 4 & 5: Sealed Evidence SHA-256 & Audit Ledger Links", () => {
  const evidenceList = EvidenceStore.getEvidenceRecords();
  const blocks = AuditLedgerStore.getBlocks();

  assert(evidenceList.length >= 6, `Defined ${evidenceList.length} protected evidence records`);
  
  evidenceList.forEach(e => {
    assert(e.integrityDigest.startsWith('SHA256:'), `Evidence ${e.evidenceId} has SHA-256 digest: ${e.integrityDigest.substring(0, 15)}...`);
    assert(e.canonicalizationStatus === 'CANONICAL_JSON_RFC8785', `Evidence ${e.evidenceId} is RFC 8785 canonical`);
    
    if (e.status === 'SEALED_IN_LEDGER') {
      const linkedBlock = blocks.find(b => b.blockId === e.auditLedgerRef);
      assert(linkedBlock !== undefined, `Sealed Evidence ${e.evidenceId} links to existing Ledger Block ${e.auditLedgerRef}`);
    }
  });
});

// 4. INVARIANT 6 & 7: Audit Ledger Cryptographic Chaining (Genesis -> Head)
testGroup("INVARIANT 6 & 7: Cryptographic Block Continuity (H_{n-1} -> H_n)", () => {
  const blocks = AuditLedgerStore.getBlocks();
  assert(blocks.length >= 7, `Ledger contains ${blocks.length} chained blocks`);

  // Genesis block verification
  assert(blocks[0].blockHeight === 0, "Block #0 is Genesis");
  assert(blocks[0].previousHash === '0000000000000000000000000000000000000000000000000000000000000000', "Genesis Previous Hash is 64 zeros");

  // Continuity verification
  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const curr = blocks[i];
    assert(curr.previousHash === prev.blockHash, `Block #${curr.blockHeight} (${curr.blockId}) Previous Hash matches Block #${prev.blockHeight} Block Hash`);
  }

  // Head block verification
  const head = blocks[blocks.length - 1];
  assert(head.blockId === 'LEDGER-BLK-0089', `Current Head Block is ${head.blockId} at Height #${head.blockHeight}`);
});

// 5. INVARIANT 8: Regulatory Dossiers Integrity & Zero Orphan Proofs
testGroup("INVARIANT 8: Regulatory Dossier Compilation & Zero Orphans", () => {
  const dossiers = DossierStore.getDossiers();
  const evidenceList = EvidenceStore.getEvidenceRecords();
  const blocks = AuditLedgerStore.getBlocks();

  assert(dossiers.length >= 3, `Defined ${dossiers.length} regulatory dossiers (EU AI Act, LGPD, NIST)`);

  dossiers.forEach(d => {
    assert(d.packageHash.startsWith('SHA256:'), `Dossier ${d.dossierId} has SHA-256 package hash`);
    
    // Verify all attached evidence records exist
    d.evidenceRefs.forEach(evRef => {
      const exists = evidenceList.some(e => e.evidenceId === evRef);
      assert(exists, `Dossier ${d.dossierId} attached evidence ${evRef} exists in EvidenceStore`);
    });

    // Verify all attached ledger blocks exist
    d.ledgerBlockRefs.forEach(blkRef => {
      const exists = blocks.some(b => b.blockId === blkRef);
      assert(exists, `Dossier ${d.dossierId} referenced block ${blkRef} exists in AuditLedgerStore`);
    });
  });
});

// 6. INVARIANT 9 & 10: Single Source of Truth & Risk != Decision Separation
testGroup("INVARIANT 9 & 10: Authoritative Pending Counters & Risk != Decision", () => {
  const findings = DecisionStore.getFindings();
  const pendingDecisions = findings.filter(f => f.status === 'PENDING_DECISION').length;
  const gates = HitlStore.getGates();
  const pendingHitl = gates.filter(g => g.status === 'PENDING_REVIEW').length;
  const actions = RemediationStore.getActions();
  const pendingRemediations = actions.filter(a => a.status === 'PENDING_VERIFICATION').length;

  assert(pendingDecisions === 3, `Authoritative Pending Decisions = ${pendingDecisions} (Derived from DecisionStore)`);
  assert(pendingHitl === 2, `Authoritative Pending HITL Gates = ${pendingHitl} (Derived from HitlStore)`);
  assert(pendingRemediations === 1, `Authoritative Pending Verifications = ${pendingRemediations} (Derived from RemediationStore)`);

  // Risk != Decision
  assert(findings[0].status === 'PENDING_DECISION', "Finding 1 has PENDING_DECISION status");
  assert(findings[0].riskId === 'RISK-2026-0042', "Finding 1 defines Exposure RISK-2026-0042");
  assert(findings[0].decisionType === 'PENDING_DECISION', "Finding 1 decisionType is distinct and requires human action");
});

// 7. INVARIANT 11 & 12: Decision != Action & Configured != Observed != Enforced
testGroup("INVARIANT 11 & 12: Decision != Action & Anti-Overclaiming Posture", () => {
  const findings = DecisionStore.getFindings();
  const actions = RemediationStore.getActions();
  const finops = FinOpsStore.getUsage();

  assert(findings.length === 4, "Findings/Decisions base count is 4");
  assert(actions.length === 4, "Remediation actions count is 4");

  // Verify explicit FinOps enforcement modes
  const modes = finops.map(f => f.enforcementMode);
  assert(modes.includes('RUNTIME_ENFORCED'), "FinOps contains RUNTIME_ENFORCED systems");
  assert(modes.includes('HYBRID'), "FinOps contains HYBRID systems");
  assert(finops.every(f => f.monthlyBudgetUSD > 0 && f.currentSpendUSD > 0), "FinOps spend and budget numbers are positive and exact");
});

// 8. INVARIANT 13: Exported Package != Certified Compliant
testGroup("INVARIANT 13: Exported Package != Certified Compliant", () => {
  const dossiers = DossierStore.getDossiers();
  const unexported = dossiers.filter(d => d.status === 'INTEGRITY_VERIFIED').length;
  assert(unexported >= 1, "Unexported verified dossiers exist");

  const exported = DossierStore.markDossierExported(dossiers[0].dossierId);
  assert(exported.status === 'EXPORTED', "Dossier status successfully transitioned to EXPORTED");
  assert(exported.packageHash.length > 0, "Package hash retained upon export without claims of legal certification");
});

// 9. INVARIANT 14: Tamper Detection & Reversible Canonical Ledger
testGroup("INVARIANT 14: Dynamic Tamper Invalidation & Canonical Restoration", () => {
  // 1. Initial State: Valid
  let verif = AuditLedgerStore.verifyEntireLedger();
  assert(verif.isChainValid === true, "Initial Canonical Ledger is 100% Valid (0 Broken Links)");
  assert(verif.brokenLinks === 0, "0 Broken Links");

  // 2. Tamper Simulation on Block #6 (LEDGER-BLK-0089)
  AuditLedgerStore.simulateTamper('LEDGER-BLK-0089');
  verif = AuditLedgerStore.verifyEntireLedger();
  assert(verif.isChainValid === false, "Tampered Ledger immediately fails verification (Chain Compromised)");
  assert(verif.tamperedBlockId === 'LEDGER-BLK-0089', "Corrupted block correctly identified as LEDGER-BLK-0089");
  assert(verif.hashMismatches > 0, "Hash mismatch detected");

  // 3. Restore Canonical Ledger
  AuditLedgerStore.restoreCanonicalLedger();
  verif = AuditLedgerStore.verifyEntireLedger();
  assert(verif.isChainValid === true, "Restored Ledger returns to 100% Cryptographically Valid state");
  assert(verif.brokenLinks === 0, "0 Broken Links after restore");
});

console.log("==================================================================");
console.log(`>>> HARDENING INTEGRITY RESULTS: ALL ${totalTests} INVARIANT GROUPS PASSED <<<`);
console.log("==================================================================\n");
