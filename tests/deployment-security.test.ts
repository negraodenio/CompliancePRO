import { AuthorizationEngine } from '../src/server/security/authorization-engine';
import { IdentityProvider } from '../src/server/security/identity-provider';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.4: DEPLOYMENT SECURITY GATE SUITE <<<");
console.log("==================================================================\n");

IdentityProvider.initializeBaselineUsers();
const engSession = IdentityProvider.createSession('USR-ENG-03', 'TENANT-DEFAULT', 'WS-DEFAULT');

const unauthorizedCutover = AuthorizationEngine.evaluate({
  session: engSession,
  resourceType: 'DEPLOYMENT_GATE',
  action: 'MANAGE_TENANT',
  criticality: 'CRITICAL'
});

assert(unauthorizedCutover.allowed === false, "Unauthorized role strictly blocked from requesting cutover");

console.log("\n>>> DEPLOYMENT SECURITY GATE SUITE: ALL TESTS PASSED <<<\n");
