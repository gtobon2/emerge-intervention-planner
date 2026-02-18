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

  fetchGoalsForGroup: (groupId: string) => Promise<void>;
  fetchGoalForStudent: (studentId: string, groupId: string) => Promise<StudentGoal | undefined>;
  setGoal: (goal: StudentGoalInsert) => Promise<void>;
  setBulkGoals: (goals: StudentGoalInsert[]) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>()((set) => ({
  goals: [],
  isLoading: false,

  fetchGoalsForGroup: async (groupId: string) => {
    set({ isLoading: true });
    try {
      const goals = await fetchGoalsByGroupId(groupId);
      set({ goals });
    } catch (error) {
      console.error('Failed to fetch goals for group:', error);
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
      return undefined;
    }
  },

  setGoal: async (goal: StudentGoalInsert) => {
    try {
      await upsertBulkStudentGoals([goal]);
      // Refresh goals for this group
      const goals = await fetchGoalsByGroupId(goal.group_id);
      set({ goals });
    } catch (error) {
      console.error('Failed to set goal:', error);
    }
  },

  setBulkGoals: async (goals: StudentGoalInsert[]) => {
    if (goals.length === 0) return;

    try {
      const groupId = goals[0].group_id;
      await upsertBulkStudentGoals(goals);
      // Refresh goals for this group
      const updatedGoals = await fetchGoalsByGroupId(groupId);
      set({ goals: updatedGoals });
    } catch (error) {
      console.error('Failed to set bulk goals:', error);
    }
  },

  deleteGoal: async (id: string) => {
    try {
      await deleteStudentGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  },
}));
