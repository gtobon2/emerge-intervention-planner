/**
 * Schedule Store
 *
 * Manages state for the Schedule Builder feature:
 * - Interventionists (local IndexedDB)
 * - Schedule constraints (Supabase - multi-grade, role-based)
 * - Student constraints (local IndexedDB)
 * - Schedule suggestions
 */

import { create } from 'zustand';
import { db } from '@/lib/local-db';
import type {
  LocalInterventionist,
  LocalStudentConstraint,
  LocalInterventionistInsert,
  LocalInterventionistUpdate,
  LocalStudentConstraintInsert,
} from '@/lib/local-db';
import type {
  SuggestedTimeSlot,
  ScheduleConstraint,
  ScheduleConstraintInsert,
  ScheduleConstraintUpdate,
  ScheduleConstraintWithCreator,
  ConstraintScope,
} from '@/lib/supabase/types';
import {
  createInterventionist as createInterventionistDB,
  updateInterventionist as updateInterventionistDB,
  deleteInterventionist as deleteInterventionistDB,
  createStudentConstraint as createStudentConstraintDB,
  updateStudentConstraint as updateStudentConstraintDB,
  deleteStudentConstraint as deleteStudentConstraintDB,
} from '@/lib/local-db/hooks';
import {
  fetchConstraints as fetchConstraintsDB,
  createConstraint as createConstraintDB,
  updateConstraint as updateConstraintDB,
  deleteConstraint as deleteConstraintDB,
  canCreateSchoolwide,
  getDefaultScope,
} from '@/lib/supabase/constraints';
import { suggestSchedule, SchedulingOptions } from '@/lib/scheduling';
import { toNumericIdOrThrow } from '@/lib/utils/id';
import type { UserRole } from '@/lib/supabase/profiles';

// ============================================
// TYPES
// ============================================

// Input type for creating constraints (without created_by, which is set automatically)
export interface CreateConstraintInput {
  scope: ConstraintScope;
  applicable_grades: number[];
  label: string;
  type: 'lunch' | 'core_instruction' | 'specials' | 'therapy' | 'other';
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[];
  start_time: string;
  end_time: string;
}

interface ScheduleState {
  // Data
  interventionists: LocalInterventionist[];
  constraints: ScheduleConstraintWithCreator[];  // Supabase-backed
  studentConstraints: LocalStudentConstraint[];

  // Current suggestions
  suggestions: SuggestedTimeSlot[];
  suggestionsGroupId: string | null;

  // UI state
  selectedInterventionistId: string | null;
  isLoading: boolean;
  isCalculating: boolean;
  error: string | null;

  // Actions - Interventionists (local DB)
  fetchInterventionists: () => Promise<void>;
  createInterventionist: (data: LocalInterventionistInsert) => Promise<LocalInterventionist | null>;
  updateInterventionist: (id: string, updates: LocalInterventionistUpdate) => Promise<void>;
  deleteInterventionist: (id: string) => Promise<void>;
  setSelectedInterventionist: (id: string | null) => void;

  // Actions - Schedule constraints (Supabase)
  fetchConstraints: () => Promise<void>;
  createConstraint: (data: CreateConstraintInput, userId: string) => Promise<ScheduleConstraint | null>;
  updateConstraint: (id: string, updates: ScheduleConstraintUpdate) => Promise<void>;
  deleteConstraint: (id: string) => Promise<void>;

  // Actions - Student constraints (local DB)
  fetchStudentConstraints: () => Promise<void>;
  fetchStudentConstraintsForStudent: (studentId: string) => Promise<LocalStudentConstraint[]>;
  createStudentConstraint: (data: LocalStudentConstraintInsert) => Promise<LocalStudentConstraint | null>;
  updateStudentConstraint: (id: string, updates: Partial<LocalStudentConstraintInsert>) => Promise<void>;
  deleteStudentConstraint: (id: string) => Promise<void>;

