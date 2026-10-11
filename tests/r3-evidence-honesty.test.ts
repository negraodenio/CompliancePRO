/**
 * COMPLYPRO R3 — EVIDENCE INTEGRITY & HONEST DEMO REGRESSION SUITE
 *
 * [A] Academy handouts: an unavailable/simulated handout must never appear as a
 *     completed real deliverable (no fabricated "generated successfully" claim).
 * [B] HitlStore digests: a genuine SHA-256 over canonical decision data, or an
 *     explicit UNAVAILABLE status. A missing/invalid/failed digest can never be
 *     presented as verified integrity. Real verification of the stored value must
 *     recompute to the same hash (independent node:crypto check).
 * [C] GovernedAgentProofSurface: static fixtures are explicitly identified as
 *     demonstration data; no LIVE label; no unverified "100% VALID / Hash
 *     Verified / Signed & Verifiable" claims remain.
 * [D] Evidence consumers (Cockpit, AgentDetail, inventory, HitlStore) keep failure
 *     verdicts, policy decisions, lifecycle events and fixtures distinct; metrics
 *     are computed only from real backend entries.
 *
 * Gateway failure-vs-success distinction (FAILED => BLOCK + HTTP 500, ALLOW only
 * on genuine success) remains covered by gateway-failure-closed.test.ts, which
 * runs in the same `npm test` invocation (R2-A wiring).
 *
 * TEST-only. No network, no production, no secrets.
 */
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

const read = (...parts: string[]): string =>
  readFileSync(path.join(process.cwd(), ...parts), 'utf8');

const academySource = read('src', 'web', 'components', 'AcademyModal.tsx');
const feedbackTest = read('tests', 'ux-feedback-clarity.test.ts');
const hitlSource = read('src', 'web', 'services', 'hitl-store.ts');
const hitlViewSource = read('src', 'web', 'views', 'HitlApprovalsView.tsx');
const proofSource = read('src', 'web', 'components', 'GovernedAgentProofSurface.tsx');
const cockpitSource = read('src', 'web', 'views', 'GovernanceCockpitView.tsx');
const detailSource = read('src', 'web', 'views', 'AgentDetailView.tsx');
const inventorySource = read('src', 'web', 'views', 'AgentInventoryPageView.tsx');
const runnerSource = read('tests', 'run-governance-suites.mjs');

let checks = 0;
const check = (name: string, fn: () => void | Promise<void>) => {
  const res = fn();
  if (res instanceof Promise) {
    throw new Error(`async check not allowed: ${name}`);
  }
  checks++;
  console.log(`  [PASS ${checks}]: ${name}`);
};
const done = (msg: string) => {
  console.log(`\n>>> R3 EVIDENCE & DEMO HONESTY: ${checks} CHECKS PASSED — ${msg} <<<`);
};

console.log('>>> COMPLYPRO R3: EVIDENCE INTEGRITY & HONEST DEMO <<<');

// ===========================================================================
// [A] ACADEMY HANDOUTS — unavailable must not read as completed deliverable
// ===========================================================================
console.log('\n[A] Academy handout truthfulness');

check('A1. False "files generated successfully" claim removed from AcademyModal', () => {
  assert.ok(
    !academySource.includes('gerados com sucesso'),
    'AcademyModal must not claim course files were generated successfully'
  );
});

check('A2. Unavailable status + explanatory message are explicit', () => {
  assert.ok(
    academySource.includes("setHandoutsInfo('Kit do Aluno indisponível: nenhum arquivo foi gerado nesta build — download não habilitado.')"),
    'Handout button must report explicit unavailable status'
  );
  assert.ok(academySource.includes('Kit do Aluno Completo — Indisponível nesta build'), 'Kit heading must state unavailable');
  assert.ok(academySource.includes('Pacote do Aluno (indisponível)'), 'Download button must state unavailable');
  assert.ok(academySource.includes('Planejado:'), 'Planned kit contents must be labeled as planned');
});

