import type { ActiveNavView } from '../../components/AppShell';

export type AcademyDifficulty = 'Básico' | 'Intermédio' | 'Avançado';

export interface AcademyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AcademyExercise {
  goal: string;
  steps: string[];
  doneCriterion: string;
  targetNavView?: ActiveNavView;
  targetLabel?: string;
}

export interface AcademyModule {
  id: string;
  moduleNumber: number;
  levelNumber: number;
  title: string;
  subtitle: string;
  difficulty: AcademyDifficulty;
  estimatedMinutes: number;
  iconName: string;
  relatedNavView?: ActiveNavView;
  relatedNavLabel?: string;
  prerequisites: string[];
  learningObjectives: string[];
  conceptExplanation: string;
  terminology: { term: string; definition: string }[];
  stepByStep: { step: string; detail: string }[];
  businessExample: string;
  commonMistakes: { mistake: string; correction: string }[];
  exercise: AcademyExercise;
  knowledgeCheck: AcademyQuizQuestion[];
  skillsChecklist: string[];
  summary: string;
  completionCriterion: string;
  limitations?: string[];
}

export interface AcademyLevel {
  levelNumber: number;
  title: string;
  description: string;
  iconName: string;
  moduleIds: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  relatedModuleIds: string[];
}

export interface AcademyProgress {
  version: 2;
  completedModuleIds: string[];
  currentModuleId: string;
  quizBestScores: Record<string, number>;
  exerciseDoneModuleIds: string[];
  certificateIssuedAt?: string;
  certificateId?: string;
  studentName?: string;
  lastVisitedAt?: string;
}

export const QUIZ_PASS_THRESHOLD = 75;
