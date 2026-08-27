/**
 * Core Persistence Adapter & Transactional Control Plane Abstraction
 * Supports: Atomic Batch Commits, Rollback, Recovery Journals, Optimistic Locking & Multi-Tenant Scoping
 */

export interface PersistenceContext {
  tenantId: string;
  workspaceId: string;
  environment: 'development' | 'staging' | 'production';
}

export const DEFAULT_PERSISTENCE_CONTEXT: PersistenceContext = {
  tenantId: 'TENANT-DEFAULT',
  workspaceId: 'WS-DEFAULT',
  environment: 'production'
};

export interface VersionedEntity {
  version?: number;
  updatedAt?: string;
  tenantId?: string;
  workspaceId?: string;
}

export type TransactionStatus = 'PREPARED' | 'COMMITTED' | 'ROLLED_BACK' | 'RECOVERY_REQUIRED';

export interface TransactionJournalEntry {
  transactionId: string;
  operationType: string;
  affectedCollections: string[];
  timestamp: string;
  status: TransactionStatus;
  snapshotsBefore: Record<string, string | null>;
  payloadsCommitted: Record<string, string>;
  error?: string;
}

export interface BatchMutationItem<T = any> {
  collection: string;
  data: T;
  expectedVersion?: number;
}

export interface PersistenceError extends Error {
  code: 
    | 'CONCURRENT_MODIFICATION'
    | 'TRANSACTION_FAILED'
    | 'TRANSACTION_ROLLED_BACK'
    | 'TENANT_BOUNDARY_VIOLATION'
    | 'SCHEMA_VALIDATION_FAILED'
    | 'STORAGE_QUOTA_EXCEEDED'
    | 'INTEGRITY_VALIDATION_FAILED';
  details?: Record<string, any>;
}

export function createPersistenceError(code: PersistenceError['code'], message: string, details?: Record<string, any>): PersistenceError {
  const err = new Error(message) as PersistenceError;
  err.name = 'PersistenceError';
  err.code = code;
  err.details = details;
  return err;
}

export class PersistenceAdapter {
  private static activeContext: PersistenceContext = DEFAULT_PERSISTENCE_CONTEXT;
  private static inMemoryStore: Map<string, string> = new Map();
  private static journalKey = 'cgag:sys:transaction_journal_v1';
  private static failureInjectionHook?: (collection: string, operation: string) => boolean;

  static setContext(ctx: Partial<PersistenceContext>) {
    this.activeContext = { ...this.activeContext, ...ctx };
  }

  static getContext(): PersistenceContext {
    return { ...this.activeContext };
  }

  static setFailureInjectionHook(hook?: (collection: string, operation: string) => boolean) {
    this.failureInjectionHook = hook;
  }

  static buildScopedKey(collection: string, legacyKey?: string): string {
    const { tenantId, workspaceId, environment } = this.activeContext;
    if (tenantId === 'TENANT-DEFAULT' && workspaceId === 'WS-DEFAULT' && legacyKey) {
      return legacyKey;
    }
    return `cgag:${tenantId}:${workspaceId}:${environment}:${collection}`;
  }

