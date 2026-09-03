/**
 * CG-AG PERSISTENCE & MULTI-TENANT ISOLATION REGRESSION SUITE
 * Comprehensive verification for FINDING-04, FINDING-05, and full client-side storage isolation.
 */

import { PersistenceAdapter } from '../src/web/services/persistence-adapter';
import { PolicyStore } from '../src/web/services/policy-store';
import { DecisionStore } from '../src/web/services/decision-store';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';
import { HitlStore } from '../src/web/services/hitl-store';
import { RemediationStore } from '../src/web/services/remediation-store';
import { IncidentStore } from '../src/web/services/incident-store';
import { FinOpsStore } from '../src/web/services/finops-store';
import { DossierStore } from '../src/web/services/dossier-store';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n[TEST] ${title}`);
}

console.log("==================================================================");
console.log(">>> CG-AG PERSISTENCE & TENANT ISOLATION: REGRESSION SUITE <<<");
console.log("==================================================================");

// 1. FINDING-04: PersistenceAdapter Cross-Tenant Fallback Prevention
section('FINDING-04: PersistenceAdapter Cross-Tenant Fallback Prevention');
PersistenceAdapter.resetAllForTesting();

// 1.1 Write data to TENANT-DEFAULT using legacyKey
PersistenceAdapter.setContext({
  tenantId: 'TENANT-DEFAULT',
  workspaceId: 'WS-DEFAULT',
  environment: 'production'
});
const defaultData = { id: 'CONFIDENTIAL-DEFAULT-01', secretNote: 'Tenant Default Data' };
PersistenceAdapter.write('custom_secrets', defaultData, 'legacy_custom_secrets');

const defaultRead = PersistenceAdapter.read<any>('custom_secrets', 'legacy_custom_secrets');
assert(defaultRead !== null && defaultRead.id === 'CONFIDENTIAL-DEFAULT-01', 'TENANT-DEFAULT reads its data via legacyKey fallback');

// 1.2 Switch to TENANT-ACME (empty tenant with no scoped data)
PersistenceAdapter.setContext({
  tenantId: 'TENANT-ACME',
  workspaceId: 'WS-DEFAULT',
  environment: 'production'
});

const acmeRead = PersistenceAdapter.read<any>('custom_secrets', 'legacy_custom_secrets');
assert(acmeRead === null, 'TENANT-ACME read returns null (NEVER falls back to TENANT-DEFAULT legacy data)');

// 1.3 Tenant A vs Tenant B isolation
PersistenceAdapter.setContext({ tenantId: 'TENANT-A', workspaceId: 'WS-01', environment: 'production' });
PersistenceAdapter.write('records', { id: 'REC-A', owner: 'TENANT-A' });

PersistenceAdapter.setContext({ tenantId: 'TENANT-B', workspaceId: 'WS-01', environment: 'production' });
const tenantBRead = PersistenceAdapter.read<any>('records');
assert(tenantBRead === null, 'TENANT-B cannot read TENANT-A records');

PersistenceAdapter.write('records', { id: 'REC-B', owner: 'TENANT-B' });
const tenantBWritten = PersistenceAdapter.read<any>('records');
assert(tenantBWritten !== null && tenantBWritten.id === 'REC-B', 'TENANT-B reads own records');

PersistenceAdapter.setContext({ tenantId: 'TENANT-A', workspaceId: 'WS-01', environment: 'production' });
const tenantARead = PersistenceAdapter.read<any>('records');
assert(tenantARead !== null && tenantARead.id === 'REC-A', 'TENANT-A reads own records without pollution');

// 2. FINDING-05: PolicyStore Tenant Partitioning
section('FINDING-05: PolicyStore Tenant Partitioning');
PolicyStore.resetToBaseline('TENANT-CORP-A');
PolicyStore.resetToBaseline('TENANT-CORP-B');

// 2.1 Create policy exception for TENANT-CORP-A
const excA = PolicyStore.recordPolicyException(
  'POL-CG-AG-03-01',
  'Formal Board Approval for Autonomous Trading Bot Beta',
  'Jane Doe (CISO Corp A)',
  '2026-12-31',
  'TENANT-CORP-A'
);
assert(excA.exception.accountableOwner === 'Jane Doe (CISO Corp A)', 'Exception recorded for TENANT-CORP-A');

// 2.2 Read policies as TENANT-CORP-B
const policiesB = PolicyStore.getPolicies('TENANT-CORP-B');
const polAuthB = policiesB.find(p => p.id === 'POL-CG-AG-03-01');
assert(polAuthB !== undefined && polAuthB.exceptions.length === 0, 'TENANT-CORP-B sees ZERO exceptions on POL-CG-AG-03-01 (Clean Baseline)');

// 2.3 Read policies as TENANT-CORP-A
const policiesA = PolicyStore.getPolicies('TENANT-CORP-A');
const polAuthA = policiesA.find(p => p.id === 'POL-CG-AG-03-01');
assert(polAuthA !== undefined && polAuthA.exceptions.length === 1, 'TENANT-CORP-A sees its 1 recorded exception');
assert(polAuthA?.exceptions[0].accountableOwner === 'Jane Doe (CISO Corp A)', 'Exception details match TENANT-CORP-A');

// 2.4 Create distinct exception for TENANT-CORP-B
PolicyStore.recordPolicyException(
  'POL-CG-AG-03-01',
  'Temporary sandbox exemption for Corp B testing',
  'John Smith (CISO Corp B)',
  '2026-10-15',
  'TENANT-CORP-B'
);

const updatedPoliciesB = PolicyStore.getPolicies('TENANT-CORP-B');
const updatedPolB = updatedPoliciesB.find(p => p.id === 'POL-CG-AG-03-01');
assert(updatedPolB !== undefined && updatedPolB.exceptions.length === 1, 'TENANT-CORP-B now has 1 exception');
assert(updatedPolB?.exceptions[0].accountableOwner === 'John Smith (CISO Corp B)', 'Corp B exception details match');

// Verify Corp A still has only Corp A's exception
const recheckPoliciesA = PolicyStore.getPolicies('TENANT-CORP-A');
const recheckPolA = recheckPoliciesA.find(p => p.id === 'POL-CG-AG-03-01');
assert(recheckPolA?.exceptions.length === 1 && recheckPolA.exceptions[0].accountableOwner === 'Jane Doe (CISO Corp A)', 'Corp A exception remains unaltered');

// 3. Full Domain Stores Tenant Partitioning
section('Full Domain Stores Tenant Partitioning');

// 3.1 DecisionStore: Operational Findings
DecisionStore.resetToBaseline('TENANT-CORP-A');
DecisionStore.resetToBaseline('TENANT-CORP-B');

DecisionStore.ingestFindings([
  {
    id: 'FIND-CORP-A-01',
    riskId: 'RISK-A-01',
    finding: 'Corp A internal model risk',
    sourceTarget: 'agent_a.py',
    systemId: 'SYS-A',
    severity: 'HIGH',
    likelihood: 'HIGH',
    impact: 'HIGH',
    category: 'AI_SECURITY',
    owner: { name: 'Owner A', role: 'Dev', department: 'AI' },
    status: 'PENDING_DECISION',
    decisionType: 'PENDING_DECISION',
    recommendedAction: 'Apply sandbox',
    controlId: 'CG-AG-01',
    controlName: 'Agent Identity',
    treatment: { actionRequired: 'Action A', assignedTo: 'Dev A', targetDueDate: '2026-12-01', status: 'PLANNED' },
    evidenceDigest: 'DIGEST-A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
], 'TENANT-CORP-A');

const findingsA = DecisionStore.getFindings('TENANT-CORP-A');
const findingsB = DecisionStore.getFindings('TENANT-CORP-B');
assert(findingsA.some(f => f.id === 'FIND-CORP-A-01'), 'TENANT-CORP-A findings contain FIND-CORP-A-01');
assert(!findingsB.some(f => f.id === 'FIND-CORP-A-01'), 'TENANT-CORP-B findings DO NOT contain FIND-CORP-A-01');

// 3.2 AuditLedgerStore
AuditLedgerStore.resetToBaseline('TENANT-CORP-A');
AuditLedgerStore.resetToBaseline('TENANT-CORP-B');

AuditLedgerStore.appendScanBlock('EV-CORP-A-99', { scanTarget: 'Corp A Secret Repo' }, 'Scanner A', 'PASSPORT_ISSUED', 'CG-AG-12', 'TENANT-CORP-A');
const blocksA = AuditLedgerStore.getBlocks('TENANT-CORP-A');
const blocksB = AuditLedgerStore.getBlocks('TENANT-CORP-B');
assert(blocksA.some(b => b.evidenceRef === 'EV-CORP-A-99'), 'TENANT-CORP-A ledger contains block EV-CORP-A-99');
assert(!blocksB.some(b => b.evidenceRef === 'EV-CORP-A-99'), 'TENANT-CORP-B ledger DOES NOT contain block EV-CORP-A-99');

// 3.3 EvidenceStore
EvidenceStore.resetToBaseline('TENANT-CORP-A');
EvidenceStore.resetToBaseline('TENANT-CORP-B');

EvidenceStore.ingestEvidence([
  {
    evidenceId: 'EV-CAT-CORP-A',
    title: 'Corp A Proprietary Scan Evidence',
    evidenceType: 'ASSESSMENT_EVIDENCE',
    pillar: 'ASSURE',
    controlId: 'CG-AG-11',
    controlName: 'Evidence & Verification',
    entityType: 'AGENT',
    entityId: 'AGT-CORP-A',
    entityName: 'Corp A Agent',
    timestamp: new Date().toISOString(),
    retentionPolicy: '7 Years',
    integrityDigest: 'DIGEST-A-SHA256',
    status: 'VERIFIED',
    payload: { sensitive: 'Corp A Data' },
    tenantId: 'TENANT-CORP-A'
  }
], 'TENANT-CORP-A');

const evidenceA = EvidenceStore.getEvidenceRecords('TENANT-CORP-A');
const evidenceB = EvidenceStore.getEvidenceRecords('TENANT-CORP-B');
assert(evidenceA.some(e => e.evidenceId === 'EV-CAT-CORP-A'), 'TENANT-CORP-A evidence catalog contains EV-CAT-CORP-A');
assert(!evidenceB.some(e => e.evidenceId === 'EV-CAT-CORP-A'), 'TENANT-CORP-B evidence catalog DOES NOT contain EV-CAT-CORP-A');

// 3.4 HitlStore
HitlStore.resetToBaseline('TENANT-CORP-A');
HitlStore.resetToBaseline('TENANT-CORP-B');

HitlStore.ingestGates([
  {
    gateId: 'GATE-CORP-A-01',
    actionTitle: 'Corp A High Value Wire Approval',
    agentId: 'AGT-A',
    agentName: 'Agent A',
    systemId: 'SYS-A',
    systemName: 'System A',
    requestedActionType: 'TRANSFER',
    actionPayload: { amount: 500000 },
    policyId: 'POL-01',
    policyName: 'Transfer Policy',
    controlId: 'CG-AG-04',
    severity: 'CRITICAL',
    status: 'PENDING_REVIEW',
    createdAt: new Date().toISOString()
  }
], 'TENANT-CORP-A');

const gatesA = HitlStore.getGates('TENANT-CORP-A');
const gatesB = HitlStore.getGates('TENANT-CORP-B');
assert(gatesA.some(g => g.gateId === 'GATE-CORP-A-01'), 'TENANT-CORP-A HITL gates contain GATE-CORP-A-01');
assert(!gatesB.some(g => g.gateId === 'GATE-CORP-A-01'), 'TENANT-CORP-B HITL gates DO NOT contain GATE-CORP-A-01');

// 3.5 RemediationStore
RemediationStore.resetToBaseline('TENANT-CORP-A');
RemediationStore.resetToBaseline('TENANT-CORP-B');

RemediationStore.ingestActions([
  {
    actionId: 'ACT-CORP-A-01',
    title: 'Corp A Model Retraining Plan',
    riskId: 'RISK-A-01',
    decisionId: 'DEC-A-01',
    controlId: 'CG-AG-05',
    controlName: 'Model Alignment',
    entityType: 'AGENT',
    affectedEntity: 'AGT-A',
    severity: 'HIGH',
    assignedTo: 'AI Squad A',
    assignedRole: 'ML Lead',
    slaTargetDate: '2026-11-01',
    status: 'OPEN',
    recommendedFix: 'Retrain with clean data',
    actionSteps: ['Step 1'],
    verificationMethod: 'AUTOMATED_RESCAN',
    createdAt: new Date().toISOString()
  }
], 'TENANT-CORP-A');

const actionsA = RemediationStore.getActions('TENANT-CORP-A');
const actionsB = RemediationStore.getActions('TENANT-CORP-B');
assert(actionsA.some(a => a.actionId === 'ACT-CORP-A-01'), 'TENANT-CORP-A remediation actions contain ACT-CORP-A-01');
assert(!actionsB.some(a => a.actionId === 'ACT-CORP-A-01'), 'TENANT-CORP-B remediation actions DO NOT contain ACT-CORP-A-01');

// 3.6 IncidentStore
IncidentStore.resetToBaseline('TENANT-CORP-A');
IncidentStore.resetToBaseline('TENANT-CORP-B');

const incResA = IncidentStore.authorizeSystemRecovery('INC-2026-0091', 'Corp A Recovery Rationale', 'Roberto Silva', 'TENANT-CORP-A');
assert(incResA.incident.containmentStatus === 'RECOVERED', 'Corp A incident recovery executed');

const incsA = IncidentStore.getIncidents('TENANT-CORP-A');
const incsB = IncidentStore.getIncidents('TENANT-CORP-B');
const inc001A = incsA.find(i => i.incidentId === 'INC-2026-0091');
const inc001B = incsB.find(i => i.incidentId === 'INC-2026-0091');
assert(inc001A?.containmentStatus === 'RECOVERED', 'Corp A incident is RECOVERED');
assert(inc001B?.containmentStatus === 'CONTAINED', 'Corp B incident remains baseline CONTAINED (No cross-tenant state bleeding)');

// 3.7 FinOpsStore
FinOpsStore.resetToBaseline('TENANT-CORP-A');
FinOpsStore.resetToBaseline('TENANT-CORP-B');

FinOpsStore.updateBudgetAndQuota('AGT-CREDIT-911E', 500000, 2000000000, 'RUNTIME_ENFORCED', 'Corp A Special Budget Increase', 'CISO Corp A', 'TENANT-CORP-A');
const finopsA = FinOpsStore.getUsage('TENANT-CORP-A');
const finopsB = FinOpsStore.getUsage('TENANT-CORP-B');
const fin001A = finopsA.find(f => f.entityId === 'AGT-CREDIT-911E');
const fin001B = finopsB.find(f => f.entityId === 'AGT-CREDIT-911E');
assert(fin001A?.monthlyBudgetUSD === 500000, 'Corp A budget updated to $500,000');
assert(fin001B?.monthlyBudgetUSD !== 500000, 'Corp B budget NOT altered by Corp A modification');

// 3.8 DossierStore
DossierStore.resetToBaseline('TENANT-CORP-A');
DossierStore.resetToBaseline('TENANT-CORP-B');

DossierStore.markDossierExported('DOS-2026-EUAI-001', 'TENANT-CORP-A');
const dossiersA = DossierStore.getDossiers('TENANT-CORP-A');
const dossiersB = DossierStore.getDossiers('TENANT-CORP-B');
const dos001A = dossiersA.find(d => d.dossierId === 'DOS-2026-EUAI-001');
const dos001B = dossiersB.find(d => d.dossierId === 'DOS-2026-EUAI-001');
assert(dos001A?.status === 'EXPORTED', 'Corp A dossier marked EXPORTED');
assert(dos001B?.status === 'INTEGRITY_VERIFIED', 'Corp B dossier status remains baseline INTEGRITY_VERIFIED');

// 4. Tenant Switching & Lifecycle Invariant Tests
section('Tenant Switching & Lifecycle Invariant Tests');

// 4.1 Switch Tenant A -> Tenant B -> Tenant A
PersistenceAdapter.setContext({ tenantId: 'TENANT-CORP-A' });
assert(PolicyStore.getPolicies().find(p => p.id === 'POL-CG-AG-03-01')?.exceptions.length === 1, 'Active context TENANT-CORP-A reads Corp A policies');

PersistenceAdapter.setContext({ tenantId: 'TENANT-CORP-B' });
assert(PolicyStore.getPolicies().find(p => p.id === 'POL-CG-AG-03-01')?.exceptions[0].accountableOwner === 'John Smith (CISO Corp B)', 'Switched context TENANT-CORP-B reads Corp B policies');

PersistenceAdapter.setContext({ tenantId: 'TENANT-CORP-A' });
assert(PolicyStore.getPolicies().find(p => p.id === 'POL-CG-AG-03-01')?.exceptions[0].accountableOwner === 'Jane Doe (CISO Corp A)', 'Switched back to TENANT-CORP-A reads pristine Corp A policies');

// 4.2 Reset context to default
PersistenceAdapter.resetAllForTesting();
assert(PersistenceAdapter.getContext().tenantId === 'TENANT-DEFAULT', 'PersistenceAdapter reset to default context cleanly');

console.log("\n==================================================================");
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log(">>> ALL PERSISTENCE & MULTI-TENANT ISOLATION TESTS PASSED <<<");
  process.exit(0);
}
