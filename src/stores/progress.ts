// @ts-nocheck
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  ProgressMonitoring,
  ProgressMonitoringInsert,
  ProgressMonitoringWithStudent,
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
      const { data, error } = await supabase
        .from('progress_monitoring')
        .select(`
          *,
          students (*)
        `)
        .eq('group_id', groupId)
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        ...item,
        student: item.students,
      }));

      set({
        data: data || [],
        dataWithStudents: formattedData,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchProgressForStudent: async (studentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('progress_monitoring')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: true });

      if (error) throw error;
      set({ data: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addDataPoint: async (dataPoint: ProgressMonitoringInsert) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('progress_monitoring')
        .insert(dataPoint)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        data: [...state.data, data],
        isLoading: false,
      }));

      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteDataPoint: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('progress_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
