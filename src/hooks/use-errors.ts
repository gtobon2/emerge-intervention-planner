'use client';

import { useEffect } from 'react';
import { useErrorsStore } from '@/stores/errors';
import type { Curriculum, CurriculumPosition, ErrorBankInsert } from '@/lib/supabase/types';

export function useErrors(curriculum: Curriculum | undefined) {
  const errors = useErrorsStore((state) => state.errors);
  const isLoading = useErrorsStore((state) => state.isLoading);
  const error = useErrorsStore((state) => state.error);
  const fetchErrorsForCurriculum = useErrorsStore((state) => state.fetchErrorsForCurriculum);
  const createError = useErrorsStore((state) => state.createError);
  const updateError = useErrorsStore((state) => state.updateError);
  const incrementEffectiveness = useErrorsStore((state) => state.incrementEffectiveness);
  const incrementOccurrence = useErrorsStore((state) => state.incrementOccurrence);

  useEffect(() => {
    if (curriculum) {
      fetchErrorsForCurriculum(curriculum);
    }
  }, [curriculum, fetchErrorsForCurriculum]);

  return {
    errors,
    isLoading,
    error,
    refetch: () => curriculum && fetchErrorsForCurriculum(curriculum),
    createError,
    updateError,
    incrementEffectiveness,
    incrementOccurrence,
  };
}

export function useSuggestedErrors(
  curriculum: Curriculum | undefined,
  position: CurriculumPosition | undefined
) {
  const suggestedErrors = useErrorsStore((state) => state.suggestedErrors);
  const isLoading = useErrorsStore((state) => state.isLoading);
  const error = useErrorsStore((state) => state.error);
  const fetchErrorsForPosition = useErrorsStore((state) => state.fetchErrorsForPosition);

  useEffect(() => {
    if (curriculum && position) {
      fetchErrorsForPosition(curriculum, position);
    }
  }, [curriculum, position, fetchErrorsForPosition]);

  return {
    suggestedErrors,
    isLoading,
    error,
    refetch: () => curriculum && position && fetchErrorsForPosition(curriculum, position),
  };
}