check('A3. Feature preserved: modal + InlineStatus surface kept, no alert() regression', () => {
  assert.ok(academySource.includes('<InlineStatus'), 'InlineStatus feedback surface must remain');
  assert.ok(academySource.includes('onDismiss={() => setHandoutsInfo(null)}'), 'Handout status dismiss must remain');
  assert.ok(!academySource.includes('alert('), 'No alert() in AcademyModal');
});

check('A4. Enforcing test now locks the truthful message (not the old claim)', () => {
  assert.ok(
    feedbackTest.includes("setHandoutsInfo('Kit do Aluno indisponível: nenhum arquivo foi gerado nesta build — download não habilitado.')"),
    'ux-feedback-clarity must assert the honest handout message'
  );
  assert.ok(
    !feedbackTest.includes('Os arquivos do curso foram gerados com sucesso'),
    'ux-feedback-clarity must no longer lock the false success claim'
  );
  assert.ok(feedbackTest.includes('gerados com sucesso'), 'ux-feedback-clarity must keep the negative assertion against the old claim');
});

// ===========================================================================
// [B] HITLSTORE DIGEST INTEGRITY
// ===========================================================================
console.log('\n[B] HitlStore digest integrity');

const { HitlStore, buildHitlDecisionDigest, isComputedHitlDigest, HITL_DIGEST_UNAVAILABLE } =
  await import('../src/web/services/hitl-store');

check('B1. Fabricated digest generator is gone from hitl-store', () => {
  assert.ok(!hitlSource.includes('Math.random().toString(36).substring(2, 10)'), 'Random digest seed must be removed');
  assert.ok(!hitlSource.includes('DIGEST-HITL-'), 'Fabricated DIGEST-HITL template must be removed');
  assert.ok(hitlSource.includes('computeDeterministicHash'), 'Must use the established audit-ledger SHA-256 implementation');
});

// --- Runtime: approve two pending baseline gates, verify genuine digests ---
const pending = HitlStore.getGates();
const gateA = pending.find(g => g.gateId === 'GATE-2026-8801');
const gateB = pending.find(g => g.gateId === 'GATE-2026-8802');
assert.ok(gateA, 'Baseline gate 8801 present');
assert.ok(gateB, 'Baseline gate 8802 present');

const RATIONALE_A = 'R3 regression: approve with auditable rationale A';
const RATIONALE_B = 'R3 regression: approve with auditable rationale B';

let resA: ReturnType<typeof HitlStore.executeHumanApproval>;
let resB: ReturnType<typeof HitlStore.executeHumanApproval>;
resA = HitlStore.executeHumanApproval(gateA!.gateId, 'APPROVE', RATIONALE_A, 'R3 Test Approver', 'QA Harness');
resB = HitlStore.executeHumanApproval(gateB!.gateId, 'APPROVE', RATIONALE_B, 'R3 Test Approver', 'QA Harness');
HitlStore.resetToBaseline();

check('B2. Approval records a genuine SHA256:<64-hex> digest (format gate)', () => {
  const digest = resA.gate.approvalOutcome!.evidenceDigest;
  assert.ok(/^SHA256:[0-9a-f]{64}$/.test(digest), `digest must be SHA256:<64 hex>, got: ${digest}`);
  assert.ok(isComputedHitlDigest(digest), 'isComputedHitlDigest accepts the real digest');
  assert.ok(!isComputedHitlDigest('DIGEST-HITL-APPROVE-ABC12345-SHA256'), 'Old fabricated format is rejected as computed');
  assert.ok(!isComputedHitlDigest(undefined) && !isComputedHitlDigest(HITL_DIGEST_UNAVAILABLE), 'UNAVAILABLE/missing is never a computed digest');
});

