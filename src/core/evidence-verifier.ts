import { EvidenceLedger, EvidenceLedgerEntry, AuditPack, calculateEventHash } from './evidence-ledger';
import { MerkleTree, MerkleInclusionProof } from './merkle-tree';

export interface AuditVerificationReport {
  valid: boolean;
  packId: string;
  agentId: string;
  checks: {
    hashIntegrity: boolean;
    merkleInclusion: boolean;
    passportBinding: boolean;
    profileChecksumMatch: boolean;
    causalChainValid: boolean;
  };
  errors: string[];
  verifiedAt: string;
}

export class EvidenceVerifier {
  public static verifyChain(entries: EvidenceLedgerEntry[]): { valid: boolean; totalEntries: number; error?: string } {
    return EvidenceLedger.verifyChain(entries);
  }

  public static verifyMerkleProof(proof: MerkleInclusionProof): boolean {
    return MerkleTree.verifyProof(proof);
  }

  public static verifyAuditPack(pack: AuditPack): AuditVerificationReport {
    const errors: string[] = [];
    const timestamp = new Date().toISOString();

    const report: AuditVerificationReport = {
      valid: false,
      packId: pack.packId,
      agentId: pack.agentId,
      checks: {
        hashIntegrity: false,
        merkleInclusion: false,
        passportBinding: false,
        profileChecksumMatch: false,
        causalChainValid: false
      },
      errors,
      verifiedAt: timestamp
    };

    if (!pack || !pack.targetEvidence) {
      errors.push('Audit pack or target evidence is null or undefined');
      return report;
    }

    const target = pack.targetEvidence;

    // 1. Target Event Hash Integrity
    const recomputedHash = calculateEventHash(target);
    if (recomputedHash === target.eventHash) {
      report.checks.hashIntegrity = true;
    } else {
      errors.push(`Target evidence hash mismatch: stored [${target.eventHash}], calculated [${recomputedHash}]`);
    }

    // 2. Merkle Inclusion Proof Verification
    const isMerkleValid = MerkleTree.verifyProof(pack.merkleProof);
    const proofMatchesTarget = pack.merkleProof.targetHash === target.eventHash;
    const rootMatches = pack.merkleProof.merkleRoot === pack.merkleRoot;

    if (isMerkleValid && proofMatchesTarget && rootMatches) {
      report.checks.merkleInclusion = true;
    } else {
      if (!isMerkleValid) errors.push('Merkle inclusion proof verification failed');
      if (!proofMatchesTarget) errors.push(`Merkle proof targetHash does not match target eventHash`);
      if (!rootMatches) errors.push('Merkle proof root does not match pack merkleRoot');
    }

    // 3. Passport Binding Verification
    if (target.agentId === pack.agentId && target.passportFingerprint === pack.passportFingerprint) {
      report.checks.passportBinding = true;
    } else {
      errors.push(`Passport binding mismatch: agentId (${target.agentId} vs ${pack.agentId}) or fingerprint mismatch`);
    }

    // 4. Compliance Profile Checksum Match
    if (
      target.complianceProfileId === pack.complianceProfileId &&
      target.complianceProfileChecksum === pack.complianceProfileChecksum &&
      pack.complianceProfileChecksum.length === 64
    ) {
      report.checks.profileChecksumMatch = true;
    } else {
      errors.push(`ComplianceProfile binding mismatch or invalid checksum [${pack.complianceProfileChecksum}]`);
    }

    // 5. Causal Chain Verification (for TOOL_EXECUTION following HITL)
    if (target.eventType === 'TOOL_EXECUTION') {
      const priorEvents = pack.correlatedChain || [];
      const hasPriorHitlDecision = priorEvents.some(
        e => e.eventType === 'HITL_DECISION' && e.operatorDecision === 'APPROVED' && e.capability === target.capability
      );
      const hasDirectAllow = priorEvents.some(
        e => e.eventType === 'GUARDIAN_DECISION' && e.verdict === 'ALLOW' && e.capability === target.capability
      );

      if (hasPriorHitlDecision || hasDirectAllow) {
        report.checks.causalChainValid = true;
      } else {
        errors.push(`Execution without authorization: TOOL_EXECUTION found without preceding APPROVED HITL_DECISION or ALLOW verdict`);
      }
    } else {
      report.checks.causalChainValid = true;
    }

    report.valid = Object.values(report.checks).every(Boolean) && errors.length === 0;
    return report;
  }
}
