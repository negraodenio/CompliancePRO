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
  private static inMemoryChains: Map<string, EvidenceLedgerEntry[]> = new Map();
  private static initializedTenants: Set<string> = new Set();
  public static readonly DEFAULT_TENANT = 'TENANT-DEFAULT';

  private static resolveTenant(tenantId?: string): string {
    const ctx = PersistenceAdapter.getContext();
    return tenantId || ctx.tenantId || this.DEFAULT_TENANT;
  }

  private static getChain(tenantId: string): EvidenceLedgerEntry[] {
    if (!this.inMemoryChains.has(tenantId)) {
      this.inMemoryChains.set(tenantId, []);
    }
    return this.inMemoryChains.get(tenantId)!;
  }

  private static ensureInitialized(tenantId?: string) {
    const resolvedTenant = this.resolveTenant(tenantId);
    if (!this.initializedTenants.has(resolvedTenant)) {
      PersistenceAdapter.setContext({ tenantId: resolvedTenant });
      try {
        const persisted = PersistenceAdapter.read<EvidenceLedgerEntry[]>('evidence_chain', 'cg_ag_evidence_chain_v1');
        if (persisted && Array.isArray(persisted) && persisted.length > 0) {
          this.inMemoryChains.set(resolvedTenant, [...persisted]);
        }
      } catch (err) {
        // Fallback to memory
      }
      this.initializedTenants.add(resolvedTenant);
    }
  }

  public static reset(tenantId?: string) {
    if (tenantId) {
      this.inMemoryChains.set(tenantId, []);
      this.initializedTenants.add(tenantId);
      PersistenceAdapter.setContext({ tenantId });
      try {
        PersistenceAdapter.write('evidence_chain', [], 'cg_ag_evidence_chain_v1');
      } catch {
        // Ignored
      }
    } else {
      this.inMemoryChains.clear();
      this.initializedTenants.clear();
      this.inMemoryChains.set(this.DEFAULT_TENANT, []);
      this.initializedTenants.add(this.DEFAULT_TENANT);
      PersistenceAdapter.setContext({ tenantId: this.DEFAULT_TENANT });
      try {
        PersistenceAdapter.write('evidence_chain', [], 'cg_ag_evidence_chain_v1');
      } catch {
        // Ignored
      }
    }
  }

  public static append(input: CreateEvidenceEntryInput, tenantId?: string): EvidenceLedgerEntry {
    const resolvedTenant = this.resolveTenant(tenantId);
    this.ensureInitialized(resolvedTenant);
    PersistenceAdapter.setContext({ tenantId: resolvedTenant });

    const chain = this.getChain(resolvedTenant);
    const sequence = chain.length + 1;
    const previousHash = sequence === 1 
      ? GENESIS_PREVIOUS_HASH 
      : chain[chain.length - 1].eventHash;

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

    chain.push(entry);

    try {
      PersistenceAdapter.write('evidence_chain', chain, 'cg_ag_evidence_chain_v1');
    } catch {
      // Memory fallback safe
    }

    return entry;
  }

  public static getEntries(agentId?: string, tenantId?: string): EvidenceLedgerEntry[] {
    const resolvedTenant = this.resolveTenant(tenantId);
    this.ensureInitialized(resolvedTenant);
    const chain = this.getChain(resolvedTenant);
    if (agentId) {
      return chain.filter(e => e.agentId === agentId);
    }
    return [...chain];
  }

  public static getEntryById(evidenceId: string, tenantId?: string): EvidenceLedgerEntry | undefined {
    if (tenantId) {
      const resolvedTenant = this.resolveTenant(tenantId);
      this.ensureInitialized(resolvedTenant);
      return this.getChain(resolvedTenant).find(e => e.evidenceId === evidenceId);
    }
    const currentTenant = this.resolveTenant();
    this.ensureInitialized(currentTenant);
    const found = this.getChain(currentTenant).find(e => e.evidenceId === evidenceId);
    if (found) return found;

    for (const chain of this.inMemoryChains.values()) {
      const e = chain.find(item => item.evidenceId === evidenceId);
      if (e) return e;
    }
    return undefined;
  }

  public static verifyChain(entriesToVerify?: EvidenceLedgerEntry[] | string, tenantId?: string): {
    valid: boolean;
    totalEntries: number;
    error?: string;
    brokenSequence?: number;
  } {
    let entries: EvidenceLedgerEntry[] | undefined;
    let effectiveTenant: string | undefined = tenantId;
    if (typeof entriesToVerify === 'string') {
      effectiveTenant = entriesToVerify;
      entries = undefined;
    } else {
      entries = entriesToVerify;
    }

    const resolvedTenant = this.resolveTenant(effectiveTenant);
    this.ensureInitialized(resolvedTenant);
    const chain = entries || this.getChain(resolvedTenant);

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
    const resolvedTenant = this.resolveTenant(tenantId);
    this.ensureInitialized(resolvedTenant);
    const chain = this.getChain(resolvedTenant);
    if (chain.length === 0) {
      return GENESIS_PREVIOUS_HASH;
    }
    const tree = new MerkleTree(chain.map(e => e.eventHash));
    return tree.getRoot();
  }

  public static generateMerkleProof(sequenceOrId: number | string, tenantId?: string): MerkleInclusionProof {
    const resolvedTenant = this.resolveTenant(tenantId);
    this.ensureInitialized(resolvedTenant);
    const chain = this.getChain(resolvedTenant);
    if (chain.length === 0) {
      throw new Error('Ledger is empty; cannot generate Merkle proof');
    }

    const index = typeof sequenceOrId === 'number'
      ? sequenceOrId - 1
      : chain.findIndex(e => e.evidenceId === sequenceOrId);

    if (index < 0 || index >= chain.length) {
      throw new Error(`Entry ${sequenceOrId} not found in evidence ledger`);
    }

    const tree = new MerkleTree(chain.map(e => e.eventHash));
    return tree.generateProof(index);
  }

  public static buildAuditPack(targetEvidenceId: string, tenantId?: string): AuditPack {
    const resolvedTenant = this.resolveTenant(tenantId);
    this.ensureInitialized(resolvedTenant);
    const chain = this.getChain(resolvedTenant);

    const targetIndex = chain.findIndex(e => e.evidenceId === targetEvidenceId);
    if (targetIndex < 0) {
      throw new Error(`Target evidence ID "${targetEvidenceId}" not found in ledger`);
    }

    const target = chain[targetIndex];
    const tree = new MerkleTree(chain.map(e => e.eventHash));
    const merkleProof = tree.generateProof(targetIndex);
    const merkleRoot = tree.getRoot();

    const correlatedChain = chain.filter(e => 
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
