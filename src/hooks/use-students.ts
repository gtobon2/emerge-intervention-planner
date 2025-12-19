'use client';

import { useEffect, useCallback } from 'react';
import { useStudentsStore } from '@/stores/students';
import type { StudentInsert, StudentUpdate } from '@/lib/supabase/types';

export function useStudents(groupId: string) {
  const students = useStudentsStore((state) => state.students);
  const isLoading = useStudentsStore((state) => state.isLoading);
  const error = useStudentsStore((state) => state.error);
  const fetchStudentsForGroup = useStudentsStore((state) => state.fetchStudentsForGroup);
  const createStudent = useStudentsStore((state) => state.createStudent);
  const updateStudentStore = useStudentsStore((state) => state.updateStudent);
  const deleteStudentStore = useStudentsStore((state) => state.deleteStudent);
  const clearError = useStudentsStore((state) => state.clearError);

  useEffect(() => {
    if (groupId) {
      fetchStudentsForGroup(groupId);
    }
  }, [groupId, fetchStudentsForGroup]);

  const addStudent = useCallback(
    async (data: Omit<StudentInsert, 'group_id'>) => {
      return createStudent({
        ...data,
        group_id: groupId,
      });
    },
    [groupId, createStudent]
  );

  const updateStudent = useCallback(
    async (id: string, data: StudentUpdate) => {
      await updateStudentStore(id, data);
      return true;
    },
    [updateStudentStore]
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      await deleteStudentStore(id);
      return true;
    },
    [deleteStudentStore]
  );

  return {
    students,
    isLoading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError,
    refetch: () => fetchStudentsForGroup(groupId),
  };
}
