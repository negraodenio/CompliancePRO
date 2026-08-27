import { IdentityProvider } from '../src/server/security/identity-provider';
import { AuthorizationEngine } from '../src/server/security/authorization-engine';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.6: POST-GOLIVE SECURITY AUDIT SUITE <<<");
console.log("==================================================================\n");

IdentityProvider.initializeBaselineUsers();
const engSession = IdentityProvider.createSession('USR-ENG-03', 'TENANT-DEFAULT', 'WS-DEFAULT');

const hitlDenial = AuthorizationEngine.evaluate({
  session: engSession,
  resourceType: 'HITL_GATE',
  action: 'APPROVE_HITL',
  criticality: 'HIGH'
});
assert(hitlDenial.allowed === false, "Engineer blocked from approving HITL gate (RBAC_DENIED)");

const crossTenantDenial = AuthorizationEngine.evaluate({
  session: engSession,
  resourceType: 'FINDING',
  resourceTenantId: 'TENANT-COMPETITOR',
  action: 'VIEW_FINDING',
  criticality: 'LOW'
});
assert(crossTenantDenial.allowed === false, "Cross-tenant access blocked (TENANT_VIOLATION)");

console.log("\n>>> POST-GOLIVE SECURITY AUDIT SUITE: ALL TESTS PASSED <<<\n");
