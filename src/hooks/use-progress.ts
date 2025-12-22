'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useProgressStore, checkDecisionRules, calculateTrendLine } from '@/stores/progress';
import type { ProgressMonitoringInsert } from '@/lib/supabase/types';

export function useProgress(groupId: string | undefined) {
  // Use selectors to avoid infinite re-render loop
  const data = useProgressStore((state) => state.data);
  const dataWithStudents = useProgressStore((state) => state.dataWithStudents);
  const isLoading = useProgressStore((state) => state.isLoading);
  const error = useProgressStore((state) => state.error);
  const fetchProgressForGroup = useProgressStore((state) => state.fetchProgressForGroup);
  const addDataPoint = useProgressStore((state) => state.addDataPoint);
  const deleteDataPoint = useProgressStore((state) => state.deleteDataPoint);

  useEffect(() => {
    if (groupId) {
      fetchProgressForGroup(groupId);
    }
  }, [groupId, fetchProgressForGroup]);

  // Calculate trend line
  const trendLine = useMemo(() => {
    return calculateTrendLine(data);
  }, [data]);

  // Check decision rules
  const decisionRule = useMemo(() => {
    const goal = data[0]?.goal;
    if (goal) {
      return checkDecisionRules(data, goal);
    }
    return null;
  }, [data]);

  const refetch = useCallback(() => {
    if (groupId) {
      fetchProgressForGroup(groupId);
    }
  }, [groupId, fetchProgressForGroup]);

  return {
    data,
    dataWithStudents,
    isLoading,
    error,
    refetch,
    addDataPoint,
    deleteDataPoint,
    trendLine,
    decisionRule,
  };
}

export function useStudentProgress(studentId: string | undefined) {
  // Use selectors to avoid infinite re-render loop
  const data = useProgressStore((state) => state.data);
  const isLoading = useProgressStore((state) => state.isLoading);
  const error = useProgressStore((state) => state.error);
  const fetchProgressForStudent = useProgressStore((state) => state.fetchProgressForStudent);

  useEffect(() => {
    if (studentId) {
      fetchProgressForStudent(studentId);
    }
  }, [studentId, fetchProgressForStudent]);

  const refetch = useCallback(() => {
    if (studentId) {
      fetchProgressForStudent(studentId);
    }
  }, [studentId, fetchProgressForStudent]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
