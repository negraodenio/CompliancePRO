/**
 * COMPLYPRO Academy — curriculum & store validation.
 * Dependency-free harness (house rule: zero new dependencies).
 * vitest is NOT a declared dependency; the runner is local. Failures
 * propagate to the process exit code so the governance suite reports them.
 */
let harnessChecks = 0;
const harnessFailures: string[] = [];

const describe = (_name: string, fn: () => void): void => { fn(); };
const it = (name: string, fn: () => void): void => {
  try {
    fn();
    harnessChecks++;
    console.log(`  [PASS ${harnessChecks}]: ${name}`);
  } catch (err) {
    harnessFailures.push(name);
    console.error(`  [FAIL]: ${name} -> ${(err as Error).stack || String(err)}`);
  }
};
const expect = (actual: unknown) => ({
  toBe: (expected: unknown): void => {
    if (!Object.is(actual, expected)) {
      throw new Error(`expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
    }
  },
  toBeDefined: (): void => {
    if (actual === undefined || actual === null) throw new Error('expected value to be defined');
  },
  toBeUndefined: (): void => {
    if (actual !== undefined) throw new Error(`expected undefined but received ${JSON.stringify(actual)}`);
  },
  toBeGreaterThan: (bound: number): void => {
    if (typeof actual !== 'number' || !(actual > bound)) {
      throw new Error(`expected ${String(actual)} to be greater than ${bound}`);
    }
  },
  toBeGreaterThanOrEqual: (bound: number): void => {
    if (typeof actual !== 'number' || !(actual >= bound)) {
      throw new Error(`expected ${String(actual)} to be >= ${bound}`);
    }
  },
  toBeLessThan: (bound: number): void => {
    if (typeof actual !== 'number' || !(actual < bound)) {
      throw new Error(`expected ${String(actual)} to be less than ${bound}`);
    }
  },
  toContain: (part: string | number): void => {
    if (Array.isArray(actual)) {
      if (!actual.includes(part)) {
        throw new Error(`expected array to contain ${JSON.stringify(part)}`);
      }
      return;
    }
    if (typeof actual !== 'string' || !actual.includes(String(part))) {
      throw new Error(`expected ${JSON.stringify(actual)} to contain ${JSON.stringify(part)}`);
    }
  },
  toBeGreaterThanLength: (bound: number): void => {
    if (!Array.isArray(actual) && typeof actual !== 'string') {
      throw new Error('expected array or string');
    }
    if (!(actual.length > bound)) {
      throw new Error(`expected length > ${bound} but received ${actual.length}`);
    }
  }
});

import {
  ACADEMY_MODULES,
  ACADEMY_LEVELS,
  ACADEMY_GLOSSARY,
  getAcademyModuleById,
  getNextAcademyModule,
  getPreviousAcademyModule,
  searchAcademyModules,
  getGlossaryEntries,
  AcademyStore,
  QUIZ_PASS_THRESHOLD
} from '../src/web/services/academy-store';
import { DecisionStore } from '../src/web/services/decision-store';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';

const VALID_NAV_VIEWS = new Set([
  'ai-agents', 'studio-builder', 'cockpit-control', 'overview-center',
  'discover-inventory', 'discover-agents', 'discover-passports', 'discover-assessments',
  'govern-controls', 'govern-risk', 'govern-policies', 'govern-compliance',
  'operate-decisions', 'operate-approvals', 'operate-actions', 'operate-incidents',
  'operate-runtime', 'assure-evidence', 'assure-audit', 'assure-reports',
  'assure-simulator', 'assure-readiness', 'tools-scanner', 'tools-operations',
  'tools-deployment', 'tools-integrations', 'learn-academy', 'manage-team', 'settings'
]);

describe('ComplyPRO Academy: 6-level curriculum, 20 modules, PT-PT', () => {
  it('1. Contains exactly 20 modules numbered 1..20 in order', () => {
    expect(ACADEMY_MODULES.length).toBe(20);
    ACADEMY_MODULES.forEach((m, i) => expect(m.moduleNumber).toBe(i + 1));
  });

  it('2. Defines exactly 6 levels, each referencing real module ids', () => {
    expect(ACADEMY_LEVELS.length).toBe(6);
    ACADEMY_LEVELS.forEach((lvl) => {
      expect(lvl.moduleIds.length).toBeGreaterThan(0);
      lvl.moduleIds.forEach((id) => expect(getAcademyModuleById(id)).toBeDefined());
    });
  });

  it('3. Every module belongs to a valid level with correct levelNumber', () => {
    ACADEMY_MODULES.forEach((m) => {
      const lvl = ACADEMY_LEVELS.find((l) => l.levelNumber === m.levelNumber);
      expect(lvl).toBeDefined();
      expect(lvl!.moduleIds).toContain(m.id);
    });
  });

  it('4. Unique module ids and unique relatedNavView targets are valid ActiveNavView values', () => {
    const ids = new Set<string>();
    ACADEMY_MODULES.forEach((m) => {
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
      if (m.relatedNavView) {
        expect(VALID_NAV_VIEWS.has(m.relatedNavView)).toBe(true);
      }
    });
  });

  it('5. Full pedagogical structure present in every module (objectives, concept, terminology, steps, example, mistakes, exercise, quiz, skills, summary, criterion)', () => {
    ACADEMY_MODULES.forEach((m) => {
      expect(m.title.length).toBeGreaterThan(5);
      expect(m.subtitle.length).toBeGreaterThan(5);
      expect(m.learningObjectives.length).toBeGreaterThanOrEqual(3);
      expect(m.conceptExplanation.length).toBeGreaterThan(150);
      expect(m.terminology.length).toBeGreaterThanOrEqual(4);
      expect(m.stepByStep.length).toBeGreaterThanOrEqual(5);
      expect(m.businessExample.length).toBeGreaterThan(80);
      expect(m.commonMistakes.length).toBeGreaterThanOrEqual(2);
      expect(m.exercise.steps.length).toBeGreaterThanOrEqual(3);
      expect(m.exercise.doneCriterion.length).toBeGreaterThan(10);
      expect(m.knowledgeCheck.length).toBeGreaterThanOrEqual(3);
      expect(m.skillsChecklist.length).toBeGreaterThanOrEqual(4);
      expect(m.summary.length).toBeGreaterThan(60);
      expect(m.completionCriterion.length).toBeGreaterThan(10);
      expect(m.estimatedMinutes).toBeGreaterThan(0);
    });
  });

  it('6. Quiz integrity: every question has >=2 options, valid correctIndex and a non-trivial explanation', () => {
    ACADEMY_MODULES.forEach((m) => {
      m.knowledgeCheck.forEach((q) => {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(15);
        expect(q.question.length).toBeGreaterThan(10);
      });
    });
  });

  it('7. Required curriculum coverage: SIPOC, scanner, agent registration, governance, CG-AGF, HITL, evidence, dossiers, multi-tenancy, incidents, regulation, metrics, capstone', () => {
    const titles = ACADEMY_MODULES.map((m) => m.title.toLowerCase()).join(' | ');
    expect(titles).toContain('si');
    expect(titles).toContain('scanner');
    expect(titles).toContain('agente');
    expect(titles).toContain('governa');
    expect(titles).toContain('human-in-the-loop');
    expect(titles).toContain('evid');
    expect(titles).toContain('dossier');
    expect(titles).toContain('multi-tenancy');
    expect(titles).toContain('incidente');
    expect(titles).toContain('regulamenta');
    expect(titles).toContain('métrica');
    expect(titles).toContain('projeto final');
  });

  it('8. Content is PT-PT and ComplyPRO-branded (no legacy CG-AG branding in titles, no English titles)', () => {
    ACADEMY_MODULES.forEach((m) => {
      expect(m.title.includes('CG-AG Governance OS')).toBe(false);
      expect(m.title.includes('Introduction')).toBe(false);
      expect(m.title.includes('The ')).toBe(false);
      expect(m.subtitle.includes('Governance OS')).toBe(false);
    });
  });

  it('9. SIPOC module teaches the method honestly (no fabricated native editor claim)', () => {
    const sipoc = getAcademyModuleById('ac-04-processos-sipoc');
    expect(sipoc).toBeDefined();
    expect(sipoc!.conceptExplanation).toContain('SIPOC');
    const honest = sipoc!.conceptExplanation.includes('NÃO dispõe') || sipoc!.conceptExplanation.includes('nao dispoe') || sipoc!.conceptExplanation.toLowerCase().includes('não dispõe de um editor');
    expect(honest).toBe(true);
  });

  it('10. Module 20 (capstone) includes rubric and the "sem valor de acreditação externa" disclaimer', () => {
    const capstone = getAcademyModuleById('ac-20-projeto-final');
    expect(capstone).toBeDefined();
    expect(capstone!.conceptExplanation).toContain('RUBRICA');
    expect(capstone!.limitations).toBeDefined();
    expect(capstone!.limitations!.join(' ')).toContain('acreditação externa');
  });

  it('11. Navigation helpers: next/previous module chain is consistent', () => {
    expect(getNextAcademyModule(ACADEMY_MODULES[0].id)).toBeDefined();
    expect(getNextAcademyModule(ACADEMY_MODULES[0].id)!.moduleNumber).toBe(2);
    expect(getPreviousAcademyModule(ACADEMY_MODULES[1].id)!.moduleNumber).toBe(1);
    expect(getNextAcademyModule(ACADEMY_MODULES[19].id)).toBeUndefined();
    expect(getPreviousAcademyModule(ACADEMY_MODULES[0].id)).toBeUndefined();
  });

  it('12. Search finds modules by title and by terminology content', () => {
    const byTitle = searchAcademyModules('SIPOC');
    expect(byTitle.length).toBeGreaterThanOrEqual(1);
    const byTerm = searchAcademyModules('prompt injection');
    expect(byTerm.length).toBeGreaterThanOrEqual(1);
    expect(searchAcademyModules('zzz-no-match-zzz').length).toBe(0);
  });

  it('13. Glossary has >=40 entries with definitions and valid related module links', () => {
    expect(ACADEMY_GLOSSARY.length).toBeGreaterThanOrEqual(40);
    ACADEMY_GLOSSARY.forEach((g) => {
      expect(g.term.length).toBeGreaterThan(1);
      expect(g.definition.length).toBeGreaterThan(10);
      g.relatedModuleIds.forEach((id) => expect(getAcademyModuleById(id)).toBeDefined());
    });
    expect(getGlossaryEntries('SIPOC').length).toBeGreaterThanOrEqual(1);
  });

  it('14. Store: initial progress, quiz/exercise completion gate, and certificate eligibility after all modules', () => {
    const initial = AcademyStore.getProgress();
    expect(initial.completedModuleIds.length).toBe(0);
    expect(initial.currentModuleId).toBe(ACADEMY_MODULES[0].id);

    const first = ACADEMY_MODULES[0].id;
    AcademyStore.recordQuizScore(first, QUIZ_PASS_THRESHOLD);
    expect(AcademyStore.getProgress().completedModuleIds.includes(first)).toBe(false);
    AcademyStore.setExerciseDone(first, true);
    expect(AcademyStore.getProgress().completedModuleIds).toContain(first);

    expect(AcademyStore.isCertificateEligible(AcademyStore.getProgress())).toBe(false);

    ACADEMY_MODULES.forEach((m) => {
      AcademyStore.recordQuizScore(m.id, 100);
      AcademyStore.setExerciseDone(m.id, true);
    });
    const final = AcademyStore.getProgress();
    expect(final.completedModuleIds.length).toBe(20);
    expect(AcademyStore.isCertificateEligible(final)).toBe(true);
    expect(AcademyStore.getCompletionPercent(final)).toBe(100);
  });

  it('15. Store: certificate issuance produces id and timestamp; sub-threshold quiz never completes a module', () => {
    ACADEMY_MODULES.forEach((m) => {
      AcademyStore.recordQuizScore(m.id, 100);
      AcademyStore.setExerciseDone(m.id, true);
    });
    const issued = AcademyStore.issueCertificate('Analista de Governança');
    expect(issued.certificateIssuedAt).toBeDefined();
    expect(issued.certificateId).toBeDefined();
    expect(issued.certificateId!).toContain('CPA-');
    expect(issued.studentName).toBe('Analista de Governança');

    AcademyStore.resetProgress();
    const second = ACADEMY_MODULES[1].id;
    AcademyStore.recordQuizScore(second, QUIZ_PASS_THRESHOLD - 10);
    AcademyStore.setExerciseDone(second, true);
    expect(AcademyStore.getProgress().completedModuleIds.includes(second)).toBe(false);
  });

  it('16. Academy progress does not pollute DecisionStore, EvidenceStore or AuditLedger', () => {
    const findingsBefore = DecisionStore.getFindings().length;
    const evidenceBefore = EvidenceStore.getEvidenceRecords().length;
    const blocksBefore = AuditLedgerStore.getBlocks().length;

    AcademyStore.recordQuizScore(ACADEMY_MODULES[0].id, 100);
    AcademyStore.setExerciseDone(ACADEMY_MODULES[0].id, true);
    AcademyStore.recordQuizScore(ACADEMY_MODULES[1].id, 100);
    AcademyStore.setExerciseDone(ACADEMY_MODULES[1].id, true);

    expect(DecisionStore.getFindings().length).toBe(findingsBefore);
    expect(EvidenceStore.getEvidenceRecords().length).toBe(evidenceBefore);
    expect(AuditLedgerStore.getBlocks().length).toBe(blocksBefore);
  });
});

console.log(`\nAcademy curriculum suite: ${harnessChecks} passed, ${harnessFailures.length} failed.`);
if (harnessFailures.length > 0) {
  process.exit(1);
}
