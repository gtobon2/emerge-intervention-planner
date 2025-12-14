'use client';

import { useEffect, useCallback } from 'react';
import { useStudentsStore } from '@/stores/students';
import type { StudentInsert, StudentUpdate } from '@/lib/supabase/types';

export function useStudents(groupId: string) {
  const store = useStudentsStore();

  useEffect(() => {
    if (groupId) {
      store.fetchStudentsForGroup(groupId);
    }
  }, [groupId, store]);

  const addStudent = useCallback(
    async (data: Omit<StudentInsert, 'group_id'>) => {
      return store.createStudent({
        ...data,
        group_id: groupId,
      });
    },
    [groupId, store]
  );

  const updateStudent = useCallback(
    async (id: string, data: StudentUpdate) => {
      await store.updateStudent(id, data);
      return true;
    },
    [store]
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      await store.deleteStudent(id);
      return true;
    },
    [store]
  );

  return {
    students: store.students,
    isLoading: store.isLoading,
    error: store.error,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError: store.clearError,
    refetch: () => store.fetchStudentsForGroup(groupId),
  };
}
