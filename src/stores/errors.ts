import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  ErrorBankEntry,
  ErrorBankInsert,
  ErrorBankUpdate,
  Curriculum,
  CurriculumPosition,
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
      const { data, error } = await supabase
        .from('error_bank')
        .select('*')
        .eq('curriculum', curriculum)
        .order('occurrence_count', { ascending: false });

      if (error) throw error;
      set({ errors: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchErrorsForPosition: async (
    curriculum: Curriculum,
    position: CurriculumPosition
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all errors for the curriculum, then filter by position
      const { data, error } = await supabase
        .from('error_bank')
        .select('*')
        .eq('curriculum', curriculum);

      if (error) throw error;

      // Filter errors that match the position or are universal (null position)
      const filteredErrors = (data || []).filter((e) => {
        if (!e.curriculum_position) return true; // Universal error
        return matchPosition(curriculum, e.curriculum_position, position);
      });

      set({
        suggestedErrors: filteredErrors,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createError: async (errorData: ErrorBankInsert) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('error_bank')
        .insert({ ...errorData, is_custom: true })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        errors: [...state.errors, data],
        isLoading: false,
      }));

      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateError: async (id: string, updates: ErrorBankUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('error_bank')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        errors: state.errors.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  incrementEffectiveness: async (id: string) => {
    const errorEntry = get().errors.find((e) => e.id === id);
    if (!errorEntry) return;

    await get().updateError(id, {
      effectiveness_count: errorEntry.effectiveness_count + 1,
    });
  },

  incrementOccurrence: async (id: string) => {
    const errorEntry = get().errors.find((e) => e.id === id);
    if (!errorEntry) return;

    await get().updateError(id, {
      occurrence_count: errorEntry.occurrence_count + 1,
    });
  },

  setSuggestedErrors: (errors: ErrorBankEntry[]) => {
    set({ suggestedErrors: errors });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper function to match curriculum positions
function matchPosition(
  curriculum: Curriculum,
  errorPosition: CurriculumPosition,
  currentPosition: CurriculumPosition
): boolean {
  switch (curriculum) {
    case 'wilson': {
      const errPos = errorPosition as { step: number; substep?: number };
      const curPos = currentPosition as { step: number; substep: string };
      return errPos.step === curPos.step;
    }
    case 'delta_math': {
      const errPos = errorPosition as { standard: string };
      const curPos = currentPosition as { standard: string };
      return errPos.standard === curPos.standard;
    }
    case 'camino': {
      const errPos = errorPosition as { lesson?: number; lesson_range?: [number, number] };
      const curPos = currentPosition as { lesson: number };
      if (errPos.lesson) {
        return errPos.lesson === curPos.lesson;
      }
      if (errPos.lesson_range) {
        return curPos.lesson >= errPos.lesson_range[0] && curPos.lesson <= errPos.lesson_range[1];
      }
      return false;
    }
    default:
      return false;
  }
}
