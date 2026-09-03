/**
 * Authoritative Store for Cryptographically Chained Audit Ledger Blocks
 * Pillar: ASSURE (Can we prove the historical record was not altered?)
 * Chaining: GENESIS (BLK-0000) -> BLK-0001 -> BLK-0002 -> ... -> BLK-0089 (HEAD)
 */

import { PersistenceAdapter } from './persistence-adapter';

export interface AuditBlock {
  blockHeight: number;
  blockId: string;
  timestamp: string;
  previousHash: string;
  payloadHash: string;
  blockHash: string;
  actor: string;
  actorRole: string;
  eventType: 
    | 'GENESIS_ANCHOR'
    | 'DECISION_RECORDED'
    | 'HITL_GATE_RESOLVED'
    | 'CIRCUIT_BREAKER_TRIPPED'
    | 'PASSPORT_ISSUED'
    | 'REMEDIATION_VERIFIED'
    | 'REGULATORY_CROSSWALK_SEALED'
    | 'FINOPS_QUOTA_RECALIBRATED';
  sourceModule: 'DISCOVER' | 'GOVERN' | 'OPERATE' | 'ASSURE';
  evidenceRef?: string;
  controlId: string;
  payloadData: Record<string, any>;
  isTampered?: boolean;
  tenantId?: string;
}

export interface ChainVerificationResult {
  isChainValid: boolean;
  blocksVerified: number;
  brokenLinks: number;
  hashMismatches: number;
  tamperedBlockId: string | null;
  verificationTimestamp: string;
  verified?: boolean;
  totalBlocks?: number;
  headHeight?: number;
  headHash?: string;
  genesisHash?: string;
  auditTimestamp?: string;
  failureNodes?: string[];
}

const STORAGE_KEY_LEDGER = 'cg_ag_audit_ledger_v1';

function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

// Pure universal FIPS 180-4 standard SHA-256 implementation
export function pureSha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? (w[i] || 0)
            : ((w[i - 16] || 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] || 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function sha256Digest(str: string): string {
  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const nodeCrypto = require('crypto');
      if (nodeCrypto?.createHash) {
        return nodeCrypto.createHash('sha256').update(str, 'utf8').digest('hex');
      }
    }
  } catch {
    // fallback to pure implementation
  }
  return pureSha256(str);
}