  static read<T>(collection: string, legacyKey?: string): T | null {
    const primaryKey = this.buildScopedKey(collection, legacyKey);
    let raw: string | null = null;

    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(primaryKey);
      if (!raw && legacyKey && legacyKey !== primaryKey) {
        raw = localStorage.getItem(legacyKey);
      }
    } else {
      raw = this.inMemoryStore.get(primaryKey) || (legacyKey ? this.inMemoryStore.get(legacyKey) || null : null);
    }

    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`[PersistenceAdapter] Corrupted JSON in key ${primaryKey}:`, e);
      return null;
    }
  }

  static write<T extends VersionedEntity>(collection: string, data: T, legacyKey?: string, expectedVersion?: number): T {
    const primaryKey = this.buildScopedKey(collection, legacyKey);
    const existing = this.read<T>(collection, legacyKey);

    // Optimistic Concurrency Check
    if (existing && typeof expectedVersion === 'number') {
      const currentVer = existing.version || 1;
      if (currentVer !== expectedVersion) {
        throw createPersistenceError(
          'CONCURRENT_MODIFICATION',
          `Concurrent conflict on collection [${collection}]: expected version ${expectedVersion}, but found version ${currentVer}`,
          { collection, currentVersion: currentVer, expectedVersion }
        );
      }
    }

    // Injected Failure Simulation
    if (this.failureInjectionHook && this.failureInjectionHook(collection, 'write')) {
      throw createPersistenceError('STORAGE_QUOTA_EXCEEDED', `Simulated write failure on collection [${collection}]`);
    }

    const currentVersion = existing && typeof existing.version === 'number' ? existing.version : 0;
    const versionedData: T = Array.isArray(data)
      ? data
      : {
          ...data,
          version: currentVersion + 1,
          updatedAt: new Date().toISOString(),
          tenantId: data.tenantId || this.activeContext.tenantId,
          workspaceId: data.workspaceId || this.activeContext.workspaceId
        };

    const serialized = JSON.stringify(versionedData);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(primaryKey, serialized);
      } catch (err: any) {
        throw createPersistenceError('STORAGE_QUOTA_EXCEEDED', `Storage quota exceeded writing [${primaryKey}]`, { originalError: err });
      }
    } else {
      this.inMemoryStore.set(primaryKey, serialized);
    }

    return versionedData;
  }

  static delete(collection: string, legacyKey?: string) {
    const primaryKey = this.buildScopedKey(collection, legacyKey);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(primaryKey);
      if (legacyKey) localStorage.removeItem(legacyKey);
    } else {
      this.inMemoryStore.delete(primaryKey);
      if (legacyKey) this.inMemoryStore.delete(legacyKey);
    }
  }

  /**
   * Application-Level Atomic Batch Commit with Automatic Rollback and Journal Recording
   */
  static atomicStoreBatchCommit(
    operationType: string,
    mutations: BatchMutationItem[],
    legacyKeyMap?: Record<string, string>
  ): { transactionId: string; status: TransactionStatus } {
    const transactionId = `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const snapshotsBefore: Record<string, string | null> = {};
    const payloadsCommitted: Record<string, string> = {};
    const affectedCollections = mutations.map(m => m.collection);

    // 1. PHASE 1: PREPARE & SNAPSHOT PREVIOUS STATE
    for (const mut of mutations) {
      const legacyKey = legacyKeyMap ? legacyKeyMap[mut.collection] : undefined;
      const key = this.buildScopedKey(mut.collection, legacyKey);
      const rawBefore = typeof localStorage !== 'undefined'
        ? localStorage.getItem(key) || (legacyKey ? localStorage.getItem(legacyKey) : null)
        : this.inMemoryStore.get(key) || null;

      snapshotsBefore[key] = rawBefore;
    }

    const journalEntry: TransactionJournalEntry = {
      transactionId,
      operationType,
      affectedCollections,
      timestamp: new Date().toISOString(),
      status: 'PREPARED',
      snapshotsBefore,
      payloadsCommitted
    };
    this.recordJournalEntry(journalEntry);

    // 2. PHASE 2: EXECUTE MUTATIONS
    try {
      for (const mut of mutations) {
        const legacyKey = legacyKeyMap ? legacyKeyMap[mut.collection] : undefined;
        const key = this.buildScopedKey(mut.collection, legacyKey);

        // Optimistic locking check per mutation
        if (typeof mut.expectedVersion === 'number') {
          const current = this.read<any>(mut.collection, legacyKey);
          if (current && current.version !== mut.expectedVersion) {
            throw createPersistenceError(
              'CONCURRENT_MODIFICATION',
              `Conflict in batch commit on [${mut.collection}]: expected v${mut.expectedVersion}, observed v${current.version}`
            );
          }
        }

        // Test for injected failure
        if (this.failureInjectionHook && this.failureInjectionHook(mut.collection, 'atomicCommit')) {
          throw createPersistenceError('STORAGE_QUOTA_EXCEEDED', `Injected failure during commit of [${mut.collection}]`);
        }

        const serialized = JSON.stringify(mut.data);
        payloadsCommitted[key] = serialized;

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, serialized);
        } else {
          this.inMemoryStore.set(key, serialized);
        }
      }

      // 3. PHASE 3: COMMIT SUCCESS
      journalEntry.status = 'COMMITTED';
      journalEntry.payloadsCommitted = payloadsCommitted;
      this.recordJournalEntry(journalEntry);

      return { transactionId, status: 'COMMITTED' };
    } catch (err: any) {
      // 4. ROLLBACK ON FAILURE
      console.warn(`[PersistenceAdapter] Atomic commit failed for ${transactionId}. Rolling back previous state...`, err);

      for (const [key, prevRaw] of Object.entries(snapshotsBefore)) {
        if (prevRaw === null) {
          if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
          else this.inMemoryStore.delete(key);
        } else {
          if (typeof localStorage !== 'undefined') localStorage.setItem(key, prevRaw);
          else this.inMemoryStore.set(key, prevRaw);
        }
      }

      journalEntry.status = 'ROLLED_BACK';
      journalEntry.error = err.message || String(err);
      this.recordJournalEntry(journalEntry);

      throw createPersistenceError(
        'TRANSACTION_ROLLED_BACK',
        `Transaction ${transactionId} failed and was safely rolled back: ${err.message}`,
        { transactionId, originalError: err }
      );
    }
  }

  private static recordJournalEntry(entry: TransactionJournalEntry) {
    let journal = this.getJournal();
    const index = journal.findIndex(j => j.transactionId === entry.transactionId);
    if (index >= 0) {
      journal[index] = entry;
    } else {
      journal = [entry, ...journal].slice(0, 50); // Keep last 50 transactions
    }

    const serialized = JSON.stringify(journal);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.journalKey, serialized);
      } catch (e) {
        // journal full
      }
    } else {
      this.inMemoryStore.set(this.journalKey, serialized);
    }
  }

  static getJournal(): TransactionJournalEntry[] {
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(this.journalKey);
    } else {
      raw = this.inMemoryStore.get(this.journalKey) || null;
    }
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Recovers any interrupted or half-committed transactions upon system boot
   */
  static recoverPendingTransactions(): { recoveredCount: number; clean: boolean } {
    const journal = this.getJournal();
    let recoveredCount = 0;

    for (const entry of journal) {
      if (entry.status === 'PREPARED') {
        console.warn(`[PersistenceAdapter] Interrupted transaction detected: ${entry.transactionId}. Rolling back to safe state...`);
        for (const [key, prevRaw] of Object.entries(entry.snapshotsBefore)) {
          if (prevRaw === null) {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
            else this.inMemoryStore.delete(key);
          } else {
            if (typeof localStorage !== 'undefined') localStorage.setItem(key, prevRaw);
            else this.inMemoryStore.set(key, prevRaw);
          }
        }
        entry.status = 'ROLLED_BACK';
        entry.error = 'Recovered and rolled back on system startup';
        this.recordJournalEntry(entry);
        recoveredCount++;
      }
    }

    return { recoveredCount, clean: recoveredCount === 0 };
  }

  static seedJournalForTesting(entries: TransactionJournalEntry[]) {
    const serialized = JSON.stringify(entries);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.journalKey, serialized);
    } else {
      this.inMemoryStore.set(this.journalKey, serialized);
    }
  }

  static resetAllForTesting() {
    this.inMemoryStore.clear();
    this.failureInjectionHook = undefined;
    this.activeContext = DEFAULT_PERSISTENCE_CONTEXT;
  }
}
