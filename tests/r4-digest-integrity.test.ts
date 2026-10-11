/**
 * COMPLYPRO R4 - EVIDENCE DIGEST INTEGRITY & VIEW TRUTHFULNESS SUITE
 *
 * [A] evidence-digest helper: genuine SHA-256 over canonical JSON, explicit
 *     UNAVAILABLE sentinel on failure, strict format validation. Never a
 *     fabricated value.
 * [B] Baseline fixtures stay readable and untouched (captured before any
 *     runtime mutation in this process).
 * [C] Runtime evidence minters (DecisionStore, IncidentStore, RemediationStore,
 *     FinOpsStore, PolicyStore): every digest is a recomputable SHA-256 over
 *     stored fields, verified here by an INDEPENDENT node:crypto recompute-
 *     and-compare, including tamper cases (altered content must fail match).
 * [D] Scan governance bridge: identifier-embedded pseudo-digests
 *     (DIGEST-SCAN-/SHADOW-/PII-) replaced by genuine computed digests.
 * [E] Views: fabricated fallbacks/hardcoded hex removed; every digest render
 *     gated on computed-digest validation; unconditional chain/verification
 *     claims replaced with honest conditional text.
 * [F] Fabricated Math.random digest minters removed from runtime stores;
 *     genuine verification paths (guardian SHA-256, EvidenceStore
 *     verifyRecordIntegrity) left intact.
 * [G] R4 suite wired into the governance runner.
 *
 * TEST-only. No network, no production, no secrets.
 */
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

import { DecisionStore } from '../src/web/services/decision-store';
import { IncidentStore } from '../src/web/services/incident-store';
import { RemediationStore } from '../src/web/services/remediation-store';
import { FinOpsStore } from '../src/web/services/finops-store';
import { PolicyStore } from '../src/web/services/policy-store';
import {
  computeEvidenceDigest,
  isComputedEvidenceDigest,
  hasCryptographicDigest,
  EVIDENCE_DIGEST_UNAVAILABLE
} from '../src/web/services/evidence-digest';

const read = (...parts: string[]): string =>
  readFileSync(path.join(process.cwd(), ...parts), 'utf8');

const decisionSource = read('src', 'web', 'services', 'decision-store.ts');
const finopsSource = read('src', 'web', 'services', 'finops-store.ts');
const incidentSource = read('src', 'web', 'services', 'incident-store.ts');
const remediationSource = read('src', 'web', 'services', 'remediation-store.ts');
const policySource = read('src', 'web', 'services', 'policy-store.ts');
const bridgeSource = read('src', 'web', 'services', 'scan-governance-bridge.ts');
const guardianSource = read('src', 'core', 'guardian-service.ts');
const evidenceStoreSource = read('src', 'web', 'services', 'evidence-store.ts');
const runnerSource = read('tests', 'run-governance-suites.mjs');
const gcView = read('src', 'web', 'views', 'GovernanceCenter.tsx');
const dpvView = read('src', 'web', 'views', 'DecisionsPipelineView.tsx');
const polView = read('src', 'web', 'views', 'PolicyEngineView.tsx');
const incView = read('src', 'web', 'views', 'IncidentsFailsafeView.tsx');
const remView = read('src', 'web', 'views', 'RemediationActionsView.tsx');
const finView = read('src', 'web', 'views', 'RuntimeFinOpsView.tsx');
const riskView = read('src', 'web', 'views', 'RiskEngineView.tsx');

/** Independent SHA-256 recompute - node:crypto, not the app implementation. */
const independentDigest = (payload: object): string =>
  `SHA256:${createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex')}`;

let checks = 0;
const check = (name: string, fn: () => void) => {
  fn();
  checks++;
  console.log(`  [PASS ${checks}]: ${name}`);
};
const done = (msg: string) => {
  console.log(`\n>>> R4 DIGEST INTEGRITY: ${checks} CHECKS PASSED - ${msg} <<<`);
};

console.log('>>> COMPLYPRO R4: EVIDENCE DIGEST INTEGRITY & VIEW TRUTHFULNESS <<<');

// ===========================================================================
// [A] HELPER SEMANTICS
// ===========================================================================
console.log('\n[A] evidence-digest helper semantics');

