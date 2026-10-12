import {
  ACADEMY_MODULES,
  ACADEMY_LEVELS,
  ACADEMY_GLOSSARY,
  getAcademyModuleById,
  getNextAcademyModule,
  getPreviousAcademyModule,
  searchAcademyModules,
  getGlossaryEntries,
  QUIZ_PASS_THRESHOLD
} from '../data/academy';
import type { AcademyProgress } from '../data/academy';

const STORAGE_KEY_PROGRESS_V2 = 'complypro_academy_progress_v2';

let memoryProgress: AcademyProgress | null = null;

export {
  ACADEMY_MODULES,
  ACADEMY_LEVELS,
  ACADEMY_GLOSSARY,
  getAcademyModuleById,
  getNextAcademyModule,
  getPreviousAcademyModule,
  searchAcademyModules,
  getGlossaryEntries,
  QUIZ_PASS_THRESHOLD
};

export type { AcademyProgress };

function createInitialProgress(): AcademyProgress {
  return {
    version: 2,
    completedModuleIds: [],
    currentModuleId: ACADEMY_MODULES[0]?.id ?? '',
    quizBestScores: {},
    exerciseDoneModuleIds: []
  };
}

function isValidProgress(value: unknown): value is AcademyProgress {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<AcademyProgress>;
  return (
    p.version === 2 &&
    Array.isArray(p.completedModuleIds) &&
    typeof p.currentModuleId === 'string' &&
    typeof p.quizBestScores === 'object' &&
    p.quizBestScores !== null &&
    Array.isArray(p.exerciseDoneModuleIds)
  );
}

export class AcademyStore {
  static getProgress(): AcademyProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS_V2);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidProgress(parsed)) {
          memoryProgress = parsed;
          return parsed;
        }
      }
    } catch {
      // Storage unavailable (Node/tests/private mode): fall through.
    }
    if (memoryProgress) return memoryProgress;
    return createInitialProgress();
  }

  static saveProgress(progress: AcademyProgress): void {
    memoryProgress = progress;
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS_V2, JSON.stringify(progress));
    } catch {
      // Storage unavailable: in-memory progress remains for this session.
    }
  }

  static setCurrentModule(moduleId: string): AcademyProgress {
    const progress = AcademyStore.getProgress();
    const updated: AcademyProgress = {
      ...progress,
      currentModuleId: moduleId,
      lastVisitedAt: new Date().toISOString()
    };
    AcademyStore.saveProgress(updated);
    return updated;
  }

  static recordQuizScore(moduleId: string, scorePercent: number): AcademyProgress {
    const progress = AcademyStore.getProgress();
    const best = Math.max(progress.quizBestScores[moduleId] ?? 0, scorePercent);
    const updated: AcademyProgress = {
      ...progress,
      quizBestScores: { ...progress.quizBestScores, [moduleId]: best }
    };
    return AcademyStore.evaluateCompletion(moduleId, updated);
  }

  static setExerciseDone(moduleId: string, done: boolean): AcademyProgress {
    const progress = AcademyStore.getProgress();
    const set = new Set(progress.exerciseDoneModuleIds);
    if (done) set.add(moduleId);
    else set.delete(moduleId);
    const updated: AcademyProgress = {
      ...progress,
      exerciseDoneModuleIds: Array.from(set)
    };
    return AcademyStore.evaluateCompletion(moduleId, updated);
  }

  static evaluateCompletion(moduleId: string, progress: AcademyProgress): AcademyProgress {
    const quizScore = progress.quizBestScores[moduleId] ?? 0;
    const exerciseDone = progress.exerciseDoneModuleIds.includes(moduleId);
    const alreadyCompleted = progress.completedModuleIds.includes(moduleId);
    if (alreadyCompleted || quizScore < QUIZ_PASS_THRESHOLD || !exerciseDone) {
      AcademyStore.saveProgress(progress);
      return progress;
    }
    const updated: AcademyProgress = {
      ...progress,
      completedModuleIds: Array.from(new Set([...progress.completedModuleIds, moduleId]))
    };
    AcademyStore.saveProgress(updated);
    return updated;
  }

  static isModuleCompleted(progress: AcademyProgress, moduleId: string): boolean {
    return progress.completedModuleIds.includes(moduleId);
  }

  static getCompletionPercent(progress: AcademyProgress): number {
    if (ACADEMY_MODULES.length === 0) return 0;
    return Math.round((progress.completedModuleIds.length / ACADEMY_MODULES.length) * 100);
  }

  static getNextUncompletedModuleId(progress: AcademyProgress): string {
    const next = ACADEMY_MODULES.find((m) => !progress.completedModuleIds.includes(m.id));
    return next?.id ?? ACADEMY_MODULES[0]?.id ?? '';
  }

  static isCertificateEligible(progress: AcademyProgress): boolean {
    return ACADEMY_MODULES.every((m) => progress.completedModuleIds.includes(m.id));
  }

  static issueCertificate(studentName: string): AcademyProgress {
    const progress = AcademyStore.getProgress();
    if (!AcademyStore.isCertificateEligible(progress)) return progress;
    const issuedAt = new Date().toISOString();
    const seed = `${studentName.trim()}|${issuedAt}|${ACADEMY_MODULES.length}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const certificateId = `CPA-${new Date(issuedAt).getFullYear()}-${hash.toString(16).toUpperCase().padStart(8, '0')}`;
    const updated: AcademyProgress = {
      ...progress,
      studentName: studentName.trim(),
      certificateIssuedAt: issuedAt,
      certificateId
    };
    AcademyStore.saveProgress(updated);
    return updated;
  }

  static setStudentName(studentName: string): AcademyProgress {
    const progress = AcademyStore.getProgress();
    const updated: AcademyProgress = { ...progress, studentName: studentName.trim() };
    AcademyStore.saveProgress(updated);
    return updated;
  }

  static resetProgress(): AcademyProgress {
    const fresh = createInitialProgress();
    memoryProgress = fresh;
    try {
      localStorage.removeItem(STORAGE_KEY_PROGRESS_V2);
    } catch {
      // Storage unavailable: in-memory reset is sufficient.
    }
    AcademyStore.saveProgress(fresh);
    return fresh;
  }
}
