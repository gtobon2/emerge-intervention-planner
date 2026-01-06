/**
 * Schedule Store
 *
 * Manages state for the Schedule Builder feature:
 * - Interventionists
 * - Grade-level constraints
 * - Student constraints
 * - Schedule suggestions
 */

import { create } from 'zustand';
import { db } from '@/lib/local-db';
import type {
  LocalInterventionist,
  LocalGradeLevelConstraint,
  LocalStudentConstraint,
  LocalInterventionistInsert,
  LocalInterventionistUpdate,
  LocalGradeLevelConstraintInsert,
  LocalStudentConstraintInsert,
} from '@/lib/local-db';
import type { SuggestedTimeSlot, WeekDay } from '@/lib/supabase/types';
import {
  createInterventionist as createInterventionistDB,
  updateInterventionist as updateInterventionistDB,
  deleteInterventionist as deleteInterventionistDB,
  createGradeLevelConstraint as createGradeLevelConstraintDB,
  updateGradeLevelConstraint as updateGradeLevelConstraintDB,
  deleteGradeLevelConstraint as deleteGradeLevelConstraintDB,
  createStudentConstraint as createStudentConstraintDB,
  updateStudentConstraint as updateStudentConstraintDB,
  deleteStudentConstraint as deleteStudentConstraintDB,
} from '@/lib/local-db/hooks';
import { findAvailableSlots, suggestSchedule, SchedulingOptions } from '@/lib/scheduling';
import { toNumericId, toNumericIdOrThrow, toStringId } from '@/lib/utils/id';

// ============================================
// TYPES
// ============================================

interface ScheduleState {
  // Data
  interventionists: LocalInterventionist[];
  gradeLevelConstraints: LocalGradeLevelConstraint[];
  studentConstraints: LocalStudentConstraint[];

  // Current suggestions
  suggestions: SuggestedTimeSlot[];
  suggestionsGroupId: string | null;

  // UI state
  selectedInterventionistId: string | null;
  isLoading: boolean;
  isCalculating: boolean;
  error: string | null;

  // Actions - Interventionists
  fetchInterventionists: () => Promise<void>;
  createInterventionist: (data: LocalInterventionistInsert) => Promise<LocalInterventionist | null>;
  updateInterventionist: (id: string, updates: LocalInterventionistUpdate) => Promise<void>;
  deleteInterventionist: (id: string) => Promise<void>;
  setSelectedInterventionist: (id: string | null) => void;

  // Actions - Grade-level constraints
  fetchGradeLevelConstraints: () => Promise<void>;
  createGradeLevelConstraint: (data: LocalGradeLevelConstraintInsert) => Promise<LocalGradeLevelConstraint | null>;
  updateGradeLevelConstraint: (id: string, updates: Partial<LocalGradeLevelConstraintInsert>) => Promise<void>;
  deleteGradeLevelConstraint: (id: string) => Promise<void>;

  // Actions - Student constraints
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
  gradeLevelConstraints: [],
  studentConstraints: [],
  suggestions: [],
  suggestionsGroupId: null,
  selectedInterventionistId: null,
  isLoading: false,
  isCalculating: false,
  error: null,

  // ==========================================
  // INTERVENTIONISTS
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
  // GRADE-LEVEL CONSTRAINTS
  // ==========================================

  fetchGradeLevelConstraints: async () => {
    set({ isLoading: true, error: null });
    try {
      const constraints = await db.gradeLevelConstraints.orderBy('grade').toArray();
      set({ gradeLevelConstraints: constraints, isLoading: false });
    } catch (error) {
      console.error('Error fetching grade-level constraints:', error);
      set({ error: 'Failed to load constraints', isLoading: false });
    }
  },

  createGradeLevelConstraint: async (data) => {
    try {
      const id = await createGradeLevelConstraintDB(data);
      const newConstraint = await db.gradeLevelConstraints.get(id);
      if (newConstraint) {
        set((state) => ({
          gradeLevelConstraints: [...state.gradeLevelConstraints, newConstraint].sort(
            (a, b) => a.grade - b.grade
          ),
        }));
        return newConstraint;
      }
      return null;
    } catch (error) {
      console.error('Error creating grade-level constraint:', error);
      set({ error: 'Failed to create constraint' });
      return null;
    }
  },

  updateGradeLevelConstraint: async (id, updates) => {
    try {
      const numericId = toNumericIdOrThrow(id, 'grade_level_constraint_id');
      await updateGradeLevelConstraintDB(numericId, updates);
      const updated = await db.gradeLevelConstraints.get(numericId);
      if (updated) {
        set((state) => ({
          gradeLevelConstraints: state.gradeLevelConstraints
            .map((c) => (c.id === numericId ? updated : c))
            .sort((a, b) => a.grade - b.grade),
        }));
      }
    } catch (error) {
      console.error('Error updating grade-level constraint:', error);
      set({ error: 'Failed to update constraint' });
    }
  },

  deleteGradeLevelConstraint: async (id) => {
    try {
      const numericId = toNumericIdOrThrow(id, 'grade_level_constraint_id');
      await deleteGradeLevelConstraintDB(numericId);
      set((state) => ({
        gradeLevelConstraints: state.gradeLevelConstraints.filter((c) => c.id !== numericId),
      }));
    } catch (error) {
      console.error('Error deleting grade-level constraint:', error);
      set({ error: 'Failed to delete constraint' });
    }
  },

  // ==========================================
  // STUDENT CONSTRAINTS
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
      const [interventionists, gradeLevelConstraints, studentConstraints] = await Promise.all([
        db.interventionists.orderBy('name').toArray(),
        db.gradeLevelConstraints.orderBy('grade').toArray(),
        db.studentConstraints.toArray(),
      ]);
      set({
        interventionists,
        gradeLevelConstraints,
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
      gradeLevelConstraints: [],
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
