import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACADEMY_MODULES,
  AcademyStore
} from '../src/web/services/academy-store';
import { DecisionStore } from '../src/web/services/decision-store';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';

describe('CG-AG Academy: In-Product Instructional Learning Center', () => {
  beforeEach(() => {
    AcademyStore.resetProgress();
  });

  it('1. Contains exactly 18 comprehensive instructional modules', () => {
    expect(ACADEMY_MODULES.length).toBe(18);
    const moduleNumbers = ACADEMY_MODULES.map(m => m.moduleNumber);
    for (let i = 1; i <= 18; i++) {
      expect(moduleNumbers).toContain(i);
    }
  });

  it('2. Enforces full pedagogical structure (WHAT, WHY, HOW, USE, INTERPRET, AUDIT) across all 18 modules', () => {
    ACADEMY_MODULES.forEach(mod => {
      expect(mod.id).toBeDefined();
      expect(mod.title.length).toBeGreaterThan(5);
      expect(mod.subtitle.length).toBeGreaterThan(5);
      expect(mod.whatIsIt.length).toBeGreaterThan(20);
      expect(mod.whyItExists.length).toBeGreaterThan(20);
      expect(mod.howItWorks.length).toBeGreaterThan(20);
      expect(mod.howToUse.length).toBeGreaterThan(0);
      expect(mod.whatYouSee.length).toBeGreaterThan(10);
      expect(mod.howToInterpret.length).toBeGreaterThan(0);
      expect(mod.howToProveAndAudit.length).toBeGreaterThan(10);
      expect(mod.knowledgeCheck.length).toBeGreaterThan(0);
    });
  });

  it('3. Provides valid cross-module connections with real navigation view targets', () => {
    ACADEMY_MODULES.forEach(mod => {
      expect(mod.crossModuleConnections.length).toBeGreaterThan(0);
      mod.crossModuleConnections.forEach(conn => {
        expect(conn.source).toBeDefined();
        expect(conn.relationship).toBeDefined();
        expect(conn.target).toBeDefined();
        expect(conn.targetNavView).toBeDefined();
      });
    });
  });

  it('4. Tracks progress, saves completion, and auto-advances current module', () => {
    const initial = AcademyStore.getProgress();
    expect(initial.completedModuleIds.length).toBe(0);
    expect(initial.currentModuleId).toBe('mod-01');

    const updated = AcademyStore.markModuleCompleted('mod-01', 100);
    expect(updated.completedModuleIds).toContain('mod-01');
    expect(updated.currentModuleId).toBe('mod-02');
    expect(updated.quizScores['mod-01']).toBe(100);
  });

  it('5. Successfully unlocks Official Certificate when all 18 modules are completed', () => {
    AcademyStore.setStudentName('Lead AI Compliance Officer');

    ACADEMY_MODULES.forEach(mod => {
      AcademyStore.markModuleCompleted(mod.id, 100);
    });

    const finalProgress = AcademyStore.getProgress();
    expect(finalProgress.completedModuleIds.length).toBe(18);
    expect(finalProgress.certificateId).toBeDefined();
    expect(finalProgress.certificateId).toContain('CERT-CGAG-');
    expect(finalProgress.certificateIssuedAt).toBeDefined();
    expect(finalProgress.studentName).toBe('Lead AI Compliance Officer');
  });

  it('6. Evaluates knowledge check questions accurately with explanations', () => {
    const mod1 = ACADEMY_MODULES[0];
    const q1 = mod1.knowledgeCheck[0];
    expect(q1.question).toBeDefined();
    expect(q1.options.length).toBe(4);
    expect(q1.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q1.correctIndex).toBeLessThan(4);
    expect(q1.explanation.length).toBeGreaterThan(10);
  });

  it('7. Preserves Data Isolation: Academy progress never pollutes DecisionStore or Audit Ledger', () => {
    const findingsBefore = DecisionStore.getFindings().length;
    const blocksBefore = AuditLedgerStore.getBlocks().length;
    const evidenceBefore = EvidenceStore.getEvidenceRecords().length;

    // Complete multiple modules
    AcademyStore.markModuleCompleted('mod-01', 100);
    AcademyStore.markModuleCompleted('mod-02', 100);
    AcademyStore.markModuleCompleted('mod-03', 100);

    const findingsAfter = DecisionStore.getFindings().length;
    const blocksAfter = AuditLedgerStore.getBlocks().length;
    const evidenceAfter = EvidenceStore.getEvidenceRecords().length;

    expect(findingsAfter).toBe(findingsBefore);
    expect(blocksAfter).toBe(blocksBefore);
    expect(evidenceAfter).toBe(evidenceBefore);
  });

  it('8. Resets progress cleanly back to 0 modules completed without errors', () => {
    AcademyStore.markModuleCompleted('mod-01', 100);
    expect(AcademyStore.getProgress().completedModuleIds.length).toBe(1);

    const reset = AcademyStore.resetProgress();
    expect(reset.completedModuleIds.length).toBe(0);
    expect(reset.currentModuleId).toBe('mod-01');
    expect(Object.keys(reset.quizScores).length).toBe(0);
  });
});