check('A1. computeEvidenceDigest matches independent node:crypto SHA-256 and is deterministic', () => {
  const payload = { alpha: 1, beta: 'two', gamma: [true, null] };
  const d1 = computeEvidenceDigest(payload);
  assert.equal(d1, independentDigest(payload), 'digest must equal independent SHA-256 of canonical JSON');
  assert.equal(d1, computeEvidenceDigest({ alpha: 1, beta: 'two', gamma: [true, null] }), 'same input => same digest');
  assert.notEqual(d1, computeEvidenceDigest({ alpha: 1, beta: 'three', gamma: [true, null] }), 'different input => different digest');
  assert.ok(isComputedEvidenceDigest(d1), 'digest passes strict format validation');
});

check('A2. Serialization failure returns explicit UNAVAILABLE sentinel, never a fake value', () => {
  const circular: Record<string, unknown> = { a: 1 };
  circular.self = circular;
  const result = computeEvidenceDigest(circular);
  assert.equal(result, EVIDENCE_DIGEST_UNAVAILABLE, 'circular input yields UNAVAILABLE sentinel');
  assert.ok(!isComputedEvidenceDigest(result), 'sentinel is not accepted as a computed digest');
});

check('A3. isComputedEvidenceDigest accepts only full SHA256:<64 hex> digests', () => {
  assert.ok(isComputedEvidenceDigest(computeEvidenceDigest({ a: 1 })));
  assert.ok(!isComputedEvidenceDigest('UNAVAILABLE'));
  assert.ok(!isComputedEvidenceDigest('DIGEST-RISK-0042-SHA256'), 'fixture identifier rejected');
  assert.ok(!isComputedEvidenceDigest('DIGEST-INC-0091-CONTAIN-SHA256'), 'fixture identifier rejected');
  assert.ok(!isComputedEvidenceDigest('SIG-911EB3A0C872'), 'fixture signature rejected');
  assert.ok(!isComputedEvidenceDigest('EV-POL-03-01-DIGEST'), 'fixture reference rejected');
  assert.ok(!isComputedEvidenceDigest(undefined));
  assert.ok(!isComputedEvidenceDigest(''), 'empty string rejected');
});

check('A4. hasCryptographicDigest recognizes legacy Guardian truncated-SHA-256 but not fixtures', () => {
  assert.ok(hasCryptographicDigest(computeEvidenceDigest({ a: 1 })), 'computed digest accepted');
  assert.ok(hasCryptographicDigest('DIGEST-GUARD-0123456789ABCDEF-SHA256'), 'guardian wrapper accepted');
  assert.ok(!hasCryptographicDigest('DIGEST-RISK-0042-SHA256'), 'fixture identifier rejected');
  assert.ok(!hasCryptographicDigest('SIG-911EB3A0C872'), 'fixture signature rejected');
  assert.ok(!hasCryptographicDigest(undefined));
});

// ===========================================================================
// [B] BASELINE READABILITY (before any runtime mutation in this process)
// ===========================================================================
console.log('\n[B] baseline fixtures remain readable and untouched');

check('B1. DecisionStore baseline findings readable with original fixture digests', () => {
  const findings = DecisionStore.getFindings();
  assert.ok(findings.length >= 1, 'baseline findings exist');
  assert.ok(
    findings.some(f => f.evidenceDigest && f.evidenceDigest.startsWith('DIGEST-RISK-')),
    'static baseline evidenceDigest fixtures preserved verbatim'
  );
});

check('B2. Incident/Remediation baseline records readable with original fixture digests', () => {
  const incidents = IncidentStore.getIncidents();
  assert.ok(incidents.length >= 1, 'baseline incidents exist');
  assert.ok(
    incidents.some(i => i.investigation?.evidenceDigest?.startsWith('DIGEST-INC-')),
    'static baseline incident digests preserved verbatim'
  );
  const actions = RemediationStore.getActions();
  assert.ok(actions.length >= 1, 'baseline remediation actions exist');
  assert.ok(
    actions.some(a => a.verificationDetails?.evidenceDigest?.startsWith('DIGEST-REMED-')),
    'static baseline remediation digests preserved verbatim'
  );
});

check('B3. FinOps and Policy baselines readable with original fixture references', () => {
  assert.ok(FinOpsStore.getUsage().length >= 1, 'baseline finops entities exist');
  const policies = PolicyStore.getPolicies();
  assert.ok(policies.length >= 1, 'baseline policies exist');
  assert.ok(
    policies.some(p => p.evidenceReference.startsWith('EV-POL-')),
    'static baseline policy evidence references preserved verbatim'
  );
});

