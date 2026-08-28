/**
 * ROLE-BASED LENSES & PERSONA VIEWS TEST SUITE
 * Validates:
 * 1. Role Lens Definitions & Metadata Integrity (8 Lenses)
 * 2. EnterpriseRole to RoleLens Resolution
 * 3. Default Landing View & Priority Views Scoping
 * 4. Invariant: Separation of Authorization (RBAC/ABAC) vs Presentation (Role Lens)
 * 5. Full 18-Module Navigation Coverage
 */

import { ROLE_LENSES, RoleLensDefinition, RoleLensId } from '../src/web/context/RoleLensContext';
import { AuthorizationEngine } from '../src/server/security/authorization-engine';
import { IdentityProvider } from '../src/server/security/identity-provider';
import { EnterpriseRole } from '../src/server/security/identity-types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING ROLE-BASED LENSES & PERSONA REINTEGRATION SUITE <<<");
console.log("==================================================================\n");

let testCount = 0;
function testGroup(name: string, fn: () => void) {
  console.log(`[TEST ${++testCount}] ${name}...`);
  fn();
  console.log("");
}

// 1. LENS DEFINITIONS INTEGRITY (8 LENSES)
testGroup("Role Lens Definitions & Scoping Integrity", () => {
  assert(ROLE_LENSES.length === 8, "Exactly 8 Role Lenses defined (CISO, DPO, AI_OFFICE, SECURITY_LEAD, ENGINEER, AUDITOR, BOARD, ALL_MODULES)");

  const lensIds = ROLE_LENSES.map(l => l.id);
  const expectedIds: RoleLensId[] = ['ciso', 'dpo', 'ai-office', 'security-lead', 'engineer', 'auditor', 'board', 'all-modules'];
  for (const exp of expectedIds) {
    assert(lensIds.includes(exp), `Lens [${exp}] correctly registered`);
  }

  for (const lens of ROLE_LENSES) {
    assert(lens.name.length > 0, `Lens [${lens.id}] has valid name: ${lens.name}`);
    assert(lens.tagline.length > 0, `Lens [${lens.id}] has valid tagline`);
    assert(lens.defaultLandingView.length > 0, `Lens [${lens.id}] specifies landing view: ${lens.defaultLandingView}`);
    if (lens.id !== 'all-modules') {
      assert(lens.priorityViews.length >= 3, `Lens [${lens.id}] has at least 3 priority views (actual: ${lens.priorityViews.length})`);
    }
  }
});

// 2. AUTOMATIC ROLE TO LENS RESOLUTION
testGroup("EnterpriseRole to Role Lens Resolution", () => {
  const cisoLens = ROLE_LENSES.find(l => l.role === 'CISO');
  assert(cisoLens?.id === 'ciso', "Role CISO resolves to 'ciso' lens");
  assert(cisoLens?.defaultLandingView === 'overview-center', "CISO lands on Governance Center (overview-center)");
  assert(cisoLens?.priorityViews.includes('govern-risk'), "CISO priority includes Risk Engine");

  const engLens = ROLE_LENSES.find(l => l.role === 'ENGINEER');
  assert(engLens?.id === 'engineer', "Role ENGINEER resolves to 'engineer' lens");
  assert(engLens?.defaultLandingView === 'tools-scanner', "Engineer lands on Codebase AST Scanner");
  assert(engLens?.priorityViews.includes('discover-agents'), "Engineer priority includes Agents & Teams");

  const dpoLens = ROLE_LENSES.find(l => l.role === 'DPO');
  assert(dpoLens?.id === 'dpo', "Role DPO resolves to 'dpo' lens");
  assert(dpoLens?.defaultLandingView === 'govern-compliance', "DPO lands on Compliance Frameworks");
  assert(dpoLens?.priorityViews.includes('assure-reports'), "DPO priority includes Regulatory Dossiers");

  const auditorLens = ROLE_LENSES.find(l => l.role === 'AUDITOR');
  assert(auditorLens?.id === 'auditor', "Role AUDITOR resolves to 'auditor' lens");
  assert(auditorLens?.defaultLandingView === 'assure-audit', "Auditor lands on Immutable Audit Ledger");
  assert(auditorLens?.priorityViews.includes('assure-evidence'), "Auditor priority includes Protected Evidence");
});

// 3. INVARIANT: SEPARATION OF AUTHORIZATION (RBAC) VS LENS PRESENTATION
testGroup("RBAC & ABAC Security Invariant Under Active Lenses", () => {
  IdentityProvider.initializeBaselineUsers();
  const engSession = IdentityProvider.createSession('USR-ENG-03', 'TENANT-DEFAULT', 'WS-DEFAULT');

  // Even if an Engineer switches lens to 'ciso', RBAC MUST block unauthorized actions!
  const blockedHitl = AuthorizationEngine.evaluate({
    session: engSession,
    resourceType: 'HITL_GATE',
    action: 'APPROVE_HITL',
    criticality: 'HIGH'
  });
  assert(blockedHitl.allowed === false, "Security Invariant: RBAC strictly blocks Engineer from approving HITL, regardless of UI lens");
  assert(blockedHitl.reason.includes('RBAC_DENIED'), "Denied reason is RBAC_DENIED");

  const cisoSession = IdentityProvider.createSession('USR-CISO-01', 'TENANT-DEFAULT', 'WS-DEFAULT');
  const allowedView = AuthorizationEngine.evaluate({
    session: cisoSession,
    resourceType: 'FINDING',
    action: 'VIEW_FINDING',
    criticality: 'LOW'
  });
  assert(allowedView.allowed === true, "CISO permitted to view findings");
});

// 4. FULL 18-MODULE ARCHITECTURE COVERAGE
testGroup("Full 18-Module Navigation Coverage Across Lenses", () => {
  const allRegisteredViews = new Set<string>();
  for (const lens of ROLE_LENSES) {
    allRegisteredViews.add(lens.defaultLandingView);
    lens.priorityViews.forEach(v => allRegisteredViews.add(v));
  }

  // Key module sanity check
  const core18Views = [
    'overview-center', 'discover-inventory', 'discover-agents', 'discover-assessments',
    'govern-controls', 'govern-risk', 'govern-policies', 'govern-compliance',
    'operate-decisions', 'operate-approvals', 'operate-actions', 'operate-incidents', 'operate-runtime',
    'assure-evidence', 'assure-audit', 'assure-reports', 'tools-scanner', 'learn-academy'
  ];

  for (const view of core18Views) {
    assert(allRegisteredViews.has(view), `Module [${view}] is reachable and mapped across lenses`);
  }
});

console.log("==================================================================");
console.log(`>>> ROLE-BASED LENSES & PERSONA SUITE: ALL ${testCount} TEST GROUPS PASSED <<<`);
console.log("==================================================================\n");
