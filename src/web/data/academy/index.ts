import type { AcademyModule, AcademyLevel, GlossaryEntry } from './types';
import { LEVEL1_MODULES } from './level1';
import { LEVEL2_MODULES } from './level2';
import { LEVEL3_MODULES } from './level3';
import { LEVEL4_MODULES } from './level4';
import { LEVEL5_MODULES } from './level5';
import { LEVEL6_MODULES } from './level6';
import { ACADEMY_GLOSSARY } from './glossary';

export * from './types';
export { ACADEMY_GLOSSARY };

export const ACADEMY_MODULES: AcademyModule[] = [
  ...LEVEL1_MODULES,
  ...LEVEL2_MODULES,
  ...LEVEL3_MODULES,
  ...LEVEL4_MODULES,
  ...LEVEL5_MODULES,
  ...LEVEL6_MODULES
];

export const ACADEMY_LEVELS: AcademyLevel[] = [
  {
    levelNumber: 1,
    title: 'Fundamentos e primeiros passos',
    description: 'O produto, a navegação e os conceitos essenciais de IA e agentes.',
    iconName: 'Sprout',
    moduleIds: LEVEL1_MODULES.map((m) => m.id)
  },
  {
    levelNumber: 2,
    title: 'Processos, SIPOC e avaliação de risco',
    description: 'Mapear processos, identificar riscos e utilizar o scanner com rigor.',
    iconName: 'Search',
    moduleIds: LEVEL2_MODULES.map((m) => m.id)
  },
  {
    levelNumber: 3,
    title: 'Criação e configuração de agentes',
    description: 'Especificação, registo e teste de agentes governáveis.',
    iconName: 'Bot',
    moduleIds: LEVEL3_MODULES.map((m) => m.id)
  },
  {
    levelNumber: 4,
    title: 'Governação, controlos e supervisão',
    description: 'Programa de governação, CG-AGF, HITL e políticas executáveis.',
    iconName: 'Shield',
    moduleIds: LEVEL4_MODULES.map((m) => m.id)
  },
  {
    levelNumber: 5,
    title: 'Evidências, auditoria e operação avançada',
    description: 'Integridade de evidências, dossiers, multi-tenancy e incidentes.',
    iconName: 'FolderCheck',
    moduleIds: LEVEL5_MODULES.map((m) => m.id)
  },
  {
    levelNumber: 6,
    title: 'Especialização e maturidade',
    description: 'Regulamentação, métricas e o projeto final de ponta a ponta.',
    iconName: 'Award',
    moduleIds: LEVEL6_MODULES.map((m) => m.id)
  }
];

export function getAcademyModuleById(id: string): AcademyModule | undefined {
  return ACADEMY_MODULES.find((m) => m.id === id);
}

export function getNextAcademyModule(currentId: string): AcademyModule | undefined {
  const idx = ACADEMY_MODULES.findIndex((m) => m.id === currentId);
  if (idx === -1 || idx >= ACADEMY_MODULES.length - 1) return undefined;
  return ACADEMY_MODULES[idx + 1];
}

export function getPreviousAcademyModule(currentId: string): AcademyModule | undefined {
  const idx = ACADEMY_MODULES.findIndex((m) => m.id === currentId);
  if (idx <= 0) return undefined;
  return ACADEMY_MODULES[idx - 1];
}

export function searchAcademyModules(query: string): AcademyModule[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ACADEMY_MODULES.filter((m) => {
    const haystack = [
      m.title,
      m.subtitle,
      m.conceptExplanation,
      m.businessExample,
      ...m.learningObjectives,
      ...m.terminology.map((t) => `${t.term} ${t.definition}`),
      ...m.skillsChecklist
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getGlossaryEntries(query: string): GlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ACADEMY_GLOSSARY;
  return ACADEMY_GLOSSARY.filter(
    (g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q)
  );
}
