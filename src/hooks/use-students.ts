'use client';

import { useEffect, useCallback, useState } from 'react';
import { useStudentsStore } from '@/stores/students';
import { useGroupsStore } from '@/stores/groups';
import { checkInterventionConflictWithOwner } from '@/lib/supabase/student-assignments';
import { useAuthStore } from '@/stores/auth';
import type { StudentInsert, StudentUpdate, Curriculum } from '@/lib/supabase/types';

export interface InterventionConflict {
  hasConflict: boolean;
  conflictingGroupName?: string;
  ownerName?: string;
  isSameOwner?: boolean;
  errorMessage?: string;
}

export function useStudents(groupId: string) {
  const students = useStudentsStore((state) => state.students);
  const isLoading = useStudentsStore((state) => state.isLoading);
  const error = useStudentsStore((state) => state.error);
  const fetchStudentsForGroup = useStudentsStore((state) => state.fetchStudentsForGroup);
  const createStudent = useStudentsStore((state) => state.createStudent);
  const updateStudentStore = useStudentsStore((state) => state.updateStudent);
  const deleteStudentStore = useStudentsStore((state) => state.deleteStudent);
  const clearError = useStudentsStore((state) => state.clearError);

  const { selectedGroup } = useGroupsStore();
  const { user } = useAuthStore();

  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      fetchStudentsForGroup(groupId);
    }
  }, [groupId, fetchStudentsForGroup]);

  /**
   * Check if adding a student to this group would cause an intervention conflict
   * (student already in another group with the same curriculum)
   */
  const checkConflict = useCallback(
    async (studentId: string): Promise<InterventionConflict> => {
      if (!selectedGroup || !user) {
        return { hasConflict: false };
      }

      try {
        const result = await checkInterventionConflictWithOwner(
          studentId,
          selectedGroup.curriculum,
          user.id,
          groupId // Exclude current group
        );

        if (result.hasConflict) {
          let errorMessage: string;
          if (result.isSameOwner) {
            errorMessage = `This student is already in your ${getCurriculumLabel(selectedGroup.curriculum)} group: ${result.conflictingGroupName}`;
          } else {
            errorMessage = `This student is already receiving ${getCurriculumLabel(selectedGroup.curriculum)} intervention from ${result.ownerName || 'another staff member'}. Cannot add to avoid duplication.`;
          }
          return {
            hasConflict: true,
            conflictingGroupName: result.conflictingGroupName,
            ownerName: result.ownerName,
            isSameOwner: result.isSameOwner,
            errorMessage,
          };
        }

        return { hasConflict: false };
      } catch (err) {
        console.error('Error checking intervention conflict:', err);
        return { hasConflict: false };
      }
    },
    [selectedGroup, user, groupId]
  );

  const addStudent = useCallback(
    async (data: Omit<StudentInsert, 'group_id'>) => {
      setConflictError(null);
      return createStudent({
        ...data,
        group_id: groupId,
      });
    },
    [groupId, createStudent]
  );

  /**
   * Add a student to this group with intervention conflict checking
   * Returns the created student if successful, or null if there was a conflict
   */
  const addStudentWithConflictCheck = useCallback(
    async (studentId: string, data: Omit<StudentInsert, 'group_id'>): Promise<{ success: boolean; error?: string }> => {
      setConflictError(null);

      // Check for intervention conflict
      const conflict = await checkConflict(studentId);
      if (conflict.hasConflict) {
        setConflictError(conflict.errorMessage || 'Intervention conflict detected');
        return { success: false, error: conflict.errorMessage };
      }

      // No conflict, proceed with adding
      const result = await createStudent({
        ...data,
        group_id: groupId,
      });

      return { success: !!result };
    },
    [groupId, createStudent, checkConflict]
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

  const clearConflictError = useCallback(() => {
    setConflictError(null);
  }, []);

  return {
    students,
    isLoading,
    error: error || conflictError,
    addStudent,
    addStudentWithConflictCheck,
    checkConflict,
    updateStudent,
    deleteStudent,
    clearError: () => {
      clearError();
      clearConflictError();
    },
    refetch: () => fetchStudentsForGroup(groupId),
  };
}

// Helper function
function getCurriculumLabel(curriculum: Curriculum): string {
  const labels: Record<Curriculum, string> = {
    wilson: 'Wilson Reading System',
    delta_math: 'Delta Math',
    camino: 'Camino a la Lectura',
    wordgen: 'WordGen',
    amira: 'Amira Learning',
    despegando: 'Despegando (Spanish)',
  };
  return labels[curriculum] || curriculum;
}
