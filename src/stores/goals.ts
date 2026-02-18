import { create } from 'zustand';
import {
  fetchGoalsByGroupId,
  fetchGoalByStudentAndGroup,
  upsertBulkStudentGoals,
  deleteStudentGoal,
} from '@/lib/supabase/services';
import type { StudentGoal, StudentGoalInsert } from '@/lib/supabase/types';

interface GoalsState {
  goals: StudentGoal[];
  isLoading: boolean;
  error: string | null;

  fetchGoalsForGroup: (groupId: string) => Promise<void>;
  fetchGoalForStudent: (studentId: string, groupId: string) => Promise<StudentGoal | undefined>;
  setGoal: (goal: StudentGoalInsert) => Promise<void>;
  setBulkGoals: (goals: StudentGoalInsert[]) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useGoalsStore = create<GoalsState>()((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchGoalsForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const goals = await fetchGoalsByGroupId(groupId);
      set({ goals });
    } catch (error) {
      console.error('Failed to fetch goals for group:', error);
      set({ error: (error as Error).message || 'Failed to fetch goals' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGoalForStudent: async (studentId: string, groupId: string) => {
    try {
      const goal = await fetchGoalByStudentAndGroup(studentId, groupId);
      return goal ?? undefined;
    } catch (error) {
      console.error('Failed to fetch goal for student:', error);
      set({ error: (error as Error).message || 'Failed to fetch student goal' });
      return undefined;
    }
  },

  setGoal: async (goal: StudentGoalInsert) => {
    set({ error: null });
    try {
      await upsertBulkStudentGoals([goal]);
      // Refresh goals for this group
      const goals = await fetchGoalsByGroupId(goal.group_id);
      set({ goals });
    } catch (error) {
      console.error('Failed to set goal:', error);
      set({ error: (error as Error).message || 'Failed to set goal' });
    }
  },

  setBulkGoals: async (goals: StudentGoalInsert[]) => {
    if (goals.length === 0) return;

    set({ error: null });
    try {
      const groupId = goals[0].group_id;
      await upsertBulkStudentGoals(goals);
      // Refresh goals for this group
      const updatedGoals = await fetchGoalsByGroupId(groupId);
      set({ goals: updatedGoals });
    } catch (error) {
      console.error('Failed to set bulk goals:', error);
      set({ error: (error as Error).message || 'Failed to set bulk goals' });
    }
  },

  deleteGoal: async (id: string) => {
    set({ error: null });
    try {
      await deleteStudentGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete goal:', error);
      set({ error: (error as Error).message || 'Failed to delete goal' });
    }
  },
}));
