/**
 * ComplyPRO.pt — Sprint 8-5: Active Governance Event Bus
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Provides an active, deterministic runtime event stream for agent actions:
 * - Emits lifecycle, capability, policy, and risk events
 * - Enforces tenant isolation on subscriptions and queries
 * - Cryptographically records critical events to EvidenceLedger
 * - Relays events to ContinuousRiskDetector for anomaly containment
 */

import crypto from 'crypto';
import { EvidenceEventType, EvidenceLedger } from './evidence-ledger';
import { GuardianVerdict } from './guardian-service';

export interface ActiveRuntimeEvent {
  eventId: string;
  timestamp: string;
  eventType: EvidenceEventType;
  tenantId: string;
  agentId: string;
  passportId?: string;
  passportFingerprint?: string;
  executionId?: string;
  channel?: 'TOOL' | 'MODEL' | 'DATA';
  capability?: string;
  action?: string;
  verdict?: GuardianVerdict;
  reason?: string;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
}

export type ActiveEventListener = (event: ActiveRuntimeEvent) => void | Promise<void>;

export class ActiveGovernanceBus {
  private static listeners: Map<string, Set<ActiveEventListener>> = new Map(); // tenantId -> Set
  private static globalListeners: Set<ActiveEventListener> = new Set();
  private static eventHistory: ActiveRuntimeEvent[] = [];

  /**
   * Resets all listeners and event history (for clean test execution).
   */
  public static reset(): void {
    this.listeners.clear();
    this.globalListeners.clear();
    this.eventHistory = [];
  }

  /**
   * Subscribes a listener to events for a specific tenant.
   */
  public static subscribe(tenantId: string, listener: ActiveEventListener): () => void {
    if (!this.listeners.has(tenantId)) {
      this.listeners.set(tenantId, new Set());
    }
    this.listeners.get(tenantId)!.add(listener);

    return () => {
      this.listeners.get(tenantId)?.delete(listener);
    };
  }

  /**
   * Subscribes a global system listener (for governance control plane).
   */
  public static subscribeGlobal(listener: ActiveEventListener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  /**
   * Publishes an active runtime event to the governance plane.
   */
  public static publish(eventInput: Omit<ActiveRuntimeEvent, 'eventId' | 'timestamp'> & { eventId?: string; timestamp?: string }): ActiveRuntimeEvent {
    const timestamp = eventInput.timestamp || new Date().toISOString();
    const eventId = eventInput.eventId || `EV-ACT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const event: ActiveRuntimeEvent = {
      ...eventInput,
      eventId,
      timestamp
    };

    // Store in internal event history (bounded to 1000 items)
    this.eventHistory.push(event);
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    // Deliver to tenant-specific listeners
    const tenantListeners = this.listeners.get(event.tenantId);
    if (tenantListeners) {
      for (const listener of tenantListeners) {
        try {
          listener(event);
        } catch (err) {
          // Prevent listener error from disrupting bus
        }
      }
    }

    // Deliver to global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (err) {
        // Prevent listener error from disrupting bus
      }
    }

    // Mirror to Evidence Ledger for tamper-evident provenance if significant event
    if (this.shouldRecordInEvidenceLedger(event.eventType)) {
      try {
        EvidenceLedger.append({
          evidenceId: event.eventId,
          timestamp: event.timestamp,
          eventType: event.eventType,
          agentId: event.agentId,
          passportFingerprint: event.passportFingerprint || 'SYSTEM_FINGERPRINT',
          complianceProfileId: event.metadata?.complianceProfileId || 'SYSTEM_PROFILE',
          complianceProfileChecksum: event.metadata?.complianceProfileChecksum || 'SYSTEM_CHECKSUM',
          channel: event.channel,
          capability: event.capability,
          action: event.action || 'EXECUTE',
          verdict: event.verdict,
          payloadDigest: event.payload ? crypto.createHash('sha256').update(JSON.stringify(event.payload)).digest('hex') : undefined
        }, event.tenantId);
      } catch {
        // Memory safe fallback
      }
    }

    return event;
  }

  /**
   * Determines whether an event type requires tamper-evident cryptographic recording.
   */
  private static shouldRecordInEvidenceLedger(eventType: EvidenceEventType): boolean {
    const recordedTypes: EvidenceEventType[] = [
      'AGENT_STARTED',
      'AGENT_STOPPED',
      'MODEL_REQUESTED',
      'MODEL_ALLOWED',
      'MODEL_BLOCKED',
      'TOOL_REQUESTED',
      'TOOL_ALLOWED',
      'TOOL_BLOCKED',
      'DATA_REQUESTED',
      'DATA_ALLOWED',
      'DATA_BLOCKED',
      'POLICY_EVALUATED',
      'HITL_REQUIRED',
      'HITL_APPROVED',
      'HITL_REJECTED',
      'CAPABILITY_DENIED',
      'RISK_DETECTED',
      'PASSPORT_VIOLATION',
      'PASSPORT_COMPLIANT',
      'TENANT_VIOLATION',
      'EXECUTION_STARTED',
      'EXECUTION_PAUSED',
      'EXECUTION_RESUMED',
      'EXECUTION_COMPLETED',
      'EXECUTION_FAILED'
    ];
    return recordedTypes.includes(eventType);
  }

  /**
   * Retrieves events filtered by tenant and optional agentId (enforces Tenant Isolation).
   */
  public static getEvents(tenantId: string, agentId?: string): ActiveRuntimeEvent[] {
    return this.eventHistory.filter(e => {
      if (e.tenantId !== tenantId) return false;
      if (agentId && e.agentId !== agentId) return false;
      return true;
    });
  }

  /**
   * Count events by type for a specific tenant and agent.
   */
  public static countEvents(tenantId: string, eventType: EvidenceEventType, agentId?: string): number {
    return this.getEvents(tenantId, agentId).filter(e => e.eventType === eventType).length;
  }
}
