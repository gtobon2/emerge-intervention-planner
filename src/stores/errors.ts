import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import { validateErrorBankEntry } from '@/lib/supabase/validation';
import type { Curriculum, CurriculumPosition } from '@/lib/local-db';
import type {
  ErrorBankEntry,
  ErrorBankInsert,
  ErrorBankUpdate,
} from '@/lib/supabase/types';
import {
  isWilsonPosition,
  isDeltaMathPosition,
  isCaminoPosition,
} from '@/lib/supabase/types';

interface ErrorsState {
  errors: ErrorBankEntry[];
  suggestedErrors: ErrorBankEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchErrorsForCurriculum: (curriculum: Curriculum) => Promise<void>;
  fetchErrorsForPosition: (
    curriculum: Curriculum,
    position: CurriculumPosition
  ) => Promise<void>;
  createError: (error: ErrorBankInsert) => Promise<ErrorBankEntry | null>;
  updateError: (id: string, updates: ErrorBankUpdate) => Promise<void>;
  incrementEffectiveness: (id: string) => Promise<void>;
  incrementOccurrence: (id: string) => Promise<void>;
  setSuggestedErrors: (errors: ErrorBankEntry[]) => void;
  clearError: () => void;
}

export const useErrorsStore = create<ErrorsState>((set, get) => ({
  errors: [],
  suggestedErrors: [],
  isLoading: false,
  error: null,

  fetchErrorsForCurriculum: async (curriculum: Curriculum) => {
    set({ isLoading: true, error: null });

    try {
      const errors = await supabaseService.fetchErrorsByCurriculum(curriculum);
      set({ errors, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        errors: []
      });
    }
  },

  fetchErrorsForPosition: async (
    curriculum: Curriculum,
    position: CurriculumPosition
  ) => {
    set({ isLoading: true, error: null });

    try {
      const allErrors = await supabaseService.fetchErrorsByCurriculum(curriculum);

      // Filter errors that match the position or are universal (null position)
      const filteredErrors = allErrors.filter((e) => {
        if (!e.curriculum_position) return true; // Universal error
        return matchPosition(curriculum, e.curriculum_position, position);
      });

      set({
        suggestedErrors: filteredErrors,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        suggestedErrors: []
      });
    }
  },

  createError: async (errorData: ErrorBankInsert) => {
    set({ isLoading: true, error: null });

    // Validate error data
    const validation = validateErrorBankEntry(errorData);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    try {
      const newError = await supabaseService.createError(errorData);

      set((state) => ({
        errors: [...state.errors, newError],
        isLoading: false,
      }));

      return newError;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateError: async (id: string, updates: ErrorBankUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const updatedError = await supabaseService.updateError(id, updates);

      set((state) => ({
        errors: state.errors.map((e) =>
          e.id === id ? updatedError : e
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  incrementEffectiveness: async (id: string) => {
    try {
      // Find the current error to get its effectiveness count
      const currentError = get().errors.find(e => e.id === id);
      if (!currentError) {
        throw new Error('Error not found');
      }

      const updatedError = await supabaseService.updateError(id, {
        effectiveness_count: currentError.effectiveness_count + 1,
      });

      set((state) => ({
        errors: state.errors.map((e) => (e.id === id ? updatedError : e)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  incrementOccurrence: async (id: string) => {
    try {
      // Find the current error to get its occurrence count
      const currentError = get().errors.find(e => e.id === id);
      if (!currentError) {
        throw new Error('Error not found');
      }

      const updatedError = await supabaseService.updateError(id, {
        occurrence_count: currentError.occurrence_count + 1,
      });

      set((state) => ({
        errors: state.errors.map((e) => (e.id === id ? updatedError : e)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  setSuggestedErrors: (errors: ErrorBankEntry[]) => {
    set({ suggestedErrors: errors });
  },

  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Helper function to match curriculum positions using type guards
 *
 * Compares error bank position with current session position based on
 * curriculum-specific matching logic:
 * - Wilson: Match by step number
 * - Delta Math: Match by standard
 * - Camino: Match by lesson number
 */
function matchPosition(
  curriculum: Curriculum,
  errorPosition: CurriculumPosition,
  currentPosition: CurriculumPosition
): boolean {
  try {
    switch (curriculum) {
      case 'wilson': {
        if (isWilsonPosition(errorPosition) && isWilsonPosition(currentPosition)) {
          return errorPosition.step === currentPosition.step;
        }
        return false;
      }
      case 'delta_math': {
        if (isDeltaMathPosition(errorPosition) && isDeltaMathPosition(currentPosition)) {
          return errorPosition.standard === currentPosition.standard;
        }
        return false;
      }
      case 'camino': {
        if (isCaminoPosition(errorPosition) && isCaminoPosition(currentPosition)) {
          return errorPosition.lesson === currentPosition.lesson;
        }
        return false;
      }
      default:
        return false;
    }
  } catch (err) {
    console.error('[matchPosition] Error matching positions:', err);
    return false;
  }
}
