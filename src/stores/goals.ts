import { create } from 'zustand';
import { db } from '@/lib/local-db';
import type { LocalStudentGoal, LocalStudentGoalInsert } from '@/lib/local-db';

interface GoalsState {
  goals: LocalStudentGoal[];
  isLoading: boolean;

  fetchGoalsForGroup: (groupId: number) => Promise<void>;
  fetchGoalForStudent: (studentId: number, groupId: number) => Promise<LocalStudentGoal | undefined>;
  setGoal: (goal: LocalStudentGoalInsert) => Promise<void>;
  setBulkGoals: (goals: LocalStudentGoalInsert[]) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>()((set) => ({
  goals: [],
  isLoading: false,

  fetchGoalsForGroup: async (groupId: number) => {
    set({ isLoading: true });
    try {
      const goals = await db.studentGoals
        .where('group_id')
        .equals(groupId)
        .toArray();
      set({ goals });
    } catch (error) {
      console.error('Failed to fetch goals for group:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGoalForStudent: async (studentId: number, groupId: number) => {
    try {
      const goal = await db.studentGoals
        .where('[student_id+group_id]')
        .equals([studentId, groupId])
        .first();

      // Fallback: if compound index not available, filter manually
      if (goal === undefined) {
        const all = await db.studentGoals
          .where('student_id')
          .equals(studentId)
          .toArray();
        return all.find((g) => g.group_id === groupId);
      }

      return goal;
    } catch {
      // Compound index may not exist, fall back to manual filter
      try {
        const all = await db.studentGoals
          .where('student_id')
          .equals(studentId)
          .toArray();
        return all.find((g) => g.group_id === groupId);
      } catch (error) {
        console.error('Failed to fetch goal for student:', error);
        return undefined;
      }
    }
  },

  setGoal: async (goal: LocalStudentGoalInsert) => {
    try {
      const now = new Date().toISOString();

      // Check for existing goal for this student + group
      const existing = await db.studentGoals
        .where('student_id')
        .equals(goal.student_id)
        .toArray();
      const match = existing.find((g) => g.group_id === goal.group_id);

      if (match && match.id !== undefined) {
        await db.studentGoals.update(match.id, {
          ...goal,
          updated_at: now,
        });
      } else {
        await db.studentGoals.add({
          ...goal,
          created_at: now,
          updated_at: now,
        } as LocalStudentGoal);
      }

      // Refresh goals for this group
      const goals = await db.studentGoals
        .where('group_id')
        .equals(goal.group_id)
        .toArray();
      set({ goals });
    } catch (error) {
      console.error('Failed to set goal:', error);
    }
  },

  setBulkGoals: async (goals: LocalStudentGoalInsert[]) => {
    if (goals.length === 0) return;

    try {
      const now = new Date().toISOString();
      const groupId = goals[0].group_id;

      for (const goal of goals) {
        const existing = await db.studentGoals
          .where('student_id')
          .equals(goal.student_id)
          .toArray();
        const match = existing.find((g) => g.group_id === goal.group_id);

        if (match && match.id !== undefined) {
          await db.studentGoals.update(match.id, {
            ...goal,
            updated_at: now,
          });
        } else {
          await db.studentGoals.add({
            ...goal,
            created_at: now,
            updated_at: now,
          } as LocalStudentGoal);
        }
      }

      // Refresh goals for this group
      const updatedGoals = await db.studentGoals
        .where('group_id')
        .equals(groupId)
        .toArray();
      set({ goals: updatedGoals });
    } catch (error) {
      console.error('Failed to set bulk goals:', error);
    }
  },

  deleteGoal: async (id: number) => {
    try {
      const goal = await db.studentGoals.get(id);
      await db.studentGoals.delete(id);

      if (goal) {
        const goals = await db.studentGoals
          .where('group_id')
          .equals(goal.group_id)
          .toArray();
        set({ goals });
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  },
}));
