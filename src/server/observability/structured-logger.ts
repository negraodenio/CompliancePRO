/**
 * CG-AG GOVERNANCE OS — STRUCTURED OPERATIONAL LOGGER
 * Phase 9.3: Correlation, Tracing & Telemetry Logging
 */

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface StructuredLogEvent {
  timestamp: string;
  eventId: string;
  severity: LogSeverity;
  component: string;
  operation: string;
  tenantId: string;
  workspaceId: string;
  actorId?: string;
  requestId?: string;
  correlationId: string;
  resourceId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'INTERCEPTED' | 'ROLLED_BACK';
  errorCode?: string;
  details?: Record<string, any>;
}

export class StructuredLogger {
  private static logs: StructuredLogEvent[] = [];

  static log(event: Omit<StructuredLogEvent, 'timestamp' | 'eventId'>): StructuredLogEvent {
    const timestamp = new Date().toISOString();
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Sanitize any accidental sensitive tokens
    const sanitizedDetails = event.details ? { ...event.details } : undefined;
    if (sanitizedDetails) {
      delete sanitizedDetails.password;
      delete sanitizedDetails.token;
      delete sanitizedDetails.apiKey;
      delete sanitizedDetails.DATABASE_URL;
    }

    const fullEvent: StructuredLogEvent = {
      timestamp,
      eventId,
      ...event,
      details: sanitizedDetails
    };

    this.logs.unshift(fullEvent);
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    return fullEvent;
  }

  static getRecentLogs(limit = 50, tenantId?: string): StructuredLogEvent[] {
    if (tenantId) {
      return this.logs.filter(l => l.tenantId === tenantId).slice(0, limit);
    }
    return this.logs.slice(0, limit);
  }

  static getTraceByCorrelationId(correlationId: string): StructuredLogEvent[] {
    return this.logs.filter(l => l.correlationId === correlationId);
  }

  static clearLogsForTesting(): void {
    this.logs = [];
  }
}