  // Actions - Scheduling
  calculateSuggestions: (groupId: string, options: SchedulingOptions) => Promise<void>;
  clearSuggestions: () => void;

  // Actions - Utility
  fetchAll: () => Promise<void>;
  reset: () => void;
}

// ============================================
// STORE
// ============================================

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Initial state
  interventionists: [],
  constraints: [],
  studentConstraints: [],
  suggestions: [],
  suggestionsGroupId: null,
  selectedInterventionistId: null,
  isLoading: false,
  isCalculating: false,
  error: null,

  // ==========================================
  // INTERVENTIONISTS (Local IndexedDB)
  // ==========================================

  fetchInterventionists: async () => {
    set({ isLoading: true, error: null });
    try {
      const interventionists = await db.interventionists.orderBy('name').toArray();
      set({ interventionists, isLoading: false });
    } catch (error) {
      console.error('Error fetching interventionists:', error);
      set({ error: 'Failed to load interventionists', isLoading: false });
    }
  },

  createInterventionist: async (data) => {
    try {
      const id = await createInterventionistDB(data);
      const newInterventionist = await db.interventionists.get(id);
      if (newInterventionist) {
        set((state) => ({
          interventionists: [...state.interventionists, newInterventionist].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }));
        return newInterventionist;
      }
      return null;
    } catch (error) {
      console.error('Error creating interventionist:', error);
      set({ error: 'Failed to create interventionist' });
      return null;
    }
  },

  updateInterventionist: async (id, updates) => {
    try {
      const numericId = toNumericIdOrThrow(id, 'interventionist_id');
      await updateInterventionistDB(numericId, updates);
      const updated = await db.interventionists.get(numericId);
      if (updated) {
        set((state) => ({
          interventionists: state.interventionists
            .map((i) => (i.id === numericId ? updated : i))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
      }
    } catch (error) {
      console.error('Error updating interventionist:', error);
      set({ error: 'Failed to update interventionist' });
    }
  },

  deleteInterventionist: async (id) => {
    try {
      const numericId = toNumericIdOrThrow(id, 'interventionist_id');
      await deleteInterventionistDB(numericId);
      set((state) => ({
        interventionists: state.interventionists.filter((i) => i.id !== numericId),
        selectedInterventionistId:
          state.selectedInterventionistId === id ? null : state.selectedInterventionistId,
      }));
    } catch (error) {
      console.error('Error deleting interventionist:', error);
      set({ error: 'Failed to delete interventionist' });
    }
  },

  setSelectedInterventionist: (id) => {
    set({ selectedInterventionistId: id });
  },

  // ==========================================
  // SCHEDULE CONSTRAINTS (Supabase)
  // ==========================================

  fetchConstraints: async () => {
    set({ isLoading: true, error: null });
    try {
      const constraints = await fetchConstraintsDB();
      set({ constraints, isLoading: false });
    } catch (error) {
      console.error('Error fetching constraints:', error);
      set({ error: 'Failed to load constraints', isLoading: false });
    }
  },

  createConstraint: async (data, userId) => {
    try {
      const insertData: ScheduleConstraintInsert = {
        ...data,
        created_by: userId,
      };
      const newConstraint = await createConstraintDB(insertData);
      // Refetch to get the creator info
      const constraints = await fetchConstraintsDB();
      set({ constraints });
      return newConstraint;
    } catch (error) {
      console.error('Error creating constraint:', error);
      set({ error: 'Failed to create constraint' });
      return null;
    }
  },

  updateConstraint: async (id, updates) => {
    try {
      await updateConstraintDB(id, updates);
      // Refetch to get updated data with creator info
      const constraints = await fetchConstraintsDB();
      set({ constraints });
    } catch (error) {
      console.error('Error updating constraint:', error);
      set({ error: 'Failed to update constraint' });
    }
  },

  deleteConstraint: async (id) => {
    try {
      await deleteConstraintDB(id);
      set((state) => ({
        constraints: state.constraints.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting constraint:', error);
      set({ error: 'Failed to delete constraint' });
    }
  },

  // ==========================================
  // STUDENT CONSTRAINTS (Local IndexedDB)
  // ==========================================

  fetchStudentConstraints: async () => {
    set({ isLoading: true, error: null });
    try {
      const constraints = await db.studentConstraints.toArray();
      set({ studentConstraints: constraints, isLoading: false });
    } catch (error) {
      console.error('Error fetching student constraints:', error);
      set({ error: 'Failed to load student constraints', isLoading: false });
    }
  },

  fetchStudentConstraintsForStudent: async (studentId) => {
    try {
      const numericId = toNumericIdOrThrow(studentId, 'student_id');
      return await db.studentConstraints.where('student_id').equals(numericId).toArray();
    } catch (error) {
      console.error('Error fetching student constraints:', error);
      return [];
    }
  },

  createStudentConstraint: async (data) => {
    try {
      const id = await createStudentConstraintDB(data);
      const newConstraint = await db.studentConstraints.get(id);
      if (newConstraint) {
        set((state) => ({
          studentConstraints: [...state.studentConstraints, newConstraint],
        }));
        return newConstraint;
      }
      return null;
    } catch (error) {
      console.error('Error creating student constraint:', error);
      set({ error: 'Failed to create constraint' });
      return null;
    }
  },

  updateStudentConstraint: async (id, updates) => {
    try {
      const numericId = toNumericIdOrThrow(id, 'student_constraint_id');
      await updateStudentConstraintDB(numericId, updates);
      const updated = await db.studentConstraints.get(numericId);
      if (updated) {
        set((state) => ({
          studentConstraints: state.studentConstraints.map((c) =>
            c.id === numericId ? updated : c
          ),
        }));
      }
    } catch (error) {
      console.error('Error updating student constraint:', error);
      set({ error: 'Failed to update constraint' });
    }
  },

  deleteStudentConstraint: async (id) => {
    try {
      const numericId = toNumericIdOrThrow(id, 'student_constraint_id');
      await deleteStudentConstraintDB(numericId);
      set((state) => ({
        studentConstraints: state.studentConstraints.filter((c) => c.id !== numericId),
      }));
    } catch (error) {
      console.error('Error deleting student constraint:', error);
      set({ error: 'Failed to delete constraint' });
    }
  },

  // ==========================================
  // SCHEDULING
  // ==========================================

  calculateSuggestions: async (groupId, options) => {
    set({ isCalculating: true, error: null });
    try {
      const numericGroupId = toNumericIdOrThrow(groupId, 'group_id');
      const suggestions = await suggestSchedule(numericGroupId, options);
      set({
        suggestions,
        suggestionsGroupId: groupId,
        isCalculating: false,
      });
    } catch (error) {
      console.error('Error calculating suggestions:', error);
      set({
        error: 'Failed to calculate schedule suggestions',
        isCalculating: false,
      });
    }
  },

  clearSuggestions: () => {
    set({ suggestions: [], suggestionsGroupId: null });
  },

  // ==========================================
  // UTILITY
  // ==========================================

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [interventionists, constraints, studentConstraints] = await Promise.all([
        db.interventionists.orderBy('name').toArray(),
        fetchConstraintsDB(),
        db.studentConstraints.toArray(),
      ]);
      set({
        interventionists,
        constraints,
        studentConstraints,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      set({ error: 'Failed to load schedule data', isLoading: false });
    }
  },

  reset: () => {
    set({
      interventionists: [],
      constraints: [],
      studentConstraints: [],
      suggestions: [],
      suggestionsGroupId: null,
      selectedInterventionistId: null,
      isLoading: false,
      isCalculating: false,
      error: null,
    });
  },
}));

// Re-export permission helpers for use in components
export { canCreateSchoolwide, getDefaultScope, canModifyConstraint } from '@/lib/supabase/constraints';
