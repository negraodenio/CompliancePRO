/**
 * CodeGuard v3.1 — Sprint 0 Test Suite: Compliance Contract & Compiler
 * 
 * Verifies:
 * 1. Deterministic compilation (same input -> same SHA-256 checksum)
 * 2. Checksum sensitivity (mutation in policy/action/HITL -> checksum changes)
 * 3. Source traceability (requirements map to legal articles & CG-AG controls)
 * 4. Compiler version binding (CG-COMPILER-1.0.0)
 * 5. Control mapping validity (all mandatory controls exist in CG_AG_CONTROLS)
 * 6. Profile Registry retrieval and pre-seeded baseline profiles
 * 7. Expected configured policy behavior for financial, privacy, and enterprise profiles
 * 8. Tamper detection and cryptographic verification
 * 9. Contextual applicability without universal legal claims
 * 
 * NOTE: These tests prove compiler determinism, structure, traceability,
 * and policy generation. They do NOT claim universal statutory legal compliance.
 */

import {
  PolicyCompiler,
  ComplianceProfileRegistry,
  RegulatoryKnowledge,
  ApplicabilityEngine,
  COMPILER_VERSION,
  CompileProfileBlueprint
} from '../src/core/compliance-compiler';
import {
  calculateProfileChecksum,
  verifyProfileChecksum,
  ComplianceProfile
} from '../src/core/compliance-contract';
import { CG_AG_CONTROLS } from '../src/core/cg-ag-controls';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS]: ${message}`);
}

console.log("==================================================================");
console.log(">>> CODEGUARD v3.1 — SPRINT 0: COMPLIANCE CONTRACT & COMPILER <<<");
console.log("==================================================================\n");

let passedTests = 0;

function runTest(testName: string, fn: () => void) {
  console.log(`[TEST ${++passedTests}] ${testName}`);
  fn();
  console.log("");
}

// Baseline blueprint for testing
const baseBlueprint: CompileProfileBlueprint = {
  profileId: 'CP-TEST-CREDIT-ASSISTANT',
  version: '1.0.0',
  name: 'Credit Risk Autonomous Assistant',
  description: 'Evaluates retail loan applications under high-risk EU supervision.',
  context: {
    jurisdiction: ['EU', 'PORTUGAL'],
    industries: ['financial-services'],
    dataClassifications: ['CONFIDENTIAL', 'RESTRICTED'],
    autonomyLevels: ['SUPERVISED']
  },
  applicableRegulations: ['EU_AI_ACT', 'DORA', 'GDPR'],
  mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-04', 'CG-AG-06', 'CG-AG-07'],
  forbiddenActions: [
    'DIRECT_DB_DDL',
    'EXECUTE_UNAUTHORIZED_TRANSACTION'
  ],
  requireHumanApproval: [
    'approve_loan_above_50k',
    'override_credit_score'
  ],
  customExecutablePolicies: [
    {
      policyId: 'POL-CUSTOM-CREDIT-LIMIT',
      policyVersion: '1.0.0',
      controlId: 'CG-AG-03',
      title: 'Credit Limit Approval Checkpoint',
      description: 'Transactions above 50,000 EUR require Tier-2 manager approval.',
      condition: {
        toolNames: ['approve_loan_above_50k'],
        actionTypes: ['EXECUTE']
      },
      verdict: 'REQUIRE_HITL',
      reasonTemplate: 'Loan value exceeds autonomous limit; human review required under EU AI Act Art. 14.'
    }
  ]
};

// --------------------------------------------------------------------------
// TEST 1: Deterministic Compilation (Same input -> same checksum)
// --------------------------------------------------------------------------
runTest("1. Deterministic Compilation: Same input produces identical SHA-256 checksum", () => {
  const profile1 = PolicyCompiler.compile(baseBlueprint);
  const profile2 = PolicyCompiler.compile(baseBlueprint);

  assert(typeof profile1.checksum === 'string', "Profile 1 generates checksum string");
  assert(profile1.checksum.length === 64, "Checksum is a valid 64-character SHA-256 hex string");
  assert(profile1.checksum === profile2.checksum, "Compiling twice with identical blueprint yields identical checksum");
  assert(profile1.compilerVersion === COMPILER_VERSION, `Bound to compilerVersion ${COMPILER_VERSION}`);
});

// --------------------------------------------------------------------------
// TEST 2: Checksum Sensitivity: Mutating a policy changes the checksum
// --------------------------------------------------------------------------
runTest("2. Checksum Sensitivity: Mutating an executable policy changes checksum", () => {
  const baseline = PolicyCompiler.compile(baseBlueprint);

  const modifiedBlueprint: CompileProfileBlueprint = {
    ...baseBlueprint,
    customExecutablePolicies: [
      {
        ...baseBlueprint.customExecutablePolicies![0],
        description: 'Modified policy description for testing sensitivity.'
      }
    ]
  };

  const modified = PolicyCompiler.compile(modifiedBlueprint);
  assert(baseline.checksum !== modified.checksum, "Changing policy description alters the profile checksum");
});

// --------------------------------------------------------------------------
// TEST 3: Checksum Sensitivity: Mutating forbiddenActions changes checksum
// --------------------------------------------------------------------------
runTest("3. Checksum Sensitivity: Adding or altering forbiddenActions changes checksum", () => {
  const baseline = PolicyCompiler.compile(baseBlueprint);

  const modifiedBlueprint: CompileProfileBlueprint = {
    ...baseBlueprint,
    forbiddenActions: [...baseBlueprint.forbiddenActions!, 'NEW_FORBIDDEN_ACTION_TEST']
  };

  const modified = PolicyCompiler.compile(modifiedBlueprint);
  assert(baseline.checksum !== modified.checksum, "Adding a forbidden action produces a different checksum");
});

// --------------------------------------------------------------------------
// TEST 4: Checksum Sensitivity: Mutating requireHumanApproval changes checksum
// --------------------------------------------------------------------------
runTest("4. Checksum Sensitivity: Altering requireHumanApproval changes checksum", () => {
  const baseline = PolicyCompiler.compile(baseBlueprint);

  const modifiedBlueprint: CompileProfileBlueprint = {
    ...baseBlueprint,
    requireHumanApproval: ['only_one_rule_now']
  };

  const modified = PolicyCompiler.compile(modifiedBlueprint);
  assert(baseline.checksum !== modified.checksum, "Altering HITL rules produces a different checksum");
});

// --------------------------------------------------------------------------
// TEST 5: Source Traceability: Requirements have full source references
// --------------------------------------------------------------------------
runTest("5. Source Traceability: Requirements contain auditable source references", () => {
  const profile = PolicyCompiler.compile(baseBlueprint);

  assert(profile.sourceReferences.length > 0, "Profile contains aggregated source references");
  
  const euRef = profile.sourceReferences.find(r => r.regulation === 'EU_AI_ACT');
  assert(euRef !== undefined, "EU AI Act source reference present");
  assert(euRef?.section !== undefined && euRef.section.length > 0, "Source reference has valid section citation");
  assert(euRef?.sourceUri?.startsWith('http') === true, "Source reference contains official legal publication URI");

  const doraRef = profile.sourceReferences.find(r => r.regulation === 'DORA');
  assert(doraRef !== undefined, "DORA source reference present");
});

// --------------------------------------------------------------------------
// TEST 6: Mandatory Controls Validity
// --------------------------------------------------------------------------
runTest("6. Control Validity: All mandatory controls exist in canonical CG_AG_CONTROLS", () => {
  const profile = PolicyCompiler.compile(baseBlueprint);

  for (const controlId of profile.mandatoryControls) {
    const canonical = CG_AG_CONTROLS[controlId];
    assert(canonical !== undefined, `Control ${controlId} is registered in CG_AG_CONTROLS`);
    assert(canonical.name.length > 0, `Control ${controlId} has official name: "${canonical.name}"`);
  }
});

// --------------------------------------------------------------------------
// TEST 7: Requirements Map to CG-AG Controls
// --------------------------------------------------------------------------
runTest("7. Traceability Mapping: Every requirement maps to a valid CG-AG control", () => {
  const requirements = RegulatoryKnowledge.getAllRequirements();
  assert(requirements.length >= 10, `Regulatory Knowledge contains at least 10 requirements (found: ${requirements.length})`);

  for (const req of requirements) {
    assert(req.id.startsWith('REQ-'), `Requirement ID ${req.id} follows naming convention`);
    assert(CG_AG_CONTROLS[req.mappedControl] !== undefined, `Requirement ${req.id} maps to valid control ${req.mappedControl}`);
    assert(req.rationale.length > 10, `Requirement ${req.id} contains defensible contextual rationale`);
  }
});

// --------------------------------------------------------------------------
// TEST 8: Profile Registry Retrieval & Pre-Seeded Profiles
// --------------------------------------------------------------------------
runTest("8. Profile Registry: Retrieves pre-seeded baseline profiles", () => {
  const finProfile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL');
  assert(finProfile !== undefined, "Financial profile exists in registry");
  assert(finProfile?.name.includes('Financial') === true, "Financial profile name is correct");

  const gdprProfile = ComplianceProfileRegistry.getProfile('CP-GDPR-STRICT-DATA-PROCESSING');
  assert(gdprProfile !== undefined, "GDPR profile exists in registry");

  const entProfile = ComplianceProfileRegistry.getProfile('CP-STANDARD-ENTERPRISE-INTERNAL');
  assert(entProfile !== undefined, "Standard enterprise profile exists in registry");

  const all = ComplianceProfileRegistry.listProfiles();
  assert(all.length >= 3, `Registry contains at least 3 pre-seeded profiles (actual: ${all.length})`);
});

// --------------------------------------------------------------------------
// TEST 9: Financial Profile Configured Behavior
// --------------------------------------------------------------------------
runTest("9. Policy Behavior: Financial profile contains expected forbidden actions and HITL gates", () => {
  const finProfile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
  
  // Forbidden Actions
  assert(finProfile.forbiddenActions.includes('DIRECT_DB_DDL'), "Forbidden actions include DIRECT_DB_DDL");
  assert(finProfile.forbiddenActions.includes('EXECUTE_UNAUTHORIZED_WIRE_TRANSFER'), "Forbidden actions include EXECUTE_UNAUTHORIZED_WIRE_TRANSFER");
  assert(finProfile.forbiddenActions.includes('DISABLE_AUDIT_LOG'), "Forbidden actions include DISABLE_AUDIT_LOG");

  // Require Human Approval
  assert(finProfile.requireHumanApproval.includes('create_wire_transfer'), "requireHumanApproval includes create_wire_transfer");
  assert(finProfile.requireHumanApproval.includes('approve_credit_limit'), "requireHumanApproval includes approve_credit_limit");

  // Regulations & Controls
  assert(finProfile.applicableRegulations.includes('EU_AI_ACT'), "Financial profile includes EU_AI_ACT");
  assert(finProfile.applicableRegulations.includes('DORA'), "Financial profile includes DORA");
  assert(finProfile.mandatoryControls.includes('CG-AG-03'), "Mandatory controls include CG-AG-03 (Human-in-the-Loop)");
  assert(finProfile.mandatoryControls.includes('CG-AG-07'), "Mandatory controls include CG-AG-07 (Audit Trail)");

  // Evidence Requirements
  assert(finProfile.evidenceRequirements.includes('decision_latency_ms'), "Evidence includes decision_latency_ms");
  assert(finProfile.evidenceRequirements.includes('agent_fingerprint'), "Evidence includes agent_fingerprint");
  assert(finProfile.evidenceRequirements.includes('compliance_profile_checksum'), "Evidence includes compliance_profile_checksum");
});

// --------------------------------------------------------------------------
// TEST 10: Cryptographic Verification & Tamper Detection
// --------------------------------------------------------------------------
runTest("10. Tamper Detection: Adulterating any field breaks cryptographic verification", () => {
  const validProfile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
  assert(ComplianceProfileRegistry.verifyProfileIntegrity(validProfile) === true, "Valid profile passes cryptographic verification");

  // Create a tampered copy with a covert forbiddenAction addition
  const tamperedProfile: ComplianceProfile = {
    ...validProfile,
    forbiddenActions: [...validProfile.forbiddenActions, 'COVERT_UNAUDITED_ACTION']
  };

  assert(ComplianceProfileRegistry.verifyProfileIntegrity(tamperedProfile) === false, "Tampered profile fails checksum verification");

  // Attempting to register a tampered profile throws an error
  let thrown = false;
  try {
    ComplianceProfileRegistry.register(tamperedProfile);
  } catch (err: any) {
    thrown = true;
    assert(err.message.includes('checksum mismatch'), "Registry rejects corrupted profile registration");
  }
  assert(thrown === true, "Registration of tampered profile throws exception");
});

// --------------------------------------------------------------------------
// TEST 11: ApplicabilityEngine Contextual Evaluation
// --------------------------------------------------------------------------
runTest("11. Applicability Engine: Contextual evaluation without universal legal claims", () => {
  const result = ApplicabilityEngine.evaluate({
    jurisdictions: ['EU'],
    industry: 'financial-services',
    dataClassification: 'RESTRICTED',
    riskTier: 'HIGH',
    autonomyLevel: 'SUPERVISED'
  });

  assert(result.applicableRegulations.includes('EU_AI_ACT'), "EU Financial High-Risk maps to EU_AI_ACT");
  assert(result.applicableRegulations.includes('DORA'), "EU Financial High-Risk maps to DORA");
  assert(result.applicableRegulations.includes('GDPR'), "EU Financial High-Risk maps to GDPR");
  assert(result.mandatoryControls.includes('CG-AG-03'), "High-Risk maps to CG-AG-03 (HITL)");
  assert(result.rationale.length > 0, "Provides contextual rationale for regulatory selection");
});

console.log("==================================================================");
console.log(`>>> ALL ${passedTests} CONTRACT TESTS PASSED DETERMINISTICALLY WITH ZERO DEFECTS <<<`);
console.log("==================================================================");