// ===========================================================================
// [C] RUNTIME MINTERS - RECOMPUTE-AND-COMPARE (independent node:crypto)
// ===========================================================================
console.log('\n[C] runtime evidence minters produce recomputable digests');

let decisionEvidenceId = '';
let decisionSignature = '';

check('C1. DecisionStore.recordDecision mints recomputable content digest', () => {
  const finding = DecisionStore.getFindings()[0];
  const res = DecisionStore.recordDecision(finding.id, 'MITIGATE');
  const r = res.evidence;
  decisionEvidenceId = r.evidenceId;
  decisionSignature = r.tamperEvidentSignature;
  assert.ok(isComputedEvidenceDigest(r.tamperEvidentSignature), 'signature is a computed SHA-256 digest');
  const content = {
    evidenceId: r.evidenceId,
    entityType: r.entityType,
    entityId: r.entityId,
    controlId: r.controlId,
    eventType: r.eventType,
    timestamp: r.timestamp,
    payloadSummary: r.payloadSummary,
    retentionDays: r.retentionDays
  };
  assert.equal(r.tamperEvidentSignature, independentDigest(content), 'digest recomputes from stored record fields');
  const tampered = { ...content, payloadSummary: `${content.payloadSummary} TAMPERED` };
  assert.notEqual(r.tamperEvidentSignature, independentDigest(tampered), 'verification fails when record content is altered');
});

check('C2. Decision evidence lands in the unified ledger with the same signature', () => {
  const ledger = DecisionStore.getEvidenceLedger();
  const match = ledger.find(l => l.evidenceId === decisionEvidenceId);
  assert.ok(match, 'evidence record present in ledger');
  assert.equal(match!.tamperEvidentSignature, decisionSignature, 'ledger preserves the same computed digest');
  assert.ok(isComputedEvidenceDigest(match!.tamperEvidentSignature), 'ledger record digest validates');
});

check('C3. IncidentStore.authorizeSystemRecovery mints recomputable recovery digest', () => {
  const inc = IncidentStore.getIncidents()[0];
  const res = IncidentStore.authorizeSystemRecovery(inc.incidentId, 'R4 recovery validation rationale', 'R4 Test Approver');
  const inv = res.incident.investigation!;
  assert.ok(inv.resumedAt && inv.resumeApprovedBy, 'recovery fields stored');
  assert.ok(isComputedEvidenceDigest(inv.evidenceDigest), 'recovery digest is computed');
  const domain = {
    incidentId: res.incident.incidentId,
    containmentStatus: res.incident.containmentStatus,
    resumedAt: inv.resumedAt!,
    resumeApprovedBy: inv.resumeApprovedBy!,
    recoveryRationale: inv.recoveryRationale!
  };
  assert.equal(inv.evidenceDigest, independentDigest(domain), 'recovery digest recomputes from stored recovery fields');
  const tampered = { ...domain, recoveryRationale: `${domain.recoveryRationale} TAMPERED` };
  assert.notEqual(inv.evidenceDigest, independentDigest(tampered), 'verification fails when recovery content is altered');
  assert.ok(isComputedEvidenceDigest(res.evidence.tamperEvidentSignature), 'evidence record signature is computed');
});

check('C4. RemediationStore.verifyAndCloseAction mints recomputable closure digest', () => {
  const act = RemediationStore.getActions()[0];
  const res = RemediationStore.verifyAndCloseAction(act.actionId, 'R4 closure rationale', 'PASS - rescan clean', 'R4 Test Verifier');
  assert.equal(res.action.status, 'VERIFIED_CLOSED');
  const vd = res.action.verificationDetails!;
  assert.ok(isComputedEvidenceDigest(vd.evidenceDigest), 'closure digest is computed');
  const domain = {
    actionId: res.action.actionId,
    status: res.action.status,
    verifiedBy: vd.verifiedBy,
    verifiedAt: vd.verifiedAt,
    testOutcome: vd.testOutcome,
    closureRationale: vd.closureRationale
  };
  assert.equal(vd.evidenceDigest, independentDigest(domain), 'closure digest recomputes from stored closure fields');
  const tampered = { ...domain, testOutcome: `${domain.testOutcome} TAMPERED` };
  assert.notEqual(vd.evidenceDigest, independentDigest(tampered), 'verification fails when closure content is altered');
  assert.ok(isComputedEvidenceDigest(res.evidence.tamperEvidentSignature), 'evidence record signature is computed');
});

