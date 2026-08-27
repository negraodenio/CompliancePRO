/**
 * PHASE 9.2: ENTERPRISE IDENTITY & ACCESS CONTROL SECURITY SUITE
 */

import { IdentityProvider } from '../src/server/security/identity-provider';
import { AuthorizationEngine } from '../src/server/security/authorization-engine';
import { UserSession } from '../src/server/security/identity-types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.2: ENTERPRISE IDENTITY & SECURITY SUITE <<<");
console.log("==================================================================\n");

// 1. IDENTITY & SESSION LIFECYCLE
console.log("[TEST 1] Identity Provider & Session Lifecycle...");
IdentityProvider.initializeBaselineUsers();

const cisoSession = IdentityProvider.createSession('USR-CISO-01', 'TENANT-DEFAULT', 'WS-DEFAULT');
assert(cisoSession.sessionId.startsWith('SES-'), "CISO session issued successfully");
assert(cisoSession.roles.includes('CISO'), "CISO role assigned to session");

const valRes = IdentityProvider.validateSession(cisoSession.sessionId);
assert(valRes.valid === true, "Active session successfully validated");

// 2. RBAC AUTHORIZATION CHECKS
console.log("\n[TEST 2] RBAC Permission Matrix Evaluation...");
const engSession = IdentityProvider.createSession('USR-ENG-03', 'TENANT-DEFAULT', 'WS-DEFAULT');

const engHitlCheck = AuthorizationEngine.evaluate({
  session: engSession,
  resourceType: 'HITL_GATE',
  action: 'APPROVE_HITL',
  criticality: 'HIGH'
});
assert(engHitlCheck.allowed === false, "Engineer blocked from approving HITL gate (RBAC_DENIED)");

const cisoViewCheck = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'FINDING',
  action: 'VIEW_FINDING',
  criticality: 'LOW'
});
assert(cisoViewCheck.allowed === true, "CISO allowed to view findings");

// 3. ADVERSARIAL TENANT & WORKSPACE BOUNDARY ENFORCEMENT
console.log("\n[TEST 3] Adversarial Cross-Tenant Resource Isolation...");
const crossTenantCheck = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'FINDING',
  resourceTenantId: 'TENANT-FOREIGN-CORP',
  action: 'VIEW_FINDING',
  criticality: 'LOW'
});
assert(crossTenantCheck.allowed === false, "CISO blocked from accessing foreign tenant resource (TENANT_VIOLATION)");

const crossWorkspaceCheck = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'POLICY',
  resourceTenantId: 'TENANT-DEFAULT',
  resourceWorkspaceId: 'WS-SECRET-SANDBOX',
  action: 'VIEW_FINDING',
  criticality: 'LOW'
});
assert(crossWorkspaceCheck.allowed === false, "CISO blocked from accessing unauthorized workspace (WORKSPACE_VIOLATION)");

// 4. STEP-UP AUTHENTICATION FOR PRIVILEGED ACTIONS
console.log("\n[TEST 4] Privileged Action Step-Up Enforcement...");
const stepUpCheck = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'POLICY',
  action: 'MANAGE_POLICY',
  criticality: 'CRITICAL'
});
assert(stepUpCheck.allowed === false && stepUpCheck.stepUpRequired === true, "Critical policy management requires step-up authentication");

IdentityProvider.triggerStepUp(cisoSession.sessionId);
const stepUpGranted = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'POLICY',
  action: 'MANAGE_POLICY',
  criticality: 'CRITICAL'
});
assert(stepUpGranted.allowed === true, "Policy management authorized post step-up verification");
assert(stepUpGranted.securityEvidenceDigest !== undefined, "Security audit evidence digest generated for privileged action");

// 5. SESSION REVOCATION & EXPIRATION
console.log("\n[TEST 5] Session Revocation & Invalidation...");
IdentityProvider.revokeSession(cisoSession.sessionId);
const revokedCheck = AuthorizationEngine.evaluate({
  session: cisoSession,
  resourceType: 'FINDING',
  action: 'VIEW_FINDING',
  criticality: 'LOW'
});
assert(revokedCheck.allowed === false, "Revoked session immediately rejected across all backend services");

console.log("\n==================================================================");
console.log(">>> PHASE 9.2: ALL 5 IDENTITY & SECURITY INVARIANTS PASSED <<<");
console.log("==================================================================\n");
