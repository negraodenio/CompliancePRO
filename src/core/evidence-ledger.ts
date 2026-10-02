import crypto from 'crypto';
import { GuardianVerdict } from './guardian-service';
import { MerkleTree, MerkleInclusionProof } from './merkle-tree';
import { PersistenceAdapter } from '../web/services/persistence-adapter';

export const GENESIS_PREVIOUS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export type EvidenceEventType = 
  | 'AGENT_PROVISIONED'
  | 'RUNTIME_CREATED'
  | 'RUNTIME_STARTING'
  | 'RUNTIME_STARTED'
  | 'RUNTIME_STOPPED'
  | 'RUNTIME_FAILED'
  | 'RUNTIME_REVOKED'
  | 'AGENT_EXECUTION_STARTED'
  | 'AGENT_EXECUTION_RESUMED'
  | 'AGENT_EXECUTION_COMPLETED'
  | 'AGENT_EXECUTION_BLOCKED'
  | 'CAPABILITY_REQUESTED'
  | 'GUARDIAN_DECISION'
  | 'HITL_REQUEST'
  | 'HITL_DECISION'
  | 'TOOL_EXECUTION'
  | 'TOOL_REQUEST'
  | 'TOOL_RESPONSE'
  | 'TOOL_ERROR'
  | 'MODEL_INVOCATION'
  | 'MODEL_REQUEST'
  | 'MODEL_RESPONSE'
  | 'MODEL_ERROR'
  | 'DATA_EGRESS'
  | 'DATA_REQUEST'
  | 'DATA_RESPONSE'
  | 'DATA_ERROR'
  // S8-5 Active Governance & Continuous Guardian Events
  | 'AGENT_STARTED'
  | 'AGENT_STOPPED'
  | 'MODEL_REQUESTED'
  | 'MODEL_ALLOWED'
  | 'MODEL_BLOCKED'
  | 'TOOL_REQUESTED'
  | 'TOOL_ALLOWED'
  | 'TOOL_BLOCKED'
  | 'DATA_REQUESTED'
  | 'DATA_ALLOWED'
  | 'DATA_BLOCKED'
  | 'POLICY_EVALUATED'
  | 'HITL_REQUIRED'
  | 'HITL_APPROVED'
  | 'HITL_REJECTED'
  | 'CAPABILITY_DENIED'
  | 'RISK_DETECTED'
  | 'PASSPORT_VIOLATION'
  | 'PASSPORT_COMPLIANT'
  | 'TENANT_VIOLATION'
  | 'EXECUTION_STARTED'
  | 'EXECUTION_PAUSED'
  | 'EXECUTION_RESUMED'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED';

export interface EvidenceLedgerEntry {
  evidenceId: string;
  sequence: number;
  timestamp: string;
  eventType: EvidenceEventType;
  agentId: string;
  passportFingerprint: string;
  complianceProfileId: string;
  complianceProfileChecksum: string;
  policyId?: string;
  policyVersion?: string;
  controlId?: string;
  channel?: string;
  capability?: string;
  action?: string;
  verdict?: GuardianVerdict;
  operatorId?: string;
  operatorDecision?: 'APPROVED' | 'REJECTED';
  executionResult?: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  payloadDigest?: string;
  previousHash: string;
  eventHash: string;
}

export type CreateEvidenceEntryInput = Omit<EvidenceLedgerEntry, 'sequence' | 'previousHash' | 'eventHash'>;

export interface AuditPack {
  packId: string;
  generatedAt: string;
  agentId: string;
  passportFingerprint: string;
  complianceProfileId: string;
  complianceProfileChecksum: string;
  targetEvidence: EvidenceLedgerEntry;
  correlatedChain: EvidenceLedgerEntry[];
  merkleProof: MerkleInclusionProof;
  merkleRoot: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'TAMPERED';
}

