/**
 * CG-AG GOVERNANCE OS — OPERATIONAL ALERTING SERVICE
 * Phase 9.3: Alert Evaluation, Thresholds & Escalation
 */

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OperationalAlert {
  alertId: string;
  title: string;
  severity: AlertSeverity;
  component: string;
  description: string;
  thresholdApplied: string;
  observedValue: string;
  triggeredAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  remediationSopRef: string;
}

export class AlertingService {
  private static alerts: OperationalAlert[] = [
    {
      alertId: 'ALT-2026-0091',
      title: 'Circuit Breaker Failsafe Tripped (Infinite Loop Containment)',
      severity: 'CRITICAL',
      component: 'OPERATE: Circuit Breakers',
      description: 'Runaway tool loop exceeded 15 iterations on AGT-OPS-1102. HARD_KILL failsafe activated.',
      thresholdApplied: 'Max Iterations: 15',
      observedValue: '16 Iterations detected',
      triggeredAt: '2026-08-27T15:20:00Z',
      status: 'RESOLVED',
      remediationSopRef: 'SOP-CB-01 (Circuit Breaker Recovery)'
    },
    {
      alertId: 'ALT-2026-8801',
      title: 'High-Value Financial Disbursal HITL Gate Approaching SLA',
      severity: 'HIGH',
      component: 'OPERATE: HITL Approvals',
      description: 'Loan disbursal request of R$ 85,000 pending review for > 45 minutes.',
      thresholdApplied: 'SLA Max: 60 minutes',
      observedValue: 'Elapsed: 48 minutes',
      triggeredAt: '2026-08-27T17:45:00Z',
      status: 'ACTIVE',
      remediationSopRef: 'SOP-HITL-02 (Queue Escalation)'
    }
  ];

  static getActiveAlerts(): OperationalAlert[] {
    return this.alerts.filter(a => a.status === 'ACTIVE');
  }

  static getAllAlerts(): OperationalAlert[] {
    return [...this.alerts];
  }

  static triggerAlert(alert: Omit<OperationalAlert, 'alertId' | 'triggeredAt' | 'status'>): OperationalAlert {
    const alertId = `ALT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newAlert: OperationalAlert = {
      alertId,
      triggeredAt: new Date().toISOString(),
      status: 'ACTIVE',
      ...alert
    };
    this.alerts.unshift(newAlert);
    return newAlert;
  }
}
