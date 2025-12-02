// Curriculum exports
export * from './wilson';
export * from './delta-math';
export * from './camino';
export * from './wordgen';
export * from './amira';

import type { Curriculum, CurriculumPosition, LessonComponent } from '@/lib/supabase/types';
import { WILSON_LESSON_COMPONENTS, getWilsonPositionLabel, getNextWilsonPosition } from './wilson';
import { INTERVENTION_CYCLE, getStandardLabel, getCycleSessionInfo } from './delta-math';
import { CAMINO_LESSON_COMPONENTS, getCaminoLessonLabel, getNextCaminoLesson } from './camino';
import { WORDGEN_LESSON_COMPONENTS, getWordGenPositionLabel, getNextWordGenPosition } from './wordgen';
import { AMIRA_LESSON_COMPONENTS, getAmiraLevelLabel, getNextAmiraLevel } from './amira';
import type { AmiraLevel } from './amira';

// Get lesson components for any curriculum
export function getLessonComponents(curriculum: Curriculum): LessonComponent[] {
  switch (curriculum) {
    case 'wilson':
      return WILSON_LESSON_COMPONENTS;
    case 'delta_math':
      // For Delta Math, return components based on intervention cycle phase
      return [
        { name: 'Warm-Up', duration_minutes: 3, description: 'Review and activate prior knowledge' },
        { name: 'Explicit Instruction', duration_minutes: 10, description: 'I Do modeling' },
        { name: 'Guided Practice', duration_minutes: 10, description: 'We Do with scaffolding' },
        { name: 'Independent Practice', duration_minutes: 12, description: 'You Do with monitoring' },
        { name: 'Error Analysis', duration_minutes: 5, description: 'Review common errors' },
        { name: 'Exit Ticket', duration_minutes: 5, description: 'Quick assessment' }
      ];
    case 'camino':
      return CAMINO_LESSON_COMPONENTS;
    case 'wordgen':
      return WORDGEN_LESSON_COMPONENTS;
    case 'amira':
      return AMIRA_LESSON_COMPONENTS;
    default:
      return [];
  }
}

// Get position label for any curriculum
export function getPositionLabel(curriculum: Curriculum, position: CurriculumPosition): string {
  switch (curriculum) {
    case 'wilson': {
      const pos = position as { step: number; substep: string };
      return getWilsonPositionLabel(pos.step, pos.substep);
    }
    case 'delta_math': {
      const pos = position as { standard: string; session?: number };
      const label = getStandardLabel(pos.standard);
      if (pos.session) {
        const cycleInfo = getCycleSessionInfo(pos.session);
        return `${label} - Session ${pos.session} (${cycleInfo?.phase || ''})`;
      }
      return label;
    }
    case 'camino': {
      const pos = position as { lesson: number };
      return getCaminoLessonLabel(pos.lesson);
    }
    case 'wordgen': {
      const pos = position as { unit: number; day: number };
      return getWordGenPositionLabel(pos.unit, pos.day);
    }
    case 'amira': {
      const pos = position as { level: AmiraLevel };
      return getAmiraLevelLabel(pos.level);
    }
    default:
      return JSON.stringify(position);
  }
}

// Get next position for any curriculum
export function getNextPosition(curriculum: Curriculum, position: CurriculumPosition): CurriculumPosition | null {
  switch (curriculum) {
    case 'wilson': {
      const pos = position as { step: number; substep: string };
      return getNextWilsonPosition(pos.step, pos.substep);
    }
    case 'delta_math': {
      const pos = position as { standard: string; session?: number };
      const currentSession = pos.session || 1;
      if (currentSession < 8) {
        return { standard: pos.standard, session: currentSession + 1 };
      }
      // Would need to determine next standard in sequence
      return null;
    }
    case 'camino': {
      const pos = position as { lesson: number };
      const next = getNextCaminoLesson(pos.lesson);
      return next ? { lesson: next } : null;
    }
    case 'wordgen': {
      const pos = position as { unit: number; day: number };
      return getNextWordGenPosition(pos.unit, pos.day);
    }
    case 'amira': {
      const pos = position as { level: AmiraLevel };
      const next = getNextAmiraLevel(pos.level);
      return next ? { level: next } : null;
    }
    default:
      return null;
  }
}

// Get estimated session duration for a curriculum
export function getSessionDuration(curriculum: Curriculum): { min: number; max: number } {
  switch (curriculum) {
    case 'wilson':
      return { min: 35, max: 45 };
    case 'delta_math':
      return { min: 40, max: 50 };
    case 'camino':
      return { min: 40, max: 50 };
    case 'wordgen':
      return { min: 40, max: 50 };
    case 'amira':
      return { min: 25, max: 35 };
    default:
      return { min: 30, max: 45 };
  }
}
