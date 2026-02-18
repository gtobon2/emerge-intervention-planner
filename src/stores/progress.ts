import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import { validateProgressMonitoring } from '@/lib/supabase/validation';
import type {
  ProgressMonitoring,
  ProgressMonitoringInsert,
  ProgressMonitoringWithStudent,
  Student,
} from '@/lib/supabase/types';

interface ProgressState {
  data: ProgressMonitoring[];
  dataWithStudents: ProgressMonitoringWithStudent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProgressForGroup: (groupId: string) => Promise<void>;
  fetchProgressForStudent: (studentId: string) => Promise<void>;
  addDataPoint: (dataPoint: ProgressMonitoringInsert) => Promise<ProgressMonitoring | null>;
  deleteDataPoint: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  data: [],
  dataWithStudents: [],
  isLoading: false,
  error: null,

  fetchProgressForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await supabaseService.fetchProgressByGroupId(groupId);

      // Fetch students for the group to build dataWithStudents
      const students = await supabaseService.fetchStudentsByGroupId(groupId);
      const studentMap = new Map(students.map(s => [s.id, s]));

      const dataWithStudents: ProgressMonitoringWithStudent[] = data.map(pm => ({
        ...pm,
        student: pm.student_id ? studentMap.get(pm.student_id) || null : null,
      }));

      set({
        data,
        dataWithStudents,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        data: [],
        dataWithStudents: []
      });
    }
  },

  fetchProgressForStudent: async (studentId: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await supabaseService.fetchProgressByStudentId(studentId);
      set({ data, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        data: []
      });
    }
  },

  addDataPoint: async (dataPoint: ProgressMonitoringInsert) => {
    set({ isLoading: true, error: null });

    // Validate progress monitoring data
    const validation = validateProgressMonitoring(dataPoint);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    try {
      const newDataPoint = await supabaseService.createProgressMonitoring(dataPoint);

      set((state) => {
        // Find the student from existing dataWithStudents entries
        const existingEntry = state.dataWithStudents.find(
          (d) => d.student_id === newDataPoint.student_id && d.student
        );
        const student = existingEntry?.student || null;

        return {
          data: [...state.data, newDataPoint],
          dataWithStudents: [...state.dataWithStudents, { ...newDataPoint, student }],
          isLoading: false,
        };
      });

      return newDataPoint;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteDataPoint: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await supabaseService.deleteProgressMonitoring(id);

      set((state) => ({
        data: state.data.filter((d) => d.id !== id),
        dataWithStudents: state.dataWithStudents.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Decision rule helpers
export interface DecisionRuleResult {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  consecutivePoints: number;
}

export function checkDecisionRules(
  data: ProgressMonitoring[],
  goal: number
): DecisionRuleResult | null {
  if (data.length < 4) return null;

  const recentData = data.slice(-4);
  const belowGoal = recentData.filter((d) => d.score < goal);
  const aboveGoal = recentData.filter((d) => d.score >= goal);

  // 4 consecutive points below aimline - consider intervention change
  if (belowGoal.length === 4) {
    return {
      type: 'negative',
      message: '4 consecutive points below goal. Consider adjusting intervention.',
      consecutivePoints: 4,
    };
  }

  // 4 consecutive points above aimline - consider raising goal
  if (aboveGoal.length === 4) {
    return {
      type: 'positive',
      message: '4 consecutive points above goal. Consider raising the goal.',
      consecutivePoints: 4,
    };
  }

  return null;
}

// Calculate trend line using linear regression
export function calculateTrendLine(
  data: ProgressMonitoring[]
): { slope: number; intercept: number } | null {
  if (data.length < 2) return null;

  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((point, i) => {
    sumX += i;
    sumY += point.score;
    sumXY += i * point.score;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}
