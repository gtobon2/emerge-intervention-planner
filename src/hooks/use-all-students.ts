'use client';

import { useEffect, useCallback } from 'react';
import { useStudentsStore } from '@/stores/students';
import { useGroupsStore } from '@/stores/groups';
import type { Student, Group } from '@/lib/supabase/types';

export interface StudentWithGroup extends Student {
  group: Group | null;
}

export function useAllStudents() {
  const allStudents = useStudentsStore((state) => state.allStudents);
  const isLoadingStudents = useStudentsStore((state) => state.isLoading);
  const error = useStudentsStore((state) => state.error);
  const fetchAllStudents = useStudentsStore((state) => state.fetchAllStudents);
  const clearError = useStudentsStore((state) => state.clearError);

  const groups = useGroupsStore((state) => state.groups);
  const isLoadingGroups = useGroupsStore((state) => state.isLoading);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);

  useEffect(() => {
    fetchAllStudents();
    fetchGroups();
  }, [fetchAllStudents, fetchGroups]);

  // Enrich students with group information
  const studentsWithGroups: StudentWithGroup[] = allStudents.map((student) => ({
    ...student,
    group: groups.find((g) => g.id === student.group_id) || null,
  }));

  const isLoading = isLoadingStudents || isLoadingGroups;

  return {
    students: studentsWithGroups,
    isLoading,
    error,
    clearError,
    refetch: () => {
      fetchAllStudents();
      fetchGroups();
    },
  };
}