check('B3. Stored digest equals independent node:crypto SHA-256 over canonical decision data', () => {
  const outcome = resA.gate.approvalOutcome!;
  const canonical = JSON.stringify({
    gateId: resA.gate.gateId,
    agentId: resA.gate.agentId,
    controlId: resA.gate.controlId,
    actionTitle: resA.gate.actionTitle,
    decision: outcome.decision,
    rationale: outcome.rationale,
    decidedBy: outcome.decidedBy,
    role: outcome.role,
    decidedAt: outcome.decidedAt,
    executionState: outcome.executionState
  });
  const expected = 'SHA256:' + createHash('sha256').update(canonical, 'utf8').digest('hex');
  assert.equal(outcome.evidenceDigest, expected, 'Stored digest must recompute to the same SHA-256');
});

check('B4. Evidence record signature is bound to the same digest', () => {
  assert.equal(resA.evidence.tamperEvidentSignature, resA.gate.approvalOutcome!.evidenceDigest);
  assert.equal(resA.evidence.eventType, 'DECISION_EXECUTION', 'Audit semantics preserved (evidence still recorded)');
  assert.ok(resA.evidence.payloadSummary.includes('[APPROVE]'), 'Evidence payload still describes the decision');
  assert.ok(resA.evidence.evidenceId.startsWith('EV-HITL-'), 'Evidence id shape preserved');
});

check('B5. Digest is data-bound: different decision data yields a different digest', () => {
  const base = {
    gateId: 'GATE-X',
    agentId: 'AGT-X',
    controlId: 'CG-AG-03',
    actionTitle: 'Action',
    decision: 'APPROVE' as const,
    rationale: 'because',
    decidedBy: 'A',
    role: 'R',
    decidedAt: '2026-10-10T00:00:00.000Z',
    executionState: 'AUTHORIZATION_GRANTED' as const
  };
  const d1 = buildHitlDecisionDigest(base);
  const d2 = buildHitlDecisionDigest({ ...base, rationale: 'other reason' });
  const d3 = buildHitlDecisionDigest({ ...base, decidedAt: '2026-10-10T00:00:01.000Z' });
  assert.notEqual(d1, d2, 'Rationale change must change the digest');
  assert.notEqual(d1, d3, 'Timestamp change must change the digest');
  assert.equal(d1, buildHitlDecisionDigest({ ...base }), 'Same data must reproduce the same digest (deterministic)');
  assert.notEqual(resA.gate.approvalOutcome!.evidenceDigest, resB.gate.approvalOutcome!.evidenceDigest, 'Distinct approvals must not collide');
});

check('B6. Failed digest calculation yields explicit UNAVAILABLE — never a fabricated hash', () => {
  const circular: any = {
    gateId: 'G',
    agentId: 'A',
    controlId: 'C',
    actionTitle: 'T',
    decision: 'APPROVE',
    rationale: 'r',
    decidedBy: 'd',
    role: 'role',
    decidedAt: 'now',
    executionState: 'AUTHORIZATION_GRANTED'
  };
  circular.self = circular;
  const result = buildHitlDecisionDigest(circular);
  assert.equal(result, HITL_DIGEST_UNAVAILABLE, 'Failure must be explicit UNAVAILABLE');
  assert.ok(!/SHA256:/.test(result), 'Failure must never fabricate a SHA256-looking value');
  assert.ok(!isComputedHitlDigest(result), 'UNAVAILABLE can never present as verified integrity');
});

check('B7. Baseline fixture gate now carries a genuine digest of its own outcome data', () => {
  const g8799 = HitlStore.getGates().find(g => g.gateId === 'GATE-2026-8799');
  assert.ok(g8799 && g8799.approvalOutcome, 'Baseline rejected gate has an outcome');
  const stored = g8799!.approvalOutcome!.evidenceDigest;
  assert.ok(/^SHA256:[0-9a-f]{64}$/.test(stored), `Baseline fixture digest must be genuine SHA256, got: ${stored}`);
  const expected = buildHitlDecisionDigest({
    gateId: 'GATE-2026-8799',
    agentId: 'AGT-OPS-1102',
    controlId: 'CG-AG-02',
    actionTitle: 'Automated Production Database Index Rebuild',
    decision: 'REJECT',
    rationale: 'Unscheduled table reindex on production database blocked. Must be performed during designated maintenance window.',
    decidedBy: 'Roberto Silva',
    role: 'CISO & Accountable Lead',
    decidedAt: '2026-08-27T14:15:00Z',
    executionState: 'EXECUTION_BLOCKED'
  });
  assert.equal(stored, expected, 'Fixture digest must recompute from its displayed outcome fields');
});

