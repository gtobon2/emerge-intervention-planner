'use client';

import { useMemo } from 'react';
import type { Curriculum, CurriculumPosition } from '@/lib/supabase/types';
import {
  getLessonComponents,
  getPositionLabel,
  getNextPosition,
  getSessionDuration,
} from '@/lib/curriculum';
import { getWilsonStep, getWilsonSubstep, WILSON_STEPS } from '@/lib/curriculum/wilson';
import { getMathStandard, getStandardsForGrade, DELTA_MATH_GRADES } from '@/lib/curriculum/delta-math';
import { getCaminoLesson, CAMINO_PHASES } from '@/lib/curriculum/camino';
import { getWordGenUnit, WORDGEN_UNITS } from '@/lib/curriculum/wordgen';
import { AMIRA_LEVELS } from '@/lib/curriculum/amira';

export function useCurriculum(curriculum: Curriculum) {
  const components = useMemo(() => {
    return getLessonComponents(curriculum);
  }, [curriculum]);

  const duration = useMemo(() => {
    return getSessionDuration(curriculum);
  }, [curriculum]);

  return {
    components,
    duration,
    getPositionLabel: (position: CurriculumPosition) => getPositionLabel(curriculum, position),
    getNextPosition: (position: CurriculumPosition) => getNextPosition(curriculum, position),
  };
}

export function useWilsonData() {
  return {
    steps: WILSON_STEPS,
    getStep: getWilsonStep,
    getSubstep: getWilsonSubstep,
  };
}

export function useDeltaMathData(grade?: number) {
  const standards = useMemo(() => {
    if (grade) {
      return getStandardsForGrade(grade);
    }
    return [];
  }, [grade]);

  return {
    grades: DELTA_MATH_GRADES,
    standards,
    getStandard: getMathStandard,
  };
}

export function useCaminoData() {
  return {
    phases: CAMINO_PHASES,
    getLesson: getCaminoLesson,
    totalLessons: 40,
  };
}

export function useWordGenData() {
  return {
    units: WORDGEN_UNITS,
    getUnit: getWordGenUnit,
    totalUnits: WORDGEN_UNITS.length,
  };
}

export function useAmiraData() {
  return {
    levels: AMIRA_LEVELS,
  };
}