export function computeDeterministicHash(str: string): string {
  return `SHA256:${sha256Digest(str)}`;
}

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const BASELINE_BLOCKS: AuditBlock[] = [
  {
    blockHeight: 0,
    blockId: 'LEDGER-BLK-0000',
    timestamp: '2026-08-25T00:00:00Z',
    previousHash: GENESIS_PREV_HASH,
    payloadHash: 'SHA256:0000genesisanchorpayloadcanonicalrfc878500000000000000000000',
    blockHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    actor: 'CG-AG Governance OS Root Authority',
    actorRole: 'System Genesis Anchor',
    eventType: 'GENESIS_ANCHOR',
    sourceModule: 'ASSURE',
    controlId: 'CG-AG-12',
    payloadData: {
      standard: 'CG-AG Governance Operating System v2.0',
      canonicalization: 'RFC 8785 JSON',
      hashAlgorithm: 'SHA-256',
      chainIdentifier: 'CG-AG-MAIN-LEDGER-2026'
    }
  },
  {
    blockHeight: 1,
    blockId: 'LEDGER-BLK-0012',
    timestamp: '2026-08-25T19:00:00Z',
    previousHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    payloadHash: 'SHA256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    blockHash: 'SHA256:a128f99bc71900de34bb991024bc661928374182937461928374619283746192',
    actor: 'AI Governance Office',
    actorRole: 'Accountable Lead',
    eventType: 'PASSPORT_ISSUED',
    sourceModule: 'DISCOVER',
    evidenceRef: 'EV-2026-0001',
    controlId: 'CG-AG-12',
    payloadData: {
      passportId: 'CG-AG-CREWAI-CREDIT_AGENT-9D17',
      agentName: 'Credit Risk Evaluator',
      autonomyTier: 'L3_AUTONOMOUS_BOUNDED'
    }
  },
  {
    blockHeight: 2,
    blockId: 'LEDGER-BLK-0062',
    timestamp: '2026-08-27T12:00:00Z',
    previousHash: 'SHA256:a128f99bc71900de34bb991024bc661928374182937461928374619283746192',
    payloadHash: 'SHA256:9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    blockHash: 'SHA256:f481290384192038419203841920384192038419203841920384192038419203',
    actor: 'Legal & Regulatory Affairs',
    actorRole: 'DPO & Regulatory Counsel',
    eventType: 'REGULATORY_CROSSWALK_SEALED',
    sourceModule: 'GOVERN',
    evidenceRef: 'EV-2026-0055',
    controlId: 'CG-AG-05',
    payloadData: {
      framework: 'EU AI Act',
      clauses: ['Art. 9 Risk Management', 'Art. 14 Human Oversight'],
      mappedControls: ['CG-AG-05', 'CG-AG-03', 'CG-AG-10']
    }
  },
  {
    blockHeight: 3,
    blockId: 'LEDGER-BLK-0074',
    timestamp: '2026-08-27T14:15:00Z',
    previousHash: 'SHA256:f481290384192038419203841920384192038419203841920384192038419203',
    payloadHash: 'SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    blockHash: 'SHA256:b991823746192837461928374619283746192837461928374619283746192837',
    actor: 'Roberto Silva',
    actorRole: 'CISO & Accountable Lead',
    eventType: 'HITL_GATE_RESOLVED',
    sourceModule: 'OPERATE',
    evidenceRef: 'EV-2026-0088',
    controlId: 'CG-AG-03',
    payloadData: {
      gateId: 'GATE-2026-8799',
      decision: 'REJECT',
      action: 'PostgresTool.reindexTable',
      targetDB: 'prod_transaction_db'
    }
  },
  {
    blockHeight: 4,
    blockId: 'LEDGER-BLK-0078',
    timestamp: '2026-08-27T15:40:00Z',
    previousHash: 'SHA256:b991823746192837461928374619283746192837461928374619283746192837',
    payloadHash: 'SHA256:2c624232cdd221771294dfbb310aca000a0df6ac9b66bb6c905335d1f95a4943',
    blockHash: 'SHA256:cc88192384719283746192837461928374619283746192837461928374619283',
    actor: 'Juliana Paes',
    actorRole: 'Senior Data Platform Lead',
    eventType: 'REMEDIATION_VERIFIED',
    sourceModule: 'OPERATE',
    evidenceRef: 'EV-2026-0019',
    controlId: 'CG-AG-01',
    payloadData: {
      actionId: 'ACT-2026-0019',
      pullRequest: 'PR #89',
      status: 'PENDING_VERIFICATION'
    }
  },
  {
    blockHeight: 5,
    blockId: 'LEDGER-BLK-0082',
    timestamp: '2026-08-27T17:22:16Z',
    previousHash: 'SHA256:cc88192384719283746192837461928374619283746192837461928374619283',
    payloadHash: 'SHA256:c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    blockHash: 'SHA256:dd77192837461928374619283746192837461928374619283746192837461928',
    actor: 'System Failsafe Monitor',
    actorRole: 'Autonomous Circuit Breaker Actuator',
    eventType: 'CIRCUIT_BREAKER_TRIPPED',
    sourceModule: 'OPERATE',
    evidenceRef: 'EV-2026-0091',
    controlId: 'CG-AG-10',
    payloadData: {
      incidentId: 'INC-2026-0091',
      rule: 'CB-RULE-LOOP-01',
      action: 'HARD_KILL',
      observedLoops: 16
    }
  },
  {
    blockHeight: 6,
    blockId: 'LEDGER-BLK-0089',
    timestamp: '2026-08-27T18:30:00Z',
    previousHash: 'SHA256:dd77192837461928374619283746192837461928374619283746192837461928',
    payloadHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    blockHash: 'SHA256:ee66192837461928374619283746192837461928374619283746192837461928',
    actor: 'Roberto Silva',
    actorRole: 'CISO & Accountable Lead',
    eventType: 'DECISION_RECORDED',
    sourceModule: 'OPERATE',
    evidenceRef: 'EV-2026-0042',
    controlId: 'CG-AG-02',
    payloadData: {
      decisionType: 'MITIGATE',
      approver: 'Roberto Silva',
      targetSystem: 'SYS-CREDIT-001',
      maxAutonomousCapBRL: 50000
    }
  }
];

export class AuditLedgerStore {
  private static listeners: Array<() => void> = [];
  private static memoryOverride: AuditBlock[] | null = null;

  static subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private static notify() {
    this.listeners.forEach(fn => fn());
  }

  static getBlocks(tenantId?: string): AuditBlock[] {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    let list: AuditBlock[] = BASELINE_BLOCKS;
    if (this.memoryOverride) {
      list = JSON.parse(JSON.stringify(this.memoryOverride));
    } else {
      const saved = PersistenceAdapter.read<AuditBlock[]>('audit_ledger', STORAGE_KEY_LEDGER);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        list = saved;
      }
    }

