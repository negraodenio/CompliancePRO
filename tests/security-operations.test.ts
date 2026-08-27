import { IdentityProvider } from '../src/server/security/identity-provider';
import { AuthorizationEngine } from '../src/server/security/authorization-engine';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.3: SECURITY OPERATIONS SUITE <<<");
console.log("==================================================================\n");

IdentityProvider.initializeBaselineUsers();
const cisoSession = IdentityProvider.createSession('USR-CISO-01', 'TENANT-DEFAULT', 'WS-DEFAULT');

const authCheck = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'FINDING',
  action: 'VIEW_FINDING',
  criticality: 'LOW'
});

assert(authCheck.allowed === true, "Security operations authorized active session");

console.log("\n>>> SECURITY OPERATIONS SUITE: ALL TESTS PASSED <<<\n");
