'use client';

import { useEffect } from 'react';
import { useErrorsStore } from '@/stores/errors';
import type { Curriculum, CurriculumPosition, ErrorBankInsert } from '@/lib/supabase/types';

export function useErrors(curriculum: Curriculum | undefined) {
  const store = useErrorsStore();

  useEffect(() => {
    if (curriculum) {
      store.fetchErrorsForCurriculum(curriculum);
    }
  }, [curriculum, store]);

  return {
    errors: store.errors,
    isLoading: store.isLoading,
    error: store.error,
    refetch: () => curriculum && store.fetchErrorsForCurriculum(curriculum),
    createError: store.createError,
    updateError: store.updateError,
    incrementEffectiveness: store.incrementEffectiveness,
    incrementOccurrence: store.incrementOccurrence,
  };
}

export function useSuggestedErrors(
  curriculum: Curriculum | undefined,
  position: CurriculumPosition | undefined
) {
  const { suggestedErrors, fetchErrorsForPosition, isLoading, error } = useErrorsStore();

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
