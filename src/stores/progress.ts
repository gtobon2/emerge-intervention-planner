import { create } from 'zustand';
import { db } from '@/lib/local-db';
import {
  createProgressRecord,
  updateProgressRecord as updateProgressRecordDB,
  deleteProgressRecord as deleteProgressRecordDB
} from '@/lib/local-db/hooks';
import { validateProgressMonitoring } from '@/lib/supabase/validation';
import type {
  LocalProgressMonitoring,
  LocalProgressMonitoringInsert,
  LocalStudent,
} from '@/lib/local-db';
import type {
  ProgressMonitoring,
  ProgressMonitoringInsert,
  ProgressMonitoringWithStudent,
} from '@/lib/supabase/types';

// Map LocalProgressMonitoring to ProgressMonitoring
function mapLocalToProgress(local: LocalProgressMonitoring): ProgressMonitoring {
  return {
    ...local,
    id: String(local.id),
    group_id: String(local.group_id),
    student_id: local.student_id !== null ? String(local.student_id) : null,
  } as ProgressMonitoring;
}

// Map with student
function mapLocalToProgressWithStudent(
  local: LocalProgressMonitoring,
  student: LocalStudent | null
): ProgressMonitoringWithStudent {
  return {
    ...mapLocalToProgress(local),
    student: student ? {
      ...student,
      id: String(student.id),
      group_id: String(student.group_id),
    } as any : null,
  } as ProgressMonitoringWithStudent;
}

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
      const numericGroupId = parseInt(groupId, 10);
      if (isNaN(numericGroupId)) {
        throw new Error('Invalid group ID');
      }

      const localData = await db.progressMonitoring
        .where('group_id')
        .equals(numericGroupId)
        .sortBy('date');

      // Fetch students for the data with student info
      const dataWithStudents: ProgressMonitoringWithStudent[] = [];
      for (const pm of localData) {
        let student: LocalStudent | null = null;
        if (pm.student_id !== null) {
          student = (await db.students.get(pm.student_id)) || null;
        }
        dataWithStudents.push(mapLocalToProgressWithStudent(pm, student));
      }

      const data = localData.map(mapLocalToProgress);

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
      const numericStudentId = parseInt(studentId, 10);
      if (isNaN(numericStudentId)) {
        throw new Error('Invalid student ID');
      }

      const localData = await db.progressMonitoring
        .where('student_id')
        .equals(numericStudentId)
        .sortBy('date');

      const data = localData.map(mapLocalToProgress);
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
      const numericGroupId = parseInt(dataPoint.group_id, 10);
      if (isNaN(numericGroupId)) {
        throw new Error('Invalid group ID');
      }

      const numericStudentId = dataPoint.student_id !== null
        ? parseInt(dataPoint.student_id, 10)
        : null;

      if (dataPoint.student_id !== null && (numericStudentId === null || isNaN(numericStudentId))) {
        throw new Error('Invalid student ID');
      }

      const localDataPoint: LocalProgressMonitoringInsert = {
        group_id: numericGroupId,
        student_id: numericStudentId,
        date: dataPoint.date,
        measure_type: dataPoint.measure_type,
        score: dataPoint.score,
        benchmark: dataPoint.benchmark || null,
        goal: dataPoint.goal || null,
        notes: dataPoint.notes || null,
      };

      const id = await createProgressRecord(localDataPoint);
      const newDataPoint = await db.progressMonitoring.get(id);

      if (!newDataPoint) {
        throw new Error('Failed to retrieve created progress record');
      }

      const mappedDataPoint = mapLocalToProgress(newDataPoint);

      set((state) => ({
        data: [...state.data, mappedDataPoint],
        isLoading: false,
      }));

      return mappedDataPoint;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteDataPoint: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid progress monitoring ID');
      }

      await deleteProgressRecordDB(numericId);

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
