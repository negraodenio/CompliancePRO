/**
 * CG-AG GOVERNANCE OS — OPERATIONAL TELEMETRY SERVICE
 * Phase 9.3: Metrics, Counters & Velocity Trackers
 */

export interface OperationalMetrics {
  requestCount: number;
  avgLatencyMs: number;
  errorRate: number;
  databaseLatencyMs: number;
  occConflictsCount: number;
  authorizationDenialsCount: number;
  tenantViolationsCount: number;
  hitlQueueDepth: number;
  pendingDecisionsCount: number;
  pendingRemediationsCount: number;
  activeIncidentsCount: number;
  circuitBreakersTripped: number;
  finopsTotalTokens: number;
  finopsTotalSpendUSD: number;
  evidenceRecordsCount: number;
  ledgerHeight: number;
  ledgerIntegrityValid: boolean;
}

export class TelemetryService {
  private static metrics: OperationalMetrics = {
    requestCount: 1420,
    avgLatencyMs: 4.2,
    errorRate: 0.001,
    databaseLatencyMs: 1.8,
    occConflictsCount: 0,
    authorizationDenialsCount: 0,
    tenantViolationsCount: 0,
    hitlQueueDepth: 2,
    pendingDecisionsCount: 3,
    pendingRemediationsCount: 3,
    activeIncidentsCount: 0,
    circuitBreakersTripped: 1,
    finopsTotalTokens: 38400000,
    finopsTotalSpendUSD: 438.20,
    evidenceRecordsCount: 6,
    ledgerHeight: 6,
    ledgerIntegrityValid: true
  };

  static getMetrics(): OperationalMetrics {
    return { ...this.metrics };
  }

  static recordOccConflict(): void {
    this.metrics.occConflictsCount++;
  }

  static recordAuthDenial(): void {
    this.metrics.authorizationDenialsCount++;
  }

  static recordTenantViolation(): void {
    this.metrics.tenantViolationsCount++;
  }

  static updateLedgerMetrics(height: number, isValid: boolean): void {
    this.metrics.ledgerHeight = height;
    this.metrics.ledgerIntegrityValid = isValid;
  }
}
