/**
 * CG-AG GOVERNANCE OS — PRIVACY-PRESERVING COMMERCIAL FUNNEL ANALYTICS
 * Tracks conversion velocity from Visitor -> Free Scan -> Snapshot -> Signup -> Workspace
 * ZERO Source Code, ZERO Secrets, ZERO Sensitive Payload Storage
 */

export type FunnelEventName = 
  | 'VISIT'
  | 'FREE_SCAN_CLICK'
  | 'SCAN_STARTED'
  | 'SCAN_COMPLETED'
  | 'SNAPSHOT_VIEWED'
  | 'PRESERVE_CLICKED'
  | 'SIGNUP_STARTED'
  | 'WORKSPACE_CREATED'
  | 'GOVERNANCE_ENTERED';

export interface FunnelEvent {
  event: FunnelEventName;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

export class FunnelAnalytics {
  private static events: FunnelEvent[] = [];
  private static listeners: Array<(event: FunnelEvent) => void> = [];

  static track(event: FunnelEventName, metadata?: Record<string, string | number | boolean>): void {
    // Sanitization: Guarantee strictly primitive non-sensitive metadata only
    const sanitizedMetadata: Record<string, string | number | boolean> = {};
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          // Never log strings that look like secrets or raw code snippets
          if (typeof v === 'string' && (v.includes('sk-') || v.includes('Bearer') || v.length > 100)) {
            continue;
          }
          sanitizedMetadata[k] = v;
        }
      }
    }

    const item: FunnelEvent = {
      event,
      timestamp: new Date().toISOString(),
      metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined
    };

    this.events.push(item);
    if (this.events.length > 200) this.events.shift();

    // Persist session events in sessionStorage for conversion tracking
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('cgag:funnel_events', JSON.stringify(this.events.slice(-50)));
      }
    } catch {
      // Ignore storage restrictions in private browsing
    }

    this.listeners.forEach(fn => {
      try {
        fn(item);
      } catch (err) {
        console.warn('[FunnelAnalytics] Listener error:', err);
      }
    });
  }

  static getEvents(): FunnelEvent[] {
    return [...this.events];
  }

  static getEventCount(event: FunnelEventName): number {
    return this.events.filter(e => e.event === event).length;
  }

  static clear(): void {
    this.events = [];
  }

  static subscribe(fn: (event: FunnelEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}