check('B8. HitlApprovalsView cannot present a missing digest as verified integrity', () => {
  assert.ok(!hitlViewSource.includes('chained into the audit ledger'), 'False audit-chain claim removed');
  assert.ok(!hitlViewSource.includes('DIGEST-GATE-PENDING-SIGNATURE'), 'Fake pending digest placeholder removed');
  assert.ok(hitlViewSource.includes('isComputedHitlDigest('), 'Digest display must be gated on a valid computed digest');
  assert.ok(hitlViewSource.includes('Digest indisponível — nenhum hash foi calculado para este gate.'), 'Missing digest shows explicit unavailable state');
  assert.ok(hitlViewSource.includes('indisponível (não calculado)'), 'Toast shows explicit unavailable state for failed/missing digest');
  assert.ok(hitlViewSource.includes('Não é encadeado em ledger de auditoria.'), 'Caption must not claim audit-chain anchoring that does not exist');
  const verifiedBranchIndex = hitlViewSource.indexOf('Integrity Hash: {selectedGate.approvalOutcome?.evidenceDigest}');
  const unavailableBranchIndex = hitlViewSource.indexOf('Digest indisponível');
  assert.ok(verifiedBranchIndex > 0 && unavailableBranchIndex > 0, 'Both digest and unavailable branches exist');
});

// ===========================================================================
// [C] GOVERNED AGENT PROOF SURFACE — fixtures identified, no LIVE claims
// ===========================================================================
console.log('\n[C] GovernedAgentProofSurface demonstration labeling');

check('C1. LIVE badge removed; DEMO badge present', () => {
  const withoutKnownFixture = proofSource.split('FIXTURE (NOT A LIVE PASSPORT)').join('');
  assert.ok(!/\bLIVE\b/.test(withoutKnownFixture), 'No LIVE label may remain anywhere on the surface');
  assert.ok(proofSource.includes('DEMO'), 'DEMO badge must identify the surface');
});

check('C2. Persistent demonstration-data notice present', () => {
  assert.ok(
    proofSource.includes('Demonstration data — all rows, hashes, verdicts and statuses on this surface are static fixtures'),
    'Static fixtures must be explicitly identified as demonstration data'
  );
});

check('C3. Unverified integrity claims removed from evidence tab and footer', () => {
  assert.ok(!proofSource.includes('100% VALID'), 'No unverified "100% VALID" chain claim');
  assert.ok(!proofSource.includes('Hash Verified'), 'No "Hash Verified" footer claim');
  assert.ok(proofSource.includes('HASH CHAIN NOT VERIFIED — SAMPLE ROWS ONLY'), 'Evidence tab states verification was not performed');
  assert.ok(proofSource.includes('EVIDENCE LEDGER (DEMO)'), 'Evidence tab labeled as demo');
  assert.ok(proofSource.includes('demo fixture') && proofSource.includes('(unverified)'), 'Footer identifies fixture as unverified');
});

check('C4. Passport/header claims downgraded to fixture language', () => {
  assert.ok(!proofSource.includes('SIGNED & VERIFIABLE'), 'No unverified signed-and-verifiable claim');
  assert.ok(!proofSource.includes('Passport: VERIFIED'), 'No live passport verification claim');
  assert.ok(proofSource.includes('FIXTURE (NOT A LIVE PASSPORT)'), 'Passport tab labeled as fixture');
  assert.ok(proofSource.includes('Passport: fixture (SIG-SHA256 format)'), 'Header passport line labeled as fixture');
});

