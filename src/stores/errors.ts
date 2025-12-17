import { create } from 'zustand';
import { db } from '@/lib/local-db';
import {
  createErrorBankEntry as createErrorBankEntryDB,
  updateErrorBankEntry as updateErrorBankEntryDB,
  incrementErrorEffectiveness,
  incrementErrorOccurrence
} from '@/lib/local-db/hooks';
import { validateErrorBankEntry } from '@/lib/supabase/validation';
import { toNumericId } from '@/lib/utils/id';
import type {
  LocalErrorBankEntry,
  LocalErrorBankInsert,
  LocalErrorBankUpdate,
  Curriculum,
  CurriculumPosition,
} from '@/lib/local-db';
import type {
  ErrorBankEntry,
  ErrorBankInsert,
  ErrorBankUpdate,
} from '@/lib/supabase/types';

// Map LocalErrorBankEntry to ErrorBankEntry
function mapLocalToError(local: LocalErrorBankEntry): ErrorBankEntry {
  return {
    ...local,
    id: String(local.id),
  } as ErrorBankEntry;
}

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
      const localErrors = await db.errorBank
        .where('curriculum')
        .equals(curriculum)
        .reverse()
        .sortBy('occurrence_count');

      const errors = localErrors.map(mapLocalToError);
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
      const allErrors = await db.errorBank
        .where('curriculum')
        .equals(curriculum)
        .toArray();

      // Filter errors that match the position or are universal (null position)
      const filteredErrors = allErrors.filter((e) => {
        if (!e.curriculum_position) return true; // Universal error
        return matchPosition(curriculum, e.curriculum_position, position);
      });

      const errors = filteredErrors.map(mapLocalToError);
      set({
        suggestedErrors: errors,
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
      const localError: LocalErrorBankInsert = {
        curriculum: errorData.curriculum,
        curriculum_position: errorData.curriculum_position || null,
        error_pattern: errorData.error_pattern,
        underlying_gap: errorData.underlying_gap || null,
        correction_protocol: errorData.correction_protocol,
        correction_prompts: errorData.correction_prompts || null,
        visual_cues: errorData.visual_cues || null,
        kinesthetic_cues: errorData.kinesthetic_cues || null,
        is_custom: true,
        effectiveness_count: errorData.effectiveness_count || 0,
        occurrence_count: errorData.occurrence_count || 1,
      };

      const id = await createErrorBankEntryDB(localError);
      const newError = await db.errorBank.get(id);

      if (!newError) {
        throw new Error('Failed to retrieve created error bank entry');
      }

      const mappedError = mapLocalToError(newError);

      set((state) => ({
        errors: [...state.errors, mappedError],
        isLoading: false,
      }));

      return mappedError;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateError: async (id: string, updates: ErrorBankUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = toNumericId(id);
      if (numericId === null) {
        throw new Error('Invalid error bank entry ID');
      }

      // Convert updates to LocalErrorBankUpdate
      const localUpdates: LocalErrorBankUpdate = {};

      if (updates.curriculum !== undefined) localUpdates.curriculum = updates.curriculum;
      if (updates.curriculum_position !== undefined) localUpdates.curriculum_position = updates.curriculum_position;
      if (updates.error_pattern !== undefined) localUpdates.error_pattern = updates.error_pattern;
      if (updates.underlying_gap !== undefined) localUpdates.underlying_gap = updates.underlying_gap;
      if (updates.correction_protocol !== undefined) localUpdates.correction_protocol = updates.correction_protocol;
      if (updates.correction_prompts !== undefined) localUpdates.correction_prompts = updates.correction_prompts;
      if (updates.visual_cues !== undefined) localUpdates.visual_cues = updates.visual_cues;
      if (updates.kinesthetic_cues !== undefined) localUpdates.kinesthetic_cues = updates.kinesthetic_cues;
      if (updates.effectiveness_count !== undefined) localUpdates.effectiveness_count = updates.effectiveness_count;
      if (updates.occurrence_count !== undefined) localUpdates.occurrence_count = updates.occurrence_count;

      await updateErrorBankEntryDB(numericId, localUpdates);

      // Fetch updated error
      const updatedError = await db.errorBank.get(numericId);
      if (!updatedError) {
        throw new Error('Error bank entry not found after update');
      }

      const mappedError = mapLocalToError(updatedError);

      set((state) => ({
        errors: state.errors.map((e) =>
          e.id === id ? mappedError : e
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  incrementEffectiveness: async (id: string) => {
    try {
      const numericId = toNumericId(id);
      if (numericId === null) {
        throw new Error('Invalid error bank entry ID');
      }

      await incrementErrorEffectiveness(numericId);

      // Fetch updated error
      const updatedError = await db.errorBank.get(numericId);
      if (updatedError) {
        const mappedError = mapLocalToError(updatedError);
        set((state) => ({
          errors: state.errors.map((e) => (e.id === id ? mappedError : e)),
        }));
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  incrementOccurrence: async (id: string) => {
    try {
      const numericId = toNumericId(id);
      if (numericId === null) {
        throw new Error('Invalid error bank entry ID');
      }

      await incrementErrorOccurrence(numericId);

      // Fetch updated error
      const updatedError = await db.errorBank.get(numericId);
      if (updatedError) {
        const mappedError = mapLocalToError(updatedError);
        set((state) => ({
          errors: state.errors.map((e) => (e.id === id ? mappedError : e)),
        }));
      }
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

// Helper function to match curriculum positions
function matchPosition(
  curriculum: Curriculum,
  errorPosition: CurriculumPosition,
  currentPosition: CurriculumPosition
): boolean {
  try {
    switch (curriculum) {
      case 'wilson': {
        const errPos = errorPosition as any;
        const curPos = currentPosition as any;
        if (errPos.step !== undefined && curPos.step !== undefined) {
          return errPos.step === curPos.step;
        }
        return false;
      }
      case 'delta_math': {
        const errPos = errorPosition as any;
        const curPos = currentPosition as any;
        if (errPos.standard !== undefined && curPos.standard !== undefined) {
          return errPos.standard === curPos.standard;
        }
        return false;
      }
      case 'camino': {
        const errPos = errorPosition as any;
        const curPos = currentPosition as any;
        if (errPos.lesson && curPos.lesson) {
          return errPos.lesson === curPos.lesson;
        }
        if (errPos.lesson_range && curPos.lesson) {
          return curPos.lesson >= errPos.lesson_range[0] && curPos.lesson <= errPos.lesson_range[1];
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