check('C5. FinOpsStore.updateBudgetAndQuota mints recomputable content digest', () => {
  const ent = FinOpsStore.getUsage()[0];
  const res = FinOpsStore.updateBudgetAndQuota(ent.entityId, 4242, 4242000, 'RUNTIME_ENFORCED', 'R4 budget revalidation', 'R4 Test Owner');
  const r = res.evidence;
  assert.ok(isComputedEvidenceDigest(r.tamperEvidentSignature), 'signature is a computed SHA-256 digest');
  const content = {
    evidenceId: r.evidenceId,
    entityType: r.entityType,
    entityId: r.entityId,
    controlId: r.controlId,
    eventType: r.eventType,
    timestamp: r.timestamp,
    payloadSummary: r.payloadSummary,
    retentionDays: r.retentionDays
  };
  assert.equal(r.tamperEvidentSignature, independentDigest(content), 'digest recomputes from stored record fields');
  const tampered = { ...content, payloadSummary: `${content.payloadSummary} TAMPERED` };
  assert.notEqual(r.tamperEvidentSignature, independentDigest(tampered), 'verification fails when record content is altered');
});

check('C6. PolicyStore.recordPolicyException mints recomputable exception digest', () => {
  const pol = PolicyStore.getPolicies()[0];
  const res = PolicyStore.recordPolicyException(pol.id, 'R4 temporary exception', 'R4 Accountable Owner', '2027-12-31');
  const exc = res.exception;
  assert.ok(isComputedEvidenceDigest(exc.evidenceDigest), 'exception digest is computed');
  const domain = {
    exceptionId: exc.exceptionId,
    reason: exc.reason,
    accountableOwner: exc.accountableOwner,
    decisionId: exc.decisionId,
    createdDate: exc.createdDate,
    expiryDate: exc.expiryDate,
    status: exc.status
  };
  assert.equal(exc.evidenceDigest, independentDigest(domain), 'exception digest recomputes from stored exception fields');
  const tampered = { ...domain, reason: `${domain.reason} TAMPERED` };
  assert.notEqual(exc.evidenceDigest, independentDigest(tampered), 'verification fails when exception content is altered');
  assert.ok(isComputedEvidenceDigest(res.evidence.tamperEvidentSignature), 'nested decision evidence signature is computed');
});

// ===========================================================================
// [D] SCAN GOVERNANCE BRIDGE
// ===========================================================================
console.log('\n[D] scan governance bridge pseudo-digests removed');