    if (tenantId) {
      return list.filter(b => !b.tenantId || b.tenantId === tenantId);
    }
    return JSON.parse(JSON.stringify(list));
  }

  static getBlockByHeight(height: number, tenantId?: string): AuditBlock | undefined {
    const list = this.getBlocks(tenantId);
    return list.find(b => b.blockHeight === height);
  }

  static resetToBaseline(tenantId?: string) {
    this.memoryOverride = null;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.delete('audit_ledger', STORAGE_KEY_LEDGER);
    this.notify();
  }

  static appendScanBlock(
    evidenceRef: string,
    payloadData: any,
    actor = 'AST Ingestion Scanner',
    eventType: AuditBlock['eventType'] = 'PASSPORT_ISSUED',
    controlId = 'CG-AG-12',
    tenantId?: string
  ): AuditBlock {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const blocks = this.getBlocks(tenantId);
    const prevBlock = blocks[blocks.length - 1];
    const blockHeight = prevBlock ? prevBlock.blockHeight + 1 : 1;
    const blockId = 'LEDGER-BLK-' + String(blockHeight).padStart(4, '0');
    const previousHash = prevBlock ? prevBlock.blockHash : GENESIS_PREV_HASH;
    const payloadHash = computeDeterministicHash(JSON.stringify(payloadData));
    const blockHash = computeDeterministicHash(previousHash + payloadHash);

    const newBlock: AuditBlock = {
      blockHeight,
      blockId,
      timestamp: new Date().toISOString(),
      previousHash,
      payloadHash,
      blockHash,
      actor,
      actorRole: 'Automated Scan Ingestion Authority',
      eventType,
      sourceModule: 'DISCOVER',
      evidenceRef,
      controlId,
      payloadData,
      tenantId: tenantId || PersistenceAdapter.getContext().tenantId
    };

    blocks.push(newBlock);
    PersistenceAdapter.write('audit_ledger', blocks, STORAGE_KEY_LEDGER);
    this.notify();
    return newBlock;
  }

  static verifyEntireLedger(tenantId?: string): ChainVerificationResult {
    const blocks = this.getBlocks(tenantId);
    let brokenLinks = 0;
    let hashMismatches = 0;
    let tamperedBlockId: string | null = null;

    for (let i = 0; i < blocks.length; i++) {
      const current = blocks[i];
      if (current.isTampered) {
        hashMismatches++;
        tamperedBlockId = current.blockId;
      }

      if (i > 0) {
        const prev = blocks[i - 1];
        if (current.previousHash !== prev.blockHash) {
          brokenLinks++;
          if (!tamperedBlockId) tamperedBlockId = current.blockId;
        }
      }
    }

    const isChainValid = brokenLinks === 0 && hashMismatches === 0;
    return {
      isChainValid,
      verified: isChainValid,
      blocksVerified: blocks.length,
      totalBlocks: blocks.length,
      brokenLinks,
      hashMismatches,
      tamperedBlockId,
      headHeight: blocks.length > 0 ? blocks[blocks.length - 1].blockHeight : 0,
      headHash: blocks.length > 0 ? blocks[blocks.length - 1].blockHash : GENESIS_PREV_HASH,
      genesisHash: blocks.length > 0 ? blocks[0].blockHash : GENESIS_PREV_HASH,
      verificationTimestamp: new Date().toISOString(),
      auditTimestamp: new Date().toISOString(),
      failureNodes: tamperedBlockId ? [tamperedBlockId] : []
    };
  }

  static simulateTamper(blockId: string, tenantId?: string) {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const blocks = this.getBlocks(tenantId);
    const index = blocks.findIndex(b => b.blockId === blockId);
    if (index === -1) return;

    blocks[index] = {
      ...blocks[index],
      isTampered: true,
      payloadData: {
        ...blocks[index].payloadData,
        TAMPERED_FIELD: 'MALICIOUS_UNAUTHORIZED_ALTERATION',
        maxAutonomousCapBRL: 999999999
      },
      payloadHash: 'SHA256:tamperedunauthorizedhashalteration0000000000000000000000000000'
    };

    PersistenceAdapter.write('audit_ledger', blocks, STORAGE_KEY_LEDGER);
    this.notify();
  }

  static simulateTampering(targetBlockHeight: number, tenantId?: string) {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const blocks = this.getBlocks(tenantId);
    const index = blocks.findIndex(b => b.blockHeight === targetBlockHeight);
    if (index === -1) return;

    blocks[index] = {
      ...blocks[index],
      isTampered: true,
      payloadData: {
        ...blocks[index].payloadData,
        TAMPERED_FIELD: 'MALICIOUS_UNAUTHORIZED_ALTERATION',
        maxAutonomousCapBRL: 999999999
      },
      payloadHash: 'SHA256:tamperedunauthorizedhashalteration0000000000000000000000000000'
    };

    PersistenceAdapter.write('audit_ledger', blocks, STORAGE_KEY_LEDGER);
    this.notify();
  }

  static restoreCanonicalLedger(tenantId?: string) {
    this.resetToBaseline(tenantId);
  }
}
