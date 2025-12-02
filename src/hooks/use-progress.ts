'use client';

import { useEffect, useMemo } from 'react';
import { useProgressStore, checkDecisionRules, calculateTrendLine } from '@/stores/progress';
import type { ProgressMonitoringInsert } from '@/lib/supabase/types';

export function useProgress(groupId: string | undefined) {
  const store = useProgressStore();

  useEffect(() => {
    if (groupId) {
      store.fetchProgressForGroup(groupId);
    }
  }, [groupId, store]);

  // Calculate trend line
  const trendLine = useMemo(() => {
    return calculateTrendLine(store.data);
  }, [store.data]);

  // Check decision rules
  const decisionRule = useMemo(() => {
    const goal = store.data[0]?.goal;
    if (goal) {
      return checkDecisionRules(store.data, goal);
    }
    return null;
  }, [store.data]);

  return {
    data: store.data,
    dataWithStudents: store.dataWithStudents,
    isLoading: store.isLoading,
    error: store.error,
    refetch: () => groupId && store.fetchProgressForGroup(groupId),
    addDataPoint: store.addDataPoint,
    deleteDataPoint: store.deleteDataPoint,
    trendLine,
    decisionRule,
  };
}

export function useStudentProgress(studentId: string | undefined) {
  const store = useProgressStore();

  useEffect(() => {
    if (studentId) {
      store.fetchProgressForStudent(studentId);
    }
  }, [studentId, store]);

  return {
    data: store.data,
    isLoading: store.isLoading,
    error: store.error,
    refetch: () => studentId && store.fetchProgressForStudent(studentId),
  };
}