check('D1. Identifier-embedded DIGEST-SCAN/SHADOW/PII pseudo-digests removed, computed digests used', () => {
  assert.ok(!bridgeSource.includes("'DIGEST-SCAN-'"), 'DIGEST-SCAN pseudo-digest removed');
  assert.ok(!bridgeSource.includes("'DIGEST-SHADOW-'"), 'DIGEST-SHADOW pseudo-digest removed');
  assert.ok(!bridgeSource.includes("'DIGEST-PII-'"), 'DIGEST-PII pseudo-digest removed');
  const uses = (bridgeSource.match(/computeEvidenceDigest\(\{/g) || []).length;
  assert.ok(uses >= 3, `expected >= 3 computed finding digests, found ${uses}`);
});

check('D2. Bridge ingestion evidence keeps genuine computeDeterministicHash payload digest', () => {
  assert.ok(bridgeSource.includes('computeDeterministicHash(JSON.stringify(evidencePayload))'), 'ingestion payload digest retained');
});

// ===========================================================================
// [E] VIEW TRUTHFULNESS
// ===========================================================================
console.log('\n[E] view digest rendering truthfulness');

check('E1. Fabricated fallbacks and hardcoded hex removed from views', () => {
  assert.ok(!incView.includes('DIGEST-INCIDENT-NO-SIGNATURE'), 'fabricated incident fallback removed');
  assert.ok(!remView.includes('DIGEST-ACTION-OPEN-NO-CLOSURE-SIGNATURE'), 'fabricated remediation fallback removed');
  assert.ok(!finView.includes('DIGEST-FINOPS-TELEMETRY-'), 'hardcoded finops digest template removed');
  assert.ok(!riskView.includes("'a129206c6d4358'"), 'hardcoded hex fallback removed');
  assert.ok(!gcView.includes('RFC 8785 Canonical Evidence'), 'false RFC 8785 label removed from GovernanceCenter');
  assert.ok(!riskView.includes('RFC 8785'), 'false RFC 8785 label removed from RiskEngineView');
});

check('E2. All seven digest-displaying views gate rendering on computed-digest validation', () => {
  const views: Array<[string, string]> = [
    ['GovernanceCenter', gcView],
    ['DecisionsPipelineView', dpvView],
    ['PolicyEngineView', polView],
    ['IncidentsFailsafeView', incView],
    ['RemediationActionsView', remView],
    ['RuntimeFinOpsView', finView],
    ['RiskEngineView', riskView]
  ];
  for (const [name, source] of views) {
    assert.ok(source.includes("from '../services/evidence-digest'"), `${name} imports digest validator`);
    assert.ok(source.includes('isComputedEvidenceDigest('), `${name} gates digest rendering on validation`);
    assert.ok(
      source.includes('unavailable (not computed)') || source.includes('not available'),
      `${name} renders explicit unavailable state`
    );
  }
  assert.ok(gcView.includes('hasCryptographicDigest('), 'GovernanceCenter ledger list accepts legacy guardian SHA-256');
  assert.ok(gcView.includes('Record signature (non-cryptographic fixture)'), 'GovernanceCenter labels fixture signatures honestly');
});

check('E3. Unconditional chain/verification claims replaced with honest conditional text', () => {
  assert.ok(dpvView.includes('Static baseline record: no computed digest'), 'DecisionsPipeline baseline honesty');
  assert.ok(incView.includes('Static baseline record: no computed digest'), 'Incidents baseline honesty');
  assert.ok(remView.includes('No computed digest or audit ledger chain entry exists'), 'Remediation honesty');
  assert.ok(polView.includes('Static policy reference: no computed digest'), 'PolicyEngine honesty');
  assert.ok(finView.includes('not hash-chained'), 'FinOps chain claim corrected');
  assert.ok(riskView.includes('Static baseline record: no computed'), 'RiskEngine baseline honesty');
  assert.ok(gcView.includes('Static baseline record: no computed'), 'GovernanceCenter baseline honesty');
});

// ===========================================================================
// [F] FABRICATED MINTERS REMOVED / REAL VERIFICATION PATHS INTACT
// ===========================================================================
console.log('\n[F] fabricated minters removed, genuine paths intact');

check('F1. Math.random digest minters removed from the five runtime stores', () => {
  const stores: Array<[string, string]> = [
    ['decision-store', decisionSource],
    ['finops-store', finopsSource],
    ['incident-store', incidentSource],
    ['remediation-store', remediationSource],
    ['policy-store', policySource]
  ];
  for (const [name, source] of stores) {
    assert.ok(
      !source.includes('Math.random().toString(36).substring(2, 10).toUpperCase()'),
      `${name} no longer mints random digest placeholders`
    );
    assert.ok(!source.includes(`-SHA256\``) || !source.includes(`DIGEST-`), `${name} has no fabricated DIGEST templates`);
  }
  assert.ok(decisionSource.includes('computeEvidenceDigest('), 'decision-store uses genuine digest helper');
  assert.ok(finopsSource.includes('computeEvidenceDigest('), 'finops-store uses genuine digest helper');
  assert.ok(incidentSource.includes('computeEvidenceDigest('), 'incident-store uses genuine digest helper');
  assert.ok(remediationSource.includes('computeEvidenceDigest('), 'remediation-store uses genuine digest helper');
  assert.ok(policySource.includes('computeEvidenceDigest('), 'policy-store uses genuine digest helper');
});

check('F2. Genuine verification paths untouched (guardian SHA-256, EvidenceStore compare)', () => {
  assert.ok(guardianSource.includes('DIGEST-GUARD-'), 'guardian legacy SHA-256 wrapper preserved');
  assert.ok(guardianSource.includes("createHash('sha256')"), 'guardian still computes real SHA-256');
  assert.ok(evidenceStoreSource.includes('verifyRecordIntegrity'), 'EvidenceStore verification method preserved');
  assert.ok(
    evidenceStoreSource.includes('computedHash === record.integrityDigest'),
    'EvidenceStore still performs recompute-and-compare'
  );
});

// ===========================================================================
// [G] WIRING
// ===========================================================================
console.log('\n[G] governance runner wiring');

check('G1. R4 digest integrity suite wired into the governance runner', () => {
  assert.ok(runnerSource.includes("'r4-digest-integrity'"), 'r4-digest-integrity present in suites array');
});

done('ALL GROUPS PASSED');