check('C5. Demo narrative (idle copy + HITL flow) preserved — feature not removed', () => {
  assert.ok(proofSource.includes('simulate an autonomous CrewAI credit analyst'), 'Interactive demo narrative preserved');
  assert.ok(proofSource.includes('Run Governed Agent'), 'Demo control preserved');
  assert.ok(proofSource.includes('HUMAN SUPERVISOR INTERVENTION REQUIRED'), 'HITL flow preserved');
});

// ===========================================================================
// [D] EVIDENCE CONSUMERS — failures, policy decisions and fixtures stay distinct
// ===========================================================================
console.log('\n[D] Evidence consumer cross-check');

check('D1. Cockpit metrics computed only from real backend evidence entries', () => {
  assert.ok(cockpitSource.includes('const rawEntries = evidenceEntries;'), 'rawEntries must be the real evidence state');
  const defaultRefs = cockpitSource.match(/defaultEntries/g) || [];
  assert.equal(defaultRefs.length, 1, 'defaultEntries fixture must stay unused (declaration only) — never feeds metrics');
  assert.ok(cockpitSource.includes("rawEntries.filter(e => e.verdict === 'ALLOW'"), 'ALLOW metric derived from real entries');
  assert.ok(cockpitSource.includes("rawEntries.filter(e => e.verdict === 'BLOCK' || e.eventType === 'AGENT_EXECUTION_BLOCKED')"), 'BLOCK metric keeps failure verdicts distinct');
});

check('D2. Cockpit failure handling cannot render a false success', () => {
  assert.ok(cockpitSource.includes('No successful authorization was confirmed'), 'Failed approval stays visibly unsuccessful');
  assert.ok(cockpitSource.includes("'Backend hash-chain verification completed.' : 'No successful non-empty evidence verification was reported.'"), 'Verification result reported honestly');
});

check('D3. AgentDetail: gateway failure (BLOCK) renders as Blocked, never Allowed', () => {
  assert.ok(detailSource.includes("act.verdict === 'BLOCK'"), 'Activity failure verdict recognized');
  assert.ok(detailSource.includes("act.verdict === 'REJECTED'"), 'Activity rejection recognized');
  assert.ok(detailSource.includes("'Blocked'"), 'Blocked label exists for failures');
  assert.ok(detailSource.includes("t.status === 'BLOCKED' ? 'Blocked'"), 'Tool BLOCKED status renders as Blocked');
});

check('D4. Inventory: non-governed / unprovisioned records never render green ALLOW states', () => {
  assert.ok(
    detailSource.includes("{!isProvisioned ? 'Needs review' : t.status === 'HITL' ? 'Approval required' : t.status === 'BLOCKED' ? 'Blocked' : 'Declared'"),
    'Tool states render as Declared/Approval required/Blocked/Needs review only'
  );
  assert.ok(
    inventorySource.includes("return agent.status === 'PAUSED' || agent.status === 'IMPORTED' || agent.status === 'DISCOVERED' || agent.status === 'UNKNOWN'"),
    'IMPORTED/DISCOVERED/UNKNOWN agents stay classified as needs-review, never governed'
  );
  assert.ok(!inventorySource.includes('>ALLOW<'), 'No raw green ALLOW badge rendered by inventory view');
});

check('D5. R1/R2/R3 regression suites remain wired into the CI runner', () => {
  assert.ok(runnerSource.includes("'gateway-failure-closed'"), 'R1 gateway failure suite wired');
  assert.ok(runnerSource.includes("'data-hitl-revalidation'"), 'R2 HITL revalidation suite wired');
  assert.ok(runnerSource.includes("'r3-evidence-honesty'"), 'R3 honesty suite wired');
});

done('ALL GROUPS PASSED');