export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalizeJson(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalizeJson(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

export function calculateEventHash(entry: Omit<EvidenceLedgerEntry, 'eventHash'>): string {
  const canonical = canonicalizeJson({
    evidenceId: entry.evidenceId,
    sequence: entry.sequence,
    timestamp: entry.timestamp,
    eventType: entry.eventType,
    agentId: entry.agentId,
    passportFingerprint: entry.passportFingerprint,
    complianceProfileId: entry.complianceProfileId,
    complianceProfileChecksum: entry.complianceProfileChecksum,
    policyId: entry.policyId || null,
    policyVersion: entry.policyVersion || null,
    controlId: entry.controlId || null,
    channel: entry.channel || null,
    capability: entry.capability || null,
    action: entry.action || null,
    verdict: entry.verdict || null,
    operatorId: entry.operatorId || null,
    operatorDecision: entry.operatorDecision || null,
    executionResult: entry.executionResult || null,
    payloadDigest: entry.payloadDigest || null,
    previousHash: entry.previousHash
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export class EvidenceLedger {
  private static inMemoryChain: EvidenceLedgerEntry[] = [];
  private static isInitialized = false;

  private static ensureInitialized(tenantId?: string) {
    if (!this.isInitialized) {
      if (tenantId) {
        PersistenceAdapter.setContext({ tenantId });
      }
      try {
        const persisted = PersistenceAdapter.read<EvidenceLedgerEntry[]>('evidence_chain', 'cg_ag_evidence_chain_v1');
        if (persisted && Array.isArray(persisted) && persisted.length > 0) {
          this.inMemoryChain = [...persisted];
        }
      } catch (err) {
        // Fallback to memory
      }
      this.isInitialized = true;
    }
  }

  public static reset(tenantId?: string) {
    this.inMemoryChain = [];
    this.isInitialized = true;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    try {
      PersistenceAdapter.write('evidence_chain', [], 'cg_ag_evidence_chain_v1');
    } catch {
      // Ignored
    }
  }

  public static append(input: CreateEvidenceEntryInput, tenantId?: string): EvidenceLedgerEntry {
    this.ensureInitialized(tenantId);
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }

    const sequence = this.inMemoryChain.length + 1;
    const previousHash = sequence === 1 
      ? GENESIS_PREVIOUS_HASH 
      : this.inMemoryChain[this.inMemoryChain.length - 1].eventHash;

    const draft: Omit<EvidenceLedgerEntry, 'eventHash'> = {
      ...input,
      sequence,
      previousHash
    };

    const eventHash = calculateEventHash(draft);
    const entry: EvidenceLedgerEntry = {
      ...draft,
      eventHash
    };

    this.inMemoryChain.push(entry);

    try {
      PersistenceAdapter.write('evidence_chain', this.inMemoryChain, 'cg_ag_evidence_chain_v1');
    } catch {
      // Memory fallback safe
    }

    return entry;
  }

  public static getEntries(agentId?: string, tenantId?: string): EvidenceLedgerEntry[] {
    this.ensureInitialized(tenantId);
    if (agentId) {
      return this.inMemoryChain.filter(e => e.agentId === agentId);
    }
    return [...this.inMemoryChain];
  }

  public static getEntryById(evidenceId: string, tenantId?: string): EvidenceLedgerEntry | undefined {
    this.ensureInitialized(tenantId);
    return this.inMemoryChain.find(e => e.evidenceId === evidenceId);
  }

  public static verifyChain(entriesToVerify?: EvidenceLedgerEntry[]): {
    valid: boolean;
    totalEntries: number;
    error?: string;
    brokenSequence?: number;
  } {
    const chain = entriesToVerify || this.inMemoryChain;

    if (chain.length === 0) {
      return { valid: true, totalEntries: 0 };
    }

    for (let i = 0; i < chain.length; i++) {
      const current = chain[i];
      const expectedSequence = i + 1;

      if (current.sequence !== expectedSequence) {
        return {
          valid: false,
          totalEntries: chain.length,
          brokenSequence: current.sequence,
          error: `Sequence discontinuity: expected sequence ${expectedSequence}, got ${current.sequence}`
        };
      }

      if (i === 0) {
        if (current.previousHash !== GENESIS_PREVIOUS_HASH) {
          return {
            valid: false,
            totalEntries: chain.length,
            brokenSequence: 1,
            error: `Invalid genesis previousHash: expected ${GENESIS_PREVIOUS_HASH}, got ${current.previousHash}`
          };
        }
      } else {
        const previous = chain[i - 1];
        if (current.previousHash !== previous.eventHash) {
          return {
            valid: false,
            totalEntries: chain.length,
            brokenSequence: current.sequence,
            error: `Broken hash chain at sequence ${current.sequence}: previousHash (${current.previousHash}) does not match previous eventHash (${previous.eventHash})`
          };
        }
      }

      const recalculatedHash = calculateEventHash(current);
      if (current.eventHash !== recalculatedHash) {
        return {
          valid: false,
          totalEntries: chain.length,
          brokenSequence: current.sequence,
          error: `Event hash mismatch at sequence ${current.sequence}: stored hash (${current.eventHash}) does not match recalculated hash (${recalculatedHash})`
        };
      }
    }

    return {
      valid: true,
      totalEntries: chain.length
    };
  }

  public static getMerkleRoot(tenantId?: string): string {
    this.ensureInitialized(tenantId);
    if (this.inMemoryChain.length === 0) {
      return GENESIS_PREVIOUS_HASH;
    }
    const tree = new MerkleTree(this.inMemoryChain.map(e => e.eventHash));
    return tree.getRoot();
  }

  public static generateMerkleProof(sequenceOrId: number | string, tenantId?: string): MerkleInclusionProof {
    this.ensureInitialized(tenantId);
    if (this.inMemoryChain.length === 0) {
      throw new Error('Ledger is empty; cannot generate Merkle proof');
    }

    const index = typeof sequenceOrId === 'number'
      ? sequenceOrId - 1
      : this.inMemoryChain.findIndex(e => e.evidenceId === sequenceOrId);

    if (index < 0 || index >= this.inMemoryChain.length) {
      throw new Error(`Entry ${sequenceOrId} not found in evidence ledger`);
    }

    const tree = new MerkleTree(this.inMemoryChain.map(e => e.eventHash));
    return tree.generateProof(index);
  }

  public static buildAuditPack(targetEvidenceId: string, tenantId?: string): AuditPack {
    this.ensureInitialized(tenantId);

    const targetIndex = this.inMemoryChain.findIndex(e => e.evidenceId === targetEvidenceId);
    if (targetIndex < 0) {
      throw new Error(`Target evidence ID "${targetEvidenceId}" not found in ledger`);
    }

    const target = this.inMemoryChain[targetIndex];
    const tree = new MerkleTree(this.inMemoryChain.map(e => e.eventHash));
    const merkleProof = tree.generateProof(targetIndex);
    const merkleRoot = tree.getRoot();

    const correlatedChain = this.inMemoryChain.filter(e => 
      e.agentId === target.agentId && e.sequence <= target.sequence
    );

    return {
      packId: `PACK-${Date.now().toString(36).toUpperCase()}-${target.sequence}`,
      generatedAt: new Date().toISOString(),
      agentId: target.agentId,
      passportFingerprint: target.passportFingerprint,
      complianceProfileId: target.complianceProfileId,
      complianceProfileChecksum: target.complianceProfileChecksum,
      targetEvidence: target,
      correlatedChain,
      merkleProof,
      merkleRoot,
      status: 'VERIFIED'
    };
  }
}
